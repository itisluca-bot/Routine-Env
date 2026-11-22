// Feeding Uncertainty — the three coping groups side by side (7.00 s): round-1 layout concepts, rough.
// Every concept shares the same beats and the same three actions (`actor`), so beats and layouts can be swapped:
//   withdrawal (blue) turns away from a post; open engagement (teal) looks at one through a loupe;
//   curation (orange) does a bit of both: looks through the loupe at arm's length, then turns away from the post as it
//   darts in, keeping the loupe pointed back at it over their shoulder.
// Mixed beat: the world outside the light is neutral (the alley's night); each group's light is in its own ramp.
// Word times are estimates until the SRT arrives. Every frame is a pure function of T. Pick one with `--set concept=C`.
const { W, H, OUT_W, OUT_H, MOTION, osc, lerp, lerp2, hash } = window.FU_RIG;
const { POSES, rig } = window.FU_BEAN;
const { RAMPS, v, LookDefs, ToneBean, PostValue, POST_KINDS, GradeFilter } = window.FU_LOOK;
const { glide, hit } = MOTION;
const clampN = (x, a, b) => Math.min(b, Math.max(a, x));

const CONCEPTS = {
  A: 'A · Plinths: three exhibits in a gallery, a spot each, museum plaques',
  B: 'B · Dollhouse: one house in section, a room each, labels on the floor slab',
  C: 'C · Swivel chairs: a talk-show stage; blue swivels away',
  D: 'D · Bus stop: one bench, three bays, a strip light each, stop signs',
  E: 'E · Islands: three floating islands with a lamp and a signpost each',
  F: 'F · Triptych: three panels, each its own ramp world, captions',
  G: 'G · Seesaw: blue and teal at the ends, orange balancing in the middle',
  H: 'H · Lamps: three hanging lamps in the dark, labels on the floor',
};
const GROUPS = ['wd', 'open', 'cur'];
const LABEL = { wd: 'withdrawal', open: 'open engagement', cur: 'curation' };
const HAIR = { wd: 'none', open: 'beanie', cur: 'long' };
const KIND = { wd: 'headline', open: 'chart', cur: 'alert' };
const NEUT = ['#121413', '#1a1d1c', '#232725', '#2e3330', '#444a46', '#666c67', '#a3a69e'];   // the night outside the light

// ── the three actions ─────────────────────────────────────────────────────────
const UA = 44, FA = 42, deg = (r) => (r * 180) / Math.PI;
function ikArm(pose, P) {   // the near arm's [shoulder, elbow] that puts the hand on P (figure frame, unscaled)
  const A = rig(pose).armN[0];
  const dx = P[0] - A[0], dy = P[1] - A[1];
  const d = clampN(Math.hypot(dx, dy), Math.abs(UA - FA) + 1, UA + FA - 0.5);
  const al = deg(Math.acos((UA * UA + d * d - FA * FA) / (2 * UA * d)));
  const ga = deg(Math.acos((UA * UA + FA * FA - d * d) / (2 * UA * FA)));
  return [deg(Math.atan2(dx, dy)) - al - pose.lean, 180 - ga];
}
const mixA = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const SIT = (T, ph = 0) => ({ hx: 0, lean: 4 + 1.5 * osc(T, 3.3, ph), tilt: 2 * osc(T, 4.1, ph), legN: [86, 88], legF: [80, 84], armN: [24, 56], armF: [18, 52], phone: 0 });

