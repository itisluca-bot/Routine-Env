# Feeding Uncertainty: handoff for Claude Code

Read this first. It covers the film, the rules the user has set, what was built and rejected (and why), how the code works, and how to make the next shots. Read `CLAUDE.md` as well; it holds the standing rules in short form.

---

## 1. The film

- **Title:** *Feeding Uncertainty*. An animated explainer of about 8 minutes, made for the University of Groningen (RUG).
- **Source:** Qinfeng Zhu's draft paper *"Vulnerability and Coping in Turbulent Times"*. It is a mixed-methods study in the Netherlands on social media crisis exposure, coping, and political extremism.
- **Research design:** a two-wave panel survey (W1 n=1,095, Oct 2025; W2 n=673) plus 25 interviews. The study identifies three coping patterns, which the film calls **withdrawal**, **open**, and **curators**.
- **Key finding:** crisis exposure predicts extremism **only among curated engagers** (curators).
- **Structure:** three acts.
  1. "Everyone feels it"
  2. "Self-defense"
  3. "Soothing, not resolving"
- **Voices:**
  - The two researchers, Dr. Qinfeng Zhu and Anastasija, narrate and are filmed on camera.
  - Participant interview cuts carry Acts 1 and 2. The participants are consolidated into **nine voices**, heard only, with no names and no party affiliation. **A voice never moves to a different coping group.**
- **Look:** Vox-style motion graphics.
  - Speaking characters are abstract and low-fidelity, possibly hand-drawn, and each has a fixed colour.
  - Participants appear as **posterized portraits**: about 5–6 flat tonal bands in their group colour, surrounded by **concentric contour rings**, against a blurred, tinted background.
  - The film also uses stock crowd footage of people on phones, where some figures are colour-masked in their group colour.
- **User's pipeline:** edits in DaVinci Resolve, designs in Photoshop and Illustrator, animates in After Effects, and uses Claude. Claude's animations are delivered as **4K PNG sequences** that the user brings into Resolve/AE. **Grain is added in post.**

### Reference stills (`uploads/`)
| File | Shows |
|---|---|
| `Still … _1.1.1.jpg` | Dr. Qinfeng Zhu on camera with a lower-third ("Rijksuniversiteit Groningen / Dr. Qinfeng Zhu", white sans) |
| `Still … _1.11.1.jpg` | Anastasija on camera |
| `Still … _1.12.1.jpg`, `_1.14.1.jpg` | Stock crowd with phones; some figures colour-masked (orange, slate blue, teal) with a soft glow |
| `Still … _1.17.1.jpg`, `_1.21.1.jpg`, `_1.24.1.jpg`, `_2.4.1.jpg` | Posterized participant portraits with contour rings, in orange/brown (curators), teal (open) and blue (withdrawal) |
| `timing_1.srt` | Word-level timing for the narration line of the shot built so far (see §5) |

---

## 2. Standing rules (from the user; apply to every shot)

- **Resolution:** design in **1920 × 1080** coordinates and render/export at **3840 × 2160** (4K UHD). Everything is vector, scaled up 2×.
- **Frame rate:** **25 fps**. SRT timings land on 25 fps frames.
- **Background:** RGB 14/14/14, **`#0e0e0e`**.
- **Group colours:**
  - withdrawal **`#46647a`**
  - open **`#5fa69a`**
  - curators **`#e0a165`**
  - radicalization / crisis red **`#a32e11`**
- **Grain:** none; it is added in post.
- **Line boil:** **8 fps**, **subtle**, with an **amplitude slider** (default 0.5 px, range 0–3 px) and an on/off toggle.
- **Tails:** add **6 frames (0.24 s) of idle at the end** of a shot, where only the boil and small sways move.
- **Not wanted:**
  - kinetic typography
  - overly literal visual metaphors
  - grey or neutral people (only blue, teal and orange)
  - ~~imitating the existing posterized-portrait look in new animation~~ **Outdated (October 2026).** Feedback on the finished animations was that they feel too different from the rest of the film, so the user now wants to explore bringing them closer to the portraits. See `LOOK.md`.
- **Narration guide:** an on-screen caption of the line is fine as a toggle for timing review. It must be off for renders.
- **Keep to what's asked:** when given feedback, change only what was asked.

