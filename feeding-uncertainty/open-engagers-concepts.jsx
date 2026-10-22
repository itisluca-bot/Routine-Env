// Feeding Uncertainty — "We find that open engagers…" (22s12f). Ideation roughs: eight settings, five beats each.
// Every concept runs on the same beat timing, so a beat from one concept can be swapped for the same beat in another.
const W = 1920, H = 1080;          // design coordinates
const OUT_W = 3840, OUT_H = 2160;   // render / export size (4K UHD); design is scaled up 2x as vectors

// ── motion: three helpers + an idle oscillator ─────────────────────────────
const tw = (T, a, b, from, to, ease) => {
  if (T <= a) return from;
  if (T >= b) return to;
  return from + (to - from) * ease((T - a) / (b - a));
};
const MOTION = {
  glide: (T, a, b, f, t) => tw(T, a, b, f, t, Easing.easeInOutSine), // settles, drifts, camera
  hit: (T, a, b, f, t) => tw(T, a, b, f, t, Easing.easeOutExpo),     // impacts, flips
  build: (T, a, b, f, t) => tw(T, a, b, f, t, Easing.easeInCubic),   // approach, pressure
};
const osc = (T, period, phase = 0) => Math.sin((T / period + phase) * Math.PI * 2);
const lerp = (a, b, t) => a + (b - a) * t;
const lerp2 = (A, B, t) => [lerp(A[0], B[0], t), lerp(A[1], B[1], t)];
// shot visibility with a short crossfade at both ends
const fade = (T, a, b, d = 0.18) => MOTION.glide(T, a - d, a + d, 0, 1) * (1 - MOTION.glide(T, b - d, b + d, 0, 1));
// a knock: a quick decaying rattle starting at t
const knock = (T, t) => (T < t ? 0 : Math.exp(-(T - t) * 14) * Math.sin((T - t) * 80));
const cam = (x, y, z = 1, r = 0) => `translate(960 540) rotate(${r}) scale(${z}) translate(${-x} ${-y})`;
const bez = (P0, P1, P2, P3, u) => {
  const v = 1 - u;
  return [0, 1].map((i) => v * v * v * P0[i] + 3 * v * v * u * P1[i] + 3 * v * u * u * P2[i] + u * u * u * P3[i]);
};

// ── colour ─────────────────────────────────────────────────────────────────
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbHex = (c) => '#' + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A.map((v, i) => v + (B[i] - v) * clamp(t, 0, 1))); };
const C = {
  open: { body: '#5fa69a', head: '#3a8584', lite: '#a8e3d6' },
  cur: { body: '#e0a165', head: '#c47449', lite: '#f2c98a' },
  red: '#a32e11', hot: '#f0613f', bg: '#0e0e0e', line: '#333333', wall: '#171717',
};

// ── hand-drawn boil: 8 redraws a second, deterministic ─────────────────────
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
function boilFn(f, id, amp) {
  if (!amp) return () => 0;
  const p1 = hash(f * 7.3 + id * 1.9) * 6.283, p2 = hash(f * 3.1 + id * 5.7) * 6.283, p3 = hash(f * 9.7 + id * 2.3) * 6.283;
  const a = amp * (0.7 + 0.6 * hash(f * 1.3 + id * 8.1));
  return (t) => a * (Math.sin(2 * t + p1) + 0.6 * Math.sin(3 * t + p2) + 0.35 * Math.sin(5 * t + p3));
}
function polarPath(cx, cy, rAt, N = 72) {
  let d = '';
  for (let k = 0; k < N; k++) {
    const t = -Math.PI + (k / N) * 2 * Math.PI, rr = Math.max(0, rAt(t));
    d += (k ? ' L ' : 'M ') + (cx + rr * Math.cos(t)).toFixed(1) + ' ' + (cy + rr * Math.sin(t)).toFixed(1);
  }
  return d + ' Z';
}
const boilCircle = (cx, cy, r, bf, id, amp) => { const b = boilFn(bf, id, amp); return polarPath(cx, cy, (t) => r + b(t), 64); };
// figures and props shift by a pixel or so on each boil step
const jitter = (bf, amp) => (id) => (amp ? [(hash(bf * 3.1 + id * 1.7) - 0.5) * 1.6 * amp, (hash(bf * 7.7 + id * 1.3) - 0.5) * 1.6 * amp] : [0, 0]);

