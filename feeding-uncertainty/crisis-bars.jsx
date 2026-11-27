// Feeding Uncertainty — crisis exposure and the populist radical vote, as a simple bar chart (16.00 s). Round 5.
// Replaces the crisis scatter (handoff v6), which was found too hard to read for a general audience.
// Narration (v6 timing): 0–4 s "Across the sample, crisis exposure barely had any effect" / 4 s–7.8 s "but then we looked
// closer, group by group, and there it was" / 8 s "the curators!"
//
// The bars are the plinths of the triptych's concept A (three-groups-concepts.jsx): a plinth per group under its own
// spot, posterized into its group's ramp (two bands, a light lid, a flat shadow side), standing on a hard white baseline.
// A plinth's height is the likelihood of voting for a populist radical party. On each stands one of the triptych's
// beanoids (three-groups.jsx, shared through window.FU_THREE_GROUPS, so they stay as designed there).
// A vertical fader on the right sets crisis exposure on social media ("more" at the top); it rests at the middle (average)
// and wiggles twice on every beat. Red posts pop in over the plinths as it rises and go as it falls.
//
// Coupling: a plinth's height is a pure function of the slider. The one exception is the split, where the slider rests at
// the middle: the grey plinth parts into three, and each settles to its own group's height at average exposure.
//   Sample: one grey "Everyone" plinth (there from the first frame) follows the slider by the pooled line: a few px.
//   Closer: the split (above).
//   Withdrawal / Open / Curators: the group's spot, plinth and label take its colour (height unchanged); the slider
//     wiggles; the figure does its triptych action. Plinths already revealed follow the slider by their own line; the
//     ones still to come hold still. The curators' wiggle ends at "more" and stays; then a short, slight camera push
//     toward the orange bean, anchored on them (the whole frame, type included).
//
// Values. The slider runs from 1.5 points below to 1.5 above the average on the mean-centred exposure scale (X_RANGE).
// Curators: 21.7 + 4.91·x (Table 4 slope, Figure 3 level), 14.3 → 29.1: far below the others at "less", just above them
// at "more". Withdrawal and open: `others` tweak (see SOFT). Everyone: the pooled synthetic sample, 25.9 − 0.24·x.
// Every frame is a pure function of T.
const { W, H, OUT_W, OUT_H, MOTION, osc, lerp, lerp2, mix, hash } = window.FU_RIG;
const { RAMPS, v, LookDefs, ToneBean, PostValue, POST_KINDS, GradeFilter } = window.FU_LOOK;
const { WarmPost } = window.FU_PHONE;
const { withdrawal, openEng, curation, HAIR, backOut } = window.FU_THREE_GROUPS;
const { glide, hit } = MOTION;

// ── layout (1920 × 1080 design units) ────────────────────────────────────────
const GROUPS = ['wd', 'open', 'cur'];
const NAME = { wd: 'Withdrawal', open: 'Open Engagement', cur: 'Curation' };
const TXT = { wd: '#8ea6b6', open: '#8cc2b8', cur: '#e0a165' };   // the group colours lifted for type on the dark
const LINE = { wd: [25.7, -1.06], open: [28.2, -1.54], cur: [21.7, 4.91] }, POOL = [25.92, -0.24];
// `level` = 'lowered' (default, the user's call, round 9): withdrawal and open stand 3 points below their Figure 3 levels,
// so the curator stands out more at "more"; 'paper' keeps the figure's levels.
const LOWER = 3;
// `others` = 'soft' (default, the user's call): withdrawal and open dip at about a sixth of their estimated slopes, so
// they swing 7.5 and 10.5 px across the slider (orange 221 px); their slopes are small and not significant. 'data': the full estimates.
const SOFT = { wd: -0.1667, open: -0.2333 };
// the slider's range: 1.5 points either side of average, so the curators start far below and end just above the others
// (their line crosses withdrawal at x 0.67 and open at x 1.0, Figure 3); well inside the plotted range (−3.1 to 2.8)
const X_RANGE = 1.5;
const PW = 280, SIDE = 56, LID = 18, OVER = 10;             // plinth width, shadow side, lid height, lid overhang
const SPACE = 440, CX = 930, BASE = 980, U = 15, FS = 1.3;
const AX = 200, TOP = 150, XR = 1580;                       // y axis, baseline's right end
const SL = { x: 1700, y0: 860, y1: 350 };   // x leaves room for the push at the end (it grows round the bean)                   // the slider: a vertical fader on the right, "less" at the bottom
const NEUT = ['#121413', '#1a1d1c', '#232725', '#2e3330', '#444a46', '#666c67', '#a3a69e'];   // the room outside the light
const LINE_W = '#e9e7e1', MUTED = '#8c8c90', INK = '#d6d6d8';
const FONT = "'FU Futura', 'Jost', 'Inter', sans-serif";
const RED = RAMPS.red;

