/* ───────────────────────────────────────────────
    SCENE SETUP  (renderer, scene, fog, camera)
─────────────────────────────────────────────── */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(PAL.bg);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
// scene.fog disabled for crystal-clear far horizon vision

// ── Lighting ────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
dirLight.position.set(0, 2500, -5000);
dirLight.castShadow = true;

// Wide symmetric shadow camera bounds (4000x4000 units centered around player)
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
