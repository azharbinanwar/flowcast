// A new intro that starts from the project's earlier one: same colour tokens, fonts, frame, end card, palette and assets,
// with the scene, beats and steps left empty to write. Saves the builder from reading or retyping the old intro.
// Usage: node starter.mjs <flowcast-folder> <new-name> [--from <intro-name>]
// Prints the new intro's path, and "fresh" when the project has no earlier intro to start from.
import { readFile, writeFile, readdir, stat, mkdir, copyFile, link } from 'node:fs/promises';
import { join } from 'node:path';

const [,, root, name, ...rest] = process.argv;
if (!root || !name) { console.error('usage: node starter.mjs <flowcast-folder> <new-name> [--from <intro-name>]'); process.exit(1); }
const opt = Object.fromEntries(rest.map((a, k, arr) => a.startsWith('--') ? [a.slice(2), arr[k + 1]] : null).filter(Boolean));
const to = join(root, name);
if (await stat(join(to, 'intro.html')).then(() => true, () => false)) { console.error(`${join(to, 'intro.html')} already exists`); process.exit(1); }

// the newest intro in the project, unless one is named
let from = opt.from;
if (!from) {
  const all = [];
  for (const n of await readdir(root).catch(() => [])) { const f = join(root, n, 'intro.html'); const s = await stat(f).catch(() => null); if (s && n !== name) all.push([n, s.mtimeMs]); }
  from = all.sort((a, b) => b[1] - a[1])[0]?.[0];
}
await mkdir(to, { recursive: true });
if (!from) { console.log(join(to, 'intro.html')); console.log('fresh'); process.exit(0); }

const html = await readFile(join(root, from, 'intro.html'), 'utf8');
const take = (re) => (html.match(re) || [])[0] || '';
// what belongs to the project's look, kept as it is
const head = html.slice(0, html.indexOf('<style')).replace(/<title>[^<]*<\/title>/, `<title>${name.replace(/[-_]/g, ' ').replace(/^./, c => c.toUpperCase())}</title>`);
const css = html.slice(html.indexOf('<style>') + 7, html.indexOf('</style>'));
const tokens = [...css.matchAll(/(^|\n)\s*(:root\{[^}]*\}|@media \(prefers-color-scheme:\s*dark\)\{[^}]*\{[^}]*\}\}|:root\[data-theme=dark\]\{[^}]*\})/g)].map(m => m[2]).join('\n');
const fonts = [...css.matchAll(/@font-face\{[^}]*\}/g)].map(m => m[0]).join('\n');
const host = take(/<div id="flowcast"[^>]*>/);
const end = take(/<template id="endcard">[\s\S]*?<\/template>/);
const palette = take(/const palette = [^\n]*;/);
const T = take(/const T = [^\n]*;/);

await writeFile(join(to, 'intro.html'), `${head}<style>
/* from ${from}: the project's tokens${fonts ? ' and fonts' : ''}, kept as they are */
${fonts}
${tokens}
/* this intro's scene */
</style>
${host}
<template id="scene">
</template>
${end}
</div>
<script>
${T || 'const T = { settle: 400, press: 550, lift: 150, type: 30 };'}
${palette}
const canvas = {};
const beats = [];
function apply(i) {}
const scene = {};
</script>
<script src="player.js"></script>
`);

// the earlier intro's own files (fonts, pictures, a logo) come along; its settings, exports and player links do not
for (const f of await readdir(join(root, from))) {
  if (['intro.html', 'intro.state.json', 'exports', 'player.css', 'player.js', 'motion.svg', '.DS_Store'].includes(f)) continue;
  // a hard link shares the bytes on disk, so a 10 MB font is not stored twice; a copy where links are not possible
  const s = await stat(join(root, from, f)); if (s.isFile()) await link(join(root, from, f), join(to, f)).catch(() => copyFile(join(root, from, f), join(to, f)));
}
console.log(join(to, 'intro.html'));
console.log(`from ${from}`);