// ── timing ───────────────────────────────────────────────────────────────────
function beats(CUES) {
  const tS = CUES.Closer, tW = CUES.Withdrawal, tO = CUES.Open, tC = CUES.Curators;
  return {
    tS, tW, tO, tC,
    reveal: { wd: tW, open: tO, cur: tC },
    // [start, end, cycles]: two wiggles; the curators' runs a quarter cycle more, so it ends at "more" and stays there
    // [start, end, cycles, amplitude]. Each group's wiggle fills its beat (1.7 s) at 0.4 (90% of the track), so it moves at
    // about the pace of the opening's (round 9: they jiggled too fast); it ends back at the middle exactly when the next
    // group is revealed. The curators' wiggle runs the full track, so it ends at "more".
    wig: [[1.3, 3.6, 2, 0.5], [tW + 0.1, tO, 2, 0.4], [tO + 0.1, tC, 2, 0.4], [tC + 0.45, tC + 3.05, 2.25, 0.5]],
    zoom: [tC + 3.15, tC + 5.35],                // then a short, slight camera push toward the curator
    act: { wd: tW + 0.3, open: tO + 0.25, cur: tC + 0.6 },
  };
}
// the slider, 0 (less) .. 1 (more); rests at 0.5. A wiggle: up and down `cycles` times, eased in and out
function exposure(T, B) {
  let e = 0.5;
  for (const [a, b, c, amp] of B.wig) e += amp * Math.sin(2 * Math.PI * c * glide(T, a, b, 0, 1));
  return e;
}
const valueAt = (line, e) => line[0] + line[1] * X_RANGE * (2 * e - 1);

