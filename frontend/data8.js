/* 异次元梦想局 · V8.0 数据层
 * 任务驱动 × 完整五幕（希望/崩塌/废墟/回放/盾牌）× 25-35 轮分支叙事
 * 6 身份 × 多角色对话网络 × 反卧底 AI × 身份解锁 × 身份专属结局
 */

/* ===================== 五幕定义（色彩随情绪变化） ===================== */
const ACTS = {
  hope:     { n: 1, name: "希望", sub: "建立信任，放下防备", c1: "#2A1A12", c2: "#3A2418", accent: "#FF6B35", mood: "暖橙 · 粉" },
  collapse: { n: 2, name: "崩塌", sub: "骗子消失，多重打击接踵而至", c1: "#1A1A2E", c2: "#2A2A38", accent: "#9AA0B5", mood: "冷灰 · 深蓝" },
  ruins:    { n: 3, name: "废墟", sub: "四个行动，学习如何应对", c1: "#2A1414", c2: "#3A1E1E", accent: "#FFD700", mood: "暗红 · 暖黄" },
  replay:   { n: 4, name: "回放", sub: "时间线 + 心理学标注", c1: "#1A1D28", c2: "#222838", accent: "#DC143C", mood: "中性白 · 警示红" },
  shield:   { n: 5, name: "盾牌", sub: "个性化报告 + 防骗工具箱", c1: "#0E2236", c2: "#123049", accent: "#1E90FF", mood: "科技蓝 · 安全绿" },
};

/* ===================== 身份系统 + 解锁规则 ===================== */
const IDENTITIES = {
  hunter: {
    id: "hunter", codename: "猎鹰", role: "卧底警察", name: "林晨",
    color: "#FF6B35", star: 5, risk: "极高", days: 7,
    avatar: "鹰",
    mission: "打入“恒盈量化”诈骗团伙内部，收集证据并配合收网",
    danger: "被识破将面临人身威胁",
    handler: { key: "laok", name: "老K", desc: "唯一知道你身份的人" },
    brief: [
      "添加目标“张浩”为好友，完成 3 轮对话",
      "在对话中套出“投资项目”名称",
      "确认张浩上级（“舅舅/上线”）信息",
      "⚠️ 紧急：联系小雅，阻止她继续转账",
      "保存转账/收益证据，等待收网指令",
    ],
    oath: "“7天，只许成功，不许失败。”",
    exp: "紧张刺激的卧底体验",
    scamTypes: ["pig_butcher", "fake_invest"],
    act: "hope",
  },
  scribe: {
    id: "scribe", codename: "笔锋", role: "记者调查员", name: "苏晚",
    color: "#2C7BE5", star: 4, risk: "高", days: 5,
    avatar: "笔",
    mission: "调查诈骗产业链，撰写深度报道",
    danger: "被威胁将被迫放弃调查",
    handler: { key: "editor", name: "主编老陆", desc: "你的选题负责人" },
    brief: [
      "取得受害者“小雅”的信任",
      "收集 5 个骗术套路",
      "假装受害者接触“张浩”",
      "锁定“上线”真实信息",
    ],
    oath: "“真相，值得我冒这个险。”",
    exp: "揭开黑幕的使命感",
    scamTypes: ["fake_invest", "brushing", "impersonate_police"],
    act: "hope",
  },
  lighthouse: {
    id: "lighthouse", codename: "灯塔", role: "反诈志愿者", name: "赵暖",
    color: "#07C160", star: 3, risk: "中", days: 5,
    avatar: "塔",
    mission: "在骗局中及时提醒正在被骗的人",
    danger: "被报复将导致个人信息泄露",
    handler: { key: "coord", name: "站长阿妮", desc: "反诈志愿站负责人" },
    brief: [
      "劝说“小雅”停止转账",
      "识别当前骗局阶段",
      "安抚受害者情绪",
      "向警方提供骗子线索",
    ],
    oath: "“哪怕只救回一个人，也值得。”",
    exp: "助人者的责任感",
    scamTypes: ["fake_cs", "fake_credit", "game_trade"],
    act: "hope",
  },
  drift: {
    id: "drift", codename: "浮萍", role: "普通网友", name: "你自己",
    color: "#9B59B6", star: 2, risk: "高", days: 4,
    avatar: "萍",
    mission: "在社交平台上正常生活，偶遇骗子",
    danger: "放松警惕将损失金钱",
    handler: null,
    brief: [
      "完成 3 轮日常对话",
      "判断对方是否可信",
      "识别骗术类型",
      "全身而退",
    ],
    oath: "“我只是想认识个朋友而已。”",
    exp: "原设计的沉浸体验",
    scamTypes: ["pig_butcher", "brushing", "fake_shop"],
    act: "hope",
  },
  seeker: {
    id: "seeker", codename: "寻人", role: "受害者的朋友", name: "方寻",
    color: "#E67E22", star: 4, risk: "中高", days: 4,
    avatar: "寻",
    mission: "寻找失联的好友“陈露”",
    danger: "自己也可能被骗子困住",
    handler: { key: "police110", name: "值班民警", desc: "报案后对接的警官" },
    brief: [
      "找到朋友最后的线索",
      "假装汇款取得骗子信任",
      "锁定朋友被困地点",
      "在不激怒骗子的前提下报警",
    ],
    oath: "“陈露，等我，我一定把你找回来。”",
    exp: "急迫感和情感驱动",
    scamTypes: ["dating", "impersonate_boss"],
    act: "hope",
  },
  mole: {
    id: "mole", codename: "鼹鼠", role: "内部线人", name: "周深",
    color: "#7F8C8D", star: 5, risk: "极高", days: 5,
    avatar: "鼠",
    mission: "潜伏诈骗窝点，为警方提供情报",
    danger: "身份暴露将无法脱身",
    handler: { key: "laok", name: "老K", desc: "线上唯一联络人" },
    brief: [
      "摸清团队结构",
      "记录诈骗完整流程",
      "锁定团队负责人",
      "在暴露前传出关键证据",
    ],
    oath: "“我在他们中间，但我不是他们。”",
    exp: "最危险的体验",
    scamTypes: ["fake_invest", "impersonate_police", "brushing"],
    act: "hope",
  },
};

/* 身份解锁：完成指定线后解锁（首次仅猎鹰）
 * unlockBy[key] = 解锁该身份所需完成的线（任意其一/或计数）
 */