---

## 3. What was built, and the decisions behind it

The brief was to animate the people so they act, while staying consistent with the existing footage and portraits. The first test shot uses this narration (8 s):

> "Curation soothes for a bit, but it does not resolve. When crisis content breaks through, it lands harder, and starts to feel inescapable."

### Round 1: four concepts (`Curation Segment Concepts.dc.html`, archive)
- **A · Halo:** a close-up posterized curator whose rings are the buffer. **Rejected** at the time because it imitated what the user already has (that rule is now outdated; see `LOOK.md`).
- **B · The Room:** a stock-footage-style crowd lit by phones; her phone turns red, and the red spreads phone to phone. **Liked**, but the phone-holding figure was too basic.
- **C · Blinds:** at home, red light through window blinds. **Rejected** for the same reason as A.
- **D · Topography:** a top-down view where her rings become terrain and the red is a rising tide. **Liked**, but the red was too sudden and fast. The user wanted to see orange being soothed first, then the red gradually breaking through.

### Round 2 (`Curation Segment Concepts v2.dc.html`, archive)
B was given a better phone-holding pose, and D was given a gradual seep. **The user chose D.**

### Final direction: Topography (`Curation Topography.dc.html` + `curation-topography.jsx`), CURRENT
The user's direction, which should be kept:
- **No walking away.** The orange person stays in place inside the crowd, and the camera simply focuses on him.
- **Only blue, teal and orange people.** No grey.
- **The red's behaviour carries the meaning.** The red is **around everyone, evenly**. Blue and teal **let it in evenly**: their rings take on a slight tint and they stay calm. **Orange actively blocks it**: his rings hold the red at their edge, until it **breaks through**. The point is that the others can deal with the red and orange cannot.
- **Smooth, never stepped.** Breakthrough is one continuous wedge travelling inward. It must not jump from ring to ring.
- **The red boundary is his outermost ring, exactly**, including its boil wobble. No new rings appear while the red is pushing. All rings are grown during the soothe beat.
- **All rings give way a little, progressively** (outer rings most). Deformation is a smooth Gaussian dent with no sharp corners. The rings **relax back to round** once the red has filled.
- **The red inside his rings starts at the same strength as outside** where it crosses the outer ring, and only **deepens toward him**. There must be no sudden red disc.
- **No figure or ring overlaps.** The crowd is spaced so no two sets of rings touch.
- **Figure model = option "1e · Wedge silhouette"** (see `Top-down Figure Options.dc.html`):
  - an ellipse body with a trapezoid wedge from the shoulders narrowing to the phone, implying the arms
  - a round head
  - the phone is **one solid colour**: white `#f3f1ea`, turning red `#ff4a2e`
  - the light beam is a trapezoid from the phone to the face. **The hand edge, phone edge and beam edge all converge at the same two points**, the phone's inner corners at x=38, y=±8 in figure space.
  - the beam's outer corners land **on the edge of the head circle**
  - the lit patch on the face is a **crescent whose points meet the head's outline**, not a rectangle
- **Rings are drawn as vector paths, not SVG blur filters.** The earlier approach (blur alpha → discrete threshold table) looked buggy because of 8-bit alpha banding at large blur radii: the outer rings jagged and shimmered. Do not go back to it.

---

## 4. How the code works

### Runtime
- **`*.dc.html`** files are "Design Components". This is a single-file format the previous environment used. `support.js` (included) is its runtime: it parses the `<x-dc>` template, mounts React, and loads `.jsx` files listed in `<x-import from="…">`, transpiling them with Babel in the browser.
- **Serve over HTTP**, because `file://` blocks the `.jsx` fetches. For example: `npx serve .` or `python3 -m http.server`, then open `Curation Topography.dc.html`.
- In Claude Code you can keep this structure, or move to a plain `index.html` + Vite/React. The scene code in `curation-topography.jsx` is plain React (`React.createElement` via JSX) with no DC-specific APIs beyond the engine globals below.
- Only `<script>` tags in `<helmet>` run. The two inline scripts there are:
  - `window.OM_SCENES`: the JSON scene list (names, durations in seconds, descriptions). **This is the single source of timing structure.**
  - `window.TWEAK_DEFAULTS`: tweak values (`motionEditor`, `referenceOverlay`, `lineBoil`, `boilAmp`).
