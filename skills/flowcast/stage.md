# The stage

An intro is one HTML file plus the shared player (`player/player.css`, `player/player.js`, copied next to it). The file holds only what is specific to this feature: tokens, scene CSS, scene markup, beats, and the steps. The player adds the frame, toolbar, captions, dots, transport, theme and caption toggles, total time, modes and the end card.

## Rules

- **One continuous scene.** The same elements stay on screen and change state per beat. Steps flip classes; CSS transitions do the motion. No keyframe timelines, no Lottie, no video as the source.
- **Cause then effect.** Wait, show the actor, then the effect. `s.tap('#el')` moves the finger there, presses, lifts. Timings live in `T` at the top.
- **Real parts, real data.** Rebuild the product's actual components with its tokens and strings. Plausible values, never lorem ipsum. Read the project's logo SVG for the end card.
- **Surfaces behave like the real thing.** A chat pins to the bottom and each new message pushes the older ones up. A list grows from the top. A notification drops in from the top edge. A terminal scrolls. Anything not on screen yet takes no space: give it `class="fc-in"` and add `show` when its moment comes; it grows in smoothly and pushes the rest. Space such items with `margin-top` on the item, not `gap` on the parent, so the push is smooth. Never pre-place hidden elements with `opacity:0` inside a surface that flows.
- **State is history inside a device, a moment outside it.** `apply(i)` shows everything a real screen would still show: a chat at the last beat holds every message. On the canvas, an object that finished its step is gone or shrunk to a chip, and the space goes to the next object. Collapse with `fc-in` (remove `show`) or a `.done` class that shrinks it.
- **Nothing jumps.** Panels that swap are stacked absolutely in a fixed area. Rows that may be wider than the screen are grids with `minmax(0,1fr)`, never fixed-width flex items.
- **No gradients, no invented palette.** Avatars are initials on a light tint of the accent. Everything comes from the app's tokens.
- **`apply(i)` sets the full state a beat starts from,** so back, next, replay and the contact sheet all land on the right screen. `scene[i]` only animates that beat's change.
- **Not an app? Split the scene.** `<template id="scene">` is what the device's user sees. `<template id="around">` is the rest, placed beside the device on the canvas: an inbox, workflow nodes, the systems that answer. Both move on the same beats. The around part is sized at about 360px wide and grows into the column it gets. Without a canvas it sits beside the phone in the preview too.
- **A flow is its own canvas.** `data-frame="none" data-width="1080" data-height="1080" data-captions="off"`: the scene draws the whole square (or 1080×1920, 1920×1080), with its own headline row updated in `apply(i)`. Surfaces, the work, the proof and the brand all live inside the scene. A recording fills the canvas exactly.
- **Frame follows the platform.** `data-frame="phone"` (390×844) for Flutter, Android, iOS. `browser` (1280×800) for web. `none` for an in-app stage with no device.
- **Captions have a place.** `data-captions-at="inside"` under the stage, in the screen (in-app). `below` puts them under the frame (web demo).
- **The canvas is the export.** `data-canvas="none|square|portrait|story|landscape"` and `data-phone="center|left|right"` set the start; the toolbar switches them. A `const canvas = { headline, line, cta, tags, bg: 'tint'|'accent'|'bg' }` in the script fills the slots; the logo comes from the end card. Slot words come from the beats and the project, never filler.
- **Never use `fc-` on your own classes or ids.** Everything the player owns is prefixed `fc-`, so an intro can name things `body`, `end`, `bar`, `title` freely.

## Skeleton

