// Feeding Uncertainty — "We find that open engagers…" (22s12f). Round 4: two lamps open it, then the teal lamp carries the rest.
// Opening: teal and orange each stand under a lamp; red posts flutter in the beams like moths. Teal stands straight and picks one now and then;
// orange ducks and dodges as theirs dive. On the voice line orange's lamp clicks off and teal's tightens into a spotlight.
// The lamp is the transition device: whatever is outside its beam is dark, so moving or switching the lamp hides one scene and reveals the next.
//   Variant 1 · Switch: the lamp clicks off and on between scenes. The door is seen from inside: a red lamp outside shines through it onto the curator child.
//   Variant 2 · Swing: the lamp swings to reveal each scene. Its beam finds the door of a house with the curator child behind it; the teal family stays outside.
//     On "This comes from…" the lamp pulls up and out and its beam opens over both: it ends on the teal family outside in the light, the child behind the door.
// People use the Bean rig (rigs/bean-rig.jsx); dust hangs in the air everywhere and shows wherever a beam falls.
const { W, H, OUT_W, OUT_H, MOTION, osc, lerp, lerp2, knock, cam, mix, C, hash, jitter, Card, Ripples, Table, Chair } = window.FU_RIG;
const { BeanFig, POSES, blendPose, rig, PAL } = window.FU_BEAN;   // people are drawn with the Bean rig (rigs/BEAN.md)

const FL = 670;                      // floor of the lamp world
const LAMP_X = 680, CORD = 700;      // the teal lamp hangs over the hero; it swings about a pivot CORD above its shade
const ORA_X = 1430;                  // the curator's lamp, in the opening
const LIGHT = '#e9f5ef';

// light switching: a click off, and a flickering click on
const off = (T, t) => MOTION.hit(T, t, t + 0.08, 0, 1);
const flickOn = (T, t) => MOTION.hit(T, t, t + 0.05, 0, 1) - 0.7 * (MOTION.hit(T, t + 0.09, t + 0.12, 0, 1) - MOTION.hit(T, t + 0.14, t + 0.18, 0, 1));
// a swing settling: a damped wobble that starts at zero
const settle = (T, t, amp, period = 1.7) => (T > t ? amp * Math.exp(-(T - t) * 1.6) * Math.sin(((T - t) * 2 * Math.PI) / period) : 0);

