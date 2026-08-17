/* ───────────────────────────────────────────────
    ANIMATION LOOP
    animate() — movement · facing · skeletal anim ·
    camera tracking · HUD
    Depends on: all other modules
─────────────────────────────────────────────── */
const clock = new THREE.Clock();
const coordsEl = document.getElementById('coords');



function animate() {
    requestAnimationFrame(animate);
    const frameStart = performance.now();
    const dt = Math.min(clock.getDelta(), 0.05); // cap to avoid tunnelling
    const time = clock.elapsedTime;

    /* ── Player Physics, Animation & Ponytail Secondary Motion ── */
    updatePlayerController(dt);

    const px = playerGroup.position.x;
    const py = playerGroup.position.y;
    const pz = playerGroup.position.z;

    // Track floor mesh beneath player for infinite ground coverage
    if (typeof floor !== 'undefined') {
        floor.position.x = px;
        floor.position.z = pz;
    }

    /* ── Faraway Object Horizon Sink & Scale Displacement ── */
    if (typeof updateHorizonDisplacement === 'function') {
        updateHorizonDisplacement(px, pz, py);
    }

    /* ── Animated Monuments (Floating Top Crystal & Multi Blue Energy Rings) ── */
    if (typeof animatedMonuments !== 'undefined' && animatedMonuments.length > 0) {
        const ANIM_CULL_DIST_SQ = 10000 * 10000; // 4000 units distance threshold
        for (let i = 0; i < animatedMonuments.length; i++) {
            const m = animatedMonuments[i];
            if (!m.group || !m.group.visible) continue;

            // Pause animations early when object is beyond 4000 units distance
            const dx = m.group.position.x - px;
            const dz = m.group.position.z - pz;
            if (dx * dx + dz * dz > ANIM_CULL_DIST_SQ) continue;

            if (m.crystal) {
                m.crystal.rotation.y += 0.8 * dt;
            }
            if (m.rings) {
                for (let r = 0; r < m.rings.length; r++) {
                    const rData = m.rings[r];
                    rData.mesh.rotation.z += rData.speed * dt;
                    rData.mesh.position.y = rData.baseY + Math.sin(time * 2.2 + r * 1.5 + i) * rData.oscAmp;
                }
            }
        }
    }

    /* ── Interactive Grass Collision Bending & Wind Sway ── */
    if (typeof updateGrassPhysics === 'function') {
        updateGrassPhysics(px, py, pz, dt, time);
    }

    /* ── Camera 3D Orbit Tracking ── */

    // Lock camera orbital position at 85° to restrain camera Y height from lowering further
    const MAX_POSITION_TILT = 80;
    const orbitAngleDeg = Math.min(camAngleDeg, MAX_POSITION_TILT);
    const pitchRad = THREE.MathUtils.degToRad(orbitAngleDeg);
    const yawRad = THREE.MathUtils.degToRad(camYawDeg || 0);

    const groundDist = camHeight * Math.sin(pitchRad);
    const camOffsetY = camHeight * Math.cos(pitchRad);
    const camOffsetX = groundDist * Math.sin(yawRad);
    const camOffsetZ = groundDist * Math.cos(yawRad);

    camera.position.x = px + camOffsetX;
    camera.position.y = py + camOffsetY;
    camera.position.z = pz + camOffsetZ;

    // Pitch lookAt target upwards into the sky when tilt exceeds 75°
    let targetY = py + 12;
    if (camAngleDeg > MAX_POSITION_TILT) {
        const extraTiltRad = THREE.MathUtils.degToRad(camAngleDeg - MAX_POSITION_TILT);
        targetY += camHeight * Math.tan(extraTiltRad);
    }
    camera.lookAt(px, targetY, pz);

    /* ── Stylized Sky Dome Position Tracking & Cloud Motion ── */
    if (typeof updateSky === 'function') {
        updateSky(dt, time);
    }

    /* ── World-Locked Player-Centered Wide Shadow Tracking (0% Camera Yaw Rotation Impact) ── */
    // Calculate texel size of the 4000x4000 shadow camera frustum
    const shadowWidth = dirLight.shadow.camera.right - dirLight.shadow.camera.left;
    const texelSize = shadowWidth / dirLight.shadow.mapSize.width;

    // Quantize player position directly to integer multiples of texelSize (World-Locked)
    const shadowTargetX = Math.floor(px / texelSize) * texelSize;
    const shadowTargetZ = Math.floor(pz / texelSize) * texelSize;
    const shadowTargetY = 0; // Anchored to ground level

    // Keep light position rigidly locked along Z-axis front offset (0, 2500, -5000)
    dirLight.position.set(shadowTargetX, 2500, shadowTargetZ - 5000);
    dirLight.target.position.set(shadowTargetX, shadowTargetY, shadowTargetZ);
    dirLight.target.updateMatrixWorld();

    // Dynamic Radial Distance Shadow Culling for Procedural Monuments / Obstacles (2700 units +50% threshold)
    if (typeof obstacles !== 'undefined' && obstacles.length > 0) {
        const shadowRadiusSq = 2700 * 2700; // 2700 units radial shadow vision threshold (+50% expansion)
        for (let i = 0; i < obstacles.length; i++) {
            const obs = obstacles[i];
            if (obs && obs.mesh) {
                const monumentPos = obs.mesh.parent ? obs.mesh.parent.position : obs.mesh.position;
                const dx = monumentPos.x - px;
                const dz = monumentPos.z - pz;
                obs.mesh.castShadow = (dx * dx + dz * dz <= shadowRadiusSq);
            }
        }
    }

    /* ── HUD ── */
    coordsEl.textContent = `x: ${Math.round(px)}  z: ${Math.round(pz)}`;

    renderer.render(scene, camera);

    if (typeof perfMonitor !== 'undefined') {
        perfMonitor.record(performance.now() - frameStart);
    }
}

animate();
