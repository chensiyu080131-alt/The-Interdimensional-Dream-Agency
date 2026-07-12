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
 * 反诈知识语料库（来源：国家反诈中心）
 * 用于"反诈人生"体验游戏的反向科普：
 * 玩家在沉浸式被骗后，根据本次骗术特征与自身反诈意识，
 * 由 /api/educate 返回针对性的反诈知识，做到"吃一堑长一智"。
 * ---------------------------------------------------------- */

// 基础认知
const ANTI_FRAUD_BASICS = `电信诈骗是犯罪分子通过电话、网络、短信实施远程非接触式诈骗，诱骗受害人转账汇款。骗术更新速度快、花样不断翻新，不存在"天上掉馅饼"，凡是涉及转账汇款都要重点防范。`;

// 10 类高发诈骗：特征 + 一句话拆穿
const FRAUD_TYPES = [
  {
    key: "shuadan",
    name: "刷单返利类",
    keywords: ["刷单", "返利", "返佣金", "兼职", "垫付", "佣金"],
    feature: "以'兼职返佣金、轻松赚钱'为诱饵，前期小额返利获取信任，诱导大额投入后便无法提现。",
    verdict: "所有要求你先垫付资金的刷单都是诈骗！",
  },
  {
    key: "invest",
    name: "虚假网络投资理财类",
    keywords: ["投资", "理财", "内幕消息", "荐股", "大师", "高回报", "稳赚"],
    feature: "鼓吹'内幕消息、稳定高回报、零风险'，诱导加入投资群、轻信'荐股大师'。",
    verdict: "天上不会掉馅饼，所谓'内部消息'全是骗局，陌生投资平台一律不信。",
  },
  {
    key: "ecommerce",
    name: "冒充电商物流客服类",
    keywords: ["客服", "退款", "物流", "快递", "商品问题", "屏幕共享", "理赔"],
    feature: "谎称商品/物流出现问题，引导点击陌生链接、填写银行卡信息、开启屏幕共享。",
    verdict: "正规退款无需额外付费、不开屏幕共享、不点陌生链接，退款请走官方 App。",
  },
  {
    key: "loan",
    name: "虚假网络贷款类",
    keywords: ["贷款", "放贷", "无抵押", "低利息", "秒放款", "保证金", "会员费"],
    feature: "以'无抵押、低利息、秒放款'为噱头，放款前以会员费、保证金、解冻费名义收费。",
    verdict: "正规机构放贷前不收取任何费用，放款前要钱的都是诈骗。",
  },
  {
    key: "police",
    name: "冒充公检法类",
    keywords: ["公检法", "公安", "检察院", "法院", "安全账户", "通缉令", "逮捕令", "医保", "涉案"],
    feature: "冒充公检法、医保局等，以涉嫌违法为由要求转账至'安全账户'、索要验证码。",
    verdict: "公检法不会线上发文书、不存在'安全账户'，更不会要你转账自证清白。",
  },
  {
    key: "credit",
    name: "虚假征信类",
    keywords: ["征信", "校园贷", "学生账户", "注销账户", "不良记录", "刷流水"],
    feature: "以影响个人征信为由，要求消除'校园贷'记录、升级学生账户，诱导转账刷流水。",
    verdict: "个人征信由央行管理，任何人无权'消除记录'，要求转账刷流水的都是诈骗。",
  },
  {
    key: "shopping",
    name: "虚假购物服务类",
    keywords: ["低价", "代写", "私家侦探", "定位", "优惠", "特价", "私下交易"],
    feature: "以异常低价吸引交易，所谓论文代写、私家侦探、定位服务等均为骗局。",
    verdict: "交易务必选正规平台，明显低于市场价的'私下交易'十有八九是坑。",
  },
  {
    key: "impersonate",
    name: "冒充领导熟人类",
    keywords: ["领导", "老板", "老师", "亲友", "培训费", "应急", "周转"],
    feature: "冒充领导、老师、亲友，以培训费、应急周转等名义要求转账。",
    verdict: "涉及转账务必通过电话、视频等多方核实身份，绝不凭一条消息就汇款。",
  },
  {
    key: "game",
    name: "网游产品虚假交易类",
    keywords: ["游戏", "充值", "账号交易", "装备", "高价回收", "低价充值"],
    feature: "以'低价充值、高价回收账号'为诱饵，引导脱离官方平台私下交易。",
    verdict: "游戏交易一律走官方正规渠道，脱离平台的低价买卖都是诈骗。",
  },
  {
    key: "love",
    name: "婚恋交友类",
    keywords: ["交友", "恋爱", "网恋", "相亲", "对象", "感情"],
    feature: "以恋爱交友为名建立感情，随后以各种理由索要钱财。",
    verdict: "网恋有风险，任何以恋爱为名索要钱财的，务必高度警惕、及时止损。",
  },
  {
    key: "redpacket",
    name: "红包返利类",
    keywords: ["红包", "返现", "福利", "群发", "翻倍"],
    feature: "以'发红包翻倍返利、扫码领福利'为噱头，利用贪小便宜心理行骗。",
    verdict: "红包返利都是噱头，先交钱再返利的一律是诈骗。",
  },
];

