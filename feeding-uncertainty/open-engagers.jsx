// Feeding Uncertainty — "We find that open engagers…" (22s12f). Round 4: two lamps open it, then the teal lamp carries the rest.
// Opening: teal and orange each stand under a lamp; red posts flutter in the beams like moths. Teal stands straight and picks one now and then;
// orange ducks and dodges as theirs dive. On the voice line orange's lamp clicks off and teal's tightens into a spotlight.
// The lamp is the transition device: whatever is outside its beam is dark, so moving or switching the lamp hides one scene and reveals the next.
//   Variant 1 · Switch: the lamp clicks off and on between scenes. The door is seen from inside: a red lamp outside shines through it onto the curator child.
//   Variant 2 · Swing: the lamp swings to reveal each scene. Its beam finds the door of a house with the curator child behind it; the teal family stays outside.
//     On "This comes from…" the lamp pulls up and out and its beam opens over both: it ends on the teal family outside in the light, the child behind the door.
const { W, H, OUT_W, OUT_H, MOTION, osc, lerp, lerp2, knock, cam, mix, C, hash, jitter, headAt, reachTo, Fig, Card, DinnerSide } = window.FU_RIG;

const FL = 670;                      // floor of the lamp world
const LAMP_X = 680, CORD = 700;      // the teal lamp hangs over the hero; it swings about a pivot CORD above its shade
const ORA_X = 1430;                  // the curator's lamp, in the opening
const LIGHT = '#e9f5ef';

// light switching: a click off, and a flickering click on
const off = (T, t) => MOTION.hit(T, t, t + 0.08, 0, 1);
const flickOn = (T, t) => MOTION.hit(T, t, t + 0.05, 0, 1) - 0.7 * (MOTION.hit(T, t + 0.09, t + 0.12, 0, 1) - MOTION.hit(T, t + 0.14, t + 0.18, 0, 1));
// a swing settling: a damped wobble that starts at zero
const settle = (T, t, amp, period = 1.7) => (T > t ? amp * Math.exp(-(T - t) * 1.6) * Math.sin(((T - t) * 2 * Math.PI) / period) : 0);

// cone of light from the shade, swung by a (degrees) about the pivot; cut off just below the floor
function beamGeom({ sy, wP, a, ts = 30, px = LAMP_X }) {
  const ar = (a * Math.PI) / 180, py = sy - CORD;
  const S = [px + CORD * Math.sin(ar), py + CORD * Math.cos(ar)];
  const beta = Math.atan2(wP - ts, FL - sy);
  const perp = [Math.cos(ar), -Math.sin(ar)];
  const edge = (sg) => {
    const E = [S[0] + sg * ts * perp[0], S[1] + sg * ts * perp[1]];
    const ang = clamp(ar + sg * beta, -1.3, 1.3);
    const t = (FL + 60 - E[1]) / Math.cos(ang);
    return [E, [E[0] + t * Math.sin(ang), FL + 60]];
  };
  const [El, Fl] = edge(-1), [Er, Fr] = edge(1);
  const pool = [(Fl[0] + Fr[0]) / 2, Math.abs(Fr[0] - Fl[0]) / 2];
  return { S, P: [px, py], a, poly: `M ${El[0]} ${El[1]} L ${Er[0]} ${Er[1]} L ${Fr[0]} ${Fr[1]} L ${Fl[0]} ${Fl[1]} Z`, pool };
}

