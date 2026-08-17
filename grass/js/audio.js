/* ───────────────────────────────────────────────
    AUDIO SYSTEM
    Handles ambient wind SFX looping, autoplay browser policy,
    and volume controls.
─────────────────────────────────────────────── */

let windAudio = null;
let isAudioInitialized = false;
let windVolume = 0.05;
let isMuted = false;

function initAudio() {
    if (windAudio) return;

    // Create background audio element
    windAudio = new Audio('WIND-SFX.mp3');
    windAudio.loop = true;
    windAudio.volume = isMuted ? 0 : windVolume;

    // Handle case sensitivity fallback if server fails to load upper/lower case
    windAudio.addEventListener('error', () => {
        if (windAudio.src.includes('WIND-SFX.mp3')) {
            windAudio.src = 'wind-sfx.mp3';
            if (isAudioInitialized && !isMuted) windAudio.play();
        }
    });

    // Browser autoplay policy handler: play on first user interaction
    const startAudio = () => {
        if (!windAudio) return;
        windAudio.play().then(() => {
            isAudioInitialized = true;
            updateAudioUI();
        }).catch(err => {
            console.warn("Audio play deferred until user interaction:", err);
        });

        // Remove setup listeners once attempted
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

// Auto initialize audio on script load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAudio);
} else {
    initAudio();
}
