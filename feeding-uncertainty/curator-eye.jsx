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
const { RAMPS, LookDefs, v, mixRamp, PostValue, POST_KINDS } = window.FU_LOOK;
const { SW, SH, track, path2, g01, pop, toWorld, PhoneDefs, Phone, Layers, StatusBar, AppBar, HomeBar, feedLayout, feedCards, Mitt } = window.FU_PHONE;
const { glide } = MOTION;
const RC = RAMPS.cur;

// ── timing (no SRT yet: estimates) ──
const UP = [2.92, 3.44, 3.76];      // glance up: move, overshoot, settle
const DOWN = [6.08, 6.6, 6.92];     // glance back down
const NOTE_T = 5.5;                 // the notification lights the phone
const CUT_T = 4.84;                 // the news cuts from the podium to the anchor and the chart

// ── the camera: pitch from the phone (down) to the TV ──
const F = 1000, PITCH_PHONE = -0.64, PITCH_TV = 0.06;
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
function TVNews({ w, h, T, kind }) {
  const tick = (T * 70) % 180;
  return (
    <g>
      <clipPath id="povTVclip"><rect x="0" y="0" width={w} height={h} /></clipPath>
      <g clipPath="url(#povTVclip)">
        <rect x="0" y="0" width={w} height={h} fill={v(0.36)} />
        <rect x="0" y="0" width={w} height={h * 0.62} fill={v(0.42)} />
        {kind === 'podium' ? (
          <g>
            {[0.14, 0.3, 0.7, 0.86].map((f, i) => <rect key={i} x={w * f - 10} y={h * 0.08} width="20" height={h * 0.5} fill={v(i % 2 ? 0.5 : 0.3)} />)}
            <g transform={`translate(${w * 0.5 + 4 * osc(T, 1.7)} 0)`}>
              <path d={`M ${-h * 0.17} ${h * 0.75} A ${h * 0.17} ${h * 0.24} 0 0 1 ${h * 0.17} ${h * 0.75} Z`} fill={v(0.22)} />
              <circle cx={0} cy={h * 0.33 + 3 * osc(T, 0.9)} r={h * 0.12} fill={v(0.22)} />
            </g>
            <path d={`M ${w * 0.5 - h * 0.2} ${h * 0.82} L ${w * 0.5 + h * 0.2} ${h * 0.82} L ${w * 0.5 + h * 0.15} ${h * 0.52} L ${w * 0.5 - h * 0.15} ${h * 0.52} Z`} fill={v(0.62)} />
            <circle cx={w * 0.5} cy={h * 0.62} r={h * 0.04} fill={v(0.9)} />
            <rect x={w * 0.5 - 2} y={h * 0.44} width="4" height={h * 0.09} fill={v(0.15)} />
          </g>
        ) : (
          <g>
            <g transform={`translate(${w * 0.22} 0)`}>
              <path d={`M ${-h * 0.2} ${h * 0.75} A ${h * 0.2} ${h * 0.28} 0 0 1 ${h * 0.2} ${h * 0.75} Z`} fill={v(0.2)} />
              <circle cx={2 * osc(T, 1.1)} cy={h * 0.3} r={h * 0.13} fill={v(0.2)} />
            </g>
            <rect x={w * 0.48} y={h * 0.1} width={w * 0.44} height={h * 0.46} rx="6" fill={v(0.28)} />
            <path d={`M ${w * 0.52} ${h * 0.2} L ${w * 0.62} ${h * 0.26} L ${w * 0.7} ${h * 0.22} L ${w * 0.78} ${h * 0.4} L ${w * 0.88} ${h * 0.48}`} fill="none" stroke={v(0.95)} strokeWidth={h * 0.025} strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="600" strokeDashoffset={600 * (1 - glide(T, CUT_T + 0.1, CUT_T + 1.4, 0, 1))} />
          </g>
        )}
        <rect x="0" y={h * 0.75} width={w} height={h * 0.13} fill={v(0.9)} />
        <rect x={w * 0.03} y={h * 0.785} width={w * 0.1} height={h * 0.06} fill={v(0.32)} />
        <rect x={w * 0.16} y={h * 0.79} width={w * (kind === 'podium' ? 0.5 : 0.42)} height={h * 0.05} fill={v(0.5)} />
        <rect x="0" y={h * 0.88} width={w} height={h * 0.12} fill={v(0.2)} />
        {Array.from({ length: 7 }, (_, i) => <rect key={i} x={((i * 180 - tick + 2000) % (w + 180)) - 90} y={h * 0.915} width={60 + 50 * hash(i)} height={h * 0.05} fill={v(0.7)} />)}
        <circle cx={w * 0.94} cy={h * 0.08} r={h * 0.035} fill={v(0.95 * (0.6 + 0.4 * (osc(T, 0.9) > 0 ? 1 : 0)))} />
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
  const fl = 0.8 + 0.12 * osc(T, 0.47) + 0.08 * osc(T, 0.19, 0.3) + (T > CUT_T && T < CUT_T + 0.08 ? 0.25 : 0);
  const farBlur = lerp(9, 0.6, foc), midBlur = lerp(6, 4, foc), nearBlur = lerp(0, 7, foc);
  const far = mixRamp('cur', 'red', 0.1 * foc);
  // the phone, held at the lap; it drops a little when the eyes leave it, and buzzes with the notification
  const buzz = (T > NOTE_T ? Math.exp(-(T - NOTE_T) * 6) : 0) * Math.sin((T - NOTE_T) * 90);
  const ePh = PITCH_PHONE + 0.012 - 0.05 * look;
  const P = { x: 962 + 7 * osc(T, 4.1) + 5 * buzz, y: Yp(ePh, p) + 4 * osc(T, 3.3, 0.2), s: 0.92, rot: -3 + 1.1 * osc(T, 5.2) + 2.4 * buzz };
  const L = feedLayout(ITEMS, feedScroll(T), T), fc = feedCards(L, { dots: true });
  const bn = banner(T);
  const shine = 1 + 0.6 * pop(T, NOTE_T, 0.2) * (1 - g01(T, NOTE_T + 0.4, NOTE_T + 1.4));
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
        <Blur id="povNear" s={nearBlur} />
      </defs>
      {/* far: the wall, the window, a picture, the sideboard, the TV's glow */}
      <g filter="url(#povFar)">
        <rect x="-400" y="-700" width="2720" height="2500" fill={v(0.1)} />
        <rect x="-400" y={wy} width="2720" height={wh} fill={v(0.17)} />
        <ellipse cx="960" cy={tvy + tvh * 0.5} rx={760} ry={tvh * 1.25} fill={v(0.3 * fl)} />
        <ellipse cx="960" cy={tvy + tvh * 0.5} rx={500} ry={tvh * 0.85} fill={v(0.42 * fl)} />
        <rect x="1500" y={wiy} width="300" height={wih} fill={v(0.24)} />
        <rect x="1520" y={wiy + 16} width="260" height={wih - 32} fill={v(0.07)} />
        <rect x="1644" y={wiy + 16} width="12" height={wih - 32} fill={v(0.22)} />
        <path d={`M 1480 ${wiy - 20} L 1560 ${wiy - 20} Q 1540 ${wiy + wih * 0.6} 1570 ${wiy + wih + 60} L 1470 ${wiy + wih + 60} Z`} fill={v(0.26)} />
        <rect x="150" y={piy} width="230" height={pih} fill={v(0.12)} stroke={v(0.3)} strokeWidth="12" />
        <rect x="-400" y={wy + wh - 18} width="2720" height="18" fill={v(0.1)} />
        <rect x="-400" y={wy + wh} width="2720" height="1600" fill={v(0.12)} />
        <rect x="520" y={sby} width="880" height={sbh} fill={v(0.2)} />
        <rect x="520" y={sby} width="880" height={sbh * 0.14} fill={v(0.34 * fl)} />
        <rect x="560" y={sby + sbh * 0.3} width="380" height={sbh * 0.5} fill={v(0.15)} /><rect x="980" y={sby + sbh * 0.3} width="380" height={sbh * 0.5} fill={v(0.15)} />
        <path d={`M 1300 ${sby} q -50 ${-sbh * 1.2} -10 ${-sbh * 2.2} q 30 ${sbh} 30 ${sbh * 2.2} Z M 1320 ${sby} q 40 ${-sbh * 1.5} 80 ${-sbh * 1.9} q -40 ${sbh * 0.8} -60 ${sbh * 1.9} Z`} fill={v(0.2)} />
        <rect x="1290" y={sby - sbh * 0.3} width="50" height={sbh * 0.3} fill={v(0.3)} />
        <rect x={tv[0] - 14} y={tv[1] - 14} width={tv[2] + 28} height={tv[3] + 28} rx="6" fill={v(0.06)} />
      </g>
      <g filter="url(#povTV)">
        <g transform={`translate(${tv[0]} ${tv[1]}) scale(1 ${tv[3] / 400})`}><TVNews w={tv[2]} h={400} T={T} kind={T < CUT_T ? 'podium' : 'anchor'} /></g>
      </g>
      {moths.length > 0 && <g filter="url(#povTV)">{moths}</g>}
      {/* mid: the coffee table and the rug; the phone's glow on the lap */}
      <g filter="url(#povMid)">
        <ellipse cx="960" cy={cty + cth + cfh} rx="1100" ry={(cth + cfh) * 1.6} fill={v(0.16)} />
        <rect x="380" y={cty} width="1160" height={cth} rx="10" fill={v(0.3 + 0.05 * fl)} />
        <rect x="380" y={cty + cth} width="1160" height={cfh} fill={v(0.13)} />
        <rect x="560" y={cty + cth * 0.3} width="90" height={cth * 0.4} rx="8" fill={v(0.5)} />
        <rect x="1230" y={cty + cth * 0.45} width="150" height={cth * 0.22} rx="6" fill={v(0.22)} />
        <ellipse cx={P.x} cy={P.y + 260} rx={560} ry={300} fill={v(0.3 * shine)} />
        <rect x="-400" y={cfy + cfh} width="2720" height="1600" fill={v(0.24)} />
        <ellipse cx={P.x} cy={P.y + 320} rx={700} ry={360} fill={v(0.3 * shine)} />
      </g>
      {/* near: the sofa's arms at the edges, far out of focus */}
      <g filter="url(#povNearSet)">
        <path d={`M -400 ${Yp(-0.42, p)} Q 120 ${Yp(-0.44, p)} 170 ${Yp(-0.6, p)} L 140 ${Yp(-1.2, p)} L -400 ${Yp(-1.2, p)} Z`} fill={v(0.2)} />
        <path d={`M 2320 ${Yp(-0.42, p)} Q 1800 ${Yp(-0.44, p)} 1750 ${Yp(-0.6, p)} L 1780 ${Yp(-1.2, p)} L 2320 ${Yp(-1.2, p)} Z`} fill={v(0.17)} />
      </g>
      {/* the phone and the hands (the curator phone shot's mitt), soft while the eyes are on the TV */}
      <g filter={nearBlur > 0.3 ? 'url(#povNear)' : undefined}>
        <PhoneDefs light={HAND_AT} reach={(640 + 80 * (shine - 1)) * 0.92} handRamp="cur" bf={k.bf} amp={k.amp} handAmp={k.amp * 0.35} region={[-400, -700, 2720, 2500]} />
        <g transform={handT}><g filter="url(#phTone)"><Mitt P={PH} tip={tipW} layer="back" /></g></g>
        <Phone P={P} id="pov"><Layers cur={cur} red={red} over={over} /></Phone>
        <g transform={handT}><g filter="url(#phToneF)"><Mitt P={PH} tip={tipW} layer="front" press={press} /></g></g>
      </g>
    </g>
  );
}
const HAND_AT = [960, 560];