// ── moths: red posts fluttering in a beam. calm = the teal lamp's; otherwise faster and wider ──
function mothAt(T, i, cx, calm) {
  const h = (n) => hash(i * 9.1 + n * 3.7 + (calm ? 0 : 50));
  const sp = calm ? 1 : 1.9, ax = calm ? 100 : 150;
  const x = cx + ax * Math.sin(T * (0.9 + 0.5 * h(1)) * sp + 6.28 * h(2)) + 34 * Math.sin(T * (2.1 + h(3)) * sp + 6.28 * h(4));
  const y = 450 + 75 * Math.sin(T * (0.7 + 0.6 * h(5)) * sp + 6.28 * h(6)) + 28 * Math.cos(T * (2.7 + h(7)) * sp + 6.28 * h(8));
  const flap = 0.25 + 0.75 * Math.abs(Math.cos(T * (9 + 4 * h(9)) + 6.28 * h(10)));
  return { p: [x, y], rot: 28 * Math.sin(T * 1.3 * sp + 6.28 * h(11)), flap };
}
// the curator's moths dive at them, one after another
const SWOOPS = [0.7, 1.55, 2.35, 3.2, 3.95, 4.75, 5.6, 6.35, 7.1];

function Shot({ k, variant }) {
  const { T, q, w, J, bf, amp } = k;
  const g = (a, b) => MOTION.glide(T, a, b, 0, 1);
  const swing = variant === 2;

  // ── lamps ─────────────────────────────────────────────────────────────────
  const rise = swing ? 0 : g(w.position - 0.3, w.position + 0.7);  // privilege (variant 1): the lamp hangs higher, its pool grows
  const mo = swing ? g(q.P + 0.1, q.P + 1.3) : 0;                     // privilege (variant 2): the lamp pulls up and out, its beam opens over house and family
  const spotOn = g(q.V + 0.2, w.confidence) * (1 - g(w.matters, q.Tb + 0.3));  // voice: teal's light tightens into a spotlight
  const sy = 294 - 260 * rise;
  const wP = 304 - 60 * spotOn + 250 * rise;
  let a = 2.2 * osc(T, 3.4);
  let power;
  if (swing) {
    a += -32 * g(q.Tb + 0.4, q.Tb + 1.0) + 32 * g(q.Tb + 1.0, q.Tb + 1.8) + settle(T, q.Tb + 1.8, 5);
    a += 38 * g(q.Tb + 5.45, q.Tb + 6.1) + settle(T, q.Tb + 6.1, 3);
    a = lerp(a, 1.2 * osc(T, 3.4), mo);
    power = 1;
  } else {
    power = 1 - off(T, q.Tb + 0.55) + flickOn(T, q.Tb + 1.05) * (1 - off(T, q.Tb + 5.78)) + flickOn(T, q.P + 0.2);
  }
  const flash = swing ? 0.5 * (MOTION.hit(T, w.threat, w.threat + 0.08, 0, 1) - g(w.threat + 0.08, w.threat + 0.4)) + 0.5 * (MOTION.hit(T, w.door, w.door + 0.08, 0, 1) - g(w.door + 0.08, w.door + 0.4)) : 0;
  const B = beamGeom({ sy: lerp(sy, -210, mo), wP: lerp(wP * (1 - 0.3 * clamp(Math.abs(a) / 38, 0, 1)), 780, mo), a, px: lerp(LAMP_X, 1100, mo) });
  const boost = 1 + 0.25 * spotOn + 0.2 * g(w.voice - 0.2, w.voice + 0.4) * (1 - g(w.matters, q.Tb + 0.3)) + flash;
  // the curator's lamp: on through the opening, clicks off on the voice line
  const oPow = 1 - off(T, q.V + 0.15);
  const oraGone = g(q.Tb - 0.4, q.Tb + 0.2);
  const aO = 2 * osc(T, 2.9, 0.4);
  const BO = beamGeom({ sy: 294, wP: 280, a: aO, px: ORA_X });

  // which scene is under the lamp
  const swapA = swing ? q.Tb + 0.95 : q.Tb + 0.8;
  const heroVis = 1 - g(swapA - 0.08, swapA + 0.08);
  const dinnerVis = g(swapA - 0.08, swapA + 0.08) * (swing ? 1 : 1 - g(q.P - 0.08, q.P + 0.08));
  const privVis = swing ? 0 : g(q.P - 0.08, q.P + 0.08);

  // ── camera: both lamps, then in on teal for the voice line ───────────────
  let cp = [1055, 440], z = 1.1 + 0.05 * g(0, q.V);
  let m = g(q.V, w.voice + 0.2); cp = lerp2(cp, [700, 500], m); z = lerp(z, 1.22, m);
  z += 0.05 * g(q.Tb + 1.2, q.D);
  const doorV1 = !swing && T >= q.D && T < q.P + 0.05;
  if (swing) {
    m = g(q.Tb + 5.4, q.D + 0.2); cp = lerp2(cp, [1480, 470], m); z = lerp(z, 1.15, m);
    m = g(q.P + 0.1, q.P + 1.3); cp = lerp2(cp, [1200, 420], m); z = lerp(z, 0.95, m) - 0.025 * g(q.P + 1.3, q.E + 0.24);
  } else if (doorV1) {
    cp = [2600, 470]; z = 1.2 + 0.06 * g(q.D, q.P);
  } else if (T >= q.P + 0.05) {
    cp = [1000, 430]; z = 0.9 - 0.03 * g(q.P + 1.25, q.E + 0.24);
  }

  // ── opening: teal stands straight and picks a moth now and then ─────────
  const me = { x: LAMP_X, y: FL, dir: 1, c: C.open, s: 0.8, lean: 1.5 * osc(T, 3.1) };
  const hMe = headAt(me);
  const held = lerp2([hMe[0] + 46, hMe[1] + 26], [hMe[0] + 40, hMe[1] + 60], g(w.confidence - 0.4, w.confidence + 0.2));
  const pick1 = g(1.5, 1.85) * (1 - g(3.0, 3.6)), reach1 = g(1.3, 1.6) * (1 - g(3.0, 3.3));
  const pick2 = g(w.treat - 0.25, w.politics), reach2 = g(w.treat - 0.45, w.treat - 0.2);
  const tealMoths = Array.from({ length: 5 }, (_, i) => {
    const mth = mothAt(T, i, LAMP_X, true);
    const hold = i === 1 ? pick1 : i === 3 ? pick2 : 0;
    const look = i === 1 ? Math.cos(Math.PI * 2 * g(2.0, 2.9)) : Math.cos(Math.PI * 2 * g(w.intellectual, w.curiosity + 0.6));
    return { p: lerp2(mth.p, held, hold), rot: lerp(mth.rot, -6, hold), flip: lerp(mth.flap, look, hold) };
  });
  me.hand = lerp2([10, 80], reachTo(me, tealMoths[1].p), reach1);
  me.hand = lerp2(me.hand, reachTo(me, tealMoths[3].p), reach2);
  me.tilt = 12 * pick1 + 14 * g(w.intellectual, w.curiosity) * (1 - g(w.confidence - 0.4, w.confidence)) - 6 * g(w.voice - 0.2, w.voice + 0.3) + 3 * osc(T, 2.2);

  // ── opening: the curator ducks and dodges as moths dive at them ─────────
  const bumps = SWOOPS.map((t) => MOTION.hit(T, t, t + 0.22, 0, 1) - g(t + 0.3, t + 0.95));
  const crouch = clamp(bumps.reduce((s0, b) => s0 + b, 0), 0, 1);
  const dodge = bumps.reduce((s0, b, k2) => s0 + b * (k2 % 2 ? 42 : -42), 0);
  const oraO = { x: ORA_X + dodge + 14 * osc(T, 1.3), y: FL, dir: -1, c: C.cur, s: 0.8, sit: 0.6 * crouch };
  oraO.lean = 26 * crouch + 6 * osc(T, 0.9);
  oraO.tilt = 22 * crouch + 9 * osc(T, 0.7, 0.2);
  oraO.hand = lerp2([30, 18], [-2, -46], crouch);
  oraO.hand2 = lerp2([24, 24], [-14, -42], crouch);
  const hOO = headAt(oraO);
  const oraMoths = Array.from({ length: 9 }, (_, i) => {
    const mth = mothAt(T, i, ORA_X, false);
    const k2 = SWOOPS.findIndex((t, n) => n % 9 === i && T >= t - 0.1 && T < t + 1.0);
    const b = k2 < 0 ? 0 : bumps[k2];
    return { p: lerp2(mth.p, [hOO[0] + (k2 % 2 ? -36 : 36), hOO[1] - 22], b), rot: mth.rot, flip: mth.flap };
  });
  const oraAmb = 0.24 * (1 - oraGone);

  // ── privilege: the teal family under the lamp; the curator in the dark with a phone ──
  const ora = { x: 1480, y: FL, sit: 1, dir: -1, c: C.cur, s: 0.8, lean: 16, tilt: 18, hand: [40, 0], hand2: [34, 6] };
  const hO = headAt(ora);
  const glints = Array.from({ length: 9 }, (_, i) => { const t = (i / 9) * Math.PI * 2 + 0.1 * osc(T, 3, i * 0.1); const r = 150 + 25 * osc(T, 1.1, i * 0.2); return [hO[0] + r * Math.cos(t), hO[1] + 50 + r * 0.8 * Math.sin(t), i * 31]; });

  // ── door, variant 1: inside, a red lamp beyond the door ──────────────────
  const DX = 2640, dw = 120, dh = 250;
  const gapsOn = g(w.not - 0.25, w.not + 0.15) * (1 - g(q.P - 0.35, q.P - 0.05));
  const open = clamp(0.35 * MOTION.hit(T, w.threat, w.threat + 0.5, 0, 1) + 0.15 * MOTION.hit(T, w.door, w.door + 0.3, 0, 1), 0, 1) * (1 - g(q.P - 0.35, q.P - 0.05));
  const kn = (knock(T, w.threat) + knock(T, w.door) + knock(T, w.door + 0.15)) * 6;
  const slabR = DX - dw / 2 + dw * (1 - open);
  const shaft = `M ${slabR} ${FL - dh} L ${DX + dw / 2} ${FL - dh} L ${DX + dw / 2 + 120} ${FL + 240} L ${slabR - 420} ${FL + 240} Z`;
  const flinch = MOTION.hit(T, w.threat, w.threat + 0.25, 0, 1) - 0.5 * g(w.threat + 0.3, w.door) + MOTION.hit(T, w.door, w.door + 0.25, 0, 0.5);
  const kidIn = { x: DX - 160, y: FL, s: 0.8, kid: 1, sit: 1, dir: -1, c: C.cur, lean: 20 + 8 * flinch, tilt: 22 + 6 * flinch, hand: [34, 30], hand2: [30, 34] };

  // ── door, variant 2: outside, the teal lamp's beam finds the door ────────
  const HX0 = 1320, HX1 = 1900, DXo = 1590;
  const houseVis = g(q.Tb + 5.3, q.D);
  const inLight = g(q.Tb + 5.8, q.D + 0.1);
  const duck = MOTION.hit(T, w.threat, w.threat + 0.2, 0, 1) - g(w.threat + 0.3, w.door - 0.05) + MOTION.hit(T, w.door, w.door + 0.2, 0, 1) - g(w.door + 0.4, q.P);
  const kno = (knock(T, w.threat) + knock(T, w.door) + knock(T, w.door + 0.15)) * 5;

  const st = 'url(#oeBeam)';
  return (
    <g transform={cam(cp[0], cp[1], z)}>
      <defs>
        <filter id="oeSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" /></filter>
        <mask id="oeBeam" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="12000" height="12000">
          <path d={B.poly} fill="#fff" opacity={clamp(power, 0, 1)} filter="url(#oeSoft)" />
          <path d={BO.poly} fill="#fff" opacity={oPow * (1 - oraGone)} filter="url(#oeSoft)" />
        </mask>
        <mask id="oeShaft" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="12000" height="12000">
          <path d={shaft} fill="#fff" opacity={gapsOn * clamp(open * 4, 0, 1)} filter="url(#oeSoft)" />
        </mask>
        <linearGradient id="oeHaze" gradientUnits="userSpaceOnUse" x1={B.S[0]} y1={B.S[1]} x2={B.pool[0]} y2={FL}>
          <stop offset="0" stopColor={LIGHT} stopOpacity="0.16" />
          <stop offset="1" stopColor={LIGHT} stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="oeHazeO" gradientUnits="userSpaceOnUse" x1={BO.S[0]} y1={BO.S[1]} x2={BO.pool[0]} y2={FL}>
          <stop offset="0" stopColor={LIGHT} stopOpacity="0.16" />
          <stop offset="1" stopColor={LIGHT} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* what can still be made out in the dark */}
      <g opacity={oraAmb}><Fig {...oraO} j={J(2)} /></g>
      <g opacity={0.7 * (1 - oraGone)}>{oraMoths.map((mt, i) => <Card key={i} x={mt.p[0]} y={mt.p[1]} s={0.6} rot={mt.rot} flip={mt.flip} lit={0} />)}</g>
      <g opacity={0.7 * heroVis}>{tealMoths.map((mt, i) => <Card key={i} x={mt.p[0]} y={mt.p[1]} s={0.6} rot={mt.rot} flip={mt.flip} lit={0} />)}</g>
      <line x1="-2000" y1={FL} x2="4000" y2={FL} stroke={C.line} strokeWidth="3" opacity="0.5" />
      {swing && <g opacity={0.2 * houseVis * dinnerVis}><DinnerSide k={k} x={LAMP_X} y={FL} s={0.8} /></g>}

      {/* everything the lamp reveals */}
      <g mask={st}>
        <g opacity={1 - oraGone}>
          <Fig {...oraO} j={J(2)} />
          {oraMoths.map((mt, i) => <Card key={i} x={mt.p[0]} y={mt.p[1]} s={0.6} rot={mt.rot} flip={mt.flip} />)}
        </g>
        <g opacity={heroVis}>
          <Fig {...me} j={J(1)} />
          {tealMoths.map((mt, i) => <Card key={i} x={mt.p[0]} y={mt.p[1]} s={0.6} rot={mt.rot} flip={mt.flip} />)}
        </g>
        <g opacity={dinnerVis}><DinnerSide k={k} x={LAMP_X} y={FL} s={0.8} /></g>
        <g opacity={swing ? houseVis : 0}>
          <rect x={HX0} y={FL - 430} width={HX1 - HX0} height="430" fill="#2a302e" />
          <path d={`M ${HX0 - 40} ${FL - 426} L ${(HX0 + HX1) / 2} ${FL - 640} L ${HX1 + 40} ${FL - 426} Z`} fill="#242927" />
          <rect x={DXo - 65 + kno} y={FL - 260} width="130" height="260" fill="#3a403e" />
        </g>
        <g opacity={privVis}>
          <Fig x={LAMP_X - 135} y={FL} s={0.68} dir={1} c={C.open} tilt={4 * osc(T, 2.6)} j={J(51)} />
          <Fig x={LAMP_X} y={FL} s={0.8} dir={1} c={C.open} tilt={-4 + 3 * osc(T, 2.2, 0.3)} j={J(52)} />
          <Fig x={LAMP_X + 120} y={FL} s={0.8} kid={1} dir={-1} c={C.open} tilt={-8 + 3 * osc(T, 1.9)} j={J(53)} />
        </g>
      </g>

      {/* the curator in the dark, by phone light (privilege) */}
      <g opacity={privVis * (swing ? g(q.P + 0.6, q.P + 1.2) : g(q.P + 0.2, q.P + 0.7))}>
        <path d={`M ${hO[0] - 30} ${hO[1] + 56} L ${hO[0] - 8} ${hO[1] + 8} L ${hO[0] + 8} ${hO[1] + 11} Z`} fill={LIGHT} opacity="0.14" />
        <g opacity="0.6"><Fig {...ora} j={J(60)} /></g>
        {glints.map(([x, y, r], i) => <Card key={i} x={x} y={y} s={0.55} rot={r} lit={0} />)}
      </g>

      {/* variant 1: the door from inside */}
      {doorV1 && (
        <g opacity={g(q.D, q.D + 0.3) * (1 - g(q.P - 0.3, q.P))}>
          <rect x={DX - 520} y={FL - 420} width="1040" height="420" fill={C.wall} opacity="0.5" />
          <line x1={DX - 520} y1={FL} x2={DX + 520} y2={FL} stroke={C.line} strokeWidth="3" opacity="0.6" />
          <path d={shaft} fill={C.hot} opacity={0.16 * gapsOn * clamp(open * 4, 0, 1)} />
          <rect x={DX - dw / 2 - 9} y={FL - dh - 9} width={dw + 18} height={dh + 9} fill="none" stroke="#2c2c2c" strokeWidth="7" />
          <rect x={slabR} y={FL - dh} width={DX + dw / 2 - slabR} height={dh} fill={C.hot} opacity={gapsOn} />
          <circle cx={DX + dw / 2 - 16} cy={FL - 150} r="22" fill="#ffd9cc" opacity={gapsOn * clamp(open * 5, 0, 1)} />
          <rect x={DX - dw / 2 + kn} y={FL - dh} width={slabR - (DX - dw / 2)} height={dh - 6} fill="#1b1b1b" />
          <rect x={DX - dw / 2} y={FL - 6} width={dw} height="6" fill={C.hot} opacity={gapsOn} />
          <rect x={slabR - 3 + kn} y={FL - dh} width="3" height={dh} fill={C.hot} opacity={gapsOn * 0.8} />
          <circle cx={DX + dw / 2 - 26 - dw * open + kn} cy={FL - dh / 2} r="4" fill={C.hot} opacity={gapsOn} />
          <g opacity="0.3"><Fig {...kidIn} j={J(70)} /></g>
          <g mask="url(#oeShaft)"><Fig {...kidIn} j={J(70)} /></g>
        </g>
      )}

      {/* variant 2: the door from outside; inside, the light turns red */}
      {swing && houseVis > 0 && (
        <g>
          <g opacity={0.3 * houseVis}>
            <rect x={HX0} y={FL - 430} width={HX1 - HX0} height="430" fill="#1c1f1e" />
            <rect x={DXo - 65 + kno} y={FL - 260} width="130" height="260" fill="#242827" />
          </g>
          <clipPath id="oeWin"><rect x={DXo - 32 + kno} y={FL - 236} width="64" height="52" /></clipPath>
          <rect x={DXo - 32 + kno} y={FL - 236} width="64" height="52" fill={mix(C.bg, C.red, 0.85 * inLight)} opacity={houseVis} />
          <g clipPath="url(#oeWin)" opacity={houseVis}>
            <circle cx={DXo + 6} cy={FL - 196 + 46 * clamp(duck, 0, 1)} r="26" fill={mix(C.cur.head, C.red, 0.35 * inLight)} />
            <circle cx={DXo - 8} cy={FL - 200 + 46 * clamp(duck, 0, 1)} r="3.5" fill={C.bg} />
          </g>
          <rect x={DXo - 32 + kno} y={FL - 236} width="64" height="52" fill="none" stroke="#151515" strokeWidth="5" opacity={houseVis} />
          <rect x={DXo - 65} y={FL - 5} width="130" height="5" fill={C.hot} opacity={houseVis * inLight * 0.6} />
        </g>
      )}

      {/* the lamp and its light */}
      <path d={B.poly} fill="url(#oeHaze)" opacity={clamp(power * boost, 0, 1.5)} />
      <ellipse cx={B.pool[0]} cy={FL} rx={B.pool[1]} ry="24" fill={LIGHT} opacity={0.12 * clamp(power * boost, 0, 1.5)} />
      <g opacity={1 - oraGone}>
        <path d={BO.poly} fill="url(#oeHazeO)" opacity={oPow} />
        <ellipse cx={BO.pool[0]} cy={FL} rx={BO.pool[1]} ry="24" fill={LIGHT} opacity={0.12 * oPow} />
        <line x1={BO.P[0]} y1={BO.P[1] - 2000} x2={BO.S[0]} y2={BO.S[1]} stroke="#444" strokeWidth="3" />
        <g transform={`translate(${BO.S[0]} ${BO.S[1]}) rotate(${-aO})`}>
          <path d="M -36 0 L 36 0 L 22 -30 L -22 -30 Z" fill="#555" />
          <ellipse cx="0" cy="1" rx="22" ry="5" fill={LIGHT} opacity={0.3 + 0.7 * oPow} />
        </g>
      </g>
      <g>
        <line x1={B.P[0]} y1={B.P[1] - 2000} x2={B.P[0]} y2={B.P[1]} stroke="#444" strokeWidth="3" />
        <line x1={B.P[0]} y1={B.P[1]} x2={B.S[0]} y2={B.S[1]} stroke="#444" strokeWidth="3" />
        <g transform={`translate(${B.S[0]} ${B.S[1]}) rotate(${-a})`}>
          <path d="M -36 0 L 36 0 L 22 -30 L -22 -30 Z" fill="#555" />
          <ellipse cx="0" cy="1" rx="22" ry="5" fill={LIGHT} opacity={0.3 + 0.7 * clamp(power, 0, 1)} />
        </g>
      </g>
    </g>
  );
}

