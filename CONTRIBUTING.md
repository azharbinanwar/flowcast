# Contributing

Thanks for helping. Flowcast is a skill, a shared player and a few scripts, so most changes land in one of three places.

## Where things live

| Change | File |
|---|---|
| How Claude designs an intro: beats, scenes, defaults, rules | `skills/flowcast/SKILL.md` |
| The intro file contract and layout rules | `skills/flowcast/stage.md` |
| Recording and converting | `skills/flowcast/record.md` |
| Frames, canvas sizes, toolbar, modes | `skills/flowcast/player/` |
| Studio, recorder, converter, frames, contact sheet | `skills/flowcast/scripts/` |

## Set up

```bash
git clone https://github.com/azharbinanwar/flowcast
cd flowcast/skills/flowcast
npm install
npm test                 # fast checks
npm test -- --video      # also records and converts a video
```

Try a change on the sample intro in the studio:

```bash
node scripts/studio.mjs examples/sample.html
```

## Rules for a good change

- **Show, don't tell.** If a change makes intros explain themselves in text instead of on screen, it is the wrong change.
- **The player stays generic.** Nothing in `player/` knows about one intro. Its classes and ids start with `fc-`.
- **What you see is what you export.** Any change to the studio must keep exports pixel for pixel equal to the canvas. The tests check the edges.
- **Both themes.** Check light and dark before sending.
- **Rules, not patches.** When an intro looks wrong, fix the rule in `SKILL.md` or `stage.md` that let it happen, not just the one file.

## Sending a change

1. Branch from `main`.
2. Keep the change to one thing.
3. Run `npm test -- --video`.
4. Open a pull request with a before and after screenshot or a short clip.

## Releases

Versions follow semver. Bump `version` in `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` and `skills/flowcast/package.json`, add a section to `CHANGELOG.md`, then tag `vX.Y.Z`.
