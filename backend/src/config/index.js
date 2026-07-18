/**
 * ============================================================
 * 配置中心 —— 统一管理环境变量和运行时配置
 * ============================================================
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

module.exports = {
  // 服务器
  port: parseInt(process.env.PORT, 10) || 3000,

  // 混元大模型
  hunyuan: {
    apiKey: process.env.HUNYUAN_API_KEY || "",
    baseUrl: process.env.HUNYUAN_BASE_URL || "https://api.hunyuan.cloud.tencent.com/v1",
    model: process.env.HUNYUAN_MODEL || "hunyuan-turbos-latest",
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.9,
    topP: parseFloat(process.env.AI_TOP_P) || 0.9,
    maxTokens: parseInt(process.env.AI_MAX_TOKENS, 10) || 500,
  },

  // 统一入口鉴权（小程序 / H5 共用，M1.4）
  auth: {
    accessToken: process.env.API_ACCESS_TOKEN || "",
    corsOrigin: process.env.CORS_ORIGIN || "*",
  },

  // 内容安全护栏（M1.1）
  safety: {
    auditEnabled: (process.env.SAFETY_AUDIT_ENABLED || "true") !== "false",
  },

  // API Key 有效性检查
  isApiKeyValid() {
    const key = this.hunyuan.apiKey;
    return (
      key &&
      key.length > 20 &&
      !key.includes("your-api-key") &&
      !key.includes("your-hunyuan") &&
      !key.includes("placeholder")
    );
  },
};
