// One contact sheet of every beat, so a check costs one small image. Usage: node sheet.mjs intro.html sheet.jpg [--theme dark] [--captions off] [--at 0.85]
// --at is where in each beat the frame is taken (0.85 = near its end, after the cause and the effect).
import { chromium } from 'playwright';
import { resolve } from 'node:path';

const [,, input, output, ...rest] = process.argv;
if (!input || !output) { console.error('usage: node sheet.mjs intro.html sheet.png [--theme dark] [--at 0.85]'); process.exit(1); }
// the intro loads player.css and player.js from its own folder: link them from the skill when they are not there
import { existsSync as _ex, symlinkSync as _ln, copyFileSync as _cp, readFileSync as _rf } from 'node:fs';
import { dirname as _dn, join as _jn } from 'node:path';
import { fileURLToPath as _fu } from 'node:url';
const ensurePlayer = (html) => { const src = (() => { try { return _rf(resolve(html), 'utf8'); } catch { return ''; } })(); for (const f of ['player.css', 'player.js']) { if (!src.includes(`"${f}"`) && !src.includes(`"./${f}"`)) continue; const to = _jn(_dn(resolve(html)), f), from = _jn(_dn(_fu(import.meta.url)), '../player', f); if (!_ex(to)) { try { _ln(from, to); } catch { _cp(from, to); } } } };
if (input) ensurePlayer(input);
const opt = Object.fromEntries(rest.map((a, k, arr) => a.startsWith('--') ? [a.slice(2), arr[k + 1]] : null).filter(Boolean));
// what the user set on the preview, saved by the studio beside the intro; flags given here win over it
import { existsSync, readFileSync } from 'node:fs';
const stateFile = opt.state || resolve(input).replace(/\.html$/, '.state.json');
const saved = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : {};
for (const k of ['canvas', 'phone', 'theme', 'captions']) if (opt[k] === undefined && saved[k] !== undefined) opt[k] = saved[k];
if (opt.canvas === 'none') delete opt.canvas;
const extra = { slots: saved.slots, words: saved.words, speed: saved.speed, durations: saved.durations, colors: saved.colors, credit: saved.credit };
const at = +(opt.at || 0.85);

const browser = await chromium.launch();
// record mode: no drawer or controls, so the frame renders at full size whatever the window
const page = await browser.newPage({ viewport: { width: 1280, height: 1280 }, colorScheme: opt.theme || 'light' });
await page.addInitScript((pre) => { window.__flowcast = pre; }, { mode: 'record', theme: opt.theme, captions: opt.captions === 'off' ? 'off' : undefined, captionsAt: opt.captions === 'below' ? 'below' : undefined, ...extra });
await page.goto('file://' + resolve(input));
await page.waitForFunction(() => window.flowcast && window.flowcast.beats); await page.evaluate(() => document.fonts.ready);
const beats = await page.evaluate(() => flowcast.beats.map(b => b.ms));
const outro = await page.evaluate(() => !!flowcast.beats[flowcast.beats.length - 1].outro), real = beats.length - (outro ? 1 : 0);
const shots = [], labels = [];
for (let i = 0; i < real; i++) {
  await page.evaluate((n) => flowcast.go(n), i);
  await page.waitForTimeout(Math.max(300, beats[i] * at));
  shots.push((await page.locator('#fc-canvas').screenshot()).toString('base64')); labels.push('beat ' + (i + 1));
}
// the end card, if the intro has one, then the outro if the credit adds one
await page.evaluate((n) => flowcast.go(n), real - 1);
await page.waitForTimeout(beats[real - 1] + 900);
shots.push((await page.locator('#fc-canvas').screenshot()).toString('base64')); labels.push('end');
if (outro) { await page.evaluate((n) => flowcast.go(n), real); await page.waitForTimeout(Math.max(900, beats[real] * at)); shots.push((await page.locator('#fc-canvas').screenshot()).toString('base64')); labels.push('outro'); }
const box = await page.locator('#fc-canvas').boundingBox();

// one small image: every frame side by side within 1500px, so reading it costs about a thousand tokens
const gap = 6, room = 1500 - gap * (shots.length + 1), h = Math.round(Math.min(420, room / shots.length / (box.width / box.height)));
const sheet = await browser.newPage({ viewport: { width: 1500, height: h + 30 } });
await sheet.setContent(`<body style="margin:0;background:#888;display:flex;gap:${gap}px;padding:${gap}px">${shots.map((b, k) => `<figure style="margin:0;text-align:center;font:11px sans-serif;color:#fff"><img src="data:image/png;base64,${b}" style="height:${h}px;display:block"><figcaption>${labels[k]}</figcaption></figure>`).join('')}</body>`, { waitUntil: 'load' });
const out = resolve(output);
await sheet.screenshot({ path: out, fullPage: true, ...(/\.jpe?g$/i.test(out) ? { type: 'jpeg', quality: 75 } : {}) });
await browser.close();
console.log(resolve(output));
