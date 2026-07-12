# 反诈人生 · 部署指南（腾讯云 CloudBase）

本文档说明如何将「反诈人生」部署到腾讯云 CloudBase，包含**云函数（后端）**与**静态网站托管（前端）**两种部署方式。

---

## 一、项目结构（部署相关）

```
反诈人生/
├── backend/
│   ├── app.js              # Express 后端（端口读取 process.env.PORT，默认 3000）
│   ├── scf_bootstrap       # 云函数启动文件（无扩展名，已 chmod +x）
│   ├── package.json
│   └── node_modules/
├── frontend/
│   ├── index.html          # 前端页面（API 地址默认为 http://localhost:3000）
│   ├── style.css
│   └── script.js
├── cloudbaserc.json        # CloudBase 部署配置
└── docs/
    └── DEPLOY.md
```

---

## 二、前置准备

1. 注册并登录 [腾讯云 CloudBase 控制台](https://console.cloud.tencent.com/tcb)。
2. 创建一个 **云开发环境（环境 ID 形如 `fanzha-xxxxxx`）**，记下环境 ID。
3. 安装 CloudBase CLI：

   ```bash
   npm install -g @cloudbase/cli
   ```

4. 登录（浏览器扫码授权）：

   ```bash
   tcb login
   ```

---

## 三、云函数（后端）部署

### 1. 关键配置已就绪

- `backend/scf_bootstrap`（内容如下，已赋予可执行权限）：

  ```bash
  #!/bin/bash
  export PORT=9000
  node app.js
  ```

- `backend/app.js` 端口已支持环境变量：`const PORT = process.env.PORT || 3000;`
  CloudBase 云函数默认注入 `PORT=9000`，因此会自动监听 9000 端口。

- 密钥说明：`app.js` 通过环境变量 `TENCENTCLOUD_SECRET_ID` / `TENCENTCLOUD_SECRET_KEY` 读取混元密钥。**未配置时返回兜底假数据**，不影响部署与基础联调。

### 2. 部署命令（Framework 一键部署）

在**项目根目录**（`cloudbaserc.json` 所在目录）执行：

```bash
# 部署前先把 cloudbaserc.json 中的 {{envId}} 替换为你的环境 ID
# 替换命令示例（macOS）：
sed -i '' 's/{{envId}}/你的环境ID/g' cloudbaserc.json

# 一键部署（云函数 + 静态托管）
tcb framework deploy
```

部署完成后，后端 API 路径为 `https://<环境ID>.apigw.tcloudbase.com/api/*`（`/api` 前缀由 `cloudbaserc.json` 的 `path` 字段定义）。

> 说明：`cloudbaserc.json` 中的 `{{secretId}}` / `{{secretKey}}` 为占位符。若需真实调用混元，请替换为你的密钥，或部署后在 CloudBase 控制台「云函数 → fanzha-backend → 环境变量」中手动配置。

---

## 四、静态网站托管（前端）部署

### 方案 A：通过 CLI（已包含在 framework 配置中）

`cloudbaserc.json` 的 `frontend` 插件使用 `@cloudbase/framework-plugin-website`，
执行 `tcb framework deploy` 时会自动将 `frontend/` 目录上传到静态托管路径 `/fanzha`。

部署后可访问：`https://<环境ID>.tcloudbaseapp.com/fanzha/index.html`

### 方案 B：通过控制台手动上传

1. 打开 [CloudBase 控制台](https://console.cloud.tencent.com/tcb) → 选择你的环境。
2. 左侧菜单进入 **「静态网站托管」**（若未开通，按提示开通并绑定自定义域名或使用默认域名）。
3. 点击 **「文件管理」→「上传文件夹」**，选择本地 `frontend` 目录。
4. 上传完成后，在文件列表中找到 `index.html`，点击「详情 / 访问」获取访问地址。
5. 默认访问地址形如：`https://<环境ID>.tcloudbaseapp.com/index.html`

### ⚠️ 部署后必须修改前端 API 地址

前端 `frontend/index.html` 中 `API_BASE` 默认为 `http://localhost:3000`。
部署到云端后，需改为云函数网关地址，否则无法联调：

```js
// frontend/index.html 中
const API_BASE = "https://<环境ID>.apigw.tcloudbase.com"; // 仅保留域名，/api 已在请求路径中
```

改完后重新上传 `frontend` 目录即可。

---

## 五、跨域（CORS）说明

后端 `app.js` 已启用 `cors()` 允许跨域。若静态托管域名与云函数网关域名不同源，
CORS 已放开，无需额外配置。

---

## 六、本地联调回顾

```bash
# 后端（根目录 backend）
cd backend && node app.js          # 默认 3000 端口

# 前端（任意静态服务器）
cd frontend && python3 -m http.server 8080
# 浏览器打开 http://localhost:8080/index.html
```
