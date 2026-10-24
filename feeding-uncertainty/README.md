# Feeding Uncertainty animatics

Read `HANDOFF.md` first. It covers the film, the standing rules, every concept, and how the Topography shot is built. `CLAUDE.md` holds the standing rules in short form.

## Layout

| Path | What it is |
|---|---|
| `Curation Topography.dc.html` + `curation-topography.jsx` | Current final shot |
| `Top-down Figure Options.dc.html` | Figure-model options; 1e was chosen |
| `Open Engagers Concepts.dc.html` + `open-engagers-concepts.jsx` | "We find that open engagers…" (22s12f, `timing_2.srt`): ideation roughs, concepts A–H plus a Script card, picked with the Concept tweak or `--set concept=C` |
| `Open Engagers.dc.html` + `open-engagers.jsx` | The developing version of the segment: two lamps open it (red posts fluttering like moths; teal picks some, orange ducks), then the teal lamp carries the rest. Variant 1 (Switch) and 2 (Swing), picked with the Variant tweak or `--set variant=2`. People use the Bean rig (`rigs/bean-rig.jsx`); lamps, cards and other helpers come from `open-engagers-concepts.jsx` (`window.FU_RIG`) |
| `Vulnerability.dc.html` + `vulnerability.jsx` | "They bear the weight of vulnerability, produced by the ongoing crises." (5 s): curators, seen from the front, peeking from behind their front doors in a night-time city of apartment blocks; swarms of red posts of every size flying past; a searchlight scanning the facades. Variant 1 (Search) is the chosen one; 2 Crossing and 3 Opens are kept (`--set variant=3`). Render with `--settle 60` |
| `Look Concepts.dc.html` + `look-concepts.jsx` | The toned look: asset sheets (tone, hair, moving lights, busts, red post variations) and scene mockups, picked with `--set concept=lamp` etc. See `LOOK.md` |
| `Curator Phone Concepts.dc.html` + `curator-phone-concepts.jsx` | "Unfollowing what hurts…" (9s4f, `timing_0.srt`): first person on the curator's phone, round-1 roughs A–H, a hands sheet (X) and a Script card, picked with `--set concept=C`. The phone, screen UI and hands are in `curator-phone-kit.jsx` (`window.FU_PHONE`) |
| `rigs/fu-look.jsx` | The toned look (`window.FU_LOOK`): ramps measured from the portraits, grade filters, `ToneBean` (the Bean toned and lit by scene lights), `BeanBust`, `PostValue` |
| `rigs/row-house.jsx` | Houses: the curator's brick row house in the open engagers door beat (`window.FU_HOUSE.RowHouse`), and `TerraceHouse`, the same style with parameters (width, 2 or 3 storeys, flat, pitched, gable or step-gable roof, brick colour) for rows of houses |
| `Resistance.dc.html` + `resistance.jsx` | "Coping is a form of resistance. The question is, what do people have to resist with?" (10 s): three front doors in a terrace street at night, blue, teal and orange, reacting to one swarm of red posts. In the toned look; `--set look=old` is the shot before it. Render with `--set camera=track --settle 150` |
| `Vulnerability Alley.dc.html` + `vulnerability-alley.jsx` | Round 2 of the vulnerability line: one alley of terrace houses at night under streetlights. Blue and teal glow behind shutters; orange curators peek from behind curtains and duck as swarms of red posts pass, drawn to each light. Render with `--settle 60` |
| `Credits.dc.html` + `credits.jsx` | **The end credits** (12 s): concept H's look made simple and clean, the opening title's dot over the Y, no palette colours, lines fading in on their beats. `--set logo=red` for the red logo |
| `Credits Concepts.dc.html` + `credits-concepts.jsx` | End credits (12 s), round-1 concepts A–H on shared beats, plus `draft` (the endcard draft, static) and `S` (beats). Needs the licensed Futura in `fonts/` (git-ignored; see ANIMATION-GUIDE §14) |
| `animations-v3.jsx`, `tweaks-panel.jsx`, `support.js` | Engine, tweak panel, Design Component runtime |
| `archive/` | Round 1 and round 2 concepts, with their own copy of the runtime |
| `reference/` | `timing_0.srt`, `timing_1.srt`, `timing_2.srt`. The reference stills live here locally but are not committed |
| `tools/render.mjs` | Headless 4K PNG-sequence renderer |

## Preview in a browser

Serve the folder over HTTP (`file://` blocks the `.jsx` fetches), for example `npx serve .` or `python3 -m http.server`, then open `Curation Topography.dc.html`.

## Render

```sh
npm install                                               # React, ReactDOM, Babel, Playwright
node tools/render.mjs "Curation Topography.dc.html"       # full 4K PNG sequence, 25 fps
node tools/render.mjs "Curation Topography.dc.html" --preview      # + 1080p H.264 for review
node tools/render.mjs "Curation Topography.dc.html" --prores       # + ProRes 4444 .mov
node tools/render.mjs "Curation Topography.dc.html" --boundaries   # only the frames either side of each section cue
node tools/render.mjs "Curation Topography.dc.html" --frames 0,40,126
node tools/render.mjs "Open Engagers Concepts.dc.html" --set concept=C --half --guide --preview   # quick labelled review of one concept
```

Output goes to `renders/<shot>/<shot>_0000.png` and so on (git-ignored). Other options: `--settle <ms>` (for heavy shots: waits after each seek and re-captures until two captures match, so no tile is caught half-drawn), `--fps`, `--out <dir>`, `--boilAmp <px>`, `--noBoil`, `--guide`, which turns on the narration caption for timing review only, never for final renders, and `--look <ramp>[:map|poster|lift]`, which regrades a finished shot onto one group's portrait ramp (see `LOOK.md`).

The renderer drives the stage's own seek event in headless Chromium at a 3840 × 2160 viewport, so each frame is the same pure function of `T` as the preview. It serves the project files and the pinned React, ReactDOM and Babel from `node_modules`, so it does not depend on unpkg. Rendering needs `ffmpeg` only for `--preview` and `--prores`.
