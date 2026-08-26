console.log(
    '%c' +
    '  ___                       _       _             \n' +
    ' / __| __ _ _ __  _  _  ___| | ___ (_)___ ___ _ _ \n' +
    ' \\__ \\/ _` | \'  \\| || |/ -_) |/ -_)| (_-</ -_) \' \\\n' +
    ' |___/\\__,_|_|_|_|\\_,_|\\___|_|\\___||_/__/\\___|_||_|\n' +
    '──────────────────────────────────────────────────\n' +
    ' ✨ Open for creative collaborations!\n' +
    ' 🔗 Check out more of my work: https://samueleisen.com\n',
    'color: #e2d700ff; font-family: monospace; font-size: 11px; line-height: 1.3; font-weight: bold;'
);

/* ───────────────────────────────────────────────
    CONSTANTS
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

/* ───────────────────────────────────────────────
    PALETTE
─────────────────────────────────────────────── */
const PAL = {
    bg: 0x1a1a2e,
    floorPosZ: 0xfff04f, // Positive Z Ground Color (Bright Golden Yellow)
    floorNegZ: 0x665105, // Negative Z Ground Color (Dark Yellow-Brown)
    grass: 0xf0c830,     // Golden Yellow Grass
    shadow: 0x0e0e1a,
};

