// Feeding Uncertainty — the curator's weight, concept D: the feed reflected in the curator's eye. Round 1.
// Built in two layers, as the user asked: first the curator's point of view (POV) as a shot of its own, then that POV
// mapped into the eye as a reflection (mirrored, bowed by the eye's curve, darkened toward its rim).
// POV beats: the phone in the hands (the curator phone shot's mitt and feed), a glance up to the TV on the wall (the
// news), a notification lights the phone at the bottom of the frame, a glance back down to the phone.
// Perspective: one camera that tilts (pitch). Every set piece sits at an elevation angle e; its screen y is
// 540 - F·tan(e - pitch), so flat walls compress toward the frame's edges as they would through a lens. Focus follows
// the gaze: the room is soft while the eyes are on the phone, the TV sharp and the phone soft while they are on the TV.
// Every frame is a pure function of T. `--set view=pov` (the POV alone) or `view=eye` (default).
const W = 1920, H = 1080, OUT_W = 3840, OUT_H = 2160;
const { MOTION, osc, hash, lerp, knock } = window.FU_RIG;
const { RAMPS, LookDefs, v, mixRamp, PostValue, POST_KINDS, ToneBean } = window.FU_LOOK;
const { SW, SH, track, path2, g01, pop, toWorld, PhoneDefs, Phone, Layers, StatusBar, AppBar, HomeBar, feedLayout, feedCards, Mitt } = window.FU_PHONE;
const { glide } = MOTION;
const RC = RAMPS.cur;

// ── timing (no SRT yet: estimates) ──
const UP = [2.92, 3.44, 3.76];      // glance up: move, overshoot, settle
const DOWN = [6.08, 6.6, 6.92];     // glance back down
const NOTE_T = 5.5;                 // the notification lights the phone
const CUT_T = 4.84;                 // the news cuts from the anchor and the chart to the politician at the podium

// ── the camera: pitch from the phone (down) to the TV ──
const F = 1000, PITCH_PHONE = -0.64, PITCH_TV = 0.0;
const Yp = (e, p) => 540 - F * Math.tan(clamp(e - p, -1.35, 1.35));
const span = (e0, e1, p) => { const a = Yp(e1, p), b = Yp(e0, p); return [a, b - a]; };   // [top y, height] of e0..e1
function lookAt(T) {   // 0 on the phone, 1 on the TV; head moves overshoot a little and settle
  const up = glide(T, UP[0], UP[1], 0, 1.035) + glide(T, UP[1], UP[2], 0, -0.035);
  const dn = glide(T, DOWN[0], DOWN[1], 0, 1.03) + glide(T, DOWN[1], DOWN[2], 0, -0.03);
  return up - dn;
}

// a grade, then a blur: posterized bands that go soft when out of focus (the blur after the map keeps them bands)
function GradeBlur({ id, ramp, poster = true, blur = 0, gain = 1, region = [-400, -700, 2720, 2500] }) {
  const R = Array.isArray(ramp) ? ramp : RAMPS[ramp];
  const ch = (i) => R.map((c) => (parseInt(c.slice(1 + 2 * i, 3 + 2 * i), 16) / 255).toFixed(4)).join(' ');
  const row = `${(0.2126 * gain).toFixed(4)} ${(0.7152 * gain).toFixed(4)} ${(0.0722 * gain).toFixed(4)} 0 0`;
  const type = poster ? 'discrete' : 'table';
  return (
    <filter id={id} filterUnits="userSpaceOnUse" x={region[0]} y={region[1]} width={region[2]} height={region[3]} colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values={`${row} ${row} ${row} 0 0 0 1 0`} />
      <feComponentTransfer><feFuncR type={type} tableValues={ch(0)} /><feFuncG type={type} tableValues={ch(1)} /><feFuncB type={type} tableValues={ch(2)} /></feComponentTransfer>
      {blur > 0.05 && <feGaussianBlur stdDeviation={blur.toFixed(2)} />}
    </filter>
  );
}
const Blur = ({ id, s, region = [-400, -700, 2720, 2500] }) => (
  <filter id={id} filterUnits="userSpaceOnUse" x={region[0]} y={region[1]} width={region[2]} height={region[3]}><feGaussianBlur stdDeviation={s.toFixed(2)} /></filter>
);

