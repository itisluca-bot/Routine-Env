// Feeding Uncertainty — the last shot, replacing the Resistance alley: "Coping is a form of resistance. The question is,
// what do people have to resist with?" (10 s; the Resistance timing). Round-1 concept stills, all three groups in frame
// again, built on the two shots the audience has already seen. `--set concept=pillars` or `triptych`.
//   pillars  · Crisis Bars (crisis-bars.jsx) at its end state ("more" exposure), without the axis, labels and slider: the
//              same plinths under their spots, the same heights (curators just on top), the same three beanoids, now
//              hanging out. Blue sits on the left edge of their plinth, legs dangling, facing away, chin up. Teal sits on
//              the right edge, legs dangling, looking up at orange. Orange, highest and inside the red swarm, teeters at
//              the edge of theirs: leaning out over the drop, arms windmilling, a foot lifted. Camera: a zoom out from
//              1.2 to the whole row over "Coping is a form of resistance".
//   triptych · Three Groups (three-groups.jsx, F): the same three window-lit panels in their ramps, no labels, each now a
//              group. Blue: three friends in a huddle, talking, their backs to the red posts by the window. Teal: a
//              family; the two kids study one post through loupes (the lens shows it larger), each parent has a hand on
//              a kid's shoulder. Orange: the curator alone in an empty room, hand to head, looking round.
// Every frame is a pure function of T.
const { W, H, OUT_W, OUT_H, MOTION, osc, lerp, lerp2, hash } = window.FU_RIG;
const { rig, frontRig, POSES } = window.FU_BEAN;
const { RAMPS, LookDefs, ToneBean, ToneFilter, PostValue, POST_KINDS, GradeFilter, v } = window.FU_LOOK;
const { WarmPost } = window.FU_PHONE;
const { glide } = MOTION;
const GROUPS = ['wd', 'open', 'cur'];
const HAIR = { wd: 'long', open: 'beanie', cur: 'none' };   // the heroes, as in the triptych and the bars
const NEUT = ['#121413', '#1a1d1c', '#232725', '#2e3330', '#444a46', '#666c67', '#a3a69e'];
const clampN = (x, a, b) => Math.min(b, Math.max(a, x));
const deg = (r) => (r * 180) / Math.PI;

// ── Bean helpers. A figure is { x, y, s, dir, pose, headScale } ────────────────
const toW = (f, p) => [f.x + (f.dir || 1) * f.s * p[0], f.y + f.s * p[1]];
const R_ = (f) => rig(f.pose, f.headScale || 1);
const headW = (f) => toW(f, R_(f).Hc);
const handW = (f) => toW(f, R_(f).armN[2]);
const shoulderW = (f) => toW(f, R_(f).S);
function reachArm(f, P) {
  const A = R_(f).armN[0];
  const dx = ((f.dir || 1) * (P[0] - f.x)) / f.s - A[0], dy = (P[1] - f.y) / f.s - A[1];
  const d = clampN(Math.hypot(dx, dy), 3, 85.5);
  const al = deg(Math.acos((44 * 44 + d * d - 42 * 42) / (2 * 44 * d)));
  const ga = deg(Math.acos((44 * 44 + 42 * 42 - d * d) / (2 * 44 * 42)));
  return [deg(Math.atan2(dx, dy)) - al - f.pose.lean, 180 - ga];
}
const armTo = (f, P) => { f.pose = { ...f.pose, armN: reachArm(f, P) }; };
// seated on an edge: thighs forward, shins hanging and swinging a little (hip ~55 above the feet; the egg 14 below the hip)
const SIT = (T, ph = 0) => ({ hx: 0, lean: 4 + 1.5 * osc(T, 3.3, ph), tilt: 2 * osc(T, 4.1, ph), legN: [86, 80 + 8 * osc(T, 2.7, ph)], legF: [80, 72 + 10 * osc(T, 3.1, ph + 0.4)], armN: [24, 56], armF: [18, 52], phone: 0 });
const sitY = (seat, s) => seat + 41 * s;
const FOLD_N = [-10, 125], FOLD_F = [-6, 120];
function Bean({ f, k, id, lights, amb, view = 'side' }) {
  return <ToneBean x={f.x} y={f.y} dir={f.dir ?? 1} s={f.s} pose={f.pose} view={view} ramp={f.ramp} hair={f.hair || 'none'} lights={lights} amb={amb}
    headScale={f.headScale || 1} id={id} bf={k.bf} amp={k.amp} />;
}
const post = (p, i, outline) => <PostValue key={i} x={p.x} y={p.y} s={p.s} rot={p.rot} flip={p.flip} outline={outline} kind={p.kind} op={p.op ?? 1} />;

