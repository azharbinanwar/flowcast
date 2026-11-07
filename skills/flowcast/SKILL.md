---
name: flowcast
description: Use when asked to explain, show, demo, announce or promote a feature or product as an intro, walkthrough, onboarding, explainer, launch video, GIF, carousel, social post, image or web embed, whether the source is a codebase, a typed story, a screenshot, a workflow, a changelog or a support ticket. Also use when the user types /flowcast or writes "flowcast:".
---

# Flowcast

Show, don't tell. A feature becomes 3 to 5 beats played on a scene built from the product's own parts, colours and logo, then exported as video, GIF, frames or slides from a local studio.

The work runs in two sub-agents, a planner and a builder, so this chat only carries the plan and a short summary. This chat reads nothing from the project itself: no source files, no screenshots, no intro files. Every read happens inside a sub-agent. `<skill>` below is this skill's folder.

If this conversation already holds other work, say once, in one line, that `/flowcast` costs less in a fresh session, then carry on.

## A run

With nothing after `/flowcast`, open History instead: do exactly what the `flowcast-history` skill says.

1. **Plan.** Always start the planner, even for a small change to an existing intro. Start a sub-agent (the Agent tool, general-purpose) with this prompt, filled in:
   > You are Flowcast's planner. Read `<skill>/plan.md` and do what it says. The project is `<the folder Claude Code is working in>`. The request: `<the user's words, all of them, plus anything said earlier in this chat that the intro depends on>`.
2. **Show the plan.** Print the part above `---brief---` exactly as returned, then ask with the option picker:
   - **Build it**: builds the intro and opens it in the studio.
   - **Make it shorter**: fewer steps, then the plan again.
   - **Change something**: the user types what, then the plan again.
   For shorter or a change, send the request to the same planner (SendMessage) and show the new plan. Nothing is built until the user picks Build it.
3. **Build.** Start a second sub-agent with:
   > You are Flowcast's builder. Read `<skill>/build.md` and do what it says. The project is `<folder>`. The approved plan and brief: `<everything the planner returned>`.
4. **Report** its summary in a few lines: where it is open, the running time, and that timing, colours, captions and exports are all switches in the studio.

If sub-agents are not available, do the same steps yourself: plan with `plan.md`, show the plan and ask, then build with `build.md`.

## After the first build

"Change beat 2", "slower", "add a tap", "no captions": small edits to `flowcast/<feature>/intro.html`, confirmed with `check.mjs`, then tell the user to refresh. A bigger change goes back through a builder with the edit as its brief. Never change the app's own code, or post anywhere, unless that exact thing was asked.

## Outputs

| Ask | What is made |
|---|---|
| Beats, storyboard | The plan only. |
| Preview, intro, animation | The intro, open in the studio. |
| Text post | The steps as a caption for the platform: hook first, hashtags, first comment. |
| Frames, still | One PNG per beat plus the end card, from the studio or `scripts/frames.mjs`. |
| Carousel, slides | The same as a PDF, `scripts/frames.mjs --pdf`. |
| Video, GIF, reel | From the studio's Export, or `scripts/record.mjs` then `scripts/convert.mjs`. See `record.md`. |
| Web embed | The intro and the player files, mode `embed`, and an iframe line. |
| In-app | The approved intro rewritten in the app's own stack and components. Only when asked. |

Exports use what the user set in the studio. In claude.ai, without a studio, the intro is published as an artifact and that is the preview.
