// Feeding Uncertainty — the toned look: the Bean posterized into its group's ramp, lit by the scene's own lights (see LOOK.md).
// The film's testimony portraits live inside one tonal ramp per group: 7 tones from a tinted dark to a pale cream, no black.
// The animations borrow that: scenes are authored in VALUE (greys) and coloured by a grade, the way the portraits are photo
// luminance mapped onto a ramp. Figures are toned into flat bands; there are no contour rings.
// Load it after animations-v3.jsx and rigs/bean-rig.jsx; it exports window.FU_LOOK and touches no other globals.
//
//   <LookDefs ramps={['open', 'cur']} bf={bf} amp={amp} />   filters, once per <svg>
//   <g filter="url(#fuGradeBg-open)">…</g>                     smooth gradient map + depth-of-field blur (backgrounds)
//   <g filter="url(#fuGradeFg-open)">…</g>                     posterized gradient map (sets, light pools)
//   <ToneBean ramp="open" x y s pose lights={[…]} hair="beanie" bf amp />   a toned Bean, side or front view
//   <BeanBust ramp="open" x y s turn lights={[…]} hair="long" bf amp />     the Bean in close-up, framed like the portraits
//
// Lights are in the same coordinates as the figure's x, y (the scene's world space):
//   { x, y, i, reach }   a point light (lamp, streetlight, phone): intensity 0..1, falling to half at `reach` px
//   { dir: [dx, dy], i } a directional light, dir pointing from the light into the scene
// Each body part is lit from the light's direction and dimmed by its distance, so the bands follow a swinging lamp or a
// figure walking out of a streetlight's pool. Without lights a figure gets DEFAULT_LIGHTS (soft key from the upper right).
(() => {
  // ── ramps measured from the reference stills (k-means, 7 clusters), tidied to rise evenly in brightness ──
  const RAMPS = {
    cur: ['#472a1d', '#613627', '#7e4634', '#965e43', '#b47f57', '#caa377', '#e2ceae'],
    open: ['#1b3836', '#2f5a51', '#457260', '#558d79', '#77a27f', '#8fb698', '#b6ccb1'],
    wd: ['#131d27', '#1b2937', '#24364a', '#2f455e', '#4a687c', '#6f8f98', '#a3bdb6'],
    red: ['#2b0f0a', '#4d170d', '#73200f', '#a32e11', '#cc4a2a', '#ee7a55', '#f6c9ad'],
  };
  const DEFAULT_LIGHTS = [{ dir: [-0.45, 0.9], i: 0.72 }];
  const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const rgbHex = (c) => '#' + c.map((x) => Math.round(clamp(x, 0, 255)).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A.map((x, i) => x + (B[i] - x) * clamp(t, 0, 1))); };
  const rampOf = (r) => (Array.isArray(r) ? r : RAMPS[r]);
  const mixRamp = (A, B, t) => rampOf(A).map((c, i) => mix(c, rampOf(B)[i], t));
  const v = (x) => { const g = Math.round(clamp(x, 0, 1) * 255).toString(16).padStart(2, '0'); return '#' + g + g + g; };   // a value as a grey
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const chan = (ramp, i) => ramp.map((c) => (hexRgb(c)[i] / 255).toFixed(4)).join(' ');
  const lum = (g = 1, b = 0) => { const r = (k) => (k * g).toFixed(4); const row = `${r(0.2126)} ${r(0.7152)} ${r(0.0722)} 0 ${b}`; return `${row}  ${row}  ${row}  0 0 0 1 0`; };
  const mapFuncs = (ramp, type) => [0, 1, 2].map((i) => React.createElement(['feFuncR', 'feFuncG', 'feFuncB'][i], { key: i, type, tableValues: chan(ramp, i) }));
  const safeId = (s) => 'fu' + String(s).replace(/[^a-zA-Z0-9_-]/g, '');

  // grey value-noise textures, baked once on a canvas (feTurbulence is far too slow on the CPU at 4K).
  // cells sets the grain: a random cells × cells grid, smoothed up to 256 px. Four boil textures cycle at 8 fps.
  function bakeGray(seed, cells) {
    let st = seed >>> 0; const rnd = () => (st = (st * 1664525 + 1013904223) >>> 0) / 4294967296;
    const s = document.createElement('canvas'); s.width = s.height = cells;
    const g = s.getContext('2d'), im = g.createImageData(cells, cells);
    for (let i = 0; i < im.data.length; i += 4) { const x = rnd() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = x; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0);
    const b = document.createElement('canvas'); b.width = b.height = 256;
    const bg = b.getContext('2d'); bg.imageSmoothingEnabled = true; bg.imageSmoothingQuality = 'high'; bg.filter = `blur(${(256 / cells) * 0.35}px)`;
    bg.drawImage(s, -1, -1, 258, 258);
    return b.toDataURL('image/png');
  }
  const NOISE = { fine: bakeGray(7, 14), coarse: bakeGray(11, 9), boil: [21, 33, 45, 57].map((k) => bakeGray(k, 20)) };

  // ── grade: luminance → ramp. poster = flat bands (discrete), else a smooth gradient map. blur = depth of field ──
  // gain / lift shape the values before mapping (a dark set can be lifted into the ramp's middle tones).
  // Region is in the user space of the element it is applied to; the default covers the 1920 × 1080 frame.
  function GradeFilter({ id, ramp, poster = false, blur = 0, gain = 1, lift = 0, region = [-200, -200, 2320, 1480] }) {
    return (
      <filter id={id} filterUnits="userSpaceOnUse" x={region[0]} y={region[1]} width={region[2]} height={region[3]} colorInterpolationFilters="sRGB">
        {blur > 0 && <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="g0" />}
        <feColorMatrix in={blur > 0 ? 'g0' : 'SourceGraphic'} type="matrix" values={lum(gain, lift)} result="g1" />
        <feComponentTransfer in="g1">{mapFuncs(rampOf(ramp), poster ? 'discrete' : 'table')}</feComponentTransfer>
        {poster && <feGaussianBlur stdDeviation="0.45" />}
      </filter>
    );
  }

  // ── tone: a figure posterized into its group's ramp ───────────────────────────
  // 1. the lit value art → luminance; 2. multiplied by an edge field (the silhouette's alpha, blurred by `edge`), so every
  // part darkens toward its outline and the bands run parallel to it (no slivers where a band meets the edge); 3. a little
  // low-frequency value noise makes the band edges irregular like the portraits, and a smaller one boils them at 8 fps;
  // 4. posterized to the ramp; 5. cut to the exact silhouette, so the outline stays the rig's own crisp, boiling shape.
  function ToneFilter({ id, ramp, edge = 7, depth = 0.5, grain = 0.1, coarse = false, soft = 1.1, gain = 1, lift = 0, bf = 0, amp = 0.5, region = [-180, -340, 360, 400] }) {
    const img = (href, r) => <feImage href={href} x={region[0]} y={region[1]} width={region[2]} height={region[3]} preserveAspectRatio="none" result={r} />;
    const bAmt = 0.035 * amp;
    return (
      <filter id={id} filterUnits="userSpaceOnUse" x={region[0]} y={region[1]} width={region[2]} height={region[3]} colorInterpolationFilters="sRGB">
        <feColorMatrix in="SourceGraphic" type="matrix" values={lum(gain, lift)} result="l" />
        <feGaussianBlur in="SourceAlpha" stdDeviation={edge} result="eb" />
        <feColorMatrix in="eb" type="matrix" values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 0 1" result="e" />
        <feComposite in="l" in2="e" operator="arithmetic" k1={depth} k2={1 - depth} k3="0" k4="0" result="sh" />
        {img(coarse ? NOISE.coarse : NOISE.fine, 'n')}
        <feComposite in="sh" in2="n" operator="arithmetic" k1="0" k2="1" k3={grain} k4={-grain / 2} result="sn" />
        {img(NOISE.boil[bf % 4], 'nb')}
        <feComposite in="sn" in2="nb" operator="arithmetic" k1="0" k2="1" k3={bAmt} k4={-bAmt / 2} result="sb" />
        <feGaussianBlur in="sb" stdDeviation={soft} result="b" />
        <feComponentTransfer in="b" result="p">
          {mapFuncs(rampOf(ramp), 'discrete')}
          <feFuncA type="linear" slope="0" intercept="1" />
        </feComponentTransfer>
        <feGaussianBlur in="p" stdDeviation="0.45" result="pa" />
        <feComposite in="pa" in2="SourceAlpha" operator="in" />
      </filter>
    );
  }
  // soft glow for the "colour-mask" look of the film's stock crowd shots
  function GlowFilter({ id, r = 14, op = 0.7 }) {
    return (
      <filter id={id} x="-60%" y="-40%" width="220%" height="180%">
        <feGaussianBlur in="SourceGraphic" stdDeviation={r} result="g" />
        <feComponentTransfer in="g" result="g2"><feFuncA type="linear" slope={op} /></feComponentTransfer>
        <feMerge><feMergeNode in="g2" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    );
  }

  // everything a scene needs for the given ramps, plus the red ramp for crisis content
  function LookDefs({ ramps = ['open'], bf = 0, amp = 0.5, dof = 20 }) {
    const all = Array.from(new Set([...ramps, 'red']));
    return (
      <defs>
        {all.map((r) => (
          <React.Fragment key={r}>
            <GradeFilter id={'fuGradeBg-' + r} ramp={r} blur={dof} />
            <GradeFilter id={'fuGradeFg-' + r} ramp={r} poster />
            <ToneFilter id={'fuTone-' + r} ramp={r} bf={bf} amp={amp} />
            <ToneFilter id={'fuBustTone-' + r} ramp={r} edge={40} depth={0.32} grain={0.05} coarse soft={9} bf={bf} amp={amp} region={BUST_REGION} />
            <ToneFilter id={'fuHair-' + r} ramp={r} edge={5} grain={0} soft={1.2} bf={bf} amp={amp} />
            <ToneFilter id={'fuBustHair-' + r} ramp={r} edge={30} depth={0.4} grain={0} soft={6} bf={bf} amp={amp} region={BUST_REGION} />
          </React.Fragment>
        ))}
        <radialGradient id="fuPool" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={v(0.98)} /><stop offset="0.3" stopColor={v(0.78)} />
          <stop offset="0.62" stopColor={v(0.52)} stopOpacity="0.9" /><stop offset="1" stopColor={v(0.3)} stopOpacity="0" />
        </radialGradient>
        <GlowFilter id="fuGlow" />
      </defs>
    );
  }

  // ── lighting ──────────────────────────────────────────────────────────────────
  // lights → the figure's local frame (origin under the hips, x forward, unscaled). k is the figure's world scale.
  const toLocal = (lights, x, y, s, dir) => (lights || DEFAULT_LIGHTS).map((L) => (L.dir
    ? { dir: [L.dir[0] * dir, L.dir[1]], i: L.i }
    : { p: [((L.x - x) / s) * dir, (L.y - y) / s], i: L.i, reach: L.reach || 300 }));
  // how strongly a light reaches a point c (local), and from which direction; k converts local distance to world px
  function lightAt(L, c, k) {
    if (L.dir) { const n = Math.hypot(L.dir[0], L.dir[1]) || 1; return { f: L.i, u: [-L.dir[0] / n, -L.dir[1] / n] }; }
    const d = [L.p[0] - c[0], L.p[1] - c[1]], n = Math.hypot(d[0], d[1]) || 1, w = (n * k) / L.reach;
    return { f: L.i / (1 + w * w), u: [d[0] / n, d[1] / n] };
  }
  // a part filled with its base value, brightened from each light's side (clipped to the part). c, rho: the part's centre
  // and rough radius in local units; the bands that come out of the posterize then sit where the light falls.
  function LitShape({ d, c, rho, base, lights, k, uid, gain = 1 }) {
    return (
      <g>
        <path d={d} fill={v(base)} />
        <clipPath id={uid + 'c'}><path d={d} /></clipPath>
        <g clipPath={`url(#${uid}c)`}>
          {lights.map((L, i) => {
            const { u } = lightAt(L, c, k), f = lightAt(L, c, k).f * gain;
            if (f < 0.01) return null;
            const cx = c[0] + u[0] * rho * 0.85, cy = c[1] + u[1] * rho * 0.85;
            return (
              <g key={i}>
                <radialGradient id={uid + 'g' + i} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={rho * 1.9}>
                  <stop offset="0" stopColor="#fff" stopOpacity={clamp(f, 0, 1)} />
                  <stop offset="0.45" stopColor="#fff" stopOpacity={clamp(f * 0.7, 0, 1)} />
                  <stop offset="0.8" stopColor="#fff" stopOpacity={clamp(f * 0.25, 0, 1)} />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
                <circle cx={cx} cy={cy} r={rho * 1.9} fill={`url(#${uid}g${i})`} />
              </g>
            );
          })}
        </g>
      </g>
    );
  }
  // the total light at a point, for parts too thin to shade (limbs, shoes)
  const lightSum = (lights, c, k) => clamp(lights.reduce((a, L) => a + lightAt(L, c, k).f, 0), 0, 1);

  // ── boil: the same 8 fps wobble as the Bean rig ───────────────────────────────
  function boilFn(f, id, amp) {
    if (!amp) return () => 0;
    const p1 = hash(f * 7.3 + id * 1.9) * 6.283, p2 = hash(f * 3.1 + id * 5.7) * 6.283, p3 = hash(f * 9.7 + id * 2.3) * 6.283;
    const a = amp * (0.7 + 0.6 * hash(f * 1.3 + id * 8.1));
    return (t) => a * (Math.sin(2 * t + p1) + 0.6 * Math.sin(3 * t + p2) + 0.35 * Math.sin(5 * t + p3));
  }
  const fx = (n) => n.toFixed(1);
  const pathOf = (P, close) => P.map((p, i) => (i ? 'L' : 'M') + fx(p[0]) + ' ' + fx(p[1])).join(' ') + (close ? ' Z' : '');
  const circlePath = (c, r, b, N = 48) => pathOf(Array.from({ length: N }, (_, i) => { const t = (i / N) * 2 * Math.PI, rr = r + (b ? b(t) : 0); return [c[0] + rr * Math.cos(t), c[1] + rr * Math.sin(t)]; }), true);
  const addv = (a, b) => [a[0] + b[0], a[1] + b[1]], mulv = (a, s) => [a[0] * s, a[1] * s];
  const centroid = (P) => mulv(P.reduce((a, p) => addv(a, p), [0, 0]), 1 / P.length);
  const egg = (cy, ry, wb, wt, shift, N = 40) => Array.from({ length: N }, (_, i) => {
    const t = (i / N) * 2 * Math.PI, s = Math.sin(t);
    return [Math.cos(t) * (wb + (wt - wb) * (s + 1) / 2) + shift * (1 - Math.abs(s)), cy + ry * s];
  });
  const BODY = egg(40, 54, 28, 18, 4), FBODY = egg(40, 54, 28, 18, 0);

  // keep the part of a convex polygon within distance d of the line through p0, measured along the unit normal n
  function clipHalf(poly, p0, n, d) {
    const f = (p) => (p[0] - p0[0]) * n[0] + (p[1] - p0[1]) * n[1] - d, out = [];
    poly.forEach((a, i) => {
      const b = poly[(i + 1) % poly.length], fa = f(a), fb = f(b);
      if (fa <= 0) out.push(a);
      if ((fa <= 0) !== (fb <= 0)) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    });
    return out;
  }
  // ── hair, in the head's own frame: a = along `fwd` (forward, or screen right in the front view), b = along `up` ──
  // beanie: a knitted cap over the top of the head with a folded brim. long: hair over the top and falling behind the
  // shoulders. Returns { back, front, fold }: back is drawn behind the body, front over the head; fold is the beanie's crease.
  function hairShapes(kind, Hc, r, up, fwd, view, neckDown) {
    if (!kind || kind === 'none') return null;
    const P = (a, b) => addv(Hc, addv(mulv(fwd, a * r), mulv(up, b * r)));
    const arc = (R, t0, t1, n = 24, dome = 0) => Array.from({ length: n + 1 }, (_, i) => { const t = t0 + ((t1 - t0) * i) / n; return P(R * Math.cos(t), R * Math.sin(t) * (1 + dome * Math.max(0, Math.sin(t)))); });
    if (kind === 'beanie') {
      // the cap sits lower at the back in profile; level in the front view
      const [t0, t1] = view === 'front' ? [0.32, Math.PI - 0.32] : [0.42, Math.PI + 0.08];
      // a knitted cap: it hugs the skull at its lower edge (no ledge sticking out past the head) and swells a little above
      const sm = (x) => { const u = clamp(x / 0.6, 0, 1); return u * u * (3 - 2 * u); };
      const crown = Array.from({ length: 41 }, (_, i) => {
        const t = t0 + ((t1 - t0) * i) / 40, R = 1 + 0.08 * sm(Math.min(t - t0, t1 - t));
        return P(R * Math.cos(t), R * Math.sin(t) * (1 + 0.16 * Math.max(0, Math.sin(t))));
      });
      // the folded brim: the strip of the cap within 0.3 head radii of its lower edge
      const a0 = crown[0], a1 = crown[crown.length - 1], e = [a1[0] - a0[0], a1[1] - a0[1]], el = Math.hypot(e[0], e[1]) || 1;
      let n = [-e[1] / el, e[0] / el];
      if (n[0] * up[0] + n[1] * up[1] < 0) n = [-n[0], -n[1]];
      // the hat is toned as one even surface; the fold is a crisp crease drawn after the toning (an edge in value between
      // brim and crown made the light bands jog there, which read as steps)
      const brim = clipHalf(crown, a0, n, 0.3 * r);
      const fold = brim.filter((q) => Math.abs((q[0] - a0[0]) * n[0] + (q[1] - a0[1]) * n[1] - 0.3 * r) < 1e-6);
      // the crease stops a little short of the hat's edge
      const inset = (A, B) => { const d = [B[0] - A[0], B[1] - A[1]], l = Math.hypot(d[0], d[1]) || 1, k = (0.07 * r) / l; return [[A[0] + d[0] * k, A[1] + d[1] * k], [B[0] - d[0] * k, B[1] - d[1] * k]]; };
      return { front: pathOf(crown, true), fold: fold.length === 2 ? inset(fold[0], fold[1]) : null };
    }
    // long hair
    if (view === 'front') {
      const top = arc(1.12, -0.25, Math.PI + 0.25);
      const fall = neckDown + 0.9;   // down past the shoulders, in head radii below the head centre
      const back = [...top, P(-1.16, -fall + 0.4), P(-1.02, -fall + 0.06), P(-0.8, -fall), P(0.8, -fall), P(1.02, -fall + 0.06), P(1.16, -fall + 0.4)];
      const cap = [...arc(1.06, 0.38, Math.PI - 0.38), P(-0.62, 0.42), P(-0.1, 0.5), P(0.62, 0.42)];
      return { back: pathOf(back, true), front: pathOf(cap, true) };
    }
    const back = [...arc(1.07, 0.95, Math.PI + 0.35), P(-1.05, -(neckDown + 1.05)), P(-0.55, -(neckDown + 1.1)), P(-0.35, -0.6)];
    const cap = [...arc(1.06, 1.05, Math.PI + 0.15), P(-0.4, 0.2), P(0.25, 0.62)];
    return { back: pathOf(back, true), front: pathOf(cap, true) };
  }

  // ── the Bean in value, lit ────────────────────────────────────────────────────
  // geometry for either view, in the rig's own frame (origin on the floor under the hips, facing +x), with the 8 fps boil
  function beanGeom(pose, view, headScale, bf, amp, id) {
    const B = window.FU_BEAN;
    const J = (p, k) => (amp ? [p[0] + (hash(bf * 3.1 + k * 1.7 + id * 13.3) - 0.5) * 1.6 * amp, p[1] + (hash(bf * 7.7 + k * 1.3 + id * 5.1) - 0.5) * 1.6 * amp] : p);
    const hb = boilFn(bf, id * 31 + 7, amp * 0.8);
    if (view === 'front') {
      const p = { lean: 0, tilt: 0, ...pose };
      const R = B.frontRig({ ...pose, armL: pose.armL || [8, 6], armR: pose.armR || [8, 6] }, headScale);   // null hides an arm
      const a = ((p.lean + p.tilt) * Math.PI) / 180;
      return {
        view, Hc: R.Hc, r: R.r, hb, eyes: R.eyes, up: [Math.sin(a), -Math.cos(a)], fwd: [Math.cos(a), Math.sin(a)],
        body: FBODY.map((q, i) => J(R.loc(q[0], q[1]), 200 + i)),
        legs: [[R.legL, 9, 1, 1], [R.legR, 9, 1, 2]], arms: [...(pose.armL === null ? [] : [[R.armL, 8, 1, 5]]), ...(pose.armR === null ? [] : [[R.armR, 8, 1, 6]])],
        shoes: [[addv(R.legL[2], [-4, 1]), 9, 1, 11], [addv(R.legR[2], [4, 1]), 9, 1, 12]], hand: null, neckDown: (R.Hc[1] - R.N[1]) / -R.r, J,
      };
    }
    const R = B.rig(pose, headScale);
    const loc = (x, y) => addv(R.H, addv(mulv(R.fw, x), mulv(R.u, y)));
    return {
      view, Hc: R.Hc, r: R.r, hb, up: R.uh, fwd: R.fh, eyes: [addv(addv(R.Hc, mulv(R.fh, R.r * 0.52)), mulv(R.uh, R.r * 0.12))],
      body: BODY.map((q, i) => J(loc(q[0], q[1]), 200 + i)),
      legs: [[R.legF, 9, 0.78, 1], [R.legN, 9, 1, 3]], armsBack: [[R.armF, 8, 0.78, 2]], arms: [[R.armN, 8, 1.06, 5]],
      shoes: [[addv(R.legF[2], [7, 1]), 11, 0.78, 11], [addv(R.legN[2], [7, 1]), 11, 1, 12]], hand: R.armN[2], phone: R.phone,
      neckDown: Math.hypot(R.Hc[0] - R.S[0], R.Hc[1] - R.S[1]) / R.r, J,
    };
  }
  // part: 'back' (hair behind the body), 'body' (everything but hair) or 'front' (hair over the head)
  function BeanValue({ G, lights, k, amb, hair, hairTone, uid, part = 'body' }) {
    const limbV = (P, m) => clamp((amb * 1.05 + (1 - amb) * 0.55 * lightSum(lights, P[1], k)) * m, 0, 1);
    const armV = (P, m) => clamp((amb * 1.2 + (1 - amb) * 0.8 * lightSum(lights, P[1], k)) * m, 0, 1);   // the near arm reads over the body
    const jit = G.J || ((p) => p);
    const limb = ([P, w, m, kk], arm) => <path key={'l' + kk} d={pathOf(P.map((p, i) => jit(p, kk * 10 + i)))} stroke={v((arm === true ? armV : limbV)(P, m))} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    const shoe = ([p, rx, m, kk]) => { const q = jit(p, kk); return <ellipse key={'s' + kk} cx={q[0]} cy={q[1]} rx={rx} ry="5" fill={v(limbV([p, p], m * 0.85))} />; };
    const H = hairShapes(hair, G.Hc, G.r, G.up, G.fwd, G.view, G.neckDown);
    const hc = addv(G.Hc, mulv(G.up, G.r * 0.5));
    const side = G.view !== 'front';
    if (part === 'back') return H && H.back ? <LitShape d={H.back} c={hc} rho={G.r * 1.2} base={hairTone} lights={lights} k={k} uid={uid + 'hb'} gain={0.35} /> : null;
    if (part === 'front') return H ? (
      <g>
        {H.front && <LitShape d={H.front} c={hc} rho={G.r} base={hairTone} lights={lights} k={k} uid={uid + 'hf'} gain={0.35} />}
      </g>
    ) : null;
    return (
      <g>
        {side && G.legs.slice(0, 1).map(limb)}
        {side && G.shoes.slice(0, 1).map(shoe)}
        {side && G.armsBack.map(limb)}
        {side ? G.legs.slice(1).map(limb) : G.legs.map(limb)}
        {side ? G.shoes.slice(1).map(shoe) : G.shoes.map(shoe)}
        <LitShape d={pathOf(G.body, true)} c={centroid(G.body)} rho={46} base={amb} lights={lights} k={k} uid={uid + 'b'} />
        <LitShape d={circlePath(G.Hc, G.r, G.hb)} c={G.Hc} rho={G.r} base={amb * 1.08} lights={lights} k={k} uid={uid + 'h'} />
        {G.arms.map((a) => limb(a, true))}
      </g>
    );
  }

  // ── ToneBean: the Bean toned into its group's ramp ────────────────────────────
  // x, y: floor point under the hips. ramp: a RAMPS key or an array of 7 colours. lights: see the top of the file.
  // amb: the figure's value with no light on it (0.34 sits in the ramp's lower middle). hair: 'none' | 'beanie' | 'long'.
  // phone 0..1: a phone in the near hand, which is also a light on the face. Eyes and phone are drawn after the toning,
  // so they stay sharp. id: unique per figure on screen (boil seed).
  // Hair is toned as its own layer (hairId, default fuHair-<ramp>) with no grain, so a hat or a fall of hair keeps clean bands.
  function ToneBean({ x, y, s = 1, dir = 1, pose, view = 'side', ramp = 'open', lights, amb = 0.34, hair = 'none', hairTone = 0.16, headScale = 1, phone = 0, op = 1, toneId, hairId, eyes = true, bf = 0, amp = 0.5, id = 1 }) {
    const uid = safeId(React.useId());
    const key = typeof ramp === 'string' ? ramp : 'custom';
    const R = rampOf(ramp);
    const G = beanGeom(pose, view, headScale, bf, amp, id);
    const L = toLocal(lights, x, y, s, dir);
    const ph = view === 'front' ? 0 : phone;
    if (ph > 0.01 && G.hand) L.push({ p: G.hand, i: 0.75 * ph, reach: 34 * s });   // screen light on the face
    const h = G.hand, er = 3.8 * Math.max(0.85, G.r / 26);
    const hf = hairId || (typeof ramp === 'string' ? 'fuHair-' + key : toneId || 'fuTone-' + key);
    const HS = hair === 'beanie' ? hairShapes(hair, G.Hc, G.r, G.up, G.fwd, G.view, G.neckDown) : null, fold = HS && HS.fold;
    return (
      <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op}>
        <g transform={`scale(${dir} 1)`}>
          {hair !== 'none' && <g filter={`url(#${hf})`}><BeanValue G={G} lights={L} k={s} amb={amb} hair={hair} hairTone={hairTone} uid={uid} part="back" /></g>}
          <g filter={`url(#${toneId || 'fuTone-' + key})`}><BeanValue G={G} lights={L} k={s} amb={amb} hair={hair} hairTone={hairTone} uid={uid} /></g>
          {hair !== 'none' && <g filter={`url(#${hf})`}><BeanValue G={G} lights={L} k={s} amb={amb} hair={hair} hairTone={hairTone} uid={uid} part="front" /></g>}
          {fold && <line x1={fold[0][0]} y1={fold[0][1]} x2={fold[1][0]} y2={fold[1][1]} stroke={R[0]} strokeOpacity="0.55" strokeWidth={G.r * 0.05} strokeLinecap="round" />}
          {eyes && G.eyes.map((e, i) => <circle key={i} cx={e[0]} cy={e[1]} r={er} fill={R[0]} />)}
          {ph > 0.01 && h && <rect x={h[0] - 3} y={h[1] - 12} width="6" height="24" rx="2" fill={R[6]} opacity={ph} transform={`rotate(${(-30).toFixed(1)} ${fx(h[0])} ${fx(h[1])})`} />}
        </g>
      </g>
    );
  }

  // ── BeanBust: the Bean in close-up, head and shoulders, framed like the testimony portraits ──
  // Built from the Bean's own proportions ×9: the round head over the narrow top of the egg body. Local frame: origin at
  // the bottom centre of the frame edge; the head is about 470 across. turn -1..1 turns the face toward screen right (+).
  // hair: 'none' | 'beanie' | 'long'. Lights as for ToneBean.
  const BK = 9, HIP = 300;   // bust scale over the rig, and where the (off-frame) hip sits below the frame edge
  const BUST_REGION = [-460, -1060, 920, 1120];
  function BeanBust({ x, y, s = 1, ramp = 'open', lights, amb = 0.34, hair = 'none', hairTone = 0.16, turn = 0.35, tilt = 0, nod = 0, op = 1, toneId, hairId, eyes = true, bf = 0, amp = 0.5, id = 1 }) {
    const uid = safeId(React.useId());
    const key = typeof ramp === 'string' ? ramp : 'custom';
    const R = rampOf(ramp);
    const L = toLocal(lights, x, y, s, 1);
    const hb = boilFn(bf, id * 31 + 7, amp * 0.8 * BK * 0.5);
    const J = (p, kk) => (amp ? [p[0] + (hash(bf * 3.1 + kk * 1.7 + id * 13.3) - 0.5) * 1.6 * amp * 3, p[1] + (hash(bf * 7.7 + kk * 1.3 + id * 5.1) - 0.5) * 1.6 * amp * 3] : p);
    const body = egg(40, 54, 28, 18, turn * 4).map(([px, py], i) => J([px * BK, HIP - py * BK], i));
    const r = 26 * BK, Hc = [6 * turn * BK, HIP - (84 + 6 + 26) * BK + 10 * nod];
    const a = (tilt * Math.PI) / 180, up = [Math.sin(a), -Math.cos(a)], fwd = [Math.cos(a), Math.sin(a)];
    const H = hairShapes(hair, Hc, r, up, fwd, 'front', 1.15);
    const eo = turn * 0.42 * r, ex = 0.32 * r;
    const eye = (sd) => addv(Hc, addv(mulv(fwd, eo + sd * ex), mulv(up, r * 0.04)));
    const hc = addv(Hc, mulv(up, r * 0.5));
    return (
      <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op}>
        {H && H.back && <g filter={`url(#${hairId || toneId || 'fuBustHair-' + key})`}><LitShape d={H.back} c={hc} rho={r * 1.2} base={hairTone} lights={L} k={s} uid={uid + 'hb'} gain={0.35} /></g>}
        <g filter={`url(#${toneId || 'fuBustTone-' + key})`}>
          <LitShape d={pathOf(body, true)} c={centroid(body)} rho={46 * BK} base={amb * 0.92} lights={L} k={s} uid={uid + 'b'} gain={0.8} />
          <LitShape d={circlePath(Hc, r, hb, 72)} c={Hc} rho={r} base={amb * 1.08} lights={L} k={s} uid={uid + 'h'} />
        </g>
        {H && <g filter={`url(#${hairId || toneId || 'fuBustHair-' + key})`}>
          {H.front && <LitShape d={H.front} c={hc} rho={r} base={hairTone} lights={L} k={s} uid={uid + 'hf'} gain={0.35} />}
        </g>}
        {H && H.fold && <line x1={H.fold[0][0]} y1={H.fold[0][1]} x2={H.fold[1][0]} y2={H.fold[1][1]} stroke={R[0]} strokeOpacity="0.55" strokeWidth={r * 0.035} strokeLinecap="round" />}
        {eyes && [-1, 1].map((sd) => { const e = eye(sd); return <circle key={sd} cx={e[0]} cy={e[1]} r={r * 0.066} fill={R[0]} />; })}
      </g>
    );
  }

  // ── PostValue: the red post (crisis content) in value, for the red ramp's posterized grade ──
  // Always the same 32 × 42 card with rounded corners; kind sets what is on it. In the dark (outline) only the card's edge shows.
  // flip < 0 shows the card's plain back (a card turning over never shows its face mirrored).
  // Values: card 0.56 (the film's red once graded), details 0.78–0.95 (the hot and pale reds), cut-outs 0.3 (dark red).
  const POST_KINDS = ['text', 'image', 'headline', 'avatar', 'video', 'chart', 'alert', 'feed', 'reactions'];
  function PostFace({ kind }) {
    const r = (x, y, w, h, val, rx = 1.5) => <rect x={x} y={y} width={w} height={h} rx={rx} fill={v(val)} />;
    switch (kind) {
      case 'image':      // a photo with a caption
        return <g>{r(-12, -16, 24, 19, 0.82, 2)}<circle cx="5" cy="-10" r="3" fill={v(0.96)} /><path d="M -12 3 L -4 -6 L 1 -1 L 5 -4 L 12 3 Z" fill={v(0.4)} />{r(-12, 7, 18, 3, 0.84)}{r(-12, 12, 12, 3, 0.74)}</g>;
      case 'headline':   // a heavy headline bar over two lines of text
        return <g>{r(-12, -16, 24, 9, 0.92, 2)}{r(-12, -3, 24, 3, 0.8)}{r(-12, 3, 20, 3, 0.8)}{r(-12, 9, 14, 3, 0.74)}</g>;
      case 'avatar':     // a poster's round avatar and name, then text
        return <g><circle cx="-7" cy="-12" r="5" fill={v(0.92)} />{r(0, -14, 12, 3, 0.86)}{r(0, -9, 8, 2.5, 0.72)}{r(-12, -1, 24, 3, 0.8)}{r(-12, 5, 24, 3, 0.8)}{r(-12, 11, 16, 3, 0.74)}</g>;
      case 'video':      // a clip with a play button and a progress bar
        return <g>{r(-12, -15, 24, 20, 0.34, 2)}<path d="M -3 -10 L 5 -5 L -3 0 Z" fill={v(0.95)} />{r(-12, 9, 24, 2.5, 0.4)}{r(-12, 9, 15, 2.5, 0.92)}<circle cx="3" cy="10.25" r="2.6" fill={v(0.95)} /></g>;
      case 'chart':      // a line that drops: numbers going the wrong way
        return <g>{r(-12, -16, 24, 22, 0.42, 2)}<path d="M -9 -11 L -4 -7 L 0 -9 L 4 -1 L 9 2" fill="none" stroke={v(0.95)} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />{r(-12, 10, 18, 3, 0.8)}</g>;
      case 'alert':      // a warning badge over a line of text
        return <g><circle cx="0" cy="-6" r="9" fill={v(0.92)} />{r(-1.5, -12, 3, 8, 0.3, 1.5)}<circle cx="0" cy="-1" r="1.6" fill={v(0.3)} />{r(-12, 8, 24, 3, 0.8)}{r(-8, 14, 16, 3, 0.74)}</g>;
      case 'feed':       // a scroll of three short posts
        return <g>{[-14, -3, 8].map((y, i) => <g key={i}><circle cx="-9" cy={y + 2} r="3" fill={v(0.9)} />{r(-4, y, 16, 2.5, 0.84)}{r(-4, y + 4, 11, 2.5, 0.72)}</g>)}</g>;
      case 'reactions':  // text with a row of reactions under it
        return <g>{r(-12, -16, 24, 3.5, 0.86)}{r(-12, -9, 20, 3, 0.78)}{r(-12, -3, 22, 3, 0.78)}{r(-12, 3, 12, 3, 0.72)}{[-8, -1, 6].map((x, i) => <circle key={i} cx={x} cy="13" r="2.8" fill={v(0.94)} />)}</g>;
      default:           // 'text': the original post, a header and a line
        return <g>{r(-10, -13, 20, 4, 0.84, 2)}{r(-10, -5, 14, 4, 0.74, 2)}</g>;
    }
  }
  function PostValue({ x, y, rot = 0, s = 1, flip = 1, op = 1, outline = false, kind = 'text' }) {
    const f = Math.abs(flip) < 0.04 ? 0.04 : flip;
    return (
      <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * f} ${s})`} opacity={op}>
        <rect x="-16" y="-21" width="32" height="42" rx="5" fill={outline ? 'none' : v(f > 0 ? 0.56 : 0.46)} stroke={v(0.8)} strokeWidth={outline ? 2.5 : 0} />
        {!outline && f > 0.25 && <PostFace kind={kind} />}
      </g>
    );
  }

  // ── a look filter as markup, for regrading a finished shot from outside (tools/render.mjs --look) ──
  // mode: 'map' (whole frame on one ramp, smooth), 'poster' (whole frame on one ramp, banded), 'lift' (keep the hues,
  // lift black to the ramp's dark and pull white toward its cream, so mixed-group shots keep their colours).
  function lookFilterMarkup(ramp, mode = 'map') {
    const R = rampOf(ramp);
    const fn = (type) => ['R', 'G', 'B'].map((c, i) => `<feFunc${c} type="${type}" tableValues="${chan(R, i)}"/>`).join('');
    let body;
    if (mode === 'lift') {
      const d = hexRgb(R[0]).map((x) => x / 255), top = hexRgb(R[6]).map((x) => x / 255);
      body = `<feColorMatrix type="saturate" values="0.8"/><feComponentTransfer>${['R', 'G', 'B'].map((c, i) => `<feFunc${c} type="table" tableValues="${d[i].toFixed(4)} ${top[i].toFixed(4)}"/>`).join('')}</feComponentTransfer>`;
    } else {
      body = `<feColorMatrix type="matrix" values="${lum(mode === 'poster' ? 1.5 : 1.7, 0.02)}"/><feComponentTransfer>${fn(mode === 'poster' ? 'discrete' : 'table')}</feComponentTransfer>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute"><filter id="fu-look" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">${body}</filter></svg>`;
  }

  window.FU_LOOK = { RAMPS, DEFAULT_LIGHTS, mix, mixRamp, v, GradeFilter, ToneFilter, GlowFilter, LookDefs, ToneBean, BeanBust, PostValue, POST_KINDS, lookFilterMarkup };
})();
