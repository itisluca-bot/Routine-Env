// Feeding Uncertainty — curators, first person on the phone (9s4f). Ideation roughs: eight concepts on the same four
// beats (Unfollow, Vent, Comfort, Feed), so a beat can be swapped between concepts, plus a sheet of hand options.
// Line: "Unfollowing what hurts, venting when it gets too much. For them, comfort is a way of coping.
//        A feed calibrated not to distress," (timing_0.srt; "but a space that feels safe…" belongs to the next shot).
const W = 1920, H = 1080, OUT_W = 3840, OUT_H = 2160;
const { MOTION, osc, lerp, lerp2, knock, cam, hash } = window.FU_RIG;
const { RAMPS, LookDefs, GradeFilter, PostValue, POST_KINDS, v, mixRamp } = window.FU_LOOK;
const {
  SW, SH, CS, CARD_H, PITCH, FEED_TOP, KB_TOP, track, path2, pressAt, g01, pop, toWorld, PhoneDefs, Phone, Layers,
  StatusBar, AppBar, HomeBar, bar, WarmPost, feedLayout, feedCards, Icon, Sheet, sheetRowY, Keyboard, keyPos, typing,
  Bubble, ChatColumn, ChatHeader, Compose, Ripple, Heart, Mitt, Stumps,
} = window.FU_PHONE;
const RC = RAMPS.cur;
const SCX = SW / 2, SCY = SH / 2;
const bump = (T, a, b, d = 0.12) => g01(T, a - d, a) * (1 - g01(T, b, b + d));
const sway = (T, s = 1) => ({ dx: 6 * s * osc(T, 4.1), dy: 5 * s * osc(T, 3.3, 0.2), dr: 1.2 * s * osc(T, 5.2) });

// ═══ rooms: value art, drawn inside fuGradeBg-cur (out of focus, in the ramp) ═══
function RoomDefs() {
  return (
    <defs>
      <radialGradient id="roomGlow"><stop offset="0" stopColor="#fff" stopOpacity="0.6" /><stop offset="0.5" stopColor="#fff" stopOpacity="0.2" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
    </defs>
  );
}
const Glow = ({ at, r, op = 1 }) => <circle cx={at[0]} cy={at[1]} r={r} fill="url(#roomGlow)" opacity={clamp(op, 0, 1.4)} />;
function Bedroom({ at, glow = 1, r = 700, win = true }) {
  return (
    <g>
      <rect x="-1400" y="-1400" width="4720" height="3880" fill={v(0.12)} />
      {win && <g><rect x="150" y="90" width="400" height="470" rx="6" fill={v(0.2)} />{[0, 1].map((i) => [0, 1].map((j) => <rect key={i + '' + j} x={170 + i * 190} y={110 + j * 220} width="170" height="200" fill={v(0.27)} />))}</g>}
      <rect x="1420" y="40" width="380" height="700" fill={v(0.17)} /><rect x="1440" y="60" width="165" height="660" fill={v(0.2)} /><rect x="1615" y="60" width="165" height="660" fill={v(0.2)} />
      <Glow at={at} r={r} op={glow} />
      <path d="M -1400 2400 L -1400 980 Q 160 780 640 900 Q 820 760 1000 880 Q 1300 780 1560 900 Q 1900 800 3300 980 L 3300 2400 Z" fill={v(0.28)} />
      <Glow at={[at[0], at[1] + 320]} r={r * 0.8} op={glow * 0.8} />
    </g>
  );
}
function Livingroom({ at, glow = 1, r = 700 }) {
  return (
    <g>
      <rect x="-400" y="-400" width="2720" height="1880" fill={v(0.14)} />
      <rect x="110" y="290" width="540" height="310" rx="8" fill={v(0.07)} /><rect x="350" y="600" width="60" height="90" fill={v(0.1)} />
      <rect x="1170" y="220" width="330" height="16" fill={v(0.24)} />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={1185 + i * 26 + (i > 3 ? 30 : 0)} y={150 + (i % 3) * 8} width="20" height={70 - (i % 3) * 8} fill={v(0.2 + 0.03 * (i % 3))} />)}
      <line x1="1650" y1="140" x2="1650" y2="900" stroke={v(0.22)} strokeWidth="10" /><path d="M 1570 140 L 1730 140 L 1700 40 L 1600 40 Z" fill={v(0.25)} />
      <Glow at={at} r={r} op={glow} />
      <path d="M -400 1480 L -400 700 Q -100 620 260 720 Q 380 760 360 1480 Z" fill={v(0.26)} />
      <path d="M 1500 1480 Q 1520 840 1760 800 Q 2100 760 2320 860 L 2320 1480 Z" fill={v(0.3)} />
    </g>
  );
}
function BusRide({ T, at, glow = 1 }) {
  return (
    <g>
      <rect x="-1400" y="-1400" width="4720" height="3880" fill={v(0.1)} />
      <rect x="-1400" y="110" width="4720" height="470" fill={v(0.17)} />
      {Array.from({ length: 9 }, (_, i) => { const x = ((((i * 430 - T * 760) % 3870) + 3870) % 3870) - 1000; return <g key={i}><ellipse cx={x + 70} cy={200 + 30 * (i % 2)} rx="140" ry="16" fill={v(0.4)} /><circle cx={x} cy={200 + 30 * (i % 2)} r="24" fill={v(0.85)} /></g>; })}
      {[-700, 0, 700, 1400, 2100].map((x) => <rect key={x} x={x + 260} y="100" width="70" height="490" fill={v(0.08)} />)}
      <Glow at={at} r={760} op={glow} />
      <rect x="240" y="760" width="1440" height="900" rx="90" fill={v(0.24)} />
      <rect x="1600" y="-1400" width="38" height="3900" fill={v(0.34)} />
    </g>
  );
}