// A lamp on a cable. The cable hangs at angle a from its pivot and bows towards aMid (where it was a moment ago);
// the shade points along rot, which lags the cable and overshoots it a little. The cone runs from the shade's mouth
// to the floor and ends in the lit pool there, so its sides land on the pool's ends.
const SOCKET = 60, MOUTH = 38;
function beamGeom({ sy, wP, a, rot = a, aMid = a, px = LAMP_X }) {
  const ar = (a * Math.PI) / 180, rr = (rot * Math.PI) / 180, am = (aMid * Math.PI) / 180, py = sy - CORD;
  const cap = [px + (CORD - SOCKET) * Math.sin(ar), py + (CORD - SOCKET) * Math.cos(ar)];
  const S = [cap[0] + SOCKET * Math.sin(rr), cap[1] + SOCKET * Math.cos(rr)];
  const mid = [px + ((CORD - SOCKET) / 2) * Math.sin(am), py + ((CORD - SOCKET) / 2) * Math.cos(am)];
  const beta = Math.atan2(wP - MOUTH, FL - sy);
  const perp = [Math.cos(rr), -Math.sin(rr)];
  const edge = (sg) => {
    const E = [S[0] + sg * MOUTH * perp[0], S[1] + sg * MOUTH * perp[1]];
    return [E, E[0] + (FL - E[1]) * Math.tan(clamp(rr + sg * beta, -1.3, 1.3))];
  };
  const [El, xl] = edge(-1), [Er, xr] = edge(1);
  const cx = (xl + xr) / 2, rx = Math.abs(xr - xl) / 2, ry = 0.08 * rx;
  const poly = `M ${El[0]} ${El[1]} L ${Er[0]} ${Er[1]} L ${xr} ${FL} A ${rx} ${ry} 0 0 1 ${xl} ${FL} Z`;
  return { S, P: [px, py], cap, mid, rot, poly, pool: [cx, rx, ry] };
}
// the head of a hanging lamp follows its cable late, and swings a little past it
const headRot = (aAt, T) => aAt(T - 0.1) + 0.6 * (aAt(T - 0.1) - aAt(T - 0.32));
function Lamp({ L, pow = 1, op = 1, id }) {
  const ctrl = [2 * L.mid[0] - (L.P[0] + L.cap[0]) / 2, 2 * L.mid[1] - (L.P[1] + L.cap[1]) / 2];
  return (
    <g opacity={op}>
      <line x1={L.P[0]} y1={L.P[1] - 3000} x2={L.P[0]} y2={L.P[1]} stroke="#4a4a4a" strokeWidth="3" />
      <path d={`M ${L.P[0]} ${L.P[1]} Q ${ctrl[0]} ${ctrl[1]} ${L.cap[0]} ${L.cap[1]}`} fill="none" stroke="#4a4a4a" strokeWidth="3" />
      <g transform={`translate(${L.S[0]} ${L.S[1]}) rotate(${-L.rot})`}>
        <clipPath id={id}><ellipse cx="0" cy="0" rx={MOUTH - 3} ry="6" /></clipPath>
        <rect x="-6" y={-SOCKET} width="12" height="16" rx="3" fill="#3a3a3a" />
        <path d={`M ${-MOUTH} 0 C ${-MOUTH} -28 -22 -46 0 -48 C 22 -46 ${MOUTH} -28 ${MOUTH} 0 Z`} fill="#4d4d4d" />
        <path d={`M ${-MOUTH + 7} -8 C ${-MOUTH + 9} -27 -18 -39 -4 -41`} fill="none" stroke="#636363" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="0" cy="0" rx={MOUTH} ry="7" fill="#262626" />
        <g clipPath={`url(#${id})`}><ellipse cx="0" cy="4" rx="17" ry="8" fill={LIGHT} opacity={0.25 + 0.75 * clamp(pow, 0, 1)} /></g>
      </g>
    </g>
  );
}
// ── Bean helpers. A figure is { x, y, s, dir, c, pose, headScale } ───────────
const UA = 44, FA = 42;                                  // upper arm, forearm
const toWorld = (f, p) => [f.x + (f.dir || 1) * f.s * p[0], f.y + f.s * p[1]];
const headW = (f) => toWorld(f, rig(f.pose, f.headScale || 1).Hc);
const handW = (f) => toWorld(f, rig(f.pose, f.headScale || 1).armN[2]);
// near-arm angles that put the hand on world point P (two-bone IK; the elbow bends the natural way)
function reachArm(f, P) {
  const A = rig(f.pose, f.headScale || 1).armN[0];
  const dx = ((f.dir || 1) * (P[0] - f.x)) / f.s - A[0], dy = (P[1] - f.y) / f.s - A[1];
  const d = clamp(Math.hypot(dx, dy), Math.abs(UA - FA) + 1, UA + FA - 0.5);
  const deg = (r) => (r * 180) / Math.PI;
  const al = deg(Math.acos((UA * UA + d * d - FA * FA) / (2 * UA * d)));
  const ga = deg(Math.acos((UA * UA + FA * FA - d * d) / (2 * UA * FA)));
  return [deg(Math.atan2(dx, dy)) - al - f.pose.lean, 180 - ga];
}
const armTo = (f, P, t) => { if (t <= 0) return; const r = reachArm(f, P); f.pose = { ...f.pose, armN: [lerp(f.pose.armN[0], r[0], t), lerp(f.pose.armN[1], r[1], t)] }; };
// seated: thighs forward, shins down (hip about 55 above the feet)
const SIT = (T, ph = 0) => ({ hx: 0, lean: 4 + 1.5 * osc(T, 3.3, ph), tilt: 2 * osc(T, 4.1, ph), legN: [86, 88], legF: [80, 84], armN: [24, 56], armF: [18, 52], phone: 0 });
// the curator shying away: arms held in close, then a squat with the arms over the head
const guardPose = (T) => { const b = POSES.idle(T + 1.3); return { ...b, lean: b.lean + 4 + 3 * osc(T, 1.9), tilt: 8 + 5 * osc(T, 1.5, 0.2), armN: [40, 88], armF: [30, 92] }; };
const COVER = { hx: 0, lean: 28, tilt: 26, legN: [70, 120], legF: [55, 110], armN: [128, 128], armF: [118, 135], phone: 0 };
const cower = (T, c) => blendPose(guardPose(T), COVER, c);
const KID_HEAD = 1.3;                                    // children: smaller, with a bigger head
function Bean({ f, k, id, op = 1 }) {
  return <BeanFig x={f.x} y={f.y} dir={f.dir || 1} s={f.s} pose={f.pose} c={f.c} T={k.T} boil={k.amp > 0} boilAmp={k.amp} headScale={f.headScale || 1} id={id} op={op} />;
}