// f: { g, x, y, s, face, seated, from }. Returns the pose, the facing (dir), the loupe and the post, in the figure's frames.
function actor(f, T, b) {
  const g = f.g, ph = { wd: 0, open: 0.37, cur: 0.71 }[g];
  const base = f.seated ? SIT(T, ph) : POSES.idle(T + 3 * ph);
  let pose = { ...base };
  const Hc0 = rig(base).Hc;
  const from = f.from || [330, -760];
  let turn = 0, lo = 0, back = 0, arr = 0, post, handT = null;
  if (g === 'wd') {
    const t0 = b.wd;
    arr = glide(T, t0 - 0.1, t0 + 0.75, 0, 1);
    const look = glide(T, t0 + 0.3, t0 + 0.7, 0, 1) * (1 - glide(T, t0 + 0.85, t0 + 1.05, 0, 1));
    turn = glide(T, t0 + 0.85, t0 + 1.2, 0, 1);
    const hunch = glide(T, t0 + 1.0, t0 + 1.6, 0, 1);
    pose.tilt += -12 * look + 22 * hunch;
    pose.lean += 10 * hunch;
    pose.armN = mixA(pose.armN, [30, 100], hunch);
    pose.armF = mixA(pose.armF, [26, 100], hunch);
    post = add(lerp2(from, add(Hc0, [104, -26]), arr), [-30 * hunch, 12 * hunch]);
  } else if (g === 'open') {
    const t0 = b.open;
    arr = glide(T, t0 - 0.1, t0 + 0.7, 0, 1);
    lo = glide(T, t0 + 0.3, t0 + 0.85, 0, 1);
    pose.lean += 7 * lo;
    pose.tilt += 5 * lo + 2 * osc(T, 1.9) * lo;
    const Hc = rig(pose).Hc;
    handT = add(Hc, [56 + 4 * osc(T, 2.3) * lo, 22]);
    post = lerp2(from, add(Hc0, [92, -8]), arr);
  } else {
    const t0 = b.cur;
    arr = glide(T, t0 - 0.1, t0 + 0.7, 0, 1);
    const dart = hit(T, t0 + 1.0, t0 + 1.3, 0, 1);
    lo = glide(T, t0 + 0.25, t0 + 0.7, 0, 1);
    turn = glide(T, t0 + 1.05, t0 + 1.4, 0, 1);
    back = glide(T, t0 + 1.3, t0 + 1.85, 0, 1);
    pose.lean += -5 * lo * (1 - turn) + 5 * turn;
    pose.tilt += 3 * lo + 8 * turn - 12 * back;
    const Hc = rig(pose).Hc;
    handT = lerp2(add(Hc, [74, 18]), add(Hc, [-60, 30]), back);
    post = lerp2(lerp2(from, add(Hc0, [156, -10]), arr), add(Hc0, [84, -14]), dart);
  }
  if (handT && lo > 0) { const r = ikArm(pose, handT); pose.armN = mixA(pose.armN, r, lo); }
  const R = rig(pose);
  const lensOff = lerp2(lerp2([2, 30], [12, -26], lo), [-12, -26], back);
  const hover = [3 * osc(T, 1.3, ph), 4 * osc(T, 0.9, ph)];
  let dir = (f.face || 1) * Math.cos(Math.PI * turn);
  if (Math.abs(dir) < 0.03) dir = dir < 0 ? -0.03 : 0.03;
  return {
    pose, dir, loupe: g !== 'wd', lo, hand: R.armN[2], lens: add(R.armN[2], lensOff), magn: g === 'wd' ? 0 : Math.max(lo, back),
    post: add(post, hover), postOn: T > ({ wd: b.wd, open: b.open, cur: b.cur })[g] - 0.2,
    flip: lerp(Math.cos(T * 6 + ph * 9), 0.8 + 0.15 * osc(T, 1.7, ph), arr), rot: lerp(25 * Math.sin(T * 1.7 + ph * 5), -6 + 4 * osc(T, 2.1, ph), arr),
  };
}
// figure frame → world (with the figure's current facing), and the post's frame (toward the post, never flips)
const toW = (f, a, p) => [f.x + a.dir * f.s * p[0], f.y + f.s * p[1]];
const toP = (f, p) => [f.x + (f.face || 1) * f.s * p[0], f.y + f.s * p[1]];

// ── small value-art helpers ───────────────────────────────────────────────────
const blob = (cx, cy, rx, ry, x, op = 1) => <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={v(x)} opacity={op} />;
const pool = (cx, cy, rx, ry, op = 1) => <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#fuPool)" opacity={op} />;
const cone = (x, y0, w0, y1, w1, op = 1) => <path d={`M ${x - w0} ${y0} L ${x + w0} ${y0} L ${x + w1} ${y1} L ${x - w1} ${y1} Z`} fill="url(#tgCone)" opacity={op} />;
function Shade({ x, y, rot = 0, cable = 300, s = 1 }) {   // a hanging lamp in value; (x, y) is the shade's mouth
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <line x1="0" y1={-cable / s} x2="0" y2="-26" stroke={v(0.3)} strokeWidth="3" />
      <rect x="-7" y="-34" width="14" height="14" rx="3" fill={v(0.32)} />
      <path d="M -10 -22 C -30 -16, -40 -2, -44 14 L 44 14 C 40 -2, 30 -16, 10 -22 Z" fill={v(0.42)} />
      <path d="M -10 -22 C -30 -16, -40 -2, -44 14 L -20 14 C -22 0, -16 -14, -6 -22 Z" fill={v(0.62)} />
      <ellipse cx="0" cy="14" rx="44" ry="7" fill={v(0.98)} />
    </g>
  );
}
// a label: the opening title's type (Inter Light, widely spaced caps), fading in with a small rise
function Lbl({ x, y, text, size = 22, fill, a = 1, dy = 0, spacing = 0.32, anchor = 'middle', weight = 300 }) {
  if (a <= 0.01) return null;
  return <text x={x} y={y + dy} fill={fill} opacity={a} fontFamily="Inter, sans-serif" fontWeight={weight} fontSize={size} letterSpacing={size * spacing} textAnchor={anchor}>{text.toUpperCase()}</text>;
}
const lblW = (text, size, spacing = 0.32) => text.length * size * (0.62 + spacing);

