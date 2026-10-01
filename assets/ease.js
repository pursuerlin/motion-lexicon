/* 缓动函数库 + 贝塞尔求解 + 弹簧模拟 —— 供曲线绘制、轨道演示与缓动实验室共用 */
(function () {
  const c1 = 1.70158, c3 = c1 + 1, c4 = (2 * Math.PI) / 3;

  const EASE = {
    linear: t => t,
    easeIn: t => t * t * t,
    easeOut: t => 1 - Math.pow(1 - t, 3),
    easeInOut: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    easeInSine: t => 1 - Math.cos((t * Math.PI) / 2),
    easeOutSine: t => Math.sin((t * Math.PI) / 2),
    easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
    easeOutQuad: t => 1 - (1 - t) * (1 - t),
    easeOutQuart: t => 1 - Math.pow(1 - t, 4),
    easeOutQuint: t => 1 - Math.pow(1 - t, 5),
    easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
    easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutExpo: t => t === 0 ? 0 : t === 1 ? 1 : t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2,
    easeOutCirc: t => Math.sqrt(1 - Math.pow(t - 1, 2)),
    easeOutBack: t => 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2),
    easeInBack: t => c3 * t * t * t - c1 * t * t,
    easeInOutBack: t => t < 0.5
      ? (Math.pow(2 * t, 2) * ((c1 + 1) * 2 * t - c1)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c1 + 1) * (t * 2 - 2) + c1) + 2) / 2,
    easeOutElastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1,
    easeInElastic: t => t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4),
    easeOutBounce: t => {
      const n1 = 7.5625, d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
    easeInBounce: t => 1 - EASE.easeOutBounce(1 - t),
    steps: (n) => (t => Math.min(1, Math.floor(t * n) / (n - 1) > 1 ? 1 : Math.floor(t * n) / n)),
    smoothstep: t => t * t * (3 - 2 * t)
  };

  /* 三次贝塞尔求解：给定控制点与进度 x，返回 y */
  function bezierFn(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const fx = t => ((ax * t + bx) * t + cx) * t;
    const dfx = t => (3 * ax * t + 2 * bx) * t + cx;
    const fy = t => ((ay * t + by) * t + cy) * t;
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const err = fx(t) - x;
        if (Math.abs(err) < 1e-5) break;
        const d = dfx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= err / d;
      }
      t = Math.min(1, Math.max(0, t));
      return fy(t);
    };
  }
  EASE.customBezier = bezierFn(0.16, 1, 0.3, 1);
  EASE.emphasized = bezierFn(0.2, 0, 0, 1);
  EASE.material = bezierFn(0.4, 0, 0.2, 1);
  EASE.snappy = bezierFn(0.85, 0, 0.15, 1);
  EASE.bezier = bezierFn;

  /* 显式积分求解弹簧：返回 {values, duration}（归一化时间轴上的位移序列） */
  function springSeries(stiffness, damping, mass, steps) {
    steps = steps || 220;
    const dt = 0.006;
    let x = 1, v = 0, t = 0;
    const pts = [[0, 1]];
    let maxT = 0;
    for (let i = 0; i < 40000; i++) {
      const a = (-stiffness * x - damping * v) / mass;
      v += a * dt;
      x += v * dt;
      t += dt;
      maxT = t;
      pts.push([t, x]);
      if (Math.abs(x) < 0.0012 && Math.abs(v) < 0.0012) break;
    }
    const dur = maxT;
    const out = new Array(steps + 1);
    for (let i = 0; i <= steps; i++) {
      const tt = (i / steps) * dur;
      let lo = 0, hi = pts.length - 1;
      while (lo < hi - 1) { const mid = (lo + hi) >> 1; if (pts[mid][0] <= tt) lo = mid; else hi = mid; }
      const [t0, x0] = pts[lo], [t1, x1] = pts[Math.min(hi, pts.length - 1)];
      const k = t1 === t0 ? 0 : (tt - t0) / (t1 - t0);
      out[i] = 1 - (x0 + (x1 - x0) * k);
    }
    return { values: out, duration: dur * 1000 };
  }

  /* 实验室与卡片共用的一份缓动清单 */
  const LIST = [
    { key: 'linear', label: 'linear', css: 'linear', fn: EASE.linear, note: '匀速。只适合无始无终的持续运动。' },
    { key: 'easeIn', label: 'ease-in', css: 'cubic-bezier(0.32, 0, 0.67, 0)', fn: EASE.easeIn, note: '加速离场，物体“被甩走”。' },
    { key: 'easeOut', label: 'ease-out', css: 'cubic-bezier(0.33, 1, 0.68, 1)', fn: EASE.easeOut, note: '默认首选：带速度进场，平稳停住。' },
    { key: 'easeInOut', label: 'ease-in-out', css: 'cubic-bezier(0.65, 0, 0.35, 1)', fn: EASE.easeInOut, note: '长距离位移、来回切换。' },
    { key: 'easeOutExpo', label: 'expo-out', css: 'cubic-bezier(0.16, 1, 0.3, 1)', fn: EASE.easeOutExpo, note: '戏剧化减速，前 20% 走完 80%。' },
    { key: 'easeOutBack', label: 'back-out', css: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fn: EASE.easeOutBack, note: '末端过冲一次，做 pop / 弹入。' },
    { key: 'easeInBack', label: 'back-in', css: 'cubic-bezier(0.36, 0, 0.66, -0.56)', fn: EASE.easeInBack, note: '起手反向预备（anticipation）。' },
    { key: 'easeOutElastic', label: 'elastic-out', css: '—（CSS 无法表达）', fn: EASE.easeOutElastic, note: '橡皮筋震荡，需要 JS 驱动。' },
    { key: 'easeOutBounce', label: 'bounce-out', css: '—（CSS 无法表达）', fn: EASE.easeOutBounce, note: '落地衰减弹跳，需要 JS 驱动。' },
    { key: 'easeOutCirc', label: 'circ-out', css: 'cubic-bezier(0, 0.55, 0.45, 1)', fn: EASE.easeOutCirc, note: '末端极缓，常用于大面积转场。' },
    { key: 'emphasized', label: 'emphasized (M3)', css: 'cubic-bezier(0.2, 0, 0, 1)', fn: EASE.emphasized, note: 'Material 3 的强调曲线。' },
    { key: 'material', label: 'standard (M3)', css: 'cubic-bezier(0.4, 0, 0.2, 1)', fn: EASE.material, note: 'Material 标准曲线。' },
    { key: 'snappy', label: 'snappy', css: 'cubic-bezier(0.85, 0, 0.15, 1)', fn: EASE.snappy, note: '两端猛、中间极快，适合切页。' },
    { key: 'steps6', label: 'steps(6)', css: 'steps(6)', fn: EASE.steps(6), note: '离散台阶，逐帧/像素风。' }
  ];

  window.EASE = EASE;
  window.EASE_LIST = LIST;
  window.springSeries = springSeries;
})();