// ═══ shared rig ═════════════════════════════════════════════════════════════
// Side-view person, facing right (dir -1 faces left). Origin = the floor under the hips.
// hand / hand2 are the near and far hand, relative to the shoulder, in the figure's own frame.
function figGeom(f) {
  const kid = f.kid || 0, sit = f.sit || 0;
  const sc = (f.s ?? 1) * (1 - 0.32 * kid), dir = f.dir || 1;
  const hipY = -(92 - 40 * sit), shX = 6, shY = hipY - 84, hr = 27 + 6 * kid;
  return { sc, dir, hipY, shX, shY, hr, sit };
}
function headAt(f) {
  const { sc, dir, hipY, hr } = figGeom(f);
  return [f.x + dir * 10 * sc, f.y + (hipY - 100 - hr + 6) * sc];
}
// hand target that puts the near hand on world point P (same frame the figure is drawn in)
function reachTo(f, P) {
  const { sc, dir, hipY, shX, shY } = figGeom(f);
  const lx = (dir * (P[0] - f.x)) / sc, ly = (P[1] - f.y) / sc;
  const a = (-(f.lean || 0) * Math.PI) / 180, dy = ly - hipY;
  return [lx * Math.cos(a) - dy * Math.sin(a) - shX, hipY + lx * Math.sin(a) + dy * Math.cos(a) - shY];
}
function Fig(f) {
  const { x, y, c = C.open, lean = 0, tilt = 0, hand, hand2, op = 1, j = [0, 0] } = f;
  const { sc, dir, hipY, shX, shY, hr, sit } = figGeom(f);
  const rest = lerp2([8, 82], [34, 58], sit);
  const h1 = hand || rest, h2 = hand2 || [rest[0] - 8, rest[1]];
  const legC = mix(c.head, C.bg, 0.2);
  const knee = (o) => lerp2([4 + o, hipY / 2], [46 + o, hipY + 4], sit);
  const foot = (o) => lerp2([6 + o, 0], [50 + o, 0], sit);
  const leg = (o) => { const kn = knee(o), ft = foot(o); return `M ${o} ${hipY} L ${kn[0]} ${kn[1]} L ${ft[0]} ${ft[1]}`; };
  const arm = (h) => {
    const L = 96, d = Math.max(1, Math.hypot(h[0], h[1]));
    const b = Math.sqrt(Math.max(0, (L / 2) ** 2 - (Math.min(d, L) / 2) ** 2));
    let px = -h[1] / d, py = h[0] / d;
    if (py < 0 || (py === 0 && px > 0)) { px = -px; py = -py; }
    return `M ${shX} ${shY} L ${shX + h[0] / 2 + px * b} ${shY + h[1] / 2 + py * b} L ${shX + h[0]} ${shY + h[1]}`;
  };
  const hy = hipY - 100 - hr + 6;
  const st = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <g transform={`translate(${x + j[0]} ${y + j[1]}) scale(${dir * sc} ${sc})`} opacity={op}>
      <path d={leg(-8)} stroke={mix(legC, C.bg, 0.35)} strokeWidth="20" {...st} />
      <g transform={`rotate(${lean} 0 ${hipY})`}><path d={arm(h2)} stroke={mix(c.body, C.bg, 0.42)} strokeWidth="17" {...st} /></g>
      <path d={leg(4)} stroke={legC} strokeWidth="22" {...st} />
      <g transform={`rotate(${lean} 0 ${hipY})`}>
        <rect x="-25" y={hipY - 100} width="50" height="112" rx="24" fill={c.body} />
        <g transform={`rotate(${tilt} 6 ${hipY - 100})`}>
          <circle cx="10" cy={hy} r={hr} fill={c.head} />
          <circle cx={10 + hr * 0.52} cy={hy - hr * 0.12} r="3.8" fill={C.bg} />
        </g>
        <path d={arm(h1)} stroke={mix(c.body, '#ffffff', 0.1)} strokeWidth="18" {...st} />
      </g>
    </g>
  );
}
// top-down person (for the table seen from above)
function TopFig({ x, y, rot, s = 1, c = C.open, j = [0, 0] }) {
  return (
    <g transform={`translate(${x + j[0]} ${y + j[1]}) rotate(${rot}) scale(${s})`}>
      <ellipse rx="24" ry="48" fill={c.body} />
      <circle cx="4" r="23" fill={c.head} />
    </g>
  );
}
// a piece of crisis content: a small red post. flip < 1 squashes it as it turns over
function Card({ x, y, rot = 0, s = 1, flip = 1, op = 1, lit = 1 }) {
  const f = Math.abs(flip) < 0.04 ? 0.04 : flip;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * f} ${s})`} opacity={op}>
      <rect x="-16" y="-21" width="32" height="42" rx="5" fill={mix(C.bg, C.red, lit)} stroke={C.hot} strokeWidth="2.5" strokeOpacity={1 - lit} />
      <rect x="-10" y="-13" width="20" height="4" rx="2" fill={C.hot} opacity={0.8 * lit} />
      <rect x="-10" y="-5" width="14" height="4" rx="2" fill={C.hot} opacity={0.6 * lit} />
    </g>
  );
}
// speech: arcs leaving a head in the facing direction
function Ripples({ x, y, T, t0, t1, every = 0.42, life = 1.2, R = 220, col = C.open.lite, dir = 1, spread = 0.85, w = 4, op = 1 }) {
  const out = [];
  for (let n = 0; ; n++) {
    const t = t0 + n * every;
    if (t >= Math.min(T, t1)) break;
    const a = (T - t) / life;
    if (a >= 1) continue;
    const r = 18 + a * R;
    const p = (ang) => [x + dir * r * Math.cos(ang), y + r * Math.sin(ang)];
    const [ax, ay] = p(-spread), [bx, by] = p(spread);
    out.push(<path key={n} d={`M ${ax} ${ay} A ${r} ${r} 0 0 ${dir > 0 ? 1 : 0} ${bx} ${by}`} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" opacity={(1 - a) * 0.9 * op} />);
  }
  return <g>{out}</g>;
}
// full circles spreading from a point
function Rings({ x, y, T, t0, t1, every = 0.4, life = 1.4, R = 300, col = C.open.lite, w = 3, op = 1 }) {
  const out = [];
  for (let n = 0; ; n++) {
    const t = t0 + n * every;
    if (t >= Math.min(T, t1)) break;
    const a = (T - t) / life;
    if (a >= 1) continue;
    out.push(<circle key={n} cx={x} cy={y} r={10 + a * R} fill="none" stroke={col} strokeWidth={w} opacity={(1 - a) * 0.8 * op} />);
  }
  return <g>{out}</g>;
}
// side-view table, floor at y
function Table({ x0, x1, y, h = 105, col = '#2c2c2c' }) {
  return (
    <g fill={col}>
      <rect x={x0} y={y - h} width={x1 - x0} height="14" rx="3" />
      <rect x={x0 + 12} y={y - h} width="10" height={h} />
      <rect x={x1 - 22} y={y - h} width="10" height={h} />
    </g>
  );
}
function Chair({ x, y, h = 50, w = 60, col = '#2a2a2a', dir = 1 }) {
  return (
    <g fill={col}>
      <rect x={x - w / 2} y={y - h} width={w} height="10" rx="3" />
      <rect x={x - w / 2 + 4} y={y - h} width="8" height={h} />
      <rect x={x + w / 2 - 12} y={y - h} width="8" height={h} />
      <rect x={dir > 0 ? x - w / 2 - 4 : x + w / 2 - 4} y={y - h - 70} width="8" height="80" rx="3" />
    </g>
  );
}

// ── shared beats: the dinner table, and the door ───────────────────────────
// Childhood dinner, side view. A red post sits on the table; it is lifted, talked over and passed round.
function DinnerSide({ k, x = 960, y = 820, s = 1, lamp = 0 }) {
  const { T, w, J } = k;
  const g = (a, b) => MOTION.glide(T, a, b, 0, 1);
  const kidF = { x: -215, y: -38, kid: 1, sit: 1, dir: 1 };
  const momF = { x: 215, y: 0, sit: 1, dir: -1 };
  const dadF = { x: 55, y: 0, dir: -1 };
  const P0 = [0, -132], Pup = [0, -160], Pm = [130, -178], Pk = [-140, -168];
  const a0 = g(w.politics2 - 0.1, w.politics2 + 0.4), a1 = g(w.conversation - 0.3, w.conversation + 0.2);
  const a2 = g(w.around, w.around + 0.6), a3 = g(w.dinner, w.table + 0.3);
  let cp = lerp2(P0, Pup, a0); cp = lerp2(cp, Pm, a1); cp = lerp2(cp, Pk, a2); cp = lerp2(cp, P0, a3);
  const leanIn = 8 * g(w.dinner - 0.2, w.table + 0.2);
  momF.lean = 4 + leanIn * 0.6; kidF.lean = leanIn; dadF.lean = 6 + leanIn * 0.5;
  momF.hand = lerp2([30, 58], reachTo(momF, cp), a1 * (1 - a2));
  kidF.hand = lerp2([30, 58], reachTo(kidF, cp), a2 * (1 - a3));
  dadF.hand = lerp2([10, 80], [40, 30], g(w.dinner - 0.3, w.dinner + 0.2) * (1 - g(w.table + 0.4, w.table + 1)));
  // who is listening to whom
  const talkM = g(w.conversation - 0.2, w.conversation) * (1 - g(w.around + 0.2, w.around + 0.5));
  kidF.tilt = -10 - 6 * talkM + 4 * osc(T, 1.7);
  dadF.tilt = 6 * osc(T, 2.1, 0.3);
  momF.tilt = -4 * g(w.around, w.around + 0.4);
  const hM = headAt(momF), hK = headAt(kidF), hD = headAt(dadF);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {lamp > 0 && (
        <g>
          <line x1="0" y1="-900" x2="0" y2="-470" stroke="#444" strokeWidth="3" />
          <path d="M -40 -470 L 40 -470 L 26 -500 L -26 -500 Z" fill="#555" />
          <path d="M -40 -470 L 40 -470 L 380 0 L -380 0 Z" fill="#e9f5ef" opacity={0.1 * lamp} />
          <ellipse cx="0" cy="0" rx="380" ry="26" fill="#e9f5ef" opacity={0.12 * lamp} />
        </g>
      )}
      <line x1="-520" y1="0" x2="520" y2="0" stroke={C.line} strokeWidth="4" />
      <Fig {...dadF} j={J(31)} />
      <Chair x={-215} y={0} h={88} w={56} dir={1} />
      <Chair x={225} y={0} h={50} dir={-1} />
      <Fig {...momF} j={J(32)} />
      <Fig {...kidF} j={J(33)} />
      <Table x0={-150} x1={150} y={0} />
      <Card x={cp[0]} y={cp[1]} s={0.85} rot={-6 + 6 * osc(T, 2.3)} flip={Math.cos(Math.PI * 2 * g(w.around + 0.6, w.dinner))} />
      <Ripples T={T} x={hM[0] - 30} y={hM[1]} dir={-1} t0={w.conversation - 0.1} t1={w.conversation + 0.9} R={150} />
      <Ripples T={T} x={hK[0] + 26} y={hK[1]} dir={1} t0={w.around + 0.4} t1={w.around + 1.1} R={130} />
      <Ripples T={T} x={hD[0] - 30} y={hD[1]} dir={-1} t0={w.dinner - 0.2} t1={w.table + 0.4} R={150} />
    </g>
  );
}
// The curator as a child: alone, facing a door with red light under it. It knocks on "threat" and on "door".
function DoorRoom({ k, x = 960, y = 820, s = 1, dark = 0, outside = 0, thread = 0 }) {
  const { T, q, w, J } = k;
  const g = (a, b) => MOTION.glide(T, a, b, 0, 1);
  const red = 0.35 + 0.4 * g(q.D, w.threat + 0.1) + 0.25 * g(w.door, w.door + 0.3);
  const kn = knock(T, w.threat) + knock(T, w.threat + 0.17) + knock(T, w.door) + knock(T, w.door + 0.15) + knock(T, w.door + 0.3);
  const flinch = MOTION.hit(T, w.threat, w.threat + 0.25, 0, 1) * 0.7 + MOTION.hit(T, w.door, w.door + 0.25, 0, 0.3);
  const kid = { x: -170, y: 0, kid: 1, sit: 1, dir: 1, c: C.cur, lean: -4 - 14 * flinch, tilt: -6 - 8 * flinch, hand: [34 - 10 * flinch, 50 - 30 * flinch] };
  const dx = kn * 7;
  const dX = 230, dw = 120, dh = 250;
  const hK = headAt(kid);
  const tx = dX - dw / 2 + 4, ty = -8;
  const vib = (T > w.threat ? 1 : 0) * Math.sin(T * 50) * 3;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-520" y="-420" width="1040" height="420" fill={mix(C.wall, C.bg, dark)} />
      {outside > 0 && (
        <g>
          <rect x="-420" y="-330" width="150" height="120" fill={mix(C.bg, C.red, 0.35 + 0.3 * red)} />
          {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={-410 + i * 26} y1="-330" x2={-430 + i * 26} y2="-210" stroke={C.hot} strokeWidth="3" strokeDasharray="18 22" strokeDashoffset={-T * 300 - i * 13} opacity="0.7" />)}
          <rect x="-420" y="-330" width="150" height="120" fill="none" stroke="#3b3b3b" strokeWidth="6" />
        </g>
      )}
      <path d={`M ${dX - dw / 2 - 10} 0 L ${dX + dw / 2 + 10} 0 L ${dX + dw / 2 + 170} 70 L ${dX - dw / 2 - 170} 70 Z`} fill={C.hot} opacity={0.3 * red} />
      <line x1="-520" y1="0" x2="520" y2="0" stroke={C.line} strokeWidth="4" />
      <rect x={dX - dw / 2 - 9} y={-dh - 9} width={dw + 18} height={dh + 9} fill="none" stroke="#3a3a3a" strokeWidth="7" />
      <rect x={dX - dw / 2} y={-7} width={dw} height="7" fill={C.hot} opacity={red} />
      <rect x={dX - dw / 2 + dx} y={-dh} width={dw} height={dh - 7} fill={mix('#1e1e1e', C.bg, dark * 0.5)} />
      <circle cx={dX + dw / 2 - 18 + dx} cy={-dh / 2} r="6" fill="#444" />
      <rect x={-200} y={-46} width="70" height="46" fill="#262626" />
      <Fig {...kid} j={J(41)} />
      {thread > 0 && <path d={`M ${tx} ${ty} Q ${(tx + hK[0]) / 2} ${(ty + hK[1]) / 2 + vib} ${hK[0] + 30} ${hK[1] + 6}`} fill="none" stroke={C.hot} strokeWidth="4" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - g(w.not, w.threat + 0.2)} opacity={thread} />}
    </g>
  );
}

// ═══ A · FAÇADE — an apartment block at night. Upper floors teal, ground floor orange ═══
const A_WIN = (f, c) => [555 + c * 270, 915 - f * 170];
function Win({ id, x, y, w = 170, h = 110, fill, children }) {
  return (
    <g>
      <clipPath id={id}><rect x={x - w / 2} y={y - h / 2} width={w} height={h} /></clipPath>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill={fill} />
      <g clipPath={`url(#${id})`}><g transform={`translate(${x} ${y})`}>{children}</g></g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="none" stroke="#3b3b3b" strokeWidth="5" />
    </g>
  );
}
const A_VOICE = [[4, 0], [4, 2], [4, 3], [3, 0], [3, 1], [3, 3], [2, 1], [2, 2], [2, 0], [3, 2], [2, 3], [1, 1]];
const A_ORANGE = [[0, 0], [0, 1], [0, 3], [1, 0]];
function ConceptFacade({ k }) {
  const { T, q, w, J } = k;
  const g = (a, b) => MOTION.glide(T, a, b, 0, 1);
  const tealW = A_WIN(4, 1), kidW = A_WIN(3, 2), oraW = A_WIN(0, 1);
  // camera: teal window → the whole block → a childhood window → the ground floor → the whole block
  let cp = [tealW[0], tealW[1] + 6], z = 3.0 + 0.35 * g(0, q.V);
  const whole = [960, 560];
  let m = g(q.V + 0.3, w.voice + 0.2); cp = lerp2(cp, whole, m); z = lerp(z, 1.2, m);
  m = g(q.Tb + 0.1, w.childhood); cp = lerp2(cp, kidW, m); z = lerp(z, 3.3, m);
  m = g(q.D - 0.35, q.D + 0.3); cp = lerp2(cp, oraW, m); z = lerp(z, 3.4, m);
  m = g(q.P + 0.1, w.position + 0.4); cp = lerp2(cp, [960, 590], m); z = lerp(z, 0.98, m);
  // the teal room: time and mental space widen it; a red post is picked up and turned over
  const wide = 170 + 90 * g(w.time, w.space + 0.6);
  const stand = g(q.V + 0.1, q.V + 0.6);
  const me = { x: -62, y: 49, s: 0.34, sit: 1 - stand, dir: 1, c: C.open };
  me.lean = -8 + 12 * g(w.treat - 0.4, w.treat) * (1 - stand) + 2 * osc(T, 2.4);
  me.tilt = 14 * g(w.intellectual, w.curiosity) * (1 - g(q.V, q.V + 0.4)) - 8 * g(w.confidence - 0.3, w.confidence);
  const base0 = [55 + 4 * osc(T, 2.9), -8 + 5 * osc(T, 2.2)];
  const held = [-22, -14];
  let card = lerp2(base0, held, g(w.treat, w.politics + 0.5));
  card = lerp2(card, [70, -28], g(q.V - 0.1, q.V + 0.6));
  const grab = g(w.treat - 0.4, w.treat) * (1 - g(q.V - 0.2, q.V + 0.2));
  me.hand = lerp2([34, 58], reachTo(me, card), grab);
  me.hand = lerp2(me.hand, [24, -88], g(w.confidence - 0.3, w.confidence + 0.1));
  const hMe = headAt(me);
  const flip = Math.cos(Math.PI * 2 * g(w.intellectual, w.curiosity + 0.6));
  const others = [[90, 12, 0], [75, -32, 1]];
  // the block
  const lightOn = (f, c) => { const [x, y] = A_WIN(f, c); const d = Math.hypot(x - tealW[0], y - tealW[1]); return g(w.voice - 0.2 + d * 0.0011, w.voice + 0.2 + d * 0.0011); };
  const pos = g(w.position - 0.2, w.position + 0.6), priv = g(w.privilege, w.privilege + 0.8);
  const tealFill = (lit) => mix('#151515', mix(C.bg, C.open.body, 0.42 + 0.18 * pos), lit);
  const oraFill = (red) => mix(mix(C.bg, C.cur.body, 0.3), C.red, red);
  const wins = [];
  for (let f = 0; f < 5; f++) for (let c = 0; c < 4; c++) {
    const [x, y] = A_WIN(f, c), id = `aw${f}${c}`;
    if (f === 4 && c === 1) {
      wins.push(
        <Win key={id} id={id} x={x} y={y} w={wide} fill={tealFill(1)}>
          <rect x={-80} y={35} width="36" height="14" fill="#2a2a2a" />
          {others.map(([ox, oy, i]) => <Card key={i} x={ox + 4 * osc(T, 2.6, i * 0.3)} y={oy + 4 * osc(T, 1.9, i * 0.4)} s={0.4} rot={-10 + i * 18} />)}
          <Fig {...me} j={J(1)} />
          <Card x={card[0]} y={card[1]} s={0.42} rot={-8} flip={flip} />
          <Ripples T={T} x={hMe[0] + 10} y={hMe[1]} t0={w.confidence} t1={w.matters + 0.3} R={70} w={2} life={0.9} />
        </Win>
      );
    } else if (f === 3 && c === 2) {
      const lit = Math.max(lightOn(f, c), g(q.Tb - 0.2, q.Tb + 0.3));
      wins.push(<Win key={id} id={id} x={x} y={y} fill={tealFill(lit)}><g opacity={lit}><DinnerSide k={k} x={0} y={49} s={0.3} /></g></Win>);
    } else if (f === 0 && c === 1) {
      wins.push(<Win key={id} id={id} x={x} y={y} fill={oraFill(0.2 + 0.4 * g(q.D, w.door))}><DoorRoom k={k} x={-14} y={49} s={0.29} /></Win>);
    } else if (A_ORANGE.some(([a, b]) => a === f && b === c)) {
      const red = 0.25 + 0.35 * priv + 0.1 * osc(T, 0.9, f + c);
      wins.push(
        <Win key={id} id={id} x={x} y={y} fill={oraFill(red)}>
          <Fig x={-10} y={49} s={0.32} sit={1} dir={c < 2 ? 1 : -1} c={C.cur} lean={18} tilt={14} j={J(10 + f * 4 + c)} />
        </Win>
      );
    } else if (A_VOICE.some(([a, b]) => a === f && b === c)) {
      const lit = lightOn(f, c);
      wins.push(
        <Win key={id} id={id} x={x} y={y} fill={tealFill(lit)}>
          <g opacity={lit}><Fig x={0} y={49} s={0.32} dir={x < tealW[0] ? 1 : -1} c={C.open} tilt={-6 + 6 * osc(T, 1.4, f * 0.3 + c)} j={J(20 + f * 4 + c)} /></g>
        </Win>
      );
    } else {
      wins.push(<Win key={id} id={id} x={x} y={y} fill="#151515" />);
    }
  }
  return (
    <g transform={cam(cp[0], cp[1], z)}>
      <rect x="-2000" y="1000" width="6000" height="1200" fill="#121212" />
      <rect x="400" y="140" width="1120" height="860" fill="#1b1b1b" />
      <rect x="400" y={140 + 170 * 2.5 - 2} width="1120" height="4" fill={C.open.body} opacity={0.5 * pos} />
      {[1, 2, 3, 4].map((f) => <line key={f} x1="400" x2="1520" y1={1000 - f * 170} y2={1000 - f * 170} stroke="#232323" strokeWidth="4" />)}
      {wins}
      <Rings T={T} x={tealW[0]} y={tealW[1]} t0={w.confidence} t1={w.matters + 0.2} R={1100} life={1.7} every={0.45} w={4} />
      <line x1="-2000" x2="4000" y1="1000" y2="1000" stroke={C.line} strokeWidth="4" />
    </g>
  );
}

