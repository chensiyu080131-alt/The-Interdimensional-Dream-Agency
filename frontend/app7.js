/* 异次元梦想局 · V7.0 逻辑层
 * 任务驱动 · 身份系统 · 多角色对话 · 反卧底 AI · 身份专属结局
 */

/* ---------------- 状态 ---------------- */
const S = {
  idKey: null,        // 身份 key
  story: null,        // 当前 STORIES[idKey]
  node: null,         // 当前对话节点 id
  activeConv: null,   // 当前打开的对话对象 key
  day: 1,
  suspicion: 0,       // 骗子怀疑度（反卧底）
  evidence: 0,        // 已固定证据数
  tasks: {},          // { taskId: 'pending'|'active'|'completed' }
  convs: {},          // { actorKey: { unread:bool, messages:[{who,text,psy}] } }
  ending: null,
  history: [],        // 时间线（回放用）
};

/* ---------------- DOM ---------------- */
const $ = (id) => document.getElementById(id);
const show = (id) => $(id).classList.add("show");
const hide = (id) => $(id).classList.remove("show");
const shuffle = (arr) => { const a = arr.slice(); for (let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; };
const stars = (n) => "★".repeat(n) + "☆".repeat(5-n);

/* ---------------- 开场警示 ---------------- */
$("warn-agree").addEventListener("click", () => { $("warn-screen").style.display = "none"; assignIdentity(); });
$("warn-disagree").addEventListener("click", () => { $("warn-screen").innerHTML = '<div class="warn-inner"><h1>已退出</h1><p style="text-align:center">感谢你的谨慎。反诈，从警惕开始。</p></div>'; });

/* ---------------- 身份分配（随机） ---------------- */
function assignIdentity() {
  const keys = Object.keys(IDENTITIES);
  const key = keys[(Math.random() * keys.length) | 0];
  S.idKey = key;
  renderIdentityCard(key);
}

function renderIdentityCard(key) {
  const id = IDENTITIES[key];
  $("idcard-avatar").textContent = id.avatar;
  $("idcard-avatar").style.background = id.color;
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
$("idcard-reroll").addEventListener("click", assignIdentity);
$("idcard-start").addEventListener("click", () => { hide("identity-overlay"); startGame(); });

/* ---------------- 开始游戏 ---------------- */
function startGame() {
  const id = IDENTITIES[S.idKey];
  S.story = STORIES[S.idKey];
  S.node = S.story.start;
  S.day = 1; S.suspicion = 0; S.evidence = 0;
  S.ending = null; S.history = [];
  S.tasks = {};
  S.story.tasks.forEach((t, i) => { S.tasks[t.id] = (t.cond ? "pending" : "active"); });
  // 初始化对话列表
  S.convs = {};
  S.story.actors.forEach(a => { S.convs[a] = { unread: false, messages: [] }; });

  $("game-root").classList.remove("hidden");
  $("stage-scene").textContent = S.story.scene;
  $("btn-exit").classList.remove("hidden");
  updateTopbar();
  // 打开首个说话者的对话
  const first = S.story.nodes[S.node];
  openConversation(first.speaker, true);
  playNode(S.node);
}

/* ---------------- 顶部状态栏 ---------------- */
function updateTopbar() {
  const id = IDENTITIES[S.idKey];
  $("top-codename").textContent = id.codename;
  $("top-day").textContent = "第 " + S.day + " 天";
  const active = S.story.tasks.find(t => S.tasks[t.id] === "active");
  $("top-task").textContent = active ? ("🎯 " + active.title) : "🎯 —";
  // 暴露/怀疑（模糊呈现）
  const expo = Math.min(100, S.suspicion);
  $("susp-fill").style.width = expo + "%";
  $("susp-label").textContent = expo >= ANTI_UNDERCOVER.threshold ? "危险" : expo >= 30 ? "警觉" : "安全";
  $("susp-label").style.color = expo >= ANTI_UNDERCOVER.threshold ? "#DC143C" : expo >= 30 ? "#FFD700" : "#07C160";
}

/* ---------------- 对话列表（多角色） ---------------- */
function renderConvList() {
  const box = $("conv-list");
  box.innerHTML = "";
  S.story.actors.forEach(k => {
    const a = ACTORS[k];
    const c = S.convs[k];
    const last = c.messages.length ? c.messages[c.messages.length-1].text : a.tagline;
    const row = document.createElement("div");
    row.className = "conv-row" + (k === S.activeConv ? " active" : "");
    row.innerHTML = `
      <div class="conv-av" style="background:${a.color}">${a.avatar}</div>
      <div class="conv-mid">
        <div class="conv-name">${a.name} <span class="conv-role">${a.role}</span></div>
        <div class="conv-last">${last}</div>
      </div>
      ${c.unread ? '<span class="conv-dot"></span>' : ''}`;
    row.addEventListener("click", () => { hide("convlist-overlay"); openConversation(k, false); });
    box.appendChild(row);
  });
  show("convlist-overlay");
}

function openConversation(key, silent) {
  S.activeConv = key;
  S.convs[key].unread = false;
  const a = ACTORS[key];
  $("chat-title").textContent = a.name;
  $("chat-sub").textContent = a.role + " · " + a.tagline;
  $("chat-title").style.color = "#fff";
  $("chat-av").textContent = a.avatar;
  $("chat-av").style.background = a.color;
  // 重绘该对话的历史消息
  const area = $("chat-area");
  area.innerHTML = "";
  S.convs[key].messages.forEach(m => appendBubble(m.who, m.text, m.psy, false));
  area.scrollTop = area.scrollHeight;
  // 若当前节点属于该说话者，显示选项；否则显示“无进行中对话”提示
  const node = S.story.nodes[S.node];
  if (!S.ending && node && node.speaker === key) {
    renderOptions(node);
  } else {
    $("options-bar").innerHTML = S.ending ? "" : '<div class="wait-tip">这里暂无新进展，去看看别的对话或任务。</div>';
  }
}

/* ---------------- 播放一个对话节点 ---------------- */
function playNode(nodeId) {
  const node = S.story.nodes[nodeId];
  if (!node) return;
  S.node = nodeId;
  if (node.day && node.day !== S.day) { S.day = node.day; }
  const spk = node.speaker;
  // 若说话者不是当前打开对话，标记未读并提示切换
  if (spk !== S.activeConv) {
    S.convs[spk].unread = true;
    renderConvList();
  }
  // 任务发放（进入节点即发放，如 grant 在节点上）
  if (node.grant) completeTask(node.grant);
  // 打字机效果
  showTyping();
  setTimeout(() => {
    hideTyping();
    pushMessage(spk, "ai", node.text, node.phase);
    // 记录时间线
    S.history.push({ day: node.day, who: ACTORS[spk].name, phase: node.phase, text: node.text });
    updateTopbar();
    if (spk === S.activeConv) renderOptions(node);
  }, 650);
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
  (node.options || []).forEach(opt => {
    const b = document.createElement("button");
    b.className = "opt-btn";
    const t = TONE[opt.tone] || TONE.neutral;
    b.innerHTML = `<span class="otype ${t.cls}">${t.label}</span>${opt.text}`;
    b.addEventListener("click", () => chooseOption(opt));
    bar.appendChild(b);
  });
  // 自由输入（非结局节点）
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

/* ---------------- 处理自由文本（触发反卧底检测） ---------------- */
function handleFreeText(text, node) {
  pushMessage(S.activeConv, "me", text, null);
  // 反卧底关键词检测（仅对骗子类对象生效）
  const target = ACTORS[S.activeConv];
  let added = 0, warnLine = null;
  if (target && (target.type === "target" || target.type === "accomplice")) {
    for (const rule of ANTI_UNDERCOVER.keywords) {
      if (rule.re.test(text)) { added = Math.max(added, rule.add); warnLine = rule.line; }
    }
    if (!added) { added = ANTI_UNDERCOVER.overQuestion.add; } // 自由发问默认略增怀疑
  }
  if (added) bumpSuspicion(added);
  setTimeout(() => {
    if (warnLine) {
      pushMessage(S.activeConv, "ai", warnLine, "反卧底·警觉");
      checkExposed();
    }
    // 自由输入后仍沿用默认后继（第一个非结局选项）
    const cont = node.options.find(o => o.next);
    if (S.ending) return;
    if (cont && cont.next) setTimeout(() => playNode(cont.next), 500);
  }, 500);
}

/* ---------------- 选择一个预设选项 ---------------- */
function chooseOption(opt) {
  pushMessage(S.activeConv, "me", opt.text, null);
  if (opt.grant) completeTask(opt.grant);
  if (opt.evidence) { S.evidence++; toast("📎 已固定 1 项证据（共 " + S.evidence + " 项）"); }
  if (opt.susp) bumpSuspicion(opt.susp);
  $("options-bar").innerHTML = "";
  if (opt.ending) { setTimeout(() => triggerEnding(opt.ending), 700); return; }
  if (checkExposed()) return;
  if (opt.next) setTimeout(() => playNode(opt.next), 550);
}

/* ---------------- 怀疑度 & 暴露判定 ---------------- */
function bumpSuspicion(n) { S.suspicion = Math.min(120, S.suspicion + n); updateTopbar(); }
function checkExposed() {
  if (S.suspicion >= ANTI_UNDERCOVER.threshold) {
    // 需要身份不是普通网友/志愿者时才算“暴露”致命
    const id = IDENTITIES[S.idKey];
    if (["hunter","scribe","mole","seeker"].includes(id.id)) {
      const exposedEnding = { hunter:"hunter_B", scribe:"scribe_B", mole:"mole_B", seeker:"seek_C" }[id.id];
      pushMessage(S.activeConv, "ai", "（对方沉默了几秒，随即清空了聊天记录……）", "身份暴露");
      setTimeout(() => triggerEnding(exposedEnding), 900);
      return true;
    }
  }
  return false;
}

/* ---------------- 任务系统 ---------------- */
function completeTask(taskId) {
  if (S.tasks[taskId] === "completed") return;
  S.tasks[taskId] = "completed";
  const t = S.story.tasks.find(x => x.id === taskId);
  if (t) toast("✅ 任务完成：" + t.title);
  // 解锁依赖它的下一个任务
  S.story.tasks.forEach(x => { if (x.cond === taskId && S.tasks[x.id] === "pending") S.tasks[x.id] = "active"; });
  updateTopbar();
}
function renderTasks() {
  const box = $("task-list");
  const id = IDENTITIES[S.idKey];
  box.innerHTML = S.story.tasks.map((t, i) => {
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
  $("status-body").innerHTML = `
    <div class="st-row"><span>身份</span><b style="color:${id.color}">${id.codename} · ${id.role}</b></div>
    <div class="st-row"><span>进度</span><b>第 ${S.day} 天 / 共 ${id.days} 天</b></div>
    <div class="st-row"><span>骗子怀疑度</span><b style="color:${expo>=ANTI_UNDERCOVER.threshold?'#DC143C':expo>=30?'#FFA500':'#07C160'}">${expo>=ANTI_UNDERCOVER.threshold?'危险':expo>=30?'警觉':'安全'}</b></div>
    <div class="st-row"><span>已固定证据</span><b>${S.evidence} 项</b></div>
    <div class="st-tip">提示：${id.handler ? "越是任务在身，越要“像个真人”——不要问得太细，也不要太配合。" : "任何让你“先充钱”的机会，都是陷阱。"}</div>`;
  show("status-overlay");
}

/* ---------------- 档案面板 ---------------- */
function renderProfile() {
  const id = IDENTITIES[S.idKey];
  $("profile-body").innerHTML = `
    <div class="pf-hd"><div class="pf-av" style="background:${id.color}">${id.avatar}</div>
      <div><div class="pf-name">${id.name}</div><div class="pf-code">代号 ${id.codename} · ${id.role}</div>
      <div class="pf-star" style="color:${id.color}">${stars(id.star)}</div></div></div>
    <div class="pf-sec"><b>任务</b>${id.mission}</div>
    <div class="pf-sec"><b>风险</b>${id.danger}</div>
    <div class="pf-sec"><b>联络人</b>${id.handler ? id.handler.name + "（" + id.handler.desc + "）" : "无"}</div>
    <div class="pf-oath">${id.oath}</div>`;
  show("profile-overlay");
}

/* ---------------- 消息 & 气泡 ---------------- */
function pushMessage(convKey, who, text, phase) {
  S.convs[convKey].messages.push({ who, text, psy: phase });
  if (convKey === S.activeConv) appendBubble(who, text, phase, true);
}
function appendBubble(who, text, phase, scroll) {
  const area = $("chat-area");
  const m = document.createElement("div");
  m.className = "msg " + who;
  m.innerHTML = `<div class="bubble">${text}</div>${phase ? `<span class="tag">${phase}</span>` : ""}`;
  area.appendChild(m);
  if (scroll) area.scrollTop = area.scrollHeight;
}
function showTyping() {
  if (S.story.nodes[S.node].speaker !== S.activeConv) return;
  const area = $("chat-area");
  const m = document.createElement("div");
  m.className = "msg ai"; m.id = "typing-msg";
  m.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
  area.appendChild(m); area.scrollTop = area.scrollHeight;
}
function hideTyping() { const t = $("typing-msg"); if (t) t.remove(); }

/* ---------------- Toast ---------------- */
let toastTimer = null;
function toast(text) {
  const el = $("toast");
  el.textContent = text; el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
}

/* ---------------- 结局 ---------------- */
function triggerEnding(endKey) {
  S.ending = endKey;
  const end = S.story.endings[endKey];
  $("options-bar").innerHTML = "";
  // 崩塌动画（坏结局才震屏）
  if (!end.good) { $("phone").classList.add("shake"); setTimeout(()=>$("phone").classList.remove("shake"), 500); }
  const id = IDENTITIES[S.idKey];
  $("ending-badge").textContent = end.good ? "任务完成" : "任务失败";
  $("ending-badge").style.background = end.good ? "#07C160" : "#DC143C";
  $("ending-title").textContent = end.title;
  $("ending-text").textContent = end.text;
  $("ending-review").innerHTML = `<b>复盘</b>${end.review}`;
  // 评分
  const done = Object.values(S.tasks).filter(x=>x==="completed").length;
  let score = Math.round((done / S.story.tasks.length) * 60) + (end.good ? 30 : 0) + Math.max(0, 10 - Math.floor(S.suspicion/12));
  score = Math.max(5, Math.min(100, score));
  $("ending-score").textContent = score + " 分";
  $("ending-score").style.color = end.good ? "#07C160" : "#FFA500";
  $("ending-stats").innerHTML = `
    <div class="es"><span>${done}/${S.story.tasks.length}</span>任务</div>
    <div class="es"><span>${S.evidence}</span>证据</div>
    <div class="es"><span>${S.day}</span>天</div>
    <div class="es"><span>${Math.min(100,S.suspicion)}</span>怀疑度</div>`;
  show("ending-overlay");
}
$("ending-timeline").addEventListener("click", renderTimeline);
$("ending-toolbox").addEventListener("click", renderToolbox);
$("ending-restart").addEventListener("click", () => { hideAll(); resetAndRestart(); });

/* ---------------- 时间线回放 ---------------- */
function renderTimeline() {
  $("timeline-list").innerHTML = S.history.map(n => `
    <div class="tl-item"><div class="tl-dot"></div>
      <div class="tl-day">第 ${n.day||"?"} 天 · ${n.who}</div>
      <div class="tl-phase">${n.phase||""}</div>
      <div class="tl-text">${n.text}</div></div>`).join("");
  show("timeline-overlay");
}
$("timeline-close").addEventListener("click", () => hide("timeline-overlay"));

/* ---------------- 工具箱 ---------------- */
function renderToolbox() {
  $("toolbox-list").innerHTML = TOOLBOX.map(t => `
    <div class="tool-item"><div class="tool-ic">${t.ic}</div><div class="tool-txt"><h4>${t.t}</h4><p>${t.d}</p></div></div>`).join("");
  $("kw-cloud").innerHTML = KEYWORDS.map(k => `<span class="kw">${k}</span>`).join("");
  show("toolbox-overlay");
}
$("toolbox-close").addEventListener("click", () => hide("toolbox-overlay"));

/* ---------------- 底部功能栏 ---------------- */
$("nav-conv").addEventListener("click", renderConvList);
$("nav-task").addEventListener("click", renderTasks);
$("nav-status").addEventListener("click", renderStatus);
$("nav-profile").addEventListener("click", renderProfile);
$("convlist-close").addEventListener("click", () => hide("convlist-overlay"));
$("task-close").addEventListener("click", () => hide("task-overlay"));
$("status-close").addEventListener("click", () => hide("status-overlay"));
$("profile-close").addEventListener("click", () => hide("profile-overlay"));

/* ---------------- 退出 / 重开 ---------------- */
function hideAll() {
  ["identity-overlay","ending-overlay","timeline-overlay","toolbox-overlay",
   "convlist-overlay","task-overlay","status-overlay","profile-overlay"].forEach(hide);
}
function resetAndRestart() {
  S.idKey = null; S.story = null; S.ending = null;
  $("game-root").classList.add("hidden");
  assignIdentity();
}
$("btn-exit").addEventListener("click", () => {
  if (confirm("退出当前任务？进度不会保存。")) { hideAll(); resetAndRestart(); }
});

/* ---------------- 启动 ---------------- */
/* 等待用户点击“开始体验”（在警示页） */
