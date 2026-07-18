/* ============================================================
 * 反诈人生 · M2 避坑报告生成器（P1）
 * ------------------------------------------------------------
 * 在第五幕·盾牌（结局屏）自动生成「你踩了几个坑」成绩单：
 *  - 本次经历的骗局类型（来自身份 scamTypes）
 *  - 踩中的红标（坑点）明细 + 原因 + 避坑建议
 *  - 骗子年轻话术样本（Z 世代视角）
 *  - 同龄人被骗案例（共鸣）
 *  - 防骗口诀彩蛋
 *  - 截图分享（canvas → 图片下载 / Web Share）
 *
 * 依赖全局：S（游戏状态）、IDENTITIES、SCAM_TYPES、REDFLAGS、ANTI_POEMS
 * ============================================================ */

/* 红标追踪：根据玩家在节点中的选择行为记录踩坑点 */
function trackRedflag(id) {
  if (!S.redflags) S.redflags = {};
  S.redflags[id] = true;
  // M5 数据埋点：红标命中（仅匿名计数，不存原文）
  if (window.Analytics) Analytics.track("redflag_hit", { id });
}

/* 在 chooseOption 中调用：依据玩家本次选项与所在节点的心理学手段判定踩坑 */
function trackFromChoice(opt) {
  const node = S.story.nodes[S.node];
  const phase = (node && node.phase) || "";
  const blob = phase + " " + (opt.text || "");

  if (opt.tone === "warm") {
    if (/情感|共情|保护欲|依恋|亲密|特殊性|陪伴|孤独|聊得来|合拍/.test(phase)) trackRedflag("rf_emotion");
    else trackRedflag("rf_relax");
  }
  if (opt.exposure) trackRedflag("rf_info");
  if (["t2", "t3", "t4", "t5", "t6"].includes(opt.grant)) trackRedflag("rf_deepen");
  if (/转账|保证金|充值|安全账户|验证码|银行卡|垫付|刷单|解冻|投资|收益|提现|打款/.test(blob) && opt.tone !== "cautious") trackRedflag("rf_transfer");
  if (/内部消息|稳赚|高收益|内部|项目|回报率|带单|量化/.test(blob) && opt.tone !== "cautious") trackRedflag("rf_high_return");
  if (/公检法|通缉|逮捕|领导|老板|书记|主任|配合清查|逾期|注销|征信|涉案/.test(phase) && opt.tone !== "cautious") trackRedflag("rf_obey");
}

/* 报告所用「骗局类型」解析：场景模式优先用 S.scenarioType，否则用身份 scamTypes */
function reportTypes() {
  if (S.scenarioType) {
    const t = SCAM_TYPES[S.scenarioType];
    return t ? [t] : [];
  }
  const idObj = IDENTITIES[S.idKey];
  return (idObj.scamTypes || []).map((t) => SCAM_TYPES[t]).filter(Boolean);
}

/* 构建避坑报告 HTML（注入到对应容器；mountKey 用于区分盾牌屏 / 场景结果屏的分享按钮 id） */
function buildPitfallReportHTML(mountKey) {
  mountKey = mountKey || "pitfall";
  const types = reportTypes();
  const triggered = Object.keys(S.redflags || {});

  // 该身份涉及类型的全部红标池
  const pool = new Set();
  types.forEach((t) => (t.redFlags || []).forEach((f) => pool.add(f)));
  // 若身份未配类型，退化为全部红标
  const poolArr = pool.size ? Array.from(pool) : Object.keys(REDFLAGS);
  const M = poolArr.length || 1;
  const hitFlags = triggered.filter((f) => poolArr.includes(f));
  const N = hitFlags.length;
  const safePct = Math.max(0, Math.min(100, Math.round((1 - N / M) * 100)));

  // 防坑指数文案
  let grade, gradeColor;
  if (N === 0) { grade = "全程警惕 🎉"; gradeColor = "#07C160"; }
  else if (safePct >= 60) { grade = "基本清醒"; gradeColor = "#1E90FF"; }
  else if (safePct >= 30) { grade = "险象环生"; gradeColor = "#FFA500"; }
  else { grade = "深度陷局"; gradeColor = "#DC143C"; }

  // 经历类型 chips
  const typeChips = types.map((t) =>
    `<span class="pf-chip">${t.emoji} ${t.name}</span>`).join("") ||
    `<span class="pf-chip">未指定类型</span>`;

  // 踩坑明细
  let flagBlock;
  if (N === 0) {
    flagBlock = `<div class="pf-clean">🎉 这一局你全程保持了警惕，没有踩中明显的坑！记住这份清醒，现实里也一样。</div>`;
  } else {
    flagBlock = hitFlags.map((f) => {
      const r = REDFLAGS[f];
      return `<div class="pf-flag">
        <div class="pf-flag-h"><span class="pf-flag-dot"></span><b>${r.label}</b><span class="pf-flag-cat">${r.cat}</span></div>
        <div class="pf-flag-why">${r.why}</div>
        <div class="pf-flag-save">💡 ${r.save}</div>
      </div>`;
    }).join("");
  }

  // 骗子年轻话术样本（取第一个类型的 youngLines 之一）
  const youngLine = types.length ? types[0].youngLines[Math.floor(Math.random() * types[0].youngLines.length)] : "";
  // 同龄人被骗案例
  const peer = types.length ? types[0].youngExample : "";
  // 防骗口诀彩蛋
  const poem = ANTI_POEMS[Math.floor(Math.random() * ANTI_POEMS.length)];
  // M2 专家校验标记：本次涉及类型是否都已通过专家初审
  const expertVerified = types.length > 0 && types.every((t) => t.expertReviewed);

  return `
    <div class="pf-hd">📊 你的避坑成绩单</div>
    <div class="pf-score">
      <div class="pf-score-num" style="color:${gradeColor}">踩了 ${N} 个坑</div>
      <div class="pf-score-sub">共 ${M} 个高危坑点 · 防坑指数 <b style="color:${gradeColor}">${safePct}%</b> · ${grade}</div>
      <div class="pf-bar"><div class="pf-bar-fill" style="width:${safePct}%;background:${gradeColor}"></div></div>
    </div>

    <div class="pf-sec-t">本次你经历的骗局类型</div>
    <div class="pf-chips">${typeChips}</div>

    <div class="pf-sec-t">踩中的坑（${N}）</div>
    ${flagBlock}

    <div class="pf-sec-t">😈 骗子可能会这样说（年轻版）</div>
    <div class="pf-young">“${youngLine}”</div>

    <div class="pf-sec-t">👥 同龄人真实被骗案例</div>
    <div class="pf-peer">${peer}</div>

    <div class="pf-poem">🔑 防骗口诀：${poem}</div>

    ${expertVerified ? `<div class="pf-clean" style="border-color:rgba(7,193,96,.5)">✅ 本骗局内容已通过反诈专家初审（${types[0].reviewDate || "初核"}）</div>` : ""}

    <button class="btn" id="${mountKey}-share" style="background:#7B5CFF;margin-top:12px">📸 保存/分享我的避坑报告</button>
  `;
}