// ── variation B (`variant` = 'B'): no Everyone beat. The axes draw on (baseline, the y axis and its arrow, the fader), the
// three plinths stand in the dark already split, the spots come on one after the other, then the slider climbs slowly
// from "less" to "more" once: orange climbs steadily, blue and teal barely move (their small dip plus a slight, slow
// up-and-down that is a function of the slider, so they still only move while it does). Timed to the v6 narration: the
// climb is set so orange passes teal on "the curators!" (8.0 s); blue acts on "group by group", orange flinches on 8.0.
const VBT = {
  base: [0.3, 0.75], yax: [0.6, 1.0], arrow: 0.95, ytitle: [0.7, 1.2], track: [0.9, 1.45], knob: 1.3, stext: [1.2, 1.7],
  // sil: the plinths and figures fade in as faint silhouettes after the axes
  sil: [1.5, 1.9], spots: [1.9, 2.25, 2.6], posts: [2.6, 3.2], climb: [2.8, 10.8],
  // the camera: a punch-in on "the curators!" (+0.05 over 1.4 s, cubic ease-in-out, fastest at 8.05), and under it a slow
  // zoom that ramps in with the punch (to full speed by 8.05) and then runs at one constant speed to the last frame, so
  // after the punch the push is continuous (user note); about 1.10 at the end
  // The punch's speed rises smoothly (sin²) to its peak on 8.0 and then decays exponentially (τ 0.5 s), so it glides into
  // the slow push instead of braking to a near-stop first (user note: a cubic ease-out read as stopping before the zoom).
  punch: { t0: 7.6, tp: 8.0, tau: 0.5, amount: 0.05 }, slowIn: [7.6, 8.4], slowTo: 0.06, anchorY: 700,
  act: { wd: 4.4, open: 5.8, cur: 7.0 },
};
// the punch: speed A·sin²(π/2·u) from t0 to the peak at tp, then A·e^(−(t−tp)/τ); its total is `amount`
function punchPush(T) {
  const { t0, tp, tau, amount } = VBT.punch, d = tp - t0, A = amount / (d / 2 + tau);
  if (T <= t0) return 0;
  if (T < tp) { const u = (T - t0) / d; return A * (d / 2) * (u - Math.sin(Math.PI * u) / Math.PI); }
  return A * (d / 2 + tau * (1 - Math.exp(-(T - tp) / tau)));
}
// the slow push: speed ramps in smoothly over slowIn, then stays constant to the end of the shot (16 s); its total is slowTo
function slowPush(T) {
  const [a, b] = VBT.slowIn, end = 16, vel = VBT.slowTo / ((b - a) / 2 + (end - b));
  if (T <= a) return 0;
  if (T < b) { const u = (T - a) / (b - a); return vel * (b - a) * (u * u * u - (u * u * u * u) / 2); }
  return vel * ((b - a) / 2 + (T - b));
}
const SHORT_B = 0.65;
const WOB = { amp: 5 / 15, cycles: 2, phase: { wd: 0, open: 2.2 } };   // ±5 px, two slow swings over the climb
function plinthB(k, e, others, level, heightB) {
  const g = GROUPS[k];
  const base = g !== 'cur' && level !== 'paper' ? LINE[g][0] - LOWER : LINE[g][0];
  const line = g === 'cur' ? LINE[g] : others === 'data' ? [base, LINE[g][1]] : others === 'soft' ? [base, SOFT[g]] : [base, 0];
  const ph = WOB.phase[g];
  const wob = g === 'cur' ? 0 : WOB.amp * (Math.sin(2 * Math.PI * WOB.cycles * e + ph) - Math.sin(ph));
  // `heightB` = 'short' (default, the user's call): blue and teal at 65% of their height (dip and wobble included), so the
  // curators clearly surpass them; 'full' keeps them as in A
  const val = (valueAt(line, e) + wob) * (g !== 'cur' && heightB !== 'full' ? SHORT_B : 1);
  return { g, k, val, x: CX + (k - 1) * SPACE, top: BASE - val * U, split: 1, tint: 1 };
}

function plinth(T, B, k, e, others, level, heightB) {
  const g = GROUPS[k];
  const split = glide(T, B.tS + 0.02, B.tS + 0.4, 0, 1);
  const revealed = T >= B.reveal[g];
  const tint = glide(T, B.reveal[g], B.reveal[g] + 0.35, 0, 1);
  const base = g !== 'cur' && level !== 'paper' ? LINE[g][0] - LOWER : LINE[g][0];
  const line = g === 'cur' ? LINE[g] : others === 'data' ? [base, LINE[g][1]] : others === 'soft' ? [base, SOFT[g]] : [base, 0];
  // pooled line until the split; at the split (slider at rest) each settles to its own height at average exposure;
  // from its reveal on it follows the slider by its own line. A plinth not yet revealed holds still.
  // blue and teal at 65% of their height (`heightB` = 'short', default in both variants), so the curators clearly surpass them
  const sh = g !== 'cur' && heightB !== 'full' ? SHORT_B : 1;
  const val = T < B.tS ? valueAt(POOL, e) : lerp(valueAt(POOL, 0.5), valueAt(line, revealed ? e : 0.5) * sh, split);
  const x = CX + (k - 1) * lerp(PW, SPACE, split);
  return { g, k, val, x, top: BASE - val * U, split, tint };
}

