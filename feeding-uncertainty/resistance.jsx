// Feeding Uncertainty — "Coping is a form of resistance. The question is, what do people have to resist with?" (8s00f, timing_4.srt)
// Round 3: a terrace street at night, at ground level and close, in the style of the Vulnerability alley: brick fronts, stone
// lintels and sills, streetlights whose pools are the only light on the brick; the rest of the street is dark.
// Three front doors: blue, teal, orange. A single beat: one swarm of red posts comes along the street at 4 s and the three react
// about 1.1 s apart. Blue shuts the door, then a roller shutter comes down over the window. A second teal person inside puts a hand
// on teal's shoulder; teal's window stays lit. Orange pulls back behind the door and their window, behind the curtain, flickers.
//   Camera 1 · Push: the three houses side by side; from "resist" the camera pushes in on orange, who stays near frame right.
//   Camera 2 · Track: the houses further apart. It opens on blue and teal with the swarm already there, circling the streetlight
//     to their left while they watch it. On "what do people have to resist with" it moves along the doors and the camera drifts
//     with it, slowly, then eases to a stop at orange and stays there for the last two seconds (section Orange).
// People use the Bean front view (rigs/bean-rig.jsx); helpers from open-engagers-concepts.jsx (window.FU_RIG).
// The previous round (open gallery) is kept in archive/resistance-gallery.jsx.
const { W, H, OUT_W, OUT_H, MOTION, osc, lerp, lerp2, cam, mix, C, hash, jitter, Card } = window.FU_RIG;
const { BeanFront, PAL } = window.FU_BEAN;
const LIGHT = '#e9f5ef';
const GRP = [PAL.wd, PAL.open, PAL.cur];
const GLOW = [PAL.wd.body, PAL.open.body, PAL.cur.body];
const DARK = 0.8;                                   // how far the unlit copy fades toward the background
const FLR = 860, KERB = 990, DW = 140, DH = 280;    // threshold / foot of the facades, kerb, door
const LAMP_Y = 190;                                 // lantern height
const BRICK = ['#3a2e2a', '#33282a', '#3d3129', '#2f2a28', '#352a27', '#382b28'];
const STONE = '#4a4642', FRAME = '#2b2e2d', GLASS = '#111413', CURTAIN = '#4a3c33';
const WIN = { dx: 110, w: 150, h: 170, y: FLR - 260 };   // ground-floor window, relative to the door centre
const UP = { y: 220, h: 200 };                           // first-floor windows

function Front({ k, id, ...p }) { return <BeanFront {...p} T={k.T} boil={k.amp > 0} boilAmp={k.amp} id={k.uid * 1000 + id} />; }
function swarmAt(T, id, c, n, sp, s = 0.6) {
  return Array.from({ length: n }, (_, i) => {
    const h = (m) => hash(i * 9.1 + m * 3.7 + id * 17.3);
    const r = Math.pow(h(1), 0.8), a = 6.283 * h(2);
    return { x: c[0] + sp[0] * r * Math.cos(a) + 24 * Math.sin(T * (1.6 + h(3)) + 6.28 * h(4)),
      y: c[1] + sp[1] * r * Math.sin(a) + 14 * Math.cos(T * (2.3 + h(5)) + 6.28 * h(6)),
      s: s * (0.8 + 0.4 * h(9)), rot: -12 + 24 * h(7) + 10 * Math.sin(T * 1.3 + 6 * h(8)), flip: 0.25 + 0.75 * Math.abs(Math.cos(T * (9 + 4 * h(10)) + 6.28 * h(11))) };
  });
}
// smooth path through keys [t, x] (cubic Hermite), extrapolated linearly at both ends
function hermite(K, t) {
  const n = K.length;
  if (t <= K[0][0]) return K[0][1] + ((t - K[0][0]) * (K[1][1] - K[0][1])) / (K[1][0] - K[0][0]);
  if (t >= K[n - 1][0]) return K[n - 1][1] + ((t - K[n - 1][0]) * (K[n - 1][1] - K[n - 2][1])) / (K[n - 1][0] - K[n - 2][0]);
  const sec = (i) => (K[i + 1][1] - K[i][1]) / (K[i + 1][0] - K[i][0]);
  const tan = (i) => (i === 0 ? sec(0) : i === n - 1 ? sec(n - 2) : (sec(i - 1) + sec(i)) / 2);
  let i = 0; while (t > K[i + 1][0]) i++;
  const h = K[i + 1][0] - K[i][0], u = (t - K[i][0]) / h, u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * K[i][1] + (u3 - 2 * u2 + u) * h * tan(i) + (-2 * u3 + 3 * u2) * K[i + 1][1] + (u3 - u2) * h * tan(i + 1);
}

