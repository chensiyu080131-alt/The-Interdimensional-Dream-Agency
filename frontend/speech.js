/* V9.2 语音模块 —— 云端 TTS(阶跃 Step Audio 2 专用端点) 优先 + 浏览器原生回退
 * 零前端密钥：云端 TTS 经本地/自有后端代理 /api/tts（密钥在后端环境变量 STEP_API_KEY）。
 *   - TTS：优先调用后端 /api/tts（step-tts-2 / stepaudio-2.5-tts 合成高质量中文语音，按 NPC 分配音色），
 *          失败/不可用回退 window.speechSynthesis
 *   - ASR：window.SpeechRecognition 玩家语音输入（浏览器原生，免费即时，不上传云端）
 */
(function () {
  const Speech = {};
  let voicesCache = [];
  let autoRead = localStorage.getItem("fanzha_autoread") === "1";
  let speaking = false;
  let currentAudio = null;

  /* 各 NPC → 阶跃 Step Plan 音色。
   * 当前 step_plan 档位的「预设公版音色列表为空」，已验证只有 vibrant-youth 是被阶跃识别的合法音色；
   * 其余占位名会从阶跃返回 400 voice_id_invalid。故先统一用 vibrant-youth 保证可用。
   * 若你想给不同 NPC 分配独立音色：在本地（中国 IP）运行后端后，调用
   *   GET <后端>/api/tts-voices  （或 stepfun /audio/voices）拿到你账号下可用音色，
   *   再把对应 voice id 填到这里即可。 */
  /* 各 NPC → 阶跃 stepaudio-2.5-tts 命名音色（step_plan 通道，均经后端实测可合成）
   * 每个主线角色独立声音，沉浸感更强；群众 NPC 复用池中音色、彼此不重复。 */
  const STEPFUN_VOICE_MAP = {
    // —— 主线角色（11 个，音色各不相同）——
    zhanghao:  "zixinnansheng",        // 张浩·骗子：自信男声
    lijie:     "jingdiannvsheng",       // 李姐·同伙：经典女声
    xiaoyun:   "elegantgentle-female",  // 小云·骗子：气质温婉（伪善）
    laowang:   "soft-spoken-gentleman", // 老王·老友：温润绅士
    laok:      "magnetic-voiced-male",  // 老K·警方联络：磁性男声
    editor:    "wenrounansheng",        // 主编老陆：温柔男声
    coord:     "livelybreezy-female",   // 站长阿妮：活力轻快女
    police110: "yuanqinansheng",        // 值班民警：元气男声
    xiaoya:    "lively-girl",           // 小雅·受害者：活泼女孩
    chenlu:    "wenroushunv",           // 陈露·失联好友：温柔熟女
    anon:      "vibrant-youth",         // 匿名X·线人：活力青年（神秘）
    // —— 群众 NPC（8 个，彼此不同，复用池中音色）——
    colleague_xiaowang: "yuanqinansheng",
    classmate_ahao:     "zixinnansheng",
    delivery_zhang:     "magnetic-voiced-male",
    express_li:         "livelybreezy-female",
    landlord_zhao:      "wenroushunv",
    coach_lin:          "vibrant-youth",
    blind_date:         "elegantgentle-female",
    community_police:   "wenrounansheng",
    _default:  "vibrant-youth",
  };

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

  async function playCloudTTS(endpoint, text, voice) {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: voice || undefined }),
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
        const voice = STEPFUN_VOICE_MAP[npcKey] || STEPFUN_VOICE_MAP._default;
        await playCloudTTS(endpoint, text, voice);
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
