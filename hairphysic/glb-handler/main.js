import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

/* ===================================================
   STATE
=================================================== */
const S = {
  models: [],
  activeModelId: null,
  colliders: [],           // global, world-space
  selectedColliderId: null,
  tool: 'select',          // 'select' | 'sphere' | 'capsule'
  camMode: 'persp',        // 'persp' | 'ortho'
  viewName: 'Perspective',
  inFront: true,           // 'In Front' (X-Ray) view mode like Blender
  sphereCount: 0,
  capsuleCount: 0,
};

// Modal edit state: null | { mode: 'grab'|'scale', colliderId, originalPos, originalRadius, originalHeight, refX, refY, currentRadius, currentHeight }
let editMode = null;
let _editPrevLabel = '';

// Draft state: null | { fill, wire, type, startPoint, sx, sy, radius, height, endPoint, quat }
let draft = null;

// Global mouse tracking
let _mouseX = window.innerWidth / 2;
let _mouseY = window.innerHeight / 2;

/* ===================================================
   RENDERER
=================================================== */
const canvas = document.getElementById('viewport');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);

/* ===================================================
   SCENE
=================================================== */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e0e10);
scene.fog = new THREE.FogExp2(0x0e0e10, 0.025);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xfff8f0, 1.4);
sun.position.set(5, 10, 7);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.1; sun.shadow.camera.far = 200;
sun.shadow.camera.left = sun.shadow.camera.bottom = -20;
sun.shadow.camera.right = sun.shadow.camera.top = 20;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xd0e8ff, 0.35);
fill.position.set(-5, 3, -4);
scene.add(fill);

// Grid
scene.add(new THREE.GridHelper(30, 60, 0x1e1e28, 0x19191f));

// Global collider container (world space)
const collidersGroup = new THREE.Group();
scene.add(collidersGroup);

/* ===================================================
   CAMERAS
=================================================== */
let W = window.innerWidth, H = window.innerHeight;
const aspect = () => window.innerWidth / window.innerHeight;

const perspCam = new THREE.PerspectiveCamera(45, aspect(), 0.01, 1000);
perspCam.position.set(3, 2.5, 5);

let orthoSize = 3;
const orthoCam = new THREE.OrthographicCamera(
  -orthoSize * aspect(), orthoSize * aspect(),
  orthoSize, -orthoSize, 0.01, 1000
);
orthoCam.position.set(0, 0, 10);

let activeCam = perspCam;

const controls = new OrbitControls(perspCam, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.05;
controls.maxDistance = 500;
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.PAN,
};

function updateControlsState() {
  controls.enabled = (S.tool === 'select' && editMode === null && draft === null);
}

/* ===================================================
   LOADERS
=================================================== */
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/* ===================================================
   COLLIDER MATERIALS & GEOMETRY
=================================================== */
const SPHERE_HEX = 0x6ec8fb;
const CAPSULE_HEX = 0xfbb16e;

function makeColliderMats(hex, fillOpacity = 0.22, wireOpacity = 0.55) {
  return {
    fill: new THREE.MeshStandardMaterial({
      color: hex, transparent: true, opacity: fillOpacity,
      depthWrite: false, depthTest: !S.inFront, side: THREE.DoubleSide,
    }),
    wire: new THREE.MeshBasicMaterial({
      color: hex, wireframe: true, transparent: true, opacity: wireOpacity,
      depthWrite: false, depthTest: !S.inFront,
    }),
  };
}

function applyColliderHighlight(c, selected) {
  if (!c?.group) return;
  const fc = selected ? 0xfbb16e : c.color;
  const fi = selected ? 0.38 : 0.22;
  const wi = selected ? 0.9 : 0.55;
  c.group.children.forEach((ch, i) => {
    if (!ch.material) return;
    ch.material.color.set(fc);
    ch.material.opacity = i === 0 ? fi : wi;
  });
}

function makeSphereGroup(r, hex = SPHERE_HEX, fillOp = 0.22, wireOp = 0.55) {
  const geo = new THREE.SphereGeometry(r, 12, 8);
  const { fill, wire } = makeColliderMats(hex, fillOp, wireOp);
  const fillMesh = new THREE.Mesh(geo, fill);
  const wireMesh = new THREE.Mesh(geo, wire);
  fillMesh.renderOrder = S.inFront ? 999 : 0;
  wireMesh.renderOrder = S.inFront ? 1000 : 1;
  const g = new THREE.Group();
  g.add(fillMesh, wireMesh);
  return g;
}

function makeCapsuleGroup(r, h, hex = CAPSULE_HEX, fillOp = 0.22, wireOp = 0.55) {
  const geo = new THREE.CapsuleGeometry(r, h, 4, 10);
  const { fill, wire } = makeColliderMats(hex, fillOp, wireOp);
  const fillMesh = new THREE.Mesh(geo, fill);
  const wireMesh = new THREE.Mesh(geo, wire);
  fillMesh.renderOrder = S.inFront ? 999 : 0;
  wireMesh.renderOrder = S.inFront ? 1000 : 1;
  const g = new THREE.Group();
  g.add(fillMesh, wireMesh);
  return g;
}

function setInFront(enabled) {
  S.inFront = !!enabled;
  document.getElementById('btn-infront')?.classList.toggle('active', S.inFront);
  
  S.colliders.forEach(c => {
    if (!c.group) return;
    c.group.children.forEach((ch, idx) => {
      if (ch.material) {
        ch.material.depthTest = !S.inFront;
        ch.material.needsUpdate = true;
      }
      ch.renderOrder = S.inFront ? (idx === 0 ? 999 : 1000) : (idx === 0 ? 0 : 1);
    });
  });

  if (draft?.group) {
    draft.group.children.forEach((ch, idx) => {
      if (ch.material) {
        ch.material.depthTest = !S.inFront;
        ch.material.needsUpdate = true;
      }
      ch.renderOrder = S.inFront ? (idx === 0 ? 999 : 1000) : (idx === 0 ? 0 : 1);
    });
  }
}

