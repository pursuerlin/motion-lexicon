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
  var NS = 84, NM = 48;   /* 单时钟 / 多时钟每条的采样点数 */
  /* 隐私模式会阻断 localStorage，抛异常会让整个 HUD IIFE 当场挂掉 */
  var on = true;
  try { on = localStorage.getItem('hud') !== '0'; } catch (e) {}

  function m0(t) { return (!t || t === 'none') ? 'matrix(1,0,0,1,0,0)' : t; }
  function scalar(el) {
    var cs = getComputedStyle(el), m = new DOMMatrixReadOnly(m0(cs.transform)), o = parseFloat(cs.opacity);
    return { sc: m.a, tx: m.e, ty: m.f, op: isNaN(o) ? 1 : o };
  }
  function px(v) { return (v > 0.5 ? '+' : '') + v.toFixed(0) + 'px'; }

  /* 先变换后不透明度：不透明度天然 0→1，按绝对差排会把"缩放"这种主角挤掉 */
  function channel(f, t) {
    var cand = [
      ['sc', f.sc, t.sc, 'SCALE', function (v) { return '×' + v.toFixed(3); }, function (v) { return v.toFixed(2); }, Math.abs(t.sc - f.sc)],
      ['tx', f.tx, t.tx, 'TRANSLATE X', px, function (v) { return v.toFixed(0); }, Math.abs(t.tx - f.tx) / 100],
      ['ty', f.ty, t.ty, 'TRANSLATE Y', px, function (v) { return v.toFixed(0); }, Math.abs(t.ty - f.ty) / 100]];
    var live = cand.filter(function (c) { return c[6] > 0.002; }).sort(function (p, q) { return q[6] - p[6]; });
    var p = live[0] || ['op', f.op, t.op, 'OPACITY', function (v) { return (v * 100).toFixed(0) + '%'; }, function (v) { return v.toFixed(2); }, 1];
    return { key: p[0], from: p[1], to: p[2], label: p[3], fmt: p[4], axis: p[5], swing: Math.abs(p[2] - p[1]) };
  }

  function timing(a) {
    if (!a || !a.effect) return null;
    var T = a.effect.getComputedTiming();
    /* 无限循环的 activeDuration 是 Infinity，直接当横轴会得到 NaN：
       这类术语画"一次循环"的形状，游标走相位（含 alternate 的折返） */
    var INF = T.iterations === Infinity || !isFinite(T.activeDuration);
    var dur = INF ? T.duration : T.activeDuration;
    if (!isFinite(dur) || dur <= 0) return null;
    return { INF: INF, dur: dur, dir: String(T.direction) };
  }
  function phaseOf(ct, T) {
    if (!T.INF) return Math.max(0, Math.min(1, ct / T.dur));
    return (ct - Math.floor(ct / T.dur) * T.dur) / T.dur;
  }

  /* 舞台里的"时钟"= 一种 (关键帧, 时长, 缓动) 签名。
     currentTime 一旦是数字就不能设回 null（浏览器拒绝 resolved→unresolved）。 */
  function collectClocks(stage) {
    var seen = {}, out = [];
    stage.getAnimations({ subtree: true }).forEach(function (a) {
      var host = a.effect && a.effect.target;
      if (!host || host === stage || !stage.contains(host)) return;
      var T = timing(a); if (!T) return;
      var orig = a.currentTime;
      a.currentTime = 0; var f = scalar(host);
      a.currentTime = T.dur; var t = scalar(host);
      a.currentTime = orig === null ? 0 : orig;
      var ch = channel(f, t);
      if (ch.key === 'op' ? ch.swing < 0.02 : ch.swing < (ch.key === 'sc' ? 0.002 : 0.2)) return;
      var sig = (a.animationName || 'x') + '|' + Math.round(T.dur) + '|' + getComputedStyle(host).animationTimingFunction;
      if (seen[sig]) return;
      seen[sig] = 1;
      var sub = host.closest ? host.closest('.sub') : null;
      var tag = sub ? (sub.querySelector('.tag') || {}).textContent : '';
      out.push({ host: host, chan: ch, name: String(tag || '').split('·')[0].trim(), ease: getComputedStyle(host).animationTimingFunction });
    });
    /* 纯淡入淡出是"存在"不是"运动"：同一舞台里有位移/缩放时，它不单独成一条曲线。
       不对称缓动那条实测会多出一条 200ms 的标签淡入，把两条时钟的对照搅成三条 */
    var moving = out.filter(function (c) { return c.chan.key !== 'op'; });
    return (moving.length ? moving : out).slice(0, 4);
  }

  function build(node, term, clocks) {
    var visual = node.querySelector('.pg-visual'), stage = node.querySelector('.stage');
    if (!visual || !stage || !clocks.length) return null;
    var multi = clocks.length > 1;
    var C = clocks[0], chan = C.chan;
    function read() { return scalar(C.host)[chan.key]; }

    /* 曲线按"相位"存而不是按毫秒存：慢放从 1× 拨到 ¼× 时形状不变，只换轴标签。
       多时钟时横轴换成共享时间轴（自己的时长 ÷ 最长时长）——"退场只占一半宽"
       就是不对称本身，各画各的 0→1 会把它抹平成两条一样长的线 */
    var maxDur = 0;
    clocks.forEach(function (c) { var x = c.host.getAnimations()[0], TX = x && timing(x); if (TX && TX.dur > maxDur) maxDur = TX.dur; });
    clocks.forEach(function (c, ci) {
      var a = c.host.getAnimations()[0]; if (!a) return;
      var T = timing(a); c.T = T;
      var n = multi ? NM : NS, was = a.currentTime || 0, st = a.playState;
      c.pts = [];
      for (var i = 0; i <= n; i++) {
        var u = i / n; a.currentTime = u * T.dur;
        var v = scalar(c.host)[c.chan.key];
        var q = c.chan.to === c.chan.from ? u : (v - c.chan.from) / (c.chan.to - c.chan.from);
        c.pts.push([multi && maxDur ? u * T.dur / maxDur : u, v, q]);
      }
      a.currentTime = was;
      if (st === 'paused') a.pause(); else a.play();
    });
    clocks = clocks.filter(function (c) { return c.pts && c.pts.length; });
    if (!clocks.length) return null;
    multi = clocks.length > 1; C = clocks[0]; chan = C.chan;
    var T = C.T;

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

    /* 只有超出两端的那一段值得画阴影：往上叫过冲，往下叫预备（起手反向） */
    var hiE = Math.max(chan.from, chan.to), loE = Math.min(chan.from, chan.to);
    var swing = Math.abs(chan.to - chan.from) || 1;
    var zone = multi ? null : ((hi - hiE) >= (loE - lo)
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
    var durs = clocks.map(function (c) { return c.T.dur; });
    var ratio = multi ? Math.max.apply(null, durs) / Math.min.apply(null, durs) : 0;

    var panel = document.createElement('div');
    panel.className = 'hud';
    panel.innerHTML =
      '<div class="hud-head"><b><i class="hud-dot"></i>LIVE READOUT</b><span>' + L('实测', 'MEASURED') + '</span></div>' +
      '<div class="hud-f hud-hi"><s>' + chan.label + '</s><var data-out="v">' + chan.fmt(read()) + '</var></div>' +
      (multi ? '' : '<div class="hud-row">' +
        '<div class="hud-f sm"><s>EASED</s><var data-out="e">0.000</var></div>' +
        '<div class="hud-f sm"><s>T</s><var data-out="t">0<u>/' + Math.round(T.dur) + 'ms</u></var></div></div>') +
      '<svg class="hud-chart" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      (zone ? '<rect class="hud-zone" x="' + PL + '" y="' + (zone.at === 'above' ? Y(zone.ext) : Y(zone.line)) + '" width="' + (W - PL - 6) +
        '" height="' + Math.abs(Y(zone.line) - Y(zone.ext)) + '"/>' : '') +
      (multi ? '<line class="hud-goal" x1="' + PL + '" y1="' + Y(1) + '" x2="' + (W - 6) + '" y2="' + Y(1) + '"/>' : '') +
      '<line class="hud-ref" x1="' + X(0) + '" y1="' + Y(multi ? 0 : chan.from) + '" x2="' + X(1) + '" y2="' + Y(multi ? 1 : chan.to) + '"/>' +
      clocks.map(function (c, i) {
        return '<polyline class="hud-meas hud-c' + i + '" points="' + curve(c) + '"/>';
      }).join('') +
      '<line class="hud-ax" x1="' + PL + '" y1="' + (H - PB) + '" x2="' + (W - 4) + '" y2="' + (H - PB) + '"/>' +
      '<line class="hud-ax" x1="' + PL + '" y1="' + (H - PB) + '" x2="' + PL + '" y2="6"/>' +
      (multi
        ? '<text x="' + (PL - 4) + '" y="' + (Y(1) + 3) + '" text-anchor="end">到位</text>' +
        '<text x="' + (PL - 4) + '" y="' + (Y(0) + 3) + '" text-anchor="end">起点</text>'
        : '<line class="hud-base" x1="' + PL + '" y1="' + Y(zone ? zone.line : chan.to) + '" x2="' + (W - 6) + '" y2="' + Y(zone ? zone.line : chan.to) + '"/>' +
        '<text x="' + (PL - 4) + '" y="' + (Y(chan.to) + 3) + '" text-anchor="end">' + chan.axis(chan.to) + '</text>' +
        '<text x="' + (PL - 4) + '" y="' + (Y(chan.from) + 3) + '" text-anchor="end">' + chan.axis(chan.from) + '</text>') +
      '<text x="' + X(0) + '" y="' + (H - 3) + '">0</text>' +
      '<text class="hud-xend" x="' + X(1) + '" y="' + (H - 3) + '" text-anchor="end">' + Math.round(multi ? maxDur : T.dur) + 'ms</text>' + mark +
      '<line class="hud-cur" x1="' + X(0) + '" y1="6" x2="' + X(0) + '" y2="' + (H - PB) + '"/>' +
      '<circle class="hud-cdot" cx="' + X(0) + '" cy="' + Y(multi ? 0 : chan.from) + '" r="4.5"/></svg>' +
      '<div class="hud-cap"><span>' + (multi ? clocks.length + L(' 条时钟 · 各自归一化进度', ' clocks · normalised') : chan.label + ' × TIME' + (T.INF ? '·' + L('循环', 'loop') : '')) +
      '</span><span>' + L('按住曲线可拖帧', 'drag to scrub') + '</span></div>' +
      (multi ? '<div class="hud-legend">' + clocks.map(function (c, i) {
        return '<div class="hud-clk"><i class="hud-key hud-c' + i + '"></i><s>' + (c.name || ('#' + (i + 1))) + ' ' + c.chan.label + '</s>' +
          '<var data-out="k' + i + '">' + c.chan.fmt(scalar(c.host)[c.chan.key]) + '</var><u data-out="d' + i + '">0/' + Math.round(c.T.dur) + 'ms</u></div>';
      }).join('') + '</div>' : '') +
      '<div class="hud-verdict"><span>' + (multi
        ? L('最长 ', 'slowest ') + '<b>' + Math.round(Math.max.apply(null, durs)) + 'ms</b>' + L(' vs 最短 ', ' vs ') + '<b>' + Math.round(Math.min.apply(null, durs)) + 'ms</b>' +
        L(' · 差 ', ' · ') + '<b>' + ratio.toFixed(1) + '×</b>'
        : (zone ? L('峰值', 'peak ') + zone.kind + '<b>' + (zone.at === 'above' ? '+' : '−') + amt.toFixed(1) + '%</b>' : L('两端不越界', 'no overshoot'))) +
      '</span>' + (multi ? '' : '<span class="hud-end">' + L('终点', 'end') + '<b>' + chan.fmt(chan.to) + '</b></span>') + '</div>';

    var BRK = '<svg viewBox="0 0 26 26"><path d="M25 1 L7 1 Q1 1 1 7 L1 25"/></svg>';
    /* 括号框住的是读数栏，不是舞台：实测装饰层压到过舞台内的文字 */
    panel.insertAdjacentHTML('beforeend',
      '<div class="hud-brk tl">' + BRK + '</div><div class="hud-brk tr">' + BRK + '</div>' +
      '<div class="hud-brk bl">' + BRK + '</div><div class="hud-brk br">' + BRK + '</div>');
    stage.insertAdjacentHTML('beforeend',
      '<div class="hud-num" title="' + catName + ' · ' + L('本类第 ', 'item ') + (pos + 1) + ' / ' + sib.length + '">' +
      ('0' + (pos + 1)).slice(-2) + '</div>');

    var bar = document.createElement('div');
    bar.className = 'hud-formula';
    bar.innerHTML = '<span class="hud-tag">' + L('公式', 'law') + '</span>' +
      (multi
        ? clocks.map(function (c, i) {
          return '<span><em>' + (c.name || ('#' + (i + 1))) + '</em> = mix(' + c.chan.axis(c.chan.from) + ', ' + c.chan.axis(c.chan.to) +
            ', <i>' + (c.ease.indexOf('cubic-bezier') >= 0 ? c.ease.replace(/\s/g, '') : c.ease) + '</i>(u)) · ' + Math.round(c.T.dur) + 'ms</span>';
        }).join('<em>·</em>')
        : '<span>' + chan.label + ' = mix(' + chan.axis(chan.from) + ', ' + chan.axis(chan.to) +
        ', <i>' + (C.ease.indexOf('cubic-bezier') >= 0 ? C.ease.replace(/\s/g, '') : C.ease) + '</i>(u))</span>' +
        '<em>·</em><span>u = t / <b class="hud-dur">' + Math.round(T.dur) + '</b>ms</span>' +
        '<em>·</em><span>' + (T.dur < 400 ? L('这个时长读起来是"啪一下"', 'reads as a snap')
          : T.dur < 700 ? L('这个时长读起来是"干脆但不冲"', 'crisp, no overshoot')
            : L('这个时长偏叙事，别用在按钮上', 'narrative length, not for buttons')) + '</span>');
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
      kv: clocks.map(function (c, i) { return panel.querySelector('[data-out="k' + i + '"]'); }),
      kd: clocks.map(function (c, i) { return panel.querySelector('[data-out="d' + i + '"]'); })
    };
    var bz = (function () {
      var m = C.ease.match(/cubic-bezier\(([^)]+)\)/);
      return m && window.EASE ? window.EASE.bezier.apply(null, m[1].split(',').map(Number)) : null;
    })();

    /* 拖动曲线 = 停在某一帧。这条能力只在有曲线时才成立，所以它属于图，
       不该在工具条上和「重播」抢位置。按相位 seek，各自的 delay 包含在 activeDuration 里 */
    svg.style.cursor = 'ew-resize';
    var moving = false, lastAxis = 0;
    function seekFrom(ev) {
      var r = svg.getBoundingClientRect(), k = r.width / W;
      if (!k) return;
      var u = Math.max(0, Math.min(1, ((ev.clientX - r.left) / k - PL) / (W - PL - 4)));
      var d = 0;
      stage.getAnimations({ subtree: true }).forEach(function (x) {
        var TX = timing(x); if (!TX) return; x.currentTime = u * (multi && maxDur ? maxDur : TX.dur); x.pause(); d = Math.max(d, TX.dur);
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
          var u = phaseOf(a.currentTime || 0, TT), v = scalar(c.host)[c.chan.key];
          if (out.kv[ci]) out.kv[ci].textContent = c.chan.fmt(v);
          if (out.kd[ci]) out.kd[ci].textContent = Math.round(u * TT.dur) + '/' + Math.round(TT.dur) + 'ms';
          if (!multi && ci === 0) {
            out.v.textContent = c.chan.fmt(v);
            out.t.innerHTML = Math.round(u * TT.dur) + '<u>/' + Math.round(TT.dur) + 'ms</u>';
            out.e.textContent = bz ? bz(u).toFixed(3) : u.toFixed(3);
            out.dot.setAttribute('cx', X(u)); out.dot.setAttribute('cy', Y(v));
          }
        });
        /* 慢放和「时长」滑块都会改真实时长，轴标签必须跟着走，否则读数就在撒谎 */
        var mDur = 0;
        clocks.forEach(function (c) { if (c.T && c.T.dur > mDur) mDur = c.T.dur; });
        if (mDur !== lastAxis) {
          lastAxis = mDur;
          out.xend.textContent = Math.round(mDur) + 'ms';
          if (out.dur) out.dur.textContent = Math.round(mDur);
        }
        /* 多时钟：游标走共享时间轴（真实已过毫秒 ÷ 最长时长），不是各自相位的最大值 */
        var pa = C.host.getAnimations()[0] || {};
        var ax = multi ? (maxDur ? Math.min(1, (pa.currentTime || 0) / maxDur) : 0)
          : phaseOf(pa.currentTime || 0, C.T);
        if (multi) {
          out.v.textContent = chan.fmt(scalar(C.host)[chan.key]);
          out.dot.setAttribute('cx', X(ax));
          out.dot.setAttribute('cy', Y(C.chan.to === C.chan.from ? ax : (scalar(C.host)[chan.key] - C.chan.from) / (C.chan.to - C.chan.from)));
        }
        out.cur.setAttribute('x1', X(ax)); out.cur.setAttribute('x2', X(ax));
      }
    };
  }

  /* ── 录轨迹：JS 驱动的演示没有可 seek 的动画，那就一边跑一边录。
     仍然只读不写：录的是浏览器实际画出来的位置，不是我们重算的公式。 ── */
  var FIND_MS = 400, REC_MS = 2400, GAP_MAX = 250;
  function probeOf(el, base) {
    var cs = getComputedStyle(el), m = new DOMMatrixReadOnly(m0(cs.transform)), r = el.getBoundingClientRect();
    var o = parseFloat(cs.opacity);
    return { sc: m.a, tx: r.left - base.x, ty: r.top - base.y, op: isNaN(o) ? 1 : o };
  }
  var KEYS = ['sc', 'tx', 'ty', 'op'];
  var LABEL = { sc: 'SCALE', tx: 'POSITION X', ty: 'POSITION Y', op: 'OPACITY' };
  var FMT = { sc: function (v) { return '×' + v.toFixed(3); }, tx: px, ty: px,
    op: function (v) { return (v * 100).toFixed(0) + '%' } };
  function mkRun(el) {
    var r = { el: el, s: [] };
    KEYS.forEach(function (k) { r[k] = { lo: 1e9, hi: -1e9 }; });
    return r;
  }
  function span(r, k) { var sp = r[k].hi - r[k].lo; return (k === 'tx' || k === 'ty') ? sp / 100 : sp; }
  function bestKey(r) {
    var bk = 'sc', bs = -1;
    KEYS.forEach(function (k) { var v = span(r, k); if (v > bs) { bs = v; bk = k; } });
    return { key: bk, score: bs, raw: r[bk].hi - r[bk].lo };
  }
  /* 该不该装仪表：位移不到 24px、缩放不到 0.05、透明度不到 0.2 的就不是运动，
     画出来只是一条抖动的直线，比没有更糟 */
  function worth(x) {
    var k = x.key, raw = x.raw;
    return (k === 'tx' || k === 'ty') ? raw >= 24 : (k === 'sc' ? raw >= 0.05 : raw >= 0.2);
  }
  /* 只认演示自己声明的主体（app.js 的 stageHTML 里就是这几个类名）。
     之前按"谁动得多"猜，在文字类演示上挑到一个缩放的装饰件，量出 SCALE ×0.143
     这种看着像仪表、其实最没意义的数——量得到不等于该量。 */
  var ACTORS = [
    ['.mk.live', 'TRANSLATE X'],
    ['.cprobe i', 'ON CURVE'],
    ['.scol', 'TRANSLATE X']
  ];
  function declaredActors(stage) {
    var out = [];
    ACTORS.forEach(function (a) {
      [].slice.call(stage.querySelectorAll(a[0])).forEach(function (el) { out.push({ el: el, name: a[1] }); });
    });
    return out.slice(0, 3);
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
    var acts = declaredActors(stage);
    if (!acts.length) { node.dataset.telemetry = 'n/a'; return null; }
    var find = acts.map(function (a) { var r = mkRun(a.el); r.name = a.name; return r; });
    var runs = [], done = false, started = false, extra = [];
    /* 滚动驱动的演示（scroll / 大半 compound）横轴不该是时间：
       它不由时间推进，把 2.4 秒的录制窗口套上去只会画出一条直线 */
    var scBox = stage.querySelector('.scrolly');
    function sprog() {
      if (!scBox) return -1;
      var m = scBox.scrollHeight - scBox.clientHeight;
      return m > 8 ? Math.max(0, Math.min(1, scBox.scrollTop / m)) : -1;
    }
    var scrollMode = sprog() >= 0, seen = 0, pmin = 1, pmax = 0, lastProg = -1, idle = 0;
    function xq(t) { return scrollMode ? t : Math.min(1, t / REC_MS); }
    var best = null, bkey = 'sc', cyc = 0, pts = [], y0 = 0, y1 = 1;
    var acc = 0, lastAny = performance.now(), frame = 0, recT0 = 0;
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
        panel.remove(); bar.remove();
        if (node._tools) {
          var r2 = node.querySelector('.hud-formula .replay');
          if (r2) node._tools.appendChild(r2);
          node._tools.hidden = false; node._tools = null;
        }
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
    function finish() {
      done = true;
      if (runs.length > 1) {
        /* 多条线必须共用一条纵轴，否则每条各自铺满，看着一样高其实不可比 */
        y0 = -0.08; y1 = 1.08;
        pts = best.s.map(function (p) { return [Math.min(1, p[0] / REC_MS), qnorm(best, p)]; });
        extra.forEach(function (el, i) {
          var r = runs[i + 1];
          el.setAttribute('points', r.s.map(function (p) {
            return X(Math.min(1, p[0] / REC_MS)).toFixed(1) + ',' + Y(qnorm(r, p)).toFixed(1);
          }).join(' '));
        });
        out.cap1.textContent = LABEL[bkey] + ' × TIME · ' + L('各自归一化', 'normalised');
        out.legend.innerHTML = runs.map(function (r, i) {
          return '<div class="hud-clk"><i class="hud-key hud-c' + i + '"></i><s>' + (r.name || LABEL[r.key]) + '</s>' +
            '<var data-out="k' + i + '">' + FMT[r.key](r.s.length ? r.s[r.s.length - 1][1][r.key] : 0) + '</var>' +
            '<u>' + (Math.round(r.s[r.s.length - 1][0]) / 1000).toFixed(2) + 's</u></div>';
        }).join('');
      } else {
        pts = best.s.map(function (p) { return [Math.min(1, p[0] / REC_MS), p[1][bkey]]; });
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
      out.cap1.textContent = (best.name || LABEL[bkey]) + ' × ' + (scrollMode ? L('滚动进度', 'SCROLL') : 'TIME');
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
      if (cyc) { out.cline.setAttribute('x1', X(cyc / REC_MS)); out.cline.setAttribute('x2', X(cyc / REC_MS)); }
    }

    return {
      traced: true,
      paint: function () {
        var now = performance.now(), gap = now - lastAny;
        /* 标签页被冻结过再回来，帧间隔会是几十秒；这种跳变不能进时间轴 */
        if (gap > GAP_MAX) { lastAny = now; return; }
        lastAny = now; acc += gap; frame++;
        function probeAll() {
          find.forEach(function (r) {
            var p = probeOf(r.el, base);
            KEYS.forEach(function (k) { if (p[k] < r[k].lo) r[k].lo = p[k]; if (p[k] > r[k].hi) r[k].hi = p[k]; });
          });
        }
        if (!started) {
          if (scrollMode) {
            var pr0 = sprog();
            if (pr0 < 0) { giveUp(L('这条演示里没有可滚的区域', 'nothing to scroll')); return; }
            if (Math.abs(pr0 - lastProg) > 0.002) {
              probeAll(); seen++;
              pmin = Math.min(pmin, pr0); pmax = Math.max(pmax, pr0); lastProg = pr0;
            }
            if (seen < 10 || pmax - pmin < 0.3) {
              out.rec.textContent = L('在这块里滚一下，我就把它画出来', 'scroll inside it to draw the curve');
              return;
            }
          } else if (frame % 3 === 0) probeAll();
          if (scrollMode || acc > FIND_MS) {
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
            runs.forEach(function (r) { r.key = bestKey(r).key; });
            out.lbl.textContent = best.name || LABEL[bkey];
            out.mode.textContent = L('录制中', 'recording');
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
          var p2 = probeOf(best.el, base), xk = scrollMode ? sprog() : acc;
          best.s.push([xk, p2]);
          runs.slice(1).forEach(function (r) { r.s.push([xk, probeOf(r.el, base)]); });
          pts = best.s.map(function (q) { return [xq(q[0]), runs.length > 1 ? qnorm(best, q) : q[1][bkey]]; });
          if (runs.length <= 1) rescale();
          draw();
          if (scrollMode) { if (pmax - pmin >= 0.85 || (seen > 40 && ++idle > 200)) finish(); }
          else if (acc > REC_MS) finish();
        }
        var live = probeOf(best.el, base)[bkey];
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
    [].slice.call(node.querySelectorAll('.hud,.hud-brk,.hud-num,.hud-formula')).forEach(function (n) { n.remove(); });
    var v = node.querySelector('.pg-visual'); if (v) v.style.removeProperty('--hud-accent');
  }
  function strip(node) { stripPanel(node); node._hudId = null; node._clocks = null; node._traced = null; }

  function wire(node, id) {
    if (!node) return;
    var term = (window.TERMS || []).filter(function (t) { return t.id === id; })[0];
    if (!term) return strip(node);
    if (node._hudId !== id) {
      stripPanel(node);
      node._hudId = id;
      var stage = node.querySelector('.stage');
      /* 两条路都要"声明的主体"这道门：
         可 seek 的那条只认声明式编译出来的动画（kind 不在 MOTION.KINDS 里，
         就是 app.js 用 @keyframes 驱动 .obj 的那批）；命令式的那批走录制，
         录制只认 ACTORS 表里点名的元素。否则就会在文字类演示上抓到一个
         正在缩放的装饰件，量出 SCALE ×0.143 这种没意义的数。 */
      var kind = (term.demo || {}).kind;
      var declarative = !(window.MOTION && window.MOTION.KINDS && window.MOTION.KINDS[kind]);
      node._clocks = stage && declarative ? collectClocks(stage) : [];
      /* 录制模式只开给这三个 kind：它们的主体就是被驱动的那个元素，
         且量出来的就是这条术语讲的东西。其余（compound / drag / list / type /
         perf / canvas 类）位置或缩放说明不了问题，宁可不装仪表 */
      node._traced = !!stage && !node._clocks.length &&
        ['track', 'curve', 'spring'].indexOf(kind) >= 0 && !!declaredActors(stage).length;
    }
    if (!on || node._hud) return;
    if (!node._clocks.length && !node._traced) { node.dataset.telemetry = 'n/a'; return; }
    var h = node._clocks.length ? build(node, term, node._clocks) : buildTraced(node, term);
    if (!h) return;
    node._hud = h;
    node.classList.add('hud-on');
    var v = node.querySelector('.pg-visual');
    if (v) v.style.setProperty('--hud-accent', ACCENT[term.cat] || 'var(--accent)');
  }

  /* 只服务当前可见的那个详情节点，隐藏的（切术语留下的）一律不动 */
  /* HUD 只在详情页可见时逐帧刷新。原来即使用户停在首页也会永久占用一条
     requestAnimationFrame 循环，长时间打开页面会白白消耗 CPU/电量。 */
  (function loop() {
    var n = document.querySelector('.term--detail.hud-on:not([hidden])');
    if (n && n._hud) {
      try { n._hud.paint(); } catch (e) { }
      requestAnimationFrame(loop);
    } else {
      /* 详情页打开/关闭时最多延迟一个短轮询周期，不让空闲状态常驻 rAF。 */
      setTimeout(loop, 250);
    }
  })();

  var btn = document.getElementById('hud');
  function paintBtn() {
    if (!btn) return;
    var en = window.I18N && window.I18N.lang === 'en';
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

  window.HUD = { wire: wire, on: function () { return on; }, repaintBtn: paintBtn };
})();
