/**
 * ============================================================
 * 混元大模型服务
 * ------------------------------------------------------------
 * 职责：封装与混元 API 的通信，不包含游戏逻辑
 * 使用 axios + OpenAI 兼容接口
 * ============================================================
 */

const axios = require("axios");
const config = require("../config");

/**
 * 调用混元大模型 Chat Completions API
 * @param {Array<{role:string, content:string}>} messages - 对话消息列表
 * @param {Object} [options] - 可选参数
 * @param {number} [options.temperature] - 温度 (0-2)
 * @param {number} [options.topP] - Top-P 采样
 * @param {number} [options.maxTokens] - 最大生成 token 数
 * @param {boolean} [options.stream] - 是否流式返回（暂不支持）
 * @returns {Promise<{content: string, usage?: {prompt_tokens:number, completion_tokens:number, total_tokens:number}}>}
 */
async function chatCompletion(messages, options = {}) {
  const url = `${config.hunyuan.baseUrl}/chat/completions`;

  const body = {
    model: config.hunyuan.model,
    messages,
    temperature: options.temperature ?? config.hunyuan.temperature,
    top_p: options.topP ?? config.hunyuan.topP,
    max_tokens: options.maxTokens ?? config.hunyuan.maxTokens,
    stream: false,
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.hunyuan.apiKey}`,
  };

  try {
    const response = await axios.post(url, body, {
      headers,
      timeout: 30000, // 30 秒超时
    });

    const choice = response.data?.choices?.[0];
    const content = choice?.message?.content?.trim() || "";

    return {
      content,
      usage: response.data?.usage || null,
    };
  } catch (err) {
    // 提取有意义的错误信息
    if (err.response) {
      const status = err.response.status;
      const detail = err.response.data?.error?.message || JSON.stringify(err.response.data);
      throw new Error(`混元 API 错误 [${status}]: ${detail}`);
    }
    if (err.code === "ECONNABORTED") {
      throw new Error("混元 API 请求超时（30s），请稍后重试");
    }
    throw new Error(`混元 API 请求失败: ${err.message}`);
  }
}

/**
 * 健康检查 —— 测试 API 是否可达
 * @returns {Promise<{ok: boolean, model: string, latency: number}>}
 */
async function healthCheck() {
  const start = Date.now();
  try {
    const result = await chatCompletion(
      [{ role: "user", content: "你好" }],
      { maxTokens: 10, temperature: 0 }
    );
    return {
      ok: true,
      model: config.hunyuan.model,
      latency: Date.now() - start,
    };
  } catch (err) {
    return {
      ok: false,
      model: config.hunyuan.model,
      latency: Date.now() - start,
      error: err.message,
    };
  }
}

module.exports = { chatCompletion, healthCheck };
