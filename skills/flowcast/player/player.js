// flowcast player. The intro defines: beats, apply(i), scene{i}, T, optional canvas{}, and <template id="scene">, <template id="endcard">.
// <html data-mode>: preview | intro | embed | record.  #flowcast data-frame: phone | browser | none.
// Canvas: data-canvas none | story | square | landscape, data-phone center | left | right, data-captions-at inside | below.
const $ = (q) => document.querySelector(q);
// the animated Flowcast mark: one file beside the player, used by the splash, exports and the credit outro
const MOTION = new URL('motion.svg', document.currentScript?.src || location.href).href;
const motionImg = (cls, bare) => `<img class="${cls}" src="${MOTION}${bare ? '#bare' : ''}" alt="">`;
// the recorder and the sheet set window.__flowcast before the page exists; apply it here
const pre = window.__flowcast || {};
for (const k of ['mode', 'theme', 'captions']) if (pre[k]) document.documentElement.dataset[k] = pre[k];
if (!pre.captions && $('#flowcast').dataset.captions === 'off') document.documentElement.dataset.captions = 'off';
const host = $('#flowcast');
// what the intro itself sets, so each section's reset knows where to go back to
const DEF = { canvas: host.dataset.canvas, phone: host.dataset.phone, captions: host.dataset.captions === 'off' ? 'off' : 'on' };
for (const k of ['frame', 'canvas', 'phone', 'captionsAt']) if (pre[k]) host.dataset[k] = pre[k];
const mode = document.documentElement.dataset.mode || 'preview';
const frame = host.dataset.frame || 'phone';
const captionsAt = host.dataset.captionsAt || 'inside';
const SIZE = { phone: [390, 844], browser: [1280, 800], none: [+host.dataset.width || 420, +host.dataset.height || 0] }[frame];   // none: a free-size composition the intro draws itself
// one list: a size, the places it is posted, the longest clip they take, and the bands their own UI covers on the tall one
const PRESETS = {
  none:      { size: null,         label: 'No canvas' },
  square:    { size: [1080, 1080], label: '1080\u00d71080 \u00b7 LinkedIn, Instagram feed', max: 600 },
  portrait:  { size: [1080, 1350], label: '1080\u00d71350 \u00b7 Instagram portrait', max: 60 },
  story:     { size: [1080, 1920], label: '1080\u00d71920 \u00b7 Reels, Stories, TikTok, Shorts', max: 90, safe: [250, 320] },
  landscape: { size: [1920, 1080], label: '1920\u00d71080 \u00b7 YouTube, website', max: 0 },
};
const PRESET = Object.fromEntries(Object.entries(PRESETS).map(([k, v]) => [k, v.size]));
const sceneTpl = $('#scene'), endTpl = $('#endcard'), aroundTpl = $('#around');   // around: the part of the scene outside the device, on the canvas
let canvasName = PRESET[host.dataset.canvas] !== undefined ? host.dataset.canvas : 'none';
let phonePos = host.dataset.phone || (aroundTpl ? 'left' : 'center');
const endCard = mode !== 'intro' && !!endTpl;
if (typeof T !== 'object') window.T = {};
T.endCard ??= 2000;
// timing the user set in the studio: a speed for the whole intro and seconds per beat; beats[k].ms is always what plays
const REAL = beats.length;   // the intro's own beats; a Flowcast outro may follow them as one more
const base = beats.map(b => b.ms), dur = base.map((m, k) => +pre.durations?.[k] || m);
let speed = +pre.speed || 1;
const retime = () => beats.forEach((b, k) => { b.ms = Math.round(dur[k] / speed); });
retime();
// the credit: off unless the user turns it on. When: the last beat and end card (default), the whole video, or a fixed Flowcast outro slide added after the end
const CREDIT_LINK = 'github.com/azharbinanwar/flowcast', OUTRO = 2000;
const credit = { on: false, showLink: false, pos: 'bottom-right', when: 'outro', ...(pre.credit === true ? { on: true } : pre.credit || {}), link: CREDIT_LINK };
if (credit.when !== 'outro') credit.when = 'always';
const outroOn = () => credit.on && credit.when === 'outro';
// the outro is a real beat: in the dots, in Timing with its own seconds, in every export; it comes after the end card
const syncOutro = () => {
  const has = beats.length > REAL;
  if (outroOn() && !has) { beats.push({ title: 'Made with Flowcast', body: '', outro: true, ms: OUTRO }); base.push(OUTRO); dur.push(+pre.durations?.[REAL] || OUTRO); }
  if (!outroOn() && has) { beats.pop(); base.pop(); dur.pop(); }
  retime();
};
syncOutro();
const totalMs = () => beats.reduce((a, b) => a + b.ms, 0) + (endCard ? T.endCard / speed : 0);
const total = totalMs();
const cv = typeof canvas === 'object' ? canvas : {};   // the content around the phone on a social canvas
const slots = { logo: !!endTpl, headline: !!cv.headline, line: !!cv.line, cta: !!cv.cta, tags: !!cv.tags, ...(cv.show || {}), ...(pre.slots || {}) };
Object.assign(cv, pre.words || {});   // words the user typed on the preview, saved by the studio
// a slot switched on always has real words: taken from the end card first, the title and first beat after
{ const end = endTpl?.content, txt = (q) => end?.querySelector(q)?.textContent.trim() || '';
  const tagLine = [...(end?.querySelectorAll('p') || [])].map(e => e.textContent.trim()).find(t => t.startsWith('#')) || '';
  const plain = [...(end?.querySelectorAll('p') || [])].map(e => e.textContent.trim()).find(t => t && !t.startsWith('#')) || '';
  cv.headline ||= txt('h1') || txt('b') || document.title;
  cv.line ||= plain || [beats[0].title, beats[0].em].filter(Boolean).join(' ');
  cv.cta ||= txt('.cta') || txt('button');
  cv.tags ||= tagLine; }

// the studio's icons, Lucide, drawn inline
const ICON = {
  look: '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/>',
  canvas: '<path d="M22 6H2M22 18H2M6 2v20M18 2v20"/>',
  timing: '<path d="M10 2h4M12 14l3-3"/><circle cx="12" cy="14" r="8"/>',
  export: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  captions: '<rect width="18" height="14" x="3" y="5" rx="2"/><path d="M7 15h4M15 15h2M7 11h2M13 11h4"/>',
  reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  mp4: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M17 3v18M3 12h18M3 7.5h4M3 16.5h4M17 7.5h4M17 16.5h4"/>',
  gif: '<path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  frames: '<path d="M18 22H4a2 2 0 0 1-2-2V6"/><path d="m22 13-1.3-1.3a2.41 2.41 0 0 0-3.4 0L11 18"/><circle cx="12" cy="8" r="2"/><rect width="16" height="16" x="6" y="2" rx="2"/>',
  slides: '<path d="M2 3h20M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3M7 21l5-5 5 5"/>',
  play: '<path class="fc-fill" d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/>',
  pause: '<rect class="fc-fill" x="6" y="4" width="4" height="16" rx="1"/><rect class="fc-fill" x="14" y="4" width="4" height="16" rx="1"/>',
  prev: '<path d="m15 18-6-6 6-6"/>', next: '<path d="m9 18 6-6-6-6"/>',
  full: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
  credit: '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  folder: '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  card: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>', type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
};
const I = (n) => `<svg class="fc-i" viewBox="0 0 24 24">${ICON[n]}</svg>`;
// every section opens the same way: icon, title, its own reset when something in it changed, the chevron
const head = (key, title, { icon, open, reset = true } = {}) => `<details ${open ? 'open ' : ''}data-sec="${key}"><summary><span>${icon ? I(icon) : ''}${title}</span>${reset ? `<button class="fc-sreset" data-reset="${key}" title="Reset ${title.toLowerCase()}" hidden>${I('reset')}</button>` : ''}</summary>`;
const FORMATS = [['mp4', 'MP4', 'Video'], ['gif', 'GIF', 'Loops anywhere'], ['frames', 'PNG', 'One per beat'], ['slides', 'PDF', 'Carousel']];
// a phone's status bar: time on the left, signal, wifi and battery on the right, drawn like the real ones
const STATUS = '<div class="fc-status" id="fc-status-bar"><span class="fc-time">9:41</span><span class="fc-sys">'
  + '<svg viewBox="0 0 18 12" width="18" height="12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>'
  + '<svg viewBox="0 0 16 12" width="16" height="12"><path d="M8 2.6c2.4 0 4.6.9 6.3 2.5l1.2-1.3A10.6 10.6 0 0 0 8 .8C5.1.8 2.5 1.9.5 3.8l1.2 1.3A8.8 8.8 0 0 1 8 2.6Zm0 3.6c1.4 0 2.7.5 3.7 1.4l1.2-1.3A7.2 7.2 0 0 0 8 4.4c-1.9 0-3.6.7-4.9 1.9l1.2 1.3c1-.9 2.3-1.4 3.7-1.4Zm0 3.5c.5 0 1 .2 1.3.5L8 11.6l-1.3-1.4c.3-.3.8-.5 1.3-.5Z"/></svg>'
  + '<svg viewBox="0 0 27 13" width="27" height="13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2"/><path d="M25 4.5v4a2 2 0 0 0 0-4Z" opacity=".4"/></svg></span></div>';
