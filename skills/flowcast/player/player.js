// flowcast player. The intro defines: beats, apply(i), scene{i}, T, optional canvas{}, and <template id="scene">, <template id="endcard">.
// <html data-mode>: preview | intro | embed | record.  #flowcast data-frame: phone | browser | none.
// Canvas: data-canvas none | story | square | landscape, data-phone center | left | right, data-captions-at inside | below.
const $ = (q) => document.querySelector(q);
// the recorder and the sheet set window.__flowcast before the page exists; apply it here
const pre = window.__flowcast || {};
for (const k of ['mode', 'theme', 'captions']) if (pre[k]) document.documentElement.dataset[k] = pre[k];
if (!pre.captions && $('#flowcast').dataset.captions === 'off') document.documentElement.dataset.captions = 'off';
const host = $('#flowcast');
for (const k of ['frame', 'canvas', 'phone', 'captionsAt']) if (pre[k]) host.dataset[k] = pre[k];
const mode = document.documentElement.dataset.mode || 'preview';
const frame = host.dataset.frame || 'phone';
const captionsAt = host.dataset.captionsAt || 'inside';
const SIZE = { phone: [390, 844], browser: [1280, 800], none: [+host.dataset.width || 420, +host.dataset.height || 0] }[frame];   // none: a free-size composition the intro draws itself
// one list: a size, the places it is posted, the longest clip they take, and the bands their own UI covers on the tall one
const PRESETS = {
  none:      { size: null,         label: 'No canvas' },
  square:    { size: [1080, 1080], label: '1080×1080 · LinkedIn, Instagram feed', max: 600 },
  portrait:  { size: [1080, 1350], label: '1080×1350 · Instagram portrait', max: 60 },
  story:     { size: [1080, 1920], label: '1080×1920 · Reels, Stories, TikTok, Shorts', max: 90, safe: [250, 320] },
  landscape: { size: [1920, 1080], label: '1920×1080 · YouTube, website', max: 0 },
};
const PRESET = Object.fromEntries(Object.entries(PRESETS).map(([k, v]) => [k, v.size]));
const sceneTpl = $('#scene'), endTpl = $('#endcard'), aroundTpl = $('#around');   // around: the part of the scene outside the device, on the canvas
let canvasName = PRESET[host.dataset.canvas] !== undefined ? host.dataset.canvas : 'none';
let phonePos = host.dataset.phone || (aroundTpl ? 'left' : 'center');
const endCard = mode !== 'intro' && !!endTpl;
if (typeof T !== 'object') window.T = {};
T.endCard ??= 2000;
const total = beats.reduce((a, b) => a + b.ms, 0) + (endCard ? T.endCard : 0);
const cv = typeof canvas === 'object' ? canvas : {};   // the content around the phone on a social canvas
const slots = { logo: !!endTpl, headline: !!cv.headline, line: !!cv.line, cta: !!cv.cta, tags: !!cv.tags, ...(cv.show || {}), ...(pre.slots || {}) };
Object.assign(cv, pre.words || {});   // words the user typed on the preview, saved by the studio

