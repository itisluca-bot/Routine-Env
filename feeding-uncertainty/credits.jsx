// Feeding Uncertainty — end credits (12 s). The user chose concept H's look from round 1 (credits-concepts.jsx):
// the opening title's world (near-black, a faint grid, Inter Light in widely spaced caps, the red dot over the Y),
// made simple and clean: the dot sits still over the Y as in the opening, the names are not in the group colours,
// and every line just fades in on its beat: the three names together, the disclaimer right after them, the logos at 5 s. On the right, the funders: NWO (Open Competition SSH-XS) and the RUG
// Faculty of Arts (Impact Grant), each under a label: the first level with the first row's label; the second placed so
// the logo's "faculty of arts" line sits on the disclaimer's last line. The card is centred vertically (equal margins top and bottom) with even gaps between
// blocks; labels and the disclaimer are bold enough to read. No camera move: a push this slow makes the type step from
// pixel to pixel; the rule and the dot boil at 8 fps instead. The logo is off-white (`logo` tweak: `red` for the RUG red).
const { W, H, OUT_W, OUT_H, MOTION, hash } = window.FU_RIG;
const { TYPES, Txt, ROWS, NOTE, beats, ap, brect, OPEN_BG, OPEN_TXT, LOGO_C } = window.FU_CREDITS;
const { glide } = MOTION;
const LABEL = '#a8a8a5', MUTE = '#9a9a97';
const ST = { ...TYPES.title, label: { ...TYPES.title.label, weight: 700 }, note: { ...TYPES.title.note, weight: 400 } };

// the layout: one left column under the title, the funders on the right. Title cap top ~164, disclaimer descenders ~945;
// title → first label 145, rows 165 apart, last name → rule 126
const X = 180;
const TITLE = { y: 200, len: 960 };
const LABEL_Y = [345, 510, 675], NAME_Y = LABEL_Y.map((y) => y + 56);
// the funders' column: a label level with a row label on the left, the logo under it. Logos are alpha-only PNGs,
// tinted in the page: assets/rug-arts-logo.png from the user's black-on-white file, and assets/nwo-logo.png, the user's
// NWO logo exactly as given: a white sheet with the emblem and "NWO" cut out (the cuts at the sheet's edges are the
// logo's design); its cut-outs show the dark red behind it.
const RULE = { y: 857, w: 300 }, NOTE_Y = [905, 940];
const FX = 1340;
const ARTS_W = 250, ARTS_BASE = 1049 / 1000;   // the "faculty of arts" baseline, in logo widths from its top
const FUNDERS = [
  { label: 'NWO OPEN COMPETITION SSH-XS', y: LABEL_Y[0], src: 'assets/nwo-logo.png', w: 145, aspect: 957 / 591, nwo: true },
  { label: 'IMPACT GRANT', y: NOTE_Y[1] - ARTS_BASE * ARTS_W - 18, src: 'assets/rug-arts-logo.png', w: ARTS_W, aspect: 1070 / 1000, rug: true },
];
// an alpha-only logo filled with one colour
const Mark = ({ src, x, y, w, aspect, color, id }) => (
  <g>
    <defs><filter id={id} x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB"><feFlood floodColor={color} /><feComposite in2="SourceAlpha" operator="in" /></filter></defs>
    <image href={src} x={x} y={y} width={w} height={w * aspect} filter={`url(#${id})`} />
  </g>
);
// the dot as in the opening: just right of the Y's right arm, level with the cap height. textLength includes the
// spacing after the last letter (0.5 em), so the Y ends 25 px before X + len
const DOT = { x: X + TITLE.len - 25 + 5, y: TITLE.y - 37, r: 6.2 };

