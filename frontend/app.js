/* 异次元梦想局 · V5.0 逻辑层 */

/* ---------- 状态 ---------- */
const State = {
  roleKey: null, scriptKey: null, currentRound: null,
  expose: 0, trust: 50, help: 50,
  timeline: [], route: null, lossAmount: 0,
  stopDone: 0,
};

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);
const navTitle = $("nav-title");
const btnBack = $("btn-back");
const btnExit = $("btn-exit");

/* ---------- 工具 ---------- */
const save = () => { try { localStorage.setItem("yzj_state", JSON.stringify(State)); } catch(e){} };
const showOverlay = (id) => $(id).classList.add("show");
const hideOverlay = (id) => $(id).classList.remove("show");
const shuffle = (arr) => { const a = arr.slice(); for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };

/* ---------- 开场警示 ---------- */
$("warn-agree").addEventListener("click", () => { $("warn-screen").style.display="none"; renderRoles(); });
$("warn-disagree").addEventListener("click", () => { $("warn-screen").innerHTML = '<h1>已退出</h1><p style="text-align:center;">感谢你的谨慎。反诈从警惕开始。</p>'; });

/* ---------- 第零幕：角色选择 ---------- */
function renderRoles() {
  const grid = $("role-grid");
  grid.innerHTML = "";
  const keys = shuffle(Object.keys(ROLES));
  keys.forEach(key => {
    const r = ROLES[key];
    const card = document.createElement("div");
    card.className = "role-card";
    card.dataset.key = key;
    card.innerHTML = `
      <div class="role-avatar" style="background:${r.color}">${r.avatar}</div>
      <div class="role-name">${r.name} · ${r.age}</div>
      <div class="role-meta">${r.job}</div>
      <span class="role-line-tag" style="background:${r.color}">${r.line}</span>`;
    card.addEventListener("click", () => showRoleDetail(key));
    grid.appendChild(card);
  });
  $("stage-roles").classList.remove("hidden");
  $("stage-chat").classList.add("hidden");
  navTitle.textContent = "异次元梦想局";
  btnBack.classList.add("hidden");
  btnExit.classList.add("hidden");
}

function showRoleDetail(key) {
  const r = ROLES[key];
  const panel = document.createElement("div");
  panel.className = "overlay show";
  panel.innerHTML = `
    <div class="panel role-detail-card">
      <div class="rd-avatar" style="background:${r.color}">${r.avatar}</div>
      <div class="rd-name">${r.name} · ${r.age}岁</div>
      <div style="text-align:center;"><span class="rd-line" style="background:${r.color}">将遭遇：${r.line}</span></div>
      <div class="rd-section"><b>人物小传：</b>${r.profile}</div>
      <div class="rd-section"><b>核心焦虑：</b>${r.anxiety}</div>
      <div class="rd-stats">${r.tags.map(t=>`<span class="rd-stat">${t}</span>`).join("")}</div>
      <button class="panel-btn" id="rd-confirm">选择 ${r.name}，开始这段旅程</button>
      <button class="case-close-btn" id="rd-cancel" style="background:#eee;color:#666;">再看看</button>
    </div>`;
  document.body.appendChild(panel);
  $("rd-confirm").addEventListener("click", () => { panel.remove(); startRole(key); });
  $("rd-cancel").addEventListener("click", () => panel.remove());
}

/* ---------- 开始角色 → 第一幕 ---------- */
function startRole(key) {
  const r = ROLES[key];
  State.roleKey = key;
  State.scriptKey = r.lineKey;
  State.currentRound = SCRIPTS[r.lineKey].start;
  State.expose = 0; State.trust = 50; State.help = 50;
  State.timeline = []; State.route = null; State.lossAmount = 0; State.stopDone = 0;
  save();
  $("stage-roles").classList.add("hidden");
  $("stage-chat").classList.remove("hidden");
  $("chat-area").innerHTML = "";
  navTitle.textContent = r.name + " · 新的朋友";
  btnBack.classList.remove("hidden");
  btnExit.classList.remove("hidden");
  updateValues();
  renderRound(State.currentRound);
}

