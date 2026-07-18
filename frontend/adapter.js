/* ============================================================
 * 反诈人生 · M5 H5 / 小程序适配（环境检测 + 体验修正）
 * ------------------------------------------------------------
 * 与 GDD V9.0「M5 小程序 / H5 适配」对应：
 *  - 检测微信内置浏览器 / 小程序 web-view 环境，注入 body[data-env]
 *  - 提供统一返回入口：小程序内走 wx.miniProgram.navigateBack，否则回退
 *  - 配合 index8.html 已有的 viewport-fit=cover 与 safe-area 内边距，
 *    在刘海屏 / 底部安全区呈现正确的留白
 *  - 移动端建议竖屏观感（仅样式提示，不强制旋转）
 *
 * 全局：window.H5Adapter（init / navigateBack / env / inWeChat / inMiniProgram）
 * 依赖：无（wx 对象可选）
 * ============================================================ */
(function () {
  let env = "browser";
  let inWeChat = false;
  let inMiniProgram = false;

  function detect() {
    const ua = navigator.userAgent || "";
    inWeChat = /MicroMessenger/i.test(ua);
    inMiniProgram = /miniProgram/i.test(ua) ||
      (typeof wx !== "undefined" && wx && wx.miniProgram);
    if (inMiniProgram) env = "miniprogram";
    else if (inWeChat) env = "wechat";
    else env = "browser";
    if (document.body) document.body.setAttribute("data-env", env);
    else document.addEventListener("DOMContentLoaded", () => document.body && document.body.setAttribute("data-env", env));
  }

  /* 小程序 web-view 内：优先调用小程序原生返回；否则执行回退函数 */
  function navigateBack(fallback) {
    if (inMiniProgram && typeof wx !== "undefined" && wx.miniProgram && wx.miniProgram.navigateBack) {
      try { wx.miniProgram.navigateBack(); return true; } catch (e) {}
    }
    if (typeof fallback === "function") fallback();
    return false;
  }

  /* 是否在微信环境（用于提示「用浏览器打开体验更佳」） */
  function isWeChat() { return inWeChat; }

  function init() { detect(); }

  window.H5Adapter = {
    init, navigateBack, isWeChat,
    get env() { return env; },
    get inWeChat() { return inWeChat; },
    get inMiniProgram() { return inMiniProgram; },
  };
})();
