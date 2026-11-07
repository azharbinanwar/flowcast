// WebM to MP4 or GIF with the ffmpeg that npm installed. Usage: node convert.mjs in.webm out.mp4 | out.gif [--width 720]
import ffmpeg from 'ffmpeg-static';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const [,, input, output, ...rest] = process.argv;
if (!input || !output) { console.error('usage: node convert.mjs in.webm out.mp4|out.gif [--width 720]'); process.exit(1); }
const opt = Object.fromEntries(rest.map((a, k, arr) => a.startsWith('--') ? [a.slice(2), arr[k + 1]] : null).filter(Boolean));
// the recorder notes where the intro starts; everything before it is the page loading and is cut
import { existsSync, readFileSync } from 'node:fs';
const start = existsSync(input + '.json') ? +JSON.parse(readFileSync(input + '.json', 'utf8')).start || 0 : 0;
const from = start ? ['-ss', start.toFixed(3)] : [];
const run = (args) => { const r = spawnSync(ffmpeg, ['-v', 'error', '-y', ...args], { stdio: 'inherit' }); if (r.status) process.exit(r.status); };
if (output.endsWith('.gif')) {
  const w = opt.width || 720, pal = resolve(output + '.palette.png');
  run([...from, '-i', input, '-vf', `fps=15,scale=${w}:-1:flags=lanczos,palettegen`, pal]);
  run([...from, '-i', input, '-i', pal, '-lavfi', `fps=15,scale=${w}:-1:flags=lanczos[x];[x][1:v]paletteuse`, output]);
  spawnSync('rm', ['-f', pal]);
} else {
  run([...from, '-i', input, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output]);
}
console.log(resolve(output));