/* ---------- 第一幕：渲染一轮对话 ---------- */
function renderRound(roundId) {
  const rd = SCRIPTS[State.scriptKey].rounds[roundId];
  if (!rd) return;
  State.currentRound = roundId;
  showTyping();
  setTimeout(() => {
    hideTyping();
    appendMsg("ai", rd.content, rd.tag);
    State.expose = Math.min(100, State.expose + (rd.expose || 0));
    updateValues();
    const phaseName = phaseOf(rd.day);
    if (rd.day) {
      const last = State.timeline[State.timeline.length - 1];
      if (!last || last.day !== rd.day) {
        State.timeline.push({ day: rd.day, text: rd.content, psy: rd.psy, phase: phaseName });
      }
    }
    save();
    renderOptions(rd);
  }, 700);
}

function phaseOf(day) { return day===1?"寻猪":day===2?"诱猪":day===3?"养猪":day>=4?"杀猪":""; }

function renderOptions(rd) {
  const bar = $("options-bar");
  bar.innerHTML = "";
  // 动态生成 3-4 个选项（按类型排序，模拟 AI 实时策略）
  const opts = rd.options.slice();
  opts.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "opt-btn";
    const cls = { warm:"opt-warm", neutral:"opt-neutral", cautious:"opt-cautious", extreme:"opt-extreme", counter:"opt-counter" }[opt.type] || "opt-neutral";
    const label = { warm:"热情", neutral:"中性", cautious:"谨慎", extreme:"拒绝", counter:"反骗" }[opt.type] || "";
    btn.innerHTML = `<span class="otype ${cls}">${label}</span>${opt.text}`;
    btn.addEventListener("click", () => chooseOption(opt));
    bar.appendChild(btn);
  });
  // 自由输入（非最终收割轮才显示）
  if (!rd.options.find(o => o.route === "scam" || o.route === "safe")) {
    const row = document.createElement("div");
    row.className = "free-row";
    row.innerHTML = `<input class="free-input" id="free-input" placeholder="也可自己打字（真实信息将被隐藏）"/><button class="free-send" id="free-send">发送</button>`;
    bar.appendChild(row);
    $("free-send").addEventListener("click", () => {
      const v = $("free-input").value.trim();
      if (!v) return;
      appendMsg("me", maskRealInfo(v));
      State.help = Math.max(0, State.help - 1);
      State.expose = Math.min(100, State.expose + 6);
      updateValues();
      const next = rd.options[0]?.next;
      setTimeout(() => { if (next) renderRound(next); else endChat(rd.options[0]); }, 400);
    });
  }
}

function maskRealInfo(text) {
  let t = text;
  t = t.replace(/(1[3-9]\d{9})/g, "【手机号已隐藏】");
  t = t.replace(/(\d{15,18}[Xx]?)/g, "【身份证已隐藏】");
  t = t.replace(/(我的名字是\S+|我叫\S+|我家住\S+)/g, "【隐私已隐藏】");
  return t;
}

function chooseOption(opt) {
  appendMsg("me", opt.text);
  State.trust = Math.max(0, Math.min(100, State.trust + (opt.trust || 0)));
  State.help = Math.max(0, Math.min(100, State.help + (opt.help || 0)));
  if (opt.exposeAdd) { State.expose = Math.min(100, State.expose + opt.exposeAdd); }
  updateValues();
  save();
  if (opt.route) { endChat(opt); return; }
  if (opt.next) setTimeout(() => renderRound(opt.next), 400);
}

function updateValues() {
  $("expose-fill").style.width = State.expose + "%";
  $("expose-value").textContent = State.expose + "%";
  $("trust-fill").style.width = State.trust + "%";
  $("trust-value").textContent = State.trust;
  $("help-fill").style.width = State.help + "%";
  $("help-value").textContent = State.help;
}

/* ---------- 聊天气泡 / 正在输入 ---------- */
function appendMsg(who, text, tag) {
  const m = document.createElement("div");
  m.className = "msg " + who;
  m.innerHTML = `<div class="bubble">${text}</div>${tag ? `<span class="tag">${tag}</span>` : ""}`;
  const area = $("chat-area");
  area.appendChild(m);
  area.scrollTop = area.scrollHeight;
}
function showTyping() {
  const m = document.createElement("div");
  m.className = "msg ai"; m.id = "typing-msg";
  m.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
  $("chat-area").appendChild(m);
  $("chat-area").scrollTop = $("chat-area").scrollHeight;
}
function hideTyping() { const t = $("typing-msg"); if (t) t.remove(); }

