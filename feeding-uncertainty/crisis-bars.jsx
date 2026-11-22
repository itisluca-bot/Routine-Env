// Feeding Uncertainty — crisis exposure and the populist radical vote, as a simple bar chart (16.00 s).
// Replaces the crisis scatter (handoff v6), which was found too hard to read for a general audience.
// Narration (v6 timing): 0–4 s "Across the sample, crisis exposure barely had any effect" / 4 s–7.8 s "but then we looked
// closer, group by group, and there it was" / 8 s "the curators!"
//
// Two clusters of bars: people who saw LESS crisis content on social media, and people who saw MORE. Bar height is the
// likelihood of voting for a populist radical party. On each bar stands one of the triptych's beanoids (three-groups.jsx,
// shared through window.FU_THREE_GROUPS so they stay as designed there): calm on the "less" side; on the "more" side the
// posts come at them and they do their triptych action (blue turns their back, teal raises the loupe, orange takes comfort
// posts and flinches from a red one).
//   Sample: two grey bars (everyone) rise with the six figures on them; nearly level.
//   Closer: each grey bar splits into three; they sink back to the floor.
//   Withdrawal / Open / Curators: each group's two bars rise in its colour, carrying its two figures. The curators' "more"
//     bar climbs well above their "less" bar (the finding: the steeper slope, not a gap at average exposure).
//
// Values (Table 4 slopes, Figure 3 levels at average exposure; "less" and "more" = 1 point below and above the average on
// the mean-centred exposure scale): withdrawal 26.8 → 24.6, open 29.7 → 26.7, curators 16.8 → 26.6; everyone (the pooled
// synthetic sample, slope −0.24) 26.2 → 25.7. Bars start at zero.
// Every frame is a pure function of T.
const { W, H, OUT_W, OUT_H, MOTION, osc, lerp, lerp2, mix, hash } = window.FU_RIG;
const { RAMPS, v, LookDefs, ToneBean, PostValue, POST_KINDS, GradeFilter } = window.FU_LOOK;
const { WarmPost } = window.FU_PHONE;
const { withdrawal, openEng, curation, HAIR, backOut } = window.FU_THREE_GROUPS;
const { glide } = MOTION;

// ── chart layout (1920 × 1080 design units) ──────────────────────────────────
const GROUPS = ['wd', 'open', 'cur'];
const NAME = { wd: 'Withdrawal', open: 'Open Engagement', cur: 'Curation' };
const COL = { wd: '#46647a', open: '#5fa69a', cur: '#e0a165' };
const TXT = { wd: '#8ea6b6', open: '#8cc2b8', cur: '#e0a165' };   // the group colours lifted for type on the dark (v6 labelTint)
const VAL = { less: { wd: 26.76, open: 29.74, cur: 16.79 }, more: { wd: 24.64, open: 26.66, cur: 26.61 } };
const POOL = { less: 26.16, more: 25.68 };
const SIDES = ['less', 'more'];
const CX = { less: 720, more: 1340 };          // cluster centres
const BW = 140, GAP = 28, BASE = 860, U = 15;  // bar width, gap after the split, baseline y, px per point
const AX = 330, TOP = 250;                     // the y axis
const FS = 0.9;                                // figure scale
const BG = '#0e0e0f', GRID = '#222224', AXIS = '#4a4a4d', MUTED = '#8c8c90', INK = '#d6d6d8', GREY = '#58585c';
const FONT = "'FU Futura', 'Jost', 'Inter', sans-serif";

// ── timing ───────────────────────────────────────────────────────────────────
// rise(T, side, g): 0..1, how far the group's bar has risen to its value. Withdrawal and open rise as a pair; the
// curators' "less" bar first, then the "more" bar climbs, slower and higher.
function beats(CUES) {
  const tW = CUES.Withdrawal, tO = CUES.Open, tC = CUES.Curators, tS = CUES.Closer;
  return {
    tS, tW, tO, tC,
    rise: {
      wd: { less: [tW, tW + 0.7], more: [tW + 0.08, tW + 0.78] },
      open: { less: [tO, tO + 0.7], more: [tO + 0.08, tO + 0.78] },
      cur: { less: [tC, tC + 0.6], more: [tC + 0.45, tC + 2.1] },
    },
    act: { wd: tW + 0.35, open: tO + 0.2, cur: tC + 0.75 },
  };
}
function barState(T, B, side, k) {
  const g = GROUPS[k];
  const grow = glide(T, 0.55 + (side === 'more' ? 0.12 : 0), 1.75 + (side === 'more' ? 0.12 : 0), 0, 1);
  const sink = glide(T, B.tS + 0.45, B.tS + 1.0, 0, 1);
  const [r0, r1] = B.rise[g][side];
  const rise = glide(T, r0, r1, 0, 1);
  const val = POOL[side] * grow * (1 - sink) + VAL[side][g] * rise;
  const split = glide(T, B.tS + 0.05, B.tS + 0.5, 0, 1);
  const tint = glide(T, r0 - 0.05, r0 + 0.3, 0, 1);
  const x = CX[side] + (k - 1) * (BW + GAP * split);
  return { g, k, side, val, x, top: BASE - val * U, split, tint, col: mix(GREY, COL[g], tint), on: rise > 0 || T < B.tS + 1.0 };
}

