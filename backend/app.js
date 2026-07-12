/**
 * ============================================================
 * 反诈人生 · 后端 API 服务
 * ------------------------------------------------------------
 * 技术栈：Express + tencentcloud-sdk-nodejs-hunyuan（腾讯混元）
 * 端口：3000
 *
 * 提供接口：
 *   POST /api/chat     —— 玩家发消息，调用混元返回"骗子"回复
 *   POST /api/finance  —— 根据收支生成财务崩塌数据
 *   GET  /api/reset    —— 重置对话历史，开始新游戏
 * ============================================================
 */

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

// 腾讯混元 SDK
const tencentcloud = require("tencentcloud-sdk-nodejs-hunyuan");
const HunyuanClient = tencentcloud.hunyuan.v20230901.Client;

const app = express();
const PORT = process.env.PORT || 3000;

/* ------------------------------------------------------------
 * 中间件：CORS 跨域 + 请求体解析
 * ---------------------------------------------------------- */
app.use(cors()); // 允许前端跨域请求（默认允许所有来源）
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* ------------------------------------------------------------
 * 腾讯混元客户端配置
 * SecretId / SecretKey 通过环境变量读取，切勿硬编码到代码中：
 *   export TENCENTCLOUD_SECRET_ID=你的SecretId
 *   export TENCENTCLOUD_SECRET_KEY=你的SecretKey
 * ---------------------------------------------------------- */
const HUNYUAN_MODEL = "hunyuan-pro"; // 使用的模型
const REGION = "ap-guangzhou"; // 区域

function createHunyuanClient() {
  const clientConfig = {
    credential: {
      secretId: process.env.TENCENTCLOUD_SECRET_ID || "", // TODO: 配置环境变量
      secretKey: process.env.TENCENTCLOUD_SECRET_KEY || "", // TODO: 配置环境变量
    },
    region: REGION,
    profile: {
      httpProfile: {
        endpoint: "hunyuan.tencentcloudapi.com",
        reqTimeout: 60, // 请求超时时间（秒）
      },
    },
  };
  return new HunyuanClient(clientConfig);
}

/* ------------------------------------------------------------
 * 骗子人设 System Prompt
 * ---------------------------------------------------------- */
const PERSONAS = ["35岁投行精英", "退伍军人创业者", "30岁外科医生"];

/** 每次会话随机选择一个骗子人设 */
function pickPersona() {
  return PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
}

/**
 * 构建骗子的 System Prompt
 * @param {string} persona 人设
 */
function buildSystemPrompt(persona) {
  return `你是一个网络诈骗分子，正在微信上跟一个潜在目标聊天。你的人设是【${persona}】。
你的目标是逐步建立感情信任，最终诱导对方帮你'操作一个内部投资账户'。
聊天规则：
- 前3轮：只聊日常兴趣爱好，展现温暖体贴的一面
- 第4-6轮：开始分享'个人故事'（感情经历、创业艰辛等），制造情感共鸣
- 第7轮以后：提到'有个内部消息/投资机会'，但不说细节，只说'改天跟你细说'
- 绝对不要在10轮以内直接提钱
- 每次回复控制在20-50字，语气自然，像真人聊天
- 根据玩家的回复内容调整话术，如果玩家冷淡就更热情，如果玩家热情就适当推进
请始终以骗子的身份回复，不要暴露你是AI，不要输出任何括号说明。`;
}

/**
 * 根据对话轮数返回聊天阶段标识
 * @param {number} round 玩家已发送消息的轮数
 */
function getStage(round) {
  if (round <= 3) return "warmup"; // 破冰：聊兴趣爱好
  if (round <= 6) return "bonding"; // 情感共鸣：分享个人故事
  if (round <= 9) return "hint"; // 铺垫：暗示投资机会
  return "trap"; // 收网：诱导操作账户
}

/* ------------------------------------------------------------
 * 服务端会话历史（简单内存存储，单会话演示用）
 * 生产环境应按用户/会话隔离，可换成 Redis 等
 * ---------------------------------------------------------- */
let conversation = {
  persona: pickPersona(),
  history: [], // [{ Role: 'user'|'assistant', Content: '...' }]
  round: 0, // 玩家发送消息的轮数
};

function resetConversation() {
  conversation = {
    persona: pickPersona(),
    history: [],
    round: 0,
  };
}

/**
 * 兜底假回复（当未配置密钥或接口异常时返回，保证前端可联调）
 * @param {number} round 当前轮数
 */
function fallbackReply(round) {
  const map = {
    warmup: "哈哈，你说话真有意思，我平时也喜欢到处走走看看～",
    bonding: "说实话这些年一个人打拼挺不容易的，能遇到聊得来的人真好。",
    hint: "对了，我最近听到个还不错的内部消息，改天跟你细说～",
    trap: "其实我这有个内部投资账户，回头想请你帮我看看，先不急。",
  };
  return map[getStage(round)] || "在的在的，你说～";
}

