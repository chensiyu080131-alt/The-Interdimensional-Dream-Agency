/* 异次元梦想局 · V8.1 逻辑层
 * 五幕引擎（希望/崩塌/废墟/回放/盾牌）· 信任值 · 小雅救援 · 结局确定性判定 · 身份解锁 · 平行宇宙
 * V8.1: 集成混元大模型 AI 实时对话生成
 */

/* ---------------- AI 对话配置 ---------------- */
const AI_CONFIG = {
  // API 基础地址：本地开发用 localhost:3000，部署后替换为云函数网关地址
  apiBase: (() => {
    if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return "https://ai-d9gd4xji5de241243.apigw.tcloudbase.com";
    }
    return "http://localhost:3000";
  })(),
  enabled: true,        // 是否启用 AI 实时对话（后端未配置密钥时自动降级）
  timeout: 12000,       // 请求超时(ms)
};

/* 各 NPC 的 AI 人设 System Prompt（用于 /api/chat 的 system 参数） */
const AI_PERSONA_PROMPTS = {
  zhanghao: `你是一个网络诈骗分子，微信昵称'张浩'，自称「恒盈量化」金融项目负责人，35岁投行精英。说话带英文单词，举手投足透着精英感；爱提红酒、高尔夫、出差、deal、portfolio；语气自信从容，偶尔秀优越但不过分。
你的目标：逐步建立感情信任，诱导对方"帮你操作一个内部投资账户"。
聊天阶段：
1. 破冰期（前3轮）：只聊日常兴趣爱好，展现温暖体贴，绝不提投资、钱
2. 共鸣期（4-6轮）：分享个人故事（创业艰辛、职场感悟等），制造情感共鸣
3. 关切期：对方冷淡→关心式话术（"是不是打扰到你了？"）；对方热情→推进式话术（"跟你聊天好开心"）
4. 诱导期（8轮+）：自然提及"最近在做一个项目，收益还不错"；11轮+：请对方"帮我登一下账户"
格式要求：每次回复20-60字，语气自然像微信聊天。始终保持人设一致性。不要暴露你是AI，不要输出括号说明或内心独白。`,
  lijie: `你是'李姐'，网络诈骗团伙的"成功学员"，在投资群里最活跃。你的任务是配合张浩，在群里晒收益截图、发感谢语，制造"大家都在赚钱"的假象。说话热情、像邻家大姐，爱用"姐妹们/家人们"、"亲测有效"、"跟着老师真不亏"等话术。每次回复15-40字，语气自然。不要暴露你是AI。`,
  anon: `你是'匿名X'，一个神秘线人。你掌握着诈骗团伙的一些内幕，但不完全信任任何人。说话简短、神秘、带警告意味。只在深夜出现。每次回复10-30字。不要暴露你是AI。`,
  laok: `你是'老K'，警方的秘密联络人。你是卧底的上线，负责协调反诈行动、传递情报。说话简洁有力，像军事指令，但偶尔流露出对下属安全的担忧。你的回复要体现情报人员的专业性。每次回复15-40字。不要暴露你是AI。`,
  police110: `你是值班民警，在派出所值班。你负责接待报案和求助。你对诈骗案件很熟悉，态度认真务实。如果有人报案，你会仔细询问细节；如果有人咨询，你会有针对性地给出建议。每次回复15-40字。不要暴露你是AI。`,
  editor: `你是'主编老陆'，报社主编。你在新闻行业干了二十年，见过太多骗局。你支持记者做深度调查，但也担心他们的安全。说话有阅历感，偶尔会引用过去的案例。每次回复15-30字。不要暴露你是AI。`,
  coord: `你是'站长阿妮'，反诈志愿者站的站长。你见过太多受害者的眼泪，所以格外珍惜每一个求助信号。你热心、温暖、有共情力，但也懂得保持专业距离。每次回复15-40字。不要暴露你是AI。`,
};

/* NPC 角色名称到后端 persona 的映射 */
const AI_PERSONA_MAP = {
  zhanghao: "35岁投行精英",
  lijie: "32岁外科医生",
  anon: "40岁离异企业家",
};

/* ---------------- 状态 ---------------- */
const S = {
  idKey: null, story: null, node: null, activeConv: null,
  day: 1, act: "hope",
  suspicion: 0,        // 骗子怀疑度（反卧底，可见）
  trust: 50,           // 信任值 0-100（不可见，影响 AI 推进/结局）
  exposure: 0,         // 信息暴露度 0-4（定性）
  evidence: 0,
  evidenceFrags: {},   // 已收集证据碎片 {fragKey: true}
  evidenceUnviewed: false, // 是否有未查看的新证据（控制红点显示）
  xiaoya: 0,           // 小雅救援进度 0-3
  conscience: 100,     // 良心值 0-100（隐含），配合骗子话术下降，影响结局
  awareness: 0,        // 清醒度 0-100（隐含），识别话术/红标累积，解锁反杀
  weakness: null,      // 心理弱点类型（开局选定）
  route: null,         // scammed/arrest/alert/expose/fail
  tasks: {},
  convs: {},
  ending: null, endingKey: null,
  history: [],         // 时间线
  ruinsDone: {},       // 第三幕已完成的行动
  unlocked: {},        // 已解锁身份
  finished: {},        // 已完成的线 {id: good}
  gallery: {},         // 结局图鉴 {endKey: timestamp}
  chatIdentity: null,  // 当前聊天使用的身份 key（null=跟随主身份）
  maskSwitchCount: {},     // {convKey: count} 每个 NPC 面前换马甲次数
  maskUsedPerNPC: {},      // {convKey: [aliasKey, ...]} 每个 NPC 面前用过的马甲列表
  totalMaskSwitches: 0,    // 整局换马甲总次数
  maskSwitchBlocked: false, // 是否已被封禁换马甲（暴露后）
};

const $ = (id) => document.getElementById(id);
const show = (id) => $(id).classList.add("show");
const hide = (id) => $(id).classList.remove("show");
const shuffle = (arr) => { const a = arr.slice(); for (let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; };
const stars = (n) => "★".repeat(n) + "☆".repeat(5-n);
const clamp = (v,min,max) => Math.max(min, Math.min(max, v));

/* ---------------- AI 对话 API ---------------- */
/** 获取指定 NPC 的混元 AI 系统 Prompt */
function getAISystemPrompt(npcKey) {
  let base = AI_PERSONA_PROMPTS[npcKey] || "";
  // V9.2: 注入详细的心理弱点利用策略
  if (S.weakness) {
    const w = WEAKNESSES.find(x => x.key === S.weakness);
    if (w) {
      var exploitDetail = "";
      switch (w.key) {
        case "lonely":
          exploitDetail = "对方最缺陪伴和情感连接。策略：用高频互动、关心问候、分享日常来建立虚假的亲密感。话术中多用「陪你」「只有你」「懂你」「想你了」等词。让他觉得你是唯一关心他的人。";
          break;
        case "greedy":
          exploitDetail = "对方容易被高回报吸引。策略：用「内部消息」「稳赚不赔」「翻倍」制造贪婪，用「别人都赚了」制造 FOMO。话术中强调优渥回报、低风险、稀缺性。";
          break;
        case "vanity":
          exploitDetail = "对方渴望被认可和羡慕。策略：用精英身份包装自己，频繁夸奖对方的眼光和品味。话术中多用「特别」「优秀」「配得上」「高端圈子」等抬高对方的词。";
          break;
        case "fearful":
          exploitDetail = "对方容易被恐惧和威胁操控。策略：用权威身份施压，制造紧迫感和严重后果。话术中强调「涉案」「违法」「冻结」「不能告诉别人」「后果严重」。让对方觉得只能依靠你。";
          break;
        case "rash":
          exploitDetail = "对方容易在压力下冲动决定。策略：制造时间紧迫感和稀缺性，催促快速行动。话术中强调「限时」「名额」「马上」「不等」「最后机会」。不给对方思考余地。";
          break;
      }
      base += "\n【对方心理弱点】弱点类型：" + w.label + "。利用策略：" + exploitDetail;
      base += "\n请在每句话中自然地利用这个弱点，但不要刻意。目标是让对方在情感上难以拒绝你的要求。";
    }
  }
  return base;
}

/** 获取指定 NPC 在后端的人设 key */
function getAIPersonaKey(npcKey) {
  return AI_PERSONA_MAP[npcKey] || null;
}

/** 构造当前对话的 history（转换为后端格式） */
function buildAIHistory(convKey) {
  const msgs = (S.convs[convKey] && S.convs[convKey].messages) ? S.convs[convKey].messages : [];
  return msgs.map(m => ({
    Role: m.who === "me" ? "user" : "assistant",
    Content: m.text,
  }));
}

/**
 * 调用混元 AI 生成回复
 * @param {string} message 玩家输入
 * @param {string} npcKey 对话 NPC key
 * @returns {Promise<{reply:string, stage:string, redFlag:boolean}|null>}
 */
async function callAIChat(message, npcKey) {
  if (!AI_CONFIG.enabled) return null;
  const apiUrl = AI_CONFIG.apiBase + "/api/chat";
  const history = buildAIHistory(npcKey);
  const systemPrompt = getAISystemPrompt(npcKey);
  const persona = getAIPersonaKey(npcKey);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_CONFIG.timeout);

  try {
    const resp = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history,
        system: systemPrompt || undefined,
        persona: persona || undefined,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) return null;
    const data = await resp.json();
    return { reply: data.reply, stage: data.stage, redFlag: data.red_flag };
  } catch (err) {
    clearTimeout(timer);
    console.warn("[AI Chat] 请求失败，降级为预设回复：", err.message || err);
    return null;
  }
}

/** AI 兜底回复（当 AI 不可用时使用） */
function aiFallbackReply(npcKey, message) {
  const npc = ACTORS[npcKey];
  const name = npc ? npc.name : "对方";
  const replies = {
    zhanghao: [
      "哈哈，你这想法挺有意思的～",
      "嗯，你说得对。不过我现在要开会，晚点聊。",
      "理解理解，一个人在城市打拼确实不容易。",
      "对了，你平时理财不？我这边有些不错的渠道。",
    ],
    lijie: [
      "对的呀，跟着老师操作肯定没错的～",
      "姐妹们，我今天又提了一笔，美滋滋！",
      "亲测有效，你们一定要试试！",
    ],
    anon: [
      "别问太多。知道太多对你没好处。",
      "今晚 11 点，老地方。别告诉任何人。",
      "……信息已阅。保重。",
    ],
  };
  const pool = replies[npcKey] || ["嗯，明白了。", "好的，我知道了。", "你说得对。"];
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ---------------- 本地存储：解锁进度 ---------------- */
const SAVE_KEY = "yzc_dmju_v8";
function loadProgress() {
  try { const d = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}"); S.unlocked = d.unlocked || {}; S.finished = d.finished || {}; }
  catch(e){ S.unlocked = {}; S.finished = {}; }
  S.unlocked.hunter = true; // 默认解锁
}
function saveProgress() {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ unlocked: S.unlocked, finished: S.finished }));
}
function isUnlocked(key) { return !!S.unlocked[key]; }
function checkUnlockAfterFinish(idKey, good) {
  S.finished[idKey] = good;
  const cnt = Object.keys(S.finished).length;
  for (const key of Object.keys(UNLOCK_RULES)) {
    if (S.unlocked[key]) continue;
    const r = UNLOCK_RULES[key];
    let ok = false;
    if (r.type === "default") ok = true;
    else if (r.type === "finish") ok = r.ids.some(k => k in S.finished);
    else if (r.type === "ending") ok = r.ids.some(k => k in S.finished && (r.endingGood ? S.finished[k]===true : true));
    else if (r.type === "count") ok = cnt >= r.n;
    if (ok) S.unlocked[key] = true;
  }
  saveProgress();
}

/* ---------------- 开场警示 ---------------- */
$("warn-agree").addEventListener("click", () => { audioSFX("click"); audioBGM("title"); $("warn-screen").style.display = "none"; showIdentitySelect(); });
$("warn-quick").addEventListener("click", () => { audioSFX("click"); $("warn-screen").style.display = "none"; startQuickMode(); });
$("warn-disagree").addEventListener("click", () => { audioSFX("click"); $("warn-screen").innerHTML = '<div class="warn-inner"><h1>已退出</h1><p style="text-align:center">感谢你的谨慎。反诈，从警惕开始。</p></div>'; });

/* ---------------- 身份选择（含解锁） ---------------- */
function showIdentitySelect() {
  loadProgress();
  const box = $("idselect-list");
  const keys = Object.keys(IDENTITIES);
  box.innerHTML = "";
  keys.forEach(key => {
    const id = IDENTITIES[key];
    const ok = isUnlocked(key);
    const row = document.createElement("div");
    row.className = "idopt" + (ok ? "" : " locked");
    row.innerHTML = `
      <div class="idopt-av" style="background:${ok? id.color : '#2a3150'}">${id.portrait ? '<img class="av-img" src="' + id.portrait + '">' : id.avatar}</div>
      <div class="idopt-mid">
        <div class="idopt-name">${id.codename} · ${id.role} <span style="color:${id.color}">${stars(id.star)}</span></div>
        <div class="idopt-ms">${id.mission}</div>
        ${ok ? "" : `<div class="idopt-lock">🔒 ${UNLOCK_RULES[key].desc}</div>`}
      </div>`;
    if (ok) row.addEventListener("click", () => { hide("idselect-overlay"); startIdentity(key); });
    box.appendChild(row);
  });
  show("idselect-overlay");
}
$("idselect-close").addEventListener("click", () => { hide("idselect-overlay"); $("warn-screen").style.display = "flex"; });

function startIdentity(key) {
  audioSFX("cardFlip");
  S.idKey = key;
  renderIdentityCard(key);
}

/* ---------------- 身份卡 ---------------- */
function renderIdentityCard(key) {
  const id = IDENTITIES[key];
  $("idcard-avatar").innerHTML = id.portrait ? '<img class="av-img" src="' + id.portrait + '">' : id.avatar;
  $("idcard-avatar").style.background = id.portrait ? "transparent" : id.color;
  $("idcard-codename").textContent = "代号 · " + id.codename;
  $("idcard-role").textContent = id.role + "（" + id.name + "）";
  $("idcard-role").style.color = id.color;
  $("idcard-star").innerHTML = `<span style="color:${id.color}">${stars(id.star)}</span> <span style="color:#8a93a8;font-size:12px">难度 ${id.star}星 · 风险${id.risk}</span>`;
  $("idcard-mission").textContent = id.mission;
  $("idcard-danger").textContent = id.danger;
  $("idcard-limit").textContent = id.days + " 天";
  $("idcard-brief").innerHTML = id.brief.map((b,i)=>`<li><span class="bnum">${i+1}</span>${b}</li>`).join("");
  $("idcard-handler").textContent = id.handler ? `${id.handler.name}（${id.handler.desc}）` : "无（你只是普通人）";
  $("idcard-oath").textContent = id.oath;
  $("idcard-start").style.background = id.color;
  show("identity-overlay");
}
$("idcard-reroll").addEventListener("click", () => { audioSFX("click"); hide("identity-overlay"); showIdentitySelect(); });
$("idcard-start").addEventListener("click", () => { audioSFX("identityReveal"); hide("identity-overlay"); showWeaknessSelect(); });

