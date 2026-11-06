# Recording to video or GIF

## The studio

```bash
node <skill>/scripts/studio.mjs flowcast --port 7788   # History at /, each intro at /<feature>/
```

Start it in the background only if `curl -s localhost:7788/__ping` gets no answer, then open the URL. The preview has an Export button with a format pick: MP4 video, GIF, PNG frames, PDF slides. A click runs the scripts below with the page's current settings and writes `flowcast-<project>.<ext>` into the intro's own `exports/` folder, where project is the page's title. The file name then shows as one button next to Export; clicking it opens the folder.

## With Node, pixel-perfect

Headless Chromium draws the intro and ffmpeg encodes it, the same way Remotion and HyperFrames render. Everything comes from npm; nothing else to install. Once, in the skill's folder (the base directory given when the skill is invoked):

```bash
npm install          # Playwright, its Chromium, and ffmpeg
```

The studio saves what the user set on the page to `<intro>.state.json`, and every script reads it: canvas, phone, theme, captions, slots and the words they typed. Flags override it. Only when nothing was set, use these defaults and say them:
- **Canvas, one list, a size and where it is posted:**
  | preset | size | posted on | longest clip |
  |---|---|---|---|
  | square | 1080×1080 | LinkedIn, Instagram feed | 10 min |
  | portrait | 1080×1350 | Instagram portrait | 60 s |
  | story | 1080×1920 | Reels, Stories, TikTok, Shorts | 90 s, top 250px and bottom 320px kept clear of text |
  | landscape | 1920×1080 | YouTube, website | any |
  The preview shows the same list and warns when the total runs past the limit. Where the phone sits: centre, left, right. Which slots show.
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

The scripts link `player.css` and `player.js` next to the intro themselves when they are missing.

Launch intro, WhatsApp style: add a first beat where the app's logo scales in on an empty screen and a last beat that fades to one line. Narration or music: `ffmpeg -i out.mp4 -i voice.mp3 -shortest -c:v copy out2.mp4` with the ffmpeg at `node -p "require('ffmpeg-static')"`.

Without Node (claude.ai): the user still gets the preview, the beats, the text post and the carousel copy. Say that MP4, GIF, frames and slides need Claude Code.

Tell the user the file path. Never post it anywhere.