function toggleInFront() {
  setInFront(!S.inFront);
}

function updateGeoForCollider(c) {
  const geo = c.type === 'sphere'
    ? new THREE.SphereGeometry(c.radius, 12, 8)
    : new THREE.CapsuleGeometry(c.radius, c.height, 4, 10);
  c.group.children.forEach(ch => {
    if (ch.isMesh) {
      ch.geometry.dispose();
      ch.geometry = geo;
    }
  });
}

/* ===================================================
   RAYCASTER & HIT TESTING
=================================================== */
const rc = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _scratchVec = new THREE.Vector3();

function ndcFromEvent(e) {
  return new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );
}

function getHitPoint(e) {
  const ndc = ndcFromEvent(e);
  rc.setFromCamera(ndc, activeCam);

  if (S.camMode === 'ortho') {
    const dir = activeCam.getWorldDirection(_scratchVec);
    const tgt = controls.target;
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(dir, tgt);
    const hit = new THREE.Vector3();
    return rc.ray.intersectPlane(plane, hit) ? hit : null;
  }

  // 1. Perspective: model surface first (across all loaded models)
  const allMeshes = S.models.flatMap(m => m.meshes);
  if (allMeshes.length > 0) {
    const hits = rc.intersectObjects(allMeshes, false);
    if (hits.length > 0) return hits[0].point.clone();
  }

  // 2. Fallback: ground plane
  const hit = new THREE.Vector3();
  return rc.ray.intersectPlane(groundPlane, hit) ? hit : null;
}

function hitColliders(ndc) {
  rc.setFromCamera(ndc, activeCam);
  const collMeshes = [];
  S.colliders.forEach(c => c.group.traverse(ch => { if (ch.isMesh) collMeshes.push(ch); }));
  const hits = rc.intersectObjects(collMeshes, false);
  if (!hits.length) return null;
  for (const c of S.colliders) {
    let found = false;
    c.group.traverse(ch => { if (ch === hits[0].object) found = true; });
    if (found) return c;
  }
  return null;
}

/* ===================================================
   HELPERS
=================================================== */
let _uid = 0;
const uid = () => ++_uid;
const activeModel = () => S.models.find(m => m.id === S.activeModelId) ?? null;
const selCollider = () => S.colliders.find(c => c.id === S.selectedColliderId) ?? null;
const f4 = n => parseFloat(n.toFixed(4));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function buildJSON() {
  return S.colliders.map(c => {
    const p = c.group.position;
    if (c.type === 'sphere') return {
      name: c.name, type: 'sphere',
      position: { x: f4(p.x), y: f4(p.y), z: f4(p.z) },
      radius: f4(c.radius),
    };
    const q = c.group.quaternion;
    return {
      name: c.name, type: 'capsule',
      position: { x: f4(p.x), y: f4(p.y), z: f4(p.z) },
      radius: f4(c.radius), height: f4(c.height),
      quaternion: { x: f4(q.x), y: f4(q.y), z: f4(q.z), w: f4(q.w) },
    };
  });
}

/* ===================================================
   AUTO-FRAME & CAMERAS
=================================================== */
function frameModel(m) {
  const box = new THREE.Box3().setFromObject(m.group);
  const center = new THREE.Vector3(); box.getCenter(center);
  const size = new THREE.Vector3(); box.getSize(size);
  const maxD = Math.max(size.x, size.y, size.z, 0.1);
  const fovR = perspCam.fov * Math.PI / 180;
  const dist = (maxD / 2) / Math.tan(fovR / 2) * 1.6;
  const dir = perspCam.position.clone().sub(controls.target).normalize();
  const to = center.clone().add(dir.multiplyScalar(dist));
  const fromPos = perspCam.position.clone();
  const fromTgt = controls.target.clone();
  let t = 0;
  (function tick() {
    t = Math.min(t + 0.05, 1);
    const k = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    perspCam.position.lerpVectors(fromPos, to, k);
    controls.target.lerpVectors(fromTgt, center, k);
    controls.update(); syncOrtho();
    if (t < 1) requestAnimationFrame(tick);
  })();
}

function syncOrtho() {
  orthoCam.position.copy(perspCam.position);
  orthoCam.quaternion.copy(perspCam.quaternion);
  const asp = aspect();
  const d = controls.target.distanceTo(perspCam.position);
  const s = d * Math.tan((perspCam.fov * Math.PI / 180) / 2);
  orthoSize = s;
  orthoCam.left = -s * asp; orthoCam.right = s * asp;
  orthoCam.top = s; orthoCam.bottom = -s;
  orthoCam.updateProjectionMatrix();
}

const ORTHO_VIEWS = {
  front:  { pos: [0, 0, 1],  up: [0, 1, 0],  name: 'Front' },
  back:   { pos: [0, 0, -1], up: [0, 1, 0],  name: 'Back' },
  top:    { pos: [0, 1, 0],  up: [0, 0, -1], name: 'Top' },
  bottom: { pos: [0, -1, 0], up: [0, 0, 1],  name: 'Bottom' },
  right:  { pos: [1, 0, 0],  up: [0, 1, 0],  name: 'Right' },
  left:   { pos: [-1, 0, 0], up: [0, 1, 0],  name: 'Left' },
};

