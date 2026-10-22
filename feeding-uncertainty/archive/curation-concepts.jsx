// Feeding Uncertainty — "Curation soothes for a bit…" (8 s). Four staging concepts in one reel.
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

// ── the posterized participant: grey tonal source → posterize → contour rings ──
function Bust(p) {
  const { id, x, y, k = 1, pal, contrast = 1, lx = -0.3, ly = -0.2, lean = 0, tilt = 0, nod = 0, turn = 0, lift = 0,
    hair = 'long', rings, boilFrame = null, ringRed = '#dc5a3c', haloRed = '#4a1208' } = p;
  const r = rings;
  let haloT = '0', s1T = '0', s2T = '0', haloCol = pal.ringDark;
  if (r) {
    const ph = (((r.phase || 0) % r.gap) + r.gap) % r.gap;
    const hMax = r.d0 + ph + (Math.ceil(r.count) - 1) * r.gap + r.w + 6;
    const front = r.front == null ? 1e9 : r.front;
    haloT = table(r.sigma, (d) => d < hMax);
    s1T = table(r.sigma, (d) => d < front && stripeAt(d, r));
    s2T = table(r.sigma, (d) => d >= front && stripeAt(d, r));
    haloCol = mix(pal.ringDark, haloRed, clamp((hMax - front) / hMax, 0, 1));
  }
  const tv = (i) => pal.tones.map((c) => (hexRgb(c)[i] / 255).toFixed(3)).join(' ');
  const kk = contrast, b = 0.5 - 0.5 * kk;
  const sy = 760 - lift;
  const torso = `M 30 1180 C 30 ${sy + 160}, 150 ${sy + 42}, 365 ${sy + 6} L 635 ${sy + 6} C 850 ${sy + 42}, 970 ${sy + 160}, 970 1180 Z`;
  const fr = { x: -260, y: -260, width: 1520, height: 1560 };
  const hairG = `url(#${id}h)`;
  return (
    <svg width={1000 * k} height={1100 * k} viewBox="0 0 1000 1100" style={{ position: 'absolute', left: x - 500 * k, top: y, overflow: 'visible' }}>
      <defs>
        <radialGradient id={id + 'f'} gradientUnits="userSpaceOnUse" cx={500 + lx * 120} cy={350 + ly * 110} r="250">
          <stop offset="0" stopColor={gray(0.97)} />
          <stop offset="0.42" stopColor={gray(0.8)} />
          <stop offset="0.78" stopColor={gray(0.62)} />
          <stop offset="1" stopColor={gray(0.5)} />
        </radialGradient>
        <linearGradient id={id + 't'} gradientUnits="userSpaceOnUse" x1={500 + lx * 460} y1="720" x2={500 - lx * 460} y2="1100">
          <stop offset="0" stopColor={gray(0.92)} />
          <stop offset="0.55" stopColor={gray(0.72)} />
          <stop offset="1" stopColor={gray(0.52)} />
        </linearGradient>
        <radialGradient id={id + 'h'} gradientUnits="userSpaceOnUse" cx={500 + lx * 130} cy={270 + ly * 90} r="320">
          <stop offset="0" stopColor={gray(0.46)} />
          <stop offset="0.55" stopColor={gray(0.3)} />
          <stop offset="1" stopColor={gray(0.2)} />
        </radialGradient>
        <filter id={id} filterUnits="userSpaceOnUse" x={fr.x} y={fr.y} width={fr.width} height={fr.height} colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="sb" />
          <feComponentTransfer in="sb" result="sc">
            <feFuncR type="linear" slope={kk} intercept={b} />
            <feFuncG type="linear" slope={kk} intercept={b} />
            <feFuncB type="linear" slope={kk} intercept={b} />
          </feComponentTransfer>
          <feComponentTransfer in="sc" result="post">
            <feFuncR type="discrete" tableValues={tv(0)} />
            <feFuncG type="discrete" tableValues={tv(1)} />
            <feFuncB type="discrete" tableValues={tv(2)} />
            <feFuncA type="discrete" tableValues="0 1" />
          </feComponentTransfer>
          <feGaussianBlur in="SourceAlpha" stdDeviation={r ? r.sigma : 1} result="fld" />
          <feComponentTransfer in="fld" result="hA"><feFuncA type="discrete" tableValues={haloT} /></feComponentTransfer>
          <feFlood floodColor={haloCol} />
          <feComposite in2="hA" operator="in" result="halo" />
          <feComponentTransfer in="fld" result="aA"><feFuncA type="discrete" tableValues={s1T} /></feComponentTransfer>
          <feFlood floodColor={pal.ringLight} />
          <feComposite in2="aA" operator="in" result="s1" />
          <feComponentTransfer in="fld" result="bA"><feFuncA type="discrete" tableValues={s2T} /></feComponentTransfer>
          <feFlood floodColor={ringRed} />
          <feComposite in2="bA" operator="in" result="s2" />
          <feMerge result="m"><feMergeNode in="halo" /><feMergeNode in="s1" /><feMergeNode in="s2" /><feMergeNode in="post" /></feMerge>
          {boilFrame != null && <feImage href={BOIL[boilFrame % 4]} x={fr.x} y={fr.y} width={fr.width} height={fr.height} preserveAspectRatio="none" result="nz" />}
          {boilFrame != null && <feDisplacementMap in="m" in2="nz" scale="10" xChannelSelector="R" yChannelSelector="G" />}
        </filter>
      </defs>
      <g filter={`url(#${id})`}>
        <g transform={`rotate(${lean} 500 1100)`}>
          <path d={torso} fill={`url(#${id}t)`} />
          <ellipse cx={500 - lx * 40} cy="800" rx="130" ry="26" fill={gray(0.95)} />
          <ellipse cx="350" cy="960" rx="60" ry="140" fill={gray(0.56)} />
          <ellipse cx="660" cy="990" rx="52" ry="120" fill={gray(0.58)} />
          <g transform={`translate(${turn * 34} ${28 - lift * 0.55 + nod * 10}) rotate(${tilt} 500 640)`}>
            {hair === 'long' && <ellipse cx="500" cy="430" rx="198" ry="262" fill={hairG} />}
            <rect x="436" y="520" width="128" height="250" rx="30" fill={gray(0.5)} />
            <ellipse cx="500" cy="585" rx="80" ry="36" fill={gray(0.34)} />
            {hair === 'long' && <rect x={300 - turn * 20} y="440" width="118" height="470" rx="59" fill={hairG} />}
            {hair === 'long' && <rect x={582 - turn * 20} y="440" width="118" height="470" rx="59" fill={hairG} />}
            <ellipse cx="500" cy="380" rx="148" ry="190" fill={`url(#${id}f)`} />
            <ellipse cx={500 - lx * 95} cy="405" rx="78" ry="168" fill={gray(0.6)} opacity="0.75" />
            <ellipse cx={500 + lx * 62 + turn * 40} cy="418" rx="44" ry="32" fill={gray(0.99)} opacity="0.85" />
            <ellipse cx={500 + turn * 40} cy="346" rx="116" ry="22" fill={gray(0.66)} opacity="0.55" />
            <g transform={`translate(${turn * 62} ${nod * 26})`}>
              <ellipse cx="438" cy="374" rx="36" ry="17" fill={gray(0.38)} />
              <ellipse cx="562" cy="374" rx="36" ry="17" fill={gray(0.38)} />
              <ellipse cx={500 - lx * 16} cy="452" rx="17" ry="30" fill={gray(0.52)} />
              <ellipse cx="500" cy="522" rx="42" ry="13" fill={gray(0.4)} />
            </g>
            {hair === 'long'
              ? <ellipse cx={500 + turn * 12} cy="228" rx="160" ry="98" fill={hairG} />
              : <ellipse cx={500 + turn * 12} cy="240" rx="158" ry="112" fill={hairG} />}
          </g>
        </g>
      </g>
    </svg>
  );
}

