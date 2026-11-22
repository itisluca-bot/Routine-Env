// Feeding Uncertainty — crisis exposure and the populist radical vote, as a simple bar chart (16.00 s). Round 2.
// Replaces the crisis scatter (handoff v6), which was found too hard to read for a general audience.
// Narration (v6 timing): 0–4 s "Across the sample, crisis exposure barely had any effect" / 4 s–7.8 s "but then we looked
// closer, group by group, and there it was" / 8 s "the curators!"
//
// Three bars, one per group; bar height is the likelihood of voting for a populist radical party. A slider below the
// chart sets crisis exposure on social media, from less to more; red posts gather round the figures as it rises.
// On each bar stands one of the triptych's beanoids (three-groups.jsx, shared through window.FU_THREE_GROUPS, so they stay
// as designed there); when the slider sweeps up on "the curators!" they do their triptych actions.
//   Sample: one grey "Everyone" bar rises with all three figures on it; the slider slides to "more" and the bar barely moves.
//   Closer: the slider slides back, the posts leave, the bar splits into three and they sink to the floor.
//   Withdrawal / Open / Curators: each group's bar rises in its colour (at "less" exposure), carrying its figure. Then the
//     slider sweeps to "more": only the orange bar climbs.
// Bars are toned like the people: value art (lit from the upper left) through a ToneFilter in the group's ramp, so they
// carry the same flat, irregular bands that run parallel to their outline.
//
// Values. The slider runs from 1 point below to 1 point above the average on the mean-centred exposure scale.
// Curators: 21.7 + 4.91·x (Table 4 slope, Figure 3 level), 16.8 → 26.6. Withdrawal and open: `others` tweak. 'flat'
// (default, the user's brief: only the orange bar reacts; their slopes are not significant) holds them at their level at
// average exposure, 25.7 and 28.2; 'data' gives their small, non-significant dips (−1.06 and −1.54 per point).
// Everyone: the pooled synthetic sample, 25.9 − 0.24·x.
// Every frame is a pure function of T.
const { W, H, OUT_W, OUT_H, MOTION, osc, lerp, lerp2, mix, hash } = window.FU_RIG;
const { RAMPS, v, LookDefs, ToneBean, PostValue, POST_KINDS, GradeFilter, ToneFilter } = window.FU_LOOK;
const { WarmPost } = window.FU_PHONE;
const { withdrawal, openEng, curation, HAIR, backOut } = window.FU_THREE_GROUPS;
const { glide } = MOTION;

// ── layout (1920 × 1080 design units) ────────────────────────────────────────
const GROUPS = ['wd', 'open', 'cur'];
const NAME = { wd: 'Withdrawal', open: 'Open Engagement', cur: 'Curation' };
const TXT = { wd: '#8ea6b6', open: '#8cc2b8', cur: '#e0a165' };   // the group colours lifted for type on the dark
const LINE = { wd: [25.7, -1.06], open: [28.2, -1.54], cur: [21.7, 4.91] }, POOL = [25.92, -0.24];
const BW = 190, GAP = 40, CX = 1020, BASE = 790, U = 15, FS = 0.9;
const AX = 560, TOP = 215, XR = 1500;                       // y axis, plot's right edge
const SL = { x0: 700, x1: 1340, y: 925 };                   // the slider's track
const BG = '#0e0e0f', GRID = '#222224', AXIS = '#4a4a4d', MUTED = '#8c8c90', INK = '#d6d6d8';
const GREY_RAMP = ['#1d1d20', '#2a2a2e', '#38383d', '#47474d', '#5a5a61', '#727279', '#93939a'];
const FONT = "'FU Futura', 'Jost', 'Inter', sans-serif";
const RED = RAMPS.red;

// ── timing ───────────────────────────────────────────────────────────────────
function beats(CUES) {
  const tS = CUES.Closer, tW = CUES.Withdrawal, tO = CUES.Open, tC = CUES.Curators;
  return {
    tS, tW, tO, tC,
    rise: { wd: [tW, tW + 0.7], open: [tO, tO + 0.7], cur: [tC, tC + 0.6] },
    sweep: [tC + 0.8, tC + 3.0],                 // the slider climbs to "more" on the curators' beat
    act: { wd: tC + 1.0, open: tC + 1.3, cur: tC + 1.15 },
  };
}
// the slider, 0 (less) .. 1 (more)
function exposure(T, B) {
  return glide(T, 1.9, 3.5, 0, 1) - glide(T, B.tS + 0.0, B.tS + 0.8, 0, 1) + glide(T, B.sweep[0], B.sweep[1], 0, 1);
}
const valueAt = (line, e) => line[0] + line[1] * (2 * e - 1);

