// Feeding Uncertainty — the toned look: asset sheets and scene mockups (see LOOK.md).
// Built with rigs/fu-look.jsx: scenes authored in value and coloured by a group's ramp, toned Beans lit by the scene's own
// lights, soft out-of-focus backgrounds, red only through the posts. Pick one with the Concept tweak or `--set concept=lamp`.
// Every frame is a pure function of T; the clock runs 4 s so each concept can also be seen moving.
const { W, H, OUT_W, OUT_H, MOTION, osc, lerp, hash, cam } = window.FU_RIG;
const { POSES, BeanFig, PAL } = window.FU_BEAN;
const { RAMPS, mixRamp, v, ToneFilter, LookDefs, ToneBean, BeanBust, PostValue } = window.FU_LOOK;
const { glide } = MOTION;

const CONCEPTS = {
  tone: 'Sheet · ToneBean, three groups, side and front',
  hair: 'Sheet · hair: none, beanie, long',
  light: 'Sheet · moving lights: a swinging lamp, a walk past a streetlight',
  bust: 'Sheet · BeanBust close-ups',
  lamp: 'Scene · lamp (open engagers), teal world',
  table: 'Scene · dinner table under the lamp',
  door: 'Scene · curator child at the door, red seeping into the ramp',
  alley: 'Scene · alley, blue world with one warm window',
  voice: 'Scene · portrait framing, "their voice matters"',
  mask: 'Scene · stock-footage colour-mask look',
};

// ── small value-art helpers ───────────────────────────────────────────────────
const blob = (cx, cy, rx, ry, x, op = 1, key) => <ellipse key={key} cx={cx} cy={cy} rx={rx} ry={ry} fill={v(x)} opacity={op} />;
// a softly lit back wall with a window, a picture and a floor, for out-of-focus backgrounds
function RoomBack({ wall = 0.2, floorY = 800, win = [1290, 230, 300, 340], winX = 0.1, pic = [520, 300, 170, 130], glow = [960, 430, 620, 360, 0.42] }) {
  const [wx, wy, ww, wh] = win;
  return (
    <g>
      <rect x="-200" y="-200" width="2320" height="1480" fill={v(wall)} />
      {glow && blob(glow[0], glow[1], glow[2], glow[3], glow[4], 0.9)}
      <rect x="-200" y={floorY} width="2320" height="600" fill={v(wall * 0.6)} />
      <rect x="-200" y={floorY - 14} width="2320" height="14" fill={v(wall * 0.45)} />
      <rect x={wx - 14} y={wy - 14} width={ww + 28} height={wh + 28} fill={v(wall * 1.6)} />
      <rect x={wx} y={wy} width={ww} height={wh} fill={v(winX)} />
      <rect x={wx + ww / 2 - 6} y={wy} width="12" height={wh} fill={v(wall * 1.5)} />
      <rect x={wx} y={wy + wh * 0.4} width={ww} height="10" fill={v(wall * 1.5)} />
      {pic && <rect x={pic[0]} y={pic[1]} width={pic[2]} height={pic[3]} fill={v(wall * 0.55)} stroke={v(wall * 1.9)} strokeWidth="10" />}
    </g>
  );
}
// a lamp in value: cable, bell shade, bulb. (x, y) is the mouth of the shade; the cable runs up `cable` px
function LampValue({ x, y, rot = 0, cable = 600 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <line x1="0" y1={-cable} x2="0" y2="-26" stroke={v(0.3)} strokeWidth="3" />
      <rect x="-7" y="-34" width="14" height="14" rx="3" fill={v(0.32)} />
      <path d="M -10 -22 C -30 -16, -40 -2, -44 14 L 44 14 C 40 -2, 30 -16, 10 -22 Z" fill={v(0.42)} />
      <path d="M -10 -22 C -30 -16, -40 -2, -44 14 L -20 14 C -22 0, -16 -14, -6 -22 Z" fill={v(0.62)} />
      <ellipse cx="0" cy="14" rx="44" ry="7" fill={v(0.98)} />
    </g>
  );
}
// a streetlight in value: post, arm, lantern. (x, y) is the lantern
function StreetLight({ x, y, h = 520 }) {
  return (
    <g>
      <rect x={x - 5} y={y} width="10" height={h} fill={v(0.2)} />
      <path d={`M ${x - 16} ${y + 2} L ${x + 16} ${y + 2} L ${x + 10} ${y - 34} L ${x - 10} ${y - 34} Z`} fill={v(0.3)} />
      <rect x={x - 12} y={y - 6} width="24" height="10" fill={v(1)} />
      <path d={`M ${x - 18} ${y - 34} L ${x + 18} ${y - 34} L ${x} ${y - 52} Z`} fill={v(0.24)} />
    </g>
  );
}
// moths: red posts circling a light, in value
const moths = (T, cx, cy, n, R, seed, s = 1) => Array.from({ length: n }, (_, i) => {
  const h = (k) => hash(i * 9.1 + k * 3.3 + seed);
  const a = T * (0.7 + 0.6 * h(1)) * (h(2) > 0.5 ? 1 : -1) + 6.28 * h(3);
  const r = R * (0.45 + 0.55 * h(4));
  return <PostValue key={i} x={cx + r * Math.cos(a)} y={cy + 0.55 * r * Math.sin(a) + 14 * osc(T, 1.3 + h(5), h(6))} rot={-25 + 50 * h(7) + 18 * osc(T, 0.9 + h(8))} s={s * (0.8 + 0.4 * h(9))} flip={Math.cos(T * (5 + 3 * h(10)) + 6 * h(11))} />;
});
// the stage: 1920 × 1080 design scaled ×2 into the 4K stage
function Frame({ children, label, guide, bg }) {
  return (
    <div data-screen-label={label} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: bg, transform: `scale(${OUT_W / W})`, transformOrigin: '0 0' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>{children}</svg>
      {guide && <div style={{ position: 'absolute', left: 48, top: 36, font: '700 40px "Open Sans", sans-serif', color: '#fff', textShadow: '0 1px 12px rgba(0,0,0,0.7)' }}>{label}</div>}
    </div>
  );
}
// a soft ground for the sheets: a wall with a glow, a floor
function SheetGround({ x0, w, ramp, glow = [0.66, 0.36] }) {
  return (
    <g filter={`url(#fuGradeBg-${ramp})`}>
      <rect x={x0 - 100} y="-100" width={w + 200} height="1280" fill={v(0.22)} />
      {blob(x0 + w * glow[0], 1080 * glow[1], w * 0.42, 220, 0.42)}
      <rect x={x0 - 100} y="860" width={w + 200} height="400" fill={v(0.14)} />
    </g>
  );
}

