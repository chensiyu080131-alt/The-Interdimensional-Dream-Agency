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
  let _fallbackWarned = false;

  /* 真实语音失败时给玩家一个「可见原因」，而不是静默回退（之前听感无变化、无提示） */
  function notifyTTSFallback(detail) {
    if (_fallbackWarned) return;
    _fallbackWarned = true;
    const d = String(detail || "");
    let reason;
    if (/451/.test(d)) reason = "仅限中国大陆网络(HTTP 451)";
    else if (/audio play error/i.test(d)) reason = "浏览器拦截了播放(自动播放策略)";
    else if (/Failed to fetch|NetworkError|network/i.test(d)) reason = "无法连接语音服务(网络/跨域)";
    else if (/401|403|unauthorized|Forbidden/i.test(d)) reason = "密钥无效/未授权";
    else if (/4\d\d|5\d\d/.test(d)) reason = "服务返回 " + d.trim().slice(0, 80);
    else reason = "网络或服务异常" + (d ? "（" + d.trim().slice(0, 60) + "）" : "");
    try {
      if (typeof window !== "undefined" && typeof window.toast === "function") {
        window.toast("真实语音未启用：" + reason + "，已用浏览器原生语音");
      }
    } catch (e) {}
  }

  /* ⚠️ 安全须知（路径①·浏览器直连）—— 请务必阅读
   * 以下 Step Fun API Key 会随前端代码**打包进静态站点**，在 GitHub Pages 等公开托管下
   * 任何人都能通过「查看网页源代码」提取并滥用（产生额度/费用风险，且 Key 无法区分调用方）。
   * 生产环境强烈建议改用路径②：自建大陆后端持有 Key，前端注入 window.__API_BASE（代码已支持，密钥不暴露）。
   * 若坚持直连，请使用可随时吊销的受限 Key，并在不再需要时立即到 Step Fun 控制台重置。
   * 切换方式：把下面 STEPFUN_API_KEY 置空（或删除本段），改在页面注入 window.__API_BASE 即可无缝切到路径②。 */
  const STEPFUN_API_KEY = "1Qm0asvKa3tCLPJY6cI5rxC5aZHEEIzznfnz8aUbicAMY3027fuoTX3038GE9HhAc";
  const STEPFUN_TTS_URL = "https://api.stepfun.com/step_plan/v1/audio/speech";
  const STEPFUN_TTS_MARKER = "__DIRECT_STEPFUN__";

  /* 各 NPC → 阶跃 stepaudio-2.5-tts「音色 + 人设 instruction」。
   * 关键：stepaudio-2.5-tts 是 Contextual TTS，必须靠 instruction（自然语言人设/情绪基调，≤200字）
   *       才能触发「呼吸感、轻重主次、情绪弧线」的真人级表达；只给 voice 会被退回平直机器腔（之前「古板」的根因）。
   *       voice 均为官方音色（step_plan 通道实测可合成）；speed 0.5~2；volume 0.1~2。
   *       revealedInstruction：骗子身份揭露后切换的语气（撕破伪装）。 */
  const STEPFUN_VOICE_MAP = {
    // —— 主线角色（11 个，音色 + 人设各不相同）——
    zhanghao: {
      voice: "zixinnansheng", speed: 1.05,         // 张浩·骗子：自信男声
      instruction: "你是个想拉人入局的骗子，热络油滑、过分自信，像过分热情的生意人，语气里带着刻意讨好的亲近感，语速中等偏快",
      revealedInstruction: "你已撕破伪装，语气转为阴冷威胁、不再掩饰恶意，语速放慢、字字压迫",
    },
    lijie: {
      voice: "jingdiannvsheng", speed: 1.0,         // 李姐·同伙：经典女声
      instruction: "你是老练的同伙，语气精明干练又带点娇嗔，滴水不漏、暗藏诱导，语速中等",
      revealedInstruction: "你露出真面目，语气变得刻薄强硬、不再伪装客气，语速加快",
    },
    xiaoyun: {
      voice: "elegantgentle-female", speed: 0.95,   // 小云·骗子：气质温婉（伪善）
      instruction: "你表面是温柔体贴的邻家女孩，实际在套话，语气温柔关切、故作真诚，语速偏慢，藏着不易察觉的试探",
      revealedInstruction: "你卸下伪装，语气透出算计与冷意，温柔里掺进威胁，语速转快",
    },
    laowang: {
      voice: "soft-spoken-gentleman", speed: 1.0,   // 老王·老友：温润绅士
      instruction: "你是真心为朋友着想的老熟人，语气真诚热心、推心置腹，像多年老友在叮嘱，语速自然",
    },
    laok: {
      voice: "magnetic-voiced-male", speed: 0.95,   // 老K·警方联络：磁性男声
      instruction: "你是冷静专业的刑警，语气沉稳威严、干脆利落，带着不容置疑的权威感，语速偏慢",
    },
    editor: {
      voice: "wenrounansheng", speed: 1.0,          // 主编老陆：温柔男声
      instruction: "你是儒雅的文化人，语气温和克制、不疾不徐，像在循循善诱，语速中等",
    },
    coord: {
      voice: "livelybreezy-female", speed: 1.1,     // 站长阿妮：活力轻快
      instruction: "你是活泼热情的社区站长，语气轻快有活力、热络亲切，语速偏快",
    },
    police110: {
      voice: "yuanqinansheng", speed: 1.05,         // 值班民警：元气男声
      instruction: "你是年轻干练的值班民警，语气干脆利落、积极负责，带着职业警觉，语速中等偏快",
    },
    xiaoya: {
      voice: "lively-girl", speed: 1.1, volume: 1.1,// 小雅·受害者：活泼女孩
      instruction: "你是刚被骗、惊慌无助的年轻女孩，语气慌张脆弱、带点哭腔和颤抖，语速偏快",
    },
    chenlu: {
      voice: "wenroushunv", speed: 0.95,            // 陈露·失联好友：温柔熟女
      instruction: "你是焦虑担忧的失联好友，语气温柔但透着不安与急切，像在压抑情绪，语速偏慢",
    },
    anon: {
      voice: "vibrant-youth", speed: 0.9,           // 匿名X·线人：活力青年（神秘）
      instruction: "你是神秘线人，语气低沉、刻意压低声音保持距离感，带着若有若无的警觉，语速偏慢",
    },
    // —— 群众 NPC（8 个，音色彼此不同，进一步模糊视线）——
    colleague_xiaowang: { voice: "qingniandaxuesheng", instruction: "你是个普通网友，语气随和随意，像日常闲聊" }, // 小王
    classmate_ahao:     { voice: "zhengpaiqingnian",  instruction: "你是热心正直的年轻人，语气直率坦诚、充满正义感" }, // 阿豪
    delivery_zhang:     { voice: "shuangkuainansheng", instruction: "你是爽朗的大叔，语气干脆豪爽、像街坊聊天" }, // 张师傅
    express_li:         { voice: "ganliannvsheng",    instruction: "你是干练的快递员，语气职业利落、风风火火，公事公办" }, // 李姐快递
    landlord_zhao:      { voice: "qinhenvsheng",      instruction: "你是热心肠的阿姨，语气亲切唠叨、像邻家大妈拉家常" }, // 赵阿姨
    coach_lin:          { voice: "boyinnansheng",     instruction: "你是专业的健身教练，语气洪亮精神、充满干劲，带着职业热情" }, // 林教练
    blind_date:         { voice: "zhixingjiejie",     instruction: "你是得体的相亲对象，语气知性从容、客气有分寸，像在礼貌试探" }, // 相亲对象
    community_police:   { voice: "ruyananshi",        instruction: "你是经验丰富、和气的片警，语气沉稳平和，像拉家常般劝导" }, // 片警老周
    _default: { voice: "vibrant-youth", instruction: "语气温和自然、清晰流畅、像真人聊天" },
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
    // 路径②（推荐·安全）：部署了大陆后端 → 注入 window.__API_BASE，密钥在后端不暴露
    const base = (typeof window !== "undefined" && window.__API_BASE);
    if (base) return base.replace(/\/$/, "") + "/api/tts";
    // 路径①（直连·密钥公开）：已内置 Step Fun Key → 浏览器直连 stepfun（CORS 开放，任意静态托管可用真实语音）
    if (typeof STEPFUN_API_KEY === "string" && STEPFUN_API_KEY) return STEPFUN_TTS_MARKER;
    // 两者皆无 → 不使用云端 TTS，回退浏览器原生语音
    return null;
  }

  /* 播放 wav blob：自动处理浏览器「自动播放策略」拦截——
   * 若 play() 被拦（无用户手势），挂到首次 pointerdown/keydown 再播；最多等 8s，超时则失败回退原生。 */
  function playAudio(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      currentAudio = audio;
      let settled = false;
      const cleanup = () => {
        try { document.removeEventListener("pointerdown", onGesture); } catch (e) {}
        try { document.removeEventListener("keydown", onGesture); } catch (e) {}
        audio.onended = audio.onerror = null;
        currentAudio = null;
      };
      const ok = () => { if (settled) return; settled = true; cleanup(); resolve(true); };
      const fail = () => { if (settled) return; settled = true; cleanup(); reject(new Error("audio play error")); };
      const onGesture = () => { if (audio.paused) audio.play().catch(() => {}); };
      audio.onended = ok;
      audio.onerror = fail;
      audio.play().then(() => {
        document.addEventListener("pointerdown", onGesture);
        document.addEventListener("keydown", onGesture);
      }).catch(() => {
        // 自动播放被拦截：等用户首次交互再播
        document.addEventListener("pointerdown", onGesture);
        document.addEventListener("keydown", onGesture);
        setTimeout(fail, 8000);
      });
    });
  }

  async function playCloudTTS(endpoint, text, opts) {
    opts = opts || {};
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voice: opts.voice || undefined,
        ...(opts.instruction ? { instruction: opts.instruction } : {}),
        ...(opts.speed ? { speed: opts.speed } : {}),
        ...(opts.volume ? { volume: opts.volume } : {}),
      }),
    });
    if (!r.ok) {
      let msg = "";
      try { const j = await r.json(); msg = j.error || ""; } catch (e) {}
      throw new Error(msg || ("HTTP " + r.status));
    }
    const blob = await r.blob();
    if (!blob || !blob.size) throw new Error("empty audio");
    const url = URL.createObjectURL(blob);
    try {
      await playAudio(url);
    } finally {
      try { URL.revokeObjectURL(url); } catch (e) {}
    }
  }

  /* 路径①：浏览器直连 Step Fun（真实 stepaudio 语音）。CORS 开放，任意静态托管可用。
   * 注意：Key 已随前端公开，调用方不可信；step_plan 档位仍需中国大陆 IP（非大陆返回 451 → 上层回退原生）。 */
  async function playStepfunTTS(text, opts) {
    opts = opts || {};
    const r = await fetch(STEPFUN_TTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + STEPFUN_API_KEY },
      body: JSON.stringify({
        model: "stepaudio-2.5-tts",
        input: text,
        voice: opts.voice || "vibrant-youth",
        ...(opts.instruction ? { instruction: opts.instruction } : {}),
        ...(opts.speed ? { speed: opts.speed } : {}),
        ...(opts.volume ? { volume: opts.volume } : {}),
        text_normalization: "enhanced", // 更自然的数字/单位/符号读法
        sample_rate: 24000,
        response_format: "wav",
      }),
    });
    if (!r.ok) {
      let msg = "";
      try { const j = await r.json(); msg = j.error || j.message || JSON.stringify(j); } catch (e) { try { msg = await r.text(); } catch (_) {} }
      // 关键：强制把 HTTP 状态码带进错误信息，避免 stepfun 错误体不含字面 451 时判断丢失
      throw new Error("stepfun HTTP " + r.status + (msg ? " - " + msg : ""));
    }
    const blob = await r.blob();
    if (!blob || !blob.size) throw new Error("empty audio");
    const url = URL.createObjectURL(blob);
    try {
      await playAudio(url);
    } finally {
      try { URL.revokeObjectURL(url); } catch (e) {}
    }
  }

  Speech.ttsSupported = function () {
    return !!(getCloudTTSEndpoint() || (window.speechSynthesis && window.SpeechSynthesisUtterance));
  };

  /** 朗读文本：云端 TTS 优先，失败回退浏览器原生 */
  Speech.speak = async function (text, npcKey) {
    if (!text) return;
    speaking = true;
    const endpoint = getCloudTTSEndpoint();
    const cfg = STEPFUN_VOICE_MAP[npcKey] || STEPFUN_VOICE_MAP._default;
    const revealed = (typeof S !== "undefined" && S.revealed && S.revealed[npcKey]);
    const instruction = (revealed && cfg.revealedInstruction) ? cfg.revealedInstruction : (cfg.instruction || undefined);
    const ttsOpts = { voice: cfg.voice, instruction, speed: cfg.speed, volume: cfg.volume };
    if (endpoint === STEPFUN_TTS_MARKER) {
      // 路径①：浏览器直连 stepfun（真实 stepaudio 语音）
      try {
        await playStepfunTTS(text, ttsOpts);
        speaking = false;
        return;
      } catch (e) {
        const d = e && e.message ? e.message : String(e);
        notifyTTSFallback(d);
        console.warn("[TTS] 阶跃直连失败，回退浏览器原生：", d);
      }
    } else if (endpoint) {
      // 路径②：后端代理 /api/tts
      try {
        await playCloudTTS(endpoint, text, ttsOpts);
        speaking = false;
        return;
      } catch (e) {
        const d = e && e.message ? e.message : String(e);
        notifyTTSFallback(d);
        console.warn("[TTS] 云端语音失败，回退浏览器原生：", d);
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
