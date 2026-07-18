/**
 * ============================================================
 * 生成反诈人生埋点数据看板（离线自包含 HTML）
 * ------------------------------------------------------------
 * 用法：
 *   node scripts/genDashboard.js            # 读取 backend/data/analytics.json
 *   node scripts/genDashboard.js --sample   # 使用内置演示数据（先看效果）
 *
 * 输出：frontend/dashboard.html （内嵌最新聚合数据，双击即可离线查看）
 * ============================================================
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const STORE_PATH = path.join(ROOT, "backend/data/analytics.json");
const TPL_PATH = path.join(ROOT, "scripts/dashboard.template.html");
const OUT_PATH = path.join(ROOT, "frontend/dashboard.html");

const SAMPLE = {
  sessions: 137,
  events: 4218,
  byName: {
    game_start: 137, act_change: 412, scenario_start: 308, scenario_finish: 256,
    ending_reached: 198, report_view: 274, quickmode_start: 142, quickmode_finish: 119,
    redflag_hit: 633, option_choose: 1320, voice_on: 88, weakness_hit: 471,
    evidence_collect: 540, gallery_open: 96,
  },
  daily: {
    "2026-07-15": { sessions: 31, events: 920, byName: { game_start: 31, redflag_hit: 140 } },
    "2026-07-16": { sessions: 44, events: 1380, byName: { game_start: 44, redflag_hit: 208 } },
    "2026-07-17": { sessions: 28, events: 906, byName: { game_start: 28, redflag_hit: 132 } },
    "2026-07-18": { sessions: 34, events: 1012, byName: { game_start: 34, redflag_hit: 153 } },
  },
};

function loadStore(useSample) {
  if (useSample) return SAMPLE;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const obj = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
      return {
        sessions: obj.sessions || 0,
        events: obj.events || 0,
        byName: obj.byName || {},
        daily: obj.daily || {},
      };
    }
  } catch (e) {
    console.error("读取聚合数据失败，使用空数据:", e.message);
  }
  return { sessions: 0, events: 0, byName: {}, daily: {} };
}

function main() {
  const useSample = process.argv.includes("--sample");
  const store = loadStore(useSample);
  const tpl = fs.readFileSync(TPL_PATH, "utf8");
  if (!tpl.includes("__DATA_PLACEHOLDER__")) {
    console.error("模板缺少 __DATA_PLACEHOLDER__ 占位符，已中止。");
    process.exit(1);
  }
  const html = tpl.replace("__DATA_PLACEHOLDER__", JSON.stringify(store));
  fs.writeFileSync(OUT_PATH, html, "utf8");
  const mode = useSample ? "演示数据" : (fs.existsSync(STORE_PATH) ? "真实数据" : "空数据");
  console.log(`✅ 看板已生成: ${OUT_PATH}`);
  console.log(`   数据来源: ${mode} · 会话 ${store.sessions} · 事件 ${store.events} · 类型 ${Object.keys(store.byName).length} · 天数 ${Object.keys(store.daily).length}`);
}

main();
