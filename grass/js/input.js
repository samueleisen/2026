/* ───────────────────────────────────────────────
    INPUT SYSTEM
    keys object + keyboard event listeners
─────────────────────────────────────────────── */
const keys = { w: false, a: false, s: false, d: false, space: false };

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
        keys.space = true;
        e.preventDefault(); // Prevent page scroll on spacebar press
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

// Prevent keys sticking when window loses focus
window.addEventListener('blur', () => {
    keys.w = keys.a = keys.s = keys.d = keys.space = false;
});
