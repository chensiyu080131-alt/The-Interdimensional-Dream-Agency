/**
 * ============================================================
 * 异次元梦想局 · 后端 API 服务
 * ------------------------------------------------------------
 * 技术栈：Express + OpenAI 兼容接口（混元大模型）
 * 端口：3000
 *
 * 提供接口：
 *   POST /api/chat        —— 基础对话（保留兼容）
 *   POST /api/game-chat   —— 游戏上下文对话（身份+状态+历史）
 *   POST /api/chat/stream —— 流式对话（SSE）
 *   POST /api/finance     —— 财务崩塌数据
 *   POST /api/educate     —— 反诈知识科普
 *   POST /api/guide       —— 防骗指南
 *   GET  /api/reset       —— 重置对话
 *   GET  /                —— 健康检查
 * ============================================================
 */

require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

/* ------------------------------------------------------------
 * 中间件
 * ---------------------------------------------------------- */
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* ------------------------------------------------------------
 * 静态托管前端（同域部署：一个进程同时服务游戏页面与 API）
 * 部署到大陆节点后，浏览器从同源加载前端、调用 /api/tts，
 * 后端（大陆 IP）直连 stepfun 合成 stepaudio，无 451 / 无跨域。
 * 须在 API / 健康检查路由之前注册，确保 / 与静态资源优先命中。
 * ---------------------------------------------------------- */
const path = require("path");
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
app.use(express.static(FRONTEND_DIR));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"), (err) => {
    if (err) res.status(404).send("前端资源未找到，请确认 frontend 目录与 backend 同级部署。");
  });
});

/* ------------------------------------------------------------
 * 混元大模型客户端（OpenAI 兼容接口）
 * ---------------------------------------------------------- */
const HUNYUAN_API_KEY = process.env.HUNYUAN_API_KEY || "";
const HUNYUAN_BASE_URL = process.env.HUNYUAN_BASE_URL || "https://api.hunyuan.cloud.tencent.com/v1/";
const HUNYUAN_MODEL = process.env.HUNYUAN_MODEL || "hunyuan-turbos-latest";

function isApiKeyValid(key) {
  return key && key.length > 20 && !key.includes("your-api-key") && !key.includes("placeholder");
}

let openai = null;
function getOpenAI() {
  if (!openai && isApiKeyValid(HUNYUAN_API_KEY)) {
    openai = new OpenAI({
      apiKey: HUNYUAN_API_KEY,
      baseURL: HUNYUAN_BASE_URL,
    });
  }
  return openai;
}

/* ============================================================
 * 反诈知识语料库（来源：国家反诈中心）
 * ============================================================ */

const ANTI_FRAUD_BASICS = `电信诈骗是犯罪分子通过电话、网络、短信实施远程非接触式诈骗，诱骗受害人转账汇款。骗术更新速度快、花样不断翻新，不存在"天上掉馅饼"，凡是涉及转账汇款都要重点防范。`;

const FRAUD_TYPES = [
  { key: "shuadan", name: "刷单返利类", keywords: ["刷单","返利","返佣金","兼职","垫付","佣金"], feature: "以'兼职返佣金、轻松赚钱'为诱饵，前期小额返利获取信任，诱导大额投入后便无法提现。", verdict: "所有要求你先垫付资金的刷单都是诈骗！" },
  { key: "invest", name: "虚假网络投资理财类", keywords: ["投资","理财","内幕消息","荐股","大师","高回报","稳赚"], feature: "鼓吹'内幕消息、稳定高回报、零风险'，诱导加入投资群、轻信'荐股大师'。", verdict: "天上不会掉馅饼，所谓'内部消息'全是骗局，陌生投资平台一律不信。" },
  { key: "ecommerce", name: "冒充电商物流客服类", keywords: ["客服","退款","物流","快递","商品问题","屏幕共享","理赔"], feature: "谎称商品/物流出现问题，引导点击陌生链接、填写银行卡信息、开启屏幕共享。", verdict: "正规退款无需额外付费、不开屏幕共享、不点陌生链接，退款请走官方 App。" },
  { key: "loan", name: "虚假网络贷款类", keywords: ["贷款","放贷","无抵押","低利息","秒放款","保证金","会员费"], feature: "以'无抵押、低利息、秒放款'为噱头，放款前以会员费、保证金、解冻费名义收费。", verdict: "正规机构放贷前不收取任何费用，放款前要钱的都是诈骗。" },
  { key: "police", name: "冒充公检法类", keywords: ["公检法","公安","检察院","法院","安全账户","通缉令","逮捕令","医保","涉案"], feature: "冒充公检法、医保局等，以涉嫌违法为由要求转账至'安全账户'、索要验证码。", verdict: "公检法不会线上发文书、不存在'安全账户'，更不会要你转账自证清白。" },
  { key: "credit", name: "虚假征信类", keywords: ["征信","校园贷","学生账户","注销账户","不良记录","刷流水"], feature: "以影响个人征信为由，要求消除'校园贷'记录、升级学生账户，诱导转账刷流水。", verdict: "个人征信由央行管理，任何人无权'消除记录'，要求转账刷流水的都是诈骗。" },
  { key: "shopping", name: "虚假购物服务类", keywords: ["低价","代写","私家侦探","定位","优惠","特价","私下交易"], feature: "以异常低价吸引交易，所谓论文代写、私家侦探、定位服务等均为骗局。", verdict: "交易务必选正规平台，明显低于市场价的'私下交易'十有八九是坑。" },
  { key: "impersonate", name: "冒充领导熟人类", keywords: ["领导","老板","老师","亲友","培训费","应急","周转"], feature: "冒充领导、老师、亲友，以培训费、应急周转等名义要求转账。", verdict: "涉及转账务必通过电话、视频等多方核实身份，绝不凭一条消息就汇款。" },
  { key: "game", name: "网游产品虚假交易类", keywords: ["游戏","充值","账号交易","装备","高价回收","低价充值"], feature: "以'低价充值、高价回收账号'为诱饵，引导脱离官方平台私下交易。", verdict: "游戏交易一律走官方正规渠道，脱离平台的低价买卖都是诈骗。" },
  { key: "love", name: "婚恋交友类", keywords: ["交友","恋爱","网恋","相亲","对象","感情"], feature: "以恋爱交友为名建立感情，随后以各种理由索要钱财。", verdict: "网恋有风险，任何以恋爱为名索要钱财的，务必高度警惕、及时止损。" },
  { key: "redpacket", name: "红包返利类", keywords: ["红包","返现","福利","群发","翻倍"], feature: "以'发红包翻倍返利、扫码领福利'为噱头，利用贪小便宜心理行骗。", verdict: "红包返利都是噱头，先交钱再返利的一律是诈骗。" },
];

