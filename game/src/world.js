// DOM-free world simulation for Palmera Heat. Runs in the browser and headless in Node.
// Owns player, cars, peds, police, wanted, combat, missions, particles and win/lose state.
import { generateCity, collideBuildings, districtAt } from './city.js';
import { spawnTraffic, spawnParked, stepTrafficCar, stepCarPhysics, createCar, damageCar } from './vehicles.js';
import { createPedestrians, stepPedestrians } from './pedestrians.js';
import { createWanted, commitCrime, stepWanted, clearWanted } from './wanted.js';
import { desiredPoliceCount, spawnPoliceUnit, stepPoliceCar, policeSeesPlayer } from './police.js';
import { createCombat, stepCombat, meleeShove, tryShoot } from './combat.js';
import { createMissionState, startNextStory, startTaxi, startCourier, stepMission, finishMission, STORY } from './missions.js';
import { clamp } from './random.js';

export function createGameState(seed) {
  const city = generateCity(seed);
  const traffic = spawnTraffic(city, seed, 16);
  const parked = spawnParked(city, seed, 18);
  // Story target car for mission 1: gold Kestrel near the marina.
  const targetCar = createCar(2725, 2660, -Math.PI / 2, 'kestrel', { driver: false, color: '#ffd60a' });
  targetCar.isTarget = true;
  parked.push(targetCar);
  const state = {
    seed, city, traffic, parked, targetCar,
    policeCars: [], peds: createPedestrians(seed, 34), gang: [], rival: null,
    player: { x: 1825, y: 1950, angle: -Math.PI / 2, car: null, vx: 0, vy: 0 },
    wanted: createWanted(), combat: createCombat(), missions: createMissionState(),
    game: { cash: 120, earned: 0, health: 100, armour: 0, missionsDone: 0, palmsFound: 0, carsStolen: 0, maxStars: 0, playSeconds: 0, lastFine: 0, shake: 0, regenTimer: 0 },
    particles: [], time: 0, marker: null, prompt: '', screen: 'title',
    bustTimer: 0, toast: null, toastTimer: 0, sideCooldown: 6, jobMarker: null, jobKind: 'taxi',
    events: [], garageCooldown: 0,
  };
  refreshMarker(state);
  return state;
}
export function refreshMarker(state) {
  const ms = state.missions;
  if (ms.active) {
    const dest = ms.phase === 'goto' ? ms.active.target : ms.active.deliver;
    state.marker = { x: dest.x, y: dest.y, deliver: ms.phase !== 'goto' };
  } else if (ms.side) {
    const dest = ms.side.phase === 'pickup' ? ms.side.target : ms.side.deliver;
    state.marker = { x: dest.x, y: dest.y, deliver: ms.side.phase !== 'pickup' };
  } else if (!ms.complete) {
    const next = STORY[ms.storyIndex];
    state.marker = { x: next.target.x, y: next.target.y, deliver: false };
  } else if (state.jobMarker) {
    state.marker = { x: state.jobMarker.x, y: state.jobMarker.y, deliver: false };
  } else state.marker = null;
}
function burst(state, x, y, color, n, size) {
  for (let i = 0; i < n; i++) state.particles.push({ x, y, vx: (Math.random() - 0.5) * 160, vy: (Math.random() - 0.5) * 160, life: 0.5 + Math.random() * 0.4, color, size: size || 5 });
}
function crime(state, sev, x, y) { commitCrime(state.wanted, sev); burst(state, x, y, '#ffd60a', 4, 4); }

