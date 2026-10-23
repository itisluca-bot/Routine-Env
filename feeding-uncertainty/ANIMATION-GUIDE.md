# How to make animations for Feeding Uncertainty

This is the working guide for a new Claude session. Read it together with `CLAUDE.md` (the standing rules in short form), `HANDOFF.md` (the film, the research, the Topography shot) and `rigs/BEAN.md` (the people rig).

---

## 1. The job

- The film is *Feeding Uncertainty*, an animated explainer of about 8 minutes for the University of Groningen. It shows three coping groups: **withdrawal** (blue), **open engagers** (teal) and **curators** (orange).
- Claude makes animated shots as code. The user brings them into DaVinci Resolve and After Effects as **4K PNG sequences**. Grain is added in post.
- The user sends a narration line as an **SRT with word timings**. Each shot is timed to it.

## 2. Standing rules (every shot)

- Design in **1920 × 1080**, render at **3840 × 2160**, **25 fps**. Background **`#0e0e0e`**.
- Colours: withdrawal `#46647a`, open `#5fa69a`, curators `#e0a165`, crisis red `#a32e11` (hot accent `#f0613f`).
- People are only blue, teal or orange. Never grey.
- No grain. **Line boil at 8 fps**, subtle, with an amplitude slider (default 0.5 px, 0–3) and an on/off toggle.
- End every shot with **6 frames (0.24 s) of idle** (a `Hold` section) where only boil and small sways move.
- Not wanted: kinetic typography, overly literal metaphors, imitating the film's posterized portraits.
- The narration caption is a review toggle only. It is **off** in final renders.
- **Change only what the user asked for.** Keep everything they approved.

## 3. How the user works with you

- **Ideation first.** For a new segment they want many rough options, not polish. Give 6–8 concepts that run on the same beat timing, so beats can be swapped between concepts, plus a synced comparison grid and a storyboard sheet.
- **Then refinement.** They pick pieces ("beat 1 from this, the table from that") and give short notes. Apply each note exactly. When a note can be read two ways, build both as variants and say which reading each one is.
- They react to feel: movement that is too erratic, a camera that "slides", an empty frame, shapes that don't line up. Treat these as real defects.
- Always send a **1080p preview video** after each change (`SendUserFile`), and say in plain words what changed and what didn't.

## 4. Files and engine

| File | Role |
|---|---|
| `*.dc.html` | One page per shot. Holds `window.OM_SCENES` (the section list, which is the single source of timing), `OM_PLAYBACK` and `TWEAK_DEFAULTS`, then imports the `.jsx` files in order |
| `support.js` | The page runtime. Each `.jsx` runs in its own function scope, so files share code only through `window` |
| `animations-v3.jsx` | Engine: `CompositionStage`, `useComposition()` → `{ T, CUES }`, `Captions`, `Easing`, `clamp` |
| `tweaks-panel.jsx` | Control panel: `useTweaks`, `TweakSelect`, `TweakToggle`, `TweakSlider` |
| `rigs/bean-rig.jsx` | **The people rig** (`window.FU_BEAN`). See `rigs/BEAN.md` |
| `rigs/row-house.jsx` | The curator's house, a brick row house (`window.FU_HOUSE.RowHouse`); door window left for the shot to draw |
| `open-engagers-concepts.jsx` | Round-1 ideation (concepts A–H). Also exports shared helpers as `window.FU_RIG`: `MOTION`, `osc`, `lerp`, `lerp2`, `cam`, `mix`, `C`, `hash`, `Card` (the red post), `Ripples`, `Table`, `Chair`, … |
| `open-engagers.jsx` | **The current open engagers shot** (see §8) |
| `curation-topography.jsx` | The finished Topography shot |
| `vulnerability.jsx` | **The vulnerability shot** (see §9) |
| `tools/render.mjs` | Headless renderer (§6) |

Load order in a page: `./animations-v3.jsx ./tweaks-panel.jsx ./rigs/bean-rig.jsx ./open-engagers-concepts.jsx ./your-shot.jsx`.