// ── concept 1 · Pillars (Crisis Bars at "more", stripped) ───────────────────────
const PW = 280, SIDE = 56, LID = 18, OVER = 10, BASE = 980, U = 15, FS = 1.3;
const VAL = { wd: 25.45, open: 27.85, cur: 29.07 };   // crisis-bars.jsx at the end of the shot (slider at "more")
const PX = { wd: 520, open: 960, cur: 1400 };
function PlinthValue({ x, top }) {
  const h = BASE - top;
  return (
    <g>
      <rect x={x - PW / 2} y={top} width={PW} height={h} fill="url(#ccPlinth)" />
      <rect x={x - PW / 2 - OVER} y={top - LID} width={PW + 2 * OVER} height={LID + 2} fill={v(0.85)} />
      <rect x={x + PW / 2 - SIDE} y={top + 2} width={SIDE} height={h - 2} fill={v(0.36)} />
    </g>
  );
}
// the posts round the top (as the bars' swarm at "more"), denser round orange
const SWARM = Array.from({ length: 14 }, (_, j) => {
  const h = (n) => hash(j * 9.7 + n * 4.3 + 3);
  const nearCur = j < 8;
  return { j, h, kind: POST_KINDS[(j * 4 + 1) % POST_KINDS.length], x: nearCur ? 1220 + 440 * h(3) : 360 + 820 * h(3), y: nearCur ? 160 + 300 * h(4) : 60 + 160 * h(4), s: 1.05 + 0.35 * h(6) };
});
function Pillars({ k }) {
  const { T } = k;
  const z = glide(T, 0.3, 3.2, 1.2, 1);
  const CAM = `translate(960 560) scale(${z}) translate(-960 -560)`;
  const top = (g) => BASE - VAL[g] * U;
  const lights = (g) => [{ x: PX[g] - 50, y: -80, i: 1, reach: 820 }, { dir: [0.3, 1], i: 0.08 }];
  const cone = (x, y0, w0, y1, w1) => <path d={`M ${x - w0} ${y0} L ${x + w0} ${y0} L ${x + w1} ${y1} L ${x - w1} ${y1} Z`} fill="url(#ccCone)" opacity="0.7" />;
  // blue: on the left edge, facing away from everyone, legs dangling, chin up, leaning back on a hand
  const bSeat = top('wd') - LID;
  const B = { x: PX.wd - PW / 2 + 14, y: sitY(bSeat, FS), s: FS, dir: -1, ramp: 'wd', hair: HAIR.wd, pose: { ...SIT(T, 0.1), lean: -4 + 1.5 * osc(T, 3.3), tilt: -12 + 2 * osc(T, 4.1), armN: [36, 70], armF: [-38, 4] } };
  // teal: on the right edge, facing orange, legs dangling, looking up at them
  const tSeat = top('open') - LID;
  const Tl = { x: PX.open + PW / 2 - 4, y: sitY(tSeat, FS), s: FS, dir: 1, ramp: 'open', hair: HAIR.open, pose: { ...SIT(T, 0.7), lean: 2, tilt: -26 + 3 * osc(T, 2.1) } };
  armTo(Tl, [Tl.x + 34, Tl.y - 128 + 4 * osc(T, 1.6)]);   // a hand half raised toward them
  // orange: at the outer (right) edge of the highest plinth, leaning out over the drop, arms windmilling, the back foot lifted
  const wob = osc(T, 0.9), wob2 = osc(T, 0.45, 0.3);
  const O = { x: PX.cur + PW / 2 - 2, y: top('cur') - LID, s: FS, dir: 1, ramp: 'cur', hair: HAIR.cur, pose: { hx: 0, lean: 22 + 5 * wob, tilt: 30 - 5 * wob,
    legN: [-4 + 3 * wob, 4], legF: [-30 - 6 * wob2, 34], armN: [150 + 25 * wob2, 15 + 15 * wob], armF: [-160 - 20 * wob2, 25 - 10 * wob], phone: 0 } };
  const posts = SWARM.map((P) => ({ x: P.x + 10 * osc(T, 2.3, P.h(7)), y: P.y + 8 * osc(T, 1.7, P.h(8)), rot: 16 * Math.sin(T * 1.3 + P.h(9) * 5), flip: 0.78 + 0.2 * Math.cos(T * 2.6 + P.h(10) * 9), s: P.s, kind: P.kind }));
  return (
    <g transform={CAM}>
      <g filter="url(#ccBack)"><rect x="-300" y="-300" width="2520" height="1680" fill={v(0.16)} /></g>
      {GROUPS.map((g) => (
        <g key={'h' + g} filter={`url(#fuGradeBg-${g})`}>
          <ellipse cx={PX[g]} cy={top(g) - 260} rx="330" ry="400" fill="url(#fuPool)" opacity="0.5" />
          {cone(PX[g], -60, 34, top(g), 170)}
        </g>
      ))}
      {GROUPS.map((g) => <g key={'p' + g} filter={`url(#fuGradeFg-${g})`}><PlinthValue x={PX[g]} top={top(g)} /></g>)}
      <line x1="230" y1={BASE} x2="1690" y2={BASE} stroke="#e9e7e1" strokeWidth="4" strokeLinecap="round" />
      <rect x="-300" y={BASE + 2} width="2520" height="400" fill={NEUT[0]} />
      <g filter="url(#fuGradeFg-red)">{posts.map((p, i) => post(p, i))}</g>
      <Bean f={B} k={k} id={1} lights={lights('wd')} />
      <Bean f={Tl} k={k} id={2} lights={lights('open')} />
      <Bean f={O} k={k} id={3} lights={lights('cur')} />
    </g>
  );
}

