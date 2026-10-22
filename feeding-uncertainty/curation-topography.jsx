// Feeding Uncertainty — "Curation soothes for a bit…" (8 s). Topography (final direction).
const W = 1920, H = 1080;          // design coordinates
const OUT_W = 3840, OUT_H = 2160;   // render / export size (4K UHD); design is scaled up 2x as vectors

// ── motion: three helpers + an idle oscillator ─────────────────────────────
const tw = (T, a, b, from, to, ease) => {
  if (T <= a) return from;
  if (T >= b) return to;
  return from + (to - from) * ease((T - a) / (b - a));
};
const MOTION = {
  glide: (T, a, b, f, t) => tw(T, a, b, f, t, Easing.easeInOutSine), // settles, drifts, camera
  hit: (T, a, b, f, t) => tw(T, a, b, f, t, Easing.easeOutExpo),     // impacts, flips
  build: (T, a, b, f, t) => tw(T, a, b, f, t, Easing.easeInCubic),   // approach, pressure
};
const osc = (T, period, phase = 0) => Math.sin((T / period + phase) * Math.PI * 2);

// ── colour ─────────────────────────────────────────────────────────────────
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbHex = (c) => '#' + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A.map((v, i) => v + (B[i] - v) * clamp(t, 0, 1))); };
const gray = (v) => { const c = Math.round(clamp(v, 0, 1) * 255); return `rgb(${c},${c},${c})`; };
const PAL = {
  cur: { tones: ['#6a3034', '#c47449', '#d9955d', '#e6ad70', '#f2c98a', '#f3e0bf'], ringLight: '#f1dfbd', ringDark: '#87472c' },
  red: { tones: ['#2a0905', '#6b1d0c', '#a32e11', '#c4482a', '#e0765a', '#f1b29c'], ringLight: '#e8735a', ringDark: '#3d0f07' },
};
const mixPal = (p, q, t) => ({
  tones: p.tones.map((c, i) => mix(c, q.tones[i], t)),
  ringLight: mix(p.ringLight, q.ringLight, t),
  ringDark: mix(p.ringDark, q.ringDark, t),
});

// ── contour rings: blurred alpha → distance from edge → discrete stripe table ──
function invPhi(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p <= 1 - pl) { const q = p - 0.5, r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}
const NT = 320;
const DZ = Array.from({ length: NT }, (_, k) => -invPhi((k + 0.5) / NT));
function table(sigma, fn) {
  const out = new Array(NT);
  out[0] = 0;
  for (let k = 1; k < NT; k++) out[k] = fn(DZ[k] * sigma) ? 1 : 0;
  return out.join(' ');
}
function stripeAt(d, r) {
  if (d < r.d0) return 0;
  const ph = (((r.phase || 0) % r.gap) + r.gap) % r.gap;
  const x = d - r.d0 - ph;
  const i = Math.floor(x / r.gap);
  const n = Math.ceil(r.count);
  if (i < -1 || i >= n) return 0;
  let w = r.w;
  if (i === n - 1) w *= (r.count - Math.floor(r.count)) || 1;
  return x - i * r.gap < w ? 1 : 0;
}

// ── textures (seeded, baked once) ──────────────────────────────────────────
function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function makeNoise() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); const im = g.createImageData(256, 256); const r = rng(7);
  for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - 0.5) * 250; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); return c.toDataURL('image/png');
}
function makeBoil(seed) {
  const s = document.createElement('canvas'); s.width = s.height = 16;
  const g = s.getContext('2d'); const im = g.createImageData(16, 16); const r = rng(seed);
  for (let i = 0; i < im.data.length; i += 4) { im.data[i] = r() * 255; im.data[i + 1] = r() * 255; im.data[i + 2] = 128; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0);
  const b = document.createElement('canvas'); b.width = b.height = 160;
  const bg = b.getContext('2d'); bg.imageSmoothingEnabled = true; bg.imageSmoothingQuality = 'high'; bg.drawImage(s, 0, 0, 160, 160);
  return b.toDataURL('image/png');
}
const NOISE_URL = makeNoise();
const BOIL = [11, 23, 37, 51].map(makeBoil);

