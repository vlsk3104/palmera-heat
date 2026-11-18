// Deterministic screenshot scenes behind ?shot=cover|chase|mission|story.
// Each scene builds the real world, drives it with an autopilot, and returns the screen to paint.
import { createGameState, stepGame, enterNearestCar } from './world.js';
import { commitCrime } from './wanted.js';
import { createCar } from './vehicles.js';

function ctrlToward(state, tx, ty, inCar) {
  const p = state.player;
  const dx = tx - p.x, dy = ty - p.y;
  return { moveX: Math.abs(dx) > 18 ? Math.sign(dx) : 0, moveY: Math.abs(dy) > 18 ? Math.sign(dy) : 0, enter: false, shove: false, shoot: false, handbrake: false, sprint: true, aimAngle: null };
}
function runSteps(state, n, target) {
  for (let i = 0; i < n; i++) stepGame(state, ctrlToward(state, target.x, target.y, !!state.player.car), 1 / 60);
}
export function stageShot(name, seed) {
  const state = createGameState(seed);
  state.screen = 'play';
  if (name === 'chase') {
    // Player in a sports car downtown, three stars, patrol in pursuit.
    state.player.x = 1825; state.player.y = 1825;
    enterNearestCar(state);
    if (!state.player.car) { const c = createCar(1825, 1825, 0, 'kestrel', {}); state.player.car = c; state.player.x = c.x; state.player.y = c.y; }
    commitCrime(state.wanted, 70);
    state.missions.banner = 'Lose the cops — break line of sight or find a SPRAY GARAGE.'; state.missions.bannerTimer = 99;
    runSteps(state, 115, { x: 2500, y: 1825 });
    // Frame the pursuit: bring two patrol units in close behind the player car,
    // angled onto the road, so the chase reads clearly in a single still.
    const p = state.player;
    // Put the player car squarely on the eastbound downtown road for a clean chase frame.
    p.x = 2150; p.y = 2025; p.angle = 0;
    if (p.car) { p.car.x = 2150; p.car.y = 2025; p.car.angle = 0; p.car.speed = 210; }
    state.policeCars = state.policeCars.slice(0, 3);
    if (state.policeCars[0]) { state.policeCars[0].x = p.x - 130; state.policeCars[0].y = p.y - 20; state.policeCars[0].angle = 0.15; }
    if (state.policeCars[1]) { state.policeCars[1].x = p.x - 230; state.policeCars[1].y = p.y + 22; state.policeCars[1].angle = -0.1; }
    if (state.policeCars[2]) { state.policeCars[2].x = p.x - 330; state.policeCars[2].y = p.y - 18; state.policeCars[2].angle = 0.1; }
    state.wanted.seen = true;
    return { state, screen: 'play' };
  }
  if (name === 'mission') {
    // On foot at the port for Mission 3, gang nearby, banner up.
    state.player.x = 2880; state.player.y = 1560; state.player.angle = 0.6;
    state.missions.storyIndex = 2;
    state.gang = [{ x: 2960, y: 1500, health: 55 }, { x: 2990, y: 1560, health: 55 }, { x: 2930, y: 1600, health: 55 }];
    state.missions.banner = 'Marisol Vega: Face the Marlins crew at the port, then run.'; state.missions.bannerTimer = 99;
    state.marker = { x: 2950, y: 1500, deliver: false };
    state.combat.hasGun = true; state.combat.ammo = 24;
    runSteps(state, 40, { x: 2950, y: 1500 });
    state.marker = { x: 2950, y: 1500, deliver: false };
    return { state, screen: 'play' };
  }
  if (name === 'story') {
    state.missions.complete = true; state.missions.storyIndex = 4;
    state.game.cash = 3620; state.game.earned = 4850; state.game.missionsDone = 7; state.game.palmsFound = 6; state.game.carsStolen = 9; state.game.maxStars = 5; state.game.playSeconds = 754;
    state.player.x = 1825; state.player.y = 2400;
    runSteps(state, 60, { x: 2000, y: 2400 });
    return { state, screen: 'victory' };
  }
  // cover (default): driving downtown at golden hour with a mission marker ahead.
  state.player.x = 1500; state.player.y = 1825;
  enterNearestCar(state);
  if (!state.player.car) { const c = createCar(1500, 1825, 0, 'kestrel', {}); state.player.car = c; state.player.x = c.x; state.player.y = c.y; }
  state.missions.banner = 'Marisol Vega: Steal the gold Kestrel by the marina, deliver it to Sol Spray.'; state.missions.bannerTimer = 99;
  runSteps(state, 120, { x: 2725, y: 2400 });
  return { state, screen: 'play' };
}