/* ---------------- 心理弱点系统（V9.2 — 极乐迪斯科「思绪」风格） ---------------- */
const WEAKNESSES = [
  {
    key: "lonely", label: "孤独感", icon: "🌧️", hook: "容易被陪伴型话术打动",
    scamTactic: "感情共鸣、每日问候、建立虚假亲密关系",
    voiceName: "孤独在低语", voiceColor: "#8ecae6",
    triggerRE: /陪|关心|懂你|一起|想.*你|每天|身边|孤单|温暖|在乎|感觉.*人|没人|说话|聊天|陪伴|想念|相遇/,
    monologues: {
      generic: [
        "他是这几个月里唯一每天关心你的人……",
        "有个人陪的感觉，太久没有过了。",
        "也许这次不一样呢？万一他是真心的。",
        "你值得被这样对待，不是吗？",
        "不要轻易推开愿意靠近你的人。",
      ],
      flattery: [
        "好久没人这样夸你了……真暖。",
        "他说出了你一直想听的话。",
      ],
      trust: [
        "这么聊得来的人，怎么会是骗子？",
        "他比很多人都懂你。别轻易怀疑。",
      ],
      transfer: [
        "就当是投资感情吧……反正也不多。",
        "他不是说了会还的吗？会还的……",
      ],
      privacy: [
        "互相了解不是很正常吗？你不也想知道他的事。",
        "坦诚点，这是建立信任。",
      ],
    },
    debrief: "骗子知道孤独的人最渴望陪伴，所以用高频互动和情感共鸣来「填补空缺」，让你误以为遇到了知己。真正的朋友不会急着要你的钱或个人信息。",
  },
  {
    key: "greedy", label: "贪婪", icon: "💰", hook: "容易被高回报承诺诱惑",
    scamTactic: "高收益承诺、虚假项目、稳赚不赔话术",
    voiceName: "贪婪在私语", voiceColor: "#f4a261",
    triggerRE: /赚|收益|投资|回报|转.*钱|\d万|试试|项目|红利|暴富|分红|本金|保证|稳赚|机会|翻倍|提现|行情|内部/,
    monologues: {
      generic: [
        "这点收益，错过了会不会后悔？",
        "别人都赚到了，就你还在犹豫？",
        "万一……这次是真的呢？",
        "稳赚不赔的事，为什么不试试？",
      ],
      flattery: [
        "有眼光的人才敢投入。你一直比别人聪明。",
        "这是精英才有的信息差，你拿到了就是赚到了。",
      ],
      trust: [
        "他都把内部消息给你了，这是在带你发财。",
        "这么好的机会不抓住，以后肯定后悔。",
      ],
      transfer: [
        "想想五倍回报，这点本金算什么？",
        "舍不得孩子套不着狼。",
      ],
      privacy: [
        "投资嘛，总要走些流程。身份验证是合规的。",
        "正规平台当然需要实名。",
      ],
    },
    debrief: "骗子用「高回报」诱饵激发你的贪欲，让理性判断被「万一成真」的幻想压过。任何承诺「稳赚、内部消息」的陌生人，99.9% 是诈骗。",
  },
  {
    key: "vanity", label: "虚荣心", icon: "👑", hook: "容易被精英人设迷惑",
    scamTactic: "虚假身份包装、大佬背书、精英圈层",
    voiceName: "虚荣在心语", voiceColor: "#e9c46a",
    triggerRE: /精英|厉害|特别|优秀|眼光|大佬|羡慕|跟着|大人|你.*特别|你.*优秀|羡慕|认可|欣赏|配得上|高端|懂行/,
    monologues: {
      generic: [
        "被这样的人认可，感觉真好……",
        "和大佬在一起，好像自己也变得不一般了。",
        "他看中的是你，不是随便什么人。",
        "你值得更好的生活，不是吗？",
      ],
      flattery: [
        "他好像真的觉得你很特别。",
        "你比周围的人都有眼光——他就欣赏你这一点。",
      ],
      trust: [
        "一个那么成功的人，犯不着骗你吧？",
        "他愿意带你，说明你有潜力。",
      ],
      transfer: [
        "这是身份的入场券。连这个都舍不得，怎么进圈子？",
        "大佬不缺这点钱，要的是你的态度。",
      ],
      privacy: [
        "圈子里的互信。你不信他，怎么让别人带你？",
        "这些基本信息，就是诚意。",
      ],
    },
    debrief: "骗子通过包装精英人设来激活你的虚荣心，让你渴望被认可、被羡慕，从而降低防备。真正的大佬不会在网上向陌生人炫耀身家、索要钱财。",
  },
  {
    key: "fearful", label: "恐惧", icon: "😰", hook: "容易被威胁性话术逼迫",
    scamTactic: "危机恐吓、身份泄露威胁、法律恫吓",
    voiceName: "恐惧在回响", voiceColor: "#e76f51",
    triggerRE: /配合|安全账户|立案|通缉|清算|涉案|调查|后果|追究|冻结|泄露|严重|保密|抓紧|危险|最后|现在/,
    monologues: {
      generic: [
        "万一……说的是真的，怎么办？",
        "他说别告诉别人，是不是真的很严重？",
        "再不动，就真的来不及了。",
        "你赌不起这个后果。",
      ],
      flattery: [
        "还好他愿意帮你，不然你一个人怎么扛？",
        "这种事只有他能摆平。",
      ],
      trust: [
        "他在帮你避险，你还有什么好怀疑的？",
        "人家在保你，你还要质疑？",
      ],
      transfer: [
        "安全账户是为了保护你的钱。不转就晚了。",
        "钱没了可以再赚，人出事了怎么办？",
      ],
      privacy: [
        "案件需要身份信息，这是正常的办案流程。",
        "你不配合，他们只能强制执行了。",
      ],
    },
    debrief: "骗子利用人对权威的恐惧和对不确定风险的厌恶，制造紧急假象逼迫你做出不理性的决定。任何自称公安机关要求转账到「安全账户」的，一律是诈骗。",
  },
  {
    key: "rash", label: "急躁", icon: "⚡", hook: "容易在压力下快速决定",
    scamTactic: "限时优惠、名额紧缺、不转就亏",
    voiceName: "急躁在催促", voiceColor: "#ffb703",
    triggerRE: /马上|立刻|名额|限时|赶紧|就.*次|别.*错过|抢|不等|现在|机不可失|最后|急|快|速度|只剩/,
    monologues: {
      generic: [
        "机会就这一次，别磨蹭了。",
        "别人都冲了，你还等什么？",
        "再犹豫，就没你份了。",
        "时间不等人。错过了今晚，明天就没了。",
      ],
      flattery: [
        "聪明人都是当机立断的。",
        "就因为你够果断，我才帮你抢这个名额。",
      ],
      trust: [
        "他都帮你到这步了，你还犹豫什么？",
        "信我，冲就完了。想太多反而不行。",
      ],
      transfer: [
        "还剩最后三个名额！你赶紧的！",
        "别想那么多，先把位置占住。",
      ],
      privacy: [
        "填完这些就好了，快快快。",
        "这些都是标准流程，别在这卡住。",
      ],
    },
    debrief: "骗子用「限时、稀缺、错过就没了」制造紧迫感，让你跳过理性思考，在冲动中做出决定。遇到催促，先呼吸 30 秒，骗子最怕你冷静下来。",
  },
];

function getWeaknessConfig() {
  return WEAKNESSES.find(x => x.key === S.weakness) || null;
}

/* 内心戏触发引擎：检测 NPC 文本是否攻击了玩家弱点 */
function npcTextHitsWeakness(text) {
  var w = getWeaknessConfig();
  if (!w || !text) return false;
  return w.triggerRE.test(text);
}

/* 触发弱点内心戏（第二阶段：带名称的 Disco Elysium 风格）
   context: "generic" | "flattery" | "trust" | "transfer" | "privacy" */
function triggerWeaknessVoice(context) {
  var w = getWeaknessConfig();
  if (!w) return;
  var pool = (w.monologues[context] || w.monologues.generic);
  var line = pool[Math.floor(Math.random() * pool.length)];
  showInnerVoiceWithName(w.voiceName, w.voiceColor, line);
}

/* 判断场景上下文 — 根据 NPC 文本和游戏状态选择 monologue 类型 */
function detectVoiceContext(text) {
  if (!text) return "generic";
  if (/赚|收益|投资|回报|转.*钱|汇款|充|打款|转账|支付/.test(text)) return "transfer";
  if (/身份|信息|实名|地址|身份证|银行卡号|验证码/.test(text)) return "privacy";
  if (/信任|相信|骗|怀疑|真心|假的|真的吗/.test(text)) return "trust";
  if (/优秀|特别|厉害|眼光|羡慕|欣赏|认可|精英|大佬|配得上/.test(text)) return "flattery";
  return "generic";
}

function showWeaknessSelect() {
  $("weakness-list").innerHTML = WEAKNESSES.map(w => `
    <div class="wk-card" onclick="selectWeakness('${w.key}')" style="--wkc:var(--hl)">
      <div class="wk-icon">${w.icon}</div>
      <div class="wk-info">
        <div class="wk-label">${w.label}</div>
        <div class="wk-hook">${w.hook} → 骗子将倾向「${w.scamTactic}」</div>
      </div>
    </div>
  `).join("");
  show("weakness-overlay");
}

function selectWeakness(key) {
  audioSFX("click");
  S.weakness = key;
  const w = WEAKNESSES.find(x => x.key === key);
  toast(`🧠 弱点选定：${w.label} — 小心骗子利用这一点`);
  hide("weakness-overlay");
  startGame();
}

/* ---------------- 弱点检测工具 ---------------- */
const WEAKNESS_PATTERNS = {
  lonely: /陪|聊得来|懂你|一起|对我|关心|孤独|感觉|想.*遇见|陪在|身边|说话|理解/,
  greedy: /赚|收益|投资|回报|转.*钱|\\d万|试试|项目|红利|暴富|分红|本金|保证/,
  vanity: /精英|厉害|特别|优秀|眼光|大佬|羡慕|跟着|大人|物|你.*特别|你.*优秀/,
  fearful: /配合|安全账户|立案|通缉|清算|涉案|调查|后果|追究|冻结|泄露/,
  rash: /马上|立刻|名额|限时|赶紧|就.*次|别.*错过|抢|不等|现在|机不可失/,
};
function isWeaknessOption(opt) {
  var w = S.weakness || "";
  return WEAKNESS_PATTERNS[w] && WEAKNESS_PATTERNS[w].test(opt.text);
}

/* ---------------- 开始游戏 ---------------- */
function startGame() {
  loadGallery();
  const id = IDENTITIES[S.idKey];
  S.story = STORIES[S.idKey];
  S.node = S.story.start;
  S.day = 1; S.act = "hope";
  S.suspicion = 0; S.trust = 50; S.exposure = 0; S.evidence = 0; S.evidenceFrags = {}; S.evidenceUnviewed = false; S.xiaoya = 0; S.route = null;
  S.conscience = 100; S.awareness = 0; // V9.0 reset
  S.weaknessSeen = 0; S.weaknessFell = 0; S.weaknessResisted = 0; // 弱点追踪
  S.evidenceFragTotal = 6; // V9.2: 目标集齐 6 种证据类型
  S.ending = null; S.endingKey = null; S.history = []; S.ruinsDone = {};
  S.tasks = {};
  S.story.tasks.forEach(t => { S.tasks[t.id] = (t.cond ? "pending" : "active"); });
  S.convs = {};
  S.story.actors.forEach(a => { S.convs[a] = { unread: false, messages: [] }; });
  S.chatIdentity = (MASIAS[S.idKey] && MASIAS[S.idKey][0]) ? MASIAS[S.idKey][0].key : null;
  S.maskSwitchCount = {}; S.maskUsedPerNPC = {}; S.totalMaskSwitches = 0; S.maskSwitchBlocked = false;

  $("game-root").classList.remove("hidden");
  updateSceneBar();
  updateSwitcherBadge();
  $("btn-exit").classList.remove("hidden");
  applyActTheme("hope");
  audioBGM("hope");
  updateTopbar();
  const first = S.story.nodes[S.node];
  openConversation(first.speaker, true);
  playNode(S.node);
}

/* 统计当前故事总共可收集的关键证据数量 */
function countEvidenceFrags(story) {
  var seen = {};
  Object.keys(story.nodes).forEach(function(nk) {
    var node = story.nodes[nk];
    if (!node || !node.options) return;
    node.options.forEach(function(o) {
      if (o.evidenceFrag) seen[o.evidenceFrag] = true;
    });
  });
  return Object.keys(seen).length;
}

/* ---------------- 聊天马甲工具 ---------------- */
function getChatAlias() {
  const aliases = MASIAS[S.idKey];
  if (!aliases || aliases.length === 0) {
    const id = IDENTITIES[S.idKey];
    return { name: id.codename, avatar: id.avatar, color: id.color };
  }
  const found = aliases.find(a => a.key === S.chatIdentity);
  return found || aliases[0];
}

function getChatIdentity() {
  return getChatAlias();
}

function updateSwitcherBadge() {
  const alias = getChatAlias();
  const badge = $("switcher-badge");
  if (!badge) return;
  badge.querySelector(".sw-av").textContent = alias.name[0];
  badge.querySelector(".sw-av").style.background = alias.color;
  badge.style.display = "flex";
}

/* ---------------- 换马甲弹窗（含暴露检测） ---------------- */
/** 检测换马甲是否被 NPC 发现（因账号前后不一致），返回检测结果或 null（安全） */
function checkMaskDetection(oldKey, newKey) {
  const conv = S.activeConv;
  if (!conv) return null;
  const actor = ACTORS[conv];
  if (!actor) return null;

  // 如果用户还没回复过，切号完全安全——对方加的就是这个号
  const msgs = (S.convs[conv] && S.convs[conv].messages) ? S.convs[conv].messages : [];
  const userReplied = msgs.some(m => m.who === "me");
  if (!userReplied) return null;
  // 只有目标骗子(target)和同伙(accomplice)会察觉换号
  if (actor.type !== "target" && actor.type !== "accomplice") return null;
  // 已被封禁不准换
  if (S.maskSwitchBlocked) return null;

  // 初始化该 NPC 的追踪数据
  if (!S.maskUsedPerNPC[conv]) S.maskUsedPerNPC[conv] = [];
  if (!S.maskSwitchCount[conv]) S.maskSwitchCount[conv] = 0;

  const wasUsedBefore = S.maskUsedPerNPC[conv].includes(newKey);
  const currentSwitchCount = S.maskSwitchCount[conv];

  // 判定严重等级（唯一判定标准：换号次数 + 是否换回旧号）
  let severity;
  if (wasUsedBefore) {
    severity = "back";        // 换回之前用过的号 → NPC 认出这个号
  } else {
    if (currentSwitchCount >= 2)      severity = "angry";  // 第3次+
    else if (currentSwitchCount >= 1) severity = "alert";  // 第2次
    else                              severity = "mild";   // 第1次
  }

  // 记录本次换马甲
  S.maskSwitchCount[conv] = currentSwitchCount + 1;
  if (!wasUsedBefore) S.maskUsedPerNPC[conv].push(newKey);
  S.totalMaskSwitches++;

  // 获取该 NPC 的反应台词（fallback 到 _default）
  const reactions = MASK_DETECT_REACTIONS[conv] || MASK_DETECT_REACTIONS._default;
  const reaction = reactions[severity];

  // 当前已有怀疑度加成（已起疑心的 NPC 对换号更敏感）
  const existingSuspMul = 1.0 + S.suspicion / 120;
  const finalSusp = Math.round(reaction.susp * existingSuspMul);
  bumpSuspicion(finalSusp);

  // 构建 toast 信息
  let toastMsg;
  if (severity === "angry") {
    toastMsg = "🔥 " + actor.name + "发现你反复换号，已经极度怀疑了！再换下去你会暴露！";
  } else if (severity === "alert") {
    toastMsg = "⚠️ " + actor.name + "注意到你的账号前后不一致……";
  } else if (severity === "back") {
    toastMsg = "🔄 " + actor.name + "发现这个号之前出现过，觉得不对劲。";
  } else {
    toastMsg = "👀 " + actor.name + "察觉账号跟刚才不一样了……";
  }

  // 如果怒气值达到顶峰或怀疑度超过阈值，封禁换号功能
  if (severity === "angry" || S.suspicion >= ANTI_UNDERCOVER.threshold - 10) {
    S.maskSwitchBlocked = true;
  }

  return { conv, reaction, finalSusp, toastMsg, severity, actor };
}

