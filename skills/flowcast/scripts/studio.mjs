// The studio. Serves every intro of every registered project on localhost: History at /, each intro at /<project>/<name>/.
// Usage: node studio.mjs [flowcast-folder | intro.html] [--port 7788]
// Layout per project: flowcast/<name>/intro.html, intro.state.json (what the user set on the page), exports/ (the files they made).
import { createServer } from 'node:http';
import { readFile, writeFile, stat, mkdir, readdir, rename, unlink, copyFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve, dirname, join, extname, basename } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const [,, input = 'flowcast', ...rest] = process.argv;
const opt = Object.fromEntries(rest.map((a, k, arr) => a.startsWith('--') ? [a.slice(2), arr[k + 1]] : null).filter(Boolean));
const port = +(opt.port || 7788);
// given one intro, the studio still serves its whole flowcast folder and opens on that intro
const given = resolve(input), single = given.endsWith('.html');
const startRoot = single ? dirname(dirname(given)) : given;
const here = dirname(fileURLToPath(import.meta.url)), playerDir = resolve(here, '../player');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.mp4': 'video/mp4', '.gif': 'image/gif', '.pdf': 'application/pdf' };
const MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#FF6B4A"/><rect x="14" y="12" width="28" height="36" rx="6" fill="#fff" opacity=".45"/><rect x="19" y="16" width="28" height="36" rx="6" fill="#fff" opacity=".7"/><rect x="24" y="20" width="28" height="34" rx="6" fill="#fff"/><path d="M33 30v14l11-7z" fill="#FF6B4A"/></svg>';

// every project that has intros, kept in one list in the home folder; each project's intros stay in its own flowcast/ folder
// FLOWCAST_HOME moves the list elsewhere, so the tests never touch the user's own
const REGISTRY = join(process.env.FLOWCAST_HOME || join(homedir(), '.flowcast'), 'projects.json');
// { version, projects: [{ root, added, opened }] }: one entry per project, new fields can be added later without breaking older readers
async function readRegistry() {
  try { const data = JSON.parse(await readFile(REGISTRY, 'utf8'));
    const list = Array.isArray(data) ? data.map(root => ({ root })) : data.projects || [];
    return list.filter(p => p && typeof p.root === 'string');
  } catch { return []; }
}
async function register(root) {
  const list = await readRegistry(), now = new Date().toISOString(), hit = list.find(p => p.root === root);
  if (hit) hit.opened = now; else list.push({ root, added: now, opened: now });
  // written to a side file and moved into place, so two studios writing at once never leave half a file
  await mkdir(dirname(REGISTRY), { recursive: true });
  const tmp = `${REGISTRY}.${process.pid}.tmp`; await writeFile(tmp, JSON.stringify({ version: 1, projects: list }, null, 2)); await rename(tmp, REGISTRY);
}
// the projects that still exist, each with the name it has in the URL: its folder's name, numbered when two share one
async function projects() {
  const list = [], used = new Set();
  for (const { root } of await readRegistry()) {
    try { if (!(await stat(root)).isDirectory()) continue; } catch { continue; }
    const base = (basename(root) === 'flowcast' ? basename(dirname(root)) : basename(root)).toLowerCase().replace(/[^a-z0-9._-]+/g, '-') || 'project';
    let slug = base; for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    used.add(slug); list.push({ slug, root, name: basename(root) === 'flowcast' ? basename(dirname(root)) : basename(root) });
  }
  return list;
}

