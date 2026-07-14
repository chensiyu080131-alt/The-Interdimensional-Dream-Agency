/**
 * ============================================================
 * 任务检测服务
 * ------------------------------------------------------------
 * 职责：
 *   1. 根据玩家输入 + AI 回复检测任务触发
 *   2. 追踪任务进度（百分比）
 *   3. 支持对话轮次计数
 *   4. 关键词匹配（中文分词 + 正则）
 *   5. 返回 taskUpdate 供前端更新
 * ============================================================
 */

/* ================================================================
 * 任务定义 —— 每种身份的任务列表
 * 每个任务包含：
 *   - id: 任务唯一标识
 *   - title: 任务名称
 *   - keywords: 触发关键词列表（支持正则）
 *   - progressRules: 进度计算规则 [{type, value, increment}]
 *     type: "keyword" | "round" | "trust" | "combo"
 *   - completionThreshold: 进度达到多少%时标记为完成（默认100）
 * ================================================================ */
const TASK_DEFINITIONS = {
  hunter: [
    {
      id: "t1",
      title: "建立联系（3轮对话）",
      keywords: ["你好", "认识", "聊天", "朋友", "加好友", "联系", "投缘"],
      progressRules: [
        { type: "round", increment: 34 }, // 每轮对话+34%（3轮=102%）
      ],
      completionThreshold: 100,
    },
    {
      id: "t2",
      title: "获取投资项目名称",
      keywords: [
        "什么项目", "什么消息", "内部", "投资", "项目名称",
        "什么平台", "恒盈", "量化", "做什么的", "什么业务",
        "哪家公司", "什么产品",
      ],
      progressRules: [
        { type: "keyword", increment: 50 }, // 关键词匹配+50%
        { type: "combo", keywords: ["项目", "投资", "收益"], increment: 50 }, // 组合关键词额外+50%
      ],
      completionThreshold: 100,
    },
    {
      id: "t3",
      title: "确认张浩上级信息",
      keywords: [
        "你舅舅", "你上线", "你上级", "你老板", "谁带你",
        "陈总", "上面是谁", "谁介绍的", "谁是领导",
        "你领导", "你师父", "谁管的",
      ],
      progressRules: [
        { type: "keyword", increment: 50 },
        { type: "combo", keywords: ["舅舅", "上级", "陈总"], increment: 50 },
      ],
      completionThreshold: 100,
    },
    {
      id: "t4",
      title: "紧急联系小雅阻止转账",
      keywords: [
        "小雅", "别转", "别投", "报警", "冻结", "止损",
        "别再交", "保证金", "被骗", "快停", "别转账",
      ],
      progressRules: [
        { type: "keyword", increment: 40 },
        { type: "combo", keywords: ["小雅", "报警", "转账"], increment: 60 },
      ],
      completionThreshold: 100,
    },
    {
      id: "t5",
      title: "保存转账/收益证据",
      keywords: [
        "截图", "保存", "证据", "记录", "留证", "拍照",
        "录屏", "保留", "存一下", "截屏",
      ],
      progressRules: [
        { type: "keyword", increment: 50 },
        { type: "round", increment: 10 }, // 对话推进+10%
      ],
      completionThreshold: 100,
    },
    {
      id: "t6",
      title: "等待收网指令",
      keywords: [
        "收网", "老K", "抓捕", "行动", "收工", "可以了",
        "证据够了", "准备行动",
      ],
      progressRules: [
        { type: "keyword", increment: 60 },
        { type: "trust", threshold: 75, increment: 40 },
      ],
      completionThreshold: 100,
    },
  ],

  scribe: [
    {
      id: "t1",
      title: "取得小雅信任",
      keywords: ["小雅", "信任", "相信", "放心", "告诉"],
      progressRules: [{ type: "keyword", increment: 50 }, { type: "round", increment: 15 }],
      completionThreshold: 100,
    },
    {
      id: "t2",
      title: "收集骗术套路",
      keywords: ["套路", "话术", "加群", "老师带单", "晒收益", "截图", "流程"],
      progressRules: [{ type: "keyword", increment: 35 }, { type: "round", increment: 15 }],
      completionThreshold: 100,
    },
    {
      id: "t3",
      title: "假装受害者接触张浩",
      keywords: ["想投", "带我", "操作", "充钱", "怎么玩", "开户"],
      progressRules: [{ type: "keyword", increment: 50 }, { type: "combo", keywords: ["投", "操作", "充"], increment: 50 }],
      completionThreshold: 100,
    },
    {
      id: "t4",
      title: "锁定上线真实信息",
      keywords: ["上线", "老板", "陈总", "公司", "名字", "身份", "真实姓名"],
      progressRules: [{ type: "keyword", increment: 60 }, { type: "round", increment: 10 }],
      completionThreshold: 100,
    },
  ],

  lighthouse: [
    {
      id: "t1",
      title: "劝住小雅停止转账",
      keywords: ["别再转", "停", "别交", "别投", "止损", "冻结", "不要转"],
      progressRules: [{ type: "keyword", increment: 50 }, { type: "round", increment: 20 }],
      completionThreshold: 100,
    },
    {
      id: "t2",
      title: "识别当前骗局阶段",
      keywords: ["杀猪盘", "骗局", "诈骗", "套路", "收割", "养猪", "诱猪"],
      progressRules: [{ type: "keyword", increment: 60 }, { type: "round", increment: 20 }],
      completionThreshold: 100,
    },
    {
      id: "t3",
      title: "安抚受害者情绪",
      keywords: ["别怕", "不是你的错", "会好的", "我理解", "别自责", "正常"],
      progressRules: [{ type: "keyword", increment: 40 }, { type: "round", increment: 20 }],
      completionThreshold: 100,
    },
    {
      id: "t4",
      title: "向警方提供线索",
      keywords: ["报警", "96110", "警察", "举报", "线索", "证据", "信息"],
      progressRules: [{ type: "keyword", increment: 60 }, { type: "round", increment: 10 }],
      completionThreshold: 100,
    },
  ],

  drift: [
    {
      id: "t1",
      title: "完成3轮日常对话",
      keywords: ["你好", "聊天", "天气", "工作", "生活"],
      progressRules: [{ type: "round", increment: 34 }],
      completionThreshold: 100,
    },
    {
      id: "t2",
      title: "判断对方是否可信",
      keywords: ["可信", "骗子", "怀疑", "不对劲", "奇怪", "骗人", "不靠谱"],
      progressRules: [{ type: "keyword", increment: 50 }, { type: "round", increment: 20 }],
      completionThreshold: 100,
    },
    {
      id: "t3",
      title: "识别骗术类型",
      keywords: ["杀猪盘", "投资骗局", "内部消息", "充值", "转账", "套路"],
      progressRules: [{ type: "keyword", increment: 50 }, { type: "round", increment: 15 }],
      completionThreshold: 100,
    },
  ],

  seeker: [
    {
      id: "t1",
      title: "找到陈露最后线索",
      keywords: ["陈露", "线索", "最后", "消息", "定位", "在哪里", "地址"],
      progressRules: [{ type: "keyword", increment: 50 }, { type: "round", increment: 15 }],
      completionThreshold: 100,
    },
    {
      id: "t2",
      title: "假装汇款取得骗子信任",
      keywords: ["汇款", "转账", "给钱", "交钱", "担保费", "安排", "相信"],
      progressRules: [{ type: "keyword", increment: 50 }, { type: "combo", keywords: ["汇款", "安排", "相信"], increment: 50 }],
      completionThreshold: 100,
    },
    {
      id: "t3",
      title: "锁定陈露被困地点",
      keywords: ["园区", "地点", "口岸", "地址", "定位", "在哪儿", "哪里"],
      progressRules: [{ type: "keyword", increment: 60 }, { type: "round", increment: 10 }],
      completionThreshold: 100,
    },
    {
      id: "t4",
      title: "报警而不激怒骗子",
      keywords: ["报警", "警察", "96110", "警方", "举报", "线索"],
      progressRules: [{ type: "keyword", increment: 60 }, { type: "round", increment: 10 }],
      completionThreshold: 100,
    },
  ],

  mole: [
    {
      id: "t1",
      title: "摸清团队结构",
      keywords: ["结构", "团队", "分工", "谁管", "多少人", "组织"],
      progressRules: [{ type: "keyword", increment: 40 }, { type: "round", increment: 15 }],
      completionThreshold: 100,
    },
    {
      id: "t2",
      title: "记录诈骗完整流程",
      keywords: ["流程", "步骤", "话术", "套路", "操作", "记录", "记下"],
      progressRules: [{ type: "keyword", increment: 40 }, { type: "round", increment: 15 }],
      completionThreshold: 100,
    },
    {
      id: "t3",
      title: "锁定团队负责人",
      keywords: ["负责人", "陈总", "老板", "浩哥", "头目", "上面", "谁管事"],
      progressRules: [{ type: "keyword", increment: 50 }, { type: "round", increment: 10 }],
      completionThreshold: 100,
    },
    {
      id: "t4",
      title: "在暴露前传出证据",
      keywords: ["传出", "发出", "发送", "证据", "截图", "数据", "传出去"],
      progressRules: [{ type: "keyword", increment: 60 }, { type: "round", increment: 10 }],
      completionThreshold: 100,
    },
  ],
};

