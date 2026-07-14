/* 异次元梦想局 · V8.0 逻辑层
 * 五幕引擎（希望/崩塌/废墟/回放/盾牌）· 信任值 · 小雅救援 · 结局确定性判定 · 身份解锁 · 平行宇宙
 * V8.1：接入混元大模型 API，AI 实时生成对话
 */

/* ---------------- API 配置 ---------------- */
const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:3000"
  : "https://ai-d9gd4xji5de241243-1453144747.tcloudbaseapp.com/api";
const API_ENABLED = true; // 开关：是否启用 AI API（关掉则回退到预设话术）
const API_TIMEOUT = 30000; // 30 秒超时
// 保存上一次请求参数，用于重试
let _lastRequest = null;

/* ---------------- 状态 ---------------- */
const S = {
  idKey: null, story: null, node: null, activeConv: null,
  day: 1, act: "hope",
  suspicion: 0,        // 骗子怀疑度（反卧底，可见）
  trust: 50,           // 信任值 0-100（不可见，影响 AI 推进/结局）
  exposure: 0,         // 信息暴露度 0-4（定性）
  evidence: 0,
  xiaoya: 0,           // 小雅救援进度 0-3
  route: null,         // scammed/arrest/alert/expose/fail
  tasks: {},
  convs: {},
  ending: null, endingKey: null,
  history: [],         // 时间线
  ruinsDone: {},       // 第三幕已完成的行动
  unlocked: {},        // 已解锁身份
  finished: {},        // 已完成的线 {id: good}
};

const $ = (id) => document.getElementById(id);
const show = (id) => $(id).classList.add("show");
const hide = (id) => $(id).classList.remove("show");
const shuffle = (arr) => { const a = arr.slice(); for (let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; };
const stars = (n) => "★".repeat(n) + "☆".repeat(5-n);
const clamp = (v,min,max) => Math.max(min, Math.min(max, v));

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
$("warn-agree").addEventListener("click", () => { $("warn-screen").style.display = "none"; showIdentitySelect(); });
$("warn-disagree").addEventListener("click", () => { $("warn-screen").innerHTML = '<div class="warn-inner"><h1>已退出</h1><p style="text-align:center">感谢你的谨慎。反诈，从警惕开始。</p></div>'; });

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
      <div class="idopt-av" style="background:${ok? id.color : '#2a3150'}">${id.avatar}</div>
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
  S.idKey = key;
  renderIdentityCard(key);
}

/* ---------------- 身份卡 ---------------- */
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
$("idcard-reroll").addEventListener("click", () => { hide("identity-overlay"); showIdentitySelect(); });
$("idcard-start").addEventListener("click", () => { hide("identity-overlay"); startGame(); });

/* ---------------- 开始游戏 ---------------- */
function startGame() {
  const id = IDENTITIES[S.idKey];
  S.story = STORIES[S.idKey];
  S.node = S.story.start;
  S.day = 1; S.act = "hope";
  S.suspicion = 0; S.trust = 50; S.exposure = 0; S.evidence = 0; S.xiaoya = 0; S.route = null;
  S.ending = null; S.endingKey = null; S.history = []; S.ruinsDone = {};
  S.tasks = {};
  S.story.tasks.forEach(t => { S.tasks[t.id] = (t.cond ? "pending" : "active"); });
  S.convs = {};
  S.story.actors.forEach(a => { S.convs[a] = { unread: false, messages: [] }; });

  $("game-root").classList.remove("hidden");
  $("stage-scene").textContent = S.story.scene;
  $("btn-exit").classList.remove("hidden");
  // 显示 AI 模式指示器
  if (API_ENABLED) {
    const aiStatus = $("ai-status");
    if (aiStatus) aiStatus.style.display = "block";
  }
  applyActTheme("hope");
  updateTopbar();
  const first = S.story.nodes[S.node];
  openConversation(first.speaker, true);
  playNode(S.node);
}