// ═══ A · HALO — her rings are the buffer; the buffer is also the conductor ═══
function ConceptHalo({ T, c, boil }) {
  const { glide, hit, build } = MOTION;
  const { S, B, I, E } = c;
  const Hh = B + 0.85;
  const cam = glide(T, S, B, 1.0, 1.07) + hit(T, Hh, Hh + 0.3, 0, 0.06) - glide(T, I, E, 0, 0.17);
  const appr = build(T, B, Hh - 0.15, 0, 1);
  const smX = 1660 + osc(T - S, 4.2) * 34 - appr * 300;
  const smY = 250 + osc(T - S, 5.6, 0.3) * 20 + appr * 70;
  const smR = 150 * (1 + glide(T, S, B, 0, 0.15) + appr * 1.1);
  const smO = clamp(0.68 + appr * 0.3 - hit(T, Hh - 0.1, Hh + 0.4, 0, 0.95), 0, 1);
  const front = build(T, Hh - 0.45, Hh - 0.02, 130, -10);
  const phase = T < I ? -(T - S) * 5 : -(I - S) * 5 + (T - I) * 40;
  const rings = { sigma: 46 + glide(T, I, E, 0, 14), d0: 16, gap: 15, w: 6, count: glide(T, S, B, 3, 5) + glide(T, I, E, 0, 2), phase, front };
  const red = hit(T, Hh, Hh + 0.35, 0, 0.7) + glide(T, I, E, 0, 0.12);
  const contrast = 1 + hit(T, Hh, Hh + 0.3, 0, 0.7) - glide(T, Hh + 0.3, I + 0.5, 0, 0.2);
  const calm = T < I;
  const br = osc(T - S, calm ? 3.4 : 1.3) * (calm ? 5 : 2.5);
  const antic = build(T, Hh - 0.25, Hh, 0, 1) - hit(T, Hh, Hh + 0.1, 0, 1);
  const recoil = hit(T, Hh, Hh + 0.22, 0, 1) - glide(T, Hh + 0.22, I + 0.6, 0, 0.55);
  const bgRed = build(T, B, Hh, 0, 0.3) + hit(T, Hh, Hh + 0.3, 0, 0.25) + glide(T, I, E, 0, 0.3);
  const ro = glide(T, I - 0.1, I + 0.7, 0, 1);
  const rph = ((((T - I) * 46) % 30) + 30) % 30;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#7b4128' }}>
      <div style={{ position: 'absolute', inset: -90, transform: `scale(${1 + (cam - 1) * 0.4})`, filter: 'blur(34px)' }}>
        <div style={{ position: 'absolute', left: 210, top: 30, width: 560, height: 560, background: '#f6d3a6' }}></div>
        <div style={{ position: 'absolute', left: 470, top: 30, width: 40, height: 560, background: '#c98a5c' }}></div>
        <div style={{ position: 'absolute', left: 1570, top: 210, width: 360, height: 820, background: '#9a5c38' }}></div>
        <div style={{ position: 'absolute', left: 1610, top: 290, width: 120, height: 160, background: '#d9a77a' }}></div>
        <div style={{ position: 'absolute', left: 1750, top: 510, width: 140, height: 120, background: '#c58a60' }}></div>
        <div style={{ position: 'absolute', left: 50, top: 850, width: 760, height: 380, background: '#b9805a' }}></div>
        <div style={{ position: 'absolute', left: 850, top: 130, width: 260, height: 260, borderRadius: '50%', background: '#f8d9ae' }}></div>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: '#4a1208', mixBlendMode: 'multiply', opacity: bgRed }}></div>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${cam})`, transformOrigin: '1020px 420px' }}>
        <div style={{ position: 'absolute', left: smX - smR, top: smY - smR, width: smR * 2, height: smR * 2, borderRadius: '50%', opacity: smO,
          background: 'radial-gradient(circle, rgba(163,46,17,0.95) 0%, rgba(163,46,17,0.55) 38%, rgba(163,46,17,0) 70%)' }}></div>
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: ro }}>
          {Array.from({ length: 34 }, (_, i) => {
            const rr = 330 + i * 30 + rph;
            return <ellipse key={i} cx="1020" cy="590" rx={rr * 1.12} ry={rr * 0.96} fill="none" stroke="#c4482a" strokeWidth="7" opacity={clamp(1.35 - rr / 1300, 0, 1)} />;
          })}
        </svg>
        <Bust id="aBust" x={1020} y={28} k={0.95} pal={mixPal(PAL.cur, PAL.red, red)} contrast={contrast} rings={rings}
          boilFrame={boil ? Math.floor((T - S) * 8) : null}
          lx={glide(T, S, B, -0.45, -0.15) + hit(T, Hh, Hh + 0.2, 0, 0.95)} ly={-0.2}
          lift={glide(T, S, B, 0, -12) - antic * 5 + recoil * 28 + br}
          lean={glide(T, S, B, 0, -1.2) - recoil * 3 + glide(T, I, E, 0, 2.5)}
          tilt={glide(T, S, B, 0, -4) + recoil * 4 + glide(T, I, E, 0, 1.5)}
          nod={glide(T, S, B, 0, 0.35) - recoil * 0.7 + glide(T, I, E, 0, 0.9)}
          turn={recoil * 0.32 - glide(T, I, E, 0, 0.2)} />
      </div>
    </div>
  );
}

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
const ROW_MASK = [0.5, 0.72, 0.9];
const bodyPath = (lift) => `M -250 600 C -250 ${300 - lift}, -236 ${196 - lift}, -132 ${166 - lift} C -84 ${152 - lift}, -52 ${142 - lift}, -40 ${122 - lift} L 40 ${122 - lift} C 52 ${142 - lift}, 84 ${152 - lift}, 132 ${166 - lift} C 236 ${196 - lift}, 250 ${300 - lift}, 250 600 Z`;

function Person({ x, y, s, body, head, glowCol, glow = 0, nod = 0, lift = 0, sway = 0, opacity = 1, part = 'body' }) {
  const tf = `translate(${x} ${y}) rotate(${sway} 0 420) scale(${s})`;
  if (part === 'glow') {
    return (
      <g transform={tf}>
        <ellipse cx="0" cy="250" rx="150" ry="120" fill={glowCol} opacity={glow * 0.5} />
        <ellipse cx="0" cy={36 + nod * 10} rx="56" ry="46" fill={glowCol} opacity={glow * 0.34} />
      </g>
    );
  }
  return (
    <g transform={tf} opacity={opacity}>
      <path d={bodyPath(lift)} fill={body} />
      <rect x="-30" y="50" width="60" height="90" fill={head} />
      <ellipse cx="0" cy={nod * 10} rx="66" ry="82" fill={head} />
      {glow > 0 && <rect x="-26" y="200" width="52" height="84" rx="9" fill="#141518" />}
      {glow > 0 && <ellipse cx="-30" cy="276" rx="30" ry="22" fill={mix(body, '#ffffff', 0.12)} />}
      {glow > 0 && <ellipse cx="30" cy="276" rx="30" ry="22" fill={mix(body, '#ffffff', 0.12)} />}
    </g>
  );
}

function ConceptRoom({ T, c }) {
  const { glide, hit, build } = MOTION;
  const { S, B, I, E } = c;
  const Hh = B + 0.8;
  const cam = glide(T, S, B, 1.0, 1.12) + hit(T, Hh, Hh + 0.3, 0, 0.06) - glide(T, I, E, 0, 0.36);
  const bubble = glide(T, S + 0.2, B, 0, 1) - glide(T, B + 0.2, Hh, 0, 0.5) - glide(T, I, E, 0, 0.5);
  const vig = glide(T, S, B, 0, 1) - glide(T, I, E, 0, 0.8);
  const flipC = hit(T, Hh, Hh + 0.2, 0, 1);
  const recoil = hit(T, Hh, Hh + 0.2, 0, 1) - glide(T, Hh + 0.2, I + 0.5, 0, 0.6);
  const redTint = hit(T, Hh, Hh + 0.3, 0, 0.12) + glide(T, I, E, 0, 0.42);
  const cX = 960, cY = 460;
  const glowColor = (flip) => mix('#bcd3dc', '#ff4a2e', flip);
  const people = ROOM.map((f, i) => {
    const at = i === ROOM_FIRST ? B + 0.25 : I + 0.05 + (Math.hypot(f.x - cX, f.y - cY) / 1500) * 1.1;
    const flip = hit(T, at, at + 0.16, 0, 1);
    const masked = f.kind !== 'grey';
    const col = masked ? (f.kind === 'wd' ? '#46647a' : '#5fa69a') : ROW_SHIRT[f.row];
    return {
      key: i, row: f.row, x: f.x + osc(T, 3.1 + (i % 3) * 0.4, f.ph) * 3, y: f.y, s: f.s,
      body: col, head: masked ? col : ROW_HEAD[f.row], opacity: masked ? ROW_MASK[f.row] : 1,
      glowCol: glowColor(flip), glow: (0.5 + 0.5 * f.row / 2) * (1 + flip * 0.9),
      nod: 0.6, sway: osc(T, 3.4 + (i % 4) * 0.3, f.ph) * 1.2,
    };
  });
  const rowG = (rw, part) => people.filter((p) => p.row === rw).map(({ key, ...p }) => <Person key={key} {...p} part={part} />);
  const curCol = mix('#e0a165', '#c4482a', flipC * 0.6 + glide(T, I, E, 0, 0.2));
  const lightCol = mix('#fbe3b8', '#ff5a3a', flipC);
  const lightY = 236 - flipC * 150 - glide(T, I, E, 0, 20);
  const lightR = 230 + flipC * 160;
  const cNod = glide(T, S, B, 0.2, 0.7) - recoil * 1.2 + glide(T, I, E, 0, 0.8);
  const cLift = glide(T, S, B, 0, -10) + recoil * 26 + osc(T - S, 3.2) * 3;
  const cS = 1.1, cSway = glide(T, S, B, 0, -1) - recoil * 2.5;
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
              <stop offset="0" stopColor={lightCol} stopOpacity="0.95" />
              <stop offset="1" stopColor={lightCol} stopOpacity="0" />
            </radialGradient>
            <clipPath id="bCurClip">
              <path d={bodyPath(cLift)} />
              <rect x="-30" y="50" width="60" height="90" />
              <ellipse cx="0" cy={cNod * 10} rx="66" ry="82" />
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
              <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="g" />
              <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="bF" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="16" /></filter>
            <filter id="bGl" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="22" /></filter>
          </defs>
          <rect x="-600" y="-400" width="3120" height="1880" fill="url(#bBg)" />
          <g filter="url(#bG0)">{rowG(0, 'body')}</g>
          <g filter="url(#bGl)">{rowG(0, 'glow')}</g>
          <g filter="url(#bG1)">{rowG(1, 'body')}</g>
          <g filter="url(#bGl)">{rowG(1, 'glow')}</g>
          <g filter="url(#bG2)">{rowG(2, 'body')}</g>
          <g filter="url(#bGl)">{rowG(2, 'glow')}</g>
          <rect x="-600" y="-400" width="3120" height="1880" fill="url(#bVig)" />
          <circle cx="960" cy="640" r="620" fill="url(#bBub)" opacity={clamp(bubble, 0, 1)} />
          <g filter="url(#bCur)">
            <g transform={`translate(${cX} ${cY}) rotate(${cSway} 0 420) scale(${cS})`}>
              <path d={bodyPath(cLift)} fill={curCol} />
              <rect x="-30" y="50" width="60" height="90" fill={curCol} />
              <ellipse cx="0" cy={cNod * 10} rx="66" ry="82" fill={curCol} />
              <rect x="-300" y="-160" width="600" height="800" fill="url(#bCurL)" clipPath="url(#bCurClip)" />
              <rect x="-26" y="200" width="52" height="84" rx="9" fill={mix('#3a2418', '#2a0905', flipC)} opacity="0.6" />
              <ellipse cx="-30" cy="276" rx="30" ry="22" fill={mix(curCol, '#fff3dd', 0.35)} />
              <ellipse cx="30" cy="276" rx="30" ry="22" fill={mix(curCol, '#fff3dd', 0.35)} />
            </g>
          </g>
          <g filter="url(#bF)">
            {ROOM_FRONT.map((f, i) => <Person key={i} x={f.x} y={f.y} s={f.s} body="#16171a" head="#111214" nod={0.5} sway={osc(T, 3.6, i * 0.3) * 0.8} />)}
          </g>
        </svg>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: '#a32e11', mixBlendMode: 'multiply', opacity: redTint }}></div>
    </div>
  );
}

// ═══ C · BLINDS — home, lamp light, and what gets through the slats ═══
function ConceptBlinds({ T, c, boil }) {
  const { glide, hit, build } = MOTION;
  const { S, B, I, E } = c;
  const Hh = B + 0.75;
  const gap = glide(T, S + 0.3, B - 0.2, 15, 3) + hit(T, Hh, Hh + 0.25, 0, 7);
  const outRed = build(T, B, Hh, 0, 1);
  const outside = mix('#f4ead6', '#ff5a36', outRed);
  const bloom = 0.12 + build(T, B, Hh, 0, 0.55) + hit(T, Hh, Hh + 0.2, 0, 0.25);
  const sweep = T < Hh - 0.05 ? 30 : hit(T, Hh - 0.05, Hh + 0.45, 30, 135);
  const stripeCol = mix('#f4ead6', '#ff5a36', outRed);
  const wallO = 0.16 + build(T, B, Hh, 0, 0.14) + hit(T, Hh, Hh + 0.3, 0, 0.2) + glide(T, I, E, 0, 0.1);
  const figO = hit(T, Hh - 0.05, Hh + 0.3, 0, 0.5) + glide(T, I, E, 0, 0.12);
  const period = 46 - glide(T, I, E, 0, 12);
  const sw = 6 + hit(T, Hh, Hh + 0.3, 0, 6) + glide(T, I, E, 0, 3);
  const stripeBg = `repeating-linear-gradient(172deg, ${stripeCol} 0px, ${stripeCol} ${sw}px, rgba(0,0,0,0) ${sw}px, rgba(0,0,0,0) ${period}px)`;
  const sweepMask = `linear-gradient(to left, #000 ${sweep}%, rgba(0,0,0,0) ${sweep + 18}%)`;
  const dolly = glide(T, I - 0.1, E, 1, 1.42);
  const cam = glide(T, S, B, 1, 1.05) + hit(T, Hh, Hh + 0.25, 0, 0.03);
  const red = hit(T, Hh, Hh + 0.3, 0, 0.6) + glide(T, I, E, 0, 0.2);
  const tint = build(T, B, Hh, 0, 0.06) + glide(T, I, E, 0, 0.16);
  const recoil = hit(T, Hh, Hh + 0.2, 0, 1) - glide(T, Hh + 0.2, I + 0.5, 0, 0.5);
  const br = osc(T - S, T < I ? 3.4 : 1.4) * (T < I ? 5 : 2);
  const slats = Array.from({ length: 14 }, (_, i) => i);
  const pitch = 646 / 14;
  const dollyO = '1420px 455px';
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#9a5734' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${cam})`, transformOrigin: '760px 480px' }}>
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${dolly})`, transformOrigin: dollyO, filter: 'blur(2px)' }}>
          <div style={{ position: 'absolute', inset: -400, background: 'radial-gradient(circle at 26% 28%, rgba(246,214,160,0.85) 0%, rgba(246,214,160,0) 40%), linear-gradient(#a15d37, #8a4a2e)' }}></div>
          <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: wallO, background: stripeBg, WebkitMaskImage: sweepMask, maskImage: sweepMask }}></div>
          <div style={{ position: 'absolute', left: 1060, top: 110, width: 720, height: 690, background: '#7d3d2a' }}></div>
          <div style={{ position: 'absolute', left: 1082, top: 132, width: 676, height: 646, background: outside, overflow: 'hidden' }}>
            {slats.map((i) => (
              <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: i * pitch, height: pitch - gap,
                background: 'linear-gradient(#e6ad70 0px, #e6ad70 4px, #c47449 4px, #c47449 calc(100% - 4px), #9a5536 calc(100% - 4px))' }}></div>
            ))}
          </div>
          <div style={{ position: 'absolute', left: 900, top: -60, width: 1040, height: 1020, borderRadius: '50%', mixBlendMode: 'screen', opacity: bloom,
            background: `radial-gradient(circle, ${outside} 0%, rgba(0,0,0,0) 62%)` }}></div>
          <div style={{ position: 'absolute', left: 1030, top: 790, width: 780, height: 30, background: '#6a3224' }}></div>
        </div>
        <Bust id="cBust" x={620} y={70} k={0.95} pal={mixPal(PAL.cur, PAL.red, red)} contrast={1 + hit(T, Hh, Hh + 0.3, 0, 0.6)}
          rings={{ sigma: 34, d0: 16, gap: 15, w: 6, count: 3, phase: -(T - S) * 4, front: hit(T, Hh, Hh + 0.35, 140, -10) }}
          boilFrame={boil ? Math.floor((T - S) * 8) : null}
          lx={glide(T, S, B, -0.7, -0.55) + hit(T, Hh, Hh + 0.2, 0, 1.35)} ly={-0.25}
          lift={glide(T, S, B, 0, -12) + recoil * 22 + br}
          lean={glide(T, S, B, 0, -2) + recoil * 4}
          tilt={glide(T, S, B, 0, 3) - recoil * 5}
          nod={glide(T, S, B, 0, 0.4) - recoil * 0.5 + glide(T, I, E, 0, 0.8)}
          turn={0.32 - recoil * 0.6 + glide(T, I, E, 0, 0.12)} />
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${dolly})`, transformOrigin: dollyO, mixBlendMode: 'screen', opacity: figO,
          WebkitMaskImage: 'linear-gradient(to right, #000 0%, #000 53%, rgba(0,0,0,0) 56%)', maskImage: 'linear-gradient(to right, #000 0%, #000 53%, rgba(0,0,0,0) 56%)' }}>
          <div style={{ position: 'absolute', inset: 0, background: stripeBg, WebkitMaskImage: sweepMask, maskImage: sweepMask }}></div>
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: '#a32e11', mixBlendMode: 'multiply', opacity: tint }}></div>
    </div>
  );
}

