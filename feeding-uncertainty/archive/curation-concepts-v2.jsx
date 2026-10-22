// Feeding Uncertainty — "Curation soothes for a bit…" (8 s). v2: The Room + Topography.
const W = 1920, H = 1080;

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

// ═══ B · THE ROOM — stock-footage vocabulary: phone light, colour-masked crowd ═══
const ROOM = (() => {
  const out = [];
  const row = (xs, y, s, rw, kinds) => xs.forEach((x, i) => out.push({ x, y, s, row: rw, kind: kinds[i] || 'grey', ph: (out.length * 0.137) % 1 }));
  row([-300, -80, 140, 360, 580, 800, 1020, 1240, 1460, 1680, 1900, 2120], 250, 0.24, 0, { 3: 'open', 8: 'wd' });
  row([-200, 60, 320, 560, 800, 1060, 1300, 1560, 1820, 2080], 330, 0.36, 1, { 2: 'wd', 7: 'open' });
  row([-260, 90, 410, 1310, 1600, 1930, 2200], 450, 0.6, 2, { 1: 'open', 4: 'wd' });
  return out;
})();
const ROOM_FIRST = ROOM.findIndex((f) => f.row === 1 && f.x === 1300);
const ROOM_FRONT = [{ x: 200, y: 760, s: 1.5 }, { x: 1760, y: 790, s: 1.45 }, { x: -300, y: 700, s: 1.3 }, { x: 2220, y: 720, s: 1.3 }];
const ROW_SHIRT = ['#383b40', '#4a4e54', '#61656b'];
const ROW_HEAD = ['#2a2c30', '#323539', '#3b3e43'];
const ROW_MASK = [0.55, 0.75, 0.92];
const GROUPC = { wd: '#46647a', open: '#5fa69a' };
const torsoPath = (L) => `M -250 640 C -250 ${312 - L}, -230 ${208 - L}, -128 ${178 - L} C -82 ${165 - L}, -50 ${150 - L}, -38 ${130 - L} L 38 ${130 - L} C 50 ${150 - L}, 82 ${165 - L}, 128 ${178 - L} C 230 ${208 - L}, 250 ${312 - L}, 250 640 Z`;
// quick thumb flick, then rest
const swipeAt = (T, period, phase = 0) => { const u = (((T / period + phase) % 1) + 1) % 1; return u < 0.22 ? Math.sin((u / 0.22) * Math.PI) : 0; };