/* ---------- 第一幕结束 → 第二幕 ---------- */
function endChat(opt) {
  State.route = opt.route || "safe";
  $("options-bar").innerHTML = "";
  save();
  if (State.route === "scam") {
    const income = ROLE_INCOME[State.roleKey] || 8000;
    State.lossAmount = Math.round(income * (SCRIPTS[State.scriptKey].lossFactor || 4) * (1 + State.expose/200));
    if (State.lossAmount < 2000) State.lossAmount = 2000;
    triggerShatter(() => showCollapse());
  } else if (State.route === "safe") {
    appendMsg("ai", "（对方不再回复你的消息……）");
    setTimeout(() => showSafeEnding(), 600);
  } else {
    appendMsg("ai", "（你保持了警惕，没有继续对话）");
    setTimeout(() => showSafeEnding(), 600);
  }
}

function triggerShatter(cb) {
  const layer = $("shatter-layer");
  layer.classList.add("active");
  $("phone").classList.add("shake");
  setTimeout(() => { layer.classList.remove("active"); $("phone").classList.remove("shake"); cb && cb(); }, 1000);
}

/* ---------- 第二幕：崩塌 ---------- */
function showCollapse() {
  const r = ROLES[State.roleKey];
  $("collapse-title").textContent = "第二幕 · 崩塌";
  $("collapse-head").textContent = `💔 你被骗走约 ${State.lossAmount.toLocaleString()} 元`;
  $("fin-loss").textContent = "¥" + State.lossAmount.toLocaleString();
  $("collapse-body").innerHTML = `
    <div class="fin-row"><span class="label">你投入的本金</span><span class="val">¥${State.lossAmount.toLocaleString()}</span></div>
    <div class="fin-row"><span class="label">对方承诺收益</span><span class="val" style="color:#999">¥0（虚假）</span></div>
    <div class="fin-row"><span class="label">实际追回</span><span class="val" style="color:#e64340">¥0</span></div>
    <div class="fin-gap">钱没了，更可怕的是——<br/>你暴露给骗子的信息，可能被转卖、被用于二次诈骗。</div>`;
  $("mind-echo").innerHTML = `<div class="q">"我怎么会相信一个没见过面的人？"</div><div class="q">"我是不是太蠢了？"</div><div class="q">"如果当时我先问一句就好了……"</div>`;
  showOverlay("collapse-overlay");
}
$("collapse-case-btn").addEventListener("click", () => {
  const c = SCRIPTS[State.scriptKey].case;
  $("case-title").textContent = c.title;
  $("case-warn").textContent = "⚠️ " + c.warn;
  $("case-body").innerHTML = c.body.map(p => `<p>${p}</p>`).join("");
  showOverlay("case-overlay");
});
$("case-close-btn").addEventListener("click", () => hideOverlay("case-overlay"));
$("collapse-next").addEventListener("click", () => { hideOverlay("collapse-overlay"); showSocial(); });

/* ---------- 社交崩塌延伸 ---------- */
function showSocial() {
  const r = ROLES[State.roleKey];
  const msgs = [
    { who:"妈妈", t:"怎么最近不接电话？你爸问你钱是不是出问题了。" },
    { who:"同事", t:"听说你最近老请假，是出什么事了吗？" },
    { who:"朋友", t:"你之前借我的两万，什么时候能还？" },
  ];
  $("social-list").innerHTML = msgs.map(m => `<div class="social-msg"><div class="who">${m.who}</div>${m.t}</div>`).join("");
  showOverlay("social-overlay");
}
$("social-next").addEventListener("click", () => { hideOverlay("social-overlay"); showButterfly(); });