// ═══ B · HIGH GROUND — a landscape. Teal watches the red storm from a hill; orange is down in it ═══
const hillY = (x, hk = 1) => 880 - hk * 380 * Math.exp(-(((x - 700) / 380) ** 2)) - 230 * Math.exp(-(((x - 2950) / 320) ** 2));
function Storm({ T, x = 1800, op = 1, s = 1 }) {
  return (
    <g opacity={op} transform={`translate(${x} 0) scale(${s} 1) translate(${-x} 0)`}>
      {Array.from({ length: 12 }, (_, i) => <line key={i} x1={x - 260 + i * 46} y1="360" x2={x - 290 + i * 46} y2="880" stroke={C.hot} strokeWidth="3" strokeDasharray="30 44" strokeDashoffset={-T * 420 - i * 17} opacity="0.55" />)}
      {[[-200, 330, 90], [-80, 290, 120], [70, 300, 110], [190, 335, 85], [0, 350, 120]].map(([dx, y, r], i) => (
        <circle key={i} cx={x + dx + 6 * osc(T, 3.1, i * 0.2)} cy={y} r={r} fill={mix(C.bg, C.red, 0.75)} />
      ))}
    </g>
  );
}
function groundPath(hk) {
  let d = 'M -1500 1500';
  for (let x = -1500; x <= 4600; x += 20) d += ` L ${x} ${hillY(x, hk).toFixed(1)}`;
  return d + ' L 4600 1500 Z';
}
function ConceptHill({ k }) {
  const { T, q, w, J } = k;
  const g = (a, b) => MOTION.glide(T, a, b, 0, 1);
  // shot 1: the landscape (curiosity, voice); shot 4: wide again (privilege)
  let cp = [820, 470], z = 1.5;
  let m = g(w.time, w.space + 0.9); cp = lerp2(cp, [1250, 600], m); z = lerp(z, 0.78, m);
  m = g(w.treat - 0.4, w.politics + 0.4); cp = lerp2(cp, [930, 520], m); z = lerp(z, 1.2, m);
  m = g(w.curiosity + 0.3, q.V + 0.2); cp = lerp2(cp, [1100, 560], m); z = lerp(z, 0.9, m);
  m = g(q.V + 0.2, w.voice); cp = lerp2(cp, [1700, 560], m); z = lerp(z, 0.6, m);
  if (T > q.P - 1) { cp = [1650, 560]; z = 0.62 - 0.05 * g(q.P, E_(q)); }
  const hk = 1 + 0.22 * g(w.position - 0.2, w.position + 0.7);
  const stand = g(q.V, q.V + 0.5);
  const me = { x: 700, y: hillY(700, T > q.P - 1 ? hk : 1), sit: 1 - stand, dir: 1, c: C.open, s: 0.9 };
  me.lean = -6 + 10 * g(w.treat - 0.4, w.treat) * (1 - stand);
  me.tilt = 14 * g(w.intellectual, w.curiosity) * (1 - stand) - 10 * stand;
  const hMe = headAt(me);
  const held = [hMe[0] + 34, hMe[1] + 22];
  let sp = [1220, 380];
  sp = lerp2(sp, [790, 455], g(w.treat - 0.7, w.treat + 0.1));
  sp = lerp2(sp, held, g(w.politics, w.intellectual));
  sp = lerp2(sp, [900, 300], g(q.V, q.V + 0.8));
  me.hand = lerp2([34, 58], reachTo(me, sp), g(w.treat - 0.2, w.treat + 0.1) * (1 - g(q.V - 0.1, q.V + 0.3)));
  me.hand = lerp2(me.hand, [30, -84], g(w.confidence - 0.3, w.confidence + 0.1));
  const sparks = Array.from({ length: 6 }, (_, i) => {
    const p = (((T * 0.11 + i / 6) % 1) + 1) % 1;
    const pt = lerp2([1650 + i * 50, 400], [1000 + i * 40, 300 - i * 25], p);
    return <Card key={i} x={pt[0]} y={pt[1] + 20 * osc(T, 2, i * 0.17)} s={0.55} rot={i * 30 + T * 20} op={Math.sin(Math.PI * p) * 0.8} />;
  });
  const ora = { x: 1760, y: 880, dir: -1, c: C.cur, lean: 14, tilt: 16, hand: [10, -64], hand2: [0, -60], s: 0.9 };
  const far = { x: 2950, y: hillY(2950), dir: -1, c: C.open, s: 0.7, tilt: 4 * osc(T, 1.6) };
  const hFar = headAt(far), hOra = headAt(ora);
  const world = (hkk, strata) => (
    <g>
      <path d={groundPath(hkk)} fill="#161b1a" stroke="#2c3836" strokeWidth="4" />
      {strata > 0 && Array.from({ length: 7 }, (_, i) => {
        let d = '';
        for (let x = 250; x <= 1150; x += 15) { const y = hillY(x, hkk) + 40 + i * 46; if (y < 875) d += (d ? ' L ' : 'M ') + x + ' ' + y.toFixed(1); }
        return d ? <path key={i} d={d} fill="none" stroke={C.open.body} strokeWidth="3" opacity={0.5 * strata} pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - strata} /> : null;
      })}
      <Storm T={T} />
    </g>
  );
  return (
    <g>
      <g opacity={fade(T, -1, q.Tb)} transform={cam(cp[0], cp[1], z)}>
        {world(1, 0)}
        {sparks}
        <Fig {...ora} j={J(2)} />
        <Fig {...far} j={J(3)} />
        <Fig {...me} j={J(1)} />
        <Card x={sp[0]} y={sp[1]} s={0.7} rot={-10} flip={Math.cos(Math.PI * 2 * g(w.intellectual, w.curiosity + 0.6))} />
        <Ripples T={T} x={hMe[0] + 30} y={hMe[1]} t0={w.confidence} t1={w.matters + 0.4} R={1300} life={1.9} w={5} />
        <Ripples T={T} x={hFar[0] - 20} y={hFar[1]} dir={-1} t0={w.voice + 0.4} t1={w.matters + 0.6} R={1100} life={1.8} w={4} />
        <Ripples T={T} x={hOra[0] - 20} y={hOra[1]} dir={-1} t0={w.voice + 0.2} t1={w.voice + 0.8} R={70} life={0.6} col={C.cur.lite} w={3} />
      </g>
      <g opacity={fade(T, q.Tb, q.D)}>
        <g transform={cam(960, 560, 1 + 0.06 * g(q.Tb, q.D))}>
          <path d="M -200 840 L 2200 840 L 2200 1300 L -200 1300 Z" fill="#161b1a" />
          <rect x="480" y="330" width="960" height="510" fill="#182321" stroke="#3a3a3a" strokeWidth="6" />
          <path d="M 440 334 L 960 120 L 1480 334 Z" fill="#1d2a28" stroke="#3a3a3a" strokeWidth="6" />
          <rect x="1260" y="420" width="140" height="110" fill="#101413" stroke="#3a3a3a" strokeWidth="5" />
          <g transform="translate(1330 470) scale(0.12)"><Storm T={T} x={0} /></g>
          <DinnerSide k={k} x={900} y={840} s={0.95} />
        </g>
      </g>
      <g opacity={fade(T, q.D, q.P)}><DoorRoom k={k} x={960} y={840} s={1.15} outside={1} /></g>
      <g opacity={fade(T, q.P, 99)} transform={cam(cp[0], cp[1], z)}>
        {world(hk, g(w.position - 0.3, w.privilege + 0.4))}
        <Fig {...ora} j={J(2)} />
        <Fig {...me} sit={0} tilt={0} hand={null} lean={0} j={J(1)} />
        <Fig x={620} y={hillY(620, hk)} s={0.7} dir={1} c={C.open} j={J(4)} />
        <Fig x={790} y={hillY(790, hk)} s={0.55} kid={1} dir={-1} c={C.open} j={J(5)} />
      </g>
    </g>
  );
}
const E_ = (q) => q.E + 0.24;

