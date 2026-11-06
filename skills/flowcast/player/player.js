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
const total = beats.reduce((a, b) => a + b.ms, 0) + (endCard ? T.endCard : 0);
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

const captionHTML = '<div class="fc-caption"><h2 id="fc-title"></h2><p id="fc-body"></p></div>';
host.innerHTML = `
<div class="fc-tools">
  <button id="fc-theme">Dark</button><button id="fc-captions" class="on">Captions</button>
  <select id="canvas-pick">${Object.entries(PRESETS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select><span class="fc-tag" id="fc-length" hidden></span>
  <select id="phone-pick"><option value="center">Device centre</option><option value="left">Device left</option><option value="right">Device right</option></select>
  <span class="fc-slot-toggles">${Object.keys(slots).filter(k => k === 'logo' ? !!endTpl?.content.querySelector('.fc-logo') : !!cv[k]).map(k => `<button data-slot="${k}" class="${slots[k] ? 'on' : ''}">${k}</button>`).join('')}</span>
  <span class="fc-tag">${{ phone: 'Phone \u00b7 390\u00d7844', browser: 'Browser \u00b7 1280\u00d7800', none: SIZE[1] ? `Canvas \u00b7 ${SIZE[0]}\u00d7${SIZE[1]}` : 'In-app' }[frame]}</span>
  <select id="fc-export" hidden><option value="">Export \u00b7 ${(total / 1000).toFixed(1)}s</option><option value="mp4">MP4 video</option><option value="gif">GIF</option><option value="frames">PNG frames</option><option value="slides">PDF slides</option></select><span class="fc-tag" id="fc-status" hidden></span><button id="fc-saved" hidden></button>
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
<div class="fc-bar"><button id="fc-pause">Pause</button><button id="fc-prev" aria-label="Previous">\u2039</button><button id="fc-next" aria-label="Next">\u203a</button><button id="fc-replay">Replay</button><button id="fc-skip">Skip</button></div>`;
host.dataset.mode = mode;
$('#fc-stage').append(sceneTpl.content);
if (aroundTpl) $('#fc-around').append(aroundTpl.content);
if (endTpl) { $('#fc-end').append(endTpl.content); const logo = $('#fc-end .fc-logo'); if (logo) $('#fc-slot-logo').append(logo.cloneNode(true)); }
if (host.dataset.actor === 'pointer') $('#fc-finger').classList.add('fc-pointer');
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

const STALE = Symbol('stale beat');
let i = 0, paused = false, run = 0, raf, startAt, elapsed = 0;
function render() {
  $('#fc-title').textContent = beats[i].title; $('#fc-body').textContent = beats[i].body;
  $('#fc-dots').innerHTML = beats.map((_, k) => `<div class="fc-dot${k === i ? ' on' : ''}" data-k="${k}"><i></i></div>`).join('');
}
function go(n) {
  window.flowcastDone = false; i = Math.max(0, Math.min(beats.length - 1, n)); run++; elapsed = 0; paused = false; $('#fc-pause').textContent = 'Pause';
  s.cls('#fc-end', 'show', false); s.finger(false); apply(i); render();
  // the beat's steps run with their own wait, which stops them the moment another beat starts
  const mine = run, own = { ...s, wait: async (ms) => { await s.wait(ms); if (mine !== run) throw STALE; } };
  for (const k of ['tap', 'type']) own[k] = async (...a) => { if (mine !== run) throw STALE; return s[k].apply(own, a); };
  Promise.resolve().then(() => scene[i](own)).catch(e => { if (e !== STALE) console.error(e); });
  tick(run);
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
let saveTimer; const saveState = () => { if (!STUDIO) return; clearTimeout(saveTimer); saveTimer = setTimeout(() => fetch('state', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(state()) }).catch(() => {}), 300); };
$('.fc-tools').addEventListener('change', saveState); $('.fc-tools').addEventListener('click', saveState); $('.fc-slots') && document.querySelectorAll('.fc-slots').forEach(el => el.addEventListener('input', saveState));
let lastFile = '';
// the studio opens on a splash: brand colour, the logo centred, then it fades to the studio
if (STUDIO && mode === 'preview') {
  const sp = document.createElement('div'); sp.id = 'fc-splash';
  sp.innerHTML = '<svg viewBox="0 0 64 64"><rect x="14" y="12" width="28" height="36" rx="6" fill="#fff" opacity=".45"/><rect x="19" y="16" width="28" height="36" rx="6" fill="#fff" opacity=".7"/><rect x="24" y="20" width="28" height="34" rx="6" fill="#fff"/><path d="M33 30v14l11-7z" fill="#FF6B4A"/></svg>';
  document.body.append(sp);
  const leave = () => { setTimeout(() => sp.classList.add('out'), 900); setTimeout(() => sp.remove(), 1300); };
  document.readyState === 'complete' ? leave() : addEventListener('load', leave, { once: true });
}
if (STUDIO) {
  // the studio tab carries the Flowcast mark
  const icon = document.createElement('link'); icon.rel = 'icon'; icon.type = 'image/svg+xml';
  icon.href = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#FF6B4A"/><rect x="14" y="12" width="28" height="36" rx="6" fill="#fff" opacity=".45"/><rect x="19" y="16" width="28" height="36" rx="6" fill="#fff" opacity=".7"/><rect x="24" y="20" width="28" height="34" rx="6" fill="#fff"/><path d="M33 30v14l11-7z" fill="#FF6B4A"/></svg>');
  document.querySelectorAll('link[rel~="icon"]').forEach(l => l.remove()); document.head.append(icon);
  const brand = document.createElement('a'); brand.className = 'fc-brand'; brand.href = '/'; brand.title = 'History';
  brand.dataset.label = 'History'; brand.innerHTML = '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#FF6B4A"/><rect x="14" y="12" width="28" height="36" rx="6" fill="#fff" opacity=".45"/><rect x="19" y="16" width="28" height="36" rx="6" fill="#fff" opacity=".7"/><rect x="24" y="20" width="28" height="34" rx="6" fill="#fff"/><path d="M33 30v14l11-7z" fill="#FF6B4A"/></svg><b>Flowcast</b>';
  document.body.prepend(brand);
  $('#fc-export').hidden = false;
  $('#fc-saved').onclick = () => { if (lastFile) fetch('open', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ file: lastFile }) }); };
  const pick = $('#fc-export');
  pick.onchange = async () => {
    const format = pick.value, label = pick.selectedOptions[0].textContent; pick.value = ''; if (!format) return;
    const q = { format, project: document.title, ...state() };
    const status = $('#fc-status'), saved = $('#fc-saved');
    pick.disabled = true; status.hidden = false; saved.hidden = true; status.textContent = `Exporting ${label}\u2026`; lastFile = '';
    try { const r = await fetch('export', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(q) }).then(r => r.json());
      if (r.ok) { lastFile = r.file; status.hidden = true; saved.textContent = r.file.split('/').pop() + (r.file.includes('.') && !r.file.endsWith('-frames') ? '' : '/') + ' \u2197'; saved.hidden = false; } else status.textContent = `Failed: ${r.error}`; }
    catch (err) { status.textContent = 'Failed: ' + err.message; }
    pick.disabled = false;
  };
}
window.flowcast = { total, go, beats, layout, frame, size: SIZE, canvas: () => PRESET[canvasName] };
go(0);