### Writing a shot
1. Write `OM_SCENES` first: one section per narration beat, durations that land on 25 fps frames (multiples of 0.04 s), plus `Hold` 0.24. The total must match the length the user gives (for example 22s12f = 22.48 s).
2. In the component, read `CUES` and build a word-timing table anchored to section starts (for example `confidence: q.V + 1.04`), so retiming a section carries its beats along.
3. **Every frame is a pure function of `T`.** No state, effects or timers. This is what makes seeking and rendering exact.
4. Motion helpers (`MOTION`): `glide` (easeInOutSine) for settles, drifts and camera; `hit` (easeOutExpo) for impacts; `build` (easeInCubic) for pressure. Each is `fn(T, start, end, from, to)`. `osc(T, period, phase)` for idle sway. Nothing is ever stepped.
5. Something always moves: boil, sways, a slow camera.
6. Wrap the 1920 × 1080 design in a div scaled ×2 inside the 3840 × 2160 `CompositionStage`.

## 5. Techniques that worked

- **Camera:** `cam(x, y, z)` puts world point (x, y) at screen centre. A push-in should be a zoom **anchored on the subject** (keep their screen position nearly fixed, scale up), not a pan; a pan over an empty dark frame reads as sliding. Keep the frame filled; push in closer when a beat is about one person.
- **Light as the transition device:** anything outside a beam is invisible (an SVG mask built from the beam shape, softened with a blur). Moving, swinging or switching a lamp hides one scene and reveals the next. Swap scene content only while it is dark.
- **Lamp model:** a bell shade with a socket and a clipped bulb in the mouth; the beam starts at the mouth's width. The cable is a curve that bows toward where it was a moment ago (evaluate the swing angle at `T - 0.14`). The head lags the cable and overshoots a little: `rot = a(T-0.1) + 0.6·(a(T-0.1) - a(T-0.32))`. Write the swing angle as a function of time so it can be sampled late.
- **Beam meets the floor:** the cone's sides end exactly on the ends of the floor pool ellipse, and the cone's bottom is the lower half of that ellipse.
- **Dust:** spread motes across the whole set in world space and draw them inside the beam mask, so dust shows wherever light falls.
- **Red posts** (`Card`) are the crisis content. In the light they are filled; in the dark they show only as red outlines. They can flutter like moths (flap = squashing the card's width).
- **Bean IK:** Bean takes joint angles. To put a hand on a point, solve the two-bone arm (upper 44, forearm 42) for shoulder angle and elbow bend; subtract the torso lean from the shoulder angle. `open-engagers.jsx` has `reachArm`, `armTo`, `headW`, `handW`, a seated pose `SIT` and a cowering blend `cower`.
- **Children:** Bean at smaller scale (about 0.56–0.7 of an adult) with `headScale` 1.3.

## 6. Rendering and checking

```sh
npm install                                                     # once per container
node tools/render.mjs "Open Engagers.dc.html" --set variant=2 --half --guide --preview   # review: 1080p frames + MP4, caption on
node tools/render.mjs "Open Engagers.dc.html" --set variant=2,referenceOverlay=false      # final: 4K PNG sequence, caption off
node tools/render.mjs "<page>" --frames 0,120,300 --half --guide                        # spot frames
```

- Heavy shots (many masked layers, such as `Vulnerability.dc.html`) need `--settle 60`: without it Chromium can be caught mid-raster and frames come out with whole tiles missing. The pop check finds these. At 4K a frame can still slip through (the 4K export of Vulnerability lost its lit layer on frame 81); run the pop check on the final sequence too, and re-render any such frame on its own with `--frames <n> --settle 300`, which writes it into the same folder.
- Output: `renders/<slug>/<slug>_0000.png` (git-ignored). `--prores` adds a ProRes 4444 `.mov`.
- A 22 s shot takes about 6–8 minutes at half resolution. Run long renders in the background, and several concepts in parallel when needed.
- **Before sending, check for pops:** compare every pair of neighbouring frames (mean absolute difference at low resolution) and flag any pair far above its neighbours. Look at each flagged pair: deliberate hits (a lamp click, a door hit) are fine; anything else gets fixed.
- Make a storyboard sheet (`ffmpeg` tile or `xstack`) of key frames and look at it before a full render. Crop and zoom in on poses.

### Environment gotchas
- unpkg and jsDelivr are blocked by the network policy here; npm works. The renderer serves React, ReactDOM and Babel from `node_modules` and the project files through Playwright request routing. Do not start a local HTTP server: Chromium sends loopback traffic through the proxy.
- Never `pkill -f` or `pgrep -f` with a pattern that appears in your own command line; it matches your own shell. Wait on log files instead.
- The branch may get commits from other sessions. Fetch and rebase your own commits before pushing; never force-push.
- Reference stills show real people. They are kept out of git.

## 7. The segments so far

1. **Curation / Topography** (`curation-topography.jsx`, `timing_1.srt`, 8.24 s). Finished. See `HANDOFF.md`.
2. **Open engagers** (`open-engagers.jsx`, `timing_2.srt`, 22.48 s). In refinement. The user chose **variant 2**.
3. **Vulnerability** (`vulnerability.jsx`, 5.00 s, no SRT yet). In refinement. The user chose **variant 1**.

## 8. Open engagers shot: what is approved

Beats: Curiosity 0–7.48, Voice 7.48–10.84, Table 10.84–16.80, Door 16.80–18.76, Privilege 18.76–22.24, Hold to 22.48.

- **Opening:** two hanging lamps, teal under one and orange under the other, over a faint floor receding into the dark. Red posts flutter in the beams like moths. Teal stands straight; now and then a post lands on their open hand like a butterfly (one flies off at about 3 s, a second lands on "treat politics" and stays). Orange's posts dive at them four times; each time they squat and cover their head, calmly, not erratically. One slow push-in on teal from the first frame.
- **Voice:** orange's lamp clicks off; teal's light tightens into a spotlight; a second push in close on "confidence … voice". No speech ripples (the user found them too literal).
- **Table:** the lamp swings away and back, revealing the childhood dinner table: two teal parents and a teal child pass a red post around and talk over it.
- **Door:** at the end of "dinner table" the lamp swings right; its beam finds a house. Through the window in the door, the orange child peeks, lit red, hovering slightly. No shaking, ducking or flashes. The teal family stays faintly visible outside in the dark.
- **Privilege:** the lamp pulls up and out of frame while its beam opens over both the teal family outside and the house; the light never leaves the house. It ends on teal in the light and the orange child behind the door.
- Variant 1 (lamp switches off and on, door seen from inside) is kept in the file but was not chosen.

Rejected along the way, so do not bring back: the Elbow Room circles as the opening, background rows of other lamps ("ugly"), erratic curator motion, a stiff cable and trapezoid shade, a beam that does not meet its floor pool, dust only near one lamp.

## 9. Vulnerability shot: what is approved

Line: "They bear the weight of vulnerability, produced by the ongoing crises." 5.00 s. Sections: Weight 0–2.28, Crises 2.28–4.76, Hold to 5.00. Word times in `Piece` are estimates until the SRT arrives.

The user chose **variant 1 (Search)**: one searchlight from above sweeps the facades left to right while the camera trucks slowly. Variants 2 (Crossing) and 3 (Opens) are kept in the file but were not chosen.

- **Set:** gallery-access apartment blocks at night, three rows deep with parallax (`LAYERS`: far, mid, near). Each floor is a dark recessed strip with doors and windows behind a parapet.
- **People, seen from the front** (`BeanFront`, the Bean rig's front view): orange figures peek from behind their half-open front doors in about four in ten doorways (the user asked for 30% fewer than the first half). Only part of the head shows past the door's edge, with fingers curled round it (sometimes both hands); arms stay hidden. They lean further out to look, follow the nearest swarm with their eyes, and pull back, holding the door closer, when one comes near. On "the weight" they look down a little.
- **Swarms:** six swarms per row of 4 to 34 red posts, packed toward their centre, bigger swarms with wider clouds and post size varying a little per swarm. Each is partway across the frame at mid-shot. A 40-post swarm crosses the near row on "crises".
- **Searchlight:** only the pool is lit (one mask over all rows, so near blocks still hide far ones). Outside it the blocks are dark shapes, people are faint, and posts are red outlines. The pool makes two long glides between three waypoints (left, middle, right), lingering a moment on each; the user halved the number of moves.

Rejected, so do not bring back: side-view people standing in the doorway (the user found them odd), too few swarms of one size.
