// Where everything is in an intro, by line, so a change reads only the lines it needs instead of the whole file.
// Usage: node map.mjs flowcast/<feature>/intro.html
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) { console.error('usage: node map.mjs intro.html'); process.exit(1); }
const L = readFileSync(file, 'utf8').split('\n');
const at = (re, from = 0) => { for (let k = from; k < L.length; k++) if (re.test(L[k])) return k; return -1; };
const n = (k) => k + 1;
// the line where a block opened at k closes, by counting brackets
const close = (k, open = '{', shut = '}') => { let d = 0; for (let j = k; j < L.length; j++) { for (const c of L[j]) { if (c === open) d++; else if (c === shut && --d === 0) return j; } } return k; };
const out = [];

const st = at(/<style>/), se = at(/<\/style>/);
if (st >= 0) out.push(`style          ${n(st)}-${n(se)}`);
const sc = at(/<template id="scene">/), sce = sc >= 0 ? at(/<\/template>/, sc) : -1;
if (sc >= 0) {
  out.push(`scene markup   ${n(sc)}-${n(sce)}`);
  const ids = []; for (let k = sc; k <= sce; k++) for (const m of L[k].matchAll(/\bid="([^"]+)"/g)) ids.push(`#${m[1]} ${n(k)}`);
  if (ids.length) out.push(`  ids          ${ids.join(' · ')}`);
}
for (const [name, re] of [['end card', /<template id="endcard">/], ['around', /<template id="around">/], ['T timings', /^\s*const T = /], ['palette', /^\s*const palette = /], ['canvas words', /^\s*const canvas = /]]) {
  const k = at(re); if (k >= 0) out.push(`${name.padEnd(15)}${n(k)}${/[[{(]\s*$/.test(L[k]) ? `-${n(close(k))}` : ''}`);
}
const b = at(/^\s*const beats = \[/);
if (b >= 0) {
  const be = close(b, '[', ']'); out.push(`beats          ${n(b)}-${n(be)}`);
  let i = 0; for (let k = b + 1; k < be; k++) { const t = L[k].match(/title:\s*([^,]+(?:'[^']*'|"[^"]*")?)/); if (t) out.push(`  ${i++}            ${n(k)}  ${t[1].trim().slice(0, 60)}${/ms:\s*(\d+)/.test(L[k]) ? ` · ${(+L[k].match(/ms:\s*(\d+)/)[1] / 1000)}s` : ''}`); }
}
const ap = at(/^\s*function apply\(/); if (ap >= 0) out.push(`apply(i)       ${n(ap)}-${n(close(ap))}  sets each beat's resting state`);
const s = at(/^\s*const scene = \{/);
if (s >= 0) {
  const sEnd = close(s); out.push(`scene steps    ${n(s)}-${n(sEnd)}`);
  const steps = []; for (let k = s + 1; k < sEnd; k++) { const m = L[k].match(/^\s*(\d+)\s*:/); if (m) steps.push(`${m[1]}: ${n(k)}-${n(close(k))}`); }
  if (steps.length) out.push(`  ${steps.join(' · ')}`);
}
console.log(`${file} · ${L.length} lines\n` + out.join('\n'));
