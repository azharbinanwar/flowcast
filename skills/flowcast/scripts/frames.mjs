// One PNG per beat, plus the end card, at the exact canvas size; optionally the same frames as a PDF, one per page.
// Usage: node frames.mjs intro.html outdir [--canvas square] [--phone right] [--theme dark] [--captions off|inside|below] [--at 0.9] [--scale 2] [--pdf slides.pdf] [--pdf-text picture|real]
import { chromium } from 'playwright';
import { resolve, join } from 'node:path';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';

const [,, input, outdir, ...rest] = process.argv;
if (!input || !outdir) { console.error('usage: node frames.mjs intro.html outdir [--canvas square|portrait|story|landscape] [--phone center|left|right] [--theme dark|light] [--captions off|inside|below] [--at 0.9] [--scale 1|2|3] [--pdf slides.pdf] [--pdf-text real|picture]'); process.exit(1); }
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
const at = +(opt.at || 0.9), theme = opt.theme || 'light';
mkdirSync(resolve(outdir), { recursive: true });

const browser = await chromium.launch();
// a first pass at a neutral size tells us the frame's own size when no canvas is asked for
const probe = await browser.newPage({ viewport: { width: 1280, height: 1280 } });
await probe.addInitScript((pre) => { window.__flowcast = pre; }, { mode: 'record', stills: true, theme, canvas: opt.canvas, phone: opt.phone, captions: opt.captions === 'off' ? 'off' : undefined, captionsAt: opt.captions === 'below' ? 'below' : undefined, ...extra });
await probe.goto('file://' + resolve(input)); await probe.waitForFunction(() => window.flowcast && window.flowcast.beats);
const [w, h] = PRESET[opt.canvas] || await probe.evaluate(() => flowcast.frame === 'none' && flowcast.size[1] ? flowcast.size : (() => { const r = document.getElementById('fc-canvas').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; })());
await probe.close();

// sharpness: the same picture with 2 or 3 pixels for every one, so it survives a site shrinking it
const scale = Math.min(3, Math.max(1, +opt.scale || 1)), realText = opt.pdf && opt['pdf-text'] === 'real';
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale, colorScheme: theme });
await page.addInitScript((pre) => { window.__flowcast = pre; }, { mode: 'record', stills: true, theme, canvas: opt.canvas, phone: opt.phone, captions: opt.captions === 'off' ? 'off' : undefined, captionsAt: opt.captions === 'below' ? 'below' : undefined, ...extra });
await page.goto('file://' + resolve(input)); await page.waitForFunction(() => window.flowcast && window.flowcast.beats); await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => { const host = document.getElementById('flowcast'); const r = document.getElementById('fc-canvas').getBoundingClientRect(); if (r.width < innerWidth - 1 || r.height < innerHeight - 1) { host.style.display = 'grid'; host.style.placeItems = 'center'; host.style.minHeight = innerHeight + 'px'; } });
// each slide is a beat's finished picture, then the end card, then the outro: the same pictures the studio shows when PNG or PDF is picked
const count = await page.evaluate(() => flowcast.slides());
const files = [], snaps = [];
for (let k = 0; k < count; k++) {
  await page.evaluate((n) => flowcast.still(n), k);
  const f = join(resolve(outdir), `flowcast-${k + 1}.png`); await page.screenshot({ path: f }); files.push(f);
  // for a PDF with real text: the slide as it stands, without its scripts, printed later as its own page
  // Chrome prints soft shadows as grey boxes, so each one becomes a hairline outline on the printed copy only
  if (realText) snaps.push(await page.evaluate(() => { const d = document.documentElement.cloneNode(true), live = document.documentElement.querySelectorAll('*'), copy = d.querySelectorAll('*');
    live.forEach((el, k) => { const sh = getComputedStyle(el).boxShadow; if (sh !== 'none' && /\d+px \d+px [1-9]/.test(sh)) copy[k].style.boxShadow = '0 0 0 1px rgba(0,0,0,.08)'; });
    d.querySelectorAll('script').forEach(s => s.remove()); d.querySelector('head').insertAdjacentHTML('beforeend', '<style>*,*::before,*::after{transition:none!important;animation:none!important}</style>'); return '<!doctype html>' + d.outerHTML; }));
}

if (realText) {
  // each slide's page sits beside the intro while printing, so its fonts, pictures and player.css load as they do in the studio
  const here = dirname(resolve(input)), tmp = snaps.map((_, k) => join(here, `.fc-print-${k + 1}.html`)), sheet = join(here, '.fc-print.html');
  try {
    snaps.forEach((html, k) => writeFileSync(tmp[k], html));
    writeFileSync(sheet, `<!doctype html><style>@page{size:${w}px ${h}px;margin:0}html,body{margin:0}iframe{display:block;width:${w}px;height:${h}px;border:0;break-after:page}iframe:last-child{break-after:auto}</style>` + tmp.map((_, k) => `<iframe src=".fc-print-${k + 1}.html"></iframe>`).join(''));
    const doc = await browser.newPage({ viewport: { width: w, height: h }, colorScheme: theme });
    await doc.emulateMedia({ media: 'screen', colorScheme: theme });
    await doc.goto('file://' + sheet, { waitUntil: 'load' });
    for (const f of doc.frames()) await f.evaluate(() => document.fonts.ready);
    await doc.waitForTimeout(300);
    await doc.pdf({ path: resolve(opt.pdf), width: `${w}px`, height: `${h}px`, printBackground: true });
  } finally { [...tmp, sheet].forEach(f => rmSync(f, { force: true })); }
  files.push(resolve(opt.pdf));
} else if (opt.pdf) {
  // the frames as pages, each the size of the frame
  const doc = await browser.newPage();
  const imgs = files.map(f => `<img src="data:image/png;base64,${readFileSync(f).toString('base64')}">`).join('');
  await doc.setContent(`<style>@page{size:${w}px ${h}px;margin:0}body{margin:0}img{display:block;width:${w}px;height:${h}px;page-break-after:always}</style>` + imgs, { waitUntil: 'load' });
  await doc.pdf({ path: resolve(opt.pdf), width: `${w}px`, height: `${h}px`, printBackground: true });
  files.push(resolve(opt.pdf));
}
await browser.close();
console.log(files.join('\n'));
