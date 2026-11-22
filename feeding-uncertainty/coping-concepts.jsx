// Feeding Uncertainty — the last shot, replacing the Resistance alley: "Coping is a form of resistance. The question is,
// what do people have to resist with?" (10 s, timing_4.srt word times as in resistance.jsx). Round-1 concept stills, all
// three groups in frame again, in the toned look (LOOK.md). `--set concept=pillars` or `triptych`.
//   pillars  · the bar plot again, stripped of axes and labels: three plinths of their group's ramp, each group hanging out
//              on top of its own. Blue (lowest) sit at the edge chatting with their backs to everything; teal look at a post
//              together; orange are highest, with the red swarm round them: one cowers, one teeters at the edge, arms
//              windmilling, and a third grabs their back. Camera: a zoom out from teal to the whole plot over "Coping is a
//              form of resistance".
//   triptych · three panels, each a group under its own lamp, in its own ramp. Blue: three friends in a huddle, talking,
//              ignoring the red posts behind them. Teal: a family; the two kids study a post through loupes, each parent has a
//              hand on a kid's shoulder. Orange: one curator alone in a wide pool of light, hand to head, looking round.
const { W, H, OUT_W, OUT_H, MOTION, osc, lerp, cam, hash, jitter } = window.FU_RIG;
const { rig, frontRig, POSES, blendPose } = window.FU_BEAN;
const { RAMPS, LookDefs, ToneBean, ToneFilter, PostValue, POST_KINDS, v } = window.FU_LOOK;
const RK = ['wd', 'open', 'cur'];
const NEUTRAL = '#1a1d1c';
const clampN = (x, a, b) => Math.min(b, Math.max(a, x));
const deg = (r) => (r * 180) / Math.PI;

// ── Bean helpers (as in open-engagers.jsx). A figure is { x, y, s, dir, pose, headScale } ──
const toW = (f, p) => [f.x + (f.dir || 1) * f.s * p[0], f.y + f.s * p[1]];
const headW = (f) => toW(f, rig(f.pose, f.headScale || 1).Hc);
const handW = (f) => toW(f, rig(f.pose, f.headScale || 1).armN[2]);
const shoulderW = (f) => toW(f, rig(f.pose, f.headScale || 1).S);
function reachArm(f, P) {
  const A = rig(f.pose, f.headScale || 1).armN[0];
  const dx = ((f.dir || 1) * (P[0] - f.x)) / f.s - A[0], dy = (P[1] - f.y) / f.s - A[1];
  const d = clampN(Math.hypot(dx, dy), 3, 85.5);
  const al = deg(Math.acos((44 * 44 + d * d - 42 * 42) / (2 * 44 * d)));
  const ga = deg(Math.acos((44 * 44 + 42 * 42 - d * d) / (2 * 44 * 42)));
  return [deg(Math.atan2(dx, dy)) - al - f.pose.lean, 180 - ga];
}
const armTo = (f, P) => { f.pose = { ...f.pose, armN: reachArm(f, P) }; };
// seated on an edge: thighs forward, shins hanging (hip about 55 above the feet; the egg's bottom 14 below the hip)
const SIT = (T, ph = 0) => ({ hx: 0, lean: 4 + 1.5 * osc(T, 3.3, ph), tilt: 2 * osc(T, 4.1, ph), legN: [86, 84 + 4 * osc(T, 2.7, ph)], legF: [80, 76 + 6 * osc(T, 3.1, ph + 0.4)], armN: [24, 56], armF: [18, 52], phone: 0 });
const sitY = (top, s) => top + 41 * s;   // floor point for a figure sitting on a ledge at `top`
const COVER = { hx: 0, lean: 28, tilt: 26, legN: [70, 120], legF: [55, 110], armN: [128, 128], armF: [118, 135], phone: 0 };
const guard = (T) => { const b = POSES.idle(T + 1.3); return { ...b, lean: b.lean + 4 + 3 * osc(T, 1.9), tilt: 8 + 5 * osc(T, 1.5, 0.2), armN: [40, 88], armF: [30, 92] }; };

