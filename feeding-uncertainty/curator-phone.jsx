// Feeding Uncertainty — curators on the phone, first person (9s4f, timing_0.srt). Round 2: concept A (Long press).
// Line: "Unfollowing what hurts, venting when it gets too much. For them, comfort is a way of coping.
//        A feed calibrated not to distress,"
// Beats: Unfollow (long press a red post, unfollow in the menu), Vent (swipe to a chat, type with both thumbs, send; a
// heart on the message, then a reply), Comfort (back to the feed, double-tap a cat), Feed (a warm scroll; a red post that
// slips in is veiled into a hidden-post outline). The room glows with the screen's brightness.
// Every thumb target is within THUMB_REACH of the thumb's root, so the thumb never stretches across the screen.
const W = 1920, H = 1080, OUT_W = 3840, OUT_H = 2160;
const { MOTION, osc, lerp2, knock, cam, hash } = window.FU_RIG;
const { RAMPS, LookDefs, GradeFilter, v, mixRamp } = window.FU_LOOK;
const {
  SW, SH, CARD_H, KB_TOP, track, path2, pressAt, g01, pop, toWorld, PhoneDefs, Phone, Layers, StatusBar, AppBar, HomeBar,
  feedLayout, feedCards, Sheet, sheetRowY, Keyboard, keyPos, ChatHeader, Bubble, Scribble, scribbleLines, ComposeBox, Ripple,
  Heart, HEART, Mitt, THUMB_REACH, thumbRoot,
} = window.FU_PHONE;
const RC = RAMPS.cur;
const SCX = SW / 2;

// ── the room (concept A's bedroom), lit by the screen ──
function Bedroom({ at, glow = 1, r = 700 }) {
  const Glow = ({ c, rr, op }) => <circle cx={c[0]} cy={c[1]} r={rr} fill="url(#cpGlow)" opacity={clamp(op, 0, 1.2)} />;
  return (
    <g>
      <rect x="-400" y="-400" width="2720" height="1880" fill={v(0.12)} />
      <rect x="150" y="90" width="400" height="470" rx="6" fill={v(0.2)} />
      {[0, 1].map((i) => [0, 1].map((j) => <rect key={i + '' + j} x={170 + i * 190} y={110 + j * 220} width="170" height="200" fill={v(0.27)} />))}
      <rect x="1420" y="40" width="380" height="700" fill={v(0.17)} /><rect x="1440" y="60" width="165" height="660" fill={v(0.2)} /><rect x="1615" y="60" width="165" height="660" fill={v(0.2)} />
      <Glow c={at} rr={r} op={glow} />
      <path d="M -400 1480 L -400 980 Q 160 780 640 900 Q 820 760 1000 880 Q 1300 780 1560 900 Q 1900 800 2320 980 L 2320 1480 Z" fill={v(0.28)} />
      <Glow c={[at[0], at[1] + 320]} rr={r * 0.8} op={glow * 0.8} />
    </g>
  );
}

// ── the feed ──
const ITEMS = [
  { id: 'a0', tone: 'info', kind: 'headline' },
  { id: 'a1', tone: 'red', kind: 'avatar', gone: [1.26, 1.62] },
  { id: 'a2', tone: 'warm', kind: 'cat' },
  { id: 'a3', tone: 'warm', kind: 'friends' },
  { id: 'a4', tone: 'info', kind: 'text' },
  { id: 'a5', tone: 'warm', kind: 'sun' },
  { id: 'a6', tone: 'red', kind: 'alert', veilAt: [7.45, 7.8], gone: [8.04, 8.5] },
  { id: 'a7', tone: 'warm', kind: 'cup' },
  { id: 'a8', tone: 'info', kind: 'avatar' },
  { id: 'a9', tone: 'warm', kind: 'plant' },
  { id: 'a10', tone: 'warm', kind: 'bowl' },
  { id: 'a11', tone: 'info', kind: 'headline' },
];
// how bright the screen is (0..1) and how much of it is red, from what is on it
function screenLight(L, sheetOpen) {
  let red = 0;
  L.forEach((it) => {
    if (it.tone !== 'red') return;
    const h = (CARD_H / 2) * it.k, top = Math.max(0, it.cy - h), bot = Math.min(SH, it.cy + h);
    if (bot > top) red += ((bot - top) * 288 * (1 - (it.veil || 0))) / (SW * SH);
  });
  const redness = clamp(red / 0.4, 0, 1);
  return { b: clamp(1 - 0.4 * redness - 0.35 * sheetOpen, 0, 1), redness };
}