// ── the street for a given house width SP: houses j = -3..5, the three characters are j = 0, 1, 2 ──
const STREETS = {};
function street(SP) {
  if (STREETS[SP]) return STREETS[SP];
  const DX = [960 - SP, 960, 960 + SP];
  const houses = [];
  for (let j = SP > 560 ? -9 : -3; j <= 5; j++) {
    const h = (n) => hash(j * 13.1 + n * 2.3 + 7);
    const dx0 = 960 + (j - 1) * SP, x0 = dx0 - DW / 2 - 60;
    const dx = j === 0 ? x0 + SP - DW / 2 - 60 : dx0;   // blue's house is mirrored about its own centre: door at the right, next to teal
    const wins = j === 0 ? [dx - WIN.dx - WIN.w] : [dx + WIN.dx];   // blue's house is mirrored: window left of the door
    if (SP > 560) wins.push(j === 0 ? dx - WIN.dx - WIN.w - 200 : dx + WIN.dx + 200);
    houses.push({ j, who: j >= 0 && j <= 2 ? j : -1, dx, x0, x1: x0 + SP, wins, brick: BRICK[((j % 6) + 6) % 6],
      door: ['#29323a', '#26332f', '#3a2d24', '#2e2c2a'][Math.floor(h(1) * 4)], nGlow: h(2) < 0.3 ? (h(3) > 0.5 ? 0 : 1) : -1 });
  }
  // evenly spaced, anchored on the party wall between blue's and teal's doors; on the wide street one lands just before orange's door
  const P = SP > 560 ? 1050 : 720, LX = DX[0] + SP * 0.79;   // wide street: the next one stands between orange's two windows
  const lamps = Array.from({ length: SP > 560 ? 8 : 5 }, (_, n) => LX + (n - (SP > 560 ? 5 : 2)) * P);
  return (STREETS[SP] = { SP, DX, houses, lamps });
}
// how much streetlight falls on a point (for the few parts drawn once instead of lit + dark)
const lightAt = (S, x, y) => Math.max(0, ...S.lamps.map((lx) => Math.exp(-(((x - lx) / 260) ** 2) - (((y - 560) / 420) ** 2))));

