/* ───────────────────────────────────────────────
    INTERACTIVE GRASS LANDSCAPE (Camera Vision Frustum Span + Rolling Chunk Grid + GPU GLSL Shader)
    createGrassLandscape · updateGrassPhysics · updateRollingGrid
    Depends on: scene, PAL, WORLD_WIDTH, WORLD_DEPTH, getGroundHeight
─────────────────────────────────────────────── */

let grassInstancedMesh = null;
let maxGrassCount = 80000;

// Rolling Grid parameters (11x11 chunk grid = 4400x4400 total active span extending around camera)
const CHUNK_SIZE = 400;    // units per chunk square
const GRID_RADIUS = 5;     // 11x11 chunk grid (-5 to +5)
const GRID_DIM = GRID_RADIUS * 2 + 1; // 11
const TOTAL_CHUNKS = GRID_DIM * GRID_DIM; // 121
let activeGridX = null;
let activeGridZ = null;

// Shared uniforms for GPU GLSL shader deformation
const grassUniforms = {
    uPlayerPos: { value: new THREE.Vector3(0, -999, 0) },
    uCamPos: { value: new THREE.Vector3(0, 0, 0) },
    uCamDir: { value: new THREE.Vector3(0, 0, -1) },
    uHalfFovCos: { value: 0.1 },
    uTime: { value: 0 },
    uMaxVisDist: { value: 2800.0 },
    uBendRadius: { value: 24.0 }
};

/**
 * Deterministic 2D hash generator for consistent chunk pseudo-random seeding.
 */
function hash2D(cx, cz, index, seed = 0) {
    const n = Math.sin(cx * 12.9898 + cz * 78.233 + index * 43758.5453 + seed * 19.19) * 43758.5453;
    return n - Math.floor(n);
}

/**
 * Creates low-poly tapered grass blade geometry.
 * Pivot is anchored at the bottom (y=0) so bending rotates from the root.
 */
function createGrassBladeGeometry() {
    const w = 2.2;
    const h = 10.0;
    const taper = 0.25; // 75% narrower at top tip (1.0 - 0.75 = 0.25)

    const halfW = w / 2;
    const topHalfW = halfW * taper;

    // Offset for the 2nd ("fake") grass cluster placed slightly further
    const ox = 1.8;
    const oz = 1.8;

    // 2 Sets of 2 Crossing Quads (0° and 90°): 8 triangles, 16 vertices per instance
    const positions = new Float32Array([
        // --- Cluster 1 (Original at 0, 0, 0) ---
        // Quad 1A: along X-axis (0°)
        -halfW, 0, 0,
        halfW, 0, 0,
        -topHalfW, h, 0,
        topHalfW, h, 0,

        // Quad 1B: along Z-axis (90°)
        0, 0, -halfW,
        0, 0, halfW,
        0, h, -topHalfW,
        0, h, topHalfW,

        // --- Cluster 2 (Second grass tuft offset slightly further at ox, oz) ---
        // Quad 2A: along X-axis (0°)
        ox - halfW, 0, oz,
        ox + halfW, 0, oz,
        ox - topHalfW, h, oz,
        ox + topHalfW, h, oz,

        // Quad 2B: along Z-axis (90°)
        ox, 0, oz - halfW,
        ox, 0, oz + halfW,
        ox, h, oz - topHalfW,
        ox, h, oz + topHalfW
    ]);

    const indices = [
        // Cluster 1 (0, 0, 0)
        0, 1, 2, 2, 1, 3,    // Quad 1A
        4, 5, 6, 6, 5, 7,    // Quad 1B

        // Cluster 2 (ox, 0, oz)
        8, 9, 10, 10, 9, 11,  // Quad 2A
        12, 13, 14, 14, 13, 15  // Quad 2B
    ];

    // Attribute to identify Cluster 1 (0.0) vs Cluster 2 (1.0) for GPU Geo-Morphing
    const clusters = new Float32Array([
        0, 0, 0, 0, 0, 0, 0, 0,
        1, 1, 1, 1, 1, 1, 1, 1
    ]);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aCluster', new THREE.BufferAttribute(clusters, 1));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
}

