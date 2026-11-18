// Missions: a 4-part story chain from fixer Marisol Vega, plus taxi and courier side jobs.
export const STORY = [
  { id: 'wheels', title: 'Mission 1 · First Wheels', from: 'Marisol Vega', text: 'Steal the gold Kestrel by the marina and deliver it to Sol Spray Garage.', target: { x: 2725, y: 2725 }, deliver: { x: 1825, y: 1375 }, pay: 450, stars: 1 },
  { id: 'package', title: 'Mission 2 · Package Run', from: 'Marisol Vega', text: 'Grab the package downtown and run it to Puerto Este. Expect company.', target: { x: 1825, y: 1825 }, deliver: { x: 2725, y: 1825 }, pay: 700, stars: 2 },
  { id: 'debt', title: 'Mission 3 · Bad Debt', from: 'Marisol Vega', text: 'Face the Marlins crew at the port, then lose the heat and reach the hideout.', target: { x: 2950, y: 1500 }, deliver: { x: 925, y: 2275 }, pay: 950, stars: 3 },
  { id: 'harbour', title: 'Mission 4 · Harbour Lights', from: 'Marisol Vega', text: 'Run down the rival Ventura fleeing the harbour, then make the beach hideout.', target: { x: 2900, y: 2500 }, deliver: { x: 1400, y: 3150 }, pay: 1400, stars: 3 },
];
export function createMissionState() {
  return { storyIndex: 0, active: null, phase: 'goto', timer: 0, side: null, complete: false, banner: '', bannerTimer: 0, rival: null };
}
export function startNextStory(ms) {
  if (ms.storyIndex >= STORY.length) { ms.complete = true; return null; }
  const m = STORY[ms.storyIndex];
  ms.active = m; ms.phase = 'goto'; ms.timer = 150;
  ms.banner = `${m.from}: ${m.text}`; ms.bannerTimer = 7;
  return m;
}
export function startTaxi(ms, pickup, drop) {
  ms.side = { kind: 'Taxi fare', target: pickup, deliver: drop, phase: 'pickup', timer: 90, pay: 180 };
  ms.banner = 'Taxi: pick up the fare, then deliver them fast for a bonus.'; ms.bannerTimer = 5;
}
export function startCourier(ms, pickup, drop) {
  ms.side = { kind: 'Courier drop', target: pickup, deliver: drop, phase: 'pickup', timer: 100, pay: 220 };
  ms.banner = 'Courier: collect the parcel and drop it across town.'; ms.bannerTimer = 5;
}
export function currentObjective(ms) {
  const job = ms.active || ms.side;
  if (!job) return ms.complete ? 'Story complete — free roam Palmera City, run taxi & courier jobs' : 'Find the gold marker to start the next job';
  if (ms.phase === 'goto' || (ms.side && ms.side.phase === 'pickup')) return `${job.title || job.kind} — reach the gold marker`;
  return `${job.title || job.kind} — deliver to the green marker`;
}
export function stepMission(ms, dt, playerPos) {
  if (ms.bannerTimer > 0) ms.bannerTimer -= dt;
  const job = ms.active || ms.side;
  if (!job) return null;
  ms.timer -= dt;
  if (ms.timer <= 0) return 'failed';
  const dest = (ms.active ? (ms.phase === 'goto' ? job.target : job.deliver) : (ms.side.phase === 'pickup' ? job.target : job.deliver));
  if (Math.hypot(playerPos.x - dest.x, playerPos.y - dest.y) < 85) {
    if (ms.active && ms.phase === 'goto') { ms.phase = 'deliver'; ms.timer = 150; ms.banner = 'Got it. Now deliver — watch for police.'; ms.bannerTimer = 5; return 'phase'; }
    if (ms.side && ms.side.phase === 'pickup') { ms.side.phase = 'deliver'; ms.timer = 90; return 'phase'; }
    return 'done';
  }
  return null;
}
export function finishMission(ms, state) {
  const job = ms.active || ms.side;
  if (!job) return 0;
  state.cash += job.pay; state.earned += job.pay; state.missionsDone += 1;
  if (ms.active) { ms.storyIndex += 1; ms.active = null; if (ms.storyIndex >= STORY.length) ms.complete = true; }
  else ms.side = null;
  ms.phase = 'goto';
  return job.pay;
}
