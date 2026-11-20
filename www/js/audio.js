/* Pocket Angler — synthesized sound effects (no audio files needed) */
(function (G) {
  const PA = (G.PA = G.PA || {});
  const A = (PA.Sound = { ctx: null, master: null, enabled: true, noiseBuf: null, amb: null });

  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    const AC = G.AudioContext || G.webkitAudioContext;
    if (!AC) return;
    A.ctx = new AC();
    A.master = A.ctx.createGain();
    A.master.gain.value = A.enabled ? 0.7 : 0;
    A.master.connect(A.ctx.destination);
    const len = A.ctx.sampleRate * 2;
    A.noiseBuf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
    const d = A.noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    A.startAmbient();
  };

  A.setEnabled = function (on) {
    A.enabled = on;
    if (A.master) A.master.gain.setTargetAtTime(on ? 0.7 : 0, A.ctx.currentTime, 0.05);
  };
  A.suspend = function () { if (A.ctx && A.ctx.state === 'running') A.ctx.suspend(); };
  A.resume = function () { if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume(); };

  function env(g, t0, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
  }
  function tone(freq, type, dur, vol, slideTo, when) {
    if (!A.ctx) return;
    const t0 = A.ctx.currentTime + (when || 0);
    const o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    env(g, t0, 0.008, vol, dur);
    o.connect(g); g.connect(A.master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(dur, vol, filterType, freq, q, when, slideTo) {
    if (!A.ctx) return;
    const t0 = A.ctx.currentTime + (when || 0);
    const s = A.ctx.createBufferSource(); s.buffer = A.noiseBuf;
    const f = A.ctx.createBiquadFilter(); f.type = filterType; f.frequency.setValueAtTime(freq, t0); f.Q.value = q || 1;
    if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    const g = A.ctx.createGain(); env(g, t0, 0.01, vol, dur);
    s.connect(f); f.connect(g); g.connect(A.master);
    s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
  }

  A.startAmbient = function () {
    if (!A.ctx || A.amb) return;
    const s = A.ctx.createBufferSource(); s.buffer = A.noiseBuf; s.loop = true;
    const f = A.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
    const g = A.ctx.createGain(); g.gain.value = 0.05;
    const lfo = A.ctx.createOscillator(), lg = A.ctx.createGain();
    lfo.frequency.value = 0.15; lg.gain.value = 0.025; lfo.connect(lg); lg.connect(g.gain); lfo.start();
    s.connect(f); f.connect(g); g.connect(A.master); s.start();
    A.amb = { s, g };
  };

  A.whoosh = () => noise(0.35, 0.25, 'bandpass', 600, 1.2, 0, 2400);
  A.plop = () => { tone(520, 'sine', 0.12, 0.35, 160); noise(0.18, 0.18, 'lowpass', 1400, 1); };
  A.splash = (big) => { noise(big ? 0.7 : 0.4, big ? 0.55 : 0.35, 'lowpass', 2600, 0.8, 0, 300); tone(200, 'sine', 0.2, 0.15, 80); };
  A.nibble = () => tone(700, 'sine', 0.06, 0.12, 500);
  A.bite = () => { tone(880, 'square', 0.09, 0.18); tone(1175, 'square', 0.14, 0.18, null, 0.09); noise(0.25, 0.3, 'lowpass', 1800, 1); };
  A.tick = () => tone(2400 + Math.random() * 300, 'square', 0.015, 0.035);
  A.warn = () => tone(330, 'sawtooth', 0.12, 0.08, 280);
  A.snap = () => { noise(0.08, 0.5, 'highpass', 3000, 1); tone(180, 'sawtooth', 0.4, 0.2, 60); };
  A.lose = () => { tone(440, 'triangle', 0.18, 0.18, 330); tone(330, 'triangle', 0.3, 0.18, 220, 0.17); };
  A.coin = () => { tone(1320, 'square', 0.06, 0.1); tone(1760, 'square', 0.12, 0.1, null, 0.06); };
  A.click = () => tone(900, 'triangle', 0.04, 0.12);
  A.buy = () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 'triangle', 0.12, 0.16, null, i * 0.06)); };
  A.catch = (rank) => {
    const scales = [[523, 659, 784], [523, 659, 784, 1047], [587, 740, 880, 1175], [523, 659, 784, 1047, 1319], [392, 523, 659, 784, 1047, 1319, 1568]];
    const notes = scales[Math.min(rank, 4)];
    notes.forEach((f, i) => tone(f, rank >= 3 ? 'square' : 'triangle', 0.18, 0.14, null, i * 0.08));
    if (rank >= 4) notes.forEach((f, i) => tone(f * 2, 'sine', 0.3, 0.08, null, 0.6 + i * 0.05));
  };
  A.cricket = () => { for (let i = 0; i < 3; i++) tone(4200, 'sine', 0.03, 0.02, null, i * 0.06); };
  A.bird = () => { tone(2200 + Math.random() * 800, 'sine', 0.08, 0.03, 3200); tone(2600, 'sine', 0.06, 0.025, 1900, 0.1); };
})(typeof window !== 'undefined' ? window : globalThis);
