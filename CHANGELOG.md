# Changelog

## Unreleased

- Fixed: Privacy took the numbers inside icon drawings for phone numbers. It now reads only text the intro shows on screen, including text its steps type in later.
- Skill: every run shows a short plan first (who it is for, the steps, look, logo, which earlier intro it starts from) and waits for Build it, Make it shorter or Change something.
- Skill: planning and building run in their own sub-agents, so a long chat is not re-read on every step; the main guide is a third of its old size, with the know-how moved into `plan.md` and `build.md`.
- Skill: the main chat reads nothing from the project; the planner hands the builder the exact labels, colours and line ranges it needs, and the builder never prints a whole file and takes one image at most.
- `starter.mjs`: a new intro starts from the project's earlier one, with its colours, fonts, frame, end card and files, so only the new scene is written.
- Fixed: with no canvas picked, the credit tag and outro sat over the phone's edge and were cut off. They now sit inside the phone's screen, the outro with its rounded corners, and the tag stacks the link under its name to fit.
- Privacy lists every email, phone number and card number it finds, each with its own switch and an editable replacement. Names are not guessed, since they look like headings and brand names. All of it is saved with the intro and used in every export. The list reads like a settings screen, and things that appear or go in the drawer slide instead of jumping.
- Privacy: Hide personal details swaps emails, phone numbers and card numbers for safe samples in the preview and every export, keeps dates, prices and other numbers, and brings the real text back when turned off.
- History: a ⋯ menu on each card, with icons, to rename, duplicate or delete an intro. Delete asks first in a dialog, then moves the intro to the Trash; anything that fails says why.
- README: a roadmap of what is coming.
- Fixed: the beat dots vanished and crept sideways in intros with their own `.done` style, such as CleanKit. Every class the player puts on the dots, finger, end card, outro, splash and Export button now starts with `fc-`, so an intro's own names can never reach them.
- The Export button shows the export itself: the animated mark and Exporting MP4 while the file is made, then Saved to exports for a moment; Open exports folder is the one place to find the file, and a failure says why under the button.
- One animated Flowcast mark, `player/motion.svg` (fold and press): it plays in the studio splash, loops on the Export button (without its tile) and on History cards while their covers load, and closes the credit outro. PNG and PDF use a still mark.
- The beat dots and the play bar stay in one place at the foot of the stage, whatever the video's size from beat to beat or canvas to canvas.
- Full screen: the controls float over the video and show while the mouse moves, then hide with the cursor after two still seconds; arrows step, Space plays or pauses, the full-screen button leaves it. A phone keeps its rounded corners, on black.
- Slides preview: picking PNG or PDF turns the preview into slides, each beat's finished picture with no motion, then the end card and the outro, stepped with the arrows, dots or beat rows and counted as 3 / 7. PNG frames, PDF slides and the contact sheet export exactly those pictures, and much faster. Timing says it only changes video and GIF.
- Open folder: on every History card that has exports, and as Open exports folder under the studio's Export button.
- Fixed: the History page's script failed to load after the logo upload was added, which stopped search, hover previews and logo drops; a test now checks the page's script.
- Exports never overwrite: each is named for the project and the minute it was made, `flowcast-<project>-2026-11-07-15-42.mp4`, with `-2` on a clash. The raw recording is removed once converted.
- Credit section, off by default: Made with Flowcast, with Flowcast's own repo link if you want it (it cannot be changed). Outro slide: a real beat after the end card, animated, in the intro's own colours, with its own seconds in Timing and a frame in PNG and PDF exports. Watermark: a small tag for the whole video in any of six spots.
- Exports start on the intro's first real frame: the recorder waits for fonts, pictures and your own words, and the page loading in front is cut, so changed text never flashes the old version.
- The studio's top bar is the same bar as History's, so moving between them never jumps.
- A project with no logo gets its app's own icon, found in the iOS icon set, the Android launcher icon or a logo file.
- Project pages: each project has its own page at `/<project>/`, and the breadcrumb's project leads there.
- One logo per project at `flowcast/logo.<ext>`, shown on History and used by every intro as `../logo.svg`; add or replace it by clicking or dropping an image on the project in History.
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
