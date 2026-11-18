// Palmera Heat — boot, fixed-step loop, screens, save and sound wiring.
import { STEP, SAVE_KEY, VIEW } from './config.js';
import { createGameState, stepGame } from './world.js';
import { createInput } from './input.js';
import { createCamera, stepCamera } from './camera.js';
import { createAudio } from './audio.js';
import { drawWorld } from './render.js';
import { drawHud } from './hud.js';
import { drawTitleScreen, drawPauseScreen, drawBustedScreen, drawWastedScreen, drawVictoryScreen, drawMissionToast } from './screens.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 20261118;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width; canvas.height = VIEW.height;
const status = document.getElementById('status');

function paint(state, cam, screen) {
  drawWorld(ctx, state, cam);
  if (screen === 'play' || screen === 'paused') drawHud(ctx, state);
  if (state.toastTimer > 0 && state.toast) drawMissionToast(ctx, state, state.toast, state.lastPay || 0);
  if (screen === 'title') drawTitleScreen(ctx, state, !!loadSave());
  else if (screen === 'paused') drawPauseScreen(ctx, state);
  else if (screen === 'busted') drawBustedScreen(ctx, state);
  else if (screen === 'wasted') drawWastedScreen(ctx, state);
  else if (screen === 'victory') drawVictoryScreen(ctx, state);
}
function loadSave() {
  try { const raw = window.localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function writeSave(state) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify({ cash: state.game.cash, earned: state.game.earned, storyIndex: state.missions.storyIndex, complete: state.missions.complete, missionsDone: state.game.missionsDone, palmsFound: state.game.palmsFound, carsStolen: state.game.carsStolen, x: Math.round(state.player.x), y: Math.round(state.player.y) }));
  } catch { /* storage off: play on without saving */ }
}
function applySave(state, save) {
  if (!save) return;
  state.game.cash = save.cash ?? state.game.cash;
  state.game.earned = save.earned ?? 0;
  state.game.missionsDone = save.missionsDone ?? 0;
  state.game.palmsFound = save.palmsFound ?? 0;
  state.game.carsStolen = save.carsStolen ?? 0;
  state.missions.storyIndex = save.storyIndex ?? 0;
  state.missions.complete = !!save.complete;
  if (save.x) { state.player.x = save.x; state.player.y = save.y; }
}
if (shotName) {
  const { state, screen } = stageShot(shotName, seed);
  state.audio = { isMuted: () => false };
  const cam = createCamera(); cam.x = state.player.x; cam.y = state.player.y; cam.zoom = state.player.car ? 0.9 : 1;
  let frames = 0;
  const renderShot = () => { paint(state, cam, screen); frames++; if (frames < 3) requestAnimationFrame(renderShot); else window.__shotReady = true; };
  requestAnimationFrame(renderShot);
} else {
  const state = createGameState(seed);
  applySave(state, loadSave());
  const input = createInput(canvas);
  const audio = createAudio();
  state.audio = audio;
  const cam = createCamera(); cam.x = state.player.x; cam.y = state.player.y;
  let screen = 'title';
  let acc = 0, last = performance.now(), saveTimer = 0, sirenTimer = 0;
  if (status) status.textContent = 'Palmera Heat. Press Enter to play.';
  function ctrlFromInput() {
    const ax = input.axis();
    let aimAngle = null;
    if (!state.player.car && state.combat.hasGun) {
      const wx = cam.x + (input.mouse.x - 640) / cam.zoom, wy = cam.y + (input.mouse.y - 360) / cam.zoom;
      aimAngle = Math.atan2(wy - state.player.y, wx - state.player.x);
    }
    return { moveX: ax.x, moveY: ax.y, enter: input.wasPressed('KeyE'), shove: input.wasPressed('KeyF'), shoot: input.mouse.down, handbrake: input.down('Space'), sprint: input.down('ShiftLeft', 'ShiftRight'), aimAngle };
  }
  function frame(now) {
    requestAnimationFrame(frame);
    acc += Math.min((now - last) / 1000, 0.25); last = now;
    if (input.wasPressed('KeyM')) audio.toggleMute();
    if (screen === 'title' && (input.wasPressed('Enter') || input.wasPressed('Space'))) { screen = 'play'; audio.startMusic(); if (status) status.textContent = 'Playing Palmera Heat.'; }
    else if (screen === 'play' && (input.wasPressed('Escape') || input.wasPressed('KeyP'))) screen = 'paused';
    else if (screen === 'paused' && (input.wasPressed('Escape') || input.wasPressed('KeyP') || input.wasPressed('Enter'))) screen = 'play';
    else if ((screen === 'busted' || screen === 'wasted' || screen === 'victory') && input.wasPressed('Enter')) { screen = 'play'; state.screen = 'play'; }
    if (screen === 'play' || screen === 'title') {
      while (acc >= STEP) {
        acc -= STEP;
        const demo = screen === 'title';
        const ctrl = demo ? { moveX: 0, moveY: -1, enter: false, shove: false, shoot: false, handbrake: false, sprint: false, aimAngle: null } : ctrlFromInput();
        if (demo && !state.player.car && state.time > 0.5 && state.time < 0.6) ctrl.enter = true;
        const events = stepGame(state, ctrl, STEP);
        if (!demo) {
          if (events.includes('shoot')) audio.shoot();
          if (events.includes('crash')) audio.crash();
          if (events.includes('pickup') || events.includes('repaint')) audio.pickup();
          if (events.includes('sting')) audio.sting();
          if (events.includes('enter')) audio.engine();
          sirenTimer -= STEP;
          if (events.includes('siren') && sirenTimer <= 0) { audio.siren(); sirenTimer = 1.4; }
          if (state.screen === 'busted') screen = 'busted';
          else if (state.screen === 'wasted') screen = 'wasted';
          else if (state.screen === 'victory') { screen = 'victory'; state.screen = 'play'; }
          saveTimer += STEP;
          if (saveTimer > 4) { saveTimer = 0; writeSave(state); }
        }
      }
      const focus = { x: state.player.x, y: state.player.y, vx: state.player.vx || 0, vy: state.player.vy || 0 };
      stepCamera(cam, 1 / 60, focus, state.player.car ? Math.abs(state.player.car.speed) : 0);
    } else acc = 0;
    input.clearPressed();
    paint(state, cam, screen);
  }
  requestAnimationFrame(frame);
}
