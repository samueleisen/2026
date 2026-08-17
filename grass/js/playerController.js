/* ───────────────────────────────────────────────
    PLAYER CONTROLLER
    Velocity-based physics · frame-perfect jump mechanics ·
    ground surface height detection · collision response ·
    smooth facing · locomotion & jump animation blending

    Animation contract (firstmodel.glb):
      idleAction  = "Hero-Idle"  — plays at weight 1 by default
      walkAction  = "Hero-Walk"  — cross-fades in based on actual displacement speed
      jumpAction  = "Hero-Jump"  — 48 frames @ 24fps (2.0s total):
                                   Frame 0 = Liftoff / Coiled crouch
                                   Frame 40 (1.6667s) = Touchdown frame
                                   Frames 40-48 = Impact recovery crouch

    Depends on: scene, playerGroup, pShadow,
                mixer, idleAction, walkAction, jumpAction, isWalking, isGrounded, glbReady,
                keys, PLAYER_SPEED, PLAYER_ACCEL, PLAYER_FRICTION, PLAYER_RADIUS,
                JUMP_POWER, JUMP_GRAVITY, HALF_WIDTH, HALF_DEPTH, testCollision, obstacles
─────────────────────────────────────────────── */

// Blend & physics constants
const WALK_FADE_IN          = 0.18;   // seconds
const WALK_FADE_OUT         = 0.25;   // seconds
const JUMP_LAUNCH_BLEND     = 0.14;   // seconds smooth transition from idle/walk into jump
const MIN_WALK_SPEED        = 8.0;    // units/sec threshold for locomotion animation
const WALK_ANIM_SPEED_MULT  = 1.35;   // playback rate multiplier for brisk walk loop animation

// Persistent velocity state
let velX = 0;
let velY = 0;
let velZ = 0;

/**
 * Calculates the highest solid ground surface directly beneath (x, z).
 * Checks world floor level (y=0) and top faces of obstacle AABBs.
 */
function getGroundHeight(x, z, radius = PLAYER_RADIUS) {
    let groundY = 0;
    if (typeof obstacles !== 'undefined') {
        for (let i = 0; i < obstacles.length; i++) {
            const box = obstacles[i].box;
            if (x + radius > box.min.x && x - radius < box.max.x &&
                z + radius > box.min.z && z - radius < box.max.z) {
                if (box.max.y > groundY) {
                    groundY = box.max.y;
                }
            }
        }
    }
    return groundY;
}