// Childhood dinner, side view (the Lamplight table beat, on the Bean rig). A red post sits on the table;
// it is lifted, talked over and passed round. Local frame: floor at y = 0, table from -150 to 150.
function DinnerBean({ k, x = 960, y = 820, s = 1, idb = 30 }) {
  const { T, w } = k;
  const g = (a, b) => MOTION.glide(T, a, b, 0, 1);
  const kid = { x: -215, y: -50, s: 0.7, dir: 1, c: PAL.open, headScale: KID_HEAD, pose: SIT(T, 0.2) };
  const mom = { x: 215, y: 0, s: 1, dir: -1, c: PAL.open, pose: SIT(T, 0.6) };
  const dad = { x: 55, y: 0, s: 1, dir: -1, c: PAL.open, pose: POSES.idle(T + 0.7) };
  const P0 = [0, -132], Pup = [0, -160], Pm = [150, -170], Pk = [-160, -160];
  const a0 = g(w.politics2 - 0.1, w.politics2 + 0.4), a1 = g(w.conversation - 0.3, w.conversation + 0.2);
  const a2 = g(w.around, w.around + 0.6), a3 = g(w.dinner, w.table + 0.3);
  let cp = lerp2(P0, Pup, a0); cp = lerp2(cp, Pm, a1); cp = lerp2(cp, Pk, a2); cp = lerp2(cp, P0, a3);
  const leanIn = 8 * g(w.dinner - 0.2, w.table + 0.2);
  // who is talking: the far arm gestures while they speak
  const talkM = g(w.conversation - 0.2, w.conversation) * (1 - g(w.around + 0.2, w.around + 0.5));
  const talkK = g(w.around + 0.3, w.around + 0.5) * (1 - g(w.dinner - 0.4, w.dinner - 0.1));
  const talkD = g(w.dinner - 0.3, w.dinner) * (1 - g(w.table + 0.4, w.table + 1));
  const gest = (f, t) => { const tk = POSES.talk(T + f.x * 0.01).armN; f.pose = { ...f.pose, armF: [lerp(f.pose.armF[0], tk[0], t), lerp(f.pose.armF[1], tk[1], t)] }; };
  mom.pose = { ...mom.pose, lean: mom.pose.lean + 2 + 0.6 * leanIn, tilt: -4 * g(w.around, w.around + 0.4) };
  kid.pose = { ...kid.pose, lean: kid.pose.lean + leanIn, tilt: -10 - 6 * talkM + 4 * osc(T, 1.7) };
  dad.pose = { ...dad.pose, lean: dad.pose.lean + 4 + 0.5 * leanIn, tilt: 4 + 6 * osc(T, 2.1, 0.3) };
  gest(mom, talkM); gest(kid, talkK); gest(dad, talkD);
  armTo(mom, cp, a1 * (1 - a2));
  armTo(kid, cp, a2 * (1 - a3));
  const hM = headW(mom), hK = headW(kid), hD = headW(dad);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <line x1="-520" y1="0" x2="520" y2="0" stroke={C.line} strokeWidth="4" />
      <Bean f={dad} k={k} id={idb + 1} />
      <Chair x={-215} y={0} h={88} w={56} dir={1} />
      <Chair x={225} y={0} h={50} dir={-1} />
      <Bean f={mom} k={k} id={idb + 2} />
      <Bean f={kid} k={k} id={idb + 3} />
      <Table x0={-150} x1={150} y={0} />
      <Card x={cp[0]} y={cp[1]} s={0.85} rot={-6 + 6 * osc(T, 2.3)} flip={Math.cos(Math.PI * 2 * g(w.around + 0.6, w.dinner))} />
      <Ripples T={T} x={hM[0] - 30} y={hM[1]} dir={-1} t0={w.conversation - 0.1} t1={w.conversation + 0.9} R={150} />
      <Ripples T={T} x={hK[0] + 26} y={hK[1]} dir={1} t0={w.around + 0.4} t1={w.around + 1.1} R={130} />
      <Ripples T={T} x={hD[0] - 30} y={hD[1]} dir={-1} t0={w.dinner - 0.2} t1={w.table + 0.4} R={150} />
    </g>
  );
}

