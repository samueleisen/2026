/* ───────────────────────────────────────────────
    WORLD GEOMETRY  (modern 3D lighted version)
    Floor · Border Walls · Obstacles · Ambient Dots
─────────────────────────────────────────────── */

/* ── Floor ─────────────────────────────────── */
// Using a smooth 2-color Z-axis gradient standard material on a circular ground plane
const floorGeo = new THREE.CircleGeometry(WORLD_RADIUS, 128);
const colorPos = new THREE.Color(PAL.floorPosZ);
const colorNeg = new THREE.Color(PAL.floorNegZ);
const posAttr = floorGeo.attributes.position;
const floorColors = new Float32Array(posAttr.count * 3);
const _tempColor = new THREE.Color();

for (let i = 0; i < posAttr.count; i++) {
    // Local circle plane Y maps to world Z when rotated by -PI/2 (local -Y is world +Z, local +Y is world -Z)
    const ly = posAttr.getY(i);
    const t = Math.max(0, Math.min(1, 0.5 - ly / (WORLD_RADIUS * 2))); // t = 0.0 at neg Z -> 1.0 at pos Z
    _tempColor.copy(colorNeg).lerp(colorPos, t);
    floorColors[i * 3] = _tempColor.r;
    floorColors[i * 3 + 1] = _tempColor.g;
    floorColors[i * 3 + 2] = _tempColor.b;
}
floorGeo.setAttribute('color', new THREE.BufferAttribute(floorColors, 3));

const floorMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.DoubleSide
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

/* ── Border Walls removed for infinite procedural world ── */

/* ── Obstacles ── */
const obstacles = []; // { mesh, box } — consumed by collision.js

/* ── Enhanced Low-Poly Monuments & Procedural Spawner Loop ── */
const animatedMonuments = []; // { crystal, rings } — consumed by loop.js

