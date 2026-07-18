/* ============================================================
 * 反诈人生 · M2 十类独立体验场景（P1） + M4 增强
 * ------------------------------------------------------------
 * 与 GDD V9.0「M2 内容覆盖与年轻视角拓展」「M4 复玩性与深度内容」对应：
 *  - 十大高发诈骗类型，每类一个自包含剧情场景（5 决策节点 + 玩家选项 + 红标追踪）
 *  - 危险选项显式标注 redflag（落到 REDFLAGS taxonomy），安全选项不标
 *  - M4.2 话术多样化：每个骗子节点含 variants（3 种语气/用词变体，逻辑一致）
 *  - M4.1 证据墙：每类定义 fragments（可疑碎片），节点用 frag 标记“暴露点”，玩家主动收集
 *  - 集齐全部碎片且最终保持谨慎 → 解锁隐藏结局「反杀」
 *
 * 用法：SCENARIOS[typeKey] 由 index8.html “单人反诈演练”入口加载。
 * 依赖全局：REDFLAGS、SCAM_TYPES（scamTypes.js）
 * ============================================================ */

const SCENARIOS = {

  /* 1. 杀猪盘（情感 + 虚假投资） */
  pig_butcher: {
    typeKey: "pig_butcher",
    title: "🐷 杀猪盘 · 温柔的刀",
    scene: "你在投资交流群认识了‘张浩’，他说是做证券的。",
    debrief: "杀猪盘 = 先养感情再养钱。没见过真人、只谈‘一起赚’，立刻拉黑。",
    fragments: [
      { id: "pb_f1", type: "overseas", label: "网友‘张浩’（仅线上、无真人验证）" },
      { id: "pb_f2", type: "script",    label: "‘内部盘只给熟人进’——排他话术" },
      { id: "pb_f3", type: "fakeimg",   label: "‘截个图留着’的伪造盈利截图" },
      { id: "pb_f4", type: "transfer",  label: "先充 5000、再转 2 万加仓" },
    ],
    start: "p1",
    nodes: {
      p1: { speaker: "scammer", phase: "建立人设", frag: "pb_f1",
        text: "姐，看你朋友圈也玩基金？最近行情真难。我平时做量化，多少懂点，有啥想问的随时找我～",
        variants: [
          "姐，看你朋友圈也玩基金？最近行情真难。我平时做量化，多少懂点，有啥想问的随时找我～",
          "哈喽～刷到你也在看基金，缘分。我做证券的，行情不懂的尽管问我。",
          "在吗姐？我看你关注理财，正好我干这行，以后带你少踩坑😉",
        ],
        options: [
          { text: "哈哈你也太懂了吧，那我以后多请教。", tone: "warm", redflag: "rf_emotion", next: "p2" },
          { text: "网上认识的，先观望吧。", tone: "cautious", next: "p2" },
        ] },
      p2: { speaker: "scammer", phase: "情感升温",
        text: "其实我挺能聊得来的就你一个。天天对着盘也闷，跟你说话舒服。",
        variants: [
          "其实我挺能聊得来的就你一个。天天对着盘也闷，跟你说话舒服。",
          "说真的，跟我聊得来的就这么你一个，别的客户都不算聊。",
          "跟你说话特别放松，平时没人听我唠这些🥺",
        ],
        options: [
          { text: "我也是，感觉你特别懂我。", tone: "warm", redflag: "rf_emotion", next: "p3" },
          { text: "（笑笑）你嘴挺甜。", tone: "neutral", next: "p3" },
        ] },
      p3: { speaker: "scammer", phase: "植入项目", frag: "pb_f2",
        text: "对了，我舅舅证券公司的，有个内部盘‘恒盈量化’，只给熟人进。稳的，你要不要看一眼？",
        variants: [
          "对了，我舅舅证券公司的，有个内部盘‘恒盈量化’，只给熟人进。稳的，你要不要看一眼？",
          "偷偷跟你说，我家亲戚在券商，有个‘内部盘’只带熟人，收益稳得很。",
          "有个稳赚的盘，我一般不外传，看咱俩投缘才问你要不要看。",
        ],
        options: [
          { text: "内部盘？带我一起啊！", tone: "warm", redflag: "rf_high_return", next: "p4" },
          { text: "内部盘还能带外人？我不太信。", tone: "cautious", next: "p4" },
        ] },
      p4: { speaker: "scammer", phase: "诱导充值", frag: "pb_f3",
        text: "你就先充 5000 试水，赚了算你的。我账号发你了，截个图留着哈。",
        variants: [
          "你就先充 5000 试水，赚了算你的。我账号发你了，截个图留着哈。",
          "先小投 5000 感受下，回本很快的，我把收款码发你，存个图。",
          "别一次太多，先 5000 试水，账号我私你，记得截图呀。",
        ],
        options: [
          { text: "好，我转 5000 试试。（先截图）", tone: "neutral", redflag: "rf_transfer", next: "p5" },
          { text: "没见过面就转账？我再想想。", tone: "cautious", next: "p5" },
        ] },
      p5: { speaker: "scammer", phase: "催促加仓", frag: "pb_f4",
        text: "小雅都投 3 万了，账面涨得欢。你别犹豫，机会不等人，再转两万我帮你盯。",
        variants: [
          "小雅都投 3 万了，账面涨得欢。你别犹豫，机会不等人，再转两万我帮你盯。",
          "群里姐妹都加仓了，你再转 2 万我帮你操作，错过拍大腿。",
          "行情就这一波，再转两万锁收益，晚了真没了。",
        ],
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
    fragments: [
      { id: "br_f1", type: "script",   label: "‘零门槛日结200’引流话术" },
      { id: "br_f2", type: "script",   label: "‘连环任务’套路说明" },
      { id: "br_f3", type: "transfer", label: "垫付激活/解冻费等转账要求" },
      { id: "br_f4", type: "account",  label: "非官方收款账户" },
    ],
    start: "b1",
    nodes: {
      b1: { speaker: "scammer", phase: "广告引流", frag: "br_f1",
        text: "在家就能做，手机点一点日结 200+💸 想做的私我～",
        variants: [
          "在家就能做，手机点一点日结 200+💸 想做的私我～",
          "兼职来咯！动动手指日结200，学生党也能做，私我领任务。",
          "招刷单员，零门槛，每天躺赚200+，想做的扣1。",
        ],
        options: [
          { text: "真的假的？我先了解一下。", tone: "neutral", redflag: "rf_high_return", next: "b2" },
          { text: "刷单不是违法吗？算了。", tone: "cautious", next: "b2" },
        ] },
      b2: { speaker: "scammer", phase: "首单返现",
        text: "先做一单试试？本金马上返还还给你佣金～你连本带利收 118。",
        variants: [
          "先做一单试试？本金马上返还还给你佣金～你连本带利收 118。",
          "首单福利，本金秒返+佣金，你到手118，试试水呗。",
          "先小做一单，钱立刻回你账上还倒贴佣金，放心。",
        ],
        options: [
          { text: "真到账了！那再来几单。", tone: "warm", redflag: "rf_high_return", next: "b3" },
          { text: "才 100 块，我先观察。", tone: "cautious", next: "b3" },
        ] },
      b3: { speaker: "scammer", phase: "连环单", frag: "br_f2",
        text: "这单是‘连环任务’，做完 5 笔才能一起提现哦，本金越多返越多～",
        variants: [
          "这单是‘连环任务’，做完 5 笔才能一起提现哦，本金越多返越多～",
          "下一个是联单，连做5笔才结算，投得多返得多，懂吧？",
          "现在进‘任务池’了，5笔一结算，别中途撤哈。",
        ],
        options: [
          { text: "那我连刷 5 笔，共 8800！", tone: "neutral", redflag: "rf_deepen", next: "b4" },
          { text: "为什么要一次性刷这么多？不对劲。", tone: "cautious", next: "b4" },
        ] },
      b4: { speaker: "scammer", phase: "垫付施压", frag: "br_f3",
        text: "再垫一笔就激活返利了，错过这单前面都白做！",
        variants: [
          "再垫一笔就激活返利了，错过这单前面都白做！",
          "就差最后一笔激活费，不交前面本金全没了啊！",
          "激活一下就能提现，赶紧垫，不然前功尽弃。",
        ],
        options: [
          { text: "好，我再垫 3000 激活。", tone: "neutral", redflag: "rf_transfer", next: "b5" },
          { text: "前面本金都没退回，我不垫了。", tone: "cautious", next: "b5" },
        ] },
      b5: { speaker: "scammer", phase: "提现失败", frag: "br_f4",
        text: "系统提示‘账户冻结’，需交 2000 解冻费才能提现，交完马上到账。",
        variants: [
          "系统提示‘账户冻结’，需交 2000 解冻费才能提现，交完马上到账。",
          "财务说你账户被风控冻结，交2000解冻费立马到账。",
          "提现被冻了，补2000解冻就行，钱马上回来。",
        ],
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
    fragments: [
      { id: "cs_f1", type: "script",   label: "‘双倍退款’主动理赔话术" },
      { id: "cs_f2", type: "privacy",  label: "索要短信验证码" },
      { id: "cs_f3", type: "script",   label: "‘开启屏幕共享’远程控制" },
      { id: "cs_f4", type: "transfer", label: "‘理赔账户’转账要求" },
    ],
    start: "c1",
    nodes: {
      c1: { speaker: "scammer", phase: "主动理赔", frag: "cs_f1",
        text: "亲，您买的衣服甲醛超标，可双倍退款。加一下理赔专员～",
        variants: [
          "亲，您买的衣服甲醛超标，可双倍退款。加一下理赔专员～",
          "您好，您订单有质量问题，平台给您双倍赔付，加专员办理。",
          "订单异常啦，本店给您双倍补偿，联系理赔客服处理哦。",
        ],
        options: [
          { text: "真的能退双倍？那加。", tone: "neutral", redflag: "rf_obey", next: "c2" },
          { text: "我自己去官方 App 查订单。", tone: "cautious", next: "c2" },
        ] },
      c2: { speaker: "scammer", phase: "索要验证码", frag: "cs_f2",
        text: "把验证码发我一下就能马上到账哈，过时不候～",
        variants: [
          "把验证码发我一下就能马上到账哈，过时不候～",
          "把刚收到的6位验证码发我，立马给您退款。",
          "退款要验证，把短信码给我，两分钟到账。",
        ],
        options: [
          { text: "验证码是 8842，给你。", tone: "neutral", redflag: "rf_transfer", next: "c3" },
          { text: "验证码凭啥给你？挂了。", tone: "cautious", next: "c3" },
        ] },
      c3: { speaker: "scammer", phase: "屏幕共享", frag: "cs_f3",
        text: "开启屏幕共享我教您操作，两分钟搞定，很简单的。",
        variants: [
          "开启屏幕共享我教您操作，两分钟搞定，很简单的。",
          "您不会操作的话开个共享，我远程带您点。",
          "下个会议软件开共享，我手把手教，特别快。",
        ],
        options: [
          { text: "好，我开共享，你教我。", tone: "neutral", redflag: "rf_relax", next: "c4" },
          { text: "屏幕共享等于把手机给你看，不开。", tone: "cautious", next: "c4" },
        ] },
      c4: { speaker: "scammer", phase: "诱导转账", frag: "cs_f4",
        text: "哎呀您银行卡被风控了，先转 1 万到‘理赔账户’验证，马上退回。",
        variants: [
          "哎呀您银行卡被风控了，先转 1 万到‘理赔账户’验证，马上退回。",
          "卡被冻了，转1万到理赔专用账户验资，秒退。",
          "系统要验资，您转1万到理赔账户，验证完原路返回。",
        ],
        options: [
          { text: "那我转 1 万过去验证。", tone: "neutral", redflag: "rf_transfer", next: "c5" },
          { text: "理赔还要我先转账？骗子的套路，拉黑。", tone: "cautious", next: "c5" },
        ] },
      c5: { speaker: "scammer", phase: "失联",
        text: "……（对方已读不回，随后拉黑你）",
        variants: [
          "……（对方已读不回，随后拉黑你）",
          "（过了一会儿，消息发不出去了——你被拉黑）",
          "（‘对方忙线中’……再点进去，已查无此人）",
        ],
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
    fragments: [
      { id: "po_f1", type: "script",   label: "‘你名下银行卡涉嫌洗钱’恐吓" },
      { id: "po_f2", type: "script",   label: "‘安全账户’诈骗专用词" },
      { id: "po_f3", type: "script",   label: "‘绝对保密、别告诉家人’控制话术" },
      { id: "po_f4", type: "transfer", label: "‘立刻转账12万’要求" },
    ],
    start: "po1",
    nodes: {
      po1: { speaker: "scammer", phase: "恐吓涉案", frag: "po_f1",
        text: "这里是 xx 公安局，你名下银行卡涉嫌洗钱，现在对你立案侦查。",
        variants: [
          "这里是 xx 公安局，你名下银行卡涉嫌洗钱，现在对你立案侦查。",
          "我们是 xx 省公安厅，你一张卡涉嫌洗黑钱，案子已经立了。",
          "紧急通知，你身份信息被盗用涉案，请配合‘资金核查’。",
        ],
        options: [
          { text: "啊？我怎么办，我配合调查！", tone: "neutral", redflag: "rf_obey", next: "po2" },
          { text: "真警察不会电话办案，挂了。", tone: "cautious", next: "po2" },
        ] },
      po2: { speaker: "scammer", phase: "资金清查", frag: "po_f2",
        text: "现在对你进行‘资金清查’，把钱转到安全账户，查清后原路退回。",
        variants: [
          "现在对你进行‘资金清查’，把钱转到安全账户，查清后原路退回。",
          "你把资金归集到‘安全账户’，我们核查完原数退还。",
          "走‘资金清查’流程，转安全账户就当自证清白。",
        ],
        options: [
          { text: "好，我转到安全账户。", tone: "neutral", redflag: "rf_transfer", next: "po3" },
          { text: "‘安全账户’是诈骗专用词，我不转。", tone: "cautious", next: "po3" },
        ] },
      po3: { speaker: "scammer", phase: "要求保密", frag: "po_f3",
        text: "这事要绝对保密，别告诉家人，否则按妨碍公务拘捕你。",
        variants: [
          "这事要绝对保密，别告诉家人，否则按妨碍公务拘捕你。",
          "千万别跟家里说，说了就是泄密，要担责任。",
          "保密协议懂吗？告诉任何人后果自负。",
        ],
        options: [
          { text: "好，我不告诉任何人。", tone: "neutral", redflag: "rf_obey", next: "po4" },
          { text: "越不让我说，我越要问家里人。", tone: "cautious", next: "po4" },
        ] },
      po4: { speaker: "scammer", phase: "逼迫转账", frag: "po_f4",
        text: "立刻转账 12 万到安全账户，否则马上上门拘捕。",
        variants: [
          "立刻转账 12 万到安全账户，否则马上上门拘捕。",
          "限你30分钟内转12万，不然直接上门抓人。",
          "最后机会，转12万到安全账户，否则刑事强制措施。",
        ],
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
    fragments: [
      { id: "iv_f1", type: "script",   label: "‘月化20%’高收益话术" },
      { id: "iv_f2", type: "script",   label: "‘老师免费带单’引流" },
      { id: "iv_f3", type: "fakeimg",  label: "‘提现秒到’伪造收益图" },
      { id: "iv_f4", type: "transfer", label: "‘加仓30万’转账要求" },
    ],
    start: "i1",
    nodes: {
      i1: { speaker: "scammer", phase: "群洗脑", frag: "iv_f1",
        text: "跟着老师做量化，月化 20% 不是梦。今天又带单吃肉🥩",
        variants: [
          "跟着老师做量化，月化 20% 不是梦。今天又带单吃肉🥩",
          "内部盘月化20%起，老师天天带单，今天又带粉吃肉。",
          "量化策略稳得很，月化20%轻轻松松，跟上就赚。",
        ],
        options: [
          { text: "月化 20%？我也想进！", tone: "warm", redflag: "rf_high_return", next: "i2" },
          { text: "月化 20% 太夸张，先看看。", tone: "cautious", next: "i2" },
        ] },
      i2: { speaker: "scammer", phase: "导师带单", frag: "iv_f2",
        text: "新人有‘老师’免费带单，先小资金试水，赚到你自己就信了。",
        variants: [
          "新人有‘老师’免费带单，先小资金试水，赚到你自己就信了。",
          "新手福利，老师一对一免费带，先小钱试，稳赚再加大。",
          "老师亲自带单不收钱，先投一点点感受下。",
        ],
        options: [
          { text: "老师带我，我充 1 万试试。", tone: "warm", redflag: "rf_high_return", next: "i3" },
          { text: "免费带单还这么热情？存疑。", tone: "cautious", next: "i3" },
        ] },
      i3: { speaker: "scammer", phase: "小赚提现", frag: "iv_f3",
        text: "你看，充 1 万现已变 1.3 万，提现秒到！这盘是真的吧？",
        variants: [
          "你看，充 1 万现已变 1.3 万，提现秒到！这盘是真的吧？",
          "账户显示1万变1.3万，提现秒到账，这还能假？",
          "瞧，本金加收益都到账了，提现不用等，稳吧？",
        ],
        options: [
          { text: "真能提现！那我加码到 30 万。", tone: "warm", redflag: "rf_deepen", next: "i4" },
          { text: "前期能提现是套路，我撤。", tone: "cautious", next: "i4" },
        ] },
      i4: { speaker: "scammer", phase: "诱导加仓", frag: "iv_f4",
        text: "大行情来了，加仓才有大收益！错过这波拍大腿。",
        variants: [
          "大行情来了，加仓才有大收益！错过这波拍大腿。",
          "这波主升浪，不加仓可惜了，老师仓位都上去了。",
          "行情就现在，多投多赚，别犹豫！",
        ],
        options: [
          { text: "好，我再转 20 万加仓。", tone: "neutral", redflag: "rf_transfer", next: "i5" },
          { text: "越催我加仓越像杀猪盘，撤。", tone: "cautious", next: "i5" },
        ] },
      i5: { speaker: "scammer", phase: "平台维护",
        text: "系统升级维护中……（群聊随后解散，APP 打不开）",
        variants: [
          "系统升级维护中……（群聊随后解散，APP 打不开）",
          "平台例行维护，明天恢复……（第二天群没了）",
          "临时升级，稍等……（APP 已无法登录）",
        ],
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
    fragments: [
      { id: "cr_f1", type: "script",   label: "‘影响征信、无法买房’恐吓" },
      { id: "cr_f2", type: "script",   label: "‘下载会议软件’远程控制" },
      { id: "cr_f3", type: "transfer", label: "‘对冲账户清空额度’转账要求" },
      { id: "cr_f4", type: "privacy",  label: "套取各平台借款信息" },
    ],
    start: "cr1",
    nodes: {
      cr1: { speaker: "scammer", phase: "恐吓征信", frag: "cr_f1",
        text: "同学，你名下有校园贷账户未注销，将影响征信、无法买房。",
        variants: [
          "同学，你名下有校园贷账户未注销，将影响征信、无法买房。",
          "您好，根据国家新规，您大学注册的网贷需注销，否则影响征信。",
          "紧急提醒：您有校园贷记录未处理，将纳入失信名单。",
        ],
        options: [
          { text: "影响征信？那赶紧注销！", tone: "neutral", redflag: "rf_obey", next: "cr2" },
          { text: "征信我自己查央行，不劳你操心。", tone: "cautious", next: "cr2" },
        ] },
      cr2: { speaker: "scammer", phase: "下载会议", frag: "cr_f2",
        text: "下载 xx 会议，我语音一步步教你操作，很快的。",
        variants: [
          "下载 xx 会议，我语音一步步教你操作，很快的。",
          "下个‘xx会议’，我屏幕共享带你操作，两分钟搞定。",
          "加我会议号，语音指导你注销，别自己乱点。",
        ],
        options: [
          { text: "好，我下载了，开语音。", tone: "neutral", redflag: "rf_info", next: "cr3" },
          { text: "语音指导还要下软件？可疑。", tone: "cautious", next: "cr3" },
        ] },
      cr3: { speaker: "scammer", phase: "清空额度", frag: "cr_f3",
        text: "把各平台额度借出来，转到‘对冲账户’清空就行，钱会退回。",
        variants: [
          "把各平台额度借出来，转到‘对冲账户’清空就行，钱会退回。",
          "你从借呗、微粒贷借出来转对冲账户，额度清空就注销。",
          "把额度提出来转到对冲专户，验证完原数返还。",
        ],
        options: [
          { text: "那我借 4 万转过去清空。", tone: "neutral", redflag: "rf_transfer", next: "cr4" },
          { text: "让我借钱转出？这是骗钱，挂了。", tone: "cautious", next: "cr4" },
        ] },
      cr4: { speaker: "scammer", phase: "失联", frag: "cr_f4",
        text: "……（转账后对方消失，电话成空号）",
        variants: [
          "……（转账后对方消失，电话成空号）",
          "（再打过去，已关机，会议也被踢出）",
          "（‘对方已断开’，钱和人都没了）",
        ],
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
    fragments: [
      { id: "bo_f1", type: "script",   label: "‘不方便打电话’回避核实" },
      { id: "bo_f2", type: "transfer", label: "‘先垫付8万合同款’要求" },
      { id: "bo_f3", type: "script",   label: "‘别声张、走账别让财务知道’" },
      { id: "bo_f4", type: "account",  label: "‘供应商王xx’陌生账户" },
    ],
    start: "bo1",
    nodes: {
      bo1: { speaker: "scammer", phase: "领导私聊", frag: "bo_f1",
        text: "小李，在吗？有个急事不方便打电话，你方便不？",
        variants: [
          "小李，在吗？有个急事不方便打电话，你方便不？",
          "在吗？我现在开会，电话不方便，先微信说。",
          "小X，有个事不方便语音，你听着就行。",
        ],
        options: [
          { text: "老板您说，我听着。", tone: "neutral", redflag: "rf_obey", next: "bo2" },
          { text: "急事？我打您电话确认下。", tone: "cautious", next: "bo2" },
        ] },
      bo2: { speaker: "scammer", phase: "紧急垫付", frag: "bo_f2",
        text: "你先帮我垫一下合同款 8 万到供应商账户，回头找我报销。",
        variants: [
          "你先帮我垫一下合同款 8 万到供应商账户，回头找我报销。",
          "先垫付8万合同款给供应商，回头我签单给你报。",
          "急，你先转8万到对方账户，公对公晚点我补手续。",
        ],
        options: [
          { text: "好，我这就转账。", tone: "neutral", redflag: "rf_transfer", next: "bo3" },
          { text: "转账前我先和老板当面确认。", tone: "cautious", next: "bo3" },
        ] },
      bo3: { speaker: "scammer", phase: "要求保密", frag: "bo_f3",
        text: "别声张，这单比较敏感，走账别让财务知道。",
        variants: [
          "别声张，这单比较敏感，走账别让财务知道。",
          "悄悄的，别让财务问，先个人垫着。",
          "这事别外传，走你私人账就行。",
        ],
        options: [
          { text: "明白，我保密照办。", tone: "neutral", redflag: "rf_relax", next: "bo4" },
          { text: "越不让我说，越要按流程走。", tone: "cautious", next: "bo4" },
        ] },
      bo4: { speaker: "scammer", phase: "收网", frag: "bo_f4",
        text: "账号发你了：6228 **** 供应商王xx。尽快哈，对方等着。",
        variants: [
          "账号发你了：6228 **** 供应商王xx。尽快哈，对方等着。",
          "收款人王xx，卡号我私你，赶紧转，别拖。",
          "对公账户：供应商王xx 6228****，马上安排。",
        ],
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
    fragments: [
      { id: "ga_f1", type: "script",   label: "‘比官方便宜多了’低价引流" },
      { id: "ga_f2", type: "transfer", label: "‘先交20定金锁号’要求" },
      { id: "ga_f3", type: "script",   label: "‘不走第三方担保’拒担保" },
      { id: "ga_f4", type: "account",  label: "私下收款账户" },
    ],
    start: "g1",
    nodes: {
      g1: { speaker: "scammer", phase: "低价引流", frag: "ga_f1",
        text: "全皮肤账号 99 出，比官方便宜多了，要的私。",
        variants: [
          "全皮肤账号 99 出，比官方便宜多了，要的私。",
          "王者满皮肤号，99包邮，官方一半价，手慢无。",
          "出个全皮号，就99，比商城划算多了哈。",
        ],
        options: [
          { text: "99？太划算了，我要！", tone: "warm", redflag: "rf_high_return", next: "g2" },
          { text: "这么便宜？怕是骗子。", tone: "cautious", next: "g2" },
        ] },
      g2: { speaker: "scammer", phase: "收定金", frag: "ga_f2",
        text: "先交 20 定金锁号，秒发货，不买不退哦。",
        variants: [
          "先交 20 定金锁号，秒发货，不买不退哦。",
          "先付20定金留号，马上给你，不买不退哈。",
          "定金20锁号，付了立刻发，过时不候。",
        ],
        options: [
          { text: "转你 20 定金，锁号。", tone: "neutral", redflag: "rf_transfer", next: "g3" },
          { text: "定金都不退？那不买了。", tone: "cautious", next: "g3" },
        ] },
      g3: { speaker: "scammer", phase: "拒担保", frag: "ga_f3",
        text: "走第三方担保？不用，直接转我就行，更快。",
        variants: [
          "走第三方担保？不用，直接转我就行，更快。",
          "担保太麻烦，直接微信转我，秒发货。",
          "别走平台了，私下转省事，我靠谱。",
        ],
        options: [
          { text: "好，那我直接转尾款。", tone: "neutral", redflag: "rf_relax", next: "g4" },
          { text: "不走担保我可不放心，拉倒。", tone: "cautious", next: "g4" },
        ] },
      g4: { speaker: "scammer", phase: "拉黑", frag: "ga_f4",
        text: "……（收钱后已读不回，随后拉黑）",
        variants: [
          "……（收钱后已读不回，随后拉黑）",
          "（转完尾款，对方已读不回，随后拉黑）",
          "（‘对方正在输入…’转圈半天，再点已是红色感叹号）",
        ],
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
    fragments: [
      { id: "sh_f1", type: "script",   label: "‘内部渠道、加200就拿’引流" },
      { id: "sh_f2", type: "transfer", label: "‘先付定金留票’要求" },
      { id: "sh_f3", type: "transfer", label: "‘票务保证金2000’要求" },
      { id: "sh_f4", type: "account",  label: "私下收款账户" },
    ],
    start: "sh1",
    nodes: {
      sh1: { speaker: "scammer", phase: "内部渠道", frag: "sh_f1",
        text: "我有内部渠道，原价票加 200 就能拿，紧俏场次的也有。",
        variants: [
          "我有内部渠道，原价票加 200 就能拿，紧俏场次的也有。",
          "演唱会内部票，加200代出，前排也有。",
          "票务资源我有，票面价+200服务费，稳的。",
        ],
        options: [
          { text: "加 200 就能拿？给我留一张！", tone: "warm", redflag: "rf_high_return", next: "sh2" },
          { text: "内部渠道？怕不靠谱。", tone: "cautious", next: "sh2" },
        ] },
      sh2: { speaker: "scammer", phase: "先款留票", frag: "sh_f2",
        text: "先付定金留票，出票补尾款，手慢无。",
        variants: [
          "先付定金留票，出票补尾款，手慢无。",
          "先交定金锁票，出票补尾款，真的紧俏。",
          "定金留着，尾款出票付，别犹豫。",
        ],
        options: [
          { text: "转你定金，帮我留。", tone: "neutral", redflag: "rf_transfer", next: "sh3" },
          { text: "没出票先付款？我走平台担保。", tone: "cautious", next: "sh3" },
        ] },
      sh3: { speaker: "scammer", phase: "补保证金", frag: "sh_f3",
        text: "出票了！但要先交‘票务保证金’ 2000 才放行，退票的。",
        variants: [
          "出票了！但要先交‘票务保证金’ 2000 才放行，退票的。",
          "票出了，交2000保证金放行，之后原路退。",
          "已出票，需压2000保证金，交易完退还。",
        ],
        options: [
          { text: "那我交保证金。", tone: "neutral", redflag: "rf_transfer", next: "sh4" },
          { text: "又要保证金？这是连环套，撤。", tone: "cautious", next: "sh4" },
        ] },
      sh4: { speaker: "scammer", phase: "拉黑", frag: "sh_f4",
        text: "……（收完钱拉黑，票根本没有）",
        variants: [
          "……（收完钱拉黑，票根本没有）",
          "（交完保证金，对方已读不回，票影都没）",
          "（‘对方已开启好友验证’，钱票两空）",
        ],
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
    fragments: [
      { id: "da_f1", type: "script",   label: "‘特别投缘’情感铺垫" },
      { id: "da_f2", type: "privacy",  label: "套取独居/职业隐私" },
      { id: "da_f3", type: "transfer", label: "‘爸住院借3万’借款要求" },
      { id: "da_f4", type: "script",   label: "‘以后一起去旅行’情感绑架" },
    ],
    start: "d1",
    nodes: {
      d1: { speaker: "scammer", phase: "建立投缘", frag: "da_f1",
        text: "感觉跟你特别投缘，想认真了解一下。你平时喜欢干嘛呀？",
        variants: [
          "感觉跟你特别投缘，想认真了解一下。你平时喜欢干嘛呀？",
          "跟你聊天好舒服，难得投缘，想多了解你一点。",
          "莫名就觉得咱俩合拍，想认真处一处🥰",
        ],
        options: [
          { text: "我也是！难得遇到这么合拍的。", tone: "warm", redflag: "rf_emotion", next: "d2" },
          { text: "合不合拍还得线下见见才知道。", tone: "cautious", next: "d2" },
        ] },
      d2: { speaker: "scammer", phase: "套取隐私", frag: "da_f2",
        text: "你一个人住还是和家里人？做什么工作的呀，方便说吗～",
        variants: [
          "你一个人住还是和家里人？做什么工作的呀，方便说吗～",
          "你平时自己住吗？做什么工作的呀，好奇😊",
          "家里人知道你谈恋爱不？你做啥的呀～",
        ],
        options: [
          { text: "我一个人住，做设计的，挺自由。", tone: "warm", redflag: "rf_info", next: "d3" },
          { text: "这些网上就不细说了哈。", tone: "cautious", next: "d3" },
        ] },
      d3: { speaker: "scammer", phase: "制造紧急", frag: "da_f3",
        text: "我爸突然住院了，手术费差一点，能不能先借我周转？回头就还。",
        variants: [
          "我爸突然住院了，手术费差一点，能不能先借我周转？回头就还。",
          "家里出急事了，爸住院差钱，你能先借我点吗，过阵还。",
          "不好意思开口，但我真急，爸手术费还差几万…",
        ],
        options: [
          { text: "好心疼，我转你 3 万应急。", tone: "warm", redflag: "rf_transfer", next: "d4" },
          { text: "借钱得先视频见真人，不然不借。", tone: "cautious", next: "d4" },
        ] },
      d4: { speaker: "scammer", phase: "持续索取", frag: "da_f4",
        text: "钱还不够，后面还有复查费……你再帮帮我嘛，咱们以后一起去旅行。",
        variants: [
          "钱还不够，后面还有复查费……你再帮帮我嘛，咱们以后一起去旅行。",
          "还差复查费，你再帮帮我，等好了咱去旅行。",
          "就差最后一笔了，帮完咱就见面去玩。",
        ],
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

/* M4.2 话术多样化：护栏内随机挑选骗子台词变体（逻辑一致、仅语气/用词不同） */
function pickScammerLine(node) {
  if (node && Array.isArray(node.variants) && node.variants.length) {
    return node.variants[Math.floor(Math.random() * node.variants.length)];
  }
  return node ? node.text : "";
}
