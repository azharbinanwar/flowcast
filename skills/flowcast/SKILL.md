---
name: flowcast
description: Use when asked to explain, show, demo, announce or promote a feature or product as an intro, walkthrough, onboarding, explainer, launch video, GIF, carousel, social post, image or web embed, whether the source is a codebase, a typed story, a screenshot, a workflow, a changelog or a support ticket. Also use when the user types /flowcast or writes "flowcast:".
---

# Flowcast

Show, don't tell. A stranger looks at the result and understands how the thing works in a few seconds, and wants it. If they have to read to get it, it failed.

The product acts itself out. A feature becomes 3 to 5 beats, each one "who, does what, gets what", played on a scene built from the product's own parts, colors and logo. That story is the single source for every output. Lock the story first, then make as many outputs as asked.

## Flow

0. **Who is it for.** The story has a buyer and an end user, and they are not always the same. A feature intro speaks to the app's user. A workflow or service post speaks to the client who buys it: their team, their inbox, their hours saved. Write the beats from that person's side, and name it in one line.
1. **Source, with a budget.** From a project: read the one page file per screen in the flow, the theme file for tokens, the strings file for labels, and find the logo SVG. Skip models, blocs, repositories, services. Five to eight reads, not twenty. From a typed story, screenshot, workflow or ticket: take it as given. No UI? Invent a realistic one: a phone chat, a notification, a dashboard. When the product is not an app, the device shows only what its user sees, and the work happens beside it: a mixed scene with an `around` part on the canvas (inbox, workflow nodes, the systems answering). Say in one line what platform you found and which frame that means.
2. **Design the scene from the story, before any code.** Never ask for a reference and never reproduce one. Work it out:
   - **Cast.** Who starts it, what does the work, who gets the result. Name each the way the audience names it, not the way the system does. A store owner says "the courier", not "HTTP Request node".
   - **Surfaces.** What the starter and the receiver actually see: a chat, an inbox, a screen. Show each surface only with what that person sees on it. Never put the work inside a surface that would not show it.
   - **The work.** The things in the middle become visible objects: cards, nodes, a hub, a lane, whatever shape the story has. A chain is a row. One brain talking to several systems is a hub with spokes. A sort is a fork. Pick the shape the story is, not a default.
   - **Motion.** Something must travel: a line that lights, a dot that moves, a chip that lands with the real value. Each beat is one movement the eye can follow. Cause, then effect.
   - **The proof.** One number or moment the audience would repeat to a colleague. Give it its own beat and its own place on the canvas.
   - **The climax.** The step where the story turns: a branch, a hand-over, a result arriving. Build toward it.
   - **Words.** A short headline per beat with the key words emphasised. No sentences that explain what the picture already shows.
   - **Brand.** If the poster has a studio or product name, it sits on the canvas quietly, and the end card carries the line and the call to action.
   When the story is a flow rather than an app screen, the whole canvas is the scene: `data-frame="none"` at the canvas size, the surfaces and the work laid out on it, captions off, the headline drawn in the scene.
3. **Beats.** Write them (format below) with each beat's seconds and the total, and show them.
4. **Set defaults, do not ask.** Pick them from the output the user named (table below) and from the story's world, and state them in one line. From a project the colors are its tokens. From a story with no project, take the accent from the product in the story (a WhatsApp chat is WhatsApp green) and say so. Everything is a toolbar switch on the preview: canvas, phone position, slots, theme, captions. The user changes what they want and exports. Ask only when nothing in the story or the output tells you which way to go.
5. **Stage.** Build the intro file on the shared player as `stage.md` says. Check it with one contact sheet. Show it as an artifact with the player files alongside, unless the user asked for the file only.
6. **Output.** Make what was picked. Then say what was made, where it is, the running time, and in one line what else the same beats can become.

"Change beat 2", "slower", "add a tap", "no captions": edit, rerun the sheet, re-show. Never change the app's code or post anywhere unless that exact thing was asked.

