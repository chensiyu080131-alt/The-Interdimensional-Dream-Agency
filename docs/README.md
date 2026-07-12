# 反诈人生

"反诈人生" 是一个帮助用户识别和防范电信网络诈骗的 Web 应用。

## 项目结构

```
反诈人生/
├── frontend/   # 前端页面（HTML / CSS / JS）
├── backend/    # 后端 API 服务（Node.js + Express）
└── docs/       # 项目文档
```

## 模块说明

- **frontend**：面向用户的交互界面，提供诈骗内容输入与风险分析展示。
- **backend**：基于 Express 的 API 服务，集成腾讯混元大模型进行内容分析，
  依赖 `express`、`body-parser`、`cors` 与 `tencentcloud-sdk-nodejs-hunyuan`。
- **docs**：项目相关文档。

## 后续规划

- 接入腾讯混元大模型实现诈骗内容智能识别。
- 增加诈骗案例库与风险等级评估。
- 完善前后端联调与部署流程。