function snapView(key) {
  const v = ORTHO_VIEWS[key]; if (!v) return;
  const tgt = controls.target.clone();
  const dist = perspCam.position.distanceTo(tgt);
  const toPos = tgt.clone().add(new THREE.Vector3(...v.pos).multiplyScalar(dist));
  const fromPos = perspCam.position.clone();
  const fromUp = perspCam.up.clone();
  const toUp = new THREE.Vector3(...v.up);
  let t = 0;
  (function tick() {
    t = Math.min(t + 0.06, 1);
    const k = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    perspCam.position.lerpVectors(fromPos, toPos, k);
    perspCam.up.lerpVectors(fromUp, toUp, k).normalize();
    perspCam.lookAt(tgt);
    controls.update(); syncOrtho();
    if (t < 1) { requestAnimationFrame(tick); return; }
    orthoCam.position.copy(toPos);
    orthoCam.up.copy(toUp);
    orthoCam.lookAt(tgt);
    toOrtho(); setHud(v.name);
  })();
}

function toOrtho() {
  S.camMode = 'ortho'; activeCam = orthoCam;
  updateControlsState();
  document.getElementById('btn-ortho').classList.add('active');
}
function toPersp() {
  S.camMode = 'persp'; activeCam = perspCam;
  updateControlsState();
  document.getElementById('btn-ortho').classList.remove('active');
  setHud('Perspective');
}
function toggleCam() { S.camMode === 'persp' ? toOrtho() : toPersp(); }

/* ===================================================
   GIZMO
=================================================== */
const gc = document.getElementById('gizmo-canvas');
const gx = gc.getContext('2d');
const GAXES = [
  { d: [1, 0, 0],  col: '#f55', lbl: '+X', key: 'right' },
  { d: [-1, 0, 0], col: '#a22', lbl: '-X', key: 'left' },
  { d: [0, 1, 0],  col: '#5f5', lbl: '+Y', key: 'top' },
  { d: [0, -1, 0], col: '#282', lbl: '-Y', key: 'bottom' },
  { d: [0, 0, 1],  col: '#55f', lbl: '+Z', key: 'front' },
  { d: [0, 0, -1], col: '#228', lbl: '-Z', key: 'back' },
];

function drawGizmo() {
  const SZ = 96; gx.clearRect(0, 0, SZ, SZ);
  const cx = SZ / 2, cy = SZ / 2, r = 34;
  const qInv = perspCam.quaternion.clone().invert();
  const pts = GAXES.map(ax => {
    const v = new THREE.Vector3(...ax.d).applyQuaternion(qInv);
    return { ...ax, px: cx + v.x * r, py: cy - v.y * r, z: v.z };
  });
  pts.sort((a, b) => a.z - b.z);
  pts.forEach(ax => {
    const isFacing = ax.z > 0;
    const a = isFacing ? 1 : 0.38;
    const dr = isFacing ? 9 : 6;
    const hexA = Math.round(a * 255).toString(16).padStart(2, '0');
    
    // Line to center
    gx.beginPath(); gx.moveTo(cx, cy); gx.lineTo(ax.px, ax.py);
    gx.strokeStyle = ax.col + hexA; gx.lineWidth = 2; gx.stroke();
    
    // Axis circle
    gx.beginPath(); gx.arc(ax.px, ax.py, dr, 0, Math.PI * 2);
    gx.fillStyle = ax.col + hexA; gx.fill();
    
    // Active Ortho View ring indicator
    const isCurrentView = S.camMode === 'ortho' && ORTHO_VIEWS[ax.key]?.name === S.viewName;
    if (isCurrentView) {
      gx.beginPath(); gx.arc(ax.px, ax.py, dr + 3.5, 0, Math.PI * 2);
      gx.strokeStyle = '#ffffff'; gx.lineWidth = 2; gx.stroke();
    }
    
    if (isFacing) {
      gx.fillStyle = '#fff'; gx.font = 'bold 8px Inter,sans-serif';
      gx.textAlign = 'center'; gx.textBaseline = 'middle';
      gx.fillText(ax.lbl, ax.px, ax.py);
    }
  });
  gx.beginPath(); gx.arc(cx, cy, 5, 0, Math.PI * 2); gx.fillStyle = '#999'; gx.fill();
}

let _gizmoDrag = null;

gc.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  e.preventDefault();
  gc.setPointerCapture(e.pointerId);
  _gizmoDrag = {
    startX: e.clientX,
    startY: e.clientY,
    moved: false,
  };
});

gc.addEventListener('pointermove', e => {
  if (!_gizmoDrag) return;
  const dx = e.clientX - _gizmoDrag.startX;
  const dy = e.clientY - _gizmoDrag.startY;
  if (Math.hypot(dx, dy) > 2) {
    _gizmoDrag.moved = true;
    if (S.camMode === 'ortho') {
      toPersp();
    }
    
    const tgt = controls.target;
    const offset = perspCam.position.clone().sub(tgt);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    spherical.theta -= dx * 0.015;
    spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, spherical.phi - dy * 0.015));
    spherical.makeSafe();
    
    offset.setFromSpherical(spherical);
    perspCam.position.copy(tgt).add(offset);
    perspCam.lookAt(tgt);
    controls.update();
    syncOrtho();
    drawGizmo();
    
    _gizmoDrag.startX = e.clientX;
    _gizmoDrag.startY = e.clientY;
  }
});

