// Feeding Uncertainty — the last shot: "Coping is a form of resistance. The question is, what do people have to resist
// with?" (10.00 s, the Resistance timing). Round 2 of coping-concepts.jsx, concept 2 (Triptych as groups), made more real:
// three house interiors side by side, in section, with thin cut walls between them and a floor and ceiling slab. Each room
// is its group's ramp, lit by its own window (as in Three Groups), with a little furniture. The camera slides slowly from
// left to right over the whole shot, so it opens on blue and teal and ends on the curator alone.
//   Blue (living room, blinds drawn): three friends in a huddle, talking, taking turns; red posts slip in through the
//     window one by one and gather behind them. Nobody looks.
//   Teal (kitchen): a family. A post comes in through the window; the two kids raise loupes and lean in (the lens shows
//     the post larger); the parents put a hand on each kid's shoulder on "resistance"; one kid looks up at their parent.
//   Orange (a sparse room, an armchair): the curator alone, a comfort post (cat) in one hand, looking down at it; on "the
//     question" they look up and round; on "what do people" the hand goes to the head. Red posts pass outside the window
//     behind the curtain, out of focus; their eyes follow them.
// Sets are value art: the back wall and window out of focus (fuGradeBg), furniture a little soft and posterized (lpMid),
// people ToneBeans lit by their window, red only through the posts. Every frame is a pure function of T.
const { W, H, OUT_W, OUT_H, MOTION, osc, lerp, lerp2, hash } = window.FU_RIG;
const { rig, frontRig, POSES, blendPose } = window.FU_BEAN;
const { RAMPS, LookDefs, ToneBean, PostValue, POST_KINDS, GradeFilter, v } = window.FU_LOOK;
const { WarmPost } = window.FU_PHONE;
const { glide } = MOTION;
const GROUPS = ['wd', 'open', 'cur'];
const clampN = (x, a, b) => Math.min(b, Math.max(a, x));
const deg = (r) => (r * 180) / Math.PI;
const backOut = (t) => { const c = 1.9; t = clampN(t, 0, 1) - 1; return 1 + (c + 1) * t * t * t + c * t * t; };
const mixA = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// ── the house in section (world units; the camera slides along it) ─────────────
const RW = 720, WT = 34;                         // room width, cut wall thickness
const RX = [0, RW + WT, 2 * (RW + WT)];          // each room's left edge
const WORLD = RX[2] + RW;                        // 2228
const CEIL = 34, WALLB = 884, FLOOR = 936, SLAB = 1036;   // ceiling cut, foot of the back wall, where people stand, floor cut
const GS = 1.35, KS = 0.62;                      // adult scale, child scale (of GS)
const WIN = [[RX[0] + 500, 330], [RX[1] + 470, 330], [RX[2] + 540, 330]];
const CUT = '#151716', CUT_EDGE = '#262a28';     // the cut walls and slabs: neutral, untinted
const lightsOf = (i, k = 1) => [{ x: WIN[i][0], y: WIN[i][1], i: 0.9 * k, reach: 760 }, { dir: [0.4, 1], i: 0.08 }];

// ── Bean helpers ──────────────────────────────────────────────────────────────
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
const armTo = (f, P, t = 1) => { if (t <= 0) return; f.pose = { ...f.pose, armN: mixA(f.pose.armN, reachArm(f, P), t) }; };
const FOLD_N = [-10, 125], FOLD_F = [-6, 120];
function Bean({ f, k, id, lights }) {
  return <ToneBean x={f.x} y={f.y} dir={f.dir ?? 1} s={f.s} pose={f.pose} ramp={f.ramp} hair={f.hair || 'none'} lights={lights}
    headScale={f.headScale || 1} id={id} bf={k.bf} amp={k.amp} />;
}
const Post = ({ p, outline }) => <PostValue x={p.x} y={p.y} s={p.s} rot={p.rot} flip={p.flip} outline={outline} kind={p.kind} op={p.op ?? 1} />;