// one brick front, drawn lit or in the dark
function HouseFront({ hs, lit, J }) {
  const c = (col) => mix(col, C.bg, lit ? 0 : DARK);
  const { x0, x1, dx, brick } = hs, top = -700;
  const mortar = c(mix(brick, '#000000', 0.3));
  let courses = '', joints = '';
  for (let y = 80, r = 0; y < FLR - 40; y += 18, r++) {
    courses += `M ${x0} ${y} H ${x1} `;
    for (let x = x0 + (r % 2) * 27; x < x1; x += 54) joints += `M ${x} ${y} V ${y + 18} `;
  }
  const win = (x, y, w, h, key) => (
    <g key={key}>
      <rect x={x - 15} y={y - 26} width={w + 30} height="18" fill={c(STONE)} />
      <rect x={x - 7} y={y - 7} width={w + 14} height={h + 14} fill={c(FRAME)} />
      <rect x={x} y={y} width={w} height={h} fill={c(GLASS)} />
      <rect x={x - 12} y={y + h + 4} width={w + 24} height="12" fill={c(STONE)} />
    </g>
  );
  return (
    <g transform={`translate(${J[0]} ${J[1]})`}>
      <rect x={x0} y={top} width={x1 - x0} height={FLR - top} fill={c(brick)} />
      <path d={courses} stroke={mortar} strokeWidth="2" opacity="0.7" />
      <path d={joints} stroke={mortar} strokeWidth="2" opacity="0.5" />
      <rect x={x0} y={FLR - 42} width={x1 - x0} height="42" fill={c(mix(brick, '#000000', 0.22))} />
      <rect x={x0} y="455" width={x1 - x0} height="16" fill={c(STONE)} />
      <rect x={x0 - 4} y={top} width="8" height={FLR - top} fill={c(mix(brick, '#000000', 0.4))} />
      {win(dx - 65, UP.y, 130, UP.h, 'u0')}
      {hs.wins.map((wx, i) => win(wx, UP.y, WIN.w, UP.h, 'u' + (i + 1)))}
      {hs.wins.map((wx, i) => win(wx, WIN.y, WIN.w, WIN.h, 'g' + i))}
      <rect x={dx - DW / 2 - 18} y={FLR - DH - 72} width={DW + 36} height="18" fill={c(STONE)} />
      <rect x={dx - DW / 2 - 10} y={FLR - DH - 56} width={DW + 20} height={DH + 56} fill={c(FRAME)} />
      <rect x={dx - DW / 2} y={FLR - DH - 48} width={DW} height="36" fill={c(GLASS)} />
      <rect x={dx - DW / 2} y={FLR - DH} width={DW} height={DH} fill={c('#0f0d0b')} />
      <rect x={dx - DW / 2 - 16} y={FLR} width={DW + 32} height="12" fill={c(mix(STONE, '#000000', 0.25))} />
    </g>
  );
}
function Pavement({ lit, S }) {
  const c = (col) => mix(col, C.bg, lit ? 0 : DARK);
  let joints = '';
  for (let x = -1400; x < 3400; x += 130) joints += `M ${x} ${FLR + 12} L ${x - 18} ${KERB - 6} `;
  return (
    <g>
      <rect x="-1400" y={FLR} width="4800" height={KERB - FLR} fill={c('#1f2321')} />
      <path d={joints} stroke={c('#191c1b')} strokeWidth="3" />
      <rect x="-1400" y={KERB - 6} width="4800" height="12" fill={c('#2c3130')} />
      <rect x="-1400" y={KERB + 6} width="4800" height="600" fill={c('#141615')} />
    </g>
  );
}
function Lamp({ x, breathe }) {
  return (
    <g>
      <rect x={x - 5} y={LAMP_Y + 20} width="10" height={KERB - 14 - LAMP_Y - 20} fill="#2a2e2d" />
      <rect x={x - 11} y={KERB - 44} width="22" height="30" rx="3" fill="#2a2e2d" />
      <path d={`M ${x - 20} ${LAMP_Y - 18} L ${x + 20} ${LAMP_Y - 18} L ${x + 9} ${LAMP_Y - 34} L ${x - 9} ${LAMP_Y - 34} Z`} fill="#30353a" />
      <rect x={x - 14} y={LAMP_Y - 18} width="28" height="34" fill={LIGHT} opacity={0.9 * breathe} />
      <rect x={x - 16} y={LAMP_Y + 14} width="32" height="7" fill="#30353a" />
      <circle cx={x} cy={LAMP_Y - 38} r="4" fill="#30353a" />
      <circle cx={x} cy={LAMP_Y} r="120" fill="url(#rsHalo)" opacity={breathe} />
    </g>
  );
}
const dust = (T, x0, x1) => Array.from({ length: Math.round((300 * (x1 - x0)) / 4000) }, (_, i) => {
  const h = (n) => hash(i * 7.3 + n * 1.9 + 41);
  const x = x0 + (x1 - x0) * h(1) + 12 * osc(T, 4 + 3 * h(2), h(3));
  const y = LAMP_Y + 20 + (KERB - LAMP_Y) * h(4) + 8 * osc(T, 5 + 3 * h(5), h(6)) - T * (2 + 4 * h(7));
  return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={(0.9 + 1.1 * h(8)).toFixed(2)} fill={LIGHT} opacity={(0.25 + 0.3 * h(9)).toFixed(2)} />;
});

