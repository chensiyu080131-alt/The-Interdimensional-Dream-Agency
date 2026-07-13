/* 异次元梦想局 · V5.0 数据层（角色 + 话术树 + 工具箱） */
/* option.type: warm(热情)/neutral(中性)/cautious(谨慎)/extreme(极端)/counter(反骗) */

const ROLES = {
  linxiao: { name:"林晓", age:28, job:"互联网运营", city:"上海", line:"A·杀猪盘", color:"#ff6b81", avatar:"林",
    profile:"独居一线城市，工作压力大，渴望一段稳定感情。社交圈窄，常感孤独。",
    anxiety:"害怕孤独终老", lineKey:"pig", tags:["外向","温柔","渴望陪伴","工作压力大"] },
  chenjing: { name:"陈静", age:42, job:"退休教师", city:"成都", line:"A·杀猪盘(中老年)", color:"#e67e9b", avatar:"陈",
    profile:"离异独居 8 年，女儿在外地上大学。退休后时间多了，每天刷手机、看短视频。",
    anxiety:"老了怎么办，没人管", lineKey:"pig_old", tags:["善良","孤单","信任他人","生活规律"] },
  zhangwei: { name:"张伟", age:35, job:"制造业主管", city:"苏州", line:"D·虚假投资理财", color:"#4a90d9", avatar:"张",
    profile:"有家庭有积蓄，房贷车贷压身，想让资产增值但缺乏专业渠道。焦虑于通胀。",
    anxiety:"钱不够花，孩子未来怎么办", lineKey:"invest", tags:["稳重","责任感强","焦虑","爱面子"] },
  wanglei: { name:"王磊", age:24, job:"应届生(待业)", city:"北京", line:"B·刷单返利", color:"#f0a020", avatar:"王",
    profile:"刚毕业囊中羞涩，投了 100 多份简历没着落。想赚快钱证明自己。",
    anxiety:"找不到好工作，同学都比我强", lineKey:"brush", tags:["好胜心强","急于证明自己","迷茫"] },
  zhaomin: { name:"赵敏", age:30, job:"全职妈妈", city:"深圳", line:"B·刷单返利", color:"#e69b20", avatar:"赵",
    profile:"辞职带娃三年，觉得和社会脱节。在妈妈群看到'在家就能赚钱'的广告。",
    anxiety:"除了带孩子我什么都不会", lineKey:"brush", tags:["内向","渴望社交","自我价值感低"] },
  sunyue: { name:"孙悦", age:26, job:"护士", city:"武汉", line:"C·求职/培训贷", color:"#9b59b6", avatar:"孙",
    profile:"ICU 干了 4 年三班倒，身心俱疲。想转行却不知能做什么，看到'零基础转行月薪2万'。",
    anxiety:"不想一辈子当护士", lineKey:"train", tags:["细心","善良","过度劳累","想逃离"] },
  zhouming: { name:"周明", age:38, job:"公司中层", city:"广州", line:"G·冒充领导", color:"#34495e", avatar:"周",
    profile:"在公司干 6 年卡在经理级。很在意领导评价，怕得罪人。收到'我是李总，新号备注一下'。",
    anxiety:"晋升无望，想往上爬", lineKey:"boss", tags:["自信","急躁","迷信人脉","怕得罪领导"] },
  wuqian: { name:"吴倩", age:22, job:"大四学生", city:"南京", line:"K·境外高薪", color:"#16a085", avatar:"吴",
    profile:"大四，同学或考研或就业，自己还没着落。看到'海外高薪月入3万，包吃包住'。",
    anxiety:"毕业即失业，不想啃老", lineKey:"oversea", tags:["好奇","追求新鲜","既期待又恐惧"] },
  huanghai: { name:"黄海", age:52, job:"退休工人", city:"沈阳", line:"H·冒充公检法", color:"#7f8c8d", avatar:"黄",
    profile:"老实本分，丧偶独居。老伴走了 3 年，女儿外地。一天接到'你是黄海吗？你涉嫌洗钱……'。",
    anxiety:"一个人过日子，怕出事", lineKey:"police", tags:["老实","固执","缺乏经验","信任权威"] },
  yangxue: { name:"杨雪", age:33, job:"自由设计师", city:"杭州", line:"E·虚假购物", color:"#2c7be5", avatar:"杨",
    profile:"离异带娃，收入时好时坏。很会过日子，买东西必比价。看到大衣便宜一半，刚下单就接到'客服'电话。",
    anxiety:"收入不稳，孩子未来怎么办", lineKey:"shop", tags:["独立","焦虑","追求性价比","精打细算"] },
  liuyang: { name:"刘洋", age:45, job:"餐饮个体户", city:"郑州", line:"F·贷款/征信", color:"#d35400", avatar:"刘",
    profile:"开了 8 年饭店，近两年生意差。在'创业老板群'看到'加盟新零售三个月回本'。",
    anxiety:"生意难做，得找新出路", lineKey:"loan", tags:["精明","胆子大","易轻信赚钱机会"] },
};

