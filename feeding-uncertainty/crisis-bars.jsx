// Feeding Uncertainty — crisis exposure and the populist radical vote, as a simple bar chart (16.00 s). Round 3.
// Replaces the crisis scatter (handoff v6), which was found too hard to read for a general audience.
// Narration (v6 timing): 0–4 s "Across the sample, crisis exposure barely had any effect" / 4 s–7.8 s "but then we looked
// closer, group by group, and there it was" / 8 s "the curators!"
//
// The bars are the plinths of the triptych's concept A (three-groups-concepts.jsx): a gallery in the dark, a plinth per
// group under its own spot, the plinth posterized into its group's ramp (stepped bands, a light lid, a shadow side).
// A plinth's height is the likelihood of voting for a populist radical party. On each stands one of the triptych's
// beanoids (three-groups.jsx, shared through window.FU_THREE_GROUPS, so they stay as designed there).
// A slider under the gallery sets crisis exposure on social media; it rests at the middle (average) and wiggles twice
// (more, less, more, less) on every beat, so it is clear what moves with it. Red posts pop in over the plinths as it
// rises and go as it falls.
//   Sample: one grey "Everyone" plinth under a white spot rises with all three figures; the slider wiggles; it barely moves.
//   Closer: the grey plinth splits into three (no reset: they keep their height).
//   Withdrawal / Open / Curators: the group's spot and plinth take its colour and the plinth settles to its own height;
//     the slider wiggles; the figure does its triptych action. Only plinths already revealed follow the slider, each by
//     its own line; the ones still to come hold still. The curators' wiggle ends at "more" and stays; then a short,
//     slight ease-in push toward the curator.
//
// Values. The slider runs from 1 point below to 1 point above the average on the mean-centred exposure scale.
// Curators: 21.7 + 4.91·x (Table 4 slope, Figure 3 level), 16.8 → 26.6. Withdrawal and open: `others` tweak. 'data'
// (default) gives their own small, non-significant dips (25.7 − 1.06·x and 28.2 − 1.54·x); 'flat' holds them at their
// level at average exposure.
// Everyone: the pooled synthetic sample, 25.9 − 0.24·x (it moves a few px: "barely any effect").
// Every frame is a pure function of T.
const { W, H, OUT_W, OUT_H, MOTION, osc, lerp, lerp2, mix, hash } = window.FU_RIG;
const { RAMPS, v, LookDefs, ToneBean, PostValue, POST_KINDS, GradeFilter } = window.FU_LOOK;
const { WarmPost } = window.FU_PHONE;
const { withdrawal, openEng, curation, HAIR, backOut } = window.FU_THREE_GROUPS;
const { glide } = MOTION;

// ── layout (1920 × 1080 design units) ────────────────────────────────────────
const GROUPS = ['wd', 'open', 'cur'];
const NAME = { wd: 'withdrawal', open: 'open engagement', cur: 'curation' };
const LINE = { wd: [25.7, -1.06], open: [28.2, -1.54], cur: [21.7, 4.91] }, POOL = [25.92, -0.24];
const PW = 200, LID = 14, SPACE = 270, CX = 1020, BASE = 830, U = 14, FS = 1.2;
const AX = 560, TOP = 250;                                  // y axis
const SL = { x0: 720, x1: 1320, y: 945 };                   // the slider's track
const NEUT = ['#121413', '#1a1d1c', '#232725', '#2e3330', '#444a46', '#666c67', '#a3a69e'];   // the gallery outside the light
const MUTED = '#8c8c90', INK = '#d6d6d8';
const FONT = "'FU Futura', 'Jost', 'Inter', sans-serif";
const RED = RAMPS.red;

// ── timing ───────────────────────────────────────────────────────────────────
function beats(CUES) {
  const tS = CUES.Closer, tW = CUES.Withdrawal, tO = CUES.Open, tC = CUES.Curators;
  return {
    tS, tW, tO, tC,
    reveal: { wd: tW, open: tO, cur: tC },
    // [start, end, cycles]: two wiggles; the curators' runs a quarter cycle more, so it ends at "more" and stays there
    wig: [[1.75, 3.85, 2], [tW + 0.15, tW + 1.5, 2], [tO + 0.15, tO + 1.65, 2], [tC + 0.25, tC + 2.95, 2.25]],
    zoom: [tC + 3.0, tC + 5.2],                  // then a short, slight push toward the curator
    act: { wd: tW + 0.3, open: tO + 0.25, cur: tC + 0.6 },
  };
}
// the slider, 0 (less) .. 1 (more); rests at 0.5. A wiggle: up and down `cycles` times, eased in and out
function exposure(T, B) {
  let e = 0.5;
  for (const [a, b, c] of B.wig) e += 0.5 * Math.sin(2 * Math.PI * c * glide(T, a, b, 0, 1));
  return e;
}
const valueAt = (line, e) => line[0] + line[1] * (2 * e - 1);

