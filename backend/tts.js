/**
 * 阶跃 Step Audio 2 语音合成代理（专用 TTS 端点）
 * ------------------------------------------------------------
 * 走标准 OpenAI 风格音频端点 /v1/audio/speech（step-tts-2 / stepaudio-2.5-tts 等），
 * 由后端调用 stepfun，避免 API Key 暴露到浏览器前端。
 *
 * 环境变量：
 *   STEP_API_KEY    （必填）阶跃星辰 API Key（sk-... / sk-audio-...）
 *   STEP_TTS_MODEL  （可选）默认 step-tts-2（免费档）；可改 stepaudio-2.5-tts（更高音质）
 *   STEP_TTS_VOICE  （可选）默认音色 ID；前端也可按 NPC 逐条传 voice
 *
 * 用法：在 Express 入口挂载
 *   const stepTts = require("./tts");
 *   app.post("/api/tts", stepTts);
 * 前端 POST { text, voice } 即可得到 audio/wav 二进制流。
 */
require("dotenv").config();

const STEP_BASE = "https://api.stepfun.com/v1";

module.exports = async function stepTtsHandler(req, res) {
  const key = process.env.STEP_API_KEY || "";
  if (!key) {
    return res.status(503).json({ error: "STEP_API_KEY 未配置，无法使用云端语音（前端将回退浏览器原生）" });
  }

  const body = req.body || {};
  const text = (body.text || "").toString().trim();
  if (!text) return res.status(400).json({ error: "缺少 text 参数" });

  const model = body.model || process.env.STEP_TTS_MODEL || "step-tts-2";
  const voice = body.voice || process.env.STEP_TTS_VOICE || "vibrant-youth";

  try {
    const r = await fetch(`${STEP_BASE}/audio/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({
        model,
        input: text,
        voice,
        response_format: "wav",
      }),
    });
    if (!r.ok) {
      const errText = await r.text();
      return res.status(502).json({ error: "stepfun TTS 调用失败: " + errText.slice(0, 400) });
    }
    const buf = Buffer.from(await r.arrayBuffer());
    res.set("Content-Type", "audio/wav");
    res.send(buf);
  } catch (e) {
    res.status(500).json({ error: "云端语音合成异常: " + (e && e.message ? e.message : e) });
  }
};
