# TASKS.md — 任务队列 / 认领板（多人 AI 协作）

> 防止两个 AI 抢活 / 漏活 / 重复撞车。分工见 `AGENTS.md`，日志见 `WORKLOG.md`，bug 台账见 `BUGS.md`。
> **认领 = 在该任务行写「认领人：X」并置状态「进行中」。提交/构建前先扫一眼本表，避免并行撞车。**

## 认领规则
1. 状态只有四种：`待认领` / `进行中` / `已完成` / `已取消`。
2. 认领前先看是否 `已取消`（勿做），认领时在行内标注认领人；同一任务只允许一人 `进行中`。
3. 完成 = 改完 src + 该条对应的 `产物已构建`（构建者执行）；仅改完 src 不算完成，标注 `源已完成·待构建`。
4. `已取消` 保留原因，防止后人重新开工（如「合成大西瓜·不做」）。

## 任务列表（新任务在顶部追加；完成/取消的移入下方归档区）

| # | 状态 | 认领人 | 任务 | 关联文件/编号 | 备注 |
|---|---|---|---|---|---|
| 132 | 已完成 | AI-A | **功能字卡概率显示+可调**：查清温柔前缀概率（period.js warmText 硬编码 25% 触发→45%前缀/35%动作/20%双拼）；【其他互动功能字卡】页每分类新增「使用概率」stepper（键 dcf-<分类>，默认=现行值），温柔前缀/温柔动作接入该键；摸鱼35%/吃饭35%/花园40%/喝水35%/同频60%/伸手55%/查岗50% 等消费点接线；【系统预设字卡】各页头显示现行概率 | src/js/default-cards.js, src/js/period.js, src/js/p2-features.js, src/js/garden.js, src/js/chat.js, src/template.html | 已完成（v3.26.x，sw mochi-mtpn6nsx）：14 分类 stepper（含查岗页）+ dcfGet API + 12 消费点接线 + 哨兵 15 条 + verify-func-card-prob 19/19；详见 WORKLOG 2026-09-06 04:0x 与 FIX-REGRESSION #132 |
| 131 | 待认领 | | **疑似真缺陷核查清单**（#129 全量甄别产出，AI-A 域为主，按优先级）：①`verify-chat-switch-idb-hang` 3 断言红＝切联系人后 IDB 读取成功的 LS 快照未写+记录未渲染（#90 修复回归 or chat.js:129 缩水防护把测试直种 IDB 的数据拦了，需判定）；②`verify-mail-cfg-per-cid` B1/B4＝跨桌面来信 0 封（按桌面独立频率疑似失效）；③`verify-feed-reply-ui` B2＝定向回复落库 role=ta/to=我 与预期 role=me/to=小桃 相反；④`verify-myarc` P3b/P4c/P5d/P6b/P8＝我的档案多项数据写入为空 {f:{}}/[]；⑤`verify-coop-mine` B7b＝TA 送礼字卡未写入聊天；⑥`verify-water` E1＝昨日+今日达标连续天数只记 1 天。核实为真缺陷→按 BUGS 规则修+登记；为测试侧→在 #129 修绿 | src/js/chat.js, src/js/mail.js, src/js/feed.js, src/js/my-arc.js, src/js/coop-mine.js, src/js/accounting.js(?) | 由 ZCode 2026-09-05 #129 全量甄别产出；每项单跑可复现。**2026-09-07 核查定性（ZCode，探针实证见 WORKLOG 同日条）：仅①为真缺陷**——v3.9 真我修复「IDB 读成功写 LS 快照」被 **b402331**（OOM 修复部署批）引入的 `!hasLocal` 快路径打掉（hasLocal=false 时 changed 恒 false 不写快照），相邻提交红绿对照：父 1c5a1a6 worktree 9/9 绿 → b402331 5/9 红 → HEAD 6/9 红；修复归 AI-A（chat.js loadMsgs 读库成功收尾，非 #90 缩水防护）。**②~⑥均测试侧非产品缺陷**：②/⑥=脚本裸 localStorage/idbSet 种子被 xyStore memoryCache-first 读取遮蔽（改 xyStore 种子即全绿：water 17/17）；③=B2 断言取「最后一条」竞态（TA 回应 <700ms 落库顶位），role=me/to=小桃 实际正确；④=myarc 两阶段「给谁看」弹窗+菜单 9 行口径过期（P3b/P4c 探针补第二阶段后均入库正常）；⑤B7b=060b2b0 有意改面板气泡不写聊天+ B1b 几何命中类。②~⑥修脚本并入 #130 |
| 130 | 待认领 | | **verify 断言过期批修（AI-A 域脚本簇）**：#129 全量甄别定性为「口径过期非产品缺陷」的 AI-A 名下脚本——ta-checkin（预设 17→23 扩容）/poke-emoji-tabs（「小A的」→「TA 的」称呼统一+#126 tab 重构）/more-cats（互动 6→8 项、小游戏 4→8、总数 23→29）/narc-v2+myarc（菜单 9→10 行等功能增长）/room A8（功能字卡 tab 重构后注入点变化）/cjian 簇 4 脚本（跨桌面梦角重构）/coop-mine B1b（几何命中）/bugfix-six S2a/S3/eat-menus T3/gc-more/gc-send/gc-pool-scope T3（#157 默认卡语义改版后 hasDefault:false 是新正确行为）/music-no-seed/gift-market-v3 B7（商品目录+1）/feed-reply-ui 其余项。修法=对照现行产品改期望或删除 | tools/verify-ta-checkin.mjs 等 ~20 个 | AI-A 名下功能域；#129 可代修（改的是脚本不是产品），认领后在本行标注 |
| 129 | 进行中 | AI-B | **verify 套件基线清理**：目标清到接近全绿后启用 `--strict` 当门禁。**进度（2026-09-05）**：累计修绿 16 个（wallet-edit/bg-notify-dedup/unified-heart-wallet/cc-mine-clean/bg-notify-dedupe/chat-send-btn/ask-no-false-dock/avatar-ta-change/pong-balance/desk-click/desk-icon-decor 等）、删 2 个（rp-wallet-edit/gift-wallet-split）、套件剔除 2 元工具+新增脚本级超时提示+端口契约 174 脚本 codemod+跑批末 Chrome 清理；58 个存量失败脚本已全量甄别定性：约 44 个=口径过期（数据扩容/称呼统一/tab 重构/#157 语义/v3.27 主题三档/v3.18 blob 政策等），6 个疑似真缺陷（→#131 核查清单），环境限制类（voice-record 无麦克风/kb-overlay 悬浮键盘/desk 拖拽）保留 | tools/verify-*.mjs、tools/verify-suite.mjs | 剩余：AI-A 域过期批修（#130）+6 疑似核查（#131）+cc-scope（已知过期，WORKLOG 2026-09-04 有对照记录）+环境类处置，清完启用 --strict |
| 128 | 待认领 | | **字卡库媒体令牌化**（剩余方向①）：cc-groups 双作用域实测 62.8MB（#160），字卡表情/大图不走媒体池（无去重）。方向②「字卡库瘦身」已由 **#170 落地**（查看存储页按分组体积扫描+整组删除，FIX-REGRESSION #170）；本条只剩 ①字卡媒体令牌化进媒体池（跨卡去重，涉及字卡渲染/备份多面，chatcard.js 属 AI-A 域，跨域先在 WORKLOG 声明） | src/js/chatcard.js, src/js/media-pool.js | 存储优化评估（2026-09-05）遗留项 |
| 127 | 待认领 | | **聊天记录分片/归档**（架构级，存储收益最大）：chat-msgs 单键实测 155~214MB 且 saveMsgs 整包重写——发 1KB 文字也重写 155MB（写放大），读写超时/iOS OOM/开屏恢复慢皆衍生于此。方案：热片 `chat-msgs`（最近 N 条）+ 冷片 `chat-msgs:arch:<n>` 按需懒读；#90 条数账本、LS 快照（≤2MB）、备份导出、相关 verify 需同步适配 | src/js/chat.js, src/js/idb.js, tools/verify-* | 存储优化评估（2026-09-05，#166 同批）遗留项；改动大，务必专项会话做 |
| 126 | 已完成 | AI-A | **公用/专属字卡分组停用开关**（v3.30.x）：字卡库管理页每个分组 header 新增眼睛开关，停用后该分组不再进入任何自动回复池（聊天/拍一拍/表情包/语音/朋友圈/信箱/群聊/TA主动分享）与面板，字卡保留可随时重新启用；数据键公用 `xy-home-v2:cc-groups-public-off`（已进 contacts.js EXCLUDE）/专属 `<cid>:cc-groups-off`，格式 `{分类:[分组名]}`；回复池 getter 统一走 `replyPoolGroups/replyPoolGroupsFor` 过滤；验证 verify-cc-group-off 12/12 | src/js/chatcard.js, src/js/contacts.js, src/css/chat-pages.css, src/css/dark.css, build.mjs, tools/verify-cc-group-off.mjs, FIX-REGRESSION.md | 产物已构建（sw mochi-mtjkcawp）；另修 ZCode 删除型哨兵 `ta.focus();` needle 撞车误报（收窄 `appendChild(ta);ta.focus();`） |
| | 待认领 | | | | |

## 归档区（已完成 / 已取消）

| # | 状态 | 认领人 | 任务 | 关联文件/编号 | 结果/原因 |
|---|---|---|---|---|---|
| 125 | 已完成 | AI-B | **base.css 修复锚点丢失 7 条**（iOS .phone min() 钳制×3、#114 statusbar safe-area、color-scheme:light、#115 chat-input will-change/translateZ） | src/css/base.css | 已恢复；2026-09-04 复查 `node build.mjs --check-sentinels` 全绿 321/321 哑哨兵 0 |
| 124 | 已完成 | AI-B | 构建收口：device.js 诊断 6 缺陷修复 + 新哨兵 7 条 + 防覆盖基建（verify.yml / pre-commit 钩子 / FIX-REGRESSION 设备索引） | src/js/device.js, build.mjs, .github/workflows/verify.yml, tools/hooks/, FIX-REGRESSION.md | WORKLOG 2026-09-02 确认已随全量构建打入、6 条新锚点在位 |
| | | | | | |