// ═══ D · TOPOGRAPHY — top-down; her rings become terrain, the red is a rising tide ═══
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
  const Hh = B + 1.0;
  const walk = glide(T, S + 0.3, S + 2.9, 0, 1);
  const moving = T > S + 0.3 && T < S + 2.9;
  const cx = 640 + walk * 660, cy = 560 - walk * 40 - Math.sin(walk * Math.PI) * 30;
  const stepSway = moving ? osc(T - S, 0.55) * 7 * Math.sin(walk * Math.PI) : 0;
  const recoil = hit(T, Hh, Hh + 0.18, 0, 1) - glide(T, Hh + 0.18, I + 0.4, 0, 0.7);
  const look = T > I ? osc(T - I, 1.25) * 40 * (1 - glide(T, I + 0.8, E - 0.2, 0, 1)) : 0;
  const heading = -4 + stepSway - recoil * 16 + look;
  const sPop = 1 + recoil * 0.12 - glide(T, I, E, 0, 0.06);
  const sigma = glide(T, S, B, 26, 52);
  const plateau = 50 + glide(T, S, B, 0, 70);
  const rings = { d0: 10, gap: 15, w: 4, count: glide(T, S, B, 3, 7), phase: T < I ? 0 : -(T - I) * 30 };
  const curT = table(sigma, (d) => stripeAt(d, rings));
  let R;
  if (T < B) R = glide(T, S, B, 980, 1500);
  else if (T < Hh - 0.05) R = build(T, B, Hh - 0.05, 1500, 250);
  else if (T < I) R = hit(T, Hh - 0.05, Hh + 0.25, 250, 150);
  else R = glide(T, I, E, 150, 72);
  const edge = T < B ? 380 : glide(T, B, Hh, 380, 14);
  const follow = glide(T, S, B, 0, 1);
  const fx = 760 + (cx - 760) * follow, fy = 540 + (cy - 540) * follow;
  const sc = glide(T, S, B, 1, 1.3) + hit(T, Hh, Hh + 0.3, 0, 0.05) + glide(T, I, E, 0, 0.5);
  const rot = glide(T, S, E, 0, -7);
  const shake = T > Hh && T < Hh + 0.5 ? osc(T, 0.06) * 6 * (1 - (T - Hh) / 0.5) : 0;
  const rph = T < I ? 0 : -((((T - I) * 40) % 26) + 26) % 26;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#1b1f25' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H,
        transform: `translate(${960 + shake}px, 540px) rotate(${rot}deg) scale(${sc}) translate(${-fx}px, ${-fy}px)`, transformOrigin: '0 0' }}>
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
              <feComponentTransfer in="f" result="a"><feFuncA type="discrete" tableValues={curT} /></feComponentTransfer>
              <feFlood floodColor="#e0a165" floodOpacity="0.9" />
              <feComposite in2="a" operator="in" />
            </filter>
            <radialGradient id="dHole" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={R + edge}>
              <stop offset={R / (R + edge)} stopColor="#000" />
              <stop offset="1" stopColor="#fff" />
            </radialGradient>
            <mask id="dSea" maskUnits="userSpaceOnUse" x="-3000" y="-3000" width="8000" height="8000">
              <rect x="-3000" y="-3000" width="8000" height="8000" fill="url(#dHole)" />
            </mask>
          </defs>
          <rect x="-3000" y="-3000" width="8000" height="8000" fill="#1b1f25" />
          <g filter="url(#dOth)">
            {TOPO_OTHERS.map((o, i) => <circle key={i} cx={o.x} cy={o.y} r="48" fill="#000" />)}
          </g>
          {TOPO_OTHERS.map((o, i) => (
            <TopPerson key={i} x={o.x} y={o.y} rot={o.r + osc(T, 2.6 + (i % 3) * 0.5, i * 0.21) * 6} body={TOPO_COL[o.k][0]} head={TOPO_COL[o.k][1]} phone="#bcd3dc" />
          ))}
          <g filter="url(#dCur)">
            <circle cx={cx} cy={cy} r={plateau} fill="#000" />
          </g>
          <g mask="url(#dSea)">
            <rect x="-3000" y="-3000" width="8000" height="8000" fill="#a32e11" />
            {Array.from({ length: 50 }, (_, i) => (
              <circle key={i} cx={cx} cy={cy} r={Math.max(1, R + 10 + i * 26 + rph)} fill="none" stroke="#6b1d0c" strokeWidth="5" />
            ))}
          </g>
          <TopPerson x={cx} y={cy} rot={heading} s={sPop} body={mix('#e0a165', '#c4482a', recoil * 0.5 + glide(T, I, E, 0, 0.3))} head={mix('#c47449', '#8f2a12', recoil * 0.4 + glide(T, I, E, 0, 0.3))} crown="#f2c98a" phone={mix('#fbe3b8', '#ff4a2e', hit(T, Hh, Hh + 0.15, 0, 1))} />
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
const NAMES = { A: 'Halo', B: 'The Room', C: 'Blinds', D: 'Topography' };