/* ---------------- 幕主题（色彩随情绪变化） ---------------- */
function applyActTheme(actKey) {
  const a = ACTS[actKey] || ACTS.hope;
  S.act = actKey;
  const p = $("phone");
  p.style.background = `linear-gradient(160deg, ${a.c1}, ${a.c2})`;
  document.documentElement.style.setProperty("--hl", a.accent);
  $("stage-scene").style.background = actKey === "collapse" ? "rgba(0,0,0,.3)" : `rgba(255,255,255,.05)`;
  $("act-badge").textContent = `第 ${a.n} 幕 · ${a.name}`;
  $("act-badge").style.color = a.accent;
  $("act-sub").textContent = a.sub;
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
  $("chat-av").textContent = a.avatar;
  $("chat-av").style.background = a.color;
  const area = $("chat-area");
  area.innerHTML = "";
  S.convs[key].messages.forEach(m => appendBubble(m.who, m.text, m.psy, false));
  area.scrollTop = area.scrollHeight;
  const node = S.story.nodes[S.node];
  if (!S.ending && node && node.speaker === key) {
    renderOptions(node);
  } else {
    $("options-bar").innerHTML = S.ending ? "" : '<div class="wait-tip">这里暂无新进展，去看看别的对话或任务。</div>';
  }
}

/* ---------------- 播放节点（带打字机） ---------------- */
function playNode(nodeId) {
  const node = S.story.nodes[nodeId];
  if (!node) return;
  S.node = nodeId;
  if (node.day && node.day !== S.day) { S.day = node.day; }
  if (node.act) applyActTheme(node.act);
  const spk = node.speaker;
  if (spk !== S.activeConv) { S.convs[spk].unread = true; renderConvList(); }
  if (node.grant) completeTask(node.grant);
  showTyping();
  // 打字机（按字符）
  setTimeout(() => {
    hideTyping();
    typeWriter(spk, node.text, node.phase, () => {
      S.history.push({ day: node.day, who: ACTORS[spk].name, phase: node.phase, text: node.text });
      updateTopbar();
      if (spk === S.activeConv) renderOptions(node);
    });
  }, 500);
}

