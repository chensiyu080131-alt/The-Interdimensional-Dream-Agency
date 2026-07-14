/**
 * ============================================================
 * 异次元梦想局 · 后端 API 服务
 * ------------------------------------------------------------
 * 技术栈：Node.js + Express + Axios + 混元大模型
 * 端口：3000（可通过 .env 配置）
 *
 * 目录结构：
 *   src/
 *     config/index.js       —— 配置中心
 *     services/hunyuanService.js —— 混元 API 调用
 *     controllers/chatController.js —— 对话逻辑
 *     routes/chat.js        —— 路由定义
 *     app.js                —— 主入口（本文件）
 * ============================================================
 */

const express = require("express");
const cors = require("cors");
const config = require("./config");

const app = express();

/* ------------------------------------------------------------
 * 中间件
 * ---------------------------------------------------------- */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志（开发环境）
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`  ${req.method} ${req.path}`);
    next();
  });
}

/* ------------------------------------------------------------
 * 路由注册
 * ---------------------------------------------------------- */
const chatRouter = require("./routes/chat");
const endingRouter = require("./routes/ending");

app.use("/api/chat", chatRouter);
app.use("/api/ending", endingRouter);

// 根路径健康检查
app.get("/", (req, res) => {
  res.json({
    service: "异次元梦想局 · AI 对话服务",
    version: "3.0.0",
    endpoints: {
      chat: "POST /api/chat",
      health: "GET /api/chat/health",
    },
    apiConfigured: config.isApiKeyValid(),
    model: config.hunyuan.model,
  });
});

/* ------------------------------------------------------------
 * 404 处理
 * ---------------------------------------------------------- */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `接口不存在: ${req.method} ${req.path}`,
  });
});

/* ------------------------------------------------------------
 * 全局错误处理
 * ---------------------------------------------------------- */
app.use((err, _req, res, _next) => {
  console.error("[服务器错误]", err);
  res.status(500).json({
    success: false,
    error: "服务器内部错误",
  });
});

/* ------------------------------------------------------------
 * 启动服务
 * ---------------------------------------------------------- */
app.listen(config.port, () => {
  console.log("");
  console.log("  ╔══════════════════════════════════════════╗");
  console.log("  ║   🎮 异次元梦想局 · AI 对话服务 v3.0    ║");
  console.log("  ╠══════════════════════════════════════════╣");
  console.log(`  ║   地址: http://localhost:${config.port}              ║`);
  console.log(`  ║   模型: ${config.hunyuan.model.padEnd(32)}║`);
  console.log(`  ║   API:  ${config.isApiKeyValid() ? "✅ 已配置" : "⚠️  未配置（兜底模式）"}              ║`);
  console.log("  ╚══════════════════════════════════════════╝");
  console.log("");
});

module.exports = app;