// Looking down at a phone held at chest height: hunched shoulders, bent arms, hands wrapped round the phone.
function Holder({ x, y, s, base, head, hair, glowCol, light = 1, nod = 0.6, lift = 0, sway = 0, swipe = 0, opacity = 1, extra = null }) {
  const dark = mix(base, '#0b0b0d', 0.4);
  const arm = mix(base, '#0b0b0d', 0.1);
  const lit = mix(mix(base, '#ffffff', 0.16), glowCol, 0.4 * light);
  const hand = mix(mix(base, '#ffffff', 0.26), glowCol, 0.55 * light);
  const fore = mix(arm, lit, 0.55);
  const hy = 8 + nod * 18;
  const L = lift;
  const arms = [-1, 1].map((sd) => {
    const hx = sd * 40, hyy = 314 - (sd === 1 ? swipe * 9 : 0);
    return {
      sd, hx, hyy,
      upper: `M ${sd * 166} ${206 - L} Q ${sd * 206} ${320 - L * 0.6} ${sd * 182} ${428 - L * 0.4}`,
      fore: `M ${sd * 182} ${428 - L * 0.4} Q ${sd * 128} 398 ${hx + sd * 16} ${hyy + 10}`,
    };
  });
  return (
    <g transform={`translate(${x} ${y}) rotate(${sway} 0 420) scale(${s})`} opacity={opacity}>
      <path d={torsoPath(L)} fill={base} />
      {arms.map((a) => <path key={'u' + a.sd} d={a.upper} fill="none" stroke={dark} strokeWidth="78" strokeLinecap="round" />)}
      {arms.map((a) => <path key={'v' + a.sd} d={a.upper} fill="none" stroke={arm} strokeWidth="64" strokeLinecap="round" />)}
      <rect x="-30" y="60" width="60" height={92 - L * 0.5} fill={head} />
      <ellipse cx="0" cy={hy} rx="62" ry="76" fill={head} />
      <ellipse cx="0" cy={hy - 20 + nod * 6} rx="66" ry={62 + nod * 8} fill={hair} />
      <ellipse cx="0" cy={hy + 50} rx="36" ry="18" fill={lit} opacity={clamp(0.3 + 0.6 * light, 0, 1)} />
      {arms.map((a) => <path key={'f' + a.sd} d={a.fore} fill="none" stroke={dark} strokeWidth="66" strokeLinecap="round" />)}
      {arms.map((a) => <path key={'g' + a.sd} d={a.fore} fill="none" stroke={fore} strokeWidth="54" strokeLinecap="round" />)}
      <g transform="rotate(-5 0 290)">
        <rect x="-35" y="236" width="70" height="110" rx="11" fill="#111214" />
        <rect x="-29" y="236" width="58" height="3" fill={glowCol} opacity={clamp(0.7 * light, 0, 1)} />
      </g>
      {arms.map((a) => <ellipse key={'h' + a.sd} cx={a.hx} cy={a.hyy} rx="28" ry="38" transform={`rotate(${a.sd * -18} ${a.hx} ${a.hyy})`} fill={hand} />)}
      {[0, 1].map((k) => <line key={'k' + k} x1="-38" y1={262 + k * 18} x2="-20" y2={261 + k * 18} stroke={hand} strokeWidth="13" strokeLinecap="round" transform="rotate(-5 0 290)" />)}
      {extra}
    </g>
  );
}
function HolderGlow({ x, y, s, glowCol, light = 1, nod = 0.6, sway = 0 }) {
  const hy = 8 + nod * 18;
  return (
    <g transform={`translate(${x} ${y}) rotate(${sway} 0 420) scale(${s})`}>
      <ellipse cx="0" cy="300" rx="160" ry="120" fill={glowCol} opacity={clamp(0.42 * light, 0, 1)} />
      <ellipse cx="0" cy={hy + 44} rx="58" ry="40" fill={glowCol} opacity={clamp(0.3 * light, 0, 1)} />
    </g>
  );
}