const captionHTML = '<div class="fc-caption"><h2 id="fc-title"></h2><p id="fc-body"></p></div>';
host.innerHTML = `
<div class="fc-tools">
  <button id="fc-theme">Dark</button><button id="fc-captions" class="on">Captions</button>
  <select id="canvas-pick">${Object.entries(PRESETS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select><span class="fc-tag" id="fc-length" hidden></span>
  <select id="phone-pick"><option value="center">Device centre</option><option value="left">Device left</option><option value="right">Device right</option></select>
  <span class="fc-slot-toggles">${Object.keys(slots).map(k => `<button data-slot="${k}" class="${slots[k] ? 'on' : ''}">${k}</button>`).join('')}</span>
  <span class="fc-tag">${{ phone: 'Phone · 390×844', browser: 'Browser · 1280×800', none: SIZE[1] ? `Canvas · ${SIZE[0]}×${SIZE[1]}` : 'In-app' }[frame]}</span>
  <span class="fc-tag">Total <b id="fc-total">${(total / 1000).toFixed(1)}s</b></span>
  <select id="fc-export" hidden><option value="">Export…</option><option value="mp4">MP4 video</option><option value="gif">GIF</option><option value="frames">PNG frames</option><option value="slides">PDF slides</option></select><span class="fc-tag" id="fc-status" hidden></span><button id="fc-saved" hidden></button>
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
      <div class="fc-screen">${frame === 'phone' ? '<div class="fc-status"><span>9:41</span><span><i></i></span></div>' : ''}
        <div class="fc-stage" id="fc-stage"><div class="fc-finger" id="fc-finger"></div></div>
        ${captionsAt === 'inside' ? captionHTML : ''}
        <div class="fc-end" id="fc-end"></div></div></div></div>
    ${captionsAt === 'below' ? captionHTML.replace('class="fc-caption"', 'class="fc-caption fc-below"') : ''}
  </div>
</div></div>
<div class="fc-dots" id="fc-dots"></div>
<div class="fc-bar"><button id="fc-pause">Pause</button><button id="fc-prev" aria-label="Previous">‹</button><button id="fc-next" aria-label="Next">›</button><button id="fc-replay">Replay</button><button id="fc-skip">Skip</button></div>`;
host.dataset.mode = mode;
$('#fc-stage').append(sceneTpl.content);
if (aroundTpl) $('#fc-around').append(aroundTpl.content);
if (endTpl) { $('#fc-end').append(endTpl.content); const logo = $('#fc-end .fc-logo'); if (logo) $('#fc-slot-logo').append(logo.cloneNode(true)); }
if (frame === 'none') { $('#fc-frame').style.width = SIZE[0] + 'px'; if (SIZE[1]) $('#fc-frame').style.height = SIZE[1] + 'px'; else $('#fc-stage').style.height = '440px'; }
$('#fc-canvas').dataset.bg = cv.bg || 'tint';
if (mode === 'preview') document.querySelectorAll('.fc-slots h1, .fc-slots p, .fc-cta').forEach(e => e.contentEditable = 'plaintext-only');

// helpers the scene steps use
const s = {
  wait: (ms) => new Promise(r => setTimeout(r, ms)),
  cls: (q, c, on = true) => $(q).classList.toggle(c, on),
  text: (q, t) => { $(q).textContent = t; },
  finger: (show, press = false) => { const f = $('#fc-finger'); f.classList.toggle('show', show); f.classList.toggle('press', press); },
  moveTo: (q) => { const r = $(q).getBoundingClientRect(), st = $('#fc-stage').getBoundingClientRect(), k = st.width / $('#fc-stage').offsetWidth; const f = $('#fc-finger'); f.style.left = (r.left - st.left + r.width / 2) / k + 'px'; f.style.top = (r.top - st.top + r.height / 2) / k + 'px'; },
  tap: async (q) => { s.moveTo(q); s.finger(true); await s.wait(T.press ?? 550); s.finger(true, true); await s.wait(T.lift ?? 150); s.finger(false); },
  type: async (q, text) => { for (let k = 1; k <= text.length; k++) { $(q).textContent = text.slice(0, k); await s.wait(T.type ?? 30); } },
};

let i = 0, paused = false, run = 0, raf, startAt, elapsed = 0;
function render() {
  $('#fc-title').textContent = beats[i].title; $('#fc-body').textContent = beats[i].body;
  $('#fc-dots').innerHTML = beats.map((_, k) => `<div class="fc-dot${k === i ? ' on' : ''}" data-k="${k}"><i></i></div>`).join('');
}
function go(n) {
  window.flowcastDone = false; i = Math.max(0, Math.min(beats.length - 1, n)); run++; elapsed = 0; paused = false; $('#fc-pause').textContent = 'Pause';
  s.cls('#fc-end', 'show', false); s.finger(false); apply(i); render(); scene[i](s); tick(run);
}
function finish(mine) {
  if (!endCard) { if (mode === 'embed') go(0); else window.flowcastDone = true; return; }
  s.cls('#fc-end', 'show');
  setTimeout(() => { if (mine !== run) return; if (mode === 'embed' || mode === 'preview') go(0); else window.flowcastDone = true; }, T.endCard);
}
function tick(mine) {
  cancelAnimationFrame(raf); startAt = performance.now() - elapsed;
  const step = () => {
    if (mine !== run || paused) return;
    elapsed = performance.now() - startAt; const p = Math.min(1, elapsed / beats[i].ms);
    $('.fc-dot.on i').style.width = p * 100 + '%';
    if (p < 1) raf = requestAnimationFrame(step); else if (i < beats.length - 1) go(i + 1); else finish(mine);
  }; raf = requestAnimationFrame(step);
}
$('#fc-pause').onclick = () => { paused = !paused; $('#fc-pause').textContent = paused ? 'Play' : 'Pause'; if (!paused) tick(run); };
$('#fc-prev').onclick = () => go(i - 1); $('#fc-next').onclick = () => go(i + 1); $('#fc-replay').onclick = () => go(0);
$('#fc-skip').onclick = () => go(beats.length - 1);
$('#fc-dots').onclick = (e) => { const d = e.target.closest('.fc-dot'); if (d) go(+d.dataset.k); };

