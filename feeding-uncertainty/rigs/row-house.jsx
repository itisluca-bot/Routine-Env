// Feeding Uncertainty — houses. RowHouse: the curator's brick row house (option 5 from House Options), used in the open engagers door beat.
// TerraceHouse (further down): the same style with parameters, for a row of houses (the Vulnerability alley).
// Dark brick laid in staggered courses, a stone cornice, muted warm-grey window frames with small top panes, a plain door.
// Local frame: floor at y = 0, door centred on x = 0; the house spans x -135…285 and rises to y -622.
// The door's window (x -32…32, y -236…-184) is left for the shot to draw, so it can show who is behind it.
// Load it after animations-v3.jsx; it exports window.FU_HOUSE = { RowHouse, HOUSE, TerraceHouse, terraceWindows, FLOOR } and touches no other globals.
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

  // ── TerraceHouse: a parametric house in the same style, for a row of them (the Vulnerability alley) ──
  // spec: { w, floors (2 or 3), roof: 'flat' | 'pitched' | 'gable' | 'step', brick, mortar, door: 'left' | 'right' }.
  // Local frame: floor at y = 0, the house spans x 0…w; each storey is 280 tall and the wall rises to floors·280 + 40,
  // so a two-storey house matches RowHouse. terraceWindows(spec) lists the openings { x, y, w, h, floor } (top-left corner)
  // so a shot can fill them: TerraceHouse paints the glass, calls fill(win, i) for what is behind it (clipped to the glass),
  // then draws the frames on top. pid makes the brick pattern's id unique per copy; dark works as in RowHouse.
  const FLOOR = 280;
  const wallTop = (spec) => -(spec.floors * FLOOR + 40);
  const doorX = (spec) => (spec.door === 'right' ? spec.w * 0.73 : spec.w * 0.27);
  function terraceWindows(spec) {
    const { w, floors } = spec, out = [];
    const gw = Math.min(150, w * 0.36), uw = Math.min(110, w * 0.27);
    out.push({ x: (spec.door === 'right' ? w * 0.3 : w * 0.7) - gw / 2, y: -300, w: gw, h: 170, floor: 0 });
    for (let f = 1; f < floors; f++) for (const cx of [0.28, 0.72]) out.push({ x: w * cx - uw / 2, y: -540 - (f - 1) * FLOOR, w: uw, h: 150, floor: f });
    if (spec.roof === 'gable' || spec.roof === 'step') out.push({ x: w / 2 - 34, y: wallTop(spec) - Math.min(0.5 * w, 220) * 0.7, w: 68, h: 86, floor: floors });
    return out;
  }
  // the outline of the brick wall, gable or step gable included
  function wallPath(spec) {
    const { w } = spec, t = wallTop(spec);
    if (spec.roof === 'gable') { const a = Math.min(0.5 * w, 220); return `M 0 0 L 0 ${t} L ${w / 2} ${t - a} L ${w} ${t} L ${w} 0 Z`; }
    if (spec.roof === 'step') {
      const top = w * 0.3, rise = 66, inset = (w / 2 - top / 2) / 3;
      let d = `M 0 0 L 0 ${t}`;
      for (let i = 0; i < 3; i++) d += ` L ${i * inset} ${t - i * rise} L ${(i + 1) * inset} ${t - i * rise}`;
      d += ` L ${3 * inset} ${t - 3 * rise - 30} L ${w - 3 * inset} ${t - 3 * rise - 30}`;
      for (let i = 2; i >= 0; i--) d += ` L ${w - (i + 1) * inset} ${t - i * rise} L ${w - i * inset} ${t - i * rise}`;
      return d + ` L ${w} ${t} L ${w} 0 Z`;
    }
    return `M 0 0 L 0 ${t} L ${w} ${t} L ${w} 0 Z`;
  }
  function TerraceHouse({ x, y, spec, dark = 0, pid = 'th', fill }) {
    const c = (col) => mix(col, C.bg, dark);
    const { w } = spec, t = wallTop(spec), brick = spec.brick || HOUSE.brick, mortar = spec.mortar || HOUSE.mortar;
    const wins = terraceWindows(spec), f = c(HOUSE.frame), stone = c(HOUSE.cornice);
    const roof = c('#232827'), roofLine = c('#2d3332');
    let top = null;
    if (spec.roof === 'flat') top = <rect x={-18} y={t - 22} width={w + 36} height={26} fill={stone} />;
    if (spec.roof === 'pitched') {
      const r = 170, dw = 120;
      top = (
        <g>
          <path d={`M -14 ${t - 14} L ${w + 14} ${t - 14} L ${w - 46} ${t - 14 - r} L 46 ${t - 14 - r} Z`} fill={roof} />
          {Array.from({ length: 8 }, (_, i) => { const yy = t - 14 - (i + 1) * (r / 9), sh = ((i + 1) / 9) * 60; return <line key={i} x1={-14 + sh} x2={w + 14 - sh} y1={yy} y2={yy} stroke={roofLine} strokeWidth="3" />; })}
          <rect x={w / 2 - dw / 2} y={t - 14 - r * 0.78} width={dw} height={r * 0.62} fill={c(mix(HOUSE.cornice, C.bg, 0.25))} />
          <rect x={w / 2 - dw / 2 - 10} y={t - 14 - r * 0.78 - 12} width={dw + 20} height={14} fill={stone} />
          <rect x={w / 2 - 30} y={t - 14 - r * 0.62} width={60} height={r * 0.4} fill={c(HOUSE.glass)} stroke={f} strokeWidth="4" />
          <rect x={-18} y={t - 16} width={w + 36} height={18} fill={stone} />
        </g>
      );
    }
    const coping = spec.roof === 'gable' || spec.roof === 'step';
    const dX = doorX(spec);
    return (
      <g transform={`translate(${x} ${y})`}>
        <defs>
          <pattern id={pid} patternUnits="userSpaceOnUse" width="42" height="28">
            <rect width="42" height="28" fill={c(brick)} />
            <path d="M 0 1 H 42 M 0 15 H 42 M 1 0 V 14 M 22 14 V 28" stroke={c(mortar)} strokeWidth="2" />
          </pattern>
        </defs>
        <path d={wallPath(spec)} fill={`url(#${pid})`} />
        {coping && <path d={wallPath(spec).replace(/ L [^L]* 0 Z$/, '').replace('M 0 0 L', 'M')} fill="none" stroke={stone} strokeWidth="14" strokeLinejoin="miter" />}
        {top}
        {wins.map((wn, i) => {
          const split = wn.h * 0.38;
          return (
            <g key={i}>
              <clipPath id={`${pid}w${i}`}><rect x={wn.x} y={wn.y} width={wn.w} height={wn.h} /></clipPath>
              <rect x={wn.x} y={wn.y} width={wn.w} height={wn.h} fill={c(HOUSE.glass)} />
              {fill && <g clipPath={`url(#${pid}w${i})`}>{fill(wn, i)}</g>}
              <rect x={wn.x} y={wn.y} width={wn.w} height={wn.h} fill="none" stroke={f} strokeWidth="5" />
              {wn.floor < spec.floors && <line x1={wn.x} y1={wn.y + split} x2={wn.x + wn.w} y2={wn.y + split} stroke={f} strokeWidth="4" />}
              <line x1={wn.x + wn.w / 2} y1={wn.y} x2={wn.x + wn.w / 2} y2={wn.y + wn.h} stroke={f} strokeWidth="4" />
              <rect x={wn.x - 6} y={wn.y + wn.h} width={wn.w + 12} height="7" fill={c(mix(HOUSE.frame, C.bg, 0.4))} />
            </g>
          );
        })}
        <rect x={dX - 71} y="-266" width="142" height="266" fill={c(mix(HOUSE.door, C.bg, 0.3))} />
        <rect x={dX - 65} y="-260" width="130" height="260" fill={c(HOUSE.door)} />
        <rect x={dX - 53} y="-109" width="106" height="85" fill="none" stroke={c(mix(HOUSE.door, C.bg, 0.35))} strokeWidth="3" />
        <circle cx={dX + (spec.door === 'right' ? -49 : 49)} cy="-125" r="4.5" fill={c(mix(HOUSE.door, '#ffffff', 0.2))} />
      </g>
    );
  }

  window.FU_HOUSE = { RowHouse, HOUSE, TerraceHouse, terraceWindows, FLOOR };
})();