function ConceptRoom({ T, c }) {
  const { glide, hit } = MOTION;
  const { S, B, I, E } = c;
  const Hh = B + 0.8;
  const cam = glide(T, S, B, 1.0, 1.12) + hit(T, Hh, Hh + 0.3, 0, 0.06) - glide(T, I, E, 0, 0.36);
  const bubble = glide(T, S + 0.2, B, 0, 1) - glide(T, B + 0.2, Hh, 0, 0.5) - glide(T, I, E, 0, 0.5);
  const vig = glide(T, S, B, 0, 1) - glide(T, I, E, 0, 0.8);
  const flipC = hit(T, Hh, Hh + 0.2, 0, 1);
  const recoil = hit(T, Hh, Hh + 0.2, 0, 1) - glide(T, Hh + 0.2, I + 0.5, 0, 0.6);
  const redTint = hit(T, Hh, Hh + 0.3, 0, 0.12) + glide(T, I, E, 0, 0.42);
  const cX = 960, cY = 460;
  const people = ROOM.map((f, i) => {
    const at = i === ROOM_FIRST ? B + 0.25 : I + 0.05 + (Math.hypot(f.x - cX, f.y - cY) / 1500) * 1.1;
    const flip = hit(T, at, at + 0.16, 0, 1);
    const masked = f.kind !== 'grey';
    const base = masked ? GROUPC[f.kind] : ROW_SHIRT[f.row];
    const sw = swipeAt(T, 0.8 + (i % 5) * 0.27, f.ph);
    return {
      key: i, row: f.row, x: f.x + osc(T, 3.1 + (i % 3) * 0.4, f.ph) * 3, y: f.y, s: f.s,
      base, head: masked ? mix(base, '#0b0b0d', 0.08) : ROW_HEAD[f.row], hair: masked ? mix(base, '#0b0b0d', 0.22) : mix(ROW_HEAD[f.row], '#000000', 0.3),
      opacity: masked ? ROW_MASK[f.row] : 1,
      glowCol: mix('#bcd3dc', '#ff4a2e', flip), light: (0.55 + 0.45 * f.row / 2) * (1 + flip * 0.8) * (1 + 0.15 * sw),
      nod: 0.6, swipe: sw, sway: osc(T, 3.4 + (i % 4) * 0.3, f.ph) * 1.2,
    };
  });
  const rowBody = (rw) => people.filter((p) => p.row === rw).map(({ key, row, ...p }) => <Holder key={key} {...p} />);
  const rowGlow = (rw) => people.filter((p) => p.row === rw).map((p) => <HolderGlow key={p.key} x={p.x} y={p.y} s={p.s} glowCol={p.glowCol} light={p.light} nod={p.nod} sway={p.sway} />);
  // her acting: slow soothing swipes → freeze at the hit → fast swiping that changes nothing
  const cSwipe = T < Hh ? swipeAt(T - S, 1.15) : T < I + 0.2 ? 0 : swipeAt(T - I, 0.42);
  const curCol = mix('#e0a165', '#c4482a', flipC * 0.6 + glide(T, I, E, 0, 0.2));
  const lightCol = mix('#fbe3b8', '#ff5a3a', flipC);
  const lightY = 300 - flipC * 170 - glide(T, I, E, 0, 20);
  const lightR = 250 + flipC * 160;
  const cLight = (1 + 0.2 * cSwipe) * (0.85 + flipC * 0.3);
  const cNod = glide(T, S, B, 0.35, 0.8) - recoil * 1.1 + glide(T, I, E, 0, 0.5);
  const cLift = glide(T, S, B, 0, -10) + recoil * 26 + osc(T - S, 3.2) * 3;
  const cSway = glide(T, S, B, 0, -1) - recoil * 2.5;
  const cHy = 8 + cNod * 18;
  const vigIn = 0.78 - vig * 0.44;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#1c1e22' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${cam})`, transformOrigin: '960px 560px' }}>
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
          <defs>
            <radialGradient id="bBg" gradientUnits="userSpaceOnUse" cx="960" cy="200" r="1300">
              <stop offset="0" stopColor="#3b3e44" />
              <stop offset="1" stopColor="#141518" />
            </radialGradient>
            <radialGradient id="bVig" gradientUnits="userSpaceOnUse" cx="960" cy="600" r="1150">
              <stop offset={vigIn} stopColor="#060708" stopOpacity="0" />
              <stop offset={Math.min(1, vigIn + 0.3)} stopColor="#060708" stopOpacity="0.88" />
            </radialGradient>
            <radialGradient id="bBub" gradientUnits="userSpaceOnUse" cx="960" cy="640" r="620">
              <stop offset="0" stopColor="#f2c98a" stopOpacity="0.3" />
              <stop offset="1" stopColor="#f2c98a" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="bCurL" gradientUnits="userSpaceOnUse" cx="0" cy={lightY} r={lightR}>
              <stop offset="0" stopColor={lightCol} stopOpacity={clamp(0.75 * cLight, 0, 1)} />
              <stop offset="1" stopColor={lightCol} stopOpacity="0" />
            </radialGradient>
            <clipPath id="bCurClip">
              <path d={torsoPath(cLift)} />
              <rect x="-30" y="60" width="60" height="92" />
              <ellipse cx="0" cy={cHy} rx="62" ry="76" />
            </clipPath>
            <filter id="bG0" x="-10%" y="-20%" width="120%" height="140%" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="g" /><feGaussianBlur in="SourceGraphic" stdDeviation="3" result="s" />
              <feMerge><feMergeNode in="g" /><feMergeNode in="s" /></feMerge>
            </filter>
            <filter id="bG1" x="-10%" y="-20%" width="120%" height="140%" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="g" /><feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="s" />
              <feMerge><feMergeNode in="g" /><feMergeNode in="s" /></feMerge>
            </filter>
            <filter id="bG2" x="-10%" y="-20%" width="120%" height="140%" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="g" /><feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="s" />
              <feMerge><feMergeNode in="g" /><feMergeNode in="s" /></feMerge>
            </filter>
            <filter id="bCur" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="g" /><feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="s" />
              <feMerge><feMergeNode in="g" /><feMergeNode in="s" /></feMerge>
            </filter>
            <filter id="bF" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="16" /></filter>
            <filter id="bGl" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="22" /></filter>
          </defs>
          <rect x="-600" y="-400" width="3120" height="1880" fill="url(#bBg)" />
          <g filter="url(#bG0)">{rowBody(0)}</g>
          <g filter="url(#bGl)">{rowGlow(0)}</g>
          <g filter="url(#bG1)">{rowBody(1)}</g>
          <g filter="url(#bGl)">{rowGlow(1)}</g>
          <g filter="url(#bG2)">{rowBody(2)}</g>
          <g filter="url(#bGl)">{rowGlow(2)}</g>
          <rect x="-600" y="-400" width="3120" height="1880" fill="url(#bVig)" />
          <circle cx="960" cy="640" r="620" fill="url(#bBub)" opacity={clamp(bubble, 0, 1)} />
          <g filter="url(#bCur)">
            <Holder x={cX} y={cY} s={1.1} base={curCol} head={mix(curCol, '#6a3034', 0.12)} hair={mix(curCol, '#6a3034', 0.38)}
              glowCol={lightCol} light={cLight} nod={cNod} lift={cLift} sway={cSway} swipe={cSwipe}
              extra={<rect x="-300" y="-160" width="600" height="800" fill="url(#bCurL)" clipPath="url(#bCurClip)" />} />
          </g>
          <g filter="url(#bGl)">
            <HolderGlow x={cX} y={cY} s={1.1} glowCol={lightCol} light={cLight * 0.8} nod={cNod} sway={cSway} />
          </g>
          <g filter="url(#bF)">
            {ROOM_FRONT.map((f, i) => <Holder key={i} x={f.x} y={f.y} s={f.s} base="#16171a" head="#111214" hair="#0d0e10" glowCol="#bcd3dc" light={0.15} nod={0.5} sway={osc(T, 3.6, i * 0.3) * 0.8} />)}
          </g>
        </svg>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: '#a32e11', mixBlendMode: 'multiply', opacity: redTint }}></div>
    </div>
  );
}

