// Screens: title, pause, help, busted, wasted and story-complete victory panels.
export function drawPanel(ctx, title, lines, prompt, accent) {
  ctx.fillStyle = 'rgba(10,12,20,0.78)'; ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = accent || '#ff9e57'; ctx.fillRect(340, 128, 600, 6);
  ctx.fillStyle = '#101828'; ctx.fillRect(340, 134, 600, 430);
  ctx.fillStyle = '#ffd9a0'; ctx.font = 'bold 44px system-ui'; ctx.textAlign = 'center';
  ctx.fillText(title, 640, 205);
  ctx.fillStyle = '#f1faee'; ctx.font = '19px system-ui';
  lines.forEach((ln, i) => ctx.fillText(ln, 640, 258 + i * 32));
  ctx.fillStyle = '#ffd60a'; ctx.font = 'bold 20px system-ui';
  ctx.fillText(prompt, 640, 528);
}
export function drawTitleScreen(ctx, state, hasSave) {
  drawPanel(ctx, 'PALMERA HEAT', [
    'An open-world crime story in sun-soaked Palmera City.',
    'Steal cars · Outrun the law · Run Marisol Vega\'s jobs.',
    '',
    'WASD move / drive · E enter car · F shove · Click shoot',
    'Space handbrake · Esc pause · M mute',
    hasSave ? 'Saved game found — your cash and story are kept.' : 'Progress saves automatically in this browser.',
  ], 'Press ENTER to play', '#ef476f');
}
export function drawPauseScreen(ctx, state) {
  drawPanel(ctx, 'PAUSED', [
    `Cash $${state.game.cash} · Earned $${state.game.earned}`,
    `Missions done: ${state.game.missionsDone} · Palms found: ${state.game.palmsFound}/10`,
    '', 'Controls: WASD · E car · F shove · Click shoot',
    'Repaint at a SPRAY GARAGE to clear wanted stars ($200).',
  ], 'Esc / P — resume', '#118ab2');
}
export function drawBustedScreen(ctx, state) {
  drawPanel(ctx, 'BUSTED', ['The patrol boxed you in.', `Fine paid: $${state.game.lastFine}`, 'You wake up outside the station. Car impounded.'], 'Press ENTER to continue', '#2e6bff');
}
export function drawWastedScreen(ctx, state) {
  drawPanel(ctx, 'WASTED', ['You wake up at Palmera General.', `Hospital bill: $${state.game.lastFine}`, 'The city is still out there waiting.'], 'Press ENTER to continue', '#ef476f');
}
export function drawVictoryScreen(ctx, state) {
  const mins = Math.floor(state.game.playSeconds / 60), secs = Math.floor(state.game.playSeconds % 60);
  drawPanel(ctx, 'CITY CONQUERED ★', [
    'Harbour Lights complete — Marisol Vega owns the docks now.',
    `Cash $${state.game.cash} · Total earned $${state.game.earned}`,
    `Missions: ${state.game.missionsDone} · Palms: ${state.game.palmsFound}/10 · Time ${mins}:${String(secs).padStart(2, '0')}`,
    `Cars stolen: ${state.game.carsStolen} · Top wanted: ${state.game.maxStars} stars`,
    'Free roam continues — taxi & courier jobs still pay.',
  ], 'Press ENTER to keep roaming', '#ffd60a');
}
export function drawMissionToast(ctx, state, kind, pay) {
  ctx.fillStyle = 'rgba(12,30,16,0.9)'; ctx.fillRect(390, 180, 500, 92);
  ctx.fillStyle = '#7bf1a8'; ctx.font = 'bold 28px system-ui'; ctx.textAlign = 'center';
  ctx.fillText(kind === 'done' ? 'MISSION COMPLETE' : 'MISSION FAILED', 640, 220);
  ctx.fillStyle = '#fff'; ctx.font = '18px system-ui';
  ctx.fillText(kind === 'done' ? `+$${pay} paid by Marisol Vega` : 'No pay. Find the marker to retry.', 640, 252);
}
