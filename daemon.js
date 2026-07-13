/**
 * 反诈人生 · 启动守护进程
 * 负责：1) 确保依赖已安装；2) 启动后端并保持其存活（崩溃自动重启）。
 * 后端已内置静态托管前端（http://localhost:3000/ 即游戏页面），
 * 因此只需本进程存活，整个项目即可访问，最大化打开稳定性。
 */
const { spawn, spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ROOT = __dirname;
const BACKEND_DIR = path.join(ROOT, "backend");
const NODE_MODULES = path.join(BACKEND_DIR, "node_modules");

function ensureDeps() {
  if (!fs.existsSync(NODE_MODULES)) {
    console.log("[守护] 首次运行，正在安装后端依赖（可能需数十秒）…");
    const r = spawnSync("npm", ["install"], { cwd: BACKEND_DIR, stdio: "inherit" });
    if (r.status !== 0) {
      console.error("[守护] 依赖安装失败，请手动在 backend 目录执行 npm install");
      process.exit(1);
    }
    console.log("[守护] 依赖安装完成");
  }
}

function startBackend() {
  const child = spawn("node", ["app.js"], {
    cwd: BACKEND_DIR,
    stdio: "inherit",
    env: process.env,
  });

  let stopping = false;
  child.on("exit", (code, signal) => {
    if (stopping) return;
    if (signal === "SIGTERM" || signal === "SIGINT") return;
    console.log(`[守护] 后端进程退出（code=${code}），3 秒后自动重启…`);
    setTimeout(startBackend, 3000);
  });

  // 转发退出信号，避免守护进程成为孤儿
  const shutdown = () => {
    stopping = true;
    child.kill("SIGTERM");
    setTimeout(() => process.exit(0), 1000);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return child;
}

console.log("========================================");
console.log("  反诈人生 · 启动中");
console.log("  游戏地址： http://localhost:3000/");
console.log("  按 Ctrl+C 停止");
console.log("========================================");

ensureDeps();
startBackend();
