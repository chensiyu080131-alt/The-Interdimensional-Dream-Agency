/* 异次元梦想局 · V8.1 数据层
 * 任务驱动 × 完整五幕（希望/崩塌/废墟/回放/盾牌）× 25-35 轮分支叙事
 * 6 身份 × 多角色对话网络 × 反卧底 AI × 身份解锁 × 身份专属结局
 * V8.1: 每日多轮对话，自然过渡
 */

/* ===================== 五幕定义（色彩随情绪变化） ===================== */
const ACTS = {
  hope:     { n: 1, name: "希望", sub: "建立信任，放下防备", c1: "#2A1A12", c2: "#3A2418", accent: "#FF6B35", mood: "暖橙 · 粉", bg: "assets/scenes/hope.jpg" },
  collapse: { n: 2, name: "崩塌", sub: "骗子消失，多重打击接踵而至", c1: "#1A1A2E", c2: "#2A2A38", accent: "#9AA0B5", mood: "冷灰 · 深蓝", bg: "assets/scenes/collapse.jpg" },
  ruins:    { n: 3, name: "废墟", sub: "四个行动，学习如何应对", c1: "#2A1414", c2: "#3A1E1E", accent: "#FFD700", mood: "暗红 · 暖黄", bg: "assets/scenes/ruins.jpg" },
  replay:   { n: 4, name: "回放", sub: "时间线 + 心理学标注", c1: "#1A1D28", c2: "#222838", accent: "#DC143C", mood: "中性白 · 警示红", bg: "assets/scenes/replay.jpg" },
  shield:   { n: 5, name: "盾牌", sub: "个性化报告 + 防骗工具箱", c1: "#0E2236", c2: "#123049", accent: "#1E90FF", mood: "科技蓝 · 安全绿", bg: "assets/scenes/shield.jpg" },
};

/* ===================== 身份系统 + 解锁规则 ===================== */
const IDENTITIES = {
  hunter: {
    id: "hunter", codename: "猎鹰", role: "卧底警察", name: "林晨",
    color: "#FF6B35", star: 5, risk: "极高", days: 7,
    avatar: "鹰",
    portrait: "assets/portraits/hunter.png",
    mission: "打入「恒盈量化」诈骗团伙内部，收集证据并配合收网",
    danger: "被识破将面临人身威胁",
    handler: { key: "laok", name: "老K", desc: "唯一知道你身份的人" },
    brief: [
      "添加目标「张浩」为好友，完成 3 轮对话",
      "在对话中套出「投资项目」名称",
      "确认张浩上级（「上线」）信息",
      "⚠️ 紧急：联系小雅，阻止她继续转账",
      "保存转账/收益证据，等待收网指令",
    ],
    oath: "「7天，只许成功，不许失败。」",
    exp: "紧张刺激的卧底体验",
    act: "hope",
  },
  scribe: {
    id: "scribe", codename: "笔锋", role: "记者调查员", name: "苏晚",
    color: "#2C7BE5", star: 4, risk: "高", days: 5,
    avatar: "笔",
    portrait: "assets/portraits/scribe.png",
    mission: "调查诈骗产业链，撰写深度报道",
    danger: "被威胁将被迫放弃调查",
    handler: { key: "editor", name: "主编老陆", desc: "你的选题负责人" },
    brief: [
      "取得受害者「小雅」的信任",
      "收集 5 个骗术套路",
      "假装受害者接触「张浩」",
      "锁定「上线」真实信息",
    ],
    oath: "「真相，值得我冒这个险。」",
    exp: "揭开黑幕的使命感",
    act: "hope",
  },
  lighthouse: {
    id: "lighthouse", codename: "灯塔", role: "反诈志愿者", name: "赵暖",
    color: "#07C160", star: 3, risk: "中", days: 5,
    avatar: "塔",
    portrait: "assets/portraits/lighthouse.png",
    mission: "在骗局中及时提醒正在被骗的人",
    danger: "被报复将导致个人信息泄露",
    handler: { key: "coord", name: "站长阿妮", desc: "反诈志愿站负责人" },
    brief: [
      "劝说「小雅」停止转账",
      "建立「反诈互助群」",
      "安抚受害者情绪",
      "向警方提供骗子线索",
    ],
    oath: "「哪怕只救回一个人，也值得。」",
    exp: "助人者的责任感",
    act: "hope",
  },
  drift: {
    id: "drift", codename: "浮萍", role: "普通网友", name: "你自己",
    color: "#9B59B6", star: 2, risk: "高", days: 4,
    avatar: "萍",
    portrait: "assets/portraits/drift.png",
    mission: "在社交平台上正常生活，偶遇骗子",
    danger: "放松警惕将损失金钱",
    handler: null,
    brief: [
      "完成 3 轮日常对话",
      "判断对方是否可信",
      "识别骗术类型",
      "全身而退",
    ],
    oath: "「我只是想认识个朋友而已。」",
    exp: "原设计的沉浸体验",
    act: "hope",
  },
  seeker: {
    id: "seeker", codename: "寻人", role: "受害者的朋友", name: "方寻",
    color: "#E67E22", star: 4, risk: "中高", days: 4,
    avatar: "寻",
    portrait: "assets/portraits/seeker.png",
    mission: "寻找失联的好友「陈露」",
    danger: "自己也可能被骗子困住",
    handler: { key: "police110", name: "值班民警", desc: "报案后对接的警官" },
    brief: [
      "找到朋友最后的线索",
      "假装汇款取得骗子信任",
      "锁定朋友被困地点",
      "在不激怒骗子的前提下报警",
    ],
    oath: "「陈露，等我，我一定把你找回来。」",
    exp: "急迫感和情感驱动",
    act: "hope",
  },
  teacher: {
    id: "teacher", codename: "春蚕", role: "退休教师", name: "陈老师",
    color: "#8B6914", star: 3, risk: "中等", days: 6,
    avatar: "📚",
    portrait: "assets/portraits/teacher.png",
    mission: "在网络交友中识破诈骗，同时保持对自己「孤独」的警觉",
    danger: "退休金和养老金是骗子盯上的目标",
    handler: null,
    brief: [
      "在社交平台上谨慎交友",
      "识别对方话术中「情感投资」的套路",
      "在不见面的情况下判断对方真实意图",
      "保护自己的退休积蓄不被骗走",
    ],
    oath: "「教书育人一辈子，不能让骗子给我『上课』。」",
    exp: "人生阅历 vs 情感需求的对决",
    act: "hope",
  },
};

/* ===================== 聊天马甲（每个身份专属，不跨角色复用） ===================== */
const MASIAS = {
  hunter: [
    { key: "xiaochen", name: "小陈", avatar: "👔", color: "#5B8DEF" },
    { key: "afei",    name: "阿飞", avatar: "😎", color: "#E74C3C" },
    { key: "linge",   name: "林哥", avatar: "🕶️", color: "#8E7CC3" },
    { key: "yexun",   name: "夜巡", avatar: "🌙", color: "#34495E" },
  ],
  scribe: [
    { key: "xiaosu",  name: "小苏", avatar: "✍️", color: "#2C7BE5" },
    { key: "wanwan",  name: "晚晚", avatar: "🌸", color: "#E91E63" },
    { key: "momo",    name: "墨墨", avatar: "📰", color: "#607D8B" },
    { key: "ajiu",    name: "阿九", avatar: "🐣", color: "#FF9800" },
  ],
  lighthouse: [
    { key: "xiaonuan", name: "小暖", avatar: "☀️", color: "#07C160" },
    { key: "yangguang", name: "阳光", avatar: "🌻", color: "#FFC107" },
    { key: "zhixin",  name: "知心", avatar: "💬", color: "#9C27B0" },
    { key: "baidu",   name: "摆渡", avatar: "🚣", color: "#00897B" },
  ],
  drift: [
    { key: "luren",   name: "路人甲", avatar: "🚶", color: "#78909C" },
    { key: "chigua",  name: "吃瓜君", avatar: "🍉", color: "#4CAF50" },
    { key: "xianyu",  name: "咸鱼", avatar: "🐟", color: "#546E7A" },
    { key: "guoke",   name: "过客", avatar: "🍂", color: "#A1887F" },
  ],
  seeker: [
    { key: "axun",    name: "阿寻", avatar: "🔍", color: "#E67E22" },
    { key: "laofang", name: "老方", avatar: "🎒", color: "#5D4037" },
    { key: "xingzhe", name: "行者", avatar: "🚴", color: "#1976D2" },
    { key: "shouye",  name: "守夜", avatar: "🕯️", color: "#388E3C" },
  ],
  teacher: [
    { key: "xiaozhou", name: "小周", avatar: "⌨️", color: "#7F8C8D" },
    { key: "haozi",   name: "耗子", avatar: "🐭", color: "#546E7A" },
    { key: "anhao",   name: "暗号", avatar: "📟", color: "#455A64" },
    { key: "huisheng", name: "回声", avatar: "🎧", color: "#37474F" },
  ],
};

