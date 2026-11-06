// One PNG per beat, plus the end card, at the exact canvas size; optionally the same frames as a PDF, one per page.
// Usage: node frames.mjs intro.html outdir [--canvas square] [--phone right] [--theme dark] [--captions off|inside|below] [--at 0.9] [--pdf slides.pdf]
import { chromium } from 'playwright';
import { resolve, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const [,, input, outdir, ...rest] = process.argv;
if (!input || !outdir) { console.error('usage: node frames.mjs intro.html outdir [--canvas square|portrait|story|landscape] [--phone center|left|right] [--theme dark|light] [--captions off|inside|below] [--at 0.9] [--pdf slides.pdf]'); process.exit(1); }
const opt = Object.fromEntries(rest.map((a, k, arr) => a.startsWith('--') ? [a.slice(2), arr[k + 1]] : null).filter(Boolean));
// what the user set on the preview, saved by the studio beside the intro; flags given here win over it
import { existsSync, readFileSync } from 'node:fs';
const stateFile = opt.state || resolve(input).replace(/\.html$/, '.state.json');
const saved = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : {};
for (const k of ['canvas', 'phone', 'theme', 'captions']) if (opt[k] === undefined && saved[k] !== undefined) opt[k] = saved[k];
if (opt.canvas === 'none') delete opt.canvas;
const extra = { slots: saved.slots, words: saved.words };
const PRESET = { square: [1080, 1080], portrait: [1080, 1350], story: [1080, 1920], landscape: [1920, 1080] };
const at = +(opt.at || 0.9), theme = opt.theme || 'light';
mkdirSync(resolve(outdir), { recursive: true });

const browser = await chromium.launch();
// a first pass at a neutral size tells us the frame's own size when no canvas is asked for
const probe = await browser.newPage({ viewport: { width: 1280, height: 1280 } });
await probe.addInitScript((pre) => { window.__flowcast = pre; }, { mode: 'record', theme, canvas: opt.canvas, phone: opt.phone, captions: opt.captions === 'off' ? 'off' : undefined, captionsAt: opt.captions === 'below' ? 'below' : undefined, ...extra });
await probe.goto('file://' + resolve(input)); await probe.waitForFunction(() => window.flowcast && window.flowcast.beats);
const [w, h] = PRESET[opt.canvas] || await probe.evaluate(() => { const r = document.getElementById('fc-canvas').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
await probe.close();

const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: theme });
await page.addInitScript((pre) => { window.__flowcast = pre; }, { mode: 'record', theme, canvas: opt.canvas, phone: opt.phone, captions: opt.captions === 'off' ? 'off' : undefined, captionsAt: opt.captions === 'below' ? 'below' : undefined, ...extra });
await page.goto('file://' + resolve(input)); await page.waitForFunction(() => window.flowcast && window.flowcast.beats);
await page.evaluate(() => { const host = document.getElementById('flowcast'); host.style.marginTop = `${Math.max(0, (innerHeight - host.getBoundingClientRect().height) / 2)}px`; });
const beats = await page.evaluate(() => flowcast.beats.map(b => b.ms));
const files = [];
for (let i = 0; i < beats.length; i++) {
  await page.evaluate((n) => flowcast.go(n), i); await page.waitForTimeout(Math.max(300, beats[i] * at));
  const f = join(resolve(outdir), `beat-${i + 1}.png`); await page.screenshot({ path: f }); files.push(f);
}
await page.evaluate((n) => flowcast.go(n), beats.length - 1); await page.waitForTimeout(beats[beats.length - 1] + 900);
const endFile = join(resolve(outdir), 'end.png'); await page.screenshot({ path: endFile }); files.push(endFile);

if (opt.pdf) {
  // the frames as pages, each the size of the frame
  const doc = await browser.newPage();
  await doc.setContent(`<style>@page{size:${w}px ${h}px;margin:0}body{margin:0}img{display:block;width:${w}px;height:${h}px;page-break-after:always}</style>` + files.map(f => `<img src="file://${f}">`).join(''));
  await doc.pdf({ path: resolve(opt.pdf), width: `${w}px`, height: `${h}px`, printBackground: true });
  files.push(resolve(opt.pdf));
}
await browser.close();
console.log(files.join('\n'));