/* ---------- 蝴蝶效应 ---------- */
function showButterfly() {
  const friends = shuffle(BUTTERFLY_FRIENDS).slice(0, 3);
  const effects = [
    "也收到了同款'兼职'广告，已扫码入群",
    "看到你转发的'投资心得'，正在考虑跟进",
    "收到一条来自'你'的推荐链接，点开了",
    "被拉进了同一个'创业老板群'",
  ];
  $("butterfly-list").innerHTML = friends.map((f,i) => `
    <div class="bf-item"><div class="bf-av">!</div><div class="bf-txt"><b>${f}</b> ${effects[i % effects.length]}。<br/>你的选择，正在波及身边的人。</div></div>`).join("");
  showOverlay("butterfly-overlay");
}
$("butterfly-next").addEventListener("click", () => { hideOverlay("butterfly-overlay"); showAct(); });

/* ---------- 第三幕：行动 ---------- */
function showAct() { showOverlay("act-overlay"); }
$("act-alert").addEventListener("click", () => {
  hideOverlay("act-overlay");
  startIntervene("police");
});
$("act-stop").addEventListener("click", () => {
  hideOverlay("act-overlay");
  showStop();
});
$("act-support").addEventListener("click", () => {
  hideOverlay("act-overlay");
  alert("你不是犯错，你是被精心设计的受害者。\n可拨打心理援助热线 12320 转心理援助 / 400-161-9995（24小时）。\n\nAI 想对你说：" + supportLine());
  showTimeline();
});
$("act-family").addEventListener("click", () => {
  hideOverlay("act-overlay");
  showFamily();
});

function supportLine() {
  const r = ROLES[State.roleKey];
  return `「${r.name}，你已经很勇敢了。被骗不是因为你笨，而是因为对方研究过'怎么让人心软'。先呼吸，再求助，天不会塌。」`;
}

/* ---------- 止损清单 ---------- */
const STOP_ITEMS = ["立即冻结所有银行卡","修改所有支付密码","关闭所有免密支付","如开启过屏幕共享，立即挂断、拆卡、断网","保存聊天记录与转账凭证"];
function showStop() {
  State.stopDone = 0;
  $("stop-list").innerHTML = "";
  STOP_ITEMS.forEach((t, i) => {
    const el = document.createElement("div");
    el.className = "stop-item";
    el.innerHTML = `<div class="box"></div><span>${t}</span>`;
    el.addEventListener("click", () => {
      el.classList.toggle("done");
      el.querySelector(".box").textContent = el.classList.contains("done") ? "✓" : "";
      State.stopDone = document.querySelectorAll(".stop-item.done").length;
    });
    $("stop-list").appendChild(el);
  });
  showOverlay("stop-overlay");
}
$("stop-done").addEventListener("click", () => { hideOverlay("stop-overlay"); showTimeline(); });

/* ---------- 告诉家人 ---------- */
const FAMILY_LIST = ["妈妈","爸爸","伴侣","最好的朋友"];
function showFamily() {
  $("family-list").innerHTML = "";
  FAMILY_LIST.forEach(f => {
    const btn = document.createElement("button");
    btn.className = "opt-btn";
    btn.textContent = "告诉 " + f;
    btn.addEventListener("click", () => {
      hideOverlay("family-overlay");
      startIntervene("family", f);
    });
    $("family-list").appendChild(btn);
  });
  showOverlay("family-overlay");
}

