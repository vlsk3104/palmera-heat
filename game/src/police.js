// Police: spawning at map edges and pursuit AI that rams and pins the player.
import { createCar, stepCarPhysics } from './vehicles.js';
import { clamp } from './random.js';

export function desiredPoliceCount(stars) {
  if (stars <= 0) return 0;
  return Math.min(6, 1 + stars);
}
export function spawnPoliceUnit(player, existing) {
  const a = Math.random() * Math.PI * 2;
  const d = 620 + Math.random() * 200;
  const x = clamp(player.x + Math.cos(a) * d, 60, 3540);
  const y = clamp(player.y + Math.sin(a) * d, 60, 3540);
  const car = createCar(x, y, a + Math.PI, 'police', { isPolice: true });
  car.unitId = existing.length + Math.floor(Math.random() * 1000);
  return car;
}
export function stepPoliceCar(car, dt, playerPos, playerSpeed) {
  const dx = playerPos.x - car.x, dy = playerPos.y - car.y;
  const dist = Math.hypot(dx, dy);
  const targetAngle = Math.atan2(dy, dx);
  let diff = targetAngle - car.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const steer = clamp(diff * 2.2, -1, 1);
  // Aim slightly ahead of a moving player to intercept.
  const throttle = dist > 40 ? 1 : 0.2;
  stepCarPhysics(car, dt, throttle, steer, false);
  return dist;
}
export function policeSeesPlayer(policeCars, playerPos) {
  for (const c of policeCars) if (Math.hypot(c.x - playerPos.x, c.y - playerPos.y) < 430) return true;
  return false;
}
