// The studio. Serves every intro in a flowcast folder on localhost, with History at / and each intro at /<name>/.
// Usage: node studio.mjs [flowcast-folder | intro.html] [--port 7788]
// Layout: flowcast/<name>/intro.html, intro.state.json (what the user set on the page), exports/ (the files they made).
import { createServer } from 'node:http';
import { readFile, writeFile, stat, mkdir, readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve, dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [,, input = 'flowcast', ...rest] = process.argv;
const opt = Object.fromEntries(rest.map((a, k, arr) => a.startsWith('--') ? [a.slice(2), arr[k + 1]] : null).filter(Boolean));
const port = +(opt.port || 7788);
// given one intro, the studio still serves its whole flowcast folder and opens on that intro
const given = resolve(input), single = given.endsWith('.html');
const root = single ? dirname(dirname(given)) : given;
const here = dirname(fileURLToPath(import.meta.url)), playerDir = resolve(here, '../player');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.mp4': 'video/mp4', '.gif': 'image/gif', '.pdf': 'application/pdf' };
const MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#FF6B4A"/><rect x="14" y="12" width="28" height="36" rx="6" fill="#fff" opacity=".45"/><rect x="19" y="16" width="28" height="36" rx="6" fill="#fff" opacity=".7"/><rect x="24" y="20" width="28" height="34" rx="6" fill="#fff"/><path d="M33 30v14l11-7z" fill="#FF6B4A"/></svg>';

const intro = (name) => join(root, name, 'intro.html');
const stateOf = (name) => join(root, name, 'intro.state.json');
const safe = (name) => /^[a-z0-9][a-z0-9._-]*$/i.test(name);

const run = (script, args) => new Promise((res, rej) => {
  const p = spawn(process.execPath, [join(here, script), ...args], { stdio: ['ignore', 'pipe', 'pipe'] }); let out = '', err = '';
  p.stdout.on('data', d => out += d); p.stderr.on('data', d => err += d);
  p.on('close', c => c ? rej(new Error(err.trim().split('\n').pop() || `exit ${c}`)) : res(out.trim()));
});
const flags = (name, q) => ['--theme', q.theme || 'light', ...(q.canvas && q.canvas !== 'none' ? ['--canvas', q.canvas, '--phone', q.phone || 'center'] : []), ...(q.captions === 'off' ? ['--captions', 'off'] : q.captions === 'below' ? ['--captions', 'below'] : []), '--state', stateOf(name)];
// show the file in the system's file manager
const reveal = (file) => { const isDir = !extname(file); if (process.platform === 'darwin') spawn('open', isDir ? [file] : ['-R', file]); else if (process.platform === 'win32') spawn('explorer', isDir ? [file] : ['/select,', file]); else spawn('xdg-open', [isDir ? file : dirname(file)]); };

async function exportIt(name, q) {
  const outDir = join(root, name, 'exports'); await mkdir(outDir, { recursive: true });
  const project = (q.project || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const base = join(outDir, `flowcast-${project}`);
  if (q.format === 'frames' || q.format === 'slides') {
    const fdir = `${base}-frames`; const args = [intro(name), fdir, ...flags(name, q)]; if (q.format === 'slides') args.push('--pdf', `${base}.pdf`);
    const files = (await run('frames.mjs', args)).split('\n'); return q.format === 'slides' ? files[files.length - 1] : fdir;
  }
  const webm = `${base}.webm`; await run('record.mjs', [intro(name), webm, ...flags(name, q)]);
  const out = `${base}.${q.format === 'gif' ? 'gif' : 'mp4'}`; await run('convert.mjs', [webm, out, ...(q.format === 'gif' ? ['--width', '720'] : [])]);
  return out;
}

// every intro in the folder, newest edit first
async function intros() {
  let names = []; try { names = await readdir(root); } catch {}
  const list = [];
  for (const n of names) {
    try { const st = await stat(intro(n)); const html = await readFile(intro(n), 'utf8');
      let exports = 0; try { exports = (await readdir(join(root, n, 'exports'))).filter(f => !f.startsWith('.') && !f.endsWith('.webm')).length; } catch {}
      list.push({ name: n, title: (html.match(/<title>([^<]*)<\/title>/) || [, n])[1], edited: st.mtimeMs, exports });
    } catch {}
  }
  return list.sort((a, b) => b.edited - a.edited);
}

// a cover for the History card: one frame from the middle of the intro, cached until the intro changes
async function cover(name) {
  const file = join(root, name, 'exports', '.cover.png');
  try { if ((await stat(file)).mtimeMs > (await stat(intro(name))).mtimeMs) return readFile(file); } catch {}
  await mkdir(dirname(file), { recursive: true });
  const { chromium } = await import('playwright');
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 1280 } });
  await p.addInitScript(() => { window.__flowcast = { mode: 'record', captions: 'off' }; });
  await p.goto(`http://127.0.0.1:${port}/${name}/`); await p.waitForFunction(() => window.flowcast && window.flowcast.beats, null, { timeout: 15000 });
  await p.evaluate(() => flowcast.go(Math.floor(flowcast.beats.length / 2))); await p.waitForTimeout(2200);
  await p.locator('#fc-canvas').screenshot({ path: file }); await b.close();
  return readFile(file);
}

