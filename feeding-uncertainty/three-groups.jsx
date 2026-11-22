// Feeding Uncertainty — the three groups side by side (7.00 s), round 2: concept F (Triptych) chosen.
// Three panels, each its own ramp world with a window light, captions below. Word times are estimates until the SRT.
//   withdrawal (blue): five posts come at them, one after another; every move eases in and out (round 2's snaps were
//     too jerky). `wd` = 'turn': slowly turns their back, arms folded, chin up; the posts gather behind them and some drift
//     off. 'walk': turns and walks out of the light into the corner; the posts hang back. 'blind': posts come in through
//     the window and more gather outside; they pull the roller blind down, the room dims, the posts inside are left as
//     outlines in the dark and the ones outside as shadows on the blind; then they turn their back on it. 'shoo': two
//     slow, lazy waves that push the posts aside, then they turn away, arms folded.
//   open engagement (teal): the loupe only appears as the hand comes up; the lens shows the post larger.
//   curation (orange): no loupe; selective. Takes a card, recoils from a red one that darts at them, keeps an eye on it,
//     takes another. `cur` = 'warm': the cards they take are comfort posts (the phone shot's WarmPost) in their ramp;
//     'red': every card is a red post.
// Every frame is a pure function of T.
const { W, H, OUT_W, OUT_H, MOTION, osc, lerp, lerp2, hash } = window.FU_RIG;
const { POSES, rig, blendPose } = window.FU_BEAN;
const { RAMPS, v, LookDefs, ToneBean, PostValue, POST_KINDS, GradeFilter } = window.FU_LOOK;
const { WarmPost } = window.FU_PHONE;
const { glide, hit } = MOTION;

const GROUPS = ['wd', 'open', 'cur'];
const LABEL = { wd: 'withdrawal', open: 'open engagement', cur: 'curation' };
const HAIR = { wd: 'none', open: 'beanie', cur: 'long' };
const PW = 640, FIG_S = 1.9, FLOOR = 920;
const X0 = GROUPS.map((_, i) => i * PW);
const WIN = (i) => [X0[i] + 470, 300];