// ═══ D · TOPOGRAPHY — top-down; her rings become terrain. Soothed first, then red seeps in ring by ring ═══
const TOPO_OTHERS = [
  { x: 120, y: 420, r: 30, k: 'wd' }, { x: 230, y: 600, r: -20, k: 'open' }, { x: 330, y: 470, r: 80, k: 'grey' },
  { x: 180, y: 760, r: 10, k: 'open' }, { x: 420, y: 690, r: 150, k: 'wd' }, { x: 470, y: 370, r: 200, k: 'grey' },
  { x: 40, y: 620, r: -60, k: 'grey' }, { x: 330, y: 880, r: 40, k: 'wd' }, { x: 530, y: 540, r: 170, k: 'open' },
  { x: -80, y: 470, r: 20, k: 'open' }, { x: 20, y: 280, r: -30, k: 'grey' }, { x: 260, y: 230, r: 60, k: 'wd' },
];
const TOPO_COL = { wd: ['#46647a', '#2f4560'], open: ['#5fa69a', '#3a8584'], grey: ['#565b63', '#3d4148'] };
const TOPO_OTHER_T = table(28, (d) => stripeAt(d, { d0: 6, gap: 12, w: 3, count: 4, phase: 0 }));

function TopPerson({ x, y, rot, s = 1, body, head, crown, phone }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="24" ry="50" fill={body} />
      {phone && <rect x="30" y="-9" width="11" height="18" rx="2" fill={phone} />}
      <circle cx="4" cy="0" r="24" fill={head} />
      {crown && <circle cx="-2" cy="-6" r="10" fill={crown} />}
    </g>
  );
}

