# 反诈人生

腾讯黑客松比赛项目 —— 一个帮助用户识别和防范电信网络诈骗的 Web 应用。

项目详细文档（部署、风险管理等）见 [`docs/`](./docs/) 目录：

- [docs/README.md](./docs/README.md) — 文档中心索引
- [docs/DEPLOY.md](./docs/DEPLOY.md) — 部署指南（腾讯云 CloudBase）
- [docs/RISK-MANAGEMENT.md](./docs/RISK-MANAGEMENT.md) — 产品风险管控（15 个风险点）

## 线上 Demo（CloudBase 静态托管）

- **公网访问地址**：https://ai-d9gd4xji5de241243-1453144747.tcloudbaseapp.com/
- **CloudBase 环境 ID**：`ai-d9gd4xji5de241243`（上海，体验版）
- **部署方式**：纯前端静态托管（`frontend/` 为单页应用，无后端依赖、无构建步骤）
  - **V8.0（当前线上）**：`index8.html` + `data8.js`（身份/任务/多角色剧本/五幕）+ `app8.js`（五幕引擎逻辑）
  - V7.0（旧版备份）：`index.html` + `data7.js` + `app7.js`（未被 `index8.html` 引用，保留存档）
  - V5.0（旧版备份）：`data.js` + `app.js` + `script.js` + `style.css`（保留存档）
- **重新部署**：在已登录 CloudBase MCP 后，执行
  `npx mcporter --config config/mcporter.json call cloudbase.manageHosting action=upload localPath=<绝对路径>/frontend cloudPath=/ isDir=true`
  再 `call cloudbase.manageHosting action=setWebsiteDocument indexDocument=index8.html errorDocument=index8.html`
- 注：另有一个通过 manageApps 创建的 WebApp 子域名 `https://fanzha-frontend-ai-d9gd4xji5de241243.webapps.tcloudbase.com`（构建模式失败，未实际使用，以静态托管地址为准）

## 功能对照（按《产品需求文档 V8.0》—— 完整五幕版）

> V8.0 核心升级：在 V7.0「任务驱动」基础上，新增**完整五幕叙事结构**、**25-35 轮分支对话**、**确定性结局判定**、**身份解锁系统**。挑战从"识破骗局"变为"在完成任务的同时不被骗"，并完整经历希望→崩塌→废墟→回放→盾牌的情感曲线。

| PRD V8.0 模块 | 实现状态 | 说明 |
|---|---|---|
| 五幕完整结构（希望/崩塌/废墟/回放/盾牌） | ✅ | 坏结局触发第二幕·崩塌（黑屏序列：转账成功→好友消失→财务打击→社交瓦解→心理独白→真实案例→蝴蝶效应）；第三幕·废墟四行动按钮；第四幕·回放时间线；第五幕·盾牌报告 |
| 色彩随幕变化 | ✅ | 希望暖橙→崩塌冷灰→废墟暗红→回放中性白→盾牌科技蓝，整页渐变过渡 |
| 身份系统 + 解锁规则 | ✅ | 6 身份随机/选择；完成指定线 localStorage 持久化解锁后续身份（猎鹰默认，笔锋/灯塔/浮萍/寻人/鼹鼠按规则解锁） |
| 任务系统（6 类任务 + 依赖解锁） | ✅ | 指令/情报/时间/证据/劝阻/风险评估；猎鹰线 6 任务含紧急"联系小雅"；顶部实时任务 + 进度面板 |
| 对话轮次 25-35 + 分支叙事 | ✅ | 猎鹰线扩展为 Day1-5 细颗粒分支树（约 35 节点，含 8 个结局 E01-E08）；其余 5 线结构完整 |
| 数值系统（信任值/暴露度/证据/救援） | ✅ | 信任值 0-100（隐，影响结局）、信息暴露度定性条、证据 0-5、小雅救援进度独立可见条（仅含小雅线） |
| 多角色 AI 交互网络 | ✅ | 张浩/老K/小雅/匿名等多对话；消息列表切换、未读红点 |
| 骗子"反卧底"能力 | ✅ | 自由输入触发关键词/过度追问/过度配合检测，累计"怀疑度"，达阈值卧底/记者/线人/寻人身份被识破 → 暴露结局 |
| 结局确定性判定 | ✅ | 基于 route + 信任值 + 证据数 + 救援进度的 `determineEnding` 逻辑，每身份 2-8 个结局（含猎鹰 8 结局 E01-E08 全部可达） |
| 打字机效果 + 关系指示 | ✅ | AI 消息逐字呈现；顶部"关系▎▎▎▎"定性亲近度条 |
| 第四幕·平行宇宙 | ✅ | "如果当时你这样说……"输入框，生成替代走向模拟（含身份专属样本） |
| 第五幕·盾牌报告 + 工具箱 | ✅ | 评分（任务完成度+结局+怀疑度）、易受骗类型分析、星级、四统计、八大利器、20 关键词 |
| 风险管控（开场警示/一键退出/无真实信息） | ✅ | 进入前风险告知、随时退出、全程不索取真实信息 |
| AI 实时生成对话（混元大模型） | ⏳ | 预设话术树兜底（无需后端即可运行）；数据层已按"多角色 + System Prompt + 节点"结构组织，后续可无缝接入混元动态生成 |
| AI 生成场景背景 / 角色立绘（混元3D） | ⏳ | 当前以文字场景条 + 字母头像代替，后续可接入图像生成 |

