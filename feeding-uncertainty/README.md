# Feeding Uncertainty animatics

Read `HANDOFF.md` first. It covers the film, the standing rules, every concept, and how the Topography shot is built. `CLAUDE.md` holds the standing rules in short form.

## Layout

| Path | What it is |
|---|---|
| `Curation Topography.dc.html` + `curation-topography.jsx` | Current final shot |
| `Top-down Figure Options.dc.html` | Figure-model options; 1e was chosen |
| `Open Engagers Concepts.dc.html` + `open-engagers-concepts.jsx` | "We find that open engagers…" (22s12f, `timing_2.srt`): ideation roughs, concepts A–H plus a Script card, picked with the Concept tweak or `--set concept=C` |
| `animations-v3.jsx`, `tweaks-panel.jsx`, `support.js` | Engine, tweak panel, Design Component runtime |
| `archive/` | Round 1 and round 2 concepts, with their own copy of the runtime |
| `reference/` | `timing_1.srt`, `timing_2.srt`. The reference stills live here locally but are not committed |
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

Output goes to `renders/<shot>/<shot>_0000.png` and so on (git-ignored). Other options: `--fps`, `--out <dir>`, `--boilAmp <px>`, `--noBoil`, and `--guide`, which turns on the narration caption for timing review only, never for final renders.

The renderer drives the stage's own seek event in headless Chromium at a 3840 × 2160 viewport, so each frame is the same pure function of `T` as the preview. It serves the project files and the pinned React, ReactDOM and Babel from `node_modules`, so it does not depend on unpkg. Rendering needs `ffmpeg` only for `--preview` and `--prores`.
