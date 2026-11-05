# Recording to video or GIF

## With Node, pixel-perfect

Headless Chromium draws the intro and ffmpeg encodes it, the same way Remotion and HyperFrames render. Everything comes from npm; nothing else to install. Once, in the skill's folder (the base directory given when the skill is invoked):

```bash
npm install          # Playwright, its Chromium, and ffmpeg
```

Record what the preview shows. Only when the user has not set them, use these defaults and say them:
- **Canvas:** story 1080×1920, square 1080×1080, landscape 1920×1080, and where the phone sits: centre, left, right. Which slots show.
- **Theme:** light, dark, or both (two files).
- **Captions:** off (default for video), or on with the user's words. `below` the frame for a floating-phone post.

```bash
node <skill>/scripts/record.mjs intro.html out.webm --canvas square --phone right --theme dark --captions off
node <skill>/scripts/convert.mjs out.webm out.mp4            # MP4 for LinkedIn, Instagram, App Store
node <skill>/scripts/convert.mjs out.webm out.gif --width 720  # GIF, 15 fps, clean palette
# a bare frame at any size: --width 1080 --height 1920

# one PNG per beat plus the end card, and the same as a PDF of slides
node <skill>/scripts/frames.mjs intro.html out/ --canvas square --phone right --captions off --pdf out/slides.pdf
```

Frames are stills at the end of each beat, after the cause and the effect; `--at 0.5` takes them mid-beat. Slides are those frames as pages, one per beat and the end card last, the shape LinkedIn document posts and carousels want.

The intro file needs `player.css` and `player.js` next to it: copy or symlink them from `<skill>/player/`.

Launch intro, WhatsApp style: add a first beat where the app's logo scales in on an empty screen and a last beat that fades to one line. Narration or music: `ffmpeg -i out.mp4 -i voice.mp3 -shortest -c:v copy out2.mp4` with the ffmpeg at `node -p "require('ffmpeg-static')"`.

Without Node (claude.ai): the user still gets the preview, the beats, the text post and the carousel copy. Say that MP4, GIF, frames and slides need Claude Code.

Tell the user the file path. Never post it anywhere.
