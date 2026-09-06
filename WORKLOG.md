### 2026-09-07 05:0x（自定义字卡全量导入导出：字卡库列表页新增两入口，一份 json 覆盖 公用/专属聊天字卡+功能卡+寻踪+情话+TA 六类题库的我的添加；已构建·本次构建者：AI-A 本会话）
- [AI-A 域+跨域 template.html/notice.json]（**改动文件：src/js/chatcard.js（新增「自定义字卡全量导入导出」段：导出=hydrateLibScopes 权威取回后收集 cc-groups-public/cc-groups（含分组停用开关）+checkin-cards-*+quote-cards*+ta-ask/ta-choose/ta-curious/ta-roast/ta-checkin/ta-invite 的 questions+groups（不含 settings/问答历史）下载 mochi自定义字卡全量.json；导入=追加合并（cc 同名分组按内容去重/条目按文本归一去重/分组定义按 id+名去重/TA 题库按文本+ID 去重/停用开关并集）或整包替换（文件包含的库按文件写入），读写前均走 hydrateLibScopes 权威取回防空快照覆盖（#193 同防线），文件读取带 BOM/UTF-16/裁剪自救）、src/template.html（cc-sect-custom 尾部两入口行 li-cc-full-export/li-cc-full-import，已随并行 #236 5c2262d 入库、产物当时未含，本口构建接入）、src/js/quote-cards.js+p2-features.js（各 1 行暴露 window.quoteCardsRefreshCounts/ckCardsRefreshCounts 供导入后刷列表页角标）、src/pwa/notice.json（新增【九、自定义字卡全量导入导出】章节）、build.mjs（哨兵 +2：ccFullApply 逻辑锚+template 入口锚）**）；构建状态：**已构建·sw 见 version.json·本口执行**。
- 需求：用户「现在自定义字卡，只有【公用字卡】和【专属字卡】可以导入导出，里面其他的缺少导入导出。缺少【自定义字卡】全量导入导出」。根因：功能卡本就存 cc-groups 双作用域随旧出入口走，但 寻踪日常/今日情话/TA 六类的「我的添加」与自定义分组共 10+ 个键散落各模块、全无出入口，换机只能整包备份恢复。
- 验证：node --check 四文件过；--check-sentinels 512 全绿哑 0（构建前）；tools/verify-cc-full-transfer.mjs 新增 **27/27**（vm 切片跑真实合并函数：cc 合并/条目归一/分组定义/TA 题库/停用开关/ccFullRd 容错+静态接线；**红绿对照：HEAD 旧源切片红退出码 1 → 修复后 27/27**）；构建后哨兵 514/514。
- 【真机:待验证】（任意机型）：①字卡库→可自定义字卡 底部「自定义字卡·全量导出」→下载 json 含各库计数提示；②「全量导入」选该文件→追加合并→各库「我的添加」角标增加且重复内容不翻倍；③换联系人桌面导入专属部分落在对应桌面；④整包替换后各库=文件内容。
- 【并行 #236 会话声明】树上你口无在途改动，本口开工树净（git status 仅本口 3 src + 1 新 verify）；你在 5c2262d 随库带走的 template.html 两锚点即本口功能，本口构建已把产物接入（index.html grep li-cc-full-export>0）。

### 2026-09-07 04:0x（#236 OPPO K13 Turbo Pro+HeyTapBrowser「屏幕下方大片空白」双洞收口：①安卓浏览器覆盖形态执行器缺失（covered 执行侧全在 isIOS 分支，安卓永无 mochi-cover-top=顶部重叠 #114 形态安卓版）②收键盘后 vv 恒卡 inner−底栏高 → _aKb 卡真 .phone 锁死 652=底部空白+tabbar 悬空；判定器 coverBrowser 扩 sig.andr+诊断③有效顶位；已构建·sw mochi-mtq84lcq·本次构建者：AI-B 本会话）
- [AI-B 域]（**改动文件：src/js/mobile-adapt.js（①!isIOS 块尾新增 _aSyncCoverTop 安卓覆盖形态执行器：env 探针按横竖屏缓存→共享判定器→safeTop>0 写 --mochi-safe-top+挂 mochi-cover-top/否则摘除，resize/orientationchange 接线；②1s 看门狗新增键盘会话卡死自愈（真键盘证据=vv 缩幅≥min(_aIH,_aH)×22% 或 inner 同缩，都不成立而缩幅落 13~22% 残留带+会话超 1.5s+vv 稳 1.2s → 清 _aKb+置 _aVvStale 闩）+open 判定加残留闩门+_aBump/focusin 解闩+_aKbAt/_aVvChgAt 计时+__mochiAndroidKb 探针补 staleVv）、src/js/device.js（判定器 coverBrowser 扩 (diff≤2||!!sig.andr)——安卓壳带底栏 diff>2 也入浏览器覆盖形态；screenDiagJudge/sdHistCompare 两处 sig 补传 andr；诊断③对 coverBrowser 改有效顶位=元素顶+实测 padding；形态/底部文案同步）、build.mjs（#199 判定器锚 needle 同步+#236 新哨兵 4 条）、tools/verify-viewport-form.mjs（+HeyTap 台账/iOS 零回归闸/env0 不误伤三用例+[D] screenDiagJudge 端到端 6 断言，共 76）、FIX-REGRESSION.md（#236 行+设备索引 OPPO K13 Turbo Pro 行）**；构建状态：**已构建·sw mochi-mtq84lcq·本口执行·哨兵 512/512 哑 0·sw 14/14**）。
- 需求/根因：用户诊断 SIG「form=covered/safeTop=0/期望底=760/.phone=652/kbActive=true/sb=0/tab=634」三 ✗（顶部重叠+底部少填 108+导航栏悬空 126），明说其他机型也有。①covered 形态执行侧（--mochi-safe-top/mochi-cover-top）全在 isIOS 分支，HeyTap 壳 viewport-fit=cover 生效页面画进系统状态栏下方（env=40），安卓无执行器落地+base.css 后加载 .statusbar{padding:4px} 压死 env 避让（#114 同根因安卓版）；②该壳收键盘后 vv.height 恒停 652=inner−底栏不回基准 → open 恒真 _aKb 卡真（含无聚焦纯 vv 置位会话），.phone 内联高锁死 652；#209 清扫/_aProv/focusout 400ms/250ms 轮询四条复原路全被堵死（后三条都等 vv 回基准，等不到）。
- 修复原则（回应「不要覆盖修改导致不同机型 bug 反复」）：iOS 分支（syncVvFit/键盘链）一行未动；判定器扩展用 sig.andr 显式门控（iOS 不传=原判式逐字节不变）；执行器只做「safeTop>0 写变量+挂类」，其余消费方 fallback 本就是 env() 写入同值零视觉变化，env=0 常规安卓浏览器摘除属性与旧版一致；键盘自愈判据全用视口证据（缩幅 22% 键盘下限物理区分真键盘与残留读数，真键盘缩幅>200px 永不误清；vv 稳 1.2s 避开收起动画每帧变化）。
- 验证：node --check 两文件过；tools/verify-viewport-form.mjs **76/76**（红绿对照：git stash 修复前源 72/76——HeyTap 台账 form/safeTop/expBase 3 红+诊断端到端「修复后稳态全绿」1 红=报障原文复现，修复后 76/76；「报障现场三 ✗」断言新旧源同过=钉住诊断检出力）；verify-kb-residue-heal 10/10（#209 看门狗不回归）、verify-fullscreen-ipad 25/25、布局 verify 10/10；verify-ios-kb-stuck 3 红/verify-ios-reserved-standalone 7 红/verify-screen-diag-opt 4 红经 stash 对照 HEAD 基线红项集合逐字节一致=存量（#235 批 Node 环境 fixture 未传 safMajor 口径，归属其会话），本批零新增回归。
- 【随库带上并行会话在途文档批】TASKS.md（#131 核查定性）与 WORKLOG #131 条（另一会话只读核查补证，声明不涉及 src/产物）随本口构建/提交一并入库，本口未触碰其内容。
- 【真机:待验证】（OPPO K13 Turbo Pro+HeyTapBrowser 及任意安卓壳）：①更新后桌面状态栏自动落到系统状态栏下方不再重叠；②聊一次天（键盘弹出再收）底部不再残留大片空白、tabbar 贴底；③屏幕适配诊断全 ✓，形态行显示「浏览器覆盖壳（#199/#236）」；④若仍有异常请整段复制诊断反馈（SIG 里 staleVv 字段可证残留闩状态）。

### 2026-09-06 03:3x（#216 屏幕适配诊断聊天页键盘期专项采集；已构建）
* [AI-B 域]（**改动文件：src/js/device.js（collectScreenDiag 聊天块新增键盘期采集：键盘高度=基线 inner−vv、键盘期输入栏底边；报告聊天页节键盘打开时输出专项行）、build.mjs（FIX_SENTINELS 1 条）、FIX-REGRESSION.md（#216 行）**）。
* 定位链收官：键盘期瞬态（「聊天界面上移/输入栏被盖」发生现场）从盲区变为可采。
* 验证：node --check 过；--check-sentinels 508 全绿；CDP 实测无键盘不误输出。
* 待真机：聊天页键盘打开时跑诊断，报告出现键盘期行。

### 2026-09-07 02:1x（#235 形态判定补 Safari 版本门：26.x 覆盖形态 vs 18.x 保留形态分水岭；已构建）
* [AI-B 域]（**改动文件：src/js/device.js（mochiViewportForm 解析 safMajor + resStand 加 safMajor<26 门）、src/js/mobile-adapt.js（_sig0 透传 safMajor）、FIX-REGRESSION.md（#235 行）、build.mjs（#209 needle 同步）**）。
* 根因矩阵：Safari 26.x（14Pro/16Pro 实测）=覆盖形态（env 报真实值+内容垫到状态栏下）；Safari 18.3（15Pro 实测）=保留形态（env 报真实值+系统垫走）。同信号反处理，唯版本线可分。
* 验证：node --check 过；三机型形态矩阵单测全过；--check-sentinels 全绿。
* 待真机（16Pro/17Pro Safari 26.x）：顶部避让自动生效、高度铺满；15Pro/18.3 回归不变形。