// ── drawing helpers ──────────────────────────────────────────────────────────
const jit = (seed, bf, n, amp) => (hash(seed * 13.1 + bf * 7.7 + n * 3.3) - 0.5) * 2 * amp;
function BoilLine({ x1, y1, x2, y2, stroke, w, bf, amp, seed, op = 1 }) {
  return <line x1={x1 + jit(seed, bf, 1, amp)} y1={y1 + jit(seed, bf, 2, amp)} x2={x2 + jit(seed, bf, 3, amp)} y2={y2 + jit(seed, bf, 4, amp)} stroke={stroke} strokeWidth={w} strokeLinecap="round" opacity={op} />;
}
function Txt({ x, y, size, fill, a = 1, anchor = 'middle', rot, children }) {
  if (a <= 0.01) return null;
  return <text x={x} y={y} fill={fill} opacity={a} fontFamily={FONT} textRendering="geometricPrecision" fontWeight={700} fontSize={size} textAnchor={anchor} transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}>{children}</text>;
}
const pool = (cx, cy, rx, ry, op = 1) => <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#fuPool)" opacity={op} />;
const cone = (x, y0, w0, y1, w1, op = 1) => <path d={`M ${x - w0} ${y0} L ${x + w0} ${y0} L ${x + w1} ${y1} L ${x - w1} ${y1} Z`} fill="url(#cbCone)" opacity={op} />;
// a plinth in value (as in concept A), kept calm: the body in two bands (lighter at the top), a light lid, a flat shadow side.
// side: how much of the right-hand shadow to draw, as a width (a flat tone at part opacity would band when posterized);
// the grey plinth's inner parts have none until they split
function PlinthValue({ x, top, side = 1 }) {
  const h = BASE - top;
  if (h < 1) return null;
  return (
    <g>
      <rect x={x - PW / 2} y={top} width={PW} height={h} fill="url(#cbPlinth)" />
      <rect x={x - PW / 2 - OVER} y={top - LID} width={PW + 2 * OVER} height={LID + 2} fill={v(0.85)} />
      {side > 0.01 && <rect x={x + PW / 2 - SIDE * side} y={top + 2} width={SIDE * side} height={h - 2} fill={v(0.36)} />}
    </g>
  );
}

// ── the figures ──────────────────────────────────────────────────────────────
function figure(T, B, k, wdMode, curMode) {
  const g = GROUPS[k];
  if (T < B.act[g] - 0.4) return { pose: { ...window.FU_BEAN.POSES.idle(g === 'wd' ? T : g === 'open' ? T + 1.1 : T + 2.3) }, turn: 0, cards: [] };
  if (g === 'wd') return withdrawal(T, B.act.wd, wdMode);
  if (g === 'open') return openEng(T, B.act.open);
  return curation(T, B.act.cur, curMode);
}
function facing(turn) {   // as in the triptych: wide for most of a turn, edge-on for about a frame
  const c = Math.cos(Math.PI * turn);
  let dir = Math.sign(c) * Math.pow(Math.abs(c), 0.3);
  if (Math.abs(dir) < 0.03) dir = dir < 0 ? -0.03 : 0.03;
  return dir;
}

// the posts that come with exposure: post j is there once the slider passes j / N. It pops in where it hovers (a small
// overshoot, a little drop) and shrinks away as the slider falls. At "less" a couple stay: less exposure is not none.
const SWARM_N = 12, SWARM_MIN = 2;
const SWARM = Array.from({ length: SWARM_N }, (_, j) => {
  const h = (n) => hash(j * 9.7 + n * 4.3 + 3);
  return { j, kind: POST_KINDS[(j * 4 + 1) % POST_KINDS.length], h, x: 320 + 1260 * ((j * 0.618 + h(3) * 0.3) % 1), y: 60 + 160 * h(4), s: 1.15 + 0.4 * h(6) };
});
function swarm(T, e) {
  return SWARM.map((P) => {
    const on = Math.min(1, Math.max(0, (SWARM_MIN + e * (SWARM_N - SWARM_MIN) - P.j) / 1.4));
    if (on <= 0.01) return null;
    const k = backOut(on);
    return { p: [P.x + 10 * osc(T, 2.3, P.h(7)), P.y - 30 * (1 - on) + 8 * osc(T, 1.7, P.h(8))], rot: 16 * Math.sin(T * 1.3 + P.h(9) * 5), flip: 0.62 + 0.36 * Math.cos(T * 2.6 + P.h(10) * 9), s: P.s * k, op: Math.min(1, on * 2), kind: P.kind };
  }).filter(Boolean);
}

