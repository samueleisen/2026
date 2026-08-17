// hairphysic.js
//"A lightweight Verlet physics system that drives 3 dynamic bone chains of any length, 
// mapping simulated particle positions back into bone quaternion rotations with sphere and capsule collisions."

// Verlet integration hair physics for GLB bone chains.
// Simulates depth 3+ hair bones with gravity + collision while keeping depth ≤ 2 untouched.

import * as THREE from 'three';
import { HairColliderHelper } from './hair-herlper.js';

export { HairColliderHelper };

// ==========================================
// Module-level reusable temporaries (avoid GC in hot loop)
// _worldPos / _worldDir / _localDir / _up are truly stateless across chains
// so they remain at module scope. Quaternion accumulators (_parentWorldQuat,
// _invParentQuat) are now per-chain instance fields (see HairChain ctor)
// to eliminate shared-singleton mutation risk.
// ==========================================
const _worldPos = new THREE.Vector3();
const _worldDir = new THREE.Vector3();
const _localDir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
// Temporaries for rotation-aware collider offset computation
const _headQuat = new THREE.Quaternion();
const _offsetVec = new THREE.Vector3();

// ==========================================
// Verlet Particle
// ==========================================
class Particle {
    constructor(x, y, z, isPinned = false) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.oldX = x;
        this.oldY = y;
        this.oldZ = z;
        this.isPinned = isPinned;
        this.invMass = isPinned ? 0 : 1;
    }

    // NOTE: Particle.update() has been intentionally removed.
    // Integration is now performed inline inside HairPhysics._stepSimulation()
    // where dtSq is precomputed once per step rather than once per particle.
}

// ==========================================
// Distance Constraint (positional projection)
// ==========================================
class DistanceConstraint {
    constructor(p1, p2, distance) {
        this.p1 = p1;
        this.p2 = p2;
        this.distance = distance;
    }

    solve() {
        const dx = this.p2.x - this.p1.x;
        const dy = this.p2.y - this.p1.y;
        const dz = this.p2.z - this.p1.z;

        const currentDist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001;
        const diff = (currentDist - this.distance) / currentDist;

        const totalInvMass = this.p1.invMass + this.p2.invMass;
        if (totalInvMass === 0) return;

        // p1Share / p2Share are already 0 for pinned particles (invMass = 0),
        // so these additions are mathematical no-ops — no explicit isPinned guard needed.
        const p1Share = this.p1.invMass / totalInvMass;
        const p2Share = this.p2.invMass / totalInvMass;

        this.p1.x += dx * diff * p1Share;
        this.p1.y += dy * diff * p1Share;
        this.p1.z += dz * diff * p1Share;

        this.p2.x -= dx * diff * p2Share;
        this.p2.y -= dy * diff * p2Share;
        this.p2.z -= dz * diff * p2Share;
    }
}

// ==========================================
// Hair Chain — one per strand (chair, lhair, rhair)
// ==========================================
class HairChain {
    /**
     * @param {THREE.Bone} anchorBone  - The depth-2 bone (e.g. chair2). Read-only, never modified.
     * @param {THREE.Bone[]} physicsBones - Depth 3+ bones [chair3, chair4, ...]. We set their quaternions.
     */
    constructor(anchorBone, physicsBones) {
        this.anchorBone = anchorBone;
        this.physicsBones = physicsBones;
        this.particles = [];
        this.constraints = [];

        // FIX #3: Per-chain quaternion temporaries — eliminates shared module-level
        // singleton mutation. Safe even if multiple HairChain instances exist.
        this._parentWorldQuat = new THREE.Quaternion();
        this._invParentQuat = new THREE.Quaternion();

        this._initFromBones();
    }

