/**
 * ============================================================
 * 结局判定路由
 *   POST /api/ending/predict  —— AI 辅助结局预测（混元增强）
 *   GET  /api/ending/predict  —— 同步规则预测（轻量轮询）
 *   GET  /api/ending/meta    —— 结局元数据
 * ============================================================
 */

const express = require("express");
const router = express.Router();
const endingController = require("../controllers/endingController");

router.post("/predict", endingController.handlePredict);
router.get("/predict", endingController.handlePredictSync);
router.get("/meta", endingController.handleMeta);

module.exports = router;
