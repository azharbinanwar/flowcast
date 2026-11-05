# Flowcast

A Claude skill that turns a feature or a story into something people watch: an in-app intro, a social post, a GIF or a video. The product acts itself out. Show, don't tell.

## Install

Claude Code:

```bash
git clone https://github.com/azharbinanwar/flowcast
ln -s "$PWD/flowcast/skills/flowcast" ~/.claude/skills/flowcast
```

claude.ai: upload the `skills/flowcast` folder as a skill.

## Use

```
/flowcast prayer alarm                         # a feature in the project you are in
/flowcast <paste a story>                       # no project needed
```

You get the beats and a playable preview. Switch canvas, theme and captions in the preview's toolbar, then ask for what you want: video, GIF, image, post, carousel, web embed, in-app.

Video with no install: press **Download page** on the preview, open the file in Chrome, press **Export video**. For ffmpeg-grade output and GIFs, the Node recorder:

```bash
npm install && npx playwright install chromium
brew install ffmpeg
```

## Layout

- `skills/flowcast/SKILL.md` — how Claude thinks: who it is for, designing the scene from the story, beats, defaults, outputs.
- `skills/flowcast/stage.md` — the intro file contract on the shared player.
- `skills/flowcast/player/` — the shared player: frames, canvas presets, modes, toolbar.
- `skills/flowcast/scripts/` — contact sheet and recorder.
- `skills/flowcast/record.md` — recording and converting.
