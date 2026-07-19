/* 产品运行冒烟测试主控（无浏览器、无后端依赖）
 * 构建 Proxy DOM 桩 + 定时器队列，拼接前端脚本 + product_driver.js 在 vm 中运行，
 * 模拟浏览器「多 script 共享全局作用域」以捕获顶层重复声明等会令整页崩溃的错误。
 * 用法：node scripts/product_test.js
 */
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const FE = path.join(__dirname, "..", "frontend");
const ORDER = [
  "data8.js", "scamTypes.js", "report.js", "scenarios.js",
  "evidence.js", "quickMode.js", "weakness.js",
  "analytics.js", "voice.js", "adapter.js", "app8.js"
];

// 通用安全桩：既可调用，又有无穷子属性，永不因缺失 DOM API 而抛错
const UNIVERSAL = new Proxy(function () {}, {
  get() { return UNIVERSAL; },
  set() { return true; },
  apply() { return UNIVERSAL; },
  construct() { return UNIVERSAL; }
});

function makeEl() {
  const store = {
    style: { setProperty() {}, getPropertyValue() { return ""; }, removeProperty() {}, cssText: "" }, dataset: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    children: [],
    _text: "", _html: "", _cls: "", _val: "", _onclick: null,
    addEventListener() {}, removeEventListener() {},
    appendChild(c) { return c; }, removeChild() {},
    setAttribute() {}, getAttribute() { return null; }, remove() {},
    focus() {}, blur() {}, click() {}, scrollIntoView() {},
    querySelector() { return makeEl(); }, querySelectorAll() { return []; },
    getContext() { return UNIVERSAL; },
    get lastChild() { return makeEl(); }, get firstChild() { return makeEl(); },
    get parentNode() { return makeEl(); }, get parentElement() { return makeEl(); },
    get scrollHeight() { return 0; }, get scrollTop() { return 0; }, set scrollTop(v) {},
    set onclick(v) { store._onclick = v; }, get onclick() { return store._onclick; },
    set onmousedown(v) {}, set onmouseup(v) {}, set ontouchstart(v) {}, set ontouchend(v) {},
    set innerHTML(v) { store._html = v; }, get innerHTML() { return store._html || ""; },
    set textContent(v) { store._text = v; }, get textContent() { return store._text || ""; },
    set className(v) { store._cls = v; }, get className() { return store._cls || ""; },
    set value(v) { store._val = v; }, get value() { return store._val || ""; }
  };
  return new Proxy(store, {
    get(t, p) { if (p in t) return t[p]; return UNIVERSAL; },
    set(t, p, v) { t[p] = v; return true; }
  });
}

const elCache = {};
const document = {
  getElementById(id) { return elCache[id] || (elCache[id] = makeEl()); },
  createElement() { return makeEl(); },
  querySelector() { return makeEl(); },
  querySelectorAll() { return []; },
  addEventListener() {}, removeEventListener() {},
  body: makeEl(), documentElement: makeEl()
};

const _ls = {};
const localStorage = {
  getItem(k) { return k in _ls ? _ls[k] : null; },
  setItem(k, v) { _ls[k] = String(v); },
  removeItem(k) { delete _ls[k]; }, clear() { for (var k in _ls) delete _ls[k]; }
};

const sandbox = {};
sandbox.window = sandbox;            // window === global
sandbox.document = document;
sandbox.localStorage = localStorage;
sandbox.navigator = { userAgent: "Mozilla/5.0 (node-test)" };
sandbox.location = { hostname: "test.local", href: "http://test.local/index8.html", protocol: "http:" };
sandbox.console = console;
sandbox.Math = Math; sandbox.JSON = JSON; sandbox.Date = Date; sandbox.Object = Object;
sandbox.Array = Array; sandbox.String = String; sandbox.Number = Number; sandbox.Boolean = Boolean;
sandbox.parseInt = parseInt; sandbox.parseFloat = parseFloat; sandbox.isNaN = isNaN;
sandbox.setTimeout = function (fn) { sandbox._timers.push(fn); return sandbox._timers.length; };
sandbox.clearTimeout = function () {};
sandbox.setInterval = function () { return 0; };   // typeWriter 的逐字动画：无需真正触发
sandbox.clearInterval = function () {};
sandbox.addEventListener = function () {};
sandbox.removeEventListener = function () {};
sandbox.innerWidth = 1024; sandbox.innerHeight = 768;
sandbox.fetch = function () { return Promise.resolve({ ok: true, json: function () { return Promise.resolve({}); }, text: function () { return Promise.resolve(""); } }); };
sandbox._timers = [];

const context = vm.createContext(sandbox);

let src = "";
for (const f of ORDER) {
  src += "\n/* ===== " + f + " ===== */\n";
  src += fs.readFileSync(path.join(FE, f), "utf8");
  src += "\n";
}
src += "\n/* ===== TEST DRIVER ===== */\n";
src += fs.readFileSync(path.join(__dirname, "product_driver.js"), "utf8");

try {
  vm.runInContext(src, context, { filename: "frontend-bundle.js" });
} catch (e) {
  console.log("=== LOAD/RUN ERROR ===");
  console.log(e.stack || e.message);
  process.exit(2);
}

const R = sandbox.__REPORT || { load: "NO_REPORT" };
const passed = (R.tests || []).filter(function (t) { return t.pass; }).length;
console.log("\n=== RESULT: " + passed + "/" + (R.tests || []).length + " passed; load=" + R.load + " ===");
if (R.errors && R.errors.length) {
  console.log("ERRORS:");
  R.errors.forEach(function (e) { console.log("  - " + e); });
}
process.exit(R.errors && R.errors.length ? 1 : 0);
