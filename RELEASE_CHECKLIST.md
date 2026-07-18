# 发布清单 — The-Interdimensional-Dream-Agency (M1–M5)

> 用途：把本地已完成的 M1–M5 成果发布到 GitHub（公开/私有仓库）。
> 状态时间戳：2026-07-18。所有 M1–M5 提交已在本地 `main`，HEAD = `21b30b2`，待推送。

---

## ✅ 0. 发布前置条件（代码就绪度）

- [x] **M1 安全护栏**：`backend/src/services/safetyGuard.js` + 红队测试 `backend/tests/redteam.safety.js`（190/190 通过）
- [x] **M2 内容库 + 避坑报告**：`frontend/scamTypes.js` / `scenarios.js` / `report.js`（10 类诈骗 + 10 场景 + 报告生成）
- [x] **M3 游戏化**：`frontend/weakness.js` / `evidence.js` / `quickMode.js`（心理弱点 / 蝴蝶效应 / 图鉴 / 证据墙 / 快速模式）
- [x] **M4 复玩性**：`frontend/app8.js` 二周目、隐藏结局、话术变体
- [x] **M5 适配/埋点/语音**：`frontend/analytics.js` / `voice.js` / `adapter.js` + `backend/src/controllers/analyticsController.js` + `scripts/genDashboard.js` + `frontend/dashboard.html`
- [x] **语法校验**：全部改动 JS 文件 `node --check` 通过
- [x] **Bundle 完整性**：`C:\Users\22812\ida-m1-m5.bundle` 经 `git bundle verify` 通过，克隆核对含全部 9 提交、关键文件齐全

---

## 🔒 1. 安全与密钥检查（发布前必做）

- [x] 仓库内**未写入任何 GitHub Token / PAT**（仅在沙箱命令中内联使用过、已 `unset`、未落盘）
- [x] `.gitignore` 已忽略：`backend/logs/`、`*.log`、`backend/data/`（运行时数据不入库）
- [x] 离线 bundle `ida-m1-m5.bundle` 在仓库**外**（`C:\Users\22812\`），不会误提交
- [ ] **⚠️ 撤销已暴露的 PAT**：对话中曾贴出 `ghp_...` 开头的 token，属已暴露凭据。发布完成后立即到
      GitHub → Settings → Developer settings → Personal access tokens **删除/重新生成**。
- [ ] 确认 `git status` 干净、`git diff` 无意料外改动后再推送

---

## 🚀 2. 推送方式（三选一）

> 沙箱网络曾间歇性封锁 GitHub；若你在本机（有外网）操作，以下均可。

**方式 A — SSH（推荐，最简单）**
```bash
cd "C:\Users\22812\OneDrive\Desktop\反诈人生\The-Interdimensional-Dream-Agency"
git push origin main
git push origin v8.2-baseline   # 如需同步标签
```

**方式 B — HTTPS + Token（推完务必撤销该 token）**
```bash
git remote set-url origin https://<你的TOKEN>@github.com/chensiyu080131-alt/The-Interdimensional-Dream-Agency.git
git push origin main v8.2-baseline
git remote set-url origin https://github.com/chensiyu080131-alt/The-Interdimensional-Dream-Agency.git   # 还原
```

**方式 C — 离线 Bundle（无网络时）**
```bash
git clone C:\Users\22812\ida-m1-m5.bundle ida_repo
cd ida_repo
git remote set-url origin https://github.com/chensiyu080131-alt/The-Interdimensional-Dream-Agency.git
git push origin main v8.2-baseline
```

---

## 🔎 3. 推送后验证

- [ ] 浏览器打开仓库，确认关键文件已出现：
      `frontend/dashboard.html`、`frontend/analytics.js`、`frontend/voice.js`、
      `backend/src/controllers/analyticsController.js`、`scripts/genDashboard.js`
- [ ] `git log` 远端最新含 `feat(M1)`…`埋点看板` 等 9 个提交
- [ ] （可选）本机起后端 `cd backend && npm install && npm start`，体验游戏后
      `node scripts/genDashboard.js` 生成看板并双击 `frontend/dashboard.html` 查看埋点

---

## 📋 4. 发布说明 / 后续

- [ ] **M2 专家校验为自动初核占位**：`expertReviewed=true` 是脚本归一化置位，**非正式权威反诈专家人工签认**。
      正式对外发布前，建议由反诈机构再做一次人工复核。
- [ ] README 已含 M1–M5 说明与小程序 `web-view` 嵌入指引；确认链接/截图无误。
- [ ] （可选）如需对外演示埋点看板，可将 `frontend/dashboard.html` 部署到静态托管。
- [ ] 本清单文件（`RELEASE_CHECKLIST.md`）如不想入库可删除；它不影响游戏运行。

---

## 📊 提交清单（本地领先远端 9 个）

| SHA | 阶段 |
|-----|------|
| 81b8fef | M1 P0 安全护栏 |
| fdde24e | M1 红队验收 + 护栏强化 |
| 7fbef1b | M2 内容覆盖 + 避坑报告 |
| 08ed5db | M2 十类独立场景 |
| f231bfc | M3 核心游戏化系统 |
| 401a987 | M2 红标池补全 |
| 54ef1e2 | M4 复玩性增强 |
| c8d0332 | M5 适配/埋点/语音 + M2 校验回填 |
| 21b30b2 | M5 埋点看板 |
