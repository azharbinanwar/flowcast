# Changelog

## Unreleased

- The MP4 size under Export shows as ~, measured on real exports: a 1:45 desktop intro shows 4, 5 and 12 MB for Standard, High and Max, against 3.8, 4.8 and 11.7 MB made. It had said about 2, 3 and 9.
- Fixed: MP4 at Max came out at the normal size, only at 60 fps. Chrome's screencast ignores pixel density, so Max now draws the whole page at twice the size instead: 2160×2160 for a square, 2560×1600 for a 1280×800 desktop, and visibly sharper text. A test checks it.
- `check.mjs` takes each beat's finished picture, the way PNG export does, with captions on and off side by side, instead of playing the whole intro twice: a 17-beat intro went from 3 minutes 9 seconds to under 4 seconds. `--only 3,4` checks just the beats a change touched, and the editor uses it.
- Fixed: in a dark theme the Made with Flowcast tag sank into a dark screen, and the credit outro could show light words on a white slide. The tag is now a light glass on dark, and the outro a dark slide with light words.
- Timeline: it grows with the number of beats, about 78px a beat up to the room there is, instead of squeezing many beats into 640px. A bar too narrow for its seconds shows its number alone, with the seconds in its tooltip.
- Caption style: under Look → Captions, a background, a text colour and how see-through the background is, kept for light and dark on their own like the Colours, for every place captions sit, and used by every export.
- Fixed: in a dark theme the Over caption showed as a pale slab when the intro kept a light screen colour. It is now a dark glass with light words.
- Fixed: the colour picker's swatches, colour square, hue bar and hex field ran past its right edge. They fit inside it now.

## 2.3.0 · 2026-11-11

Edit an intro yourself in the studio, a timeline for timing, floating captions, and Select to hand Claude the exact part to change.

- Timeline: the beat dots under the studio's preview are now a timeline, each beat as wide as its time with its number and seconds on it. Drag a beat's right edge to make it longer or shorter, in tenths of a second; it replays the beat at its new length and saves, the same as the seconds in Timing.
- Edit without Claude: Select now opens on an Edit tab. Change a part's words, size, width, height, corners, padding, fill or text colour, and it changes as you type; Save keeps it, Cancel puts it back. Words change wherever they show, even when a step types them in later. Every edit is saved with the intro, used by every export, and listed under Your edits in the drawer, each with its own undo. The intro file itself is never touched, so no tokens are spent.
- Select's Edit tab in sections: Text size, Size (width and height), Corners and Padding, each corner and side on its own with All or Each. The note has a grip bar on top and drags by it or its head; dropped, it opens there for every pick after; a click outside never closes it, and picking another part keeps what was changed.
- Pictures: corners set on a logo's frame round the picture inside it, a Circle button makes it round, and a picture follows its frame's size. An SVG, or a frame holding one, gets a Colour that reaches every shape, whether it is filled, outlined or drawn in its text colour. A PNG or JPG cannot be recoloured, so it shows no colour.
- Edit shows only what fits what was picked: a picture or logo takes size and corners, an icon its size and colour, plain words their text, size and colour, and a box or button all of it.
- Select reaches the canvas words too: the headline, line, call to action, tags and logo around the device take the same size, corners, padding and colours. Their words are still typed on the canvas itself.
- The studio's own colour picker, in Select and the Colours panel, in place of the system one: the intro's own colours first, then a colour area, hue and hex.
- Edited words win over Privacy, so an email you retype shows as you wrote it with Hide personal details on, and a step that types the old words types yours instead. Select's note is drawn in the studio's own look: the same tabs, fields with px, colour swatches like the Colours panel, and a soft open.
- Select: a pointer button beside the transport. Point at any part of the scene; for anything Edit cannot do, the Ask Claude tab takes what should change and Copy for Claude copies one line naming the intro, the beat and the exact element, with what you typed or, left empty, ending where you type it in Claude Code; the button turns to Copied in place. ↑ widens the pick to what holds it, for words inside a card or a button drawn as a box. Pasted into Claude Code, it goes straight to an editor, which finds the element by its id or class without reading the map.
- Captions can float: a fourth place, Over, puts each beat's caption in a pill near the foot of the scene, popping in with the beat and taking no room from it. Look now picks Off, Inside, Below or Over, the choice comes back after a refresh, and every export uses it.
- Fixed: exports with captions asked for (`--captions inside`, `below` or `over`) left them hidden when the intro itself had them off.