const ago = (ms) => { const m = (Date.now() - ms) / 60000; return m < 1 ? 'just now' : m < 60 ? `${Math.round(m)} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
async function history() {
  const list = await intros();
  const cards = list.map(x => `<a class="card" href="/${encodeURIComponent(x.name)}/"><span class="cv"><img src="/${encodeURIComponent(x.name)}/cover.png" alt="" loading="lazy"></span><b>${esc(x.title)}</b><small>${ago(x.edited)}${x.exports ? ` · ${x.exports} export${x.exports > 1 ? 's' : ''}` : ''}</small></a>`).join('');
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Flowcast</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(MARK)}">
<style>
:root{--bg:#f4f2ef;--card:#fff;--on:#1c1a1f;--muted:#76707a;--border:rgba(0,0,0,.08);--accent:#FF6B4A}
@media (prefers-color-scheme:dark){:root{--bg:#141217;--card:#1f1c23;--on:#f1eef4;--muted:#a19aa6;--border:rgba(255,255,255,.08);color-scheme:dark}}
body{margin:0;background:var(--bg);color:var(--on);font-family:-apple-system,system-ui,sans-serif}
header{display:flex;align-items:center;gap:10px;padding:16px 24px}header svg{width:30px;height:30px}header b{font-size:17px}
header nav{margin-left:18px;display:flex;gap:6px}header nav span{padding:7px 14px;border-radius:999px;background:var(--card);border:1px solid var(--border);font-size:13.5px;font-weight:600}
main{padding:8px 24px 40px;max-width:1200px;margin:0 auto}
h1{font-size:28px;margin:12px 0 4px}p.sub{color:var(--muted);margin:0 0 22px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px}
.card{display:grid;gap:6px;text-decoration:none;color:inherit;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:10px 10px 14px;transition:transform .15s,box-shadow .15s}
.card:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(0,0,0,.12)}
.cv{aspect-ratio:1/1;border-radius:10px;overflow:hidden;background:color-mix(in srgb,var(--accent) 12%,var(--bg));display:grid;place-items:center}
.cv img{width:100%;height:100%;object-fit:contain}
.card b{font-size:15px;padding:4px 4px 0}.card small{color:var(--muted);font-size:12.5px;padding:0 4px}
.empty{padding:60px 0;text-align:center;color:var(--muted)}
</style>
<header>${MARK}<b>Flowcast</b><nav><span>History</span></nav></header>
<main><h1>History</h1><p class="sub">Every intro in ${esc(root.split('/').slice(-2).join('/'))}. Open one to play, change or export it.</p>
${list.length ? `<div class="grid">${cards}</div>` : `<div class="empty">No intros yet. Run <code>/flowcast</code> with a feature or a story to make the first one.</div>`}</main>`;
}

createServer(async (req, res) => {
  const send = (code, type, body) => { res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }); res.end(body); };
  try {
    const url = new URL(req.url, 'http://x'), path = decodeURIComponent(url.pathname), parts = path.split('/').filter(Boolean);
    if (path === '/__ping') return send(200, 'application/json', JSON.stringify({ flowcast: true, root }));
    if (path === '/') return send(200, TYPES['.html'], await history());
    const name = parts[0];
    if (!safe(name)) return send(404, 'text/plain', 'not found');
    if (req.method === 'POST') {
      let body = ''; for await (const c of req) body += c; const q = JSON.parse(body || '{}');
      if (parts[1] === 'state') { await writeFile(stateOf(name), body); return send(200, 'application/json', '{"ok":true}'); }
      if (parts[1] === 'open') { if (q.file && q.file.startsWith(join(root, name))) reveal(q.file); return send(200, 'application/json', '{"ok":true}'); }
      if (parts[1] === 'export') { await writeFile(stateOf(name), JSON.stringify(q)); const file = await exportIt(name, q); reveal(file); return send(200, 'application/json', JSON.stringify({ ok: true, file })); }
      return send(404, 'text/plain', 'not found');
    }
    if (parts.length === 1 && !path.endsWith('/')) { res.writeHead(302, { location: `/${name}/` }); return res.end(); }
    if (parts.length === 1) {
      // the intro opens with what the user last set on it
      let st = {}; try { st = JSON.parse(await readFile(stateOf(name), 'utf8')); } catch {}
      const pre = { canvas: st.canvas, phone: st.phone, theme: st.theme, slots: st.slots, words: st.words, ...(st.captions === 'off' ? { captions: 'off' } : st.captions ? { captionsAt: st.captions } : {}) };
      const html = String(await readFile(intro(name))).replace('<script', `<script>window.__flowcast=${JSON.stringify(pre)}</script><script`);
      return send(200, TYPES['.html'], html);
    }
    if (parts[1] === 'cover.png') return send(200, 'image/png', await cover(name));
    // the player comes from the skill unless the intro folder has its own
    let file = join(root, ...parts);
    if (/^player\.(css|js)$/.test(parts[1])) { try { await stat(file); } catch { file = join(playerDir, parts[1]); } }
    if (!file.startsWith(root) && !file.startsWith(playerDir)) return send(404, 'text/plain', 'not found');
    return send(200, TYPES[extname(file)] || 'application/octet-stream', await readFile(file));
  } catch (e) {
    send(e.code === 'ENOENT' ? 404 : 500, 'application/json', JSON.stringify({ ok: false, error: e.message }));
  }
}).listen(port, '127.0.0.1', () => console.log(`http://localhost:${port}/${single ? given.split('/').slice(-2, -1)[0] + '/' : ''}`));