function Piece({ guide, boil, boilAmp, wd, cur, others, level, variant, heightB }) {
  const { T, CUES } = useComposition();
  const bf = Math.floor(T * 8), amp = boil ? boilAmp : 0;
  const isB = variant === 'B';
  const B0 = beats(CUES), B = isB ? { ...B0, act: VBT.act } : B0;
  const e = isB ? glide(T, VBT.climb[0], VBT.climb[1], 0, 1) : exposure(T, B);
  const ui = isB ? 1 : glide(T, 0.0, 0.5, 0, 1);
  const spot = isB ? 0 : glide(T, B.tC, B.tC + 0.5, 0, 1);   // the curators' beat dims the other two a little
  const dimOf = (g) => (g === 'cur' ? 1 : 1 - 0.3 * spot);
  const ps = GROUPS.map((_, k) => (isB ? plinthB(k, e, others, level, heightB) : plinth(T, B, k, e, others, level, heightB)));
  const lightOn = isB ? 1 : glide(T, 0.0, 0.6, 0, 1);
  // B: each spot snaps on over 0.15 s (1 elsewhere); the axes and the fader draw on
  const Lsp = GROUPS.map((_, k) => (isB ? glide(T, VBT.spots[k], VBT.spots[k] + 0.15, 0, 1) : 1));
  const draw = isB ? {
    base: glide(T, VBT.base[0], VBT.base[1], 0, 1), yax: glide(T, VBT.yax[0], VBT.yax[1], 0, 1), arrow: Math.max(0, backOut((T - VBT.arrow) / 0.3)),
    ytitle: glide(T, VBT.ytitle[0], VBT.ytitle[1], 0, 1), track: glide(T, VBT.track[0], VBT.track[1], 0, 1), knob: Math.max(0, backOut((T - VBT.knob) / 0.3)),
    stext: glide(T, VBT.stext[0], VBT.stext[1], 0, 1),
  } : { base: 1, yax: 1, arrow: 1, ytitle: 1, track: 1, knob: 1, stext: 1 };
  const sil = isB ? glide(T, VBT.sil[0], VBT.sil[1], 0, 1) : 1;
  const postsA = isB ? glide(T, VBT.posts[0], VBT.posts[1], 0, 1) : ui;
  // the camera: at the end a short, slight push toward the curator, anchored on them. Everything is inside it.
  const z = isB
    ? 1 + punchPush(T) + slowPush(T)
    : glide(T, B.zoom[0], B.zoom[1], 1, 1.06);

  const figs = ps.map((p, n) => {
    const a = figure(T, B, p.k, wd, cur);
    const t0 = 0.15 + 0.09 * n;
    const pop = isB ? 1 : glide(T, t0, t0 + 0.2, 0, 1), drop = isB ? 1 : backOut((T - t0) / 0.42);
    const L = Lsp[n];   // B: in the dark until their spot comes on (a silhouette in the ramp's darkest tones)
    return { ...p, a, L, y: p.top - LID - 38 * (1 - Math.min(1, drop)), op: pop * dimOf(p.g) * sil * (isB ? lerp(0.35, 1, L) : 1), dir: facing(a.turn || 0), n, amb: lerp(0.1, 0.34, L), lights: [{ x: p.x - 50, y: -80, i: lerp(0.03, 1, L), reach: 820 }, { dir: [0.3, 1], i: 0.08 * L }] };
  });
  // anchored on the orange bean (the middle of their body; the slider holds at "more" through the push, so they stand still)
  // B: on the orange bean's x, and low enough (the plinth's top) that the labels and the fader stay in frame at 1.10
  const anchor = isB ? [figs[2].x, VBT.anchorY] : [figs[2].x, figs[2].y - 117];
  const CAM = `translate(${anchor[0]} ${anchor[1]}) scale(${z}) translate(${-anchor[0]} ${-anchor[1]})`;
  const posts = swarm(T, e);
  const sy = lerp(SL.y0, SL.y1, e);

  const card = (f, c, k) => {
    if (c.on === false) return null;
    const p = [f.x + FS * c.p[0], f.y + FS * c.p[1]], s = FS * c.s, d = c.dark || 0, op = f.op;
    if (!c.red) return <WarmPost key={k} x={p[0]} y={p[1]} s={s} rot={c.rot} flip={c.flip} kind={c.kind} op={op} />;
    return <g key={k}>{d < 1 && <PostValue x={p[0]} y={p[1]} s={s} rot={c.rot} flip={c.flip} kind={c.kind} op={op * (1 - d)} />}{d > 0 && <PostValue x={p[0]} y={p[1]} s={s} rot={c.rot} flip={c.flip} kind={c.kind} op={op * d} outline />}</g>;
  };
  const loupeOf = figs.find((f) => f.g === 'open');

  // the spot over a plinth: a cone and a haze, out of focus (no pool on the floor: the plinths stand on the baseline)
  const haze = (p) => <g>{pool(p.x, p.top - 260, 330, 400, 0.5 * lightOn)}{cone(p.x, -20, 34, p.top, 170, 0.7 * lightOn)}</g>;
  const sideOf = (p) => (p.k === 2 ? 1 : p.split);   // the grey plinth's inner shadow sides appear as it splits
  const everyoneA = isB ? 0 : 1 - glide(T, B.tS, B.tS + 0.3, 0, 1);

  return (
    <div data-screen-label="Crisis bars" style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: NEUT[1], transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <LookDefs ramps={GROUPS} bf={bf} amp={amp} />
        <defs>
          <GradeFilter id="cbBack" ramp={NEUT} blur={14} />
          <GradeFilter id="cbNeutBg" ramp={NEUT} blur={20} />
          <GradeFilter id="cbNeutFg" ramp={NEUT} poster />
          <GradeFilter id="cbWarm" ramp="cur" poster gain={1.18} />
          <linearGradient id="cbCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={v(0.9)} stopOpacity="0.45" /><stop offset="1" stopColor={v(0.7)} stopOpacity="0.1" /></linearGradient>
          <linearGradient id="cbPlinth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={v(0.63)} /><stop offset="1" stopColor={v(0.46)} /></linearGradient>
        </defs>
        <rect width={W} height={H} fill={NEUT[1]} />

        <g transform={CAM}>
          <g filter="url(#cbBack)"><rect x="-200" y="-200" width="2320" height="1480" fill={v(0.16)} /></g>
          {/* spots: white over the grey plinth, each group's ramp once it is revealed */}
          {ps.map((p) => p.tint < 0.99 && <g key={'nh' + p.k} filter="url(#cbNeutBg)" opacity={1 - p.tint}>{haze(p)}</g>)}
          {ps.map((p) => p.tint > 0.01 && Lsp[p.k] > 0.01 && <g key={'gh' + p.k} filter={`url(#fuGradeBg-${p.g})`} opacity={p.tint * dimOf(p.g) * Lsp[p.k]}>{haze(p)}</g>)}

          {/* plinths: grey (one shape until the split), then each in its group's ramp */}
          {ps.some((p) => p.tint < 0.99) && <g filter="url(#cbNeutFg)" opacity={lightOn}>{ps.map((p) => p.tint < 0.99 && <g key={p.k} opacity={1 - p.tint}><PlinthValue x={p.x} top={p.top} side={sideOf(p)} /></g>)}</g>}
          {ps.map((p) => p.tint > 0.01 && <g key={'gp' + p.k} filter={`url(#fuGradeFg-${p.g})`} opacity={p.tint * dimOf(p.g) * sil * lerp(0.18, 1, Lsp[p.k])}><PlinthValue x={p.x} top={p.top} side={sideOf(p)} /></g>)}

          {/* axes: a hard white baseline the plinths stand on, and the y axis */}
          <g opacity={ui}>
            {draw.base > 0.005 && <BoilLine x1={AX} y1={BASE} x2={lerp(AX, XR, draw.base)} y2={BASE} stroke={LINE_W} w={4} bf={bf} amp={amp} seed={1} />}
            {draw.yax > 0.005 && <BoilLine x1={AX} y1={BASE} x2={AX} y2={lerp(BASE, TOP + 16, draw.yax)} stroke={LINE_W} w={4} bf={bf} amp={amp} seed={2} />}
            {draw.arrow > 0.01 && <path transform={`translate(${AX} ${TOP + 16}) scale(${draw.arrow}) translate(${-AX} ${-(TOP + 16)})`} d={`M ${AX - 14} ${TOP + 24} L ${AX} ${TOP} L ${AX + 14} ${TOP + 24} Z`} fill={LINE_W} />}
            <Txt x={AX - 38} y={(BASE + TOP) / 2} size={28} fill={INK} rot={-90} a={draw.ytitle}>Likelihood of voting for a populist radical party</Txt>
          </g>

          {/* labels under the baseline, centred on each plinth */}
          <Txt x={CX} y={BASE + 44} size={30} fill={INK} a={ui * everyoneA}>Everyone</Txt>
          {ps.map((p) => <Txt key={'l' + p.k} x={p.x} y={BASE + 44} size={30} fill={TXT[p.g]} a={p.tint * dimOf(p.g) * Lsp[p.k]}>{NAME[p.g]}</Txt>)}

          {/* the posts that come with exposure */}
          <g filter="url(#fuGradeFg-red)">{posts.map((q, k) => <PostValue key={k} x={q.p[0]} y={q.p[1]} s={q.s} rot={q.rot} flip={q.flip} kind={q.kind} op={q.op * postsA} />)}</g>

          {/* the figures and their posts */}
          {figs.map((f) => f.op > 0.01 && <ToneBean key={f.n} bf={bf} amp={amp} id={f.n + 1} x={f.x + FS * (f.a.dx || 0)} y={f.y} s={FS} dir={f.dir} pose={f.a.pose} ramp={f.g} hair={HAIR[f.g]} lights={f.lights} amb={f.amb} op={f.op} />)}
          <g filter="url(#fuGradeFg-red)">{figs.flatMap((f) => f.a.cards.filter((c) => c.red).map((c, k) => card(f, c, `${f.n}-${k}`)))}</g>
          <g filter="url(#cbWarm)">{figs.flatMap((f) => f.a.cards.filter((c) => !c.red).map((c, k) => card(f, c, `${f.n}-${k}`)))}</g>
          {loupeOf && loupeOf.a.ls > 0.02 && <Loupe f={loupeOf} />}

          {/* the exposure slider: a bold vertical fader on the right, filling red from "less" up to the knob */}
          <g opacity={ui}>
            <Txt x={SL.x} y={SL.y1 - 150} size={34} fill={INK} a={draw.stext}>Crisis exposure</Txt>
            <Txt x={SL.x} y={SL.y1 - 110} size={34} fill={INK} a={draw.stext}>on social media</Txt>
            <Txt x={SL.x} y={SL.y1 - 54} size={28} fill={INK} a={draw.stext}>more</Txt>
            <Txt x={SL.x} y={SL.y0 + 76} size={28} fill={INK} a={draw.stext}>less</Txt>
            {draw.track > 0.005 && <BoilLine x1={SL.x} y1={SL.y0} x2={SL.x} y2={lerp(SL.y0, SL.y1, draw.track)} stroke={NEUT[4]} w={24} bf={bf} amp={amp} seed={3} />}
            {sy < SL.y0 - 1 && <BoilLine x1={SL.x} y1={SL.y0} x2={SL.x} y2={sy} stroke={RED[4]} w={24} bf={bf} amp={amp} seed={4} />}
            {draw.knob > 0.01 && <circle cx={SL.x + jit(5, bf, 1, amp)} cy={sy + jit(5, bf, 2, amp)} r={36 * draw.knob} fill={RED[6]} stroke={RED[3]} strokeWidth="8" />}
          </g>
        </g>
      </svg>
      {guide && <div style={{ position: 'absolute', left: 40, top: 28, font: '600 28px Inter, sans-serif', color: '#fff', textShadow: '0 1px 12px rgba(0,0,0,0.8)' }}>{`Crisis bars · others ${others} · ${T.toFixed(2)} s`}</div>}
      <div style={{ position: 'absolute', left: -9999, top: 0, fontFamily: FONT, fontWeight: 700 }}>a</div>
    </div>
  );
}