// ── sheets ────────────────────────────────────────────────────────────────────
const GROUPS = ['wd', 'open', 'cur'];
function SheetTone({ k }) {
  const { T } = k;
  const hair = [['none', 'beanie'], ['long', 'none'], ['beanie', 'long']];
  return (
    <g>
      {GROUPS.map((g, i) => (
        <g key={g}>
          <clipPath id={'col' + i}><rect x={i * 640} y="0" width="640" height="1080" /></clipPath>
          <g clipPath={`url(#col${i})`}>
            <SheetGround x0={i * 640} w={640} ramp={g} />
            <ToneBean {...k.ba} id={i * 2 + 1} x={i * 640 + 200} y={860} s={2.1} pose={i === 1 ? POSES.talk(T) : i === 2 ? POSES.phone(T) : POSES.idle(T + 1)} phone={i === 2 ? 1 : 0} ramp={g} hair={hair[i][0]} />
            <ToneBean {...k.ba} id={i * 2 + 2} x={i * 640 + 470} y={860} s={2.1} view="front" pose={{ lean: 2 * osc(T, 3.1, i * 0.3), tilt: 4 * osc(T, 2.6, i * 0.2), look: [-0.6, 0], armL: [14, 10], armR: [14, 10] }} ramp={g} hair={hair[i][1]} />
          </g>
        </g>
      ))}
    </g>
  );
}
function SheetHair({ k }) {
  const { T } = k;
  return (
    <g>
      <SheetGround x0={0} w={1920} ramp="open" glow={[0.5, 0.3]} />
      {['none', 'beanie', 'long'].map((h, i) => (
        <g key={h}>
          <ToneBean {...k.ba} id={i * 2 + 1} x={i * 640 + 210} y={880} s={2.2} pose={POSES.idle(T + i)} ramp="open" hair={h} />
          <ToneBean {...k.ba} id={i * 2 + 2} x={i * 640 + 460} y={880} s={2.2} view="front" pose={{ lean: 2 * osc(T, 3.3, i * 0.2), tilt: 3 * osc(T, 2.4, i * 0.3), look: [-0.5, 0], armL: [14, 10], armR: [14, 10] }} ramp="open" hair={h} />
        </g>
      ))}
    </g>
  );
}
// the lights move, and the bands move with them
function SheetLight({ k }) {
  const { T } = k;
  // left: a lamp swinging over a standing figure
  const piv = [480, 40], len = 270, a = 0.42 * Math.sin((T / 2.6) * 2 * Math.PI);
  const bulb = [piv[0] + len * Math.sin(a), piv[1] + len * Math.cos(a)];
  const lamp = [{ x: bulb[0], y: bulb[1] + 14, i: 0.95, reach: 420 }, { dir: [0.3, 1], i: 0.08 }];
  // right: a figure walking past a streetlight
  const sl = [1440, 420], wx = lerp(1020, 1860, T / 4);
  const street = [{ x: sl[0], y: sl[1], i: 1, reach: 260 }, { dir: [-0.3, 1], i: 0.06 }];
  return (
    <g>
      <clipPath id="ll"><rect x="0" y="0" width="960" height="1080" /></clipPath>
      <clipPath id="lr"><rect x="960" y="0" width="960" height="1080" /></clipPath>
      <g clipPath="url(#ll)">
        <g filter="url(#fuGradeBg-open)">
          <rect x="-100" y="-100" width="1160" height="1280" fill={v(0.12)} />
          {blob(bulb[0], bulb[1] + 60, 360, 300, 0.3)}
          <rect x="-100" y="870" width="1160" height="400" fill={v(0.08)} />
        </g>
        <g filter="url(#fuGradeFg-open)">
          <ellipse cx={bulb[0] + (bulb[0] - piv[0]) * 0.9} cy="890" rx="300" ry="50" fill="url(#fuPool)" />
          <g transform={`rotate(${(-a * 180) / Math.PI} ${piv[0]} ${piv[1]})`}><LampValue x={piv[0]} y={piv[1] + len} cable={len} /></g>
        </g>
        <ToneBean {...k.ba} id={1} x={480} y={890} s={1.7} pose={POSES.idle(T)} ramp="open" lights={lamp} hair="beanie" />
      </g>
      <g clipPath="url(#lr)">
        <g filter="url(#fuGradeBg-wd)">
          <rect x="860" y="-100" width="1160" height="1280" fill={v(0.08)} />
          {blob(sl[0], sl[1] + 120, 300, 340, 0.3)}
          <rect x="860" y="900" width="1160" height="400" fill={v(0.07)} />
        </g>
        <g filter="url(#fuGradeFg-wd)">
          <ellipse cx={sl[0]} cy="910" rx="260" ry="44" fill="url(#fuPool)" />
          <StreetLight x={sl[0]} y={sl[1]} h={490} />
        </g>
        <ToneBean {...k.ba} id={2} x={wx} y={910} s={1.8} pose={POSES.walk(T)} ramp="wd" lights={street} hair="long" />
      </g>
    </g>
  );
}
function SheetBusts({ k }) {
  const { T } = k;
  const spec = [{ g: 'wd', hair: 'none', turn: 0.4 }, { g: 'open', hair: 'beanie', turn: -0.35 }, { g: 'cur', hair: 'long', turn: 0.3 }];
  return (
    <g>
      {spec.map((p, i) => (
        <g key={i}>
          <clipPath id={'bc' + i}><rect x={i * 640} y="0" width="640" height="1080" /></clipPath>
          <g clipPath={`url(#bc${i})`}>
            <g filter={`url(#fuGradeBg-${p.g})`}>
              <rect x={i * 640 - 100} y="-100" width="840" height="1280" fill={v(0.2)} />
              {blob(i * 640 + 520, 260, 200, 260, 0.46)}
              {blob(i * 640 + 90, 700, 160, 300, 0.1)}
            </g>
            <BeanBust {...k.ba} id={i + 1} x={i * 640 + 320} y={1080} s={0.82} ramp={p.g} turn={p.turn} hair={p.hair} tilt={2 * osc(T, 3.4, i * 0.3)} nod={osc(T, 2.8, i * 0.2)}
              lights={[{ x: i * 640 + 560, y: 200, i: 0.8, reach: 900 }]} />
          </g>
        </g>
      ))}
    </g>
  );
}

