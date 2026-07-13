/* 异次元梦想局 · V7.0 数据层
 * 任务驱动的沉浸式叙事模拟器
 * 6 身份 × 任务链 × 多角色对话网络 × 反卧底 AI × 身份专属结局
 */

/* ===================== 身份系统 ===================== */
const IDENTITIES = {
  hunter: {
    id: "hunter", codename: "猎鹰", role: "卧底警察", name: "林晨",
    color: "#FF6B35", star: 5, risk: "极高", days: 7,
    avatar: "鹰",
    mission: "打入“XX金融”诈骗团伙内部收集证据",
    danger: "被识破将面临人身威胁",
    handler: { key: "laok", name: "老K", desc: "唯一知道你身份的人" },
    brief: [
      "添加目标“张浩”为好友",
      "建立信任，获取其“上级”信息",
      "收集转账证据",
      "在收到“收网”指令前绝不暴露",
    ],
    oath: "“7天，只许成功，不许失败。”",
    exp: "紧张刺激的卧底体验",
  },
  scribe: {
    id: "scribe", codename: "笔锋", role: "记者调查员", name: "苏晚",
    color: "#2C7BE5", star: 4, risk: "高", days: 5,
    avatar: "笔",
    mission: "调查诈骗产业链，撰写深度报道",
    danger: "被威胁将被迫放弃调查",
    handler: { key: "editor", name: "主编老陆", desc: "你的选题负责人" },
    brief: [
      "获取 3 位受害者的联系方式",
      "收集 5 个骗术套路",
      "假装受害者接触“张浩”",
      "锁定“上线”的真实信息",
    ],
    oath: "“真相，值得我冒这个险。”",
    exp: "揭开黑幕的使命感",
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
      "建立“反诈互助群”",
      "安抚受害者情绪",
      "向警方提供骗子线索",
    ],
    oath: "“哪怕只救回一个人，也值得。”",
    exp: "助人者的责任感",
  },
  drift: {
    id: "drift", codename: "浮萍", role: "普通网友", name: "你自己",
    color: "#9B59B6", star: 2, risk: "高", days: 4,
    avatar: "萍",
    mission: "在社交平台上正常生活",
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
  },
  seeker: {
    id: "seeker", codename: "寻人", role: "受害者的朋友", name: "方寻",
    color: "#E67E22", star: 4, risk: "中高", days: 4,
    avatar: "寻",
    mission: "寻找失联的好友“陈露”",
    danger: "自己也可能被骗子困住",
    handler: { key: "police110", name: "值班民警", desc: "报案后对接的警官" },
    brief: [
      "找到朋友的最后位置",
      "假装“汇款”获取骗子信任",
      "锁定朋友被困地点",
      "在不激怒骗子的前提下报警",
    ],
    oath: "“陈露，等我，我一定把你找回来。”",
    exp: "急迫感和情感驱动",
  },
  mole: {
    id: "mole", codename: "鼹鼠", role: "内部线人", name: "周深",
    color: "#7F8C8D", star: 5, risk: "极高", days: 5,
    avatar: "鼠",
    mission: "潜伏诈骗窝点，为警方提供情报",
    danger: "身份暴露将无法脱身",
    handler: { key: "laok", name: "老K", desc: "线上唯一联络人" },
    brief: [
      "获取团队结构信息",
      "记录诈骗完整流程",
      "锁定团队负责人",
      "在暴露前传出关键证据",
    ],
    oath: "“我在他们中间，但我不是他们。”",
    exp: "最危险的体验",
  },
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

/* ===================== 反卧底检测规则（骗子 AI 对“太主动”的人产生警觉） ===================== */
/* 玩家每一步会累计 suspicion（骗子怀疑度）。达到阈值触发反问/防御。 */
const ANTI_UNDERCOVER = {
  keywords: [
    { re: /警察|卧底|证据|录音|录屏|举报|调查|抓|派出所|公安/, add: 40, line: "你……在录音？还是你是来查我的？（对方语气突然冷了下来）" },
    { re: /你是谁|你到底|真名|身份证|营业执照|你公司在哪/, add: 22, line: "你怎么对我这么好奇？普通朋友哪问这些。" },
    { re: /骗|诈骗|假的|不信|忽悠/, add: 25, line: "你话里有话啊，是不信我？那算了。" },
  ],
  // 行为异常：连续追问细节
  overQuestion: { add: 12, line: "你问得也太细了，怎么像在做笔录一样。" },
  // 过度配合
  overCompliant: { add: 15, line: "你太配合了，配合得有点不正常……你不会有别的目的吧？" },
  threshold: 60, // suspicion ≥ 60 → 骗子进入防御模式（可能识破）
};

