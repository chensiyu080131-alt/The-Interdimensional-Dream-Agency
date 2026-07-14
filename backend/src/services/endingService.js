/**
 * ============================================================
 * 结局判定服务（AI 辅助）
 * ------------------------------------------------------------
 * 职责：
 *   1. 根据判定维度（信任值 / 证据数 / 小雅救援进度 / 关键选择）
 *      计算 5 个结局的概率分布 [{endingId, probability}]
 *   2. 某个结局概率 > 80% 时，自动标记 shouldTrigger
 *   3. 优先使用混元大模型做「综合研判」，失败时回退确定性规则
 *
 * hunter 线 5 个结局：
 *   E01 被骗（完全信任，转账）
 *   E02 被骗（犹豫后被说服）
 *   E03 成功收网（报告老K，证据≥3）
 *   E04 反被利用（自己调查，证据不足）
 *   E05 营救成功（完成小雅救援 + 收网成功）
 * ============================================================
 */

const config = require("../config");
const hunyuanService = require("./hunyuanService");

/* 结局元数据 */
const ENDING_META = {
  E01: { title: "被骗·完全信任", tone: "bad" },
  E02: { title: "被骗·犹豫后被说服", tone: "bad" },
  E03: { title: "成功收网", tone: "good" },
  E04: { title: "反被利用", tone: "bad" },
  E05: { title: "营救成功", tone: "good" },
};

const TRIGGER_THRESHOLD = 0.8; // 概率 > 80% 自动进入结局

/* ================================================================
 * 判定维度归一化
 * ================================================================ */
function normalizeState(input = {}) {
  return {
    trust: clampNum(input.trust, 0, 100, 50),          // 信任值 0-100
    evidence: clampNum(input.evidence, 0, 5, 0),        // 已固定证据数 0-5
    xiaoya: clampNum(input.xiaoya, 0, 100, 0),         // 小雅救援进度 0-100%
    reportedLaok: !!input.reportedLaok,                 // 是否报告老K
    transferred: !!input.transferred,                   // 是否已转账（被骗关键选择）
    route: input.route || "",                          // 当前主线分支
    currentDay: clampNum(input.currentDay, 1, 7, 1),   // 当前天数
  };
}