### 2026-09-07 03:4x（#131 六项疑似真缺陷全量核查：1 真 5 测试侧；只读核查无 src/产物改动）
- [跨域只读核查·改动文件：TASKS.md、WORKLOG.md；构建状态：未构建·无需构建]。
- ①chat-switch-idb-hang=**真缺陷（回归）**：v3.9 真我修复「IDB 读成功写 LS 快照」（c1e7109 在位）被 **b402331**（v3.26.x 聊天加载 OOM 修复部署，iPhone 15 Safari 崩溃循环批）引入的 `!hasLocal` 快路径打掉——纯读取路径 changed 恒 false 快照永不落，LS 废机上 IDB-only 历史切回挂起即空白。**相邻提交红绿对照：父 1c5a1a6 worktree 9/9 绿 → b402331 5/9 红**（HEAD 现 6/9 稳定红）。**需对方处理（AI-A）**：chat.js loadMsgs 读库成功收尾在 !hasLocal 且有数据时补 writeLsSnapshot（最小改动，OOM 优化不受影响）。
- ②~⑥=测试侧非产品缺陷：mail/water=脚本裸 localStorage·idbSet 种子被 xyStore memoryCache-first 读取遮蔽（改走 xyStore 种子即全绿：water 探针 17/17、mail 来信正常）；feed-reply B2=断言取「最后一条」竞态（TA 回应 <700ms 落库顶位），role=me/to=小桃 实际正确；myarc=两阶段「给谁看」弹窗+菜单 9 行口径过期（P3b/P4c 探针补第二阶段后均入库正常）；coop-mine B7b=060b2b0 有意改面板气泡不再写聊天、B1b 几何命中类。②~⑥修脚本并入 #130，TASKS #131 已备注定性。
- ③⑤深度复核补证（应用户要求追加，结论不变）：③=原版脚本连跑 5 次 PASS/FAIL 随 TA 回应落库时机翻转——脚本种 reply-speed 0.05~0.3s 但产品 `Math.max(1,max-min)` 把实际延时托到 0.05~1.05s，≈2/3 落在 B2 的 700ms 读取之前；翻车现场全量 dump 用户回复条目恒为 role=me/to=小桃、第 4 条是 TA 回应（本身也正确）。⑤=相邻提交红绿：060b2b0 父 32c7f5e worktree B7b 绿（聊天有「这个给你」字卡）→ 060b2b0 本身红；HEAD 探针气泡采样序列含「TA挖到了一个小礼物，「这个给你。」」且聊天零写入——送礼功能未丢只是从聊天搬进面板气泡，定性不变。

### 2026-09-07 03:2x（#231~#234 红米 Note12 Turbo Chrome 报「空白气泡+完整外观方案/聊天美化方案/朋友圈头像昵称保存后刷新回退（多机型同发）」——实锤四洞收口：①全局根键漏 EXCLUDE ②feedRootRescue 误删朋友圈身份键 ③migrateLegacy 吃无冒号 __ 系统键（回滚家族第四层）④诊断开关体检探针双冒号；已构建·sw 见 version.json·本次构建者：AI-B 本会话）
- [AI-B 域+跨域 feed.js]（**改动文件：src/js/contacts.js（EXCLUDE 补 full-beauty-schemes/beauty-undo-stack/ver-update-ack-ts/ver-update-notify 四键；isExcluded 加 __ 系统键兜底规则；migrateLegacy 存量回收清单并入前两键=default 滞留的存量「自用」方案副本一次性找回；新增 default:__ 滞留系统键副本 LS+IDB 双删清扫）、src/js/feed.js（跨域改动，声明理由：feedRootRescue 洞在键位回收方向、与 contacts.js 迁移机制互为因果且同批 verify 一体覆盖——DESK_KEYS 六键拆分：per-cid 有值绝不动，空值时 idbHasKey 三态确认后才从根键收养，feed-notices/feed-app-unread 两真全局键旧行为保留）、src/js/device.js（开关持久化体检「读取」列 xyStore(SP) 无尾冒号前缀，双冒号 default:: 键位修复）、build.mjs（哨兵 +5 改 1：EXCLUDE 四键锚/存量回收尾锚（接替被打破的 desk-freq-mode 旧锚）/__ 兜底规则锚/default:__ 清扫锚/DESK_KEYS 拆分锚/idbHasKey 三态守卫锚/探针 SP 锚）、FIX-REGRESSION.md（#231~#234 四行+设备索引红米 Note12 Turbo 行+回滚家族行并 233+新「迁移漏键家族」行）、tools/verify-exclude-feed-schemes.mjs（新增 32 断言）**；构建状态：**已构建·sw 见 version.json·哨兵 506/506 哑 0**）。
- 需求/根因（用户诊断 ts=1788704933135=9/6 22:28 构建，早于 #226/#229 部署，回滚家族主修复已入库待送达；本批修其未覆盖的三个新洞+诊断误导）：①full-beauty-schemes（v3.27.x 新增）/beauty-undo-stack/ver-update-ack-ts/ver-update-notify（#225v2 新增）都是全局根键但没进 contacts.js EXCLUDE——migrateLegacy 每次刷新当旧顶层键迁进 default 并删根键 → 完整外观方案列表刷新清空（用户 00:11 交互轨迹正是打开方案管理器见空）、同版本更新条每刷新重弹；②feed.js feedRootRescue 的「根键有值→删 default 副本」是 v3.13 时代逻辑，v3.8 朋友圈好友列表起身份/封面六键已按桌面独立（读取方 per-cid 优先、好友列表只读 per-cid）——首次刷新把 per-cid 值搬上根键，此后每次刷新把用户编辑的朋友圈头像/昵称删回旧全局值＝编辑活不过下一次刷新；③idb.js 的 __wr-journal（写日志自愈第一道防线）/__ls-dirty/__big-idx 无冒号根键同样每刷新被迁走——自愈弹药库被拆，#82/#88/#226/#229 修的是自愈逻辑本身、没挡住这一层；④诊断探针把带尾冒号前缀传 xyStore（内部再拼':'）→「读取」列读 default:: 双冒号键恒缺失（cs-voice-send：LS="1" 读取=缺失 即此假象，非数据问题）。
- 「聊天美化方案」与「空白气泡」定性：chat-beauty-schemes 本就在 EXCLUDE（v3.26.x 已补），其回退体感=#226/#229 回滚家族（已随 7552990 入库待送达）+本批①方案列表清空的叠加观感；空白气泡=用户构建（9/6 22:28）已含 #186/#202/#205/#206 媒体空白家族修复，现存空白条为台账明示的存量脏数据（#205：占位文字会写明失败类型，长按撤回或字卡库清理该分组）或 #228 语音（也已入库待送达）——更新到本版后若仍**新出现**空白气泡，请带新诊断按占位文字定性，不再盲修。
- 验证：node --check 三文件过；--check-sentinels 506/506 哑 0；tools/verify-exclude-feed-schemes.mjs **32/32**（纯 Node 桩 IDB 跑真实 idb.js+contacts.js+feed.js 切片：V1a 方案根键不再被迁+滞留副本回收/V1b 存量方案找回/V1c __ 系统键根键保留+default 滞留副本双删/V1d 真旧键迁移不被误伤/V2 朋友圈头像 default 现行值不被删/V3 收养/V4 大值守卫/V5 全局键旧行为/V6 探针静态）；**git stash 红绿对照：修复前 11/32（方案根键被迁成 null=报障原文复现、default 头像被删=回退复现），修复后 32/32**。
- 【并行 bg-keep 会话请查收】#230 条所留声明已读：你的 bg-keep.js 批次已随 cd1747c 入库，本口未触碰 bg-keep.js；本口开工树上净（git status 五文件全是本口改动），构建前后均核过。
- 【真机:待验证】（红米 Note12 Turbo Chrome 及任意机型，先更新到本版）：①保存完整外观方案→刷新→方案管理页仍在；历史上保存过的方案刷新一次后找回；②朋友圈好友列表改联系人/自己的朋友圈头像、昵称→刷新→仍是新值；③改聊天美化→立刻杀浏览器重开→不回退（#229 自愈+本批③防线加固）；④同一条更新提醒杀掉重开不再弹；⑤设置→诊断信息「开关持久化体检」的「读取」列与 LS 列一致（不再恒缺失）。

