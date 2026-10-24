// Feeding Uncertainty — end credits (12 s), ideation round 1. Eight concepts on the same beats (Open, Title, Names,
// Logo, Note, Hold), so a beat can be swapped between concepts. Mostly graphic: the film's world comes in as light,
// colour, bands, depth of field and the red posts, not as characters. The endcard draft (reference/endcard-draft.png)
// is the starting layout; the card is a draft, so some concepts use a centred `columns` layout or the opening title's
// type (`title`: Inter, widely spaced caps, the red dot). Pick with `--set concept=B`; `layout` and `type` override.
// Type stays crisp (like the eyes); bars, rules, pools, lamps and the dot boil at 8 fps.
const { W, H, OUT_W, OUT_H, MOTION, osc, lerp, lerp2, hash, bez } = window.FU_RIG;
const { RAMPS, mixRamp, mix, v, GradeFilter, LookDefs, PostValue, POST_KINDS } = window.FU_LOOK;
const { glide, hit, build } = MOTION;

const CONCEPTS = {
  A: 'A · Bars: the palette bar unfolds into the card',
  B: 'B · Lamp: a hanging lamp reads the credits out of the dark',
  C: 'C · Windows: three louvred windows light up, one per name',
  D: 'D · Develop: each line posterizes out of a blur, like the portraits',
  E: 'E · Drift: a last swarm of posts passes and leaves the card clear',
  F: 'F · Focus: everything is there, out of focus; focus pulls line by line',
  G: 'G · Ramps: the world shifts through blue, teal and orange into grey',
  H: 'H · Dot: the opening title\'s red dot draws the card',
  draft: 'Draft endcard, static (for comparison)',
  S: 'Beats',
};
const AUTO = { A: ['left', 'card'], B: ['left', 'card'], C: ['columns', 'title'], D: ['left', 'card'], E: ['left', 'card'], F: ['columns', 'card'], G: ['left', 'card'], H: ['left', 'title'], draft: ['left', 'card'], S: ['left', 'card'] };

// ── colours (from the draft) ──────────────────────────────────────────────────
const BG = '#3a3733', TXT = '#f2eee8', MUTE = '#9a958e', LOGO_C = '#c23a1b';
const GC = { wd: '#46647a', open: '#5fa69a', cur: '#e0a165', red: '#a32e11' };
const LABEL_C = { wd: '#5c83a0', open: '#5fa69a', cur: '#e0a165' };
const WEIGHT = ['#1d1b19', '#2a2825', '#3a3733', '#4b4742', '#625d56', '#857f75', '#bfbcb6'];   // the palette's "pressure / weight" grey as a ramp
const OPEN_BG = '#141414', OPEN_TXT = '#e5e6e3', OPEN_DOT = '#e83144';                          // sampled from the opening title
const rampOf = (r) => (Array.isArray(r) ? r : r === 'weight' ? WEIGHT : RAMPS[r]);

const ROWS = [
  { label: 'A FILM BY', name: 'Luca Lange', g: 'wd' },
  { label: 'RESEARCHER', name: 'Dr. Qinfeng Zhu', g: 'open' },
  { label: 'RESEARCH ASSISTANT', name: 'Anastasija Zareckyte', g: 'cur' },
];
const NOTE = ['All imagery in this film is illustrative.', 'No person shown is a participant in the study'];

// ── type: `card` is the draft's Futura (local, git-ignored fonts/), `title` the opening title's style ──
const FUT = "'FU Futura', 'Jost', 'Inter', sans-serif", INTER = "'Inter', sans-serif";
const TYPES = {
  card: {
    title: { family: FUT, weight: 700, size: 75 }, label: { family: FUT, weight: 700, size: 23 },
    name: { family: FUT, weight: 500, size: 48 }, note: { family: FUT, weight: 500, size: 24, italic: true }, colName: 40,
  },
  title: {
    title: { family: INTER, weight: 300, size: 50, track: 0.5 }, label: { family: INTER, weight: 500, size: 15, track: 0.32 },
    name: { family: INTER, weight: 300, size: 44 }, note: { family: INTER, weight: 300, size: 21, italic: true }, colName: 34,
  },
};
function Txt({ t, x, y, st, size, fill, anchor = 'start', len, op = 1 }) {
  return (
    <text x={x} y={y} fontFamily={st.family} fontWeight={st.weight} fontStyle={st.italic ? 'italic' : 'normal'} fontSize={size || st.size}
      letterSpacing={st.track ? st.track + 'em' : undefined} textAnchor={anchor} fill={fill} opacity={op}
      textLength={len} lengthAdjust={len ? 'spacing' : undefined}>{t}</text>
  );
}

// ── layouts (1920 × 1080). `left` is the draft, measured from its 4K PNG; `columns` is centred ──
function layout(name, ty) {
  const tt = ty === 'title';
  if (name === 'columns') {
    const len = tt ? 1180 : 938;
    return {
      name, bar: { x: 810, y: 214, seg: 75, h: 11 },
      title: { x: 960 - len / 2, y: 330, len, anchor: 'start' },
      rows: [480, 960, 1440].map((cx, i) => ({
        bar: [cx - 30, 430, 60, 6], label: [cx, 480], name: [cx, 534], anchor: 'middle', size: TYPES[ty].colName, box: [cx - 240, 420, 480, 130],
      })),
      logo: { x: 960 - 150, y: 612, w: 300 }, rule: { x: 810, y: 920, w: 300 }, note: { x: 960, ys: [962, 994], anchor: 'middle', len2: tt ? 500 : 520 },
    };
  }
  const len = tt ? 960 : 938;
  return {
    name: 'left', bar: { x: 180, y: 190, seg: 75, h: 11 },
    title: { x: 180, y: 324, len, anchor: 'start' },
    rows: [0, 1, 2].map((i) => {
      const y0 = 415 + 135 * i;
      return { bar: [180, y0 + 4, 7, 81], label: [210, y0 + 26], name: [210, y0 + 82], anchor: 'start', box: [170, y0 - 10, 720, 120] };
    }),
    logo: { x: 1290, y: 370, w: 450 }, rule: { x: 180, y: 890, w: 300 }, note: { x: 180, ys: [939, 974], anchor: 'start', len2: tt ? 470 : 498 },
  };
}

