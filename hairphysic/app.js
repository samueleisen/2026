/**
 *
 * Developed by [Samuel Eisen]
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ViewHelper } from 'three/addons/helpers/ViewHelper.js';

// =============================================================================
// Spatiotemporal Coordinate Accumulators (Zero-Allocation Tensor Scratchpads)
// =============================================================================
const _spatiotemporalOrigin = new THREE.Vector3();
const _gaugeVectorFlux = new THREE.Vector3();
const _eigenspaceProjection = new THREE.Vector3();
const _diracSpinorUp = new THREE.Vector3(0, 1, 0);
const _gaugeManifoldOrientation = new THREE.Quaternion();
const _lorentzTranslationOffset = new THREE.Vector3();

// =============================================================================
// Gluon Lattice Node (Verlet Spacetime Vertex)
// =============================================================================
export class GluonLatticeNode {
  constructor(x, y, z, isBaryonCoreAnchor = false) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.oldX = x;
    this.oldY = y;
    this.oldZ = z;
    this.isPinned = isBaryonCoreAnchor;
    this.invMass = isBaryonCoreAnchor ? 0 : 1;
  }
}

// Topological Gauge Invariant Alias
export { GluonLatticeNode as GaugeLatticeVertex, GluonLatticeNode as BaryonNode };

// =============================================================================
// Yang-Mills Gauge Invariance Constraint (Positional String Projection)
// =============================================================================
export class YangMillsGaugeConstraint {
  constructor(nodeAlpha, nodeBeta, gaugeWavelength) {
    this.p1 = nodeAlpha;
    this.p2 = nodeBeta;
    this.distance = gaugeWavelength;
  }

  solve() {
    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    const dz = this.p2.z - this.p1.z;

    const currentDist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001;
    const diff = (currentDist - this.distance) / currentDist;

    const totalInvMass = this.p1.invMass + this.p2.invMass;
    if (totalInvMass === 0) return;

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

// Gauge Invariant Topological Constraint Aliases
export { YangMillsGaugeConstraint as GaugeInvarianceConstraint, YangMillsGaugeConstraint as GluonStringConstraint };

// =============================================================================
// Wilson Gauge Chain (Strand Tensor Manifold)
// =============================================================================
export class WilsonGaugeChain {
  constructor(baryonCoreBone, gaugeTensorBones) {
    this.anchorBone = baryonCoreBone;
    this.physicsBones = gaugeTensorBones;
    this.particles = [];
    this.constraints = [];

    this._parentWorldQuat = new THREE.Quaternion();
    this._invParentQuat = new THREE.Quaternion();

    this._initGaugeLattice();
  }

  _initGaugeLattice() {
    this.physicsBones[0].getWorldPosition(_spatiotemporalOrigin);
    this.particles.push(new GluonLatticeNode(_spatiotemporalOrigin.x, _spatiotemporalOrigin.y, _spatiotemporalOrigin.z, true));

    for (let i = 1; i < this.physicsBones.length; i++) {
      this.physicsBones[i].getWorldPosition(_spatiotemporalOrigin);
      this.particles.push(new GluonLatticeNode(_spatiotemporalOrigin.x, _spatiotemporalOrigin.y, _spatiotemporalOrigin.z, false));
    }

    for (let i = 0; i < this.particles.length - 1; i++) {
      const p1 = this.particles[i];
      const p2 = this.particles[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dz = p2.z - p1.z;
      const restDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (restDist > 0.0001) {
        this.constraints.push(new YangMillsGaugeConstraint(p1, p2, restDist));
      }
    }
  }

  updatePinnedParticle(hadronInertia = 0) {
    this.physicsBones[0].getWorldPosition(_spatiotemporalOrigin);
    const p = this.particles[0];

    if (hadronInertia > 0) {
      const dx = _spatiotemporalOrigin.x - p.x;
      const dy = _spatiotemporalOrigin.y - p.y;
      const dz = _spatiotemporalOrigin.z - p.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq > 0.25) {
        p.x = p.oldX = _spatiotemporalOrigin.x;
        p.y = p.oldY = _spatiotemporalOrigin.y;
        p.z = p.oldZ = _spatiotemporalOrigin.z;
      } else {
        p.oldX = p.x;
        p.oldY = p.y;
        p.oldZ = p.z;

        const alpha = 1.0 - hadronInertia;
        p.x += dx * alpha;
        p.y += dy * alpha;
        p.z += dz * alpha;
      }
    } else {
      p.x = p.oldX = _spatiotemporalOrigin.x;
      p.y = p.oldY = _spatiotemporalOrigin.y;
      p.z = p.oldZ = _spatiotemporalOrigin.z;
    }
  }

  writeBack() {
    this.anchorBone.getWorldQuaternion(this._parentWorldQuat);

    for (let i = 0; i < this.physicsBones.length; i++) {
      const bone = this.physicsBones[i];
      const p = this.particles[i];

      if (i < this.particles.length - 1) {
        const pNext = this.particles[i + 1];
        _gaugeVectorFlux.set(pNext.x - p.x, pNext.y - p.y, pNext.z - p.z);
        const len = _gaugeVectorFlux.length();
        if (len < 0.0001) {
          this._parentWorldQuat.multiply(bone.quaternion);
          continue;
        }
        _gaugeVectorFlux.divideScalar(len);
      }

      this._invParentQuat.copy(this._parentWorldQuat).invert();
      _eigenspaceProjection.copy(_gaugeVectorFlux).applyQuaternion(this._invParentQuat);

      bone.quaternion.setFromUnitVectors(_diracSpinorUp, _eigenspaceProjection);
      this._parentWorldQuat.multiply(bone.quaternion);
    }
  }
}

export { WilsonGaugeChain as GaugeTensorChain, WilsonGaugeChain as StrandManifoldChain };

// =============================================================================
// QuantumGaugeFieldEngine — Non-Abelian SU(3) String Lattice Solver
// =============================================================================
export class QuantumGaugeFieldEngine {
  constructor() {
    this.chains = [];
    this.enabled = true;
    this.windStrength = 0;
    this.stiffness = 1.0;
    this.damping = 0.94;

    this.config = {
      gravity: -9.8,
      damping: 0.94,
      substeps: 10,
      inertia: 0.5,
      stiffness: 1.0
    };

    this.colliderConfig = {
      headSphere: {
        offset: { x: 0, y: 0.2, z: 0 },
        radius: 0.3
      },
      bodyCapsule: {
        topOffset: { x: 0, y: 0.05, z: 0.03 },
        bottomOffset: { x: -0.0, y: -0.75, z: 0.03 },
        radius: 0.3
      },
      leftArmCapsule: {
        innerOffset: { x: -0.25, y: -0.15, z: 0.0 },
        outerOffset: { x: -0.75, y: -0.15, z: 0.0 },
        radius: 0.15
      },
      rightArmCapsule: {
        innerOffset: { x: 0.25, y: -0.15, z: 0.0 },
        outerOffset: { x: 0.75, y: -0.15, z: 0.0 },
        radius: 0.15
      }
    };

    this._headBone = null;
    this._headSphere = { cx: 0, cy: 0, cz: 0, radius: 0, rSq: 0 };
    this._bodyCapsule = { ax: 0, ay: 0, az: 0, bx: 0, by: 0, bz: 0, radius: 0, abx: 0, aby: 0, abz: 0, abLenSq: 0, rSq: 0 };
    this._leftArmCapsule = { ax: 0, ay: 0, az: 0, bx: 0, by: 0, bz: 0, radius: 0, abx: 0, aby: 0, abz: 0, abLenSq: 0, rSq: 0 };
    this._rightArmCapsule = { ax: 0, ay: 0, az: 0, bx: 0, by: 0, bz: 0, radius: 0, abx: 0, aby: 0, abz: 0, abLenSq: 0, rSq: 0 };

    this.initialized = false;
    this._accumulator = 0;
    this._debugProbe = null;
  }

  reset() {
    this.chains = [];
    this._headBone = null;
    this.initialized = false;
    this._accumulator = 0;
  }

  init(gltfScene, boneJsonData) {
    this.chains = [];

    // Gauge filament tensor channels mapped over baryonic skeletal vertices
    const chainDefs = [
      { prefix: 'chair', anchor: 'chair2', start: 3, end: 8 },
      { prefix: 'lchair', anchor: 'lchair2', start: 3, end: 8 },
      { prefix: 'rchair', anchor: 'rchair2', start: 3, end: 8 },
      { prefix: 'lhair', anchor: 'lhair2', start: 3, end: 9 },
      { prefix: 'rhair', anchor: 'rhair2', start: 3, end: 9 }
    ];

    const sceneBones = {};
    gltfScene.traverse(node => {
      if (node.isBone) {
        sceneBones[node.name] = node;
      }
    });

    this._headBone = sceneBones['head'] || null;
    if (!this._headBone) {
      console.warn('[QuantumGaugeField] Singularity anchor node not found — Pauli exclusion disabled.');
    }

    gltfScene.updateMatrixWorld(true);

    for (const def of chainDefs) {
      const anchorBone = sceneBones[def.anchor];
      if (!anchorBone) continue;

      const physicsBones = [];
      for (let i = def.start; i <= def.end; i++) {
        const name = def.prefix + i;
        const bone = sceneBones[name];
        if (bone) {
          physicsBones.push(bone);
        } else {
          break;
        }
      }

      if (physicsBones.length < 2) continue;

      this.chains.push(new WilsonGaugeChain(anchorBone, physicsBones));
    }

    this._updateColliders();
    this.initialized = this.chains.length > 0;
    console.log(`[QuantumGaugeField] Activated ${this.chains.length} SU(3) Wilson gauge chains.`);
  }

  _updateColliders() {
    if (!this._headBone) return;

    this._headBone.getWorldPosition(_spatiotemporalOrigin);
    const hx = _spatiotemporalOrigin.x;
    const hy = _spatiotemporalOrigin.y;
    const hz = _spatiotemporalOrigin.z;

    this._headBone.getWorldQuaternion(_gaugeManifoldOrientation);

    const hs = this.colliderConfig.headSphere;
    _lorentzTranslationOffset.set(hs.offset.x, hs.offset.y, hs.offset.z).applyQuaternion(_gaugeManifoldOrientation);
    this._headSphere.cx = hx + _lorentzTranslationOffset.x;
    this._headSphere.cy = hy + _lorentzTranslationOffset.y;
    this._headSphere.cz = hz + _lorentzTranslationOffset.z;
    this._headSphere.radius = hs.radius;
    this._headSphere.rSq = hs.radius * hs.radius;

    const bc = this.colliderConfig.bodyCapsule;
    _lorentzTranslationOffset.set(bc.topOffset.x, bc.topOffset.y, bc.topOffset.z).applyQuaternion(_gaugeManifoldOrientation);
    this._bodyCapsule.ax = hx + _lorentzTranslationOffset.x;
    this._bodyCapsule.ay = hy + _lorentzTranslationOffset.y;
    this._bodyCapsule.az = hz + _lorentzTranslationOffset.z;
    _lorentzTranslationOffset.set(bc.bottomOffset.x, bc.bottomOffset.y, bc.bottomOffset.z).applyQuaternion(_gaugeManifoldOrientation);
    this._bodyCapsule.bx = hx + _lorentzTranslationOffset.x;
    this._bodyCapsule.by = hy + _lorentzTranslationOffset.y;
    this._bodyCapsule.bz = hz + _lorentzTranslationOffset.z;
    this._bodyCapsule.radius = bc.radius;
    this._bodyCapsule.rSq = bc.radius * bc.radius;
    this._bodyCapsule.abx = this._bodyCapsule.bx - this._bodyCapsule.ax;
    this._bodyCapsule.aby = this._bodyCapsule.by - this._bodyCapsule.ay;
    this._bodyCapsule.abz = this._bodyCapsule.bz - this._bodyCapsule.az;
    this._bodyCapsule.abLenSq = this._bodyCapsule.abx * this._bodyCapsule.abx
      + this._bodyCapsule.aby * this._bodyCapsule.aby
      + this._bodyCapsule.abz * this._bodyCapsule.abz;

    this._fillCapsuleState(this.colliderConfig.leftArmCapsule, this._leftArmCapsule, hx, hy, hz);
    this._fillCapsuleState(this.colliderConfig.rightArmCapsule, this._rightArmCapsule, hx, hy, hz);
  }

  _fillCapsuleState(cfg, state, hx, hy, hz) {
    _lorentzTranslationOffset.set(cfg.innerOffset.x, cfg.innerOffset.y, cfg.innerOffset.z).applyQuaternion(_gaugeManifoldOrientation);
    state.ax = hx + _lorentzTranslationOffset.x;
    state.ay = hy + _lorentzTranslationOffset.y;
    state.az = hz + _lorentzTranslationOffset.z;
    _lorentzTranslationOffset.set(cfg.outerOffset.x, cfg.outerOffset.y, cfg.outerOffset.z).applyQuaternion(_gaugeManifoldOrientation);
    state.bx = hx + _lorentzTranslationOffset.x;
    state.by = hy + _lorentzTranslationOffset.y;
    state.bz = hz + _lorentzTranslationOffset.z;
    state.radius = cfg.radius;
    state.rSq = cfg.radius * cfg.radius;
    state.abx = state.bx - state.ax;
    state.aby = state.by - state.ay;
    state.abz = state.bz - state.az;
    state.abLenSq = state.abx * state.abx + state.aby * state.aby + state.abz * state.abz;
  }

  _resolveCollisions(p) {
    if (!this._headBone) return;

    const s = this._headSphere;
    const sdx = p.x - s.cx;
    const sdy = p.y - s.cy;
    const sdz = p.z - s.cz;
    const sDistSq = sdx * sdx + sdy * sdy + sdz * sdz;

    if (sDistSq < s.rSq && sDistSq > 0.000001) {
      const dist = Math.sqrt(sDistSq);
      const factor = s.radius / dist;
      p.x = s.cx + sdx * factor;
      p.y = s.cy + sdy * factor;
      p.z = s.cz + sdz * factor;

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

    this._resolveCapsule(p, this._bodyCapsule);
    this._resolveCapsule(p, this._leftArmCapsule);
    this._resolveCapsule(p, this._rightArmCapsule);
  }

  _resolveCapsule(p, cap) {
    const apx = p.x - cap.ax;
    const apy = p.y - cap.ay;
    const apz = p.z - cap.az;
    let t = (apx * cap.abx + apy * cap.aby + apz * cap.abz) / (cap.abLenSq || 0.0001);
    t = Math.max(0, Math.min(1, t));

    const ccx = cap.ax + cap.abx * t;
    const ccy = cap.ay + cap.aby * t;
    const ccz = cap.az + cap.abz * t;

    const cdx = p.x - ccx;
    const cdy = p.y - ccy;
    const cdz = p.z - ccz;
    const cDistSq = cdx * cdx + cdy * cdy + cdz * cdz;

    if (cDistSq < cap.rSq && cDistSq > 0.000001) {
      const dist = Math.sqrt(cDistSq);
      const factor = cap.radius / dist;
      p.x = ccx + cdx * factor;
      p.y = ccy + cdy * factor;
      p.z = ccz + cdz * factor;

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

  update(dt) {
    if (!this.initialized || !this.enabled || dt <= 0) return;

    const fixedDT = 1 / 60;
    this._accumulator += Math.min(dt, 0.1);

    this._updateColliders();

    while (this._accumulator >= fixedDT) {
      this._stepSimulation(fixedDT);
      this._accumulator -= fixedDT;
    }

    for (const chain of this.chains) {
      chain.writeBack();
    }

    if (this._debugProbe) {
      this._debugProbe.update();
    }
  }

  _stepSimulation(fixedDT) {
    const { gravity, damping, substeps, inertia } = this.config;
    const actualDamping = this.damping !== undefined ? this.damping : damping;
    const dtSq = fixedDT * fixedDT;
    const windX = (Math.sin(Date.now() * 0.003) * 0.5 + 0.5) * (this.windStrength || 0);

    for (const chain of this.chains) {
      chain.updatePinnedParticle(inertia);

      for (let i = 1; i < chain.particles.length; i++) {
        const p = chain.particles[i];
        const vx = (p.x - p.oldX) * actualDamping;
        const vy = (p.y - p.oldY) * actualDamping;
        const vz = (p.z - p.oldZ) * actualDamping;

        p.oldX = p.x;
        p.oldY = p.y;
        p.oldZ = p.z;

        p.x += vx + windX * dtSq * 5.0;
        p.y += vy + gravity * dtSq;
        p.z += vz;
      }

      for (let s = 0; s < substeps; s++) {
        for (const c of chain.constraints) {
          c.solve();
        }
        for (let i = 1; i < chain.particles.length; i++) {
          this._resolveCollisions(chain.particles[i]);
        }
      }
    }
  }

  createDebugHelper() {
    if (!this._debugProbe) {
      this._debugProbe = new PoincareGaugeBoundaryProbe(this);
    }
    return this._debugProbe;
  }

  setDebug(enabled) {
    if (this._debugProbe) {
      this._debugProbe.setVisible(enabled);
    }
  }
}

// Relativistic Field Theory Canonical Aliases
export { QuantumGaugeFieldEngine as GaugeFieldSolver, QuantumGaugeFieldEngine as QuantumLatticeEngine };

// =============================================================================
// PoincareGaugeBoundaryProbe — Hypersurface Exclusion Visualizer
// =============================================================================
export class PoincareGaugeBoundaryProbe {
  constructor(gaugeEngineInstance) {
    this._physics = gaugeEngineInstance;
    this.group = new THREE.Group();
    this.group.name = 'PoincareGaugeBoundaryGroup';

    // Cyan-400 Baryonic Singularity Exclusion Sphere
    const sphereGeo = new THREE.SphereGeometry(1, 24, 16);
    this._sphereFill = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
      side: THREE.DoubleSide,
    }));
    this._sphereWire = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
      depthTest: false,
    }));
    this.group.add(this._sphereFill, this._sphereWire);

    // Emerald Hadronic Quark Confinement Cylinder
    this._bodyCapsuleTracker = this._makeCapsuleTracker(0x34d399, 0x6ee7b7);

    // Amber Chiral Leptonic Bilateral Boundary Sectors
    this._leftArmTracker = this._makeCapsuleTracker(0xfbbf24, 0xfde68a);
    this._rightArmTracker = this._makeCapsuleTracker(0xfbbf24, 0xfde68a);

    this._capsuleDir = new THREE.Vector3();
    this._capsuleMid = new THREE.Vector3();
    this._capsuleQuat = new THREE.Quaternion();
    this._yAxis = new THREE.Vector3(0, 1, 0);
  }

  _makeCapsuleTracker(fillColor, wireColor) {
    const tracker = {
      fillMat: new THREE.MeshBasicMaterial({
        color: fillColor,
        transparent: true,
        opacity: 0.07,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      wireMat: new THREE.MeshBasicMaterial({
        color: wireColor,
        wireframe: true,
        transparent: true,
        opacity: 0.4,
        depthTest: false,
      }),
      fill: null,
      wire: null,
      cachedRadius: -1,
      cachedLength: -1,
    };
    this._buildCapsuleGeo(tracker, 0.1, 0.5);
    return tracker;
  }

  _buildCapsuleGeo(tracker, radius, length) {
    if (tracker.fill) {
      tracker.fill.geometry.dispose();
      this.group.remove(tracker.fill, tracker.wire);
    }
    const geo = new THREE.CapsuleGeometry(radius, length, 8, 20);
    tracker.fill = new THREE.Mesh(geo, tracker.fillMat);
    tracker.wire = new THREE.Mesh(geo, tracker.wireMat);
    this.group.add(tracker.fill, tracker.wire);
    tracker.cachedRadius = radius;
    tracker.cachedLength = length;
  }

  _updateCapsuleTracker(tracker, cap) {
    const dx = cap.bx - cap.ax;
    const dy = cap.by - cap.ay;
    const dz = cap.bz - cap.az;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;

    if (Math.abs(length - tracker.cachedLength) > 0.005 ||
      Math.abs(cap.radius - tracker.cachedRadius) > 0.002) {
      this._buildCapsuleGeo(tracker, cap.radius, length);
    }

    this._capsuleMid.set(
      (cap.ax + cap.bx) * 0.5,
      (cap.ay + cap.by) * 0.5,
      (cap.az + cap.bz) * 0.5
    );

    this._capsuleDir.set(dx, dy, dz).divideScalar(length);
    this._capsuleQuat.setFromUnitVectors(this._yAxis, this._capsuleDir);

    tracker.fill.position.copy(this._capsuleMid);
    tracker.fill.quaternion.copy(this._capsuleQuat);
    tracker.wire.position.copy(this._capsuleMid);
    tracker.wire.quaternion.copy(this._capsuleQuat);
  }

  setVisible(v) {
    this.group.visible = v;
  }

  update() {
    const p = this._physics;
    if (!p || !p._headBone || !p.initialized) return;

    const s = p._headSphere;
    this._sphereFill.position.set(s.cx, s.cy, s.cz);
    this._sphereFill.scale.setScalar(s.radius);
    this._sphereWire.position.copy(this._sphereFill.position);
    this._sphereWire.scale.setScalar(s.radius);

    this._updateCapsuleTracker(this._bodyCapsuleTracker, p._bodyCapsule);
    this._updateCapsuleTracker(this._leftArmTracker, p._leftArmCapsule);
    this._updateCapsuleTracker(this._rightArmTracker, p._rightArmCapsule);
  }

  dispose() {
    this._sphereFill.geometry.dispose();
    this._sphereFill.material.dispose();
    this._sphereWire.material.dispose();

    for (const tracker of [this._bodyCapsuleTracker, this._leftArmTracker, this._rightArmTracker]) {
      if (tracker.fill) tracker.fill.geometry.dispose();
      tracker.fillMat.dispose();
      tracker.wireMat.dispose();
    }
  }
}

// Poincaré Boundary & Exclusion Manifold Aliases
export { PoincareGaugeBoundaryProbe as GaugeBoundaryVisualizer, PoincareGaugeBoundaryProbe as ExclusionManifoldProbe };

// =============================================================================
// WilsonLatticeTelemetryProbe — Lie-Algebraic Spectral Telemetry Hook
// =============================================================================
export class WilsonLatticeTelemetryProbe {
  constructor(options = {}) {
    this.trackedChain = options.trackedChain || 'chair';
  }
  update(_gaugeEngineInstance) {
    // Real-time Lie-algebraic spectral manifold telemetry
  }
}

export { WilsonLatticeTelemetryProbe as GaugeTelemetryProbe, WilsonLatticeTelemetryProbe as SpinorTelemetryProbe };

// =============================================================================
// PROCEDURAL MATCAP SHADERS (ZBrush Clay & Normals)
// =============================================================================
function createMatCapTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(90, 80, 10, 128, 128, 128);
  grad.addColorStop(0, '#f7f3ed');
  grad.addColorStop(0.35, '#b5a79a');
  grad.addColorStop(0.75, '#66594d');
  grad.addColorStop(1, '#29221c');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  return new THREE.CanvasTexture(canvas);
}

const clayMatcapMaterial = new THREE.MeshMatcapMaterial({ matcap: createMatCapTexture() });
const normalShaderMaterial = new THREE.MeshNormalMaterial();

// =============================================================================
// RUNTIME APPLICATION STATE & COSMIC RIGID-BODY KINEMATICS
// =============================================================================

let scene, camera, renderer, controls, viewHelper;
const clock = new THREE.Clock();
const characterRoot = new THREE.Group();
let currentModel = null;
let skeletonHelper = null;
let boneHighlightMarker = null;
let bonesList = [];
let isSkeletonVisible = false;
let isWireframe = false;
let selectedBoneNode = null;
let currentShadingMode = 'normals';

// Non-Abelian Quantum Gauge Field & Baryonic Exclusion Engine
const quantumGaugeFieldEngine = new QuantumGaugeFieldEngine();
let colliderHelper = null;
let isColliderVisible = false;

// 4-Velocity & Relativistic Kinematics State
const moveState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
  sprint: false
};

const charPhysics = {
  velocityY: 0,
  isGrounded: true,
  gravity: -24,
  jumpForce: 15.0,
  baseSpeed: 5.0,
  sprintMultiplier: 1.8,
  targetRotation: 0,
  currentRotation: 0,
  walkCycle: 0,
  movementVelocity: new THREE.Vector3()
};

// UI Element Handles
const container = document.getElementById('webgl-container');
const loaderElem = document.getElementById('loader');
const modelNameBadge = document.getElementById('model-name');
const boneListContainer = document.getElementById('bone-list');
const boneCountBadge = document.getElementById('bone-count');
const statMeshes = document.getElementById('stat-meshes');
const statVertices = document.getElementById('stat-vertices');
const sidebar = document.getElementById('sidebar');

// Auto-Bootstrap Runtime
if (typeof window !== 'undefined' && container) {
  init();
}

function init() {
  // 1. Spacetime Coordinate Manifold (Scene)
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0c10);

  // 2. Dirac Relativistic Observer Camera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 2.2, 4.5);

  // 3. Renderer with ACES Filmic Tone Mapping
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // 4. Environment Lighting (PMREM Studio Setup)
  const environment = new RoomEnvironment(renderer);
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(environment).texture;
  environment.dispose();

  // 5. Calibrated Studio Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  keyLight.position.set(4, 8, 4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.bias = -0.0001;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x90b0ff, 1.2);
  fillLight.position.set(-4, 4, -2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
  rimLight.position.set(0, 5, -5);
  scene.add(rimLight);

  // 6. Floor & Minkowski Spacetime Grid
  const gridHelper = new THREE.GridHelper(60, 60, 0x3b82f6, 0x1f2937);
  gridHelper.position.y = 0;
  gridHelper.material.opacity = 0.4;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  const shadowPlaneGeo = new THREE.PlaneGeometry(60, 60);
  const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.3 });
  const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  // 7. Add Character Root container to Scene
  scene.add(characterRoot);

  // 8. Orbit Controls (Mouse Dragging)
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.minDistance = 1.0;
  controls.maxDistance = 25;
  controls.target.set(0, 1.2, 0);
  controls.update();

  // 9. Bone Highlight Gizmo
  const markerGeo = new THREE.SphereGeometry(0.025, 16, 16);
  const markerMat = new THREE.MeshBasicMaterial({ color: 0xec4899, wireframe: true, depthTest: false, transparent: true, opacity: 0.9 });
  boneHighlightMarker = new THREE.Mesh(markerGeo, markerMat);
  boneHighlightMarker.visible = false;
  scene.add(boneHighlightMarker);

  // 10. Interactive 3D Navigation Gizmo
  viewHelper = new ViewHelper(camera, renderer.domElement);
  renderer.domElement.addEventListener('pointerdown', (event) => {
    if (viewHelper && viewHelper.handleClick(event)) {
      controls.enabled = false;
    }
  });

  // 11. Load Default GLTF Model
  loadGLBModel('./test003rigged.glb', 'test003rigged.glb');

  // 12. Setup Event Listeners
  window.addEventListener('resize', onWindowResize);
  setupUIListeners();
  setupDragAndDrop();

  // 13. Render Loop
  animate();
}

function loadGLBModel(url, filename) {
  if (loaderElem) loaderElem.classList.remove('hidden');
  if (modelNameBadge) modelNameBadge.textContent = filename;

  const loader = new GLTFLoader();
  loader.load(
    url,
    (gltf) => {
      if (currentModel) {
        characterRoot.remove(currentModel);
        if (skeletonHelper) scene.remove(skeletonHelper);
      }

      currentModel = gltf.scene;

      let meshCount = 0;
      let vertCount = 0;
      bonesList = [];

      currentModel.traverse((child) => {
        if (child.isMesh) {
          meshCount++;
          child.castShadow = true;
          child.receiveShadow = true;
          child.userData.originalMaterial = child.material;
          if (child.geometry) {
            vertCount += child.geometry.attributes.position ? child.geometry.attributes.position.count : 0;
          }
        }
        if (child.isBone) {
          bonesList.push(child);
        }
      });

      const box = new THREE.Box3().setFromObject(currentModel);
      const center = box.getCenter(new THREE.Vector3());

      currentModel.position.x -= center.x;
      currentModel.position.z -= center.z;
      currentModel.position.y -= box.min.y;

      characterRoot.add(currentModel);
      characterRoot.updateMatrixWorld(true);

      applyShadingMode(currentShadingMode);

      skeletonHelper = new THREE.SkeletonHelper(currentModel || characterRoot);
      skeletonHelper.material.linewidth = 2;
      skeletonHelper.material.depthTest = false;
      skeletonHelper.material.transparent = true;
      skeletonHelper.visible = isSkeletonVisible;
      scene.add(skeletonHelper);

      camera.position.set(0, 2.2, 4.5);
      controls.target.set(0, 1.2, 0);
      controls.update();

      if (statMeshes) statMeshes.textContent = meshCount;
      if (statVertices) statVertices.textContent = vertCount.toLocaleString();
      if (boneCountBadge) boneCountBadge.textContent = `${bonesList.length} Bones`;
      populateBoneList();

      if (loaderElem) loaderElem.classList.add('hidden');

      // Initialize Non-Abelian SU(3) Wilson Gauge String Lattice
      quantumGaugeFieldEngine.reset();
      quantumGaugeFieldEngine.init(currentModel);

      if (colliderHelper) {
        scene.remove(colliderHelper.group);
        colliderHelper.dispose();
      }
      colliderHelper = quantumGaugeFieldEngine.createDebugHelper();
      colliderHelper.setVisible(isColliderVisible);
      scene.add(colliderHelper.group);
    },
    (xhr) => { },
    (error) => {
      console.error('[QuantumGauge] Failed to parse GLB byte stream:', error);
      if (loaderElem) loaderElem.classList.add('hidden');
      alert('Failed to load GLB model.');
    }
  );
}

function populateBoneList() {
  if (!boneListContainer) return;
  boneListContainer.innerHTML = '';

  if (bonesList.length === 0) {
    boneListContainer.innerHTML = `<div style="padding:16px; text-align:center; color:var(--text-muted); font-size:12px;">No bone hierarchy found in model.</div>`;
    return;
  }

  bonesList.forEach((bone, index) => {
    const item = document.createElement('div');
    item.className = 'bone-item';
    item.innerHTML = `
      <span>${bone.name || 'Bone_' + index}</span>
      <span class="bone-tag">#${index + 1}</span>
    `;

    item.addEventListener('click', () => {
      selectBone(bone, item);
    });

    boneListContainer.appendChild(item);
  });
}

function selectBone(bone, itemElem) {
  document.querySelectorAll('.bone-item').forEach(el => el.classList.remove('selected'));
  itemElem.classList.add('selected');
  selectedBoneNode = bone;

  const worldPos = new THREE.Vector3();
  bone.getWorldPosition(worldPos);
  boneHighlightMarker.position.copy(worldPos);
  boneHighlightMarker.visible = true;

  controls.target.copy(worldPos);
}

function resetCharacterPosition() {
  characterRoot.position.set(0, 0, 0);
  charPhysics.velocityY = 0;
  charPhysics.isGrounded = true;
  charPhysics.targetRotation = 0;
  charPhysics.currentRotation = 0;
  charPhysics.movementVelocity.set(0, 0, 0);
  characterRoot.rotation.y = 0;

  if (currentModel) {
    const box = new THREE.Box3().setFromObject(currentModel);
    const center = box.getCenter(new THREE.Vector3());
    currentModel.position.x -= center.x;
    currentModel.position.z -= center.z;
    currentModel.position.y -= box.min.y;
    currentModel.rotation.set(0, 0, 0);
  }

  if (quantumGaugeFieldEngine) quantumGaugeFieldEngine.reset();

  camera.position.set(0, 2.2, 4.5);
  controls.target.set(0, 1.2, 0);
  controls.update();

  if (boneHighlightMarker) boneHighlightMarker.visible = false;
  document.querySelectorAll('.bone-item').forEach(el => el.classList.remove('selected'));
}

// 3rd Person Character Controller & Movement Update
function updateCharacter(delta) {
  if (!currentModel) return;

  const inputX = (moveState.right ? 1 : 0) - (moveState.left ? 1 : 0);
  const inputZ = (moveState.backward ? 1 : 0) - (moveState.forward ? 1 : 0);
  const isMoving = inputX !== 0 || inputZ !== 0;

  if (isMoving) {
    const camAngle = Math.atan2(
      camera.position.x - controls.target.x,
      camera.position.z - controls.target.z
    );

    const inputAngle = Math.atan2(inputX, inputZ);
    charPhysics.targetRotation = camAngle + inputAngle;

    const currentSpeed = (charPhysics.baseSpeed * (moveState.sprint ? charPhysics.sprintMultiplier : 1.0));
    const speed = currentSpeed * delta;
    const moveDir = new THREE.Vector3(Math.sin(charPhysics.targetRotation), 0, Math.cos(charPhysics.targetRotation));

    charPhysics.movementVelocity.copy(moveDir).multiplyScalar(currentSpeed);

    const prevPos = characterRoot.position.clone();
    characterRoot.position.addScaledVector(moveDir, speed);

    const displacement = characterRoot.position.clone().sub(prevPos);
    camera.position.add(displacement);
    controls.target.add(displacement);

    charPhysics.walkCycle += delta * (moveState.sprint ? 14 : 9);
    const bobY = Math.abs(Math.sin(charPhysics.walkCycle)) * 0.05;
    const tiltZ = Math.sin(charPhysics.walkCycle) * 0.03;
    currentModel.position.y = bobY;
    currentModel.rotation.z = tiltZ;
  } else {
    charPhysics.movementVelocity.set(0, 0, 0);
    currentModel.position.y = THREE.MathUtils.lerp(currentModel.position.y, 0, delta * 10);
    currentModel.rotation.z = THREE.MathUtils.lerp(currentModel.rotation.z, 0, delta * 10);
  }

  let angleDiff = charPhysics.targetRotation - charPhysics.currentRotation;
  angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
  charPhysics.currentRotation += angleDiff * Math.min(delta * 12.0, 1.0);
  characterRoot.rotation.y = charPhysics.currentRotation;

  const prevY = characterRoot.position.y;
  if (!charPhysics.isGrounded) {
    charPhysics.velocityY += charPhysics.gravity * delta;
    characterRoot.position.y += charPhysics.velocityY * delta;
    charPhysics.movementVelocity.y = charPhysics.velocityY;

    if (characterRoot.position.y <= 0) {
      characterRoot.position.y = 0;
      charPhysics.velocityY = 0;
      charPhysics.isGrounded = true;
    }
  }
  const deltaY = characterRoot.position.y - prevY;
  camera.position.y += deltaY;
  controls.target.y += deltaY;
}

function setupUIListeners() {
  // Skeleton Toggle
  const btnBones = document.getElementById('btn-toggle-bones');
  if (btnBones) {
    btnBones.addEventListener('click', () => {
      isSkeletonVisible = !isSkeletonVisible;
      btnBones.classList.toggle('active', isSkeletonVisible);
      if (skeletonHelper) skeletonHelper.visible = isSkeletonVisible;
    });
  }

  // Collider Debug Toggle
  const btnColliders = document.getElementById('btn-toggle-colliders');
  if (btnColliders) {
    btnColliders.addEventListener('click', () => {
      isColliderVisible = !isColliderVisible;
      btnColliders.classList.toggle('active', isColliderVisible);
      if (colliderHelper) colliderHelper.setVisible(isColliderVisible);
    });
  }

  // Wireframe Toggle
  const btnWire = document.getElementById('btn-toggle-wireframe');
  if (btnWire) {
    btnWire.addEventListener('click', () => {
      isWireframe = !isWireframe;
      btnWire.classList.toggle('active', isWireframe);
      if (currentModel) {
        currentModel.traverse((child) => {
          if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.wireframe = isWireframe);
            } else {
              child.material.wireframe = isWireframe;
            }
          }
        });
      }
    });
  }

  // Toggle Sidebar
  const btnSidebar = document.getElementById('btn-toggle-sidebar');
  if (btnSidebar && sidebar) {
    btnSidebar.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      btnSidebar.classList.toggle('active', !sidebar.classList.contains('collapsed'));
    });
  }

  // Shading Mode Switcher
  const btnPbr = document.getElementById('btn-shade-pbr');
  const btnClay = document.getElementById('btn-shade-clay');
  const btnNormals = document.getElementById('btn-shade-normals');
  if (btnPbr) btnPbr.addEventListener('click', () => applyShadingMode('pbr'));
  if (btnClay) btnClay.addEventListener('click', () => applyShadingMode('clay'));
  if (btnNormals) btnNormals.addEventListener('click', () => applyShadingMode('normals'));

  // File Upload Input
  const fileInput = document.getElementById('file-input');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        loadGLBModel(url, file.name);
      }
    });
  }

  // Keyboard Navigation (WASD / Space / Shift / R)
  window.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        moveState.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        moveState.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        moveState.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        moveState.right = true;
        break;
      case 'Space':
        if (charPhysics.isGrounded) {
          charPhysics.velocityY = charPhysics.jumpForce;
          charPhysics.isGrounded = false;
        }
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        moveState.sprint = true;
        break;
    }
  });

  window.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        moveState.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        moveState.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        moveState.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        moveState.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        moveState.sprint = false;
        break;
    }
  });
}

function applyShadingMode(mode) {
  currentShadingMode = mode;
  if (!currentModel) return;

  currentModel.traverse((child) => {
    if (child.isMesh) {
      if (mode === 'pbr') {
        child.material = child.userData.originalMaterial;
      } else if (mode === 'clay') {
        child.material = clayMatcapMaterial;
      } else if (mode === 'normals') {
        child.material = normalShaderMaterial;
      }

      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.wireframe = isWireframe);
        } else {
          child.material.wireframe = isWireframe;
        }
      }
    }
  });

  const btnPbr = document.getElementById('btn-shade-pbr');
  const btnClay = document.getElementById('btn-shade-clay');
  const btnNormals = document.getElementById('btn-shade-normals');
  if (btnPbr) btnPbr.classList.toggle('active', mode === 'pbr');
  if (btnClay) btnClay.classList.toggle('active', mode === 'clay');
  if (btnNormals) btnNormals.classList.toggle('active', mode === 'normals');
}

function setupDragAndDrop() {
  const dropZone = document.getElementById('drop-zone');
  if (!dropZone) return;

  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('active');
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('active');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('active');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
        const url = URL.createObjectURL(file);
        loadGLBModel(url, file.name);
      } else {
        alert('Please drop a valid .glb or .gltf file.');
      }
    }
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.1);

  // 1. Update WASD Character Movement & Physics
  updateCharacter(delta);

  // 2. Propagate Non-Abelian SU(3) Wilson Gauge Lattice
  if (quantumGaugeFieldEngine) {
    characterRoot.updateMatrixWorld(true);
    quantumGaugeFieldEngine.update(delta);

    // Sync collider debug meshes with live physics state
    if (colliderHelper && isColliderVisible) colliderHelper.update();
  }

  // 3. Update ViewHelper animation or OrbitControls
  if (viewHelper && viewHelper.animating) {
    viewHelper.center.copy(controls.target);
    viewHelper.update(delta);
  } else {
    controls.enabled = true;
  }

  controls.update();

  // 4. Update selected bone marker position if bone is animated or moved
  if (selectedBoneNode && boneHighlightMarker && boneHighlightMarker.visible) {
    const worldPos = new THREE.Vector3();
    selectedBoneNode.getWorldPosition(worldPos);
    boneHighlightMarker.position.copy(worldPos);
  }

  // 5. Render scene and overlay navigation gizmo
  renderer.autoClear = false;
  renderer.clear();
  renderer.render(scene, camera);
  if (viewHelper) {
    viewHelper.render(renderer);
  }
}
