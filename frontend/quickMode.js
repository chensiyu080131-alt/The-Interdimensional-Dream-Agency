/* ============================================================
 * 反诈人生 · M4.3 快速模式（Reigns 式左右滑）
 * ------------------------------------------------------------
 * 与 GDD V9.0「M4 快速模式」对应：
 *  - 极简左右滑卡抉择，降低上手门槛，适合短视频引流
 *  - 复用同一剧情主干，选项压缩为 左=谨慎 / 右=配合(或中性)
 *  - 四维数值（信任/暴露/怀疑/良心）即时反馈，顶部实时可见
 *  - 滑完给出“反骗指数”与一句判定
 *
 * 依赖全局：SCENARIOS、SCAM_TYPES、pickScammerLine、trackRedflag
 * ============================================================ */

const QM = {
  key: null, nodeId: null, sc: null,
  stats: { trust: 50, exposure: 20, suspicion: 30, conscience: 50 },
  avoided: 0, traps: 0, total: 0,
};

function startQuickMode(key) {
  const sc = SCENARIOS[key];
  if (!sc) return;
  QM.key = key; QM.sc = sc; QM.nodeId = sc.start;
  QM.stats = { trust: 50, exposure: 20, suspicion: 30, conscience: 50 };
  QM.avoided = 0; QM.traps = 0; QM.total = 0;
  S.scenarioMode = true; S.idKey = null; S.scenarioKey = key; S.scenarioType = sc.typeKey;
  S.redflags = {}; S.evidenceFrags = {};
  hide("scenario-picker-overlay");
  $("game-root").classList.add("hidden");
  $("quick-hd").textContent = "⚡ 快速模式 · " + (SCAM_TYPES[sc.typeKey] ? SCAM_TYPES[sc.typeKey].name : sc.title);
  renderQuickStats();
  show("quick-overlay");
  // M5 数据埋点
  if (window.Analytics) Analytics.track("quickmode_start", { type: sc.typeKey });
  playQuickNode(sc.start);
}

/* 每个选项的四维影响（护栏内、鼓励谨慎） */
function quickEffects(opt) {
  if (opt.redflag) return { trust: +12, exposure: +16, suspicion: -10, conscience: -14 };
  if (opt.tone === "cautious") return { trust: -4, exposure: -12, suspicion: +16, conscience: +20 };
  return { trust: +8, exposure: +8, suspicion: -4, conscience: -4 }; // 中性/配合 非坑
}

function clamp(v) { return Math.max(0, Math.min(100, v)); }

function renderQuickStats() {
  const s = QM.stats;
  [["trust", "信任", s.trust], ["exposure", "暴露", s.exposure],
   ["suspicion", "怀疑", s.suspicion], ["conscience", "良心", s.conscience]].forEach(([k, label, v]) => {
    const pill = $("quick-" + k);
    if (pill) {
      pill.querySelector(".qs-val").textContent = v;
      pill.querySelector(".qs-fill").style.width = v + "%";
    }
  });
}

function playQuickNode(nodeId) {
  const sc = QM.sc;
  const node = sc.nodes[nodeId];
  if (!node) { finishQuickMode(); return; }
  QM.nodeId = nodeId;
  const line = pickScammerLine(node);
  const opts = node.options || [];
  const cautious = opts.find(o => o.tone === "cautious") || opts[0];
  const other = opts.find(o => o !== cautious) || opts[1] || opts[0];
  QM._cautious = cautious;

  $("quick-phase").textContent = node.phase || "";
  $("quick-line").textContent = "“" + line + "”";
  $("quick-left").textContent = "← " + cautious.text;
  $("quick-right").textContent = other.text + " →";
  $("quick-card").classList.remove("swipe-l", "swipe-r");

  bindQuickSwipe(cautious, other);
}

function bindQuickSwipe(cautious, other) {
  // 用可覆盖的 on* 句柄，避免重复叠加监听（每次节点切换直接覆盖）
  QM._cautious = cautious; QM._other = other;
  const card = $("quick-card");
  let startX = 0, dragging = false;
  const onDown = (e) => { dragging = true; startX = (e.touches ? e.touches[0].clientX : e.clientX); };
  const onUp = (e) => {
    if (!dragging) return; dragging = false;
    const endX = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
    const dx = endX - startX;
    if (dx < -40) chooseQuick(cautious);
    else if (dx > 40) chooseQuick(other);
  };
  card.onmousedown = onDown;
  card.onmouseup = onUp;
  card.ontouchstart = onDown;
  card.ontouchend = onUp;
  // 桌面端也可点击左右区
  $("quick-left").onclick = () => chooseQuick(cautious);
  $("quick-right").onclick = () => chooseQuick(other);
}

function chooseQuick(opt) {
  const eff = quickEffects(opt);
  QM.stats.trust = clamp(QM.stats.trust + eff.trust);
  QM.stats.exposure = clamp(QM.stats.exposure + eff.exposure);
  QM.stats.suspicion = clamp(QM.stats.suspicion + eff.suspicion);
  QM.stats.conscience = clamp(QM.stats.conscience + eff.conscience);
  QM.total++;
  if (opt.redflag) { QM.traps++; trackRedflag(opt.redflag); }
  else if (opt.tone === "cautious") QM.avoided++;
  renderQuickStats();

  const card = $("quick-card");
  card.classList.add(opt === QM._cautious ? "swipe-l" : "swipe-r");
  const sc = QM.sc;
  const node = sc.nodes[QM.nodeId];
  const next = opt.next && sc.nodes[opt.next] ? opt.next : null;
  setTimeout(() => {
    if (next) playQuickNode(next);
    else finishQuickMode();
  }, 260);
}

function finishQuickMode() {
  const s = QM.stats;
  const idx = Math.round((s.conscience * 0.6 + (100 - s.exposure) * 0.4));
  let verdict, color;
  if (idx >= 75) { verdict = "🛡 反诈达人 · 你几乎没给骗子机会"; color = "#07C160"; }
  else if (idx >= 45) { verdict = "⚠ 基本清醒 · 但有几个破绽没挡住"; color = "#ff9f43"; }
  else { verdict = "🔴 高危 · 这波大概率被套牢"; color = "#ff5b5b"; }

  $("quick-result-idx").textContent = idx;
  $("quick-result-idx").style.color = color;
  $("quick-result-verdict").textContent = verdict;
  $("quick-result-detail").textContent =
    `共 ${QM.total} 个抉择 · 识破陷阱 ${QM.avoided} 次 · 踩坑 ${QM.traps} 次。` +
    `信任 ${s.trust} / 暴露 ${s.exposure} / 怀疑 ${s.suspicion} / 良心 ${s.conscience}`;
  // M5 数据埋点
  if (window.Analytics) Analytics.track("quickmode_finish", { idx, avoided: QM.avoided, traps: QM.traps });
  show("quick-result-overlay");
}

function exitQuickMode() {
  hide("quick-overlay"); hide("quick-result-overlay");
  S.scenarioMode = false;
  openScenarioPicker();
}