/**
 * Seeds a single chunk cell (cx, cz) starting at instance offset baseIdx.
 */
function seedChunk(cx, cz, baseIdx, bladesPerChunk) {
    const originX = cx * CHUNK_SIZE - CHUNK_SIZE / 2;
    const originZ = cz * CHUNK_SIZE - CHUNK_SIZE / 2;
    const matArray = grassInstancedMesh.instanceMatrix.array;

    for (let i = 0; i < bladesPerChunk; i++) {
        const idx = baseIdx + i;
        if (idx >= maxGrassCount) break;

        const offX = hash2D(cx, cz, i, 1) * CHUNK_SIZE;
        const offZ = hash2D(cx, cz, i, 2) * CHUNK_SIZE;
        const gx = originX + offX;
        const gz = originZ + offZ;

        const rawGy = typeof getGroundHeight === 'function' ? getGroundHeight(gx, gz) : 0;
        const gy = rawGy > 5 ? 0 : rawGy;

        const rotY = hash2D(cx, cz, i, 3) * Math.PI * 2;
        const baseScale = 0.85 + hash2D(cx, cz, i, 4) * 1.55;

        // Direct 4x4 matrix write into Float32Array (bypasses Object3D math & allocations)
        const c = Math.cos(rotY) * baseScale;
        const s = Math.sin(rotY) * baseScale;
        const m = idx * 16;

        matArray[m] = c;
        matArray[m + 1] = 0;
        matArray[m + 2] = -s;
        matArray[m + 3] = 0;

        matArray[m + 4] = 0;
        matArray[m + 5] = baseScale;
        matArray[m + 6] = 0;
        matArray[m + 7] = 0;

        matArray[m + 8] = s;
        matArray[m + 9] = 0;
        matArray[m + 10] = c;
        matArray[m + 11] = 0;

        matArray[m + 12] = gx;
        matArray[m + 13] = gy;
        matArray[m + 14] = gz;
        matArray[m + 15] = 1;
    }
}

/**
 * Recalculates and re-seeds chunks starting from camera ground position (camX, camZ).
 */
function updateRollingGrid(camX, camZ, camDirX = 0, camDirZ = -1) {
    if (!grassInstancedMesh) return;

    // Center grid deep along camera vision frustum (+1.5 * CHUNK_SIZE forward)
    const forwardPx = camX + camDirX * (CHUNK_SIZE * 1.5);
    const forwardPz = camZ + camDirZ * (CHUNK_SIZE * 1.5);

    const currentChunkX = Math.floor((forwardPx + CHUNK_SIZE / 2) / CHUNK_SIZE);
    const currentChunkZ = Math.floor((forwardPz + CHUNK_SIZE / 2) / CHUNK_SIZE);

    if (currentChunkX === activeGridX && currentChunkZ === activeGridZ) {
        return; // Still in the same chunk cell
    }

    activeGridX = currentChunkX;
    activeGridZ = currentChunkZ;

    // Uniform blade allocation per chunk across the rolling grid
    const bladesPerChunk = Math.floor(maxGrassCount / TOTAL_CHUNKS);
    let baseIdx = 0;
    const matArray = grassInstancedMesh.instanceMatrix.array;

    for (let cx = currentChunkX - GRID_RADIUS; cx <= currentChunkX + GRID_RADIUS; cx++) {
        for (let cz = currentChunkZ - GRID_RADIUS; cz <= currentChunkZ + GRID_RADIUS; cz++) {
            seedChunk(cx, cz, baseIdx, bladesPerChunk);
            baseIdx += bladesPerChunk;
        }
    }

    // Zero out any remaining instance slots at the end of the buffer
    for (let idx = baseIdx; idx < maxGrassCount; idx++) {
        const m = idx * 16;
        for (let k = 0; k < 16; k++) {
            matArray[m + k] = 0;
        }
    }

    grassInstancedMesh.instanceMatrix.needsUpdate = true;
}