function barState(T, B, k, e, others) {
  const g = GROUPS[k];
  const grow = glide(T, 0.55, 1.75, 0, 1);
  const sink = glide(T, B.tS + 0.45, B.tS + 1.0, 0, 1);
  const [r0, r1] = B.rise[g];
  const rise = glide(T, r0, r1, 0, 1);
  const line = g === 'cur' || others === 'data' ? LINE[g] : [LINE[g][0], 0];
  const val = valueAt(POOL, e) * grow * (1 - sink) + valueAt(line, e) * rise;
  const split = glide(T, B.tS + 0.05, B.tS + 0.5, 0, 1);
  const tint = glide(T, r0 - 0.05, r0 + 0.3, 0, 1);
  return { g, k, val, x: CX + (k - 1) * (BW + GAP * split), top: BASE - val * U, split, tint };
}

// ── drawing helpers ──────────────────────────────────────────────────────────
const jit = (seed, bf, n, amp) => (hash(seed * 13.1 + bf * 7.7 + n * 3.3) - 0.5) * 2 * amp;
function barPath(x0, x1, y0, y1, bf, amp, seed) {
  const j = (n) => jit(seed, bf, n, amp);
  return `M ${x0 + j(1)} ${y1} L ${x0 + j(3)} ${y0 + j(4)} L ${x1 + j(5)} ${y0 + j(6)} L ${x1 + j(7)} ${y1} Z`;
}
// a bar in value: lit from the upper left (the figures' default key), a little darker toward the floor
function BarValue({ x0, x1, y0, bf, amp, seed, lit = 'cbBarLit' }) {
  const d = barPath(x0, x1, y0, BASE, bf, amp, seed);
  return (
    <g>
      <path d={d} fill={`url(#${lit})`} />
      <path d={d} fill="url(#cbBarFloor)" />
    </g>
  );
}
function BoilLine({ x1, y1, x2, y2, stroke, w, bf, amp, seed, op = 1 }) {
  const j = (n) => (hash(seed * 11.3 + bf * 5.9 + n * 2.7) - 0.5) * 2 * amp;
  return <line x1={x1 + j(1)} y1={y1 + j(2)} x2={x2 + j(3)} y2={y2 + j(4)} stroke={stroke} strokeWidth={w} strokeLinecap="round" opacity={op} />;
}
function Txt({ x, y, size, fill, a = 1, dy = 0, anchor = 'middle', rot, children }) {
  if (a <= 0.01) return null;
  return <text x={x} y={y + dy} fill={fill} opacity={a} fontFamily={FONT} fontWeight={700} fontSize={size} textAnchor={anchor} transform={rot ? `rotate(${rot} ${x} ${y + dy})` : undefined}>{children}</text>;
}

// ── the figures ──────────────────────────────────────────────────────────────
// Idle until the slider sweeps up on the curators' beat, then the triptych's actions.
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

// the swarm that comes with exposure: post j is there once the slider passes j / N; it flies in from off frame and
// circles over the chart, and flies off again as the slider comes back
const SWARM_N = 12;
const SWARM = Array.from({ length: SWARM_N }, (_, j) => {
  const h = (n) => hash(j * 9.7 + n * 4.3 + 3);
  return { j, kind: POST_KINDS[(j * 4 + 1) % POST_KINDS.length], h, from: [1980 + 120 * h(1), -80 + 520 * h(2)], cx: 620 + 800 * h(3), cy: 120 + 140 * h(4), rx: 40 + 70 * h(5), s: 0.85 + 0.35 * h(6) };
});
function swarm(T, e) {
  return SWARM.map((P) => {
    const on = Math.min(1, Math.max(0, (e * SWARM_N - P.j) / 1.6));
    if (on <= 0) return null;
    const ease = on * on * (3 - 2 * on);
    const ang = T * (0.5 + 0.3 * P.h(7)) + P.h(8) * 6.28;
    const home = [P.cx + P.rx * Math.cos(ang), P.cy + 0.45 * P.rx * Math.sin(ang * 1.2)];
    return { p: lerp2(P.from, home, ease), rot: 20 * Math.sin(T * 1.3 + P.h(9) * 5), flip: 0.62 + 0.36 * Math.cos(T * 2.6 + P.h(10) * 9), s: P.s, kind: P.kind };
  }).filter(Boolean);
}