// 近期高发两类骗局补充语料（来源：国家反诈中心）
// 一、电信网络诈骗（线上高发，隐蔽性强）
// 二、线下接触诈骗（多发于社区、街头，瞄准老人、未成年人等群体）
// 每条含：所属场景 scene、关键词 keywords、骗术特征 feature、针对性防骗指南 guide、一句话拆穿 verdict
const RECENT_FRAUD_TYPES = [
  {
    key: "fake_loan",
    name: "虚假贷款诈骗",
    scene: "online",
    sceneLabel: "电信网络诈骗（线上）",
    keywords: ["贷款", "放贷", "无抵押", "秒批", "不看征信", "保证金", "解冻费", "刷流水", "放款前收费"],
    feature: "以'无抵押秒批、不看征信'为诱饵，放款前以交保证金、解冻费、刷流水为由骗钱。",
    guide: "凡正规贷款放款前绝不收费；凡是放款前要你先交保证金、解冻费、刷流水的，一律是诈骗。",
    verdict: "正规贷款放款前绝不收费，凡先交钱的贷款都是诈骗。",
  },
  {
    key: "impersonate_leader",
    name: "冒充领导熟人诈骗",
    scene: "online",
    sceneLabel: "电信网络诈骗（线上）",
    keywords: ["领导", "老板", "熟人", "亲友", "代转账", "保密汇款", "急事用钱", "账号被盗"],
    feature: "盗用社交账号伪装成亲友、领导，以急事用钱、代转账、保密汇款为由催转。",
    guide: "凡涉及转账务必通过电话、视频核实身份，未确认真实身份前绝不转账。",
    verdict: "凡涉及转账务必电话、视频核实身份，未确认不转账。",
  },
  {
    key: "fake_invest_app",
    name: "虚假投资理财诈骗",
    scene: "online",
    sceneLabel: "电信网络诈骗（线上）",
    keywords: ["保本高息", "内部消息", "导师带单", "非法平台", "小额提现", "稳赚不赔", "下载 app"],
    feature: "在网络平台宣传'保本高息、内部消息、导师带单'，诱导下载非法平台，小额提现获利后大额投入即失联。",
    guide: "承诺稳赚不赔、保本高息的投资全是骗局；不下载来历不明的投资 App，不向陌生平台充值。",
    verdict: "承诺稳赚不赔的投资全是骗局。",
  },
  {
    key: "game_account_trade",
    name: "游戏账号交易诈骗",
    scene: "online",
    sceneLabel: "电信网络诈骗（线上）",
    keywords: ["游戏账号", "高价收购", "皮肤", "私下交易", "虚假链接", "钓鱼网站", "脱离平台"],
    feature: "以高价收购游戏账号/皮肤为诱饵，诱导脱离官方平台私下交易，通过虚假链接、钓鱼网站盗号或骗钱。",
    guide: "游戏交易仅走官方渠道，不扫陌生二维码、不点陌生链接、不私下转账。",
    verdict: "游戏交易仅走官方渠道，不扫陌生码、不点陌生链接、不私下转账。",
  },
  {
    key: "pension_invest",
    name: "养老投资诈骗",
    scene: "offline",
    sceneLabel: "线下接触诈骗（社区/街头）",
    keywords: ["养老项目", "国家补贴", "高额返利", "送礼品", "宣讲会", "养老投资", "老人"],
    feature: "以'养老项目、国家补贴、高额返利'为幌子，通过送礼品、开宣讲会诱导老人投钱，最终卷款跑路。",
    guide: "遇高回报养老投资多和子女商量，切勿轻信；不参加来路不明的宣讲会、不收陌生人礼品后转账。",
    verdict: "遇高回报养老投资需多和子女商量，切勿轻信，天上不会掉馅饼。",
  },
  {
    key: "street_lottery",
    name: "街头中奖赠品诈骗",
    scene: "offline",
    sceneLabel: "线下接触诈骗（社区/街头）",
    keywords: ["免费抽奖", "中奖兑换", "清仓优惠", "税费", "工本费", "运费", "街头"],
    feature: "以免费抽奖、中奖兑换、清仓优惠为名，要求缴税费、工本费、运费，实则商品廉价。",
    guide: "凡是中奖兑换要先交费（税费、工本费、运费）的一律拒绝；不贪图街头小利，不扫码不转账。",
    verdict: "凡是中奖兑换要先交费的，一律拒绝。",
  },
];

