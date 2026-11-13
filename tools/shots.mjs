// Captures the screenshots used on the portfolio card: node tools/shots.mjs
// Phone shots: 600-wide JPEGs in prototype/shots. Desktop shot: prototype/shots/web.jpg (1440×900).
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const SHOTS = path.join(ROOT, 'prototype', 'shots');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// A believable few days of progress so Home shows the streak, goal ring and Super Memory card.
const seed = lang => {
  const now = Date.now(), H = 3600e3, srs = {};
  ['essentials', 'conversation', 'restaurant'].forEach((t, ti) => {
    for (let i = 0; i < 8; i++) srs[`${t}-${i}`] = { box: ti === 2 ? (i % 3) : 2 + (i % 3), due: i % 4 === 0 ? now - H : now + (i + 1) * 24 * H };
  });
  srs['travel-0'] = { box: 1, due: now - H }; srs['travel-1'] = { box: 1, due: now + 5 * H };
  const day = new Date().toISOString().slice(0, 10);
  return { lang, xp: 640, today: { day, xp: 35 }, streak: 6, lastDay: day, srs: { [lang]: srs }, best: { [`${lang}:essentials`]: 100, [`${lang}:conversation`]: 92, [`${lang}:restaurant`]: 81 } };
};

fs.mkdirSync(SHOTS, { recursive: true });
const tmp = fs.mkdtempSync(path.join(ROOT, '.shots-'));
const port = 5700 + Math.floor(Math.random() * 200), dbg = port + 1000;
const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', ROOT], { stdio: 'ignore' });
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${dbg}`, `--user-data-dir=${tmp}/profile`, 'about:blank'], { stdio: 'ignore' });
try {
  let ws;
  for (let i = 0; i < 60 && !ws; i++) {
    try { const p = (await (await fetch(`http://127.0.0.1:${dbg}/json`)).json()).find(t => t.type === 'page'); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch {}
    if (!ws) await sleep(250);
  }
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = {};
  ws.onmessage = e => { const m = JSON.parse(e.data); if (pending[m.id]) { pending[m.id](m); delete pending[m.id]; } };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const origin = `http://127.0.0.1:${port}`;
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  const phone = () => send('Emulation.setDeviceMetricsOverride', { width: 390, height: 849, deviceScaleFactor: 2, mobile: true });
  const grab = async (file, { lang = 'es', js, width = 600, dark = false } = {}) => {
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' }] });
    await send('Page.navigate', { url: `${origin}/index.html` }); await sleep(1200);
    await send('Runtime.evaluate', { expression: `localStorage.clear(); localStorage.setItem('pesu.v1', ${JSON.stringify(JSON.stringify(seed(lang)))})` });
    await send('Page.navigate', { url: `${origin}/index.html?shot=${file}` }); await sleep(2500);
    if (js) { await send('Runtime.evaluate', { expression: `speechSynthesis.speak=()=>{};${js}`, awaitPromise: true }); await sleep(1500); }
    const s = await send('Page.captureScreenshot', { format: 'png' });
    const png = path.join(tmp, file + '.png');
    fs.writeFileSync(png, Buffer.from(s.result.data, 'base64'));
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '84', '--resampleWidth', String(width), png, '--out', path.join(SHOTS, file + '.jpg')], { stdio: 'pipe' });
  };
  const finishAnims = "document.querySelectorAll('.enter').forEach(n=>n.classList.remove('enter'));";
  await phone();
  await grab('home');
  await grab('learn-ja', { lang: 'ja', js: `startLesson('restaurant'); view.li=1; view.seen.add(1); render(); ${finishAnims}` });
  await grab('build-fr', { lang: 'fr', js: `startLesson('travel'); view.phase='practice'; buildQueue();
    let i=view.q.findIndex(e=>e.type==='build'); if(i<0){view.q.unshift(makeEx(view.items[2],'build')); i=0}
    view.qi=i; const ex=view.q[i]; const want=toks(ex.item); ex.ans=[ex.bank.find(b=>b.t===want[0]).k, ex.bank.find(b=>b.t===want[1]).k]; render(); ${finishAnims}` });
  await grab('picture-hi', { lang: 'hi', js: `startLesson('help'); view.phase='practice'; buildQueue();
    const ex=makeEx(view.items[0],'picture'); view.q.splice(view.qi,0,ex); ex.sel=ex.item.id; check(); ${finishAnims}` });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await grab('web', { width: 1440 });
  console.log('captured', fs.readdirSync(SHOTS).join(', '));
  ws.close();
} finally {
  const exited = new Promise(r => chrome.once('exit', r));
  chrome.kill(); server.kill();
  await Promise.race([exited, sleep(5000)]);
  fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
