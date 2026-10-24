# The toned look: bringing the animations closer to the testimony portraits

Status: **direction agreed, October 2026.** Feedback on the first animations (Open Engagers, Vulnerability, Topography) was that they feel too different from the rest of the film, which is built around re-animated testimony portraits. The old rule against imitating the portraits is outdated. The rig (`rigs/fu-look.jsx`) and the mockups (`Look Concepts.dc.html`) follow the decisions below. Open Engagers, Vulnerability Alley and Resistance have been rebuilt in the look; Topography has not yet.

## 1. Decisions

| Topic | Decision |
|---|---|
| People | **Toned Bean** (`ToneBean`): the Bean rig posterized into flat bands of its group's ramp. Same skeleton, poses and proportions as `BeanFig` |
| Contour rings | **None.** No rings on people (they were explored and dropped) |
| Eyes | **Always sharp**: crisp dots in the ramp's darkest tone, drawn after the toning, never blurred or posterized |
| Bands follow the light | The bands come from the scene's own lights. Dynamic lights (streetlights, dangling or swinging lamps, a phone screen) move the bands as they move |
| Hair | Per character: `none`, `beanie` (a knitted cap with a folded brim) or `long` |
| Red post | Same 32 × 42 card and outline as before, with **mixed faces**: posts use all nine `kind`s mixed, so a swarm reads as varied content (see §3) |
| Background | **Black is not a rule.** Scenes live in a group's ramp; the ramp's tinted dark replaces `#0e0e0e` |
| Scenes | The mockups' approach is liked: a ramp world, out-of-focus backgrounds (depth of field), light pools posterized into bands |
| Red | Comes in **through the posts** (the red crisis content), and possibly through some story beats (for example a ramp sliding toward red, as in the `door` mockup) |
| Transitions | No ring match-cut into the portraits. Not needed |
| Mixed beats | Beats with several groups need creative lighting choices, decided per shot. Open Engagers: **light that belongs to a group is in its ramp** (the curator's lamp beam is orange in a teal world, and the teal lamp's light turns orange where it falls on the curator's house). See ANIMATION-GUIDE §8 |

## 2. What makes the portraits look the way they do

Measured from four reference stills (k-means, 7 clusters per frame):

| | Portraits | First animations |
|---|---|---|
| Colour | The whole frame lives in **one ramp** of the speaker's group colour: 7 tones from a tinted dark to a pale cream | Saturated group colours side by side on near-black |
| Darkest tone | Tinted: `#472a1d` (orange), `#131d27` (blue), `#1b3836` (teal). **Never black** | `#0e0e0e` |
| Brightness | Median 48–131 of 255; the frame is mid-toned | Mostly black, with a grey lamp cone |
| Subject | Posterized into 4–6 flat, blobby bands | One flat fill per body part |
| Depth | Sharp subject, heavily out-of-focus background | Everything equally sharp |

The ramps are `RAMPS.cur`, `open`, `wd` in `rigs/fu-look.jsx`, plus a matching `red` for the posts.

## 3. The rig: `rigs/fu-look.jsx` (`window.FU_LOOK`)

Scenes are authored in **value** (greys, `v(0.6)`) and coloured by a grade, the same way the portraits are photo luminance mapped onto a ramp.

```jsx
const { LookDefs, ToneBean, BeanBust, PostValue, v } = window.FU_LOOK;
<LookDefs ramps={['open']} bf={bf} amp={amp} />                       // once per <svg>
<g filter="url(#fuGradeBg-open)">…room, in value…</g>               // smooth map + depth-of-field blur
<g filter="url(#fuGradeFg-open)">…lamp, light pool, props…</g>      // posterized map
<ToneBean x={960} y={880} s={1.15} pose={POSES.idle(T)} ramp="open" hair="beanie"
  lights={[{ x: bulbX, y: bulbY, i: 0.95, reach: 420 }]} bf={bf} amp={amp} id={1} />
<g filter="url(#fuGradeFg-red)">…PostValue cards…</g>                // red only through the posts
```

### ToneBean
- Props as `BeanFig` (`x`, `y`, `s`, `dir`, `pose`, `headScale`, `op`, `id`, `bf`, `amp`), plus `view` (`'side'` or `'front'`, with `BeanFront`'s pose fields), `ramp` (a `RAMPS` key or 7 colours), `lights`, `amb` (value with no light on it, default 0.34), `hair`, `hairTone` (default 0.16), `phone` (side view).
- **Lights** are in the figure's own world coordinates: `{ x, y, i, reach }` is a point light (intensity 0–1, half strength at `reach` px); `{ dir: [dx, dy], i }` is a directional light pointing into the scene. Each part (body, head, hair) is brightened from the light's side and dimmed with distance; limbs take the light at their middle joint. Without lights a figure gets `DEFAULT_LIGHTS`, a soft key from the upper right. The phone is itself a light on the face.
- **How the bands are made** (`ToneFilter`): the lit value art is multiplied by an edge field (the silhouette blurred), so every part darkens toward its outline and the bands run parallel to it; a little low-frequency value noise makes band edges irregular like the portraits, and a smaller one boils them at 8 fps; the result is posterized to the ramp and then cut to the **exact silhouette**. The outline is the rig's own crisp shape with the usual 8 fps boil; nothing warps it.
- Arms are drawn lighter than the body (as in `BeanFig`), so a near arm over the belly reads as an arm.
- **Hair is toned as its own layer** (back hair, then the body, then front hair; filter `fuHair-<ramp>`, no grain), so a hat or a fall of hair keeps clean bands. The beanie is one even surface; its fold is a crisp crease drawn after the toning, like the eyes. Hair takes less light than skin (`gain` 0.35).

### BeanBust
The Bean in close-up, head and shoulders, built from the rig's own proportions ×9 (the round head over the narrow top of the egg), for portrait framing. Same `ramp`, `lights`, `hair`, `amb` props, plus `turn`, `tilt`, `nod`. Origin at the bottom centre of the frame edge.

### Other pieces
- `PostValue({ x, y, rot, s, flip, outline, kind })`: the red post in value, drawn inside `fuGradeFg-red`. `kind` is one of `POST_KINDS`: `text` (the original: a header and a line), `image` (a photo with a caption), `headline`, `avatar` (a poster's avatar and name, then text), `video` (play button, progress bar), `chart` (a line that drops), `alert` (a warning badge), `feed` (three short posts), `reactions` (text with a row of reactions). Posts are **double-sided**: a card turned past edge-on (`flip < 0`) shows the same face on its back, the right way round (never mirrored). `outline` is the card in the dark (edge only). **Decided: mix the kinds** (for example `POST_KINDS[i % POST_KINDS.length]` per post, as in the `posts` sheet).
- `GradeFilter` (smooth or posterized gradient map, optional blur), `GlowFilter` (the stock-footage colour-mask glow), `lookFilterMarkup` (whole-frame regrade for `tools/render.mjs --look`).
- Performance: everything renders in about a second per 4K frame. `feTurbulence` was too slow on the CPU, so noise uses textures baked once on a canvas.

### Fixed along the way (don't reintroduce)
- **Lopsided side profile.** The phone's face light was an unclipped disc that stuck out past the head; an organic displacement warped the silhouette by the same amount on thin limbs and the head as on the body; the legs were too dark to read. Now the face light is a light source, the outline is never displaced, and limbs are mid-toned.
- **Acute corners on the front view's belly.** Circular band edges from a radial gradient met the egg's outline at shallow angles and left slivers. The edge field makes bands run parallel to the outline instead.
- **Beanie tabs and steps.** The cap hugs the skull at its lower edge and only swells above it (it used to stick out past the head as ledges). The brim is no longer a separate, lighter value: an edge in value between brim and crown made light bands jog there, which read as stairs.

## 4. Mockups (`Look Concepts.dc.html`, `--set concept=<key>`)

| Key | What it shows |
|---|---|
| `tone` | ToneBean in three groups, side and front, mixed hair |
| `hair` | None, beanie, long; side and front |
| `light` | Moving lights: a lamp swinging over a figure; a figure walking past a streetlight |
| `bust` | BeanBust in three groups (no hair, beanie, long), lit by a lamp |
| `posts` | The nine red post faces, large; the same in the dark (outline); a mixed swarm at shot scale |
| `lamp` | The open engagers lamp in a teal world, room out of focus, light pool in bands, red posts |
| `table` | The dinner table under the lamp |
| `door` | The curator child behind the door window; a story beat where the child's ramp slides toward red |
| `alley` | Withdrawal-blue street out of focus; one window keeps a warm curator ramp |
| `voice` | BeanBust framed like a testimony portrait, lit by a window |
| `mask` | The stock-footage colour-mask look (neutral world, glowing figure), kept for comparison |

Each runs on a 4 s clock; the page starts paused because the filters are heavy.

## 5. Regrading finished shots without touching them

```sh
node tools/render.mjs "Open Engagers.dc.html" --set variant=2 --look open:lift   # keeps orange and red
node tools/render.mjs "Curation Topography.dc.html" --look cur:map
```

`map` puts the whole frame on one ramp (other groups lose their colour), `poster` does the same in bands, `lift` keeps every hue and only replaces black with the ramp's dark. The same grade can be done in Resolve or After Effects with a gradient map.

## 6. Explored and dropped

- **Contour rings** (around single figures, a whole family, or growing into a match-cut). Built as vectors: a shape stroked with a round join of width 2d is the shape offset by d, so each ring is the figure's parts redrawn fatter. Dropped by the user. A first version as a chained blur/threshold filter took about 90 s per 4K frame.
- **The ring match-cut** into a testimony portrait.

## 7. Next

1. The finished shots are re-rendered in the toned look, one shot per session, following §8. Done: Open Engagers, Vulnerability Alley (preview; 4K not yet exported), Resistance (preview; 4K not yet exported).
2. Lighting choices for mixed beats (several groups in one frame): decide with the user, per shot.

## 8. Moving a finished shot to the toned look (checklist for a new session)

**Where the work is.** Everything for this film lives on branch `claude/festive-ramanujan-0f2ir9`. The repository's default branch does not contain `feeding-uncertainty/`, so start your branch from that one (`git fetch origin claude/festive-ramanujan-0f2ir9` and branch from `FETCH_HEAD`). Run `npm install` in `feeding-uncertainty/`; the renderer falls back to the pre-installed Chromium if Playwright's own browser is missing.

1. Read `CLAUDE.md`, `ANIMATION-GUIDE.md` (its "what is approved" section for the shot), this file and `rigs/BEAN.md`. **Keep everything approved**: timing, staging, camera, motion, beats. Change the look only.
2. Render a few frames of the shot as it is now (`--half --frames …`) to compare against.
3. Add `./rigs/fu-look.jsx` to the page's `<x-import>`, after `./rigs/bean-rig.jsx`. Put `<LookDefs ramps={[…]} bf={bf} amp={amp} />` in the `<svg>`.
4. **World ramp:** the group the beat is about. For a beat with several groups, propose lighting options and ask the user before choosing.
5. **Background and sets:** replace the `#0e0e0e` / `C.bg` ground with the ramp. Wrap far sets in `fuGradeBg-<ramp>` (out of focus) and near props and light pools in `fuGradeFg-<ramp>` (posterized). Existing coloured sets (`TerraceHouse`, `RowHouse`) can go inside a grade as they are, since the grade maps luminance; use `GradeFilter` with `gain` to lift a dark set into the ramp's middle tones.
6. **People:** `BeanFig` → `ToneBean` (same `pose`, `x`, `y`, `s`, `dir`, `id`); `BeanFront` → `ToneBean view="front"`. `ramp` is the person's group. Pass the scene's lights, computed from the same functions of `T` that move the lamps (a swinging lamp's bulb, a streetlight's lantern, a phone). Hair per character: ask the user if it is not settled.
7. **Red posts:** `Card` → `PostValue` inside `fuGradeFg-red`; a `Card` in the dark (`lit` near 0) → `PostValue outline`. Mix the kinds across the posts (`kind={POST_KINDS[i % POST_KINDS.length]}`).
8. **Light as the transition device** (beams that reveal and hide): keep the mechanism. The unlit copy outside a beam becomes the same value art, darker.
9. Review at half resolution with `--guide`, run the pop check (ANIMATION-GUIDE §6), send a 1080p preview, then render the final 4K sequence without `--guide`.

Per shot:
- **Open Engagers** (`open-engagers.jsx`, variant 2): **done** (October 2026). How it was done, useful for the next shots: sets kept their own colours and go through a small local `Grade` filter whose region is the element's own box (so it works inside the camera transform, unlike `GradeFilter`'s fixed 1920 × 1080 region); lit copies posterized with `gain` 2.6, dark copies smooth with gain about 0.9 (posterizing a dark copy collapses it into the darkest tone); to make one light read as another group's, its inside is redrawn in that ramp (a second ground or set copy masked by the beam). Simple props (lamp, table, chairs, dust, haze) are drawn straight in ramp colours, no filter.
- **Vulnerability Alley** (`vulnerability-alley.jsx`): `BeanFront` curators peeking behind curtains, `TerraceHouse` rows, streetlights, blue and teal glows behind shutters. Mixed beat; the `alley` mockup shows one option (a blue world with a warm curator window). The earlier city version (`vulnerability.jsx`) was found too busy and replaced by the alley. **Done** (October 2026, `env` = `AE`): no world ramp. A neutral night (Open Engagers' street and sky), muted brick, a neutral white streetlight; each group's colour comes from its own light (blue and teal glows wash their own facades, curators toned orange in the lamp light, red posts). Options A–E are kept behind the `env` tweak; see ANIMATION-GUIDE §10.
- **Resistance** (`resistance.jsx`, camera `track`): **done** (October 2026, `look` = `toned`), following the Vulnerability alley's AE, since it is the same kind of street: no world ramp, a neutral night (`NEUTRAL`), the row outside the light in its own muted brick (`TDARK` 0.6), the lit brick in its own colours, the neutral white streetlight. Each group's colour comes from its own light: the glow in each window and the room light in each doorway are in the group's ramp (`GCOL`, room from a dark base toward the ramp's tone 5), and the windows wash their own facade in their ramp (`rsGlowG-<ramp>`, at `GLOW_K` 1.5, fading with blue's shutter and flickering with orange's window). People are front-view `ToneBean`s lit by the streetlights and, from behind, their own room light. Posts are `PostValue` (mixed kinds) through `rsRed`, a bbox grade (the street is wider than `LookDefs`' fixed 1920 × 1080 grade region). `look=old` reproduces the shot before the look exactly. Two fixes kept local to the shot: long hair through `rsHair-<ramp>` (edge depth 0.12 instead of the rig's 0.5, which drove the hair's outline into the darkest tone, a dark rim; the rig is unchanged, so Open Engagers' and the alley's long hair still have it), and unlit upper windows given variety (shutters, blinds, curtains, nets) instead of plain black glass.
- **Curation Topography** (`curation-topography.jsx`): uses its own top-down figure (`TopPerson`), which has no toned version yet; build one the same way (value art + `ToneFilter` + crisp details). Its rings are the shot's metaphor (the curator's buffer), not portrait rings: confirm with the user that they stay.