    _initFromBones() {
        // Particle 0: pinned at first physics bone's world position
        // (Its position is fixed by the untouched parent chain)
        this.physicsBones[0].getWorldPosition(_worldPos);
        this.particles.push(new Particle(_worldPos.x, _worldPos.y, _worldPos.z, true));

        // Free particles for remaining physics bones
        for (let i = 1; i < this.physicsBones.length; i++) {
            this.physicsBones[i].getWorldPosition(_worldPos);
            this.particles.push(new Particle(_worldPos.x, _worldPos.y, _worldPos.z, false));
        }

        // Distance constraints: use WORLD-SPACE distances between particles at rest pose.
        // NOTE: bone.json childDistance is in unscaled local space; the model may have
        // an armature scale (e.g. 0.45x), so we compute rest distances directly from
        // the actual world positions to avoid scale mismatch.
        for (let i = 0; i < this.particles.length - 1; i++) {
            const p1 = this.particles[i];
            const p2 = this.particles[i + 1];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dz = p2.z - p1.z;
            const restDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (restDist > 0.0001) {
                this.constraints.push(new DistanceConstraint(p1, p2, restDist));
            }
        }
    }

    /**
     * Sync the pinned (root) particle toward the first physics bone's world position.
     *
     * @param {number} inertia - [0–1] How slowly the root follows the bone.
     *   0 = hard-snap (original behaviour).
     *   0.3–0.6 = smooth lag making the chain feel less reactive / stiffer.
     *
     * When inertia > 0 the root particle is lerped toward the target each step,
     * carrying velocity (oldPos ≠ newPos) into the constraint system so the
     * whole chain responds to root motion proportionally rather than all at once.
     *
     * Safety: if the target is more than 0.5 world-units away (e.g. on respawn
     * or large jump), we hard-snap to avoid the hair floating mid-air.
     */
    updatePinnedParticle(inertia = 0) {
        this.physicsBones[0].getWorldPosition(_worldPos);
        const p = this.particles[0];

        if (inertia > 0) {
            const dx = _worldPos.x - p.x;
            const dy = _worldPos.y - p.y;
            const dz = _worldPos.z - p.z;
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq > 0.25) {
                // Bone moved too far in one step (teleport / large jump) — snap immediately
                // so the chain doesn’t visibly drift in empty air.
                p.x = p.oldX = _worldPos.x;
                p.y = p.oldY = _worldPos.y;
                p.z = p.oldZ = _worldPos.z;
            } else {
                // Lerp the pin toward the bone.
                // Preserve old position so the constraint system sees a real velocity.
                p.oldX = p.x;
                p.oldY = p.y;
                p.oldZ = p.z;

                const alpha = 1.0 - inertia;  // inertia=0.7 → alpha=0.3 (30 % per step)
                p.x += dx * alpha;
                p.y += dy * alpha;
                p.z += dz * alpha;
            }
        } else {
            // inertia = 0: original hard-snap, zero velocity on pinned particle.
            p.x = p.oldX = _worldPos.x;
            p.y = p.oldY = _worldPos.y;
            p.z = p.oldZ = _worldPos.z;
        }
    }

    /**
     * Write particle world positions back as bone quaternion rotations.
     *
     * For each physics bone, compute the direction from its particle to the next
     * particle (world space), convert to the parent bone's local space, and set
     * the bone's quaternion to rotate local Y-axis to that direction.
     * We accumulate the parent world quaternion manually to avoid needing
     * matrix updates between bones.
     */
    writeBack() {
        // Start with the anchor bone's (depth-2) world quaternion.
        // Uses per-chain instance quaternions (FIX #3) instead of shared module singletons.
        this.anchorBone.getWorldQuaternion(this._parentWorldQuat);

        for (let i = 0; i < this.physicsBones.length; i++) {
            const bone = this.physicsBones[i];
            const p = this.particles[i];

            // Direction to next particle (or reuse last direction for leaf bone)
            if (i < this.particles.length - 1) {
                const pNext = this.particles[i + 1];
                _worldDir.set(
                    pNext.x - p.x,
                    pNext.y - p.y,
                    pNext.z - p.z
                );
                const len = _worldDir.length();
                if (len < 0.0001) {
                    // Degenerate — accumulate with identity and skip
                    this._parentWorldQuat.multiply(bone.quaternion);
                    continue;
                }
                _worldDir.divideScalar(len);
            }
            // else: leaf bone keeps _worldDir from previous iteration

            // Convert world direction to parent bone's local space
            this._invParentQuat.copy(this._parentWorldQuat).invert();
            _localDir.copy(_worldDir).applyQuaternion(this._invParentQuat);

            // Quaternion that rotates local Y-axis to this direction
            bone.quaternion.setFromUnitVectors(_up, _localDir);

            // Accumulate world quaternion for next bone in chain
            // next parent world quat = current parent world quat × this bone's local quat
            this._parentWorldQuat.multiply(bone.quaternion);
        }
    }
}