// one logo per project, kept in its flowcast/ folder: History shows it and every intro in the project can use it as ../logo.<ext>
const LOGO_TYPES = { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };
const logoOf = async (root) => { for (const ext of Object.keys(LOGO_TYPES)) { try { await stat(join(root, `logo.${ext}`)); return `logo.${ext}`; } catch {} } return null; };
// a project with no logo yet gets the app's own icon, found by a short search and copied to flowcast/logo.<ext> once
const SKIP = new Set(['node_modules', 'build', '.git', 'Pods', '.gradle', 'DerivedData', 'dist', '.next', 'flowcast', 'vendor', 'target']);
async function findAppLogo(dir) {
  const found = []; let seen = 0;
  const rank = (p) => (/[/\\](dev|debug|test|preview|staging)[/\\]/i.test(p) ? 10 : 0) + p.split('/').length / 100;
  const walk = async (d, depth) => {
    if (depth > 6 || seen > 40000) return; let entries = []; try { entries = await readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      seen++; const full = join(d, e.name);
      if (e.isDirectory()) {
        if (e.name.endsWith('AppIcon.appiconset')) {
          // the largest picture in the icon set is the 1024px one
          let best = null, size = 0; for (const f of await readdir(full).catch(() => [])) { if (!f.endsWith('.png')) continue; const s = (await stat(join(full, f))).size; if (s > size) { size = s; best = join(full, f); } }
          if (best) found.push({ file: best, score: 2 + rank(best) });
        } else if (!SKIP.has(e.name)) await walk(full, depth + 1);
      } else if (/^logo\.svg$/i.test(e.name)) found.push({ file: full, score: 1 + rank(full) });
      else if (e.name === 'ic_launcher.png' && d.endsWith('mipmap-xxxhdpi')) found.push({ file: full, score: 3 + rank(full) });
      else if (/^(logo\.png|icon\.svg|app[_-]?icon\.png|favicon\.svg)$/i.test(e.name)) found.push({ file: full, score: 4 + rank(full) });
    }
  };
  await walk(dir, 0);
  return found.sort((a, b) => a.score - b.score)[0]?.file || null;
}
const searched = new Set();
async function ensureLogo(root) {
  const have = await logoOf(root); if (have || searched.has(root)) return have; searched.add(root);
  const app = await findAppLogo(basename(root) === 'flowcast' ? dirname(root) : root); if (!app) return null;
  const ext = extname(app).slice(1).toLowerCase(); await copyFile(app, join(root, `logo.${ext}`)); return `logo.${ext}`;
}
const intro = (root, name) => join(root, name, 'intro.html');
const stateOf = (root, name) => join(root, name, 'intro.state.json');
const safe = (name) => /^[a-z0-9][a-z0-9._-]*$/i.test(name);

const run = (script, args) => new Promise((res, rej) => {
  const p = spawn(process.execPath, [join(here, script), ...args], { stdio: ['ignore', 'pipe', 'pipe'] }); let out = '', err = '';
  p.stdout.on('data', d => out += d); p.stderr.on('data', d => err += d);
  p.on('close', c => c ? rej(new Error(err.trim().split('\n').pop() || `exit ${c}`)) : res(out.trim()));
});
const flags = (root, name, q) => ['--theme', q.theme || 'light', ...(q.canvas && q.canvas !== 'none' ? ['--canvas', q.canvas, '--phone', q.phone || 'center'] : []), ...(q.captions === 'off' ? ['--captions', 'off'] : q.captions === 'below' ? ['--captions', 'below'] : []), '--state', stateOf(root, name)];
// show the file in the system's file manager
const reveal = (file) => { const isDir = !extname(file); if (process.platform === 'darwin') spawn('open', isDir ? [file] : ['-R', file]); else if (process.platform === 'win32') spawn('explorer', isDir ? [file] : ['/select,', file]); else spawn('xdg-open', [isDir ? file : dirname(file)]); };