function Bean({ f, k, id, lights, amb = 0.34, view = 'side' }) {
  return <ToneBean x={f.x} y={f.y} dir={f.dir ?? 1} s={f.s} pose={f.pose} view={view} ramp={f.ramp} hair={f.hair || 'none'} lights={lights} amb={amb}
    headScale={f.headScale || 1} hairId={f.hair === 'long' ? `ccHair-${f.ramp}` : undefined} id={id} bf={k.bf} amp={k.amp} />;
}
// red posts circling a point (moths), with a little flutter
const swarm = (T, cx, cy, n, R, seed, s = 0.62, sq = 0.5) => Array.from({ length: n }, (_, i) => {
  const h = (m) => hash(i * 9.1 + m * 3.3 + seed);
  const a = T * (0.45 + 0.5 * h(1)) * (h(2) > 0.4 ? 1 : -1) + 6.28 * h(3);
  const r = R * (0.35 + 0.65 * h(4));
  return { x: cx + r * Math.cos(a), y: cy + sq * r * Math.sin(a) + 12 * osc(T, 1.3 + h(5), h(6)), rot: -25 + 50 * h(7) + 16 * osc(T, 0.9 + h(8)),
    s: s * (0.8 + 0.4 * h(9)), flip: 0.55 + 0.45 * Math.cos(T * (4 + 3 * h(10)) + 6 * h(11)), kind: POST_KINDS[(i + seed) % POST_KINDS.length] };
});
const posts = (P, outline) => P.map((p, i) => <PostValue key={i} x={p.x} y={p.y} s={p.s} rot={p.rot} flip={p.flip} outline={outline} kind={p.kind} />);