// ═══ C · THE TABLE — one table carries the whole segment ═══
function ConceptTable({ k }) {
  const { T, q, w, J } = k;
  const g = (a, b) => MOTION.glide(T, a, b, 0, 1);
  const FL = 820;
  const L = 380 + 520 * g(w.time, w.space + 0.8);
  const stand = g(q.V, q.V + 0.5);
  const me = { x: 250, y: FL, sit: 1 - stand, dir: 1, c: C.open };
  me.lean = -6 + 14 * g(w.treat - 0.4, w.treat) * (1 - stand);
  me.tilt = 14 * g(w.intellectual, w.curiosity) * (1 - stand);
  const cards = Array.from({ length: 6 }, (_, i) => [360 + (i * (L - 100)) / 5, 690 + 3 * osc(T, 2.4, i * 0.21)]);
  const hMe = headAt(me);
  let c0 = lerp2(cards[0], [hMe[0] + 60, hMe[1] + 30], g(w.treat, w.politics + 0.4));
  c0 = lerp2(c0, cards[0], g(w.curiosity + 0.6, q.V + 0.4));
  me.hand = lerp2([34, 58], reachTo(me, c0), g(w.treat - 0.4, w.treat) * (1 - g(w.curiosity + 0.6, q.V + 0.4)));
  me.hand = lerp2(me.hand, [30, -86], g(w.confidence - 0.3, w.confidence + 0.1));
  const peers = [560, 800, 1040].map((x, i) => ({ x, y: FL, sit: 1, dir: -1, c: C.open, op: g(q.V + 0.2 + i * 0.15, w.confidence + i * 0.15), tilt: -6 + 8 * g(w.voice + i * 0.1, w.matters + i * 0.1) * osc(T, 0.7, i * 0.3) }));
  // the curator's small table piles up
  const pile = Array.from({ length: 11 }, (_, i) => {
    const t0 = 0.5 + i * 0.55, a = MOTION.hit(T, t0, t0 + 0.35, 0, 1);
    return <Card key={i} x={1530 + 30 * (hash(i) - 0.5)} y={lerp(560, 690 - i * 7, a)} s={0.9} rot={50 * (hash(i + 9) - 0.5)} op={g(t0 - 0.05, t0 + 0.1)} />;
  });
  const flinch = g(0.8, 3);
  const ora = { x: 1690, y: FL, sit: 1, dir: -1, c: C.cur, lean: -8 * flinch + 2 * osc(T, 0.9), tilt: 10, hand: [40, -10], hand2: [30, 0] };
  const lift = 160 * g(w.position - 0.3, w.position + 0.6);
  const stage = (
    <g>
      <line x1="-200" y1={FL} x2="2200" y2={FL} stroke={C.line} strokeWidth="4" />
      <Chair x={1700} y={FL} dir={-1} />
      <Table x0={1430} x1={1630} y={FL} />
      {pile}
      <Fig {...ora} j={J(2)} />
    </g>
  );
  return (
    <g>
      <g opacity={fade(T, -1, q.Tb)}>
        {stage}
        {peers.map((p, i) => <Fig key={i} {...p} j={J(5 + i)} />)}
        <Chair x={255} y={FL} dir={1} />
        <Fig {...me} j={J(1)} />
        <Table x0={300} x1={300 + L} y={FL} />
        {cards.slice(1).map(([x, y], i) => <Card key={i} x={x} y={y} s={0.9} rot={-8 + 16 * hash(i + 3)} />)}
        <Card x={c0[0]} y={c0[1]} s={0.9} rot={-8} flip={Math.cos(Math.PI * 2 * g(w.intellectual, w.curiosity + 0.6))} />
        <Ripples T={T} x={hMe[0] + 30} y={hMe[1]} t0={w.confidence} t1={w.matters + 0.3} R={700} life={1.4} />
      </g>
      <g opacity={fade(T, q.Tb, q.D)}><DinnerSide k={k} x={960} y={850} s={1.3} /></g>
      <g opacity={fade(T, q.D, q.P)}><DoorRoom k={k} x={960} y={850} s={1.3} /></g>
      <g opacity={fade(T, q.P, 99)} transform={cam(960, 560, 0.92)}>
        {stage}
        <rect x="150" y={FL - lift} width="1130" height={lift} fill="#17211f" />
        <g transform={`translate(0 ${-lift})`}>
          {peers.map((p, i) => <Fig key={i} {...p} op={1} tilt={0} j={J(5 + i)} />)}
          <Chair x={255} y={FL} dir={1} />
          <Fig x={250} y={FL} sit={1} dir={1} c={C.open} j={J(1)} />
          <Table x0={300} x1={1200} y={FL} />
          {cards.map(([x, y], i) => <Card key={i} x={300 + (i + 0.5) * 150} y={690} s={0.9} rot={-8 + 16 * hash(i + 3)} />)}
        </g>
      </g>
    </g>
  );
}