/* ================================================================
 * 会话进度追踪器 —— 为每个会话维护任务进度
 * 键：sessionId，值：{ identity, roundCount, taskProgress: { taskId: progress% } }
 * ================================================================ */
const sessionStore = new Map();

function getSession(sessionId) {
  if (!sessionStore.has(sessionId)) {
    sessionStore.set(sessionId, {
      roundCount: 0,
      taskProgress: {}, // { taskId: number 0-100 }
      lastPlayerMessage: "",
      lastAiReply: "",
    });
  }
  return sessionStore.get(sessionId);
}

/**
 * 清理过期会话（超过30分钟未活动的）
 */
function cleanupSessions(maxAge = 30 * 60 * 1000) {
  const now = Date.now();
  for (const [id, session] of sessionStore.entries()) {
    if (now - session.lastActivity > maxAge) {
      sessionStore.delete(id);
    }
  }
}

// 每10分钟清理一次
setInterval(cleanupSessions, 10 * 60 * 1000);

/* ================================================================
 * 核心检测函数
 * ================================================================ */

/**
 * 检测单条消息中的关键词命中情况
 * @param {string} text - 待检测文本
 * @param {string[]} keywords - 关键词列表
 * @returns {number} - 命中的关键词数量
 */
function countKeywordHits(text, keywords) {
  if (!text || !keywords || keywords.length === 0) return 0;
  const lower = text.toLowerCase();
  let hits = 0;
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) {
      hits++;
    }
  }
  return hits;
}