function Piece({ guide, boil, grain }) {
  const { T, CUES, authoredTotal } = useComposition();
  const seg = (L) => ({ S: CUES[L + ' Soothe'], B: CUES[L + ' Breach'], I: CUES[L + ' Inescapable'] });
  const A = seg('A'), Bq = seg('B'), C = seg('C'), D = seg('D');
  A.E = Bq.S; Bq.E = C.S; C.E = D.S; D.E = authoredTotal;
  const local = (q) => clamp(T, q.S, q.E - 0.001);
  const cur = T < Bq.S ? 'A' : T < C.S ? 'B' : T < D.S ? 'C' : 'D';
  const items = [];
  [A, Bq, C, D].forEach((q) => { items.push({ at: q.S, text: LINES[0] }, { at: q.B, text: LINES[1] }, { at: q.I, text: LINES[2], until: q.E - 0.05 }); });
  return (
    <div data-screen-label={`${cur} · ${Math.floor(T)}s`} style={{ position: 'absolute', inset: 0, background: '#0e0f11' }}>
      <Shot from={A.S} to={A.E}><ConceptHalo T={local(A)} c={A} boil={boil} /></Shot>
      <Shot from={Bq.S} to={Bq.E}><ConceptRoom T={local(Bq)} c={Bq} /></Shot>
      <Shot from={C.S} to={C.E}><ConceptBlinds T={local(C)} c={C} boil={boil} /></Shot>
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

function FUCurationConcepts() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { motionEditor: true, referenceOverlay: true, lineBoil: true, grain: 0.2 });
  return (
    <React.Fragment>
      <CompositionStage width={W} height={H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg="#0e0f11">
        <Piece guide={t.referenceOverlay} boil={t.lineBoil} grain={t.grain} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Editor" />
        <TweakToggle label="Motion editor" value={t.motionEditor} onChange={(v) => setTweak('motionEditor', v)} />
        <TweakSection label="Preview" />
        <TweakToggle label="Label + narration guide" value={t.referenceOverlay} onChange={(v) => setTweak('referenceOverlay', v)} />
        <TweakToggle label="Line boil (8 fps)" value={t.lineBoil} onChange={(v) => setTweak('lineBoil', v)} />
        <TweakSlider label="Film grain" value={t.grain} min={0} max={0.5} step={0.01} onChange={(v) => setTweak('grain', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

window.FUCurationConcepts = FUCurationConcepts;