/* ===================== NPC 发现换马甲的反应台词 ===================== */
const MASK_DETECT_REACTIONS = {
  zhanghao: {
    mild:  { text: "咦？刚才聊的不是这个号吧……你换号了？", susp: 12, phase: "察觉换号·疑问" },
    alert: { text: "你又换了一个号？同一个人弄这么多号干什么？你……不会是在耍我吧？", susp: 25, phase: "察觉换号·警觉" },
    angry: { text: "够了！你反复换号跟我聊天，什么意思？你到底是谁？我感觉很不对劲，先不聊了。", susp: 50, phase: "察觉换号·暴怒" },
    back:  { text: "等等，这个号我怎么有点眼熟……之前你是不是就用这个号跟我聊过？你要是有什么目的，趁早说清楚。", susp: 18, phase: "察觉换号·识破" },
  },
  lijie: {
    mild:  { text: "诶？刚才不是这个号呀，你换号啦？", susp: 10, phase: "察觉换号·疑问" },
    alert: { text: "怎么又换号了？一个人搞这么多号，不会是来套我话的吧？我跟你说啊，我们这儿不欢迎探子。", susp: 22, phase: "察觉换号·警觉" },
    angry: { text: "你换来换去的是不是有问题？我可不跟来路不明的人打交道。浩哥说了，这种人要多加小心。", susp: 45, phase: "察觉换号·暴怒" },
    back:  { text: "这号我见过……之前不就是你在用吗？你到底想要干嘛？", susp: 16, phase: "察觉换号·识破" },
  },
  chenlu: {
    mild:  { text: "嗯？这个号……不太对，你不是刚才那个号？", susp: 8, phase: "察觉换号·疑问" },
    alert: { text: "你换号了？我朋友不会这样反复换号的。你是谁？", susp: 20, phase: "察觉换号·警觉" },
    angry: { text: "你到底是不是来找我的？一直换号……你该不会是园区的人吧？", susp: 40, phase: "察觉换号·暴怒" },
    back:  { text: "这个号好像见过……你之前就用过对不对？", susp: 14, phase: "察觉换号·识破" },
  },
  _default: {
    mild:  { text: "咦，你号变了？刚才聊的不是这个人吧……", susp: 8, phase: "察觉换号·疑问" },
    alert: { text: "你又换号了？一个人这么多号不太正常吧。你到底想干什么？", susp: 20, phase: "察觉换号·警觉" },
    angry: { text: "你什么意思？换号换来换去的玩我？我不跟身份不明的人打交道。", susp: 35, phase: "察觉换号·暴怒" },
    back:  { text: "这个号……你之前用过吧？到底在搞什么？", susp: 14, phase: "察觉换号·识破" },
  },
};

/* ===================== 身份解锁：完成指定线后解锁（首次仅猎鹰） ===================== */
const UNLOCK_RULES = {
  hunter:   { type: "default", desc: "首次游戏默认解锁" },
  scribe:   { type: "finish", ids: ["hunter"], desc: "完成猎鹰线任意结局" },
  lighthouse:{ type: "ending", ids: ["hunter"], endingGood: true, desc: "完成猎鹰线好结局" },
  drift:    { type: "finish", ids: ["scribe"], desc: "完成笔锋线任意结局" },
  seeker:   { type: "count", n: 2, desc: "完成任意 2 条线" },
  teacher:   { type: "count", n: 3, desc: "完成任意 3 条线" },
};

