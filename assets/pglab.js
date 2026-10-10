/* ============================================================
   pglab.js —— 详情页右列的缓动实验台
   谁来这块位置：轨道（track）与曲线（curve）两类舞台。它们的主题就是那条
   缓动曲线本身，而实测只能把同一条缓动重录成一条斜坡——所以那边给的是
   「曲线 + 能改它的旋钮」，不是读数。
   一条铁律和遥测栏一样：屏上画的必须是舞台正在跑的那个函数。旋钮一拨，
   先把新函数交给舞台（stage._ease），再画它，绝不各画各的。
   ============================================================ */
(function () {
  'use strict';
  var EASE = window.EASE, LIST = window.EASE_LIST || [];
  var SCAN = 60;
  var W = 234, H = 118, PL = 30, PB = 16;
  var X = function (p) { return PL + p * (W - PL - 4); };
  /* 清单里 linear 写的是 CSS 关键字而不是贝塞尔（因为那才是该抄走的一行），
     不补这一条的话「匀速」这条在右列什么都不会有 */
  var KEYWORD = { linear: [0, 0, 1, 1] };

  /* 弹性族的参数式：a=1 p=0.3 时与 ease.js 的 easeOutElastic 是同一条曲线
     （实测最大偏差 2e-16），所以旋钮停在默认值时舞台不会有任何变化 */
  function elasticFn(a, p) {
    return function (t) {
      if (t === 0 || t === 1) return t;
      var s = a < 1 ? p / 4 : p / (2 * Math.PI) * Math.asin(1 / a);
      return a * Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
    };
  }
  var BEZ_ROWS = [{ k: '0', l: 'x1', min: 0, max: 1, step: .01 }, { k: '1', l: 'y1', min: -1, max: 2, step: .02 },
    { k: '2', l: 'x2', min: 0, max: 1, step: .01 }, { k: '3', l: 'y2', min: -1, max: 2, step: .02 }];
  /* 只有贝塞尔表达不了的曲线才自带参数轴；其余一律用四个控制点 */
  var OWN = {
    elastic: {
      make: function (v) { return elasticFn(v.a, v.p); },
      knobs: [{ k: 'a', l: '幅度', min: 0.6, max: 3, step: 0.05, v: 1 },
        { k: 'p', l: '周期', min: 0.15, max: 0.9, step: 0.01, v: 0.3 }],
      code: function (v) { return 'elastic(a=' + v.a.toFixed(2) + ', p=' + v.p.toFixed(2) + ')'; }
    }
  };

  function byFn(key) {
    for (var i = 0; i < LIST.length; i++) if (LIST[i].key === key) return LIST[i];
    return null;
  }
  function nums(css) {
    var m = /cubic-bezier\(([^)]+)\)/.exec(css || '');
    return m ? m[1].split(',').map(Number) : null;
  }
  /* 术语自己没进清单时（cubic-bezier 那条用的是 EASE.customBezier），退到它卡片上
     那段代码：那是用户真正会抄走的一行，不能有两个版本。
     进了清单但 CSS 表达不了的（bounce）一律不给贝塞尔——它的 code 里那条
     cubic-bezier 只是个近似，拿它当旋钮会把舞台改成一条不是弹跳的曲线。 */
  function specFor(term, stage) {
    var key = stage.dataset.fn, it = byFn(key), own = OWN[term.id];
    if (own) return { own: own, name: it ? it.label : term.id, note: it && it.note };
    var bez = it ? (KEYWORD[it.css] || nums(it.css)) : nums(term.code);
    if (bez && bez.length === 4) return { bez: bez, name: it ? it.label : 'custom', note: it && it.note };
    return it ? { name: it.label, note: it.note } : null;
  }

  function build(node, term, stage) {
    var visual = node.querySelector('.pg-visual');
    var spec = visual && specFor(term, stage);
    if (!spec) return false;
    var en = window.I18N && window.I18N.lang === 'en';
    var L = function (zh, eng) { return en ? eng : zh; };
    var base = EASE[stage.dataset.fn] || EASE.linear;
    var rows = spec.bez ? BEZ_ROWS : (spec.own ? spec.own.knobs : []);
    var st = spec.bez ? spec.bez.slice() : (function () {
      var o = {}; rows.forEach(function (r) { o[r.k] = r.v; }); return o;
    })();

    function fn() {
      if (spec.bez) return EASE.bezier(st[0], st[1], st[2], st[3]);
      if (spec.own) return spec.own.make(st);
      return base;
    }
    function codeStr() {
      if (spec.bez) return 'cubic-bezier(' + [st[0], st[1], st[2], st[3]].map(function (v) {
        return v.toFixed(2);
      }).join(', ') + ')';
      return spec.own ? spec.own.code(st) : '';
    }
    /* 两个标量把「这条缓动怎么用力」讲完：走完前 ¼ 行程要几成时间（慢起有多慢），
       以及最陡处是匀速的几倍（峰值速度）。都从屏上这条曲线算，不重述任何一条运动。 */
    function stats(f) {
      var q1 = 0, peak = 0, N = 240, prev = f(0);
      for (var i = 1; i <= N; i++) {
        var t = i / N, v = f(t), d = (v - prev) * N;
        prev = v;
        if (d > peak) peak = d;
        if (!q1 && v >= 0.25) q1 = t;
      }
      return { q1: q1, peak: peak };
    }

    /* curve 类的舞台本身就是一条曲线，右列再画一遍就是同一件事编码两次：
       那边只给旋钮。track 类的舞台是一条轨道，曲线得由右列来讲。 */
    var showChart = (term.demo || {}).kind !== 'curve';
    var chart = showChart ?
      '<svg class="hud-chart lab-chart" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<line class="hud-ax" x1="' + PL + '" y1="' + (H - PB) + '" x2="' + (W - 4) + '" y2="' + (H - PB) + '"/>' +
      '<line class="hud-ax" x1="' + PL + '" y1="' + (H - PB) + '" x2="' + PL + '" y2="6"/>' +
      '<line class="hud-ref" x1="' + X(0) + '" y1="' + (H - PB) + '" x2="' + X(1) + '" y2="6"/>' +
      '<g data-out="handles"></g>' +
      '<polyline class="hud-meas" data-out="curve" points=""/>' +
      '<line class="hud-cur" data-out="cur" x1="' + X(0) + '" y1="6" x2="' + X(0) + '" y2="' + (H - PB) + '"/>' +
      '<circle class="hud-cdot" data-out="dot" cx="' + X(0) + '" cy="' + (H - PB) + '" r="4.5"/>' +
      '<text x="' + X(0) + '" y="' + (H - 3) + '">0</text>' +
      '<text class="hud-xend" x="' + X(1) + '" y="' + (H - 3) + '" text-anchor="end">100%</text>' +
      '</svg>' +
      '<div class="hud-cap"><span>EASED × TIME</span><span>' + L('灰色虚线 = 匀速参照', 'dashed = linear') + '</span></div>'
      : '';

    var panel = document.createElement('div');
    panel.className = 'hud hud-lab';
    panel.innerHTML =
      '<div class="hud-head"><b><i class="hud-dot"></i>EASING LAB</b><span>' + L('实验台', 'LAB') + '</span></div>' +
      '<div class="hud-f hud-hi"><s data-out="lbl">' + spec.name.toUpperCase() + '</s>' +
      /* 这里不能用 <code>：i18n 的 refreshTerms 拿 $('code', 节点) 找的是代码块，
         面板排在它前面，一刷新就会把这段曲线表达式当成术语代码给覆盖掉 */
      (rows.length ? '<span class="lab-code" data-out="code"></span>' : '') + '</div>' +
      chart +
      (rows.length ? '<div class="lab-knobs" data-out="knobs"></div>' : '') +
      '<div class="hud-verdict"><span>' + L('前 ¼ 行程用时', 'reaches ¼ at') + ' <b data-out="q1">—</b></span>' +
      '<span class="hud-end">' + L('峰值', 'peak') + ' <b data-out="peak">—</b>' + L(' 匀速', ' linear') + '</span></div>' +
      /* 清单里那句注释是给首页实验室的挑选列表用的。能写成 cubic-bezier 的那几条，
         代码行本身就是答案，再补一句中文只是和下方的释义重复；
         只有 CSS 表达不了的（bounce / elastic），这句话才是信息。 */
      (spec.note && !spec.bez ? '<p class="lab-note" data-l10n="' + spec.note + '">' + spec.note + '</p>' : '');

    var BRK = '<svg viewBox="0 0 26 26"><path d="M25 1 L7 1 Q1 1 1 7 L1 25"/></svg>';
    panel.insertAdjacentHTML('beforeend',
      '<div class="hud-brk tl">' + BRK + '</div><div class="hud-brk tr">' + BRK + '</div>' +
      '<div class="hud-brk bl">' + BRK + '</div><div class="hud-brk br">' + BRK + '</div>');

    var out = {};
    ['lbl', 'code', 'curve', 'cur', 'dot', 'handles', 'knobs', 'q1', 'peak'].forEach(function (k) {
      out[k] = panel.querySelector('[data-out="' + k + '"]');
    });
    var svg = panel.querySelector('.lab-chart');

    if (rows.length) {
      /* 一行两个、标签浮在滑杆上方：264px 的列里横排「标签 + 滑杆 + 读数」会把滑杆压到 60px，
         而竖排堆四个又会把右列撑到 560，比舞台高出一大截（舞台被拉着一起长）。 */
      out.knobs.innerHTML = rows.map(function (r) {
        return '<label class="lab-k"><span>' + r.l + '<output>' + (+st[r.k]).toFixed(2) + '</output></span>' +
          '<input type="range" min="' + r.min + '" max="' + r.max + '" step="' + r.step + '" value="' + st[r.k] +
          '" data-i="' + r.k + '" aria-label="' + r.l + '" data-l10n="' + r.l + '" data-l10n-attr="aria-label">' +
          '</label>';
      }).join('');
      out.knobs.addEventListener('input', function (e) {
        var i = e.target.closest('input[data-i]'); if (!i) return;
        st[i.dataset.i] = +i.value;
        i.parentNode.querySelector('output').textContent = (+i.value).toFixed(2);
        if (spec.bez) out.lbl.textContent = 'CUSTOM';
        paint();
      });
    }

    function ymap(f) {
      var lo = 1, hi = 0;
      for (var i = 0; i <= SCAN; i++) { var v = f(i / SCAN); if (v < lo) lo = v; if (v > hi) hi = v; }
      var pad = (hi - lo || 1) * 0.14, y0 = lo - pad, y1 = hi + pad;
      return function (v) { return H - PB - (v - y0) / (y1 - y0) * (H - PB - 8); };
    }
    function paint() {
      var f = fn(), Y = ymap(f);
      /* 先交函数，再画：舞台跑的必须就是这块图 */
      stage._ease = f;
      if (showChart) {
        var pts = [];
        for (var i = 0; i <= SCAN; i++) pts.push(X(i / SCAN).toFixed(1) + ',' + Y(f(i / SCAN)).toFixed(1));
        out.curve.setAttribute('points', pts.join(' '));
        svg._Y = Y;
        if (spec.bez) {
          out.handles.innerHTML =
            '<line class="lab-hd" x1="' + X(0) + '" y1="' + Y(0) + '" x2="' + X(st[0]) + '" y2="' + Y(st[1]) + '"/>' +
            '<line class="lab-hd" x1="' + X(1) + '" y1="' + Y(1) + '" x2="' + X(st[2]) + '" y2="' + Y(st[3]) + '"/>' +
            '<circle class="lab-hc" cx="' + X(st[0]) + '" cy="' + Y(st[1]) + '" r="4"/>' +
            '<circle class="lab-hc" cx="' + X(st[2]) + '" cy="' + Y(st[3]) + '" r="4"/>';
        } else out.handles.innerHTML = '';
      }
      if (out.code) out.code.textContent = codeStr();
      var s = stats(f);
      out.q1.textContent = s.q1 ? Math.round(s.q1 * 100) + '%' : L('不到 ¼', '<25%');
      out.peak.textContent = s.peak.toFixed(1) + '×';
      /* 舞台上的那条曲线（curve 类）画的就是同一个函数，换函数要让它重画 */
      if (stage._resize) stage._resize();
    }
    paint();
    visual.appendChild(panel);
    node.classList.add('lab-on');
    /* 面板是 i18n 那次刷新之后才建出来的，注释条得自己补一次 */
    if (window.I18N) window.I18N.refreshTerms(node);
    return { panel: panel, svg: svg, fn: fn };
  }

  /* ── 挂载与逐帧 ─────────────────────────────────────
     游标读的是舞台自己那一圈时钟（app.js 的 mountTrack / mountCurve 每帧写
     stage._phase），这里不另起一条时间轴，慢放与时长滑块都自动跟得上。 */
  var cur = null;
  function strip(node) {
    if (!node) return;
    var p = node.querySelector('.hud-lab');
    if (p) p.remove();
    node.classList.remove('lab-on');
    var stage = node.querySelector('.stage');
    if (stage) { stage._ease = null; if (stage._resize) stage._resize(); }
    if (cur && cur.node === node) cur = null;
  }
  function wire(node, id) {
    if (!node) return;
    var term = (window.TERMS || []).filter(function (t) { return t.id === id; })[0];
    var stage = node && node.querySelector('.stage');
    var kind = term && (term.demo || {}).kind;
    if (!stage || ['track', 'curve'].indexOf(kind) < 0) { strip(node); return; }
    if (cur && cur.id === id && cur.node === node) { wake(); return; }
    if (cur) strip(cur.node);
    var built = build(node, term, stage);
    if (!built) { strip(node); return; }
    cur = { id: id, node: node, built: built, stage: stage };
    wake();
  }

  var running = false;
  function loop() {
    var page = document.getElementById('page');
    /* 只停摆不清 cur：详情页关了再开还是同一条术语，重建会把面板叠成两块 */
    if (!cur || (page && page.hidden) || !cur.node.isConnected) { running = false; return; }
    var svg = cur.built.svg, ph = cur.stage._phase;
    if (svg && svg._Y && ph != null) {
      var f = cur.built.fn(), x = X(ph), dot = svg.querySelector('[data-out="dot"]'),
        line = svg.querySelector('[data-out="cur"]');
      dot.setAttribute('cx', x); dot.setAttribute('cy', svg._Y(f(ph)));
      line.setAttribute('x1', x); line.setAttribute('x2', x);
    }
    requestAnimationFrame(loop);
  }
  function wake() {
    /* 没有图就没有逐帧要画（curve 类的游标在舞台自己的画布上），别空转一条 rAF */
    if (running || !cur || !cur.built.svg) return;
    running = true;
    requestAnimationFrame(loop);
  }

  window.PGLAB = { wire: wire, strip: strip };
})();