const captionHTML = '<div class="fc-caption"><h2 id="fc-title"></h2><p id="fc-body"></p></div>';
host.innerHTML = `
<div class="fc-tools">
  ${head('look', 'Look', { icon: 'look', open: true })}<div class="fc-row"><button id="fc-theme">${I('moon')}<span>Dark mode</span></button><button id="fc-captions" class="on">${I('captions')}<span>Captions</span></button></div></details>
  ${head('privacy', 'Privacy', { icon: 'shield' })}<div class="fc-row fc-switches"><button id="fc-private">${I('shield')}<span>Hide personal details</span></button><p class="fc-hint">Emails, phone numbers and card numbers become samples in the preview and every export. Switch any of them off to show it as it is, or change what shows instead.</p><div id="fc-found" class="fc-anim" style="--fc-d:grid" hidden><div class="fc-label">Found in this intro</div><div class="fc-flist"></div></div></div></details>
  ${head('credit', 'Credit', { icon: 'credit' })}<div class="fc-row fc-switches"><button id="fc-credit" title="A small tag in the corner of the video">${I('credit')}<span>Made with Flowcast</span></button><button id="fc-credit-link" title="Adds github.com/azharbinanwar/flowcast to the tag">${I('link')}<span>Show repo link</span></button><div class="fc-label fc-anim" id="fc-credit-when-label">When it shows</div><div class="fc-seg fc-when fc-anim" style="--fc-d:grid" id="fc-credit-when">${[['outro', 'Outro slide'], ['always', 'Watermark']].map(([v, n]) => `<button data-when="${v}">${n}</button>`).join('')}</div><div class="fc-label fc-anim" id="fc-credit-where">Position</div><div class="fc-pos fc-anim" style="--fc-d:grid" id="fc-credit-pos">${['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'].map(v => `<button data-pos="${v}" title="${v.replace('-', ' ').replace('center', 'centre')}" aria-label="${v.replace('-', ' ').replace('center', 'centre')}"><i></i></button>`).join('')}</div></div></details>
  ${head('canvas', 'Canvas', { icon: 'canvas' })}<div class="fc-row">
    <select id="canvas-pick">${Object.entries(PRESETS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select><span class="fc-tag" id="fc-length" hidden></span>
    <select id="phone-pick"><option value="center">Device centre</option><option value="left">Device left</option><option value="right">Device right</option></select>
    <span class="fc-slot-toggles">${Object.keys(slots).filter(k => k === 'logo' ? !!endTpl?.content.querySelector('.fc-logo') : !!cv[k]).map(k => `<button data-slot="${k}" class="${slots[k] ? 'on' : ''}">${k}</button>`).join('')}</span>
    <span class="fc-tag">${{ phone: 'Phone \u00b7 390\u00d7844', browser: 'Browser \u00b7 1280\u00d7800', none: SIZE[1] ? `Canvas \u00b7 ${SIZE[0]}\u00d7${SIZE[1]}` : 'In-app' }[frame]}</span>
  </div></details>
  ${head('timing', 'Timing', { icon: 'timing', open: true })}<p class="fc-note" id="fc-still-note">Timing only changes video and GIF. Slides show each beat's finished picture.</p><div class="fc-label">Speed</div><div class="fc-row"><div class="fc-seg" id="fc-speed">${[0.75, 1, 1.25, 1.5].map(v => `<button data-v="${v}">${v}\u00d7</button>`).join('')}</div></div><div class="fc-label">Beats</div><div class="fc-beats" id="fc-beats"></div></details>
  ${head('export', 'Export', { icon: 'export', open: true, reset: false }).replace('<details ', '<details id="fc-export-sec" hidden ')}<div class="fc-row"><div class="fc-fmts" id="fc-fmts">${FORMATS.map(([v, n, d], k) => `<button data-f="${v}" class="${k ? '' : 'on'}">${I(v)}<b>${n}</b><small>${d}</small></button>`).join('')}</div><select id="fc-export" hidden>${FORMATS.map(([v, n, d]) => `<option value="${v}">${n} ${d}</option>`).join('')}</select><button id="fc-go">${I('export')}<span>Export \u00b7 ${(total / 1000).toFixed(1)}s</span></button><span class="fc-tag" id="fc-status" hidden></span><button id="fc-folder" class="fc-anim" style="--fc-d:flex;--fc-gap:8px" hidden>${I('folder')}<span>Open exports folder</span></button></div></details>
</div>
<div class="fc-cwrap" id="fc-cwrap"><div class="fc-canvas" id="fc-canvas">
  <div class="fc-slots fc-top" id="fc-top">
    <div class="fc-slot" data-slot="logo" id="fc-slot-logo"></div>
    <h1 class="fc-slot" data-slot="headline" id="fc-slot-headline">${cv.headline || ''}</h1>
  </div>
  <div class="fc-slots fc-bottom" id="fc-bottom">
    <p class="fc-slot" data-slot="line" id="fc-slot-line">${cv.line || ''}</p>
    <span class="fc-slot fc-cta" data-slot="cta" id="fc-slot-cta">${cv.cta || ''}</span>
    <p class="fc-slot fc-tags" data-slot="tags" id="fc-slot-tags">${cv.tags || ''}</p>
  </div>
  <div class="fc-around" id="fc-around"></div>
  <div class="fc-phone">
    <div class="fc-fit" id="fc-fit"><div class="fc-frame fc-${frame}" id="fc-frame">${frame === 'browser' ? `<div class="fc-url">${host.dataset.url || ''}</div>` : ''}
      <div class="fc-screen">${frame === 'phone' ? STATUS : ''}
        <div class="fc-stage" id="fc-stage"><div class="fc-finger" id="fc-finger"></div></div>
        ${captionsAt === 'inside' ? captionHTML : ''}
        <div class="fc-end" id="fc-end"></div></div></div></div>
    ${captionsAt === 'below' ? captionHTML.replace('class="fc-caption"', 'class="fc-caption fc-below"') : ''}
  </div>
</div></div>
<div class="fc-dots" id="fc-dots"></div>
<div class="fc-bar"><button id="fc-replay" class="fc-round" aria-label="Replay" title="Replay">${I('reset')}</button><span class="fc-pill"><button id="fc-prev" aria-label="Previous" title="Previous">${I('prev')}</button><button id="fc-pause" aria-label="Pause" title="Pause">${I('pause')}</button><button id="fc-next" aria-label="Next" title="Next">${I('next')}</button></span><button id="fc-skip" class="fc-round">Skip</button><button id="fc-full" class="fc-round" aria-label="Full screen" title="Full screen">${I('full')}</button></div>`;
host.dataset.mode = mode;
$('#fc-stage').append(sceneTpl.content);
if (aroundTpl) $('#fc-around').append(aroundTpl.content);
const paintCredit = () => { if ($('#fc-outro')) placeCredit();
  const ol = $('#fc-outro .fc-outro-link'); if (ol) ol.textContent = credit.showLink ? credit.link : '';
  document.querySelectorAll('#fc-credit-when button').forEach(b => b.classList.toggle('on', b.dataset.when === credit.when)); if ($('#fc-credit-when')) $('#fc-credit-when').hidden = $('#fc-credit-when-label').hidden = !credit.on;
  document.querySelectorAll('#fc-credit-pos button').forEach(b => b.classList.toggle('on', b.dataset.pos === credit.pos)); if ($('#fc-credit-pos')) $('#fc-credit-pos').hidden = $('#fc-credit-where').hidden = !credit.on || credit.when === 'outro'; const l = $('.fc-made .fc-made-link'); if (l) { l.textContent = credit.showLink && credit.link ? credit.link : ''; l.hidden = !l.textContent; }
  if ($('#fc-credit')) { $('#fc-credit').classList.toggle('on', credit.on); $('#fc-credit-link').classList.toggle('on', credit.showLink); $('#fc-credit-link').disabled = !credit.on; } };
