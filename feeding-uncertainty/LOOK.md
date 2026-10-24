# The toned look: bringing the animations closer to the testimony portraits

Status: **direction agreed, October 2026.** Feedback on the first animations (Open Engagers, Vulnerability, Topography) was that they feel too different from the rest of the film, which is built around re-animated testimony portraits. The old rule against imitating the portraits is outdated. The rig (`rigs/fu-look.jsx`) and the mockups (`Look Concepts.dc.html`) follow the decisions below. The finished shots have not been rebuilt yet.

## 1. Decisions

| Topic | Decision |
|---|---|
| People | **Toned Bean** (`ToneBean`): the Bean rig posterized into flat bands of its group's ramp. Same skeleton, poses and proportions as `BeanFig` |
| Contour rings | **None.** No rings on people (they were explored and dropped) |
| Eyes | **Always sharp**: crisp dots in the ramp's darkest tone, drawn after the toning, never blurred or posterized |
| Bands follow the light | The bands come from the scene's own lights. Dynamic lights (streetlights, dangling or swinging lamps, a phone screen) move the bands as they move |
| Hair | Per character: `none`, `beanie` (a knitted cap with a folded brim) or `long` |
| Background | **Black is not a rule.** Scenes live in a group's ramp; the ramp's tinted dark replaces `#0e0e0e` |
| Scenes | The mockups' approach is liked: a ramp world, out-of-focus backgrounds (depth of field), light pools posterized into bands |
| Red | Comes in **through the posts** (the red crisis content), and possibly through some story beats (for example a ramp sliding toward red, as in the `door` mockup) |
| Transitions | No ring match-cut into the portraits. Not needed |
| Mixed beats | Beats with several groups need creative lighting choices. **Open: next session** |

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

### BeanBust
The Bean in close-up, head and shoulders, built from the rig's own proportions ×9 (the round head over the narrow top of the egg), for portrait framing. Same `ramp`, `lights`, `hair`, `amb` props, plus `turn`, `tilt`, `nod`. Origin at the bottom centre of the frame edge.

### Other pieces
- `GradeFilter` (smooth or posterized gradient map, optional blur), `PostValue` (the red post in value), `GlowFilter` (the stock-footage colour-mask glow), `lookFilterMarkup` (whole-frame regrade for `tools/render.mjs --look`).
- Performance: everything renders in about a second per 4K frame. `feTurbulence` was too slow on the CPU, so noise uses textures baked once on a canvas.

### Fixed along the way (don't reintroduce)
- **Lopsided side profile.** The phone's face light was an unclipped disc that stuck out past the head; an organic displacement warped the silhouette by the same amount on thin limbs and the head as on the body; the legs were too dark to read. Now the face light is a light source, the outline is never displaced, and limbs are mid-toned.
- **Acute corners on the front view's belly.** Circular band edges from a radial gradient met the egg's outline at shallow angles and left slivers. The edge field makes bands run parallel to the outline instead.
- **Beanie tabs.** The brim is the strip of the cap above its lower edge, clipped to the cap.

## 4. Mockups (`Look Concepts.dc.html`, `--set concept=<key>`)

| Key | What it shows |
|---|---|
| `tone` | ToneBean in three groups, side and front, mixed hair |
| `hair` | None, beanie, long; side and front |
| `light` | Moving lights: a lamp swinging over a figure; a figure walking past a streetlight |
| `bust` | BeanBust in three groups (no hair, beanie, long), lit by a lamp |
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

1. Lighting choices for mixed beats (several groups in one frame).
2. How the finished shots move to the toned look: regrade only, or rebuild with ToneBean and scene lights.
