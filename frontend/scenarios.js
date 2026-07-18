/* ============================================================
 * 反诈人生 · M2 十类独立体验场景（P1）
 * ------------------------------------------------------------
 * 与 GDD V9.0「M2 内容覆盖与年轻视角拓展」对应，是内容库的“可玩化”落地：
 *  - 十大高发诈骗类型，每类一个自包含剧情场景（5 决策节点 + 玩家选项 + 红标追踪）
 *  - 危险选项显式标注 redflag（落到 REDFLAGS taxonomy），安全选项不标
 *  - 选项 tone 区分 配合/中性/谨慎，玩家可体验不同应对带来的后果
 *  - 场景结束进入 scenario-result 屏，复用 report.js 的避坑报告生成器
 *
 * 用法：SCENARIOS[typeKey] 由 index8.html 的“单人反诈演练”入口加载。
 * 依赖全局：REDFLAGS、SCAM_TYPES（scamTypes.js）
 * ============================================================ */

const SCENARIOS = {

  /* 1. 杀猪盘（情感 + 虚假投资） */
  pig_butcher: {
    typeKey: "pig_butcher",
    title: "🐷 杀猪盘 · 温柔的刀",
    scene: "你在投资交流群认识了‘张浩’，他说是做证券的。",
    debrief: "杀猪盘 = 先养感情再养钱。没见过真人、只谈‘一起赚’，立刻拉黑。",
    start: "p1",
    nodes: {
      p1: { speaker: "scammer", phase: "建立人设", text: "姐，看你朋友圈也玩基金？最近行情真难。我平时做量化，多少懂点，有啥想问的随时找我～",
        options: [
          { text: "哈哈你也太懂了吧，那我以后多请教。", tone: "warm", redflag: "rf_emotion", next: "p2" },
          { text: "网上认识的，先观望吧。", tone: "cautious", next: "p2" },
        ] },
      p2: { speaker: "scammer", phase: "情感升温", text: "其实我挺能聊得来的就你一个。天天对着盘也闷，跟你说话舒服。",
        options: [
          { text: "我也是，感觉你特别懂我。", tone: "warm", redflag: "rf_emotion", next: "p3" },
          { text: "（笑笑）你嘴挺甜。", tone: "neutral", next: "p3" },
        ] },
      p3: { speaker: "scammer", phase: "植入项目", text: "对了，我舅舅证券公司的，有个内部盘‘恒盈量化’，只给熟人进。稳的，你要不要看一眼？",
        options: [
          { text: "内部盘？带我一起啊！", tone: "warm", redflag: "rf_high_return", next: "p4" },
          { text: "内部盘还能带外人？我不太信。", tone: "cautious", next: "p4" },
        ] },
      p4: { speaker: "scammer", phase: "诱导充值", text: "你就先充 5000 试水，赚了算你的。我账号发你了，截个图留着哈。",
        options: [
          { text: "好，我转 5000 试试。（先截图）", tone: "neutral", redflag: "rf_transfer", next: "p5" },
          { text: "没见过面就转账？我再想想。", tone: "cautious", next: "p5" },
        ] },
      p5: { speaker: "scammer", phase: "催促加仓", text: "小雅都投 3 万了，账面涨得欢。你别犹豫，机会不等人，再转两万我帮你盯。",
        options: [
          { text: "行，我再转两万！", tone: "warm", redflag: "rf_transfer", next: null },
          { text: "‘内部盘’要我不断加钱，这不对劲，我先撤。", tone: "cautious", next: null },
        ] },
    },
  },

  /* 2. 刷单返利 */
  brushing: {
    typeKey: "brushing",
    title: "🧾 刷单返利 · 垫钱就输",
    scene: "你刷到一个‘零门槛日结 200’的兼职广告。",
    debrief: "刷单本就违法。凡是‘垫钱刷单返利’都是饵，垫第一笔就输了。",
    start: "b1",
    nodes: {
      b1: { speaker: "scammer", phase: "广告引流", text: "在家就能做，手机点一点日结 200+💸 想做的私我～",
        options: [
          { text: "真的假的？我先了解一下。", tone: "neutral", redflag: "rf_high_return", next: "b2" },
          { text: "刷单不是违法吗？算了。", tone: "cautious", next: "b2" },
        ] },
      b2: { speaker: "scammer", phase: "首单返现", text: "先做一单试试？本金马上返还还给你佣金～你连本带利收 118。",
        options: [
          { text: "真到账了！那再来几单。", tone: "warm", redflag: "rf_high_return", next: "b3" },
          { text: "才 100 块，我先观察。", tone: "cautious", next: "b3" },
        ] },
      b3: { speaker: "scammer", phase: "连环单", text: "这单是‘连环任务’，做完 5 笔才能一起提现哦，本金越多返越多～",
        options: [
          { text: "那我连刷 5 笔，共 8800！", tone: "neutral", redflag: "rf_deepen", next: "b4" },
          { text: "为什么要一次性刷这么多？不对劲。", tone: "cautious", next: "b4" },
        ] },
      b4: { speaker: "scammer", phase: "垫付施压", text: "再垫一笔就激活返利了，错过这单前面都白做！",
        options: [
          { text: "好，我再垫 3000 激活。", tone: "neutral", redflag: "rf_transfer", next: "b5" },
          { text: "前面本金都没退回，我不垫了。", tone: "cautious", next: "b5" },
        ] },
      b5: { speaker: "scammer", phase: "提现失败", text: "系统提示‘账户冻结’，需交 2000 解冻费才能提现，交完马上到账。",
        options: [
          { text: "那我交解冻费。", tone: "warm", redflag: "rf_transfer", next: null },
          { text: "交解冻费？这就是骗子的套路，我报警。", tone: "cautious", next: null },
        ] },
    },
  },

  /* 3. 冒充电商/物流客服 */
  fake_cs: {
    typeKey: "fake_cs",
    title: "📦 冒充电商客服 · 双倍理赔",
    scene: "你刚网购，收到‘客服’私信说订单异常。",
    debrief: "客服主动理赔？先挂断，去官方 App 核实订单，绝不点陌生链接、不给验证码。",
    start: "c1",
    nodes: {
      c1: { speaker: "scammer", phase: "主动理赔", text: "亲，您买的衣服甲醛超标，可双倍退款。加一下理赔专员～",
        options: [
          { text: "真的能退双倍？那加。", tone: "neutral", redflag: "rf_obey", next: "c2" },
          { text: "我自己去官方 App 查订单。", tone: "cautious", next: "c2" },
        ] },
      c2: { speaker: "scammer", phase: "索要验证码", text: "把验证码发我一下就能马上到账哈，过时不候～",
        options: [
          { text: "验证码是 8842，给你。", tone: "neutral", redflag: "rf_transfer", next: "c3" },
          { text: "验证码凭啥给你？挂了。", tone: "cautious", next: "c3" },
        ] },
      c3: { speaker: "scammer", phase: "屏幕共享", text: "开启屏幕共享我教您操作，两分钟搞定，很简单的。",
        options: [
          { text: "好，我开共享，你教我。", tone: "neutral", redflag: "rf_relax", next: "c4" },
          { text: "屏幕共享等于把手机给你看，不开。", tone: "cautious", next: "c4" },
        ] },
      c4: { speaker: "scammer", phase: "诱导转账", text: "哎呀您银行卡被风控了，先转 1 万到‘理赔账户’验证，马上退回。",
        options: [
          { text: "那我转 1 万过去验证。", tone: "neutral", redflag: "rf_transfer", next: "c5" },
          { text: "理赔还要我先转账？骗子的套路，拉黑。", tone: "cautious", next: "c5" },
        ] },
      c5: { speaker: "scammer", phase: "失联", text: "……（对方已读不回，随后拉黑你）",
        options: [
          { text: "（我才意识到被骗，立刻挂失银行卡并报警）", tone: "cautious", next: null },
          { text: "（继续等对方回复）", tone: "neutral", redflag: "rf_relax", next: null },
        ] },
    },
  },

  /* 4. 冒充公检法 */
  impersonate_police: {
    typeKey: "impersonate_police",
    title: "🚔 冒充公检法 · 安全账户",
    scene: "你接到一通‘公安局’视频电话，对方穿着制服。",
    debrief: "公检法不会电话/网络办案，更不会要你转账‘自证清白’。",
    start: "po1",
    nodes: {
      po1: { speaker: "scammer", phase: "恐吓涉案", text: "这里是 xx 公安局，你名下银行卡涉嫌洗钱，现在对你立案侦查。",
        options: [
          { text: "啊？我怎么办，我配合调查！", tone: "neutral", redflag: "rf_obey", next: "po2" },
          { text: "真警察不会电话办案，挂了。", tone: "cautious", next: "po2" },
        ] },
      po2: { speaker: "scammer", phase: "资金清查", text: "现在对你进行‘资金清查’，把钱转到安全账户，查清后原路退回。",
        options: [
          { text: "好，我转到安全账户。", tone: "neutral", redflag: "rf_transfer", next: "po3" },
          { text: "‘安全账户’是诈骗专用词，我不转。", tone: "cautious", next: "po3" },
        ] },
      po3: { speaker: "scammer", phase: "要求保密", text: "这事要绝对保密，别告诉家人，否则按妨碍公务拘捕你。",
        options: [
          { text: "好，我不告诉任何人。", tone: "neutral", redflag: "rf_obey", next: "po4" },
          { text: "越不让我说，我越要问家里人。", tone: "cautious", next: "po4" },
        ] },
      po4: { speaker: "scammer", phase: "逼迫转账", text: "立刻转账 12 万到安全账户，否则马上上门拘捕。",
        options: [
          { text: "我这就去凑钱转账。", tone: "warm", redflag: "rf_transfer", next: null },
          { text: "我要打 110 核实，你先别挂。", tone: "cautious", next: null },
        ] },
    },
  },

  /* 5. 虚假投资理财 */
  fake_invest: {
    typeKey: "fake_invest",
    title: "📈 虚假投资 · 内部操盘群",
    scene: "你被拉进一个‘内部操盘群’，群里有‘老师’天天晒收益。",
    debrief: "非官方渠道的‘量化/外汇/币圈’高收益，本质是后台可改的假盘。",
    start: "i1",
    nodes: {
      i1: { speaker: "scammer", phase: "群洗脑", text: "跟着老师做量化，月化 20% 不是梦。今天又带单吃肉🥩",
        options: [
          { text: "月化 20%？我也想进！", tone: "warm", redflag: "rf_high_return", next: "i2" },
          { text: "月化 20% 太夸张，先看看。", tone: "cautious", next: "i2" },
        ] },
      i2: { speaker: "scammer", phase: "导师带单", text: "新人有‘老师’免费带单，先小资金试水，赚到你自己就信了。",
        options: [
          { text: "老师带我，我充 1 万试试。", tone: "warm", redflag: "rf_high_return", next: "i3" },
          { text: "免费带单还这么热情？存疑。", tone: "cautious", next: "i3" },
        ] },
      i3: { speaker: "scammer", phase: "小赚提现", text: "你看，充 1 万现已变 1.3 万，提现秒到！这盘是真的吧？",
        options: [
          { text: "真能提现！那我加码到 30 万。", tone: "warm", redflag: "rf_deepen", next: "i4" },
          { text: "前期能提现是套路，我撤。", tone: "cautious", next: "i4" },
        ] },
      i4: { speaker: "scammer", phase: "诱导加仓", text: "大行情来了，加仓才有大收益！错过这波拍大腿。",
        options: [
          { text: "好，我再转 20 万加仓。", tone: "neutral", redflag: "rf_transfer", next: "i5" },
          { text: "越催我加仓越像杀猪盘，撤。", tone: "cautious", next: "i5" },
        ] },
      i5: { speaker: "scammer", phase: "平台维护", text: "系统升级维护中……（群聊随后解散，APP 打不开）",
        options: [
          { text: "（才明白是假盘，立刻保存证据报警）", tone: "cautious", next: null },
          { text: "再等等，维护完应该能提。", tone: "neutral", redflag: "rf_relax", next: null },
        ] },
    },
  },

  /* 6. 虚假征信 */
  fake_credit: {
    typeKey: "fake_credit",
    title: "💳 虚假征信 · 注销校园贷",
    scene: "你接到‘银监会客服’电话，说你大学注册了网贷。",
    debrief: "征信无法‘人为注销/修复’，凡索要验证码、让你转账‘清空额度’的都是诈骗。",
    start: "cr1",
    nodes: {
      cr1: { speaker: "scammer", phase: "恐吓征信", text: "同学，你名下有校园贷账户未注销，将影响征信、无法买房。",
        options: [
          { text: "影响征信？那赶紧注销！", tone: "neutral", redflag: "rf_obey", next: "cr2" },
          { text: "征信我自己查央行，不劳你操心。", tone: "cautious", next: "cr2" },
        ] },
      cr2: { speaker: "scammer", phase: "下载会议", text: "下载 xx 会议，我语音一步步教你操作，很快的。",
        options: [
          { text: "好，我下载了，开语音。", tone: "neutral", redflag: "rf_info", next: "cr3" },
          { text: "语音指导还要下软件？可疑。", tone: "cautious", next: "cr3" },
        ] },
      cr3: { speaker: "scammer", phase: "清空额度", text: "把各平台额度借出来，转到‘对冲账户’清空就行，钱会退回。",
        options: [
          { text: "那我借 4 万转过去清空。", tone: "neutral", redflag: "rf_transfer", next: "cr4" },
          { text: "让我借钱转出？这是骗钱，挂了。", tone: "cautious", next: "cr4" },
        ] },
      cr4: { speaker: "scammer", phase: "失联", text: "……（转账后对方消失，电话成空号）",
        options: [
          { text: "（立刻报警并联系平台冻结）", tone: "cautious", next: null },
          { text: "（相信钱会退回，继续等）", tone: "neutral", redflag: "rf_relax", next: null },
        ] },
    },
  },

  /* 7. 冒充领导/熟人 */
  impersonate_boss: {
    typeKey: "impersonate_boss",
    title: "💼 冒充领导 · 紧急垫付",
    scene: "你被拉进‘公司群’，‘老板’私聊你说有急事。",
    debrief: "‘领导’微信要你转账？当面或打电话确认，绝不信私聊截图。",
    start: "bo1",
    nodes: {
      bo1: { speaker: "scammer", phase: "领导私聊", text: "小李，在吗？有个急事不方便打电话，你方便不？",
        options: [
          { text: "老板您说，我听着。", tone: "neutral", redflag: "rf_obey", next: "bo2" },
          { text: "急事？我打您电话确认下。", tone: "cautious", next: "bo2" },
        ] },
      bo2: { speaker: "scammer", phase: "紧急垫付", text: "你先帮我垫一下合同款 8 万到供应商账户，回头找我报销。",
        options: [
          { text: "好，我这就转账。", tone: "neutral", redflag: "rf_transfer", next: "bo3" },
          { text: "转账前我先和老板当面确认。", tone: "cautious", next: "bo3" },
        ] },
      bo3: { speaker: "scammer", phase: "要求保密", text: "别声张，这单比较敏感，走账别让财务知道。",
        options: [
          { text: "明白，我保密照办。", tone: "neutral", redflag: "rf_relax", next: "bo4" },
          { text: "越不让我说，越要按流程走。", tone: "cautious", next: "bo4" },
        ] },
      bo4: { speaker: "scammer", phase: "收网", text: "账号发你了：6228 **** 供应商王xx。尽快哈，对方等着。",
        options: [
          { text: "转过去了，老板收到说一声。", tone: "warm", redflag: "rf_transfer", next: null },
          { text: "我先打电话给真老板核实，再转。", tone: "cautious", next: null },
        ] },
    },
  },

  /* 8. 网络游戏虚假交易 */
  game_trade: {
    typeKey: "game_trade",
    title: "🎮 游戏交易 · 低价账号",
    scene: "你在二手群看到‘王者全皮肤号 99 元’的广告。",
    debrief: "游戏装备只走官方交易平台；私下‘低价出’要你先付定金的，必是骗局。",
    start: "g1",
    nodes: {
      g1: { speaker: "scammer", phase: "低价引流", text: "全皮肤账号 99 出，比官方便宜多了，要的私。",
        options: [
          { text: "99？太划算了，我要！", tone: "warm", redflag: "rf_high_return", next: "g2" },
          { text: "这么便宜？怕是骗子。", tone: "cautious", next: "g2" },
        ] },
      g2: { speaker: "scammer", phase: "收定金", text: "先交 20 定金锁号，秒发货，不买不退哦。",
        options: [
          { text: "转你 20 定金，锁号。", tone: "neutral", redflag: "rf_transfer", next: "g3" },
          { text: "定金都不退？那不买了。", tone: "cautious", next: "g3" },
        ] },
      g3: { speaker: "scammer", phase: "拒担保", text: "走第三方担保？不用，直接转我就行，更快。",
        options: [
          { text: "好，那我直接转尾款。", tone: "neutral", redflag: "rf_relax", next: "g4" },
          { text: "不走担保我可不放心，拉倒。", tone: "cautious", next: "g4" },
        ] },
      g4: { speaker: "scammer", phase: "拉黑", text: "……（收钱后已读不回，随后拉黑）",
        options: [
          { text: "（记住：游戏交易只走官方，没下次了）", tone: "cautious", next: null },
          { text: "（再找个更便宜的试试）", tone: "neutral", redflag: "rf_relax", next: null },
        ] },
    },
  },

  /* 9. 虚假购物/服务 */
  fake_shop: {
    typeKey: "fake_shop",
    title: "🛒 虚假购物 · 内部代购",
    scene: "你抢不到演唱会票，微博找到‘内部渠道’代购。",
    debrief: "‘超低价代购/黄牛票/内部价’先款后货，付款即消失，认准正规平台担保交易。",
    start: "sh1",
    nodes: {
      sh1: { speaker: "scammer", phase: "内部渠道", text: "我有内部渠道，原价票加 200 就能拿，紧俏场次的也有。",
        options: [
          { text: "加 200 就能拿？给我留一张！", tone: "warm", redflag: "rf_high_return", next: "sh2" },
          { text: "内部渠道？怕不靠谱。", tone: "cautious", next: "sh2" },
        ] },
      sh2: { speaker: "scammer", phase: "先款留票", text: "先付定金留票，出票补尾款，手慢无。",
        options: [
          { text: "转你定金，帮我留。", tone: "neutral", redflag: "rf_transfer", next: "sh3" },
          { text: "没出票先付款？我走平台担保。", tone: "cautious", next: "sh3" },
        ] },
      sh3: { speaker: "scammer", phase: "补保证金", text: "出票了！但要先交‘票务保证金’ 2000 才放行，退票的。",
        options: [
          { text: "那我交保证金。", tone: "neutral", redflag: "rf_transfer", next: "sh4" },
          { text: "又要保证金？这是连环套，撤。", tone: "cautious", next: "sh4" },
        ] },
      sh4: { speaker: "scammer", phase: "拉黑", text: "……（收完钱拉黑，票根本没有）",
        options: [
          { text: "（认栽，以后只走正规票务平台）", tone: "cautious", next: null },
          { text: "（换个人再问问，或许真有）", tone: "neutral", redflag: "rf_relax", next: null },
        ] },
    },
  },

  /* 10. 婚恋交友（非投资型） */
  dating: {
    typeKey: "dating",
    title: "💞 婚恋交友 · 没见面的 TA",
    scene: "你在交友 App 认识‘海归女总监’，聊得投缘。",
    debrief: "交友软件上的‘高富帅/白富美’，没见面就谈借钱/急用钱，99% 是托。",
    start: "d1",
    nodes: {
      d1: { speaker: "scammer", phase: "建立投缘", text: "感觉跟你特别投缘，想认真了解一下。你平时喜欢干嘛呀？",
        options: [
          { text: "我也是！难得遇到这么合拍的。", tone: "warm", redflag: "rf_emotion", next: "d2" },
          { text: "合不合拍还得线下见见才知道。", tone: "cautious", next: "d2" },
        ] },
      d2: { speaker: "scammer", phase: "套取隐私", text: "你一个人住还是和家里人？做什么工作的呀，方便说吗～",
        options: [
          { text: "我一个人住，做设计的，挺自由。", tone: "warm", redflag: "rf_info", next: "d3" },
          { text: "这些网上就不细说了哈。", tone: "cautious", next: "d3" },
        ] },
      d3: { speaker: "scammer", phase: "制造紧急", text: "我爸突然住院了，手术费差一点，能不能先借我周转？回头就还。",
        options: [
          { text: "好心疼，我转你 3 万应急。", tone: "warm", redflag: "rf_transfer", next: "d4" },
          { text: "借钱得先视频见真人，不然不借。", tone: "cautious", next: "d4" },
        ] },
      d4: { speaker: "scammer", phase: "持续索取", text: "钱还不够，后面还有复查费……你再帮帮我嘛，咱们以后一起去旅行。",
        options: [
          { text: "行，我再转 2 万。", tone: "warm", redflag: "rf_transfer", next: null },
          { text: "钱没还又借？你根本不是真人，拉黑。", tone: "cautious", next: null },
        ] },
    },
  },
};

/* 演练列表（用于入口渲染） */
const SCENARIO_LIST = [
  "pig_butcher", "brushing", "fake_cs", "impersonate_police", "fake_invest",
  "fake_credit", "impersonate_boss", "game_trade", "fake_shop", "dating",
];

function getScenario(key) { return SCENARIOS[key]; }