// every export is a new file: flowcast-<project>.<ext>, then -2, -3, so an earlier one is never overwritten
async function nextFree(base, ext) {
  const taken = async (p) => stat(p).then(() => true, () => false);
  for (let n = 1; ; n++) { const b = n === 1 ? base : `${base}-${n}`; if (!(await taken(ext ? `${b}.${ext}` : b))) return b; }
}
// every export is a new file named for the project and the minute it was made, so an earlier one is never overwritten
const stamp = (d = new Date()) => [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()].map((n, k) => String(n).padStart(k ? 2 : 4, '0')).join('-');
async function freeName(stem, ext) {
  for (let n = 1; ; n++) { const b = n === 1 ? stem : `${stem}-${n}`; if (!(await stat(ext ? `${b}.${ext}` : b).then(() => true, () => false))) return b; }
}
async function exportIt(root, name, q) {
  const outDir = join(root, name, 'exports'); await mkdir(outDir, { recursive: true });
  const project = (q.project || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const stem = join(outDir, `flowcast-${project}-${stamp()}`);
  if (q.format === 'frames' || q.format === 'slides') {
    const base = await freeName(stem, q.format === 'slides' ? 'pdf' : null), fdir = q.format === 'slides' ? `${base}-frames` : base;
    const args = [intro(root, name), fdir, ...flags(root, name, q)]; if (q.format === 'slides') args.push('--pdf', `${base}.pdf`);
    const files = (await run('frames.mjs', args)).split('\n'); return q.format === 'slides' ? files[files.length - 1] : fdir;
  }
  const ext = q.format === 'gif' ? 'gif' : 'mp4', base = await freeName(stem, ext);
  const webm = `${base}.webm`; await run('record.mjs', [intro(root, name), webm, ...flags(root, name, q)]);
  const out = `${base}.${ext}`; await run('convert.mjs', [webm, out, ...(ext === 'gif' ? ['--width', '720'] : [])]);
  // the raw recording is only a step on the way
  await unlink(webm).catch(() => {}); await unlink(`${webm}.json`).catch(() => {});
  return out;
}

// every intro in a project's folder, newest edit first, with the formats already exported from it
async function intros(root) {
  let names = []; try { names = await readdir(root); } catch {}
  const list = [];
  for (const n of names) {
    try { const st = await stat(intro(root, n)); const html = await readFile(intro(root, n), 'utf8');
      let files = []; try { files = await readdir(join(root, n, 'exports')); } catch {}
      const kinds = [...new Set(files.map(f => !f.includes('.') ? 'PNG' : { mp4: 'MP4', gif: 'GIF', pdf: 'PDF' }[f.split('.').pop()]).filter(Boolean))];
      list.push({ name: n, title: (html.match(/<title>([^<]*)<\/title>/) || [, n])[1], edited: st.mtimeMs, kinds });
    } catch {}
  }
  return list.sort((a, b) => b.edited - a.edited);
}

// a cover and the facts for the History card, from one load of the intro with the user's settings; cached until the intro or its settings change
const cardsInProgress = new Map();
async function card({ slug, root }, name) {
  const dir = join(root, name, 'exports'), coverFile = join(dir, '.cover.png'), metaFile = join(dir, '.meta.json');
  const changed = Math.max((await stat(intro(root, name))).mtimeMs, await stat(stateOf(root, name)).then(s => s.mtimeMs, () => 0));
  try { if ((await stat(metaFile)).mtimeMs > changed && (await stat(coverFile)).mtimeMs > changed) return JSON.parse(await readFile(metaFile, 'utf8')); } catch {}
  const key = `${slug}/${name}`; if (cardsInProgress.has(key)) return cardsInProgress.get(key);
  const job = (async () => {
    await mkdir(dir, { recursive: true });
    const { chromium } = await import('playwright');
    const b = await chromium.launch();
    try {
      const p = await b.newPage({ viewport: { width: 1280, height: 1280 } });
      await p.goto(`http://127.0.0.1:${port}/${slug}/${name}/?mode=record`); await p.waitForFunction(() => window.flowcast && window.flowcast.beats, null, { timeout: 15000 });
      const facts = await p.evaluate(() => ({ total: flowcast.total, frame: flowcast.frame, size: flowcast.size, canvas: flowcast.canvas() || null }));
      await p.evaluate(() => flowcast.go(Math.floor(flowcast.beats.length / 2))); await p.waitForTimeout(2200);
      await p.locator('#fc-canvas').screenshot({ path: coverFile });
      const view = facts.canvas || (facts.frame === 'none' && facts.size[1] ? facts.size : facts.frame === 'browser' ? [1280, 800] : [390, 844]);
      const meta = { seconds: Math.round(facts.total / 100) / 10, view, label: facts.canvas || (facts.frame === 'none' && facts.size[1]) ? `${view[0]}×${view[1]}` : facts.frame === 'browser' ? 'Browser' : 'Phone' };
      await writeFile(metaFile, JSON.stringify(meta)); return meta;
    } finally { await b.close(); cardsInProgress.delete(key); }
  })();
  cardsInProgress.set(key, job); return job;
}

const ago = (ms) => { const m = (Date.now() - ms) / 60000; return m < 1 ? 'just now' : m < 60 ? `${Math.round(m)} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// History: every project, or with `only`, one project's own page
async function history(only) {
  const groups = []; for (const project of await projects()) { if (only && project.slug !== only.slug) continue; const projectIntros = await intros(project.root); if (projectIntros.length || only) groups.push({ ...project, projectIntros, logo: await ensureLogo(project.root), latest: projectIntros[0]?.edited || 0 }); }
  groups.sort((a, b) => b.latest - a.latest);
  const count = groups.reduce((n, group) => n + group.projectIntros.length, 0);
  const cardOf = (group, entry) => { const u = `/${group.slug}/${encodeURIComponent(entry.name)}/`;
    return `<a class="card" href="${u}" data-url="${u}" data-name="${esc(entry.name)}" data-title="${esc(entry.title.toLowerCase())}" data-edited="${entry.edited}">
  <span class="cv"><img class="wait" src="/__flowcast/motion.svg" alt=""><img src="${u}cover.png" alt="" loading="lazy" onload="this.parentNode.classList.add('ready')"><span class="live"></span><span class="play"><svg viewBox="0 0 24 24"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg></span></span>
  <span class="body"><b>${esc(entry.title)}</b><span class="facts"><span class="meta"></span><span>${ago(entry.edited)}</span></span>
  ${entry.kinds.length ? `<span class="kinds">${entry.kinds.map(k => `<i>${k}</i>`).join('')}<button class="open" title="Open the exports folder"><svg viewBox="0 0 24 24"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>Open folder</button></span>` : '<span class="kinds none">Not exported yet</span>'}</span></a>`; };
  const cards = groups.map(group => `<section class="proj" id="p-${group.slug}" data-slug="${group.slug}"><h2><button class="pi${group.logo ? ' has' : ''}" title="${group.logo ? 'Change' : 'Add'} the logo: click or drop an image">${group.logo ? `<img src="/${group.slug}/${group.logo}?v=${Date.now()}" alt="">` : esc(group.name.slice(0, 1).toUpperCase())}</button>${only ? `<b>${esc(group.name)}</b>` : `<a href="/${group.slug}/"><b>${esc(group.name)}</b></a>`}<small>${group.projectIntros.length} intro${group.projectIntros.length === 1 ? '' : 's'} \u00b7 ${esc(group.root.replace(homedir(), '~'))}</small></h2><div class="grid">${group.projectIntros.map(entry => cardOf(group, entry)).join('')}</div></section>`).join('');
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Flowcast</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(MARK)}">
<style>
:root{--bg:#eeeef2;--panel:#fff;--field:#f4f4f7;--line:rgba(20,18,30,.09);--text:#17161b;--muted:#7a7680;--hover:rgba(20,18,30,.05);--accent:#FF6B4A;--font:-apple-system,'SF Pro Text',Inter,system-ui,sans-serif}
@media (prefers-color-scheme:dark){:root{--bg:#0e0d11;--panel:#18171c;--field:#222127;--line:rgba(255,255,255,.08);--text:#f1f0f3;--muted:#9a96a0;--hover:rgba(255,255,255,.05);--accent:#FF7A5C;color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:14px/1.4 var(--font)}
header{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:8px;height:64px;box-sizing:border-box;padding:0 max(24px,env(safe-area-inset-left,0px));background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.crumb{display:flex;align-items:center;gap:8px;font-weight:700;font-size:16px;color:var(--text);text-decoration:none}
.crumb svg{width:28px;height:28px}
.tools{margin-left:auto;display:flex;gap:8px}
.tools input,.tools select{font:600 13px var(--font);height:36px;border-radius:10px;border:1px solid var(--line);background:var(--panel);color:var(--text);padding:0 12px}
.tools input{width:220px}.tools input::placeholder{color:var(--muted);font-weight:500}
.tools select{appearance:none;padding-right:32px;background:var(--panel) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 11px center;cursor:pointer}
main{max-width:1240px;margin:0 auto;padding:28px max(24px,env(safe-area-inset-left,0px)) 56px}
h1{font-size:26px;letter-spacing:-.4px;margin:0 0 4px}
p.sub{color:var(--muted);margin:0 0 24px}
.proj{margin-bottom:40px;scroll-margin-top:84px}
.proj h2{display:flex;align-items:center;gap:10px;margin:0 0 14px;font-size:16px;letter-spacing:-.2px}
.proj h2 a{color:inherit;text-decoration:none}.proj h2 a:hover{text-decoration:underline}
.crumb+.sep{color:var(--muted);opacity:.6;font-weight:400;font-size:16px}.here{font-weight:600;font-size:14px;color:var(--muted)}
.proj h2 .pi{font:inherit;cursor:pointer;padding:0;overflow:hidden;transition:border-color .15s,transform .15s}.proj h2 .pi:hover,.proj h2 .pi.drop{border-color:var(--accent);transform:scale(1.06)}.proj h2 .pi img{width:100%;height:100%;object-fit:contain}.proj h2 .pi.has{background:transparent}
.proj h2 .pi{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:var(--panel);border:1px solid var(--line);font-size:13px;color:var(--muted)}
.proj h2 small{font-size:12.5px;font-weight:500;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px}
.card{display:flex;flex-direction:column;text-decoration:none;color:inherit;background:var(--panel);border:1px solid var(--line);border-radius:18px;overflow:hidden;transition:transform .2s cubic-bezier(.3,.7,.2,1),box-shadow .2s,border-color .2s}
.card:hover{transform:translateY(-3px);box-shadow:0 14px 36px rgba(0,0,0,.14);border-color:color-mix(in srgb,var(--accent) 35%,var(--line))}
.cv{position:relative;aspect-ratio:1/1;background:var(--field);display:grid;place-items:center;overflow:hidden;border-bottom:1px solid var(--line)}
.cv img{width:100%;height:100%;object-fit:contain;transition:opacity .3s}
.cv .wait{position:absolute;width:84px;height:84px;transition:opacity .3s}.cv.ready .wait{opacity:0}
.cv:not(.ready) img:not(.wait){opacity:0}
.live{position:absolute;inset:0;opacity:0;transition:opacity .3s;overflow:hidden}
.live iframe{position:absolute;left:50%;top:50%;border:0;transform-origin:0 0;pointer-events:none;background:transparent}
.card.playing .live{opacity:1}.card.playing .cv img{opacity:0}
.play{position:absolute;width:44px;height:44px;border-radius:50%;background:var(--panel);display:grid;place-items:center;box-shadow:0 6px 18px rgba(0,0,0,.18);transition:opacity .2s,transform .2s}
.play svg{width:16px;height:16px;fill:var(--text);margin-left:2px}
.card:hover .play{opacity:0;transform:scale(.8)}
.body{display:grid;gap:6px;padding:14px 16px 16px}
.body b{font-size:15px;letter-spacing:-.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.facts{display:flex;gap:8px;color:var(--muted);font-size:12.5px;font-variant-numeric:tabular-nums}
.facts span+span::before{content:'\\00b7';margin-right:8px}
.facts .meta:empty,.facts .meta:empty+span::before{display:none}
.kinds{display:flex;gap:5px;flex-wrap:wrap;margin-top:2px}
.kinds i{font:700 10.5px/1 var(--font);font-style:normal;letter-spacing:.04em;padding:5px 7px;border-radius:6px;background:color-mix(in srgb,var(--accent) 12%,var(--field));color:var(--accent)}
.kinds.none{font-size:12px;color:var(--muted)}
.kinds .open{margin-left:auto;display:inline-flex;align-items:center;gap:5px;font:600 11.5px/1 var(--font);color:var(--text);background:var(--field);border:1px solid var(--line);border-radius:7px;padding:4px 8px;cursor:pointer}
.kinds .open:hover{border-color:var(--accent);color:var(--accent)}
.kinds .open svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.empty,.nomatch{padding:72px 0;text-align:center;color:var(--muted)}
.empty code{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:2px 6px}
@media (max-width:640px){.tools input{width:140px}}
</style>
<header><a class="crumb" href="/">${MARK}Flowcast</a>${only ? `<span class="sep">/</span><span class="here">${esc(only.name)}</span>` : ''}${count ? `<div class="tools"><input id="q" type="search" placeholder="Search intros" aria-label="Search intros"><select id="sort" aria-label="Sort"><option value="edited">Last edited</option><option value="name">Name</option></select></div>` : ''}</header>
<main><h1>${only ? esc(only.name) : 'Your intros'}</h1><p class="sub">${only ? `${count} intro${count === 1 ? '' : 's'} in ${esc(only.root.replace(homedir(), '~'))}.` : `${count} intro${count === 1 ? '' : 's'} across ${groups.length} project${groups.length === 1 ? '' : 's'}.`} Open one to play, change or export it again.</p>
${count ? `<div id="grid">${cards}</div><div class="nomatch" id="nomatch" hidden>No intro matches that search.</div>` : `<div class="empty">No intros yet. Run <code>/flowcast</code> with a feature or a story to make the first one.</div>`}</main>
<script>
// facts arrive per card once its cover is ready; a hover plays the intro itself, scaled into the card
// Open folder sits inside the card's link: it opens the folder instead of the intro
document.querySelectorAll('.card .open').forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); fetch(b.closest('.card').dataset.url + 'open', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"folder":true}' }); }));
document.querySelectorAll('.card').forEach(c => {
  const u = c.dataset.url; let meta = null;
  fetch(u + 'meta.json').then(r => r.ok ? r.json() : null).then(m => { if (!m) return; meta = m; c.querySelector('.meta').textContent = m.label + ' \\u00b7 ' + m.seconds + 's'; }).catch(() => {});
  let t; c.addEventListener('mouseenter', () => { t = setTimeout(() => { if (!meta) return; const live = c.querySelector('.live'), [w, h] = meta.view, box = c.querySelector('.cv').getBoundingClientRect(), k = Math.min(box.width / w, box.height / h);
    live.innerHTML = '<iframe src="' + u + '?mode=record" width="' + w + '" height="' + h + '" style="transform:scale(' + k + ') translate(-50%,-50%)" tabindex="-1" aria-hidden="true"></iframe>'; c.classList.add('playing'); }, 250); });
  c.addEventListener('mouseleave', () => { clearTimeout(t); c.classList.remove('playing'); setTimeout(() => { if (!c.classList.contains('playing')) c.querySelector('.live').innerHTML = ''; }, 300); });
});
// a project's logo: click its square or drop an image on it; it is saved in that project's flowcast folder
document.querySelectorAll('.proj .pi').forEach(b => {
  const slug = b.closest('.proj').dataset.slug, save = async (file) => { if (!file || !['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return;
    const r = await fetch('/' + slug + '/logo', { method: 'POST', headers: { 'content-type': file.type }, body: file }); if (r.ok) location.reload(); };
  b.addEventListener('click', () => { const i = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/svg+xml,image/png,image/jpeg,image/webp' }); i.onchange = () => save(i.files[0]); i.click(); });
  b.addEventListener('dragover', (e) => { e.preventDefault(); b.classList.add('drop'); }); b.addEventListener('dragleave', () => b.classList.remove('drop'));
  b.addEventListener('drop', (e) => { e.preventDefault(); b.classList.remove('drop'); save(e.dataTransfer.files[0]); });
});
const grid = document.getElementById('grid'), q = document.getElementById('q'), sort = document.getElementById('sort');
if (grid) {
  // search runs across every project; a project with nothing matching hides
  q.addEventListener('input', () => { const v = q.value.trim().toLowerCase(); let shown = 0;
    grid.querySelectorAll('.proj').forEach(section => { let n = 0; section.querySelectorAll('.card').forEach(c => { const on = !v || c.dataset.title.includes(v) || c.dataset.name.includes(v) || section.id.includes(v); c.hidden = !on; n += on; }); section.hidden = !n; shown += n; });
    document.getElementById('nomatch').hidden = shown > 0; });
  sort.addEventListener('change', () => grid.querySelectorAll('.proj .grid').forEach(projectGrid => { const cs = [...projectGrid.children]; cs.sort((a, b) => sort.value === 'name' ? a.dataset.title.localeCompare(b.dataset.title) : b.dataset.edited - a.dataset.edited); cs.forEach(c => projectGrid.append(c)); }));
}
</script>`;
}

await register(startRoot);
createServer(async (req, res) => {
  const send = (code, type, body) => { res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }); res.end(body); };
  try {
    const url = new URL(req.url, 'http://x'), path = decodeURIComponent(url.pathname), parts = path.split('/').filter(Boolean);
    if (path === '/__ping') return send(200, 'application/json', JSON.stringify({ flowcast: true, projects: await projects() }));
    // a project's first intro adds it to the running studio, which answers with the name it has in the URL
    if (path === '/__add' && req.method === 'POST') {
      let body = ''; for await (const c of req) body += c; const root = resolve(JSON.parse(body || '{}').root || '');
      await mkdir(root, { recursive: true }); await register(root);
      return send(200, 'application/json', JSON.stringify({ ok: true, project: (await projects()).find(p => p.root === root)?.slug }));
    }
    if (path === '/__flowcast/motion.svg') return send(200, TYPES['.svg'], await readFile(join(playerDir, 'motion.svg')));
    if (path === '/') return send(200, TYPES['.html'], await history());
    const all = await projects(), proj = all.find(p => p.slug === parts[0]);
    // an old /<intro>/ link still lands, on the project that has that intro
    if (!proj) { for (const p of all) { try { await stat(intro(p.root, parts[0])); res.writeHead(302, { location: `/${p.slug}/${parts.join('/')}${path.endsWith('/') ? '/' : ''}` }); return res.end(); } catch {} } return send(404, 'text/plain', 'not found'); }
    const { root } = proj, name = parts[1];
    if (!name) { if (!path.endsWith('/')) { res.writeHead(302, { location: `/${proj.slug}/` }); return res.end(); } return send(200, TYPES['.html'], await history(proj)); }
    // the project's logo, saved from History as flowcast/logo.<ext>, replacing any earlier one
    if (name === 'logo' && req.method === 'POST') {
      const ext = { 'image/svg+xml': 'svg', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[req.headers['content-type']];
      if (!ext) return send(415, 'application/json', JSON.stringify({ ok: false, error: 'Use an SVG, PNG, JPG or WebP image.' }));
      const chunks = []; let size = 0; for await (const c of req) { size += c.length; if (size > 4e6) return send(413, 'application/json', JSON.stringify({ ok: false, error: 'Use an image under 4 MB.' })); chunks.push(c); }
      for (const e of Object.keys(LOGO_TYPES)) await unlink(join(root, `logo.${e}`)).catch(() => {});
      await writeFile(join(root, `logo.${ext}`), Buffer.concat(chunks)); return send(200, 'application/json', JSON.stringify({ ok: true, file: `logo.${ext}` }));
    }
    if (/^logo\.(svg|png|jpg|webp)$/.test(name)) return send(200, LOGO_TYPES[name.split('.').pop()], await readFile(join(root, name)));
    if (!safe(name)) return send(404, 'text/plain', 'not found');
    const sub = parts[2];
    if (req.method === 'POST') {
      let body = ''; for await (const c of req) body += c; const q = JSON.parse(body || '{}');
      if (sub === 'state') { await writeFile(stateOf(root, name), body); return send(200, 'application/json', '{"ok":true}'); }
      if (sub === 'open') { if (q.folder) reveal(join(root, name, 'exports')); else if (q.file && q.file.startsWith(join(root, name))) reveal(q.file); return send(200, 'application/json', '{"ok":true}'); }
      if (sub === 'export') { await writeFile(stateOf(root, name), JSON.stringify(q)); const file = await exportIt(root, name, q); reveal(file); return send(200, 'application/json', JSON.stringify({ ok: true, file })); }
      return send(404, 'text/plain', 'not found');
    }
    if (parts.length === 2 && !path.endsWith('/')) { res.writeHead(302, { location: `/${proj.slug}/${name}/${url.search}` }); return res.end(); }
    if (parts.length === 2) {
      // the intro opens with what the user last set on it
      let st = {}; try { st = JSON.parse(await readFile(stateOf(root, name), 'utf8')); } catch {}
      // ?mode=record plays it bare, for the History cover and the hover preview
      const pre = { ...(url.searchParams.get('mode') === 'record' ? { mode: 'record' } : {}), project: proj.name, exported: await readdir(join(root, name, 'exports')).then(fs => fs.some(f => !f.startsWith('.') && !f.endsWith('.webm') && !f.endsWith('.json')), () => false), canvas: st.canvas, phone: st.phone, theme: st.theme, slots: st.slots, words: st.words, speed: st.speed, durations: st.durations, colors: st.colors, credit: st.credit, ...(st.captions === 'off' ? { captions: 'off' } : st.captions ? { captionsAt: st.captions } : {}) };
      const html = String(await readFile(intro(root, name))).replace('<script', `<script>window.__flowcast=${JSON.stringify(pre)}</script><script`);
      return send(200, TYPES['.html'], html);
    }
    if (sub === 'cover.png') { await card(proj, name); return send(200, 'image/png', await readFile(join(root, name, 'exports', '.cover.png'))); }
    if (sub === 'meta.json') return send(200, 'application/json', JSON.stringify(await card(proj, name)));
    // the player comes from the skill unless the intro folder has its own
    let file = join(root, ...parts.slice(1));
    if (/^(player\.(css|js)|motion\.svg)$/.test(sub)) { try { await stat(file); } catch { file = join(playerDir, sub); } }
    if (!file.startsWith(root) && !file.startsWith(playerDir)) return send(404, 'text/plain', 'not found');
    return send(200, TYPES[extname(file)] || 'application/octet-stream', await readFile(file));
  } catch (e) {
    send(e.code === 'ENOENT' ? 404 : 500, 'application/json', JSON.stringify({ ok: false, error: e.message }));
  }
}).listen(port, '127.0.0.1', async () => { const me = (await projects()).find(p => p.root === startRoot); console.log(`http://localhost:${port}/${single && me ? `${me.slug}/${basename(dirname(given))}/` : ''}`); });
