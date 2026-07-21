/* ============================================================
 * 反诈人生 · M4.2 证据墙系统 (V9.2)
 * ------------------------------------------------------------
 *  - 可疑碎片 taxonomy（境外号码/诱导话术/伪造截图/异常账户/转账要求/隐私索取）
 *  - 证据文本检测引擎：自动扫描 AI 消息中的可疑关键词
 *  - 故事节点自动收集 + 自由聊天手动收集按钮
 *  - 档案袋/拼图风格证据墙（已收集=彩色卡片，未收集=锁形剪影）
 *  - 始终展示 6 种证据类型图鉴，实时映射已收集状态
 *  - 集齐全部碎片 + 最终保持谨慎 → 解锁隐藏结局「反杀」
 *
 * 依赖全局：SCENARIOS（scenarios.js）、SCAM_TYPES（scamTypes.js）
 * 状态由 app8.js 的 S.evidenceFrags 维护（{ fragId: true }）
 * ============================================================ */

/* 碎片类型 → 图标/名称/配色/检测关键词 */
const EVIDENCE_TYPES = {
  overseas: { icon: "🌐", label: "境外/陌生账号", color: "#4aa3ff" },
  script:   { icon: "🗣", label: "诱导话术",     color: "#ff9f43" },
  fakeimg:  { icon: "🖼", label: "伪造截图",     color: "#b07cff" },
  account:  { icon: "🏦", label: "异常账户",     color: "#ff6b9d" },
  transfer: { icon: "💸", label: "转账要求",     color: "#ff5b5b" },
  privacy:  { icon: "🔒", label: "隐私索取",     color: "#2ed8b6" },
};

/* ===== 证据文本检测引擎 ===== */
/* 每种证据类型的关键词模式 —— 用正则匹配 AI/骗子文本中的可疑信息 */
const EVIDENCE_PATTERNS = {
  overseas: /境外|国外|\+[0-9]{1,3}[-\s]?[0-9]|陌生号码|海外|香港|澳门|台湾|008[0-9]|[Uu]nknown.*call/i,
  script:   /稳赚|内部消息|内幕|系统漏洞|名额有限|限时|最后.*机会|包赔|保证.*收益|稳赢|老师.*带|跟单|内测|亲测|天花板|十年.*遇|错过.*就没有|这群里.*都|稳.*不赔|高收益.*无风险|躺赚|躺赢/i,
  fakeimg:  /截图|收益图|到账记录|提现.*成功|别人.*都.*赚|反馈.*感谢|转账.*记录|聊天.*记录.*晒/i,
  account:  /安全账户|安全账号|对公.*账户|指定.*账户|王总.*账号|陈总.*号|上线.*账号|公司.*账户/i,
  transfer: /转账|打款|汇款|转钱|充值|投资|返利|刷单|保证金|解冻|纳税|手续费.*先|预缴|体验金|试投|试一笔|小投|投.*试试|充[0-9千佰万]|转入|转出|付款|代付|代充|垫付/i,
  privacy:  /身份证|身份证号|银行卡号|卡号|密码|验证码|个人信息|手持.*身份证|实名.*认证|绑定.*卡|私人.*信息|泄露|隐私|本人.*信息/i,
};

/* 检测一段文本命中了哪些证据类型 → 返回类型 key 数组 */
function detectEvidenceTypes(text) {
  if (!text || typeof text !== "string") return [];
  var hits = [];
  Object.keys(EVIDENCE_PATTERNS).forEach(function(tk) {
    if (EVIDENCE_PATTERNS[tk].test(text) && hits.indexOf(tk) === -1) {
      hits.push(tk);
    }
  });
  return hits;
}

