// Palmera Heat entrypoint (Node 22, standard library only).
// The game lives in game/ as plain static files a desktop browser loads fully offline:
// game/index.html plus its ES modules, vanilla JavaScript and canvas, no library and no
// network request. This program copies game/ and screenshots/ beside it to the output
// directory and writes dossier.json there with the vendored make.fun library.
// Serve locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Authored for Palmera Heat: walk a folder and print a one-line-per-file build inventory. */
function printBuildInventory(rootDir: string): void {
  const rows: Array<{ path: string; bytes: number }> = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) rows.push({ path: relative(rootDir, full), bytes: statSync(full).size });
    }
  };
  walk(rootDir);
  rows.sort((a, b) => a.path.localeCompare(b.path));
  let total = 0;
  for (const row of rows) { total += row.bytes; console.log(`[palmera-heat] ${row.path} ${row.bytes}B`); }
  console.log(`[palmera-heat] inventory: ${rows.length} game files, ${total} bytes total`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

printBuildInventory(join(out, 'game'));
console.log('[palmera-heat] systems: city, traffic, pedestrians, wanted, police, combat, missions, hud, save');

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