if (endTpl) { $('#fc-end').append(endTpl.content); const logo = $('#fc-end .fc-logo'); if (logo) $('#fc-slot-logo').append(logo.cloneNode(true)); }
$('#fc-canvas').insertAdjacentHTML('beforeend', '<div class="fc-made"><svg viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#FF6B4A"/><rect x="14" y="12" width="28" height="36" rx="6" fill="#fff" opacity=".45"/><rect x="19" y="16" width="28" height="36" rx="6" fill="#fff" opacity=".7"/><rect x="24" y="20" width="28" height="34" rx="6" fill="#fff"/><path d="M33 30v14l11-7z" fill="#FF6B4A"/></svg>Made with Flowcast<span class="fc-made-link" hidden></span></div><div class="fc-outro" id="fc-outro">' + motionImg('fc-motion') + '<svg class="fc-outro-still" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#FF6B4A"/><rect x="14" y="12" width="28" height="36" rx="6" fill="#fff" opacity=".45"/><rect x="19" y="16" width="28" height="36" rx="6" fill="#fff" opacity=".7"/><rect x="24" y="20" width="28" height="34" rx="6" fill="#fff"/><path d="M33 30v14l11-7z" fill="#FF6B4A"/></svg><b>Made with Flowcast</b><span class="fc-outro-link"></span></div>'); paintCredit();
if (host.dataset.actor === 'pointer') $('#fc-finger').classList.add('fc-pointer');
if (frame === 'none') { $('#fc-frame').style.width = SIZE[0] + 'px'; if (SIZE[1]) $('#fc-frame').style.height = SIZE[1] + 'px'; else $('#fc-stage').style.height = '440px'; }
$('#fc-canvas').dataset.bg = cv.bg || 'tint';
if (mode === 'preview') document.querySelectorAll('.fc-slots h1, .fc-slots p, .fc-cta').forEach(e => e.contentEditable = 'plaintext-only');

// helpers the scene steps use
const s = {
  wait: (ms) => new Promise(r => setTimeout(r, ms / rate())),
  cls: (q, c, on = true) => $(q).classList.toggle(c, on),
  text: (q, t) => { $(q).textContent = t; },
  finger: (show, press = false) => { const f = $('#fc-finger'); f.classList.toggle('fc-show', show); f.classList.toggle('fc-press', press); },
  moveTo: (q) => { const r = $(q).getBoundingClientRect(), st = $('#fc-stage').getBoundingClientRect(), k = st.width / $('#fc-stage').offsetWidth; const f = $('#fc-finger'); f.style.left = (r.left - st.left + r.width / 2) / k + 'px'; f.style.top = (r.top - st.top + r.height / 2) / k + 'px'; },
  tap: async (q) => { s.moveTo(q); s.finger(true); await s.wait(T.press ?? 550); s.finger(true, true); await s.wait(T.lift ?? 150); s.finger(false); },
  type: async (q, text) => { for (let k = 1; k <= text.length; k++) { $(q).textContent = text.slice(0, k); await s.wait(T.type ?? 30); } },
};

const STALE = Symbol('stale beat');
// play and pause share one button whose icon shows what a press will do
const paintPause = () => { const b = $('#fc-pause'); if (stills) { b.textContent = `${slide + 1} / ${slideCount()}`; b.dataset.state = 'slide'; b.title = b.ariaLabel = 'Slide'; return; } b.innerHTML = I(paused ? 'play' : 'pause'); b.dataset.state = paused ? 'paused' : 'playing'; b.title = b.ariaLabel = paused ? 'Play' : 'Pause'; };
let i = 0, paused = false, run = 0, raf, startAt, elapsed = 0, stepsDone = false, hold = -1;
// a beat set shorter or longer plays its steps and transitions faster or slower to fit, on top of the overall speed
const rate = () => speed * base[i] / dur[i];
function render() {
  $('#fc-title').innerHTML = beats[i].title; $('#fc-body').textContent = beats[i].body;
  // one row per beat in the Timing panel: its time, its normal time when changed, and its own faster and slower
  const sec = (ms) => (ms / 1000).toFixed(1) + 's';
  const rows = beats.map((b, k) => { const fast = dur[k] <= base[k] / 3 + 1, slow = dur[k] >= base[k] * 2 - 1;
    return `<div class="fc-brow" data-k="${k}" data-n="${k + 1}"><div><b>${sec(b.ms)}</b><small>${dur[k] !== base[k] ? `normal ${sec(base[k] / speed)}` : (b.title || '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '')}</small></div>${dur[k] !== base[k] ? `<button data-r="1" class="fc-undo" title="Reset this beat">${I('reset')}</button>` : '<span></span>'}<button data-d="-1" ${fast ? 'disabled title="Fastest for this beat"' : 'title="Shorter"'}>\u2212</button><button data-d="1" ${slow ? 'disabled title="Slowest for this beat"' : 'title="Longer"'}>+</button></div>`; }).join('');
  // rows and dots are only rebuilt when they change, so moving to the next beat animates instead of redrawing
  if (rows !== $('#fc-beats').dataset.html) { $('#fc-beats').innerHTML = rows; $('#fc-beats').dataset.html = rows; }
  document.querySelectorAll('.fc-brow').forEach((r, k) => r.classList.toggle('on', k === i));
  if ($('#fc-dots').children.length !== beats.length) $('#fc-dots').innerHTML = beats.map((_, k) => `<div class="fc-dot" data-k="${k}"><i></i></div>`).join('');
  document.querySelectorAll('.fc-dot').forEach((d, k) => { d.classList.toggle('fc-on', k === i); d.classList.toggle('fc-done', k < i); d.querySelector('i').style.width = k < i ? '100%' : '0'; });
}
function go(n) {
  window.flowcastDone = false; i = Math.max(0, Math.min(beats.length - 1, n)); run++; elapsed = 0; paused = false; paintPause();
  const isOutro = !!beats[i].outro;
  s.cls('#fc-end', 'fc-show', false); s.finger(false); render();
  // the outro beat lays its slide over the whole canvas in the intro's own colours; the scene underneath keeps its last state
  // the outro restarts the animated mark, so it always plays from the storyboard to the press
  if (isOutro) { const o = $('#fc-outro'); o.style.fontSize = creditHost().offsetWidth * 0.034 + 'px'; o.querySelector('.fc-motion').src = MOTION + '?' + Date.now(); o.classList.remove('fc-show'); void o.offsetWidth; o.classList.add('fc-show'); } else { s.cls('#fc-outro', 'fc-show', false); apply(i); }
  // the beat's steps run with their own wait, which stops them the moment another beat starts
  const mine = run, own = { ...s, wait: async (ms) => { await s.wait(ms); if (mine !== run) throw STALE; } };
  for (const k of ['tap', 'type']) own[k] = async (...a) => { if (mine !== run) throw STALE; return s[k].apply(own, a); };
  // a beat never ends before its own steps do, so a shorter beat cannot cut off its climax
  stepsDone = false;
  Promise.resolve().then(() => isOutro ? null : scene[i](own)).catch(e => { if (e !== STALE) console.error(e); }).finally(() => { if (mine === run) stepsDone = true; });
  tick(run);
}
// Hide personal details: emails, phone numbers and card numbers on the picture become safe samples, and come back when it is turned off
// on, the replacement chosen for each detail found, and the user's own find-and-replace rows (for names and anything not detected)
// keep: details found but left as they are. Only emails, phone numbers and card numbers: a name looks like a heading or a brand, so names are not guessed
const privacy = { on: false, map: {}, custom: [], keep: [], ...(pre.privacy === true ? { on: true } : pre.privacy || {}) };
const KINDS = [
  ['Email', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, () => 'alex@example.com'],
  ['Card', /\b(?:\d[ -]?){12,18}\d\b/g, (m) => m.replace(/\d(?=(?:[ -]?\d){4})/g, '•')],
  ['Phone', /\+?\(?\d[\d\s().-]{7,}\d/g, (m) => { const n = m.replace(/\D/g, '').length; return n >= 9 && n <= 15 ? '+1 555 0100' : null; }],
];
const replaces = (m) => !privacy.keep.includes(m);
const sampleFor = (kind, m) => KINDS.find(k => k[0] === kind)?.[2](m) ?? m;
const found = new Map();   // detail -> its kind, in the order they first appear
const shownFor = (m, kind, dflt) => { if (!found.has(m)) { found.set(m, kind); queueMicrotask(paintFound); } return privacy.map[m] ?? dflt; };
const scrub = (s) => {
  for (const [from, to] of privacy.custom) if (from) s = s.split(from).join(to);
  for (const [kind, re, dflt] of KINDS) s = s.replace(re, (m) => { const d = dflt(m); if (d === null) return m; const shown = shownFor(m, kind, d); return replaces(m, kind) ? shown : m; });
  return s;
};
const kept = new WeakMap();   // text node -> { real, shown }
const scrubNode = (n) => { if (n.parentElement?.closest('.fc-made, .fc-outro')) return;
  const k = kept.get(n), real = k && n.nodeValue === k.shown ? k.real : n.nodeValue;
  const shown = privacy.on ? scrub(real) : real; kept.set(n, { real, shown }); if (n.nodeValue !== shown) n.nodeValue = shown; };
const scrubAll = (root) => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); for (let n; (n = w.nextNode());) scrubNode(n);
  root.querySelectorAll?.('input, textarea').forEach(el => { for (const a of ['value', 'placeholder']) { if (!el.hasAttribute(a)) continue; el.dataset['fcReal' + a] ??= el.getAttribute(a); el.setAttribute(a, privacy.on ? scrub(el.dataset['fcReal' + a]) : el.dataset['fcReal' + a]); } }); };