/* 根据 fragId 推断证据类型（用于故事预定义 ID 和自动生成 ID） */
function mapFragIdToType(fragId) {
  if (!fragId) return "script";
  // 优先检查 ID 中是否直接包含类型前缀
  var prefixes = ["overseas", "script", "fakeimg", "account", "transfer", "privacy"];
  for (var i = 0; i < prefixes.length; i++) {
    if (fragId.indexOf(prefixes[i]) === 0) return prefixes[i];
  }
  // 回退：关键词匹配
  if (/__overseas|__.*境外|__.*陌生|__phone|__.*号码/i.test(fragId)) return "overseas";
  if (/__transfer|__.*转账|__.*汇款|__.*投资|__.*返利|__bank/i.test(fragId)) return "transfer";
  if (/__privacy|__.*隐私|__.*验证码|__.*身份证|__.*密码/i.test(fragId)) return "privacy";
  if (/__account|__.*账户|__.*安全账|__boss|__company/i.test(fragId)) return "account";
  if (/__fakeimg|__.*截图|__.*伪造|__.*收益图|__img|__photo/i.test(fragId)) return "fakeimg";
  if (/__script|__.*话术|__.*pattern|__.*诱导|__.*redflag|__friend|__warning|__scam/i.test(fragId)) return "script";
  // 纯 ID 匹配（故事预定义的 evidenceFrag）
  if (/account|账户|账号|boss|company/i.test(fragId)) return "account";
  if (/transfer|转账|转[^移]|bank/i.test(fragId)) return "transfer";
  if (/privacy|隐私|private/i.test(fragId)) return "privacy";
  if (/fakeimg|伪造|fake|截图|img|photo/i.test(fragId)) return "fakeimg";
  if (/overseas|境外|陌生|phone|号码|group|群/i.test(fragId)) return "overseas";
  if (/script|话术|pattern|诱导|redflag|friend|warning|info|invest|victim|statement/i.test(fragId)) return "script";
  return "script";
}

/* 统计当前已收集的每种证据类型的碎片数量 */
function countEvidenceByType() {
  var counts = {};
  Object.keys(EVIDENCE_TYPES).forEach(function(tk) { counts[tk] = 0; });
  Object.keys(S.evidenceFrags || {}).forEach(function(fid) {
    var t = mapFragIdToType(fid);
    counts[t] = (counts[t] || 0) + 1;
  });
  return counts;
}

/* 从文本中检测并自动收集证据（去重）。返回新收集的类型列表。 */
function collectEvidenceFromText(text, sourceLabel) {
  if (!text) return [];
  var types = detectEvidenceTypes(text);
  if (!types.length) return [];
  var collected = [];
  types.forEach(function(tk) {
    // 生成唯一 fragId：类型前缀 + 文本前8字符的简易hash
    var hash = "";
    for (var i = 0; i < Math.min(text.length, 20); i++) {
      hash += text.charCodeAt(i).toString(36);
    }
    var fragId = tk + "__" + sourceLabel.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_").substring(0, 20) + "_" + hash.substring(0, 12);
    if (collectFragment(fragId)) collected.push(tk);
  });
  return collected;
}

/* 创建证据收集按钮的 HTML（用于嵌入聊天气泡） */
function createEvidenceCollectBtn(text) {
  var types = detectEvidenceTypes(text);
  if (!types.length) return "";
  // 检查这些类型中是否有未收集的
  var hasNew = types.some(function(tk) {
    // 检查是否已有此类型的证据
    var counts = countEvidenceByType();
    return counts[tk] === 0;
  });
  if (!hasNew) return ""; // 全部已收集过至少一次，不显示按钮
  var labels = types.map(function(tk) { return EVIDENCE_TYPES[tk].label; }).join("、");
  // 使用全局 click 处理器从 DOM 读取气泡文本，避免 onclick 嵌长文本
  return '<div class="ev-collect-row"><button class="ev-collect-btn" onclick="handleEvidenceCollectBtn(this)">📎 收集证据：' + labels + '</button></div>';
}

/* 全局：证据收集按钮点击处理（从 DOM 读取气泡文本） */
function handleEvidenceCollectBtn(btn) {
  var msgEl = btn.closest && btn.closest('.msg.ai');
  if (!msgEl) { msgEl = btn.parentElement.parentElement; } // fallback
  if (msgEl) {
    var bubble = msgEl.querySelector('.bubble');
    if (bubble && bubble.textContent) {
      var collected = collectEvidenceFromText(bubble.textContent, 'chat');
      if (collected && collected.length) {
        btn.style.display = 'none'; // 收集成功，隐藏按钮
      }
    }
  }
}

/* ===== 核心收集函数 ===== */

/* 取某类场景的全部碎片定义 */
function getScenarioFragments(typeKey) {
  const sc = SCENARIOS[typeKey];
  return sc && sc.fragments ? sc.fragments : [];
}

