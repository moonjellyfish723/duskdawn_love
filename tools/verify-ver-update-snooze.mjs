// #225 顶部更新条「一直重复提醒」收口 行为验证（纯 Node + vm 跑真实源码，零浏览器依赖）
// 报障：v3.26.x 按版本 ack（ver-update-ack-ts）之后用户仍反馈顶部更新条一直重复提醒。
// 残留三洞：① ack 只在点按钮时写——不点按钮同版本每次打开都弹；② SW 通道拉 version.json
// 失败时 showVerBar() 无 ts 照弹，绕过 ack；③ 一天多部署 × 按版本 ack = 每部署必弹。
// 修复：showVerBar 弹条门追加 verSnoozed 时间维免打扰（24h）——ver-update-notify 弹条即记
//（同版本含 ts 未知 24h 不二弹）；ver-update-snooze 点稍后/刷新时记（24h 内任何版本不弹）。
// 本脚本从 src/js/pwa.js 抽取 ver-update 段真实源码，在 vm 沙箱里逐场景跑行为断言。
// 用法：node tools/verify-ver-update-snooze.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const text = readFileSync(new URL('../src/js/pwa.js', import.meta.url), 'utf8');
const S0 = "const VER_ACK_KEY = 'xy-home-v2:ver-update-ack-ts';";
const S1 = '// ================= v3.6.x：新版本检测';
const s = text.indexOf(S0);
const e = text.indexOf(S1, s);
if (s < 0 || e < 0 || e <= s) { console.error('抽取失败：找不到 ver-update 源码段锚点'); process.exit(2); }
const src = text.slice(s, e);

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name); } };
const HOUR = 3600 * 1000;
const ACK = 'xy-home-v2:ver-update-ack-ts';
const NOTIFY = 'xy-home-v2:ver-update-notify';
const SNOOZE = 'xy-home-v2:ver-update-snooze';

// 沙箱环境：stub localStorage/document/toast/refreshNow；返回存储、假元素、上下文
function makeEnv(lsInit) {
  const store = Object.assign({}, lsInit);
  const els = {
    'ver-update-bar': { hidden: true },
    'ver-update-refresh': { onclick: null },
    'ver-update-close': { onclick: null },
  };
  const sb = {
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    document: { getElementById: (id) => els[id] || null },
    toast: () => { sb.__toasted = (sb.__toasted || 0) + 1; },
    refreshNow: () => { sb.__refreshed = (sb.__refreshed || 0) + 1; },
    Date, Number, String, isNaN,
  };
  vm.createContext(sb);
  vm.runInContext(src, sb);
  return { store, els, sb };
}

// ---- 结构断言 ----
ok(src.includes("if (_verBarShown || !verShouldNotify(onlineTs) || verSnoozed(onlineTs)) return;"), '弹条门含 verSnoozed 免打扰（三条件与序）');
ok(src.indexOf('verMarkNotify(onlineTs)') > -1 && src.indexOf('verMarkNotify(onlineTs)') < src.indexOf("getElementById('ver-update-bar')"), '弹条即记 notify（先于 barEl 判定，不依赖点按钮）');
ok(/VER_SNOOZE_MS = 24 \* 60 \* 60 \* 1000/.test(src), '免打扰窗=24h');
ok(src.includes('verMarkAck(onlineTs); verMarkSnooze();') || (src.includes('verMarkAck(onlineTs); verMarkSnooze(); ')), '稍后/刷新按钮同时写 ack+snooze');

// ---- A 首次提醒（底线不回退）：空存储弹出新版本 ----
{
  const env = makeEnv({});
  vm.runInContext('showVerBar(1000);', env.sb);
  ok(env.els['ver-update-bar'].hidden === false, 'A1 空存储新版本 → 弹条（首提功能保留）');
  ok(String(env.store[NOTIFY] || '').indexOf('1000|') === 0, 'A2 弹条即记 notify=1000|时刻');
  ok(env.store[ACK] == null, 'A3 未点按钮不写 ack（ack 语义不变）');
}

// ---- B 同版本·用户没点按钮·重开（洞①核心）：有同版本 notify 记录 → 不再弹 ----
{
  const env = makeEnv({ [NOTIFY]: '1000|' + Date.now() });
  vm.runInContext('showVerBar(1000);', env.sb);
  ok(env.els['ver-update-bar'].hidden === true, 'B1 同版本 24h 内重开 → 不再弹（洞①修复）');
}