let scrubbing = false;
new MutationObserver((list) => { if (scrubbing) return; scrubbing = true;
  for (const m of list) { if (m.type === 'characterData') scrubNode(m.target); else m.addedNodes.forEach(n => n.nodeType === 3 ? scrubNode(n) : n.nodeType === 1 && scrubAll(n)); }
  scrubbing = false; }).observe($('#fc-canvas'), { subtree: true, childList: true, characterData: true });
const rescrub = () => { scrubbing = true; scrubAll($('#fc-canvas')); scrubbing = false; };
// details the scene only shows later are found up front too, by reading its markup once
// the scene and end card have already moved onto the stage, so they are read from there
{ const probe = document.createElement('div'); probe.append($('#fc-stage').cloneNode(true)); probe.querySelector('#fc-finger')?.remove();
  // each line on its own, so text from neighbouring elements never runs together into a false match
  const lines = []; { const w0 = document.createTreeWalker(probe, NodeFilter.SHOW_TEXT); for (let n; (n = w0.nextNode());) lines.push(n.nodeValue); }
  // text the scene types or shows later lives in the intro's script as quoted strings; only what those strings would show on screen counts,
  // never markup inside them, so the numbers in an icon's drawing are never taken for a phone number
  const said = []; for (const sc of document.scripts) for (const [, , str] of sc.textContent.matchAll(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
    if (!/[A-Za-z0-9]/.test(str)) continue; const tmp = document.createElement('template'); tmp.innerHTML = str; said.push(tmp.content.textContent); }
  const t = lines.join('\n') + '\n' + said.join('\n');
  for (const [kind, re, dflt] of KINDS) for (const m of t.match(re) || []) if (dflt(m) !== null && !found.has(m)) found.set(m, kind);
 }
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// the list in the Privacy section: each detail found, what shows instead (editable), and the user's own rows
function paintFound() {
  const box = $('#fc-found'); if (!box) return; box.hidden = !privacy.on;
  const ICONS = { Email: 'mail', Phone: 'phone', Card: 'card' };
  const row = ({ key, attr, kind, was, value, on, own, mine }) => `<div class="fc-frow${on ? '' : ' fc-kept'}${own ? ' fc-own' : ''}" ${attr} data-kind="${kind}">
    <span class="fc-fic" title="${own ? 'Your own' : kind}">${I(own ? 'type' : ICONS[kind])}</span>
    <span class="fc-fmid"><span class="fc-fwas" title="${esc(was)}">${esc(was)}</span>
      <span class="fc-fswap"><input class="fc-fnew" value="${esc(value)}" aria-label="Show instead of ${esc(was)}" spellcheck="false"${on ? '' : ' tabindex="-1"'}><span class="fc-fkeep">Shown as it is</span></span></span>
    ${own ? '<span></span>' : `<button class="fc-fundo" data-undo="${esc(was)}" title="Back to the sample" ${mine ? '' : 'hidden'}>${I('reset')}</button>`}
    ${own ? `<button class="fc-fdel" data-del="${key}" title="Remove">${I('close')}</button>` : `<button class="fc-fuse${on ? ' on' : ''}" data-use="${esc(was)}" title="${on ? 'Replaced. Switch off to show it as it is' : 'Shown as it is. Switch on to replace it'}" aria-pressed="${on}"></button>`}
  </div>`;
  const rows = [...found].map(([m, kind]) => { const mine = m in privacy.map, on = replaces(m, kind);
    return row({ attr: `data-m="${esc(m)}"`, kind, was: m, value: mine ? privacy.map[m] : sampleFor(kind, m), on, mine }); }).join('');
  const own = privacy.custom.map(([f, r], k) => row({ key: k, attr: `data-k="${k}"`, kind: 'Yours', was: f, value: r, on: true, own: true })).join('');
  const focused = document.activeElement?.closest?.('#fc-found') ? [document.activeElement.closest('.fc-frow')?.dataset.m ?? document.activeElement.closest('.fc-frow')?.dataset.k, document.activeElement.selectionStart] : null;
  const list = box.querySelector('.fc-flist'), before = new Set([...list.children].map(r => r.dataset.m ?? 'k' + r.dataset.k));
  list.innerHTML = rows + own || '<p class="fc-hint fc-fnone">Nothing personal found in this intro yet.</p>';
  if (paintFound.drawn) list.querySelectorAll('.fc-frow').forEach(r => { if (!before.has(r.dataset.m ?? 'k' + r.dataset.k)) r.classList.add('fc-enter'); });
  paintFound.drawn = true;
  if (focused) { const r = box.querySelector(`.fc-frow[data-m="${CSS.escape(focused[0] ?? '')}"], .fc-frow[data-k="${focused[0]}"]`)?.querySelector('input'); if (r) { r.focus(); r.setSelectionRange(focused[1], focused[1]); } }
}
const setPrivacy = (on) => { privacy.on = on; $('#fc-private')?.classList.toggle('on', on); rescrub(); paintFound(); };
$('#fc-private').onclick = () => setPrivacy(!privacy.on);
$('#fc-found').addEventListener('input', (e) => { const row = e.target.closest('.fc-frow'); if (!row || !e.target.matches('.fc-fnew')) return;
  if (row.classList.contains('fc-own')) privacy.custom[+row.dataset.k][1] = e.target.value; else { privacy.map[row.dataset.m] = e.target.value; row.querySelector('.fc-fundo').hidden = false; }
  rescrub(); paintResets(); });
$('#fc-found').addEventListener('change', () => saveState());
$('#fc-found').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.use !== undefined) { const row = b.closest('.fc-frow'), m = b.dataset.use, list = privacy.keep, at = list.indexOf(m); at < 0 ? list.push(m) : list.splice(at, 1);
    const on = replaces(m, row.dataset.kind); row.classList.toggle('fc-kept', !on); b.classList.toggle('on', on); b.ariaPressed = on; row.querySelector('.fc-fnew').tabIndex = on ? 0 : -1;
    rescrub(); paintResets(); saveState(); return; }
  else if (b.dataset.undo !== undefined) { const row = b.closest('.fc-frow'), m = b.dataset.undo; delete privacy.map[m]; row.querySelector('.fc-fnew').value = sampleFor(row.dataset.kind, m); b.hidden = true; rescrub(); paintResets(); saveState(); return; }
  else if (b.dataset.del !== undefined) { const r = b.closest('.fc-frow'); r.classList.add('fc-leave'); setTimeout(() => { privacy.custom.splice(+b.dataset.del, 1); rescrub(); paintFound(); saveState(); }, 220); return; }
  else return;
  rescrub(); paintFound(); saveState(); });
