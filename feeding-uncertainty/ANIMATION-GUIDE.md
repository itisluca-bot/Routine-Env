# How to make animations for Feeding Uncertainty

This is the working guide for a new Claude session. Read it together with `CLAUDE.md` (the standing rules in short form), `HANDOFF.md` (the film, the research, the Topography shot) and `rigs/BEAN.md` (the people rig).

---

## 1. The job

- The film is *Feeding Uncertainty*, an animated explainer of about 8 minutes for the University of Groningen. It shows three coping groups: **withdrawal** (blue), **open engagers** (teal) and **curators** (orange).
- Claude makes animated shots as code. The user brings them into DaVinci Resolve and After Effects as **4K PNG sequences**. Grain is added in post.
- The user sends a narration line as an **SRT with word timings**. Each shot is timed to it.

## 2. Standing rules (every shot)

- Design in **1920 × 1080**, render at **3840 × 2160**, **25 fps**. Background: black (`#0e0e0e`) is **not a rule**; in the toned look the scene sits in a group's ramp.
- Colours: withdrawal `#46647a`, open `#5fa69a`, curators `#e0a165`, crisis red `#a32e11` (hot accent `#f0613f`).
- People are only blue, teal or orange. Never grey.
- **The toned look** (agreed October 2026; details in `LOOK.md`): people are `ToneBean` (`rigs/fu-look.jsx`), the Bean toned into flat bands of their group's ramp. **No contour rings.** **Eyes always sharp.** The bands come from the scene's own lights, passed as `lights`; whatever lights the set (a lamp, a streetlight, a phone) lights the people, and moving lights move the bands. Hair per character: `none`, `beanie` or `long`. Backgrounds are out of focus and graded into the ramp.
- **Red** comes in through the posts (and possibly through some story beats), not as a general colour.
- No grain. **Line boil at 8 fps**, subtle, with an amplitude slider (default 0.5 px, 0–3) and an on/off toggle.
- End every shot with **6 frames (0.24 s) of idle** (a `Hold` section) where only boil and small sways move.
- Not wanted: kinetic typography, overly literal metaphors, contour rings on people, a ring transition into the portraits. (The old rule against imitating the film's posterized portraits is outdated: the animations were found too different from the rest of the film. See `LOOK.md`.)
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
| `rigs/fu-look.jsx` | **The toned look** (`window.FU_LOOK`): ramps, grades, `ToneBean` (the Bean toned and lit), `BeanBust`, `PostValue`. Load after `bean-rig.jsx`. See `LOOK.md` |
| `Look Concepts.dc.html` + `look-concepts.jsx` | Toned-look sheets and scene mockups (`--set concept=lamp` etc.) |
| `rigs/row-house.jsx` | Houses (`window.FU_HOUSE`): `RowHouse`, the curator's brick row house, with its door window left for the shot to draw; and `TerraceHouse`, the same style with parameters (width, storeys, roof: flat / pitched / gable / step, brick colour, door side), whose windows a shot fills through a `fill(win, i)` callback |
| `open-engagers-concepts.jsx` | Round-1 ideation (concepts A–H). Also exports shared helpers as `window.FU_RIG`: `MOTION`, `osc`, `lerp`, `lerp2`, `cam`, `mix`, `C`, `hash`, `Card` (the red post), `Ripples`, `Table`, `Chair`, … |
| `open-engagers.jsx` | **The current open engagers shot** (see §8) |
| `curation-topography.jsx` | The finished Topography shot |
| `vulnerability.jsx` | **The vulnerability shot** (see §9) |
| `curator-phone-kit.jsx` | The curator's phone in first person (`window.FU_PHONE`): phone, screen UI drawn in value (feed, "…" menu, keyboard, chat, icons), `WarmPost` (comfort faces: cat, sun, cup, friends, plant, bowl, heart), feed layout, and hands (`Mitt`, `Stumps`). Load after `rigs/fu-look.jsx` and `open-engagers-concepts.jsx` |
| `Curator Phone Concepts.dc.html` + `curator-phone-concepts.jsx` | Round-1 ideation for the phone shot (§11) |
| `Curator Phone.dc.html` + `curator-phone.jsx` | **The current phone shot** (concept A, §12). `--set variant=two` (default) or `one` |
| `Resistance.dc.html` + `resistance.jsx` | **The resistance shot** (§13). `--set camera=track` (chosen), `look=toned` (default) or `old` |
| `Curator Eye.dc.html` + `curator-eye.jsx` | **The curator's weight** (concept D, §20): the POV and its reflection in the eye. Loads `curator-phone-kit.jsx` |
| `Curator Weight Concepts.dc.html` + `curator-weight-concepts.jsx` | Round-1 concept frames for the curator's weight shot (§19) |
| `Three Groups Concepts.dc.html` + `three-groups-concepts.jsx` | Round-1 layout concepts for the three groups side by side (§16) |
| `Three Groups.dc.html` + `three-groups.jsx` | **The three groups shot** (concept F, §17). Exported at 4K. `--set wd=turn|walk|blind|shoo,cur=warm|red`; `view=wd` shows the withdrawal options side by side |
| `Crisis Bars.dc.html` + `crisis-bars.jsx` | **The crisis finding as a bar chart** (§18), replacing the crisis scatter. Loads `three-groups.jsx` for the characters' actions (`window.FU_THREE_GROUPS`). Needs `fonts/Futura-Bold.ttf` |
| `Coping Concepts.dc.html` + `coping-concepts.jsx` | The last shot, replacing the Resistance alley: round-1 concepts (§21). `--set concept=pillars` or `triptych` |
| `Coping.dc.html` + `coping.jsx` | **The last shot** (§22): the triptych as three house interiors, a slow slide left to right |
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
- **Toned scenes:** author the set in value (`v(0.4)`) inside `<g filter="url(#fuGradeBg-<ramp>)">` (out of focus) or `fuGradeFg-<ramp>` (posterized, for props and light pools); draw red posts as `PostValue` inside `fuGradeFg-red`. Give every `ToneBean` the same `lights` as the set: a lamp's bulb or a streetlight's lantern as `{ x, y, i, reach }`, evaluated from `T` so a swinging lamp's light swings with it. Lights are in the figure's own coordinates (inside the same camera transform).

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
- All of the film's work is on branch `claude/festive-ramanujan-0f2ir9`. The repository's default branch does not contain `feeding-uncertainty/`; start new work from that branch (see `LOOK.md` §8).
- If Playwright reports a missing browser after `npm install`, the renderer falls back to the pre-installed Chromium at `/opt/pw-browsers/chromium` by itself.
- When several sessions work in parallel (one shot each), change the shared rigs (`rigs/*.jsx`) only when the shot needs it, and say so in the commit; they are shared by every shot.
- Reference stills show real people. They are kept out of git.

## 7. The segments so far

1. **Curation / Topography** (`curation-topography.jsx`, `timing_1.srt`, 8.24 s). Finished. See `HANDOFF.md`.
2. **Open engagers** (`open-engagers.jsx`, `timing_2.srt`, 22.48 s). The user chose **variant 2**. Moved to the toned look in October 2026 (§8, "Look").
3. **The toned look** (October 2026, `LOOK.md`). The rig and mockups are done. Open engagers and Vulnerability Alley are moved to it; Topography is next.
5. **Curators on the phone** (`timing_0.srt`, 9s4f = 9.16 s). Round-1 concepts (§11); the user chose **A · Long press** (§12). Exported at 4K (variant `two`).
6. **Resistance** (`resistance.jsx`, `timing_4.srt`, not in the repo; 10.00 s). Built in another session; moved to the toned look in October 2026 (§13).
7. **End credits** (12.00 s, silent for now). Round-1 concepts A–H (§14); the user chose H's look, made simple and clean (§15).
8. **The three groups side by side** (7.00 s, no SRT yet). Round-1 layout concepts A–H (§16); the user chose **F · Triptych** (§17).
9. **The crisis finding** (16.00 s, the crisis scatter's v6 narration timing). The scatter (a separate Python handoff) was found too hard to read; replaced by a bar chart with the triptych's characters (§18).
10. **The last shot** (same line as Resistance, 10.00 s), replacing the Resistance alley; all three groups in frame again. Round-1 concept stills (§21).
4. **Vulnerability** (5.00 s, no SRT yet). Round 1, the city of apartment blocks (`vulnerability.jsx`, variant 1), was exported at 4K; the user then found it too busy. Round 2 is the alley (`vulnerability-alley.jsx`, §10).

## 8. Open engagers shot: what is approved

Beats: Curiosity 0–7.48, Voice 7.48–10.84, Table 10.84–16.80, Door 16.80–18.76, Privilege 18.76–22.24, Hold to 22.48.

- **Opening:** two hanging lamps, teal under one and orange under the other, over a faint floor receding into the dark. Red posts flutter in the beams like moths. Teal stands straight; now and then a post lands on their open hand like a butterfly (one flies off at about 3 s, a second lands on "treat politics" and stays). Orange's posts come at them three times before 4 s; each time a post drifts closer, they look up at it, then duck as it darts in, each duck a different depth and timing. At 4 s their lamp clicks off. One slow push-in on teal from the first frame (framed tight from the start, 1.35 → 1.55, so the floor and ceiling are not empty).
- **Voice:** (orange's lamp already clicked off at 4 s, after which they stand still in the dark, quietly looking around) teal's light tightens into a spotlight; a second push in close on "confidence … voice". No speech ripples (the user found them too literal).
- **Table:** the lamp swings away and back, revealing the childhood dinner table: two teal parents and a teal child pass a red post around and talk over it. The standing parent faces the mother and holds the post; on "conversation" they hand it to her, and on "around" they turn round (a quick flip through edge-on) to look down at their son; the post goes on to him and back to the table. The lit back wall sits darker than the people's bands so they never merge with it.
- **Door:** at the end of "dinner table" the lamp swings right; its beam finds a house. Through the window in the door, the orange child peeks, lit red, hovering slightly. No shaking, ducking or flashes. The teal family stays faintly visible outside in the dark.
- **Privilege:** the lamp pulls up and out of frame while its beam opens over both the teal family outside and the house; the light never leaves the house. It ends on teal in the light and the orange child behind the door.
- **Environment (variant 2):** minimal until the dinner table. At ~12 s a room forms round the family (back wall with a night window and a picture, skirting, floorboards, a ceiling the lamp hangs from), lit only where the lamp falls. At ~16.5 s the camera pulls out: the room is the ground floor of a house in section (front cut away) in a dim street of terrace houses, with the next street's rooftops behind, matching the Vulnerability alley but quieter. The lamp now hangs on a short cord from that ceiling, so it swings further (-50° and 55°) and its light leaves through a window in the side wall onto the curator's door next door. Ending: the lamp swings home over the family; there is no streetlight (it was tried and removed). Posts fly round the curator's door and show wherever the lamp's light reaches them. The light under their door goes when the lamp swings home. At 20 s another swarm (outlines, in the dark) crosses the top of the frame left to right and is gone before the hold; faint clouds drift low in the sky behind the next street's rooftops. Upstairs the section house is not cut away: a brick front with two windows and a gable window. The curator's house and the houses to its right stand wall to wall, and out of the light their feet fade into the ground.
- Variant 1 (lamp switches off and on, door seen from inside) is kept in the file but was not chosen.
- **Look (toned, October 2026).** The world is the teal ramp (`RAMPS.open[0]` replaces black). People are `ToneBean`s lit by the lamps' bulbs (point lights from `beamGeom`, so the bands swing with the lamp). Hair: teal hero beanie, the teal child at the table beanie too (the hero as a child), mother long, father none, curator none, curator child long. Sets keep their own colours and go through the shot's `Grade` filters (`oeLit-*` posterized for lit copies, `oeDark-*` smooth for the dark copies, `oeBackLit/Dark-*` with a little blur for the back walls, `oeStreet*` blurred for the street). Floor pools are posterized bands (`oePool`). Posts are `PostValue`, all nine faces. The child at the door is a front-view `ToneBean` behind the glass, its ramp sliding toward red as the light finds it.
- **Mixed beats (decided):** light that belongs to the curator is in their ramp. Their lamp's beam is orange (the dark inside it is the orange ramp, the haze and pool are orange). Their house is warm brick in the beam; it and the houses to its right are their side of the street, and outside the light the whole street (and the outside of the section house) has no ramp tint: it is the Vulnerability alley's muted brick (`DARK` 0.55, sharp, so the bricks read) on a neutral dark (`NEUTRAL`), which replaces the teal ground as the street appears. The room outside the light is untinted too; only the lamp's light (and what it falls on) is teal. The teal lamp's light turns orange once it leaves through the side window (past the wall's outer face: haze, pool and the street in the beam). Rejected: the dark split warm/teal across the opening, and an all-teal world.

Rejected along the way, so do not bring back: the Elbow Room circles as the opening, background rows of other lamps ("ugly"), erratic curator motion, a stiff cable and trapezoid shade, a beam that does not meet its floor pool, dust only near one lamp.

## 9. Vulnerability shot: what is approved

Line: "They bear the weight of vulnerability, produced by the ongoing crises." 5.00 s. Sections: Weight 0–2.28, Crises 2.28–4.76, Hold to 5.00. Word times in `Piece` are estimates until the SRT arrives.

The user chose **variant 1 (Search)**: one searchlight from above sweeps the facades left to right while the camera trucks slowly. Variants 2 (Crossing) and 3 (Opens) are kept in the file but were not chosen.

- **Set:** gallery-access apartment blocks at night, three rows deep with parallax (`LAYERS`: far, mid, near). Each floor is a dark recessed strip with doors and windows behind a parapet.
- **People, seen from the front** (`BeanFront`, the Bean rig's front view): orange figures peek from behind their half-open front doors in about four in ten doorways (the user asked for 30% fewer than the first half). Only part of the head shows past the door's edge, with fingers curled round it (sometimes both hands); arms stay hidden. They lean further out to look, follow the nearest swarm with their eyes, and pull back, holding the door closer, when one comes near. On "the weight" they look down a little.
- **Swarms:** six swarms per row of 4 to 34 red posts, packed toward their centre, bigger swarms with wider clouds and post size varying a little per swarm. Each is partway across the frame at mid-shot. A 40-post swarm crosses the near row on "crises".
- **Searchlight:** only the pool is lit (one mask over all rows, so near blocks still hide far ones). Outside it the blocks are dark shapes, people are faint, and posts are red outlines. The pool makes two long glides between three waypoints (left, middle, right), lingering a moment on each; the user halved the number of moves.

Rejected, so do not bring back: side-view people standing in the doorway (the user found them odd), too few swarms of one size.

## 10. Vulnerability, round 2: the alley

The user liked the concept but found the city too busy. The same line and timing, now in one alley (`Vulnerability Alley.dc.html`).

- **Set:** one row of eight terrace houses seen from the front (`TerraceHouse`, scale 0.8, pavement line at y 900), in the style of `rigs/row-house.jsx`: dark brick, stone cornices, muted frames. Roofs vary (flat, pitched with a dormer, front gable, a low step gable), a bit Dutch but not very. Behind them, the next street's rooftops, dark, with a few dim windows, at 0.55 parallax.
- **Light:** a streetlight in front of each curator's house. Only their pools are lit (a facade pool, a pavement pool and a halo round the lantern, all in one mask whose gradients fade to clear so the pools add up); the rest of the street is the dark copy (`DARK` 0.8). A faint cone with dust runs from each lantern to the pavement.
- **Blue and teal houses** glow quietly behind closed louvred shutters, in some windows, with a slight spill on the brick. They are fine: nothing reacts there.
- **Curators** (BeanFront) peek past the edge of a curtain in a few windows, fingers on the curtain's edge, eyes on the nearest swarm. When a swarm comes close they pull back and duck below the sill.
- **Moths:** six red posts circle every lantern; three swarms of different sizes fly down the alley (the user found six too many) and are pulled toward each light as they pass; a 30-post swarm comes through on "crises". Lit in the pools, red outlines in the dark.
- **Camera:** a slow truck along the alley with a 3% push.
- **Length:** the user asked for 2 s more, so the alley runs 7.00 s: Weight 0–2.28, Crises 2.28–6.76 (the line ends about 4.3 s in; the rest is the street carrying on), Hold to 7.00. One extra swarm enters from off screen after "crises" so the tail never empties. Exported at 4K.
- **Look (toned, October 2026, `env` tweak, default `AE`):** the user chose a neutral streetlight with the window glows halfway between options A and E. Shared by every option: a lighter night sky with the slow clouds from the end of Open Engagers; the next street out of focus (blur 3.5, `dark` 0.8); the row outside the light in its own muted brick (`TDARK` 0.6, sharp); inside the pools the brick keeps its own colours (no ramp tint). Blue and teal glows behind the shutters at `glow` 1.25 (1.5 was too strong; the unlit row at `TDARK` 0.7, darker than the first 0.6): above 1 they wash their own facade in their ramp (a soft mask per house plus one per window, graded with `vtGlowG-<ramp>`). Curators are front-view `ToneBean`s (arms hidden, lit by the lanterns), drawn on top of the row with the curtain they hold (`peekLayer`), with the window's frame and bars redrawn over them; the houses do not boil (the user: they should not shake); hair mixed none / long / beanie, the right-hand curator (house 5) in a beanie (`HAIR_OF`). Some curator windows glow orange behind their curtains (`glow` on the curator houses), washing their own facade like the blue and teal ones. **Reactions (user: they all did the same vertical slide):** each curator has their own response (`REACT`): hide (leans back behind the curtain and pulls it across, the lean easing off so one eye always stays past the edge), duck (drops until the eyes are just over the sill, leaning sideways), flinch (startled by a swarm coming closer, not by one that stays near; jerks back and keeps watching). Each has its own delay, recovery and spring (`fearOf` reacts fast and recovers slowly; `respOf` runs it through a damped spring, so moves overshoot a little). The hips stay put, so leaning swings the head on an arc instead of sliding it. Nobody vanishes from their window. Curtains a little darker than before so the curators read. Posts are `PostValue` (mixed kinds) in `fuGradeFg-red`: outlines outside the pools, filled inside. Options kept in the file but not chosen: B (pools warm toward the curator ramp), C (each house toned toward its resident's ramp), D (C with stronger glows), E (A with glow 2); `old` is the shot before the look. Exported at 4K (PNG sequence, caption off; `--settle 300 --minSize 0.8`, about 7 s a frame).

## 11. Curators on the phone: round 1 (concepts)

Line (`reference/timing_0.srt`): "Unfollowing what hurts, venting when it gets too much. For them, comfort is a way of coping. A feed calibrated not to distress," The shot is 9s4f (9.16 s); the SRT runs on into "but a space that feels safe enough to keep browsing", which belongs to the next shot.

Brief: in the style of the film, but no full character. A first-person view of a phone and the curation actions on it, mixing social media as information source and as mood regulator, so the viewer understands what curators do.

Sections: Unfollow 0–1.80, Vent 1.80–3.80, Comfort 3.80–6.40, Feed 6.40–8.92, Hold to 9.16. Every concept runs on these beats (`--set concept=A` … `H`, `X` hands sheet, `S` script card):

| | Concept | Unfollow | Vent | Comfort | Feed |
|---|---|---|---|---|---|
| A | Long press | "…" menu, unfollow, the post folds away | types in a chat, scribbled bubble sent | a cat, double-tap heart | warm scroll; a red post slipping in is veiled into a hidden-post outline |
| B | Nightlight | in bed; red video lights hands and room red; unfollow turns the light warm | pecking a post, the light flickers per key | slow reel of warm clips, camera sinks | a red post flicked past flashes the room red once |
| C | Following | no hands, night bus; three red accounts unfollowed from the following list | bursts of scribbled messages in the group chat | friends answer: hearts, a photo, a sticker | home feed, camera pulls out to the bus |
| D | Swipe | red posts swiped out of the phone, they become outline moths in the room | held voice note, jagged waveform | warm posts swiped into a tray | the tray opens into the feed; moths stay outside |
| E | Glow | the phone's light is a posterized pool; red posts hang round it as outlines; the unfollowed one is thrown out | the vent floats off as a bubble | the pool widens and pushes the posts back | posts held at the pool's edge, one dives in and is pushed out |
| F | Controls | crisis topics switched off | a scribble on a story | a calm clip played | a sensitivity slider; a live preview of the feed flips red posts to warm |
| G | Pull-out | A's screen, starting inside the unfollow menu | camera pulls back through the hands | wider, the bed | wide: a warm island in the dark room, red posts flutter outside the window |
| H | Rhythm | two thumbs, compact news feed; swipe a red row, unfollow | angry reply in the comments under a red post | linger, a like | calm news and comfort at an even pace, a red post flicked past fast |

Hands: the Bean has no hands. The `X` sheet shows four options: a mitt with a thumb (Bean arm grown a palm, fingertips over the far edge), two thumbs, plain Bean stumps (round-capped forearms holding the sides, one lifts to tap), and no hands (taps only). Hands are value art filled with the screen's light gradient and toned through a `ToneFilter`, so the screen lights them.

Screen content is value art in three graded layers (`Layers`): the curator ramp, then red posts in the red ramp, then menus. No readable words: text is bars (no kinetic typography).

## 12. Curators on the phone: round 2 (concept A)

The user chose concept A, the hands from the `X` sheet (mitt and thumb) and A's bedroom. `Curator Phone.dc.html` + `curator-phone.jsx`.

- **Beats:** long press on a red post (a ring grows under the thumb), the "…" menu slides up, unfollow, the post folds away. Swipe to a chat, type with both thumbs, send; a heart lands on the sent message (3.5 s), then the reply (3.68 s). Swipe back, double-tap a cat (heart). The feed scrolls warm; a red post that slips in is veiled into a hidden-post outline and folds away.
- **The message keeps its shape:** the compose box grows a line at a time as the text wraps, and the sent bubble draws the same scribble (`Scribble`, same seed and line width), rising out of the box. (Round 1 typed one line and sent four.)
- **Thumb reach:** every thumb target is within `THUMB_REACH` (230 screen units) of the thumb's root; menus, double-taps and swipes are placed in the lower right. Typing uses both thumbs: the left hand comes up for the chat, each thumb types its own half of the keyboard, and the grip slides lower (`grip` 0.8). The fingertips over the far edge fade out while both hands hold the phone. Variant `one` keeps one hand and types only on the keys the right thumb can reach.
- **Still hands hold their bands:** the hands are drawn in the phone's own frame (`HAND_AT`) and placed with one transform, so the tone filter's noise textures move with the hand instead of the hand sliding over them as the phone sways; their band boil is 0.35 of the line boil (`PhoneDefs handAmp`). Before, the palm's band edges crawled and jumped while the hand was still. The bands still follow the screen's light.
- **Hands against the phone:** hands are lifted out of the ramp's darkest tones (`phTone` from tone 2 up behind the phone, `phToneF` from tone 3 up in front), so the thumb's edge band never merges with the phone's dark body.
- **The cat post:** the cat's body sits on the photo's bottom edge, cropped by it (it used to hang over the frame). The friends photo the same way (and without the hairline strip that ran along its top). The double-tap heart pops where the thumb tapped, beside the cat's face, in a dark tone with a light rim (cream on the cream photo vanished), rides on the card and fades before the feed scrolls on.
- **Room glow:** the bedroom's glow follows the screen's brightness (`screenLight`: red area on screen and the menu's dim lower it), softer than concept B. The room and hands drift a little toward red (at most 0.2) while a red post fills the screen.

## 13. Resistance

Line: "Coping is a form of resistance. The question is, what do people have to resist with?" (`timing_4.srt`, which is not in the repo; the word times are in `Piece`). 10.00 s: Resistance 0–3.04, Question 3.04–4.52, With 4.52–7.76, Orange 7.76–9.76 (two seconds staying with orange), Hold to 10.00. Built in another session and brought in as delivered (commit "Resistance: add the shot as delivered"); everything below except the look comes from that version.

- **Set:** a terrace street at night at ground level, close, in the style of the Vulnerability alley: brick fronts, stone lintels and sills, streetlights whose pools are the only light on the brick. Three front doors: blue, teal, orange.
- **Beat:** one swarm of red posts, circling the streetlight left of blue from the start, moves along the doors on "what do people have to resist with" and flies on out of frame. Blue shuts the door early, then a roller shutter comes down over the window. A second teal person inside puts a hand on teal's shoulder; two teal children rise into teal's lit window. Orange pulls back behind the door and the window behind their curtain flickers; after the push-in they open up a little again.
- **Camera (chosen: 2 · Track):** the houses further apart; an even drift from blue and teal, a gentle lift as the swarm moves along the doors, then a long ease to a stop at orange with a slow push-in to the last frame. Camera 1 · Push is kept in the file.
- **Look (toned, October 2026, `look` tweak, default `toned`):** the alley's AE (see `LOOK.md` §8). Hair: blue none; of the teal pair, the smaller (the resident) long and the taller (the companion) beanie; orange none; the teal children long and none. Long hair uses the shot's own hair filter (`rsHair-<ramp>`, edge depth 0.12): the rig's (`fuHair-`) darkens hair toward its outline into the ramp's darkest tone, which read as a dark rim round long hair. Teal's long hair falls over the gap where the companion's arm reaches for teal's shoulder, so that arm is drawn again over teal, masked to the arm and kept off teal's body, left arm and head (`mateHand`). The upper windows vary (toned only, `HouseFront` `vary`): bare glass with glazing bars and a faint sheen, curtains open or drawn, roller shutters part or all the way down, venetian blinds, net curtains; none of them lit.
- **Render:** `node tools/render.mjs "Resistance.dc.html" --set camera=track,referenceOverlay=false --settle 150 --minSize 0.6`. **Exported at 4K** (October 2026) as a PNG sequence only: the user wants PNGs, not the ProRes .mov or the preview (so no `--prores`, no `--preview` on final exports).

## 14. End credits: round 1 (concepts)

`Credits Concepts.dc.html` + `credits-concepts.jsx`. The user's brief: the endcard only (title, three names, the RUG logo, the disclaimer), about 12 s, **mostly graphic** (the world only as light, colour, bands, depth of field and the posts), no sound yet so timed visually. The endcard draft (`reference/endcard-draft.png`, from the user's zip) is a **draft**: layout and type are open.

- **Assets:** `assets/rug-logo.png` (tinted `#c23a1b` in the page, as in the draft). The draft's Futura is licensed and lives in `fonts/` (git-ignored); extract it from the user's `feeding-uncertainty-endcard.zip` (`assets/Futura.ttc`, faces 0 Medium, 1 Medium Italic, 2 Bold) with fontTools into `fonts/Futura-Medium.ttf`, `Futura-MediumItalic.ttf`, `Futura-Bold.ttf`. Without them the card falls back to Inter.
- **Beats:** Open 0–1.20, Title 1.20–3.60, Names 3.60–7.60 (rows at 3.80, 5.05, 6.30), Logo 7.60–9.20, Note 9.20–11.76, Hold to 12.00.
- **Layouts and type** (`layout`, `type` tweaks, `auto` = the concept's own): `left` is the draft, measured from its PNG (`--set concept=draft` overlays it within a few px); `columns` is centred. `card` is the draft's Futura; `title` is the opening title's style (Inter Light, widely spaced caps, near-black `#141414`, the red dot `#e83144` over the Y). Titles use `textLength`, so the dot and widths don't depend on font metrics.
- Type stays crisp; bars, rules, pools, the lamp and the dot boil at 8 fps.

| | Concept | How it plays |
|---|---|---|
| A | Bars | the four-colour bar draws on; the title rises out of a slot; each row's side bar drops and its text wipes on; the logo wipes on, its slash draws up; rule, note |
| B | Lamp | the card hangs in the dark (a faint copy); a hanging lamp swings in and its banded pool reads it line by line, taking each row's ramp; on the note the lamp pulls up and the light opens over the whole card |
| C | Windows | `columns`, `title` type: three windows light up in turn in their ramps (orange's flickers), their blinds roll up, the name sits in the light |
| D | Develop | each line comes out of a blur posterized into its ramp's bands (rows in their group, the logo in red); the bands tighten onto the letters and the crisp line takes over |
| E | Drift | a last loose swarm of red posts (mixed kinds, three depths, near ones out of focus) drifts through right to left; the card appears behind it; gone by the note |
| F | Focus | `columns`: the whole card is there from frame 0, far out of focus over out-of-focus bokeh in the ramps; focus pulls line by line; slow pull-back |
| G | Ramps | the frame's dark is a ramp's dark: blue, teal on the second name, orange on the third, then the card's grey; a banded pool drifts behind the newest line |
| H | Dot | `title` type, the opening's near-black and faint grid: the red dot over the Y is a pen; it draws each row's bar, climbs the logo's slash, draws the rule and ends as the note's full stop |

## 15. End credits: round 2 (clean, from H)

`Credits.dc.html` + `credits.jsx` (helpers from `credits-concepts.jsx`, `window.FU_CREDITS`). The user: "H is the best, but too weird with the notification. Just do something simple and clean for now. Also using all the colours from the palette seems forced."

- **Look:** H's world: the opening title's near-black `#141414`, its faint 32 px grid, Inter in widely spaced caps (title weight 400, as in the opening; names Light). No Futura needed.
- **The dot** sits still just right of the Y's right arm, level with the cap height, as in the opening (`DOT`; `textLength` includes the 0.5 em spacing after the last letter, so the Y ends 25 px before `X + len`). It fades in just after the title and does nothing else (no pulse, no travel: that read as a notification).
- **No palette colours:** no four-colour bar, no coloured side bars; labels in grey `#8a8a88`, names off-white. The logo is off-white (`logo` tweak `red` gives the RUG red), so the dot is the only colour.
- **Layout:** one left column at x 180 under the title (labels and names aligned with it), the logo (380 wide) on the right, centred on the names, rule and disclaimer at the bottom left.
- **Motion:** every line fades in on its beat with a small rise (title, then the three names 1.25 s apart, the logo, the rule, the disclaimer). No camera move: a 2% push made the type step from pixel to pixel; the rule and the dot boil at 8 fps instead.
- **Render:** `node tools/render.mjs "Credits.dc.html"` (4K PNG sequence; add `--set logo=red` for the red logo).
- **Exported at 4K** (October 2026): white logo, PNG sequence and ProRes 4444, pop check clean (the only flagged step is the faint grid's fade-in moving one 8-bit grey level).
- **Round 3 (November 2026):** the research assistant's name is **Anastasija Zareckytė** (ė). The logo beat is now the funders' column on the right: label `IMPACT GRANT` level with the first row's label, the **RUG Faculty of Arts** logo under it (230 wide, `assets/rug-arts-logo.png`, made alpha-only from the user's black-on-white file); then, 0.7 s later, label `NWO OPEN COMPETITION SSH-XS` level with the last name's baseline and the **NWO** logo under it (see round 4). The `logo` tweak (`red`) now only tints the Faculty of Arts logo.
- **Round 4 (November 2026):** **the NWO logo is the user's file exactly as given** (`assets/nwo-logo.png`): a white sheet with the emblem and "NWO" cut out. The cuts at the sheet's edges are the logo's design, not a bad crop (do not redraw the ring or add a margin). It is tinted off-white like the other logos, with black (#000) behind it so the cut-outs and the letters read black ("NWO should be text in black"). 140 wide (the user found 110 a bit small). **Spacing:** the card is centred vertically with equal margins (~165 px): title baseline 205, row labels 335 / 475 / 615, names 56 below their labels, rule 797, disclaimer 845 / 880; funders: Faculty of Arts (220 wide) under a label at 335, NWO under a label at 671. **Readability:** labels Inter Bold in `#a8a8a5`, the disclaimer Inter Regular italic in `#9a9a97` (both were lighter weights in a darker grey). 
- **Round 5 (November 2026):** NWO and Groningen switched: **NWO first** (label at the first row's label, logo 125 wide, "a bit" smaller than 140), then **Impact Grant** and the Faculty of Arts logo (220 wide) under a label level with the last row's label; NWO arrives on the logo beat, the Faculty 0.7 s later. The card is re-centred: title baseline 218, row labels 348 / 488 / 628, rule 810, disclaimer 858 / 893. The Faculty of Arts logo is placed so its "faculty of arts" line sits on the disclaimer's last baseline (`ARTS_BASE`: that baseline is row 1049 of the 1000 × 1070 logo), with its label 18 px above the logo (label baseline ~644).
- **Smooth rise (November 2026):** the user found the text's rise jittery and wants to keep the rise. Chromium draws upright type snapped to whole pixels, so an 8 px rise over a second moves in one-pixel jumps. Fix: every arriving block is turned by **0.05°** about its own left edge (`Arrive`'s `px`), the smallest angle at which Chromium draws the glyphs as sub-pixel outlines (0.02° is not enough; `text-rendering`, skew, scale, CSS 3D transforms, filter offsets and big-then-scaled type all still snap). The tilt is under a pixel across a line. At 4K the rise then glides (measured: an eased curve, no jumps). The `--half` preview still steps (rendered at a different device scale), so make review previews from the 4K frames: `ffmpeg -framerate 25 -i renders/credits-false/credits-false_%04d.png -vf scale=1920:1080 -c:v libx264 -pix_fmt yuv420p -crf 18 preview.mp4`. **Exported at 4K** with all of the above (PNG sequence and ProRes 4444; every rise measured smooth, pop check clean apart from the grid's fade-in stepping one 8-bit grey level).
- **Red on the right (November 2026, from the user's sketch):** a filled red shape behind the funders, in two shades of the film's crisis red: `#a32e11` along the edge, and a darker band `#6e1d0c` inset 92 px, behind the logos, so the white reads. The edge is a cubic from the bottom (x ~610) up to the right edge near the top (y ~120), clear of the left column and the title; both edges carry a slow travelling wave (9 and 12 px) and the 8 fps boil, and slide in from the right over the first two seconds (the inner band 0.2 s behind). The funders' labels on the red are a light warm tone `#efc3b0` (grey was dull on red). The dot moved from the opening's pink-red `#e83144` to `#d03c1e`, in the same red family as the band. Not yet exported at 4K with ProRes.
- **Round after the red (November 2026):** the three names fade in **together** (on the first name's beat). The NWO logo has no black behind it any more: its cut-outs show the dark red. The red is lifted and widened (`EDGE` [[650, 1110], [890, 560], [980, 60], [1990, 10]]) so the dark band clears the funders' column: measured over the shot, at least 56 px above the NWO label (77 once settled) and 113 px left of the column; the left column keeps ~94 px (disclaimer) and ~114 px (title) to the red.
- **Less dead space, bigger logos, upright blob (November 2026):** the card spreads down: title baseline 200, row labels 345 / 510 / 675 (165 apart), rule 857, disclaimer 905 / 940 (bottom margin ~135). NWO 145 wide (was 125), Faculty of Arts 250 (was 220), still on the disclaimer's last baseline. The red's edge rises nearly upright from x ~1000 at the bottom (no empty red corner bottom left), then over the top: `EDGE` [[1000, 1110], [950, 560], [930, 0], [1990, -20]]. Measured while the funders are on screen: at least 108 px above the NWO label and 127 px left of the column; the title keeps ~80 px and the dot ~128 px to the red.
- **Timing (November 2026):** names from 3 s, slightly staggered; the disclaimer after them and fully in before 5 s; the logos at 5 s. Sections: Open 0–1.2, Title 1.2–2.8 (title at 1.3, dot ~2.2), Names 2.8–3.6 (rows at 3.0, 3.25, 3.5), Note 3.6–5.0 (rule 3.7, text 4.0, in by 5.0), Logo 5.0–6.6 (NWO at 5.0, Faculty of Arts 5.7; the logos use `CUES.Logo` itself), Read 6.6–11.76 (the full card holds), Hold to 12.00. **Exported at 4K** (PNG sequence, zipped).
- **Name order (November 2026):** on the card and in their arrival: Researcher Dr. Qinfeng Zhu, Research assistant Anastasija Zareckytė, then A film by Luca Lange (`ROWS` reordered in `credits.jsx`; the concepts keep the draft's order). Re-exported at 4K (PNG zip).


## 16. The three groups side by side: round 1 (layout concepts)

`Three Groups Concepts.dc.html` + `three-groups-concepts.jsx`. An early shot, 7.00 s, no SRT yet (word times are estimates): an overview of the three coping groups next to each other, each in its colour, labelled **withdrawal**, **open engagement**, **curation**. The user asked for layout ideas first (what they sit or stand on, the background), slightly playful, rough, not developed.

- **Beats:** Meet 0–1.40, Withdrawal 1.40–3.00, Open 3.00–4.60, Curation 4.60–6.40, Together 6.40–6.76, Hold to 7.00. Each label fades in with a small rise on its group's beat.
- **Actions (shared by every concept, `actor`):** a red post drops in at each person on their beat. Blue looks up at it, turns away (a flip through edge-on) and hunches. Teal raises a loupe and leans in; the lens shows the post larger. Orange looks through the loupe at arm's length, the post darts in, they turn away and keep the loupe pointed back at it over their shoulder ("a bit of both"). Teal and orange hold their loupes low from the start.
- **Look:** mixed beat, so the world outside the light is a neutral night (`NEUT`) and each group's light is in its own ramp (as in the alley's AE). People are `ToneBean`s lit by their own light; hair: blue none, teal beanie, orange long. Labels use the opening title's type (Inter Light, widely spaced caps), in each ramp's palest tone, except where the layout makes them a plaque or sign.

| | Concept | Layout |
|---|---|---|
| A | Plinths | three exhibits on plinths of different heights in a gallery, a ceiling spot each; labels are museum plaques |
| B | Dollhouse | one house in section, a room each with a ceiling lamp; labels on the cut floor slab |
| C | Swivel chairs | a talk-show stage, three swivel chairs under spots; blue swivels away, chair and all |
| D | Bus stop | one bench across three bays of a shelter, a strip light each; labels are the stop signs |
| E | Islands | three floating islands at different heights, bobbing, a lamp and a signpost each |
| F | Triptych | three panels, each its own ramp world with a window light (like three testimony portraits); captions below |
| G | Seesaw | blue and teal at the ends of a plank, orange balancing on the pivot; the plank tips toward whoever acts |
| H | Lamps | three hanging lamps in the dark (the Open Engagers opening, one per group); labels on the floor |

Render one: `node tools/render.mjs "Three Groups Concepts.dc.html" --set concept=C --half --guide --preview`.

## 17. The three groups side by side: round 2 (F · Triptych)

`Three Groups.dc.html` + `three-groups.jsx` (loads `curator-phone-kit.jsx` for `WarmPost`). The user chose the triptych and asked for better actions: withdrawal more dismissive; the loupe only appears when the hand comes up; curation without a loupe, more selective (taking some cards, scared of others). Same beats as §16.

- **Withdrawal, round 2** (`wd` tweak): the user found the swat and flick (round 1: `wave`, `flick`, removed) too jerky and wanted more than one card. Now five posts come at blue one after another, and every move eases in and out (no `hit`). A slow turn would hold the figure edge-on as a sliver, so the facing is `sign(c)·|c|^0.3` of `c = cos(π·turn)`: wide for most of the turn, edge-on for about a frame. Options: `turn` (default) slowly turns their back, arms folded, chin up; the posts gather behind them (below the label) and some drift off to the right. `walk` turns and walks out of the light into the corner (the walk cycle runs on the eased distance, so the feet stay put); the posts hang back. `blind` reaches up to the pull cord and draws the roller blind down: two posts came in through the window and go dark (filled cards cross-fade to outlines as the room dims, `light` 1 → 0.3), three more outside the glass are left as shadows on the blind; then they turn their back. `shoo` two slow, lazy waves push the posts aside, then they turn away. `--set view=wd` draws panel 0 four times at 0.75, one option each.
- **Curation:** the user chose `warm`.
- **Open engagement:** idle with no loupe until the hand comes up; the loupe pops in (a small overshoot) as it rises; they lean in, and the post turns its face to the lens.
- **Curation** (`cur` tweak, `warm` chosen): no loupe. Takes a card that floats into reach and holds it close; a red post flies past (in from the panel edge, just over and in front of their head, off at the top left, about 1.4 s on a curve through a point near the head) and they dodge it with a slight lean back and a tip of the head, timed to when it is closest; they take a second card, fanned with the first. (The user found the earlier version, a red post darting at their face with a big flinch and a duck, didn't make sense.) `warm` (default): the cards they take are comfort posts (`WarmPost`, cat and sun, through `tgWarm`, the orange ramp lifted); `red`: every card is a red post.
- **Labels and hair (user notes):** the labels are there the whole time, as a heading at the top of each panel (Inter Medium caps, 40 px, spacing 0.2 em, baseline y 196), centred on the panel (`Lbl` moves the centre right by half the letter spacing, which SVG also adds after the last letter), drawn behind the figure and the cards, and outside the camera push (a 3% push made the type step from pixel to pixel, a periodic jitter; `textRendering` geometricPrecision for the intro rise). Round 2 had them thin, small and floating just above the heads, which left the top of the panels empty. Hair: blue long, teal beanie, orange none.
- **Withdrawal chosen:** option 1, `turn`.
- **Timing (round 3, user: actions closer together and nearer the end, and an intro):** Intro 0–2.20, Withdrawal 2.20–3.16, Open 3.16–4.36, Curation 4.36–6.40, Together 6.40–6.76, Hold to 7.00. **Intro:** at frame 0 each panel is in its own ramp's darkest tone (an overlay of `RAMPS[g][0]` at 0.8) with the window light at 0.35, never black; the panels come up one after another, left to right (`glide` 0.15–0.85, 0.65–1.35, 1.15–1.85 s): the overlay lifts, the light rises to full and the label fades in with a small rise.
- **Cards fly freely across the panel borders** (user note): `Panel` draws in two parts, `base` (room, label, light, figure, intro overlay; clipped to the panel) and `cards` (cards and the loupe; not clipped). All three bases are drawn first, then all three card layers, so a card crossing into the next panel stays on top. Blue's posts that drift off leave up and out of the top of the frame. The comparison view (`view=wd`) keeps its cards clipped.
- **Set:** three panels with 6 px dark gutters, each its group's ramp (wall, a window light with blinds / bare / half-curtained, floor), out of focus; figures `ToneBean` at 1.9, lit by their window; labels in each ramp's palest tone. A 3% push over the shot.
- **Render:** `node tools/render.mjs "Three Groups.dc.html" --set wd=turn,cur=warm,view=shot,referenceOverlay=false --settle 150 --minSize 0.6`. **Exported at 4K** (November 2026, withdrawal `turn`, curation `warm`): PNG sequence only, 175 frames, pop check clean.

## 18. The crisis finding as a bar chart

`Crisis Bars.dc.html` + `crisis-bars.jsx`. Replaces the crisis scatter (the separate Python handoff `crisis_scatter_handoff_v6`: a 644-dot scatter that splits into three panels). Feedback: too complicated for a general audience. The user asked for a simple bar graph, made playful with the beanoids from the triptych (§17) in their actions, and for the y axis to be relabelled: it is the **likelihood of voting for a populist radical party**, not "political extremism".

- **Narration (v6 timing, 16.00 s):** Sample 0–4.00 "Across the sample, crisis exposure barely had any effect"; Closer 4.00–5.12 "but then we looked closer, group by group"; Withdrawal 5.12–6.32; Open 6.32–8.00 ("and there it was"); Curators 8.00–15.76 "the curators!"; Hold to 16.00.
- **Chart:** two clusters, **Less crisis exposure** and **More crisis exposure**, three bars each (withdrawal, open engagement, curation, in the group colours). Bars start at zero; faint gridlines, no numbers. The y axis is an up arrow with the title "Likelihood of voting for a populist radical party". Futura Bold (as the scatter), from the user's zip (`source/fonts/Futura-Bold.ttf`) into `fonts/` (git-ignored); falls back to Jost / Inter.
- **Values:** "less" and "more" are one point below and above the average on the mean-centred exposure scale (Table 4 slopes, Figure 3 levels at average exposure): withdrawal 26.8 → 24.6, open 29.7 → 26.7, curators 16.8 → 26.6; everyone (the pooled synthetic sample, slope −0.24) 26.2 → 25.7. The curators' "more" bar ends level with the others: the finding is the climb, not a gap.
- **Beats:** the six figures drop onto the floor; two grey "Everyone" bars rise with three figures on each, nearly level, while red posts circle over the "more" side. On "looked closer" each grey bar splits into three, the posts fly off and the bars sink to the floor. Each group's two bars then rise in its colour on its beat, carrying its two figures; on "the curators!" their "less" bar rises a little, then the "more" bar climbs, slower and higher; the other groups dim (bars and figures to 55%).
- **Characters:** the triptych's `ToneBean`s (hair follows the triptych; now blue long, teal beanie, orange none). On the "less" side they stand calm (one red post drifts slowly across the top: less exposure is not none). On the "more" side they do their triptych action, imported live from `three-groups.jsx` so they stay as designed there: blue turns their back (`wd` tweak: `turn`, `shoo`, `walk`), teal raises the loupe, orange takes comfort posts and flinches from a red one (`cur`: `warm`, `red`).
- **Not carried over from the scatter:** no "exposure slider" (bars compare people, never one person changing), and the dots are gone, so the synthetic-data note no longer applies to this shot. Still open from the handoff: confirm with Qinfeng that the outcome measure is the likelihood of voting for a populist radical party (the paper's pages call it "political extremism").
- **Render:** `node tools/render.mjs "Crisis Bars.dc.html"` (4K PNG sequence, about 0.25 s a frame at half size).

### Round 2 (three bars, texture, slider)

The user: "should be only three bars, also the bar needs some texture, and then maybe a slider for crisis exposure that shows only the orange bar reacting."

- **Three bars**, one per group (Withdrawal, Open Engagement, Curation), 190 wide. The opening is one grey "Everyone" bar with all three figures on it; it splits into the three on "looked closer".
- **Slider:** under the chart, "Crisis exposure on social media", from less to more (1 point below to 1 point above average). Its fill is the crisis red; red posts gather over the chart as it rises (post j arrives once the slider passes j / 12) and leave as it comes back. In the opening it slides to "more" and the Everyone bar barely moves; it slides back on "looked closer"; on "the curators!" (after orange's bar has risen at "less") it sweeps to "more" and only the orange bar climbs, 16.8 → 26.6, while the three figures do their triptych actions. The other two dim a little (to 70%).
- **Only orange reacts** (`others` tweak): `flat` (default) holds withdrawal and open at their level at average exposure (25.7, 28.2), since their slopes are not significant; `data` gives their small dips (−1.06, −1.54 per point).
- **Texture:** bars are toned like the people: value art lit from the upper left, darker toward the floor, through a `ToneFilter` in the group's ramp (edge 12, depth 0.45, grain 0.13), so they carry flat, irregular bands parallel to their outline. Each bar's filter region is a fixed box round it (moving sideways with it, fixed to the floor), so the bands keep one scale and hold still while the bar rises. The grey bar is toned as one shape with one light gradient across it, so it has no seams.
- **Data honesty:** the handoff had rejected an exposure slider in the scatter because moving dots implied one person's exposure changing. Here the slider compares people who saw less with people who saw more; the narration should not say a person's vote likelihood rises as they see more.

### Round 3 (plinths, wiggles, no reset)

The user: the toned bars' contours were too messy; use the plinths of the triptych's concept A instead; the slider should wiggle twice for each group so it is clear what moves; the grey at the start should move slightly with the slider; and the bars should not reset to zero at the split.

- **Plinths** (from `three-groups-concepts.jsx`, layout A): a dark gallery out of focus (`NEUT` ramp), a spot per plinth (cone and haze, out of focus, in the group's ramp), a floor pool, and the plinth in value (body light at the top, dark at the floor, a light lid, a shadow side) posterized through `fuGradeFg-<ramp>`, which gives its stepped bands. Museum plaques on the plinths (Futura caps, 15 px, on the ramp's palest tone). Figures `ToneBean` at 1.2, lit by their spot.
- **Opening:** one grey "Everyone" plinth (three abutting plinths under three white spots, the inner shadow sides appearing only as they split) in the neutral ramp. It follows the slider by the pooled slope, so it moves a few pixels: the honest "barely any effect".
- **Slider:** rests at the middle (average exposure) and wiggles twice (more, less, more, less, eased in and out) on each beat: Sample 1.75–3.85, each group's beat after its reveal. After the curators' wiggles it goes to "more" and stays. Red posts pop in place (a small overshoot) as it rises and shrink away as it falls, instead of flying in and out.
- **No reset:** on "looked closer" the grey plinth only splits (Closer is 0.6 s now: Withdrawal 4.60, Open 6.20, Curators 8.00). On each group's beat its spot and plinth take its colour and the plinth settles from the pooled height to its own (`lerp` of the two lines by the tint), then the slider wiggles. Each figure does its triptych action on its own beat.

### Round 4 (calmer plinths, only revealed plinths move, the end)

The user: too much noise on the bars; plinths not yet revealed wiggled (by the pooled slope, the wrong extent): with each reveal only the plinths already revealed should move, correctly, and not the next ones; around 10.5 s it looked like the animation was resetting; end on a short, slight, eased zoom to the curator instead.

- **Plinths:** the body in two bands (value 0.63 → 0.46 through the posterized grade), a light lid, a flat shadow side (`v(0.36)`); the floor pool moved into the out-of-focus spot haze (soft, no rings).
- **Who moves:** before the split the grey plinth follows the pooled line; after it, a plinth not yet revealed holds still at the pooled value at average exposure, and once revealed it settles to its own line and follows the slider by it. `others` now defaults to `data` (withdrawal and open dip by their own small slopes: about 30 and 43 px across the slider, orange about 137 px); `flat` is kept.
- **The end:** the curators' wiggle runs 2.25 cycles, so it ends at "more" and stays (it no longer drops back through "less" and climbs again, which read as a reset). At "less" two posts always stay (less exposure is not none). Then a 7% ease-in-out push anchored on the curator (11.0–13.2 s).
- **Type and the push:** the axis and the slider sit outside the push. The plaques are drawn outside it too, at their pushed place but never scaled, with the text snapped to whole 4K pixels (`px4k`): scaled or fractionally placed type stepped and jittered sideways by about a pixel (measured on the curation plaque); now it moves in one-pixel steps one way.

### Round 5 (solid coupling, 16:9 framing, a real camera, a hard baseline)

The user: withdrawal and open looked uncoupled from the slider toward the end, and plinths moved before the slider did; the coupling has to be solid. The plaques were inconsistent (over the shadow side's edge, wider than the plinth, smaller than it); the framing wasted space; the zoom was not a camera move (some assets scaled, the labels stayed); the soft pool under each plinth made no sense: use a hard white line, it is a graph.

- **Coupling:** a plinth's height is a pure function of the slider (checked frame by frame: no plinth changes height while the slider is still, outside the split). The grey plinth is there from the first frame (no rise). The one move that is not the slider's is the split, while the slider rests at the middle: the grey plinth parts into three and each settles to its own height at average exposure. A reveal only changes colour; a plinth not yet revealed holds still. Each wiggle starts 0.35 s after its reveal.
- **The camera** (the push toward the curator, 6%, 11.15–13.35 s) holds everything: set, plinths, figures, axes, labels and slider. Type moves with it smoothly at 4K (the Curation label: eased vertical motion, under a pixel of sideways noise).
- **Graph:** a hard white baseline (`#e9e7e1`, 4 px, boiling) that the plinths stand on, and a white y axis with its arrow; no floor pools. Labels are group names under the baseline, centred on each plinth (Futura Bold 30, lifted group colours), "Everyone" in white before the split.
- **Framing:** y axis at x 230; plinths 280 wide (lid overhang 10, shadow side 56) at 590, 1050, 1510; figures at 1.5; 15 px per point; the slider row along the bottom (title, less, track, more).
- **Split:** the inner shadow sides grow in width instead of fading in (a part-opacity flat tone banded when posterized).

### Round 6 (headroom, the fader on the right, softer dips, push on the bean)

The user: not enough headroom; the slider on the right, not at the bottom; blue's swing 15 px and teal's 21 px, orange unchanged; anchor the push on the orange bean.

- **Fader:** the slider is a vertical fader on the right (x 1760, "less" at the bottom 840, "more" at the top 340), filling red from the bottom to the knob, titled "Crisis exposure / on social media" above it. It is inside the camera like everything else.
- **Layout:** baseline at y 980, labels at 1024; plinths at 490, 930, 1370 (baseline 200–1580); figures at 1.3 (were 1.5). The scale is unchanged (15 px per point), so orange still swings 147 px.
- **Softer dips** (`others` = `soft`, default): withdrawal and open dip at about half their estimated slopes (−0.5 and −0.7 per point instead of −1.06 and −1.54), so they swing 15 and 21 px. `data` keeps the full estimates (30 / 43 px), `flat` holds them still. The narration should not quote their size; their slopes are not significant either way.
- **Push:** anchored on the orange bean (the middle of their body); the slider holds at "more" through the push, so the bean stands still on screen while the frame grows round them.

### Round 7 (a bolder fader, smaller dips)

The user: the slider is easy to miss, make it thicker and more dominant; halve the blue and teal range again.

- **Fader:** track 24 px (was 9), red fill `RED[4]`, knob radius 36 with an 8 px `RED[3]` ring, title 34 px and "more" / "less" 28 px in white. At x 1715 (was 1760), so the push at the end does not crop its title.
- **Dips** (`soft`, default): −0.25 and −0.35 per point, so withdrawal and open swing 7.5 and 10.5 px across the slider (orange 147 px). About a quarter of their estimated slopes (−1.06, −1.54), which are not significant; `data` keeps the estimates.

### Round 8 (the curators end on top, as in the paper's figure)

The user: at maximum exposure teal was still the highest, which does not match the paper's graph, where curation starts much lower and ends slightly higher.

- **Why:** at ±1 point the slider ended where the curators' line crosses open engagement's (x 1.0 in Figure 3), and the softened dips had lifted teal a little at that end.
- **Range:** the slider now spans 1.5 points either side of average (`X_RANGE`), well inside Figure 3's plotted range (−3.1 to 2.8). Curators 14.3 → 29.1: far below at "less", just above both others at "more" (teal 27.9, blue 25.4 with the softened dips; 25.9 and 24.1 with the full estimates). Orange now swings 221 px (was 147).
- **Softened dips** rescaled to keep 7.5 and 10.5 px over the wider range: −0.167 and −0.233 per point (about a sixth of the estimates).
- **Exported at 4K** (round 8): `node tools/render.mjs "Crisis Bars.dc.html" --set referenceOverlay=false --settle 150`, PNG sequence only, 400 frames, about 2 s a frame. The renderer names the folder after the `--set` value (`renders/crisis-bars-false/`); it was renamed to `renders/crisis-bars/crisis-bars_0000.png` … `_0399.png`. Pop check clean (every flagged step is an 8 fps boil step); the first six frames are small files because the shot fades up from the dark.

## 19. The curator's weight: round 1 (concept frames)

`Curator Weight Concepts.dc.html` + `curator-weight-concepts.jsx` (loads `curator-phone-kit.jsx` for `WarmPost`). A curator shot to replace the Vulnerability alley (found too complex), placed after the curator at the table, as the curators' counterpart of the open engagers' table. Line, for reference only (the user: don't be too literal): "They bear the weight of vulnerability, produced by the ongoing crisis, by platforms built to keep you scrolling, and inequality in who gets heard." No SRT or length yet.

The user asked for still concept frames only, no animation. Each runs on a 4 s clock with small sways; frame 50 is the still. The world is the curator ramp; screens are the lights; red comes in through the posts and the news on the TV.

| | Concept |
|---|---|
| A | Over the shoulder: the back of the curator's head above the sofa back, the news on the TV (a politician at a podium, lower third, ticker), the phone's glow spilling over the sofa back; posts come off both screens |
| B | The family on the couch, front view, the TV where the camera is: four curators side by side, each lit from below by their own phone, each phone throwing its own post up (the table's opposite: everyone alone with their own screen) |
| C | Black mirror: the TV is off; its dark glass fills the frame and holds the room, the curator lit only by the phone, posts faint round them |
| D | The eye, macro: the side of the head in bands, the eye a crisp dark disc, the phone's feed reflected in it (warm and red posts), posts sliding round the curve |
| E | Close-up (`BeanBust`): a small screen with a red bar reflected in each eye, lit from below by the phone and by the TV's flicker; big posts pass out of focus |
| F | Awake: in bed at night, the phone on the nightstand lights the ceiling; a post hangs in the pool, outlines drift in the dark |
| G | Surrounded: TV, tablet, laptop, phone, each a light, each sending posts toward the curator |
| H | Endless scroll: side view on the sofa, the feed rises out of the phone as a ribbon of warm and red cards, out of the frame |

Sheet: `curator-weight-concepts-sheet.png`. Render one: `node tools/render.mjs "Curator Weight Concepts.dc.html" --set concept=D --half --guide --frames 50`.

Build notes: front-view sitters on a sofa (`couchSitter`) sink into the seat cushion and the seat front covers their legs; lying figures are drawn upright and rotated, with their lights given in the unrotated frame (`unrot` in F); TV content is clipped to its screen per instance (`TVNews id`).

## 20. The curator's weight: round 2 (concept D, the eye)

The user chose D from §19 and asked for the reflection to start from the curator phone shot's POV (phone and hand), then a glance up to reveal a TV on the wall (still in the reflection), then a glance back to the phone; the camera stays locked on the eye and the reflection follows the look. As the user suggested, the POV is built first as a shot of its own, then mapped into the eye. `Curator Eye.dc.html` + `curator-eye.jsx`; `--set view=pov` shows the POV alone, `view=eye` (default) the eye.

- **Timing (estimates, no SRT yet), 9.00 s:** Phone 0–2.92, Up 2.92–3.60, TV 3.60–6.08, Down 6.08–6.80, Phone2 6.80–8.76, Hold to 9.00. The guide captions spread the line over this. Thumb swipes at 0.32, 1.42, 2.36, 7.12, 8.02; the news cuts from the anchor beside a falling chart to the politician at the podium at 4.84 (round 2 swapped them); a notification slides onto the phone at 5.5 (seen at the bottom of the frame while the eyes are on the TV), the phone buzzes; it goes at 7.5.
- **The POV's camera** is one pitch angle, from -0.64 rad (on the phone) to 0 (on the TV). Every set piece has an elevation e and sits at screen y = 540 - F·tan(e - pitch), F 1000, so the wall compresses toward the frame edges like a lens and nothing slides as a flat layer. Head moves overshoot 3% and settle (`lookAt`). The phone is held by the body, so it drops out of the bottom of the frame when the head goes up (its top stays visible) and dips slightly lower while the eyes are away.
- **Focus follows the gaze**, a beat after the head (0.12 s): on the phone, the room is soft (blur 9) and the phone sharp; on the TV, the wall and TV sharp and the phone soft (blur 7). Grades posterize first and blur after (`GradeBlur`), so soft areas stay banded. While the eyes are on the TV the wall's ramp drifts 10% toward red.
- **Set:** the curator phone shot's phone, mitt and feed (`curator-phone-kit.jsx`), a coffee table and rug below, the sofa's arms at the edges (very soft), the wall with the TV (`TVNews`), a sideboard with a plant, a picture, a curtained window; the TV's light breathes on the wall; red posts drift round the TV.
- **The eye:** the POV is drawn with a margin (it needs more than 1920 × 1080: the eye is round), bowed by a displacement map baked once on a canvas (a point at radius r shows the POV at r·(1 + 0.55·ρ²), ρ = r / 600), mirrored (a reflection), scaled into an eye of radius 360 and darkened toward its rim, with a catchlight. The camera is locked on the eye; as the eye turns up, the face around it moves down 34 px and the light on the skin moves from the phone below toward the TV.
- **Fixed:** a red-graded group whose posts all lay outside the frame drew a dark square in the top-left corner; only posts inside the frame are drawn now. The phone's focus blur with a frame-wide region left a black smudge in the same corner while the blur grew; its region now hugs the phone and hands.
### Round 2 (beanoids on the TV, no flicker, the eye rebuilt on the rig)

The user: flicker in the POV; the people on the TV should be beanoids; swap the two TV shots and give the new second one (the politician) "Trump hair". The eye was too big for the face and too curved; the contours moved during the glances, which made sense but did not read as real, and seemed inverted; add something behind so the camera move reads.

- **Flicker** came from the TV's light flickering in value on posterized layers (the wall glows, the sideboard top, the coffee table): each small value change pushed whole bands across a threshold, so large areas jumped between tones. The light now breathes in size (radius ±5%, slow), never in value; the flash at the cut is gone. The ticker wrapped every 180 px, swapping bars of different widths; it now runs on continuously. The notification's glow grows in size too.
- **TV people** are beanoids from the front (`TVBean`: the Bean's round head over the top of its egg, eyes at ±0.34 r, lit from the left), in the TV's red grade like the rest of the news. First the anchor beside the falling chart (drawn in as the eyes reach the TV), then the politician at the podium with a swept-over blond hairdo (a high swoop over to the front, comb lines, a side piece) and a long tie.
- **The eye** is now in the rig's proportion: the head is the Bean's head at 56 × the rig (eye 3.8 : head 26), placed and tilted by `FU_BEAN.rig` (the pose tilts from 20° down on the phone to -4° on the TV, about the neck, as the rig does). The camera is locked on the eye at (1180, 540), so the profile's edge shows on the left with the room behind it.
- **Bands like the rig's:** darker toward the outline (a radial falloff, which is the edge field of a circle), brighter on the side the lights are on (the phone below and in front, the TV in front), a little noise, posterized to the curator ramp, cut to the crisp outline (`HeadMacro`). The lights stay where they are in the room, so as the head tilts the bands shift a little round it. ToneBean itself cannot run at this scale: its edge blur needs a filter surface of several gigabytes and the page hangs.
- **Behind the head:** the room in front of the curator, out of focus (a window with bars, the TV's glow, a shelf), moving at 0.6 of the camera's move, so the glance reads as the head tilting while the camera follows the eye.
- **Less curvature:** the reflection bows at K 0.25 (was 0.55).
- **Head boil:** the band boil on the close-up head is 0.012 × amp (the rig's 0.035 × amp made whole bands crawl at 8 fps at this scale).

### Round 3 (closer, clean band edges)

The user: crop in further so the eye is bigger; the band edge round the highlight was noisy, wandering and jagged.

- **Closer:** the head is now 80 × the rig (eye radius 304, was 213), the eye locked at (1290, 540); the room still shows in a strip past the profile.
- **Clean bands:** the head is toned in JS (`headImage`): the value field (ambient, the lights, the circle's edge falloff, low-frequency noise fixed to the head so it turns with it, a faint 8 fps boil at 0.0025 × amp) is computed in floating point on a grid, posterized to the curator ramp on a canvas, and each band edge is antialiased over one pixel from the field's own gradient; the image is cut to the head's crisp outline. The SVG filter did the same in 8 bits: on a gentle light gradient the 8-bit steps made the edges stair-step (about every 13 px) and wander with the noise.

### Round 4 (the camera fixed to the head)

The user: the spatial arrangement was wrong. When he looks up at the TV the background should go down, and the face should get more lit.

- **Cause:** round 2 kept the camera on the eye's position while the head tilted about the neck: the eye swung up and back by nearly 1000 px, so the room slid sideways (and only partly down), and the head turned away from the TV's light.
- **Now the camera is fixed to the head**, locked on the eye: the face holds still on screen (a breath of movement only; the head is level, tilt 0, lean 8, so the gaze is 8° below level). Looking up turns the head back by `HEAD_TURN` 26°; to the camera the room turns the other way about the eye (anticlockwise), so the room in front of the face drops. It is laid out as seen while looking at the phone: the TV where the turn brings it straight ahead along the gaze, a window and a lamp above that come down into view.
- **Lights swing round the face** with the same turn (`headLight`: degrees below the gaze, intensity): on the phone, the phone 18° below the gaze leads (0.7) and the TV is above (0.24); on the TV, the TV straight ahead leads, brighter (0.92), and the phone falls 44° below (0.28). Each light is brightest where the head's surface faces it and spreads over about a quarter of the head, so the front of the face round the eye lights up on the TV. One light leads at a time: two equal lights from above and below pinched the bands at eye level. The edge falloff is gentler (from 0.5 of the radius to 0.42 at the outline), so the lit side reaches the outline as in the rig.

### Round 5 (the room slides; round 3's bands, inverted)

The user: the background should slide, not rotate; they liked round 3's contours on the face more, and asked for those, inverted.

- **The room slides** straight down (`ROOM_SLIDE` 540 px) as he looks up; the head and camera stay fixed. Laid out as seen on the phone: the TV glow ends straight ahead of the face, a window and a lamp above come down into view.
- **Bands:** round 3's again (edge falloff from 0.3 of the radius to 0.56 at the outline; each light a broad lobe, centred 0.85 r toward its side, 1.9 r wide), with round 3's behaviour inverted: there the face lost its highlight as he looked up; now it gains it. On the phone: phone 18° below the gaze at 0.45, TV above at 0.2 (darker, bands parallel to the outline); on the TV: the TV straight ahead at 0.78, the phone 44° below at 0.25 (a light lobe beside the eye).

### Round 6 (face-light variations)

The user found the face's contours odd and asked for variations; the rule for all: the face gets brighter as he looks up. `--set face=<key>` (default `lobes`); with `--guide` the variant's name shows top left.

| Key | Variant |
|---|---|
| `lobes` | A · round 5: the TV light comes in as a lobe beside the eye |
| `moon` | B · the head as a sphere lit by one light that swings from below (phone) to the front (TV), brighter on the TV; the terminator crosses the face like a moon's phase |
| `wrap` | C · the same light wrapped round the head: wide, slow bands |
| `lift` | D · the lobes' lights held half way, so the contours stay put; every band's colour slides up one tone |
| `patch` | E · screen-shaped patches: the phone's small upright patch under the eye fades, the TV's wide patch rises from below over the eye |
| `rings` | F · rings of light open out from the eye |
| `sweep` | G · light fills the face from its front edge backward; near-straight contours travel across the face |

## 21. The last shot: round 1 (concept stills)

The user is replacing the second alley shot (Resistance, §13) with a last shot on the same line: "Coping is a form of resistance. The question is, what do people have to resist with?" The first alley is being reworked as the eye shot (§19–20). Brief: all three groups visible again, zooming out a bit on "coping". Two ideas, each built on a shot the audience has already seen. `Coping Concepts.dc.html` + `coping-concepts.jsx` (loads `curator-phone-kit.jsx` for `WarmPost`), on the Resistance timing (10.00 s: Resistance, Question, With, Tail, Hold). Stills at frame 150 (6.0 s).

- **1 · Pillars** (`concept=pillars`): Crisis Bars (§18) at its end state, without the axis, labels and slider: the same plinths under their spots, the same heights (slider at "more", curators just on top), the hard white baseline, the same three beanoids (hair as there) at 1.3, now hanging out. Blue sits on the left edge of their plinth, legs dangling, facing away from everyone, chin up, leaning back on a hand. Teal sits on the right edge facing orange, legs dangling, looking up at them, a hand half raised. Orange stands at the outer edge of the highest plinth inside the red swarm and almost falls: leaning out over the drop, looking down, arms windmilling, the back foot lifted. Camera: a zoom out from 1.2 to the whole row over 0.3–3.2 s.
- **2 · Triptych** (`concept=triptych`): Three Groups (§17): the same three window-lit panels in their ramps, no labels, each now a group, figures at 1.25 (kids 0.62 of that, head 1.3). Blue: three friends in a huddle away from the window, talking (one arms folded), their backs to six red posts by the window. Teal: a family; the two kids study one post through loupes (the triptych's loupe, the lens showing the post larger, each lens on the line from the kid's eye to the post), each parent leans in with a hand on a kid's shoulder (IK). Orange: the curator alone in the empty room (front view), hand to head, eyes going from side to side, a comfort post (cat) in the other hand. A 3% push over the shot.

## 22. The last shot: round 2 (three house interiors)

The user chose the triptych (concept 2), "a bit more realistic, so it reads as three house interiors: subtle walls in between, some furniture", animated, 10 s, with a subtle slide from left to right. `Coping.dc.html` + `coping.jsx` (loads `curator-phone-kit.jsx`). Sections as Resistance: Resistance 0–3.04, Question –4.52, With –7.76, Tail –9.76, Hold –10.00; word times from `timing_4.srt` (in `Piece`).

- **Set:** one row of three rooms in section, 720 wide, with thin cut walls (34 px) between them and a ceiling and floor slab, flat neutral `#151716` with a slightly lighter cut edge (no ramp tint, no boil). Each room is its group's ramp and keeps the triptych's window light (blue blinds drawn, teal bare, orange a curtain half across): back wall, cornice, skirting and floor out of focus (`fuGradeBg`), furniture in value through `cpMid-<ramp>` (posterized, blur 2.2). Blue: a sofa, a floor lamp, a plant, a picture. Teal (kitchen): shelves with jars, a counter, a table and chair. Orange: an armchair, a side table with a cup, a plant, a small picture, a lot of empty floor.
- **Camera:** one slow slide over the whole shot (`glide` 0–10 s), so it opens on blue and teal and ends on the curator alone (round 3: zoomed, see below). Layers are graded outside the camera transform and clipped per room inside it.
- **Blue:** three friends in a huddle, taking turns: A talks, B (arms folded) answers from "the question" to "resist", the third (front view) looks at whoever speaks. Seven red posts slip in through the blinds one by one and gather behind them by the window. Nobody looks.
- **Teal:** a family. A post comes in through the window (0.3–1.9 s) and settles between the kids; they look up at it, raise loupes (the lens pops in as the hand rises, showing the post larger) and lean in; the parents lean in and put a hand on each kid's shoulder on "resistance"; on "people" one kid looks up at their parent, who nods.
- **Orange:** the curator alone, front view, a comfort post (cat) in one hand, looking down at it; on "the question" they look up and round; on "what do people" the hand goes to the head. Red posts pass outside the window behind the curtain, out of focus (5.2–8.4 s); their eyes follow them.
- **Round 3 (user notes):** the loupes' refraction did not make sense: each lens now lies over its own part of the post (one kid's on the upper left, the other's on the lower right; the post 2.3, at the kids' eye height, nearly still once held), and inside the lens the post is drawn magnified 1.7× about the lens centre, clipped to the lens. The handle runs from the lens down toward the kid, the hand on its end (IK); kids at ±86, parents at ±182 so their hands reach the kids' shoulders. Camera zoomed to 1.22, anchored on the bottom of the frame (the floor slab stays at the bottom, no dead space at the top; windows lowered to y 380), so the slide covers more (787 → 1441 world x). Walls thinner (22) and lighter (`#2c302e`, no cut-edge lines). Rooms are clipped in screen space outside the grades, so the blurred back wall no longer darkens toward the walls. More posts: blue 12 (one every 0.7 s, drifting once in), teal 4 drifting round the window besides the one the kids study, orange 11 passing outside, seen only through the glass (`cpGlass`, blur 4.5).
- **Round 4 (user: cards should fly in from the top edge of the frame, not just appear):** every card inside a room (blue's twelve, the post the kids study, teal's four others) starts above the top edge of the zoomed frame (world y 90; the frame's top is y 195) and flies down to its place (`flyIn`: an ease-out cubic, a sideways bow, fluttering and swinging until it settles); none fades or grows in. The posts outside the curator's window still pass by behind the glass.
- **Render:** `node tools/render.mjs "Coping.dc.html" --half --guide --preview --settle 60` for review; final `--set referenceOverlay=false --settle 150`.
