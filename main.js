/**
 * -------------------------------------------------------------
 * Developed by [Samuel Eisen]
 * Portfolio: https://github.com/samown/2026
 * Copyright (c) 2026 [samown]. All rights reserved.
 * -------------------------------------------------------------
 */

/* ───────────────────────────────────────────────
    SECTION 1: CONSTANTS & PALETTE
─────────────────────────────────────────────── */
const WORLD_WIDTH = 5000;
const WORLD_DEPTH = 5000;
const WORLD_RADIUS = WORLD_WIDTH / 2; // 3000 units ground radius
const HALF_WIDTH = WORLD_WIDTH / 2;
const HALF_DEPTH = WORLD_DEPTH / 2;
let PLAYER_SPEED = 120;          // units/sec max speed
const PLAYER_ACCEL = 1200;          // units/sec² acceleration
const PLAYER_FRICTION = 16;         // deceleration damping factor
const PLAYER_RADIUS = 10;           // collision half-width
const PLAYER_HEIGHT = 24;
const JUMP_POWER = 120;           // initial vertical jump velocity (units/sec)
const JUMP_GRAVITY = 180;         // gravity acceleration (units/sec²) — 40 frames / 1.6667s airtime

// Mutable Render State (controlled via UI)
let maxVisDist = 99999;               // max view distance units

// Horizon Curvature & Distance Sink Parameters (Easy to adjust)
let HORIZON_SINK_START = 3500;        // Distance units where objects start shrinking & sinking
let HORIZON_SINK_END = 16000;       // Extended distance range for much slower/gradual transition
let HORIZON_MAX_SINK = 360;         // Downward displacement below ground
let HORIZON_MIN_SCALE = 0.0;         // Minimum scale at max distance

// Mutable Camera State
let camAngleDeg = 75;
let camYawDeg = 180;                 // horizontal camera rotation angle (degrees)
let camHeight = 150;
let camFov = 50;

const PAL = {
    bg: 0x1a1a2e,
    floorPosZ: 0xfff04f, // Positive Z Ground Color (Bright Golden Yellow)
    floorNegZ: 0x665105, // Negative Z Ground Color (Dark Yellow-Brown)
    grass: 0xf0c830,     // Golden Yellow Grass
    shadow: 0x0e0e1a,
};


/* ───────────────────────────────────────────────
    SECTION 2: PERFORMANCE MONITORING SYSTEM
─────────────────────────────────────────────── */
class PerformanceBuffer {
    constructor(bufferSize = 120) {
        this.size = bufferSize;
        this.buffer = new Float32Array(bufferSize);
        this.index = 0;
        this.count = 0;

        this.hudEl = null;
        this.fpsEl = null;
        this.avgMsEl = null;
        this.spikeMsEl = null;
        this.diffEl = null;

        this.updateInterval = 10; // Update HUD DOM every 10 frames
        this.frameCounter = 0;

        this.baselineAvgMs = null;
    }

    initHUD(containerId = 'perf-hud') {
        this.hudEl = document.getElementById(containerId);
        if (this.hudEl) {
            this.fpsEl = this.hudEl.querySelector('.perf-fps');
            this.avgMsEl = this.hudEl.querySelector('.perf-avg');
            this.spikeMsEl = this.hudEl.querySelector('.perf-spike');
            this.diffEl = this.hudEl.querySelector('.perf-diff');

            const btnSet = document.getElementById('btn-set-baseline');
            if (btnSet) btnSet.addEventListener('click', () => this.setBaseline());

            const btnReset = document.getElementById('btn-reset-baseline');
            if (btnReset) btnReset.addEventListener('click', () => this.resetBaseline());
        }
    }

    record(frameTimeMs) {
        this.buffer[this.index] = frameTimeMs;
        this.index = (this.index + 1) % this.size;
        if (this.count < this.size) this.count++;

        this.frameCounter++;
        if (this.frameCounter >= this.updateInterval) {
            this.frameCounter = 0;
            this.updateHUD();
        }
    }

    getStats() {
        if (this.count === 0) return { fps: 0, avgMs: 0, maxMs: 0, minMs: 0, p99Ms: 0 };

        let sum = 0;
        let maxMs = 0;
        let minMs = Infinity;

        const samples = new Float32Array(this.count);

        for (let i = 0; i < this.count; i++) {
            const val = this.buffer[i];
            sum += val;
            samples[i] = val;
            if (val > maxMs) maxMs = val;
            if (val < minMs) minMs = val;
        }

        const avgMs = sum / this.count;
        const fps = avgMs > 0 ? 1000 / avgMs : 0;

        samples.sort();
        const p99Index = Math.min(Math.floor(this.count * 0.99), this.count - 1);
        const p99Ms = samples[p99Index];

        return { fps, avgMs, maxMs, minMs, p99Ms };
    }

    setBaseline() {
        const stats = this.getStats();
        this.baselineAvgMs = stats.avgMs;
        if (this.diffEl) {
            this.diffEl.textContent = 'SET (' + this.baselineAvgMs.toFixed(1) + 'ms)';
            this.diffEl.style.color = '#5cf0a0';
        }
    }

    resetBaseline() {
        this.baselineAvgMs = null;
        if (this.diffEl) {
            this.diffEl.textContent = 'NONE';
            this.diffEl.style.color = '#888';
        }
    }

    updateHUD() {
        if (!this.hudEl) this.initHUD();
        if (!this.hudEl) return;

        const stats = this.getStats();

        if (this.fpsEl) this.fpsEl.textContent = Math.round(stats.fps);
        if (this.avgMsEl) this.avgMsEl.textContent = stats.avgMs.toFixed(1) + 'ms';
        if (this.spikeMsEl) this.spikeMsEl.textContent = stats.p99Ms.toFixed(1) + 'ms';

        if (this.diffEl) {
            if (this.baselineAvgMs !== null) {
                const diff = stats.avgMs - this.baselineAvgMs;
                const sign = diff >= 0 ? '+' : '';
                this.diffEl.textContent = `${sign}${diff.toFixed(2)}ms`;
                if (diff > 1.0) {
                    this.diffEl.style.color = '#ff6b6b'; // Slower
                } else if (diff < -0.5) {
                    this.diffEl.style.color = '#5cf0a0'; // Faster
                } else {
                    this.diffEl.style.color = '#c8ffc8'; // Neutral
                }
            } else {
                this.diffEl.textContent = '--';
                this.diffEl.style.color = '#888';
            }
        }
    }
}

const perfMonitor = new PerformanceBuffer(120);


/* ───────────────────────────────────────────────
    SECTION 3: AMBIENT AUDIO SYSTEM
─────────────────────────────────────────────── */
let windAudio = null;
let isAudioInitialized = false;
let windVolume = 0.05;
let isMuted = false;

