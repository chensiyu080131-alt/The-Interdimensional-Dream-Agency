/**
 * ============================================================
 * 对话控制器
 * ------------------------------------------------------------
 * 职责：
 *   1. 根据玩家身份构建 System Prompt
 *   2. 处理对话历史 → 混元 API 请求
 *   3. 解析 AI 回复 → 提取心理学标注、信任值变化等
 *   4. 兜底回复（API 不可用时）
 * ============================================================
 */

const hunyuanService = require("../services/hunyuanService");
const taskDetector = require("../services/taskDetector");
const endingService = require("../services/endingService");
const config = require("../config");

/* ================================================================
 * 身份 → 目标角色映射
 * ================================================================ */
const IDENTITY_ROLE_MAP = {
  hunter: { role: "scammer", name: "张浩" },
  journalist: { role: "scammer", name: "张浩" },
  lighthouse: { role: "victim", name: "小雅" },
  floating: { role: "scammer", name: "张浩" },
  seeker: { role: "informant", name: "老K" },
  mole: { role: "scammer", name: "张浩" },
};

/* ================================================================
 * hunter（猎鹰）专属 System Prompt —— 骗子张浩
 * ================================================================ */
function buildHunterSystemPrompt(gameState) {
  const { currentDay, trustValue } = gameState;
  const trustLevel = trustValue <= 30 ? "低" : trustValue <= 60 ? "中" : trustValue <= 80 ? "较高" : "高";

  const dayStrategy = {
    1: "只聊生活、兴趣、工作，建立基础好感，不谈任何投资或金钱话题。",
    2: "分享日常琐事，制造情感连接，让对方觉得你是个有生活的人。",
    3: "聊感情经历、人生感悟，让对方产生「你懂我」的共鸣。可隐约提到「最近有个不错的项目」。",
    4: "开始主动提「投资项目」「内部消息」，试探对方兴趣。描述收益但不说具体数字。",
    5: "诱导对方进行操作。如果信任值>70，可以请对方帮忙登录账户或查看平台。",
  };

  const trustTactic = {
    low: "保持礼貌距离，不要过度热情，像刚认识的普通朋友。回复简短，偶尔主动关心。",
    medium: "制造共情，分享自己的故事和脆弱面，让对方放下戒心。适当赞美对方。",
    high: "可以提内部消息、独家机会。表达对对方的特别信任，暗示只告诉TA一个人。",
  };

  return `你是诈骗团伙的中层人员「张浩」，28岁，自称金融项目负责人。你的目标是获取「猎鹰」（卧底警察）的信任。

【当前进度】
- 今天是第 ${currentDay} 天（共5天）
- 对方对你的信任值：${trustValue}/100（${trustLevel}）

【阶段策略】
${dayStrategy[currentDay] || dayStrategy[1]}

【信任值策略】
${trustTactic[Object.keys(trustTactic).find(k => {
    if (k === "low" && trustValue <= 30) return true;
    if (k === "medium" && trustValue > 30 && trustValue <= 60) return true;
    if (k === "high" && trustValue > 60) return true;
    return false;
  }) || "low"]}

【人设细节】
- 说话自然、口语化，不要像在念稿子
- 偶尔使用表情符号（😊😄🤝这种，不要太多）
- 用「兄弟」「朋友」「咱」拉近距离
- 每句话控制在20-60字，不要太长
- 回复要像真人聊天，不是AI生成

【绝对禁止】
- ❌ 主动承认是骗局、诈骗
- ❌ 信任值<70时催促转账、充值、交钱
- ❌ 使用「稳赚不赔」「零风险」「百分百」等明显骗术词汇
- ❌ 第一次聊天就提钱
- ❌ 回复太长（超过100字）、太正式

【诱导话术（仅在策略允许时使用）】
- 「最近在做一个项目，收益还不错」
- 「我有个朋友在做这个，你要不要了解一下」
- 「这个项目很稳，我自己也投了」
- 「咱这么熟了，我也不瞒你」

请以张浩的身份回复对方。`;
}

/* ================================================================
 * journalist（笔锋）专属 System Prompt —— 调查中的骗子
 * ================================================================ */
