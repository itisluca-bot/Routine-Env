# Bean rig (side view)

The user chose look **04 Bean** from the Stickman Rig Sheet (live preview: https://claude.ai/artifact/SLzMwBUbG6tZJVgyaBt2dM). The code is in `rigs/bean-rig.jsx`. It is an exploration rig for people in the film. It does not replace the `Fig` rig that the Open Engagers shots use now, unless the user says so.

## Look
- **Body:** an egg, 108 px tall from 14 px below the hip to 94 px above it. It is 56 px wide at the hips and 36 px wide at the shoulders, and the belly is pushed 4 px forward. It is filled with the group's body colour.
- **Head:** always a circle (the user's one fixed rule). It has r 26, sits 6 px above the shoulder, and is offset 6 px forward. It is filled with the group's head colour. The eye is a 3.8 px dot in `#0e0e0e`, placed at 0.52 r forward and 0.12 r up. Boil only changes the head's radius by a fraction of a pixel.
- **Legs:** round-capped strokes, 9 px wide, bending at the knee. Each ends in an oval shoe (rx 11, ry 5) set 7 px in front of the ankle.
- **Arms:** round-capped strokes, 8 px wide, bending at the elbow. They have no hands.
- **Depth:** the far leg and far arm are darker, mixed toward the background as in `Fig`. The near arm is drawn over the body and is slightly lighter.
- **Phone (optional):** a solid white `#f3f1ea` phone held in the near hand. A faint beam runs to the face, and a lit crescent appears on the face; its points meet the head's outline.

## Skeleton
- **Origin:** the floor point under the hips. The figure faces +x, and `dir: -1` flips it.
- **Bone lengths (px):** thigh 46, shin 46, torso 84 (hip to shoulder), upper arm 44, forearm 42.
- **Pose fields:**
  - `legN` / `legF`: [thigh angle, knee bend]
  - `armN` / `armF`: [shoulder angle, elbow bend]
  - `lean`: torso tilt about the hip
  - `tilt`: head tilt, where + looks down
  - `hx`: hip shift
  - `phone`: 0 to 1
  
  Angles are in degrees from straight down, and + is forward.
- **Ground lock:** the lowest foot is always placed on the floor, so walking and weight shifts stay grounded without extra keys.
- **Built-in poses:** `idle`, `walk` (in place; the ground travels at about 150 px/s), `phone`, `talk` and `flinch`. Each is a pure function of `T`. `blendPose(A, B, t)` crossfades between two poses.

## Use in a shot
Load the rig after the engine:
`<x-import … from="./animations-v3.jsx ./tweaks-panel.jsx ./rigs/bean-rig.jsx ./your-shot.jsx">`

Then use it in the shot:
```jsx
const { BeanFig, POSES, PAL } = window.FU_BEAN;
<BeanFig x={960} y={820} pose={POSES.phone(T)} c={PAL.cur} T={T} boil={boil} boilAmp={boilAmp} id={3} />
```
- **Props:**
  - `x`, `y`: position
  - `dir`: facing
  - `s`: scale
  - `pose`
  - `c`: a `PAL` entry (`wd`, `open`, `cur`) or `{ body, head, lite }`
  - `T`: drives the 8 fps boil
  - `boil`, `boilAmp`
  - `eye`
  - `weight`: limb stroke multiplier
  - `headScale`
  - `op`: opacity
  - `id`: unique per figure on screen
- **Rules:** the standing rules in `CLAUDE.md` apply. Design at 1920 × 1080 on the `#0e0e0e` background, with no grey people.

## Front view (`BeanFront`)
The same Bean seen from the front, added for the Vulnerability shot (people peeking from behind their front doors).
- **Look:** the same egg body (symmetric, no belly shift), the round head and the leg strokes with outward-pointing shoes. Two dot eyes, at ±0.34 r.
- **Pose fields:** `hx`, `lean` (torso roll about the hip), `tilt` (head roll about the neck), both in degrees with + toward screen right; `look: [x, y]` moves both eyes (-1..1, + is right / down); `legL`, `legR`: [angle, knee]; `armL`, `armR`: [angle, bend], where + is away from the body, or `{ to: [x, y] }`, a point in the figure's own frame (origin at the floor under the hips, unscaled) for the hand, with `elbow: 'in'` to bend the elbow toward the body.
- **Props:** as `BeanFig` (no `dir`, no phone), plus `arms={false}` to leave the arms out.
- **Use:** `const { BeanFront } = window.FU_BEAN; <BeanFront x={960} y={820} s={0.55} pose={{ lean: 10, tilt: 8, look: [1, 0] }} c={PAL.cur} T={T} id={4} />`
