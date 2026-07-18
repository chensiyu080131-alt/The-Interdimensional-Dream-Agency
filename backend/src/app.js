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
// CORS：按配置限制来源（默认 * 仅开发用），支持逗号分隔白名单
const corsOrigin = config.auth?.corsOrigin || "*";
app.use(cors({
  origin: corsOrigin === "*" ? true : corsOrigin.split(",").map(s => s.trim()),
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ------------------------------------------------------------
 * M1.4 统一入口鉴权（仅在配置了 API_ACCESS_TOKEN 时启用）
 *   小程序 / H5 通过统一入口在请求头携带 X-Access-Token
 *   未配置 token 时放开（保持本地开发与现有部署不受影响）
 * ---------------------------------------------------------- */
app.use("/api", (req, res, next) => {
  const required = config.auth?.accessToken || "";
  if (!required) return next(); // 未配置则不校验
  const provided = req.headers["x-access-token"] || req.query.access_token || "";
  if (provided === required) return next();
  return res.status(401).json({ success: false, error: "未授权：缺少或无效的访问令牌" });
});

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
const analyticsRouter = require("./routes/analytics"); // M5 数据埋点接收端

app.use("/api/chat", chatRouter);
app.use("/api/ending", endingRouter);
app.use("/api/track", analyticsRouter);

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