// ==========================================
// HairPhysics — main manager (exported)
// ==========================================
export class HairPhysics {
    constructor() {
        this.chains = [];
        this.config = {
            gravity: -9.8,
            // damping [0 – 1]: velocity retention multiplier per frame (Verlet drag).
            //   0.98 = low drag / more wobble / oscillations linger
            //   0.92 = higher drag / settles quickly / less bounce and wobble
            //   0.85 = very stiff air resistance / heavy viscous drag
            damping: 0.94,
            substeps: 10,
            // inertia [0 – 1]: how sluggishly the pinned root follows the head bone.
            //   0.0 = instant hard-snap (original behaviour)
            //   0.3 = light smoothing — good starting point
            //   0.7 = heavy lag, hair feels stiff / slow to react
            // Note: values above ~0.8 can make the root visibly detach from the scalp.
            inertia: 0.55,
        };

        // Collision shapes (world-space offsets from head bone)
        // Tuned for test003rigged.glb (armature scale ~0.45)
        this.colliderConfig = {
            headSphere: {
                offset: { x: 0, y: 0.2, z: 0 },
                radius: 0.3,
            },
            bodyCapsule: {
                topOffset: { x: 0, y: 0.05, z: 0.03 },
                bottomOffset: { x: 0, y: -0.75, z: 0.03 },
                radius: 0.3,
            },
            // Horizontal arm capsules — T-pose shoulder-to-forearm segments.
            // Offsets are in head-bone LOCAL space and rotate with the character.
            // Positive local X = character's right in rest/T-pose.
            leftArmCapsule: {
                innerOffset: { x: -0.25, y: -0.15, z: 0.0 },
                outerOffset: { x: -0.75, y: -0.15, z: 0.0 },
                radius: 0.15,
            },
            rightArmCapsule: {
                innerOffset: { x: 0.25, y: -0.15, z: 0.0 },
                outerOffset: { x: 0.75, y: -0.15, z: 0.0 },
                radius: 0.15,
            },
        };

        // Runtime collider state (world-space positions, updated each frame)
        // All capsule objects share the precomputed-axis structure:
        //   ax/ay/az = start point, bx/by/bz = end point
        //   abx/aby/abz = axis vector (b - a), abLenSq = |ab|², rSq = radius²
        this._headBone = null;
        this._headSphere = { cx: 0, cy: 0, cz: 0, radius: 0, rSq: 0 };
        this._bodyCapsule = { ax: 0, ay: 0, az: 0, bx: 0, by: 0, bz: 0, radius: 0, abx: 0, aby: 0, abz: 0, abLenSq: 0, rSq: 0 };
        this._leftArmCapsule = { ax: 0, ay: 0, az: 0, bx: 0, by: 0, bz: 0, radius: 0, abx: 0, aby: 0, abz: 0, abLenSq: 0, rSq: 0 };
        this._rightArmCapsule = { ax: 0, ay: 0, az: 0, bx: 0, by: 0, bz: 0, radius: 0, abx: 0, aby: 0, abz: 0, abLenSq: 0, rSq: 0 };

        this.initialized = false;
        this._accumulator = 0; // Time accumulator for fixed-step integration
    }