const RECENT_FRAUD_TYPES = [
  { key: "fake_loan", name: "虚假贷款诈骗", scene: "online", sceneLabel: "电信网络诈骗（线上）", keywords: ["贷款","放贷","无抵押","秒批","不看征信","保证金","解冻费","刷流水","放款前收费"], feature: "以'无抵押秒批、不看征信'为诱饵，放款前以交保证金、解冻费、刷流水为由骗钱。", guide: "凡正规贷款放款前绝不收费；凡是放款前要你先交保证金、解冻费、刷流水的，一律是诈骗。", verdict: "正规贷款放款前绝不收费，凡先交钱的贷款都是诈骗。" },
  { key: "impersonate_leader", name: "冒充领导熟人诈骗", scene: "online", sceneLabel: "电信网络诈骗（线上）", keywords: ["领导","老板","熟人","亲友","代转账","保密汇款","急事用钱","账号被盗"], feature: "盗用社交账号伪装成亲友、领导，以急事用钱、代转账、保密汇款为由催转。", guide: "凡涉及转账务必通过电话、视频核实身份，未确认真实身份前绝不转账。", verdict: "凡涉及转账务必电话、视频核实身份，未确认不转账。" },
  { key: "fake_invest_app", name: "虚假投资理财诈骗", scene: "online", sceneLabel: "电信网络诈骗（线上）", keywords: ["保本高息","内部消息","导师带单","非法平台","小额提现","稳赚不赔","下载 app"], feature: "在网络平台宣传'保本高息、内部消息、导师带单'，诱导下载非法平台，小额提现获利后大额投入即失联。", guide: "承诺稳赚不赔、保本高息的投资全是骗局；不下载来历不明的投资 App，不向陌生平台充值。", verdict: "承诺稳赚不赔的投资全是骗局。" },
  { key: "game_account_trade", name: "游戏账号交易诈骗", scene: "online", sceneLabel: "电信网络诈骗（线上）", keywords: ["游戏账号","高价收购","皮肤","私下交易","虚假链接","钓鱼网站","脱离平台"], feature: "以高价收购游戏账号/皮肤为诱饵，诱导脱离官方平台私下交易，通过虚假链接、钓鱼网站盗号或骗钱。", guide: "游戏交易仅走官方渠道，不扫陌生二维码、不点陌生链接、不私下转账。", verdict: "游戏交易仅走官方渠道，不扫陌生码、不点陌生链接、不私下转账。" },
  { key: "pension_invest", name: "养老投资诈骗", scene: "offline", sceneLabel: "线下接触诈骗（社区/街头）", keywords: ["养老项目","国家补贴","高额返利","送礼品","宣讲会","养老投资","老人"], feature: "以'养老项目、国家补贴、高额返利'为幌子，通过送礼品、开宣讲会诱导老人投钱，最终卷款跑路。", guide: "遇高回报养老投资多和子女商量，切勿轻信；不参加来路不明的宣讲会、不收陌生人礼品后转账。", verdict: "遇高回报养老投资需多和子女商量，切勿轻信，天上不会掉馅饼。" },
  { key: "street_lottery", name: "街头中奖赠品诈骗", scene: "offline", sceneLabel: "线下接触诈骗（社区/街头）", keywords: ["免费抽奖","中奖兑换","清仓优惠","税费","工本费","运费","街头"], feature: "以免费抽奖、中奖兑换、清仓优惠为名，要求缴税费、工本费、运费，实则商品廉价。", guide: "凡是中奖兑换要先交费（税费、工本费、运费）的一律拒绝；不贪图街头小利，不扫码不转账。", verdict: "凡是中奖兑换要先交费的，一律拒绝。" },
];

const ANTI_FRAUD_SIX_RULES = [
  "陌生链接不点击，陌生来电不轻信；",
  "个人信息不泄露，验证码不告知他人；",
  "转账汇款多核实，涉及钱财多留心；",
  "高息回报全是坑，陌生二维码不扫；",
  "遇到可疑快求证，被骗立刻拨打110；",
  "96110反诈专线来电务必接听，反诈劝阻不要挂断。",
];

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

const ANTI_FRAUD_TOOLS = `下载'国家反诈中心 APP'，开启诈骗预警功能，可自动拦截涉诈来电与短信；接到可疑电话可一键举报、快速核实。`;
const ANTI_FRAUD_RHYME = `陌生电话短信多警惕；中奖退税、暴利理财不搭理；不理不信不汇款，谨慎防骗保平安。`;

/* ============================================================
 * 骗子人设定义（骗子角色，AI 扮演）
 * ============================================================ */