// ── typing: taps on keys, each thumb takes its own half of the keyboard. one-thumb typing (variant) only uses the keys
// the right thumb can reach ──
const GRIP_TYPE = 0.8;
const reachable = (p, side) => { const r = thumbRoot(GRIP_TYPE), q = side > 0 ? r : [SW - r[0], r[1]]; return Math.hypot(p[0] - q[0], p[1] - q[1]) <= THUMB_REACH; };
function typeRun(T, t0, t1, dt, seed, oneThumb) {
  const keys = [];
  [10, 9, 7].forEach((n, row) => { for (let col = 0; col < n; col++) keys.push([row, col]); });
  keys.push([3, 0]);
  const pool = oneThumb ? keys.filter((k) => reachable(keyPos(k[0], k[1]), 1)) : keys;
  const taps = [];
  for (let t = t0, n = 0; t < t1; t += dt, n++) {
    const kk = pool[Math.floor(hash(n * 5.1 + seed * 3) * pool.length)];
    const p = keyPos(kk[0], kk[1]);
    taps.push({ t, row: kk[0], col: kk[1], p, side: oneThumb || p[0] >= SCX ? 'R' : 'L' });
  }
  const tipOf = (s) => {
    const mine = taps.filter((tp) => tp.side === s);
    if (!mine.length) return null;
    const prev = [...mine].reverse().find((tp) => tp.t <= T) || mine[0], next = mine.find((tp) => tp.t > T) || prev;
    const u = next === prev ? 0 : Easing.easeInOutSine(clamp(((T - prev.t) / (next.t - prev.t) - 0.4) / 0.6, 0, 1));
    return lerp2(prev.p, next.p, u);
  };
  const count = taps.filter((tp) => tp.t <= T).length;
  return { L: tipOf('L'), R: tipOf('R'), count, total: taps.length, pressed: taps.filter((tp) => T >= tp.t && T < tp.t + 0.07).map((tp) => [tp.row, tp.col]) };
}

// ── the chat: the message typed in the box is the message sent (same scribble, same lines) ──
const MSG_LEN = 560, MSG_W = 230, MSG_SEED = 7;
const SEND_T = 3.32, HEART_T = 3.5, REPLY_T = 3.68;
function Chat({ T, ty }) {
  const typed = T < SEND_T ? (MSG_LEN * ty.count) / ty.total : 0;
  const boxH = 44 + (scribbleLines(typed || 1, MSG_W) - 1) * 22, boxTop = KB_TOP - 14 - boxH;
  const lines = scribbleLines(MSG_LEN, MSG_W), sentH = 22 + lines * 22, sentW = MSG_W + 36;
  const sa = pop(T, SEND_T, 0.32), ra = pop(T, REPLY_T, 0.3);
  // stack up from the compose box: reply, the sent message, then the earlier messages
  let y = boxTop - 12;
  const replyY = (y -= (44 + 12) * ra);
  const sentY = (y -= (sentH + 12) * (T >= SEND_T ? 1 : 0));
  const earlier = [{ side: 'l', n: 2, w: 230 }, { side: 'r', n: 1, w: 140 }, { side: 'l', n: 1, w: 170 }].map((m, i) => {
    y -= 18 + m.n * 20 + 12;
    return <Bubble key={i} x={m.side === 'r' ? SW - 16 : 16} y={y} w={m.w} n={m.n} side={m.side} seed={i * 7 + 3} />;
  });
  // the sent bubble rises out of the compose box into its place
  const fromY = KB_TOP - 14 - sentH, sy = fromY + (sentY - fromY) * sa, sx = 14 + (SW - 16 - sentW - 14) * sa;
  const hs = pop(T, HEART_T, 0.25);
  return (
    <g>
      <rect width={SW} height={SH} fill={v(0.95)} /><ChatHeader />
      {earlier}
      {T >= SEND_T && (
        <g>
          <rect x={sx} y={sy} width={sentW} height={sentH} rx="18" fill={v(0.5)} />
          <Scribble x={sx + 18} y={sy + 22} len={MSG_LEN} w={MSG_W} seed={MSG_SEED} val={0.95} />
          {hs > 0 && <g transform={`translate(${sx + 6} ${sy + sentH - 2}) scale(${hs})`}><circle r="15" fill={v(0.97)} /><path d={HEART} transform="scale(0.9)" fill={v(0.42)} /></g>}
        </g>
      )}
      {ra > 0 && <Bubble x={16} y={replyY} w={150} n={1} side="l" s={0.6 + 0.4 * ra} op={ra} seed={41} />}
      <ComposeBox len={typed} w={MSG_W} seed={MSG_SEED} />
      <Keyboard pressed={ty.pressed} />
    </g>
  );
}