// the open engager's loupe: the lens shows the post larger (as in the triptych)
function Loupe({ f }) {
  const a = f.a, s = FS, toW = (p) => [f.x + s * p[0], f.y + s * p[1]];
  const lensR = 20 * s * a.ls, lc = toW(a.lens), oh = toW(a.hand), oc = a.cards[0], oq = lerp2(lc, toW(oc.p), 0.3);
  const R = RAMPS.open, d = [oh[0] - lc[0], oh[1] - lc[1]], n = Math.hypot(d[0], d[1]) || 1, rim = [lc[0] + (d[0] / n) * lensR, lc[1] + (d[1] / n) * lensR];
  const k = Math.min(1, a.ls);
  return (
    <g opacity={f.op}>
      <defs><clipPath id="cbLens"><circle cx={lc[0]} cy={lc[1]} r={lensR * 0.9} /></clipPath></defs>
      <g filter="url(#fuGradeFg-red)"><g clipPath="url(#cbLens)"><circle cx={lc[0]} cy={lc[1]} r={lensR} fill={v(0.3)} /><PostValue x={oq[0]} y={oq[1]} s={s * 1.7} rot={oc.rot} flip={oc.flip} kind={oc.kind} /></g></g>
      <line x1={rim[0]} y1={rim[1]} x2={oh[0] + (d[0] / n) * 6 * s * a.ls} y2={oh[1] + (d[1] / n) * 6 * s * a.ls} stroke={R[1]} strokeWidth={6 * s * k} strokeLinecap="round" />
      <circle cx={lc[0]} cy={lc[1]} r={lensR} fill={R[6]} fillOpacity="0.08" stroke={R[2]} strokeWidth={4.5 * s * k} />
      <path d={`M ${lc[0] - lensR * 0.55} ${lc[1] - lensR * 0.35} A ${lensR * 0.7} ${lensR * 0.7} 0 0 1 ${lc[0] - lensR * 0.05} ${lc[1] - lensR * 0.66}`} fill="none" stroke={R[6]} strokeOpacity="0.7" strokeWidth={1.6 * s} strokeLinecap="round" />
    </g>
  );
}