// ── scenes ────────────────────────────────────────────────────────────────────
// Lamp: the open engagers opening, in the teal world. The wall and floor are out of focus; the light pool posterizes into
// bands; the figure is lit by the bulb above; red posts are on the red ramp.
function SceneLamp({ k, look = 'tone' }) {
  const { T } = k;
  const z = glide(T, 0, 4, 1.62, 1.72), CAM = cam(985, 700, z);
  const pose = { ...POSES.idle(T), armN: [62 + 4 * osc(T, 2.3), 52 + 6 * osc(T, 1.7)], tilt: -6 + 2 * osc(T, 3) };
  const sway = 2.5 * osc(T, 3.6), bulb = [960 - 14 * Math.sin((sway * Math.PI) / 180), 314];   // the shade turns about its mouth
  const cone = <path d="M 925 300 L 995 300 L 1250 880 L 670 880 Z" fill="url(#lampCone)" />;
  const back = (
    <g transform={CAM}>
      <RoomBack wall={0.13} floorY={760} win={[1420, 200, 260, 330]} pic={[340, 260, 160, 120]} glow={[960, 520, 520, 380, 0.3]} />
      {cone}
    </g>
  );
  if (look === 'mask') { // stock-footage colour mask: the world stays neutral grey, only people carry colour, with a soft glow
    return (
      <g>
        <g filter="url(#maskBlur)">{back}</g>
        <g transform={CAM}>
          <ellipse cx="960" cy="880" rx="300" ry="54" fill={v(0.42)} opacity="0.7" />
          <g filter="url(#maskRed)">{moths(T, 960, 520, 9, 230, 3)}</g>
          <LampValue x={960} y={300} rot={sway} />
          <g filter="url(#fuGlow)"><BeanFig x={960} y={880} s={1.15} pose={pose} c={PAL.open} T={T} boilAmp={k.amp} id={1} /></g>
        </g>
      </g>
    );
  }
  return (
    <g>
      <g filter="url(#fuGradeBg-open)">{back}</g>
      <g filter="url(#fuGradeFg-open)">
        <g transform={CAM}>
          <ellipse cx="960" cy="880" rx="330" ry="62" fill="url(#fuPool)" />
          <LampValue x={960} y={300} rot={sway} />
        </g>
      </g>
      <g transform={CAM}>
        <ToneBean {...k.ba} x={960} y={880} s={1.15} pose={pose} ramp="open" lights={[{ x: bulb[0], y: bulb[1], i: 0.95, reach: 420 }]} />
      </g>
      <g filter="url(#fuGradeFg-red)">
        <g transform={CAM}>
          {moths(T, 960, 520, 9, 230, 3)}
          <PostValue x={1028 + 2 * osc(T, 1.1)} y={688 + 3 * osc(T, 0.9)} rot={-14} s={0.9} flip={0.6 + 0.4 * Math.abs(osc(T, 1.4))} />
        </g>
      </g>
    </g>
  );
}