// ── layouts ───────────────────────────────────────────────────────────────────
// Each returns { figs, back (neutral, out of focus), haze(i) (group i's light, out of focus), set (neutral, sharp),
// lit(i, a) (group i's lit props, posterized), labels(lab), defs, bg }.
const LAYOUTS = {
  // A · Plinths: three exhibits on plinths of different heights, a ceiling spot each, a museum plaque on each plinth
  A(T) {
    const X = [500, 960, 1420], PH = [200, 270, 235], FL = 910;
    const figs = GROUPS.map((g, i) => ({ g, x: X[i], y: FL - PH[i], s: 1.35, face: 1, lights: [{ x: X[i] - 40, y: -60, i: 1, reach: 640 }, { dir: [0.3, 1], i: 0.08 }] }));
    return {
      figs,
      back: (
        <g>
          <rect x="-200" y="-200" width="2320" height="1480" fill={v(0.16)} />
          <rect x="-200" y={FL} width="2320" height="400" fill={v(0.1)} />
          <rect x="-200" y={FL - 16} width="2320" height="16" fill={v(0.12)} />
          {[730, 1190].map((x) => <rect key={x} x={x - 60} y="300" width="120" height="160" fill={v(0.12)} stroke={v(0.22)} strokeWidth="10" />)}
        </g>
      ),
      haze: (i) => <g>{pool(X[i], FL - PH[i] - 200, 260, 330, 0.5)}{cone(X[i], -20, 26, FL - PH[i], 120, 0.7)}</g>,
      lit: (i) => {
        const x = X[i], t = FL - PH[i];
        return (
          <g>
            {pool(x, FL + 6, 240, 30, 0.6)}
            <rect x={x - 110} y={t} width="220" height={PH[i]} fill="url(#tgPlinth)" />
            <rect x={x - 118} y={t - 14} width="236" height="16" fill={v(0.85)} />
            <rect x={x + 70} y={t + 2} width="40" height={PH[i] - 2} fill={v(0.22)} opacity="0.6" />
          </g>
        );
      },
      labels: (lab) => GROUPS.map((g, i) => {
        const R = RAMPS[g], w = lblW(LABEL[g], 15) + 30, x = X[i] - 10, y = FL - PH[i] + 60;
        return (
          <g key={g} opacity={lab[i].a} transform={`translate(0 ${lab[i].dy * 0.5})`}>
            <rect x={x - w / 2} y={y} width={w} height="40" fill={R[6]} />
            <Lbl x={x} y={y + 26} text={LABEL[g]} size={15} fill={R[0]} weight={500} />
          </g>
        );
      }),
    };
  },

  // B · Dollhouse: one house in section, three rooms side by side, a ceiling lamp each; labels on the cut floor slab
  B(T) {
    const RW = 560, X0 = GROUPS.map((_, i) => 105 + i * (RW + 30)), FL = 900, CE = 330;
    const cx = (i) => X0[i] + RW / 2;
    const bulb = (i) => [cx(i) + 6 * osc(T, 3.4, i * 0.3), 452];
    const figs = GROUPS.map((g, i) => ({ g, x: cx(i) - 70, y: FL, s: 1.5, face: 1, from: [200, -330], lights: [{ x: bulb(i)[0], y: bulb(i)[1], i: 0.95, reach: 420 }] }));
    return {
      figs,
      back: (
        <g>
          <rect x="-200" y="-200" width="2320" height="1480" fill={v(0.09)} />
          <rect x="-200" y={FL + 40} width="2320" height="400" fill={v(0.12)} />
        </g>
      ),
      haze: (i) => <g><rect x={X0[i]} y={CE} width={RW} height={FL - CE} fill={v(0.24)} />{pool(bulb(i)[0], bulb(i)[1] + 80, 330, 300, 0.75)}</g>,
      lit: (i) => {
        const x0 = X0[i], bl = bulb(i);
        return (
          <g>
            <rect x={x0} y={FL - 46} width={RW} height="46" fill={v(0.2)} />
            {pool(bl[0], FL - 10, 240, 26, 0.85)}
            <rect x={x0 + (i === 1 ? 400 : 70)} y="560" width="90" height="70" fill={v(0.18)} stroke={v(0.42)} strokeWidth="7" />
            <Shade x={bl[0]} y={bl[1] - 14} cable={bl[1] - 14 - CE} s={0.9} rot={-1.2 * osc(T, 3.4, i * 0.3)} />
          </g>
        );
      },
      set: (
        <g>
          <rect x="70" y="-40" width="1780" height="350" fill={v(0.17)} />
          {[0, 1, 2].map((i) => <g key={i}><rect x={X0[i] + 200} y="70" width="160" height="190" fill={v(0.06)} stroke={v(0.27)} strokeWidth="10" /><rect x={X0[i] + 274} y="70" width="12" height="190" fill={v(0.27)} /></g>)}
          <rect x="70" y="306" width="1780" height="24" fill={v(0.24)} />
          {[81, 665, 1255, 1845].map((x) => <rect key={x} x={x} y="306" width="24" height={FL - 306} fill={v(0.24)} />)}
          <rect x="60" y={FL} width="1800" height="50" fill={v(0.3)} />
        </g>
      ),
      labels: (lab) => GROUPS.map((g, i) => <Lbl key={g} x={cx(i)} y={FL + 34} text={LABEL[g]} size={20} fill={RAMPS[g][6]} a={lab[i].a} dy={lab[i].dy * 0.3} />),
    };
  },

  // C · Swivel chairs: a talk-show stage, three swivel chairs under three spots; blue swivels away, chair and all
  C(T) {
    const X = [520, 960, 1400], FL = 880, S = 1.25;
    const figs = GROUPS.map((g, i) => ({ g, x: X[i], y: FL, s: S, face: 1, seated: true, lights: [{ x: X[i] + 80, y: 90, i: 1, reach: 620 }, { dir: [0.2, 1], i: 0.08 }] }));
    const chair = (x, dir) => (
      <g transform={`translate(${x} ${FL}) scale(${S * dir} ${S})`}>
        <path d="M -30 -2 L 30 -2" stroke={v(0.3)} strokeWidth="5" strokeLinecap="round" />
        <circle cx="-30" cy="-2" r="4" fill={v(0.2)} /><circle cx="30" cy="-2" r="4" fill={v(0.2)} />
        <rect x="-4" y="-46" width="8" height="44" fill={v(0.36)} />
        <rect x="-34" y="-56" width="72" height="12" rx="5" fill={v(0.55)} />
        <path d="M -40 -56 L -32 -150 C -30 -160, -20 -162, -18 -152 L -24 -56 Z" fill={v(0.48)} />
      </g>
    );
    return {
      figs,
      back: (
        <g>
          <rect x="-200" y="-200" width="2320" height="1480" fill={v(0.12)} />
          {Array.from({ length: 24 }, (_, k) => <rect key={k} x={-200 + k * 100} y="-200" width="50" height="1200" fill={v(0.16)} />)}
          {[300, 960, 1620].map((x) => blob(x, 460, 160, 260, 0.2, 0.6))}
          <rect x="-200" y="960" width="2320" height="300" fill={v(0.07)} />
        </g>
      ),
      haze: (i) => <g>{cone(X[i] + 80, -20, 30, FL, 210, 0.6)}{pool(X[i] + 20, 520, 240, 300, 0.35)}</g>,
      set: (
        <g>
          <ellipse cx="960" cy={FL} rx="860" ry="70" fill={v(0.3)} />
          <path d={`M 100 ${FL} A 860 70 0 0 0 1820 ${FL} L 1820 ${FL + 70} A 860 70 0 0 1 100 ${FL + 70} Z`} fill={v(0.18)} />
        </g>
      ),
      lit: (i, a) => <g>{pool(X[i] + 20, FL + 4, 230, 34, 0.85)}{chair(X[i], a.dir)}</g>,
      labels: (lab) => GROUPS.map((g, i) => <Lbl key={g} x={X[i]} y={FL + 112} text={LABEL[g]} size={20} fill={RAMPS[g][6]} a={lab[i].a} dy={lab[i].dy * 0.3} />),
    };
  },

  // D · Bus stop: three bays of one shelter, a strip light each over one long bench; each bay's stop sign is the label
  D(T) {
    const BW = 560, X0 = GROUPS.map((_, i) => 120 + i * BW), FL = 920, S = 1.5;
    const cx = (i) => X0[i] + BW / 2;
    const figs = GROUPS.map((g, i) => ({ g, x: cx(i) - 40, y: FL, s: S, face: 1, seated: true, from: [250, -360], lights: [{ x: cx(i), y: 412, i: 0.95, reach: 420 }, { dir: [0.3, 1], i: 0.06 }] }));
    const seatY = FL - 55 * S;
    return {
      figs,
      back: (
        <g>
          <rect x="-200" y="-200" width="2320" height="1480" fill={v(0.1)} />
          {Array.from({ length: 6 }, (_, k) => <rect key={k} x={-120 + k * 380} y={120 + 60 * hash(k * 3.3)} width="300" height="900" fill={v(0.13 + 0.04 * hash(k * 1.7))} />)}
          {Array.from({ length: 10 }, (_, k) => blob(-60 + k * 220, 250 + 200 * hash(k * 7.1), 30, 44, hash(k * 2.9) > 0.7 ? 0.36 : 0.06))}
        </g>
      ),
      haze: (i) => pool(cx(i), 560, 220, 200, 0.45),
      set: (
        <g>
          <rect x="-200" y={FL} width="2320" height="400" fill={v(0.16)} />
          <rect x="-200" y={FL} width="2320" height="10" fill={v(0.26)} />
          {X0.map((x) => <rect key={x} x={x + 8} y="420" width={BW - 16} height={FL - 440} fill={v(0.22)} opacity="0.35" />)}
          <rect x="100" y="376" width={BW * 3 + 40} height="26" fill={v(0.3)} />
          {[0, 1, 2, 3].map((k) => <rect key={k} x={112 + k * BW} y="400" width="12" height={FL - 400} fill={v(0.26)} />)}
          <rect x="150" y={seatY} width={BW * 3 - 60} height="12" rx="3" fill={v(0.42)} />
          {[190, 960, 1730].map((x) => <rect key={x} x={x} y={seatY + 12} width="10" height={FL - seatY - 12} fill={v(0.3)} />)}
        </g>
      ),
      lit: (i) => <g><rect x={cx(i) - 130} y="402" width="260" height="8" fill={v(1)} />{pool(cx(i), FL + 4, 230, 26, 0.8)}</g>,
      labels: (lab) => GROUPS.map((g, i) => {
        const R = RAMPS[g], w = lblW(LABEL[g], 13) + 28, x = X0[i] + 30;
        return (
          <g key={g} opacity={lab[i].a}>
            <rect x={x} y={420 + lab[i].dy * 0.3} width={w} height="38" rx="4" fill={R[6]} />
            <Lbl x={x + w / 2} y={444 + lab[i].dy * 0.3} text={LABEL[g]} size={13} fill={R[0]} weight={500} />
          </g>
        );
      }),
    };
  },

  // E · Islands: three floating islands at different heights, bobbing; a lamp on each, a signpost with the label
  E(T) {
    const CX = [400, 960, 1520], TOP = [720, 600, 670], IW = [470, 520, 480];
    const bob = (i) => 9 * osc(T, 4.2 + 0.7 * i, i * 0.3);
    const top = (i) => TOP[i] + bob(i);
    const lamp = (i) => [CX[i] - IW[i] * 0.33, top(i) - 290];
    const figs = GROUPS.map((g, i) => ({ g, x: CX[i] - 30, y: top(i), s: 1.3, face: 1, lights: [{ x: lamp(i)[0], y: lamp(i)[1], i: 0.95, reach: 360 }, { dir: [0.3, 1], i: 0.06 }] }));
    const rock = (i) => {
      const c = CX[i], w = IW[i] / 2, t = top(i);
      return `M ${c - w} ${t} C ${c - w + 10} ${t + 70}, ${c - 60} ${t + 140}, ${c + 10} ${t + 280} C ${c + 70} ${t + 150}, ${c + w - 10} ${t + 80}, ${c + w} ${t} Z`;
    };
    return {
      figs,
      back: (
        <g>
          <rect x="-200" y="-200" width="2320" height="1480" fill={v(0.11)} />
          {Array.from({ length: 7 }, (_, k) => blob(((-300 + k * 380 + 14 * T) % 2400) - 200, 160 + 260 * hash(k * 5.1), 260, 60, 0.16, 0.8))}
          {[[200, 360, 90], [1180, 300, 70], [1760, 420, 110], [720, 260, 60]].map(([x, y, w], k) => <path key={k} d={`M ${x - w} ${y} L ${x + w} ${y} L ${x + 8} ${y + w * 0.9} Z`} fill={v(0.17)} />)}
        </g>
      ),
      haze: (i) => pool(lamp(i)[0] + 60, top(i) - 120, 230, 200, 0.4),
      set: <g>{GROUPS.map((g, i) => <path key={g} d={rock(i)} fill={v(0.2)} />)}</g>,
      lit: (i) => {
        const c = CX[i], t = top(i), L = lamp(i);
        return (
          <g>
            <ellipse cx={c} cy={t} rx={IW[i] / 2} ry="22" fill={v(0.5)} />
            {pool(c - 30, t, IW[i] / 2 - 10, 18, 0.9)}
            <rect x={L[0] - 4} y={L[1]} width="8" height={t - L[1]} fill={v(0.3)} />
            <path d={`M ${L[0] - 13} ${L[1] + 2} L ${L[0] + 13} ${L[1] + 2} L ${L[0] + 8} ${L[1] - 28} L ${L[0] - 8} ${L[1] - 28} Z`} fill={v(0.36)} />
            <rect x={L[0] - 10} y={L[1] - 6} width="20" height="9" fill={v(1)} />
            <path d={`M ${L[0] - 15} ${L[1] - 28} L ${L[0] + 15} ${L[1] - 28} L ${L[0]} ${L[1] - 42} Z`} fill={v(0.3)} />
            <rect x={c + IW[i] * 0.3} y={t - 70} width="6" height="70" fill={v(0.34)} />
          </g>
        );
      },
      labels: (lab) => GROUPS.map((g, i) => {
        const R = RAMPS[g], w = lblW(LABEL[g], 14) + 22, x = CX[i] + IW[i] * 0.3 + 3, y = top(i) - 96;
        return (
          <g key={g} opacity={lab[i].a} transform={`rotate(${-3 + 2 * i} ${x} ${y})`}>
            <rect x={x - w / 2} y={y + lab[i].dy * 0.3} width={w} height="34" fill={R[5]} />
            <Lbl x={x} y={y + 23 + lab[i].dy * 0.3} text={LABEL[g]} size={14} fill={R[0]} weight={500} />
          </g>
        );
      }),
    };
  },

  // F · Triptych: three panels, each its own ramp world (like three testimony portraits), a window light each, captions
  F(T) {
    const PW = 640, X0 = GROUPS.map((_, i) => i * PW);
    const win = (i) => [X0[i] + 470, 300];
    const figs = GROUPS.map((g, i) => ({ g, x: X0[i] + 240, y: 920, s: 1.9, face: 1, clip: 'tgPanel' + i, from: [230, -440], lights: [{ x: win(i)[0], y: win(i)[1], i: 0.9, reach: 720 }, { dir: [0.4, 1], i: 0.08 }] }));
    const deco = (i) => {
      const [wx, wy] = win(i);
      if (i === 0) return Array.from({ length: 9 }, (_, k) => <rect key={k} x={wx - 80} y={wy - 110 + k * 25} width="160" height="13" fill={v(0.3)} />);   // blinds drawn
      if (i === 2) return <path d={`M ${wx - 80} ${wy - 110} L ${wx + 20} ${wy - 110} C ${wx} ${wy}, ${wx + 10} ${wy + 60}, ${wx - 10} ${wy + 110} L ${wx - 80} ${wy + 110} Z`} fill={v(0.42)} />;   // a curtain half across
      return <rect x={wx - 6} y={wy - 110} width="12" height="220" fill={v(0.5)} />;
    };
    return {
      figs, bg: '#0b0c0c',
      defs: <defs>{GROUPS.map((g, i) => <clipPath key={g} id={'tgPanel' + i}><rect x={X0[i] + 6} y="6" width={PW - 12} height="1068" /></clipPath>)}</defs>,
      haze: (i) => (
        <g clipPath={`url(#tgPanel${i})`}>
          <rect x={X0[i]} y="0" width={PW} height="1080" fill={v(0.22)} />
          {pool(win(i)[0] - 60, 420, 360, 360, 0.6)}
          <rect x={win(i)[0] - 92} y={win(i)[1] - 122} width="184" height="244" fill={v(0.4)} />
          <rect x={win(i)[0] - 80} y={win(i)[1] - 110} width="160" height="220" fill={v(0.85)} />
          {deco(i)}
          <rect x={X0[i]} y="900" width={PW} height="200" fill={v(0.13)} />
        </g>
      ),
      lit: (i) => <g clipPath={`url(#tgPanel${i})`}>{pool(X0[i] + 280, 925, 230, 30, 0.6)}</g>,
      labels: (lab) => GROUPS.map((g, i) => <Lbl key={g} x={X0[i] + PW / 2} y={1030} text={LABEL[g]} size={24} fill={RAMPS[g][6]} a={lab[i].a} dy={lab[i].dy * 0.4} />),
    };
  },

  // G · Seesaw: a plank on a pivot; blue on the left end, teal on the right, orange in the middle balancing both.
  // The plank tips a little toward whoever is acting.
  G(T, b) {
    const PV = [960, 812], HALF = 640, FL = 950;
    const ang = -3.2 * glide(T, b.wd + 0.9, b.wd + 1.4, 0, 1) * (1 - glide(T, b.open, b.open + 0.6, 0, 1))
      + 3.2 * glide(T, b.open + 0.4, b.open + 1.0, 0, 1) * (1 - glide(T, b.cur + 0.9, b.cur + 1.6, 0, 1)) + 1.1 * osc(T, 3.6);
    const tn = Math.tan((ang * Math.PI) / 180), py = (x) => PV[1] + (x - PV[0]) * tn;
    const X = [PV[0] - 520, PV[0] + 520, PV[0] + 10];   // wd, open, cur
    const figs = GROUPS.map((g, i) => ({ g, x: X[i], y: py(X[i]), s: 1.08, face: 1, lights: [{ x: X[i] - 30, y: -60, i: 1, reach: 640 }, { dir: [0.3, 1], i: 0.08 }] }));
    return {
      figs,
      back: (
        <g>
          <rect x="-200" y="-200" width="2320" height="1480" fill={v(0.13)} />
          {blob(960, 520, 700, 380, 0.17, 0.8)}
          <rect x="-200" y={FL} width="2320" height="400" fill={v(0.09)} />
        </g>
      ),
      haze: (i) => <g>{cone(X[i] - 30, -20, 24, py(X[i]), 130, 0.6)}{pool(X[i], FL + 6, 210, 26, 0.7)}</g>,
      set: (
        <g>
          <path d={`M ${PV[0]} ${PV[1] + 10} L ${PV[0] - 80} ${FL} L ${PV[0] + 80} ${FL} Z`} fill={v(0.3)} />
          <g transform={`rotate(${ang} ${PV[0]} ${PV[1]})`}>
            <rect x={PV[0] - HALF} y={PV[1]} width={HALF * 2} height="18" rx="4" fill={v(0.46)} />
            <rect x={PV[0] - HALF} y={PV[1] + 12} width={HALF * 2} height="6" fill={v(0.3)} />
          </g>
          <circle cx={PV[0]} cy={PV[1] + 10} r="9" fill={v(0.6)} />
        </g>
      ),
      lit: (i) => <g transform={`rotate(${ang} ${PV[0]} ${PV[1]})`}><rect x={X[i] - 110} y={PV[1]} width="220" height="12" fill={v(0.82)} opacity="0.75" /></g>,
      labels: (lab) => GROUPS.map((g, i) => <Lbl key={g} x={X[i]} y={FL + 70} text={LABEL[g]} size={20} fill={RAMPS[g][6]} a={lab[i].a} dy={lab[i].dy * 0.3} />),
    };
  },

  // H · Lamps: three hanging lamps in the dark (the Open Engagers opening, one lamp per group); labels on the floor
  H(T) {
    const X = [480, 960, 1440], FL = 900, MY = 330;
    const sway = (i) => 1.8 * osc(T, 3.6 + 0.4 * i, i * 0.27);
    const bulb = (i) => [X[i] - (MY * Math.sin((sway(i) * Math.PI) / 180)) * 0.15, MY + 14];
    const figs = GROUPS.map((g, i) => ({ g, x: X[i], y: FL, s: 1.2, face: 1, lights: [{ x: bulb(i)[0], y: bulb(i)[1], i: 0.95, reach: 430 }] }));
    return {
      figs,
      back: (
        <g>
          <rect x="-200" y="-200" width="2320" height="1480" fill={v(0.06)} />
          <path d={`M -200 ${FL - 40} L 2120 ${FL - 40} L 2120 1300 L -200 1300 Z`} fill={v(0.09)} />
        </g>
      ),
      haze: (i) => <g>{cone(bulb(i)[0], MY + 6, 40, FL, 240, 0.8)}{pool(X[i], 600, 300, 340, 0.3)}</g>,
      lit: (i) => <g>{pool(X[i], FL + 2, 280, 42, 1)}<Shade x={X[i]} y={MY} rot={sway(i)} cable={MY + 40} /></g>,
      labels: (lab) => GROUPS.map((g, i) => <Lbl key={g} x={X[i]} y={FL + 74} text={LABEL[g]} size={21} fill={RAMPS[g][6]} a={0.85 * lab[i].a} dy={lab[i].dy * 0.3} />),
    };
  },
};