// ── moths: red posts fluttering in a beam. calm = the teal lamp's; otherwise faster and wider ──
function mothAt(T, i, cx, calm) {
  const h = (n) => hash(i * 9.1 + n * 3.7 + (calm ? 0 : 50));
  const sp = calm ? 1 : 1.4, ax = calm ? 100 : 130;
  const x = cx + ax * Math.sin(T * (0.9 + 0.5 * h(1)) * sp + 6.28 * h(2)) + 34 * Math.sin(T * (2.1 + h(3)) * sp + 6.28 * h(4));
  const y = 450 + 75 * Math.sin(T * (0.7 + 0.6 * h(5)) * sp + 6.28 * h(6)) + 28 * Math.cos(T * (2.7 + h(7)) * sp + 6.28 * h(8));
  const flap = 0.25 + 0.75 * Math.abs(Math.cos(T * (9 + 4 * h(9)) + 6.28 * h(10)));
  return { p: [x, y], rot: 28 * Math.sin(T * 1.3 * sp + 6.28 * h(11)), flap };
}
// dust hanging in the air across the whole set; it only shows where a beam falls on it, so it is there in every scene
const dust = (T) => Array.from({ length: 600 }, (_, i) => {
  const h = (n) => hash(i * 7.3 + n * 1.9 + 11);
  const x = -900 + 3600 * h(1) + 14 * osc(T, 4 + 3 * h(2), h(3));
  const y = -250 + 920 * h(4) + 10 * osc(T, 5 + 3 * h(5), h(6)) - T * (2 + 4 * h(7));
  return <circle key={i} cx={x} cy={y} r={1.1 + 1.3 * h(8)} fill={LIGHT} opacity={0.22 + 0.3 * h(9)} />;
});

