// ===== v3.28.x 验证脚本：群聊设置面板「群聊回复」概率/时间 + 群聊美化对齐聊天美化 =====
// 用法：SERVE_DIR=<临时构建产物目录> node tools/verify-gc-settings.mjs
// 背景：内置 gc-prob / gc-rs-min / gc-rs-max（全局=全部联系人）此前无 UI，本批在群聊设置
//      面板 renderMainSettingsView 新增「群聊回复」段（3 个 stepper，写 window.saveReplyCfg、
//      读 window.groupChatCfg）；群聊美化补齐气泡边缘圆角/时间轴颜色/正在输入颜色并移植
//      完整「美化方案」（保存/应用/改名/删除/导出/导入）。
// 断言：S* 静态锚（src 直查），R* 运行时（无头 Chrome 走真实产物）。
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { join, normalize, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = normalize(dirname(fileURLToPath(import.meta.url)) + '/..');
const serveDir = normalize(process.env.SERVE_DIR || root);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
function check(desc, ok, detail) {
  results.push(ok);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + desc + (detail ? '  [' + detail + ']' : ''));
}

// ---- 静态锚（对 src 断言） ----
const src = readFileSync(join(root, 'src/js/group-chat.js'), 'utf8');
const css = readFileSync(join(root, 'src/css/group-chat.css'), 'utf8');
const dark = readFileSync(join(root, 'src/css/dark.css'), 'utf8');
check('S1a 群聊美化默认值含气泡边缘圆角', /'bubble-radius': '18px'/.test(src));
check('S1b 群聊美化默认值含时间轴颜色/正在输入颜色', /'time-ink': '#111111', 'typing-ink': '#8a8a8a'/.test(src));
check('S1c 深色模式默认补时间轴颜色', /'in-ink': '#f0f0f0', 'send-bg': '#f0f0f0', 'send-ink': '#111111', 'time-ink': '#8a8a8a'/.test(src));
check('S2 applyGcBeauty 输出三个新 CSS 变量（作用于 #page-group-chat）',
  /--chat-bubble-radius/, /--msg-time-ink/, /--typing-ink/ .test && ['--chat-bubble-radius','--msg-time-ink','--typing-ink'].every(v => src.includes("setProperty('" + v + "'")));
check('S3 群聊回复段存在（三个 stepper 键）',
  ['gc-prob','gc-rs-min','gc-rs-max'].every(k => src.includes("gcStepperRow('", k) || src.includes(k)));
check('S4 美化视图含圆角/时间轴颜色/正在输入颜色/美化方案入口',
  ['气泡边缘圆角','时间轴颜色','正在输入颜色','保存当前为美化方案','美化方案管理'].every(s => src.includes("'" + s + "'")));
check('S5 滑块逻辑（0-40）', /slider: \{\s*min: 0, max: 40/.test(src));
check('S6 群聊分数方案钩子挂到 window', /window\.saveGcBeautyScheme = function/.test(src) && /window\.openGcBeautySchemes = function/.test(src));
check('S7 .gc-set-stepper 样式在位', css.includes('.gc-set-stepper'));
check('S8 深色模式 stepper 文字色在位', dark.includes('.gc-set-stepper .txt'));

// ---- 运行时（无头 Chrome 端到端） ----
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const server = createServer((req, res) => {
  try {
    let p = normalize(join(serveDir, decodeURIComponent(req.url.split('?')[0])));
    if (!p.startsWith(serveDir)) { res.writeHead(403); res.end(); return; }
    if (statSync(p).isDirectory()) p = join(p, 'index.html');
    res.writeHead(200, { 'Content-Type': types[extname(p)] || 'application/octet-stream' });
    res.end(readFileSync(p));
  } catch (e) { res.writeHead(404); res.end('nf'); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const baseUrl = 'http://127.0.0.1:' + server.address().port;

const chromePath = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].filter(Boolean).find((p) => { try { return statSync(p).isFile(); } catch (e) { return false; } });
if (!chromePath) { console.error('找不到 Chrome/Edge，请设置 CHROME_PATH'); process.exit(1); }

const cdpPort = 9300 + Math.floor(Math.random() * 400);
const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--user-data-dir=' + join(process.env.TEMP || '/tmp', 'mochi-gc-' + Date.now()),
  '--remote-debugging-port=' + cdpPort, 'about:blank'
], { stdio: 'ignore' });

let ws = null, msgId = 0;
const pend = new Map();
async function connect() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch('http://127.0.0.1:' + cdpPort + '/json')).json();
      const page = list.find((t) => t.type === 'page');
      if (page) {
        ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
        ws.onmessage = (ev) => {
          const m = JSON.parse(ev.data);
          if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); }
        };
        return;
      }
    } catch (e) {}
    await sleep(150);
  }
  throw new Error('无法连接无头浏览器');
}
function cdp(method, params = {}) {
  const id = ++msgId;
  return new Promise((res) => { pend.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
}
async function evalJs(expr) {
  try {
    const r = await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r && r.exceptionDetails) return 'EVAL-ERR ' + JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text).slice(0, 300);
    return r && r.result ? r.result.value : null;
  } catch (e) { return null; }
}
const J = async (expr) => JSON.parse((await evalJs('(' + expr + ')')) || '{}');

