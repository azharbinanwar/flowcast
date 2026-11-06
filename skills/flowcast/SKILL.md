---
name: flowcast
description: Use when asked to explain, show, demo, announce or promote a feature or product as an intro, walkthrough, onboarding, explainer, launch video, GIF, carousel, social post, image or web embed, whether the source is a codebase, a typed story, a screenshot, a workflow, a changelog or a support ticket. Also use when the user types /flowcast or writes "flowcast:".
---

# Flowcast

Show, don't tell. A stranger looks at the result and understands how the thing works in a few seconds, and wants it. If they have to read to get it, it failed.

The product acts itself out. A feature becomes 3 to 5 beats, each one "who, does what, gets what", played on a scene built from the product's own parts, colours and logo. Those beats are the single source for every output: lock them first, then make as many outputs as asked.

## Flow

With nothing after `/flowcast`, open History instead: do exactly what the `flowcast-history` skill says.

0. **Who is it for.** A feature intro speaks to the app's user. A workflow or service post speaks to the client who buys it: their team, their inbox, their hours saved. Name that person in one line and write every beat from their side.
1. **Source, with a budget.** From a project: if it has screenshots, look at one or two first, since they show the real UI faster than code. Then read the one view file per screen in the flow, the theme or colour file, and the strings; find the logo. Skip models, blocs, repositories and services. Five to eight reads in total. Grep for a label instead of reading a file to find it. From a typed story, screenshot, workflow or ticket: take it as given. Say in one line what platform you found and which frame that means.
2. **Design the scene, before any code.** Never ask for a reference and never reproduce one. Decide:
   - **Cast.** Who starts it, what does the work, who gets the result, named the way the audience names them: a store owner says "the courier", not "HTTP Request node".
   - **Surfaces.** What each person actually sees, a chat, an inbox, a screen, showing only what that person would see on it. Never put the work inside a surface that would not show it. No app? Invent a realistic surface. When the product is not an app, the device shows only what its user sees and the work happens beside it, on the canvas.
   - **One person, one surface.** Several customers each get their own surface, never a shared inbox, each at a different stage of the same workflow so the whole ladder shows at once. The owner sees their own side: the source list and a periodic summary.
   - **How it arrives.** A reminder lands as a notification on the person's lock screen, newest on top, earlier ones from the same app stacked as slimmer cards peeking underneath, each with its real age. Open a full inbox or thread only when reading it is the point.
   - **The work.** The things in the middle become visible objects in the shape the story is: a chain is a row, one brain asking several systems is a hub with spokes, a sort is a fork, time is a rail.
   - **Enter and leave.** On the canvas, an object stays only while it matters, then shrinks to a chip or leaves, and the next thing takes its room. Inside a device, history stays.
   - **Motion.** Each beat is one movement the eye can follow, cause then effect: a line lights, a dot travels, a chip lands with the real value.
   - **The proof and the climax.** One number or moment the audience would repeat to a colleague, with its own beat. Build toward the step where the story turns.
   - **Words.** A short headline per beat, key words emphasised. Nothing the picture already shows.
   When the story is a flow rather than one app screen, the whole canvas is the scene: `data-frame="none"` at the canvas size, captions off, the headline drawn in the scene.
3. **Beats.** Write them in the format below with each beat's seconds and the total, and show them.
4. **Defaults, not questions.** Pick canvas, frame, theme and captions from the output the user named and from the story's world, and state them in one line. Every one is a switch in the studio. Ask only when nothing points either way.
5. **Build.** Write the intro to `flowcast/<feature>/intro.html` in the folder Claude Code is working in, never inside the skill. Follow `stage.md`. Check it with one contact sheet as `stage.md` says. Then open it in the studio: if `curl -s localhost:7788/__ping` answers, the studio already runs, otherwise start `node <skill>/scripts/studio.mjs flowcast --port 7788` in the background; open `http://localhost:7788/<feature>/`. A claude.ai artifact only when the user wants a link to share; in claude.ai, the artifact is the preview.
6. **Output.** Exports come from the studio's Export menu, or from the scripts when asked in words; either way they use what the user set on the page. Say what was made, where, the running time, and in one line what else the same beats can become.

