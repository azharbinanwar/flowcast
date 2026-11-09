// The studio. Serves every intro of every registered project on localhost: History at /, each intro at /<project>/<name>/.
// Usage: node studio.mjs [flowcast-folder | intro.html] [--port 7788]
// Layout per project: flowcast/<name>/intro.html, intro.state.json (what the user set on the page), exports/ (the files they made).
import { createServer } from 'node:http';
import { readFile, writeFile, stat, mkdir, readdir, rename, unlink, copyFile, cp, rm } from 'node:fs/promises';
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
// the mark on its own, in two colours: --fc-mark for the beats and --fc-on-mark for the play (coral and white by default), in the browser tab
const LOGO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 10 46 46"><rect x="14" y="12" width="28" height="36" rx="6" fill="var(--fc-mark,#FF6B4A)" opacity=".4"/><rect x="19" y="16" width="28" height="36" rx="6" fill="var(--fc-mark,#FF6B4A)" opacity=".65"/><rect x="24" y="20" width="28" height="34" rx="6" fill="var(--fc-mark,#FF6B4A)"/><path d="M33 30v14l11-7z" fill="var(--fc-on-mark,#fff)"/></svg>';
// the app bar shows the mark on its coral tile, like an app icon
const TILE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#FF6B4A"/><rect x="14" y="12" width="28" height="36" rx="6" fill="#fff" opacity=".45"/><rect x="19" y="16" width="28" height="36" rx="6" fill="#fff" opacity=".7"/><rect x="24" y="20" width="28" height="34" rx="6" fill="#fff"/><path d="M33 30v14l11-7z" fill="#FF6B4A"/></svg>';

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
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
async function exportIt(root, name, q) {
  const outDir = join(root, name, 'exports'); await mkdir(outDir, { recursive: true });
  const project = slugify(q.project || name);
  const stem = join(outDir, `flowcast-${project}-${stamp()}`);
  if (q.format === 'frames' || q.format === 'slides') {
    const base = await freeName(stem, q.format === 'slides' ? 'pdf' : null), fdir = q.format === 'slides' ? `${base}-frames` : base;
    const o = q.exportOpts?.[q.format] || {}, args = [intro(root, name), fdir, ...flags(root, name, q), '--scale', String(o.scale || 2)];
    if (q.format === 'slides') args.push('--pdf', `${base}.pdf`, '--pdf-text', o.text === 'real' ? 'real' : 'picture');
    const files = (await run('frames.mjs', args)).split('\n'); return q.format === 'slides' ? files[files.length - 1] : fdir;
  }
  const ext = q.format === 'gif' ? 'gif' : 'mp4', base = await freeName(stem, ext);
  const o = q.exportOpts?.[q.format] || {}, out = `${base}.${ext}`;
  if (ext === 'mp4') { await run('record.mjs', [intro(root, name), out, ...flags(root, name, q), '--quality', o.quality || 'high']); return out; }
  // a GIF is made from a clean recording; the recording is only a step on the way
  const rec = `${base}.rec.mp4`; await run('record.mjs', [intro(root, name), rec, ...flags(root, name, q), '--quality', 'high']);
  await run('convert.mjs', [rec, out, '--width', String(o.width || 800), '--fps', String(o.fps || 15)]).finally(() => unlink(rec).catch(() => {}));
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
      // an intro renamed or moved to the Trash while its cover was being made: leave no folder behind for it
      if (!(await stat(intro(root, name)).then(() => true, () => false))) { await rm(join(root, name), { recursive: true, force: true }); return meta; }
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
  <span class="cv"><button class="more" type="button" aria-label="More for ${esc(entry.title)}" title="Rename, duplicate or delete">\u22ef</button><span class="menu" hidden><button type="button" data-act="rename"><svg viewBox="0 0 24 24"><path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5zM15 5l4 4"/></svg>Rename</button><button type="button" data-act="duplicate"><svg viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>Duplicate</button><button type="button" data-act="delete" class="danger"><svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>Delete\u2026</button></span><img class="wait" src="/__flowcast/motion.svg#mark" alt=""><img src="${u}cover.png" alt="" loading="lazy" onload="this.parentNode.classList.add('ready')"><span class="live"></span><span class="play"><svg viewBox="0 0 24 24"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg></span></span>
  <span class="body"><b>${esc(entry.title)}</b><span class="facts"><span class="meta"></span><span>${ago(entry.edited)}</span></span>
  ${entry.kinds.length ? `<span class="kinds">${entry.kinds.map(k => `<i>${k}</i>`).join('')}<button class="open" title="Open the exports folder"><svg viewBox="0 0 24 24"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>Open folder</button></span>` : '<span class="kinds none">Not exported yet</span>'}</span></a>`; };
  const cards = groups.map(group => `<section class="proj" id="p-${group.slug}" data-slug="${group.slug}"><h2><button class="pi${group.logo ? ' has' : ''}" title="${group.logo ? 'Change' : 'Add'} the logo: click or drop an image">${group.logo ? `<img src="/${group.slug}/${group.logo}?v=${Date.now()}" alt="">` : esc(group.name.slice(0, 1).toUpperCase())}</button>${only ? `<b>${esc(group.name)}</b>` : `<a href="/${group.slug}/"><b>${esc(group.name)}</b></a>`}<small>${group.projectIntros.length} intro${group.projectIntros.length === 1 ? '' : 's'} \u00b7 ${esc(group.root.replace(homedir(), '~'))}</small></h2><div class="grid">${group.projectIntros.map(entry => cardOf(group, entry)).join('')}</div></section>`).join('');
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Flowcast</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(LOGO)}">
<style>
:root{--bg:#eeeef2;--panel:#fff;--field:#f4f4f7;--line:rgba(20,18,30,.09);--text:#17161b;--muted:#7a7680;--hover:rgba(20,18,30,.05);--accent:#FF6B4A;--font:-apple-system,'SF Pro Text',Inter,system-ui,sans-serif}
@media (prefers-color-scheme:dark){:root{--bg:#0e0d11;--panel:#18171c;--field:#222127;--line:rgba(255,255,255,.08);--text:#f1f0f3;--muted:#9a96a0;--hover:rgba(255,255,255,.05);--accent:#FF7A5C;color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:14px/1.4 var(--font)}
header{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:8px;height:64px;box-sizing:border-box;padding:0 max(24px,env(safe-area-inset-left,0px));background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.crumb{display:flex;align-items:center;gap:8px;font-weight:700;font-size:16px;color:var(--text);text-decoration:none}
.crumb svg{width:28px;height:28px}
.tools{margin-left:auto;display:flex;gap:8px}
.gh{margin-left:auto;display:flex;align-items:center;gap:6px;height:34px;padding:0 12px;border-radius:9px;border:1px solid var(--line);background:var(--panel);color:var(--text);font-weight:600;font-size:13px;text-decoration:none;transition:border-color .15s}
.tools+.gh{margin-left:0}
.gh:hover{border-color:var(--muted)}
.gh svg{width:16px;height:16px}
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
.cv .more{position:absolute;top:10px;right:10px;z-index:3;width:32px;height:32px;border-radius:9px;border:1px solid var(--line);background:color-mix(in srgb,var(--panel) 90%,transparent);color:var(--text);font:700 18px/1 var(--font);cursor:pointer;opacity:0;transition:opacity .15s}
.card:hover .cv .more,.cv .more:focus-visible,.card.menu-open .cv .more{opacity:1}
.cv .menu{position:absolute;top:48px;right:10px;z-index:4;display:grid;min-width:170px;padding:5px;border-radius:12px;background:var(--panel);border:1px solid var(--line);box-shadow:0 12px 30px rgba(0,0,0,.25)}
.cv .menu button{display:flex;align-items:center;gap:10px;font:600 13px var(--font);text-align:left;padding:8px 10px;border:0;border-radius:8px;background:none;color:var(--text);cursor:pointer}
.cv .menu button:hover{background:var(--hover)}
.cv .menu svg,dialog.ask svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}
.cv .menu svg{color:var(--muted)}.cv .menu .danger svg{color:currentColor}.cv .menu .danger{color:#e5484d}
dialog.ask{border:1px solid var(--line);border-radius:16px;background:var(--panel);color:var(--text);padding:22px 22px 18px;width:min(380px,calc(100vw - 32px));box-shadow:0 24px 60px rgba(0,0,0,.35)}
dialog.ask::backdrop{background:rgba(10,8,14,.55);backdrop-filter:blur(2px)}
dialog.ask h3{margin:0 0 8px;font:700 17px var(--font)}dialog.ask p{margin:0 0 18px;color:var(--muted);font-size:13.5px;line-height:1.5}
dialog.ask .row{display:flex;justify-content:flex-end;gap:8px}
dialog.ask button{display:inline-flex;align-items:center;gap:8px;font:600 13.5px var(--font);height:36px;padding:0 14px;border-radius:10px;border:1px solid var(--line);background:var(--field);color:var(--text);cursor:pointer}
dialog.ask button.danger{background:#e5484d;border-color:#e5484d;color:#fff}
dialog.ask .err{color:#e5484d;font-size:12.5px;margin:-8px 0 12px}
/* anything marked hidden stays hidden, whatever display a rule gives it */
[hidden]{display:none!important}
.card .body input.rn{font:600 15px var(--font);color:var(--text);background:var(--field);border:1px solid var(--accent);border-radius:8px;padding:4px 8px;width:100%;box-sizing:border-box}
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
.note-err{margin:4px 0 0;color:#e5484d;font-size:12px}
.kinds .open{margin-left:auto;display:inline-flex;align-items:center;gap:5px;font:600 11.5px/1 var(--font);color:var(--text);background:var(--field);border:1px solid var(--line);border-radius:7px;padding:4px 8px;cursor:pointer}
.kinds .open:hover{border-color:var(--accent);color:var(--accent)}
.kinds .open svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.empty,.nomatch{padding:72px 0;text-align:center;color:var(--muted)}
.empty code{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:2px 6px}
@media (max-width:640px){.tools input{width:140px}}
</style>
<dialog class="ask" id="ask" aria-labelledby="ask-title"><form method="dialog"><h3 id="ask-title"></h3><p>It moves to the Trash with its exports, so you can put it back from there.</p><p class="err" hidden></p><div class="row"><button value="cancel">Cancel</button><button value="delete" class="danger"><svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>Move to Trash</button></div></form></dialog>
<header><a class="crumb" href="/">${TILE}Flowcast</a>${only ? `<span class="sep">/</span><span class="here">${esc(only.name)}</span>` : ''}${count ? `<div class="tools"><input id="q" type="search" placeholder="Search intros" aria-label="Search intros"><select id="sort" aria-label="Sort"><option value="edited">Last edited</option><option value="name">Name</option></select></div>` : ''}<a class="gh" href="https://github.com/azharbinanwar/flowcast" target="_blank" rel="noopener" title="Flowcast on GitHub"><svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>GitHub</a></header>
<main><h1>${only ? esc(only.name) : 'Your intros'}</h1><p class="sub">${only ? `${count} intro${count === 1 ? '' : 's'} in ${esc(only.root.replace(homedir(), '~'))}.` : `${count} intro${count === 1 ? '' : 's'} across ${groups.length} project${groups.length === 1 ? '' : 's'}.`} Open one to play, change or export it again.</p>
${count ? `<div id="grid">${cards}</div><div class="nomatch" id="nomatch" hidden>No intro matches that search.</div>` : `<div class="empty">No intros yet. Run <code>/flowcast</code> with a feature or a story to make the first one.</div>`}</main>
<script>
// facts arrive per card once its cover is ready; a hover plays the intro itself, scaled into the card
// Open folder sits inside the card's link: it opens the folder instead of the intro
// deleting asks first, in a dialog of its own, and says what went wrong if the move fails
const ask = document.getElementById('ask');
const alertCard = (card, msg) => { const m = Object.assign(document.createElement('p'), { className: 'note-err', textContent: msg || 'That did not work. Try again.' }); card.querySelector('.body').append(m); setTimeout(() => m.remove(), 5000); };
function askDelete(card) {
  ask.querySelector('h3').textContent = 'Delete \u201c' + card.querySelector('.body b').textContent + '\u201d?';
  ask.querySelector('.err').hidden = true; ask.showModal(); ask.querySelector('[value=cancel]').focus();
  ask.onclose = null; ask.querySelector('form').onsubmit = async (e) => { if (e.submitter?.value !== 'delete') return; e.preventDefault();
    const r = await act(card, 'delete'); if (r.ok || r.gone) { ask.close(); location.reload(); } else { const er = ask.querySelector('.err'); er.textContent = 'It could not be moved to the Trash: ' + r.error; er.hidden = false; } };
}
// the ⋯ menu: rename in place, duplicate, or delete
const act = (card, what, body) => fetch(card.dataset.url + what, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) }).then(r => r.json());
document.querySelectorAll('.card').forEach(card => {
  const menu = card.querySelector('.menu'), close = () => { menu.hidden = true; card.classList.remove('menu-open'); };
  card.querySelector('.more').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); const open = menu.hidden; document.querySelectorAll('.card .menu').forEach(m => { m.hidden = true; m.closest('.card').classList.remove('menu-open'); }); menu.hidden = !open; card.classList.toggle('menu-open', open); });
  menu.addEventListener('click', async (e) => { e.preventDefault(); e.stopPropagation(); const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.act === 'delete') { close(); return askDelete(card); }
    if (b.dataset.act === 'duplicate') { const r = await act(card, 'duplicate'); if (r.ok || r.gone) location.reload(); else alertCard(card, r.error); return; }
    if (b.dataset.act === 'rename') { close(); const t = card.querySelector('.body b'), input = Object.assign(document.createElement('input'), { className: 'rn', value: t.textContent, ariaLabel: 'Intro name' }); t.replaceWith(input); input.focus(); input.select();
      const stop = (e) => e.preventDefault(); input.addEventListener('click', stop);
      input.addEventListener('keydown', async (e) => { if (e.key === 'Escape') { input.replaceWith(t); } if (e.key !== 'Enter') return; e.preventDefault(); const title = input.value.trim(); if (!title || title === t.textContent) return input.replaceWith(t); const r = await act(card, 'rename', { title }); if (r.ok || r.gone) location.reload(); else alertCard(card, r.error); }); } });
});
document.addEventListener('click', () => document.querySelectorAll('.card .menu').forEach(m => { m.hidden = true; m.closest('.card').classList.remove('menu-open'); }));
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
      if (['rename', 'duplicate', 'delete'].includes(sub) && !(await stat(intro(root, name)).then(() => true, () => false)))
        return send(404, 'application/json', JSON.stringify({ ok: false, gone: true, error: 'This intro was already moved or deleted.' }));
      // rename: the title in the intro, and the folder to match when that name is free
      if (sub === 'rename') {
        const title = String(q.title || '').trim().slice(0, 120); if (!title) return send(400, 'application/json', JSON.stringify({ ok: false, error: 'Give the intro a name.' }));
        const html = await readFile(intro(root, name), 'utf8'), esc2 = title.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
        await writeFile(intro(root, name), /<title>[^<]*<\/title>/.test(html) ? html.replace(/<title>[^<]*<\/title>/, `<title>${esc2}</title>`) : `<title>${esc2}</title>\n` + html);
        const next = slugify(title); let moved = name;
        if (next && next !== name && !(await stat(join(root, next)).then(() => true, () => false))) { await rename(join(root, name), join(root, next)); moved = next; }
        return send(200, 'application/json', JSON.stringify({ ok: true, name: moved }));
      }
      // duplicate: the intro and its settings, not its exports, as "<name>-copy"
      if (sub === 'duplicate') {
        let copy = `${name}-copy`; for (let n = 2; await stat(join(root, copy)).then(() => true, () => false); n++) copy = `${name}-copy-${n}`;
        await cp(join(root, name), join(root, copy), { recursive: true, verbatimSymlinks: true, filter: (src) => !src.startsWith(join(root, name, 'exports')) });
        const html = await readFile(intro(root, copy), 'utf8'); await writeFile(intro(root, copy), html.replace(/<title>([^<]*)<\/title>/, (m, t) => `<title>${t} copy</title>`));
        return send(200, 'application/json', JSON.stringify({ ok: true, name: copy }));
      }
      // delete: moved to the system Trash, never erased, so it can be put back
      if (sub === 'delete') {
        const trash = process.platform === 'darwin' ? join(homedir(), '.Trash') : process.platform === 'linux' ? join(homedir(), '.local', 'share', 'Trash', 'files') : join(root, '.trash');
        await mkdir(trash, { recursive: true }); let to = join(trash, `${name} ${stamp()}`);
        for (let n = 2; await stat(to).then(() => true, () => false); n++) to = join(trash, `${name} ${stamp()} ${n}`);
        try { await rename(join(root, name), to); } catch (e) { if (e.code !== 'EXDEV') throw e; await cp(join(root, name), to, { recursive: true, verbatimSymlinks: true }); await rm(join(root, name), { recursive: true }); }
        return send(200, 'application/json', JSON.stringify({ ok: true, trash: to }));
      }
      if (sub === 'open') { if (q.folder) reveal(join(root, name, 'exports')); else if (q.file && q.file.startsWith(join(root, name))) reveal(q.file); return send(200, 'application/json', '{"ok":true}'); }
      if (sub === 'export') { await writeFile(stateOf(root, name), JSON.stringify(q)); const file = await exportIt(root, name, q); reveal(file); return send(200, 'application/json', JSON.stringify({ ok: true, file })); }
      return send(404, 'text/plain', 'not found');
    }
    if (parts.length === 2 && !path.endsWith('/')) { res.writeHead(302, { location: `/${proj.slug}/${name}/${url.search}` }); return res.end(); }
    if (parts.length === 2) {
      // the intro opens with what the user last set on it
      let st = {}; try { st = JSON.parse(await readFile(stateOf(root, name), 'utf8')); } catch {}
      // ?mode=record plays it bare, for the History cover and the hover preview
      const pre = { ...(url.searchParams.get('mode') === 'record' ? { mode: 'record' } : {}), project: proj.name, exported: await readdir(join(root, name, 'exports')).then(fs => fs.some(f => !f.startsWith('.') && !f.endsWith('.webm') && !f.endsWith('.json')), () => false), canvas: st.canvas, phone: st.phone, theme: st.theme, slots: st.slots, words: st.words, speed: st.speed, durations: st.durations, colors: st.colors, credit: st.credit, privacy: st.privacy, exportOpts: st.exportOpts, ...(st.captions === 'off' ? { captions: 'off' } : st.captions ? { captionsAt: st.captions } : {}) };
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