// 防骗六大守则（适合转发的核心要点）
const ANTI_FRAUD_SIX_RULES = [
  "陌生链接不点击，陌生来电不轻信；",
  "个人信息不泄露，验证码不告知他人；",
  "转账汇款多核实，涉及钱财多留心；",
  "高息回报全是坑，陌生二维码不扫；",
  "遇到可疑快求证，被骗立刻拨打110；",
  "96110反诈专线来电务必接听，反诈劝阻不要挂断。",
];

// 防诈准则
const ANTI_FRAUD_RULES = {
  fourWant: [
    "转账前务必通过电话、视频核对对方身份",
    "微信/支付宝开启'转账延迟到账'，留出反悔时间",
    "留意聊天软件自带的防诈提醒，不忽视系统警示",
    "发现可疑或亲友被骗，第一时间拨打 110",
  ],
  fourDont: [
    "不透露：短信验证码、银行卡号、身份证信息一律不说",
    "不接受：任何通缉令、逮捕令、资产冻结令都是伪造",
    "不点击：来历不明的链接、二维码不点不开",
    "不转账：绝不向所谓'安全账户'转移资产",
  ],
  fourNo: "四个'不'原则：不轻信陌生来电短信、不透露个人信息、不向陌生人转账、不参与刷单。",
};

// 反诈工具与口诀
const ANTI_FRAUD_TOOLS = `下载'国家反诈中心 APP'，开启诈骗预警功能，可自动拦截涉诈来电与短信；接到可疑电话可一键举报、快速核实。`;
const ANTI_FRAUD_RHYME = `陌生电话短信多警惕；中奖退税、暴利理财不搭理；不理不信不汇款，谨慎防骗保平安。`;

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
- 收网阶段（第10轮以后）：当你诱导对方操作"内部投资账户/转账"时，要在话术中自然暴露这类骗局的真实特征（如要求垫付、引导点链接、索要验证码、提"安全账户"等），为事后的反诈科普做铺垫，但依然以骗子的口吻说
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
 * 根据收支计算个性化财务崩塌数据，并按诈骗类型返回针对性防骗提示
 * 请求体：{ income, rent, food, creditCard, lost, fraudType? }
 * 响应： { balance, gap, tips, fraudType, fraudName }
 * ============================================================ */
