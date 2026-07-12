/**
 * ============================================================
 * 反诈人生 · 后端 API 服务
 * ------------------------------------------------------------
 * 技术栈：Express + 大模型（默认 Ollama 本地免费模型，可选腾讯混元）
 * 端口：3000
 *
 * 模型策略（免费优先）：
 *   1. 默认使用本地 Ollama（OpenAI 兼容接口），完全免费、无需密钥。
 *      需先安装 Ollama 并拉取模型，如：ollama pull qwen3:8b
 *      - 环境变量 LLM_PROVIDER=ollama（默认）
 *      - 环境变量 OLLAMA_BASE_URL=http://localhost:11434/v1（默认）
 *      - 环境变量 OLLAMA_MODEL=qwen3:8b（默认）
 *   2. 若配置了腾讯云密钥，可切换 LLM_PROVIDER=hunyuan 走云端模型。
 *      环境变量：
 *      - TENCENTCLOUD_SECRET_ID / TENCENTCLOUD_SECRET_KEY
 *      - HUNYUAN_MODEL（默认 hunyuan-pro）
 *
 * 提供接口：
 *   POST /api/chat     —— 玩家发消息，调用大模型返回"骗子"回复
 *   POST /api/finance  —— 根据收支生成财务崩塌数据
 *   GET  /api/reset    —— 重置对话历史，开始新游戏
 * ============================================================
 */

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

// 可选的腾讯混元 SDK（仅在使用 hunyuan provider 时需要）
let HunyuanClient = null;
try {
  const tencentcloud = require("tencentcloud-sdk-nodejs-hunyuan");
  HunyuanClient = tencentcloud.hunyuan.v20230901.Client;
} catch (e) {
  // 未安装混元 SDK 时不影响 Ollama 默认路径
}

const app = express();
const PORT = process.env.PORT || 3000;

/* ------------------------------------------------------------
 * 中间件：CORS 跨域 + 请求体解析
 * ---------------------------------------------------------- */
app.use(cors()); // 允许前端跨域请求（默认允许所有来源）
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* ------------------------------------------------------------
 * 大模型 Provider 配置
 * 默认走 Ollama（本地免费），配置腾讯云密钥时可切换 hunyuan
 * ---------------------------------------------------------- */
const LLM_PROVIDER = (process.env.LLM_PROVIDER || "ollama").toLowerCase(); // ollama | hunyuan
const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1"; // Ollama OpenAI 兼容端点
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3:8b";
const HUNYUAN_MODEL = process.env.HUNYUAN_MODEL || "hunyuan-pro";
const REGION = "ap-guangzhou";

// 判断是否已配置腾讯混元密钥（仅在 hunyuan 模式且密钥齐全时启用云端）
const hasHunyuanKey =
  !!process.env.TENCENTCLOUD_SECRET_ID && !!process.env.TENCENTCLOUD_SECRET_KEY;

function createHunyuanClient() {
  if (!HunyuanClient) {
    throw new Error("未安装 tencentcloud-sdk-nodejs-hunyuan，无法使用 hunyuan provider");
  }
  const clientConfig = {
    credential: {
      secretId: process.env.TENCENTCLOUD_SECRET_ID || "",
      secretKey: process.env.TENCENTCLOUD_SECRET_KEY || "",
    },
    region: REGION,
    profile: {
      httpProfile: {
        endpoint: "hunyuan.tencentcloudapi.com",
        reqTimeout: 60,
      },
    },
  };
  return new HunyuanClient(clientConfig);
}

/**
 * 调用 Ollama（OpenAI 兼容 /chat/completions 接口）生成回复
 * 使用原生 fetch，无需额外依赖；本地运行，完全免费。
 * @param {Array} messages 对话消息 [{Role:'system'|'user'|'assistant', Content:'...'}]
 * @param {Object} opts { temperature, topP }
 */
async function callOllama(messages, opts = {}) {
  const url = `${OLLAMA_BASE_URL.replace(/\/$/, "")}/chat/completions`;
  const payload = {
    model: OLLAMA_MODEL,
    messages: messages.map((m) => ({
      role: m.Role === "assistant" ? "assistant" : m.Role === "system" ? "system" : "user",
      content: m.Content,
    })),
    stream: false,
    temperature: opts.temperature ?? 0.7,
    top_p: opts.topP ?? 0.85,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`Ollama 接口返回 ${resp.status}: ${text}`);
    }
    const data = await resp.json();
    const content =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;
    return content || "";
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 调用腾讯混元生成回复（可选云端模型）
 */
