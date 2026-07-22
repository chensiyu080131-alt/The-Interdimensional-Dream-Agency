/* V9.2 语音模块 —— 云端 TTS(阶跃 Step-1o Audio) 优先 + 浏览器原生回退
 * 零前端密钥：云端 TTS 经本地/自有后端代理 /api/tts（密钥在后端环境变量 STEP_API_KEY）。
 *   - TTS：优先调用后端 /api/tts（Step-1o Audio 合成高质量中文语音），失败/不可用回退 window.speechSynthesis
 *   - ASR：window.SpeechRecognition 玩家语音输入（浏览器原生，免费即时，不上传云端）
 */
(function () {
  const Speech = {};
  let voicesCache = [];
  let autoRead = localStorage.getItem("fanzha_autoread") === "1";
  let speaking = false;
  let currentAudio = null;

  /* 各 NPC 的音色配置（pitch 0-2, rate 0.5-2, 骗子揭露后变调） */
  const VOICE_PROFILE = {
    zhanghao:  { lang: "zh-CN", pitch: 0.9, rate: 1.05, revealedPitch: 0.6, revealedRate: 1.15 },
    lijie:     { lang: "zh-CN", pitch: 1.2, rate: 1.1,  revealedPitch: 0.8, revealedRate: 1.2 },
    xiaoyun:   { lang: "zh-CN", pitch: 1.3, rate: 1.0,  revealedPitch: 0.7, revealedRate: 1.1 },
    laok:      { lang: "zh-CN", pitch: 0.7, rate: 0.95 },
    editor:    { lang: "zh-CN", pitch: 0.8, rate: 1.0 },
    coord:     { lang: "zh-CN", pitch: 1.1, rate: 1.0 },
    police110: { lang: "zh-CN", pitch: 0.6, rate: 0.9 },
    xiaoya:    { lang: "zh-CN", pitch: 1.4, rate: 1.1 },
    chenlu:    { lang: "zh-CN", pitch: 1.3, rate: 1.0 },
    anon:      { lang: "zh-CN", pitch: 0.5, rate: 0.85 },
    laowang:   { lang: "zh-CN", pitch: 0.75, rate: 0.95 },
    _default:  { lang: "zh-CN", pitch: 1.0, rate: 1.0 },
  };

  function loadVoices() {
    try {
      voicesCache = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    } catch (e) { voicesCache = []; }
  }
  if (window.speechSynthesis) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function pickVoice(lang) {
    if (!voicesCache.length) loadVoices();
    const zh = voicesCache.find(v => /zh|cmn|Chinese/i.test(v.lang) || /zh|中文|普通话/i.test(v.name));
    return zh || voicesCache.find(v => v.lang && v.lang.startsWith(lang.slice(0, 2))) || null;
  }

  /* ---------- 云端 TTS：阶跃 Step-1o Audio（经后端 /api/tts 代理） ---------- */
  function getCloudTTSEndpoint() {
    const h = location.hostname;
    if (h === "localhost" || h === "127.0.0.1") return "http://localhost:3000/api/tts";
    return window.__CLOUD_TTS || null;
  }

  async function playCloudTTS(endpoint, text) {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) {
      let msg = "";
      try { const j = await r.json(); msg = j.error || ""; } catch (e) {}
      throw new Error(msg || ("HTTP " + r.status));
    }
    const blob = await r.blob();
    if (!blob || !blob.size) throw new Error("empty audio");
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    return await new Promise((resolve, reject) => {
      audio.onended = () => { try { URL.revokeObjectURL(url); } catch (e) {} currentAudio = null; resolve(true); };
      audio.onerror = () => { try { URL.revokeObjectURL(url); } catch (e) {} currentAudio = null; reject(new Error("audio play error")); };
      audio.play().catch(reject);
    });
  }

  Speech.ttsSupported = function () {
    return !!(getCloudTTSEndpoint() || (window.speechSynthesis && window.SpeechSynthesisUtterance));
  };

  /** 朗读文本：云端 TTS 优先，失败回退浏览器原生 */
  Speech.speak = async function (text, npcKey) {
    if (!text) return;
    speaking = true;
    const endpoint = getCloudTTSEndpoint();
    if (endpoint) {
      try {
        await playCloudTTS(endpoint, text);
        speaking = false;
        return;
      } catch (e) {
        console.warn("[TTS] 云端语音失败，回退浏览器原生：", e && e.message ? e.message : e);
      }
    }
    // 回退：浏览器原生 speechSynthesis
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const profile = VOICE_PROFILE[npcKey] || VOICE_PROFILE._default;
      const revealed = (typeof S !== "undefined" && S.revealed && S.revealed[npcKey]);
      u.lang = profile.lang || "zh-CN";
      u.pitch = revealed ? (profile.revealedPitch || profile.pitch) : profile.pitch;
      u.rate = revealed ? (profile.revealedRate || profile.rate) : profile.rate;
      const v = pickVoice(u.lang);
      if (v) u.voice = v;
      u.onend = () => { speaking = false; };
      u.onerror = () => { speaking = false; };
      window.speechSynthesis.speak(u);
    } catch (e) { speaking = false; }
  };

  Speech.stop = function () {
    speaking = false;
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    if (currentAudio) { try { currentAudio.pause(); currentAudio.currentTime = 0; } catch (e) {} currentAudio = null; }
  };

  Speech.isSpeaking = function () { return speaking; };

  Speech.setAutoRead = function (on) {
    autoRead = !!on;
    localStorage.setItem("fanzha_autoread", autoRead ? "1" : "0");
    if (!autoRead) Speech.stop();
  };
  Speech.isAutoRead = function () { return autoRead; };

  /* ============ ASR 语音识别（浏览器原生） ============ */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  Speech.asrSupported = function () { return !!SR; };

  let recog = null;
  let recogActive = false;
  Speech.startListen = function (onResult, onEnd) {
    if (!SR) return false;
    try {
      if (recog) { try { recog.stop(); } catch (e) {} }
      recog = new SR();
      recog.lang = "zh-CN";
      recog.continuous = false;
      recog.interimResults = true;
      let finalText = "";
      recog.onresult = function (e) {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += t;
          else interim += t;
        }
        if (onResult) onResult(finalText + interim, !!finalText);
      };
      recog.onerror = function () { recogActive = false; if (onEnd) onEnd(); };
      recog.onend = function () { recogActive = false; if (onEnd) onEnd(); };
      recog.start();
      recogActive = true;
      return true;
    } catch (e) { return false; }
  };
  Speech.stopListen = function () {
    if (recog && recogActive) { try { recog.stop(); } catch (e) {} }
    recogActive = false;
  };
  Speech.isListening = function () { return recogActive; };

  window.Speech = Speech;
})();
