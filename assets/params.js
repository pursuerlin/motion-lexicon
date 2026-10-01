/* ============================================================
   params.js —— 给「参数本身就是定义」的术语挂上卡片内控制条
   只改数据，不碰引擎：app.js 读到 demo.ctl 就渲染滑块，
   并把值写成舞台上的 CSS 自定义属性（--dur / --st / 各模式专用）。
   选词原则：这个术语的含义能用一个数字说清楚，才给控件；
   否则（状态转场、性能、运行时类）保持原样，别为了有控件而有控件。
   ============================================================ */
(function () {
  'use strict';
  const T = window.TERMS;
  const byId = {};
  T.forEach(function (t) { byId[t.id] = t; });

  const dur = function (min, max, v, step) {
    return { p: 'dur', l: '时长', min: min, max: max, step: step || 20, v: v, u: 'ms' };
  };
  const stag = function (max, v) {
    return { p: 'st', l: '错峰', min: 0, max: max, step: 5, v: v, u: 'ms' };
  };
  const num = function (p, l, min, max, v, step, u) {
    return { p: p, l: l, min: min, max: max, step: step == null ? 1 : step, v: v, u: u || '' };
  };

  function give(id, controls) {
    const t = byId[id];
    if (!t) { console.warn('params.js：找不到术语 ' + id); return; }
    t.demo = t.demo || {};
    t.demo.ctl = controls;
  }

  /* ---------- 01 缓动与曲线 ---------- */
  const TRACK = ['easing', 'linear', 'ease-in', 'ease-out', 'ease-in-out'];
  TRACK.forEach(function (id) { give(id, [dur(160, 2400, 900)]); });
  ['power', 'cubic-bezier', 'overshoot', 'bounce', 'elastic'].forEach(function (id) {
    give(id, [dur(400, 4000, 1400, 50)]);
  });
  give('spring', [num('k', '刚度 k', 40, 420, 170), num('c', '阻尼 c', 2, 60, 22), num('m', '质量 m', 0.2, 6, 1, 0.1)]);
  give('stiffness', [num('k', '刚度 k', 40, 420, 260), num('c', '阻尼 c', 2, 60, 20)]);
  give('damping', [num('c', '阻尼 c', 1, 60, 8), num('k', '刚度 k', 40, 420, 180)]);
  give('mass', [num('m', '质量 m', 0.2, 8, 4, 0.1), num('k', '刚度 k', 40, 420, 200)]);
  give('stepped', [dur(400, 3200, 1200, 50)]);

  /* ---------- 02 时长与时序 ---------- */
  give('duration', [dur(120, 2000, 520)]);
  give('delay', [stag(500, 240), dur(120, 1200, 420)]);
  give('stagger', [stag(260, 70), dur(120, 1200, 460)]);
  give('orchestration', [stag(260, 110), dur(200, 1600, 700)]);
  give('timing-scale', [stag(260, 90)]);
  give('iteration', [dur(160, 1600, 520)]);
  give('playback-rate', [dur(400, 3200, 1600, 50)]);
  give('fill-mode', [dur(120, 1600, 420)]);

  /* ---------- 03 入场 ---------- */
  ['fade-in', 'slide-in', 'scale-in', 'pop-in', 'drop-in'].forEach(function (id) {
    give(id, [dur(120, 1600, byId[id].demo.d ? parseFloat(byId[id].demo.d) : 460)]);
  });
  give('bounce-in', [dur(300, 2400, 900, 50)]);
  give('rise-in', [stag(240, 80), dur(120, 1400, 480)]);
  ['clip-reveal', 'blur-in', 'flip-in', 'stack-in', 'glitch-in'].forEach(function (id) {
    give(id, [dur(160, 2000, parseFloat(byId[id].demo.d) || 700)]);
  });
  give('mask-reveal', [dur(400, 4000, 1500, 50)]);
  give('wipe-in', [dur(300, 3000, 1100, 50)]);

  /* ---------- 04 出场 ---------- */
  give('fade-out', [dur(80, 1200, 420)]);
  give('slide-out', [dur(80, 1200, 320)]);
  give('scale-out', [dur(80, 1200, 360)]);
  give('staggered-exit', [stag(240, 60), dur(80, 1200, 380)]);
  give('dissolve', [dur(400, 4000, 1400, 50)]);
  give('unmount', [dur(80, 1200, 420)]);

  /* ---------- 05 变换与三维 ---------- */
  give('translate', [dur(200, 2400, 800)]);
  give('scale', [dur(200, 2400, 900)]);
  give('rotate', [dur(400, 4000, 1600, 50)]);
  give('skew', [dur(300, 3000, 1100, 50)]);
  give('rotate3d', [dur(400, 4000, 1600, 50)]);
  give('depth-layers', [dur(300, 3000, 1400, 50)]);

  /* ---------- 07 滚动动效 ---------- */
  give('ken-burns', [dur(1500, 14000, 6000, 100)]);

  /* ---------- 08 交互反馈 ---------- */
  give('hover-lift', [dur(60, 700, 220, 10)]);
  give('hover-zoom', [dur(80, 900, 420, 10)]);
  give('underline-expand', [dur(60, 700, 280, 10)]);
  give('press-feedback', [dur(40, 500, 90, 10)]);
  give('focus-ring', [dur(40, 500, 180, 10)]);
  give('shake', [dur(120, 1400, 520)]);
  give('nudge', [dur(160, 1600, 620)]);
  give('pulse', [dur(500, 5000, 1800, 50)]);
  give('skeleton', [dur(500, 4000, 1600, 50)]);
  give('progress-bar', [dur(400, 4000, 1600, 50)]);
  give('toast-in', [dur(600, 5000, 2400, 50)]);

  /* ---------- 09 循环与环境动效 ---------- */
  give('loop', [dur(600, 6000, 2400, 50)]);
  give('marquee', [dur(1200, 16000, 6000, 100)]);
  give('orbit', [dur(1000, 12000, 4200, 100)]);
  give('float', [dur(800, 8000, 2600, 50)]);
  give('idle-breathing', [dur(800, 8000, 2800, 50)]);
  give('spinner', [dur(300, 3000, 900)]);

  /* ---------- 12 镜头与叙事 ---------- */
  give('dolly', [dur(600, 6000, 2200, 50)]);
  give('pan', [dur(600, 6000, 2600, 50)]);
  give('rack-focus', [dur(400, 4000, 1400, 50)]);
  give('camera-shake', [dur(120, 1400, 520)]);
  give('zoom-through', [dur(400, 4000, 1600, 50)]);

  /* ---------- 13 动画原则 ---------- */
  ['squash-stretch', 'anticipation', 'follow-through', 'secondary-action', 'slow-in-out', 'arc', 'exaggeration', 'staging']
    .forEach(function (id) {
      if (!byId[id] || !byId[id].demo || !byId[id].demo.frames) return;
      give(id, [dur(200, 4000, parseFloat(byId[id].demo.d) || 1000, 50)]);
    });

  /* ---------- 10 文字动效 / 11 润色与特效 ---------- */
  give('cursor-caret', [dur(120, 1400, 500)]);
  ['blur', 'clip-path', 'mask', 'glow', 'grain', 'elevation', 'light-sweep', 'chromatic', 'glass', 'depth-field', 'bokeh']
    .forEach(function (id) {
      if (!byId[id] || !byId[id].demo || !byId[id].demo.frames) return;
      give(id, [dur(200, 6000, parseFloat(byId[id].demo.d) || 1200, 50)]);
    });

  /* ---------- 08 性能与工程：把"贵在哪"变成可拧的旋钮 ---------- */
  give('frame-rate', [num('hz', '目标', 30, 144, 60, 1, 'Hz')]);
  give('jank', [num('ms', '阻塞', 0, 40, 6, 1, 'ms')]);
  give('layout-thrashing', [num('n', '节点', 50, 500, 200, 10)]);

  /* ---------- 15 三维与运行时 ---------- */
  give('fov', [num('fov', '视距', 160, 1600, 500, 20, 'px')]);
  give('particle-system', [num('rate', '发射率', 6, 90, 34, 2), num('g', '重力', -80, 400, 120, 10)]);
  give('instancing', [num('n', '实例数', 100, 3000, 900, 50)]);
  give('delta-time', [num('hz', '模拟帧率', 15, 240, 60, 5, 'Hz')]);
  give('sprite-sheet', [num('fps', '帧率', 2, 24, 8, 1)]);
  give('lottie', [num('sp', '播放倍速', 0.1, 2, 0.5, 0.1)]);

  /* ---------- 16 组合范式：参数即手感 ---------- */
  give('gaze-tracking', [num('sm', '跟随', 0.02, 0.6, 0.16, 0.01), num('rr', '幅度', 3, 14, 7.5, 0.5, 'px')]);
  give('cursor-trail', [num('dc', '衰减', 0.05, 0.7, 0.28, 0.01), num('sz', '大小', 6, 20, 13, 1, 'px')]);
  give('spotlight-reveal', [num('r', '光圈', 40, 320, 150, 5, 'px')]);
  give('scene-parallax', [num('fx', '位移', 3, 22, 9, 1), num('rot', '偏转', 0, 14, 5, 1, 'deg')]);
  give('luminous-flow', [num('g', '雾增益', 2, 24, 9, 1), num('bz', '推镜', 0, 16, 6, 1, '%')]);
  give('helix-flow', [num('rr', '半径', 18, 96, 58, 2, 'px'), num('sp', '自转', 0, 20, 6, 1)]);
  give('vortex-transit', [num('sp', '圈速', 0.4, 4, 1.7, 0.1), num('rs', '尺寸', 40, 110, 76, 2, 'px')]);
  give('door-bloom', [num('stg', '错峰', 0, 160, 45, 5, 'ms'), num('op', '开度', 20, 88, 64, 2, 'deg')]);
  give('card-peel', [num('sz', '角', 14, 60, 34, 2, 'px')]);
  give('hover-fan', [num('spread', '展开', 6, 40, 23, 1, 'px'), num('rot', '角度', 0, 26, 12, 1, 'deg')]);
  give('scrub-frames', [num('nf', '帧数', 6, 48, 24, 1)]);
  give('scroll-orbit', [num('tn', '圈数', 0.5, 4, 1, 0.1)]);
  give('pinned-hero', [num('es', '收缩', 0.4, 0.98, 0.74, 0.01)]);
  give('section-stack', [num('step', '层距', 4, 34, 14, 1, 'px')]);
  give('fab-to-sheet', [num('w', '展开宽', 110, 230, 178, 5, 'px'), num('h', '展开高', 60, 140, 106, 5, 'px')]);
  give('button-tri-state', [num('ld', '处理时长', 300, 3000, 1250, 50, 'ms')]);
  give('horizontal-scroll', [num('sk', '位移', 0, 160, 100, 5, '%')]);
  give('immersive-float', [num('sp', '生长时长', 200, 1600, 620, 20, 'ms')]);

  /* ---------- 16 组合范式（第二批） ---------- */
  give('line-mask-reveal', [num('gp', '行间隔', 4, 26, 13, 1, '%')]);
  give('velocity-skew', [num('sk', '倾斜', 8, 90, 34, 2)]);
  give('proximity-glow', [num('r', '半径', 16, 80, 42, 2, '%'), num('sm', '跟随', 4, 40, 12, 1)]);
  give('liquid-follow', [num('sm', '弹性', 4, 30, 14, 1), num('st', '拉伸', 6, 40, 18, 1)]);
  give('chart-build', [num('mx', '峰值', 40, 400, 128, 8)]);
  give('preview-follow', [num('sm', '跟随', 6, 34, 16, 1)]);
  give('throw-dismiss', [num('rot', '旋转', 2, 16, 7, 1)]);
  give('scramble-decode', [num('sp', '收敛', 0.8, 6, 2.2, 0.1)]);
  give('opposite-rails', [num('spb', '次排速度', 0.2, 1.6, 0.62, 0.02), num('spa', '主排速度', 0.4, 2, 1, 0.05)]);
  give('depth-tunnel', [num('lp', '行程', 0.4, 2.4, 1, 0.05)]);
  give('magnetic-button', [num('r', '力场半径', 40, 160, 88, 2)]);
})();
