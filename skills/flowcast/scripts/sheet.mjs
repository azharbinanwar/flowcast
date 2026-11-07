// One contact sheet of every beat, so a check costs one small image. Usage: node sheet.mjs intro.html sheet.jpg [--theme dark] [--captions off] [--at 0.85]
import { chromium } from 'playwright';
import { resolve } from 'node:path';

const [,, input, output, ...rest] = process.argv;
if (!input || !output) { console.error('usage: node sheet.mjs intro.html sheet.png [--theme dark] [--at 0.85]'); process.exit(1); }
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
if (opt.canvas === 'none') delete opt.canvas;
const extra = { slots: saved.slots, words: saved.words, speed: saved.speed, durations: saved.durations, colors: saved.colors, credit: saved.credit, privacy: saved.privacy };
const at = +(opt.at || 0.85);

const browser = await chromium.launch();
// record mode: no drawer or controls, so the frame renders at full size whatever the window
const page = await browser.newPage({ viewport: { width: 1280, height: 1280 }, colorScheme: opt.theme || 'light' });
await page.addInitScript((pre) => { window.__flowcast = pre; }, { mode: 'record', stills: true, theme: opt.theme, captions: opt.captions === 'off' ? 'off' : undefined, captionsAt: opt.captions === 'below' ? 'below' : undefined, ...extra });
await page.goto('file://' + resolve(input));
await page.waitForFunction(() => window.flowcast && window.flowcast.beats); await page.evaluate(() => document.fonts.ready);
// every slide's finished picture, the way PNG and PDF export them
const count = await page.evaluate(() => flowcast.slides()), real = await page.evaluate(() => flowcast.beats.filter(b => !b.outro).length), outro = await page.evaluate(() => flowcast.beats.some(b => b.outro));
const shots = [], labels = [];
for (let k = 0; k < count; k++) {
  await page.evaluate((n) => flowcast.still(n), k);
  shots.push((await page.locator('#fc-canvas').screenshot()).toString('base64')); labels.push(k < real ? 'beat ' + (k + 1) : outro && k === count - 1 ? 'outro' : 'end');
}
const box = await page.locator('#fc-canvas').boundingBox();

// one small image: every frame side by side within 1500px, so reading it costs about a thousand tokens
const gap = 6, room = 1500 - gap * (shots.length + 1), h = Math.round(Math.min(420, room / shots.length / (box.width / box.height)));
const sheet = await browser.newPage({ viewport: { width: 1500, height: h + 30 } });
await sheet.setContent(`<body style="margin:0;background:#888;display:flex;gap:${gap}px;padding:${gap}px">${shots.map((b, k) => `<figure style="margin:0;text-align:center;font:11px sans-serif;color:#fff"><img src="data:image/png;base64,${b}" style="height:${h}px;display:block"><figcaption>${labels[k]}</figcaption></figure>`).join('')}</body>`, { waitUntil: 'load' });
const out = resolve(output);
await sheet.screenshot({ path: out, fullPage: true, ...(/\.jpe?g$/i.test(out) ? { type: 'jpeg', quality: 75 } : {}) });
await browser.close();
console.log(resolve(output));