## M5 · 小程序 / H5 适配、数据埋点、语音

在 M1–M4（安全护栏 / 内容库 / 游戏化 / 复玩性）基础上，M5 完成「可分发、可度量、更沉浸」三类能力：

### 1. 小程序 / H5 适配（`frontend/adapter.js`）
- 自动检测 **微信内置浏览器** 与 **小程序 `web-view`** 环境，向 `<body>` 注入 `data-env="wechat|miniprogram|browser"`，便于样式与提示区分。
- 已在 `index8.html` 配置 `viewport-fit=cover` + `env(safe-area-inset-*)` 安全区内边距，刘海屏 / 底部手势条正确留白。
- 提供统一返回入口 `H5Adapter.navigateBack()`：小程序内走 `wx.miniProgram.navigateBack`，否则回退，方便在小程序里做「返回小程序页」。
- **嵌入小程序**：在微信小程序中放置 `<web-view src="https://你的H5域名/index8.html">` 即可，无需改动游戏代码；建议同时配置业务域名与 TLS 证书。

### 2. 数据埋点（`frontend/analytics.js` + 后端 `POST /api/track`）
- **隐私优先**：仅采集匿名聚合事件（如 `game_start` / `scenario_start` / `ending_reached` / `redflag_hit` / `report_view` / `quickmode_finish`），**绝不记录姓名、手机号、聊天原文**，事件属性超长自动截断。
- 事件先入本地缓冲，按节流（6s）或在页面隐藏（`visibilitychange` / `pagehide`）时批量上报，使用 `fetch(..., { keepalive: true })`。
- 后端 `backend/src/controllers/analyticsController.js` **仅做计数聚合**（`byName` 计数 + 会话数），不落盘事件原文，仅写入聚合计数日志，便于评估教育效果而不留存 PII。
- 本地无后端时静默降级，不影响游戏运行。可通过环境变量 `ANALYTICS_ENABLED=false` 关闭。
- 聚合统计接口：`GET /api/track/stats`（运维观测）。

### 3. 语音播报（`frontend/voice.js`）
- 使用浏览器内置 **Web Speech API（SpeechSynthesis）** 朗读「骗子 / AI」消息（中文 `zh-CN`），零外部依赖、零网络请求。
- 顶栏新增 🔊 语音开关，状态持久化；不支持的浏览器自动降级为 no-op。长文本自动截断，避免朗读过长。
- 快速模式卡片话术同样支持朗读。