// ── concept 2 · Triptych (Three Groups, F), as groups ──────────────────────────
const TW = 640, FLOOR = 920, GS = 1.25, KS = 0.62;
const WIN = (i) => [i * TW + 470, 300];
function Room({ i }) {
  const g = GROUPS[i], [wx, wy] = WIN(i), x0 = i * TW;
  const deco = i === 0
    ? Array.from({ length: 9 }, (_, n) => <rect key={n} x={wx - 80} y={wy - 110 + n * 25} width="160" height="13" fill={v(0.3)} />)
    : i === 2 ? <path d={`M ${wx - 80} ${wy - 110} L ${wx + 20} ${wy - 110} C ${wx} ${wy}, ${wx + 10} ${wy + 60}, ${wx - 10} ${wy + 110} L ${wx - 80} ${wy + 110} Z`} fill={v(0.42)} />
    : <rect x={wx - 6} y={wy - 110} width="12" height="220" fill={v(0.5)} />;
  return (
    <g>
      <g filter={`url(#fuGradeBg-${g})`}>
        <rect x={x0} y="0" width={TW} height="1080" fill={v(0.22)} />
        <ellipse cx={wx - 60} cy="420" rx="360" ry="360" fill="url(#fuPool)" opacity="0.6" />
        <rect x={wx - 92} y={wy - 122} width="184" height="244" fill={v(0.4)} />
        <rect x={wx - 80} y={wy - 110} width="160" height="220" fill={v(0.85)} />
        <rect x={x0} y="900" width={TW} height="200" fill={v(0.13)} />
      </g>
      <g filter={`url(#fuGradeBg-${g})`}>{deco}</g>
    </g>
  );
}
// the triptych's loupe: the lens shows the post larger. hand: world point; post: the post it looks at
function Loupe({ hand, lc, post: p, s }) {
  const R = RAMPS.open, lensR = 20 * s;
  const oq = lerp2(lc, [p.x, p.y], 0.3);
  const d = [hand[0] - lc[0], hand[1] - lc[1]], n = Math.hypot(d[0], d[1]) || 1, rim = [lc[0] + (d[0] / n) * lensR, lc[1] + (d[1] / n) * lensR];
  const id = `ccLens${Math.round(hand[0])}`;
  return (
    <g>
      <defs><clipPath id={id}><circle cx={lc[0]} cy={lc[1]} r={lensR * 0.9} /></clipPath></defs>
      <g filter="url(#fuGradeFg-red)"><g clipPath={`url(#${id})`}><circle cx={lc[0]} cy={lc[1]} r={lensR} fill={v(0.3)} /><PostValue x={oq[0]} y={oq[1]} s={s * 1.7} rot={p.rot} flip={p.flip} kind={p.kind} /></g></g>
      <line x1={rim[0]} y1={rim[1]} x2={hand[0]} y2={hand[1]} stroke={R[1]} strokeWidth={6 * s} strokeLinecap="round" />
      <circle cx={lc[0]} cy={lc[1]} r={lensR} fill={R[6]} fillOpacity="0.08" stroke={R[2]} strokeWidth={4.5 * s} />
      <path d={`M ${lc[0] - lensR * 0.55} ${lc[1] - lensR * 0.35} A ${lensR * 0.7} ${lensR * 0.7} 0 0 1 ${lc[0] - lensR * 0.05} ${lc[1] - lensR * 0.66}`} fill="none" stroke={R[6]} strokeOpacity="0.7" strokeWidth={1.6 * s} strokeLinecap="round" />
    </g>
  );
}
function Triptych({ k }) {
  const { T } = k;
  const z = glide(T, 0, 10, 1, 1.03);
  const CAM = `translate(960 540) scale(${z}) translate(-960 -540)`;
  const L = (i) => [{ x: WIN(i)[0], y: WIN(i)[1], i: 0.9, reach: 720 }, { dir: [0.4, 1], i: 0.08 }];
  const out = [[], [], []], top = [[], [], []];

  // blue: three friends in a huddle away from the window, talking; the red posts by the window behind them
  {
    const A = { x: 150, y: FLOOR, s: GS, dir: 1, ramp: 'wd', hair: HAIR.wd, pose: { ...POSES.talk(T), tilt: -4 + 3 * osc(T, 1.1) } };
    const Bq = { x: 330, y: FLOOR, s: GS, dir: -1, ramp: 'wd', hair: 'beanie', pose: { ...POSES.idle(T + 0.6), tilt: -2 + 2 * osc(T, 1.7), armN: FOLD_N, armF: FOLD_F } };
    const Cp = { lean: 2 * osc(T, 3.1), tilt: 6 + 3 * osc(T, 1.9), look: [-0.75, 0.1], legL: [4, 2], legR: [4, 2], armL: [14, 18], armR: [10, 12] };
    const posts = Array.from({ length: 6 }, (_, j) => {
      const h = (n) => hash(j * 7.3 + n * 3.1 + 11);
      return { x: 420 + 170 * h(1) + 8 * osc(T, 1.3, h(2)), y: 330 + 330 * h(3) + 8 * osc(T, 0.9, h(4)), rot: -10 + 20 * h(5) + 5 * osc(T, 2.1, h(6)), flip: 0.8 + 0.12 * osc(T, 1.6 + h(7), h(8)), s: 1.15 + 0.3 * h(9), kind: POST_KINDS[(j * 2 + 1) % POST_KINDS.length] };
    });
    out[0].push(<ToneBean key="c" x={240} y={FLOOR - 26} s={GS * 0.92} view="front" pose={Cp} ramp="wd" hair="none" lights={L(0)} id={3} bf={k.bf} amp={k.amp} />);
    out[0].push(<Bean key="a" f={A} k={k} id={1} lights={L(0)} />);
    out[0].push(<Bean key="b" f={Bq} k={k} id={2} lights={L(0)} />);
    top[0].push(<g key="p" filter="url(#fuGradeFg-red)">{posts.map((p, i) => post(p, i))}</g>);
  }
  // teal: a family. The kids study one post through loupes; a parent's hand on each kid's shoulder
  {
    const x0 = TW, cx = x0 + 320;
    const p = { x: cx + 6 * osc(T, 2.6), y: FLOOR - 236 + 6 * osc(T, 1.9, 0.3), rot: -6 + 4 * osc(T, 2.1, 0.4), s: 1.7, flip: 0.9 + 0.06 * osc(T, 1.7), kind: 'chart' };
    const kid = (x, dir, ph, hair) => ({ x, y: FLOOR, s: GS * KS, dir, ramp: 'open', hair, headScale: 1.3, pose: { ...POSES.idle(T + ph), lean: 4, tilt: -14 + 2 * osc(T, 1.9, ph) } });
    const K1 = kid(cx - 118, 1, 0.3, 'long'), K2 = kid(cx + 120, -1, 1.6, 'none');
    // each lens sits on the line from the kid's eye to the post; the hand holds the handle just below it
    const lens = [K1, K2].map((K) => { const hd = headW(K), lc = lerp2(hd, [p.x, p.y], 0.42); armTo(K, [lc[0] - K.dir * 6, lc[1] + 30 * GS * 0.8]); return lc; });
    const P1 = { x: cx - 230, y: FLOOR, s: GS, dir: 1, ramp: 'open', hair: HAIR.open, pose: { ...POSES.idle(T + 0.9), lean: 12, tilt: 20 + 2 * osc(T, 2.4) } };
    const P2 = { x: cx + 236, y: FLOOR, s: GS, dir: -1, ramp: 'open', hair: 'long', pose: { ...POSES.idle(T + 2.2), lean: 11, tilt: 22 + 2 * osc(T, 2.2, 0.3) } };
    const s1 = shoulderW(K1), s2 = shoulderW(K2);
    armTo(P1, [s1[0] - 2, s1[1] - 4]);
    armTo(P2, [s2[0] + 2, s2[1] - 4]);
    out[1].push(<Bean key="p1" f={P1} k={k} id={11} lights={L(1)} />, <Bean key="p2" f={P2} k={k} id={12} lights={L(1)} />);
    out[1].push(<Bean key="k1" f={K1} k={k} id={13} lights={L(1)} />, <Bean key="k2" f={K2} k={k} id={14} lights={L(1)} />);
    top[1].push(<g key="p" filter="url(#fuGradeFg-red)">{post(p, 0)}</g>);
    top[1].push(<Loupe key="l1" hand={handW(K1)} lc={lens[0]} post={p} s={GS * 0.8} />, <Loupe key="l2" hand={handW(K2)} lc={lens[1]} post={p} s={GS * 0.8} />);
  }
  // orange: the curator alone in the room, hand to head, eyes going from side to side; their comfort cards in the other hand
  {
    const x0 = 2 * TW;
    const pose = { lean: -3 + 2 * osc(T, 3.3), tilt: 10 + 3 * osc(T, 2.7), look: [0.8 * Math.sin(T * 1.6), -0.15], legL: [5, 2], legR: [3, 2], armL: [12, 30] };
    const FR = frontRig({ ...pose, armL: [12, 30], armR: [10, 14] }, 1);
    pose.armR = { to: [FR.Hc[0] + 22, FR.Hc[1] - 6 + 2 * osc(T, 0.5)] };
    const fx = x0 + 250;
    const hl = frontRig(pose, 1).armL[2];
    out[2].push(<ToneBean key="o" x={fx} y={FLOOR} s={GS} view="front" pose={pose} ramp="cur" hair={HAIR.cur} lights={L(2)} id={21} bf={k.bf} amp={k.amp} />);
    top[2].push(<g key="w" filter="url(#ccWarm)"><WarmPost x={fx + GS * hl[0] - 4} y={FLOOR + GS * hl[1] + 4} s={GS * 0.85} rot={-14 + 3 * osc(T, 2.3)} flip={1} kind="cat" /></g>);
  }
  return (
    <g>
      <rect width={W} height={H} fill="#0b0c0c" />
      <defs>{GROUPS.map((g, i) => <clipPath key={g} id={'ccPanel' + i}><rect x={i * TW + 6} y="6" width={TW - 12} height="1068" /></clipPath>)}</defs>
      {GROUPS.map((g, i) => (
        <g key={g} clipPath={`url(#ccPanel${i})`}>
          <g transform={CAM}>
            <Room i={i} />
            <g filter={`url(#fuGradeFg-${g})`}><ellipse cx={i * TW + 300} cy="925" rx="260" ry="30" fill="url(#fuPool)" opacity="0.6" /></g>
            {out[i]}
            {top[i]}
          </g>
        </g>
      ))}
    </g>
  );
}

