// Feeding Uncertainty — end credits (12 s). The user chose concept H's look from round 1 (credits-concepts.jsx):
// the opening title's world (near-black, a faint grid, Inter Light in widely spaced caps, the red dot over the Y),
// made simple and clean: the dot sits still over the Y as in the opening, the names are not in the group colours,
// and every line just fades in on its beat. No camera move: a push this slow makes the type step from pixel to
// pixel; the rule and the dot boil at 8 fps instead. The logo is off-white (`logo` tweak: `red` for the RUG red).
const { W, H, OUT_W, OUT_H, MOTION, hash } = window.FU_RIG;
const { TYPES, Txt, Logo, ROWS, NOTE, beats, ap, brect, OPEN_BG, OPEN_TXT, OPEN_DOT, LOGO_C } = window.FU_CREDITS;
const { glide } = MOTION;
const LABEL = '#8a8a88', MUTE = '#7c7c7a';
const ST = TYPES.title;

// the layout: one left column under the title, the logo on the right, centred on the names
const X = 180;
const TITLE = { y: 324, len: 960 };
const ROW_Y = [0, 1, 2].map((i) => 415 + 135 * i);   // label baseline +26, name baseline +82
const LOGO = { x: W - 180 - 380, y: 421, w: 380 };
const RULE = { y: 890, w: 300 }, NOTE_Y = [939, 974];
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
              <Txt t={r.label} x={X} y={ROW_Y[i] + 26} st={ST.label} fill={LABEL} />
              <Txt t={r.name} x={X} y={ROW_Y[i] + 82} st={ST.name} fill={OPEN_TXT} />
            </Arrive>
          ))}
          <Arrive T={T} t0={b.logo} d={1.2} rise={0}>
            <Logo L={LOGO} color={logo === 'red' ? LOGO_C : OPEN_TXT} id="crLogo" />
          </Arrive>
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
      <div style={{ position: 'absolute', left: -9999, top: 0, fontFamily: 'Inter', fontWeight: 300 }}>a<i>a</i><b style={{ fontWeight: 500 }}>a</b></div>
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
        <TweakRadio label="Logo" value={t.logo} options={[{ value: 'white', label: 'Off-white' }, { value: 'red', label: 'RUG red' }]} onChange={(x) => setTweak('logo', x)} />
        <TweakSection label="Preview" />
        <TweakToggle label="Label" value={t.referenceOverlay} onChange={(x) => setTweak('referenceOverlay', x)} />
        <TweakToggle label="Line boil (8 fps)" value={t.lineBoil} onChange={(x) => setTweak('lineBoil', x)} />
        <TweakSlider label="Boil amplitude" value={t.boilAmp ?? 0.5} min={0} max={3} step={0.1} unit="px" onChange={(x) => setTweak('boilAmp', x)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

window.FUCredits = FUCredits;