// ── the news on the TV, in value for the red grade. Local coords: 0..w × 0..h ──
// People on the TV are beanoids seen from the front (the Bean's round head over the top of its egg, eyes at ±0.34 r),
// lit from the left. First the anchor beside a falling chart, then (after CUT_T) a politician at a podium, with a
// swept-over blond hairdo and a long tie.
function TVBean({ x, y, r, hair, tie, T }) {
  const sy = y + r * 1.02;   // where the shoulders start
  return (
    <g>
      <ellipse cx={x} cy={sy + r * 2.05} rx={r * 1.55} ry={r * 2.1} fill={v(0.2)} />
      <ellipse cx={x - r * 0.3} cy={sy + r * 2.0} rx={r * 1.05} ry={r * 1.85} fill={v(0.27)} />
      {tie && <g>
        <path d={`M ${x - r * 0.42} ${sy + r * 0.05} L ${x + r * 0.42} ${sy + r * 0.05} L ${x} ${sy + r * 0.75} Z`} fill={v(0.62)} />
        <path d={`M ${x - r * 0.12} ${sy + r * 0.12} L ${x + r * 0.12} ${sy + r * 0.12} L ${x + r * 0.22} ${sy + r * 2.6} L ${x} ${sy + r * 2.9} L ${x - r * 0.22} ${sy + r * 2.6} Z`} fill={v(0.8)} />
      </g>}
      <circle cx={x} cy={y} r={r} fill={v(0.24)} />
      <circle cx={x - r * 0.24} cy={y - r * 0.18} r={r * 0.72} fill={v(0.31)} />
      {[-1, 1].map((sd) => <circle key={sd} cx={x + sd * r * 0.34 + r * 0.04 * osc(T, 2.3)} cy={y - r * 0.02} r={r * 0.075} fill={v(0.07)} />)}
      {hair === 'swept' && <g>
        <path d={`M ${x - 1.02 * r} ${y - 0.12 * r} C ${x - 1.12 * r} ${y - 0.92 * r}, ${x - 0.42 * r} ${y - 1.28 * r}, ${x + 0.3 * r} ${y - 1.18 * r} C ${x + 0.92 * r} ${y - 1.1 * r}, ${x + 1.22 * r} ${y - 0.76 * r}, ${x + 1.14 * r} ${y - 0.42 * r} C ${x + 1.02 * r} ${y - 0.6 * r}, ${x + 0.72 * r} ${y - 0.7 * r}, ${x + 0.36 * r} ${y - 0.66 * r} C ${x} ${y - 0.64 * r}, ${x - 0.56 * r} ${y - 0.52 * r}, ${x - 0.84 * r} ${y - 0.06 * r} Z`} fill={v(0.74)} />
        <path d={`M ${x - 0.7 * r} ${y - 0.72 * r} C ${x - 0.3 * r} ${y - 1.02 * r}, ${x + 0.4 * r} ${y - 1.0 * r}, ${x + 0.95 * r} ${y - 0.66 * r} M ${x - 0.85 * r} ${y - 0.42 * r} C ${x - 0.4 * r} ${y - 0.8 * r}, ${x + 0.3 * r} ${y - 0.84 * r}, ${x + 0.8 * r} ${y - 0.6 * r}`} fill="none" stroke={v(0.56)} strokeWidth={r * 0.06} strokeLinecap="round" />
        <path d={`M ${x + 0.98 * r} ${y - 0.2 * r} C ${x + 1.12 * r} ${y - 0.05 * r}, ${x + 1.1 * r} ${y + 0.2 * r}, ${x + 0.98 * r} ${y + 0.28 * r} L ${x + 0.92 * r} ${y - 0.1 * r} Z`} fill={v(0.7)} />
      </g>}
    </g>
  );
}
function TVNews({ w, h, T, kind }) {
  return (
    <g>
      <clipPath id="povTVclip"><rect x="0" y="0" width={w} height={h} /></clipPath>
      <g clipPath="url(#povTVclip)">
        <rect x="0" y="0" width={w} height={h} fill={v(0.36)} />
        <rect x="0" y="0" width={w} height={h * 0.62} fill={v(0.42)} />
        {kind === 'podium' ? (
          <g>
            {[0.14, 0.3, 0.7, 0.86].map((f, i) => <rect key={i} x={w * f - 10} y={h * 0.08} width="20" height={h * 0.5} fill={v(i % 2 ? 0.5 : 0.3)} />)}
            <TVBean x={w * 0.5 + 5 * osc(T, 1.7)} y={h * 0.3 + 3 * osc(T, 0.9)} r={h * 0.1} hair="swept" tie T={T} />
            <path d={`M ${w * 0.5 - h * 0.2} ${h * 0.82} L ${w * 0.5 + h * 0.2} ${h * 0.82} L ${w * 0.5 + h * 0.15} ${h * 0.52} L ${w * 0.5 - h * 0.15} ${h * 0.52} Z`} fill={v(0.62)} />
            <circle cx={w * 0.5} cy={h * 0.62} r={h * 0.04} fill={v(0.9)} />
            <rect x={w * 0.5 - 2} y={h * 0.44} width="4" height={h * 0.09} fill={v(0.15)} />
          </g>
        ) : (
          <g>
            <TVBean x={w * 0.22 + 2 * osc(T, 1.1)} y={h * 0.32} r={h * 0.12} T={T} />
            <rect x={w * 0.48} y={h * 0.1} width={w * 0.44} height={h * 0.46} rx="6" fill={v(0.28)} />
            <path d={`M ${w * 0.52} ${h * 0.2} L ${w * 0.62} ${h * 0.26} L ${w * 0.7} ${h * 0.22} L ${w * 0.78} ${h * 0.4} L ${w * 0.88} ${h * 0.48}`} fill="none" stroke={v(0.95)} strokeWidth={h * 0.025} strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="600" strokeDashoffset={600 * (1 - glide(T, 3.3, 4.6, 0, 1))} />
          </g>
        )}
        <rect x="0" y={h * 0.75} width={w} height={h * 0.13} fill={v(0.9)} />
        <rect x={w * 0.03} y={h * 0.785} width={w * 0.1} height={h * 0.06} fill={v(0.32)} />
        <rect x={w * 0.16} y={h * 0.79} width={w * (kind === 'podium' ? 0.5 : 0.42)} height={h * 0.05} fill={v(0.5)} />
        <rect x="0" y={h * 0.88} width={w} height={h * 0.12} fill={v(0.2)} />
        {/* the ticker runs on continuously (it used to wrap with a jump every 180 px) */}
        {Array.from({ length: 7 }, (_, i) => <rect key={i} x={((((i * 180 - T * 70) % 1260) + 1260) % 1260) - 90} y={h * 0.915} width={60 + 50 * hash(i)} height={h * 0.05} fill={v(0.7)} />)}
        <circle cx={w * 0.94} cy={h * 0.08} r={h * 0.035} fill={v(0.9)} />
      </g>
    </g>
  );
}