/* 截图分享：将报告渲染为图片（canvas），优先 Web Share，否则下载 PNG */
function shareReportImage() {
  try {
    const types = reportTypes();
    const triggered = Object.keys(S.redflags || {});
    const pool = new Set();
    types.forEach((t) => (t.redFlags || []).forEach((f) => pool.add(f)));
    const poolArr = pool.size ? Array.from(pool) : Object.keys(REDFLAGS);
    const M = poolArr.length || 1;
    const N = triggered.filter((f) => poolArr.includes(f)).length;
    const safePct = Math.max(0, Math.min(100, Math.round((1 - N / M) * 100)));
    const poem = ANTI_POEMS[Math.floor(Math.random() * ANTI_POEMS.length)];

    const W = 640, H = 860;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");

    // 背景
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0E2236"); g.addColorStop(1, "#123049");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    ctx.textBaseline = "top";
    ctx.fillStyle = "#7FB2FF"; ctx.font = "bold 30px sans-serif";
    ctx.fillText("📊 我的反诈避坑成绩单", 32, 36);

    ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 72px sans-serif";
    ctx.fillText("踩了 " + N + " 个坑", 32, 92);

    ctx.fillStyle = "#A9C7E8"; ctx.font = "20px sans-serif";
    ctx.fillText("共 " + M + " 个高危坑点 · 防坑指数 " + safePct + "%", 32, 184);

    // 进度条
    ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(32, 220, W - 64, 16);
    ctx.fillStyle = safePct >= 60 ? "#07C160" : safePct >= 30 ? "#FFA500" : "#DC143C";
    ctx.fillRect(32, 220, (W - 64) * safePct / 100, 16);

    // 类型
    ctx.fillStyle = "#FFD700"; ctx.font = "bold 22px sans-serif";
    ctx.fillText("本次经历骗局类型", 32, 268);
    ctx.fillStyle = "#E6EEF8"; ctx.font = "18px sans-serif";
    wrapText(ctx, types.map((t) => t.emoji + t.name).join("、") || "未指定", 32, 300, W - 64, 26);

    // 踩坑明细
    ctx.fillStyle = "#FFD700"; ctx.font = "bold 22px sans-serif";
    ctx.fillText("踩中的坑（" + N + "）", 32, 360);
    let y = 392;
    if (N === 0) {
      ctx.fillStyle = "#07C160"; ctx.font = "18px sans-serif";
      ctx.fillText("🎉 全程警惕，没有踩坑！", 32, y);
    } else {
      hitFlagsList(triggered, poolArr).forEach((f) => {
        const r = REDFLAGS[f];
        ctx.fillStyle = "#FF8A8A"; ctx.font = "bold 18px sans-serif";
        ctx.fillText("• " + r.label + "（" + r.cat + "）", 32, y);
        y += 26;
        ctx.fillStyle = "#E6EEF8"; ctx.font = "15px sans-serif";
        y = wrapText(ctx, r.save, 48, y, W - 80, 20) + 8;
      });
    }

    // 口诀
    ctx.fillStyle = "#FFD700"; ctx.font = "bold 22px sans-serif";
    ctx.fillText("🔑 防骗口诀", 32, y + 12);
    ctx.fillStyle = "#E6EEF8"; ctx.font = "17px sans-serif";
    wrapText(ctx, poem, 32, y + 44, W - 64, 24);

    ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.font = "13px sans-serif";
    ctx.fillText("反诈人生 · 模拟演示，切勿模仿 · 遇到诈骗拨 96110", 32, H - 36);

    c.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "反诈避坑报告.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: "我的反诈避坑报告", text: "我刚在《反诈人生》里测出防坑指数 " + safePct + "%！" })
          .catch(() => { /* 用户取消 */ });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "反诈避坑报告.png";
        document.body.appendChild(a); a.click(); a.remove();
        toast("📸 报告已保存为图片");
      }
    }, "image/png");
  } catch (e) {
    toast("截图生成失败：" + e.message);
  }
}

function hitFlagsList(triggered, poolArr) { return triggered.filter((f) => poolArr.includes(f)); }

function wrapText(ctx, text, x, y, maxW, lh) {
  const chars = String(text).split("");
  let line = "";
  for (let i = 0; i < chars.length; i++) {
    const test = line + chars[i];
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y); line = chars[i]; y += lh;
    } else { line = test; }
  }
  if (line) { ctx.fillText(line, x, y); y += lh; }
  return y;
}