function initAudio() {
    if (windAudio) return;

    windAudio = new Audio('WIND-SFX.mp3');
    windAudio.loop = true;
    windAudio.volume = isMuted ? 0 : windVolume;

    windAudio.addEventListener('error', () => {
        if (windAudio.src.includes('WIND-SFX.mp3')) {
            windAudio.src = 'wind-sfx.mp3';
            if (isAudioInitialized && !isMuted) windAudio.play();
        }
    });

    const startAudio = () => {
        if (!windAudio) return;
        windAudio.play().then(() => {
            isAudioInitialized = true;
            updateAudioUI();
        }).catch(err => {
            console.warn("Audio play deferred until user interaction:", err);
        });

        window.removeEventListener('pointerdown', startAudio);
        window.removeEventListener('keydown', startAudio);
        window.removeEventListener('touchstart', startAudio);
    };

    window.addEventListener('pointerdown', startAudio);
    window.addEventListener('keydown', startAudio);
    window.addEventListener('touchstart', startAudio);

    setupAudioControls();
}

function setupAudioControls() {
    const sliderVol = document.getElementById('ctrl-wind-vol');
    const valVol = document.getElementById('val-wind-vol');
    const chkMute = document.getElementById('ctrl-wind-mute');

    if (sliderVol && valVol) {
        sliderVol.addEventListener('input', (e) => {
            windVolume = parseFloat(e.target.value);
            valVol.textContent = Math.round(windVolume * 100) + '%';
            if (windAudio && !isMuted) {
                windAudio.volume = windVolume;
            }
        });
    }

    if (chkMute) {
        chkMute.addEventListener('change', (e) => {
            isMuted = e.target.checked;
            if (windAudio) {
                windAudio.volume = isMuted ? 0 : windVolume;
            }
        });
    }
}

function updateAudioUI() {
    const statusEl = document.getElementById('wind-audio-status');
    if (statusEl) {
        statusEl.textContent = isAudioInitialized ? 'Active (Looping)' : 'Click to enable audio';
        statusEl.style.color = isAudioInitialized ? '#5cf0a0' : '#ffb050';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAudio);
} else {
    initAudio();
}


/* ───────────────────────────────────────────────
    SECTION 4: THREE.JS SCENE, LIGHTS & CAMERA
─────────────────────────────────────────────── */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(PAL.bg);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
dirLight.position.set(0, 2500, -5000);
dirLight.castShadow = true;

dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.left = -2000;
dirLight.shadow.camera.right = 2000;
dirLight.shadow.camera.top = 2000;
dirLight.shadow.camera.bottom = -2000;
dirLight.shadow.camera.near = 100;
dirLight.shadow.camera.far = 9000;
dirLight.shadow.bias = -0.0002;
dirLight.shadow.camera.updateProjectionMatrix();
scene.add(dirLight);
scene.add(dirLight.target);

let aspect = window.innerWidth / window.innerHeight;
let camera;

function initCamera() {
    camera = new THREE.PerspectiveCamera(camFov, aspect, 10, 16000);
}


/* ───────────────────────────────────────────────
    SECTION 5: HORIZON SINK & DISTANCE SCALE MANAGER
─────────────────────────────────────────────── */
const horizonTrackedObjects = [];

function registerHorizonObject(obj, customBaseScale = null, customBaseY = null) {
    if (!obj) return;

    const baseScale = customBaseScale !== null
        ? (typeof customBaseScale === 'number' ? new THREE.Vector3(customBaseScale, customBaseScale, customBaseScale) : customBaseScale.clone())
        : obj.scale.clone();

    const baseY = customBaseY !== null ? customBaseY : obj.position.y;

    horizonTrackedObjects.push({
        obj,
        baseScale,
        baseY
    });
}

function updateHorizonDisplacement(camX, camZ, playerY = 0) {
    if (horizonTrackedObjects.length === 0) return;

    const range = Math.max(1, HORIZON_SINK_END - HORIZON_SINK_START);
    const groundY = typeof getGroundHeight === 'function' ? getGroundHeight(camX, camZ) : 0;
    const airHeight = Math.max(0, playerY - groundY);

    for (let i = 0; i < horizonTrackedObjects.length; i++) {
        const item = horizonTrackedObjects[i];
        const obj = item.obj;

        const ox = obj.position.x;
        const oz = obj.position.z;

        const dx = ox - camX;
        const dz = oz - camZ;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist <= HORIZON_SINK_START) {
            obj.scale.copy(item.baseScale);
            obj.position.y = item.baseY;
            obj.visible = true;
        } else {
            const t = Math.min(1.0, (dist - HORIZON_SINK_START) / range);
            const currentScaleFactor = THREE.MathUtils.lerp(1.0, HORIZON_MIN_SCALE, t);
            const sinkY = Math.pow(t, 0.90) * HORIZON_MAX_SINK;
            const jumpCounterY = airHeight * Math.pow(t, 1.2) * 5;

            if (currentScaleFactor <= 0.001) {
                obj.visible = false;
            } else {
                obj.visible = true;
                obj.scale.set(
                    item.baseScale.x * currentScaleFactor,
                    item.baseScale.y * currentScaleFactor,
                    item.baseScale.z * currentScaleFactor
                );
                obj.position.y = item.baseY - sinkY - jumpCounterY;
            }
        }
    }
}


/* ───────────────────────────────────────────────
    SECTION 6: WORLD GEOMETRY & MONUMENTS
─────────────────────────────────────────────── */
const floorGeo = new THREE.CircleGeometry(WORLD_RADIUS, 128);
const colorPos = new THREE.Color(PAL.floorPosZ);
const colorNeg = new THREE.Color(PAL.floorNegZ);
const posAttr = floorGeo.attributes.position;
const floorColors = new Float32Array(posAttr.count * 3);
const _tempColor = new THREE.Color();