app.post("/api/finance", (req, res) => {
  try {
    const {
      income = 150000, // 年收入
      rent = 3500, // 月房租
      food = 2000, // 月伙食费
      creditCard = 1500, // 信用卡月还款
      lost = 5000, // 本次被骗金额
      fraudType, // 本次骗术类型 key（可选）
    } = req.body || {};

    const monthlyIncome = Math.round(Number(income) / 12); // 月收入
    const monthlyExpense = Number(rent) + Number(food) + Number(creditCard); // 月固定支出

    // 被骗后账户余额 = 月收入 - 月固定支出 - 被骗金额
    const balance = monthlyIncome - monthlyExpense - Number(lost);

    // 资金缺口：余额为负时的绝对值，否则为 0
    const gap = balance < 0 ? Math.abs(balance) : 0;

    // 找到本次对应的诈骗类型（含近期高发 6 类）
    const fraud = ALL_FRAUD_TYPES.find((f) => f.key === fraudType) || null;
    const fraudName = fraud ? fraud.name : "刷单返利类（默认）";

    // 建议文案：先给"四不"基础准则，再给该类型的拆穿结论
    const base =
      gap > 0
        ? `你本月已入不敷出，资金缺口 ${gap} 元。`
        : `这次损失 ${lost} 元虽在可承受范围，但已挤占正常生活开支。`;
    const verdict = fraud
      ? fraud.verdict
      : "所有要求你先垫付资金的刷单都是诈骗！";
    const tips = `${base} ${verdict} 记住四个"不"原则：不轻信陌生来电短信、不透露个人信息、不向陌生人转账、不参与刷单。如遇可疑，拨打 96110 反诈专线核实。`;

    return res.json({ balance, gap, tips, fraudType: fraud ? fraud.key : "shuadan", fraudName });
  } catch (err) {
    console.error("[/api/finance] 计算失败：", err && err.message);
    return res.status(500).json({ error: "财务数据计算失败" });
  }
});

/* ============================================================
 * 接口 d：POST /api/educate
 * 根据对话文本 / 指定类型，返回针对性的反诈知识语料，
 * 实现"针对不同用户反诈意识"的差异化科普。
 * 请求体：{ text?, type?, awareness? }
 *   text     —— 对话文本，自动匹配最相关的诈骗类型
 *   type     —— 直接指定诈骗类型 key（如 invest / police）
 *   awareness—— 用户反诈意识档位：low / mid / high（影响科普深度）
 * 响应： { matchedType, knowledge:{...} }
 * ============================================================ */
// 合并全部诈骗类型（基础 11 类 + 近期高发 6 类），供匹配与枚举使用
const ALL_FRAUD_TYPES = FRAUD_TYPES.concat(RECENT_FRAUD_TYPES);

