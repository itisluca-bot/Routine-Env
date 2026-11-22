// Feeding Uncertainty — end credits (12 s). The user chose concept H's look from round 1 (credits-concepts.jsx):
// the opening title's world (near-black, a faint grid, Inter Light in widely spaced caps, the red dot over the Y),
// made simple and clean: the dot sits still over the Y as in the opening, the names are not in the group colours,
// and every line just fades in on its beat. On the right, the funders: NWO (Open Competition SSH-XS) and the RUG
// Faculty of Arts (Impact Grant), each under a label: the first level with the first row's label, the second level with
// the last row's label. The card is centred vertically (equal margins top and bottom) with even gaps between
// blocks; labels and the disclaimer are bold enough to read. No camera move: a push this slow makes the type step from
// pixel to pixel; the rule and the dot boil at 8 fps instead. The logo is off-white (`logo` tweak: `red` for the RUG red).
const { W, H, OUT_W, OUT_H, MOTION, hash } = window.FU_RIG;
const { TYPES, Txt, ROWS, NOTE, beats, ap, brect, OPEN_BG, OPEN_TXT, OPEN_DOT, LOGO_C } = window.FU_CREDITS;
const { glide } = MOTION;
const LABEL = '#a8a8a5', MUTE = '#9a9a97';
const ST = { ...TYPES.title, label: { ...TYPES.title.label, weight: 700 }, note: { ...TYPES.title.note, weight: 400 } };

// the layout: one left column under the title, the funders on the right. Title cap top ~182, disclaimer descenders ~898:
// equal margins; title → first label 130, rows 140 apart, last name → rule 126
const X = 180;
const TITLE = { y: 218, len: 960 };
const LABEL_Y = [348, 488, 628], NAME_Y = LABEL_Y.map((y) => y + 56);
// the funders' column: a label level with a row label on the left, the logo under it. Logos are alpha-only PNGs,
// tinted in the page: assets/rug-arts-logo.png from the user's black-on-white file, and assets/nwo-logo.png, the user's
// NWO logo exactly as given: a white sheet with the emblem and "NWO" cut out (the cuts at the sheet's edges are the
// logo's design), with black behind it so the cut-outs read black.
const FX = 1340;
const FUNDERS = [
  { label: 'NWO OPEN COMPETITION SSH-XS', y: LABEL_Y[0], src: 'assets/nwo-logo.png', w: 125, aspect: 957 / 591, nwo: true },
  { label: 'IMPACT GRANT', y: LABEL_Y[2], src: 'assets/rug-arts-logo.png', w: 220, aspect: 1070 / 1000, rug: true },
];
// an alpha-only logo filled with one colour
const Mark = ({ src, x, y, w, aspect, color, id }) => (
  <g>
    <defs><filter id={id} x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB"><feFlood floodColor={color} /><feComposite in2="SourceAlpha" operator="in" /></filter></defs>
    <image href={src} x={x} y={y} width={w} height={w * aspect} filter={`url(#${id})`} />
  </g>
);
const RULE = { y: 810, w: 300 }, NOTE_Y = [858, 893];
// the dot as in the opening: just right of the Y's right arm, level with the cap height. textLength includes the
// spacing after the last letter (0.5 em), so the Y ends 25 px before X + len
const DOT = { x: X + TITLE.len - 25 + 5, y: TITLE.y - 37, r: 6.2 };

// a line arriving: a fade with a small rise
const Arrive = ({ T, t0, d = 1.0, rise = 8, children }) => {
  const op = ap(T, t0, d);
  return op > 0.001 ? <g opacity={op} transform={`translate(0 ${glide(T, t0, t0 + d + 0.3, rise, 0)})`}>{children}</g> : null;
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
        <g>
          <Arrive T={T} t0={b.title} d={1.4} rise={0}>
            <Txt t="FEEDING UNCERTAINTY" x={X} y={TITLE.y} st={{ ...ST.title, weight: 400 }} fill={OPEN_TXT} len={TITLE.len} />
          </Arrive>
          <circle cx={DOT.x} cy={DOT.y} r={DOT.r + (hash(bf * 2.3 + 99) - 0.5) * amp * 0.3} fill={OPEN_DOT} opacity={ap(T, b.title + 0.9, 0.6)} />
          {ROWS.map((r, i) => (
            <Arrive key={i} T={T} t0={b.rows[i]}>
              <Txt t={r.label} x={X} y={LABEL_Y[i]} st={ST.label} fill={LABEL} />
              <Txt t={r.name} x={X} y={NAME_Y[i]} st={ST.name} fill={OPEN_TXT} />
            </Arrive>
          ))}
          {FUNDERS.map((f, i) => (
            <Arrive key={i} T={T} t0={b.logo + 0.7 * i} d={1.1}>
              <Txt t={f.label} x={FX} y={f.y} st={ST.label} fill={LABEL} />
              {f.nwo && <rect x={FX} y={f.y + 18} width={f.w} height={f.w * f.aspect} fill="#000" />}
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