// ── furniture, in value ───────────────────────────────────────────────────────
function Sofa({ x, w = 360 }) {
  const y = WALLB + 8;
  return (
    <g>
      <rect x={x} y={y - 150} width={w} height="96" rx="22" fill={v(0.36)} />
      <rect x={x - 14} y={y - 92} width="46" height="82" rx="16" fill={v(0.42)} />
      <rect x={x + w - 32} y={y - 92} width="46" height="82" rx="16" fill={v(0.42)} />
      <rect x={x + 18} y={y - 70} width={w - 36} height="44" rx="12" fill={v(0.5)} />
      <rect x={x + 26} y={y - 96} width={(w - 60) / 2} height="40" rx="12" fill={v(0.46)} />
      <rect x={x + 34 + (w - 60) / 2} y={y - 96} width={(w - 60) / 2} height="40" rx="12" fill={v(0.44)} />
      <rect x={x} y={y - 28} width={w} height="18" fill={v(0.28)} />
      <rect x={x + 8} y={y - 10} width="10" height="14" fill={v(0.2)} /><rect x={x + w - 18} y={y - 10} width="10" height="14" fill={v(0.2)} />
    </g>
  );
}
function FloorLamp({ x }) {
  return (
    <g>
      <rect x={x - 3} y={WALLB - 300} width="6" height="300" fill={v(0.3)} />
      <ellipse cx={x} cy={WALLB} rx="26" ry="6" fill={v(0.3)} />
      <path d={`M ${x - 38} ${WALLB - 296} L ${x + 38} ${WALLB - 296} L ${x + 26} ${WALLB - 360} L ${x - 26} ${WALLB - 360} Z`} fill={v(0.62)} />
    </g>
  );
}
function Plant({ x, s = 1 }) {
  const y = WALLB + 4;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[-50, -25, 0, 22, 46].map((a, i) => <ellipse key={i} cx={Math.sin((a * Math.PI) / 180) * 50} cy={-90 - Math.cos((a * Math.PI) / 180) * 40} rx="16" ry="46" fill={v(0.34 + 0.04 * (i % 2))} transform={`rotate(${a} ${Math.sin((a * Math.PI) / 180) * 50} ${-90 - Math.cos((a * Math.PI) / 180) * 40})`} />)}
      <path d="M -30 -64 L 30 -64 L 22 0 L -22 0 Z" fill={v(0.5)} />
    </g>
  );
}
function Picture({ x, y, w, h }) {
  return <g><rect x={x} y={y} width={w} height={h} fill={v(0.3)} /><rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} fill={v(0.46)} /></g>;
}
function Shelves({ x, y }) {
  return (
    <g>
      {[0, 70, 140].map((dy, i) => (
        <g key={i}>
          <rect x={x} y={y + dy} width="190" height="8" fill={v(0.5)} />
          {[0, 1, 2, 3].map((j) => <rect key={j} x={x + 14 + j * 44} y={y + dy - 22 - 16 * hash(i * 4 + j)} width={20 + 8 * hash(i * 4 + j + 9)} height={22 + 16 * hash(i * 4 + j)} rx="4" fill={v(0.38 + 0.14 * hash(i * 4 + j + 3))} />)}
        </g>
      ))}
    </g>
  );
}
function Counter({ x, w }) {
  const y = WALLB + 6;
  return (
    <g>
      <rect x={x} y={y - 160} width={w} height="160" fill={v(0.34)} />
      <rect x={x - 8} y={y - 172} width={w + 16} height="14" fill={v(0.56)} />
      {[0, 1, 2].map((i) => <rect key={i} x={x + 10 + (i * (w - 20)) / 3} y={y - 148} width={(w - 20) / 3 - 10} height="130" fill={v(0.38)} />)}
      <rect x={x + 40} y={y - 210} width="34" height="38" rx="6" fill={v(0.5)} />
      <ellipse cx={x + w - 60} cy={y - 182} rx="34" ry="10" fill={v(0.46)} />
    </g>
  );
}
function Table({ x, w = 220 }) {
  const y = WALLB + 10;
  return (
    <g>
      <rect x={x} y={y - 140} width={w} height="14" fill={v(0.5)} />
      <rect x={x + 12} y={y - 126} width="12" height="126" fill={v(0.34)} /><rect x={x + w - 24} y={y - 126} width="12" height="126" fill={v(0.34)} />
      <g>
        <rect x={x + w + 10} y={y - 190} width="10" height="190" fill={v(0.3)} /><rect x={x + w - 30} y={y - 86} width="56" height="10" fill={v(0.38)} /><rect x={x + w - 26} y={y - 76} width="8" height="76" fill={v(0.3)} />
      </g>
      <ellipse cx={x + w / 2} cy={y - 146} rx="26" ry="6" fill={v(0.6)} />
    </g>
  );
}
function Armchair({ x }) {
  const y = WALLB + 10;
  return (
    <g>
      <rect x={x} y={y - 190} width="170" height="130" rx="30" fill={v(0.38)} />
      <rect x={x - 12} y={y - 104} width="44" height="88" rx="16" fill={v(0.44)} />
      <rect x={x + 138} y={y - 104} width="44" height="88" rx="16" fill={v(0.44)} />
      <rect x={x + 22} y={y - 78} width="126" height="44" rx="12" fill={v(0.5)} />
      <rect x={x + 6} y={y - 30} width="158" height="16" fill={v(0.28)} />
      <rect x={x + 14} y={y - 14} width="8" height="14" fill={v(0.2)} /><rect x={x + 148} y={y - 14} width="8" height="14" fill={v(0.2)} />
    </g>
  );
}
function SideTable({ x }) {
  const y = WALLB + 6;
  return (
    <g>
      <ellipse cx={x} cy={y - 110} rx="40" ry="8" fill={v(0.52)} />
      <rect x={x - 4} y={y - 108} width="8" height="104" fill={v(0.32)} /><ellipse cx={x} cy={y - 2} rx="24" ry="5" fill={v(0.3)} />
      <rect x={x - 10} y={y - 136} width="20" height="24" rx="4" fill={v(0.66)} />
    </g>
  );
}