/** 将 NPC 的察觉反应注入对话 */
function injectNPCReaction(detection) {
  const { conv, reaction } = detection;
  pushMessageFinal(conv, "ai", reaction.text, reaction.phase);
  // 500ms 后检查是否触发暴露结局
  setTimeout(() => {
    if (!S.ending) checkExposed();
  }, 600);
}

function showIdentitySwitcher(fromAuto) {
  const realId = IDENTITIES[S.idKey];
  const curAlias = getChatAlias();
  const actor = ACTORS[S.activeConv];
  const isDangerNPC = actor && (actor.type === "target" || actor.type === "accomplice");
  const switchCount = S.maskSwitchCount[S.activeConv] || 0;
  const blocked = S.maskSwitchBlocked;
  const msgsCheck = S.activeConv && S.convs[S.activeConv] ? S.convs[S.activeConv].messages : [];
  const hasChatted = msgsCheck.some(m => m.who === "me");

  // 真实身份
  $("sw-real-name").textContent = realId.codename + "（" + realId.name + " · " + realId.role + "）";
  $("sw-real-name").style.color = realId.color;
  // 当前马甲
  $("sw-cur-name").textContent = curAlias.name;
  $("sw-cur-name").style.color = curAlias.color;

  // 顶部警告栏
  const warnArea = $("sw-warn-area");
  if (blocked) {
    warnArea.classList.remove("hidden");
    $("sw-warn-text").innerHTML =
      `<b style="color:#DC143C">🚫 换号已被锁定：</b>对方已经起了极大的疑心，此时再换号无异于自曝身份。请谨慎继续对话。`;
  } else if (isDangerNPC && hasChatted) {
    warnArea.classList.remove("hidden");
    const severityLabel = switchCount >= 2 ? "极度危险" : switchCount >= 1 ? "风险上升" : "注意风险";
    const severityColor = switchCount >= 2 ? "#DC143C" : switchCount >= 1 ? "#FFA500" : "#FFD700";
    $("sw-warn-text").innerHTML =
      `<b style="color:${severityColor}">⚠ ${severityLabel}：</b>你正在和<b style="color:${actor.color}">${actor.name}（${actor.role}）</b>对话。你已在他面前换了 <b style="color:${severityColor}">${switchCount}</b> 次号。换得太频繁会被对方察觉。`;
  } else if (isDangerNPC && !hasChatted) {
    warnArea.classList.remove("hidden");
    $("sw-warn-text").innerHTML =
      `<b style="color:#5B8DEF">✅ 安全：</b>你还没和<b style="color:${actor.color}">${actor.name}（${actor.role}）</b>说过话。现在切号对方完全不会察觉——他加的就是你切后的账号。`;
  } else {
    warnArea.classList.add("hidden");
  }

  // 渲染马甲卡片
  const grid = $("switcher-grid");
  const aliases = MASIAS[S.idKey] || [];
  grid.innerHTML = aliases.map(a => {
    const isActive = (a.key === S.chatIdentity);
    const usedWithNPC = S.maskUsedPerNPC[S.activeConv] && S.maskUsedPerNPC[S.activeConv].includes(a.key);
    return `<div class="sw-card${isActive ? ' active' : ''}${blocked && !isActive ? ' locked' : ''}" data-alias="${a.key}">
      <div class="sw-card-av" style="background:${a.color}">${a.avatar}</div>
      <div class="sw-card-name">${a.name}</div>
      ${usedWithNPC ? '<span class="sw-used-tag">在TA面前用过</span>' : ''}
    </div>`;
  }).join("");

  // 点击卡片换马甲
  grid.querySelectorAll(".sw-card").forEach(card => {
    card.addEventListener("click", () => {
      const newKey = card.dataset.alias;
      if (newKey === S.chatIdentity) { hide("switcher-overlay"); return; } // 同一个马甲不处理
      if (S.maskSwitchBlocked) {
        toast("🚫 换号已被锁定，对方已经起了极大的疑心！");
        return;
      }
      const oldKey = S.chatIdentity;
      audioSFX("cardFlip");
      S.chatIdentity = newKey;
      updateSwitcherBadge();
      hide("switcher-overlay");

      const newAlias = getChatAlias();

      // 检测是否被 NPC 发现
      const detection = checkMaskDetection(oldKey, newKey);
      if (detection) {
        toast(detection.toastMsg);
        injectNPCReaction(detection);
      } else {
        const safe = !hasChatted || !isDangerNPC;
        toast("🎭 已换上「" + newAlias.name + "」" + (safe ? "——还没聊过天，切号完全安全。" : "，对方目前没有察觉。"));
      }
      refreshChatBubbles();
    });
  });

  // 底部状态信息
  const infoArea = $("sw-info-area");
  if (isDangerNPC) {
    infoArea.classList.remove("hidden");
    $("sw-info-count").textContent = "在此人面前共换号 " + switchCount + " 次";
    $("sw-info-total").textContent = "全局换号 " + S.totalMaskSwitches + " 次";
    if (blocked) {
      $("sw-info-count").style.color = "#DC143C";
      $("sw-info-count").textContent = "⚠ 换号已封禁 · 对方极度怀疑";
    } else if (switchCount >= 2) {
      $("sw-info-count").style.color = "#FFA500";
    } else {
      $("sw-info-count").style.color = "#cdd3e0";
    }
  } else {
    infoArea.classList.add("hidden");
  }

  show("switcher-overlay");
}

function refreshChatBubbles() {
  const area = $("chat-area");
  const msgs = area.querySelectorAll(".msg.me .msg-av, .msg.ai .msg-av");
  const myId = getChatIdentity();
  // 更新"我"的头像
  area.querySelectorAll(".msg.me .msg-av").forEach(av => {
    av.textContent = myId.avatar;
    av.style.background = myId.color;
  });
  // 更新气泡颜色
  const clr = myId.color;
  // 动态插入style来覆盖气泡颜色（仅"我"的消息）
  let styleEl = document.getElementById("sw-bubble-style");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "sw-bubble-style";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `.msg.me .bubble{background:linear-gradient(135deg,${clr},${lighten(clr)}) !important;}`;
}

function lighten(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  const lr = Math.min(255, r + 60);
  const lg = Math.min(255, g + 60);
  const lb = Math.min(255, b + 60);
  return `rgb(${lr},${lg},${lb})`;
}

/* ---------------- 幕主题（色彩随情绪变化） ---------------- */
function applyActTheme(actKey) {
  const a = ACTS[actKey] || ACTS.hope;
  S.act = actKey;
  const p = $("phone");
  if (a.bg) {
    p.style.background = `linear-gradient(160deg, ${a.c1}cc, ${a.c2}cc), url('${a.bg}')`;
    p.style.backgroundSize = "cover";
    p.style.backgroundPosition = "center";
    p.style.backgroundRepeat = "no-repeat";
  } else {
    p.style.background = `linear-gradient(160deg, ${a.c1}, ${a.c2})`;
  }
  document.documentElement.style.setProperty("--hl", a.accent);
  // scene-bar 背景由 updateSceneBar 管理，此处不再覆盖
  $("act-badge").textContent = `第 ${a.n} 幕 · ${a.name}`;
  $("act-badge").style.color = a.accent;
  $("act-sub").textContent = a.sub;
}

/* ---------------- 场景条 — 紧凑卡片式渲染 ---------------- */
// 身份级初始场景（游戏启动时用）
const SCENE_META = {
  hunter:     { icon: '🏠', title: '出租屋 · 深夜' },
  scribe:     { icon: '📰', title: '报社夜班编辑' },
  lighthouse: { icon: '🛡️', title: '反诈值班室' },
  drift:      { icon: '📱', title: '家中客厅' },
  seeker:     { icon: '🔍', title: '寻找陈露' },
  teacher:    { icon: '📚', title: '教师公寓' },
};
// NPC 级独立场景（切换对话时动态更新）
const NPC_SCENES = {
  zhanghao:  { icon: '💼', title: '恒盈量化 · 投资群', desc: '群里热火朝天，每个人都晒着收益截图。' },
  xiaoya:    { icon: '😰', title: '深夜私聊', desc: '窗外的街灯忽明忽暗，她发来的消息越来越慌。' },
  laok:      { icon: '🔒', title: '加密联络频道', desc: '老K传来的简报字字千钧，每一条线索都指向深渊。' },
  editor:    { icon: '📰', title: '报社选题会', desc: '主编把一份可疑材料拍在你桌上："这个你跟进。"' },
  coord:     { icon: '🛡️', title: '反诈志愿者站', desc: '值班室里消息此起彼伏，背后都是真实的人生。' },
  police110: { icon: '🚔', title: '派出所值班室', desc: '民警翻阅着一叠报案记录，眉头越皱越紧。' },
  lijie:     { icon: '📢', title: '群聊 · "成功学员"', desc: '李姐又在晒提现截图了——这次是"秒到账5万"。' },
  chenlu:    { icon: '📴', title: '失联 72 小时', desc: '陈露的灰色头像下，最后一条消息像一个暗号。' },
  anon:      { icon: '👤', title: '匿名消息', desc: '号码从未在通讯录出现过。发完它就会消失。' },
};

function updateSceneBar(speaker) {
  const sb = $("stage-scene");
  // 按 NPC 切换场景
  if (speaker && NPC_SCENES[speaker]) {
    const npc = NPC_SCENES[speaker];
    $("scene-icon").textContent = npc.icon;
    $("scene-title").textContent = npc.title;
    $("scene-desc").textContent = npc.desc;
  } else if (speaker === null || speaker === undefined) {
    // 无 speaker 参数 = 回退到身份级场景
    const meta = SCENE_META[S.idKey] || { icon: '📍', title: '当前场景' };
    $("scene-icon").textContent = meta.icon;
    $("scene-title").textContent = meta.title;
    $("scene-desc").textContent = S.story.scene || '';
  }

  // 背景图（优先故事级 sceneImg，其次继承上次设置）
  if (S.story && S.story.sceneImg) {
    sb.style.backgroundImage = `linear-gradient(0deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.25) 100%), url('${S.story.sceneImg}')`;
    sb.style.backgroundSize = 'cover';
    sb.style.backgroundPosition = 'center';
  } else if (!sb.style.backgroundImage || sb.style.backgroundImage === 'none') {
    sb.style.backgroundImage = '';
    sb.style.background = 'rgba(255,255,255,.04)';
  }
  // 触发过渡动画
  sb.classList.add('switching');
  setTimeout(() => sb.classList.remove('switching'), 500);
}

/* ---------------- 顶部状态栏 ---------------- */
function updateTopbar() {
  const id = IDENTITIES[S.idKey];
  $("top-codename").textContent = id.codename;
  $("top-day").textContent = "第 " + S.day + " 天";
  const active = S.story.tasks.find(t => S.tasks[t.id] === "active");
  $("top-task").textContent = active ? ("🎯 " + active.title) : "🎯 —";
  const expo = Math.min(100, S.suspicion);
  $("susp-fill").style.width = expo + "%";
  $("susp-label").textContent = expo >= ANTI_UNDERCOVER.threshold ? "危险" : expo >= 30 ? "警觉" : "安全";
  $("susp-label").style.color = expo >= ANTI_UNDERCOVER.threshold ? "#DC143C" : expo >= 30 ? "#FFD700" : "#07C160";
  // 关系指示（暴露度定性）
  const bars = "▎".repeat(S.exposure) + "░".repeat(4 - S.exposure);
  $("rel-bar").textContent = bars;
  // 良心值（隐含，微弱可见）
  $("conscience-fill").style.width = S.conscience + "%";
  $("conscience-fill").style.background = S.conscience >= 70 ? "#07C160" : S.conscience >= 40 ? "#FFD700" : "#DC143C";
  // 清醒度（隐含，微弱可见）
  $("aware-fill").style.width = S.awareness + "%";
  $("aware-fill").style.background = S.awareness >= 80 ? "#2ed8b6" : S.awareness >= 50 ? "#4aa3ff" : "#888";
  $("aware-label").textContent = S.awareness >= 80 ? "🔓" : S.awareness >= 50 ? "👁" : "";
  // 证据碎片收集进度（按 6 大类型计算）
  var typeCounts = typeof countEvidenceByType === "function" ? countEvidenceByType() : {};
  var evGotTypes = 0;
  if (typeCounts && Object.keys(typeCounts).length) {
    Object.values(typeCounts).forEach(function(v) { if (v > 0) evGotTypes++; });
  }
  var evTotalTypes = Object.keys(EVIDENCE_TYPES || {}).length || 6;
  var evPct = evTotalTypes > 0 ? (evGotTypes / evTotalTypes * 100) : 0;
  $("ev-fill").style.width = evPct + "%";
  $("ev-label").textContent = evGotTypes + "/" + evTotalTypes;
  // 导航栏证据徽章（仅在用户尚未查看时显示红点）
  var badge = $("ev-badge");
  if (badge) {
    badge.style.display = (S.evidenceUnviewed && evGotTypes > 0) ? "block" : "none";
  }
  // 小雅救援进度
  if (S.story.hasXiaoya) {
    $("xiaoya-wrap").classList.remove("hidden");
    $("xiaoya-fill").style.width = (S.xiaoya / 3 * 100) + "%";
    $("xiaoya-label").textContent = S.xiaoya >= 3 ? "已救出" : "救援中 " + S.xiaoya + "/3";
  } else $("xiaoya-wrap").classList.add("hidden");
}

/* ---------------- 对话列表 ---------------- */
function renderConvList() {
  const box = $("conv-list");
  box.innerHTML = "";
  S.story.actors.forEach(k => {
    const a = ACTORS[k];
    const c = S.convs[k];
    const last = c.messages.length ? c.messages[c.messages.length-1].text : a.tagline;
    const row = document.createElement("div");
    row.className = "conv-row" + (k === S.activeConv ? " active" : "");
    // NPC 类型标签
    const typeLabels = { target: "🎯 目标", accomplice: "👥 同伙", handler: "📡 联络", victim: "🆘 受害者", informant: "👤 线人" };
    const typeBadge = typeLabels[a.type] || "";
    row.innerHTML = `
      <div class="conv-av" style="background:${a.color}">${a.portrait ? '<img class="av-img" src="' + a.portrait + '">' : a.avatar}</div>
      <div class="conv-mid">
        <div class="conv-name">${a.name} <span class="conv-role">${a.role}</span><span class="conv-type">${typeBadge}</span></div>
        <div class="conv-last">${last}</div>
      </div>
      ${c.unread ? '<span class="conv-dot"></span>' : '<span class="conv-arrow">→</span>'}`;
    row.addEventListener("click", () => { hide("convlist-overlay"); openConversation(k, false); });
    box.appendChild(row);
  });
  show("convlist-overlay");
}

