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
// The camera is fixed to the head, locked on the eye: the face holds still on screen. When the curator looks up, the
// room behind slides up (ROOM_SLIDE): on the phone the strip past the profile shows the top of the wall and the
// ceiling, on the TV the wall with the TV's glow level with the eye. The lights swing round the face by HEAD_TURN. The TV comes round to the front of the face and lights it more;
// the phone falls away below. (Round 2 moved the camera with the eye while the head tilted about the neck: the eye
// swung up and back by nearly 1000 px and the room slid sideways instead of dropping.)
const S_HEAD = 80, EYE_AT = [1290, 540];
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
// the head as the camera sees it (fixed to the head: only a breath of movement)
const HEAD_TURN = 26;   // degrees the head turns back from the phone to the TV (swings the lights round the face)
const ROOM_SLIDE = 540; // px the room behind slides up as he looks up (round 7 slid it down: the wrong way)
const headPose = (T) => ({ hx: 0, lean: 8 + 0.3 * osc(T, 3.6), tilt: 0 + 0.4 * osc(T, 2.9, 0.2),
  legN: [82, 84], legF: [78, 80], armN: [26, 100], armF: [20, 106], phone: 0 });
// a light seen from the head: `a` degrees below the gaze (negative: above), intensity i
const headLight = (pose, a, i) => { const g = ((pose.lean + pose.tilt + a) * Math.PI) / 180; return { u: [-Math.cos(g), Math.sin(g)], i }; };
// the eye in the rig's own frame (unflipped): the same formula as the rig's side-view eye
function eyeLocal(pose) {
  const R = window.FU_BEAN.rig(pose);
  return [R.Hc[0] + R.fh[0] * R.r * 0.52 + R.uh[0] * R.r * 0.12, R.Hc[1] + R.fh[1] * R.r * 0.52 + R.uh[1] * R.r * 0.12];
}
const toW = (pl) => [-S_HEAD * pl[0], S_HEAD * pl[1]];   // rig frame → world (figure at the origin, facing left)
// The head in close-up, toned in JS: the value field (ambient, the lights, the edge falloff, a little low-frequency
// noise fixed to the head and a faint boil) is computed in floating point and posterized to the curator ramp on a
// canvas, with each band edge antialiased from the field's own gradient. An SVG filter did the same in 8 bits: on a
// gentle light gradient the 8-bit steps made the band edges stair-step and wander.
const HM_W = 1920, HM_H = 1080, HM_G = 4;   // canvas size (design px) and the field's grid step
const HM_RGB = RC.map((hx) => [1, 3, 5].map((i) => parseInt(hx.slice(i, i + 2), 16)));
const hmHash = (x, y, sd) => { const h = Math.sin(x * 127.1 + y * 311.7 + sd * 74.7) * 43758.5453; return h - Math.floor(h); };
function hmNoise(x, y, sd) {   // smooth value noise, cells of 1
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
  const a = hmHash(xi, yi, sd), b = hmHash(xi + 1, yi, sd), c = hmHash(xi, yi + 1, sd), d = hmHash(xi + 1, yi + 1, sd);
  return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w - 0.5;
}
const hmEdge = (rho) => {   // the edge field of a circle: darker toward the outline
  const S = [[0.3, 0], [0.62, 0.16], [0.86, 0.36], [1, 0.56]];
  if (rho <= S[0][0]) return 0;
  for (let i = 1; i < S.length; i++) if (rho <= S[i][0]) return S[i - 1][1] + ((rho - S[i - 1][0]) / (S[i][0] - S[i - 1][0])) * (S[i][1] - S[i - 1][1]);
  return S[S.length - 1][1];
};
const hmLight = (t) => (t >= 1 ? 0 : t < 0.45 ? 1 - (0.3 * t) / 0.45 : 0.7 * (1 - (t - 0.45) / 0.55));
// Face-light variants (round 6, the `face` tweak). The rule for all: the face gets brighter as he looks up at the TV.
const FACES = {
  lobes: 'A · Lobes (round 5): the TV light comes in as a lobe beside the eye',
  moon: 'B · Moon: the head as a sphere, one light swinging from below to the front; the terminator crosses the face',
  wrap: 'C · Soft moon: the same light, wrapped round the head: wide, slow bands',
  lift: 'D · Lift: the bands hold still; every band slides up one tone',
  patch: 'E · Screen patches: the phone\'s small patch under the eye, then the TV\'s wide patch rises over the face',
  rings: 'F · Rings: rings of light open out from the eye',
  sweep: 'G · Sweep: light fills the face from its front edge backward',
  liftc: 'H · D\'s tone slide on C\'s opening contours (the darker contour kept clear of the eye, one more light contour bottom right)',
};
const EYE_RISE = 0.06, EYE_RISE_R = 2.0, BR_RISE = 0.12, BR_RISE_R = 1.45;   // H's touches (eye radii)
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const norm3 = (a) => { const n = Math.hypot(a[0], a[1], a[2]); return [a[0] / n, a[1] / n, a[2] / n]; };
// the light value (before noise) at a point, for each variant. dx, dy: from the head's centre; ex, ey: from the eye
function faceField(face, look, r, lit) {
  const L = norm3([lerp(-0.45, -0.95, look), lerp(0.85, 0.05, look), 0.3]), I = lerp(0.62, 1, look);
  const sphere = (dx, dy) => { const nx = dx / r, ny = dy / r; return [nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))]; };
  const box = (x, y, a, b) => Math.pow(Math.pow(Math.abs(x / a), 4) + Math.pow(Math.abs(y / b), 4), 0.25);
  switch (face) {
    case 'moon': return (x, y, dx, dy, rho) => { const n = sphere(dx, dy); return 0.18 + 0.78 * I * Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) - 0.06 * hmEdge(rho); };
    // the light comes from the right, behind the eye (the user: the brighter light on the right), toward the camera
    case 'wrap': { const Lr = norm3([lerp(0.15, 0.55, look), lerp(0.85, 0.05, look), 0.65]);
      return (x, y, dx, dy, rho) => { const n = sphere(dx, dy), d = n[0] * Lr[0] + n[1] * Lr[1] + n[2] * Lr[2]; return 0.2 + 0.7 * I * Math.max(0, (d + 0.7) / 1.7) - 0.08 * hmEdge(rho); }; }
    case 'patch': return (x, y, dx, dy, rho, ex, ey) => {
      const e = 3.8 * S_HEAD;   // sizes in eye radii: the frame shows about two eye radii either side of the eye
      const ph = (1 - look) * 0.36 * ss(1, 0.55, box(ex - 0.1 * e, ey - 1.45 * e, 0.42 * e, 0.62 * e));
      const tv = look * 0.62 * ss(1, 0.5, box(ex + 0.1 * e, ey - lerp(3.4, 0.1, look) * e, 1.75 * e, 1.2 * e));
      return 0.34 * (1 - hmEdge(rho)) + ph + tv;
    };
    case 'rings': return (x, y, dx, dy, rho, ex, ey) => { const R = lerp(0.25, 0.95, look) * r, d = Math.hypot(ex, ey) / R; return (0.3 + 0.06 * look) * (1 - hmEdge(rho)) + lerp(0.2, 0.55, look) * Math.exp(-d * d); };
    case 'sweep': return (x, y, dx, dy, rho) => { const n = sphere(dx, dy), s0 = -0.85 * n[0] + 0.3 * n[1], t = lerp(1.05, -0.25, look); return 0.26 * (1 - hmEdge(rho)) + lerp(0.25, 0.5, look) * ss(t - 0.35, t + 0.35, s0); };
    // H: C's field frozen at the start (on the phone), with two touches: a soft rise round the eye keeps the darker
    // contour clear of it, a soft rise in the bottom right adds one lighter contour there. The tones slide (see `shift`)
    case 'liftc': { const c0 = faceField('wrap', 0, r, lit), e = 3.8 * S_HEAD, br = [1880 - EYE_AT[0], 1100 - EYE_AT[1]];
      return (x, y, dx, dy, rho, ex, ey) => c0(x, y, dx, dy, rho)
        + EYE_RISE * Math.exp(-((ex + 0.9 * e) ** 2 + (ey + 0.9 * e) ** 2) / Math.pow(EYE_RISE_R * e, 2))   // centred up and left of the eye: it pushes the darker contour there away, not the light one bottom right
        + BR_RISE * Math.exp(-((ex - br[0]) ** 2 + (ey - br[1]) ** 2) / Math.pow(BR_RISE_R * e, 2)); }
    default: return (x, y, dx, dy, rho) => {   // 'lobes', and 'lift' (its lights are frozen; the tones slide instead)
      let keep = 1;
      for (const l of lit) keep *= 1 - l.f * hmLight(Math.hypot(x - l.c[0], y - l.c[1]) / l.R);
      return (1 - 0.66 * keep) * (1 - hmEdge(rho));
    };
  }
}
function headImage(C, r, ang, lit, bf, amp, face = 'lobes', look = 0) {
  const field = faceField(face, look, r, lit), E = EYE_AT;
  // 'lift': each band's colour slides toward the next tone up, so the contours stay where they are
  const shift = face === 'lift' || face === 'liftc' ? ss(0, 1, look) : 0;
  const PAL = HM_RGB.map((c, k) => { const d = HM_RGB[Math.min(k + 1, HM_RGB.length - 1)]; return c.map((x, j) => x + (d[j] - x) * shift); });
  const gw = Math.ceil(HM_W / HM_G) + 2, gh = Math.ceil(HM_H / HM_G) + 2, F = new Float32Array(gw * gh);
  const ca = Math.cos(-ang), sa = Math.sin(-ang), cell = 0.18 * r, bcell = 0.09 * r, ba = 0.0025 * amp;
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
    const x = (i - 1) * HM_G, y = (j - 1) * HM_G, dx = x - C[0], dy = y - C[1];
    const rho = Math.hypot(dx, dy) / r;
    const hx = dx * ca - dy * sa, hy = dx * sa + dy * ca;   // noise fixed to the head, so it turns with it
    F[j * gw + i] = field(x, y, dx, dy, rho, x - E[0], y - E[1]) + 0.022 * hmNoise(hx / cell, hy / cell, 3) + ba * hmNoise(hx / bcell, hy / bcell, 11 + (bf % 4) * 7);
  }
  const cv = document.createElement('canvas'); cv.width = HM_W; cv.height = HM_H;
  const g = cv.getContext('2d'), im = g.createImageData(HM_W, HM_H), D = im.data, N = 7;
  for (let y = 0; y < HM_H; y++) {
    const gy = y / HM_G + 1, j0 = Math.floor(gy), fy = gy - j0;
    for (let x = 0; x < HM_W; x++) {
      const gx = x / HM_G + 1, i0 = Math.floor(gx), fx = gx - i0, o = j0 * gw + i0;
      const a = F[o], b = F[o + 1], c = F[o + gw], d = F[o + gw + 1];
      const val = a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
      const gxv = ((b - a) + (d - c - b + a) * fy) / HM_G, gyv = ((c - a) + (d - c - b + a) * fx) / HM_G;
      const grad = Math.hypot(gxv, gyv) + 1e-6, k = clamp(val * N, 0, N - 1e-4), band = Math.floor(k);
      // distance (px) to the nearest threshold; blend across it over one pixel
      const up = (band + 1 - k) / N / grad, dn = (k - band) / N / grad;
      let c0 = PAL[band], c1 = c0, t = 0;
      if (up < 0.5 && band < N - 1) { c1 = PAL[band + 1]; t = 0.5 - up; }
      else if (dn < 0.5 && band > 0) { c1 = PAL[band - 1]; t = 0.5 - dn; }
      const q = (y * HM_W + x) * 4;
      D[q] = c0[0] + (c1[0] - c0[0]) * t; D[q + 1] = c0[1] + (c1[1] - c0[1]) * t; D[q + 2] = c0[2] + (c1[2] - c0[2]) * t; D[q + 3] = 255;
    }
  }
  g.putImageData(im, 0, 0);
  return cv.toDataURL('image/png');
}
// the head (in screen coordinates: C is the head's centre on screen), cut to its crisp outline
function HeadMacro({ pose, lights, cam, bf, amp, face, look }) {
  const R = window.FU_BEAN.rig(pose), Cw = toW(R.Hc), r = R.r * S_HEAD, C = [Cw[0] + cam[0], Cw[1] + cam[1]];
  const ang = -((pose.lean + pose.tilt) * Math.PI) / 180;   // the head's turn on screen (the figure faces left)
  // lights are directions from the head (u) with an intensity (i)
  // each light a broad, soft lobe toward its side of the head (round 3's bands, which the user preferred)
  const lit = lights.map((L) => ({ c: [C[0] + L.u[0] * r * 0.85, C[1] + L.u[1] * r * 0.85], R: r * 1.9, f: clamp(L.i, 0, 1) }));
  const href = headImage(C, r, ang, lit, bf, amp, face, look);
  return (
    <g>
      <clipPath id="hmClip"><circle cx={C[0]} cy={C[1]} r={r} /></clipPath>
      <image href={href} x="0" y="0" width={HM_W} height={HM_H} clipPath="url(#hmClip)" preserveAspectRatio="none" />
    </g>
  );
}
function EyeView({ T, k, look, face = 'liftc' }) {
  const pose = headPose(T), eW = toW(eyeLocal(pose));
  const c = [EYE_AT[0] - eW[0], EYE_AT[1] - eW[1]];
  const slide = -ROOM_SLIDE * look;   // the room slides up as he looks up (it slides, it does not turn: the user)
  // on the phone: the phone just below the gaze, the TV above it; on the TV: the TV straight ahead, the phone far below
  // one light leads at a time (two equal lights from above and below pinched the bands at eye level): the phone while
  // they read, the TV once they face it, brighter, so the face is more lit
  // round 3's bands, inverted as the user asked: there the face lost its highlight when he looked up; here it gains it
  const lk = face === 'lift' ? 0.5 : look;   // 'lift' holds the lobes' lights half way and slides the tones instead
  const dim = face === 'lift' ? 0.8 : 1;     // and a little dimmer: its brightest band was an island cut off by the frame's edge
  const lights = [headLight(pose, lerp(18, 18 + HEAD_TURN, lk), dim * lerp(0.45, 0.25, lk)), headLight(pose, lerp(-HEAD_TURN, 0, lk), dim * lerp(0.2, 0.78, lk))];
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
        <g transform={`translate(0 ${slide.toFixed(2)})`}>
          {/* laid out as seen while looking at the phone: the ceiling with a hanging lamp, the cornice, the top of the wall
              with a window. It slides up ROOM_SLIDE as he looks up, until the wall shows with the TV's glow level with the
              eye (along the gaze, 8° below level) and the sideboard under it */}
          <rect x="-400" y="-900" width="2720" height="3000" fill={v(0.15)} />
          <rect x="-400" y="-900" width="2720" height="1230" fill={v(0.2)} />
          <ellipse cx="90" cy="150" rx="260" ry="170" fill={v(0.34)} />
          <rect x="86" y="-900" width="8" height="1000" fill={v(0.3)} />
          <path d="M 40 150 Q 90 70 140 150 Z" fill={v(0.62)} />
          <rect x="-400" y="330" width="2720" height="18" fill={v(0.28)} />
          <rect x="50" y="470" width="290" height="420" fill={v(0.27)} />
          <rect x="70" y="490" width="250" height="380" fill={v(0.07)} />
          <rect x="188" y="490" width="14" height="380" fill={v(0.27)} /><rect x="70" y="660" width="250" height="14" fill={v(0.27)} />
          <ellipse cx="110" cy="1250" rx="420" ry="320" fill={v(0.4)} />
          <rect x="-50" y="1140" width="320" height="220" rx="10" fill={v(0.68)} />
          <rect x="-200" y="1420" width="900" height="80" fill={v(0.22)} />
          <rect x="-400" y="1580" width="2720" height="600" fill={v(0.1)} />
        </g>
      </g>
      {/* the head, toned, lit by the phone and the TV */}
      <HeadMacro pose={pose} lights={lights} cam={c} bf={k.bf} amp={k.amp} face={face} look={look} />
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
function Piece({ view, face, guide, boil, boilAmp }) {
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
        {view === 'pov' ? <POV T={T} k={k} look={look} /> : <EyeView T={T} k={k} look={look} face={face} />}
      </svg>
      {guide && view !== 'pov' && <div style={{ position: 'absolute', left: 40, top: 30, font: '700 30px "Open Sans", sans-serif', color: '#fff', textShadow: '0 1px 12px rgba(0,0,0,0.8)' }}>{FACES[face] || face}</div>}
      {guide && <Captions items={items} style={{ font: '500 40px "Open Sans", sans-serif', bottom: '5%', textShadow: '0 1px 14px rgba(0,0,0,0.8)' }} />}
    </div>
  );
}

function FUCuratorEye() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { view: 'eye', face: 'liftc', referenceOverlay: false, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={RC[0]}>
        <Piece view={t.view} face={t.face || 'liftc'} guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Shot" />
        <TweakSelect label="View" value={t.view} options={[{ value: 'eye', label: 'In the eye (reflection)' }, { value: 'pov', label: 'POV (what the eye sees)' }]} onChange={(x) => setTweak('view', x)} />
        <TweakSelect label="Face light" value={t.face || 'liftc'} options={Object.keys(FACES).map((key) => ({ value: key, label: FACES[key] }))} onChange={(x) => setTweak('face', x)} />
        <TweakSection label="Preview" />
        <TweakToggle label="Narration guide" value={t.referenceOverlay} onChange={(x) => setTweak('referenceOverlay', x)} />
        <TweakToggle label="Line boil (8 fps)" value={t.lineBoil} onChange={(x) => setTweak('lineBoil', x)} />
        <TweakSlider label="Boil amplitude" value={t.boilAmp ?? 0.5} min={0} max={3} step={0.1} unit="px" onChange={(x) => setTweak('boilAmp', x)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

window.FUCuratorEye = FUCuratorEye;