gc.addEventListener('pointerup', e => {
  if (gc.hasPointerCapture(e.pointerId)) {
    try { gc.releasePointerCapture(e.pointerId); } catch (_) {}
  }
  if (!_gizmoDrag) return;
  const wasDrag = _gizmoDrag.moved;
  _gizmoDrag = null;

  if (!wasDrag) {
    const r2 = gc.getBoundingClientRect();
    const mx = e.clientX - r2.left, my = e.clientY - r2.top;
    const qInv = perspCam.quaternion.clone().invert();
    let best = null, bestD = 16;
    GAXES.forEach(ax => {
      const v = new THREE.Vector3(...ax.d).applyQuaternion(qInv);
      const px = 48 + v.x * 34, py = 48 - v.y * 34;
      const d = Math.hypot(mx - px, my - py);
      if (d < bestD) { bestD = d; best = ax; }
    });
    if (best) {
      const v = ORTHO_VIEWS[best.key];
      // Toggle off to perspective if clicking the already active ortho view
      if (S.camMode === 'ortho' && S.viewName === v?.name) {
        toPersp();
      } else {
        snapView(best.key);
      }
    } else {
      toPersp();
    }
  }
});

gc.addEventListener('dblclick', () => toPersp());

/* ===================================================
   LOAD MODEL
=================================================== */
async function loadFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const gltf = await new Promise((res, rej) => gltfLoader.load(url, res, undefined, rej));
    const group = new THREE.Group();
    group.add(gltf.scene);
    const meshes = [];
    gltf.scene.traverse(ch => {
      if (ch.isMesh) { ch.castShadow = true; ch.receiveShadow = true; meshes.push(ch); }
    });
    const name = file.name.replace(/\.(glb|gltf)$/i, '');
    const id = uid();
    const mo = { id, name, scene: gltf.scene, group, meshes, visible: true };
    S.models.push(mo);
    scene.add(group);
    setActiveModel(id);
    frameModel(mo);
    updateDropOverlay();
  } catch (err) {
    console.error('Load failed:', err);
    alert('Failed to load: ' + file.name);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ===================================================
   MODEL MANAGEMENT
=================================================== */
function setActiveModel(id) {
  S.activeModelId = id;
  refreshModelList();
}

function deleteModel(id) {
  const idx = S.models.findIndex(m => m.id === id); if (idx < 0) return;
  const m = S.models[idx];
  scene.remove(m.group);
  m.group.traverse(ch => {
    if (ch.isMesh) {
      ch.geometry?.dispose();
      if (Array.isArray(ch.material)) ch.material.forEach(x => x.dispose());
      else ch.material?.dispose();
    }
  });
  S.models.splice(idx, 1);
  if (S.activeModelId === id) S.activeModelId = S.models[0]?.id ?? null;
  refreshModelList(); updateDropOverlay();
}

function toggleVis(id) {
  const m = S.models.find(m => m.id === id); if (!m) return;
  m.visible = !m.visible; m.group.visible = m.visible;
  refreshModelList();
}

/* ===================================================
   COLLIDER MANAGEMENT
=================================================== */
function addCollider(coll) {
  S.colliders.push(coll);
  collidersGroup.add(coll.group);
  S.selectedColliderId = coll.id;
  applyColliderHighlight(coll, true);
  refreshColliderList();
}

function disposeCollider(c) {
  c.group.traverse(ch => { if (ch.isMesh) { ch.geometry?.dispose(); ch.material?.dispose(); } });
  collidersGroup.remove(c.group);
}

function deleteCollider(id) {
  const idx = S.colliders.findIndex(c => c.id === id); if (idx < 0) return;
  disposeCollider(S.colliders[idx]);
  S.colliders.splice(idx, 1);
  if (S.selectedColliderId === id) S.selectedColliderId = null;
  refreshColliderList();
}

function selectCollider(id) {
  const old = selCollider();
  if (old) applyColliderHighlight(old, false);
  S.selectedColliderId = id;
  const nw = selCollider();
  if (nw) applyColliderHighlight(nw, true);
  refreshColliderList();
}

/* ===================================================
   DRAFT PLACEMENT (SPHERE & CAPSULE AUTHORING)
=================================================== */
const PIXEL_SCALE = 1 / 200;

function startDraft(type, startPoint, sx, sy) {
  const isSphere = type === 'sphere';
  const group = isSphere
    ? makeSphereGroup(0.001, SPHERE_HEX, 0.3, 0.75)
    : makeCapsuleGroup(0.2, 0.001, CAPSULE_HEX, 0.3, 0.75);

  group.position.copy(startPoint);
  collidersGroup.add(group);

  draft = {
    group,
    type,
    startPoint: startPoint.clone(),
    sx, sy,
    radius: 0.001,
    height: 0.001,
  };
  updateControlsState();
}

function updateDraft(e) {
  if (!draft) return;
  const { group, type, startPoint, sx, sy } = draft;

  const dx = e.clientX - sx;
  const dy = e.clientY - sy;
  const px = Math.hypot(dx, dy);

  if (type === 'sphere') {
    const radius = Math.max(0.01, px * PIXEL_SCALE);
    draft.radius = radius;
    const geo = new THREE.SphereGeometry(radius, 12, 8);
    group.children.forEach(ch => { if (ch.isMesh) { ch.geometry.dispose(); ch.geometry = geo; } });
    group.position.copy(startPoint);
  } else {
    const height = Math.max(0.01, px * PIXEL_SCALE);
    draft.height = height;

    const camRight = new THREE.Vector3();
    const camUp = new THREE.Vector3();
    activeCam.matrixWorld.extractBasis(camRight, camUp, _scratchVec);

    const worldDir = camRight.clone().multiplyScalar(dx)
      .add(camUp.clone().multiplyScalar(-dy));

    if (worldDir.length() > 0.0001) worldDir.normalize();

    const endPoint = startPoint.clone().addScaledVector(worldDir, height);
    draft.endPoint = endPoint;

    const geo = new THREE.CapsuleGeometry(0.2, height, 4, 10);
    group.children.forEach(ch => { if (ch.isMesh) { ch.geometry.dispose(); ch.geometry = geo; } });

    const mid = startPoint.clone().lerp(endPoint, 0.5);
    group.position.copy(mid);

    if (px > 1) {
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), worldDir);
      group.quaternion.copy(quat);
      draft.quat = quat.clone();
    }
  }
}

