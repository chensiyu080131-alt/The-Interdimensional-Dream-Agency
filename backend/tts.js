/**
 * 阶跃 Step Plan 语音合成代理（专用 TTS 端点）
 * ------------------------------------------------------------
 * 走 Step Plan 专属通道 /step_plan/v1/audio/speech（模型 stepaudio-2.5-tts），
 * 由后端调用 stepfun，避免 API Key 暴露到浏览器前端。
 *
 * 环境变量（均在 backend/.env，已 gitignore）：
 *   STEP_API_KEY      （必填）Step Plan 接口密钥
 *   STEP_TTS_BASE_URL （可选）默认 https://api.stepfun.com/step_plan/v1
 *   STEP_TTS_MODEL    （可选）默认 stepaudio-2.5-tts
 *   STEP_TTS_VOICE    （可选）默认 vibrant-youth（已验证为合法音色）
 *
 * 用法：在 Express 入口挂载
 *   const stepTts = require("./tts");
 *   app.post("/api/tts", stepTts);
 * 前端 POST { text, voice } 即可得到 audio/wav 二进制流。
 *
 * 说明：step_plan 档位的 TTS 需中国大陆 IP 才能合成（非大陆返回 451 区域拦截），
 *       故沙箱/公网会回退浏览器原生；本地（中国 IP）运行后端即可获得 Step 高质量语音。
 */
require("dotenv").config();

const STEP_BASE = process.env.STEP_TTS_BASE_URL || "https://api.stepfun.com/step_plan/v1";

module.exports = async function stepTtsHandler(req, res) {
  const key = process.env.STEP_API_KEY || "";
  if (!key) {
    return res.status(503).json({ error: "STEP_API_KEY 未配置，无法使用云端语音（前端将回退浏览器原生）" });
  }

  const body = req.body || {};
  const text = (body.text || "").toString().trim();
  if (!text) return res.status(400).json({ error: "缺少 text 参数" });

  const model = body.model || process.env.STEP_TTS_MODEL || "stepaudio-2.5-tts";
  const voice = body.voice || process.env.STEP_TTS_VOICE || "vibrant-youth";
  const instruction = (body.instruction && body.instruction.toString().trim()) || undefined;
  const speed = Number(body.speed);
  const volume = Number(body.volume);

  try {
    const r = await fetch(`${STEP_BASE}/audio/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({
        model,
        input: text,
        voice,
        // —— stepaudio-2.5-tts 表现力参数（缺失则退回平直机器腔 = 之前「古板」的根因）——
        ...(instruction ? { instruction } : {}),
        ...(!isNaN(speed) && speed > 0 ? { speed } : {}),
        ...(!isNaN(volume) && volume > 0 ? { volume } : {}),
        text_normalization: "enhanced", // 更自然的数字/单位/符号读法
        sample_rate: 24000,
        response_format: "wav",
      }),
    });
    if (!r.ok) {
      const errText = await r.text();
      // 把阶跃的错误原样回传，前端据状态回落浏览器原生 speechSynthesis
      return res.status(502).json({ error: "stepfun TTS 调用失败: " + errText.slice(0, 400) });
    }
    const buf = Buffer.from(await r.arrayBuffer());
    res.set("Content-Type", "audio/wav");
    res.send(buf);
  } catch (e) {
    res.status(500).json({ error: "云端语音合成异常: " + (e && e.message ? e.message : e) });
  }
};

/**
 * 探测当前账号在 Step Plan 下可用的音色列表（GET /api/tts-voices）
 * 仅作辅助：本地（中国 IP）运行后端时可用，返回 stepfun /audio/voices 的内容。
 */
module.exports.voices = async function ttsVoicesHandler(req, res) {
  const key = process.env.STEP_API_KEY || "";
  if (!key) return res.status(503).json({ error: "STEP_API_KEY 未配置" });
  try {
    const r = await fetch(`${STEP_BASE}/audio/voices`, {
      method: "GET",
      headers: { Authorization: "Bearer " + key },
    });
    const txt = await r.text();
    res.set("Content-Type", r.headers.get("content-type") || "application/json");
    res.status(r.status).send(txt);
  } catch (e) {
    res.status(500).json({ error: "音色列表查询失败: " + (e && e.message ? e.message : e) });
  }
};