function Shot({ k, oneThumb }) {
  const { T, bf, amp } = k;
  const P = { x: 960 + 6 * osc(T, 4.1), y: 560 + 5 * osc(T, 3.3, 0.2), s: 1.1, rot: -3 + 1.2 * osc(T, 5.2) + 2.2 * knock(T, SEND_T + 0.02) };
  // feed ↔ chat: the feed follows the thumb's swipe
  const sw = g01(T, 1.84, 2.08) - g01(T, 3.84, 4.1);
  const scroll = track(T, [[0, -60], [0.42, 126, 'hit'], [5.3, 126], [5.75, 524, 'hit'], [5.95, 524], [6.4, 922, 'hit'], [8.9, 1935]]);
  const L = feedLayout(ITEMS, scroll, T), fc = feedCards(L, { dots: true });
  const open = Easing.easeOutCubic(clamp((T - 0.7) / 0.3, 0, 1)) - g01(T, 1.2, 1.4);   // the menu slides up, no snap
  const ty = typeRun(T, 2.22, 3.18, 0.075, 4, oneThumb);
  const grip = 0.72 + (GRIP_TYPE - 0.72) * (g01(T, 1.96, 2.2) - g01(T, 3.42, 3.7));
  const twoIn = oneThumb ? 0 : g01(T, 1.9, 2.2) - g01(T, 3.42, 3.75);

  // the right thumb: every key is within reach of its root
  const RP = [300, 640], LP = [270, 560], UNF = [270, sheetRowY(1, 1)], SEND = [SW - 34, KB_TOP - 36], DT = [260, 600];
  const tip = path2(T, [
    [0, RP], [0.12, RP], [0.4, LP], [0.76, LP], [1.0, UNF], [1.14, UNF], [1.4, RP], [1.66, [350, 470]], [1.84, [350, 470]], [2.08, [190, 470]],
    [2.22, () => ty.R || RP], [3.18, () => ty.R || RP], [3.3, SEND], [3.4, SEND], [3.6, RP], [3.8, [220, 440]], [3.84, [220, 440]], [4.1, [350, 440]],
    [4.6, [270, 640]], [4.82, DT], [4.9, [266, 585]], [4.98, DT], [5.12, [300, 660]], [5.3, [300, 660]], [5.5, [300, 400]], [5.7, [300, 660]],
    [5.95, [300, 660]], [6.15, [300, 400]], [6.5, [300, 660]], [7.4, [300, 420]], [7.55, [300, 660]], [8.4, [300, 430]], [8.8, RP],
  ]);
  const tipL = path2(T, [[0, [SW - 300, 640]], [2.08, [SW - 300, 640]], [2.22, () => ty.L || [SW - 300, 640]], [3.18, () => ty.L || [SW - 300, 640]], [3.4, [SW - 300, 640]]]);
  const press = Math.max(pressAt(T, [1.08, SEND_T, 4.84, 4.98]), bump(T, 0.44, 0.76), ty.pressed.length ? 1 : 0);
  const hold = g01(T, 0.44, 0.74) * (1 - g01(T, 0.74, 0.8));   // long-press ring under the thumb

  const { b, redness } = screenLight(L, Math.max(0, open));
  const fx = `translate(${(-SW * sw).toFixed(1)} 0)`;
  const cur = (
    <g>
      <g transform={fx}><rect width={SW} height={SH} fill={v(0.95)} />{fc.cur}</g>
      <g transform={`translate(${(SW * (1 - sw)).toFixed(1)} 0)`}><Chat T={T} ty={ty} /></g>
    </g>
  );
  const red = <g transform={fx}>{fc.red}</g>;
  // the double-tap heart pops where the thumb tapped (beside the cat's face, not on it) and floats up as it fades;
  // a darker tone with a light rim, so it reads against both the photo and the card
  // it rides on the cat's card (so it scrolls with it) and is gone before the feed moves on
  const cat = L[2], hs = 3.2 * pop(T, 4.98, 0.28), hop = 1 - g01(T, 5.18, 5.42);
  const hy = cat.cy + (DT[1] - 565) - 20 - 60 * MOTION.glide(T, 4.98, 5.42, 0, 1);
  const over = (
    <g>
      <g transform={fx}><AppBar /></g>
      <Sheet open={Math.max(0, open)} rows={['mute', 'unfollow', 'hide', 'report']} hl={T > 0.98 ? 1 : -1} press={pressAt(T, [1.08])} />
      <StatusBar /><HomeBar />
      {hold > 0 && <circle cx={LP[0]} cy={LP[1]} r={20 + 36 * hold} fill={v(0.2)} opacity={0.3 * hold} />}
      <Ripple p={UNF} T={T} t0={1.08} /><Ripple p={SEND} T={T} t0={SEND_T} val={0.9} />
      {hs > 0.01 && hop > 0 && <Heart x={DT[0]} y={hy} s={hs} op={hop} val={0.36} rim={0.97} />}
    </g>
  );
  const tipW = toWorld(P, tip), tipLW = toWorld(P, tipL);
  const leftIn = `translate(0 ${(520 * (1 - twoIn)).toFixed(1)})`;
  const roomRamp = mixRamp('cur', 'red', 0.2 * redness), handRamp = mixRamp('cur', 'red', 0.22 * redness);
  return (
    <g transform={cam(960, 548, 1 + 0.05 * g01(T, 0, 9.16))}>
      <PhoneDefs light={[P.x, P.y]} reach={640 + 140 * b} handRamp={handRamp} bf={bf} amp={amp} />
      <defs>
        <GradeFilter id="cpRoom" ramp={roomRamp} blur={20} />
        <radialGradient id="cpGlow"><stop offset="0" stopColor="#fff" stopOpacity="0.6" /><stop offset="0.5" stopColor="#fff" stopOpacity="0.2" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      </defs>
      <g filter="url(#cpRoom)"><Bedroom at={[P.x, P.y]} glow={0.5 + 0.5 * b} r={590 + 130 * b} /></g>
      <g filter="url(#phTone)">
        <Mitt P={P} tip={tipW} layer="back" grip={grip} />
        {twoIn > 0 && <g transform={leftIn}><Mitt P={P} tip={tipLW} side={-1} layer="back" grip={GRIP_TYPE} /></g>}
      </g>
      <Phone P={P} id="cp"><Layers cur={cur} red={red} over={over} /></Phone>
      <g filter="url(#phToneF)">
        <Mitt P={P} tip={tipW} layer="front" press={press} grip={grip} fingers={1 - twoIn} />
        {twoIn > 0 && <g transform={leftIn}><Mitt P={P} tip={tipLW} side={-1} layer="front" grip={GRIP_TYPE} fingers={0} /></g>}
      </g>
    </g>
  );
}
const bump = (T, a, b, d = 0.06) => g01(T, a - d, a) * (1 - g01(T, b, b + d));

