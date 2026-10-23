// Feeding Uncertainty — house options for the open engagers door beat. A sheet of eight facades, from neutral to more Dutch,
// each lit the way the shot lights it: the teal lamp's beam from the upper left, the curator child peeking red through the door's window.
const W = 1920, H = 1080, OUT_W = 3840, OUT_H = 2160;
const BG = '#0e0e0e', LIGHT = '#e9f5ef', RED = '#a32e11', HOT = '#f0613f';
const CUR_HEAD = '#c47449';
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => '#' + hexRgb(a).map((v, i) => Math.round(v + (hexRgb(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
const osc = (T, p, ph = 0) => Math.sin((T / p + ph) * Math.PI * 2);

// palette: neutral plaster greys, and a dark, muted brick for the Dutch ones
const P = {
  wall: '#2a302e', wallDark: '#222826', roof: '#1e2322', roofLine: '#2c3331',
  brick: '#3a2c28', mortar: '#2c211e', stone: '#3c4240',
  frame: '#9aa4a1', frameDim: '#5d6664', glass: '#141918', door: '#3a403e', doorDark: '#2e3432',
};

// ── shared parts (local frame: floor at y = 0) ─────────────────────────────
// the door, with the curator child peeking through its window
function Door({ x = 0, w = 120, h = 250, col = P.door, T, transom = false, frame = P.frameDim }) {
  const wx = x - 30, wy = -h + 14, peek = 5 * osc(T, 1.7);
  const id = `hw${Math.round(x * 10)}${w}${h}${transom ? 1 : 0}`;
  return (
    <g>
      {transom && <rect x={x - w / 2} y={-h - 46} width={w} height="40" fill={P.glass} stroke={frame} strokeWidth="5" />}
      {transom && [1, 2, 3].map((i) => <line key={i} x1={x - w / 2 + (i * w) / 4} y1={-h - 46} x2={x - w / 2 + (i * w) / 4} y2={-h - 6} stroke={frame} strokeWidth="3" />)}
      <rect x={x - w / 2 - 6} y={-h - 6} width={w + 12} height={h + 6} fill={mix(col, BG, 0.3)} />
      <rect x={x - w / 2} y={-h} width={w} height={h} fill={col} />
      <rect x={x - w / 2 + 12} y={-h * 0.42} width={w - 24} height={h * 0.34} fill="none" stroke={mix(col, BG, 0.35)} strokeWidth="3" />
      <clipPath id={id}><rect x={wx} y={wy} width="60" height="52" /></clipPath>
      <rect x={wx} y={wy} width="60" height="52" fill={mix(BG, RED, 0.85)} />
      <g clipPath={`url(#${id})`}>
        <circle cx={x + 4} cy={wy + 40 + peek} r="26" fill={mix(CUR_HEAD, RED, 0.35)} />
        <circle cx={x - 10} cy={wy + 36 + peek} r="3.5" fill={BG} />
      </g>
      <rect x={wx} y={wy} width="60" height="52" fill="none" stroke="#151515" strokeWidth="5" />
      <circle cx={x + w / 2 - 16} cy={-h * 0.48} r="4.5" fill={mix(col, '#ffffff', 0.2)} />
      <rect x={x - w / 2} y="-5" width={w} height="5" fill={HOT} opacity="0.6" />
    </g>
  );
}
// a window; dutch = white frame with small panes in the top part
function Win({ x, y, w, h, dutch = false, frame = P.frameDim, sill = true }) {
  const split = dutch ? h * 0.38 : h / 2;
  return (
    <g>
      <rect x={x - w / 2} y={y} width={w} height={h} fill={P.glass} stroke={frame} strokeWidth={dutch ? 6 : 5} />
      <line x1={x - w / 2} y1={y + split} x2={x + w / 2} y2={y + split} stroke={frame} strokeWidth={dutch ? 5 : 4} />
      <line x1={x} y1={y} x2={x} y2={y + h} stroke={frame} strokeWidth={dutch ? 5 : 4} />
      {dutch && [1, 2].map((i) => <line key={i} x1={x - w / 2 + (i * w) / 3} y1={y} x2={x - w / 2 + (i * w) / 3} y2={y + split} stroke={frame} strokeWidth="2.5" />)}
      {sill && <rect x={x - w / 2 - 6} y={y + h} width={w + 12} height="7" fill={mix(frame, BG, 0.4)} />}
    </g>
  );
}
// faint brick coursing inside a shape
function Brick({ d, top = -900, id }) {
  return (
    <g>
      <clipPath id={id}><path d={d} /></clipPath>
      <path d={d} fill={P.brick} />
      <g clipPath={`url(#${id})`} stroke={P.mortar} strokeWidth="2">
        {Array.from({ length: Math.ceil(-top / 14) }, (_, i) => <line key={i} x1="-600" x2="600" y1={-i * 14} y2={-i * 14} />)}
      </g>
    </g>
  );
}
// a hoist beam sticking out under the top of a canal-house gable
const Hoist = ({ y }) => <g><rect x="-7" y={y} width="14" height="34" fill={mix(P.stone, BG, 0.2)} /><rect x="-7" y={y + 30} width="34" height="8" fill={mix(P.stone, BG, 0.2)} /></g>;

// ── the eight houses ───────────────────────────────────────────────────────
const HOUSES = [
  {
    name: 'Neutral · simple gable', note: 'Pitched roof, plain plaster, one window. Reads as "a house" instantly.',
    draw: (T) => (
      <g>
        <path d="M -330 -390 L 0 -640 L 330 -390 Z" fill={P.roof} />
        <rect x="-290" y="-400" width="580" height="400" fill={P.wall} />
        <rect x="-290" y="-400" width="580" height="16" fill={P.wallDark} />
        <Win x={150} y={-310} w={130} h={130} />
        <Door x={-70} T={T} />
      </g>
    ),
  },
  {
    name: 'Neutral · flat-roof box', note: 'Modern, flat roof with a parapet, a tall slit window beside the door.',
    draw: (T) => (
      <g>
        <rect x="-300" y="-450" width="600" height="450" fill={P.wall} />
        <rect x="-312" y="-462" width="624" height="22" fill={P.wallDark} />
        <rect x="40" y="-380" width="220" height="90" fill={P.glass} stroke={P.frameDim} strokeWidth="5" />
        <line x1="150" y1="-380" x2="150" y2="-290" stroke={P.frameDim} strokeWidth="4" />
        <rect x="68" y="-250" width="34" height="230" fill={P.glass} stroke={P.frameDim} strokeWidth="5" />
        <Door x={-80} T={T} />
      </g>
    ),
  },
  {
    name: 'Neutral · low cottage', note: 'Wide and low, deep roof, a chimney. Warm but placeless.',
    draw: (T) => (
      <g>
        <rect x="170" y="-600" width="54" height="140" fill={P.wallDark} />
        <path d="M -370 -300 L -220 -540 L 220 -540 L 370 -300 Z" fill={P.roof} />
        <path d="M -370 -300 L -220 -540 L 220 -540 L 370 -300" fill="none" stroke={P.roofLine} strokeWidth="5" />
        <rect x="-320" y="-300" width="640" height="300" fill={P.wall} />
        <Win x={-200} y={-230} w={110} h={100} />
        <Win x={200} y={-230} w={110} h={100} />
        <Door x={0} h={240} T={T} />
      </g>
    ),
  },
  {
    name: 'Neutral · narrow two-storey', note: 'Tall, narrow and steep: a row-house proportion without any ornament.',
    draw: (T) => (
      <g>
        <path d="M -225 -560 L 0 -800 L 225 -560 Z" fill={P.roof} />
        <rect x="-200" y="-570" width="400" height="570" fill={P.wall} />
        <Win x={-90} y={-500} w={100} h={120} />
        <Win x={90} y={-500} w={100} h={120} />
        <Win x={90} y={-250} w={100} h={130} />
        <Door x={-70} w={110} T={T} />
      </g>
    ),
  },
  {
    name: 'Slightly Dutch · brick row house', note: 'Dark brick, white frames with small top panes, a fanlight over the door. Flat cornice, no gable.',
    draw: (T) => (
      <g>
        <Brick id="hb5" d="M -210 0 L -210 -600 L 210 -600 L 210 0 Z" top={-600} />
        <rect x="-228" y="-622" width="456" height="26" fill={P.stone} />
        <Win x={-85} y={-540} w={110} h={150} dutch frame={P.frame} />
        <Win x={85} y={-540} w={110} h={150} dutch frame={P.frame} />
        <Win x={85} y={-300} w={110} h={170} dutch frame={P.frame} />
        <Door x={-75} w={116} h={240} transom frame={P.frame} T={T} />
      </g>
    ),
  },
  {
    name: 'Dutch · step gable', note: 'Trapgevel: brick, stepped top, a hoist beam, white frames. Clearly Dutch, still simple.',
    draw: (T) => {
      const d = 'M -220 0 L -220 -560 L -175 -560 L -175 -630 L -130 -630 L -130 -700 L -85 -700 L -85 -770 L 85 -770 L 85 -700 L 130 -700 L 130 -630 L 175 -630 L 175 -560 L 220 -560 L 220 0 Z';
      return (
        <g>
          <Brick id="hb6" d={d} top={-780} />
          <path d="M -220 -560 L -175 -560 L -175 -630 L -130 -630 L -130 -700 L -85 -700 L -85 -770 L 85 -770 L 85 -700 L 130 -700 L 130 -630 L 175 -630 L 175 -560 L 220 -560" fill="none" stroke={P.stone} strokeWidth="8" />
          <Hoist y={-760} />
          <Win x={0} y={-670} w={70} h={80} dutch frame={P.frame} sill={false} />
          <Win x={-95} y={-500} w={100} h={140} dutch frame={P.frame} />
          <Win x={95} y={-500} w={100} h={140} dutch frame={P.frame} />
          <Win x={95} y={-290} w={100} h={160} dutch frame={P.frame} />
          <Door x={-80} w={112} h={236} transom frame={P.frame} T={T} />
        </g>
      );
    },
  },
  {
    name: 'Dutch · neck gable', note: 'Halsgevel: a raised neck with curved shoulders and a small pediment. The most "Amsterdam".',
    draw: (T) => {
      const d = 'M -210 0 L -210 -560 L -110 -560 C -110 -600 -92 -630 -80 -640 L -80 -760 L -96 -760 L 0 -820 L 96 -760 L 80 -760 L 80 -640 C 92 -630 110 -600 110 -560 L 210 -560 L 210 0 Z';
      return (
        <g>
          <Brick id="hb7" d={d} top={-830} />
          <path d="M -210 -560 L -110 -560 C -110 -600 -92 -630 -80 -640 L -80 -760 L -96 -760 L 0 -820 L 96 -760 L 80 -760 L 80 -640 C 92 -630 110 -600 110 -560 L 210 -560" fill="none" stroke={P.stone} strokeWidth="8" />
          <Hoist y={-750} />
          <Win x={0} y={-690} w={70} h={90} dutch frame={P.frame} sill={false} />
          <Win x={-90} y={-500} w={100} h={140} dutch frame={P.frame} />
          <Win x={90} y={-500} w={100} h={140} dutch frame={P.frame} />
          <Win x={90} y={-290} w={100} h={160} dutch frame={P.frame} />
          <Door x={-75} w={112} h={236} transom frame={P.frame} T={T} />
        </g>
      );
    },
  },
  {
    name: 'Dutch · modern terrace', note: 'A 1990s Dutch new-build row: steep tiled roof down to the first floor, a dormer, wide glass. Dutch today, not touristic.',
    draw: (T) => (
      <g>
        <path d="M -320 -330 L 0 -700 L 320 -330 Z" fill={P.roof} />
        {Array.from({ length: 9 }, (_, i) => { const y = -360 - i * 36, half = 320 * (1 - (-y - 330) / 370); return <line key={i} x1={-half} x2={half} y1={y} y2={y} stroke={P.roofLine} strokeWidth="3" />; })}
        <rect x="-60" y="-520" width="150" height="110" fill={P.wallDark} />
        <path d="M -76 -520 L 106 -520 L 106 -536 L -76 -536 Z" fill={P.roofLine} />
        <rect x="-36" y="-500" width="102" height="72" fill={P.glass} stroke={P.frame} strokeWidth="5" />
        <Brick id="hb8" d="M -290 0 L -290 -340 L 290 -340 L 290 0 Z" top={-340} />
        <rect x="-300" y="-350" width="600" height="18" fill={P.stone} />
        <rect x="20" y="-280" width="230" height="200" fill={P.glass} stroke={P.frame} strokeWidth="6" />
        <line x1="135" y1="-280" x2="135" y2="-80" stroke={P.frame} strokeWidth="5" />
        <rect x="-226" y="-250" width="30" height="250" fill={P.glass} stroke={P.frame} strokeWidth="4" />
        <Door x={-120} w={112} h={240} T={T} />
      </g>
    ),
  },
];

// one cell: the house lit by a beam from the upper left, dark outside it
function Cell({ i, x, y, T }) {
  const h = HOUSES[i], s = 0.5;
  const beam = `M 20 -60 L 90 -60 L 470 470 A 230 20 0 0 1 10 470 Z`;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <filter id={`hs${i}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" /></filter>
        <mask id={`hm${i}`} maskUnits="userSpaceOnUse" x="-200" y="-200" width="900" height="900"><path d={beam} fill="#fff" filter={`url(#hs${i})`} /></mask>
      </defs>
      <line x1="0" y1="470" x2="480" y2="470" stroke="#333" strokeWidth="2" />
      <g transform={`translate(270 470) scale(${s})`} opacity="0.3">{h.draw(T)}</g>
      <g mask={`url(#hm${i})`}><g transform={`translate(270 470) scale(${s})`}>{h.draw(T)}</g></g>
      <path d={beam} fill={LIGHT} opacity="0.07" />
      <ellipse cx="240" cy="470" rx="230" ry="18" fill={LIGHT} opacity="0.08" />
      <text x="16" y="34" fill="#ffffff" fontFamily="Open Sans, sans-serif" fontSize="22" fontWeight="700">{i + 1}<tspan fontWeight="500" dx="10">{h.name}</tspan></text>
      <foreignObject x="16" y="490" width="450" height="50">
        <div xmlns="http://www.w3.org/1999/xhtml" style={{ color: '#9aa4a1', font: '500 14px "Open Sans", sans-serif', lineHeight: 1.3 }}>{h.note}</div>
      </foreignObject>
    </g>
  );
}

function Sheet() {
  const { T } = useComposition();
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, background: BG, transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H}>
        <rect width={W} height={H} fill={BG} />
        {HOUSES.map((_, i) => <Cell key={i} i={i} x={(i % 4) * 480} y={Math.floor(i / 4) * 540} T={T} />)}
        <line x1="0" y1="540" x2={W} y2="540" stroke="#222" strokeWidth="2" />
        {[480, 960, 1440].map((x) => <line key={x} x1={x} y1="0" x2={x} y2={H} stroke="#222" strokeWidth="2" />)}
      </svg>
    </div>
  );
}

function FUHouseOptions() {
  return (
    <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={BG}>
      <Sheet />
    </CompositionStage>
  );
}
window.FUHouseOptions = FUHouseOptions;
