/* ============================================================
   lab.js —— 缓动实验室：拖控制点、比时长、导出多平台代码示例
   ============================================================ */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.prototype.slice.call(document.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const q1 = (s) => String(s).replace(/"/g, '&quot;');
  const EASE = window.EASE, LIST = window.EASE_LIST;
  const lab = $('#lab');

  const state = { pts: [0.16, 1, 0.3, 1], fn: EASE.easeOutExpo, dur: 1200, dist: 640, prop: 'x', label: 'expo-out', css: 'cubic-bezier(0.16, 1, 0.3, 1)', key: 'easeOutExpo', draggable: true };

  /* ---------- 曲线画布（含可拖控制点） ---------- */
  const cv = $('#lab-curve'), g = cv.getContext('2d');
  let W = 0, H = 0, pad = 26, dragging = -1;

  /* 主题色缓存：draw 每帧都跑，getComputedStyle 每帧读一次太浪费；
     data-theme 变了才重新取 */
  let themeSeen = '', colLine = '', colAcc = '', colAcc2 = '#7aa2ff', colBg = '#0f1116';
  function themeCols() {
    const th = document.documentElement.dataset.theme || 'dark';
    if (th === themeSeen) return;
    themeSeen = th;
    const cs = getComputedStyle(document.documentElement);
    colLine = cs.getPropertyValue('--line');
    colAcc = cs.getPropertyValue('--accent');
    colAcc2 = cs.getPropertyValue('--accent-2') || '#7aa2ff';
    colBg = cs.getPropertyValue('--bg');
  }
  function size() {
    const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const px = x => pad + x * (W - pad * 2);
  const py = y => (H - pad) - y * (H - pad * 2);
  const ux = X => (X - pad) / (W - pad * 2);
  const uy = Y => ((H - pad) - Y) / (H - pad * 2);

  function draw() {
    if (!W || !H) return;
    themeCols();
    g.clearRect(0, 0, W, H);
    g.strokeStyle = colLine; g.lineWidth = 1;
    g.beginPath();
    for (let i = 0; i <= 4; i++) {
      const x = px(i / 4), y = py(i / 4);
      g.moveTo(pad, y); g.lineTo(W - pad, y);
      if (i) { g.moveTo(x, pad - 10); g.lineTo(x, H - pad); }
    }
    g.stroke();
    /* 参考对角线（linear） */
    g.strokeStyle = 'rgba(140,152,175,.45)'; g.setLineDash([3, 4]);
    g.beginPath(); g.moveTo(px(0), py(0)); g.lineTo(px(1), py(1)); g.stroke(); g.setLineDash([]);
    /* 主曲线 */
    g.strokeStyle = colAcc; g.lineWidth = 2.6; g.lineJoin = 'round';
    g.beginPath();
    for (let i = 0; i <= 140; i++) {
      const t = i / 140, v = state.fn(t);
      if (i === 0) g.moveTo(px(t), py(v)); else g.lineTo(px(t), py(v));
    }
    g.stroke();
    if (state.draggable) {
      const p = state.pts;
      g.strokeStyle = 'rgba(214,255,63,.45)'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(px(0), py(0)); g.lineTo(px(p[0]), py(p[1]));
      g.moveTo(px(1), py(1)); g.lineTo(px(p[2]), py(p[3])); g.stroke();
      [[p[0], p[1]], [p[2], p[3]]].forEach(function (h, i) {
        g.fillStyle = colBg; g.strokeStyle = colAcc; g.lineWidth = 2;
        g.beginPath(); g.arc(px(h[0]), py(h[1]), 7, 0, Math.PI * 2); g.fill(); g.stroke();
        g.fillStyle = colAcc;
        g.beginPath(); g.arc(px(h[0]), py(h[1]), 2.4, 0, Math.PI * 2); g.fill();
      });
    }
    /* 播放进度游标 */
    if (marker._t != null) {
      const t = marker._t, v = state.fn(t);
      g.fillStyle = colAcc2;
      g.beginPath(); g.arc(px(t), py(v), 4.6, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(122,162,255,.35)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(px(t), py(0)); g.lineTo(px(t), py(v)); g.stroke();
    }
  }

  /* ---------- 预览驱动（rAF 采样，任何曲线都能跑） ---------- */
  const live = $('#pv-live'), ref = $('#pv-ref'), marker = { _t: null };
  const pvBox = $('.pv');
  const distInput = $('#lab-dist');
  let t0 = performance.now();
  function syncDist() { if (pvBox) pvBox.style.setProperty('--dist', state.dist + 'px'); }
  /* 行程按预览框实际尺寸来定：横向看宽度、纵向看高度，否则小球会跑出框外 */
  let distTouched = false;
  function trackMax() {
    if (!pvBox) return 200;
    if (state.prop === 'y') return Math.max(40, (pvBox.clientHeight || 96) - 48);
    return Math.max(80, (pvBox.clientWidth || 420) - 70);
  }
  function fitTrack(initial) {
    if (!pvBox || !distInput) return;
    const max = Math.round(trackMax());
    const row = distInput.closest('.lab-row');
    /* 缩放 / 旋转没有“距离”可言，直接收掉这一行 */
    if (row) row.hidden = (state.prop === 'scale' || state.prop === 'rotate');
    distInput.max = max;
    distInput.min = Math.max(12, Math.round(max * 0.06));
    distInput.step = 1;   /* 步长 4 会把铺满的默认值吸到下一格，导致 state 与滑块不一致 */
    /* 默认铺满行程：这样才看得出曲线中段的速度差，缩在小格子里等于没演示 */
    if (!distTouched || state.dist > max || state.dist < +distInput.min) state.dist = max;
    distInput.value = state.dist;
    const lab = $('#lab-dist-v'); if (lab) lab.textContent = state.dist + 'px';
    syncDist();
    if (!initial) renderCode();
  }
  function syncProp() { if (pvBox) pvBox.dataset.prop = state.prop; }
  syncProp();
  syncDist();

  function setTransform(el, v) {
    const d = v * state.dist;
    if (state.prop === 'x') el.style.transform = 'translateX(' + d.toFixed(2) + 'px)';
    else if (state.prop === 'y') el.style.transform = 'translateY(' + d.toFixed(2) + 'px)';
    else if (state.prop === 'scale') el.style.transform = 'scale(' + (0.55 + v * 0.55).toFixed(3) + ')';
    else if (state.prop === 'rotate') el.style.transform = 'rotate(' + (v * 180 - 90).toFixed(2) + 'deg)';
    else el.style.transform = 'translateX(' + d.toFixed(2) + 'px) rotate(' + (v * 12 - 6).toFixed(2) + 'deg)';
  }

  let parked = false, inView = true;
  function frame(now) {
    if (!lab.open) { requestAnimationFrame(frame); return; }
    /* 顶栏「动效 关」对实验室同样有效：小球停在终点，只留静态曲线 */
    if (!window.ENGINE.motionOn()) {
      if (!parked) {
        parked = true;
        setTransform(live, 1); setTransform(ref, 1);
        live.style.opacity = ref.style.opacity = '1';
        marker._t = null; draw();
      }
      requestAnimationFrame(frame);
      return;
    }
    parked = false;
    /* 离屏不画：滚出视口后 60fps 全量重绘网格 + 曲线纯属空转 */
    if (!inView) { requestAnimationFrame(frame); return; }
    let p = (now - t0) / state.dur;
    if (p > 1.7) { t0 = now; p = 0; }
    const q = clamp(p, 0, 1);
    setTransform(live, state.fn(q));
    setTransform(ref, q);
    live.style.opacity = ref.style.opacity = p > 1.45 ? '.4' : '1';
    marker._t = q;
    draw();
    requestAnimationFrame(frame);
  }

  /* ---------- 代码导出 ---------- */
  const labT = function (k) { return window.I18N ? window.I18N.t(k) : ''; };
  /* 函数曲线（无法用 cubic-bezier 表达的）在 GSAP 里有现成的同名 ease */
  const GSAP_NAME = {
    linear: 'none', easeIn: 'power3.in', easeOut: 'power3.out', easeInOut: 'power3.inOut',
    easeInSine: 'sine.in', easeOutSine: 'sine.out', easeInOutSine: 'sine.inOut',
    easeOutQuad: 'power1.out', easeOutQuart: 'power4.out', easeOutQuint: 'power5.out',
    easeInExpo: 'expo.in', easeOutExpo: 'expo.out', easeInOutExpo: 'expo.inOut',
    easeOutBack: 'back.out(1.7)', easeInBack: 'back.in(1.7)', easeInOutBack: 'back.inOut(1.7)',
    easeOutElastic: 'elastic.out(1, 0.4)', easeInElastic: 'elastic.in(1, 0.4)',
    easeOutBounce: 'bounce.out', easeInBounce: 'bounce.in', easeOutCirc: 'circ.out',
    emphasized: 'power4.out', material: 'power2.inOut', snappy: 'power4.inOut', steps6: 'steps(6)'
  };
  function cssStr() {
    if (/^(linear|cubic-bezier\(|steps\()/.test(state.css)) return state.css;
    /* Preserve non-Bézier curves as a sampled CSS easing instead of inserting a
       comment in the easing slot (which made the generated declaration invalid). */
    const samples = [];
    for (let i = 0; i <= 32; i++) samples.push((+state.fn(i / 32).toFixed(4)) + (i === 0 || i === 32 ? '' : ' ' + (i / 32 * 100).toFixed(3) + '%'));
    return 'linear(' + samples.join(', ') + ')';
  }
  function snippets() {
    const e = cssStr(), d = state.dur + 'ms', dist = state.dist + 'px';
    const from = { x: 'none', y: 'none', scale: 'scale(0.55)', rotate: 'rotate(-90deg)', combo: 'none' }[state.prop];
    const move = { x: 'translateX(' + dist + ')', y: 'translateY(' + dist + ')', scale: 'scale(1.1)', rotate: 'rotate(90deg)', combo: 'translateX(' + dist + ') rotate(6deg)' }[state.prop];
    const prop = { x: 'x: ' + state.dist, y: 'y: ' + state.dist, scale: 'scale: 1.1', rotate: 'rotation: 90', combo: 'x: ' + state.dist + ', rotation: 6' }[state.prop];
    const fProp = { x: 'x: ' + state.dist, y: 'y: ' + state.dist, scale: 'scale: 1.1', rotate: 'rotate: 90', combo: 'x: ' + state.dist + ', rotate: 6' }[state.prop];
    /* 之前不可拖曲线在这里会拼出「easing 里塞注释」的非法代码、GSAP 恒为 expo.out、
       Framer 拿着上一次可拖曲线的残留控制点 —— 按曲线类型分开导出 */
    const gsapEase = state.draggable
      ? 'CustomEase.create("lab", "M0,0 C' + state.pts.map(v => (+v).toFixed(3)).join(',') + ' 1,1") /* 先注册 GSAP CustomEase 插件 */'
      : '"' + (GSAP_NAME[state.key] || 'power2.out') + '"';
    const waapiEase = 'easing: "' + e + '", ';
    const waapiNote = state.draggable ? '' : '\n// CSS linear() uses a 33-point approximation of ' + state.label + '.';
    const framerEase = state.draggable ? '[' + state.pts.map(v => (+v).toFixed(3)).join(', ') + ']' : '"' + (state.key === 'linear' ? 'linear' : state.key === 'easeIn' ? 'easeIn' : state.key === 'easeInOut' ? 'easeInOut' : 'easeOut') + '"';
    const framerNote = state.draggable ? '' : '\n// Framer Motion uses its nearest named easing for ' + state.label + '; it may not match the preview exactly.';
    const twEase = state.draggable
      ? 'ease-[cubic-bezier(' + state.pts.map(v => (+v).toFixed(3)).join(',') + ')]'
      : state.key === 'linear' ? 'ease-linear'
        : /^steps\(/.test(state.css) ? 'ease-[' + state.css + ']'
          : (state.key === 'easeIn' ? 'ease-in' : state.key === 'easeInOut' ? 'ease-in-out' : 'ease-out');
    const swiftCurve = state.key === 'linear' ? 'curveLinear' : state.key === 'easeIn' ? 'curveEaseIn' : state.key === 'easeInOut' ? 'curveEaseInOut' : 'curveEaseOut';
    return {
      'CSS transition': '.el {\n  transform: ' + from + ';\n  transition: transform ' + d + ' ' + e + ';\n}\n.el.is-in { transform: ' + move + '; }',
      'CSS @keyframes': '@keyframes go {\n  to { transform: ' + move + '; }\n}\n.el {\n  animation: go ' + d + ' ' + e + ' both;\n}',
      'Web Animations API': 'el.animate(\n  [{ transform: "none" }, { transform: "' + move + '" }],\n  { duration: ' + state.dur + ', ' + waapiEase + 'fill: "both" }\n);' + waapiNote,
      'GSAP': 'gsap.to(".el", {\n  ' + prop + ',\n  duration: ' + (state.dur / 1000).toFixed(2) + ',\n  ease: ' + gsapEase + '\n});',
      'Framer Motion': '<motion.div\n  animate={{ ' + fProp + ' }}\n  transition={{ duration: ' + (state.dur / 1000).toFixed(2) + ', ease: ' + framerEase + ' }} />' + framerNote,
      'Swift / iOS': 'view.transform = ' + (state.prop === 'scale' ? '.identity.scaledBy(x: 0.55, y: 0.55)' : state.prop === 'rotate' ? '.identity.rotated(by: -.pi / 2)' : state.prop === 'combo' ? '.identity.rotated(by: -.pi / 30)' : '.identity') + '\nUIView.animate(withDuration: ' + (state.dur / 1000).toFixed(2) + ',\n  delay: 0,\n  options: [.' + swiftCurve + '], animations: {\n    view.transform = ' + (state.prop === 'rotate' ? '.identity.rotated(by: .pi / 2)' : state.prop === 'scale' ? '.identity.scaledBy(x: 1.1, y: 1.1)' : state.prop === 'y' ? '.identity.translatedBy(x: 0, y: ' + state.dist + ')' : state.prop === 'combo' ? '.identity.translatedBy(x: ' + state.dist + ', y: 0).rotated(by: .pi / 30)' : '.identity.translatedBy(x: ' + state.dist + ', y: 0)') + '\n  })' + (state.key === 'linear' ? '' : '\n// UIKit uses a named curve; this approximates the selected Bezier or sampled easing.'),
      'Compose': 'val spec = tween<Float>(\n  durationMillis = ' + state.dur + ',\n  easing = ' + (state.draggable ? 'CubicBezierEasing(' + state.pts.map(v => (+v).toFixed(2) + 'f').join(', ') + ')' : state.key === 'linear' ? 'LinearEasing' : state.key === 'easeIn' ? 'FastOutLinearInEasing' : state.key === 'easeInOut' ? 'FastOutSlowInEasing' : 'LinearOutSlowInEasing') + '\n)\nvar visible by remember { mutableStateOf(false) }\nLaunchedEffect(Unit) { visible = true }\nval progress by animateFloatAsState(targetValue = if (visible) 1f else 0f, animationSpec = spec, label = "motion")\nModifier.graphicsLayer {\n  ' + (state.prop === 'y' ? 'translationY = progress * ' + state.dist + 'f' : state.prop === 'scale' ? 'scaleX = 0.55f + progress * 0.55f\n  scaleY = 0.55f + progress * 0.55f' : state.prop === 'rotate' ? 'rotationZ = -90f + progress * 180f' : state.prop === 'combo' ? 'translationX = progress * ' + state.dist + 'f\n  rotationZ = -6f + progress * 12f' : 'translationX = progress * ' + state.dist + 'f') + '\n}' + (state.draggable ? '' : '\n// This uses the nearest built-in easing; the custom function may differ from the preview.'),
      'Tailwind': '<!-- Start: initial state; toggle to the end state to trigger transition -->\nclass="transition-[transform,opacity] duration-[' + state.dur + 'ms] ' + twEase + ' ' + (state.prop === 'y' ? 'translate-y-0' : state.prop === 'scale' ? 'scale-[0.55]' : state.prop === 'rotate' ? 'rotate-[-90deg]' : 'translate-x-0') + (state.prop === 'combo' ? ' rotate-[-6deg]' : '') + '"\n<!-- End -->\nclass="transition-[transform,opacity] duration-[' + state.dur + 'ms] ' + twEase + ' ' + (state.prop === 'y' ? 'translate-y-[' + dist + ']' : state.prop === 'scale' ? 'scale-[1.1]' : state.prop === 'rotate' ? 'rotate-[90deg]' : 'translate-x-[' + dist + ']') + (state.prop === 'combo' ? ' rotate-[6deg]' : '') + '"' + (state.key === 'linear' || state.draggable || /^steps\(/.test(state.css) ? '' : '\n<!-- Tailwind uses the nearest named easing; it does not reproduce the preview curve. -->')
    };
  }
  let tab = 'CSS transition';
  function renderCode() {
    const s = snippets();
    $('#lab-tabs').innerHTML = Object.keys(s).map(k =>
      '<button type="button" class="ltab' + (k === tab ? ' on' : '') + '" data-tab="' + k + '">' + k + '</button>').join('');
    $('#lab-code').textContent = s[tab];
    const nm = $('#lab-ease-name'); if (nm) nm.textContent = state.label;
    $('#lab-ease-css').textContent = cssStr();
  }

  /* ---------- 选择缓动 ---------- */
  function pick(item) {
    const fn = EASE[item.key] || EASE.linear;
    state.fn = fn; state.label = item.label; state.css = item.css; state.key = item.key;
    state.draggable = /^cubic-bezier/.test(item.css);
    if (state.draggable) {
      const m = item.css.match(/cubic-bezier\(([^)]+)\)/);
      if (m) state.pts = m[1].split(',').map(Number);
    }
    syncSliders(); renderCode(); draw();
  }
  function syncSliders() {
    $('#lab-dur').value = state.dur;
    $('#lab-dur-v').textContent = state.dur + 'ms';
    $('#lab-dist').value = state.dist;
    $('#lab-dist-v').textContent = state.dist + 'px';
    const p = state.pts;
    [0, 1, 2, 3].forEach(i => { const el = $('#pt-' + i); if (el) { el.value = p[i]; $('#ptv-' + i).textContent = p[i].toFixed(2); } });
    $('#lab-handles').textContent = state.draggable ? labT('labDrag') : labT('labNoDrag');
  }
  function fromPoints() {
    state.css = 'cubic-bezier(' + state.pts.map(v => (+v).toFixed(2)).join(', ') + ')';
    state.fn = EASE.bezier(state.pts[0], state.pts[1], state.pts[2], state.pts[3]);
    state.label = 'custom'; state.draggable = true;
    renderCode(); draw();
  }

  /* ---------- 启动 ---------- */
  function boot() {
    /* 初始选中按 key 匹配：硬编码下标在清单插一项后就会静默错位 */
    $('#lab-list').innerHTML = LIST.map(function (it) {
      return '<button type="button" class="ease-p' + (it.key === state.key ? ' on' : '') + '" data-k="' + it.key + '"><b>' + it.label + '</b>' +
        '<span data-l10n="' + q1(it.note) + '">' + it.note + '</span><canvas class="ecurve" width="44" height="30"></canvas></button>';
    }).join('');
    size(); draw(); renderCode(); syncSliders(); fitTrack(true);

    /* 迷你曲线 */
    function mini() {
      $$('.ease-p').forEach(function (btn, i) {
        const c = btn.querySelector('.ecurve'), it = LIST[i];
        const gg = c.getContext('2d'), dpr = window.devicePixelRatio || 1;
        c.width = 44 * dpr; c.height = 30 * dpr; gg.setTransform(dpr, 0, 0, dpr, 0, 0);
        let lo = 1, hi = 0;
        for (let k = 0; k <= 20; k++) { const v = it.fn(k / 20); lo = Math.min(lo, v); hi = Math.max(hi, v); }
        gg.strokeStyle = 'rgba(150,160,180,.5)'; gg.lineWidth = 1.4; gg.beginPath();
        for (let k = 0; k <= 30; k++) {
          const t = k / 30, v = it.fn(t);
          const X = 3 + t * 38, Y = 27 - (v - lo) / ((hi - lo) || 1) * 24;
          k ? gg.lineTo(X, Y) : gg.moveTo(X, Y);
        }
        gg.stroke();
      });
    }
    mini();

    $('#lab-list').addEventListener('click', function (e) {
      const b = e.target.closest('.ease-p'); if (!b) return;
      $$('.ease-p').forEach(x => x.classList.remove('on')); b.classList.add('on');
      pick(LIST.find(x => x.key === b.dataset.k));
    });
    $('#lab-tabs').addEventListener('click', function (e) {
      const b = e.target.closest('.ltab'); if (!b) return;
      tab = b.dataset.tab; renderCode();
    });
    $('#lab-copy').addEventListener('click', function () {
      copySnippet(snippets()[tab]);
    });
    /* 复制要有真假：clipboard API 被拒时降级 execCommand，都失败就承认失败 */
    function copySnippet(str) {
      const btn = $('#lab-copy'), okText = labT('labCopied') || '已复制', idle = labT('labCopy') || '复制代码';
      const fail = function () { btn.textContent = '✕ 复制失败'; setTimeout(() => btn.textContent = idle, 1300); };
      const done = function () { btn.textContent = okText; setTimeout(() => btn.textContent = idle, 1300); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(str).then(done, function () { legacy(str) ? done() : fail(); });
      } else legacy(str) ? done() : fail();
      function legacy(s) {
        const ta = document.createElement('textarea');
        ta.value = s; ta.style.cssText = 'position:fixed;top:-999px;opacity:0';
        document.body.appendChild(ta); ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (e) {}
        ta.remove();
        return ok;
      }
    }
    $('#lab-dur').addEventListener('input', function () {
      state.dur = +this.value; $('#lab-dur-v').textContent = state.dur + 'ms'; renderCode(); t0 = performance.now();
    });
    $('#lab-dist').addEventListener('input', function () {
      distTouched = true;
      state.dist = +this.value; $('#lab-dist-v').textContent = state.dist + 'px'; renderCode(); syncDist();
    });
    $('#lab-props').addEventListener('click', function (e) {
      const b = e.target.closest('.pt'); if (!b) return;
      $$('.pt').forEach(x => x.classList.remove('on')); b.classList.add('on');
      state.prop = b.dataset.p; syncProp();
      distTouched = false;   /* 换了轴向，行程要按新轴向重新铺满 */
      fitTrack(true);
      t0 = performance.now(); renderCode();
    });
    [0, 1, 2, 3].forEach(function (i) {
      const el = $('#pt-' + i);
      if (!el) return;
      el.addEventListener('input', function () {
        state.pts[i] = +this.value; $('#ptv-' + i).textContent = (+this.value).toFixed(2);
        $$('.ease-p').forEach(x => x.classList.remove('on'));
        fromPoints();
      });
    });
    /* 画布拖拽控制点 */
    function hit(X, Y) {
      const p = state.pts;
      return [[p[0], p[1]], [p[2], p[3]]].findIndex(h => Math.hypot(px(h[0]) - X, py(h[1]) - Y) < 14);
    }
    cv.addEventListener('pointerdown', function (e) {
      if (!state.draggable) return;
      const r = cv.getBoundingClientRect();
      dragging = hit(e.clientX - r.left, e.clientY - r.top);
      if (dragging >= 0) cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointermove', function (e) {
      if (dragging < 0 || !state.draggable) return;
      const r = cv.getBoundingClientRect(), X = e.clientX - r.left, Y = e.clientY - r.top;
      const i = dragging * 2;
      state.pts[i] = clamp(ux(X), 0, 1);
      /* y 范围与滑杆一致（-1~2），不 clamp 的话滑杆被浏览器收进去而 state 没有，UI 失同步 */
      state.pts[i + 1] = clamp(+uy(Y).toFixed(2), -1, 2);
      $$('.ease-p').forEach(x => x.classList.remove('on'));
      syncSliders(); fromPoints();
    });
    ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => dragging = -1));

    /* 离屏时暂停逐帧重绘（inView 由这里维护），回画面时重置起点避免跳帧 */
    const io = new IntersectionObserver(es => es.forEach(en => {
      inView = en.isIntersecting;
      if (inView) t0 = performance.now();
    }));
    io.observe($('#pv-live'));
    requestAnimationFrame(frame);
    // 收起时尺寸为零；展开后按实际列宽重建画布与行程。
    function refreshLayout() {
      if (!lab.open) return;
      size(); fitTrack(false); draw(); t0 = performance.now();
    }
    lab.addEventListener('toggle', refreshLayout);
    new ResizeObserver(refreshLayout).observe(pvBox);
    window.addEventListener('resize', refreshLayout);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