// toolbar
const isDark = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
const paintTheme = () => { $('#fc-theme').textContent = isDark() ? 'Light' : 'Dark'; };
$('#fc-theme').onclick = () => { document.documentElement.dataset.theme = isDark() ? 'light' : 'dark'; paintTheme(); };
$('#fc-captions').classList.toggle('on', document.documentElement.dataset.captions !== 'off');
$('#fc-captions').onclick = () => { const off = document.documentElement.dataset.captions !== 'off'; document.documentElement.dataset.captions = off ? 'off' : 'on'; $('#fc-captions').classList.toggle('on', !off); layout(); };
$('#canvas-pick').value = canvasName; $('#canvas-pick').onchange = (e) => { canvasName = e.target.value; layout(); };
$('#phone-pick').value = phonePos; $('#phone-pick').onchange = (e) => { phonePos = e.target.value; layout(); };
$('.fc-slot-toggles').onclick = (e) => { const b = e.target.closest('[data-slot]'); if (!b) return; slots[b.dataset.slot] = !slots[b.dataset.slot]; b.classList.toggle('on', slots[b.dataset.slot]); layout(); };
paintTheme();

// the frame scaled by k, and the captions under it with it
function setFrame(k) {
  const [w, h] = SIZE;
  $('#fc-frame').style.transform = `scale(${k})`; $('#fc-fit').style.height = h * k + 'px'; $('#fc-fit').style.width = w * k + 'px';
  const below = $('.fc-caption.fc-below'); if (below) { below.style.maxWidth = w * k + 'px'; below.style.zoom = Math.max(1, k); }
}
// the canvas is what gets exported: a preset size, the phone placed on it, the slots around it. Preview scales the whole canvas to the window.
// the room the toolbar, dots and transport take, measured, so the stage never pushes them off screen
const chrome = () => mode === 'record' ? 0 : ['.fc-tools', '.fc-dots', '.fc-bar'].reduce((a, q) => a + ($(q)?.offsetHeight || 0), 0) + 12 * 4 + 24;
function layout() {
  const c = PRESET[canvasName], cvEl = $('#fc-canvas'), wrap = $('#fc-cwrap');
  cvEl.dataset.preset = canvasName; cvEl.dataset.phone = c || aroundTpl ? phonePos : 'center'; cvEl.dataset.around = aroundTpl ? 'yes' : 'no';
  Object.entries(slots).forEach(([k, on]) => { $(`#fc-slot-${k}`).hidden = !c || !on; });
  $('#phone-pick').hidden = !c || frame === 'none'; $('.fc-slot-toggles').hidden = !c;
  const [w, h] = SIZE;
  if (frame === 'none' && !h) return;
  if (!c) {
    $('#fc-length').hidden = true; cvEl.style.width = cvEl.style.height = ''; cvEl.style.transform = ''; wrap.style.width = wrap.style.height = '';
    const tall = innerHeight - chrome() - (captionsAt === 'below' ? 120 : 0);
    // a free-size composition fills its recording exactly; a device keeps a margin
    const fill = frame === 'none' && mode === 'record';
    setFrame(fill ? (innerWidth === w && innerHeight === h ? 1 : Math.min(innerWidth / w, innerHeight / h)) : mode === 'record' ? Math.min((innerWidth - 32) / w, tall / h) * 0.92 : Math.min(1, (innerWidth - 32) / w, tall / h));
    return;
  }
  const [cw, ch] = c; cvEl.style.width = cw + 'px'; cvEl.style.height = ch + 'px';
  const column = canvasName === 'story' || phonePos === 'center';
  const preset = PRESETS[canvasName]; cvEl.style.setProperty('--fc-safe-top', (preset.safe?.[0] || 0) + 'px'); cvEl.style.setProperty('--fc-safe-bottom', (preset.safe?.[1] || 0) + 'px');
  const over = preset.max && total / 1000 > preset.max; $('#fc-length').hidden = !over; if (over) $('#fc-length').textContent = `Over ${preset.max}s for this place, tighten the beats`;
  cvEl.dataset.layout = column ? 'column' : 'row';
  // the phone takes the room the slots and the around part leave
  const st = getComputedStyle(cvEl), pad = parseFloat(st.paddingTop) * 2, padX = parseFloat(st.paddingLeft) * 2, gap = parseFloat(st.rowGap) || 0;
  const topH = $('#fc-top').offsetHeight, botH = $('#fc-bottom').offsetHeight, arH = aroundTpl ? $('#fc-around').offsetHeight : 0;
  const stack = [topH, botH, arH].filter(Boolean);
  const k = column
    ? Math.min((ch - pad - stack.reduce((a, b) => a + b, 0) - gap * stack.length) / h, (cw - padX) / w)
    : Math.min((ch - pad) / h, (cw - padX) * (aroundTpl ? 0.36 : 0.42) / w);
  setFrame(k);
  // the around part grows into the column it has, up to double size
  if (aroundTpl) { const ar = $('#fc-around'); ar.style.zoom = 1; const natural = ar.firstElementChild?.offsetWidth || ar.offsetWidth; const roomW = column ? cw - padX : cw - padX - w * k - 64; ar.style.zoom = Math.max(1, Math.min(2, roomW / natural)); }
  const K = mode === 'record' ? 1 : Math.min(1, (innerWidth - 32) / cw, (innerHeight - chrome()) / ch);
  cvEl.style.transform = `scale(${K})`; wrap.style.width = cw * K + 'px'; wrap.style.height = ch * K + 'px';
}
addEventListener('resize', layout); layout();

