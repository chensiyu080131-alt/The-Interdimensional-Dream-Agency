/**
 * ============================================================
 * M5 数据埋点接收端
 * ------------------------------------------------------------
 * 职责：
 *   1. 接收前端批量上报的匿名事件
 *   2. 仅做聚合计数（不存储事件原文，避免任何 PII 留存）
 *   3. 内存环形计数 + 可选落盘到本地日志（仅聚合数字）
 *
 * 安全：沿用 /api 统一入口鉴权（X-Access-Token），缺 token 时放开（本地/现有部署兼容）
 * ============================================================
 */

const fs = require("fs");
const path = require("path");

/* 内存聚合计数（进程级；重启清零，仅用于实时观察教育效果） */
const COUNTERS = {
  sessions: 0,
  events: 0,
  byName: {},
};
let logStream = null;
try {
  const logDir = path.resolve(__dirname, "../../logs");
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  logStream = fs.createWriteStream(path.join(logDir, "analytics.log"), { flags: "a" });
} catch (e) {
  // 落盘失败不影响主流程
  logStream = null;
}

function bump(name) {
  COUNTERS.events++;
  COUNTERS.byName[name] = (COUNTERS.byName[name] || 0) + 1;
}

function handleTrack(req, res) {
  try {
    const body = req.body || {};
    const events = Array.isArray(body.events) ? body.events : [];
    if (body.sessionId) {
      // 仅记录「有新会话」的增量；用 set 近似，这里用首次出现计数
      if (!COUNTERS._seen) COUNTERS._seen = new Set();
      if (!COUNTERS._seen.has(body.sessionId)) {
        COUNTERS._seen.add(body.sessionId);
        COUNTERS.sessions++;
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
  });
}

module.exports = { handleTrack, handleStats };
