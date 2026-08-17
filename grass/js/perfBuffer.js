/* ───────────────────────────────────────────────
    PERFORMANCE BUFFER & MONITORING SYSTEM
    Rolling buffer to sample frame rendering times (ms),
    calculate average FPS, and detect micro-stutter spikes.
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