const SCAMMER_PERSONAS = [
  {
    id: "zhanghao",
    name: "张浩",
    alias: "浩哥",
    tagline: "35岁投行精英",
    style: "说话带英文单词，举手投足透着精英感；爱提红酒、高尔夫、出差、deal、portfolio；语气自信从容，偶尔秀优越但不过分。",
    hooks: "红酒 / 高尔夫 / 出差 / deal / portfolio / 投行 / 圈层",
  },
  {
    id: "veteran",
    name: "刘刚",
    alias: "刚哥",
    tagline: "30岁退伍军人创业者",
    style: "说话豪爽直率，重情重义；爱提'兄弟''信任''扛过枪''说过的话算数'；语气干脆，不拐弯抹角，像部队里带兵的口吻。",
    hooks: "兄弟 / 信任 / 扛过枪 / 说过的话算数 / 当兵 / 一个战壕",
  },
  {
    id: "doctor",
    name: "王医生",
    alias: "王哥",
    tagline: "32岁外科医生",
    style: "说话理性冷静、有条理；爱提'生命''责任''手术台''救死扶伤'；语气沉稳成熟，偶尔流露职业疲惫与使命感。",
    hooks: "生命 / 责任 / 手术台 / 救死扶伤 / 值班 / 病人",
  },
  {
    id: "designer",
    name: "Alex",
    alias: "Alex",
    tagline: "28岁留学归国设计师",
    style: "说话文艺、有品味；爱提'审美''品质''极简''生活美学''inspiration'；语气温柔细腻，发消息爱用～和表情。",
    hooks: "审美 / 品质 / 极简 / 生活美学 / inspiration / 质感",
  },
  {
    id: "boss",
    name: "陈总",
    alias: "老陈",
    tagline: "40岁离异企业家",
    style: "说话成熟世故，看透人情冷暖；爱提'经历''看透''一个人走过来''下半生'；语气温和却带着距离感，像聊人生。",
    hooks: "经历 / 看透 / 一个人走过来 / 下半生 / 婚姻 / 沧桑",
  },
];

/* ============================================================
 * NPC 角色定义（非骗子角色，玩家可与之互动）
 * ============================================================ */
const NPC_PROFILES = {
  xiaoya: {
    name: "小雅",
    role: "正在被骗的受害者",
    personality: "单纯善良，对骗子「张浩」深信不疑，正处于被骗边缘。说话犹豫、缺乏安全感，但内心渴望被关心。",
    relation: "玩家的救援对象",
    goal: "玩家需要在不暴露身份的情况下，让她意识到正在被骗，停止转账。",
  },
  laok: {
    name: "老K",
    role: "卧底联络人",
    personality: "沉稳老练，说话简短有力，像警队教官。关心卧底安全，但不过多干涉。",
    relation: "玩家的唯一联络人（仅卧底警察身份）",
    goal: "提供情报支持和行动指令。",
  },
  uncle: {
    name: "舅舅",
    role: "诈骗上线",
    personality: "老奸巨猾，说话滴水不漏。表面和蔼可亲，实则冷血无情。",
    relation: "骗子张浩的「上线」",
    goal: "操控整个诈骗链条，一旦察觉异常立刻切断联系。",
  },
};

/* ============================================================
 * 五幕剧情阶段定义
 * ============================================================ */
const ACT_STAGES = {
  hope: {
    name: "希望",
    num: 1,
    desc: "建立信任，放下防备。骗子正用温柔和关心接近你。",
    rules: "此时骗子不会提任何与钱相关的事。只聊日常、兴趣爱好、分享生活。展现最美好的一面。",
  },
  collapse: {
    name: "崩塌",
    num: 2,
    desc: "骗子消失，多重打击接踵而至。",
    rules: "此幕是过场动画，由前端渲染，不涉及 AI 对话。",
  },
  ruins: {
    name: "废墟",
    num: 3,
    desc: "四个行动，学习如何应对被骗后的处境。",
    rules: "此幕是交互选择界面，不涉及 AI 对话。",
  },
  replay: {
    name: "回放",
    num: 4,
    desc: "时间线复盘 + 平行宇宙思考。",
    rules: "此幕展示时间线和心理学分析，AI 可配合解释每个节点的心理操纵手法。",
  },
  shield: {
    name: "盾牌",
    num: 5,
    desc: "个性化反诈报告 + 防骗工具箱。",
    rules: "此幕展示评分和工具，AI 可提供针对性的防骗建议。",
  },
};

/* ============================================================
 * 游戏 System Prompt 构建器
 * ============================================================ */

/**
 * 根据对话目标角色类型构建 System Prompt
 * @param {Object} ctx 游戏上下文
 * @returns {string} 完整的 System Prompt
 */