/* ---------------- 打字机效果 ---------------- */
function typeWriter(convKey, text, phase, done) {
  const who = "ai";
  pushMessageEmpty(convKey, who, "", phase);
  const area = $("chat-area");
  const bubble = area.lastChild.querySelector(".bubble");
  let i = 0;
  const speed = 22;
  const timer = setInterval(() => {
    bubble.textContent = text.slice(0, i);
    area.scrollTop = area.scrollHeight;
    i++;
    if (i > text.length) { clearInterval(timer); done && done(); }
  }, speed);
}
function pushMessageEmpty(convKey, who, text, phase) {
  S.convs[convKey].messages.push({ who, text, psy: phase });
  if (convKey === S.activeConv) appendBubble(who, text, phase, true);
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

/* ---------------- 自由文本（AI 驱动） ---------------- */
async function handleFreeText(text, node) {
  // 1. 显示玩家消息
  pushMessageFinal(S.activeConv, "me", text, null);

  // 2. 本地反卧底检测（仍保留关键词快速检测）
  const target = ACTORS[S.activeConv];
  let added = 0;
  if (target && (target.type === "target" || target.type === "accomplice")) {
    for (const rule of ANTI_UNDERCOVER.keywords) {
      if (rule.re.test(text)) { added = Math.max(added, rule.add); }
    }
  }
  if (added) bumpSuspicion(added);

  // 3. 如果 API 已启用，调用后端 AI 生成回复
  if (API_ENABLED) {
    showTypingAI();
    try {
      const result = await callBackendChat(text);
      hideTypingAI();

      if (!result) throw new Error("AI 返回空结果");

      // 显示 AI 回复
      const replyConv = result.conversationId || S.activeConv;
      // 强制切换：若后端指定了不同对话（如紧急任务触发），自动跳转
      if (replyConv !== S.activeConv) {
        S.convs[replyConv].unread = true;
        toast("📨 新消息来自「" + (ACTORS[replyConv]?.name || replyConv) + "」");
      }
      pushMessageFinal(replyConv, "ai", result.reply, result.psychologyTag || getStageLabel());

      // 更新信任值
      if (result.trustDelta && result.trustDelta !== 0) {
        S.trust = clamp(S.trust + result.trustDelta, 0, 100);
        updateTopbar();
        if (result.trustDelta > 0) {
          toast(`🤝 信任值 +${result.trustDelta}`);
        } else {
          toast(`⚠️ 信任值 ${result.trustDelta}`);
        }
      }

      // 更新任务
      if (result.taskUpdate) {
        const tu = result.taskUpdate;
        if (tu.status === "completed") {
          completeTask(tu.taskId);
          toast(`✅ 任务完成：${tu.taskTitle || ""}`);
        } else if (tu.status === "updated") {
          // 更新任务进度
          if (tu.progress !== undefined) {
            updateTaskProgress(tu.taskId, tu.progress);
          }
          if (tu.increment && tu.increment >= 10) {
            toast(`📋 任务有进展！（+${tu.increment}%）`);
          }
        }
      }

      // 红标检测
      if (detectRedFlagLocal(result.reply)) {
        toast("⚠️ 对方话术中出现了诱导信号，注意警惕！");
      }

      // 场景切换建议
      if (result.nextScene === "collapse") {
        applyActTheme("collapse");
        toast("🌑 进入第二幕 · 崩塌");
      }

      // 结局触发
      if (result.isEnding) {
        const id = IDENTITIES[S.idKey];
        const endKey = determineEnding(S.story, {
          trust: S.trust,
          evidence: S.evidence,
          route: S.route || "scammed",
          xiaoya: S.xiaoya,
        });
        setTimeout(() => triggerEnding(endKey), 1000);
        return;
      }

      // 检查反卧底暴露
      if (checkExposed()) return;

      // 更新历史
      S.history.push({
        day: S.day,
        who: (ACTORS[replyConv] || ACTORS[S.activeConv])?.name || replyConv,
        phase: result.psychologyTag || getStageLabel(),
        text: result.reply,
      });
      updateTopbar();
      return;
    } catch (err) {
      hideTypingAI();
      console.warn("AI API 调用失败，回退到预设话术：", err.message);
      // 显示错误消息+重试按钮
      showErrorWithRetry(err.message, text, node);
      return;
    }
  }

  // 4. 回退：预设话术模式（原有逻辑）
  let warnLine = null;
  if (target && (target.type === "target" || target.type === "accomplice")) {
    for (const rule of ANTI_UNDERCOVER.keywords) {
      if (rule.re.test(text)) { warnLine = rule.line; break; }
    }
  }
  setTimeout(() => {
    if (warnLine) { pushMessageFinal(S.activeConv, "ai", warnLine, "反卧底·警觉"); checkExposed(); }
    if (S.ending) return;
    const cont = node.options.find(o => o.next);
    if (cont && cont.next) setTimeout(() => playNode(cont.next), 400);
  }, 500);
}

/**
 * 调用后端 AI 接口（新接口 POST /api/chat）
 * @param {string} message - 玩家输入
 * @returns {Promise<{reply, psychologyTag, trustDelta, taskUpdate, nextScene, isEnding}>}
 */
async function callBackendChat(message) {
  // 构建对话历史（最近 10 轮）
  const convHistory = (S.convs[S.activeConv]?.messages || [])
    .filter(m => m.text && m.text.trim())
    .slice(-20) // 取最近 20 条（10 轮对话）
    .map(m => ({
      role: m.who === "me" ? "user" : "assistant",
      content: m.text,
    }));

  // 构建任务列表
  const taskList = (S.story?.tasks || []).map(t => ({
    id: t.id,
    title: t.title,
    status: S.tasks[t.id] || "pending",
  }));

  // 构建请求体（多角色对话交织：带上当前对话角色 ID）
  const body = {
    message: message,
    identity: S.idKey,
    conversationId: S.activeConv,
    currentDay: S.day,
    trustValue: S.trust,
    conversationHistory: convHistory,
    tasks: taskList,
    lastNode: S.node || "",
  };

  // 保存请求参数用于重试
  _lastRequest = body;

  const resp = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(API_TIMEOUT),
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData.error || `API 返回 ${resp.status}: ${resp.statusText}`);
  }

  const data = await resp.json();
  if (!data.success) {
    throw new Error(data.error || "AI 服务返回错误");
  }

  return {
    reply: data.reply || null,
    psychologyTag: data.psychologyTag || "",
    trustDelta: data.trustDelta || 0,
    taskUpdate: data.taskUpdate || null,
    nextScene: data.nextScene || null,
    isEnding: data.isEnding || false,
  };
}