function ConceptTopo({ T, c }) {
  const { glide, hit, build } = MOTION;
  const { S, B, I, E } = c;
  // she leaves the crowd for a quiet spot
  const walk = glide(T, S + 0.2, S + 2.4, 0, 1);
  const moving = T > S + 0.2 && T < S + 2.4;
  const cx = 640 + walk * 660, cy = 560 - walk * 40 - Math.sin(walk * Math.PI) * 30;
  const stepSway = moving ? osc(T - S, 0.55) * 7 * Math.sin(walk * Math.PI) : 0;
  // soothed: terrain rises, warms and breathes
  const n = 7, gap = 15, d0 = 10;
  const plateau = 50 + glide(T, S, B, 0, 70);
  const sigma = glide(T, S, B, 26, 52);
  const ringT = table(sigma, (d) => stripeAt(d, { d0, gap, w: 4, count: glide(T, S, B, 3, n), phase: 0 }));
  const calm = glide(T, S + 0.4, S + 2.6, 0, 1) * (1 - glide(T, B + 0.6, B + 1.6, 0, 1));
  const breathe = (0.5 + 0.5 * osc(T - S, 2.4, 0.75)) * calm;
  const ringCol = mix(mix('#b88a5e', '#e0a165', glide(T, S, S + 2.4, 0, 1)), '#f6d29a', breathe * 0.75);
  const ringR = (i) => plateau + d0 + i * gap + 2 - (sigma * sigma) / (2 * plateau);
  const rOut = ringR(n - 1) + 4;
  // the red never leaves: recedes, then creeps back
  const R = T < S + 2.0 ? glide(T, S, S + 2.0, 950, 1350) : glide(T, S + 2.0, B + 0.9, 1350, rOut + 34);
  const edge = glide(T, S + 2.0, B + 0.9, 320, 90);
  // breaks through: a channel crosses one ring at a time, then spreads along each ring
  const th0 = -0.62, seepA = B + 0.8, dt = 1.1 / n, land = seepA + n * dt;
  const around = build(T, I, E - 0.25, 0, Math.PI);
  const rf = clamp(rOut + 20 - ((T - seepA) / (n * dt)) * (rOut + 20 - plateau - 2), plateau + 2, rOut + 20);
  const pts = [];
  for (let k = 0; k < 160; k++) {
    const phi = -Math.PI + (k / 160) * 2 * Math.PI;
    let dphi = Math.abs(phi - th0); if (dphi > Math.PI) dphi = 2 * Math.PI - dphi;
    let rIn = 5000;
    if (T >= seepA && dphi <= 0.06) rIn = rf;
    for (let i = n - 1; i >= 0; i--) {
      const ti = seepA + (n - 1 - i) * dt;
      if (T < ti) break;
      if (dphi <= 0.06 + 0.2 * (T - ti) + around) rIn = Math.min(rIn, ringR(i) - gap * 0.5); else break;
    }
    pts.push((cx + rIn * Math.cos(phi)).toFixed(1) + ',' + (cy + rIn * Math.sin(phi)).toFixed(1));
  }
  const seepPoly = 'M ' + pts.join(' L ') + ' Z';
  // lands harder
  const recoil = hit(T, land, land + 0.22, 0, 1) - glide(T, land + 0.22, I + 0.7, 0, 0.7);
  const pulse = clamp((T - land) / 0.7, 0, 1);
  const redP = glide(T, land, land + 0.5, 0, 0.45) + glide(T, I, E, 0, 0.25);
  const look = T > I ? osc(T - I, 1.4) * 32 * (1 - glide(T, I + 0.9, E - 0.15, 0, 1)) : 0;
  const heading = -4 + stepSway - recoil * 12 + look;
  const sPop = 1 + recoil * 0.06 - glide(T, I, E, 0, 0.05);
  // camera
  const follow = glide(T, S, B, 0, 1);
  const drift = glide(T, B + 0.4, I, 0, 1) - glide(T, I, E, 0, 1);
  const fx = 760 + (cx - 760) * follow + drift * 70 * Math.cos(th0), fy = 540 + (cy - 540) * follow + drift * 70 * Math.sin(th0);
  const sc = glide(T, S, B, 1, 1.32) + glide(T, B, I, 0, 0.16) - glide(T, I, E, 0, 0.2);
  const rot = glide(T, S, E, 0, -6);
  const rph = T < I ? 0 : -((((T - I) * 24) % 26) + 26) % 26;
  const curPhone = mix('#fbe3b8', '#ff4a2e', glide(T, land - 0.2, land + 0.2, 0, 1));
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#1b1f25' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H,
        transform: `translate(960px, 540px) rotate(${rot}deg) scale(${sc}) translate(${-fx}px, ${-fy}px)`, transformOrigin: '0 0' }}>
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
          <defs>
            <filter id="dOth" filterUnits="userSpaceOnUse" x="-500" y="-200" width="1400" height="1500" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceAlpha" stdDeviation="22" result="f" />
              <feComponentTransfer in="f" result="a"><feFuncA type="discrete" tableValues={TOPO_OTHER_T} /></feComponentTransfer>
              <feFlood floodColor="#353d47" />
              <feComposite in2="a" operator="in" />
            </filter>
            <filter id="dCur" filterUnits="userSpaceOnUse" x={cx - 700} y={cy - 700} width="1400" height="1400" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceAlpha" stdDeviation={sigma} result="f" />
              <feComponentTransfer in="f" result="a"><feFuncA type="discrete" tableValues={ringT} /></feComponentTransfer>
              <feFlood floodColor={ringCol} floodOpacity="0.92" />
              <feComposite in2="a" operator="in" />
            </filter>
            <filter id="dCurR" filterUnits="userSpaceOnUse" x={cx - 700} y={cy - 700} width="1400" height="1400" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceAlpha" stdDeviation={sigma} result="f" />
              <feComponentTransfer in="f" result="a"><feFuncA type="discrete" tableValues={ringT} /></feComponentTransfer>
              <feFlood floodColor="#f0613f" />
              <feComposite in2="a" operator="in" />
            </filter>
            <radialGradient id="dHole" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={R + edge}>
              <stop offset={R / (R + edge)} stopColor="#000" />
              <stop offset="1" stopColor="#fff" />
            </radialGradient>
            <mask id="dSea" maskUnits="userSpaceOnUse" x="-6000" y="-6000" width="14000" height="14000">
              <rect x="-6000" y="-6000" width="14000" height="14000" fill="url(#dHole)" />
            </mask>
            <clipPath id="dTerrain"><circle cx={cx} cy={cy} r={R + edge * 0.4} /></clipPath>
            <mask id="dSeep" maskUnits="userSpaceOnUse" x="-6000" y="-6000" width="14000" height="14000">
              <rect x="-6000" y="-6000" width="14000" height="14000" fill="#fff" />
              <path d={seepPoly} fill="#000" />
            </mask>
          </defs>
          <rect x="-3000" y="-3000" width="8000" height="8000" fill="#1b1f25" />
          <g filter="url(#dOth)">
            {TOPO_OTHERS.map((o, i) => <circle key={i} cx={o.x} cy={o.y} r="48" fill="#000" />)}
          </g>
          <g filter="url(#dCur)"><circle cx={cx} cy={cy} r={plateau} fill="#000" /></g>
          <g mask="url(#dSea)">
            <rect x="-3000" y="-3000" width="8000" height="8000" fill="#a32e11" />
            {Array.from({ length: 50 }, (_, i) => (
              <circle key={i} cx={cx} cy={cy} r={Math.max(1, R + 10 + i * 26 + rph)} fill="none" stroke="#6b1d0c" strokeWidth="5" />
            ))}
          </g>
          {T >= seepA && (
            <g mask="url(#dSeep)" clipPath="url(#dTerrain)">
              <rect x="-3000" y="-3000" width="8000" height="8000" fill="#a32e11" opacity="0.55" />
              <g filter="url(#dCurR)"><circle cx={cx} cy={cy} r={plateau} fill="#000" /></g>
            </g>
          )}
          <circle cx={cx} cy={cy} r={plateau} fill="#a32e11" opacity={glide(T, land, E, 0, 0.28)} />
          {pulse > 0 && pulse < 1 && <circle cx={cx} cy={cy} r={plateau} fill="#f0613f" opacity={0.5 * (1 - pulse)} />}
          {TOPO_OTHERS.map((o, i) => (
            <TopPerson key={i} x={o.x} y={o.y} rot={o.r + osc(T, 2.6 + (i % 3) * 0.5, i * 0.21) * 6} body={TOPO_COL[o.k][0]} head={TOPO_COL[o.k][1]} phone="#bcd3dc" />
          ))}
          <TopPerson x={cx} y={cy} rot={heading} s={sPop}
            body={mix(mix('#c9a07a', '#e0a165', glide(T, S, S + 2.4, 0, 1)), '#c4482a', redP)}
            head={mix('#c47449', '#8f2a12', redP)} crown={mix('#f2c98a', '#e0765a', redP)} phone={curPhone} />
        </svg>
      </div>
    </div>
  );
}

