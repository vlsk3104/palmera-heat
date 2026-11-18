// World rendering: golden-hour Palmera City, roads, buildings, beach, cars and people.
export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

export function drawWorld(ctx, state, cam) {
  const g = state.game;
  // Sky-sea gradient backdrop then ground districts.
  const grad = ctx.createLinearGradient(0, 0, 0, 720);
  grad.addColorStop(0, '#ffd9a0'); grad.addColorStop(1, '#ff9e7d');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 1280, 720);
  ctx.save();
  ctx.translate(640, 360); ctx.scale(cam.zoom, cam.zoom); ctx.translate(-cam.x, -cam.y);
  if (g.shake > 0) ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
  const vx0 = cam.x - 760, vy0 = cam.y - 480, vx1 = cam.x + 760, vy1 = cam.y + 480;
  // Ground
  ctx.fillStyle = '#8fce7a'; ctx.fillRect(0, 0, 3600, 2950);
  ctx.fillStyle = '#f4d58d'; ctx.fillRect(0, 2950, 3600, 420);
  ctx.fillStyle = '#2ec4b6'; ctx.fillRect(0, 3370, 3600, 230);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 12; i++) ctx.fillRect((i * 330 + 40) % 3600, 3400 + (i % 3) * 55, 120, 5);
  // Roads
  ctx.fillStyle = '#3a3f4a';
  for (const c of state.city.centers) {
    ctx.fillRect(0, c - 46, 3600, 92); ctx.fillRect(c - 46, 0, 92, 3600);
  }
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.setLineDash([26, 22]);
  for (const c of state.city.centers) {
    ctx.beginPath(); ctx.moveTo(0, c); ctx.lineTo(3600, c); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(c, 0); ctx.lineTo(c, 3600); ctx.stroke();
  }
  ctx.setLineDash([]);
  // Sidewalk tint on blocks + buildings with long shadows
  for (const b of state.city.buildings) {
    if (b.x + b.w < vx0 || b.x > vx1 || b.y + b.h < vy0 || b.y > vy1) continue;
    ctx.fillStyle = 'rgba(60,40,20,0.28)'; ctx.fillRect(b.x + 14, b.y + 16, b.w, b.h);
    ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = b.roof; ctx.fillRect(b.x + 5, b.y + 5, b.w - 10, 16);
    ctx.fillStyle = 'rgba(255,240,180,0.75)';
    const rows = Math.min(6, b.floors);
    for (let r = 0; r < rows; r++) for (let cc = 0; cc < Math.floor(b.w / 26); cc++) ctx.fillRect(b.x + 8 + cc * 26, b.y + 30 + r * 22, 11, 9);
  }
  // Garages
  for (const gar of state.city.garages) {
    ctx.fillStyle = '#00b4d8'; ctx.fillRect(gar.x - 52, gar.y - 52, 104, 104);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('SPRAY', gar.x, gar.y - 8); ctx.fillText('GARAGE', gar.x, gar.y + 12);
  }
  // Ramps / collectibles
  for (const r of state.city.ramps) {
    if (r.found) continue;
    ctx.fillStyle = '#ffbe0b'; ctx.beginPath(); ctx.arc(r.x, r.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a4b00'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText('P', r.x, r.y + 5);
  }
  // Pickups
  for (const p of state.city.pickups) {
    if (p.taken) continue;
    ctx.fillStyle = p.kind === 'health' ? '#ef476f' : '#4361ee';
    ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center'; ctx.fillText(p.kind === 'health' ? '+' : 'A', p.x, p.y + 5);
  }
  // Palms
  ctx.strokeStyle = '#6a994e'; ctx.lineWidth = 5;
  for (const p of state.city.palms) {
    if (p.x < vx0 || p.x > vx1 || p.y < vy0 || p.y > vy1) continue;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 7, p.y - 24 * p.s); ctx.stroke();
    ctx.strokeStyle = '#2a9d8f'; ctx.lineWidth = 3;
    for (let f = 0; f < 5; f++) { const a = f * 1.25; ctx.beginPath(); ctx.moveTo(p.x + 7, p.y - 24 * p.s); ctx.quadraticCurveTo(p.x + 7 + Math.cos(a) * 16, p.y - 24 * p.s - 6, p.x + 7 + Math.cos(a) * 24, p.y - 24 * p.s + 7); ctx.stroke(); }
    ctx.strokeStyle = '#6a994e'; ctx.lineWidth = 5;
  }
  // Skid marks
  ctx.fillStyle = 'rgba(20,20,20,0.4)';
  for (const car of [...state.traffic, ...state.parked]) for (const s of car.skid || []) ctx.fillRect(s.x - 3, s.y - 3, 6, 6);
  // Cars
  const allCars = [...state.parked, ...state.traffic, ...state.policeCars];
  if (state.player.car) allCars.push(state.player.car);
  for (const car of allCars) drawCar(ctx, car, state);
  // Rival
  if (state.rival) drawCar(ctx, state.rival, state);
  // Pedestrians
  for (const p of state.peds) {
    if (p.x < vx0 || p.x > vx1 || p.y < vy0 || p.y > vy1) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(p.x + 3, p.y + 5, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd7a8'; ctx.beginPath(); ctx.arc(p.x, p.y - 3, 4.5, 0, Math.PI * 2); ctx.fill();
    if (p.state === 'flee') { ctx.fillStyle = '#fff'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText('!', p.x, p.y - 14); }
  }
  // Gang NPCs for mission 3
  for (const n of state.gang || []) {
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(n.x, n.y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd7a8'; ctx.beginPath(); ctx.arc(n.x, n.y - 3, 4.5, 0, Math.PI * 2); ctx.fill();
  }
  // Mission marker beam
  const marker = state.marker;
  if (marker) {
    const pulse = 1 + Math.sin(state.time * 5) * 0.12;
    ctx.fillStyle = marker.deliver ? 'rgba(80,255,140,0.3)' : 'rgba(255,205,50,0.32)';
    ctx.beginPath(); ctx.arc(marker.x, marker.y, 46 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = marker.deliver ? '#3ddc74' : '#ffcd32';
    ctx.beginPath(); ctx.moveTo(marker.x, marker.y - 86 - Math.sin(state.time * 4) * 7); ctx.lineTo(marker.x - 15, marker.y - 116 - Math.sin(state.time * 4) * 7); ctx.lineTo(marker.x + 15, marker.y - 116 - Math.sin(state.time * 4) * 7); ctx.closePath(); ctx.fill();
  }
  // Player on foot
  if (!state.player.car) {
    const p = state.player;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(p.x + 3, p.y + 6, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd60a'; ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1d3557'; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd7a8'; ctx.beginPath(); ctx.arc(p.x + Math.cos(p.angle) * 4, p.y + Math.sin(p.angle) * 4 - 2, 5, 0, Math.PI * 2); ctx.fill();
    // Aim line when armed
    if (state.combat.hasGun) { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.cos(p.angle) * 34, p.y + Math.sin(p.angle) * 34); ctx.stroke(); }
  }
  // Bullets / tracers
  ctx.strokeStyle = '#fff3b0'; ctx.lineWidth = 3;
  for (const b of state.combat.bullets) { ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02); ctx.stroke(); }
  // Particles
  for (const pt of state.particles) { ctx.globalAlpha = Math.max(0, pt.life); ctx.fillStyle = pt.color; ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size); }
  ctx.globalAlpha = 1;
  ctx.restore();
  // Warm vignette
  const v = ctx.createRadialGradient(640, 360, 320, 640, 360, 760);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(90,30,0,0.28)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, 1280, 720);
}
export function drawCar(ctx, car, state) {
  ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-car.w / 2 + 4, -car.h / 2 + 5, car.w, car.h);
  if (car.health < 45) { ctx.fillStyle = 'rgba(80,80,80,0.55)'; ctx.beginPath(); ctx.arc(car.w / 4, 0, 10 + Math.random() * 5, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = car.color; ctx.fillRect(-car.w / 2, -car.h / 2, car.w, car.h);
  ctx.fillStyle = car.isPolice ? '#222' : 'rgba(20,30,50,0.85)';
  ctx.fillRect(-car.w / 6, -car.h / 2 + 3, car.w / 3, car.h - 6);
  ctx.fillStyle = '#ffe66d'; ctx.fillRect(car.w / 2 - 4, -car.h / 2 + 3, 4, 5); ctx.fillRect(car.w / 2 - 4, car.h / 2 - 8, 4, 5);
  if (car.isPolice) {
    ctx.fillStyle = (Math.floor((state ? state.time : 0) * 4) % 2 === 0) ? '#ff2e4d' : '#2e6bff';
    ctx.fillRect(-6, -5, 12, 10);
    ctx.fillStyle = '#111'; ctx.font = 'bold 8px system-ui'; ctx.textAlign = 'center'; ctx.fillText('POLICE', 0, -car.h / 2 - 4);
  }
  ctx.restore();
  if (car.isTarget) { ctx.fillStyle = '#ffcd32'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center'; ctx.fillText('▼ STEAL ME', car.x, car.y - 34); }
}
