// Feeding Uncertainty — the portrait look as reusable pieces (exploration, see LOOK.md).
// The film's testimony portraits live inside one tonal ramp per group: 7 tones from a tinted dark to a pale cream, no black.
// The subject is posterized into flat bands, ringed by concentric contour lines, against a soft, blurred background.
// This kit lets the animations share that look. Scenes are authored in VALUE (greys) and coloured by the grade, the way the
// portraits are photo luminance mapped onto a ramp.
// Load it after animations-v3.jsx and rigs/bean-rig.jsx; it exports window.FU_LOOK and touches no other globals.
//
//   <LookDefs ramps={['open', 'cur']} bf={bf} amp={amp} />   filters + shading gradients, once per <svg>
//   <g filter="url(#fuGradeBg-open)">…</g>                     smooth gradient map + depth-of-field blur (backgrounds)
//   <g filter="url(#fuGradeFg-open)">…</g>                     posterized gradient map (sets, light pools)
//   <ToneBean ramp="open" rings x y s pose bf amp />          a posterized Bean, optionally with contour rings
//   <RingGroup ramp="open" items={[…]} bf amp />              one set of rings round several figures (a family as one portrait)
//   <BeanBust ramp="open" rings x y s turn detail hair />     a close-up head-and-shoulders Bean, framed like the portraits
(() => {
  // ── ramps measured from the reference stills (k-means, 7 clusters), tidied to rise evenly in brightness ──
  const RAMPS = {
    cur: ['#472a1d', '#613627', '#7e4634', '#965e43', '#b47f57', '#caa377', '#e2ceae'],
    open: ['#1b3836', '#2f5a51', '#457260', '#558d79', '#77a27f', '#8fb698', '#b6ccb1'],
    wd: ['#131d27', '#1b2937', '#24364a', '#2f455e', '#4a687c', '#6f8f98', '#a3bdb6'],
    red: ['#2b0f0a', '#4d170d', '#73200f', '#a32e11', '#cc4a2a', '#ee7a55', '#f6c9ad'],
  };
  const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const rgbHex = (c) => '#' + c.map((x) => Math.round(clamp(x, 0, 255)).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A.map((x, i) => x + (B[i] - x) * clamp(t, 0, 1))); };
  const mixRamp = (A, B, t) => rampOf(A).map((c, i) => mix(c, rampOf(B)[i], t));
  const rampOf = (r) => (Array.isArray(r) ? r : RAMPS[r]);
  const v = (x) => { const g = Math.round(clamp(x, 0, 1) * 255).toString(16).padStart(2, '0'); return '#' + g + g + g; };   // a value as a grey
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const chan = (ramp, i) => ramp.map((c) => (hexRgb(c)[i] / 255).toFixed(4)).join(' ');
  const lum = (g = 1, b = 0) => { const r = (k) => (k * g).toFixed(4); const row = `${r(0.2126)} ${r(0.7152)} ${r(0.0722)} 0 ${b}`; return `${row}  ${row}  ${row}  0 0 0 1 0`; };
  const mapFuncs = (ramp, type) => [0, 1, 2].map((i) => React.createElement(['feFuncR', 'feFuncG', 'feFuncB'][i], { key: i, type, tableValues: chan(ramp, i) }));

  // smooth noise textures, baked once (feTurbulence is far too slow on the CPU at 4K): R and G hold a displacement around 128.
  // cells sets the grain: a random cells × cells grid, smoothed up to 256 px. Four boil textures cycle at 8 fps.
  function bakeNoise(seed, cells) {
    let st = seed >>> 0; const rnd = () => (st = (st * 1664525 + 1013904223) >>> 0) / 4294967296;
    const s = document.createElement('canvas'); s.width = s.height = cells;
    const g = s.getContext('2d'), im = g.createImageData(cells, cells);
    for (let i = 0; i < im.data.length; i += 4) { im.data[i] = rnd() * 255; im.data[i + 1] = rnd() * 255; im.data[i + 2] = 128; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0);
    const b = document.createElement('canvas'); b.width = b.height = 256;
    const bg = b.getContext('2d'); bg.imageSmoothingEnabled = true; bg.imageSmoothingQuality = 'high'; bg.filter = `blur(${(256 / cells) * 0.35}px)`;
    bg.drawImage(s, -1, -1, 258, 258);
    return b.toDataURL('image/png');
  }
  const NOISE = { warp16: bakeNoise(7, 16), warp10: bakeNoise(11, 10), boil: [21, 33, 45, 57].map((k) => bakeNoise(k, 24)) };
  const noiseImg = (href, region, result) => <feImage href={href} x={region[0]} y={region[1]} width={region[2]} height={region[3]} preserveAspectRatio="none" result={result} />;

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

  // ── tone: a figure posterized into its group's ramp, with organic (blobby) band edges like the portraits ──
  // The organic warp is fixed to the figure (it moves with it); the boil swaps a smaller warp at 8 fps.
  function ToneFilter({ id, ramp, organic = 14, freq = 0.03, soft = 1.6, gain = 1, lift = 0, bf = 0, amp = 0.5, region = [-260, -460, 520, 620] }) {
    return (
      <filter id={id} filterUnits="userSpaceOnUse" x={region[0]} y={region[1]} width={region[2]} height={region[3]} colorInterpolationFilters="sRGB">
        {noiseImg(freq > 0.01 ? NOISE.warp16 : NOISE.warp10, region, 'n0')}
        <feDisplacementMap in="SourceGraphic" in2="n0" scale={organic} xChannelSelector="R" yChannelSelector="G" result="d0" />
        {noiseImg(NOISE.boil[bf % 4], region, 'n1')}
        <feDisplacementMap in="d0" in2="n1" scale={amp * 2.4} xChannelSelector="R" yChannelSelector="G" result="d1" />
        <feGaussianBlur in="d1" stdDeviation={soft} result="b" />
        <feColorMatrix in="b" type="matrix" values={lum(gain, lift)} result="l" />
        <feComponentTransfer in="l">
          {mapFuncs(rampOf(ramp), 'discrete')}
          <feFuncA type="linear" slope="9" intercept="-3.9" />
        </feComponentTransfer>
        <feGaussianBlur stdDeviation="0.5" />
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

  // ── contour rings, as vectors ─────────────────────────────────────────────────
  // A shape painted with a round-joined stroke of width 2d around its fill is exactly the shape offset by d. So each ring zone
  // is the figure's parts (plus a few hidden fillets that round off the neck and crotch) redrawn fatter, painted from the
  // outermost zone in. zones run from the figure outward: gap, line, gap, line, gap, line, gap, thick band (as in the portraits).
  // A part: { d: path, w: stroke width of the part itself (0 for a filled shape), tf: transform, s: that transform's scale }.
  const RING_ZONES = [7, 6, 7, 6, 7, 6, 7, 15];
  function RingStack({ parts, zones = RING_ZONES, k = 1, line, gap, shade, shadeOp = 0.5, bf = 0, amp = 0.5, id = 1, children }) {
    const D = []; let acc = 0;
    zones.forEach((z) => { acc += z * k; D.push(acc); });
    const n = D.length, layers = [];
    for (let i = n - 1; i >= 0; i--) {
      if (D[i] < 0.05) continue;
      // 8 fps boil: each ring breathes a fraction of a pixel, like the line boil elsewhere
      const d = D[i] + (amp ? (hash(bf * 3.7 + i * 1.9 + id * 7.1) - 0.5) * 1.2 * amp : 0);
      const col = i % 2 === 1 ? line : gap;
      layers.push(
        <g key={i} fill={col} stroke={col} strokeLinejoin="round" strokeLinecap="round">
          {parts.map((p, j) => <path key={j} d={p.d} transform={p.tf} strokeWidth={(p.w || 0) + (2 * d) / (p.s || 1)} fill={p.w ? 'none' : col} />)}
        </g>
      );
    }
    const sd = (D[1] || D[0]) * 0.6;
    return (
      <g>
        {layers}
        {shade && (
          <g filter="url(#fuRingShade)" opacity={shadeOp}>
            <g fill={shade} stroke={shade} strokeLinejoin="round" strokeLinecap="round">
              {parts.map((p, j) => <path key={j} d={p.d} transform={p.tf} strokeWidth={(p.w || 0) + (2 * sd) / (p.s || 1)} fill={p.w ? 'none' : shade} />)}
            </g>
          </g>
        )}
        {children}
      </g>
    );
  }
  const ringCols = (ramp, red) => { const R = rampOf(ramp); return { line: red ? mix(R[6], red, 0.75) : R[6], gap: R[1], shade: R[0] }; };

  // shading gradients shared by every ToneBean / BeanBust (bounding-box units, light from the front and above)
  function ShadeDefs() {
    const rg = (id, cx, cy, r, stops) => (
      <radialGradient id={id} cx={cx} cy={cy} r={r} fx={cx} fy={cy}>
        {stops.map(([o, x, a], i) => <stop key={i} offset={o} stopColor={v(x)} stopOpacity={a == null ? 1 : a} />)}
      </radialGradient>
    );
    return (
      <React.Fragment>
        {rg('fuShBody', 0.72, 0.2, 1.05, [[0, 0.8], [0.45, 0.66], [0.8, 0.5], [1, 0.4]])}
        {rg('fuShHead', 0.7, 0.28, 1.0, [[0, 0.86], [0.5, 0.72], [0.85, 0.56], [1, 0.46]])}
        {rg('fuShBodyF', 0.42, 0.12, 1.1, [[0, 0.8], [0.45, 0.66], [0.8, 0.5], [1, 0.4]])}
        {rg('fuShHeadF', 0.36, 0.24, 1.0, [[0, 0.86], [0.5, 0.72], [0.85, 0.56], [1, 0.46]])}
        {rg('fuShBust', 0.62, 0.1, 0.95, [[0, 0.84], [0.4, 0.68], [0.75, 0.5], [1, 0.36]])}
        {rg('fuShBustHead', 0.62, 0.3, 0.95, [[0, 0.92], [0.45, 0.78], [0.78, 0.6], [1, 0.46]])}
        {rg('fuShHair', 0.4, 0.25, 0.8, [[0, 0.44], [0.6, 0.27], [1, 0.16]])}
        {rg('fuPool', 0.5, 0.5, 0.5, [[0, 0.98], [0.3, 0.78], [0.62, 0.52, 0.9], [1, 0.3, 0]])}
      </React.Fragment>
    );
  }

  // everything a scene needs for the given ramps, plus the red ramp for crisis content
  function LookDefs({ ramps = ['open'], bf = 0, amp = 0.5, dof = 20 }) {
    const all = Array.from(new Set([...ramps, 'red']));
    return (
      <defs>
        <ShadeDefs />
        {all.map((r) => (
          <React.Fragment key={r}>
            <GradeFilter id={'fuGradeBg-' + r} ramp={r} blur={dof} />
            <GradeFilter id={'fuGradeFg-' + r} ramp={r} poster />
            <ToneFilter id={'fuTone-' + r} ramp={r} bf={bf} amp={amp} />
            <ToneFilter id={'fuBustTone-' + r} ramp={r} organic={34} freq={0.006} soft={5} bf={bf} amp={amp * 4} region={[-800, -1200, 1600, 1400]} />
          </React.Fragment>
        ))}
        <filter id="fuRingShade" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" /></filter>
        <GlowFilter id="fuGlow" />
      </defs>
    );
  }

  // ── the Bean in value ────────────────────────────────────────────────────────
  const egg = (cy, ry, wb, wt, shift, N = 40) => Array.from({ length: N }, (_, i) => {
    const t = (i / N) * 2 * Math.PI, s = Math.sin(t);
    return [Math.cos(t) * (wb + (wt - wb) * (s + 1) / 2) + shift * (1 - Math.abs(s)), cy + ry * s];
  });
  const BODY = egg(40, 54, 28, 18, 4), FBODY = egg(40, 54, 28, 18, 0);
  const fx = (n) => n.toFixed(1);
  const pathOf = (P, close) => P.map((p, i) => (i ? 'L' : 'M') + fx(p[0]) + ' ' + fx(p[1])).join(' ') + (close ? ' Z' : '');
  const circ = (c, r) => `M ${fx(c[0] - r)} ${fx(c[1])} a ${fx(r)} ${fx(r)} 0 1 0 ${fx(2 * r)} 0 a ${fx(r)} ${fx(r)} 0 1 0 ${fx(-2 * r)} 0 Z`;
  const addv = (a, b) => [a[0] + b[0], a[1] + b[1]], mulv = (a, s) => [a[0] * s, a[1] * s];
  const st = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };

  // the figure's geometry for either view, in the rig's own frame (origin on the floor under the hips, facing +x)
  function beanGeom(pose, view = 'side', headScale = 1) {
    const B = window.FU_BEAN;
    if (view === 'front') {
      const R = B.frontRig({ ...pose, armL: pose.armL || [8, 6], armR: pose.armR || [8, 6] }, headScale);   // null hides an arm
      return {
        view, R, head: [R.Hc, R.r], eyes: R.eyes, body: FBODY.map((p) => R.loc(p[0], p[1])), neck: R.N,
        limbs: [[R.legL, 9, 0.3], [R.legR, 9, 0.36], ...(pose.armL === null ? [] : [[R.armL, 8, 0.62]]), ...(pose.armR === null ? [] : [[R.armR, 8, 0.66]])],
        shoes: [[addv(R.legL[2], [-4, 1]), 0.26], [addv(R.legR[2], [4, 1]), 0.3]], shoeR: 9,
      };
    }
    const R = B.rig(pose, headScale);
    const loc = (x, y) => addv(R.H, addv(mulv(R.fw, x), mulv(R.u, y)));
    return {
      view, R, head: [R.Hc, R.r], eyes: [addv(addv(R.Hc, mulv(R.fh, R.r * 0.52)), mulv(R.uh, R.r * 0.12))], body: BODY.map((p) => loc(p[0], p[1])), neck: R.S,
      limbsBack: [[R.legF, 9, 0.2], [R.armF, 8, 0.26], [R.legN, 9, 0.36]], limbs: [[R.armN, 8, 0.6]],
      shoes: [[addv(R.legF[2], [7, 1]), 0.18], [addv(R.legN[2], [7, 1]), 0.32]], shoeR: 11,
    };
  }
  function BeanValue({ pose, view = 'side', headScale = 1, phone = 0, eyes = true }) {
    const G = beanGeom(pose, view, headScale), [Hc, r] = G.head;
    const limb = ([P, w, x], i) => <path key={i} d={pathOf(P)} stroke={v(x)} strokeWidth={w} {...st} />;
    const shoe = ([p, x], i) => <ellipse key={'s' + i} cx={p[0]} cy={p[1]} rx={G.shoeR} ry="5" fill={v(x)} />;
    const h = G.R.armN ? G.R.armN[2] : null;
    return (
      <g>
        {(G.limbsBack || []).map(limb)}
        {G.view === 'front' && G.limbs.slice(0, 2).map(limb)}
        {G.shoes.map(shoe)}
        <path d={pathOf(G.body, true)} fill={G.view === 'front' ? 'url(#fuShBodyF)' : 'url(#fuShBody)'} />
        <clipPath id={'fuBodyClip' + G.view}><path d={pathOf(G.body, true)} /></clipPath>
        <g clipPath={`url(#fuBodyClip${G.view})`}>
          <ellipse cx={G.body[10][0]} cy={G.body[10][1] - 30} rx="16" ry="40" fill={v(0.42)} opacity="0.7" />
          <ellipse cx={G.body[32][0]} cy={G.body[32][1] + 10} rx="12" ry="30" fill={v(0.84)} opacity="0.5" />
        </g>
        <circle cx={Hc[0]} cy={Hc[1]} r={r} fill={G.view === 'front' ? 'url(#fuShHeadF)' : 'url(#fuShHead)'} />
        {phone > 0 && <circle cx={Hc[0] + r * 0.5} cy={Hc[1] + r * 0.25} r={r * 0.8} fill={v(1)} opacity={0.55 * phone} />}
        {eyes && G.eyes.map((e, i) => <circle key={'e' + i} cx={e[0]} cy={e[1]} r={3.8 * Math.max(0.85, r / 26)} fill={v(0.03)} />)}
        {(G.view === 'front' ? G.limbs.slice(2) : G.limbs).map(limb)}
        {phone > 0 && h && <rect x={h[0] - 3} y={h[1] - 12} width="6" height="24" rx="2" fill={v(1)} transform={`rotate(-30 ${h[0]} ${h[1]})`} />}
      </g>
    );
  }
  // the parts the rings follow: body, head, limbs, shoes, plus fillets at the neck and between the legs so the rings round off
  function beanParts(pose, view, headScale, tf, s) {
    const G = beanGeom(pose, view, headScale), [Hc, r] = G.head;
    const out = [];
    const P = (d, w = 0) => out.push({ d, w, tf, s });
    P(pathOf(G.body, true));
    P(circ(Hc, r));
    [...(G.limbsBack || []), ...G.limbs].forEach(([L, w]) => P(pathOf(L), w));
    G.shoes.forEach(([p]) => P(circ(p, G.shoeR * 0.7), 6));
    // neck fillet: from the shoulders to the head's sides
    const up = [Hc[0] - G.neck[0], Hc[1] - G.neck[1]], ul = Math.hypot(up[0], up[1]) || 1, side = [-up[1] / ul, up[0] / ul];
    P(pathOf([addv(G.neck, mulv(side, 20)), addv(Hc, mulv(side, r * 0.8)), addv(Hc, mulv(side, -r * 0.8)), addv(G.neck, mulv(side, -20))], true));
    // crotch fillet: the hips and both ankles
    const legs = G.view === 'front' ? [G.R.legL, G.R.legR] : [G.R.legF, G.R.legN];
    P(pathOf([legs[0][0], legs[0][2], legs[1][2], legs[1][0]], true));
    return out;
  }

  // x, y: floor point under the hips. ramp: a RAMPS key or an array of 7 colours. rings: draw the contour rings.
  // ringK scales the ring widths (design px at s = 1). red: a colour the ring lines lean toward.
  function ToneBean({ x, y, s = 1, dir = 1, pose, view = 'side', ramp = 'open', rings = false, ringK = 0.62, zones, red, headScale = 1, phone = 0, op = 1, toneId, eyes = true, bf = 0, amp = 0.5, id = 1 }) {
    const key = typeof ramp === 'string' ? ramp : 'custom';
    const tf = `scale(${dir} 1)`;
    const body = (
      <g filter={`url(#${toneId || 'fuTone-' + key})`}>
        <g transform={tf}><BeanValue pose={pose} view={view} headScale={headScale} phone={phone} eyes={eyes} /></g>
      </g>
    );
    return (
      <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op}>
        {rings ? <RingStack parts={beanParts(pose, view, headScale, tf, s)} zones={zones} k={ringK} {...ringCols(ramp, red)} bf={bf} amp={amp} id={id}>{body}</RingStack> : body}
      </g>
    );
  }
  // one set of rings round several figures. items: [{ x, y, s, dir, pose, view, headScale, ramp, phone }]
  function RingGroup({ items, ramp = 'open', ringK = 0.62, zones, red, bf = 0, amp = 0.5, id = 1, extra = [] }) {
    const parts = [...extra];
    items.forEach((it) => parts.push(...beanParts(it.pose, it.view || 'side', it.headScale || 1, `translate(${it.x} ${it.y}) scale(${(it.s || 1) * (it.dir || 1)} ${it.s || 1})`, it.s || 1)));
    return (
      <RingStack parts={parts} zones={zones} k={ringK} {...ringCols(ramp, red)} bf={bf} amp={amp} id={id}>
        {items.map((it, i) => <ToneBean key={i} {...it} ramp={it.ramp || ramp} rings={false} bf={bf} amp={amp} />)}
      </RingStack>
    );
  }

  // ── BeanBust: the Bean in close-up, head and shoulders, framed like the testimony portraits ──
  // Built from the Bean's own proportions, scaled ×9: the round head over the narrow top of the egg body, so it stays the same
  // character as the full-figure rig. Local frame: origin at the bottom centre of the frame edge; the head is about 470 across.
  // turn -1..1 turns the face toward screen right (+). detail 0 = shading only; 1 adds a soft shadow on the far side of the
  // head, which posterizes into a portrait-like blob. hair: 'none' | 'short' | 'long'.
  const BK = 9, HIP = 300;   // bust scale over the rig, and where the (off-frame) hip sits below the frame edge
  const bustGeom = ({ turn = 0.35, nod = 0 }) => {
    const sh = turn * 4;     // the belly shift follows the facing, as in the side rig
    const body = egg(40, 54, 28, 18, sh).map(([x, y]) => [x * BK, HIP - y * BK]);
    return { body, hx: (6 * turn) * BK, hy: HIP - (84 + 6 + 26) * BK + 10 * nod, r: 26 * BK, neck: [0, HIP - 84 * BK] };
  };
  function BustValue({ turn = 0.35, detail = 1, hair = 'none', tilt = 0, nod = 0, eyes = true, lit = 0 }) {
    const { body, hx, hy, r } = bustGeom({ turn, nod });
    const sg = Math.sign(turn || 1), eo = turn * 0.42 * r, ex = 0.32 * r;
    return (
      <g>
        {hair === 'long' && <path d={`M ${hx - r * 0.98} ${hy} C ${hx - r * 1.1} ${hy + r * 1.3}, ${-r * 1.1} -120, ${-r * 1.05} 0 L ${r * 1.05} 0 C ${r * 1.1} -120, ${hx + r * 1.1} ${hy + r * 1.3}, ${hx + r * 0.98} ${hy} Z`} fill="url(#fuShHair)" />}
        <path d={pathOf(body, true)} fill="url(#fuShBust)" />
        <g transform={`rotate(${tilt} ${hx} ${hy + r})`}>
          <circle cx={hx} cy={hy} r={r} fill="url(#fuShBustHead)" />
          {detail > 0 && (
            <g opacity={detail} clipPath="url(#fuBustHeadClip)">
              <ellipse cx={hx - sg * r * 0.95} cy={hy + r * 0.15} rx={r * 0.55} ry={r * 1.05} fill={v(0.36)} opacity="0.75" />
            </g>
          )}
          {hair === 'short' && <path d={`M ${hx - r - 6} ${hy - r * 0.05} A ${r + 6} ${r + 6} 0 0 1 ${hx + r + 6} ${hy - r * 0.05} C ${hx + r * 0.6} ${hy - r * 0.62}, ${hx - r * 0.6} ${hy - r * 0.62}, ${hx - r - 6} ${hy - r * 0.05} Z`} fill="url(#fuShHair)" />}
          {hair === 'long' && <path d={`M ${hx - r - 8} ${hy + r * 0.2} A ${r + 8} ${r + 8} 0 0 1 ${hx + r + 8} ${hy + r * 0.2} C ${hx + r * 0.55} ${hy - r * 0.72}, ${hx - r * 0.5} ${hy - r * 0.66}, ${hx - r - 8} ${hy + r * 0.2} Z`} fill="url(#fuShHair)" />}
          {eyes && <circle cx={hx + eo - ex} cy={hy - r * 0.04} r={r * 0.068} fill={v(0.04)} />}
          {eyes && <circle cx={hx + eo + ex} cy={hy - r * 0.04} r={r * 0.064} fill={v(0.04)} />}
          {lit > 0 && <circle cx={hx + r * 0.9} cy={hy + r * 0.4} r={r * 0.9} fill={v(1)} opacity={0.5 * lit} />}
        </g>
        <clipPath id="fuBustHeadClip"><circle cx={hx} cy={hy} r={r} /></clipPath>
      </g>
    );
  }
  function bustParts(p, s) {
    const { body, hx, hy, r, neck } = bustGeom(p);
    const tf = `rotate(${p.tilt || 0} ${hx} ${hy + r})`;
    const out = [{ d: pathOf(body, true), s }, { d: circ([hx, hy], r + (p.hair ? 6 : 0)), s, tf },
      { d: pathOf([[neck[0] - 150, neck[1] + 20], [hx - r * 0.8, hy + r * 0.55], [hx + r * 0.8, hy + r * 0.55], [neck[0] + 150, neck[1] + 20]], true), s }];
    if (p.hair === 'long') out.push({ d: pathOf([[hx - r, hy], [-r * 1.05, 0], [r * 1.05, 0], [hx + r, hy]], true), s });
    return out;
  }
  function BeanBust({ x, y, s = 1, ramp = 'open', rings = true, ringK = 1.15, zones, red, toneId, op = 1, bf = 0, amp = 0.5, id = 1, ...rest }) {
    const key = typeof ramp === 'string' ? ramp : 'custom';
    const body = <g filter={`url(#${toneId || 'fuBustTone-' + key})`}><BustValue {...rest} /></g>;
    return (
      <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op}>
        {rings ? <RingStack parts={bustParts(rest, s)} zones={zones} k={ringK} {...ringCols(ramp, red)} shadeOp={0.6} bf={bf} amp={amp * 2} id={id}>{body}</RingStack> : body}
      </g>
    );
  }

  // ── PostValue: the red post (crisis content) in value, for the red ramp's posterized grade ──
  function PostValue({ x, y, rot = 0, s = 1, flip = 1, op = 1, outline = false }) {
    const f = Math.abs(flip) < 0.04 ? 0.04 : flip;
    return (
      <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * f} ${s})`} opacity={op}>
        <rect x="-16" y="-21" width="32" height="42" rx="5" fill={outline ? 'none' : v(0.56)} stroke={v(0.8)} strokeWidth={outline ? 2.5 : 0} />
        {!outline && <rect x="-10" y="-13" width="20" height="4" rx="2" fill={v(0.84)} />}
        {!outline && <rect x="-10" y="-5" width="14" height="4" rx="2" fill={v(0.74)} />}
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

  window.FU_LOOK = { RAMPS, mix, mixRamp, v, GradeFilter, ToneFilter, GlowFilter, RingStack, ShadeDefs, LookDefs, ToneBean, RingGroup, BeanValue, beanParts, BeanBust, BustValue, bustParts, PostValue, lookFilterMarkup, RING_ZONES };
})();
