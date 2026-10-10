/* ============================================================
   hud.js —— 详情页遥测栏：把"演一遍"变成"演一遍并读出为什么"
   唯一原则：屏上每个数字都量自浏览器自己的渲染（把动画的 currentTime
   推到某一刻，再读回 computed transform），这里不重述任何一条运动。
   只管"读"不管"播"：重播、慢放、循环归舞台那条控制条。这里再造一个慢放
   会和它打架——它改 animation-duration，若这里改 playbackRate 会叠乘。
   一个舞台里可以有多条时钟（two 类型的进场/退场），一条曲线一条时钟；
   共享同一份关键帧签名的元素算同一条（stagger 五块板不该画五条线）。
   ============================================================ */
(function () {
  'use strict';
  var ACCENT = {
    easing: '#6750A4', time: '#0B6E4F', entrance: '#1D6FD1', exit: '#8A5A00',
    transform: '#574E60', state: '#B3261E', scroll: '#00696E', feedback: '#7D5260',
    loop: '#3F5B95', text: '#4A5C2A', polish: '#9C3D7A', camera: '#2F5D8C',
    principles: '#6B4E9E', perf: '#8A6D00', runtime: '#0F5E8C', compound: '#A03A28'
  };
  var SCAN = 48;   /* 每条时钟扫多少个点：既是量程的来源，也是画线的分辨率 */

  /* ── 强调色要能在五套底色上都读得出来 ─────────────────────
     ACCENT 是分类色，写死的那版在暗底上最低只有 2.35:1（连 34px 的主读数都不过 AA）。
     这里按面板自己的底色把它向白/黑提亮到 4.5:1，配色身份不变。 */
  function toRGB(c) {
    var m;
    if ((m = /^#([0-9a-f]{3})$/i.exec(c))) return m[1].split('').map(function (x) { return parseInt(x + x, 16); });
    if ((m = /^#([0-9a-f]{6})$/i.exec(c))) return m[1].match(/../g).map(function (x) { return parseInt(x, 16); });
    if ((m = /rgba?\(([^)]+)\)/.exec(c))) return m[1].split(/[\s,\/]+/).slice(0, 3).map(Number);
    return null;
  }
  function lum(rgb) {
    var v = rgb.map(function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function readable(hex, el) {
    var fg = toRGB(hex), bg = toRGB(el ? getComputedStyle(el).getPropertyValue('--bg-2') : '');
    if (!fg || !bg) return hex || 'var(--accent)';
    if (contrast(fg, bg) >= 4.5) return hex;
    var to = lum(bg) < 0.4 ? [255, 255, 255] : [0, 0, 0];
    for (var k = 1; k <= 20; k++) {
      var f = k / 20, mix = fg.map(function (v, i) { return Math.round(v + (to[i] - v) * f); });
      if (contrast(mix, bg) >= 4.5) return 'rgb(' + mix.join(',') + ')';
    }
    return lum(bg) < 0.4 ? '#fff' : '#000';
  }
  /* 隐私模式会阻断 localStorage，抛异常会让整个 HUD IIFE 当场挂掉 */
  var on = true;
  try { on = localStorage.getItem('hud') !== '0'; } catch (e) {}

  function m0(t) { return (!t || t === 'none') ? 'matrix(1,0,0,1,0,0)' : t; }
  function px(v) { return (v > 0.5 ? '+' : '') + v.toFixed(0) + 'px'; }
  function deg(v) { return (v > 0.5 ? '+' : '') + v.toFixed(0) + '°'; }

  /* 一帧的全部可量面。旋转取矩阵极角、遮罩取实际露出的面积占比、扫光取
     background-position、模糊同时看 filter 与 backdrop-filter，全部读自 computed style。 */
  function num(v, dim) { return v.slice(-1) === '%' ? parseFloat(v) / 100 : parseFloat(v) / (dim || 1); }
  /* clip-path 遮罩到底露出了多少：inset 直接算矩形，polygon 用鞋带公式，circle 算圆 */
  function revealed(cp, el) {
    var r = el.getBoundingClientRect(), W = r.width, H = r.height, m;
    if (!W || !H) return NaN;
    if ((m = cp.match(/^inset\(([^)]+)\)/))) {
      /* inset 的四个值是 上 右 下 左，缺的按 border-radius 规则补对面 */
      var raw = m[1].match(/[-\d.]+%?/g) || [];
      if (!raw.length) return NaN;
      var v = raw.map(function (x) { return x.slice(-1) === '%' ? parseFloat(x) / 100 : parseFloat(x) / H; });
      var top = v[0], bot = v[0], rt = v.length > 1 ? v[1] : v[0], lf = rt;
      if (v.length === 3) { bot = v[2]; }
      else if (v.length >= 4) { bot = v[2]; lf = v[3]; }
      var wMax = Math.max(0, 1 - lf - rt), hMax = Math.max(0, 1 - top - bot);
      return Math.max(0, Math.min(1, wMax * hMax));
    }
    if ((m = cp.match(/^polygon\(([^)]+)\)/))) {
      var pts = [];
      m[1].split(',').forEach(function (pair) {
        var v = pair.match(/[-\d.]+(%|px|em|rem)?/g);
        if (!v || v.length < 2) return;
        pts.push([num(v[0], W), num(v[1], H)]);
      });
      if (pts.length < 3) return NaN;
      var ar = 0;
      for (var i = 0; i < pts.length; i++) {
        var u = pts[i], w = pts[(i + 1) % pts.length];
        ar += u[0] * w[1] - w[0] * u[1];
      }
      return Math.max(0, Math.min(1, Math.abs(ar) / 2));
    }
    if ((m = cp.match(/^circle\(\s*([-.\d]+)(%|px)?/))) {
      var rad = m[2] === '%' ? parseFloat(m[1]) / 100 : parseFloat(m[1]) / Math.sqrt(W * H);
      return Math.max(0, Math.min(1, Math.PI * rad * rad));
    }
    return NaN;
  }
  /* 位置/尺寸这类值是「X Y」两段，动的常常是其中带 % 的那一段（纵向遮罩就是第二项） */
  function firstPct(v) {
    var toks = (v || '').split(',')[0].trim().split(/\s+/);
    for (var i = 0; i < toks.length; i++) if (toks[i].lastIndexOf('%') > 0) return parseFloat(toks[i]);
    return NaN;
  }
  function probe(el, ps) {
    var cs = getComputedStyle(el, ps || null), m = new DOMMatrixReadOnly(m0(cs.transform)), o = parseFloat(cs.opacity);
    var st = {
      sc: Math.sqrt(m.a * m.a + m.b * m.b),
      tx: m.e, ty: m.f,
      rot: Math.atan2(m.b, m.a) * 180 / Math.PI,
      tilt: Math.hypot(Math.atan2(-m.m23, m.m22) * 180 / Math.PI,
        Math.asin(Math.max(-1, Math.min(1, m.m13 || 0))) * 180 / Math.PI),
      clip: NaN, blur: 0, bgp: NaN, mask: NaN, bsz: NaN, glow: NaN, ab: NaN, ring: NaN, sz: NaN,
      op: isNaN(o) ? 1 : o
    };
    /* 推镜 / 3D 穿梭：矩阵的 a、e 全都不变，变的只有透视合成之后的渲染尺寸，
       所以量「实际画出来多宽 ÷ 布局多宽」 */
    if (!ps && el.offsetWidth) st.sz = el.getBoundingClientRect().width / el.offsetWidth;
    var cp = cs.clipPath && cs.clipPath !== 'none' ? cs.clipPath : (cs.webkitClipPath && cs.webkitClipPath !== 'none' ? cs.webkitClipPath : '');
    if (cp) st.clip = revealed(cp, el);
    var fx = (cs.filter && cs.filter !== 'none' ? cs.filter : '') + ' ' +
      (cs.backdropFilter && cs.backdropFilter !== 'none' ? cs.backdropFilter : '');
    var b = fx.match(/blur\(([-\d.]+)px\)/);
    if (b) st.blur = parseFloat(b[1]);
    /* 扫光类（骨架屏 / shimmer / 流动渐变）动的就是 background-position，
       多个背景时取第一个 */
    var bp = firstPct(cs.backgroundPositionX);
    if (!isNaN(bp)) st.bgp = bp;
    var mk = firstPct(cs.webkitMaskPosition || cs.maskPosition);
    if (!isNaN(mk)) st.mask = mk;
    var bz = firstPct(cs.backgroundSize);
    if (!isNaN(bz)) st.bsz = bz;
    /* 发光看 box-shadow 的模糊半径、色差看 text-shadow 的横向偏移：
       glow / chromatic 这两条术语讲的就是这两个数 */
    var sh = (cs.boxShadow || '').match(/[-\d.]+px\s+[-\d.]+px\s+([-\d.]+)px/);
    if (sh) st.glow = parseFloat(sh[1]);
    var ts = (cs.textShadow || '').match(/([-\d.]+)px\s+[-\d.]+px/);
    if (ts) st.ab = parseFloat(ts[1]);
    /* 焦点环：outline-color 从透明到不透明，量它的 alpha 就是「环有多可见」 */
    if (cs.outlineStyle && cs.outlineStyle !== 'none') {
      var oc = (cs.outlineColor || '').match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
      st.ring = oc ? parseFloat(oc[1]) : 1;
    }
    return st;
  }

  /* [键, 标签, 归一化权重, 读数格式, 轴标签格式]
     权重让"位移 100px"和"缩放 1.0"和"转 90°"在同一个尺度上可比 */
  var CH = [
    ['sc', 'SCALE', 1, function (v) { return '×' + v.toFixed(3); }, function (v) { return v.toFixed(2); }],
    ['tx', 'TRANSLATE X', 1 / 100, px, function (v) { return v.toFixed(0); }],
    ['ty', 'TRANSLATE Y', 1 / 100, px, function (v) { return v.toFixed(0); }],
    ['rot', 'ROTATE', 1 / 90, deg, function (v) { return v.toFixed(0); }],
    /* 3D 倾斜：绕 X/Y 转的时候矩阵的 a、b 几乎不变（cos 16° = 0.96），
       真正的信号在 matrix3d 的 sin 分量里 */
    ['tilt', 'TILT', 1 / 90, deg, function (v) { return v.toFixed(0); }],
    ['clip', 'REVEALED', 1, function (v) { return (v * 100).toFixed(0) + '%'; }, function (v) { return (v * 100).toFixed(0) + '%'; }],
    ['sz', 'APPARENT SCALE', 1, function (v) { return '×' + v.toFixed(3); }, function (v) { return v.toFixed(2); }],
    ['blur', 'BLUR', 1 / 10, function (v) { return v.toFixed(1) + 'px'; }, function (v) { return v.toFixed(1); }],
    ['glow', 'GLOW RADIUS', 1 / 40, function (v) { return v.toFixed(1) + 'px'; }, function (v) { return v.toFixed(0); }],
    ['ab', 'RGB OFFSET', 1 / 8, function (v) { return (v > 0.5 ? '+' : '') + v.toFixed(1) + 'px'; }, function (v) { return v.toFixed(0); }],
    ['bgp', 'BG POSITION', 1 / 200, function (v) { return v.toFixed(0) + '%'; }, function (v) { return v.toFixed(0); }],
    ['mask', 'MASK POSITION', 1 / 300, function (v) { return v.toFixed(0) + '%'; }, function (v) { return v.toFixed(0); }],
    ['bsz', 'BG SIZE', 1 / 200, function (v) { return v.toFixed(0) + '%'; }, function (v) { return v.toFixed(0); }],
    ['ring', 'RING ALPHA', 1, function (v) { return (v * 100).toFixed(0) + '%'; }, function (v) { return (v * 100).toFixed(0) + '%'; }]
  ];
  var MIN_SCORE = 0.002;

  /* 主角优先级：形变 > 材质 > 存在。
     「悬停抬升」同时抬 6px、阴影涨 24px，纯按量程排会让阴影抢走主角，
     而这条术语讲的是抬升。所以只要形变类有一点信号，就不轮到材质类；
     不透明度天然 0→1，最后才轮到它——它说的是「存在」，不是「运动」。 */
  /* 表观尺寸（渲染宽 ÷ 布局宽）不进第一轮：2D 变换下它和 SCALE 是同一个量的两次
     测量，让两者比大小只会比到浮点尾数上。它留给只有 3D 透视能看见的那批。 */
  var MOTION_KEYS = ['sc', 'tx', 'ty', 'rot'];
  function rangeOf(s, k) {
    var lo = 1e9, hi = -1e9, any = false;
    s.forEach(function (p) { var v = p[k]; if (isNaN(v)) return; any = true; if (v < lo) lo = v; if (v > hi) hi = v; });
    return any ? { lo: lo, hi: hi } : null;
  }
  function pickIn(s, keys) {
    var best = null;
    keys.forEach(function (k) {
      var d = null, r = rangeOf(s, k);
      CH.forEach(function (c) { if (c[0] === k) d = c; });
      if (!d || !r) return;
      var score = (r.hi - r.lo) * d[2];
      if (score < MIN_SCORE) return;
      if (!best || score > best.score) best = { key: k, label: d[1], fmt: d[3], axis: d[4], score: score, lo: r.lo, hi: r.hi };
    });
    return best;
  }
  function pickChannel(s) {
    var w = pickIn(s, MOTION_KEYS) || pickIn(s, CH.map(function (c) { return c[0]; }).filter(function (k) { return MOTION_KEYS.indexOf(k) < 0; }));
    if (w) return w;
    var r = rangeOf(s, 'op');
    if (r && r.hi - r.lo >= 0.02) return { key: 'op', label: 'OPACITY', fmt: function (v) { return (v * 100).toFixed(0) + '%'; }, axis: function (v) { return v.toFixed(2); }, score: r.hi - r.lo, lo: r.lo, hi: r.hi };
    return null;
  }

  /* ── 这块仪表有没有话要说 ─────────────────────────────
     一条从 A 单调走到 B 的斜坡不表达任何术语：它只证明「这条动效有始有终」，
     而这在舞台里已经看得见。fade-in / translate / scale / blur 那批的实测曲线
     正好就是这个形状，于是整块面板成了一块占位的装饰。值得装表的是形状本身：
     过冲与预备（越出两端）、多时钟（比时长、比错峰）、循环与往复（量周期）、
     台阶与震荡（非单调）。缓动族那一类交给右侧的实验台，那里能改曲线本身。 */
  function shapeOf(c) {
    var v = c.s.map(function (p) { return p[c.chan.key]; });
    var eps = (c.chan.hi - c.chan.lo) * 0.012;
    var turn = 0, runs = 0, flat = 0, sign = 0;
    for (var i = 1; i < v.length; i++) {
      var g = v[i] - v[i - 1];
      if (Math.abs(g) < eps) { flat++; continue; }
      if (flat >= 2) runs++;
      flat = 0;
      var s = g > 0 ? 1 : -1;
      if (sign && s !== sign) turn++;
      sign = s;
    }
    if (flat >= 2) runs++;
    return { turn: turn, runs: runs };
  }
  function informative(clocks) {
    if (clocks.length > 1) return true;
    var c = clocks[0];
    if (!c) return false;
    if (c.cyc) return true;
    var from = c.chan.from, to = c.chan.to;
    var span = Math.abs(to - from) || (c.chan.hi - c.chan.lo) || 1;
    if ((c.chan.hi - Math.max(from, to)) / span > 0.015) return true;
    if ((Math.min(from, to) - c.chan.lo) / span > 0.015) return true;
    var sh = shapeOf(c);
    return sh.turn >= 1 || sh.runs >= 3;
  }

  function timing(a) {
    if (!a || !a.effect) return null;
    var T = a.effect.getComputedTiming();
    /* 无限循环的 activeDuration 是 Infinity，直接当横轴会得到 NaN */
    var INF = T.iterations === Infinity || !isFinite(T.activeDuration);
    var dur = INF ? T.duration : T.activeDuration;
    if (!isFinite(dur) || dur <= 0) return null;
    var dir = String(T.direction);
    /* alternate 的完整形状是"去 + 回"。只画去程，回程的游标就跑在曲线外面。 */
    var alt = dir.indexOf('alternate') >= 0;
    /* 有延迟的无限循环：起点不能从 0 开始扫。camera-shake 延迟 1200ms、周期 360ms，
       从 0 扫到 360 整段都落在延迟里，读回来是延迟前的同一个值 → 量程 0 → 判「没运动」。 */
    var period = (INF && alt) ? dur * 2 : dur;
    var off = INF ? (+T.delay || 0) : 0;
    return { INF: INF, dur: dur, iter: +T.duration || dur, alt: alt, delay: +T.delay || 0, off: off, period: period, dir: dir };
  }
  function phaseOf(ct, T) {
    var x = ct - T.off;
    if (x < 0) return 0;
    var u = x / T.period;
    /* 只播一次的动画播完就停在终点，相位是 1 而不是绕回 0——
       绕回去会让一块播完的面板写着 T=0/420ms 却显示终态读数 */
    if (!T.INF) return Math.max(0, Math.min(1, u));
    return Math.max(0, Math.min(1, u - Math.floor(u)));
  }

  /* 舞台里的"时钟"= 一种 (关键帧, 时长, 缓动, 方向) 签名。
     currentTime 一旦是数字就不能设回 null（浏览器拒绝 resolved→unresolved）。 */
  function collectClocks(stage) {
    var seen = {}, out = [];
    stage.getAnimations({ subtree: true }).forEach(function (a) {
      var host = a.effect && a.effect.target;
      if (!host || host === stage || !stage.contains(host)) return;
      /* 对照台（two）给两侧小标题也编了一条 200ms 淡入。它是标签纸，不是演示对象：
         按文档顺序它排在 .obj 前面，于是整块面板的主读数被它抢走，
         写着 OPACITY=100% 而这条术语讲的是时长 / 透视 / 缓动。 */
      if (host.matches && host.matches('.tag')) return;
      var T = timing(a); if (!T) return;
      /* 动画也可能挂在伪元素上（下划线就是 .link::after）。这一版 Chromium 没有
         KeyframeEffect.getPseudo()，所以只能自己试：宿主读不到运动，就再读 ::after / ::before。
         不这么做的话读到的是宿主元素的样式，一动不动，仪表把它判成「没有运动」。 */
      var orig = a.currentTime, was = a.playState, ps = null, s = [], w = null;
      var tries = [null, '::after', '::before'];
      for (var ti = 0; ti < tries.length && !w; ti++) {
        ps = tries[ti]; s = [];
        for (var i = 0; i <= SCAN; i++) { a.currentTime = T.off + i / SCAN * T.period; s.push(probe(host, ps)); }
        /* 旋转角必须按相邻帧解绕，否则转满一圈读成 −180°→180° 的来回抖动 */
        for (var j = 1; j < s.length; j++) {
          var d = s[j].rot - s[j - 1].rot;
          if (d > 180) s[j].rot -= 360; else if (d < -180) s[j].rot += 360;
        }
        w = pickChannel(s);
      }
      a.currentTime = orig === null ? 0 : orig;
      if (was === 'paused') a.pause();
      if (!w) return;
      var cs = getComputedStyle(host, ps);
      /* 去重签名要带上方向、不带延迟：溶解/拉焦的 B 层和 A 层只差 alternate-reverse，
         少了方向会被并成一条；而错峰（stagger）的全部意义就是同一份关键帧换不同延迟，
         所以这里用「一次迭代的时长」而不是含延迟的 activeDuration 当签名。 */
      var sig = (a.transitionProperty ? 'tr:' + a.transitionProperty : 'an:' + a.animationName) + '|' +
        Math.round(T.iter) + '|' + cs.animationTimingFunction + '|' + T.dir + '|' + (ps || '');
      if (seen[sig]) return;
      seen[sig] = 1;
      var sub = host.closest ? host.closest('.sub') : null;
      var tag = sub ? (sub.querySelector('.tag') || {}).textContent : '';
      out.push({
        host: host, ps: ps, T: T, s: s, w: w, name: String(tag || '').split('·')[0].trim(),
        ease: cs.animationTimingFunction,
        chan: { key: w.key, label: w.label, fmt: w.fmt, axis: w.axis, lo: w.lo, hi: w.hi, from: s[0][w.key], to: s[s.length - 1][w.key] }
      });
      var last = out[out.length - 1];
      /* 回到起点的不止循环动画：0%→100% 同值的往复（抖动、呼吸、回弹）两端差几乎为零，
         再按「越界 % 于两端之差」算就会除以近零，实测爆到 −998%。这类一律标峰谷。 */
      last.cyc = T.INF || Math.abs(last.chan.to - last.chan.from) < (last.chan.hi - last.chan.lo) * 0.02;
      /* 多关键帧的动画不是一条 mix() 能写下来的：shake 是六段衰减。
         公式条照实说「几段」，形状交给旁边那条实测曲线。 */
      try { last.kf = a.effect.getKeyframes().length; } catch (e) { last.kf = 0; }
    });
    return out.slice(0, 4);
  }

  /* 归一化进度：有始有终的按两端算，往复/循环的按量程算（它们没有"终点"可言） */
  function qof(c, v) {
    var a = c.cyc ? c.chan.lo : c.chan.from, b = c.cyc ? c.chan.hi : c.chan.to;
    return b === a ? 0 : (v - a) / (b - a);
  }

  function build(node, term, clocks) {
    var visual = node.querySelector('.pg-visual'), stage = node.querySelector('.stage');
    if (!visual || !stage || !clocks.length) return null;
    var multi = clocks.length > 1;
    var C = clocks[0], chan = C.chan, T = C.T;
    /* 旋转角是周期的：实时读回来的是 atan2 的 −180..180，得折回扫描区间，
       否则转满一圈会写成 −70°（真相是 290°），EASED 还会跟着变负数 */
    function fold(c, v) {
      if (c.chan.key !== 'rot' || isNaN(v)) return v;
      var lo = c.chan.lo;
      return lo + ((v - lo) % 360 + 360) % 360;
    }
    function liveOf(c) { return fold(c, probe(c.host, c.ps)[c.chan.key]); }
    /* 量程怎么讲：缩放是乘法，说「×3.50」比「×1.500」（两个值的差）讲得通 */
    function spanOf(c) {
      var s = c.chan;
      if (s.key === 'sc' && s.lo > 0.001) return '×' + (s.hi / s.lo).toFixed(2);
      return s.fmt(s.hi - s.lo);
    }
    function read() { return liveOf(C); }

    /* 曲线按"相位"存而不是按毫秒存：慢放从 1× 拨到 ¼× 时形状不变，只换轴标签。
       多时钟时横轴换成共享时间轴（自己的周期 ÷ 最长周期）——"退场只占一半宽"
       就是不对称本身，各画各的 0→1 会把它抹平成两条一样长的线 */
    var maxPer = 0;
    clocks.forEach(function (c) { if (c.T.period > maxPer) maxPer = c.T.period; });
    clocks.forEach(function (c) {
      c.pts = c.s.map(function (p, i) {
        var u = i / SCAN, v = p[c.chan.key];
        return [multi && maxPer ? u * c.T.period / maxPer : u, v, qof(c, v)];
      });
    });

    var W = 234, H = 118, PL = 30, PB = 16;
    var X = function (p) { return PL + p * (W - PL - 4); };
    var lo, hi, Y;
    if (multi) {
      lo = Math.min.apply(null, [].concat.apply([], clocks.map(function (c) { return c.pts.map(function (p) { return p[2]; }); })));
      hi = Math.max.apply(null, [].concat.apply([], clocks.map(function (c) { return c.pts.map(function (p) { return p[2]; }); })));
      lo = Math.min(lo, 0); hi = Math.max(hi, 1);
      var padq = (hi - lo - 1) * 0.35 + 0.06;
      var q0 = lo - padq, q1 = hi + padq;
      Y = function (q) { return H - PB - (q - q0) / (q1 - q0) * (H - PB - 8); };
    } else {
      lo = Math.min.apply(null, C.pts.map(function (p) { return p[1]; }));
      hi = Math.max.apply(null, C.pts.map(function (p) { return p[1]; }));
      var pad = (hi - lo || 1) * 0.16, y0 = lo - pad, y1 = hi + pad;
      Y = function (v) { return H - PB - (v - y0) / (y1 - y0) * (H - PB - 8); };
    }
    function curve(c) { return c.pts.map(function (p) { return X(p[0]).toFixed(1) + ',' + Y(multi ? p[2] : p[1]).toFixed(1); }).join(' '); }

    /* 只有超出两端的那一段值得画阴影：往上叫过冲，往下叫预备（起手反向）。
       往复与循环没有"两端"，越界无意义，改标峰谷。 */
    var cyc = C.cyc;
    var hiE = Math.max(chan.from, chan.to), loE = Math.min(chan.from, chan.to);
    var swing = Math.abs(chan.to - chan.from) || 1;
    var zone = (multi || cyc) ? null : ((hi - hiE) >= (loE - lo)
      ? (hi - hiE > 0.0015 * swing ? { kind: '过冲', line: hiE, ext: hi, at: 'above' } : null)
      : (loE - lo > 0.0015 * swing ? { kind: '预备', line: loE, ext: lo, at: 'below' } : null));
    var amt = zone ? Math.abs(zone.ext - zone.line) / swing * 100 : 0;
    var pk = zone ? C.pts.reduce(function (m, p) { return (zone.at === 'above' ? p[1] > m[1] : p[1] < m[1]) ? p : m; }, C.pts[0]) : [0, chan.to];
    var mark = zone ? ('<circle class="hud-pk" cx="' + X(pk[0]) + '" cy="' + Y(pk[1]) + '" r="3.2"/>' +
      '<text class="hud-pklbl" x="' + X(pk[0]) + '" y="' + (Y(pk[1]) + (zone.at === 'above' ? -8 : 14)) + '" text-anchor="middle">' +
      (zone.at === 'above' ? '+' : '−') + amt.toFixed(1) + '%</text>') : '';

    var sib = (window.TERMS || []).filter(function (x) { return x.cat === term.cat; });
    var pos = sib.map(function (x) { return x.id; }).indexOf(term.id);
    var catName = ((window.CATS || []).filter(function (c) { return c.id === term.cat; })[0] || {}).name || term.cat;
    var en = window.I18N && window.I18N.lang === 'en';
    var L = function (zh, eng) { return en ? eng : zh; };
    var durs = clocks.map(function (c) { return c.T.period; });
    var maxP = Math.max.apply(null, durs), minP = Math.min.apply(null, durs);
    var ratio = multi ? maxP / minP : 0;
    /* 循环/往复类没有"终点"可言（它回到起点），两端换成实测峰谷；轴标签与结论跟着换 */
    var top = cyc ? chan.hi : chan.to, bot = cyc ? chan.lo : chan.from;

    var panel = document.createElement('div');
    panel.className = 'hud';
    panel.innerHTML =
      '<div class="hud-head"><b><i class="hud-dot"></i>LIVE READOUT</b><span>' + L('实测', 'MEASURED') + '</span></div>' +
      '<div class="hud-f hud-hi"><s>' + chan.label + '</s><var data-out="v">' + chan.fmt(read()) + '</var></div>' +
      (multi ? '' : '<div class="hud-row">' +
        '<div class="hud-f sm"><s>EASED</s><var data-out="e">0.000</var></div>' +
        '<div class="hud-f sm"><s>T</s><var data-out="t">0<u>/' + Math.round(T.period) + 'ms</u></var></div></div>') +
      '<svg class="hud-chart" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      (zone ? '<rect class="hud-zone" x="' + PL + '" y="' + (zone.at === 'above' ? Y(zone.ext) : Y(zone.line)) + '" width="' + (W - PL - 6) +
        '" height="' + Math.abs(Y(zone.line) - Y(zone.ext)) + '"/>' : '') +
      (multi ? '<line class="hud-goal" x1="' + PL + '" y1="' + Y(1) + '" x2="' + (W - 6) + '" y2="' + Y(1) + '"/>' : '') +
      '<line class="hud-ref" x1="' + X(0) + '" y1="' + Y(multi ? 0 : bot) + '" x2="' + X(1) + '" y2="' + Y(multi ? 1 : top) + '"/>' +
      clocks.map(function (c, i) {
        return '<polyline class="hud-meas hud-c' + i + '" points="' + curve(c) + '"/>';
      }).join('') +
      '<line class="hud-ax" x1="' + PL + '" y1="' + (H - PB) + '" x2="' + (W - 4) + '" y2="' + (H - PB) + '"/>' +
      '<line class="hud-ax" x1="' + PL + '" y1="' + (H - PB) + '" x2="' + PL + '" y2="6"/>' +
      (multi
        ? '<text x="' + (PL - 4) + '" y="' + (Y(1) + 3) + '" text-anchor="end">' + L('到位', 'goal') + '</text>' +
        '<text x="' + (PL - 4) + '" y="' + (Y(0) + 3) + '" text-anchor="end">' + L('起点', 'from') + '</text>'
        : '<line class="hud-base" x1="' + PL + '" y1="' + Y(zone ? zone.line : top) + '" x2="' + (W - 6) + '" y2="' + Y(zone ? zone.line : top) + '"/>' +
        '<text x="' + (PL - 4) + '" y="' + (Y(top) + 3) + '" text-anchor="end">' + chan.axis(top) + '</text>' +
        '<text x="' + (PL - 4) + '" y="' + (Y(bot) + 3) + '" text-anchor="end">' + chan.axis(bot) + '</text>') +
      '<text x="' + X(0) + '" y="' + (H - 3) + '">0</text>' +
      '<text class="hud-xend" x="' + X(1) + '" y="' + (H - 3) + '" text-anchor="end">' + Math.round(multi ? maxP : T.period) + 'ms</text>' + mark +
      '<line class="hud-cur" x1="' + X(0) + '" y1="6" x2="' + X(0) + '" y2="' + (H - PB) + '"/>' +
      '<circle class="hud-cdot" cx="' + X(0) + '" cy="' + Y(multi ? 0 : bot) + '" r="4.5"/></svg>' +
      '<div class="hud-cap"><span>' + (multi ? clocks.length + L(' 条时钟 · 各自归一化进度', ' clocks · normalised')
        : chan.label + ' × ' + L('时间', 'TIME') +
        (T.INF ? ' · ' + L(T.alt ? '循环 · 去+回' : '循环', T.alt ? 'loop · there+back' : 'loop')
          : cyc ? ' · ' + L('往复', 'there-and-back') : '')) +
      '</span><span>' + L('按住曲线可拖帧', 'drag to scrub') + '</span></div>' +
      (multi ? '<div class="hud-legend">' + clocks.map(function (c, i) {
        return '<div class="hud-clk"><i class="hud-key hud-c' + i + '"></i><s>' + (c.name || ('#' + (i + 1))) + ' ' + c.chan.label + '</s>' +
          '<var data-out="k' + i + '">' + c.chan.fmt(liveOf(c)) + '</var><u data-out="d' + i + '">0/' + Math.round(c.T.period) + 'ms</u></div>';
      }).join('') + '</div>' : '') +
      '<div class="hud-verdict"><span>' + (multi
        ? L('最长 ', 'slowest ') + '<b>' + Math.round(maxP) + 'ms</b>' + L(' vs 最短 ', ' vs shortest ') + '<b>' + Math.round(minP) + 'ms</b>' +
        L(' · 差 ', ' · gap ') + '<b>' + ratio.toFixed(1) + '×</b>'
        : cyc ? (T.alt ? L('一次往返 ', 'one round trip ') : T.INF ? L('一次循环行程 ', 'one loop travel ') : L('最大偏离 ', 'peak excursion ')) +
          '<b>' + spanOf(C) + '</b>'
          : (zone ? L('峰值', 'peak ') + zone.kind + '<b>' + (zone.at === 'above' ? '+' : '−') + amt.toFixed(1) + '%</b>' : L('两端不越界', 'no overshoot'))) +
      '</span>' + (multi ? '' : '<span class="hud-end">' +
        (cyc ? L('峰谷 ', 'range ') + '<b>' + chan.fmt(chan.lo) + ' → ' + chan.fmt(chan.hi) + '</b>'
          : L('终点 ', 'end ') + '<b>' + chan.fmt(chan.to) + '</b>') + '</span>') + '</div>';

    var BRK = '<svg viewBox="0 0 26 26"><path d="M25 1 L7 1 Q1 1 1 7 L1 25"/></svg>';
    /* 括号框住的是读数栏，不是舞台：实测装饰层压到过舞台内的文字 */
    panel.insertAdjacentHTML('beforeend',
      '<div class="hud-brk tl">' + BRK + '</div><div class="hud-brk tr">' + BRK + '</div>' +
      '<div class="hud-brk bl">' + BRK + '</div><div class="hud-brk br">' + BRK + '</div>');
    stage.insertAdjacentHTML('beforeend',
      '<div class="hud-num" title="' + catName + ' · ' + L('本类第 ', 'item ') + (pos + 1) + ' / ' + sib.length + '">' +
      ('0' + (pos + 1)).slice(-2) + '</div>');

    /* 时长文案不能烘死在 HTML 里：拨一下慢放就是 4×，同一根条上左边写 2080ms、
       右边还在说「啪一下」，等于自己打自己 */
    function lenWord(ms) {
      return ms < 400 ? L('这个时长读起来是"啪一下"', 'reads as a snap')
        : ms < 700 ? L('这个时长读起来是"干脆"', 'reads as crisp')
          : ms < 2000 ? L('这个时长偏叙事，别用在按钮上', 'narrative length, not for buttons')
            : L('这个时长是"长镜头"，要配位移才不闷', 'a long take, needs travel to carry it');
    }
    function lawOf(c) {
      var e = c.ease.indexOf('cubic-bezier') >= 0 ? c.ease.replace(/\s/g, '') : c.ease;
      if (c.kf > 2) return L(c.kf + ' 段关键帧（逐段 ' + e + '）· 形状见右侧实测曲线',
        c.kf + ' keyframes (per-segment ' + e + ') · shape is the measured curve');
      var a = c.cyc ? c.chan.lo : c.chan.from, b = c.cyc ? c.chan.hi : c.chan.to;
      return 'mix(' + c.chan.axis(a) + ', ' + c.chan.axis(b) + ', <i>' + e + '</i>(u))';
    }
    var bar = document.createElement('div');
    bar.className = 'hud-formula';
    bar.innerHTML = '<span class="hud-tag">' + L('公式', 'law') + '</span>' +
      (multi
        ? clocks.map(function (c, i) {
          return '<span><em>' + (c.name || ('#' + (i + 1))) + '</em> = ' + lawOf(c) + ' · <b class="hud-durk" data-i="' + i + '">' + Math.round(c.T.period) + '</b>ms</span>';
        }).join('<em>·</em>')
        : '<span>' + chan.label + ' = ' + lawOf(C) + '</span>' +
        '<em>·</em><span>u = t / <b class="hud-dur">' + Math.round(T.period) + '</b>ms' + (T.alt ? L(' 去+回', ' there+back') : '') + '</span>' +
        /* 结论只说时长：越界与否已经写在读数栏的结论条里，这里再讲一遍就是占位 */
        '<em>·</em><span class="hud-len">' + lenWord(T.period) + '</span>');
    visual.appendChild(panel);
    visual.appendChild(bar);

    /* 「重播」搬进公式条右端：它原来那条工具行整行只放一个按钮，太孤。
       监听绑在按钮节点上，挪 DOM 不影响它。信任标记不重复：抬头已经写了「实测」 */
    var tools = node.querySelector('.stage-tools'), rep = tools && tools.querySelector('.replay');
    if (rep) { bar.appendChild(rep); node._tools = tools; if (!tools.querySelector('.hint')) tools.hidden = true; }

    var svg = panel.querySelector('.hud-chart');
    var out = {
      v: panel.querySelector('[data-out="v"]'), e: panel.querySelector('[data-out="e"]'),
      t: panel.querySelector('[data-out="t"]'), cur: panel.querySelector('.hud-cur'),
      dot: panel.querySelector('.hud-cdot'), xend: panel.querySelector('.hud-xend'),
      dur: bar.querySelector('.hud-dur'),
      len: bar.querySelector('.hud-len'),
      durs: [].slice.call(bar.querySelectorAll('.hud-durk')),
      kv: clocks.map(function (c, i) { return panel.querySelector('[data-out="k' + i + '"]'); }),
      kd: clocks.map(function (c, i) { return panel.querySelector('[data-out="d' + i + '"]'); })
    };

    /* 拖动曲线 = 停在某一帧。这条能力只在有曲线时才成立，所以它属于图，
       不该在工具条上和「重播」抢位置。按整段周期 seek，各自的 delay 包含在里面 */
    svg.style.cursor = 'ew-resize';
    var moving = false, lastAxis = 0;
    function seekFrom(ev) {
      var r = svg.getBoundingClientRect(), k = r.width / W;
      if (!k) return;
      var u = Math.max(0, Math.min(1, ((ev.clientX - r.left) / k - PL) / (W - PL - 4)));
      var d = 0;
      stage.getAnimations({ subtree: true }).forEach(function (x) {
        var TX = timing(x); if (!TX) return; x.currentTime = TX.off + u * (multi && maxP ? maxP : TX.period); x.pause(); d = Math.max(d, TX.period);
      });
      if (out.t) out.t.innerHTML = Math.round(u * d) + '<u>/' + Math.round(d) + 'ms</u>';
    }
    svg.addEventListener('pointerdown', function (ev) { moving = true; try { svg.setPointerCapture(ev.pointerId); } catch (e) { } seekFrom(ev); ev.preventDefault(); });
    svg.addEventListener('pointermove', function (ev) { if (moving) seekFrom(ev); });
    function release() { if (!moving) return; moving = false; stage.getAnimations({ subtree: true }).forEach(function (x) { if (timing(x)) x.play(); }); }
    svg.addEventListener('pointerup', release);
    svg.addEventListener('pointercancel', release);

    return {
      multi: multi,
      paint: function () {
        /* 重播会重建动画对象、慢放会改时长：每帧重新认领一次 */
        clocks.forEach(function (c, ci) {
          var a = c.host.getAnimations()[0]; if (!a) return;
          var TT = timing(a); if (!TT) return;
          c.T = TT;
          var u = phaseOf(a.currentTime || 0, TT), v = liveOf(c);
          /* 重播的瞬间动画被摘掉、元素宽度为 0，量回来是 NaN：这一帧就别画，
             否则 SVG 报 cy="NaN"，大数字和游标也会闪一下垃圾值 */
          if (!isFinite(v) || !isFinite(u)) return;
          if (out.kv[ci]) out.kv[ci].textContent = c.chan.fmt(v);
          if (out.kd[ci]) out.kd[ci].textContent = Math.round(u * TT.period) + '/' + Math.round(TT.period) + 'ms';
          if (!multi && ci === 0) {
            out.v.textContent = c.chan.fmt(v);
            out.t.innerHTML = Math.round(u * TT.period) + '<u>/' + Math.round(TT.period) + 'ms</u>';
            /* EASED 也量，不算：原来这里代入 cubic-bezier 自己算一遍，
               遇到关键词缓动（ease-in-out）、steps()、多关键帧、alternate 回程，
               它就和同一块屏上的实测大数字对不上——实测偏到 0.99 都出现过 */
            var q = qof(c, v);
            out.e.textContent = isFinite(q) ? q.toFixed(3) : '—';
            /* 单时钟的 Y 吃原始读数，多时钟的 Y 吃归一化进度（见 curve()），别混 */
            out.dot.setAttribute('cx', X(u)); out.dot.setAttribute('cy', Y(v));
          }
        });
        /* 慢放和「时长」滑块都会改真实时长，轴标签必须跟着走，否则读数就在撒谎 */
        var mPer = 0;
        clocks.forEach(function (c) { if (c.T && c.T.period > mPer) mPer = c.T.period; });
        if (mPer !== lastAxis) {
          lastAxis = mPer; maxP = mPer;
          out.xend.textContent = Math.round(mPer) + 'ms';
          if (out.dur) out.dur.textContent = Math.round(mPer);
          if (out.len) out.len.textContent = lenWord(mPer);
          if (out.durs.length) clocks.forEach(function (c, i) {
            if (out.durs[i] && c.T) out.durs[i].textContent = Math.round(c.T.period);
          });
        }
        /* 多时钟：游标走共享时间轴（真实已过毫秒 ÷ 最长周期），不是各自相位的最大值 */
        var pa = C.host.getAnimations()[0] || {};
        var ax = multi ? (maxP ? Math.min(1, (pa.currentTime || 0) / maxP) : 0)
          : phaseOf(pa.currentTime || 0, C.T);
        if (multi) {
          var mv = liveOf(C), mq = qof(C, mv);
          if (isFinite(mv) && isFinite(mq) && isFinite(ax)) {
            out.v.textContent = chan.fmt(mv);
            out.dot.setAttribute('cx', X(ax));
            out.dot.setAttribute('cy', Y(mq));
          }
        }
        if (isFinite(ax)) { out.cur.setAttribute('x1', X(ax)); out.cur.setAttribute('x2', X(ax)); }
      }
    };
  }

  /* ── 录轨迹：JS 驱动的演示没有可 seek 的动画，那就一边跑一边录。
     仍然只读不写：录的是浏览器实际画出来的位置，不是我们重算的公式。 ── */
  var REC_MS = 2400, GAP_MAX = 250;
  function probeOf(el, b) {
    var cs = getComputedStyle(el), m = new DOMMatrixReadOnly(m0(cs.transform)), r = el.getBoundingClientRect();
    var o = parseFloat(cs.opacity);
    /* 描边进度：SVG 画线靠 stroke-dashoffset，几何一动不动，但「画到哪儿」是真的。
       读数必须是「画了全程的百分之几十」= (L - offset) / L，不能直接拿 -offset 当长度：
       那会把「还剩 212px 没画」显示成 STROKE DRAWN −212px，等于把倒数当成答案。 */
    var dk = parseFloat(cs.strokeDashoffset);
    var plen = el.getTotalLength ? el.getTotalLength() : 0;
    var bp = firstPct(cs.backgroundPositionX);
    var cp = cs.clipPath && cs.clipPath !== 'none' ? cs.clipPath : '';

    var sz = el.offsetWidth ? r.width / el.offsetWidth : NaN;
    var tl = Math.hypot(Math.atan2(-m.m23, m.m22) * 180 / Math.PI,
      Math.asin(Math.max(-1, Math.min(1, m.m13 || 0))) * 180 / Math.PI);
    /* 滚动驱动的舞台：必须把「跟着盒子一起滚」的公共位移减掉，剩下的才是这条术语
       自己加的运动。不减的话整块列表每个元素都在动，量到的只是滚动条本身。
       减完之后：钉住的元素读数最大（它一动不动而内容在走），普通流里的读数≈0。 */
    var tx = b.box ? (r.left - b.bx + b.sx) : (r.left - b.x);
    var ty = b.box ? (r.top - b.by + b.sy) : (r.top - b.y);
    /* 锚点用「没有 transform 时它在哪」，不是「我第一次看到它时它在哪」。
       布局稳定时两者只差一个常数，而那个常数正是 devtools 里的 translateX 本身：
       读数于是等于元素自己加出去的位移。用后者当锚点，会把「开始观察的那一刻」
       谎称成起点，还会把布局尚未稳定时的偏移一路带进整条曲线。
       滚动盒里仍然按第一次采样锚定——那里的横轴是滚动进度，公共位移已经减掉了。 */
    return { sc: Math.hypot(m.a, m.b), sz: sz, tilt: tl,
      dash: (isNaN(dk) || !plen) ? NaN : Math.max(0, Math.min(1, 1 - dk / plen)),
      bgp: bp, clip: cp ? revealed(cp, el) : NaN, tx: tx, ty: ty,
      ax: b.box ? tx : (r.left - m.e - b.x), ay: b.box ? ty : (r.top - m.f - b.y),
      op: isNaN(o) ? 1 : o };
  }
  var KEYS = ['sc', 'sz', 'tilt', 'tx', 'ty', 'dash', 'bgp', 'clip', 'op'];
  var LABEL = { sc: 'SCALE', sz: 'APPARENT SCALE', tilt: 'TILT', tx: 'POSITION X', ty: 'POSITION Y',
    dash: 'STROKE DRAWN', bgp: 'BG POSITION', clip: 'REVEALED', op: 'OPACITY' };
  var FMT = { sc: function (v) { return '×' + v.toFixed(3); }, sz: function (v) { return '×' + v.toFixed(3); }, tilt: deg,
    dash: function (v) { return (v * 100).toFixed(0) + '%'; }, bgp: function (v) { return v.toFixed(0) + '%'; },
    clip: function (v) { return (v * 100).toFixed(0) + '%'; }, tx: px, ty: px,
    op: function (v) { return (v * 100).toFixed(0) + '%' } };
  function mkRun(el) {
    var r = { el: el, s: [], ox: 0, oy: 0, based: false };
    KEYS.forEach(function (k) { r[k] = { lo: 1e9, hi: -1e9 }; });
    return r;
  }
  /* 锚点 = 这个元素没有 transform 时所在的位置（见 probeOf 里的 ax）；
     滚动模式给回来的 ax 就是第一次采样的值，行为与原来一致 */
  function rel(r, p) {
    if (!r.based) { r.based = true; r.ox = p.ax; r.oy = p.ay; }
    p.tx -= r.ox; p.ty -= r.oy;
    return p;
  }
  function span(r, k) {
    var sp = r[k].hi - r[k].lo;
    if (k === 'tx' || k === 'ty') return sp / 100;
    if (k === 'tilt') return sp / 12;
    if (k === 'dash') return sp;               /* 0..1，与 clip 同一权重 */
    if (k === 'bgp') return sp / 300;
    return sp;
  }
  function bestOf(r, list) {
    var bk = list[0], bs = -1;
    list.forEach(function (k) { var v = span(r, k); if (v > bs) { bs = v; bk = k; } });
    return { key: bk, score: bs, raw: r[bk].hi - r[bk].lo };
  }
  /* 和声明式那条路同一条优先级：先形变，再材质，最后才是存在。
     不透明度天然 0→1，归一化量程永远满格，不设优先就会把打字机的光标闪烁当成主角，
     把「字一个个出现」读成 OPACITY 50%。 */
  function bestKey(r) {
    var m = bestOf(r, ['tx', 'ty', 'sc', 'tilt']);
    if (worth(m)) return m;
    var t = bestOf(r, ['dash', 'bgp', 'clip', 'sz']);
    if (worth(t)) return t;
    return bestOf(r, ['op']);
  }
  /* 该不该装仪表：位移不到 24px、缩放不到 0.05、透明度不到 0.2 的就不是运动，
     画出来只是一条抖动的直线，比没有更糟 */
  function worth(x) {
    var k = x.key, raw = x.raw;
    if (k === 'tx' || k === 'ty') return raw >= 14;
    if (k === 'tilt') return raw >= 4;
    if (k === 'dash') return raw >= 0.15;      /* dash 现在是 0..1 的进度，不是像素 */
    if (k === 'bgp') return raw >= 20;
    if (k === 'clip') return raw >= 0.05;
    if (k === 'sc' || k === 'sz') return raw >= 0.035;
    if (k === 'op') return raw >= 0.2;
    return raw >= 24;
  }
  /* ── 录制面板的主体白名单：登记 = 这条术语值得装表 ─────────────
     两道门一起过：① 只认演示自己声明的主体（按"谁动得多"猜会挑到装饰件，
     量出 SCALE ×0.143 这种看着像仪表、其实最没意义的数）；
     ② 而且这条术语的定义本身就是一条随时间变化的量、肉眼读不出来。
     滚动类一律不进这张表：横轴就是用户自己滚出来的进度，画的是他刚看到的那一下。
     更关键的是「先量一再决定要不要留」这个做法本身是错的——它会先让你去滚、去点，
     然后把面板撤走。装不装表必须在挂载之前决定，这里就是那个决定。
     其余演示（状态切换、文字、指针跟身、性能条…）不是没有运动，
     是那块面板说不出一句你在舞台里看不到的话。 */
  var ACTORS = [
    ['.scol', 'TRANSLATE X'],              /* spring / stiffness / damping / mass / interruptible：衰减形状与周期 */
    ['.j-a', 'TRANSLATE X'],               /* jank 顺滑轨 */
    ['.j-b', 'TRANSLATE X'],               /* jank 卡顿轨：两条线的差别就是这条术语 */
    ['svg path', 'STROKE DRAWN'],          /* line-drawing：画到百分之几十，屏幕上原本没有这个数 */
    ['.rpanel', 'TRANSLATE X']             /* rubber-band：阻尼是非线性的，拉出去几像素、什么时候变硬，得量 */
  ];
  function declaredActors(stage) {
    var out = [];
    ACTORS.forEach(function (a) {
      [].slice.call(stage.querySelectorAll(a[0])).forEach(function (el) { out.push({ el: el, name: a[1] }); });
    });
    return out.slice(0, 3);
  }
  /* 声明主体只是「该量谁」，不是「量到什么」。实测里声明 TRANSLATE X 的主体
     最后量出缩放（timeline-scrub）、声明 APPARENT SCALE 的量出倾角（css-3d）都发生过——
     屏上标签必须跟着读数走，否则读数在讲一件事、标签在讲另一件。 */
  var NAME_KEY = { 'TRANSLATE X': 'tx', 'POSITION X': 'tx', 'TRANSLATE Y': 'ty', 'POSITION Y': 'ty',
    'SCALE': 'sc', 'APPARENT SCALE': 'sz', 'TILT': 'tilt', 'OPACITY': 'op', 'STROKE DRAWN': 'dash',
    'BG POSITION': 'bgp', 'REVEALED': 'clip' };
  function actorLabel(r) {
    var n = r.name || LABEL[r.key] || '';
    var want = NAME_KEY[n];
    if (want && want !== r.key) return LABEL[r.key] || n;
    return n;
  }

  function buildTraced(node, term) {
    var visual = node.querySelector('.pg-visual'), stage = node.querySelector('.stage');
    if (!visual || !stage) { node.dataset.telemetry = 'n/a'; return null; }
    var br = stage.getBoundingClientRect(), base = { x: br.left, y: br.top };
    /* 主体是画布的演示，DOM 只能量到画布外围，量到的不是这条术语 */
    /* 画布规则不能盖住声明主体：curve 那批的探针就是骑在画布上的小点，
       画布是它的图，不是量不到的黑盒 */
    var cvs = (term.demo || {}).kind === 'curve' ? null : stage.querySelector('canvas');
    if (cvs) {
      var cr = cvs.getBoundingClientRect();
      if (cr.width * cr.height > 0.5 * br.width * br.height) { node.dataset.telemetry = 'canvas'; return null; }
    }
    var scBox = stage.querySelector('.scrolly');
    function sprog() {
      if (!scBox) return -1;
      var m = scBox.scrollHeight - scBox.clientHeight;
      return m > 8 ? Math.max(0, Math.min(1, scBox.scrollTop / m)) : -1;
    }
    var scrollMode = sprog() >= 0;
    var declared = declaredActors(stage);
    var acts = declared;
    if (!acts.length) { node.dataset.telemetry = 'n/a'; return null; }
    var inputish = !!(term.demo || {}).play || !!(term.demo || {}).behavior ||
      ['drag', 'list', 'morph', 'perf', 'compound', 'type', 'scroll'].indexOf((term.demo || {}).kind) >= 0;
    var find = acts.map(function (a) { var r = mkRun(a.el); r.name = a.name; return r; });
    var runs = [], done = false, started = false, extra = [];
    /* 滚动驱动的横轴不该是时间：它不由时间推进，套上 2.4 秒录制窗口只会画出一条直线 */
    var seen = 0, pmin = 1, pmax = 0, lastProg = -1, idle = 0;
    function xq(t) { return scrollMode ? t : Math.min(1, t / REC_MS); }
    var best = null, bkey = 'sc', cyc = 0, pts = [], y0 = 0, y1 = 1;
    var acc = 0, lastAny = performance.now(), frame = 0, recT0 = 0;
    /* 版面尺寸跳变要重录，而且要等它连续 8 帧不再变才开始录：
       面板挂上会把舞台从 992 压到 728，弹簧的 span 由 ResizeObserver 再晚一两帧才重算，
       在这之前锚定的原点会一直带着那两百多像素的版面位移——它不是运动。 */
    var lastW = br.width, lastH = br.height, restarts = 0, stableFrames = 0;
    var W = 234, H = 118, PL = 30, PB = 16;
    var X = function (p) { return PL + p * (W - PL - 4); };
    var Y = function (v) { return H - PB - (v - y0) / (y1 - y0 || 1) * (H - PB - 8); };
    var en = window.I18N && window.I18N.lang === 'en';
    var L = function (zh, eng) { return en ? eng : zh; };

    var panel = document.createElement('div');
    panel.className = 'hud hud-traced';
    panel.innerHTML =
      '<div class="hud-head"><b><i class="hud-dot"></i>LIVE READOUT</b><span data-out="mode">' + L('探测中', 'probing') + '</span></div>' +
      '<div class="hud-f hud-hi"><s data-out="lbl">—</s><var data-out="v">—</var></div>' +
      '<div class="hud-row"><div class="hud-f sm"><s>' + (scrollMode ? L('进度', 'PROGRESS') : 'T') +
      '</s><var data-out="t">0<u>' + (scrollMode ? '%' : '/2.4s') + '</u></var></div>' +
      '<div class="hud-f sm"><s>' + (scrollMode ? L('滚到', 'reached') : L('周期', 'cycle')) +
      '</s><var data-out="cyc">…</var></div></div>' +
      '<svg class="hud-chart" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<line class="hud-ax" x1="' + PL + '" y1="' + (H - PB) + '" x2="' + (W - 4) + '" y2="' + (H - PB) + '"/>' +
      '<line class="hud-ax" x1="' + PL + '" y1="' + (H - PB) + '" x2="' + PL + '" y2="6"/>' +
      '<polyline class="hud-meas hud-c0" points=""/>' +
      '<line class="hud-cycle" x1="-9" y1="6" x2="-9" y2="' + (H - PB) + '"/>' +
      '<line class="hud-cur" x1="' + X(0) + '" y1="6" x2="' + X(0) + '" y2="' + (H - PB) + '"/>' +
      '<circle class="hud-cdot" cx="' + X(0) + '" cy="' + (H - PB) + '" r="4.5"/>' +
      '<text x="' + X(0) + '" y="' + (H - 3) + '">0</text>' +
      '<text class="hud-xend" x="' + X(1) + '" y="' + (H - 3) + '" text-anchor="end">' +
      (scrollMode ? '100%' : '2.4s') + '</text></svg>' +
      '<div class="hud-cap"><span data-out="cap1">' + L('先看谁在动', 'finding the mover') + '</span><span>' +
      (scrollMode ? L('来回滚一遍', 'scroll once') : L('不可拖帧', 'no scrub')) + '</span></div>' +
      '<div class="hud-verdict"><span data-out="rec-t">' + L('正在量这一条演示', 'measuring this demo') + '</span></div>';
    var bar = document.createElement('div');
    bar.className = 'hud-formula';
    bar.innerHTML = '<span class="hud-tag">' + L('说明', 'note') + '</span><span>' +
      L('这条由 JS 每帧驱动，没有解析式可给；曲线是浏览器实际画出来的位置录下来的', 'driven by JS each frame; the curve is recorded from what the browser actually painted') + '</span>';
    visual.appendChild(panel); visual.appendChild(bar);
    var tools = node.querySelector('.stage-tools'), rep = tools && tools.querySelector('.replay');
    if (rep) { bar.appendChild(rep); node._tools = tools; if (!tools.querySelector('.hint')) tools.hidden = true; }
    var BRK = '<svg viewBox="0 0 26 26"><path d="M25 1 L7 1 Q1 1 1 7 L1 25"/></svg>';
    panel.insertAdjacentHTML('beforeend',
      '<div class="hud-brk tl">' + BRK + '</div><div class="hud-brk tr">' + BRK + '</div>' +
      '<div class="hud-brk bl">' + BRK + '</div><div class="hud-brk br">' + BRK + '</div>');
    var sib = (window.TERMS || []).filter(function (x) { return x.cat === term.cat; });
    var pos = sib.map(function (x) { return x.id; }).indexOf(term.id);
    stage.insertAdjacentHTML('beforeend', '<div class="hud-num">' + ('0' + (pos + 1)).slice(-2) + '</div>');

    var out = {
      mode: panel.querySelector('[data-out="mode"]'), lbl: panel.querySelector('[data-out="lbl"]'),
      v: panel.querySelector('[data-out="v"]'), t: panel.querySelector('[data-out="t"]'),
      cyc: panel.querySelector('[data-out="cyc"]'), line: panel.querySelector('.hud-meas'),
      cur: panel.querySelector('.hud-cur'), dot: panel.querySelector('.hud-cdot'),
      cline: panel.querySelector('.hud-cycle'), cap1: panel.querySelector('[data-out="cap1"]'),
      rec: panel.querySelector('[data-out="rec-t"]'),
      legend: document.createElement('div')
    };
    out.legend.className = 'hud-legend';
    panel.insertBefore(out.legend, panel.querySelector('.hud-verdict'));
    function giveUp(msg) {
      node.dataset.telemetry = 'n/a'; node._hud = null; node._traced = null;
      out.rec.textContent = msg || L('这条演示里没有可量的位移', 'nothing measurable');
      window.setTimeout(function () {
        /* 「重播」要先送回工具条，再拆公式条：它此刻正住在 bar 里面，
           先 remove() 就连着它一起销毁了（拆完再 querySelector 必然找不到） */
        if (node._tools) {
          var r2 = bar.querySelector('.replay');
          if (r2) node._tools.appendChild(r2);
          node._tools.hidden = false; node._tools = null;
        }
        panel.remove(); bar.remove();
        [].slice.call(node.querySelectorAll('.hud-brk,.hud-num')).forEach(function (n) { n.remove(); });
        node.classList.remove('hud-on');
        var v = node.querySelector('.pg-visual'); if (v) v.style.removeProperty('--hud-accent');
      }, 900);
    }
    function rescale() {
      var lo = Math.min.apply(null, pts.map(function (p) { return p[1]; }));
      var hi = Math.max.apply(null, pts.map(function (p) { return p[1]; }));
      var pad = (hi - lo || 1) * 0.16; y0 = lo - pad; y1 = hi + pad;
    }
    function draw() {
      out.line.setAttribute('points', pts.map(function (p) { return X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1); }).join(' '));
    }
    function qnorm(r, p) {
      var bk = r.key, lo = r[bk].lo, hi = r[bk].hi;
      return hi === lo ? p[0] / REC_MS : (p[1][bk] - lo) / (hi - lo);
    }
    /* 两条归一化曲线的最大偏离。采样是同一个 x 网格上一起推进的，按下标比就行 */
    function devFrom(a, b) {
      var n = Math.min(a.s.length, b.s.length), d = 0;
      if (n < 8) return 1;
      for (var i = 0; i < n; i++) d = Math.max(d, Math.abs(qnorm(a, a.s[i]) - qnorm(b, b.s[i])));
      return d;
    }
    /* 两条曲线是不是一回事。归一化之后视差各层会重合得严丝合缝——它们只是速率不同，
       而速率正是这条术语要说的事，所以滚动模式下还要比一比原始幅度：跨度差 25% 以上算不同。 */
    function sameCurve(a, b) {
      var sa = a[a.key].hi - a[a.key].lo, sb = b[b.key].hi - b[b.key].lo;
      if (scrollMode && Math.max(sa, sb) > 1 && Math.abs(sa - sb) / Math.max(sa, sb) > 0.25) return false;
      return devFrom(a, b) < 0.08;
    }
    function finish() {
      done = true;
      /* 归一化之后几条线重合，就是把同一件事画了三遍（pinned-hero 那批栏目卡共用
         同一份映射正是这样）。先合成一条，再判这块面板还有没有话要说。 */
      if (runs.length > 1 && runs.slice(1).every(function (r) { return sameCurve(best, r); })) {
        runs = [best];
        extra.forEach(function (el) { el.remove(); });
        extra = [];
        out.legend.innerHTML = '';
      }
      if (runs.length > 1) {
        /* 多条线必须共用一条纵轴，否则每条各自铺满，看着一样高其实不可比 */
        y0 = -0.08; y1 = 1.08;
        pts = best.s.map(function (p) { return [xq(p[0]), qnorm(best, p)]; });
        extra.forEach(function (el, i) {
          var r = runs[i + 1];
          el.setAttribute('points', r.s.map(function (p) {
            return X(xq(p[0])).toFixed(1) + ',' + Y(qnorm(r, p)).toFixed(1);
          }).join(' '));
        });
        out.cap1.textContent = actorLabel(best) + ' × TIME · ' + L('各自归一化', 'normalised');
        out.legend.innerHTML = runs.map(function (r, i) {
          return '<div class="hud-clk"><i class="hud-key hud-c' + i + '"></i><s>' + actorLabel(r) + '</s>' +
            '<var data-out="k' + i + '">' + FMT[r.key](r.s.length ? r.s[r.s.length - 1][1][r.key] : 0) + '</var>' +
            '<u>' + (scrollMode ? (Math.round((r.s.length ? r.s[r.s.length - 1][0] : 0) * 100)) + '%'
              : ((r.s.length ? Math.round(r.s[r.s.length - 1][0]) : 0) / 1000).toFixed(2) + 's') + '</u></div>';
        }).join('');
      } else {
        pts = best.s.map(function (p) { return [xq(p[0]), p[1][bkey]]; });
        rescale();
      }
      draw();
      var vs = pts.map(function (p) { return p[1]; });
      var range = (Math.max.apply(null, vs) - Math.min.apply(null, vs)) || 1;
      var left = false;
      for (var i = 1; i < pts.length; i++) {
        if (Math.abs(pts[i][1] - pts[0][1]) > range * 0.25) left = true;
        if (left && Math.abs(pts[i][1] - pts[0][1]) <= range * 0.03) { cyc = pts[i][0] * REC_MS; break; }
      }
      out.mode.textContent = L('实测', 'MEASURED');
      out.cap1.textContent = (best.name || LABEL[bkey]) + ' × ' + (scrollMode ? L('滚动进度', 'SCROLL') : 'TIME') +
        (runs.length > 1 ? ' · ' + L('各自归一化', 'normalised') : '');
      if (scrollMode) {
        out.cyc.textContent = Math.round(pmax * 100) + '%';
        out.rec.textContent = L('录了 ' + pts.length + ' 个点 · 覆盖 ' +
          Math.round(pmin * 100) + '–' + Math.round(pmax * 100) + '%', pts.length + ' pts');
      } else {
        out.cyc.textContent = cyc ? (cyc / 1000).toFixed(2) + 's' : L('未检出', 'none');
        out.rec.textContent = L('录了 2.4 秒', '2.4s recorded') + (cyc ?
          L(' · 一个周期 ' + (cyc / 1000).toFixed(2) + ' 秒', ' · cycle ' + (cyc / 1000).toFixed(2) + 's') :
          L('（没回到起点，可能只播一次）', ' (never returned)'));
      }
      if (cyc && !scrollMode) { out.cline.setAttribute('x1', X(cyc / REC_MS)); out.cline.setAttribute('x2', X(cyc / REC_MS)); }
      /* 这里不再判「量出来值不值得留」：面板已经挂在屏上了，
         此时再 giveUp 就是用户照它说的滚完一遍、它把自己撤走。
         值不值得装表由 ACTORS 白名单在挂载之前决定。 */
    }

    /* 重录：把上一段的轨迹、原点与量程一起清掉。
       「以第一次采样为原点」意味着原点之前发生的一切都会算成位移，所以版面只要跳过一次，
       之前的采样就全部作废——而挂上这块面板本身就会跳：hud-on 把舞台从 992 压到 728，
       弹簧的行程跟着重算，元素在屏上瞬间挪了两百多像素，
       实测里就写出过 TRANSLATE X −1387px 这种数（真实行程只有 ±130px）。 */
    function restart() {
      runs = []; done = false; started = false; extra = [];
      pts = []; seen = 0; pmin = 1; pmax = 0; lastProg = -1; idle = 0; acc = 0; frame = 0;
      find.forEach(function (r) {
        r.s = []; r.based = false; r.ox = 0; r.oy = 0; r.key = null;
        KEYS.forEach(function (k) { r[k].lo = 1e9; r[k].hi = -1e9; });
      });
      [].slice.call(panel.querySelectorAll('.hud-meas')).slice(1).forEach(function (n) { n.remove(); });
      out.line.setAttribute('points', '');
      out.legend.innerHTML = '';
      out.mode.textContent = L('探测中', 'probing');
      out.cap1.textContent = L('先看谁在动', 'finding the mover');
      out.rec.textContent = scrollMode ? L('在这块里滚一下，我就把它画出来', 'scroll inside it to draw the curve')
        : L('正在量这一条演示', 'measuring this demo');
      out.lbl.textContent = '—'; out.v.textContent = '—';
    }

    return {
      traced: true,
      /* 重开同一条术语 = 重放同一段演示：把上一次录的轨迹与状态清掉，接着重新录。
         不拆面板、不重新采集——重新采集会撞上动画刚重启的那几帧，读回来全是同一个值。 */
      reset: restart,
      paint: function () {
        var now = performance.now(), gap = now - lastAny;
        /* 标签页被冻结过再回来，帧间隔会是几十秒；这种跳变不能进时间轴 */
        if (gap > GAP_MAX) { lastAny = now; return; }
        /* 底每帧重取：详情页 #page 自己会滚，rect 跟着变，冻在构造那一刻的话
           POSITION Y 就带上一个和运动无关的滚动量，量程还会被这条单调漂移劫持成 ty */
        var nb = stage.getBoundingClientRect(); base.x = nb.left; base.y = nb.top;
        if (base.box) {
          var bb = base.box.getBoundingClientRect();
          base.bx = bb.left; base.by = bb.top; base.sx = base.box.scrollLeft; base.sy = base.box.scrollTop;
        }
        /* 宽度变了就是版面跳了，之前所有采样（含原点）都不再描述这条演示。
           只允许重录四次：窗口一直拖来拖去时不该无限重来。 */
        if (nb.width) {
          var moved = Math.abs(nb.width - lastW) > 1 || Math.abs(nb.height - lastH) > 1;
          stableFrames = moved ? 0 : stableFrames + 1;
          if (moved && restarts < 4) { restarts++; restart(); }
          lastW = nb.width; lastH = nb.height;
        }
        lastAny = now; acc += gap; frame++;
        function probeAll(sam) {
          find.forEach(function (r) {
            var p = rel(r, probeOf(r.el, base));
            KEYS.forEach(function (k) { if (p[k] < r[k].lo) r[k].lo = p[k]; if (p[k] > r[k].hi) r[k].hi = p[k]; });
            /* 滚动进度不是时间：探测阶段滚过的每一格都是这条曲线的一段。
               不留下来，开录时量程已经跑满，收尾只剩一帧 → 实测「录了 1 个点」。 */
            if (sam && r.s.length < 300) r.s.push([sam, p]);
          });
        }
        if (!started) {
          if (scrollMode) {
            var pr0 = sprog();
            if (pr0 < 0) { giveUp(L('这条演示里没有可滚的区域', 'nothing to scroll')); return; }
            if (Math.abs(pr0 - lastProg) > 0.002) {
              probeAll(pr0); seen++;
              pmin = Math.min(pmin, pr0); pmax = Math.max(pmax, pr0); lastProg = pr0;
            }
            if (seen < 6 || pmax - pmin < 0.3 || stableFrames < 8) {
              out.rec.textContent = L('在这块里滚一下，我就把它画出来', 'scroll inside it to draw the curve');
              return;
            }
          } else {
            /* 指针/点击类不自己动：原来只探 400ms 就开录，那会儿鼠标还没进舞台，
               量程当然是零 → 直接判「没有可量的运动」。改成探到动过才开录。 */
            if (frame % 2 === 0) probeAll();
            var ready = false;
            for (var q = 0; q < find.length; q++) if (worth(bestKey(find[q]))) { ready = true; break; }
            if (!ready || stableFrames < 8) {
              if (acc < (inputish ? 14000 : 4000)) {
                out.rec.textContent = L('点一下 / 拖一下，我就把它画出来', 'click or drag it and I will draw it');
                return;
              }
              giveUp(); return;
            }
          }
          /* 走到这里才开录：上面两条路（滚够了 / 探到动过）都会先 return */
          {
            var scored = find.map(function (r) { return { r: bestKey(r), run: r }; })
              .sort(function (a, b) { return b.r.score - a.r.score; });
            /* 声明主体自己都没动够，就别画：例如只有一段下划线在缩 */
            var top = scored.length ? scored[0].r.score : 0;
            /* 主角要过"真的在动"这关；配角只留和主角同量级的（动 12px 的装饰件
               不该和动 600px 的主体并列成一条线） */
            runs = scored.filter(function (x, i) {
              return (i === 0 ? worth(x.r) : x.r.score >= top * 0.4 && worth(x.r));
            }).slice(0, 3).map(function (x) { return x.run; });
            if (!runs.length) { giveUp(); return; }
            best = runs[0]; bkey = bestKey(best).key;
            runs.forEach(function (r) {
              r.key = bestKey(r).key;
              /* 量到的是减掉公共滚动之后的额外行程，叫 POSITION 会让人以为在看绝对坐标。
                 只有位移通道才这么叫：缩放与透明度还是照实写。 */
              if (scrollMode && (r.key === 'tx' || r.key === 'ty')) r.name = 'EXTRA TRAVEL ' + (r.key === 'tx' ? 'X' : 'Y');
            });
            /* 主角与配角都选定了，此刻才把原点重锚到「开始录制」这一帧，并丢掉探测期
               攒下的量程。弹簧那批在挂载初期会被 ResizeObserver 改一次行程（span 从一千多
               跳到四百多），那一跳是版面不是运动；用它当原点，整段曲线会一路带着
               -1200px 的假位移，量程也会把它压成一条直线。
               滚动模式不重锚：它的采样点从探测期就开始留，锚一换会凭空多出一次跳变。 */
            if (!scrollMode) find.forEach(function (r) {
              r.based = false; r.s = [];
              KEYS.forEach(function (k) { r[k].lo = 1e9; r[k].hi = -1e9; });
            });
            out.lbl.textContent = actorLabel(best);
            out.mode.textContent = L('录制中', 'recording');
            out.rec.textContent = L('正在录这一笔', 'recording now');
            out.cap1.textContent = runs.length > 1
              ? L('场上有 ' + runs.length + ' 处在动，一起录', runs.length + ' things are moving')
              : L('正在录这条轨迹', 'recording this trace');
            /* 其余动素各一条线。SVG 里只能用 insertAdjacentHTML 拼，
               insertBefore 传字符串会抛，而外层 rAF 的 try/catch 会把这种错吞掉 */
            var svgEl = out.line.parentNode;
            svgEl.insertAdjacentHTML('beforeend', runs.slice(1).map(function (r, i) {
              return '<polyline class="hud-meas hud-c' + (i + 1) + '" points=""/>';
            }).join(''));
            extra = [].slice.call(svgEl.querySelectorAll('.hud-meas')).slice(1);
            started = true; acc = 0; recT0 = now;
          }
          return;
        }
        if (!done) {
          /* 录制阶段要接着跟踪滚动范围：否则 pmin/pmax 停在开始录制那一刻的取值，
             收尾条件永远等不到，面板会一直卡在「录制中」 */
          if (scrollMode) {
            var sp0 = sprog();
            if (sp0 >= 0) {
              if (sp0 < pmin) pmin = sp0;
              if (sp0 > pmax) pmax = sp0;
              idle = Math.abs(sp0 - lastProg) > 0.002 ? 0 : idle + 1;
              lastProg = sp0;
            }
          }
          var p2 = rel(best, probeOf(best.el, base)), xk = scrollMode ? sprog() : acc;
          /* 量程跟着采样走：多跑归一化（qnorm）用的就是它，
             只让探测期更新、录制期不更新的话，重锚之后它会一直停在旧版面算出来的跨度上 */
          function keep(r, p) {
            KEYS.forEach(function (k) { if (p[k] < r[k].lo) r[k].lo = p[k]; if (p[k] > r[k].hi) r[k].hi = p[k]; });
          }
          keep(best, p2);
          best.s.push([xk, p2]);
          runs.slice(1).forEach(function (r) { var p3 = rel(r, probeOf(r.el, base)); keep(r, p3); r.s.push([xk, p3]); });
          pts = best.s.map(function (q) { return [xq(q[0]), runs.length > 1 ? qnorm(best, q) : q[1][bkey]]; });
          if (runs.length <= 1) rescale();
          draw();
          if (scrollMode) { if (idle > 30 || (pmax - pmin >= 0.85 && best.s.length >= 10 && idle > 8)) finish(); }
          else if (acc > REC_MS) finish();
        }
        var live = rel(best, probeOf(best.el, base))[bkey];
        out.v.textContent = FMT[bkey](live);
        if (runs.length > 1) runs.forEach(function (r, i) {
          var e = out.legend.querySelector('[data-out="k' + i + '"]');
          if (e) e.textContent = FMT[r.key](probeOf(r.el, base)[r.key]);
        });
        var ph = scrollMode ? Math.max(0, sprog())
          : (done && cyc ? ((acc % cyc) / REC_MS) : Math.min(1, acc / REC_MS));
        out.t.innerHTML = scrollMode ? Math.round(ph * 100) + '<u>%</u>'
          : (Math.round(ph * REC_MS) / 1000).toFixed(2) + '<u>/2.4s</u>';
        out.cur.setAttribute('x1', X(ph)); out.cur.setAttribute('x2', X(ph));
        out.dot.setAttribute('cx', X(ph)); out.dot.setAttribute('cy', Y(live));
      }
    };
  }

  function stripPanel(node) {
    node._hud = null;
    node.classList.remove('hud-on');
    /* 搬走的「重播」要放回原处，否则关掉遥测就没有重播按钮了 */
    if (node._tools) {
      var r = node.querySelector('.hud-formula .replay');
      if (r) node._tools.appendChild(r);
      node._tools.hidden = false; node._tools = null;
    }
    /* .hud-lab 是右侧的缓动实验台，它不属于遥测：关掉遥测不该把旋钮和取景框一起带走。
       四角的 .hud-brk 永远长在面板里面，删面板就带走它——所以这里不能再按类名全局删，
       否则会把实验台那块的角标也摘掉。 */
    [].slice.call(node.querySelectorAll('.hud:not(.hud-lab),.hud-num,.hud-formula')).forEach(function (n) { n.remove(); });
    var v = node.querySelector('.pg-visual'); if (v) v.style.removeProperty('--hud-accent');
  }
  function strip(node) { stripPanel(node); node._hudId = null; node._clocks = null; node._traced = null; }

  function wire(node, id) {
    if (!node) return;
    var term = (window.TERMS || []).filter(function (t) { return t.id === id; })[0];
    if (!term) return strip(node);
    /* 缓动与曲线已经有顶部的 Easing Lab；详情页再放一块读数面板会重复
       同一条曲线，而且它无法可靠反映自定义曲线、重播和慢放后的真实状态。
       这一类详情页明确关闭遥测，避免显示看似精确但不可信的数字。 */
    if (term.cat === 'easing') {
      stripPanel(node);
      node._hudId = id;
      node._clocks = null;
      node._traced = null;
      node.dataset.telemetry = 'off';
      return;
    }
    if (node._hudId !== id) {
      stripPanel(node);
      node._hudId = id;
      node._keep = false;   /* 换术语 = 重新决定装不装表 */
      var stage = node.querySelector('.stage');
      /* 两条路都要"声明的主体"这道门：
         可 seek 的那条只认声明式编译出来的动画（kind 不在 MOTION.KINDS 里，
         就是 app.js 用 @keyframes 驱动 .obj 的那批）；命令式的那批走录制，
         录制只认 ACTORS 表里点名的元素。否则就会在文字类演示上抓到一个
         正在缩放的装饰件，量出 SCALE ×0.143 这种没意义的数。 */
      var kind = (term.demo || {}).kind;
      var declarative = !(window.MOTION && window.MOTION.KINDS && window.MOTION.KINDS[kind]);
      /* 缓动族（轨道与曲线两类舞台）由右侧的缓动实验台接管：那边改的是曲线本身，
         这里只能把同一条缓动重录成一条斜坡，等于把同一件事讲两遍 */
      if (['track', 'curve'].indexOf(kind) >= 0) {
        node._clocks = []; node._traced = false; node._retry = 0; node._plain = false;
        node.dataset.telemetry = 'lab';
        return;
      }
      node._clocks = stage && declarative ? collectClocks(stage) : [];
      /* 判据不过就把这块面板整块撤掉（连同 _traced 与 _retry 一起禁掉，
         否则它会换个身份再长回来）。但已经挂在屏上的不撤：重建时撤走，
         等于用户照它说的拨了一下控件、面板把自己没收了——那是惩罚操作，不是判据。 */
      node._plain = !!node._clocks.length && !node._keep && !informative(node._clocks);
      if (node._plain) node._clocks = [];
      /* 录制面板只认 ACTORS 白名单（见上）：登记过才装表。
         滚动盒不再是装表的理由——量完再撤会把用户刚做的动作没收掉。 */
      node._traced = !node._plain && !!stage && !node._clocks.length && !!declaredActors(stage).length;
      /* 首帧盲区：CSS 动画刚建出来的那一帧还没提交样式，seek 回来读到的还是同一个值，
         量程读成 0 → 整块仪表被判成「无可量运动」。隔一帧再收一次，最多三次。
         录制那三条（track / curve / spring）不归这条路管，不给它抢手机会。 */
      node._retry = !node._plain && !!stage && declarative && !node._clocks.length && !node._traced &&
        ['track', 'curve', 'spring'].indexOf(kind) < 0 && !stage.querySelector('.scrolly') ? 3 : 0;
      /* 有的演示要等用户先「碰」它才存在动画：hover / press / 指针跟身 / 键盘焦点。
         声明式那条路第一次当然什么都采不到，所以在这些事件上各挂一次性重采。 */
      if (stage && declarative && !node._plain && !node._clocks.length && !node._traced) {
        node._hoverRetry = true;
        ['pointerenter', 'pointerdown', 'focusin'].forEach(function (ev) {
          stage.addEventListener(ev, function onEngage() {
            if (!node._hoverRetry) return;
            node._hoverRetry = false;
            node._hudId = null; node._retry = 3;
            wire(node, id);
          }, { once: true });
        });
      }
    }
    /* 陈旧只发生在「录下来」的面板上：那是上一次演示跑出来的轨迹。声明式面板不用重建——
       曲线是同一份 @keyframes 的函数，重播改变不了它。重建走「拆掉再采集」时实测会把
       好面板弄没（刚重播的那几帧读不到值），所以改成就地重录。 */
    if (node._hud && node._hudId === id) {
      if (node._hud.reset) node._hud.reset();
      /* 关闭详情页时逐帧循环会停摆；重新打开只 reset 不点火，
         面板就会永远停在「探测中」——录制靠 paint 推进，没人叫它就不动了 */
      wake();
      return;
    }
    if (!on) return;
    if (!node._clocks.length && !node._traced) {
      if (node._retry > 0) {
        var tries = node._retry; node._retry = 0;
        requestAnimationFrame(function () {
          if (!on || node._hud || node._hudId !== id || !node.isConnected) return;
          var st = node.querySelector('.stage');
          node._clocks = st ? collectClocks(st) : [];
          if (node._clocks.length) wire(node, id);
          else if (tries > 1) { node._retry = tries - 1; wire(node, id); }
          else node.dataset.telemetry = 'n/a';
        });
        return;
      }
      node.dataset.telemetry = 'n/a'; return;
    }
    /* 采样要改写每条动画的 currentTime：中途抛异常会把舞台停在半路，
       所以整段兜住，宁可少一块仪表，也不能让详情页的滚动与焦点跟着丢 */
    var h = null;
    try {
      /* 一道面板只能有一块：已经有就重建前先拆干净，别往 .pg-visual 里叠第二块 */
      if (node.querySelector('.hud:not(.hud-lab)')) stripPanel(node);
      h = node._clocks.length ? build(node, term, node._clocks) : buildTraced(node, term);
    } catch (e) {
      stripPanel(node); node._retry = 0; node.dataset.telemetry = 'error';
      return;
    }
    if (!h) return;
    node._hud = h;
    node.classList.add('hud-on');
    wake();
    var v = node.querySelector('.pg-visual');
    if (v) v.style.setProperty('--hud-accent', readable(ACCENT[term.cat], v));
  }

  /* 只服务当前可见的那个详情节点，隐藏的（切术语留下的）一律不动 */
  /* HUD 只在详情页可见时逐帧刷新。原来即使用户停在首页也会永久占用一条
     requestAnimationFrame 循环，长时间打开页面会白白消耗 CPU/电量。 */
  var hudRunning = false;
  function hudLoop() {
    var n = on && document.querySelector('.term--detail.hud-on:not([hidden])');
    if (n && n._hud) {
      try { n._hud.paint(); } catch (e) { }
      requestAnimationFrame(hudLoop);
    } else {
      /* 没有面板可刷就彻底停摆，下次由 wake() 点火：
         原来这里是 setTimeout(loop, 250)，遥测关掉、首页闲置也会 4Hz 空转到天亮 */
      hudRunning = false;
    }
  }
  function wake() {
    if (hudRunning || !on) return;
    hudRunning = true;
    requestAnimationFrame(hudLoop);
  }

  var btn = document.getElementById('hud');
  function paintBtn() {
    if (!btn) return;
    /* 冷启动时 i18n.js 还没把 window.I18N 挂上，退回它先写入的 html[data-lang] */
    var lang = (window.I18N && window.I18N.lang) || document.documentElement.dataset.lang || 'zh';
    var en = lang === 'en';
    btn.textContent = en ? (on ? 'HUD on' : 'HUD off') : (on ? '遥测 开' : '遥测 关');
    btn.setAttribute('aria-pressed', String(on));
  }
  if (btn) btn.addEventListener('click', function () {
    on = !on;
    try { localStorage.setItem('hud', on ? '1' : '0'); } catch (e) {}
    paintBtn();
    [].slice.call(document.querySelectorAll('.term--detail')).forEach(function (n) {
      if (!on) return stripPanel(n);
      if (!n.hidden) wire(n, n.dataset.id);
    });
  });
  paintBtn();

  window.HUD = {
    wire: wire, strip: function (node) { if (node) strip(node); }, repaintBtn: paintBtn,
    /* 曲线的形状是 build 时一次画好的（48 个采样点），而轴标签每帧跟着 paint 走。
       所以凡是会改变形状的控制（只有「循环播放」：它同时改 iterations 和 direction，
       一次性斜坡会变成三角波，反过来三角波会退回半条）都必须重建，
       不然屏上留着上一世的形状、轴上写着这一世的时间。 */
    rebuild: function (node, id) {
      if (!node) return;
      /* _keep：面板已经在屏上了。重建是为了让曲线跟着新形状走，
         不是为了借机把它撤掉——用户刚拨完控件就被没收，比留着更糟。 */
      node._hudId = null; node._retry = 3; node._plain = false; node._keep = true;
      wire(node, id);
    },
    /* 录制面板的另一半：拨一下 k/c/m 之后，屏上还留着上一次跑出来的轨迹，
       讲的是已经不存在的运动。这里就地重录（不拆面板、不重新采集）。 */
    rerecord: function (node) {
      if (node && node._hud && node._hud.reset) node._hud.reset();
    }
  };
})();