/* ---------- 外部干预（银行/警方/家人/网友） ---------- */
function startIntervene(type, who) {
  const chat = $("iv-chat");
  chat.innerHTML = "";
  $("iv-options").innerHTML = "";
  let title = "", hint = "";
  if (type === "police") {
    title = "📞 96110 反诈民警";
    hint = "民警：您好，我是反诈中心民警，系统监测到您正在向可疑账户转账。";
    pushIv("iv", hint);
    pushOptions([
      { text:"我认识对方，没问题", next:()=>ivPolice2(false) },
      { text:"啊？我可能遇到骗子了", next:()=>ivPolice2(true) },
    ]);
  } else if (type === "family") {
    title = "💬 告诉 " + who;
    hint = who + "：怎么了？你最近状态不太对，是不是出事了？";
    pushIv("iv", hint);
    pushOptions([
      { text:"我……我被骗了", next:()=>ivFamily2(who, true) },
      { text:"没什么，别问了", next:()=>ivFamily2(who, false) },
    ]);
  }
  $("iv-title").textContent = title;
  $("iv-hint").textContent = "";
  showOverlay("intervene-overlay");
}
function pushIv(who, text) {
  const m = document.createElement("div");
  m.className = "iv-msg " + who;
  m.textContent = text;
  $("iv-chat").appendChild(m);
  $("iv-chat").scrollTop = $("iv-chat").scrollHeight;
}
function pushOptions(opts) {
  const bar = $("iv-options");
  bar.innerHTML = "";
  opts.forEach(o => {
    const b = document.createElement("button");
    b.className = "opt-btn"; b.textContent = o.text;
    b.addEventListener("click", () => { bar.innerHTML = ""; o.next(); });
    bar.appendChild(b);
  });
}
function ivPolice2(aware) {
  pushIv("iv", aware
    ? "民警：太好了，你很清醒！立刻停止转账，保存证据，挂断后可直接拨 110 核实我的身份。"
    : "民警：请立即停止任何转账！我们怀疑您正遭遇诈骗。挂断后请拨打 110 核实。您的钱还能拦住！");
  State.help = Math.min(100, State.help + 20);
  updateValues();
  pushOptions([{ text:"谢谢警官，我明白了", next:()=>{ hideOverlay("intervene-overlay"); showTimeline(); } }]);
}
function ivFamily2(who, told) {
  if (told) {
    pushIv("iv", who + "：傻孩子，钱没了可以再赚，人没事就好。我陪你去报警，咱们一起面对。");
    State.help = Math.min(100, State.help + 15);
  } else {
    pushIv("iv", who + "：你不说我也担心。不管什么事，别一个人扛，好吗？");
    State.help = Math.max(0, State.help - 5);
  }
  updateValues();
  pushOptions([{ text:"好", next:()=>{ hideOverlay("intervene-overlay"); showTimeline(); } }]);
}

/* ---------- 第四幕：时间线回放 ---------- */
function showTimeline() {
  const list = $("timeline-list");
  list.innerHTML = State.timeline.map((n, i) => `
    <div class="tl-item" data-i="${i}">
      <div class="tl-dot"></div>
      <div class="tl-day">第 ${n.day} 天</div>
      <div class="tl-phase">${n.phase}</div>
      <div class="tl-text">${n.text}</div>
      <div class="tl-psy">心理学手段：${n.psy}</div>
      <div class="tl-hint">点击模拟"如果当时你这样说……"</div>
    </div>`).join("");
  list.querySelectorAll(".tl-item").forEach(el => {
    el.addEventListener("click", () => openUniverse(parseInt(el.dataset.i)));
  });
  showOverlay("timeline-overlay");
}
$("timeline-next").addEventListener("click", () => { hideOverlay("timeline-overlay"); showReport(); });

/* ---------- 平行宇宙模拟 ---------- */
function openUniverse(i) {
  const node = State.timeline[i];
  $("uv-origin").innerHTML = `<div class="tl-phase" style="margin-bottom:6px;">第 ${node.day} 天 · ${node.phase}</div>
    <div style="font-size:14px;background:#f7f7f7;border-radius:8px;padding:10px;color:#333;">骗子：${node.text}</div>
    <div class="iv-hint">心理学手段：${node.psy}</div>`;
  $("uv-input").value = "";
  $("uv-result").style.display = "none";
  $("uv-result").innerHTML = "";
  showOverlay("universe-overlay");
}
$("uv-submit").addEventListener("click", () => {
  const v = $("uv-input").value.trim();
  if (!v) return;
  // 根据玩家替代回复，生成"另一种可能"的提示性结果
  const r = ROLES[State.roleKey];
  const alt = `如果当时你说："${v}"——\n\n骗子很可能先是一愣，随即换一套话术：要么制造紧迫感（"机会就这一次，你不信算了"），要么情感绑架（"我以为你和其他人不一样"）。\n\n但现实中，真正的反诈关键不在"怎么回"，而在"及时停"：一旦涉及钱、验证码、屏幕共享，立刻挂断、核实、求助。你这一句，已经比当时清醒了。`;
  const box = $("uv-result");
  box.textContent = alt;
  box.style.display = "block";
});
$("uv-back").addEventListener("click", () => { hideOverlay("universe-overlay"); showTimeline(); });

