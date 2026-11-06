// Records a flowcast intro to WebM. Usage: node record.mjs intro.html out.webm [--width 1080] [--height 1920] [--theme dark|light] [--captions off]
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { rename } from 'node:fs/promises';

const [,, input, output, ...rest] = process.argv;
if (!input || !output) { console.error('usage: node record.mjs intro.html out.webm [--width W] [--height H] [--canvas square|portrait|story|landscape] [--phone center|left|right] [--theme dark|light] [--captions off|inside|below]'); process.exit(1); }
const opt = Object.fromEntries(rest.map((a, k, arr) => a.startsWith('--') ? [a.slice(2), arr[k + 1]] : null).filter(Boolean));
// what the user set on the preview, saved by the studio beside the intro; flags given here win over it
import { existsSync, readFileSync } from 'node:fs';
const stateFile = opt.state || resolve(input).replace(/\.html$/, '.state.json');
const saved = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : {};
for (const k of ['canvas', 'phone', 'theme', 'captions']) if (opt[k] === undefined && saved[k] !== undefined) opt[k] = saved[k];
if (opt.canvas === 'none') delete opt.canvas;
const extra = { slots: saved.slots, words: saved.words };
const PRESET = { square: [1080, 1080], portrait: [1080, 1350], story: [1080, 1920], landscape: [1920, 1080] };
const [pw, ph] = PRESET[opt.canvas] || [];
const width = +(opt.width || pw || 1080), height = +(opt.height || ph || 1920), theme = opt.theme || 'light';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, colorScheme: theme, recordVideo: { dir: dirname(resolve(output)), size: { width, height } } });
const page = await ctx.newPage();
// record mode: no controls, plays once, ends on the end card. Set before the page's scripts run.
await page.addInitScript((pre) => { window.__flowcast = pre; }, { mode: 'record', theme, canvas: opt.canvas, phone: opt.phone, captions: opt.captions === 'off' ? 'off' : undefined, captionsAt: opt.captions === 'below' ? 'below' : undefined, ...extra });
await page.goto('file://' + resolve(input));
await page.waitForFunction(() => window.flowcast && window.flowcast.beats);
await page.evaluate(() => {
  // the frame fills the viewport, centred, on the page background
  const host = document.getElementById('flowcast'); host.style.marginTop = `${Math.max(0, (innerHeight - host.getBoundingClientRect().height) / 2)}px`;
  flowcast.go(0);
});
await page.waitForFunction(() => window.flowcastDone, null, { timeout: 120000 });
await page.waitForTimeout(300);
const video = page.video();
await ctx.close(); await browser.close();
await rename(await video.path(), resolve(output));
console.log(resolve(output));