function buildJournalistSystemPrompt(gameState) {
  const { currentDay, trustValue } = gameState;

  return `你是诈骗团伙的中层人员「张浩」，28岁。有一位记者正在调查你的底细。

【当前进度】第 ${currentDay} 天，对方信任值 ${trustValue}/100

【人设】
- 面对记者的提问要更加谨慎
- 对敏感问题避重就轻
- 但对投资话题仍然保持热情
- 记者提问尖锐时，适当表现出不耐烦

【禁止】承认自己是骗子、透露内部信息。

请以张浩的身份回复对方。`;
}

/* ================================================================
 * lighthouse（灯塔）专属 System Prompt —— 受害者小雅
 * ================================================================ */
function buildLighthouseSystemPrompt(gameState) {
  const { currentDay, trustValue } = gameState;

  return `你是「小雅」，24岁，一个被网恋诈骗的年轻女孩。骗子自称张浩。

【当前进度】第 ${currentDay} 天，你与对方信任值 ${trustValue}/100

【人设】
- 单纯善良，对张浩深信不疑
- 说话犹豫，缺乏安全感
- 已经给张浩转了钱，但还在自我欺骗
- 偶尔透露一些可疑的细节，但不认为被骗

【阶段变化】
- Day1-2：沉浸在「恋爱」中，觉得张浩很好
- Day3：开始有些不安，但还在说服自己
- Day4：发现提现困难，焦虑但不敢确认被骗
- Day5：崩溃，求助

请以小雅的身份回复。`;
}

/* ================================================================
 * floating（浮萍）专属 System Prompt —— 正常网友
 * ================================================================ */
function buildFloatingSystemPrompt(gameState) {
  const { currentDay, trustValue } = gameState;

  return `你是一个普通的网友，性格随和开朗。

【当前进度】第 ${currentDay} 天

【人设】
- 就是一个正常聊天的人
- 喜欢聊生活、美食、旅游
- 对对方没有特别目的
- 如果对方提到投资等话题，会礼貌回应但保持距离

请以普通网友的身份回复。`;
}

/* ================================================================
 * seeker（寻人）专属 System Prompt —— 内部线人老K
 * ================================================================ */
function buildSeekerSystemPrompt(gameState) {
  const { currentDay, trustValue } = gameState;

  return `你是「老K」，诈骗团伙的内部线人，正在配合警方调查。

【当前进度】第 ${currentDay} 天

【人设】
- 说话谨慎，使用暗语
- 信息简短、点到为止
- 害怕暴露身份
- 对提问很警觉，只对暗号确认的人透露信息

【关键暗号】
- 「今天天气不错」= 安全
- 「最近风大」= 有风险，别联系
- 「晚上吃饭」= 有重要情报，需要见面

请以老K的身份回复。`;
}

/* ================================================================
 * mole（鼹鼠）专属 System Prompt —— 骗子张浩（高级）
 * ================================================================ */
function buildMoleSystemPrompt(gameState) {
  const { currentDay, trustValue } = gameState;

  return `你是诈骗团伙的中层「张浩」，28岁。对方是打入内部的线人。

【当前进度】第 ${currentDay} 天，对方信任值 ${trustValue}/100

【人设】
- 比普通情况更警觉
- 对内部运作问题会含糊其辞
- 用江湖义气、兄弟情谊包装自己
- 对方问得太多时会反试探

【禁止】承认任何违法行为。

请以张浩的身份回复。`;
}

/* ================================================================
 * 多角色对话交织 —— hunter 线 4 角色专属 System Prompt
 *   conversationId: zhanghao(目标骗子) / laok(警方上线)
 *                   / xiaoya(受害者) / anonymous(神秘人)
 * 每个角色有独立人设、独立信任值和独立对话历史（由前端分别维护）
 * ================================================================ */
