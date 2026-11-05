# Recording to video or GIF

Needs Node, Playwright's Chromium and ffmpeg. Check, install only what is missing:

```bash
which ffmpeg || brew install ffmpeg          # or: npm i ffmpeg-static, then use node_modules/ffmpeg-static/ffmpeg
npx playwright --version >/dev/null 2>&1 || (npm i playwright && npx playwright install chromium)
```

Record what the preview shows. Only when the user has not set them, use these defaults and say them:
- **Canvas:** story 1080×1920, square 1080×1080, landscape 1920×1080, and where the phone sits: centre, left, right. Which slots show.
- **Theme:** light, dark, or both (two files).
- **Captions:** off (default for video), or on with the user's words. `below` the frame for a floating-phone post.

Record. The page runs in record mode: no controls, plays once, ends on the end card.

```bash
node scripts/record.mjs intro.html out.webm --canvas square --phone right --theme dark --captions off
# or a bare frame at any size: --width 1080 --height 1920
```

Convert:

```bash
# MP4 for LinkedIn, Instagram, App Store
ffmpeg -y -i out.webm -c:v libx264 -pix_fmt yuv420p -movflags +faststart out.mp4

# GIF, two passes for a clean palette, 15 fps, 720 wide
ffmpeg -y -i out.webm -vf "fps=15,scale=720:-1:flags=lanczos,palettegen" palette.png
ffmpeg -y -i out.webm -i palette.png -lavfi "fps=15,scale=720:-1:flags=lanczos[x];[x][1:v]paletteuse" out.gif
```

Launch intro, WhatsApp style: add a first beat where the app's logo scales in on an empty screen and a last beat that fades to one line. Narration or music: `ffmpeg -i out.mp4 -i voice.mp3 -shortest -c:v copy out2.mp4`.

Without Node: the user still gets the preview, the beats, the still, the carousel and the text post. Say that GIF and video need Node, and that the artifact can be screen-recorded.

Tell the user the file path. Never post it anywhere.
