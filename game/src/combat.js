// Light combat: melee shove, pistol with tracers, health and armour.
export function createCombat() {
  return { bullets: [], hasGun: false, ammo: 0, muzzle: 0, shake: 0, hitStop: 0 };
}
export function tryShoot(combat, from, angle) {
  if (!combat.hasGun || combat.ammo <= 0) return false;
  combat.ammo -= 1; combat.muzzle = 0.07;
  combat.bullets.push({ x: from.x, y: from.y, vx: Math.cos(angle) * 900, vy: Math.sin(angle) * 900, life: 0.55, friendly: true });
  return true;
}
export function stepCombat(combat, dt, targets) {
  const hits = [];
  for (const b of combat.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    for (const t of targets) {
      if (t.health > 0 && Math.hypot(t.x - b.x, t.y - b.y) < 26) { t.health -= 34; b.life = 0; hits.push(t); }
    }
  }
  combat.bullets = combat.bullets.filter((b) => b.life > 0);
  if (combat.muzzle > 0) combat.muzzle -= dt;
  if (combat.shake > 0) combat.shake = Math.max(0, combat.shake - dt * 22);
  return hits;
}
export function meleeShove(player, targets) {
  let hit = null;
  for (const t of targets) if (Math.hypot(t.x - player.x, t.y - player.y) < 52) { t.health -= 22; hit = t; }
  return hit;
}
