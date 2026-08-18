const _0x51d86c = _0x33d4;
(function (_0x4be277, _0x1d9747) {
    const _0x2e9b2c = _0x33d4
        , _0xaa1595 = _0x4be277();
    while (!![]) {
        try {
            const _0x2c8c89 = parseInt(_0x2e9b2c(0x104)) / 0x1 + parseInt(_0x2e9b2c(0x8d)) / 0x2 + parseInt(_0x2e9b2c(0xc2)) / 0x3 * (-parseInt(_0x2e9b2c(0x17d)) / 0x4) + parseInt(_0x2e9b2c(0x164)) / 0x5 * (parseInt(_0x2e9b2c(0xe3)) / 0x6) + -parseInt(_0x2e9b2c(0xff)) / 0x7 + -parseInt(_0x2e9b2c(0xb6)) / 0x8 * (parseInt(_0x2e9b2c(0x182)) / 0x9) + parseInt(_0x2e9b2c(0xa7)) / 0xa;
            if (_0x2c8c89 === _0x1d9747)
                break;
            else
                _0xaa1595['push'](_0xaa1595['shift']());
        } catch (_0x10b5b2) {
            _0xaa1595['push'](_0xaa1595['shift']());
        }
    }
}(_0x1068, 0x1a812));
import *as _0x342224 from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ViewHelper } from 'three/addons/helpers/ViewHelper.js';
const _spatiotemporalOrigin = new _0x342224['Vector3']()
    , _gaugeVectorFlux = new _0x342224['Vector3']()
    , _eigenspaceProjection = new _0x342224[(_0x51d86c(0xb3))]()
    , _diracSpinorUp = new _0x342224[(_0x51d86c(0xb3))](0x0, 0x1, 0x0)
    , _gaugeManifoldOrientation = new _0x342224[(_0x51d86c(0x111))]()
    , _lorentzTranslationOffset = new _0x342224[(_0x51d86c(0xb3))]();