### 2026-09-07 02:3x（#230 领取红包闪屏——红包状态流转五处 renderWindow 整窗重建改 rpPatchStatusInPlace 原地补丁；#211/#220 同族最后一条未收口路径；已构建已提交 734ce5a·sw mochi-mtq55x3h·本次构建者：AI-A 本会话）
- [AI-A 域]（**改动文件：src/js/chat.js（rpStatusCls 后新增 rpPatchStatusInPlace 原地补丁助手：只更新该红包卡 opened/expired class+状态文案，childList 零变动；用户领取/长按退回/TA领取/TA退回/自动领取五处 renderWindow 改「先试补丁、卡片不在渲染窗口才回退整窗」）、build.mjs（哨兵 +2：助手补丁表达式+领取路径守卫，chat.js 内唯一）、FIX-REGRESSION.md（#230 行）、tools/verify-rp-claim.mjs（新增 11 断言）**；构建状态：**已构建·sw 见 version.json·本口执行·随库带上并行 bg-keep.js 在途批次（见下方查收声明）**）。
- 需求：用户报障「领取红包会闪屏」，明说其他设备型号也有。根因：领取/长按退回/TA领取/TA退回/自动领取五处红包状态流转一律 renderWindow 整窗重建——body.innerHTML='' 后全部气泡（img 重新解码）＝肉眼整屏闪一下，#211/#220 同根因家族最后一条未收口路径；领红包必经此处＝所有机型每次必闪（与机型、历史条数无关，#211/#220 的窗口闸拦不到它，无头实测点击即 add31/rem31）。
- 修复原则（回应「不要覆盖修改导致不同机型 bug 反复」）：#211/#220 已修路径一行未动；本批只在红包状态流转这一条新路径上按同族已验证模式收口，卡片尺寸不变无布局跳动，回退路径与旧版行为一致；#228 语音兜底（同文件）原样保留。
- 验证：node --check 过；--check-sentinels 500 全绿哑 0；tools/verify-rp-claim.mjs **红绿对照：修复前（HEAD 产物）6/11——S3「卡片节点被重建+同批增删 31/31」精确复现报障闪屏，修复后 11/11**；verify-chat-rebuild、verify-voice-send 复跑见本条验证记录（家族+同文件相邻不回归）。
- 【真机:待验证】（任意机型）：①聊天里点 TA 发的红包→卡片变「已领取」、消息区**不再整屏闪一下**、随后追加「你领取了红包」回执；②长按红包退回同样不闪；③TA 领取/退回我发的红包时若正在看聊天，消息区同样不闪。
- 【并行 bg-keep 会话请查收】树上你口未提交的 src/js/bg-keep.js（通知去重窗口 15→5/6→2 分钟+前台看过 3 分钟独立窗口）本口未触碰、node --check 过；你口 02:20 构建的产物（mtq508c6，已含 bg-keep 未含本口红包修复）被本口构建覆盖为新 sw（含两者）——你的批次已随本库入库，WORKLOG/verify/台账若未登记请自行补登，勿回滚本库产物。

### 2026-09-07 02:0x（#228 发语音「点结束卡在输入中/正在录音，发不出去」——OPPO Reno6 5G+雨见 Gecko 诊断报障、用户明说多机型同发；#169 同机续报。源码已随并行 7552990 随库入库，本笔收口 verify 修正+台账+登记）
- [AI-A 域]（**改动文件：src/js/chat.js（语音面板停止链路四处兜底：voiceFinalizeStop 统一结账+voiceStopSettled 幂等闩、onstop 3s 看门狗、空数据可见失败态+voiceMimeFallback 换默认容器、acquireVoiceStreamGuarded 15s 启动看门狗+迟到流停轨、voiceStopping 防重入）、build.mjs（哨兵 +4，chat.js 内唯一逻辑锚）、FIX-REGRESSION.md（#228 行+设备索引 OPPO Reno6 5G 行）、tools/verify-voice-send.mjs（新增 24 断言）**；构建状态：**源码与产物已随并行 idb 会话 7552990（sw mochi-mtq3hasn）入库——其 commit message 注明「红5项归属其会话定性」，本笔定性+修正后 24/24；本口无 src/产物改动、无需再构建（index.html grep voiceStopWatchdog=5 实证产物已含）**）。
- 根因（chat.js 录音停止链路四个静默卡死洞，诊断错误环零语音异常=静默卡死实证）：①雨见等慢壳 ondataavailable/onstop 迟到或丢失→stop() 后无结账事件，面板永远停「正在录音…」、试听/发送键永不出现；②录出空数据（isTypeSupported 谎报的容器）时旧 onVoiceRecStop 对空 blob 静默 return→同样永久卡死零提示；③getUserMedia 永久挂起（壳权限委托异常）→#169 的 voiceStarting 闸门永不复位→之后每次点「开始录音」被静默忽略=面板看似点不动；④停止结账窗口连点→新录音机句柄被旧结账偷走。用户口述「点结束还是显示输入中」即①/②的面板卡「正在录音…」形态。
- 修复原则（回应「不要覆盖修改导致不同机型 bug 反复」）：mime 三分支（标准安卓 Chromium webm 优先/WebView 与 iOS mp4 优先）与 #169 闸门一行未动，只加兜底不加新路； chromium/WebView/iOS 路径行为零变化，兜底全部只在「已经坏了」的路径上生效（空数据/挂起/迟到都是旧版必卡死场景）。
- 验证：node --check 过；构建哨兵 498/498 哑 0（随 7552990）；tools/verify-voice-send.mjs **24/24**（静态 7+无头真实产物端到端 17：桩 MediaRecorder 复现 onstop丢失/空数据/onstop迟到连点/中途关面板/getUserMedia挂起五形态+正常录音发送链路不回归）；**红绿对照：753cc65 旧源构建 16/24，R7 旧版停止后永久卡「正在录音…/停止录音」=报障原文精确复现，修复后 24/24**。自纠记录：首版 19/24 的 5 红全是脚本自身缺陷（录音 <800ms 触发既有「太短」保护被正确丢弃、断言串/计数写错、场景间 mode 残留污染后续场景），7552990 提交时带上的是该版本，本笔已修。
- 【真机:待验证】（OPPO Reno6 5G+雨见 及任意机型）：①发语音→点停止→出现试听+「发送到聊天」→发出语音气泡（本次报障主症状）；②个别壳若仍录不出，面板显示「没录到声音数据，请重试」不再永远转圈，再录一次自动换默认容器；③麦克风权限异常/挂起时 15 秒内出「麦克风无响应」提示且之后仍能重试；④录音中快速连点不丢试听态、不弹错误。

### 2026-09-07 01:4x（#229 多机型「部分数据丢失」残余洞——wrj 合并读失败一次即弃全会话放弃自愈；已构建·sw mochi-mtq3hasn·本次构建者：AI-B 本会话）
- [AI-B 域]（**改动文件：src/js/idb.js（wrjMergeFromIdb 三处：改走严格三态 idbListKeys 不再把读失败折叠成「没标记」；合并真正走完/确认无可修才置 _wrjMerged；读失败有界重试 10s×5 wrjMergeRetry，busy 解锁统一收口；idbGetMany 折叠 undefined→cand 空同样重试）、build.mjs（哨兵 +1）、FIX-REGRESSION.md（#229 行+设备索引 LS 回滚家族行加 229）、tools/verify-wrj-merge-retry.mjs（新增 17 断言）**；构建状态：**已构建·sw mochi-mtq3hasn·哨兵 498/498 哑 0·sw 14/14**）。
- 需求/根因：用户再报「手机数据丢失、非全量、其他机型也有」＝#82/#88/#226 同家族第三层。#226 修好「标记写不进去」后，自愈第二道防线读取侧仍有一击即溃点：wrjMergeFromIdb 入口即置 _wrjMerged 且走 idbGetAllKeys（读失败 null 折叠成空数组，与「没标记」不可区分）——挂起内核（真我/荣耀/小米 Edge/iOS 挂后台杀 IDB 服务）上启动合并恰逢挂起窗口时空转一次 → 会话剩余时间 LS 被杀进程回滚的美化/设置/近期小数据再无自愈（标记/新值都幸存 IDB，只差读回来）→「刷新后部分数据丢失」。
- 验证：node --check 过；verify-wrj-merge-retry **17/17**（回滚世界场景：U1 健康自愈+heal 广播/U2 清单读失败→10s 重试自愈 listCalls≥3/U3 标记折叠 undefined→重试自愈）；**git stash 红绿对照：修复前 7/17（U2/U3 行为断言全红=LS 永远停留旧值，精确复现回归现场）**；verify-idb-setall-timeout 13/13（#226 不回归）、verify-docx-export 24/24（#227 不回归）。
- 【并行 #228 语音批次随库声明】树上 src/js/chat.js（voiceStopping 闩/停止看门狗/voiceMimeFallback，代码注释标 FIX #228）+ tools/verify-voice-send.mjs 为并行会话在途完整改动，本口构建全量合并必然带上——chat.js 语法 node --check 过；verify-voice-send 实测 **19/24**（红 R4/R5/R8/R9/R10 全在录音链路：无头环境无真实麦克风 MediaRecorder 桩差异或真红，**归属 #228 会话定性**，本口未触碰其逻辑）。
- 【真机:待验证】（真我/荣耀/小米 Edge 家族及任意机型）：改美化/设置→立刻杀浏览器重开→改动保留；若仍见回退，**第二次刷新（或等 10~60s 再操作）应自动恢复**＝重试自愈落地，不再是「整个会话永远旧值」。

### 2026-09-07 01:5x（#227 两处诊断「导出txt」→「导出docx」+ 屏幕适配诊断补导出按钮；已构建·sw mochi-mtq2ttn9·本次构建者：AI-B 本会话）
- [AI-B 域]（**改动文件：src/js/device.js（旧 exportTxt 移除；零依赖新增 crc32+buildDocxBlob+exportDocx：存储式 ZIP+表驱动 CRC32 手写最小 OOXML 三件套，正文一行一段落/Consolas+雅黑/XML 转义/sectPr 收尾；信息诊断按钮改「导出docx」，屏幕适配诊断弹窗补「导出docx」按钮+文件名前缀 mochi-screen-diag-）、src/template.html（modal-export 默认文案导出docx）、build.mjs（哨兵 +1：docx ZIP 本地头签名锚；#113 与「超长引导导出」两条旧 txt 锚随迁 docx 口径，#113 取消自动复制语义不变）、tools/verify-docx-export.mjs（新增 24 断言）、FIX-REGRESSION.md（#227 行）**；构建状态：**已构建·sw mochi-mtq2ttn9·哨兵 493/493 哑 0·sw 14/14**）。
- 需求：用户「【屏幕诊断】新增也可以导出txt，不过能不能导出docx；信息诊断可以修改为导出docx吗」。docx=ZIP 容器 OOXML，不引第三方库保持单文件构建；全 STORED 不压缩+手写 CRC32 兼容面最大，Word/WPS 手机端直开转发。
- 验证：node --check 过；verify-docx-export **24/24**（vm 抽真实源码生成 docx 字节：ZIP 逐字段解析+独立重算 CRC+document.xml 内容/转义/中文+两处按钮接线静态断言）；系统 unzip -t 三件套校验 OK；对已入库 src 复跑同绿。
- 【更正 9681141 随库归属】#225v2 口（9681141）「随库带上 #215 批次（device.js+template.html）」实为**本口 #227 docx 批次**（#215 已在 965a91d 自行入库；该笔带走的 device.js/template.html/build.mjs 全部是 #227 内容，其哨兵 493=492+本口 docx 锚可证）。功能无影响，仅登记更正；本笔补提交 verify 脚本/台账/澄清与本口产物刷新（ttn9，与 HEAD src 内容一致含 #225v2+#227，纯缓存号刷新）。
- 【并行 idb 会话请查收】树上你口未提交的 src/js/idb.js+build.mjs 本口未触碰未提交；ttn9 产物不含你的 idb 改动，你口构建照常覆盖即可。
- 【真机:待验证】（任意机型）：设置→诊断信息→【导出docx】、屏幕适配诊断→【导出docx】——下载的 docx 用 Word/WPS 打开不乱码、报告数值不错行。

