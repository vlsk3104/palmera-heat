// Wanted model: crimes raise stars, hiding or a repaint clears them.
export function createWanted() {
  return { stars: 0, heat: 0, hideTimer: 0, seen: true };
}
export function commitCrime(wanted, severity) {
  wanted.heat += severity;
  wanted.hideTimer = 0;
  const next = Math.min(5, Math.floor(wanted.heat / 22));
  if (next > wanted.stars) wanted.stars = next;
}
export function stepWanted(wanted, dt, playerSeen) {
  wanted.seen = playerSeen;
  if (!playerSeen && wanted.stars > 0) {
    wanted.hideTimer += dt;
    if (wanted.hideTimer > 7) { wanted.stars = Math.max(0, wanted.stars - 1); wanted.heat = wanted.stars * 22; wanted.hideTimer = 0; }
  } else wanted.hideTimer = 0;
}
export function clearWanted(wanted) { wanted.stars = 0; wanted.heat = 0; wanted.hideTimer = 0; }
export function starsLabel(wanted) { return '★'.repeat(wanted.stars) + '☆'.repeat(5 - wanted.stars); }