// what the user set on the page: every export, by button or by asking Claude, uses exactly this
const state = () => ({
  canvas: canvasName, phone: phonePos, theme: isDark() ? 'dark' : 'light', captions: document.documentElement.dataset.captions === 'off' ? 'off' : captionsAt,
  slots: { ...slots }, words: Object.fromEntries(['headline', 'line', 'cta', 'tags'].map(k => [k, $(`#fc-slot-${k}`).textContent.trim()])),
});
// Export: when the page comes from the studio on localhost, the buttons post to it and the file is made by the toolchain and revealed
const STUDIO = location.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(location.hostname);
let saveTimer; const saveState = () => { if (!STUDIO) return; clearTimeout(saveTimer); saveTimer = setTimeout(() => fetch('/state', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(state()) }).catch(() => {}), 300); };
$('.fc-tools').addEventListener('change', saveState); $('.fc-tools').addEventListener('click', saveState); $('.fc-slots') && document.querySelectorAll('.fc-slots').forEach(el => el.addEventListener('input', saveState));
let lastFile = '';
if (STUDIO) {
  $('#fc-export').hidden = false;
  $('#fc-saved').onclick = () => { if (lastFile) fetch('/open', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ file: lastFile }) }); };
  const pick = $('#fc-export');
  pick.onchange = async () => {
    const format = pick.value, label = pick.selectedOptions[0].textContent; pick.value = ''; if (!format) return;
    const q = { format, ...state() };
    const status = $('#fc-status'), saved = $('#fc-saved');
    pick.disabled = true; status.hidden = false; saved.hidden = true; status.textContent = `Exporting ${label}…`; lastFile = '';
    try { const r = await fetch('/export', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(q) }).then(r => r.json());
      if (r.ok) { lastFile = r.file; status.hidden = true; saved.textContent = `Saved · ${r.file.split('/').pop()} ↗`; saved.hidden = false; } else status.textContent = `Failed: ${r.error}`; }
    catch (err) { status.textContent = 'Failed: ' + err.message; }
    pick.disabled = false;
  };
}
window.flowcast = { total, go, beats, layout, frame, size: SIZE, canvas: () => PRESET[canvasName] };
go(0);
