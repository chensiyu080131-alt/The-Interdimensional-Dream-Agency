/* ============================================================
 * 反诈人生 · M5 语音播报（TTS · 浏览器内置 Web Speech API）
 * ------------------------------------------------------------
 * 与 GDD V9.0「M5 语音」对应：
 *  - 用浏览器内置 SpeechSynthesis 朗读「骗子 / AI」消息（中文）
 *  - 零外部依赖、零网络请求；浏览器不支持时自动降级为 no-op
 *  - 开关状态持久化到 localStorage；朗读仅在开启时触发
 *  - 长文本自动截断，避免朗读过长；点击任意处可打断
 *
 * 全局：window.Voice（init / setEnabled / toggle / isEnabled / isSupported / speak / stop）
 * 依赖：无
 * ============================================================ */
(function () {
  const KEY = "yzc_dmju_voice_on";
  let enabled = false;
  let supported = false;
  let zhVoice = null;

  function detect() {
    supported = !!(window.speechSynthesis && typeof window.SpeechSynthesisUtterance !== "undefined");
    if (!supported) return;
    pickVoice();
    // 部分浏览器异步加载 voices 列表
    if (typeof window.speechSynthesis.onvoiceschanged !== "undefined") {
      window.speechSynthesis.onvoiceschanged = pickVoice;
    }
  }
  function pickVoice() {
    const voices = window.speechSynthesis.getVoices() || [];
    zhVoice = voices.find((v) => /zh[-_]?CN/i.test(v.lang)) ||
              voices.find((v) => /^zh/i.test(v.lang)) || null;
  }
  function loadPref() {
    try { enabled = localStorage.getItem(KEY) === "1"; } catch (e) { enabled = false; }
  }
  function savePref() { try { localStorage.setItem(KEY, enabled ? "1" : "0"); } catch (e) {} }

  function init() { detect(); loadPref(); }

  function setEnabled(v) { enabled = !!v; savePref(); if (!enabled) stop(); }
  function toggle() {
    if (!supported) return false; // 不支持时不允许开启，避免「开却无声」
    setEnabled(!enabled);
    return enabled;
  }
  function isEnabled() { return enabled; }
  function isSupported() { return supported; }

  function speak(text, opts) {
    if (!enabled || !supported || !text) return;
    let t = String(text).replace(/\s+/g, " ").trim();
    if (!t) return;
    if (t.length > 220) t = t.slice(0, 220) + "……";
    stop();
    const u = new SpeechSynthesisUtterance(t);
    if (zhVoice) u.voice = zhVoice;
    u.lang = "zh-CN";
    u.rate = (opts && opts.rate) || 1.0;
    u.pitch = (opts && opts.pitch) || 1.0;
    u.volume = (opts && opts.volume) || 1.0;
    try { window.speechSynthesis.speak(u); } catch (e) {}
  }
  function stop() {
    if (supported) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  }

  window.Voice = {
    init, setEnabled, toggle, isEnabled, isSupported, speak, stop,
    get supported() { return supported; },
  };
})();
