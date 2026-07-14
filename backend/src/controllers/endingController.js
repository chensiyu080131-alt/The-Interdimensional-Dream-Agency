/**
 * ============================================================
 * 结局判定控制器
 * ------------------------------------------------------------
 * 提供：
 *   POST /api/ending/predict  —— 实时预测 5 个结局概率分布
 *   GET  /api/ending/predict  —— 兼容 GET（查询参数透传）
 * ============================================================
 */

const endingService = require("../services/endingService");

/* 从请求中取出判定维度 */
function extractState(req) {
  const body = req.method === "POST" ? req.body : req.query;
  return {
    trust: body.trust,
    evidence: body.evidence,
    xiaoya: body.xiaoya,
    reportedLaok: body.reportedLaok === true || body.reportedLaok === "true" || body.reportedLaok === 1 || body.reportedLaok === "1",
    transferred: body.transferred === true || body.transferred === "true" || body.transferred === 1 || body.transferred === "1",
    route: body.route || "",
    currentDay: body.currentDay,
  };
}

/* POST /api/ending/predict —— AI 辅助研判（异步，可用混元） */
async function handlePredict(req, res) {
  try {
    const state = extractState(req);
    const result = await endingService.predictEndingAsync(state);
    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("[handlePredict] 错误:", err);
    return res.status(500).json({ success: false, error: "结局预测失败" });
  }
}

/* GET /api/ending/predict —— 同步规则预测（轻量，用于实时轮询） */
async function handlePredictSync(req, res) {
  try {
    const state = extractState(req);
    const result = endingService.predictEndingSync(state);
    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("[handlePredictSync] 错误:", err);
    return res.status(500).json({ success: false, error: "结局预测失败" });
  }
}

/* GET /api/ending/meta —— 返回结局元数据 */
async function handleMeta(req, res) {
  return res.json({
    success: true,
    endings: endingService.ENDING_META,
    threshold: endingService.TRIGGER_THRESHOLD,
    dimensions: ["trust", "evidence", "xiaoya", "reportedLaok", "transferred", "route"],
  });
}

module.exports = {
  handlePredict,
  handlePredictSync,
  handleMeta,
};