// ── one room: wall, window, floor (out of focus), furniture (soft, posterized) ──
function windowDeco(i) {
  const [wx, wy] = WIN[i];
  if (i === 0) return Array.from({ length: 9 }, (_, n) => <rect key={n} x={wx - 80} y={wy - 110 + n * 25} width="160" height="13" fill={v(0.3)} />);   // blinds drawn
  if (i === 2) return <path d={`M ${wx - 80} ${wy - 110} L ${wx + 20} ${wy - 110} C ${wx} ${wy}, ${wx + 10} ${wy + 60}, ${wx - 10} ${wy + 110} L ${wx - 80} ${wy + 110} Z`} fill={v(0.42)} />;   // a curtain half across
  return <rect x={wx - 6} y={wy - 110} width="12" height="220" fill={v(0.5)} />;
}
function RoomBack({ i }) {
  const x0 = RX[i], [wx, wy] = WIN[i];
  return (
    <g>
      <rect x={x0 - 20} y="0" width={RW + 40} height={WALLB} fill={v(0.22)} />
      <ellipse cx={wx - 60} cy="440" rx="380" ry="380" fill="url(#fuPool)" opacity="0.6" />
      <rect x={x0 - 20} y={CEIL + 6} width={RW + 40} height="14" fill={v(0.3)} />
      <rect x={wx - 92} y={wy - 122} width="184" height="244" fill={v(0.4)} />
      <rect x={wx - 80} y={wy - 110} width="160" height="220" fill={v(0.85)} />
      <rect x={wx - 100} y={wy + 116} width="200" height="12" fill={v(0.48)} />
      {i === 0 && <Picture x={x0 + 120} y={470} w={150} h={110} />}
      {i === 1 && <rect x={x0 + 40} y={290} width="200" height="10" fill={v(0.3)} />}
      {i === 2 && <Picture x={x0 + 110} y={420} w={90} h={120} />}
      <rect x={x0 - 20} y={WALLB - 22} width={RW + 40} height="22" fill={v(0.3)} />
      <rect x={x0 - 20} y={WALLB} width={RW + 40} height={SLAB - WALLB} fill={v(0.16)} />
      {[0, 1, 2, 3].map((n) => <rect key={n} x={x0 - 20} y={WALLB + 18 + n * n * 9} width={RW + 40} height="2" fill={v(0.2)} />)}
    </g>
  );
}
function RoomFurniture({ i }) {
  const x0 = RX[i];
  if (i === 0) return <g><Sofa x={x0 + 40} w={330} /><FloorLamp x={x0 + 660} /><Plant x={x0 + 400} s={0.75} /></g>;
  if (i === 1) return <g><Shelves x={x0 + 46} y={420} /><Counter x={x0 + 30} w={250} /><Table x={x0 + 480} w={200} /></g>;
  return <g><Armchair x={x0 + 46} /><SideTable x={x0 + 268} /><Plant x={x0 + 660} s={0.9} /></g>;
}
// the cut: walls between the rooms, outer walls, a floor and a ceiling slab. Flat, neutral, with a lit cut edge
function Cuts() {
  const wall = (x) => <g key={x}><rect x={x} y="0" width={WT} height={H + 40} fill={CUT} /><rect x={x} y="0" width="2" height={H + 40} fill={CUT_EDGE} /><rect x={x + WT - 2} y="0" width="2" height={H + 40} fill={CUT_EDGE} /></g>;
  return (
    <g>
      {[RX[0] - WT, RX[1] - WT, RX[2] - WT, WORLD].map(wall)}
      <rect x={-WT - 400} y="-40" width={WORLD + 2 * WT + 800} height={CEIL + 40} fill={CUT} />
      <rect x={-WT - 400} y={CEIL - 2} width={WORLD + 2 * WT + 800} height="2" fill={CUT_EDGE} />
      <rect x={-WT - 400} y={SLAB} width={WORLD + 2 * WT + 800} height={H - SLAB + 60} fill={CUT} />
      <rect x={-WT - 400} y={SLAB} width={WORLD + 2 * WT + 800} height="2" fill={CUT_EDGE} />
    </g>
  );
}

