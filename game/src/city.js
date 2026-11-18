// City generation: road grid, buildings, garages, palms, ramps and districts for Palmera City.
import { WORLD, DISTRICTS } from './config.js';
import { mulberry32, randRange, pick } from './random.js';

export function districtAt(x, y) {
  for (const d of DISTRICTS) if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d;
  return DISTRICTS[0];
}
export function roadCenters() {
  const c = [];
  for (let p = WORLD.roadEvery / 2; p < WORLD.size; p += WORLD.roadEvery) c.push(p);
  return c;
}
export function isOnRoad(x, y) {
  const hw = WORLD.roadWidth / 2;
  for (const c of roadCenters()) if (Math.abs(x - c) < hw || Math.abs(y - c) < hw) return true;
  return false;
}
export function generateCity(seed) {
  const rng = mulberry32(seed * 7919 + 13);
  const centers = roadCenters();
  const buildings = [];
  const blockColors = ['#f4a261', '#e9c46a', '#a8dadc', '#f1fa8c', '#ffb4a2', '#b5838d', '#84a98c', '#e5989b'];
  for (let i = 0; i < centers.length - 1; i++) {
    for (let j = 0; j < centers.length - 1; j++) {
      const x0 = centers[i] + WORLD.roadWidth / 2 + WORLD.blockInset;
      const y0 = centers[j] + WORLD.roadWidth / 2 + WORLD.blockInset;
      const w = WORLD.roadEvery - WORLD.roadWidth - WORLD.blockInset * 2;
      const n = 1 + Math.floor(rng() * 2);
      for (let k = 0; k < n; k++) {
        const bw = w / n - 8;
        buildings.push({ x: x0 + k * (w / n) + 4, y: y0 + 8, w: bw, h: w - 30, color: pick(rng, blockColors), floors: 2 + Math.floor(rng() * 8), roof: pick(rng, ['#6d6875', '#495867', '#7f5539']) });
      }
    }
  }
  const palms = [];
  for (let i = 0; i < 90; i++) palms.push({ x: randRange(rng, 80, WORLD.size - 80), y: randRange(rng, 2850, 3450), s: randRange(rng, 0.8, 1.3) });
  for (let i = 0; i < 50; i++) { const x = randRange(rng, 60, WORLD.size - 60), y = randRange(rng, 60, 2800); if (!isOnRoad(x, y)) palms.push({ x, y, s: randRange(rng, 0.7, 1.1) }); }
  const garages = [
    { x: 1825, y: 1375, name: 'Sol Spray Garage' },
    { x: 2725, y: 1825, name: 'Puerto Paint Works' },
    { x: 925, y: 1825, name: 'Lomas Respray' },
  ];
  const ramps = [];
  for (let i = 0; i < 10; i++) ramps.push({ x: randRange(rng, 300, 3300), y: randRange(rng, 300, 3200), found: false, id: i });
  const pickups = [
    { x: 1600, y: 1600, kind: 'armour', taken: false },
    { x: 2900, y: 1500, kind: 'health', taken: false },
    { x: 800, y: 2200, kind: 'health', taken: false },
  ];
  return { buildings, palms, garages, ramps, pickups, centers };
}
export function collideBuildings(city, x, y, r) {
  for (const b of city.buildings) {
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return b;
  }
  return null;
}
export function nearestRoadPoint(x, y) {
  const centers = roadCenters();
  let bx = centers[0], by = centers[0], bd = Infinity;
  for (const cx of centers) for (const cy of centers) {
    const d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
    if (d < bd) { bd = d; bx = cx; by = cy; }
  }
  return { x: bx, y: by };
}