// ---- C SW 弱网通道 unknown ts（洞②核心）：有 notify 记录 → 无 ts 不再照弹 ----
{
  const env = makeEnv({ [NOTIFY]: '1000|' + Date.now() });
  vm.runInContext('showVerBar(undefined);', env.sb);
  ok(env.els['ver-update-bar'].hidden === true, 'C1 ts 未知（拉版本失败）+ 24h 内弹过 → 不弹（洞②修复）');
}
// ---- D 全新用户 unknown ts：宁多勿漏保留 ----
{
  const env = makeEnv({});
  vm.runInContext('showVerBar(undefined);', env.sb);
  ok(env.els['ver-update-bar'].hidden === false, 'D1 全新用户 ts 未知 → 照弹（宁多勿漏不丢）');
}

// ---- E 点「稍后」：hidden + ack + snooze 三写 ----
{
  const env = makeEnv({});
  vm.runInContext('showVerBar(1000);', env.sb);
  vm.runInContext("document.getElementById('ver-update-close').onclick();", env.sb);
  ok(env.els['ver-update-bar'].hidden === true, 'E1 稍后 → 条收起');
  ok(env.store[ACK] === '1000', 'E2 稍后 → 写 ack=1000');
  ok(Math.abs(Number(env.store[SNOOZE]) - Date.now()) < 5000, 'E3 稍后 → 写 snooze');
}

// ---- F 稍后 24h 内新部署（洞③核心）：按版本 ack 拦不住（2000>1000），snooze 压制 ----
{
  const env = makeEnv({ [ACK]: '1000', [SNOOZE]: String(Date.now() - 2 * HOUR) });
  vm.runInContext('showVerBar(2000);', env.sb);
  ok(env.els['ver-update-bar'].hidden === true, 'F1 稍后 2h 后新部署 → 全静默（洞③修复）');
}
// ---- G 24h 后恢复提醒：snooze/notify 过期 + 新版本 → 弹 ----
{
  const env = makeEnv({ [ACK]: '1000', [SNOOZE]: String(Date.now() - 25 * HOUR), [NOTIFY]: '1000|' + (Date.now() - 25 * HOUR) });
  vm.runInContext('showVerBar(2000);', env.sb);
  ok(env.els['ver-update-bar'].hidden === false, 'G1 25h 后新版本 → 恢复弹条（不停更不漏新版）');
}
// ---- H 同版本 24h 后（用户始终不点）：低频重提一次 ----
{
  const env = makeEnv({ [NOTIFY]: '1000|' + (Date.now() - 25 * HOUR) });
  vm.runInContext('showVerBar(1000);', env.sb);
  ok(env.els['ver-update-bar'].hidden === false, 'H1 同版本 25h 后 → 允许再提（免打扰不过期不失效）');
}
// ---- I ack 兼容（v3.26.x 语义不变）：同版本 ack 拦住、更新版本放行 ----
{
  const env = makeEnv({ [ACK]: '1000' });
  vm.runInContext('showVerBar(1000);', env.sb);
  ok(env.els['ver-update-bar'].hidden === true, 'I1 已 ack 同版本 → 不弹（老语义保留）');
  const env2 = makeEnv({ [ACK]: '1000' });
  vm.runInContext('showVerBar(2000);', env2.sb);
  ok(env2.els['ver-update-bar'].hidden === false, 'I2 已 ack 旧版本 + 新部署 → 弹（老语义保留）');
}
// ---- J 点「刷新使用新版」：ack+snooze+refreshNow ----
{
  const env = makeEnv({});
  vm.runInContext('showVerBar(1000);', env.sb);
  vm.runInContext("document.getElementById('ver-update-refresh').onclick();", env.sb);
  ok(env.sb.__refreshed === 1, 'J1 刷新按钮 → refreshNow 调用');
  ok(env.store[ACK] === '1000' && !!env.store[SNOOZE], 'J2 刷新按钮 → 写 ack+snooze');
}

console.log(fail ? 'verify-ver-update-snooze：' + fail + ' 断言失败' : 'verify-ver-update-snooze：' + pass + '/' + (pass + fail) + ' 全过');
process.exit(fail ? 1 : 0);