// ═══ TOPOGRAPHY — top-down crowd. Red reaches everyone evenly; his rings hold it out, then break ═══
const CROWD = [
  { x: 620, y: 330, r: 30, k: 'wd' }, { x: 1300, y: 300, r: 160, k: 'open' }, { x: 700, y: 800, r: -20, k: 'open' },
  { x: 1310, y: 790, r: 200, k: 'wd' }, { x: 1275, y: 545, r: 175, k: 'open' }, { x: 620, y: 580, r: 10, k: 'wd' },
  { x: 960, y: 225, r: 80, k: 'wd' }, { x: 960, y: 860, r: -80, k: 'open' }, { x: 380, y: 420, r: 40, k: 'wd' },
  { x: 1560, y: 420, r: 150, k: 'open' }, { x: 400, y: 820, r: -30, k: 'open' }, { x: 1540, y: 860, r: 210, k: 'wd' },
  { x: 160, y: 620, r: 0, k: 'open' }, { x: 1760, y: 640, r: 190, k: 'wd' }, { x: 300, y: 170, r: 50, k: 'open' },
  { x: 1650, y: 170, r: 140, k: 'wd' }, { x: 800, y: 40, r: 70, k: 'open' }, { x: 1150, y: 1040, r: -100, k: 'wd' },
  { x: 540, y: 1030, r: -50, k: 'open' }, { x: 1420, y: 60, r: 120, k: 'open' }, { x: 60, y: 300, r: 20, k: 'wd' },
  { x: 1870, y: 360, r: 170, k: 'open' }, { x: 120, y: 940, r: -20, k: 'wd' }, { x: 1830, y: 960, r: 200, k: 'open' },
];
const CROWD_COL = { wd: { body: '#46647a', head: '#2f4560', ring: '#86a9c2' }, open: { body: '#5fa69a', head: '#3a8584', ring: '#7fd0c0' } };

// hand-drawn boil: each ring is redrawn 8x a second with a slightly different wobble (deterministic)
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
function boilFn(f, id, amp) {
  if (!amp) return () => 0;
  const p1 = hash(f * 7.3 + id * 1.9) * 6.283, p2 = hash(f * 3.1 + id * 5.7) * 6.283, p3 = hash(f * 9.7 + id * 2.3) * 6.283;
  const a = amp * (0.7 + 0.6 * hash(f * 1.3 + id * 8.1));
  return (t) => a * (Math.sin(2 * t + p1) + 0.6 * Math.sin(3 * t + p2) + 0.35 * Math.sin(5 * t + p3));
}
function polarPath(cx, cy, rAt, N = 72) {
  let d = '';
  for (let k = 0; k < N; k++) {
    const t = -Math.PI + (k / N) * 2 * Math.PI, rr = Math.max(0, rAt(t));
    d += (k ? ' L ' : 'M ') + (cx + rr * Math.cos(t)).toFixed(1) + ' ' + (cy + rr * Math.sin(t)).toFixed(1);
  }
  return d + ' Z';
}
function boilPath(cx, cy, r, f, id, amp) {
  if (!amp) return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  const b = boilFn(f, id, amp);
  return polarPath(cx, cy, (t) => r + b(t), 56);
}