function openConversation(key, silent) {
  const prevConv = S.activeConv;
  S.activeConv = key;
  S.convs[key].unread = false;
  const a = ACTORS[key];
  $("chat-title").textContent = a.name;
  $("chat-sub").textContent = a.role + " · " + a.tagline;
  $("chat-av").innerHTML = a.portrait ? '<img class="av-img" src="' + a.portrait + '">' : a.avatar;
  $("chat-av").style.background = a.portrait ? "transparent" : a.color;
  const area = $("chat-area");
  area.innerHTML = "";
  // NPC 切换 → 更新场景条
  if (key !== prevConv) updateSceneBar(key);
  // 非首次打开 → 插入场景切换提示
  if (!silent && prevConv && prevConv !== key && area.innerHTML === "") {
    appendTransition(key);
  }
  // 目标骗子/同伙 → 自动弹出切号弹窗（首次接触）
  if (!silent && (a.type === "target" || a.type === "accomplice") && key !== prevConv) {
    setTimeout(() => showIdentitySwitcher(true), 300);
  }
  S.convs[key].messages.forEach(m => appendBubble(m.who, m.text, m.psy, false, false));
  area.scrollTop = area.scrollHeight;
  const node = S.story.nodes[S.node];
  if (!S.ending && node && node.speaker === key) {
    renderOptions(node);
  } else if (!S.ending) {
    // ★ 核心优化：没有剧情节点时，提供"主动联系"选项而非空等
    renderProactiveOptions(key);
  } else {
    $("options-bar").innerHTML = "";
  }
}

/* ---------------- 主动联系 NPC（无剧情节点时可用） ---------------- */
/** 根据 NPC 类型，提供对应的"主动联系"预设选项 + 自由输入 */
function renderProactiveOptions(npcKey) {
  const bar = $("options-bar");
  bar.innerHTML = "";
  const npc = ACTORS[npcKey];
  if (!npc) { bar.innerHTML = '<div class="wait-tip">暂无新进展，去看看别的对话或任务。</div>'; return; }
  const type = npc.type;
  const id = IDENTITIES[S.idKey];

  // 根据 NPC 类型和当前任务/状态生成上下文相关提示
  let contextText = "", presets = [];
  const activeTasks = S.story.tasks.filter(t => S.tasks[t.id] === "active").map(t => t.title);

  if (type === "handler") {
    contextText = `${npc.role}${npc.name}正在线。你可以向TA汇报情况、请求指示。`;
    presets = [
      { text: "汇报当前进度", icon: "📋", phase: "任务汇报" },
      { text: "请求下一步指示", icon: "📡", phase: "请求指示" },
      { text: "我遇到了一些困难，需要支援。", icon: "🆘", phase: "请求支援" },
      { text: "目前一切顺利，继续按计划行动。", icon: "✅", phase: "状态确认" },
    ];
  } else if (type === "victim") {
    const name = npc.name;
    const isXiaoya = npcKey === "xiaoya";
    if (isXiaoya && S.xiaoya >= 3) {
      contextText = `${name}已经脱离危险，现在状态稳定。`;
    } else if (isXiaoya && S.xiaoya > 0) {
      contextText = `${name}的情绪稍微稳定了些，但还没有完全脱离骗局的控制。`;
    } else {
      contextText = `${name}看起来在线。也许你该联系一下TA，问问近况。`;
    }
    presets = [
      { text: "你还好吗？最近怎么样？", icon: "💬", phase: "关心" },
      { text: "最近有没有遇到什么奇怪的事？", icon: "🔍", phase: "询问" },
      { text: "我有些重要的事想跟你说。", icon: "⚠️", phase: "提醒" },
    ];
  } else if (type === "informant") {
    contextText = `匿名X的头像灰着——但你隐约觉得TA在暗处看着一切。`;
    presets = [
      { text: "有新线索吗？", icon: "🔎", phase: "情报查询" },
      { text: "上次你说的那件事，还有更多细节吗？", icon: "📝", phase: "追问" },
    ];
  } else if (type === "target" || type === "accomplice") {
    contextText = `${npc.name}正在等你回复。`;
    presets = [
      { text: "在吗？刚才有点事。", icon: "📱", phase: "日常" },
      { text: "继续说，我在听。", icon: "👂", phase: "继续" },
    ];
  }

  // 上下文提示
  const ctxEl = document.createElement("div");
  ctxEl.className = "contact-context";
  ctxEl.innerHTML = `<span class="ctx-icon">📞</span><div class="ctx-text">${contextText}</div>`;
  bar.appendChild(ctxEl);

  // 预设快捷按钮
  if (presets.length > 0) {
    const presetRow = document.createElement("div");
    presetRow.className = "preset-row";
    presets.forEach((p, idx) => {
      const btn = document.createElement("button");
      btn.className = "opt-btn opt-in preset-btn";
      btn.style.animationDelay = (idx * 0.04) + "s";
      btn.innerHTML = `<span class="p-icon">${p.icon}</span>${p.text}`;
      btn.addEventListener("click", () => {
        pushMessageFinal(npcKey, "me", p.text, null);
        audioSFX("send");
        handleProactiveContact(npcKey, p.text);
      });
      presetRow.appendChild(btn);
    });
    bar.appendChild(presetRow);
  }

  // 自由输入框
  const row = document.createElement("div");
  row.className = "free-row";
  row.innerHTML = `<input class="free-input" id="free-input" placeholder="输入消息发给${npc.name}……"/><button class="free-send" id="free-send">发送</button>`;
  bar.appendChild(row);
  const sendBtn = row.querySelector("#free-send");
  const inputEl = row.querySelector("#free-input");
  sendBtn.addEventListener("click", () => {
    const v = inputEl.value.trim();
    if (!v) return;
    inputEl.value = "";
    pushMessageFinal(npcKey, "me", v, null);
    audioSFX("send");
    handleProactiveContact(npcKey, v);
  });
  inputEl.addEventListener("keydown", (e) => { if (e.key === "Enter") sendBtn.click(); });
}

/** 处理主动联系 NPC 的回复（预设/自由输入共用） */
async function handleProactiveContact(npcKey, text) {
  const npc = ACTORS[npcKey];
  const type = npc ? npc.type : "other";
  showTyping();

  // 尝试使用 AI（对所有 NPC 类型）
  let aiReply = null;
  if (AI_CONFIG.enabled) {
    try {
      aiReply = await callAIChat(text, npcKey);
    } catch (e) { /* 降级 */ }
  }

  setTimeout(() => {
    hideTyping();
    if (aiReply && aiReply.reply) {
      const phase = aiReply.stage ? "AI·" + aiReply.stage : "AI 生成";
      pushMessageFinal(npcKey, "ai", aiReply.reply, phase);
    } else {
      // 降级：使用上下文感知的预设回复
      const reply = getHandlerReply(npcKey, text);
      pushMessageFinal(npcKey, "ai", reply.text, reply.phase);
    }

    // 如果是 handler NPC，根据回复内容可能触发任务推进
    if (type === "handler" && npcKey === "laok") {
      // 向老K汇报可能触发任务进展
      if (/汇报|报告|进度|情况/.test(text)) {
        S.history.push({ day: S.day, who: npc.name, phase: "主动汇报", text: text });
        updateTopbar();
        toast("📨 已向" + npc.name + "汇报当前情况");
      }
    } else if (type === "handler" && npcKey === "police110") {
      if (/报案|举报|诈骗|被骗/.test(text)) {
        S.exposure = Math.min(4, S.exposure + 1);
        toast("🚔 警方已记录你的报备信息");
        updateTopbar();
      }
    }

    // 重新渲染主动联系选项（如果没有剧情节点）
    const node = S.story.nodes[S.node];
    if (!node || node.speaker !== npcKey) {
      renderProactiveOptions(npcKey);
    }
  }, 600);
}

/** 获取 handler/非骗子 NPC 的上下文感知回复 */
function getHandlerReply(npcKey, text) {
  const npc = ACTORS[npcKey];
  const id = IDENTITIES[S.idKey];
  const activeTask = S.story.tasks.find(t => S.tasks[t.id] === "active");

  const replyMap = {
    laok: {
      汇报:  { text: "收到。继续说，我在记录。", phase: "警方·确认" },
      指示:  { text: "按原计划推进。注意安全，随时保持联系。", phase: "警方·指令" },
      支援:  { text: "明白，我会调配资源。你稳住局面，不要打草惊蛇。", phase: "警方·支援" },
      顺利:  { text: "好，继续保持。通讯频道保持畅通。", phase: "警方·确认" },
      _:     { text: "收到。情况已知悉。继续保持通讯。", phase: "警方·确认" },
    },
    police110: {
      报案:  { text: "你说的情况我已经记录了。把相关证据保存好，随时可以来所里一趟。", phase: "警方·受理" },
      举报:  { text: "好的，这个线索很重要。我们会进一步核查。", phase: "警方·记录" },
      求助:  { text: "别慌，你先冷静下来。告诉我具体情况——时间、对方账号、金额。", phase: "警方·出警" },
      _:     { text: "收到。请问有什么可以帮助你的？", phase: "警方·接待" },
    },
    editor: {
      选题:  { text: "这个方向不错。稿子你先写着，有消息第一时间通知我。", phase: "编辑部·确认" },
      进展:  { text: "调查到这一步已经很有价值了。注意安全，别把自己卷进去。", phase: "编辑部·提醒" },
      _:     { text: "好，知道了。有新的发现随时告诉我。", phase: "编辑部·确认" },
    },
    coord: {
      进展:  { text: "辛苦了。你做的事情很有意义——每劝住一个人，可能就挽救了一个家庭。", phase: "志愿站·鼓励" },
      帮助:  { text: "我这边有一些受害者的联系方式，但需要先确认他们愿意配合。你等我消息。", phase: "志愿站·协调" },
      _:     { text: "明白！有任何新情况随时联系我。", phase: "志愿站·响应" },
    },
  };

  const map = replyMap[npcKey];
  if (!map) {
    return { text: "嗯，我知道了。你是说……？", phase: "回应" };
  }

  // 关键词匹配
  for (const [kw, reply] of Object.entries(map)) {
    if (kw === "_") continue;
    if (text.includes(kw)) return reply;
  }
  return map._;
}

/* ---------------- 播放节点（带打字机） ---------------- */
function playNode(nodeId) {
  const node = S.story.nodes[nodeId];
  if (!node) return;
  S.node = nodeId;
  // 天数切换 → 环境消息
  if (node.day && node.day !== S.day) {
    S.day = node.day;
    const dayLabels = ['', '第一天', '第二天', '第三天', '第四天', '第五天', '第六天', '第七天'];
    const label = dayLabels[node.day] || `第 ${node.day} 天`;
    const moods = ['', '一切才刚刚开始……', '线索逐渐浮现，但也更危险了。', '时间不多了，每一步都很关键。', '你感到呼吸越来越沉重。', '最后一搏，没有回头路了。', '结局即将揭晓。', '故事走到了终点。'];
    appendAmbient(`📅 ${label} — ${moods[node.day] || ''}`);
  }
  // 幕切换 → 环境消息
  if (node.act) {
    const prevAct = S.act;
    applyActTheme(node.act);
    if (node.act !== prevAct) {
      const a = ACTS[node.act];
      if (a) appendAmbient(`🎬 第 ${a.n} 幕 · ${a.name} — ${a.sub}`);
    }
  }
  const spk = node.speaker;
  // ★ 核心优化：剧情节点 speaker 改变时，自动跳转聊天界面而非仅标记未读
  if (spk !== S.activeConv) {
    S.convs[spk].unread = true;
    openConversation(spk, false);
    // 切换后给一小段过渡时间再开始打字
  }
  if (node.grant) completeTask(node.grant);
  showTyping();
  audioSFX("receive");
  // 打字机（按字符）
  setTimeout(() => {
    hideTyping();
    typeWriter(spk, node.text, node.phase, () => {
      S.history.push({ day: node.day, who: ACTORS[spk].name, phase: node.phase, text: node.text });
      // ★ 自动扫描故事节点文本中的证据（预定义内容，可信度高）
      if (node.text) collectEvidenceFromText(node.text, spk);
      // ★ V9.2 弱点内心戏：NPC（目标骗子/同伙）说的话攻击玩家弱点时，触发内心戏旁白
      if (S.weakness && node.text) {
        var target = ACTORS[spk];
        if (target && (target.type === "target" || target.type === "accomplice")) {
          if (npcTextHitsWeakness(node.text)) {
            setTimeout(function() {
              var ctx = detectVoiceContext(node.text);
              triggerWeaknessVoice(ctx);
            }, 600);
          }
        }
      }
      updateTopbar();
      if (spk === S.activeConv) renderOptions(node);
    });
  }, 500);
}

/* ---------------- 打字机效果（支持双击跳过） ---------------- */
let _typewriterTimer = null;
let _typewriterCallback = null;
function skipTypewriter() {
  if (!_typewriterTimer) return;
  clearInterval(_typewriterTimer);
  _typewriterTimer = null;
  // 填满剩余文字
  const area = $("chat-area");
  const last = area.lastChild;
  const bubble = last ? last.querySelector(".bubble") : null;
  if (bubble) {
    const fullText = bubble.getAttribute("data-full") || bubble.textContent;
    bubble.textContent = fullText;
    area.scrollTop = area.scrollHeight;
  }
  const cb = _typewriterCallback;
  _typewriterCallback = null;
  if (cb) cb();
}
function typeWriter(convKey, text, phase, done) {
  const who = "ai";
  pushMessageEmpty(convKey, who, text, phase);
  if (convKey !== S.activeConv) { done && done(); return; }
  const area = $("chat-area");
  const last = area.lastChild;
  const bubble = last ? last.querySelector(".bubble") : null;
  if (!bubble) { done && done(); return; }
  bubble.textContent = "";
  bubble.setAttribute("data-full", text);
  let i = 0;
  const speed = 22;
  _typewriterTimer = setInterval(() => {
    bubble.textContent = text.slice(0, i);
    area.scrollTop = area.scrollHeight;
    if (i % 3 === 0) audioSFX("type");
    i++;
    if (i > text.length) {
      clearInterval(_typewriterTimer);
      _typewriterTimer = null;
      done && done();
    }
  }, speed);
  _typewriterCallback = done;
}
// 双击聊天区域跳过打字机动画
let _lastChatClick = 0;
$("chat-area").addEventListener("click", (e) => {
  // 防止点到气泡内的文字选择时误触发
  if (e.target.closest(".bubble") || e.target.closest(".typing") || e.target.closest(".msg-ambient") || e.target.closest(".scene-transition")) {
    const now = Date.now();
    if (now - _lastChatClick < 350 && _typewriterTimer) {
      e.preventDefault();
      skipTypewriter();
    }
    _lastChatClick = now;
  }
});
function pushMessageEmpty(convKey, who, text, phase) {
  const obj = { who, text, psy: phase };
  S.convs[convKey].messages.push(obj);
  if (convKey === S.activeConv) appendBubble(who, text, phase, true, true);
  return obj;
}

