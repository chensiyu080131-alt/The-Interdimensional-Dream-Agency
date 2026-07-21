/* 异次元梦想局 · 音频引擎 V2.0
 * 悬疑电子 + 氛围叙事 + 情感波动
 * 参考：《隐形守护者》×《赛博朋克2077》×《Her》
 * 六幕独立编曲：旋律序列器 + 和弦进行 + 琶音 + 铺底 + 节奏层
 * 全部使用 Web Audio API 程序化生成，无需外部音频文件
 */

const Audio = (() => {
  let ctx = null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;
  let currentAct = null;
  let muted = false;
  let musicMuted = false;
  let sfxMuted = false;

  /* ========== BGM 序列器状态 ========== */
  let bgmClock = null;        // 主时钟 interval handle
  let bgmStep = 0;            // 当前步进计数
  let bgmNodes = [];          // 当前活跃的持续音节点
  let bgmVoices = [];         // 当前活跃的短音（旋律/琶音/节奏）
  let bgmChordIdx = 0;        // 当前和弦索引
  let bgmChordCounter = 0;    // 和弦内步数
  let bgmTempo = 120;         // BPM
  let bgmTickLen = 0.125;     // 每拍时长(秒) (16分音符)
  let bgmBPM = 120;

  /* ---------------- 初始化 ---------------- */
  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain(); masterGain.gain.value = 0.85; masterGain.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0.5; musicGain.connect(masterGain);
      sfxGain = ctx.createGain(); sfxGain.gain.value = 0.7; sfxGain.connect(masterGain);
    } catch(e) { console.warn("音频初始化失败:", e); }
  }

  function ensureCtx() {
    if (!ctx) init();
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  /* ========== 音效层 (V1 继承) ========== */

  function playClick() {
    const c = ensureCtx(); if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator(); o.type = "sine"; o.frequency.value = 800;
    const g = c.createGain(); g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.06);
    o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t+0.06);
  }

  function playSend() {
    const c = ensureCtx(); if (!c) return;
    const t = c.currentTime;
    const buf = c.createBuffer(1, c.sampleRate * 0.1, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0; i<d.length; i++) { d[i] = (Math.random()*2-1) * Math.pow(1 - i/d.length, 2) * 0.3; }
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 1000;
    const g = c.createGain(); g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.08);
    s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t); s.stop(t+0.08);
  }

  function playReceive() {
    const c = ensureCtx(); if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator(); o.type = "sine";
    const g = c.createGain();
    o.frequency.setValueAtTime(660, t);
    o.frequency.setValueAtTime(880, t+0.05);
    o.frequency.setValueAtTime(1100, t+0.1);
    g.gain.setValueAtTime(0.12, t);
    g.gain.setValueAtTime(0.12, t+0.1);
    g.gain.exponentialRampToValueAtTime(0.001, t+0.25);
    o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t+0.25);
  }

  function playType() {
    const c = ensureCtx(); if (!c) return;
    const t = c.currentTime;
    const buf = c.createBuffer(1, c.sampleRate * 0.03, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0; i<d.length; i++) { d[i] = (Math.random()*2-1) * Math.pow(1 - i/d.length, 4); }
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 2000; f.Q.value = 0.5;
    const g = c.createGain(); g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.03);
    s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t); s.stop(t+0.03);
  }

  function playCardFlip() {
    const c = ensureCtx(); if (!c) return;
    const t = c.currentTime;
    const buf = c.createBuffer(1, c.sampleRate * 0.2, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0; i<d.length; i++) { d[i] = (Math.random()*2-1) * Math.sin((i/d.length) * Math.PI) * 0.4; }
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = "lowpass";
    f.frequency.setValueAtTime(400, t); f.frequency.linearRampToValueAtTime(2000, t+0.15);
    const g = c.createGain(); g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.2);
    s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t); s.stop(t+0.2);
  }

  function playWarning() {
    const c = ensureCtx(); if (!c) return;
    const t = c.currentTime;
    [0, 0.12].forEach((delay, i) => {
      const o = c.createOscillator(); o.type = "square";
      o.frequency.setValueAtTime(i===0?880:660, t+delay);
      const g = c.createGain();
      g.gain.setValueAtTime(0.15, t+delay); g.gain.exponentialRampToValueAtTime(0.001, t+delay+0.1);
      o.connect(g); g.connect(sfxGain); o.start(t+delay); o.stop(t+delay+0.1);
    });
  }

  function playSting() {
    const c = ensureCtx(); if (!c) return;
    const t = c.currentTime;
    const o1 = c.createOscillator(); o1.type = "sine"; o1.frequency.setValueAtTime(80, t);
    o1.frequency.exponentialRampToValueAtTime(30, t+0.8);
    const g1 = c.createGain(); g1.gain.setValueAtTime(0.5, t); g1.gain.exponentialRampToValueAtTime(0.001, t+0.8);
    o1.connect(g1); g1.connect(sfxGain); o1.start(t); o1.stop(t+0.8);

    const o2 = c.createOscillator(); o2.type = "sawtooth"; o2.frequency.value = 1200;
    const g2 = c.createGain(); g2.gain.setValueAtTime(0.08, t); g2.gain.exponentialRampToValueAtTime(0.001, t+0.4);
    const f2 = c.createBiquadFilter(); f2.type = "highpass"; f2.frequency.value = 800;
    o2.connect(f2); f2.connect(g2); g2.connect(sfxGain); o2.start(t); o2.stop(t+0.4);

    const buf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0; i<d.length; i++) { d[i] = (Math.random()*2-1) * Math.pow(1-i/d.length, 3); }
    const s = c.createBufferSource(); s.buffer = buf;
    const g3 = c.createGain(); g3.gain.setValueAtTime(0.25, t); g3.gain.exponentialRampToValueAtTime(0.001, t+0.5);
    const f3 = c.createBiquadFilter(); f3.type = "bandpass"; f3.frequency.value = 3000; f3.Q.value = 2;
    s.connect(f3); f3.connect(g3); g3.connect(sfxGain); s.start(t); s.stop(t+0.5);
  }

  function playTaskComplete() {
    const c = ensureCtx(); if (!c) return;
    const t = c.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const o = c.createOscillator(); o.type = "sine"; o.frequency.value = freq;
      const g = c.createGain();
      g.gain.setValueAtTime(0, t+i*0.1); g.gain.linearRampToValueAtTime(0.13, t+i*0.1+0.02); g.gain.exponentialRampToValueAtTime(0.001, t+i*0.1+0.2);
      o.connect(g); g.connect(sfxGain); o.start(t+i*0.1); o.stop(t+i*0.1+0.2);
    });
  }

  function playIdentityReveal() {
    const c = ensureCtx(); if (!c) return;
    const t = c.currentTime;
    const o1 = c.createOscillator(); o1.type = "sine"; o1.frequency.value = 55;
    const g1 = c.createGain(); g1.gain.setValueAtTime(0.3, t); g1.gain.exponentialRampToValueAtTime(0.001, t+1.2);
    o1.connect(g1); g1.connect(sfxGain); o1.start(t); o1.stop(t+1.2);
    [262, 330, 392, 523].forEach((freq, i) => {
      const o = c.createOscillator(); o.type = "sine"; o.frequency.value = freq;
      const g = c.createGain();
      g.gain.setValueAtTime(0, t+i*0.15+0.2); g.gain.linearRampToValueAtTime(0.1, t+i*0.15+0.25); g.gain.exponentialRampToValueAtTime(0.001, t+i*0.15+0.7);
      o.connect(g); g.connect(sfxGain); o.start(t+i*0.15+0.2); o.stop(t+i*0.15+0.7);
    });
  }

  function playEndingGood() {
    const c = ensureCtx(); if (!c) return;
    const t = c.currentTime;
    [392, 494, 587, 784].forEach((freq, i) => {
      const o = c.createOscillator(); o.type = "sine"; o.frequency.value = freq;
      const g = c.createGain();
      g.gain.setValueAtTime(0, t+i*0.12); g.gain.linearRampToValueAtTime(0.14, t+i*0.12+0.03); g.gain.exponentialRampToValueAtTime(0.001, t+2);
      o.connect(g); g.connect(sfxGain); o.start(t+i*0.12); o.stop(t+2);
    });
  }

  function playEndingBad() {
    const c = ensureCtx(); if (!c) return;
    const t = c.currentTime;
    const o1 = c.createOscillator(); o1.type = "sine"; o1.frequency.value = 60;
    const g1 = c.createGain(); g1.gain.setValueAtTime(0.35, t); g1.gain.exponentialRampToValueAtTime(0.001, t+2);
    o1.connect(g1); g1.connect(sfxGain); o1.start(t); o1.stop(t+2);
    [330, 349, 370, 392].forEach((freq, i) => {
      const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = freq;
      const g = c.createGain();
      g.gain.setValueAtTime(0, t+i*0.1); g.gain.linearRampToValueAtTime(0.06, t+i*0.1+0.02); g.gain.exponentialRampToValueAtTime(0.001, t+2);
      const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 400;
      o.connect(f); f.connect(g); g.connect(sfxGain); o.start(t+i*0.1); o.stop(t+2);
    });
  }

  function playVibrate() {
    const c = ensureCtx(); if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator(); o.type = "sine"; o.frequency.value = 45;
    o.frequency.linearRampToValueAtTime(30, t+0.5);
    const g = c.createGain(); g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.5);
    o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t+0.5);
  }

  function playCollapseText() {
    const c = ensureCtx(); if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(80, t+1.5);
    const g = c.createGain(); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t+1.5);
    o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t+1.5);
  }

  function playPanelOpen() {
    const c = ensureCtx(); if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(300, t); o.frequency.linearRampToValueAtTime(600, t+0.15);
    const g = c.createGain(); g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.2);
    o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t+0.2);
  }

  function playOptionAppear() {
    const c = ensureCtx(); if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(440, t); o.frequency.setValueAtTime(520, t+0.03);
    const g = c.createGain(); g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.08);
    o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t+0.08);
  }

  /* ===================================================================
   *  BGM 引擎 V2.0 — 多层编曲系统
   *  ===================================================================
   *  每幕包含：
   *    1. 铺底长音 (2-3 层持续音，低速调制)
   *    2. 和弦进行 (每 2-4 小节切换)
   *    3. 琶音序列 (16分/8分音符动态织体)
   *    4. 旋律/主题 (标志性短句，有呼吸间隙)
   *    5. 节奏/打击 (软底鼓 + 噪声音色)
   *
   *  结构：
   *    - chorus: 和弦进行模式的循环 (16步)
   *    - phrase: 旋律短句 (8-16步) + 呼吸 (4-8步静默)
   *    - 步进时钟 = 16分音符 (BPM/4 Hz)
   */

  // ======== 工具函数 ========

  /** 创建一个带包络的短音节点（旋律用） */
  function scheduleNote(freq, startTime, duration, type, gain, filterFreq, pan) {
    const c = ctx;
    if (!c) return;
    const o = c.createOscillator(); o.type = type || "sine";
    o.frequency.value = freq;
    const g = c.createGain();
    const attack = Math.min(duration * 0.15, 0.05);
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(gain || 0.1, startTime + attack);
    g.gain.setValueAtTime(gain || 0.1, startTime + duration * 0.6);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    let target = g;
    if (filterFreq) {
      const f = c.createBiquadFilter(); f.type = "lowpass";
      f.frequency.value = filterFreq; f.Q.value = 0.7;
      o.connect(f); f.connect(g);
    } else {
      o.connect(g);
    }

    if (pan !== undefined) {
      const p = c.createStereoPanner(); p.pan.value = pan;
      target.connect(p); p.connect(musicGain); target = p;
    } else {
      g.connect(musicGain);
    }

    o.start(startTime); o.stop(startTime + duration + 0.01);
    return o;
  }

  /** 创建持续铺底音 */
  function createPadNote(freq, type, gainVal, filterFreq, detune, pan) {
    const c = ctx;
    const o = c.createOscillator(); o.type = type || "sine";
    o.frequency.value = freq;
    if (detune) o.detune.value = detune;
    const g = c.createGain(); g.gain.value = gainVal || 0.1;
    const f = c.createBiquadFilter(); f.type = "lowpass";
    f.frequency.value = filterFreq || 500; f.Q.value = 0.5;

    o.connect(f); f.connect(g);

    if (pan !== undefined) {
      const p = c.createStereoPanner(); p.pan.value = pan;
      g.connect(p); p.connect(musicGain);
    } else {
      g.connect(musicGain);
    }

    return { osc: o, gain: g, filter: f };
  }

  /** LFO 调制 */
  function addLFO(target, param, freq, depth, offset) {
    const c = ctx;
    const lfo = c.createOscillator(); lfo.type = "sine"; lfo.frequency.value = freq;
    const lfoG = c.createGain(); lfoG.gain.value = depth;
    lfo.connect(lfoG);
    if (offset) {
      const sum = c.createGain(); sum.gain.value = offset;
      lfoG.connect(sum);
      sum.connect(target[param]);
    } else {
      lfoG.connect(target[param]);
    }
    lfo.start();
    return lfo;
  }

  /** 生成白噪声缓冲区 */
  function noiseBuf(duration) {
    const c = ctx;
    const len = c.sampleRate * duration;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) { d[i] = Math.random() * 2 - 1; }
    return buf;
  }

  /** 播放噪声打击 */
  function scheduleNoiseHit(startTime, duration, gainVal, lowFreq, highFreq) {
    const c = ctx;
    if (!c) return;
    const s = c.createBufferSource();
    s.buffer = noiseBuf(duration);
    const f = c.createBiquadFilter(); f.type = "bandpass";
    f.frequency.value = (lowFreq + highFreq) / 2 || 3000;
    f.Q.value = 0.3;
    const g = c.createGain();
    g.gain.setValueAtTime(gainVal || 0.05, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    s.connect(f); f.connect(g); g.connect(musicGain);
    s.start(startTime); s.stop(startTime + duration);
  }

  /** 铺底调制：创建缓慢变化的滤波器/音量 sweep */
  function setupPadModulation(padNode, filterMin, filterMax, volMin, volMax, period) {
    const c = ctx;
    const now = c.currentTime;
    const p = period || 16; // 默认 16 秒周期

    function cycle() {
      const t = c.currentTime;
      if (filterMin && filterMax && padNode.filter) {
        padNode.filter.frequency.cancelScheduledValues(t);
        padNode.filter.frequency.setValueAtTime(padNode.filter.frequency.value || filterMin, t);
        padNode.filter.frequency.linearRampToValueAtTime(filterMax, t + p/2);
        padNode.filter.frequency.linearRampToValueAtTime(filterMin, t + p);
      }
      if (volMin !== undefined && volMax !== undefined && padNode.gain) {
        padNode.gain.gain.cancelScheduledValues(t);
        padNode.gain.gain.setValueAtTime(padNode.gain.gain.value || volMin, t);
        padNode.gain.gain.linearRampToValueAtTime(volMax, t + p/2);
        padNode.gain.gain.linearRampToValueAtTime(volMin, t + p);
      }
      setTimeout(cycle, p * 1000);
    }
    cycle();
  }

  // ======== 音乐理论数据 ========

  // 各幕的和弦进行 (音符为频率 Hz)
  const ACT_SCORES = {
    // 标题屏 — a小调神秘悬疑
    title: {
      bpm: 105,
      // 和弦进行：Am - F - G - Em   (4小节循环)
      chords: [
        { bass: 55,  notes: [110, 131, 165],   name: "Am" },  // A C E
        { bass: 43.65, notes: [87, 131, 175],   name: "F"  },  // F A C
        { bass: 49,  notes: [98, 123, 147],   name: "G"  },  // G B D
        { bass: 41.2, notes: [82, 98, 123],    name: "Em" },  // E G B
      ],
      chordBeats: 8,     // 每和弦持续 8 拍 (2小节)
      // 旋律短句 (休止: 步数索引, 音符: [相对根音偏移, 时长步数, 波形])
      melody: [
        null, null, null, null,       // 小节1：静默两拍
        {p: 0, d: 2, w:"triangle"},   // 根音
        {p: 7, d: 3, w:"sine"},       // 五度上
        null,
        null, null, null, null,       // 小节2：静默
        {p: 4, d: 3, w:"triangle"},   // 三度
        {p: 7, d: 2, w:"sine"},
        null, null,
        null, null,                    // 小节3
        {p: 0, d: 2, w:"triangle"},
        null,
        {p: 12, d: 4, w:"sine"},      // 高八度根音，长音
        null, null, null,
        null, null, null, null, null, null, null, null,  // 小节4：长静默
      ],
      // 琶音模式 (拍内细分，值 = 和弦内音符索引偏移, null = 静默)
      arpPattern: [0, 2, 1, 2, 0, 2, null, 2, 0, 1, 2, 1, 0, 2, 1, null],
      arpOctave: 1,  // 高一个八度
      arpGain: 0.04,
      // 打击层: 每拍 [类型, 力度, 声像]
      kickOn: [true, false, false, false, true, false, false, false],  // 1, 3拍软底鼓
      hatOn:  [false, true, false, true, false, false, false, true],  // 弱拍 hat
    },

    // 希望幕 — C大调微暖 (Am 关系大调感)
    hope: {
      bpm: 110,
      chords: [
        { bass: 65.4,  notes: [131, 165, 196],   name: "C"  },   // C E G
        { bass: 73.4,  notes: [147, 175, 220],   name: "Dm" },   // D F A
        { bass: 49,    notes: [98, 123, 147],     name: "G"  },   // G B D
        { bass: 55,    notes: [110, 131, 165],    name: "Am" },   // A C E
      ],
      chordBeats: 8,
      melody: [
        // 上升主题 — 希望 motif
        null, null,
        {p: 0, d: 2, w:"triangle"},
        {p: 4, d: 1.5, w:"sine"},
        {p: 7, d: 2.5, w:"sine"},
        null,
        {p: 12, d: 3, w:"triangle"},
        null, null,
        null, null,
        {p: 5, d: 2, w:"sine"},
        {p: 7, d: 1.5, w:"triangle"},
        null,
        {p: 9, d: 2, w:"sine"},
        {p: 12, d: 3, w:"triangle"},
        null, null, null,
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null,
        // 第二循环 — 变体
        {p: 0, d: 1, w:"sine"},
        {p: 2, d: 1, w:"sine"},
        {p: 4, d: 1, w:"sine"},
        {p: 7, d: 3, w:"triangle"},
        null, null,
        {p: 12, d: 4, w:"sine"},
        null, null, null, null, null, null, null, null,
      ],
      arpPattern: [0, 1, 2, 1, 0, null, 2, null, 0, 1, 2, null, 0, 1, 2, 1],
      arpOctave: 1,
      arpGain: 0.045,
      kickOn: [true, false, false, true, true, false, false, false],
      hatOn:  [false, true, false, true, false, true, false, true],
    },

    // 崩塌幕 — 不和谐/半音下降
    collapse: {
      bpm: 130,
      chords: [
        { bass: 55,    notes: [110, 131, 166],    name: "Am"   },  // 正常
        { bass: 51.9,  notes: [104, 123, 156],    name: "Abm"  },  // 降半音
        { bass: 49,    notes: [98, 117, 147],      name: "Gm"   },  // 再降
        { bass: 46.2,  notes: [92, 110, 139],      name: "F#m"  },  // 再降 — 崩塌
      ],
      chordBeats: 4,  // 更快切换，增加紧张感
      melody: [
        // 下行半音主题
        {p: 0, d: 1, w:"sawtooth"},
        {p: -1, d: 1, w:"sawtooth"},
        {p: -2, d: 1, w:"sawtooth"},
        {p: -3, d: 2, w:"triangle"},
        null,
        {p: -4, d: 1.5, w:"sawtooth"},
        {p: -5, d: 2.5, w:"sawtooth"},
        null,
        // 不和谐跳跃
        {p: 0, d: 0.5, w:"square"},
        {p: 6, d: 0.5, w:"square"},
        {p: -3, d: 0.5, w:"square"},
        null,
        {p: 0, d: 2, w:"sawtooth"},
        null, null, null,
        null, null, null, null, null, null, null, null,
      ],
      arpPattern: [0, 1, 0, 2, null, 1, 2, 1, 0, null, 2, 1, 0, 1, 2, null],
      arpOctave: 1,
      arpGain: 0.05,
      kickOn: [true, true, true, false, true, false, true, true],  // 密集底鼓
      hatOn:  [true, true, true, true, false, true, true, true],  // 密集 hi-hat
    },

    // 废墟幕 — d小调极简凄凉
    ruins: {
      bpm: 70,   // 极慢
      chords: [
        { bass: 36.7,  notes: [73, 87, 110],      name: "Dm"  },  // D F A
        { bass: 32.7,  notes: [65, 78, 98],        name: "Bb"  },  // Bb D F
        { bass: 36.7,  notes: [73, 87, 110],       name: "Dm"  },
        { bass: 41.2,  notes: [82, 98, 123],       name: "Am"  },  // A C E
      ],
      chordBeats: 12,  // 长和弦，空旷
      melody: [
        // 稀疏单音 — 回声感
        null, null, null, null, null, null, null, null,
        {p: 0, d: 4, w:"sine"},
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null,
        {p: 7, d: 4, w:"sine"},
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null,
        null, null,
        {p: 12, d: 6, w:"sine"},
        null, null, null, null, null, null,
      ],
      arpPattern: null,  // 无琶音
      arpOctave: 1,
      arpGain: 0,
      kickOn: [true, false, false, false, false, false, false, false],  // 极稀疏
      hatOn:  [],
    },

    // 回放幕 — G大调中性冷静
    replay: {
      bpm: 100,
      chords: [
        { bass: 49,    notes: [98, 123, 147],      name: "G"   },  // G B D
        { bass: 65.4,  notes: [131, 165, 196],     name: "C"   },  // C E G
        { bass: 41.2,  notes: [82, 98, 131],       name: "Em"  },  // E G B
        { bass: 43.65, notes: [87, 110, 131],      name: "Dm"  },  // D F A
      ],
      chordBeats: 8,
      melody: [
        // 分析感 — 中性重复 motif
        null, null,
        {p: 0, d: 1, w:"triangle"},
        {p: 0, d: 1, w:"triangle"},
        {p: 2, d: 2, w:"sine"},
        null,
        {p: 4, d: 3, w:"triangle"},
        null, null,
        null, null,
        {p: 7, d: 1, w:"triangle"},
        {p: 7, d: 1, w:"triangle"},
        null,
        {p: 5, d: 2, w:"sine"},
        {p: 4, d: 3, w:"triangle"},
        null, null, null,
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null,
        // 第二圈
        {p: 0, d: 2, w:"sine"},
        {p: 4, d: 2, w:"sine"},
        {p: 7, d: 2, w:"triangle"},
        {p: 9, d: 2, w:"sine"},
        {p: 12, d: 4, w:"triangle"},
        null, null, null, null,
      ],
      arpPattern: [0, null, 1, null, 2, null, 1, null, 0, null, 2, null, 1, null, 2, null],
      arpOctave: 1,
      arpGain: 0.035,
      kickOn: [true, false, false, true, true, false, true, false],
      hatOn:  [false, true, false, false, false, true, false, false],
    },

    // 盾牌幕 — C大调坚定温暖收束
    shield: {
      bpm: 108,
      chords: [
        { bass: 65.4,  notes: [131, 165, 196],     name: "C"   },  // C
        { bass: 49,    notes: [98, 123, 147],       name: "G"   },  // G
        { bass: 55,    notes: [110, 131, 165],      name: "Am"  },  // Am
        { bass: 43.65, notes: [87, 131, 175],       name: "F"   },  // F
      ],
      chordBeats: 8,
      melody: [
        // 上扬的解决主题
        null, null,
        {p: 0, d: 2, w:"triangle"},
        {p: 4, d: 2, w:"sine"},
        {p: 7, d: 2, w:"triangle"},
        {p: 12, d: 3, w:"sine"},
        null,
        {p: 16, d: 4, w:"triangle"},  // 再高
        null, null, null, null,
        null, null,
        {p: 9, d: 2, w:"sine"},
        {p: 7, d: 2, w:"triangle"},
        {p: 5, d: 2, w:"sine"},
        {p: 4, d: 3, w:"triangle"},
        null, null, null,
        // 最终上行解决
        null, null, null, null, null, null, null, null,
        {p: 0, d: 1, w:"sine"},
        {p: 4, d: 1, w:"sine"},
        {p: 7, d: 1, w:"sine"},
        {p: 12, d: 1, w:"triangle"},
        {p: 16, d: 4, w:"sine"},
        null, null, null, null,
      ],
      arpPattern: [0, 1, 2, 1, 0, 2, 1, 2, 0, 1, 2, 1, 0, 2, 1, 2],
      arpOctave: 1,
      arpGain: 0.05,
      kickOn: [true, false, false, false, true, false, false, true],
      hatOn:  [false, true, false, true, false, true, false, true],
    },
  };

  // ======== BGM 序列器核心 ========

  function getActScore(act) {
    return ACT_SCORES[act] || ACT_SCORES["hope"];
  }

  /** 获取当前和弦定义 */
  function getCurrentChord(score) {
    if (!score || !score.chords) return null;
    return score.chords[bgmChordIdx % score.chords.length];
  }

  /** 步进时一个和弦的拍数 */
  function getChordSteps(score) {
    // beats * 4 (因为每拍 4 个 16 分步)
    return (score.chordBeats || 8) * 4;
  }

  /** 旋律长度的总步数 */
  function getMelodyLen(score) {
    if (!score.melody) return 0;
    return score.melody.length;
  }

  /** 音名转频率 */
  function noteToFreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

  /** 以和弦根音为基础，按半音偏移获取频率 */
  function chordFreq(chord, semitoneOffset) {
    if (!chord) return 220;
    return chord.bass * Math.pow(2, semitoneOffset / 12);
  }

  // ======== 步进执行 ========

  function bgmTick() {
    if (!ctx || musicMuted) return;
    const score = getActScore(currentAct);
    if (!score) return;
    const chord = getCurrentChord(score);
    if (!chord) return;
    const now = ctx.currentTime;

    // --- 1. 和弦切换 ---
    bgmChordCounter++;
    if (bgmChordCounter >= getChordSteps(score)) {
      bgmChordCounter = 0;
      bgmChordIdx++;
    }

    // --- 2. 旋律层 ---
    if (chord && score.melody) {
      const mlen = getMelodyLen(score);
      const mstep = bgmStep % mlen;
      const note = score.melody[mstep];
      if (note && note.p !== undefined) {
        const freq = chordFreq(chord, note.p);
        const dur = bgmTickLen * note.d;
        scheduleNote(freq, now, dur, note.w || "sine", 0.08, 2000, note.pan || 0);
      }
    }

    // --- 3. 琶音层 ---
    if (chord && score.arpPattern && score.arpGain > 0) {
      const ap = score.arpPattern;
      const astep = bgmStep % ap.length;
      const aidx = ap[astep];
      if (aidx !== null && aidx !== undefined) {
        const chordNotes = chord.notes;
        const noteIdx = aidx % chordNotes.length;
        // 可跨八度
        const octMult = score.arpOctave || 1;
        const freq = chordNotes[noteIdx] * octMult;
        const dur = bgmTickLen * 0.85;
        scheduleNote(freq, now, dur, "sine", score.arpGain, 1500);
      }
    }

    // --- 4. 打击层 ---
    const beatInBar = (bgmStep % 8);  // 0-7 表示一小节 8 个八分音符位置
    const halfStepPos = bgmStep % 2;  // 0=正拍, 1=弱拍(16分)

    if (score.kickOn && score.kickOn[beatInBar] && halfStepPos === 0) {
      // 软底鼓：低频正弦 + 噪声
      const kickFreq = chord.bass * 0.5;  // sub-bass
      const o = ctx.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(kickFreq * 2, now);
      o.frequency.exponentialRampToValueAtTime(kickFreq * 0.8, now + 0.08);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.18, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      o.connect(g); g.connect(musicGain);
      o.start(now); o.stop(now + 0.25);
      // 噪声层增加冲击感
      scheduleNoiseHit(now, 0.08, 0.04, 200, 600);
    }

    if (score.hatOn && score.hatOn[beatInBar] && halfStepPos === 0) {
      scheduleNoiseHit(now, 0.04, 0.025, 6000, 10000);
    }

    // 有时加一个弱拍 hat (off-beat accent)
    if (score.hatOn && score.hatOn[beatInBar] && halfStepPos === 1 && Math.random() > 0.6) {
      scheduleNoiseHit(now, 0.02, 0.012, 8000, 12000);
    }

    bgmStep++;
  }

  // ======== BGM 控制 ========

  function stopBGM() {
    // 停止时钟
    if (bgmClock) { clearInterval(bgmClock); bgmClock = null; }

    // 停止所有铺底节点
    bgmNodes.forEach(n => {
      try { if (n.osc && n.osc.stop) n.osc.stop(); } catch(e) {}
      if (n.lfo) try { n.lfo.stop(); } catch(e) {}
      if (n.lfo2) try { n.lfo2.stop(); } catch(e) {}
    });
    bgmNodes = [];

    // 清理调制定时器
    clearAllModTimers();

    // 重置状态
    bgmStep = 0;
    bgmChordIdx = 0;
    bgmChordCounter = 0;
  }

  let _modTimers = [];
  function clearAllModTimers() {
    _modTimers.forEach(t => clearInterval(t));
    _modTimers = [];
  }

  function startBGM(act) {
    const c = ensureCtx();
    if (!c || musicMuted) return;
    stopBGM();
    currentAct = act;

    const score = getActScore(act);
    if (!score) return;

    bgmBPM = score.bpm || 120;
    bgmTickLen = 60 / bgmBPM / 4;  // 16分音符时长
    const intervalMs = bgmTickLen * 1000;
    bgmStep = 0;
    bgmChordIdx = 0;
    bgmChordCounter = 0;

    // --- 创建铺底层 (各幕独立编配) ---
    setupPadsForAct(act, score);

    // --- 启动时钟 ---
    bgmClock = setInterval(bgmTick, intervalMs);
  }

  function setupPadsForAct(act, score) {
    const c = ctx;
    const chord = score.chords[0];
    if (!chord) return;

    switch(act) {
      case "title": {
        // 标题屏：3层铺底 — 深沉根基 + 中频神秘 + 高频闪烁
        const p1 = createPadNote(55, "sine", 0.18, 350, 0, 0);
        const p2 = createPadNote(110, "triangle", 0.1, 500, 8, -0.4);
        const p3 = createPadNote(220, "sine", 0.05, 600, -8, 0.4);
        bgmNodes = [p1, p2, p3];

        // 低频 LFO 音量呼吸
        addLFO(p1, "gain", 0.08, 0.04, 0.18);
        // 中频滤波器 sweep
        setupPadModulation(p2, 350, 650, null, null, 14);
        // 高频若隐若现
        const lfo2 = addLFO(p3, "gain", 0.12, 0.025, 0.05);
        bgmNodes[2].lfo = lfo2;
        // 缓慢 detune 漂移
        setInterval(() => {
          try {
            p2.osc.detune.linearRampToValueAtTime(Math.random() * 12 - 6, c.currentTime + 4);
          } catch(e) {}
        }, 5000);
        break;
      }

      case "hope": {
        // 希望幕：暖色铺垫 + 心跳节奏 + 上升期待
        const p1 = createPadNote(65.4, "sine", 0.16, 450, 0, 0);
        const p2 = createPadNote(131, "triangle", 0.09, 600, 4, -0.3);
        const p3 = createPadNote(196, "sine", 0.05, 800, -4, 0.3);
        bgmNodes = [p1, p2, p3];

        addLFO(p1, "gain", 0.06, 0.03, 0.16);
        setupPadModulation(p2, 400, 700, null, null, 12);
        // 高频层周期闪烁
        const lfo = addLFO(p3, "gain", 0.15, 0.025, 0.05);
        bgmNodes[2].lfo = lfo;
        break;
      }

      case "collapse": {
        // 崩塌幕：低频隆隆 + 锯齿不和谐 + 噪音陪衬
        const p1 = createPadNote(40, "sine", 0.28, 250, 0, 0);
        const p2 = createPadNote(80, "sawtooth", 0.07, 350, 10, -0.5);
        const p3 = createPadNote(160, "triangle", 0.04, 450, -10, 0.5);
        bgmNodes = [p1, p2, p3];

        // 低频渐强渐弱 (心跳加速感)
        setupPadModulation(p1, null, null, 0.2, 0.32, 3);
        // 中频扭曲 sweep
        setupPadModulation(p2, 200, 500, null, null, 5);
        // 锯齿 detune 漂移
        setInterval(() => {
          try {
            p2.osc.detune.linearRampToValueAtTime(Math.random() * 20 - 10, c.currentTime + 2);
          } catch(e) {}
        }, 3000);
        // 额外噪音层
        function collapseNoise() {
          if (currentAct !== "collapse" || musicMuted) return;
          scheduleNoiseHit(c.currentTime, 0.5, 0.03, 300, 1500);
          setTimeout(collapseNoise, 2000 + Math.random() * 2000);
        }
        setTimeout(collapseNoise, 1000);
        break;
      }

      case "ruins": {
        // 废墟幕：极简双音 + 长回声 + 风噪
        const p1 = createPadNote(36.7, "sine", 0.14, 300, 0, 0);
        const p2 = createPadNote(73.4, "sine", 0.06, 400, 3, 0);
        bgmNodes = [p1, p2];

        // 极慢呼吸
        setupPadModulation(p1, null, null, 0.08, 0.18, 16);
        setupPadModulation(p2, null, null, 0.02, 0.07, 20);
        // 偶尔的风噪纹理
        function windNoise() {
          if (currentAct !== "ruins" || musicMuted) return;
          scheduleNoiseHit(c.currentTime, 1.5 + Math.random(), 0.02, 200, 800);
          setTimeout(windNoise, 4000 + Math.random() * 4000);
        }
        setTimeout(windNoise, 2000);
        break;
      }

      case "replay": {
        // 回放幕：中性冷静 — 三角波铺底 + 时钟感
        const p1 = createPadNote(98, "triangle", 0.12, 500, 0, 0);
        const p2 = createPadNote(196, "sine", 0.07, 700, 3, -0.3);
        const p3 = createPadNote(294, "sine", 0.04, 900, -3, 0.3);
        bgmNodes = [p1, p2, p3];

        // 稳定小幅度调制
        addLFO(p1, "gain", 0.09, 0.02, 0.12);
        setupPadModulation(p2, 500, 750, null, null, 10);
        break;
      }

      case "shield": {
        // 盾牌幕：厚实温暖 — 四层丰满和弦铺底
        const p1 = createPadNote(65.4, "sine", 0.18, 450, 0, 0);
        const p2 = createPadNote(131, "triangle", 0.1, 600, 5, -0.35);
        const p3 = createPadNote(196, "sine", 0.06, 800, -5, 0.35);
        const p4 = createPadNote(262, "sine", 0.04, 1000, 3, 0);
        bgmNodes = [p1, p2, p3, p4];

        addLFO(p1, "gain", 0.07, 0.03, 0.18);
        setupPadModulation(p2, 450, 700, null, null, 15);
        // 高频微小闪烁
        const lfo = addLFO(p4, "gain", 0.18, 0.015, 0.04);
        bgmNodes[3].lfo = lfo;
        break;
      }

      default:
        startBGM("hope");
        return;
    }

    // 启动所有持续音
    bgmNodes.forEach(n => {
      try { if (n.osc && n.osc.start) n.osc.start(); } catch(e) {}
      if (n.lfo) try { n.lfo.start(); } catch(e) {}
    });
  }

  // ======== 公共接口 ========

  function switchBGM(act) {
    init();
    // 渐变过渡
    if (bgmNodes.length > 0 && currentAct !== act) {
      const now = ctx.currentTime;
      musicGain.gain.setValueAtTime(musicGain.gain.value, now);
      musicGain.gain.linearRampToValueAtTime(0.05, now + 0.5);
      setTimeout(() => {
        startBGM(act);
        musicGain.gain.setValueAtTime(0.05, ctx.currentTime);
        musicGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1);
      }, 500);
    } else {
      startBGM(act);
    }
  }

  function toggleMute() {
    muted = !muted;
    if (masterGain) masterGain.gain.value = muted ? 0 : 0.85;
    return muted;
  }

  function toggleMusic() {
    musicMuted = !musicMuted;
    if (musicGain) musicGain.gain.value = musicMuted ? 0 : 0.5;
    if (musicMuted) stopBGM(); else if (currentAct) startBGM(currentAct);
    return musicMuted;
  }

  function toggleSfx() {
    sfxMuted = !sfxMuted;
    if (sfxGain) sfxGain.gain.value = sfxMuted ? 0 : 0.7;
    return sfxMuted;
  }

  // 暴露接口
  return {
    init, ensureCtx,
    switchBGM, stopBGM,
    toggleMute, toggleMusic, toggleSfx,
    sfx: {
      click: playClick,
      send: playSend,
      receive: playReceive,
      type: playType,
      cardFlip: playCardFlip,
      warning: playWarning,
      sting: playSting,
      taskComplete: playTaskComplete,
      identityReveal: playIdentityReveal,
      endingGood: playEndingGood,
      endingBad: playEndingBad,
      vibrate: playVibrate,
      collapseText: playCollapseText,
      panelOpen: playPanelOpen,
      optionAppear: playOptionAppear,
    }
  };
})();

/* ---------------- 全局快捷函数 ---------------- */
function audioBGM(act) { Audio.switchBGM(act); }
function audioSFX(name) { if (Audio.sfx[name]) Audio.sfx[name](); }
