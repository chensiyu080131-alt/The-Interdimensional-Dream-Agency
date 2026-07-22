/**
 * 阶跃 Step-1o Audio 语音合成代理
 * ------------------------------------------------------------
 * 由后端调用 stepfun，避免 API Key 暴露到浏览器前端。
 *
 * 环境变量：
 *   STEP_API_KEY    （必填）阶跃星辰 API Key（sk-...）
 *   STEP_TTS_MODEL  （可选）默认 step-1o-audio
 *   STEP_TTS_VOICE  （可选）声音 ID；留空则首次调用自动查询声音列表并取默认
 *
 * 用法：在 Express 入口挂载
 *   const stepTts = require("./tts");
 *   app.post("/api/tts", stepTts);
 * 前端 POST { text } 即可得到 audio/wav 二进制流。
 */
require("dotenv").config();

const STEP_BASE = "https://api.stepfun.com/v1";
let cachedVoice = null;

/** 解析 step-1o-audio 可用的默认声音 ID（带缓存） */
async function resolveVoice(key) {
  if (cachedVoice) return cachedVoice;
  if (!key) return "";
  try {
    const r = await fetch(`${STEP_BASE}/audio/voices`, {
      headers: { Authorization: "Bearer " + key },
    });
    if (!r.ok) return "";
    const j = await r.json();
    const list = Array.isArray(j) ? j : (j.data || j.voices || j.result || []);
    if (!Array.isArray(list) || !list.length) return "";
    const hit =
      list.find((v) => (v.model || "").includes("step-1o-audio")) ||
      list.find((v) => (v.model || "").includes("step-1o")) ||
      list[0];
    cachedVoice = hit.voice || hit.id || hit.voice_id || "";
    return cachedVoice;
  } catch (e) {
    return "";
  }
}

/**
 * Express handler：POST /api/tts  { text, voice?, model? }
 * 返回 audio/wav 二进制；失败返回 JSON 错误（前端据此回退浏览器原生语音）。
 */
module.exports = async function stepTtsHandler(req, res) {
  const key = process.env.STEP_API_KEY || "";
  if (!key) {
    return res.status(503).json({ error: "STEP_API_KEY 未配置，无法使用云端语音（前端将回退浏览器原生）" });
  }

  const body = req.body || {};
  const text = (body.text || "").toString().trim();
  if (!text) return res.status(400).json({ error: "缺少 text 参数" });

  const model = body.model || process.env.STEP_TTS_MODEL || "step-1o-audio";
  let voice = body.voice || process.env.STEP_TTS_VOICE || "";
  if (!voice) voice = await resolveVoice(key);

  try {
    const r = await fetch(`${STEP_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({
        model,
        modalities: ["text", "audio"],
        messages: [
          {
            role: "system",
            content:
              "你是一个专业的文本朗读引擎。接下来用户给出的文本，请直接用语音一字不差地念出来：不要增删改、不要回答、不要评论、不要添加任何前缀或说明。",
          },
          { role: "user", content: text },
        ],
        audio: voice ? { voice, format: "wav" } : { format: "wav" },
        stream: false,
      }),
    });
    if (!r.ok) {
      const errText = await r.text();
      return res.status(502).json({ error: "stepfun 调用失败: " + errText.slice(0, 400) });
    }
    const j = await r.json();
    const msg = j.choices && j.choices[0] && j.choices[0].message;
    const audioB64 = msg && msg.audio && msg.audio.data;
    if (!audioB64) {
      return res.status(502).json({ error: "stepfun 未返回音频数据", detail: JSON.stringify(j).slice(0, 400) });
    }
    const buf = Buffer.from(audioB64, "base64");
    res.set("Content-Type", "audio/wav");
    if (msg.audio.transcript) res.set("X-Transcript", encodeURIComponent(msg.audio.transcript));
    res.send(buf);
  } catch (e) {
    res.status(500).json({ error: "云端语音合成异常: " + (e && e.message ? e.message : e) });
  }
};