// the red on the right (the user's sketch): filled, in two shades of the film's crisis red. The edge is a cubic from
// the bottom up to the right edge near the top; the funders sit on the darker inner band so the white reads. Both edges
// carry a slow travelling wave and the 8 fps boil, and slide in from the right at the start. The dot is in the same red
// family, a step lighter so it reads on the near-black
const RED = { outer: '#a32e11', inner: '#6e1d0c', dot: '#d03c1e', label: '#efc3b0' };   // label: the funders' labels, on the red
// nearly upright from the bottom (no empty red corner bottom left), then over the top, lifted so the dark band clears
// the funders' column (labels and logos) with a margin
const EDGE = [[1000, 1110], [950, 560], [930, 0], [1990, -20]];
const EDGE_PTS = (() => {
  const pts = [];
  for (let i = 0; i <= 120; i++) {
    const u = i / 120, v = 1 - u;
    const p = [0, 1].map((k) => v * v * v * EDGE[0][k] + 3 * v * v * u * EDGE[1][k] + 3 * v * u * u * EDGE[2][k] + u * u * u * EDGE[3][k]);
    const d = [0, 1].map((k) => 3 * v * v * (EDGE[1][k] - EDGE[0][k]) + 6 * v * u * (EDGE[2][k] - EDGE[1][k]) + 3 * u * u * (EDGE[3][k] - EDGE[2][k]));
    const l = Math.hypot(d[0], d[1]);
    pts.push({ p, n: [-d[1] / l, d[0] / l] });   // n points into the red
  }
  let s = 0;
  pts.forEach((q, i) => { if (i) s += Math.hypot(q.p[0] - pts[i - 1].p[0], q.p[1] - pts[i - 1].p[1]); q.s = s; });
  return pts;
})();
// one edge of the red: the base curve pushed `inset` into the red, a wave along it, the boil, slid right by `dx`
function redShape(T, { inset, dx, amp, len, speed, ph, bf, boil, id }) {
  const b1 = 6.283 * hash(bf * 1.7 + id), b2 = 6.283 * hash(bf * 2.9 + id * 3);
  const edge = EDGE_PTS.map(({ p, n, s }) => {
    const w = inset + amp * Math.sin((s / len - T * speed + ph) * 6.283) + boil * (0.6 * Math.sin(s / 90 + b1) + 0.4 * Math.sin(s / 37 + b2));
    return [p[0] + n[0] * w + dx, p[1] + n[1] * w];
  });
  return 'M ' + edge.map((q) => q[0].toFixed(2) + ' ' + q[1].toFixed(2)).join(' L ') + ` L ${2100 + dx} 120 L ${2100 + dx} 1200 L ${edge[0][0].toFixed(2)} 1200 Z`;
}

// a line arriving: a fade with a small rise. Chromium draws upright type snapped to whole pixels, so a slow rise moves
// in one-pixel jumps every few frames (jitter). Turned by 0.05° (the smallest angle that switches it to sub-pixel
// outlines), the type glides; pivoting on the block's own left edge (`px`), the tilt is under a pixel across a line
const Arrive = ({ T, t0, d = 1.0, rise = 8, px = X, children }) => {
  const op = ap(T, t0, d);
  return op > 0.001 ? <g opacity={op} transform={`translate(0 ${glide(T, t0, t0 + d + 0.3, rise, 0)}) rotate(0.05 ${px} 540)`}>{children}</g> : null;
};