/* 收集一枚碎片（返回是否为新收集） */
function collectFragment(fragId) {
  S.evidenceFrags = S.evidenceFrags || {};
  if (S.evidenceFrags[fragId]) return false;
  S.evidenceFrags[fragId] = true;
  S.evidenceUnviewed = true; // 标记有未查看的新证据
  var got = Object.keys(S.evidenceFrags).length;
  var typeCounts = countEvidenceByType();
  var typeGot = Object.values(typeCounts).filter(function(v) { return v > 0; }).length;
  var typeTotal = Object.keys(EVIDENCE_TYPES).length;
  var typeLabel = mapFragIdToType(fragId);
  var typeName = (EVIDENCE_TYPES[typeLabel] || EVIDENCE_TYPES.script).label;
  toast("🔍 发现关键证据：「" + typeName + "」（已收集 " + typeGot + "/" + typeTotal + " 类）");
  updateTopbar();
  return true;
}

/* 当前已收集数量 / 总数 */
function evidenceProgress(typeKey) {
  const all = getScenarioFragments(typeKey);
  const got = all.filter(f => S.evidenceFrags && S.evidenceFrags[f.id]).length;
  return { got, total: all.length };
}

/* 是否集齐全部关键证据 */
function hasAllEvidence(typeKey) {
  const all = getScenarioFragments(typeKey);
  if (!all.length) return false;
  return all.every(f => S.evidenceFrags && S.evidenceFrags[f.id]);
}

/* 隐藏结局「反杀」判定：集齐证据 + 最终保持谨慎（未踩最终转账坑） */
function checkCountersEnding(typeKey, finalCautious) {
  return hasAllEvidence(typeKey) && finalCautious === true;
}

/* ===== 证据墙渲染（V9.2 重写） =====
 * 始终展示 6 大证据类型卡片（已收集=彩色，未收集=灰色锁），
 * 额外展示故事/场景特有的预定义碎片。
 * containerId 为挂载容器；typeKey 为场景类型（可为 null/falsy） */