function cancelDraft() {
  if (!draft) return;
  collidersGroup.remove(draft.group);
  draft.group.traverse(ch => { if (ch.isMesh) { ch.geometry?.dispose(); ch.material?.dispose(); } });
  draft = null;
  updateControlsState();
}

function finalizeDraft() {
  if (!draft) return;
  const { group, type, startPoint, radius, height, endPoint, quat } = draft;

  // Small drag threshold to ignore tiny accidental clicks
  if (type === 'sphere' && radius < 0.04) { cancelDraft(); return; }
  if (type === 'capsule' && height < 0.04) { cancelDraft(); return; }

  // Clean up draft preview
  collidersGroup.remove(group);
  group.traverse(ch => { if (ch.isMesh) { ch.geometry?.dispose(); ch.material?.dispose(); } });
  draft = null;
  updateControlsState();

  if (type === 'sphere') {
    const finalGroup = makeSphereGroup(radius, SPHERE_HEX);
    finalGroup.position.copy(startPoint);
    addCollider({
      id: uid(),
      type: 'sphere',
      name: `Sphere ${++S.sphereCount}`,
      group: finalGroup,
      radius,
      color: SPHERE_HEX,
    });
  } else {
    const finalGroup = makeCapsuleGroup(0.2, height, CAPSULE_HEX);
    const mid = startPoint.clone().lerp(endPoint, 0.5);
    finalGroup.position.copy(mid);
    if (quat) finalGroup.quaternion.copy(quat);
    addCollider({
      id: uid(),
      type: 'capsule',
      name: `Capsule ${++S.capsuleCount}`,
      group: finalGroup,
      radius: 0.2,
      height,
      color: CAPSULE_HEX,
    });
  }
}

/* ===================================================
   MODAL EDITING (GRAB 'G' & SCALE 'S')
=================================================== */
function getWorldPerPixel() {
  if (S.camMode === 'ortho') return (orthoCam.top - orthoCam.bottom) / window.innerHeight;
  const dist = perspCam.position.distanceTo(controls.target);
  return dist * Math.tan(perspCam.fov * Math.PI / 360) * 2 / window.innerHeight;
}

function enterGrab() {
  if (S.tool !== 'select') return;
  const c = selCollider(); if (!c) return;

  _editPrevLabel = S.viewName;
  editMode = {
    mode: 'grab',
    colliderId: c.id,
    originalPos: c.group.position.clone(),
    refX: _mouseX,
    refY: _mouseY,
  };
  updateControlsState();
  showHint('GRAB (collider) · Move mouse · LMB / Enter = confirm · Esc = cancel');
  setHud('GRAB MODE', true);
}

function enterScale() {
  if (S.tool !== 'select') return;
  const c = selCollider(); if (!c) return;

  _editPrevLabel = S.viewName;
  editMode = {
    mode: 'scale',
    colliderId: c.id,
    originalRadius: c.radius,
    originalHeight: c.height,
    refX: _mouseX,
    refY: _mouseY,
  };
  updateControlsState();
  showHint('SCALE (collider) · Drag right = bigger · LMB / Enter = confirm · Esc = cancel');
  setHud('SCALE MODE', true);
}

function applyEditMove() {
  if (!editMode) return;
  const c = selCollider(); if (!c || c.id !== editMode.colliderId) return;

  const camRight = new THREE.Vector3();
  const camUp = new THREE.Vector3();
  activeCam.matrixWorld.extractBasis(camRight, camUp, _scratchVec);

  if (editMode.mode === 'grab') {
    const dx = _mouseX - editMode.refX;
    const dy = _mouseY - editMode.refY;
    const wpp = getWorldPerPixel();
    const offset = camRight.clone().multiplyScalar(dx * wpp)
      .add(camUp.clone().multiplyScalar(-dy * wpp));
    c.group.position.copy(editMode.originalPos.clone().add(offset));
  } else {
    const dx = _mouseX - editMode.refX;
    const factor = Math.max(0.05, 1 + dx / 200);
    const newRadius = Math.max(0.01, editMode.originalRadius * factor);
    editMode.currentRadius = newRadius;
    c.radius = newRadius;

    if (c.type === 'capsule') {
      const newHeight = Math.max(0.01, editMode.originalHeight * factor);
      editMode.currentHeight = newHeight;
      c.height = newHeight;
    }
    updateGeoForCollider(c);
  }
  refreshColliderList();
}

function confirmEdit() {
  if (!editMode) return;
  const c = selCollider();
  if (c && editMode.mode === 'scale') {
    if (editMode.currentRadius !== undefined) c.radius = editMode.currentRadius;
    if (editMode.currentHeight !== undefined) c.height = editMode.currentHeight;
  }
  editMode = null;
  updateControlsState();
  hideHint();
  setHud(_editPrevLabel || 'Perspective', false);
  refreshColliderList();
}