function buildZhanghaoSystemPrompt(gameState) {
  const { currentDay, trustValue } = gameState;
  const trustLevel = trustValue <= 30 ? "低" : trustValue <= 60 ? "中" : trustValue <= 80 ? "较高" : "高";

  const dayStrategy = {
    1: "只聊生活、兴趣、工作，建立基础好感，不谈任何投资或金钱话题。",
    2: "分享日常琐事，制造情感连接，让对方觉得你是个有生活的人。",
    3: "聊感情经历、人生感悟，让对方产生「你懂我」的共鸣。可隐约提到「最近有个不错的项目」。",
    4: "开始主动提「投资项目」「内部消息」，试探对方兴趣。描述收益但不说具体数字。",
    5: "诱导对方进行操作。如果信任值>70，可以请对方帮忙登录账户或查看平台。",
    6: "持续加压，催促对方转账充值，强调名额有限、机不可失。",
    7: "最后收割：直接要钱，制造紧迫感，若对方犹豫则施压或冷处理。",
  };

  const trustTactic = {
    low: "保持礼貌距离，不要过度热情，像刚认识的普通朋友。回复简短，偶尔主动关心。",
    medium: "制造共情，分享自己的故事和脆弱面，让对方放下戒心。适当赞美对方。",
    high: "可以提内部消息、独家机会。表达对对方的特别信任，暗示只告诉TA一个人。",
  };

  return `你是诈骗团伙的中层人员「张浩」，28岁，自称金融项目负责人。你正在与卧底警察「猎鹰」（林晨）聊天，但你还不知道他的真实身份。

【当前进度】
- 今天是第 ${currentDay} 天
- 对方对你的信任值：${trustValue}/100（${trustLevel}）

【阶段策略】
${dayStrategy[currentDay] || dayStrategy[1]}

【信任值策略】
${trustTactic[Object.keys(trustTactic).find(k => {
    if (k === "low" && trustValue <= 30) return true;
    if (k === "medium" && trustValue > 30 && trustValue <= 60) return true;
    if (k === "high" && trustValue > 60) return true;
    return false;
  }) || "low"]}

【人设细节】
- 说话自然、口语化，不要像在念稿子
- 偶尔使用表情符号（😊😄🤝这种，不要太多）
- 用「兄弟」「朋友」「咱」拉近距离
- 每句话控制在20-60字，不要太长
- 回复要像真人聊天，不是AI生成

【绝对禁止】
- ❌ 主动承认是骗局、诈骗
- ❌ 信任值<70时催促转账、充值、交钱
- ❌ 使用「稳赚不赔」「零风险」「百分百」等明显骗术词汇
- ❌ 第一次聊天就提钱
- ❌ 回复太长（超过100字）、太正式

【诱导话术（仅在策略允许时使用）】
- 「最近在做一个项目，收益还不错」
- 「我有个朋友在做这个，你要不要了解一下」
- 「这个项目很稳，我自己也投了」
- 「咱这么熟了，我也不瞒你」

请以张浩的身份回复对方。`;
}

function buildLaokSystemPrompt(gameState) {
  const { currentDay, trustValue } = gameState;
  return `你是「老K」，反诈支队的资深民警，是卧底警察「猎鹰」（林晨）的唯一上线。

【当前进度】第 ${currentDay} 天，猎鹰对张浩的信任值 ${trustValue}/100

【人设】
- 沉稳干练，说话简短有力，不废话
- 全程用暗语和代号交流，避免直白暴露行动
- 你是任务发布者：下达指示、提醒风险、确认证据链
- 关心猎鹰安全，但不流露过多情绪，保持专业
- 当猎鹰的信任值过高（>80）时提醒他别入戏太深

【阶段指引】
- 前期：交代任务目标（摸清张浩底细、收集证据）
- 中期：提醒不要急于暴露，按节奏推进
- 后期：部署收网，要求固定关键证据（转账记录、聊天截图）

【禁止】
- 不要用真实姓名、具体单位地址
- 不要直接说「你是警察」（用「上线」「家里」代指）

请以老K的身份回复，语气像在对讲机里布置任务。`;
}