// ── drawing helpers ──────────────────────────────────────────────────────────
// a rectangle with its corners boiling at 8 fps
function BoilRect({ x0, x1, y0, y1, fill, bf, amp, seed, op = 1 }) {
  const j = (n) => (hash(seed * 13.1 + bf * 7.7 + n * 3.3) - 0.5) * 2 * amp;
  const d = `M ${x0 + j(1)} ${y1 + j(2) * 0.3} L ${x0 + j(3)} ${y0 + j(4)} L ${x1 + j(5)} ${y0 + j(6)} L ${x1 + j(7)} ${y1 + j(8) * 0.3} Z`;
  return <path d={d} fill={fill} opacity={op} />;
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
// The "less" figures stand calm (idle, each on its own phase). The "more" figures do the triptych's actions.
function figure(T, B, side, k, wdMode, curMode) {
  const g = GROUPS[k];
  if (side === 'less') return { pose: { ...window.FU_BEAN.POSES.idle(T + 0.7 * k + 0.4) }, turn: 0, cards: [] };
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

// posts that circle the "more" crowd in the opening, then fly off as the bars split
const CROWD_POSTS = Array.from({ length: 5 }, (_, j) => ({ j, ph: hash(j * 5.1 + 2), r: 150 + 60 * hash(j * 2.3 + 7), kind: POST_KINDS[(j * 4 + 2) % POST_KINDS.length] }));
// one slow post drifting high over the "less" side once the groups are up: less exposure is not none
const STRAY = { kind: 'headline' };

function Piece({ guide, boil, boilAmp, wd, cur }) {
  const { T, CUES } = useComposition();
  const bf = Math.floor(T * 8), amp = boil ? boilAmp : 0;
  const B = beats(CUES);
  const axisA = glide(T, 0.0, 0.6, 0, 1);
  const spot = glide(T, B.tC, B.tC + 0.6, 0, 1);   // the curators' beat dims the other two groups
  const dimOf = (g) => (g === 'cur' ? 1 : 1 - 0.45 * spot);
  const bars = SIDES.flatMap((side) => GROUPS.map((g, k) => barState(T, B, side, k)));

  // figures: pop in on the floor at the start, then ride their bar's top
  const figs = bars.map((b, n) => {
    const a = figure(T, B, b.side, b.k, wd, cur);
    const t0 = 0.12 + 0.07 * n;
    const pop = glide(T, t0, t0 + 0.2, 0, 1), drop = backOut((T - t0) / 0.42);
    return { ...b, a, x: b.x, y: b.top - 38 * (1 - Math.min(1, drop)), op: pop * (b.g === 'cur' ? 1 : lerp(1, 0.55, spot)), dir: facing(a.turn || 0), n };
  });

  // red posts in the opening: orbit above the "more" crowd, fly off up and to the right on "looked closer"
  const moreTop = bars.find((b) => b.side === 'more' && b.k === 1).top;
  const crowd = CROWD_POSTS.map((P) => {
    const inn = glide(T, 0.9 + 0.25 * P.j, 1.9 + 0.25 * P.j, 0, 1), off = glide(T, B.tS - 0.1 + 0.08 * P.j, B.tS + 0.9 + 0.08 * P.j, 0, 1);
    const ang = T * (0.55 + 0.15 * P.ph) + P.ph * 6.28;
    const home = [CX.more + P.r * 1.35 * Math.cos(ang), moreTop - 230 + 46 * Math.sin(ang * 1.3)];
    const p = lerp2(lerp2([1780 + 60 * P.ph, 120 - 80 * P.ph], home, inn), [2050 + 100 * P.ph, -120 - 60 * P.ph], off);
    return { p, rot: 18 * Math.sin(T * 1.4 + P.ph * 5), flip: Math.cos(T * 3 + P.ph * 9) * 0.35 + 0.65, kind: P.kind, on: inn > 0 && off < 1 };
  }).filter((q) => q.on);
  const sa = T > B.tW ? 1 : 0;
  const stray = sa > 0 ? { p: [lerp(-60, 980, (T - B.tW) / 11), 190 + 22 * Math.sin(T * 0.9)], rot: 10 * Math.sin(T * 0.8), flip: 0.7 + 0.25 * Math.cos(T * 1.6), op: sa * (1 - 0.4 * spot) } : null;

  // labels
  const groupLab = (b) => glide(T, B.rise[b.g][b.side][0], B.rise[b.g][b.side][0] + 0.45, 0, 1);
  const everyoneA = glide(T, 0.5, 1.1, 0, 1) * (1 - glide(T, B.tS + 0.0, B.tS + 0.4, 0, 1));

  const card = (f, c, k) => {
    if (c.on === false) return null;
    const p = [f.x + FS * c.p[0], f.y + FS * c.p[1]], s = FS * c.s, d = c.dark || 0, op = f.op;
    if (!c.red) return <WarmPost key={k} x={p[0]} y={p[1]} s={s} rot={c.rot} flip={c.flip} kind={c.kind} op={op} />;
    return <g key={k}>{d < 1 && <PostValue x={p[0]} y={p[1]} s={s} rot={c.rot} flip={c.flip} kind={c.kind} op={op * (1 - d)} />}{d > 0 && <PostValue x={p[0]} y={p[1]} s={s} rot={c.rot} flip={c.flip} kind={c.kind} op={op * d} outline />}</g>;
  };
  const loupeOf = figs.find((f) => f.side === 'more' && f.g === 'open');

  return (
    <div data-screen-label="Crisis bars" style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: BG, transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <LookDefs ramps={GROUPS} bf={bf} amp={amp} />
        <defs><GradeFilter id="cbWarm" ramp="cur" poster gain={1.18} /></defs>
        <rect width={W} height={H} fill={BG} />

        {/* grid, baseline, y axis */}
        <g opacity={axisA}>
          {[10, 20, 30, 40].map((q, i) => <line key={q} x1={AX + 20} x2={1700} y1={BASE - q * U} y2={BASE - q * U} stroke={GRID} strokeWidth="1.5" />)}
          <BoilLine x1={AX + 20} y1={BASE} x2={1700} y2={BASE} stroke={AXIS} w={3} bf={bf} amp={amp} seed={1} />
          <BoilLine x1={AX} y1={BASE - 10} x2={AX} y2={TOP + 14} stroke={MUTED} w={3.5} bf={bf} amp={amp} seed={2} />
          <path d={`M ${AX - 13} ${TOP + 22} L ${AX} ${TOP} L ${AX + 13} ${TOP + 22} Z`} fill={MUTED} />
          <Txt x={AX - 34} y={(BASE + TOP) / 2} size={25} fill={INK} rot={-90}>Likelihood of voting for a populist radical party</Txt>
        </g>

        {/* bars */}
        {bars.map((b, n) => {
          const w = BW + 6 * (1 - b.split);   // abutting bars overlap until the split, so the grey bar reads as one
          return b.val > 0.05 && <BoilRect key={n} x0={b.x - w / 2} x1={b.x + w / 2} y0={b.top} y1={BASE} fill={b.col} bf={bf} amp={amp} seed={10 + n} op={b.tint > 0 ? dimOf(b.g) : 1} />;
        })}

        {/* posts behind the figures in the opening, and the stray one */}
        <g filter="url(#fuGradeFg-red)">
          {crowd.map((q, k) => <PostValue key={k} x={q.p[0]} y={q.p[1]} s={1.05} rot={q.rot} flip={q.flip} kind={q.kind} />)}
          {stray && <PostValue x={stray.p[0]} y={stray.p[1]} s={0.95} rot={stray.rot} flip={stray.flip} kind={STRAY.kind} op={stray.op} />}
        </g>

        {/* the figures */}
        {figs.map((f) => f.op > 0.01 && <ToneBean key={f.n} bf={bf} amp={amp} id={f.n + 1} x={f.x + FS * (f.a.dx || 0)} y={f.y} s={FS} dir={f.dir} pose={f.a.pose} ramp={f.g} hair={HAIR[f.g]} op={f.op} />)}

        {/* their posts */}
        <g filter="url(#fuGradeFg-red)">{figs.flatMap((f) => f.a.cards.filter((c) => c.red).map((c, k) => card(f, c, `${f.n}-${k}`)))}</g>
        <g filter="url(#cbWarm)">{figs.flatMap((f) => f.a.cards.filter((c) => !c.red).map((c, k) => card(f, c, `${f.n}-${k}`)))}</g>
        {loupeOf && loupeOf.a.ls > 0.02 && <Loupe f={loupeOf} />}

        {/* labels */}
        {SIDES.map((side) => <Txt key={side} x={CX[side]} y={BASE + 108} size={28} fill={INK} a={axisA}>{side === 'less' ? 'Less crisis exposure' : 'More crisis exposure'}</Txt>)}
        {SIDES.map((side) => <Txt key={'e' + side} x={CX[side]} y={BASE + 50} size={22} fill={MUTED} a={everyoneA}>Everyone</Txt>)}
        {bars.map((b, n) => { const a = groupLab(b); return <Txt key={'g' + n} x={b.x} y={BASE + 50} size={b.g === 'open' ? 18 : 21} fill={TXT[b.g]} a={a * dimOf(b.g)} dy={10 * (1 - a)}>{NAME[b.g]}</Txt>; })}
      </svg>
      {guide && <div style={{ position: 'absolute', left: 40, top: 28, font: '600 28px Inter, sans-serif', color: '#fff', textShadow: '0 1px 12px rgba(0,0,0,0.8)' }}>{`Crisis bars · ${T.toFixed(2)} s`}</div>}
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
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { wd: 'turn', cur: 'warm', referenceOverlay: false, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={BG} autoplay={false}>
        <Piece guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} wd={t.wd} cur={t.cur} />
      </CompositionStage>
      <TweaksPanel>
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