// ═══ D · ELBOW ROOM — each person's room to think is a circle. Abstract ═══
function ConceptRoom({ k }) {
  const { T, q, w, J, bf, amp } = k;
  const g = (a, b) => MOTION.glide(T, a, b, 0, 1);
  const tc = [680, 560], oc = [1520, 600];
  const R = 150 + 80 * g(w.time - 0.2, w.time + 0.5) + 100 * g(w.mental, w.space + 0.6);
  const me = { x: tc[0], y: tc[1] + 110, dir: 1, c: C.open, s: 0.8 };
  me.tilt = 14 * g(w.intellectual, w.curiosity) + 4 * osc(T, 2.2);
  const hMe = headAt(me);
  const dots = Array.from({ length: 5 }, (_, i) => {
    const ang = i * 1.26 + T * (0.35 - 0.25 * g(w.treat - 0.5, w.treat + 0.6));
    const rr = lerp(R + 90 + 40 * hash(i), R * 0.62, g(w.treat - 1 + i * 0.12, w.treat + 0.2 + i * 0.12));
    return [tc[0] + rr * Math.cos(ang), tc[1] + rr * Math.sin(ang) * 0.9];
  });
  const held = [hMe[0] + 46, hMe[1] + 26];
  const d0 = lerp2(dots[0], held, g(w.politics, w.intellectual));
  me.hand = lerp2([10, 80], reachTo(me, d0), g(w.politics - 0.2, w.politics + 0.3) * (1 - g(q.V, q.V + 0.4)));
  me.hand = lerp2(me.hand, [26, -84], g(w.confidence - 0.3, w.confidence + 0.1));
  const press = (t) => 130 - 6 - 4 * Math.max(0, osc(T, 0.7, t)) * g(0.5, 3);
  const oraDots = Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2 + 0.2 * osc(T, 4, i * 0.1); const r = 150 + 6 * osc(T, 0.6, i * 0.13); return [oc[0] + r * Math.cos(a), oc[1] + r * Math.sin(a)]; });
  const peers = [[1250, 230], [1700, 220], [1260, 920], [200, 220], [180, 900], [1780, 930]];
  const reachP = (p) => { const d = Math.hypot(p[0] - tc[0], p[1] - tc[1]); return g(w.voice - 0.6 + d / 900, w.voice - 0.2 + d / 900); };
  // top-down dinner
  const seats = [-90, 0, 90, 180].map((a, i) => { const r = (a * Math.PI) / 180; return { x: 960 + 240 * Math.cos(r), y: 560 + 240 * Math.sin(r), rot: a + 180, s: i === 3 ? 0.7 : 1 }; });
  const tdA = g(w.conversation - 0.3, w.conversation + 0.2), tdB = g(w.around, w.around + 0.6), tdC = g(w.dinner, w.table + 0.2);
  let tp = [960, 560]; tp = lerp2(tp, [960 + 120, 560], tdA); tp = lerp2(tp, [960 - 115, 560], tdB); tp = lerp2(tp, [960, 560], tdC);
  // privilege: the teal circle stands on a column of discs
  const lift = 220 * g(w.position - 0.3, w.position + 0.6);
  const kidO = { x: 960, y: 690, kid: 1, dir: 1, c: C.cur, s: 1, lean: -10 * MOTION.hit(T, w.threat, w.threat + 0.3, 0, 1), tilt: -6 };
  const gap = 0.25 + 0.35 * g(w.not, w.threat + 0.2);
  const ringGap = (cx, cy, r, g0) => { const a0 = g0, a1 = Math.PI * 2 - g0; return `M ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 1 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`; };
  const inflow = Array.from({ length: 7 }, (_, i) => { const p = (((T * 0.6 + i / 7) % 1) + 1) % 1; return [lerp(1500, 1090, p), 600 + 50 * Math.sin(i * 2.1) * (1 - p)]; });
  return (
    <g>
      <g opacity={fade(T, -1, q.Tb)}>
        <path d={boilCircle(tc[0], tc[1], R, bf, 1, amp)} fill={C.open.body} fillOpacity="0.08" stroke={C.open.body} strokeWidth="4" />
        <path d={boilCircle(oc[0], oc[1], press(0), bf, 2, amp)} fill={C.cur.body} fillOpacity="0.08" stroke={C.cur.body} strokeWidth="4" />
        {oraDots.map(([x, y], i) => <Card key={i} x={x} y={y} s={0.7} rot={i * 23} />)}
        <Fig x={oc[0]} y={oc[1] + 95} s={0.7} dir={-1} c={C.cur} lean={0} tilt={14} hand={[30, 10]} hand2={[20, 20]} j={J(2)} />
        {peers.map((p, i) => <g key={i} opacity={0.25 + 0.75 * reachP(p)}><path d={boilCircle(p[0], p[1], 70, bf, 10 + i, amp)} fill="none" stroke={C.open.body} strokeWidth="3" /><Fig x={p[0]} y={p[1] + 55} s={0.42} dir={p[0] < tc[0] ? 1 : -1} c={C.open} j={J(10 + i)} /></g>)}
        {peers.map((p, i) => <Rings key={'r' + i} T={T} x={p[0]} y={p[1]} t0={w.voice - 0.2 + Math.hypot(p[0] - tc[0], p[1] - tc[1]) / 900} t1={w.matters + 0.6} R={180} life={0.9} every={0.5} />)}
        <Rings T={T} x={tc[0]} y={tc[1]} t0={w.confidence} t1={w.matters + 0.3} R={1100} life={1.5} />
        {dots.slice(1).map(([x, y], i) => <Card key={i} x={x} y={y} s={0.7} rot={T * 30 + i * 40} />)}
        <Fig {...me} j={J(1)} />
        <Card x={d0[0]} y={d0[1]} s={0.75} rot={-6} flip={Math.cos(Math.PI * 2 * g(w.intellectual, w.curiosity + 0.6))} />
      </g>
      <g opacity={fade(T, q.Tb, q.D)}>
        <path d={boilCircle(960, 560, 330, bf, 3, amp)} fill={C.open.body} fillOpacity="0.07" stroke={C.open.body} strokeWidth="4" />
        <circle cx="960" cy="560" r="160" fill="#232323" />
        {seats.map((st, i) => <TopFig key={i} {...st} j={J(30 + i)} />)}
        <Card x={tp[0]} y={tp[1]} s={0.9} rot={T * 12} />
        {[[0, w.conversation], [2, w.around + 0.3], [1, w.dinner]].map(([i, t], n) => (
          <Rings key={n} T={T} x={seats[i].x} y={seats[i].y} t0={t - 0.1} t1={t + 0.8} R={140} life={0.9} />
        ))}
      </g>
      <g opacity={fade(T, q.D, q.P)}>
        <path d={ringGap(960, 600, 170, gap)} fill="none" stroke={C.cur.body} strokeWidth="5" transform={`translate(${knock(T, w.threat) * 5 + knock(T, w.door) * 6} 0)`} />
        {inflow.map(([x, y], i) => <Card key={i} x={x} y={y} s={0.7} rot={i * 30} op={g(q.D - 0.1, q.D + 0.4)} />)}
        <Fig {...kidO} j={J(41)} />
      </g>
      <g opacity={fade(T, q.P, 99)}>
        <line x1="0" y1="900" x2="1920" y2="900" stroke={C.line} strokeWidth="4" />
        {Array.from({ length: 6 }, (_, i) => <ellipse key={i} cx="680" cy={900 - (i + 0.5) * (lift / 6)} rx={250 - i * 6} ry="28" fill={mix('#1b2624', C.open.body, i * 0.05)} stroke={C.open.body} strokeOpacity="0.3" strokeWidth="2" opacity={lift > 10 ? 1 : 0} />)}
        <g transform={`translate(0 ${-lift})`}>
          <path d={boilCircle(680, 700, 240, bf, 1, amp)} fill={C.open.body} fillOpacity="0.08" stroke={C.open.body} strokeWidth="4" />
          <Fig x={680} y={810} s={0.8} dir={1} c={C.open} j={J(1)} />
        </g>
        <path d={boilCircle(1420, 760, 125, bf, 2, amp)} fill={C.cur.body} fillOpacity="0.08" stroke={C.cur.body} strokeWidth="4" />
        {Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; return <Card key={i} x={1420 + 150 * Math.cos(a)} y={760 + 150 * Math.sin(a)} s={0.65} rot={i * 23} />; })}
        <Fig x={1420} y={850} s={0.7} dir={-1} c={C.cur} tilt={14} j={J(2)} />
      </g>
    </g>
  );
}