/* ===================== 剧情：每个身份的任务链 + 逐日对话 ===================== */
/* conv 中每个节点：
 *   speaker: actor key
 *   text: 台词
 *   psy: 心理学手段 / 阶段标注
 *   grant: 完成的任务 id（可选）
 *   options: [{ text, tone(warm/neutral/cautious/counter), susp(怀疑增量), evidence(是否算取证), next, ending }]
 */

const STORIES = {
  /* ---------- 卧底警察·猎鹰（完整线） ---------- */
  hunter: {
    scene: "深夜的出租屋，手机屏幕是唯一的光。",
    actors: ["laok", "zhanghao", "xiaoya", "anon"],
    tasks: [
      { id: "t1", title: "添加“张浩”为好友", cond: null },
      { id: "t2", title: "获取“投资项目”名称", cond: "t1" },
      { id: "t3", title: "套出“上线”联系方式", cond: "t2" },
      { id: "t4", title: "保存转账/收益证据", cond: "t3" },
      { id: "t5", title: "在收网前不暴露身份", cond: "t4" },
    ],
    start: "laok_1",
    nodes: {
      laok_1: { speaker: "laok", day: 1, phase: "任务下达",
        text: "猎鹰，收到请回复。目标锁定“张浩”，混元资本诈骗团伙中层。你的任务：加他好友，取得信任，摸清上线。7天，别暴露。",
        options: [
          { text: "收到，马上行动。", tone: "neutral", next: "add_zhang" },
          { text: "他要是起疑怎么办？", tone: "cautious", next: "laok_2" },
        ] },
      laok_2: { speaker: "laok", day: 1, phase: "行前叮嘱",
        text: "记住：别问太细，别太配合，像个真人。他们对“太主动”的人最警觉。出事拨紧急联络。",
        options: [ { text: "明白，我上了。", tone: "neutral", next: "add_zhang" } ] },
      add_zhang: { speaker: "zhanghao", day: 1, phase: "寻猪·建立联系", grant: "t1",
        text: "你好呀，看你朋友圈挺正能量的，交个朋友？我做金融的，平时忙，很少主动加人。",
        options: [
          { text: "你好，做金融挺厉害的。", tone: "warm", susp: 2, next: "zh_2" },
          { text: "嗯，你是做哪块的？", tone: "neutral", susp: 4, next: "zh_2" },
          { text: "你具体哪家公司？注册地在哪？", tone: "cautious", susp: 20, next: "zh_2" },
        ] },
      zh_2: { speaker: "zhanghao", day: 2, phase: "诱猪·情感铺垫",
        text: "一个人在外地打拼，挺孤独的。对了，我舅是证券的，偶尔给点内部消息，跟着我操作的朋友都赚了。",
        options: [
          { text: "内部消息？是什么项目啊？", tone: "warm", susp: 6, grant: "t2", next: "zh_3" },
          { text: "哦，最近行情怎么样。", tone: "neutral", susp: 3, next: "zh_3" },
          { text: "什么项目、什么平台、准确率多少？", tone: "cautious", susp: 22, grant: "t2", next: "zh_3" },
        ] },
      zh_3: { speaker: "zhanghao", day: 3, phase: "养猪·抛出诱饵",
        text: "叫“恒盈量化”，老师带单。你要不要先小试一笔？充 5000 我教你，两天就能见收益。",
        options: [
          { text: "行，那你上线是谁？我想请教下大佬。", tone: "counter", susp: 10, grant: "t3", next: "zh_4" },
          { text: "先看看再说，你有收益截图吗？（截图）", tone: "neutral", susp: 5, evidence: true, next: "zh_4" },
          { text: "这平台正规吗？有没有牌照？", tone: "cautious", susp: 18, next: "zh_4" },
        ] },
      zh_4: { speaker: "zhanghao", day: 4, phase: "养猪·引荐上线", grant: "t3",
        text: "我上面是‘陈总’，很少露面。这是他的号，你就说我介绍的。（发来一个账号）",
        options: [
          { text: "好的，这条聊天我留着。（保存证据）", tone: "neutral", susp: 4, evidence: true, grant: "t4", next: "zh_5" },
          { text: "陈总平时也在这平台操作吗？他账户能看吗？", tone: "cautious", susp: 20, next: "zh_5" },
        ] },
      zh_5: { speaker: "zhanghao", day: 5, phase: "杀猪·催促转账",
        text: "小雅刚投了3万，今天账面涨了。你别犹豫，机会不等人。把钱转这个账户，我帮你盯。",
        options: [
          { text: "我先转 5000 试试，转账记录我截下来。（取证）", tone: "neutral", susp: 6, evidence: true, next: "zh_6" },
          { text: "我再想想，钱这两天有点紧。", tone: "cautious", susp: 8, next: "zh_6" },
          { text: "这不就是让我把钱打给你吗？", tone: "cautious", susp: 26, next: "zh_6" },
        ] },
      zh_6: { speaker: "laok", day: 6, phase: "收网前夜",
        text: "猎鹰，证据够了。今晚 24 点收网。你稳住张浩，别让他跑，也别让他起疑。",
        options: [
          { text: "收到，我拖住他。", tone: "neutral", next: "zh_final" },
          { text: "他好像有点怀疑我了……", tone: "cautious", next: "zh_final" },
        ] },
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
        text: "24 点整，警方同步收网。你提交的聊天记录、转账凭证、上线账号成为关键证据，“恒盈量化”团伙 11 人落网。你稳住了张浩，直到警灯亮起的那一刻。",
        review: "你赢了。但请记住：现实中没有“主角光环”，普通人遇到“张浩”，最该做的不是周旋，而是立刻挂断、报警。" },
      hunter_B: { title: "结局 B · 卧底暴露", good: false,
        text: "你的摊牌让张浩瞬间清空聊天、拉黑、失联。团伙连夜转移，你的位置也可能已被盯上。老K的消息只有一句：“撤，马上撤。”",
        review: "一句话就能毁掉七天。骗子对“异常”极其敏感——这正是为什么反诈强调“不接触、不周旋、直接报警”。" },
      hunter_C: { title: "结局 C · 反被利用", good: false,
        text: "你的沉默被张浩解读为“心动”。他趁机让你“先转5千验证诚意”，你恍惚间差点点下确认。等你回过神，才发现自己几乎从猎人变成了猎物。",
        review: "“我以为我在钓鱼，其实鱼在钓我。”——被骗从不是因为傻，而是因为骗子比你更懂你的处境。" },
    },
  },

  /* ---------- 记者调查员·笔锋 ---------- */
  scribe: {
    scene: "报社的深夜，只有你桌上一盏灯。",
    actors: ["editor", "xiaoya", "zhanghao"],
    tasks: [
      { id: "t1", title: "取得“小雅”信任", cond: null },
      { id: "t2", title: "收集骗术套路", cond: "t1" },
      { id: "t3", title: "假装受害者接触张浩", cond: "t2" },
      { id: "t4", title: "锁定上线真实信息", cond: "t3" },
    ],
    start: "ed_1",
    nodes: {
      ed_1: { speaker: "editor", day: 1, phase: "选题下达",
        text: "苏晚，这组“杀猪盘”产业链的稿子交给你。先找到受害者小雅，别惊动骗子。安全第一，稿子第二。",
        options: [
          { text: "我知道分寸，这就联系她。", tone: "neutral", next: "xy_1" },
          { text: "要是骗子发现记者在查呢？", tone: "cautious", next: "ed_2" },
        ] },
      ed_2: { speaker: "editor", day: 1, phase: "叮嘱",
        text: "所以你别暴露记者身份，就当一个也差点被骗的人。共情，别审问。",
        options: [ { text: "明白。", tone: "neutral", next: "xy_1" } ] },
      xy_1: { speaker: "xiaoya", day: 2, phase: "接触受害者", grant: "t1",
        text: "你也在恒盈量化投了吗？我投了3万，现在提不出来，好慌……你说这是不是骗人的？",
        options: [
          { text: "我也差点投，你先别再转钱了。", tone: "warm", susp: 0, next: "xy_2" },
          { text: "你从头跟我说说，他怎么一步步让你投的？", tone: "neutral", susp: 0, grant: "t2", next: "xy_2" },
        ] },
      xy_2: { speaker: "xiaoya", day: 3, phase: "还原套路",
        text: "他先加我聊感情，再说舅舅是证券的，然后拉我进群看‘老师带单’，第一次让我赚了800……我就信了。",
        options: [
          { text: "把他微信号给我，我去会会他。", tone: "counter", susp: 0, grant: "t3", next: "zh_1" },
          { text: "这些截图能发我留证吗？", tone: "neutral", susp: 0, next: "zh_1" },
        ] },
      zh_1: { speaker: "zhanghao", day: 4, phase: "假装受害者",
        text: "小雅介绍的？她是我们的老客户了。你也想跟着老师赚点？先加我，我带你。",
        options: [
          { text: "想啊，你上线老师是谁？靠谱吗？", tone: "cautious", susp: 16, grant: "t4", next: "zh_2" },
          { text: "行，怎么操作？（套流程）", tone: "neutral", susp: 6, next: "zh_2" },
        ] },
      zh_2: { speaker: "zhanghao", day: 5, phase: "露出马脚",
        text: "老师就是‘陈总’，别管那么多。你先充5万，晚了名额就没了——你不会也是来打听事的记者吧？",
        options: [
          { text: "怎么会，我这就准备钱。（稳住，收尾）", tone: "warm", susp: 4, ending: "scribe_A" },
          { text: "是又怎样？我就是来揭穿你的。", tone: "counter", susp: 100, ending: "scribe_B" },
          { text: "……要不我再想想。（迟疑）", tone: "cautious", susp: 20, ending: "scribe_C" },
        ] },
    },
    endings: {
      scribe_A: { title: "结局 A · 发表报道", good: true,
        text: "你拿到了完整的话术链条和资金去向。《三万块与一个消失的“陈总”》见报，全网转发，警方顺线介入。你没暴露，稿子救了更多“小雅”。",
        review: "记者的克制，就是最好的武器。真相不靠对骂赢得，靠证据。" },
      scribe_B: { title: "结局 B · 被威胁", good: false,
        text: "张浩截图存证，反手举报你“钓鱼采访”，还有人开始打听你的住址。主编让你停稿避风头。你赢了口舌，输了报道。",
        review: "情绪上头的一句“揭穿你”，可能让几个月的调查前功尽弃。" },
      scribe_C: { title: "结局 C · 妥协", good: false,
        text: "你的迟疑被对方拿捏，几天后你收到一笔“封口费”和一句“合作愉快”。稿子没发，你盯着屏幕，第一次觉得真相这么沉。",
        review: "有些代价，比钱更重。" },
    },
  },

  /* ---------- 反诈志愿者·灯塔 ---------- */
  lighthouse: {
    scene: "反诈志愿站的值班室，消息不停地弹。",
    actors: ["coord", "xiaoya", "zhanghao"],
    tasks: [
      { id: "t1", title: "劝住“小雅”停止转账", cond: null },
      { id: "t2", title: "识别当前骗局阶段", cond: "t1" },
      { id: "t3", title: "安抚受害者情绪", cond: "t2" },
      { id: "t4", title: "向警方提供线索", cond: "t3" },
    ],
    start: "co_1",
    nodes: {
      co_1: { speaker: "coord", day: 1, phase: "接到求助",
        text: "灯塔，有个姑娘小雅在群里问‘提现不了怎么办’，八成正在被杀猪盘收割。你去接一下，别吓着她。",
        options: [ { text: "我马上联系她。", tone: "neutral", next: "xy_1" } ] },
      xy_1: { speaker: "xiaoya", day: 1, phase: "危机中",
        text: "客服说要再交5万‘保证金’才能提现，我已经投了3万了……不交前面的钱是不是就没了？我该怎么办啊？",
        options: [
          { text: "别再转了！这就是典型的‘杀猪盘’，钱越交越多。", tone: "counter", susp: 0, grant: "t1", next: "xy_2" },
          { text: "你先冷静，把对方话术发我看看。", tone: "warm", susp: 0, grant: "t2", next: "xy_2" },
        ] },
      xy_2: { speaker: "xiaoya", day: 2, phase: "动摇",
        text: "可是……他对我特别好，会不会真的只是平台问题？我要是不交，之前的3万不就打水漂了？",
        options: [
          { text: "他对你好，是为了让你交更多。已投的先止损，别再追。", tone: "counter", susp: 0, grant: "t3", next: "xy_3" },
          { text: "我懂你舍不得，但沉没成本不该让你赔更多。", tone: "warm", susp: 0, next: "xy_3" },
        ] },
      xy_3: { speaker: "xiaoya", day: 3, phase: "醒悟",
        text: "……我好像明白了。我把他所有聊天记录、转账截图整理好了，接下来我该做什么？",
        options: [
          { text: "立刻拨96110报警，我帮你把线索同步给民警。", tone: "neutral", susp: 0, grant: "t4", next: "final" },
          { text: "先冻结银行卡，再报警，证据都留好。", tone: "neutral", susp: 0, next: "final" },
        ] },
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
        review: "劝阻的关键：戳破‘沉没成本’与‘他对我好’的幻觉。你做到了。" },
      light_C: { title: "结局 C · 被报复", good: false,
        text: "小雅得救了，但骗子拿到了你的私人微信，开始骚扰、威胁、人肉。助人没有错，可保护好自己，才能帮更多人。",
        review: "做志愿者也要有‘边界感’：工作与私人身份分离，是自我保护的第一课。" },
    },
  },

  /* ---------- 普通网友·浮萍 ---------- */
  drift: {
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
          { text: "你好，聊聊也行。", tone: "warm", susp: 0, next: "zh_2" },
          { text: "陌生人加好友都说自己做金融。", tone: "cautious", susp: 0, next: "zh_2" },
        ] },
      zh_2: { speaker: "zhanghao", day: 2, phase: "诱猪·铺垫",
        text: "我舅是证券的，偶尔给点内部消息，跟我的朋友都小赚了。你有兴趣了解下不？",
        options: [
          { text: "内部消息？听着有点心动。", tone: "warm", susp: 0, next: "zh_3" },
          { text: "‘内部消息’‘稳赚’都是老骗术了吧。", tone: "cautious", susp: 0, grant: "t2", next: "zh_3" },
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
        text: "第一次充5000真的“赚”了800，你加投到8万。想提现时账户被冻结，需要再交“保证金”……“张浩”消失了，钱也没了。",
        review: "第一次“小赚”是钩子。记住：任何让你先充值的‘投资’，都是诈骗。" },
      drift_B: { title: "结局 B · 识破", good: true,
        text: "你干脆利落地拉黑举报。几天后你在反诈App看到，同一个头像已被标记为“高危账号”。你的果断，替自己省下了一场灾难。",
        review: "识别杀猪盘只需一句话：谈感情、谈内部消息、让你充钱——三连命中，立即拉黑。" },
      drift_C: { title: "结局 C · 反骗", good: true,
        text: "你顺着他演，套出了平台名、账号和话术，转手全举报给了反诈中心。你全身而退，还帮警方多留了一份线索。",
        review: "普通人不必逞强‘反骗’，但保持清醒、留存证据、及时举报，永远是对的。" },
    },
  },

  /* ---------- 受害者的朋友·寻人 ---------- */
  seeker: {
    scene: "陈露已经三天没回消息了。她最后说：“我找到赚大钱的路子了。”",
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
        text: "（陈露3天前的聊天记录）“这边高薪，包吃住，我先去看看，别告诉我爸妈。”定位显示：边境口岸附近。",
        options: [
          { text: "顺着她加过的‘招聘’号摸过去。", tone: "neutral", susp: 0, grant: "t1", next: "zh_1" },
          { text: "先报警登记，再自己找线索。", tone: "cautious", susp: 0, next: "zh_1" },
        ] },
      zh_1: { speaker: "zhanghao", day: 2, phase: "接触骗子",
        text: "想找陈露？她在我们这儿‘上班’呢，挺好的。你也想来？先交2000‘担保费’我安排你过来团聚。",
        options: [
          { text: "行，我交，你先给我看看她现在的样子。", tone: "counter", susp: 10, grant: "t2", next: "zh_2" },
          { text: "你把她放了，我给钱！", tone: "warm", susp: 25, next: "zh_2" },
        ] },
      zh_2: { speaker: "zhanghao", day: 3, phase: "锁定位置",
        text: "（发来一段视频，背景能看到某园区招牌）看，她好好的。你到了这个口岸，有人接你。",
        options: [
          { text: "我记下了园区名，先稳住他。（暗中记录）", tone: "cautious", susp: 6, grant: "t3", next: "final" },
          { text: "我这就买票过去接她！", tone: "warm", susp: 4, next: "bad" },
        ] },
      final: { speaker: "police110", day: 4, phase: "关键抉择",
        text: "你提供的园区画面很关键，我们已联系境外警方协作。接下来别再单独联系骗子，也千万别去边境。你能做到吗？",
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
        text: "你冷静保留的园区画面成为定位关键，跨境警务协作介入，陈露被解救回国。她抱着你哭：“我以为再也回不来了。”",
        review: "亲人失联涉‘境外高薪’，第一时间报警、提供线索，比自己冲过去有效千百倍。" },
      seek_C: { title: "结局 C · 自己陷入", good: false,
        text: "你赶到边境，接你的人把你也带进了园区。两个人，谁也没能回来。骗子要的从来不是‘救人’，而是‘再骗一个’。",
        review: "‘别报警不然见不到朋友’——这句话本身，就是最危险的信号。切勿只身前往边境。" },
    },
  },

  /* ---------- 内部线人·鼹鼠 ---------- */
  mole: {
    scene: "境外某“园区”宿舍，摄像头在头顶闪着红光。",
    actors: ["laok", "zhanghao", "lijie"],
    tasks: [
      { id: "t1", title: "摸清团队结构", cond: null },
      { id: "t2", title: "记录诈骗完整流程", cond: "t1" },
      { id: "t3", title: "锁定团队负责人", cond: "t2" },
      { id: "t4", title: "在暴露前传出证据", cond: "t3" },
    ],
    start: "laok_1",
    nodes: {
      laok_1: { speaker: "laok", day: 1, phase: "潜伏开始",
        text: "鼹鼠，你已进入园区。目标是摸清结构、锁定头目、传出证据。记住，那里没有‘退出’，只有‘完成’。发消息用暗语。",
        options: [ { text: "收到，我尽量融进去。", tone: "neutral", next: "lj_1" } ] },
      lj_1: { speaker: "lijie", day: 1, phase: "熟悉环境", grant: "t1",
        text: "新来的？跟我混。上面是浩哥管业务，浩哥上面是陈总，陈总只跟老板单线联系。别乱打听，懂吗？",
        options: [
          { text: "懂，我就是来干活挣钱的。", tone: "warm", susp: 4, next: "lj_2" },
          { text: "陈总长什么样？老板是谁？", tone: "cautious", susp: 26, next: "lj_2" },
        ] },
      lj_2: { speaker: "lijie", day: 2, phase: "看内部运作", grant: "t2",
        text: "看好了：话术本背熟，先聊感情再谈投资，客户充了钱记进这个表。这就是我们的‘流水线’。",
        options: [
          { text: "我把流程默默记下来。（暗中取证）", tone: "cautious", susp: 8, next: "zh_1" },
          { text: "这表能拍一张吗？我怕记错。", tone: "warm", susp: 22, next: "zh_1" },
        ] },
      zh_1: { speaker: "zhanghao", day: 3, phase: "接近头目", grant: "t3",
        text: "干得不错。今晚陈总来视察，你表现好点。对了……你手机怎么总在打字？给谁发消息呢？",
        options: [
          { text: "跟家里报平安，怕他们担心。（掩饰）", tone: "warm", susp: 6, next: "final" },
          { text: "没啊，就刷刷手机。（心虚）", tone: "neutral", susp: 22, next: "final" },
        ] },
      final: { speaker: "laok", day: 4, phase: "传出证据",
        text: "鼹鼠，结构、流程、头目你都有了。找机会把这些传出来。窗口很短，一次机会——你怎么传？",
        options: [
          { text: "趁交接班的空档，用暗号一次性发出。", tone: "cautious", ending: "mole_A" },
          { text: "现在就发，等不及了。", tone: "warm", ending: "mole_B" },
        ] },
    },
    endings: {
      mole_A: { title: "结局 A · 成功逃离", good: true,
        text: "你抓住换班的两分钟，把结构图与流水表加密传出。三天后，跨境收网行动展开，你在混乱中被接应撤离，成为关键证人。",
        review: "潜伏靠的是耐心与时机。真实世界里，一旦被诱骗至境外，请务必设法联系使领馆与110。" },
      mole_B: { title: "结局 B · 被捕", good: false,
        text: "监控拍到你异常操作，还没发出去，手机就被夺走。你被关进小黑屋审讯。冲动，让所有铺垫化为乌有。",
        review: "越危险，越要冷静。‘等不及’三个字，在高危环境里就是致命的。" },
    },
  },
};

/* ===================== 通用：防骗工具箱 & 关键词（结局后展示） ===================== */
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
