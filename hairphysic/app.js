import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HairPhysics } from './hairphysic.js';
import { HairBoneHelper } from './hairbonehelper.js';

// --- Scene & Core ---
let scene, camera, renderer, controls;
let characterRoot = new THREE.Group();
let characterModel = null;
let skeletonHelper = null;
let gridHelper = null;
let hairPhysics = null;
let hairHelper = null;

// --- Character Movement & Physics State ---
const moveState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
  sprint: false
};

const charPhysics = {
  velocityY: 0,
  isGrounded: true,
  gravity: -24,
  jumpForce: 16.5,
  baseSpeed: 5.0,
  sprintMultiplier: 1.8,
  targetRotation: 0,
  currentRotation: 0,
  walkCycle: 0,
  movementVelocity: new THREE.Vector3()
};

const clock = new THREE.Clock();

// --- DOM Elements ---
const container = document.getElementById('canvas-container');
const statusElem = document.getElementById('model-status');
const posDisplay = document.getElementById('pos-display');
const btnReset = document.getElementById('btn-reset');
const fileInput = document.getElementById('file-input');
const dropOverlay = document.getElementById('drop-overlay');

const infoBones = document.getElementById('info-bones');
const infoMeshes = document.getElementById('info-meshes');
const sliderSpeed = document.getElementById('slider-speed');
const toggleSkeleton = document.getElementById('toggle-skeleton');
const toggleWireframe = document.getElementById('toggle-wireframe');
const toggleProcedural = document.getElementById('toggle-procedural');

// Hair Physics UI Elements
const toggleHair = document.getElementById('toggle-hair');
const sliderStiffness = document.getElementById('slider-stiffness');
const sliderDamping = document.getElementById('slider-damping');
const sliderWind = document.getElementById('slider-wind');
const toggleHairDebug = document.getElementById('toggle-hair-debug');

init();
animate();

function init() {
  // 1. Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0d12);
  scene.fog = new THREE.FogExp2(0x0b0d12, 0.025);

  // 2. Camera (3rd Person Chase / Orbit)
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 3.0, 5.5);

  // 3. Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  // 4. Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x1e293b, 0.8);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
  dirLight.position.set(10, 20, 15);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 80;
  dirLight.shadow.camera.left = -15;
  dirLight.shadow.camera.right = 15;
  dirLight.shadow.camera.top = 15;
  dirLight.shadow.camera.bottom = -15;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  // 5. Static World Ground & Environment
  buildStaticWorld();

  // 6. Add Character Root container to Scene
  scene.add(characterRoot);

  // 7. Hair Physics Initializer
  hairPhysics = new HairPhysics();

  // 8. Hair Bone Telemetry Helper
  hairHelper = new HairBoneHelper({ trackedChain: 'chair' });
  window.hairHelper = hairHelper; // Expose to browser console for easy live access

  // 8. Orbit Controls for 3rd-person camera rotation around character
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 2.0;
  controls.maxDistance = 25.0;
  controls.maxPolarAngle = Math.PI / 2 - 0.05; // Stay above ground
  controls.target.copy(characterRoot.position).add(new THREE.Vector3(0, 1.2, 0));

  // 9. Load Default Model
  loadDefaultModel('./test003rigged.glb');

  // 10. Setup Event Listeners
  setupEventListeners();
}