// ═══ E · THREADS — politics as a thread you can pull on, or one that pulls on you ═══
function ConceptThreads({ k }) {
  const { T, q, w, J } = k;
  const g = (a, b) => MOTION.glide(T, a, b, 0, 1);
  const FL = 830;
  const me = { x: 520, y: FL, dir: 1, c: C.open };
  me.tilt = 12 * g(w.intellectual, w.curiosity) + 3 * osc(T, 2.5);
  const hMe = headAt(me);
  const pulling = g(w.treat - 0.2, w.treat + 0.2) * (1 - g(w.intellectual, w.intellectual + 0.3));
  const pulled = clamp((T - w.treat) / (w.intellectual - w.treat), 0, 1);
  const saw = (((T * 1.6) % 1) + 1) % 1;
  const end = [me.x + 120, me.y - 150];
  const P0 = [2150, 200], P1 = [1500, 120], P2 = [1150, 720];
  const tp = (u) => bez(P0, P1, P2, end, u);
  const hA = tp(lerp(0.985, 0.94, saw * pulling)), hB = tp(lerp(0.94, 0.985, saw * pulling));
  me.hand = reachTo(me, hA);
  me.hand2 = reachTo(me, hB);
  const ku = lerp(0.55, 0.985, pulled);
  let knot = tp(ku);
  knot = lerp2(knot, [hMe[0] + 60, hMe[1] + 8], g(w.intellectual, w.curiosity));
  me.hand = lerp2(me.hand, reachTo(me, knot), g(w.intellectual, w.curiosity));
  const tD = (u0) => { let d = ''; for (let i = 0; i <= 40; i++) { const p = tp(u0 + ((1 - u0) * i) / 40); d += (i ? ' L ' : 'M ') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); } return d; };
  const coil = 18 + 120 * pulled;
  // threads arriving at the curator
  const ora = { x: 1560, y: FL, dir: -1, c: C.cur, tilt: 12, lean: -6 * g(1, 4), hand: [30, 0], hand2: [20, 10] };
  const oraT = Array.from({ length: 7 }, (_, i) => {
    const t0 = 0.6 + i * 0.85, from = [1150 + i * 140, -40], to = [1560 + 30 * (hash(i) - 0.5), FL - 150 - 30 * hash(i + 4)];
    return <path key={i} d={`M ${from[0]} ${from[1]} Q ${(from[0] + to[0]) / 2 + 80} ${(from[1] + to[1]) / 2} ${to[0]} ${to[1]}`} fill="none" stroke={C.hot} strokeWidth="3" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - MOTION.build(T, t0, t0 + 0.5, 0, 1)} opacity="0.8" />;
  });
  const wraps = Array.from({ length: 5 }, (_, i) => <ellipse key={i} cx="1560" cy={FL - 120 - i * 22} rx="40" ry="9" fill="none" stroke={C.hot} strokeWidth="3" opacity={g(1.4 + i * 1.1, 1.8 + i * 1.1)} />);
  // voice: threads out to others
  const vMe = { x: 400, y: 860, dir: 1, c: C.open, hand: lerp2([10, 80], [30, -84], g(w.confidence - 0.3, w.confidence + 0.1)) };
  const hV = headAt(vMe);
  const nodes = [[1050, 560], [1300, 800], [1500, 380], [1760, 640], [1200, 260]];
  const nodeOn = (i) => g(w.voice - 0.5 + i * 0.12, w.voice + i * 0.12);
  // dinner (top-down)
  const seats = [-90, 0, 90, 180].map((a, i) => { const r = (a * Math.PI) / 180; return { x: 960 + 240 * Math.cos(r), y: 560 + 240 * Math.sin(r), rot: a + 180, s: i === 3 ? 0.7 : 1 }; });
  const pairs = [[0, 1, w.conversation - 0.2], [1, 3, w.conversation + 0.3], [3, 2, w.around], [2, 0, w.around + 0.5], [0, 3, w.dinner - 0.2], [1, 2, w.dinner + 0.3]];
  // privilege: a net under the teal person
  const lift = 120 * g(w.position - 0.3, w.position + 0.6);
  const netY = (x) => 640 + 110 * (1 - ((x - 710) / 300) ** 2) - lift;
  return (
    <g>
      <g opacity={fade(T, -1, q.V)}>
        <line x1="-100" y1={FL} x2="2100" y2={FL} stroke={C.line} strokeWidth="4" />
        {oraT}{wraps}
        <Fig {...ora} j={J(2)} />
        <path d={tD(0)} fill="none" stroke={C.hot} strokeWidth="5" strokeDasharray="26 12" strokeDashoffset={-pulled * 1400} />
        <path d={`M ${hB[0]} ${hB[1]} Q ${me.x + 20} ${FL - 20} ${me.x - 70} ${FL - 6}`} fill="none" stroke={mix(C.red, C.open.body, 0.55)} strokeWidth="5" />
        <ellipse cx={me.x - 90} cy={FL - 6} rx={coil} ry={coil * 0.12 + 4} fill="none" stroke={mix(C.red, C.open.body, 0.55)} strokeWidth="5" />
        <Fig {...me} j={J(1)} />
        <g transform={`translate(${knot[0]} ${knot[1]}) rotate(${T * 40})`}>
          {[0, 1, 2].map((i) => <ellipse key={i} rx="18" ry="8" transform={`rotate(${i * 60})`} fill="none" stroke={C.hot} strokeWidth="4" />)}
        </g>
      </g>
      <g opacity={fade(T, q.V, q.Tb)}>
        <line x1="-100" y1="860" x2="2100" y2="860" stroke={C.line} strokeWidth="4" />
        {nodes.map(([x, y], i) => {
          const f = { x, y: y + 90, s: 0.45, dir: -1, c: C.open };
          const hN = headAt(f);
          return (
            <g key={i}>
              <path d={`M ${hV[0] + 20} ${hV[1]} Q ${(hV[0] + hN[0]) / 2} ${Math.min(hV[1], hN[1]) - 120} ${hN[0]} ${hN[1]}`} fill="none" stroke={C.open.lite} strokeWidth="3" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - g(w.confidence + i * 0.12, w.voice + i * 0.12)} />
              <g opacity={0.3 + 0.7 * nodeOn(i)}><Fig {...f} j={J(10 + i)} /></g>
            </g>
          );
        })}
        {[[0, 1], [1, 3], [2, 4], [0, 2], [3, 2]].map(([a, b], i) => (
          <line key={'n' + i} x1={nodes[a][0]} y1={nodes[a][1] + 30} x2={nodes[b][0]} y2={nodes[b][1] + 30} stroke={C.open.body} strokeWidth="2.5" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - g(w.matters + i * 0.1, w.matters + 0.4 + i * 0.1)} />
        ))}
        <Fig {...vMe} j={J(1)} />
      </g>
      <g opacity={fade(T, q.Tb, q.D)}>
        <circle cx="960" cy="560" r="160" fill="#232323" />
        <path d={`M 2100 260 Q 1400 300 960 560`} fill="none" stroke={C.hot} strokeWidth="4" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - g(w.politics2 - 0.4, w.politics2 + 0.3)} />
        {pairs.map(([a, b, t], i) => (
          <path key={i} d={`M ${seats[a].x} ${seats[a].y} Q 960 560 ${seats[b].x} ${seats[b].y}`} fill="none" stroke={C.open.lite} strokeWidth="3" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - g(t, t + 0.5)} />
        ))}
        <circle cx="960" cy="560" r="14" fill="none" stroke={C.hot} strokeWidth="4" opacity={g(w.politics2, w.politics2 + 0.3)} />
        {seats.map((st, i) => <TopFig key={i} {...st} j={J(30 + i)} />)}
      </g>
      <g opacity={fade(T, q.D, q.P)}><DoorRoom k={k} x={960} y={850} s={1.25} thread={1} /></g>
      <g opacity={fade(T, q.P, 99)}>
        <line x1="-100" y1="900" x2="2100" y2="900" stroke={C.line} strokeWidth="4" />
        <line x1="410" y1="900" x2="410" y2={630 - lift} stroke="#333" strokeWidth="8" />
        <line x1="1010" y1="900" x2="1010" y2={630 - lift} stroke="#333" strokeWidth="8" />
        {[0, 1, 2, 3].map((i) => { let d = ''; for (let x = 410; x <= 1010; x += 15) d += (d ? ' L ' : 'M ') + x + ' ' + (netY(x) - 10 + i * 12 * (1 - ((x - 710) / 300) ** 2)).toFixed(1); return <path key={i} d={d} fill="none" stroke={C.open.lite} strokeWidth="2.5" opacity="0.8" />; })}
        {Array.from({ length: 13 }, (_, i) => { const x = 440 + i * 45; return <line key={'v' + i} x1={x} y1={netY(x) - 10} x2={x} y2={netY(x) + 26 * (1 - ((x - 710) / 300) ** 2)} stroke={C.open.lite} strokeWidth="2" opacity="0.6" />; })}
        <Fig x={700} y={netY(700) - 6} sit={1} dir={1} c={C.open} lean={-10} j={J(1)} />
        <Fig {...ora} j={J(2)} />
        {wraps}
      </g>
    </g>
  );
}

// ═══ F · TWO CHAIRS — pure acting. Two people side by side, the same red post reaches both ═══
function ConceptChairs({ k }) {
  const { T, q, w, J } = k;
  const g = (a, b) => MOTION.glide(T, a, b, 0, 1);
  const FL = 800;
  const kidT = g(w.many, w.childhood + 0.2) * (1 - g(q.P - 0.1, q.P + 0.5));
  const stand = g(q.V, q.V + 0.5) * (1 - g(q.Tb - 0.2, q.Tb + 0.3));
  const lift = 150 * g(w.position - 0.3, w.position + 0.6);
  const me = { x: 620, y: FL - lift, sit: 1 - stand, dir: 1, c: C.open };
  me.lean = -16 + 4 * osc(T, 2.8) + 22 * g(w.treat - 0.6, w.treat) * (1 - g(w.curiosity + 0.6, q.V));
  me.tilt = -6 + 18 * g(w.intellectual, w.curiosity) * (1 - g(q.V, q.V + 0.3));
  me.hand = lerp2([34, 58], [-20, -66], g(w.time - 0.2, w.time + 0.4) * (1 - g(w.treat - 0.8, w.treat - 0.3)));
  me.hand2 = lerp2([26, 58], [-30, -60], g(w.mental - 0.2, w.space + 0.3) * (1 - g(w.treat - 0.8, w.treat - 0.3)));
  const hMe = headAt(me);
  let cp = [2050, 500];
  cp = lerp2(cp, [1360, 470], g(w.space, w.treat - 0.4));
  cp = lerp2(cp, [790, 600], g(w.treat - 0.4, w.politics + 0.2));
  cp = lerp2(cp, [hMe[0] + 70, hMe[1] + 20], g(w.politics + 0.2, w.intellectual));
  cp = lerp2(cp, [2100, 300], g(q.V - 0.1, q.V + 0.9));
  me.hand = lerp2(me.hand, reachTo(me, cp), g(w.treat - 0.2, w.politics + 0.2) * (1 - g(q.V - 0.2, q.V + 0.2)));
  me.hand = lerp2(me.hand, [30, -86], g(w.confidence - 0.3, w.confidence + 0.1) * (1 - g(q.Tb - 0.2, q.Tb + 0.2)));
  const recoil = MOTION.hit(T, w.treat - 0.75, w.treat - 0.45, 0, 1) * (1 - g(w.politics, w.curiosity));
  const ora = { x: 1240, y: FL, sit: 1, dir: 1, c: C.cur, kid: kidT };
  const fl = MOTION.hit(T, w.threat, w.threat + 0.25, 0, 1) - 0.4 * g(w.threat + 0.3, w.door) + MOTION.hit(T, w.door, w.door + 0.25, 0, 0.4);
  const doorOn = g(q.D - 0.3, q.D + 0.2) * (1 - g(q.P, q.P + 0.6));
  ora.lean = 4 - 18 * recoil - 16 * fl * doorOn + 2 * osc(T, 0.8);
  ora.tilt = 10 - 10 * recoil + (6 + 10 * fl) * doorOn;
  ora.hand = lerp2([34, 58], [40, -40], recoil + fl * doorOn);
  const spot = 0.12 + 0.18 * g(w.confidence - 0.4, w.voice) - 0.2 * g(q.Tb - 0.2, q.Tb + 0.4) + 0.25 * g(w.position, w.privilege + 0.4);
  const dinner = g(w.many - 0.2, w.childhood + 0.3) * (1 - g(q.P - 0.1, q.P + 0.4));
  const red = 0.35 + 0.4 * g(q.D, w.threat + 0.1) + 0.25 * g(w.door, w.door + 0.3);
  const dx = (knock(T, w.threat) + knock(T, w.threat + 0.17) + knock(T, w.door) + knock(T, w.door + 0.15)) * 7;
  return (
    <g transform={cam(960, 540, 1 + 0.08 * g(q.Tb, q.D) + 0.1 * g(q.D - 0.3, q.D + 0.4) * (1 - g(q.P, q.P + 0.6)))}>
      <path d={`M 560 -60 L 680 -60 L ${620 + 200} ${FL} L ${620 - 200} ${FL} Z`} fill="#e9f5ef" opacity={Math.max(0, spot) * 0.6} transform={`translate(0 ${-lift * 0})`} />
      <line x1="-100" y1={FL} x2="2100" y2={FL} stroke={C.line} strokeWidth="4" />
      <rect x="490" y={FL - lift} width="260" height={lift} fill="#17211f" />
      <g opacity={doorOn}>
        <path d={`M 1460 ${FL} L 1600 ${FL} L 1700 ${FL + 60} L 1360 ${FL + 60} Z`} fill={C.hot} opacity={0.3 * red} />
        <rect x="1461" y={FL - 259} width="138" height="259" fill="none" stroke="#3a3a3a" strokeWidth="7" />
        <rect x={1470 + dx} y={FL - 250} width="120" height="243" fill="#1e1e1e" />
        <rect x="1470" y={FL - 7} width="120" height="7" fill={C.hot} opacity={red} />
      </g>
      <g opacity={1 - dinner}>
        <Chair x={625} y={FL - lift} dir={1} />
        <Fig {...me} j={J(1)} />
      </g>
      <g opacity={dinner}><DinnerSide k={k} x={835} y={FL} s={1} /></g>
      <Chair x={1245} y={FL} dir={1} h={50 + 30 * kidT} />
      <Fig {...ora} y={FL - 30 * kidT} j={J(2)} />
      <Card x={cp[0]} y={cp[1]} s={0.9} rot={-10 + 10 * osc(T, 1.8)} flip={Math.cos(Math.PI * 2 * g(w.intellectual, w.curiosity + 0.6))} />
      <Ripples T={T} x={hMe[0] + 30} y={hMe[1]} t0={w.confidence} t1={w.matters + 0.3} R={500} life={1.3} op={1 - dinner} />
    </g>
  );
}