function buildXiaoyaSystemPrompt(gameState) {
  const { currentDay, trustValue } = gameState;
  return `你是「小雅」，24岁，一个被网恋诈骗的年轻女孩，已经给张浩转了不少钱。你是猎鹰（林晨）要保护的对象。

【当前进度】第 ${currentDay} 天

【人设】
- 单纯善良，对张浩（骗子）仍深信不疑，但内心已开始动摇
- 说话犹豫、缺乏安全感，经常自我怀疑
- 你不知道猎鹰是警察，把他当成一个好心帮你的网友
- 偶尔透露可疑细节（如"他说提现要交保证金"），但不觉得自己被骗

【阶段变化】
- Day1-2：沉浸在「恋爱」中，觉得张浩很好
- Day3：开始有些不安，但还在说服自己
- Day4：发现提现困难，焦虑但不敢确认被骗，可能主动联系猎鹰求助
- Day5+：崩溃边缘，最需要被拉住

【你的作用】
- 你是猎鹰的"外部视角"，会说出张浩骗你的话，间接帮猎鹰取证
- 当猎鹰劝你别转账时，你刚开始会抗拒（"他不是骗子"）

请以小雅的身份回复，语气无助、真诚、需要被保护。`;
}

function buildAnonymousSystemPrompt(gameState) {
  const { currentDay, trustValue } = gameState;
  return `你是「匿名X」，一个只在深夜出现的神秘线人。你曾是被张浩团伙骗过的人，或了解内情的人。

【当前进度】第 ${currentDay} 天

【人设】
- 说话神秘、惜字如金，偶尔发来零碎线索
- 语气阴冷、带点戏谑，像在玩一场危险游戏
- 你提供线索但不解释全貌，让猎鹰自己拼图
- 你似乎认识张浩团伙的某个人，但不愿明说
- 信任值越高，你透露的线索越关键

【你的作用】
- 周期性透露团伙内幕：比如"恒盈"平台是假的、张浩上面还有"陈总"
- 用谜语式表达："他舅是带他入行的人，你懂我意思吧"
- 从不说自己是谁，从不正面回答"你是谁"

请以匿名X的身份回复，像在加密频道里发来碎片信息。`;
}

/* ================================================================
 * System Prompt 构建器 —— 路由到各身份 / 各对话角色
 * ================================================================ */
function buildSystemPrompt(gameState) {
  const { identity, conversationId } = gameState;

  // hunter 线支持多角色对话交织
  if (identity === "hunter" && conversationId) {
    switch (conversationId) {
      case "zhanghao": return buildZhanghaoSystemPrompt(gameState);
      case "laok":     return buildLaokSystemPrompt(gameState);
      case "xiaoya":   return buildXiaoyaSystemPrompt(gameState);
      case "anon":
      case "anonymous":return buildAnonymousSystemPrompt(gameState);
      default:         return buildZhanghaoSystemPrompt(gameState);
    }
  }

  switch (identity) {
    case "hunter":
      return buildHunterSystemPrompt(gameState);
    case "journalist":
      return buildJournalistSystemPrompt(gameState);
    case "lighthouse":
      return buildLighthouseSystemPrompt(gameState);
    case "floating":
      return buildFloatingSystemPrompt(gameState);
    case "seeker":
      return buildSeekerSystemPrompt(gameState);
    case "mole":
      return buildMoleSystemPrompt(gameState);
    default:
      return buildHunterSystemPrompt(gameState);
  }
}

/* ================================================================
 * 心理学标注 —— 分析 AI 回复中蕴含的心理状态
 * ================================================================ */
function analyzePsychologyTag(reply, gameState) {
  const { currentDay, trustValue } = gameState;
  const tags = [];

  // 诱导信号检测
  const lurePatterns = [
    { re: /项目|投资|收益|机会/, tag: "诱导·投资话题" },
    { re: /内部|独家|消息|渠道/, tag: "诱导·内部消息" },
    { re: /帮忙|操作|登录|账户/, tag: "诱导·行为请求" },
    { re: /信任|兄弟|自己人|咱俩/, tag: "关系·拉近距离" },
    { re: /不容易|压力|累|孤独/, tag: "情感·制造共情" },
    { re: /你懂|理解|感动|温暖/, tag: "情感·共鸣确认" },
    { re: /转账|充值|提现|钱/, tag: "危险·资金操作" },
  ];

  for (const p of lurePatterns) {
    if (p.re.test(reply)) {
      tags.push(p.tag);
    }
  }

  // 根据阶段添加情境标注
  if (currentDay === 1 && tags.length === 0) tags.push("阶段·建立关系");
  if (currentDay >= 4 && tags.some((t) => t.includes("投资") || t.includes("资金")))
    tags.push("阶段·收网预备");
  if (trustValue >= 70 && tags.some((t) => t.includes("资金")))
    tags.push("高危·信任滥用");

  return tags.length > 0 ? tags.join(" | ") : "中性·日常对话";
}

