// Enterprise Audio Feedback Engine using Web Audio API
// Synthesizes pure harmonic soundwaves without external audio files.

(function() {
    let cachedAudioEnabled = true;

    function isAudioEnabled() {
        return cachedAudioEnabled;
    }

    function setAudioEnabled(enabled) {
        cachedAudioEnabled = enabled;
        try {
            localStorage.setItem('madura_audio_enabled', enabled ? 'true' : 'false');
        } catch (e) {}
    }

    try {
        const saved = localStorage.getItem('madura_audio_enabled');
        if (saved !== null) cachedAudioEnabled = (saved === 'true');
    } catch (e) {}

    let audioCtx = null;

    function getAudioContext() {
        if (typeof window === 'undefined') return null;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return null;
            if (!audioCtx) {
                audioCtx = new AudioContextClass();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            return audioCtx;
        } catch (err) {
            return null;
        }
    }

    // Clean pleasant high chime for completed tasks, downloads, additions
    function playSuccessChime() {
        if (!isAudioEnabled()) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // First Tone (G5 - 784 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(784, now);
        gain1.gain.setValueAtTime(0.08, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // Second Harmonious Tone (C6 - 1046.5 Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1046.5, now + 0.08);
        gain2.gain.setValueAtTime(0.09, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.45);
    }

    // Subtle chime for notifications / toasts
    function playNotificationChime() {
        if (!isAudioEnabled()) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    // Warning / Alert Tone
    function playWarningChime() {
        if (!isAudioEnabled()) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(330, now + 0.25);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    window.audioUtils = {
        isAudioEnabled,
        setAudioEnabled,
        playSuccessChime,
        playNotificationChime,
        playWarningChime
    };
})();
