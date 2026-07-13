# 反诈人生

腾讯黑客松比赛项目 —— 一个帮助用户识别和防范电信网络诈骗的 Web 应用。

## 快速运行（推荐：一键启动）

双击项目根目录的 **`start.bat`**（Windows）即可：自动安装依赖、启动后端（后端已内置静态托管前端）、崩溃自动重启，并自动打开浏览器 `http://localhost:3000/`。

> 仅用剧本模式（不接大模型）也能完整体验；想开启 AI 自由对话，需先装好 Ollama（见下）。

### 手动运行

```bash
# 方式一：守护进程（自动装依赖 + 崩溃重启）
node daemon.js

# 方式二：直接启动后端（后端默认 http://localhost:3000，并托管 frontend/）
cd backend
npm install
node app.js
```

打开浏览器访问 `http://localhost:3000/` 即进入游戏（后端同时托管前端静态文件，无需单独起静态服务器）。
也可直接用浏览器打开 `frontend/index.html`，此时 AI 自由对话会检测不到后端并自动降级为剧本模式，其余玩法不受影响。

部署到云端时，可用 URL 参数覆盖后端地址：`frontend/index.html?api=https://你的网关域名`。

## 模型配置（免费优先）

后端默认使用 **本地 Ollama**（OpenAI 兼容接口），**完全免费、无需任何密钥**：

```bash
# 1. 安装 Ollama 后，拉取一个本地模型
ollama pull qwen3:8b

# 2. 确保 Ollama 服务在运行（默认 http://localhost:11434）
# 3. 直接启动后端即可，无需配置环境变量
node app.js
```

可用环境变量调整：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `LLM_PROVIDER` | `ollama` | 模型来源：`ollama`（免费本地）或 `hunyuan`（腾讯云） |
| `OLLAMA_BASE_URL` | `http://localhost:11434/v1` | Ollama 的 OpenAI 兼容端点 |
| `OLLAMA_MODEL` | `qwen3:8b` | 本地模型名称 |
| `TENCENTCLOUD_SECRET_ID` / `TENCENTCLOUD_SECRET_KEY` | 空 | 腾讯混元密钥（可选，仅 `LLM_PROVIDER=hunyuan` 时需要） |
| `HUNYUAN_MODEL` | `hunyuan-pro` | 混元模型名（可选） |

> Ollama 未安装/未运行时，后端会自动返回兜底假数据，保证前端联调与游戏流程不中断。
> 若同时配置了腾讯云密钥，可在 `LLM_PROVIDER=hunyuan` 时走云端模型；Ollama 调用失败时也会自动回退混元。

## 防重复优化

针对大模型「重复一句话」问题，后端做了多层处理：

- System Prompt 强制每轮必须说**与历史都不同的新内容**；
- 调用后做重复检测（与最近 3 条助手回复相似、或自身重复），最多重试 2 次并逐步升高随机性；
- 清理模型可能残留的 `<think>` 思考链标记；
- 对话历史超过 24 条自动截断，避免上下文过长导致「卡住」。

项目详细文档（部署、风险管理等）见 [`docs/`](./docs/) 目录：

- [docs/README.md](./docs/README.md) — 文档中心索引
- [docs/DEPLOY.md](./docs/DEPLOY.md) — 部署指南（腾讯云 CloudBase）
- [docs/RISK-MANAGEMENT.md](./docs/RISK-MANAGEMENT.md) — 产品风险管控（15 个风险点）