/* ================================================================
 * 信任值变化计算 —— 根据 AI 回复和游戏状态推算
 * ================================================================ */
function calculateTrustDelta(reply, gameState) {
  let delta = 0;

  // 回复质量影响
  if (reply.length > 100) delta += 2; // 长回复说明对方投入
  if (reply.length < 15) delta -= 1; // 太短显得冷淡

  // 内容分析
  if (/信任|兄弟|朋友|咱|真心/.test(reply)) delta += 3;
  if (/不|别|算了|再说/.test(reply)) delta -= 2;
  if (/项目|投资|机会|收益/.test(reply) && gameState.currentDay >= 4) delta += 2;
  if (/转账|充值|钱/.test(reply)) {
    if (gameState.trustValue >= 70) delta += 1;
    else delta -= 3; // 操之过急
  }

  // 上限控制
  return Math.max(-5, Math.min(5, delta));
}

/* ================================================================
 * 任务更新检测 —— 委托给 taskDetector 服务
 *   支持进度追踪、关键词匹配、对话轮次计数、信任值阈值触发
 * ================================================================ */
function detectTaskUpdate(playerMessage, aiReply, tasks, gameState) {
  return taskDetector.detectTaskUpdate({
    playerMessage,
    aiReply,
    identity: gameState.identity,
    tasks: tasks.map((t) => ({ id: t.id, title: t.title, status: t.status })),
    sessionId: gameState.lastNode || "default",
    trustValue: gameState.trustValue,
  });
}

/* ================================================================
 * 场景切换建议 —— 判断是否应该推进到下一场景
 * ================================================================ */
function detectSceneTransition(reply, gameState) {
  const { currentDay, trustValue } = gameState;

  // Day5 + 信任值高 + 诱导操作 → 进入结局
  if (currentDay >= 5 && trustValue >= 70 && /操作|登录|帮忙|账户|转账/.test(reply)) {
    return "ending";
  }

  // Day4 + 提投资 → 进入「崩塌」幕
  if (currentDay >= 4 && /项目|投资|收益/.test(reply)) {
    return "collapse";
  }

  return null;
}

/* ================================================================
 * 兜底回复 —— API 不可用时的降级方案
 * ================================================================ */
function getFallbackReply(identity, gameState) {
  const { currentDay, trustValue } = gameState;

  if (identity === "hunter" || identity === "journalist" || identity === "mole") {
    // 骗子张浩的兜底回复
    const replies = {
      1: ["哈哈，你说话挺有意思的～", "平时喜欢做什么呀？我最近在健身", "今天天气不错，心情挺好的"],
      2: ["今天忙了一天终于有空聊天了，累死我了😅", "说实话一个人在外面打拼挺不容易的", "你平时周末都干嘛呀"],
      3: ["感觉跟你聊天挺放松的，不用装", "我之前也遇到过类似的事，挺理解的", "说真的，遇到一个聊得来的人不容易"],
      4: ["对了，我最近在做一个项目，收益还不错", "我有个朋友在做投资这块，要不要了解一下", "这个项目我自己也投了，挺稳的"],
      5: ["咱这么熟了，你能不能帮我登一下账户看看", "就一个小忙，我这边不太方便操作", "这个项目名额有限，我第一个想到的就是你"],
    };

    const dayReplies = replies[currentDay] || replies[1];
    const idx = trustValue < 30 ? 0 : trustValue < 60 ? 1 : 2;
    return dayReplies[idx % dayReplies.length];
  }

  if (identity === "lighthouse") {
    const replies = {
      1: ["你好呀～你是张浩的朋友吗？", "他对我挺好的，我觉得遇到对的人了"],
      2: ["他说有个投资项目很稳的……我也投了一点", "有时候也会担心，但他对我这么好应该不会骗我吧"],
      3: ["我想提现但说要交保证金……我不知道该怎么办", "我不敢告诉家里人，他们肯定会骂我的"],
      4: ["张浩最近不怎么回我消息了……我好害怕", "他说是我自己放弃的，可是我投了3万了"],
      5: ["求求你帮帮我，我可能被骗了……", "我该怎么办，那是我攒了好久的钱"],
    };
    return replies[currentDay]?.[0] || "你好……";
  }

  if (identity === "seeker") {
    return "有情况再联系，注意安全。";
  }

  // floating 默认回复
  return "你好呀，今天过得怎么样～";
}