// Dinner table: the family seated under the lamp; the room is out of focus.
const SIT = (T, ph = 0, talk = 0) => ({ hx: 0, lean: 6 + 2 * osc(T, 3.1, ph), tilt: -2 + 3 * osc(T, 2.3, ph), legN: [82, 84], legF: [78, 80],
  armN: [52 + 14 * talk * osc(T, 1.2, ph), 40 + 20 * talk * osc(T, 0.7, ph)], armF: [40, 50], phone: 0 });
function SceneTable({ k }) {
  const { T } = k;
  const CAM = cam(960, 790, glide(T, 0, 4, 2.0, 2.1));
  const lamp = [{ x: 960, y: 344, i: 1, reach: 380 }];
  const table = (
    <g>
      <rect x="770" y="790" width="380" height="18" rx="4" fill={v(0.62)} />
      <rect x="770" y="806" width="380" height="8" fill={v(0.3)} />
      <rect x="790" y="812" width="14" height="128" fill={v(0.28)} />
      <rect x="1116" y="812" width="14" height="128" fill={v(0.24)} />
    </g>
  );
  const chair = (x, d) => (
    <g transform={`translate(${x} 940) scale(${d} 1)`}>
      <rect x="-34" y="-62" width="68" height="10" fill={v(0.3)} />
      <rect x="-34" y="-150" width="10" height="150" fill={v(0.24)} />
      <rect x="24" y="-56" width="8" height="56" fill={v(0.22)} />
    </g>
  );
  return (
    <g>
      <g filter="url(#fuGradeBg-open)">
        <g transform={CAM}>
          <RoomBack wall={0.17} floorY={830} win={[1240, 330, 230, 280]} winX={0.07} pic={[560, 360, 150, 110]} glow={[960, 520, 560, 340, 0.36]} />
          <path d="M 935 330 L 985 330 L 1200 800 L 720 800 Z" fill="url(#lampCone)" />
        </g>
      </g>
      <g filter="url(#fuGradeFg-open)">
        <g transform={CAM}>
          <LampValue x={960} y={330} rot={1.5 * osc(T, 4)} />
          <ellipse cx="960" cy="800" rx="250" ry="34" fill="url(#fuPool)" />
          {chair(700, 1)}{chair(1225, -1)}
        </g>
      </g>
      <g transform={CAM}>
        <ToneBean {...k.ba} id={1} x={700} y={940} s={1} pose={SIT(T, 0, 1)} ramp="open" lights={lamp} hair="long" />
        <ToneBean {...k.ba} id={2} x={860} y={940} s={0.66} headScale={1.3} pose={{ ...POSES.idle(T + 0.4), armN: [48, 50] }} ramp="open" lights={lamp} hair="beanie" />
        <ToneBean {...k.ba} id={3} x={1225} y={940} s={1} dir={-1} pose={SIT(T, 0.4, 0.6)} ramp="open" lights={lamp} />
      </g>
      <g filter="url(#fuGradeFg-open)"><g transform={CAM}>{table}</g></g>
      <g filter="url(#fuGradeFg-red)">
        <g transform={CAM}><PostValue x={960 + 40 * osc(T, 3.6)} y={738 + 6 * osc(T, 1.4)} rot={8 * osc(T, 2)} s={1} flip={Math.cos(T * 1.8)} /></g>
      </g>
    </g>
  );
}