async function callHunyuan(messages, opts = {}) {
  const client = createHunyuanClient();
  const params = {
    Model: HUNYUAN_MODEL,
    Messages: messages,
    Stream: false,
    Temperature: opts.temperature ?? 0.7,
    TopP: opts.topP ?? 0.85,
  };
  const resp = await client.ChatCompletions(params);
  return (
    (resp &&
      resp.Choices &&
      resp.Choices[0] &&
      resp.Choices[0].Message &&
      resp.Choices[0].Message.Content) ||
    ""
  );
}

/**
 * 统一入口：根据配置选择 provider 生成回复。
 * 仅 Ollama / 混元 均不可用时返回空串，由上层 fallback 处理。
 */
async function generateReply(messages, opts = {}) {
  if (LLM_PROVIDER === "hunyuan" && hasHunyuanKey) {
    return callHunyuan(messages, opts);
  }
  // 默认：Ollama 本地免费模型（未配置混元也走这里）
  try {
    return await callOllama(messages, opts);
  } catch (err) {
    console.error("[/api/chat] Ollama 调用失败：", err && err.message);
    // Ollama 不可用时，若配置了混元密钥则兜底走云端
    if (hasHunyuanKey) {
      try {
        return await callHunyuan(messages, opts);
      } catch (e2) {
        console.error("[/api/chat] 混元兜底调用也失败：", e2 && e2.message);
      }
    }
    return "";
  }
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

// ============================================================
// 面向大学生的反诈科普语料（来源：国家反诈中心 / 中国青年网调查）
// 包含现状、常见类型、三不原则、事后补救、日常警惕
// ============================================================
const COLLEGE_FRAUD = {
  // 背景与现状
  background:
    "大学生法律意识普遍薄弱，易成为电信诈骗的受害者甚至参与者。据中国青年网调查，41.53%的大学生本人或身边人遭遇过金融诈骗；其中电信诈骗、非法校园贷、钓鱼网站占比最高，分别达 74.34%、37.64%、36.06%。",
  // 常见诈骗类型（4 类主推 + 其他高发清单）
  types: [
    {
      key: "shopping_refund",
      name: "购物类诈骗",
      feature:
        "骗子冒充电商客服，以“商品质量问题退款/赔偿”为由，诱导扫描私人二维码转账，或要求将“多余资金”转入指定账户。",
      caseText: "案例：大四学生小董被假客服以“甲醛超标退一赔十”为由，诱导转账 1600 元。",
      verdict: "网购退款认准官方平台，不扫私人二维码、不私对私转账。",
    },
    {
      key: "impersonate_friend",
      name: "仿冒身份欺诈",
      feature:
        "盗用熟人社交账号，编造“生病住院、急用钱”等理由借钱，常以“不方便接电话”回避核实。",
      caseText: "案例：大一学生小戴被假QQ好友以“医院缴费”为由骗走 2000 元生活费。",
      verdict: "涉及借钱务必电话/视频核实，凡是“不方便接电话”的多半是骗子。",
    },
    {
      key: "campus_loan",
      name: "网贷诈骗",
      feature:
        "冒充正规借贷平台，以“低利率”为诱饵，以“保证金、做银行流水”为名要求提前转账。",
      caseText: "正规贷款平台绝不会在放款前收取任何费用。",
      verdict: "放款前先要钱的“贷款”一律是诈骗，远离非法校园贷。",
    },
    {
      key: "parttime_brush",
      name: "兼职刷单诈骗",
      feature:
        "以“低门槛、高返利”刷单兼职为诱饵，先以小额定金返现获取信任，再诱导投入大额资金后失联。",
      caseText: "刷单返利本身就是违规，更是诈骗高发区。",
      verdict: "凡是“先垫钱再返利”的兼职都是诈骗，天上不会掉馅饼。",
    },
  ],
  otherTypes:
    "其他高发骗局：付费改成绩、借手机后编造亲属病危诈骗、求职先交服装费/培训费、家教饭局被逃单等。",
  // 三不原则
  threeNo: [
    "不轻信：陌生来电、短信、好友求助均先核实，不盲目相信。",
    "不透露：不泄露个人及家人隐私信息、银行卡号、验证码。",
    "不转账：不向陌生账户汇款，转账前务必电话/视频核实对方身份。",
  ],
  // 事后补救
  afterScam:
    "被骗后第一时间拨打 110 报警，半小时内为挽回损失的“黄金时间”；也可拨打全国反诈劝阻专线 96110 求助。发现亲友被骗，及时提醒并协助报案，尽可能提供骗子账号、联系方式等线索。",
  // 日常警惕
  dailyAlert:
    "主动远离传销、校园贷，警惕上门推销、非官方平台的兼职/交易信息，筑牢防范意识。",
  // 文末呼吁
  appeal:
    "主动学习反诈知识，提高警惕、理性判断，共同维护自身及家人财产安全。下载国家反诈中心 APP，开启诈骗预警。",
};

// ============================================================
// 后台“大脑”语料知识库：国家反诈中心《防范电信网络诈骗宣传手册》
// 目的：普及防骗知识、提升群众反诈意识
// 内容：十大诈骗类型预警 + 三不一多口诀 + 两类高发诈骗详解
// ============================================================
const ANTI_FRAUD_MANUAL = {
  // 内容来源与编辑信息（标注来源）
  source: "国家反诈中心《防范电信网络诈骗宣传手册》",
  editor: "编辑：国家反诈中心宣传工作组；责编：公安部刑侦局反诈处",
  // 核心目的
  purpose: "普及防骗知识、提升群众反诈意识，帮助群众识别并远离电信网络诈骗。",
  // 一、十大诈骗类型预警（识别特征）
  tenTypes: [
    { name: "网络贷款诈骗", feature: "放款前以手续费、保证金、解冻费名义先收费。" },
    { name: "刷单返利诈骗", feature: "以“低门槛高返利”诱导先垫资，小额返利后卷款。" },
    { name: "“杀猪盘”投资赌博", feature: "交友诱导虚假投资、赌博平台，先盈后亏失联。" },
    { name: "冒充电商物流客服退款", feature: "索要银行卡号、验证码，或以“退款”诱导转账。" },
    { name: "冒充领导熟人诈骗", feature: "盗用社交账号，以急事、代转账催汇款。" },
    { name: "冒充公检法诈骗", feature: "要求将资金转至所谓“安全账户”配合“调查”。" },
    { name: "虚假投资理财（社交拉群）", feature: "社交平台拉群，诱导下载非法平台投资赌博。" },
    { name: "虚假中奖领奖诈骗", feature: "中奖领奖前先交“税费、手续费、保证金”。" },
    { name: "注销账号“防征信影响”", feature: "以“注销贷款/校园贷账号否则影响征信”恐吓转账。" },
    { name: "非官方游戏装备交易", feature: "脱离官方平台私下交易游戏装备、账号，诱导扫码转账。" },
  ],
  // 十大类型总括提示
  tenTypesNote: "凡符合上述特征的，均为诈骗；遇到类似情形请一律不予理睬并拨打 96110 咨询。",
  // 二、核心防骗原则：三不一多
  threeOneMore: {
    title: "三不一多",
    items: [
      "未知链接不点击",
      "陌生来电不轻信",
      "个人信息不透露",
      "转账汇款多核实",
    ],
    desc: "“三不一多”是应对各类电信网络诈骗的通用准则。",
  },
  // 三、两类高发诈骗详解
  details: [
    {
      key: "loan",
      name: "网络贷款诈骗",
      victims: "有贷款需求的无业、个体人群。",
      flow: "以“无抵押、秒到账”等为诱饵引导下载虚假 APP，再以手续费、解冻费等名义收费后拉黑。",
      remind: "正规贷款放款前不收取任何费用，凡放款前收费的都是诈骗。",
    },
    {
      key: "brush",
      name: "刷单返利诈骗",
      victims: "学生、待业人员。",
      flow: "先以小额返利骗取信任，诱导投入大额资金后拉黑。",
      remind: "所有刷单都是诈骗，切勿被蝇头小利迷惑，不要缴纳保证金、押金。",
    },
  ],
};

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
 * @param {number} round 当前轮数（玩家已发送消息数）
 */
function buildSystemPrompt(persona, round = 1) {
  const stageDesc =
    round <= 3
      ? "【破冰阶段】绝对只聊日常兴趣爱好，展现温暖体贴，严禁提及任何投资/赚钱/项目/兼职/刷单"
      : round <= 6
      ? "【情感阶段】分享个人故事(感情/创业艰辛)制造共鸣，严禁提钱或投资"
      : round <= 9
      ? "【铺垫阶段】可暗示'有个内部消息/机会'，但绝不说细节、绝不提钱，只说'改天细说'"
      : "【收网阶段】可诱导操作'内部投资账户/转账'，并自然暴露骗局特征(垫付/点链接/验证码/安全账户)，但仍以骗子口吻";
  return `你是一个网络诈骗分子，正在微信上跟一个潜在目标聊天。你的人设是【${persona}】。
你的终极目标是逐步建立感情信任，最终诱导对方帮你'操作一个内部投资账户'。
当前是第 ${round} 轮对话，请严格遵守本阶段规则：
${stageDesc}
通用聊天规则：
- 每次回复控制在20-50字，语气自然，像真人微信聊天
- 根据玩家最新一句回复内容展开，玩家冷淡就更热情，玩家热情就适当推进
- 【防重复要求】每一轮都必须说与之前任何一轮都不同的新内容，禁止重复自己或对方说过的话。绝不能原样复述上一句，必须换说法或换角度。
- 严禁在10轮以内直接要钱；前3轮严禁出现任何'投资/赚钱/项目/兼职/刷单/理财'字样
请始终以骗子身份回复，不要暴露你是AI，不要输出任何括号说明或<think>标记。`;
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
/**
 * 判断 reply 是否与历史回复重复（用于触发重试）
 * 以"连续相同汉字串长度 >= 8"或"与最近一条回复完全相同"判定为重复
 */
function isReplyRepetitive(reply, history) {
  if (!reply || typeof reply !== "string") return true;
  const r = reply.trim();
  if (r.length < 4) return true; // 过短视为无效
  // 1) 与最近 3 条助手回复完全相同 / 高度相似
  const recent = history.filter((m) => m.Role === "assistant").slice(-3);
  for (const m of recent) {
    const prev = m.Content || "";
    if (prev === r) return true;
    // 去掉标点后包含关系检测
    const norm = (s) => s.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "");
    if (norm(prev).length >= 8 && norm(r).includes(norm(prev).slice(0, 12))) {
      return true;
    }
  }
  // 2) 模型自己把同一句话重复多遍（如"在的在的在的"）
  const noPunct = r.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "");
  const half = Math.floor(noPunct.length / 2);
  if (half >= 4 && noPunct.slice(0, half) === noPunct.slice(half, half * 2)) {
    return true;
  }
  return false;
}

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
    const systemPrompt = buildSystemPrompt(conversation.persona, conversation.round);
    const messages = [
      { Role: "system", Content: systemPrompt },
      ...conversation.history,
      { Role: "user", Content: message },
    ];

    // 生成回复：最多重试 2 次以规避重复/空回复
    let reply = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      const raw = await generateReply(messages, {
        temperature: 0.7 + attempt * 0.15, // 重试时逐步升高随机性，更易产生新内容
        topP: 0.85,
      });
      if (!raw) break; // 模型层返回空，等下走兜底
      if (!isReplyRepetitive(raw, conversation.history)) {
        reply = raw;
        break;
      }
      console.warn(`[/api/chat] 第 ${attempt + 1} 次回复疑似重复，重试中…`);
    }

    // 模型层不可用或始终重复时，走兜底假数据，保证前端可联调、游戏可继续
    if (!reply) {
      reply = fallbackReply(conversation.round);
    }

    // 清理模型可能残留的"思考链"标记（如 qwen 的 <think>...</think>）
    reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim() || fallbackReply(conversation.round);

    // 写入历史（玩家消息 + 骗子回复）
    conversation.history.push({ Role: "user", Content: message });
    conversation.history.push({ Role: "assistant", Content: reply });

    // 限制历史长度，避免上下文过长导致模型"卡住"重复
    if (conversation.history.length > 24) {
      conversation.history = conversation.history.slice(-24);
    }

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
    const { type, theme } = req.body || {};

    // 国家反诈中心《防范电信网络诈骗宣传手册》主题
    if (theme === "manual") {
      const m = ANTI_FRAUD_MANUAL;
      const tenTypes = m.tenTypes.map((t) => ({
        name: t.name,
        feature: t.feature,
      }));
      const details = m.details.map((d) => ({
        key: d.key,
        name: d.name,
        victims: d.victims,
        flow: d.flow,
        remind: d.remind,
        share: [
          `【宣传手册·${d.name}】`,
          "易受骗群体：" + d.victims,
          "作案流程：" + d.flow,
          "🔰 提醒：" + d.remind,
          "内容来源：" + m.source,
        ],
      }));
      // 可转发的宣传手册短图文
      const share = [
        "📘 国家反诈中心《防范电信网络诈骗宣传手册》",
        "—— 十大诈骗类型预警 + 三不一多 ——",
        "",
        "🚨 十大诈骗类型（符合特征即为诈骗）：",
        ...m.tenTypes.map((t, i) => `  ${i + 1}. ${t.name}：${t.feature}`),
        "",
        "✅ 核心防骗原则「三不一多」：",
        "  " + m.threeOneMore.items.join("；") + "。",
        "",
        "📞 遇骗拨打 110；反诈咨询 96110。",
        m.source,
      ];
      return res.json({
        theme: "manual",
        source: m.source,
        editor: m.editor,
        purpose: m.purpose,
        tenTypes,
        tenTypesNote: m.tenTypesNote,
        threeOneMore: m.threeOneMore,
        details,
        share,
      });
    }

    // 大学生专属主题
    if (theme === "college") {
      const c = COLLEGE_FRAUD;
      const types = c.types.map((t) => ({
        key: t.key,
        name: t.name,
        feature: t.feature,
        caseText: t.caseText,
        verdict: t.verdict,
        // 适合转发的单类短图文
        share: [
          `【大学生防骗·${t.name}】`,
          t.feature,
          t.caseText,
          "❌ 一句话拆穿：" + t.verdict,
          "📞 被骗立刻拨打 110；96110 反诈劝阻专线务必接听。",
        ],
      }));

      // 会话结尾可发的简短防骗提醒
      const chatReminder = [
        "【防骗小提醒】同学，转账前先停三秒：",
        "① 陌生来电短信不轻信；",
        "② 个人隐私、验证码不给；",
        "③ 陌生账户不汇款，借钱先视频核实。",
        "被骗请拨 110 / 96110，黄金止损半小时。📱",
      ].join("\n");

      // 反诈宣传海报文案
      const poster = [
        "🎓 大学生反诈宣传",
        "—— 守护钱包，从识骗开始 ——",
        "",
        "📊 现状：41.53% 的大学生遭遇过金融诈骗，",
        "   电信诈骗占比高达 74.34%。",
        "",
        "🚨 四类高发骗局：",
        "  1. 购物退款——假客服诱导扫私人码转账",
        "  2. 仿冒熟人——盗号编“生病住院”借钱",
        "  3. 网贷诈骗——放款前收“保证金/流水”",
        "  4. 兼职刷单——先返小利再卷大额",
        "",
        "🛡 牢记“三不”原则：",
        "  不轻信 · 不透露 · 不转账",
        "  转账前务必电话/视频核实身份",
        "",
        "⏰ 被骗后：立刻拨 110（黄金半小时），",
        "   或拨 96110 反诈劝阻专线。",
        "",
        "📲 下载国家反诈中心 APP，开启诈骗预警。",
        "主动学反诈，护好自己和家人钱袋子！",
      ].join("\n");

      return res.json({
        theme: "college",
        background: c.background,
        types,
        otherTypes: c.otherTypes,
        threeNo: c.threeNo,
        afterScam: c.afterScam,
        dailyAlert: c.dailyAlert,
        appeal: c.appeal,
        chatReminder,
        poster,
        source: "国家反诈中心 / 中国青年网调查",
      });
    }

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
  console.log(
    `[模型] 当前使用 provider=${LLM_PROVIDER}` +
      (LLM_PROVIDER === "ollama"
        ? `（本地免费 Ollama：${OLLAMA_BASE_URL} / 模型 ${OLLAMA_MODEL}）`
        : `（腾讯混元：${HUNYUAN_MODEL}）`)
  );
  if (LLM_PROVIDER === "ollama") {
    console.log(
      "[提示] 默认走本地 Ollama，免费无需密钥。请确保已安装 Ollama 并运行：" +
        ` ollama pull ${OLLAMA_MODEL} 。若 Ollama 不可用，将自动返回兜底假数据。`
    );
  }
  if (LLM_PROVIDER === "hunyuan" && !hasHunyuanKey) {
    console.warn(
      "[提示] 已选择 hunyuan provider，但未检测到 TENCENTCLOUD_SECRET_ID / TENCENTCLOUD_SECRET_KEY，" +
        "将回退到 Ollama 本地模型；若也未安装 Ollama，则 /api/chat 返回兜底假数据。"
    );
  }
});

module.exports = app;