/* 角色月收入（用于损失计算） */
const ROLE_INCOME = { linxiao:12000, chenjing:6000, zhangwei:25000, wanglei:4000, zhaomin:0, sunyue:8000, zhouming:35000, wuqian:2000, huanghai:5000, yangxue:15000, liuyang:30000 };

const SCRIPTS = {
  pig: {
    name:"杀猪盘（社交交友）", start:"d1r1", lossFactor:6,
    rounds:{
      d1r1:{ day:1, content:"你好呀，看你的头像好亲切，可以认识一下吗？我是做金融的，平时太忙很少主动加人。", tag:"低风险试探", psy:"低风险试探", expose:0,
        options:[
          { text:"好呀！我也想认识你", type:"warm", trust:10, help:-2, next:"d1r2" },
          { text:"你是做什么工作的？", type:"neutral", trust:3, next:"d1r2" },
          { text:"不了谢谢", type:"extreme", trust:-20, route:"alert" },
        ]},
      d1r2:{ day:1, content:"太好了～我平时工作太忙，很少主动加人。一个人在外地打拼，有时候挺孤独的。", tag:"情感铺垫", psy:"印象管理", expose:5,
        options:[
          { text:"我也是，经常一个人", type:"warm", trust:8, help:-3, next:"d2r1" },
          { text:"那你平时忙什么呀", type:"neutral", trust:3, next:"d2r1" },
        ]},
      d2r1:{ day:2, content:"其实我前女友因为我太忙离开了我……（叹气）现在只想找个能聊得来的人。", tag:"情感索取", psy:"制造共情", expose:8,
        options:[
          { text:"抱抱你，过去翻篇啦", type:"warm", trust:10, next:"d2r2" },
          { text:"感情的事看缘分", type:"neutral", trust:2, next:"d2r2" },
        ]},
      d2r2:{ day:2, content:"对了，我舅舅是证券高管，偶尔给些内部消息，收益挺稳的。", tag:"埋下诱饵", psy:"信息钓鱼", expose:12,
        options:[
          { text:"真的吗？能带带我吗", type:"warm", trust:12, exposeAdd:8, next:"d3r1" },
          { text:"内部消息靠谱吗？", type:"cautious", trust:0, next:"d3r1" },
        ]},
      d3r1:{ day:3, content:"我在用一个小平台操作，要不要发你看看？充值门槛不高，收益每天都看得见。", tag:"诱导开户", psy:"渐进承诺", expose:18,
        options:[
          { text:"好呀，发来试试", type:"warm", trust:12, exposeAdd:6, next:"d3r2" },
          { text:"先观望一下", type:"cautious", trust:2, next:"d3r2" },
        ]},
      d3r2:{ day:3, content:"你先充 5000 试试水，我教你操作，稳赚的～等你赚了咱们庆祝。", tag:"索求资金", psy:"沉没成本铺垫", expose:25,
        options:[
          { text:"行，我转 5000", type:"warm", trust:15, exposeAdd:10, next:"d4r1" },
          { text:"能不能少一点", type:"neutral", trust:5, next:"d4r1" },
        ]},
      d4r1:{ day:4, content:"亲爱的，你能帮我登一下我的账户吗？我这边不方便，你点一下确认就好。", tag:"最终收割", psy:"委托信任", expose:30,
        options:[
          { text:"好，我帮你操作", type:"warm", trust:20, exposeAdd:10, route:"scam" },
          { text:"拉黑，感觉不对劲", type:"extreme", trust:-10, route:"safe" },
          { text:"假装答应，先不操作", type:"counter", trust:5, route:"safe" },
        ]},
    },
    case:{ title:"「杀猪盘」受害者 · 可欣的故事", warn:"网络交友涉及'投资''内部渠道''高收益'，几乎都是诈骗。",
      body:["可欣，29 岁，普通公司文员。2022 年在社交软件认识自称'新加坡金融投资顾问'的男人。",
        "对方每天嘘寒问暖，两个多月从未提钱，她很快当成托付终身的人。",
        "直到对方神秘地说有'内部投资平台'，第一次投 5000 元两天赚 800 并顺利提现——她彻底信了。",
        "此后越投越多：积蓄、信用卡、网贷，前后共投入 86 万元。",
        "想全部提现时，平台称'账户涉嫌洗钱被冻结，需缴 20% 保证金'——男友、平台、收益，全是骗局。"] },
  },
  pig_old: {
    name:"杀猪盘（中老年）", start:"d1r1", lossFactor:4,
    rounds:{
      d1r1:{ day:1, content:"姐姐好，刷到你评论觉得你特别温柔，可以认识一下吗？我是做茶叶生意的。", tag:"低风险试探", psy:"低风险试探", expose:0,
        options:[
          { text:"你好呀，你也很会说话", type:"warm", trust:10, next:"d1r2" },
          { text:"你是哪里的？", type:"neutral", trust:3, next:"d1r2" },
          { text:"不认识了", type:"extreme", trust:-20, route:"alert" },
        ]},
      d1r2:{ day:1, content:"我在外地做生意，一年回不了几次家。姐姐你一个人，平时多无聊呀。", tag:"情感铺垫", psy:"制造共情", expose:5,
        options:[
          { text:"是呀，女儿在外地读书", type:"warm", trust:8, exposeAdd:5, next:"d2r1" },
          { text:"习惯了", type:"neutral", trust:2, next:"d2r1" },
        ]},
      d2r1:{ day:2, content:"姐姐，我这批茶叶被退了，资金压着周转不开，你能不能帮我一把？以后一定还。", tag:"情感索取", psy:"激发保护欲", expose:10,
        options:[
          { text:"需要多少？我帮帮你", type:"warm", trust:12, exposeAdd:6, next:"d2r2" },
          { text:"这不太合适吧", type:"cautious", trust:0, next:"d2r2" },
        ]},
      d2r2:{ day:2, content:"其实我也在炒点东西跟着老师做，稳赚。姐姐你要不要也试试，比存款强多了。", tag:"埋下诱饵", psy:"信息钓鱼", expose:15,
        options:[
          { text:"什么能稳赚？", type:"warm", trust:10, exposeAdd:6, next:"d3r1" },
          { text:"我不太懂这些", type:"cautious", trust:2, next:"d3r1" },
        ]},
      d3r1:{ day:3, content:"你先投 2 万，老师带单，一个月能回本。我把账户发你，你看着操作。", tag:"索求资金", psy:"沉没成本铺垫", expose:22,
        options:[
          { text:"好，我转 2 万", type:"warm", trust:15, exposeAdd:10, next:"d4r1" },
          { text:"我得想想", type:"cautious", trust:3, next:"d4r1" },
        ]},
      d4r1:{ day:4, content:"姐姐，最后一波行情，再投 5 万就能全部提出来，错过就没有了！", tag:"最终收割", psy:"稀缺性+紧迫感", expose:30,
        options:[
          { text:"好，我再凑 5 万", type:"warm", trust:20, exposeAdd:10, route:"scam" },
          { text:"我问问女儿", type:"cautious", trust:5, help:15, route:"safe" },
          { text:"不投了，感觉不对", type:"extreme", trust:-10, route:"safe" },
        ]},
    },
    case:{ title:"「杀猪盘」中老年受害者 · 秀兰阿姨", warn:"陌生网友以'帮忙''投资'为由要钱，多半是诈骗。多和子女沟通。",
      body:["秀兰，58 岁，退休后独居。在短视频评论区认识自称'做生意'的男子。",
        "对方每日问候、嘘寒问暖，称她'像妈妈一样温暖'。",
        "以'茶叶压货''跟着老师稳赚'为由，先后诱导她投入 18 万元养老钱。",
        "当她想提现时，对方以'税费''保证金'不断要钱，最终失联。"] },
  },
  invest: {
    name:"虚假投资理财", start:"d1r1", lossFactor:5,
    rounds:{
      d1r1:{ day:1, content:"张哥好，我是'内部荐股群'助理。老师是退休基金经理，带单准确率很高，进群看看？", tag:"引流加群", psy:"精准搭讪", expose:5,
        options:[
          { text:"进群看看", type:"warm", trust:10, next:"d1r2" },
          { text:"什么群？", type:"neutral", trust:3, next:"d1r2" },
          { text:"不感兴趣", type:"extreme", trust:-20, route:"alert" },
        ]},
      d1r2:{ day:1, content:"老师今天带单赚 8%，群里都在晒盈利截图。张哥你看，机会不多。", tag:"氛围烘托", psy:"从众效应", expose:8,
        options:[
          { text:"确实不错", type:"warm", trust:8, next:"d2r1" },
          { text:"截图能作假吧", type:"cautious", trust:0, next:"d2r1" },
        ]},
      d2r1:{ day:2, content:"老师说明天有'内推票'，只给核心会员。充 5 万就能跟单，仓位有限。", tag:"制造稀缺", psy:"稀缺性", expose:15,
        options:[
          { text:"我充值 5 万", type:"warm", trust:12, exposeAdd:8, next:"d2r2" },
          { text:"先充 1 万试试", type:"neutral", trust:6, next:"d2r2" },
        ]},
      d2r2:{ day:2, content:"好的张哥，已帮你开户。明天开盘老师喊单，你盯着就行。", tag:"开户充值", psy:"渐进承诺", expose:18,
        options:[ { text:"期待明天", type:"warm", trust:5, next:"d3r1" } ]},
      d3r1:{ day:3, content:"张哥，账户显示今天赚 6000！老师让你加仓，再充 10 万收益翻倍。", tag:"诱导加仓", psy:"零风险承诺", expose:25,
        options:[
          { text:"再充 10 万", type:"warm", trust:15, exposeAdd:10, next:"d3r2" },
          { text:"先提现落袋", type:"cautious", trust:3, next:"d3r2" },
        ]},
      d3r2:{ day:3, content:"提现？老师会很为难……平台说要'账户激活'才能提，再充 5 万就能激活。", tag:"阻止提现", psy:"延迟支付", expose:28,
        options:[
          { text:"好吧再充 5 万", type:"warm", trust:15, exposeAdd:8, next:"d4r1" },
          { text:"我要提现，不玩了", type:"extreme", trust:-5, route:"safe" },
        ]},
      d4r1:{ day:4, content:"张哥，老师给了'稳赚通道'，你把账户密码告诉我，我帮你操作一波大的？", tag:"最终收割", psy:"权威效应", expose:30,
        options:[
          { text:"好，账号密码发你", type:"warm", trust:20, exposeAdd:10, route:"scam" },
          { text:"算了，我要报警", type:"extreme", trust:-10, route:"safe" },
        ]},
    },
    case:{ title:"「虚假投资理财」受害者 · 老周", warn:"凡是要你先充值、再'激活'才能提现的，都是诈骗。占全部损失约 40%。",
      body:["老周，40 岁，小老板。被拉进'荐股群'，群里每天晒盈利，老师自称退休基金经理。",
        "他先充 5 万跟单，三天账面赚 6000，心动加仓 10 万。",
        "想提现时客服说'账户未激活，需再充 5 万保证金'，照做后仍无法提现。",
        "老师解散群聊、助理失联。老周前后损失 20 万元。"] },
  },
  brush: {
    name:"刷单返利", start:"d1r1", lossFactor:3,
    rounds:{
      d1r1:{ day:1, content:"同学你好～电商刷单兼职，动动手指赚佣金，一单 5-20 元，要做吗？", tag:"低门槛引流", psy:"夸张收益", expose:5,
        options:[
          { text:"怎么做的？", type:"warm", trust:10, next:"d1r2" },
          { text:"刷单不是违法吗", type:"cautious", trust:0, next:"d1r2" },
          { text:"不感兴趣", type:"extreme", trust:-20, route:"alert" },
        ]},
      d1r2:{ day:1, content:"正规商家冲销量～你先垫付，完成任务本金+佣金一起返。第一单我带你，稳赚。", tag:"建立信任", psy:"伪造信誉", expose:8,
        options:[
          { text:"那我试试第一单", type:"warm", trust:10, exposeAdd:5, next:"d2r1" },
          { text:"要交押金吗", type:"cautious", trust:2, next:"d2r1" },
        ]},
      d2r1:{ day:2, content:"已返现 35 元到微信！你信誉不错，可以接'连单任务'了，佣金更高哦。", tag:"小额返现", psy:"初次兑现", expose:12,
        options:[
          { text:"接连单任务", type:"warm", trust:12, exposeAdd:6, next:"d2r2" },
          { text:"再做普通的", type:"neutral", trust:5, next:"d2r2" },
        ]},
      d2r2:{ day:2, content:"连单任务需垫付 2000 元，完成后返 2600。把本金转过来，我帮你下单。", tag:"索要垫付", psy:"渐进承诺", expose:20,
        options:[
          { text:"转你 2000", type:"warm", trust:12, exposeAdd:8, next:"d3r1" },
          { text:"先做 500 的", type:"neutral", trust:3, next:"d3r1" },
        ]},
      d3r1:{ day:3, content:"系统提示：连单还差最后一笔 5000 元才能'解冻结算'，否则前面本金无法返还！", tag:"冻结恐吓", psy:"沉没成本", expose:28,
        options:[
          { text:"那我再转 5000", type:"warm", trust:15, exposeAdd:10, next:"d3r2" },
          { text:"不对，我要退款", type:"extreme", trust:-5, route:"safe" },
        ]},
      d3r2:{ day:3, content:"还差 8000 元'保证金'就能全部提现啦，同学抓紧，名额快没了！", tag:"连环诈骗", psy:"稀缺性+紧迫感", expose:30,
        options:[
          { text:"咬牙再转 8000", type:"warm", trust:18, exposeAdd:10, route:"scam" },
          { text:"我报警了", type:"extreme", trust:-10, route:"safe" },
        ]},
      d4r1:{ day:4, content:"同学，再充一笔就能出金了，真的就差这一步！", tag:"最终收割", psy:"连环诈骗", expose:32,
        options:[
          { text:"好，再信你一次", type:"warm", trust:20, exposeAdd:8, route:"scam" },
          { text:"拉黑", type:"extreme", trust:-10, route:"safe" },
        ]},
    },
    case:{ title:"「刷单返利」受害者 · 小宇", warn:"任何'先垫付、后返佣'的兼职，基本都是刷单诈骗。占全部电诈 25%。",
      body:["小宇，22 岁，大学生。看到'动动手指赚佣金'广告，第一单返现 35 元尝到甜头。",
        "随后被诱导接'连单任务'，垫付 2000 元后被告知'还差一笔才能解冻'。",
        "为拿回本金，又转了 5000、8000……前后投入 1.8 万元。",
        "当她再也拿不出钱时，对方拉黑消失。所谓'连单''解冻'，全是套路。"] },
  },
  train: {
    name:"求职诈骗/培训贷", start:"d1r1", lossFactor:2,
    rounds:{
      d1r1:{ day:1, content:"您好，我是 XX 科技 HR，您简历很符合运营助理岗，月薪 8000+五险一金。", tag:"精准吸引", psy:"精准吸引", expose:5,
        options:[
          { text:"好的，我明天来面试", type:"warm", trust:10, next:"d1r2" },
          { text:"什么公司？", type:"neutral", trust:3, next:"d1r2" },
          { text:"招聘勿扰", type:"extreme", trust:-20, route:"alert" },
        ]},
      d1r2:{ day:1, content:"我们是大厂合作企业，发展前景好，晋升通道清晰。", tag:"权威背书", psy:"权威背书", expose:8,
        options:[
          { text:"太好了", type:"warm", trust:8, next:"d2r1" },
          { text:"我需要准备什么？", type:"neutral", trust:3, next:"d2r1" },
        ]},
      d2r1:{ day:2, content:"你的基础不错，但缺实操经验。现在企业都要'即插即用'的人才。", tag:"制造焦虑", psy:"制造焦虑", expose:12,
        options:[
          { text:"那怎么办？", type:"warm", trust:8, next:"d2r2" },
          { text:"我可以学", type:"neutral", trust:4, next:"d2r2" },
        ]},
      d2r2:{ day:2, content:"我们公司有岗前实训，3 个月达中级水平。", tag:"提供方案", psy:"提供解决方案", expose:15,
        options:[
          { text:"什么实训？", type:"neutral", trust:5, next:"d3r1" },
          { text:"收费吗？", type:"cautious", trust:2, next:"d3r1" },
        ]},
      d3r1:{ day:3, content:"实训费 18800，但和金融机构合作可免息分期，入职后工资里扣。", tag:"降低门槛", psy:"降低支付门槛", expose:20,
        options:[
          { text:"分期怎么操作？", type:"warm", trust:12, exposeAdd:8, next:"d4r1" },
          { text:"太贵了", type:"cautious", trust:2, next:"d4r1" },
        ]},
      d4r1:{ day:4, content:"学完包就业，相当于不花自己的钱。名额有限，今天签约还能减免。", tag:"最终收割", psy:"承诺+延迟支付", expose:28,
        options:[
          { text:"签约", type:"warm", trust:18, exposeAdd:10, route:"scam" },
          { text:"拒绝", type:"extreme", trust:-10, route:"safe" },
          { text:"回去想想", type:"cautious", trust:3, help:5, route:"safe" },
        ]},
    },
    case:{ title:"「培训贷」受害者 · 招转培骗局", warn:"面试就让贷款培训、'包就业'的，多为招转培骗局。五部门已联合风险提示。",
      body:["北京'招转培'骗局诱骗 1200 余名求职者，涉案 1950 余万元。",
        "不法分子以'培训后快速上手''包就业''保证收入'话术，伪造聊天记录和成功案例，",
        "诱导求职者参加培训并办理贷款。培训质量低劣，承诺的就业根本不存在，",
        "求职者却背上了沉重的贷款债务。"] },
  },
  boss: {
    name:"冒充领导/熟人", start:"d1r1", lossFactor:4,
    rounds:{
      d1r1:{ day:1, content:"我是李总，这是我的新号，你备注一下。（对方头像与领导一致）", tag:"身份伪裝", psy:"权威冒充", expose:5,
        options:[
          { text:"好的李总，已备注", type:"warm", trust:10, next:"d1r2" },
          { text:"您有什么事吗？", type:"neutral", trust:3, next:"d1r2" },
          { text:"你不是李总吧", type:"cautious", trust:-15, route:"alert" },
        ]},
      d1r2:{ day:1, content:"小王啊，最近表现不错。有个事想请你帮个忙，不方便在群里说。", tag:"情感拉拢", psy:"制造特殊性", expose:8,
        options:[
          { text:"李总您说", type:"warm", trust:8, next:"d2r1" },
          { text:"什么忙？", type:"neutral", trust:3, next:"d2r1" },
        ]},
      d2r1:{ day:2, content:"我有个紧急业务转账，对方是对公账户，但我这边限额了。你先帮我垫一下，回头走公司账还你。", tag:"紧急要求", psy:"权威+紧急", expose:15,
        options:[
          { text:"转多少？我安排", type:"warm", trust:12, exposeAdd:8, next:"d3r1" },
          { text:"能先电话确认下吗", type:"cautious", trust:0, next:"d3r1" },
        ]},
      d3r1:{ day:3, content:"急用 8 万，账号我发你。这事别声张，公司层面不方便。", tag:"索取转账", psy:"紧迫感", expose:22,
        options:[
          { text:"好，我转 8 万", type:"warm", trust:15, exposeAdd:10, route:"scam" },
          { text:"我得先核实身份", type:"cautious", trust:3, help:10, route:"safe" },
          { text:"这不正常，我报警", type:"extreme", trust:-10, route:"safe" },
        ]},
      d4r1:{ day:4, content:"怎么还没转？再不转这单就黄了，到时候别怪我没提醒你！", tag:"施压催收", psy:"情感绑架", expose:25,
        options:[
          { text:"马上转，别生气", type:"warm", trust:18, exposeAdd:8, route:"scam" },
          { text:"我直接打李总电话", type:"counter", trust:5, help:15, route:"safe" },
        ]},
    },
    case:{ title:"「冒充领导」受害者 · 财务小刘", warn:"领导通过陌生账号要求转账，务必当面或电话核实，绝不轻信文字信息。",
      body:["某财务小刘收到'领导'新号好友申请，对方头像、昵称与领导一致。",
        "'领导'称有紧急业务需垫付，让小刘转账 8 万元到'对公账户'。",
        "小刘未电话核实便转账，事后发现领导本人毫不知情，账号系伪造。",
        "此类冒充领导、熟人的诈骗，多发于企业财务、行政人员。"] },
  },
  oversea: {
    name:"境外高薪招聘", start:"d1r1", lossFactor:3,
    rounds:{
      d1r1:{ day:1, content:"妹妹你好～海外高薪招聘，月入 3 万起，包吃包住，无需经验，考虑吗？", tag:"高薪诱惑", psy:"夸张收益", expose:5,
        options:[
          { text:"真的吗？做什么？", type:"warm", trust:10, next:"d1r2" },
          { text:"不会是骗子吧", type:"cautious", trust:0, next:"d1r2" },
          { text:"不感兴趣", type:"extreme", trust:-20, route:"alert" },
        ]},
      d1r2:{ day:1, content:"客服/接待类，很轻松。机票我们报销，过去有人接。", tag:"降低顾虑", psy:"降低门槛", expose:8,
        options:[
          { text:"那我准备一下", type:"warm", trust:8, next:"d2r1" },
          { text:"需要交钱吗？", type:"cautious", trust:2, next:"d2r1" },
        ]},
      d2r1:{ day:2, content:"先交 2000 元'签证服务费'，办完直接从工资扣，还能理解吗？", tag:"索要费用", psy:"延迟支付", expose:15,
        options:[
          { text:"好，我交", type:"warm", trust:12, exposeAdd:8, next:"d3r1" },
          { text:"为什么要先交钱", type:"cautious", trust:2, next:"d3r1" },
        ]},
      d3r1:{ day:3, content:"机票订好了，你买张去边境的车票，到了有人接你去口岸。", tag:"诱导出境", psy:"制造紧迫感", expose:22,
        options:[
          { text:"好，我买票", type:"warm", trust:15, exposeAdd:10, route:"scam" },
          { text:"我要问问我爸妈", type:"cautious", trust:3, help:15, route:"safe" },
          { text:"太可疑了，不去了", type:"extreme", trust:-10, route:"safe" },
        ]},
      d4r1:{ day:4, content:"车都安排好了，别犹豫，过了这村没这店，来了你就财务自由了！", tag:"最终收割", psy:"稀缺性", expose:28,
        options:[
          { text:"出发！", type:"warm", trust:20, exposeAdd:8, route:"scam" },
          { text:"我报警咨询一下", type:"extreme", trust:-10, route:"safe" },
        ]},
    },
    case:{ title:"「境外高薪」受害者 · 小江", warn:"'境外高薪、包吃包住、无需经验'多为诱骗出境从事违法活动，切勿前往边境。",
      body:["小江，22 岁，看到'海外高薪月入3万'广告，被'报销机票'吸引。",
        "对方诱导其购买前往边境的车票，称'有人接应'。",
        "现实中，大量求职者被诱骗至境外后限制人身自由，被迫从事诈骗等违法活动。",
        "如遇此类招聘，请立即拨打 96110 或 110 咨询。"] },
  },
  police: {
    name:"冒充公检法", start:"d1r1", lossFactor:4,
    rounds:{
      d1r1:{ day:1, content:"你是黄海吗？我是沈阳市公安局的，你涉嫌一起洗钱案，请配合调查。", tag:"权威恐吓", psy:"权威恐吓", expose:5,
        options:[
          { text:"我没做啊！", type:"warm", trust:8, next:"d1r2" },
          { text:"怎么证明你是警察？", type:"cautious", trust:0, next:"d1r2" },
          { text:"我挂了，打 110 核实", type:"extreme", trust:-20, route:"safe" },
        ]},
      d1r2:{ day:1, content:"别紧张，我们加你微信发你'逮捕令'看看。你名下银行卡涉嫌转移赃款。", tag:"伪造文书", psy:"制造恐慌", expose:10,
        options:[
          { text:"我看到逮捕令了…", type:"warm", trust:10, exposeAdd:5, next:"d2r1" },
          { text:"这不对劲", type:"cautious", trust:2, next:"d2r1" },
        ]},
      d2r1:{ day:2, content:"为证明清白，把你所有存款转到'安全账户'接受资金清查，查完如数返还。", tag:"安全账户", psy:"权威+恐惧", expose:18,
        options:[
          { text:"好，我转过去", type:"warm", trust:15, exposeAdd:10, route:"scam" },
          { text:"安全账户是诈骗套路", type:"cautious", trust:5, help:15, route:"safe" },
        ]},
      d3r1:{ day:3, content:"清查需要验证码，把你收到的短信验证码发我，否则立刻冻结你名下所有资产！", tag:"索要验证码", psy:"紧迫+恐吓", expose:25,
        options:[
          { text:"验证码是…", type:"warm", trust:18, exposeAdd:10, route:"scam" },
          { text:"我绝不发验证码", type:"cautious", trust:5, help:15, route:"safe" },
        ]},
      d4r1:{ day:4, content:"最后一次机会！不配合就立刻对你上网逃，公安上门抓人！", tag:"最终收割", psy:"权威恐吓", expose:30,
        options:[
          { text:"我转，别抓我", type:"warm", trust:20, exposeAdd:8, route:"scam" },
          { text:"我打 110 核实", type:"counter", trust:5, help:15, route:"safe" },
        ]},
    },
    case:{ title:"「冒充公检法」受害者 · 老黄", warn:"公检法绝不会要求转账到'安全账户'，更不会索要验证码。接到此类电话直接挂断并拨打 110。",
      body:["老黄，52 岁，退休工人。一天接到'公安局'电话，称其涉嫌洗钱。",
        "对方发来伪造的'逮捕令'，恐吓其将名下存款转入'安全账户'清查。",
        "老黄恐慌中先后转出 12 万元养老钱。所谓'安全账户'，是诈骗分子的收款账户。",
        "公检法机关不会通过电话、网络办案，更不会要求转账。"] },
  },
  shop: {
    name:"虚假购物/服务", start:"d1r1", lossFactor:2,
    rounds:{
      d1r1:{ day:1, content:"您好，您购买的大衣有质量问题，我们要双倍赔付。请下载'理赔中心'App 操作。", tag:"冒充客服", psy:"伪造信誉", expose:5,
        options:[
          { text:"好，我下载", type:"warm", trust:8, exposeAdd:5, next:"d1r2" },
          { text:"为什么不直接退款？", type:"cautious", trust:2, next:"d1r2" },
          { text:"我自己去官网", type:"extreme", trust:-20, route:"alert" },
        ]},
      d1r2:{ day:1, content:"App 里您先绑定银行卡，我们走理赔通道。需要开启屏幕共享帮您操作。", tag:"诱导下载", psy:"降低门槛", expose:10,
        options:[
          { text:"开启屏幕共享", type:"warm", trust:12, exposeAdd:8, next:"d2r1" },
          { text:"不开共享，我自己弄", type:"cautious", trust:3, next:"d2r1" },
        ]},
      d2r1:{ day:2, content:"理赔金已到账您App钱包，但需先交 500 元'保证金'才能提现到银行卡。", tag:"索要保证金", psy:"沉没成本", expose:18,
        options:[
          { text:"好，我交 500", type:"warm", trust:12, exposeAdd:8, next:"d3r1" },
          { text:"凭什么要保证金", type:"cautious", trust:2, next:"d3r1" },
        ]},
      d3r1:{ day:3, content:"您的账户异常，需再转 3000 元'验证资金'才能解冻理赔金。", tag:"连环收费", psy:"延迟支付", expose:25,
        options:[
          { text:"转你 3000", type:"warm", trust:15, exposeAdd:10, route:"scam" },
          { text:"不对，我退货", type:"cautious", trust:3, help:5, route:"safe" },
          { text:"拉黑报警", type:"extreme", trust:-10, route:"safe" },
        ]},
      d4r1:{ day:4, content:"最后一步，再转 8000 元'流水认证'就能全部到账，错过今天无效！", tag:"最终收割", psy:"稀缺性+紧迫感", expose:30,
        options:[
          { text:"好，再转 8000", type:"warm", trust:20, exposeAdd:8, route:"scam" },
          { text:"我报警了", type:"extreme", trust:-10, route:"safe" },
        ]},
    },
    case:{ title:"「虚假购物」受害者 · 杨女士", warn:"凡是'理赔'要你下载陌生App、开启屏幕共享、先交保证金的，都是诈骗。",
      body:["杨女士网购后接到'客服'电话，称商品质量有问题要双倍赔付。",
        "对方诱导其下载陌生App并开启屏幕共享，随后以'保证金''验证资金'等名义收费。",
        "在屏幕共享下，杨女士的银行卡信息、验证码被全程窃取，损失 4 万余元。",
        "正规理赔均在原购物平台完成，绝不会要求屏幕共享或下载陌生App。"] },
  },
  loan: {
    name:"贷款/征信", start:"d1r1", lossFactor:3,
    rounds:{
      d1r1:{ day:1, content:"刘总您好，我是'新零售加盟'招商，看到您在老板群，项目三个月回本，有兴趣吗？", tag:"精准搭讪", psy:"精准吸引", expose:5,
        options:[
          { text:"说说看", type:"warm", trust:10, next:"d1r2" },
          { text:"什么项目？", type:"neutral", trust:3, next:"d1r2" },
          { text:"不需要", type:"extreme", trust:-20, route:"alert" },
        ]},
      d1r2:{ day:1, content:"加盟我们品牌，总部扶持、包教包会。但需要先交 2 万'意向金'锁定区域。", tag:"索要定金", psy:"降低门槛", expose:10,
        options:[
          { text:"好，交 2 万", type:"warm", trust:12, exposeAdd:8, next:"d2r1" },
          { text:"能考察后再交吗", type:"cautious", trust:2, next:"d2r1" },
        ]},
      d2r1:{ day:2, content:"区域很抢手，您征信得干净。我们帮您'优化征信'，需转 1 万'服务费'。", tag:"征信话术", psy:"制造焦虑", expose:18,
        options:[
          { text:"转你 1 万", type:"warm", trust:12, exposeAdd:8, next:"d3r1" },
          { text:"征信还能优化？", type:"cautious", trust:2, next:"d3r1" },
        ]},
      d3r1:{ day:3, content:"门店要激活，需再转 3 万'运营保证金'，否则前面意向金不退。", tag:"连环收费", psy:"沉没成本", expose:25,
        options:[
          { text:"转你 3 万", type:"warm", trust:15, exposeAdd:10, route:"scam" },
          { text:"我要退意向金", type:"cautious", trust:3, help:5, route:"safe" },
          { text:"感觉被套了", type:"extreme", trust:-10, route:"safe" },
        ]},
      d4r1:{ day:4, content:"最后机会，再转 5 万'区域独占费'，名额马上给别人了！", tag:"最终收割", psy:"稀缺性", expose:30,
        options:[
          { text:"好，再转 5 万", type:"warm", trust:20, exposeAdd:8, route:"scam" },
          { text:"我报警核实", type:"extreme", trust:-10, route:"safe" },
        ]},
    },
    case:{ title:"「加盟/贷款」受害者 · 刘老板", warn:"加盟先交'意向金''保证金'，或以'优化征信'为由收费的，多为连环骗局。",
      body:["刘老板，45 岁，餐饮个体户。在'创业老板群'看到'加盟新零售三个月回本'。",
        "对方以'意向金''征信优化费''运营保证金'等名义，先后收取 11 万元。",
        "所谓的品牌方、扶持、区域代理，全是虚构。钱转完后对方失联。",
        "加盟投资务必实地考察、核实资质，切勿向个人账户转账。"] },
  },
};