// ── boil helpers ──────────────────────────────────────────────────────────────
// a polygon whose corners wander a fraction of a pixel at 8 fps
const bpoly = (pts, bf, id, amp) => 'M ' + pts.map(([x, y], i) => `${(x + (hash(bf * 3.1 + id * 7.7 + i * 1.3) - 0.5) * amp).toFixed(2)} ${(y + (hash(bf * 5.3 + id * 2.9 + i * 4.1) - 0.5) * amp).toFixed(2)}`).join(' L ') + ' Z';
const brect = (x, y, w, h, bf, id, amp) => bpoly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], bf, id, amp);
const bR = (r, bf, id, amp) => r + (hash(bf * 2.3 + id * 9.1) - 0.5) * amp;

// ── the RUG logo, tinted; the slash can be left out (masked) and drawn by a concept ──
const SLASH = [[667, 140], [688, 140], [404, 493], [382, 493]];   // in the logo's 1000 × 890 pixels
const slashPts = (L, u = 1) => {
  const P = SLASH.map(([x, y]) => [L.x + (x * L.w) / 1000, L.y + (y * L.w) / 1000]);
  return [lerp2(P[3], P[0], u), lerp2(P[2], P[1], u), P[2], P[3]];   // grows from the bottom
};
function Logo({ L, op = 1, slash = true, color = LOGO_C, id = 'lg' }) {
  if (op <= 0.001) return null;
  const P = slashPts(L).map(([x, y], i) => [x + (i < 2 ? 3 : 3) * (i === 0 || i === 3 ? -1 : 1), y + (i < 2 ? -3 : 3)]);
  return (
    <g opacity={op}>
      <defs>
        <filter id={id + 'T'} x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB"><feFlood floodColor={color} /><feComposite in2="SourceAlpha" operator="in" /></filter>
        {!slash && <mask id={id + 'M'} maskUnits="userSpaceOnUse" x={L.x - 10} y={L.y - 10} width={L.w + 20} height={L.w + 20}>
          <rect x={L.x - 10} y={L.y - 10} width={L.w + 20} height={L.w + 20} fill="#fff" />
          <path d={'M ' + P.map((p) => p.join(' ')).join(' L ') + ' Z'} fill="#000" />
        </mask>}
      </defs>
      <image href="assets/rug-logo.png" x={L.x} y={L.y} width={L.w} height={L.w * 0.89} filter={`url(#${id}T)`} mask={slash ? undefined : `url(#${id}M)`} />
    </g>
  );
}
const Slash = ({ L, u, color = LOGO_C, bf, amp }) => (u > 0.001 ? <path d={bpoly(slashPts(L, u), bf, 91, amp * 0.6)} fill={color} /> : null);

// ── the card, element by element. st[key] = { op, dx, dy, wipe (0–1, left to right), slot (clip at its own box) };
// fx(key) adds props (a filter, a mask) to an element's group; dim mixes every colour toward `bg` (a dark copy) ──
const KEYS = ['bar', 'title', 'row0', 'row1', 'row2', 'logo', 'rule', 'note'];
function CardArt({ L, ty, st = {}, fx = () => ({}), dim = 0, bg = BG, uid = 'c', k, bars = [1, 1, 1, 1], rowBar = [1, 1, 1], ruleW = 1, logoSlash = true, txt = TXT, mute = MUTE, titleFill, noteLen2, labelFill }) {
  const T_ = TYPES[ty];
  const c = (x) => (dim ? mix(x, bg, dim) : x);
  const { bf, amp } = k;
  const El = ({ id, box, children }) => {
    const e = st[id] || {};
    const op = e.op ?? 1;
    if (op <= 0.001) return null;
    const clip = e.wipe != null || e.slot;
    const [bx, by, bw, bh] = box;
    return (
      <g opacity={op} {...fx(id)}>
        {clip && <defs><clipPath id={uid + id}><rect x={bx} y={by} width={bw * (e.wipe ?? 1)} height={bh} /></clipPath></defs>}
        <g clipPath={clip ? `url(#${uid + id})` : undefined}><g transform={`translate(${e.dx || 0} ${e.dy || 0})`}>{children}</g></g>
      </g>
    );
  };
  const B = L.bar, Tl = L.title;
  const cols = [GC.wd, GC.open, GC.cur, GC.red];
  return (
    <g>
      <El id="bar" box={[B.x - 10, B.y - 10, B.seg * 4 + 20, B.h + 20]}>
        {bars.map((w, i) => w > 0.001 && <path key={i} d={brect(B.x + i * B.seg, B.y, B.seg * w, B.h, bf, 10 + i, amp * 0.6)} fill={c(cols[i])} />)}
      </El>
      <El id="title" box={[Tl.x - 30, Tl.y - 100, Tl.len + 80, 124]}>
        <Txt t="FEEDING UNCERTAINTY" x={Tl.x} y={Tl.y} st={T_.title} fill={c(titleFill || txt)} len={Tl.len} />
      </El>
      {L.rows.map((R, i) => (
        <El key={i} id={'row' + i} box={R.box}>
          {rowBar[i] > 0.001 && <path d={L.name === 'left' ? brect(R.bar[0], R.bar[1], R.bar[2], R.bar[3] * rowBar[i], bf, 20 + i, amp * 0.6)
            : brect(R.bar[0] + (R.bar[2] * (1 - rowBar[i])) / 2, R.bar[1], R.bar[2] * rowBar[i], R.bar[3], bf, 20 + i, amp * 0.6)} fill={c(LABEL_C[ROWS[i].g])} />}
          <Txt t={ROWS[i].label} x={R.label[0]} y={R.label[1]} st={T_.label} fill={c(labelFill ? labelFill(i) : LABEL_C[ROWS[i].g])} anchor={R.anchor} />
          <Txt t={ROWS[i].name} x={R.name[0]} y={R.name[1]} st={T_.name} size={R.size} fill={c(txt)} anchor={R.anchor} />
        </El>
      ))}
      <El id="logo" box={[L.logo.x - 10, L.logo.y - 10, L.logo.w + 20, L.logo.w * 0.89 + 20]}>
        <Logo L={L.logo} slash={logoSlash} color={c(LOGO_C)} id={uid + 'lg'} />
      </El>
      <El id="rule" box={[L.rule.x - 2, L.rule.y - 4, L.rule.w + 4, 8]}>
        {ruleW > 0.001 && <path d={brect(L.rule.anchor === 'middle' ? L.rule.x : L.rule.x, L.rule.y - 0.75, L.rule.w * ruleW, 1.5, bf, 30, amp * 0.4)} fill={c(mute)} />}
      </El>
      <El id="note" box={[L.note.anchor === 'middle' ? L.note.x - 400 : L.note.x - 10, L.note.ys[0] - 30, 820, 80]}>
        <Txt t={NOTE[0]} x={L.note.x} y={L.note.ys[0]} st={T_.note} fill={c(mute)} anchor={L.note.anchor} />
        <Txt t={NOTE[1] + (noteLen2 ? '' : '.')} x={L.note.x} y={L.note.ys[1]} st={T_.note} fill={c(mute)} anchor={L.note.anchor} len={noteLen2} />
      </El>
    </g>
  );
}