for (let i = 0; i < posAttr.count; i++) {
    const ly = posAttr.getY(i);
    const t = Math.max(0, Math.min(1, 0.5 - ly / (WORLD_RADIUS * 2)));
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

const obstacles = [];
const animatedMonuments = [];

function createTallMonolith(x, z) {
    const group = new THREE.Group();

    const rockMat = new THREE.MeshStandardMaterial({
        color: 0x2b2d3d,
        roughness: 0.9,
        metalness: 0.1,
        flatShading: true
    });

    const base1Geo = new THREE.CylinderGeometry(140, 180, 40, 8);
    const base1 = new THREE.Mesh(base1Geo, rockMat);
    base1.position.y = 20;
    base1.castShadow = true;
    base1.receiveShadow = true;
    group.add(base1);

    const rockCount = 8;
    for (let i = 0; i < rockCount; i++) {
        const angle = (i / rockCount) * Math.PI * 2 + (i % 2 === 0 ? 0.2 : -0.1);
        const radius = 130 + (i % 3) * 25;
        const rx = Math.cos(angle) * radius;
        const rz = Math.sin(angle) * radius;

        const rockGeo = new THREE.DodecahedronGeometry(35 + (i % 4) * 12, 0);
        const rockMesh = new THREE.Mesh(rockGeo, rockMat);
        rockMesh.position.set(rx, 18 + (i % 2) * 8, rz);
        rockMesh.rotation.set((i * 0.7) % 1.5, (i * 1.3) % 3.14, (i * 0.9) % 1.2);
        rockMesh.scale.set(1.0 + (i % 3) * 0.4, 1.2 + (i % 2) * 0.6, 0.9 + (i % 4) * 0.3);
        rockMesh.castShadow = true;
        rockMesh.receiveShadow = true;
        group.add(rockMesh);
    }

    const base2Geo = new THREE.CylinderGeometry(95, 125, 35, 8);
    const base2 = new THREE.Mesh(base2Geo, rockMat);
    base2.position.y = 50;
    base2.castShadow = true;
    base2.receiveShadow = true;
    group.add(base2);

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
    crystal.scale.set(1.0, 1.8, 1.0);
    crystal.castShadow = true;
    group.add(crystal);

    const rings = [];

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

        rings.push({ mesh: rMesh, baseY: yPos, speed: speed, oscAmp: oscAmp });
    }

    createBlueRing(78, 6, 65 + 160, 0x00aaff, 0x0088ff, -0.6, 10);
    createBlueRing(62, 7, 65 + 310, 0x00f0ff, 0x00d0ff, 0.9, 14);
    createBlueRing(46, 5, 65 + 430, 0x80f5ff, 0x00e1ff, -1.2, 8);

    group.scale.set(3.0, 3.0, 3.0);
    group.position.set(x, 0, z);
    scene.add(group);

    animatedMonuments.push({ group, crystal, rings });

    group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(base1);
    obstacles.push({ mesh: base1, box });

    if (typeof registerHorizonObject === 'function') {
        registerHorizonObject(group);
    }
}

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

spawnMonumentGrid();


/* ───────────────────────────────────────────────
    SECTION 7: Something complex
─────────────────────────────────────────────── */
let _hrtfSpatialTensorMesh = null;
let _spectralTapCapacity = 80000;

const _ACOUSTIC_OCTAVE_STRIDE = 400;
const _HESSIAN_RADIAL_DEPTH = 5;
const _FOURIER_MATRIX_DIM = _HESSIAN_RADIAL_DEPTH * 2 + 1;
const _TOTAL_HARMONIC_CELLS = _FOURIER_MATRIX_DIM * _FOURIER_MATRIX_DIM;
let _currentResonantSectorX = null;
let _currentResonantSectorZ = null;

const _dspBiquadUniforms = {
    uAudioEmitterNode: { value: new THREE.Vector3(0, -999, 0) },
    uEarCanalOrigin: { value: new THREE.Vector3(0, 0, 0) },
    uHeadOrientationVector: { value: new THREE.Vector3(0, 0, -1) },
    uPsychoacousticDecayAngle: { value: 0.1 },
    uFundamentalModulationHz: { value: 0 },
    uNyquistDistanceHorizon: { value: 2800.0 },
    uAcousticProximityFalloff: { value: 24.0 }
};

function _pseudoWhitenoiseGenerator(_omegaX, _omegaZ, _sampleIndex, _phaseSeed = 0) {
    const _entropy = Math.sin(_omegaX * 12.9898 + _omegaZ * 78.233 + _sampleIndex * 43758.5453 + _phaseSeed * 19.19) * 43758.5453;
    return _entropy - Math.floor(_entropy);
}

function _synthesizeDipoleResonanceRibbon() {
    const _baseAperture = 2.2;
    const _wavelengthLength = 10.0;
    const _taperCoefficient = 0.25;

    const _semiAperture = _baseAperture / 2;
    const _tipSemiAperture = _semiAperture * _taperCoefficient;

    const _subHarmonicPhaseX = 1.8;
    const _subHarmonicPhaseZ = 1.8;

    const _nodeTensors = new Float32Array([
        -_semiAperture, 0, 0,
        _semiAperture, 0, 0,
        -_tipSemiAperture, _wavelengthLength, 0,
        _tipSemiAperture, _wavelengthLength, 0,

        0, 0, -_semiAperture,
        0, 0, _semiAperture,
        0, _wavelengthLength, -_tipSemiAperture,
        0, _wavelengthLength, _tipSemiAperture,

        _subHarmonicPhaseX - _semiAperture, 0, _subHarmonicPhaseZ,
        _subHarmonicPhaseX + _semiAperture, 0, _subHarmonicPhaseZ,
        _subHarmonicPhaseX - _tipSemiAperture, _wavelengthLength, _subHarmonicPhaseZ,
        _subHarmonicPhaseX + _tipSemiAperture, _wavelengthLength, _subHarmonicPhaseZ,

        _subHarmonicPhaseX, 0, _subHarmonicPhaseZ - _semiAperture,
        _subHarmonicPhaseX, 0, _subHarmonicPhaseZ + _semiAperture,
        _subHarmonicPhaseX, _wavelengthLength, _subHarmonicPhaseZ - _tipSemiAperture,
        _subHarmonicPhaseX, _wavelengthLength, _subHarmonicPhaseZ + _tipSemiAperture
    ]);

    const _topologyIndices = [
        0, 1, 2, 2, 1, 3,
        4, 5, 6, 6, 5, 7,
        8, 9, 10, 10, 9, 11,
        12, 13, 14, 14, 13, 15
    ];

    const _harmonicModeWeights = new Float32Array([
        0, 0, 0, 0, 0, 0, 0, 0,
        1, 1, 1, 1, 1, 1, 1, 1
    ]);

    const _geometry = new THREE.BufferGeometry();
    _geometry.setAttribute('position', new THREE.BufferAttribute(_nodeTensors, 3));
    _geometry.setAttribute('aOvertoneHarmonic', new THREE.BufferAttribute(_harmonicModeWeights, 1));
    _geometry.setIndex(_topologyIndices);
    _geometry.computeVertexNormals();

    return _geometry;
}