// ── the scene ─────────────────────────────────────────────────────────────────
function Scene({ k, L }) {
  const { T, b, ba } = k;
  const z = glide(T, 0, 7, 1, 1.03);
  const CAM = `translate(960 540) scale(${z}) translate(-960 -540)`;
  const lay = (filter, content, key) => content ? <g key={key} filter={filter ? `url(#${filter})` : undefined}><g transform={CAM}>{content}</g></g> : null;
  const acts = L.figs.map((f) => actor(f, T, b));
  const clipOf = (f, el, key) => (f.clip ? <g key={key} clipPath={`url(#${f.clip})`}>{el}</g> : <g key={key}>{el}</g>);
  const lab = GROUPS.map((g) => { const a = glide(T, b[g] - 0.15, b[g] + 0.45, 0, 1); return { a, dy: 14 * (1 - a) }; });
  const lensR = 20;
  return (
    <g>
      {L.defs}
      {lay('tgBack', L.back, 'back')}
      {L.haze && GROUPS.map((g, i) => lay('fuGradeBg-' + g, L.haze(i), 'h' + g))}
      {lay('tgSet', L.set, 'set')}
      {L.lit && GROUPS.map((g, i) => lay('fuGradeFg-' + g, L.lit(i, acts[i]), 'l' + g))}
      <g transform={CAM}>
        {L.figs.map((f, i) => clipOf(f, <ToneBean {...ba} id={i + 1} x={f.x} y={f.y} s={f.s} dir={acts[i].dir} pose={acts[i].pose} ramp={f.g} hair={HAIR[f.g]} lights={f.lights} />, 'f' + i))}
      </g>
      {lay('fuGradeFg-red', L.figs.map((f, i) => {
        const a = acts[i], p = toP(f, a.post);
        return a.postOn && clipOf(f, <PostValue x={p[0]} y={p[1]} s={f.s * 1.25} rot={a.rot} flip={a.flip} kind={KIND[f.g]} />, 'p' + i);
      }), 'posts')}
      {/* what the loupe shows: the post, larger, inside the lens */}
      <defs>{L.figs.map((f, i) => { const a = acts[i], c = toW(f, a, a.lens); return <clipPath key={i} id={'tgLens' + i}><ellipse cx={c[0]} cy={c[1]} rx={lensR * f.s * Math.max(0.18, Math.abs(a.dir)) * 0.9} ry={lensR * f.s * 0.9} /></clipPath>; })}</defs>
      {lay('fuGradeFg-red', L.figs.map((f, i) => {
        const a = acts[i];
        if (!a.loupe || a.magn < 0.05 || !a.postOn) return null;
        const c = toW(f, a, a.lens), p = toP(f, a.post), q = lerp2(c, p, 0.3);
        return clipOf(f, <g clipPath={`url(#tgLens${i})`} opacity={a.magn}><circle cx={c[0]} cy={c[1]} r={lensR * f.s} fill={v(0.3)} /><PostValue x={q[0]} y={q[1]} s={f.s * 1.7} rot={a.rot} flip={a.flip} kind={KIND[f.g]} /></g>, 'm' + i);
      }), 'lens')}
      {lay(null, L.figs.map((f, i) => {
        const a = acts[i];
        if (!a.loupe) return null;
        const R = RAMPS[f.g], h = toW(f, a, a.hand), c = toW(f, a, a.lens), r = lensR * f.s, rx = r * Math.max(0.18, Math.abs(a.dir));
        const d = [h[0] - c[0], h[1] - c[1]], n = Math.hypot(d[0], d[1]) || 1, rim = [c[0] + (d[0] / n) * r, c[1] + (d[1] / n) * r];
        return clipOf(f, (
          <g>
            <line x1={rim[0]} y1={rim[1]} x2={h[0] + (d[0] / n) * 6 * f.s} y2={h[1] + (d[1] / n) * 6 * f.s} stroke={R[1]} strokeWidth={6 * f.s} strokeLinecap="round" />
            <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={r} fill={R[6]} fillOpacity={a.magn > 0.05 ? 0.08 : 0.18} stroke={R[2]} strokeWidth={4.5 * f.s} />
            <path d={`M ${c[0] - rx * 0.55} ${c[1] - r * 0.35} A ${rx * 0.7} ${r * 0.7} 0 0 1 ${c[0] - rx * 0.05} ${c[1] - r * 0.66}`} fill="none" stroke={R[6]} strokeOpacity="0.7" strokeWidth={1.6 * f.s} strokeLinecap="round" />
          </g>
        ), 'u' + i);
      }), 'loupes')}
      {lay(null, L.labels && L.labels(lab), 'labels')}
    </g>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────
function Frame({ children, label, guide, bg }) {
  return (
    <div data-screen-label={label} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: bg, transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>{children}</svg>
      {guide && <div style={{ position: 'absolute', left: 40, top: 28, font: '600 30px Inter, sans-serif', color: '#fff', textShadow: '0 1px 12px rgba(0,0,0,0.8)' }}>{label}</div>}
    </div>
  );
}
function ThreeGroupsPiece({ concept, guide, boil, boilAmp }) {
  const { T, CUES } = useComposition();
  const bf = Math.floor(T * 8), amp = boil ? boilAmp : 0;
  const b = { wd: CUES.Withdrawal, open: CUES.Open, cur: CUES.Curation };
  const k = { T, b, ba: { bf, amp } };
  const L = (LAYOUTS[concept] || LAYOUTS.A)(T, b);
  return (
    <Frame label={CONCEPTS[concept] || concept} guide={guide} bg={L.bg || NEUT[1]}>
      <LookDefs ramps={GROUPS} bf={bf} amp={amp} />
      <defs>
        <GradeFilter id="tgBack" ramp={NEUT} blur={14} />
        <GradeFilter id="tgSet" ramp={NEUT} />
        <linearGradient id="tgCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={v(0.9)} stopOpacity="0.45" /><stop offset="1" stopColor={v(0.7)} stopOpacity="0.1" /></linearGradient>
        <linearGradient id="tgPlinth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={v(0.66)} /><stop offset="0.5" stopColor={v(0.42)} /><stop offset="1" stopColor={v(0.24)} /></linearGradient>
      </defs>
      <Scene k={k} L={L} />
    </Frame>
  );
}

function FUThreeGroupsConcepts() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { concept: 'A', referenceOverlay: false, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={NEUT[1]} autoplay={false}>
        <ThreeGroupsPiece concept={t.concept} guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Concept" />
        <TweakSelect label="Concept" value={t.concept} options={Object.keys(CONCEPTS).map((key) => ({ value: key, label: CONCEPTS[key] }))} onChange={(x) => setTweak('concept', x)} />
        <TweakSection label="Preview" />
        <TweakToggle label="Label" value={t.referenceOverlay} onChange={(x) => setTweak('referenceOverlay', x)} />
        <TweakToggle label="Line boil (8 fps)" value={t.lineBoil} onChange={(x) => setTweak('lineBoil', x)} />
        <TweakSlider label="Boil amplitude" value={t.boilAmp ?? 0.5} min={0} max={3} step={0.1} unit="px" onChange={(x) => setTweak('boilAmp', x)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

window.FUThreeGroupsConcepts = FUThreeGroupsConcepts;