### 2026-09-07 01:2x（#225v2 更新条提醒口径修订：废 24h 时间窗，改一版一弹——站点主反馈「一天会更新十几次」，任何按时间压制新版本提醒都不成立）· 已构建 · **本次构建者：AI-B 本会话**
- [AI-B 域]（**改动文件：src/js/pwa.js（弹条门 verSnoozed 24h 免打扰 → verSeen 一版一弹：ver-update-notify 弹条即记同版本永久不再弹；更新的版本立即照弹无任何时间限制；ts 未知只在从没弹过时照弹；按版本 ack 保留；VER_SNOOZE 键与逻辑整体移除，已下发用户的孤儿键无害）、build.mjs（#225 哨兵 needle/描述随 v2 更新）、FIX-REGRESSION.md（#225 行改 v2 口径）、tools/verify-ver-update-snooze.mjs（重写 19 断言）**；构建状态：**已构建·sw 见 version.json·本口执行**）。
- 修订动机：v1（1e2630e 下发的 24h 免打扰）被站点主否决——部署节奏一天十几次，24h 静默会让用户整天收不到新版本提醒。v2 语义：重复=同一版本反复弹（已绝），新版本=立即弹一次（保留），二者靠「按版本记录」区分，不靠时间窗。
- 验证：node --check 过；verify-ver-update-snooze **19/19**（vm 跑真实源码：同版本 25h 前弹过不再弹/新版本 1001、落后十几版 1015 立即弹/弱网无 ts 不绕过/全新用户保留宁多勿漏/未知 ts 记录不挡已知版本/ack 兼容/稍后刷新按钮行为）；哨兵 492 全绿见构建输出。
- 随库说明：树内 device.js +108/-16 为并行会话 #215 批次（其 WORKLOG 条目在册、node --check 过），本口构建一并带入产物。
- 【真机:待验证】（任意机型）：①同一条更新提醒不点按钮杀掉重开不再弹；②新部署后打开立即弹一次；③点稍后同日再部署仍会弹（新版本不压制）。

### 2026-09-06 17:2x（#215 屏幕适配诊断历史对比虚假变化项修复：快照键↔采集键字段名映射；已构建）
* [AI-B 域]（**改动文件：src/js/device.js（sdHistCompare PAIRS 成对映射 + 采集器补 ori/fs 别名）、build.mjs（#175 对比 PAIRS needle 同步）、FIX-REGRESSION.md（#215 行）**）。
* 用户实测报告暴露：两次连续诊断「历史对比」恒显 ori/fs → undefined 虚假变化（快照键与采集键名字错位），历史对比可信度受损。
* 验证：node --check 过；--check-sentinels 492 全绿；CDP 端到端两次连续诊断「各项一致」。

### 2026-09-07 01:0x（#226「刷新后丢美化/丢数据」多机型复发——#166 微批化把写日志标记第二道自愈防线打断；已构建·sw mochi-mtq20nhx·本次构建者：AI-B 本会话）
- [AI-B 域]（**改动文件：src/js/idb.js（idbSetAll 补挂起超时骨架：按值体积放大 4s~30s、超时置空连接+resolve(false)——wrjMarkFlush「退回逐键 idbSet」与 mochiMediaFlush「回队」两个 false 兜底恢复可达；健康内核路径零变化、#166 微批优化保留）、build.mjs（哨兵 +1）、FIX-REGRESSION.md（#226 行+设备索引「多机型 LS 回滚家族」行）、tools/verify-idb-setall-timeout.mjs（新增 13 断言）**；构建状态：**已构建·sw mochi-mtq20nhx·哨兵 492/492 哑 0·sw 14/14**）。
- 根因链：用户报「好多手机型号刷新后丢失美化、丢失数据」→ 与 #82/#88 LS 回滚家族同族、#166 后复发。#166 把 wrj 标记落库改成 idbSetAll 150ms 微批，而 idbSetAll 无超时骨架——真我/荣耀/小米 Edge 等挂起内核上标记事务永不落地且 false 兜底不可达：杀进程回滚 LS 后，LS 日志（第一道）与 LS 值同批回滚、IDB 标记（第二道）缺失 → wrjMergeFromIdb 无从自愈 → 美化/设置/近期小数据刷新回退；同一函数挂死还让媒体池 flush 永不回队=表情/图片令牌静默丢。
- 验证：node --check 过；verify-idb-setall-timeout **13/13**（纯 Node 桩跑真实 idb.js+media-pool.js：健康内核微批保留/挂起内核 4s 判 false+兜底落标记/媒体池有界返回+恢复后落库）；**git stash 红绿对照**：修复前 T2/T3 永久挂起=红，精确复现回归现场。storage-opt 22/9 红经 stash 对照 HEAD 同红=存量（TASKS #130 在册，本批未触碰其沙箱路径）。
- 【并行 #225 会话请查收】本口开工时树净，构建时你的 #225（pwa.js 更新条 24h 免打扰）批次已落树且工件齐备（哨兵+verify+台账行、构建解析过）→ 按「随库带上并行已声明批次」惯例一并收入本库 sw mochi-mtq20nhx：verify-ver-update-snooze **20/20**、你的哨兵含在 492/492 内。若还有在途增量，直接续改 pwa.js、下口构建带上即可，勿回滚本库产物。
- 【真机:待验证】（真我/荣耀/小米 Edge 家族及任意机型）：①改美化/开关→立刻杀掉浏览器重开→改动保留不再回退；②表情/图片刷新后不再丢；③顶部更新条同版本 24h 内不重复弹（#225）。

### 2026-09-07（#225 顶部更新条一直重复提醒——pwa.js showVerBar 时间维免打扰收口）· 已随 1e2630e 联合收口·已推送 origin/main
- [AI-B 域]（**改动文件：src/js/pwa.js（showVerBar 弹条门追加 verSnoozed 24h 免打扰：新键 ver-update-notify 弹条即记「ts|时刻」——同版本含 ts 未知 24h 内不弹第二次；新键 ver-update-snooze 点稍后/刷新即记——24h 内任何版本全静默；verShouldNotify/按版本 ack 语义不变）、build.mjs（哨兵 +1）、FIX-REGRESSION.md（#225 行）、tools/verify-ver-update-snooze.mjs（新增 20 断言）**；构建状态：**本口未执行构建——由并行 #226 会话按「随库带上已声明批次」惯例构建收口（1e2630e·sw mochi-mtq20nhx·哨兵 492/492 哑 0）并推送，产物已核对含 #225 门锚点与存储键**）。
- 根因（v3.26.x 按版本 ack 后用户复发报障，三洞）：① ack 只在点「刷新/稍后」时写——用户看到条不点（杀掉重开/切走），ack 不存在 → 同一版本每次打开都弹；② SW 通道拉 version.json 失败时 showVerBar() 无 ts 照弹，「宁多勿漏」整体绕过 ack（GitHub Pages 弱网常态）；③ 边修边部署一天多个版本 × 按版本 ack = 每个新部署必弹一次。
- 验证：node --check 过；verify-ver-update-snooze **20/20**（vm 跑真实源码：首弹保留/同版本重开不二弹/弱网无 ts 不绕过/稍后 24h 全静默/25h 后恢复/ack 新旧语义兼容/刷新按钮 ack+snooze+refresh 三写）；脚本对 HEAD 旧版源码必红（有牙）；哨兵含在 492/492。
- 备注：build.mjs 里本批哨兵名被并行会话写成「#226 更新条…」（与 #226 idbSetAll 撞号）——台账行号正确（202 行=#225、203 行=#226）、needle 各自唯一非哑哨兵，仅 name 串错，留待下口构建者顺手改回 #225，无产物影响。

