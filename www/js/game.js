/* Pocket Angler — main game */
(function () {
  'use strict';
  const PA = window.PA, Snd = PA.Sound;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;
  const fmt = (n) => Math.round(n).toLocaleString('en-US');

  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2); this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath();
    };
  }

  const Cap = window.Capacitor;
  const Plugins = (Cap && Cap.Plugins) || {};
  const safe = (p) => { if (p && typeof p.catch === 'function') p.catch(() => {}); };

  const FISH_BY_ID = {}; PA.FISH.forEach((f) => (FISH_BY_ID[f.id] = f));
  const LOC_BY_ID = {}; PA.LOCATIONS.forEach((l) => (LOC_BY_ID[l.id] = l));
  const REC_GEAR = { pond: 0, river: 1, lake: 2, coast: 3, frost: 4 };
  const CHEST_MULT = [1, 2.5, 6, 15, 35];

  // ------------------------------------------------------------------ save
  const KEY = 'pocketAngler.save.v1';
  function defaults() {
    return {
      coins: 0, rod: 0, line: 0, bait: 0, loc: 'pond', unlocked: ['pond'], journal: {},
      stats: { casts: 0, catches: 0, earned: 0, biggest: null, junk: 0, chests: 0, lost: 0 },
      settings: { sound: true, vibe: true }, clock: 7 * 60, welcomed: false,
    };
  }
  function load() {
    const d = defaults();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        return Object.assign(d, s, { stats: Object.assign(d.stats, s.stats || {}), settings: Object.assign(d.settings, s.settings || {}) });
      }
    } catch (e) { /* corrupted save: start fresh */ }
    return d;
  }
  let S = load();
  if (!LOC_BY_ID[S.loc]) S.loc = 'pond';
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  Snd.enabled = S.settings.sound;

  const LOC = () => LOC_BY_ID[S.loc];
  const gear = () => ({ rod: PA.UPGRADES.rod.items[S.rod], line: PA.UPGRADES.line.items[S.line], bait: PA.UPGRADES.bait.items[S.bait] });
  const hour = () => S.clock / 60;
  const isNight = () => hour() >= 19.5 || hour() < 5.5;

  function buzz(kind) {
    if (!S.settings.vibe) return;
    const H = Plugins.Haptics;
    if (H) {
      try {
        if (kind === 'long') safe(H.vibrate({ duration: 250 }));
        else safe(H.impact({ style: kind === 'heavy' ? 'HEAVY' : kind === 'medium' ? 'MEDIUM' : 'LIGHT' }));
        return;
      } catch (e) {}
    }
    if (navigator.vibrate) navigator.vibrate({ light: 10, medium: 25, heavy: 50, long: 250 }[kind] || 20);
  }

  // ------------------------------------------------------------------ canvas
  const cv = $('game'), ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1, WY = 0, dockW = 0, anglerX = 0, anglerY = 0, castMinX = 0, castMaxX = 0, angS = 1, RL = 80;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    WY = Math.round(H * 0.44);
    dockW = Math.max(96, W * 0.27);
    angS = clamp(W / 360, 0.85, 1.25);
    anglerX = dockW * 0.4; anglerY = WY - 16;
    castMinX = dockW + 34; castMaxX = W - 26;
    RL = 74 * angS;
    G.amb.forEach((a) => { a.x = clamp(a.x, 0, W); a.y = rand(WY + 40, H - 120); });
  }

  // ------------------------------------------------------------------ state
  const G = {
    state: 'idle', t: 0, stateT: 0, power: 0, powerDir: 1, castP: 0, rodA: -0.95,
    bob: { x: 0, y: 0, sx: 0, sy: 0, tx: 0, vis: true, dip: 0, arcH: 80 },
    biteAt: 0, nibbles: [], nibbleCount: 0, hookWin: 1,
    catch: null, fight: null, P: null, fishX: 0, fishY: 0, fishDir: -1, baseDepth: 0,
    land: null, parts: [], floaters: [], amb: [], tickAcc: 0, prevWarn: false, ambT: 4, saveT: 0, splashT: 0,
    pointer: null, holding: false, cardOpen: false, panel: null, journalTab: null, journalSel: null, resetArm: 0,
  };
  for (let i = 0; i < 5; i++) G.amb.push({ x: rand(0, 400), y: 0, vx: rand(8, 22) * (Math.random() < 0.5 ? -1 : 1), s: rand(14, 30), ph: rand(0, 6) });

  const surfaceY = (x) => WY + Math.sin(x * 0.035 + G.t * 1.6) * 1.6 + Math.sin(x * 0.013 - G.t * 0.9) * 1.2;
  const fishPx = (w) => 16 + 22 * Math.log10(1 + w * 4);

  function handPos() { return { x: anglerX + 13 * angS, y: anglerY - 31 * angS }; }
  function tipPos() {
    const h = handPos();
    let x = h.x + Math.cos(G.rodA) * RL, y = h.y + Math.sin(G.rodA) * RL;
    if (G.state === 'fight' && G.fight) { const T = Math.min(1.1, G.fight.T); x += T * 10; y += T * 18; }
    return { x, y };
  }

  // ------------------------------------------------------------------ UI helpers
  const hintEl = $('hint'), menuEl = $('menu'), powerEl = $('power'), fightEl = $('fightui');
  let toastTimer = 0;
  function toast(msg, ms) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms || 1700);
  }
  function setHint(txt, pulse) { hintEl.textContent = txt || ''; hintEl.style.opacity = txt ? 1 : 0; hintEl.classList.toggle('pulse', !!pulse); }

  function setState(s) {
    G.state = s; G.stateT = 0;
    menuEl.classList.toggle('off', s !== 'idle');
    powerEl.classList.toggle('hidden', s !== 'charging');
    fightEl.classList.toggle('hidden', s !== 'fight');
    if (s === 'idle') setHint(S.stats.casts === 0 ? 'Hold anywhere to charge your cast' : 'Hold anywhere to cast', true);
    else if (s === 'charging') setHint('Release to cast!');
    else if (s === 'waiting') setHint(G.nibbleCount ? 'Wait for the real bite…' : 'Waiting for a bite…', false);
    else if (s === 'bite') setHint('TAP NOW!', false);
    else setHint('');
  }

  function updateHud() {
    $('coins').textContent = fmt(S.coins);
    $('locName').textContent = LOC().name;
    const g = gear();
    $('gearline').innerHTML = `<span>${g.rod.name}</span><span>${g.line.name}</span><span>${g.bait.name}</span>`;
  }
  let lastClockTxt = '';
  function updateClock() {
    const h = Math.floor(hour()), m = Math.floor(S.clock % 60);
    const txt = `${h}:${String(m - (m % 5)).padStart(2, '0')}`;
    if (txt !== lastClockTxt) {
      lastClockTxt = txt; $('clock').textContent = txt;
      $('clockIco').className = isNight() ? 'moon' : 'sun';
    }
  }

  // ------------------------------------------------------------------ catching
  function pickCatch(p) {
    const g = gear(), luck = g.bait.luck, night = isNight(), loc = LOC();
    const r = Math.random();
    const chestChance = 0.012 + luck * 0.004;
    const junkChance = Math.max(0.03, 0.08 - luck * 0.02);
    if (r < chestChance) {
      const value = Math.round(rand(40, 150) * CHEST_MULT[loc.tier - 1]);
      return { kind: 'chest', name: 'Treasure Chest', value, fight: { str: 0.7, spd: 1.0, end: 0.8, agi: 0.1 }, size: 34 };
    }
    if (r < chestChance + junkChance) {
      const js = PA.JUNK, jw = js.map((j) => (j.id === 'duck' ? 1 : 4));
      let k = Math.random() * jw.reduce((a, b) => a + b, 0), j = js[0];
      for (let i = 0; i < js.length; i++) { k -= jw[i]; if (k <= 0) { j = js[i]; break; } }
      return { kind: 'junk', junk: j, name: j.name, value: j.value, fight: { str: 0.35, spd: 0.6, end: 0.5, agi: 0 }, size: 26 };
    }
    const pool = PA.FISH.filter((f) => f.loc === loc.id && (f.time === 'any' || (f.time === 'night') === night));
    const ws = pool.map((f) => {
      const R = PA.RARITY[f.rarity];
      return R.w * (1 + R.luck * luck) * Math.max(0.12, 1 - 1.1 * Math.abs(f.depth - p));
    });
    let k = Math.random() * ws.reduce((a, b) => a + b, 0), fish = pool[0];
    for (let i = 0; i < pool.length; i++) { k -= ws[i]; if (k <= 0) { fish = pool[i]; break; } }
    const wf = Math.random() < 0.04 ? 0.85 + Math.random() * 0.15 : Math.pow(Math.random(), 1.8);
    const weight = fish.w[0] + wf * (fish.w[1] - fish.w[0]);
    const value = Math.max(1, Math.round(fish.price * (0.7 + 0.8 * wf)));
    return { kind: 'fish', fish, name: fish.name, weight, value, wf, fight: { str: fish.str * (0.8 + 0.45 * wf), spd: fish.spd, end: fish.end, agi: fish.agi }, size: fishPx(weight) };
  }

  function startCharge() { G.power = 0; G.powerDir = 1; setState('charging'); }
  function releaseCast() {
    G.castP = G.power;
    const tip = tipPos();
    G.bob.sx = tip.x; G.bob.sy = tip.y; G.bob.tx = lerp(castMinX, castMaxX, G.castP); G.bob.arcH = 70 + G.castP * 90;
    G.rodA = -0.35;
    S.stats.casts++;
    Snd.whoosh(); buzz('light');
    setState('casting');
  }
  function landBobber() {
    const b = G.bob; b.x = b.tx; b.y = surfaceY(b.x);
    Snd.plop();
    ring(b.x, 6, 26, 0.9); ring(b.x, 3, 16, 0.6);
    drops(b.x, WY, 6, 1.2);
    const g = gear();
    const base = rand(2.6, 7.5) * g.bait.bite * (G.castP > 0.75 ? 1.12 : 1);
    G.biteAt = base;
    G.nibbles = []; G.nibbleCount = 0;
    const n = Math.floor(rand(0, 3.4));
    for (let i = 0; i < n; i++) { const tt = rand(0.8, base - 0.7); if (tt > 0.6) G.nibbles.push({ t: tt, done: false }); }
    setState('waiting');
  }
  function bite() {
    G.catch = pickCatch(G.castP);
    G.hookWin = gear().rod.hook;
    Snd.bite(); buzz('long');
    ring(G.bob.x, 8, 40, 1); drops(G.bob.x, WY, 10, 1.8);
    setState('bite');
  }
  function hook() {
    const c = G.catch;
    const startDist = 8 + G.castP * 22;
    G.fight = PA.newFight(c.fight, startDist, Math.random);
    const g = gear();
    G.P = { reel: g.rod.reel, lineStr: g.line.str, lineLen: g.line.len };
    G.baseDepth = 40 + (c.kind === 'fish' ? c.fish.depth : 0.3) * (H - WY - 260);
    G.fishX = G.bob.x; G.fishY = WY + 20; G.prevWarn = false; G.tickAcc = 0;
    G.bob.vis = false;
    Snd.splash(false); buzz('heavy');
    drops(G.bob.x, WY, 12, 2);
    setState('fight');
  }
  function retrieve(msg) {
    if (msg) toast(msg);
    G.bob.vis = true; G.bob.sx = G.bob.x; G.bob.sy = G.bob.y;
    setState('retrieve');
  }
  function fightOver(result) {
    const c = G.catch;
    if (result === 'caught') {
      G.land = { x0: G.fishX, y0: WY, x1: anglerX + 26 * angS, y1: anglerY - 70 * angS };
      Snd.splash(true); buzz('medium');
      drops(G.fishX, WY, 18, 2.6); ring(G.fishX, 8, 44, 1);
      setState('landing');
      return;
    }
    S.stats.lost++;
    G.bob.x = G.fishX; G.bob.y = WY; G.bob.vis = false;
    if (result === 'snap') { Snd.snap(); buzz('heavy'); toast(c.kind === 'fish' ? 'Snap! The line broke.' : 'Snap! Line broke.'); }
    else { Snd.lose(); buzz('medium'); toast('It got away — ran out of line!'); }
    drops(G.fishX, WY, 10, 1.6);
    G.fight = null;
    setTimeout(() => { if (G.state === 'lost') { G.bob.vis = true; setState('idle'); } }, 900);
    setState('lost');
    save();
  }

  // ------------------------------------------------------------------ catch card
  const cardEl = $('card'), cardCv = $('cardFish'), cardCtx = cardCv.getContext('2d');
  function showCard() {
    const c = G.catch;
    let isNew = false, isRecord = false;
    if (c.kind === 'fish') {
      const id = c.fish.id, prev = S.journal[id];
      isNew = !prev;
      isRecord = !!prev && c.weight > prev.best;
      S.journal[id] = { n: (prev ? prev.n : 0) + 1, best: Math.max(prev ? prev.best : 0, c.weight) };
      S.stats.catches++;
      if (!S.stats.biggest || c.weight > S.stats.biggest.w) S.stats.biggest = { id, w: c.weight };
    } else if (c.kind === 'junk') S.stats.junk++;
    else S.stats.chests++;
    S.coins += c.value; S.stats.earned += c.value;
    save();

    const rk = c.kind === 'fish' ? PA.RARITY[c.fish.rarity] : null;
    const card = cardEl.querySelector('.catch-card');
    card.className = 'catch-card' + (rk && rk.idx >= 3 ? ' ' + c.fish.rarity : '');
    $('cardBadges').innerHTML = (isNew ? '<span class="badge new">NEW!</span>' : '') + (isRecord ? '<span class="badge record">RECORD!</span>' : '');
    $('cardName').textContent = c.name;
    const tag = $('cardRarity');
    if (rk) { tag.textContent = rk.name; tag.style.background = rk.color; tag.style.display = ''; }
    else { tag.textContent = c.kind === 'chest' ? 'Treasure' : 'Junk'; tag.style.background = c.kind === 'chest' ? '#c98a0b' : '#8a8f96'; }
    $('cardWeight').textContent = c.kind === 'fish' ? fmtW(c.weight) : '—';
    $('cardValue').innerHTML = `<span class="price"><span class="coin-ico"></span>${fmt(c.value)}</span>`;
    $('cardDesc').textContent = c.kind === 'fish' ? c.fish.desc : c.kind === 'chest' ? 'Somebody lost their savings. Finders keepers!' : c.junk.id === 'duck' ? 'Squeak. A collector might pay for this.' : 'Not quite what you were hoping for.';
    $('cardBtn').textContent = 'Collect';
    G.cardOpen = true;
    cardEl.classList.remove('hidden');
    Snd.catch(rk ? rk.idx : c.kind === 'chest' ? 2 : 0);
    if (rk && rk.idx >= 3) confetti(rk.idx === 4 ? 90 : 45);
    setState('card');
  }
  function fmtW(w) { return w < 1 ? `${Math.round(w * 1000)} g` : `${w < 10 ? w.toFixed(2) : w < 100 ? w.toFixed(1) : Math.round(w)} kg`; }
  function drawCardFish() {
    const c = G.catch; if (!c) return;
    const cw = cardCv.width, ch = cardCv.height;
    cardCtx.setTransform(1, 0, 0, 1, 0, 0); cardCtx.clearRect(0, 0, cw, ch);
    cardCtx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 6; i++) { const bx = (i * 97 + G.t * 20) % cw, by = ch - ((G.t * 30 + i * 53) % ch); cardCtx.beginPath(); cardCtx.arc(bx, by, 4 + (i % 3) * 2, 0, TAU); cardCtx.fill(); }
    if (c.kind === 'fish') {
      const ex = c.fish.look.extra || [];
      const L = ex.includes('bill') ? 330 : ex.includes('paddle') ? 350 : c.fish.look.shape === 'round' ? 300 : 400;
      PA.drawFish(cardCtx, c.fish, cw / 2 - (ex.includes('bill') ? 50 : 10), ch / 2 + Math.sin(G.t * 2) * 4, L, 1, G.t, { swim: 0.5 });
    } else PA.drawJunk(cardCtx, c.kind === 'chest' ? 'chest' : c.junk.emoji, cw / 2, ch / 2 + 10, 200, G.t);
  }
  function collect() {
    if (!G.cardOpen) return;
    G.cardOpen = false; cardEl.classList.add('hidden');
    Snd.coin();
    floater(`+${fmt(G.catch.value)}`, anglerX + 30, anglerY - 90, '#ffd84d');
    updateHud();
    G.catch = null; G.fight = null; G.bob.vis = true;
    setState('idle');
  }
  $('cardBtn').addEventListener('click', () => { Snd.click(); collect(); });

  // ------------------------------------------------------------------ particles
  function ring(x, r0, r1, a) { G.parts.push({ type: 'ring', x, y: WY, r: r0, r1, life: 0, max: 0.9, a }); }
  function drops(x, y, n, pow) {
    for (let i = 0; i < n; i++) G.parts.push({ type: 'drop', x: x + rand(-6, 6), y, vx: rand(-60, 60) * pow * 0.6, vy: -rand(60, 150) * pow * 0.7, life: 0, max: 1.2, s: rand(1.5, 3.2) });
  }
  function bubbles(x, y, n) { for (let i = 0; i < n; i++) G.parts.push({ type: 'bubble', x: x + rand(-8, 8), y, vx: rand(-6, 6), vy: -rand(25, 55), life: 0, max: 2, s: rand(1.5, 3.5) }); }
  function confetti(n) {
    const cols = ['#ffb627', '#e5484d', '#3d9be9', '#5cc46b', '#b05ce6', '#ffffff'];
    for (let i = 0; i < n; i++) G.parts.push({ type: 'conf', x: rand(0, W), y: rand(-60, -10), vx: rand(-30, 30), vy: rand(60, 160), life: 0, max: 4, s: rand(4, 8), c: cols[i % cols.length], rot: rand(0, 6), vr: rand(-8, 8) });
  }
  function floater(text, x, y, color) { G.floaters.push({ text, x, y, life: 0, max: 1.4, color }); }

  // ------------------------------------------------------------------ input
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    Snd.init();
    if (G.pointer !== null) return;
    G.pointer = e.pointerId; G.holding = true;
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    onPress();
  });
  const up = (e) => {
    if (e.pointerId !== G.pointer) return;
    G.pointer = null; G.holding = false;
    onRelease();
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  cv.addEventListener('contextmenu', (e) => e.preventDefault());

  function onPress() {
    if (G.panel || G.cardOpen) return;
    switch (G.state) {
      case 'idle': startCharge(); break;
      case 'waiting':
        Snd.click();
        retrieve(G.nibbleCount ? 'Too early! Wait for the big splash.' : 'Reeled in.');
        break;
      case 'bite': hook(); break;
      case 'card': collect(); break;
    }
  }
  function onRelease() { if (G.state === 'charging') releaseCast(); }

  // ------------------------------------------------------------------ update
  function update(dt) {
    G.t += dt; G.stateT += dt;
    S.clock = (S.clock + dt * 4) % 1440;
    updateClock();
    G.saveT += dt; if (G.saveT > 10) { G.saveT = 0; save(); }

    let target = -0.95;
    const b = G.bob;
    switch (G.state) {
      case 'idle': {
        const tip = tipPos();
        b.x = tip.x + Math.sin(G.t * 1.7) * 2; b.y = tip.y + 18;
        break;
      }
      case 'charging': {
        G.power += G.powerDir * dt * 0.85;
        if (G.power >= 1) { G.power = 1; G.powerDir = -1; }
        if (G.power <= 0) { G.power = 0; G.powerDir = 1; }
        $('powerFill').style.width = (G.power * 100).toFixed(1) + '%';
        target = -0.95 - G.power * 1.25;
        const tip = tipPos(); b.x = tip.x; b.y = tip.y + 14;
        break;
      }
      case 'casting': {
        target = -0.45;
        const u = clamp(G.stateT / 0.62, 0, 1);
        const e = 1 - Math.pow(1 - u, 1.6);
        b.x = lerp(b.sx, b.tx, e);
        b.y = lerp(b.sy, WY, u) - G.bob.arcH * 4 * u * (1 - u);
        if (u >= 1) landBobber();
        break;
      }
      case 'waiting': {
        target = -0.85;
        b.dip = Math.max(0, b.dip - dt * 4);
        b.y = surfaceY(b.x) + 1 + Math.sin(G.t * 2.2) * 1.2 + b.dip * 6;
        for (const n of G.nibbles) if (!n.done && G.stateT >= n.t) {
          n.done = true; G.nibbleCount++; b.dip = 1; Snd.nibble(); buzz('light'); ring(b.x, 3, 14, 0.5);
          setHint('Wait for the real bite…');
        }
        if (G.stateT >= G.biteAt) bite();
        break;
      }
      case 'bite': {
        target = -0.8;
        b.y = surfaceY(b.x) + 8 + Math.sin(G.t * 40) * 1.5;
        if (Math.random() < dt * 8) drops(b.x, WY, 2, 0.8);
        if (G.stateT > G.hookWin) { Snd.lose(); retrieve('Too slow — it stole the bait!'); }
        break;
      }
      case 'fight': updateFight(dt); target = -0.75 - Math.min(1, G.fight ? G.fight.T : 0) * 0.45; break;
      case 'landing': {
        target = -1.25;
        if (G.stateT > 0.85) showCard();
        break;
      }
      case 'card': target = -1.1; break;
      case 'retrieve': {
        const tip = tipPos(); const u = clamp(G.stateT / 0.35, 0, 1);
        b.x = lerp(b.sx, tip.x, u); b.y = lerp(b.sy, tip.y + 18, u) - 30 * Math.sin(u * Math.PI);
        if (u >= 1) setState('idle');
        break;
      }
    }
    G.rodA += (target - G.rodA) * Math.min(1, dt * (G.state === 'casting' ? 22 : 10));

    // particles
    for (const p of G.parts) {
      p.life += dt;
      if (p.type === 'drop') { p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.y > WY + 4 && p.vy > 0) p.life = p.max; }
      else if (p.type === 'ring') p.r = lerp(p.r, p.r1, Math.min(1, dt * 3));
      else if (p.type === 'bubble') { p.x += (p.vx + Math.sin(p.life * 6) * 10) * dt; p.y += p.vy * dt; if (p.y < WY + 2) p.life = p.max; }
      else if (p.type === 'conf') { p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.vx += Math.sin(p.life * 3 + p.s) * 20 * dt; }
    }
    G.parts = G.parts.filter((p) => p.life < p.max);
    for (const f of G.floaters) { f.life += dt; f.y -= 34 * dt; }
    G.floaters = G.floaters.filter((f) => f.life < f.max);

    for (const a of G.amb) {
      a.x += a.vx * dt;
      if (a.x < -40) { a.vx = Math.abs(a.vx); } else if (a.x > W + 40) { a.vx = -Math.abs(a.vx); }
      if (Math.random() < dt * 0.1) a.vx *= -1;
    }

    G.ambT -= dt;
    if (G.ambT <= 0) { G.ambT = rand(5, 12); if (Snd.ctx) (isNight() ? Snd.cricket : Snd.bird)(); }
    if (G.cardOpen) drawCardFish();
  }

  function updateFight(dt) {
    const f = G.fight; if (!f) return;
    const res = PA.stepFight(f, G.holding, dt, G.P, Math.random);
    const warnNow = f.warn > 0 || f.burst > 0;
    if (f.warn > 0 && !G.prevWarn) { Snd.warn(); buzz('light'); }
    G.prevWarn = f.warn > 0;

    const xNear = dockW + 8, xStart = G.bob.tx, frac = f.dist / f.startDist;
    const x = clamp(xNear + (xStart - xNear) * frac, xNear, W - 20);
    const wob = Math.sin(G.t * (f.burst > 0 ? 11 : 2.6)) * (f.burst > 0 ? 16 : 6);
    const yT = WY + 18 + G.baseDepth * clamp(frac, 0.12, 1.15) + Math.sin(G.t * 1.7) * 6;
    G.fishX += (x + wob - G.fishX) * Math.min(1, dt * 7);
    G.fishY += (yT - G.fishY) * Math.min(1, dt * 3);
    G.fishDir = f.burst > 0 || !G.holding ? 1 : -1;
    if (f.burst > 0) { G.splashT -= dt; if (G.splashT <= 0) { G.splashT = 0.14; drops(G.fishX, WY, 3, 1); ring(G.fishX, 4, 18, 0.5); } }
    if (Math.random() < dt * 3) bubbles(G.fishX, G.fishY, 1);

    if (G.holding) { G.tickAcc += dt * G.P.reel * 2.2; if (G.tickAcc > 1) { G.tickAcc = 0; Snd.tick(); } }

    const T = f.T;
    const tf = $('tensionFill');
    tf.style.width = (clamp(T, 0.03, 1) * 100).toFixed(1) + '%';
    tf.style.backgroundColor = T < 0.6 ? '#3fbf6f' : T < 0.85 ? '#f5b83d' : '#e5484d';
    $('tensionFill').parentElement.classList.toggle('flash', T >= 0.98);
    $('stamFill').style.width = (f.stam * 100).toFixed(1) + '%';
    $('distTxt').textContent = Math.max(0, f.dist).toFixed(1) + ' m';
    const fh = $('fightHint');
    if (warnNow) { fh.textContent = "It's pulling — ease off!"; fh.classList.add('warn'); }
    else if (T >= 0.9) { fh.textContent = 'Too tight! Let go!'; fh.classList.add('warn'); }
    else if (f.dist > G.P.lineLen * 0.8) { fh.textContent = 'Running out of line — reel!'; fh.classList.add('warn'); }
    else { fh.textContent = 'Hold to reel · let go when it pulls!'; fh.classList.remove('warn'); }

    if (res) fightOver(res);
  }

  // ------------------------------------------------------------------ render
  function computeEnv() {
    const h = hour(), loc = LOC();
    let day;
    if (h < 5 || h >= 20.5) day = 0; else if (h < 7) day = (h - 5) / 2; else if (h < 18.5) day = 1; else day = 1 - (h - 18.5) / 2;
    const night = 1 - day;
    let dusk = 0;
    if (h >= 5 && h < 7.6) dusk = 1 - Math.abs(h - 6.3) / 1.3; else if (h >= 17.2 && h < 20.6) dusk = 1 - Math.abs(h - 19) / 1.6;
    dusk = clamp(dusk, 0, 1);
    let top = PA.mix(loc.sky[0], '#0b1630', night), bot = PA.mix(loc.sky[1], '#2a3a66', night);
    top = PA.mix(top, '#7a6bb0', dusk * 0.55); bot = PA.mix(bot, '#ffb38a', dusk * 0.75);
    return { night, dusk, day, skyTop: top, skyBot: bot, sunArc: clamp((h - 5.5) / 14.5, 0, 1), moonArc: clamp(((h + 24 - 19) % 24) / 11.5, 0, 1) };
  }

  function drawWater(env) {
    const loc = LOC();
    const g = ctx.createLinearGradient(0, WY, 0, H);
    g.addColorStop(0, loc.water[0]); g.addColorStop(1, loc.water[1]);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, surfaceY(0));
    for (let x = 0; x <= W + 8; x += 8) ctx.lineTo(x, surfaceY(x));
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

    // light rays
    if (env.day > 0.1) {
      ctx.save(); ctx.globalAlpha = 0.06 * env.day; ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) {
        const x0 = ((i * 113 + G.t * 6) % (W + 120)) - 60;
        ctx.beginPath(); ctx.moveTo(x0, WY); ctx.lineTo(x0 + 26, WY); ctx.lineTo(x0 + 80, H * 0.85); ctx.lineTo(x0 + 30, H * 0.85); ctx.fill();
      }
      ctx.restore();
    }
    // surface highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); for (let x = 0; x <= W; x += 8) { const y = surfaceY(x); if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
    // sparkles / streaks
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1.5;
    const flow = loc.id === 'river' ? 34 : 6;
    for (let i = 0; i < 14; i++) {
      const y = WY + 10 + (i * 37) % (H * 0.3), len = 10 + (i % 4) * 8;
      const x = (((i * 89 - G.t * flow * (1 + (i % 3) * 0.3)) % (W + 60)) + W + 60) % (W + 60) - 30;
      ctx.globalAlpha = 0.3 + 0.3 * Math.sin(G.t * 1.5 + i); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // lake bed
    const bedY = H - 34;
    ctx.fillStyle = PA.mix(loc.water[1], '#000000', 0.25);
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W + 10; x += 10) ctx.lineTo(x, bedY + Math.sin(x * 0.05) * 6 + Math.sin(x * 0.017) * 8);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    const weed = loc.id === 'frost' ? '#6d8aa3' : loc.id === 'coast' ? '#c0607a' : '#2f6b45';
    ctx.strokeStyle = weed; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const x = (i * 71 + 23) % W, hh = 30 + (i % 4) * 14;
      ctx.beginPath(); ctx.moveTo(x, bedY + 6);
      ctx.quadraticCurveTo(x + Math.sin(G.t + i) * 10, bedY - hh * 0.5, x + Math.sin(G.t * 0.8 + i) * 14, bedY - hh); ctx.stroke();
    }
  }

  function drawUnderwater(env) {
    // ambient fish silhouettes
    ctx.save(); ctx.globalAlpha = 0.22 + 0.1 * env.day;
    for (const a of G.amb) {
      ctx.fillStyle = '#082130';
      ctx.save(); ctx.translate(a.x, a.y + Math.sin(G.t + a.ph) * 4); ctx.scale(a.vx > 0 ? 1 : -1, 1);
      ctx.beginPath(); ctx.ellipse(0, 0, a.s, a.s * 0.32, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-a.s * 0.85, 0); ctx.lineTo(-a.s * 1.35, -a.s * 0.3 + Math.sin(G.t * 8 + a.ph) * 2); ctx.lineTo(-a.s * 1.35, a.s * 0.3 + Math.sin(G.t * 8 + a.ph) * 2); ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // hooked fish (silhouette until landed)
    if (G.state === 'fight' && G.catch) {
      const c = G.catch;
      ctx.save(); ctx.globalAlpha = 0.6;
      if (c.kind === 'fish') PA.drawFish(ctx, c.fish, G.fishX, G.fishY, c.size * 1.25, G.fishDir, G.t * (G.fight.burst > 0 ? 1.8 : 1), { silhouette: '#071c28', swim: 1.4 });
      else { ctx.fillStyle = '#071c28'; ctx.beginPath(); ctx.ellipse(G.fishX, G.fishY, c.size * 0.6, c.size * 0.4, 0, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    // particles under water
    for (const p of G.parts) if (p.type === 'bubble') {
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.stroke();
    }
  }

  function drawSurface() {
    const loc = LOC();
    if (loc.id === 'pond') {
      for (const [fx, s] of [[0.56, 1], [0.74, 0.8], [0.95, 1.1]]) {
        const x = W * fx, y = surfaceY(x) + 1;
        ctx.fillStyle = '#3f8f4c'; ctx.beginPath(); ctx.ellipse(x, y, 15 * s, 4.5 * s, 0, 0.25, TAU - 0.25); ctx.lineTo(x, y); ctx.fill();
        if (s > 0.9) { ctx.fillStyle = '#f7a8c4'; ctx.beginPath(); ctx.arc(x + 3, y - 3, 3.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffe680'; ctx.beginPath(); ctx.arc(x + 3, y - 3, 1.2, 0, TAU); ctx.fill(); }
      }
    }
    if (loc.id === 'river') {
      ctx.fillStyle = '#8c949c';
      for (const [fx, r] of [[0.62, 9], [0.86, 12]]) { const x = W * fx; ctx.beginPath(); ctx.ellipse(x, WY + 2, r * 1.6, r * 0.7, 0, Math.PI, TAU); ctx.fill(); }
    }
    for (const p of G.parts) if (p.type === 'ring') {
      const a = (1 - p.life / p.max) * p.a;
      ctx.strokeStyle = `rgba(255,255,255,${a * 0.8})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 1, p.r, p.r * 0.28, 0, 0, TAU); ctx.stroke();
    }
    // aim marker while charging
    if (G.state === 'charging') {
      const x = lerp(castMinX, castMaxX, G.power);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, WY + 2, 16, 5, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    }
  }

  function drawAnglerAndRod() {
    PA.drawAngler(ctx, anglerX, anglerY, angS, null, G.t);
    const h = handPos(), tip = tipPos();
    const sh = { x: anglerX + 4 * angS, y: anglerY - 40 * angS };
    ctx.strokeStyle = '#e8734a'; ctx.lineWidth = 5 * angS; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(h.x, h.y); ctx.stroke();
    const dx = Math.cos(G.rodA), dy = Math.sin(G.rodA);
    const butt = { x: h.x - dx * 12 * angS, y: h.y - dy * 12 * angS };
    const ctrl = { x: h.x + dx * RL * 0.6, y: h.y + dy * RL * 0.6 };
    ctx.strokeStyle = '#3b2a1c'; ctx.lineWidth = 4.5 * angS;
    ctx.beginPath(); ctx.moveTo(butt.x, butt.y); ctx.lineTo(h.x + dx * 8, h.y + dy * 8); ctx.stroke();
    ctx.strokeStyle = ['#8b6a43', '#c9a45c', '#5b8fb0', '#2b2b2b', '#c43c3c', '#d4a017'][S.rod]; ctx.lineWidth = 2.6 * angS;
    ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.quadraticCurveTo(ctrl.x, ctrl.y, tip.x, tip.y); ctx.stroke();
    ctx.fillStyle = '#9aa3a8'; ctx.beginPath(); ctx.arc(h.x + dx * 4, h.y + dy * 4 + 3, 3 * angS, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f2c79a'; ctx.beginPath(); ctx.arc(h.x, h.y, 3.4 * angS, 0, TAU); ctx.fill();
  }

  function drawLineAndBobber(env) {
    const tip = tipPos(), b = G.bob;
    ctx.strokeStyle = env.night > 0.5 ? 'rgba(230,240,255,0.7)' : 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.2;
    if (G.state === 'fight' && G.fight) {
      const T = Math.min(1, G.fight.T), sag = (1 - T) * 40;
      const ax = G.fishX - G.fishDir * 2, ay = G.fishY;
      ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.quadraticCurveTo((tip.x + ax) / 2, Math.max(tip.y, WY) + sag, ax, ay); ctx.stroke();
    } else if (G.state === 'landing' && G.land) {
      const p = landPos(); ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    } else if (b.vis) {
      const sag = G.state === 'casting' ? 6 : G.state === 'idle' || G.state === 'charging' ? 0 : 22;
      ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.quadraticCurveTo((tip.x + b.x) / 2, Math.max(tip.y, b.y) + sag, b.x, b.y - 6); ctx.stroke();
    }
    if (!b.vis || G.state === 'fight' || G.state === 'landing') return;
    const inWater = G.state === 'waiting' || G.state === 'bite';
    const drawB = () => {
      ctx.save(); ctx.translate(b.x, b.y);
      ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, -5); ctx.stroke();
      ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(0, 0, 6, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.stroke();
      ctx.restore();
    };
    if (!inWater) { drawB(); return; }
    const sy = surfaceY(b.x) + 1;
    ctx.save(); ctx.beginPath(); ctx.rect(b.x - 12, 0, 24, sy); ctx.clip(); drawB(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(b.x - 12, sy, 24, 40); ctx.clip(); ctx.globalAlpha = 0.35; drawB(); ctx.restore();
    if (env.night > 0.3) {
      const g = ctx.createRadialGradient(b.x, sy - 4, 1, b.x, sy - 4, 16); g.addColorStop(0, `rgba(255,120,110,${0.35 * env.night})`); g.addColorStop(1, 'rgba(255,120,110,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, sy - 4, 16, 0, TAU); ctx.fill();
    }
  }

  function landPos() {
    const L = G.land, u = clamp(G.stateT / 0.8, 0, 1), e = 1 - Math.pow(1 - u, 2);
    return { x: lerp(L.x0, L.x1, e), y: lerp(L.y0, L.y1, u) - 120 * Math.sin(u * Math.PI), u };
  }

  function drawMarks() {
    if (G.state === 'bite') {
      const b = G.bob, y = WY - 38 - Math.abs(Math.sin(G.t * 12)) * 8, s = 1 + 0.1 * Math.sin(G.t * 20);
      ctx.save(); ctx.translate(b.x, y); ctx.scale(s, s);
      ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.font = '900 22px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', 0, 1);
      ctx.restore();
    }
    if (G.state === 'fight' && G.fight && (G.fight.warn > 0 || G.fight.burst > 0)) {
      const x = clamp(G.fishX, 20, W - 20), y = WY - 26 - Math.abs(Math.sin(G.t * 10)) * 5;
      ctx.fillStyle = G.fight.burst > 0 ? '#e5484d' : '#ff9f1a'; ctx.beginPath(); ctx.arc(x, y, 12, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.font = '900 17px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', x, y + 1);
    }
    if (G.state === 'landing' && G.catch) {
      const p = landPos(), c = G.catch;
      if (c.kind === 'fish') PA.drawFish(ctx, c.fish, p.x, p.y, Math.max(34, c.size * 1.3), -1, G.t * 2, { rot: Math.sin(p.u * 12) * 0.4, swim: 2 });
      else PA.drawJunk(ctx, c.kind === 'chest' ? 'chest' : c.junk.emoji, p.x, p.y, 40, G.t * 3);
    }
  }

  function render() {
    const env = computeEnv(), loc = LOC();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    PA.drawBackdrop(ctx, loc, W, H, WY, G.t, env);
    drawWater(env);
    drawUnderwater(env);
    drawSurface();
    PA.drawDock(ctx, loc, W, WY, dockW, G.t);
    drawAnglerAndRod();
    for (const p of G.parts) if (p.type === 'drop') { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.fill(); }

    if (env.night > 0.01) { ctx.fillStyle = `rgba(8,14,40,${0.5 * env.night})`; ctx.fillRect(0, 0, W, H); }
    if (env.dusk > 0.01) { ctx.fillStyle = `rgba(255,120,60,${0.1 * env.dusk})`; ctx.fillRect(0, 0, W, H); }

    PA.drawLantern(ctx, dockW - 12, WY - 16, env.night, G.t);
    drawLineAndBobber(env);
    drawMarks();
    for (const p of G.parts) if (p.type === 'conf') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.globalAlpha = 1 - p.life / p.max; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
    }
    for (const f of G.floaters) {
      ctx.globalAlpha = 1 - f.life / f.max; ctx.font = '900 22px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.strokeText(f.text, f.x, f.y); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  }

  // ------------------------------------------------------------------ panels
  const panelEl = $('panel'), bodyEl = $('panelBody');
  function openPanel(name) {
    if (G.state !== 'idle' && name !== 'welcome') return;
    G.panel = name; G.resetArm = 0;
    $('panelTitle').textContent = { shop: 'Tackle Shop', map: 'Travel', journal: 'Fish Journal', settings: 'Settings', welcome: 'Welcome, angler!' }[name];
    renderPanel();
    panelEl.classList.remove('hidden');
    bodyEl.scrollTop = 0;
  }
  function closePanel() {
    if (!G.panel) return;
    if (G.panel === 'welcome') { S.welcomed = true; save(); }
    G.panel = null; panelEl.classList.add('hidden');
  }
  function renderPanel() {
    const n = G.panel;
    if (n === 'shop') renderShop(); else if (n === 'map') renderMap(); else if (n === 'journal') renderJournal(); else if (n === 'settings') renderSettings(); else if (n === 'welcome') renderWelcome();
  }
  const priceHtml = (n) => `<span class="price"><span class="coin-ico"></span>${fmt(n)}</span>`;
  function statLine(key, it) {
    if (key === 'rod') return `Reel ${it.reel.toFixed(1)} m/s · hook window ${it.hook.toFixed(2)}s`;
    if (key === 'line') return `Strength ${it.str.toFixed(1)} · ${it.len} m of line`;
    return it.luck ? `Bites ${Math.round((1 - it.bite) * 100)}% faster · luck +${it.luck}` : 'No bonus';
  }
  function renderShop() {
    let h = `<div class="wallet"><span class="coin-ico"></span>${fmt(S.coins)} coins</div>`;
    for (const key of ['rod', 'line', 'bait']) {
      const U = PA.UPGRADES[key], lvl = S[key], cur = U.items[lvl], nxt = U.items[lvl + 1];
      h += `<div class="upg"><div class="upg-top"><h3>${cur.name}</h3><span class="lvl">${U.label} · ${lvl}/${U.items.length - 1}</span></div>`;
      h += `<div class="pips">${U.items.slice(1).map((_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</div>`;
      h += `<div class="row"><div class="next">${statLine(key, cur)}`;
      h += nxt ? `<br>Next: <b>${nxt.name}</b> — ${statLine(key, nxt)}</div><button class="btn primary" data-buy="${key}" ${S.coins < nxt.cost ? 'disabled' : ''}>${priceHtml(nxt.cost)}</button>` : `<br><b>Fully upgraded!</b></div>`;
      h += `</div></div>`;
    }
    h += `<p class="progress" style="text-align:center">Rod = reel speed · Line = how hard you can pull · Bait = faster bites and rarer fish</p>`;
    bodyEl.innerHTML = h;
  }
  function speciesCount(locId) {
    const all = PA.FISH.filter((f) => !locId || f.loc === locId);
    return { got: all.filter((f) => S.journal[f.id]).length, total: all.length };
  }
  function renderMap() {
    let h = `<div class="wallet"><span class="coin-ico"></span>${fmt(S.coins)} coins</div>`;
    for (const l of PA.LOCATIONS) {
      const un = S.unlocked.includes(l.id), here = S.loc === l.id, sc = speciesCount(l.id), rg = REC_GEAR[l.id];
      h += `<div class="loc-card ${here ? 'here' : ''} ${un ? '' : 'locked'}" style="background:linear-gradient(160deg, ${l.sky[0]} 0%, ${l.water[0]} 55%, ${l.water[1]} 100%)">`;
      h += `<h3>${l.name}</h3><p>${l.blurb}${rg ? ` Recommended gear: level ${rg}+.` : ''}</p><div class="row"><span class="meta">${sc.got}/${sc.total} species</span>`;
      if (here) h += `<span class="meta">You're here</span>`;
      else if (un) h += `<button class="btn primary" data-travel="${l.id}">Travel</button>`;
      else h += `<button class="btn primary" data-unlock="${l.id}" ${S.coins < l.cost ? 'disabled' : ''}>Unlock ${priceHtml(l.cost)}</button>`;
      h += `</div></div>`;
    }
    bodyEl.innerHTML = h;
  }
  function renderJournal() {
    const tab = G.journalTab || S.loc, all = speciesCount();
    let h = `<p class="progress">Species discovered: ${all.got} / ${all.total}</p><div class="tabs">`;
    for (const l of PA.LOCATIONS) h += `<button data-tab="${l.id}" class="${l.id === tab ? 'on' : ''}">${l.name}</button>`;
    h += `</div><div class="grid">`;
    for (const f of PA.FISH.filter((x) => x.loc === tab)) {
      const j = S.journal[f.id], R = PA.RARITY[f.rarity];
      h += `<div class="tile" data-fish="${f.id}" style="border-bottom-color:${R.color}"><canvas width="160" height="80" data-thumb="${f.id}"></canvas>`;
      h += `<div class="nm">${j ? f.name : '???'}</div><div class="sub">${j ? `${fmtW(j.best)} · ×${j.n}` : R.name}</div></div>`;
    }
    h += `</div><div id="fishDetail"></div>`;
    bodyEl.innerHTML = h;
    bodyEl.querySelectorAll('canvas[data-thumb]').forEach((c) => {
      const f = FISH_BY_ID[c.dataset.thumb], cx = c.getContext('2d'), ex = f.look.extra || [], j = S.journal[f.id];
      const L = ex.includes('bill') || ex.includes('paddle') ? 92 : f.look.shape === 'round' ? 84 : 118;
      PA.drawFish(cx, f, 80 - (ex.includes('bill') ? 14 : 4), 42, L, 1, 0.3, j ? { swim: 0 } : { silhouette: '#33475b', swim: 0 });
    });
    if (G.journalSel && FISH_BY_ID[G.journalSel] && FISH_BY_ID[G.journalSel].loc === tab) showFishDetail(G.journalSel, false);
  }
  function showFishDetail(id, scroll) {
    G.journalSel = id;
    const f = FISH_BY_ID[id], j = S.journal[id], R = PA.RARITY[f.rarity], el = $('fishDetail');
    if (!el) return;
    const when = f.time === 'any' ? 'Any time' : f.time === 'night' ? 'Night only' : 'Daytime';
    const depth = f.depth < 0.34 ? 'Shallow (short cast)' : f.depth < 0.67 ? 'Mid-depth' : 'Deep (long cast)';
    el.innerHTML = `<div class="detail"><h3>${j ? f.name : 'Unknown fish'}</h3><div class="chips"><span style="background:${R.color};color:#fff">${R.name}</span><span>${when}</span><span>${depth}</span></div>` +
      (j ? `<div>${f.desc}</div><div class="chips"><span>Caught ×${j.n}</span><span>Best ${fmtW(j.best)}</span><span>Size ${fmtW(f.w[0])}–${fmtW(f.w[1])}</span></div>` : `<div>Not caught yet. Try fishing at <b>${LOC_BY_ID[f.loc].name}</b>.</div>`) + `</div>`;
    if (scroll) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function renderSettings() {
    const big = S.stats.biggest;
    const sc = speciesCount();
    let h = `<div class="set-row">Sound<button class="toggle ${S.settings.sound ? 'on' : ''}" data-toggle="sound" aria-label="Sound"></button></div>`;
    h += `<div class="set-row">Vibration<button class="toggle ${S.settings.vibe ? 'on' : ''}" data-toggle="vibe" aria-label="Vibration"></button></div>`;
    h += `<div class="stats"><div><span class="k">Fish caught</span><span class="v">${fmt(S.stats.catches)}</span></div><div><span class="k">Species</span><span class="v">${sc.got}/${sc.total}</span></div>`;
    h += `<div><span class="k">Coins earned</span><span class="v">${fmt(S.stats.earned)}</span></div><div><span class="k">Biggest fish</span><span class="v">${big ? `${FISH_BY_ID[big.id].name}, ${fmtW(big.w)}` : '—'}</span></div>`;
    h += `<div><span class="k">Casts</span><span class="v">${fmt(S.stats.casts)}</span></div><div><span class="k">Got away</span><span class="v">${fmt(S.stats.lost)}</span></div></div>`;
    h += howToHtml();
    h += `<button class="btn danger big" data-reset="1">${G.resetArm ? 'Tap again to erase everything' : 'Reset progress'}</button>`;
    h += `<p class="progress" style="text-align:center;margin-top:12px">Pocket Angler v1.0 · plays fully offline</p>`;
    bodyEl.innerHTML = h;
  }
  function howToHtml() {
    return `<div class="howto"><b>How to fish</b><ol>
      <li><b>Hold</b> anywhere to charge your cast, then <b>let go</b>. Longer casts reach deeper water, where bigger and rarer fish live.</li>
      <li>Wait for a bite. Little twitches are just nibbles — <b>tap</b> only when the bobber gets yanked under and the <b>!</b> appears.</li>
      <li><b>Hold to reel.</b> When the fish pulls (splashes, red <b>!</b>), <b>let go</b> so the line doesn't snap. Keep the tension bar out of the red.</li>
      <li>Fish are sold automatically. Spend coins in the <b>Shop</b>, then <b>Travel</b> to new waters.</li>
      <li>Some fish only bite at night — watch the clock in the top corner.</li></ol></div>`;
  }
  function renderWelcome() {
    bodyEl.innerHTML = `<p style="margin:0 0 10px;font-size:15px;line-height:1.4">Grab your rod — there are <b>${PA.FISH.length} species</b> to discover across ${PA.LOCATIONS.length} fishing spots, from a sleepy pond to icy northern seas.</p>` +
      howToHtml() + `<button class="btn primary big" data-close="1">Let's fish!</button>`;
  }

  bodyEl.addEventListener('click', (e) => {
    const el = e.target.closest('button, .tile'); if (!el) return;
    const d = el.dataset;
    if (d.buy) {
      const U = PA.UPGRADES[d.buy], nxt = U.items[S[d.buy] + 1];
      if (nxt && S.coins >= nxt.cost) { S.coins -= nxt.cost; S[d.buy]++; Snd.buy(); buzz('medium'); save(); updateHud(); toast(`Equipped ${nxt.name}!`); renderShop(); }
    } else if (d.unlock) {
      const l = LOC_BY_ID[d.unlock];
      if (S.coins >= l.cost && !S.unlocked.includes(l.id)) { S.coins -= l.cost; S.unlocked.push(l.id); Snd.buy(); buzz('medium'); save(); updateHud(); toast(`${l.name} unlocked!`); renderMap(); }
    } else if (d.travel) {
      S.loc = d.travel; save(); updateHud(); closePanel(); Snd.splash(false); toast(`Welcome to ${LOC().name}`);
    } else if (d.tab) { Snd.click(); G.journalTab = d.tab; G.journalSel = null; renderJournal(); }
    else if (d.fish) { Snd.click(); showFishDetail(d.fish, true); }
    else if (d.toggle) {
      S.settings[d.toggle] = !S.settings[d.toggle];
      if (d.toggle === 'sound') Snd.setEnabled(S.settings.sound);
      if (d.toggle === 'vibe' && S.settings.vibe) buzz('medium');
      Snd.click(); save(); renderSettings();
    } else if (d.reset) {
      if (!G.resetArm) { G.resetArm = 1; renderSettings(); return; }
      S = defaults(); S.welcomed = true; save(); Snd.setEnabled(true); updateHud(); closePanel(); toast('Progress reset — fresh start!');
    } else if (d.close) { Snd.click(); closePanel(); }
  });
  $('panelClose').addEventListener('click', () => { Snd.click(); closePanel(); });
  panelEl.addEventListener('click', (e) => { if (e.target === panelEl) closePanel(); });
  menuEl.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { Snd.init(); Snd.click(); openPanel(b.dataset.panel); }));

  // ------------------------------------------------------------------ native hooks
  function setupNative() {
    if (Plugins.StatusBar) safe(Plugins.StatusBar.hide());
    if (Plugins.App) {
      safe(Plugins.App.addListener('backButton', () => {
        if (G.panel) closePanel();
        else if (G.cardOpen) collect();
        else if (G.state === 'waiting' || G.state === 'bite') retrieve('Reeled in.');
        else if (Plugins.App.minimizeApp) safe(Plugins.App.minimizeApp());
      }));
      safe(Plugins.App.addListener('pause', () => { save(); Snd.suspend(); }));
      safe(Plugins.App.addListener('resume', () => Snd.resume()));
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { save(); Snd.suspend(); G.holding = false; G.pointer = null; if (G.state === 'charging') setState('idle'); }
    else Snd.resume();
  });
  window.addEventListener('pagehide', save);

  // ------------------------------------------------------------------ boot
  window.addEventListener('resize', resize);
  resize();
  G.amb.forEach((a) => { a.x = rand(0, W); a.y = rand(WY + 40, H - 120); });
  updateHud(); updateClock(); setState('idle');
  setupNative();
  if (!S.welcomed) openPanel('welcome');

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt); render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // test hook (harmless in production)
  window.__PA = { G, get S() { return S; }, setS: (o) => { Object.assign(S, o); updateHud(); }, openPanel, closePanel };
})();