function buildStaticWorld() {
  // Ground
  const floorGeo = new THREE.PlaneGeometry(200, 200);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0e1118,
    roughness: 0.8,
    metalness: 0.2
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Minimalist World Grid
  gridHelper = new THREE.GridHelper(100, 100, 0x38bdf8, 0x1e293b);
  gridHelper.position.y = 0.002;
  scene.add(gridHelper);

  // Center spawn ring marker
  const ringGeo = new THREE.RingGeometry(1.8, 1.9, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.005;
  scene.add(ring);

  // Static decorative world landmarks
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x1a2233, roughness: 0.6, metalness: 0.3 });
  const glowMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.8 });

  const positions = [
    [-8, 0.5, -8, 2, 1, 2],
    [8, 1.0, -8, 2, 2, 2],
    [-8, 1.5, 8, 2, 3, 2],
    [8, 0.75, 8, 2, 1.5, 2],
    [0, 0.4, -14, 4, 0.8, 4]
  ];

  positions.forEach(([x, y, z, w, h, d]) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, boxMat);
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const topGeo = new THREE.BoxGeometry(w + 0.05, 0.05, d + 0.05);
    const topMesh = new THREE.Mesh(topGeo, glowMat);
    topMesh.position.set(x, h, z);
    scene.add(topMesh);
  });
}

function loadDefaultModel(url) {
  statusElem.textContent = 'Loading ' + url.split('/').pop() + '...';
  const loader = new GLTFLoader();

  loader.load(
    url,
    (gltf) => {
      onCharacterLoaded(gltf, url.split('/').pop());
    },
    (xhr) => {
      if (xhr.total > 0) {
        const pct = Math.round((xhr.loaded / xhr.total) * 100);
        statusElem.textContent = `Loading ${pct}%`;
      }
    },
    (err) => {
      console.warn('Could not auto-load from URL directly (use file picker/drop):', err);
      statusElem.textContent = 'Ready — Drop or Open Character GLB';
    }
  );
}

function onCharacterLoaded(gltf, fileName = 'Character') {
  if (characterModel) {
    characterRoot.remove(characterModel);
    if (skeletonHelper) scene.remove(skeletonHelper);
  }

  characterModel = gltf.scene;

  let boneCount = 0;
  let meshCount = 0;

  characterModel.traverse((child) => {
    if (child.isBone) boneCount++;
    if (child.isMesh) {
      meshCount++;
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        child.material.side = THREE.DoubleSide;
      }
    }
  });

  // Center bottom of model on root Y = 0
  const box = new THREE.Box3().setFromObject(characterModel);
  const center = box.getCenter(new THREE.Vector3());

  characterModel.position.x -= center.x;
  characterModel.position.z -= center.z;
  characterModel.position.y -= box.min.y;

  characterRoot.add(characterModel);

  // Initialize Hair Physics for the character
  characterRoot.updateMatrixWorld(true);
  hairPhysics.init(characterModel);

  // Skeleton helper
  skeletonHelper = new THREE.SkeletonHelper(characterModel);
  skeletonHelper.visible = toggleSkeleton.checked;
  scene.add(skeletonHelper);

  // Update UI Stats
  infoBones.textContent = boneCount;
  infoMeshes.textContent = meshCount;
  statusElem.textContent = fileName;

  resetCharacterPosition();
}

function resetCharacterPosition() {
  characterRoot.position.set(0, 0, 0);
  charPhysics.velocityY = 0;
  charPhysics.isGrounded = true;
  charPhysics.targetRotation = 0;
  charPhysics.currentRotation = 0;
  charPhysics.movementVelocity.set(0, 0, 0);
  characterRoot.rotation.y = 0;

  if (hairPhysics) hairPhysics.reset();

  camera.position.set(0, 2.5, 5.0);
  controls.target.set(0, 1.2, 0);
  controls.update();
}

