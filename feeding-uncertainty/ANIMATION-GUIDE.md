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
3. **The toned look** (October 2026, `LOOK.md`). The rig and mockups are done. Open engagers is the first shot moved to it; Vulnerability Alley and Topography are next.
5. **Curators on the phone** (`timing_0.srt`, 9s4f = 9.16 s). Round-1 concepts (§11); the user chose **A · Long press** (§12).
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
- **Hands against the phone:** hands are lifted out of the ramp's darkest tones (`phTone` from tone 2 up behind the phone, `phToneF` from tone 3 up in front), so the thumb's edge band never merges with the phone's dark body.
- **The cat post:** the cat's body sits on the photo's bottom edge, cropped by it (it used to hang over the frame). The friends photo the same way (and without the hairline strip that ran along its top). The double-tap heart pops where the thumb tapped, beside the cat's face, in a dark tone with a light rim (cream on the cream photo vanished), rides on the card and fades before the feed scrolls on.
- **Room glow:** the bedroom's glow follows the screen's brightness (`screenLight`: red area on screen and the menu's dim lower it), softer than concept B. The room and hands drift a little toward red (at most 0.2) while a red post fills the screen.