setPrivacy(privacy.on);
// slides: what PNG frames and PDF slides export. Each beat's finished picture, then the end card, then the outro; no motion, stepped by hand
let stills = !!pre.stills, slide = 0;
const slideCount = () => REAL + (endCard ? 1 : 0) + (beats.length > REAL ? 1 : 0);
const settle = async () => { for (let k = 0; k < 3; k++) { void document.body.offsetWidth; document.getAnimations().forEach(a => { try { a.finish(); } catch {} }); await new Promise(r => requestAnimationFrame(() => r())); } };
async function still(k) {
  slide = Math.max(0, Math.min(slideCount() - 1, k)); run++; const mine = run; cancelAnimationFrame(raf); paused = true; window.flowcastDone = false;
  const isEnd = endCard && slide === REAL, isOutro = slide > REAL || (!endCard && slide === REAL);
  i = isOutro ? beats.length - 1 : isEnd ? REAL - 1 : slide;
  s.cls('#fc-end', 'fc-show', false); s.cls('#fc-outro', 'fc-show', false); s.finger(false); render(); paintPause();
  if (isOutro) { const o = $('#fc-outro'); o.style.fontSize = creditHost().offsetWidth * 0.034 + 'px'; o.classList.add('fc-show'); }
  else {
    apply(i);
    // the steps run straight through: no waiting, no finger, typed text lands whole
    const own = { ...s, wait: async () => { if (mine !== run) throw STALE; }, tap: async () => { if (mine !== run) throw STALE; }, type: async (q, t) => { if (mine !== run) throw STALE; $(q).textContent = t; } };
    try { await scene[i](own); } catch (e) { if (e !== STALE) console.error(e); }
    if (isEnd) s.cls('#fc-end', 'fc-show');
  }
  if (mine !== run) return; s.finger(false); await settle(); if (mine !== run) return;
  document.querySelectorAll('.fc-dot').forEach(d => { d.querySelector('i').style.width = d.classList.contains('fc-on') || d.classList.contains('fc-done') ? '100%' : '0'; });
  paintStatus();
}
const show = (n) => stills ? still(n) : go(n);
const setStills = (on) => { if (on === stills) return; stills = on; host.classList.toggle('fc-stills', on); if (on) still(i); else go(Math.min(i, beats.length - 1)); };
// the status bar takes the colour at the top of the app and the text that reads on it, like a real phone
const statusBar = () => $('#fc-status-bar');
const topColour = () => {
  const st = $('#fc-stage'), r = st.getBoundingClientRect();
  for (const el of document.elementsFromPoint(r.left + r.width / 2, r.top + 2)) {
    if (!st.contains(el) || el.id === 'fc-finger') continue;
    for (let n = el; n && n !== st.parentElement; n = n.parentElement) {
      const cs = getComputedStyle(n), m = cs.backgroundImage !== 'none' && cs.backgroundImage.match(/rgba?\([^)]+\)/);
      if (m) return m[0];
      if (!/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor)) return cs.backgroundColor;
    }
  }
  return getComputedStyle($('.fc-screen')).backgroundColor;
};
const paintStatus = () => {
  const bar = statusBar(); if (!bar) return; const c = topColour(), v = (c.match(/[\d.]+/g) || [255, 255, 255]).map(Number);
  const light = (0.299 * v[0] + 0.587 * v[1] + 0.114 * v[2]) > 150;
  bar.style.background = c; bar.style.color = light ? '#000' : '#fff';
};
function finish(mine) {
  const end = () => { if (mode === 'embed' || (mode === 'preview' && endCard)) go(0); else window.flowcastDone = true; };
  // after the outro beat the end card has already played
  if (!endCard || beats[i].outro) return end();
  s.cls('#fc-end', 'fc-show'); setTimeout(() => { if (mine === run) end(); }, T.endCard / speed);
}
function tick(mine) {
  cancelAnimationFrame(raf); startAt = performance.now() - elapsed;
  const step = () => {
    if (mine !== run || paused) return;
    // the scene's own transitions run at the same speed as its steps
    const r = rate(); document.getAnimations().forEach(a => { if (a.playbackRate !== r) a.playbackRate = r; });
    if (performance.now() - (step.painted || 0) > 200) { paintStatus(); step.painted = performance.now(); }
    elapsed = performance.now() - startAt; const p = Math.min(1, elapsed / beats[i].ms);
    $('.fc-dot.fc-on i').style.width = p * 100 + '%';
    if (p < 1 || !stepsDone) raf = requestAnimationFrame(step);
    // a beat being retimed stays put once it ends, so the next press changes the same beat
    else if (hold === i) { paused = true; paintPause(); elapsed = 0; }
    // the end card comes between the intro's last beat and the outro
    else if (i === REAL - 1 && beats.length > REAL && endCard) { s.cls('#fc-end', 'fc-show'); setTimeout(() => { if (mine === run) go(REAL); }, T.endCard / speed); }
    else if (i < beats.length - 1) go(i + 1); else finish(mine);
  }; raf = requestAnimationFrame(step);
}
$('#fc-pause').onclick = () => { if (stills) return; if (paused && hold === i && elapsed === 0) { hold = -1; return go(i + 1 < beats.length ? i + 1 : 0); } hold = -1; paused = !paused; paintPause(); if (!paused) tick(run); };
$('#fc-prev').onclick = () => { hold = -1; stills ? still(slide - 1) : go(i - 1); }; $('#fc-next').onclick = () => { hold = -1; stills ? still(slide + 1) : go(i + 1); }; $('#fc-replay').onclick = () => { hold = -1; show(0); };
$('#fc-skip').onclick = () => { hold = -1; stills ? still(slideCount() - 1) : go(beats.length - 1); };
// the same button leaves full screen; inside it the bar wakes on mouse movement and sleeps after two still seconds
const leaveFull = () => { if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); document.documentElement.classList.remove('fc-full', 'fc-awake'); paintFull(); layout(); };
const paintFull = () => { const on = full(); $('#fc-full').title = $('#fc-full').ariaLabel = on ? 'Leave full screen' : 'Full screen'; };
let sleepTimer; const wake = () => { if (!full()) return; document.documentElement.classList.add('fc-awake'); clearTimeout(sleepTimer); sleepTimer = setTimeout(() => document.documentElement.classList.remove('fc-awake'), 2000); };
addEventListener('mousemove', wake); addEventListener('touchstart', wake, { passive: true });
$('#fc-full').onclick = () => { if (full()) return leaveFull(); document.documentElement.classList.add('fc-full'); document.documentElement.requestFullscreen?.().catch(() => {}); paintFull(); layout(); wake(); };
// keys in full screen: arrows step, space plays or pauses, each showing the bar for a moment
addEventListener('keydown', (e) => { if (!full()) return; if (e.key === 'ArrowRight') { $('#fc-next').click(); wake(); } else if (e.key === 'ArrowLeft') { $('#fc-prev').click(); wake(); } else if (e.key === ' ') { e.preventDefault(); $('#fc-pause').click(); wake(); } });
// Esc, or leaving full screen any other way, brings the studio back
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && full()) leaveFull(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && full()) leaveFull(); });
$('#fc-dots').onclick = (e) => { const d = e.target.closest('.fc-dot'); if (!d) return; hold = -1; const k = +d.dataset.k; stills ? still(beats[k].outro ? slideCount() - 1 : k) : go(k); };