await connect();
await cdp('Page.enable');
await cdp('Runtime.enable');
await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
await cdp('Page.navigate', { url: baseUrl + '/index.html' });
await sleep(2500);
for (let i = 0; i < 40; i++) { if (await evalJs('!!window.__mochiDataReady')) break; await sleep(300); }

// 打开群聊页（不依赖桌面导航：直接显示页面并点击内置设置入口）
await evalJs("(function(){document.querySelectorAll('.page').forEach(function(p){p.hidden=(p.id!=='page-group-chat');});return 1;})()");
await evalJs("(function(){var el=document.getElementById('gc-more-settings');if(el){el.click();return 1;}return 0;})()");
await sleep(600);

const panelState = await evalJs("(function(){var b=document.getElementById('gc-set-body');if(!b)return 'NOBODY';return JSON.stringify({open:!document.getElementById('gc-settings-panel').hidden,title:!!Array.from(b.querySelectorAll('*')).find(function(e){return e.textContent&&e.textContent.trim()==='群聊回复';}),steppers:Array.from(b.querySelectorAll('.gc-set-stepper')).map(function(s){var st=s.querySelector('.stepper');return st?st.getAttribute('data-k'):null;})});})()");
check('R1 群聊设置面板打开且出现「群聊回复」段', panelState !== 'NOBODY', panelState);
let ps = {};
try { ps = JSON.parse(panelState); } catch (e) {}
check('R2 三个 stepper 键位在面板内（gc-prob/gc-rs-min/gc-rs-max）',
  ['gc-prob','gc-rs-min','gc-rs-max'].every(k => ps.steppers && ps.steppers.includes(k)), JSON.stringify(ps.steppers));

// 概率：默认 60，点 + → 65；写全局
await evalJs("(function(){var el=document.querySelector('#gc-set-body .stepper[data-k=\"gc-prob\"] .stp-max');if(el){el.click();}return 1;})()");
await sleep(300);
let g = await J("(function(){return JSON.stringify(window.groupChatCfg()['gc-prob']);})()");
check('R3 回复概率点 ＋ 变 65（写全局群聊配置）', g === 65, String(g));

// 概率：直接输入 42 → 就近 5 的倍数 40
await evalJs("(function(){var el=document.querySelector('#gc-set-body .stepper[data-k=\"gc-prob\"] .stp-val');el.value='42';el.dispatchEvent(new Event('change',{bubbles:true}));return 1;})()");
await sleep(300);
g = await J("(function(){return JSON.stringify(window.groupChatCfg()['gc-prob']);})()");
check('R4 概率直接输入 42 收为 40 保存', g === 40, String(g));

// 速度最短：默认 1，点 ＋ → 2
await evalJs("(function(){var el=document.querySelector('#gc-set-body .stepper[data-k=\"gc-rs-min\"] .stp-max');if(el){el.click();}return 1;})()");
await sleep(300);
g = await J("(function(){return JSON.stringify(window.groupChatCfg()['gc-rs-min']);})()");
check('R5 回复速度最短 1 → 2', g === 2, String(g));

// 速度最长：默认 40，点 － → 39
await evalJs("(function(){var el=document.querySelector('#gc-set-body .stepper[data-k=\"gc-rs-max\"] .stp-min');if(el){el.click();}return 1;})()");
await sleep(300);
g = await J("(function(){return JSON.stringify(window.groupChatCfg()['gc-rs-max']);})()");
check('R6 回复速度最长 40 → 39', g === 39, String(g));

