/**
 * ============================================================
 * M5 数据埋点接收端（增强版：文件持久化 + 趋势统计）
 * ------------------------------------------------------------
 * 职责：
 *   1. 接收前端批量上报的匿名事件
 *   2. 仅做聚合计数（不存储事件原文，避免任何 PII 留存）
 *   3. 聚合计数 + 按日趋势持久化到 backend/data/analytics.json
 *      （进程重启不丢失，供本地看板读取）
 *
 * 安全：沿用 /api 统一入口鉴权（X-Access-Token），缺 token 时放开
 *       （本地/现有部署兼容）。聚合数据不含任何可识别个人信息。
 * ============================================================
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.resolve(__dirname, "../../data");
const STORE_PATH = path.join(DATA_DIR, "analytics.json");

/* 内存聚合计数（进程级，启动时从文件恢复） */
const COUNTERS = {
  sessions: 0,
  events: 0,
  byName: {},
  daily: {}, // { "2026-07-18": { sessions, events, byName } }
};
let logStream = null;
try {
  const logDir = path.resolve(__dirname, "../../logs");
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  logStream = fs.createWriteStream(path.join(logDir, "analytics.log"), { flags: "a" });
} catch (e) {
  logStream = null;
}

/* 会话去重（仅内存，重启后重新计数；对教育类聚合统计影响可忽略） */
let seenSessions = null;
function getSeen() {
  if (!seenSessions) seenSessions = new Set();
  return seenSessions;
}

function todayKey(d) {
  const x = d || new Date();
  return x.toISOString().slice(0, 10); // YYYY-MM-DD（UTC，足够做日趋势）
}

/* 启动时从文件恢复聚合计数 */
function loadStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf8");
      const obj = JSON.parse(raw);
      COUNTERS.sessions = obj.sessions || 0;
      COUNTERS.events = obj.events || 0;
      COUNTERS.byName = obj.byName || {};
      COUNTERS.daily = obj.daily || {};
    }
  } catch (e) {
    // 损坏则忽略，重新开始计数
    console.error("[analytics] 读取持久化失败，重新开始:", e.message);
  }
}

let saveQueued = false;
function saveStore() {
  // 简单节流：合并同一 tick 内的多次写入
  if (saveQueued) return;
  saveQueued = true;
  setImmediate(() => {
    saveQueued = false;
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      const payload = {
        updatedAt: Date.now(),
        sessions: COUNTERS.sessions,
        events: COUNTERS.events,
        byName: COUNTERS.byName,
        daily: COUNTERS.daily,
      };
      fs.writeFileSync(STORE_PATH, JSON.stringify(payload, null, 2), "utf8");
    } catch (e) {
      // 落盘失败不影响主流程
    }
  });
}

function bump(name) {
  COUNTERS.events++;
  COUNTERS.byName[name] = (COUNTERS.byName[name] || 0) + 1;
  const dk = todayKey();
  if (!COUNTERS.daily[dk]) COUNTERS.daily[dk] = { sessions: 0, events: 0, byName: {} };
  COUNTERS.daily[dk].events++;
  COUNTERS.daily[dk].byName[name] = (COUNTERS.daily[dk].byName[name] || 0) + 1;
}

function handleTrack(req, res) {
  try {
    const body = req.body || {};
    const events = Array.isArray(body.events) ? body.events : [];
    if (body.sessionId) {
      const seen = getSeen();
      if (!seen.has(body.sessionId)) {
        seen.add(body.sessionId);
        COUNTERS.sessions++;
        const dk = todayKey();
        if (!COUNTERS.daily[dk]) COUNTERS.daily[dk] = { sessions: 0, events: 0, byName: {} };
        COUNTERS.daily[dk].sessions++;
      }
    }
    let accepted = 0;
    for (const e of events) {
      if (e && typeof e.n === "string") {
        bump(e.n);
        accepted++;
      }
    }
    if (logStream) {
      try {
        logStream.write(JSON.stringify({ t: Date.now(), session: body.sessionId || "", count: accepted }) + "\n");
      } catch (e) {}
    }
    saveStore();
    return res.json({ success: true, accepted });
  } catch (err) {
    console.error("[analytics] 处理失败:", err.message);
    return res.status(500).json({ success: false, error: "analytics error" });
  }
}

function handleStats(req, res) {
  return res.json({
    success: true,
    sessions: COUNTERS.sessions,
    events: COUNTERS.events,
    byName: COUNTERS.byName,
    daily: COUNTERS.daily,
    distinctEvents: Object.keys(COUNTERS.byName).length,
    days: Object.keys(COUNTERS.daily).length,
    updatedAt: Date.now(),
  });
}

// 启动时恢复
loadStore();

module.exports = { handleTrack, handleStats, loadStore, saveStore, STORE_PATH };