/**
 * Initializes the InstancedMesh grass landscape across the world floor.
 */
function createGrassLandscape(count = 5000) {
    // Remove existing grass mesh if present
    if (grassInstancedMesh) {
        scene.remove(grassInstancedMesh);
        if (grassInstancedMesh.geometry) grassInstancedMesh.geometry.dispose();
        if (grassInstancedMesh.material) grassInstancedMesh.material.dispose();
        grassInstancedMesh = null;
    }

    if (count <= 0) {
        return;
    }

    maxGrassCount = count;
    activeGridX = null;
    activeGridZ = null;

    const geo = createGrassBladeGeometry();

    const mat = new THREE.MeshStandardMaterial({
        color: PAL.grass || 0xf0c830,
        roughness: 0.7,
        metalness: 0.1,
        side: THREE.DoubleSide,
        shadowSide: THREE.DoubleSide
    });

    function applyGrassShader(shader, isDepth = false) {
        shader.uniforms.uPlayerPos = grassUniforms.uPlayerPos;
        shader.uniforms.uCamPos = grassUniforms.uCamPos;
        shader.uniforms.uCamDir = grassUniforms.uCamDir;
        shader.uniforms.uHalfFovCos = grassUniforms.uHalfFovCos;
        shader.uniforms.uTime = grassUniforms.uTime;
        shader.uniforms.uMaxVisDist = grassUniforms.uMaxVisDist;
        shader.uniforms.uBendRadius = grassUniforms.uBendRadius;

        shader.vertexShader = `
            attribute float aCluster;
            uniform vec3 uPlayerPos;
            uniform vec3 uCamPos;
            uniform vec3 uCamDir;
            uniform float uHalfFovCos;
            uniform float uTime;
            uniform float uMaxVisDist;
            uniform float uBendRadius;
        ` + shader.vertexShader;

        const shadowCutoffChunk = isDepth ? `
            if (distToCam > 1400.0) {
                fadeAlpha = 0.0;
            }
            transformed *= fadeAlpha;
        ` : `
            transformed *= fadeAlpha;
        `;

        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>

            #ifdef USE_INSTANCING
                vec4 instWorldPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
            #else
                vec4 instWorldPos = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
            #endif

            // Vector and distance from CAMERA ground position to instance root
            vec2 dirFromCam = instWorldPos.xz - uCamPos.xz;
            float distToCam = length(dirFromCam);
            float distToPlayer = length(instWorldPos.xz - uPlayerPos.xz);

            // GPU Geo-Morphing LOD: Near (<300) full double-tuft (8 tri / 16 vert); Far (>300) single-tuft (4 tri)
            if (aCluster > 0.5) {
                float c2Scale = smoothstep(300.0, 50.0, distToCam);
                vec3 c2Center = vec3(1.8, 0.0, 1.8);
                transformed = c2Center + (transformed - c2Center) * c2Scale;
            }

            // ───────────────────────────────────────────────
            // UNIFIED VISION FRUSTUM & DISTANCE DISSOLVE
            // ───────────────────────────────────────────────
            float fadeAlpha = 1.0;

            if (distToCam > 10.0) {
                vec2 normDir = dirFromCam / distToCam;
                float dotCam = dot(normDir, uCamDir.xz);

                // Horizontal FOV cone angle check with smooth edge margin fade
                if (dotCam < uHalfFovCos) {
                    float fovFade = clamp((dotCam - (uHalfFovCos - 0.20)) / 0.20, 0.0, 1.0);
                    fadeAlpha *= fovFade;
                }

                // Smooth distance dissolve curve towards uMaxVisDist
                if (distToCam > uMaxVisDist) {
                    fadeAlpha = 0.0;
                } else if (distToCam > uMaxVisDist * 0.75) {
                    float t = (distToCam - uMaxVisDist * 0.75) / (uMaxVisDist * 0.25);
                    fadeAlpha *= (1.0 - smoothstep(0.0, 1.0, t));
                }
            }

            ${shadowCutoffChunk}

            // Height-based influence factor (0 at root y=0, 1 at top tip y=10)
            float heightFactor = clamp(position.y / 10.0, 0.0, 1.0);

            // GPU Ambient Wind Sway
            float windSway = sin(uTime * 2.8 + instWorldPos.x * 0.08 + instWorldPos.z * 0.08) * 0.45 * heightFactor;
            transformed.x += windSway;

            // GPU Player Collision Bending Force (from player feet)
            if (distToPlayer < uBendRadius && abs(instWorldPos.y - uPlayerPos.y) < 25.0) {
                vec2 pushDir = normalize(instWorldPos.xz - uPlayerPos.xz + vec2(0.0001));
                float bendFactor = (1.0 - distToPlayer / uBendRadius) * 4.5 * heightFactor;
                transformed.x += pushDir.x * bendFactor;
                transformed.z += pushDir.y * bendFactor;
                transformed.y -= bendFactor * 0.3; // Slight downward displacement when bent over
            }
            `
        );
    }

    mat.onBeforeCompile = function (shader) {
        applyGrassShader(shader, false);
    };

    grassInstancedMesh = new THREE.InstancedMesh(geo, mat, count);
    grassInstancedMesh.castShadow = true;
    grassInstancedMesh.receiveShadow = true;

    // Custom depth material for shadow pass (culls shadow map rendering beyond 1400 units)
    const customDepthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    customDepthMat.onBeforeCompile = function (shader) {
        applyGrassShader(shader, true);
    };
    grassInstancedMesh.customDepthMaterial = customDepthMat;

    // Initial grid seed centered at (0, 0)
    updateRollingGrid(0, 0, 0, -1);

    scene.add(grassInstancedMesh);
}

/**
 * Updates GPU GLSL Shader Uniforms & Rolling Grid each frame.
 */
function updateGrassPhysics(px, py, pz, dt, time) {
    if (!grassInstancedMesh) return;

    // Calculate camera look vector (pointing from camera through player into the forward view)
    const yawRad = THREE.MathUtils.degToRad(typeof camYawDeg !== 'undefined' ? camYawDeg : 0);
    const camDirX = -Math.sin(yawRad);
    const camDirZ = -Math.cos(yawRad);

    // Get camera ground coordinates
    const camX = typeof camera !== 'undefined' ? camera.position.x : px;
    const camZ = typeof camera !== 'undefined' ? camera.position.z : pz;

    // Calculate horizontal half-FOV angle cosine with edge margin
    const vertFovRad = THREE.MathUtils.degToRad(typeof camFov !== 'undefined' ? camFov : 45);
    const aspectVal = typeof aspect !== 'undefined' ? aspect : (window.innerWidth / window.innerHeight);
    const halfHovRad = Math.atan(Math.tan(vertFovRad / 2) * aspectVal);
    const halfFovCos = Math.cos(halfHovRad + 0.10);

    // Pass camera position, direction & FOV cosine to GLSL shader & update rolling grid
    grassUniforms.uCamPos.value.set(camX, 0, camZ);
    grassUniforms.uCamDir.value.set(camDirX, 0, camDirZ);
    grassUniforms.uHalfFovCos.value = halfFovCos;

    updateRollingGrid(camX, camZ, camDirX, camDirZ);

    // Update GLSL Uniforms on the material
    grassUniforms.uPlayerPos.value.set(px, py, pz);
    grassUniforms.uTime.value = time;

    if (typeof maxVisDist !== 'undefined' && maxVisDist < 10000) {
        grassUniforms.uMaxVisDist.value = maxVisDist;
    } else {
        grassUniforms.uMaxVisDist.value = 2800.0;
    }
}

// Auto-initialize default grass landscape on script load
createGrassLandscape(80000);
