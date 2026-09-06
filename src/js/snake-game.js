// ===== 双人贪吃蛇（聊天更多功能 · 我 vs TA，TA 带行为池 AI）=====
// 20×20 地图 / 双蛇同时移动 / 统一碰撞结算（公平）/ TA=生存判断+目标评分+概率行为池+冷却
// 难度（速度）+ 暂停 + 全屏 + 保存/继续对局（localStorage）
(function () {
  'use strict';
  // v3.15.x：地图格数动态化——半框固定 15×15 基准；全屏时按可视区实际剩余空间放大
  // （约 24px 一格，竖屏约 15×31），对局自身尺寸存在 state.gw/gh，跨全屏/半框恢复不丢档。
  // 物理与 AI 一律读 gW()/gH()（进行中对局用 state 尺寸，空闲态用下一局尺寸 GW/GH）。
  let GW = 15, GH = 15;
  const FS_CELL = 21;                  // 全屏地图目标格子尺寸（逻辑 px）——偏小让地图更大
  const INIT_LEN = 3;
  const FOOD_TARGET = 2;
  const PREFIX = (window.activePrefix && window.activePrefix()) || 'xy-home-v2';
  const KEY = PREFIX + ':snake-score';
  const SAVE_KEY = PREFIX + ':snake-saved';
  const PARTNER_KEY = PREFIX + ':lbl-partner';

  // 难度：tick 间隔(ms)按时间段 [0-30s, 30-60s, 60-90s, 90s+]
  // 配合 rAF 插值渲染，蛇身视觉连续滑动；逻辑步进间隔可适当放慢以保持可操作性
  const DIFFS = {
    easy:   { ticks: [200, 180, 160, 140] },
    normal: { ticks: [150, 130, 115, 100] },
    hard:   { ticks: [105, 90, 80, 70] }
  };

  const BEHAVIORS = {
    randomTurn:    { prob: 0.08, cd: 6000 },
    changeTarget:  { prob: 0.06, cd: 7000 },
    contestFood:   { prob: 0.20, cd: 5000 },
    giveUpContest: { prob: 0.10, cd: 5000 },
    chasePlayer:   { prob: 0.05, cd: 8000 },
    avoidPlayer:   { prob: 0.12, cd: 5000 },
    speedUp:       { prob: 0.03, cd: 10000 },
    pause:         { prob: 0.02, cd: 12000 },
    detour:        { prob: 0.07, cd: 7000 }
  };

  let panel, canvas, ctx, scoreEl, hintEl, startBtn, restartBtn, resumeBtn, resultEl, dpadEl, diffSel, pauseBtn, fsBtn, wallBtn, safeBtn, bestEl;
  let state = null;
  let behavior = null;
  let loopTimer = null, countdownTimer = null;
  let rafId = null;
  let lastFrameTime = 0, acc = 0;
  let prevPlayerBody = null, prevOppBody = null;
  let touchBase = null, lastTouchDir = null, lockAxis = null;
  let audioCtx = null;
  let paused = false;
  let isFs = false;
  let pauseAt = 0;
  let cssW = 360, cssH = 360, dpr = 1;   // 画布 CSS 尺寸（全屏由 setupCanvas 按剩余空间计算）
  let particles = [], floaters = [], renderLastTime = 0;
  const BEST_KEY = PREFIX + ':snake-best';

  // 当前生效的地图格数：进行中对局用自己的尺寸，空闲/下一局用视口推算的 GW/GH
  function gW() { return (state && state.gw) || GW; }
  function gH() { return (state && state.gh) || GH; }

  function vib(pattern) { try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {} }

  function $(id) { return document.getElementById(id); }

  function beep(freq, dur) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = freq; o.type = 'square'; g.gain.value = 0.14;   // v3.15.x：0.04→0.14，边听音乐边玩时音效清晰
      o.connect(g); g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.stop(audioCtx.currentTime + dur);
    } catch (e) {}
  }
  const SFX = {
    eat: function () { beep(880, 0.07); },
    hit: function () { beep(180, 0.18); },
    win: function () { beep(660, 0.12); setTimeout(function () { beep(880, 0.14); }, 130); }
  };

  function readScore() { try { return JSON.parse(localStorage.getItem(KEY) || '{"w":0,"l":0,"d":0}'); } catch (e) { return { w: 0, l: 0, d: 0 }; } }
  function writeScore(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function renderScore() {
    if (!scoreEl) return;
    const s = readScore();
    scoreEl.textContent = '胜 ' + s.w + ' · 负 ' + s.l + ' · 平 ' + s.d;
  }
  function readBest() { try { return JSON.parse(localStorage.getItem(BEST_KEY) || '{}'); } catch (e) { return {}; } }
  function writeBest(b) { try { localStorage.setItem(BEST_KEY, JSON.stringify(b)); } catch (e) {} }
  function renderBest() {
    if (!bestEl) return;
    const b = readBest();
    const diff = (state && state.diff) || (diffSel && diffSel.value) || 'normal';
    const cur = b[diff];
    if (!cur) { bestEl.hidden = true; return; }
    bestEl.textContent = '🏆 ' + (diff === 'easy' ? '慢' : diff === 'hard' ? '快' : '普通') + '档：最高 ' + cur.score + ' 分 · 最长 ' + cur.len;
    bestEl.hidden = false;
  }
  function updateBest(result) {
    try {
      const b = readBest();
      const diff = state.diff || 'normal';
      const cur = b[diff] || { score: 0, len: 0 };
      const ps = Math.floor(state.player.score);
      const pl = state.player.body.length;
      let changed = false;
      if (result === 'win' && ps > cur.score) { cur.score = ps; changed = true; }
      if (pl > cur.len) { cur.len = pl; changed = true; }
      if (changed) { b[diff] = cur; writeBest(b); }
    } catch (e) {}
  }
  function toggleFlag(name) {
    if (!state) return;
    if (!state.flags) state.flags = { wall: false, safe: false };
    state.flags[name] = !state.flags[name];
    const btn = name === 'wall' ? wallBtn : safeBtn;
    if (btn) btn.classList.toggle('on', state.flags[name]);
    if (name === 'wall' && hintEl && state.status === 'idle') hintEl.textContent = state.flags.wall ? '穿墙已开 · 点开始' : '点开始 · 滑动控制方向';
    if (name === 'safe' && hintEl && state.status === 'idle') hintEl.textContent = state.flags.safe ? '安全模式 · 点开始' : '点开始 · 滑动控制方向';
  }

  // 滚动区可放画布的空间：扣掉同屏兄弟块（计分/最长纪录/提示/结算/按钮/方向键）、
  // 它们之间的 flex gap（.snake-fs 用 gap:min(2vh,2vw)，漏算会让画布顶出屏、按钮被裁）与内边距。
  // 不做"至少 240×260"式的抬高：极矮/横屏下量到多少就用多少，格子 9px 下限 + 可滚动兜底接住。
  function scrollAvail() {
    const sc = panel.querySelector('.poke-card-scroll');
    let availW = (sc && sc.clientWidth) || window.innerWidth || 360;
    let availH = (sc && sc.clientHeight) || window.innerHeight || 360;
    if (sc && sc.clientHeight > 0) {
      const st = getComputedStyle(sc);
      let n = 0;   // 参与布局的兄弟块数；n 块 + 画布共 n+1 项，之间有 n 个 gap
      sc.querySelectorAll('.snake-score,.snake-best,.snake-hint,.snake-result:not([hidden]),.snake-controls,.snake-dpad').forEach(function (el) {
        if (el.hidden || !el.offsetHeight) return;   // display:none / hidden 的块不占空间也没有 gap
        const cs = getComputedStyle(el);
        availH -= el.offsetHeight + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
        n++;
      });
      availH -= (parseFloat(st.rowGap) || 0) * n;
      availH -= (parseFloat(st.paddingTop) || 0) + (parseFloat(st.paddingBottom) || 0);
      availW -= (parseFloat(st.paddingLeft) || 0) + (parseFloat(st.paddingRight) || 0);
    }
    return { w: Math.max(120, availW), h: Math.max(90, availH) };
  }
  // 按格子边长铺设画布，并用「实际溢出」自我校正：上一步的量算（字号换行、gap 取整、字体渲染）
  // 总有几像素偏差，而全屏滚动区是裁切的——溢出 1px 就是按钮被切一截，所以量 scrollHeight 再收，最多 4 轮。
  function applyCell(cell, minCell) {
    const sc = panel.querySelector('.poke-card-scroll');
    for (let i = 0; i < 4; i++) {
      cell = Math.max(minCell, cell);
      cssW = Math.round(cell * gW()); cssH = Math.round(cell * gH());
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      canvas.width = Math.round(cssW * dpr);       // 改位图尺寸会清空画布，调用方随后 render()
      canvas.height = Math.round(cssH * dpr);
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!sc || !sc.clientHeight) break;          // 面板未布局（隐藏）时量不到，下次打开/resize 会重算
      const over = sc.scrollHeight - sc.clientHeight;
      if (over <= 0 || cell <= minCell) break;
      cell -= over / gH();
    }
  }
  // 全屏：按当前地图把画布贴合到剩余空间（不改格数；开始按钮收起/结算块出现后调用）
  function fitCanvasBox() {
    if (!canvas || !isFs || !ctx) return;
    const av = scrollAvail();
    applyCell(Math.min(av.w / gW(), av.h / gH()), 9);
  }
  // 非全屏：画布贴齐滚动区剩余高度，保证「再来一局」按钮下方的方向键在小屏也一屏可见，无需再下拉滚动。
  function fitNonFsCanvas() {
    GW = 15; GH = 15;                // 半框固定 15×15 基准
    const av = scrollAvail();
    applyCell(Math.min(360, Math.max(160, Math.min(av.w, av.h))) / 15, 6);
  }
  function refitNonFs() {
    if (!canvas || !panel || panel.hidden || isFs) return;
    fitNonFsCanvas();
    if (ctx) render(0);
  }
  // 兄弟块显隐（最长纪录 / 结算 / 开始按钮）会改变可放画布的高度 → 按当前模式重铺一次
  function refitAll() {
    refitNonFs();                 // 非全屏：内部已 render
    if (!isFs) return;
    fitCanvasBox();
    render(0);                    // applyCell 改位图尺寸会清空画布
  }
  function setupCanvas() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    ctx = canvas.getContext('2d');   // 幂等，供 applyCell 重设 transform
    if (isFs) {
      // 全屏：空闲/结束态顺便把「下一局」地图按 FS_CELL 放大到接近满屏；
      // 进行中/暂停/倒计时不改格数（蛇身坐标仍有效），只适配画布。
      if (!state || state.status === 'idle' || state.status === 'over') {
        const av0 = scrollAvail();
        GW = Math.max(12, Math.min(34, Math.floor(av0.w / FS_CELL)));
        GH = Math.max(12, Math.min(46, Math.floor(av0.h / FS_CELL)));
      }
      fitCanvasBox();
    } else {
      fitNonFsCanvas();
    }
  }

  function initEls() {
    panel = $('chat-snake-panel');
    if (!panel) return;
    canvas = $('snake-canvas');
    setupCanvas();
    scoreEl = $('snake-score');
    hintEl = $('snake-hint');
    startBtn = $('snake-start');
    restartBtn = $('snake-restart');
    resumeBtn = $('snake-resume');
    resultEl = $('snake-result');
    dpadEl = $('snake-dpad');
    diffSel = $('snake-diff');
    pauseBtn = $('snake-pause');
    fsBtn = $('snake-fs');
    wallBtn = $('snake-wall');
    safeBtn = $('snake-safe');
    bestEl = $('snake-best');
    if (startBtn) startBtn.addEventListener('click', function (e) { e.stopPropagation(); startGame(diffSel ? diffSel.value : 'normal'); });
    if (restartBtn) restartBtn.addEventListener('click', function (e) { e.stopPropagation(); startGame(diffSel ? diffSel.value : 'normal'); });
    if (resumeBtn) resumeBtn.addEventListener('click', function (e) { e.stopPropagation(); resumeGame(); });
    if (pauseBtn) pauseBtn.addEventListener('click', function (e) { e.stopPropagation(); togglePause(); });
    if (fsBtn) fsBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleFs(); });
    if (wallBtn) wallBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleFlag('wall'); });
    if (safeBtn) safeBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleFlag('safe'); });
    const closeBtn = $('chat-snake-close');
    if (closeBtn) closeBtn.addEventListener('click', function (e) { e.stopPropagation(); closeSnakePanel(); });
    setupInput();
    document.addEventListener('contact-switched', function () { try { closeSnakePanel(); state = null; behavior = null; } catch (e) {} });
    window.addEventListener('resize', function () {
      if (!panel || panel.hidden) return;
      if (isFs) { setupCanvas(); render(0); }
    });
  }

  function setupInput() {
    if (!canvas) return;
    // 滑动控制：touchmove 实时识别方向 + 主轴锁定防误触，一次滑动可连续多次转向
    const TH = 12; // 转向触发阈值(px)
    canvas.addEventListener('touchstart', function (e) {
      const t = e.touches[0];
      touchBase = { x: t.clientX, y: t.clientY };
      lastTouchDir = null;
      lockAxis = null;
    }, { passive: true });
    canvas.addEventListener('touchmove', function (e) {
      if (!touchBase) return;
      const t = e.touches[0];
      const dx = t.clientX - touchBase.x, dy = t.clientY - touchBase.y;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (adx < TH && ady < TH) return;
      // #221 轴锁可解锁：锁定轴响应转向；另一轴偏移显著反超（>1.5×）时改锁并转向——
      // 原实现一次触摸锁死横/竖轴，L 形拖动（先右后上）必须抬手重滑才能转向＝「按了没反应」；
      // 1.5× 反超门槛让 45° 斜滑仍沿主轴走不抖动。
      let dir = null;
      if (lockAxis === 'h') {
        if (ady >= TH && ady > adx * 1.5) { lockAxis = 'v'; dir = dy > 0 ? 'd' : 'u'; }
        else if (adx >= TH) dir = dx > 0 ? 'r' : 'l';
      } else if (lockAxis === 'v') {
        if (adx >= TH && adx > ady * 1.5) { lockAxis = 'h'; dir = dx > 0 ? 'r' : 'l'; }
        else if (ady >= TH) dir = dy > 0 ? 'd' : 'u';
      } else {
        lockAxis = adx > ady ? 'h' : 'v';
        if (lockAxis === 'h') { if (adx >= TH) dir = dx > 0 ? 'r' : 'l'; }
        else { if (ady >= TH) dir = dy > 0 ? 'd' : 'u'; }
      }
      if (!dir) return;
      // #221 无论方向是否变化都把基点跟到当前点：同向重复滑动若不重置基点，
      // 位移在旧基点上持续累积，之后拐弯时另一轴偏移对累计位移的 1.5× 反超
      // 永远不成立 → L 形拖动拐不了弯（无头浏览器复现实测）。
      touchBase = { x: t.clientX, y: t.clientY };
      if (dir === lastTouchDir) return;
      if (dir === 'u') setPlayerDir(0, -1);
      else if (dir === 'd') setPlayerDir(0, 1);
      else if (dir === 'l') setPlayerDir(-1, 0);
      else setPlayerDir(1, 0);
      lastTouchDir = dir;
    }, { passive: true });
    canvas.addEventListener('touchend', function () {
      touchBase = null; lastTouchDir = null; lockAxis = null;
    }, { passive: true });
    canvas.addEventListener('touchcancel', function () {
      touchBase = null; lastTouchDir = null; lockAxis = null;
    }, { passive: true });
    if (dpadEl) {
      // #221 pointerdown 即时转向：原 click 依赖 touchend 后合成，移动端慢一拍且快速连点
      // 两键时第二次 click 可能不触发；pointerdown 原生即时，click 保留兜底（鼠标/无指针环境）。
      const dpPress = function (e) {
        const btn = e.target.closest('[data-dir]');
        if (!btn) return;
        e.stopPropagation();
        const d = btn.dataset.dir;
        if (d === 'up') setPlayerDir(0, -1);
        else if (d === 'down') setPlayerDir(0, 1);
        else if (d === 'left') setPlayerDir(-1, 0);
        else if (d === 'right') setPlayerDir(1, 0);
      };
      dpadEl.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse') return;   // 鼠标走 click，避免双触发
        dpPress(e);
      });
      dpadEl.addEventListener('click', dpPress);
    }
    document.addEventListener('keydown', function (e) {
      if (!panel || panel.hidden) return;
      if (!state || state.status !== 'playing') return;
      const k = e.key.toLowerCase();
      let used = true;
      if (k === 'arrowup' || k === 'w') setPlayerDir(0, -1);
      else if (k === 'arrowdown' || k === 's') setPlayerDir(0, 1);
      else if (k === 'arrowleft' || k === 'a') setPlayerDir(-1, 0);
      else if (k === 'arrowright' || k === 'd') setPlayerDir(1, 0);
      else used = false;
      if (used) e.preventDefault();
    });
  }

  function setPlayerDir(x, y) {
    if (!state || state.status !== 'playing') return;
    const p = state.player;
    if (!p.alive) return;
    // #221 双槽输入队列：nextDir 是「下一步」、nextDir2 是「下下一步」，一个 tick 内连给的
    // 两个转向（如急转弯 上→左）不再互相覆盖吞输入——单槽时后给的把先给的挤掉，玩家感知「按了没反应」。
    const last = p.nextDir2 || p.nextDir || p.dir;
    if (x === -last.x && y === -last.y) return;      // 相对「队尾方向」禁止 180° 回头
    if (last.x === x && last.y === y) return;        // 与队尾同向不重复入队
    if (!p.nextDir || (p.nextDir.x === p.dir.x && p.nextDir.y === p.dir.y && !p.nextDir2)) p.nextDir = { x: x, y: y };
    else if (!p.nextDir2) p.nextDir2 = { x: x, y: y };
    else { p.nextDir = p.nextDir2; p.nextDir2 = { x: x, y: y }; }
    vib(8);
  }

  function newGame(diff) {
    const py = Math.floor(GH / 2);
    const playerBody = [];
    for (let i = 0; i < INIT_LEN; i++) playerBody.push({ x: 4 - i, y: py });
    const oppBody = [];
    for (let i = 0; i < INIT_LEN; i++) oppBody.push({ x: (GW - 5) + i, y: py });
    const prevFlags = state && state.flags || { wall: false, safe: false };
    state = {
      diff: diff || 'normal',
      gw: GW, gh: GH,
      player: { body: playerBody, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, alive: true, score: 0, foodCount: 0 },
      opp:    { body: oppBody,    dir: { x: -1, y: 0 }, nextDir: { x: -1, y: 0 }, alive: true, score: 0, foodCount: 0 },
      foods: [],
      status: 'idle',
      startTime: 0,
      elapsed: 0,
      flags: { wall: prevFlags.wall, safe: prevFlags.safe }
    };
    if (wallBtn) wallBtn.classList.toggle('on', state.flags.wall);
    if (safeBtn) safeBtn.classList.toggle('on', state.flags.safe);
    behavior = { current: null, until: 0, stepLeft: 0, cooldowns: {}, targetFood: null, speedUp: false, speedUpUntil: 0 };
    particles = []; floaters = [];
    maintainFood();
  }

  function startGame(diff) {
    if (!panel || panel.hidden) return;
    stopLoop();
    paused = false;
    if (pauseBtn) pauseBtn.textContent = '⏸';
    if (startBtn) { startBtn.hidden = true; startBtn.textContent = '开始'; }
    if (restartBtn) restartBtn.hidden = true;
    if (resumeBtn) resumeBtn.hidden = true;
    if (resultEl) { resultEl.hidden = true; resultEl.innerHTML = ''; }
    newGame(diff);
    refitAll();     // 结算块/开始按钮收起后腾出的空间收归画布（不改格数）
    let n = 3;
    state.status = 'countdown';
    const countdownStep = function () {
      if (!state || state.status !== 'countdown') return;
      if (n > 0) {
        if (hintEl) hintEl.textContent = '准备 · ' + n;
        n--;
        countdownTimer = setTimeout(countdownStep, 700);
      } else {
        if (hintEl) hintEl.textContent = '滑动 / 方向键控制 · 别撞墙';
        state.status = 'playing';
        state.startTime = Date.now();
        startFrame();
      }
    };
    countdownStep();
  }

  // ---- rAF 主循环：累积时间步进 + 插值渲染 ----
  function startFrame() {
    stopFrame();
    lastFrameTime = 0;
    acc = 0;
    prevPlayerBody = cloneBody(state.player.body);
    prevOppBody = cloneBody(state.opp.body);
    rafId = requestAnimationFrame(frame);
  }
  function stopFrame() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }
  function cloneBody(b) {
    const out = [];
    for (let i = 0; i < b.length; i++) out.push({ x: b[i].x, y: b[i].y });
    return out;
  }
  function frame(now) {
    if (!state || state.status !== 'playing') { rafId = null; return; }
    if (!lastFrameTime) lastFrameTime = now;
    const dt = now - lastFrameTime;
    lastFrameTime = now;
    acc += dt;
    const ti = currentTickInterval();
    // 防止卡顿后追赶过多（如切后台回来），最多补 3 步
    let guard = 3;
    while (acc >= ti && guard > 0) {
      acc -= ti;
      // 保存 step 前位置作为本步插值起点
      prevPlayerBody = cloneBody(state.player.body);
      prevOppBody = cloneBody(state.opp.body);
      step();
      guard--;
      if (state.status !== 'playing') break;
    }
    if (state.status === 'playing') {
      const curTi = currentTickInterval();
      const alpha = Math.min(1, acc / curTi);
      render(alpha);
      rafId = requestAnimationFrame(frame);
    } else {
      rafId = null;
    }
  }

  function currentTickInterval() {
    const t = state.elapsed;
    const ticks = (DIFFS[state.diff || 'normal'] || DIFFS.normal).ticks;
    let base;
    if (t < 30000) base = ticks[0];
    else if (t < 60000) base = ticks[1];
    else if (t < 90000) base = ticks[2];
    else base = ticks[3];
    if (behavior && behavior.speedUp) base = Math.max(60, base - 35);
    return base;
  }

  function spawnParticles(pos, color) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
      const sp = 0.03 + Math.random() * 0.03;
      particles.push({ x: pos.x + 0.5, y: pos.y + 0.5, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 380, maxLife: 380, color: color });
    }
    floaters.push({ x: pos.x + 0.5, y: pos.y + 0.3, text: '+10', life: 700, maxLife: 700 });
  }

  function step() {
    if (!state || state.status !== 'playing') return;
    state.elapsed = Date.now() - state.startTime;
    applyDir(state.player);
    aiDecide();
    applyDir(state.opp);
    const r = resolveCollisions();
    if (!r.pDie) {
      state.player.body.unshift(r.pNew);
      if (r.pEat) { eatFood(r.pNew); state.player.score += 10; state.player.foodCount++; SFX.eat(); spawnParticles(r.pNew, '#34c759'); vib(12); }
      else state.player.body.pop();
    } else { state.player.alive = false; SFX.hit(); vib([20, 40, 20]); }
    if (!r.oDie) {
      state.opp.body.unshift(r.oNew);
      if (r.oEat) { eatFood(r.oNew); state.opp.score += 10; state.opp.foodCount++; spawnParticles(r.oNew, '#5ac8fa'); }
      else state.opp.body.pop();
    } else { state.opp.alive = false; }
    const ti = currentTickInterval();
    if (state.player.alive) state.player.score += ti / 1000;
    if (state.opp.alive) state.opp.score += ti / 1000;
    checkEnd();
  }

  function applyDir(snake) {
    // #221 每步只消费队列头一格：nextDir 生效后 nextDir2 顶上来，本 tick 给的第二个
    // 转向留给下一个 tick 执行（两个紧凑输入=两步各转一次，不再互相覆盖）。
    const q = snake.nextDir;
    if (q) { snake.nextDir = snake.nextDir2 || null; snake.nextDir2 = null; }
    if (q && (q.x !== -snake.dir.x || q.y !== -snake.dir.y)) snake.dir = q;
  }

  function bodySet(body, dropTail) {
    const s = {};
    const end = dropTail ? body.length - 1 : body.length;
    for (let i = 0; i < end; i++) s[body[i].x + ',' + body[i].y] = true;
    return s;
  }

  function resolveCollisions() {
    const p = state.player, o = state.opp;
    const ph = p.body[0], oh = o.body[0];
    const wall = state.flags && state.flags.wall;
    const safe = state.flags && state.flags.safe;
    let pNew = { x: ph.x + p.dir.x, y: ph.y + p.dir.y };
    let oNew = { x: oh.x + o.dir.x, y: oh.y + o.dir.y };
    if (wall) {
      pNew.x = (pNew.x + gW()) % gW(); pNew.y = (pNew.y + gH()) % gH();
      oNew.x = (oNew.x + gW()) % gW(); oNew.y = (oNew.y + gH()) % gH();
    }
    const pEat = state.foods.some(function (f) { return f.x === pNew.x && f.y === pNew.y; });
    const oEat = state.foods.some(function (f) { return f.x === oNew.x && f.y === oNew.y; });
    const pSelf = bodySet(p.body, !pEat);
    const oSelf = bodySet(o.body, !oEat);
    let pDie = false, oDie = false;
    if (!wall) {
      if (pNew.x < 0 || pNew.x >= gW() || pNew.y < 0 || pNew.y >= gH()) pDie = true;
      if (oNew.x < 0 || oNew.x >= gW() || oNew.y < 0 || oNew.y >= gH()) oDie = true;
    }
    if (!pDie && !safe && pSelf[pNew.x + ',' + pNew.y]) pDie = true; // 碰自己身（安全模式跳过）
    if (!oDie && !safe && oSelf[oNew.x + ',' + oNew.y]) oDie = true;
    if (!pDie && oSelf[pNew.x + ',' + pNew.y]) pDie = true; // 碰对方身
    if (!oDie && pSelf[oNew.x + ',' + oNew.y]) oDie = true;
    if (pNew.x === oNew.x && pNew.y === oNew.y) { pDie = true; oDie = true; }
    return { pNew: pNew, oNew: oNew, pEat: pEat, oEat: oEat, pDie: pDie, oDie: oDie };
  }

  function spawnFood() {
    const occ = {};
    state.player.body.forEach(function (s) { occ[s.x + ',' + s.y] = true; });
    state.opp.body.forEach(function (s) { occ[s.x + ',' + s.y] = true; });
    state.foods.forEach(function (f) { occ[f.x + ',' + f.y] = true; });
    const empty = [];
    for (let x = 0; x < gW(); x++) for (let y = 0; y < gH(); y++) if (!occ[x + ',' + y]) empty.push({ x: x, y: y });
    if (!empty.length) return null;
    return empty[Math.floor(Math.random() * empty.length)];
  }
  function maintainFood() {
    while (state.foods.length < FOOD_TARGET) {
      const f = spawnFood();
      if (!f) break;
      state.foods.push(f);
    }
  }
  function eatFood(pos) {
    for (let i = state.foods.length - 1; i >= 0; i--) {
      if (state.foods[i].x === pos.x && state.foods[i].y === pos.y) { state.foods.splice(i, 1); break; }
    }
    maintainFood();
  }

  function aiDecide() {
    const o = state.opp;
    if (!o.alive) return;
    behaviorTick();
    const head = o.body[0];
    const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
    const pHead = state.player.body[0];
    const wall = state.flags && state.flags.wall;
    const pNew = { x: pHead.x + state.player.dir.x, y: pHead.y + state.player.dir.y };
    if (wall) { pNew.x = (pNew.x + gW()) % gW(); pNew.y = (pNew.y + gH()) % gH(); }
    const candidates = [];
    dirs.forEach(function (d) {
      if (d.x === -o.dir.x && d.y === -o.dir.y) return;
      let nx = head.x + d.x, ny = head.y + d.y;
      if (wall) { nx = (nx + gW()) % gW(); ny = (ny + gH()) % gH(); }
      else if (nx < 0 || nx >= gW() || ny < 0 || ny >= gH()) return;
      const eat = state.foods.some(function (f) { return f.x === nx && f.y === ny; });
      for (let i = 0; i < o.body.length - (eat ? 0 : 1); i++) if (o.body[i].x === nx && o.body[i].y === ny) return;
      for (let i = 0; i < state.player.body.length - 1; i++) if (state.player.body[i].x === nx && state.player.body[i].y === ny) return;
      if (nx === pNew.x && ny === pNew.y) return;
      candidates.push(d);
    });
    if (!candidates.length) { o.nextDir = { x: o.dir.x, y: o.dir.y }; return; }
    const target = currentTarget();
    const scored = candidates.map(function (d) { return { d: d, score: scoreDirection(d, target, head) }; });
    scored.sort(function (a, b) { return b.score - a.score; });
    let chosen;
    if ((behavior.current === 'randomTurn' || behavior.current === 'detour') && scored.length >= 2) {
      chosen = scored[1].d;
    } else {
      chosen = scored[0].d;
    }
    o.nextDir = chosen;
  }

  function scoreDirection(d, target, head) {
    const nx = head.x + d.x, ny = head.y + d.y;
    let score = 0;
    if (target) {
      const dist = Math.abs(nx - target.x) + Math.abs(ny - target.y);
      const w = behavior.speedUp ? 4 : 2;
      score += (gW() + gH() - dist) * w;
    }
    score += floodFillSize(nx, ny) * 0.6;
    const o = state.opp;
    for (let i = 1; i < o.body.length; i++) {
      const s = o.body[i];
      const dd = Math.abs(nx - s.x) + Math.abs(ny - s.y);
      if (dd <= 1) score -= 8;
    }
    const pHead = state.player.body[0];
    const pd = Math.abs(nx - pHead.x) + Math.abs(ny - pHead.y);
    if (behavior.current === 'avoidPlayer') score -= (12 - pd) * 3;
    else if (behavior.current === 'chasePlayer') score += (12 - pd) * 2;
    return score;
  }

  function floodFillSize(sx, sy) {
    const blocked = {};
    state.player.body.forEach(function (s) { blocked[s.x + ',' + s.y] = true; });
    state.opp.body.forEach(function (s) { blocked[s.x + ',' + s.y] = true; });
    const visited = {};
    const q = [[sx, sy]];
    visited[sx + ',' + sy] = true;
    let count = 0;
    while (q.length && count < 100) {
      const cur = q.shift();
      count++;
      const adj = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      for (let i = 0; i < 4; i++) {
        const nx = cur[0] + adj[i][0], ny = cur[1] + adj[i][1], k = nx + ',' + ny;
        if (nx < 0 || nx >= gW() || ny < 0 || ny >= gH()) continue;
        if (visited[k] || blocked[k]) continue;
        visited[k] = true; q.push([nx, ny]);
      }
    }
    return count;
  }

  function currentTarget() {
    const o = state.opp;
    if (behavior.current === 'chasePlayer') return state.player.body[0];
    if (behavior.current === 'pause') return null;
    const foods = state.foods;
    if (!foods.length) return null;
    if (behavior.targetFood) {
      const t = foods.find(function (f) { return f.x === behavior.targetFood.x && f.y === behavior.targetFood.y; });
      if (t) return t;
    }
    const h = o.body[0];
    let best = foods[0], bd = Infinity;
    foods.forEach(function (f) { const d = Math.abs(f.x - h.x) + Math.abs(f.y - h.y); if (d < bd) { bd = d; best = f; } });
    return best;
  }

  function behaviorTick() {
    const now = state.elapsed;
    if (behavior.current) {
      if (behavior.stepLeft > 0) behavior.stepLeft--;
      else if (behavior.until > 0 && now < behavior.until) { }
      else clearBehavior();
    }
    if (behavior.speedUp && now >= behavior.speedUpUntil) behavior.speedUp = false;
    if (!behavior.current) {
      const names = Object.keys(BEHAVIORS);
      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        const cfg = BEHAVIORS[name];
        if (now < (behavior.cooldowns[name] || 0)) continue;
        if (!behaviorCondition(name)) continue;
        if (Math.random() < cfg.prob) { triggerBehavior(name, now); break; }
      }
    }
  }

  function clearBehavior() { behavior.current = null; behavior.until = 0; behavior.stepLeft = 0; }

  function behaviorCondition(name) {
    const o = state.opp, p = state.player;
    const oh = o.body[0], ph = p.body[0];
    const pd = Math.abs(oh.x - ph.x) + Math.abs(oh.y - ph.y);
    if (name === 'randomTurn' || name === 'detour') return true;
    if (name === 'changeTarget') return state.foods.length >= 2;
    if (name === 'contestFood') {
      return state.foods.some(function (f) {
        const od = Math.abs(f.x - oh.x) + Math.abs(f.y - oh.y);
        const ppd = Math.abs(f.x - ph.x) + Math.abs(f.y - ph.y);
        return od <= 5 && ppd <= 5;
      });
    }
    if (name === 'giveUpContest') return behavior.targetFood != null;
    if (name === 'chasePlayer') return pd <= 8;
    if (name === 'avoidPlayer') return pd <= 4;
    if (name === 'speedUp') return true;
    if (name === 'pause') return true;
    return false;
  }

  function triggerBehavior(name, now) {
    behavior.current = name;
    behavior.cooldowns[name] = now + BEHAVIORS[name].cd;
    if (name === 'randomTurn') behavior.stepLeft = 1 + Math.floor(Math.random() * 3);
    else if (name === 'detour') behavior.stepLeft = 2 + Math.floor(Math.random() * 4);
    else if (name === 'avoidPlayer') behavior.stepLeft = 1 + Math.floor(Math.random() * 3);
    else if (name === 'chasePlayer') behavior.until = now + 2000 + Math.floor(Math.random() * 2000);
    else if (name === 'speedUp') { behavior.speedUp = true; behavior.speedUpUntil = now + 2000 + Math.floor(Math.random() * 1000); behavior.until = behavior.speedUpUntil; }
    else if (name === 'pause') behavior.until = now + 500 + Math.floor(Math.random() * 500);
    else if (name === 'changeTarget') { behavior.until = now + 8000; switchTargetFood(); }
    else if (name === 'contestFood') { behavior.until = now + 6000; setContestFood(); }
    else if (name === 'giveUpContest') { behavior.targetFood = null; behavior.until = now + 200; }
  }

  function switchTargetFood() {
    const foods = state.foods;
    if (foods.length < 2) return;
    const h = state.opp.body[0];
    let best = null, bd = Infinity;
    foods.forEach(function (f) {
      if (behavior.targetFood && f.x === behavior.targetFood.x && f.y === behavior.targetFood.y) return;
      const d = Math.abs(f.x - h.x) + Math.abs(f.y - h.y);
      if (d < bd) { bd = d; best = f; }
    });
    if (best) behavior.targetFood = best;
  }

  function setContestFood() {
    const o = state.opp, p = state.player;
    const oh = o.body[0], ph = p.body[0];
    let best = null, bestSum = Infinity;
    state.foods.forEach(function (f) {
      const od = Math.abs(f.x - oh.x) + Math.abs(f.y - oh.y);
      const ppd = Math.abs(f.x - ph.x) + Math.abs(f.y - ph.y);
      if (od <= 5 && ppd <= 5 && od + ppd < bestSum) { bestSum = od + ppd; best = f; }
    });
    if (best) behavior.targetFood = best;
  }

  function checkEnd() {
    const pa = state.player.alive, oa = state.opp.alive;
    if (!pa && !oa) { endGame('draw'); return true; }
    if (!pa) { endGame('lose'); return true; }
    if (!oa) { endGame('win'); return true; }
    return false;
  }

  function endGame(survival) {
    if (!state) return;
    state.status = 'over';
    stopFrame();
    if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
    clearSaved();
    // v3.11.x：胜负按最终得分判定（用户反馈"我分数比他高却显示他赢、平局也显示他赢"）——
    // 原实现按存活判定（先死者即输），与面板展示的分数对比矛盾。改为：谁分高谁赢，
    // 同分为平局；存活结果仅用于触发结束（双方存活时游戏不会结束，行为不变）
    const psFinal = Math.floor(state.player.score), osFinal = Math.floor(state.opp.score);
    const result = psFinal > osFinal ? 'win' : psFinal < osFinal ? 'lose' : 'draw';
    if (result === 'win') SFX.win();
    const d = {
      result: result,
      pLen: state.player.body.length,
      oLen: state.opp.body.length,
      pFood: state.player.foodCount,
      oFood: state.opp.foodCount,
      pScore: psFinal,
      oScore: osFinal,
      time: Math.floor(state.elapsed / 1000)
    };
    const s = readScore();
    if (result === 'win') s.w++; else if (result === 'lose') s.l++; else s.d++;
    writeScore(s);
    updateBest(result);
    renderScore();
    renderBest();
    showResult(d);
    if (window.sendSnakeResult) window.sendSnakeResult(d);
  }

  function showResult(d) {
    if (!resultEl) return;
    const icon = d.result === 'win' ? '🏆' : d.result === 'lose' ? '💔' : '🤝';
    const resTxt = d.result === 'win' ? '你赢了' : d.result === 'lose' ? (window.taFit ? window.taFit('TA 赢了') : 'TA 赢了') : '平局';
    resultEl.innerHTML = '<div class="snake-res-icon">' + icon + '</div>' +
      '<div class="snake-res-title">' + resTxt + '</div>' +
      '<div class="snake-res-row"><span>🐍 你</span><span>长度 ' + d.pLen + ' · 食物 ' + d.pFood + ' · ' + d.pScore + '分</span></div>' +
      '<div class="snake-res-row"><span>🤖 ' + (window.taFit ? window.taFit('TA') : 'TA') + '</span><span>长度 ' + d.oLen + ' · 食物 ' + d.oFood + ' · ' + d.oScore + '分</span></div>' +
      '<div class="snake-res-time">存活 ' + d.time + ' 秒 · 已分享到聊天 ✓</div>';
    resultEl.hidden = false;
    resultEl.classList.remove('snake-res-pop');
    void resultEl.offsetWidth;
    resultEl.classList.add('snake-res-pop');
    if (restartBtn) restartBtn.hidden = false;
    if (hintEl) hintEl.textContent = '再来一局？';
    refitAll();     // 结算块+再来一局出现后收小画布：半框让方向键一屏可见，全屏防「再来一局」被裁到屏外
  }

  function render(alpha) {
    if (!ctx || !state) return;
    if (alpha == null) alpha = 0;
    const W = cssW, H = cssH;
    const cw = W / gW(), ch = H / gH(), cs = Math.min(cw, ch);
    const now = performance.now();
    const dt = renderLastTime ? Math.min(50, now - renderLastTime) : 16;
    renderLastTime = now;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f6f6f8';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 1;
    for (let i = 1; i < gW(); i++) { ctx.beginPath(); ctx.moveTo(i * cw, 0); ctx.lineTo(i * cw, H); ctx.stroke(); }
    for (let j = 1; j < gH(); j++) { ctx.beginPath(); ctx.moveTo(0, j * ch); ctx.lineTo(W, j * ch); ctx.stroke(); }
    // 食物：呼吸脉动
    const pulse = 1 + 0.12 * Math.sin(now / 220);
    state.foods.forEach(function (f) {
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(f.x * cw + cw / 2, f.y * ch + ch / 2, cs * 0.32 * pulse, 0, Math.PI * 2);
      ctx.fill();
    });
    drawSnake(state.player, prevPlayerBody, alpha, '#34c759', '#28a745');
    drawSnake(state.opp, prevOppBody, alpha, '#5ac8fa', '#3a9fd6');
    // 粒子
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx * dt / 16; p.y += p.vy * dt / 16;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * cw, p.y * ch, cs * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // 飘字 +10
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.life -= dt;
      if (f.life <= 0) { floaters.splice(i, 1); continue; }
      f.y -= dt / 280;
      ctx.globalAlpha = Math.min(1, f.life / 300);
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold ' + Math.floor(cs * 0.72) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.text, f.x * cw, f.y * ch);
    }
    ctx.globalAlpha = 1;
  }
  function drawSnake(snake, prevBody, alpha, headColor, bodyColor) {
    if (!snake.body.length) return;
    const cw = cssW / gW(), ch = cssH / gH(), cs = Math.min(cw, ch);
    const dead = !snake.alive;
    const bodyC = dead ? '#cfcfd4' : bodyColor;
    const headC = dead ? '#cfcfd4' : headColor;
    const interp = !dead && prevBody && alpha > 0 && alpha < 1;
    const pts = [];
    for (let i = 0; i < snake.body.length; i++) {
      const s = snake.body[i];
      let x = s.x, y = s.y;
      if (interp && prevBody[i]) {
        x = prevBody[i].x + (s.x - prevBody[i].x) * alpha;
        y = prevBody[i].y + (s.y - prevBody[i].y) * alpha;
      }
      pts.push({ x: x * cw + cw / 2, y: y * ch + ch / 2 });
    }
    // 身体：粗线段连续绘制（圆角端），穿墙跨边界时断开
    if (pts.length >= 2) {
      ctx.strokeStyle = bodyC;
      ctx.lineWidth = cs * 0.82;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[1].x, pts[1].y);
      for (let i = 2; i < pts.length; i++) {
        const ddx = pts[i].x - pts[i - 1].x, ddy = pts[i].y - pts[i - 1].y;
        if (Math.abs(ddx) > cw * 2 || Math.abs(ddy) > ch * 2) {
          ctx.stroke(); ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y);
        } else ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
    }
    // 头：稍大圆 + 高光
    ctx.fillStyle = headC;
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, cs * 0.46, 0, Math.PI * 2);
    ctx.fill();
    if (!dead) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.arc(pts[0].x - cs * 0.13, pts[0].y - cs * 0.13, cs * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- 暂停 / 继续 ----
  function togglePause() {
    if (!state) return;
    if (state.status === 'playing') {
      state.status = 'paused';
      stopFrame();
      pauseAt = Date.now();
      if (pauseBtn) pauseBtn.textContent = '▶';
      if (hintEl) hintEl.textContent = '已暂停 · 点 ▶ 继续';
      render(0); // 暂停时对齐到整格位置
    } else if (state.status === 'paused') {
      state.status = 'playing';
      state.startTime += Date.now() - pauseAt;
      if (pauseBtn) pauseBtn.textContent = '⏸';
      if (hintEl) hintEl.textContent = '滑动 / 方向键控制 · 别撞墙';
      startFrame();
    }
  }

  // ---- 全屏（面板占满视口，canvas 放大） ----
  function toggleFs() {
    isFs = !isFs;
    if (panel) panel.classList.toggle('snake-fs', isFs);
    if (fsBtn) fsBtn.textContent = isFs ? '⤢' : '⛶';
    setupCanvas();
    render(0);
  }

  // ---- 保存 / 恢复对局 ----
  function canSave(s) { return s && s.status === 'playing'; }
  function saveGame() {
    try {
      if (!canSave(state)) { localStorage.removeItem(SAVE_KEY); return; }
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {}
  }
  function validCoord(p, w, h) { return p && p.x >= 0 && p.x < w && p.y >= 0 && p.y < h; }
  function validState(s) {
    if (!s || !s.player || !s.opp) return false;
    // 存档自带地图尺寸（旧档无尺寸按 15×15），坐标必须落在该地图内
    const w = Math.max(10, Math.min(42, s.gw || 15));
    const h = Math.max(10, Math.min(48, s.gh || 15));
    s.gw = w; s.gh = h;
    if (!s.player.body.every(function (p) { return validCoord(p, w, h); }) || !s.opp.body.every(function (p) { return validCoord(p, w, h); })) return false;
    if (s.foods && !s.foods.every(function (p) { return validCoord(p, w, h); })) return false;
    return true;
  }
  function loadSaved() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || s.status !== 'playing') return null;
      if (!validState(s)) { clearSaved(); return null; }
      return s;
    } catch (e) { return null; }
  }
  function clearSaved() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
  function resumeGame() {
    const s = loadSaved();
    if (!s) return false;
    state = s;
    if (!state.flags) state.flags = { wall: false, safe: false };
    if (wallBtn) wallBtn.classList.toggle('on', state.flags.wall);
    if (safeBtn) safeBtn.classList.toggle('on', state.flags.safe);
    behavior = { current: null, until: 0, stepLeft: 0, cooldowns: {}, targetFood: null, speedUp: false, speedUpUntil: 0 };
    setupCanvas();   // 按存档自带地图尺寸重新适配画布（可能与当前视口推算尺寸不同）
    state.status = 'playing';
    state.startTime = Date.now() - state.elapsed;
    if (startBtn) { startBtn.hidden = true; startBtn.textContent = '开始'; }
    if (restartBtn) restartBtn.hidden = true;
    if (resumeBtn) resumeBtn.hidden = true;
    if (resultEl) { resultEl.hidden = true; resultEl.innerHTML = ''; }
    if (hintEl) hintEl.textContent = '滑动 / 方向键控制 · 别撞墙';
    paused = false;
    if (pauseBtn) pauseBtn.textContent = '⏸';
    render(0);
    startFrame();
    return true;
  }

  // ---- 面板开关 ----
  function openSnakePanel() {
    if (!panel) return;
    ['poke-card', 'emoji-panel', 'chat-ask-panel', 'chat-search', 'chat-divine-panel', 'chat-decision-panel', 'chat-rps-panel', 'chat-rp-panel', 'chat-call-panel', 'chat-pong-panel'].forEach(function (id) { const el = $(id); if (el) el.hidden = true; });
    if (window.closeAvlib) window.closeAvlib();
    const mp = $('chat-more-panel'); if (mp) mp.hidden = true;
    const nameEl = $('snake-partner-name');
    if (nameEl) nameEl.textContent = (typeof localStorage !== 'undefined' && localStorage.getItem(PARTNER_KEY)) || 'TA';
    // 先显示面板再切全屏：隐藏状态下量不到布局尺寸，setupCanvas 会拿到 0
    panel.hidden = false;
    renderScore();
    renderBest();   // 最长纪录行要先落到 DOM：toggleFs 会按当时可见的兄弟块量画布，晚一行就把按钮顶出屏
    // 手机端默认全屏（占满视口、地图按屏幕放大更好玩）；桌面端重置全屏
    const mobile = window.innerWidth < 900;
    if (mobile) { if (!isFs) toggleFs(); }
    else { if (isFs) toggleFs(); }
    paused = false;
    if (pauseBtn) pauseBtn.textContent = '⏸';
    if (canSave(state) && validState(state)) {
      state.status = 'playing';
      state.startTime = Date.now() - state.elapsed;
      setupCanvas();   // 恢复对局可能带自己的地图尺寸，重新适配画布
      if (startBtn) { startBtn.hidden = true; startBtn.textContent = '开始'; }
      if (restartBtn) restartBtn.hidden = true;
      if (resumeBtn) resumeBtn.hidden = true;
      if (resultEl) { resultEl.hidden = true; resultEl.innerHTML = ''; }
      if (hintEl) hintEl.textContent = '滑动 / 方向键控制 · 别撞墙';
      render(0);
      startFrame();
      return;
    }
    const saved = loadSaved();
    if (saved) {
      resetToIdle();
      if (hintEl) hintEl.textContent = '有未完成的对局';
      if (resumeBtn) resumeBtn.hidden = false;
      if (startBtn) { startBtn.hidden = false; startBtn.textContent = '重新开始'; }
    } else {
      resetToIdle();
    }
  }
  function resetToIdle() {
    stopLoop();
    newGame(diffSel ? diffSel.value : 'normal');
    state.status = 'idle';
    if (startBtn) { startBtn.hidden = false; startBtn.textContent = '开始'; }
    if (restartBtn) restartBtn.hidden = true;
    if (resumeBtn) resumeBtn.hidden = true;
    if (resultEl) { resultEl.hidden = true; resultEl.innerHTML = ''; }
    if (hintEl) hintEl.textContent = '点开始 · 滑动控制方向';
    refitAll();     // 最长纪录行/继续上局按钮显隐后再量一次，避免按钮被挤到屏外
    render(0);
  }
  function stopLoop() {
    if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
    if (countdownTimer) { clearTimeout(countdownTimer); countdownTimer = null; }
    stopFrame();
  }
  function closeSnakePanel() {
    if (canSave(state)) saveGame(); else clearSaved();
    stopLoop();
    if (isFs) toggleFs();
    if (panel) panel.hidden = true;
  }

  window.openSnakePanel = openSnakePanel;
  window.closeSnakePanel = closeSnakePanel;
  // 只读调试口（tools 专项验证用：地图尺寸/对局状态/蛇身食物坐标）
  window.__snakeState = function () {
    if (!state) return null;
    return {
      status: state.status, diff: state.diff, gw: state.gw, gh: state.gh,
      running: !!(rafId || countdownTimer),
      player: { body: cloneBody(state.player.body), alive: state.player.alive, score: Math.floor(state.player.score),
        dir: { x: state.player.dir.x, y: state.player.dir.y },
        nextDir: state.player.nextDir ? { x: state.player.nextDir.x, y: state.player.nextDir.y } : null,
        nextDir2: state.player.nextDir2 ? { x: state.player.nextDir2.x, y: state.player.nextDir2.y } : null },
      opp: { body: cloneBody(state.opp.body), alive: state.opp.alive, score: Math.floor(state.opp.score) },
      foods: state.foods.map(function (f) { return { x: f.x, y: f.y }; }),
      elapsed: state.elapsed
    };
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initEls);
  else initEls();
})();