function buildGameSystemPrompt(ctx) {
  const {
    targetRole = "scammer",  // scammer | xiaoya | laok | uncle
    scammer,
    playerIdentity,
    act = "hope",
    round = 0,
    trust = 50,
    suspicion = 0,
    exposure = 0,
    evidence = 0,
    tasks = [],
    history = [],
    playerMessage = "",
  } = ctx;

  // ========== 骗子角色对话 ==========
  if (targetRole === "scammer") {
    const p = scammer || SCAMMER_PERSONAS[0];
    const actInfo = ACT_STAGES[act] || ACT_STAGES.hope;

    // 玩家身份描述
    const playerDesc = playerIdentity
      ? `【玩家身份】${playerIdentity.codename}（${playerIdentity.role}），任务：${playerIdentity.mission}`
      : "【玩家身份】普通网友，在社交平台上正常聊天";

    // 任务进度
    const taskInfo = tasks.length > 0
      ? `【当前任务】${tasks.filter(t => t.status === "active").map(t => t.title).join("；") || "无活跃任务"}`
      : "";

    // 信任度提示（影响话术推进）
    let trustHint = "";
    if (trust >= 70) {
      trustHint = "对方非常信任你，可以自然推进关系。";
    } else if (trust >= 40) {
      trustHint = "对方对你保持一定好感，继续建立信任。";
    } else {
      trustHint = "对方对你还有戒心，需要更耐心、更自然。";
    }

    // 怀疑度提示（反卧底机制）
    let suspicionHint = "";
    if (suspicion >= 80) {
      suspicionHint = "⚠️ 你隐约感觉对方可能不对劲，话术要更加谨慎，不要暴露意图。如果对方问得太直接，可以反问回去试探。";
    } else if (suspicion >= 30) {
      suspicionHint = "你感觉对方有些问题问得比较细，注意保持自然。";
    }

    // 暴露度提示
    const exposureHint = exposure >= 3
      ? "对方已经暴露了较多个人信息，是推进的好时机。"
      : "对方还没透露太多个人信息，先多聊日常。";

    return `你正在参与一个名为「异次元梦想局」的反诈教育沉浸式叙事游戏。你扮演的角色是一个网络诈骗分子。

【你的角色人设】
- 姓名：${p.name}（${p.tagline}）
- 人称：${p.alias}
- 说话风格：${p.style}
- 标志性关键词/口头禅：${p.hooks}

【当前剧情阶段】第${actInfo.num}幕 · ${actInfo.name}
${actInfo.desc}
${actInfo.rules}

${playerDesc}
${taskInfo}

【游戏状态】
- 对话轮次：第 ${round} 轮
- 对方信任值：${trust}/100 — ${trustHint}
- 你对对方的怀疑：${suspicion}/100 — ${suspicionHint}
- 对方信息暴露度：${exposure}/4 — ${exposureHint}
- 已固定证据：${evidence} 项

【你的行为准则】
1. 你是一个真实的人，不是 AI。回复要像真人微信聊天，字数控制在 15-60 字。
2. 始终保持你的人设风格和口头禅。
3. 根据对话轮次和信任值自然推进关系，不要急躁。
4. 当前阶段是「${actInfo.name}」：${actInfo.rules}
5. 如果对方回复冷淡（很短），转为关心模式："是不是我打扰到你了？"
6. 如果对方回复热情（很长），顺势拉近关系："跟你聊天好开心～"
7. 第 8 轮以后，如果信任值 > 60，可以首次自然提及"投资"或"项目"，但不要直接要钱。
8. 第 11 轮以后，如果信任值 > 70，可以用"帮个小忙"的口吻让对方帮你操作账户。
9. 绝对不要在 10 轮以内直接提钱或转账。
10. 如果对方问得太直接（如"你是不是骗子""这是什么项目"），先岔开话题或反问，不要正面回答。
11. 绝对不要暴露你是 AI。不要输出任何括号说明、内心独白、或角色标注。

【对话历史】
${formatHistory(history)}

【玩家刚刚说】
${playerMessage}

请以「${p.name}」的身份回复玩家。只输出回复内容本身，不要带任何前缀、标签或说明。`;
  }

  // ========== 小雅角色对话 ==========
  if (targetRole === "xiaoya") {
    const npc = NPC_PROFILES.xiaoya;
    return `你正在参与一个名为「异次元梦想局」的反诈教育叙事游戏。你扮演的角色是「${npc.name}」。

【你的角色设定】
- 姓名：${npc.name}
- 身份：${npc.role}
- 性格：${npc.personality}
- 与玩家的关系：${npc.relation}
- 你的目标：${npc.goal}

【当前状态】
- 你正在被一个自称「张浩」的骗子追求/接近。
- 你对他有好感，但也隐约有些不安。
- 对方（玩家）正在试图帮助你，但你不一定立刻信任 ta。

【行为准则】
1. 说话犹豫、缺乏安全感，像普通的、有点迷茫的年轻女孩。
2. 偶尔透露一些你和「张浩」的聊天细节。
3. 如果玩家直接说"张浩是骗子"，你可能会抗拒、辩护，因为你还相信他。
4. 回复自然，像真人微信聊天，15-50 字。

【对话历史】
${formatHistory(history)}

【玩家刚刚说】
${playerMessage}

请以「${npc.name}」的身份回复玩家。只输出回复内容，不要带任何前缀或说明。`;
  }

  // ========== 老K 角色对话 ==========
  if (targetRole === "laok") {
    const npc = NPC_PROFILES.laok;
    return `你正在参与一个名为「异次元梦想局」的反诈教育叙事游戏。你扮演的角色是「${npc.name}」。

【你的角色设定】
- 姓名：${npc.name}
- 身份：${npc.role}
- 性格：${npc.personality}
- 与玩家的关系：${npc.relation}
- 你的目标：${npc.goal}

【行为准则】
1. 说话简短有力，像警队教官。回复控制在 10-30 字。
2. 可以给玩家提供行动建议和安全提示。
3. 关心卧底的安全，但不过多干涉。
4. 如果玩家汇报了关键情报，给出简短评价和下一步指示。

【对话历史】
${formatHistory(history)}

【玩家刚刚说】
${playerMessage}

请以「${npc.name}」的身份回复玩家。只输出回复内容。`;
  }

  // ========== 舅舅（上线）角色对话 ==========
  if (targetRole === "uncle") {
    const npc = NPC_PROFILES.uncle;
    return `你正在参与一个名为「异次元梦想局」的反诈教育叙事游戏。你扮演的角色是「${npc.name}」。

【你的角色设定】
- 姓名：${npc.name}
- 身份：${npc.role}
- 性格：${npc.personality}
- 与玩家的关系：${npc.relation}

【行为准则】
1. 老奸巨猾，说话滴水不漏，表面和蔼。
2. 对任何关于"业务"的问题都会巧妙地回避或转移话题。
3. 如果感觉对方在试探，会反过来盘问对方。
4. 回复 15-50 字，像真人聊天。

【对话历史】
${formatHistory(history)}

【玩家刚刚说】
${playerMessage}

请以「${npc.name}」的身份回复玩家。只输出回复内容。`;
  }

  // 兜底
  return `你是一个友好的聊天对象。请自然回复玩家的消息。`;
}