function createTallMonolith(x, z) {
    const group = new THREE.Group();

    // ── 1. Complex Low-Poly Rock Footer Structure ──
    const rockMat = new THREE.MeshStandardMaterial({
        color: 0x2b2d3d,
        roughness: 0.9,
        metalness: 0.1,
        flatShading: true
    });

    // Central Main Base Ring
    const base1Geo = new THREE.CylinderGeometry(140, 180, 40, 8);
    const base1 = new THREE.Mesh(base1Geo, rockMat);
    base1.position.y = 20;
    base1.castShadow = true;
    base1.receiveShadow = true;
    group.add(base1);

    // Ring of Jagged Low-Poly Rock Clusters / Boulders surrounding the footer
    const rockCount = 8;
    for (let i = 0; i < rockCount; i++) {
        const angle = (i / rockCount) * Math.PI * 2 + (i % 2 === 0 ? 0.2 : -0.1);
        const radius = 130 + (i % 3) * 25;
        const rx = Math.cos(angle) * radius;
        const rz = Math.sin(angle) * radius;

        // Irregular faceted rock geometry (dodecahedron with random scaling)
        const rockGeo = new THREE.DodecahedronGeometry(35 + (i % 4) * 12, 0);
        const rockMesh = new THREE.Mesh(rockGeo, rockMat);
        rockMesh.position.set(rx, 18 + (i % 2) * 8, rz);
        rockMesh.rotation.set(
            (i * 0.7) % 1.5,
            (i * 1.3) % 3.14,
            (i * 0.9) % 1.2
        );
        rockMesh.scale.set(
            1.0 + (i % 3) * 0.4,
            1.2 + (i % 2) * 0.6,
            0.9 + (i % 4) * 0.3
        );
        rockMesh.castShadow = true;
        rockMesh.receiveShadow = true;
        group.add(rockMesh);
    }

    // Secondary Inner Stepped Pedestal
    const base2Geo = new THREE.CylinderGeometry(95, 125, 35, 8);
    const base2 = new THREE.Mesh(base2Geo, rockMat);
    base2.position.y = 50;
    base2.castShadow = true;
    base2.receiveShadow = true;
    group.add(base2);

    // ── 2. Main Obelisk Shaft with Emissive Glowing Insets ──
    const shaftGeo = new THREE.CylinderGeometry(40, 75, 460, 8);
    const shaftMat = new THREE.MeshStandardMaterial({
        color: 0x4d3e58,
        emissive: 0x1a2e47,
        emissiveIntensity: 0.5,
        roughness: 0.6,
        flatShading: true
    });
    const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
    shaftMesh.position.y = 65 + 230;
    shaftMesh.castShadow = true;
    shaftMesh.receiveShadow = true;
    group.add(shaftMesh);

    // ── 3. Glowing Inner Core Pillar ──
    const coreGeo = new THREE.CylinderGeometry(18, 18, 480, 8);
    const coreMat = new THREE.MeshStandardMaterial({
        color: 0x00e1ff,
        emissive: 0x00b4ff,
        emissiveIntensity: 1.6,
        roughness: 0.15
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = 65 + 240;
    group.add(coreMesh);

    // ── 4. Floating Rotating Diamond Crystal Spire Cap ──
    const crystalGeo = new THREE.OctahedronGeometry(45, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
        color: 0x70f0ff,
        emissive: 0x00c8ff,
        emissiveIntensity: 1.2,
        roughness: 0.15,
        metalness: 0.3,
        flatShading: true
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 65 + 460 + 65;
    crystal.scale.set(1.0, 1.8, 1.0); // Tall octahedron crystal
    crystal.castShadow = true;
    group.add(crystal);

    // ── 5. Multiple Concentric Glowing Blue Energy Rings ──
    const rings = [];

    // Helper to build glowing blue torus ring
    function createBlueRing(radius, tube, yPos, colorHex, emissiveHex, speed, oscAmp) {
        const rGeo = new THREE.TorusGeometry(radius, tube, 8, 20);
        const rMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            emissive: emissiveHex,
            emissiveIntensity: 2.0,
            roughness: 0.1
        });
        const rMesh = new THREE.Mesh(rGeo, rMat);
        rMesh.rotation.x = Math.PI / 2;
        rMesh.position.y = yPos;
        group.add(rMesh);

        rings.push({
            mesh: rMesh,
            baseY: yPos,
            speed: speed,
            oscAmp: oscAmp
        });
    }

    // Lower Blue Ring (Large, slower counter-spin)
    createBlueRing(78, 6, 65 + 160, 0x00aaff, 0x0088ff, -0.6, 10);

    // Mid Blue Ring (Vibrant cyan, main spin)
    createBlueRing(62, 7, 65 + 310, 0x00f0ff, 0x00d0ff, 0.9, 14);

    // Upper Cyan Ring (Smaller high-tier ring, fast spin)
    createBlueRing(46, 5, 65 + 430, 0x80f5ff, 0x00e1ff, -1.2, 8);

    group.scale.set(3.0, 3.0, 3.0);
    group.position.set(x, 0, z);
    scene.add(group);

    // Register for animation loop in loop.js
    animatedMonuments.push({
        group,
        crystal,
        rings
    });

    // Register collision box & horizon sink tracking
    group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(base1);
    obstacles.push({ mesh: base1, box });

    if (typeof registerHorizonObject === 'function') {
        registerHorizonObject(group);
    }
}

// Procedural Monument Object Spawner Loop across the Infinite World
function spawnMonumentGrid() {
    const locations = [
        { x: 0, z: -3000 },
        { x: 6000, z: 6000 },
        { x: -6000, z: 6000 },
        { x: 12000, z: -12000 },
        { x: -12000, z: -12000 },
        { x: 0, z: 12000 },
        { x: -14000, z: 0 },
        { x: 14000, z: 0 }
    ];

    locations.forEach(loc => createTallMonolith(loc.x, loc.z));
}

// Spawn world assets
spawnMonumentGrid();