function plinth(T, B, k, e, others) {
  const g = GROUPS[k];
  const grow = glide(T, 0.45, 1.5, 0, 1);
  const r0 = B.reveal[g], tint = glide(T, r0, r0 + 0.45, 0, 1);
  const line = g === 'cur' || others === 'data' ? LINE[g] : [LINE[g][0], 0];
  // before the split the grey plinth follows the pooled line; after it, a plinth not yet revealed holds still (the slider
  // is at the middle at the split), and once revealed it settles to its own line and follows it. No reset.
  const grey = T < B.tS ? valueAt(POOL, e) : valueAt(POOL, 0.5);
  const val = grow * lerp(grey, valueAt(line, e), tint);
  const split = glide(T, B.tS + 0.05, B.tS + 0.55, 0, 1);
  const x = CX + (k - 1) * lerp(PW, SPACE, split);
  return { g, k, val, x, top: BASE - val * U, split, tint };
}

// ── drawing helpers ──────────────────────────────────────────────────────────
const jit = (seed, bf, n, amp) => (hash(seed * 13.1 + bf * 7.7 + n * 3.3) - 0.5) * 2 * amp;
function BoilLine({ x1, y1, x2, y2, stroke, w, bf, amp, seed, op = 1 }) {
  return <line x1={x1 + jit(seed, bf, 1, amp)} y1={y1 + jit(seed, bf, 2, amp)} x2={x2 + jit(seed, bf, 3, amp)} y2={y2 + jit(seed, bf, 4, amp)} stroke={stroke} strokeWidth={w} strokeLinecap="round" opacity={op} />;
}
function Txt({ x, y, size, fill, a = 1, dy = 0, anchor = 'middle', rot, spacing = 0, children }) {
  if (a <= 0.01) return null;
  return <text x={x} y={y + dy} fill={fill} opacity={a} fontFamily={FONT} textRendering="geometricPrecision" fontWeight={700} fontSize={size} letterSpacing={spacing} textAnchor={anchor} transform={rot ? `rotate(${rot} ${x} ${y + dy})` : undefined}>{children}</text>;
}
const pool = (cx, cy, rx, ry, op = 1) => <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#fuPool)" opacity={op} />;
const cone = (x, y0, w0, y1, w1, op = 1) => <path d={`M ${x - w0} ${y0} L ${x + w0} ${y0} L ${x + w1} ${y1} L ${x - w1} ${y1} Z`} fill="url(#cbCone)" opacity={op} />;
// a plinth in value (as in concept A), kept calm: the body in two bands (lighter at the top), a light lid, a flat shadow side.
// side: how much of the right-hand shadow to draw (the grey plinth's inner parts have none until they split)
function PlinthValue({ x, top, side = 1 }) {
  const h = BASE - top;
  if (h < 1) return null;
  return (
    <g>
      <rect x={x - PW / 2} y={top} width={PW} height={h} fill="url(#cbPlinth)" />
      <rect x={x - PW / 2 - 8} y={top - LID} width={PW + 16} height={LID + 2} fill={v(0.85)} />
      {side > 0.01 && <rect x={x + PW / 2 - 40} y={top + 2} width="40" height={h - 2} fill={v(0.36)} opacity={side} />}
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
// overshoot, a little drop) and shrinks away as the slider falls, so the fast wiggles stay calm.
const SWARM_N = 12, SWARM_MIN = 2;   // at "less" a couple stay: less exposure is not none
const SWARM = Array.from({ length: SWARM_N }, (_, j) => {
  const h = (n) => hash(j * 9.7 + n * 4.3 + 3);
  return { j, kind: POST_KINDS[(j * 4 + 1) % POST_KINDS.length], h, x: 640 + 780 * ((j * 0.618 + h(3) * 0.3) % 1), y: 80 + 150 * h(4), s: 0.95 + 0.35 * h(6) };
});
function swarm(T, e) {
  return SWARM.map((P) => {
    const on = Math.min(1, Math.max(0, (SWARM_MIN + e * (SWARM_N - SWARM_MIN) - P.j) / 1.4));
    if (on <= 0.01) return null;
    const k = backOut(on);
    return { p: [P.x + 10 * osc(T, 2.3, P.h(7)), P.y - 30 * (1 - on) + 8 * osc(T, 1.7, P.h(8))], rot: 16 * Math.sin(T * 1.3 + P.h(9) * 5), flip: 0.62 + 0.36 * Math.cos(T * 2.6 + P.h(10) * 9), s: P.s * k, op: Math.min(1, on * 2), kind: P.kind };
  }).filter(Boolean);
}

function Piece({ guide, boil, boilAmp, wd, cur, others }) {
  const { T, CUES } = useComposition();
  const bf = Math.floor(T * 8), amp = boil ? boilAmp : 0;
  const B = beats(CUES);
  const e = exposure(T, B);
  const ui = glide(T, 0.0, 0.6, 0, 1);
  const spot = glide(T, B.tC, B.tC + 0.5, 0, 1);   // the curators' beat dims the other two a little
  const dimOf = (g) => (g === 'cur' ? 1 : 1 - 0.3 * spot);
  const ps = GROUPS.map((_, k) => plinth(T, B, k, e, others));
  const lightOn = glide(T, 0.0, 0.7, 0, 1);
  // the end: a short, slight ease-in push toward the curator, anchored on them (their screen spot hardly moves)
  const z = glide(T, B.zoom[0], B.zoom[1], 1, 1.07), anchor = [CX + SPACE, 560];
  const CAM = `translate(${anchor[0]} ${anchor[1]}) scale(${z}) translate(${-anchor[0]} ${-anchor[1]})`;

  const figs = ps.map((p, n) => {
    const a = figure(T, B, p.k, wd, cur);
    const t0 = 0.12 + 0.09 * n;
    const pop = glide(T, t0, t0 + 0.2, 0, 1), drop = backOut((T - t0) / 0.42);
    const y = p.top - LID * glide(T, 0.45, 0.8, 0, 1);
    return { ...p, a, y: y - 38 * (1 - Math.min(1, drop)), op: pop * dimOf(p.g), dir: facing(a.turn || 0), n, lights: [{ x: p.x - 40, y: -60, i: 1, reach: 640 }, { dir: [0.3, 1], i: 0.08 }] };
  });
  const posts = swarm(T, e);
  const sx = lerp(SL.x0, SL.x1, e);

  const card = (f, c, k) => {
    if (c.on === false) return null;
    const p = [f.x + FS * c.p[0], f.y + FS * c.p[1]], s = FS * c.s, d = c.dark || 0, op = f.op;
    if (!c.red) return <WarmPost key={k} x={p[0]} y={p[1]} s={s} rot={c.rot} flip={c.flip} kind={c.kind} op={op} />;
    return <g key={k}>{d < 1 && <PostValue x={p[0]} y={p[1]} s={s} rot={c.rot} flip={c.flip} kind={c.kind} op={op * (1 - d)} />}{d > 0 && <PostValue x={p[0]} y={p[1]} s={s} rot={c.rot} flip={c.flip} kind={c.kind} op={op * d} outline />}</g>;
  };
  const loupeOf = figs.find((f) => f.g === 'open');

  // the spot over a plinth: a cone and a haze, out of focus; a pool on the floor
  const haze = (p) => <g>{pool(p.x, p.top - 220, 250, 320, 0.5 * lightOn)}{cone(p.x, -20, 26, p.top, 120, 0.7 * lightOn)}{pool(p.x, BASE + 6, 230, 28, 0.6 * lightOn)}</g>;
  // the grey plinth's inner shadow sides appear as it splits; the right-hand one is always there
  const sideOf = (p) => (p.k === 2 ? 1 : p.split);
  // plaques are drawn outside the push, at their pushed place but never scaled: type scaled by a slow push steps from
  // pixel to pixel and jitters sideways
  const px4k = (q) => Math.round(q * 2) / 2;   // whole pixels of the 4K frame: fractional type positions jitter
  const toS = (x, y) => [anchor[0] + (x - anchor[0]) * z, anchor[1] + (y - anchor[1]) * z];
  const plaque = (p, text, R, a) => {
    if (a <= 0.01) return null;
    const w = Math.max(130, text.length * 11.5 + 34), [x, y] = toS(p.x - 14, Math.min(p.top + 46, BASE - 60));
    return <g key={text + p.k} opacity={a}><rect x={x - (w * z) / 2} y={y} width={w * z} height={36 * z} fill={R[6]} /><Txt x={px4k(x)} y={px4k(y + 18 * z + 6)} size={15} fill={R[0]} spacing={1.6}>{text.toUpperCase()}</Txt></g>;
  };
  const everyoneA = glide(T, 0.9, 1.4, 0, 1) * (1 - glide(T, B.tS, B.tS + 0.3, 0, 1));

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

        <g transform={CAM}>
        {/* the gallery, out of focus */}
        <g filter="url(#cbBack)">
          <rect x="-200" y="-200" width="2320" height="1480" fill={v(0.16)} />
          <rect x="-200" y={BASE} width="2320" height="400" fill={v(0.1)} />
          <rect x="-200" y={BASE - 16} width="2320" height="16" fill={v(0.12)} />
        </g>
        {/* spots: white over the grey plinth, each group's ramp once it is revealed */}
        {ps.map((p) => p.tint < 0.99 && <g key={'nh' + p.k} filter="url(#cbNeutBg)" opacity={1 - p.tint}>{haze(p)}</g>)}
        {ps.map((p) => p.tint > 0.01 && <g key={'gh' + p.k} filter={`url(#fuGradeBg-${p.g})`} opacity={p.tint * dimOf(p.g)}>{haze(p)}</g>)}

        {/* plinths and floor pools: grey (one shape until the split), then each in its group's ramp */}
        {ps.some((p) => p.tint < 0.99) && (
          <g filter="url(#cbNeutFg)">
            {ps.map((p) => p.tint < 0.99 && <g key={p.k} opacity={1 - p.tint}><PlinthValue x={p.x} top={p.top} side={sideOf(p)} /></g>)}
          </g>
        )}
        {ps.map((p) => p.tint > 0.01 && <g key={'gp' + p.k} filter={`url(#fuGradeFg-${p.g})`} opacity={p.tint * dimOf(p.g)}><PlinthValue x={p.x} top={p.top} side={sideOf(p)} /></g>)}
        {/* the posts that come with exposure */}
        <g filter="url(#fuGradeFg-red)">{posts.map((q, k) => <PostValue key={k} x={q.p[0]} y={q.p[1]} s={q.s} rot={q.rot} flip={q.flip} kind={q.kind} op={q.op} />)}</g>

        {/* the figures and their posts */}
        {figs.map((f) => f.op > 0.01 && <ToneBean key={f.n} bf={bf} amp={amp} id={f.n + 1} x={f.x + FS * (f.a.dx || 0)} y={f.y} s={FS} dir={f.dir} pose={f.a.pose} ramp={f.g} hair={HAIR[f.g]} lights={f.lights} op={f.op} />)}
        <g filter="url(#fuGradeFg-red)">{figs.flatMap((f) => f.a.cards.filter((c) => c.red).map((c, k) => card(f, c, `${f.n}-${k}`)))}</g>
        <g filter="url(#cbWarm)">{figs.flatMap((f) => f.a.cards.filter((c) => !c.red).map((c, k) => card(f, c, `${f.n}-${k}`)))}</g>
        {loupeOf && loupeOf.a.ls > 0.02 && <Loupe f={loupeOf} />}

        </g>
        {/* the axis and the slider stay outside the push: scaled type steps from pixel to pixel */}
        {/* plaques */}
        {plaque({ x: CX + 14, top: ps[1].top, k: 9 }, 'everyone', NEUT, everyoneA)}
        {ps.map((p) => plaque(p, NAME[p.g], RAMPS[p.g], glide(T, B.reveal[p.g] + 0.1, B.reveal[p.g] + 0.5, 0, 1) * dimOf(p.g)))}

        {/* y axis */}
        <g opacity={ui}>
          <BoilLine x1={AX} y1={BASE - 10} x2={AX} y2={TOP + 14} stroke={MUTED} w={3.5} bf={bf} amp={amp} seed={2} />
          <path d={`M ${AX - 13} ${TOP + 22} L ${AX} ${TOP} L ${AX + 13} ${TOP + 22} Z`} fill={MUTED} />
          <Txt x={AX - 34} y={(BASE + TOP) / 2} size={24} fill={INK} rot={-90}>Likelihood of voting for a populist radical party</Txt>
        </g>

        {/* the exposure slider */}
        <g opacity={ui}>
          <BoilLine x1={SL.x0} y1={SL.y} x2={SL.x1} y2={SL.y} stroke={NEUT[4]} w={8} bf={bf} amp={amp} seed={3} />
          {sx > SL.x0 + 1 && <BoilLine x1={SL.x0} y1={SL.y} x2={sx} y2={SL.y} stroke={RED[3]} w={8} bf={bf} amp={amp} seed={4} />}
          <circle cx={sx + jit(5, bf, 1, amp)} cy={SL.y + jit(5, bf, 2, amp)} r="17" fill={RED[6]} stroke={RED[4]} strokeWidth="4" />
          <Txt x={SL.x0 - 26} y={SL.y + 8} size={22} fill={MUTED} anchor="end">less</Txt>
          <Txt x={SL.x1 + 26} y={SL.y + 8} size={22} fill={MUTED} anchor="start">more</Txt>
          <Txt x={(SL.x0 + SL.x1) / 2} y={SL.y + 62} size={26} fill={INK}>Crisis exposure on social media</Txt>
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
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { wd: 'turn', cur: 'warm', others: 'data', referenceOverlay: false, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={NEUT[1]} autoplay={false}>
        <Piece guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} wd={t.wd} cur={t.cur} others={t.others || 'data'} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Data" />
        <TweakSelect label="Withdrawal and open" value={t.others || 'data'} options={[{ value: 'data', label: 'Their own data (small dips)' }, { value: 'flat', label: 'Hold still' }]} onChange={(x) => setTweak('others', x)} />
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