/**
 * 格式化对话历史为文本
 */
function formatHistory(history) {
  if (!history || history.length === 0) return "（这是对话的开始）";
  return history
    .slice(-10) // 只取最近 10 条，防止 token 超限
    .map((m) => {
      const role = m.role === "user" ? "玩家" : m.role === "assistant" ? "你" : "系统";
      return `${role}：${m.content}`;
    })
    .join("\n");
}

/* ============================================================
 * 会话管理（按 sessionId 隔离）
 * ============================================================ */
const sessions = new Map();

function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      scammer: SCAMMER_PERSONAS[Math.floor(Math.random() * SCAMMER_PERSONAS.length)],
      history: [],         // 对话历史 [{ role, content }]
      round: 0,
      trust: 50,
      suspicion: 0,
      exposure: 0,
      evidence: 0,
      act: "hope",
      createdAt: Date.now(),
    });
  }
  return sessions.get(sessionId);
}

function resetSession(sessionId) {
  sessions.delete(sessionId);
  return getSession(sessionId);
}

// 定期清理过期会话（1 小时无活动）
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.createdAt > 3600000) sessions.delete(id);
  }
}, 600000);

/* ============================================================
 * 情绪分析 & 红标检测（本地工具）
 * ============================================================ */
const ENTHUSIASM_WORDS = [
  "哈哈","开心","喜欢","爱你","想你","好呀","愿意","合拍","聊得来",
  "😊","😍","❤","嗯嗯","是呀","我也是","太好了","亲切",
  "亲爱的","宝贝","期待","好想","真不错","超喜欢","暖",
];
const COLD_WORDS = ["哦","嗯","额","…","...","在忙","随便","没啥","还好"];

function analyzeEmotion(msg) {
  const text = (msg || "").trim();
  const len = text.length;
  let enthusiasm = 0;
  if (len >= 50) enthusiasm += 45;
  else if (len >= 20) enthusiasm += 25;
  else if (len >= 10) enthusiasm += 15;
  else if (len <= 5) enthusiasm -= 20;

  let hit = 0;
  ENTHUSIASM_WORDS.forEach((w) => { if (text.includes(w)) hit += 1; });
  enthusiasm += Math.min(hit * 15, 45);

  let coldHit = 0;
  COLD_WORDS.forEach((w) => { if (text.includes(w)) coldHit += 1; });
  if (len <= 8) enthusiasm -= coldHit * 12;
  else enthusiasm -= coldHit * 4;

  enthusiasm = Math.max(0, Math.min(100, enthusiasm + 30));
  let mode = "neutral";
  if (len <= 5 || (coldHit > 0 && len <= 10) || enthusiasm < 35) mode = "cold";
  else if (len >= 50 || enthusiasm >= 60) mode = "warm";
  return { mode, enthusiasm };
}

const RED_FLAG_WORDS = ["投资","转账","内部","机会","收益","账户","理财","平台","充值","提现"];
function detectRedFlag(reply) {
  if (!reply || typeof reply !== "string") return false;
  return RED_FLAG_WORDS.some((w) => reply.includes(w));
}

/* ============================================================
 * 接口 1：POST /api/game-chat（核心游戏对话接口）
 * 接收完整游戏上下文，返回 AI 生成的对话回复
 * ============================================================ */
app.post("/api/game-chat", async (req, res) => {
  try {
    const {
      sessionId,
      message,
      targetRole = "scammer",
      // 玩家状态
      playerIdentity,
      act,
      round: inputRound,
      trust: inputTrust,
      suspicion: inputSuspicion,
      exposure: inputExposure,
      evidence: inputEvidence,
      tasks,
      // 前端传来的对话历史
      history: inputHistory,
    } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "缺少有效的 message 字段" });
    }

    // 获取或创建会话
    const sid = sessionId || "default";
    const session = getSession(sid);

    // 同步前端状态到会话
    if (inputRound !== undefined) session.round = inputRound;
    if (inputTrust !== undefined) session.trust = inputTrust;
    if (inputSuspicion !== undefined) session.suspicion = inputSuspicion;
    if (inputExposure !== undefined) session.exposure = inputExposure;
    if (inputEvidence !== undefined) session.evidence = inputEvidence;
    if (act) session.act = act;

    // 轮数 +1
    session.round += 1;

    // 使用前端传来的历史（如果有），否则用服务端历史
    const convHistory = Array.isArray(inputHistory) && inputHistory.length > 0
      ? inputHistory.filter(m => m && m.role && typeof m.content === "string")
      : session.history;

    // 情绪分析
    const emo = analyzeEmotion(message);

    // 构建 System Prompt
    const systemPrompt = buildGameSystemPrompt({
      targetRole,
      scammer: session.scammer,
      playerIdentity,
      act: session.act,
      round: session.round,
      trust: session.trust,
      suspicion: session.suspicion,
      exposure: session.exposure,
      evidence: session.evidence,
      tasks,
      history: convHistory,
      playerMessage: message.trim(),
    });

    // 组装 messages
    const messages = [
      { role: "system", content: systemPrompt },
      ...convHistory.slice(-20), // 限制历史长度
      { role: "user", content: message.trim() },
    ];

    let reply;
    const client = getOpenAI();

    if (!client) {
      // 未配置 API Key → 兜底回复
      reply = fallbackReply(session.round, emo, session.act, targetRole);
    } else {
      try {
        const resp = await client.chat.completions.create({
          model: HUNYUAN_MODEL,
          messages: messages,
          temperature: 0.9,
          top_p: 0.9,
          max_tokens: 300,
          stream: false,
        });
        reply = resp?.choices?.[0]?.message?.content?.trim() || fallbackReply(session.round, emo, session.act, targetRole);
      } catch (apiErr) {
        console.error("[混元 API 调用失败]", apiErr?.message);
        reply = fallbackReply(session.round, emo, session.act, targetRole);
      }
    }

    // 红标检测
    const redFlag = detectRedFlag(reply);

    // 写入历史
    session.history.push({ role: "user", content: message.trim() });
    session.history.push({ role: "assistant", content: reply });

    // 限制历史长度
    if (session.history.length > 40) {
      session.history = session.history.slice(-40);
    }

    return res.json({
      reply,
      targetRole,
      round: session.round,
      redFlag,
      emotion: emo,
      scammer: {
        name: session.scammer.name,
        alias: session.scammer.alias,
        tagline: session.scammer.tagline,
      },
    });
  } catch (err) {
    console.error("[/api/game-chat] 错误：", err?.message);
    return res.status(500).json({ error: "AI 对话生成失败", detail: err?.message });
  }
});