// ── beats, anchored to the section cues so retiming a section carries them along ──
const beats = (q) => ({
  title: q.Title + 0.1,
  rows: [0, 1, 2].map((i) => q.Names + 0.2 + i * 1.25),
  logo: q.Logo + 0.1,
  note: q.Note + 0.1,
  end: q.Hold,
});
const ap = (T, t0, d = 0.8) => glide(T, t0, t0 + d, 0, 1);
// a value stepped through keys [[t, value]…] with a glide of `d` seconds into each key
const keyed = (T, keys, d) => keys.reduce((acc, [t, x], i) => (i === 0 ? x : lerp(acc, x, glide(T, t - d / 2, t + d / 2, 0, 1))), 0);
const keyedRamp = (T, keys, d) => keys.reduce((acc, [t, r], i) => (i === 0 ? rampOf(r) : mixRamp(acc, rampOf(r), glide(T, t - d / 2, t + d / 2, 0, 1))), null);
const allOn = () => Object.fromEntries(KEYS.map((x) => [x, { op: 1 }]));
// the usual quiet arrival: fade and a small rise
const arrive = (T, t0, d = 0.9, rise = 10) => ({ op: ap(T, t0, d), dy: glide(T, t0, t0 + d + 0.3, rise, 0) });

// ═══ A · Bars: the four-colour bar draws on; the title rises out of a slot under it; each row's side bar drops from
// the bar and its text wipes on; the logo wipes on and its slash draws up; the rule draws, the note fades in ═══
function ConceptBars({ k }) {
  const { T, q, b, L, ty } = k;
  const bars = [0, 1, 2, 3].map((i) => glide(T, 0.3 + i * 0.16, 1.1 + i * 0.16, 0, 1));
  const st = {
    bar: { op: 1 },
    title: { op: 1, dy: glide(T, b.title, b.title + 1.1, 96, 0), slot: true },
    logo: { op: 1, wipe: glide(T, b.logo + 0.35, b.logo + 1.35, 0, 1) },
    rule: { op: 1 }, note: { op: ap(T, b.note + 0.5, 0.9), dy: glide(T, b.note + 0.5, b.note + 1.4, 6, 0) },
  };
  b.rows.forEach((t, i) => { st['row' + i] = { op: 1, wipe: glide(T, t + 0.3, t + 1.2, 0, 1), dx: glide(T, t + 0.3, t + 1.3, -14, 0) }; });
  const rowBar = b.rows.map((t) => glide(T, t, t + 0.6, 0, 1));
  return (
    <g>
      <CardArt L={L} ty={ty} k={k} st={st} bars={bars} rowBar={rowBar} logoSlash={false} ruleW={glide(T, b.note, b.note + 0.9, 0, 1)} uid="a" />
      <Slash L={L.logo} u={glide(T, b.logo, b.logo + 0.8, 0, 1)} bf={k.bf} amp={k.amp} />
    </g>
  );
}

