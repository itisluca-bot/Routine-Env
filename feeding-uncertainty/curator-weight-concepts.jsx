// Feeding Uncertainty — the curator's "weight of vulnerability" shot: round-1 concept frames (still images to evaluate).
// Replaces the vulnerability alley in the curator's part, after the curator at the table. The line, for reference only:
// "They bear the weight of vulnerability, produced by the ongoing crisis, by platforms built to keep you scrolling,
// and inequality in who gets heard."
// Two families of ideas: a living room lit by screens (TV, phones, the whole family each on their own), and the
// impression it all makes, seen as a reflection (in the eye, in a switched-off TV). In the toned look: the curator ramp
// is the world, screens are the lights, red comes in through the posts and the news on the TV.
// Pick one with the Concept tweak or `--set concept=A`. Every frame is a pure function of T on a 4 s clock.
const { W, H, OUT_W, OUT_H, MOTION, osc, lerp, hash, cam } = window.FU_RIG;
const { RAMPS, v, LookDefs, ToneBean, BeanBust, PostValue, POST_KINDS } = window.FU_LOOK;
const { WarmPost, COMFORT_KINDS } = window.FU_PHONE;
const { glide } = MOTION;
const R = RAMPS.cur;

const CONCEPTS = {
  A: 'A · Over the shoulder: the news on the TV, the phone in the lap',
  B: 'B · The family on the couch, each on their own phone',
  C: 'C · Black mirror: the TV is off, the room is in its glass',
  D: 'D · The eye: the feed reflected in the curator\'s eye',
  E: 'E · Close-up: screens in both eyes',
  F: 'F · Awake: the phone on the nightstand lights the ceiling',
  G: 'G · Surrounded: TV, laptop, tablet, phone',
  H: 'H · Endless scroll: the feed rises out of the phone',
};

