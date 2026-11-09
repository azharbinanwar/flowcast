// A recording to MP4 or GIF with the ffmpeg that npm installed. Usage: node convert.mjs in.mp4|in.webm out.mp4|out.gif [--width 800] [--fps 15] [--crf 16]
import ffmpeg from 'ffmpeg-static';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const [,, input, output, ...rest] = process.argv;
if (!input || !output) { console.error('usage: node convert.mjs in.mp4|in.webm out.mp4|out.gif [--width 800] [--fps 15] [--crf 16]'); process.exit(1); }
const opt = Object.fromEntries(rest.map((a, k, arr) => a.startsWith('--') ? [a.slice(2), arr[k + 1]] : null).filter(Boolean));
// the recorder notes where the intro starts; everything before it is the page loading and is cut.
// The cut comes after the input: a browser's recording has no index to jump to, and jumping before reading it fails on some systems
import { existsSync, readFileSync } from 'node:fs';
const start = existsSync(input + '.json') ? +JSON.parse(readFileSync(input + '.json', 'utf8')).start || 0 : 0;
const from = start ? ['-ss', start.toFixed(3)] : [];
// a GIF is cut inside its filter: an -ss would also drop the single palette frame the first pass makes
const cut = start ? `trim=start=${start.toFixed(3)},setpts=PTS-STARTPTS,` : '';
const run = (args) => { const r = spawnSync(ffmpeg, ['-v', 'error', '-y', ...args], { stdio: 'inherit' }); if (r.status) process.exit(r.status); };
if (output.endsWith('.gif')) {
  const w = opt.width || 800, fps = opt.fps || 15, pal = resolve(output + '.palette.png');
  run(['-i', input, '-vf', `${cut}fps=${fps},scale=${w}:-1:flags=lanczos,palettegen`, pal]);
  run(['-i', input, '-i', pal, '-lavfi', `[0:v]${cut}fps=${fps},scale=${w}:-1:flags=lanczos[x];[x][1:v]paletteuse`, output]);
  spawnSync('rm', ['-f', pal]);
} else {
  run(['-i', input, ...from, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(opt.crf || 16), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output]);
}
console.log(resolve(output));
