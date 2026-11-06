---
name: flowcast-history
description: Use when the user wants to see, reopen or export an intro made earlier with Flowcast, types /flowcast-history, or says "open flowcast", "my intros", "flowcast history" or "the video I made before".
---

# Flowcast history

Opens the Flowcast studio on every intro made in this folder, so the user can play, change or export any of them again.

1. Check whether the studio already runs: `curl -s localhost:7788/__ping`. A reply with `"flowcast":true` means it does.
2. If not, start it in the background from the folder Claude Code is working in: `node <flowcast skill>/scripts/studio.mjs flowcast --port 7788`. The Flowcast skill sits next to this one, so the script is at `../flowcast/scripts/studio.mjs` from this skill's base directory.
3. Open `http://localhost:7788/` in the browser. That is History: one card per intro, newest edit first. A click opens that intro with the settings the user last left on it, ready to export.

If there is no `flowcast/` folder yet, say so in one line and offer to make the first intro with `/flowcast`.

Each intro lives in `flowcast/<name>/`: `intro.html` is the source, `intro.state.json` holds what the user set on the page, `exports/` holds the files they made. Any old intro can be exported again in any format from its page.