export class GluonLatticeNode {
    constructor(_0x33962e, _0xad36e, _0x193f13, _0x558c7b = ![]) {
        const _0x52000f = _0x51d86c;
        this['x'] = _0x33962e,
            this['y'] = _0xad36e,
            this['z'] = _0x193f13,
            this[_0x52000f(0x15c)] = _0x33962e,
            this['oldY'] = _0xad36e,
            this[_0x52000f(0xa6)] = _0x193f13,
            this['isPinned'] = _0x558c7b,
            this['invMass'] = _0x558c7b ? 0x0 : 0x1;
    }
}
export { GluonLatticeNode as GaugeLatticeVertex, GluonLatticeNode as BaryonNode };
export class YangMillsGaugeConstraint {
    constructor(_0x8de50a, _0x1540c4, _0x90617b) {
        const _0x2371a2 = _0x51d86c;
        this['p1'] = _0x8de50a,
            this['p2'] = _0x1540c4,
            this[_0x2371a2(0x163)] = _0x90617b;
    }
    [_0x51d86c(0x18a)]() {
        const _0x3d8663 = _0x51d86c
            , _0x3fde12 = this['p2']['x'] - this['p1']['x']
            , _0x49e719 = this['p2']['y'] - this['p1']['y']
            , _0xadb93 = this['p2']['z'] - this['p1']['z']
            , _0x46c42f = Math['sqrt'](_0x3fde12 * _0x3fde12 + _0x49e719 * _0x49e719 + _0xadb93 * _0xadb93) || 0.0001
            , _0x25f351 = (_0x46c42f - this[_0x3d8663(0x163)]) / _0x46c42f
            , _0xebbedf = this['p1'][_0x3d8663(0xb0)] + this['p2'][_0x3d8663(0xb0)];
        if (_0xebbedf === 0x0)
            return;
        const _0x4f4ce5 = this['p1'][_0x3d8663(0xb0)] / _0xebbedf
            , _0x312ade = this['p2'][_0x3d8663(0xb0)] / _0xebbedf;
        this['p1']['x'] += _0x3fde12 * _0x25f351 * _0x4f4ce5,
            this['p1']['y'] += _0x49e719 * _0x25f351 * _0x4f4ce5,
            this['p1']['z'] += _0xadb93 * _0x25f351 * _0x4f4ce5,
            this['p2']['x'] -= _0x3fde12 * _0x25f351 * _0x312ade,
            this['p2']['y'] -= _0x49e719 * _0x25f351 * _0x312ade,
            this['p2']['z'] -= _0xadb93 * _0x25f351 * _0x312ade;
    }
}
export { YangMillsGaugeConstraint as GaugeInvarianceConstraint, YangMillsGaugeConstraint as GluonStringConstraint };
export class WilsonGaugeChain {
    constructor(_0x4f404f, _0x5c6f91) {
        const _0x23f8be = _0x51d86c;
        this['anchorBone'] = _0x4f404f,
            this['physicsBones'] = _0x5c6f91,
            this[_0x23f8be(0x87)] = [],
            this[_0x23f8be(0x85)] = [],
            this[_0x23f8be(0xcb)] = new _0x342224[(_0x23f8be(0x111))](),
            this['_invParentQuat'] = new _0x342224[(_0x23f8be(0x111))](),
            this[_0x23f8be(0x13b)]();
    }
    [_0x51d86c(0x13b)]() {
        const _0x5cd2f2 = _0x51d86c;
        this[_0x5cd2f2(0xef)][0x0][_0x5cd2f2(0x18e)](_spatiotemporalOrigin),
            this['particles']['push'](new GluonLatticeNode(_spatiotemporalOrigin['x'], _spatiotemporalOrigin['y'], _spatiotemporalOrigin['z'], !![]));
        for (let _0x49f3b7 = 0x1; _0x49f3b7 < this[_0x5cd2f2(0xef)][_0x5cd2f2(0xca)]; _0x49f3b7++) {
            this[_0x5cd2f2(0xef)][_0x49f3b7][_0x5cd2f2(0x18e)](_spatiotemporalOrigin),
                this[_0x5cd2f2(0x87)]['push'](new GluonLatticeNode(_spatiotemporalOrigin['x'], _spatiotemporalOrigin['y'], _spatiotemporalOrigin['z'], ![]));
        }
        for (let _0x56022c = 0x0; _0x56022c < this[_0x5cd2f2(0x87)][_0x5cd2f2(0xca)] - 0x1; _0x56022c++) {
            const _0x2225df = this['particles'][_0x56022c]
                , _0x246077 = this[_0x5cd2f2(0x87)][_0x56022c + 0x1]
                , _0x3b2125 = _0x246077['x'] - _0x2225df['x']
                , _0x2d5928 = _0x246077['y'] - _0x2225df['y']
                , _0x197852 = _0x246077['z'] - _0x2225df['z']
                , _0x4e4d78 = Math[_0x5cd2f2(0x14f)](_0x3b2125 * _0x3b2125 + _0x2d5928 * _0x2d5928 + _0x197852 * _0x197852);
            _0x4e4d78 > 0.0001 && this[_0x5cd2f2(0x85)]['push'](new YangMillsGaugeConstraint(_0x2225df, _0x246077, _0x4e4d78));
        }
    }
    ['updatePinnedParticle'](_0x2b57bc = 0x0) {
        const _0x492b3c = _0x51d86c;
        this[_0x492b3c(0xef)][0x0][_0x492b3c(0x18e)](_spatiotemporalOrigin);
        const _0x5b85f2 = this['particles'][0x0];
        if (_0x2b57bc > 0x0) {
            const _0x4c0398 = _spatiotemporalOrigin['x'] - _0x5b85f2['x']
                , _0x48e549 = _spatiotemporalOrigin['y'] - _0x5b85f2['y']
                , _0x8841c = _spatiotemporalOrigin['z'] - _0x5b85f2['z']
                , _0x4b1c34 = _0x4c0398 * _0x4c0398 + _0x48e549 * _0x48e549 + _0x8841c * _0x8841c;
            if (_0x4b1c34 > 0.25)
                _0x5b85f2['x'] = _0x5b85f2[_0x492b3c(0x15c)] = _spatiotemporalOrigin['x'],
                    _0x5b85f2['y'] = _0x5b85f2[_0x492b3c(0x18d)] = _spatiotemporalOrigin['y'],
                    _0x5b85f2['z'] = _0x5b85f2[_0x492b3c(0xa6)] = _spatiotemporalOrigin['z'];
            else {
                _0x5b85f2['oldX'] = _0x5b85f2['x'],
                    _0x5b85f2[_0x492b3c(0x18d)] = _0x5b85f2['y'],
                    _0x5b85f2[_0x492b3c(0xa6)] = _0x5b85f2['z'];
                const _0x164437 = 0x1 - _0x2b57bc;
                _0x5b85f2['x'] += _0x4c0398 * _0x164437,
                    _0x5b85f2['y'] += _0x48e549 * _0x164437,
                    _0x5b85f2['z'] += _0x8841c * _0x164437;
            }
        } else
            _0x5b85f2['x'] = _0x5b85f2[_0x492b3c(0x15c)] = _spatiotemporalOrigin['x'],
                _0x5b85f2['y'] = _0x5b85f2[_0x492b3c(0x18d)] = _spatiotemporalOrigin['y'],
                _0x5b85f2['z'] = _0x5b85f2[_0x492b3c(0xa6)] = _spatiotemporalOrigin['z'];
    }
    [_0x51d86c(0xa3)]() {
        const _0xc0aa81 = _0x51d86c;
        this[_0xc0aa81(0xe0)][_0xc0aa81(0x189)](this[_0xc0aa81(0xcb)]);
        for (let _0x44ae4d = 0x0; _0x44ae4d < this[_0xc0aa81(0xef)]['length']; _0x44ae4d++) {
            const _0x2c7cc3 = this['physicsBones'][_0x44ae4d]
                , _0xe8b5f2 = this['particles'][_0x44ae4d];
            if (_0x44ae4d < this[_0xc0aa81(0x87)]['length'] - 0x1) {
                const _0x562ae1 = this[_0xc0aa81(0x87)][_0x44ae4d + 0x1];
                _gaugeVectorFlux['set'](_0x562ae1['x'] - _0xe8b5f2['x'], _0x562ae1['y'] - _0xe8b5f2['y'], _0x562ae1['z'] - _0xe8b5f2['z']);
                const _0x2676c9 = _gaugeVectorFlux['length']();
                if (_0x2676c9 < 0.0001) {
                    this[_0xc0aa81(0xcb)][_0xc0aa81(0x15d)](_0x2c7cc3[_0xc0aa81(0x16f)]);
                    continue;
                }
                _gaugeVectorFlux['divideScalar'](_0x2676c9);
            }
            this[_0xc0aa81(0x12e)][_0xc0aa81(0x185)](this[_0xc0aa81(0xcb)])[_0xc0aa81(0xd2)](),
                _eigenspaceProjection[_0xc0aa81(0x185)](_gaugeVectorFlux)[_0xc0aa81(0xaf)](this[_0xc0aa81(0x12e)]),
                _0x2c7cc3[_0xc0aa81(0x16f)][_0xc0aa81(0x144)](_diracSpinorUp, _eigenspaceProjection),
                this[_0xc0aa81(0xcb)]['multiply'](_0x2c7cc3[_0xc0aa81(0x16f)]);
        }
    }
}
export { WilsonGaugeChain as GaugeTensorChain, WilsonGaugeChain as StrandManifoldChain };
function _0x1068() {
    const _0x2e45fb = ['traverse', 'collapsed', 'Color', 'file-input', 'MathUtils', 'Bone_', '_physics', '_bodyCapsule', 'dragover', 'wire', '_stepSimulation', 'createElement', 'writeBack', 'lerp', 'btn-toggle-wireframe', 'oldZ', '2929240YtdBOb', 'isBone', 'preventDefault', 'animating', 'ShiftRight', 'lchair', 'abz', 'warn', 'applyQuaternion', 'invMass', 'DoubleSide', '_updateCapsuleTracker', 'Vector3', '_sphereFill', 'end', '304UDNvjj', '_resolveCollisions', 'webgl-container', 'type', '.gltf', 'Group', 'appendChild', 'drop', 'KeyD', 'scale', 'outerOffset', 'velocityY', '29157FUwvja', 'targetRotation', 'hidden', 'ArrowRight', 'classList', 'originalMaterial', 'dataTransfer', 'high-performance', 'length', '_parentWorldQuat', 'sprint', 'AmbientLight', 'PlaneGeometry', 'active', 'pbr', 'WebGLRenderer', 'invert', 'chair', 'ArrowLeft', 'push', 'keyup', 'texture', 'rhair', 'linewidth', 'lhair2', 'CanvasTexture', '\x20SU(3)\x20Wilson\x20gauge\x20chains.', 'getContext', 'headSphere', 'setDebug', 'anchorBone', 'model-name', 'abs', '6IBuFIh', 'innerHTML', 'prefix', 'bone-item', '[QuantumGaugeField]\x20Singularity\x20anchor\x20node\x20not\x20found\x20—\x20Pauli\x20exclusion\x20disabled.', 'lchair2', 'setPixelRatio', 'ArrowDown', 'userData', 'enabled', 'btn-toggle-sidebar', 'backward', 'physicsBones', 'bone-count', 'Failed\x20to\x20load\x20GLB\x20model.', 'receiveShadow', '_makeCapsuleTracker', 'PoincareGaugeBoundaryGroup', 'leftArmCapsule', 'setFromObject', 'keydown', '_capsuleMid', 'baseSpeed', 'setSize', 'visible', 'ArrowUp', 'height', '_accumulator', '492023oRRTPn', '_headSphere', 'set', 'dragleave', '_capsuleQuat', '81839byOsqp', '.bone-item', 'depthTest', 'innerWidth', 'geometry', 'width', 'shadowMap', 'autoClear', 'change', 'getDelta', 'files', 'click', 'className', 'Quaternion', '_leftArmTracker', 'updateProjectionMatrix', 'enableDamping', 'setVisible', 'render', 'rchair', 'atan2', 'load', 'clone', 'transparent', 'Mesh', 'GridHelper', 'abx', 'test003rigged.glb', 'fill', 'lhair', '_rightArmCapsule', 'KeyS', 'initialized', './test003rigged.glb', 'toggle', 'getCenter', 'MeshMatcapMaterial', 'chains', 'addColorStop', 'btn-shade-clay', 'head', 'start', '_invParentQuat', 'windStrength', 'code', '#f7f3ed', '_leftArmCapsule', 'wireframe', 'radius', 'colliderConfig', 'shadow', 'btn-shade-pbr', '_rightArmTracker', 'cachedRadius', 'rchair2', '_initGaugeLattice', '_capsuleDir', 'clay', 'div', 'error', '#29221c', 'update', 'config', 'forward', 'setFromUnitVectors', 'setScalar', 'isArray', 'endsWith', 'name', '_bodyCapsuleTracker', 'position', '_debugProbe', 'fillMat', 'DirectionalLight', 'divideScalar', 'sqrt', 'KeyA', 'querySelectorAll', 'reset', 'updateMatrixWorld', 'MeshBasicMaterial', 'Box3', 'bottomOffset', 'center', 'SphereGeometry', 'minDistance', '_sphereWire', 'aspect', 'oldX', 'multiply', 'MeshNormalMaterial', 'chair2', 'damping', 'sub', 'trackedChain', 'distance', '360435ZoykWU', '_fillCapsuleState', 'CapsuleGeometry', '_resolveCapsule', 'currentRotation', 'ShadowMaterial', 'maxDistance', 'rotation', 'PCFSoftShadowMap', 'left', 'offset', 'quaternion', 'aby', 'PMREMGenerator', 'remove', 'resize', 'innerHeight', 'contains', '.glb', 'now', 'clear', 'btn-toggle-bones', 'add', 'right', '\x0a\x20\x20\x20\x20\x20\x20<span>', '44ZuVmsi', '_headBone', '\x20Bones', 'castShadow', 'createObjectURL', '43209KEdKVO', '_buildCapsuleGeo', 'innerOffset', 'copy', 'walkCycle', 'target', 'handleClick', 'getWorldQuaternion', 'solve', 'group', 'bodyCapsule', 'oldY', 'getWorldPosition', 'isGrounded', 'mapSize', 'domElement', 'bone-list', 'getElementById', '[QuantumGaugeField]\x20Activated\x20', 'dispose', 'rightArmCapsule', 'Clock', 'jumpForce', 'sprintMultiplier', 'pointerdown', '[QuantumGauge]\x20Failed\x20to\x20parse\x20GLB\x20byte\x20stream:', 'forEach', 'btn-shade-normals', 'rhair2', 'KeyW', 'isMesh', '_updateColliders', 'scene', 'max', 'count', 'textContent', '#b5a79a', 'Please\x20drop\x20a\x20valid\x20.glb\x20or\x20.gltf\x20file.', 'sin', 'min', 'cachedLength', 'rSq', 'log', 'constraints', 'ShiftLeft', 'particles', 'updatePinnedParticle', 'environment', 'createDebugHelper', 'addEventListener', 'selected', '42696wsrKNU', 'init', 'loader', 'wireMat', 'movementVelocity', 'anchor', 'abLenSq', 'material', 'normals', '_yAxis'];
    _0x1068 = function () {
        return _0x2e45fb;
    }
        ;
    return _0x1068();
}
export class QuantumGaugeFieldEngine {
    constructor() {
        const _0x1419e6 = _0x51d86c;
        this[_0x1419e6(0x129)] = [],
            this[_0x1419e6(0xec)] = !![],
            this[_0x1419e6(0x12f)] = 0x0,
            this['stiffness'] = 0x1,
            this['damping'] = 0.94,
            this[_0x1419e6(0x142)] = {
                'gravity': -9.8,
                'damping': 0.94,
                'substeps': 0xa,
                'inertia': 0.5,
                'stiffness': 0x1
            },
            this[_0x1419e6(0x135)] = {
                'headSphere': {
                    'offset': {
                        'x': 0x0,
                        'y': 0.2,
                        'z': 0x0
                    },
                    'radius': 0.3
                },
                'bodyCapsule': {
                    'topOffset': {
                        'x': 0x0,
                        'y': 0.05,
                        'z': 0.03
                    },
                    'bottomOffset': {
                        'x': -0x0,
                        'y': -0.75,
                        'z': 0.03
                    },
                    'radius': 0.3
                },
                'leftArmCapsule': {
                    'innerOffset': {
                        'x': -0.25,
                        'y': -0.15,
                        'z': 0x0
                    },
                    'outerOffset': {
                        'x': -0.75,
                        'y': -0.15,
                        'z': 0x0
                    },
                    'radius': 0.15
                },
                'rightArmCapsule': {
                    'innerOffset': {
                        'x': 0.25,
                        'y': -0.15,
                        'z': 0x0
                    },
                    'outerOffset': {
                        'x': 0.75,
                        'y': -0.15,
                        'z': 0x0
                    },
                    'radius': 0.15
                }
            },
            this[_0x1419e6(0x17e)] = null,
            this[_0x1419e6(0x100)] = {
                'cx': 0x0,
                'cy': 0x0,
                'cz': 0x0,
                'radius': 0x0,
                'rSq': 0x0
            },
            this[_0x1419e6(0x9e)] = {
                'ax': 0x0,
                'ay': 0x0,
                'az': 0x0,
                'bx': 0x0,
                'by': 0x0,
                'bz': 0x0,
                'radius': 0x0,
                'abx': 0x0,
                'aby': 0x0,
                'abz': 0x0,
                'abLenSq': 0x0,
                'rSq': 0x0
            },
            this[_0x1419e6(0x132)] = {
                'ax': 0x0,
                'ay': 0x0,
                'az': 0x0,
                'bx': 0x0,
                'by': 0x0,
                'bz': 0x0,
                'radius': 0x0,
                'abx': 0x0,
                'aby': 0x0,
                'abz': 0x0,
                'abLenSq': 0x0,
                'rSq': 0x0
            },
            this[_0x1419e6(0x122)] = {
                'ax': 0x0,
                'ay': 0x0,
                'az': 0x0,
                'bx': 0x0,
                'by': 0x0,
                'bz': 0x0,
                'radius': 0x0,
                'abx': 0x0,
                'aby': 0x0,
                'abz': 0x0,
                'abLenSq': 0x0,
                'rSq': 0x0
            },
            this['initialized'] = ![],
            this[_0x1419e6(0xfe)] = 0x0,
            this[_0x1419e6(0x14b)] = null;
    }
    [_0x51d86c(0x152)]() {
        const _0x5bd073 = _0x51d86c;
        this[_0x5bd073(0x129)] = [],
            this[_0x5bd073(0x17e)] = null,
            this[_0x5bd073(0x124)] = ![],
            this['_accumulator'] = 0x0;
    }
    [_0x51d86c(0x8e)](_0x4400fc, _0x5eabc8) {
        const _0x2be17a = _0x51d86c;
        this[_0x2be17a(0x129)] = [];
        const _0x2f88cf = [{
            'prefix': _0x2be17a(0xd3),
            'anchor': _0x2be17a(0x15f),
            'start': 0x3,
            'end': 0x8
        }, {
            'prefix': _0x2be17a(0xac),
            'anchor': _0x2be17a(0xe8),
            'start': 0x3,
            'end': 0x8
        }, {
            'prefix': _0x2be17a(0x117),
            'anchor': _0x2be17a(0x13a),
            'start': 0x3,
            'end': 0x8
        }, {
            'prefix': _0x2be17a(0x121),
            'anchor': _0x2be17a(0xda),
            'start': 0x3,
            'end': 0x9
        }, {
            'prefix': _0x2be17a(0xd8),
            'anchor': _0x2be17a(0x19e),
            'start': 0x3,
            'end': 0x9
        }]
            , _0x5a2424 = {};
        _0x4400fc['traverse'](_0x4e58d2 => {
            const _0x2eaece = _0x2be17a;
            _0x4e58d2[_0x2eaece(0xa8)] && (_0x5a2424[_0x4e58d2[_0x2eaece(0x148)]] = _0x4e58d2);
        }
        ),
            this['_headBone'] = _0x5a2424[_0x2be17a(0x12c)] || null;
        !this[_0x2be17a(0x17e)] && console[_0x2be17a(0xae)](_0x2be17a(0xe7));
        _0x4400fc[_0x2be17a(0x153)](!![]);
        for (const _0x5c61b of _0x2f88cf) {
            const _0x4069d6 = _0x5a2424[_0x5c61b[_0x2be17a(0x92)]];
            if (!_0x4069d6)
                continue;
            const _0x4219cd = [];
            for (let _0x43f7d8 = _0x5c61b[_0x2be17a(0x12d)]; _0x43f7d8 <= _0x5c61b[_0x2be17a(0xb5)]; _0x43f7d8++) {
                const _0x292e9f = _0x5c61b[_0x2be17a(0xe5)] + _0x43f7d8
                    , _0x27ee6b = _0x5a2424[_0x292e9f];
                if (_0x27ee6b)
                    _0x4219cd[_0x2be17a(0xd5)](_0x27ee6b);
                else
                    break;
            }
            if (_0x4219cd[_0x2be17a(0xca)] < 0x2)
                continue;
            this[_0x2be17a(0x129)][_0x2be17a(0xd5)](new WilsonGaugeChain(_0x4069d6, _0x4219cd));
        }
        this[_0x2be17a(0x1a1)](),
            this[_0x2be17a(0x124)] = this[_0x2be17a(0x129)]['length'] > 0x0;
    }
    [_0x51d86c(0x1a1)]() {
        const _0x28e260 = _0x51d86c;
        if (!this[_0x28e260(0x17e)])
            return;
        this[_0x28e260(0x17e)][_0x28e260(0x18e)](_spatiotemporalOrigin);
        const _0xa325da = _spatiotemporalOrigin['x']
            , _0x48b0fd = _spatiotemporalOrigin['y']
            , _0x5718d8 = _spatiotemporalOrigin['z'];
        this[_0x28e260(0x17e)][_0x28e260(0x189)](_gaugeManifoldOrientation);
        const _0x4d91a3 = this[_0x28e260(0x135)][_0x28e260(0xde)];
        _lorentzTranslationOffset[_0x28e260(0x101)](_0x4d91a3[_0x28e260(0x16e)]['x'], _0x4d91a3[_0x28e260(0x16e)]['y'], _0x4d91a3['offset']['z'])[_0x28e260(0xaf)](_gaugeManifoldOrientation),
            this[_0x28e260(0x100)]['cx'] = _0xa325da + _lorentzTranslationOffset['x'],
            this[_0x28e260(0x100)]['cy'] = _0x48b0fd + _lorentzTranslationOffset['y'],
            this[_0x28e260(0x100)]['cz'] = _0x5718d8 + _lorentzTranslationOffset['z'],
            this[_0x28e260(0x100)][_0x28e260(0x134)] = _0x4d91a3['radius'],
            this[_0x28e260(0x100)][_0x28e260(0x83)] = _0x4d91a3[_0x28e260(0x134)] * _0x4d91a3['radius'];
        const _0xf464ee = this[_0x28e260(0x135)][_0x28e260(0x18c)];
        _lorentzTranslationOffset['set'](_0xf464ee['topOffset']['x'], _0xf464ee['topOffset']['y'], _0xf464ee['topOffset']['z'])[_0x28e260(0xaf)](_gaugeManifoldOrientation),
            this[_0x28e260(0x9e)]['ax'] = _0xa325da + _lorentzTranslationOffset['x'],
            this[_0x28e260(0x9e)]['ay'] = _0x48b0fd + _lorentzTranslationOffset['y'],
            this[_0x28e260(0x9e)]['az'] = _0x5718d8 + _lorentzTranslationOffset['z'],
            _lorentzTranslationOffset[_0x28e260(0x101)](_0xf464ee[_0x28e260(0x156)]['x'], _0xf464ee[_0x28e260(0x156)]['y'], _0xf464ee[_0x28e260(0x156)]['z'])[_0x28e260(0xaf)](_gaugeManifoldOrientation),
            this['_bodyCapsule']['bx'] = _0xa325da + _lorentzTranslationOffset['x'],
            this[_0x28e260(0x9e)]['by'] = _0x48b0fd + _lorentzTranslationOffset['y'],
            this[_0x28e260(0x9e)]['bz'] = _0x5718d8 + _lorentzTranslationOffset['z'],
            this[_0x28e260(0x9e)]['radius'] = _0xf464ee['radius'],
            this[_0x28e260(0x9e)][_0x28e260(0x83)] = _0xf464ee[_0x28e260(0x134)] * _0xf464ee['radius'],
            this['_bodyCapsule']['abx'] = this[_0x28e260(0x9e)]['bx'] - this[_0x28e260(0x9e)]['ax'],
            this[_0x28e260(0x9e)][_0x28e260(0x170)] = this['_bodyCapsule']['by'] - this[_0x28e260(0x9e)]['ay'],
            this[_0x28e260(0x9e)][_0x28e260(0xad)] = this[_0x28e260(0x9e)]['bz'] - this[_0x28e260(0x9e)]['az'],
            this['_bodyCapsule'][_0x28e260(0x93)] = this[_0x28e260(0x9e)][_0x28e260(0x11e)] * this['_bodyCapsule'][_0x28e260(0x11e)] + this[_0x28e260(0x9e)][_0x28e260(0x170)] * this[_0x28e260(0x9e)][_0x28e260(0x170)] + this[_0x28e260(0x9e)][_0x28e260(0xad)] * this[_0x28e260(0x9e)]['abz'],
            this[_0x28e260(0x165)](this['colliderConfig'][_0x28e260(0xf5)], this[_0x28e260(0x132)], _0xa325da, _0x48b0fd, _0x5718d8),
            this[_0x28e260(0x165)](this[_0x28e260(0x135)][_0x28e260(0x196)], this[_0x28e260(0x122)], _0xa325da, _0x48b0fd, _0x5718d8);
    }
    [_0x51d86c(0x165)](_0x58c76f, _0x573c25, _0x2b47c1, _0x10af14, _0x466130) {
        const _0x5cd73c = _0x51d86c;
        _lorentzTranslationOffset['set'](_0x58c76f[_0x5cd73c(0x184)]['x'], _0x58c76f[_0x5cd73c(0x184)]['y'], _0x58c76f[_0x5cd73c(0x184)]['z'])['applyQuaternion'](_gaugeManifoldOrientation),
            _0x573c25['ax'] = _0x2b47c1 + _lorentzTranslationOffset['x'],
            _0x573c25['ay'] = _0x10af14 + _lorentzTranslationOffset['y'],
            _0x573c25['az'] = _0x466130 + _lorentzTranslationOffset['z'],
            _lorentzTranslationOffset['set'](_0x58c76f[_0x5cd73c(0xc0)]['x'], _0x58c76f[_0x5cd73c(0xc0)]['y'], _0x58c76f[_0x5cd73c(0xc0)]['z'])['applyQuaternion'](_gaugeManifoldOrientation),
            _0x573c25['bx'] = _0x2b47c1 + _lorentzTranslationOffset['x'],
            _0x573c25['by'] = _0x10af14 + _lorentzTranslationOffset['y'],
            _0x573c25['bz'] = _0x466130 + _lorentzTranslationOffset['z'],
            _0x573c25['radius'] = _0x58c76f[_0x5cd73c(0x134)],
            _0x573c25['rSq'] = _0x58c76f[_0x5cd73c(0x134)] * _0x58c76f[_0x5cd73c(0x134)],
            _0x573c25[_0x5cd73c(0x11e)] = _0x573c25['bx'] - _0x573c25['ax'],
            _0x573c25[_0x5cd73c(0x170)] = _0x573c25['by'] - _0x573c25['ay'],
            _0x573c25[_0x5cd73c(0xad)] = _0x573c25['bz'] - _0x573c25['az'],
            _0x573c25[_0x5cd73c(0x93)] = _0x573c25[_0x5cd73c(0x11e)] * _0x573c25['abx'] + _0x573c25[_0x5cd73c(0x170)] * _0x573c25[_0x5cd73c(0x170)] + _0x573c25['abz'] * _0x573c25[_0x5cd73c(0xad)];
    }
    [_0x51d86c(0xb7)](_0x3b0a7b) {
        const _0x4432e5 = _0x51d86c;
        if (!this['_headBone'])
            return;
        const _0x2c026c = this[_0x4432e5(0x100)]
            , _0x4ef9d4 = _0x3b0a7b['x'] - _0x2c026c['cx']
            , _0x4e4e2c = _0x3b0a7b['y'] - _0x2c026c['cy']
            , _0x2a4d25 = _0x3b0a7b['z'] - _0x2c026c['cz']
            , _0x1fd229 = _0x4ef9d4 * _0x4ef9d4 + _0x4e4e2c * _0x4e4e2c + _0x2a4d25 * _0x2a4d25;
        if (_0x1fd229 < _0x2c026c[_0x4432e5(0x83)] && _0x1fd229 > 0.000001) {
            const _0x1a487b = Math['sqrt'](_0x1fd229)
                , _0xc616c2 = _0x2c026c[_0x4432e5(0x134)] / _0x1a487b;
            _0x3b0a7b['x'] = _0x2c026c['cx'] + _0x4ef9d4 * _0xc616c2,
                _0x3b0a7b['y'] = _0x2c026c['cy'] + _0x4e4e2c * _0xc616c2,
                _0x3b0a7b['z'] = _0x2c026c['cz'] + _0x2a4d25 * _0xc616c2;
            const _0x29ea7d = _0x3b0a7b['oldX'] - _0x2c026c['cx']
                , _0x5cf2a4 = _0x3b0a7b[_0x4432e5(0x18d)] - _0x2c026c['cy']
                , _0x13b18 = _0x3b0a7b['oldZ'] - _0x2c026c['cz']
                , _0xb978aa = _0x29ea7d * _0x29ea7d + _0x5cf2a4 * _0x5cf2a4 + _0x13b18 * _0x13b18;
            if (_0xb978aa < _0x2c026c[_0x4432e5(0x83)] && _0xb978aa > 0.000001) {
                const _0x575a75 = Math['sqrt'](_0xb978aa)
                    , _0x1b06bc = _0x2c026c[_0x4432e5(0x134)] / _0x575a75;
                _0x3b0a7b[_0x4432e5(0x15c)] = _0x2c026c['cx'] + _0x29ea7d * _0x1b06bc,
                    _0x3b0a7b[_0x4432e5(0x18d)] = _0x2c026c['cy'] + _0x5cf2a4 * _0x1b06bc,
                    _0x3b0a7b[_0x4432e5(0xa6)] = _0x2c026c['cz'] + _0x13b18 * _0x1b06bc;
            }
        }
        this[_0x4432e5(0x167)](_0x3b0a7b, this[_0x4432e5(0x9e)]),
            this[_0x4432e5(0x167)](_0x3b0a7b, this[_0x4432e5(0x132)]),
            this[_0x4432e5(0x167)](_0x3b0a7b, this[_0x4432e5(0x122)]);
    }
    [_0x51d86c(0x167)](_0x1fbf4c, _0x26eb94) {
        const _0x9d0ed4 = _0x51d86c
            , _0x4028de = _0x1fbf4c['x'] - _0x26eb94['ax']
            , _0x23ebab = _0x1fbf4c['y'] - _0x26eb94['ay']
            , _0x26c07a = _0x1fbf4c['z'] - _0x26eb94['az'];
        let _0x13e6d1 = (_0x4028de * _0x26eb94[_0x9d0ed4(0x11e)] + _0x23ebab * _0x26eb94[_0x9d0ed4(0x170)] + _0x26c07a * _0x26eb94['abz']) / (_0x26eb94[_0x9d0ed4(0x93)] || 0.0001);
        _0x13e6d1 = Math[_0x9d0ed4(0x1a3)](0x0, Math[_0x9d0ed4(0x1a9)](0x1, _0x13e6d1));
        const _0x36ad55 = _0x26eb94['ax'] + _0x26eb94[_0x9d0ed4(0x11e)] * _0x13e6d1
            , _0xce95d1 = _0x26eb94['ay'] + _0x26eb94['aby'] * _0x13e6d1
            , _0x1e90f4 = _0x26eb94['az'] + _0x26eb94[_0x9d0ed4(0xad)] * _0x13e6d1
            , _0x47f175 = _0x1fbf4c['x'] - _0x36ad55
            , _0x1f0e3e = _0x1fbf4c['y'] - _0xce95d1
            , _0x18aa2e = _0x1fbf4c['z'] - _0x1e90f4
            , _0x451de1 = _0x47f175 * _0x47f175 + _0x1f0e3e * _0x1f0e3e + _0x18aa2e * _0x18aa2e;
        if (_0x451de1 < _0x26eb94[_0x9d0ed4(0x83)] && _0x451de1 > 0.000001) {
            const _0x451ba2 = Math['sqrt'](_0x451de1)
                , _0x2dcf6f = _0x26eb94[_0x9d0ed4(0x134)] / _0x451ba2;
            _0x1fbf4c['x'] = _0x36ad55 + _0x47f175 * _0x2dcf6f,
                _0x1fbf4c['y'] = _0xce95d1 + _0x1f0e3e * _0x2dcf6f,
                _0x1fbf4c['z'] = _0x1e90f4 + _0x18aa2e * _0x2dcf6f;
            const _0x1569b5 = _0x1fbf4c[_0x9d0ed4(0x15c)] - _0x26eb94['ax']
                , _0x291480 = _0x1fbf4c[_0x9d0ed4(0x18d)] - _0x26eb94['ay']
                , _0x42be3c = _0x1fbf4c[_0x9d0ed4(0xa6)] - _0x26eb94['az'];
            let _0x34ea15 = (_0x1569b5 * _0x26eb94['abx'] + _0x291480 * _0x26eb94[_0x9d0ed4(0x170)] + _0x42be3c * _0x26eb94['abz']) / (_0x26eb94[_0x9d0ed4(0x93)] || 0.0001);
            _0x34ea15 = Math[_0x9d0ed4(0x1a3)](0x0, Math['min'](0x1, _0x34ea15));
            const _0x265304 = _0x26eb94['ax'] + _0x26eb94[_0x9d0ed4(0x11e)] * _0x34ea15
                , _0x36432e = _0x26eb94['ay'] + _0x26eb94['aby'] * _0x34ea15
                , _0x2df9c4 = _0x26eb94['az'] + _0x26eb94['abz'] * _0x34ea15
                , _0x39b68b = _0x1fbf4c[_0x9d0ed4(0x15c)] - _0x265304
                , _0x35721c = _0x1fbf4c[_0x9d0ed4(0x18d)] - _0x36432e
                , _0x24bb16 = _0x1fbf4c['oldZ'] - _0x2df9c4
                , _0x5e0d8b = _0x39b68b * _0x39b68b + _0x35721c * _0x35721c + _0x24bb16 * _0x24bb16;
            if (_0x5e0d8b < _0x26eb94[_0x9d0ed4(0x83)] && _0x5e0d8b > 0.000001) {
                const _0x1b121c = Math[_0x9d0ed4(0x14f)](_0x5e0d8b)
                    , _0x2512df = _0x26eb94[_0x9d0ed4(0x134)] / _0x1b121c;
                _0x1fbf4c[_0x9d0ed4(0x15c)] = _0x265304 + _0x39b68b * _0x2512df,
                    _0x1fbf4c[_0x9d0ed4(0x18d)] = _0x36432e + _0x35721c * _0x2512df,
                    _0x1fbf4c[_0x9d0ed4(0xa6)] = _0x2df9c4 + _0x24bb16 * _0x2512df;
            }
        }
    }
    [_0x51d86c(0x141)](_0xacb92d) {
        const _0x2e16e7 = _0x51d86c;
        if (!this['initialized'] || !this[_0x2e16e7(0xec)] || _0xacb92d <= 0x0)
            return;
        const _0x4e872d = 0x1 / 0x3c;
        this[_0x2e16e7(0xfe)] += Math[_0x2e16e7(0x1a9)](_0xacb92d, 0.1),
            this[_0x2e16e7(0x1a1)]();
        while (this[_0x2e16e7(0xfe)] >= _0x4e872d) {
            this[_0x2e16e7(0xa1)](_0x4e872d),
                this[_0x2e16e7(0xfe)] -= _0x4e872d;
        }
        for (const _0x2863a7 of this[_0x2e16e7(0x129)]) {
            _0x2863a7[_0x2e16e7(0xa3)]();
        }
        this['_debugProbe'] && this['_debugProbe']['update']();
    }
    [_0x51d86c(0xa1)](_0x933469) {
        const _0x27fba5 = _0x51d86c
            , { gravity: _0x2147a3, damping: _0x5ef844, substeps: _0x558c54, inertia: _0x1450d2 } = this['config']
            , _0x227503 = this[_0x27fba5(0x160)] !== undefined ? this[_0x27fba5(0x160)] : _0x5ef844
            , _0x51b749 = _0x933469 * _0x933469
            , _0x432d47 = (Math[_0x27fba5(0x1a8)](Date[_0x27fba5(0x177)]() * 0.003) * 0.5 + 0.5) * (this[_0x27fba5(0x12f)] || 0x0);
        for (const _0x50fed9 of this[_0x27fba5(0x129)]) {
            _0x50fed9[_0x27fba5(0x88)](_0x1450d2);
            for (let _0x149bee = 0x1; _0x149bee < _0x50fed9[_0x27fba5(0x87)]['length']; _0x149bee++) {
                const _0x9fba65 = _0x50fed9['particles'][_0x149bee]
                    , _0x1df620 = (_0x9fba65['x'] - _0x9fba65[_0x27fba5(0x15c)]) * _0x227503
                    , _0x303157 = (_0x9fba65['y'] - _0x9fba65[_0x27fba5(0x18d)]) * _0x227503
                    , _0xba1db4 = (_0x9fba65['z'] - _0x9fba65[_0x27fba5(0xa6)]) * _0x227503;
                _0x9fba65['oldX'] = _0x9fba65['x'],
                    _0x9fba65[_0x27fba5(0x18d)] = _0x9fba65['y'],
                    _0x9fba65[_0x27fba5(0xa6)] = _0x9fba65['z'],
                    _0x9fba65['x'] += _0x1df620 + _0x432d47 * _0x51b749 * 0x5,
                    _0x9fba65['y'] += _0x303157 + _0x2147a3 * _0x51b749,
                    _0x9fba65['z'] += _0xba1db4;
            }
            for (let _0x3cd7f9 = 0x0; _0x3cd7f9 < _0x558c54; _0x3cd7f9++) {
                for (const _0x3da050 of _0x50fed9[_0x27fba5(0x85)]) {
                    _0x3da050[_0x27fba5(0x18a)]();
                }
                for (let _0x11f248 = 0x1; _0x11f248 < _0x50fed9[_0x27fba5(0x87)]['length']; _0x11f248++) {
                    this['_resolveCollisions'](_0x50fed9['particles'][_0x11f248]);
                }
            }
        }
    }
    [_0x51d86c(0x8a)]() {
        const _0xd1587f = _0x51d86c;
        return !this[_0xd1587f(0x14b)] && (this[_0xd1587f(0x14b)] = new PoincareGaugeBoundaryProbe(this)),
            this[_0xd1587f(0x14b)];
    }
    [_0x51d86c(0xdf)](_0x22e6da) {
        const _0x3a4c1d = _0x51d86c;
        this[_0x3a4c1d(0x14b)] && this[_0x3a4c1d(0x14b)][_0x3a4c1d(0x115)](_0x22e6da);
    }
}
export { QuantumGaugeFieldEngine as GaugeFieldSolver, QuantumGaugeFieldEngine as QuantumLatticeEngine };
export class PoincareGaugeBoundaryProbe {
    constructor(_0x36a713) {
        const _0x5d3a39 = _0x51d86c;
        this[_0x5d3a39(0x9d)] = _0x36a713,
            this[_0x5d3a39(0x18b)] = new _0x342224['Group'](),
            this[_0x5d3a39(0x18b)][_0x5d3a39(0x148)] = _0x5d3a39(0xf4);
        const _0x4b7882 = new _0x342224[(_0x5d3a39(0x158))](0x1, 0x18, 0x10);
        this['_sphereFill'] = new _0x342224[(_0x5d3a39(0x11c))](_0x4b7882, new _0x342224['MeshBasicMaterial']({
            'color': 0x22d3ee,
            'transparent': !![],
            'opacity': 0.07,
            'depthWrite': ![],
            'side': _0x342224[_0x5d3a39(0xb1)]
        })),
            this[_0x5d3a39(0x15a)] = new _0x342224[(_0x5d3a39(0x11c))](_0x4b7882, new _0x342224[(_0x5d3a39(0x154))]({
                'color': 0x67e8f9,
                'wireframe': !![],
                'transparent': !![],
                'opacity': 0.4,
                'depthTest': ![]
            })),
            this[_0x5d3a39(0x18b)]['add'](this[_0x5d3a39(0xb4)], this[_0x5d3a39(0x15a)]),
            this['_bodyCapsuleTracker'] = this[_0x5d3a39(0xf3)](0x34d399, 0x6ee7b7),
            this['_leftArmTracker'] = this[_0x5d3a39(0xf3)](0xfbbf24, 0xfde68a),
            this['_rightArmTracker'] = this[_0x5d3a39(0xf3)](0xfbbf24, 0xfde68a),
            this[_0x5d3a39(0x13c)] = new _0x342224['Vector3'](),
            this[_0x5d3a39(0xf8)] = new _0x342224['Vector3'](),
            this[_0x5d3a39(0x103)] = new _0x342224[(_0x5d3a39(0x111))](),
            this['_yAxis'] = new _0x342224[(_0x5d3a39(0xb3))](0x0, 0x1, 0x0);
    }
    [_0x51d86c(0xf3)](_0x1c1c56, _0x38bb5a) {
        const _0x2fe864 = _0x51d86c
            , _0x52038c = {
                'fillMat': new _0x342224[(_0x2fe864(0x154))]({
                    'color': _0x1c1c56,
                    'transparent': !![],
                    'opacity': 0.07,
                    'depthWrite': ![],
                    'side': _0x342224[_0x2fe864(0xb1)]
                }),
                'wireMat': new _0x342224[(_0x2fe864(0x154))]({
                    'color': _0x38bb5a,
                    'wireframe': !![],
                    'transparent': !![],
                    'opacity': 0.4,
                    'depthTest': ![]
                }),
                'fill': null,
                'wire': null,
                'cachedRadius': -0x1,
                'cachedLength': -0x1
            };
        return this[_0x2fe864(0x183)](_0x52038c, 0.1, 0.5),
            _0x52038c;
    }
    ['_buildCapsuleGeo'](_0x1dde20, _0x3d3b15, _0x46427b) {
        const _0x50cd4c = _0x51d86c;
        _0x1dde20[_0x50cd4c(0x120)] && (_0x1dde20[_0x50cd4c(0x120)][_0x50cd4c(0x108)]['dispose'](),
            this['group'][_0x50cd4c(0x172)](_0x1dde20[_0x50cd4c(0x120)], _0x1dde20['wire']));
        const _0x12d720 = new _0x342224[(_0x50cd4c(0x166))](_0x3d3b15, _0x46427b, 0x8, 0x14);
        _0x1dde20[_0x50cd4c(0x120)] = new _0x342224[(_0x50cd4c(0x11c))](_0x12d720, _0x1dde20[_0x50cd4c(0x14c)]),
            _0x1dde20[_0x50cd4c(0xa0)] = new _0x342224[(_0x50cd4c(0x11c))](_0x12d720, _0x1dde20[_0x50cd4c(0x90)]),
            this[_0x50cd4c(0x18b)][_0x50cd4c(0x17a)](_0x1dde20[_0x50cd4c(0x120)], _0x1dde20[_0x50cd4c(0xa0)]),
            _0x1dde20['cachedRadius'] = _0x3d3b15,
            _0x1dde20['cachedLength'] = _0x46427b;
    }
    ['_updateCapsuleTracker'](_0xae0908, _0x44f7a0) {
        const _0x42b5e5 = _0x51d86c
            , _0x22a0d8 = _0x44f7a0['bx'] - _0x44f7a0['ax']
            , _0x48ff8d = _0x44f7a0['by'] - _0x44f7a0['ay']
            , _0x2af939 = _0x44f7a0['bz'] - _0x44f7a0['az']
            , _0x13a08e = Math[_0x42b5e5(0x14f)](_0x22a0d8 * _0x22a0d8 + _0x48ff8d * _0x48ff8d + _0x2af939 * _0x2af939) || 0.001;
        (Math['abs'](_0x13a08e - _0xae0908[_0x42b5e5(0x82)]) > 0.005 || Math[_0x42b5e5(0xe2)](_0x44f7a0[_0x42b5e5(0x134)] - _0xae0908[_0x42b5e5(0x139)]) > 0.002) && this['_buildCapsuleGeo'](_0xae0908, _0x44f7a0['radius'], _0x13a08e),
            this[_0x42b5e5(0xf8)][_0x42b5e5(0x101)]((_0x44f7a0['ax'] + _0x44f7a0['bx']) * 0.5, (_0x44f7a0['ay'] + _0x44f7a0['by']) * 0.5, (_0x44f7a0['az'] + _0x44f7a0['bz']) * 0.5),
            this[_0x42b5e5(0x13c)][_0x42b5e5(0x101)](_0x22a0d8, _0x48ff8d, _0x2af939)[_0x42b5e5(0x14e)](_0x13a08e),
            this[_0x42b5e5(0x103)][_0x42b5e5(0x144)](this[_0x42b5e5(0x96)], this['_capsuleDir']),
            _0xae0908[_0x42b5e5(0x120)][_0x42b5e5(0x14a)][_0x42b5e5(0x185)](this[_0x42b5e5(0xf8)]),
            _0xae0908[_0x42b5e5(0x120)]['quaternion']['copy'](this[_0x42b5e5(0x103)]),
            _0xae0908[_0x42b5e5(0xa0)][_0x42b5e5(0x14a)][_0x42b5e5(0x185)](this[_0x42b5e5(0xf8)]),
            _0xae0908[_0x42b5e5(0xa0)][_0x42b5e5(0x16f)][_0x42b5e5(0x185)](this['_capsuleQuat']);
    }
    [_0x51d86c(0x115)](_0x1dc0c0) {
        const _0x41ab96 = _0x51d86c;
        this[_0x41ab96(0x18b)]['visible'] = _0x1dc0c0;
    }
    [_0x51d86c(0x141)]() {
        const _0xfbb7c8 = _0x51d86c
            , _0x251c8e = this[_0xfbb7c8(0x9d)];
        if (!_0x251c8e || !_0x251c8e[_0xfbb7c8(0x17e)] || !_0x251c8e['initialized'])
            return;
        const _0x4c21f3 = _0x251c8e[_0xfbb7c8(0x100)];
        this[_0xfbb7c8(0xb4)][_0xfbb7c8(0x14a)]['set'](_0x4c21f3['cx'], _0x4c21f3['cy'], _0x4c21f3['cz']),
            this['_sphereFill']['scale'][_0xfbb7c8(0x145)](_0x4c21f3[_0xfbb7c8(0x134)]),
            this['_sphereWire'][_0xfbb7c8(0x14a)]['copy'](this[_0xfbb7c8(0xb4)]['position']),
            this['_sphereWire'][_0xfbb7c8(0xbf)][_0xfbb7c8(0x145)](_0x4c21f3[_0xfbb7c8(0x134)]),
            this[_0xfbb7c8(0xb2)](this[_0xfbb7c8(0x149)], _0x251c8e[_0xfbb7c8(0x9e)]),
            this[_0xfbb7c8(0xb2)](this[_0xfbb7c8(0x112)], _0x251c8e[_0xfbb7c8(0x132)]),
            this['_updateCapsuleTracker'](this['_rightArmTracker'], _0x251c8e[_0xfbb7c8(0x122)]);
    }
    [_0x51d86c(0x195)]() {
        const _0xfb0c3b = _0x51d86c;
        this[_0xfb0c3b(0xb4)][_0xfb0c3b(0x108)][_0xfb0c3b(0x195)](),
            this[_0xfb0c3b(0xb4)][_0xfb0c3b(0x94)][_0xfb0c3b(0x195)](),
            this[_0xfb0c3b(0x15a)][_0xfb0c3b(0x94)][_0xfb0c3b(0x195)]();
        for (const _0x4d63a0 of [this[_0xfb0c3b(0x149)], this[_0xfb0c3b(0x112)], this[_0xfb0c3b(0x138)]]) {
            if (_0x4d63a0['fill'])
                _0x4d63a0[_0xfb0c3b(0x120)][_0xfb0c3b(0x108)][_0xfb0c3b(0x195)]();
            _0x4d63a0[_0xfb0c3b(0x14c)]['dispose'](),
                _0x4d63a0[_0xfb0c3b(0x90)][_0xfb0c3b(0x195)]();
        }
    }
}
export { PoincareGaugeBoundaryProbe as GaugeBoundaryVisualizer, PoincareGaugeBoundaryProbe as ExclusionManifoldProbe };
export class WilsonLatticeTelemetryProbe {
    constructor(_0x2cb532 = {}) {
        const _0x47ae2f = _0x51d86c;
        this[_0x47ae2f(0x162)] = _0x2cb532[_0x47ae2f(0x162)] || _0x47ae2f(0xd3);
    }
    ['update'](_0x117b96) { }
}
export { WilsonLatticeTelemetryProbe as GaugeTelemetryProbe, WilsonLatticeTelemetryProbe as SpinorTelemetryProbe };
function createMatCapTexture() {
    const _0x1c6f6c = _0x51d86c
        , _0x578e2a = document[_0x1c6f6c(0xa2)]('canvas');
    _0x578e2a[_0x1c6f6c(0x109)] = 0x100,
        _0x578e2a['height'] = 0x100;
    const _0x3d6ae6 = _0x578e2a[_0x1c6f6c(0xdd)]('2d')
        , _0x2eb8c3 = _0x3d6ae6['createRadialGradient'](0x5a, 0x50, 0xa, 0x80, 0x80, 0x80);
    return _0x2eb8c3[_0x1c6f6c(0x12a)](0x0, _0x1c6f6c(0x131)),
        _0x2eb8c3[_0x1c6f6c(0x12a)](0.35, _0x1c6f6c(0x1a6)),
        _0x2eb8c3['addColorStop'](0.75, '#66594d'),
        _0x2eb8c3[_0x1c6f6c(0x12a)](0x1, _0x1c6f6c(0x140)),
        _0x3d6ae6['fillStyle'] = _0x2eb8c3,
        _0x3d6ae6['fillRect'](0x0, 0x0, 0x100, 0x100),
        new _0x342224[(_0x1c6f6c(0xdb))](_0x578e2a);
}
const clayMatcapMaterial = new _0x342224[(_0x51d86c(0x128))]({
    'matcap': createMatCapTexture()
})
    , normalShaderMaterial = new _0x342224[(_0x51d86c(0x15e))]();