// ── the eye ──────────────────────────────────────────────────────────────────
// A displacement map that bows the POV like a convex mirror: a point at radius r from the centre shows the POV at
// r·(1 + K·ρ²), ρ = r / RC. Baked once on a canvas. It covers the region MAP (POV coordinates).
const RC_EYE = 600, K_EYE = 0.55, S_EYE = 1200, MAP = [-200, -460, 2320, 2000];
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
function EyeView({ T, k, look }) {
  const E = [960, 540], er = 360, m = er / RC_EYE;
  // camera locked on the eye: when the eye turns up, the face around it moves down a little, and the light on the
  // skin moves from the phone below to the TV in front
  const dy = 34 * look;
  return (
    <g>
      <defs>
        <radialGradient id="eyeSkin" cx="0.3" cy={0.8 - 0.22 * look} r="0.85">
          <stop offset="0" stopColor={v(0.9)} /><stop offset="0.35" stopColor={v(0.62)} /><stop offset="0.7" stopColor={v(0.36)} /><stop offset="1" stopColor={v(0.18)} />
        </radialGradient>
        <radialGradient id="eyeBall" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={RC[0]} stopOpacity="0.15" /><stop offset="0.6" stopColor={RC[0]} stopOpacity="0.25" /><stop offset="1" stopColor={RC[0]} stopOpacity="0.97" />
        </radialGradient>
        <clipPath id="eyeClip"><circle cx={E[0]} cy={E[1]} r={er} /></clipPath>
        <filter id="eyeFish" filterUnits="userSpaceOnUse" x={MAP[0]} y={MAP[1]} width={MAP[2]} height={MAP[3]} colorInterpolationFilters="sRGB">
          <feImage href={FISH} x={MAP[0]} y={MAP[1]} width={MAP[2]} height={MAP[3]} preserveAspectRatio="none" result="map" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale={S_EYE} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="2.2" />
        </filter>
        <GradeBlur id="eyeSkinTone" ramp="cur" />
      </defs>
      <rect x="-200" y="-200" width="2320" height="1480" fill={RC[1]} />
      <g transform={`translate(0 ${dy})`}>
        <g filter="url(#eyeSkinTone)"><circle cx="1500" cy="560" r="1300" fill="url(#eyeSkin)" /></g>
      </g>
      <circle cx={E[0]} cy={E[1]} r={er} fill={RC[0]} />
      <g clipPath="url(#eyeClip)">
        <g opacity="0.85" transform={`translate(${E[0]} ${E[1]}) scale(${-m} ${m}) translate(-960 -540)`}>
          <g filter="url(#eyeFish)"><POV T={T} k={k} look={look} /></g>
        </g>
        <circle cx={E[0]} cy={E[1]} r={er} fill="url(#eyeBall)" />
        <path d={`M ${E[0] - 236} ${E[1] - 160} Q ${E[0] - 190} ${E[1] - 254} ${E[0] - 90} ${E[1] - 290} Q ${E[0] - 168} ${E[1] - 222} ${E[0] - 208} ${E[1] - 130} Z`} fill={RC[6]} opacity="0.8" />
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
