// hair-herlper.js
// Visual debug helpers for hair physics system (Head sphere & Body/Arm capsule colliders)

import * as THREE from 'three';

// ==========================================
// HairColliderHelper — live debug visualizer
// ==========================================
// Renders all collision shapes in 3D:
//   Head sphere   → cyan
//   Body capsule  → emerald
//   Arm capsules  → amber (left & right)
//
// Geometry is unit-scale for the sphere (scaled at runtime) and rebuilt
// for each capsule only when radius/length changes — zero per-frame allocation.
//
// Usage:
//   const helper = new HairColliderHelper(hairPhysics);
//   scene.add(helper.group);
//   // in animate():
//   helper.update();
//   // to toggle:
//   helper.setVisible(true / false);
// ==========================================
export class HairColliderHelper {
    /**
     * @param {import('./hairphysic.js').HairPhysics} hairPhysics - The HairPhysics instance to visualize.
     */
    constructor(hairPhysics) {
        this._physics = hairPhysics;
        this.group = new THREE.Group();
        this.group.name = 'HairColliderHelper';

        // ---- Head sphere ---- (cyan)
        // Unit sphere, scaled to radius at update() time.
        const sphereGeo = new THREE.SphereGeometry(1, 24, 16);

        this._sphereFill = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({
            color: 0x22d3ee,         // cyan-400
            transparent: true,
            opacity: 0.07,
            depthWrite: false,
            side: THREE.DoubleSide,
        }));

        this._sphereWire = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({
            color: 0x67e8f9,         // cyan-300
            wireframe: true,
            transparent: true,
            opacity: 0.4,
            depthTest: false,
        }));

        this.group.add(this._sphereFill, this._sphereWire);

        // ---- Body capsule ---- (emerald)
        this._bodyCapsuleTracker = this._makeCapsuleTracker(0x34d399, 0x6ee7b7);

        // ---- Arm capsules ---- (amber)
        this._leftArmTracker  = this._makeCapsuleTracker(0xfbbf24, 0xfde68a);
        this._rightArmTracker = this._makeCapsuleTracker(0xfbbf24, 0xfde68a);

        // Reusable temporaries for capsule orientation (no per-frame allocation)
        this._capsuleDir = new THREE.Vector3();
        this._capsuleMid = new THREE.Vector3();
        this._capsuleQuat = new THREE.Quaternion();
        this._yAxis = new THREE.Vector3(0, 1, 0);
    }

    // ---- Private: create a capsule tracker (materials + cached geometry state) ----
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
        // Build placeholder geometry; will be rebuilt on first update()
        this._buildCapsuleGeo(tracker, 0.1, 0.5);
        return tracker;
    }

    // ---- Private: build/rebuild CapsuleGeometry for a tracker ----
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

    // ---- Private: sync one capsule tracker to a physics capsule state ----
    _updateCapsuleTracker(tracker, cap) {
        const dx = cap.bx - cap.ax;
        const dy = cap.by - cap.ay;
        const dz = cap.bz - cap.az;
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;

        // Rebuild geometry only when shape changes (model swap / config edit)
        if (Math.abs(length - tracker.cachedLength) > 0.005 ||
            Math.abs(cap.radius - tracker.cachedRadius) > 0.002) {
            this._buildCapsuleGeo(tracker, cap.radius, length);
        }

        // Midpoint position
        this._capsuleMid.set(
            (cap.ax + cap.bx) * 0.5,
            (cap.ay + cap.by) * 0.5,
            (cap.az + cap.bz) * 0.5
        );

        // Orientation: default Y-up → capsule axis direction
        this._capsuleDir.set(dx, dy, dz).divideScalar(length);
        this._capsuleQuat.setFromUnitVectors(this._yAxis, this._capsuleDir);

        tracker.fill.position.copy(this._capsuleMid);
        tracker.fill.quaternion.copy(this._capsuleQuat);
        tracker.wire.position.copy(this._capsuleMid);
        tracker.wire.quaternion.copy(this._capsuleQuat);
    }

    /** Show or hide all debug meshes. */
    setVisible(v) { this.group.visible = v; }

    /**
     * Sync mesh transforms with current physics collider state.
     * Call once per frame, after hairPhysics.update().
     */
    update() {
        const p = this._physics;
        if (!p || !p._headBone || !p.initialized) return;

        // ---- Head sphere ----
        const s = p._headSphere;
        this._sphereFill.position.set(s.cx, s.cy, s.cz);
        this._sphereFill.scale.setScalar(s.radius);
        this._sphereWire.position.copy(this._sphereFill.position);
        this._sphereWire.scale.setScalar(s.radius);

        // ---- Body capsule (emerald) ----
        this._updateCapsuleTracker(this._bodyCapsuleTracker, p._bodyCapsule);

        // ---- Arm capsules (amber) ----
        this._updateCapsuleTracker(this._leftArmTracker,  p._leftArmCapsule);
        this._updateCapsuleTracker(this._rightArmTracker, p._rightArmCapsule);
    }

    /** Dispose all geometries and materials. */
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