function cancelEdit() {
  if (!editMode) return;
  const c = selCollider();
  if (c) {
    if (editMode.mode === 'grab') {
      c.group.position.copy(editMode.originalPos);
    } else {
      c.radius = editMode.originalRadius;
      if (c.type === 'capsule') c.height = editMode.originalHeight;
      updateGeoForCollider(c);
    }
  }
  editMode = null;
  updateControlsState();
  hideHint();
  setHud(_editPrevLabel || 'Perspective', false);
  refreshColliderList();
}

/* ===================================================
   UI REFRESH
=================================================== */
function refreshModelList() {
  const el = document.getElementById('model-list');
  document.getElementById('model-count').textContent = S.models.length;
  if (!S.models.length) { el.innerHTML = '<div class="empty-state">No models loaded.<br/>Drop a GLB file.</div>'; return; }
  el.innerHTML = '';
  S.models.forEach(m => {
    const div = document.createElement('div');
    div.className = 'list-item' + (m.id === S.activeModelId ? ' active' : '');
    div.innerHTML = `
      <span class="item-icon">📦</span>
      <span class="item-name" title="${esc(m.name)}">${esc(m.name)}</span>
      <span class="item-action item-vis" data-vis="${m.id}" title="Toggle visibility" style="opacity:1;color:${m.visible ? '#aaa' : '#444'}">${m.visible ? '👁' : '🙈'}</span>
      <span class="item-action" data-del-m="${m.id}" title="Delete model">✕</span>
    `;
    div.addEventListener('click', e => {
      if (e.target.dataset.vis) { toggleVis(+e.target.dataset.vis); return; }
      if (e.target.dataset.delM) { deleteModel(+e.target.dataset.delM); return; }
      setActiveModel(m.id); frameModel(m);
    });
    div.querySelector('.item-name').addEventListener('dblclick', e => {
      e.stopPropagation();
      const input = document.createElement('input');
      input.className = 'rename-input'; input.value = m.name;
      e.target.replaceWith(input); input.focus(); input.select();
      const commit = () => { m.name = input.value.trim() || m.name; refreshModelList(); };
      input.addEventListener('blur', commit);
      input.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') { ev.stopPropagation(); commit(); }
        if (ev.key === 'Escape') refreshModelList();
      });
    });
    el.appendChild(div);
  });
}

function refreshColliderList() {
  const el = document.getElementById('collider-list');
  document.getElementById('collider-count').textContent = S.colliders.length;
  document.getElementById('collider-footer').style.display = S.colliders.length ? 'flex' : 'none';
  if (!S.colliders.length) {
    el.innerHTML = '<div class="empty-state">No colliders yet.<br/>Use Sphere/Capsule tool to draw.</div>';
    return;
  }
  el.innerHTML = '';
  S.colliders.forEach(c => {
    const sel = c.id === S.selectedColliderId;
    const div = document.createElement('div');
    div.className = 'list-item' + (sel ? ' active' : '');
    const tClass = c.type === 'sphere' ? 'badge-sphere' : 'badge-capsule';
    div.innerHTML = `
      <span class="item-type-badge ${tClass}">${c.type === 'sphere' ? 'SPH' : 'CAP'}</span>
      <span class="item-name" title="${esc(c.name)}">${esc(c.name)}</span>
      <span class="item-action" data-del-c="${c.id}" title="Delete">✕</span>
    `;
    div.addEventListener('click', e => {
      if (e.target.dataset.delC) { deleteCollider(+e.target.dataset.delC); return; }
      selectCollider(c.id);
    });
    div.querySelector('.item-name').addEventListener('dblclick', e => {
      e.stopPropagation();
      const input = document.createElement('input');
      input.className = 'rename-input'; input.value = c.name;
      e.target.replaceWith(input); input.focus(); input.select();
      const commit = () => { c.name = input.value.trim() || c.name; refreshColliderList(); };
      input.addEventListener('blur', commit);
      input.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') { ev.stopPropagation(); commit(); }
        if (ev.key === 'Escape') refreshColliderList();
      });
    });
    el.appendChild(div);

    if (sel) {
      const stats = document.createElement('div');
      stats.className = 'collider-stats';
      const p = c.group.position;
      let html = `<span class="stat-label">X</span><span class="stat-val">${p.x.toFixed(3)}</span>
                  <span class="stat-label">Y</span><span class="stat-val">${p.y.toFixed(3)}</span>
                  <span class="stat-label">Z</span><span class="stat-val">${p.z.toFixed(3)}</span>
                  <span class="stat-label">R</span><span class="stat-val">${c.radius.toFixed(3)}</span>`;
      if (c.type === 'capsule') html += `<span class="stat-label">H</span><span class="stat-val">${c.height.toFixed(3)}</span><span></span><span></span>`;
      stats.innerHTML = html;
      el.appendChild(stats);
    }
  });
}

function updateDropOverlay() {
  document.getElementById('drop-overlay').classList.toggle('hidden', S.models.length > 0);
}

/* ===================================================
   HUD
=================================================== */
function setHud(txt, modal = false) {
  const el = document.getElementById('view-hud');
  el.textContent = txt;
  if (!modal) S.viewName = txt;
  el.classList.toggle('modal', modal);
}
function showHint(txt) { const e = document.getElementById('modal-hint'); e.textContent = txt; e.classList.add('visible'); }
function hideHint() { document.getElementById('modal-hint').classList.remove('visible'); }

/* ===================================================
   TOOL SWITCHING
=================================================== */
function setTool(name) {
  S.tool = name;
  ['tool-select', 'tool-sphere', 'tool-capsule'].forEach(id => {
    document.getElementById(id)?.classList.remove('active');
  });
  const map = { select: 'tool-select', sphere: 'tool-sphere', capsule: 'tool-capsule' };
  document.getElementById(map[name])?.classList.add('active');
  canvas.style.cursor = name === 'select' ? 'default' : 'crosshair';
  updateControlsState();
}