function setupEventListeners() {
  window.addEventListener('resize', onWindowResize);

  btnReset.addEventListener('click', resetCharacterPosition);

  // Keyboard navigation
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // File Picker
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) loadLocalFile(file);
  });

  // Drag & Drop
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropOverlay.classList.add('active');
  });

  window.addEventListener('dragleave', (e) => {
    if (e.relatedTarget === null) {
      dropOverlay.classList.remove('active');
    }
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dropOverlay.classList.remove('active');
    if (e.dataTransfer.files.length > 0) {
      loadLocalFile(e.dataTransfer.files[0]);
    }
  });

  // UI Toggles & Sliders
  sliderSpeed.addEventListener('input', (e) => {
    charPhysics.baseSpeed = parseFloat(e.target.value);
  });

  toggleHair.addEventListener('change', (e) => {
    if (hairPhysics) hairPhysics.enabled = e.target.checked;
  });

  sliderStiffness.addEventListener('input', (e) => {
    if (hairPhysics) {
      if (hairPhysics.config) hairPhysics.config.stiffness = parseFloat(e.target.value);
      hairPhysics.stiffness = parseFloat(e.target.value);
    }
  });

  sliderDamping.addEventListener('input', (e) => {
    if (hairPhysics) {
      if (hairPhysics.config) hairPhysics.config.damping = parseFloat(e.target.value);
      hairPhysics.damping = parseFloat(e.target.value);
    }
  });

  sliderWind.addEventListener('input', (e) => {
    if (hairPhysics) hairPhysics.windStrength = parseFloat(e.target.value);
  });

  toggleHairDebug.addEventListener('change', (e) => {
    if (hairPhysics && typeof hairPhysics.setDebug === 'function') hairPhysics.setDebug(e.target.checked);
  });

  toggleSkeleton.addEventListener('change', (e) => {
    if (skeletonHelper) skeletonHelper.visible = e.target.checked;
  });

  toggleWireframe.addEventListener('change', (e) => {
    const isWire = e.target.checked;
    if (characterModel) {
      characterModel.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.wireframe = isWire;
        }
      });
    }
  });
}

function loadLocalFile(file) {
  statusElem.textContent = 'Parsing ' + file.name + '...';
  const reader = new FileReader();
  reader.addEventListener('load', (e) => {
    const contents = e.target.result;
    const loader = new GLTFLoader();
    loader.parse(
      contents,
      '',
      (gltf) => {
        onCharacterLoaded(gltf, file.name);
      },
      (err) => {
        console.error('Error parsing GLB:', err);
        statusElem.textContent = 'Failed to load model';
      }
    );
  });
  reader.readAsArrayBuffer(file);
}

function onKeyDown(e) {
  const code = e.code;
  switch (code) {
    case 'KeyW':
    case 'ArrowUp':
      moveState.forward = true;
      setKeyActive('key-w', true);
      break;
    case 'KeyS':
    case 'ArrowDown':
      moveState.backward = true;
      setKeyActive('key-s', true);
      break;
    case 'KeyA':
    case 'ArrowLeft':
      moveState.left = true;
      setKeyActive('key-a', true);
      break;
    case 'KeyD':
    case 'ArrowRight':
      moveState.right = true;
      setKeyActive('key-d', true);
      break;
    case 'Space':
      if (charPhysics.isGrounded) {
        charPhysics.velocityY = charPhysics.jumpForce;
        charPhysics.isGrounded = false;
      }
      setKeyActive('key-space', true);
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      moveState.sprint = true;
      setKeyActive('key-shift', true);
      break;
    case 'KeyR':
      resetCharacterPosition();
      break;
  }
}

function onKeyUp(e) {
  const code = e.code;
  switch (code) {
    case 'KeyW':
    case 'ArrowUp':
      moveState.forward = false;
      setKeyActive('key-w', false);
      break;
    case 'KeyS':
    case 'ArrowDown':
      moveState.backward = false;
      setKeyActive('key-s', false);
      break;
    case 'KeyA':
    case 'ArrowLeft':
      moveState.left = false;
      setKeyActive('key-a', false);
      break;
    case 'KeyD':
    case 'ArrowRight':
      moveState.right = false;
      setKeyActive('key-d', false);
      break;
    case 'Space':
      setKeyActive('key-space', false);
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      moveState.sprint = false;
      setKeyActive('key-shift', false);
      break;
  }
}