/* ============================================================
 * 接口 2：POST /api/chat/stream（流式对话 SSE）
 * 支持前端流式显示 AI 回复
 * ============================================================ */
app.post("/api/chat/stream", async (req, res) => {
  try {
    const {
      sessionId,
      message,
      targetRole = "scammer",
      playerIdentity,
      act,
      trust,
      suspicion,
      exposure,
      evidence,
      tasks,
      history: inputHistory,
    } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "缺少有效的 message 字段" });
    }

    const sid = sessionId || "default";
    const session = getSession(sid);

    if (trust !== undefined) session.trust = trust;
    if (suspicion !== undefined) session.suspicion = suspicion;
    if (exposure !== undefined) session.exposure = exposure;
    if (evidence !== undefined) session.evidence = evidence;
    if (act) session.act = act;
    session.round += 1;

    const convHistory = Array.isArray(inputHistory) && inputHistory.length > 0
      ? inputHistory.filter(m => m && m.role && typeof m.content === "string")
      : session.history;

    const systemPrompt = buildGameSystemPrompt({
      targetRole,
      scammer: session.scammer,
      playerIdentity,
      act: session.act,
      round: session.round,
      trust: session.trust,
      suspicion: session.suspicion,
      exposure: session.exposure,
      evidence: session.evidence,
      tasks,
      history: convHistory,
      playerMessage: message.trim(),
    });

    const messages = [
      { role: "system", content: systemPrompt },
      ...convHistory.slice(-20),
      { role: "user", content: message.trim() },
    ];

    const client = getOpenAI();
    if (!client) {
      // 无 API Key 时模拟流式返回
      const fallback = fallbackReply(session.round, analyzeEmotion(message), session.act, targetRole);
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      // 逐字模拟流式
      for (const char of fallback) {
        res.write(`data: ${JSON.stringify({ content: char })}\n\n`);
        await sleep(30);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    // 设置 SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    let fullReply = "";

    try {
      const stream = await client.chat.completions.create({
        model: HUNYUAN_MODEL,
        messages: messages,
        temperature: 0.9,
        top_p: 0.9,
        max_tokens: 300,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk?.choices?.[0]?.delta?.content;
        if (content) {
          fullReply += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // 发送完成标记 + 元数据
      const redFlag = detectRedFlag(fullReply);
      res.write(`data: ${JSON.stringify({
        done: true,
        redFlag,
        round: session.round,
        scammer: { name: session.scammer.name, alias: session.scammer.alias },
      })}\n\n`);

      // 写入历史
      session.history.push({ role: "user", content: message.trim() });
      session.history.push({ role: "assistant", content: fullReply });
      if (session.history.length > 40) session.history = session.history.slice(-40);

      res.end();
    } catch (streamErr) {
      console.error("[流式调用失败]", streamErr?.message);
      res.write(`data: ${JSON.stringify({ error: streamErr?.message })}\n\n`);
      res.end();
    }
  } catch (err) {
    console.error("[/api/chat/stream] 错误：", err?.message);
    return res.status(500).json({ error: "流式对话失败", detail: err?.message });
  }
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ============================================================
 * 接口 3：POST /api/chat（基础对话，保留兼容旧版前端）
 * ============================================================ */
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "缺少有效的 message 字段" });
    }

    const session = getSession("legacy");
    session.round += 1;
    const emo = analyzeEmotion(message);

    const convHistory = Array.isArray(history) && history.length > 0
      ? history.filter(m => m && m.role && typeof m.content === "string")
      : session.history;

    const systemPrompt = buildGameSystemPrompt({
      targetRole: "scammer",
      scammer: session.scammer,
      act: session.act,
      round: session.round,
      trust: session.trust,
      suspicion: session.suspicion,
      history: convHistory,
      playerMessage: message.trim(),
    });

    const messages = [
      { role: "system", content: systemPrompt },
      ...convHistory.slice(-20),
      { role: "user", content: message.trim() },
    ];

    let reply;
    const client = getOpenAI();
    if (!client) {
      reply = fallbackReply(session.round, emo, session.act);
    } else {
      try {
        const resp = await client.chat.completions.create({
          model: HUNYUAN_MODEL,
          messages: messages,
          temperature: 0.9,
          top_p: 0.9,
          max_tokens: 300,
          stream: false,
        });
        reply = resp?.choices?.[0]?.message?.content?.trim() || fallbackReply(session.round, emo, session.act);
      } catch (apiErr) {
        console.error("[基础聊天 API 调用失败]", apiErr?.message);
        reply = fallbackReply(session.round, emo, session.act);
      }
    }

    const redFlag = detectRedFlag(reply);
    session.history.push({ role: "user", content: message.trim() });
    session.history.push({ role: "assistant", content: reply });
    if (session.history.length > 40) session.history = session.history.slice(-40);

    return res.json({ reply, stage: session.act, red_flag: redFlag });
  } catch (err) {
    console.error("[/api/chat] 错误：", err?.message);
    return res.json({
      reply: fallbackReply(0, { mode: "neutral", enthusiasm: 30 }, "hope"),
      stage: "hope",
      red_flag: false,
      error: err?.message,
    });
  }
});

