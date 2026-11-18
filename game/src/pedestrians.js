// Pedestrians: sidewalk walkers with walk, flee and panic states.
import { mulberry32, pick, randRange } from './random.js';
const SHIRTS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ff8b94', '#88d8b0', '#f7cac9'];
export function createPedestrians(seed, count) {
  const rng = mulberry32(seed * 101 + 19);
  const peds = [];
  for (let i = 0; i < count; i++) {
    peds.push({ x: randRange(rng, 100, 3500), y: randRange(rng, 100, 3500), angle: rng() * Math.PI * 2, speed: randRange(rng, 28, 52), state: 'walk', timer: randRange(rng, 2, 6), color: pick(rng, SHIRTS), name: 'walker' });
  }
  return peds;
}
export function stepPedestrians(peds, dt, threat) {
  for (const p of peds) {
    p.timer -= dt;
    if (threat && Math.hypot(p.x - threat.x, p.y - threat.y) < 130) p.state = 'flee';
    else if (p.timer <= 0) { p.state = 'walk'; p.angle = Math.random() * Math.PI * 2; p.timer = 2 + Math.random() * 5; }
    const sp = p.state === 'flee' ? p.speed * 2.1 : p.speed;
    if (p.state === 'flee' && threat) p.angle = Math.atan2(p.y - threat.y, p.x - threat.x);
    p.x += Math.cos(p.angle) * sp * dt;
    p.y += Math.sin(p.angle) * sp * dt;
    p.x = Math.max(20, Math.min(3580, p.x)); p.y = Math.max(20, Math.min(3580, p.y));
    if (p.state === 'flee' && p.timer <= -3) { p.state = 'walk'; p.timer = 3; }
  }
}
