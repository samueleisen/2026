/* ───────────────────────────────────────────────
    PLAYER  (firstmodel.glb)
    Loads the GLB, auto-scales to PLAYER_HEIGHT,
    centres it on the ground, sets up AnimationMixer.

    Exposes globals consumed by playerController.js & loop.js:
      playerGroup  — THREE.Group the model lives inside
      pShadow      — flat shadow disc in the scene
      mixer        — THREE.AnimationMixer (null until GLB loads)
      animations   — { [clipNameLower]: AnimationAction } map
      idleAction   — Hero-Idle clip action
      walkAction   — Hero-Walk clip action
      isWalking    — bool, toggled by playerController
      glbReady     — bool, true once load + setup is done

    Clip names in GLB (confirmed via Babylon.js inspector):
      "Hero-Idle"  "Hero-Walk"  "Hero-Jump"

    Depends on: scene, PAL, PLAYER_RADIUS, PLAYER_HEIGHT
─────────────────────────────────────────────── */

// ── Player container ─────────────────────────────────────────
const playerGroup = new THREE.Group();
scene.add(playerGroup);

// ── Ground shadow disc ────────────────────────────────────────
const pShadow = new THREE.Mesh(
    new THREE.CircleGeometry((PLAYER_RADIUS + 4) * 0.5, 16),
    new THREE.MeshBasicMaterial({ color: PAL.shadow, transparent: true, opacity: 0.5 })
);
pShadow.rotation.x = -Math.PI / 2;
pShadow.position.y = 0.6;
scene.add(pShadow);

// ── Animation state ───────────────────────────────────────────
let mixer = null;
let idleAction = null;   // Hero-Idle  (plays by default)
let walkAction = null;   // Hero-Walk  (fades in while moving)
let jumpAction = null;   // Hero-Jump  (plays during jump)
let isWalking = false;
let isGrounded = true;   // Grounded status flag

/** All clips in the GLB, keyed by lowercased clip name. */
const animations = {};

// ── Gate flag — controller skips all work until true ─────────
let glbReady = false;

// ── GLB filename ───────────────────────────────────────────────
const PLAYER_GLB = 'firstmodel.glb';

// ─────────────────────────────────────────────────────────────
//  Load
// ─────────────────────────────────────────────────────────────
const _loader = new THREE.GLTFLoader();
_loader.load(
    PLAYER_GLB,

    /* onLoad */
    function (gltf) {
        const model = gltf.scene;

        // 1. Auto-scale to PLAYER_HEIGHT
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        if (size.y > 0) model.scale.setScalar(PLAYER_HEIGHT / size.y);

        // 2. Configure shadows on all meshes
        model.traverse(function (node) {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });

        // 3. Sit the model's feet cleanly on top of y = 0 with ground clearance offset
        const box2 = new THREE.Box3().setFromObject(model);
        model.position.y = -box2.min.y + 5.0;

        playerGroup.add(model);

        // 4. Collect ponytail bones (Ponytail1, ponytail2, ponytail3, ponytail4, ponytail5)
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
        const foundCount = window.ponytailBones.filter(Boolean).length;
        console.log(`[player] Found ${foundCount}/5 ponytail bones for procedural physics.`);

        // 5. AnimationMixer — register every clip by lowercased name
        mixer = new THREE.AnimationMixer(model);

        if (gltf.animations && gltf.animations.length > 0) {
            gltf.animations.forEach(function (clip) {
                const action = mixer.clipAction(clip);
                action.setLoop(THREE.LoopRepeat);
                animations[clip.name.toLowerCase()] = action;
            });

            // Named shortcuts for the confirmed clip names
            idleAction = animations['hero-idle'] || Object.values(animations)[0];
            walkAction = animations['hero-walk'] || null;
            jumpAction = animations['hero-jump'] || null;

            if (jumpAction) {
                jumpAction.setLoop(THREE.LoopOnce);
                jumpAction.clampWhenFinished = true;
            }

            // Start idle immediately at weight 1 — walk/jump will cross-fade over it
            if (idleAction) idleAction.play();
        }

        glbReady = true;
        console.log(
            '[player] ' + PLAYER_GLB + ' ready. Clips: [' +
            Object.keys(animations).join(', ') + ']'
        );
    },

    /* onProgress */
    function (xhr) {
        if (xhr.total) {
            console.log('[player] ' + Math.round(xhr.loaded / xhr.total * 100) + '% loaded');
        }
    },

    /* onError */
    function (err) {
        console.error('[player] Failed to load ' + PLAYER_GLB + ':', err);
    }
);