/* 八大反诈利器 */
const TOOLBOX = [
  { ic:"📱", t:"国家反诈中心 App", d:"工信部出品，可拦截诈骗电话、核验App、举报线索。" },
  { ic:"📞", t:"96110 预警劝阻专线", d:"遭遇或疑似诈骗，立即拨打，可紧急止付、咨询。" },
  { ic:"💬", t:"12381 涉诈预警短信", d:"收到 12381 短信请务必重视，系官方预警。" },
  { ic:"🔍", t:"一证通查（电话卡/账号）", d:"全国移动电话卡、互联网账号'一证通查'，排查名下异常。" },
  { ic:"💳", t:"云闪付'一键查卡'", d:"便捷查询名下银行卡，发现异常及时注销。" },
  { ic:"🪪", t:"反诈名片", d:"来电显示'反诈名片'标识，帮助识别官方劝阻电话。" },
  { ic:"🛡", t:"跨境提醒服务", d:"出境前开通，防范境外招工、高薪骗局。" },
  { ic:"🚫", t:"不轻信不转账", d:"任何索要验证码、密码、要求屏幕共享的一律拒绝。" },
];

/* 20 个防诈关键词 */
const KEYWORDS = ["不轻信","不透露","不转账","不点击","不共享屏幕","不贪高收益","不下载陌生APP","不扫陌生码","不接境外来电","不交保证金","不垫资","不开启屏幕共享","不出租出借账户","不刷单","不投资内部渠道","不听'安全账户'","不帮领导垫款","不境外高薪","不培训贷","不泄露验证码"];

/* 蝴蝶效应：好友通讯录（通用模板，按角色代入名称） */
const BUTTERFLY_FRIENDS = ["同事·小王","大学室友·阿哲","表弟·小杰","闺蜜·婷婷","妈妈","邻居·张叔","网友·'上岸的她'","前同事·老周"];