// Door: the curator child behind the window in the door, close. A story beat where red comes in: the child's ramp slides
// toward red as the posts close in; out-of-focus posts pass in the foreground. Lit by the hall light behind and the street.
const HOLE = 'M 720 300 L 720 600 L 1020 600 L 1020 300 Z';
function SceneDoor({ k, red }) {
  const { T } = k;
  const CAM = cam(870, 470, glide(T, 0, 4, 1.3, 1.36));
  const sway = osc(T, 2.7);
  const look = [0.6 * osc(T, 3.3), -0.2];
  const door = (
    <g>
      <path d={`M -200 -200 L 2120 -200 L 2120 1280 L -200 1280 Z ${HOLE}`} fill={v(0.2)} fillRule="evenodd" />
      <g clipPath="url(#doorWall)">{Array.from({ length: 40 }, (_, i) => <rect key={i} x="-200" y={i * 34 - 200} width="2320" height="3" fill={v(0.13)} />)}</g>
      <path d={`M 560 90 L 1180 90 L 1180 1190 L 560 1190 Z ${HOLE}`} fill={v(0.15)} fillRule="evenodd" />
      <path d={`M 590 120 L 1150 120 L 1150 1200 L 590 1200 Z ${HOLE}`} fill="url(#doorLight)" fillRule="evenodd" />
      <rect x="700" y="280" width="340" height="20" fill={v(0.72)} />
      <rect x="700" y="600" width="340" height="20" fill={v(0.4)} />
      <rect x="700" y="280" width="20" height="340" fill={v(0.6)} />
      <rect x="1020" y="280" width="20" height="340" fill={v(0.46)} />
      <rect x="720" y="760" width="300" height="230" fill="none" stroke={v(0.3)} strokeWidth="8" />
      <circle cx="1090" cy="700" r="16" fill={v(0.86)} />
    </g>
  );
  return (
    <g>
      <clipPath id="glass"><rect x="720" y="300" width="300" height="300" /></clipPath>
      <clipPath id="doorWall"><path d="M -200 -200 L 2120 -200 L 2120 1280 L -200 1280 Z M 560 90 L 560 1190 L 1180 1190 L 1180 90 Z" clipRule="evenodd" /></clipPath>
      <g clipPath="url(#glass)">
        <g transform={CAM}>
          <g filter="url(#doorHall)">
            <rect x="600" y="200" width="600" height="500" fill={v(0.1)} />
            {blob(930, 360, 90, 140, 0.34)}
          </g>
          <ToneBean {...k.ba} x={870 + 6 * sway} y={1060} s={2.7} view="front" headScale={1.3} ramp={mixRamp(RAMPS.cur, RAMPS.red, red * 0.6)} toneId="toneChild" hair="long"
            lights={[{ x: 1500, y: 160, i: 0.55, reach: 900 }, { x: 930, y: 330, i: 0.35, reach: 260 }]}
            pose={{ lean: 3 * sway, tilt: 6 * sway, look, armL: { to: [-34, -176], elbow: 'in' }, armR: { to: [36, -178], elbow: 'in' } }} />
          <rect x="600" y="200" width="600" height="500" fill={RAMPS.red[4]} opacity={0.18 * red} />
        </g>
      </g>
      <g filter="url(#doorGrade)"><g transform={CAM}>{door}</g></g>
      <g filter="url(#fuGradeBg-red)">
        {[0, 1, 2].map((i) => {
          const t = (T * (0.16 + 0.05 * i) + 0.3 * i) % 1;
          return <PostValue key={i} x={lerp(1700 + 200 * i, -300, t)} y={260 + 330 * i + 40 * osc(T, 1.6, i * 0.3)} rot={-20 + 30 * i + 20 * osc(T, 1.1)} s={3.4 + 0.8 * i} flip={Math.cos(T * 2 + i)} />;
        })}
      </g>
    </g>
  );
}

