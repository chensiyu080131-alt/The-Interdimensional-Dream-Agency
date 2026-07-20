#!/usr/bin/env bash
# ============================================================
# 反诈人生 · CloudBase 静态托管部署脚本 (V9 修复版)
# 用途：把本地已修复的 V9 前端推到公网
#        https://ai-d9gd4xji5de241243-1453144747.tcloudbaseapp.com/
#
# ⚠️ 关键背景（防止主页回退成旧版）：
#   公网 /index.html 当前跑的是 V9 的 app8.js 栈；但本地
#   frontend/index.html 是旧 app7.js 引擎。若直接整包上传会
#   把公网主页从 V9 回退成旧版。因此本脚本默认先“同步线上
#   index.html 到本地”（即保留当前能跑的 V9 主页），再整包
#   部署，等于只升级 JS、不动主页结构 → 零回归。
# ============================================================
set -euo pipefail

ENV_ID="ai-d9gd4xji5de241243"
PROJ_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJ_DIR"
echo "▶ 项目目录: $PROJ_DIR"

# 1) 确保 CLI 可用
if ! command -v tcb >/dev/null 2>&1; then
  echo "▶ 未检测到 tcb，尝试安装 @cloudbase/cli ..."
  npm i -g @cloudbase/cli
fi
tcb --version

# 2) 凭证（二选一）：
#    A) 交互登录：直接运行 `tcb login`（会打开浏览器授权）
#    B) 非交互：导出环境变量后本脚本自动使用
#         export SECRETID=xxxx
#         export SECRETKEY=xxxx
if [[ -n "${SECRETID:-}" && -n "${SECRETKEY:-}" ]]; then
  echo "▶ 使用 SECRETID/SECRETKEY 环境变量鉴权"
  export TCB_SECRETID="$SECRETID"
  export TCB_SECRETKEY="$SECRETKEY"
else
  echo "▶ 未提供 SECRETID/SECRETKEY，尝试 tcb login 交互鉴权"
  tcb login
fi

# 3) 防回退：先把线上正在运行的 V9 index.html 同步回本地（先备份）
echo "▶ 备份本地 index.html -> index.html.bak"
cp -f frontend/index.html frontend/index.html.bak 2>/dev/null || true
echo "▶ 拉取线上当前 index.html（保留 V9 主页结构）"
if command -v curl >/dev/null 2>&1; then
  curl -fsSL "https://${ENV_ID}-1453144747.tcloudbaseapp.com/index.html" -o frontend/index.html
else
  python3 - <<'PY'
import urllib.request
url="https://${ENV_ID}-1453144747.tcloudbaseapp.com/index.html"
open("frontend/index.html","wb").write(urllib.request.urlopen(url,timeout=30).read())
PY
fi
echo "▶ 已用线上 V9 index.html 覆盖本地（部署即纯 JS 升级，不回退主页）"

# 4) 执行部署（framework 模式，读 cloudbaserc.json）
echo "▶ 开始部署 frontend/ -> cloudPath / ..."
tcb framework deploy --e "$ENV_ID"

echo "✅ 部署完成。请访问 https://${ENV_ID}-1453144747.tcloudbaseapp.com/ 验证 V9 修复是否生效"
echo "   建议核对：场景实战是否不再崩溃、生成报告是否不再报错。"
