/* 产品冒烟测试驱动：与前端脚本拼接在同一词法作用域运行，可直接访问 S/SCENARIOS/SCAM_TYPES 等 const
 * 由 scripts/product_test.js 读取并在 vm 中执行。仅做无副作用的只读/驱动式调用。 */
(function () {
  var R = { load: "ok", tests: [], errors: [], summary: "" };
  function ok(name, cond, extra) { R.tests.push({ name: name, pass: !!cond, extra: extra == null ? "" : String(extra) }); }
  function note(name, e) { R.errors.push(name + ": " + (e && e.stack ? e.stack.split("\n").slice(0, 2).join(" | ") : e)); }
  try {
    // ---------- 1) 数据完整性（跨引用） ----------
    var scenBad = 0, storyBad = 0, listBad = 0;
    for (var key in SCENARIOS) {
      var sc = SCENARIOS[key];
      if (!SCAM_TYPES[sc.typeKey]) { scenBad++; continue; }
      for (var nid in sc.nodes) {
        var nd = sc.nodes[nid];
        (nd.options || []).forEach(function (o) { if (o.next && !sc.nodes[o.next]) scenBad++; });
        if (nd.frag) {
          var fr = (sc.fragments || []).find(function (f) { return f.id === nd.frag; });
          if (!fr) scenBad++;
        }
      }
    }
    for (var ik in IDENTITIES) {
      var st = STORIES[ik];
      if (!st || !st.nodes || !st.start || !st.endings) { storyBad++; continue; }
      for (var n2 in st.nodes) {
        (st.nodes[n2].options || []).forEach(function (o) { if (o.next && !st.nodes[o.next]) storyBad++; });
      }
    }
    (SCENARIO_LIST || []).forEach(function (e) { if (!SCENARIOS[e]) listBad++; });
    ok("data: 场景跨引用一致", scenBad === 0, "bad=" + scenBad);
    ok("data: 主线剧情跨引用一致", storyBad === 0, "bad=" + storyBad);
    ok("data: SCENARIO_LIST 键有效", listBad === 0, "bad=" + listBad);
    ok("data: 诈骗类型 >=10", Object.keys(SCAM_TYPES).length >= 10, "n=" + Object.keys(SCAM_TYPES).length);
    ok("data: 身份 = 6", Object.keys(IDENTITIES).length === 6, "n=" + Object.keys(IDENTITIES).length);

    // ---------- 2) 避坑报告生成（先在场景上下文中设置 scenarioType） ----------
    S.scenarioType = Object.keys(SCAM_TYPES)[0];
    var rep = buildPitfallReportHTML("x");
    ok("report: 生成 HTML", typeof rep === "string" && rep.length > 50, "len=" + (rep ? rep.length : 0));

    // ---------- 3) 场景实战通关（M2/M4 引擎） ----------
    var scKey = Object.keys(SCENARIOS)[0];
    startScenario(scKey);
    var steps = 0;
    while (steps < 20) {
      var sc = SCENARIOS[scKey];
      var node = sc.nodes[S.scenarioNode];
      var opts = node.options || [];
      if (!opts.length) break;
      var opt = opts.find(function (o) { return o.tone === "cautious"; }) || opts[0];
      var isLast = !opt.next;
      chooseScenarioOption(opt);
      var d = 0;
      while (window._timers.length && d < 8000) { var fn = window._timers.shift(); try { fn(); } catch (e) { note("scenarioTimer", e); break; } d++; }
      steps++;
      if (isLast) break;
    }
    ok("scenario: 通关到复盘", steps > 0 && steps < 20, "steps=" + steps);
    var scenRep = document.getElementById("pitfall-report-scen").innerHTML;
    ok("scenario: 复盘报告已渲染", typeof scenRep === "string" && scenRep.length > 20, "len=" + (scenRep ? scenRep.length : 0));

    // ---------- 4) 快速模式通关（M4.3） ----------
    startQuickMode(scKey);
    var q = 0;
    while (q < 25) {
      var sc2 = SCENARIOS[scKey];
      var node2 = sc2.nodes[QM.nodeId];
      var opts2 = node2.options || [];
      if (!opts2.length) break;
      var opt2 = opts2.find(function (o) { return o.tone === "cautious"; }) || opts2[0];
      var isLast2 = !opt2.next;
      chooseQuick(opt2);
      var d2 = 0;
      while (window._timers.length && d2 < 8000) { var fn2 = window._timers.shift(); try { fn2(); } catch (e) { note("quickTimer", e); break; } d2++; }
      q++;
      if (isLast2) break;
    }
    ok("quick: 完成抉择", QM.total > 0, "total=" + QM.total + " avoided=" + QM.avoided + " traps=" + QM.traps);
    var qidx = document.getElementById("quick-result-idx").textContent;
    ok("quick: 反骗指数已算", !isNaN(Number(qidx)), "idx=" + qidx);

    // ---------- 5) 各模块单元调用（M1/M3/M5） ----------
    ok("voice: node 环境不支持 TTS", Voice.isSupported() === false);
    ok("voice: toggle 安全降级(false)", Voice.toggle() === false);
    Analytics.track("unit_test_event", { k: 1 });
    ok("analytics: track+getStats", typeof Analytics.getStats() === "object");
    ok("adapter: 环境已识别", ["browser", "wechat", "miniprogram"].indexOf(H5Adapter.env) >= 0, "env=" + H5Adapter.env);
    var wk = assignWeakness("hunter");
    ok("weakness: 返回弱点 id", typeof wk === "string" && wk.length > 0, "wk=" + wk);
    var frag0 = (SCENARIOS[scKey].fragments || [])[0];
    var collected = collectFragment(frag0 ? frag0.id : "");
    ok("evidence: collectFragment 可调用", typeof collected === "boolean");
    renderEvidenceWall("evidence-grid", scKey);
    ok("evidence: renderEvidenceWall 可执行", true);

    // ---------- 6) M2 专家校验占位 ----------
    var firstType = SCAM_TYPES[Object.keys(SCAM_TYPES)[0]];
    ok("m2: expertReviewed 已归一化=true", firstType.expertReviewed === true);

    var passed = R.tests.filter(function (t) { return t.pass; }).length;
    R.summary = passed + "/" + R.tests.length + " 项通过";
  } catch (e) {
    note("FATAL", e);
    R.load = "RUNTIME_ERROR";
  }
  window.__REPORT = R;
  console.log("=== PRODUCT TEST REPORT ===");
  console.log(JSON.stringify(R, null, 2));
})();