// ═══ B · Lamp: the whole card hangs in the dark; a lamp swings in and its pool reads it line by line. The pool takes
// each row's ramp. On the note the lamp pulls up out of frame and its light opens over the whole card ═══
const LAMP_KEYS = (L, b) => {
  const r = L.rows;
  return [[0, [-260, 240]], [b.title + 0.3, [L.title.x + L.title.len / 2 - 60, L.title.y - 30]],
    ...b.rows.map((t, i) => [t + 0.1, [r[i].name[0] + 160, r[i].name[1] - 30]]),
    [b.logo + 0.2, [L.logo.x + L.logo.w / 2, L.logo.y + L.logo.w * 0.45]], [b.note + 0.6, [960, 560]]];
};
function lampState(T, L, b) {
  const keys = LAMP_KEYS(L, b);
  const at = (t) => [0, 1].map((j) => keys.reduce((acc, [kt, p], i) => (i === 0 ? p[j] : lerp(acc, p[j], glide(t, kt - 0.55, kt + 0.35, 0, 1))), 0));
  const PY = glide(T, b.note, b.note + 1.6, -90, -900), PX = 960, cable = 300;
  const ang = (t) => { const p = at(t); return Math.atan2(p[0] - PX, p[1] - PY); };
  const a1 = ang(T - 0.1), rot = a1 + 0.6 * (a1 - ang(T - 0.32));
  const shade = [PX + cable * Math.sin(rot), PY + cable * Math.cos(rot)];
  const lag = ang(T - 0.14);
  const ctrl = [PX + cable * 0.5 * Math.sin(lag), PY + cable * 0.5 * Math.cos(lag)];
  const tgt = at(T);
  const dist = Math.hypot(tgt[0] - shade[0], tgt[1] - shade[1]);
  const pool = [shade[0] + Math.sin(rot) * dist, shade[1] + Math.cos(rot) * dist];
  const R = 250 + build(T, b.note + 0.3, b.note + 2.2, 0, 1500);
  return { PX, PY, shade, ctrl, rot, pool, R, open: glide(T, b.note + 0.3, b.note + 2.0, 0, 1) };
}
function ConceptLamp({ k }) {
  const { T, b, L, ty, bf, amp } = k;
  const s = lampState(T, L, b);
  const ramp = keyedRamp(T, [[0, 'weight'], [b.rows[0], 'wd'], [b.rows[1], 'open'], [b.rows[2], 'cur'], [b.logo, 'weight']], 0.7);
  const on = ap(T, 0.1, 0.9);
  const [px, py] = s.pool;
  const deg = (s.rot * 180) / Math.PI;
  const mouth = (sgn) => [s.shade[0] + Math.cos(s.rot) * 40 * sgn, s.shade[1] - Math.sin(s.rot) * 40 * sgn];
  const tang = (sgn) => [px + Math.cos(s.rot) * s.R * 0.92 * sgn, py - Math.sin(s.rot) * s.R * 0.92 * sgn];
  const lit = allOn();
  return (
    <g>
      <rect x="0" y="0" width={W} height={H} fill={WEIGHT[1]} />
      <g opacity={on}>
        {[[1, 2, 1], [0.78, 3, 0.55], [0.58, 3, 0.6], [0.4, 4, 0.45]].map(([f, tone, o], i) => <circle key={i} cx={px} cy={py} r={bR(s.R * f * 1.15, bf, 40 + i, amp)} fill={ramp[tone]} opacity={i === 0 ? o : o * (1 - s.open)} />)}
      </g>
      <CardArt L={L} ty={ty} k={k} st={lit} dim={0.93} bg={WEIGHT[1]} uid="bd" />
      <defs>
        <radialGradient id="bPool"><stop offset="0.6" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <mask id="bMask" maskUnits="userSpaceOnUse" x="-200" y="-200" width="2320" height="1480"><circle cx={px} cy={py} r={s.R * 1.2} fill="url(#bPool)" opacity={on} /></mask>
      </defs>
      <g mask="url(#bMask)"><CardArt L={L} ty={ty} k={k} st={lit} uid="bl" /></g>
      <path d={`M ${mouth(-1).join(' ')} L ${tang(-1).join(' ')} L ${tang(1).join(' ')} L ${mouth(1).join(' ')} Z`} fill={ramp[6]} opacity={0.07 * on * (1 - s.open)} />
      <path d={`M ${s.PX} ${s.PY} Q ${s.ctrl[0]} ${s.ctrl[1]} ${s.shade[0] - Math.sin(s.rot) * 30} ${s.shade[1] - Math.cos(s.rot) * 30}`} stroke={WEIGHT[3]} strokeWidth="3" fill="none" />
      <g transform={`translate(${s.shade[0]} ${s.shade[1]}) rotate(${-deg})`}>
        <rect x="-7" y="-36" width="14" height="14" rx="3" fill={WEIGHT[3]} />
        <path d={bpoly([[-10, -24], [-34, -12], [-44, 10], [44, 10], [34, -12], [10, -24]], bf, 50, amp * 0.8)} fill={WEIGHT[4]} />
        <path d={bpoly([[-10, -24], [-34, -12], [-44, 10], [-22, 10], [-18, -6], [-6, -24]], bf, 51, amp * 0.8)} fill={WEIGHT[5]} />
        <ellipse cx="0" cy="10" rx="44" ry="7" fill={ramp[6]} opacity={0.4 + 0.6 * on} />
      </g>
    </g>
  );
}