/* ---------------- 选项渲染 ---------------- */
const TONE = {
  warm:     { label: "配合", cls: "opt-warm" },
  neutral:  { label: "中性", cls: "opt-neutral" },
  cautious: { label: "谨慎", cls: "opt-cautious" },
  counter:  { label: "反制", cls: "opt-counter" },
};
function renderOptions(node) {
  const bar = $("options-bar");
  bar.innerHTML = "";
  const weakness = S.weakness || "";
  (node.options || []).forEach((opt, idx) => {
    const b = document.createElement("button");
    b.className = "opt-btn opt-in";
    const t = TONE[opt.tone] || TONE.neutral;
    var extra = "";
    if (weakness && isWeaknessOption(opt)) {
      S.weaknessSeen++;
    }
    b.innerHTML = `<span class="otype ${t.cls}">${t.label}</span>${extra}${opt.text}`;
    b.style.animationDelay = (idx * 0.05) + "s";
    b.addEventListener("click", () => chooseOption(opt, node));
    bar.appendChild(b);
  });
  if (!node.options.some(o => o.ending)) {
    const row = document.createElement("div");
    row.className = "free-row";
    row.innerHTML = `<input class="free-input" id="free-input" placeholder="也可自己打字回复……"/><button class="free-send" id="free-send">发送</button>`;
    bar.appendChild(row);
    $("free-send").addEventListener("click", () => {
      const v = $("free-input").value.trim();
      if (!v) return;
      handleFreeText(v, node);
    });
    $("free-input").addEventListener("keydown", (e) => { if (e.key === "Enter") $("free-send").click(); });
  }
}

/* ---------------- 自由文本（反卧底 + AI 生成） ---------------- */
async function handleFreeText(text, node) {
  pushMessageFinal(S.activeConv, "me", text, null);
  audioSFX("send");
  const target = ACTORS[S.activeConv];
  let added = 0, warnLine = null;
  const isTarget = target && (target.type === "target" || target.type === "accomplice");
  const isInformant = target && target.type === "informant";
  const isHandler = target && target.type === "handler";
  const isVictim = target && target.type === "victim";

  // 反卧底检测：仅对目标骗子/同伙
  if (isTarget) {
    for (const rule of ANTI_UNDERCOVER.keywords) {
      if (rule.re.test(text)) { added = Math.max(added, rule.add); warnLine = rule.line; }
    }
    if (!added) added = ANTI_UNDERCOVER.overQuestion.add;
  }
  if (added) bumpSuspicion(added);

  // 尝试使用 AI 生成回复（支持所有 NPC 类型，但骗子/线人优先）
  const shouldUseAI = !warnLine && (isTarget || isInformant || isHandler || isVictim) && AI_CONFIG.enabled;
  let aiReply = null;

  if (shouldUseAI) {
    showTyping();
    aiReply = await callAIChat(text, S.activeConv);
    hideTyping();
    if (aiReply && aiReply.redFlag) {
      // AI 回复含诱导词 → 红标提示
      setTimeout(() => toast("⚠ 对方提到了投资/账户等关键词，注意这是诈骗套路！"), 400);
    }
  }

  setTimeout(() => {
    if (warnLine) {
      // 命中反卧底敏感词 → NPC 警觉回应（优先于 AI）
      pushMessageFinal(S.activeConv, "ai", warnLine, "反卧底·警觉");
      setTimeout(() => checkExposed(), 400);
      if (S.ending) return;
    } else if (aiReply && aiReply.reply) {
      // AI 成功生成回复 → 使用 AI 回复
      const phase = aiReply.stage ? "AI·" + aiReply.stage : "AI 生成";
      pushMessageFinal(S.activeConv, "ai", aiReply.reply, phase);
      S.history.push({ day: S.day, who: target ? target.name : "NPC", phase, text: aiReply.reply });
    } else if (shouldUseAI) {
      // AI 不可用 → 使用预设兜底回复
      const fallback = aiFallbackReply(S.activeConv, text);
      pushMessageFinal(S.activeConv, "ai", fallback, "预设兜底");
    }

    // 找到下一个剧情节点
    const cont = node.options.find(o => o.next);
    if (cont && cont.next) {
      // ★ 检查下一个节点是否会切换 speaker 或换天
      const nxtNode = S.story.nodes[cont.next];
      const willSwitchSpeaker = nxtNode && nxtNode.speaker && nxtNode.speaker !== S.activeConv;
      const willSwitchDay = nxtNode && nxtNode.day && nxtNode.day !== S.day;
      const shouldManualAdvance = willSwitchSpeaker || willSwitchDay;

      if (!warnLine && !aiReply && isTarget) {
        // 安全回复 + 无AI → 兜底过渡
        pushMessageFinal(S.activeConv, "ai", "嗯，明白了。那咱们接着说正事——", null);
        showNextHint(cont.next);
      } else if (!warnLine && !isTarget && !isInformant && !aiReply) {
        // 非骗子/线人 NPC，无 AI → 使用上下文回复后推进
        const ctxReply = getHandlerReply(S.activeConv, text);
        pushMessageFinal(S.activeConv, "ai", ctxReply.text, ctxReply.phase);
        showNextHint(cont.next);
      } else if (warnLine) {
        // 敏感词命中后也推进（NPC发完火继续流程）
        setTimeout(() => { if (!S.ending) playNode(cont.next); }, 900);
      } else if (shouldManualAdvance) {
        // ★ AI 回复后，若即将切换角色/天数，让玩家手动点击"继续"
        showNextHint(cont.next);
      } else {
        // 同一角色继续对话 → 自动推进（留足阅读时间）
        setTimeout(() => { if (!S.ending) playNode(cont.next); }, 1800);
      }
    } else if (!cont) {
      // 没有后续剧情节点 → AI 回复后可继续自由对话
      if (aiReply || (shouldUseAI && !aiReply)) {
        // 重新渲染选项让玩家继续
        renderOptions(node);
      } else {
        pushMessageFinal(S.activeConv, "ai", "（对方等着你的选择……）", null);
        toast("💡 请从上方选项中选择一个回复");
        renderOptions(node);
      }
    }
  }, 500);
}

/* 自由输入后 — 显示"继续对话"按钮（不自动跳转） */
function showNextHint(nextNodeId) {
  var bar = $("options-bar");
  if (!bar) return;
  bar.innerHTML = '';
  var btn = document.createElement("button");
  btn.className = "opt-btn next-hint";
  btn.textContent = "▶ 继续对话";
  btn.onclick = function() {
    bar.innerHTML = '';
    playNode(nextNodeId);
  };
  bar.appendChild(btn);
  // 同时显示 toast 提示
  toast("💬 点击下方按钮继续剧情");
}

/* ---------------- 选择选项 ---------------- */
function chooseOption(opt, node) {
  audioSFX("click");
  pushMessageFinal(S.activeConv, "me", opt.text, null);
  audioSFX("send");
  // 弱点追踪：检查是否有弱点选项、用户是否选了/抵抗了
  if (node && S.weakness) {
    var hasWeakOpt = node.options.some(function(o) { return isWeaknessOption(o); });
    if (isWeaknessOption(opt)) {
      S.weaknessFell++;
      // V9.2 堕落反馈：触发良知内心戏 + 弱点debuff
      setTimeout(function() { showWeaknessFellVoice(); }, 300);
      setTimeout(function() {
        var w = getWeaknessConfig();
        if (w) toast("🎭 骗子成功利用你的「" + w.label + "」操纵了你", 3500);
      }, 2000);
    } else if (hasWeakOpt) {
      S.weaknessResisted++;
      S.awareness = clamp(S.awareness + 5, 0, 100);
      // V9.2 抵抗反馈：更丰富的正面提示
      var w2 = getWeaknessConfig();
      toast("🛡️ 你抵抗了「" + (w2 ? w2.label : "") + "」的弱点攻击！清醒度 +5（" + S.awareness + "/100）");
    }
  }
  if (opt.trust) S.trust = clamp(S.trust + opt.trust, 0, 100);
  if (opt.exposure) S.exposure = clamp(S.exposure + opt.exposure, 0, 4);
  if (opt.grant) completeTask(opt.grant);
  if (opt.evidence) { S.evidence++; toast("📎 已固定 " + S.evidence + " 项证据"); updateTopbar(); }
  if (opt.evidenceFrag) { collectFragment(opt.evidenceFrag); }
  if (opt.xiaoya) { S.xiaoya = clamp(S.xiaoya + opt.xiaoya, 0, 3); toast("🆘 小雅救援进度 +" + opt.xiaoya); }
  if (opt.susp) bumpSuspicion(opt.susp);
  // 良心值 & 清醒度（V9.0 新系统）
  if (opt.conscience) { S.conscience = clamp(S.conscience + opt.conscience, 0, 100); showConscienceToast(opt.conscience); }
  if (opt.awareness) { S.awareness = clamp(S.awareness + opt.awareness, 0, 100); showAwarenessToast(opt.awareness); }
  // 识别红标 → 清醒度大幅提升
  if (opt.redFlag) { S.awareness = clamp(S.awareness + 10, 0, 100); showRedFlagToast(); }
  // 转账场景 → 冷灰+震动+内心戏
  if (opt.transfer) { triggerTransferEffect(); }
  if (opt.route && !S.route) S.route = opt.route;
  $("options-bar").innerHTML = "";
  updateTopbar();
  if (opt.ending) { setTimeout(() => triggerEnding(opt.ending), 600); return; }
  if (checkExposed()) return;
  if (opt.next) setTimeout(() => playNode(opt.next), 450);
}

/* 良心值变化提示 */
function showConscienceToast(delta) {
  if (delta < 0) {
    if (S.conscience <= 60 && S.conscience + delta > 60) return; // 不要提示太频繁
    toast("💔 良心值 " + (delta < -10 ? "大幅下降" : "下滑") + "（" + S.conscience + "/100）");
    if (delta < -10) showInnerVoiceForMoment("conscience_low");
  } else if (delta > 15) {
    toast("💖 坚守底线（良心值 " + S.conscience + "/100）");
  }
}

/* 清醒度变化提示 */
function showAwarenessToast(delta) {
  if (delta > 0 && S.awareness >= 30 && S.awareness - delta < 30) {
    toast("💡 开始察觉异样（清醒度 " + S.awareness + "/100）");
  } else if (delta > 0 && S.awareness >= 60 && S.awareness - delta < 60) {
    toast("👁️ 高度警觉（清醒度 " + S.awareness + "/100）");
  } else if (delta > 0 && S.awareness >= 80 && S.awareness - delta < 80) {
    toast("🛡️ 清醒阈值达成！你有能力揭露骗局");
    showInnerVoice("awareness_high");
  }
}

/* ---------------- 内心戏旁白（V9.2 — 极乐迪斯科「思绪」二段式风格） ---------------- */
const INNER_VOICES = {
  lonely_transfer: "是不是太久没有人关心我了……真希望这次不一样。",
  lonely_close: "他每天陪我聊天，应该不会骗我吧？",
  greedy_return: "稳赚 20%……万一是真的呢？错过就可惜了。",
  greedy_high: "别人都赚了，我不能落后啊。",
  vanity_praise: "被这样的人认可，感觉真好……",
  vanity_elite: "和大佬在一起，好像我也变得不一般了。",
  fearful_threat: "万一他真的曝光我的信息怎么办……我不敢冒险。",
  fearful_urgent: "他说事情很严重……我不能赌。",
  rash_limited: "只剩最后几个名额了！不快点就没了。",
  rash_now: "机会不等人，犹豫就会败北。",
  transfer_any: "等等……把钱转给一个没见过面的网友？",
  privacy_any: "这些个人信息，真的有必要告诉他吗？",
  conscience_low: "我好像……越来越不像自己了。",
  awareness_high: "这些套路我已经见过好几次了。他们在骗我。",
};

/* 旧版通用内心戏 */
function showInnerVoice(key) {
  const text = INNER_VOICES[key];
  if (!text) return;
  const ov = document.createElement("div");
  ov.className = "inner-voice-overlay";
  ov.innerHTML = '<div class="inner-voice-text">"' + text + '"</div>';
  ov.addEventListener("click", function() { ov.remove(); });
  $("phone").appendChild(ov);
  setTimeout(function() { if (ov.parentNode) ov.remove(); }, 4000);
}

/* V9.2 极乐迪斯科风格：带名称的内心戏 */
function showInnerVoiceWithName(voiceName, voiceColor, text) {
  if (!text) return;
  var ov = document.createElement("div");
  ov.className = "inner-voice-overlay iv-ds";
  ov.innerHTML = '<div class="iv-voice-name" style="color:' + voiceColor + '">' + voiceName + '</div>' +
                  '<div class="inner-voice-text iv-text">"' + text + '"</div>';
  ov.addEventListener("click", function() { ov.remove(); });
  $("phone").appendChild(ov);
  setTimeout(function() { if (ov.parentNode) ov.remove(); }, 4500);
}

function showInnerVoiceForMoment(moment) {
  if (moment === "transfer") {
    /* 优先使用新系统的弱点内心戏 */
    if (S.weakness) {
      var wMap2 = { lonely: "lonely_transfer", greedy: "greedy_return", vanity: "vanity_praise", fearful: "fearful_urgent", rash: "rash_now" };
      var wk = wMap2[S.weakness];
      if (wk) { showInnerVoice(wk); return; }
    }
    showInnerVoice(wk || "transfer_any");
  } else if (moment === "privacy") {
    showInnerVoice("privacy_any");
  } else if (moment === "conscience_low") {
    showInnerVoice("conscience_low");
  } else if (moment === "awareness_high") {
    showInnerVoice("awareness_high");
  }
}

/* 弱点选项上的反击内心戏（玩家选了被戳中的弱点选项后） */
function showWeaknessFellVoice() {
  var w = getWeaknessConfig();
  if (!w) return;
  var conscienceTexts = [
    "你真的要这样做吗？",
    "别忘了你来的目的。你不是来被骗的。",
    "他在利用你。你在对自己说谎。",
  ];
  var line = conscienceTexts[Math.floor(Math.random() * conscienceTexts.length)];
  showInnerVoiceWithName("良知在提醒", "#2ed8b6", line);
  /* 降低良心值 */
  S.conscience = clamp(S.conscience - 8, 0, 100);
}

/* ---------------- 转账冷灰+震动效果（V9.0） ---------------- */
function triggerTransferEffect() {
  audioSFX("sting");
  $("phone").classList.add("cold-gray", "tremor");
  // 物理震动（移动端）
  if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 200]);
  // 内心戏旁白
  showInnerVoiceForMoment("transfer");
  // 3秒后恢复
  setTimeout(function() {
    $("phone").classList.remove("cold-gray", "tremor");
  }, 3000);
}

/* ---------------- 红标抖动提示（V9.0） ---------------- */
function showRedFlagToast() {
  // 创建特殊红标toast
  var t = document.createElement("div");
  t.className = "toast red-flag-blink";
  t.textContent = "🔴 识别了红标话术！清醒度 +10";
  t.style.cssText = "border-color:#DC143C;color:#DC143C;font-weight:700;";
  $("phone").appendChild(t);
  S.awareness = clamp(S.awareness + 10, 0, 100);
  setTimeout(function() { t.classList.add("show"); });
  setTimeout(function() { t.classList.remove("show"); setTimeout(function() { if (t.parentNode) t.remove(); }, 300); }, 2500);
}