```html
<title>Feature name</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=App+Font:wght@400;600&display=swap">
<link rel="stylesheet" href="player.css">
<style>
/* tokens from the project's theme file. Light on :root, dark twice. */
:root{--accent:#862996;--on-accent:#fff;--bg:#f3f0f5;--screen:#fff;--card:#F6F6F6;--on:#1b1b1b;--muted:#6E6E6E;--border:rgba(0,0,0,.1);--bezel:#1b1b1f;--font:'App Font',system-ui,sans-serif}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#0a0e14;--screen:#10161E;--card:#1C2834;--on:#f2f2f2;--muted:#9aa3ad;--border:rgba(255,255,255,.1);--bezel:#2a2f38;color-scheme:dark}}
:root[data-theme=dark]{--bg:#0a0e14;--screen:#10161E;--card:#1C2834;--on:#f2f2f2;--muted:#9aa3ad;--border:rgba(255,255,255,.1);--bezel:#2a2f38;color-scheme:dark}
/* scene parts, rebuilt from the app's components */
.row{padding:14px 16px;background:var(--card);transition:background .4s}
.row.sel{background:color-mix(in srgb,var(--accent) 14%,var(--card))}
</style>

<div id="flowcast" data-frame="phone" data-captions-at="inside" data-canvas="none" data-phone="center">
<template id="scene">
  <div class="appbar">Feature</div>
  <div class="row" id="fajr">Fajr</div>
</template>
<template id="endcard"><svg class="fc-logo" viewBox="0 0 24 24">…the app's logo, fill currentColor…</svg><p>One line.</p></template>
</div>

<script>
const T = { settle: 400, press: 550, lift: 150, type: 30 };
const canvas = { headline: 'Alarms that know your prayers.', line: 'Pick a prayer, set the gap, it follows every day.', cta: 'Get Noor', tags: '#PrayerTimes #Noor', bg: 'tint' };
const beats = [
  { title: 'Pick a prayer', body: 'Tap it and the alarm is set from its time.', ms: 2500 },
];
function apply(i) { s.cls('#fajr', 'sel', i >= 1); }
const scene = {
  0: async (s) => { await s.wait(T.settle); await s.tap('#fajr'); s.cls('#fajr', 'sel'); },
};
</script>
<script src="player.js"></script>
```

A mixed scene adds, inside `#flowcast`:

```html
<template id="around">
  <div class="wf">
    <div class="panel"><h5>Support inbox <b id="count">12 waiting</b></h5>…</div>
    <div class="panel"><h5>n8n workflow</h5><div class="nodes"><div class="node" id="n1">WhatsApp</div>…</div></div>
  </div>
</template>
```

Helpers on `s`: `wait(ms)`, `cls(sel, class, on)`, `text(sel, str)`, `tap(sel)`, `type(sel, str)`, `finger(show, press)`.

## Modes

Set `data-mode` on `<html>`; the recorder does it for you.

| Mode | Shown | Ends |
|---|---|---|
| preview | toolbar, dots, pause, back, next, replay, skip | end card, then loops |
| intro | dots, pause, back, next, replay, skip | last beat holds |
| embed | pause, replay | end card, then loops |
| record | nothing | end card, then stops |

## Canvas

| Preset | Size | Layout |
|---|---|---|
| none | the frame alone | preview, in-app, web embed |
| square | 1080×1080 · LinkedIn, Instagram feed | phone left or right with text beside it, or centred with text above and below |
| portrait | 1080×1350 · Instagram portrait | as square |
| story | 1080×1920 · Reels, Stories, TikTok, Shorts | logo and headline above the phone, line, CTA and tags below; top 250px and bottom 320px stay clear |
| landscape | 1920×1080 · YouTube, website | phone left or right, text beside it |

The phone takes the room the slots leave. Toggle a slot off and the phone grows.

## Check

One contact sheet, one image, every beat and the end card:

```bash
node scripts/sheet.mjs intro.html sheet.png            # light
node scripts/sheet.mjs intro.html sheet.png --theme dark
```

Look at it once. Fix what it shows. Rerun only if something was wrong.

## Publish

Preview as an artifact with the player files alongside: `files: {"player.css": "<skill>/player/player.css", "player.js": "<skill>/player/player.js"}`. For a local open or the recorder, copy or symlink the two files next to the intro.