document.getElementById('tool-select').addEventListener('click', () => setTool('select'));
document.getElementById('tool-sphere').addEventListener('click', () => setTool('sphere'));
document.getElementById('tool-capsule').addEventListener('click', () => setTool('capsule'));
document.getElementById('btn-ortho').addEventListener('click', toggleCam);
document.getElementById('btn-infront').addEventListener('click', toggleInFront);
document.getElementById('btn-frame').addEventListener('click', () => { const m = activeModel(); if (m) frameModel(m); });

/* ===================================================
   POINTER HANDLERS (CANVAS)
=================================================== */
let _lmbDown = false;
let _lmbMoved = false;
let _downPos = null;

canvas.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  _lmbDown = true;
  _lmbMoved = false;
  _downPos = { x: e.clientX, y: e.clientY };

  if (editMode) return;

  if (S.tool === 'sphere' || S.tool === 'capsule') {
    const hit = getHitPoint(e);
    if (hit) {
      canvas.setPointerCapture(e.pointerId);
      startDraft(S.tool, hit, e.clientX, e.clientY);
    }
  }
});

canvas.addEventListener('pointermove', e => {
  _mouseX = e.clientX;
  _mouseY = e.clientY;

  if (editMode) {
    applyEditMove();
    return;
  }

  if (draft) {
    updateDraft(e);
    _lmbMoved = true;
    return;
  }

  if (_lmbDown && _downPos) {
    if (Math.hypot(e.clientX - _downPos.x, e.clientY - _downPos.y) > 3) {
      _lmbMoved = true;
      if (S.camMode === 'ortho' && S.tool === 'select' && !editMode && !draft) {
        toPersp();
      }
    }
  }
});

canvas.addEventListener('pointerup', e => {
  if (canvas.hasPointerCapture(e.pointerId)) {
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
  }
  if (e.button !== 0) { _lmbDown = false; return; }

  if (editMode) {
    confirmEdit();
    _lmbDown = false;
    return;
  }

  const wasDrag = _lmbMoved;
  _lmbDown = false;
  _downPos = null;

  if (draft) {
    finalizeDraft();
    return;
  }

  if (!wasDrag && S.tool === 'select') {
    const ndc = ndcFromEvent(e);

    // 1. Try to hit collider first
    const c = hitColliders(ndc);
    if (c) {
      selectCollider(c.id);
      return;
    }

    // 2. Try to hit model mesh next
    rc.setFromCamera(ndc, activeCam);
    const allMeshes = S.models.flatMap(m => m.meshes);
    const hits = rc.intersectObjects(allMeshes, false);
    if (hits.length > 0) {
      const owner = S.models.find(m => m.meshes.includes(hits[0].object));
      if (owner) {
        setActiveModel(owner.id);
        return;
      }
    }

    // 3. Miss: deselect collider
    const old = selCollider();
    if (old) applyColliderHighlight(old, false);
    S.selectedColliderId = null;
    refreshColliderList();
  }
});

canvas.addEventListener('pointerleave', () => {
  _lmbDown = false;
  cancelDraft();
});

canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  if (editMode) { cancelEdit(); return; }
  const c = hitColliders(ndcFromEvent(e));
  if (c) { selectCollider(c.id); showCtxMenu(e.clientX, e.clientY); }
});

// Ortho pan (middle-mouse or right-mouse in ortho mode)
let orthoPan = null;
canvas.addEventListener('pointerdown', e => {
  if (S.camMode !== 'ortho' || editMode || draft || S.tool !== 'select') return;
  if (e.button === 2 || e.button === 1) {
    orthoPan = { mx: e.clientX, my: e.clientY, cp: orthoCam.position.clone(), ct: controls.target.clone() };
  }
}, true);
canvas.addEventListener('pointermove', e => {
  if (!orthoPan) return;
  const asp = aspect();
  const dist = controls.target.distanceTo(perspCam.position);
  const s = dist * Math.tan((perspCam.fov * Math.PI / 180) / 2);
  const sx = (s * asp * 2) / window.innerWidth;
  const sy = (s * 2) / window.innerHeight;
  const right = new THREE.Vector3().setFromMatrixColumn(orthoCam.matrixWorld, 0);
  const up    = new THREE.Vector3().setFromMatrixColumn(orthoCam.matrixWorld, 1);
  const move = right.multiplyScalar(-(e.clientX - orthoPan.mx) * sx)
                    .add(up.multiplyScalar((e.clientY - orthoPan.my) * sy));
  orthoCam.position.copy(orthoPan.cp.clone().add(move));
  controls.target.copy(orthoPan.ct.clone().add(move));
  perspCam.position.copy(orthoCam.position);
}, true);
canvas.addEventListener('pointerup', () => { orthoPan = null; }, true);

canvas.addEventListener('wheel', e => {
  if (S.camMode !== 'ortho' || S.tool !== 'select') return;
  e.preventDefault();
  const f = e.deltaY > 0 ? 1.12 : 0.88;
  const tgt = controls.target;
  const dir = perspCam.position.clone().sub(tgt).normalize();
  perspCam.position.copy(tgt.clone().add(dir.multiplyScalar(perspCam.position.distanceTo(tgt) * f)));
  orthoCam.position.copy(perspCam.position);
  syncOrtho();
}, { passive: false });