// 美化视图：点击「美化聊天」入口（.gc-set-link） → 断言新增行
await evalJs("(function(){var el=document.querySelector('#gc-set-body .gc-set-link');if(el){el.click();return 1;}return 0;})()");
await sleep(500);
const beautyState = await evalJs("(function(){var b=document.getElementById('gc-set-body');var t=b?b.innerText:'';return JSON.stringify({radius:t.indexOf('气泡边缘圆角')>=0,time:t.indexOf('时间轴颜色')>=0,typing:t.indexOf('正在输入颜色')>=0,save:t.indexOf('保存当前为美化方案')>=0,manage:t.indexOf('美化方案管理')>=0});})()");
let bs = {}; try { bs = JSON.parse(beautyState); } catch (e) {}
check('R7 美化视图含气泡边缘圆角', bs.radius === true, beautyState);
check('R8 美化视图含时间轴颜色', bs.time === true, '');
check('R9 美化视图含正在输入颜色', bs.typing === true, '');
check('R10 美化视图含美化方案保存/管理入口', bs.save === true && bs.manage === true, '');

// 数据路径：applyGcBeautyData 立即改 CSS 变量（作用于 #page-group-chat）
const cssVar = await evalJs("(function(){window.applyGcBeautyData({'bubble-radius':'30px','time-ink':'#ff0000','typing-ink':'#00ff00'});var p=document.getElementById('page-group-chat');var c=window.getComputedStyle(p);return JSON.stringify({r:c.getPropertyValue('--chat-bubble-radius').trim(),t:c.getPropertyValue('--msg-time-ink').trim(),y:c.getPropertyValue('--typing-ink').trim(),persist:JSON.parse((window.xyStore?window.xyStore('xy-home-v2').get('gc-beauty'):'{}')||'{}')['bubble-radius']});})()");
let cv = {}; try { cv = JSON.parse(cssVar); } catch (e) {}
check('R11 应用方案后 --chat-bubble-radius=30px（气泡圆角即时生效）', cv.r === '30px', cssVar);
check('R12 --msg-time-ink=#ff0000（时间轴颜色即时生效）', cv.t === '#ff0000', '');
check('R13 --typing-ink=#00ff00（正在输入颜色即时生效）', cv.y === '#00ff00', '');
check('R14 方案写入全局 gc-beauty 持久化', cv.persist === '30px', '');

// 方案管理：保存当前为方案 → 管理列表出现
await evalJs("(function(){if(window.saveGcBeautyScheme){window.saveGcBeautyScheme();return 1;}return 0;})()");
await sleep(400);
await evalJs("(function(){var m=document.getElementById('gc-beauty-save-modal');if(!m)return 0;var inp=m.querySelector('input');if(inp){inp.value='我的简约白';inp.dispatchEvent(new Event('input',{bubbles:true}));}var btn=Array.from(m.querySelectorAll('button')).find(function(b){return b.textContent.trim()==='保存方案';});if(btn){btn.click();return 1;}return 0;})()");
await sleep(400);
await evalJs("(function(){if(window.openGcBeautySchemes){window.openGcBeautySchemes();return 1;}return 0;})()");
await sleep(400);
const listState = await evalJs("(function(){var m=document.getElementById('gc-beauty-scheme-manager');if(!m)return 'NOMODAL';return JSON.stringify({visible:(m.style.display||m.hidden),has:m.innerText.indexOf('我的简约白')>=0,n:Array.from(m.querySelectorAll('button')).filter(function(b){return ['应用','改名','删除','导出方案','导入方案','预览'].indexOf(b.textContent.trim())>=0;}).length});})()");
let ls = {}; try { ls = JSON.parse(listState); } catch (e) {}
check('R15 保存方案后管理列表出现该方案', ls.has === true, listState);
check('R16 方案管理含 应用/改名/删除/导出/导入/预览 操作按钮', ls.n >= 6, 'n=' + ls.n);

chrome.kill();
server.close();
const pass = results.filter(Boolean).length;
console.log('\n' + pass + '/' + results.length + ' 通过');
process.exit(pass === results.length ? 0 : 1);