const UNLOCK_RULES = {
  hunter:   { type: "default", desc: "首次游戏默认解锁" },
  scribe:   { type: "finish", ids: ["hunter"], desc: "完成猎鹰线任意结局" },
  lighthouse:{ type: "ending", ids: ["hunter"], endingGood: true, desc: "完成猎鹰线“成功收网”结局" },
  drift:    { type: "finish", ids: ["scribe"], desc: "完成笔锋线任意结局" },
  seeker:   { type: "count", n: 2, desc: "完成任意 2 条线" },
  mole:     { type: "count", n: 3, desc: "完成任意 3 条线" },
};

/* ===================== 角色（对话对象）通用档案 ===================== */
const ACTORS = {
  zhanghao: { name: "张浩", type: "target", role: "目标骗子", color: "#DC143C", avatar: "浩", tagline: "自称“金融项目负责人”" },
  lijie:    { name: "李姐", type: "accomplice", role: "骗子同伙", color: "#C0392B", avatar: "李", tagline: "群里最活跃的“成功学员”" },
  laok:     { name: "老K", type: "handler", role: "警方联络人", color: "#2C7BE5", avatar: "K", tagline: "你的上家" },
  editor:   { name: "主编老陆", type: "handler", role: "报社主编", color: "#2C7BE5", avatar: "陆", tagline: "你的选题负责人" },
  coord:    { name: "站长阿妮", type: "handler", role: "志愿站长", color: "#2C7BE5", avatar: "妮", tagline: "反诈志愿站负责人" },
  police110:{ name: "值班民警", type: "handler", role: "警方", color: "#2C7BE5", avatar: "警", tagline: "报案对接人" },
  xiaoya:   { name: "小雅", type: "victim", role: "疑似受害者", color: "#F0A020", avatar: "雅", tagline: "刚投了 3 万的姑娘" },
  chenlu:   { name: "陈露", type: "victim", role: "失联好友", color: "#F0A020", avatar: "露", tagline: "你要找的人" },
  anon:     { name: "匿名X", type: "informant", role: "神秘线人", color: "#8E44AD", avatar: "X", tagline: "只在深夜出现" },
};

/* ===================== 反卧底检测规则 ===================== */
const ANTI_UNDERCOVER = {
  keywords: [
    { re: /警察|卧底|证据|录音|录屏|举报|调查|抓|派出所|公安/, add: 40, line: "你……在录音？还是你是来查我的？（对方语气突然冷了下来）" },
    { re: /你是谁|你到底|真名|身份证|营业执照|你公司在哪/, add: 22, line: "你怎么对我这么好奇？普通朋友哪问这些。" },
    { re: /骗|诈骗|假的|不信|忽悠/, add: 25, line: "你话里有话啊，是不信我？那算了。" },
  ],
  overQuestion: { add: 12, line: "你问得也太细了，怎么像在做笔录一样。" },
  overCompliant: { add: 15, line: "你太配合了，配合得有点不正常……你不会有别的目的吧？" },
  threshold: 60,
};

/* ===================== 平行宇宙样本（回放时输入替代回复用） ===================== */
const PARALLEL_SAMPLES = {
  hunter: [
    { q: "如果当时你拒绝了‘帮忙操作账户’……", a: "张浩会先恼火再换话术，但已无法推进收割，老K 会让你继续周旋取证。" },
    { q: "如果你在第一轮就问他‘你是骗子吧’……", a: "他会立刻冷淡、减少分享，警觉值拉满，很可能提前换号——你拿不到证据。" },
  ],
  default: [
    { q: "如果当时你选择了‘拒绝’……", a: "对方会尝试挽留或更换说辞，但你的防备心已经亮起红灯。" },
    { q: "如果当时你直接报警……", a: "局面会提前转入干预，骗局在萌芽阶段被掐断，代价是错过更深层证据。" },
  ],
};

/* ===================== 第三幕·废墟 四个行动 ===================== */
const RUINS_ACTIONS = [
  { id: "police", ic: "🚔", t: "报警", d: "模拟报警对话 → 生成报案话术模板", tip: "✅ 你已完成【报警】模拟。真实情况中，请拨打 110 或 96110，保留好聊天记录和转账凭证。", phone: "110 / 96110" },
  { id: "stop", ic: "🔒", t: "止损", d: "模拟冻结银行卡 → 修改密码流程", tip: "✅ 你已完成【止损】模拟。立即冻结银行卡、修改密码、关闭免密支付，能拦住大部分后续损失。", phone: "银行客服 / 云闪付一键查卡" },
  { id: "mind", ic: "💚", t: "心理支持", d: "心理援助热线 → 安慰与疏导", tip: "✅ 你已完成【心理支持】模拟。被诈骗不是你的错，可拨打 12320 转心理援助，给自己一点时间。", phone: "12320 转心理援助" },
  { id: "family", ic: "👨‍👩‍👦", t: "告诉家人", d: "AI 扮演家人 → 模拟坦白对话", tip: "✅ 你已完成【告诉家人】模拟。“说出来，比憋着强”——家人的支持是最好的缓冲。", phone: "你信任的人" },
];

/* ===================== 剧情 ===================== */
/* 节点字段：speaker / day / phase(心理学手段) / act(所属幕) / trust(信任变化) /
 *   exposure(暴露度定性等级 0-4) / grant(完成任务id) / xiaoya(小雅救援+1) /
 *   options:[{text, tone, trust, susp, evidence, grant, xiaoya, next, ending}]
 * 结局字段：title / good / route / text / review
 */