function Street({ k, camMode }) {
  const { T, q, w } = k, g = (a, b) => MOTION.glide(T, a, b, 0, 1);
  const S = street(camMode === 'track' ? 640 : 440), { DX, SP } = S;
  // the swarm is there from the start, circling the streetlight left of blue; on "what do people have" it moves along the doors,
  // reaching blue, teal and orange about 1.2 s apart, and flies on out of frame
  const swKeys = [[0, DX[0] - 150], [2.8, DX[0] + 260], [w.question, DX[0] + 300], [w.what - 0.5, DX[0] + 400], [w.what + 0.29, DX[0] + 520], [w.what + 1.54, DX[1] + 80],
    [w.what + 2.74, DX[2]], [w.what + 3.7, DX[2] + 460], [w.what + 4.6, DX[2] + 1150]];
  const tB0 = 2.8;
  const circ = 1 - g(w.what - 0.9, w.what);
  const dart = Math.abs(T - tB0) < 1 ? Math.cos((Math.PI * (T - tB0)) / 2) ** 2 : 0;   // a smooth swell toward blue, peaking at the slam
  const sx = hermite(swKeys, T) + 70 * Math.sin(T * 1.3) * circ + 120 * dart;
  const on = true;
  const posts = swarmAt(T, 2, [sx, 520 + 30 * Math.sin(T * 1.1 + 1) + 40 * Math.cos(T * 1.3) * circ + 40 * dart], 32, [270, 100], 0.62);
  // the three reactions, about 1.2 s apart, each just before the swarm arrives
  const tB = tB0, tT = w.what + 1.24, tO = w.what + 2.44;   // blue slams early, while still in frame
  const shut = MOTION.hit(T, tB, tB + 0.3, 0, 1), shutter = g(tB + 0.55, tB + 1.25);
  const hand = g(tT, tT + 0.45), pull = g(tO - 0.8, tO - 0.35), reopen = g(q.O + 0.34, q.O + 1.0);   // after the push-in orange opens up a little again
  const flick = T < tO - 0.1 ? 1 : clamp(0.62 + 0.3 * Math.sin(T * 31) * Math.sin(T * 13.7) - 2 * Math.max(0, Math.sin(T * 5.3 + 1) - 0.75), 0.12, 1);
  const glow = [1 - shutter, 1, flick];
  const room = [0.08 + 0.4 * g(w.have, w.have + 0.4), 0.6, T > w.resist ? 0.04 + 0.05 * Math.abs(Math.sin(T * 29)) : 0.08];
  const roomFill = (r) => mix('#171310', '#c9d6d0', 0.55 * r);
  const breathe = 0.96 + 0.04 * osc(T, 3.7);
  const watch = 1;

  // camera
  let cx, cy, z;
  if (camMode === 'track') {
    // an even drift from the start, a gentle lift (about 1.5x) as the swarm moves along the doors, then a long ease to a stop at orange
    const tS = w.what - 0.36, tE = q.O + 1.04, x0c = DX[0] + 80, xEnd = DX[2] + 40;
    const v = (t) => (0.65 + 0.35 * MOTION.glide(t, tS - 0.6, tS + 1.0, 0, 1)) * (1 - MOTION.glide(t, tE - 2.4, tE, 0, 1));
    const integ = (t) => { let a = 0; for (let u = 0; u < t; u += 0.02) a += v(u) * Math.min(0.02, t - u); return a; };
    cx = x0c + ((xEnd - x0c) * integ(Math.min(T, tE))) / integ(tE);
    cy = 620; z = 1.25 + 0.18 * g(tO - 0.6, q.E + 0.24);   // slow push-in on orange, running to the last frame
  } else {
    const anchor = 1200, zEnd = 2.0, pz = g(w.resist, q.E + 0.24);
    z = lerp(1.06 - 0.06 * g(w.question - 0.1, w.is + 0.6), zEnd, pz);
    cx = lerp(960, DX[2] - (anchor - 960) / zEnd, pz); cy = lerp(640, 600, pz);
  }

  const residents = S.houses.filter((hs) => hs.who >= 0).map((hs) => {
    const i = hs.who, dx = hs.dx;
    const open = [0.5 * (1 - shut), 1, 0.4 - 0.18 * pull + 0.12 * reopen][i];
    const gx0 = dx - DW / 2, gap = DW * open, top = FLR - DH, mir = i === 0;   // blue's door is hinged on the left
    const leafX = mir ? gx0 : gx0 + gap, gapX = mir ? gx0 + DW - gap : gx0;
    const lookX = lerp(0, clamp((sx - dx) / 500, -1, 1), watch);
    const pose = [
      { tilt: 4 + 2 * osc(T, 2.7), look: [lookX, 0.15], lean: 3 * watch },
      { tilt: 3 * osc(T, 2.4), look: [lerp(lookX, -0.8, hand * (1 - g(tT + 0.6, tT + 1.1))), -0.1], lean: 2 * osc(T, 3.1) },
      { lean: -10 + 6 * pull + 3 * reopen, tilt: -8 + 4 * pull + 3 * reopen, look: [lookX, 0.1 + 0.2 * pull - 0.15 * reopen] },   // eyes keep following the swarm
    ][i];
    const fx = i === 1 ? dx + 18 : mir ? gx0 + DW - Math.min(gap * 0.5 + 4, DW / 2) : gx0 + Math.min(gap * 0.5 + 4, DW / 2);
    let mate = null;
    if (i === 1) {   // teal's companion, just inside: right hand reaches up to teal's left shoulder
      const ms = 1.08, mx = dx - 38, sh = [(fx - 13 - mx) / ms, -174 / ms];
      mate = <Front k={k} id={5} x={mx} y={FLR} s={ms} c={PAL.open} pose={{ lean: 5 * hand + 1.5 * osc(T, 3.4, 0.4), tilt: 6 * hand + 2 * osc(T, 2.9), look: [0.7 * hand, 0.2], armR: { to: lerp2([26, -92], sh, hand) }, armL: [8, 6] }} />;
    }
    const wx = hs.wins[0], wy = WIN.y, ww = WIN.w, wh = WIN.h, gl = glow[i];
    const leafL = lightAt(S, dx, FLR - DH / 2);
    const cur = (x0, x1, key) => {
      const col = mix(mix(CURTAIN, C.bg, 0.45), GLOW[2], 0.35 * gl);
      return <g key={key}><rect x={Math.min(x0, x1)} y={wy} width={Math.abs(x1 - x0)} height={wh} fill={col} />{[0.33, 0.66].map((f) => <line key={f} x1={lerp(x0, x1, f)} x2={lerp(x0, x1, f) + 2} y1={wy} y2={wy + wh} stroke={mix(col, '#000000', 0.25)} strokeWidth="3" />)}</g>;
    };
    return (
      <g key={i}>
        {/* doorway: room light, the people inside, the door leaf */}
        <rect x={gx0} y={top} width={DW} height={DH} fill={roomFill(room[i])} />
        <clipPath id={`rsDoor${k.uid}${i}`}><rect x={gx0} y={top} width={DW} height={DH} /></clipPath>
        <g clipPath={`url(#rsDoor${k.uid}${i})`}>
          {mate}
          <Front k={k} id={i + 1} x={fx} y={FLR} s={1} pose={pose} c={GRP[i]} arms={i === 1} />
        </g>
        <rect x={leafX} y={top} width={DW - gap} height={DH} fill={mix(hs.door, C.bg, DARK * (1 - leafL))} />
        {[0, 1].map((r) => <rect key={r} x={leafX + 18} y={top + 26 + r * 128} width={Math.max(0, DW - gap - 36)} height="100" fill="none" stroke={mix(mix(hs.door, '#000000', 0.3), C.bg, DARK * (1 - leafL))} strokeWidth="3" />)}
        <circle cx={mir ? leafX + DW - gap - 14 : leafX + 14} cy={top + DH * 0.52} r="5" fill="#555" />
        {/* fanlight and window, glowing in the group colour */}
        <rect x={gx0} y={top - 48} width={DW} height="36" fill={mix(GLASS, GLOW[i], 0.4 * gl)} />
        {[44, 38, 32, 26, 20, 14, 8].map((e, j) => <rect key={j} x={wx - e} y={wy - e} width={ww + 2 * e} height={wh + 2 * e} rx={e} fill={GLOW[i]} opacity={0.022 * gl} />)}
        <rect x={wx} y={wy} width={ww} height={wh} fill={mix(mix(GLASS, GLOW[i], 0.32 * gl), '#c9d6d0', 0.3 * room[i] * gl)} />
        {i === 1 && (
          <g>
            <clipPath id={`rsWin${k.uid}`}><rect x={wx} y={wy} width={ww} height={wh} /></clipPath>
            <g clipPath={`url(#rsWin${k.uid})`}><g transform={`translate(0 ${(150 * (1 - g(w.people + 0.1, w.have + 0.3))).toFixed(1)})`}>
              <Front k={k} id={11} x={wx + 45} y={wy + wh + 95} s={0.6} c={PAL.open} pose={{ tilt: 8, look: [1, 0] }} />
              <Front k={k} id={12} x={wx + 105} y={wy + wh + 105} s={0.5} c={PAL.open} pose={{ tilt: -6, look: [-1, 0.2] }} headScale={1.3} />
            </g></g>
          </g>
        )}
        {i === 2 && <g>{cur(wx, wx + ww * 0.34, 'a')}{cur(wx + ww, wx + ww * 0.7, 'b')}</g>}
        <rect x={wx + ww / 2 - 2} y={wy} width="4" height={wh} fill={FRAME} />
        {i === 0 && (
          <g>
            <rect x={wx} y={wy} width={ww} height={wh * shutter} fill={mix('#2b2f2d', C.bg, DARK * (1 - lightAt(S, wx, wy)))} />
            {Array.from({ length: Math.ceil(13 * shutter) }, (_, j) => <line key={j} x1={wx} x2={wx + ww} y1={wy + wh * shutter - j * 13} y2={wy + wh * shutter - j * 13} stroke="#1e2120" strokeWidth="2" />)}
            <rect x={wx - 6} y={wy - 12} width={ww + 12} height="14" fill="#333836" />
          </g>
        )}
        <path d={`M ${gapX} ${FLR + 12} L ${gapX + gap} ${FLR + 12} L ${gapX + gap + 50} ${KERB - 8} L ${gapX - 50} ${KERB - 8} Z`} fill={LIGHT} opacity={0.16 * room[i] * clamp(open * 4, 0, 1)} />
      </g>
    );
  });
  // the neighbours: doors shut; some glow a dim blue or teal behind their shutters
  const neighbours = S.houses.filter((hs) => hs.who < 0).map((hs) => {
    const L = lightAt(S, hs.dx, FLR - DH / 2);
    return (
      <g key={hs.j}>
        <rect x={hs.dx - DW / 2} y={FLR - DH} width={DW} height={DH} fill={mix(hs.door, C.bg, DARK * (1 - L))} />
        {hs.nGlow >= 0 && hs.wins.slice(0, 1).map((wx) => (
          <g key={wx}>
            <rect x={wx} y={WIN.y} width={WIN.w} height={WIN.h} fill={mix(C.bg, GLOW[hs.nGlow], 0.5 + 0.06 * osc(T, 4.3, hs.j * 0.2))} />
            {Array.from({ length: 13 }, (_, r) => <rect key={r} x={wx} y={WIN.y + 3 + r * 13} width={WIN.w} height="9" fill={mix('#2c312f', C.bg, DARK * (1 - L))} />)}
          </g>
        ))}
      </g>
    );
  });

  const x0 = S.houses[0].x0, x1 = S.houses[S.houses.length - 1].x1;
  const cone = (lx) => `M ${lx - 13} ${LAMP_Y + 16} L ${lx + 13} ${LAMP_Y + 16} L ${lx + 300} ${KERB - 8} A 300 46 0 0 1 ${lx - 300} ${KERB - 8} Z`;
  const card = (lit) => posts.map((p, i) => <Card key={i} x={p.x} y={p.y} s={p.s} rot={p.rot} flip={p.flip} lit={lit} />);
  const J = (n) => k.J(n);
  return (
    <g transform={cam(cx, cy, z)}>
      <defs>
        <radialGradient id="rsPool"><stop offset="0.3" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <radialGradient id="rsHalo"><stop offset="0" stopColor={LIGHT} stopOpacity="0.55" /><stop offset="0.3" stopColor={LIGHT} stopOpacity="0.16" /><stop offset="1" stopColor={LIGHT} stopOpacity="0" /></radialGradient>
        <linearGradient id="rsCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={LIGHT} stopOpacity="0.1" /><stop offset="1" stopColor={LIGHT} stopOpacity="0.03" /></linearGradient>
        <mask id={`rsLit${k.uid}`} maskUnits="userSpaceOnUse" x="-1400" y="-800" width="4800" height="2400">
          <g opacity={breathe}>
            {S.lamps.map((lx, i) => (
              <g key={i}>
                <ellipse cx={lx} cy="560" rx="300" ry="420" fill="url(#rsPool)" />
                <ellipse cx={lx} cy="935" rx="330" ry="80" fill="url(#rsPool)" />
                <circle cx={lx} cy={LAMP_Y} r="150" fill="url(#rsPool)" />
              </g>
            ))}
          </g>
        </mask>
        <mask id={`rsAir${k.uid}`} maskUnits="userSpaceOnUse" x="-1400" y="-800" width="4800" height="2400">
          {S.lamps.map((lx, i) => <path key={i} d={cone(lx)} fill="#fff" />)}
        </mask>
      </defs>
      <Pavement lit={false} S={S} />
      {S.houses.map((hs) => <HouseFront key={hs.j} hs={hs} lit={false} J={J(hs.j + 10)} />)}
      <g mask={`url(#rsLit${k.uid})`}>
        <Pavement lit S={S} />
        {S.houses.map((hs) => <HouseFront key={hs.j} hs={hs} lit J={J(hs.j + 10)} />)}
      </g>
      {neighbours}
      {residents}
      {S.lamps.map((lx, i) => <path key={i} d={cone(lx)} fill="url(#rsCone)" opacity={breathe} />)}
      <g mask={`url(#rsAir${k.uid})`}>{dust(T, x0, x1)}</g>
      {S.lamps.map((lx, i) => <Lamp key={i} x={lx} breathe={breathe} />)}
      <g opacity="0.75">{card(0)}</g>
      <g mask={`url(#rsLit${k.uid})`}>{card(1)}</g>
    </g>
  );
}