// ── the people and their posts ────────────────────────────────────────────────
function blue(T, w) {
  const x0 = RX[0];
  // who speaks: A, then B (from "the question"), then A again
  const sB = glide(T, w.question - 0.3, w.question + 0.2, 0, 1) * (1 - glide(T, w.resist + 0.4, w.resist + 0.9, 0, 1));
  const sA = 1 - sB;
  const A = { x: x0 + 170, y: FLOOR, s: GS, dir: 1, ramp: 'wd', hair: 'long', pose: blendPose(POSES.idle(T), { ...POSES.talk(T), tilt: -4 + 3 * osc(T, 1.1) }, 0.25 + 0.75 * sA) };
  const bIdle = { ...POSES.idle(T + 0.6), tilt: -2 + 2 * osc(T, 1.7), armN: FOLD_N, armF: FOLD_F };
  const Bq = { x: x0 + 372, y: FLOOR, s: GS, dir: -1, ramp: 'wd', hair: 'beanie', pose: blendPose(bIdle, { ...POSES.talk(T + 0.4), tilt: -3 }, 0.85 * sB) };
  // the third, in front view, looks at whoever is speaking (a small nod now and then)
  const lookX = lerp(-0.75, 0.75, sB);
  const C = { lean: 2 * osc(T, 3.1) + 3 * (sB - 0.5), tilt: 4 + 4 * Math.max(0, osc(T, 1.4)) * (0.5 + 0.5 * osc(T, 4.2)), look: [lookX, 0.1], legL: [4, 2], legR: [4, 2], armL: [14, 18], armR: [10, 12] };
  // red posts slip in through the blinds one by one and gather behind them, by the window
  const [wx, wy] = WIN[0];
  const posts = Array.from({ length: 7 }, (_, j) => {
    const h = (n) => hash(j * 7.3 + n * 3.1 + 11);
    const ta = 0.4 + 1.05 * j, arr = glide(T, ta, ta + 1.4, 0, 1);
    if (T < ta) return null;
    const rest = [x0 + 450 + 190 * h(1), 380 + 340 * h(3)];
    return { x: lerp(wx - 40 + 80 * h(2), rest[0], arr) + 8 * osc(T, 1.3, h(2)) * arr, y: lerp(wy - 60 + 120 * h(4), rest[1], arr) + 8 * osc(T, 0.9, h(4)) * arr,
      rot: lerp(30 * Math.sin(T * 1.7 + 6 * h(5)), -10 + 20 * h(5) + 5 * osc(T, 2.1, h(6)), arr), flip: lerp(Math.cos(T * 5 + 9 * h(7)), 0.8 + 0.12 * osc(T, 1.6 + h(7), h(8)), arr),
      s: lerp(0.45, 1.1 + 0.3 * h(9), arr), op: glide(T, ta, ta + 0.25, 0, 1), kind: POST_KINDS[(j * 2 + 1) % POST_KINDS.length] };
  }).filter(Boolean);
  return {
    back: <ToneBean key="c" x={x0 + 272} y={FLOOR - 28} s={GS * 0.92} view="front" pose={C} ramp="wd" hair="none" lights={lightsOf(0)} id={3} />,
    figs: [{ f: A, id: 1 }, { f: Bq, id: 2 }], posts,
  };
}
function teal(T, w) {
  const x0 = RX[1], cx = x0 + 330;
  const [wx, wy] = WIN[1];
  // the post comes in through the window and settles between the kids, then turns its face to the lenses
  const arr = glide(T, 0.3, 1.9, 0, 1);
  const rest = [cx + 6 * osc(T, 2.6), FLOOR - 250 + 6 * osc(T, 1.9, 0.3)];
  const p = { x: lerp(wx, rest[0], arr), y: lerp(wy, rest[1], arr), rot: lerp(30 * Math.sin(T * 1.6 + 2), -6 + 4 * osc(T, 2.1, 0.4), arr), s: lerp(0.5, 1.7, arr),
    flip: lerp(Math.cos(T * 5 + 1), 0.86 + 0.08 * glide(T, 2.4, 3.0, 0, 1) + 0.05 * osc(T, 1.7), arr), kind: 'chart', op: glide(T, 0.3, 0.5, 0, 1) };
  const kid = (x, dir, ph, hair) => ({ x, y: FLOOR, s: GS * KS, dir, ramp: 'open', hair, headScale: 1.3, pose: { ...POSES.idle(T + ph) } });
  const K1 = kid(cx - 124, 1, 0.3, 'long'), K2 = kid(cx + 126, -1, 1.6, 'none');
  const loupe = [];
  [[K1, 1.35], [K2, 1.6]].forEach(([K, t0], n) => {
    const notice = glide(T, 0.9 + 0.2 * n, 1.5 + 0.2 * n, 0, 1), lo = glide(T, t0, t0 + 0.55, 0, 1);
    // looking up at the post as it comes, then leaning in to it
    K.pose = { ...K.pose, lean: K.pose.lean + 4 * lo, tilt: K.pose.tilt - 18 * notice * (1 - lo) - 14 * lo + 2 * osc(T, 1.9, n) * lo };
    // one kid looks up at their parent on "people", and back
    if (n === 0) { const up = glide(T, w.people, w.people + 0.4, 0, 1) * (1 - glide(T, w.with + 0.2, w.with + 0.7, 0, 1)); K.pose.tilt -= 22 * up; K.pose.lean -= 6 * up; }
    const hd = headW(K), lc = lerp2(hd, [rest[0], rest[1]], 0.42);
    armTo(K, [lc[0] - K.dir * 6, lc[1] + 30 * GS * 0.8], lo);
    const hw = handW(K);   // the lens rides on the hand, just above it (on the eye-to-post line once the hand is up)
    loupe.push({ hand: hw, lc: [hw[0] + K.dir * 6, hw[1] - 30 * GS * 0.8], ls: backOut((T - (t0 + 0.12)) / 0.32), lo });
  });
  const P1 = { x: cx - 240, y: FLOOR, s: GS, dir: 1, ramp: 'open', hair: 'beanie', pose: { ...POSES.idle(T + 0.9) } };
  const P2 = { x: cx + 246, y: FLOOR, s: GS, dir: -1, ramp: 'open', hair: 'long', pose: { ...POSES.idle(T + 2.2) } };
  [[P1, K1, w.resistance - 0.1, -1], [P2, K2, w.resistance + 0.25, 1]].forEach(([P, K, t0, sx]) => {
    const go = glide(T, t0, t0 + 0.6, 0, 1);
    P.pose = { ...P.pose, lean: P.pose.lean + 10 * go, tilt: P.pose.tilt + 8 + 12 * go + 2 * osc(T, 2.4) * go };
    const sh = shoulderW(K);
    armTo(P, [sh[0] + sx * 2, sh[1] - 4], go);
  });
  // the parent nods back when the kid looks up
  const nod = glide(T, w.people + 0.2, w.people + 0.5, 0, 1) * (1 - glide(T, w.with, w.with + 0.5, 0, 1));
  P1.pose.tilt += 8 * nod * (0.6 + 0.4 * osc(T, 0.6));
  return { figs: [{ f: P1, id: 11 }, { f: P2, id: 12 }, { f: K1, id: 13 }, { f: K2, id: 14 }], post: p, loupe };
}
function orange(T, w) {
  const x0 = RX[2], fx = x0 + 410;
  const [wx, wy] = WIN[2];
  // red posts outside, passing behind the curtain, out of focus
  const outside = Array.from({ length: 4 }, (_, j) => {
    const t0 = 5.2 + 0.45 * j, u = (T - t0) / 2.6;
    if (u < 0 || u > 1) return null;
    return { x: wx - 140 + 300 * u, y: wy - 70 + 60 * j * 0.5 + 20 * Math.sin(u * 6 + j), rot: 20 * Math.sin(T * 2 + j), flip: Math.cos(T * 4 + j * 2), s: 0.9, kind: POST_KINDS[(j * 3) % POST_KINDS.length] };
  }).filter(Boolean);
  const up = glide(T, w.question - 0.25, w.question + 0.35, 0, 1);         // looks up from the card
  const hand = glide(T, w.what - 0.05, w.what + 0.65, 0, 1);              // hand to head
  const follow = glide(T, 5.6, 6.1, 0, 1) * (1 - glide(T, 7.4, 8.0, 0, 1));   // eyes after the posts at the window
  const roam = Math.sin((T - w.question) * 1.5) * up;
  const pose = { lean: -2 + 2 * osc(T, 3.3) - 2 * hand, tilt: lerp(12, 4, up) + 8 * hand + 3 * osc(T, 2.7) * up,
    look: [lerp(-0.35, lerp(0.75 * roam, 0.85, follow), up), lerp(0.55, lerp(-0.1, -0.3, follow), up)], legL: [5, 2], legR: [3, 2], armL: [12, 30], armR: [10, 14] };
  const FR = frontRig(pose, 1);
  const tgt = [FR.Hc[0] + 22, FR.Hc[1] - 6 + 2 * osc(T, 0.5) * hand];
  pose.armR = { to: lerp2(FR.armR[2], tgt, hand) };
  const hl = frontRig(pose, 1).armL[2];
  const card = { x: fx + GS * hl[0] - 4, y: FLOOR + GS * hl[1] + 4, s: GS * 0.85, rot: -14 + 3 * osc(T, 2.3) + 6 * (1 - up), kind: 'cat' };
  return { x: fx, pose, card, outside };
}