## Beat format

```
1. Title (3 to 6 words)          · 2.5s
   One line under the stage, from the user's side.
   Stage: what changes, cause then effect. e.g. finger taps Fajr → row selects, others collapse.
Total 15.2s + 2s end card
```

Who the user is, what they do, what they get back. No filler, no marketing words. Cause then effect in real-life order. One actor throughout: the tap finger, a lit key, a typing cursor. The total matters: the user may want to tighten pacing before exporting.

## Defaults by output

| Output | Frame | Canvas | Captions | End card |
|---|---|---|---|---|
| App intro, in-app | none | none | inside | none, last beat's button does the real thing |
| Preview | by platform | none, the user switches it in the toolbar | inside | yes |
| Story, reel | phone | story, phone centred, headline above, line and CTA below | off | logo and one line |
| LinkedIn or Instagram post | phone | square, phone right, text beside it | off | logo and one line |
| Landscape video, YouTube | by platform | landscape, phone left or right | off | logo and one line |
| Web demo, embed | browser | none | below | yes, then loops |
| Carousel, still | by platform | square or story, one beat per page | the beat's title and line as the slide text | last slide is the end card |

The canvas is the exported picture. The phone is one element on it; the slots around it are the user's content: logo from the project, headline, one line, CTA, hashtags, background as a tint of the accent, the accent itself, or plain. Write the slot words in the intro's `canvas` object from the beats and the project; the user changes them by telling you, or by typing on the preview to try.

## Theme

From a project: its color tokens for light and dark, its font, its radius, its real components, its logo SVG with fills swapped to `currentColor`. From a story: real products keep their real identity. WhatsApp is WhatsApp green with its bubbles, Shopify has its green bag, n8n its coral. Invent colors only for things that have none, and keep them to one palette. When the user wants the design first or names a product, be realistic over imaginative: the composition is where the imagination goes. No gradients unless the app uses them. Avatars are initials on a light tint of the accent.

## Outputs

| Ask | What is made |
|---|---|
| Beats, plan, storyboard | The beat list only. No stage. |
| Preview, intro, animation | The intro file as an artifact. |
| Text post | The beats as a caption for the platform, hook first, hashtags, first comment. No stage. |
| Image, still | One beat frozen from the sheet, or a designed graphic, at the canvas size. |
| Carousel | One beat per page, hook on page one, end card last. PDF for LinkedIn. |
| GIF, video, reel, launch intro | The intro recorded. See `record.md`. Launch intro: logo scales in first, one line last. |
| Web embed | The intro file plus the player files, mode `embed`, and the one-line iframe snippet. Place it in the site only if asked. |
| In-app | The approved stage rewritten in the app's own stack and real components, same beats. Only when asked. |
| Anything else | Make it from the same beats. Do not refuse a format because it is not here. |

Every output comes from the same approved beats. If two outputs tell different stories, fix the beats.

## Keeping it cheap

- Explore with the budget above. Grep for a string instead of reading a file to find it.
- The player is shared; an intro file is tokens, scene, beats, steps, and the canvas words. Never paste the engine in.
- Check with one contact sheet per theme, not a screenshot per beat. Zoom into one beat only when the sheet shows a problem.
- One publish after the sheet is clean. Small fixes go as edits on the publish, not a rewrite.

## Common mistakes

- Telling: inbox lists, counters, labels that say what happened. Make it happen on screen instead.
- Squeezing the work into the device. A chat app never shows the automation behind it.
- The tool's own editor for an audience that never opens that tool.
- Copying a design the user showed. Learn what made it work, then design this story from scratch.

- Slides with pictures instead of one scene whose parts become the next step.
- A row wider than the screen. Use grids with `minmax(0,1fr)`.
- Captions that hide but keep their space. Off means gone.
- Text where the logo should be on the end card, when the project has one.
- Asking questions before building. Defaults first, the toolbar does the rest.
- Writing into the user's code when they asked for a preview or a post.
