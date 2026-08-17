/* ───────────────────────────────────────────────
    COLLISION HELPERS
    getPlayerAABB · testCollision
    Depends on: obstacles[] (world.js), PLAYER_RADIUS, PLAYER_HEIGHT
─────────────────────────────────────────────── */

// Reusable static Box3 container to eliminate per-frame allocations
const _playerBox = new THREE.Box3();

/**
 * Returns 3D AABB bounding box for player taking current (px, py, pz) into account.
 * Reuses static _playerBox instance to prevent GC memory allocations.
 */
function getPlayerAABB(px, py = 0, pz = 0) {
    _playerBox.min.set(px - PLAYER_RADIUS, py,                 pz - PLAYER_RADIUS);
    _playerBox.max.set(px + PLAYER_RADIUS, py + PLAYER_HEIGHT,  pz + PLAYER_RADIUS);
    return _playerBox;
}

/**
 * Tests 3D AABB collision against scene obstacles at player position (px, py, pz).
 * Ignores obstacles if player's feet (py) are standing at or above the obstacle's top surface.
 */
function testCollision(px, py = 0, pz = 0) {
    const pBox = getPlayerAABB(px, py, pz);
    const EPSILON = 0.5; // Height tolerance for standing on top of surfaces

    for (let i = 0; i < obstacles.length; i++) {
        const obsBox = obstacles[i].box;

        // Skip side wall collision if player's feet are at or above the top of this obstacle
        if (py >= obsBox.max.y - EPSILON) {
            continue;
        }

        if (pBox.intersectsBox(obsBox)) return true;
    }
    return false;
}