function CreditsPiece({ guide, boil, boilAmp, logo }) {
  const { T, CUES } = useComposition();
  const bf = Math.floor(T * 8), amp = boil ? boilAmp : 0;
  const b = beats(CUES);
  const grid = [];
  for (let x = 0; x <= W; x += 32) grid.push(<line key={'x' + x} x1={x} y1="0" x2={x} y2={H} />);
  for (let y = 12; y <= H; y += 32) grid.push(<line key={'y' + y} x1="0" y1={y} x2={W} y2={y} />);
  return (
    <div data-screen-label="Credits" style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: OPEN_BG, transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <g stroke="#fff" strokeWidth="1" opacity={0.025 * ap(T, 0, 1.0)}>{grid}</g>
        <path d={redShape(T, { inset: 0, dx: glide(T, 0.1, 1.9, 1500, 0), amp: 9, len: 520, speed: 0.07, ph: 0, bf, boil: amp, id: 1 })} fill={RED.outer} />
        <path d={redShape(T, { inset: 92, dx: glide(T, 0.3, 2.1, 1500, 0), amp: 12, len: 610, speed: 0.055, ph: 0.4, bf, boil: amp, id: 2 })} fill={RED.inner} />
        <g>
          <Arrive T={T} t0={b.title} d={1.4} rise={0}>
            <Txt t="FEEDING UNCERTAINTY" x={X} y={TITLE.y} st={{ ...ST.title, weight: 400 }} fill={OPEN_TXT} len={TITLE.len} />
          </Arrive>
          <circle cx={DOT.x} cy={DOT.y} r={DOT.r + (hash(bf * 2.3 + 99) - 0.5) * amp * 0.3} fill={RED.dot} opacity={ap(T, b.title + 0.9, 0.6)} />
          {ROWS.map((r, i) => (
            <Arrive key={i} T={T} t0={b.rows[0]}>
              <Txt t={r.label} x={X} y={LABEL_Y[i]} st={ST.label} fill={LABEL} />
              <Txt t={r.name} x={X} y={NAME_Y[i]} st={ST.name} fill={OPEN_TXT} />
            </Arrive>
          ))}
          {FUNDERS.map((f, i) => (
            <Arrive key={i} T={T} t0={CUES.Logo + 0.7 * i} d={1.1} px={FX}>
              <Txt t={f.label} x={FX} y={f.y} st={ST.label} fill={RED.label} />
              <Mark src={f.src} x={FX} y={f.y + 18} w={f.w} aspect={f.aspect} color={f.rug && logo === 'red' ? LOGO_C : OPEN_TXT} id={'crMark' + i} />
            </Arrive>
          ))}
          <Arrive T={T} t0={b.note} rise={0}>
            <path d={brect(X, RULE.y - 0.75, RULE.w, 1.5, bf, 30, amp * 0.4)} fill={MUTE} />
          </Arrive>
          <Arrive T={T} t0={b.note + 0.3} rise={6}>
            {NOTE.map((t, i) => <Txt key={i} t={t + (i === 1 ? '.' : '')} x={X} y={NOTE_Y[i]} st={ST.note} fill={MUTE} />)}
          </Arrive>
        </g>
      </svg>
      {guide && <div style={{ position: 'absolute', left: 48, top: 30, font: '600 30px Inter, sans-serif', color: '#fff', textShadow: '0 1px 12px rgba(0,0,0,0.8)' }}>Credits · logo {logo}</div>}
      {/* keeps the font loading from the first frame */}
      <div style={{ position: 'absolute', left: -9999, top: 0, fontFamily: 'Inter', fontWeight: 300 }}>a<i>a</i><i style={{ fontWeight: 400 }}>a</i><b style={{ fontWeight: 700 }}>a</b></div>
    </div>
  );
}

function FUCredits() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { logo: 'white', referenceOverlay: false, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={OPEN_BG}>
        <CreditsPiece logo={t.logo} guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Credits" />
        <TweakRadio label="Logo" value={t.logo} options={[{ value: 'white', label: 'Off-white' }, { value: 'red', label: 'RUG red (Faculty of Arts logo)' }]} onChange={(x) => setTweak('logo', x)} />
        <TweakSection label="Preview" />
        <TweakToggle label="Label" value={t.referenceOverlay} onChange={(x) => setTweak('referenceOverlay', x)} />
        <TweakToggle label="Line boil (8 fps)" value={t.lineBoil} onChange={(x) => setTweak('lineBoil', x)} />
        <TweakSlider label="Boil amplitude" value={t.boilAmp ?? 0.5} min={0} max={3} step={0.1} unit="px" onChange={(x) => setTweak('boilAmp', x)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

window.FUCredits = FUCredits;