function updatePlayerController(dt) {

    // Tick the mixer regardless — lets blend-outs finish cleanly
    if (mixer) mixer.update(dt);
    if (!glbReady) return;

    /* ── 1. Input vector & Target horizontal velocity (Camera-Relative) ── */
    let rawDx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    let rawDz = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);

    // Transform input vector by camera horizontal yaw angle (aligns WASD with camera view)
    const yawRad = THREE.MathUtils.degToRad(camYawDeg || 0);
    const moveX =  rawDx * Math.cos(yawRad) + rawDz * Math.sin(yawRad);
    const moveZ = -rawDx * Math.sin(yawRad) + rawDz * Math.cos(yawRad);

    const inputLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
    let dirX = 0;
    let dirZ = 0;
    if (inputLen > 0) {
        dirX = moveX / inputLen;
        dirZ = moveZ / inputLen;
    }

    const targetVelX = dirX * PLAYER_SPEED;
    const targetVelZ = dirZ * PLAYER_SPEED;

    /* ── 2. Horizontal Acceleration & Friction physics ───────── */
    if (inputLen > 0) {
        // Accelerate smoothly towards target velocity
        velX += (targetVelX - velX) * Math.min(1, 16 * dt);
        velZ += (targetVelZ - velZ) * Math.min(1, 16 * dt);
    } else {
        // Friction / damping when no keys pressed
        velX += (0 - velX) * Math.min(1, PLAYER_FRICTION * dt);
        velZ += (0 - velZ) * Math.min(1, PLAYER_FRICTION * dt);
        if (Math.abs(velX) < 0.1) velX = 0;
        if (Math.abs(velZ) < 0.1) velZ = 0;
    }

    /* ── 3. Vertical & Horizontal Position State ───────────── */
    let px = playerGroup.position.x;
    let py = playerGroup.position.y;
    let pz = playerGroup.position.z;

    const prevX = px;
    const prevZ = pz;

    const dx = velX * dt;
    const dz = velZ * dt;

    // Try X axis independently (takes 3D elevation py into account so mid-air leaps cleared obstacles)
    const newX = px + dx;
    if (!testCollision(newX, py, pz)) {
        px = newX;
    } else {
        velX = 0; // Blocked on X axis -> zero velocity component
    }

    // Try Z axis independently (takes 3D elevation py into account so mid-air leaps cleared obstacles)
    const newZ = pz + dz;
    if (!testCollision(px, py, newZ)) {
        pz = newZ;
    } else {
        velZ = 0; // Blocked on Z axis -> zero velocity component
    }

    /* ── 4. Ground Surface Height & Vertical Jump Physics ───── */
    const targetGroundY = getGroundHeight(px, pz);
    let justLanded = false;

    // Smooth Transition Jump Trigger
    if (keys.space && isGrounded) {
        isGrounded = false;
        velY = JUMP_POWER;

        // Smoothly fade out idle and walk actions over JUMP_LAUNCH_BLEND seconds
        if (idleAction) idleAction.fadeOut(JUMP_LAUNCH_BLEND);
        if (walkAction) walkAction.fadeOut(JUMP_LAUNCH_BLEND);

        if (jumpAction) {
            jumpAction.reset();
            jumpAction.time = 0;
            jumpAction.setEffectiveTimeScale(1.0);
            jumpAction.enabled = true;
            jumpAction.fadeIn(JUMP_LAUNCH_BLEND);
            jumpAction.play();
        }
    }

    // Apply gravity & height update while airborne
    if (!isGrounded) {
        velY -= JUMP_GRAVITY * dt;
        py += velY * dt;

        // Speed up downward airborne animation transition so frames 20..37 reach landing pose briskly
        if (jumpAction) {
            if (velY < 0) {
                jumpAction.setEffectiveTimeScale(1.75);
            } else {
                jumpAction.setEffectiveTimeScale(1.0);
            }
        }

        // Freefall transition: if falling without jumpAction active (e.g. stepped off ledge)
        if (velY < 0 && jumpAction && !jumpAction.isRunning()) {
            jumpAction.reset();
            jumpAction.time = 0.833; // Frame 20 (mid-air freefall descent pose)
            jumpAction.enabled = true;
            jumpAction.setEffectiveTimeScale(1.75);
            jumpAction.play();

            if (idleAction) idleAction.fadeOut(0.10);
            if (walkAction) walkAction.fadeOut(0.10);
        }

        // Prevent premature mid-air landing: hold mid-air descent pose (Frame 37 / 1.55s) until surface touchdown
        if (jumpAction && jumpAction.isRunning()) {
            if (jumpAction.time >= 1.55) {
                jumpAction.time = 1.55;
            }
        }

        // Landing condition on current ground surface (floor or box top)
        if (py <= targetGroundY) {
            py = targetGroundY;
            velY = 0;
            isGrounded = true;
            justLanded = true;

            // Frame 40 (1.6667s) Touchdown sync: play recovery crouch (frames 40-48) on surface
            if (jumpAction) {
                jumpAction.setEffectiveTimeScale(1.0); // Reset to normal rate for touchdown recovery
                jumpAction.time = 1.6667; // Force exact touchdown frame (Frame 40)
                jumpAction.fadeOut(0.30); // Play impact recovery crouch (frames 40-48) on ground
            }
        }
    } else {
        // If grounded player steps off an obstacle edge, trigger gravity falloff
        if (py > targetGroundY + 0.1) {
            isGrounded = false;
            velY = 0; // Start falling under gravity
        } else {
            py = targetGroundY;
        }
    }

    playerGroup.position.set(px, py, pz);

    // Ground shadow rests on current surface (floor or box top), scales with elevation
    pShadow.position.set(px, targetGroundY + 0.6, pz);

    const elevation = Math.max(0, py - targetGroundY);
    const shadowFactor = THREE.MathUtils.clamp(1.0 - (elevation / 70.0) * 0.45, 0.55, 1.0);
    pShadow.scale.set(shadowFactor, shadowFactor, 1.0);
    pShadow.material.opacity = THREE.MathUtils.clamp(0.5 - (elevation / 70.0) * 0.25, 0.25, 0.5);

    /* ── 5. Calculate actual displacement speed ─────────────── */
    const actualDx = px - prevX;
    const actualDz = pz - prevZ;
    const actualSpeed = Math.sqrt(actualDx * actualDx + actualDz * actualDz) / Math.max(dt, 0.0001);

    const isMoving = actualSpeed > MIN_WALK_SPEED;

    /* ── 6. Facing rotation ─────────────────────────────────── */
    if (isMoving || inputLen > 0) {
        const facingX = Math.abs(actualDx) > 0.01 ? actualDx : dirX;
        const facingZ = Math.abs(actualDz) > 0.01 ? actualDz : dirZ;

        if (facingX !== 0 || facingZ !== 0) {
            const targetAngle = Math.atan2(facingX, facingZ);
            let diff = targetAngle - playerGroup.rotation.y;
            while (diff >  Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            playerGroup.rotation.y += diff * Math.min(1, 14 * dt);
        }
    }

    /* ── 7. Locomotion Cross-Fade ───────────────────────────── */
    if (isGrounded) {
        if (justLanded) {
            if (isMoving) {
                if (idleAction) idleAction.fadeOut(WALK_FADE_IN);
                if (walkAction) walkAction.reset().fadeIn(WALK_FADE_IN).play();
                isWalking = true;
            } else {
                if (walkAction) walkAction.fadeOut(WALK_FADE_OUT);
                if (idleAction) idleAction.reset().fadeIn(WALK_FADE_OUT).play();
                isWalking = false;
            }
        } else if (isMoving && !isWalking) {
            // Transition: Idle → Walk
            if (idleAction) idleAction.fadeOut(WALK_FADE_IN);
            if (walkAction) walkAction.reset().fadeIn(WALK_FADE_IN).play();
            isWalking = true;

        } else if (!isMoving && isWalking) {
            // Transition: Walk → Idle
            if (walkAction) walkAction.fadeOut(WALK_FADE_OUT);
            if (idleAction) idleAction.reset().fadeIn(WALK_FADE_OUT).play();
            isWalking = false;
        }
    }

    // Dynamic locomotion animation playback rate matching physical movement speed
    if (walkAction && isWalking && isGrounded) {
        const timeScale = THREE.MathUtils.clamp((actualSpeed / PLAYER_SPEED) * WALK_ANIM_SPEED_MULT, 0.5, 1.7);
        walkAction.setEffectiveTimeScale(timeScale);
    }

    /* ── 8. Procedural Secondary Ponytail Physics (Additive Lag / Trailing Motion) ── */
    if (typeof updatePonytailPhysics === 'function') {
        updatePonytailPhysics(dt);
    }
}