## 2.2.0 · 2026-11-10

Cheaper changes after the first build, app intros as a feature tour, and spacing in the export settings.

- Skill: an intro of a whole app can be a tour, one beat per main feature taken from the app's own navigation. "Full app", "all features" or "overview" makes a tour; an app intro asked without saying how shows a tour and one story side by side to pick from. The earlier intro lends its look, never its story.
- Skill: every change after the first build goes to a new, small editor sub-agent with its own guide, `edit.md`, instead of back to the builder, whose memory grew with every change. Several changes in one message are one editor run.
- `map.mjs`: where everything in an intro is, by line (style, scene markup and its ids, canvas words, timings, each beat and its steps), so a change reads only the lines it needs.
- `frames.mjs --only <slide>`: one picture of the beat that changed, instead of a contact sheet. With `--at 0.3` it plays the beat and catches it at that point, for what shows only mid-beat; `--at` had been ignored since slides became each beat's resting picture.
- Fixed: the export settings had no space between them, so a label sat on the row above it. Each setting now keeps 14px from the next, and the label, choices and hint 6px from each other.
- Skill: sub-agents run in the foreground by default; "in the background" or "here" in the request changes that.

## 2.1.0 · 2026-11-09

Export settings for every format, sharper video and pictures, PDFs with real text, and the Flowcast mark without its box.

- Export settings for each format, under its tile: MP4 quality (Standard, High, Max), GIF width and frame rate, PNG sharpness (1×, 2×, 3×), and PDF as pictures or real text. Each shows the size it will make, and is saved with the intro.
- Sharper video: Chrome's own frames, near lossless, encoded once with x264 instead of a 1 Mbit/s browser recording converted again. Max records at 60 fps, up to 4K on the long side.
- PNG and PDF export at 2× by default, so they stay sharp after social sites shrink them.
- PDF with real text: each slide printed straight from the intro, so text can be selected and stays sharp at any zoom. Soft shadows print as a thin outline, since Chrome's PDF printer cannot draw them.
- The Flowcast mark stands on its own in the outro, the credit tag, the splash and the browser tab: coral beats with a white play, no tile. The app bars in History and the studio keep the coral tile, like an app icon. The mark has two colours, `--fc-mark` and `--fc-on-mark`, and the animated one comes in the same pair (`motion.svg#mark`, coral on white, and `#bare`, white on coral).
- Fixed: in the outro animation the fanned-out beats ran past the tile's edge and looked cut off. They now fan inside it.
- `record.mjs` writes MP4 directly (`--quality`), `convert.mjs` takes `--fps` and `--crf`, `frames.mjs` takes `--scale` and `--pdf-text`.

## 2.0.1 · 2026-11-09

Fixes for the credit outro and for exports with No canvas, plus a GitHub link in the studio.

- A GitHub link to the Flowcast repo at the top right of History and the studio.
- Fixed: with Credit set to Outro slide, intros in a browser or phone frame still showed the watermark chip on every slide.
- Fixed: the credit chip's logo and text line up when the repo link is off.
- Fixed: exports with No canvas picked used the intro's own default canvas instead, so the size changed.
- With No canvas, exports are the browser or phone itself, edge to edge, with no band of background around it.

## 2.0.0 · 2026-11-07

A new studio for every project, History, the drawer, Privacy, Credit and a plan before every build. Intros made with 1.0.0 still open; studio addresses now include the project (`/<project>/<intro>/`).

- Fixed: the Outro slide / Watermark tabs in the drawer were cut off on the right.
- Fixed: converting to MP4 failed on Linux after the loading cut was added, and the GIF lost its colours; the cut now happens after the recording is read, and inside the filter for GIFs.
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