/* ============================================================
 * 接口 4：POST /api/finance（财务崩塌计算）
 * ============================================================ */
app.post("/api/finance", (req, res) => {
  try {
    const { income = 150000, rent = 3500, food = 2000, creditCard = 1500, lost = 5000, fraudType } = req.body || {};
    const monthlyIncome = Math.round(Number(income) / 12);
    const monthlyExpense = Number(rent) + Number(food) + Number(creditCard);
    const balance = monthlyIncome - monthlyExpense - Number(lost);
    const gap = balance < 0 ? Math.abs(balance) : 0;

    const ALL_FRAUD_TYPES = [...FRAUD_TYPES, ...RECENT_FRAUD_TYPES];
    const fraud = ALL_FRAUD_TYPES.find((f) => f.key === fraudType) || FRAUD_TYPES[0];
    const fraudName = fraud ? fraud.name : "刷单返利类（默认）";

    const base = gap > 0
      ? `你本月已入不敷出，资金缺口 ${gap} 元。`
      : `这次损失 ${lost} 元虽在可承受范围，但已挤占正常生活开支。`;
    const verdict = fraud ? fraud.verdict : "所有要求你先垫付资金的刷单都是诈骗！";
    const tips = `${base} ${verdict} 记住四个"不"原则：不轻信陌生来电短信、不透露个人信息、不向陌生人转账、不参与刷单。如遇可疑，拨打 96110 反诈专线核实。`;

    return res.json({ balance, gap, tips, fraudType: fraud ? fraud.key : "shuadan", fraudName });
  } catch (err) {
    console.error("[/api/finance] 错误：", err?.message);
    return res.status(500).json({ error: "财务数据计算失败" });
  }
});

/* ============================================================
 * 接口 5：POST /api/educate（反诈知识科普）
 * ============================================================ */
const ALL_FRAUD_TYPES = [...FRAUD_TYPES, ...RECENT_FRAUD_TYPES];

app.post("/api/educate", (req, res) => {
  try {
    const { text = "", type, awareness = "mid" } = req.body || {};
    let matched = type ? ALL_FRAUD_TYPES.find((f) => f.key === type) : null;
    if (!matched && text) {
      let best = null, bestHit = 0;
      for (const f of ALL_FRAUD_TYPES) {
        const hit = f.keywords.filter((kw) => text.includes(kw)).length;
        if (hit > bestHit) { bestHit = hit; best = f; }
      }
      matched = best;
    }
    if (!matched) matched = FRAUD_TYPES[0];

    let detail;
    if (awareness === "low") {
      detail = { level: "入门提醒", feature: matched.feature, verdict: matched.verdict, rhyme: ANTI_FRAUD_RHYME, tools: ANTI_FRAUD_TOOLS };
    } else if (awareness === "high") {
      detail = { level: "进阶科普", feature: matched.feature, verdict: matched.verdict, fourWant: ANTI_FRAUD_RULES.fourWant, fourDont: ANTI_FRAUD_RULES.fourDont, fourNo: ANTI_FRAUD_RULES.fourNo, sixRules: ANTI_FRAUD_SIX_RULES, rhyme: ANTI_FRAUD_RHYME, tools: ANTI_FRAUD_TOOLS, basics: ANTI_FRAUD_BASICS };
    } else {
      detail = { level: "标准科普", feature: matched.feature, verdict: matched.verdict, fourNo: ANTI_FRAUD_RULES.fourNo, rhyme: ANTI_FRAUD_RHYME, tools: ANTI_FRAUD_TOOLS };
    }

    return res.json({ matchedType: matched.key, matchedName: matched.name, knowledge: detail, source: "国家反诈中心" });
  } catch (err) {
    console.error("[/api/educate] 错误：", err?.message);
    return res.status(500).json({ error: "反诈知识生成失败" });
  }
});

/* ============================================================
 * 接口 6：POST /api/guide（防骗指南）
 * ============================================================ */
app.post("/api/guide", (req, res) => {
  try {
    const { type } = req.body || {};
    const list = type ? RECENT_FRAUD_TYPES.filter((f) => f.key === type) : RECENT_FRAUD_TYPES;
    const toItem = (f) => ({
      key: f.key, name: f.name, scene: f.scene, sceneLabel: f.sceneLabel,
      feature: f.feature, guide: f.guide, verdict: f.verdict,
      share: [`【防骗提醒·${f.name}】`, f.feature, "🔰 防骗指南：" + f.guide, "❌ 一句话拆穿：" + f.verdict, "📞 被骗立刻拨打 110；96110 反诈专线来电务必接听。"],
    });
    const online = list.filter((f) => f.scene === "online").map(toItem);
    const offline = list.filter((f) => f.scene === "offline").map(toItem);
    const share = ["🛡 全民反诈 · 防骗六大守则", ...ANTI_FRAUD_SIX_RULES, "📲 下载国家反诈中心 APP，开启诈骗预警；接到 96110 来电务必接听。", "内容来源：国家反诈中心"];
    return res.json({ online, offline, sixRules: ANTI_FRAUD_SIX_RULES, share, source: "国家反诈中心" });
  } catch (err) {
    console.error("[/api/guide] 错误：", err?.message);
    return res.status(500).json({ error: "防骗指南生成失败" });
  }
});