function FUCrisisBars() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { wd: 'turn', cur: 'warm', variant: 'A', heightB: 'short', others: 'soft', level: 'lowered', referenceOverlay: false, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={NEUT[1]} autoplay={false}>
        <Piece guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} wd={t.wd} cur={t.cur} others={t.others || 'soft'} level={t.level || 'lowered'} variant={t.variant || 'A'} heightB={t.heightB || 'short'} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Version" />
        <TweakSelect label="Variant" value={t.variant || 'A'} options={[{ value: 'A', label: 'A · Everyone, split, wiggles per group' }, { value: 'B', label: 'B · Axes, spots, one slow climb' }]} onChange={(x) => setTweak('variant', x)} />
        <TweakSelect label="Blue and teal height" value={t.heightB || 'short'} options={[{ value: 'short', label: '65% (curators clearly on top)' }, { value: 'full', label: 'Full (before)' }]} onChange={(x) => setTweak('heightB', x)} />
        <TweakSection label="Data" />
        <TweakSelect label="Withdrawal and open" value={t.others || 'soft'} options={[{ value: 'soft', label: 'Small dips, softened (7.5 / 10.5 px)' }, { value: 'data', label: 'Their full estimates (48 / 69 px)' }, { value: 'flat', label: 'Hold still' }]} onChange={(x) => setTweak('others', x)} />
        <TweakSelect label="Withdrawal and open level" value={t.level || 'lowered'} options={[{ value: 'lowered', label: '3 points lower (curator stands out)' }, { value: 'paper', label: "The paper's levels" }]} onChange={(x) => setTweak('level', x)} />
        <TweakSection label="Actions (from the triptych)" />
        <TweakSelect label="Withdrawal" value={t.wd} options={[{ value: 'turn', label: 'Turns their back' }, { value: 'shoo', label: 'Shoo, then turns away' }, { value: 'walk', label: 'Walks off' }]} onChange={(x) => setTweak('wd', x)} />
        <TweakSelect label="Curation" value={t.cur} options={[{ value: 'warm', label: 'Takes comfort posts, recoils from red' }, { value: 'red', label: 'All red' }]} onChange={(x) => setTweak('cur', x)} />
        <TweakSection label="Preview" />
        <TweakToggle label="Label" value={t.referenceOverlay} onChange={(x) => setTweak('referenceOverlay', x)} />
        <TweakToggle label="Line boil (8 fps)" value={t.lineBoil} onChange={(x) => setTweak('lineBoil', x)} />
        <TweakSlider label="Boil amplitude" value={t.boilAmp ?? 0.5} min={0} max={3} step={0.1} unit="px" onChange={(x) => setTweak('boilAmp', x)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

window.FUCrisisBars = FUCrisisBars;