    /** Clear all chains and mark as uninitialized. */
    reset() {
        this.chains = [];
        this._headBone = null;
        this.initialized = false;
        this._accumulator = 0;
    }

    /**
     * Initialize hair physics from a loaded GLTF scene and bone.json data.
     * @param {THREE.Object3D} gltfScene - The loaded GLTF scene root.
     * @param {Array} boneJsonData - Parsed bone.json array (kept for future use).
     */
    init(gltfScene, boneJsonData) {
        this.chains = [];

        // Chain definitions:
        //   anchor = depth-2 bone (untouched, provides pinned position)
        //   physics = depth 3 through end (bones we simulate)
        const chainDefs = [
            // Center back hair
            { prefix: 'chair', anchor: 'chair2', start: 3, end: 8 },
            // Left/right side center hair (new in test003)
            { prefix: 'lchair', anchor: 'lchair2', start: 3, end: 8 },
            { prefix: 'rchair', anchor: 'rchair2', start: 3, end: 8 },
            // Left/right outer hair
            { prefix: 'lhair', anchor: 'lhair2', start: 3, end: 9 },
            { prefix: 'rhair', anchor: 'rhair2', start: 3, end: 9 },
        ];

        // Collect all bones from the scene graph
        const sceneBones = {};
        gltfScene.traverse(node => {
            if (node.isBone) {
                sceneBones[node.name] = node;
            }
        });

        // Find head bone for collision
        this._headBone = sceneBones['head'] || null;
        if (!this._headBone) {
            console.warn('[HairPhysics] Head bone not found — collisions disabled.');
        }

        // Ensure world matrices are current before reading rest positions
        gltfScene.updateMatrixWorld(true);

        for (const def of chainDefs) {
            const anchorBone = sceneBones[def.anchor];
            if (!anchorBone) {
                console.warn(`[HairPhysics] Anchor bone '${def.anchor}' not found, skipping chain.`);
                continue;
            }

            const physicsBones = [];
            for (let i = def.start; i <= def.end; i++) {
                const name = def.prefix + i;
                const bone = sceneBones[name];
                if (bone) {
                    physicsBones.push(bone);
                } else {
                    console.warn(`[HairPhysics] Bone '${name}' not found, chain truncated.`);
                    break;
                }
            }

            if (physicsBones.length < 2) {
                console.warn(`[HairPhysics] Chain '${def.prefix}' needs ≥2 physics bones, skipping.`);
                continue;
            }

            this.chains.push(new HairChain(anchorBone, physicsBones));
        }

        // Initialize collider positions
        this._updateColliders();

        this.initialized = this.chains.length > 0;
        console.log(`[HairPhysics] Initialized ${this.chains.length} hair chains ` +
            `(${this.chains.reduce((s, c) => s + c.particles.length, 0)} total particles). ` +
            `Collisions: ${this._headBone ? 'ON' : 'OFF'}`);
    }

    // ------------------------------------------
    // Collision system
    // ------------------------------------------