export function nearestCar(state, maxD) {
  let best = null, bd = maxD;
  for (const c of [...state.parked, ...state.traffic]) {
    const d = Math.hypot(c.x - state.player.x, c.y - state.player.y);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}
export function enterNearestCar(state) {
  const car = nearestCar(state, 62);
  if (!car) return false;
  if (car.driver) { car.driver = false; crime(state, 20, car.x, car.y); state.events.push('yank'); }
  else crime(state, 10, car.x, car.y);
  if (car.isTarget) car.isTarget = false;
  state.player.car = car;
  const pi = state.parked.indexOf(car); if (pi >= 0) state.parked.splice(pi, 1);
  const ti = state.traffic.indexOf(car); if (ti >= 0) state.traffic.splice(ti, 1);
  state.game.carsStolen += 1;
  state.events.push('enter');
  return true;
}
export function exitCar(state) {
  const car = state.player.car; if (!car) return;
  car.speed = 0; state.parked.push(car);
  state.player.x = car.x + Math.cos(car.angle + Math.PI / 2) * 34;
  state.player.y = car.y + Math.sin(car.angle + Math.PI / 2) * 34;
  state.player.car = null;
  state.events.push('exit');
}
function respawn(state, fine, screen) {
  state.game.lastFine = fine;
  state.game.cash = Math.max(0, state.game.cash - fine);
  state.game.health = 100; state.wanted.stars = 0; state.wanted.heat = 0;
  state.policeCars = [];
  if (state.player.car) { state.player.car = null; }
  state.player.x = 1825; state.player.y = 1950;
  state.screen = screen; state.bustTimer = 0;
}

export function stepGame(state, ctrl, dt) {
  state.events.length = 0;
  state.time += dt; state.game.playSeconds += dt;
  const p = state.player, g = state.game;
  if (state.toastTimer > 0) state.toastTimer -= dt;
  if (state.garageCooldown > 0) state.garageCooldown -= dt;
  // --- Player movement ---
  if (p.car) {
    const before = p.car.speed;
    stepCarPhysics(p.car, dt, -ctrl.moveY, ctrl.moveX, ctrl.handbrake);
    if (collideBuildings(state.city, p.car.x, p.car.y, 20)) { p.car.x -= Math.cos(p.car.angle) * p.car.speed * dt; p.car.y -= Math.sin(p.car.angle) * p.car.speed * dt; if (Math.abs(p.car.speed) > 90) { damageCar(p.car, 7); g.shake = 9; state.events.push('crash'); crime(state, 6, p.car.x, p.car.y); } p.car.speed *= -0.25; }
    p.x = p.car.x; p.y = p.car.y; p.angle = p.car.angle;
    p.vx = Math.cos(p.car.angle) * p.car.speed; p.vy = Math.sin(p.car.angle) * p.car.speed;
    if (Math.abs(before) < 5 && Math.abs(p.car.speed) >= 5) state.events.push('engine');
    // Run-over checks (non-graphic: peds dive away, small chance of injury report)
    for (const ped of state.peds) if (Math.abs(p.car.speed) > 120 && Math.hypot(ped.x - p.x, ped.y - p.y) < 24) { ped.state = 'flee'; ped.x += 40; crime(state, 16, ped.x, ped.y); }
    if (state.rival && Math.hypot(state.rival.x - p.x, state.rival.y - p.y) < 40 && Math.abs(p.car.speed) > 100) { damageCar(state.rival, 12); g.shake = 8; state.events.push('crash'); }
  } else {
    const sprint = ctrl.sprint ? 1.45 : 1;
    const sp = 215 * sprint;
    let mx = ctrl.moveX, my = ctrl.moveY;
    const len = Math.hypot(mx, my) || 1;
    if (mx || my) { p.angle = Math.atan2(my, mx); }
    const nx = clamp(p.x + (mx / len) * sp * dt * (mx || my ? 1 : 0), 16, 3584);
    const ny = clamp(p.y + (my / len) * sp * dt * (mx || my ? 1 : 0), 16, 3584);
    if (!collideBuildings(state.city, nx, ny, 12)) { p.vx = (nx - p.x) / dt; p.vy = (ny - p.y) / dt; p.x = nx; p.y = ny; }
    if (ctrl.aimAngle !== null && ctrl.aimAngle !== undefined) p.angle = ctrl.aimAngle;
  }
  if (ctrl.enter) { if (p.car) exitCar(state); else enterNearestCar(state); }
  // --- Combat ---
  if (ctrl.shoot && !p.car) { if (tryShoot(state.combat, p, p.angle)) { crime(state, 12, p.x, p.y); state.events.push('shoot'); } }
  if (ctrl.shove && !p.car) {
    const targets = [...state.gang, ...state.peds.map((q) => ({ x: q.x, y: q.y, health: 50, ped: q }))];
    const hit = meleeShove(p, targets);
    if (hit) { crime(state, 14, p.x, p.y); state.events.push('shove'); burst(state, p.x, p.y, '#fff', 5, 4); if (hit.ped) hit.ped.state = 'flee'; }
  }
  const combatTargets = [...state.gang];
  if (state.rival) combatTargets.push(state.rival);
  const hits = stepCombat(state.combat, dt, combatTargets);
  if (hits.length) state.events.push('hit');
  state.gang = state.gang.filter((n) => n.health > 0);
  if (state.rival && state.rival.health <= 0) { burst(state, state.rival.x, state.rival.y, '#ff8c42', 18, 7); state.rival = null; state.missions.banner = 'Rival disabled! Now reach the beach hideout.'; state.missions.bannerTimer = 5; }
  // Gang pressure in mission 3 zone
  if (state.missions.active && state.missions.active.id === 'debt' && state.missions.phase === 'deliver') {
    g.regenTimer += dt;
    if (g.regenTimer > 2.2) { g.regenTimer = 0; damagePlayer(state, 6); }
  }
  // --- Traffic & peds ---
  for (const c of state.traffic) stepTrafficCar(c, dt, state.city, p);
  const threat = p.car && Math.abs(p.car.speed) > 130 ? p : null;
  stepPedestrians(state.peds, dt, threat);
  // --- Wanted & police ---
  const seen = policeSeesPlayer(state.policeCars, p);
  stepWanted(state.wanted, dt, seen || state.wanted.stars === 0);
  g.maxStars = Math.max(g.maxStars, state.wanted.stars);
  const want = desiredPoliceCount(state.wanted.stars);
  while (state.policeCars.length < want) state.policeCars.push(spawnPoliceUnit(p, state.policeCars));
  if (state.wanted.stars === 0 && state.policeCars.length) state.policeCars = state.policeCars.filter((c) => Math.hypot(c.x - p.x, c.y - p.y) < 700);
  let nearestCop = Infinity;
  for (const c of state.policeCars) {
    const px = c.x, py = c.y;
    const d = stepPoliceCar(c, dt, p, p.car ? p.car.speed : 0);
    // Patrol cars route around blocks: never end a step inside a building.
    if (collideBuildings(state.city, c.x, c.y, 16)) { c.x = px; c.y = py; c.angle += Math.PI / 2; c.speed *= 0.4; }
    nearestCop = Math.min(nearestCop, d);
    if (d < 42 && p.car && Math.abs(p.car.speed) > 60) { damageCar(p.car, 3); g.shake = 6; }
  }
  if (state.policeCars.length) state.events.push('siren');
  // Busted check: boxed in or caught on foot
  const playerSpeed = p.car ? Math.abs(p.car.speed) : Math.hypot(p.vx || 0, p.vy || 0);
  if (state.wanted.stars >= 1 && nearestCop < 72 && playerSpeed < 42) state.bustTimer += dt; else state.bustTimer = Math.max(0, state.bustTimer - dt);
  if (state.bustTimer > 2.4) { respawn(state, 150 + state.wanted.stars * 50, 'busted'); state.events.push('busted'); return state.events; }
  // --- Garages clear wanted ---
  for (const gar of state.city.garages) {
    if (p.car && Math.hypot(p.x - gar.x, p.y - gar.y) < 58 && state.wanted.stars > 0 && g.cash >= 200 && state.garageCooldown <= 0) {
      g.cash -= 200; clearWanted(state.wanted); state.policeCars = [];
      p.car.color = ['#06d6a0', '#c77dff', '#118ab2', '#f78c6b'][Math.floor(Math.random() * 4)];
      state.garageCooldown = 5; state.events.push('repaint');
      state.missions.banner = 'Fresh paint, fresh plates. Wanted cleared.'; state.missions.bannerTimer = 4;
    }
  }
  // --- Pickups & palms ---
  for (const pk of state.city.pickups) {
    if (!pk.taken && Math.hypot(p.x - pk.x, p.y - pk.y) < 30) { pk.taken = true; if (pk.kind === 'health') g.health = Math.min(100, g.health + 45); else g.armour = 100; state.events.push('pickup'); }
  }
  for (const r of state.city.ramps) if (!r.found && Math.hypot(p.x - r.x, p.y - r.y) < 30) { r.found = true; g.palmsFound += 1; g.cash += 50; state.events.push('pickup'); state.missions.banner = `Hidden palm ${g.palmsFound}/10 found! +$50`; state.missions.bannerTimer = 3; }
  // Mission 2 grants the pistol
  if (state.missions.storyIndex >= 2 && !state.combat.hasGun) { state.combat.hasGun = true; state.combat.ammo = 40; }
  // --- Missions flow ---
  handleMissionFlow(state, dt);
  // Health regen out of trouble
  if (nearestCop > 200 && state.gang.length === 0) g.health = Math.min(100, g.health + dt * 2.2);
  if (g.health <= 0) { respawn(state, 200, 'wasted'); state.events.push('wasted'); return state.events; }
  // Particles
  for (const pt of state.particles) { pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt; }
  state.particles = state.particles.filter((q) => q.life > 0);
  if (g.shake > 0) g.shake = Math.max(0, g.shake - dt * 26);
  // Prompt
  state.prompt = '';
  if (!p.car) { const c = nearestCar(state, 62); if (c) state.prompt = `E — enter ${c.name}${c.driver ? ' (driver inside!)' : ''}`; }
  refreshMarker(state);
  return state.events;
}
export function damagePlayer(state, amount) {
  const g = state.game;
  if (g.armour > 0) { const absorbed = Math.min(g.armour, amount * 0.7); g.armour -= absorbed; amount -= absorbed; }
  g.health -= amount;
}
function handleMissionFlow(state, dt) {
  const ms = state.missions, p = state.player;
  // Start story mission by reaching its marker on foot or by car
  if (!ms.active && !ms.side && !ms.complete) {
    const next = STORY[ms.storyIndex];
    if (Math.hypot(p.x - next.target.x, p.y - next.target.y) < 85) {
      startNextStory(ms);
      state.events.push('sting');
      if (next.id === 'package') { /* pursuit comes from stars below */ }
      if (next.id === 'debt') { /* gang spawns on phase change */ }
      if (next.id === 'harbour' && !state.rival) { state.rival = createCar(2950, 2450, Math.PI, 'ventura', { color: '#9d4edd' }); state.rival.health = 70; }
      // Immediately count arrival as phase progress
      ms.phase = 'deliver'; ms.timer = 170;
      if (next.id === 'wheels') commitCrime(state.wanted, 24);
      if (next.id === 'package') commitCrime(state.wanted, 46);
      if (next.id === 'debt') { commitCrime(state.wanted, 66); for (let i = 0; i < 3; i++) state.gang.push({ x: next.target.x + 40 + i * 30, y: next.target.y + 30, health: 55 }); }
      if (next.id === 'harbour') commitCrime(state.wanted, 60);
      return;
    }
  }
  // Side job markers when free roaming after story or between missions
  if (!ms.active && !ms.side) {
    state.sideCooldown -= dt;
    if (state.sideCooldown <= 0 && !state.jobMarker) {
      state.jobKind = Math.random() > 0.5 ? 'taxi' : 'courier';
      state.jobMarker = state.jobKind === 'taxi' ? { x: 1375, y: 2275 } : { x: 2275, y: 925 };
    }
    if (state.jobMarker && Math.hypot(p.x - state.jobMarker.x, p.y - state.jobMarker.y) < 85) {
      if (state.jobKind === 'taxi') startTaxi(ms, state.jobMarker, { x: 2725, y: 925 });
      else startCourier(ms, state.jobMarker, { x: 925, y: 2725 });
      ms.side.phase = 'deliver'; state.jobMarker = null; state.events.push('sting');
      return;
    }
  }
  if (ms.active || ms.side) {
    const res = stepMission(ms, dt, p);
    if (res === 'done') {
      const wasStory = !!ms.active;
      const pay = finishMission(ms, state.game);
      state.toast = 'done'; state.toastTimer = 3; state.events.push('sting');
      state.sideCooldown = 8;
      if (wasStory && ms.complete) { state.screen = 'victory'; state.events.push('victory'); }
      if (pay) state.lastPay = pay;
    } else if (res === 'failed') {
      state.toast = 'failed'; state.toastTimer = 3;
      if (ms.active) { ms.active = null; } else ms.side = null;
      state.sideCooldown = 5;
    }
  }
}
export function simulateHeadless(seed, steps) {
  const s = createGameState(seed);
  const ctrl = { moveX: 1, moveY: 0, enter: false, shove: false, shoot: false, handbrake: false, sprint: false, aimAngle: null };
  for (let i = 0; i < steps; i++) { if (i === 30) ctrl.enter = true; stepGame(s, ctrl, 1 / 60); ctrl.enter = false; }
  return { x: Math.round(s.player.x), y: Math.round(s.player.y), cars: s.traffic.length + s.parked.length, peds: s.peds.length, ok: true };
}
export { districtAt };