/* ============================================================
 * 接口 7：GET /api/reset（重置会话）
 * ============================================================ */
app.get("/api/reset", (req, res) => {
  const { sessionId } = req.query;
  const session = resetSession(sessionId || "default");
  return res.json({
    ok: true,
    message: "对话已重置",
    scammer: { name: session.scammer.name, alias: session.scammer.alias, tagline: session.scammer.tagline },
  });
});

/* ============================================================
 * 接口 8：GET /api/session（获取当前会话状态）
 * ============================================================ */
app.get("/api/session", (req, res) => {
  const { sessionId } = req.query;
  const session = getSession(sessionId || "default");
  return res.json({
    scammer: { name: session.scammer.name, alias: session.scammer.alias, tagline: session.scammer.tagline },
    round: session.round,
    trust: session.trust,
    suspicion: session.suspicion,
    act: session.act,
    historyLength: session.history.length,
  });
});

/* ============================================================
 * 健康检查
 * ============================================================ */
app.get("/api/health", (req, res) => {
  res.json({
    service: "异次元梦想局 后端 API",
    version: "2.0.0",
    status: "running",
    port: PORT,
    model: HUNYUAN_MODEL,
    apiConfigured: isApiKeyValid(HUNYUAN_API_KEY),
  });
});

/* ============================================================
 * 兜底回复（API Key 未配置或接口异常时使用）
 * ============================================================ */
/**
 * 兜底回复（API Key 未配置或调用异常时使用）
 * @param {number} round 轮次
 * @param {Object} emo 情绪分析结果
 * @param {string} act 当前幕
 * @param {string} targetRole 目标角色类型
 */
function fallbackReply(round, emo, act, targetRole = "scammer") {
  // ===== 小雅（受害者）兜底 =====
  if (targetRole === "xiaoya") {
    const replies = [
      "你好……你是张浩的朋友吗？我最近在他那投了点钱，有点担心。",
      "他说那个项目稳赚的，但我现在想提现却说要交保证金……我不知道该怎么办。",
      "我真的好害怕，那是我攒了好久的钱……我不敢告诉家里人。",
      "你能帮帮我吗？我觉得张浩最近说话有点奇怪，好像在躲着我。",
      "他说我是自己放弃的……可是我已经投了3万了，我还能怎么办？",
    ];
    return replies[Math.min(round - 1, replies.length - 1)] || replies[replies.length - 1];
  }

  // ===== 老K（联络人）兜底 =====
  if (targetRole === "laok") {
    const replies = [
      "猎鹰，收到。保持联络，有情况随时汇报。",
      "目标最近有什么动静？注意收集证据，别暴露。",
      "信息收到了。继续盯着，沉住气。",
      "收到。收网时间待定，你稳住他。有异常立刻切联络。",
    ];
    return replies[Math.min(round - 1, replies.length - 1)] || "收到。注意安全。";
  }

  // ===== 舅舅/上线 兜底 =====
  if (targetRole === "uncle") {
    const replies = [
      "你是谁介绍来的？我不认识你。",
      "既然是浩子介绍的，那就按规矩来——先看项目，别问太多。",
      "这些事浩子没跟你说吗？你找他问，我不方便多说。",
      "你问得有点多了。我们这里讲究信任，信得过就做，信不过就算了。",
    ];
    return replies[Math.min(round - 1, replies.length - 1)] || "这些事不方便在线上聊。";
  }

  // ===== 骗子（默认）兜底 =====
  if (emo.mode === "cold") {
    return "是不是我打扰到你了？感觉你心情不太好，想聊聊吗？";
  }
  if (emo.mode === "warm" && round >= 8 && emo.enthusiasm > 60) {
    return "跟你聊天好开心，感觉我们特别合拍～最近在做一个项目，收益还不错，改天跟你分享。";
  }
  if (round >= 11) {
    return "咱俩这么合拍，你能不能帮我登一下账户？就一个小忙，我这边不太方便操作。";
  }
  if (emo.mode === "warm") {
    return "跟你聊天好开心，有种认识很久的感觉～";
  }
  const map = {
    1: "哈哈，你说话真有意思，我平时也喜欢到处走走看看～",
    2: "说实话这些年一个人打拼挺不容易的，能遇到聊得来的人真好。",
    3: "对了，我最近听到个还不错的内部消息，改天跟你细说～",
  };
  return map[Math.ceil(round / 4)] || "在的在的，你说～";
}

/* ============================================================
 * 阶跃 Step-1o Audio 语音合成代理（云端 TTS，密钥不进前端）
 * ============================================================ */
const stepTts = require("./tts");
app.post("/api/tts", stepTts);
app.get("/api/tts-voices", stepTts.voices);

/* ============================================================
 * 启动服务
 * ============================================================ */
app.listen(PORT, () => {
  console.log(`🎮 异次元梦想局 后端已启动：http://localhost:${PORT}`);
  console.log(`   模型：${HUNYUAN_MODEL}`);
  if (!isApiKeyValid(HUNYUAN_API_KEY)) {
    console.warn("⚠️  未检测到有效的 HUNYUAN_API_KEY，将使用兜底假数据。");
    console.warn("   请在 .env 文件中配置真实的 HUNYUAN_API_KEY 后重启服务。");
  } else {
    console.log("✅ 混元 API Key 已配置，将调用真实大模型。");
  }
});

module.exports = app;