/* ---------- 第五幕：报告 ---------- */
function showReport() {
  let score = 100 - State.expose;
  if (State.route === "scam") score = Math.max(0, Math.round(score * 0.4));
  else score = Math.min(100, Math.round(score + 15));
  score = Math.max(0, Math.min(100, score));
  $("report-score").textContent = score + " 分";
  $("report-score").style.color = score >= 70 ? "#07c160" : score >= 40 ? "#f0a020" : "#e64340";
  const r = ROLES[State.roleKey];
  const verdict = State.route === "scam" ? "你没能挡住这场精心设计的'相遇'。" : "你守住了底线，没有被套路带走。";
  $("report-sub").textContent = `${r.name} · ${r.line} · ${verdict}`;
  const weakType = State.trust >= 65 ? "情感依赖型" : State.expose >= 60 ? "利益驱动型" : "权威服从型";
  $("report-rows").innerHTML = `
    <div class="report-row"><span class="k">信息暴露度</span><span class="v">${State.expose}%</span></div>
    <div class="report-row"><span class="k">情感投入（信任值）</span><span class="v">${State.trust >= 65 ? "深" : State.trust >= 40 ? "中" : "浅"}</span></div>
    <div class="report-row"><span class="k">求助意愿</span><span class="v">${State.help >= 70 ? "开放" : State.help <= 30 ? "封闭" : "一般"}</span></div>
    <div class="report-row"><span class="k">情感弱点类型</span><span class="v">${weakType}</span></div>
    <div class="report-row"><span class="k">结局</span><span class="v">${State.route === "scam" ? "被骗" : "安全脱身"}</span></div>
    <div class="report-row"><span class="k">损失</span><span class="v">${State.route === "scam" ? "¥" + State.lossAmount.toLocaleString() : "¥0"}</span></div>`;
  $("report-title").textContent = "你的反诈报告";
  showOverlay("report-overlay");
}
$("report-toolbox").addEventListener("click", () => { showToolbox(); });
$("report-restart").addEventListener("click", () => {
  hideOverlay("report-overlay");
  State.roleKey = null;
  renderRoles();
});

function showToolbox() {
  $("toolbox-list").innerHTML = TOOLBOX.map(t => `
    <div class="tool-item"><div class="tool-ic">${t.ic}</div><div class="tool-txt"><h4>${t.t}</h4><p>${t.d}</p></div></div>`).join("");
  $("kw-cloud").innerHTML = KEYWORDS.map(k => `<span class="kw">${k}</span>`).join("");
  showOverlay("toolbox-overlay");
}
$("toolbox-close").addEventListener("click", () => hideOverlay("toolbox-overlay"));

/* ---------- 安全结局 ---------- */
function showSafeEnding() {
  const r = ROLES[State.roleKey];
  showOverlay("report-overlay");
  let score = 100 - State.expose;
  score = Math.min(100, Math.round(score + 20));
  $("report-score").textContent = score + " 分";
  $("report-score").style.color = "#07c160";
  $("report-title").textContent = "🎉 你守住了";
  $("report-sub").textContent = `${r.name} · ${r.line} · 你保持了警惕，安全脱身`;
  $("report-rows").innerHTML = `
    <div class="report-row"><span class="k">信息暴露度</span><span class="v">${State.expose}%</span></div>
    <div class="report-row"><span class="k">结局</span><span class="v">未上钩</span></div>
    <div class="report-row"><span class="k">损失</span><span class="v">¥0</span></div>`;
}

/* ---------- 退出 / 返回 ---------- */
btnExit.addEventListener("click", () => {
  if (confirm("退出当前体验？进度将不会保存。")) {
    hideOverlay("collapse-overlay"); hideOverlay("case-overlay"); hideOverlay("social-overlay");
    hideOverlay("butterfly-overlay"); hideOverlay("act-overlay"); hideOverlay("stop-overlay");
    hideOverlay("family-overlay"); hideOverlay("intervene-overlay"); hideOverlay("timeline-overlay");
    hideOverlay("universe-overlay"); hideOverlay("report-overlay"); hideOverlay("toolbox-overlay");
    State.roleKey = null;
    renderRoles();
  }
});
btnBack.addEventListener("click", () => {
  if (confirm("退出当前角色，返回选择？")) { State.roleKey = null; renderRoles(); }
});

/* ---------- 启动 ---------- */
renderRoles();