### 2026-09-07 00:5x（#223 群聊颜色「一改就恢复」+ #224 摸鱼 chk 每分钟 dcfP 报错——荣耀畅玩40 Plus+夸克诊断报障，用户明说其他机型也有；已构建·sw mochi-mtq1331l·本次构建者：AI-A 本会话）
- [AI-A 域]（**改动文件：src/js/group-chat.js（pickGcColor 删选色即回滚分支；新增 gcEnsureContrast 对比度自愈、接入 applyGcBeauty 尾部：out/in 组合对比 <1.5 时注入 #gc-contrast-fix 强制黑/白可读文字色，重入路径自动重算；低对比警告行文案改述新行为）、src/js/p2-features.js（chk 所在 IIFE 新增 dcfPFish 助手走 window.dcfGet，修跨 IIFE 引用 dcfP 必抛 ReferenceError）、build.mjs（哨兵 +2；#132 摸鱼锚 dcfP('fish',35)→dcfPFish(35)——原锚即作用域 bug 本体，改锚已在 name 里说明）、FIX-REGRESSION.md（#223/#224 行+设备索引「荣耀畅玩40 Plus（夸克）」行）、tools/verify-gc-color.mjs（新增 14 断言）、tools/verify-func-card-prob.mjs（A9 期望随 #224 更新）**；构建状态：**已构建·sw mochi-mtq1331l·哨兵 490/490 哑 0·sw 14/14**）。
- #223 根因（v3.9.x 对比度保护设计缺陷）：pickGcColor 选色后 gcColorPairBad（阈值 2.2）不达标即回滚旧色。从默认黑气泡+白字出发：粉/浅色气泡对白字对比 1.1~1.5 全被拒、深色文字对黑底同样被拒，两步互锁——用户无论先改哪个都弹回（三步中转无人能想到）。与机型无关纯逻辑 bug。单聊同功能 v3.26.x 已改自愈方案（chat-settings._ensureBubbleContrast），群聊漏改，本次对齐。
- #224 根因（#132 接线作用域错）：dcfP 定义在「同频/伸手」IIFE（2083-4304），摸鱼抓包检查器 chk 在另一 IIFE（4312-4375）里引用——必抛 ReferenceError；且 chk 中断后 lastTa 不更新 → delta 恒>0 → 每分钟继续抛，还污染用户诊断「最近错误」环。
- 验证：node --check 过；--check-sentinels 490/490 哑 0；verify-gc-color **14/14**（无头真实 UI 端到端：美化→我的气泡颜色→选樱花粉→确定——颜色生效且持久化不回滚、低对比自愈注入黑字、文字改黑后自愈自动移除、导入黑底黑字自愈兜底、恢复默认自愈移除、全程零未捕获错误）；verify-gc-settings **26/26**、verify-func-card-prob **19/19**（A9 口径更新）、eat-remind 过；water-chat 13/24 红为存量（stash 对照 HEAD 基线同红，TASKS #130/#131 在册，本批未触碰喝水链路）。
- 随库说明：树上原挂 #222 收口后遗留的 stepper 归整一行（WORKLOG 2026-09-06 22:4x 已登记、完整），本次构建随库带入产物。
- 【真机:待验证】（荣耀畅玩40 Plus+夸克 及任意机型）：①群聊→右上设置→美化聊天→改「我的气泡颜色/联系人气泡颜色/文字颜色」任意色板色——改完不再弹回旧色；②配成极低对比时消息文字仍清晰（系统自动换黑/白文字）；③设置页诊断「最近错误」不再出现 dcfP is not defined。

### 2026-09-06 03:0x（#214 屏幕适配诊断页面专项：聊天页/主页两节采集+判定；已构建）
* [AI-B 域]（**改动文件：src/js/device.js（collectScreenDiag 页面专项：聊天页可见性/消息节点/内容高/输入栏底边宽+主页页数/图标数/池内组件名单/tabbar 底边；报告 == 聊天页 == / == 主页 == 两节；输入栏贴底判定（键盘已收时））、build.mjs（FIX_SENTINELS 2 条）、FIX-REGRESSION.md（#214 行）**）。
* 动机：用户点名 iOS 问题集中在聊天/主页两处，文档级诊断缺页面级数据（池内组件名单直接回答「图标/组件去哪了」）。
* 验证：node --check 过；--check-sentinels 488 全绿；CDP 实测两节输出。
* 待真机：任意机型报告出现两节页面数据；桌面缺组件时名单直接指出。

### 2026-09-06 02:3x（#213 屏幕适配诊断增强收官：视口时间线回放+系统版本行；已构建）
* [AI-B 域]（**改动文件：src/js/mobile-adapt.js（isIOS 块内视口时间线环形缓冲 60 条/每秒 1 拍 + __mochiVvTimeline 导出）、src/js/device.js（屏幕适配报告尾部时间线回放段 + 基础节系统版本行 osLine）、build.mjs（FIX_SENTINELS 4 条）、FIX-REGRESSION.md（#213 行）**）。
* 定位能力至此闭环：设备兼容诊断（全局+错误环自动监视）→ 屏幕适配诊断（实测+七判定+歧义引导+时间线回放）→ 功能诊断（25 项逐个打开）。瞬态过程（键盘/白带出现前后）从「丢失」变「可回放」。
* 验证：node --check 过；--check-sentinels 486 全绿。
* 待真机：任意 iOS 机型报告尾部出现时间线；打字/开关键盘可见 kb 跳变与 Δ 高度。

### 2026-09-06 22:4x（群聊回复概率/时间可调 + 群聊美化对齐聊天美化（圆角/时间色/正在输入+美化方案整套））· 未构建·本会话直接受理本任务
- [AI-A 域·跨域声明：本口直接改 AI-A 名下 group-chat.js/group-chat.css + AI-B 名下 dark.css，用户直接指派本任务]（**改动文件：src/js/group-chat.js（群聊设置面板 renderMainSettingsView 新增「群聊回复」段 gc-prob/gc-rs-min/gc-rs-max 三个 stepper，读 window.groupChatCfg、写 window.saveReplyCfg（gc-* 全局=全部联系人）；GC_BEAUTY_DEFAULTS 新增 bubble-radius/time-ink/typing-ink、GC_DARK_DEFAULTS 补 time-ink、applyGcBeauty 补三个 CSS 变量、新增 GC_BUBBLE_RADII 常量与 pickGcBubbleRadius 滑块、renderBeautyView 新增圆角/时间轴颜色/正在输入颜色三行+「美化方案」段（保存/管理）；新增群聊美化方案整套模块：window.saveGcBeautyScheme/openGcBeautySchemes（保存/应用/改名/删除/预览还原/导出/导入，键 gc-beauty-schemes 存全局，GC_BEAUTY_KEYS 覆盖 gc-beauty 全部子键））、src/css/group-chat.css（新增 .gc-set-stepper 样式）、src/css/dark.css（.gc-set-stepper .txt 暗色）、tools/verify-gc-settings.mjs（新增 26 项验证脚本）**；构建状态：**未构建**——只改 src，构建权留构建者收口时随库打入）。
- 需求/反馈：①用户要能在「群里的设置」里直接调全部联系人的群聊回复概率和时间（此前 gc-* 键存在但只在全局回复设置页有 UI）；②群聊美化是「阉割版」，要对齐聊天美化。
- 方案：①群聊设置面板新增「群聊回复」段，3 个 stepper（每个联系人回复概率%/回复速度最短/最长秒），复用全站 .stepper 交互，全局生效=全部联系人；附说明提示完整项在「设置→回复设置→群聊被动回复」。②群聊美化补三视觉项（气泡边缘圆角 滑块、时间轴颜色、正在输入颜色）并完整移植聊天美化方案（保存/应用/改名/删除/预览/导出/导入）。
- 验证：node --check 过；--check-sentinels 483/483 哑 0 sw 12/12（未碰他人锚点）；**无头端到端 verify-gc-settings 26/26**（临时副本构建含本批改动：R1-R6 群聊设置面板三 stepper 出现且 ±/输入即写全局 gc-*（概率 42→40 就近归整/最短 1→2/最长 40→39）；R7-R10 美化视图五入口齐全；R11-R13 应用方案即时改 --chat-bubble-radius/--msg-time-ink/--typing-ink；R14 写全局 gc-beauty 持久化；R15-R16 存方案→管理列表出现且 应用/改名/删除/导出/导入/预览 齐全）。测试中发现并修复一处 stepper 输入归整偏差（概率 step=5 时手输 42 未就近归整，已改 Math.round(v/sp)*sp 与全站回复设置页一致）。栈内另有 #221 贪吃蛇待下口构建。
- 【真机:待验证】①群聊右上角三点→群聊设置→「群聊回复」可调概率/速度（数字直接点输、±可用），改完所有成员回复节奏随动；②美化→气泡边缘圆角拖动即时变；时间轴颜色/正在输入颜色可选；③美化→保存当前为美化方案→管理→应用/改名/删除/导出/导入全可用，应用后群聊立即生效、所有桌面通用。