// ═══ A · Long press — close, one hand. "…" menu → unfollow; types a vent in a chat; a cat and a heart; the feed
// scrolls warm and the one red post that slips in is hidden by the feed itself. Also drives G's screen. ═══
const A_ITEMS = [
  { id: 'a0', tone: 'info', kind: 'headline' },
  { id: 'a1', tone: 'red', kind: 'avatar', gone: [1.24, 1.62] },
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
function longPress(T) {
  const sw = g01(T, 1.84, 2.1) - g01(T, 3.86, 4.12);
  const scroll = track(T, [[0, 120], [0.45, 311, 'hit'], [5.3, 311], [5.75, 709, 'hit'], [5.95, 709], [6.4, 1107, 'hit'], [8.9, 2120]]);
  const fc = feedCards(feedLayout(A_ITEMS, scroll, T), { dots: true });
  const DOTS = [268, 215], UNF = [120, sheetRowY(1, 0)], RP = [292, 600], SEND = [SW - 34, KB_TOP - 36], CAT = [180, 380];
  const open = MOTION.hit(T, 0.64, 0.92, 0, 1) - g01(T, 1.16, 1.36);
  const ty = typing(T, 2.22, 3.18, 0.08, 4);
  const tip = path2(T, [
    [0, RP], [0.34, RP], [0.58, DOTS], [0.76, [250, 330]], [1.02, UNF], [1.32, RP], [1.62, [250, SH - 16]], [1.84, [250, SH - 16]], [2.08, [90, SH - 16]],
    [2.22, () => ty.tip], [3.18, () => ty.tip], [3.3, SEND], [3.44, SEND], [3.64, [292, 640]], [3.82, [90, SH - 16]], [4.1, [270, SH - 16]],
    [4.5, [190, 400]], [4.84, CAT], [4.91, [186, 368]], [4.98, CAT], [5.12, [250, 640]], [5.3, [250, 640]], [5.5, [250, 380]], [5.7, [250, 640]],
    [5.95, [250, 640]], [6.15, [250, 380]], [6.5, [300, 660]], [7.4, [300, 420]], [7.55, [300, 660]], [8.4, [300, 430]], [8.8, RP],
  ]);
  const taps = [0.6, 1.06, 3.32, 4.86, 4.98];
  const press = Math.max(pressAt(T, taps), ty.pressed.length ? 1 : 0);
  const msgs = [{ side: 'l', n: 1, w: 170 }, { side: 'r', n: 1, w: 140 }, { side: 'l', n: 2, w: 230 }, { side: 'r', n: 4, w: 280, t: 3.34, jag: true }, { side: 'l', n: 1, w: 130, t: 3.7 }];
  const fx = `translate(${(-SW * sw).toFixed(1)} 0)`;
  const cur = (
    <g>
      <g transform={fx}><rect width={SW} height={SH} fill={v(0.95)} />{fc.cur}</g>
      <g transform={`translate(${(SW * (1 - sw)).toFixed(1)} 0)`}>
        <rect width={SW} height={SH} fill={v(0.95)} /><ChatHeader />
        <ChatColumn T={T} msgs={msgs} bottom={KB_TOP - 72} />
        <Compose fill={T < 3.34 ? ty.count / ty.total : 0} jag={1} /><Keyboard pressed={ty.pressed} />
      </g>
    </g>
  );
  const red = <g transform={fx}>{fc.red}</g>;
  const hs = 2.6 * pop(T, 4.98, 0.3), hop = 1 - g01(T, 5.4, 5.7);
  const over = (
    <g>
      <g transform={fx}><AppBar /></g>
      <Sheet open={open} hl={T > 0.98 ? 0 : -1} press={pressAt(T, [1.06])} />
      <StatusBar /><HomeBar />
      <Ripple p={DOTS} T={T} t0={0.6} /><Ripple p={UNF} T={T} t0={1.06} /><Ripple p={SEND} T={T} t0={3.32} val={0.9} />
      {hs > 0.01 && hop > 0 && <Heart x={CAT[0]} y={CAT[1]} s={hs} op={hop} />}
    </g>
  );
  return { cur, red, over, tip, press, sendT: 3.32 };
}
function ConceptA({ k }) {
  const { T, bf, amp } = k;
  const sw = sway(T);
  const P = { x: 960 + sw.dx, y: 560 + sw.dy, s: 1.1, rot: -3 + sw.dr + 2.2 * knock(T, 3.34) };
  const S = longPress(T);
  const tipW = toWorld(P, S.tip);
  return (
    <g transform={cam(960, 548, 1 + 0.05 * g01(T, 0, 9.16))}>
      <PhoneDefs light={[P.x, P.y]} bf={bf} amp={amp} />
      <g filter="url(#fuGradeBg-cur)"><Bedroom at={[P.x, P.y]} /></g>
      <g filter="url(#phTone)"><Mitt P={P} tip={tipW} layer="back" /></g>
      <Phone P={P} id="A"><Layers cur={S.cur} red={S.red} over={S.over} /></Phone>
      <g filter="url(#phTone)"><Mitt P={P} tip={tipW} layer="front" press={S.press} /></g>
    </g>
  );
}

// ═══ B · Nightlight — in bed, the screen is the only light. Red content lights the hands and the room red; unfollowing
// turns the light warm again; typing flickers it; a slow reel of warm clips; a red post flicked past flashes once. ═══
const B_FEED = [
  { tone: 'warm', kind: 'friends' }, { tone: 'info', kind: 'text' }, { tone: 'red', kind: 'image' }, { tone: 'warm', kind: 'bowl' },
  { tone: 'warm', kind: 'plant' }, { tone: 'info', kind: 'headline' }, { tone: 'warm', kind: 'cat' }, { tone: 'warm', kind: 'heart' },
];
const B_REEL = ['sun', 'cat', 'cup', 'heart'];
function ConceptB({ k }) {
  const { T, bf, amp } = k;
  const sw = sway(T, 0.8);
  const P = { x: 960 + sw.dx, y: 600 + sw.dy + 26 * g01(T, 3.9, 6.4), s: 0.8, rot: 2 + sw.dr };
  // profile slides in, unfollow, slides out to a blank compose screen; then the reel; then the feed
  const pg = g01(T, 0.66, 0.9), back = g01(T, 1.5, 1.78), veil = g01(T, 1.16, 1.5);
  const ty = typing(T, 2.06, 3.26, 0.1, 9);
  const kb = g01(T, 1.8, 2.02) - g01(T, 3.42, 3.7), sent = g01(T, 3.34, 3.7);
  const reelIn = g01(T, 3.66, 3.92), feedIn = g01(T, 6.28, 6.52);
  const reel = track(T, [[0, 0], [4.7, 0], [5.15, SH], [5.75, SH], [6.2, 2 * SH]]);
  const fs = track(T, [[6.4, 0], [7.5, 280, 'lin'], [7.8, 1100, 'hit'], [8.9, 1300]]);
  const fl = feedLayout(B_FEED, fs, T), fc = feedCards(fl);
  const redCard = fl[2], redVis = feedIn * clamp(1 - Math.abs(redCard.cy - SCY) / 520, 0, 1);
  const flash = Math.exp(-Math.max(0, T - ty.lastT) * 16) * (ty.lastT > 0 && T < 3.5 ? 1 : 0);
  const rd = clamp((1 - veil) * (1 - g01(T, 1.5, 1.7)) + 0.85 * redVis, 0, 1);
  const glow = 0.8 + 0.35 * flash + 0.15 * g01(T, 3.9, 5) - 0.3 * g01(T, 6.4, 7);
  // stumps: the left one taps the avatar and the pill, the right one pecks the keys
  const AV = [56, 74], PILL = [SCX, 360];
  const tL = path2(T, [[0, [-4, SH * 0.8]], [0.36, [-4, SH * 0.8]], [0.56, AV], [0.7, [80, 300]], [1.0, PILL], [1.14, PILL], [1.4, [-4, SH * 0.8]]]);
  const tR = path2(T, [[0, [SW + 4, SH * 0.76]], [1.86, [SW + 4, SH * 0.76]], [2.06, () => ty.tip], [3.26, () => ty.tip], [3.38, [SW - 40, KB_TOP - 36]], [3.7, [SW + 4, SH * 0.76]]]);
  const rampH = mixRamp('cur', 'red', 0.7 * rd), rampRoom = mixRamp('cur', 'red', 0.55 * rd);
  const typedLines = Math.min(6, ty.count / 3.5);
  const cur = (
    <g>
      <rect width={SW} height={SH} fill={v(0.95)} />
      {/* profile page */}
      <g transform={`translate(${SW * (1 - pg) - SW * back} 0)`}>
        <rect width={SW} height={SH} fill={v(0.95)} />
        {bar(SCX - 80, 300, 160, 14, 0.35)}
        <rect x={SCX - 110} y={334} width="220" height="52" rx="26" fill={T > 1.12 ? v(0.95) : v(0.4)} stroke={v(0.4)} strokeWidth="3" />
        {T > 1.12 ? <Icon kind="follow" x={SCX} y={360} val={0.4} /> : bar(SCX - 50, 354, 100, 12, 0.95)}
      </g>
      {/* compose */}
      <g opacity={g01(T, 1.6, 1.8) * (1 - reelIn)}>
        <rect width={SW} height={SH} fill={v(0.97)} />
        <g transform={`translate(${SCX} ${110}) scale(${1 - 0.7 * sent}) translate(${-SCX} ${-110 - 320 * sent})`} opacity={1 - sent}>
          {Array.from({ length: Math.ceil(typedLines) }, (_, i) => {
            const len = (i + 1 <= typedLines ? 1 : typedLines - i) * 300;
            let d = `M 30 ${130 + i * 34}`;
            for (let j = 1; j <= 12; j++) d += ` L ${30 + (len * j) / 12} ${130 + i * 34 + (hash(i * 17 + j * 3) - 0.5) * 16}`;
            return <path key={i} d={d} fill="none" stroke={v(0.35)} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />;
          })}
        </g>
        <Keyboard y={290 * (1 - kb)} pressed={ty.pressed} />
      </g>
      {/* reel of warm clips, one full screen at a time */}
      <g opacity={reelIn * (1 - feedIn)}>
        <rect width={SW} height={SH} fill={v(0.6)} />
        {B_REEL.map((kind, i) => <WarmPost key={i} x={SCX} y={SCY + i * SH - reel} s={10.6} kind={kind} />)}
      </g>
      <g opacity={feedIn}><rect width={SW} height={SH} fill={v(0.95)} />{fc.cur}</g>
    </g>
  );
  const red = (
    <g>
      <g opacity={1 - pg}><PostValue x={SCX} y={SCY + 24} s={10.4} kind="video" /><circle cx={AV[0]} cy={AV[1]} r="22" fill={v(0.56)} /></g>
      <g transform={`translate(${SW * (1 - pg) - SW * back} 0)`}>
        <circle cx={SCX} cy={200} r="70" fill={v(0.56)} opacity={1 - veil} /><circle cx={SCX} cy={200} r="70" fill="none" stroke={v(0.8)} strokeWidth="4" opacity={veil} />
        {[0, 1, 2, 3, 4, 5].map((i) => <PostValue key={i} x={70 + (i % 3) * 110} y={500 + Math.floor(i / 3) * 150} s={3.2} kind={POST_KINDS[(i + 2) % 9]} outline={veil > 0.5} op={veil > 0.5 ? veil : 1 - veil * 2} />)}
      </g>
      <g opacity={feedIn}>{fc.red}</g>
    </g>
  );
  const over = <g><StatusBar /><Ripple p={AV} T={T} t0={0.56} /><Ripple p={PILL} T={T} t0={1.06} /></g>;
  return (
    <g transform={cam(960, 560 + 20 * g01(T, 3.9, 6.4), 1.02 + 0.06 * g01(T, 0, 9))}>
      <PhoneDefs light={[P.x, P.y]} handRamp={rampH} reach={620 + 160 * glow} bf={bf} amp={amp} />
      <defs><GradeFilter id="bRoom" ramp={rampRoom} blur={20} /></defs>
      <g filter="url(#bRoom)"><Bedroom at={[P.x, P.y]} glow={glow} r={560 + 200 * glow} /></g>
      <Phone P={P} id="B"><Layers cur={cur} red={red} over={over} /></Phone>
      <g filter="url(#phTone)"><Stumps P={P} tapL={toWorld(P, tL)} tapR={toWorld(P, tR)} /></g>
    </g>
  );
}

// ═══ C · Following — no hands, the screen fills the frame on a night bus. The following list: three red accounts
// unfollowed in a row; venting in the group chat; friends answer with hearts and a photo; the home feed, and a pull-out. ═══
const C_ROWS = [
  { tone: 'warm' }, { tone: 'red', tap: 0.56 }, { tone: 'warm' }, { tone: 'red', tap: 0.9 }, { tone: 'red', tap: 1.22 },
  { tone: 'warm' }, { tone: 'warm' }, { tone: 'warm' }, { tone: 'warm' }, { tone: 'warm' },
];
const C_FEED = [
  { tone: 'warm', kind: 'friends' }, { tone: 'info', kind: 'headline' }, { tone: 'warm', kind: 'cup' }, { tone: 'warm', kind: 'sun' },
  { tone: 'info', kind: 'text' }, { tone: 'warm', kind: 'plant' }, { tone: 'warm', kind: 'cat' },
];
function ConceptC({ k }) {
  const { T, bf, amp } = k;
  const sw = sway(T, 0.7);
  const P = { x: 960 + sw.dx, y: 548 + sw.dy, s: 1.2, rot: -6 + sw.dr };
  const rows = C_ROWS.map((r) => ({ ...r, gone: r.tap ? [r.tap + 0.2, r.tap + 0.48] : null, dx: r.tap ? -SW * g01(T, r.tap + 0.14, r.tap + 0.42) : 0 }));
  const L = feedLayout(rows, 0, T, 150, 86, 86);
  const toChat = g01(T, 1.8, 2.06), toFeed = g01(T, 6.24, 6.5);
  const fs = track(T, [[6.4, 0], [8.9, 760]]);
  const fc = feedCards(feedLayout(C_FEED, fs, T));
  const msgs = [
    { side: 'l', n: 1, w: 150 }, { side: 'l', n: 2, w: 220 },
    { side: 'r', n: 2, w: 230, t: 2.1, jag: true }, { side: 'r', n: 1, w: 180, t: 2.5, jag: true }, { side: 'r', n: 3, w: 280, t: 2.86, jag: true, react: 4.15 },
    { side: 'r', n: 2, w: 210, t: 3.24, jag: true, react: 4.35 },
    { side: 'l', n: 1, w: 150, t: 4.62 }, { side: 'l', photo: 'friends', t: 5.0 }, { side: 'l', sticker: true, t: 5.6 },
  ];
  const curRows = [], redRows = [], taps = [];
  L.forEach((r, i) => {
    if (r.k < 0.03) return;
    const on = !(r.tap && T > r.tap + 0.06), y = r.cy, op = r.k;
    const g = (
      <g key={i} transform={`translate(${r.dx} ${y}) scale(1 ${r.k})`} opacity={op}>
        {r.tone === 'warm' && <g><circle cx="52" cy="0" r="27" fill={v(0.62)} /><circle cx="52" cy="-6" r="10" fill={v(0.86)} /><ellipse cx="52" cy="18" rx="16" ry="10" fill={v(0.86)} /></g>}
        {bar(94, -16, 110 + 60 * hash(i * 3.1), 12, 0.35)}{bar(94, 6, 70 + 30 * hash(i * 5.3), 9, 0.66)}
        <rect x={SW - 136} y="-19" width="112" height="38" rx="19" fill={v(on ? 0.88 : 0.42)} />
        {bar(SW - 108, -5, 56, 10, on ? 0.42 : 0.95)}
      </g>
    );
    curRows.push(g);
    if (r.tone === 'red') redRows.push(<g key={i} transform={`translate(${r.dx} ${y}) scale(1 ${r.k})`} opacity={op}><circle cx="52" cy="0" r="27" fill={v(0.56)} /><rect x="49" y="-14" width="6" height="17" rx="3" fill={v(0.92)} /><circle cx="52" cy="11" r="3.4" fill={v(0.92)} /></g>);
    if (r.tap) taps.push([[SW - 80 + r.dx, y], r.tap]);
  });
  const cur = (
    <g>
      <g transform={`translate(${-SW * toChat} 0)`}>
        <rect width={SW} height={SH} fill={v(0.95)} />
        <rect width={SW} height="150" fill={v(0.92)} />{bar(60, 62, 140, 16, 0.32)}<path d="M 34 60 L 24 70 L 34 80" fill="none" stroke={v(0.32)} strokeWidth="4" strokeLinecap="round" />
        {bar(40, 110, 100, 10, 0.5)}{bar(SW - 150, 110, 100, 10, 0.32)}<rect x={SW - 160} y="136" width="120" height="5" fill={v(0.32)} />
        {curRows}
      </g>
      <g transform={`translate(${SW * (1 - toChat) - SW * toFeed} 0)`}>
        <rect width={SW} height={SH} fill={v(0.95)} />
        <rect width={SW} height="104" fill={v(0.92)} />
        {[0, 1, 2].map((i) => <circle key={i} cx={52 + i * 26} cy="70" r="18" fill={v(0.45 + i * 0.12)} stroke={v(0.92)} strokeWidth="3" />)}{bar(140, 64, 100, 12, 0.35)}
        <ChatColumn T={T} msgs={msgs} bottom={SH - 92} />
        <Compose y={SH - 76} />
      </g>
      <g transform={`translate(${SW * (1 - toFeed)} 0)`}><rect width={SW} height={SH} fill={v(0.95)} />{fc.cur}<AppBar /></g>
    </g>
  );
  const red = <g><g transform={`translate(${-SW * toChat} 0)`}>{redRows}</g><g transform={`translate(${SW * (1 - toFeed)} 0)`}>{fc.red}</g></g>;
  const over = (
    <g>
      <StatusBar />
      {taps.map(([p, t], i) => <g key={i}><Ripple p={p} T={T} t0={t} /><circle cx={p[0]} cy={p[1]} r="24" fill={v(0.2)} opacity={0.3 * bump(T, t - 0.02, t + 0.1, 0.06)} /></g>)}
    </g>
  );
  const z = 1 - 0.24 * g01(T, 6.4, 9.0);
  return (
    <g transform={cam(960, 548, z)}>
      <PhoneDefs light={[P.x, P.y]} bf={bf} amp={amp} />
      <g filter="url(#fuGradeBg-cur)"><BusRide T={T} at={[P.x, P.y]} /></g>
      <Phone P={P} id="C"><Layers cur={cur} red={red} over={over} /></Phone>
    </g>
  );
}

// ═══ D · Swipe — one post at a time. Red posts are swiped out of the phone and become outline moths in the dark;
// venting is a held voice note; warm posts are kept in a tray, which opens into the feed; the moths stay outside. ═══
const D_DECK = [
  { tone: 'red', kind: 'alert', ts: 0.7, dir: -1, moth: [470, 330] },
  { tone: 'red', kind: 'chart', ts: 1.24, dir: -1, moth: [380, 720] },
  { tone: 'warm', kind: 'cat', ts: 4.45, dir: 1 },
  { tone: 'warm', kind: 'sun', ts: 5.05, dir: 1 },
  { tone: 'warm', kind: 'friends', ts: 5.65, dir: 1 },
  { tone: 'warm', kind: 'cup' },
];
const D_FEED = [
  { tone: 'warm', kind: 'cat' }, { tone: 'warm', kind: 'sun' }, { tone: 'info', kind: 'text' }, { tone: 'warm', kind: 'friends' },
  { tone: 'warm', kind: 'cup' }, { tone: 'info', kind: 'headline' }, { tone: 'warm', kind: 'bowl' },
];
const D_MOTHS = [[1500, 250, 6.5], [1620, 760, 6.8], [300, 960, 7.1]];
function ConceptD({ k }) {
  const { T, bf, amp } = k;
  const sw = sway(T);
  const P = { x: 960 + sw.dx, y: 556 + sw.dy, s: 1.04, rot: -2 + sw.dr };
  const deckY = 820 * (g01(T, 1.56, 1.86) - g01(T, 3.74, 4.06));
  const feedIn = g01(T, 6.36, 6.8);
  const RP = [300, 640], CY = 420;
  const top = D_DECK.findIndex((c) => !(c.ts && T >= c.ts));
  const drag = (c) => (c.ts ? c.dir * 110 * MOTION.build(T, c.ts - 0.3, c.ts, 0, 1) : 0);
  const keys = [[0, RP]];
  D_DECK.forEach((c) => { if (c.ts) keys.push([c.ts - 0.5, [200, CY + 20]], [c.ts - 0.3, [200, CY + 20]], [c.ts, [200 + c.dir * 160, CY]], [c.ts + 0.28, RP]); });
  const rec = [1.96, 3.3];
  keys.push([1.8, RP], [rec[0], [SCX, 610]], [rec[1], [SCX, 612]], [3.6, RP]);
  keys.push([6.5, RP], [6.9, [290, 650]], [7.8, [290, 420]], [8.0, [300, 660]], [8.9, [300, 470]]);
  keys.sort((a, b) => a[0] - b[0]);
  const tip = path2(T, keys);
  const hold = bump(T, rec[0] + 0.04, rec[1], 0.08), prog = clamp((T - rec[0]) / (rec[1] - rec[0]), 0, 1), rel = g01(T, rec[1], rec[1] + 0.3);
  const fs = track(T, [[6.4, 0], [8.9, 520]]);
  const fc = feedCards(feedLayout(D_FEED, fs, T));
  const deckCur = [], deckRed = [], flyRed = [], tray = [];
  D_DECK.forEach((c, i) => {
    const isTop = i === top, isNext = i === top + 1;
    if (isTop || isNext) {
      const it = { tone: c.tone, kind: c.kind };
      const x = SCX + (isTop ? drag(c) : 0), y = CY + (isNext ? 14 : 0) + deckY, s = CS * (isNext ? 0.94 : 1.02), rot = isTop ? drag(c) * 0.08 : 0;
      const el = <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>{c.tone === 'red' ? <PostValue x={0} y={0} kind={c.kind} /> : <WarmPost kind={c.kind} />}</g>;
      (c.tone === 'red' ? deckRed : deckCur).unshift(el);
      void it;
    }
    if (c.ts && T >= c.ts) {
      if (c.tone === 'red') {
        // out of the screen into the room: then it flutters there as an outline
        const a = MOTION.hit(T, c.ts, c.ts + 0.6, 0, 1), from = toWorld(P, [SCX + c.dir * 110, CY]);
        const m = [c.moth[0] + 24 * osc(T, 1.7, i * 0.3) + (i === 0 ? 260 * bump(T, 7.6, 7.9, 0.4) : 0), c.moth[1] + 18 * osc(T, 1.3, i * 0.5)];
        const p = lerp2(from, m, a), s = lerp(CS * P.s, 2.3, a), fl = a < 1 ? 1 : Math.cos(T * 9 + i * 2);
        flyRed.push(<PostValue key={i} x={p[0]} y={p[1]} s={s} rot={-30 * a + 10 * osc(T, 2, i * 0.2)} flip={fl} kind={c.kind} outline={a > 0.85} />);
      } else {
        const j = D_DECK.filter((d, n) => n < i && d.tone === 'warm' && d.ts).length;
        const a = MOTION.hit(T, c.ts, c.ts + 0.45, 0, 1);
        const p = lerp2([SCX + 110, CY], [62 + j * 76, 150], a);
        tray.push(<g key={i} transform={`translate(${p[0]} ${p[1]}) scale(${lerp(CS, 1.55, a)})`}><WarmPost kind={c.kind} /></g>);
      }
    }
  });
  D_MOTHS.forEach(([x, y, t], i) => { const a = g01(T, t, t + 0.6); if (a > 0) flyRed.push(<PostValue key={'m' + i} x={x + 30 * osc(T, 1.9, i * 0.4) - 120 * (1 - a) * Math.sign(x - 960)} y={y + 20 * osc(T, 1.4, i)} s={2.1} flip={Math.cos(T * 8 + i)} rot={14 * osc(T, 2.4, i)} kind={POST_KINDS[(i + 4) % 9]} outline op={a} />); });
  const bars = Array.from({ length: 40 }, (_, i) => {
    if (i / 40 > prog) return null;
    const h = (10 + 90 * hash(i * 3.3 + 1) * (0.5 + 0.5 * Math.abs(osc(T, 0.27, i * 0.13)))) * (1 - 0.85 * rel);
    return <rect key={i} x={30 + i * 7.6} y={360 - h / 2 - 260 * rel} width="4.6" height={h} rx="2.3" fill={v(0.4)} />;
  });
  const cur = (
    <g>
      <rect width={SW} height={SH} fill={v(0.95)} />
      <g opacity={1 - feedIn}>
        <rect y="100" width={SW} height="96" fill={v(0.88)} />{tray}
        {deckCur}
        <g transform={`translate(0 ${820 - deckY})`} opacity={g01(T, 1.6, 1.9)}>
          <g opacity={1 - rel}>{bars}</g>
          <circle cx={SCX} cy="610" r={56 * (1 + 0.16 * hold)} fill={v(0.5)} /><Icon kind="mic" x={SCX} y={610} val={0.97} s={1.4} />
          {T > rec[1] && <Bubble x={SW - 20} y={300 - 420 * MOTION.build(T, rec[1] + 0.1, rec[1] + 0.6, 0, 1)} w={220} n={1} jag={1} s={pop(T, rec[1], 0.25)} />}
        </g>
      </g>
      <g opacity={feedIn}>{fc.cur}</g>
      <AppBar />
    </g>
  );
  const red = <g><g opacity={1 - feedIn}>{deckRed}</g><g opacity={feedIn}>{fc.red}</g></g>;
  const tipW = toWorld(P, tip);
  return (
    <g transform={cam(960, 548, 1.0 - 0.1 * g01(T, 6.2, 9))}>
      <PhoneDefs light={[P.x, P.y]} bf={bf} amp={amp} />
      <g filter="url(#fuGradeBg-cur)"><Livingroom at={[P.x, P.y]} /></g>
      <g filter="url(#phTone)"><Mitt P={P} tip={tipW} layer="back" /></g>
      <Phone P={P} id="D"><Layers cur={cur} red={red} over={<StatusBar />} /></Phone>
      <g filter="url(#phTone)"><Mitt P={P} tip={tipW} layer="front" press={hold} /></g>
      <g filter="url(#fuGradeFg-red)">{flyRed}</g>
    </g>
  );
}

// ═══ E · Glow — wider: the phone's light is a pool in a dark room, and red posts hang round it as outlines (lit where
// the light reaches them). Unfollowing throws a post out of the screen; the vent floats off as a bubble; comfort widens
// the pool and pushes the posts back; the calibrated feed keeps them at its edge. ═══
const E_FEED = [
  { tone: 'info', kind: 'text' }, { tone: 'red', kind: 'headline', gone: [0.96, 1.3] }, { tone: 'warm', kind: 'cat' }, { tone: 'warm', kind: 'sun' },
  { tone: 'info', kind: 'avatar' }, { tone: 'warm', kind: 'friends' }, { tone: 'warm', kind: 'cup' }, { tone: 'warm', kind: 'plant' },
];
function ConceptE({ k }) {
  const { T, bf, amp } = k;
  const sw = sway(T, 0.6);
  const P = { x: 960 + sw.dx, y: 540 + sw.dy, s: 0.6, rot: -4 + sw.dr };
  const ty = typing(T, 2.0, 2.86, 0.09, 5);
  const flash = Math.exp(-Math.max(0, T - ty.lastT) * 14) * (T < 3 ? 1 : 0);
  const gr = track(T, [[0, 300], [3.9, 320], [6.2, 560], [8.9, 600]]) + 26 * flash;
  const kb = g01(T, 1.84, 2.0) - g01(T, 2.9, 3.1);
  const scroll = track(T, [[0, 311], [3.9, 311], [6.2, 709], [8.9, 1250]]);
  const fc = feedCards(feedLayout(E_FEED, scroll, T));
  const msgs = [{ side: 'l', n: 1, w: 160 }, { side: 'r', n: 1, w: 130 }];
  const chatIn = g01(T, 1.76, 1.96) - g01(T, 3.0, 3.24);
  const tR = path2(T, [[0, [SW + 4, SH * 0.76]], [0.4, [SW + 4, SH * 0.76]], [0.62, [SCX, 380]], [0.96, [SCX, 380]], [1.2, [SW + 4, SH * 0.76]], [1.86, [SW + 4, SH * 0.76]], [2.0, () => ty.tip], [2.86, () => ty.tip], [2.96, [SW - 34, KB_TOP - 36]], [3.2, [SW + 4, SH * 0.76]]]);
  // posts round the pool: radius follows the pool's edge; one dives in on "not" and is pushed back
  const posts = Array.from({ length: 15 }, (_, i) => {
    const a = (i / 15) * Math.PI * 2 + T * 0.1 * (i % 2 ? 1 : -1) + 0.3 * hash(i);
    let r = gr + 60 + 170 * hash(i * 2.7) + 14 * osc(T, 1.6, i * 0.1);
    if (i === 4) r -= 150 * bump(T, 7.35, 7.7, 0.35);
    const p = [P.x + r * Math.cos(a), P.y + r * 0.66 * Math.sin(a)];
    return { p, lit: clamp((gr + 40 - r) / 60, 0, 1), i, flip: Math.cos(T * (6 + i % 3) + i) };
  });
  // the unfollowed post leaves the screen and joins them
  const ej = MOTION.hit(T, 0.98, 1.6, 0, 1), ejFrom = toWorld(P, [SCX, 380]), ejTo = [P.x - gr - 150, P.y - 210];
  const bubbleA = g01(T, 2.98, 4.2), bp = lerp2(toWorld(P, [SCX, 40]), [P.x + 180, -120], bubbleA);
  const cur = (
    <g>
      <rect width={SW} height={SH} fill={v(0.95)} />{fc.cur}<AppBar />
      <g transform={`translate(${SW * (1 - chatIn)} 0)`}>
        <rect width={SW} height={SH} fill={v(0.95)} /><ChatHeader /><ChatColumn T={T} msgs={msgs} bottom={KB_TOP - 72} />
        <Compose fill={T < 2.96 ? ty.count / ty.total : 0} jag={1} /><Keyboard y={290 * (1 - kb)} pressed={ty.pressed} />
      </g>
    </g>
  );
  return (
    <g transform={cam(960, 540, 1 + 0.06 * g01(T, 0, 9))}>
      <PhoneDefs light={[P.x, P.y]} reach={gr * 1.3} bf={bf} amp={amp} />
      <g filter="url(#fuGradeBg-cur)"><Livingroom at={[P.x, P.y]} glow={0.4} r={gr * 1.6} /></g>
      <g filter="url(#fuGradeFg-cur)"><ellipse cx={P.x} cy={P.y + 40} rx={gr} ry={gr * 0.66} fill="url(#fuPool)" opacity="0.85" /></g>
      <g filter="url(#fuGradeFg-red)">
        {posts.map(({ p, lit, i, flip }) => <g key={i}><PostValue x={p[0]} y={p[1]} s={2.2} rot={12 * osc(T, 2.2, i * 0.3)} flip={flip} kind={POST_KINDS[i % 9]} outline op={1 - lit} /><PostValue x={p[0]} y={p[1]} s={2.2} rot={12 * osc(T, 2.2, i * 0.3)} flip={flip} kind={POST_KINDS[i % 9]} op={lit} /></g>)}
        {T > 0.98 && <PostValue x={lerp(ejFrom[0], ejTo[0], ej)} y={lerp(ejFrom[1], ejTo[1], ej)} s={lerp(CS * P.s, 2.2, ej)} rot={-200 * ej} flip={ej < 1 ? 1 : Math.cos(T * 7)} kind="headline" outline={ej > 0.7} />}
      </g>
      <Phone P={P} id="E"><Layers cur={cur} red={fc.red} over={<StatusBar />} /></Phone>
      <g filter="url(#phTone)"><Stumps P={P} tapR={toWorld(P, tR)} w={90} /></g>
      {bubbleA > 0 && bubbleA < 1 && <g filter="url(#fuGradeFg-cur)" opacity={1 - g01(T, 3.8, 4.2)}><Bubble x={bp[0] + 120} y={bp[1]} w={240} n={3} jag={1.4} s={0.7 + 0.5 * bubbleA} /></g>}
    </g>
  );
}

// ═══ F · Controls — the curator tunes the platform: crisis topics switched off one by one; venting as a scribble on a
// story; a calm clip played; then a sensitivity slider dragged down while a live preview of the feed turns warm. ═══
const F_ROWS = [{ on: 0.56 }, { on: null }, { on: 0.9 }, { on: 1.24 }, { on: null }, { on: null }];
const F_PREVIEW = [['red', 'alert', 0.62], ['warm', 'cat'], ['red', 'chart', 0.4], ['red', 'video', 0.82], ['warm', 'sun'], ['red', 'headline', 0.25]];
function ConceptF({ k }) {
  const { T, bf, amp } = k;
  const sw = sway(T);
  const P = { x: 960 + sw.dx, y: 556 + sw.dy, s: 1.08, rot: 3 + sw.dr };
  const RP = [300, 650];
  const story = g01(T, 1.76, 2.0), storyOut = g01(T, 3.4, 3.76), clip = g01(T, 3.72, 3.96), slid = g01(T, 6.3, 6.56);
  const scrib = (t) => [SCX + 120 * Math.sin(t * 21) * (0.6 + 0.4 * Math.sin(t * 3)), 330 + 190 * Math.sin(t * 8.3 + 1) + 40 * Math.sin(t * 31)];
  const knob = track(T, [[6.7, 300], [8.0, 70]]);
  const tip = path2(T, [
    [0, RP], [0.36, RP], [0.52, [SW - 62, 200]], [0.62, [SW - 62, 200]], [0.86, [SW - 62, 360]], [0.96, [SW - 62, 360]], [1.2, [SW - 62, 440]], [1.3, [SW - 62, 440]], [1.6, RP],
    [2.0, () => scrib(2.06)], [2.06, () => scrib(2.06)], [3.26, () => scrib(T)], [3.36, [SW - 50, SH - 60]], [3.44, [SW - 50, SH - 60]], [3.7, RP],
    [4.1, [SCX, 360]], [4.3, [SCX, 360]], [4.6, [330, 700]], [6.4, [330, 700]], [6.66, [300, 640]], [6.7, () => [knob, 640]], [8.0, () => [knob, 640]], [8.4, [330, 700]],
  ]);
  const taps = [0.58, 0.92, 1.26, 3.4, 4.3];
  const sl = 1 - (knob - 70) / 230;   // 0 at the right (everything), 1 at the left (least)
  const pts = [];
  for (let t = 2.06; t <= Math.min(T, 3.26); t += 0.02) pts.push(scrib(t));
  const rows = F_ROWS.map((r, i) => {
    const y = 200 + i * 80, u = r.on ? g01(T, r.on, r.on + 0.14) : 1;
    return { y, u, i, red: !!r.on };
  });
  const cur = (
    <g>
      <rect width={SW} height={SH} fill={v(0.95)} /><rect width={SW} height="130" fill={v(0.9)} />{bar(28, 76, 150, 16, 0.32)}
      {rows.map(({ y, u, i }) => <g key={i}><circle cx="44" cy={y} r="18" fill="none" stroke={v(0.5)} strokeWidth="3" opacity={u} />{bar(78, y - 7, 120 + 50 * hash(i), 13, 0.38)}<rect x={SW - 90} y={y - 16} width="58" height="32" rx="16" fill={v(0.78)} opacity={u} /><circle cx={SW - 74 + 26 * (1 - u)} cy={y} r="12" fill={v(0.97)} /></g>)}
      <g transform={`translate(0 ${SH * (1 - story)})`} opacity={1 - clip}>
        <g transform={`translate(52 72) scale(${1 - 0.86 * storyOut}) translate(-52 -72)`}>
          <rect width={SW} height={SH} rx={40 * storyOut / 0.2} fill={v(0.6)} />
          {pts.length > 1 && <path d={'M ' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L ')} fill="none" stroke={v(0.97)} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />}
          <circle cx={SW - 50} cy={SH - 60} r="26" fill={v(0.95)} /><Icon kind="send" x={SW - 49} y={SH - 60} val={0.4} />
        </g>
        <circle cx="52" cy="72" r="38" fill="none" stroke={v(0.4)} strokeWidth="5" opacity={storyOut} />
      </g>
      <g opacity={clip * (1 - slid)}>
        <rect width={SW} height={SH} fill={v(0.9)} />
        {[0, 1, 2].map((i) => { const a = ((T - 4.4 - i * 0.6) % 1.8) / 1.8; return T > 4.4 + i * 0.6 && <circle key={i} cx={SCX} cy={360} r={180 + 160 * a} fill="none" stroke={v(0.98)} strokeWidth="4" opacity={0.7 * (1 - a)} />; })}
        <WarmPost x={SCX} y={360} s={8.6} kind="cup" />
        <circle cx={SCX} cy={360} r="40" fill={v(0.97)} opacity={1 - g01(T, 4.3, 4.5)} /><g opacity={1 - g01(T, 4.3, 4.5)}><Icon kind="play" x={SCX + 3} y={360} val={0.4} s={1.6} /></g>
        <rect x="30" y="600" width={SW - 60} height="8" rx="4" fill={v(0.7)} /><rect x="30" y="600" width={(SW - 60) * clamp((T - 4.3) / 6, 0, 1)} height="8" rx="4" fill={v(0.4)} />
      </g>
      <g opacity={slid}>
        <rect width={SW} height={SH} fill={v(0.95)} /><rect width={SW} height="530" fill={v(0.84)} />
        {F_PREVIEW.map(([tone, kind, th], i) => { const u = th ? g01(T, 6.7 + (8.0 - 6.7) * th, 6.7 + (8.0 - 6.7) * th + 0.3) : 1; const f = Math.cos(Math.PI * u); return tone === 'warm' || u > 0.5 ? <WarmPost key={i} x={70 + (i % 3) * 110} y={170 + Math.floor(i / 3) * 190 - 10 * g01(T, 8, 9)} s={3.9} flip={tone === 'warm' ? 1 : f} kind={tone === 'warm' ? kind : ['cup', 'bowl', 'plant', 'heart'][i % 4]} /> : null; })}
        {bar(30, 580, 150, 14, 0.35)}
        <rect x="70" y="636" width="230" height="10" rx="5" fill={v(0.72)} /><rect x="70" y="636" width={knob - 70} height="10" rx="5" fill={v(0.42)} />
        <circle cx={knob} cy="641" r="22" fill={v(0.98)} stroke={v(0.5)} strokeWidth="3" />
      </g>
    </g>
  );
  const red = (
    <g>
      <g opacity={1 - story}>{rows.map(({ y, u, i, red: rr }) => rr && <g key={i} opacity={1 - u}><circle cx="44" cy={y} r="18" fill={v(0.56)} /><rect x={SW - 90} y={y - 16} width="58" height="32" rx="16" fill={v(0.56)} /><circle cx={SW - 74 + 26 * (1 - u)} cy={y} r="12" fill={v(0.9)} /></g>)}</g>
      <g opacity={slid}>{F_PREVIEW.map(([tone, kind, th], i) => { if (tone !== 'red') return null; const u = g01(T, 6.7 + (8.0 - 6.7) * th, 6.7 + (8.0 - 6.7) * th + 0.3); return u < 0.5 ? <PostValue key={i} x={70 + (i % 3) * 110} y={170 + Math.floor(i / 3) * 190 - 10 * g01(T, 8, 9)} s={3.9} flip={Math.cos(Math.PI * u)} kind={kind} /> : null; })}</g>
    </g>
  );
  const over = <g><StatusBar />{taps.map((t, i) => <Ripple key={i} p={[[SW - 62, 200], [SW - 62, 360], [SW - 62, 440], [SW - 50, SH - 60], [SCX, 360]][i]} T={T} t0={t} />)}</g>;
  const tipW = toWorld(P, tip);
  return (
    <g transform={cam(960, 548, 1.02 + 0.04 * g01(T, 0, 9))}>
      <PhoneDefs light={[P.x, P.y]} bf={bf} amp={amp} />
      <g filter="url(#fuGradeBg-cur)"><Livingroom at={[P.x, P.y]} /></g>
      <g filter="url(#phTone)"><Mitt P={P} tip={tipW} layer="back" /></g>
      <Phone P={P} id="F"><Layers cur={cur} red={red} over={over} /></Phone>
      <g filter="url(#phTone)"><Mitt P={P} tip={tipW} layer="front" press={pressAt(T, taps)} /></g>
    </g>
  );
}

// ═══ G · Pull-out — A's actions, but the camera starts in the screen (the unfollow, huge) and pulls back through the
// hand and the bed to the dark room; on the feed beat red posts flutter outside the window, the phone a warm island. ═══
function ConceptG({ k }) {
  const { T, bf, amp } = k;
  const sw = sway(T, 0.5);
  const P = { x: 960 + sw.dx * 0.5, y: 650 + sw.dy * 0.5, s: 0.42, rot: -3 + sw.dr };
  const S = longPress(T);
  const z = track(T, [[0, 4.6], [1.7, 4.1], [3.9, 2.0], [6.4, 1.2], [8.92, 0.82]]);
  const at = path2(T, [[0, toWorld(P, [190, 330])], [1.2, toWorld(P, [170, 470])], [1.7, toWorld(P, [180, 470])], [3.9, toWorld(P, [180, 420])], [6.4, [960, 600]], [8.92, [960, 560]]]);
  const moths = Array.from({ length: 9 }, (_, i) => [190 + 330 * hash(i * 1.7) + 30 * osc(T, 1.4 + 0.3 * hash(i), i * 0.2), 130 + 380 * hash(i * 3.9) + 24 * osc(T, 1.1, i * 0.4), i]);
  const tipW = toWorld(P, S.tip);
  // close in, the filters only cover what the camera sees (a full-set region at 4.6x zoom is far too heavy)
  const vis = [at[0] - 960 / z - 60, at[1] - 540 / z - 60, 1920 / z + 120, 1080 / z + 120];
  const mo = g01(T, 5.6, 6.6);
  return (
    <g transform={cam(at[0], at[1], z)}>
      <PhoneDefs light={[P.x, P.y]} reach={380} bf={bf} amp={amp} region={vis} />
      <defs><GradeFilter id="gRoom" ramp="cur" blur={24 / z} region={vis} /><GradeFilter id="gOut" ramp="red" blur={24 / z} region={vis} /></defs>
      <clipPath id="gWin"><rect x="150" y="90" width="400" height="470" /></clipPath>
      <g filter="url(#gRoom)"><Bedroom at={[P.x, P.y]} r={520} /></g>
      {mo > 0 && <g clipPath="url(#gWin)" opacity={mo}><g filter="url(#gOut)">{moths.map(([x, y, i]) => <PostValue key={i} x={x} y={y} s={2.4} flip={Math.cos(T * 8 + i)} rot={15 * osc(T, 2, i * 0.3)} kind={POST_KINDS[i % 9]} outline={i % 3 !== 0} />)}</g></g>}
      <Phone P={P} id="G"><Layers cur={S.cur} red={S.red} over={S.over} /></Phone>
      <g filter="url(#phTone)"><Stumps P={P} tapR={tipW} w={70} from={1300} /></g>
    </g>
  );
}

// ═══ H · Rhythm — two thumbs, a compact news feed. Swipe a red row to unfollow; vent in the comments under a red post;
// linger on warm rows; then the rhythm of a calibrated feed: calm news and comfort at an even pace, a red post flicked
// past fast. Shows the feed as information source and mood regulator at once. ═══
const H_ROWS = [
  { tone: 'info', kind: 'headline' }, { tone: 'warm', kind: 'cat' }, { tone: 'red', kind: 'alert', swipe: 0.36, gone: [1.18, 1.5] },
  { tone: 'info', kind: 'text' }, { tone: 'warm', kind: 'sun' }, { tone: 'warm', kind: 'friends', like: 5.0 }, { tone: 'info', kind: 'avatar' },
  { tone: 'warm', kind: 'cup' }, { tone: 'info', kind: 'headline' }, { tone: 'red', kind: 'video' }, { tone: 'warm', kind: 'plant' },
  { tone: 'info', kind: 'feed' }, { tone: 'warm', kind: 'bowl' }, { tone: 'info', kind: 'text' }, { tone: 'warm', kind: 'heart' },
];
function twoThumbs(T, t0, t1, dt, seed) {
  const ty = typing(T, t0, t1, dt, seed);
  const side = (tp) => (keyPos(tp.row, tp.col)[0] < SCX ? 'L' : 'R');
  const tipOf = (s) => {
    const mine = ty.taps.filter((tp) => side(tp) === s);
    if (!mine.length) return null;
    const prev = [...mine].reverse().find((tp) => tp.t <= T) || mine[0], next = mine.find((tp) => tp.t > T) || prev;
    const a = keyPos(prev.row, prev.col), b = keyPos(next.row, next.col);
    const u = next === prev ? 0 : Easing.easeInOutSine(clamp(((T - prev.t) / (next.t - prev.t) - 0.4) / 0.6, 0, 1));
    return lerp2(a, b, u);
  };
  return { ...ty, L: tipOf('L'), R: tipOf('R') };
}
function ConceptH({ k }) {
  const { T, bf, amp } = k;
  const sw = sway(T, 0.7);
  const P = { x: 960 + sw.dx, y: 560 + sw.dy, s: 1.06, rot: sw.dr };
  const scroll = track(T, [[0, 0], [4.2, 0], [6.4, 300, 'lin'], [7.45, 700, 'lin'], [7.8, 1300, 'hit'], [8.9, 1500]]);
  const rows = H_ROWS.map((r) => ({ ...r, dx: r.swipe ? -116 * MOTION.hit(T, r.swipe, r.swipe + 0.34, 0, 1) : 0 }));
  const L = feedLayout(rows, scroll, T, FEED_TOP, 136, 128);
  const comments = g01(T, 1.76, 2.04) - g01(T, 3.8, 4.06);
  const tt = twoThumbs(T, 2.14, 3.2, 0.075, 3);
  const ACT = [SW - 58, L[2].cy];
  const RL = [56, 650], RR = [304, 650];
  const tR = path2(T, [[0, RR], [0.2, [280, 440]], [0.36, [280, 440]], [0.7, [150, 446]], [0.86, RR], [0.96, ACT], [1.1, ACT], [1.36, RR], [2.14, RR], [2.2, () => tt.R || RR], [3.2, () => tt.R || RR], [3.32, [SW - 34, KB_TOP - 36]], [3.46, [SW - 34, KB_TOP - 36]], [3.7, RR],
    [4.8, RR], [4.96, () => [SW - 70, L[5].cy]], [5.04, () => [SW - 70, L[5].cy]], [5.3, RR], [7.3, RR], [7.42, [300, 640]], [7.62, [300, 280], 'hit'], [7.9, RR]]);
  const tL = path2(T, [[0, RL], [2.0, RL], [2.2, () => tt.L || RL], [3.2, () => tt.L || RL], [3.5, RL]]);
  const cur = [], red = [];
  L.forEach((r, i) => {
    if (r.k < 0.03 || r.cy < -140 || r.cy > SH + 140) return;
    const tf = `translate(${r.dx} ${r.cy}) scale(1 ${r.k})`;
    cur.push(
      <g key={i} opacity={r.k}>
        {r.swipe && <g transform={`translate(0 ${r.cy}) scale(1 ${r.k})`}><rect x={SW - 120} y="-60" width="120" height="120" fill={v(0.42)} /><Icon kind="unfollow" x={SW - 58} y={0} val={0.97} /></g>}
        <g transform={tf}>
          <rect x="0" y="-64" width={SW} height="128" fill={v(0.95)} />
          {r.tone !== 'red' && <circle cx="38" cy="-36" r="15" fill={v(0.55)} />}
          {bar(62, -42, 90, 10, 0.35)}{bar(24, -14, 200, 9, 0.6)}{bar(24, 2, 170, 9, 0.6)}{bar(24, 18, 120, 9, 0.6)}
          {[0, 1, 2].map((j) => <circle key={j} cx={34 + j * 34} cy="46" r="5" fill={v(r.like && j === 0 && T > r.like ? 0.4 : 0.75)} />)}
          {r.tone !== 'red' && <g transform={`translate(${SW - 72} 0) scale(2.4)`}>{r.tone === 'warm' ? <WarmPost kind={r.kind} /> : <PostValue x={0} y={0} kind={r.kind} />}</g>}
          <rect x="16" y="63" width={SW - 32} height="1.5" fill={v(0.8)} />
        </g>
      </g>,
    );
    if (r.tone === 'red') red.push(<g key={i} transform={tf} opacity={r.k}><circle cx="38" cy="-36" r="15" fill={v(0.56)} /><g transform={`translate(${SW - 72} 0) scale(2.4)`}><PostValue x={0} y={0} kind={r.kind} /></g></g>);
  });
  const msgs = [{ side: 'l', n: 2, w: 230 }, { side: 'l', n: 1, w: 170 }, { side: 'r', n: 4, w: 290, t: 3.34, jag: true }];
  const cmt = (
    <g transform={`translate(0 ${SH * (1 - comments)})`}>
      <rect width={SW} height={SH} fill={v(0.93)} />
      <ChatColumn T={T} msgs={msgs} bottom={KB_TOP - 72} />
      <Compose fill={T < 3.34 ? tt.count / tt.total : 0} jag={1} /><Keyboard pressed={tt.pressed} />
    </g>
  );
  const cmtRed = <g transform={`translate(0 ${SH * (1 - comments)})`}><rect x="0" y="0" width={SW} height="10" fill="none" /><PostValue x={SCX} y={150} s={4.6} kind="alert" /></g>;
  const like = H_ROWS[5].like, likeP = [SW - 70, L[5].cy];
  const over = <g><g opacity={1 - comments}><AppBar /></g><StatusBar /><Ripple p={ACT} T={T} t0={1.04} val={0.9} />{T > like && <Heart x={likeP[0]} y={likeP[1] - 60 * g01(T, like, like + 0.6)} s={2.4 * pop(T, like, 0.25)} op={1 - g01(T, like + 0.4, like + 0.7)} val={0.45} />}</g>;
  return (
    <g transform={cam(960, 548, 1.02 + 0.04 * g01(T, 0, 9))}>
      <PhoneDefs light={[P.x, P.y]} bf={bf} amp={amp} />
      <g filter="url(#fuGradeBg-cur)"><Livingroom at={[P.x, P.y]} /></g>
      <g filter="url(#phTone)"><Mitt P={P} tip={toWorld(P, tR)} layer="back" /><Mitt P={P} tip={toWorld(P, tL)} side={-1} layer="back" /></g>
      <Phone P={P} id="H"><Layers cur={<g><rect width={SW} height={SH} fill={v(0.95)} />{cur}{cmt}</g>} red={<g><g opacity={1 - comments}>{red}</g>{cmtRed}</g>} over={over} /></Phone>
      <g filter="url(#phTone)"><Mitt P={P} tip={toWorld(P, tR)} layer="front" press={tt.pressed.length ? 1 : 0} /><Mitt P={P} tip={toWorld(P, tL)} side={-1} layer="front" /></g>
    </g>
  );
}

// ═══ X · Hands — the Bean has no hands; four ways to hold the phone in first person ═══
const X_ITEMS = [{ tone: 'warm', kind: 'cat' }, { tone: 'red', kind: 'alert' }, { tone: 'info', kind: 'text' }, { tone: 'warm', kind: 'sun' }, { tone: 'warm', kind: 'cup' }, { tone: 'red', kind: 'video' }];
function ConceptX({ k }) {
  const { T, bf, amp } = k;
  const panels = [[480, 280, 'Mitt + thumb'], [1440, 280, 'Two thumbs'], [480, 820, 'Bean stumps'], [1440, 820, 'No hands (taps only)']];
  return (
    <g>
      <rect width={W} height={H} fill={RC[1]} />
      <line x1="960" y1="40" x2="960" y2="1040" stroke={RC[2]} strokeWidth="2" /><line x1="40" y1="540" x2="1880" y2="540" stroke={RC[2]} strokeWidth="2" />
      {panels.map(([x, y, label], n) => {
        const P = { x, y: y + 20, s: 0.5, rot: -4 + 2 * osc(T, 4, n * 0.2) };
        const loop = (T + n * 0.4) % 2;
        const tip = path2(loop, [[0, [290, 600]], [0.5, [200, 380]], [0.62, [196, 372]], [0.74, [200, 380]], [1.2, [290, 600]], [2, [290, 600]]]);
        const tip2 = path2((loop + 1) % 2, [[0, [70, 600]], [0.5, [150, 400]], [0.7, [150, 400]], [1.2, [70, 600]], [2, [70, 600]]]);
        const fc = feedCards(feedLayout(X_ITEMS, 150 + 40 * T, 0));
        const id = 'x' + n;
        return (
          <g key={n}>
            <PhoneDefs id={id} light={[P.x, P.y]} reach={460} bf={bf} amp={amp} />
            {n === 0 && <g filter={`url(#${id}Tone)`}><Mitt P={P} id={id} tip={toWorld(P, tip)} layer="back" arm={[200, 300]} /></g>}
            {n === 1 && <g filter={`url(#${id}Tone)`}><Mitt P={P} id={id} tip={toWorld(P, tip)} layer="back" arm={[200, 300]} /><Mitt P={P} id={id} side={-1} tip={toWorld(P, tip2)} layer="back" arm={[200, 300]} /></g>}
            <Phone P={P} id={id}><Layers cur={<g><rect width={SW} height={SH} fill={v(0.95)} />{fc.cur}<AppBar /></g>} red={fc.red} over={<g><StatusBar />{n === 3 && <Ripple p={[200, 380]} T={loop} t0={0.55} />}{n === 3 && <circle cx="200" cy="380" r="26" fill={v(0.2)} opacity={0.3 * bump(loop, 0.5, 0.7, 0.06)} />}</g>} /></Phone>
            {n === 0 && <g filter={`url(#${id}Tone)`}><Mitt P={P} id={id} tip={toWorld(P, tip)} layer="front" /></g>}
            {n === 1 && <g filter={`url(#${id}Tone)`}><Mitt P={P} id={id} tip={toWorld(P, tip)} layer="front" /><Mitt P={P} id={id} side={-1} tip={toWorld(P, tip2)} layer="front" /></g>}
            {n === 2 && <g filter={`url(#${id}Tone)`}><Stumps P={P} id={id} tapR={loop > 0.3 && loop < 1.1 ? toWorld(P, tip) : null} from={y + 300} /></g>}
            <text x={x - 440} y={y - 220} fill={RC[6]} fontSize="30" fontWeight="600" fontFamily="Open Sans, sans-serif">{label}</text>
          </g>
        );
      })}
    </g>
  );
}

// ═══ Script card — review aid for the comparison grid only ═══
const BEATS = [['Unfollow', '1 · Unfollow'], ['Vent', '2 · Vent'], ['Comfort', '3 · Comfort'], ['Feed', '4 · Calibrated feed'], ['Hold', 'Hold']];
function ScriptCard({ k, items }) {
  const { T, q } = k;
  const starts = [q.U, q.V, q.C, q.F, q.E];
  let b = 0;
  starts.forEach((s, i) => { if (T >= s) b = i; });
  const line = items.find((it) => T >= it.at && T < it.until);
  const total = q.E + 0.24;
  return (
    <g fontFamily="Open Sans, sans-serif">
      <rect width={W} height={H} fill={RC[0]} />
      <text x="120" y="330" fill={RC[5]} fontSize="90" fontWeight="700">{BEATS[b][1]}</text>
      <foreignObject x="120" y="400" width="1680" height="400">
        <div xmlns="http://www.w3.org/1999/xhtml" style={{ color: '#f3f1ea', font: '600 76px "Open Sans", sans-serif', lineHeight: 1.2 }}>{line ? line.text : ''}</div>
      </foreignObject>
      <rect x="120" y="900" width="1680" height="8" fill={RC[1]} />
      {starts.slice(1).map((s, i) => <rect key={i} x={120 + (1680 * s) / total - 2} y="885" width="4" height="38" fill={RC[3]} />)}
      <rect x="120" y="900" width={(1680 * T) / total} height="8" fill={RC[5]} />
      <text x="120" y="990" fill={RC[4]} fontSize="44">{`${Math.floor(T)}s ${String(Math.round((T % 1) * 25) % 25).padStart(2, '0')}f`}</text>
    </g>
  );
}

// ═══ piece ══════════════════════════════════════════════════════════════════
const CONCEPTS = {
  A: ['Long press', ConceptA], B: ['Nightlight', ConceptB], C: ['Following', ConceptC], D: ['Swipe', ConceptD],
  E: ['Glow', ConceptE], F: ['Controls', ConceptF], G: ['Pull-out', ConceptG], H: ['Rhythm', ConceptH],
  X: ['Hands', ConceptX], S: ['Script', null],
};
function Piece({ concept, guide, boil, boilAmp }) {
  const { T, CUES } = useComposition();
  const q = { U: CUES.Unfollow, V: CUES.Vent, C: CUES.Comfort, F: CUES.Feed, E: CUES.Hold };
  const items = [
    { at: q.U + 0.52, until: q.V, text: 'Unfollowing what hurts,' },
    { at: q.V + 0.28, until: q.C, text: 'venting when it gets too much.' },
    { at: q.C + 0.36, until: q.F, text: 'For them, comfort is a way of coping.' },
    { at: q.F + 0.2, until: q.E + 0.24, text: 'A feed calibrated not to distress,' },
  ];
  const bf = Math.floor(T * 8), amp = boil ? boilAmp : 0;
  const k = { T, q, bf, amp };
  const [name, Comp] = CONCEPTS[concept] || CONCEPTS.A;
  return (
    <div data-screen-label={`${concept} · ${T.toFixed(1)}s`} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: RC[0], transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <LookDefs ramps={['cur']} bf={bf} amp={amp} />
        <RoomDefs />
        <rect width={W} height={H} fill={RC[0]} />
        {Comp ? <Comp k={k} /> : <ScriptCard k={k} items={items} />}
      </svg>
      {guide && Comp && (
        <React.Fragment>
          <div style={{ position: 'absolute', left: 56, top: 40, display: 'flex', gap: 18, alignItems: 'baseline', font: '700 52px "Open Sans", sans-serif', color: '#ffffff', textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}>
            <span>{concept}</span><span style={{ fontWeight: 500 }}>{name}</span>
          </div>
          <Captions items={items} style={{ font: '500 40px "Open Sans", sans-serif', bottom: '5%', textShadow: '0 1px 14px rgba(0,0,0,0.8)' }} />
        </React.Fragment>
      )}
    </div>
  );
}

function FUCuratorPhoneConcepts() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { concept: 'A', referenceOverlay: true, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={RC[0]}>
        <Piece concept={t.concept} guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Concept" />
        <TweakSelect label="Concept" value={t.concept} options={Object.entries(CONCEPTS).map(([val, [n]]) => ({ value: val, label: `${val} · ${n}` }))} onChange={(val) => setTweak('concept', val)} />
        <TweakSection label="Preview" />
        <TweakToggle label="Label + narration guide" value={t.referenceOverlay} onChange={(val) => setTweak('referenceOverlay', val)} />
        <TweakToggle label="Line boil (8 fps)" value={t.lineBoil} onChange={(val) => setTweak('lineBoil', val)} />
        <TweakSlider label="Boil amplitude" value={t.boilAmp ?? 0.5} min={0} max={3} step={0.1} unit="px" onChange={(val) => setTweak('boilAmp', val)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

window.FUCuratorPhoneConcepts = FUCuratorPhoneConcepts;