function _convolveSpectralFrequencyBin(_sectorX, _sectorZ, _baseOffset, _tapsPerCell) {
    const _carrierOriginX = _sectorX * _ACOUSTIC_OCTAVE_STRIDE - _ACOUSTIC_OCTAVE_STRIDE / 2;
    const _carrierOriginZ = _sectorZ * _ACOUSTIC_OCTAVE_STRIDE - _ACOUSTIC_OCTAVE_STRIDE / 2;
    const _affineArray = _hrtfSpatialTensorMesh.instanceMatrix.array;

    for (let _tap = 0; _tap < _tapsPerCell; _tap++) {
        const _sampleIndex = _baseOffset + _tap;
        if (_sampleIndex >= _spectralTapCapacity) break;

        const _deltaX = _pseudoWhitenoiseGenerator(_sectorX, _sectorZ, _tap, 1) * _ACOUSTIC_OCTAVE_STRIDE;
        const _deltaZ = _pseudoWhitenoiseGenerator(_sectorX, _sectorZ, _tap, 2) * _ACOUSTIC_OCTAVE_STRIDE;
        const _spatialX = _carrierOriginX + _deltaX;
        const _spatialZ = _carrierOriginZ + _deltaZ;

        const _surfaceFloor = typeof getGroundHeight === 'function' ? getGroundHeight(_spatialX, _spatialZ) : 0;
        const _spatialY = _surfaceFloor > 5 ? 0 : _surfaceFloor;

        const _azimuthPolarAngle = _pseudoWhitenoiseGenerator(_sectorX, _sectorZ, _tap, 3) * Math.PI * 2;
        const _gainAmplitude = 0.85 + _pseudoWhitenoiseGenerator(_sectorX, _sectorZ, _tap, 4) * 1.55;

        const _cosPolar = Math.cos(_azimuthPolarAngle) * _gainAmplitude;
        const _sinPolar = Math.sin(_azimuthPolarAngle) * _gainAmplitude;
        const _tensorStride = _sampleIndex * 16;

        _affineArray[_tensorStride] = _cosPolar;
        _affineArray[_tensorStride + 1] = 0;
        _affineArray[_tensorStride + 2] = -_sinPolar;
        _affineArray[_tensorStride + 3] = 0;

        _affineArray[_tensorStride + 4] = 0;
        _affineArray[_tensorStride + 5] = _gainAmplitude;
        _affineArray[_tensorStride + 6] = 0;
        _affineArray[_tensorStride + 7] = 0;

        _affineArray[_tensorStride + 8] = _sinPolar;
        _affineArray[_tensorStride + 9] = 0;
        _affineArray[_tensorStride + 10] = _cosPolar;
        _affineArray[_tensorStride + 11] = 0;

        _affineArray[_tensorStride + 12] = _spatialX;
        _affineArray[_tensorStride + 13] = _spatialY;
        _affineArray[_tensorStride + 14] = _spatialZ;
        _affineArray[_tensorStride + 15] = 1;
    }
}

function _shiftHarmonicPhaseMatrix(_earX, _earZ, _earDirX = 0, _earDirZ = -1) {
    if (!_hrtfSpatialTensorMesh) return;

    const _lookAheadX = _earX + _earDirX * (_ACOUSTIC_OCTAVE_STRIDE * 1.5);
    const _lookAheadZ = _earZ + _earDirZ * (_ACOUSTIC_OCTAVE_STRIDE * 1.5);

    const _targetSectorX = Math.floor((_lookAheadX + _ACOUSTIC_OCTAVE_STRIDE / 2) / _ACOUSTIC_OCTAVE_STRIDE);
    const _targetSectorZ = Math.floor((_lookAheadZ + _ACOUSTIC_OCTAVE_STRIDE / 2) / _ACOUSTIC_OCTAVE_STRIDE);

    if (_targetSectorX === _currentResonantSectorX && _targetSectorZ === _currentResonantSectorZ) {
        return;
    }

    _currentResonantSectorX = _targetSectorX;
    _currentResonantSectorZ = _targetSectorZ;

    const _tapsPerCell = Math.floor(_spectralTapCapacity / _TOTAL_HARMONIC_CELLS);
    let _runningOffset = 0;
    const _affineArray = _hrtfSpatialTensorMesh.instanceMatrix.array;

    for (let _cx = _targetSectorX - _HESSIAN_RADIAL_DEPTH; _cx <= _targetSectorX + _HESSIAN_RADIAL_DEPTH; _cx++) {
        for (let _cz = _targetSectorZ - _HESSIAN_RADIAL_DEPTH; _cz <= _targetSectorZ + _HESSIAN_RADIAL_DEPTH; _cz++) {
            _convolveSpectralFrequencyBin(_cx, _cz, _runningOffset, _tapsPerCell);
            _runningOffset += _tapsPerCell;
        }
    }

    for (let _idx = _runningOffset; _idx < _spectralTapCapacity; _idx++) {
        const _m = _idx * 16;
        for (let _k = 0; _k < 16; _k++) {
            _affineArray[_m + _k] = 0;
        }
    }

    _hrtfSpatialTensorMesh.instanceMatrix.needsUpdate = true;
}