### 2026-09-06 20:4x（#219 背景模糊/遮罩失效 + #220 打开聊天消息先跳动——小米15Pro/Chrome 151 报障，用户明说其他机型也有；已构建·sw mochi-mtpt0eky·本次构建者：AI-B=本会话）
- [AI-B 域]（**改动文件：src/css/home.css（#219：.phone-bg-mask z-index:0→2）、src/js/chat.js（#220：renderWindow 登记 windowRenderedN/Prefix/Stale 屏上渲染凭据、新增 inplacePatchIfSameWindow 同窗原地补丁、enterChat 重开同窗跳过整窗重建、权威读库收尾/mochi-restore-done 同窗补丁否则重渲、addRec 增量追加后对齐登记条数（批量期跳过）、runDeferredNormalization 窗口内改动置 windowStale、clearChatHistory/chatImportMsgs 凭据复位、idle 已读回执占位打 pendingRead 标记）、build.mjs（哨兵 +6）、FIX-REGRESSION.md（#219/#220 行+设备索引小米15Pro）、tools/verify-desk-beauty.mjs（+M1~M3 断言 17 项）、tools/verify-chat-rebuild.mjs（+S5 三断言 16 项）**；构建状态：**已构建·sw mochi-mtpt0eky·哨兵 483/483 哑 0·sw 14/14**）。
- #219 根因（home.css，#147 回归）：#147 把壁纸改画到常驻图层 #phone-bg-layer（z-index:1，插在 .phone 最前）后，模糊/遮罩层 .phone-bg-mask（z-index:0）被整个压在壁纸下面——白遮罩被盖=调遮罩无感；backdrop-filter 向下采样不含壁纸=调模糊无感。与机型/壁纸类型无关（z 序恒 z1>z0），故多机型通病。修复一行：z-index:0→2（与 .page 同值但 DOM 序靠前，同值后到者胜，页面内容不受影响）；.blur-on 门控红线不变。
- #220 根因（chat.js，#211 第三条漏网路径）：enterChat 无条件 renderWindow 整窗重建 + 权威读库收尾 changed=true 时也无条件整窗重建——小历史桌面打开聊天=渲染两次（LS 快照→IDB 权威，_lsLite 剥离/已读回执占位/尾巴合并使 changed 几乎必真），200 气泡全部重建重新解码=肉眼跳动。#211 修了收发(addRec)与归一化收尾(finish)，本条补齐「重开+权威到达」。修复：同窗同貌判定（同桌面/窗口尾贴最新/DOM idx 恰为 renderStart..len-1 有序/windowStale=false/窗口内无 lite 残留）命中则跳过整窗重建，只原地替换已读回执占位；不命中照旧重渲。大历史窗口态（renderStart>0）同样支持；自纠记录：首版门槛 len≤RENDER_MAX 使大历史用户（恰是报障人群 1091 条）不进补丁路径，S5 无头实测抓出后已改为窗口化判定；lite 残留必须整窗重渲（图/语音真变了）。
- 验证：node --check 过；构建哨兵 483/483 哑 0；verify-chat-rebuild **16/16**（S5：种 302 条大历史冷启动重开零 childList 变动+贴底）、verify-desk-beauty **17/17**（M1 遮罩 z2>壁纸 z1/M2 blur(12px) 激活/M3 遮罩 alpha=0.6）、chat-tail 27、chat-send-recover 11/11、verify-snake-touch 9/11（见并行说明）。
- 并行批次随库说明：树内 #221 贪吃蛇手感（snake-game.js 双槽输入队列/轴锁解锁/pointerdown + chat-pages.css touch-action + tools/verify-snake-touch.mjs，源码锚点 F 段 5/5 绿）已随本口构建带入产物；其行为断言 C（L 形拖动）/D（pointerdown 转向）无头环境 2 项红，归属该会话待其定性（本口未动 snake 源码）。另 #132 功能字卡概率（AI-A，WORKLOG 首条已登记）同库。
- 【真机:待验证】（小米15Pro/Chrome 151 及任意机型）：①设壁纸后拖【背景模糊】背景变模糊、拖【背景遮罩】背景变淡（预设/纯色壁纸同样生效）；②聊天页退出重开、冷启动直接进聊天、正看聊天收新消息——消息区不再跳动闪一下。

### 2026-09-06 21:3x（#221 贪吃蛇手机端操作性——C/D 红项定性+基点重置补丁；未构建·待下口带上；本会话=AI-A）
- [AI-A 域]（**改动文件：src/js/snake-game.js（双槽输入队列 nextDir2+applyDir 消费头一格+轴锁 1.5× 反超解锁+dpad pointerdown+【后补】touchmove 有效 move 即重置 touchBase）、src/css/chat-pages.css（snake-dp/snake-btn touch-action:manipulation）、build.mjs（哨兵 +5，编号 #221——219/220 已被占用已让位）、FIX-REGRESSION.md（#221 行）、tools/verify-snake-touch.mjs（新增 11 断言）**；构建状态：**未构建**——snake-game.js 含收口后新补的基点重置一行，构建权留下口随库带上）。
- 【AI-B 会话请查收·C/D 红项定性】：首跑 9/11 红在 C/D **非产品缺陷**——①脚本前置没走通：开屏须 `__mochiDataReady` 后点进入、面板须经聊天页入口（`.app[data-app="chat"]`→enterChat）打开，直接 openSnakePanel 在 page-chat 隐藏时 fixed 面板量到 0 尺寸、触点全落空；②前置修好后对临时副本构建实测 **11/11**（含 C L 形拖动不抬手转向、D pointerdown 单独到达即入队）。且顺出并修复一处真缺陷：touchmove 同向 return 不重置 touchBase → 横滑一段再拐弯时 1.5× 反超判据对累计位移永不成立（CDP 触点 payload 实测 200px 横移+36px 上移不转向）——该补丁在产物 mtpt0eky 构建之后才落树，**线上 L 形拐弯仍带病，下口构建务必带上**；构建后请复跑 `SERVE_DIR=<产物> node tools/verify-snake-touch.mjs` 应 11/11。
- 验证：node --check 过；--check-sentinels 483 全绿哑 0；临时副本全量构建（含基点重置版）哨兵 477/477 哑 0；verify-snake-touch **11/11**；存量回归全绿：verify-snake-fs-result **41/41**、verify-snake-features **8/8**、verify-snake-smooth **11/11**（均 SERVE_DIR 指临时构建）。
- 【真机:待验证】（任意手机）：①急转弯（贴墙先上后左连滑）不吞第一下转向；②一次触摸画 L 形（先横走再拐）不抬手即可转向；③方向键点按即时转向、快速连点不丢；④穿墙/安全/暂停/存档恢复等原行为不变。

### 2026-09-06 04:0x（#132 功能字卡概率显示+可调（温柔前缀25%等硬编码概率进字卡库UI）；已构建·sw mochi-mtpn6nsx·本次构建者：AI-A 本会话）
- [AI-A 域]（**改动文件：src/js/default-cards.js（DCF_DEF 默认表+window.dcfGet 暴露+14 个 stepper 绑定+wrj-heal 重同步）、src/template.html（fc 页 13 分类+dk 页查岗「使用概率」stepper+说明文案）、src/js/period.js（warmText 概率接 dcf-period 默认 25）、src/js/p2-features.js（dcfP/dcfHit 助手：fish35/eat35/sync60/reach55 单值替换+water 三处乘法门控）、src/js/garden.js（悄悄话 40）、src/js/chat.js（查岗回应 _dkP 默认 50）、src/js/room.js、src/js/cjian.js、src/js/drift-bottle.js、src/js/music-player.js（四门控默认 100+空串守卫）、src/pwa/notice.json（摘要指路行）、build.mjs（哨兵 +15）、FIX-REGRESSION.md（#132 行）、TASKS.md（#132 认领）、tools/verify-func-card-prob.mjs（新增 19 断言）**；构建状态：**已构建·sw mochi-mtpn6nsx·哨兵 472/472 哑 0·sw 14/14**）。
- 需求：用户问「经期的温柔前缀字卡使用概率是多少」（答：硬编码 25%，触发后 45% 前缀/35% 动作/20% 双拼）；要求【系统预设字卡】显示概率可自由调整，对齐【聊天默认字卡 30%/自定义 70%】全显示出来。
- 方案：新键 dcf-<分类>（per-cid），默认=各分类历史硬编码值（行为不变），字卡库【其他互动功能字卡】页每分类一个 stepper（0=该分类字卡不触发）+【查岗】页同款；消费方 window.dcfGet 读取——fish/eat/sync/reach/garden/deskcheck 单值替换非叠加，water/room/cjian/drift/music 乘法门控（默认 100 不改内部节奏），随 mochi-wrj-heal 重同步。【聊天默认字卡】dc-overall-chat 30% 既有 UI 不动。
- 验证：node --check 全过；verify-func-card-prob 19/19（A 段 14 锚点/B 段 vm 桩跑 default-cards.js 真实源码验 dcfGet 默认表+clamp+设 0 关断/C 段概率行结构）；verify 10/10、chat-rebuild 13/13、chat-tail 27、reply-guide 18/18、chat-send-recover 11/11、quote-image 21/21、media-pool 8/8、cover-direct 17/17、screen-diag-opt 55、viewport-form 54、ios-kb-stuck 26、reserved-standalone 29、kb-residue-heal 10/10、fs-nav-hide 8/8、fullscreen-ipad 25、ta-pause 23/23、ta-pause-live 15/15、cc-group-off 12/12、cc-mine-clean 14/14、garden-dataloss 27/27、garden-desk 9/9、water-chat 24/24、eat-remind 20/20、period-care 32/32、period-save 15/15、music dur-cover/history-cover/ta-fav-keep/bg-resume/single-audio 全过。
- 定责说明：room A8、cjian 38/49 与 lib 12/14 与 desk 10/11 与 mix 25/27、cjian-slots A2、water E1、eat-menus T3×2、drift B27/B28、period-mark D1、music-no-seed A2——git stash 对照 HEAD 基线逐项同红＝存量（TASKS #130/#131 在册），本批零新增回归。
- 【真机:待验证】字卡库→其他互动功能字卡页各分类下出现「使用概率」随 ± 更新；「经期字卡概率」设 0 后 TA 经期回复不再出现温柔前缀/动作；查岗页设 0 后查岗回应不再拼字卡。

### 2026-09-06 02:0x（#212 force 形态发消息后白边/上移：healViewport 自愈看门狗；已构建）
* [AI-B 域]（**改动文件：src/js/mobile-adapt.js（healViewport #212 看门狗：standalone+fs+稳态+force 键 → .phone 底边短缺>8px 即重写 safe-top/ios-h 期望值+清内联高+scrollTop 归零，1s 自愈）、build.mjs（FIX_SENTINELS 1 条）、FIX-REGRESSION.md（#212 行）**）。
* 根因：force 声明下 .phone=852 超布局视口 59px 属预期，键盘周期 WebKit 偶发打回滚动/内联高 → 白边+上移，瞬态无法源头堵死，看门狗验收式自愈是稳妥方案。
* 验证：node --check 过；--check-sentinels 458 全绿；产物锚点在位。
* 待真机（iPhone 15 Pro force 开）：发消息后不再白边（1s 内自动复位）。

### 2026-09-06 01:4x（#211 诊断工具可发现性：保留/覆盖歧义形态报告引导用户用顶部避让修正开关；已构建）
* [AI-B 域]（**改动文件：src/js/device.js（判定器对保留形态 force 未开时追加「歧义形态提示」说明行：顶部融合/点不动 → 开【顶部避让修正】即修；force 开启后提示消失）、FIX-REGRESSION.md（#211 行）；构建状态：已构建·sw 见 version.json**）。
* 动机：iPhone 17 Pro 报障顶栏融合灵动岛点不动——保留/覆盖两形态信号相同程序不可分，全 ✓ 报告掩盖了「开关可自服」的事实。引导行使报告本身成为修复入口。
* 验证：node --check 过；判定器四场景单测全过；--check-sentinels 全绿。
* 待真机（iPhone 17 Pro）：更新后屏幕适配诊断出现歧义提示 → 按提示开开关 → 顶栏/底栏恢复。