/**
 * 重试上一次失败的请求
 */
async function retryLastRequest() {
  if (!_lastRequest) return;
  // 移除错误消息
  const area = $("chat-area");
  const errMsg = area.querySelector(".msg.error-msg");
  if (errMsg) errMsg.remove();

  showTypingAI();
  try {
    const result = await callBackendChat(_lastRequest.message);
    hideTypingAI();

    if (!result) throw new Error("AI 返回空结果");

    pushMessageFinal(S.activeConv, "ai", result.reply, result.psychologyTag || getStageLabel());

    if (result.trustDelta && result.trustDelta !== 0) {
      S.trust = clamp(S.trust + result.trustDelta, 0, 100);
      updateTopbar();
    }
    if (result.taskUpdate) {
      const tu = result.taskUpdate;
      if (tu.status === "completed") {
        completeTask(tu.taskId);
      } else if (tu.status === "updated" && tu.progress !== undefined) {
        updateTaskProgress(tu.taskId, tu.progress);
      }
    }
    if (result.isEnding) {
      const endKey = determineEnding(S.story, {
        trust: S.trust, evidence: S.evidence,
        route: S.route || "scammed", xiaoya: S.xiaoya,
      });
      setTimeout(() => triggerEnding(endKey), 1000);
    }
    S.history.push({
      day: S.day, who: ACTORS[S.activeConv].name,
      phase: result.psychologyTag || getStageLabel(), text: result.reply,
    });
    updateTopbar();
  } catch (err) {
    hideTypingAI();
    showErrorWithRetry(err.message, _lastRequest.message, null);
  }
}

/**
 * 显示错误消息和重试按钮
 */
