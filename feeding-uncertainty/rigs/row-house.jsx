// Feeding Uncertainty — the curator's house: a brick row house (option 5 from House Options), used in the open engagers door beat.
// Dark brick laid in staggered courses, a stone cornice, muted warm-grey window frames with small top panes, a plain door.
// Local frame: floor at y = 0, door centred on x = 0; the house spans x -135…285 and rises to y -622.
// The door's window (x -32…32, y -236…-184) is left for the shot to draw, so it can show who is behind it.
// Load it after animations-v3.jsx; it exports window.FU_HOUSE = { RowHouse, HOUSE } and touches no other globals.
//   <RowHouse x={doorX} y={floorY} dark={0.35} />   dark mixes every colour toward the background (for the unlit copy)
(() => {
  const BG = '#0e0e0e';
  const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => '#' + hexRgb(a).map((v, i) => Math.round(v + (hexRgb(b)[i] - v) * Math.min(1, Math.max(0, t))).toString(16).padStart(2, '0')).join('');
  const C = { bg: BG };

  const HOUSE = { brick: '#3a2c28', mortar: '#2c211e', cornice: '#3c4240', frame: '#5f5954', glass: '#141918', door: '#3a403e' };
  function HouseWin({ x, y, w, h }) {
    const split = h * 0.38, f = HOUSE.frame;
    return (
      <g>
        <rect x={x - w / 2} y={y} width={w} height={h} fill={HOUSE.glass} stroke={f} strokeWidth="5" />
        <line x1={x - w / 2} y1={y + split} x2={x + w / 2} y2={y + split} stroke={f} strokeWidth="4" />
        <line x1={x} y1={y} x2={x} y2={y + h} stroke={f} strokeWidth="4" />
        {[1, 2].map((i) => <line key={i} x1={x - w / 2 + (i * w) / 3} y1={y} x2={x - w / 2 + (i * w) / 3} y2={y + split} stroke={f} strokeWidth="2.5" />)}
        <rect x={x - w / 2 - 6} y={y + h} width={w + 12} height="7" fill={mix(f, C.bg, 0.4)} />
      </g>
    );
  }
  function RowHouse({ x, y, dark = 0 }) {
    const c = (col) => mix(col, C.bg, dark);
    return (
      <g transform={`translate(${x} ${y})`}>
        <clipPath id={`oeBrick${dark ? 'd' : 'l'}`}><rect x="-135" y="-600" width="420" height="600" /></clipPath>
        <rect x="-135" y="-600" width="420" height="600" fill={c(HOUSE.brick)} />
        <g clipPath={`url(#oeBrick${dark ? 'd' : 'l'})`} stroke={c(HOUSE.mortar)} strokeWidth="2">
          {Array.from({ length: 43 }, (_, i) => <line key={i} x1="-140" x2="290" y1={-i * 14} y2={-i * 14} />)}
          {Array.from({ length: 43 }, (_, i) => Array.from({ length: 11 }, (_, j) => { const x = -135 + j * 42 + (i % 2 ? 21 : 0); return <line key={i + '-' + j} x1={x} x2={x} y1={-i * 14} y2={-(i + 1) * 14} />; }))}
        </g>
        <rect x="-153" y="-622" width="456" height="26" fill={c(HOUSE.cornice)} />
        <HouseWin x={-10} y={-540} w={110} h={150} />
        <HouseWin x={160} y={-540} w={110} h={150} />
        <HouseWin x={160} y={-300} w={110} h={170} />
        <rect x="-71" y="-266" width="142" height="266" fill={c(mix(HOUSE.door, C.bg, 0.3))} />
        <rect x="-65" y="-260" width="130" height="260" fill={c(HOUSE.door)} />
        <rect x="-53" y="-109" width="106" height="85" fill="none" stroke={c(mix(HOUSE.door, C.bg, 0.35))} strokeWidth="3" />
        <circle cx="49" cy="-125" r="4.5" fill={c(mix(HOUSE.door, '#ffffff', 0.2))} />
      </g>
    );
  }

  window.FU_HOUSE = { RowHouse, HOUSE };
})();