function Piece({ guide, boil, boilAmp, camMode }) {
  const { T, CUES } = useComposition();
  const q = { R: CUES.Resistance, Q: CUES.Question, X: CUES.With, O: CUES.Orange, E: CUES.Hold };
  // word timings from timing_4.srt, anchored to the section they fall in
  const w = {
    coping: q.R + 0.44, form: q.R + 1.36, resistance: q.R + 1.96,
    the: q.Q + 0.2, question: q.Q + 0.44, is: q.Q + 0.72,
    swarm: q.Q + 0.96,                                                  // 4.00 s: the swarm comes in
    what: q.X + 0.04, people: q.X + 0.24, have: q.X + 0.64, resist: q.X + 1.28, with: q.X + 1.6,
    settle: q.X + 2.08,                                                 // 6.60 s: the tracking camera starts to slow for orange
  };
  const items = [
    { at: w.coping, until: w.the, text: 'Coping is a form of resistance.' },
    { at: w.the, until: w.what, text: 'The question is,' },
    { at: w.what, until: q.O, text: 'what do people have to resist with?' },
  ];
  const amp = boil ? boilAmp : 0, bf = Math.floor(T * 8);
  const k = { T, q, w, bf, amp, J: jitter(bf, amp), uid: 0 };
  return (
    <div data-screen-label={`Resistance · ${T.toFixed(1)}s`} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: C.bg, transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <rect width={W} height={H} fill={C.bg} />
        <Street k={k} camMode={camMode} />
      </svg>
      {guide && (
        <React.Fragment>
          <div style={{ position: 'absolute', left: 56, top: 40, font: '700 52px "Open Sans", sans-serif', color: '#ffffff', textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}>{camMode === 'track' ? '2 · Track' : '1 · Push'}</div>
          <Captions items={items} style={{ font: '500 40px "Open Sans", sans-serif', bottom: '5%', textShadow: '0 1px 14px rgba(0,0,0,0.8)' }} />
        </React.Fragment>
      )}
    </div>
  );
}

function FUResistance() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { camera: 'push', referenceOverlay: true, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={C.bg}>
        <Piece guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} camMode={t.camera || 'push'} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Camera" />
        <TweakSelect label="Camera" value={t.camera || 'push'} options={[{ value: 'push', label: '1 · Push in on orange' }, { value: 'track', label: '2 · Wider apart, tracking' }]} onChange={(v) => setTweak('camera', v)} />
        <TweakSection label="Preview" />
        <TweakToggle label="Motion editor" value={t.motionEditor ?? true} onChange={(v) => setTweak('motionEditor', v)} />
        <TweakToggle label="Label + narration guide" value={t.referenceOverlay} onChange={(v) => setTweak('referenceOverlay', v)} />
        <TweakToggle label="Line boil (8 fps)" value={t.lineBoil} onChange={(v) => setTweak('lineBoil', v)} />
        <TweakSlider label="Boil amplitude" value={t.boilAmp ?? 0.5} min={0} max={3} step={0.1} unit="px" onChange={(v) => setTweak('boilAmp', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}
window.FUResistance = FUResistance;
