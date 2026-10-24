// Feeding Uncertainty — "We find that open engagers…" (22s12f). Round 4: two lamps open it, then the teal lamp carries the rest.
// Opening: teal and orange each stand under a lamp; red posts flutter in the beams like moths. Teal stands straight and picks one now and then;
// orange ducks when one of theirs comes at them. At 4 s orange's lamp clicks off and they go still in the dark; on the voice line teal's tightens into a spotlight.
// The lamp is the transition device: whatever is outside its beam is dark, so moving or switching the lamp hides one scene and reveals the next.
//   Variant 1 · Switch: the lamp clicks off and on between scenes. The door is seen from inside: a red lamp outside shines through it onto the curator child.
//   Variant 2 · Swing: the lamp swings to reveal each scene. Its beam finds the door of a house with the curator child behind it; the teal family stays outside.
//     On "This comes from…" the lamp pulls up and out and its beam opens over both: it ends on the teal family outside in the light, the child behind the door.
// Dust hangs in the air everywhere and shows wherever a beam falls.
// The toned look (LOOK.md): the world sits in the open engagers' teal ramp; people are ToneBeans lit by the lamps; sets are
// graded from their own colours into the ramp (lit copies posterized, dark copies smooth); red comes in through the posts.
// Mixed beats: light that belongs to the curator is in their ramp. Their lamp's beam (the dark inside it, its haze, its pool)
// is orange; so is the teal lamp's light once it leaves through the side window onto their house, and the house itself.
const { W, H, OUT_W, OUT_H, MOTION, osc, lerp, lerp2, knock, cam, mix, C, hash, jitter, Ripples, Table, Chair } = window.FU_RIG;
const { POSES, blendPose, rig, frontRig } = window.FU_BEAN;          // people: the Bean rig (rigs/bean-rig.jsx), toned by fu-look
const { RowHouse, TerraceHouse, HOUSE } = window.FU_HOUSE;           // the curator's house and the street (rigs/row-house.jsx)
const { RAMPS, mixRamp, v, LookDefs, ToneFilter, ToneBean, PostValue, POST_KINDS } = window.FU_LOOK;
const RO = RAMPS.open, RC = RAMPS.cur, RR = RAMPS.red;
const NEUTRAL = '#111312';          // the dark outside the light once the street appears (the alley's, untinted)
const RCD = mixRamp(RC, RO, 0.45);   // the curator's side of the street outside the light: their ramp, dimmed toward the teal dark
const HAIR = { me: 'beanie', mom: 'long', dad: 'none', kid: 'beanie', ora: 'none', oraKid: 'long' };   // the hero as a child keeps the beanie