function clampNum(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/* ================================================================
 * 确定性规则：将判定维度映射到 5 个结局的得分
 * 返回 { E01, E02, E03, E04, E05 }，每项 0-100
 * ================================================================ */
function scoreByRules(s) {
  const { trust, evidence, xiaoya, reportedLaok, transferred, route } = s;
  const scores = { E01: 0, E02: 0, E03: 0, E04: 0, E05: 0 };

  // ---------- E01 / E02：被骗结局（依赖「已转账」） ----------
  if (transferred || route === "scammed") {
    // 完全信任 → E01；犹豫（中等信任）→ E02
    if (trust >= 70) {
      scores.E01 = 100;                    // 强信号：碾压式置顶
      scores.E02 = 35 * (1 - (trust - 70) / 30); // 信任越高越不像"犹豫"
    } else if (trust >= 40) {
      scores.E02 = 100;
      scores.E01 = 20;
    } else {
      scores.E02 = 70;                     // 低信任仍转账，偏犹豫型但信号弱
    }
  } else {
    // 尚未转账：根据信任值给出「预防性」趋势分（不触发）
    if (trust >= 80) scores.E01 = Math.min(50, trust - 30);
    else if (trust >= 60) scores.E02 = Math.min(40, trust - 20);
  }

  // ---------- E03 / E05：收网 / 营救（依赖证据 + 报告老K） ----------
  if (reportedLaok) {
    if (evidence >= 3) {
      scores.E03 = 70 + evidence * 6;                 // 证据越多越稳（证据5→100）
      if (xiaoya >= 60) {
        // 营救成功：比单纯收网更"完整"，赋予更高分优先于 E03
        scores.E05 = Math.max(scores.E03, 80) + xiaoya * 0.25; // 小雅100→+25 压倒 E03
        scores.E03 = Math.max(scores.E03, 60);        // 收网仍成立但低于营救
      }
    } else {
      // 报告了但证据不足
      scores.E03 += 20 + evidence * 8;
    }
  } else {
    // 没报告老K，靠自己：证据足也难收网（E04 倾向）
    if (evidence >= 3) scores.E03 += 15;
  }

  // ---------- E04：反被利用（主动选择单干分支 + 证据不足） ----------
  // 注意：仅在玩家进入「自己调查」主线（route==='arrest'）时才判 E04，
  //       初始未分流状态（无 route / 未转账 / 未报告）不触发任何结局。
  if (route === "arrest" && !(transferred && reportedLaok && evidence >= 3)) {
    scores.E04 = 50 + (3 - evidence) * 16; // 证据缺口越大越危险（缺口3→98）
    if (trust >= 60) scores.E04 += 25;     // 高信任 + 单干 = 易被反利用
    scores.E04 = Math.min(100, scores.E04);
  }

  // 已转账且报告老K 且证据≥3 → 收网/营救优先覆盖被骗（警察及时收网）
  if (transferred && reportedLaok && evidence >= 3) {
    scores.E03 = Math.max(scores.E03, 90);
    scores.E05 = Math.max(scores.E05, xiaoya >= 60 ? 95 : 0);
  }

  return scores;
}

/* ================================================================
 * 将得分归一化为概率分布（softmax 风格 + 兜底）
 * ================================================================ */
function normalizeToProbabilities(scores) {
  const ids = Object.keys(scores);
  const total = ids.reduce((sum, id) => sum + scores[id], 0);

  if (total <= 0) {
    // 完全无信号：均匀铺底
    return ids.map((id) => ({ endingId: id, probability: 1 / ids.length }));
  }

  const maxScore = Math.max(...ids.map((id) => scores[id]));

  // 强信号硬置顶：最高分 ≥ 90 时，直接赋予其 0.85+ 的压倒性概率
  if (maxScore >= 90) {
    const winner = ids.find((id) => scores[id] === maxScore);
    return ids.map((id) => ({
      endingId: id,
      probability: round2(id === winner ? 0.85 + (maxScore - 90) / 100 * 0.14 : 0.03),
    })).sort((a, b) => b.probability - a.probability);
  }

  // 用指数放大差异后再归一，使优势结局更突出
  const temp = 1.1;
  const exps = ids.map((id) => Math.exp(scores[id] / (100 / temp)));
  const expSum = exps.reduce((a, b) => a + b, 0);

  return ids.map((id, i) => ({
    endingId: id,
    probability: round2(exps[i] / expSum),
  })).sort((a, b) => b.probability - a.probability);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/* ================================================================
 * 混元增强：让大模型在规则分基础上做「综合研判」
 * 失败（API 不可用 / 解析失败）则回退规则分
 * ================================================================ */
async function predictEndingAsync(input) {
  const s = normalizeState(input);
  const rules = scoreByRules(s);

  // 构造给大模型的研判提示
  const prompt = `你是反诈剧本游戏的结局研判AI。根据玩家当前状态，判断最逼近的结局。

【玩家状态】
- 信任值（对骗子张浩）：${s.trust}/100
- 已固定证据数：${s.evidence}/5
- 小雅救援进度：${s.xiaoya}%
- 是否已报告警方老K：${s.reportedLaok ? "是" : "否"}
- 是否已向骗子转账：${s.transferred ? "是" : "否"}
- 当前主线分支：${s.route || "未确定"}
- 当前天数：第${s.currentDay}天

【5个候选结局】
E01 被骗（完全信任，转账）
E02 被骗（犹豫后被说服）
E03 成功收网（报告老K且证据≥3）
E04 反被利用（自己调查，证据不足）
E05 营救成功（完成小雅救援且收网成功）

【规则侧初步得分（0-100）】
${Object.entries(rules).map(([k, v]) => `${k}=${v}`).join(", ")}

请综合考量剧情合理性，输出一个 JSON，不要任何额外文字：
{"prediction":[{"endingId":"E0X","probability":0.XX},...],"reasoning":"一句话研判依据"}

要求：prediction 必须覆盖全部5个结局，probability 为 0-1 的小数且总和为1，按概率从高到低排列。`;

  if (config.isApiKeyValid()) {
    try {
      const result = await hunyuanService.chatCompletion([
        { role: "system", content: "你只输出JSON，不做解释。" },
        { role: "user", content: prompt },
      ]);
      const parsed = extractJson(result.content);
      if (parsed && Array.isArray(parsed.prediction) && parsed.prediction.length) {
        let probs = parsed.prediction
          .filter((p) => ENDING_META[p.endingId])
          .map((p) => ({ endingId: p.endingId, probability: round2(clampNum(p.probability, 0, 1, 0)) }));
        // 补全缺失的结局（若模型漏了）
        const present = new Set(probs.map((p) => p.endingId));
        for (const id of Object.keys(ENDING_META)) {
          if (!present.has(id)) probs.push({ endingId: id, probability: 0 });
        }
        probs = normalizeSum(probs).sort((a, b) => b.probability - a.probability);
        return buildResult(probs, s, parsed.reasoning);
      }
    } catch (e) {
      console.error("[结局研判·混元失败，回退规则]", e.message);
    }
  }

  // 回退：规则分
  const probs = normalizeToProbabilities(rules);
  return buildResult(probs, s, "基于规则维度研判");
}

/* 同步版本（无 AI，纯规则，供 /api/chat 内快速附带） */
function predictEndingSync(input) {
  const s = normalizeState(input);
  const rules = scoreByRules(s);
  const probs = normalizeToProbabilities(rules);
  return buildResult(probs, s, "基于规则维度研判");
}

/* ================================================================
 * 结果封装：找出最高概率结局，判断是否 > 80% 触发
 * ================================================================ */
function buildResult(probs, state, reasoning) {
  const top = probs[0];
  const shouldTrigger = top && top.probability > TRIGGER_THRESHOLD;
  return {
    probabilities: probs,
    topEnding: top ? top.endingId : null,
    topProbability: top ? top.probability : 0,
    shouldTrigger,
    triggeredEnding: shouldTrigger ? top.endingId : null,
    threshold: TRIGGER_THRESHOLD,
    reasoning: reasoning || "",
    meta: {
      ...state,
      endings: ENDING_META,
    },
  };
}

/* ================================================================
 * 工具：从模型文本提取 JSON
 * ================================================================ */
function extractJson(text) {
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normalizeSum(probs) {
  const total = probs.reduce((a, p) => a + p.probability, 0) || 1;
  return probs.map((p) => ({ ...p, probability: round2(p.probability / total) }));
}

module.exports = {
  ENDING_META,
  TRIGGER_THRESHOLD,
  predictEndingAsync,
  predictEndingSync,
  scoreByRules,
  normalizeState,
};
