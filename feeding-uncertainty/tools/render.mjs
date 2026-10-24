// Renders a Design Component shot to a 4K PNG sequence with headless Chromium.
// Drives the stage's own seek event, so every frame is the same pure function of T as the preview.
//
//   node tools/render.mjs "Curation Topography.dc.html"                 full sequence → renders/<shot>/
//   node tools/render.mjs "Curation Topography.dc.html" --frames 0,39,40,72
//   node tools/render.mjs "Curation Topography.dc.html" --boundaries    frames either side of every section cue
//   node tools/render.mjs "Curation Topography.dc.html" --prores        also writes a ProRes 4444 .mov
//   node tools/render.mjs "Curation Topography.dc.html" --preview       also writes a 1080p H.264 .mp4
//
// Options: --fps 25, --out <dir>, --boilAmp <px>, --noBoil, --guide (narration caption; never for final renders),
//          --set key=value[,key=value] (any tweak, e.g. --set concept=C), --half (1920x1080 frames for quick review)
//          --settle <ms> for heavy shots: wait after each seek, then re-capture until two captures match, so no tile is caught half-drawn
//          --minSize <ratio> (with --settle): a capture under ratio × the recent frames' median PNG size is blank or missing tiles; seek again and recapture
//          --look <ramp>[:map|poster|lift] regrades the whole frame onto one group's portrait ramp (rigs/fu-look.jsx), for
//          trying the testimony-portrait look on a finished shot without touching its scene code (see LOOK.md)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_W = 3840, OUT_H = 2160;

// ── args ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const page = argv.find((a) => !a.startsWith('--') && /\.html$/.test(a));
if (!page) { console.error('usage: node tools/render.mjs "<shot>.dc.html" [options]'); process.exit(1); }
const opt = (name, def) => { const i = argv.indexOf('--' + name); return i < 0 ? def : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const fps = Number(opt('fps', 25));
const sets = opt('set', null) ? Object.fromEntries(String(opt('set')).split(',').map((kv) => kv.split('='))) : {};
const half = !!opt('half', false);
const look = opt('look', null);
const slug = [path.basename(page).replace(/\.dc\.html$|\.html$/, ''), ...Object.values(sets), look ? 'look-' + look : '', half ? 'half' : '']
  .filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-');
const outDir = path.resolve(ROOT, opt('out', path.join('renders', slug)));
fs.mkdirSync(outDir, { recursive: true });

// ── project files are served from disk via request routing (file:// blocks the .jsx fetches,
//    and a loopback server would be sent through the network proxy)
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.jsx': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const base = 'http://fu.local/';

// ── browser ─────────────────────────────────────────────────────────────────
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
// the pinned Playwright may expect a browser build this machine does not have; fall back to the pre-installed Chromium
let browser;
try { browser = await chromium.launch({ proxy }); }
catch (e) {
  if (!fs.existsSync('/opt/pw-browsers/chromium')) throw e;
  browser = await chromium.launch({ proxy, executablePath: '/opt/pw-browsers/chromium' });
}
const ctx = await browser.newContext({ viewport: { width: OUT_W, height: OUT_H }, deviceScaleFactor: half ? 0.5 : 1 });
const tab = await ctx.newPage();
tab.on('pageerror', (e) => console.error('[page error]', e.message));
tab.on('requestfailed', (r) => console.error('[request failed]', r.url(), r.failure() && r.failure().errorText));
tab.on('console', (m) => m.type() === 'error' && console.error('[console]', m.text()));
const serveFile = (route, p, root) => {
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return route.fulfill({ status: 404 });
  return route.fulfill({ status: 200, contentType: TYPES[path.extname(p)] || 'application/octet-stream', body: fs.readFileSync(p) });
};
await tab.route(base + '**', (route) => serveFile(route, path.join(ROOT, decodeURIComponent(new URL(route.request().url()).pathname)), ROOT));
// support.js pulls React, ReactDOM and Babel from unpkg; serve the pinned copies from node_modules instead
const NM = path.join(ROOT, 'node_modules');
await tab.route('https://unpkg.com/**', (route) => {
  const m = new URL(route.request().url()).pathname.match(/^\/((?:@[^/]+\/)?[^@/]+)@[^/]+\/(.+)$/);
  return m ? serveFile(route, path.join(NM, m[1], m[2]), NM) : route.fulfill({ status: 404 });
});
// web fonts only matter for the narration caption, which is off for renders
await tab.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));

// tweak overrides go in before the page's own scripts read TWEAK_DEFAULTS
const tweaks = { referenceOverlay: !!opt('guide', false), lineBoil: !opt('noBoil', false) };
if (opt('boilAmp', null) != null) tweaks.boilAmp = Number(opt('boilAmp'));
for (const [k, v] of Object.entries(sets)) tweaks[k] = v === 'true' ? true : v === 'false' ? false : isNaN(Number(v)) ? v : Number(v);
await tab.addInitScript((tw) => {
  let v;
  Object.defineProperty(window, 'TWEAK_DEFAULTS', { configurable: true, get: () => v, set: (x) => { v = Object.assign({}, x, tw); } });
}, tweaks);