let scene, camera, renderer, controls, viewHelper;
function _0x33d4(_0x100993, _0x31cfa3) {
    _0x100993 = _0x100993 - 0x82;
    const _0x1068ed = _0x1068();
    let _0x33d4f3 = _0x1068ed[_0x100993];
    return _0x33d4f3;
}
const clock = new _0x342224[(_0x51d86c(0x197))]()
    , characterRoot = new _0x342224[(_0x51d86c(0xbb))]();
let currentModel = null
    , skeletonHelper = null
    , boneHighlightMarker = null
    , bonesList = []
    , isSkeletonVisible = ![]
    , isWireframe = ![]
    , selectedBoneNode = null
    , currentShadingMode = _0x51d86c(0x95);
const quantumGaugeFieldEngine = new QuantumGaugeFieldEngine();
let colliderHelper = null
    , isColliderVisible = ![];
const moveState = {
    'forward': ![],
    'backward': ![],
    'left': ![],
    'right': ![],
    'jump': ![],
    'sprint': ![]
}
    , charPhysics = {
        'velocityY': 0x0,
        'isGrounded': !![],
        'gravity': -0x18,
        'jumpForce': 0xf,
        'baseSpeed': 0x5,
        'sprintMultiplier': 1.8,
        'targetRotation': 0x0,
        'currentRotation': 0x0,
        'walkCycle': 0x0,
        'movementVelocity': new _0x342224['Vector3']()
    }
    , container = document['getElementById'](_0x51d86c(0xb8))
    , loaderElem = document['getElementById'](_0x51d86c(0x8f))
    , modelNameBadge = document[_0x51d86c(0x193)](_0x51d86c(0xe1))
    , boneListContainer = document['getElementById'](_0x51d86c(0x192))
    , boneCountBadge = document[_0x51d86c(0x193)](_0x51d86c(0xf0))
    , statMeshes = document[_0x51d86c(0x193)]('stat-meshes')
    , statVertices = document[_0x51d86c(0x193)]('stat-vertices')
    , sidebar = document['getElementById']('sidebar');