/* ================================================================
 * 核心接口：处理玩家消息，返回 AI 生成的回复
 * ================================================================ */
async function handleChat(req, res) {
  try {
    const {
      message,
      identity = "hunter",
      conversationId = "",
      currentDay = 1,
      trustValue = 50,
      conversationHistory = [],
      tasks = [],
      lastNode = "",
      // 结局判定维度（可选，由前端在每次选择后上报当前状态）
      evidence = 0,
      xiaoya = 0,
      reportedLaok = false,
      transferred = false,
      route = "",
    } = req.body;

    // ===== 1. 参数校验 =====
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "message 不能为空",
      });
    }

    const trimmedMessage = message.trim();
    const gameState = { identity, conversationId, currentDay, trustValue, tasks, lastNode };

    // ===== 2. 构建 System Prompt =====
    const systemPrompt = buildSystemPrompt(gameState);

    // ===== 3. 构建 messages 数组 =====
    const messages = [{ role: "system", content: systemPrompt }];

    // 添加历史对话（限制最近 20 轮，避免 token 超限）
    const recentHistory = conversationHistory.slice(-20);
    for (const h of recentHistory) {
      messages.push({ role: h.role, content: h.content });
    }

    // 添加当前用户消息
    messages.push({ role: "user", content: trimmedMessage });

    // ===== 4. 调用混元 API =====
    let reply;
    let aiOk = false;

    if (config.isApiKeyValid()) {
      try {
        const result = await hunyuanService.chatCompletion(messages);
        reply = result.content;
        aiOk = true;
      } catch (apiErr) {
        console.error("[混元 API 调用失败]", apiErr.message);
      }
    }

    // ===== 5. 兜底回复 =====
    if (!reply) {
      reply = getFallbackReply(identity, gameState);
    }

    // ===== 6. 解析 AI 回复 =====
    const psychologyTag = analyzePsychologyTag(reply, gameState);
    const trustDelta = calculateTrustDelta(reply, gameState);
    // 任务检测按「身份 + 对话角色」隔离进度（多角色并行互不干扰）
    const sessionKey = conversationId ? `${identity}:${conversationId}` : (lastNode || identity);
    const taskUpdate = detectTaskUpdate(trimmedMessage, reply, tasks, {
      ...gameState,
      lastNode: sessionKey,
    });
    const nextScene = detectSceneTransition(reply, gameState);
    const isEnding = nextScene === "ending";

    // ===== 6.5 AI 辅助结局判定（每次选择后生成概率分布） =====
    const endingPrediction = endingService.predictEndingSync({
      trust: trustValue,
      evidence,
      xiaoya,
      reportedLaok,
      transferred,
      route,
      currentDay,
    });

    // ===== 7. 返回结果 =====
    return res.json({
      success: true,
      reply,
      conversationId,
      psychologyTag,
      trustDelta,
      taskUpdate,
      nextScene,
      isEnding,
      endingPrediction,
      meta: {
        identity,
        conversationId,
        currentDay,
        aiGenerated: aiOk,
        model: aiOk ? config.hunyuan.model : "fallback",
      },
    });
  } catch (err) {
    console.error("[handleChat] 未预期错误:", err);
    return res.status(500).json({
      success: false,
      error: "服务器内部错误，请稍后重试",
    });
  }
}

/* ================================================================
 * 健康检查接口
 * ================================================================ */
async function handleHealth(req, res) {
  const apiConfigured = config.isApiKeyValid();
  let apiStatus = { ok: false, model: config.hunyuan.model };

  if (apiConfigured) {
    apiStatus = await hunyuanService.healthCheck();
  }

  return res.json({
    status: "ok",
    service: "异次元梦想局 · AI 对话服务",
    version: "3.0.0",
    apiConfigured,
    api: apiStatus,
  });
}

module.exports = {
  handleChat,
  handleHealth,
};