function Piece({ concept, guide, boil, boilAmp }) {
  const { T, CUES } = useComposition();
  const q = { R: CUES.Resistance, Q: CUES.Question, X: CUES.With };
  const items = [
    { at: q.R + 0.44, until: q.Q + 0.2, text: 'Coping is a form of resistance.' },
    { at: q.Q + 0.2, until: q.X + 0.04, text: 'The question is,' },
    { at: q.X + 0.04, until: CUES.Tail + 2, text: 'what do people have to resist with?' },
  ];
  const amp = boil ? boilAmp : 0, bf = Math.floor(T * 8);
  const k = { T, bf, amp };
  const label = concept === 'triptych' ? '2 · Triptych' : '1 · Pillars';
  return (
    <div data-screen-label={`${label} · ${T.toFixed(1)}s`} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: NEUT[1], transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <rect width={W} height={H} fill={NEUT[1]} />
        <LookDefs ramps={GROUPS} bf={bf} amp={amp} />
        <defs>
          <GradeFilter id="ccBack" ramp={NEUT} blur={14} region={[-400, -400, 2720, 1880]} />
          <GradeFilter id="ccWarm" ramp="cur" poster gain={1.18} />
          <linearGradient id="ccCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={v(0.9)} stopOpacity="0.45" /><stop offset="1" stopColor={v(0.7)} stopOpacity="0.1" /></linearGradient>
          <linearGradient id="ccPlinth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={v(0.63)} /><stop offset="1" stopColor={v(0.46)} /></linearGradient>
        </defs>
        {concept === 'triptych' ? <Triptych k={k} /> : <Pillars k={k} />}
      </svg>
      {guide && (
        <React.Fragment>
          <div style={{ position: 'absolute', left: 56, top: 40, font: '700 52px "Open Sans", sans-serif', color: '#ffffff', textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}>{label}</div>
          <Captions items={items} style={{ font: '500 40px "Open Sans", sans-serif', bottom: '5%', textShadow: '0 1px 14px rgba(0,0,0,0.8)' }} />
        </React.Fragment>
      )}
    </div>
  );
}

function FUCopingConcepts() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { concept: 'pillars', referenceOverlay: true, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={NEUT[1]}>
        <Piece concept={t.concept || 'pillars'} guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Concept" />
        <TweakSelect label="Concept" value={t.concept || 'pillars'} options={[{ value: 'pillars', label: '1 · Pillars (the bars, stripped)' }, { value: 'triptych', label: '2 · Triptych (as groups)' }]} onChange={(x) => setTweak('concept', x)} />
        <TweakSection label="Preview" />
        <TweakToggle label="Label + narration guide" value={t.referenceOverlay} onChange={(x) => setTweak('referenceOverlay', x)} />
        <TweakToggle label="Line boil (8 fps)" value={t.lineBoil} onChange={(x) => setTweak('lineBoil', x)} />
        <TweakSlider label="Boil amplitude" value={t.boilAmp ?? 0.5} min={0} max={3} step={0.1} unit="px" onChange={(x) => setTweak('boilAmp', x)} />
      </TweaksPanel>
    </React.Fragment>
  );
}
window.FUCopingConcepts = FUCopingConcepts;