// ═══ piece ══════════════════════════════════════════════════════════════════
const VARIANTS = { 1: 'Switch · door from inside', 2: 'Swing · door from outside' };
function Piece({ variant, guide, boil, boilAmp }) {
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
  const v = Number(variant) === 2 ? 2 : 1;
  return (
    <div data-screen-label={`V${v} · ${T.toFixed(1)}s`} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: C.bg, transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <rect width={W} height={H} fill={C.bg} />
        <Shot k={k} variant={v} />
      </svg>
      {guide && (
        <React.Fragment>
          <div style={{ position: 'absolute', left: 56, top: 40, display: 'flex', gap: 18, alignItems: 'baseline', font: '700 52px "Open Sans", sans-serif', color: '#ffffff', textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}>
            <span>{v}</span><span style={{ fontWeight: 500 }}>{VARIANTS[v]}</span>
          </div>
          <Captions items={items} style={{ font: '500 40px "Open Sans", sans-serif', bottom: '5%', textShadow: '0 1px 14px rgba(0,0,0,0.8)' }} />
        </React.Fragment>
      )}
    </div>
  );
}

function FUOpenEngagers() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { variant: 1, referenceOverlay: true, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={C.bg}>
        <Piece variant={t.variant} guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Variant" />
        <TweakSelect label="Variant" value={t.variant} options={Object.entries(VARIANTS).map(([v, n]) => ({ value: Number(v), label: `${v} · ${n}` }))} onChange={(v) => setTweak('variant', Number(v))} />
        <TweakSection label="Preview" />
        <TweakToggle label="Label + narration guide" value={t.referenceOverlay} onChange={(v) => setTweak('referenceOverlay', v)} />
        <TweakToggle label="Line boil (8 fps)" value={t.lineBoil} onChange={(v) => setTweak('lineBoil', v)} />
        <TweakSlider label="Boil amplitude" value={t.boilAmp ?? 0.5} min={0} max={3} step={0.1} unit="px" onChange={(v) => setTweak('boilAmp', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

window.FUOpenEngagers = FUOpenEngagers;