const STORIES = {

  /* ============ 卧底警察·猎鹰（完整 25-35 轮 Day1-5 分支） ============ */
  hunter: {
    scene: "深夜的出租屋，手机屏幕是唯一的光。",
    actors: ["laok", "zhanghao", "xiaoya", "anon"],
    hasXiaoya: true,
    tasks: [
      { id: "t1", title: "建立联系（3轮对话）", cond: null },
      { id: "t2", title: "获取投资项目名称", cond: "t1" },
      { id: "t3", title: "确认张浩上级信息", cond: "t2" },
      { id: "t4", title: "⚠️ 联系小雅阻止转账", cond: "t2" },
      { id: "t5", title: "保存转账/收益证据", cond: "t4" },
      { id: "t6", title: "等待收网指令", cond: "t5" },
    ],
    start: "laok_1",
    nodes: {
      /* Day 1 */
      laok_1: { speaker: "laok", day: 1, phase: "任务下达", act: "hope",
        text: "猎鹰，收到请回复。目标锁定“张浩”，混元资本诈骗团伙中层。你的任务：加他好友，取得信任，摸清上线。7天，别暴露。",
        options: [
          { text: "收到，马上行动。", tone: "neutral", trust: 0, next: "add_zhang" },
          { text: "他要是起疑怎么办？", tone: "cautious", trust: 0, next: "laok_2" },
        ] },
      laok_2: { speaker: "laok", day: 1, phase: "行前叮嘱", act: "hope",
        text: "记住：别问太细，别太配合，像个真人。他们对“太主动”的人最警觉。出事拨紧急联络。",
        options: [ { text: "明白，我上了。", tone: "neutral", trust: 0, next: "add_zhang" } ] },
      add_zhang: { speaker: "zhanghao", day: 1, phase: "寻猪·建立联系", act: "hope", grant: "t1",
        text: "你好呀，看你的头像好亲切。我也是做金融的，平时太忙了，很少主动加人。",
        options: [
          { text: "好呀！我也想认识你。", tone: "warm", trust: 15, susp: 2, next: "zh_d1_2" },
          { text: "你是做什么工作的？", tone: "neutral", trust: 5, susp: 4, next: "zh_d1_2" },
          { text: "你是骗子吧？", tone: "cautious", trust: -20, susp: 30, next: "zh_d1_alert" },
          { text: "📋 先报告老K再决定。", tone: "counter", trust: 0, susp: 0, next: "laok_brief" },
        ] },
      zh_d1_alert: { speaker: "zhanghao", day: 1, phase: "寻猪·防御", act: "hope",
        text: "……哈？你想多了吧，我就是个普通人。算了，可能咱俩聊不来。",
        options: [
          { text: "抱歉，我说话直，交个朋友嘛。", tone: "warm", trust: 5, susp: 2, next: "zh_d1_2" },
          { text: "（沉默，不再回复）", tone: "cautious", trust: -5, next: "zh_d1_2" },
        ] },
      laok_brief: { speaker: "laok", day: 1, phase: "干预", act: "hope",
        text: "猎鹰，先接触、别急着上报。你还没进到核心，沉住气。去加他。",
        options: [ { text: "好，我去加。", tone: "neutral", trust: 0, next: "zh_d1_2" } ] },
      zh_d1_2: { speaker: "zhanghao", day: 1, phase: "日常共情", act: "hope",
        text: "今天刚开完一个项目会，好累。你做什么工作的呀？",
        options: [
          { text: "我也在金融圈边缘混，平时挺忙的。", tone: "warm", trust: 8, next: "zh_d1_3" },
          { text: "做点小生意，你呢？", tone: "neutral", trust: 3, next: "zh_d1_3" },
        ] },
      zh_d1_3: { speaker: "zhanghao", day: 1, phase: "信息采集", act: "hope",
        text: "我在上海打拼5年了。你呢？在哪座城市？",
        options: [
          { text: "我在上海，一个人在外。", tone: "warm", trust: 8, exposure: 1, next: "zh_d1_4" },
          { text: "外地，不方便说太细。", tone: "cautious", trust: 0, next: "zh_d1_4" },
        ] },
      zh_d1_4: { speaker: "zhanghao", day: 1, phase: "制造共情", act: "hope",
        text: "一个人在上海，有时候真的挺孤独的。",
        options: [
          { text: "我也是，下班后家里就自己一个人。", tone: "warm", trust: 10, exposure: 1, next: "zh_d1_5" },
          { text: "习惯就好啦。", tone: "neutral", trust: 2, next: "zh_d1_5" },
        ] },
      zh_d1_5: { speaker: "zhanghao", day: 1, phase: "拉近距离", act: "hope",
        text: "周末一般做什么？我喜欢去江边跑步。",
        options: [
          { text: "我也爱跑步！下次一起？", tone: "warm", trust: 5, exposure: 1, next: "zh_d2_1" },
          { text: "宅着刷手机。", tone: "neutral", trust: 1, next: "zh_d2_1" },
        ] },

      /* Day 2 */
      zh_d2_1: { speaker: "zhanghao", day: 2, phase: "情感绑定", act: "hope",
        text: "刚才开会时还在想你说的话……感觉遇到聊得来的人了。",
        options: [
          { text: "我也觉得跟你聊特别舒服。", tone: "warm", trust: 8, exposure: 2, next: "zh_d2_2" },
          { text: "哈哈还好啦。", tone: "neutral", trust: 2, next: "zh_d2_2" },
        ] },
      zh_d2_2: { speaker: "zhanghao", day: 2, phase: "特殊性制造", act: "hope",
        text: "我好久没遇到聊得来的人了，你挺特别的。",
        options: [
          { text: "被你这么说，我有点心动。", tone: "warm", trust: 8, exposure: 2, next: "zh_d2_3" },
          { text: "你嘴真甜。", tone: "neutral", trust: 3, next: "zh_d2_3" },
        ] },
      zh_d2_3: { speaker: "zhanghao", day: 2, phase: "细节渗透", act: "hope",
        text: "分享一首歌给你，我刚在听的。（发来链接）挺安静的，像现在的深夜。",
        options: [
          { text: "好听，我也喜欢这种调调。", tone: "warm", trust: 3, next: "zh_d2_4" },
          { text: "嗯，记下了。", tone: "neutral", trust: 1, next: "zh_d2_4" },
        ] },
      zh_d2_4: { speaker: "zhanghao", day: 2, phase: "镜像匹配", act: "hope",
        text: "你发的那个朋友圈，我也有同感——都想有个依靠吧。",
        options: [
          { text: "对，一个人扛太久了。", tone: "warm", trust: 8, exposure: 2, next: "zh_d2_5" },
          { text: "还好啦，习惯了。", tone: "cautious", trust: 0, next: "zh_d2_5" },
        ] },
      zh_d2_5: { speaker: "zhanghao", day: 2, phase: "激发保护欲", act: "hope",
        text: "其实我前女友因为我不够陪伴，离开了我。说起来有点丢人。",
        options: [
          { text: "她不懂你，你值得更好的。", tone: "warm", trust: 15, exposure: 3, next: "zh_d2_6" },
          { text: "那你现在走出来了吗？", tone: "cautious", trust: 5, next: "zh_d2_6" },
          { text: "我不想听你的感情史。", tone: "cautious", trust: -10, susp: 0, next: "zh_d2_6" },
        ] },
      zh_d2_6: { speaker: "zhanghao", day: 2, phase: "欲擒故纵", act: "hope",
        text: "不说这些了，认识你真的很开心。对了——我舅是搞证券的，偶尔有内部消息，跟着操作的朋友都小赚了。",
        options: [
          { text: "内部消息？什么项目啊？", tone: "warm", trust: 6, susp: 6, grant: "t2", next: "xiaoya_intro" },
          { text: "哦？最近行情怎么样。", tone: "neutral", trust: 3, next: "xiaoya_intro" },
          { text: "什么项目、什么平台、准确率多少？", tone: "cautious", trust: -2, susp: 22, grant: "t2", next: "xiaoya_intro" },
        ] },

      /* 小雅支线引入 */
      xiaoya_intro: { speaker: "xiaoya", day: 2, phase: "外部干预·求助", act: "hope",
        text: "你好……我是小雅。张浩说你也是他朋友？我最近在他介绍的平台投了点钱，有点慌，能聊聊吗？",
        options: [
          { text: "你投了多少？别再转了。", tone: "counter", trust: 0, xiaoya: 1, next: "zh_d3_1" },
          { text: "我也刚认识他，一起看看。", tone: "neutral", trust: 0, xiaoya: 1, next: "zh_d3_1" },
        ] },

      /* Day 3 */
      zh_d3_1: { speaker: "zhanghao", day: 3, phase: "依恋置换", act: "hope",
        text: "姐姐以后有弟弟在，你不需要一个人扛。",
        options: [
          { text: "你这句话，让我有点想哭。", tone: "warm", trust: 15, exposure: 3, next: "zh_d3_2" },
          { text: "别乱叫姐姐啦。", tone: "neutral", trust: 3, next: "zh_d3_2" },
        ] },
      zh_d3_2: { speaker: "zhanghao", day: 3, phase: "独特性强化", act: "hope",
        text: "我从来没见过像你这么懂我的人。",
        options: [
          { text: "因为我们是一类人吧。", tone: "warm", trust: 10, exposure: 3, next: "zh_d3_3" },
          { text: "（笑笑不说话）", tone: "neutral", trust: 2, next: "zh_d3_3" },
        ] },
      zh_d3_3: { speaker: "zhanghao", day: 3, phase: "情感升级", act: "hope",
        text: "昨天晚上失眠了，一直在想你。",
        options: [
          { text: "我也是，翻来覆去睡不着。", tone: "warm", trust: 8, exposure: 4, next: "zh_d3_4" },
          { text: "想我啥呢。", tone: "neutral", trust: 2, next: "zh_d3_4" },
        ] },
      zh_d3_4: { speaker: "zhanghao", day: 3, phase: "信息钓鱼", act: "hope",
        text: "我有个朋友在证券公司，他说最近有个内部消息……稳赚的。",
        options: [
          { text: "什么消息？能带我吗？", tone: "warm", trust: 20, susp: 4, grant: "t3", next: "zh_d3_5" },
          { text: "是投资吗？我不太懂。", tone: "cautious", trust: 5, grant: "t3", next: "zh_d3_5" },
          { text: "你有内部消息还敢告诉我？", tone: "cautious", trust: 10, susp: 14, grant: "t3", next: "zh_d3_5" },
          { text: "我觉得这事不太靠谱。", tone: "cautious", trust: -10, susp: 6, next: "zh_d3_5" },
        ] },
      zh_d3_5: { speaker: "zhanghao", day: 3, phase: "制造悬念", act: "hope",
        text: "但我觉得这种事还是不说的好……算了，信得过你才跟你提的。",
        options: [
          { text: "我嘴很严的，你放心。", tone: "warm", trust: 10, exposure: 4, next: "zh_d4_1" },
          { text: "行，听你的。", tone: "neutral", trust: 4, next: "zh_d4_1" },
        ] },

      /* Day 4 */
      zh_d4_1: { speaker: "zhanghao", day: 4, phase: "权威背书", act: "hope",
        text: "我舅舅是证券公司的副总，他最近在操作一个项目，叫“恒盈量化”。",
        options: [
          { text: "恒盈量化？听起来厉害。", tone: "warm", trust: 8, susp: 2, next: "zh_d4_2" },
          { text: "副总亲自带单？", tone: "cautious", trust: 5, next: "zh_d4_2" },
        ] },
      zh_d4_2: { speaker: "zhanghao", day: 4, phase: "独家性", act: "hope",
        text: "我只跟你一个人说过这个。你别告诉别人哈。",
        options: [
          { text: "放心，这是我们俩的秘密。", tone: "warm", trust: 8, exposure: 4, next: "zh_d4_3" },
          { text: "嗯，知道分寸。", tone: "neutral", trust: 3, next: "zh_d4_3" },
        ] },
      zh_d4_3: { speaker: "zhanghao", day: 4, phase: "制造依赖", act: "hope",
        text: "但我是内部人员，不能自己操作。你能帮我登一下我的账户看看吗？",
        options: [
          { text: "行，账号发我。（记下，取证）", tone: "neutral", trust: 5, evidence: true, susp: 4, grant: "t3", next: "zh_d4_4" },
          { text: "为什么你自己不能登？", tone: "cautious", trust: 2, susp: 18, next: "zh_d4_4" },
        ] },
      zh_d4_4: { speaker: "zhanghao", day: 4, phase: "核心陷阱", act: "hope",
        text: "我上面是“陈总”，很少露面。这是他号，就说我介绍的。（发来账号）你先充 5000 试水，赚了算你的。",
        options: [
          { text: "好，截图留着。（保存证据）", tone: "neutral", trust: 5, evidence: true, susp: 4, grant: "t4", next: "xiaoya_sos" },
          { text: "充五千？我考虑下。", tone: "cautious", trust: 4, next: "xiaoya_sos" },
        ] },
      xiaoya_sos: { speaker: "xiaoya", day: 4, phase: "外部干预·紧急", act: "hope",
        text: "救救我……我投了3万，现在提现要再交5万‘保证金’，我没钱了。张浩说我是自己放弃的。我该怎么办？",
        options: [
          { text: "千万别再交！我帮你报警。", tone: "counter", trust: 0, xiaoya: 2, grant: "t4", next: "zh_d5_1" },
          { text: "你先把聊天记录都截给我。", tone: "neutral", trust: 0, xiaoya: 1, next: "zh_d5_1" },
        ] },
      zh_d5_1: { speaker: "zhanghao", day: 5, phase: "杀猪·催促转账", act: "hope",
        text: "小雅刚投了3万，今天账面涨了。你别犹豫，机会不等人。把钱转这个账户，我帮你盯。",
        options: [
          { text: "我先转 5000 试试。（取证）", tone: "neutral", trust: 6, evidence: true, susp: 6, grant: "t5", next: "zh_final_pre" },
          { text: "我再想想，钱这两天有点紧。", tone: "cautious", trust: 4, next: "zh_final_pre" },
          { text: "这不就是让我把钱打给你吗？", tone: "cautious", trust: -5, susp: 26, next: "zh_final_pre" },
        ] },
      zh_final_pre: { speaker: "laok", day: 6, phase: "收网前夜", act: "hope",
        text: "猎鹰，证据够了。今晚 24 点收网。你稳住张浩，别让他跑，也别让他起疑。小雅那边我们接手了。",
        options: [
          { text: "收到，我拖住他。", tone: "neutral", trust: 0, grant: "t6", next: "zh_final" },
          { text: "他好像有点怀疑我了……", tone: "cautious", trust: 0, grant: "t6", next: "zh_final" },
        ] },
      zh_final: { speaker: "zhanghao", day: 7, phase: "杀猪·最后试探", act: "hope",
        text: "你今天怎么话这么少？我总觉得你哪里不对劲……你老实说，你不会是来查我的吧？",
        options: [
          { text: "查你？我巴不得快点赚钱，你别多心。", tone: "warm", trust: 4, susp: 4, route: "arrest", ending: "E03" },
          { text: "被你发现了，我就是卧底。", tone: "counter", trust: 0, susp: 100, route: "expose", ending: "E07" },
          { text: "（沉默，不知道怎么回）", tone: "neutral", trust: -8, susp: 30, route: "fail", ending: "E08" },
          { text: "📋 老K，收网！（上报）", tone: "counter", trust: 0, route: "arrest", ending: "E03" },
        ] },

      /* 被骗线（信任过高触发） */
      scammed_node: { speaker: "zhanghao", day: 7, phase: "杀猪·完成收割", act: "hope",
        text: "好弟弟，你帮我操作一下账户，赚了算你的——快点，漏洞三天后修复。",
        options: [
          { text: "好，我帮你操作。", tone: "warm", trust: 10, route: "scammed", ending: "E01" },
          { text: "我考虑一下……", tone: "cautious", trust: 0, route: "scammed", ending: "E02" },
        ] },
    },
    endings: {
      E01: { title: "E01 · 被骗", good: false, route: "scammed",
        text: "转账成功。你“帮”张浩操作的那一刻，也把自己的积蓄转了出去。三天后，漏洞“修复”，张浩消失，账户清零。你完全信了。",
        review: "再深的卧底，只要动了“我也赚一点”的念头，就落入了杀猪盘最深的陷阱——把你变成共犯。" },
      E02: { title: "E02 · 被骗（犹豫后）", good: false, route: "scammed",
        text: "你说“考虑一下”，张浩天天嘘寒问暖、制造紧迫，第七天你还是点了转账。你明明犹豫过，却还是没逃掉。",
        review: "犹豫不是免疫。骗子最擅长的，就是把你的犹豫熬成顺从。" },
      E03: { title: "E03 · 成功收网", good: true, route: "arrest",
        text: "24 点整，警方同步收网。你提交的聊天记录、转账凭证、上线账号成为关键证据，“恒盈量化”团伙 11 人落网。你稳住了张浩，直到警灯亮起。",
        review: "现实中没有“主角光环”。普通人遇到“张浩”，最该做的不是周旋，而是立刻挂断、报警。" },
      E04: { title: "E04 · 反被利用", good: false, route: "fail",
        text: "你的沉默被张浩解读为“心动”。他趁机让你“先转5千验证诚意”，你恍惚间差点击下确认。等你回过神，才发现自己几乎从猎人变成猎物。",
        review: "“我以为我在钓鱼，其实鱼在钓我。”——被骗从不是因为傻，而是因为骗子比你更懂你的处境。" },
      E05: { title: "E05 · 营救成功", good: true, route: "arrest",
        text: "你既稳住了张浩、又抢在收网前救下小雅。她止损报案，还指认了“保证金”话术。两条线都赢了——你救了别人，也救了自己。",
        review: "劝阻的关键，是戳破“沉没成本”与“他对我好”的幻觉。你两边都做到了。" },
      E06: { title: "E06 · 骗子换号", good: false, route: "alert",
        text: "你过早质疑，张浩警觉值爆表，第二天就换了号消失。你没被骗，但线索也断了，老K 只能另起炉灶。",
        review: "太早亮底牌，打草惊蛇。取证讲究“温水煮青蛙”，逼得太急只会让骗子溜走。" },
      E07: { title: "E07 · 卧底暴露", good: false, route: "expose",
        text: "你的摊牌让张浩瞬间清空聊天、拉黑、失联。团伙连夜转移，你的位置也可能已被盯上。老K 只有一句：“撤，马上撤。”",
        review: "一句话就能毁掉七天。骗子对“异常”极其敏感——这正是反诈强调“不接触、不周旋、直接报警”。" },
      E08: { title: "E08 · 任务失败", good: false, route: "fail",
        text: "你卡在中间，既没上报也没收网。收网夜张浩察觉不对提前跑路，证据链断裂。如果你再快一点……",
        review: "犹豫的代价，是整条线索的流失。关键时刻，选择比完美更重要。" },
    },
  },

  /* ============ 记者调查员·笔锋 ============ */
  scribe: {
    scene: "报社的深夜，只有你桌上一盏灯。",
    actors: ["editor", "xiaoya", "zhanghao"],
    hasXiaoya: false,
    tasks: [
      { id: "t1", title: "取得“小雅”信任", cond: null },
      { id: "t2", title: "收集骗术套路", cond: "t1" },
      { id: "t3", title: "假装受害者接触张浩", cond: "t2" },
      { id: "t4", title: "锁定上线真实信息", cond: "t3" },
    ],
    start: "ed_1",
    nodes: {
      ed_1: { speaker: "editor", day: 1, phase: "选题下达", act: "hope",
        text: "苏晚，这组“杀猪盘”产业链的稿子交给你。先找到受害者小雅，别惊动骗子。安全第一，稿子第二。",
        options: [
          { text: "我知道分寸，这就联系她。", tone: "neutral", trust: 0, next: "xy_1" },
          { text: "要是骗子发现记者在查呢？", tone: "cautious", trust: 0, next: "ed_2" },
        ] },
      ed_2: { speaker: "editor", day: 1, phase: "叮嘱", act: "hope",
        text: "所以你别暴露记者身份，就当一个也差点被骗的人。共情，别审问。",
        options: [ { text: "明白。", tone: "neutral", trust: 0, next: "xy_1" } ] },
      xy_1: { speaker: "xiaoya", day: 2, phase: "接触受害者", act: "hope", grant: "t1",
        text: "你也在恒盈量化投了吗？我投了3万，现在提不出来，好慌……你说这是不是骗人的？",
        options: [
          { text: "我也差点投，你先别再转钱了。", tone: "warm", trust: 0, next: "xy_2" },
          { text: "你从头说说，他怎么一步步让你投的？", tone: "neutral", trust: 0, grant: "t2", next: "xy_2" },
        ] },
      xy_2: { speaker: "xiaoya", day: 3, phase: "还原套路", act: "hope",
        text: "他先加我聊感情，再说舅舅是证券的，拉我进群看‘老师带单’，第一次让我赚了800……我就信了。",
        options: [
          { text: "把他微信号给我，我去会会他。", tone: "counter", trust: 0, grant: "t3", next: "zh_1" },
          { text: "这些截图能发我留证吗？", tone: "neutral", trust: 0, next: "zh_1" },
        ] },
      zh_1: { speaker: "zhanghao", day: 4, phase: "假装受害者", act: "hope",
        text: "小雅介绍的？她是我们的老客户了。你也想跟着老师赚点？先加我，我带你。",
        options: [
          { text: "想啊，你上线老师是谁？靠谱吗？", tone: "cautious", trust: 2, susp: 16, grant: "t4", next: "zh_2" },
          { text: "行，怎么操作？（套流程）", tone: "neutral", trust: 3, susp: 6, next: "zh_2" },
        ] },
      zh_2: { speaker: "zhanghao", day: 5, phase: "露出马脚", act: "hope",
        text: "老师就是‘陈总’，别管那么多。你先充5万，晚了名额就没了——你不会也是来打听事的记者吧？",
        options: [
          { text: "怎么会，我这就准备钱。（稳住，收尾）", tone: "warm", trust: 4, susp: 4, route: "arrest", ending: "E01" },
          { text: "是又怎样？我就是来揭穿你的。", tone: "counter", trust: 0, susp: 100, route: "expose", ending: "E02" },
          { text: "……要不我再想想。（迟疑）", tone: "cautious", trust: -3, susp: 20, route: "fail", ending: "E03" },
        ] },
    },
    endings: {
      E01: { title: "E01 · 发表报道", good: true, route: "arrest",
        text: "你拿到了完整的话术链条和资金去向。《三万块与一个消失的“陈总”》见报，全网转发，警方顺线介入。你没暴露，稿子救了更多“小雅”。",
        review: "记者的克制，就是最好的武器。真相不靠对骂赢得，靠证据。" },
      E02: { title: "E02 · 被威胁", good: false, route: "expose",
        text: "张浩截图存证，反手举报你“钓鱼采访”，还有人开始打听你的住址。主编让你停稿避风头。你赢了口舌，输了报道。",
        review: "情绪上头的一句“揭穿你”，可能让几个月的调查前功尽弃。" },
      E03: { title: "E03 · 妥协", good: false, route: "fail",
        text: "你的迟疑被对方拿捏，几天后你收到一笔“封口费”和一句“合作愉快”。稿子没发，你盯着屏幕，第一次觉得真相这么沉。",
        review: "有些代价，比钱更重。" },
    },
  },

  /* ============ 反诈志愿者·灯塔 ============ */
  lighthouse: {
    scene: "反诈志愿站的值班室，消息不停地弹。",
    actors: ["coord", "xiaoya", "zhanghao"],
    hasXiaoya: true,
    tasks: [
      { id: "t1", title: "劝住“小雅”停止转账", cond: null },
      { id: "t2", title: "识别当前骗局阶段", cond: "t1" },
      { id: "t3", title: "安抚受害者情绪", cond: "t2" },
      { id: "t4", title: "向警方提供线索", cond: "t3" },
    ],
    start: "co_1",
    nodes: {
      co_1: { speaker: "coord", day: 1, phase: "接到求助", act: "hope",
        text: "灯塔，有个姑娘小雅在群里问‘提现不了怎么办’，八成正在被杀猪盘收割。你去接一下，别吓着她。",
        options: [ { text: "我马上联系她。", tone: "neutral", trust: 0, next: "xy_1" } ] },
      xy_1: { speaker: "xiaoya", day: 1, phase: "危机中", act: "hope",
        text: "客服说要再交5万‘保证金’才能提现，我已经投了3万了……不交前面的钱是不是就没了？我该怎么办啊？",
        options: [
          { text: "别再转了！这就是典型‘杀猪盘’，钱越交越多。", tone: "counter", trust: 0, xiaoya: 1, grant: "t1", next: "xy_2" },
          { text: "你先冷静，把对方话术发我看看。", tone: "warm", trust: 0, xiaoya: 1, grant: "t2", next: "xy_2" },
        ] },
      xy_2: { speaker: "xiaoya", day: 2, phase: "动摇", act: "hope",
        text: "可是……他对我特别好，会不会真的只是平台问题？我要是不交，之前的3万不就打水漂了？",
        options: [
          { text: "他对你好，是为了让你交更多。已投的先止损，别再追。", tone: "counter", trust: 0, xiaoya: 1, grant: "t3", next: "xy_3" },
          { text: "我懂你舍不得，但沉没成本不该让你赔更多。", tone: "warm", trust: 0, xiaoya: 1, next: "xy_3" },
        ] },
      xy_3: { speaker: "xiaoya", day: 3, phase: "醒悟", act: "hope",
        text: "……我好像明白了。我把他所有聊天记录、转账截图整理好了，接下来我该做什么？",
        options: [
          { text: "立刻拨96110报警，我帮你把线索同步给民警。", tone: "neutral", trust: 0, xiaoya: 1, grant: "t4", next: "final" },
          { text: "先冻结银行卡，再报警，证据都留好。", tone: "neutral", trust: 0, xiaoya: 1, next: "final" },
        ] },
      final: { speaker: "coord", day: 4, phase: "收尾", act: "hope",
        text: "干得漂亮，灯塔。小雅止损成功，还愿意现身说法。但你也要注意——骗子可能盯上劝阻者。你的信息保护好了吗？",
        options: [
          { text: "我一直用工作号，个人信息没外露。", tone: "cautious", trust: 0, route: "arrest", ending: "E01" },
          { text: "我为了取信她，把私人微信给了她……", tone: "warm", trust: 0, route: "fail", ending: "E02" },
        ] },
    },
    endings: {
      E01: { title: "E01 · 成功救援", good: true, route: "arrest",
        text: "小雅止损、报警，还加入了志愿站现身说法。这个月，你们的小站又拦下了 7 起转账。灯亮着，就有人能靠岸。",
        review: "劝阻的关键：戳破‘沉没成本’与‘他对我好’的幻觉。你做到了。" },
      E02: { title: "E02 · 被报复", good: false, route: "fail",
        text: "小雅得救了，但骗子拿到了你的私人微信，开始骚扰、威胁、人肉。助人没有错，可保护好自己，才能帮更多人。",
        review: "做志愿者也要有‘边界感’：工作与私人身份分离，是自我保护的第一课。" },
    },
  },

  /* ============ 普通网友·浮萍 ============ */
  drift: {
    scene: "周五晚上，你窝在沙发里刷手机。",
    actors: ["zhanghao"],
    hasXiaoya: false,
    tasks: [
      { id: "t1", title: "完成 3 轮日常对话", cond: null },
      { id: "t2", title: "判断对方是否可信", cond: "t1" },
      { id: "t3", title: "识别骗术类型", cond: "t2" },
    ],
    start: "zh_1",
    nodes: {
      zh_1: { speaker: "zhanghao", day: 1, phase: "寻猪·搭讪", act: "hope", grant: "t1",
        text: "你好呀，刷到你觉得挺投缘的，交个朋友？我做金融的，一个人在外地。",
        options: [
          { text: "你好，聊聊也行。", tone: "warm", trust: 8, next: "zh_2" },
          { text: "陌生人加好友都说自己做金融。", tone: "cautious", trust: 0, next: "zh_2" },
        ] },
      zh_2: { speaker: "zhanghao", day: 2, phase: "诱猪·铺垫", act: "hope",
        text: "我舅是证券的，偶尔给点内部消息，跟我的朋友都小赚了。你有兴趣了解下不？",
        options: [
          { text: "内部消息？听着有点心动。", tone: "warm", trust: 10, next: "zh_3" },
          { text: "‘内部消息’‘稳赚’都是老骗术了吧。", tone: "cautious", trust: 0, grant: "t2", next: "zh_3" },
        ] },
      zh_3: { speaker: "zhanghao", day: 3, phase: "养猪·抛饵", act: "hope",
        text: "要不你先充5000试试？我教你操作，两天见收益，赚了请我喝奶茶就行～",
        options: [
          { text: "好呀，怎么充？", tone: "warm", trust: 15, route: "scammed", ending: "E01" },
          { text: "只要涉及先充钱的，我一律拉黑。", tone: "counter", trust: 0, grant: "t3", route: "alert", ending: "E02" },
          { text: "我假装感兴趣，套套他老底。", tone: "cautious", trust: 2, grant: "t3", route: "alert", ending: "E03" },
        ] },
    },
    endings: {
      E01: { title: "E01 · 被骗", good: false, route: "scammed",
        text: "第一次充5000真的“赚”了800，你加投到8万。想提现时账户被冻结，需要再交“保证金”……“张浩”消失了，钱也没了。",
        review: "第一次“小赚”是钩子。记住：任何让你先充值的‘投资’，都是诈骗。" },
      E02: { title: "E02 · 识破", good: true, route: "alert",
        text: "你干脆利落地拉黑举报。几天后你在反诈App看到，同一个头像已被标记为“高危账号”。你的果断，替自己省下了一场灾难。",
        review: "识别杀猪盘只需一句话：谈感情、谈内部消息、让你充钱——三连命中，立即拉黑。" },
      E03: { title: "E03 · 反骗", good: true, route: "alert",
        text: "你顺着他演，套出了平台名、账号和话术，转手全举报给了反诈中心。你全身而退，还帮警方多留了一份线索。",
        review: "普通人不必逞强‘反骗’，但保持清醒、留存证据、及时举报，永远是对的。" },
    },
  },

  /* ============ 受害者的朋友·寻人 ============ */
  seeker: {
    scene: "陈露已经三天没回消息了。她最后说：“我找到赚大钱的路子了。”",
    actors: ["police110", "chenlu", "zhanghao"],
    hasXiaoya: false,
    tasks: [
      { id: "t1", title: "找到陈露最后的线索", cond: null },
      { id: "t2", title: "假装汇款取得骗子信任", cond: "t1" },
      { id: "t3", title: "锁定陈露被困地点", cond: "t2" },
      { id: "t4", title: "报警而不激怒骗子", cond: "t3" },
    ],
    start: "cl_1",
    nodes: {
      cl_1: { speaker: "chenlu", day: 1, phase: "最后的消息", act: "hope",
        text: "（陈露3天前的聊天记录）“这边高薪，包吃住，我先去看看，别告诉我爸妈。”定位显示：边境口岸附近。",
        options: [
          { text: "顺着她加过的‘招聘’号摸过去。", tone: "neutral", trust: 0, grant: "t1", next: "zh_1" },
          { text: "先报警登记，再自己找线索。", tone: "cautious", trust: 0, next: "zh_1" },
        ] },
      zh_1: { speaker: "zhanghao", day: 2, phase: "接触骗子", act: "hope",
        text: "想找陈露？她在我们这儿‘上班’呢，挺好的。你也想来？先交2000‘担保费’我安排你过来团聚。",
        options: [
          { text: "行，我交，你先给我看看她现在的样子。", tone: "counter", trust: 5, susp: 10, grant: "t2", next: "zh_2" },
          { text: "你把她放了，我给钱！", tone: "warm", trust: 0, susp: 25, next: "zh_2" },
        ] },
      zh_2: { speaker: "zhanghao", day: 3, phase: "锁定位置", act: "hope",
        text: "（发来一段视频，背景能看到某园区招牌）看，她好好的。你到了这个口岸，有人接你。",
        options: [
          { text: "我记下了园区名，先稳住他。（暗中记录）", tone: "cautious", trust: 3, susp: 6, grant: "t3", next: "final" },
          { text: "我这就买票过去接她！", tone: "warm", trust: 0, susp: 4, route: "scammed", ending: "E02" },
        ] },
      final: { speaker: "police110", day: 4, phase: "关键抉择", act: "hope",
        text: "你提供的园区画面很关键，我们已联系境外警方协作。接下来别再单独联系骗子，也千万别去边境。你能做到吗？",
        options: [
          { text: "我听警方的，把线索都交给你们。", tone: "neutral", trust: 0, route: "arrest", ending: "E01" },
          { text: "我等不了，我要自己去救她！", tone: "warm", trust: 0, route: "fail", ending: "E02" },
        ] },
    },
    endings: {
      E01: { title: "E01 · 成功营救", good: true, route: "arrest",
        text: "你冷静保留的园区画面成为定位关键，跨境警务协作介入，陈露被解救回国。她抱着你哭：“我以为再也回不来了。”",
        review: "亲人失联涉‘境外高薪’，第一时间报警、提供线索，比自己冲过去有效千百倍。" },
      E02: { title: "E02 · 自己陷入", good: false, route: "scammed",
        text: "你赶到边境，接你的人把你也带进了园区。两个人，谁也没能回来。骗子要的从来不是‘救人’，而是‘再骗一个’。",
        review: "‘别报警不然见不到朋友’——这句话本身，就是最危险的信号。切勿只身前往边境。" },
    },
  },

  /* ============ 内部线人·鼹鼠 ============ */
  mole: {
    scene: "境外某“园区”宿舍，摄像头在头顶闪着红光。",
    actors: ["laok", "zhanghao", "lijie"],
    hasXiaoya: false,
    tasks: [
      { id: "t1", title: "摸清团队结构", cond: null },
      { id: "t2", title: "记录诈骗完整流程", cond: "t1" },
      { id: "t3", title: "锁定团队负责人", cond: "t2" },
      { id: "t4", title: "在暴露前传出证据", cond: "t3" },
    ],
    start: "laok_1",
    nodes: {
      laok_1: { speaker: "laok", day: 1, phase: "潜伏开始", act: "hope",
        text: "鼹鼠，你已进入园区。目标是摸清结构、锁定头目、传出证据。记住，那里没有‘退出’，只有‘完成’。发消息用暗语。",
        options: [ { text: "收到，我尽量融进去。", tone: "neutral", trust: 0, next: "lj_1" } ] },
      lj_1: { speaker: "lijie", day: 1, phase: "熟悉环境", act: "hope", grant: "t1",
        text: "新来的？跟我混。上面是浩哥管业务，浩哥上面是陈总，陈总只跟老板单线联系。别乱打听，懂吗？",
        options: [
          { text: "懂，我就是来干活挣钱的。", tone: "warm", trust: 4, susp: 4, next: "lj_2" },
          { text: "陈总长什么样？老板是谁？", tone: "cautious", trust: 0, susp: 26, next: "lj_2" },
        ] },
      lj_2: { speaker: "lijie", day: 2, phase: "看内部运作", act: "hope", grant: "t2",
        text: "看好了：话术本背熟，先聊感情再谈投资，客户充了钱记进这个表。这就是我们的‘流水线’。",
        options: [
          { text: "我把流程默默记下来。（暗中取证）", tone: "cautious", trust: 2, susp: 8, next: "zh_1" },
          { text: "这表能拍一张吗？我怕记错。", tone: "warm", trust: 0, susp: 22, next: "zh_1" },
        ] },
      zh_1: { speaker: "zhanghao", day: 3, phase: "接近头目", act: "hope", grant: "t3",
        text: "干得不错。今晚陈总来视察，你表现好点。对了……你手机怎么总在打字？给谁发消息呢？",
        options: [
          { text: "跟家里报平安，怕他们担心。（掩饰）", tone: "warm", trust: 3, susp: 6, next: "final" },
          { text: "没啊，就刷刷手机。（心虚）", tone: "neutral", trust: 0, susp: 22, next: "final" },
        ] },
      final: { speaker: "laok", day: 4, phase: "传出证据", act: "hope",
        text: "鼹鼠，结构、流程、头目你都有了。找机会把这些传出来。窗口很短，一次机会——你怎么传？",
        options: [
          { text: "趁交接班的空档，用暗号一次性发出。", tone: "cautious", trust: 0, route: "arrest", ending: "E01" },
          { text: "现在就发，等不及了。", tone: "warm", trust: 0, route: "fail", ending: "E02" },
        ] },
    },
    endings: {
      E01: { title: "E01 · 成功逃离", good: true, route: "arrest",
        text: "你抓住换班的两分钟，把结构图与流水表加密传出。三天后，跨境收网行动展开，你在混乱中被接应撤离，成为关键证人。",
        review: "潜伏靠的是耐心与时机。真实世界里，一旦被诱骗至境外，请务必设法联系使领馆与110。" },
      E02: { title: "E02 · 被捕", good: false, route: "fail",
        text: "监控拍到你异常操作，还没发出去，手机就被夺走。你被关进小黑屋审讯。冲动，让所有铺垫化为乌有。",
        review: "越危险，越要冷静。‘等不及’三个字，在高危环境里就是致命的。" },
    },
  },
};