function Piece({ variant, guide, boil, boilAmp }) {
  const { T, CUES } = useComposition();
  const q = { U: CUES.Unfollow, V: CUES.Vent, C: CUES.Comfort, F: CUES.Feed, E: CUES.Hold };
  const items = [
    { at: q.U + 0.52, until: q.V, text: 'Unfollowing what hurts,' },
    { at: q.V + 0.28, until: q.C, text: 'venting when it gets too much.' },
    { at: q.C + 0.36, until: q.F, text: 'For them, comfort is a way of coping.' },
    { at: q.F + 0.2, until: q.E + 0.24, text: 'A feed calibrated not to distress,' },
  ];
  const bf = Math.floor(T * 8), amp = boil ? boilAmp : 0;
  return (
    <div data-screen-label={`Curator phone · ${T.toFixed(1)}s`} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: RC[0], transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <LookDefs ramps={['cur']} bf={bf} amp={amp} />
        <rect width={W} height={H} fill={RC[0]} />
        <Shot k={{ T, bf, amp }} oneThumb={variant === 'one'} />
      </svg>
      {guide && <Captions items={items} style={{ font: '500 40px "Open Sans", sans-serif', bottom: '5%', textShadow: '0 1px 14px rgba(0,0,0,0.8)' }} />}
    </div>
  );
}

function FUCuratorPhone() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { variant: 'two', referenceOverlay: true, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={RC[0]}>
        <Piece variant={t.variant} guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Shot" />
        <TweakSelect label="Typing" value={t.variant} options={[{ value: 'two', label: 'Two thumbs (left hand comes in)' }, { value: 'one', label: 'One thumb, keys in reach' }]} onChange={(val) => setTweak('variant', val)} />
        <TweakSection label="Preview" />
        <TweakToggle label="Narration guide" value={t.referenceOverlay} onChange={(val) => setTweak('referenceOverlay', val)} />
        <TweakToggle label="Line boil (8 fps)" value={t.lineBoil} onChange={(val) => setTweak('lineBoil', val)} />
        <TweakSlider label="Boil amplitude" value={t.boilAmp ?? 0.5} min={0} max={3} step={0.1} unit="px" onChange={(val) => setTweak('boilAmp', val)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

window.FUCuratorPhone = FUCuratorPhone;