// top-down person (option 1e): shoulders narrowing to the phone; light fans from the phone to the face
function TopPerson({ x, y, rot, s = 1, body, head, crown, phone, glowId, glow = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="24" ry="50" fill={body} />
      <path d="M 0 -46 L 38 -8 L 38 8 L 0 46 Z" fill={body} />
      <circle cx="4" cy="0" r="24" fill={head} />
      {crown && <circle cx="-2" cy="-6" r="10" fill={crown} />}
      {phone && (
        <g opacity={glow}>
          <path d="M 38 -8 L 17.8 -19.7 A 24 24 0 0 1 17.8 19.7 L 38 8 Z" fill={`url(#${glowId})`} />
          <path d="M 17.8 -19.7 A 24 24 0 0 1 17.8 19.7 Q 24.2 0 17.8 -19.7 Z" fill={phone} opacity="0.72" />
        </g>
      )}
      {phone && <path d="M 38 -8 L 45.5 -8 Q 48 -8 48 -5.5 L 48 5.5 Q 48 8 45.5 8 L 38 8 Z" fill={phone} />}
    </g>
  );
}

function Topography({ T, q, boil, boilAmp }) {
  const { glide, hit, build } = MOTION;
  const { S, U, BT, L, I, E } = q;
  const cx = 960, cy = 540;
  const bf = Math.floor(T * 8), amp = boil ? boilAmp : 0;
  const th0 = -0.62;
  // beats keyed to the narration
  const crack = BT + 1.06;   // "breaks"
  const land = L + 0.24;     // "it lands"
  const harder = L + 0.6;    // "harder"
  // the red that reaches everyone, evenly
  const redA = 0.12 + glide(T, U, BT, 0, 0.22) + glide(T, BT, L, 0, 0.12) + osc(T, 3.2) * 0.015;
  const redN = clamp((redA - 0.12) / 0.34, 0, 1);
  // his terrain: soothed glow, then active blocking
  const plateau = 64 + glide(T, S, U, 0, 12);
  const sigma = 48;
  const n = 8, gap = 15, d0 = 10;
  const count = glide(T, S, U - 0.1, 5, n);
  const ringR = (i) => plateau + d0 + i * gap;
  const ringList = Array.from({ length: Math.ceil(count) }, (_, i) => ({ r: ringR(Math.min(i, count - 1)), id: 500 + i }));
  const rEdge = ringR(count - 1);
  const rOut = rEdge;
  const pressure = glide(T, U, crack, 0, 1) * (1 - glide(T, land, I, 0, 1));
  const push = T < crack ? Math.max(0, osc(T - U, 0.62, 0.75)) * pressure : 0;
  const calm = glide(T, S, S + 0.8, 0, 1) * (1 - glide(T, U, BT, 0, 1));
  const breathe = (0.5 + 0.5 * osc(T, 1.6, 0.75)) * calm;
  const ringCol = mix(mix('#e0a165', '#f6d29a', breathe * 0.7), '#ffe2b0', push * 0.8);
  // all rings give way a little (outer most), smoothly, then relax once the red has filled
  const angD = (phi) => { let d = Math.abs(phi - th0); return d > Math.PI ? 2 * Math.PI - d : d; };
  const relax = 1 - glide(T, land, I + 0.9, 0, 1);
  const Dur = land - crack;
  const tipR = clamp(rEdge * (1 - (T - crack) / Dur), 0, rEdge);
  const dentAmt = build(T, U, crack, 0, 1) * 13 * relax;
  const squeeze = pressure * relax;
  const ringW = (i) => {
    const pre = Math.pow((i + 1) / ringList.length, 1.6);
    const post = T < crack ? 0 : clamp((ringR(i) - tipR) / (2.5 * gap), 0, 1);
    return Math.max(pre, post);
  };
  const ringAt = (i) => {
    const b = boilFn(bf, 500 + i, amp), w = ringW(i), r = ringR(Math.min(i, count - 1));
    return (phi) => r + b(phi)
      - squeeze * (1.5 + 3 * push) * w * (1 + 0.25 * Math.sin(2 * phi + T * 1.2))
      - dentAmt * w * Math.exp(-Math.pow(angD(phi) / 0.5, 2));
  };
  const outerAt = ringAt(ringList.length - 1);
  // breach: one smooth wedge. Its tip travels inward continuously; it widens wherever it passed earlier
  const around = glide(T, I, E - 0.35, 0, Math.PI);
  const protAt = (phi) => {
    const r0 = outerAt(phi);
    if (T < crack) return r0;
    const X = Math.max(0, (angD(phi) - 0.05 - around) / 0.3);
    const rb = Math.max(tipR, rEdge * (1 - (T - crack - X) / Dur));
    return Math.min(r0, rb);
  };
  const prot = polarPath(cx, cy, protAt, 360);
  const outerD = polarPath(cx, cy, outerAt, 180);
  const ringPaths = ringList.map((rg, i) => (i === ringList.length - 1 ? outerD : polarPath(cx, cy, ringAt(i), 96)));
  const ringD = (rg, i) => ringPaths[i];
  // inside his rings the red starts at the same strength as outside and deepens toward him
  const depth = glide(T, crack, land, 0, 1);
  const seepIn = clamp(redA + depth * (0.78 - redA) + hit(T, harder, harder + 0.25, 0, 0.12), 0, 1);
  const lineIn = 0.25 + 0.75 * depth;
  const flash = T > land ? clamp(1 - (T - land) / 0.5, 0, 1) : 0;
  const flash2 = T > harder ? clamp(1 - (T - harder) / 0.6, 0, 1) : 0;
  // his acting
  const recoil = hit(T, land, land + 0.2, 0, 1) - glide(T, land + 0.2, I + 0.6, 0, 0.7);
  const look = T > I + 0.15 ? osc(T - I - 0.15, 1.3) * 34 * (1 - glide(T, I + 0.9, E - 0.3, 0, 1)) : 0;
  const heading = -6 + osc(T, 2.8) * 3 * calm + glide(T, U, crack, 0, -26) + hit(T, crack, crack + 0.2, 0, 6) - recoil * 14 + look;
  const sMe = 1 + breathe * 0.015 - glide(T, U, crack, 0, 0.03) + recoil * 0.08 - glide(T, I, E, 0, 0.05);
  const redP = glide(T, land, land + 0.5, 0, 0.5) + glide(T, I, E, 0, 0.3);
  const phoneMe = mix('#f3f1ea', '#ff4a2e', glide(T, land - 0.15, land + 0.15, 0, 1));
  // the others let it in: rings and phones take on a little red, evenly, and they stay calm
  const letIn = 0.3 * redN;
  const phoneOth = mix('#f3f1ea', '#ff8a6c', 0.4 * redN);
  // camera: always on him
  const lean = glide(T, BT, crack, 0, 1) * (1 - glide(T, land, I + 0.6, 0, 1));
  const fx = cx + lean * 36 * Math.cos(th0), fy = cy + lean * 36 * Math.sin(th0);
  const sc = glide(T, S, BT, 0.94, 1.14) + glide(T, BT, L, 0, 0.18) + hit(T, harder, harder + 0.3, 0, 0.04) + glide(T, I, E, 0, 0.22);
  const rot = glide(T, S, E, 0, -5);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0e0e0e' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H,
        transform: `translate(960px, 540px) rotate(${rot}deg) scale(${sc}) translate(${-fx}px, ${-fy}px)`, transformOrigin: '0 0' }}>
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
          <defs>
            
            <filter id="tPhoneB" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.4" /></filter>
            <filter id="tPhoneS" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5" /></filter>
            {[['tPG0', phoneOth], ['tPG1', phoneMe]].map(([gid, col]) => (
              <linearGradient key={gid} id={gid} gradientUnits="userSpaceOnUse" x1="38" y1="0" x2="17" y2="0">
                <stop offset="0" stopColor={col} stopOpacity="0.62" />
                <stop offset="1" stopColor={col} stopOpacity="0.13" />
              </linearGradient>
            ))}
            <filter id="tGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" /></filter>
            <mask id="tSea" maskUnits="userSpaceOnUse" x="-3000" y="-3000" width="8000" height="8000">
              <rect x="-3000" y="-3000" width="8000" height="8000" fill="#fff" />
              <path d={prot} fill="#000" />
            </mask>
            <clipPath id="tTerr"><path d={outerD} /></clipPath>
            <radialGradient id="tSeepG" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={rEdge + 2}>
              <stop offset={clamp(plateau / (rEdge + 2), 0, 1)} stopColor="#a32e11" stopOpacity={seepIn} />
              <stop offset="1" stopColor="#a32e11" stopOpacity={redA} />
            </radialGradient>
            <radialGradient id="tSeepL" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={rEdge + 2}>
              <stop offset={clamp(plateau / (rEdge + 2), 0, 1)} stopColor="#f0613f" stopOpacity={lineIn} />
              <stop offset="1" stopColor="#f0613f" stopOpacity="0.2" />
            </radialGradient>
          </defs>
          <rect x="-3000" y="-3000" width="8000" height="8000" fill="#0e0e0e" />
          <rect x="-3000" y="-3000" width="8000" height="8000" fill="#a32e11" opacity={redA} mask="url(#tSea)" />
          {CROWD.map((o, i) => (
            <g key={i} fill="none" stroke={mix(CROWD_COL[o.k].ring, '#e0644a', letIn)} strokeWidth="2.5" opacity="0.85">
              {[0, 1, 2, 3].map((j) => <path key={j} d={boilPath(o.x, o.y, 68 + j * 12, bf, i * 4 + j, amp)} />)}
            </g>
          ))}
          <g fill="none" stroke={ringCol} strokeWidth="4">
            {ringList.map((rg, i) => <path key={i} d={ringD(rg, i)} opacity="0.95" />)}
          </g>
          <g mask="url(#tSea)" clipPath="url(#tTerr)">
            {T >= crack && <rect x={cx - 400} y={cy - 400} width="800" height="800" fill="url(#tSeepG)" />}
            {T >= crack && <g fill="none" stroke="url(#tSeepL)" strokeWidth="4">{ringList.map((rg, i) => <path key={i} d={ringD(rg, i)} />)}</g>}
          </g>
          <path d={prot} fill="none" stroke="#f0613f" strokeWidth="9" opacity={pressure * 0.45} filter="url(#tGlow)" />
          {flash > 0 && <circle cx={cx} cy={cy} r={plateau + 10} fill="#f0613f" opacity={0.55 * flash} />}
          {flash2 > 0 && <path d={outerD} fill="#f0613f" opacity={0.3 * flash2} />}
          {CROWD.map((o, i) => (
            <TopPerson key={i} x={o.x} y={o.y} rot={o.r + osc(T, 2.6 + (i % 3) * 0.5, i * 0.21) * 5}
              body={CROWD_COL[o.k].body} head={CROWD_COL[o.k].head} phone={phoneOth} glowId="tPG0" />
          ))}
          <TopPerson x={cx} y={cy} rot={heading} s={sMe}
            body={mix('#e0a165', '#c4482a', redP)} head={mix('#c47449', '#8f2a12', redP)} crown={mix('#f2c98a', '#e0765a', redP)} phone={phoneMe} glowId="tPG1" />
        </svg>
      </div>
    </div>
  );
}