// ── the feed on the phone ──
const ITEMS = [
  { id: 'b0', tone: 'warm', kind: 'sun' },
  { id: 'b1', tone: 'info', kind: 'headline' },
  { id: 'b2', tone: 'red', kind: 'chart' },
  { id: 'b3', tone: 'warm', kind: 'cat' },
  { id: 'b4', tone: 'info', kind: 'avatar' },
  { id: 'b5', tone: 'warm', kind: 'friends' },
  { id: 'b6', tone: 'red', kind: 'video' },
  { id: 'b7', tone: 'warm', kind: 'cup' },
  { id: 'b8', tone: 'red', kind: 'alert' },
  { id: 'b9', tone: 'warm', kind: 'plant' },
  { id: 'b10', tone: 'info', kind: 'text' },
  { id: 'b11', tone: 'warm', kind: 'bowl' },
  { id: 'b12', tone: 'red', kind: 'headline' },
  { id: 'b13', tone: 'warm', kind: 'heart' },
];
// thumb swipes: [start, end] of each upward flick; the feed's scroll follows each with momentum
const SWIPES = [[0.32, 0.56], [1.42, 1.66], [2.36, 2.6], [7.12, 7.36], [8.02, 8.26]];
const RP = [296, 640];
function thumbTip(T) {
  const keys = [[0, RP]];
  SWIPES.forEach(([a, b]) => { keys.push([a - 0.14, [300, 676]], [a, [300, 676]], [b, [306, 420]], [b + 0.26, RP]); });
  return path2(T, keys);
}
function feedScroll(T) {
  const keys = [[0, 40]];
  let s = 40;
  SWIPES.forEach(([a, b]) => { keys.push([a, s]); s += 300; keys.push([b + 0.45, s, 'hit']); });
  return track(T, keys);
}
// the notification banner: slides down at NOTE_T, goes back up after the glance down
function banner(T) { return MOTION.hit(T, NOTE_T, NOTE_T + 0.4, 0, 1) - glide(T, 7.5, 7.8, 0, 1); }

