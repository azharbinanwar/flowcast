// Flowcast tests. Run from the skill folder: npm test   (add --video to also record and convert)
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '..');
const sample = join(root, 'examples/sample.html'), out = join(root, 'examples/.test-out'), state = join(root, 'examples/sample.state.json');
let failed = 0;
const ok = (name, cond, detail = '') => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${detail ? ' · ' + detail : ''}`); if (!cond) failed++; };
const node = (args) => spawnSync(process.execPath, args, { encoding: 'utf8' });

// a PNG reader good enough for corner pixels: 8-bit RGB or RGBA, any filter
function png(path) {
  const d = readFileSync(path); let pos = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (pos < d.length) { const n = d.readUInt32BE(pos), t = d.toString('ascii', pos + 4, pos + 8), c = d.subarray(pos + 8, pos + 8 + n);
    if (t === 'IHDR') { w = c.readUInt32BE(0); h = c.readUInt32BE(4); ct = c[9]; } if (t === 'IDAT') idat.push(c); pos += 12 + n; }
  const raw = inflateSync(Buffer.concat(idat)), bpp = ct === 6 ? 4 : 3, stride = w * bpp, rows = []; let prev = Buffer.alloc(stride), i = 0;
  for (let y = 0; y < h; y++) { const f = raw[i++], line = Buffer.from(raw.subarray(i, i + stride)); i += stride;
    for (let x = 0; x < stride; x++) { const a = x >= bpp ? line[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      if (f === 1) line[x] = (line[x] + a) & 255; else if (f === 2) line[x] = (line[x] + b) & 255; else if (f === 3) line[x] = (line[x] + ((a + b) >> 1)) & 255;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); line[x] = (line[x] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255; } }
    rows.push(line); prev = line; }
  return { w, h, px: (x, y) => [...rows[y].subarray(x * bpp, x * bpp + 3)] };
}
const near = (a, b) => a.every((v, k) => Math.abs(v - b[k]) <= 3);
const hex = (s) => [1, 3, 5].map(k => parseInt(s.slice(k, k + 2), 16));

// 1. every script and the player parse
for (const f of [...readdirSync(here).filter(f => f.endsWith('.mjs')).map(f => join(here, f)), join(root, 'player/player.js')])
  ok(`parses ${f.split('/').slice(-2).join('/')}`, node(['--check', f]).status === 0);

// 2. frames: one per beat plus the end card, exactly 1080×1080, the scene at 0,0 with no page showing at any edge
rmSync(out, { recursive: true, force: true }); rmSync(state, { force: true });
let r = node([join(here, 'frames.mjs'), sample, out, '--pdf', join(out, 'slides.pdf')]);
ok('frames run', r.status === 0, r.stderr.trim().split('\n').pop());
const pngs = existsSync(out) ? readdirSync(out).filter(f => f.endsWith('.png')).sort() : [];
ok('frames named and numbered', pngs.join(',') === 'flowcast-1.png,flowcast-2.png,flowcast-3.png', pngs.join(','));
if (pngs.length) {
  const f = png(join(out, 'flowcast-1.png')), bg = hex('#F7F7F4');
  ok('frame is 1080×1080', f.w === 1080 && f.h === 1080, `${f.w}×${f.h}`);
  ok('scene fills to every edge', [[0, 0], [1079, 0], [0, 1079], [1079, 1079]].every(([x, y]) => near(f.px(x, y), bg)), JSON.stringify(f.px(0, 0)));
}
// 3. slides: a PDF with one page per frame
const pdf = join(out, 'slides.pdf');
ok('slides pdf has a page per frame', existsSync(pdf) && (readFileSync(pdf).toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length === 3);

// 4. what the user set on the page is honoured: a saved dark theme exports dark
writeFileSync(state, JSON.stringify({ canvas: 'none', theme: 'dark', captions: 'off' }));
r = node([join(here, 'frames.mjs'), sample, join(out, 'dark')]);
ok('saved state honoured', r.status === 0 && near(png(join(out, 'dark/flowcast-1.png')).px(0, 0), hex('#151816')));
rmSync(state, { force: true });

// 5. a canvas size: a full-canvas scene on a wider canvas keeps full height
r = node([join(here, 'frames.mjs'), sample, join(out, 'wide'), '--canvas', 'landscape', '--phone', 'left']);
if (r.status === 0) { const f = png(join(out, 'wide/flowcast-1.png')); ok('landscape is 1920×1080', f.w === 1920 && f.h === 1080, `${f.w}×${f.h}`); ok('scene sits left at full height', near(f.px(0, 0), hex('#F7F7F4')) && near(f.px(0, 1079), hex('#F7F7F4'))); }
else ok('landscape frames run', false, r.stderr.trim().split('\n').pop());

// 5b. the layout check: the sample is clear, and a bottom sheet placed from the top is caught
r = node([join(here, 'check.mjs'), sample]); ok('check passes the sample', r.status === 0 && r.stdout.startsWith('All clear'), r.stdout.trim() || r.stderr.trim().split('\n').pop());
{ const bad = join(out, 'pinned.html'); mkdirSync(out, { recursive: true });
  writeFileSync(bad, readFileSync(sample, 'utf8').replace('data-frame="none" data-width="1080" data-height="1080" data-captions="off"', 'data-frame="phone" data-captions-at="inside"').replace('<template id="scene">', '<template id="scene"><div style="position:absolute;left:0;right:0;top:520px;height:120px;background:#ccc"></div>').replaceAll('../player/', `${join(root, 'player')}/`));
  r = node([join(here, 'check.mjs'), bad]); ok('check catches a sheet placed from the top', /Anchor it with bottom/.test(r.stdout), r.stdout.trim().slice(0, 120)); }

// 5c. the studio's History page: its own script must parse, or search, previews, logos and Open folder all stop
{ const home = join(out, 'home'), proj = join(out, 'proj', 'flowcast', 'demo'); mkdirSync(proj, { recursive: true }); mkdirSync(home, { recursive: true });
  writeFileSync(join(proj, 'intro.html'), readFileSync(sample, 'utf8').replaceAll('../player/', `${join(root, 'player')}/`));
  const { spawn } = await import('node:child_process');
  const studio = spawn(process.execPath, [join(here, 'studio.mjs'), join(out, 'proj', 'flowcast'), '--port', '7799'], { env: { ...process.env, FLOWCAST_HOME: home }, stdio: 'ignore' });
  let page = ''; for (let k = 0; k < 40 && !page; k++) { await new Promise(r => setTimeout(r, 150)); page = await fetch('http://127.0.0.1:7799/').then(r => r.text(), () => ''); }
  const scripts = [...page.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  let parses = scripts.length > 0; for (const s of scripts) { try { new Function(s); } catch (e) { parses = false; console.log('   ', e.message); } }
  ok('History page lists the intro and its script parses', page.includes('data-name="demo"') && parses);
  studio.kill(); }

// 6. optional: record and convert
if (process.argv.includes('--video')) {
  r = node([join(here, 'record.mjs'), sample, join(out, 'v.webm'), '--canvas', 'square']); ok('records webm', r.status === 0);
  ok('notes where the intro starts, so the loading is cut', existsSync(join(out, 'v.webm.json')) && JSON.parse(readFileSync(join(out, 'v.webm.json'), 'utf8')).start > 0);
  r = node([join(here, 'convert.mjs'), join(out, 'v.webm'), join(out, 'v.mp4')]); ok('converts to mp4', r.status === 0 && existsSync(join(out, 'v.mp4')));
}

rmSync(out, { recursive: true, force: true });
console.log(failed ? `\n${failed} failed` : '\nall passed'); process.exit(failed ? 1 : 0);
