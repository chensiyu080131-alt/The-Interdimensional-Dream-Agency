# 反诈人生

腾讯黑客松比赛项目 —— 一个帮助用户识别和防范电信网络诈骗的 Web 应用。

项目详细文档（部署、风险管理等）见 [`docs/`](./docs/) 目录：

- [docs/README.md](./docs/README.md) — 文档中心索引
- [docs/DEPLOY.md](./docs/DEPLOY.md) — 部署指南（腾讯云 CloudBase）
- [docs/RISK-MANAGEMENT.md](./docs/RISK-MANAGEMENT.md) — 产品风险管控（15 个风险点）

## 线上 Demo（CloudBase 静态托管）

- **公网访问地址**：https://ai-d9gd4xji5de241243-1453144747.tcloudbaseapp.com/
- **CloudBase 环境 ID**：`ai-d9gd4xji5de241243`（上海，体验版）
- **部署方式**：纯前端静态托管（`frontend/` 为单页应用，分 `index.html` + `data.js`（角色/剧本数据）+ `app.js`（逻辑），无后端依赖、无构建步骤）
- **重新部署**：在已登录 CloudBase MCP 后，执行
  `npx mcporter --config config/mcporter.json call cloudbase.manageHosting action=upload localPath=<绝对路径>/frontend cloudPath=/ isDir=true`
  再 `call cloudbase.manageHosting action=setWebsiteDocument indexDocument=index.html errorDocument=index.html`
- 注：另有一个通过 manageApps 创建的 WebApp 子域名 `https://fanzha-frontend-ai-d9gd4xji5de241243.webapps.tcloudbase.com`（构建模式失败，未实际使用，以静态托管地址为准）

## 功能对照（按《完整产品需求文档 V5.0》）

| PRD V5.0 模块 | 实现状态 | 说明 |
|---|---|---|
| 第零幕·角色选择（11 角色随机排序） | ✅ | 11 个预设虚拟角色，覆盖 A/B/C/D/E/F/G/H/K 共 10 类诈骗；卡片随机排序防锚定 |
| 第一幕·沉浸式对话（双重交互） | ✅ | 自由文本输入 + 快捷选项（热情/中性/谨慎/拒绝/反骗 五型），动态选项呈现 |
| 三大核心数值 | ✅ | 信息暴露度（可见进度条）、信任值、求助意愿值，随选择实时变化 |
| 情感节拍器 / AI 动态博弈 | ✅ | 四阶段（寻猪→诱猪→养猪→杀猪），按 Day 标注心理学手段 |
| 第二幕·崩塌 | ✅ | 损失金额跳动、财务对比、内心独白、真实案例弹窗 |
| 社交崩塌 + 蝴蝶效应 | ✅ | 3 条社交消息 + 模拟通讯录波及提示 |
| 第三幕·行动指南 | ✅ | 报警(96110)、紧急止损清单、心理支持、告诉家人 四个行动 |
| 外部干预系统 | ✅ | 警方 96110 劝阻模拟、告诉家人对话模拟 |
| 第四幕·时间线回放 | ✅ | 垂直时间线 + 心理学手段标注 + 平行宇宙模拟（输入替代回复看另一种结局） |
| 第五幕·盾牌（报告+工具箱） | ✅ | 个性化评分、弱点类型、八大反诈利器、20 个防诈关键词 |
| 风险管控（开场警示/一键退出/隐私过滤） | ✅ | 进入前风险告知弹窗、右上角"退出"、自由输入真实信息过滤 |
| 标题彩蛋《你刚才差点就信了》 | ⏳ | 报告标题动态呈现，可在后续迭代强化为结尾专属页 |