### 2026-09-06 03:0x（自建聊天字卡「只加了一点点」使用提醒：默认字卡 30% 概率弹窗提示，每天首次使用也提醒；未构建·随后续收口）
- [AI-A 域]（**改动文件：src/js/chatcard.js（新增 todayKey()/maybeLowCardsRemind()——进入公用/专属字卡页（基础聊天入口，功能字卡入口不走）时若：①自建聊天字卡（公用+专属，剔除功能分类）张数 >0 且 <5000；②默认聊天字卡总开关开启、聊天场景使用开启；③聊天触发概率仍为默认 30%（dc-overall-chat 未设或 ==30）则用 window.openModal 弹「字卡使用提醒」，文案说明：默认字卡触发概率默认 30%、自建字数少又不调高此概率时 TA 会一直重复相同内容，建议多添加自建字卡或在「预设字卡→聊天默认字卡」调高概率；同时注明仅零自建字卡时 100% 用默认字卡。频控=每天最多一次：cc-lowcard-remind 存上次提醒日期 YYYY-MM-DD，同日不再弹、次日首触再弹（用户要求「每天首次使用也会提醒」），条件不满足的日子不打扰）**；构建状态：**未构建**——只改 src+node --check 过，构建权留收口会话随库打入）。
- 需求/方案：用户要求「当公用/专享字卡添加了一点点时，弹窗提醒默认聊天字卡触发概率只有 30%，不自建字卡又不调高概率可能让 TA 一直用重复内容；只有完全没添加任何自建聊天字卡时才 100% 用默认字卡」，并要求「每天首次使用也会提醒」。已确认：零自建时 100% 走默认字卡由 getPool 兜底保证，行为无需改动；本口只做弹窗提醒，频控由「永久一次」改为「每天一次」。
- 自验：node --check 过；--check-sentinels 建议构建者收口时跑（本批未碰他人锚点）。
- 【真机:待验证】在较少自建字卡（<5000 张）且默认概率仍 30% 时进「公用字卡/专属字卡」页弹提醒；同日再进不再弹；次日首进再弹；已调过概率或零自建或走「其他互动功能字卡」入口不弹。

### 2026-09-06 02:2x（#218 互动频率引导提示：用户要求「不改任何默认值，只提醒+引导用户自己去调概率/开关」；已构建·sw mochi-mtooyfox·已随联合批次提交；本次构建者：本会话=收口口）
- [AI-A 域·跨域声明]（**改动文件：src/js/reply-settings.js（文件尾新增提示条模块：window.replyGuideHint(kind)——仅聊天页可见时弹、频控=每天最多一次（reply-guide-day 存当日日期；用户决策：不设总次数上限），同日重复触发静默、次日可再弹，点提示条或手动进过回复设置页(row-general)即落 reply-guide-done 永久关闭；点击跳转=设置 tab 与 row-general 各 click 一次复用现有导航；零默认值改动）、src/js/chat.js（跨域，理由：触发点全在聊天链路且用户直接指派；三处一行调用+守卫：scheduleReply count≥2→'py'、tryAutoSend 首条主动消息落地 i===0→'as'、tryActiveInvite sendTaInvite 后→'inv'）、src/css/base.css（#reply-guide-hint 提示条样式，对齐 #cc-toast 的 bottom 120px+safe-area/z-index 99；.reply-guide-note 说明行内边距）、src/template.html（两处静态文案：开屏摘要 splash-hl 一行（离线兜底）、page-reply-settings 顶部 gs-sub 说明行）、src/pwa/notice.json（summary 插一条 hl 与模板兜底同步）**；构建状态：**未构建**——树内尚有 #217 屏幕适配六件套（device.js/tabs.js）/错误环三补强（device.js）/#216 音乐封面/#214 manifest 等在途批次，构建权留收口会话随库打入）。
- 需求：「默认功能和概率全都是打开的，总有人对概率太高不满意——不改默认值，就要提醒用户自己调」。
- 方案：不设档位、不降默认，三措并举——①触发点就地提醒：三类随机行为命中且用户正看聊天时，底部弹可点提示条「…是随机概率触发的，嫌频繁可在设置→回复设置调低或关闭 · 去调整」，点击直达回复设置页，每天最多弹一次（用户决策，同日触发不重复打扰）；②回复设置页顶部加说明行「都是触发概率(%)，调 0=不触发，开关关掉=彻底关闭，即时生效」；③开屏公告摘要补一行（notice.json+模板兜底双写）。文案只提确有设置项的三类（主动消息 as/连发 py/邀请 inv），不提无设置项的情绪字卡链等，避免误导；聊天页不可见时静默跳过、不占当日名额，不打扰其他页面。
- 验证：node --check 过（chat.js/reply-settings.js）；--check-sentinels 457 全绿哑 0（未碰任何他人锚点）；新增 tools/verify-reply-guide.mjs **18/18**（A 段 8 断言=chat.js 三触发点+守卫/模板两处/notice/base.css 锚点在位；B 段 10 断言=vm 桩环境载入 reply-settings.js 真实源码+可拨动假时钟：首次弹+落当日日期/同日重复静默/次日可再弹/页不可见不弹且不占当日名额/点击落 done+跳转/done 后次日仍静默/手动进过设置页即沉默）。
- 待对方处理：无。chat.js 三处插入行（scheduleReply 3338 后/tryAutoSend 3759 后/tryActiveInvite 3704 后区段）与 #211 归一化渲染闸（622-660/2840）、#215 发送取值（8300+）零重叠；template.html 只动开屏摘要行与 page-reply-settings 顶部两小段。
- 【真机:待验证】TA 主动消息/连发多条/邀请出现且停在聊天页时底部弹提示条，点「去调整」直达回复设置且此后不再弹；同日只弹一次、次日可再弹（直至用户点过提示条或进过回复设置页即永久关闭）；其他页面/桌面触发不打扰。
- 收口补账（本会话=构建者）：node build.mjs 过（sw mochi-mtooyfox，哨兵 457/457 哑 0、sw 14/14）；触及相关 24 脚本复跑：verify 10/10、chat-rebuild 13/13、chat-tail 27、chat-send-recover 11/11、quote-image 21/21、media-pool 8/8、reply-guide 18/18、viewport-form 54、screen-diag-opt 55、kb-stuck 26、reserved-standalone 29、kb-residue-heal 10/10、fullscreen-ipad 25、fs-nav-hide 8/8、cover-direct 17/17、dur-cover/history-cover/ta-fav-keep/bg-resume/single-audio 全过、ta-pause-live 15/15。verify:all（220 项）159 绿/60 断言失败/1 超时——**已用 git worktree 检出 HEAD 旧产物基线定责：verify-diag-report 17/18 与 verify-music-ta-control C2 在旧产物同样红=存量**（其余失败脚本均不涉及本批触及文件，清单按套件提示留 FIX-REGRESSION 后续 triage；需要对方处理：上述两条存量失败归属会话择机定性）。
- 编号备注：本条任务号 #218（#217 已被屏幕适配会话占用）。

### 2026-09-06 02:1x（#217 屏幕适配诊断优化六件套：⑤e 停靠残留+⑤f 横向贴合判定、离开抢拍补「切页前最后一帧」盲区、监视二次确认降噪、SIG 机读行+先更新再测；未构建·随下一口构建带上；本次构建者：非本会话）
- [AI-B 域]（**改动文件：src/js/device.js（屏幕适配诊断段 2050~2320：collectFitInp 扩采 phoneW/phoneInlineH/phoneAlignSelf/tablet/andr/kbAnd（安卓探针连 prov 推定停靠）；判定器新增 ⑤e「.phone 停靠残留」（双端键盘探针+vv 收缩三重守卫防键盘期误报，#209 同族对号条目）与 ⑤f「横向贴合」（宽度轴此前零判定，#187 起平板也全宽无限宽豁免，桌面手机壳跳过）；⑦ letterbox 提示加 isAndroid 门控降噪；报告尾新增 SIG 机读签名行（固定键序 JSON，开发者可脚本对号/录台账）；手动诊断拉远端 version.json（2.5s 超时）做「先更新再测」ts 比对（#215 实锤存量旧版是症状大半来源）；sdTick 二次确认降噪（首见只存档、连续两 tick ≥5s 持续才入错误环，瞬态证据不丢）；sdRingPush 上限 20→30 且满时先逐最旧 [屏幕适配] 条目（保 JS onerror 不被 SD 爆发顶出）；sdHistSave 坏/好快照各保底 4 条分级保留；新增 window.__mochiLeaveSnap 离开抢拍（限频 3s，只看键盘探针不看 activeElement——#197 族焦点保留正是要抓的现场）+ .page hidden 微任务观察器（device.js 注册早于 tabs.js syncChrome 的 blur=自愈前现场）+ hidden/pagehide 挂接）、src/js/tabs.js（tab 点击/外观/主题返回/返回键回退四处切页 hidden 之前调 sdLeaveSnap 抢拍——syncChrome blur 即自愈点，必须同步先采；仅钩子一行×4+定义，syncChrome 本体未动）、build.mjs（哨兵 +11 追加式；⚠ #210 letterbox 哨兵锚因本批加 andr 门控收窄为 `!F.some(function (f) { return !f.ok; })`，全量门控另立 #217 锚，已确认哑 0）、tools/verify-viewport-form.mjs（C 段 fixture 补 andr:true 适配门控+新增 iOS 不出提示断言，54/54）、tools/verify-screen-diag-opt.mjs（新增 55 断言：⑤e 七场景/⑤f 六场景/门控三场景/SIG+版本链路八场景/坏快照分级四/环先逐出三/二次确认四/离开抢拍五/钩点源码序六）；构建状态：**未构建**——树内尚有 错误环三补强（device.js 300-380/730/1216 段，与本改 2050+ 段零重叠已 git diff 核实）/#216 音乐/#214 manifest/开屏按钮文案（template.html）等在途批次，构建权留收口会话随库打入）**。
- 背景：用户问【屏幕诊断】还能怎么优化，经代码核实后指定「优化正确的」落地；原八条建议中「键盘态自动监视」经核实撤回（#179 键盘期守卫是防误报刻意设计，键盘态专项判定需另行设计防重蹈 14 Pro 误报）。
- 自验：node --check 过；--check-sentinels 457 全绿哑 0；verify-screen-diag-opt 55/55；相邻回归 viewport-form 54/54（适配后）、kb-stuck 26/26、reserved-standalone 29/29、kb-residue-heal 10/10、fs-nav-hide 8/8、chat-rebuild 13/13（他会在途版）、chat-tail 27/27、keep-audio 18/18。自纠：F 段脚手架曾把 LS 实例二次包 makeLS 致 F2/F3 空过，已修（隔离实测环逻辑本就正确：30 条、SD 先逐出 5）。
- 【真机:待验证】（任意机型，重点红米 K70/Edge 复测 #209 家族）①聊天页打字收键盘后立刻切页→下次屏幕适配诊断「历史快照」应出现 [switch] 条目（抢拍盲区闭合）；②安卓残留真发生时报告出「✗ .phone 停靠残留」条目；③平板/窄窗报告出「横向贴合」条目；④报告尾有 SIG 行可 JSON 解析；⑤远端有新版时报告头部出「⚠ 版本链路：远端比本机新——建议先更新再测」；⑥iOS 全屏诊断不再出「页外留白提示」行（安卓仍出）。