function setKeyActive(id, active) {
  const el = document.getElementById(id);
  if (el) {
    if (active) el.classList.add('active');
    else el.classList.remove('active');
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// 3rd Person Character Controller & Movement Update
function updateCharacter(delta) {
  const inputX = (moveState.right ? 1 : 0) - (moveState.left ? 1 : 0);
  const inputZ = (moveState.backward ? 1 : 0) - (moveState.forward ? 1 : 0);
  const isMoving = inputX !== 0 || inputZ !== 0;

  if (isMoving) {
    const camAngle = Math.atan2(
      camera.position.x - controls.target.x,
      camera.position.z - controls.target.z
    );

    const inputAngle = Math.atan2(inputX, inputZ);
    charPhysics.targetRotation = camAngle + inputAngle;

    const currentSpeed = (charPhysics.baseSpeed * (moveState.sprint ? charPhysics.sprintMultiplier : 1.0));
    const speed = currentSpeed * delta;
    const moveDir = new THREE.Vector3(Math.sin(charPhysics.targetRotation), 0, Math.cos(charPhysics.targetRotation));

    // Record movement velocity for hair inertia
    charPhysics.movementVelocity.copy(moveDir).multiplyScalar(currentSpeed);

    // Move character root
    const prevPos = characterRoot.position.clone();
    characterRoot.position.addScaledVector(moveDir, speed);

    // Keep camera following character smoothly
    const displacement = characterRoot.position.clone().sub(prevPos);
    camera.position.add(displacement);
    controls.target.add(displacement);

    // Procedural walk bob & subtle lean for static models
    if (toggleProcedural.checked && characterModel) {
      charPhysics.walkCycle += delta * (moveState.sprint ? 14 : 9);
      const bobY = Math.abs(Math.sin(charPhysics.walkCycle)) * 0.06;
      const tiltZ = Math.sin(charPhysics.walkCycle) * 0.04;
      characterModel.position.y = bobY;
      characterModel.rotation.z = tiltZ;
    }
  } else {
    charPhysics.movementVelocity.set(0, 0, 0);
    if (characterModel) {
      characterModel.position.y = THREE.MathUtils.lerp(characterModel.position.y, 0, delta * 10);
      characterModel.rotation.z = THREE.MathUtils.lerp(characterModel.rotation.z, 0, delta * 10);
    }
  }

  // Smooth character rotation toward target angle
  let angleDiff = charPhysics.targetRotation - charPhysics.currentRotation;
  angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
  charPhysics.currentRotation += angleDiff * Math.min(delta * 12.0, 1.0);
  characterRoot.rotation.y = charPhysics.currentRotation;

  // Jump and Gravity Physics
  const prevY = characterRoot.position.y;
  if (!charPhysics.isGrounded) {
    charPhysics.velocityY += charPhysics.gravity * delta;
    characterRoot.position.y += charPhysics.velocityY * delta;
    charPhysics.movementVelocity.y = charPhysics.velocityY;

    if (characterRoot.position.y <= 0) {
      characterRoot.position.y = 0;
      charPhysics.velocityY = 0;
      charPhysics.isGrounded = true;
    }
  }
  const deltaY = characterRoot.position.y - prevY;
  camera.position.y += deltaY;

  // Smooth OrbitControls target tracking character chest/waist height
  const targetLook = characterRoot.position.clone().add(new THREE.Vector3(0, 1.2, 0));
  controls.target.copy(targetLook);
  controls.update();

  // Telemetry HUD
  posDisplay.textContent = `${characterRoot.position.x.toFixed(1)}, ${characterRoot.position.y.toFixed(1)}, ${characterRoot.position.z.toFixed(1)}`;
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);

  // 1. Update Character Movement & Physics
  updateCharacter(delta);

  // 2. Update Hair Chain Physics
  if (toggleHair.checked && hairPhysics) {
    characterRoot.updateMatrixWorld(true);
    hairPhysics.update(delta);

    if (hairHelper) {
      hairHelper.update(hairPhysics);
    }
  }

  // 3. Render 3D Scene
  renderer.render(scene, camera);
}
