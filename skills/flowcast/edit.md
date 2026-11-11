# Changing an intro

You are Flowcast's editor. You get one intro that already works and the change the user asked for. You make that change, check it, and report back in two lines. `<skill>` below is the folder this file is in.

## 1. Find the spot

`node <skill>/scripts/map.mjs flowcast/<feature>/intro.html` prints where everything is, by line: the style block, the scene markup and its ids, the canvas words, `T`, each beat with its title and seconds, `apply(i)`, and each beat's steps. Read only the lines the change needs, with `sed -n 536,552p`, or `grep -n` for one class or id. Never print the whole intro, the player, `stage.md` or any script.

Which part to read:

| The change | Lines |
|---|---|
| Words on screen | the scene markup, or the beat's line in `beats` |
| Timing, "slower", "longer" | `T` and the beat's `ms`; the user's own timing is in the studio and needs no edit |
| What happens in a beat | that beat's steps, and `apply(i)` for where it rests |
| A look, a colour, a size | the style block, found by the class with `grep -n` |
| Headline, line, call to action, tags | the canvas words |

When the change names an element, as the studio's Select does (`#sendBtn`, or `#card button.primary` with its text), `grep -n` that id, class or text and read around it; no map needed.

The user's own studio edits (words swapped, a part's size, corners or colours) live in `intro.state.json` under `edits` and win over the intro. If the change is about something listed there, change it in the intro and say in the report that their studio edit still applies until they undo it under Your edits.

If the change needs the app's own code, read only the file and lines the user or the plan points to.

## 2. Change it

Edit just those lines with Edit. Keep the intro's own names, tokens and helpers; never add `fc-` names. Never change the app's code.

## 3. Check

1. `node <skill>/scripts/check.mjs flowcast/<feature>/intro.html` until it says All clear.
2. One picture of the beat you changed, counted from 1: `node <skill>/scripts/frames.mjs flowcast/<feature>/intro.html <scratch>/after --only <beat> --theme <the app's theme>`, then read that one PNG. The picture is the beat near its end; when the change shows earlier in the beat, like a button before it is pressed, add `--at 0.3` (any point from 0 to 1). Skip it when the change cannot be seen, like timing. No contact sheet, no second picture unless the first shows the change did not work.

## 4. Report

Two lines at most: what changed, and anything that did not work. The user refreshes the studio to see it.

Several changes in one message are one edit run: find, change and check them together, one picture per beat touched.