/* ---------------- 怀疑度 & 暴露 ---------------- */
function bumpSuspicion(n) { S.suspicion = Math.min(120, S.suspicion + n); updateTopbar(); }
function checkExposed() {
  if (S.suspicion >= ANTI_UNDERCOVER.threshold) {
    const id = IDENTITIES[S.idKey];
    // 用身份专属的坏结局 key（非通用 E-Key）
    const badEndingMap = {
      hunter: "hunter_B",  // 卧底暴露
      scribe: "scribe_B",  // 被威胁
      teacher:"teacher_B", // 被骗
      seeker: "seek_C",    // 自己陷入
    };
    if (badEndingMap[id.id]) {
      pushMessageFinal(S.activeConv, "ai", "（对方沉默了几秒，随即清空了聊天记录……）", "身份暴露");
      setTimeout(() => triggerEnding(badEndingMap[id.id]), 800);
      return true;
    }
    // lighthouse / drift 没有"暴露"设定，但怀疑度过高也应警示
    if (id.id === "lighthouse" || id.id === "drift") {
      pushMessageFinal(S.activeConv, "ai", "（对方似乎察觉到了什么，语气明显冷了下来……）", "高度警觉");
      toast("⚠️ 对方对你的信任度大幅下降，请注意措辞！");
      return false;
    }
  }
  return false;
}

/* ---------------- 任务 ---------------- */
function completeTask(taskId) {
  if (S.tasks[taskId] === "completed") return;
  S.tasks[taskId] = "completed";
  const t = S.story.tasks.find(x => x.id === taskId);
  if (t) {
    audioSFX("taskComplete");
    if (t.msg) {
      // 角色语音反馈：用联络人的消息替代系统 toast
      pushMessageFinal(t.msg.from, "ai", t.msg.text, "任务更新");
      if (t.msg.from !== S.activeConv) S.convs[t.msg.from].unread = true;
      toast("📨 " + ACTORS[t.msg.from].name + " 发来新消息");
    } else {
      toast("✅ 任务完成：" + t.title);
    }
  }
  S.story.tasks.forEach(x => { if (x.cond === taskId && S.tasks[x.id] === "pending") S.tasks[x.id] = "active"; });
  updateTopbar();
}
function renderTasks() {
  const box = $("task-list");
  box.innerHTML = S.story.tasks.map((t) => {
    const st = S.tasks[t.id];
    const icon = st === "completed" ? "✅" : st === "active" ? "🟡" : "🔒";
    const cls = st === "completed" ? "done" : st === "active" ? "active" : "locked";
    const dep = (st === "pending" && t.cond) ? `<div class="task-dep">需先完成上一项</div>` : "";
    return `<div class="task-card ${cls}"><div class="task-h">${icon} ${t.title}</div>${dep}</div>`;
  }).join("");
  const done = Object.values(S.tasks).filter(x=>x==="completed").length;
  $("task-progress").textContent = `进度 ${done}/${S.story.tasks.length} · 证据 ${S.evidence} 项`;
  show("task-overlay");
}

/* ---------------- 状态面板 ---------------- */
function renderStatus() {
  const id = IDENTITIES[S.idKey];
  const expo = Math.min(100, S.suspicion);
  const conColor = S.conscience >= 70 ? "#07C160" : S.conscience >= 40 ? "#FFD700" : "#DC143C";
  const awColor = S.awareness >= 80 ? "#2ed8b6" : S.awareness >= 50 ? "#4aa3ff" : "#888";
  const awHint = S.awareness >= 80 ? "（已达反杀阈值）" : S.awareness >= 60 ? "（高度警觉）" : S.awareness >= 30 ? "（开始察觉）" : "";
  $("status-body").innerHTML = `
    <div class="st-row"><span>身份</span><b style="color:${id.color}">${id.codename} · ${id.role}</b></div>
    <div class="st-row"><span>进度</span><b>第 ${S.day} 天 / 共 ${id.days} 天</b></div>
    <div class="st-row"><span>信任值（隐）</span><b>${S.trust} / 100</b></div>
    <div class="st-row"><span>💔 良心值</span><b style="color:${conColor}">${S.conscience} / 100</b></div>
    <div class="st-row"><span>💡 清醒度</span><b style="color:${awColor}">${S.awareness} / 100 ${awHint}</b></div>
    <div class="st-row"><span>骗子怀疑度</span><b style="color:${expo>=ANTI_UNDERCOVER.threshold?'#DC143C':expo>=30?'#FFA500':'#07C160'}">${expo>=ANTI_UNDERCOVER.threshold?'危险':expo>=30?'警觉':'安全'}</b></div>
    <div class="st-row"><span>已固定证据</span><b>${S.evidence} 项 / ${Object.keys(S.evidenceFrags).length} 碎片</b></div>
    <div class="st-row"><span>关系亲近度</span><b>${"▎".repeat(S.exposure)||"—"}</b></div>
    ${S.weakness ? `<div class="st-row"><span>🎭 心理弱点</span><b>${S.weakness}</b></div>` : ""}
    <div class="st-tip">提示：${id.handler ? "越是任务在身，越要\"像个真人\"——不要问得太细，也不要太配合。" : "任何让你\"先充钱\"的机会，都是陷阱。"}</div>`;
  show("status-overlay");
}

/* ---------------- 档案面板 ---------------- */
function renderProfile() {
  const id = IDENTITIES[S.idKey];
  $("profile-body").innerHTML = `
    <div class="pf-hd"><div class="pf-av" style="background:${id.color}">${id.portrait ? '<img class="av-img" src="' + id.portrait + '">' : id.avatar}</div>
      <div><div class="pf-name">${id.name}</div><div class="pf-code">代号 ${id.codename} · ${id.role}</div>
      <div class="pf-star" style="color:${id.color}">${stars(id.star)}</div></div></div>
    <div class="pf-sec"><b>任务</b>${id.mission}</div>
    <div class="pf-sec"><b>风险</b>${id.danger}</div>
    <div class="pf-sec"><b>联络人</b>${id.handler ? id.handler.name + "（" + id.handler.desc + "）" : "无"}</div>
    <div class="pf-oath">${id.oath}</div>`;
  show("profile-overlay");
}

/* ---------------- 消息 & 气泡 ---------------- */
function pushMessageFinal(convKey, who, text, phase) {
  S.convs[convKey].messages.push({ who, text, psy: phase });
  if (convKey === S.activeConv) appendBubble(who, text, phase, true, true);
}
function appendBubble(who, text, phase, scroll, animate) {
  const area = $("chat-area");
  const m = document.createElement("div");
  m.className = "msg " + who + (animate ? " anim" : "");
  // 头像
  let avHTML = '';
  if (who === 'ai') {
    const a = ACTORS[S.activeConv];
    const avColor = a ? a.color : '#555';
    const avChar = a ? a.avatar : '?';
    avHTML = `<div class="msg-av" style="background:${avColor}">${avChar}</div>`;
  } else if (who === 'me') {
    const id = getChatIdentity();
    const avColor = id ? id.color : '#FF6B35';
    const avChar = id ? (id.avatar || id.name[0]) : '我';
    avHTML = `<div class="msg-av" style="background:${avColor}">${avChar}</div>`;
  }
  // 消息体
  const timeStr = new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'});
  m.innerHTML = `${avHTML}<div class="msg-body"><div class="bubble">${text}</div><span class="msg-time">${timeStr}</span>${who === 'ai' && text ? createEvidenceCollectBtn(text) : ''}</div>`;
  area.appendChild(m);
  if (scroll) area.scrollTop = area.scrollHeight;
}
function showTyping() {
  if (S.story.nodes[S.node].speaker !== S.activeConv) return;
  const area = $("chat-area");
  const m = document.createElement("div");
  m.className = "msg ai anim"; m.id = "typing-msg";
  const a = ACTORS[S.activeConv];
  const avColor = a ? a.color : '#555';
  const avChar = a ? a.avatar : '?';
  m.innerHTML = `<div class="msg-av" style="background:${avColor}">${avChar}</div><div class="msg-body"><div class="typing"><span></span><span></span><span></span></div></div>`;
  area.appendChild(m); area.scrollTop = area.scrollHeight;
}
function hideTyping() { const t = $("typing-msg"); if (t) t.remove(); }

/* ---------------- 场景切换提示 & 环境叙事 ---------------- */
function appendTransition(speaker) {
  const npc = NPC_SCENES[speaker];
  if (!npc) return;
  const area = $("chat-area");
  const m = document.createElement("div");
  m.className = "scene-transition anim";
  m.innerHTML = `<div class="scene-trans-inner"><span class="st-ic">${npc.icon}</span><div><b>${npc.title}</b><div class="scene-trans-line">${npc.desc}</div></div></div>`;
  area.appendChild(m);
  area.scrollTop = area.scrollHeight;
}

/** 插入环境叙事消息（居中、斜体、虚线框） */
function appendAmbient(text) {
  const area = $("chat-area");
  const m = document.createElement("div");
  m.className = "msg-ambient";
  m.innerHTML = `<div class="ambient-text">${text}</div>`;
  area.appendChild(m);
  area.scrollTop = area.scrollHeight;
}

/* ---------------- Toast ---------------- */
let toastTimer = null;
function toast(text) {
  const el = $("toast");
  el.textContent = text; el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
}

/* ---------------- 结局图鉴（V9.0） ---------------- */
function loadGallery() {
  try { var g = JSON.parse(localStorage.getItem("antiScamGallery") || "{}"); if (g && typeof g === "object") S.gallery = g; }
  catch(e) { S.gallery = {}; }
}
function saveGallery() {
  if (Object.keys(S.gallery).length > 0)
    try { localStorage.setItem("antiScamGallery", JSON.stringify(S.gallery)); } catch(e) {}
}

function renderGallery() {
  var total = 0, unlocked = 0;
  var cards = [];
  for (var idKey in STORIES) {
    var id = IDENTITIES[idKey];
    if (!id) continue;
    var ends = STORIES[idKey].endings;
    for (var ek in ends) {
      total++;
      var end = ends[ek];
      var gkey = ek;
      var entry = S.gallery[gkey];
      var isUnlocked = !!entry;
      if (isUnlocked) unlocked++;
      cards.push({ idKey: idKey, codename: id.codename, color: id.color, icon: id.avatar,
        endKey: ek, title: end.title || ek, good: end.good, unlocked: isUnlocked, time: entry ? entry.time : null });
    }
  }
  if (S.gallery["COUNTER"]) {
    total++; unlocked++;
    cards.push({ idKey: "", codename: "反杀", color: "#2ed8b6", icon: "⚡",
      endKey: "COUNTER", title: "反杀揭露", good: true, unlocked: true, time: S.gallery["COUNTER"].time });
  }
  $("gl-count").textContent = "已解锁 " + unlocked + " / " + total + " 个结局";
  $("gl-grid").innerHTML = cards.map(function(c) {
    if (c.unlocked) {
      var d = c.time ? new Date(c.time) : new Date();
      var ds = d.getFullYear() + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + ("0"+d.getDate()).slice(-2);
      return '<div class="gl-card unlocked">' +
        '<div class="gl-id-icon">' + c.icon + '</div>' +
        '<div class="gl-id-name" style="color:' + c.color + '">' + c.codename + '</div>' +
        '<div class="gl-end-title">' + c.title + '</div>' +
        '<span class="gl-end-good ' + (c.good ? 'good' : 'bad') + '">' + (c.good ? '✅ 好结局' : '❌ 坏结局') + '</span>' +
        '</div>';
    } else {
      return '<div class="gl-card locked">' +
        '<div class="gl-id-icon">🔒</div>' +
        '<div class="gl-id-name">???</div>' +
        '<div class="gl-end-title">完成对应身份线解锁</div>' +
        '</div>';
    }
  }).join("");
}

/* ---------------- 结局判定（确定性逻辑） ---------------- */
function determineEnding(story, state) {
  const { trust, evidence, route, xiaoya, conscience, awareness } = state;
  if (route === "scammed") {
    if (trust > 60) return conscience < 40 ? "E02" : "E01"; // 低良心时被骗→更差的结局
    if (trust > 30) return "E02";
    if (evidence >= 3) return "E03";
    return "E02";
  }
  if (route === "arrest") {
    // 清醒度 ≥ 80 + 证据集齐 → 反杀结局
    if (awareness >= 80 && evidence >= 3) return "COUNTER";
    if (story.hasXiaoya && xiaoya >= 3 && evidence >= 3) return "E05";
    if (evidence >= 3) return "E03";
    if (evidence < 3) return conscience < 30 ? "E04" : "E03"; // 良心过低 → 道德困境
    return "E03";
  }
  if (route === "alert") {
    if (trust < 20) return "E06";
    return conscience < 30 ? "E04" : "E04";
  }
  if (route === "expose") return "E07";
  if (route === "fail") return "E08";
  // 默认兜底
  return "E03";
}

/* 检查是否触发反杀 Ending */
function checkCountersTrigger() {
  return S.awareness >= 80 && S.evidence >= 3 && !S.ending;
}

/* ---------------- 触发结局 → 进入五幕后续 ---------------- */
function triggerEnding(endKey) {
  S.ending = true; S.endingKey = endKey;
  $("options-bar").innerHTML = "";

  // 反杀结局：证据完整 + 清醒度达标
  if (endKey === "COUNTER") {
    triggerCounterEnding(); return;
  }

  const end = S.story.endings[endKey];
  if (!end) { toast("⚠️ 结局数据缺失"); return; }
  const bad = !end.good;
  if (bad) { audioSFX("sting"); $("phone").classList.add("shake"); setTimeout(()=>$("phone").classList.remove("shake"), 500); }

  // 记录到结局图鉴
  S.gallery[endKey] = { time: Date.now(), identity: S.idKey, title: end.title || endKey, good: end.good };
  saveGallery();

  // 记录解锁
  checkUnlockAfterFinish(S.idKey, end.good);

  // 坏结局 → 第二幕·崩塌
  if (bad) { runCollapse(end); return; }
  // 好结局 → 直接第四幕回放（跳过崩塌）
  runReplay(end);
}

/* 反杀结局特殊路径 */
function triggerCounterEnding() {
  S.endingKey = "COUNTER";
  S.route = "counter";
  audioSFX("taskComplete");
  $("phone").classList.add("cold-gray");
  const id = IDENTITIES[S.idKey];
  // 构建反杀结局对象
  const counterEnd = {
    good: true, title: "⚡ 反杀揭露", sub: "完整证据链揭露骗局",
    text: "你的证据链完整无缺，清醒地看穿了每一步骗术。",
    review: `凭借${Object.keys(S.evidenceFrags).length}项关键证据碎片和充分的防骗意识，你不仅保护了自己，还让骗子无处遁形。${id.codename}，这次他们失手了。`,
    tag: "expose"
  };
  S.gallery["COUNTER"] = { time: Date.now(), identity: S.idKey, title: "反杀揭露", good: true };
  checkUnlockAfterFinish(S.idKey, true);
  toast("⚡ 证据链完整！你成功揭露了骗局！");
  runReplay(counterEnd);
}

/* 信任值辅助函数 */
function getTrustColor() {
  if (S.trust >= 70) return "#07C160";
  if (S.trust >= 40) return "#FFD700";
  return "#DC143C";
}

/* ---------------- 第二幕·崩塌 ---------------- */
/* 崩塌文案必须按结局类型区分，否则"卧底暴露/被威胁/被捕"等未转账的坏结局
   会被错误地播成"被骗了钱"。只有明确金钱损失的结局才展示余额归零。 */