    /**
     * Update collider world positions from head bone.
     * Offsets are rotated by the head bone's world quaternion so the colliders
     * always follow the character's facing direction rather than being fixed in
     * world-space cardinal directions.
     */
    _updateColliders() {
        if (!this._headBone) return;

        this._headBone.getWorldPosition(_worldPos);
        const hx = _worldPos.x;
        const hy = _worldPos.y;
        const hz = _worldPos.z;

        // Get head bone world rotation — used to rotate local offsets into world space
        this._headBone.getWorldQuaternion(_headQuat);

        // Head sphere — rotate local offset by head bone orientation
        const hs = this.colliderConfig.headSphere;
        _offsetVec.set(hs.offset.x, hs.offset.y, hs.offset.z).applyQuaternion(_headQuat);
        this._headSphere.cx = hx + _offsetVec.x;
        this._headSphere.cy = hy + _offsetVec.y;
        this._headSphere.cz = hz + _offsetVec.z;
        this._headSphere.radius = hs.radius;
        this._headSphere.rSq = hs.radius * hs.radius;

        // Body capsule — rotate both endpoint offsets by head bone orientation
        const bc = this.colliderConfig.bodyCapsule;
        _offsetVec.set(bc.topOffset.x, bc.topOffset.y, bc.topOffset.z).applyQuaternion(_headQuat);
        this._bodyCapsule.ax = hx + _offsetVec.x;
        this._bodyCapsule.ay = hy + _offsetVec.y;
        this._bodyCapsule.az = hz + _offsetVec.z;
        _offsetVec.set(bc.bottomOffset.x, bc.bottomOffset.y, bc.bottomOffset.z).applyQuaternion(_headQuat);
        this._bodyCapsule.bx = hx + _offsetVec.x;
        this._bodyCapsule.by = hy + _offsetVec.y;
        this._bodyCapsule.bz = hz + _offsetVec.z;
        this._bodyCapsule.radius = bc.radius;
        this._bodyCapsule.rSq = bc.radius * bc.radius;
        this._bodyCapsule.abx = this._bodyCapsule.bx - this._bodyCapsule.ax;
        this._bodyCapsule.aby = this._bodyCapsule.by - this._bodyCapsule.ay;
        this._bodyCapsule.abz = this._bodyCapsule.bz - this._bodyCapsule.az;
        this._bodyCapsule.abLenSq = this._bodyCapsule.abx * this._bodyCapsule.abx
            + this._bodyCapsule.aby * this._bodyCapsule.aby
            + this._bodyCapsule.abz * this._bodyCapsule.abz;

        // Left arm capsule — shoulder (inner) to forearm (outer), local -X side
        this._fillCapsuleState(this.colliderConfig.leftArmCapsule, this._leftArmCapsule, hx, hy, hz);
        // Right arm capsule — mirror on local +X side
        this._fillCapsuleState(this.colliderConfig.rightArmCapsule, this._rightArmCapsule, hx, hy, hz);
    }

    /**
     * Shared helper: rotate inner/outer offsets by _headQuat and write world-space
     * positions + precomputed axis into a runtime capsule state object.
     * @param {{ innerOffset, outerOffset, radius }} cfg  - Config entry from colliderConfig
     * @param {{ ax,ay,az,bx,by,bz,... }}           state - Runtime state object to write
     * @param {number} hx - Head bone world X
     * @param {number} hy - Head bone world Y
     * @param {number} hz - Head bone world Z
     */
    _fillCapsuleState(cfg, state, hx, hy, hz) {
        _offsetVec.set(cfg.innerOffset.x, cfg.innerOffset.y, cfg.innerOffset.z).applyQuaternion(_headQuat);
        state.ax = hx + _offsetVec.x;
        state.ay = hy + _offsetVec.y;
        state.az = hz + _offsetVec.z;
        _offsetVec.set(cfg.outerOffset.x, cfg.outerOffset.y, cfg.outerOffset.z).applyQuaternion(_headQuat);
        state.bx = hx + _offsetVec.x;
        state.by = hy + _offsetVec.y;
        state.bz = hz + _offsetVec.z;
        state.radius = cfg.radius;
        state.rSq = cfg.radius * cfg.radius;
        state.abx = state.bx - state.ax;
        state.aby = state.by - state.ay;
        state.abz = state.bz - state.az;
        state.abLenSq = state.abx * state.abx + state.aby * state.aby + state.abz * state.abz;
    }

