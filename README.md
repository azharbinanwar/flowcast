# Flowcast

A Claude skill that turns a feature or a story into something people watch: an in-app intro, a social post, a GIF or a video. The product acts itself out. Show, don't tell.

## Install

```bash
npx skills add azharbinanwar/flowcast
```

Works in Claude Code and any Agent Skills-compatible agent. For claude.ai, upload the `skills/flowcast` folder as a skill.

## Use

```
/flowcast prayer alarm            # a feature in the project you are in
/flowcast <paste a story>          # no project needed
```

You get the beats and a playable preview. Switch canvas, theme and captions in the preview's toolbar, then ask for what you want: video, GIF, image, post, carousel, web embed, in-app.

## Video

Pixel-perfect MP4 and GIF come from headless Chromium and ffmpeg, both installed by npm. Once, in the skill folder:

```bash
npm install
```

Then ask for what you want and Claude makes it: MP4, GIF, PNG frames, or a PDF of slides. No brew, no ffmpeg on your PATH. In claude.ai, where there is no Node, you get the preview, the beats and the post text.

## Layout

- `skills/flowcast/SKILL.md` — how Claude thinks: who it is for, designing the scene from the story, beats, defaults, outputs.
- `skills/flowcast/stage.md` — the intro file contract on the shared player.
- `skills/flowcast/player/` — the shared player: frames, canvas presets, modes, toolbar.
- `skills/flowcast/scripts/` — contact sheet, recorder, converter.
- `skills/flowcast/record.md` — recording and converting.