app.post("/api/educate", (req, res) => {
  try {
    const { text = "", type, awareness = "mid" } = req.body || {};

    // 1) 确定诈骗类型：优先用指定 type，否则根据关键词从对话文本匹配
    let matched = type ? ALL_FRAUD_TYPES.find((f) => f.key === type) : null;
    if (!matched && text) {
      let best = null;
      let bestHit = 0;
      for (const f of ALL_FRAUD_TYPES) {
        const hit = f.keywords.filter((kw) => text.includes(kw)).length;
        if (hit > bestHit) {
          bestHit = hit;
          best = f;
        }
      }
      matched = best; // 可能为 null（未命中任何关键词）
    }
    // 兜底默认：刷单返利（最常见）
    if (!matched) matched = FRAUD_TYPES[0];

    // 2) 根据 awareness 档位组装差异化科普内容
    const basics = ANTI_FRAUD_BASICS;
    const rhyme = ANTI_FRAUD_RHYME;
    const tools = ANTI_FRAUD_TOOLS;
    const sixRules = ANTI_FRAUD_SIX_RULES;

    // 针对性防骗指南（近期高发骗局才带 guide 字段）
    const guide = matched.guide || null;
    const sceneLabel = matched.sceneLabel || null;

    let detail;
    if (awareness === "low") {
      // 反诈意识较弱：用最直白的一句话结论 + 针对性指南 + 口诀，降低认知负担
      detail = {
        level: "入门提醒",
        sceneLabel,
        feature: matched.feature,
        guide,
        verdict: matched.verdict,
        rhyme,
        tools,
      };
    } else if (awareness === "high") {
      // 反诈意识较强：给出完整四要四不要 + 四不原则 + 六大守则，便于传播给他人
      detail = {
        level: "进阶科普",
        sceneLabel,
        feature: matched.feature,
        guide,
        verdict: matched.verdict,
        fourWant: ANTI_FRAUD_RULES.fourWant,
        fourDont: ANTI_FRAUD_RULES.fourDont,
        fourNo: ANTI_FRAUD_RULES.fourNo,
        sixRules,
        rhyme,
        tools,
        basics,
      };
    } else {
      // 默认 mid：骗术特征 + 针对性指南 + 拆穿结论 + 四不原则 + 口诀
      detail = {
        level: "标准科普",
        sceneLabel,
        feature: matched.feature,
        guide,
        verdict: matched.verdict,
        fourNo: ANTI_FRAUD_RULES.fourNo,
        rhyme,
        tools,
      };
    }

    return res.json({
      matchedType: matched.key,
      matchedName: matched.name,
      allTypes: ALL_FRAUD_TYPES.map((f) => ({ key: f.key, name: f.name })),
      knowledge: detail,
      source: "国家反诈中心",
    });
  } catch (err) {
    console.error("[/api/educate] 生成反诈知识失败：", err && err.message);
    return res.status(500).json({ error: "反诈知识生成失败" });
  }
});

/* ============================================================
 * 接口 e：POST /api/guide
 * 针对近期高发的两类骗局（线上电信 + 线下接触），返回
 * 针对性防骗指南，以及适合转发的短图文文案。
 * 请求体：{ type? }  —— 指定骗局 key（fake_loan / pension_invest ...）
 *                           不传则返回全部近期高发骗局指南 + 六大守则
 * 响应： { online:[...], offline:[...], sixRules:[...], share:[...] }
 * ============================================================ */
app.post("/api/guide", (req, res) => {
  try {
    const { type } = req.body || {};
    const list = type
      ? RECENT_FRAUD_TYPES.filter((f) => f.key === type)
      : RECENT_FRAUD_TYPES;

    const toItem = (f) => ({
      key: f.key,
      name: f.name,
      scene: f.scene,
      sceneLabel: f.sceneLabel,
      feature: f.feature,
      guide: f.guide,
      verdict: f.verdict,
      // 适合转发的短图文文案（每条一行，便于截图/群发）
      share: [
        `【防骗提醒·${f.name}】`,
        f.feature,
        "🔰 防骗指南：" + f.guide,
        "❌ 一句话拆穿：" + f.verdict,
        "📞 被骗立刻拨打 110；96110 反诈专线来电务必接听。",
      ],
    });

    const online = list.filter((f) => f.scene === "online").map(toItem);
    const offline = list.filter((f) => f.scene === "offline").map(toItem);

    // 通用可转发短图文：六大守则
    const sixRules = ANTI_FRAUD_SIX_RULES;
    const share = [
      "🛡 全民反诈 · 防骗六大守则",
      ...sixRules,
      "📲 下载国家反诈中心 APP，开启诈骗预警；接到 96110 来电务必接听。",
      "内容来源：国家反诈中心",
    ];

    return res.json({
      online,
      offline,
      sixRules,
      share,
      source: "国家反诈中心",
    });
  } catch (err) {
    console.error("[/api/guide] 生成防骗指南失败：", err && err.message);
    return res.status(500).json({ error: "防骗指南生成失败" });
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