    /**
     * Push a particle outside all collision shapes.
     * Reads precomputed capsule axis / rSq values from _updateColliders() — FIX #4.
     * The single this._headBone guard is checked once up front — FIX #7.
     */
    _resolveCollisions(p) {
        if (!this._headBone) return;

        // --- Head sphere collision ---
        const s = this._headSphere;
        const sdx = p.x - s.cx;
        const sdy = p.y - s.cy;
        const sdz = p.z - s.cz;
        const sDistSq = sdx * sdx + sdy * sdy + sdz * sdz;

        if (sDistSq < s.rSq && sDistSq > 0.000001) {
            // Particle is inside sphere — project to surface
            const dist = Math.sqrt(sDistSq);
            const factor = s.radius / dist;
            p.x = s.cx + sdx * factor;
            p.y = s.cy + sdy * factor;
            p.z = s.cz + sdz * factor;

            // FIX: Also project old position if inside sphere.
            // Prevents Verlet velocity from pointing back into the collider,
            // which causes jitter/bounce instead of smooth sliding.
            const odx = p.oldX - s.cx;
            const ody = p.oldY - s.cy;
            const odz = p.oldZ - s.cz;
            const oDistSq = odx * odx + ody * ody + odz * odz;
            if (oDistSq < s.rSq && oDistSq > 0.000001) {
                const oDist = Math.sqrt(oDistSq);
                const oFactor = s.radius / oDist;
                p.oldX = s.cx + odx * oFactor;
                p.oldY = s.cy + ody * oFactor;
                p.oldZ = s.cz + odz * oFactor;
            }
        }

        // --- Capsule collisions (body + arms) ---
        // Each call to _resolveCapsule handles one capsule: projection + velocity fix.
        this._resolveCapsule(p, this._bodyCapsule);
        this._resolveCapsule(p, this._leftArmCapsule);
        this._resolveCapsule(p, this._rightArmCapsule);
    }

    /**
     * Push particle p outside one capsule collider.
     * Includes old-position velocity correction (same fix as sphere) to prevent
     * phantom inward Verlet velocity causing jitter after a push.
     * @param {Particle} p   - Particle to resolve.
     * @param {object}   cap - Precomputed capsule state from _fillCapsuleState().
     */
    _resolveCapsule(p, cap) {
        // Project particle onto capsule axis, clamped to [0, 1]
        const apx = p.x - cap.ax;
        const apy = p.y - cap.ay;
        const apz = p.z - cap.az;
        let t = (apx * cap.abx + apy * cap.aby + apz * cap.abz) / (cap.abLenSq || 0.0001);
        t = Math.max(0, Math.min(1, t));

        // Closest point on capsule axis segment
        const ccx = cap.ax + cap.abx * t;
        const ccy = cap.ay + cap.aby * t;
        const ccz = cap.az + cap.abz * t;

        const cdx = p.x - ccx;
        const cdy = p.y - ccy;
        const cdz = p.z - ccz;
        const cDistSq = cdx * cdx + cdy * cdy + cdz * cdz;

        if (cDistSq < cap.rSq && cDistSq > 0.000001) {
            // Push current position to surface
            const dist = Math.sqrt(cDistSq);
            const factor = cap.radius / dist;
            p.x = ccx + cdx * factor;
            p.y = ccy + cdy * factor;
            p.z = ccz + cdz * factor;

            // Velocity correction: also push old position if inside capsule
            // so Verlet doesn't compute an inward velocity for the next frame.
            const oapx = p.oldX - cap.ax;
            const oapy = p.oldY - cap.ay;
            const oapz = p.oldZ - cap.az;
            let ot = (oapx * cap.abx + oapy * cap.aby + oapz * cap.abz) / (cap.abLenSq || 0.0001);
            ot = Math.max(0, Math.min(1, ot));
            const occx = cap.ax + cap.abx * ot;
            const occy = cap.ay + cap.aby * ot;
            const occz = cap.az + cap.abz * ot;
            const ocdx = p.oldX - occx;
            const ocdy = p.oldY - occy;
            const ocdz = p.oldZ - occz;
            const ocDistSq = ocdx * ocdx + ocdy * ocdy + ocdz * ocdz;
            if (ocDistSq < cap.rSq && ocDistSq > 0.000001) {
                const oDist = Math.sqrt(ocDistSq);
                const oFactor = cap.radius / oDist;
                p.oldX = occx + ocdx * oFactor;
                p.oldY = occy + ocdy * oFactor;
                p.oldZ = occz + ocdz * oFactor;
            }
        }
    }