console.log(
    '%c' +
    '  ___                         \n' +
    ' / __| __ _ _ __  _____ __ __ _ \n' +
    ' \\__ \\/ _` | \'  \\/ _ \\ V  V / \\  \\\n' +
    ' |___/\\__,_|_|_|_\\___/\\_/\\_/|_||_|\n' +
    '──────────────────────────────────\n' +
    ' Open for creative collaborations!\n' +
    ' Check out more of my work: https://samown.com\n',
    'color: #d300ccff; font-family: monospace; font-size: 11px; line-height: 1.3; font-weight: bold;'
);
typeof window !== 'undefined' && container && init();
function init() {
    const _0x5c77b9 = _0x51d86c;
    scene = new _0x342224['Scene'](),
        scene['background'] = new _0x342224[(_0x5c77b9(0x99))](0xa0c10),
        camera = new _0x342224['PerspectiveCamera'](0x2d, window[_0x5c77b9(0x107)] / window['innerHeight'], 0.1, 0x64),
        camera[_0x5c77b9(0x14a)][_0x5c77b9(0x101)](0x0, 2.2, 4.5),
        renderer = new _0x342224[(_0x5c77b9(0xd1))]({
            'antialias': !![],
            'alpha': ![],
            'powerPreference': _0x5c77b9(0xc9)
        }),
        renderer[_0x5c77b9(0xfa)](window[_0x5c77b9(0x107)], window[_0x5c77b9(0x174)]),
        renderer[_0x5c77b9(0xe9)](Math[_0x5c77b9(0x1a9)](window['devicePixelRatio'], 0x2)),
        renderer['toneMapping'] = _0x342224['ACESFilmicToneMapping'],
        renderer['toneMappingExposure'] = 0.85,
        renderer[_0x5c77b9(0x10a)][_0x5c77b9(0xec)] = !![],
        renderer[_0x5c77b9(0x10a)][_0x5c77b9(0xb9)] = _0x342224[_0x5c77b9(0x16c)],
        container['appendChild'](renderer[_0x5c77b9(0x191)]);
    const _0x1d6d33 = new RoomEnvironment(renderer)
        , _0x552d7d = new _0x342224[(_0x5c77b9(0x171))](renderer);
    scene[_0x5c77b9(0x89)] = _0x552d7d['fromScene'](_0x1d6d33)[_0x5c77b9(0xd7)],
        _0x1d6d33[_0x5c77b9(0x195)]();
    const _0x53e6bc = new _0x342224[(_0x5c77b9(0xcd))](0xffffff, 0.4);
    scene[_0x5c77b9(0x17a)](_0x53e6bc);
    const _0x4e8343 = new _0x342224[(_0x5c77b9(0x14d))](0xffffff, 1.6);
    _0x4e8343[_0x5c77b9(0x14a)]['set'](0x4, 0x8, 0x4),
        _0x4e8343[_0x5c77b9(0x180)] = !![],
        _0x4e8343[_0x5c77b9(0x136)][_0x5c77b9(0x190)]['width'] = 0x800,
        _0x4e8343[_0x5c77b9(0x136)][_0x5c77b9(0x190)][_0x5c77b9(0xfd)] = 0x800,
        _0x4e8343[_0x5c77b9(0x136)]['bias'] = -0.0001,
        scene[_0x5c77b9(0x17a)](_0x4e8343);
    const _0x45484c = new _0x342224[(_0x5c77b9(0x14d))](0x90b0ff, 1.2);
    _0x45484c['position'][_0x5c77b9(0x101)](-0x4, 0x4, -0x2),
        scene[_0x5c77b9(0x17a)](_0x45484c);
    const _0x29b3f6 = new _0x342224[(_0x5c77b9(0x14d))](0xffffff, 1.5);
    _0x29b3f6[_0x5c77b9(0x14a)][_0x5c77b9(0x101)](0x0, 0x5, -0x5),
        scene['add'](_0x29b3f6);
    const _0x3b4335 = new _0x342224[(_0x5c77b9(0x11d))](0x3c, 0x3c, 0x3b82f6, 0x1f2937);
    _0x3b4335[_0x5c77b9(0x14a)]['y'] = 0x0,
        _0x3b4335['material']['opacity'] = 0.4,
        _0x3b4335[_0x5c77b9(0x94)][_0x5c77b9(0x11b)] = !![],
        scene[_0x5c77b9(0x17a)](_0x3b4335);
    const _0x5a9299 = new _0x342224[(_0x5c77b9(0xce))](0x3c, 0x3c)
        , _0x28e29b = new _0x342224[(_0x5c77b9(0x169))]({
            'opacity': 0.3
        })
        , _0x23f18d = new _0x342224[(_0x5c77b9(0x11c))](_0x5a9299, _0x28e29b);
    _0x23f18d[_0x5c77b9(0x16b)]['x'] = -Math['PI'] / 0x2,
        _0x23f18d[_0x5c77b9(0xf2)] = !![],
        scene[_0x5c77b9(0x17a)](_0x23f18d),
        scene['add'](characterRoot),
        controls = new OrbitControls(camera, renderer[_0x5c77b9(0x191)]),
        controls[_0x5c77b9(0x114)] = !![],
        controls['dampingFactor'] = 0.05,
        controls['maxPolarAngle'] = Math['PI'] / 0x2 - 0.02,
        controls[_0x5c77b9(0x159)] = 0x1,
        controls[_0x5c77b9(0x16a)] = 0x19,
        controls[_0x5c77b9(0x187)]['set'](0x0, 1.2, 0x0),
        controls[_0x5c77b9(0x141)]();
    const _0x3035d0 = new _0x342224[(_0x5c77b9(0x158))](0.025, 0x10, 0x10)
        , _0x1e10c5 = new _0x342224['MeshBasicMaterial']({
            'color': 0xec4899,
            'wireframe': !![],
            'depthTest': ![],
            'transparent': !![],
            'opacity': 0.9
        });
    boneHighlightMarker = new _0x342224[(_0x5c77b9(0x11c))](_0x3035d0, _0x1e10c5),
        boneHighlightMarker[_0x5c77b9(0xfb)] = ![],
        scene[_0x5c77b9(0x17a)](boneHighlightMarker),
        viewHelper = new ViewHelper(camera, renderer['domElement']),
        renderer['domElement'][_0x5c77b9(0x8b)](_0x5c77b9(0x19a), _0x465f89 => {
            const _0x40c363 = _0x5c77b9;
            viewHelper && viewHelper[_0x40c363(0x188)](_0x465f89) && (controls[_0x40c363(0xec)] = ![]);
        }
        ),
        loadGLBModel(_0x5c77b9(0x125), _0x5c77b9(0x11f)),
        window[_0x5c77b9(0x8b)](_0x5c77b9(0x173), onWindowResize),
        setupUIListeners(),
        setupDragAndDrop(),
        animate();
}
function loadGLBModel(_0x461fa0, _0x53dc1f) {
    const _0x17fd04 = _0x51d86c;
    if (loaderElem)
        loaderElem[_0x17fd04(0xc6)][_0x17fd04(0x172)](_0x17fd04(0xc4));
    if (modelNameBadge)
        modelNameBadge[_0x17fd04(0x1a5)] = _0x53dc1f;
    const _0x1dc496 = new GLTFLoader();
    _0x1dc496[_0x17fd04(0x119)](_0x461fa0, _0x3cd624 => {
        const _0x1aaaf4 = _0x17fd04;
        if (currentModel) {
            characterRoot[_0x1aaaf4(0x172)](currentModel);
            if (skeletonHelper)
                scene[_0x1aaaf4(0x172)](skeletonHelper);
        }
        currentModel = _0x3cd624[_0x1aaaf4(0x1a2)];
        let _0x3afbe1 = 0x0
            , _0x3d5433 = 0x0;
        bonesList = [],
            currentModel[_0x1aaaf4(0x97)](_0x3c51ab => {
                const _0x49c204 = _0x1aaaf4;
                _0x3c51ab[_0x49c204(0x1a0)] && (_0x3afbe1++,
                    _0x3c51ab[_0x49c204(0x180)] = !![],
                    _0x3c51ab[_0x49c204(0xf2)] = !![],
                    _0x3c51ab[_0x49c204(0xeb)][_0x49c204(0xc7)] = _0x3c51ab[_0x49c204(0x94)],
                    _0x3c51ab['geometry'] && (_0x3d5433 += _0x3c51ab[_0x49c204(0x108)]['attributes'][_0x49c204(0x14a)] ? _0x3c51ab[_0x49c204(0x108)]['attributes'][_0x49c204(0x14a)][_0x49c204(0x1a4)] : 0x0)),
                    _0x3c51ab['isBone'] && bonesList['push'](_0x3c51ab);
            }
            );
        const _0x4bcf37 = new _0x342224[(_0x1aaaf4(0x155))]()[_0x1aaaf4(0xf6)](currentModel)
            , _0x1bcfea = _0x4bcf37['getCenter'](new _0x342224[(_0x1aaaf4(0xb3))]());
        currentModel['position']['x'] -= _0x1bcfea['x'],
            currentModel['position']['z'] -= _0x1bcfea['z'],
            currentModel[_0x1aaaf4(0x14a)]['y'] -= _0x4bcf37[_0x1aaaf4(0x1a9)]['y'],
            characterRoot['add'](currentModel),
            characterRoot[_0x1aaaf4(0x153)](!![]),
            applyShadingMode(currentShadingMode),
            skeletonHelper = new _0x342224['SkeletonHelper'](currentModel || characterRoot),
            skeletonHelper['material'][_0x1aaaf4(0xd9)] = 0x2,
            skeletonHelper[_0x1aaaf4(0x94)][_0x1aaaf4(0x106)] = ![],
            skeletonHelper[_0x1aaaf4(0x94)]['transparent'] = !![],
            skeletonHelper[_0x1aaaf4(0xfb)] = isSkeletonVisible,
            scene['add'](skeletonHelper),
            camera[_0x1aaaf4(0x14a)][_0x1aaaf4(0x101)](0x0, 2.2, 4.5),
            controls[_0x1aaaf4(0x187)][_0x1aaaf4(0x101)](0x0, 1.2, 0x0),
            controls[_0x1aaaf4(0x141)]();
        if (statMeshes)
            statMeshes[_0x1aaaf4(0x1a5)] = _0x3afbe1;
        if (statVertices)
            statVertices[_0x1aaaf4(0x1a5)] = _0x3d5433['toLocaleString']();
        if (boneCountBadge)
            boneCountBadge[_0x1aaaf4(0x1a5)] = bonesList['length'] + _0x1aaaf4(0x17f);
        populateBoneList();
        if (loaderElem)
            loaderElem[_0x1aaaf4(0xc6)][_0x1aaaf4(0x17a)](_0x1aaaf4(0xc4));
        quantumGaugeFieldEngine[_0x1aaaf4(0x152)](),
            quantumGaugeFieldEngine[_0x1aaaf4(0x8e)](currentModel),
            colliderHelper && (scene['remove'](colliderHelper[_0x1aaaf4(0x18b)]),
                colliderHelper[_0x1aaaf4(0x195)]()),
            colliderHelper = quantumGaugeFieldEngine[_0x1aaaf4(0x8a)](),
            colliderHelper[_0x1aaaf4(0x115)](isColliderVisible),
            scene[_0x1aaaf4(0x17a)](colliderHelper['group']);
    }
        , _0xbda448 => { }
        , _0x542902 => {
            const _0x1466fe = _0x17fd04;
            console[_0x1466fe(0x13f)](_0x1466fe(0x19b), _0x542902);
            if (loaderElem)
                loaderElem[_0x1466fe(0xc6)][_0x1466fe(0x17a)](_0x1466fe(0xc4));
            alert(_0x1466fe(0xf1));
        }
    );
}
function populateBoneList() {
    const _0x176ac4 = _0x51d86c;
    if (!boneListContainer)
        return;
    boneListContainer[_0x176ac4(0xe4)] = '';
    if (bonesList[_0x176ac4(0xca)] === 0x0) {
        boneListContainer['innerHTML'] = '<div\x20style=\x22padding:16px;\x20text-align:center;\x20color:var(--text-muted);\x20font-size:12px;\x22>No\x20bone\x20hierarchy\x20found\x20in\x20model.</div>';
        return;
    }
    bonesList['forEach']((_0x3d0fbd, _0xc50dd7) => {
        const _0x12aed5 = _0x176ac4
            , _0x1650f1 = document[_0x12aed5(0xa2)](_0x12aed5(0x13e));
        _0x1650f1[_0x12aed5(0x110)] = _0x12aed5(0xe6),
            _0x1650f1[_0x12aed5(0xe4)] = _0x12aed5(0x17c) + (_0x3d0fbd[_0x12aed5(0x148)] || _0x12aed5(0x9c) + _0xc50dd7) + '</span>\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22bone-tag\x22>#' + (_0xc50dd7 + 0x1) + '</span>\x0a\x20\x20\x20\x20',
            _0x1650f1[_0x12aed5(0x8b)](_0x12aed5(0x10f), () => {
                selectBone(_0x3d0fbd, _0x1650f1);
            }
            ),
            boneListContainer[_0x12aed5(0xbc)](_0x1650f1);
    }
    );
}
function selectBone(_0x21f737, _0x54f467) {
    const _0x17ac70 = _0x51d86c;
    document[_0x17ac70(0x151)](_0x17ac70(0x105))[_0x17ac70(0x19c)](_0x22ff8e => _0x22ff8e['classList'][_0x17ac70(0x172)](_0x17ac70(0x8c))),
        _0x54f467[_0x17ac70(0xc6)][_0x17ac70(0x17a)](_0x17ac70(0x8c)),
        selectedBoneNode = _0x21f737;
    const _0x5276d3 = new _0x342224[(_0x17ac70(0xb3))]();
    _0x21f737[_0x17ac70(0x18e)](_0x5276d3),
        boneHighlightMarker[_0x17ac70(0x14a)][_0x17ac70(0x185)](_0x5276d3),
        boneHighlightMarker['visible'] = !![],
        controls[_0x17ac70(0x187)][_0x17ac70(0x185)](_0x5276d3);
}
function resetCharacterPosition() {
    const _0x970993 = _0x51d86c;
    characterRoot['position'][_0x970993(0x101)](0x0, 0x0, 0x0),
        charPhysics['velocityY'] = 0x0,
        charPhysics[_0x970993(0x18f)] = !![],
        charPhysics[_0x970993(0xc3)] = 0x0,
        charPhysics['currentRotation'] = 0x0,
        charPhysics[_0x970993(0x91)][_0x970993(0x101)](0x0, 0x0, 0x0),
        characterRoot['rotation']['y'] = 0x0;
    if (currentModel) {
        const _0x11273d = new _0x342224[(_0x970993(0x155))]()['setFromObject'](currentModel)
            , _0x362f85 = _0x11273d[_0x970993(0x127)](new _0x342224[(_0x970993(0xb3))]());
        currentModel[_0x970993(0x14a)]['x'] -= _0x362f85['x'],
            currentModel[_0x970993(0x14a)]['z'] -= _0x362f85['z'],
            currentModel['position']['y'] -= _0x11273d[_0x970993(0x1a9)]['y'],
            currentModel['rotation'][_0x970993(0x101)](0x0, 0x0, 0x0);
    }
    if (quantumGaugeFieldEngine)
        quantumGaugeFieldEngine[_0x970993(0x152)]();
    camera[_0x970993(0x14a)]['set'](0x0, 2.2, 4.5),
        controls[_0x970993(0x187)][_0x970993(0x101)](0x0, 1.2, 0x0),
        controls[_0x970993(0x141)]();
    if (boneHighlightMarker)
        boneHighlightMarker['visible'] = ![];
    document[_0x970993(0x151)](_0x970993(0x105))[_0x970993(0x19c)](_0x2544ce => _0x2544ce[_0x970993(0xc6)][_0x970993(0x172)]('selected'));
}
function updateCharacter(_0x8d09b) {
    const _0x34f85b = _0x51d86c;
    if (!currentModel)
        return;
    const _0x1cbed3 = (moveState['right'] ? 0x1 : 0x0) - (moveState[_0x34f85b(0x16d)] ? 0x1 : 0x0)
        , _0x4ea343 = (moveState[_0x34f85b(0xee)] ? 0x1 : 0x0) - (moveState[_0x34f85b(0x143)] ? 0x1 : 0x0)
        , _0x55d7f6 = _0x1cbed3 !== 0x0 || _0x4ea343 !== 0x0;
    if (_0x55d7f6) {
        const _0x533f9b = Math['atan2'](camera[_0x34f85b(0x14a)]['x'] - controls[_0x34f85b(0x187)]['x'], camera[_0x34f85b(0x14a)]['z'] - controls[_0x34f85b(0x187)]['z'])
            , _0x26f749 = Math[_0x34f85b(0x118)](_0x1cbed3, _0x4ea343);
        charPhysics['targetRotation'] = _0x533f9b + _0x26f749;
        const _0x24b02a = charPhysics[_0x34f85b(0xf9)] * (moveState[_0x34f85b(0xcc)] ? charPhysics[_0x34f85b(0x199)] : 0x1)
            , _0x24683b = _0x24b02a * _0x8d09b
            , _0x46eb61 = new _0x342224[(_0x34f85b(0xb3))](Math['sin'](charPhysics[_0x34f85b(0xc3)]), 0x0, Math['cos'](charPhysics[_0x34f85b(0xc3)]));
        charPhysics[_0x34f85b(0x91)][_0x34f85b(0x185)](_0x46eb61)['multiplyScalar'](_0x24b02a);
        const _0xac928e = characterRoot[_0x34f85b(0x14a)][_0x34f85b(0x11a)]();
        characterRoot[_0x34f85b(0x14a)]['addScaledVector'](_0x46eb61, _0x24683b);
        const _0x2c086e = characterRoot[_0x34f85b(0x14a)][_0x34f85b(0x11a)]()[_0x34f85b(0x161)](_0xac928e);
        camera['position'][_0x34f85b(0x17a)](_0x2c086e),
            controls[_0x34f85b(0x187)][_0x34f85b(0x17a)](_0x2c086e),
            charPhysics[_0x34f85b(0x186)] += _0x8d09b * (moveState[_0x34f85b(0xcc)] ? 0xe : 0x9);
        const _0x45c38c = Math[_0x34f85b(0xe2)](Math[_0x34f85b(0x1a8)](charPhysics[_0x34f85b(0x186)])) * 0.05
            , _0x33c534 = Math[_0x34f85b(0x1a8)](charPhysics[_0x34f85b(0x186)]) * 0.03;
        currentModel[_0x34f85b(0x14a)]['y'] = _0x45c38c,
            currentModel['rotation']['z'] = _0x33c534;
    } else
        charPhysics['movementVelocity'][_0x34f85b(0x101)](0x0, 0x0, 0x0),
            currentModel[_0x34f85b(0x14a)]['y'] = _0x342224[_0x34f85b(0x9b)]['lerp'](currentModel[_0x34f85b(0x14a)]['y'], 0x0, _0x8d09b * 0xa),
            currentModel[_0x34f85b(0x16b)]['z'] = _0x342224[_0x34f85b(0x9b)][_0x34f85b(0xa4)](currentModel[_0x34f85b(0x16b)]['z'], 0x0, _0x8d09b * 0xa);
    let _0x30cd05 = charPhysics[_0x34f85b(0xc3)] - charPhysics[_0x34f85b(0x168)];
    _0x30cd05 = Math[_0x34f85b(0x118)](Math[_0x34f85b(0x1a8)](_0x30cd05), Math['cos'](_0x30cd05)),
        charPhysics[_0x34f85b(0x168)] += _0x30cd05 * Math[_0x34f85b(0x1a9)](_0x8d09b * 0xc, 0x1),
        characterRoot[_0x34f85b(0x16b)]['y'] = charPhysics[_0x34f85b(0x168)];
    const _0x625156 = characterRoot['position']['y'];
    !charPhysics[_0x34f85b(0x18f)] && (charPhysics[_0x34f85b(0xc1)] += charPhysics['gravity'] * _0x8d09b,
        characterRoot[_0x34f85b(0x14a)]['y'] += charPhysics[_0x34f85b(0xc1)] * _0x8d09b,
        charPhysics[_0x34f85b(0x91)]['y'] = charPhysics[_0x34f85b(0xc1)],
        characterRoot[_0x34f85b(0x14a)]['y'] <= 0x0 && (characterRoot[_0x34f85b(0x14a)]['y'] = 0x0,
            charPhysics['velocityY'] = 0x0,
            charPhysics[_0x34f85b(0x18f)] = !![]));
    const _0x5ce976 = characterRoot[_0x34f85b(0x14a)]['y'] - _0x625156;
    camera['position']['y'] += _0x5ce976,
        controls[_0x34f85b(0x187)]['y'] += _0x5ce976;
}
function setupUIListeners() {
    const _0x5868ca = _0x51d86c
        , _0x408cc6 = document[_0x5868ca(0x193)](_0x5868ca(0x179));
    _0x408cc6 && _0x408cc6['addEventListener']('click', () => {
        const _0xae24d8 = _0x5868ca;
        isSkeletonVisible = !isSkeletonVisible,
            _0x408cc6['classList'][_0xae24d8(0x126)]('active', isSkeletonVisible);
        if (skeletonHelper)
            skeletonHelper[_0xae24d8(0xfb)] = isSkeletonVisible;
    }
    );
    const _0x41187b = document[_0x5868ca(0x193)]('btn-toggle-colliders');
    _0x41187b && _0x41187b[_0x5868ca(0x8b)](_0x5868ca(0x10f), () => {
        const _0xc4440b = _0x5868ca;
        isColliderVisible = !isColliderVisible,
            _0x41187b[_0xc4440b(0xc6)][_0xc4440b(0x126)]('active', isColliderVisible);
        if (colliderHelper)
            colliderHelper[_0xc4440b(0x115)](isColliderVisible);
    }
    );
    const _0x481a3a = document[_0x5868ca(0x193)](_0x5868ca(0xa5));
    _0x481a3a && _0x481a3a[_0x5868ca(0x8b)](_0x5868ca(0x10f), () => {
        const _0x4625cc = _0x5868ca;
        isWireframe = !isWireframe,
            _0x481a3a['classList'][_0x4625cc(0x126)](_0x4625cc(0xcf), isWireframe),
            currentModel && currentModel[_0x4625cc(0x97)](_0x2c426f => {
                const _0x1ef1eb = _0x4625cc;
                _0x2c426f['isMesh'] && _0x2c426f[_0x1ef1eb(0x94)] && (Array['isArray'](_0x2c426f['material']) ? _0x2c426f['material']['forEach'](_0x53bc18 => _0x53bc18[_0x1ef1eb(0x133)] = isWireframe) : _0x2c426f[_0x1ef1eb(0x94)][_0x1ef1eb(0x133)] = isWireframe);
            }
            );
    }
    );
    const _0x35ef34 = document['getElementById'](_0x5868ca(0xed));
    _0x35ef34 && sidebar && _0x35ef34[_0x5868ca(0x8b)](_0x5868ca(0x10f), () => {
        const _0x52ff98 = _0x5868ca;
        sidebar[_0x52ff98(0xc6)]['toggle'](_0x52ff98(0x98)),
            _0x35ef34[_0x52ff98(0xc6)][_0x52ff98(0x126)]('active', !sidebar[_0x52ff98(0xc6)][_0x52ff98(0x175)](_0x52ff98(0x98)));
    }
    );
    const _0x2c6ae0 = document[_0x5868ca(0x193)](_0x5868ca(0x137))
        , _0x839446 = document[_0x5868ca(0x193)](_0x5868ca(0x12b))
        , _0x4b4aab = document[_0x5868ca(0x193)](_0x5868ca(0x19d));
    if (_0x2c6ae0)
        _0x2c6ae0[_0x5868ca(0x8b)]('click', () => applyShadingMode(_0x5868ca(0xd0)));
    if (_0x839446)
        _0x839446['addEventListener'](_0x5868ca(0x10f), () => applyShadingMode('clay'));
    if (_0x4b4aab)
        _0x4b4aab['addEventListener'](_0x5868ca(0x10f), () => applyShadingMode(_0x5868ca(0x95)));
    const _0x2008e2 = document[_0x5868ca(0x193)](_0x5868ca(0x9a));
    _0x2008e2 && _0x2008e2[_0x5868ca(0x8b)](_0x5868ca(0x10c), _0x18cb3e => {
        const _0xe4195e = _0x5868ca
            , _0x1da86b = _0x18cb3e[_0xe4195e(0x187)]['files'][0x0];
        if (_0x1da86b) {
            const _0x1419ad = URL['createObjectURL'](_0x1da86b);
            loadGLBModel(_0x1419ad, _0x1da86b[_0xe4195e(0x148)]);
        }
    }
    ),
        window[_0x5868ca(0x8b)](_0x5868ca(0xf7), _0x2d9135 => {
            const _0x9c6c09 = _0x5868ca;
            switch (_0x2d9135[_0x9c6c09(0x130)]) {
                case _0x9c6c09(0x19f):
                case _0x9c6c09(0xfc):
                    moveState[_0x9c6c09(0x143)] = !![];
                    break;
                case _0x9c6c09(0x123):
                case _0x9c6c09(0xea):
                    moveState[_0x9c6c09(0xee)] = !![];
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    moveState['left'] = !![];
                    break;
                case _0x9c6c09(0xbe):
                case _0x9c6c09(0xc5):
                    moveState[_0x9c6c09(0x17b)] = !![];
                    break;
                case 'Space':
                    charPhysics['isGrounded'] && (charPhysics['velocityY'] = charPhysics[_0x9c6c09(0x198)],
                        charPhysics['isGrounded'] = ![]);
                    break;
                case _0x9c6c09(0x86):
                case _0x9c6c09(0xab):
                    moveState['sprint'] = !![];
                    break;
            }
        }
        ),
        window[_0x5868ca(0x8b)](_0x5868ca(0xd6), _0x4adf21 => {
            const _0x4e5bae = _0x5868ca;
            switch (_0x4adf21[_0x4e5bae(0x130)]) {
                case _0x4e5bae(0x19f):
                case _0x4e5bae(0xfc):
                    moveState[_0x4e5bae(0x143)] = ![];
                    break;
                case _0x4e5bae(0x123):
                case _0x4e5bae(0xea):
                    moveState[_0x4e5bae(0xee)] = ![];
                    break;
                case _0x4e5bae(0x150):
                case _0x4e5bae(0xd4):
                    moveState[_0x4e5bae(0x16d)] = ![];
                    break;
                case _0x4e5bae(0xbe):
                case 'ArrowRight':
                    moveState[_0x4e5bae(0x17b)] = ![];
                    break;
                case 'ShiftLeft':
                case _0x4e5bae(0xab):
                    moveState[_0x4e5bae(0xcc)] = ![];
                    break;
            }
        }
        );
}
function applyShadingMode(_0x1dd85c) {
    const _0xff6c35 = _0x51d86c;
    currentShadingMode = _0x1dd85c;
    if (!currentModel)
        return;
    currentModel[_0xff6c35(0x97)](_0x2e5d34 => {
        const _0x386225 = _0xff6c35;
        if (_0x2e5d34['isMesh']) {
            if (_0x1dd85c === _0x386225(0xd0))
                _0x2e5d34[_0x386225(0x94)] = _0x2e5d34[_0x386225(0xeb)]['originalMaterial'];
            else {
                if (_0x1dd85c === 'clay')
                    _0x2e5d34[_0x386225(0x94)] = clayMatcapMaterial;
                else
                    _0x1dd85c === _0x386225(0x95) && (_0x2e5d34['material'] = normalShaderMaterial);
            }
            _0x2e5d34[_0x386225(0x94)] && (Array[_0x386225(0x146)](_0x2e5d34['material']) ? _0x2e5d34['material'][_0x386225(0x19c)](_0x3d1f62 => _0x3d1f62['wireframe'] = isWireframe) : _0x2e5d34[_0x386225(0x94)][_0x386225(0x133)] = isWireframe);
        }
    }
    );
    const _0xf8c5d5 = document[_0xff6c35(0x193)](_0xff6c35(0x137))
        , _0x4ebde1 = document['getElementById'](_0xff6c35(0x12b))
        , _0x567fb3 = document[_0xff6c35(0x193)](_0xff6c35(0x19d));
    if (_0xf8c5d5)
        _0xf8c5d5['classList'][_0xff6c35(0x126)](_0xff6c35(0xcf), _0x1dd85c === _0xff6c35(0xd0));
    if (_0x4ebde1)
        _0x4ebde1[_0xff6c35(0xc6)][_0xff6c35(0x126)](_0xff6c35(0xcf), _0x1dd85c === _0xff6c35(0x13d));
    if (_0x567fb3)
        _0x567fb3[_0xff6c35(0xc6)][_0xff6c35(0x126)](_0xff6c35(0xcf), _0x1dd85c === _0xff6c35(0x95));
}
function setupDragAndDrop() {
    const _0x23b561 = _0x51d86c
        , _0x1a7cc6 = document[_0x23b561(0x193)]('drop-zone');
    if (!_0x1a7cc6)
        return;
    window[_0x23b561(0x8b)](_0x23b561(0x9f), _0x39fdba => {
        const _0x3e6bbe = _0x23b561;
        _0x39fdba[_0x3e6bbe(0xa9)](),
            _0x1a7cc6[_0x3e6bbe(0xc6)][_0x3e6bbe(0x17a)](_0x3e6bbe(0xcf));
    }
    ),
        _0x1a7cc6[_0x23b561(0x8b)](_0x23b561(0x102), _0x35d53d => {
            const _0x5da6d4 = _0x23b561;
            _0x35d53d['preventDefault'](),
                _0x1a7cc6[_0x5da6d4(0xc6)][_0x5da6d4(0x172)](_0x5da6d4(0xcf));
        }
        ),
        _0x1a7cc6[_0x23b561(0x8b)](_0x23b561(0xbd), _0x19bed2 => {
            const _0x2e75b6 = _0x23b561;
            _0x19bed2[_0x2e75b6(0xa9)](),
                _0x1a7cc6[_0x2e75b6(0xc6)][_0x2e75b6(0x172)](_0x2e75b6(0xcf));
            if (_0x19bed2[_0x2e75b6(0xc8)][_0x2e75b6(0x10e)] && _0x19bed2[_0x2e75b6(0xc8)][_0x2e75b6(0x10e)][0x0]) {
                const _0x57d41b = _0x19bed2[_0x2e75b6(0xc8)][_0x2e75b6(0x10e)][0x0];
                if (_0x57d41b[_0x2e75b6(0x148)][_0x2e75b6(0x147)](_0x2e75b6(0x176)) || _0x57d41b['name'][_0x2e75b6(0x147)](_0x2e75b6(0xba))) {
                    const _0x1e5cb8 = URL[_0x2e75b6(0x181)](_0x57d41b);
                    loadGLBModel(_0x1e5cb8, _0x57d41b[_0x2e75b6(0x148)]);
                } else
                    alert(_0x2e75b6(0x1a7));
            }
        }
        );
}
function onWindowResize() {
    const _0x22732c = _0x51d86c;
    camera[_0x22732c(0x15b)] = window[_0x22732c(0x107)] / window['innerHeight'],
        camera[_0x22732c(0x113)](),
        renderer['setSize'](window['innerWidth'], window['innerHeight']);
}
function animate() {
    const _0x1fbd3e = _0x51d86c;
    requestAnimationFrame(animate);
    const _0x20f2aa = Math[_0x1fbd3e(0x1a9)](clock[_0x1fbd3e(0x10d)](), 0.1);
    updateCharacter(_0x20f2aa);
    if (quantumGaugeFieldEngine) {
        characterRoot[_0x1fbd3e(0x153)](!![]),
            quantumGaugeFieldEngine['update'](_0x20f2aa);
        if (colliderHelper && isColliderVisible)
            colliderHelper[_0x1fbd3e(0x141)]();
    }
    viewHelper && viewHelper[_0x1fbd3e(0xaa)] ? (viewHelper[_0x1fbd3e(0x157)][_0x1fbd3e(0x185)](controls['target']),
        viewHelper[_0x1fbd3e(0x141)](_0x20f2aa)) : controls[_0x1fbd3e(0xec)] = !![];
    controls['update']();
    if (selectedBoneNode && boneHighlightMarker && boneHighlightMarker[_0x1fbd3e(0xfb)]) {
        const _0x27a3b7 = new _0x342224[(_0x1fbd3e(0xb3))]();
        selectedBoneNode[_0x1fbd3e(0x18e)](_0x27a3b7),
            boneHighlightMarker[_0x1fbd3e(0x14a)][_0x1fbd3e(0x185)](_0x27a3b7);
    }
    renderer[_0x1fbd3e(0x10b)] = ![],
        renderer[_0x1fbd3e(0x178)](),
        renderer[_0x1fbd3e(0x116)](scene, camera),
        viewHelper && viewHelper[_0x1fbd3e(0x116)](renderer);
}