// ── the shot ──────────────────────────────────────────────────────────────────
function Loupe({ hand, lc, post: p, s, ls }) {
  if (ls <= 0.02) return null;
  const R = RAMPS.open, lensR = 20 * s * ls, k = Math.min(1, ls);
  const oq = lerp2(lc, [p.x, p.y], 0.3);
  const d = [hand[0] - lc[0], hand[1] - lc[1]], n = Math.hypot(d[0], d[1]) || 1, rim = [lc[0] + (d[0] / n) * lensR, lc[1] + (d[1] / n) * lensR];
  const id = `cpLens${Math.round(hand[0])}`;
  return (
    <g>
      <defs><clipPath id={id}><circle cx={lc[0]} cy={lc[1]} r={lensR * 0.9} /></clipPath></defs>
      <g filter="url(#cpRed)"><g clipPath={`url(#${id})`}><circle cx={lc[0]} cy={lc[1]} r={lensR} fill={v(0.3)} /><PostValue x={oq[0]} y={oq[1]} s={s * 1.7} rot={p.rot} flip={p.flip} kind={p.kind} /></g></g>
      <line x1={rim[0]} y1={rim[1]} x2={hand[0]} y2={hand[1]} stroke={R[1]} strokeWidth={6 * s * k} strokeLinecap="round" />
      <circle cx={lc[0]} cy={lc[1]} r={lensR} fill={R[6]} fillOpacity="0.08" stroke={R[2]} strokeWidth={4.5 * s * k} />
      <path d={`M ${lc[0] - lensR * 0.55} ${lc[1] - lensR * 0.35} A ${lensR * 0.7} ${lensR * 0.7} 0 0 1 ${lc[0] - lensR * 0.05} ${lc[1] - lensR * 0.66}`} fill="none" stroke={R[6]} strokeOpacity="0.7" strokeWidth={1.6 * s} strokeLinecap="round" />
    </g>
  );
}