"Change beat 2", "slower", "add a tap", "no captions": edit the intro, confirm with one frame of the beat you changed, and tell the user to refresh. Never change the app's code or post anywhere unless that exact thing was asked.

## Beat format

```
1. Title (3 to 6 words)          · 2.5s
   Stage: what changes, cause then effect. e.g. finger taps Fajr → row selects, others collapse.
Total 15.2s + 2s end card
```

One actor throughout: the finger on a phone, the pointer on a Mac, a lit key, a typing cursor. Leave room in a beat for every step it holds: a pointer move takes about 0.6s, a click 0.15s, a short hop 0.25s.

## Defaults by output

| Output | Frame | Canvas | Captions | End card |
|---|---|---|---|---|
| App intro, in-app | none | none | inside | none, the last button does the real thing |
| Preview | by platform | none | inside | yes |
| Reels, Stories, TikTok, Shorts | phone | 1080×1920, centred, headline above, line and CTA below | off | logo and one line |
| LinkedIn, Instagram feed | phone | 1080×1080, device right, text beside it | off | logo and one line |
| Instagram portrait | phone | 1080×1350, device right | off | logo and one line |
| YouTube, website video | by platform | 1920×1080, scene or device left or right, text beside it | off | logo and one line |
| Web demo, embed | browser | none | below | yes, then loops |
| Carousel, still | by platform | square or story, one beat per page | the beat's words | last page |

The canvas is the exported picture. Slots around the scene carry the user's words: logo, headline, line, CTA, tags. Fill them in the intro's `canvas` object from the beats and the project.

## Look

- **From a project:** its colour tokens for light and dark, font, radius, real components, labels, and its logo, swapped to `currentColor` when it is an SVG.
- **Real products keep their identity:** colours, UI patterns and marks. WhatsApp green with full-width quick replies under the message, Slack's four-colour mark, Gmail's M, Stripe's wordmark, n8n's coral. Draw the real mark, never a stand-in.
- **One icon family:** the project's own icons when they can be drawn on the web, otherwise Lucide, which maps closely to SF Symbols and Material. The icon that matches what the app shows, inline SVG, one stroke width. Never a Unicode symbol or emoji in its place.
- **Both themes:** every brand and status colour gets its own dark value, not the light one reused. Surfaces dark in both themes get a lifted shade and a hairline edge in dark. Dimmed states match across themes.
- **End card:** the app's surface colour with the logo as it is, plus one line and the call to action. Not a full-screen brand colour with the logo on top of it.
- **No gradients** unless the app uses them. **Avatars** are initials on a light tint of the accent. Invent colours only for things that have none, in one palette.

## Outputs

| Ask | What is made |
|---|---|
| Beats, storyboard | The beat list only. |
| Preview, intro, animation | The intro, open in the studio. |
| Text post | The beats as a caption for the platform: hook first, hashtags, first comment. |
| Frames, still | One PNG per beat plus the end card, with `scripts/frames.mjs`. |
| Carousel, slides | The frames as a PDF, with `scripts/frames.mjs --pdf`. |
| Video, GIF, reel | `scripts/record.mjs`, then `scripts/convert.mjs`. See `record.md`. |
| Web embed | The intro and the player files, mode `embed`, and an iframe line. |
| In-app | The approved intro rewritten in the app's own stack and components. Only when asked. |
| Anything else | Made from the same beats. |

## Keeping it cheap

- Explore within the budget in step 1.
- An intro file is tokens, scene, beats, steps and canvas words. The player does the rest: never copy its code, never hand-write an actor, a beat guard or a toolbar.
- One contact sheet. After a fix, one cropped frame of that beat, never a new sheet. The other theme only when colours changed.
- One studio serves every intro on port 7788. Reuse it when it answers; never start a second one.
- Small edits in place, not rewrites.

## Common mistakes

- Telling with lists, counters and labels instead of showing it happen.
- The work squeezed into a device that would never show it, or the tool's own editor for an audience that never opens it.
- Copying a design the user showed instead of learning what made it work.
- Slides with pictures instead of one scene whose parts become the next step.
- A row wider than the screen: use grids with `minmax(0,1fr)`.
- Captions that hide but keep their space. Off means gone.
- A beat whose steps run longer than the beat, so its climax never shows.
- Asking questions before building, or writing into the user's code when they asked for a preview or a post.
