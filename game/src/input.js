// Keyboard and mouse input: held keys, one-shot presses, mouse aim.
export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const mouse = { x: 640, y: 360, down: false };
  window.addEventListener('keydown', (e) => {
    if (!e.repeat) pressed.add(e.code);
    keys.add(e.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => { keys.clear(); mouse.down = false; });
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (1280 / r.width);
    mouse.y = (e.clientY - r.top) * (720 / r.height);
  });
  canvas.addEventListener('pointerdown', () => { mouse.down = true; pressed.add('MouseDown'); });
  window.addEventListener('pointerup', () => { mouse.down = false; });
  return {
    keys, mouse,
    down(...codes) { return codes.some((c) => keys.has(c)); },
    wasPressed(code) { const p = pressed.has(code); if (p) pressed.delete(code); return p; },
    axis() {
      return {
        x: (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0),
        y: (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0),
      };
    },
    clearPressed() { pressed.clear(); },
  };
}
