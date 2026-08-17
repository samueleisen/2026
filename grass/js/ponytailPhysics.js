/* ───────────────────────────────────────────────
    PONYTAIL SECONDARY PHYSICS (Additive Lag & Trailing Motion)
    Applies procedural spring-damped inertia and delayed trailing
    physics onto ponytail bones (Ponytail1 → ponytail5).
    Runs immediately after mixer.update(dt) in the frame loop.
─────────────────────────────────────────────── */

(function () {
    // Persistent physics state
    let prevPx = 0;
    let prevPy = 0;
    let prevPz = 0;
    let prevYaw = 0;
    let isInitialized = false;

    // Smoothed trailing angles for each of the 5 bones [Ponytail1, ponytail2, ponytail3, ponytail4, ponytail5]
    const smoothedPitch = [0, 0, 0, 0, 0]; // Pitch (X axis tilt)
    const smoothedRoll = [0, 0, 0, 0, 0]; // Roll  (Z axis tilt)
    const smoothedYaw = [0, 0, 0, 0, 0]; // Yaw   (Y axis twist)

    // Reusable Three.js math objects to avoid per-frame allocations
    const _additiveQuat = new THREE.Quaternion();
    const _euler = new THREE.Euler(0, 0, 0, 'YXZ');

    /**
     * Updates additive procedural ponytail physics.
     * Must be called AFTER mixer.update(dt).
     */
    window.updatePonytailPhysics = function (dt) {
        if (!window.ponytailBones || window.ponytailBones.length === 0 || !playerGroup) return;
        if (dt <= 0) return;

        const px = playerGroup.position.x;
        const py = playerGroup.position.y;
        const pz = playerGroup.position.z;
        const currentYaw = playerGroup.rotation.y;

        if (!isInitialized) {
            prevPx = px;
            prevPy = py;
            prevPz = pz;
            prevYaw = currentYaw;
            isInitialized = true;
            return;
        }

        // 1. Calculate world velocity components
        const vx = (px - prevPx) / dt;
        const vy = (py - prevPy) / dt;
        const vz = (pz - prevPz) / dt;

        // 2. Calculate turning angular velocity (yaw rate)
        let yawDiff = currentYaw - prevYaw;
        while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
        while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
        const yawRate = yawDiff / dt;

        // Save current frame position & orientation for next delta calculation
        prevPx = px;
        prevPy = py;
        prevPz = pz;
        prevYaw = currentYaw;

        // 3. Project world velocity into player's local reference frame
        // Forward vector: (-sin(yaw), -cos(yaw))
        // Right vector:   (cos(yaw), -sin(yaw))
        const sinY = Math.sin(currentYaw);
        const cosY = Math.cos(currentYaw);

        const vForward = -(vx * sinY + vz * cosY); // Positive = moving forward
        const vRight = vx * cosY - vz * sinY;  // Positive = moving right

        // 4. Calculate target physics forces
        // - Pitch: Scaled force multiplier for forward locomotion & subtler vertical jump physics
        const speedRatio = THREE.MathUtils.clamp(vForward / PLAYER_SPEED, -0.5, 1.0);
        const vyFactor = THREE.MathUtils.clamp(vy * 0.0035, -0.15, 0.15); // Subtler jump launch/fall pitch
        const targetBasePitch = -speedRatio * 0.55 - vyFactor;

        // - Roll / Yaw: Subtler side swing and twist during direction changes
        const targetBaseRoll = THREE.MathUtils.clamp(-vRight / PLAYER_SPEED * 0.30 - yawRate * 0.08, -0.35, 0.35);
        const targetBaseYaw = THREE.MathUtils.clamp(-yawRate * 0.10, -0.20, 0.20);

        // 5. Chain distribution & Max Rotation Limit (115 Degrees)
        // Boosted index 2 (ponytail3) to 1.10 so the middle ponytail segment rotates back further to straighten the hair
        const chainFactors = [0.05, 0.15, 1.10, 0.75, 0.90];
        const chainSum = 2.95; // 0.05 + 0.15 + 1.10 + 0.75 + 0.90
        const MAX_TOTAL_PITCH = THREE.MathUtils.degToRad(115); // 115 degrees max rotation limit

        // Clamp base pitch force so total ponytail bend across all 5 bones never exceeds 115 degrees
        const maxBasePitch = MAX_TOTAL_PITCH / chainSum;
        const clampedBasePitch = THREE.MathUtils.clamp(targetBasePitch, -maxBasePitch, maxBasePitch);

        const lerpSpeed = 6.0; // Smooth damping speed

        const bones = window.ponytailBones;
        for (let i = 0; i < 5; i++) {
            const bone = bones[i];
            if (!bone) continue;

            const factor = chainFactors[i];
            const targetPitch = clampedBasePitch * factor;
            const targetRoll = targetBaseRoll * factor;
            const targetYaw = targetBaseYaw * factor;

            // Exponential decay smoothing (dt-independent lerp)
            const alpha = 1.0 - Math.exp(-lerpSpeed * dt);
            smoothedPitch[i] += (targetPitch - smoothedPitch[i]) * alpha;
            smoothedRoll[i] += (targetRoll - smoothedRoll[i]) * alpha;
            smoothedYaw[i] += (targetYaw - smoothedYaw[i]) * alpha;

            // Reset bone quaternion to base rest pose before applying additive physics offset (prevents compounding spin)
            if (bone._restQuaternion) {
                bone.quaternion.copy(bone._restQuaternion);
            }

            // Additive blending: Apply procedural inertia quaternion on top of rest pose
            _euler.set(smoothedPitch[i], smoothedYaw[i], smoothedRoll[i], 'YXZ');
            _additiveQuat.setFromEuler(_euler);
            bone.quaternion.multiply(_additiveQuat);
        }
    };
})();