- The previous environment had a host timeline editor (scene trims, speed) and a host video export. **Neither exists in Claude Code.** The in-page player bar (play, pause, scrub) still works, and so does the in-page 4K renderer.

### Engine: `animations-v3.jsx` (exports to `window`)
- `<CompositionStage width height scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg>` wraps ONE component, the whole piece. It owns the clock, scaling, the play bar, and the seek event `data-om-seek-to-time-frame` (`detail: {time, sync: true}`). That event is dispatched on the `<svg data-om-exportable-video-with-duration-secs>` element.
- `useComposition()` returns `{ T, CUES, authoredTotal }`. `T` is time in seconds. `CUES.SectionName` is the start time of that section (the running sum of `dur`s in `OM_SCENES`).
- `Shot`, `Captions`, `Easing`, `interpolate`, `animate`, `clamp`.
- **Render everything as a pure function of `T`.** Nothing is driven by effects or rAF, which is what makes seeking and frame-accurate rendering work.
- `tweaks-panel.jsx`: `useTweaks`, `TweaksPanel`, `TweakSection`, `TweakToggle`, `TweakSlider`, `TweakButton`… This is the floating control panel. On a plain page the panel is hidden until the host activates it; in Claude Code you may want to make it always visible, or replace it with a simple controls div.

### Scene file: `curation-topography.jsx`
- **Coordinates:** `W,H = 1920×1080` for design and `OUT_W,OUT_H = 3840×2160` for the stage. `Piece` renders a 1920×1080 div scaled ×2 inside the 4K stage.
- **Motion helpers (use only these three plus `osc`):**
  - `glide`: easeInOutSine, for settles, drifts and the camera
  - `hit`: easeOutExpo, for impacts and flips
  - `build`: easeInCubic, for approach and pressure
  - Each is called as `fn(T, start, end, from, to)`.
  - `osc(T, period, phase)` is a sine for idle motion.
- **Colour:** `mix(hexA, hexB, t)`.
- **Boil:** `boilFn(frame, id, amp)` returns a deterministic radial wobble function of the angle (sum of sin 2θ, 3θ and 5θ with hashed phases). The frame is `Math.floor(T*8)`, which gives 8 fps. `polarPath(cx, cy, rAt, N)` turns a radius function into a closed path. `boilPath(...)` is a boiled circle.
- **`TopPerson`**: the figure model 1e, drawn with the beam and phone (see §3).
- **`CROWD`**: 24 blue and teal people `{x, y, r(otation), k:'wd'|'open'}`, spaced at ≥ ~230 px apart. Each has 4 boiled rings at r = 68 + 12j.
- **`Topography({T, q, boil, boilAmp})`**: the shot. The hero sits at (960, 540), and the breach direction is `th0 = -0.62` rad.
  - **Soothe:** rings grow from 5 to 8 (`count`), and a warm breathing glow pulses on them (`calm`, `breathe`, `ringCol`).
  - **Ambient red:** `redA` rises evenly. It is drawn as a full-frame red rect, masked to exclude his protected region `prot`.
  - **Pressure:**
    - `pressure` and `push` drive the soft red edge glow along his outer ring.
    - `ringAt(i)` deforms every ring by `squeeze` and `dentAmt`, weighted by `ringW(i)`, so outer rings deform more, plus inner rings once the red has reached them.
    - The dent is Gaussian around `th0`.
    - `relax` returns the rings to round after `land`.
  - **Breach:** `protAt(phi)` returns the min of the outer ring and a wedge whose tip radius `tipR` falls linearly from `crack` to `land`. It widens with angular lag, and `around` sweeps it all the way round in the Inescapable beat.
  - **Inside red:** a radial gradient `tSeepG`, clipped to the outer ring's exact path, goes from `redA` at the outer ring to `seepIn` near him. The red ring lines use the gradient `tSeepL`.
  - **Acting:** `heading` (he turns toward the pressure, flinches with `recoil`, then `look` makes him look around), `sMe` (his scale), and `redP` (his body turning red).
  - **Camera:** `sc`, `rot` and a small `lean` toward the breach. The camera is always on him.