function Piece({ guide, boil, boilAmp }) {
  const { T, CUES, authoredTotal } = useComposition();
  const q = { S: CUES.Soothe, U: CUES.Unresolved, BT: CUES.Breakthrough, L: CUES.Lands, I: CUES.Inescapable, E: CUES.Hold };
  // phrase timings from timing_1.srt, anchored to the section they fall in
  const items = [
    { at: q.S + 0.12, until: q.U + 0.92, text: "Curation soothes for a bit, but it doesn't resolve." },
    { at: q.BT + 0.14, until: q.BT + 1.66, text: 'When crisis content breaks through,' },
    { at: q.L + 0.24, until: q.I - 0.04, text: 'it lands harder' },
    { at: q.I - 0.04, until: q.I + 1.72, text: 'and starts to feel inescapable.' },
  ];
  return (
    <div data-screen-label={`${T.toFixed(1)}s`} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, background: '#0e0e0e', transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <Topography T={T} q={q} boil={boil} boilAmp={boilAmp} />
      {guide && <Captions items={items} style={{ font: '500 34px "Open Sans", sans-serif', bottom: '5.5%', textShadow: '0 1px 14px rgba(0,0,0,0.7)' }} />}
    </div>
  );
}

// 4K PNG sequence renderer: seeks each frame, rasterises the stage SVG at 3840x2160, zips, downloads
function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const el = document.createElement('script'); el.src = src; el.onload = res; el.onerror = rej; document.head.appendChild(el);
  });
}
const nextPaint = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
async function renderSequence(fps, onProgress) {
  await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
  const svg = document.querySelector('[data-om-exportable-video-with-duration-secs]');
  const total = Number(svg.getAttribute('data-om-exportable-video-with-duration-secs'));
  const frames = Math.round(total * fps);
  const canvas = document.createElement('canvas'); canvas.width = OUT_W; canvas.height = OUT_H;
  const ctx = canvas.getContext('2d');
  const zip = new window.JSZip();
  const ser = new XMLSerializer();
  for (let f = 0; f < frames; f++) {
    svg.dispatchEvent(new CustomEvent('data-om-seek-to-time-frame', { detail: { time: f / fps, sync: true } }));
    await nextPaint();
    const clone = svg.cloneNode(true);
    clone.removeAttribute('style');
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', OUT_W); clone.setAttribute('height', OUT_H);
    clone.setAttribute('viewBox', `0 0 ${OUT_W} ${OUT_H}`);
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ser.serializeToString(clone));
    await img.decode();
    ctx.fillStyle = '#0e0e0e'; ctx.fillRect(0, 0, OUT_W, OUT_H);
    ctx.drawImage(img, 0, 0, OUT_W, OUT_H);
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
    zip.file(`topography_${String(f).padStart(4, '0')}.png`, blob);
    onProgress(`Rendering frame ${f + 1} / ${frames}`);
  }
  onProgress('Zipping…');
  const out = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(out); a.download = `curation-topography_4K_${fps}fps.zip`;
  document.body.appendChild(a); a.click(); a.remove();
  onProgress(`Done: ${frames} frames at 3840 × 2160`);
}