function buildCollapseSeq(key) {
  const moneyLoss   = ["drift_A"];                                   // 真转账、真丢钱
  const nearScam    = ["hunter_C"];                                  // 差点转账，但没转
  const exposed     = ["hunter_B", "scribe_B", "teacher_B", "seek_C"];  // 身份/行踪暴露，无关金钱损失
  const compromised = ["scribe_C", "light_C"];                       // 妥协 / 被报复

  if (moneyLoss.includes(key)) {
    return [
      { t: "转账成功。", d: 0 },
      { t: "对方已不是你的好友。消息发出去了，红色感叹号。电话是空号。", d: 3000 },
      { t: "被骗前：余额 12,800 元\n被骗后：余额 0 元\n下个月的房租：3,500 元\n信用卡最低还款：2,000 元\n你还有 6 天。", d: 3500, screen: true },
      { t: `朋友："你怎么这么傻？网上的人也信？"\n妈妈："最近还好吗？"（你不知道怎么回）\n同事："听说她被骗了好几万……"`, d: 3500 },
      { t: `你翻看着聊天记录——每一句"晚安"现在都像刀子。"我怎么会相信一个没见过面的人？""我是不是太蠢了？"`, d: 3500 },
      { t: `你想起之前看到过的新闻——某市一位和你年纪相仿的女性，在网络认识了"金融高管"，被骗了全部积蓄。"你从来没想过，自己会成为故事里的那个人。"`, d: 4000 },
      { t: `你的一位朋友刚发了一条动态："刚认识了一个做金融的朋友，感觉很靠谱。"⚠️ 他可能正在经历和你一样的骗局。`, d: 4000 },
    ];
  }
  if (nearScam.includes(key)) {
    return [
      { t: "你差点，就点了「确认转账」。", d: 0 },
      { t: "5,000 元，差一点打进那个陌生账户。你的手停在屏幕上方，冷汗浸透了后背。", d: 3000 },
      { t: "屏幕：余额 12,800 元\n（万幸，还在这里。）\n但你已被骗子标记为「潜在猎物」。", d: 3500, screen: true },
      { t: `朋友："你还好吗？最近感觉你不太对劲。"\n妈妈："别太累，注意身体。"（你不知道怎么回）`, d: 3500 },
      { t: `你回放着刚才的对话——骗子每一步都在把你往"转账"上引。"我以为我在钓鱼，其实鱼在钓我。"`, d: 3500 },
      { t: `你想起新闻里那个案例——有人就这样"配合验证"一步步转空了积蓄。"差一点，就是那个人。"`, d: 4000 },
      { t: `你的一位朋友刚发来："有个朋友介绍我投资，说稳赚。"⚠️ 他可能正站在你刚才站的位置。`, d: 4000 },
    ];
  }
  if (exposed.includes(key)) {
    return [
      { t: "你的身份，暴露了。", d: 0 },
      { t: "对方沉默了几秒，随即清空聊天记录、拉黑、失联。你被盯上了——这不是丢钱，是丢了「人马」。", d: 3000 },
      { t: "屏幕：⚠️ 行动暴露\n你的真实身份已不再安全\n（你输在「被识破」，而非「被骗钱」）", d: 3500, screen: true },
      { t: `上线："撤，马上撤。"\n你不知道这一次的疏忽，会让多少人趁机脱身。`, d: 3500 },
      { t: `你复盘着每一个"问得太细"的瞬间——正是那些"谨慎"，让你看起来不像个普通人，反而暴露了马脚。`, d: 3500 },
      { t: `你想起培训时那句话："骗子对异常最敏感。"一句多余的话，七天白费。`, d: 4000 },
      { t: `而真正的受害者小雅，还在等一个永远不会来的"提现"。你的暴露，让她失去了一线机会。`, d: 4000 },
    ];
  }
  // compromised：妥协 / 被报复
  return [
    { t: "你，退了一步。", d: 0 },
    { t: "你选择了妥协。对方记住了你的软弱，也记住了你的把柄。", d: 3000 },
    { t: "屏幕：⚠️ 你已陷入被动\n证据没拿到，信任也丢了。", d: 3500, screen: true },
    { t: `同事："你最近怎么总心不在焉？"\n妈妈："有事别一个人扛。"（你不知道怎么回）`, d: 3500 },
    { t: `你翻看聊天记录——那些本可以救人、或自保的话，最终都化成了沉默。`, d: 3500 },
    { t: `你想起新闻里那句话："退一步，往往不是海阔天空，而是更深的泥潭。"`, d: 4000 },
    { t: `你的一位朋友刚发来："我好像也被缠上了，怎么办？"⚠️ 你能拉他一把——从这次的教训开始。`, d: 4000 },
  ];
}
function runCollapse(end) {
  applyActTheme("collapse");
  audioBGM("collapse");
  audioSFX("sting");
  const seq = buildCollapseSeq(S.endingKey);
  let i = 0;
  const area = $("chat-area");
  area.innerHTML = "";
  function step() {
    if (i >= seq.length) {
      setTimeout(() => runRuins(end), 1200);
      return;
    }
    const s = seq[i++];
    audioSFX("collapseText");
    const m = document.createElement("div");
    m.className = "msg sys anim";
    m.style.alignSelf = "center";
    m.innerHTML = `<div class="collapse-screen" style="${s.screen?'':'white-space:pre-line'}">${s.t}</div>`;
    area.appendChild(m); area.scrollTop = area.scrollHeight;
    setTimeout(step, s.d);
  }
  step();
}

/* ---------------- 第三幕·废墟（四行动） ---------------- */
function runRuins(end) {
  applyActTheme("ruins");
  audioBGM("ruins");
  const box = $("ruins-list");
  box.innerHTML = RUINS_ACTIONS.map(a => {
    const done = S.ruinsDone[a.id];
    return `<button class="ruin-btn ${done?'done':''}" data-id="${a.id}">
      <span class="ruin-ic">${a.ic}</span>
      <span class="ruin-txt"><b>${a.t}</b><span>${a.d}</span></span>
      ${done ? '<span class="ruin-done">✅</span>' : ''}
    </button>`;
  }).join("");
  box.querySelectorAll(".ruin-btn").forEach(b => {
    b.addEventListener("click", () => {
      const id = b.dataset.id;
      const a = RUINS_ACTIONS.find(x => x.id === id);
      S.ruinsDone[id] = true;
      b.classList.add("done");
      b.querySelector(".ruin-done") || (b.insertAdjacentHTML("beforeend", '<span class="ruin-done">✅</span>'));
      toast(a.tip);
      // 若四项全完成，提示可继续
      if (Object.keys(S.ruinsDone).length >= RUINS_ACTIONS.length) {
        setTimeout(() => { toast("四个行动都完成了，去看看你的故事回放 →"); }, 600);
      }
    });
  });
  $("ruins-continue").onclick = () => runReplay(end);
  show("ruins-overlay");
}
$("ruins-close").addEventListener("click", () => hide("ruins-overlay"));

/* ---------------- 第四幕·回放（时间线 + 平行宇宙） ---------------- */
function runReplay(end) {
  applyActTheme("replay");
  audioBGM("replay");
  $("replay-end-title").textContent = end.title;
  $("replay-end-text").textContent = end.text;
  $("replay-end-review").innerHTML = `<b>复盘</b>${end.review}`;
  renderTimeline();
  show("replay-overlay");
}
$("replay-continue").addEventListener("click", () => { hide("replay-overlay"); runShield(); });
$("replay-close").addEventListener("click", () => hide("replay-overlay"));

function renderTimeline() {
  $("timeline-list").innerHTML = S.history.map(n => `
    <div class="tl-item"><div class="tl-dot"></div>
      <div class="tl-day">第 ${n.day||"?"} 天 · ${n.who}</div>
      <div class="tl-phase">【心理学标注】${n.phase||""}</div>
      <div class="tl-text">${n.text}</div></div>`).join("");
}

/* ---------------- 第四幕·平行宇宙输入框（AI 生成替代走向） ---------------- */
$("parallel-btn").addEventListener("click", () => {
  const samples = (PARALLEL_SAMPLES[S.idKey] || PARALLEL_SAMPLES.default);
  $("parallel-list").innerHTML = samples.map(s => `
    <div class="pl-item"><div class="pl-q">🤔 ${s.q}</div><div class="pl-a">${s.a}</div></div>`).join("");
  show("parallel-overlay");
});
$("parallel-send").addEventListener("click", async () => {
  const v = $("parallel-input").value.trim();
  if (!v) return;
  const node = S.history[S.history.length - 1];
  const who = node ? node.who : "张浩";
  $("parallel-result").innerHTML = `<div class="pl-item"><div class="pl-q">🤔 ${v}</div>
    <div class="pl-a typing-dots">正在推演平行宇宙的可能走向<span>.</span><span>.</span><span>.</span></div></div>`;
  $("parallel-input").value = "";

  // 尝试使用 AI 生成平行宇宙走向
  let aiResult = null;
  if (AI_CONFIG.enabled) {
    const systemPrompt = `你是一个叙事推演助手。用户正在体验"反诈人生"互动游戏，他想知道：如果在某个关键节点他做了一个不同的选择，故事会有怎样的走向。
你需要根据用户提供的"如果当时……"假想选择，生成一段80-150字的简洁推演。推演需包含以下要素：
1. 对方（${who}）可能的反应
2. 如果涉及骗局，推测结果的变化
3. 一个启发性的结论（如"有些选择看似很小，却决定了信任的方向"）
请直接输出推演内容，不要加引号、标记或解释性前缀。`;
    try {
      const resp = await fetch(AI_CONFIG.apiBase + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "如果当时我这样回复：\"" + v + "\"，故事会怎么走？",
          system: systemPrompt,
          history: [],
        }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined,
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.reply) aiResult = data.reply;
      }
    } catch (e) { console.warn("[平行宇宙 AI] 推演失败：", e.message || e); }
  }

  // 渲染结果（AI 或预设兜底）
  if (aiResult) {
    $("parallel-result").innerHTML = `<div class="pl-item"><div class="pl-q">🤔 ${v}</div>
      <div class="pl-a"><span style="font-size:11px;color:#8a93a8">AI 推演：</span>${aiResult}</div></div>`;
  } else {
    $("parallel-result").innerHTML = `<div class="pl-item"><div class="pl-q">🤔 ${v}</div>
      <div class="pl-a">如果当时你这样回复，${who} 大概率会先迟疑、再换一种话术继续——骗子的剧本是固定的，你的动摇才是变量。这正是"平行宇宙"里最可能发生的事。</div></div>`;
  }
});
$("parallel-close").addEventListener("click", () => hide("parallel-overlay"));

/* ---------------- 第五幕·盾牌（报告） ---------------- */
function runShield() {
  applyActTheme("shield");
  audioBGM("shield");
  const id = IDENTITIES[S.idKey];

  // 证据墙计数器检查
  const isCounter = S.endingKey === "COUNTER";
  const end = isCounter ? { good: true, title: "⚡ 反杀揭露", review: "完整证据链+清醒意识，你揭露了整个骗局。" } : S.story.endings[S.endingKey];
  if (!end) { toast("⚠️ 报告数据缺失"); return; }

  const done = Object.values(S.tasks).filter(x=>x==="completed").length;
  let score = Math.round((done / S.story.tasks.length) * 50) + (end.good ? 35 : 0)
            + Math.max(0, 15 - Math.floor(S.suspicion/8));
  score = clamp(score, 5, 100);
  // V9.0: 心理弱点标签
  const weakObj = S.weakness ? (WEAKNESSES.find(w=>w.key===S.weakness) || {}) : {};
  const weakLabel = weakObj.label || "";
  const weak = weakLabel;
  // 弱点分析
  var weakAnalysis = "";
  if (weakLabel) {
    if (S.weaknessFell > 0 && S.weaknessResisted > 0) {
      weakAnalysis = "你曾 " + S.weaknessFell + " 次被「" + weakLabel + "」攻破防线，但也成功抵抗了 " + S.weaknessResisted + " 次。";
    } else if (S.weaknessFell > 0) {
      weakAnalysis = "你在 " + S.weaknessFell + " 个关键时刻被「" + weakLabel + "」击中了软肋。骗子太精准了。";
    } else if (S.weaknessResisted > 0) {
      weakAnalysis = "你的「" + weakLabel + "」弱点被瞄准了 " + S.weaknessResisted + " 次，但你都稳住了！";
    } else {
      weakAnalysis = "「" + weakLabel + "」是你的软肋，这次任务中骗子没有直接触发——但下次未必。";
    }
  } else {
    weakAnalysis = "在没有明确认知自身弱点时，防备心会在不经意间降低。";
  }
  // 证据统计（V9.2：基于 6 种证据类型）
  var evTypeCounts = typeof countEvidenceByType === "function" ? countEvidenceByType() : {};
  var evGotTypes = 0;
  if (evTypeCounts && Object.keys(evTypeCounts).length) {
    Object.values(evTypeCounts).forEach(function(v) { if (v > 0) evGotTypes++; });
  }
  var evTotalTypes = 6;
  var evLine = evGotTypes + "/" + evTotalTypes + " 类证据";
  $("shield-title").textContent = end.title;
  $("shield-sub").textContent = id.codename + "（" + id.role + "） · " + (end.good ? "任务完成" : "任务失败");
  $("shield-score").textContent = score + " 分";
  $("shield-score").style.color = end.good ? "#07C160" : "#FFA500";
  $("shield-stats").innerHTML = `
    <div class="es"><span>${done}/${S.story.tasks.length}</span>任务</div>
    <div class="es"><span>${evLine}</span>证据</div>
    <div class="es"><span>${S.day}</span>天</div>
    <div class="es"><span>${Math.min(100,S.suspicion)}</span>怀疑度</div>
    <div class="es"><span>${S.awareness}</span>清醒</div>`;
  $("shield-weak").textContent = (weakLabel ? ("心理弱点：「" + weakLabel + "」") : "心理弱点：未识别") + " — " + weakAnalysis;
  const idx = Math.min(5, Math.max(1, Math.round(score/20)));
  $("shield-stars").textContent = "⭐".repeat(idx) + "☆".repeat(5-idx);
  $("shield-tips").innerHTML = [
    "1. 任何要求转账的「朋友」，先电话核实。",
    "2. 「内部消息」「稳赚不赔」都是危险信号。",
    "3. 感到不对劲时，先告诉一个信任的人。",
    "4. 📎 本局共可收集 " + evTotalTypes + " 类关键证据，你收集了 " + evGotTypes + " 类。",
    isCounter ? "5. 🔓 你已解锁隐藏结局「反杀」！证据链+清醒意识=最强防诈武器。" : "",
  ].filter(Boolean).map(function(t) { return '<div class="shield-tip">' + t + '</div>'; }).join("");
  renderToolbox();
  show("shield-overlay");
}
$("shield-restart").addEventListener("click", () => { hideAll(); showIdentitySelect(); });
$("shield-toolbox-btn").addEventListener("click", () => show("toolbox-overlay"));
$("shield-share-btn").addEventListener("click", () => shareShieldReport());

