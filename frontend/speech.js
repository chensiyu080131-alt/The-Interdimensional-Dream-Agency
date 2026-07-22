/* V9.2 语音模块 —— 基于浏览器原生 Web Speech API
 * 零依赖、零后端、零成本：
 *   - TTS：window.speechSynthesis 朗读 NPC 消息
 *   - ASR：window.SpeechRecognition 玩家语音输入
 * 沉浸模式：骗子揭露前用中性音色，揭露后用带"敌意"的音色（更低沉/更快）
 */
(function () {
  const Speech = {};
  let voicesCache = [];
  let autoRead = localStorage.getItem("fanzha_autoread") === "1";

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

  /* 加载系统可用音色（异步，首次调用 speechSynthesis 时才完整） */
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
    // 优先匹配中文音色
    const zh = voicesCache.find(v => /zh|cmn|Chinese/i.test(v.lang) || /zh|中文|普通话/i.test(v.name));
    return zh || voicesCache.find(v => v.lang && v.lang.startsWith(lang.slice(0, 2))) || null;
  }

  /** 是否支持 TTS */
  Speech.ttsSupported = function () { return !!(window.speechSynthesis && window.SpeechSynthesisUtterance); };

  /** 朗读文本，按 NPC key 应用音色（揭露状态影响音调） */
  Speech.speak = function (text, npcKey) {
    if (!Speech.ttsSupported() || !text) return;
    try {
      window.speechSynthesis.cancel(); // 打断上一句
      const u = new SpeechSynthesisUtterance(text);
      const profile = VOICE_PROFILE[npcKey] || VOICE_PROFILE._default;
      const revealed = (typeof S !== "undefined" && S.revealed && S.revealed[npcKey]);
      u.lang = profile.lang || "zh-CN";
      u.pitch = revealed ? (profile.revealedPitch || profile.pitch) : profile.pitch;
      u.rate = revealed ? (profile.revealedRate || profile.rate) : profile.rate;
      const v = pickVoice(u.lang);
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    } catch (e) { /* 静默失败，不影响游戏 */ }
  };

  /** 停止朗读 */
  Speech.stop = function () {
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
  };

  /** 自动朗读开关 */
  Speech.isAutoRead = function () { return autoRead; };
  Speech.setAutoRead = function (on) {
    autoRead = !!on;
    localStorage.setItem("fanzha_autoread", autoRead ? "1" : "0");
    if (!autoRead) Speech.stop();
  };

  /* ============ ASR 语音识别 ============ */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  Speech.asrSupported = function () { return !!SR; };

  let recog = null;
  let recogActive = false;
  /** 开始监听，结果回调 onResult(text)，结束后回调 onEnd() */
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