function Piece({ guide, boil, boilAmp }) {
  const { T, CUES } = useComposition();
  const q = { R: CUES.Resistance, Q: CUES.Question, X: CUES.With };
  // word timings (timing_4.srt, as in resistance.jsx), anchored to their sections
  const w = { coping: q.R + 0.44, resistance: q.R + 1.96, question: q.Q + 0.44, what: q.X + 0.04, people: q.X + 0.24, resist: q.X + 1.28, with: q.X + 1.6 };
  const items = [
    { at: w.coping, until: q.Q + 0.2, text: 'Coping is a form of resistance.' },
    { at: q.Q + 0.2, until: w.what, text: 'The question is,' },
    { at: w.what, until: CUES.Hold, text: 'what do people have to resist with?' },
  ];
  const amp = boil ? boilAmp : 0, bf = Math.floor(T * 8);
  const k = { bf, amp };
  // the slide: one slow, even move from the left of the house to the right over the whole shot
  const cx = glide(T, 0, CUES.Hold + 0.24, 960, WORLD - 960);
  const CAM = `translate(${(960 - cx).toFixed(3)} 0)`;
  const clip = (i, el) => <g clipPath={`url(#cpRoom${i})`}>{el}</g>;
  const lay = (filter, content, key) => <g key={key} filter={filter ? `url(#${filter})` : undefined}><g transform={CAM}>{content}</g></g>;

  const B = blue(T, w), Tl = teal(T, w), O = orange(T, w);
  const layers = [];
  GROUPS.forEach((g, i) => {
    layers.push(lay('fuGradeBg-' + g, clip(i, <RoomBack i={i} />), 'back' + i));
    if (i === 2 && O.outside.length) layers.push(lay('cpRedBg', clip(i, <g>{O.outside.map((p, j) => <Post key={j} p={p} />)}</g>), 'out'));
    layers.push(lay('fuGradeBg-' + g, clip(i, windowDeco(i)), 'deco' + i));
    layers.push(lay('cpMid-' + g, clip(i, <RoomFurniture i={i} />), 'furn' + i));
    layers.push(lay('fuGradeFg-' + g, clip(i, <ellipse cx={RX[i] + 330} cy={FLOOR + 6} rx="270" ry="30" fill="url(#fuPool)" opacity="0.55" />), 'pool' + i));
  });
  // people (ToneBeans carry their own filters), each kept inside their room
  const bean = (f, id, i) => <Bean key={id} f={f} k={k} id={id} lights={lightsOf(i)} />;
  layers.push(<g key="people" transform={CAM}>
    {clip(0, <g>{React.cloneElement(B.back, { bf, amp })}{B.figs.map(({ f, id }) => bean(f, id, 0))}</g>)}
    {clip(1, <g>{Tl.figs.map(({ f, id }) => bean(f, id, 1))}</g>)}
    {clip(2, <ToneBean x={O.x} y={FLOOR} s={GS} view="front" pose={O.pose} ramp="cur" hair="none" lights={lightsOf(2)} id={21} bf={bf} amp={amp} />)}
  </g>);
  layers.push(lay('cpRed', <g>{clip(0, <g>{B.posts.map((p, j) => <Post key={j} p={p} />)}</g>)}{clip(1, <Post p={Tl.post} />)}</g>, 'red'));
  layers.push(<g key="loupes" transform={CAM}>{clip(1, <g>{Tl.loupe.map((L, n) => <Loupe key={n} hand={L.hand} lc={L.lc} post={Tl.post} s={GS * 0.8} ls={L.ls} />)}</g>)}</g>);
  layers.push(lay('cpWarm', clip(2, <WarmPost x={O.card.x} y={O.card.y} s={O.card.s} rot={O.card.rot} flip={1} kind={O.card.kind} />), 'warm'));
  layers.push(<g key="cuts" transform={CAM}><Cuts /></g>);

  return (
    <div data-screen-label={`Coping · ${T.toFixed(1)}s`} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: CUT, transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <rect width={W} height={H} fill={CUT} />
        <LookDefs ramps={GROUPS} bf={bf} amp={amp} />
        <defs>
          {GROUPS.map((g) => <GradeFilter key={g} id={'cpMid-' + g} ramp={g} poster blur={2.2} />)}
          <GradeFilter id="cpRed" ramp="red" poster />
          <GradeFilter id="cpRedBg" ramp="red" blur={9} />
          <GradeFilter id="cpWarm" ramp="cur" poster gain={1.18} />
          {GROUPS.map((g, i) => <clipPath key={g} id={'cpRoom' + i}><rect x={RX[i]} y={CEIL} width={RW} height={SLAB - CEIL} /></clipPath>)}
        </defs>
        {layers}
      </svg>
      {guide && <Captions items={items} style={{ font: '500 40px "Open Sans", sans-serif', bottom: '5%', textShadow: '0 1px 14px rgba(0,0,0,0.8)' }} />}
    </div>
  );
}

function FUCoping() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { referenceOverlay: true, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={CUT}>
        <Piece guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Preview" />
        <TweakToggle label="Narration guide" value={t.referenceOverlay} onChange={(x) => setTweak('referenceOverlay', x)} />
        <TweakToggle label="Line boil (8 fps)" value={t.lineBoil} onChange={(x) => setTweak('lineBoil', x)} />
        <TweakSlider label="Boil amplitude" value={t.boilAmp ?? 0.5} min={0} max={3} step={0.1} unit="px" onChange={(x) => setTweak('boilAmp', x)} />
      </TweaksPanel>
    </React.Fragment>
  );
}
window.FUCoping = FUCoping;