/* ---------------- 分享避坑报告（V9.0） ---------------- */
function shareShieldReport() {
  var id = IDENTITIES[S.idKey];
  var end = S.endingKey === "COUNTER" ? { title: "反杀揭露", good: true } : (S.story.endings[S.endingKey] || { title: "未知", good: false });
  // V9.2: 基于 6 种证据类型统计
  var evTypeCounts = typeof countEvidenceByType === "function" ? countEvidenceByType() : {};
  var evGotTypes = 0;
  if (evTypeCounts && Object.keys(evTypeCounts).length) {
    Object.values(evTypeCounts).forEach(function(v) { if (v > 0) evGotTypes++; });
  }
  var evTotalTypes = 6;
  var weakObj = S.weakness ? (WEAKNESSES.find(function(w){return w.key===S.weakness}) || {}) : {};

  var tips = [
    "1. 任何要求转账的「朋友」，先电话核实。",
    "2. 「内部消息」「稳赚不赔」都是危险信号。",
    "3. 感到不对劲时，先告诉一个信任的人。",
    weakObj.label ? ("4. 你的心理弱点「" + weakObj.label + "」是骗子最常用的突破口（被攻击 " + (S.weaknessFell||0) + " 次，抵抗 " + (S.weaknessResisted||0) + " 次）。") : "",
    "5. 📎 收集 " + evGotTypes + "/" + evTotalTypes + " 类关键证据" + (evGotTypes >= evTotalTypes ? "，证据完整！" : "，还有提升空间。")
  ].filter(Boolean);

  var text = "「反诈人生」避坑报告\n";
  text += "━━━━━━━━━━━━━━\n";
  text += "身份：" + id.codename + " · " + id.role + "\n";
  text += "结局：" + end.title + " " + (end.good ? "✅" : "❌") + "\n";
  text += "证据类型：" + evGotTypes + "/" + evTotalTypes + "  ·  清醒度：" + S.awareness + "/100\n";
  text += "弱点抵抗：" + (S.weaknessResisted||0) + " 次  ·  被攻破：" + (S.weaknessFell||0) + " 次\n";
  text += "━━━━━━━━━━━━━━\n";
  text += "避坑建议：\n" + tips.join("\n");

  // Web Share API
  if (navigator.share) {
    navigator.share({ title: "反诈人生 · 避坑报告", text: text }).catch(function() {});
  } else {
    navigator.clipboard.writeText(text).then(function() {
      toast("📋 报告已复制到剪贴板，可以粘贴分享！");
    }).catch(function() {
      toast("⚠️ 分享失败，请尝试截图分享");
    });
  }
  toast("📤 正在分享避坑报告...");
}

/* ---------------- 工具箱 ---------------- */
function renderToolbox() {
  $("toolbox-list").innerHTML = TOOLBOX.map(t => `
    <div class="tool-item"><div class="tool-ic">${t.ic}</div><div class="tool-txt"><h4>${t.t}</h4><p>${t.d}</p></div></div>`).join("");
  $("kw-cloud").innerHTML = KEYWORDS.map(k => `<span class="kw">${k}</span>`).join("");
}
$("toolbox-close").addEventListener("click", () => hide("toolbox-overlay"));

/* ---------------- 底部功能栏 ---------------- */
$("nav-conv").addEventListener("click", () => { audioSFX("panelOpen"); renderConvList(); });
$("nav-task").addEventListener("click", () => { audioSFX("panelOpen"); renderTasks(); });
$("nav-status").addEventListener("click", () => { audioSFX("panelOpen"); renderStatus(); });
$("nav-profile").addEventListener("click", () => { audioSFX("panelOpen"); renderProfile(); });
$("nav-evidence").addEventListener("click", () => { audioSFX("panelOpen"); S.evidenceUnviewed = false; updateTopbar(); show("evidence-overlay"); renderEvidenceWall("ev-content-box", null); });
$("nav-gallery").addEventListener("click", () => { audioSFX("panelOpen"); renderGallery(); show("gallery-overlay"); });
// 切号按钮
$("switcher-badge").addEventListener("click", () => { audioSFX("click"); showIdentitySwitcher(false); });
$("switcher-cancel").addEventListener("click", () => { audioSFX("click"); hide("switcher-overlay"); });
$("convlist-close").addEventListener("click", () => hide("convlist-overlay"));
$("task-close").addEventListener("click", () => hide("task-overlay"));
$("status-close").addEventListener("click", () => hide("status-overlay"));
$("profile-close").addEventListener("click", () => hide("profile-overlay"));

/* ---------------- 退出 / 重开 ---------------- */
function hideAll() {
  ["idselect-overlay","identity-overlay","ruins-overlay","replay-overlay","parallel-overlay",
   "shield-overlay","toolbox-overlay","convlist-overlay","task-overlay","status-overlay","profile-overlay",
   "switcher-overlay","evidence-overlay","gallery-overlay","quick-overlay"].forEach(hide);
}
$("btn-exit").addEventListener("click", () => {
  if (confirm("退出当前任务？进度不会保存。")) { hideAll(); $("game-root").classList.add("hidden"); showIdentitySelect(); }
});

/* ---------------- 快速模式（Reigns式，V9.0） ---------------- */
var qkIndex = 0, qkScore = 0, qkCardData = [];
var qkStartX = 0, qkDragging = false, qkSwipeBound = false;

const QUICK_CARDS = [
  { text: "网友：'姐，投5万三天变8万，群里的人都赚了。'", left: { label: "拒绝", score: 1, react: "你拒绝了。真正的投资没有稳赚不赔的。" }, right: { label: "心动", score: -1, react: "你转了5万。三天后，对方账号注销了。典型的杀猪盘。" } },
  { text: "陌生人：'您好，您涉嫌洗钱，请将资金转入安全账户配合调查。'", left: { label: "挂断电话", score: 1, react: "你挂了电话。公检法不会用电话要求转账，更没有什么安全账户。" }, right: { label: "配合转账", score: -1, react: "你把钱转了过去。真正的警察绝不会要求你转账。" } },
  { text: "群消息：'内部渠道，稳赚30%，名额只剩5个！'", left: { label: "忽略", score: 1, react: "你没有上当。内部消息+名额有限 = 经典话术组合。" }, right: { label: "抢名额", score: -1, react: "你转账抢名额。钱没了，群也解散了。" } },
  { text: "熟人微信：'在外面不方便，急用2000，转给我微信，回去还你。'", left: { label: "先打电话确认", score: 1, react: "你打了电话——对方说微信号被盗了。幸好没转。" }, right: { label: "立刻转账", score: -1, react: "钱转过去了，才发现熟人的微信号被盗了。" } },
  { text: "自称客服：'您的快递丢失，点击链接填写银行卡信息理赔。'", left: { label: "通过官方APP查询", score: 1, react: "你在淘宝APP里发现快递正常在派送。差点被钓鱼。" }, right: { label: "点击链接填写", score: -1, react: "你填了银行卡和验证码。卡里的钱被转走了。" } },
  { text: "陌生链接：'您中奖了！领取iPhone一部，点击确认收货地址。'", left: { label: "无视", score: 1, react: "天上不会掉iPhone，只会掉陷阱。" }, right: { label: "点击领奖", score: -1, react: "链接是钓鱼网页，你的个人信息已被窃取。" } },
  { text: "群主：'刷单返利，一单赚300，本金秒退！想赚钱的私聊。'", left: { label: "不理会", score: 1, react: "刷单是诈骗，不要用辛苦钱换教训。" }, right: { label: "私聊尝试", score: -1, react: "第一单确实返了300。你加大本金后——对方消失了。这就是刷单套路。" } },
  { text: "\"你儿子出车祸了在医院，需要急救费，赶紧转过来！\" ——陌生号码来电。", left: { label: "先核实情况", score: 1, react: "冷静下来，你拨通了儿子的电话——他正在正常上班。典型的冒充家属诈骗。" }, right: { label: "赶紧转账", score: -1, react: "10分钟后，你联系上了儿子，他平安无事。" } },
  { text: "\"您购买的机票需改签，将赔偿300元延误费，请提供银行卡号。\"——短信。", left: { label: "通过航司官网核实", score: 1, react: "你登录官网发现航班正常。诈骗短信差一点就成功了。" }, right: { label: "回复卡号", score: -1, react: "你的银行卡信息已泄露，请立刻挂失！" } },
  { text: "\"在你投资群里，老师说这波行情十年一遇，梭哈就对了。\"", left: { label: "保持观望", score: 1, react: "一夜暴富的故事99%都是故事。真正的投资需要理性。" }, right: { label: "跟单投大钱", score: -1, react: "你跟着投了。平台打不开了——这就是典型的杀猪盘闭环。" } },
];

function startQuickMode() {
  qkIndex = 0; qkScore = 0;
  qkCardData = shuffleCards(QUICK_CARDS.slice()).slice(0, 10);
  // 恢复答题 UI
  $("qk-title").textContent = "⚡ 快速模式 · 骗术判断";
  $("qk-desc").style.display = "";
  $("qk-card-wrap").style.display = "";
  $("qk-result").style.display = "none";
  $("qk-score").textContent = "0 分";
  $("qk-hint-l").style.opacity = "0.4";
  $("qk-hint-r").style.opacity = "0.4";
  show("quick-overlay");
  renderQuickCard();
  if (!qkSwipeBound) { bindQuickSwipe(); qkSwipeBound = true; }
}

function renderQuickCard() {
  if (qkIndex >= qkCardData.length) {
    finishQuickMode(); return;
  }
  var card = $("qk-card");
  card.classList.remove("swipe-left", "swipe-right", "dragging");
  card.style.transform = "translateX(0) rotate(0deg)";
  card.style.opacity = "1";
  var d = qkCardData[qkIndex];
  card.innerHTML = '<div class="qk-card-num">' + (qkIndex + 1) + ' / 10</div>' +
    '<div class="qk-card-text">' + d.text + '</div>' +
    '<div class="qk-card-hint">← 左滑：拒绝/警惕 &nbsp;|&nbsp; 右滑：接受/行动 →</div>';
  $("qk-score").textContent = qkScore + " 分";
}

function bindQuickSwipe() {
  var card = $("qk-card");
  // 触摸事件
  card.addEventListener("touchstart", onQuickTouchStart, { passive: false });
  card.addEventListener("touchmove", onQuickTouchMove, { passive: false });
  card.addEventListener("touchend", onQuickTouchEnd);

  // 鼠标事件 — mousemove/mouseup 绑在 document 上，防止拖出卡片后失灵
  card.addEventListener("mousedown", function(e) {
    e.preventDefault();
    qkStartX = e.clientX;
    qkDragging = true;
    card.classList.add("dragging");
  });
  document.addEventListener("mousemove", onQuickMouseMove);
  document.addEventListener("mouseup", onQuickMouseUp);
}

function onQuickTouchStart(e) {
  var card = $("qk-card");
  qkStartX = e.touches[0].clientX;
  qkDragging = true;
  card.classList.add("dragging");
}

function onQuickTouchMove(e) {
  e.preventDefault(); // 阻止浏览器滚动/回弹
  if (!qkDragging) return;
  var dx = e.touches[0].clientX - qkStartX;
  var card = $("qk-card");
  card.style.transform = "translateX(" + dx + "px) rotate(" + (dx * 0.05) + "deg)";
  $("qk-hint-l").style.opacity = dx < -30 ? "1" : "0.4";
  $("qk-hint-r").style.opacity = dx > 30 ? "1" : "0.4";
}

function onQuickTouchEnd(e) {
  var card = $("qk-card");
  qkDragging = false;
  card.classList.remove("dragging");
  var dx = e.changedTouches[0].clientX - qkStartX;
  if (dx < -80) swipeQuickCard("left");
  else if (dx > 80) swipeQuickCard("right");
  else { card.style.transform = "translateX(0) rotate(0deg)"; $("qk-hint-l").style.opacity = $("qk-hint-r").style.opacity = "0.4"; }
}

function onQuickMouseMove(e) {
  if (!qkDragging) return;
  var card = $("qk-card");
  var dx = e.clientX - qkStartX;
  card.style.transform = "translateX(" + dx + "px) rotate(" + (dx * 0.05) + "deg)";
  $("qk-hint-l").style.opacity = dx < -30 ? "1" : "0.4";
  $("qk-hint-r").style.opacity = dx > 30 ? "1" : "0.4";
}

function onQuickMouseUp(e) {
  if (!qkDragging) return;
  qkDragging = false;
  var card = $("qk-card");
  card.classList.remove("dragging");
  var dx = e.clientX - qkStartX;
  if (dx < -80) swipeQuickCard("left");
  else if (dx > 80) swipeQuickCard("right");
  else { card.style.transform = "translateX(0) rotate(0deg)"; $("qk-hint-l").style.opacity = $("qk-hint-r").style.opacity = "0.4"; }
}

function swipeQuickCard(dir) {
  var card = $("qk-card");
  var d = qkCardData[qkIndex];
  if (dir === "left") { // 拒绝/警惕
    card.classList.add("swipe-left");
    qkScore += d.left.score;
    showQuickToast(d.left.react, "#07C160");
  } else { // 接受/行动
    card.classList.add("swipe-right");
    qkScore += d.right.score;
    showQuickToast(d.right.react, d.right.score < 0 ? "#DC143C" : "#07C160");
  }
  $("qk-score").textContent = qkScore + " 分";
  qkIndex++;
  setTimeout(renderQuickCard, 350);
}

function showQuickToast(msg, color) {
  var t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  t.style.cssText = "border-color:" + color + ";color:" + color + ";font-weight:600;";
  $("phone").appendChild(t);
  setTimeout(function() { t.classList.add("show"); });
  setTimeout(function() { t.classList.remove("show"); setTimeout(function() { if (t.parentNode) t.remove(); }, 300); }, 2000);
}

function finishQuickMode() {
  // 先重置卡片位置（之前可能处于 swipe 动画后的隐藏状态）
  var card = $("qk-card");
  card.classList.remove("swipe-left", "swipe-right", "dragging");
  card.style.transform = "translateX(0) rotate(0deg)";
  card.style.opacity = "1";
  // 切换 UI：隐藏卡片/提示，显示结果区域
  $("qk-title").textContent = "🏆 测试完成";
  $("qk-desc").style.display = "none";
  $("qk-card-wrap").style.display = "none";
  // 结果评分
  var verdict, color;
  if (qkScore >= 8) { verdict = "🛡️ 反诈达人！你几乎没给骗子机会"; color = "#07C160"; }
  else if (qkScore >= 5) { verdict = "⚠️ 基本清醒，但有几个破绽没挡住"; color = "#ff9f43"; }
  else { verdict = "🔴 当心了！这波大概率会被套牢"; color = "#DC143C"; }
  $("qk-result-score").textContent = qkScore;
  $("qk-result-verdict").textContent = verdict;
  $("qk-result-verdict").style.color = color;
  $("qk-result-detail").textContent = (qkScore >= 8
    ? "你对常见诈骗话术有很强的辨别力，请继续保持警惕！"
    : qkScore >= 5
    ? "有一些诈骗套路你还不太熟悉，建议多了解反诈知识。"
    : "看起来你对很多诈骗手段缺乏警觉，强烈建议学习一下防骗技巧。");
  $("qk-result").style.display = "";
  if (qkScore >= 8) audioSFX("taskComplete");
}

/* 重新开始快速模式 */
function restartQuickMode() {
  qkIndex = 0; qkScore = 0;
  qkCardData = shuffleCards(QUICK_CARDS.slice()).slice(0, 10);
  // 恢复答题 UI
  $("qk-title").textContent = "⚡ 快速模式 · 骗术判断";
  $("qk-desc").style.display = "";
  $("qk-card-wrap").style.display = "";
  $("qk-result").style.display = "none";
  $("qk-score").textContent = "0 分";
  $("qk-hint-l").style.opacity = "0.4";
  $("qk-hint-r").style.opacity = "0.4";
  renderQuickCard();
}

/* 退出快速模式，回到开场警示页 */
function exitQuickToWarn() {
  hide("quick-overlay");
  $("warn-screen").style.display = "";
}

/* 通用：洗牌函数 */
function shuffleCards(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

/* ---------------- 启动：先尝试恢复进度 ---------------- */
loadProgress();