// ═══ G · LAMPLIGHT — mental space is a pool of light; outside it the red is only glints ═══
function ConceptLamp({ k }) {
  const { T, q, w, J } = k;
  const g = (a, b) => MOTION.glide(T, a, b, 0, 1);
  const FL = 830, LX = 640;
  const spread = 200 + 110 * g(w.time - 0.2, w.time + 0.5) + 140 * g(w.mental, w.space + 0.6);
  const me = { x: LX, y: FL, sit: 1, dir: 1, c: C.open };
  me.lean = -6 + 12 * g(w.treat - 0.4, w.treat);
  me.tilt = 14 * g(w.intellectual, w.curiosity);
  const hMe = headAt(me);
  const items = Array.from({ length: 8 }, (_, i) => [130 + i * 150 + 30 * osc(T, 5, i * 0.1), 480 + 220 * hash(i + 2) + 12 * osc(T, 2.7, i * 0.3)]);
  let c0 = lerp2(items[4], [hMe[0] + 70, hMe[1] + 26], g(w.treat - 0.3, w.politics + 0.4));
  me.hand = lerp2([34, 58], reachTo(me, c0), g(w.treat - 0.1, w.treat + 0.3));
  const litAt = (x, y) => clamp((spread * ((y - 300) / (FL - 300)) + 40 - Math.abs(x - LX)) / 60, 0, 1) * (y > 300 ? 1 : 0);
  const ora = { x: 1520, y: FL, sit: 1, dir: -1, c: C.cur, lean: 16, tilt: 18, hand: [40, 0], hand2: [34, 6] };
  const hO = headAt(ora);
  const glints = Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * Math.PI * 2 + 0.1 * osc(T, 3, i * 0.1); const r = 190 + 30 * osc(T, 1.1, i * 0.2); return [hO[0] + r * Math.cos(a), hO[1] + 60 + r * 0.8 * Math.sin(a)]; });
  const cone = (x, top, sp, op, key) => (
    <g key={key}>
      <path d={`M ${x - 36} ${top} L ${x + 36} ${top} L ${x + sp} ${FL} L ${x - sp} ${FL} Z`} fill="#e9f5ef" opacity={0.1 * op} />
      <ellipse cx={x} cy={FL} rx={sp} ry="24" fill="#e9f5ef" opacity={0.12 * op} />
      <line x1={x} y1="-400" x2={x} y2={top - 30} stroke="#444" strokeWidth="3" />
      <path d={`M ${x - 36} ${top} L ${x + 36} ${top} L ${x + 22} ${top - 30} L ${x - 22} ${top - 30} Z`} fill="#555" />
    </g>
  );
  // voice: other lamps come on
  const lamps = [[1050, 0.75], [1400, 0.6], [1700, 0.5]];
  const lampOn = (i) => g(w.voice - 0.3 + i * 0.15, w.voice + 0.1 + i * 0.15);
  const vStand = g(q.V, q.V + 0.5);
  // privilege: the teal lamp hangs from higher up
  const top = 300 - 200 * g(w.position - 0.3, w.position + 0.6);
  const pSpread = 420 + 220 * g(w.position - 0.3, w.position + 0.6);
  return (
    <g>
      <g opacity={fade(T, -1, q.V)}>
        <line x1="-100" y1={FL} x2="2100" y2={FL} stroke={C.line} strokeWidth="4" />
        {cone(LX, 300, spread, 1, 'c')}
        {items.map(([x, y], i) => (i === 4 ? null : <Card key={i} x={x} y={y} s={0.8} rot={i * 17} lit={litAt(x, y)} />))}
        <Card x={c0[0]} y={c0[1]} s={0.8} rot={-6} lit={Math.max(litAt(c0[0], c0[1]), g(w.treat, w.politics))} flip={Math.cos(Math.PI * 2 * g(w.intellectual, w.curiosity + 0.6))} />
        <Fig {...me} j={J(1)} />
        <path d={`M ${hO[0] - 40} ${hO[1] + 70} L ${hO[0] - 10} ${hO[1] + 10} L ${hO[0] + 10} ${hO[1] + 14} Z`} fill="#e9f5ef" opacity="0.12" />
        {glints.map(([x, y], i) => <Card key={i} x={x} y={y} s={0.6} rot={i * 31} lit={0} op={0.5 + 0.5 * g(0.5 + i * 0.4, 1 + i * 0.4)} />)}
        <Fig {...ora} j={J(2)} />
      </g>
      <g opacity={fade(T, q.V, q.Tb)}>
        <line x1="-100" y1={FL} x2="2100" y2={FL} stroke={C.line} strokeWidth="4" />
        {cone(420, 300, 330, 1, 'v')}
        {lamps.map(([x, s], i) => <g key={i}>{cone(x, 300 + (1 - s) * 300, 260 * s, lampOn(i), 'l' + i)}<g opacity={0.3 + 0.7 * lampOn(i)}><Fig x={x} y={FL} s={s} dir={-1} c={C.open} j={J(10 + i)} /></g></g>)}
        <Fig x={420} y={FL} sit={1 - vStand} dir={1} c={C.open} hand={lerp2([34, 58], [30, -86], g(w.confidence - 0.3, w.confidence + 0.1))} j={J(1)} />
        <Ripples T={T} x={headAt({ x: 420, y: FL, sit: 1 - vStand })[0] + 30} y={headAt({ x: 420, y: FL, sit: 1 - vStand })[1]} t0={w.confidence} t1={w.matters + 0.3} R={1300} life={1.6} />
      </g>
      <g opacity={fade(T, q.Tb, q.D)}><DinnerSide k={k} x={960} y={860} s={1.15} lamp={1} /></g>
      <g opacity={fade(T, q.D, q.P)}><DoorRoom k={k} x={960} y={850} s={1.25} dark={1} /></g>
      <g opacity={fade(T, q.P, 99)}>
        <line x1="-100" y1={FL} x2="2100" y2={FL} stroke={C.line} strokeWidth="4" />
        {cone(LX, top, pSpread, 1, 'p')}
        <Fig x={LX} y={FL} dir={1} c={C.open} j={J(1)} />
        <Fig x={LX - 170} y={FL} s={0.8} dir={1} c={C.open} j={J(3)} />
        <Fig x={LX + 170} y={FL} s={0.6} kid={1} dir={-1} c={C.open} j={J(4)} />
        <path d={`M ${hO[0] - 40} ${hO[1] + 70} L ${hO[0] - 10} ${hO[1] + 10} L ${hO[0] + 10} ${hO[1] + 14} Z`} fill="#e9f5ef" opacity="0.12" />
        {glints.map(([x, y], i) => <Card key={i} x={x} y={y} s={0.6} rot={i * 31} lit={0} />)}
        <Fig {...ora} j={J(2)} />
      </g>
    </g>
  );
}