// ── concept 1 · Pillars ───────────────────────────────────────────────────────
const BASE = 950, PW = 300;
const PIL = [{ cx: 540, top: 760, r: 'wd' }, { cx: 960, top: 580, r: 'open' }, { cx: 1380, top: 340, r: 'cur' }];
function Pillar({ p, i }) {
  const x0 = p.cx - PW / 2;
  return (
    <g filter={`url(#fuGradeFg-${p.r})`}>
      <defs>
        <linearGradient id={`ccPil${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={v(0.78)} /><stop offset="0.25" stopColor={v(0.6)} /><stop offset="1" stopColor={v(0.3)} />
        </linearGradient>
      </defs>
      <rect x={x0} y={p.top} width={PW} height={BASE - p.top} fill={`url(#ccPil${i})`} />
      <rect x={x0 + PW - 46} y={p.top} width="46" height={BASE - p.top} fill="#000" opacity="0.28" />
      <rect x={x0 - 4} y={p.top - 10} width={PW + 8} height="12" rx="2" fill={v(0.92)} />
    </g>
  );
}
function Pillars({ k }) {
  const { T } = k;
  // camera: from teal's top, zoom out to the whole plot over "Coping is a form of resistance"
  const z = MOTION.glide(T, 0.3, 3.2, 1.5, 1.08), cx = MOTION.glide(T, 0.3, 3.2, 960, 975), cy = MOTION.glide(T, 0.3, 3.2, 520, 575);
  const L = (i) => [{ x: PIL[i].cx - 40, y: PIL[i].top - 300, i: 0.9, reach: 420 }, { dir: [-0.4, 0.9], i: 0.25 }];
  const s = 0.62;
  // blue: three on the lowest plinth, all facing left, away from the swarm, chatting
  const b = PIL[0], bL = b.cx - PW / 2;
  const B1 = { x: bL + 12, y: sitY(b.top, s), s, dir: -1, ramp: 'wd', hair: 'beanie', pose: { ...SIT(T, 0.1), tilt: -4 + 3 * osc(T, 2.3), armN: [30, 40], armF: [40, 30] } };
  const B2 = { x: bL + 110, y: sitY(b.top, s), s, dir: -1, ramp: 'wd', hair: 'long', pose: { ...SIT(T, 0.5), lean: -6, tilt: -6 + 3 * osc(T, 1.7, 0.3), legN: [84, 30], legF: [88, 60], armN: [-40, -20], armF: [-30, -10] } };
  const B3 = { x: bL + 220, y: b.top, s, dir: -1, ramp: 'wd', hair: 'none', pose: { ...POSES.talk(T + 0.7), tilt: 4 } };
  // teal: one holds a post and the other leans in to look at it; a third sits at the right edge and looks up at orange
  const t = PIL[1], tL = t.cx - PW / 2;
  const T1 = { x: tL + 150, y: t.top, s, dir: 1, ramp: 'open', hair: 'beanie', pose: { ...POSES.idle(T), tilt: 18, armN: [62, 50] } };
  const tPost = [handW(T1)[0] + 12, handW(T1)[1] - 14];
  const T2 = { x: tL + 82, y: t.top, s, dir: 1, ramp: 'open', hair: 'long', pose: { ...POSES.idle(T + 1.1), lean: 9, tilt: 14 } };
  armTo(T2, [shoulderW(T1)[0] - 6, shoulderW(T1)[1] + 4]);
  const T3 = { x: tL + PW - 14, y: sitY(t.top, s), s, dir: 1, ramp: 'open', hair: 'none', pose: { ...SIT(T, 0.8), tilt: -24 + 3 * osc(T, 2.1) } };
  // orange: highest, the swarm round them. One cowers, one teeters at the right edge, one grabs them
  const o = PIL[2], oL = o.cx - PW / 2, oR = o.cx + PW / 2;
  const wob = osc(T, 0.9), wob2 = osc(T, 0.45, 0.3);
  const O1 = { x: oR - 2, y: o.top, s, dir: 1, ramp: 'cur', hair: 'none', pose: { hx: 0, lean: 34 + 5 * wob, tilt: 26 - 6 * wob,
    legN: [-6 + 3 * wob, 4], legF: [-48 - 8 * wob2, 40], armN: [118 + 30 * wob2, 10 + 15 * wob], armF: [-150 - 25 * wob2, 20 - 10 * wob], phone: 0 } };
  const O2 = { x: oR - 96, y: o.top, s, dir: 1, ramp: 'cur', hair: 'long', pose: { ...POSES.idle(T + 0.4), lean: -16 + 3 * wob, tilt: 4, legN: [-14, 6], legF: [20, 4], armF: [60, 40] } };
  const grab = toW(O1, rig(O1.pose).H);
  armTo(O2, [grab[0] + 6, grab[1] - 40 * s]);
  const O3 = { x: oL + 70, y: o.top, s, dir: 1, ramp: 'cur', hair: 'beanie', pose: blendPose(guard(T), COVER, 0.75) };
  const sw = [...swarm(T, o.cx - 20, o.top - 120, 18, 320, 3, 0.6, 0.45), ...swarm(T + 4, t.cx + 140, t.top - 210, 4, 160, 11, 0.55, 0.5)];
  const held = { x: tPost[0], y: tPost[1], rot: -12 + 4 * osc(T, 2.2), s: 0.55, flip: 1, kind: 'chart' };
  return (
    <g transform={cam(cx, cy, z)}>
      {/* the plot's grid, far out of focus behind */}
      <g filter="url(#ccSoft)" opacity="0.5">
        {[260, 420, 580, 740, 900].map((y) => <rect key={y} x="-300" y={y} width="2520" height="3" fill="#3a3f3d" />)}
      </g>
      <ellipse cx="960" cy={BASE + 40} rx="1100" ry="120" fill="#232726" opacity="0.8" />
      <rect x="-300" y={BASE} width="2520" height="400" fill="#151817" />
      <rect x="240" y={BASE - 1} width="1440" height="3" fill="#4a504d" opacity="0.7" />
      {PIL.map((p, i) => <Pillar key={i} p={p} i={i} />)}
            <Bean f={B3} k={k} id={13} lights={L(0)} />
      <Bean f={B2} k={k} id={12} lights={L(0)} />
      <Bean f={B1} k={k} id={11} lights={L(0)} />
      <Bean f={T2} k={k} id={22} lights={L(1)} />
      <Bean f={T1} k={k} id={21} lights={L(1)} />
      <Bean f={T3} k={k} id={23} lights={L(1)} />
      <Bean f={O3} k={k} id={33} lights={L(2)} />
      <Bean f={O2} k={k} id={32} lights={L(2)} />
      <Bean f={O1} k={k} id={31} lights={L(2)} />
      <g filter="url(#fuGradeFg-red)">{posts([held], false)}{posts(sw, false)}</g>
    </g>
  );
}

// ── concept 2 · Triptych ──────────────────────────────────────────────────────
const SEP = 14, PWT = (W - 2 * SEP) / 3, FLOOR = 830, LAMP_Y = 250;
function Lamp({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1="0" y1="-600" x2="0" y2="-26" stroke={v(0.3)} strokeWidth="3" />
      <rect x="-7" y="-34" width="14" height="14" rx="3" fill={v(0.32)} />
      <path d="M -10 -22 C -30 -16, -40 -2, -44 14 L 44 14 C 40 -2, 30 -16, 10 -22 Z" fill={v(0.42)} />
      <path d="M -10 -22 C -30 -16, -40 -2, -44 14 L -20 14 C -22 0, -16 -14, -6 -22 Z" fill={v(0.62)} />
      <ellipse cx="0" cy="14" rx="44" ry="7" fill={v(0.98)} />
    </g>
  );
}
// one panel's room: back wall and floor out of focus, the lamp's cone and its pool posterized, all in the panel's ramp
function Room({ r, lx, pool = 1, idx }) {
  const R = RAMPS[r], w = PWT;
  return (
    <g>
      <g filter={`url(#fuGradeBg-${r})`}>
        <rect x="-100" y="-100" width={w + 200} height={FLOOR + 100} fill={v(0.2)} />
        <ellipse cx={lx} cy={FLOOR - 180} rx={300 * pool} ry="330" fill={v(0.4)} />
        <rect x="-100" y={FLOOR} width={w + 200} height={H - FLOOR + 100} fill={v(0.14)} />
        <rect x="-100" y={FLOOR - 4} width={w + 200} height="10" fill={v(0.3)} />
        {idx === 0 && <rect x="70" y="330" width="120" height="170" fill={v(0.32)} />}
        {idx === 1 && <rect x={w - 190} y="360" width="100" height="130" fill={v(0.34)} />}
        {idx === 2 && <rect x="80" y="300" width="150" height="230" fill={v(0.26)} />}
      </g>
      <path d={`M ${lx - 40} ${LAMP_Y + 14} L ${lx + 40} ${LAMP_Y + 14} L ${lx + 250 * pool} ${FLOOR + 40} A ${250 * pool} 40 0 0 1 ${lx - 250 * pool} ${FLOOR + 40} Z`} fill={R[6]} opacity="0.07" />
      <g filter={`url(#fuGradeFg-${r})`}>
        <ellipse cx={lx} cy={FLOOR + 40} rx={250 * pool} ry="40" fill="url(#fuPool)" opacity="0.85" />
        <Lamp x={lx} y={LAMP_Y} />
      </g>
    </g>
  );
}
function Loupe({ hand, at, R, r = 21 }) {
  const d = [at[0] - hand[0], at[1] - hand[1]], n = Math.hypot(d[0], d[1]) || 1, u = [d[0] / n, d[1] / n];
  const c = [hand[0] + u[0] * (r + 6) - 0, hand[1] - r - 4];
  return (
    <g>
      <line x1={hand[0]} y1={hand[1]} x2={c[0] - u[0] * r} y2={c[1] - u[1] * r} stroke={R[1]} strokeWidth="5" strokeLinecap="round" />
      <circle cx={c[0]} cy={c[1]} r={r} fill={R[6]} fillOpacity="0.22" stroke={R[2]} strokeWidth="4" />
      <path d={`M ${c[0] - r * 0.5} ${c[1] - r * 0.25} A ${r * 0.6} ${r * 0.6} 0 0 1 ${c[0] - r * 0.1} ${c[1] - r * 0.6}`} stroke={R[6]} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.8" />
    </g>
  );
}
function Panel({ idx, k }) {
  const { T } = k, r = RK[idx], R = RAMPS[r], lx = PWT / 2 + (idx === 2 ? 50 : 0);
  const L = [{ x: lx, y: LAMP_Y + 16, i: 0.95, reach: 460 }];
  if (idx === 0) {
    // three withdrawers in a huddle, talking; the red posts behind them, which none of them looks at
    const s = 0.9;
    const A = { x: lx - 120, y: FLOOR, s, dir: 1, ramp: 'wd', hair: 'beanie', pose: { ...POSES.talk(T), tilt: -2 } };
    const Bf = { x: lx + 125, y: FLOOR, s, dir: -1, ramp: 'wd', hair: 'long', pose: { ...POSES.idle(T + 0.5), tilt: -4, armN: [20, 60] } };
    const Cp = { lean: 2 * osc(T, 3.1), tilt: -6 + 3 * osc(T, 1.9), look: [-0.7 + 0.15 * osc(T, 2.4), 0], legL: [4, 2], legR: [4, 2], armL: [14, 18], armR: [10, 12] };
    const behind = swarm(T, lx + 40, 330, 9, 300, 5, 0.75, 0.6);
    return (
      <g>
        <Room r={r} lx={lx} idx={idx} />
        <g opacity="0.8" filter="url(#fuGradeFg-red)">{posts(behind, true)}</g>
        <ToneBean x={lx + 4} y={FLOOR - 26} s={0.84} view="front" pose={Cp} ramp="wd" hair="none" lights={L} amb={0.3} id={3} bf={k.bf} amp={k.amp} />
        <Bean f={A} k={k} id={1} lights={L} />
        <Bean f={Bf} k={k} id={2} lights={L} />
        <g filter="url(#fuGradeFg-red)">{posts(swarm(T + 2, lx + 10, 430, 3, 120, 17, 0.75, 0.6), false)}</g>
      </g>
    );
  }
  if (idx === 1) {
    // a family: the kids study one post through loupes, a parent's hand on each kid's shoulder
    const s = 0.92, ks = 0.6;
    const post = { x: lx + 4 + 6 * osc(T, 2.6), y: FLOOR - 150 + 6 * osc(T, 1.9, 0.3), rot: 6 * osc(T, 2.2), s: 1.25, flip: 1, kind: 'feed' };
    const K1 = { x: lx - 104, y: FLOOR, s: ks, dir: 1, ramp: 'open', hair: 'long', headScale: 1.3, pose: { ...POSES.idle(T + 0.3), lean: 6, tilt: 4 } };
    const K2 = { x: lx + 110, y: FLOOR, s: ks, dir: -1, ramp: 'open', hair: 'beanie', headScale: 1.3, pose: { ...POSES.idle(T + 1.6), lean: 8, tilt: 10 } };
    const hd1 = headW(K1), hd2 = headW(K2);
    armTo(K1, [lerp(hd1[0], post.x, 0.3), lerp(hd1[1], post.y, 0.3) + 26]);
    armTo(K2, [lerp(hd2[0], post.x, 0.3), lerp(hd2[1], post.y, 0.3) + 26]);
    const P1 = { x: lx - 200, y: FLOOR, s, dir: 1, ramp: 'open', hair: 'none', pose: { ...POSES.idle(T + 0.9), lean: 10, tilt: 22 } };
    const P2 = { x: lx + 210, y: FLOOR, s, dir: -1, ramp: 'open', hair: 'long', pose: { ...POSES.idle(T + 2.2), lean: 9, tilt: 24 } };
    const sh1 = shoulderW(K1), sh2 = shoulderW(K2);
    armTo(P1, [sh1[0] - 4, sh1[1] - 2]);
    armTo(P2, [sh2[0] + 4, sh2[1] - 2]);
    return (
      <g>
        <Room r={r} lx={lx} idx={idx} />
        <g opacity="0.75" filter="url(#fuGradeFg-red)">{posts(swarm(T, lx, 300, 4, 260, 9, 0.7, 0.5), true)}</g>
        <Bean f={P1} k={k} id={11} lights={L} />
        <Bean f={P2} k={k} id={12} lights={L} />
        <Bean f={K1} k={k} id={13} lights={L} />
        <Bean f={K2} k={k} id={14} lights={L} />
        <g filter="url(#fuGradeFg-red)">{posts([post], false)}</g>
        <Loupe hand={handW(K1)} at={[post.x, post.y]} R={R} />
        <Loupe hand={handW(K2)} at={[post.x, post.y]} R={R} />
      </g>
    );
  }
  // one curator, alone in a wide pool of light: hand to head, looking round
  const s = 0.82;
  const look = osc(T, 3.6) > 0 ? 0.8 : -0.8;
  const pose = { lean: -4 + 2 * osc(T, 3.3), tilt: 12 + 3 * osc(T, 2.7), look: [lerp(-0.8, 0.8, (osc(T, 3.6) + 1) / 2), -0.2], legL: [5, 2], legR: [3, 2], armL: [10, 14] };
  const FR = frontRig({ ...pose, armL: [10, 14], armR: [10, 14] }, 1);
  pose.armR = { to: [FR.Hc[0] + 20, FR.Hc[1] - 4 + 2 * osc(T, 0.4)] };
  return (
    <g>
      <Room r={r} lx={lx} pool={1.35} idx={idx} />
      <g opacity="0.75" filter="url(#fuGradeFg-red)">{posts(swarm(T, lx - 40, 300, 5, 330, 21, 0.6, 0.45), true)}</g>
      <ToneBean x={lx - 30} y={FLOOR + 10} s={s} view="front" pose={pose} ramp="cur" hair="none" lights={L} amb={0.3} id={21} bf={k.bf} amp={k.amp} />
      {look && null}
    </g>
  );
}
function Triptych({ k }) {
  return (
    <g>
      <rect width={W} height={H} fill="#0e0e0e" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * (PWT + SEP)} 0)`}>
          <clipPath id={`ccClip${i}`}><rect width={PWT} height={H} /></clipPath>
          <g clipPath={`url(#ccClip${i})`}><Panel idx={i} k={k} /></g>
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
  const k = { T, bf, amp, J: jitter(bf, amp) };
  const label = concept === 'triptych' ? '2 · Triptych' : '1 · Pillars';
  return (
    <div data-screen-label={`${label} · ${T.toFixed(1)}s`} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: NEUTRAL, transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <rect width={W} height={H} fill={NEUTRAL} />
        <LookDefs ramps={RK} bf={bf} amp={amp} />
        <defs>
          {RK.map((r) => <ToneFilter key={r} id={`ccHair-${r}`} ramp={r} edge={5} depth={0.12} grain={0} soft={1.2} bf={bf} amp={amp} />)}
          <filter id="ccSoft" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="7" /></filter>
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
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={NEUTRAL}>
        <Piece concept={t.concept || 'pillars'} guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Concept" />
        <TweakSelect label="Concept" value={t.concept || 'pillars'} options={[{ value: 'pillars', label: '1 · Pillars (the bar plot)' }, { value: 'triptych', label: '2 · Triptych (groups)' }]} onChange={(v) => setTweak('concept', v)} />
        <TweakSection label="Preview" />
        <TweakToggle label="Label + narration guide" value={t.referenceOverlay} onChange={(v) => setTweak('referenceOverlay', v)} />
        <TweakToggle label="Line boil (8 fps)" value={t.lineBoil} onChange={(v) => setTweak('lineBoil', v)} />
        <TweakSlider label="Boil amplitude" value={t.boilAmp ?? 0.5} min={0} max={3} step={0.1} unit="px" onChange={(v) => setTweak('boilAmp', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}
window.FUCopingConcepts = FUCopingConcepts;
