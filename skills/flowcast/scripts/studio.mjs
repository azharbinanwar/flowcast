// The studio: serves an intro on localhost with working Export buttons. Usage: node studio.mjs intro.html [--port 7788]
// The page's buttons POST /export; this runs record, convert or frames, writes next to the intro, and reveals the file.
import { createServer } from 'node:http';
import { readFile, writeFile, stat, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve, dirname, basename, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [,, input, ...rest] = process.argv;
if (!input) { console.error('usage: node studio.mjs intro.html [--port 7788]'); process.exit(1); }
const opt = Object.fromEntries(rest.map((a, k, arr) => a.startsWith('--') ? [a.slice(2), arr[k + 1]] : null).filter(Boolean));
const port = +(opt.port || 7788);
const intro = resolve(input), dir = dirname(intro), name = basename(intro, '.html');
const here = dirname(fileURLToPath(import.meta.url)), playerDir = resolve(here, '../player');
const stateFile = join(dir, `${name}.state.json`);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
const PRESET = { square: [1080, 1080], portrait: [1080, 1350], story: [1080, 1920], landscape: [1920, 1080] };

const run = (script, args) => new Promise((res, rej) => {
  const p = spawn(process.execPath, [join(here, script), ...args], { stdio: ['ignore', 'pipe', 'pipe'] }); let out = '', err = '';
  p.stdout.on('data', d => out += d); p.stderr.on('data', d => err += d);
  p.on('close', c => c ? rej(new Error(err.trim().split('\n').pop() || `exit ${c}`)) : res(out.trim()));
});
const flags = (q) => ['--theme', q.theme || 'light', ...(q.canvas && q.canvas !== 'none' ? ['--canvas', q.canvas, '--phone', q.phone || 'center'] : []), ...(q.captions === 'off' ? ['--captions', 'off'] : q.captions === 'below' ? ['--captions', 'below'] : []), '--state', stateFile];

// show the file in the system's file manager
const reveal = (file) => { const isDir = !extname(file); if (process.platform === 'darwin') spawn('open', isDir ? [file] : ['-R', file]); else if (process.platform === 'win32') spawn('explorer', isDir ? [file] : ['/select,', file]); else spawn('xdg-open', [isDir ? file : dirname(file)]); };

async function exportIt(q) {
  const outDir = join(dir, 'flowcast-exports'); await mkdir(outDir, { recursive: true });
  const project = (q.project || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const base = join(outDir, `flowcast-${project}`);
  if (q.format === 'frames' || q.format === 'slides') {
    const fdir = `${base}-frames`; const args = [intro, fdir, ...flags(q)]; if (q.format === 'slides') args.push('--pdf', `${base}.pdf`);
    const files = (await run('frames.mjs', args)).split('\n'); return q.format === 'slides' ? files[files.length - 1] : fdir;
  }
  const webm = `${base}.webm`; await run('record.mjs', [intro, webm, ...flags(q)]);
  const out = `${base}.${q.format === 'gif' ? 'gif' : 'mp4'}`; await run('convert.mjs', [webm, out, ...(q.format === 'gif' ? ['--width', '720'] : [])]);
  return out;
}

createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/state') {
      // what the user set on the page, kept beside the intro so an export asked for in words uses it too
      let body = ''; for await (const c of req) body += c; await writeFile(stateFile, body);
      res.writeHead(200, { 'content-type': 'application/json' }); return res.end('{"ok":true}');
    }
    if (req.method === 'POST' && req.url === '/open') {
      let body = ''; for await (const c of req) body += c; const { file } = JSON.parse(body || '{}');
      if (file && file.startsWith(dir)) reveal(file);
      res.writeHead(200, { 'content-type': 'application/json' }); return res.end('{"ok":true}');
    }
    if (req.method === 'POST' && req.url === '/export') {
      let body = ''; for await (const c of req) body += c; const q = JSON.parse(body || '{}'); await writeFile(stateFile, JSON.stringify(q));
      const file = await exportIt(q);
      reveal(file);   // the user sees the file land
      res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ ok: true, file }));
    }
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path === '/' ? intro : join(dir, path);
    // the player files come from the skill when the intro's folder has none
    try { await stat(file); } catch { if (/^\/player\.(css|js)$/.test(path)) file = join(playerDir, path.slice(1)); }
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(data);
  } catch (e) {
    res.writeHead(e.code === 'ENOENT' ? 404 : 500, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: e.message }));
  }
}).listen(port, '127.0.0.1', () => console.log(`http://localhost:${port}/`));