// ── the POV ──────────────────────────────────────────────────────────────────
// look: 0..1 (phone .. TV). Returns the whole frame; it draws beyond 1920 × 1080 (the eye needs the margin)
function POV({ T, k, look }) {
  const foc = clamp(lookAt(T - 0.12), 0, 1);   // focus pulls a beat after the head moves
  const p = lerp(PITCH_PHONE, PITCH_TV, look) + 0.006 * osc(T, 3.7);
  // the TV's light breathes in size, not in value: in posterized layers a value change makes whole bands jump
  const fl = 1 + 0.035 * osc(T, 1.9) + 0.02 * osc(T, 0.83, 0.3);
  const farBlur = lerp(9, 0.6, foc), midBlur = lerp(6, 4, foc), nearBlur = lerp(0, 7, foc);
  const far = mixRamp('cur', 'red', 0.1 * foc);
  // the phone, held at the lap; it drops a little when the eyes leave it, and buzzes with the notification
  const buzz = (T > NOTE_T ? Math.exp(-(T - NOTE_T) * 6) : 0) * Math.sin((T - NOTE_T) * 90);
  const ePh = PITCH_PHONE + 0.012 - 0.03 * look;   // its top stays in the bottom of the frame on the TV
  const P = { x: 962 + 7 * osc(T, 4.1) + 5 * buzz, y: Yp(ePh, p) + 4 * osc(T, 3.3, 0.2), s: 0.92, rot: -3 + 1.1 * osc(T, 5.2) + 2.4 * buzz };
  const L = feedLayout(ITEMS, feedScroll(T), T), fc = feedCards(L, { dots: true });
  const bn = banner(T);
  const shine = 1 + 0.18 * pop(T, NOTE_T, 0.2) * (1 - g01(T, NOTE_T + 0.4, NOTE_T + 1.4));
  const tip = thumbTip(T);
  const cur = <g><rect width={SW} height={SH} fill={v(0.95)} />{fc.cur}</g>;
  const red = <g>{fc.red}{bn > 0.001 && <g transform={`translate(0 ${-110 + 160 * bn})`}>
    <rect x="16" y="0" width={SW - 32} height="96" rx="22" fill={v(0.56)} />
    <circle cx="62" cy="48" r="22" fill={v(0.92)} /><rect x="59.5" y="34" width="5" height="18" rx="2.5" fill={v(0.3)} /><circle cx="62" cy="58" r="3" fill={v(0.3)} />
    <rect x="100" y="28" width="170" height="12" rx="6" fill={v(0.86)} /><rect x="100" y="52" width="210" height="10" rx="5" fill={v(0.74)} /><rect x="100" y="70" width="120" height="10" rx="5" fill={v(0.74)} />
  </g>}</g>;
  const over = <g><rect width={SW} height="48" fill={v(0.95)} /><AppBar /><StatusBar /><HomeBar /></g>;
  const PH = { ...P, x: HAND_AT[0], y: HAND_AT[1], rot: 0 };
  const handT = `translate(${P.x.toFixed(2)} ${P.y.toFixed(2)}) rotate(${P.rot.toFixed(3)}) translate(${-HAND_AT[0]} ${-HAND_AT[1]})`;
  const tipW = toWorld(PH, tip);
  const press = SWIPES.some(([a, b]) => T > a && T < b) ? 1 : 0;

  // the room, by elevation: wall from the skirting (-0.3) up, the TV on the wall, a sideboard under it
  const [wy, wh] = span(-0.3, 1.2, p), [tvy, tvh] = span(-0.12, 0.27, p), [sby, sbh] = span(-0.3, -0.19, p);
  const [piy, pih] = span(0.02, 0.24, p), [wiy, wih] = span(-0.06, 0.36, p);
  const tv = [600, tvy, 720, tvh];
  const [cty, cth] = span(-0.52, -0.37, p), [cfy, cfh] = span(-0.64, -0.52, p);
  // only the posts inside the frame (a red-graded group lying wholly outside it left a dark square in the corner)
  const moths = Array.from({ length: 5 }, (_, i) => {
    const h = (n) => hash(i * 6.1 + n * 2.7 + 9), a = T * (0.5 + 0.4 * h(1)) * (h(2) > 0.5 ? 1 : -1) + 6.28 * h(3);
    const e = 0.08 + 0.2 * h(4) * Math.sin(a), x = 960 + (420 + 160 * h(5)) * Math.cos(a), y = Yp(e, p);
    return y > -60 && y < 1140 ? <PostValue key={i} kind={POST_KINDS[(i * 4 + 2) % POST_KINDS.length]} x={x} y={y} s={1.5 + 0.5 * h(6)} rot={-30 + 60 * h(7) + 12 * osc(T, 1.3 + h(8))} flip={Math.cos(T * (2 + 2 * h(9)) + 6 * h(1))} /> : null;
  }).filter(Boolean);
  return (
    <g>
      <defs>
        <GradeBlur id="povFar" ramp={far} blur={farBlur} />
        <GradeBlur id="povMid" ramp="cur" blur={midBlur} />
        <GradeBlur id="povNearSet" ramp="cur" poster={false} blur={18} />
        <GradeBlur id="povTV" ramp="red" blur={farBlur} />
        <Blur id="povNear" s={nearBlur} region={[P.x - 700, P.y - 640, 1400, 1500]} />
      </defs>
      {/* far: the wall, the window, a picture, the sideboard, the TV's glow */}
      <g filter="url(#povFar)">
        <rect x="-400" y="-700" width="2720" height="2500" fill={v(0.1)} />
        <rect x="-400" y={wy} width="2720" height={wh} fill={v(0.17)} />
        <ellipse cx="960" cy={tvy + tvh * 0.5} rx={760 * fl} ry={tvh * 1.25 * fl} fill={v(0.27)} />
        <ellipse cx="960" cy={tvy + tvh * 0.5} rx={500 * fl} ry={tvh * 0.85 * fl} fill={v(0.38)} />
        <rect x="1500" y={wiy} width="300" height={wih} fill={v(0.24)} />
        <rect x="1520" y={wiy + 16} width="260" height={wih - 32} fill={v(0.07)} />
        <rect x="1644" y={wiy + 16} width="12" height={wih - 32} fill={v(0.22)} />
        <path d={`M 1480 ${wiy - 20} L 1560 ${wiy - 20} Q 1540 ${wiy + wih * 0.6} 1570 ${wiy + wih + 60} L 1470 ${wiy + wih + 60} Z`} fill={v(0.26)} />
        <rect x="150" y={piy} width="230" height={pih} fill={v(0.12)} stroke={v(0.3)} strokeWidth="12" />
        <rect x="-400" y={wy + wh - 18} width="2720" height="18" fill={v(0.1)} />
        <rect x="-400" y={wy + wh} width="2720" height="1600" fill={v(0.12)} />
        <rect x="520" y={sby} width="880" height={sbh} fill={v(0.2)} />
        <rect x="520" y={sby} width="880" height={sbh * 0.14} fill={v(0.3)} />
        <rect x="560" y={sby + sbh * 0.3} width="380" height={sbh * 0.5} fill={v(0.15)} /><rect x="980" y={sby + sbh * 0.3} width="380" height={sbh * 0.5} fill={v(0.15)} />
        <path d={`M 1300 ${sby} q -50 ${-sbh * 1.2} -10 ${-sbh * 2.2} q 30 ${sbh} 30 ${sbh * 2.2} Z M 1320 ${sby} q 40 ${-sbh * 1.5} 80 ${-sbh * 1.9} q -40 ${sbh * 0.8} -60 ${sbh * 1.9} Z`} fill={v(0.2)} />
        <rect x="1290" y={sby - sbh * 0.3} width="50" height={sbh * 0.3} fill={v(0.3)} />
        <rect x={tv[0] - 14} y={tv[1] - 14} width={tv[2] + 28} height={tv[3] + 28} rx="6" fill={v(0.06)} />
      </g>
      <g filter="url(#povTV)">
        <g transform={`translate(${tv[0]} ${tv[1]}) scale(1 ${tv[3] / 400})`}><TVNews w={tv[2]} h={400} T={T} kind={T < CUT_T ? 'anchor' : 'podium'} /></g>
      </g>
      {moths.length > 0 && <g filter="url(#povTV)">{moths}</g>}
      {/* mid: the coffee table and the rug; the phone's glow on the lap */}
      <g filter="url(#povMid)">
        <ellipse cx="960" cy={cty + cth + cfh} rx="1100" ry={(cth + cfh) * 1.6} fill={v(0.16)} />
        <rect x="380" y={cty} width="1160" height={cth} rx="10" fill={v(0.31)} />
        <rect x="380" y={cty + cth} width="1160" height={cfh} fill={v(0.13)} />
        <rect x="560" y={cty + cth * 0.3} width="90" height={cth * 0.4} rx="8" fill={v(0.5)} />
        <rect x="1230" y={cty + cth * 0.45} width="150" height={cth * 0.22} rx="6" fill={v(0.22)} />
        <ellipse cx={P.x} cy={P.y + 260} rx={560 * shine} ry={300 * shine} fill={v(0.3)} />
        <rect x="-400" y={cfy + cfh} width="2720" height="1600" fill={v(0.24)} />
        <ellipse cx={P.x} cy={P.y + 320} rx={700 * shine} ry={360 * shine} fill={v(0.3)} />
      </g>
      {/* near: the sofa's arms at the edges, far out of focus */}
      <g filter="url(#povNearSet)">
        <path d={`M -400 ${Yp(-0.42, p)} Q 120 ${Yp(-0.44, p)} 170 ${Yp(-0.6, p)} L 140 ${Yp(-1.2, p)} L -400 ${Yp(-1.2, p)} Z`} fill={v(0.2)} />
        <path d={`M 2320 ${Yp(-0.42, p)} Q 1800 ${Yp(-0.44, p)} 1750 ${Yp(-0.6, p)} L 1780 ${Yp(-1.2, p)} L 2320 ${Yp(-1.2, p)} Z`} fill={v(0.17)} />
      </g>
      {/* the phone and the hands (the curator phone shot's mitt), soft while the eyes are on the TV. The blur's region
          hugs the phone and hands: with the frame-wide region a black smudge appeared in the top-left corner */}
      <g filter={nearBlur > 0.3 ? 'url(#povNear)' : undefined}>
        <PhoneDefs light={HAND_AT} reach={(640 + 260 * (shine - 1)) * 0.92} handRamp="cur" bf={k.bf} amp={k.amp} handAmp={k.amp * 0.35} region={[-400, -700, 2720, 2500]} />
        <g transform={handT}><g filter="url(#phTone)"><Mitt P={PH} tip={tipW} layer="back" /></g></g>
        <Phone P={P} id="pov"><Layers cur={cur} red={red} over={over} /></Phone>
        <g transform={handT}><g filter="url(#phToneF)"><Mitt P={PH} tip={tipW} layer="front" press={press} /></g></g>
      </g>
    </g>
  );
}
const HAND_AT = [960, 560];