// ── small value-art helpers ───────────────────────────────────────────────────
const blob = (cx, cy, rx, ry, x, op = 1, key) => <ellipse key={key} cx={cx} cy={cy} rx={rx} ry={ry} fill={v(x)} opacity={op} />;
const flick = (T, k = 0) => 0.82 + 0.1 * osc(T, 0.53, k) + 0.08 * osc(T, 0.21, k + 0.3);   // a TV's restless light
const kindOf = (i) => POST_KINDS[(i * 4 + 1) % POST_KINDS.length];
// a back wall out of focus: wall, a glow, skirting, floor, a window, a picture, a floor lamp's halo
function Room({ wall = 0.16, floorY = 860, win = [1380, 220, 260, 330], winX = 0.06, pic = [520, 300, 170, 130], glows = [] }) {
  const [wx, wy, ww, wh] = win || [];
  return (
    <g>
      <rect x="-200" y="-200" width="2320" height="1480" fill={v(wall)} />
      {glows.map((g, i) => blob(g[0], g[1], g[2], g[3], g[4], g[5] ?? 0.9, i))}
      <rect x="-200" y={floorY} width="2320" height="600" fill={v(wall * 0.6)} />
      <rect x="-200" y={floorY - 14} width="2320" height="14" fill={v(wall * 0.45)} />
      {win && <g>
        <rect x={wx - 14} y={wy - 14} width={ww + 28} height={wh + 28} fill={v(wall * 1.5)} />
        <rect x={wx} y={wy} width={ww} height={wh} fill={v(winX)} />
        <rect x={wx + ww / 2 - 6} y={wy} width="12" height={wh} fill={v(wall * 1.4)} />
        <rect x={wx} y={wy + wh * 0.4} width={ww} height="10" fill={v(wall * 1.4)} />
      </g>}
      {pic && <rect x={pic[0]} y={pic[1]} width={pic[2]} height={pic[3]} fill={v(wall * 0.55)} stroke={v(wall * 1.8)} strokeWidth="10" />}
    </g>
  );
}
// what is on the TV, in value, for the red grade: a politician at a podium, a lower third, a ticker; or an anchor
// with a chart. Local coords: the screen is 0..w × 0..h.
function TVNews({ w, h, T, kind = 'podium', id = 'tv' }) {
  const tick = (T * 60) % 160;
  return (
    <g clipPath={`url(#${id})`}>
      <clipPath id={id}><rect x="0" y="0" width={w} height={h} /></clipPath>
      <rect x="0" y="0" width={w} height={h} fill={v(0.36)} />
      <rect x="0" y="0" width={w} height={h * 0.62} fill={v(0.42)} />
      {kind === 'podium' ? (
        <g>
          {[0.14, 0.3, 0.7, 0.86].map((f, i) => <rect key={i} x={w * f - 10} y={h * 0.08} width="20" height={h * 0.5} fill={v(i % 2 ? 0.5 : 0.3)} />)}
          <path d={`M ${w * 0.5 - h * 0.17} ${h * 0.75} A ${h * 0.17} ${h * 0.24} 0 0 1 ${w * 0.5 + h * 0.17} ${h * 0.75} Z`} fill={v(0.22)} />
          <circle cx={w * 0.5} cy={h * 0.33} r={h * 0.12} fill={v(0.22)} />
          <path d={`M ${w * 0.5 - h * 0.2} ${h * 0.82} L ${w * 0.5 + h * 0.2} ${h * 0.82} L ${w * 0.5 + h * 0.15} ${h * 0.52} L ${w * 0.5 - h * 0.15} ${h * 0.52} Z`} fill={v(0.62)} />
          <circle cx={w * 0.5} cy={h * 0.62} r={h * 0.04} fill={v(0.9)} />
          <rect x={w * 0.5 - 2} y={h * 0.44} width="4" height={h * 0.09} fill={v(0.15)} />
        </g>
      ) : (
        <g>
          <path d={`M ${w * 0.22 - h * 0.2} ${h * 0.75} A ${h * 0.2} ${h * 0.28} 0 0 1 ${w * 0.22 + h * 0.2} ${h * 0.75} Z`} fill={v(0.2)} />
          <circle cx={w * 0.22} cy={h * 0.3} r={h * 0.13} fill={v(0.2)} />
          <rect x={w * 0.48} y={h * 0.1} width={w * 0.44} height={h * 0.46} rx="6" fill={v(0.28)} />
          <path d={`M ${w * 0.52} ${h * 0.2} L ${w * 0.62} ${h * 0.26} L ${w * 0.7} ${h * 0.22} L ${w * 0.78} ${h * 0.4} L ${w * 0.88} ${h * 0.48}`} fill="none" stroke={v(0.95)} strokeWidth={h * 0.025} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      <rect x="0" y={h * 0.75} width={w} height={h * 0.13} fill={v(0.9)} />
      <rect x={w * 0.03} y={h * 0.785} width={w * 0.1} height={h * 0.06} fill={v(0.32)} />
      <rect x={w * 0.16} y={h * 0.79} width={w * 0.5} height={h * 0.05} fill={v(0.5)} />
      <rect x="0" y={h * 0.88} width={w} height={h * 0.12} fill={v(0.2)} />
      {Array.from({ length: 6 }, (_, i) => <rect key={i} x={((i * 160 - tick) % (w + 160)) - 20} y={h * 0.915} width={60 + 50 * hash(i)} height={h * 0.05} fill={v(0.7)} />)}
      <circle cx={w * 0.94} cy={h * 0.08} r={h * 0.035} fill={v(0.95)} />
    </g>
  );
}
// a flat TV seen face on: bezel in value (for the room grade), screen content drawn separately into the red grade
function TVSet({ x, y, w, h, stand = true, val = 0.1 }) {
  return (
    <g>
      {stand && <rect x={x + w / 2 - 50} y={y + h + 10} width="100" height="14" fill={v(val * 1.4)} />}
      {stand && <rect x={x + w / 2 - 8} y={y + h} width="16" height="14" fill={v(val)} />}
      <rect x={x - 12} y={y - 12} width={w + 24} height={h + 24} rx="6" fill={v(val)} />
    </g>
  );
}
// a sofa seen from the front: back, seat, arms. Figures sit between `back` and `front`
const sofaBack = (x0, x1, top, seat, val = 0.28) => (
  <g>
    <rect x={x0} y={top} width={x1 - x0} height={seat - top + 30} rx="34" fill={v(val)} />
    {[0, 1, 2].map((i) => <rect key={i} x={x0 + 30 + ((x1 - x0 - 60) / 3) * i + 6} y={top + 26} width={(x1 - x0 - 60) / 3 - 12} height={seat - top - 20} rx="26" fill={v(val * 1.18)} />)}
    <rect x={x0 + 20} y={seat - 6} width={x1 - x0 - 40} height="40" rx="14" fill={v(val * 1.35)} />
  </g>
);
const sofaFront = (x0, x1, seat, bottom, val = 0.22) => (
  <g>
    <rect x={x0 + 10} y={seat - 4} width={x1 - x0 - 20} height="52" rx="14" fill={v(val * 1.6)} />
    <rect x={x0} y={seat + 44} width={x1 - x0} height={bottom - seat - 44} rx="10" fill={v(val)} />
  </g>
);
const sofaArms = (x0, x1, top, bottom, val = 0.3) => (
  <g>
    <rect x={x0 - 60} y={top} width="90" height={bottom - top} rx="30" fill={v(val)} />
    <rect x={x1 - 30} y={top} width="90" height={bottom - top} rx="30" fill={v(val * 0.9)} />
  </g>
);
// a sofa seen from the side, for a figure facing +x sitting on it at (x, floor y); its back is behind the figure
function SofaSide({ x, y, s = 1, val = 0.26 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-60" y="-210" width="46" height="196" rx="20" fill={v(val)} />
      <rect x="-56" y="-62" width="130" height="34" rx="12" fill={v(val * 1.35)} />
      <rect x="-62" y="-34" width="140" height="28" rx="6" fill={v(val * 0.8)} />
      <rect x="-54" y="-8" width="8" height="8" fill={v(val * 0.5)} />
      <rect x="62" y="-8" width="8" height="8" fill={v(val * 0.5)} />
    </g>
  );
}
// a phone held in front of a front-view figure: we see its dark back and a lit rim
const phoneBack = (x, y, s = 1, rot = 0) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x="-8" y="-13" width="16" height="26" rx="3" fill={v(0.62)} />
    <rect x="-7" y="-12" width="14" height="24" rx="2.5" fill={v(0.08)} />
  </g>
);
// seated, side view, looking down at the phone
const SITPH = (T, ph = 0) => ({ hx: 0, lean: 10 + 1.4 * osc(T, 3.3, ph), tilt: 22 + 2 * osc(T, 2.7, ph), legN: [82, 84], legF: [78, 80],
  armN: [26 + osc(T, 3.3, ph), 100], armF: [20, 106], phone: 1 });
// a front-view figure on a sofa looking down at the phone in their lap. Returns the figure, its phone and its light
function couchSitter(T, { x, seat, s, ph = 0, hair = 'none', headScale = 1, lean = 0, id, extra = [], ba }) {
  const y = seat + 84 * s;
  const hand = [x + (lean * 0.9) * s, y - 142 * s];
  const pl = { x: hand[0], y: hand[1] - 20 * s, i: 0.95, reach: 90 * s };
  const pose = { lean: lean + 1.2 * osc(T, 3.6, ph), tilt: lean * 0.6 + 2 * osc(T, 2.9, ph + 0.2), look: [0.1 * osc(T, 2.2, ph), 1],
    armL: { to: [-7, -142] }, armR: { to: [7, -142] } };
  return {
    fig: <ToneBean {...ba} key={'f' + id} id={id} x={x} y={y} s={s} view="front" headScale={headScale} pose={pose} ramp="cur" hair={hair}
      lights={[pl, ...extra]} amb={0.26} />,
    phone: <g key={'p' + id}>{phoneBack(hand[0], hand[1], s * 1.05, lean * 0.5)}</g>,
    hand, pl,
  };
}
// the stage: 1920 × 1080 design scaled ×2 into the 4K stage
function Frame({ children, label, guide, bg }) {
  return (
    <div data-screen-label={label} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: bg, transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>{children}</svg>
      {guide && <div style={{ position: 'absolute', left: 48, top: 36, font: '700 34px "Open Sans", sans-serif', color: '#fff', textShadow: '0 1px 12px rgba(0,0,0,0.7)' }}>{label}</div>}
    </div>
  );
}

// ── A · Over the shoulder ─────────────────────────────────────────────────────
// We sit behind the curator on the couch. The TV fills the back of the room with the news (a politician at a podium,
// the lower third, the ticker); the phone in their lap glows round the edges of their back. Posts come off both screens.
function ConceptA({ k }) {
  const { T } = k;
  const CAM = cam(960, 540, glide(T, 0, 4, 1.0, 1.04));
  const tv = [640, 190, 760, 430], fl = flick(T);
  const tvL = { x: tv[0] + tv[2] / 2, y: tv[1] + tv[3] / 2, i: 0.75 * fl, reach: 800 };
  const cx = 780, seat = 900, s = 2.9, back = 700;
  const lap = { x: cx + 6, y: seat - 150, i: 0.9, reach: 260 };
  const posts = Array.from({ length: 9 }, (_, i) => {
    const h = (n) => hash(i * 7.3 + n * 2.9 + 4), t = (T * (0.08 + 0.05 * h(1)) + h(2)) % 1;
    const fromTV = i < 6;
    const x0 = fromTV ? tv[0] + tv[2] * (0.2 + 0.6 * h(3)) : cx + 60 * (h(3) - 0.5), y0 = fromTV ? tv[1] + tv[3] * 0.5 : back - 10;
    const x1 = fromTV ? lerp(200, 1720, h(4)) : cx + (h(4) > 0.5 ? 1 : -1) * (260 + 200 * h(5)), y1 = fromTV ? 120 + 500 * h(5) : 160 + 200 * h(6);
    return <PostValue key={i} kind={kindOf(i)} x={lerp(x0, x1, t)} y={lerp(y0, y1, t) + 14 * osc(T, 1.2 + h(6), h(7))} s={lerp(0.6, fromTV ? 1.8 : 1.3, t)} rot={-30 + 60 * h(8) + 10 * osc(T, 1.6)} flip={Math.cos(T * (2 + 2 * h(9)) + 6 * h(1))} />;
  });
  return (
    <g>
      <g filter="url(#fuGradeBg-cur)">
        <g transform={CAM}>
          <Room wall={0.12} floorY={700} win={[1560, 180, 220, 300]} pic={null} glows={[[1020, 410, 640, 380, 0.3 * fl], [1020, 720, 520, 70, 0.26 * fl]]} />
          <rect x="560" y="650" width="920" height="70" fill={v(0.1)} />
          <TVSet x={tv[0]} y={tv[1]} w={tv[2]} h={tv[3]} stand={false} />
        </g>
      </g>
      <g filter="url(#fuGradeFg-red)"><g transform={CAM}><g transform={`translate(${tv[0]} ${tv[1]})`}><TVNews w={tv[2]} h={tv[3]} T={T} id="tvA" /></g></g></g>
      <g transform={CAM}>
        <ToneBean {...k.ba} id={1} x={cx} y={seat + 92 * s} s={s} view="front" eyes={false} ramp="cur" hair="none"
          pose={{ lean: -3 + osc(T, 3.4), tilt: -4 + 1.5 * osc(T, 2.6), look: [0, 0], armL: null, armR: null }} lights={[tvL, lap]} amb={0.22} />
      </g>
      <g filter="url(#fuGradeFg-cur)">
        <g transform={CAM}>
          <rect x="140" y={back} width="1640" height="400" rx="40" fill={v(0.17)} />
          <rect x="160" y={back} width="1600" height="26" rx="13" fill={v(0.24)} />
          <clipPath id="aBack"><rect x="140" y={back} width="1640" height="400" rx="40" /></clipPath>
          <g clipPath="url(#aBack)">
            <ellipse cx={cx + 6} cy={back - 30} rx={460} ry={150} fill={v(0.26)} />
            <ellipse cx={cx + 6} cy={back - 20} rx={260} ry={70} fill={v(0.38)} />
          </g>
        </g>
      </g>
      <g filter="url(#fuGradeFg-red)"><g transform={CAM}>{posts}</g></g>
    </g>
  );
}

// ── B · The family on the couch ──────────────────────────────────────────────
// The curator's answer to the open engagers' dinner table: the whole family on one sofa, the TV on in front of them
// (where the camera is), and each of them alone with their own phone. Each phone throws its own post up into the room.
function ConceptB({ k }) {
  const { T } = k;
  const CAM = cam(960, 640, glide(T, 0, 4, 1.32, 1.38));
  const seat = 760, fl = flick(T, 0.4);
  const tvL = { dir: [0.1, 0.45], i: 0.28 * fl };
  const fam = [
    { x: 640, s: 1.25, hair: 'none', lean: -4, ph: 0 },
    { x: 870, s: 1.2, hair: 'long', lean: 3, ph: 0.3 },
    { x: 1090, s: 1.0, hair: 'beanie', lean: -2, ph: 0.6, headScale: 1.15 },
    { x: 1285, s: 0.78, hair: 'none', lean: 5, ph: 0.8, headScale: 1.3 },
  ].map((p, i) => couchSitter(T, { ...p, seat, id: i + 1, extra: [tvL], ba: k.ba }));
  const posts = fam.map((f, i) => {
    const t = (T * 0.22 + i * 0.27) % 1, h = (n) => hash(i * 5.7 + n);
    return <PostValue key={i} kind={kindOf(i + 2)} x={f.hand[0] + 30 * (h(1) - 0.5) + 60 * t * (i % 2 ? 1 : -1)} y={f.hand[1] - 150 - 200 * t} s={lerp(0.7, 1.5, t)} rot={-16 + 32 * h(2) + 8 * osc(T, 1.4, i * 0.2)} flip={Math.cos(T * 1.6 + i)} op={Math.min(1, t * 5)} />;
  });
  return (
    <g>
      <g filter="url(#fuGradeBg-cur)">
        <g transform={CAM}>
          <Room wall={0.14} floorY={920} win={[1460, 260, 230, 300]} pic={[840, 300, 220, 150]} glows={[[960, 560, 760, 300, 0.26 * fl], [300, 520, 160, 300, 0.36]]} />
          <rect x="270" y="380" width="60" height="16" fill={v(0.5)} />
        </g>
      </g>
      <g filter="url(#fuGradeFg-cur)"><g transform={CAM}>{sofaBack(470, 1450, 520, seat, 0.24)}</g></g>
      <g transform={CAM}>{fam.map((f) => f.fig)}</g>
      <g filter="url(#fuGradeFg-cur)">
        <g transform={CAM}>
          {sofaFront(470, 1450, seat, 940, 0.2)}
          {fam.map((f) => f.phone)}
          {sofaArms(470, 1450, 640, 940, 0.26)}
        </g>
      </g>
      <g filter="url(#fuGradeFg-red)"><g transform={CAM}>{posts}</g></g>
      <g filter="url(#fuGradeBg-cur)">
        <g transform={CAM}>
          <rect x="420" y="860" width="1080" height="40" rx="8" fill={v(0.3)} />
          <rect x="440" y="896" width="1040" height="200" fill={v(0.12)} />
          <rect x="720" y="838" width="110" height="24" rx="6" fill={v(0.4)} />
          <rect x="1180" y="826" width="44" height="40" rx="8" fill={v(0.48)} />
        </g>
      </g>
    </g>
  );
}

// ── C · Black mirror ─────────────────────────────────────────────────────────
// The TV is off. Its dark glass fills the frame and holds the room: the curator on the sofa, small, their face lit by
// the phone, the posts round them faint. A sheen crosses the glass. The only bright thing is the phone.
function ConceptC({ k }) {
  const { T } = k;
  const CAM = cam(960, 560, glide(T, 0, 4, 1.0, 1.03));
  const seat = 640, f = couchSitter(T, { x: 960, seat, s: 1.5, hair: 'none', lean: -3, id: 1, ba: k.ba, extra: [{ dir: [0.3, 0.5], i: 0.1 }] });
  const posts = Array.from({ length: 7 }, (_, i) => {
    const h = (n) => hash(i * 3.9 + n * 1.7 + 11), a = T * (0.3 + 0.2 * h(1)) + 6.28 * h(2);
    return <PostValue key={i} kind={kindOf(i)} x={960 + (200 + 160 * h(3)) * Math.cos(a)} y={420 + 70 * Math.sin(a) + 10 * osc(T, 1.3, h(4))} s={0.7 + 0.3 * h(5)} rot={-30 + 60 * h(6)} flip={Math.cos(T * 2 + 6 * h(7))} outline={i % 3 !== 0} />;
  });
  const glass = [190, 110, 1540, 860];
  return (
    <g>
      <clipPath id="cGlass"><rect x={glass[0]} y={glass[1]} width={glass[2]} height={glass[3]} rx="6" /></clipPath>
      <g filter="url(#fuGradeBg-cur)"><Room wall={0.1} floorY={900} win={null} pic={null} glows={[[960, 560, 900, 500, 0.12]]} /></g>
      <g filter="url(#fuGradeFg-cur)">
        <rect x={glass[0] - 40} y={glass[1] - 40} width={glass[2] + 80} height={glass[3] + 80} rx="14" fill={v(0.07)} />
        <rect x={glass[0] - 40} y={glass[1] - 40} width={glass[2] + 80} height="6" fill={v(0.2)} />
        <rect x={glass[0]} y={glass[1]} width={glass[2]} height={glass[3]} fill={v(0.03)} />
        <rect x={glass[0] + glass[2] - 120} y={glass[1] + glass[3] + 18} width="40" height="5" rx="2" fill={v(0.3)} />
      </g>
      <g clipPath="url(#cGlass)" opacity="0.8">
        <g transform={CAM}>
          <g filter="url(#cMirrorBg)">
            <Room wall={0.12} floorY={800} win={[1340, 230, 220, 280]} winX={0.16} pic={[560, 260, 180, 120]} glows={[[960, 480, 260, 220, 0.22]]} />
          </g>
          <g filter="url(#cMirrorFg)">{sofaBack(600, 1320, 380, seat, 0.22)}</g>
          {f.fig}
          <g filter="url(#cMirrorFg)">
            {sofaFront(600, 1320, seat, 820, 0.14)}
            {f.phone}
            {sofaArms(600, 1320, 500, 820, 0.18)}
          </g>
          <g filter="url(#fuGradeFg-red)">{posts}</g>
        </g>
      </g>
      <g clipPath="url(#cGlass)" filter="url(#fuGradeBg-cur)">
        <path d={`M ${1100 + 200 * osc(T, 8)} 0 L ${1340 + 200 * osc(T, 8)} 0 L ${780 + 200 * osc(T, 8)} 1080 L ${540 + 200 * osc(T, 8)} 1080 Z`} fill={v(0.5)} opacity="0.12" />
        <path d={`M ${1420 + 200 * osc(T, 8)} 0 L ${1470 + 200 * osc(T, 8)} 0 L ${910 + 200 * osc(T, 8)} 1080 L ${860 + 200 * osc(T, 8)} 1080 Z`} fill={v(0.6)} opacity="0.1" />
      </g>
    </g>
  );
}

// ── D · The eye ──────────────────────────────────────────────────────────────
// Macro: the side of the curator's round head fills the frame; the eye, still a crisp dark disc, is huge, and in it
// the phone they are looking at, bowed by the curve of the eye: the feed scrolling, red posts among warm ones, the TV
// behind them as a small bright rectangle. The impression the feed makes, seen from outside.
function ConceptD({ k }) {
  const { T } = k;
  const z = glide(T, 0, 4, 1.0, 1.05);
  const Z = `translate(1010 540) scale(${z}) translate(-1010 -540)`;
  const E = [1010, 540], er = 330;
  const scroll = (T * 40) % 120;
  const feed = Array.from({ length: 6 }, (_, i) => ({ y: -150 + i * 92 - scroll, red: [1, 4].includes(i), kind: i }));
  return (
    <g>
      <defs>
        <radialGradient id="dSkin" cx="0.28" cy="0.78" r="0.85">
          <stop offset="0" stopColor={v(0.9)} /><stop offset="0.35" stopColor={v(0.62)} /><stop offset="0.7" stopColor={v(0.36)} /><stop offset="1" stopColor={v(0.18)} />
        </radialGradient>
        <radialGradient id="dBall" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={R[0]} stopOpacity="0" /><stop offset="0.62" stopColor={R[0]} stopOpacity="0.1" /><stop offset="1" stopColor={R[0]} stopOpacity="0.95" />
        </radialGradient>
        <clipPath id="dEye"><circle cx={E[0]} cy={E[1]} r={er} /></clipPath>
      </defs>
      <g transform={Z}>
        <g filter="url(#fuGradeBg-cur)">
          <rect x="-200" y="-200" width="2320" height="1480" fill={v(0.08)} />
          {blob(140, 860, 260, 200, 0.3)}
        </g>
        <g filter="url(#dSkinTone)">
          <circle cx="1560" cy="560" r="1330" fill="url(#dSkin)" />
        </g>
        <circle cx={E[0]} cy={E[1]} r={er} fill={R[0]} />
        <g clipPath="url(#dEye)">
          <g transform={`translate(${E[0]} ${E[1]})`}>
            <g filter="url(#dRefl)">
              <path d="M -330 -110 Q -60 -150 250 -80 L 330 -80 L 330 330 L -330 330 Z" fill={v(0.12)} />
              <path d="M 140 -240 Q 200 -246 262 -236 L 270 -150 Q 210 -158 146 -152 Z" fill={v(0.36)} />
              <g transform="rotate(-7)">
                <path d="M -128 -205 Q 0 -222 128 -205 Q 140 0 128 205 Q 0 222 -128 205 Q -140 0 -128 -205 Z" fill={v(0.2)} />
                <path d="M -112 -186 Q 0 -200 112 -186 Q 123 0 112 186 Q 0 200 -112 186 Q -123 0 -112 -186 Z" fill={v(0.78)} />
              </g>
            </g>
            <g transform="rotate(-7)">
              <clipPath id="dScreen"><path d="M -112 -186 Q 0 -200 112 -186 Q 123 0 112 186 Q 0 200 -112 186 Q -123 0 -112 -186 Z" /></clipPath>
              <g clipPath="url(#dScreen)">
                <g filter="url(#dReflFg)">
                  {feed.filter((c) => !c.red).map((c, i) => <WarmPost key={i} kind={COMFORT_KINDS[(c.kind * 3) % COMFORT_KINDS.length]} x={0} y={c.y} s={2.0} sy={0.98} />)}
                </g>
                <g filter="url(#fuGradeFg-red)">
                  {feed.filter((c) => c.red).map((c, i) => <PostValue key={i} kind={kindOf(c.kind)} x={0} y={c.y} s={2.0} />)}
                </g>
              </g>
            </g>
            <g filter="url(#fuGradeFg-red)">
              {Array.from({ length: 5 }, (_, i) => {
                const h = (n) => hash(i * 4.1 + n * 2.3 + 2), t = (T * (0.12 + 0.05 * h(1)) + h(2)) % 1;
                const a = lerp(-2.4, 0.9, t) + 0.6 * h(3), rr = 190 + 90 * h(4);
                return <PostValue key={i} kind={kindOf(i + 5)} x={rr * Math.cos(a)} y={rr * Math.sin(a) * 0.9} s={0.9 + 0.5 * h(5)} rot={(a * 180) / Math.PI + 90} flip={Math.cos(T * 2.4 + 6 * h(6))} op={0.8} />;
              })}
            </g>
          </g>
          <circle cx={E[0]} cy={E[1]} r={er} fill="url(#dBall)" />
          <path d={`M ${E[0] - 210} ${E[1] - 150} Q ${E[0] - 170} ${E[1] - 230} ${E[0] - 80} ${E[1] - 262} Q ${E[0] - 150} ${E[1] - 200} ${E[0] - 186} ${E[1] - 120} Z`} fill={R[6]} opacity="0.85" />
        </g>
      </g>
    </g>
  );
}

// ── E · Close-up, screens in both eyes ───────────────────────────────────────
// The curator in close-up (BeanBust), lit from below by the phone and from the side by the TV's flicker. In each eye a
// small bright rectangle with a red fleck. Big posts pass out of focus in the foreground.
function ConceptE({ k }) {
  const { T } = k;
  const z = glide(T, 0, 4, 1.0, 1.06), Z = `translate(960 540) scale(${z}) translate(-960 -540)`;
  const s = 1.85, bx = 960, by = 540 + 744 * s + 40, turn = -0.12;
  const fl = flick(T, 0.7);
  const nod = 4, r = 26 * 9, Hc = [6 * turn * 9, 300 - 116 * 9 + 10 * nod];
  const eye = (sd) => [bx + s * (Hc[0] + turn * 0.42 * r + sd * 0.32 * r), by + s * (Hc[1] - 0.04 * r)];
  const er = r * 0.066 * s;
  return (
    <g>
      <g transform={Z}>
        <g filter="url(#fuGradeBg-cur)">
          <rect x="-200" y="-200" width="2320" height="1480" fill={v(0.1)} />
          {blob(1720, 420, 300, 420, 0.42 * fl)}
          {blob(240, 300, 160, 240, 0.2)}
        </g>
        <BeanBust {...k.ba} id={1} x={bx} y={by} s={s} ramp="cur" turn={turn} hair="long" tilt={0} nod={nod}
          lights={[{ x: 960, y: 1150, i: 0.95, reach: 520 }, { x: 1900, y: 420, i: 0.5 * fl, reach: 900 }]} amb={0.22} />
        {[-1, 1].map((sd) => {
          const e = eye(sd);
          return (
            <g key={sd} transform={`translate(${e[0] + er * 0.06} ${e[1] + er * 0.12}) rotate(-6)`}>
              <rect x={-er * 0.34} y={-er * 0.44} width={er * 0.68} height={er * 0.96} rx={er * 0.1} fill={R[5]} />
              <rect x={-er * 0.26} y={-er * 0.34} width={er * 0.52} height={er * 0.3} rx={er * 0.04} fill={RAMPS.red[3]} />
              <rect x={-er * 0.26} y={er * 0.06} width={er * 0.52} height={er * 0.3} rx={er * 0.04} fill={R[3]} />
              <circle cx={-er * 0.5} cy={-er * 0.55} r={er * 0.13} fill={R[6]} />
            </g>
          );
        })}
      </g>
      <g filter="url(#eNear)">
        {[0, 1].map((i) => {
          const t = (T * (0.18 + 0.06 * i) + 0.4 * i) % 1;
          return <PostValue key={i} kind={kindOf(i + 3)} x={lerp(i ? -300 : 2200, i ? 2200 : -300, t)} y={i ? 900 : 180} s={6 + 2 * i} rot={-20 + 40 * i + 10 * osc(T, 1.4)} flip={Math.cos(T * 1.2 + i)} />;
        })}
      </g>
    </g>
  );
}

// ── F · Awake ────────────────────────────────────────────────────────────────
// Night. The curator lies in bed, eyes open. The phone lies face up on the nightstand; a notification lights it and
// throws a pool of light onto the ceiling, where a post hangs. More posts drift in the dark as outlines.
function ConceptF({ k }) {
  const { T } = k;
  const CAM = cam(960, 560, glide(T, 0, 4, 1.0, 1.04));
  const ph = [450, 694], pulse = 0.75 + 0.25 * Math.max(0, osc(T, 2, 0.1));
  const ceil = [520, 170];
  // the figure lies on its back, head to the left: drawn upright and rotated -90° about its origin (fx, fy); lights are
  // given in its unrotated frame
  const fx = 935, fy = 646, s = 1.3;
  const unrot = (L) => ({ ...L, x: fx - (L.y - fy), y: fy + (L.x - fx) });
  const lights = [unrot({ x: ph[0], y: ph[1] - 30, i: 0.85 * pulse, reach: 360 }), unrot({ x: ceil[0], y: ceil[1], i: 0.35 * pulse, reach: 600 })];
  const pose = { hx: 0, lean: 0, tilt: -14, legN: [0, 0], legF: [0, 0], armN: [8, 6], armF: [4, 4], phone: 0 };
  const posts = Array.from({ length: 6 }, (_, i) => {
    const h = (n) => hash(i * 6.3 + n * 1.9 + 21), a = T * (0.2 + 0.1 * h(1)) * (h(2) > 0.5 ? 1 : -1) + 6.28 * h(3);
    return <PostValue key={i} kind={kindOf(i)} x={1080 + (300 + 380 * h(4)) * Math.cos(a)} y={300 + 90 * h(5) * Math.sin(a)} s={1.1 + 0.4 * h(6)} rot={-30 + 60 * h(7)} flip={Math.cos(T * 1.8 + 6 * h(8))} outline />;
  });
  return (
    <g>
      <g filter="url(#fuGradeBg-cur)">
        <g transform={CAM}>
          <rect x="-200" y="-200" width="2320" height="1480" fill={v(0.07)} />
          <rect x="-200" y="-200" width="2320" height={ceil[1] + 200} fill={v(0.05)} />
          {blob(ceil[0], ceil[1] + 160, 420, 330, 0.3 * pulse)}
          <rect x="1460" y="260" width="200" height="300" fill={v(0.12)} />
          <rect x="1554" y="260" width="12" height="300" fill={v(0.06)} />
          <rect x="-200" y="940" width="2320" height="400" fill={v(0.05)} />
        </g>
      </g>
      <g filter="url(#fuGradeFg-cur)">
        <g transform={CAM}>
          <ellipse cx={ceil[0]} cy={ceil[1] + 6} rx={300 * pulse} ry="44" fill="url(#fuPool)" />
          <path d={`M ${ph[0] - 16} ${ph[1] - 4} L ${ph[0] + 16} ${ph[1] - 4} L ${ceil[0] + 260} ${ceil[1] + 12} L ${ceil[0] - 260} ${ceil[1] + 12} Z`} fill={v(0.6)} opacity={0.14 * pulse} />
          <rect x="350" y="700" width="190" height="240" rx="6" fill={v(0.14)} />
          <rect x="350" y="700" width="190" height="14" fill={v(0.3)} />
          <rect x="370" y="760" width="150" height="6" fill={v(0.07)} />
          <rect x={ph[0] - 34} y={ph[1] - 7} width="68" height="9" rx="3" fill={v(0.2)} />
          <rect x={ph[0] - 30} y={ph[1] - 9} width="60" height="4" rx="2" fill={v(0.98 * pulse)} />
          <rect x="556" y="580" width="40" height="360" rx="8" fill={v(0.2)} />
          <rect x="560" y="690" width="1000" height="90" rx="20" fill={v(0.3)} />
          <rect x="580" y="780" width="960" height="160" fill={v(0.12)} />
          <rect x="1540" y="640" width="36" height="300" rx="8" fill={v(0.18)} />
          <path d="M 600 690 Q 600 632 660 628 L 790 632 Q 830 640 830 690 Z" fill={v(0.6)} />
        </g>
      </g>
      <g transform={CAM}>
        <g transform={`rotate(-90 ${fx} ${fy})`}>
          <ToneBean {...k.ba} id={1} x={fx} y={fy} s={s} pose={pose} ramp="cur" hair="none" lights={lights} amb={0.2} />
        </g>
      </g>
      <g filter="url(#fuGradeFg-cur)">
        <g transform={CAM}>
          <path d={`M 760 694 Q 770 ${592 + 2 * osc(T, 4)} 860 ${590 + 2 * osc(T, 4)} Q 1000 ${596 + 3 * osc(T, 4)} 1120 618 Q 1300 600 1440 640 Q 1500 650 1520 700 L 1540 760 L 760 760 Z`} fill={v(0.42)} />
          <path d="M 760 700 Q 900 690 1060 702 Q 1260 712 1530 700 L 1540 760 L 760 760 Z" fill={v(0.3)} />
        </g>
      </g>
      <g filter="url(#fuGradeFg-red)">
        <g transform={CAM}>
          {posts}
          <PostValue kind="alert" x={ceil[0] + 30 * osc(T, 3.2)} y={ceil[1] + 70 + 8 * osc(T, 1.6)} s={1.6} rot={8 * osc(T, 2.4)} flip={0.7 + 0.3 * osc(T, 1.3)} />
          <rect x={ph[0] - 16} y={ph[1] - 9} width="32" height="4" rx="2" fill={v(0.8)} opacity={pulse} />
        </g>
      </g>
    </g>
  );
}

// ── G · Surrounded ───────────────────────────────────────────────────────────
// The curator sits on the floor behind a low table, in the middle of their screens: the TV on the left wall, a tablet
// on the right, the laptop on the table, the phone in their hands. Each screen is a light, so the bands come from all
// sides, and each sends its posts toward them.
function ConceptG({ k }) {
  const { T } = k;
  const CAM = cam(960, 560, glide(T, 0, 4, 1.0, 1.04));
  const fl = flick(T, 0.2);
  const tv = [130, 280, 440, 260], tab = [1500, 500, 170, 230], lap = [1250, 800];
  const s = 2.0, seat = 790;
  const f = couchSitter(T, { x: 960, seat, s, hair: 'beanie', lean: 0, id: 1, ba: k.ba,
    extra: [{ x: tv[0] + tv[2] / 2, y: tv[1] + tv[3] / 2, i: 0.55 * fl, reach: 520 }, { x: tab[0], y: tab[1] + tab[3] / 2, i: 0.5, reach: 420 }, { x: lap[0], y: lap[1] - 60, i: 0.5, reach: 360 }] });
  const stream = (from, n, seed) => Array.from({ length: n }, (_, i) => {
    const h = (q) => hash(i * 3.3 + q * 1.1 + seed), t = (T * (0.16 + 0.06 * h(1)) + h(2)) % 1;
    const to = [960 + 160 * (h(3) - 0.5), 440 + 120 * (h(4) - 0.5)];
    return <PostValue key={seed + '-' + i} kind={kindOf(i + seed)} x={lerp(from[0], to[0], t) + 40 * Math.sin(t * 6 + seed)} y={lerp(from[1], to[1], t) - 120 * Math.sin(t * Math.PI)} s={lerp(1.1, 0.7, t)} rot={-30 + 60 * h(5)} flip={Math.cos(T * 2.2 + 6 * h(6))} op={Math.min(1, (1 - t) * 4)} />;
  });
  return (
    <g>
      <g filter="url(#fuGradeBg-cur)">
        <g transform={CAM}>
          <Room wall={0.1} floorY={880} win={[1100, 140, 200, 240]} winX={0.05} pic={null} glows={[[tv[0] + 210, 430, 420, 320, 0.3 * fl], [tab[0] + 80, 640, 300, 300, 0.26], [960, 700, 360, 200, 0.26]]} />
        </g>
      </g>
      <g filter="url(#fuGradeFg-cur)">
        <g transform={CAM}>
          <TVSet x={tv[0]} y={tv[1]} w={tv[2]} h={tv[3]} stand={false} val={0.12} />
          <rect x={tab[0] - 10} y={tab[1] - 10} width={tab[2] + 20} height={tab[3] + 20} rx="14" fill={v(0.14)} />
          <rect x={tab[0]} y={tab[1]} width={tab[2]} height={tab[3]} rx="6" fill={v(0.62)} />
          <path d={`M ${tab[0] + 40} ${tab[1] + tab[3] + 10} L ${tab[0] + 10} ${tab[1] + tab[3] + 90} L ${tab[0] + 160} ${tab[1] + tab[3] + 90} Z`} fill={v(0.12)} />
          <rect x={tab[0] - 120} y={tab[1] + tab[3] + 90} width="420" height="20" fill={v(0.2)} />
        </g>
      </g>
      <g filter="url(#fuGradeFg-red)"><g transform={CAM}><g transform={`translate(${tv[0]} ${tv[1]})`}><TVNews w={tv[2]} h={tv[3]} T={T} kind="anchor" id="tvG" /></g></g></g>
      <g transform={CAM}>{f.fig}</g>
      <g filter="url(#fuGradeFg-cur)">
        <g transform={CAM}>
          {f.phone}
          <rect x="480" y={lap[1]} width="960" height="26" rx="6" fill={v(0.34)} />
          <rect x="500" y={lap[1] + 26} width="920" height="200" fill={v(0.16)} />
          <path d={`M ${lap[0] - 120} ${lap[1]} L ${lap[0] + 60} ${lap[1]} L ${lap[0] - 10} ${lap[1] - 150} L ${lap[0] - 150} ${lap[1] - 140} Z`} fill={v(0.2)} />
          <path d={`M ${lap[0] - 120} ${lap[1]} L ${lap[0] - 150} ${lap[1] - 140}`} stroke={v(0.75)} strokeWidth="4" />
          <path d={`M ${lap[0] - 120} ${lap[1]} L ${lap[0] + 60} ${lap[1]} L ${lap[0] + 70} ${lap[1] + 6} L ${lap[0] - 128} ${lap[1] + 6} Z`} fill={v(0.4)} />
          <rect x="640" y={lap[1] - 8} width="50" height="8" rx="3" fill={v(0.86)} />
        </g>
      </g>
      <g filter="url(#fuGradeFg-red)">
        <g transform={CAM}>
          <g transform={`translate(${tab[0]} ${tab[1]})`}><rect x="16" y="30" width={tab[2] - 32} height="70" rx="6" fill={v(0.56)} /><rect x="16" y="120" width={tab[2] - 32} height="12" fill={v(0.8)} /></g>
          {stream([tv[0] + tv[2], tv[1] + tv[3] / 2], 5, 1)}
          {stream([tab[0], tab[1] + 60], 4, 7)}
          {stream([lap[0] - 120, lap[1] - 120], 3, 13)}
          {stream([665, lap[1] - 10], 2, 19)}
        </g>
      </g>
    </g>
  );
}

// ── H · Endless scroll ───────────────────────────────────────────────────────
// The curator on the sofa, side view, looking down at the phone. Out of the phone the feed rises as a ribbon of cards,
// warm and red mixed, bending up and out of the top of the frame, and it never ends.
function ConceptH({ k }) {
  const { T } = k;
  const CAM = cam(980, 560, glide(T, 0, 4, 1.0, 1.04));
  const x = 700, y = 900, s = 1.9;
  const pose = SITPH(T);
  const phone = [x + 70 * s, y - 128 * s];
  const N = 22, flow = (T * 0.09) % (1 / N);
  const cards = Array.from({ length: N }, (_, i) => {
    const u = i / N + flow, p = Math.pow(u, 1.25);
    const cx = phone[0] + 8 + 1150 * p + 170 * Math.sin(p * 6.2), cy = phone[1] - 14 - 960 * Math.pow(u, 0.85) + 60 * Math.sin(p * 8);
    return { i, u, x: cx, y: cy, s: lerp(0.35, 3.4, Math.pow(u, 1.1)), rot: -18 + 30 * Math.sin(p * 4 + 1), red: hash(i * 3.7 + 1) > 0.62 };
  });
  return (
    <g>
      <g filter="url(#fuGradeBg-cur)">
        <g transform={CAM}>
          <Room wall={0.1} floorY={y} win={[1400, 240, 240, 320]} winX={0.05} pic={[300, 340, 150, 110]} glows={[[phone[0] + 120, phone[1] - 80, 380, 300, 0.2]]} />
        </g>
      </g>
      <g filter="url(#fuGradeFg-cur)"><g transform={CAM}><SofaSide x={x} y={y} s={s} val={0.22} /></g></g>
      <g transform={CAM}>
        <ToneBean {...k.ba} id={1} x={x} y={y} s={s} pose={pose} phone={1} ramp="cur" hair="long"
          lights={[{ x: phone[0] + 30, y: phone[1] - 60, i: 0.75, reach: 200 }, { dir: [-0.4, 0.8], i: 0.1 }]} amb={0.22} />
      </g>
      <g transform={CAM}>
        {cards.map((c) => (
          <g key={c.i} opacity={Math.min(1, c.u * 8)}>
            {c.red
              ? <g filter="url(#fuGradeFg-red)"><PostValue kind={kindOf(c.i)} x={c.x} y={c.y} s={c.s} rot={c.rot} /></g>
              : <g filter="url(#fuGradeFg-cur)"><WarmPost kind={COMFORT_KINDS[c.i % COMFORT_KINDS.length]} x={c.x} y={c.y} s={c.s} rot={c.rot} /></g>}
          </g>
        ))}
      </g>
    </g>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────
function ConceptPiece({ concept, guide, boil, boilAmp }) {
  const { T } = useComposition();
  const bf = Math.floor(T * 8), amp = boil ? boilAmp : 0;
  const k = { T, bf, amp, ba: { bf, amp } };
  const body = { A: <ConceptA k={k} />, B: <ConceptB k={k} />, C: <ConceptC k={k} />, D: <ConceptD k={k} />, E: <ConceptE k={k} />, F: <ConceptF k={k} />, G: <ConceptG k={k} />, H: <ConceptH k={k} /> }[concept] || <ConceptA k={k} />;
  return (
    <Frame label={CONCEPTS[concept] || concept} guide={guide} bg={R[0]}>
      <LookDefs ramps={['cur']} bf={bf} amp={amp} />
      <defs>
        <window.FU_LOOK.GradeFilter id="cMirrorBg" ramp="cur" blur={5} gain={0.9} />
        <window.FU_LOOK.GradeFilter id="cMirrorFg" ramp="cur" poster gain={1} />
        <window.FU_LOOK.GradeFilter id="dSkinTone" ramp="cur" poster />
        <window.FU_LOOK.GradeFilter id="dRefl" ramp="cur" blur={2} />
        <window.FU_LOOK.GradeFilter id="dReflFg" ramp="cur" poster gain={0.95} />
        <window.FU_LOOK.GradeFilter id="eNear" ramp="red" blur={14} />
      </defs>
      {body}
    </Frame>
  );
}

function FUCuratorWeightConcepts() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { concept: 'A', referenceOverlay: false, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg="#0e0e0e" autoplay={false}>
        <ConceptPiece concept={t.concept} guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} />
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

window.FUCuratorWeightConcepts = FUCuratorWeightConcepts;