// toolbar
const isDark = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
const paintTheme = () => { $('#fc-theme').classList.toggle('on', isDark()); };
// adding or removing the outro beat changes the beats themselves, so the timeline and the running time follow
const creditChanged = () => { const was = beats.length; paintCredit(); syncOutro(); if (beats.length !== was) { $('#fc-dots').innerHTML = ''; hold = -1; if (i >= beats.length) i = beats.length - 1; } retimed(); };
$('#fc-credit').onclick = () => { credit.on = !credit.on; creditChanged(); };
$('#fc-credit-link').onclick = () => { credit.showLink = !credit.showLink; paintCredit(); };
// six places to put it, so it never sits on top of something that matters
$('#fc-credit-when').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; credit.when = b.dataset.when; creditChanged(); };
$('#fc-credit-pos').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; credit.pos = b.dataset.pos; paintCredit(); };
$('#fc-theme').onclick = () => { document.documentElement.dataset.theme = isDark() ? 'light' : 'dark'; paintTheme(); };
$('#fc-captions').classList.toggle('on', document.documentElement.dataset.captions !== 'off');
$('#fc-captions').onclick = () => { const off = document.documentElement.dataset.captions !== 'off'; document.documentElement.dataset.captions = off ? 'off' : 'on'; $('#fc-captions').classList.toggle('on', !off); layout(); };
$('#canvas-pick').value = canvasName; $('#canvas-pick').onchange = (e) => { canvasName = e.target.value; layout(); };
$('#phone-pick').value = phonePos; $('#phone-pick').onchange = (e) => { phonePos = e.target.value; layout(); };
$('.fc-slot-toggles').onclick = (e) => { const b = e.target.closest('[data-slot]'); if (!b) return; slots[b.dataset.slot] = !slots[b.dataset.slot]; b.classList.toggle('on', slots[b.dataset.slot]); layout(); };
paintTheme();
// a video is measured in seconds, frames and slides in how many pictures they make: one per beat and the end card
const exportLabel = () => { const f = $('#fc-export').value, n = beats.length + 1; $('#fc-go span').textContent = f === 'frames' ? `Export \u00b7 ${n} images` : f === 'slides' ? `Export \u00b7 ${n} pages` : `Export \u00b7 ${(totalMs() / 1000).toFixed(1)}s`; };
const retimed = () => { exportLabel(); paintSpeed(); render(); layout(); saveState(); };
const paintSpeed = () => document.querySelectorAll('#fc-speed button').forEach(b => b.classList.toggle('on', +b.dataset.v === speed));
paintSpeed(); $('#fc-speed').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; speed = +b.dataset.v; retime(); retimed(); };
$('#fc-fmts').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; document.querySelectorAll('#fc-fmts button').forEach(x => x.classList.toggle('on', x === b)); $('#fc-export').value = b.dataset.f; exportLabel(); setStills(b.dataset.f === 'frames' || b.dataset.f === 'slides'); };
// half a second at a time, as the viewer sees it, from a third of the written time to double; past that the motion blurs or stalls.
// It replays the beat at its new length and holds there, so every press changes the same beat.
const nudge = (k, d) => { dur[k] = Math.min(base[k] * 2, Math.max(base[k] / 3, dur[k] + d * 500 * speed)); retime(); retimed(); hold = k; go(k); };
// each section's reset: what counts as changed, and how to go back to what the intro set
const CHANGED = {}, RESETS = {};
const slotsDefault = { logo: !!endTpl, headline: !!cv.headline, line: !!cv.line, cta: !!cv.cta, tags: !!cv.tags, ...(cv.show || {}) };
CHANGED.look = () => !!document.documentElement.dataset.theme || (document.documentElement.dataset.captions === 'off' ? 'off' : 'on') !== DEF.captions;
RESETS.look = () => { delete document.documentElement.dataset.theme; document.documentElement.dataset.captions = DEF.captions; $('#fc-captions').classList.toggle('on', DEF.captions !== 'off'); paintTheme(); layout(); };
const canvasDefault = PRESET[DEF.canvas] !== undefined ? DEF.canvas : 'none', phoneDefault = DEF.phone || (aroundTpl ? 'left' : 'center');
CHANGED.privacy = () => privacy.on || Object.keys(privacy.map).length > 0 || privacy.custom.length > 0 || privacy.keep.length > 0;
RESETS.privacy = () => { privacy.map = {}; privacy.custom = []; privacy.keep = []; setPrivacy(false); };
CHANGED.credit = () => credit.on || credit.showLink || credit.pos !== 'bottom-right' || credit.when !== 'outro';
RESETS.credit = () => { Object.assign(credit, { on: false, showLink: false, pos: 'bottom-right', when: 'outro' }); creditChanged(); };
CHANGED.canvas = () => canvasName !== canvasDefault || phonePos !== phoneDefault || Object.keys(slots).some(k => slots[k] !== slotsDefault[k]);
RESETS.canvas = () => { canvasName = canvasDefault; phonePos = phoneDefault; Object.assign(slots, slotsDefault); $('#canvas-pick').value = canvasName; $('#phone-pick').value = phonePos;
  document.querySelectorAll('.fc-slot-toggles [data-slot]').forEach(b => b.classList.toggle('on', !!slots[b.dataset.slot])); layout(); };
CHANGED.timing = () => speed !== 1 || dur.some((m, k) => m !== base[k]);
RESETS.timing = () => { speed = 1; base.forEach((m, k) => { dur[k] = m; }); retime(); retimed(); hold = -1; go(i); };
const paintResets = () => document.querySelectorAll('.fc-sreset').forEach(b => { b.hidden = !CHANGED[b.dataset.reset]?.(); });
// a reset in a header must not open or close its section
$('.fc-tools').addEventListener('click', (e) => { const b = e.target.closest('.fc-sreset'); if (!b) return; e.preventDefault(); RESETS[b.dataset.reset]?.(); paintResets(); saveState(); });
// a row's buttons retime or reset that beat; a click elsewhere on the row plays it
$('#fc-beats').onclick = (e) => { const row = e.target.closest('.fc-brow'); if (!row) return; const k = +row.dataset.k, b = e.target.closest('button');
  if (b?.dataset.r) { dur[k] = base[k]; retime(); retimed(); hold = k; go(k); } else if (b) nudge(k, +b.dataset.d); else { hold = -1; stills ? still(beats[k].outro ? slideCount() - 1 : k) : go(k); } };