// ═══ C · Windows: the night world; three louvred windows, one per name, light up in turn in their group's ramp
// (orange's flickers, as in Resistance); the louvres open and the name sits in the light. Title and logo above
// and below in the opening title's type ═══
function ConceptWindows({ k }) {
  const { T, b, L, ty, bf, amp } = k;
  const st = { bar: { op: 0 }, title: arrive(T, b.title, 1.2), logo: arrive(T, b.logo, 1.0), rule: { op: 0 }, note: arrive(T, b.note + 0.3, 0.9, 6) };
  const glowAt = (i, t) => {
    const g = hit(T, t, t + 0.5, 0, 1);
    return i === 2 ? g * (1 - 0.35 * glide(T, t + 0.15, t + 0.3, 0, 1) * (1 - glide(T, t + 0.3, t + 0.5, 0, 1)) - 0.06 * (0.5 + 0.5 * osc(T, 0.9)) * g) : g;
  };
  b.rows.forEach((t, i) => { st['row' + i] = arrive(T, t + 0.45, 0.8, 8); });
  return (
    <g>
      <rect x="0" y="0" width={W} height={H} fill={WEIGHT[1]} />
      {L.rows.map((R, i) => {
        const cx = R.label[0], g = glowAt(i, b.rows[i]), open = glide(T, b.rows[i] + 0.2, b.rows[i] + 1.2, 0, 1);
        const ramp = rampOf(ROWS[i].g), x0 = cx - 220, y0 = 405, w = 440, h = 170;
        const slats = 8, pitch = h / slats;
        return (
          <g key={i}>
            <rect x={x0 - 14} y={y0 - 14} width={w + 28} height={h + 28} fill={WEIGHT[2]} />
            <rect x={x0} y={y0} width={w} height={h} fill={mix(WEIGHT[0], ramp[1], g)} />
            {[0.95, 0.7, 0.45].map((f, j) => <ellipse key={j} cx={cx} cy={y0 + h * 0.6} rx={bR(w * 0.55 * f, bf, 60 + i * 3 + j, amp)} ry={h * 0.62 * f} fill={ramp[[2, 2, 3][j]]} opacity={g * [1, 0.7, 0.6][j]} />)}
            {Array.from({ length: slats }, (_, j) => {
              const top = y0 + j * pitch - h * open;   // the slats ride up into the head of the window
              if (top + pitch < y0) return null;
              const y1 = Math.max(top, y0), y2 = top + pitch * 0.9;
              return <path key={j} d={brect(x0, y1, w, Math.max(0, y2 - y1), bf, 70 + i * 9 + j, amp * 0.5)} fill={mix(WEIGHT[2], ramp[0], 0.5)} />;
            })}
            <path d={brect(x0 - 6, y0 - 12, w + 12, 14, bf, 68 + i, amp * 0.5)} fill={WEIGHT[3]} />
            <path d={brect(x0, y0 + h, w, 8, bf, 69 + i, amp * 0.5)} fill={WEIGHT[3]} />
          </g>
        );
      })}
      <CardArt L={L} ty={ty} k={k} st={st} rowBar={[0, 0, 0]} labelFill={(i) => rampOf(ROWS[i].g)[6]} uid="c" />
    </g>
  );
}

// ═══ D · Develop: each line comes out of a soft blob that is posterized into its ramp's bands; the bands tighten
// onto the letters and the crisp line takes over. Title and note in grey, rows in their group, the logo in red ═══
function ConceptDevelop({ k }) {
  const { T, b, L, ty } = k;
  const t0 = { bar: b.title - 0.3, title: b.title, row0: b.rows[0], row1: b.rows[1], row2: b.rows[2], logo: b.logo, rule: b.note, note: b.note + 0.2 };
  const rampFor = { bar: 'weight', title: 'weight', row0: 'wd', row1: 'open', row2: 'cur', logo: 'red', rule: 'weight', note: 'weight' };
  const D = 1.7;
  const blur = (id) => glide(T, t0[id], t0[id] + D, id === 'title' || id === 'logo' ? 34 : 24, 0);
  const crisp = (id) => glide(T, t0[id] + D - 0.5, t0[id] + D, 0, 1);
  const st = {};
  KEYS.forEach((id) => { st[id] = { op: ap(T, t0[id] - 0.1, 0.6) }; });
  const chan = (r, j) => rampOf(r).map((c) => (parseInt(c.slice(1 + 2 * j, 3 + 2 * j), 16) / 255).toFixed(3)).join(' ');
  const defs = KEYS.map((id) => {
    const s = blur(id), g = 1.15 + s * 0.06;
    return (
      <filter key={id} id={'dv' + id} filterUnits="userSpaceOnUse" x="-200" y="-200" width="2320" height="1480" colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceAlpha" stdDeviation={Math.max(s, 0.01)} result="a" />
        <feColorMatrix in="a" type="matrix" values={`0 0 0 ${g * 0.92} 0  0 0 0 ${g * 0.92} 0  0 0 0 ${g * 0.92} 0  0 0 0 ${g} 0`} result="l" />
        <feComponentTransfer in="l">
          <feFuncR type="discrete" tableValues={chan(rampFor[id], 0)} /><feFuncG type="discrete" tableValues={chan(rampFor[id], 1)} />
          <feFuncB type="discrete" tableValues={chan(rampFor[id], 2)} /><feFuncA type="discrete" tableValues="0 1 1 1 1 1 1" />
        </feComponentTransfer>
      </filter>
    );
  });
  // the banded copy fades as the crisp one comes in
  const stB = {}, stC = {};
  KEYS.forEach((id) => { stB[id] = { op: st[id].op * (1 - crisp(id)) }; stC[id] = { op: st[id].op * crisp(id) }; });
  return (
    <g>
      <rect x="0" y="0" width={W} height={H} fill={BG} />
      <defs>{defs}</defs>
      <CardArt L={L} ty={ty} k={k} st={stB} fx={(id) => ({ filter: `url(#dv${id})` })} uid="db" />
      <CardArt L={L} ty={ty} k={k} st={stC} uid="dc" />
    </g>
  );
}

