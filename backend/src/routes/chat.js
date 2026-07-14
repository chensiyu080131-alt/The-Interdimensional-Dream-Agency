/**
 * ============================================================
 * 路由定义 —— /api/chat
 * ============================================================
 */

const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

// POST /api/chat —— 核心对话接口
router.post("/", chatController.handleChat);

// GET /api/chat/health —— 健康检查
router.get("/health", chatController.handleHealth);

module.exports = router;
