// WebAudio synthesized SFX and a warm pad loop. No audio files, M toggles mute.
export function createAudio() {
  let ctx = null, muted = false, musicTimer = null;
  function ensure() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; } }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function blip(freq, dur, type, gain, slide) {
    if (muted) return; const c = ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), c.currentTime + dur);
    g.gain.setValueAtTime(gain || 0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }
  function noise(dur, gain) {
    if (muted) return; const c = ensure(); if (!c) return;
    const len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const g = c.createGain(); g.gain.value = gain || 0.12;
    src.connect(g).connect(c.destination); src.start();
  }
  function startMusic() {
    if (musicTimer) return;
    const notes = [196, 220, 262, 294];
    let i = 0;
    musicTimer = setInterval(() => { if (!muted) blip(notes[i % notes.length], 1.4, 'triangle', 0.025); i++; }, 900);
  }
  return {
    shoot() { noise(0.12, 0.16); blip(720, 0.08, 'square', 0.05, -500); },
    crash() { noise(0.25, 0.2); },
    pickup() { blip(880, 0.12, 'sine', 0.09); setTimeout(() => blip(1320, 0.14, 'sine', 0.09), 70); },
    sting() { blip(523, 0.18, 'triangle', 0.1); setTimeout(() => blip(784, 0.3, 'triangle', 0.1), 120); },
    siren() { blip(660, 0.3, 'sawtooth', 0.03, 220); },
    engine() { blip(90, 0.2, 'sawtooth', 0.02, 40); },
    toggleMute() { muted = !muted; return muted; },
    isMuted() { return muted; },
    startMusic,
  };
}