// ── shared overlays ────────────────────────────────────────────────────────
function Grain({ T, amount }) {
  const f = Math.floor(T * 12);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'overlay', opacity: amount,
      backgroundImage: `url(${NOISE_URL})`, backgroundSize: '256px 256px', backgroundPosition: `${(f * 97) % 256}px ${(f * 61) % 256}px` }}></div>
  );
}

const LINES = ['Curation soothes for a bit, but it does not resolve.', 'When crisis content breaks through, it lands harder,', 'and starts to feel inescapable.'];
const NAMES = { B: 'The Room', D: 'Topography' };

function Piece({ guide, grain }) {
  const { T, CUES, authoredTotal } = useComposition();
  const seg = (L) => ({ S: CUES[L + ' Soothe'], B: CUES[L + ' Breach'], I: CUES[L + ' Inescapable'] });
  const Bq = seg('B'), D = seg('D');
  Bq.E = D.S; D.E = authoredTotal;
  const local = (q) => clamp(T, q.S, q.E - 0.001);
  const cur = T < D.S ? 'B' : 'D';
  const items = [];
  [Bq, D].forEach((q) => { items.push({ at: q.S, text: LINES[0] }, { at: q.B, text: LINES[1] }, { at: q.I, text: LINES[2], until: q.E - 0.05 }); });
  return (
    <div data-screen-label={`${cur} · ${Math.floor(T)}s`} style={{ position: 'absolute', inset: 0, background: '#0e0f11' }}>
      <Shot from={Bq.S} to={Bq.E}><ConceptRoom T={local(Bq)} c={Bq} /></Shot>
      <Shot from={D.S} to={D.E}><ConceptTopo T={local(D)} c={D} /></Shot>
      <Grain T={T} amount={grain} />
      {guide && (
        <React.Fragment>
          <div style={{ position: 'absolute', left: 56, top: 44, display: 'flex', gap: 14, alignItems: 'baseline',
            font: '600 28px "Open Sans", sans-serif', color: '#ffffff', textShadow: '0 1px 12px rgba(0,0,0,0.55)' }}>
            <span>{cur}</span><span style={{ fontWeight: 500 }}>{NAMES[cur]}</span>
          </div>
          <Captions items={items} style={{ font: '500 34px "Open Sans", sans-serif', bottom: '5.5%', textShadow: '0 1px 14px rgba(0,0,0,0.7)' }} />
        </React.Fragment>
      )}
    </div>
  );
}

function FUCurationConceptsV2() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { motionEditor: true, referenceOverlay: true, grain: 0.2 });
  return (
    <React.Fragment>
      <CompositionStage width={W} height={H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg="#0e0f11">
        <Piece guide={t.referenceOverlay} grain={t.grain} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Editor" />
        <TweakToggle label="Motion editor" value={t.motionEditor} onChange={(v) => setTweak('motionEditor', v)} />
        <TweakSection label="Preview" />
        <TweakToggle label="Label + narration guide" value={t.referenceOverlay} onChange={(v) => setTweak('referenceOverlay', v)} />
        <TweakSlider label="Film grain" value={t.grain} min={0} max={0.5} step={0.01} onChange={(v) => setTweak('grain', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

window.FUCurationConceptsV2 = FUCurationConceptsV2;
