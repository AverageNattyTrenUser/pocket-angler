/* Pocket Angler — procedural art (fish, junk, scenery, angler) */
(function (G) {
  const PA = (G.PA = G.PA || {});
  const TAU = Math.PI * 2;

  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function seeded(seed) { let s = seed || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0) / 4294967296; }
  PA.seeded = seeded;

  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
    const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
    const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
  }
  PA.mix = mix;

  const SHAPE_H = { normal: 0.36, long: 0.22, tall: 0.5, round: 0.72, eel: 0.12, flat: 0.48, shark: 0.24 };

  function bodyPath(ctx, bl, h, shape) {
    const nx = bl / 2, tx = -bl / 2, hh = h / 2;
    ctx.beginPath();
    if (shape === 'round') {
      ctx.ellipse(0, 0, bl * 0.42, hh, 0, 0, TAU);
      return;
    }
    if (shape === 'eel') {
      ctx.moveTo(nx, 0);
      ctx.quadraticCurveTo(nx * 0.95, -hh, nx * 0.6, -hh);
      ctx.lineTo(tx * 0.7, -hh * 0.8);
      ctx.quadraticCurveTo(tx, -hh * 0.3, tx, 0);
      ctx.quadraticCurveTo(tx, hh * 0.3, tx * 0.7, hh * 0.8);
      ctx.lineTo(nx * 0.6, hh);
      ctx.quadraticCurveTo(nx * 0.95, hh, nx, 0);
      ctx.closePath();
      return;
    }
    const noseSharp = shape === 'shark' || shape === 'long' ? 0.25 : 0.6;
    ctx.moveTo(nx, shape === 'shark' ? -hh * 0.1 : 0);
    ctx.quadraticCurveTo(nx * noseSharp + nx * 0.2, -hh * 1.05, 0, -hh);
    ctx.quadraticCurveTo(tx * 0.65, -hh * 0.92, tx, -h * 0.11);
    ctx.lineTo(tx, h * 0.11);
    ctx.quadraticCurveTo(tx * 0.65, hh * 0.92, 0, hh);
    ctx.quadraticCurveTo(nx * noseSharp + nx * 0.2, hh * 1.05, nx, shape === 'shark' ? hh * 0.15 : 0);
    ctx.closePath();
  }

  function tailPath(ctx, tx, h, L, type) {
    const s = L * 0.2;
    ctx.beginPath();
    switch (type) {
      case 'fork':
        ctx.moveTo(tx + 3, -h * 0.08);
        ctx.lineTo(tx - s, -h * 0.55);
        ctx.quadraticCurveTo(tx - s * 0.45, 0, tx - s, h * 0.55);
        ctx.lineTo(tx + 3, h * 0.08);
        break;
      case 'moon':
        ctx.moveTo(tx + 3, -h * 0.06);
        ctx.quadraticCurveTo(tx - s * 0.6, -h * 0.4, tx - s * 1.1, -h * 0.85);
        ctx.quadraticCurveTo(tx - s * 0.55, 0, tx - s * 1.1, h * 0.85);
        ctx.quadraticCurveTo(tx - s * 0.6, h * 0.4, tx + 3, h * 0.06);
        break;
      case 'shark':
        ctx.moveTo(tx + 3, -h * 0.05);
        ctx.quadraticCurveTo(tx - s * 0.7, -h * 0.5, tx - s * 1.05, -h * 0.95);
        ctx.quadraticCurveTo(tx - s * 0.65, -h * 0.1, tx - s * 0.6, h * 0.05);
        ctx.lineTo(tx - s * 0.75, h * 0.45);
        ctx.lineTo(tx + 3, h * 0.08);
        break;
      case 'round':
        ctx.moveTo(tx + 3, -h * 0.08);
        ctx.quadraticCurveTo(tx - s * 1.1, -h * 0.55, tx - s * 0.95, 0);
        ctx.quadraticCurveTo(tx - s * 1.1, h * 0.55, tx + 3, h * 0.08);
        break;
      case 'fan':
        ctx.moveTo(tx + 3, -h * 0.06);
        ctx.bezierCurveTo(tx - s * 0.6, -h * 0.9, tx - s * 1.4, -h * 0.7, tx - s * 1.1, -h * 0.1);
        ctx.quadraticCurveTo(tx - s * 0.8, 0, tx - s * 1.1, h * 0.1);
        ctx.bezierCurveTo(tx - s * 1.4, h * 0.7, tx - s * 0.6, h * 0.9, tx + 3, h * 0.06);
        break;
      case 'point':
        ctx.moveTo(tx + 3, -h * 0.4);
        ctx.quadraticCurveTo(tx - s * 0.5, -h * 0.25, tx - s * 1.0, 0);
        ctx.quadraticCurveTo(tx - s * 0.5, h * 0.25, tx + 3, h * 0.4);
        break;
      default: // square
        ctx.moveTo(tx + 3, -h * 0.08);
        ctx.lineTo(tx - s * 0.85, -h * 0.5);
        ctx.lineTo(tx - s * 0.75, 0);
        ctx.lineTo(tx - s * 0.85, h * 0.5);
        ctx.lineTo(tx + 3, h * 0.08);
    }
    ctx.closePath();
  }

  function drawPattern(ctx, lk, bl, h, rnd) {
    const nx = bl / 2, tx = -bl / 2;
    ctx.fillStyle = lk.pat; ctx.strokeStyle = lk.pat;
    switch (lk.pattern) {
      case 'stripe':
        ctx.globalAlpha *= 0.7; ctx.fillRect(tx, -h * 0.06, bl, h * 0.1); break;
      case 'rainbow': {
        const g = ctx.createLinearGradient(0, -h * 0.12, 0, h * 0.12);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, lk.pat); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(tx, -h * 0.14, bl, h * 0.28);
        ctx.fillStyle = '#2b2b22';
        for (let i = 0; i < 26; i++) { ctx.beginPath(); ctx.arc(tx + rnd() * bl * 0.95, -h * 0.45 + rnd() * h * 0.5, Math.max(0.6, h * 0.03), 0, TAU); ctx.fill(); }
        break;
      }
      case 'bands':
        ctx.globalAlpha *= 0.55;
        for (let i = 0; i < 6; i++) { const x = tx + bl * (0.12 + i * 0.14); ctx.fillRect(x, -h / 2, bl * 0.055, h * 0.75); }
        break;
      case 'spots':
        for (let i = 0; i < 22; i++) { ctx.beginPath(); ctx.arc(tx + bl * 0.05 + rnd() * bl * 0.8, -h * 0.42 + rnd() * h * 0.6, Math.max(0.7, h * (0.03 + rnd() * 0.035)), 0, TAU); ctx.fill(); }
        break;
      case 'koi':
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(tx + bl * (0.15 + rnd() * 0.65), -h * 0.2 + rnd() * h * 0.25, bl * (0.08 + rnd() * 0.08), h * (0.16 + rnd() * 0.14), rnd(), 0, TAU); ctx.fill(); }
        break;
      case 'scales':
        ctx.globalAlpha *= 0.35; ctx.lineWidth = Math.max(0.6, h * 0.025);
        for (let r = -2; r <= 2; r++) for (let c = 0; c < 9; c++) {
          const x = tx + bl * 0.15 + c * bl * 0.085 + (r % 2 ? bl * 0.04 : 0), y = r * h * 0.17;
          ctx.beginPath(); ctx.arc(x, y, h * 0.09, -Math.PI / 2, Math.PI / 2); ctx.stroke();
        }
        break;
      case 'mottle':
        ctx.globalAlpha *= 0.5;
        for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.ellipse(tx + rnd() * bl, -h * 0.4 + rnd() * h * 0.55, bl * (0.03 + rnd() * 0.05), h * (0.06 + rnd() * 0.08), rnd() * 3, 0, TAU); ctx.fill(); }
        break;
      case 'blotch':
        ctx.globalAlpha *= 0.6;
        for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.ellipse(tx + bl * (0.1 + i * 0.1), (rnd() - 0.5) * h * 0.08, bl * 0.06, h * 0.1, 0, 0, TAU); ctx.fill(); }
        break;
      case 'wavy':
        ctx.lineWidth = Math.max(0.8, h * 0.05); ctx.globalAlpha *= 0.8;
        for (let i = 0; i < 9; i++) {
          const x = tx + bl * (0.08 + i * 0.1);
          ctx.beginPath(); ctx.moveTo(x, -h / 2);
          ctx.quadraticCurveTo(x + bl * 0.04, -h * 0.32, x - bl * 0.01, -h * 0.12);
          ctx.quadraticCurveTo(x - bl * 0.04, -h * 0.02, x + bl * 0.01, h * 0.02);
          ctx.stroke();
        }
        break;
      case 'scutes':
        for (let i = 0; i < 9; i++) {
          const x = tx + bl * (0.1 + i * 0.09);
          for (const y of [-h * 0.3, h * 0.05]) { ctx.beginPath(); ctx.moveTo(x, y - h * 0.06); ctx.lineTo(x + bl * 0.025, y); ctx.lineTo(x, y + h * 0.06); ctx.lineTo(x - bl * 0.025, y); ctx.closePath(); ctx.fill(); }
        }
        break;
      case 'aurora': {
        const g = ctx.createLinearGradient(tx, 0, nx, 0);
        g.addColorStop(0, '#6ee7ff'); g.addColorStop(0.35, lk.pat); g.addColorStop(0.7, '#ffe66e'); g.addColorStop(1, '#7dffcf');
        ctx.globalAlpha *= 0.55; ctx.fillStyle = g; ctx.fillRect(tx, -h / 2, bl, h * 0.55);
        break;
      }
    }
  }

  // Draw a fish centred at (x, y). L = total length in px. dir = 1 faces right.
  PA.drawFish = function (ctx, F, x, y, L, dir, t, opt) {
    opt = opt || {};
    const lk = F.look, shape = lk.shape || 'normal', ex = lk.extra || [];
    const sil = opt.silhouette;
    const bl = L * 0.8, h = L * SHAPE_H[shape];
    const tx = shape === 'round' ? -bl * 0.4 : -bl / 2, nx = shape === 'round' ? bl * 0.42 : bl / 2;
    const sway = Math.sin((t || 0) * 9) * 0.18 * (opt.swim == null ? 1 : opt.swim);
    const rnd = seeded(hashStr(F.id));
    const col = (c) => (sil ? sil : c);

    ctx.save();
    ctx.translate(x + L * 0.06 * dir, y);
    ctx.scale(dir, 1);
    if (opt.rot) ctx.rotate(opt.rot);
    if (lk.glow && !sil && opt.glow !== false) { ctx.shadowColor = lk.glow; ctx.shadowBlur = L * 0.25; }

    // tail
    ctx.save(); ctx.translate(tx, 0); ctx.rotate(sway); ctx.translate(-tx, 0);
    ctx.fillStyle = col(lk.fin); tailPath(ctx, tx, h, L, lk.tail); ctx.fill();
    ctx.restore();

    // dorsal fin
    ctx.fillStyle = col(lk.fin);
    ctx.beginPath();
    if (ex.includes('sail')) {
      ctx.moveTo(nx * 0.55, -h * 0.42); ctx.quadraticCurveTo(nx * 0.1, -h * 1.5, tx * 0.5, -h * 0.95); ctx.lineTo(tx * 0.55, -h * 0.4);
    } else if (ex.includes('longdorsal')) {
      ctx.moveTo(nx * 0.6, -h * 0.45); ctx.quadraticCurveTo(0, -h * 0.85, tx * 0.85, -h * 0.25); ctx.lineTo(tx * 0.8, -h * 0.15);
    } else if (shape === 'shark') {
      ctx.moveTo(nx * 0.15, -h * 0.45); ctx.quadraticCurveTo(-bl * 0.02, -h * 1.15, -bl * 0.12, -h * 1.0); ctx.lineTo(-bl * 0.1, -h * 0.4);
    } else if (shape !== 'eel' && shape !== 'round') {
      ctx.moveTo(bl * 0.12, -h * 0.46); ctx.quadraticCurveTo(-bl * 0.05, -h * 0.95, -bl * 0.22, -h * 0.72); ctx.lineTo(-bl * 0.26, -h * 0.4);
    }
    ctx.closePath(); ctx.fill();
    if (ex.includes('spinydorsal') && !sil) {
      ctx.strokeStyle = mix(lk.fin, '#000000', 0.3); ctx.lineWidth = Math.max(0.6, L * 0.008);
      for (let i = 0; i < 5; i++) { const xx = bl * 0.1 - i * bl * 0.07; ctx.beginPath(); ctx.moveTo(xx, -h * 0.45); ctx.lineTo(xx - bl * 0.02, -h * 0.85 + i * h * 0.03); ctx.stroke(); }
    }
    if (ex.includes('crest')) {
      ctx.fillStyle = col('#ffe680');
      for (let i = 0; i < 5; i++) { const xx = bl * 0.28 - i * bl * 0.05; ctx.beginPath(); ctx.moveTo(xx - bl * 0.02, -h * 0.4); ctx.lineTo(xx, -h * 0.95 - (i % 2) * h * 0.15); ctx.lineTo(xx + bl * 0.02, -h * 0.4); ctx.fill(); }
    }
    // anal / belly fin
    if (shape !== 'eel' && shape !== 'round') {
      ctx.fillStyle = col(lk.fin); ctx.beginPath();
      ctx.moveTo(-bl * 0.12, h * 0.42); ctx.quadraticCurveTo(-bl * 0.25, h * 0.8, -bl * 0.32, h * 0.62); ctx.lineTo(-bl * 0.3, h * 0.35); ctx.closePath(); ctx.fill();
    }
    if (ex.includes('spikes')) {
      ctx.fillStyle = col(mix(lk.body, '#000000', 0.25));
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU, rx = bl * 0.42, ry = h / 2;
        const px = Math.cos(a) * rx, py = Math.sin(a) * ry, ox = Math.cos(a) * rx * 1.14, oy = Math.sin(a) * ry * 1.16;
        ctx.beginPath(); ctx.moveTo(px - Math.sin(a) * L * 0.025, py + Math.cos(a) * L * 0.025); ctx.lineTo(ox, oy); ctx.lineTo(px + Math.sin(a) * L * 0.025, py - Math.cos(a) * L * 0.025); ctx.fill();
      }
    }

    // body
    if (ex.includes('bill')) {
      ctx.fillStyle = col(mix(lk.body, '#000000', 0.15)); ctx.beginPath();
      ctx.moveTo(nx * 0.85, -h * 0.12); ctx.lineTo(nx + L * 0.32, -h * 0.02); ctx.lineTo(nx * 0.85, h * 0.06); ctx.fill();
    }
    if (ex.includes('paddle')) {
      ctx.fillStyle = col(mix(lk.body, '#000000', 0.1)); ctx.beginPath();
      ctx.moveTo(nx * 0.85, -h * 0.12); ctx.lineTo(nx + L * 0.22, -h * 0.16); ctx.quadraticCurveTo(nx + L * 0.3, -h * 0.02, nx + L * 0.22, h * 0.1); ctx.lineTo(nx * 0.85, h * 0.06); ctx.fill();
    }
    if (sil) { ctx.fillStyle = sil; }
    else {
      const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      g.addColorStop(0, mix(lk.body, '#000000', 0.12)); g.addColorStop(0.45, lk.body); g.addColorStop(0.8, lk.belly); g.addColorStop(1, lk.belly);
      ctx.fillStyle = g;
    }
    bodyPath(ctx, bl, h, shape); ctx.fill();
    ctx.shadowBlur = 0;

    if (!sil) {
      ctx.save(); bodyPath(ctx, bl, h, shape); ctx.clip();
      if (lk.pattern && lk.pattern !== 'none') drawPattern(ctx, lk, bl, h, rnd);
      ctx.globalAlpha = 1;
      if (ex.includes('stripeline')) { ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = Math.max(0.6, h * 0.03); ctx.beginPath(); ctx.moveTo(nx, -h * 0.05); ctx.quadraticCurveTo(0, -h * 0.25, tx, 0); ctx.stroke(); }
      if (ex.includes('bumps')) { ctx.fillStyle = mix(lk.body, '#000000', 0.25); for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.arc(tx + rnd() * bl * 0.8, -h * 0.4 + rnd() * h * 0.7, h * 0.045, 0, TAU); ctx.fill(); } }
      // gill line + shine
      ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = Math.max(0.7, L * 0.01);
      ctx.beginPath(); ctx.arc(nx - bl * 0.3, 0, h * 0.42, -0.9, 0.9); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.ellipse(bl * 0.05, -h * 0.25, bl * 0.28, h * 0.08, -0.05, 0, TAU); ctx.fill();
      ctx.restore();

      // pectoral fin
      ctx.fillStyle = lk.fin; ctx.globalAlpha = 0.85; ctx.beginPath();
      ctx.ellipse(nx - bl * 0.36, h * 0.12, bl * 0.08, h * 0.12, 0.7 + sway * 0.6, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      if (ex.includes('earflap')) { ctx.fillStyle = '#1c2533'; ctx.beginPath(); ctx.ellipse(nx - bl * 0.3, -h * 0.02, bl * 0.035, h * 0.08, 0, 0, TAU); ctx.fill(); }

      // eye
      const er = Math.max(1.4, h * (ex.includes('bigeye') ? 0.15 : 0.1)) * (shape === 'eel' ? 1.4 : 1);
      const ex0 = nx - (shape === 'round' ? bl * 0.12 : bl * 0.13), ey = shape === 'flat' ? -h * 0.22 : -h * 0.12;
      ctx.fillStyle = ex.includes('bigeye') ? '#e9f2d0' : '#ffffff'; ctx.beginPath(); ctx.arc(ex0, ey, er, 0, TAU); ctx.fill();
      ctx.fillStyle = '#141820'; ctx.beginPath(); ctx.arc(ex0 + er * 0.2, ey, er * 0.58, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex0 + er * 0.35, ey - er * 0.3, er * 0.22, 0, TAU); ctx.fill();
      if (shape === 'flat') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex0 - bl * 0.06, ey - h * 0.1, er * 0.9, 0, TAU); ctx.fill(); ctx.fillStyle = '#141820'; ctx.beginPath(); ctx.arc(ex0 - bl * 0.06 + er * 0.2, ey - h * 0.1, er * 0.5, 0, TAU); ctx.fill(); }

      // mouth
      ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = Math.max(0.7, L * 0.01);
      ctx.beginPath();
      if (ex.includes('bigmouth')) { ctx.moveTo(nx, h * 0.02); ctx.lineTo(nx - bl * 0.16, h * 0.08); }
      else if (ex.includes('duckbill')) { ctx.moveTo(nx, h * 0.01); ctx.lineTo(nx - bl * 0.12, h * 0.05); }
      else { ctx.moveTo(nx - 1, h * 0.03); ctx.lineTo(nx - bl * 0.05, h * 0.06); }
      ctx.stroke();

      // whiskers / barbels
      if (ex.includes('whiskers') || ex.includes('barbels') || ex.includes('chinbarbel')) {
        ctx.strokeStyle = mix(lk.body, '#000000', 0.35); ctx.lineWidth = Math.max(0.7, L * (ex.includes('whiskers') ? 0.012 : 0.008));
        const n = ex.includes('whiskers') ? 3 : ex.includes('chinbarbel') ? 1 : 2;
        const len = ex.includes('whiskers') ? L * 0.28 : L * 0.08;
        for (let i = 0; i < n; i++) {
          ctx.beginPath(); ctx.moveTo(nx - bl * 0.02, h * 0.06 + i * h * 0.03);
          ctx.quadraticCurveTo(nx + len * 0.4, h * 0.15 + i * h * 0.12 + sway * 4, nx + len * 0.15 * (i - 0.5), h * 0.25 + len * 0.6 + i * h * 0.05);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  };

  // ------------ junk / treasure ------------
  PA.drawJunk = function (ctx, kind, x, y, S, t) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin((t || 0) * 2) * 0.08);
    const s = S / 100;
    ctx.scale(s, s);
    ctx.lineJoin = 'round';
    if (kind === 'boot') {
      ctx.fillStyle = '#6b4a2f'; ctx.beginPath(); ctx.moveTo(-25, -40); ctx.lineTo(10, -40); ctx.lineTo(12, 5); ctx.quadraticCurveTo(45, 8, 45, 28); ctx.lineTo(-25, 28); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3e2a1a'; ctx.fillRect(-27, 26, 74, 10); ctx.fillStyle = '#86603e'; ctx.fillRect(-25, -44, 37, 8);
      ctx.strokeStyle = '#e8d8b5'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-8, -28 + i * 9); ctx.lineTo(8, -24 + i * 9); ctx.stroke(); }
      ctx.fillStyle = '#5fa35a'; ctx.beginPath(); ctx.ellipse(30, 8, 8, 3, 0.4, 0, TAU); ctx.fill();
    } else if (kind === 'can') {
      ctx.fillStyle = '#9aa3a8'; ctx.fillRect(-22, -32, 44, 64);
      ctx.fillStyle = '#c0462f'; ctx.fillRect(-22, -14, 44, 28);
      ctx.fillStyle = '#b06a32'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-16 + i * 7, 20 + (i % 3) * 3, 4, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#7d868b'; ctx.beginPath(); ctx.ellipse(0, -32, 22, 5, 0, 0, TAU); ctx.fill();
    } else if (kind === 'weed') {
      ctx.strokeStyle = '#3f8f4a'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-20 + i * 8, 35); ctx.bezierCurveTo(-40 + i * 14, 0, 20 - i * 6, -10, -10 + i * 7, -40); ctx.stroke(); }
      ctx.strokeStyle = '#6cbf5b'; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-15 + i * 10, 30); ctx.quadraticCurveTo(i * 12 - 20, -5, 8 - i * 5, -30); ctx.stroke(); }
    } else if (kind === 'duck') {
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.ellipse(0, 12, 38, 24, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(14, -18, 20, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ff8c1a'; ctx.beginPath(); ctx.ellipse(36, -14, 12, 6, 0.1, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.arc(20, -24, 3.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f2b81f'; ctx.beginPath(); ctx.ellipse(-8, 8, 16, 10, -0.3, 0, TAU); ctx.fill();
    } else if (kind === 'chest') {
      ctx.fillStyle = '#7a4a22'; ctx.fillRect(-40, -12, 80, 44);
      ctx.fillStyle = '#8f5a2b'; ctx.beginPath(); ctx.moveTo(-40, -12); ctx.quadraticCurveTo(0, -48, 40, -12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e9b83b'; ctx.fillRect(-40, -14, 80, 6); ctx.fillRect(-6, -14, 12, 22); ctx.fillRect(-44, 28, 88, 6);
      ctx.fillStyle = '#2b1a0c'; ctx.fillRect(-2, -4, 4, 6);
      ctx.fillStyle = '#ffd95a'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-24 + i * 12, -20 - (i % 2) * 5, 6, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  };

  // ------------ angler (original character: round fisher in a yellow bucket hat) ------------
  PA.drawAngler = function (ctx, x, y, s, pose, t) {
    // x,y = feet centre on dock. pose: { lean }
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const bob = Math.sin(t * 2) * 0.6;
    // legs
    ctx.fillStyle = '#3b4a6b'; ctx.fillRect(-9, -18, 7, 18); ctx.fillRect(2, -18, 7, 18);
    ctx.fillStyle = '#5a3a24'; ctx.fillRect(-11, -3, 10, 4); ctx.fillRect(1, -3, 11, 4);
    // body (vest)
    ctx.translate(0, bob);
    ctx.fillStyle = '#e8734a'; ctx.beginPath(); ctx.roundRect(-13, -46, 26, 30, 9); ctx.fill();
    ctx.fillStyle = '#d65f37'; ctx.fillRect(-13, -30, 26, 4);
    ctx.fillStyle = '#f7e3c8'; ctx.beginPath(); ctx.roundRect(-4, -45, 8, 14, 2); ctx.fill();
    ctx.fillStyle = '#c94f2b'; ctx.fillRect(-10, -26, 6, 6); ctx.fillRect(4, -26, 6, 6);
    // head
    ctx.fillStyle = '#f2c79a'; ctx.beginPath(); ctx.arc(0, -56, 11, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e9a77f'; ctx.beginPath(); ctx.arc(6, -52, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.arc(4, -57, 1.6, 0, TAU); ctx.arc(9, -57, 1.6, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#8a4b2f'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(6.5, -53, 3, 0.2, Math.PI - 0.2); ctx.stroke();
    // bucket hat
    ctx.fillStyle = '#f5c842'; ctx.beginPath(); ctx.ellipse(0, -63, 17, 4.5, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-10, -63); ctx.quadraticCurveTo(-10, -76, 0, -76); ctx.quadraticCurveTo(10, -76, 10, -63); ctx.fill();
    ctx.fillStyle = '#e0a92a'; ctx.fillRect(-10, -66, 20, 3);
    ctx.restore();
  };

  // ------------ scenery helpers ------------
  function hills(ctx, W, baseY, amp, freq, phase, color) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, baseY + 40);
    for (let x = 0; x <= W + 10; x += 10) ctx.lineTo(x, baseY - amp * (0.5 + 0.5 * Math.sin(x * freq + phase)) - amp * 0.3 * Math.sin(x * freq * 2.3 + phase * 1.7));
    ctx.lineTo(W, baseY + 40); ctx.closePath(); ctx.fill();
  }
  function pine(ctx, x, y, h, c) {
    ctx.fillStyle = '#4a3423'; ctx.fillRect(x - h * 0.04, y - h * 0.2, h * 0.08, h * 0.2);
    ctx.fillStyle = c; for (let i = 0; i < 3; i++) { const yy = y - h * 0.15 - i * h * 0.25, w = h * (0.32 - i * 0.07); ctx.beginPath(); ctx.moveTo(x - w, yy); ctx.lineTo(x, yy - h * 0.42); ctx.lineTo(x + w, yy); ctx.closePath(); ctx.fill(); }
  }
  function roundTree(ctx, x, y, r, c) {
    ctx.fillStyle = '#5b3d26'; ctx.fillRect(x - r * 0.12, y - r * 0.8, r * 0.24, r * 0.8);
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y - r * 1.3, r, 0, TAU); ctx.arc(x - r * 0.6, y - r * 0.95, r * 0.7, 0, TAU); ctx.arc(x + r * 0.6, y - r * 0.95, r * 0.7, 0, TAU); ctx.fill();
  }
  function mountain(ctx, x, baseY, w, h, c, snow) {
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - w / 2, baseY); ctx.lineTo(x, baseY - h); ctx.lineTo(x + w / 2, baseY); ctx.closePath(); ctx.fill();
    if (snow) { ctx.fillStyle = snow; ctx.beginPath(); ctx.moveTo(x - w * 0.14, baseY - h * 0.72); ctx.lineTo(x, baseY - h); ctx.lineTo(x + w * 0.14, baseY - h * 0.72); ctx.lineTo(x + w * 0.05, baseY - h * 0.77); ctx.lineTo(x - w * 0.03, baseY - h * 0.7); ctx.closePath(); ctx.fill(); }
  }
  function cloud(ctx, x, y, s) {
    ctx.beginPath(); ctx.arc(x, y, 14 * s, 0, TAU); ctx.arc(x + 16 * s, y - 6 * s, 17 * s, 0, TAU); ctx.arc(x + 34 * s, y, 13 * s, 0, TAU); ctx.rect(x, y, 34 * s, 13 * s); ctx.fill();
  }

  // Background scenery (everything above the water line)
  PA.drawBackdrop = function (ctx, loc, W, H, wy, t, env) {
    const sky = ctx.createLinearGradient(0, 0, 0, wy);
    sky.addColorStop(0, env.skyTop); sky.addColorStop(1, env.skyBot);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, wy + 2);

    // stars
    if (env.night > 0.05) {
      const r = seeded(99); ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 70; i++) { const sx = r() * W, sy = r() * wy * 0.8, tw = 0.5 + 0.5 * Math.sin(t * (1 + r() * 2) + i); ctx.globalAlpha = env.night * tw * 0.9; ctx.fillRect(sx, sy, 1.6, 1.6); }
      ctx.globalAlpha = 1;
    }
    // aurora
    if (loc.id === 'frost' && env.night > 0.1) {
      for (let k = 0; k < 3; k++) {
        ctx.globalAlpha = env.night * 0.28; const g = ctx.createLinearGradient(0, wy * 0.1, 0, wy * 0.6);
        g.addColorStop(0, k === 1 ? '#b18cff' : '#5effb0'); g.addColorStop(1, 'rgba(94,255,176,0)'); ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(0, wy * 0.6);
        for (let x = 0; x <= W; x += 12) ctx.lineTo(x, wy * (0.2 + k * 0.08) + Math.sin(x * 0.012 + t * 0.4 + k) * 22 + Math.sin(x * 0.03 - t * 0.6) * 8);
        ctx.lineTo(W, wy * 0.6); ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // sun / moon
    const arc = env.sunArc; // 0..1 across the day
    if (env.night < 0.95) {
      const sx = W * (0.1 + 0.8 * arc), sy = wy * 0.75 - Math.sin(arc * Math.PI) * wy * 0.6;
      ctx.globalAlpha = 1 - env.night; ctx.fillStyle = 'rgba(255,236,170,0.35)'; ctx.beginPath(); ctx.arc(sx, sy, 34, 0, TAU); ctx.fill();
      ctx.fillStyle = env.dusk > 0.3 ? '#ffb35c' : '#fff1a8'; ctx.beginPath(); ctx.arc(sx, sy, 20, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    }
    if (env.night > 0.05) {
      const mx = W * (0.1 + 0.8 * env.moonArc), my = wy * 0.75 - Math.sin(env.moonArc * Math.PI) * wy * 0.6;
      ctx.globalAlpha = env.night; ctx.fillStyle = 'rgba(220,230,255,0.18)'; ctx.beginPath(); ctx.arc(mx, my, 30, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f4f6ff'; ctx.beginPath(); ctx.arc(mx, my, 15, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(170,180,215,0.55)';
      ctx.beginPath(); ctx.arc(mx - 5, my - 3, 3.5, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(mx + 4, my + 5, 2.6, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(mx + 6, my - 5, 1.8, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    }
    // clouds
    ctx.fillStyle = env.night > 0.5 ? 'rgba(160,170,210,0.25)' : 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 4; i++) { const cx = ((i * 157 + t * (6 + i * 2)) % (W + 160)) - 80; cloud(ctx, cx, wy * (0.15 + 0.12 * (i % 3)), 0.7 + (i % 2) * 0.4); }

    const id = loc.id;
    if (id === 'pond') {
      hills(ctx, W, wy - 10, 40, 0.012, 1, '#9fcf7e');
      hills(ctx, W, wy, 22, 0.02, 3, '#7cb75b');
      // willow
      const tx = W * 0.82, ty = wy + 2;
      ctx.fillStyle = '#5b3d26'; ctx.beginPath(); ctx.moveTo(tx - 7, ty); ctx.quadraticCurveTo(tx - 2, ty - 50, tx - 10, ty - 85); ctx.lineTo(tx + 6, ty - 85); ctx.quadraticCurveTo(tx + 6, ty - 50, tx + 9, ty); ctx.fill();
      ctx.fillStyle = '#6fb04f'; ctx.beginPath(); ctx.ellipse(tx, ty - 95, 50, 28, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#5c9e41'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < 14; i++) { const sx = tx - 46 + i * 7, sway = Math.sin(t * 1.2 + i) * 3; ctx.beginPath(); ctx.moveTo(sx, ty - 92); ctx.quadraticCurveTo(sx + sway, ty - 55, sx + sway * 1.5, ty - 30 - (i % 3) * 10); ctx.stroke(); }
      // reeds
      ctx.strokeStyle = '#4f8a3a'; ctx.lineWidth = 2;
      for (let i = 0; i < 9; i++) { const rx = W * 0.6 + i * 6, s = Math.sin(t + i) * 2; ctx.beginPath(); ctx.moveTo(rx, wy + 3); ctx.quadraticCurveTo(rx + s, wy - 15, rx + s * 2, wy - 26 - (i % 3) * 6); ctx.stroke(); if (i % 3 === 0) { ctx.fillStyle = '#7a4f2c'; ctx.fillRect(rx + s * 2 - 2, wy - 36 - (i % 3) * 6, 4, 10); } }
    } else if (id === 'river') {
      hills(ctx, W, wy - 18, 34, 0.01, 2, '#8cbf88');
      for (let i = 0; i < 9; i++) roundTree(ctx, i * W / 8 + 10, wy - 2, 16 + (i % 3) * 4, i % 2 ? '#4f8f45' : '#5ea152');
      ctx.fillStyle = '#6aa857'; ctx.fillRect(0, wy - 6, W, 8);
    } else if (id === 'lake') {
      mountain(ctx, W * 0.25, wy - 4, W * 0.7, wy * 0.55, '#7d93ad', '#f2f6fb');
      mountain(ctx, W * 0.72, wy - 4, W * 0.8, wy * 0.7, '#6f86a2', '#f2f6fb');
      mountain(ctx, W * 1.05, wy - 4, W * 0.5, wy * 0.4, '#8098b2', null);
      for (let i = 0; i < 16; i++) pine(ctx, i * W / 15, wy + 2, 38 + (i % 4) * 9, i % 2 ? '#2f5d3a' : '#3a6b43');
    } else if (id === 'coast') {
      ctx.fillStyle = '#86a9c4'; ctx.beginPath(); ctx.ellipse(W * 0.72, wy, W * 0.18, 16, 0, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = '#9ec0d8'; ctx.beginPath(); ctx.ellipse(W * 0.45, wy, W * 0.09, 8, 0, Math.PI, TAU); ctx.fill();
      // palm
      const px = W * 0.9, py = wy + 4;
      ctx.strokeStyle = '#8b6a43'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px - 4, py - 50, px - 20, py - 95); ctx.stroke();
      ctx.fillStyle = '#3f9b52';
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.55 + Math.sin(t + i) * 0.05; ctx.save(); ctx.translate(px - 20, py - 95); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(26, 0, 28, 6, 0.25, 0, TAU); ctx.fill(); ctx.restore(); }
      // gulls
      ctx.strokeStyle = env.night > 0.5 ? 'rgba(200,210,230,0.5)' : '#4a5563'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) { const gx = ((t * 14 + i * 120) % (W + 60)) - 30, gy = wy * 0.35 + i * 18 + Math.sin(t * 2 + i) * 4, f = Math.sin(t * 6 + i) * 3; ctx.beginPath(); ctx.moveTo(gx - 7, gy - f); ctx.quadraticCurveTo(gx - 3, gy - 4, gx, gy); ctx.quadraticCurveTo(gx + 3, gy - 4, gx + 7, gy - f); ctx.stroke(); }
    } else if (id === 'frost') {
      mountain(ctx, W * 0.2, wy - 2, W * 0.6, wy * 0.5, '#c9dbea', '#ffffff');
      mountain(ctx, W * 0.65, wy - 2, W * 0.9, wy * 0.66, '#b7cde0', '#ffffff');
      // icebergs
      ctx.fillStyle = '#e9f6ff'; ctx.beginPath(); ctx.moveTo(W * 0.55, wy + 2); ctx.lineTo(W * 0.6, wy - 22); ctx.lineTo(W * 0.66, wy - 16); ctx.lineTo(W * 0.7, wy + 2); ctx.fill();
      ctx.fillStyle = '#cfe6f6'; ctx.beginPath(); ctx.moveTo(W * 0.62, wy - 19); ctx.lineTo(W * 0.66, wy - 16); ctx.lineTo(W * 0.7, wy + 2); ctx.lineTo(W * 0.63, wy + 2); ctx.fill();
    }
  };

  PA.drawDock = function (ctx, loc, W, wy, dockW, t) {
    if (loc.id === 'frost') {
      ctx.fillStyle = '#eef6fc'; ctx.beginPath(); ctx.moveTo(0, wy - 14); ctx.lineTo(dockW, wy - 14); ctx.lineTo(dockW + 10, wy + 4); ctx.lineTo(dockW - 4, wy + 26); ctx.lineTo(0, wy + 34); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#cbe2f2'; ctx.beginPath(); ctx.moveTo(dockW + 10, wy + 4); ctx.lineTo(dockW - 4, wy + 26); ctx.lineTo(0, wy + 34); ctx.lineTo(0, wy + 4); ctx.closePath(); ctx.fill();
      return;
    }
    if (loc.id === 'coast') { ctx.fillStyle = '#e8cf91'; ctx.beginPath(); ctx.moveTo(0, wy - 20); ctx.quadraticCurveTo(dockW * 0.4, wy - 22, dockW * 0.55, wy + 6); ctx.lineTo(0, wy + 6); ctx.fill(); }
    // posts
    ctx.fillStyle = '#6b4a2f';
    for (let i = 0; i < 3; i++) ctx.fillRect(dockW * (0.25 + i * 0.32) - 3, wy - 12, 6, 40);
    // planks
    ctx.fillStyle = '#a5794f'; ctx.fillRect(0, wy - 16, dockW, 8);
    ctx.fillStyle = '#8b6440'; for (let x = 0; x < dockW; x += 14) ctx.fillRect(x, wy - 16, 1.5, 8);
    ctx.fillStyle = '#7a5636'; ctx.fillRect(0, wy - 8, dockW, 3);
  };

  // Lantern drawn after the night overlay so it glows
  PA.drawLantern = function (ctx, x, y, night, t) {
    ctx.fillStyle = '#4b3a2a'; ctx.fillRect(x - 1, y - 26, 2, 26);
    ctx.fillRect(x - 1, y - 26, 10, 2);
    const flick = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7);
    if (night > 0.05) {
      const g = ctx.createRadialGradient(x + 8, y - 18, 2, x + 8, y - 18, 60);
      g.addColorStop(0, `rgba(255,210,120,${0.45 * night * flick})`); g.addColorStop(1, 'rgba(255,210,120,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + 8, y - 18, 60, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#2f2a24'; ctx.fillRect(x + 4, y - 24, 8, 2);
    ctx.fillStyle = night > 0.05 ? `rgba(255,214,120,${0.6 + 0.4 * flick})` : '#f3e2b0'; ctx.fillRect(x + 4.5, y - 22, 7, 9);
    ctx.strokeStyle = '#2f2a24'; ctx.lineWidth = 1; ctx.strokeRect(x + 4.5, y - 22, 7, 9);
  };
})(typeof window !== 'undefined' ? window : globalThis);