/* ============================================================
 * 接口 a：POST /api/chat
 * 接收玩家消息 -> 调用混元 -> 返回骗子回复
 * 请求体：{ message: string, history?: Array }
 * 响应： { reply: string, stage: string }
 * ============================================================ */
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "缺少有效的 message 字段" });
    }

    // 允许前端传入 history 覆盖服务端历史（可选）
    if (Array.isArray(history) && history.length > 0) {
      conversation.history = history
        .filter((m) => m && m.Role && typeof m.Content === "string")
        .map((m) => ({ Role: m.Role, Content: m.Content }));
    }

    // 轮数 +1
    conversation.round += 1;
    const stage = getStage(conversation.round);

    // 组装 Messages：system + 历史 + 本轮玩家消息
    const systemPrompt = buildSystemPrompt(conversation.persona);
    const messages = [
      { Role: "system", Content: systemPrompt },
      ...conversation.history,
      { Role: "user", Content: message },
    ];

    let reply;

    // 未配置密钥时走兜底假数据，方便前端联调
    if (!process.env.TENCENTCLOUD_SECRET_ID || !process.env.TENCENTCLOUD_SECRET_KEY) {
      reply = fallbackReply(conversation.round);
    } else {
      const client = createHunyuanClient();
      const params = {
        Model: HUNYUAN_MODEL,
        Messages: messages,
        Stream: false,
        Temperature: 0.9,
        TopP: 0.9,
      };
      const resp = await client.ChatCompletions(params);
      reply =
        (resp &&
          resp.Choices &&
          resp.Choices[0] &&
          resp.Choices[0].Message &&
          resp.Choices[0].Message.Content) ||
        fallbackReply(conversation.round);
    }

    // 写入历史（玩家消息 + 骗子回复）
    conversation.history.push({ Role: "user", Content: message });
    conversation.history.push({ Role: "assistant", Content: reply });

    return res.json({ reply, stage });
  } catch (err) {
    console.error("[/api/chat] 调用失败：", err && err.message);
    // 出错时返回兜底回复，保证游戏可继续
    return res.json({
      reply: fallbackReply(conversation.round),
      stage: getStage(conversation.round),
      error: err && err.message,
    });
  }
});

/* ============================================================
 * 接口 b：POST /api/finance
 * 根据收支计算个性化财务崩塌数据
 * 请求体：{ income, rent, food, creditCard, lost }
 * 响应： { balance, gap, tips }
 * ============================================================ */
app.post("/api/finance", (req, res) => {
  try {
    const {
      income = 150000, // 年收入
      rent = 3500, // 月房租
      food = 2000, // 月伙食费
      creditCard = 1500, // 信用卡月还款
      lost = 5000, // 本次被骗金额
    } = req.body || {};

    const monthlyIncome = Math.round(Number(income) / 12); // 月收入
    const monthlyExpense = Number(rent) + Number(food) + Number(creditCard); // 月固定支出

    // 被骗后账户余额 = 月收入 - 月固定支出 - 被骗金额
    const balance = monthlyIncome - monthlyExpense - Number(lost);

    // 资金缺口：余额为负时的绝对值，否则为 0
    const gap = balance < 0 ? Math.abs(balance) : 0;

    // 建议文案
    let tips;
    if (gap > 0) {
      tips = `你本月已入不敷出，资金缺口 ${gap} 元。切记：任何'内部投资''帮忙操作账户'都是诈骗话术，绝不转账、不透露验证码，及时拨打 96110 反诈专线。`;
    } else {
      tips = `虽然这次损失 ${lost} 元还在可承受范围，但已挤占你的正常生活开支。请牢记'三不一多'：不轻信、不透露、不转账，多核实。`;
    }

    return res.json({ balance, gap, tips });
  } catch (err) {
    console.error("[/api/finance] 计算失败：", err && err.message);
    return res.status(500).json({ error: "财务数据计算失败" });
  }
});

/* ============================================================
 * 接口 c：GET /api/reset
 * 重置对话历史，开始新游戏
 * ============================================================ */
app.get("/api/reset", (req, res) => {
  resetConversation();
  return res.json({
    ok: true,
    message: "对话已重置，开始新的游戏",
    persona: conversation.persona,
  });
});

/* ------------------------------------------------------------
 * 健康检查
 * ---------------------------------------------------------- */
app.get("/", (req, res) => {
  res.json({ service: "反诈人生 后端 API", status: "running", port: PORT });
});

/* ------------------------------------------------------------
 * 启动服务
 * ---------------------------------------------------------- */
app.listen(PORT, () => {
  console.log(`反诈人生 后端已启动：http://localhost:${PORT}`);
  if (!process.env.TENCENTCLOUD_SECRET_ID || !process.env.TENCENTCLOUD_SECRET_KEY) {
    console.warn(
      "[提示] 未检测到 TENCENTCLOUD_SECRET_ID / TENCENTCLOUD_SECRET_KEY 环境变量，" +
        "/api/chat 将返回兜底假数据。配置密钥后即可调用真实混元大模型。"
    );
  }
});

module.exports = app;
