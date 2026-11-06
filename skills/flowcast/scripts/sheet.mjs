// One contact sheet of every beat, so a check costs one image. Usage: node sheet.mjs intro.html sheet.png [--theme dark] [--at 0.85]
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
const extra = { slots: saved.slots, words: saved.words, speed: saved.speed, durations: saved.durations, colors: saved.colors };
const at = +(opt.at || 0.85);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 460, height: 1000 }, colorScheme: opt.theme || 'light' });
await page.addInitScript((pre) => { window.__flowcast = pre; }, { theme: opt.theme, ...extra });
await page.goto('file://' + resolve(input));
await page.waitForFunction(() => window.flowcast && window.flowcast.beats);
const beats = await page.evaluate(() => flowcast.beats.map(b => b.ms));
const shots = [];
for (let i = 0; i < beats.length; i++) {
  await page.evaluate((n) => flowcast.go(n), i);
  await page.waitForTimeout(Math.max(300, beats[i] * at));
  shots.push((await page.locator('#fc-canvas').screenshot()).toString('base64'));
}
// the end card, if the intro has one
await page.evaluate((n) => flowcast.go(n), beats.length - 1);
await page.waitForTimeout(beats[beats.length - 1] + 900);
shots.push((await page.locator('#fc-canvas').screenshot()).toString('base64'));

const sheet = await browser.newPage({ viewport: { width: 1600, height: 600 } });
await sheet.setContent(`<body style="margin:0;background:#888;display:flex;gap:8px;padding:8px">${shots.map((b, k) => `<figure style="margin:0;text-align:center;font:12px sans-serif;color:#fff"><img src="data:image/png;base64,${b}" style="height:560px;display:block"><figcaption>${k < beats.length ? 'beat ' + (k + 1) : 'end'}</figcaption></figure>`).join('')}</body>`);
await sheet.screenshot({ path: resolve(output), fullPage: true });
await browser.close();
console.log(resolve(output));