// Alley: the withdrawal-blue night street, out of focus; one curator's window in the foreground keeps its own warm ramp.
// The curator is lit by the room lamp behind them and the streetlight outside.
function SceneAlley({ k }) {
  const { T } = k;
  const CAM = cam(960, 540, glide(T, 0, 4, 1, 1.04));
  const t = (T * 0.22) % 1;
  const swarm = Array.from({ length: 22 }, (_, i) => {
    const h = (n) => hash(i * 5.3 + n * 2.1 + 17);
    const x = lerp(-300, 2300, (t + 0.08 * h(1)) % 1.2) + 60 * h(2), y = 210 + 160 * h(3) + 30 * osc(T, 1 + h(4), h(5));
    return <PostValue key={i} x={x} y={y} rot={-30 + 60 * h(6)} s={0.9 + 0.5 * h(7)} flip={Math.cos(T * (5 + 3 * h(8)) + 6 * h(9))} />;
  });
  const houses = Array.from({ length: 7 }, (_, i) => {
    const w = 300 + 80 * hash(i * 3.1), x = -120 + i * 330, top = 120 + 120 * hash(i * 7.7);
    return (
      <g key={i}>
        <rect x={x} y={top} width={w} height={900} fill={v(0.13 + 0.05 * hash(i * 2.3))} />
        {[0, 1, 2].map((r) => [0, 1].map((c) => <rect key={r + '-' + c} x={x + 50 + c * (w - 160)} y={top + 80 + r * 220} width="60" height="110" fill={v(hash(i * 13 + r * 3 + c) > 0.72 ? 0.5 : 0.07)} />))}
      </g>
    );
  });
  const wallPath = 'M 380 -40 L 1520 -40 L 1520 1120 L 380 1120 Z M 760 330 L 760 760 L 1140 760 L 1140 330 Z';
  return (
    <g>
      <g filter="url(#alleyBack)">
        <g transform={CAM}>
          <rect x="-200" y="-200" width="2320" height="1480" fill={v(0.07)} />
          {houses}
          {blob(250, 520, 280, 360, 0.55, 0.8)}
          {blob(1720, 560, 260, 340, 0.5, 0.8)}
          <rect x="-200" y="980" width="2320" height="300" fill={v(0.1)} />
        </g>
      </g>
      <clipPath id="alleyGlass"><rect x="760" y="330" width="380" height="430" /></clipPath>
      <g clipPath="url(#alleyGlass)">
        <g transform={CAM}>
          <g filter="url(#fuGradeBg-cur)">
            <rect x="740" y="300" width="420" height="480" fill={v(0.42)} />
            {blob(1060, 420, 120, 150, 0.85)}
          </g>
          <ToneBean {...k.ba} x={905 + 10 * osc(T, 2.9)} y={1040} s={2.2} view="front" ramp="cur" hair="beanie"
            lights={[{ x: 1070, y: 420, i: 0.8, reach: 200 }, { x: 1380, y: 120, i: 0.35, reach: 600 }]}
            pose={{ lean: -4 + 3 * osc(T, 2.9), tilt: -6, look: [-0.8, -0.3], armL: null, armR: { to: [44, -150], elbow: 'in' } }} />
          <g filter="url(#fuGradeFg-cur)">
            <path d={`M 990 300 C ${1010 + 8 * osc(T, 2.9)} 480, ${980 + 10 * osc(T, 2.9)} 640, 1000 780 L 1160 780 L 1160 300 Z`} fill={v(0.7)} />
            <path d="M 1050 300 C 1060 480, 1040 640, 1060 780 L 1080 780 C 1062 640, 1080 480, 1070 300 Z" fill={v(0.5)} />
          </g>
        </g>
      </g>
      <g filter="url(#alleyWall)">
        <g transform={CAM}>
          <path d={wallPath} fill="url(#alleyLight)" fillRule="evenodd" />
          <clipPath id="alleyWallClip"><path d={wallPath} clipRule="evenodd" /></clipPath>
          <g clipPath="url(#alleyWallClip)">{Array.from({ length: 36 }, (_, i) => <rect key={i} x="380" y={i * 32 - 40} width="1140" height="3" fill={v(0.06)} opacity="0.7" />)}</g>
          <rect x="740" y="310" width="420" height="20" fill={v(0.5)} />
          <rect x="740" y="760" width="420" height="26" fill={v(0.62)} />
          <rect x="740" y="310" width="20" height="470" fill={v(0.4)} />
          <rect x="1140" y="310" width="20" height="470" fill={v(0.3)} />
          <rect x="940" y="330" width="14" height="430" fill={v(0.36)} />
          <rect x="760" y="500" width="380" height="12" fill={v(0.36)} />
        </g>
      </g>
      <g filter="url(#fuGradeFg-red)"><g transform={CAM}>{swarm}</g></g>
    </g>
  );
}

