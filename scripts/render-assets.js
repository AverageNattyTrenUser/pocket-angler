// Renders the app icon + splash PNGs into assets/ using the game's own drawing code (www/js/art.js),
// so the repo needs no binary image files. Run by scripts/prepare-android.sh.
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');

require('../www/js/data.js');
require('../www/js/art.js');
const PA = globalThis.PA;
const TAU = Math.PI * 2;
const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });

function bg(ctx, S, dark) {
  const g = ctx.createLinearGradient(0, 0, 0, S);
  if (dark) { g.addColorStop(0, '#0f2540'); g.addColorStop(0.5, '#14395a'); g.addColorStop(1, '#0a1f33'); }
  else { g.addColorStop(0, '#8fd3f4'); g.addColorStop(0.48, '#d9f2ff'); g.addColorStop(0.5, '#4fb3c8'); g.addColorStop(1, '#165a6e'); }
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  if (!dark) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(S * (0.2 + i * 0.15), S * (0.62 + (i % 2) * 0.1), S * 0.06, S * 0.008, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#fff1a8'; ctx.beginPath(); ctx.arc(S * 0.78, S * 0.2, S * 0.08, 0, TAU); ctx.fill();
  }
}

function art(ctx, cx, cy, s) {
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = s * 0.022;
  ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.2, s * 0.36, s * 0.08, 0, 0, TAU); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  for (const [dx, dy, r] of [[-0.3, 0.08, 0.03], [-0.22, 0.0, 0.022], [0.28, 0.06, 0.028], [0.34, -0.02, 0.018], [-0.36, -0.04, 0.016]]) {
    ctx.beginPath(); ctx.arc(cx + dx * s, cy + dy * s, r * s, 0, TAU); ctx.fill();
  }
  const fish = PA.FISH.find((f) => f.id === 'goldfish');
  PA.drawFish(ctx, fish, cx - s * 0.02, cy - s * 0.06, s * 0.78, 1, 0.5, { rot: -0.45, swim: 0.6 });
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = s * 0.01;
  ctx.beginPath(); ctx.moveTo(cx + s * 0.22, cy - s * 0.42); ctx.quadraticCurveTo(cx + s * 0.1, cy - s * 0.3, cx + s * 0.06, cy - s * 0.18); ctx.stroke();
  const bx = cx + s * 0.24, by = cy - s * 0.42, br = s * 0.06;
  ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(bx, by, br, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI); ctx.fill();
  ctx.strokeStyle = '#1d2a36'; ctx.lineWidth = s * 0.008; ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx, by - br); ctx.lineTo(bx, by - br * 1.7); ctx.stroke();
}

function render(kind) {
  const size = kind.startsWith('splash') ? 2732 : 1024;
  const c = createCanvas(size, size);
  const ctx = c.getContext('2d');
  if (kind === 'icon-only') { bg(ctx, size, false); art(ctx, size / 2, size * 0.54, size * 0.92); }
  else if (kind === 'icon-background') bg(ctx, size, false);
  else if (kind === 'icon-foreground') art(ctx, size / 2, size * 0.54, size * 0.6);
  else {
    bg(ctx, size, kind === 'splash-dark');
    art(ctx, size / 2, size * 0.47, size * 0.32);
    ctx.font = `bold ${Math.round(size * 0.05)}px sans-serif`; ctx.textAlign = 'center';
    ctx.lineWidth = size * 0.012; ctx.strokeStyle = 'rgba(15,43,58,0.6)'; ctx.fillStyle = '#ffffff';
    ctx.strokeText('Pocket Angler', size / 2, size * 0.7); ctx.fillText('Pocket Angler', size / 2, size * 0.7);
  }
  fs.writeFileSync(path.join(outDir, `${kind}.png`), c.toBuffer('image/png'));
}

for (const k of ['icon-only', 'icon-foreground', 'icon-background', 'splash', 'splash-dark']) render(k);
console.log('Rendered app icon + splash into assets/');
