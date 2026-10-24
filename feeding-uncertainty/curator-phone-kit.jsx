// Feeding Uncertainty — the curator's phone in first person: phone, screen UI, feed, hands (window.FU_PHONE).
// Screen content is drawn in VALUE and graded by the look's filters, so it lands in the curator ramp; red only comes in
// through the crisis posts. No readable text anywhere: words are bars (no kinetic typography).
// Load after rigs/fu-look.jsx and open-engagers-concepts.jsx (it uses FU_RIG's motion helpers).
//
// Screen coordinates: 0..SW × 0..SH, origin at the screen's top left. A phone placement P = { x, y, s, rot } puts the
// screen's centre at world (x, y); toWorld(P, p) maps a screen point into the world (for thumbs, taps and flying posts).
(() => {
  const { MOTION, hash } = window.FU_RIG;
  const { RAMPS, v, PostValue, ToneFilter, GradeFilter } = window.FU_LOOK;
  const R = RAMPS.cur;
  const SW = 360, SH = 760, BZ = 16;
  const CS = 9, CARD_H = 42 * CS, GAP = 20, PITCH = CARD_H + GAP, FEED_TOP = 104;
  const KB_TOP = SH - 290;

  // keyed tracks: [[t, value, ease?], …]; holds before the first key and after the last. ease names a MOTION helper
  function track(T, keys) {
    if (T <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (T < keys[i][0]) return ease(keys[i][2])(T, keys[i - 1][0], keys[i][0], keys[i - 1][1], keys[i][1]);
    }
    return keys[keys.length - 1][1];
  }
  const ease = (e) => (e === 'lin' ? (T, a, b, f, t) => f + (t - f) * clamp((T - a) / (b - a), 0, 1) : MOTION[e || 'glide']);
  const track2 = (T, keys) => [0, 1].map((j) => track(T, keys.map((k) => [k[0], k[1][j], k[2]])));
  // a point path whose keys may be functions of T (a key that follows something moving, like the typing thumb)
  function path2(T, keys) {
    const val = (p) => (typeof p === 'function' ? p(T) : p);
    if (T <= keys[0][0]) return val(keys[0][1]);
    for (let i = 1; i < keys.length; i++) {
      if (T < keys[i][0]) {
        const u = ease(keys[i][2])(T, keys[i - 1][0], keys[i][0], 0, 1), a = val(keys[i - 1][1]), b = val(keys[i][1]);
        return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
      }
    }
    return val(keys[keys.length - 1][1]);
  }
  // 1 while a tap is down (each tap lasts d seconds)
  const pressAt = (T, taps, d = 0.1) => (taps.some((t) => T >= t && T < t + d) ? 1 : 0);
  const g01 = (T, a, b) => MOTION.glide(T, a, b, 0, 1);
  const pop = (T, a, d = 0.3) => MOTION.hit(T, a, a + d, 0, 1);

  const toWorld = (P, p) => {
    const a = ((P.rot || 0) * Math.PI) / 180, dx = (p[0] - SW / 2) * P.s, dy = (p[1] - SH / 2) * P.s;
    return [P.x + dx * Math.cos(a) - dy * Math.sin(a), P.y + dx * Math.sin(a) + dy * Math.cos(a)];
  };
  const phoneT = (P) => `translate(${P.x.toFixed(2)} ${P.y.toFixed(2)}) rotate(${(P.rot || 0).toFixed(3)}) scale(${P.s}) translate(${-SW / 2} ${-SH / 2})`;

  // ── defs: screen grades with a tight region (cheap at 4K), the hand tone and the screen's light on the hands ──
  function PhoneDefs({ id = 'ph', handRamp = 'cur', light = [960, 540], reach = 760, bf = 0, amp = 0.5, region = [-200, -200, 2320, 1480] }) {
    return (
      <defs>
        <GradeFilter id="phCur" ramp="cur" poster region={[-60, -60, SW + 120, SH + 120]} />
        <GradeFilter id="phRed" ramp="red" poster region={[-60, -60, SW + 120, SH + 120]} />
        <ToneFilter id={id + 'Tone'} ramp={handRamp} edge={22} depth={0.45} grain={0.08} coarse soft={3} bf={bf} amp={amp} region={region} />
        <radialGradient id={id + 'L'} gradientUnits="userSpaceOnUse" cx={light[0]} cy={light[1]} r={reach}>
          <stop offset="0" stopColor={v(0.95)} /><stop offset="0.4" stopColor={v(0.66)} /><stop offset="1" stopColor={v(0.2)} />
        </radialGradient>
      </defs>
    );
  }

  // ── the phone: a dark slab with a rim catching the screen light; children are the screen content ──
  function Phone({ P, id = 'a', children, op = 1 }) {
    return (
      <g transform={phoneT(P)} opacity={op}>
        <rect x={-BZ} y={-BZ} width={SW + 2 * BZ} height={SH + 2 * BZ} rx="60" fill={R[0]} />
        <rect x={-BZ + 3} y={-BZ + 3} width={SW + 2 * BZ - 6} height={SH + 2 * BZ - 6} rx="57" fill="none" stroke={R[2]} strokeWidth="2.5" />
        <clipPath id={'scr' + id}><rect width={SW} height={SH} rx="46" /></clipPath>
        <g clipPath={`url(#scr${id})`}>
          <rect width={SW} height={SH} fill={R[6]} />
          {children}
        </g>
        <rect x={SW / 2 - 44} y="12" width="88" height="24" rx="12" fill={R[0]} />
      </g>
    );
  }
  // screen content in three graded layers: the curator ramp, the red posts over it, then menus over both
  function Layers({ cur, red, over }) {
    return (
      <g>
        <g filter="url(#phCur)">{cur}</g>
        {red && <g filter="url(#phRed)">{red}</g>}
        {over && <g filter="url(#phCur)">{over}</g>}
      </g>
    );
  }

  // ── chrome ──
  const bar = (x, y, w, h, val, key) => <rect key={key} x={x} y={y} width={w} height={h} rx={h / 2} fill={v(val)} />;
  function StatusBar({ val = 0.3 }) {
    return <g>{bar(30, 18, 40, 10, val)}<rect x={SW - 64} y="17" width="30" height="13" rx="4" fill="none" stroke={v(val)} strokeWidth="2" />{bar(SW - 61, 20, 20, 7, val)}</g>;
  }
  function AppBar({ y = 44, val = 0.32 }) {
    return (
      <g>
        <rect y={y} width={SW} height="56" fill={v(0.95)} />
        {bar(24, y + 18, 92, 20, val)}
        {[0, 1].map((i) => <circle key={i} cx={SW - 34 - i * 40} cy={y + 28} r="11" fill="none" stroke={v(val)} strokeWidth="3" />)}
      </g>
    );
  }
  function HomeBar({ val = 0.3 }) { return bar(SW / 2 - 60, SH - 14, 120, 6, val); }

  // ── comfort faces: the warm counterpart of the red post's faces, same 32 × 42 card ──
  const COMFORT_KINDS = ['cat', 'sun', 'cup', 'friends', 'plant', 'bowl', 'heart'];
  function ComfortFace({ kind }) {
    const r = (x, y, w, h, val, rx = 1.5) => <rect x={x} y={y} width={w} height={h} rx={rx} fill={v(val)} />;
    const caption = <g>{r(-12, 7, 18, 3, 0.9)}{r(-12, 12, 11, 3, 0.8)}</g>;
    switch (kind) {
      case 'cat':
        return <g>{r(-12, -16, 24, 19, 0.86, 2)}<ellipse cx="0" cy="1.5" rx="7.5" ry="3.4" fill={v(0.42)} /><circle cx="0" cy="-5" r="5.6" fill={v(0.42)} /><path d="M -5.2 -7 L -4.3 -12.6 L -1.4 -9.6 Z M 5.2 -7 L 4.3 -12.6 L 1.4 -9.6 Z" fill={v(0.42)} /><circle cx="-2.1" cy="-5.4" r="0.95" fill={v(0.95)} /><circle cx="2.1" cy="-5.4" r="0.95" fill={v(0.95)} />{caption}</g>;
      case 'sun':
        return <g>{r(-12, -16, 24, 19, 0.88, 2)}<circle cx="4" cy="-8.5" r="4.4" fill={v(0.99)} /><path d="M -12 3 L -12 -4 Q -5 -9 1 -3 Q 6 -7 12 -2.5 L 12 3 Z" fill={v(0.5)} />{caption}</g>;
      case 'cup':
        return <g>{r(-12, -16, 24, 19, 0.74, 2)}<rect x="-6" y="-6.5" width="10" height="9.5" rx="2" fill={v(0.97)} /><circle cx="5" cy="-2" r="2.6" fill="none" stroke={v(0.97)} strokeWidth="1.5" /><path d="M -3 -9 q 1.5 -2 0 -4 M 1 -9 q 1.5 -2 0 -4" fill="none" stroke={v(0.97)} strokeWidth="1.1" strokeLinecap="round" />{caption}</g>;
      case 'friends':
        return <g>{r(-12, -16, 24, 19, 0.84, 2)}<ellipse cx="-4.5" cy="2" rx="4.6" ry="5.5" fill={v(0.42)} /><circle cx="-4.5" cy="-8" r="4" fill={v(0.42)} /><ellipse cx="4.5" cy="2.5" rx="4.6" ry="5.5" fill={v(0.58)} /><circle cx="4.8" cy="-7.2" r="4" fill={v(0.58)} />{r(-12, -16, 24, 0.1, 0.84)}{caption}</g>;
      case 'plant':
        return <g>{r(-12, -16, 24, 19, 0.88, 2)}<path d="M -4 -2 L 4 -2 L 3 3 L -3 3 Z" fill={v(0.62)} /><ellipse cx="-3" cy="-7" rx="2.2" ry="4.6" transform="rotate(-28 -3 -7)" fill={v(0.4)} /><ellipse cx="3" cy="-8" rx="2.2" ry="5" transform="rotate(24 3 -8)" fill={v(0.46)} /><ellipse cx="0" cy="-10" rx="1.8" ry="4.2" fill={v(0.4)} />{caption}</g>;
      case 'bowl':
        return <g>{r(-12, -16, 24, 19, 0.8, 2)}<path d="M -8 -5 A 8 7 0 0 0 8 -5 Z" fill={v(0.97)} /><path d="M -6 -6 q 2 -2 4 0 t 4 0 t 4 0" fill="none" stroke={v(0.55)} strokeWidth="1.2" /><path d="M -1 -9 q 1.4 -2 0 -4 M 3 -9 q 1.4 -2 0 -4" fill="none" stroke={v(0.97)} strokeWidth="1.1" strokeLinecap="round" />{caption}</g>;
      default:   // 'heart'
        return <g>{r(-12, -16, 24, 19, 0.6, 2)}<path d={HEART} transform="translate(0 -5) scale(0.62)" fill={v(0.97)} />{caption}</g>;
    }
  }
  const HEART = 'M 0 8 C -12 0 -12 -9 -6 -10.5 C -2.6 -11.4 0 -8.6 0 -6.5 C 0 -8.6 2.6 -11.4 6 -10.5 C 12 -9 12 0 0 8 Z';
  function WarmPost({ x = 0, y = 0, rot = 0, s = 1, sy = 1, flip = 1, op = 1, kind = 'cat' }) {
    const f = Math.abs(flip) < 0.04 ? 0.04 : flip;
    return (
      <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * f} ${s * sy})`} opacity={op}>
        <rect x="-16" y="-21" width="32" height="42" rx="5" fill={v(0.68)} />
        {f > 0.25 && <ComfortFace kind={kind} />}
        {f < -0.25 && <g transform="scale(-1 1)"><ComfortFace kind={kind} /></g>}
      </g>
    );
  }
  const Dots = ({ val = 0.9 }) => <g>{[0, 1, 2].map((i) => <circle key={i} cx={7.2 + i * 2.6} cy="-18.3" r="0.95" fill={v(val)} />)}</g>;
  // a hidden post: what a calibrated feed leaves of a red post (an outline and a crossed eye)
  function HiddenPost({ op = 1 }) {
    return (
      <g opacity={op}>
        <rect x="-16" y="-21" width="32" height="42" rx="5" fill="none" stroke={v(0.82)} strokeWidth="0.5" strokeDasharray="2.2 1.4" />
        <ellipse cx="0" cy="0" rx="5" ry="3" fill="none" stroke={v(0.82)} strokeWidth="0.7" />
        <line x1="-5" y1="4" x2="5" y2="-4" stroke={v(0.82)} strokeWidth="0.7" strokeLinecap="round" />
      </g>
    );
  }
  // one feed item at (x, y), card scale s. tone: 'red' (crisis), 'warm' (comfort), 'info' (calm news), 'hidden'
  // veil 0..1 turns a red post into its hidden outline
  function FeedCard({ it, x, y, s = CS, sy = 1, rot = 0, dots = false }) {
    const t = `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(${s} ${s * sy})`;
    if (it.tone === 'warm') return <g transform={t}><WarmPost kind={it.kind} />{dots && <Dots val={0.5} />}</g>;
    if (it.tone === 'hidden') return <g transform={t}><HiddenPost /></g>;
    const veil = it.veil || 0;
    return (
      <g transform={t}>
        {veil < 1 && <g opacity={1 - veil}><PostValue x={0} y={0} kind={it.kind} />{dots && <Dots />}</g>}
        {veil > 0 && <HiddenPost op={veil} />}
      </g>
    );
  }
  // feed layout: items stack from `top`, shifted by scroll; an item with gone: [t0, t1] collapses over that window
  function feedLayout(items, scroll, T, top = FEED_TOP, pitch = PITCH, h = CARD_H) {
    let y = top - scroll;
    return items.map((it) => {
      const k = it.gone ? 1 - g01(T, it.gone[0], it.gone[1]) : 1;
      const cy = y + (h / 2) * k;
      y += pitch * k;
      const veil = it.veilAt ? g01(T, it.veilAt[0], it.veilAt[1]) : 0;
      return { ...it, cy, k, veil };
    });
  }
  // split a laid-out feed into the curator layer and the red layer
  function feedCards(L, { x = SW / 2, s = CS, dots = false, h = CARD_H } = {}) {
    const cur = [], red = [];
    L.forEach((it, i) => {
      if (it.k < 0.03 || it.cy < -h || it.cy > SH + h) return;
      const el = <FeedCard key={it.id || i} it={it} x={x + (it.dx || 0)} y={it.cy} s={s} sy={it.k} rot={it.rot || 0} dots={dots} />;
      (it.tone === 'warm' || it.tone === 'info' ? cur : red).push(el);
    });
    return { cur, red };
  }

  // ── icons (value, centred, about 24 px) ──
  function Icon({ kind, x, y, val = 0.32, s = 1 }) {
    const st = { fill: 'none', stroke: v(val), strokeWidth: 2.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
    let el;
    switch (kind) {
      case 'unfollow': el = <g><circle cx="-4" cy="-5" r="5.5" {...st} /><path d="M -13 10 Q -4 -1 5 10" {...st} /><line x1="6" y1="-3" x2="14" y2="-3" {...st} /></g>; break;
      case 'follow': el = <g><circle cx="-4" cy="-5" r="5.5" {...st} /><path d="M -13 10 Q -4 -1 5 10" {...st} /><path d="M 10 -7 L 10 1 M 6 -3 L 14 -3" {...st} /></g>; break;
      case 'mute': el = <g><path d="M -11 -4 L -6 -4 L 0 -10 L 0 10 L -6 4 L -11 4 Z" {...st} /><path d="M 5 -5 L 13 5 M 13 -5 L 5 5" {...st} /></g>; break;
      case 'hide': el = <g><path d="M -12 0 Q 0 -11 12 0 Q 0 11 -12 0 Z" {...st} /><circle r="3.4" {...st} /><line x1="-11" y1="10" x2="11" y2="-10" {...st} /></g>; break;
      case 'report': el = <g><path d="M -8 11 L -8 -10 M -8 -9 L 9 -9 L 5 -4 L 9 1 L -8 1" {...st} /></g>; break;
      case 'mic': el = <g><rect x="-5" y="-12" width="10" height="16" rx="5" {...st} /><path d="M -10 -1 Q -10 9 0 9 Q 10 9 10 -1 M 0 9 L 0 13" {...st} /></g>; break;
      case 'send': el = <path d="M -9 9 L 11 0 L -9 -9 L -6 0 Z" fill={v(val)} />; break;
      case 'play': el = <path d="M -6 -9 L 10 0 L -6 9 Z" fill={v(val)} />; break;
      default: el = <circle r="6" {...st} />;
    }
    return <g transform={`translate(${x} ${y}) scale(${s})`}>{el}</g>;
  }

  // ── bottom sheet: the "…" menu. rows are icon kinds; hl highlights a row, press darkens it ──
  const SHEET_H = 320;
  const sheetRowY = (open, i) => SH - SHEET_H * open + 44 + i * 64 + 28;
  function Sheet({ open, hl = -1, press = 0, rows = ['unfollow', 'mute', 'hide', 'report'] }) {
    if (open <= 0.002) return null;
    const y0 = SH - SHEET_H * open;
    return (
      <g>
        <rect width={SW} height={SH} fill={v(0.05)} opacity={0.4 * open} />
        <rect y={y0} width={SW} height={SHEET_H + 40} rx="26" fill={v(0.97)} />
        {bar(SW / 2 - 24, y0 + 12, 48, 6, 0.7)}
        {rows.map((kind, i) => {
          const ry = y0 + 44 + i * 64;
          return (
            <g key={i}>
              {i === hl && <rect x="12" y={ry} width={SW - 24} height="56" rx="14" fill={v(0.86 - 0.16 * press)} />}
              <Icon kind={kind} x={46} y={ry + 28} />
              {bar(80, ry + 22, [128, 92, 140, 78][i % 4], 12, 0.42)}
            </g>
          );
        })}
      </g>
    );
  }

  // ── keyboard: three rows of keys and a space bar; pressed is a list of [row, col] ──
  const KEYS = [10, 9, 7];
  const keyPos = (row, col) => (row === 3 ? [SW / 2, KB_TOP + 236] : [8 + [0, 17, 51][row] + col * 34.4 + 15, KB_TOP + 40 + row * 62]);
  function Keyboard({ y = 0, pressed = [] }) {
    const isP = (r, c) => pressed.some((p) => p[0] === r && p[1] === c);
    return (
      <g transform={`translate(0 ${y})`}>
        <rect y={KB_TOP} width={SW} height={SH - KB_TOP + 40} fill={v(0.8)} />
        {KEYS.map((n, r) => Array.from({ length: n }, (_, c) => { const p = keyPos(r, c); return <rect key={r + '-' + c} x={p[0] - 15} y={p[1] - 22} width="30" height="44" rx="7" fill={v(isP(r, c) ? 0.5 : 0.97)} />; }))}
        <rect x={SW / 2 - 90} y={KB_TOP + 214} width="180" height="44" rx="7" fill={v(isP(3, 0) ? 0.5 : 0.97)} />
      </g>
    );
  }
  // a run of taps between t0 and t1, one every dt; each picks a key from its index
  function typing(T, t0, t1, dt = 0.08, seed = 1) {
    const taps = [];
    for (let t = t0, n = 0; t < t1; t += dt, n++) {
      const row = hash(n * 3.7 + seed) < 0.12 ? 3 : Math.floor(hash(n * 1.3 + seed * 7) * 3);
      taps.push({ t, row, col: row === 3 ? 0 : Math.floor(hash(n * 5.1 + seed * 3) * KEYS[row]) });
    }
    const n = taps.filter((tp) => tp.t <= T).length;
    const cur = taps[Math.max(0, n - 1)], next = taps[Math.min(taps.length - 1, n)];
    // the thumb sits on the last key for a moment, then travels to the next
    const u = n === 0 ? 0 : clamp((T - cur.t) / dt, 0, 1);
    const a = keyPos(cur.row, cur.col), b = keyPos(next.row, next.col);
    const e = Easing.easeInOutSine(clamp((u - 0.35) / 0.65, 0, 1));
    const tip = n === 0 ? keyPos(taps[0].row, taps[0].col) : [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e];
    const pressed = taps.filter((tp) => T >= tp.t && T < tp.t + 0.07).map((tp) => [tp.row, tp.col]);
    return { tip, pressed, count: n, total: taps.length, done: T >= t1, lastT: n ? cur.t : -9, taps };
  }

  // ── chat ──
  // a bubble anchored at its top-right (side 'r') or top-left ('l') corner; n lines of bars
  function Bubble({ x, y, w = 220, n = 2, side = 'r', val, s = 1, op = 1, seed = 1, jag = 0 }) {
    const h = 18 + n * 20, x0 = side === 'r' ? x - w : x;
    const tone = val ?? (side === 'r' ? 0.5 : 0.78), line = side === 'r' ? 0.95 : 0.4;
    const ox = side === 'r' ? x : x, oy = y + h;
    return (
      <g transform={`translate(${ox} ${oy}) scale(${s}) translate(${-ox} ${-oy})`} opacity={op}>
        <rect x={x0} y={y} width={w} height={h} rx="18" fill={v(tone)} />
        {Array.from({ length: n }, (_, i) => {
          const lw = (w - 36) * (i === n - 1 ? 0.45 + 0.4 * hash(seed + i) : 0.8 + 0.2 * hash(seed + i * 3));
          if (!jag) return <rect key={i} x={x0 + 18} y={y + 13 + i * 20} width={lw} height="9" rx="4.5" fill={v(line)} />;
          // venting: the line is a scribble, not a tidy bar
          let d = `M ${x0 + 18} ${y + 18 + i * 20}`;
          for (let k = 1; k <= 14; k++) d += ` L ${x0 + 18 + (lw * k) / 14} ${y + 18 + i * 20 + (hash(seed * 9 + i * 31 + k) - 0.5) * 12 * jag}`;
          return <path key={i} d={d} fill="none" stroke={v(line)} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />;
        })}
      </g>
    );
  }
  const bubbleH = (n) => 18 + n * 20;
  const msgH = (m) => (m.photo ? 42 * 5 + 16 : m.sticker ? 70 : bubbleH(m.n));
  // a column of bubbles stacked up from `bottom`; each { side, n, w, t } appears at t (pops in, pushes the others up)
  function ChatColumn({ T, msgs, bottom, jag = 0 }) {
    let y = bottom;
    const out = [];
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i], a = m.t === undefined ? 1 : pop(T, m.t, 0.35);
      if (a <= 0) continue;
      y -= (msgH(m) + 12) * a;
      const x0 = m.side === 'r' ? SW - 16 : 16;
      if (m.photo) out.push(<g key={i} opacity={a}><rect x={x0} y={y} width="178" height={msgH(m)} rx="18" fill={v(0.88)} /><WarmPost x={x0 + 89} y={y + msgH(m) / 2} s={5 * (0.6 + 0.4 * a)} kind={m.photo} /></g>);
      else if (m.sticker) out.push(<path key={i} d={HEART} transform={`translate(${x0 + 40} ${y + 40}) scale(${3.2 * a})`} fill={v(0.45)} />);
      else out.push(<Bubble key={i} x={x0} y={y} w={m.w || 220} n={m.n} side={m.side} s={0.6 + 0.4 * a} op={a} seed={i * 7 + 3} jag={m.jag ? jag || 1 : 0} />);
      if (m.react && T > m.react) out.push(<g key={'h' + i} transform={`translate(${m.side === 'r' ? SW - 22 - (m.w || 220) : 16 + (m.w || 220)} ${y + msgH(m) - 4}) scale(${0.9 * pop(T, m.react, 0.3)})`}><circle r="14" fill={v(0.97)} /><path d={HEART} transform="scale(0.85)" fill={v(0.42)} /></g>);
    }
    return <g>{out}</g>;
  }
  function ChatHeader({ val = 0.5 }) {
    return <g><rect y="0" width={SW} height="104" fill={v(0.92)} /><circle cx="64" cy="70" r="20" fill={v(val)} />{bar(96, 60, 110, 12, 0.35)}{bar(96, 78, 60, 8, 0.6)}</g>;
  }
  function Compose({ y = KB_TOP - 58, fill = 0, jag = 0, seed = 2 }) {
    const w = 250 * clamp(fill, 0, 1);
    let line = null;
    if (w > 2) {
      if (!jag) line = bar(34, y + 17, w, 10, 0.45);
      else {
        let d = `M 34 ${y + 22}`;
        for (let k = 1; k <= 16; k++) d += ` L ${34 + (w * k) / 16} ${y + 22 + (hash(seed + k * 13) - 0.5) * 12 * jag}`;
        line = <path d={d} fill="none" stroke={v(0.4)} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />;
      }
    }
    return <g><rect x="14" y={y} width={SW - 76} height="44" rx="22" fill={v(0.98)} />{line}<circle cx={SW - 34} cy={y + 22} r="20" fill={v(0.5)} /><Icon kind="send" x={SW - 33} y={y + 22} val={0.97} s={0.8} /></g>;
  }

  // ── feedback ──
  function Ripple({ p, T, t0, val = 0.3, R0 = 46 }) {
    const a = (T - t0) / 0.4;
    if (a < 0 || a > 1) return null;
    return <circle cx={p[0]} cy={p[1]} r={10 + R0 * Easing.easeOutCubic(a)} fill={v(val)} opacity={0.4 * (1 - a)} />;
  }
  function Heart({ x, y, s = 1, op = 1, val = 0.97 }) {
    return <path d={HEART} transform={`translate(${x} ${y}) scale(${s})`} fill={v(val)} opacity={op} />;
  }

  // ── hands: the Bean has no hands, so these are Bean arms (round-capped strokes) grown into a mitt with a thumb.
  // Drawn in value (filled with the screen light gradient) and toned through the hand filter, in world coordinates.
  const st = (w) => ({ fill: 'none', strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round' });
  const sm = (p, side) => (side > 0 ? p : [SW - p[0], p[1]]);   // mirror a screen point for the left hand
  // thumb from its root to the tip, bowed outward like a knuckle
  function thumbPath(root, tip, side) {
    const d = [tip[0] - root[0], tip[1] - root[1]], L = Math.hypot(d[0], d[1]) || 1;
    const n = [(d[1] / L) * side, (-d[0] / L) * side];
    const out = n[0] * side > 0 ? 1 : -1;
    const k = [(root[0] + tip[0]) / 2 + n[0] * out * L * 0.16, (root[1] + tip[1]) / 2 + n[1] * out * L * 0.16];
    return `M ${root[0].toFixed(1)} ${root[1].toFixed(1)} Q ${k[0].toFixed(1)} ${k[1].toFixed(1)} ${tip[0].toFixed(1)} ${tip[1].toFixed(1)}`;
  }
  // mitt: forearm + palm behind the phone, fingertips over the far edge, thumb over the screen. tip is a world point.
  function Mitt({ P, tip, side = 1, id = 'ph', layer = 'back', press = 0, arm = [240, 560] }) {
    const k = P.s, W = (p) => toWorld(P, sm(p, side)), fill = `url(#${id}L)`;
    const palm = W([SW - 8, SH * 0.8]);
    if (layer === 'back') {
      const a = P.rot || 0;
      return (
        <g>
          <path d={`M ${palm[0]} ${palm[1]} L ${palm[0] + side * arm[0] * k} ${palm[1] + arm[1] * k}`} stroke={fill} {...st(150 * k)} />
          <ellipse cx={palm[0]} cy={palm[1]} rx={88 * k} ry={124 * k} transform={`rotate(${a + side * 18} ${palm[0]} ${palm[1]})`} fill={fill} />
        </g>
      );
    }
    const root = W([SW + 26, SH * 0.72]);
    return (
      <g>
        {[0.56, 0.665, 0.77].map((f, i) => { const a = W([-40, SH * f]), b = W([8 + (i === 1 ? 5 : 0), SH * f + 8]); return <path key={i} d={`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`} stroke={fill} {...st(44 * k)} />; })}
        <path d={thumbPath(root, tip, side)} stroke={fill} {...st((50 + 4 * press) * k)} />
      </g>
    );
  }
  // stumps: plain Bean forearms from the bottom of the frame, round ends holding the phone's sides; tapL/tapR (world)
  // lifts that end onto the screen
  function Stumps({ P, id = 'ph', tapL, tapR, w = 84, from = 1240 }) {
    const k = P.s, fill = `url(#${id}L)`;
    const restL = toWorld(P, [-4, SH * 0.8]), restR = toWorld(P, [SW + 4, SH * 0.76]);
    const eL = tapL || restL, eR = tapR || restR;
    const sL = [P.x - 470 * k, from], sR = [P.x + 470 * k, from];
    const arm = (s, e, side) => { const m = [(s[0] + e[0]) / 2 + side * 60 * k, (s[1] + e[1]) / 2 + 30 * k]; return `M ${s[0]} ${s[1]} Q ${m[0]} ${m[1]} ${e[0]} ${e[1]}`; };
    return (
      <g>
        <path d={arm(sL, eL, -1)} stroke={fill} {...st(w * k)} />
        <path d={arm(sR, eR, 1)} stroke={fill} {...st(w * k)} />
      </g>
    );
  }

  window.FU_PHONE = {
    SW, SH, BZ, CS, CARD_H, GAP, PITCH, FEED_TOP, KB_TOP, SHEET_H, COMFORT_KINDS, HEART,
    track, track2, path2, pressAt, g01, pop, toWorld, phoneT, PhoneDefs, Phone, Layers, StatusBar, AppBar, HomeBar, bar,
    ComfortFace, WarmPost, HiddenPost, FeedCard, feedLayout, feedCards, Icon, Sheet, sheetRowY, Keyboard, keyPos, typing,
    Bubble, bubbleH, msgH, ChatColumn, ChatHeader, Compose, Ripple, Heart, thumbPath, Mitt, Stumps,
  };
})();
