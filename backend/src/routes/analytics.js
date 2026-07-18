/**
 * ============================================================
 * 路由定义 —— /api/track（M5 数据埋点接收端）
 * ============================================================
 */

const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

// POST /api/track —— 批量接收匿名事件
router.post("/", analyticsController.handleTrack);

// GET /api/track/stats —— 聚合计数（运维观测用）
router.get("/stats", analyticsController.handleStats);

module.exports = router;
