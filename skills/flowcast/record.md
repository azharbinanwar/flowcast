# Recording to video or GIF

## From the page, no install

The preview has two buttons. **Download page** hands the viewer this intro as one self-contained HTML file (inside the artifact it uses the downloads capability, so publish with `capabilities: {downloads: true}`). **Export video** captures the browser tab, cropped to the canvas at the preset size, and saves an MP4 (WebM where the browser lacks MP4). It needs a normal browser tab: open the downloaded file in Chrome, pick the preset in the toolbar, press Export, choose this tab when asked, wait for the run to finish. Inside the artifact the button explains that, since the sandbox refuses tab capture.

Quality follows the window: the canvas is captured at the size it is shown, then scaled to the preset, so a bigger window gives a sharper file. For ffmpeg-grade output and batch runs, use the recorder below.

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
```

The intro file needs `player.css` and `player.js` next to it: copy or symlink them from `<skill>/player/`.

Launch intro, WhatsApp style: add a first beat where the app's logo scales in on an empty screen and a last beat that fades to one line. Narration or music: `ffmpeg -i out.mp4 -i voice.mp3 -shortest -c:v copy out2.mp4` with the ffmpeg at `node -p "require('ffmpeg-static')"`.

Without Node (claude.ai): the user still gets the preview, the beats, the still, the carousel, the text post, and the Download page button. Say that MP4 and GIF need Claude Code.

Tell the user the file path. Never post it anywhere.