### 2026-09-06 01:46（开屏进入按钮文案「点击进入」→「我已阅读并知晓」；未构建·随下一口构建带上）
- [AI-B 域]（**改动文件：src/template.html（按钮文案+lic 功能页同步）、tools/tmp-invite-ask.mjs（过开屏文字匹配同步）；构建状态：未构建——树内 #211/#215/#216 等在途批次未收口，构建权留收口会话随库自然带上）**。
- 背景：用户对策「开屏公告没人看」，本口只做按钮文案一项（进入动作显性化为已读确认）；「首访强读一次」机制用户未拍板，未做。
- 自验：node --check 过；--check-sentinels 457 全绿哑 0（未碰他人锚点）；各 verify/诊断脚本均按 #splash-enter id 定位按钮，无文字依赖（已核）。
- 【真机:待验证】数据就绪后按钮显示「我已阅读并知晓」，滑底置灰/加载门控行为不变。

### 2026-09-06 01:2x（#211 聊天闪动双源收口：收发消息整窗重建 200 气泡 + 归一化收尾无条件重建；本次构建者：无——本会话未构建，构建权归在途会话收口时顺带）
- [AI-A 域]（**改动文件：src/js/chat.js（①addRec 窗口超限判定 RENDER_MAX→WINDOW_MAX；②runDeferredNormalization finish 渲染闸 changedHi/removedAll/sysNickChanged）、build.mjs（#211 哨兵 +2）、FIX-REGRESSION.md（#211 行）、tools/verify-chat-rebuild.mjs（新增 13 断言，verify:all 自动纳入）**；构建状态：**未构建——修复①已随并行会话 00:47 产物 mochi-mtom8td8 在树（裹入时 chat.js 仅含修复①），修复②待下次构建带上（哨兵已登记，--check-sentinels 446 全绿哑 0）**）。
- 需求：iQOO12+Chrome 151 报「打开聊天偶尔会闪动+对方回复消息会闪一下」，用户明说其他设备型号也有。
- 根因两处（均与机型无关、与**历史条数**相关，解释了「同版本有的设备不闪」）：①addRec 窗口超限判定 `msgs.length - renderStart > RENDER_MAX` 在每次钳位渲染后（renderStart=len−200）只要再来一条消息就恒为真——历史 >200 条的桌面每收/发一条消息都整窗重建 200 个气泡（img 全部重建重新解码=肉眼闪一下）；≤200 条的桌面 renderStart=0 从不命中。②后台分批归一化 finish 曾在「发现任意改动且聊天页可见」时无条件 renderWindow 整窗重建——历史里有待迁移老格式数据时打开聊天必白闪一次（改动全在窗口外也闪）。
- 方案：①判定收紧到 WINDOW_MAX(400) 硬上限（与 loadOlderIncremental→pruneWindowBottom 同口径），常规收发走 renderMsg 增量追加，DOM 上限语义不变；②finish 记录改动最靠后下标 changedHi 与结构性删除数 removedAll——改动全部在窗口外（changedHi<renderStart）时跳过重建只落盘，屏上数据真变了仍重渲，sysNick 清扫/相邻删除（下标位移）保守整窗。
- 验证：node --check 过；tools/verify-chat-rebuild.mjs 13/13（S0-S4 无头 Chrome 实测 9MB 懒读大历史：打开静置/对方回复/自己发送零整窗重建+回复走增量追加，MutationObserver 分类；G1-G4 抽 chat.js 真实源码桩环境验渲染闸四场景）；verify-chat-tail 27/27、quote-image 21/21、media-pool 8/8；tmp 探针已删。
- 待对方处理：无。chat.js 本会话只占 #211 两处（2840 附近/622-660），#215 在途区域（输入栏取值）与之无交集；下次构建请带上修复②（构建自然包含）。
- 【真机:待验证】（iQOO12 及任意大历史桌面）：打开聊天与连收多条消息，消息区均不再整屏闪；小历史设备行为不变。

### 2026-09-06 01:1x（信息诊断错误环三补强：条目带版本+启动序号、案发视口现场、去重计次；未构建·随在途联合批次收口）
- [AI-B 域]（**改动文件：src/js/device.js（复制诊断模块：errSnap 补 v（版本）/b（启动 id#N）字段 + pushErr 时 mochiVvDiag 六值迷你现场 vp（fs/vv/gap/平移/scale/kb，~50 字符）；30s 去重改累加次数 c；报告头部时间行带「本次启动 id#N」、最近错误逐条输出 [版本]/启动/×N/｛现场｝，旧条目与监视器直写条目无字段自然省略）**；构建状态：**未构建**——树内 #211/#215/#210/#216 联合批次 staged 在途（其 device.js 改动仅 ~1972 行 mochiViewportForm 一处，与本改 300-380/730/1216 三段零重叠已 git diff 核实），构建权留收口会话随库打入）。
- 背景：用户问【信息诊断】还能怎么优化，八条建议中指定 1/2/7 落地（错误归属/案发现场/重复计次）。
- 自验：node --check 过；--check-sentinels 446 全绿哑 0（未碰任何他人锚点）。
- 【真机:待验证】任意机型触发一次报错后打开诊断：最近错误条目带 [v3.26.x]/启动 id#N/×次数/｛现场 fs= vv= gap= 平移= s= kb=｝；报告头部「本次启动」与条目 b 对号。

### 2026-09-06 01:5x（#216 音乐封面全丢含新加（一加Ace3+Edge 多机型）+ #214 standalone 顶部黑边残留（manifest theme_color）——src/tools/台账全就绪·未构建，移交下一口构建者随库；本次构建者：非本会话）
- [AI-A 域·跨域声明]（**改动文件：src/js/music-player.js（封面管线直链化：resolveCoverDirect 落库前跟随 302 解析网易 CDN 直链 + normNeteaseCoverUrl 统一 https?param=300y300 + fetchNeteaseCoverFallback 第二封面源 + COVER_PROXY_RE 存量代理封面迁移队列（打开音乐页窗口化/歌单/正在播放/切歌四触发点 + 历史/我的历史/TA收藏快照同步，in-flight 用不落盘 Set）；跨域改 AI-A 名下音乐文件，理由：用户直接指派修复）、src/pwa/manifest.json（theme_color #111111→#e9e9e9：#201 只改 meta，该机 standalone 形态安卓 Edge 取 manifest 仍黑边）、build.mjs（哨兵 +5 追加式未动他人条目 + 检查器扩 artifactText 支持 pwa/ 产物文件与非 js/css 免压缩比对）、tools/verify-music-cover-direct.mjs（新增 17 断言端到端）、FIX-REGRESSION.md（#214/#216 行 + 设备索引一加Ace3）**；构建状态：**未构建**——树内尚有 #211（chat.js 闪动收口）/#215 华为P50E（chat.js 发送取值兜底）/#210 letterbox 提示行（device.js）等在途批次，按不夹带+禁并行构建规则本会话只改 src+台账；下一口构建者构建时随库自动带上，构建后请复跑 node tools/verify-music-cover-direct.mjs 应 17/17）。
- 需求/根因/方案：见 FIX-REGRESSION 216/214（封面=全链押第三方单点 injahow：存量封面本存的就是其图片代理 URL，代理慢/挂新旧一起丢+新加歌 meting 8s 挂起即无封面，诊断三条 BodyStreamBuffer aborted 吻合；黑边=#201 只改 meta，standalone 形态安卓 Edge 状态栏取 manifest theme_color 仍 #111111）。
- 验证：node --check 过；临时副本全量构建哨兵 444/444 哑 0；verify-music-cover-direct 17/17；相邻回归 dur-cover 9/9、history-cover 8/8、ta-fav-keep 10/10、bg-resume 12/12、single-audio 15/15。
- 编号占用声明：#216（音乐封面）/#214（manifest 黑边）归本会话；#213 曾短暂占用已让出（并行会话已改用 #215），树内无 213 残留。
- 【真机:待验证】见 FIX-REGRESSION 216/214。
