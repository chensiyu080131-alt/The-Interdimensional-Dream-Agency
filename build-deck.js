const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const { FaShieldAlt, FaUserShield, FaEye, FaChartLine, FaLightbulb, FaLayerGroup, FaBrain, FaGlobeAsia, FaLock, FaCode, FaPlay, FaChevronRight, FaStar, FaCheckCircle, FaExclamationTriangle, FaArrowRight } = require("react-icons/fa");

// ========== Color Palette (Cherry Bold inspired — 反诈严肃专业主题) ==========
const C = {
  cherry:    "990011",
  darkRed:   "7A000D",
  navy:      "1B2A4A",
  offWhite:  "F5F0EC",
  cream:     "EDE4DC",
  white:     "FFFFFF",
  darkText:  "1A1A1A",
  gray:      "6B7280",
  lightGray: "D1D5DB",
  accentGold:"D4A84B",
  mutedRed:  "C44B4B",
};

// ========== Helpers ==========
function renderIconSvg(IconComponent, color = "#000000", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// Factory function to avoid shared object mutation
const makeShadow = () => ({ type: "outer", blur: 6, offset: 3, angle: 135, color: "000000", opacity: 0.12 });

// ========== Create Presentation ==========
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "反诈人生团队";
pres.title = "反诈人生 — 作品介绍";

// ========== Slide 1: Cover ==========
(async () => {
  const shieldIcon = await iconToBase64Png(FaShieldAlt, "#FFFFFF", 256);

  const s1 = pres.addSlide();
  s1.background = { color: C.cherry };

  // Top accent bar
  s1.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accentGold } });

  // Shield icon
  s1.addImage({ data: shieldIcon, x: 4.35, y: 0.8, w: 1.3, h: 1.3 });

  // Main title
  s1.addText("反诈人生", {
    x: 0.5, y: 2.2, w: 9, h: 1.0,
    fontSize: 52, fontFace: "Georgia", color: C.white, bold: true,
    align: "center", valign: "middle", margin: 0,
  });

  // Subtitle
  s1.addText("任务驱动的反诈沉浸式互动叙事模拟器", {
    x: 1, y: 3.1, w: 8, h: 0.5,
    fontSize: 18, fontFace: "Calibri", color: C.offWhite,
    align: "center", valign: "middle", margin: 0,
  });

  // Tagline
  s1.addText("在虚拟的骗局中，学会在现实中保护自己", {
    x: 1.5, y: 3.65, w: 7, h: 0.4,
    fontSize: 13, fontFace: "Calibri", color: C.accentGold, italic: true,
    align: "center", valign: "middle", margin: 0,
  });

  // Bottom bar
  s1.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.1, w: 10, h: 0.525, fill: { color: C.darkRed } });
  s1.addText("腾讯黑客松参赛项目  |  反诈教育 × 沉浸式体验", {
    x: 0.5, y: 5.1, w: 9, h: 0.525,
    fontSize: 11, fontFace: "Calibri", color: C.offWhite,
    align: "center", valign: "middle", margin: 0,
  });

  // ========== Slide 2: 作品简介 ==========
  const s2 = pres.addSlide();
  s2.background = { color: C.offWhite };

  // Left accent bar
  s2.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.08, h: 5.625, fill: { color: C.cherry } });

  s2.addText("作品简介", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 32, fontFace: "Georgia", color: C.cherry, bold: true,
    align: "left", valign: "middle", margin: 0,
  });

  // Intro text
  s2.addText([
    { text: "「反诈人生」", options: { bold: true, color: C.cherry } },
    { text: "是一款", options: { color: C.darkText } },
    { text: "任务驱动的反诈沉浸式互动叙事模拟器", options: { bold: true, color: C.navy } },
    { text: "。\n\n作品将电信网络诈骗的常见套路融入角色扮演游戏中，让用户以", options: { color: C.darkText } },
    { text: "卧底警察、记者、志愿者、普通网友", options: { bold: true, color: C.cherry } },
    { text: "等不同身份，在与 AI 骗子的沉浸式对话中经历完整的", options: { color: C.darkText } },
    { text: "「希望 → 崩塌 → 废墟 → 回放 → 盾牌」", options: { bold: true, color: C.accentGold } },
    { text: "情感曲线，在\"完成任务的同时不被骗\"的过程中，自然习得识别和防范诈骗的能力。", options: { color: C.darkText } },
  ], {
    x: 0.5, y: 1.15, w: 5.5, h: 3.0,
    fontSize: 14, fontFace: "Calibri", valign: "top", margin: 0,
    lineSpacingMultiple: 1.6,
  });

  // Right side stat callouts
  const stats = [
    { num: "46万+", label: "2023年全国电诈案件", icon: FaExclamationTriangle },
    { num: "300亿+", label: "涉案金额（元）", icon: FaChartLine },
    { num: "6", label: "可选角色身份", icon: FaUserShield },
    { num: "30+", label: "可能结局走向", icon: FaStar },
  ];

  for (let i = 0; i < stats.length; i++) {
    const y = 1.15 + i * 0.78;
    const iconData = await iconToBase64Png(stats[i].icon, "#" + C.cherry, 64);

    // Card background
    s2.addShape(pres.shapes.RECTANGLE, {
      x: 6.4, y: y, w: 3.2, h: 0.65,
      fill: { color: C.white }, shadow: makeShadow(),
    });
    // Left accent on card
    s2.addShape(pres.shapes.RECTANGLE, { x: 6.4, y: y, w: 0.06, h: 0.65, fill: { color: C.cherry } });

    s2.addImage({ data: iconData, x: 6.65, y: y + 0.1, w: 0.4, h: 0.4 });

    s2.addText(stats[i].num, {
      x: 7.15, y: y + 0.05, w: 2.2, h: 0.35,
      fontSize: 20, fontFace: "Georgia", color: C.cherry, bold: true,
      margin: 0,
    });
    s2.addText(stats[i].label, {
      x: 7.15, y: y + 0.35, w: 2.2, h: 0.25,
      fontSize: 9, fontFace: "Calibri", color: C.gray,
      margin: 0,
    });
  }

  // ========== Slide 3: 创作背景 ==========
  const s3 = pres.addSlide();
  s3.background = { color: C.navy };

  s3.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accentGold } });

  s3.addText("创作背景", {
    x: 0.5, y: 0.35, w: 9, h: 0.6,
    fontSize: 32, fontFace: "Georgia", color: C.white, bold: true,
    align: "left", valign: "middle", margin: 0,
  });

  // Three cards: Problem, Insight, Inspiration
  const cards3 = [
    {
      title: "社会痛点",
      body: "电信网络诈骗已成为最严峻的社会问题之一。传统反诈宣传以说教、传单、警示视频为主，用户被动接受，记忆留存率低。",
      icon: FaExclamationTriangle,
    },
    {
      title: "设计理念",
      body: "从体验式学习出发，借鉴游戏化设计思维：与其告诉用户\"不要转账\"，不如让他们在模拟中亲历被骗，形成深刻的\"免疫记忆\"。",
      icon: FaBrain,
    },
    {
      title: "灵感来源",
      body: "真实诈骗案例剧本化改编（刷单返利、杀猪盘、冒充公检法）+ 社会心理学\"说服\"研究 + 互动叙事游戏设计理念。",
      icon: FaLightbulb,
    },
  ];

  for (let i = 0; i < cards3.length; i++) {
    const x = 0.5 + i * 3.1;
    const iconData = await iconToBase64Png(cards3[i].icon, "#" + C.accentGold, 80);

    s3.addShape(pres.shapes.RECTANGLE, {
      x: x, y: 1.3, w: 2.85, h: 3.6,
      fill: { color: C.white, transparency: 10 },
      shadow: makeShadow(),
    });

    // Top icon
    s3.addImage({ data: iconData, x: x + 1.1, y: 1.55, w: 0.6, h: 0.6 });

    s3.addText(cards3[i].title, {
      x: x + 0.2, y: 2.3, w: 2.45, h: 0.45,
      fontSize: 18, fontFace: "Georgia", color: C.accentGold, bold: true,
      align: "center", margin: 0,
    });

    s3.addText(cards3[i].body, {
      x: x + 0.25, y: 2.85, w: 2.35, h: 1.8,
      fontSize: 11, fontFace: "Calibri", color: C.offWhite,
      align: "left", valign: "top", margin: 0,
      lineSpacingMultiple: 1.5,
    });
  }

  // ========== Slide 4: 六大身份系统 ==========
  const s4 = pres.addSlide();
  s4.background = { color: C.offWhite };
  s4.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.08, h: 5.625, fill: { color: C.cherry } });

  s4.addText("六大身份系统", {
    x: 0.5, y: 0.25, w: 9, h: 0.55,
    fontSize: 32, fontFace: "Georgia", color: C.cherry, bold: true,
    align: "left", valign: "middle", margin: 0,
  });

  s4.addText("玩家从 6 个身份中选择，每个身份拥有 4-6 个递进式任务，部分身份需解锁", {
    x: 0.5, y: 0.85, w: 9, h: 0.35,
    fontSize: 12, fontFace: "Calibri", color: C.gray,
    margin: 0,
  });

  const roles = [
    { name: "猎鹰", sub: "卧底警察", diff: "★★★★★", desc: "打入诈骗团伙内部，收集证据配合收网", color: C.cherry },
    { name: "笔锋", sub: "记者调查员", diff: "★★★★☆", desc: "调查诈骗产业链，撰写深度报道", color: C.mutedRed },
    { name: "灯塔", sub: "反诈志愿者", diff: "★★★☆☆", desc: "在骗局中及时提醒正在被骗的人", color: C.accentGold },
    { name: "浮萍", sub: "普通网友", diff: "★★☆☆☆", desc: "偶遇骗子，识别骗术，全身而退", color: C.navy },
    { name: "寻人", sub: "受害者朋友", diff: "★★★★☆", desc: "寻找失联好友，假装汇款获取线索", color: C.mutedRed },
    { name: "鼹鼠", sub: "内部线人", diff: "★★★★★", desc: "潜伏诈骗窝点，为警方提供情报", color: C.cherry },
  ];

  for (let i = 0; i < roles.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.5 + col * 3.1;
    const y = 1.4 + row * 2.0;

    s4.addShape(pres.shapes.RECTANGLE, {
      x: x, y: y, w: 2.85, h: 1.75,
      fill: { color: C.white }, shadow: makeShadow(),
    });

    // Top color strip
    s4.addShape(pres.shapes.RECTANGLE, { x: x, y: y, w: 2.85, h: 0.06, fill: { color: roles[i].color } });

    // Name
    s4.addText(roles[i].name, {
      x: x + 0.2, y: y + 0.15, w: 2.2, h: 0.4,
      fontSize: 20, fontFace: "Georgia", color: roles[i].color, bold: true,
      margin: 0,
    });

    // Subtitle
    s4.addText(roles[i].sub, {
      x: x + 0.2, y: y + 0.55, w: 1.3, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: C.gray,
      margin: 0,
    });

    // Difficulty
    s4.addText(roles[i].diff, {
      x: x + 1.5, y: y + 0.55, w: 1.2, h: 0.3,
      fontSize: 9, fontFace: "Calibri", color: C.accentGold,
      align: "right", margin: 0,
    });

    // Description
    s4.addText(roles[i].desc, {
      x: x + 0.2, y: y + 1.0, w: 2.45, h: 0.6,
      fontSize: 11, fontFace: "Calibri", color: C.darkText,
      margin: 0, lineSpacingMultiple: 1.3,
    });
  }

  // ========== Slide 5: 五幕叙事结构 ==========
  const s5 = pres.addSlide();
  s5.background = { color: C.white };

  s5.addText("五幕叙事结构", {
    x: 0.5, y: 0.25, w: 9, h: 0.55,
    fontSize: 32, fontFace: "Georgia", color: C.cherry, bold: true,
    align: "left", valign: "middle", margin: 0,
  });

  s5.addText("借鉴经典戏剧结构，完整情感曲线 — 色彩随幕变化", {
    x: 0.5, y: 0.85, w: 9, h: 0.35,
    fontSize: 12, fontFace: "Calibri", color: C.gray,
    margin: 0,
  });

  const acts = [
    { name: "第一幕", title: "希望", color: "FF6B35", label: "暖橙", body: "与骗子日常对话\n建立信任，渐入陷阱", emo: "信任" },
    { name: "第二幕", title: "崩塌", color: "9AA0B5", label: "冷灰", body: "转账成功→好友消失\n财务打击→社交瓦解\n心理独白→真实案例", emo: "觉醒" },
    { name: "第三幕", title: "废墟", color: "DC143C", label: "暗红", body: "四个行动按钮\n报警 / 止损\n心理支持 / 告诉家人", emo: "自救" },
    { name: "第四幕", title: "回放", color: "666666", label: "中性白", body: "时间线回放\n心理学标注\n平行宇宙模拟", emo: "反思" },
    { name: "第五幕", title: "盾牌", color: "1E90FF", label: "科技蓝", body: "评分报告 + 类型分析\n防骗工具箱\n20个防诈关键词", emo: "防护" },
  ];

  for (let i = 0; i < acts.length; i++) {
    const x = 0.3 + i * 1.92;
    const colorHex = acts[i].color;

    // Act number circle
    s5.addShape(pres.shapes.OVAL, {
      x: x + 0.5, y: 1.4, w: 0.7, h: 0.7,
      fill: { color: colorHex },
    });
    s5.addText(acts[i].name, {
      x: x + 0.5, y: 1.4, w: 0.7, h: 0.7,
      fontSize: 11, fontFace: "Georgia", color: C.white, bold: true,
      align: "center", valign: "middle", margin: 0,
    });

    // Arrow connector (except last)
    if (i < acts.length - 1) {
      s5.addShape(pres.shapes.LINE, {
        x: x + 1.3, y: 1.75, w: 0.5, h: 0,
        line: { color: C.lightGray, width: 1.5, dashType: "dash" },
      });
    }

    // Title
    s5.addText(acts[i].title, {
      x: x + 0.1, y: 2.3, w: 1.7, h: 0.4,
      fontSize: 22, fontFace: "Georgia", color: colorHex, bold: true,
      align: "center", margin: 0,
    });

    // Label
    s5.addText(acts[i].label, {
      x: x + 0.1, y: 2.7, w: 1.7, h: 0.25,
      fontSize: 10, fontFace: "Calibri", color: C.gray, italic: true,
      align: "center", margin: 0,
    });

    // Body
    s5.addText(acts[i].body, {
      x: x + 0.1, y: 3.1, w: 1.7, h: 1.6,
      fontSize: 10, fontFace: "Calibri", color: C.darkText,
      align: "center", valign: "top", margin: 0,
      lineSpacingMultiple: 1.4,
    });

    // Emotion tag at bottom
    s5.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.35, y: 4.85, w: 1.2, h: 0.3,
      fill: { color: colorHex, transparency: 85 },
    });
    s5.addText(acts[i].emo, {
      x: x + 0.35, y: 4.85, w: 1.2, h: 0.3,
      fontSize: 9, fontFace: "Calibri", color: colorHex, bold: true,
      align: "center", valign: "middle", margin: 0,
    });
  }

  // ========== Slide 6: 核心玩法亮点 ==========
  const s6 = pres.addSlide();
  s6.background = { color: C.offWhite };
  s6.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.08, h: 5.625, fill: { color: C.cherry } });

  s6.addText("核心玩法机制", {
    x: 0.5, y: 0.25, w: 9, h: 0.55,
    fontSize: 32, fontFace: "Georgia", color: C.cherry, bold: true,
    align: "left", valign: "middle", margin: 0,
  });

  const checkIcon = await iconToBase64Png(FaCheckCircle, "#" + C.cherry, 48);

  const features = [
    { title: "多角色 AI 交互网络", desc: "张浩、老K、小雅、匿名X等角色动态切换，消息列表支持未读红点提示", icon: FaUserShield },
    { title: "分支对话 × 确定性结局", desc: "每条身份线 25-35 轮分支对话，2-8 个结局，基于 route + 信任值 + 证据数判定", icon: FaCode },
    { title: "骗子\"反卧底\"AI", desc: "检测敏感关键词 + 过度追问 + 过度配合，怀疑度达阈值触发暴露结局", icon: FaEye },
    { title: "多维数值系统", desc: "信任值(0-100) · 骗子怀疑度(0-100+) · 信息暴露度(0-4) · 证据数(0-5) · 救援进度(0-3)", icon: FaChartLine },
    { title: "平行宇宙复盘", desc: "时间线回放 + 心理学标注 + \"如果当时……\"输入框模拟替代走向", icon: FaGlobeAsia },
    { title: "个性化盾牌报告", desc: "综合评分 · 易受骗类型分析 · 星级评价 · 八大利器工具箱 · 20个防诈关键词", icon: FaShieldAlt },
  ];

  for (let i = 0; i < features.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 4.65;
    const y = 1.0 + row * 1.45;

    const featIcon = await iconToBase64Png(features[i].icon, "#" + C.cherry, 64);

    s6.addShape(pres.shapes.RECTANGLE, {
      x: x, y: y, w: 4.35, h: 1.25,
      fill: { color: C.white }, shadow: makeShadow(),
    });

    s6.addImage({ data: featIcon, x: x + 0.25, y: y + 0.2, w: 0.45, h: 0.45 });

    s6.addText(features[i].title, {
      x: x + 0.85, y: y + 0.12, w: 3.2, h: 0.35,
      fontSize: 15, fontFace: "Georgia", color: C.navy, bold: true,
      margin: 0,
    });

    s6.addText(features[i].desc, {
      x: x + 0.85, y: y + 0.5, w: 3.2, h: 0.6,
      fontSize: 11, fontFace: "Calibri", color: C.darkText,
      margin: 0, lineSpacingMultiple: 1.3,
    });
  }

  // ========== Slide 7: 七大亮点 ==========
  const s7 = pres.addSlide();
  s7.background = { color: C.navy };

  s7.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accentGold } });

  s7.addText("七大作品亮点", {
    x: 0.5, y: 0.3, w: 9, h: 0.55,
    fontSize: 32, fontFace: "Georgia", color: C.white, bold: true,
    align: "left", valign: "middle", margin: 0,
  });

  const highlights = [
    { num: "01", title: "教育范式创新", desc: "从\"说教\"到\"体验\"\n亲身经历形成情境记忆与免疫反应" },
    { num: "02", title: "五幕情感叙事", desc: "希望→崩塌→废墟→回放→盾牌\n色彩随幕变化，沉浸式学习" },
    { num: "03", title: "高重玩价值", desc: "6身份 × 30+结局\n身份解锁系统激励反复探索" },
    { num: "04", title: "智能反卧底AI", desc: "骗子具备反侦察能力\n检测措辞、提问模式、配合程度" },
    { num: "05", title: "心理学复盘", desc: "时间线回放 + 心理学术语标注\n知其然更知其所以然" },
    { num: "06", title: "零门槛使用", desc: "纯前端Web应用\n无需下载安装，即开即用" },
    { num: "07", title: "完善风险管控", desc: "15个风险点系统管控\n全程不索取真实个人信息" },
  ];

  for (let i = 0; i < highlights.length; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 0.35 + col * 2.4;
    const y = 1.1 + row * 2.05;

    // Number
    s7.addText(highlights[i].num, {
      x: x, y: y, w: 0.8, h: 0.45,
      fontSize: 28, fontFace: "Georgia", color: C.accentGold, bold: true,
      margin: 0,
    });

    s7.addText(highlights[i].title, {
      x: x, y: y + 0.4, w: 2.1, h: 0.3,
      fontSize: 14, fontFace: "Georgia", color: C.white, bold: true,
      margin: 0,
    });

    s7.addText(highlights[i].desc, {
      x: x, y: y + 0.75, w: 2.1, h: 0.9,
      fontSize: 10, fontFace: "Calibri", color: C.lightGray,
      margin: 0, lineSpacingMultiple: 1.4,
    });
  }

  // Last row — single wide item
  s7.addShape(pres.shapes.RECTANGLE, {
    x: 0.35, y: 3.9, w: 9.3, h: 0.04,
    fill: { color: C.accentGold, transparency: 50 },
  });

  // ========== Slide 8: 技术架构 ==========
  const s8 = pres.addSlide();
  s8.background = { color: C.offWhite };
  s8.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.08, h: 5.625, fill: { color: C.cherry } });

  s8.addText("技术架构", {
    x: 0.5, y: 0.25, w: 9, h: 0.55,
    fontSize: 32, fontFace: "Georgia", color: C.cherry, bold: true,
    align: "left", valign: "middle", margin: 0,
  });

  // Left column: tech stack
  const codeIcon = await iconToBase64Png(FaCode, "#" + C.cherry, 64);
  const lockIcon = await iconToBase64Png(FaLock, "#" + C.cherry, 64);
  const cloudIcon = await iconToBase64Png(FaGlobeAsia, "#" + C.cherry, 64);

  const techItems = [
    { icon: codeIcon, title: "纯前端技术栈", desc: "HTML5 + CSS3 + Vanilla JS (ES6+)\n无框架、无构建步骤\n数据层(47KB)与逻辑层(28KB)分离" },
    { icon: lockIcon, title: "数据安全设计", desc: "全程不索取真实个人信息\nlocalStorage 仅存身份解锁进度\n隐私优先的产品设计理念" },
    { icon: cloudIcon, title: "CloudBase 部署", desc: "腾讯云 CloudBase 静态托管\n后端预留混元大模型接入能力\n预设话术树兜底，无需后端即可运行" },
  ];

  for (let i = 0; i < techItems.length; i++) {
    const y = 1.1 + i * 1.45;
    s8.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: y, w: 5.3, h: 1.25,
      fill: { color: C.white }, shadow: makeShadow(),
    });
    s8.addImage({ data: techItems[i].icon, x: 0.75, y: y + 0.2, w: 0.45, h: 0.45 });
    s8.addText(techItems[i].title, {
      x: 1.4, y: y + 0.1, w: 4.1, h: 0.35,
      fontSize: 15, fontFace: "Georgia", color: C.navy, bold: true, margin: 0,
    });
    s8.addText(techItems[i].desc, {
      x: 1.4, y: y + 0.45, w: 4.1, h: 0.65,
      fontSize: 10, fontFace: "Calibri", color: C.darkText, margin: 0,
      lineSpacingMultiple: 1.3,
    });
  }

  // Right column: version timeline
  s8.addText("版本迭代", {
    x: 6.2, y: 1.1, w: 3.3, h: 0.4,
    fontSize: 18, fontFace: "Georgia", color: C.cherry, bold: true, margin: 0,
  });

  const versions = [
    { ver: "V5.0", desc: "角色选择 + 话术树 + 基础工具箱\n11条诈骗线路", active: false },
    { ver: "V7.0", desc: "任务驱动架构\n（旧版备份）", active: false },
    { ver: "V8.0", desc: "完整五幕结构\n25-35轮分支对话\n确定性结局判定\n身份解锁系统\n反卧底AI + 平行宇宙\n当前线上版本", active: true },
  ];

  for (let i = 0; i < versions.length; i++) {
    const cardH = versions[i].active ? 1.4 : 0.85;
    const descH = versions[i].active ? 0.95 : 0.4;
    const yOffsets = [1.65, 2.65, 3.55];
    const y = yOffsets[i];
    s8.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: y, w: 3.3, h: cardH,
      fill: { color: versions[i].active ? C.cherry : C.white },
      shadow: versions[i].active ? makeShadow() : undefined,
    });
    s8.addText(versions[i].ver, {
      x: 6.4, y: y + 0.08, w: 2.9, h: 0.28,
      fontSize: 14, fontFace: "Georgia", color: versions[i].active ? C.white : C.cherry, bold: true, margin: 0,
    });
    s8.addText(versions[i].desc, {
      x: 6.4, y: y + 0.35, w: 2.9, h: descH,
      fontSize: 9, fontFace: "Calibri", color: versions[i].active ? C.offWhite : C.darkText, margin: 0,
      lineSpacingMultiple: 1.2,
    });
  }

  // ========== Slide 9: 应用场景 ==========
  const s9 = pres.addSlide();
  s9.background = { color: C.white };

  s9.addText("应用场景", {
    x: 0.5, y: 0.25, w: 9, h: 0.55,
    fontSize: 32, fontFace: "Georgia", color: C.cherry, bold: true,
    align: "left", valign: "middle", margin: 0,
  });

  const scenarios = [
    { icon: FaGlobeAsia, title: "社区/校园\n反诈宣传教育", desc: "替代传统传单和讲座\n让学生在沉浸式体验中\n自然习得防骗能力" },
    { icon: FaUserShield, title: "企业员工\n安全意识培训", desc: "网络安全培训的\n创新辅助工具\n提升员工识别社会工程攻击能力" },
    { icon: FaShieldAlt, title: "公安/银行\n反诈宣传辅助", desc: "反诈中心、银行网点\n公众教育场景的\n互动体验工具" },
    { icon: FaBrain, title: "公众\n防骗意识提升", desc: "面向全民的\n防骗素养教育\n在游戏中建立免疫记忆" },
  ];

  for (let i = 0; i < scenarios.length; i++) {
    const x = 0.5 + i * 2.35;
    const iconData = await iconToBase64Png(scenarios[i].icon, "#" + C.cherry, 80);

    s9.addShape(pres.shapes.RECTANGLE, {
      x: x, y: 1.2, w: 2.1, h: 3.8,
      fill: { color: C.offWhite }, shadow: makeShadow(),
    });

    // Icon circle
    s9.addShape(pres.shapes.OVAL, {
      x: x + 0.55, y: 1.5, w: 1.0, h: 1.0,
      fill: { color: C.cherry },
    });
    s9.addImage({ data: iconData, x: x + 0.72, y: 1.67, w: 0.65, h: 0.65 });

    s9.addText(scenarios[i].title, {
      x: x + 0.15, y: 2.7, w: 1.8, h: 0.7,
      fontSize: 15, fontFace: "Georgia", color: C.navy, bold: true,
      align: "center", margin: 0, lineSpacingMultiple: 1.2,
    });

    s9.addText(scenarios[i].desc, {
      x: x + 0.15, y: 3.55, w: 1.8, h: 1.2,
      fontSize: 10, fontFace: "Calibri", color: C.darkText,
      align: "center", valign: "top", margin: 0, lineSpacingMultiple: 1.4,
    });
  }

  // ========== Slide 10: 结语 ==========
  const s10 = pres.addSlide();
  s10.background = { color: C.cherry };

  s10.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accentGold } });

  const shieldIcon2 = await iconToBase64Png(FaShieldAlt, "#FFFFFF", 200);

  s10.addImage({ data: shieldIcon2, x: 4.35, y: 0.6, w: 1.3, h: 1.3 });

  s10.addText("反诈人生", {
    x: 0.5, y: 2.1, w: 9, h: 0.8,
    fontSize: 48, fontFace: "Georgia", color: C.white, bold: true,
    align: "center", valign: "middle", margin: 0,
  });

  s10.addText("不只是玩游戏，而是在虚拟的骗局中，学会在现实中保护自己。", {
    x: 1, y: 3.0, w: 8, h: 0.6,
    fontSize: 16, fontFace: "Calibri", color: C.offWhite, italic: true,
    align: "center", valign: "middle", margin: 0,
  });

  // Bottom info bar
  s10.addShape(pres.shapes.RECTANGLE, { x: 0, y: 4.45, w: 10, h: 0.06, fill: { color: C.accentGold } });

  s10.addText([
    { text: "线上体验地址：", options: { bold: true } },
    { text: "ai-d9gd4xji5de241243-1453144747.tcloudbaseapp.com", options: { color: C.accentGold } },
  ], {
    x: 0.5, y: 4.75, w: 9, h: 0.35,
    fontSize: 11, fontFace: "Calibri", color: C.offWhite,
    align: "center", valign: "middle", margin: 0,
  });

  s10.addText("腾讯黑客松参赛项目  |  Thank You", {
    x: 0.5, y: 4.95, w: 9, h: 0.35,
    fontSize: 10, fontFace: "Calibri", color: C.lightGray,
    align: "center", valign: "middle", margin: 0,
  });

  // ========== Generate ==========
  const outPath = "/Users/yu/CodeBuddy/20260712205014/反诈人生/反诈人生-作品介绍.pptx";
  await pres.writeFile({ fileName: outPath });
  console.log("PPTX generated: " + outPath);
})();
