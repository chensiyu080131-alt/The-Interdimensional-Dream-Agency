/* ============================================================
 * 反诈人生 · M4.1 证据墙系统
 * ------------------------------------------------------------
 *  - 可疑碎片 taxonomy（境外号码/诱导话术/伪造截图/异常账户/转账要求/隐私索取）
 *  - 玩家在对话中主动“收集”暴露的可疑线索 → S.evidenceFrags
 *  - 档案袋/拼图风格证据墙（已收集=彩色卡片，未收集=锁形剪影）
 *  - 集齐全部碎片 + 最终保持谨慎 → 解锁隐藏结局「反杀」
 *
 * 依赖全局：SCENARIOS（scenarios.js）、SCAM_TYPES（scamTypes.js）
 * 状态由 app8.js 的 S.evidenceFrags 维护（{ fragId: true }）
 * ============================================================ */

/* 碎片类型 → 图标/名称/配色 */
const EVIDENCE_TYPES = {
  overseas: { icon: "🌐", label: "境外/陌生账号", color: "#4aa3ff" },
  script:   { icon: "🗣", label: "诱导话术",     color: "#ff9f43" },
  fakeimg:  { icon: "🖼", label: "伪造截图",     color: "#b07cff" },
  account:  { icon: "🏦", label: "异常账户",     color: "#ff6b9d" },
  transfer: { icon: "💸", label: "转账要求",     color: "#ff5b5b" },
  privacy:  { icon: "🔒", label: "隐私索取",     color: "#2ed8b6" },
};

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

/* 渲染证据墙（档案袋风格）。containerId 为挂载容器；typeKey 为场景类型 */
function renderEvidenceWall(containerId, typeKey) {
  const box = document.getElementById(containerId);
  if (!box) return;
  const all = getScenarioFragments(typeKey);
  const { got, total } = evidenceProgress(typeKey);
  const sc = SCENARIOS[typeKey];
  const allDone = got >= total;

  box.innerHTML = `
    <div class="ev-wall-head">
      <span class="ev-wall-title">🗂 证据墙 · ${sc ? sc.title : ""}</span>
      <span class="ev-wall-prog ${allDone ? "done" : ""}">${got}/${total}</span>
    </div>
    <div class="ev-grid">
      ${all.map(f => {
        const t = EVIDENCE_TYPES[f.type] || EVIDENCE_TYPES.script;
        const collected = S.evidenceFrags && S.evidenceFrags[f.id];
        return `<div class="ev-card ${collected ? "got" : "locked"}" style="--ec:${t.color}">
          <div class="ev-icon">${collected ? t.icon : "🔒"}</div>
          <div class="ev-type" style="color:${collected ? t.color : "#5a6275"}">${t.label}</div>
          <div class="ev-label">${collected ? f.label : "未收集的可疑线索"}</div>
        </div>`;
      }).join("")}
    </div>
    <div class="ev-hint">
      ${allDone
        ? "✅ 证据链完整！在最终抉择保持谨慎，即可解锁隐藏结局「反杀」。"
        : "💡 对话中留意骗子暴露的破绽，点击「收集」固定为证据。集齐全部可解锁「反杀」。"}
    </div>
  `;
}

/* 隐藏结局「反杀」文案（用于结果屏展示） */
function countersEndingText(typeKey) {
  const t = SCAM_TYPES[typeKey];
  return {
    title: "🕵️ 反杀结局 · 协助收网",
    desc: `你不仅识破了${t ? t.name : "这场骗局"}，还完整固定了全部证据链。` +
          `你把这些线索提交给反诈中心（96110），警方顺藤摸瓜打掉了这个团伙——` +
          `你从“差点被骗的人”，变成了“帮别人避坑的人”。`,
  };
}
