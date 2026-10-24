# Look exploration: bringing the animations closer to the testimony portraits

Status: **exploration, October 2026.** Nothing here is approved yet. Feedback on the finished animations (Open Engagers, Vulnerability, Topography) was that they feel too different from the rest of the film, which is built around re-animated testimony portraits. The old standing rule against imitating those portraits is outdated.

## 1. What makes the portraits look the way they do

Measured from four reference stills (k-means, 7 clusters per frame):

| | Portraits | Our animations |
|---|---|---|
| Colour | The whole frame lives in **one ramp** of the speaker's group colour: 7 tones from a tinted dark to a pale cream | Saturated group colours side by side on near-black |
| Darkest tone | Tinted: `#472a1d` (orange), `#131d27` (blue), `#1b3836` (teal). **Never black** | `#0e0e0e` |
| Brightness | Median 48–131 of 255; the frame is mid-toned | Mostly black, with a grey lamp cone |
| Subject | Posterized into 4–6 flat, blobby bands | One flat fill per body part |
| Outline | 3 thin light lines and a thick outer band, separated by dark gaps, with a soft shadow toward the figure; they follow a smoothed silhouette | None (Topography has rings, which is why it already sits closest) |
| Depth | Sharp subject, heavily out-of-focus background | Everything equally sharp |
| Framing | Head and shoulders, the subject filling half the frame | Small full figures in a wide set |

The ramps are in `rigs/fu-look.jsx` (`RAMPS.cur`, `open`, `wd`, plus a matching `red`).

## 2. The kit: `rigs/fu-look.jsx` (`window.FU_LOOK`)

Scenes are authored in **value** (greys, `v(0.6)`) and coloured by a grade, the same way the portraits are photo luminance mapped onto a ramp.

- `LookDefs`: per ramp, `fuGradeBg-<ramp>` (smooth gradient map + depth-of-field blur), `fuGradeFg-<ramp>` (posterized), `fuTone-<ramp>` (figure posterize with organic band edges), plus the shading gradients.
- `ToneBean`: the Bean rig drawn in value and posterized into its group's ramp; `rings` adds contour rings. Side and front views.
- `RingStack` / `RingGroup`: **vector** contour rings. A shape stroked with a round join of width 2d is exactly the shape offset by d, so each ring zone is the figure's parts redrawn fatter, painted from the outside in. Hidden fillets (neck, crotch) round the rings off. `RingGroup` puts one set of rings round several figures; `extra` parts (a table) join them.
- `BeanBust`: the Bean in close-up, built from the rig's own proportions ×9 (round head over the narrow top of the egg), for portrait framing.
- `PostValue`: the red post in value, for the red ramp.
- `lookFilterMarkup`: a whole-frame regrade, used by `tools/render.mjs --look`.

Performance notes: rings were first built as a chained blur/threshold SVG filter, which took about 90 s per frame at 4K (each chained blur multiplies the cost). The vector rings cost almost nothing. `feTurbulence` is also too slow on the CPU, so the organic warp uses noise textures baked once on a canvas.

## 3. Concepts (`Look Concepts.dc.html`, `--set concept=<key>`)

| Key | What it shows |
|---|---|
| `tone` | ToneBean sheet, three groups, no rings |
| `rings` | The same with contour rings |
| `ringvar` | Thin rings, portrait-pattern rings, one ring set round a family, only the hero ringed |
| `bust` | BeanBust in three groups (no detail / far-side shadow; no hair / short / long) |
| `lamp` | The open engagers lamp in a teal world: out-of-focus room, light pool posterized into bands, ringed teal figure, red posts |
| `table` | The dinner table, family and table ringed as one portrait |
| `door` | The curator child behind the door window, close; the child's ramp slides toward red as out-of-focus posts pass in front |
| `alley` | Withdrawal-blue night street out of focus; one window keeps a warm curator ramp |
| `voice` | Teal BeanBust framed like a testimony portrait, room out of focus behind |
| `mask` | The stock-footage colour-mask look: neutral grey world, coloured glowing figure |
| `cut` | Ring match-cut: wide lamp → push in → BeanBust → rings multiply outward until they fill the frame (the cut point to a real portrait) |

Each runs on a 4 s clock; the page starts paused because the filters are heavy.

## 4. Regrading finished shots without touching them

```sh
node tools/render.mjs "Open Engagers.dc.html" --set variant=2 --half --frames 50,300,460 --look open:map
node tools/render.mjs "Open Engagers.dc.html" --set variant=2 --look open:lift          # keeps orange and red
node tools/render.mjs "Curation Topography.dc.html" --look cur:map
```

- `map`: the whole frame on one ramp, smooth. Strongest match, but other groups lose their colour (the orange curator turns teal).
- `poster`: the same, banded.
- `lift`: keeps every hue, lifts black to the ramp's dark and pulls white toward its cream. Mixed-group shots survive.

The same grade could equally be done in Resolve or After Effects with a gradient map on the PNG sequences.

## 5. Open questions for the user

1. **Background.** The ramp worlds replace `#0e0e0e` with the ramp's dark tone. Is the black background still a rule?
2. **One ramp per shot, or per figure?** The portraits are one group per frame. Mixed shots (teal family, orange child) can keep per-figure ramps inside a world graded to the beat's main group.
3. **How far toward the portraits?** Steps from light to strong: regrade only → ramp world + depth of field → posterized figures → rings → bust framing.
4. **Rings on everyone, or only on the person a beat is about?**
5. **Red.** In the portraits there is no red. Keep red posts as the one off-ramp accent, or let red seep into the ramp (as in `door`)?
