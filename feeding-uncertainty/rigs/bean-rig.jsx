// Feeding Uncertainty — "04 Bean" side-view rig, chosen from the Stickman Rig Sheet.
// Egg-shaped body on thin legs and arms, round head, dot eye. Spec and usage: rigs/BEAN.md.
// Load it after animations-v3.jsx; it exports window.FU_BEAN and touches no other globals.
(() => {
  const BG = '#0e0e0e', PHONE = '#f3f1ea';
  const PAL = {
    wd: { body: '#46647a', head: '#5b7d95', lite: '#a9c3d6' },
    open: { body: '#5fa69a', head: '#3a8584', lite: '#a8e3d6' },
    cur: { body: '#e0a165', head: '#c47449', lite: '#f2c98a' },
  };

  // ── maths + colour ────────────────────────────────────────────────────────
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const rgbHex = (c) => '#' + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A.map((v, i) => v + (B[i] - v) * clamp(t, 0, 1))); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const rad = (d) => (d * Math.PI) / 180;
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mul = (a, s) => [a[0] * s, a[1] * s];
  const nrm = (a) => mul(a, 1 / (Math.hypot(a[0], a[1]) || 1));
  const dirv = (deg, l) => [l * Math.sin(rad(deg)), l * Math.cos(rad(deg))]; // angle from straight down, + is forward
  const fx = (v) => v.toFixed(1);
  const pathOf = (P, close) => P.map((p, i) => (i ? 'L' : 'M') + fx(p[0]) + ' ' + fx(p[1])).join(' ') + (close ? ' Z' : '');

  // ── motion: the film's three helpers + osc ────────────────────────────────
  const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
  const tw = (T, a, b, f, t, e) => (T <= a ? f : T >= b ? t : f + (t - f) * e((T - a) / (b - a)));
  const glide = (T, a, b, f, t) => tw(T, a, b, f, t, easeInOutSine);
  const hit = (T, a, b, f, t) => tw(T, a, b, f, t, easeOutExpo);
  const osc = (T, p, ph = 0) => Math.sin((T / p + ph) * Math.PI * 2);

  // ── boil (8 fps, deterministic) ───────────────────────────────────────────
  const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  function boilFn(f, id, amp) {
    if (!amp) return () => 0;
    const p1 = hash(f * 7.3 + id * 1.9) * 6.283, p2 = hash(f * 3.1 + id * 5.7) * 6.283, p3 = hash(f * 9.7 + id * 2.3) * 6.283;
    const a = amp * (0.7 + 0.6 * hash(f * 1.3 + id * 8.1));
    return (t) => a * (Math.sin(2 * t + p1) + 0.6 * Math.sin(3 * t + p2) + 0.35 * Math.sin(5 * t + p3));
  }
  function polarPath(cx, cy, rAt, N = 64) {
    let d = '';
    for (let k = 0; k < N; k++) {
      const t = -Math.PI + (k / N) * 2 * Math.PI, rr = Math.max(0, rAt(t));
      d += (k ? ' L ' : 'M ') + fx(cx + rr * Math.cos(t)) + ' ' + fx(cy + rr * Math.sin(t));
    }
    return d + ' Z';
  }

  // ── poses: joint angles as a pure function of T ───────────────────────────
  // legs [thigh angle, knee bend], arms [shoulder angle, elbow bend], degrees, + is forward.
  // lean tips the torso about the hip, tilt tips the head on top of that (+ looks down).
  const POSES = {
    idle(T) {
      const b = osc(T, 3.2), s = osc(T, 5.1, 0.3);
      return { hx: 2 * s, lean: 2 + 1.2 * b, tilt: 2 * osc(T, 4.3, 0.2),
        legN: [3 + 1.5 * s, 4], legF: [-3 + 1.5 * s, 3], armN: [4 + 2 * b, 8], armF: [-2 + 2 * b, 6], phone: 0 };
    },
    walk(T) { // in place; the ground should travel at about 150 px/s
      const p = (T / 1.05) * 2 * Math.PI;
      const leg = (ph) => [26 * Math.sin(ph), 6 + 38 * Math.pow(Math.max(0, Math.cos(ph)), 1.6)];
      return { hx: 0, lean: 5, tilt: -2 + 1.5 * osc(T, 0.525), legN: leg(p), legF: leg(p + Math.PI),
        armN: [-22 * Math.sin(p), 18 + 12 * Math.max(0, -Math.sin(p))], armF: [22 * Math.sin(p), 18 + 12 * Math.max(0, Math.sin(p))], phone: 0 };
    },
    phone(T) {
      const b = osc(T, 3.4), c = T % 6;
      const up = glide(c, 3.5, 3.9, 0, 1) * (1 - glide(c, 4.7, 5.2, 0, 1));
      const ft = T % 1.3, flick = ft < 0.25 ? Math.sin((ft / 0.25) * Math.PI) : 0;
      return { hx: 0, lean: 5 + 1.2 * b - 3 * up, tilt: 18 - 20 * up,
        legN: [4, 5], legF: [-4, 4], armN: [20 + b - 5 * up, 102 + 5 * flick * (1 - up)], armF: [16 + b - 5 * up, 108], phone: 1 };
    },
    talk(T) {
      const g = osc(T, 1.6), q = osc(T, 0.8, 0.15);
      return { hx: 0, lean: 3 + 2 * g, tilt: -3 + 4 * q, legN: [4, 5], legF: [-4, 4], armN: [32 + 16 * g, 62 + 22 * q], armF: [6 + 3 * g, 14], phone: 0 };
    },
    flinch(T) {
      const t = T % 3.4;
      const k = hit(t, 0.6, 1.0, 0, 1) * (1 - glide(t, 1.9, 3.0, 0, 1));
      const rattle = t < 0.6 ? 0 : Math.exp(-(t - 0.6) * 12) * Math.sin((t - 0.6) * 70) * 4;
      return { hx: -12 * k, lean: 4 - 16 * k + rattle, tilt: -2 - 8 * k,
        legN: [lerp(4, 16, k), lerp(5, 12, k)], legF: [lerp(-4, -20, k), lerp(4, 8, k)],
        armN: [lerp(6, 62, k), lerp(12, 96, k)], armF: [lerp(-3, 48, k), lerp(10, 104, k)], phone: 0 };
    },
  };
  // blend two poses field by field (for transitions between motions)
  const blendPose = (A, B, t) => {
    const o = {};
    for (const k in A) o[k] = Array.isArray(A[k]) ? [lerp(A[k][0], B[k][0], t), lerp(A[k][1], B[k][1], t)] : lerp(A[k], B[k], t);
    return o;
  };

  // ── skeleton: origin = floor under the hips, facing +x ────────────────────
  const LEN = { thigh: 46, shin: 46, torso: 84, upper: 44, fore: 42, head: 26, gap: 6 };
  function rig(p, headScale = 1) {
    const leg = ([th, kb]) => { const knee = dirv(th, LEN.thigh); return { knee, ankle: add(knee, dirv(th - kb, LEN.shin)) }; };
    const n = leg(p.legN), f = leg(p.legF);
    const H = [p.hx || 0, -6 - Math.max(n.ankle[1], f.ankle[1])]; // the lowest foot stays on the floor
    const L = rad(p.lean), u = [Math.sin(L), -Math.cos(L)], fw = [Math.cos(L), Math.sin(L)];
    const S = add(H, mul(u, LEN.torso));
    const TH = rad(p.lean + p.tilt), uh = [Math.sin(TH), -Math.cos(TH)], fh = [Math.cos(TH), Math.sin(TH)];
    const r = LEN.head * headScale, Hc = add(add(S, mul(uh, LEN.gap + r)), mul(fh, 6));
    const A = add(S, mul(u, -6));
    const arm = ([sh, el]) => { const elbow = add(A, dirv(sh + p.lean, LEN.upper)); return [A, elbow, add(elbow, dirv(sh + p.lean + el, LEN.fore))]; };
    return { H, S, u, fw, uh, fh, Hc, r, phone: p.phone || 0,
      legN: [H, add(H, n.knee), add(H, n.ankle)], legF: [H, add(H, f.knee), add(H, f.ankle)], armN: arm(p.armN), armF: arm(p.armF) };
  }
  // torso frame: x forward, y up from the hip
  const loc = (R, x, y) => add(R.H, add(mul(R.fw, x), mul(R.u, y)));
  // the bean: an egg, wider at the hips, belly pushed forward
  const egg = (cy, ry, wb, wt, shift, N = 40) => Array.from({ length: N }, (_, i) => {
    const t = (i / N) * 2 * Math.PI, s = Math.sin(t);
    return [Math.cos(t) * lerp(wb, wt, (s + 1) / 2) + shift * (1 - Math.abs(s)), cy + ry * s];
  });
  const BODY = egg(40, 54, 28, 18, 4);

  // ── BeanFig ───────────────────────────────────────────────────────────────
  // x, y: floor point under the hips (world). dir -1 faces left. s: scale.
  // pose: an object from POSES (or blendPose). c: a PAL entry or { body, head, lite }.
  // T: seconds, for the 8 fps boil. id: unique per figure on screen (boil seed + clip id).
  function BeanFig({ x, y, dir = 1, s = 1, pose, c = PAL.open, T = 0, boil = true, boilAmp = 0.5, eye = true, weight = 1, headScale = 1, op = 1, id = 1 }) {
    const R = rig(pose, headScale);
    const bf = Math.floor(T * 8), amp = boil ? boilAmp : 0;
    const B = (p, k) => (amp ? [p[0] + (hash(bf * 3.1 + k * 1.7 + id * 13.3) - 0.5) * 1.6 * amp, p[1] + (hash(bf * 7.7 + k * 1.3 + id * 5.1) - 0.5) * 1.6 * amp] : p);
    const legC = mix(c.head, BG, 0.2), legFar = mix(legC, BG, 0.35), far = mix(c.body, BG, 0.42), near = mix(c.body, '#ffffff', 0.1);
    const st = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
    const limb = (P, w, col, k) => <path d={pathOf(P.map((p, i) => B(p, k * 10 + i)))} stroke={col} strokeWidth={w * weight} {...st} />;
    const shoe = (ankle, col, k) => { const q = B(add(ankle, [7, 1]), k); return <ellipse cx={q[0]} cy={q[1]} rx="11" ry="5" fill={col} />; };
    const hb = boilFn(bf, id * 31 + 7, amp * 0.8);
    const headD = polarPath(R.Hc[0], R.Hc[1], (t) => R.r + hb(t));
    const eyeP = add(add(R.Hc, mul(R.fh, R.r * 0.52)), mul(R.uh, R.r * 0.12));
    let lit = null;
    if (R.phone > 0.01) { // screen light: a beam to the face and a crescent whose points meet the head outline
      const h = R.armN[2], n = nrm(sub(R.Hc, h)), pp = [-n[1], n[0]], deg = (Math.atan2(n[1], n[0]) * 180) / Math.PI;
      const fa = add(R.Hc, add(mul(n, -0.8 * R.r), mul(pp, 0.6 * R.r))), fb = add(R.Hc, add(mul(n, -0.8 * R.r), mul(pp, -0.6 * R.r)));
      const lc = add(R.Hc, mul(n, -R.r * 1.2));
      lit = {
        face: <circle cx={lc[0]} cy={lc[1]} r={R.r} fill={c.lite} opacity={0.4 * R.phone} clipPath={`url(#beanHead${id})`} />,
        phone: (
          <g>
            <path d={pathOf([add(h, mul(pp, 12)), fa, fb, add(h, mul(pp, -12))], true)} fill={c.lite} opacity={0.13 * R.phone} />
            <g transform={`translate(${fx(h[0])} ${fx(h[1])}) rotate(${fx(deg)})`} opacity={R.phone}><rect x="-3" y="-12" width="6" height="24" rx="2" fill={PHONE} /></g>
          </g>
        ),
      };
    }
    return (
      <g transform={`translate(${x} ${y}) scale(${dir * s} ${s})`} opacity={op}>
        <clipPath id={`beanHead${id}`}><path d={headD} /></clipPath>
        {limb(R.legF, 9, legFar, 1)}
        {shoe(R.legF[2], legFar, 11)}
        {limb(R.armF, 8, far, 2)}
        {limb(R.legN, 9, legC, 3)}
        {shoe(R.legN[2], legC, 12)}
        <path d={pathOf(BODY.map((p, i) => B(loc(R, p[0], p[1]), 200 + i)), true)} fill={c.body} />
        <path d={headD} fill={c.head} />
        {lit && lit.face}
        {eye && <circle cx={eyeP[0]} cy={eyeP[1]} r={3.8 * Math.max(0.85, R.r / 26)} fill={BG} />}
        {lit && lit.phone}
        {limb(R.armN, 8, near, 5)}
      </g>
    );
  }

  window.FU_BEAN = { BeanFig, POSES, blendPose, rig, LEN, PAL };
})();