// now and then one of the curator's moths dives at them
const SWOOPS = [1.1, 2.9, 4.5, 6.2];

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
  const gt = (t, a0, b0) => MOTION.glide(t, a0, b0, 0, 1);
  const aAt = (t) => {
    let v = 2.2 * osc(t, 3.4);
    if (!swing) return v;
    v += -32 * gt(t, q.Tb + 0.4, q.Tb + 1.0) + 32 * gt(t, q.Tb + 1.0, q.Tb + 1.8) + settle(t, q.Tb + 1.8, 5);
    v += 38 * gt(t, q.Tb + 5.45, q.Tb + 6.1) + settle(t, q.Tb + 6.1, 3);
    return lerp(v, 1.2 * osc(t, 3.4), gt(t, q.P + 0.1, q.P + 1.3));
  };
  const a = aAt(T);
  let power;
  if (swing) {
    power = 1;
  } else {
    power = 1 - off(T, q.Tb + 0.55) + flickOn(T, q.Tb + 1.05) * (1 - off(T, q.Tb + 5.78)) + flickOn(T, q.P + 0.2);
  }
  const B = beamGeom({ sy: lerp(sy, -210, mo), wP: lerp(wP * (1 - 0.3 * clamp(Math.abs(a) / 38, 0, 1)), 780, mo), a, rot: headRot(aAt, T), aMid: aAt(T - 0.14), px: lerp(LAMP_X, 1100, mo) });
  const boost = 1 + 0.25 * spotOn + 0.2 * g(w.voice - 0.2, w.voice + 0.4) * (1 - g(w.matters, q.Tb + 0.3));
  // the curator's lamp: on through the opening, clicks off on the voice line
  const oPow = 1 - off(T, q.V + 0.15);
  const oraGone = g(q.Tb - 0.4, q.Tb + 0.2);
  const aOAt = (t) => 2 * osc(t, 2.9, 0.4);
  const BO = beamGeom({ sy: 294, wP: 280, a: aOAt(T), rot: headRot(aOAt, T), aMid: aOAt(T - 0.14), px: ORA_X });

  // which scene is under the lamp
  const swapA = swing ? q.Tb + 0.95 : q.Tb + 0.8;
  const heroVis = 1 - g(swapA - 0.08, swapA + 0.08);
  const dinnerVis = g(swapA - 0.08, swapA + 0.08) * (swing ? 1 : 1 - g(q.P - 0.08, q.P + 0.08));
  const privVis = swing ? 0 : g(q.P - 0.08, q.P + 0.08);

  // ── camera: a slow push-in on teal from the first frame (teal stays nearly put, the world grows round them),
  //    a second push close on "confidence … voice", then back out as the lamp moves on to the dinner table ──
  const A = [680, 560];
  const anchorCam = (Sa, zz) => [[A[0] - (Sa[0] - 960) / zz, A[1] - (Sa[1] - 540) / zz], zz];
  const m1 = g(0, q.V + 0.4), m2 = g(w.confidence - 0.05, w.voice + 0.4);
  let [cp, z] = anchorCam(lerp2(lerp2([547, 672], [660, 600], m1), [960, 590], m2), lerp(lerp(1.1, 1.42, m1), 1.75, m2));
  const cp0 = anchorCam([547, 672], 1.1)[0], camF = [cp, z];
  let m = g(q.Tb + 0.3, q.Tb + 1.7); cp = lerp2(cp, [700, 500], m); z = lerp(z, 1.22, m);
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

  // ── opening: teal stands straight; now and then a post lands on their open hand like a butterfly ──
  const out1 = g(1.15, 1.6) * (1 - g(3.2, 3.7));                  // hand held out…
  const land1 = g(1.45, 2.05) * (1 - g(3.05, 3.6));                // …a post settles on it, rests, flies off again
  const out2 = g(w.treat - 0.6, w.treat - 0.15);
  const land2 = g(w.treat - 0.3, w.politics + 0.25);               // the second one stays
  const idle = POSES.idle(T);
  const me = { x: LAMP_X, y: FL, dir: 1, c: PAL.open, s: 0.8 };
  me.pose = { ...idle, lean: 0.5 * idle.lean, tilt: idle.tilt + 12 * land1 + 14 * g(w.intellectual, w.curiosity) * (1 - g(w.confidence - 0.4, w.confidence)) - 6 * g(w.voice - 0.2, w.voice + 0.3) };
  const hMe = headW(me);
  const palm = lerp2([hMe[0] + 44, hMe[1] + 62], [hMe[0] + 36, hMe[1] + 30], g(w.intellectual - 0.2, w.intellectual + 0.5) * (1 - g(w.confidence - 0.4, w.confidence + 0.2)));
  armTo(me, palm, Math.max(out1, out2));
  const onHand = handW(me);
  const perch = [onHand[0] + 3, onHand[1] - 10];
  const tealMoths = Array.from({ length: 5 }, (_, i) => {
    const mth = mothAt(T, i, LAMP_X, true);
    const land = i === 1 ? land1 : i === 3 ? land2 : 0;
    const p = lerp2(mth.p, perch, land);
    return { p: [p[0], p[1] - 34 * Math.sin(Math.PI * land)], rot: lerp(mth.rot, -4 + 4 * osc(T, 2.1), land), flip: lerp(mth.flap, 0.6 + 0.4 * Math.cos(T * 2.6 + i), land) };
  });

  // ── opening: the curator shies away when one of their posts dives at them ──
  const bumps = SWOOPS.map((t) => MOTION.glide(T, t, t + 0.4, 0, 1) - g(t + 0.6, t + 1.6));
  const crouch = clamp(bumps.reduce((s0, b) => s0 + b, 0), 0, 1);
  const dodge = bumps.reduce((s0, b, k2) => s0 + b * (k2 % 2 ? 22 : -22), 0);
  const oraO = { x: ORA_X + dodge + 6 * osc(T, 2.6), y: FL, dir: -1, c: PAL.cur, s: 0.8, pose: cower(T, crouch) };
  const hOO = headW(oraO);
  const oraMoths = Array.from({ length: 9 }, (_, i) => {
    const mth = mothAt(T, i, ORA_X, false);
    const b = i < SWOOPS.length ? bumps[i] : 0;
    return { p: lerp2(mth.p, [hOO[0] + (i % 2 ? -36 : 36), hOO[1] - 22], b), rot: mth.rot, flip: mth.flap };
  });
  const oraAmb = 0.24 * (1 - oraGone);

  // ── privilege: the teal family under the lamp; the curator in the dark with a phone ──
  const ora = { x: 1480, y: FL, dir: -1, c: PAL.cur, s: 0.8, pose: { ...POSES.phone(T), legN: [86, 88], legF: [80, 84] } };
  const hO = headW(ora);
  const glints = Array.from({ length: 9 }, (_, i) => { const t = (i / 9) * Math.PI * 2 + 0.1 * osc(T, 3, i * 0.1); const r = 150 + 25 * osc(T, 1.1, i * 0.2); return [hO[0] + r * Math.cos(t), hO[1] + 50 + r * 0.8 * Math.sin(t), i * 31]; });

  // ── door, variant 1: inside, a red lamp beyond the door ──────────────────
  const DX = 2640, dw = 120, dh = 250;
  const gapsOn = g(w.not - 0.25, w.not + 0.15) * (1 - g(q.P - 0.35, q.P - 0.05));
  const open = clamp(0.35 * MOTION.hit(T, w.threat, w.threat + 0.5, 0, 1) + 0.15 * MOTION.hit(T, w.door, w.door + 0.3, 0, 1), 0, 1) * (1 - g(q.P - 0.35, q.P - 0.05));
  const kn = (knock(T, w.threat) + knock(T, w.door) + knock(T, w.door + 0.15)) * 6;
  const slabR = DX - dw / 2 + dw * (1 - open);
  const shaft = `M ${slabR} ${FL - dh} L ${DX + dw / 2} ${FL - dh} L ${DX + dw / 2 + 120} ${FL + 240} L ${slabR - 420} ${FL + 240} Z`;
  const flinch = MOTION.hit(T, w.threat, w.threat + 0.25, 0, 1) - 0.5 * g(w.threat + 0.3, w.door) + MOTION.hit(T, w.door, w.door + 0.25, 0, 0.5);
  const kidIn = { x: DX - 160, y: FL, s: 0.56, headScale: KID_HEAD, dir: -1, c: PAL.cur, pose: cower(T, clamp(0.75 + 0.25 * flinch, 0, 1)) };

  // ── door, variant 2: outside, the teal lamp's beam finds the door ────────
  const HX0 = 1320, HX1 = 1900, DXo = 1590;
  const houseVis = g(q.Tb + 5.3, q.D);
  const inLight = g(q.Tb + 5.8, q.D + 0.1);
  const peek = 46 * (1 - g(q.Tb + 5.7, q.D + 0.3)) + 5 * osc(T, 1.7);   // the child rises into the window, then just hovers
  const peekX = 3 * osc(T, 2.3, 0.2);

  // background for the opening: a faint floor receding into the dark, moving slower than the foreground; it fades as the camera closes in
  const bgOn = 1 - g(w.confidence + 0.4, w.voice + 0.5);
  const farCam = (f) => cam(lerp(cp0[0], camF[0][0], f), lerp(cp0[1], camF[0][1], f), Math.pow(camF[1], f));

  const st = 'url(#oeBeam)';
  return (
    <g>
    {bgOn > 0 && (
      <g opacity={bgOn}>
        <defs>
          <linearGradient id="oeFloor" gradientUnits="userSpaceOnUse" x1="0" y1="520" x2="0" y2="760">
            <stop offset="0" stopColor={C.bg} />
            <stop offset="1" stopColor="#151515" />
          </linearGradient>
        </defs>
        <g transform={farCam(0.32)}><rect x="-3000" y="520" width="8000" height="3000" fill="url(#oeFloor)" /></g>
      </g>
    )}
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
      <g opacity={oraAmb}><Bean f={oraO} k={k} id={2} /></g>
      <g opacity={0.7 * (1 - oraGone)}>{oraMoths.map((mt, i) => <Card key={i} x={mt.p[0]} y={mt.p[1]} s={0.6} rot={mt.rot} flip={mt.flip} lit={0} />)}</g>
      <g opacity={0.7 * heroVis}>{tealMoths.map((mt, i) => <Card key={i} x={mt.p[0]} y={mt.p[1]} s={0.6} rot={mt.rot} flip={mt.flip} lit={0} />)}</g>
      <line x1="-2000" y1={FL} x2="4000" y2={FL} stroke={C.line} strokeWidth="3" opacity={0.5 * (1 - bgOn)} />
      {swing && <g opacity={0.2 * houseVis * dinnerVis}><DinnerBean k={k} x={LAMP_X} y={FL} s={0.8} idb={40} /></g>}

      {/* everything the lamp reveals */}
      <g mask={st}>
        {dust(T)}
        <g opacity={1 - oraGone}>
          <Bean f={oraO} k={k} id={3} />
          {oraMoths.map((mt, i) => <Card key={i} x={mt.p[0]} y={mt.p[1]} s={0.6} rot={mt.rot} flip={mt.flip} />)}
        </g>
        <g opacity={heroVis}>
          <Bean f={me} k={k} id={1} />
          {tealMoths.map((mt, i) => <Card key={i} x={mt.p[0]} y={mt.p[1]} s={0.6} rot={mt.rot} flip={mt.flip} />)}
        </g>
        <g opacity={dinnerVis}><DinnerBean k={k} x={LAMP_X} y={FL} s={0.8} idb={30} /></g>
        <g opacity={swing ? houseVis : 0}>
          <rect x={HX0} y={FL - 430} width={HX1 - HX0} height="430" fill="#2a302e" />
          <path d={`M ${HX0 - 40} ${FL - 426} L ${(HX0 + HX1) / 2} ${FL - 640} L ${HX1 + 40} ${FL - 426} Z`} fill="#242927" />
          <rect x={DXo - 65} y={FL - 260} width="130" height="260" fill="#3a403e" />
        </g>
        <g opacity={privVis}>
          <Bean f={{ x: LAMP_X - 135, y: FL, s: 0.68, dir: 1, c: PAL.open, pose: POSES.idle(T + 0.4) }} k={k} id={51} />
          <Bean f={{ x: LAMP_X, y: FL, s: 0.8, dir: 1, c: PAL.open, pose: POSES.idle(T) }} k={k} id={52} />
          <Bean f={{ x: LAMP_X + 120, y: FL, s: 0.56, headScale: KID_HEAD, dir: -1, c: PAL.open, pose: { ...POSES.idle(T + 1.1), tilt: -8 } }} k={k} id={53} />
        </g>
      </g>

      {/* the curator in the dark, by phone light (privilege) */}
      <g opacity={privVis * (swing ? g(q.P + 0.6, q.P + 1.2) : g(q.P + 0.2, q.P + 0.7))}>
        <rect x={ora.x - 26} y={FL - 44} width="52" height="44" fill="#1c1c1c" />
        <g opacity="0.6"><Bean f={ora} k={k} id={60} /></g>
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
          <g opacity="0.3"><Bean f={kidIn} k={k} id={70} /></g>
          <g mask="url(#oeShaft)"><Bean f={kidIn} k={k} id={71} /></g>
        </g>
      )}

      {/* variant 2: the door from outside; inside, the light turns red */}
      {swing && houseVis > 0 && (
        <g>
          <g opacity={0.3 * houseVis}>
            <rect x={HX0} y={FL - 430} width={HX1 - HX0} height="430" fill="#1c1f1e" />
            <rect x={DXo - 65} y={FL - 260} width="130" height="260" fill="#242827" />
          </g>
          <clipPath id="oeWin"><rect x={DXo - 32} y={FL - 236} width="64" height="52" /></clipPath>
          <rect x={DXo - 32} y={FL - 236} width="64" height="52" fill={mix(C.bg, C.red, 0.85 * inLight)} opacity={houseVis} />
          <g clipPath="url(#oeWin)" opacity={houseVis}>
            <circle cx={DXo + 6 + peekX} cy={FL - 196 + peek} r="26" fill={mix(C.cur.head, C.red, 0.35 * inLight)} />
            <circle cx={DXo - 8 + peekX} cy={FL - 200 + peek} r="3.5" fill={C.bg} />
          </g>
          <rect x={DXo - 32} y={FL - 236} width="64" height="52" fill="none" stroke="#151515" strokeWidth="5" opacity={houseVis} />
          <rect x={DXo - 65} y={FL - 5} width="130" height="5" fill={C.hot} opacity={houseVis * inLight * 0.6} />
        </g>
      )}

      {/* the lamps and their light */}
      <g opacity={1 - oraGone}>
        <path d={BO.poly} fill="url(#oeHazeO)" opacity={oPow} />
        <ellipse cx={BO.pool[0]} cy={FL} rx={BO.pool[1]} ry={BO.pool[2]} fill={LIGHT} opacity={0.12 * oPow} />
      </g>
      <Lamp L={BO} pow={oPow} op={1 - oraGone} id="oeLampO" />
      <path d={B.poly} fill="url(#oeHaze)" opacity={clamp(power * boost, 0, 1.5)} />
      <ellipse cx={B.pool[0]} cy={FL} rx={B.pool[1]} ry={B.pool[2]} fill={LIGHT} opacity={0.12 * clamp(power * boost, 0, 1.5)} />
      <Lamp L={B} pow={power} id="oeLampT" />
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