function _initBinauralSpectralConvolver(_capacity = 80000) {
    if (_hrtfSpatialTensorMesh) {
        scene.remove(_hrtfSpatialTensorMesh);
        if (_hrtfSpatialTensorMesh.geometry) _hrtfSpatialTensorMesh.geometry.dispose();
        if (_hrtfSpatialTensorMesh.material) _hrtfSpatialTensorMesh.material.dispose();
        _hrtfSpatialTensorMesh = null;
    }

    if (_capacity <= 0) return;

    _spectralTapCapacity = _capacity;
    _currentResonantSectorX = null;
    _currentResonantSectorZ = null;

    const _geometry = _synthesizeDipoleResonanceRibbon();

    const _material = new THREE.MeshStandardMaterial({
        color: PAL.grass || 0xf0c830,
        roughness: 0.7,
        metalness: 0.1,
        side: THREE.DoubleSide,
        shadowSide: THREE.DoubleSide
    });

    function _injectBiquadPsychoacousticGLSL(_shader, _isShadowPass = false) {
        _shader.uniforms.uAudioEmitterNode = _dspBiquadUniforms.uAudioEmitterNode;
        _shader.uniforms.uEarCanalOrigin = _dspBiquadUniforms.uEarCanalOrigin;
        _shader.uniforms.uHeadOrientationVector = _dspBiquadUniforms.uHeadOrientationVector;
        _shader.uniforms.uPsychoacousticDecayAngle = _dspBiquadUniforms.uPsychoacousticDecayAngle;
        _shader.uniforms.uFundamentalModulationHz = _dspBiquadUniforms.uFundamentalModulationHz;
        _shader.uniforms.uNyquistDistanceHorizon = _dspBiquadUniforms.uNyquistDistanceHorizon;
        _shader.uniforms.uAcousticProximityFalloff = _dspBiquadUniforms.uAcousticProximityFalloff;

        _shader.vertexShader = `
            attribute float aOvertoneHarmonic;
            uniform vec3 uAudioEmitterNode;
            uniform vec3 uEarCanalOrigin;
            uniform vec3 uHeadOrientationVector;
            uniform float uPsychoacousticDecayAngle;
            uniform float uFundamentalModulationHz;
            uniform float uNyquistDistanceHorizon;
            uniform float uAcousticProximityFalloff;
        ` + _shader.vertexShader;

        const _shadowAttenuationBlock = _isShadowPass ? `
            if (acousticTravelDistance > 1400.0) {
                psychoacousticAudibility = 0.0;
            }
            transformed *= psychoacousticAudibility;
        ` : `
            transformed *= psychoacousticAudibility;
        `;

        _shader.vertexShader = _shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>

            #ifdef USE_INSTANCING
                vec4 biquadWorldNode = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
            #else
                vec4 biquadWorldNode = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
            #endif

            vec2 interauralDelta = biquadWorldNode.xz - uEarCanalOrigin.xz;
            float acousticTravelDistance = length(interauralDelta);
            float impulseSourceDistance = length(biquadWorldNode.xz - uAudioEmitterNode.xz);

            if (aOvertoneHarmonic > 0.5) {
                float overtoneModulationGain = smoothstep(300.0, 50.0, acousticTravelDistance);
                vec3 overtoneOrigin = vec3(1.8, 0.0, 1.8);
                transformed = overtoneOrigin + (transformed - overtoneOrigin) * overtoneModulationGain;
            }

            float psychoacousticAudibility = 1.0;

            if (acousticTravelDistance > 10.0) {
                vec2 normalizedWavefront = interauralDelta / acousticTravelDistance;
                float interauralPhaseCoherence = dot(normalizedWavefront, uHeadOrientationVector.xz);

                if (interauralPhaseCoherence < uPsychoacousticDecayAngle) {
                    float phaseDamping = clamp((interauralPhaseCoherence - (uPsychoacousticDecayAngle - 0.20)) / 0.20, 0.0, 1.0);
                    psychoacousticAudibility *= phaseDamping;
                }

                if (acousticTravelDistance > uNyquistDistanceHorizon) {
                    psychoacousticAudibility = 0.0;
                } else if (acousticTravelDistance > uNyquistDistanceHorizon * 0.75) {
                    float t = (acousticTravelDistance - uNyquistDistanceHorizon * 0.75) / (uNyquistDistanceHorizon * 0.25);
                    psychoacousticAudibility *= (1.0 - smoothstep(0.0, 1.0, t));
                }
            }

            ${_shadowAttenuationBlock}

            float cantileverResonanceFactor = clamp(position.y / 10.0, 0.0, 1.0);

            float flutterEchoOffset = sin(uFundamentalModulationHz * 2.8 + biquadWorldNode.x * 0.08 + biquadWorldNode.z * 0.08) * 0.45 * cantileverResonanceFactor;
            transformed.x += flutterEchoOffset;

            if (impulseSourceDistance < uAcousticProximityFalloff && abs(biquadWorldNode.y - uAudioEmitterNode.y) < 25.0) {
                vec2 kineticWaveFront = normalize(biquadWorldNode.xz - uAudioEmitterNode.xz + vec2(0.0001));
                float dopplerShiftDeflection = (1.0 - impulseSourceDistance / uAcousticProximityFalloff) * 4.5 * cantileverResonanceFactor;
                transformed.x += kineticWaveFront.x * dopplerShiftDeflection;
                transformed.z += kineticWaveFront.y * dopplerShiftDeflection;
                transformed.y -= dopplerShiftDeflection * 0.3;
            }
            `
        );
    }

    _material.onBeforeCompile = function (_shader) {
        _injectBiquadPsychoacousticGLSL(_shader, false);
    };

    _hrtfSpatialTensorMesh = new THREE.InstancedMesh(_geometry, _material, _capacity);
    _hrtfSpatialTensorMesh.castShadow = true;
    _hrtfSpatialTensorMesh.receiveShadow = true;

    const _depthShaderMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    _depthShaderMaterial.onBeforeCompile = function (_shader) {
        _injectBiquadPsychoacousticGLSL(_shader, true);
    };
    _hrtfSpatialTensorMesh.customDepthMaterial = _depthShaderMaterial;

    _shiftHarmonicPhaseMatrix(0, 0, 0, -1);
    scene.add(_hrtfSpatialTensorMesh);
    console.log(`[HRTF-DSP] Initialized ${_capacity} multi-pole spatial acoustic delay lines.`);
}

function _processBiquadHarmonicDSP(_emitterX, _emitterY, _emitterZ, _dt, _timeSeconds) {
    if (!_hrtfSpatialTensorMesh) return;

    const _headYawRad = THREE.MathUtils.degToRad(typeof camYawDeg !== 'undefined' ? camYawDeg : 0);
    const _headLookDirX = -Math.sin(_headYawRad);
    const _headLookDirZ = -Math.cos(_headYawRad);

    const _listenerOriginX = typeof camera !== 'undefined' ? camera.position.x : _emitterX;
    const _listenerOriginZ = typeof camera !== 'undefined' ? camera.position.z : _emitterZ;

    const _vertApertureRad = THREE.MathUtils.degToRad(typeof camFov !== 'undefined' ? camFov : 45);
    const _aspectRatio = typeof aspect !== 'undefined' ? aspect : (window.innerWidth / window.innerHeight);
    const _halfApertureRad = Math.atan(Math.tan(_vertApertureRad / 2) * _aspectRatio);
    const _decayAngleCos = Math.cos(_halfApertureRad + 0.10);

    _dspBiquadUniforms.uEarCanalOrigin.value.set(_listenerOriginX, 0, _listenerOriginZ);
    _dspBiquadUniforms.uHeadOrientationVector.value.set(_headLookDirX, 0, _headLookDirZ);
    _dspBiquadUniforms.uPsychoacousticDecayAngle.value = _decayAngleCos;

    _shiftHarmonicPhaseMatrix(_listenerOriginX, _listenerOriginZ, _headLookDirX, _headLookDirZ);

    _dspBiquadUniforms.uAudioEmitterNode.value.set(_emitterX, _emitterY, _emitterZ);
    _dspBiquadUniforms.uFundamentalModulationHz.value = _timeSeconds;

    if (typeof maxVisDist !== 'undefined' && maxVisDist < 10000) {
        _dspBiquadUniforms.uNyquistDistanceHorizon.value = maxVisDist;
    } else {
        _dspBiquadUniforms.uNyquistDistanceHorizon.value = 2800.0;
    }
}

const createGrassLandscape = _initBinauralSpectralConvolver;
const updateGrassPhysics = _processBiquadHarmonicDSP;
const grassUniforms = _dspBiquadUniforms;

createGrassLandscape(80000);


/* ───────────────────────────────────────────────
    SECTION 8: ATMOSPHERIC GRADIENT SKY DOME
─────────────────────────────────────────────── */
let skyMesh = null;
let skyMaterial = null;

const skyUniforms = {
    uSunDir: { value: new THREE.Vector3(0, 0.44721, -0.89443) },
    uColorHotCore: { value: new THREE.Color(1.0, 1.0, 1.0) },
    uColorHotGlow: { value: new THREE.Color(0.78, 0.93, 1.0) },
    uColorSun: { value: new THREE.Color(0.58, 0.82, 0.98) },
    uColorHorizon: { value: new THREE.Color(0.35, 0.68, 0.92) },
    uColorZenith: { value: new THREE.Color(0.06, 0.16, 0.42) },
    uTime: { value: 0.0 },
    uCloudColor: { value: new THREE.Color(0.96, 0.98, 1.0) },
    uCloudShadowColor: { value: new THREE.Color(0.38, 0.50, 0.70) },
    uCloudCoverage: { value: 0.42 }
};

function initSky() {
    if (skyMesh) return;

    const skyGeo = new THREE.SphereGeometry(14000, 32, 16);

    skyMaterial = new THREE.ShaderMaterial({
        uniforms: skyUniforms,
        vertexShader: `
            varying vec3 vWorldPos;
            void main() {
                vWorldPos = position;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vWorldPos;
            uniform vec3 uSunDir;
            uniform vec3 uColorHotCore;
            uniform vec3 uColorHotGlow;
            uniform vec3 uColorSun;
            uniform vec3 uColorHorizon;
            uniform vec3 uColorZenith;
            uniform float uTime;
            uniform vec3 uCloudColor;
            uniform vec3 uCloudShadowColor;
            uniform float uCloudCoverage;

            vec2 hash2(vec2 p) {
                p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
                return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
            }

            float noise2D(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                vec2 u = f * f * (3.0 - 2.0 * f);

                return mix(mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                               dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                           mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                               dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
            }

            float fbm2D(vec2 p) {
                float val = 0.0;
                float amp = 0.5;
                for (int i = 0; i < 3; i++) {
                    val += amp * noise2D(p);
                    p *= 2.02;
                    amp *= 0.5;
                }
                return val;
            }

            void main() {
                vec3 dir = normalize(vWorldPos);
                float height = clamp(dir.y, 0.0, 1.0);
                float sunAlignment = max(0.0, dot(dir, uSunDir));

                vec3 skyColor = mix(uColorHorizon, uColorZenith, pow(height, 0.7));

                float sunAmbientGlow = pow(sunAlignment, 2.0);
                skyColor = mix(skyColor, uColorSun, sunAmbientGlow * 0.75);

                float hotGlowFactor = pow(sunAlignment, 64.0);
                skyColor = mix(skyColor, uColorHotGlow, hotGlowFactor * 0.95);

                float hotCoreFactor = pow(sunAlignment, 1024.0);
                skyColor = mix(skyColor, uColorHotCore, hotCoreFactor * 1.0);

                if (dir.y > 0.02) {
                    vec2 skyUV = dir.xz / (dir.y + 0.18);
                    vec2 windDir = vec2(0.008, 0.004) * uTime;
                    vec2 samplePos = skyUV * 2.5 + windDir;

                    float n = fbm2D(samplePos);
                    n = n * 0.5 + 0.5;

                    float cloudAlpha = smoothstep(uCloudCoverage, uCloudCoverage + 0.28, n);
                    float horizonFade = smoothstep(0.02, 0.22, dir.y);
                    cloudAlpha *= horizonFade;

                    if (cloudAlpha > 0.001) {
                        float cloudHeightFactor = smoothstep(uCloudCoverage + 0.05, uCloudCoverage + 0.35, n);
                        vec3 cColor = mix(uCloudShadowColor, uCloudColor, cloudHeightFactor);

                        float sunRim = pow(sunAlignment, 4.0) * (1.0 - cloudHeightFactor);
                        cColor = mix(cColor, uColorHotGlow, sunRim * 0.8);
                        cColor = mix(cColor, uColorHotCore, pow(sunAlignment, 12.0) * 0.5);

                        skyColor = mix(skyColor, cColor, cloudAlpha * 0.88);
                    }
                }

                gl_FragColor = vec4(skyColor, 1.0);
            }
        `,
        side: THREE.BackSide,
        depthWrite: false
    });

    skyMesh = new THREE.Mesh(skyGeo, skyMaterial);
    skyMesh.renderOrder = -1000;
    scene.add(skyMesh);
}

function updateSky(dt, time) {
    if (!skyMesh) {
        initSky();
    }
    if (skyMesh) {
        if (typeof time === 'number') {
            skyUniforms.uTime.value = time;
        } else if (typeof clock !== 'undefined') {
            skyUniforms.uTime.value = clock.getElapsedTime();
        }

        if (camera) {
            skyMesh.position.copy(camera.position);
        }

        if (typeof dirLight !== 'undefined') {
            const sunDir = new THREE.Vector3(0, 2500, -5000).normalize();
            skyUniforms.uSunDir.value.copy(sunDir);
        }
    }
}


/* ───────────────────────────────────────────────
    SECTION 9: PLAYER CHARACTER & ANIMATION MIXER
─────────────────────────────────────────────── */
const playerGroup = new THREE.Group();
scene.add(playerGroup);

const pShadow = new THREE.Mesh(
    new THREE.CircleGeometry((PLAYER_RADIUS + 4) * 0.5, 16),
    new THREE.MeshBasicMaterial({ color: PAL.shadow, transparent: true, opacity: 0.5 })
);
pShadow.rotation.x = -Math.PI / 2;
pShadow.position.y = 0.6;
scene.add(pShadow);

let mixer = null;
let idleAction = null;
let walkAction = null;
let jumpAction = null;
let isWalking = false;
let isGrounded = true;

const animations = {};
let glbReady = false;

const PLAYER_GLB = 'firstmodel.glb';

const _loader = new THREE.GLTFLoader();
_loader.load(
    PLAYER_GLB,
    function (gltf) {
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        if (size.y > 0) model.scale.setScalar(PLAYER_HEIGHT / size.y);

        model.traverse(function (node) {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });

        const box2 = new THREE.Box3().setFromObject(model);
        model.position.y = -box2.min.y + 5.0;

        playerGroup.add(model);

        const ponytailNames = ['ponytail1', 'ponytail2', 'ponytail3', 'ponytail4', 'ponytail5'];
        window.ponytailBones = new Array(5).fill(null);
        model.traverse(function (node) {
            if (node.name) {
                const idx = ponytailNames.indexOf(node.name.toLowerCase());
                if (idx !== -1) {
                    node._restQuaternion = node.quaternion.clone();
                    window.ponytailBones[idx] = node;
                }
            }
        });

        mixer = new THREE.AnimationMixer(model);

        if (gltf.animations && gltf.animations.length > 0) {
            gltf.animations.forEach(function (clip) {
                const action = mixer.clipAction(clip);
                action.setLoop(THREE.LoopRepeat);
                animations[clip.name.toLowerCase()] = action;
            });

            idleAction = animations['hero-idle'] || Object.values(animations)[0];
            walkAction = animations['hero-walk'] || null;
            jumpAction = animations['hero-jump'] || null;

            if (jumpAction) {
                jumpAction.setLoop(THREE.LoopOnce);
                jumpAction.clampWhenFinished = true;
            }

            if (idleAction) idleAction.play();
        }

        glbReady = true;
        console.log('[player] firstmodel.glb ready.');
    },
    function (xhr) {
        if (xhr.total) {
            console.log('[player] ' + Math.round(xhr.loaded / xhr.total * 100) + '% loaded');
        }
    },
    function (err) {
        console.error('[player] Failed to load ' + PLAYER_GLB + ':', err);
    }
);


/* ───────────────────────────────────────────────
    SECTION 10: PROCEDURAL SECONDARY PONYTAIL PHYSICS
─────────────────────────────────────────────── */
(function () {
    let prevPx = 0;
    let prevPy = 0;
    let prevPz = 0;
    let prevYaw = 0;
    let isInitialized = false;

    const smoothedPitch = [0, 0, 0, 0, 0];
    const smoothedRoll = [0, 0, 0, 0, 0];
    const smoothedYaw = [0, 0, 0, 0, 0];

    const _additiveQuat = new THREE.Quaternion();
    const _euler = new THREE.Euler(0, 0, 0, 'YXZ');

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

        const vx = (px - prevPx) / dt;
        const vy = (py - prevPy) / dt;
        const vz = (pz - prevPz) / dt;

        let yawDiff = currentYaw - prevYaw;
        while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
        while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
        const yawRate = yawDiff / dt;

        prevPx = px;
        prevPy = py;
        prevPz = pz;
        prevYaw = currentYaw;

        const sinY = Math.sin(currentYaw);
        const cosY = Math.cos(currentYaw);

        const vForward = -(vx * sinY + vz * cosY);
        const vRight = vx * cosY - vz * sinY;

        const speedRatio = THREE.MathUtils.clamp(vForward / PLAYER_SPEED, -0.5, 1.0);
        const vyFactor = THREE.MathUtils.clamp(vy * 0.0035, -0.15, 0.15);
        const targetBasePitch = -speedRatio * 0.55 - vyFactor;

        const targetBaseRoll = THREE.MathUtils.clamp(-vRight / PLAYER_SPEED * 0.30 - yawRate * 0.08, -0.35, 0.35);
        const targetBaseYaw = THREE.MathUtils.clamp(-yawRate * 0.10, -0.20, 0.20);

        const chainFactors = [0.05, 0.15, 1.10, 0.75, 0.90];
        const chainSum = 2.95;
        const MAX_TOTAL_PITCH = THREE.MathUtils.degToRad(115);

        const maxBasePitch = MAX_TOTAL_PITCH / chainSum;
        const clampedBasePitch = THREE.MathUtils.clamp(targetBasePitch, -maxBasePitch, maxBasePitch);

        const lerpSpeed = 6.0;

        const bones = window.ponytailBones;
        for (let i = 0; i < 5; i++) {
            const bone = bones[i];
            if (!bone) continue;

            const factor = chainFactors[i];
            const targetPitch = clampedBasePitch * factor;
            const targetRoll = targetBaseRoll * factor;
            const targetYaw = targetBaseYaw * factor;

            const alpha = 1.0 - Math.exp(-lerpSpeed * dt);
            smoothedPitch[i] += (targetPitch - smoothedPitch[i]) * alpha;
            smoothedRoll[i] += (targetRoll - smoothedRoll[i]) * alpha;
            smoothedYaw[i] += (targetYaw - smoothedYaw[i]) * alpha;

            if (bone._restQuaternion) {
                bone.quaternion.copy(bone._restQuaternion);
            }

            _euler.set(smoothedPitch[i], smoothedYaw[i], smoothedRoll[i], 'YXZ');
            _additiveQuat.setFromEuler(_euler);
            bone.quaternion.multiply(_additiveQuat);
        }
    };
})();


/* ───────────────────────────────────────────────
    SECTION 11: KEYBOARD INPUT SYSTEM
─────────────────────────────────────────────── */
const keys = { w: false, a: false, s: false, d: false, space: false };

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
        keys.space = true;
        e.preventDefault();
    }
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = true;
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
        keys.space = false;
        e.preventDefault();
    }
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = false;
});

window.addEventListener('blur', () => {
    keys.w = keys.a = keys.s = keys.d = keys.space = false;
});


/* ───────────────────────────────────────────────
    SECTION 12: COLLISION HELPERS
─────────────────────────────────────────────── */
const _playerBox = new THREE.Box3();

function getPlayerAABB(px, py = 0, pz = 0) {
    _playerBox.min.set(px - PLAYER_RADIUS, py, pz - PLAYER_RADIUS);
    _playerBox.max.set(px + PLAYER_RADIUS, py + PLAYER_HEIGHT, pz + PLAYER_RADIUS);
    return _playerBox;
}

function testCollision(px, py = 0, pz = 0) {
    const pBox = getPlayerAABB(px, py, pz);
    const EPSILON = 0.5;

    for (let i = 0; i < obstacles.length; i++) {
        const obsBox = obstacles[i].box;
        if (py >= obsBox.max.y - EPSILON) continue;
        if (pBox.intersectsBox(obsBox)) return true;
    }
    return false;
}


/* ───────────────────────────────────────────────
    SECTION 13: PLAYER CONTROLLER & LOCOMOTION PHYSICS
─────────────────────────────────────────────── */
const WALK_FADE_IN = 0.18;
const WALK_FADE_OUT = 0.25;
const JUMP_LAUNCH_BLEND = 0.14;
const MIN_WALK_SPEED = 8.0;
const WALK_ANIM_SPEED_MULT = 1.35;

let velX = 0;
let velY = 0;
let velZ = 0;

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
    if (mixer) mixer.update(dt);
    if (!glbReady) return;

    let rawDx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    let rawDz = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);

    const yawRad = THREE.MathUtils.degToRad(camYawDeg || 0);
    const moveX = rawDx * Math.cos(yawRad) + rawDz * Math.sin(yawRad);
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

    if (inputLen > 0) {
        velX += (targetVelX - velX) * Math.min(1, 16 * dt);
        velZ += (targetVelZ - velZ) * Math.min(1, 16 * dt);
    } else {
        velX += (0 - velX) * Math.min(1, PLAYER_FRICTION * dt);
        velZ += (0 - velZ) * Math.min(1, PLAYER_FRICTION * dt);
        if (Math.abs(velX) < 0.1) velX = 0;
        if (Math.abs(velZ) < 0.1) velZ = 0;
    }

    let px = playerGroup.position.x;
    let py = playerGroup.position.y;
    let pz = playerGroup.position.z;

    const prevX = px;
    const prevZ = pz;

    const dx = velX * dt;
    const dz = velZ * dt;

    const newX = px + dx;
    if (!testCollision(newX, py, pz)) {
        px = newX;
    } else {
        velX = 0;
    }

    const newZ = pz + dz;
    if (!testCollision(px, py, newZ)) {
        pz = newZ;
    } else {
        velZ = 0;
    }

    const targetGroundY = getGroundHeight(px, pz);
    let justLanded = false;

    if (keys.space && isGrounded) {
        isGrounded = false;
        velY = JUMP_POWER;

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

    if (!isGrounded) {
        velY -= JUMP_GRAVITY * dt;
        py += velY * dt;

        if (jumpAction) {
            if (velY < 0) {
                jumpAction.setEffectiveTimeScale(1.75);
            } else {
                jumpAction.setEffectiveTimeScale(1.0);
            }
        }

        if (velY < 0 && jumpAction && !jumpAction.isRunning()) {
            jumpAction.reset();
            jumpAction.time = 0.833;
            jumpAction.enabled = true;
            jumpAction.setEffectiveTimeScale(1.75);
            jumpAction.play();

            if (idleAction) idleAction.fadeOut(0.10);
            if (walkAction) walkAction.fadeOut(0.10);
        }

        if (jumpAction && jumpAction.isRunning()) {
            if (jumpAction.time >= 1.55) {
                jumpAction.time = 1.55;
            }
        }

        if (py <= targetGroundY) {
            py = targetGroundY;
            velY = 0;
            isGrounded = true;
            justLanded = true;

            if (jumpAction) {
                jumpAction.setEffectiveTimeScale(1.0);
                jumpAction.time = 1.6667;
                jumpAction.fadeOut(0.30);
            }
        }
    } else {
        if (py > targetGroundY + 0.1) {
            isGrounded = false;
            velY = 0;
        } else {
            py = targetGroundY;
        }
    }

    playerGroup.position.set(px, py, pz);

    pShadow.position.set(px, targetGroundY + 0.6, pz);
    const elevation = Math.max(0, py - targetGroundY);
    const shadowFactor = THREE.MathUtils.clamp(1.0 - (elevation / 70.0) * 0.45, 0.55, 1.0);
    pShadow.scale.set(shadowFactor, shadowFactor, 1.0);
    pShadow.material.opacity = THREE.MathUtils.clamp(0.5 - (elevation / 70.0) * 0.25, 0.25, 0.5);

    const actualDx = px - prevX;
    const actualDz = pz - prevZ;
    const actualSpeed = Math.sqrt(actualDx * actualDx + actualDz * actualDz) / Math.max(dt, 0.0001);

    const isMoving = actualSpeed > MIN_WALK_SPEED;

    if (isMoving || inputLen > 0) {
        const facingX = Math.abs(actualDx) > 0.01 ? actualDx : dirX;
        const facingZ = Math.abs(actualDz) > 0.01 ? actualDz : dirZ;

        if (facingX !== 0 || facingZ !== 0) {
            const targetAngle = Math.atan2(facingX, facingZ);
            let diff = targetAngle - playerGroup.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            playerGroup.rotation.y += diff * Math.min(1, 14 * dt);
        }
    }

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
            if (idleAction) idleAction.fadeOut(WALK_FADE_IN);
            if (walkAction) walkAction.reset().fadeIn(WALK_FADE_IN).play();
            isWalking = true;
        } else if (!isMoving && isWalking) {
            if (walkAction) walkAction.fadeOut(WALK_FADE_OUT);
            if (idleAction) idleAction.reset().fadeIn(WALK_FADE_OUT).play();
            isWalking = false;
        }
    }

    if (walkAction && isWalking && isGrounded) {
        const timeScale = THREE.MathUtils.clamp((actualSpeed / PLAYER_SPEED) * WALK_ANIM_SPEED_MULT, 0.5, 1.7);
        walkAction.setEffectiveTimeScale(timeScale);
    }

    if (typeof updatePonytailPhysics === 'function') {
        updatePonytailPhysics(dt);
    }
}


/* ───────────────────────────────────────────────
    SECTION 14: CAMERA CONTROLS & SETTINGS UI SYNC
─────────────────────────────────────────────── */
window.addEventListener('resize', () => {
    aspect = window.innerWidth / window.innerHeight;
    if (camera) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
});

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

let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;

renderer.domElement.addEventListener('click', (e) => {
    if (e.target.closest('#camera-panel') || e.target.closest('#ui-overlay')) return;
    if (document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock();
    }
});

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
        deltaX = e.movementX;
        deltaY = e.movementY;
    } else if (isDragging) {
        deltaX = e.clientX - previousMouseX;
        deltaY = e.clientY - previousMouseY;
        previousMouseX = e.clientX;
        previousMouseY = e.clientY;
    } else {
        return;
    }

    camYawDeg = (camYawDeg - deltaX * 0.35) % 360;
    if (camYawDeg < 0) camYawDeg += 360;

    camAngleDeg = THREE.MathUtils.clamp(camAngleDeg - deltaY * 0.25, 5, 135);
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

initCamera();


/* ───────────────────────────────────────────────
    SECTION 15: ANIMATION LOOP
─────────────────────────────────────────────── */
const clock = new THREE.Clock();
const coordsEl = document.getElementById('coords');

function animate() {
    requestAnimationFrame(animate);
    const frameStart = performance.now();
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    updatePlayerController(dt);

    const px = playerGroup.position.x;
    const py = playerGroup.position.y;
    const pz = playerGroup.position.z;

    if (typeof floor !== 'undefined') {
        floor.position.x = px;
        floor.position.z = pz;
    }

    if (typeof updateHorizonDisplacement === 'function') {
        updateHorizonDisplacement(px, pz, py);
    }

    if (typeof animatedMonuments !== 'undefined' && animatedMonuments.length > 0) {
        const ANIM_CULL_DIST_SQ = 10000 * 10000;
        for (let i = 0; i < animatedMonuments.length; i++) {
            const m = animatedMonuments[i];
            if (!m.group || !m.group.visible) continue;

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

    if (typeof updateGrassPhysics === 'function') {
        updateGrassPhysics(px, py, pz, dt, time);
    }

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

    let targetY = py + 12;
    if (camAngleDeg > MAX_POSITION_TILT) {
        const extraTiltRad = THREE.MathUtils.degToRad(camAngleDeg - MAX_POSITION_TILT);
        targetY += camHeight * Math.tan(extraTiltRad);
    }
    camera.lookAt(px, targetY, pz);

    if (typeof updateSky === 'function') {
        updateSky(dt, time);
    }

    const shadowWidth = dirLight.shadow.camera.right - dirLight.shadow.camera.left;
    const texelSize = shadowWidth / dirLight.shadow.mapSize.width;

    const shadowTargetX = Math.floor(px / texelSize) * texelSize;
    const shadowTargetZ = Math.floor(pz / texelSize) * texelSize;
    const shadowTargetY = 0;

    dirLight.position.set(shadowTargetX, 2500, shadowTargetZ - 5000);
    dirLight.target.position.set(shadowTargetX, shadowTargetY, shadowTargetZ);
    dirLight.target.updateMatrixWorld();

    if (typeof obstacles !== 'undefined' && obstacles.length > 0) {
        const shadowRadiusSq = 2700 * 2700;
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

    coordsEl.textContent = `x: ${Math.round(px)}  z: ${Math.round(pz)}`;
    renderer.render(scene, camera);

    if (typeof perfMonitor !== 'undefined') {
        perfMonitor.record(performance.now() - frameStart);
    }
}

animate();