- **4K render:** `renderSequence(fps, onProgress)`, triggered by the "Render 4K PNG sequence (25 fps)" button in Tweaks. For each frame it:
  1. seeks
  2. waits two rAFs
  3. clones the stage `<svg>`
  4. rasterises it at 3840×2160 on a canvas
  5. adds it to a zip as a PNG (JSZip, loaded from jsDelivr)

  It then downloads `curation-topography_4K_25fps.zip` (`topography_0000.png` …). **A single frame was tested and was correct; a full end-to-end run was not completed.** In Claude Code a more robust route is to drive the same seek event from **Playwright/Puppeteer** at a 3840×2160 viewport, screenshot each frame, and optionally run `ffmpeg -framerate 25 -i topography_%04d.png -c:v prores_ks -profile:v 4444 out.mov`.

---

## 5. Timing of the Topography shot (25 fps, total 8.24 s)

`OM_SCENES`:
| Section | dur (s) | Starts at | Beat |
|---|---|---|---|
| Soothe | 1.6 | 0.00 | Glow and breathing; rings grow |
| Unresolved | 1.3 | 1.60 | Red rises evenly; others let it in; his rings hold and brighten |
| Breakthrough | 1.9 | 2.90 | Pressure dents his rings; cracks on "breaks" (`crack` = 3.96) |
| Lands | 1.0 | 4.80 | Reaches him on "it lands" (`land` = 5.04); second hit on "harder" (`harder` = 5.40) |
| Inescapable | 2.2 | 5.80 | Red sweeps around all rings; he looks around, stops; rings relax |
| Hold | 0.24 | 8.00 | 6 idle frames |

`uploads/timing_1.srt` (word timings, s):
- curation 0.12
- soothes for 0.52
- a bit, 1.12
- but it 1.64
- doesn't 1.84
- resolve. 2.08–2.52
- When 3.04
- crisis 3.16
- content 3.52
- breaks 3.96
- through, 4.20–4.56
- it lands 5.04
- harder 5.40
- and 5.76
- starts to 6.08
- feel 6.56
- inescapable. 6.80–7.52

Beat times are anchored to section cues in code (e.g. `crack = CUES.Breakthrough + 1.06`), so retiming a section in `OM_SCENES` carries its beats along.

---

## 6. Files

| File | Status |
|---|---|
| `HANDOFF.md` | this document |
| `CLAUDE.md` | standing rules (short form) |
| `Curation Topography.dc.html` + `curation-topography.jsx` | **current final shot** |
| `Top-down Figure Options.dc.html` | figure-model options 1a–1e; **1e chosen** |
| `Curation Segment Concepts v2.dc.html` + `curation-concepts-v2.jsx` | archive: round 2 (The Room v2, Topography v2) |
| `Curation Segment Concepts.dc.html` + `curation-concepts.jsx` | archive: round 1 (A Halo, B Room, C Blinds, D Topography). Contains the posterized `Bust` rig (blur → posterize → contour rings), kept for reference only |
| `animations-v3.jsx` | animation engine (§4) |
| `tweaks-panel.jsx` | tweak controls |
| `support.js` | DC runtime (§4) |
| `uploads/` | reference stills + `timing_1.srt` |

---

## 7. Making the next shots

1. Get the narration line and its **SRT** from the user. Ask which coping group(s) appear, and whether the shot continues the Topography world or needs a new setting.
2. Start from a copy of `curation-topography.jsx`. Keep the helpers: motion, `mix`, `boilFn`/`polarPath`, `TopPerson`, the 4K scaffold and the renderer. If several shots share them, consider extracting the helpers into a shared `fu-common.js`.
3. Write the `OM_SCENES` list first: one section per narration beat, plus a 0.24 s `Hold` at the end. Anchor the beats to word timings from the SRT.
4. Keep every frame a pure function of `T`. Something should always be moving (boil, sways, a slow camera), and the motion should be smooth and gradual, with no stepped transitions.
5. Respect §2. Present 2–4 variations when the direction is open; the user likes to pick between them.
6. Before showing a shot, check frames straddling every section boundary for pops.