// ═══ H · TURNTABLE — a revolving stage; each turn swaps teal's side and orange's side ═══
function ConceptTurntable({ k }) {
  const { T, q, w, J } = k;
  const g = (a, b) => MOTION.glide(T, a, b, 0, 1);
  const PI = Math.PI;
  const th = PI * (g(w.intellectual + 0.2, w.curiosity + 0.35) + g(q.V - 0.15, q.V + 0.45) + g(q.Tb + 0.1, q.Tb + 0.9) + g(q.D - 0.35, q.D + 0.2) + 0.5 * g(q.P, q.P + 0.7));
  const set = clamp(Math.round(th / PI), 0, 4);
  const sx = Math.max(0.002, Math.abs(Math.cos(th)));
  const FL = 890, CX = 960;
  const split = g(q.P + 0.55, q.P + 0.95);
  const lift = 130 * g(w.position - 0.3, w.position + 0.6);
  const panelCol = [mix(C.bg, C.open.body, 0.16), mix(C.bg, C.cur.body, 0.16), mix(C.bg, C.open.body, 0.16), mix(C.bg, C.open.body, 0.2), mix(C.bg, C.cur.body, 0.12)][set];
  // set 0: teal with room to think
  const me = { x: 760, y: FL, sit: 1, dir: 1, c: C.open, lean: -8 + 12 * g(w.treat - 0.4, w.treat), tilt: 14 * g(w.intellectual, w.curiosity) };
  const hMe = headAt(me);
  let c0 = lerp2([1120, 640], [hMe[0] + 60, hMe[1] + 26], g(w.treat, w.politics + 0.4));
  me.hand = lerp2([34, 58], reachTo(me, c0), g(w.treat - 0.4, w.treat));
  const contents = [
    <g key="0">
      <Chair x={765} y={FL} dir={1} />
      {[[1180, 540], [1240, 690], [1060, 470]].map(([x, y], i) => <Card key={i} x={x + 6 * osc(T, 2.4, i * 0.3)} y={y} s={0.9} rot={i * 20 - 10} />)}
      <Fig {...me} j={J(1)} />
      <Card x={c0[0]} y={c0[1]} s={0.9} rot={-6} flip={Math.cos(PI * 2 * g(w.intellectual, w.curiosity + 0.6))} />
    </g>,
    <g key="1">
      {Array.from({ length: 16 }, (_, i) => <Card key={i} x={640 + (i % 6) * 130 + 30 * hash(i)} y={420 + Math.floor(i / 6) * 120 + 20 * hash(i + 7)} s={0.9} rot={40 * (hash(i + 3) - 0.5)} />)}
      <Fig x={960} y={FL} sit={1} dir={1} c={C.cur} lean={18} tilt={16} hand={[30, 10]} hand2={[24, 16]} j={J(2)} />
    </g>,
    <g key="2">
      {[[1080, 560], [1220, 470], [1170, 680]].map(([x, y], i) => <g key={i} opacity={0.3 + 0.7 * g(w.voice - 0.3 + i * 0.15, w.voice + i * 0.15)}><Fig x={x} y={y} s={0.4} dir={-1} c={C.open} j={J(10 + i)} /></g>)}
      <Fig x={780} y={FL} dir={1} c={C.open} hand={lerp2([10, 80], [30, -86], g(w.confidence - 0.3, w.confidence + 0.1))} j={J(1)} />
      <Ripples T={T} x={headAt({ x: 780, y: FL })[0] + 30} y={headAt({ x: 780, y: FL })[1]} t0={w.confidence} t1={w.matters + 0.3} R={360} life={1.2} />
    </g>,
    <g key="3"><DinnerSide k={k} x={960} y={FL} s={0.82} /></g>,
    <g key="4"><DoorRoom k={k} x={930} y={FL} s={0.85} /></g>,
  ];
  const ticks = Array.from({ length: 16 }, (_, i) => { const a = th + (i / 16) * PI * 2; return Math.cos(a) > 0 ? <circle key={i} cx={CX + 760 * Math.sin(a)} cy={FL + 10 + 110 * Math.cos(a)} r="5" fill="#444" /> : null; });
  const half = (side, dy) => (
    <g transform={`translate(0 ${dy})`}>
      <path d={side < 0 ? `M ${CX} ${FL - 110} A 760 110 0 0 0 ${CX} ${FL + 110} L ${CX} ${FL + 150} A 760 110 0 0 1 ${CX - 760} ${FL + 40} L ${CX - 760} ${FL} A 760 110 0 0 1 ${CX} ${FL - 110} Z`
        : `M ${CX} ${FL - 110} A 760 110 0 0 1 ${CX} ${FL + 110} L ${CX} ${FL + 150} A 760 110 0 0 0 ${CX + 760} ${FL + 40} L ${CX + 760} ${FL} A 760 110 0 0 0 ${CX} ${FL - 110} Z`}
        fill={side < 0 ? '#1b2624' : '#262019'} />
      <path d={side < 0 ? `M ${CX} ${FL - 110} A 760 110 0 0 0 ${CX} ${FL + 110}` : `M ${CX} ${FL - 110} A 760 110 0 0 1 ${CX} ${FL + 110}`} fill="none" stroke="#333" strokeWidth="3" />
    </g>
  );
  return (
    <g transform={cam(960, 600, 0.92)}>
      <g opacity={1 - split}>
        <rect x={CX - 760} y={FL} width="1520" height="40" fill="#1a1a1a" />
        <ellipse cx={CX} cy={FL + 40} rx="760" ry="110" fill="#1a1a1a" />
        <ellipse cx={CX} cy={FL} rx="760" ry="110" fill="#222" />
        {ticks}
        <g transform={`translate(${CX} 0) scale(${sx} 1) translate(${-CX} 0)`}>
          <clipPath id="hPanel"><rect x={CX - 420} y="300" width="840" height={FL - 300} /></clipPath>
          <rect x={CX - 420} y="300" width="840" height={FL - 300} fill={panelCol} stroke="#3a3a3a" strokeWidth="5" />
          <g clipPath="url(#hPanel)">{contents[set]}</g>
        </g>
      </g>
      <g opacity={split}>
        {half(-1, -lift)}{half(1, 0)}
        <line x1={CX} y1={300 - lift * 0.5} x2={CX} y2={FL} stroke="#3a3a3a" strokeWidth="10" />
        <Fig x={620} y={FL - lift} dir={1} c={C.open} j={J(1)} />
        <Fig x={470} y={FL - lift} s={0.8} dir={1} c={C.open} j={J(3)} />
        {Array.from({ length: 8 }, (_, i) => <Card key={i} x={1180 + (i % 4) * 110} y={560 + Math.floor(i / 4) * 130 + 10 * osc(T, 1.3, i * 0.2)} s={0.8} rot={i * 25} />)}
        <Fig x={1300} y={FL} dir={-1} c={C.cur} lean={14} tilt={14} j={J(2)} />
      </g>
    </g>
  );
}

// ═══ Script card — review aid for the comparison grid only ═══
const BEATS = [['Curiosity', '1 · Curiosity'], ['Voice', '2 · Voice'], ['Table', '3 · Dinner table'], ['Door', '4 · Door'], ['Privilege', '5 · Privilege'], ['Hold', 'Hold']];
function ScriptCard({ k, items }) {
  const { T, q } = k;
  const starts = [q.C, q.V, q.Tb, q.D, q.P, q.E];
  let b = 0;
  starts.forEach((s, i) => { if (T >= s) b = i; });
  const line = items.find((it) => T >= it.at && T < it.until);
  const total = q.E + 0.24;
  return (
    <g fontFamily="Open Sans, sans-serif">
      <text x="120" y="330" fill="#5fa69a" fontSize="90" fontWeight="700">{BEATS[b][1]}</text>
      <foreignObject x="120" y="400" width="1680" height="400">
        <div xmlns="http://www.w3.org/1999/xhtml" style={{ color: '#f3f1ea', font: '600 76px "Open Sans", sans-serif', lineHeight: 1.2 }}>{line ? line.text : ''}</div>
      </foreignObject>
      <rect x="120" y="900" width="1680" height="8" fill="#2a2a2a" />
      {starts.slice(1).map((s, i) => <rect key={i} x={120 + (1680 * s) / total - 2} y="885" width="4" height="38" fill="#555" />)}
      <rect x="120" y="900" width={(1680 * T) / total} height="8" fill="#5fa69a" />
      <text x="120" y="990" fill="#888" fontSize="44">{`${Math.floor(T)}s ${String(Math.round((T % 1) * 25)).padStart(2, '0')}f`}</text>
    </g>
  );
}

// ═══ piece ══════════════════════════════════════════════════════════════════
const CONCEPTS = {
  A: ['Façade', ConceptFacade], B: ['High Ground', ConceptHill], C: ['The Table', ConceptTable], D: ['Elbow Room', ConceptRoom],
  E: ['Threads', ConceptThreads], F: ['Two Chairs', ConceptChairs], G: ['Lamplight', ConceptLamp], H: ['Turntable', ConceptTurntable],
  S: ['Script', null],
};
function Piece({ concept, guide, boil, boilAmp }) {
  const { T, CUES } = useComposition();
  const q = { C: CUES.Curiosity, V: CUES.Voice, Tb: CUES.Table, D: CUES.Door, P: CUES.Privilege, E: CUES.Hold };
  // word timings from timing_2.srt, anchored to the section they fall in
  const w = {
    find: q.C + 0.24, open: q.C + 0.64, engagers: q.C + 1.16, time: q.C + 2.52, mental: q.C + 3.4, space: q.C + 3.76,
    treat: q.C + 4.64, politics: q.C + 4.92, intellectual: q.C + 5.84, curiosity: q.C + 6.48,
    they: q.V + 0.24, confidence: q.V + 1.04, voice: q.V + 2.04, matters: q.V + 2.4,
    many: q.Tb + 0.4, childhood: q.Tb + 1.6, politics2: q.Tb + 2.6, conversation: q.Tb + 3.68, around: q.Tb + 4.2, dinner: q.Tb + 5.04, table: q.Tb + 5.28,
    not: q.D + 0.24, threat: q.D + 0.64, door: q.D + 1.04,
    this: q.P + 0.56, position: q.P + 1.44, privilege: q.P + 2.08,
  };
  const items = [
    { at: q.C + 0.24, until: q.C + 4.64, text: 'We find that open engagers have the time and mental space' },
    { at: q.C + 4.64, until: q.V + 0.24, text: 'to treat politics as intellectual curiosity.' },
    { at: q.V + 0.24, until: q.Tb + 0.4, text: 'They have the confidence that their voice matters.' },
    { at: q.Tb + 0.4, until: q.Tb + 2.04, text: 'And many of them enjoyed a childhood' },
    { at: q.Tb + 2.04, until: q.D + 0.24, text: 'where politics was a conversation around the dinner table,' },
    { at: q.D + 0.24, until: q.P + 0.56, text: 'not a threat at the door.' },
    { at: q.P + 0.56, until: q.E + 0.24, text: 'This comes from a position of privilege.' },
  ];
  const bf = Math.floor(T * 8), amp = boil ? boilAmp : 0;
  const k = { T, q, w, bf, amp, J: jitter(bf, amp) };
  const [name, Comp] = CONCEPTS[concept] || CONCEPTS.A;
  return (
    <div data-screen-label={`${concept} · ${T.toFixed(1)}s`} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: C.bg, transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <rect width={W} height={H} fill={C.bg} />
        {Comp ? <Comp k={k} /> : <ScriptCard k={k} items={items} />}
      </svg>
      {guide && Comp && (
        <React.Fragment>
          <div style={{ position: 'absolute', left: 56, top: 40, display: 'flex', gap: 18, alignItems: 'baseline', font: '700 52px "Open Sans", sans-serif', color: '#ffffff', textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}>
            <span>{concept}</span><span style={{ fontWeight: 500 }}>{name}</span>
          </div>
          <Captions items={items} style={{ font: '500 40px "Open Sans", sans-serif', bottom: '5%', textShadow: '0 1px 14px rgba(0,0,0,0.8)' }} />
        </React.Fragment>
      )}
    </div>
  );
}

function FUOpenConcepts() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { concept: 'A', referenceOverlay: true, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={C.bg}>
        <Piece concept={t.concept} guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Concept" />
        <TweakSelect label="Concept" value={t.concept} options={Object.entries(CONCEPTS).map(([v, [n]]) => ({ value: v, label: `${v} · ${n}` }))} onChange={(v) => setTweak('concept', v)} />
        <TweakSection label="Preview" />
        <TweakToggle label="Label + narration guide" value={t.referenceOverlay} onChange={(v) => setTweak('referenceOverlay', v)} />
        <TweakToggle label="Line boil (8 fps)" value={t.lineBoil} onChange={(v) => setTweak('lineBoil', v)} />
        <TweakSlider label="Boil amplitude" value={t.boilAmp ?? 0.5} min={0} max={3} step={0.1} unit="px" onChange={(v) => setTweak('boilAmp', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

window.FUOpenConcepts = FUOpenConcepts;