await tab.goto(base + encodeURI(page), { waitUntil: 'networkidle' });
const SEL = 'svg[data-om-exportable-video-with-duration-secs]';
await tab.waitForSelector(SEL, { state: 'attached', timeout: 60000 });
// show the stage 1:1 at the top-left and hide all chrome (play bar, tweaks panel)
await tab.addStyleTag({ content: `
  ${SEL}{position:fixed!important;left:0!important;top:0!important;transform:none!important;box-shadow:none!important;z-index:2147483647}
  [data-omelette-chrome]{display:none!important}` });
await tab.evaluate(() => document.fonts && document.fonts.ready);
if (look) {
  // the look kit is plain JSX; load it into the page with the runtime's own Babel if the shot does not import it already
  const [ramp, mode = 'map'] = String(look).split(':');
  await tab.evaluate(async ({ ramp, mode }) => {
    if (!window.FU_LOOK) {
      const src = await (await fetch('./rigs/fu-look.jsx')).text();
      (0, eval)(window.Babel.transform(src, { presets: ['react'] }).code);
    }
    document.body.insertAdjacentHTML('beforeend', window.FU_LOOK.lookFilterMarkup(ramp, mode));
  }, { ramp, mode });
  await tab.addStyleTag({ content: `${SEL}{filter:url(#fu-look)!important}` });
}

const info = await tab.evaluate((sel) => {
  const svg = document.querySelector(sel);
  return { total: Number(svg.getAttribute('data-om-exportable-video-with-duration-secs')), scenes: JSON.parse(window.OM_SCENES || '[]') };
}, SEL);
const total = Math.round(info.total * fps);

// ── which frames ────────────────────────────────────────────────────────────
let frames;
if (opt('frames', null)) frames = String(opt('frames')).split(',').map(Number);
else if (opt('boundaries', false)) {
  const s = new Set([0, total - 1]);
  let t = 0;
  for (const sc of info.scenes) { const f = Math.round(t * fps); [f - 1, f].forEach((x) => x >= 0 && x < total && s.add(x)); t += sc.dur; }
  frames = [...s].sort((a, b) => a - b);
} else frames = Array.from({ length: total }, (_, i) => i);

console.log(`${page}: ${info.total}s = ${total} frames @ ${fps} fps → ${outDir}`);
const seek = (t) => tab.evaluate(({ sel, t }) => new Promise((res) => {
  document.querySelector(sel).dispatchEvent(new CustomEvent('data-om-seek-to-time-frame', { detail: { time: t, sync: true } }));
  requestAnimationFrame(() => requestAnimationFrame(res));
}), { sel: SEL, t });

const settle = Number(opt('settle', 0)) || 0;
const minSize = Number(opt('minSize', 0)) || 0, sizes = [];   // with --settle: reject captures under minSize × the recent median PNG size
const clip = { x: 0, y: 0, width: OUT_W, height: OUT_H };
const t0 = Date.now();
for (const [n, f] of frames.entries()) {
  await seek(f / fps);
  const file = path.join(outDir, `${slug}_${String(f).padStart(4, '0')}.png`);
  if (!settle) await tab.screenshot({ path: file, clip });
  else {
    const capture = async () => {
      await tab.waitForTimeout(settle);
      let prev = await tab.screenshot({ clip });
      for (let tries = 0; tries < 6; tries++) {
        await tab.waitForTimeout(settle);
        const cur = await tab.screenshot({ clip });
        if (cur.equals(prev)) break;
        prev = cur;
      }
      return prev;
    };
    let shot = await capture();
    // --minSize: a capture much smaller than the recent good frames is blank or missing tiles (two blank captures
    // match, so the settle check alone lets them through); seek away and back, and capture again
    if (minSize && sizes.length) {
      const ref = [...sizes].sort((a, b) => a - b)[Math.floor(sizes.length / 2)];
      for (let tries = 0; tries < 10 && shot.length < minSize * ref; tries++) {
        console.log(`\n  frame ${f}: ${shot.length} bytes, under ${minSize} × ${ref}; capturing again`);
        await seek(((f + 1) % total) / fps);
        await tab.waitForTimeout(settle);
        await seek(f / fps);
        shot = await capture();
      }
    }
    if (shot.length >= minSize * (sizes.length ? [...sizes].sort((a, b) => a - b)[Math.floor(sizes.length / 2)] : 0)) { sizes.push(shot.length); if (sizes.length > 9) sizes.shift(); }
    fs.writeFileSync(file, shot);
  }
  if (n % 10 === 0 || n === frames.length - 1) process.stdout.write(`\r  frame ${n + 1}/${frames.length}`);
}
console.log(`\n  done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await browser.close();

// ── optional encodes (full sequence only) ───────────────────────────────────
const full = frames.length === total;
const pattern = path.join(outDir, `${slug}_%04d.png`);
if (full && opt('prores', false)) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', pattern, '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', path.join(outDir, `${slug}_4K_${fps}fps.mov`)], { stdio: 'inherit' });
  console.log('  wrote ProRes 4444');
}
if (full && opt('preview', false)) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', pattern, ...(half ? [] : ['-vf', 'scale=1920:1080:flags=lanczos']), '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', path.join(outDir, `${slug}_preview_1080p.mp4`)], { stdio: 'inherit' });
  console.log('  wrote 1080p preview');
}
