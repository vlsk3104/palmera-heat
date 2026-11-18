// HUD: cash, health, wanted stars, objective line, prompts and the minimap.
import { starsLabel } from './wanted.js';
import { currentObjective } from './missions.js';
import { districtAt } from './city.js';

export function drawHud(ctx, state) {
  const g = state.game;
  // Top-left: cash + district
  ctx.fillStyle = 'rgba(12,16,24,0.72)'; ctx.fillRect(14, 12, 252, 64);
  ctx.fillStyle = '#7bf1a8'; ctx.font = 'bold 24px system-ui'; ctx.textAlign = 'left';
  ctx.fillText('$' + g.cash.toLocaleString(), 26, 46);
  ctx.fillStyle = '#ffe9b8'; ctx.font = '15px system-ui';
  ctx.fillText(districtAt(state.player.x, state.player.y).name, 26, 68);
  // Top-right: wanted stars
  ctx.font = '30px system-ui'; ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd60a'; ctx.fillText(starsLabel(state.wanted), 1266, 44);
  ctx.fillStyle = '#fff'; ctx.font = '13px system-ui';
  if (state.wanted.stars > 0) ctx.fillText(state.wanted.seen ? 'POLICE IN PURSUIT' : 'Hiding… stay out of sight', 1266, 64);
  // Objective banner
  ctx.fillStyle = 'rgba(12,16,24,0.78)'; ctx.fillRect(290, 12, 700, 40);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center';
  ctx.fillText(currentObjective(state.missions), 640, 38);
  if (state.missions.bannerTimer > 0 && state.missions.banner) {
    ctx.fillStyle = 'rgba(30,20,8,0.88)'; ctx.fillRect(296, 600, 688, 52);
    ctx.fillStyle = '#ffd166'; ctx.font = '16px system-ui';
    wrapText(ctx, state.missions.banner, 640, 632, 760, 20);
  }
  // Bottom-left: health + armour + weapon
  ctx.fillStyle = 'rgba(12,16,24,0.72)'; ctx.fillRect(14, 624, 260, 82);
  bar(ctx, 26, 640, 180, 14, g.health / 100, '#ef476f', 'HEALTH');
  bar(ctx, 26, 666, 180, 10, g.armour / 100, '#4361ee', 'ARMOUR');
  ctx.fillStyle = '#fff'; ctx.font = '14px system-ui'; ctx.textAlign = 'left';
  ctx.fillText(state.combat.hasGun ? `Pistol · ${state.combat.ammo} ammo · Click shoot · F shove` : 'Fists · F shove', 26, 698);
  if (state.player.car) { ctx.fillStyle = '#ffd166'; ctx.fillText(`${state.player.car.name} · E exit · Space handbrake`, 300, 698); }
  // Prompt
  if (state.prompt) {
    ctx.fillStyle = 'rgba(12,16,24,0.85)'; ctx.fillRect(490, 540, 300, 36);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center'; ctx.fillText(state.prompt, 640, 564);
  }
  if (state.audio && state.audio.isMuted()) { ctx.fillStyle = '#fff'; ctx.font = '13px system-ui'; ctx.textAlign = 'right'; ctx.fillText('MUTED (M)', 1266, 700); }
  drawMinimap(ctx, state);
}
function bar(ctx, x, y, w, h, frac, color, label) {
  ctx.fillStyle = '#222'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color; ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'left'; ctx.fillText(label, x + w + 8, y + h - 2);
}
function wrapText(ctx, text, x, y, maxW) {
  if (ctx.measureText(text).width <= maxW) { ctx.fillText(text, x, y); return; }
  ctx.fillText(text.slice(0, 62) + '…', x, y);
}
export function drawMinimap(ctx, state) {
  const S = 168, X = 1096, Y = 530, scale = S / 3600;
  ctx.fillStyle = 'rgba(12,16,24,0.82)'; ctx.fillRect(X - 6, Y - 6, S + 12, S + 26);
  ctx.fillStyle = '#35543a'; ctx.fillRect(X, Y, S, S);
  ctx.fillStyle = '#2ec4b6'; ctx.fillRect(X, Y + 3370 * scale, S, 230 * scale);
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 2;
  for (const c of state.city.centers) {
    ctx.beginPath(); ctx.moveTo(X + c * scale, Y); ctx.lineTo(X + c * scale, Y + S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X, Y + c * scale); ctx.lineTo(X + S, Y + c * scale); ctx.stroke();
  }
  // Garage blips
  ctx.fillStyle = '#00b4d8';
  for (const gar of state.city.garages) ctx.fillRect(X + gar.x * scale - 3, Y + gar.y * scale - 3, 6, 6);
  // Police blips
  for (const c of state.policeCars) {
    ctx.fillStyle = Math.floor(state.time * 4) % 2 ? '#ff2e4d' : '#2e6bff';
    ctx.beginPath(); ctx.arc(X + c.x * scale, Y + c.y * scale, 3.5, 0, Math.PI * 2); ctx.fill();
  }
  // Traffic dots
  ctx.fillStyle = '#ddd';
  for (const c of state.traffic) ctx.fillRect(X + c.x * scale - 1, Y + c.y * scale - 1, 2, 2);
  // Mission marker
  if (state.marker) {
    ctx.fillStyle = state.marker.deliver ? '#3ddc74' : '#ffcd32';
    ctx.beginPath(); ctx.arc(X + state.marker.x * scale, Y + state.marker.y * scale, 5, 0, Math.PI * 2); ctx.fill();
  }
  // Player arrow
  const px = X + state.player.x * scale, py = Y + state.player.y * scale;
  ctx.save(); ctx.translate(px, py); ctx.rotate(state.player.angle);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-6, -5); ctx.lineTo(-6, 5); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center';
  ctx.fillText('PALMERA CITY · N ↑', X + S / 2, Y + S + 16);
}