/* ===================== 角色（对话对象）通用档案 ===================== */
const ACTORS = {
  zhanghao: { name: "张浩", type: "target", role: "目标骗子", color: "#DC143C", avatar: "浩", portrait: "assets/portraits/zhanghao.png", tagline: "自称「金融项目负责人」" },
  lijie:    { name: "李姐", type: "accomplice", role: "骗子同伙", color: "#C0392B", avatar: "李", portrait: "assets/portraits/lijie.png", tagline: "群里最活跃的「成功学员」" },
  laok:     { name: "老K", type: "handler", role: "警方联络人", color: "#2C7BE5", avatar: "K", portrait: "assets/portraits/laok.png", tagline: "你的上家" },
  editor:   { name: "主编老陆", type: "handler", role: "报社主编", color: "#2C7BE5", avatar: "陆", portrait: "assets/portraits/editor.png", tagline: "你的选题负责人" },
  coord:    { name: "站长阿妮", type: "handler", role: "志愿站长", color: "#2C7BE5", avatar: "妮", portrait: "assets/portraits/coord.png", tagline: "反诈志愿站负责人" },
  police110:{ name: "值班民警", type: "handler", role: "警方", color: "#2C7BE5", avatar: "警", portrait: "assets/portraits/police110.png", tagline: "报案对接人" },
  xiaoya:   { name: "小雅", type: "victim", role: "疑似受害者", color: "#F0A020", avatar: "雅", portrait: "assets/portraits/xiaoya.png", tagline: "刚投了 3 万的姑娘" },
  chenlu:   { name: "陈露", type: "victim", role: "失联好友", color: "#F0A020", avatar: "露", portrait: "assets/portraits/chenlu.png", tagline: "你要找的人" },
  anon:     { name: "匿名X", type: "informant", role: "神秘线人", color: "#8E44AD", avatar: "X", portrait: "assets/portraits/anon.png", tagline: "只在深夜出现" },
  /* —— 教师线专属 NPC —— */
  xiaoyun:  { name: "小云", type: "target", role: "目标骗子", color: "#DC143C", avatar: "云", tagline: "自称「学生家长」" },
  laowang:  { name: "老王", type: "handler", role: "退休同事", color: "#2C7BE5", avatar: "王", tagline: "揭穿骗局的老友" },
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

/* ===================== 剧情：每身份多轮对话 ===================== */
/* 设计原则：
 * 1. 每个"日"至少 2 轮 NPC 发言，形成有来有回的对话感
 * 2. 中间插入"桥接消息"——NPC 回应玩家选择、然后自然过渡到下一话题
 * 3. 保留原有的任务驱动和选项分支结构
 */
const STORIES = {

  /* ================================================================
   * 卧底警察 · 猎鹰（7天，每天 2-3 轮对话）
   * ================================================================ */
  hunter: {
    sceneType: "invest_platform",
    scene: "深夜的出租屋，手机屏幕是唯一的光。",
    hasXiaoya: true,
    actors: ["laok", "zhanghao", "xiaoya", "anon"],
    tasks: [
      { id: "t1", title: "添加「张浩」为好友", cond: null },
      { id: "t2", title: "获取「投资项目」名称", cond: "t1" },
      { id: "t3", title: "套出「上线」联系方式", cond: "t2" },
      { id: "t4", title: "保存转账/收益证据", cond: "t3" },
      { id: "t5", title: "在收网前不暴露身份", cond: "t4" },
    ],
    start: "laok_1",
    nodes: {
      laok_1: { speaker: "laok", day: 1, phase: "任务下达",
        text: "猎鹰，收到请回复。目标锁定「张浩」，混元资本诈骗团伙中层。你的任务：加他好友，取得信任，摸清上线。7天，别暴露。",
        options: [
          { text: "收到，马上行动。", tone: "neutral", next: "laok_1b" },
          { text: "他要是起疑怎么办？", tone: "cautious", next: "laok_2" },
        ] },
      laok_2: { speaker: "laok", day: 1, phase: "行前叮嘱",
        text: "记住：别问太细，别太配合，像个真人。他们对「太主动」的人最警觉。出事拨紧急联络。",
        options: [ { text: "明白，我上了。", tone: "neutral", next: "laok_1b" } ] },
      laok_1b: { speaker: "laok", day: 1, phase: "最后提醒",
        text: "还有——他朋友圈全是豪车、高档餐厅、正能量语录。别被这些迷惑。准备好了就添加他，聊天风格你自己把握，但记住：你不是警察林晨，你只是一个普通人。",
        options: [
          { text: "放心，马甲我已经准备好了。", tone: "neutral", next: "add_zhang" },
          { text: "他朋友圈这么假，正常人一眼就看出来了。", tone: "cautious", next: "add_zhang" },
        ] },

      /* --- 第1天：建立联系（2轮） --- */
      add_zhang: { speaker: "zhanghao", day: 1, phase: "寻猪·搭讪", grant: "t1",
        text: "你好呀，看你朋友圈挺正能量的，交个朋友？我做金融的，平时忙，很少主动加人。",
        options: [
          { text: "你好，做金融挺厉害的。", tone: "warm", susp: 2, next: "zh_1a" },
          { text: "嗯，你是做哪块的？", tone: "neutral", susp: 4, next: "zh_1a" },
          { text: "你具体哪家公司？注册地在哪？", tone: "cautious", susp: 20, next: "zh_1a" },
        ] },
      zh_1a: { speaker: "zhanghao", day: 1, phase: "寻猪·试探",
        text: "哈哈，就是在一家投资公司。你呢？做什么工作的？一个人在城里打拼？",
        options: [
          { text: "嗯，一个人在城里，偶尔挺无聊的。", tone: "warm", susp: 2, next: "zh_1b" },
          { text: "做个小文员，没什么特别的。", tone: "neutral", susp: 1, next: "zh_1b" },
          { text: "你为什么对我想做什么工作这么感兴趣？", tone: "cautious", susp: 16, next: "zh_1b" },
        ] },
      zh_1b: { speaker: "zhanghao", day: 1, phase: "寻猪·收网",
        text: "理解理解，一个人不容易。我在行业里人脉还行，说不定能帮到你。天不早了，明天再聊？晚安～",
        options: [
          { text: "好啊，晚安。", tone: "warm", susp: 1, next: "zh_2" },
          { text: "嗯，明天见。", tone: "neutral", susp: 1, next: "zh_2" },
        ] },

      /* --- 第2天：情感铺垫（2轮） --- */
      zh_2: { speaker: "zhanghao", day: 2, phase: "诱猪·情感铺垫",
        text: "昨晚睡得好吗？我今天状态贼好，舅那边又来了个内部消息，上个月跟着我操作的朋友赚了不少。你平时理财不？",
        options: [
          { text: "内部消息？是什么项目啊？", tone: "warm", susp: 6, grant: "t2", next: "zh_2a" },
          { text: "哦，最近行情怎么样。", tone: "neutral", susp: 3, next: "zh_2a" },
          { text: "什么项目、什么平台、准确率多少？", tone: "cautious", susp: 22, grant: "t2", next: "zh_2a" },
        ] },
      zh_2a: { speaker: "zhanghao", day: 2, phase: "诱猪·展示实力",
        text: "具体的不方便截图——圈子里规矩多。但你看，我那几个朋友都说靠谱。说实话，现在谁不焦虑？工资涨不过物价，不搞点副业怎么行？你要是感兴趣，明天我好好跟你讲讲。",
        options: [
          { text: "你说得对，听听也不亏。", tone: "warm", susp: 4, next: "zh_2b" },
          { text: "嗯，那明天再说吧，我先忙了。", tone: "neutral", susp: 2, next: "zh_2b" },
        ] },
      zh_2b: { speaker: "zhanghao", day: 2, phase: "诱猪·下钩",
        text: "行，你忙你的。不过我跟你说——别跟其他人讲，明天我跟你说一个稳的。晚安，做个好梦。",
        options: [
          { text: "好，明天见。（他这是在下饵了）", tone: "cautious", susp: 2, next: "zh_3" },
          { text: "期待！", tone: "warm", susp: 3, next: "zh_3" },
        ] },

      /* --- 第3天：抛出诱饵（2轮） --- */
      zh_3: { speaker: "zhanghao", day: 3, phase: "养猪·抛出诱饵",
        text: "叫「恒盈量化」，老师带单。你要不要先小试一笔？充 5000 我教你，两天就能见收益。",
        options: [
          { text: "行，那你上线是谁？我想请教下大佬。", tone: "counter", susp: 10, grant: "t3", evidenceFrag: "invest_platform_name", next: "zh_3a_boss" },
          { text: "先看看再说，你有收益截图吗？（截图）", tone: "neutral", susp: 5, evidence: true, next: "zh_3a_ss" },
          { text: "这平台正规吗？有没有牌照？", tone: "cautious", susp: 18, xiaoya: 1, next: "zh_3a_lic" },
        ] },
      zh_3a_boss: { speaker: "zhanghao", day: 3, phase: "养猪·打消顾虑",
        text: "上线？你说陈总啊。他一般不随便加人，等你先试两单表现好了，我帮你引荐。你先别想那么多，试试又不吃亏——就5000块，两天就回本。",
        options: [
          { text: "那行，我先看看情况。", tone: "neutral", susp: 4, next: "zh_3b" },
          { text: "我再研究一下平台，不急。", tone: "neutral", susp: 3, next: "zh_3b" },
        ] },
      zh_3a_ss: { speaker: "zhanghao", day: 3, phase: "养猪·打消顾虑",
        text: "有有有，图我发你了，自己看。上周跟着老师操作的几个朋友，每人分了差不多这些。纯跟单，不费脑子。你先别想那么多，试试又不吃亏，对吧？",
        options: [
          { text: "看到了，确实挺诱人的。", tone: "warm", susp: 4, next: "zh_3b" },
          { text: "我再研究一下平台，不急。", tone: "neutral", susp: 3, next: "zh_3b" },
        ] },
      zh_3a_lic: { speaker: "zhanghao", day: 3, phase: "养猪·打消顾虑",
        text: "牌照这种东西……我舅在证券做了十几年，还怕不正规？放心，平台我亲手验证过。你先别想那么多，试试又不吃亏。",
        options: [
          { text: "好吧，听起来还行。", tone: "warm", susp: 4, next: "zh_3b" },
          { text: "我再研究一下平台，不急。", tone: "neutral", susp: 3, next: "zh_3b" },
        ] },
      zh_3b: { speaker: "zhanghao", day: 3, phase: "养猪·制造紧迫",
        text: "研究可以，但别拖太久。我跟你说，这批名额就剩几个了，错过又得等。明天我把上线陈总介绍给你认识，他一般不随便加人的。",
        options: [
          { text: "好，那我等陈总。", tone: "warm", susp: 3, next: "zh_4" },
          { text: "陈总是谁？能说说他吗？", tone: "cautious", susp: 8, next: "zh_4" },
        ] },

      /* --- 第4天：引荐上线（2轮） --- */
      zh_4: { speaker: "zhanghao", day: 4, phase: "养猪·引荐上线", grant: "t3",
        text: "我上面是「陈总」，很少露面。这是他的号，你就说我介绍的。（发来一个账号）",
        options: [
          { text: "好的，这条聊天我留着。（保存证据）", tone: "neutral", susp: 4, evidence: true, evidenceFrag: "boss_account_info", grant: "t4", xiaoya: 1, next: "zh_4a_save" },
          { text: "陈总平时也在这平台操作吗？他账户能看吗？", tone: "cautious", susp: 20, next: "zh_4a_ask" },
        ] },
      zh_4a_save: { speaker: "zhanghao", day: 4, phase: "养猪·描绘蓝图",
        text: "行，你留着查。我跟你说，跟对人比什么都重要——小雅跟着做了三个月，现在月入过万了。你想想，普通人要多久才能攒到那个数？",
        options: [
          { text: "小雅也在做？她投了多少？", tone: "cautious", susp: 6, next: "zh_4b" },
          { text: "那行，我也跟着试试。", tone: "warm", susp: 3, next: "zh_4b" },
        ] },
      zh_4a_ask: { speaker: "zhanghao", day: 4, phase: "养猪·描绘蓝图",
        text: "陈总的账户？你别想太多。他管着几千万的资金盘，每天忙得要命。我跟你说，跟对人比什么都重要。别说我没告诉你——小雅跟着做了三个月，现在月入过万了。",
        options: [
          { text: "小雅也在做？她投了多少？", tone: "cautious", susp: 6, next: "zh_4b" },
          { text: "那行，我也跟着试试。", tone: "warm", susp: 3, next: "zh_4b" },
        ] },
      zh_4b: { speaker: "zhanghao", day: 4, phase: "养猪·收尾",
        text: "小雅刚开始跟你一样犹豫，现在天天感谢我。人啊，有时候就差一个机会。你好好想想，明天我把具体方案发你。",
        options: [
          { text: "行，等你好消息。", tone: "neutral", susp: 2, next: "zh_5" },
          { text: "好，我也跟小雅聊聊，取取经。", tone: "warm", susp: 4, xiaoya: 1, next: "xy_h1" },
        ] },

      /* --- 第4天补充：联系小雅（2-3轮独立对话节点） --- */
      xy_h1: { speaker: "xiaoya", day: 4, phase: "紧急联络·小雅",
        text: "你……你是怎么加的我？张浩跟你说的吗？",
        options: [
          { text: "对，他让我来跟你取取经。你跟着他赚了多少？", tone: "neutral", susp: 0, next: "xy_h1a" },
          { text: "我是警察，你可能有危险。先别再转钱了。", tone: "counter", susp: 0, xiaoya: 1, next: "xy_h1b" },
        ] },
      xy_h1a: { speaker: "xiaoya", day: 4, phase: "受害者坦白",
        text: "3万……全投进去了。他一开始让我试500，真的赚了；然后1万，也提出来了。第三次3万——提不出来了。他说要交保证金、解冻费……我把信用卡都刷爆了。",
        options: [
          { text: "不要再转了。这是典型的杀猪盘套路。", tone: "counter", susp: 0, xiaoya: 1, evidenceFrag: "victim_statement", next: "xy_h1c" },
          { text: "把转账记录和聊天截图发给我留证。", tone: "neutral", susp: 0, evidence: true, xiaoya: 1, next: "xy_h1c" },
        ] },
      xy_h1b: { speaker: "xiaoya", day: 4, phase: "震惊与求助",
        text: "警……警察？！天哪，我不是犯法了吧？我不是故意的……我只是想多赚点钱给家里。我该怎么办？",
        options: [
          { text: "你没有犯法。你是受害者。把转账记录都发给我。", tone: "warm", susp: 0, evidence: true, xiaoya: 2, next: "xy_h1c" },
          { text: "冷静，我需要你把张浩跟你说过的每一句话都告诉我。", tone: "neutral", susp: 0, xiaoya: 1, next: "xy_h1c" },
        ] },
      xy_h1c: { speaker: "xiaoya", day: 4, phase: "决心配合",
        text: "好……我都给你。我不想再被骗了。他说今晚还会找我，让我再交一笔\"保证金\"才能提之前的钱。我是不是不应该再理他？",
        options: [
          { text: "别回他。装作没看到。等我的指令。", tone: "counter", susp: 0, xiaoya: 1, next: "zh_5" },
          { text: "你先按他说的回复，但绝对不要再转钱了——我们要取证。", tone: "cautious", susp: 0, next: "zh_5" },
        ] },

      /* --- 第5天：催促转账（2轮） --- */
      zh_5: { speaker: "zhanghao", day: 5, phase: "杀猪·催促转账",
        text: "小雅刚投了3万，今天账面涨了。你别犹豫，机会不等人。把钱转这个账户，我帮你盯。",
        options: [
          { text: "我先转 5000 试试，转账记录我截下来。（取证）", tone: "neutral", susp: 6, evidence: true, next: "zh_5a_agree" },
          { text: "我再想想，钱这两天有点紧。", tone: "cautious", susp: 8, xiaoya: 1, next: "zh_5a_tight" },
          { text: "这不就是让我把钱打给你吗？", tone: "cautious", susp: 26, next: "zh_5a_confront" },
        ] },
      zh_5a_agree: { speaker: "zhanghao", day: 5, phase: "杀猪·施压",
        text: "有魄力！你把截图发我，我帮你操作——记住选「老师跟单」模式，别自己乱点。小雅当初就是跟着做的，现在每月躺着收钱。",
        options: [
          { text: "好，我这就转。（继续配合）", tone: "warm", susp: 4, next: "zh_5b" },
          { text: "等等，我再确认一下操作步骤。", tone: "cautious", susp: 3, next: "zh_5b" },
        ] },
      zh_5a_tight: { speaker: "zhanghao", day: 5, phase: "杀猪·施压",
        text: "钱紧才更要赚啊！你这思路不对。你想啊，5000放银行一个月利息才几块钱？放这儿两天就翻倍。小雅就是胆子大才赚到的，你要是再不决定，我只能把名额给别人了。",
        options: [
          { text: "好吧，那我先试试小额。（继续配合）", tone: "warm", susp: 4, next: "zh_5b" },
          { text: "我再和家里商量一下。", tone: "neutral", susp: 3, next: "zh_5b" },
        ] },
      zh_5a_confront: { speaker: "zhanghao", day: 5, phase: "杀猪·施压",
        text: "你这话说的……钱是打进平台账户，又不是打给我个人。我天天给你讲行情、盯点位，我图什么？信不过我，那就算了——名额给别人也一样。",
        options: [
          { text: "别生气，我就随口一说。（安抚）", tone: "warm", susp: 4, next: "zh_5b" },
          { text: "行，让我再考虑考虑。", tone: "neutral", susp: 3, next: "zh_5b" },
        ] },
      zh_5b: { speaker: "zhanghao", day: 5, phase: "杀猪·下通牒",
        text: "好，话我说到这儿了。这个「内部消息」明天就过了，你到时候再想进就没这个点位。我不逼你，你自己看着办。",
        options: [
          { text: "我尽快给你答复。（他急了，快收网了）", tone: "cautious", susp: 2, next: "zh_6" },
          { text: "好，明天给你准信。", tone: "neutral", susp: 2, next: "zh_6" },
        ] },

      /* --- 第6天：收网前夜（2轮） --- */
      zh_6: { speaker: "laok", day: 6, phase: "收网前夜",
        text: "猎鹰，证据够了。今晚 24 点收网。你稳住张浩，别让他跑，也别让他起疑。",
        options: [
          { text: "收到，我拖住他。", tone: "neutral", next: "zh_6a" },
          { text: "他好像有点怀疑我了……", tone: "cautious", next: "zh_6a" },
        ] },
      zh_6a: { speaker: "laok", day: 6, phase: "战术指导",
        text: "不用紧张。就算他怀疑，现在也跑不了——我们已锁定了他的位置和资金流向。你只需要正常聊天，像前两天一样。最后一天了，稳住。",
        options: [
          { text: "明白，我去跟他聊。", tone: "neutral", next: "zh_6b" },
          { text: "如果最后关头他发现了怎么办？", tone: "cautious", next: "zh_6b" },
        ] },
      zh_6b: { speaker: "laok", day: 6, phase: "最后叮嘱",
        text: "那就随机应变。记住：你的安全第一。如果感觉不对，立刻中断联络，我们按预案B行动。现在，去把他稳住。",
        options: [
          { text: "好，最后一关。（去找张浩）", tone: "neutral", next: "zh_final" },
          { text: "我去会会他。", tone: "warm", next: "zh_final" },
        ] },

      /* --- 第7天：最终对决 --- */
      zh_final: { speaker: "zhanghao", day: 7, phase: "杀猪·最后试探",
        text: "你今天怎么话这么少？我总觉得你哪里不对劲……你老实说，你不会是来查我的吧？",
        options: [
          { text: "查你？我巴不得快点赚钱，你别多心。（稳住）", tone: "warm", susp: 4, ending: "hunter_A" },
          { text: "被你发现了，我就是卧底。（摊牌）", tone: "counter", susp: 100, ending: "hunter_B" },
          { text: "……（沉默，不知道怎么回）", tone: "neutral", susp: 30, ending: "hunter_C" },
        ] },
    },
    endings: {
      hunter_A: { title: "结局 A · 成功捣毁", good: true,
        text: "24 点整，警方同步收网。你提交的聊天记录、转账凭证、上线账号成为关键证据，「恒盈量化」团伙 11 人落网。你稳住了张浩，直到警灯亮起的那一刻。",
        review: "你赢了。但请记住：现实中没有「主角光环」，普通人遇到「张浩」，最该做的不是周旋，而是立刻挂断、报警。" },
      hunter_B: { title: "结局 B · 卧底暴露", good: false,
        text: "你的摊牌让张浩瞬间清空聊天、拉黑、失联。团伙连夜转移，你的位置也可能已被盯上。老K的消息只有一句：「撤，马上撤。」",
        review: "一句话就能毁掉七天。骗子对「异常」极其敏感——这正是为什么反诈强调「不接触、不周旋、直接报警」。" },
      hunter_C: { title: "结局 C · 反被利用", good: false,
        text: "你的沉默被张浩解读为「心动」。他趁机让你「先转5千验证诚意」，你恍惚间差点点下确认。等你回过神，才发现自己几乎从猎人变成了猎物。",
        review: "「我以为我在钓鱼，其实鱼在钓我。」——被骗从不是因为傻，而是因为骗子比你更懂你的处境。" },
    },
  },

  /* ================================================================
   * 记者调查员 · 笔锋（5天，每天 2-3 轮对话）
   * ================================================================ */
  scribe: {
    sceneType: "love_killpig",
    scene: "报社的深夜，只有你桌上一盏灯。",
    actors: ["editor", "xiaoya", "zhanghao"],
    tasks: [
      { id: "t1", title: "取得「小雅」信任", cond: null },
      { id: "t2", title: "收集骗术套路", cond: "t1" },
      { id: "t3", title: "假装受害者接触张浩", cond: "t2" },
      { id: "t4", title: "锁定上线真实信息", cond: "t3" },
    ],
    start: "ed_1",
    nodes: {
      ed_1: { speaker: "editor", day: 1, phase: "选题下达",
        text: "苏晚，这组「杀猪盘」产业链的稿子交给你。先找到受害者小雅，别惊动骗子。安全第一，稿子第二。",
        options: [
          { text: "我知道分寸，这就联系她。", tone: "neutral", next: "ed_1b" },
          { text: "要是骗子发现记者在查呢？", tone: "cautious", next: "ed_2" },
        ] },
      ed_2: { speaker: "editor", day: 1, phase: "叮嘱",
        text: "所以你别暴露记者身份，就当一个也差点被骗的人。共情，别审问。",
        options: [ { text: "明白。", tone: "neutral", next: "ed_1b" } ] },
      ed_1b: { speaker: "editor", day: 1, phase: "选题背景",
        text: "还有——这篇稿子能不能发出去，取决于你的调查能不能落地。如果有威胁或者封口，立刻停手，稿子可以换人写，人不能出事。",
        options: [
          { text: "我有心理准备。开始吧。", tone: "neutral", next: "xy_1" },
          { text: "主编，你比我还紧张啊。", tone: "warm", next: "xy_1" },
        ] },

      /* --- 第2天：接触受害者（2轮） --- */
      xy_1: { speaker: "xiaoya", day: 2, phase: "接触受害者", grant: "t1",
        text: "你也在恒盈量化投了吗？我投了3万，现在提不出来，好慌……你说这是不是骗人的？",
        options: [
          { text: "我也差点投，你先别再转钱了。", tone: "warm", susp: 0, next: "xy_1a" },
          { text: "你从头跟我说说，他怎么一步步让你投的？", tone: "neutral", susp: 0, grant: "t2", next: "xy_1a" },
        ] },
      xy_1a: { speaker: "xiaoya", day: 2, phase: "受害者讲述",
        text: "他先加我聊感情，说一个人在外地打拼很孤独——我当时也是这样，就……聊上了。然后他说舅舅是证券的，有内部消息，第一次让我投了500，真的赚了！我就……",
        options: [
          { text: "第一次赚钱是最危险的信号——那是诱饵。", tone: "warm", susp: 0, next: "xy_1b" },
          { text: "所以你就越投越多？他具体让你做了什么？", tone: "neutral", susp: 0, next: "xy_1b" },
        ] },
      xy_1b: { speaker: "xiaoya", day: 2, phase: "受害者后悔",
        text: "对……第二次他让我投1万，又提出来了。第三次是3万——这次提不出来了。他说要交保证金才能提。我是不是很蠢？",
        options: [
          { text: "不蠢，这是精心设计的剧本，谁来都一样。", tone: "warm", susp: 0, next: "xy_1c" },
          { text: "先别自责，给我看看他的聊天记录。", tone: "neutral", susp: 0, evidence: true, next: "xy_1c" },
        ] },
      xy_1c: { speaker: "xiaoya", day: 2, phase: "证据展示",
        text: "（发来十几张聊天截图）你看——这是刚加我时候的嘘寒问暖，这是他说舅舅在证券上班的，这是他让我投500试水的……每一步都像演剧本。最后这条是他催我交保证金的，说我再不交前面的钱就全没了。现在回头看，每个字都是套路，可我当时就是看不清……",
        options: [
          { text: "这不是你的问题。他们的剧本专门针对人性的弱点。明天你按时间顺序跟我完整讲一遍他的套路。", tone: "warm", susp: 0, next: "xy_2" },
          { text: "这些截图很有价值。今天就到这，明天你从头把过程捋一遍，我要还原他的完整手法。", tone: "neutral", susp: 0, next: "xy_2" },
        ] },

      /* --- 第3天：还原套路（2轮） --- */
      xy_2: { speaker: "xiaoya", day: 3, phase: "还原套路",
        text: "他先加我聊感情，再说舅舅是证券的，然后拉我进群看「老师带单」，第一次让我赚了800……我就信了。",
        options: [
          { text: "把他微信号给我，我去会会他。", tone: "counter", susp: 0, grant: "t3", next: "xy_2a" },
          { text: "这些截图能发我留证吗？", tone: "neutral", susp: 0, next: "xy_2a" },
        ] },
      xy_2a: { speaker: "xiaoya", day: 3, phase: "证据交接",
        text: "（发来大量聊天截图和转账记录）都在这里了。你……你要小心，他说话特别好听，很容易让人卸下防备。",
        options: [
          { text: "放心，我是记者，受过训练。", tone: "neutral", susp: 0, next: "xy_2b_j" },
          { text: "谢谢你信任我，这篇报道会让更多人看到。", tone: "warm", susp: 0, next: "xy_2b_m" },
        ] },
      xy_2b_j: { speaker: "xiaoya", day: 3, phase: "最后提醒",
        text: "记者？那太好了……只是，别让他知道是我给你的。他说过如果我把聊天记录给别人就「后果自负」，我有点怕。",
        options: [
          { text: "他不会知道的。一切按计划来。", tone: "cautious", susp: 0, next: "zh_1" },
          { text: "别怕，你已经在帮更多人了。", tone: "warm", susp: 0, next: "zh_1" },
        ] },
      xy_2b_m: { speaker: "xiaoya", day: 3, phase: "最后提醒",
        text: "你要写报道曝光他？也好，让更多人知道他的套路。只是，别让他知道是我给你的——他说过如果我把聊天记录给别人就「后果自负」，我有点怕。",
        options: [
          { text: "他不会知道的。一切按计划来。", tone: "cautious", susp: 0, next: "zh_1" },
          { text: "别怕，你已经在帮更多人了。", tone: "warm", susp: 0, next: "zh_1" },
        ] },

      /* --- 第4天：接近骗子（2轮） --- */
      zh_1: { speaker: "zhanghao", day: 4, phase: "假装受害者",
        text: "小雅介绍的？她是我们的老客户了。你也想跟着老师赚点？先加我，我带你。",
        options: [
          { text: "想啊，你上线老师是谁？靠谱吗？", tone: "cautious", susp: 16, grant: "t4", next: "zh_1a" },
          { text: "行，怎么操作？（套流程）", tone: "neutral", susp: 6, next: "zh_1a" },
        ] },
      zh_1a: { speaker: "zhanghao", day: 4, phase: "骗子试探",
        text: "靠谱？我跟陈总做了两年了，群里几十号人跟着操作，没一个说不好的。你做什么工作的？手头宽裕不？",
        options: [
          { text: "普通文员，攒了点钱想试试。", tone: "neutral", susp: 4, next: "zh_1b" },
          { text: "做销售的，最近业绩还不错。", tone: "warm", susp: 6, next: "zh_1b" },
          { text: "我的工作跟你没关系吧？", tone: "cautious", susp: 22, next: "zh_1b" },
        ] },
      zh_1b: { speaker: "zhanghao", day: 4, phase: "骗子下钩",
        text: "嗯，工作稳定挺好的，就是攒得慢。这样吧，我先拉你进群看看。群里的人都挺热情的，你感受感受。明天我们聊聊具体的。",
        options: [
          { text: "好，我先进群看看。", tone: "neutral", susp: 3, next: "zh_2" },
          { text: "群里都是跟你做的？他们投了多少？", tone: "cautious", susp: 8, next: "zh_2" },
        ] },

      /* --- 第5天：最终摊牌 --- */
      zh_2: { speaker: "zhanghao", day: 5, phase: "露出马脚",
        text: "老师就是「陈总」，别管那么多。你先充5万，晚了名额就没了——你不会也是来打听事的记者吧？",
        options: [
          { text: "怎么会，我这就准备钱。（稳住，收尾）", tone: "warm", susp: 4, ending: "scribe_A" },
          { text: "是又怎样？我就是来揭穿你的。", tone: "counter", susp: 100, ending: "scribe_B" },
          { text: "……要不我再想想。（迟疑）", tone: "cautious", susp: 20, ending: "scribe_C" },
        ] },
    },
    endings: {
      scribe_A: { title: "结局 A · 发表报道", good: true,
        text: "你拿到了完整的话术链条和资金去向。《三万块与一个消失的「陈总」》见报，全网转发，警方顺线介入。你没暴露，稿子救了更多「小雅」。",
        review: "记者的克制，就是最好的武器。真相不靠对骂赢得，靠证据。" },
      scribe_B: { title: "结局 B · 被威胁", good: false,
        text: "张浩截图存证，反手举报你「钓鱼采访」，还有人开始打听你的住址。主编让你停稿避风头。你赢了口舌，输了报道。",
        review: "情绪上头的一句「揭穿你」，可能让几个月的调查前功尽弃。" },
      scribe_C: { title: "结局 C · 妥协", good: false,
        text: "你的迟疑被对方拿捏，几天后你收到一笔「封口费」和一句「合作愉快」。稿子没发，你盯着屏幕，第一次觉得真相这么沉。",
        review: "有些代价，比钱更重。" },
    },
  },

  /* ================================================================
   * 反诈志愿者 · 灯塔（5天，每天 2-3 轮）
   * ================================================================ */
  lighthouse: {
    sceneType: "love_killpig",
    scene: "反诈志愿站的值班室，消息不停地弹。",
    actors: ["coord", "xiaoya", "zhanghao"],
    tasks: [
      { id: "t1", title: "劝住「小雅」停止转账", cond: null },
      { id: "t2", title: "识别当前骗局阶段", cond: "t1" },
      { id: "t3", title: "安抚受害者情绪", cond: "t2" },
      { id: "t4", title: "向警方提供线索", cond: "t3" },
    ],
    start: "co_1",
    nodes: {
      co_1: { speaker: "coord", day: 1, phase: "接到求助",
        text: "灯塔，有个姑娘小雅在群里问「提现不了怎么办」，八成正在被杀猪盘收割。你去接一下，别吓着她。",
        options: [
          { text: "我马上联系她。", tone: "neutral", next: "co_1b" },
          { text: "她是什么情况？有更多信息吗？", tone: "cautious", next: "co_1b" },
        ] },
      co_1b: { speaker: "coord", day: 1, phase: "背景简报",
        text: "据群里其他志愿者说，她已经投了3万，现在骗子让她再交5万保证金。典型的「杀猪盘」收割阶段。她情绪应该很不稳定——先别急着说教，先听她说。",
        options: [
          { text: "明白了，先倾听再引导。", tone: "neutral", next: "xy_1" },
          { text: "好，我这就去。", tone: "warm", next: "xy_1" },
        ] },

      /* --- 第1天：危机介入（3轮） --- */
      xy_1: { speaker: "xiaoya", day: 1, phase: "危机中",
        text: "客服说要再交5万「保证金」才能提现，我已经投了3万了……不交前面的钱是不是就没了？我该怎么办啊？",
        options: [
          { text: "别再转了！这就是典型的「杀猪盘」，钱越交越多。", tone: "counter", susp: 0, grant: "t1", next: "xy_1a" },
          { text: "你先冷静，把对方话术发我看看。", tone: "warm", susp: 0, grant: "t2", next: "xy_1a" },
        ] },
      xy_1a: { speaker: "xiaoya", day: 1, phase: "受害者挣扎",
        text: "可是……我已经投了3万了啊。如果不交这5万，是不是之前投的就彻底没了？他说这是「系统规则」，不是他在坑我……",
        options: [
          { text: "这就是骗局的套路——每次都说「再交一笔就能拿回来」。实际上永远拿不回来。", tone: "counter", susp: 0, grant: "t2", next: "xy_1b" },
          { text: "我理解你的心情。不如我们先聊聊，你是怎么认识他的？", tone: "warm", susp: 0, next: "xy_1b" },
        ] },
      xy_1b: { speaker: "xiaoya", day: 1, phase: "开始冷静",
        text: "……是刷社交软件认识的。他说话特别会关心人，我加班到半夜他还会发消息问累不累……现在想想，那些全是套路吧？",
        options: [
          { text: "对，这叫「情感铺垫」，是杀猪盘的标准第一步。", tone: "neutral", susp: 0, next: "xy_2" },
          { text: "你不是第一个被骗的，也不会是最后一个。先别自责。", tone: "warm", susp: 0, next: "xy_2" },
        ] },

      /* --- 第2天：动摇与说服（2轮） --- */
      xy_2: { speaker: "xiaoya", day: 2, phase: "动摇",
        text: "可是……他对我特别好，会不会真的只是平台问题？我要是不交，之前的3万不就打水漂了？",
        options: [
          { text: "他对你好，是为了让你交更多。已投的先止损，别再追。", tone: "counter", susp: 0, grant: "t3", next: "xy_2a" },
          { text: "我懂你舍不得，但沉没成本不该让你赔更多。", tone: "warm", susp: 0, next: "xy_2a" },
        ] },
      xy_2a: { speaker: "xiaoya", day: 2, phase: "动摇加剧",
        text: "沉没成本……这个词我在网上见过。但真到自己身上，完全控制不住。他今天又发消息了，说只剩最后三天机会，再不交保证金名额就没了。语气特别着急。",
        options: [
          { text: "「最后三天」是制造的紧迫感——他越急，说明你越不该跟。", tone: "counter", susp: 0, next: "xy_2b" },
          { text: "把那条消息截屏给我。这就是证据。", tone: "neutral", susp: 0, evidence: true, next: "xy_2b" },
        ] },
      xy_2b: { speaker: "xiaoya", day: 2, phase: "开始醒悟",
        text: "（发来截图）你看，他每次说话都像催命一样……其实我也觉得不对劲了。但我就是不甘心那3万块。",
        options: [
          { text: "3万已经没了，但你的理智还在。明天我们聊聊怎么报警。", tone: "warm", susp: 0, next: "xy_3" },
          { text: "不甘心是对骗子最好的配合。咱们先报警止损。", tone: "counter", susp: 0, next: "xy_3" },
        ] },

      /* --- 第3天：醒悟 --- */
      xy_3: { speaker: "xiaoya", day: 3, phase: "醒悟",
        text: "……我好像明白了。我把他所有聊天记录、转账截图整理好了，接下来我该做什么？",
        options: [
          { text: "立刻拨96110报警，我帮你把线索同步给民警。", tone: "neutral", susp: 0, grant: "t4", next: "xy_3a" },
          { text: "先冻结银行卡，再报警，证据都留好。", tone: "neutral", susp: 0, next: "xy_3a" },
        ] },
      xy_3a: { speaker: "xiaoya", day: 3, phase: "决心已定",
        text: "好，我这就报警。谢谢你——要不是你一直跟我说，我可能还在往深渊里走。",
        options: [
          { text: "去做吧，每一步都是自救。", tone: "warm", susp: 0, next: "final" },
          { text: "报警之后如果有需要，随时找我。", tone: "warm", susp: 0, next: "final" },
        ] },

      /* --- 第4天：收尾 --- */
      final: { speaker: "coord", day: 4, phase: "收尾",
        text: "干得漂亮，灯塔。小雅止损成功，还愿意现身说法。但你也要注意——骗子可能盯上劝阻者。你的信息保护好了吗？",
        options: [
          { text: "我一直用工作号，个人信息没外露。", tone: "cautious", ending: "light_A" },
          { text: "我为了取信她，把私人微信给了她……", tone: "warm", ending: "light_C" },
        ] },
    },
    endings: {
      light_A: { title: "结局 A · 成功救援", good: true,
        text: "小雅止损、报警，还加入了志愿站现身说法。这个月，你们的小站又拦下了 7 起转账。灯亮着，就有人能靠岸。",
        review: "劝阻的关键：戳破「沉没成本」与「他对我好」的幻觉。你做到了。" },
      light_C: { title: "结局 C · 被报复", good: false,
        text: "小雅得救了，但骗子拿到了你的私人微信，开始骚扰、威胁、人肉。助人没有错，可保护好自己，才能帮更多人。",
        review: "做志愿者也要有「边界感」：工作与私人身份分离，是自我保护的第一课。" },
    },
  },

  /* ================================================================
   * 普通网友 · 浮萍（4天，每天 2 轮）
   * ================================================================ */
  drift: {
    sceneType: "invest_platform",
    scene: "周五晚上，你窝在沙发里刷手机。",
    actors: ["zhanghao"],
    tasks: [
      { id: "t1", title: "完成 3 轮日常对话", cond: null },
      { id: "t2", title: "判断对方是否可信", cond: "t1" },
      { id: "t3", title: "识别骗术类型", cond: "t2" },
    ],
    start: "zh_1",
    nodes: {
      zh_1: { speaker: "zhanghao", day: 1, phase: "寻猪·搭讪", grant: "t1",
        text: "你好呀，刷到你觉得挺投缘的，交个朋友？我做金融的，一个人在外地。",
        options: [
          { text: "你好，聊聊也行。", tone: "warm", susp: 0, next: "zh_1a" },
          { text: "陌生人加好友都说自己做金融。", tone: "cautious", susp: 0, next: "zh_1a" },
        ] },
      zh_1a: { speaker: "zhanghao", day: 1, phase: "寻猪·套近乎",
        text: "哈哈哈你说话挺有意思的。我是真做金融的——不信你看我朋友圈。一个人在外地不容易，多个朋友多条路嘛。你平时喜欢做什么？",
        options: [
          { text: "追剧、睡觉、偶尔打游戏。", tone: "neutral", susp: 0, next: "zh_1b" },
          { text: "工作太累了，没什么特别爱好。", tone: "warm", susp: 0, next: "zh_1b" },
          { text: "你先说说你做什么金融的？", tone: "cautious", susp: 0, next: "zh_1b" },
        ] },
      zh_1b: { speaker: "zhanghao", day: 1, phase: "寻猪·收尾",
        text: "投资这块，具体明天跟你说。今天先聊到这，你也早点休息。晚安～",
        options: [
          { text: "晚安。", tone: "neutral", susp: 0, next: "zh_2" },
          { text: "嗯，明天聊。", tone: "warm", susp: 0, next: "zh_2" },
        ] },

      zh_2: { speaker: "zhanghao", day: 2, phase: "诱猪·铺垫",
        text: "我舅是证券的，偶尔给点内部消息，跟我的朋友都小赚了。你有兴趣了解下不？",
        options: [
          { text: "内部消息？听着有点心动。", tone: "warm", susp: 0, next: "zh_2a_warm" },
          { text: "「内部消息」「稳赚」都是老骗术了吧。", tone: "cautious", susp: 0, grant: "t2", next: "zh_2a_cautious" },
        ] },
      zh_2a_warm: { speaker: "zhanghao", day: 2, phase: "诱猪·展示",
        text: "心动就对了！我给你看个东西——（发来一张收益截图，显示+800元）。这是我上周的操作，就跟着老师买了两手而已。不信你可以网上查「恒盈量化」这个平台，正规注册的。",
        options: [
          { text: "看起来挺诱人的，具体怎么操作？", tone: "warm", susp: 0, next: "zh_2b" },
          { text: "这截图网上随便搜的也能做吧？", tone: "cautious", susp: 0, next: "zh_2b" },
        ] },
      zh_2a_cautious: { speaker: "zhanghao", day: 2, phase: "诱猪·展示",
        text: "骗术？你看你说的。我给你看个东西——（发来一张收益截图，显示+800元）。这是我上周的操作，就跟着老师买了两手而已。不信你可以网上查「恒盈量化」这个平台，正规注册的。",
        options: [
          { text: "看起来挺诱人的，具体怎么操作？", tone: "warm", susp: 0, next: "zh_2b" },
          { text: "这截图网上随便搜的也能做吧？", tone: "cautious", susp: 0, next: "zh_2b" },
        ] },
      zh_2b: { speaker: "zhanghao", day: 2, phase: "诱猪·下饵",
        text: "你不信我也没办法。但我跟你说——机会这东西，错过了就没了。明天我老师放一批名额，你想好了告诉我。",
        options: [
          { text: "好，我想想。", tone: "neutral", susp: 0, next: "zh_3" },
          { text: "名额有多少？很抢手吗？", tone: "cautious", susp: 0, next: "zh_3" },
        ] },

      zh_3: { speaker: "zhanghao", day: 3, phase: "养猪·抛饵",
        text: "要不你先充5000试试？我教你操作，两天见收益，赚了请我喝奶茶就行～",
        options: [
          { text: "好呀，怎么充？", tone: "warm", susp: 0, ending: "drift_A" },
          { text: "只要涉及先充钱的，我一律拉黑。", tone: "counter", susp: 0, grant: "t3", ending: "drift_B" },
          { text: "我假装感兴趣，套套他老底。", tone: "cautious", susp: 0, grant: "t3", ending: "drift_C" },
        ] },
    },
    endings: {
      drift_A: { title: "结局 A · 被骗", good: false,
        text: "第一次充5000真的「赚」了800，你加投到8万。想提现时账户被冻结，需要再交「保证金」……「张浩」消失了，钱也没了。",
        review: "第一次「小赚」是钩子。记住：任何让你先充值的「投资」，都是诈骗。" },
      drift_B: { title: "结局 B · 识破", good: true,
        text: "你干脆利落地拉黑举报。几天后你在反诈App看到，同一个头像已被标记为「高危账号」。你的果断，替自己省下了一场灾难。",
        review: "识别杀猪盘只需一句话：谈感情、谈内部消息、让你充钱——三连命中，立即拉黑。" },
      drift_C: { title: "结局 C · 反骗", good: true,
        text: "你顺着他演，套出了平台名、账号和话术，转手全举报给了反诈中心。你全身而退，还帮警方多留了一份线索。",
        review: "普通人不必逞强「反骗」，但保持清醒、留存证据、及时举报，永远是对的。" },
    },
  },

  /* ================================================================
   * 受害者的朋友 · 寻人（4天，每天 2 轮）
   * ================================================================ */
  seeker: {
    sceneType: "love_killpig",
    scene: "陈露已经三天没回消息了。她最后说：「我找到赚大钱的路子了。」",
    actors: ["police110", "chenlu", "zhanghao"],
    tasks: [
      { id: "t1", title: "找到陈露最后的线索", cond: null },
      { id: "t2", title: "假装汇款取得骗子信任", cond: "t1" },
      { id: "t3", title: "锁定陈露被困地点", cond: "t2" },
      { id: "t4", title: "报警而不激怒骗子", cond: "t3" },
    ],
    start: "cl_1",
    nodes: {
      cl_1: { speaker: "chenlu", day: 1, phase: "最后的消息",
        text: "（陈露3天前的聊天记录）「这边高薪，包吃住，我先去看看，别告诉我爸妈。」定位显示：边境口岸附近。",
        options: [
          { text: "顺着她加过的「招聘」号摸过去。", tone: "neutral", susp: 0, grant: "t1", next: "cl_1a" },
          { text: "先报警登记，再自己找线索。", tone: "cautious", susp: 0, next: "cl_1a" },
        ] },
      cl_1a: { speaker: "police110", day: 1, phase: "警方介入",
        text: "收到你的报案，已记录陈露的身份信息和最后定位。你先不要去边境，那边情况复杂。如果能联系上对方的人，尽量套出具体地址。有进展随时通知我们。",
        options: [
          { text: "明白，我先试着接触。", tone: "neutral", susp: 0, next: "zh_1" },
          { text: "我该怎么跟骗子开口才不引起怀疑？", tone: "cautious", susp: 0, next: "zh_1" },
        ] },

      /* --- 第2天：接触骗子（3轮） --- */
      zh_1: { speaker: "zhanghao", day: 2, phase: "接触骗子",
        text: "想找陈露？她在我们这儿「上班」呢，挺好的。你也想来？先交2000「担保费」我安排你过来团聚。",
        options: [
          { text: "行，我交，你先给我看看她现在的样子。", tone: "counter", susp: 10, grant: "t2", next: "zh_1a" },
          { text: "你把她放了，我给钱！", tone: "warm", susp: 25, next: "zh_1a" },
        ] },
      zh_1a: { speaker: "zhanghao", day: 2, phase: "骗子打太极",
        text: "她好好的，每天上班赚钱。但照片不能随便发——我们这儿有规定。你先交钱，到了自然见到她。",
        options: [
          { text: "我怎么知道你没骗我？至少让我跟她视频一下。", tone: "cautious", susp: 18, next: "zh_1b" },
          { text: "那钱转给谁？什么账户？", tone: "neutral", susp: 8, next: "zh_1b" },
          { text: "好，我先转2000，你把账户发我。", tone: "warm", susp: 4, next: "zh_1b" },
        ] },
      zh_1b: { speaker: "zhanghao", day: 2, phase: "骗子松口",
        text: "行行行——这是上个月的监控截图，你看她不是挺好的吗？（发来一段模糊的园区监控画面）明天我把具体地址发你。钱先不急，你先想好来不来。",
        options: [
          { text: "我看清了，是XX园区的招牌。（记下来）", tone: "cautious", susp: 4, grant: "t3", next: "zh_2" },
          { text: "好，我考虑一下。", tone: "neutral", susp: 3, next: "zh_2" },
        ] },

      /* --- 第3天：锁定位置 --- */
      zh_2: { speaker: "zhanghao", day: 3, phase: "锁定位置",
        text: "（发来一段视频，背景能看到某园区招牌）看，她好好的。你到了这个口岸，有人接你。",
        options: [
          { text: "我记下了园区名，先稳住他。（暗中记录）", tone: "cautious", susp: 6, grant: "t3", next: "zh_2a" },
          { text: "我这就买票过去接她！", tone: "warm", susp: 4, next: "bad" },
        ] },
      zh_2a: { speaker: "police110", day: 3, phase: "警方反馈",
        text: "你提供的园区画面和招牌信息与已有情报吻合，已联系境外警方协作。接下来别再单独联系骗子，也千万别去边境。你能做到吗？",
        options: [
          { text: "我听警方的，把线索都交给你们。", tone: "neutral", susp: 0, grant: "t4", next: "final" },
          { text: "我有点不放心，万一警方动作太慢呢？", tone: "cautious", susp: 0, next: "final" },
        ] },

      /* --- 第4天：关键抉择 --- */
      final: { speaker: "police110", day: 4, phase: "关键抉择",
        text: "跨境救援需要时间，但我们已经启动程序。你提供的线索非常关键——现在最需要的，是耐心。相信我，也相信你自己。",
        options: [
          { text: "我听警方的，把线索都交给你们。", tone: "neutral", ending: "seek_A" },
          { text: "我等不了，我要自己去救她！", tone: "warm", ending: "seek_C" },
        ] },
      bad: { speaker: "zhanghao", day: 4, phase: "陷阱",
        text: "很好，到了口岸给我发定位，我来接你——记得别报警，不然你朋友就见不到了。",
        options: [
          { text: "我……好。（准备出发）", tone: "warm", ending: "seek_C" },
          { text: "不对，这是圈套。我立刻报警。", tone: "counter", ending: "seek_A" },
        ] },
    },
    endings: {
      seek_A: { title: "结局 A · 成功营救", good: true,
        text: "你冷静保留的园区画面成为定位关键，跨境警务协作介入，陈露被解救回国。她抱着你哭：「我以为再也回不来了。」",
        review: "亲人失联涉「境外高薪」，第一时间报警、提供线索，比自己冲过去有效千百倍。" },
      seek_C: { title: "结局 C · 自己陷入", good: false,
        text: "你赶到边境，接你的人把你也带进了园区。两个人，谁也没能回来。骗子要的从来不是「救人」，而是「再骗一个」。",
        review: "「别报警不然见不到朋友」——这句话本身，就是最危险的信号。切勿只身前往边境。" },
    },
  },

  /* ================================================================
   * 退休教师 · 春蚕（6天，情感需求 vs 人生智慧）
   * ================================================================ */
  teacher: {
    sceneType: "love_killpig",
    scene: "白墙灰瓦的教师公寓，书架落着薄灰。退休后唯一热闹的——是手机上的聊天提醒。",
    actors: ["xiaoyun", "laowang"],
    tasks: [
      { id: "t1", title: "不要透露真实住址和退休金数额", cond: null },
      { id: "t2", title: "识别对方话术中的情感操控", cond: "t1" },
      { id: "t3", title: "在不见面的情况下判断真实意图", cond: "t2" },
      { id: "t4", title: "保护退休积蓄不被骗走", cond: "t3" },
    ],
    start: "xy_1",
    nodes: {
      /* --- 第1天：初遇（2轮） --- */
      xy_1: { speaker: "xiaoyun", day: 1, phase: "意外的好友",
        text: "陈老师好！我是您学生的家长，王爸爸推荐的。听说您教了三十年语文，我女儿最近作文不好，能请教您吗？",
        options: [
          { text: "当然可以！是哪方面的作文？说来听听。", tone: "warm", susp: 2, next: "xy_1a" },
          { text: "王爸爸？哪位王爸爸？我班上姓王的学生好几个。（谨慎）", tone: "cautious", awareness: 5, next: "xy_1a" },
        ] },
      xy_1a: { speaker: "xiaoyun", day: 1, phase: "拉近关系",
        text: "就是王建国爸爸呀！他说您人特别好，退休了还愿意帮孩子。其实我也没什么朋友，能认识您真好。您一个人住吗？孩子在北京工作？",
        options: [
          { text: "是啊退休了闲着也是闲着。我孩子确实在国外。", tone: "warm", exposure: 1, conscience: -3, next: "xy_1b" },
          { text: "你怎么知道我孩子在哪儿工作？（警惕）", tone: "cautious", awareness: 8, next: "xy_1b" },
        ] },
      xy_1b: { speaker: "xiaoyun", day: 1, phase: "轻描淡写", grant: "t1",
        text: "王爸爸随口提的～聊天不是为了打听隐私啦。陈老师，您一看就是那种热心肠的人，我就觉得跟您很投缘。明天再聊？",
        options: [
          { text: "好啊，不早了，你也早点休息。", tone: "warm", susp: 1, next: "xy_2" },
          { text: "你发的照片是你本人吗？怎么看着眼熟。", tone: "cautious", awareness: 6, next: "xy_2" },
        ] },

      /* --- 第2天：情感升温（2轮） --- */
      xy_2: { speaker: "xiaoyun", day: 2, phase: "每日问候", grant: "t2",
        text: "早安陈老师🌞 昨晚做了一桌菜，一个人吃好孤单。突然想到您是不是也一个人做饭？以后我们可以「云吃饭」哈哈哈。",
        options: [
          { text: "哈哈你这孩子真会逗人开心。今天心情都好了。", tone: "warm", conscience: -2, next: "xy_2a" },
          { text: "（微笑表情）谢谢关心，这感觉确实不错。不过我们才认识两天。", tone: "neutral", awareness: 5, next: "xy_2a" },
        ] },
      xy_2a: { speaker: "xiaoyun", day: 2, phase: "加深印象",
        text: "陈老师，我今天升职了！开心到想立刻告诉您——因为觉得您是真心为我高兴的人。不如图个彩头，我教你买个理财产品？保本的，就当庆祝。",
        options: [
          { text: "升职是好事！不过理财不急，叔叔不玩这些。", tone: "cautious", awareness: 10, redFlag: true, next: "xy_3" },
          { text: "保本的话……听一听也行。什么产品？", tone: "warm", trust: -10, conscience: -5, next: "xy_3" },
        ] },

      /* --- 第3天：攻势升级（2轮） --- */
      xy_3: { speaker: "xiaoyun", day: 3, phase: "情感索取",
        text: "陈老师……实话跟您说吧，这个名额是内部才有的，很多同事都想买买不到。我把您当家人，才第一个跟您说。您信我吗？",
        options: [
          { text: "我信你。但内部理财——正规吗？在哪注册的？", tone: "cautious", awareness: 8, grant: "t3", next: "xy_3a" },
          { text: "当然信啊。那怎么操作？我要转多少钱？", tone: "warm", conscience: -8, route: "scammed", next: "xy_3a" },
        ] },
      xy_3a: { speaker: "xiaoyun", day: 3, phase: "施压",
        text: "正规的，都在APP里。您投五万——我帮您做，三个月翻倍，到时候随便取。错过了就真的没了。别人求我都拿不到呢。",
        options: [
          { text: "五万不是小数目，我再想想。", tone: "cautious", awareness: 8, consciousness: 5, next: "lw_1" },
          { text: "好，那就先投五万试试。怎么转账？", tone: "warm", transfer: true, trust: -5, conscience: -12, route: "scammed", next: "lw_1" },
        ] },

      /* --- 第4天：老友警醒（2轮） --- */
      lw_1: { speaker: "laowang", day: 4, phase: "老友提醒", grant: "t4",
        text: "老陈！隔壁楼的李老师上当受骗了——跟你聊的还是同一个人！那个「小云」，照片是网上偷的，专门骗退休教师。你转了没有？",
        options: [
          { text: "还没转（庆幸）。老王，你帮我看看这些聊天记录。", tone: "neutral", awareness: 15, evidenceFrag: "friend_warning", next: "lw_1a" },
          { text: "什么？不可能吧……她对我那么好。(震惊)", tone: "neutral", conscience: 5, awareness: 15, next: "lw_1a" },
        ] },
      lw_1a: { speaker: "laowang", day: 4, phase: "识破真相",
        text: "你看——话术一模一样的！先是套近乎，然后关心你孤不孤独，最后就是卖产品。这些骗子太熟悉退休老人的心理了。去举报吧，老陈。",
        options: [
          { text: "你说得对。我马上去派出所。谢谢你，老王。", tone: "counter", evidenceFrag: "scam_pattern_matched", ending: "teacher_A" },
          { text: "算了，就当花钱买教训……我认了。", tone: "neutral", conscience: -5, ending: "teacher_B" },
        ] },

      /* --- 第5天：收尾 --- */
    },
    endings: {
      teacher_A: { title: "结局 A · 看破不说破", good: true,
        text: "你把聊天记录交给派出所民警。他们一看就确认了——这是典型的针对退休老人的「杀猪盘」。你没有转钱，反而帮助了更多人。",
        review: "教书育人一辈子，最后的课是给自己上的：孤独不是弱点，它是很多人都会有的感受。但钱的问题，一定要跟可靠的人商量。" },
      teacher_B: { title: "结局 B · 难以启齿", good: false,
        text: "你终究把钱转了出去。几周后，对方消失了，你的退休金少了一大块。你不想跟任何人说——当了三十年老师，到头来被骗子「上了一课」。",
        review: "骗子的最佳猎物不是愚蠢的人，而是孤独的人。你的人生阅历在这里不是弱点——关键是在钱的问题上，慢一点，问一句。" },
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
  { ic: "🧊", t: "沉没成本陷阱", d: "「不再投就拿不回」是最常见的收割话术。" },
];

const KEYWORDS = ["不轻信","不透露","不转账","不点击","不共享屏幕","不贪高收益","不下载陌生APP","不扫陌生码","不接境外来电","不交保证金","不垫资","不信内部消息","不出租出借账户","不刷单","不信「安全账户」","不境外高薪","不培训贷","不泄露验证码","涉钱先核实","可疑就拨96110"];

/* ===================== 第三幕·废墟：四个应对行动 ===================== */
const RUINS_ACTIONS = [
  { id: "call_police", ic: "🚔", t: "立即报警", d: "拨打96110，提供对方账号、聊天记录、转账凭证", tip: "✅ 已记录报警步骤。记住：被骗后的黄金30分钟是止付关键期。" },
  { id: "freeze_card", ic: "💳", t: "冻结账户", d: "联系银行冻结涉案账户，阻止资金继续流出", tip: "✅ 已记录冻结流程。第一时间联系银行客服，说明疑似诈骗。" },
  { id: "talk_friend", ic: "💬", t: "告诉信任的人", d: "不要独自承受，找一个你信任的人说出来", tip: "✅ 你做到了。羞耻感是骗子的帮凶，说出来才是自救。" },
  { id: "spread_alert", ic: "📢", t: "传播警示", d: "把你的经历分享给身边的人，防止更多受害者", tip: "✅ 每一句提醒，都可能拦住下一个即将转账的人。" },
];

/* ===================== 第四幕·平行宇宙：示例问答 ===================== */
const PARALLEL_SAMPLES = {
  hunter: [
    { q: "如果第3天我就表明身份呢？", a: "张浩会立刻拉黑你并清空聊天记录。团伙连夜转移，你的7天潜伏前功尽弃——骗子对'异常'极其敏感。" },
    { q: "如果我直接转5000给他取证呢？", a: "5000块大概率拿不回来。虽然证据更扎实，但'以身饲虎'在现实中可能导致更大损失——警方不建议任何人真的转账。" },
    { q: "如果我不联系小雅呢？", a: "小雅会继续转账，直到积蓄掏空。你的线人任务完成了，但一条无辜的人生轨迹可能就此崩塌。" },
  ],
  scribe: [
    { q: "如果我直接亮出记者证呢？", a: "张浩会立刻警觉并通风报信，整条线索中断。卧底调查靠的是'不被发现'，而不是'理直气壮'。" },
    { q: "如果我不找张浩，只采访受害者呢？", a: "你会写出一篇感人的受害者故事，但缺少骗子一手的套路还原——稿子有温度，但没深度。" },
  ],
  lighthouse: [
    { q: "如果我劝不住小雅呢？", a: "有些受害者需要多次介入才能醒悟。你可以留一个求助渠道给她，而不是一次劝不住就放弃。" },
    { q: "如果我把私人微信给了每一个求助者呢？", a: "善意的代价可能是个人信息被泄露给骗子——助人者和受害者之间，也需要一道安全的边界。" },
  ],
  drift: [
    { q: "如果我一开始就拉黑呢？", a: "那你就少了一段'差点被骗'的体验。但对现实来说，这正是最正确的做法——不接触、不试探、直接拉黑。" },
    { q: "如果我跟着他充5000试试呢？", a: "第一次'赚'800会消除你的戒心，然后你会越陷越深——这就是杀猪盘的标准剧本。" },
  ],
  seeker: [
    { q: "如果我自己去边境找陈露呢？", a: "接你的人会把你也带进园区。骗子要的不是'放人'，而是'再多一个'——切勿只身前往。" },
    { q: "如果我不报警，直接跟骗子谈判呢？", a: "骗子不会跟你谈判，他们只会评估你值多少钱。面对跨境诈骗，警方是唯一有效的力量。" },
  ],
  teacher: [
    { q: "如果我一开始就拒绝加好友呢？", a: "不少退休老人在社交平台上因为孤独而放开防线。问题不是社交本身，而是在谈钱之前多问一句：这个人是真的吗？" },
    { q: "如果我转了五万进去呢？", a: "那很可能是你退休金的一大块。骗子会用「需要追加保证金才能提现」继续套你——然后你就被深度套牢了。" },
    { q: "为什么教师也会被骗？", a: "骗术不挑学历。陈老师一辈子教书育人，但退休后的孤独感——是任何文凭都防不住的漏洞。" },
  ],
  default: [
    { q: "如果一开始就不点开那个链接呢？", a: "那一切都不会发生。现实中，90%的诈骗始于一次'好奇心'——不点陌生链接，是最简单也最有效的防护。" },
    { q: "如果我把所有财产都交给别人保管呢？", a: "防骗不是'不碰钱'，而是'学会判断'——过度恐惧和过度信任，是同一枚硬币的两面。" },
  ],
};
