// Feeding Uncertainty — the three groups side by side (7.00 s), round 2: concept F (Triptych) chosen.
// Three panels, each its own ramp world with a window light, captions below. Word times are estimates until the SRT.
//   withdrawal (blue): dismissive. `wd` = 'wave': glances up, swats the post away with a backhand, turns on their heel,
//     arms folded, chin up. 'flick': turns their back as it arrives, then flicks it away over the shoulder without looking.
//   open engagement (teal): the loupe only appears as the hand comes up; the lens shows the post larger.
//   curation (orange): no loupe; selective. Takes a card, recoils from a red one that darts at them, keeps an eye on it,
//     takes another. `cur` = 'warm': the cards they take are comfort posts (the phone shot's WarmPost) in their ramp;
//     'red': every card is a red post.
// Every frame is a pure function of T.
const { W, H, OUT_W, OUT_H, MOTION, osc, lerp, lerp2 } = window.FU_RIG;
const { POSES, rig } = window.FU_BEAN;
const { RAMPS, v, LookDefs, ToneBean, PostValue, GradeFilter } = window.FU_LOOK;
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
// Returns { pose, turn, cards }. Cards are in the post frame (toward the post, which never flips).
function withdrawal(T, t0, mode) {
  let pose = { ...POSES.idle(T) };
  const Hc0 = rig(pose).Hc, P0 = add(Hc0, [100, -20]);
  const arr = glide(T, t0 - 0.1, t0 + 0.6, 0, 1);
  let p = add(lerp2([230, -440], P0, arr), hover(T, 0.1, arr));
  let rot = lerp(25 * Math.sin(T * 1.7), -6 + 4 * osc(T, 2.1), arr), flip = lerp(flutter(T, 0.1), 0.85, arr);
  let turn, k, fold, aloof;
  if (mode === 'flick') {
    const g1 = glide(T, t0 + 0.2, t0 + 0.35, 0, 1) * (1 - glide(T, t0 + 0.4, t0 + 0.55, 0, 1));   // one glance
    turn = glide(T, t0 + 0.38, t0 + 0.7, 0, 1);                                                // turns their back on it
    aloof = glide(T, t0 + 0.5, t0 + 0.9, 0, 1);
    // the post follows them round to their back; they flick it away over the shoulder without looking
    p = add(p, lerp2([0, 0], [-46, 10], glide(T, t0 + 0.55, t0 + 0.95, 0, 1)));
    const wind = glide(T, t0 + 0.88, t0 + 1.0, 0, 1), fl = hit(T, t0 + 1.0, t0 + 1.12, 0, 1), back = glide(T, t0 + 1.2, t0 + 1.5, 0, 1);
    pose.armN = mixA(mixA(mixA(pose.armN, [-50, 70], wind), [-100, 6], fl), [-10, 125], back);
    k = hit(T, t0 + 1.04, t0 + 2.0, 0, 1);
    fold = back;
    pose.tilt += -10 * g1;
  } else {
    const g1 = glide(T, t0 + 0.3, t0 + 0.48, 0, 1);                                                // looks up at it
    const up = glide(T, t0 + 0.52, t0 + 0.68, 0, 1), fl = hit(T, t0 + 0.68, t0 + 0.8, 0, 1);       // hand up, then the backhand
    turn = glide(T, t0 + 0.8, t0 + 1.1, 0, 1);                                                    // turns on their heel
    const down = glide(T, t0 + 0.95, t0 + 1.3, 0, 1);
    aloof = glide(T, t0 + 0.7, t0 + 1.1, 0, 1);
    pose.armN = mixA(mixA(mixA(pose.armN, [70, 100], up), [118, 12], fl), [-10, 125], down);
    k = hit(T, t0 + 0.74, t0 + 1.7, 0, 1);
    fold = down;
    pose.tilt += -10 * g1 * (1 - aloof);
  }
  // knocked away: off out of the panel, tumbling
  p = add(p, [360 * k, -220 * k + 40 * k * k]);
  rot += 300 * k;
  flip = lerp(flip, Math.cos(T * 14), Math.min(1, k * 3));
  // aloof: chin up, leaning back a little; arms folded
  pose.tilt += -13 * aloof + 1.5 * osc(T, 2.3) * aloof;
  pose.lean += -3 * aloof;
  pose.armF = mixA(pose.armF, [-6, 120], fold);
  return { pose, turn, cards: k < 0.98 ? [{ p, rot, flip, s: 1.2, kind: 'headline', red: true }] : [] };
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
function deco(i) {
  const [wx, wy] = WIN(i);
  if (i === 0) return Array.from({ length: 9 }, (_, k) => <rect key={k} x={wx - 80} y={wy - 110 + k * 25} width="160" height="13" fill={v(0.3)} />);   // blinds drawn
  if (i === 2) return <path d={`M ${wx - 80} ${wy - 110} L ${wx + 20} ${wy - 110} C ${wx} ${wy}, ${wx + 10} ${wy + 60}, ${wx - 10} ${wy + 110} L ${wx - 80} ${wy + 110} Z`} fill={v(0.42)} />;   // a curtain half across
  return <rect x={wx - 6} y={wy - 110} width="12" height="220" fill={v(0.5)} />;
}

function Piece({ guide, boil, boilAmp, wd, cur }) {
  const { T, CUES } = useComposition();
  const bf = Math.floor(T * 8), amp = boil ? boilAmp : 0, ba = { bf, amp };
  const b = { wd: CUES.Withdrawal, open: CUES.Open, cur: CUES.Curation };
  const z = glide(T, 0, 7, 1, 1.03);
  const CAM = `translate(960 540) scale(${z}) translate(-960 -540)`;
  const acts = [withdrawal(T, b.wd, wd), openEng(T, b.open), curation(T, b.cur, cur)];
  const figs = GROUPS.map((g, i) => {
    const a = acts[i];
    let dir = Math.cos(Math.PI * a.turn);
    if (Math.abs(dir) < 0.03) dir = dir < 0 ? -0.03 : 0.03;
    return { g, i, a, x: X0[i] + 240, y: FLOOR, s: FIG_S, dir, lights: [{ x: WIN(i)[0], y: WIN(i)[1], i: 0.9, reach: 720 }, { dir: [0.4, 1], i: 0.08 }] };
  });
  const toW = (f, p) => [f.x + f.dir * f.s * p[0], f.y + f.s * p[1]];   // the figure's frame (flips with them)
  const toP = (f, p) => [f.x + f.s * p[0], f.y + f.s * p[1]];           // the post frame (never flips)
  const clip = (i, el, key) => <g key={key} clipPath={`url(#tgPanel${i})`}>{el}</g>;
  const lay = (filter, content, key) => <g key={key} filter={filter ? `url(#${filter})` : undefined}><g transform={CAM}>{content}</g></g>;
  const lab = GROUPS.map((g) => { const a = glide(T, b[g] - 0.15, b[g] + 0.45, 0, 1); return { a, dy: 14 * (1 - a) }; });
  const card = (f, c, k) => {
    if (c.on === false) return null;
    const p = toP(f, c.p), s = f.s * c.s;
    return c.red ? <PostValue key={k} x={p[0]} y={p[1]} s={s} rot={c.rot} flip={c.flip} kind={c.kind} /> : <WarmPost key={k} x={p[0]} y={p[1]} s={s} rot={c.rot} flip={c.flip} kind={c.kind} />;
  };
  const o = figs[1], oa = o.a, lensR = 20 * o.s * oa.ls, lc = oa.lens ? toW(o, oa.lens) : [0, 0], oh = oa.hand ? toW(o, oa.hand) : [0, 0];
  const oCard = oa.cards[0], oP = toP(o, oCard.p), oQ = lerp2(lc, oP, 0.3);
  return (
    <div data-screen-label="Three groups" style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: '#0b0c0c', transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <LookDefs ramps={GROUPS} bf={bf} amp={amp} />
        <defs>
          {GROUPS.map((g, i) => <clipPath key={g} id={'tgPanel' + i}><rect x={X0[i] + 6} y="6" width={PW - 12} height="1068" /></clipPath>)}
          <GradeFilter id="tgWarm" ramp="cur" poster gain={1.18} />
          <clipPath id="tgLens"><circle cx={lc[0]} cy={lc[1]} r={Math.max(0.1, lensR * 0.9)} /></clipPath>
        </defs>
        {/* the three rooms, out of focus, each in its ramp */}
        {GROUPS.map((g, i) => lay('fuGradeBg-' + g, clip(i, (
          <g>
            <rect x={X0[i]} y="0" width={PW} height="1080" fill={v(0.22)} />
            <ellipse cx={WIN(i)[0] - 60} cy="420" rx="360" ry="360" fill="url(#fuPool)" opacity="0.6" />
            <rect x={WIN(i)[0] - 92} y={WIN(i)[1] - 122} width="184" height="244" fill={v(0.4)} />
            <rect x={WIN(i)[0] - 80} y={WIN(i)[1] - 110} width="160" height="220" fill={v(0.85)} />
            {deco(i)}
            <rect x={X0[i]} y="900" width={PW} height="200" fill={v(0.13)} />
          </g>
        )), 'bg' + g))}
        {GROUPS.map((g, i) => lay('fuGradeFg-' + g, clip(i, <ellipse cx={X0[i] + 280} cy="925" rx="230" ry="30" fill="url(#fuPool)" opacity="0.6" />), 'pool' + g))}
        <g transform={CAM}>
          {figs.map((f) => clip(f.i, <ToneBean {...ba} id={f.i + 1} x={f.x} y={f.y} s={f.s} dir={f.dir} pose={f.a.pose} ramp={f.g} hair={HAIR[f.g]} lights={f.lights} />, 'f' + f.i))}
        </g>
        {lay('fuGradeFg-red', figs.map((f) => clip(f.i, f.a.cards.filter((c) => c.red).map((c, k) => card(f, c, k)), 'r' + f.i)), 'red')}
        {lay('tgWarm', figs.map((f) => clip(f.i, f.a.cards.filter((c) => !c.red).map((c, k) => card(f, c, k)), 'w' + f.i)), 'warm')}
        {/* the loupe: the lens shows the post larger */}
        {oa.ls > 0.02 && lay('fuGradeFg-red', clip(1, <g clipPath="url(#tgLens)"><circle cx={lc[0]} cy={lc[1]} r={lensR} fill={v(0.3)} /><PostValue x={oQ[0]} y={oQ[1]} s={o.s * 1.7} rot={oCard.rot} flip={oCard.flip} kind={oCard.kind} /></g>), 'lens')}
        {oa.ls > 0.02 && lay(null, clip(1, (() => {
          const R = RAMPS.open, d = [oh[0] - lc[0], oh[1] - lc[1]], n = Math.hypot(d[0], d[1]) || 1, rim = [lc[0] + (d[0] / n) * lensR, lc[1] + (d[1] / n) * lensR];
          return (
            <g>
              <line x1={rim[0]} y1={rim[1]} x2={oh[0] + (d[0] / n) * 6 * o.s * oa.ls} y2={oh[1] + (d[1] / n) * 6 * o.s * oa.ls} stroke={R[1]} strokeWidth={6 * o.s * Math.min(1, oa.ls)} strokeLinecap="round" />
              <circle cx={lc[0]} cy={lc[1]} r={lensR} fill={R[6]} fillOpacity="0.08" stroke={R[2]} strokeWidth={4.5 * o.s * Math.min(1, oa.ls)} />
              <path d={`M ${lc[0] - lensR * 0.55} ${lc[1] - lensR * 0.35} A ${lensR * 0.7} ${lensR * 0.7} 0 0 1 ${lc[0] - lensR * 0.05} ${lc[1] - lensR * 0.66}`} fill="none" stroke={R[6]} strokeOpacity="0.7" strokeWidth={1.6 * o.s} strokeLinecap="round" />
            </g>
          );
        })()), 'loupe')}
        {lay(null, GROUPS.map((g, i) => <Lbl key={g} x={X0[i] + PW / 2} y={1030} text={LABEL[g]} fill={RAMPS[g][6]} a={lab[i].a} dy={lab[i].dy * 0.4} />), 'labels')}
      </svg>
      {guide && <div style={{ position: 'absolute', left: 40, top: 28, font: '600 28px Inter, sans-serif', color: '#fff', textShadow: '0 1px 12px rgba(0,0,0,0.8)' }}>{`Three groups · withdrawal ${wd} · curation ${cur} · ${T.toFixed(2)} s`}</div>}
    </div>
  );
}

function FUThreeGroups() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { wd: 'wave', cur: 'warm', referenceOverlay: false, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg="#0b0c0c" autoplay={false}>
        <Piece guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} wd={t.wd} cur={t.cur} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Actions" />
        <TweakSelect label="Withdrawal" value={t.wd} options={[{ value: 'wave', label: 'Wave-off: swat, turn on the heel' }, { value: 'flick', label: 'Flick: back turned, flick over the shoulder' }]} onChange={(x) => setTweak('wd', x)} />
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