/* ===================== 通用：防骗工具箱 & 关键词 ===================== */
const TOOLBOX = [
  { ic: "📱", t: "国家反诈中心 App", d: "可拦截诈骗电话、核验 App、举报线索。" },
  { ic: "📞", t: "96110 预警劝阻专线", d: "遭遇或疑似诈骗，立即拨打，可紧急止付、咨询。" },
  { ic: "💬", t: "12381 涉诈预警短信", d: "收到即为官方预警，务必重视。" },
  { ic: "🔍", t: "一证通查", d: "排查名下电话卡、互联网账号是否被冒用。" },
  { ic: "💳", t: "云闪付一键查卡", d: "查询名下银行卡，异常及时注销。" },
  { ic: "🛡", t: "跨境提醒服务", d: "出境前开通，防范境外招工、高薪骗局。" },
  { ic: "🚫", t: "三不一多", d: "不轻信、不透露、不转账，多核实。" },
  { ic: "🧊", t: "沉没成本陷阱", d: "‘不再投就拿不回’是最常见的收割话术。" },
];

const KEYWORDS = ["不轻信","不透露","不转账","不点击","不共享屏幕","不贪高收益","不下载陌生APP","不扫陌生码","不接境外来电","不交保证金","不垫资","不信内部消息","不出租出借账户","不刷单","不信‘安全账户’","不境外高薪","不培训贷","不泄露验证码","涉钱先核实","可疑就拨96110"];
