// Records a flowcast intro to MP4 (or WebM). Usage: node record.mjs intro.html out.mp4 [--quality standard|high|max] [--width 1080] [--height 1920] [--theme dark|light] [--captions off]
import { chromium } from 'playwright';
import { resolve, join } from "node:path";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";

const [,, input, output, ...rest] = process.argv;
if (!input || !output) { console.error('usage: node record.mjs intro.html out.webm [--width W] [--height H] [--canvas square|portrait|story|landscape] [--phone center|left|right] [--theme dark|light] [--captions off|inside|below]'); process.exit(1); }
// the intro loads player.css and player.js from its own folder: link them from the skill when they are not there
import { existsSync as _ex, symlinkSync as _ln, copyFileSync as _cp, readFileSync as _rf } from 'node:fs';
import { dirname as _dn, join as _jn } from 'node:path';
import { fileURLToPath as _fu } from 'node:url';
const ensurePlayer = (html) => { const src = (() => { try { return _rf(resolve(html), 'utf8'); } catch { return ''; } })(); for (const f of ['player.css', 'player.js', 'motion.svg']) { const want = f === 'motion.svg' ? 'player.js' : f; if (!src.includes(`"${want}"`) && !src.includes(`"./${want}"`)) continue; const to = _jn(_dn(resolve(html)), f), from = _jn(_dn(_fu(import.meta.url)), '../player', f); if (!_ex(to)) { try { _ln(from, to); } catch { _cp(from, to); } } } };
if (input) ensurePlayer(input);
const opt = Object.fromEntries(rest.map((a, k, arr) => a.startsWith('--') ? [a.slice(2), arr[k + 1]] : null).filter(Boolean));
// what the user set on the preview, saved by the studio beside the intro; flags given here win over it
import { existsSync, readFileSync } from 'node:fs';
const stateFile = opt.state || resolve(input).replace(/\.html$/, '.state.json');
const saved = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : {};
for (const k of ['canvas', 'phone', 'theme', 'captions']) if (opt[k] === undefined && saved[k] !== undefined) opt[k] = saved[k];
const extra = { slots: saved.slots, words: saved.words, speed: saved.speed, durations: saved.durations, colors: saved.colors, credit: saved.credit, privacy: saved.privacy };
const PRESET = { square: [1080, 1080], portrait: [1080, 1350], story: [1080, 1920], landscape: [1920, 1080] };
const [pw, ph] = PRESET[opt.canvas] || [];
const theme = opt.theme || 'light';
let width = +(opt.width || pw || 0), height = +(opt.height || ph || 0);
if (!width || !height) {
  // no canvas and no size given: a free-size composition records at its own size, a device at twice its size
  const b = await chromium.launch(); const pg = await b.newPage();
  await pg.goto('file://' + resolve(input)); await pg.waitForFunction(() => window.flowcast && window.flowcast.beats);
  [width, height] = await pg.evaluate(() => flowcast.frame === 'none' && flowcast.size[1] ? flowcast.size : [flowcast.size[0] * 2, flowcast.size[1] * 2]);
  await b.close();
}

// Chrome's own frames, near lossless, encoded once. A browser recorder squeezes video to about 1 Mbit/s, which blurs text and fine lines.
// standard and high record at the export size; max at up to twice that, about 4K on the long side
const QUALITY = { standard: { jpeg: 88, crf: 20, fps: 30 }, high: { jpeg: 95, crf: 16, fps: 30 }, max: { jpeg: 95, crf: 14, fps: 60 } };
const q = QUALITY[opt.quality] || QUALITY.high;
const scale = opt.quality === 'max' ? Math.max(1, Math.min(2, 3840 / Math.max(width, height))) : 1;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, colorScheme: theme });
const page = await ctx.newPage();
// record mode: no controls, plays once, ends on the end card. Set before the page's scripts run.
await page.addInitScript((pre) => { window.__flowcast = pre; }, { mode: 'record', theme, canvas: opt.canvas, phone: opt.phone, captions: opt.captions === 'off' ? 'off' : undefined, captionsAt: opt.captions === 'below' ? 'below' : undefined, ...extra });
await page.goto('file://' + resolve(input));
await page.waitForFunction(() => window.flowcast && window.flowcast.beats);
await page.evaluate(() => {
  // a free-size composition sits at 0,0 at 1:1; a device is centred on the canvas
  const host = document.getElementById('flowcast'); const r = document.getElementById('fc-canvas').getBoundingClientRect();
  if (r.width < innerWidth - 1 || r.height < innerHeight - 1) { host.style.display = 'grid'; host.style.placeItems = 'center'; host.style.minHeight = innerHeight + 'px'; }
});
// fonts, pictures and the user's own words in place, and two frames painted, before the first beat starts
await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
});

// Chrome sends a frame whenever the picture changes; each one keeps its time, so still moments last as long as they really did
const dir = await mkdtemp(join(tmpdir(), 'flowcast-rec-')), shots = [];
const cdp = await ctx.newCDPSession(page);
cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
  const f = join(dir, `${String(shots.length).padStart(6, '0')}.jpg`); shots.push([f, metadata.timestamp]);
  writeFile(f, Buffer.from(data, 'base64')).catch(() => {}); cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: q.jpeg, maxWidth: Math.round(width * scale), maxHeight: Math.round(height * scale), everyNthFrame: 1 });
await page.waitForTimeout(200);
// the video starts here: the last frame before the first beat, then the intro
const started = Date.now() / 1000;
await page.evaluate(() => flowcast.go(0));
await page.waitForFunction(() => window.flowcastDone, null, { timeout: 180000 });
await page.waitForTimeout(300);
const ended = Date.now() / 1000;
await cdp.send('Page.stopScreencast').catch(() => {});
await page.waitForTimeout(200);
await ctx.close(); await browser.close();

const kept = shots.filter(([, t]) => t >= started); const lead = shots.filter(([, t]) => t < started).pop();
if (lead) kept.unshift([lead[0], started]);
if (!kept.length) { console.error('nothing was recorded'); process.exit(1); }
// ffmpeg's concat list: each frame held until the next one, the last until the end
const list = kept.map(([f, t], k) => `file '${f}'\nduration ${Math.max(0.001, (kept[k + 1]?.[1] ?? ended) - t).toFixed(4)}`).join('\n') + `\nfile '${kept[kept.length - 1][0]}'\n`;
await writeFile(join(dir, 'list.txt'), list);
// even sizes, which the encoders need
const vf = `fps=${q.fps},scale=trunc(iw/2)*2:trunc(ih/2)*2:flags=lanczos`;
const enc = /\.webm$/i.test(output) ? ['-c:v', 'libvpx-vp9', '-crf', String(q.crf + 12), '-b:v', '0', '-row-mt', '1'] : ['-c:v', 'libx264', '-preset', 'slow', '-crf', String(q.crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart'];
const r = spawnSync(ffmpeg, ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(dir, 'list.txt'), '-vf', vf, ...enc, resolve(output)], { stdio: 'inherit' });
await rm(dir, { recursive: true, force: true });
if (r.status) process.exit(r.status);
console.log(resolve(output));
