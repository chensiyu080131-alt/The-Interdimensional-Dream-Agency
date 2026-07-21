/* ============================================================
 * 反诈人生 · M3 心理弱点系统（GDD 5.2）
 * ------------------------------------------------------------
 *  - 5 类心理弱点：孤独 / 贪婪 / 虚荣 / 恐惧 / 急躁
 *  - 开局按身份分配主导弱点（WEAKNESS_BY_IDENTITY）
 *  - 关键节点注入「内心戏旁白」（第二人称半透明浮层），攻击玩家弱点
 *  - 弱点影响选项权重：命中玩家弱点的“配合”选项会被标记「戳中🔥」更显眼
 * ============================================================ */

const WEAKNESSES = {
  loneliness: {
    id: "loneliness", name: "孤独", emoji: "🌧",
    desc: "渴望陪伴与被理解，最容易被“灵魂伴侣”慢慢攻陷。",
    triggers: ["孤独", "陪", "一个人", "懂你", "灵魂伴侣", "聊得来", "合拍", "想你", "没人", "无聊"],
    monologues: [
      "（你有多久，没人和你这样聊天了？）",
      "（他说的话，正好戳中你心里空着的那块。）",
      "（有人懂你的感觉……真好。）",
    ],
  },
  greed: {
    id: "greed", name: "贪婪", emoji: "💰",
    desc: "想要“稳赚”“内部消息”，高收益话术最致命。",
    triggers: ["赚", "收益", "内部", "回报", "稳赚", "机会", "翻倍", "项目", "提现", "行情"],
    monologues: [
      "（这点收益，错过了会不会后悔？）",
      "（内部消息……真的假的？可万一呢？）",
      "（别人都赚到了，就你还在犹豫？）",
    ],
  },
  vanity: {
    id: "vanity", name: "虚荣", emoji: "👑",
    desc: "在意被羡慕、被认可，容易被“你值得更好”捧杀。",
    triggers: ["羡慕", "厉害", "优秀", "配得上", "精英", "高端", "眼光", "懂行", "特别"],
    monologues: [
      "（他好像，真的觉得你很特别。）",
      "（你值得更好的生活，不是吗？）",
      "（别人都羡慕你，别辜负这份运气。）",
    ],
  },
  fear: {
    id: "fear", name: "恐惧", emoji: "😨",
    desc: "怕出事、怕连累、怕失去，最容易被“紧急/保密”操控。",
    triggers: ["涉案", "通缉", "拘捕", "保密", "危险", "抓紧", "限时", "最后", "清查", "涉案"],
    monologues: [
      "（万一……说的是真的，怎么办？）",
      "（他说别告诉别人，是不是真的严重？）",
      "（再不动，就真的来不及了。）",
    ],
  },
  impatience: {
    id: "impatience", name: "急躁", emoji: "⏱",
    desc: "怕错过、想速成，最容易被“限时/赶紧”催促。",
    triggers: ["赶紧", "限时", "马上", "别磨蹭", "就这一次", "抓紧", "立刻", "逾期不候", "错过"],
    monologues: [
      "（机会就这一次，别磨蹭了。）",
      "（别人都冲了，你还等什么？）",
      "（再犹豫，就没你份了。）",
    ],
  },
};

/* 各身份主导弱点（开局分配） */
const WEAKNESS_BY_IDENTITY = {
  hunter: "fear",       // 卧底：最怕身份暴露
  scribe: "vanity",     // 记者：想写出轰动报道、被认可
  lighthouse: "loneliness", // 志愿者：想被需要
  drift: "loneliness",  // 普通网友：渴望陪伴
  seeker: "fear",       // 寻人：怕朋友出事
  teacher: "loneliness", // 退休教师：渴望陪伴
};

function assignWeakness(idKey) { return WEAKNESS_BY_IDENTITY[idKey] || "greed"; }

/* 判断某节点/选项文本是否命中指定弱点（返回 WEAKNESSES 项或 null） */
function weaknessHit(obj, wk) {
  if (!obj) return null;
  const w = WEAKNESSES[wk];
  if (!w) return null;
  const blob = (obj.phase || "") + " " + (obj.text || "");
  if (w.triggers.some((t) => blob.includes(t))) return w;
  return null;
}

/* 选项是否“戳中”玩家弱点（用于选项加权显眼） */
function weaknessAppeals(opt, wk) {
  return opt && opt.tone === "warm" && !!weaknessHit(opt, wk);
}

/* 内心戏旁白：第二人称半透明浮层，3.5 秒后自动淡出 */
let innerMonoTimer = null;
function showInnerMonologue(text) {
  const el = document.getElementById("inner-mono");
  if (!el || !text) return;
  el.textContent = text;
  el.classList.add("show");
  if (innerMonoTimer) clearTimeout(innerMonoTimer);
  innerMonoTimer = setTimeout(() => el.classList.remove("show"), 3600);
}
