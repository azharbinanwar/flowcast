# Changelog

## Unreleased

- `check.mjs`: a layout check in words, every beat with captions on and off, for parts cut off, text that does not fit, and bottom bars placed from the top. Most checks now need no image.
- Contact sheet renders in record mode at full size and comes out as one small image; it no longer goes blank or blurry with the drawer.
- Skill: bottom parts anchor to the bottom; checks in words before pictures; never print the skill, never write inside it, screenshots read small.
- Projects: one list of your projects in `~/.flowcast/projects.json`, one studio for all of them; each intro opens at `/<project>/<intro>/` and older links redirect. Making an intro in a new project adds it to the running studio.
- History: grouped by project, with the size, running time and exported formats on each card, a live preview on hover, and search and sort across every project.
- Breadcrumb in the studio: `Flowcast / project / intro`, replacing the logo and History pill.
- Studio drawer: every option in a panel on the right with sections that open and close, an icon each, and a reset in each header that shows only when something changed.
- Timing: a speed for the whole intro and seconds per beat; a beat's animation speeds up or slows down to fit its time. Saved, and used by every export.
- Colours: every colour token, light and dark side by side, grouped by product or part through the intro's `palette`; reset per colour, group or all. Saved and exported.
- Export: pick a format, then Export; the label shows seconds for video and GIF, image or page count for frames and slides.
- Playback: replay, a play/pause pill with previous and next, and full screen; the current beat and progress animate between beats.
- Sample: Flowcast explaining itself, at the top of the README.
- History: every intro lives in its own `flowcast/<name>/` folder with its settings and exports; one studio serves them all, with a History page of covers. `/flowcast` alone or `/flowcast-history` reopens it, starting the studio when needed.
- Player: a beat's steps stop by themselves when another beat starts; a Mac pointer actor with `data-actor="pointer"`; the scripts link the player next to an intro themselves.
- Skill: tightened, with the build location, screenshots first, one icon family, end card on the app's surface, and a cheaper check after a fix.
- Studio opens on a splash with the Flowcast mark, and shows the mark top left.
- On wider or taller canvases, the scene or device can sit left, centre or right, with the headline, line and CTA beside it as one block.
- A full-canvas scene fills a canvas of its own shape edge to edge.
- Dark theme: brand and status colours get their own dark values; phone-like surfaces are lifted with an edge.
- Slots always show real words from the intro, toggles only appear when there is something to show, and a refresh keeps every choice.
- Export shows the running time in its label; the saved file is one button that opens its folder; frames are numbered `flowcast-1.png` onward with the end card last.
- Skill: one person, one surface; messages arrive the way people receive them; real product UI patterns and marks.
- MIT license, contributing guide, sample intro, test suite with CI, issue templates, plugin icon.

## 1.0.0 · 2026-11-06

First release.

- `/flowcast` skill: designs the scene from a feature in your code or a story you paste, writes the beats, and builds a playable intro on a shared player.
- Studio: a local preview with canvas sizes, theme, captions, slots, scene or device position, and one Export menu.
- Exports: MP4, GIF, PNG frames and PDF slides, recorded frame by frame with headless Chromium and ffmpeg, at exactly the canvas size.
- Canvas sizes with their platforms: 1080×1080, 1080×1350, 1080×1920 with safe zones, 1920×1080.
- Light and dark themes, real product marks and UI patterns, every choice saved and reused on export.