// ═══ E · Drift: a last loose swarm of red posts drifts through right to left, three depths (far ones small and
// banded, near ones big and out of focus). The card appears quietly behind it, and the swarm is gone by the note ═══
const POSTS = Array.from({ length: 46 }, (_, i) => {
  const z = [0.55, 0.85, 1.25, 2.6][i % 4 === 3 && hash(i * 3.3) > 0.55 ? 3 : Math.floor(hash(i * 7.1) * 3)];
  return { i, z, dx: (hash(i * 1.7) - 0.5) * 1500, y: 80 + hash(i * 2.9) * 920, ph: hash(i * 4.4), kind: POST_KINDS[i % POST_KINDS.length], flip: hash(i * 6.1) > 0.8 };
});
function ConceptDrift({ k }) {
  const { T, b, L, ty } = k;
  const cx = glide(T, -0.6, b.note + 0.6, 2700, -1300);
  const st = { bar: arrive(T, b.title - 0.3, 0.9, 0), title: arrive(T, b.title + 0.2, 1.2), logo: arrive(T, b.logo, 1.1), rule: arrive(T, b.note, 0.8, 0), note: arrive(T, b.note + 0.3, 0.9, 6) };
  b.rows.forEach((t, i) => { st['row' + i] = arrive(T, t, 0.9); });
  const post = (p) => {
    const x = cx + p.dx * (0.7 + 0.3 * p.z) - (T * 40 * p.z), y = p.y + 30 * osc(T, 2.6 + p.ph, p.ph) - T * 6 * p.z;
    const flap = 0.55 + 0.45 * Math.cos((T / (0.5 + p.ph * 0.4) + p.ph) * Math.PI * 2);
    const flip = p.flip ? Math.cos(glide(T, 2 + p.ph * 5, 3 + p.ph * 5, 0, Math.PI)) : 1;
    return <PostValue key={p.i} x={x} y={y} rot={18 * osc(T, 3.1 + p.ph, p.ph)} s={p.z * 1.1} flip={flap * flip} kind={p.kind} />;
  };
  const by = (f) => POSTS.filter(f).map(post);
  return (
    <g>
      <rect x="0" y="0" width={W} height={H} fill={BG} />
      <g filter="url(#fuGradeFg-red)">{by((p) => p.z < 0.7)}</g>
      <g filter="url(#eMid)">{by((p) => p.z > 0.7 && p.z < 1)}</g>
      <CardArt L={L} ty={ty} k={k} st={st} uid="e" />
      <g filter="url(#eMid2)">{by((p) => p.z > 1 && p.z < 2)}</g>
      <g filter="url(#eNear)">{by((p) => p.z > 2)}</g>
    </g>
  );
}

// ═══ F · Focus: the whole card is there from the first frame, far out of focus over a soft out-of-focus world;
// the focus pulls to the title, then to each name in turn, then the logo and note; a slow pull-back throughout ═══
const BOKEH = [[260, 820, 190, 'wd', 3], [600, 180, 120, 'open', 3], [1180, 900, 230, 'cur', 2], [1650, 160, 160, 'weight', 4], [1500, 760, 130, 'open', 2], [90, 300, 150, 'cur', 2], [1000, 120, 100, 'wd', 4]];
function ConceptFocus({ k }) {
  const { T, b, L, ty } = k;
  const t0 = { bar: b.title, title: b.title, row0: b.rows[0], row1: b.rows[1], row2: b.rows[2], logo: b.logo, rule: b.note, note: b.note };
  const st = {}, defs = [];
  KEYS.forEach((id) => {
    const s = glide(T, t0[id], t0[id] + 1.1, 16, 0);
    st[id] = { op: lerp(0.5, 1, glide(T, t0[id], t0[id] + 1.1, 0, 1)) * ap(T, 0, 1.2) };
    defs.push(<filter key={id} id={'fc' + id} filterUnits="userSpaceOnUse" x="-200" y="-200" width="2320" height="1480"><feGaussianBlur stdDeviation={Math.max(s, 0.01)} /></filter>);
  });
  const z = glide(T, 0, b.end, 1.07, 1.0);
  return (
    <g>
      <rect x="0" y="0" width={W} height={H} fill={WEIGHT[1]} />
      <defs>{defs}<filter id="fBokeh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40" /></filter></defs>
      <g filter="url(#fBokeh)" opacity={0.55}>
        {BOKEH.map(([x, y, r, g, tone], i) => <circle key={i} cx={x + 30 * osc(T, 9 + i, i * 0.13)} cy={y + 18 * osc(T, 11 + i, i * 0.31)} r={r} fill={rampOf(g)[tone]} />)}
      </g>
      <g transform={`translate(960 540) scale(${z}) translate(-960 -540)`}>
        <CardArt L={L} ty={ty} k={k} st={st} fx={(id) => ({ filter: `url(#fc${id})` })} uid="f" />
      </g>
    </g>
  );
}

// ═══ G · Ramps: the frame's dark is a ramp's tinted dark. It starts in blue, turns teal on the second name and
// orange on the third, then settles into the card's warm grey for the logo. A soft banded pool drifts behind
// whatever just arrived ═══
function ConceptRamps({ k }) {
  const { T, b, L, ty, bf, amp } = k;
  const ramp = keyedRamp(T, [[0, 'wd'], [b.rows[1], 'open'], [b.rows[2], 'cur'], [b.logo + 0.3, 'weight']], 1.0);
  const keys = LAMP_KEYS(L, b);
  const pool = [0, 1].map((j) => keys.reduce((acc, [kt, p], i) => (i === 0 ? p[j] : lerp(acc, p[j], glide(T, kt - 0.9, kt + 0.6, 0, 1))), 0));
  const R = 330 + build(T, b.note, b.note + 2, 0, 900);
  const st = { bar: arrive(T, b.title - 0.4, 0.9, 0), title: arrive(T, b.title, 1.2), logo: arrive(T, b.logo + 0.3, 1.1), rule: arrive(T, b.note, 0.8, 0), note: arrive(T, b.note + 0.3, 0.9, 6) };
  b.rows.forEach((t, i) => { st['row' + i] = arrive(T, t, 0.9); });
  return (
    <g>
      <rect x="0" y="0" width={W} height={H} fill={mix(ramp[1], ramp[2], glide(T, b.note + 0.4, b.note + 2.2, 0, 1))} />
      {[1, 0.74, 0.5].map((f, i) => <ellipse key={i} cx={pool[0]} cy={pool[1]} rx={bR(R * f * 1.5, bf, 80 + i, amp)} ry={bR(R * f, bf, 84 + i, amp)} fill={ramp[2 + i]} opacity={(i === 0 ? 1 : 0.55) * (1 - glide(T, b.note + 0.4, b.note + 2.2, 0, 1))} />)}
      <CardArt L={L} ty={ty} k={k} st={st} uid="g" />
    </g>
  );
}