function renderEvidenceWall(containerId, typeKey) {
  const box = document.getElementById(containerId);
  if (!box) return;
  const sc = typeKey ? SCENARIOS[typeKey] : null;

  // 计算统计数据
  var typeCounts = countEvidenceByType();
  var evCollected = Object.keys(S.evidenceFrags || {}).length;
  var evTotalFromStory = S.evidenceFragTotal || 0;
  var typeGot = Object.values(typeCounts).filter(function(v) { return v > 0; }).length;
  var typeTotal = Object.keys(EVIDENCE_TYPES).length;
  var allDone = typeGot >= typeTotal;

  // 场景碎片数据（如果有场景）
  var all = typeKey ? getScenarioFragments(typeKey) : [];
  var allGot = 0, allTotal = 0;
  if (typeKey) { var p = evidenceProgress(typeKey); allGot = p.got; allTotal = p.total; }

  // 更新进度条
  var pct = typeTotal > 0 ? Math.round(typeGot / typeTotal * 100) : 0;
  var progNum = document.getElementById("ev-progress-num");
  var progFill = document.getElementById("ev-progress-fill");
  var sceneName = document.getElementById("ev-scene-name");
  if (progNum) { progNum.textContent = typeGot + "/" + typeTotal; progNum.className = "ev-progress-num" + (allDone ? " full" : ""); }
  if (progFill) { progFill.style.width = pct + "%"; progFill.className = "ev-progress-fill" + (allDone ? " full" : ""); }
  if (sceneName) sceneName.textContent = sc ? " · " + sc.title : " · 证据墙";

  let html = "";

  // ===== 分区1：6 大证据类型卡片（始终展示） =====
  html += '<div class="ev-section-label">📋 六大证据类型</div>';
  html += '<div class="ev-guide-desc">每种证据类型至少收集 <b>1 个</b>即可点亮。与骗子对话时留意可疑信息。</div>';
  html += '<div class="ev-grid">';
  html += Object.entries(EVIDENCE_TYPES).map(function(entry) {
    var key = entry[0];
    var t = entry[1];
    var collected = typeCounts[key] > 0;
    return '<div class="ev-card ' + (collected ? "got" : "locked") + '" style="--ec:' + t.color + '">'
      + '<div class="ev-folder-tab"></div>'
      + '<div class="ev-icon">' + (collected ? t.icon : "🔒") + '</div>'
      + '<div class="ev-type" style="color:' + (collected ? t.color : "#5a6275") + '">' + t.label + '</div>'
      + '<div class="ev-label">' + (collected ? "已固定 · " + (typeCounts[key] || 1) + " 条" : "尚未发现此类证据") + '</div>'
      + (collected ? '<div style="font-size:10px;color:var(--ec);margin-top:6px">✅ 已固定</div>' : '')
      + '</div>';
  }).join("");
  html += '</div>';

  // ===== 分区2：场景/故事专属碎片（如果有 pre-defined fragments） =====
  var extraFrags = all.length ? all.filter(function(f) {
    // 只展示之前没在 6 类卡片中涵盖的碎片
    return true;
  }) : [];
  if (extraFrags.length > 0) {
    html += '<div class="ev-section-label">📎 ' + (sc ? sc.title : "当前故事") + ' · 关键碎片</div>';
    html += '<div class="ev-grid">';
    html += extraFrags.map(function(f) {
      var t = EVIDENCE_TYPES[f.type] || EVIDENCE_TYPES.script;
      var collected = S.evidenceFrags && S.evidenceFrags[f.id];
      return '<div class="ev-card ' + (collected ? "got" : "locked") + '" style="--ec:' + t.color + '">'
        + '<div class="ev-folder-tab"></div>'
        + '<div class="ev-icon">' + (collected ? t.icon : "🔒") + '</div>'
        + '<div class="ev-type" style="color:' + (collected ? t.color : "#5a6275") + '">' + t.label + '</div>'
        + '<div class="ev-label">' + (collected ? f.label : "未收集的可疑线索") + '</div>'
        + (collected ? '<div style="font-size:10px;color:var(--ec);margin-top:6px">✅ 已固定</div>' : '')
        + '</div>';
    }).join("");
    html += '</div>';
  }

  // ===== 分区3：引导提示 =====
  var hintClass = allDone ? "ev-hint glow" : "ev-hint";
  var hintText = "";
  if (allDone) {
    hintText = "✅ 证据链完整（" + typeGot + "/" + typeTotal + " 类）！在最终抉择时保持谨慎（不点击虚假链接/不暴露隐私信息），即可解锁隐藏结局「🕵️ 反手乾坤」，协助警方精准收网。";
  } else if (typeGot > 0) {
    hintText = "💡 已收集 <b>" + typeGot + "/" + typeTotal + "</b> 类证据。对话中留意骗子暴露的破绽，发现后可点击「📎 收集」固定为证据。<br>集齐全部 6 类证据并在最终抉择时保持谨慎，可解锁隐藏结局「🕵️ 反手乾坤」！";
  } else {
    hintText = '🎯 <b>证据墙使用指南：</b><br>'
      + '① 与骗子聊天时，骗子会暴露 <b>6 类可疑信息</b><br>'
      + '② AI 回复中若包含可疑内容，会出现 「📎 收集」按钮<br>'
      + '③ 点击收集，每类至少收集 1 条即可点亮<br>'
      + '④ 集齐 6 类 + 最终谨慎抉择 → 🕵️ 解锁隐藏结局<b>「反手乾坤」</b>';
  }
  html += '<div class="' + hintClass + '">' + hintText + '</div>';

  // ===== 分区4：按钮行 =====
  html += '<div class="ev-btn-row">';
  html += '<button class="ev-btn-close" onclick="hide(\'evidence-overlay\')">关闭</button>';
  if (allDone) {
    html += '<button class="ev-btn-counters" onclick="toast(\'🕵️ 继续对话，在最终抉择保持谨慎即可触发反杀结局！\');hide(\'evidence-overlay\')">🎯 继续 · 准备反杀</button>';
  }
  if (!typeKey) {
    html += '<button class="ev-btn-action" onclick="hide(\'evidence-overlay\');document.getElementById(\'warn-screen\').style.display=\'flex\';">🚀 去体验场景</button>';
  }
  html += '</div>';

  box.innerHTML = html;
}

/* 隐藏结局「反杀」文案（用于结果屏展示） */
function countersEndingText(typeKey) {
  const t = SCAM_TYPES[typeKey];
  return {
    title: "🕵️ 反杀结局 · 协助收网",
    desc: "你不仅识破了" + (t ? t.name : "这场骗局") + "，还完整固定了全部证据链。" +
          "你把这些线索提交给反诈中心（96110），警方顺藤摸瓜打掉了这个团伙——" +
          `你从"差点被骗的人"，变成了"帮别人避坑的人"。`,
  };
}
