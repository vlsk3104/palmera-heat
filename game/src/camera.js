// Camera: follows the player, leads with velocity, pulls back with driving speed.
import { clamp } from './random.js';
export function createCamera() {
  return { x: 1800, y: 1800, zoom: 1 };
}
export function stepCamera(cam, dt, focus, speed) {
  const lead = 0.35;
  const tx = focus.x + (focus.vx || 0) * lead;
  const ty = focus.y + (focus.vy || 0) * lead;
  const k = 1 - Math.pow(0.0015, dt);
  cam.x += (tx - cam.x) * k;
  cam.y += (ty - cam.y) * k;
  const targetZoom = speed > 160 ? 0.82 : speed > 60 ? 0.92 : 1;
  cam.zoom += (targetZoom - cam.zoom) * Math.min(1, dt * 2.5);
  cam.x = clamp(cam.x, 320, 3280); cam.y = clamp(cam.y, 200, 3400);
}
export function worldToScreen(cam, wx, wy) {
  return { x: (wx - cam.x) * cam.zoom + 640, y: (wy - cam.y) * cam.zoom + 360 };
}