// ── the eye ──────────────────────────────────────────────────────────────────
// The head is the Bean rig's head (side view, facing left; its position and tilt come from FU_BEAN.rig) at S_HEAD times
// the rig's size, so the eye keeps the rig's proportion to the head (3.8 to 26). It is toned the way ToneBean tones a
// figure: darker toward the outline (here a radial falloff, the edge field of a circle), brighter on the side the lights
// are on, a little noise, posterized to the ramp, cut to the crisp outline. (ToneBean itself cannot run at this scale:
// its edge blur needs a filter surface of several gigabytes.) The lights are the scene's: the phone below and in front,
// the TV in front (to the left).
// When the eyes go up the head tilts back about the neck, as the rig does; the camera stays locked on the eye, so the
// head turns round it and the room behind slides past (at 0.6 of the camera's move: it is further away).
const S_HEAD = 56, EYE_AT = [1180, 540];
// A displacement map that bows the POV like a convex mirror: a point at radius r from the centre shows the POV at
// r·(1 + K·ρ²), ρ = r / RC. Baked once on a canvas. It covers the region MAP (POV coordinates).
const RC_EYE = 600, K_EYE = 0.25, S_EYE = 560, MAP = [-200, -460, 2320, 2000];
const FISH = (() => {
  const cw = 464, ch = 400, c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const g = c.getContext('2d'), im = g.createImageData(cw, ch);
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
    const x = MAP[0] + ((i + 0.5) / cw) * MAP[2] - 960, y = MAP[1] + ((j + 0.5) / ch) * MAP[3] - 540;
    const rho = Math.min(Math.hypot(x, y) / RC_EYE, 1.2), f = K_EYE * rho * rho;
    const o = (j * cw + i) * 4;
    im.data[o] = Math.round(clamp(0.5 + (x * f) / S_EYE, 0, 1) * 255);
    im.data[o + 1] = Math.round(clamp(0.5 + (y * f) / S_EYE, 0, 1) * 255);
    im.data[o + 2] = 128; im.data[o + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  return c.toDataURL('image/png');
})();
// seated, looking down at the phone (look 0) or up at the TV (look 1)
const headPose = (T, look) => ({ hx: 0, lean: 8 + 0.6 * osc(T, 3.6), tilt: lerp(20, -4, look) + 0.8 * osc(T, 2.9, 0.2),
  legN: [82, 84], legF: [78, 80], armN: [26, 100], armF: [20, 106], phone: 0 });
// the eye in the rig's own frame (unflipped): the same formula as the rig's side-view eye
function eyeLocal(pose) {
  const R = window.FU_BEAN.rig(pose);
  return [R.Hc[0] + R.fh[0] * R.r * 0.52 + R.uh[0] * R.r * 0.12, R.Hc[1] + R.fh[1] * R.r * 0.52 + R.uh[1] * R.r * 0.12];
}
const toW = (pl) => [-S_HEAD * pl[0], S_HEAD * pl[1]];   // rig frame → world (figure at the origin, facing left)
// value noise for the band edges, baked once: a fine grain and four boil frames (8 fps)
const bakeNoise = (seed, cells) => {
  let st = seed >>> 0; const rnd = () => (st = (st * 1664525 + 1013904223) >>> 0) / 4294967296;
  const a = document.createElement('canvas'); a.width = a.height = cells;
  const g = a.getContext('2d'), im = g.createImageData(cells, cells);
  for (let i = 0; i < im.data.length; i += 4) { const x = rnd() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = x; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0);
  const b = document.createElement('canvas'); b.width = b.height = 256;
  const bg = b.getContext('2d'); bg.imageSmoothingEnabled = true; bg.imageSmoothingQuality = 'high'; bg.filter = `blur(${(256 / cells) * 0.35}px)`;
  bg.drawImage(a, -1, -1, 258, 258);
  return b.toDataURL('image/png');
};
const HEAD_NOISE = { grain: bakeNoise(17, 7), boil: [23, 35, 47, 59].map((sd) => bakeNoise(sd, 12)) };
// the head in close-up: value art (ambient, the lights, the edge falloff) → noise → posterized to the curator ramp
function HeadMacro({ pose, lights, region, bf, amp }) {
  const R = window.FU_BEAN.rig(pose), C = toW(R.Hc), r = R.r * S_HEAD;
  const lit = lights.map((L, i) => {
    let u, f;
    if (L.dir) { const n = Math.hypot(L.dir[0], L.dir[1]); u = [-L.dir[0] / n, -L.dir[1] / n]; f = L.i; }
    else { const d = [L.x - C[0], L.y - C[1]], n = Math.hypot(d[0], d[1]) || 1; u = [d[0] / n, d[1] / n]; f = L.i / (1 + Math.pow(Math.max(0, n - r) / L.reach, 2)); }
    return { u, f, i };
  });
  const img = (href, res) => <feImage href={href} x={region[0]} y={region[1]} width={region[2]} height={region[3]} preserveAspectRatio="none" result={res} />;
  const b = 0.012 * amp;   // band boil: at this scale the rig's amount made the bands crawl visibly at 8 fps
  return (
    <g>
      <defs>
        <clipPath id="hmClip"><circle cx={C[0]} cy={C[1]} r={r} /></clipPath>
        {lit.map((L) => (
          <radialGradient key={L.i} id={'hmL' + L.i} gradientUnits="userSpaceOnUse" cx={C[0] + L.u[0] * r * 0.85} cy={C[1] + L.u[1] * r * 0.85} r={r * 1.9}>
            <stop offset="0" stopColor="#fff" stopOpacity={clamp(L.f, 0, 1)} /><stop offset="0.45" stopColor="#fff" stopOpacity={clamp(L.f * 0.7, 0, 1)} /><stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        ))}
        <radialGradient id="hmEdge" gradientUnits="userSpaceOnUse" cx={C[0]} cy={C[1]} r={r}>
          <stop offset="0.3" stopColor="#000" stopOpacity="0" /><stop offset="0.62" stopColor="#000" stopOpacity="0.16" /><stop offset="0.86" stopColor="#000" stopOpacity="0.36" /><stop offset="1" stopColor="#000" stopOpacity="0.56" />
        </radialGradient>
        <filter id="hmTone" filterUnits="userSpaceOnUse" x={region[0]} y={region[1]} width={region[2]} height={region[3]} colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0" result="l" />
          {img(HEAD_NOISE.grain, 'n')}
          <feComposite in="l" in2="n" operator="arithmetic" k1="0" k2="1" k3="0.035" k4="-0.0175" result="ln" />
          {img(HEAD_NOISE.boil[bf % 4], 'nb')}
          <feComposite in="ln" in2="nb" operator="arithmetic" k1="0" k2="1" k3={b} k4={-b / 2} result="lb" />
          <feGaussianBlur in="lb" stdDeviation="16" result="s" />
          <feComponentTransfer in="s">
            {['R', 'G', 'B'].map((ch, j) => React.createElement('feFunc' + ch, { key: ch, type: 'discrete', tableValues: RC.map((hx) => (parseInt(hx.slice(1 + 2 * j, 3 + 2 * j), 16) / 255).toFixed(4)).join(' ') }))}
            <feFuncA type="linear" slope="0" intercept="1" />
          </feComponentTransfer>
        </filter>
      </defs>
      <g clipPath="url(#hmClip)">
        <g filter="url(#hmTone)">
          <circle cx={C[0]} cy={C[1]} r={r + 80} fill={v(0.34)} />
          {lit.map((L) => <circle key={L.i} cx={C[0]} cy={C[1]} r={r + 80} fill={`url(#hmL${L.i})`} />)}
          <circle cx={C[0]} cy={C[1]} r={r + 1} fill="url(#hmEdge)" />
        </g>
      </g>
    </g>
  );
}
function EyeView({ T, k, look }) {
  const pose = headPose(T, look), eL = eyeLocal(pose), eW = toW(eL);
  const c = [EYE_AT[0] - eW[0], EYE_AT[1] - eW[1]];
  const eW0 = toW(eyeLocal(headPose(T, 0))), c0 = [EYE_AT[0] - eW0[0], EYE_AT[1] - eW0[1]];
  const bg = [0.6 * (c[0] - c0[0]), 0.6 * (c[1] - c0[1])];
  const R0 = window.FU_BEAN.rig(headPose(0, 0));
  const phoneW = toW([R0.Hc[0] + 44, R0.Hc[1] + 80]);
  const lights = [{ x: phoneW[0], y: phoneW[1], i: 0.85 - 0.3 * look, reach: 64 * S_HEAD }, { dir: [1, 0.12], i: 0.5 }];
  const er = 3.8 * S_HEAD, m = er / RC_EYE, E = EYE_AT;
  return (
    <g>
      <defs>
        <radialGradient id="eyeBall" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={RC[0]} stopOpacity="0.12" /><stop offset="0.65" stopColor={RC[0]} stopOpacity="0.25" /><stop offset="1" stopColor={RC[0]} stopOpacity="0.95" />
        </radialGradient>
        <clipPath id="eyeClip"><circle cx={E[0]} cy={E[1]} r={er} /></clipPath>
        <filter id="eyeFish" filterUnits="userSpaceOnUse" x={MAP[0]} y={MAP[1]} width={MAP[2]} height={MAP[3]} colorInterpolationFilters="sRGB">
          <feImage href={FISH} x={MAP[0]} y={MAP[1]} width={MAP[2]} height={MAP[3]} preserveAspectRatio="none" result="map" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale={S_EYE} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="2" />
        </filter>
        <GradeBlur id="eyeRoom" ramp="cur" poster={false} blur={12} region={[-400, -400, 2720, 1880]} />
      </defs>
      {/* the room in front of the curator, behind their profile, out of focus */}
      <g filter="url(#eyeRoom)">
        <g transform={`translate(${bg[0].toFixed(2)} ${bg[1].toFixed(2)})`}>
          <rect x="-400" y="-400" width="2720" height="1880" fill={v(0.15)} />
          <ellipse cx="-60" cy="620" rx="430" ry="330" fill={v(0.42)} />
          <rect x="-200" y="470" width="230" height="250" rx="10" fill={v(0.7)} />
          <rect x="170" y="40" width="290" height="380" fill={v(0.3)} />
          <rect x="190" y="60" width="250" height="340" fill={v(0.07)} />
          <rect x="308" y="60" width="14" height="340" fill={v(0.3)} /><rect x="190" y="210" width="250" height="14" fill={v(0.3)} />
          <rect x="-200" y="820" width="900" height="16" fill={v(0.26)} />
          <rect x="60" y="760" width="70" height="60" fill={v(0.22)} /><rect x="150" y="740" width="44" height="80" fill={v(0.3)} />
          <rect x="-200" y="1010" width="900" height="400" fill={v(0.1)} />
          <rect x="-200" y="-160" width="900" height="16" fill={v(0.22)} />
        </g>
      </g>
      {/* the head, toned, lit by the phone and the TV */}
      <g transform={`translate(${c[0].toFixed(2)} ${c[1].toFixed(2)})`}>
        <HeadMacro pose={pose} lights={lights} region={[-c[0] - 60, -c[1] - 60, 2040, 1200]} bf={k.bf} amp={k.amp} />
      </g>
      {/* the eye: a crisp dark disc in the rig's proportion; in it, the POV, mirrored and bowed */}
      <circle cx={E[0]} cy={E[1]} r={er} fill={RC[0]} />
      <g clipPath="url(#eyeClip)">
        <g opacity="0.85" transform={`translate(${E[0]} ${E[1]}) scale(${-m} ${m}) translate(-960 -540)`}>
          <g filter="url(#eyeFish)"><POV T={T} k={k} look={look} /></g>
        </g>
        <circle cx={E[0]} cy={E[1]} r={er} fill="url(#eyeBall)" />
        <path d={`M ${E[0] - 0.66 * er} ${E[1] - 0.42 * er} Q ${E[0] - 0.52 * er} ${E[1] - 0.7 * er} ${E[0] - 0.24 * er} ${E[1] - 0.8 * er} Q ${E[0] - 0.46 * er} ${E[1] - 0.6 * er} ${E[0] - 0.58 * er} ${E[1] - 0.34 * er} Z`} fill={RC[6]} opacity="0.7" />
      </g>
    </g>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────
function Piece({ view, guide, boil, boilAmp }) {
  const { T, CUES } = useComposition();
  const bf = Math.floor(T * 8), amp = boil ? boilAmp : 0;
  const k = { T, bf, amp };
  const look = lookAt(T);
  const items = [
    { at: 0.3, until: 2.9, text: 'They bear the weight of vulnerability,' },
    { at: 3.0, until: 4.7, text: 'produced by the ongoing crisis,' },
    { at: 4.8, until: 6.9, text: 'by platforms built to keep you scrolling,' },
    { at: 7.0, until: 9.0, text: 'and inequality in who gets heard.' },
  ];
  return (
    <div data-screen-label={`Curator eye · ${T.toFixed(1)}s`} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: RC[0], transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <LookDefs ramps={['cur']} bf={bf} amp={amp} />
        <rect width={W} height={H} fill={RC[0]} />
        {view === 'pov' ? <POV T={T} k={k} look={look} /> : <EyeView T={T} k={k} look={look} />}
      </svg>
      {guide && <Captions items={items} style={{ font: '500 40px "Open Sans", sans-serif', bottom: '5%', textShadow: '0 1px 14px rgba(0,0,0,0.8)' }} />}
    </div>
  );
}

function FUCuratorEye() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { view: 'eye', referenceOverlay: false, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={RC[0]}>
        <Piece view={t.view} guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Shot" />
        <TweakSelect label="View" value={t.view} options={[{ value: 'eye', label: 'In the eye (reflection)' }, { value: 'pov', label: 'POV (what the eye sees)' }]} onChange={(x) => setTweak('view', x)} />
        <TweakSection label="Preview" />
        <TweakToggle label="Narration guide" value={t.referenceOverlay} onChange={(x) => setTweak('referenceOverlay', x)} />
        <TweakToggle label="Line boil (8 fps)" value={t.lineBoil} onChange={(x) => setTweak('lineBoil', x)} />
        <TweakSlider label="Boil amplitude" value={t.boilAmp ?? 0.5} min={0} max={3} step={0.1} unit="px" onChange={(x) => setTweak('boilAmp', x)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

window.FUCuratorEye = FUCuratorEye;