function Piece({ guide, boil, boilAmp, wd, cur, others }) {
  const { T, CUES } = useComposition();
  const bf = Math.floor(T * 8), amp = boil ? boilAmp : 0;
  const B = beats(CUES);
  const e = exposure(T, B);
  const axisA = glide(T, 0.0, 0.6, 0, 1);
  const spot = glide(T, B.sweep[0] - 0.3, B.sweep[0] + 0.4, 0, 1);   // a light dim on the two that don't react
  const dimOf = (g) => (g === 'cur' ? 1 : 1 - 0.3 * spot);
  const bars = GROUPS.map((_, k) => barState(T, B, k, e, others));

  const figs = bars.map((b, n) => {
    const a = figure(T, B, b.k, wd, cur);
    const t0 = 0.12 + 0.09 * n;
    const pop = glide(T, t0, t0 + 0.2, 0, 1), drop = backOut((T - t0) / 0.42);
    return { ...b, a, y: b.top - 38 * (1 - Math.min(1, drop)), op: pop * dimOf(b.g), dir: facing(a.turn || 0), n };
  });
  const posts = swarm(T, e);

  const everyoneA = glide(T, 0.5, 1.1, 0, 1) * (1 - glide(T, B.tS, B.tS + 0.4, 0, 1));
  const groupLab = (b) => glide(T, B.rise[b.g][0], B.rise[b.g][0] + 0.45, 0, 1);
  const sx = lerp(SL.x0, SL.x1, e);

  const card = (f, c, k) => {
    if (c.on === false) return null;
    const p = [f.x + FS * c.p[0], f.y + FS * c.p[1]], s = FS * c.s, d = c.dark || 0, op = f.op;
    if (!c.red) return <WarmPost key={k} x={p[0]} y={p[1]} s={s} rot={c.rot} flip={c.flip} kind={c.kind} op={op} />;
    return <g key={k}>{d < 1 && <PostValue x={p[0]} y={p[1]} s={s} rot={c.rot} flip={c.flip} kind={c.kind} op={op * (1 - d)} />}{d > 0 && <PostValue x={p[0]} y={p[1]} s={s} rot={c.rot} flip={c.flip} kind={c.kind} op={op * d} outline />}</g>;
  };
  const loupeOf = figs.find((f) => f.g === 'open');

  // bars, toned like the people. Each group's bar has its own tone filter whose region is a fixed box round the bar
  // (moving with it sideways, fixed to the floor), so its bands keep one scale and stay put while it rises. The grey
  // "Everyone" bar is toned as one shape (its three parts abut and overlap a little until the split), so it has no seams.
  const BOX = (x0, w) => [x0, BASE - 560, w, 562];
  const toneOf = (id, ramp, box) => <ToneFilter key={id} id={id} ramp={ramp} edge={12} depth={0.45} grain={0.13} soft={1.3} bf={bf} amp={amp} region={box} />;
  const greyW = 3 * BW + 2 * GAP + 160;
  const barFilters = [toneOf('cbBar-grey', GREY_RAMP, BOX(CX - greyW / 2, greyW)), ...bars.map((b) => toneOf('cbBar-' + b.g, b.g, BOX(b.x - BW / 2 - 40, BW + 80)))];
  const barValue = (b, lit) => { const w = BW + 6 * (1 - b.split); return b.val < 0.05 ? null : <BarValue key={b.k} x0={b.x - w / 2} x1={b.x + w / 2} y0={b.top} bf={bf} amp={amp} seed={10 + b.k} lit={lit} />; };
  const greyOp = 1 - Math.max(...bars.map((b) => b.tint));

  return (
    <div data-screen-label="Crisis bars" style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: BG, transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <LookDefs ramps={GROUPS} bf={bf} amp={amp} />
        <defs>
          <GradeFilter id="cbWarm" ramp="cur" poster gain={1.18} />
          {barFilters}
          <linearGradient id="cbBarLit" x1="0" y1="0" x2="1" y2="0.25"><stop offset="0" stopColor={v(0.86)} /><stop offset="0.45" stopColor={v(0.7)} /><stop offset="1" stopColor={v(0.5)} /></linearGradient>
          <linearGradient id="cbBarLitGrey" gradientUnits="userSpaceOnUse" x1={CX - 1.5 * BW - GAP} y1={BASE - 420} x2={CX + 1.5 * BW + GAP} y2={BASE - 300}><stop offset="0" stopColor={v(0.86)} /><stop offset="0.45" stopColor={v(0.7)} /><stop offset="1" stopColor={v(0.5)} /></linearGradient>
          <linearGradient id="cbBarFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity="0" /><stop offset="0.55" stopColor="#000" stopOpacity="0.06" /><stop offset="1" stopColor="#000" stopOpacity="0.3" /></linearGradient>
        </defs>
        <rect width={W} height={H} fill={BG} />

        {/* grid, baseline, y axis */}
        <g opacity={axisA}>
          {[10, 20, 30, 40].map((q) => <line key={q} x1={AX + 20} x2={XR} y1={BASE - q * U} y2={BASE - q * U} stroke={GRID} strokeWidth="1.5" />)}
          <BoilLine x1={AX + 20} y1={BASE} x2={XR} y2={BASE} stroke={AXIS} w={3} bf={bf} amp={amp} seed={1} />
          <BoilLine x1={AX} y1={BASE - 10} x2={AX} y2={TOP + 14} stroke={MUTED} w={3.5} bf={bf} amp={amp} seed={2} />
          <path d={`M ${AX - 13} ${TOP + 22} L ${AX} ${TOP} L ${AX + 13} ${TOP + 22} Z`} fill={MUTED} />
          <Txt x={AX - 34} y={(BASE + TOP) / 2} size={24} fill={INK} rot={-90}>Likelihood of voting for a populist radical party</Txt>
        </g>

        {/* bars */}
        {greyOp > 0.01 && <g filter="url(#cbBar-grey)" opacity={greyOp}>{bars.map((b) => barValue(b, 'cbBarLitGrey'))}</g>}
        {bars.map((b) => b.tint > 0.01 && <g key={b.k} filter={`url(#cbBar-${b.g})`} opacity={b.tint * dimOf(b.g)}>{barValue(b, 'cbBarLit')}</g>)}

        {/* the swarm that comes with exposure */}
        <g filter="url(#fuGradeFg-red)">{posts.map((q, k) => <PostValue key={k} x={q.p[0]} y={q.p[1]} s={q.s} rot={q.rot} flip={q.flip} kind={q.kind} />)}</g>

        {/* the figures and their posts */}
        {figs.map((f) => f.op > 0.01 && <ToneBean key={f.n} bf={bf} amp={amp} id={f.n + 1} x={f.x + FS * (f.a.dx || 0)} y={f.y} s={FS} dir={f.dir} pose={f.a.pose} ramp={f.g} hair={HAIR[f.g]} op={f.op} />)}
        <g filter="url(#fuGradeFg-red)">{figs.flatMap((f) => f.a.cards.filter((c) => c.red).map((c, k) => card(f, c, `${f.n}-${k}`)))}</g>
        <g filter="url(#cbWarm)">{figs.flatMap((f) => f.a.cards.filter((c) => !c.red).map((c, k) => card(f, c, `${f.n}-${k}`)))}</g>
        {loupeOf && loupeOf.a.ls > 0.02 && <Loupe f={loupeOf} />}

        {/* labels under the bars */}
        <Txt x={CX} y={BASE + 44} size={24} fill={MUTED} a={everyoneA}>Everyone</Txt>
        {bars.map((b) => { const a = groupLab(b); return <Txt key={'g' + b.k} x={b.x} y={BASE + 44} size={24} fill={TXT[b.g]} a={a * dimOf(b.g)} dy={10 * (1 - a)}>{NAME[b.g]}</Txt>; })}

        {/* the exposure slider */}
        <g opacity={axisA}>
          <BoilLine x1={SL.x0} y1={SL.y} x2={SL.x1} y2={SL.y} stroke={AXIS} w={8} bf={bf} amp={amp} seed={3} />
          {sx > SL.x0 + 1 && <BoilLine x1={SL.x0} y1={SL.y} x2={sx} y2={SL.y} stroke={RED[3]} w={8} bf={bf} amp={amp} seed={4} />}
          <circle cx={sx + jit(5, bf, 1, amp)} cy={SL.y + jit(5, bf, 2, amp)} r="17" fill={RED[6]} stroke={RED[4]} strokeWidth="4" />
          <Txt x={SL.x0 - 26} y={SL.y + 8} size={22} fill={MUTED} anchor="end">less</Txt>
          <Txt x={SL.x1 + 26} y={SL.y + 8} size={22} fill={MUTED} anchor="start">more</Txt>
          <Txt x={(SL.x0 + SL.x1) / 2} y={SL.y + 64} size={26} fill={INK}>Crisis exposure on social media</Txt>
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
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { wd: 'turn', cur: 'warm', others: 'flat', referenceOverlay: false, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={BG} autoplay={false}>
        <Piece guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} wd={t.wd} cur={t.cur} others={t.others || 'flat'} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Data" />
        <TweakSelect label="Withdrawal and open" value={t.others || 'flat'} options={[{ value: 'flat', label: 'Hold still (only orange reacts)' }, { value: 'data', label: 'Their small, non-significant dips' }]} onChange={(x) => setTweak('others', x)} />
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