function showErrorWithRetry(errMsg, originalText, node) {
  const area = $("chat-area");
  const m = document.createElement("div");
  m.className = "msg error-msg";
  m.innerHTML = `
    <div class="error-bubble">
      <span class="error-icon">⚠️</span>
      <span class="error-text">消息发送失败，请重试</span>
      <span class="error-detail">${escapeHtml(errMsg)}</span>
      <button class="error-retry-btn" onclick="retryLastRequest()">🔄 重试</button>
    </div>`;
  area.appendChild(m);
  area.scrollTop = area.scrollHeight;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * 显示 AI 正在输入... 的加载状态
 */
function showTypingAI() {
  const area = $("chat-area");
  // 移除旧的状态
  hideTypingAI();
  const m = document.createElement("div");
  m.className = "msg ai typing-msg";
  m.id = "ai-typing-msg";
  m.innerHTML = `
    <div class="typing-bubble">
      <div class="typing"><span></span><span></span><span></span></div>
      <span class="typing-label">对方正在输入...</span>
    </div>`;
  area.appendChild(m);
  area.scrollTop = area.scrollHeight;
}

/**
 * 隐藏 AI 加载状态
 */
function hideTypingAI() {
  const t = $("ai-typing-msg");
  if (t) t.remove();
}

/**
 * 获取当前阶段的心理学标注标签
 */
function getStageLabel() {
  const labels = {
    hope: "寻猪·建立联系",
    collapse: "崩塌",
    ruins: "废墟·行动",
    replay: "回放",
    shield: "盾牌",
  };
  return labels[S.act] || "";
}

/**
 * 本地红标检测（AI 回复中是否包含诱导信号词）
 */
function detectRedFlagLocal(text) {
  const flags = ["投资","转账","内部","机会","收益","账户","理财","平台","充值","提现","保证金","稳赚","漏洞","内幕"];
  return flags.some(w => text.includes(w));
}

/* ---------------- 选择选项 ---------------- */
function chooseOption(opt) {
  pushMessageFinal(S.activeConv, "me", opt.text, null);
  if (opt.trust) S.trust = clamp(S.trust + opt.trust, 0, 100);
  if (opt.exposure) S.exposure = clamp(S.exposure + opt.exposure, 0, 4);
  if (opt.grant) completeTask(opt.grant);
  if (opt.evidence) { S.evidence++; toast("📎 已固定 1 项证据（共 " + S.evidence + " 项）"); }
  if (opt.xiaoya) { S.xiaoya = clamp(S.xiaoya + opt.xiaoya, 0, 3); toast("🆘 小雅救援进度 +" + opt.xiaoya); }
  if (opt.susp) bumpSuspicion(opt.susp);
  if (opt.route && !S.route) S.route = opt.route;
  $("options-bar").innerHTML = "";
  if (opt.ending) { setTimeout(() => triggerEnding(opt.ending), 600); return; }
  if (checkExposed()) return;
  if (opt.next) setTimeout(() => playNode(opt.next), 450);
}

/* ---------------- 怀疑度 & 暴露 ---------------- */
function bumpSuspicion(n) { S.suspicion = Math.min(120, S.suspicion + n); updateTopbar(); }
function checkExposed() {
  if (S.suspicion >= ANTI_UNDERCOVER.threshold) {
    const id = IDENTITIES[S.idKey];
    if (["hunter","scribe","mole","seeker"].includes(id.id)) {
      const exposed = { hunter:"E07", scribe:"E02", mole:"E02", seeker:"E02" }[id.id];
      pushMessageFinal(S.activeConv, "ai", "（对方沉默了几秒，随即清空了聊天记录……）", "身份暴露");
      setTimeout(() => triggerEnding(exposed), 800);
      return true;
    }
  }
  return false;
}

/* ---------------- 任务 ---------------- */
function updateTaskProgress(taskId, progress) {
  if (!S.taskProgress) S.taskProgress = {};
  S.taskProgress[taskId] = clamp(progress, 0, 100);
  // 如果进度达到100%，自动完成
  if (progress >= 100 && S.tasks[taskId] === "active") {
    completeTask(taskId);
  }
}
function completeTask(taskId) {
  if (S.tasks[taskId] === "completed") return;
  S.tasks[taskId] = "completed";
  if (!S.taskProgress) S.taskProgress = {};
  S.taskProgress[taskId] = 100;
  const t = S.story.tasks.find(x => x.id === taskId);
  if (t) toast("✅ 任务完成：" + t.title);
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
    // 进度条（仅活跃任务显示）
    const prog = (S.taskProgress && S.taskProgress[t.id]) || 0;
    const progBar = (st === "active")
      ? `<div class="task-prog-bar"><div class="task-prog-fill" style="width:${prog}%"></div></div>
         <div class="task-prog-num">${prog}%</div>`
      : (st === "completed" ? `<div class="task-prog-num done">100%</div>` : "");
    return `<div class="task-card ${cls}">
      <div class="task-h">${icon} ${t.title}</div>
      ${progBar}
      ${dep}
    </div>`;
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
    <div class="st-row"><span>信任值（隐）</span><b>${S.trust} / 100</b></div>
    <div class="st-row"><span>骗子怀疑度</span><b style="color:${expo>=ANTI_UNDERCOVER.threshold?'#DC143C':expo>=30?'#FFA500':'#07C160'}">${expo>=ANTI_UNDERCOVER.threshold?'危险':expo>=30?'警觉':'安全'}</b></div>
    <div class="st-row"><span>已固定证据</span><b>${S.evidence} 项</b></div>
    <div class="st-row"><span>关系亲近度</span><b>${"▎".repeat(S.exposure)||"—"}</b></div>
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
function pushMessageFinal(convKey, who, text, phase) {
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

/* ---------------- 结局判定（确定性逻辑） ---------------- */
function determineEnding(story, state) {
  const { trust, evidence, route, xiaoya } = state;
  if (route === "scammed") {
    if (trust > 60) return "E01";
    if (trust > 30) return "E02";
    if (evidence >= 3) return "E03";
    return "E02";
  }
  if (route === "arrest") {
    if (story.hasXiaoya && xiaoya >= 3 && evidence >= 3) return "E05";
    if (evidence >= 3) return "E03";
    if (evidence < 3) return "E04";
    return "E03";
  }
  if (route === "alert") {
    if (trust < 20) return "E06";
    return "E04";
  }
  if (route === "expose") return "E07";
  if (route === "fail") return "E08";
  // 默认兜底
  return "E03";
}

/* ---------------- 触发结局 → 进入五幕后续 ---------------- */
function triggerEnding(endKey) {
  S.ending = true; S.endingKey = endKey;
  $("options-bar").innerHTML = "";
  const end = S.story.endings[endKey];
  const bad = !end.good;
  if (bad) { $("phone").classList.add("shake"); setTimeout(()=>$("phone").classList.remove("shake"), 500); }

  // 记录解锁
  checkUnlockAfterFinish(S.idKey, end.good);

  // 坏结局 → 第二幕·崩塌
  if (bad) { runCollapse(end); return; }
  // 好结局 → 直接第四幕回放（跳过崩塌）
  runReplay(end);
}

/* ---------------- 第二幕·崩塌 ---------------- */
function runCollapse(end) {
  applyActTheme("collapse");
  const seq = [
    { t: "转账成功。", d: 0 },
    { t: "对方已不是你的好友。消息发出去了，红色感叹号。电话是空号。", d: 3000 },
    { t: "被骗前：余额 12,800 元\n被骗后：余额 0 元\n下个月的房租：3,500 元\n信用卡最低还款：2,000 元\n你还有 6 天。", d: 3500, screen: true },
    { t: "朋友：“你怎么这么傻？网上的人也信？”\n妈妈：“最近还好吗？”（你不知道怎么回）\n同事：“听说她被骗了好几万……”", d: 3500 },
    { t: "你翻看着聊天记录——每一句“晚安”现在都像刀子。“我怎么会相信一个没见过面的人？”“我是不是太蠢了？”", d: 3500 },
    { t: "你想起之前看到过的新闻——某市一位和你年纪相仿的女性，在网络认识了“金融高管”，被骗了全部积蓄。“你从来没想过，自己会成为故事里的那个人。”", d: 4000 },
    { t: "你的一位朋友刚发了一条动态：“刚认识了一个做金融的朋友，感觉很靠谱。”⚠️ 他可能正在经历和你一样的骗局。", d: 4000 },
  ];
  let i = 0;
  const area = $("chat-area");
  area.innerHTML = "";
  function step() {
    if (i >= seq.length) {
      setTimeout(() => runRuins(end), 1200);
      return;
    }
    const s = seq[i++];
    const m = document.createElement("div");
    m.className = "msg sys";
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

/* ---------------- 第四幕·平行宇宙输入框 ---------------- */
$("parallel-btn").addEventListener("click", () => {
  const samples = (PARALLEL_SAMPLES[S.idKey] || PARALLEL_SAMPLES.default);
  $("parallel-list").innerHTML = samples.map(s => `
    <div class="pl-item"><div class="pl-q">🤔 ${s.q}</div><div class="pl-a">${s.a}</div></div>`).join("");
  show("parallel-overlay");
});
$("parallel-send").addEventListener("click", () => {
  const v = $("parallel-input").value.trim();
  if (!v) return;
  const node = S.history[S.history.length - 1];
  const who = node ? node.who : "张浩";
  $("parallel-result").innerHTML = `<div class="pl-item"><div class="pl-q">🤔 ${v}</div>
    <div class="pl-a">如果当时你这样回复，${who} 大概率会先迟疑、再换一种话术继续——骗子的剧本是固定的，你的动摇才是变量。这正是“平行宇宙”里最可能发生的事。</div></div>`;
  $("parallel-input").value = "";
});
$("parallel-close").addEventListener("click", () => hide("parallel-overlay"));

/* ---------------- 第五幕·盾牌（报告） ---------------- */
function runShield() {
  applyActTheme("shield");
  const id = IDENTITIES[S.idKey];
  const end = S.story.endings[S.endingKey];
  const done = Object.values(S.tasks).filter(x=>x==="completed").length;
  let score = Math.round((done / S.story.tasks.length) * 50) + (end.good ? 35 : 0)
            + Math.max(0, 15 - Math.floor(S.suspicion/8));
  score = clamp(score, 5, 100);
  const weak = S.trust > 60 ? "情感依赖型" : S.exposure >= 3 ? "被需要型" : "冲动决策型";
  $("shield-title").textContent = end.title;
  $("shield-sub").textContent = id.codename + "（" + id.role + "） · " + (end.good ? "任务完成" : "任务失败");
  $("shield-score").textContent = score + " 分";
  $("shield-score").style.color = end.good ? "#07C160" : "#FFA500";
  $("shield-stats").innerHTML = `
    <div class="es"><span>${done}/${S.story.tasks.length}</span>任务</div>
    <div class="es"><span>${S.evidence}</span>证据</div>
    <div class="es"><span>${S.day}</span>天</div>
    <div class="es"><span>${Math.min(100,S.suspicion)}</span>怀疑度</div>`;
  $("shield-weak").textContent = "你最容易被“" + weak + "”话术打动；在“被需要”的时候，防备心会降低。";
  const idx = Math.min(4, Math.max(1, Math.round(score/20)));
  $("shield-stars").textContent = "⭐".repeat(idx) + "☆".repeat(5-idx);
  $("shield-tips").innerHTML = [
    "1. 任何要求转账的“朋友”，先电话核实。",
    "2. “内部消息”“稳赚不赔”都是危险信号。",
    "3. 感到不对劲时，先告诉一个信任的人。",
  ].map(t => `<div class="shield-tip">${t}</div>`).join("");
  renderToolbox();
  show("shield-overlay");
}
$("shield-restart").addEventListener("click", () => { hideAll(); showIdentitySelect(); });
$("shield-toolbox-btn").addEventListener("click", () => show("toolbox-overlay"));

/* ---------------- 工具箱 ---------------- */
function renderToolbox() {
  $("toolbox-list").innerHTML = TOOLBOX.map(t => `
    <div class="tool-item"><div class="tool-ic">${t.ic}</div><div class="tool-txt"><h4>${t.t}</h4><p>${t.d}</p></div></div>`).join("");
  $("kw-cloud").innerHTML = KEYWORDS.map(k => `<span class="kw">${k}</span>`).join("");
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
  ["idselect-overlay","identity-overlay","ruins-overlay","replay-overlay","parallel-overlay",
   "shield-overlay","toolbox-overlay","convlist-overlay","task-overlay","status-overlay","profile-overlay"].forEach(hide);
}
$("btn-exit").addEventListener("click", () => {
  if (confirm("退出当前任务？进度不会保存。")) { hideAll(); $("game-root").classList.add("hidden"); showIdentitySelect(); }
});

/* ---------------- 启动：先尝试恢复进度 ---------------- */
loadProgress();

/* ---------------- 暴露全局函数（HTML onclick 调用） ---------------- */
window.retryLastRequest = retryLastRequest;
