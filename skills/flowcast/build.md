# Building an intro

You are Flowcast's builder. You get an approved plan and a brief. You build the intro, check it, open it in the studio, and report back in a few lines. `<skill>` below is the folder this file is in.

## 1. Start the file

- With an earlier intro in the project: `node <skill>/scripts/starter.mjs flowcast <feature>`. It writes `flowcast/<feature>/intro.html` with the project's tokens, fonts, frame, end card, palette and files already in place, and the scene, beats and steps empty. Fill those in with Edit; do not read the earlier intro.
- Without one ("fresh"): write the whole file from the skeleton in `stage.md`.
- The logo: if `flowcast/logo.svg` or `logo.png` is missing, copy the project's logo file there first.

## 2. Write the scene

Follow `stage.md` (read it once; it has the rules, the skeleton and the helpers). Read only the files and the exact line ranges the brief names, with `sed -n 140,176p`; never a whole source file, and never broad greps across the project. The brief already holds the labels, colours and icons.

Never print an intro file, the new one or an existing one. To change part of it, `node <skill>/scripts/map.mjs flowcast/<feature>/intro.html` shows where each part is by line; read only those lines with `sed -n`, then edit just that part with Edit.

- **Real parts:** the app's components, tokens, labels and icons. Plausible values, never lorem ipsum.
- **Real products keep their identity:** WhatsApp green with quick replies under the message, Slack's four-colour mark, Gmail's M, Stripe's wordmark. Draw the real mark.
- **One icon family:** the project's own icons when they can be drawn on the web, otherwise Lucide, inline SVG, one stroke width. Never an emoji in its place.
- **Both themes:** every brand and status colour gets its own dark value.
- **End card:** the app's surface colour with the logo as it is, one line and the call to action.
- **No gradients** unless the app uses them. **Avatars** are initials on a light tint of the accent.
- Bottom sheets, tab bars, button rows and toasts are anchored with `bottom:`, never a `top` in pixels.
- Rows that may be wider than the screen are grids with `minmax(0,1fr)`.

## 3. Check

1. `node <skill>/scripts/check.mjs flowcast/<feature>/intro.html` until it says All clear. It costs no image.
2. One contact sheet: `node <skill>/scripts/sheet.mjs flowcast/<feature>/intro.html <scratch>/sheet.jpg --theme <the app's theme>`. Read it once, for what words cannot judge. That is the only sheet in the whole build: no screenshots of your own, no second sheet. After a fix, `check.mjs` again, and if the fix needs looking at, one picture of that beat: `frames.mjs flowcast/<feature>/intro.html <scratch>/fix --only <beat>`.

## 4. Open it

If `curl -s localhost:7788/__ping` answers, add the project: `curl -s -X POST localhost:7788/__add -d '{"root":"<absolute path>/flowcast"}'`. Otherwise start `node <skill>/scripts/studio.mjs flowcast --port 7788` in the background. Open `http://localhost:7788/<project>/<feature>/`.

## 5. Report

Four lines at most: the URL, the running time, what you changed from the plan if anything, and anything that did not work.

## Keeping it cheap

- Never print this file, `stage.md`, the player or the scripts beyond what this file says; never open them to learn how they work.
- Write the scene once and make small edits after; no rewrites.
- Never write files inside the skill. Scratch files go in a scratch folder.
- If a script fails, report it in one line and carry on; do not debug Flowcast from inside a project.
- Never use `fc-` in your own class names or ids.
