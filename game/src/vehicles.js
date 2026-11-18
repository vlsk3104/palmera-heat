// Vehicles: types, arcade driving physics, parked cars and traffic AI on the road grid.
import { CAR_TYPES, CAR_COLORS } from './config.js';
import { mulberry32, pick, randRange, clamp, angleLerp } from './random.js';
import { collideBuildings } from './city.js';

export function createCar(x, y, angle, typeKey, opts = {}) {
  const t = CAR_TYPES[typeKey];
  return { x, y, angle, speed: 0, type: typeKey, name: t.name, w: t.w, h: t.h, color: opts.color || t.color, health: 100, isPolice: !!opts.isPolice, isTraffic: !!opts.isTraffic, driver: opts.driver !== false, target: null, wait: 0, skid: [] };
}
export function spawnTraffic(city, seed, count) {
  const rng = mulberry32(seed * 31 + 7);
  const cars = [];
  const keys = ['ventura', 'kestrel', 'bulto', 'marea'];
  for (let i = 0; i < count; i++) {
    const horiz = rng() > 0.5;
    const c = city.centers[Math.floor(rng() * city.centers.length)];
    const along = randRange(rng, 100, 3500);
    const x = horiz ? along : c + (rng() > 0.5 ? 18 : -18);
    const y = horiz ? c + (rng() > 0.5 ? 18 : -18) : along;
    const angle = horiz ? (x > 1800 ? Math.PI : 0) : (y > 1800 ? -Math.PI / 2 : Math.PI / 2);
    cars.push(createCar(x, y, angle, pick(rng, keys), { isTraffic: true, color: pick(rng, CAR_COLORS) }));
  }
  return cars;
}
export function spawnParked(city, seed, count) {
  const rng = mulberry32(seed * 57 + 3);
  const cars = [];
  const keys = ['ventura', 'kestrel', 'bulto', 'marea'];
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, tries = 0;
    do { x = randRange(rng, 120, 3480); y = randRange(rng, 120, 3480); tries++; } while (tries < 20 && collideBuildings(city, x, y, 30));
    cars.push(createCar(x, y, Math.floor(rng() * 4) * Math.PI / 2, pick(rng, keys), { driver: false, color: pick(rng, CAR_COLORS) }));
  }
  return cars;
}
export function stepCarPhysics(car, dt, throttle, steer, handbrake) {
  const t = CAR_TYPES[car.type];
  if (throttle > 0) car.speed += t.accel * dt;
  else if (throttle < 0) car.speed -= (car.speed > 10 ? 260 : 120) * dt;
  else car.speed -= car.speed * 0.6 * dt;
  car.speed = clamp(car.speed, -110, t.top * (car.health / 100 * 0.4 + 0.6));
  const grip = handbrake ? t.grip * 0.45 : t.grip;
  if (Math.abs(car.speed) > 4) car.angle += steer * grip * dt * Math.sign(car.speed) * Math.min(1, Math.abs(car.speed) / 120);
  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
  car.x = clamp(car.x, 30, 3570); car.y = clamp(car.y, 30, 3570);
  if (handbrake && Math.abs(car.speed) > 90) {
    car.skid.push({ x: car.x, y: car.y, life: 2.5 });
    if (car.skid.length > 40) car.skid.shift();
  }
  for (const s of car.skid) s.life -= dt;
  car.skid = car.skid.filter((s) => s.life > 0);
}
export function nearestCenter(centers, v) {
  let best = centers[0], bd = Infinity;
  for (const c of centers) { const d = Math.abs(v - c); if (d < bd) { bd = d; best = c; } }
  return best;
}
export function stepTrafficCar(car, dt, city, playerPos) {
  // Lane keeping: ease the cross-axis position back to the nearest road centre lane,
  // so traffic reads as traffic — flowing along roads instead of drifting over blocks.
  const horizontal = Math.abs(Math.cos(car.angle)) > 0.7;
  const vertical = Math.abs(Math.sin(car.angle)) > 0.7;
  if (horizontal) {
    const lane = nearestCenter(city.centers, car.y) + (Math.cos(car.angle) > 0 ? 18 : -18);
    car.y += (lane - car.y) * Math.min(1, dt * 3.2);
  } else if (vertical) {
    const lane = nearestCenter(city.centers, car.x) + (Math.sin(car.angle) > 0 ? 18 : -18);
    car.x += (lane - car.x) * Math.min(1, dt * 3.2);
  }
  const aheadX = car.x + Math.cos(car.angle) * 70, aheadY = car.y + Math.sin(car.angle) * 70;
  let blocked = false;
  if (playerPos && Math.hypot(playerPos.x - aheadX, playerPos.y - aheadY) < 46) blocked = true;
  if (collideBuildings(city, aheadX, aheadY, 16)) blocked = true;
  const nearC = city.centers.some((c) => Math.abs(car.x - c) < 14) && city.centers.some((c) => Math.abs(car.y - c) < 14);
  if (nearC && Math.random() < 0.012) car.angle += (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2);
  const throttle = blocked ? -0.6 : 0.55;
  stepCarPhysics(car, dt, throttle, 0, false);
  if (blocked) car.speed *= 0.8;
  // Hard guarantee: a traffic car never ends a step inside a building.
  if (collideBuildings(city, car.x, car.y, 15)) {
    car.x -= Math.cos(car.angle) * car.speed * dt * 2;
    car.y -= Math.sin(car.angle) * car.speed * dt * 2;
    car.speed *= -0.3;
  }
}
export function damageCar(car, amount) { car.health = Math.max(0, car.health - amount); return car.health <= 0; }
export { angleLerp };