// ── helpers ───────────────────────────────────────────────────────────────────
const clampN = (x, a, b) => Math.min(b, Math.max(a, x));
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mixA = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const backOut = (t) => { const c = 1.9; t = clampN(t, 0, 1) - 1; return 1 + (c + 1) * t * t * t + c * t * t; };
const UA = 44, FA = 42, deg = (r) => (r * 180) / Math.PI;
function ikArm(pose, P) {   // the near arm's [shoulder, elbow] that puts the hand on P (figure frame, unscaled)
  const A = rig(pose).armN[0];
  const dx = P[0] - A[0], dy = P[1] - A[1];
  const d = clampN(Math.hypot(dx, dy), Math.abs(UA - FA) + 1, UA + FA - 0.5);
  const al = deg(Math.acos((UA * UA + d * d - FA * FA) / (2 * UA * d)));
  const ga = deg(Math.acos((UA * UA + FA * FA - d * d) / (2 * UA * FA)));
  return [deg(Math.atan2(dx, dy)) - al - pose.lean, 180 - ga];
}
// keyed point track: [[t, [x, y]], …], gliding between keys, holding before the first and after the last
function track2(T, keys) {
  if (T <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (T < keys[i][0]) return lerp2(keys[i - 1][1], keys[i][1], glide(T, keys[i - 1][0], keys[i][0], 0, 1));
  return keys[keys.length - 1][1];
}
const flutter = (T, ph) => Math.cos(T * 6 + ph * 9);
const hover = (T, ph, k = 1) => [3 * k * osc(T, 1.3, ph), 4 * k * osc(T, 0.9, ph)];

// ── withdrawal ────────────────────────────────────────────────────────────────
// Returns { pose, turn, dx, light, blind, cord, win, cards }. Cards are in the post frame (from the figure's starting
// spot, toward the posts; it never flips or walks). dx: how far they have walked, in the post frame.
const WD_OPTIONS = {
  turn: 'Back turned: slowly turns their back, arms folded, chin up',
  walk: 'Walks off: turns and walks out of the light',
  blind: 'Pulls the blind: shuts the posts out, the room dims',
  shoo: 'Shoo: two slow waves, then turns away',
};
const WD_POSTS = Array.from({ length: 5 }, (_, j) => {
  const h = (n) => hash(j * 7.3 + n * 3.1 + 11);
  return { j, ta: -0.25 + 0.27 * j, from: [240 + 70 * h(1), -520 + 160 * h(2)], rest: [74 + 70 * h(3), -110 + 160 * h(4)], kind: POST_KINDS[(j * 2 + 1) % POST_KINDS.length], ph: h(5), h };
});
const FOLD_N = [-10, 125], FOLD_F = [-6, 120];
const WINP = [(WIN(0)[0] - 240) / FIG_S, (WIN(0)[1] - FLOOR) / FIG_S];   // the window, in the post frame
const CORD_X = WIN(0)[0] - 86;                                           // the blind's pull cord (world x)
function withdrawal(T, t0, mode) {
  let pose = { ...POSES.idle(T) };
  const Hc0 = rig(pose).Hc;
  const blindMode = mode === 'blind';
  const posts = WD_POSTS.map((P) => {
    const inside = !blindMode || P.j < 2, from = blindMode ? WINP : P.from;
    const ta = blindMode ? [-0.05, 0.3, -0.3, 0.0, 0.25][P.j] : P.ta;
    const arr = glide(T, t0 + ta, t0 + ta + (blindMode ? 0.9 : 0.75), 0, 1);
    return {
      P, inside, arr, sc: blindMode ? lerp(0.5, 1.2, arr) : 1.2, dark: 0, on: T > t0 + ta - 0.1,
      p: add(lerp2(from, add(Hc0, P.rest), arr), hover(T, P.ph * 3, arr)),
      rot: lerp(25 * Math.sin(T * 1.7 + P.ph * 6), -8 + 16 * P.ph + 4 * osc(T, 2.1, P.ph), arr),
      flip: lerp(flutter(T, P.ph * 3), 0.8 + 0.12 * osc(T, 1.6 + P.ph, P.ph), arr),
    };
  });
  const look = glide(T, t0 - 0.1, t0 + 0.3, 0, 1);
  let turn = 0, dx = 0, fold = 0, aloof = 0, light = 1, blind = 0, cord = null;
  if (mode === 'walk') {
    turn = glide(T, t0 + 0.5, t0 + 1.05, 0, 1);
    const D = 92, go = glide(T, t0 + 0.85, t0 + 2.1, 0, 1);              // distance walked, eased in and out
    dx = -D * go;
    const wk = glide(T, t0 + 0.8, t0 + 1.05, 0, 1) * (1 - glide(T, t0 + 1.85, t0 + 2.15, 0, 1));
    pose = blendPose(pose, POSES.walk((D * go) / 150), wk);              // the walk cycle runs on the distance: feet stay put
    fold = glide(T, t0 + 1.95, t0 + 2.45, 0, 1);
    aloof = 0.7 * glide(T, t0 + 1.9, t0 + 2.6, 0, 1);
    posts.forEach((q, j) => { q.p = add(q.p, [-34 * go * (0.4 + q.P.ph), 0]); });
  } else if (mode === 'blind') {
    const reach = glide(T, t0 + 0.4, t0 + 0.75, 0, 1), pull = glide(T, t0 + 0.75, t0 + 1.35, 0, 1), rel = glide(T, t0 + 1.4, t0 + 1.75, 0, 1);
    blind = pull; light = 1 - 0.7 * pull;
    const knobY = 600 + 110 * pull;
    cord = { x: CORD_X, y1: knobY };
    pose.armN = mixA(pose.armN, ikArm(pose, [(CORD_X - X0[0] - 240) / FIG_S, (knobY + 4 - FLOOR) / FIG_S]), reach * (1 - rel));
    pose.tilt += -7 * reach * (1 - rel);
    turn = glide(T, t0 + 1.5, t0 + 2.1, 0, 1);
    fold = glide(T, t0 + 1.65, t0 + 2.25, 0, 1);
    aloof = glide(T, t0 + 1.75, t0 + 2.45, 0, 1);
    posts.forEach((q) => { q.dark = q.inside ? pull : 0; });
  } else if (mode === 'shoo') {
    const up = glide(T, t0 + 0.45, t0 + 0.8, 0, 1), down = glide(T, t0 + 1.8, t0 + 2.2, 0, 1);
    const sw = T < t0 + 0.75 ? 0 : 0.5 - 0.5 * Math.cos((2 * Math.PI * (T - (t0 + 0.75))) / 0.55);   // two slow waves
    const arm = [62 + 50 * sw, 80 - 60 * sw];
    pose.armN = mixA(pose.armN, arm, up * (1 - down));
    posts.forEach((q, j) => {
      const push = glide(T, t0 + 0.8 + 0.12 * j, t0 + 1.9 + 0.12 * j, 0, 1), h = q.P.h;
      q.p = add(q.p, [(120 + 60 * h(6)) * push, -(70 + 110 * h(7)) * push]);
    });
    turn = glide(T, t0 + 1.7, t0 + 2.3, 0, 1);
    fold = down;
    aloof = glide(T, t0 + 1.85, t0 + 2.5, 0, 1);
  } else {   // turn
    turn = glide(T, t0 + 0.45, t0 + 1.15, 0, 1);
    fold = glide(T, t0 + 0.75, t0 + 1.35, 0, 1);
    aloof = glide(T, t0 + 0.8, t0 + 1.5, 0, 1);
    pose.lean += 4 * Math.sin(Math.PI * turn);   // weight into the turn
    posts.forEach((q, j) => {
      const h = q.P.h, gather = glide(T, t0 + 1.0 + 0.1 * j, t0 + 1.9 + 0.1 * j, 0, 1);   // they drift round to the back
      q.p = lerp2(q.p, add(add(Hc0, [46 + 56 * h(6), -100 + 150 * h(7)]), hover(T, q.P.ph * 5)), gather);
      if (j % 2 === 0) { const leave = glide(T, t0 + 1.8 + 0.3 * j, t0 + 3.2 + 0.3 * j, 0, 1); q.p = add(q.p, [160 * leave, -320 * leave]); }
    });
  }
  // they watch the first ones come; then aloof: chin up, leaning back a little; arms folded
  pose.tilt += -8 * look * (1 - Math.min(1, 2 * turn)) - 11 * aloof + 1.5 * osc(T, 2.3) * aloof;
  pose.lean += -3 * aloof;
  pose.armN = mixA(pose.armN, FOLD_N, fold);
  pose.armF = mixA(pose.armF, FOLD_F, fold);
  const cards = posts.filter((q) => q.on && q.inside).map((q) => ({ p: q.p, rot: q.rot, flip: q.flip, s: q.sc, kind: q.P.kind, red: true, dark: q.dark }));
  // outside the window (blind): approaching the glass, out of focus; shadows on the blind once it is down
  const win = blindMode ? posts.filter((q) => !q.inside && q.on).map((q) => {
    const h = q.P.h;
    return { x: WIN(0)[0] - 52 + 104 * h(6) + 6 * osc(T, 1.4, q.P.ph), y: WIN(0)[1] - 60 + 120 * h(7) + 8 * osc(T, 1.1, q.P.ph), s: lerp(0.4, 1.3, q.arr), rot: q.rot, flip: q.flip, kind: q.P.kind };
  }) : [];
  return { pose, turn, dx, light, blind, cord, win, cards };
}

// ── open engagement ───────────────────────────────────────────────────────────
function openEng(T, t0) {
  let pose = { ...POSES.idle(T + 1.1) };
  const Hc0 = rig(pose).Hc;
  const arr = glide(T, t0 - 0.1, t0 + 0.6, 0, 1);
  const notice = glide(T, t0 + 0.25, t0 + 0.5, 0, 1);
  const lo = glide(T, t0 + 0.42, t0 + 0.95, 0, 1);                  // the hand comes up
  const ls = backOut((T - (t0 + 0.55)) / 0.32);                     // the loupe appears as it rises
  pose.lean += 3 * notice + 5 * lo;
  pose.tilt += -4 * notice * (1 - lo) + 5 * lo + 2 * osc(T, 1.9) * lo;
  const Hc = rig(pose).Hc;
  const handT = add(Hc, [56 + 4 * osc(T, 2.3) * lo, 22]);
  pose.armN = mixA(pose.armN, ikArm(pose, handT), lo);
  const hand = rig(pose).armN[2];
  const lens = add(hand, lerp2([4, -6], [12, -26], ls));
  const p = add(lerp2([230, -440], add(Hc0, [92, -8]), arr), hover(T, 0.4, arr));
  // under the loupe the post turns to show its face
  const flip = lerp(flutter(T, 0.4), 0.82 + 0.16 * glide(T, t0 + 0.9, t0 + 1.3, 0, 1) + 0.05 * osc(T, 1.7), arr);
  return { pose, turn: 0, hand, lens, ls, cards: [{ p, rot: lerp(25 * Math.sin(T * 1.7 + 2), -6 + 4 * osc(T, 2.1, 0.4), arr), flip, s: 1.2, kind: 'chart', red: true }] };
}

// ── curation ──────────────────────────────────────────────────────────────────
function curation(T, t0, mode) {
  let pose = { ...POSES.idle(T + 2.3) };
  const Hc0 = rig(pose).Hc;
  const RA = add(Hc0, [62, 58]), RB = add(Hc0, [66, 30]), CH = add(Hc0, [30, 70]), CH2 = add(Hc0, [22, 64]);
  const HOLD = [4, -6], HOLD_B = [12, -16];
  // the red one: hovers out front, darts at their face, backs off and keeps hovering
  const rArr = glide(T, t0 + 0.2, t0 + 0.85, 0, 1);
  const dart = hit(T, t0 + 1.0, t0 + 1.14, 0, 1), retreat = glide(T, t0 + 1.25, t0 + 1.8, 0, 1);
  const pR = add(lerp2(lerp2(lerp2([300, -470], add(Hc0, [150, -36]), rArr), add(Hc0, [58, -8]), dart), add(Hc0, [146, -52]), retreat), hover(T, 0.8, rArr));
  // flinch: lean back, head down and away, the far arm up as a shield, a half step back
  const fl = hit(T, t0 + 1.02, t0 + 1.2, 0, 1) * (1 - glide(T, t0 + 1.45, t0 + 2.0, 0, 1));
  const wary = glide(T, t0 + 1.45, t0 + 1.9, 0, 1);
  pose.lean += -17 * fl - 3 * wary;
  pose.hx += -16 * fl;
  pose.tilt += 24 * fl - 6 * wary + 8 * glide(T, t0 + 0.3, t0 + 0.5, 0, 1) * (1 - glide(T, t0 + 0.75, t0 + 0.95, 0, 1)) + 4 * glide(T, t0 + 1.55, t0 + 1.75, 0, 1);
  pose.armF = mixA(pose.armF, [150, 40], fl);
  pose.legN = [pose.legN[0] + 30 * fl, pose.legN[1] + 58 * fl];   // a quick duck
  pose.legF = [pose.legF[0] + 26 * fl, pose.legF[1] + 54 * fl];
  // the near hand: reach for A, bring it in, clutch during the flinch, reach for B, bring both in
  const use = glide(T, t0 + 0.3, t0 + 0.5, 0, 1);
  const target = track2(T, [[t0 + 0.3, add(rig(pose).armN[2], [0, 0])], [t0 + 0.6, add(RA, [-HOLD[0], -HOLD[1]])], [t0 + 0.92, CH], [t0 + 1.02, CH], [t0 + 1.18, CH2],
    [t0 + 1.5, CH2], [t0 + 1.62, CH], [t0 + 1.82, add(RB, [-HOLD_B[0], -HOLD_B[1]])], [t0 + 2.08, CH]]);
  if (use > 0) pose.armN = mixA(pose.armN, ikArm(pose, target), use);
  const hand = rig(pose).armN[2];
  // A arrives in reach and is taken at t0 + 0.6; B floats in later and is taken at t0 + 1.82
  const aArr = glide(T, t0 - 0.1, t0 + 0.5, 0, 1), bArr = glide(T, t0 + 1.15, t0 + 1.7, 0, 1);
  const takenA = T >= t0 + 0.6, takenB = T >= t0 + 1.82;
  const warm = mode !== 'red';
  const pA = takenA ? add(hand, HOLD) : add(lerp2([250, -430], RA, aArr), hover(T, 0.6, aArr * (1 - glide(T, t0 + 0.45, t0 + 0.6, 0, 1))));
  const pB = takenB ? add(hand, HOLD_B) : add(lerp2([330, -60], RB, bArr), hover(T, 0.9, bArr * (1 - glide(T, t0 + 1.65, t0 + 1.82, 0, 1))));
  const cards = [
    { p: pR, rot: lerp(25 * Math.sin(T * 1.7 + 4), -10 + 5 * osc(T, 1.1, 0.3) + 14 * dart * (1 - retreat), rArr), flip: lerp(flutter(T, 0.8), 0.85 + 0.1 * osc(T, 0.6), rArr), s: 1.2, kind: 'alert', red: true },
    { p: pB, rot: takenB ? 12 : lerp(20 * Math.sin(T * 1.5 + 1), 6 * osc(T, 2.4), bArr), flip: takenB ? 1 : lerp(flutter(T, 0.9), 0.9, bArr), s: takenB ? 1.0 : 1.2, kind: warm ? 'sun' : 'image', red: !warm, on: T > t0 + 1.0 },
    { p: pA, rot: takenA ? -8 : lerp(20 * Math.sin(T * 1.5), -4 + 5 * osc(T, 2.2), aArr), flip: takenA ? 1 : lerp(flutter(T, 0.6), 0.9, aArr), s: takenA ? 1.0 : 1.2, kind: warm ? 'cat' : 'text', red: !warm },
  ];
  return { pose, turn: 0, cards: T > t0 - 0.2 ? cards : [] };
}

// ── the shot ──────────────────────────────────────────────────────────────────
function Lbl({ x, y, text, size = 24, fill, a = 1, dy = 0, spacing = 0.32 }) {
  if (a <= 0.01) return null;
  return <text x={x} y={y + dy} fill={fill} opacity={a} fontFamily="Inter, sans-serif" fontWeight={300} fontSize={size} letterSpacing={size * spacing} textAnchor="middle">{text.toUpperCase()}</text>;
}
function deco(i, a) {
  const [wx, wy] = WIN(i);
  if (i === 0 && a && a.cord) {   // the roller blind, coming down
    const h = 220 * a.blind;
    return <g><rect x={wx - 80} y={wy - 110} width="160" height={h} fill={v(0.4)} /><rect x={wx - 84} y={wy - 116 + h} width="168" height="10" fill={v(0.26)} /><rect x={wx - 86} y={wy - 124} width="172" height="16" fill={v(0.3)} /></g>;
  }
  if (i === 0) return Array.from({ length: 9 }, (_, k) => <rect key={k} x={wx - 80} y={wy - 110 + k * 25} width="160" height="13" fill={v(0.3)} />);   // blinds drawn
  if (i === 2) return <path d={`M ${wx - 80} ${wy - 110} L ${wx + 20} ${wy - 110} C ${wx} ${wy}, ${wx + 10} ${wy + 60}, ${wx - 10} ${wy + 110} L ${wx - 80} ${wy + 110} Z`} fill={v(0.42)} />;   // a curtain half across
  return <rect x={wx - 6} y={wy - 110} width="12" height="220" fill={v(0.5)} />;
}

// one panel, all its layers. f: { g, i, a, x, hx0, y, s, dir, lights }. Drawn in the panel's own coordinates, so the
// comparison view can place several copies of panel 0.
function Panel({ f, ba, CAM, lab }) {
  const { g, i, a } = f;
  const L = a.light ?? 1;
  const toW = (p) => [f.x + f.dir * f.s * p[0], f.y + f.s * p[1]];   // the figure's frame (flips and walks with them)
  const toP = (p) => [f.hx0 + f.s * p[0], f.y + f.s * p[1]];         // the post frame
  const clip = (el) => <g clipPath={`url(#tgPanel${i})`}>{el}</g>;
  const lay = (filter, content, key) => <g key={key} filter={filter ? `url(#${filter})` : undefined}><g transform={CAM}>{clip(content)}</g></g>;
  const card = (c, k) => {
    if (c.on === false) return null;
    const p = toP(c.p), s = f.s * c.s, d = c.dark || 0;
    if (!c.red) return <WarmPost key={k} x={p[0]} y={p[1]} s={s} rot={c.rot} flip={c.flip} kind={c.kind} />;
    return (
      <g key={k}>
        {d < 1 && <PostValue x={p[0]} y={p[1]} s={s} rot={c.rot} flip={c.flip} kind={c.kind} op={1 - d} />}
        {d > 0 && <PostValue x={p[0]} y={p[1]} s={s} rot={c.rot} flip={c.flip} kind={c.kind} op={d} outline />}
      </g>
    );
  };
  const [wx, wy] = WIN(i);
  const out = [];
  out.push(lay('fuGradeBg-' + g, (
    <g>
      <rect x={X0[i]} y="0" width={PW} height="1080" fill={v(0.22)} />
      <ellipse cx={wx - 60} cy="420" rx="360" ry="360" fill="url(#fuPool)" opacity={0.6 * L} />
      <rect x={wx - 92} y={wy - 122} width="184" height="244" fill={v(0.4)} />
      <rect x={wx - 80} y={wy - 110} width="160" height="220" fill={v(0.85)} />
      <rect x={X0[i]} y="900" width={PW} height="200" fill={v(0.13)} />
    </g>
  ), 'bg'));
  if (a.win && a.win.length) out.push(lay('fuGradeBg-red', <g>{a.win.map((w, k) => <PostValue key={k} x={w.x} y={w.y} s={w.s} rot={w.rot} flip={w.flip} kind={w.kind} />)}</g>, 'winposts'));
  out.push(lay('fuGradeBg-' + g, (
    <g>
      {deco(i, a)}
      {a.win && a.blind > 0 && a.win.map((w, k) => <rect key={k} x={w.x - 15 * w.s} y={w.y - 20 * w.s} width={30 * w.s} height={40 * w.s} rx={5 * w.s} fill={v(0.12)} opacity={0.6 * a.blind} transform={`rotate(${w.rot} ${w.x} ${w.y})`} />)}
      {L < 1 && <rect x={X0[i]} y="0" width={PW} height="1080" fill={v(0)} opacity={0.42 * (1 - L) / 0.7} />}
    </g>
  ), 'deco'));
  out.push(lay('fuGradeFg-' + g, <ellipse cx={X0[i] + 280} cy="925" rx="230" ry="30" fill="url(#fuPool)" opacity={0.6 * L} />, 'pool'));
  if (a.cord) out.push(lay('fuGradeFg-' + g, <g><line x1={a.cord.x} y1={wy - 108} x2={a.cord.x} y2={a.cord.y1} stroke={v(0.5)} strokeWidth="2.5" /><circle cx={a.cord.x} cy={a.cord.y1 + 6} r="7" fill={v(0.7)} /></g>, 'cord'));
  out.push(<g key="fig" transform={CAM}>{clip(<ToneBean {...ba} id={i + 1} x={f.x} y={f.y} s={f.s} dir={f.dir} pose={a.pose} ramp={g} hair={HAIR[g]} lights={f.lights} />)}</g>);
  out.push(lay('fuGradeFg-red', a.cards.filter((c) => c.red).map(card), 'red'));
  out.push(lay('tgWarm', a.cards.filter((c) => !c.red).map(card), 'warm'));
  if (a.ls > 0.02) {   // the loupe: the lens shows the post larger
    const lensR = 20 * f.s * a.ls, lc = toW(a.lens), oh = toW(a.hand), oc = a.cards[0], oq = lerp2(lc, toP(oc.p), 0.3);
    const R = RAMPS.open, d = [oh[0] - lc[0], oh[1] - lc[1]], n = Math.hypot(d[0], d[1]) || 1, rim = [lc[0] + (d[0] / n) * lensR, lc[1] + (d[1] / n) * lensR];
    out.push(<defs key="ld"><clipPath id="tgLens"><circle cx={lc[0]} cy={lc[1]} r={lensR * 0.9} /></clipPath></defs>);
    out.push(lay('fuGradeFg-red', <g clipPath="url(#tgLens)"><circle cx={lc[0]} cy={lc[1]} r={lensR} fill={v(0.3)} /><PostValue x={oq[0]} y={oq[1]} s={f.s * 1.7} rot={oc.rot} flip={oc.flip} kind={oc.kind} /></g>, 'lens'));
    out.push(lay(null, (
      <g>
        <line x1={rim[0]} y1={rim[1]} x2={oh[0] + (d[0] / n) * 6 * f.s * a.ls} y2={oh[1] + (d[1] / n) * 6 * f.s * a.ls} stroke={R[1]} strokeWidth={6 * f.s * Math.min(1, a.ls)} strokeLinecap="round" />
        <circle cx={lc[0]} cy={lc[1]} r={lensR} fill={R[6]} fillOpacity="0.08" stroke={R[2]} strokeWidth={4.5 * f.s * Math.min(1, a.ls)} />
        <path d={`M ${lc[0] - lensR * 0.55} ${lc[1] - lensR * 0.35} A ${lensR * 0.7} ${lensR * 0.7} 0 0 1 ${lc[0] - lensR * 0.05} ${lc[1] - lensR * 0.66}`} fill="none" stroke={R[6]} strokeOpacity="0.7" strokeWidth={1.6 * f.s} strokeLinecap="round" />
      </g>
    ), 'loupe'));
  }
  out.push(lay(null, <Lbl x={X0[i] + PW / 2} y={1030} text={LABEL[g]} fill={RAMPS[g][6]} a={lab.a} dy={lab.dy * 0.4} />, 'label'));
  return <g>{out}</g>;
}
function figOf(i, a) {
  // the turn stays wide for most of its time and passes edge-on in about a frame (a slow turn otherwise shows a sliver)
  const c = Math.cos(Math.PI * a.turn);
  let dir = Math.sign(c) * Math.pow(Math.abs(c), 0.3);
  if (Math.abs(dir) < 0.03) dir = dir < 0 ? -0.03 : 0.03;
  const hx0 = X0[i] + 240, L = a.light ?? 1;
  return { g: GROUPS[i], i, a, hx0, x: hx0 + FIG_S * (a.dx || 0), y: FLOOR, s: FIG_S, dir, lights: [{ x: WIN(i)[0], y: WIN(i)[1], i: 0.9 * L, reach: 720 }, { dir: [0.4, 1], i: 0.08 }] };
}

function Piece({ guide, boil, boilAmp, wd, cur, view }) {
  const { T, CUES } = useComposition();
  const bf = Math.floor(T * 8), amp = boil ? boilAmp : 0, ba = { bf, amp };
  const b = { wd: CUES.Withdrawal, open: CUES.Open, cur: CUES.Curation };
  const z = glide(T, 0, 7, 1, 1.03);
  const CAM = `translate(960 540) scale(${z}) translate(-960 -540)`;
  const lab = GROUPS.map((g) => { const a = glide(T, b[g] - 0.15, b[g] + 0.45, 0, 1); return { a, dy: 14 * (1 - a) }; });
  const compare = view === 'wd';
  const keys = Object.keys(WD_OPTIONS);
  return (
    <div data-screen-label="Three groups" style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: '#0b0c0c', transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <LookDefs ramps={GROUPS} bf={bf} amp={amp} />
        <defs>
          {GROUPS.map((g, i) => <clipPath key={g} id={'tgPanel' + i}><rect x={X0[i] + 6} y="6" width={PW - 12} height="1068" /></clipPath>)}
          <GradeFilter id="tgWarm" ramp="cur" poster gain={1.18} />
        </defs>
        {!compare && [withdrawal(T, b.wd, wd), openEng(T, b.open), curation(T, b.cur, cur)].map((a, i) => <Panel key={i} f={figOf(i, a)} ba={ba} CAM={CAM} lab={lab[i]} />)}
        {compare && keys.map((k, n) => (
          <g key={k}>
            <g transform={`translate(${n * 480} 150) scale(0.75)`}><Panel f={figOf(0, withdrawal(T, b.wd, k))} ba={ba} CAM={CAM} lab={lab[0]} /></g>
            <text x={n * 480 + 240} y="110" fill="#e8e8e4" fontFamily="Inter, sans-serif" fontWeight={600} fontSize="26" textAnchor="middle">{`${n + 1} · ${WD_OPTIONS[k].split(':')[0]}`}</text>
          </g>
        ))}
      </svg>
      {guide && <div style={{ position: 'absolute', left: 40, top: 28, font: '600 28px Inter, sans-serif', color: '#fff', textShadow: '0 1px 12px rgba(0,0,0,0.8)' }}>{compare ? `Withdrawal options · ${T.toFixed(2)} s` : `Three groups · withdrawal ${wd} · curation ${cur} · ${T.toFixed(2)} s`}</div>}
    </div>
  );
}

function FUThreeGroups() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { view: 'shot', wd: 'turn', cur: 'warm', referenceOverlay: false, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg="#0b0c0c" autoplay={false}>
        <Piece guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} wd={t.wd} cur={t.cur} view={t.view} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="View" />
        <TweakSelect label="View" value={t.view} options={[{ value: 'shot', label: 'The shot' }, { value: 'wd', label: 'Withdrawal options side by side' }]} onChange={(x) => setTweak('view', x)} />
        <TweakSection label="Actions" />
        <TweakSelect label="Withdrawal" value={t.wd} options={Object.keys(WD_OPTIONS).map((k) => ({ value: k, label: WD_OPTIONS[k] }))} onChange={(x) => setTweak('wd', x)} />
        <TweakSelect label="Curation" value={t.cur} options={[{ value: 'warm', label: 'Takes comfort posts, recoils from red' }, { value: 'red', label: 'All red: takes some, recoils from one' }]} onChange={(x) => setTweak('cur', x)} />
        <TweakSection label="Preview" />
        <TweakToggle label="Label" value={t.referenceOverlay} onChange={(x) => setTweak('referenceOverlay', x)} />
        <TweakToggle label="Line boil (8 fps)" value={t.lineBoil} onChange={(x) => setTweak('lineBoil', x)} />
        <TweakSlider label="Boil amplitude" value={t.boilAmp ?? 0.5} min={0} max={3} step={0.1} unit="px" onChange={(x) => setTweak('boilAmp', x)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

window.FUThreeGroups = FUThreeGroups;
// The characters' actions, shared with other shots that reuse them (the crisis bar chart).
window.FU_THREE_GROUPS = { withdrawal, openEng, curation, HAIR, backOut };