/**
 * 检测组合关键词（所有关键词必须同时出现）
 * @param {string} text - 待检测文本
 * @param {string[]} keywords - 必须同时出现的关键词列表
 * @returns {boolean}
 */
function matchCombo(text, keywords) {
  if (!text || !keywords || keywords.length === 0) return false;
  const lower = text.toLowerCase();
  return keywords.every((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * 根据进度规则计算本轮增量
 * @param {Object} rule - 进度规则
 * @param {Object} context - 上下文 { playerMessage, aiReply, roundCount, trustValue, taskKeywords }
 * @returns {number} - 本轮增量（0-100）
 */
function calcRuleIncrement(rule, context) {
  const { playerMessage = "", aiReply = "", roundCount = 0, trustValue = 50, taskKeywords = [] } = context;
  const combined = `${playerMessage} ${aiReply}`;

  switch (rule.type) {
    case "round":
      // 对话轮次推进（只在有有效对话时生效）
      if (playerMessage.trim().length > 0) {
        return rule.increment || 10;
      }
      return 0;

    case "keyword":
      // 关键词命中：优先使用规则自身的关键词，否则使用任务级关键词
      {
        const keywords = rule.keywords || taskKeywords;
        if (keywords.length > 0 && countKeywordHits(combined, keywords) > 0) {
          return rule.increment || 30;
        }
      }
      return 0;

    case "combo":
      // 组合关键词（必须同时出现）
      if (rule.keywords && matchCombo(combined, rule.keywords)) {
        return rule.increment || 50;
      }
      return 0;

    case "trust":
      // 信任值阈值触发
      if (trustValue >= (rule.threshold || 70)) {
        return rule.increment || 20;
      }
      return 0;

    default:
      return 0;
  }
}

/**
 * 计算任务的最新进度
 * @param {Object} taskDef - 任务定义
 * @param {Object} session - 会话状态
 * @param {Object} context - 本轮上下文
 * @returns {{ progress: number, updated: boolean, completed: boolean }}
 */
function calcTaskProgress(taskDef, session, context) {
  const prevProgress = session.taskProgress[taskDef.id] || 0;
  let increment = 0;

  // 将任务级关键词传入上下文
  const ruleContext = {
    ...context,
    taskKeywords: taskDef.keywords || [],
  };

  for (const rule of taskDef.progressRules) {
    increment += calcRuleIncrement(rule, ruleContext);
  }

  // 限制单轮最大增量
  increment = Math.min(increment, 100);

  const newProgress = Math.min(100, prevProgress + increment);
  const threshold = taskDef.completionThreshold || 100;

  return {
    progress: newProgress,
    updated: newProgress > prevProgress,
    completed: newProgress >= threshold,
    increment,
  };
}

/**
 * 主检测入口 —— 每次 AI 回复后调用
 * @param {Object} params
 * @param {string} params.playerMessage - 玩家本轮输入
 * @param {string} params.aiReply - AI 生成的回复
 * @param {string} params.identity - 玩家身份
 * @param {Array} params.tasks - 当前任务列表 [{id, title, status}]
 * @param {string} [params.sessionId] - 会话ID（用于追踪进度）
 * @param {number} [params.trustValue] - 当前信任值
 * @returns {Object|null} taskUpdate 或 null
 */
function detectTaskUpdate({ playerMessage = "", aiReply = "", identity = "hunter", tasks = [], sessionId = "default", trustValue = 50 }) {
  if (!tasks || tasks.length === 0) return null;

  // 获取或创建会话
  const session = getSession(sessionId);
  session.roundCount += 1;
  session.lastActivity = Date.now();
  session.lastPlayerMessage = playerMessage;
  session.lastAiReply = aiReply;

  const taskDefs = TASK_DEFINITIONS[identity];
  if (!taskDefs) return null;

  const context = {
    playerMessage,
    aiReply,
    roundCount: session.roundCount,
    trustValue,
  };

  // 只检查状态为 "active" 的任务
  const activeTasks = tasks.filter((t) => t.status === "active");
  if (activeTasks.length === 0) return null;

  // 找到当前活跃任务中匹配度最高的
  let bestResult = null;
  let bestIncrement = 0;

  for (const task of activeTasks) {
    const taskDef = taskDefs.find((td) => td.id === task.id);
    if (!taskDef) continue;

    const result = calcTaskProgress(taskDef, session, context);

    // 更新会话中的进度
    session.taskProgress[taskDef.id] = result.progress;

    // 选择增量最大的作为本轮更新
    if (result.increment > bestIncrement) {
      bestIncrement = result.increment;
      bestResult = {
        taskId: task.id,
        taskTitle: taskDef.title,
        status: result.completed ? "completed" : "updated",
        progress: result.progress,
        increment: result.increment,
      };
    }
  }

  // 如果本轮没有明显进度，但对话轮次对活跃任务有贡献
  // 返回一个轻量更新告知前端进度
  if (!bestResult && activeTasks.length > 0) {
    const firstActive = activeTasks[0];
    const taskDef = taskDefs.find((td) => td.id === firstActive.id);
    if (taskDef) {
      // 检查是否有关键词匹配（使用任务级关键词）
      const taskKw = taskDef.keywords || [];
      if (taskKw.length > 0) {
        const hits = countKeywordHits(`${playerMessage} ${aiReply}`, taskKw);
        if (hits > 0) {
          const prev = session.taskProgress[firstActive.id] || 0;
          // 从规则中找到 keyword 类型的增量值
          const kwRule = taskDef.progressRules.find(r => r.type === "keyword");
          const ruleInc = kwRule ? kwRule.increment : 30;
          const inc = Math.min(ruleInc * hits, 100);
          const prog = Math.min(100, prev + inc);
          session.taskProgress[firstActive.id] = prog;

          return {
            taskId: firstActive.id,
            taskTitle: taskDef.title,
            status: prog >= (taskDef.completionThreshold || 100) ? "completed" : "updated",
            progress: prog,
            increment: inc,
          };
        }
      }
    }

    // 纯轮次推进
    const prev = session.taskProgress[firstActive.id] || 0;
    const inc = Math.min(5, 100 - prev); // 纯对话轮次小幅度推进
    if (inc > 0) {
      const prog = prev + inc;
      session.taskProgress[firstActive.id] = prog;
      return {
        taskId: firstActive.id,
        taskTitle: taskDef ? taskDef.title : firstActive.title,
        status: prog >= 100 ? "completed" : "updated",
        progress: prog,
        increment: inc,
      };
    }
  }

  return bestResult;
}

/**
 * 获取指定任务的当前进度
 * @param {string} taskId - 任务ID
 * @param {string} sessionId - 会话ID
 * @returns {number} - 0-100
 */
function getTaskProgress(taskId, sessionId = "default") {
  const session = getSession(sessionId);
  return session.taskProgress[taskId] || 0;
}

/**
 * 获取所有任务进度
 * @param {string} sessionId - 会话ID
 * @returns {Object} - { taskId: progress }
 */
function getAllTaskProgress(sessionId = "default") {
  const session = getSession(sessionId);
  return { ...session.taskProgress };
}

/**
 * 重置会话进度
 * @param {string} sessionId - 会话ID
 */
function resetSession(sessionId = "default") {
  sessionStore.delete(sessionId);
}

module.exports = {
  TASK_DEFINITIONS,
  detectTaskUpdate,
  getTaskProgress,
  getAllTaskProgress,
  resetSession,
};