// ═══ H · Dot: the opening title's look (near-black, faint grid, wide light caps, the red dot over the Y). The dot
// is a pen: it drops to each name and draws its bar, climbs the logo's slash, draws the rule, and ends as the
// full stop of the note ═══
function dotPath(L, b) {
  const Tl = L.title, R = L.rows;
  const segs = [];
  const yDot = [Tl.x + Tl.len + 8, Tl.y - 38];
  let at = yDot;
  const hop = (t0, t1, to) => { segs.push({ t0, t1, a: at, b: to, arc: true }); at = to; };
  const slide = (t0, t1, to) => { segs.push({ t0, t1, a: at, b: to, arc: false }); at = to; };
  R.forEach((r, i) => {
    const t = b.rows[i], top = L.name === 'left' ? [r.bar[0] + 3.5, r.bar[1]] : [r.bar[0], r.bar[1] + 3];
    const bot = L.name === 'left' ? [r.bar[0] + 3.5, r.bar[1] + r.bar[3]] : [r.bar[0] + r.bar[2], r.bar[1] + 3];
    hop(t - 0.45, t, top); slide(t + 0.05, t + 0.6, bot);
  });
  const S = slashPts(L.logo);
  const sb = lerp2(S[3], S[2], 0.5), stp = lerp2(S[0], S[1], 0.5);
  hop(b.logo - 0.4, b.logo + 0.1, sb); slide(b.logo + 0.15, b.logo + 0.85, stp);
  const r0 = [L.rule.x, L.rule.y], r1 = [L.rule.x + L.rule.w, L.rule.y];
  hop(b.note - 0.3, b.note + 0.2, r0); slide(b.note + 0.25, b.note + 0.95, r1);
  const len2 = L.note.len2, x2 = L.note.anchor === 'middle' ? L.note.x + len2 / 2 : L.note.x + len2;
  hop(b.note + 1.5, b.note + 2.0, [x2 + 6, L.note.ys[1] - 4]);
  return { segs, yDot };
}
function ConceptDot({ k }) {
  const { T, b, L, ty, bf, amp } = k;
  const { segs, yDot } = dotPath(L, b);
  let p = yDot;
  for (const s of segs) {
    if (T < s.t0) break;
    const u = glide(T, s.t0, s.t1, 0, 1);
    if (s.arc) { const lift = Math.min(160, 0.35 * Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1])); p = bez(s.a, [s.a[0], s.a[1] - lift], [s.b[0], s.b[1] - lift], s.b, u); }
    else p = lerp2(s.a, s.b, u);
  }
  const rowBar = b.rows.map((t) => glide(T, t + 0.05, t + 0.6, 0, 1));
  const st = { bar: { op: 0 }, title: { op: ap(T, b.title, 1.4) }, logo: { op: ap(T, b.logo + 0.7, 1.0) }, rule: { op: 1 }, note: { op: ap(T, b.note + 0.8, 0.9) } };
  b.rows.forEach((t, i) => { st['row' + i] = { op: 1, wipe: glide(T, t + 0.3, t + 1.2, 0, 1) }; });
  const dotIn = hit(T, b.title + 1.0, b.title + 1.5, 0, 1);
  const pulse = 1 + 0.25 * Math.max(0, osc(T, 1.6)) * (1 - glide(T, b.rows[0] - 0.8, b.rows[0] - 0.45, 0, 1)) * dotIn + 0.15 * (1 - glide(T, b.note + 2, b.note + 2.3, 0, 1)) * glide(T, b.note + 2, b.note + 2.15, 0, 1);
  const grid = [];
  for (let x = 0; x <= W; x += 32) grid.push(<line key={'x' + x} x1={x} y1="0" x2={x} y2={H} />);
  for (let y = 12; y <= H; y += 32) grid.push(<line key={'y' + y} x1="0" y1={y} x2={W} y2={y} />);
  return (
    <g>
      <rect x="0" y="0" width={W} height={H} fill={OPEN_BG} />
      <g stroke="#fff" strokeWidth="1" opacity="0.025">{grid}</g>
      <CardArt L={L} ty={ty} k={k} st={st} rowBar={rowBar} logoSlash={false} ruleW={glide(T, b.note + 0.25, b.note + 0.95, 0, 1)} txt={OPEN_TXT} mute="#8a8a88" noteLen2={L.note.len2} uid="h" />
      <Slash L={L.logo} u={glide(T, b.logo + 0.15, b.logo + 0.85, 0, 1)} bf={bf} amp={amp} />
      <circle cx={p[0]} cy={p[1]} r={Math.max(0, 6.5 * pulse + (hash(bf * 2.3 + 99) - 0.5) * amp * 0.4) * dotIn} fill={OPEN_DOT} />
    </g>
  );
}