    // ------------------------------------------
    // Main update loop
    // ------------------------------------------

    /**
     * Run one frame of physics simulation. Call from animate() before render.
     *
     * Uses a time accumulator to consume real elapsed time in fixed 1/60s slices,
     * ensuring simulation speed is independent of screen refresh rate.
     * A 144Hz monitor and a 30Hz device will both see identical physics behaviour.
     *
     * @param {number} dt - Real elapsed frame time (seconds) from clock.getDelta().
     */
    update(dt) {
        if (!this.initialized || dt <= 0) return;

        const fixedDT = 1 / 60;

        // Clamp dt to 100ms so a background tab or GC spike can't send the
        // accumulator (and therefore physics steps) out of control.
        this._accumulator += Math.min(dt, 0.1);

        // Update colliders once — head bone position is the same for all steps.
        this._updateColliders();

        // Consume accumulated time in fixed-size slices.
        // Each slice is one full physics step at exactly 1/60s.
        while (this._accumulator >= fixedDT) {
            this._stepSimulation(fixedDT);
            this._accumulator -= fixedDT;
        }

        // Write final bone rotations after all steps for this frame are done.
        for (const chain of this.chains) {
            chain.writeBack();
        }
    }

    /**
     * Advance the simulation by one fixed timestep.
     * Extracted from update() so the accumulator loop can call it N times.
     * @param {number} fixedDT - The fixed timestep in seconds (1/60).
     */
    _stepSimulation(fixedDT) {
        const { gravity, damping, substeps, inertia } = this.config;
        const dtSq = fixedDT * fixedDT; // Precomputed once per step, not per particle

        for (const chain of this.chains) {
            // 1. Sync pinned particle with the bone's current world position.
            //    inertia > 0 makes the root lerp instead of snap — see updatePinnedParticle().
            chain.updatePinnedParticle(inertia);

            // 2. Verlet integration: apply gravity to all free particles
            //    Start at index 1 — particle 0 is always pinned.
            for (let i = 1; i < chain.particles.length; i++) {
                const p = chain.particles[i];
                const vx = (p.x - p.oldX) * damping;
                const vy = (p.y - p.oldY) * damping;
                const vz = (p.z - p.oldZ) * damping;

                p.oldX = p.x;
                p.oldY = p.y;
                p.oldZ = p.z;

                p.x += vx;
                p.y += vy + gravity * dtSq;
                p.z += vz;
            }

            // 3. Sub-stepped constraint solving + collision
            //    Running collisions inside the substep loop ensures stable contact
            //    — constraints and collisions reinforce each other iteratively.
            for (let s = 0; s < substeps; s++) {
                for (const c of chain.constraints) {
                    c.solve();
                }
                // Collision resolution — skip index 0 (always pinned)
                for (let i = 1; i < chain.particles.length; i++) {
                    this._resolveCollisions(chain.particles[i]);
                }
            }
        }
    }

    // ------------------------------------------
    // Debug helper factory
    // ------------------------------------------

    /**
     * Create a live 3D visualizer for the collision shapes.
     * Add the returned helper's .group to your scene, then call helper.update()
     * each frame (after hairPhysics.update()).
     *
     * @returns {HairColliderHelper}
     */
    createDebugHelper() {
        return new HairColliderHelper(this);
    }

    /**
     * Convenience toggle — callers hold the helper reference directly,
     * so this is a no-op placeholder kept for API symmetry.
     */
    setDebug(_enabled) { /* callers use HairColliderHelper.setVisible() */ }
}