// Colours: every colour token the intro defines, light and dark, grouped the way the intro's `palette` says (one group per product or part)
const tokens = { light: {}, dark: {} };
{ const walk = (list, dark) => { for (const r of list) {
    if (r.media) { walk(r.cssRules, dark || /prefers-color-scheme:\s*dark/.test(r.media.mediaText)); continue; }
    if (!r.selectorText || !r.style) continue;
    const sel = r.selectorText.replace(/\s|"/g, ''), toDark = sel === ':root[data-theme=dark]' || (dark && sel.startsWith(':root')), toLight = !dark && sel === ':root';
    if (toDark || toLight) for (const p of r.style) if (p.startsWith('--')) (toDark ? tokens.dark : tokens.light)[p] = r.style.getPropertyValue(p).trim();
  } };
  for (const sh of document.styleSheets) { try { walk(sh.cssRules, false); } catch {} } }
// a literal colour becomes #rrggbb for the picker; anything else (a mix, a variable, a font) is not a colour to pick
const ink = document.createElement('canvas').getContext('2d');
const hex = (v) => { if (!v || /var\(|mix\(|gradient/.test(v)) return null; ink.fillStyle = '#010203'; ink.fillStyle = v; const out = ink.fillStyle; if (out === '#010203' && !/^#010203$/i.test(v)) return null; if (out.startsWith('#')) return out; const m = out.match(/[\d.]+/g); return m ? '#' + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('') : null; };
const COLOR_KEYS = Object.keys(tokens.light).filter(k => hex(tokens.light[k]));
const colors = { light: { ...(pre.colors?.light || {}) }, dark: { ...(pre.colors?.dark || {}) } };
const paintColors = () => { let st = $('#fc-colors-css'); if (!st) { st = document.createElement('style'); st.id = 'fc-colors-css'; document.body.append(st); }
  const d = (o) => Object.entries(o).map(([k, v]) => `${k}:${v}`).join(';');
  st.textContent = `:root:root{${d(colors.light)}}@media (prefers-color-scheme:dark){:root:root:not([data-theme=light]){${d(colors.dark)}}}:root:root[data-theme=dark]{${d(colors.dark)}}`; };
paintColors();
{ const pal = typeof palette === 'object' ? palette : null, has = (k) => COLOR_KEYS.includes(k);
  const main = (pal?.main || ['--accent', '--bg', '--screen', '--on']).filter(has).slice(0, 4);
  const groups = pal ? Object.entries(pal).filter(([g]) => g !== 'main').map(([g, ks]) => [g, ks.filter(has)]) : [];
  const placed = new Set([...main, ...groups.flatMap(([, ks]) => ks)]), rest = COLOR_KEYS.filter(k => !placed.has(k));
  if (rest.length) groups.push([pal ? 'Other' : 'All colours', rest]);
  const name = (k) => k.replace(/^--/, '').replace(/[-_]/g, ' ').replace(/^./, c => c.toUpperCase());
  const val = (t, k) => hex(colors[t][k] || tokens[t][k] || tokens.light[k]) || '#000000';
  const changed = (k) => k in colors.light || k in colors.dark;
  const row = (k) => `<div class="fc-crow"><span>${name(k)}</span><button class="fc-creset" data-k="${k}" title="Reset ${name(k)}" ${changed(k) ? '' : 'hidden'}>${I('reset')}</button>${['light', 'dark'].map(t => `<label class="fc-sw" title="${t === 'light' ? 'Light' : 'Dark'} theme">${I(t === 'light' ? 'sun' : 'moon')}<input type="color" data-k="${k}" data-t="${t}" value="${val(t, k)}"></label>`).join('')}</div>`;
  const group = (g, ks, k) => head(`colors-${k}`, g).replace('<details ', '<details class="fc-sub" ') + `${ks.map(row).join('')}</details>`;
  if (COLOR_KEYS.length && mode === 'preview') {
    $('[data-sec=look]').insertAdjacentHTML('afterend', `${head('colors', 'Colours', { icon: 'look', open: true })}<div class="fc-cols"><div class="fc-chead"><span></span><span>${I('sun')}</span><span>${I('moon')}</span></div>${main.map(row).join('')}${groups.map(([g, ks], k) => ks.length ? group(g, ks, k + 1) : '').join('')}</div></details>`);
    const sec = $('[data-sec=colors]');
    sec.addEventListener('input', (e) => { const el = e.target; if (!el.dataset.t) return; colors[el.dataset.t][el.dataset.k] = el.value; paintColors(); sec.querySelector(`.fc-creset[data-k="${el.dataset.k}"]`).hidden = false; paintResets(); });
    // back to what the intro set, both themes, for one colour, one group or all of them
    const resetKeys = (ks) => { for (const k of ks) { delete colors.light[k]; delete colors.dark[k]; sec.querySelectorAll(`input[data-k="${k}"]`).forEach(inp => { inp.value = val(inp.dataset.t, k); }); sec.querySelector(`.fc-creset[data-k="${k}"]`).hidden = true; } paintColors(); };
    sec.addEventListener('click', (e) => { const b = e.target.closest('.fc-creset'); if (!b) return; resetKeys([b.dataset.k]); paintResets(); saveState(); });
    CHANGED.colors = () => COLOR_KEYS.some(changed); RESETS.colors = () => resetKeys(COLOR_KEYS);
    groups.forEach(([, ks], k) => { CHANGED[`colors-${k + 1}`] = () => ks.some(changed); RESETS[`colors-${k + 1}`] = () => resetKeys(ks); });
  } }
// the panel remembers which sections the user left open
try { const open = JSON.parse(localStorage.getItem('fc-open') || '{}'); document.querySelectorAll('.fc-tools details').forEach(d => { if (d.dataset.sec in open) d.open = open[d.dataset.sec]; }); } catch {}
document.querySelectorAll('.fc-tools details').forEach(d => d.addEventListener('toggle', () => { try { const open = JSON.parse(localStorage.getItem('fc-open') || '{}'); open[d.dataset.sec] = d.open; localStorage.setItem('fc-open', JSON.stringify(open)); } catch {} }));

// the frame scaled by k, and the captions under it with it
function setFrame(k) {
  const [w, h] = SIZE;
  $('#fc-frame').style.transform = `scale(${k})`; $('#fc-fit').style.height = h * k + 'px'; $('#fc-fit').style.width = w * k + 'px';
  const below = $('.fc-caption.fc-below'); if (below) { below.style.maxWidth = w * k + 'px'; below.style.zoom = Math.max(1, k); }
}
// in the preview the panel sits beside the stage, or under it on a narrow window
// full screen shows the video alone, the way a viewer sees it
const full = () => document.documentElement.classList.contains('fc-full');
const side = () => mode === 'preview' && innerWidth > 900 && !full();
// the room the toolbar, dots and transport take, measured, so the stage never pushes them off screen
const chrome = () => mode === 'record' || full() ? 0 : [side() ? '' : '.fc-tools', '.fc-dots', '.fc-bar'].filter(Boolean).reduce((a, q) => a + ($(q)?.offsetHeight || 0), 0) + 12 * 4 + 24 + (mode === 'preview' ? 68 : 0);
const roomW = () => innerWidth - (full() ? 0 : 32) - (side() ? 356 : 0);
// the canvas is what gets exported: a preset size, the phone placed on it, the slots around it. Preview scales the whole canvas to the window.
// the credit tag and outro live on the exported picture: the canvas when there is one, otherwise inside the device's screen, clear of its edge and corners
function creditHost() { return PRESET[canvasName] || frame === 'none' ? $('#fc-canvas') : $('.fc-screen'); }
function placeCredit() { const host = creditHost(); for (const el of [$('#fc-canvas .fc-made, .fc-screen .fc-made'), $('#fc-outro')]) if (el && el.parentElement !== host) host.append(el);
  host.classList.toggle('fc-with-credit', credit.on); host.dataset.creditPos = credit.pos; host.dataset.creditWhen = credit.when;
  const other = host.matches('#fc-canvas') ? $('.fc-screen') : $('#fc-canvas'); other?.classList.remove('fc-with-credit'); }
function layout() {
  const c = PRESET[canvasName], cvEl = $('#fc-canvas'), wrap = $('#fc-cwrap');
  if ($('#fc-outro')) placeCredit();
  cvEl.dataset.preset = canvasName; cvEl.dataset.phone = c || aroundTpl ? phonePos : 'center'; cvEl.dataset.around = aroundTpl ? 'yes' : 'no';
  Object.entries(slots).forEach(([k, on]) => { $(`#fc-slot-${k}`).hidden = !c || !on; });
  // position matters when the canvas is a different shape from the scene: a device always, a full-canvas scene on a wider or taller canvas
  const sameShape = frame === 'none' && SIZE[1] && c && Math.abs(c[0] / c[1] - SIZE[0] / SIZE[1]) < .01;
  $('#phone-pick').hidden = !c || sameShape; $('.fc-slot-toggles').hidden = !c;
  [...$('#phone-pick').options].forEach(o => { o.textContent = `${frame === 'none' ? 'Scene' : 'Device'} ${{ center: 'centre', left: 'left', right: 'right' }[o.value]}`; });
  const [w, h] = SIZE;
  if (frame === 'none' && !h) return;
  if (!c) {
    $('#fc-length').hidden = true; cvEl.style.width = cvEl.style.height = ''; cvEl.style.transform = ''; wrap.style.width = wrap.style.height = '';
    const tall = innerHeight - chrome() - (captionsAt === 'below' ? 120 : 0);
    // a free-size composition fills its recording exactly; a device keeps a margin
    const fill = frame === 'none' && mode === 'record';
    setFrame(fill ? (innerWidth === w && innerHeight === h ? 1 : Math.min(innerWidth / w, innerHeight / h)) : mode === 'record' ? Math.min(roomW() / w, tall / h) * 0.92 : Math.min(full() ? Infinity : 1, roomW() / w, tall / h));
    return;
  }
  const [cw, ch] = c; cvEl.style.width = cw + 'px'; cvEl.style.height = ch + 'px';
  const column = canvasName === 'story' || phonePos === 'center';
  const preset = PRESETS[canvasName]; cvEl.style.setProperty('--fc-safe-top', (preset.safe?.[0] || 0) + 'px'); cvEl.style.setProperty('--fc-safe-bottom', (preset.safe?.[1] || 0) + 'px');
  const over = preset.max && totalMs() / 1000 > preset.max; $('#fc-length').hidden = !over; if (over) $('#fc-length').textContent = `Over ${preset.max}s for this place, tighten the beats`;
  cvEl.dataset.layout = column ? 'column' : 'row';
  // the phone takes the room the slots and the around part leave
  const st = getComputedStyle(cvEl), pad = parseFloat(st.paddingTop) * 2, padX = parseFloat(st.paddingLeft) * 2, gap = parseFloat(st.rowGap) || 0;
  const topH = $('#fc-top').offsetHeight, botH = $('#fc-bottom').offsetHeight, arH = aroundTpl ? $('#fc-around').offsetHeight : 0;
  const stack = [topH, botH, arH].filter(Boolean);
  // a scene that is its own composition, with nothing switched on around it, fills the canvas edge to edge
  const bare = frame === 'none' && SIZE[1] && !Object.entries(slots).some(([k, on]) => on && !$(`#fc-slot-${k}`).hidden) && !aroundTpl;
  cvEl.dataset.bare = bare ? 'yes' : 'no';
  // a bare scene on a wider canvas sits where the user put it
  cvEl.style.justifyContent = bare ? { left: 'start', right: 'end', center: 'center' }[phonePos] : '';
  const k = bare ? Math.min(cw / w, ch / h)
    : column
    ? Math.min((ch - pad - stack.reduce((a, b) => a + b, 0) - gap * stack.length) / h, (cw - padX) / w)
    : Math.min((ch - pad) / h, (cw - padX) * (aroundTpl ? 0.36 : 0.42) / w);
  setFrame(k);
  // the around part grows into the column it has, up to double size
  if (aroundTpl) { const ar = $('#fc-around'); ar.style.zoom = 1; const natural = ar.firstElementChild?.offsetWidth || ar.offsetWidth; const roomW = column ? cw - padX : cw - padX - w * k - 64; ar.style.zoom = Math.max(1, Math.min(2, roomW / natural)); }
  const K = mode === 'record' ? 1 : Math.min(full() ? Infinity : 1, roomW() / cw, (innerHeight - chrome()) / ch);
  cvEl.style.transform = `scale(${K})`; wrap.style.width = cw * K + 'px'; wrap.style.height = ch * K + 'px';
}
addEventListener('resize', layout); layout();
paintStatus(); matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', paintStatus);

// what the user set on the page: every export, by button or by asking Claude, uses exactly this
const state = () => ({
  canvas: canvasName, phone: phonePos, theme: document.documentElement.dataset.theme || undefined, captions: document.documentElement.dataset.captions === 'off' ? 'off' : captionsAt,
  speed, durations: dur.some((m, k) => m !== base[k]) ? [...dur] : undefined,
  privacy: CHANGED.privacy() ? { on: privacy.on, map: { ...privacy.map }, custom: privacy.custom.map(r => [...r]), keep: [...privacy.keep] } : undefined,
  credit: CHANGED.credit() ? { on: credit.on, showLink: credit.showLink, pos: credit.pos, when: credit.when } : undefined,
  colors: Object.keys(colors.light).length || Object.keys(colors.dark).length ? colors : undefined,
  slots: { ...slots }, words: Object.fromEntries(['headline', 'line', 'cta', 'tags'].map(k => [k, $(`#fc-slot-${k}`).textContent.trim()])),
});
// Export: when the page comes from the studio on localhost, the buttons post to it and the file is made by the toolchain and revealed
const STUDIO = location.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(location.hostname);
let saveTimer; const saveState = () => { paintResets(); if (!STUDIO) return; clearTimeout(saveTimer); saveTimer = setTimeout(() => fetch('state', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(state()) }).catch(() => {}), 300); };
$('.fc-tools').addEventListener('change', saveState); $('.fc-tools').addEventListener('click', saveState); $('.fc-slots') && document.querySelectorAll('.fc-slots').forEach(el => el.addEventListener('input', saveState));
// the studio opens on a splash: brand colour, the logo centred, then it fades to the studio
if (STUDIO && mode === 'preview') {
  const sp = document.createElement('div'); sp.id = 'fc-splash';
  sp.innerHTML = motionImg('fc-splash-mark');
  document.body.append(sp);
  // long enough for the mark to fold and press once
  const leave = () => { setTimeout(() => sp.classList.add('fc-out'), 1800); setTimeout(() => sp.remove(), 2200); };
  document.readyState === 'complete' ? leave() : addEventListener('load', leave, { once: true });
}
if (STUDIO) {
  // the studio tab carries the Flowcast mark
  const icon = document.createElement('link'); icon.rel = 'icon'; icon.type = 'image/svg+xml';
  icon.href = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#FF6B4A"/><rect x="14" y="12" width="28" height="36" rx="6" fill="#fff" opacity=".45"/><rect x="19" y="16" width="28" height="36" rx="6" fill="#fff" opacity=".7"/><rect x="24" y="20" width="28" height="34" rx="6" fill="#fff"/><path d="M33 30v14l11-7z" fill="#FF6B4A"/></svg>');
  document.querySelectorAll('link[rel~="icon"]').forEach(l => l.remove()); document.head.append(icon);
  // where you are: Flowcast, which is home and lists every intro, then the project, then this intro's name
  if (mode === 'preview') {
    const crumbs = document.createElement('nav'); crumbs.className = 'fc-crumbs'; crumbs.ariaLabel = 'Breadcrumb';
    crumbs.innerHTML = '<a href="/" title="All intros"><svg viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#FF6B4A"/><rect x="14" y="12" width="28" height="36" rx="6" fill="#fff" opacity=".45"/><rect x="19" y="16" width="28" height="36" rx="6" fill="#fff" opacity=".7"/><rect x="24" y="20" width="28" height="34" rx="6" fill="#fff"/><path d="M33 30v14l11-7z" fill="#FF6B4A"/></svg><b>Flowcast</b></a><span class="fc-sep" aria-hidden="true">/</span><a class="fc-proj" href="/"></a><span class="fc-sep" aria-hidden="true">/</span><span class="fc-here" aria-current="page"></span>';
    // the project this intro belongs to links to that project's own page
    const projectSlug = location.pathname.split('/').filter(Boolean)[0], projLink = crumbs.querySelector('.fc-proj');
    if (pre.project && projectSlug) { projLink.textContent = pre.project; projLink.href = `/${projectSlug}/`; } else { projLink.nextElementSibling.remove(); projLink.remove(); }
    crumbs.querySelector('.fc-here').textContent = document.title;
    document.body.prepend(crumbs);
  }
  $('#fc-export-sec').hidden = false;
  // once anything is exported, the folder is always one click away
  $('#fc-folder').hidden = !pre.exported; $('#fc-folder').onclick = () => fetch('open', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"folder":true}' });
  const pick = $('#fc-export');
  // pick a format, then Export makes it
  // the Export button shows the export itself: the mark and what is being made, until the file is ready
  $('#fc-go').onclick = async () => {
    const format = pick.value, name = { mp4: 'MP4', gif: 'GIF', frames: 'PNG frames', slides: 'PDF slides' }[format] || format;
    const q = { format, project: document.title, ...state(), theme: isDark() ? 'dark' : 'light' };
    const go = $('#fc-go'), status = $('#fc-status'), tiles = document.querySelectorAll('#fc-fmts button'); let done = false;
    pick.disabled = go.disabled = true; tiles.forEach(t => { t.disabled = true; }); status.hidden = true;
    go.classList.add('fc-exporting'); go.innerHTML = motionImg('fc-busy', true) + `<span>Exporting ${name}\u2026</span>`;
    try { const r = await fetch('export', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(q) }).then(r => r.json());
      if (r.ok) { $('#fc-folder').hidden = false; done = true; }
      else { status.hidden = false; status.textContent = `Export failed: ${r.error}`; } }
    catch (err) { status.hidden = false; status.textContent = 'Export failed: ' + err.message; }
    // a moment of Saved on the button, then back to Export; the folder button below opens the file
    go.classList.remove('fc-exporting'); go.innerHTML = `${I(done ? 'check' : 'export')}<span>${done ? 'Saved to exports' : ''}</span>`; if (!done) exportLabel();
    else setTimeout(() => { go.innerHTML = `${I('export')}<span></span>`; exportLabel(); }, 2000);
    pick.disabled = go.disabled = false; tiles.forEach(t => { t.disabled = false; });
  };
}
paintResets();
window.flowcast = { get total() { return totalMs(); }, go, still, slides: slideCount, beats, layout, frame, size: SIZE, canvas: () => PRESET[canvasName] };
host.classList.toggle('fc-stills', stills); stills ? still(0) : go(0);