/* ===================================================
   CONTEXT MENU
=================================================== */
const ctxMenu = document.getElementById('ctx-menu');
function showCtxMenu(x, y) {
  ctxMenu.style.display = 'block';
  ctxMenu.style.left = Math.min(x, window.innerWidth  - 180) + 'px';
  ctxMenu.style.top  = Math.min(y, window.innerHeight - 140) + 'px';
}
document.addEventListener('click', () => { ctxMenu.style.display = 'none'; });
document.addEventListener('contextmenu', e => { if (e.target !== canvas) ctxMenu.style.display = 'none'; });
document.getElementById('ctx-grab').addEventListener('click', () => enterGrab());
document.getElementById('ctx-scale').addEventListener('click', () => enterScale());
document.getElementById('ctx-delete').addEventListener('click', () => { if (S.selectedColliderId) deleteCollider(S.selectedColliderId); });

/* ===================================================
   KEYBOARD
=================================================== */
window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;

  if (editMode) {
    if (e.key === 'Escape') cancelEdit();
    if (e.key === 'Enter') confirmEdit();
    return;
  }

  const k = e.key;
  if (k === 'v' || k === 'V') { setTool('select'); return; }
  if (k === 'e' || k === 'E') { setTool('sphere'); return; }
  if (k === 'c' || k === 'C') { setTool('capsule'); return; }
  if (k === 'o' || k === 'O') { toggleCam(); return; }
  if (k === 'x' || k === 'X') { toggleInFront(); return; }
  if (k === 'f' || k === 'F') { const m = activeModel(); if (m) frameModel(m); return; }

  // G = grab collider
  if (k === 'g' || k === 'G') {
    if (selCollider()) enterGrab();
    return;
  }

  // S = scale collider (or activate sphere tool if none selected)
  if (k === 's' || k === 'S') {
    if (selCollider()) enterScale();
    else setTool('sphere');
    return;
  }

  if (k === 'Delete' || k === 'Backspace') {
    if (S.selectedColliderId) { deleteCollider(S.selectedColliderId); e.preventDefault(); }
    return;
  }

  if (k === 'Escape') {
    if (draft) { cancelDraft(); return; }
    if (S.camMode === 'ortho') { toPersp(); return; }
    const old = selCollider();
    if (old) applyColliderHighlight(old, false);
    S.selectedColliderId = null; refreshColliderList();
  }
});

/* ===================================================
   DRAG & DROP / FILE INPUT
=================================================== */
document.addEventListener('dragover', e => {
  e.preventDefault();
  document.getElementById('drop-overlay').classList.remove('hidden');
  document.getElementById('drop-overlay').classList.add('drag-active');
});
document.addEventListener('dragleave', e => {
  if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
    document.getElementById('drop-overlay').classList.remove('drag-active');
    if (S.models.length) document.getElementById('drop-overlay').classList.add('hidden');
  }
});
document.addEventListener('drop', async e => {
  e.preventDefault();
  document.getElementById('drop-overlay').classList.remove('drag-active');
  const files = [...e.dataTransfer.files].filter(f => /\.(glb|gltf)$/i.test(f.name));
  for (const f of files) await loadFile(f);
  if (S.models.length) document.getElementById('drop-overlay').classList.add('hidden');
});
document.getElementById('file-input').addEventListener('change', async e => {
  for (const f of [...e.target.files]) await loadFile(f);
  e.target.value = '';
});
document.getElementById('btn-add-model').addEventListener('click', () => document.getElementById('file-input').click());
document.getElementById('drop-browse-btn').addEventListener('click', () => document.getElementById('file-input').click());

/* ===================================================
   PANEL TOGGLES
=================================================== */
document.getElementById('toggle-model-panel').addEventListener('click', function() {
  const c = document.getElementById('model-panel').classList.toggle('collapsed');
  this.classList.toggle('cs', c);
  this.textContent = c ? '›' : '‹';
});
document.getElementById('toggle-collider-panel').addEventListener('click', function() {
  const c = document.getElementById('collider-panel').classList.toggle('collapsed');
  this.classList.toggle('cs', c);
  this.textContent = c ? '‹' : '›';
});

/* ===================================================
   EXPORT
=================================================== */
document.getElementById('btn-copy-json').addEventListener('click', async () => {
  if (!S.colliders.length) return;
  const json = JSON.stringify(buildJSON(), null, 2);
  try {
    await navigator.clipboard.writeText(json);
    const btn = document.getElementById('btn-copy-json');
    const orig = btn.innerHTML;
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6bffb0" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>&nbsp;Copied!`;
    btn.style.color = 'var(--success)'; btn.style.borderColor = 'var(--success)';
    setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; btn.style.borderColor = ''; }, 2200);
  } catch (err) { console.error(err); }
});

document.getElementById('btn-download-json').addEventListener('click', () => {
  if (!S.colliders.length) return;
  const name = activeModel()?.name ?? 'colliders';
  const blob = new Blob([JSON.stringify(buildJSON(), null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name + '_colliders.json' });
  a.click(); URL.revokeObjectURL(a.href);
});

/* ===================================================
   RESIZE
=================================================== */
window.addEventListener('resize', () => {
  W = window.innerWidth; H = window.innerHeight;
  renderer.setSize(W, H);
  perspCam.aspect = W / H;
  perspCam.updateProjectionMatrix();
  syncOrtho();
});

/* ===================================================
   RENDER LOOP
=================================================== */
(function animate() {
  requestAnimationFrame(animate);
  if (S.camMode === 'persp') { controls.update(); syncOrtho(); }
  renderer.render(scene, activeCam);
  drawGizmo();
})();

/* ===================================================
   INIT
=================================================== */
setTool('select');
setHud('Perspective');
setInFront(true);
updateDropOverlay();
