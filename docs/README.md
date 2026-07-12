# 反诈人生 · 项目文档中心

"反诈人生" 是一个帮助用户识别和防范电信网络诈骗的 Web 应用（腾讯黑客松比赛项目）。

## 文档导航

| 文档 | 说明 |
|------|------|
| [README.md](./README.md) | 本文件：项目文档索引 |
| [DEPLOY.md](./DEPLOY.md) | 部署指南（腾讯云 CloudBase 云函数 + 静态托管） |
| [RISK-MANAGEMENT.md](./RISK-MANAGEMENT.md) | **产品风险管控文档**：15 个风险点（法律合规 / 内容伦理 / 技术运营）+ 管控总览表 + 执行清单 + 合规依据索引 |

## 项目结构

```
反诈人生/
├── frontend/   # 前端页面（HTML / CSS / JS）
├── backend/    # 后端 API 服务（Node.js + Express）
├── docs/       # 项目文档（部署、风险管理等）
└── README.md   # 顶层说明
```

## 模块说明

- **frontend**：面向用户的交互界面，提供诈骗内容输入、风险分析展示、防骗指南与可转发短图文。
- **backend**：基于 Express 的 API 服务，集成腾讯混元大模型进行内容分析，
  依赖 `express`、`body-parser`、`cors` 与 `tencentcloud-sdk-nodejs-hunyuan`，提供 `/api/chat`、`/api/finance`、`/api/educate`、`/api/guide` 等接口。
- **docs**：项目相关文档，含部署与风险管理。

## 后续规划

- 接入腾讯混元大模型实现诈骗内容智能识别。
- 增加诈骗案例库与风险等级评估。
- 完善前后端联调与部署流程。
- 持续维护 [风险管理文档](./RISK-MANAGEMENT.md)，随合规新规迭代。
