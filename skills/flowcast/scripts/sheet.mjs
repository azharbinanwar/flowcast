// One contact sheet of every beat, so a check costs one image. Usage: node sheet.mjs intro.html sheet.png [--theme dark] [--at 0.85]
// --at is where in each beat the frame is taken (0.85 = near its end, after the cause and the effect).
import { chromium } from 'playwright';
import { resolve } from 'node:path';

const [,, input, output, ...rest] = process.argv;
if (!input || !output) { console.error('usage: node sheet.mjs intro.html sheet.png [--theme dark] [--at 0.85]'); process.exit(1); }
const opt = Object.fromEntries(rest.map((a, k, arr) => a.startsWith('--') ? [a.slice(2), arr[k + 1]] : null).filter(Boolean));
const at = +(opt.at || 0.85);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 460, height: 1000 }, colorScheme: opt.theme || 'light' });
if (opt.theme) await page.addInitScript((t) => { window.__flowcast = { theme: t }; }, opt.theme);
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