const FL = 670;                      // floor of the lamp world
const CEIL = 140;                    // the ceiling of the teal family's room (it forms from the dinner table on); both lamps hang from this height
const LAMP_X = 680, CORD = 294 - CEIL; // the teal lamp hangs over the hero; it swings about a pivot CORD above its shade
const ORA_X = 1430;                  // the curator's lamp, in the opening

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
// R: the ramp the lamp sits in (cable and shade in its middle tones, the bulb its palest)
function Lamp({ L, pow = 1, op = 1, id, up = 1, R = RO }) {
  const ctrl = [2 * L.mid[0] - (L.P[0] + L.cap[0]) / 2, 2 * L.mid[1] - (L.P[1] + L.cap[1]) / 2];
  return (
    <g opacity={op}>
      <line x1={L.P[0]} y1={L.P[1] - 3000} x2={L.P[0]} y2={L.P[1]} stroke={R[2]} strokeWidth="3" opacity={up} />
      <path d={`M ${L.P[0]} ${L.P[1]} Q ${ctrl[0]} ${ctrl[1]} ${L.cap[0]} ${L.cap[1]}`} fill="none" stroke={R[2]} strokeWidth="3" />
      <g transform={`translate(${L.S[0]} ${L.S[1]}) rotate(${-L.rot})`}>
        <clipPath id={id}><ellipse cx="0" cy="0" rx={MOUTH - 3} ry="6" /></clipPath>
        <rect x="-6" y={-SOCKET} width="12" height="16" rx="3" fill={R[1]} />
        <path d={`M ${-MOUTH} 0 C ${-MOUTH} -28 -22 -46 0 -48 C 22 -46 ${MOUTH} -28 ${MOUTH} 0 Z`} fill={R[2]} />
        <path d={`M ${-MOUTH + 7} -8 C ${-MOUTH + 9} -27 -18 -39 -4 -41`} fill="none" stroke={R[4]} strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="0" cy="0" rx={MOUTH} ry="7" fill={R[0]} />
        <g clipPath={`url(#${id})`}><ellipse cx="0" cy="4" rx="17" ry="8" fill={R[6]} opacity={0.25 + 0.75 * clamp(pow, 0, 1)} /></g>
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
// a toned Bean. f.ramp: the person's group; lights: the scene's lights in f's coordinates (none = in the dark); amb: unlit value
function Bean({ f, k, id, op = 1, lights = [], amb = 0.34 }) {
  if (op <= 0.003) return null;
  return <ToneBean x={f.x} y={f.y} dir={f.dir ?? 1} s={f.s} pose={f.pose} ramp={f.ramp} hair={f.hair || 'none'} lights={lights} amb={amb} phone={f.phone || 0}
    headScale={f.headScale || 1} op={op} id={id} bf={k.bf} amp={k.amp} />;
}
// lights from world space into a group drawn at translate(x, y) scale(s)
const lightsIn = (Ls, x, y, s) => Ls.map((L) => ({ ...L, x: (L.x - x) / s, y: (L.y - y) / s, reach: L.reach / s }));
// a red post (crisis content), lit or (in the dark) as an outline; drawn inside the red grade
const post = (mt, i, kind0, s, outline, key) => <PostValue key={key || i} x={mt.p[0]} y={mt.p[1]} s={s} rot={mt.rot} flip={mt.flip} outline={outline} kind={POST_KINDS[(i + kind0) % POST_KINDS.length]} />;
// a grade from a set's own colours into a ramp: luminance × gain onto the ramp, posterized (lit) or smooth (dark),
// with an optional depth-of-field blur. The region is the element's own box, so it works inside the camera transform.
function Grade({ id, R, poster = false, gain = 1, blur = 0 }) {
  const ch = (i) => R.map((c) => (parseInt(c.slice(1 + 2 * i, 3 + 2 * i), 16) / 255).toFixed(4)).join(' ');
  const row = `${(0.2126 * gain).toFixed(4)} ${(0.7152 * gain).toFixed(4)} ${(0.0722 * gain).toFixed(4)} 0 0`;
  const m = blur > 0 ? '-30%' : '-4%', n = blur > 0 ? '160%' : '108%';
  return (
    <filter id={id} x={m} y={m} width={n} height={n} colorInterpolationFilters="sRGB">
      {blur > 0 && <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="b0" />}
      <feColorMatrix in={blur > 0 ? 'b0' : 'SourceGraphic'} type="matrix" values={`${row}  ${row}  ${row}  0 0 0 1 0`} result="l" />
      <feComponentTransfer in="l">{['R', 'G', 'B'].map((c, i) => React.createElement('feFunc' + c, { key: c, type: poster ? 'discrete' : 'table', tableValues: ch(i) }))}</feComponentTransfer>
      {poster && <feGaussianBlur stdDeviation="0.45" />}
    </filter>
  );
}
// the grades this shot uses, for each ramp: lit and dark sets, the blurred back walls, the street, value-authored props
function ShotGrades({ ramps }) {
  return (
    <defs>
      {Object.entries(ramps).map(([key, R]) => (
        <React.Fragment key={key}>
          <Grade id={`oeLit-${key}`} R={R} poster gain={2.6} />
          <Grade id={`oeBackLit-${key}`} R={R} gain={1.6} blur={3} />
          <Grade id={`oeDark-${key}`} R={R} gain={0.95} />
          <Grade id={`oeBackDark-${key}`} R={R} gain={0.95} blur={3} />
          <Grade id={`oeStreet-${key}`} R={R} gain={0.85} blur={2} />
          <Grade id={`oeStreetFar-${key}`} R={R} gain={0.75} blur={6} />
          <Grade id={`oeProp-${key}`} R={R} poster />
        </React.Fragment>
      ))}
    </defs>
  );
}

// Childhood dinner, side view (the Lamplight table beat, on the Bean rig). A red post sits on the table;
// it is lifted, talked over and passed round. Local frame: floor at y = 0, table from -150 to 150.
// lights: the lamp in world space ([] in the dark); props are drawn straight in the ramp's tones.
function DinnerBean({ k, x = 960, y = 820, s = 1, idb = 30, lights = [] }) {
  const { T, w } = k;
  const g = (a, b) => MOTION.glide(T, a, b, 0, 1);
  const L = lightsIn(lights, x, y, s);
  const kid = { x: -215, y: -50, s: 0.7, dir: 1, ramp: 'open', hair: HAIR.kid, headScale: KID_HEAD, pose: SIT(T, 0.2) };
  const mom = { x: 215, y: 0, s: 1, dir: -1, ramp: 'open', hair: HAIR.mom, pose: SIT(T, 0.6) };
  // the standing parent faces the mother and holds the post; on "conversation" they hand it to her
  // once the mother has it, on "around" they turn round (a quick flip through edge-on) to look at their son
  const turnD = g(w.around - 0.05, w.around + 0.3);
  const dad = { x: 55, y: 0, s: 1, dir: Math.cos(Math.PI * turnD), ramp: 'open', hair: HAIR.dad, pose: POSES.idle(T + 0.7) };
  const P0 = [0, -132], Pd = [96 + 3 * osc(T, 2.6), -150 + 3 * osc(T, 1.9, 0.3)], Pup = [102, -172], Pm = [140, -168], Pk = [-160, -160];
  const a0 = g(w.politics2 - 0.1, w.politics2 + 0.4), a1 = g(w.conversation - 0.3, w.conversation + 0.2);
  const a2 = g(w.around, w.around + 0.6), a3 = g(w.dinner, w.table + 0.3);
  let cp = lerp2(Pd, Pup, a0); cp = lerp2(cp, Pm, a1); cp = lerp2(cp, Pk, a2); cp = lerp2(cp, P0, a3);
  const holdD = 1 - g(w.conversation + 0.15, w.conversation + 0.55), holdM = g(w.conversation - 0.45, w.conversation - 0.05) * (1 - a2);
  const leanIn = 8 * g(w.dinner - 0.2, w.table + 0.2);
  // who is talking: the far arm gestures while they speak
  const talkM = g(w.conversation - 0.2, w.conversation) * (1 - g(w.around + 0.2, w.around + 0.5));
  const talkK = g(w.around + 0.3, w.around + 0.5) * (1 - g(w.dinner - 0.4, w.dinner - 0.1));
  const talkD = g(w.dinner - 0.3, w.dinner) * (1 - g(w.table + 0.4, w.table + 1));
  const gest = (f, t) => { const tk = POSES.talk(T + f.x * 0.01).armN; f.pose = { ...f.pose, armF: [lerp(f.pose.armF[0], tk[0], t), lerp(f.pose.armF[1], tk[1], t)] }; };
  mom.pose = { ...mom.pose, lean: mom.pose.lean + 2 + 0.6 * leanIn, tilt: -4 * g(w.around, w.around + 0.4) };
  kid.pose = { ...kid.pose, lean: kid.pose.lean + leanIn, tilt: -10 - 6 * talkM + 4 * osc(T, 1.7) };
  dad.pose = { ...dad.pose, lean: dad.pose.lean + 4 + 0.5 * leanIn, tilt: 4 + 6 * osc(T, 2.1, 0.3) + 10 * turnD };
  gest(mom, talkM); gest(kid, talkK); gest(dad, talkD);
  armTo(dad, cp, holdD);
  armTo(mom, cp, holdM);
  armTo(kid, cp, a2 * (1 - a3));
  const hM = headW(mom), hK = headW(kid), hD = headW(dad);   // by "dinner" dad faces the son again: his speech leaves toward him
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <line x1="-520" y1="0" x2="520" y2="0" stroke={RO[2]} strokeWidth="4" />
      <Bean f={dad} k={k} id={idb + 1} lights={L} />
      <Chair x={-215} y={0} h={88} w={56} dir={1} col={RO[2]} />
      <Chair x={225} y={0} h={50} dir={-1} col={RO[2]} />
      <Bean f={mom} k={k} id={idb + 2} lights={L} />
      <Bean f={kid} k={k} id={idb + 3} lights={L} />
      <Table x0={-150} x1={150} y={0} col={RO[3]} />
      <g filter="url(#oeProp-red)"><PostValue x={cp[0]} y={cp[1]} s={0.85} rot={-6 + 6 * osc(T, 2.3)} flip={Math.cos(Math.PI * 2 * g(w.around + 0.6, w.dinner))} kind="headline" /></g>
      <Ripples T={T} x={hM[0] - 30} y={hM[1]} dir={-1} t0={w.conversation - 0.1} t1={w.conversation + 0.9} R={150} col={RO[6]} />
      <Ripples T={T} x={hK[0] + 26} y={hK[1]} dir={1} t0={w.around + 0.4} t1={w.around + 1.1} R={130} col={RO[6]} />
      <Ripples T={T} x={hD[0] - 30} y={hD[1]} dir={-1} t0={w.dinner - 0.2} t1={w.table + 0.4} R={150} col={RO[6]} />
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
  return <circle key={i} cx={x} cy={y} r={1.1 + 1.3 * h(8)} fill={RO[6]} opacity={0.22 + 0.3 * h(9)} />;
});

// ── the set (variant 2). From the dinner table on, a room forms round the family; at 16.5 s it turns out to be the ground floor
//    of a house drawn in section (front cut away), in a street of terrace houses like the Vulnerability alley, only dimmer. ──
const SEC = { x0: 250, x1: 1130, t: 30, upper: -230, apex: -440, win: [250, 600] };   // the room's inside edges, wall thickness, upper floor, roof apex, side window
const SETC = { wall: '#1e2322', upper: '#161a19', cut: '#343a38', skirt: '#272c2b', glass: '#121a20', frame: '#3a403e', board: '#1a1d1c', pic: '#3a3330', picIn: '#262b2a' };
// the room: back wall with a night window, a picture, skirting, floorboards, ceiling (op), then the section of the house round it (sec).
// part: 'back' (the walls behind the family, graded out of focus) or 'cut' (the section's cut walls, floors and roof, sharp)
function HouseSection({ dark = 0, op = 1, sec = 1, ceil = 1, part }) {
  const c = (col) => mix(col, C.bg, dark), { x0, x1, t, upper, apex, win } = SEC;
  const brickId = 'oeSecBrick' + Math.round(dark * 100);
  const mid = (x0 + x1) / 2;
  const back = part !== 'cut' && part !== 'ext', cut = part !== 'back', ext = !part || part === 'ext';
  return (
    <g>
      {ext && <g opacity={sec}>
        {/* upstairs the house is not cut away: its brick front with two windows, and a small window in the gable */}
        {cut && (
          <g>
            <defs>
              <pattern id={brickId} patternUnits="userSpaceOnUse" width="42" height="28">
                <rect width="42" height="28" fill={c(HOUSE.brick)} />
                <path d="M 0 1 H 42 M 0 15 H 42 M 1 0 V 14 M 22 14 V 28" stroke={c(HOUSE.mortar)} strokeWidth="2" />
              </pattern>
            </defs>
            <path d={`M ${x0} ${CEIL - t} L ${x0} ${upper} L ${x0 - t - 30} ${upper + 6} L ${mid} ${apex} L ${x1 + t + 30} ${upper + 6} L ${x1} ${upper} L ${x1} ${CEIL - t} Z`} fill={`url(#${brickId})`} />
            <rect x={x0} y={upper - 8} width={x1 - x0} height="16" fill={c(HOUSE.cornice)} />
            {[[x0 + (x1 - x0) * 0.28, upper + 70, 120, 160], [x0 + (x1 - x0) * 0.72, upper + 70, 120, 160], [mid, upper - 150, 68, 86]].map(([wx, wy, ww, wh], i) => (
              <g key={i}>
                <rect x={wx - ww / 2} y={wy} width={ww} height={wh} fill={c(HOUSE.glass)} stroke={c(HOUSE.frame)} strokeWidth="5" />
                {i < 2 && <line x1={wx - ww / 2} y1={wy + wh * 0.38} x2={wx + ww / 2} y2={wy + wh * 0.38} stroke={c(HOUSE.frame)} strokeWidth="4" />}
                <line x1={wx} y1={wy} x2={wx} y2={wy + wh} stroke={c(HOUSE.frame)} strokeWidth="4" />
                <rect x={wx - ww / 2 - 6} y={wy + wh} width={ww + 12} height="7" fill={c(mix(HOUSE.frame, C.bg, 0.4))} />
              </g>
            ))}
          </g>
        )}
        {cut && <rect x={x0 - t} y={upper - 20} width={t} height={CEIL - upper + 20} fill={c(SETC.cut)} />}
        {cut && <rect x={x1} y={upper - 20} width={t} height={CEIL - upper + 20} fill={c(SETC.cut)} />}
        {cut && <path d={`M ${x0 - t - 30} ${upper + 6} L ${mid} ${apex} L ${x1 + t + 30} ${upper + 6}`} fill="none" stroke={c(SETC.cut)} strokeWidth="30" strokeLinejoin="miter" />}
      </g>}
      <g opacity={op}>
        {back && (
          <g>
            <rect x={x0} y={CEIL} width={x1 - x0} height={FL - CEIL} fill={c(SETC.wall)} />
            <rect x="330" y="300" width="130" height="200" fill={c(SETC.glass)} stroke={c(SETC.frame)} strokeWidth="6" />
            <line x1="395" y1="300" x2="395" y2="500" stroke={c(SETC.frame)} strokeWidth="5" />
            <line x1="330" y1="376" x2="460" y2="376" stroke={c(SETC.frame)} strokeWidth="5" />
            <rect x="324" y="500" width="142" height="9" fill={c(SETC.frame)} />
            <rect x="935" y="330" width="105" height="80" fill={c(SETC.picIn)} stroke={c(SETC.pic)} strokeWidth="8" />
            <rect x={x0} y={FL - 16} width={x1 - x0} height="16" fill={c(SETC.skirt)} />
          </g>
        )}
        {cut && (
          <g>
            <g mask="url(#oeBoardFade)">
              <rect x={x0 - t} y={FL} width={x1 - x0 + 2 * t} height="56" fill={c(SETC.board)} />
              {[14, 30, 48].map((dy) => <line key={dy} x1={x0 - t} x2={x1 + t} y1={FL + dy} y2={FL + dy} stroke={c(SETC.wall)} strokeWidth="2" />)}
            </g>
            <rect x={x0 - t} y={CEIL - t} width={t} height={FL - CEIL + t} fill={c(SETC.cut)} />
            <rect x={x1} y={CEIL - t} width={t} height={win[0] - CEIL + t} fill={c(SETC.cut)} />
            <rect x={x1} y={win[1]} width={t} height={FL - win[1]} fill={c(SETC.cut)} />
            {[8, 22].map((dx) => <line key={dx} x1={x1 + dx} x2={x1 + dx} y1={win[0]} y2={win[1]} stroke={c(SETC.frame)} strokeWidth="2" />)}
          </g>
        )}
      </g>
      {cut && (
        <g opacity={ceil}>
          <rect x={x0 - t} y={CEIL - t} width={x1 - x0 + 2 * t} height={t} fill={c(SETC.cut)} />
          <ellipse cx={LAMP_X} cy={CEIL} rx="16" ry="5" fill={c(SETC.frame)} />
        </g>
      )}
    </g>
  );
}
// the street round it: neighbours either side, the next street's rooftops behind, a pavement and kerb. Only ever dim.
const STREET_L = [{ w: 380, floors: 2, roof: 'gable', door: 'left', brick: '#33282a' }, { w: 400, floors: 3, roof: 'flat', door: 'right', brick: '#2f2a28' }];
const STREET_R = [{ w: 400, floors: 2, roof: 'pitched', door: 'left', brick: '#352a27' }, { w: 380, floors: 3, roof: 'step', door: 'right', brick: '#3a2e2a' }, { w: 420, floors: 2, roof: 'flat', door: 'left' }];
const STREET_B = Array.from({ length: 9 }, (_, i) => { const h = (n) => hash(i * 3.3 + n * 1.7 + 17); return { w: 380 + 80 * h(1), floors: 3, roof: ['flat', 'pitched', 'gable', 'step'][Math.floor(h(2) * 4)], door: 'left', brick: '#2e2624' }; });
// faint clouds in the night sky behind the next street, drifting slowly right
const DARK = 0.8;   // how far the street's unlit copy fades toward the background, as in the Vulnerability alley
const CLOUDS = Array.from({ length: 7 }, (_, i) => { const h = (n) => hash(i * 5.3 + n * 2.1 + 31); return { x: -1100 + 620 * i + 200 * h(1), y: -400 + 120 * h(2), w: 380 + 260 * h(3), sp: 6 + 6 * h(4), k: h(5) }; });
function Clouds({ T }) {
  return (
    <g filter="url(#oeCloud)" opacity="0.55">
      {CLOUDS.map((c, i) => {
        const x = c.x + c.sp * T;
        return (
          <g key={i} fill={i % 2 ? '#262a29' : '#202423'}>
            <ellipse cx={x} cy={c.y} rx={c.w / 2} ry={c.w * 0.11} />
            <ellipse cx={x - c.w * (0.12 + 0.1 * c.k)} cy={c.y - c.w * 0.07} rx={c.w * 0.22} ry={c.w * 0.1} />
            <ellipse cx={x + c.w * 0.14} cy={c.y - c.w * 0.05} rx={c.w * 0.2} ry={c.w * 0.08} />
          </g>
        );
      })}
    </g>
  );
}
// Outside the light the street has no ramp tint: it is the Vulnerability alley's muted brick, faded toward the dark (DARK).
// Inside the beam it is graded into the ramp (rk). sky: draw the clouds (the dark copy only).
// lit: the copy inside the lamp's beam (graded into the ramp); otherwise the dark copy in the alley's muted brick
function Street({ op, curRight, rk = 'open', T, sky = false, lit = false }) {
  if (op <= 0) return null;
  let xl = SEC.x0 - SEC.t, xr = curRight, xb = -900;
  return (
    <g opacity={op}>
      {sky && <Clouds T={T} />}
      <g filter={lit ? `url(#oeStreetFar-${rk})` : undefined}>{STREET_B.map((h, i) => { const x = xb; xb += h.w * 0.55 + 4; return <g key={'b' + i} transform={`translate(${x} 300) scale(0.55)`}><TerraceHouse x={0} y={0} spec={h} dark={0.86} pid={`oeSb${i}`} /></g>; })}</g>
      <g filter={lit ? `url(#oeDark-${rk})` : undefined}>
        <rect x="-2000" y={FL} width="6000" height="40" fill={lit ? '#141615' : mix('#1f2321', C.bg, 0.5)} />
        <line x1="-2000" x2="4000" y1={FL + 40} y2={FL + 40} stroke={lit ? '#202322' : mix('#2c3130', C.bg, 0.5)} strokeWidth="4" />
      </g>
      <g filter={lit ? `url(#oeStreet-${rk})` : undefined}>
        {STREET_L.map((h, i) => { xl -= h.w; return <TerraceHouse key={'l' + i} x={xl} y={FL} spec={h} dark={lit ? 0.72 : DARK} pid={`oeSl${i}`} />; })}
      </g>
      <g filter={lit ? 'url(#oeStreet-cur)' : undefined}>
        {STREET_R.map((h, i) => { const x = xr; xr += h.w; return <TerraceHouse key={'r' + i} x={x} y={FL} spec={h} dark={lit ? 0.72 : DARK} pid={`oeSr${i}`} />; })}
      </g>
    </g>
  );
}
// now and then one of the curator's moths dives at them
// Each dive: the post drifts closer (lead), the curator looks up at it, it darts at their head at t and they duck.
// Depth and recovery differ, so no two ducks look alike. side: which way they dodge.
const SWOOPS = [
  { t: 0.95, lead: 0.7, depth: 0.45, rec: 0.7, side: -1 },   // a small flinch
  { t: 2.2, lead: 1.0, depth: 1.0, rec: 1.15, side: 1 },     // a full duck, slow to come back up
  { t: 3.35, lead: 0.55, depth: 0.7, rec: 0.6, side: -1 },   // quicker, half-expected
];
const ORA_OFF = 4.0;                                          // the curator's lamp clicks off; after that they stay still in the dark
const quietPose = (T) => ({ hx: 3 * osc(T, 4.7), lean: 3 + osc(T, 5.3), tilt: 6 * osc(T, 3.8) + 4 * osc(T, 2.3, 0.3),
  legN: [3, 4], legF: [-3, 3], armN: [36, 84], armF: [28, 88], phone: 0 });

function Shot({ k, variant }) {
  const { T, q, w, J, bf, amp } = k;
  const g = (a, b) => MOTION.glide(T, a, b, 0, 1);
  const swing = variant === 2;

  // ── lamps ─────────────────────────────────────────────────────────────────
  const rise = swing ? 0 : g(w.position - 0.3, w.position + 0.7);  // privilege (variant 1): the lamp hangs higher, its pool grows
  const mo = swing ? g(q.P + 0.1, q.P + 1.3) : 0;                     // privilege (variant 2): the lamp swings home over the family, its pool opening a little
  const spotOn = g(q.V + 0.2, w.confidence) * (1 - g(w.matters, q.Tb + 0.3));  // voice: teal's light tightens into a spotlight
  const sy = 294 - 260 * rise;
  const wP = 304 - 60 * spotOn + 250 * rise;
  const gt = (t, a0, b0) => MOTION.glide(t, a0, b0, 0, 1);
  const aAt = (t) => {
    let v = 2.2 * osc(t, 3.4);
    if (!swing) return v;
    v += -50 * gt(t, q.Tb + 0.4, q.Tb + 1.0) + 50 * gt(t, q.Tb + 1.0, q.Tb + 1.8) + settle(t, q.Tb + 1.8, 6);
    v += 55 * gt(t, q.Tb + 5.45, q.Tb + 6.1) + settle(t, q.Tb + 6.1, 4);
    return lerp(v, 6 + 1.5 * osc(t, 3.4), gt(t, q.P + 0.1, q.P + 1.3)) + settle(t, q.P + 1.3, -3);
  };
  const a = aAt(T);
  let power;
  if (swing) {
    power = 1;
  } else {
    power = 1 - off(T, q.Tb + 0.55) + flickOn(T, q.Tb + 1.05) * (1 - off(T, q.Tb + 5.78)) + flickOn(T, q.P + 0.2);
  }
  const B = beamGeom({ sy, wP: lerp(wP * (1 - 0.3 * clamp(-a / 38, 0, 1)), 380, mo), a, rot: headRot(aAt, T), aMid: aAt(T - 0.14) });
  const boost = 1 + 0.25 * spotOn + 0.2 * g(w.voice - 0.2, w.voice + 0.4) * (1 - g(w.matters, q.Tb + 0.3));
  // the curator's lamp: on through the opening, clicks off on the voice line
  const oPow = 1 - off(T, ORA_OFF);
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
  let [cp, z] = anchorCam(lerp2(lerp2([450, 660], [660, 600], m1), [960, 590], m2), lerp(lerp(1.35, 1.55, m1), 1.75, m2));
  const cp0 = anchorCam([450, 660], 1.35)[0], camF = [cp, z];
  let m = g(q.Tb + 0.3, q.Tb + 1.7); cp = lerp2(cp, [700, 500], m); z = lerp(z, 1.22, m);
  z += 0.05 * g(q.Tb + 1.2, q.D);
  const doorV1 = !swing && T >= q.D && T < q.P + 0.05;
  if (swing) {
    m = g(q.Tb + 5.4, q.D + 0.4); cp = lerp2(cp, [1120, 300], m); z = lerp(z, 0.86, m);
    m = g(q.P + 0.1, q.P + 1.6); cp = lerp2(cp, [1060, 260], m); z = lerp(z, 0.76, m) - 0.02 * g(q.P + 1.6, q.E + 0.24);
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
  const me = { x: LAMP_X, y: FL, dir: 1, ramp: 'open', hair: HAIR.me, s: 0.8 };
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
  const duck = SWOOPS.map((sw) => MOTION.glide(T, sw.t + 0.08, sw.t + 0.75, 0, sw.depth) - MOTION.glide(T, sw.t + 0.95, sw.t + 0.95 + 1.5 * sw.rec, 0, sw.depth));
  const watch = SWOOPS.map((sw) => g(sw.t - sw.lead, sw.t - 0.15) * (1 - g(sw.t, sw.t + 0.25)));
  const crouch = clamp(duck.reduce((s0, b) => s0 + b, 0), 0, 1);
  const looking = clamp(watch.reduce((s0, b) => s0 + b, 0), 0, 1);
  const dodge = duck.reduce((s0, b, k2) => s0 + b * 24 * SWOOPS[k2].side, 0);
  const quiet = g(ORA_OFF, ORA_OFF + 0.8);
  let oraPose = cower(T, crouch);
  oraPose = { ...oraPose, tilt: oraPose.tilt - 16 * looking, lean: oraPose.lean - 5 * looking };   // looks up at the post coming closer
  oraPose = blendPose(oraPose, quietPose(T), quiet);
  const oraO = { x: ORA_X + dodge + 6 * osc(T, 2.6) * (1 - quiet), y: FL, dir: -1, ramp: 'cur', hair: HAIR.ora, s: 0.8, pose: oraPose };
  const hOO = headW(oraO);
  const oraMoths = Array.from({ length: 9 }, (_, i) => {
    const mth = mothAt(T, i, ORA_X, false);
    const sw = SWOOPS[i];
    if (!sw) return { p: mth.p, rot: mth.rot, flip: mth.flap };
    const back = g(sw.t + 0.3, sw.t + 1.1);
    const a1 = g(sw.t - sw.lead, sw.t - 0.1) * (1 - back), a2 = MOTION.hit(T, sw.t - 0.1, sw.t + 0.15, 0, 1) * (1 - back);
    const near = [hOO[0] - 75, hOO[1] - 70], close = [hOO[0] + 30 * sw.side, hOO[1] - 20];
    return { p: lerp2(lerp2(mth.p, near, a1), close, a2), rot: mth.rot, flip: mth.flap };
  });
  const oraAmb = (0.24 + 0.08 * quiet) * (1 - oraGone);

  // ── privilege: the teal family under the lamp; the curator in the dark with a phone ──
  const ora = { x: 1480, y: FL, dir: -1, ramp: 'cur', hair: HAIR.ora, phone: 1, s: 0.8, pose: { ...POSES.phone(T), legN: [86, 88], legF: [80, 84] } };
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
  const kidIn = { x: DX - 160, y: FL, s: 0.56, headScale: KID_HEAD, dir: -1, ramp: 'cur', hair: HAIR.oraKid, pose: cower(T, clamp(0.75 + 0.25 * flinch, 0, 1)) };

  // ── door, variant 2: outside, the teal lamp's beam finds the door ────────
  const DXo = SEC.x1 + SEC.t + 147;                               // the curator's house stands right next to the section
  const roomOp = swing ? g(q.Tb + 0.9, q.Tb + 2.0) : 0;          // ~12 s: a room forms round the dinner table
  const secOp = swing ? g(q.Tb + 5.4, q.D + 0.4) : 0;            // ~16.5 s: it is the ground floor of a house, in a street
  const ceilOp = swing ? g(q.Tb + 0.1, q.Tb + 0.45) : 0;         // the ceiling is there before the camera can see that high; the cord stops at it
  // posts fly round the curator's door; they show wherever the lamp's light falls on them
  // at 20 s another swarm flies across the top of the frame, left to right, in the dark (outlines); gone before the hold
  const SWARM_T = q.P + 1.0;
  const swarm = !swing || T < SWARM_T ? [] : Array.from({ length: 26 }, (_, i) => {
    const h = (n) => hash(i * 6.7 + n * 2.9 + 71), u = T - SWARM_T;
    const cx = -700 + 1250 * u, cy = -150 + 50 * Math.sin(u * 1.3);
    const r = Math.sqrt(h(1)), an = 6.28 * h(2) + u * (0.6 + 0.8 * h(3)) * (h(4) > 0.5 ? 1 : -1);
    return { p: [cx + 280 * r * Math.cos(an) + 20 * Math.sin(T * (2 + h(5)) + 6 * h(6)), cy + 120 * r * Math.sin(an) + 14 * Math.cos(T * (2.4 + h(7)) + 6 * h(8))],
      rot: 30 * Math.sin(T * 1.6 + 6 * h(9)), flip: 0.25 + 0.75 * Math.abs(Math.cos(T * (9 + 4 * h(10)) + 6.28 * h(11))) };
  });
  const doorMoths = Array.from({ length: 7 }, (_, i) => { const mt = mothAt(T, 40 + i, DXo + 70, false); return { p: [mt.p[0], mt.p[1] - 30], rot: mt.rot, flip: mt.flap }; });
  // the side wall stops the lamp's light: outside it, only what passes through the window
  const clipOn = swing && roomOp > 0;
  const far = (P) => [B.S[0] + (P[0] - B.S[0]) * 30, B.S[1] + (P[1] - B.S[1]) * 30];
  const wTop = far([SEC.x1, SEC.win[0]]), wSill = far([SEC.x1 + SEC.t, SEC.win[1]]);
  const houseVis = g(q.Tb + 5.3, q.D);
  const inLight = g(q.Tb + 5.8, q.D + 0.1);
  const peek = 46 * (1 - g(q.Tb + 5.7, q.D + 0.3)) + 5 * osc(T, 1.7);   // the child rises into the window, then just hovers
  const peekX = 3 * osc(T, 2.3, 0.2);

  // the lamps light the people: each bulb is a point light, moving and switching with its lamp
  const lampL = { x: B.S[0], y: B.S[1] + 4, i: clamp(0.95 * power * boost, 0, 1), reach: 300 };
  const oraL = { x: BO.S[0], y: BO.S[1] + 4, i: 0.95 * oPow * (1 - oraGone), reach: 300 };
  const LIT = [lampL, oraL].filter((L) => L.i > 0.01);
  // the curator child at the door window (variant 2): a front-view head rising into the glass, toned toward red as the light finds it
  const kidRamp = mixRamp(RC, RR, 0.35 * inLight);
  const kidPose = { lean: 0, tilt: 3 * osc(T, 2.9, 0.4), look: [-0.75, 0.15], armL: null, armR: null };
  const kidHc = frontRig({ ...kidPose, armL: [8, 6], armR: [8, 6] }, 1).Hc;
  const kidLights = [{ x: DXo + 26, y: FL - 250, i: 0.45 + 0.3 * inLight, reach: 70 }, { x: B.S[0], y: B.S[1], i: 0.5 * inLight, reach: 700 }];

  // background: a faint floor receding into the dark, moving slower than the foreground; it stays the same all the way through.
  // inside the curator's beam the dark is their own ramp
  const farCam = (f) => cam(lerp(cp0[0], cp[0], f), lerp(cp0[1], cp[1], f), Math.pow(z, f));
  const ground = (key) => (
    <g transform={farCam(0.32)}>
      <rect x="-3000" y="-3000" width="9000" height="3520" fill={RAMPS[key][0]} />
      <rect x="-3000" y="520" width="9000" height="3000" fill={`url(#oeFloor-${key})`} />
    </g>
  );

  const st = 'url(#oeBeam)';
  const red = 'url(#oeProp-red)';
  return (
    <g>
      <defs>
        {['open', 'cur'].map((key) => (
          <linearGradient key={key} id={`oeFloor-${key}`} gradientUnits="userSpaceOnUse" x1="0" y1="520" x2="0" y2="760">
            <stop offset="0" stopColor={RAMPS[key][0]} />
            <stop offset="1" stopColor={mix(RAMPS[key][0], RAMPS[key][1], 0.55)} />
          </linearGradient>
        ))}
        <mask id="oeBeamO" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="12000" height="12000">
          <g transform={cam(cp[0], cp[1], z)}><path d={BO.poly} fill="#fff" opacity={oPow * (1 - oraGone)} filter="url(#oeSoft)" /></g>
        </mask>
        <ToneFilter id="oeToneKid" ramp={kidRamp} bf={k.bf} amp={k.amp} />
        <ToneFilter id="oeHairKid" ramp={kidRamp} edge={5} grain={0} soft={1.2} bf={k.bf} amp={k.amp} />
      </defs>
      {ground('open')}
      {swing && secOp > 0 && <rect x="0" y="0" width={W} height={H} fill={NEUTRAL} opacity={secOp} />}
      {oPow * (1 - oraGone) > 0 && <g mask="url(#oeBeamO)">{ground('cur')}</g>}
    <g transform={cam(cp[0], cp[1], z)}>
      <defs>
        <filter id="oeSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" /></filter>
        <mask id="oeBeam" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="12000" height="12000">
          <g clipPath={clipOn ? 'url(#oeRoomClip)' : undefined}><path d={B.poly} fill="#fff" opacity={clamp(power, 0, 1)} filter="url(#oeSoft)" /></g>
          <path d={BO.poly} fill="#fff" opacity={oPow * (1 - oraGone)} filter="url(#oeSoft)" />
        </mask>
        <clipPath id="oeRoomClip">
          <rect x="-5000" y="-5000" width={5000 + SEC.x1 + SEC.t} height="12000" />
          <path d={`M ${B.S[0]} ${B.S[1]} L ${wTop[0]} ${wTop[1]} L ${wSill[0]} ${wSill[1]} Z`} />
        </clipPath>
        <mask id="oeShaft" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="12000" height="12000">
          <path d={shaft} fill="#fff" opacity={gapsOn * clamp(open * 4, 0, 1)} filter="url(#oeSoft)" />
        </mask>
        <linearGradient id="oeHaze" gradientUnits="userSpaceOnUse" x1={B.S[0]} y1={B.S[1]} x2={B.pool[0]} y2={FL}>
          <stop offset="0" stopColor={RO[6]} stopOpacity="0.16" />
          <stop offset="1" stopColor={RO[6]} stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="oeHazeO" gradientUnits="userSpaceOnUse" x1={BO.S[0]} y1={BO.S[1]} x2={BO.pool[0]} y2={FL}>
          <stop offset="0" stopColor={RC[5]} stopOpacity="0.2" />
          <stop offset="1" stopColor={RC[5]} stopOpacity="0.07" />
        </linearGradient>
        <linearGradient id="oeHazeW" gradientUnits="userSpaceOnUse" x1={B.S[0]} y1={B.S[1]} x2={B.pool[0]} y2={FL}>
          <stop offset="0" stopColor={RC[5]} stopOpacity="0.2" />
          <stop offset="1" stopColor={RC[5]} stopOpacity="0.07" />
        </linearGradient>
        {/* the outside face of the side wall: past it, the teal lamp's light falls on the curator's house and turns orange */}
        <clipPath id="oeIn"><rect x="-5000" y="-5000" width={5000 + SEC.x1 + SEC.t} height="12000" /></clipPath>
        <clipPath id="oeOut"><rect x={SEC.x1 + SEC.t} y="-5000" width="12000" height="12000" /></clipPath>
        {/* light pools in bands; the bright end sits toward the lamp (the focal point moves with the beam's angle), so the bands
            follow the light's slant instead of standing as plain concentric rings */}
        {[['oePoolT', B.rot], ['oePoolO', BO.rot]].map(([id, rot]) => (
          <radialGradient key={id} id={id} cx="0.5" cy="0.5" r="0.5" fx={clamp(0.5 - 0.42 * Math.sin((rot * Math.PI) / 180), 0.1, 0.9)} fy="0.5">
            <stop offset="0" stopColor={v(0.95)} /><stop offset="0.3" stopColor={v(0.72)} />
            <stop offset="0.62" stopColor={v(0.46)} stopOpacity="0.9" /><stop offset="1" stopColor={v(0.3)} stopOpacity="0" />
          </radialGradient>
        ))}
        <mask id="oeBoardFade" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="12000" height="12000">
          <linearGradient id="oeBoardG" gradientUnits="userSpaceOnUse" x1="0" y1={FL} x2="0" y2={FL + 56}>
            <stop offset="0.3" stopColor="#fff" /><stop offset="1" stopColor="#000" />
          </linearGradient>
          <rect x="-5000" y={FL - 100} width="12000" height="200" fill="url(#oeBoardG)" />
          <rect x="-5000" y="-5000" width="12000" height={5000 + FL - 100} fill="#fff" />
        </mask>
 <linearGradient id="oeFootFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={NEUTRAL} stopOpacity="0" /><stop offset="1" stopColor={NEUTRAL} stopOpacity="0.9" />
        </linearGradient>
        <filter id="oeCloud" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="22" /></filter>
      </defs>

      {/* the street and the house section, dim */}
      {swing && <Street op={secOp} curRight={DXo + 285} T={T} sky />}
      {/* the curator's house outside the light: opaque, so the street behind does not show through it */}
      {swing && houseVis > 0 && <g opacity={houseVis}><RowHouse x={DXo} y={FL} dark={DARK} /></g>}
      {/* out of the light, the curator's side of the street sinks into the ground at its foot */}
      {swing && secOp > 0 && <rect x={DXo - 135} y={FL - 170} width="3000" height="172" fill="url(#oeFootFade)" opacity={secOp} />}
      {swing && ceilOp > 0 && (
        <g>
          <g filter="url(#oeBackDark-open)"><HouseSection dark={0.7} op={roomOp} sec={secOp} ceil={ceilOp} part="back" /></g>
          <g filter="url(#oeDark-open)"><HouseSection dark={0.7} op={roomOp} sec={secOp} ceil={ceilOp} part="cut" /></g>
          <HouseSection dark={DARK} sec={secOp} part="ext" />
        </g>
      )}

      {/* what can still be made out in the dark */}
      {swing && houseVis > 0 && <g opacity={0.6 * houseVis} filter={red}>{doorMoths.map((mt, i) => post(mt, i, 4, 0.55, true))}</g>}
      {swarm.length > 0 && <g opacity="0.9" filter={red}>{swarm.map((mt, i) => post(mt, i, 6, 0.7, true, 'sw' + i))}</g>}
      <Bean f={oraO} k={k} id={2} op={oraAmb} />
      {oraGone < 1 && <g opacity={0.7 * (1 - oraGone)} filter={red}>{oraMoths.map((mt, i) => post(mt, i, 2, 0.6, true))}</g>}
      {heroVis > 0 && <g opacity={0.7 * heroVis} filter={red}>{tealMoths.map((mt, i) => post(mt, i, 0, 0.6, true))}</g>}
      {swing && houseVis * dinnerVis > 0 && <g opacity={0.2 * houseVis * dinnerVis}><DinnerBean k={k} x={LAMP_X} y={FL} s={0.8} idb={40} /></g>}

      {/* everything the lamp reveals */}
      <g mask={st}>
        {clipOn && secOp > 0 && <g clipPath="url(#oeOut)"><Street op={secOp} curRight={DXo + 285} rk="cur" lit /></g>}
        {swing && ceilOp > 0 && (
          <g>
            <g filter="url(#oeBackLit-open)"><HouseSection op={roomOp} sec={secOp} ceil={ceilOp} part="back" /></g>
            <g filter="url(#oeLit-open)"><HouseSection op={roomOp} sec={secOp} ceil={ceilOp} part="cut" /></g>
          </g>
        )}
        {swing && houseVis > 0 && <g opacity={houseVis} filter={`url(#oeLit-cur)`}><RowHouse x={DXo} y={FL} /></g>}
        {/* the light pools on the floor, in bands */}
        {oraGone < 1 && <g opacity={0.85 * oPow * (1 - oraGone)} filter={`url(#oeProp-cur)`}><ellipse cx={BO.pool[0]} cy={FL} rx={BO.pool[1]} ry={BO.pool[2]} fill="url(#oePoolO)" /></g>}
        <g opacity={clamp(0.85 * power * boost, 0, 1)}>
          <g clipPath={clipOn ? 'url(#oeIn)' : undefined}><g filter="url(#oeProp-open)"><ellipse cx={B.pool[0]} cy={FL} rx={B.pool[1]} ry={B.pool[2]} fill="url(#oePoolT)" /></g></g>
          {clipOn && <g clipPath="url(#oeOut)"><g filter="url(#oeProp-cur)"><ellipse cx={B.pool[0]} cy={FL} rx={B.pool[1]} ry={B.pool[2]} fill="url(#oePoolT)" /></g></g>}
        </g>
        {dust(T)}
        {oraGone < 1 && (
          <g opacity={1 - oraGone}>
            <Bean f={oraO} k={k} id={3} lights={LIT} />
            <g filter={red}>{oraMoths.map((mt, i) => post(mt, i, 2, 0.6, false))}</g>
          </g>
        )}
        {heroVis > 0 && (
          <g opacity={heroVis}>
            <Bean f={me} k={k} id={1} lights={LIT} />
            <g filter={red}>{tealMoths.map((mt, i) => post(mt, i, 0, 0.6, false))}</g>
          </g>
        )}
        {dinnerVis > 0 && <g opacity={dinnerVis}><DinnerBean k={k} x={LAMP_X} y={FL} s={0.8} idb={30} lights={LIT} /></g>}
        {swing && houseVis > 0 && <g opacity={houseVis} filter={red}>{doorMoths.map((mt, i) => post(mt, i, 4, 0.55, false, 'dm' + i))}</g>}
        {privVis > 0 && (
          <g opacity={privVis}>
            <Bean f={{ x: LAMP_X - 135, y: FL, s: 0.68, dir: 1, ramp: 'open', hair: HAIR.mom, pose: POSES.idle(T + 0.4) }} k={k} id={51} lights={LIT} />
            <Bean f={{ x: LAMP_X, y: FL, s: 0.8, dir: 1, ramp: 'open', hair: HAIR.me, pose: POSES.idle(T) }} k={k} id={52} lights={LIT} />
            <Bean f={{ x: LAMP_X + 120, y: FL, s: 0.56, headScale: KID_HEAD, dir: -1, ramp: 'open', hair: HAIR.kid, pose: { ...POSES.idle(T + 1.1), tilt: -8 } }} k={k} id={53} lights={LIT} />
          </g>
        )}
      </g>

      {/* the curator in the dark, by phone light (privilege, variant 1) */}
      {privVis > 0 && (
        <g opacity={privVis * (swing ? g(q.P + 0.6, q.P + 1.2) : g(q.P + 0.2, q.P + 0.7))}>
          <rect x={ora.x - 26} y={FL - 44} width="52" height="44" fill={RO[1]} />
          <Bean f={ora} k={k} id={60} op={0.6} />
          <g filter={red}>{glints.map(([x, y, r], i) => <PostValue key={i} x={x} y={y} s={0.55} rot={r} outline kind={POST_KINDS[i % POST_KINDS.length]} />)}</g>
        </g>
      )}

      {/* variant 1: the door from inside */}
      {doorV1 && (
        <g opacity={g(q.D, q.D + 0.3) * (1 - g(q.P - 0.3, q.P))}>
          <rect x={DX - 520} y={FL - 420} width="1040" height="420" fill={RO[1]} opacity="0.5" />
          <line x1={DX - 520} y1={FL} x2={DX + 520} y2={FL} stroke={RO[2]} strokeWidth="3" opacity="0.6" />
          <path d={shaft} fill={RR[5]} opacity={0.16 * gapsOn * clamp(open * 4, 0, 1)} />
          <rect x={DX - dw / 2 - 9} y={FL - dh - 9} width={dw + 18} height={dh + 9} fill="none" stroke={RO[2]} strokeWidth="7" />
          <rect x={slabR} y={FL - dh} width={DX + dw / 2 - slabR} height={dh} fill={RR[5]} opacity={gapsOn} />
          <circle cx={DX + dw / 2 - 16} cy={FL - 150} r="22" fill={RR[6]} opacity={gapsOn * clamp(open * 5, 0, 1)} />
          <rect x={DX - dw / 2 + kn} y={FL - dh} width={slabR - (DX - dw / 2)} height={dh - 6} fill={RO[0]} />
          <rect x={DX - dw / 2} y={FL - 6} width={dw} height="6" fill={RR[5]} opacity={gapsOn} />
          <rect x={slabR - 3 + kn} y={FL - dh} width="3" height={dh} fill={RR[5]} opacity={gapsOn * 0.8} />
          <circle cx={DX + dw / 2 - 26 - dw * open + kn} cy={FL - dh / 2} r="4" fill={RR[5]} opacity={gapsOn} />
          <Bean f={kidIn} k={k} id={70} op={0.3} />
          <g mask="url(#oeShaft)"><Bean f={kidIn} k={k} id={71} lights={[{ x: DX + dw / 2, y: FL - 150, i: 0.9, reach: 260 }]} /></g>
        </g>
      )}

      {/* variant 2: the door from outside; inside, the light turns red */}
      {swing && houseVis > 0 && (
        <g>
          <clipPath id="oeWin"><rect x={DXo - 32} y={FL - 236} width="64" height="52" /></clipPath>
          <rect x={DXo - 32} y={FL - 236} width="64" height="52" fill={mix(RC[0], RR[3], 0.85 * inLight)} opacity={houseVis} />
          <g clipPath="url(#oeWin)" opacity={houseVis}>
            <ToneBean x={DXo + 6 + peekX - kidHc[0]} y={FL - 196 + peek - kidHc[1]} view="front" pose={kidPose} ramp={kidRamp} toneId="oeToneKid" hairId="oeHairKid"
              hair={HAIR.oraKid} lights={kidLights} bf={k.bf} amp={k.amp} id={80} />
          </g>
          <rect x={DXo - 32} y={FL - 236} width="64" height="52" fill="none" stroke={mix(RC[0], C.bg, 0.3)} strokeWidth="5" opacity={houseVis} />
          <rect x={DXo - 65} y={FL - 5} width="130" height="5" fill={RR[4]} opacity={houseVis * inLight * 0.6 * (1 - mo)} />
        </g>
      )}

      {/* the lamps and their light */}
      {oraGone < 1 && <path d={BO.poly} fill="url(#oeHazeO)" opacity={oPow * (1 - oraGone)} />}
      <Lamp L={BO} pow={oPow} op={1 - oraGone} id="oeLampO" R={RC} />
      <g clipPath={clipOn ? 'url(#oeRoomClip)' : undefined}>
        <g clipPath={clipOn ? 'url(#oeIn)' : undefined}><path d={B.poly} fill="url(#oeHaze)" opacity={clamp(power * boost, 0, 1.5)} /></g>
        {clipOn && <g clipPath="url(#oeOut)"><path d={B.poly} fill="url(#oeHazeW)" opacity={clamp(power * boost, 0, 1.5)} /></g>}
      </g>
      {swing && roomOp > 0 && (
        <g opacity={roomOp} fill={mix(SETC.cut, C.bg, 0.7)} filter="url(#oeDark-open)">
          {/* the side wall stops the light; it only gets out through the window */}
          <rect x={SEC.x1} y={CEIL - SEC.t} width={SEC.t} height={SEC.win[0] - CEIL + SEC.t} />
          <rect x={SEC.x1} y={SEC.win[1]} width={SEC.t} height={FL - SEC.win[1]} />
        </g>
      )}
      <Lamp L={B} pow={power} id="oeLampT" up={1 - ceilOp} />
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
    <div data-screen-label={`V${v} · ${T.toFixed(1)}s`} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: RO[0], transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <LookDefs ramps={['open', 'cur']} bf={bf} amp={amp} />
        <ShotGrades ramps={{ open: RO, cur: RC, curDim: RCD, red: RR }} />
        <rect width={W} height={H} fill={RO[0]} />
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
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={RO[0]}>
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
