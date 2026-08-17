/* ───────────────────────────────────────────────
    CAMERA CONTROLS  (resize + UI panel + mouse & pointer-lock orbiting)
    Depends on: scene.js (initCamera, camera, renderer, aspect)
                constants.js (camAngleDeg, camYawDeg, camFov, camHeight)
                input.js (keys)
─────────────────────────────────────────────── */

/* ── Resize Handler ───────────────────────────── */
window.addEventListener('resize', () => {
    aspect = window.innerWidth / window.innerHeight;
    if (camera) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ── Camera Controls UI Sync ─────────────────── */
const ctrlGrassDensity = document.getElementById('ctrl-grass-density');

if (ctrlGrassDensity) {
    ctrlGrassDensity.addEventListener('change', () => {
        const density = parseInt(ctrlGrassDensity.value, 10);
        if (typeof createGrassLandscape === 'function') {
            createGrassLandscape(density);
        }
    });
}

const ctrlPlayerSpeed = document.getElementById('ctrl-player-speed');
const valPlayerSpeed = document.getElementById('val-player-speed');
if (ctrlPlayerSpeed && valPlayerSpeed) {
    ctrlPlayerSpeed.addEventListener('input', (e) => {
        PLAYER_SPEED = parseFloat(e.target.value);
        valPlayerSpeed.textContent = Math.round(PLAYER_SPEED);
    });
}

/* ── Mouse Movement & Drag Orbit Controls ────── */
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;

// Enable Pointer Lock on Canvas Click (optional 3D mouse look mode)
renderer.domElement.addEventListener('click', (e) => {
    // Only lock pointer if not clicking UI panels
    if (e.target.closest('#camera-panel') || e.target.closest('#ui-overlay')) return;
    if (document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock();
    }
});

// Drag Orbit handling (works both with pointer lock and drag-click)
window.addEventListener('mousedown', (e) => {
    if (e.target.closest('#camera-panel') || e.target.closest('#ui-overlay')) return;
    isDragging = true;
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
});

window.addEventListener('mousemove', (e) => {
    let deltaX = 0;
    let deltaY = 0;

    if (document.pointerLockElement === renderer.domElement) {
        // Pointer Lock Active: direct mouse movement
        deltaX = e.movementX;
        deltaY = e.movementY;
    } else if (isDragging) {
        // Drag Orbit Active: cursor movement delta
        deltaX = e.clientX - previousMouseX;
        deltaY = e.clientY - previousMouseY;
        previousMouseX = e.clientX;
        previousMouseY = e.clientY;
    } else {
        return;
    }

    // Horizontal Yaw (0° to 360°) — reversed axis
    camYawDeg = (camYawDeg - deltaX * 0.35) % 360;
    if (camYawDeg < 0) camYawDeg += 360;

    // Vertical Tilt Pitch (clamped between 5° and 135°) — reversed axis
    camAngleDeg = THREE.MathUtils.clamp(camAngleDeg - deltaY * 0.25, 5, 135);
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

/* ── Bootstrap ───────────────────────────────── */
initCamera();