function FUTopography() {
  const [rendering, setRendering] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const start = async () => {
    if (rendering) return;
    setRendering(true); setStatus('Loading…');
    await nextPaint();
    try { await renderSequence(25, setStatus); }
    catch (e) { setStatus('Render failed: ' + (e && e.message ? e.message : e)); }
    setRendering(false);
  };
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { motionEditor: true, referenceOverlay: true, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg="#0e0e0e">
        <Piece guide={t.referenceOverlay && !rendering} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Editor" />
        <TweakToggle label="Motion editor" value={t.motionEditor} onChange={(v) => setTweak('motionEditor', v)} />
        <TweakSection label="Preview" />
        <TweakToggle label="Line boil (8 fps)" value={t.lineBoil} onChange={(v) => setTweak('lineBoil', v)} />
        <TweakSlider label="Boil amplitude" value={t.boilAmp ?? 0.5} min={0} max={3} step={0.1} unit="px" onChange={(v) => setTweak('boilAmp', v)} />
        <TweakToggle label="Narration guide" value={t.referenceOverlay} onChange={(v) => setTweak('referenceOverlay', v)} />
        <TweakSection label="Export" />
        <TweakButton label={rendering ? 'Rendering…' : 'Render 4K PNG sequence (25 fps)'} onClick={start} />
        {status && <div style={{ fontSize: 11, opacity: 0.75, padding: '2px 0 6px' }}>{status}</div>}
      </TweaksPanel>
    </React.Fragment>
  );
}

window.FUTopography = FUTopography;