// Voice: the open engager in close-up, framed like a testimony portrait (subject left, out-of-focus room right),
// lit by the window.
function SceneVoice({ k }) {
  const { T } = k;
  const z = glide(T, 0, 4, 1, 1.04);
  return (
    <g>
      <g filter="url(#fuGradeBg-open)">
        <g transform={`translate(960 540) scale(${z}) translate(-960 -540)`}>
          <RoomBack wall={0.14} floorY={900} win={[1300, 180, 380, 460]} winX={0.5} pic={[980, 300, 180, 140]} glow={[1200, 520, 600, 420, 0.3]} />
          <rect x="1050" y="720" width="620" height="24" fill={v(0.36)} />
          {blob(1500, 640, 80, 120, 0.6)}
        </g>
      </g>
      <g transform={`translate(960 1080) scale(${z}) translate(-960 -1080)`}>
        <BeanBust {...k.ba} x={640} y={1140} s={0.95} ramp="open" turn={0.45} hair="beanie" tilt={2 * osc(T, 3.7)} nod={glide(T, 1.2, 1.8, 0, 1) - glide(T, 1.8, 2.6, 0, 1)}
          lights={[{ x: 1500, y: 380, i: 0.85, reach: 1100 }, { dir: [0.4, 1], i: 0.08 }]} />
      </g>
    </g>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────
function ConceptPiece({ concept, guide, boil, boilAmp }) {
  const { T } = useComposition();
  const bf = Math.floor(T * 8), amp = boil ? boilAmp : 0;
  const k = { T, bf, amp, ba: { bf, amp } };
  const ramps = { tone: GROUPS, hair: ['open'], light: ['open', 'wd'], bust: GROUPS, lamp: ['open'], table: ['open'], door: ['cur'], alley: ['wd', 'cur'], voice: ['open'], mask: ['open'] }[concept] || ['open'];
  const red = glide(T, 0.3, 3.6, 0.15, 0.55);
  const body = {
    tone: <SheetTone k={k} />, hair: <SheetHair k={k} />, light: <SheetLight k={k} />, bust: <SheetBusts k={k} />,
    lamp: <SceneLamp k={k} />, table: <SceneTable k={k} />, door: <SceneDoor k={k} red={red} />, alley: <SceneAlley k={k} />, voice: <SceneVoice k={k} />,
    mask: <SceneLamp k={k} look="mask" />,
  }[concept] || <SceneLamp k={k} />;
  return (
    <Frame label={CONCEPTS[concept] || concept} guide={guide} bg={concept === 'mask' ? '#1b1b1b' : RAMPS[ramps[0]][1]}>
      <LookDefs ramps={ramps} bf={bf} amp={amp} />
      <defs>
        <linearGradient id="lampCone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={v(0.9)} stopOpacity="0.5" /><stop offset="1" stopColor={v(0.7)} stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="doorLight" x1="1" y1="0" x2="0" y2="0.6">
          <stop offset="0" stopColor={v(0.82)} /><stop offset="0.45" stopColor={v(0.55)} /><stop offset="1" stopColor={v(0.26)} />
        </linearGradient>
        <radialGradient id="alleyLight" cx="0.72" cy="0.22" r="0.9">
          <stop offset="0" stopColor={v(0.8)} /><stop offset="0.4" stopColor={v(0.46)} /><stop offset="1" stopColor={v(0.12)} />
        </radialGradient>
        {concept === 'door' && <window.FU_LOOK.GradeFilter id="doorGrade" ramp="cur" poster />}
        {concept === 'door' && <window.FU_LOOK.GradeFilter id="doorHall" ramp={mixRamp(RAMPS.cur, RAMPS.red, red * 0.6)} blur={8} />}
        {concept === 'door' && <ToneFilter id="toneChild" ramp={mixRamp(RAMPS.cur, RAMPS.red, red * 0.6)} bf={bf} amp={amp} />}
        <window.FU_LOOK.GradeFilter id="alleyBack" ramp="wd" blur={10} gain={1.25} />
        <window.FU_LOOK.GradeFilter id="alleyWall" ramp="wd" poster gain={1.1} />
        <filter id="maskBlur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="8" /></filter>
        <filter id="maskRed" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1" /><feColorMatrix type="matrix" values="0.9 0.2 0 0 0.05  0.2 0.3 0 0 0  0.1 0.1 0.1 0 0  0 0 0 1 0" /></filter>
      </defs>
      {body}
    </Frame>
  );
}

function FULookConcepts() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { concept: 'lamp', referenceOverlay: false, lineBoil: true, boilAmp: 0.5 });
  return (
    <React.Fragment>
      <CompositionStage width={OUT_W} height={OUT_H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg="#0e0e0e" autoplay={false}>
        <ConceptPiece concept={t.concept} guide={t.referenceOverlay} boil={t.lineBoil} boilAmp={t.boilAmp ?? 0.5} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Concept" />
        <TweakSelect label="Concept" value={t.concept} options={Object.keys(CONCEPTS).map((key) => ({ value: key, label: CONCEPTS[key] }))} onChange={(x) => setTweak('concept', x)} />
        <TweakSection label="Preview" />
        <TweakToggle label="Label" value={t.referenceOverlay} onChange={(x) => setTweak('referenceOverlay', x)} />
        <TweakToggle label="Line boil (8 fps)" value={t.lineBoil} onChange={(x) => setTweak('lineBoil', x)} />
        <TweakSlider label="Boil amplitude" value={t.boilAmp ?? 0.5} min={0} max={3} step={0.1} unit="px" onChange={(x) => setTweak('boilAmp', x)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

window.FULookConcepts = FULookConcepts;
