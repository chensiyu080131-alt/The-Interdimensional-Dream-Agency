/* ============================================================
 * 反诈人生 · M5 数据埋点（轻量 · 隐私优先）
 * ------------------------------------------------------------
 * 与 GDD V9.0「M5 数据埋点」对应：
 *  - 仅采集匿名聚合事件，绝不记录任何 PII（姓名/手机号/聊天原文）
 *  - 事件先入本地缓冲，按节流或在页面隐藏时批量上报后端 /api/track
 *  - 后端仅做计数聚合，不存储事件原文，便于后续评估教育效果
 *  - 全部开关可在 config 关闭；本地无后端时静默降级
 *
 * 全局：window.Analytics（init / track / flush / getStats）
 * 依赖：无
 * ============================================================ */
(function () {
  const SAVE_KEY = "yzc_dmju_analytics_v1";
  const MAX_BUFFER = 50;       // 缓冲满即触发上报
  const FLUSH_MS = 6000;       // 定时上报间隔
  const MAX_EVENT_PROP_LEN = 64; // 属性值截断，防异常大 payload

  let cfg = { endpoint: "", token: "", enabled: true };
  let sessionId = null;
  let buffer = [];
  let startedAt = Date.now();
  let flushTimer = null;

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
      sessionId = d.sessionId || genId();
      if (!d.sessionId) save();
    } catch (e) { sessionId = genId(); }
  }
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ sessionId })); } catch (e) {}
  }

  function anonymizeEnv() {
    const ua = navigator.userAgent || "";
    let os = "other";
    if (/iPhone|iPad|iPod/.test(ua)) os = "ios";
    else if (/Android/.test(ua)) os = "android";
    else if (/Windows/.test(ua)) os = "windows";
    else if (/Mac OS/i.test(ua)) os = "mac";
    let env = "browser";
    if (/miniProgram/i.test(ua) || (typeof wx !== "undefined" && wx && wx.miniProgram)) env = "miniprogram";
    else if (/MicroMessenger/i.test(ua)) env = "wechat";
    return { os, env, screen: screenTag() };
  }
  function screenTag() {
    const w = window.innerWidth || 0;
    return w <= 480 ? "mobile" : w <= 1024 ? "tablet" : "desktop";
  }

  function init(opts) {
    opts = opts || {};
    cfg.endpoint = opts.endpoint || "";
    cfg.token = opts.token || "";
    cfg.enabled = opts.enabled !== false;
    load();
    // 自动埋点：会话开始
    const env = anonymizeEnv();
    track("session_start", { os: env.os, env: env.env, screen: env.screen });
    // 会话结束/隐藏时尽量把缓冲 flush 出去
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush(true);
    });
    window.addEventListener("pagehide", () => flush(true));
    if (flushTimer) clearInterval(flushTimer);
    flushTimer = setInterval(() => flush(false), FLUSH_MS);
  }

  function sanitize(v) {
    if (v === null || v === undefined) return v;
    if (typeof v === "string" && v.length > MAX_EVENT_PROP_LEN) return v.slice(0, MAX_EVENT_PROP_LEN) + "…";
    if (typeof v === "object") {
      try { return JSON.parse(JSON.stringify(v, (_k, val) => typeof val === "string" && val.length > MAX_EVENT_PROP_LEN ? val.slice(0, MAX_EVENT_PROP_LEN) + "…" : val)); }
      catch (e) { return {}; }
    }
    return v;
  }

  function track(name, props) {
    if (!cfg.enabled || !sessionId) return;
    if (!name || typeof name !== "string") return;
    const evt = { n: name, t: Date.now(), s: sessionId, p: sanitize(props) || {} };
    buffer.push(evt);
    if (buffer.length >= MAX_BUFFER) flush(false);
  }

  function flush(force) {
    if (!cfg.endpoint || buffer.length === 0) { buffer = []; return; }
    const payload = { sessionId, events: buffer.slice() };
    buffer = [];
    const headers = { "Content-Type": "application/json" };
    if (cfg.token) headers["X-Access-Token"] = cfg.token;
    try {
      fetch(cfg.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        keepalive: true, // 页面卸载时也能发出
      }).catch(() => {});
    } catch (e) { /* 静默降级 */ }
  }

  function getStats() { return { sessionId, buffered: buffer.length }; }

  window.Analytics = { init, track, flush, getStats };
})();