// ═══ the draft endcard as it is, and a card of the beats ═══
const ConceptDraft = ({ k }) => (
  <g><rect x="0" y="0" width={W} height={H} fill={BG} /><CardArt L={k.L} ty={k.ty} k={k} st={allOn()} uid="x" /></g>
);
function ConceptBeats({ k }) {
  const { T, q } = k;
  const scenes = JSON.parse(window.OM_SCENES || '[]');
  let t = 0;
  return (
    <g fontFamily={FUT}>
      <rect x="0" y="0" width={W} height={H} fill={WEIGHT[1]} />
      <text x="180" y="200" fontSize="56" fontWeight="700" fill={TXT}>End credits · beats</text>
      {scenes.map((s, i) => {
        const a = t; t += s.dur;
        const on = T >= a && T < t;
        return (
          <g key={i} opacity={on ? 1 : 0.45}>
            <text x="180" y={310 + i * 110} fontSize="40" fontWeight="700" fill={on ? GC.cur : TXT}>{s.name}</text>
            <text x="480" y={310 + i * 110} fontSize="28" fill={TXT}>{a.toFixed(2)}–{t.toFixed(2)} s</text>
            <text x="480" y={346 + i * 110} fontSize="22" fill={MUTE}>{s.desc}</text>
          </g>
        );
      })}
      <rect x="180" y="990" width="1560" height="6" fill={WEIGHT[3]} />
      <rect x="180" y="990" width={(1560 * T) / 12} height="6" fill={GC.cur} />
      <text x="1740" y="960" fontSize="32" textAnchor="end" fill={TXT}>{T.toFixed(2)} s · f {Math.round(T * 25)}</text>
    </g>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────
function Frame({ children, label, guide, bg }) {
  return (
    <div data-screen-label={label} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: bg, transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>{children}</svg>
      {guide && <div style={{ position: 'absolute', left: 48, top: 30, font: '600 30px Inter, sans-serif', color: '#fff', textShadow: '0 1px 12px rgba(0,0,0,0.8)' }}>{label}</div>}
      {/* keeps the fonts loading from the first frame */}
      <div style={{ position: 'absolute', left: -9999, top: 0, fontFamily: FUT }}><b>a</b><span style={{ fontWeight: 500 }}>a</span><i style={{ fontWeight: 500 }}>a</i><span style={{ fontFamily: INTER, fontWeight: 300 }}>a<i>a</i></span></div>
    </div>
  );
}
function CreditsPiece({ concept, layoutKey, typeKey, guide, boil, boilAmp }) {
  const { T, CUES } = useComposition();
  const bf = Math.floor(T * 8), amp = boil ? boilAmp : 0;
  const [la, ta] = AUTO[concept] || AUTO.A;
  const ty = typeKey && typeKey !== 'auto' ? typeKey : ta;
  const L = layout(layoutKey && layoutKey !== 'auto' ? layoutKey : la, ty);
  const k = { T, q: CUES, b: beats(CUES), L, ty, bf, amp };
  const body = {
    A: <ConceptBars k={k} />, B: <ConceptLamp k={k} />, C: <ConceptWindows k={k} />, D: <ConceptDevelop k={k} />, E: <ConceptDrift k={k} />,
    F: <ConceptFocus k={k} />, G: <ConceptRamps k={k} />, H: <ConceptDot k={k} />, draft: <ConceptDraft k={k} />, S: <ConceptBeats k={k} />,
  }[concept] || <ConceptBars k={k} />;
  return (
    <Frame label={CONCEPTS[concept] || concept} guide={guide} bg={BG}>
      <LookDefs ramps={['cur']} bf={bf} amp={amp} />
      <defs>
        <GradeFilter id="eMid" ramp="red" blur={2.5} />
        <GradeFilter id="eMid2" ramp="red" blur={6} />
        <GradeFilter id="eNear" ramp="red" blur={18} region={[-600, -400, 3120, 1880]} />
      </defs>
      {body}
    </Frame>
  );
}

function FUCreditsConcepts() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { concept: 'A', layout: 'auto', type: 'auto', referenceOverlay: false, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={BG}>
        <CreditsPiece concept={t.concept} layoutKey={t.layout} typeKey={t.type} guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Concept" />
        <TweakSelect label="Concept" value={t.concept} options={Object.keys(CONCEPTS).map((key) => ({ value: key, label: CONCEPTS[key] }))} onChange={(x) => setTweak('concept', x)} />
        <TweakSelect label="Layout" value={t.layout || 'auto'} options={[{ value: 'auto', label: 'Concept default' }, { value: 'left', label: 'Left (the draft)' }, { value: 'columns', label: 'Columns, centred' }]} onChange={(x) => setTweak('layout', x)} />
        <TweakSelect label="Type" value={t.type || 'auto'} options={[{ value: 'auto', label: 'Concept default' }, { value: 'card', label: 'Futura (the draft)' }, { value: 'title', label: 'Opening title (Inter)' }]} onChange={(x) => setTweak('type', x)} />
        <TweakSection label="Preview" />
        <TweakToggle label="Label" value={t.referenceOverlay} onChange={(x) => setTweak('referenceOverlay', x)} />
        <TweakToggle label="Line boil (8 fps)" value={t.lineBoil} onChange={(x) => setTweak('lineBoil', x)} />
        <TweakSlider label="Boil amplitude" value={t.boilAmp ?? 0.5} min={0} max={3} step={0.1} unit="px" onChange={(x) => setTweak('boilAmp', x)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

window.FUCreditsConcepts = FUCreditsConcepts;
// shared with the credits shot (credits.jsx)
window.FU_CREDITS = { TYPES, Txt, Logo, ROWS, NOTE, beats, ap, brect, OPEN_BG, OPEN_TXT, OPEN_DOT, LOGO_C };
