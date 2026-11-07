// Layout check in words, so most checks cost no image. Usage: node check.mjs intro.html [--theme dark]
// Plays every beat to its end with captions on and off, and reports what a viewer would notice:
// parts cut off by the screen edge, text that does not fit, and bottom bars or sheets pinned from the top that float off the bottom.
import { chromium } from 'playwright';
import { resolve, dirname, join } from 'node:path';
import { existsSync, readFileSync, symlinkSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const [,, input, ...rest] = process.argv;
if (!input) { console.error('usage: node check.mjs intro.html [--theme dark]'); process.exit(1); }
const opt = Object.fromEntries(rest.map((a, k, arr) => a.startsWith('--') ? [a.slice(2), arr[k + 1]] : null).filter(Boolean));
const html = resolve(input), src = readFileSync(html, 'utf8');
for (const f of ['player.css', 'player.js', 'motion.svg']) {
  const want = f === 'motion.svg' ? 'player.js' : f;
  if (!src.includes(`"${want}"`) && !src.includes(`"./${want}"`)) continue;
  const to = join(dirname(html), f), from = join(dirname(fileURLToPath(import.meta.url)), '../player', f);
  if (!existsSync(to)) { try { symlinkSync(from, to); } catch { copyFileSync(from, to); } }
}

const browser = await chromium.launch();
const runs = {};
for (const captions of ['on', 'off']) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1280 }, colorScheme: opt.theme || 'light' });
  await page.addInitScript((pre) => { window.__flowcast = pre; }, { mode: 'record', theme: opt.theme, captions: captions === 'off' ? 'off' : undefined });
  await page.goto('file://' + html); await page.waitForFunction(() => window.flowcast && window.flowcast.beats); await page.evaluate(() => document.fonts.ready);
  const beats = await page.evaluate(() => flowcast.beats.map(b => b.ms));
  runs[captions] = [];
  for (let i = 0; i < beats.length; i++) {
    await page.evaluate((n) => flowcast.go(n), i); await page.waitForTimeout(beats[i] * 0.95);
    runs[captions].push(await page.evaluate(() => {
      const stage = document.getElementById('fc-stage'), sr = stage.getBoundingClientRect(), k = sr.width / stage.offsetWidth;
      const seen = (e) => { for (let n = e; n && n !== stage; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false; } return true; };
      const name = (e) => e.id ? '#' + e.id : e.classList.length ? '.' + [...e.classList].join('.') : e.tagName.toLowerCase();
      // inside a parent that clips, the parent's edge is the one that matters
      const clippedBy = (e) => { for (let n = e.parentElement; n && n !== stage; n = n.parentElement) if (getComputedStyle(n).overflow !== 'visible') return n; return stage; };
      const player = (e) => { for (let n = e; n && n !== stage; n = n.parentElement) if (n.id.startsWith('fc-') || [...n.classList].some(c => c.startsWith('fc-'))) return true; return false; };
      const out = { cut: [], text: [], pinned: {} }, bars = [];
      for (const e of stage.querySelectorAll('*')) {
        // the player's own parts, like the finger, are not the intro's layout
        if (player(e) || !seen(e)) continue; const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
        const box = clippedBy(e) === stage ? sr : clippedBy(e).getBoundingClientRect();
        const over = Math.max(box.left - r.left, r.right - box.right, box.top - r.top, r.bottom - box.bottom) / k;
        if (over > 4 && clippedBy(e) === stage) out.cut.push(`${name(e)} runs ${Math.round(over)}px past the screen edge`);
        const cs = getComputedStyle(e);
        if (e.children.length === 0 && e.textContent.trim() && cs.textOverflow !== 'ellipsis' && (e.scrollWidth > e.clientWidth + 2 || e.scrollHeight > e.clientHeight + 2) && cs.overflow !== 'visible') out.text.push(`${name(e)} "${e.textContent.trim().slice(0, 30)}" does not fit its box`);
        // a wide positioned bar or sheet in the lower part of the screen: remember how far it sits from the bottom
        if ((cs.position === 'absolute' || cs.position === 'fixed') && r.width > sr.width * 0.5 && r.top - sr.top > sr.height * 0.45 && !bars.some(b => b.contains(e))) { bars.push(e); out.pinned[name(e)] = Math.round((sr.bottom - r.bottom) / k); }
      }
      return out;
    }));
  }
  await page.close();
}
await browser.close();

const notes = [];
runs.on.forEach((beat, i) => {
  for (const c of new Set([...beat.cut, ...runs.off[i].cut])) notes.push(`beat ${i + 1}: ${c}`);
  for (const t of new Set([...beat.text, ...runs.off[i].text])) notes.push(`beat ${i + 1}: ${t}`);
  // the stage grows when captions go off; anything placed from the top then drifts away from the bottom edge
  for (const [el, a] of Object.entries(beat.pinned)) {
    const b = runs.off[i].pinned[el]; if (b === undefined) continue;
    if (Math.abs(b - a) > 8) notes.push(`beat ${i + 1}: ${el} is placed from the top, so it sits ${a}px above the bottom with captions on and ${b}px with them off. Anchor it with bottom: instead of top:`);
  }
});
console.log(notes.length ? [...new Set(notes)].join('\n') : `All clear: ${runs.on.length} beats, captions on and off, nothing cut off, overflowing or floating.`);
