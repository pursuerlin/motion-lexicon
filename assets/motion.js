/* ============================================================
   motion.js —— 可交互实演部件：列表 / 拖拽 / 转场 / 文字 / 描边 / 性能
   依赖 app.js 暴露的 ENGINE
   ============================================================ */
window.MOTION = (function () {
  'use strict';
  const $ = window.ENGINE.$, $$ = window.ENGINE.$$, esc = window.ENGINE.esc;
  const M = { KINDS: {}, BEHAVIORS: {}, extraCSS: function () { return ''; } };
  const EO = 'cubic-bezier(0.16,1,0.3,1)', EI = 'cubic-bezier(0.32,0,0.67,0)';

  /* ---------------- 公共工具 ---------------- */
  function watch(el, fn) {
    /* 离开 DOM 有两种：LRU 逐出（真的没了）和详情页关闭（还会再打开）。
       原来只要 !isConnected 就把自己从主循环摘掉，于是缓存里的节点再打开时
       演示是死的——jank 的轨道、描边的路径都会永久停摆，而且不报错。
       现在改成「离开就停摆、回来就继续」，真正的销毁由 ENGINE.dropDetail 统一摘。 */
    const u = function (now) {
      if (el.isConnected && window.ENGINE.isVisible(el)) fn(now);
    };
    window.ENGINE.tickers.add(u);
    (el._watchers || (el._watchers = [])).push(u);
    return u;
  }
  function cycle(el, period, fn) {
    let t0 = performance.now();
    fn(0.3); /* 先画一帧，避免首屏空白（rAF 未启动时也能看到内容） */
    watch(el, function (now) {
      const P = period / (el._speed || 1);
      let p = (now - t0) % P / P;
      if (now - t0 > 1e10) t0 = now;
      fn(p, now);
    });
  }
  /* FLIP：量 First/Last，反转后 Play */
  function flip(scope, mutate, dur) {
    const sel = '[data-flip]';
    const before = new Map();
    $$(sel, scope).forEach(el => before.set(el, el.getBoundingClientRect()));
    mutate();
    $$(sel, scope).forEach(el => {
      const b = before.get(el), a = el.getBoundingClientRect();
      if (!window.ENGINE.motionOn()) return;
      if (!b) {
        el.animate([{ opacity: 0, transform: 'scale(.88)' }, { opacity: 1, transform: 'none' }],
          { duration: 300, easing: EO, fill: 'backwards' });
        return;
      }
      const dx = b.left - a.left, dy = b.top - a.top, sx = b.width / (a.width || 1);
      if (Math.abs(dx) < .5 && Math.abs(dy) < .5 && Math.abs(sx - 1) < .01) return;
      el.animate([
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ')' },
        { transform: 'none' }
      ], { duration: dur || 360, easing: EO });
    });
  }
  function draggable(target, onStart, onMove, onEnd) {
    target.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      try { target.setPointerCapture(e.pointerId); } catch (err) {}
      const st = { x: e.clientX, y: e.clientY, last: { x: e.clientX, y: e.clientY, t: e.timeStamp }, vx: 0, vy: 0 };
      target.classList.add('dragging');
      onStart && onStart(e, st);
      const mv = function (ev) {
        const dt = Math.max(8, ev.timeStamp - st.last.t);
        st.vx = (ev.clientX - st.last.x) / dt * 1000;
        st.vy = (ev.clientY - st.last.y) / dt * 1000;
        st.last = { x: ev.clientX, y: ev.clientY, t: ev.timeStamp };
        onMove(ev.clientX - st.x, ev.clientY - st.y, ev, st);
      };
      const up = function (ev) {
        target.classList.remove('dragging');
        target.removeEventListener('pointermove', mv);
        target.removeEventListener('pointerup', up);
        target.removeEventListener('pointercancel', up);
        onEnd && onEnd(st, ev);
      };
      target.addEventListener('pointermove', mv);
      target.addEventListener('pointerup', up);
      target.addEventListener('pointercancel', up);
    });
  }
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ================= 1. 列表类（list） ================= */
  M.listHTML = function (mode) {
    if (mode === 'accordion') {
      return '<div class="acc">' + ['挤压与拉伸', '预备动作', '跟随缓冲'].map((s, i) =>
        '<div class="acc-i' + (i === 0 ? ' open' : '') + '"><button type="button" class="acc-h">' + s +
        '<i class="chev">›</i></button><div class="acc-p"><p>每条动画原则都能在 CSS 或 GSAP 里找到对应实现，命名一致才能被讨论和被复用。</p></div></div>').join('') + '</div>';
    }
    if (mode === 'flip') {
      return '<div class="flipcard"><div class="fc-inner"><div class="fc-face front">正面 · 点我</div>' +
        '<div class="fc-face back">背面 · 详情</div></div></div>';
    }
    if (mode === 'layout') {
      return '<div class="lblock"><button type="button" class="mini add-item">+ 添加一项</button>' +
        '<div class="llist" data-flip-host></div></div>';
    }
    if (mode === 'reorder') {
      return '<div class="lblock"><button type="button" class="mini shuffle">⇅ 换序</button>' +
        '<div class="tiles">' + ['A', 'B', 'C', 'D', 'E', 'F'].map((s, i) =>
          '<i class="tile" data-flip style="--i:' + i + '">' + s + '</i>').join('') + '</div></div>';
    }
    if (mode === 'tabs') {
      return '<div class="tabs"><div class="tabbar">' + ['概览', '动效', '规范'].map((s, i) =>
        '<button type="button" class="tab' + (i === 0 ? ' on' : '') + '">' + s + '</button>').join('') +
        '<i class="ind"></i></div><div class="tabpanel">指示条用 translate + scaleX 表达“距离”，而不是两块内容互相淡入。</div></div>';
    }
    if (mode === 'filter') {
      return '<div class="lblock"><div class="chips">' + ['全部', '入场', '转场', '反馈'].map((s, i) =>
        '<button type="button" class="fchip' + (i === 0 ? ' on' : '') + '" data-f="' + i + '">' + s + '</button>').join('') +
        '</div><div class="fgrid">' + [
          ['fade-in', 1], ['crossfade', 2], ['ripple', 3], ['slide-in', 1], ['FLIP', 2], ['hover-lift', 3]
        ].map(x => '<i class="ftile" data-flip data-k="' + x[1] + '">' + x[0] + '</i>').join('') + '</div></div>';
    }
    if (mode === 'inline') {
      return '<div class="inline-card"><h4>就地展开 <button type="button" class="mini exp">详情</button></h4>' +
        '<div class="exp-p"><p>容器高度与内边距同步过渡；正文宽度也参与补间，否则文字会先重排再淡入，出现两次跳字。</p></div></div>';
    }
    return '<div class="ph">list</div>';
  };

  M.KINDS.list = function (stage, s) {
    const mode = s.mode;
    if (mode === 'accordion') {
      stage.addEventListener('click', function (e) {
        const h = e.target.closest('.acc-h'); if (!h) return;
        const item = h.parentElement, open = item.classList.contains('open');
        $$('.acc-i', stage).forEach(i => i.classList.remove('open'));
        if (!open) item.classList.add('open');
      });
    }
    if (mode === 'flip') {
      stage.addEventListener('click', () => $('.fc-inner', stage).classList.toggle('flipped'));
    }
    if (mode === 'layout') {
      const host = $('.llist', stage);
      let n = 0;
      const seed = () => { ['第一项', '第二项'].forEach(t => host.insertAdjacentHTML('beforeend', '<div class="lrow" data-flip>' + t + '</div>')); };
      seed();
      $('.add-item', stage).addEventListener('click', function () {
        n++;
        if (n % 3 === 0) {
          flip(host, () => host.lastElementChild && host.lastElementChild.remove());
          return;
        }
        flip(host, () => host.insertAdjacentHTML('afterbegin', '<div class="lrow" data-flip>新增 ' + n + '</div>'));
      });
    }
    if (mode === 'reorder') {
      $('.shuffle', stage).addEventListener('click', function () {
        const tiles = $$('.tile', stage);
        flip(stage, function () {
          tiles.slice().sort(() => Math.random() - 0.5).forEach(t => stage.querySelector('.tiles').appendChild(t));
        });
      });
    }
    if (mode === 'tabs') {
      const bar = $('.tabbar', stage), ind = $('.ind', stage), panel = $('.tabpanel', stage);
      const texts = ['概览：整页结构在这里。', '动效：指示条用 translate + scaleX 表达“距离”，而不是两块内容互相淡入。', '规范：时长与曲线都是令牌。'];
      const place = (t, first) => {
        const r = t.getBoundingClientRect(), br = bar.getBoundingClientRect();
        ind.style.transform = 'translateX(' + (r.left - br.left) + 'px)';
        ind.style.width = r.width + 'px';
        if (!first) panel.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EO });
      };
      $$('.tab', stage).forEach((t, i) => t.addEventListener('click', function () {
        $$('.tab', stage).forEach(x => x.classList.remove('on')); t.classList.add('on');
        panel.textContent = texts[i]; place(t);
      }));
      requestAnimationFrame(() => place($('.tab.on', stage), true));
      window.addEventListener('resize', () => { const on = $('.tab.on', stage); if (on) place(on, true); });
    }
    if (mode === 'filter') {
      $$('.fchip', stage).forEach(c => c.addEventListener('click', function () {
        $$('.fchip', stage).forEach(x => x.classList.remove('on')); c.classList.add('on');
        const k = c.dataset.f;
        flip(stage, function () {
          $$('.ftile', stage).forEach(t => {
            const show = k === '0' || t.dataset.k === k;
            t.classList.toggle('off', !show);
          });
        }, 300);
      }));
    }
    if (mode === 'inline') {
      const card = $('.inline-card', stage);
      $('.exp', stage).addEventListener('click', () => card.classList.toggle('open'));
    }
  };

  /* ================= 2. 指针类（drag） ================= */
  M.dragHTML = function (mode) {
    if (mode === 'drag') return '<div class="dfield"><i class="ball drag-ball"></i><span class="tip">抓住拖动 · 松手有惯性</span></div>';
    if (mode === 'reorder') return '<div class="dlist">' + ['上传中…', '转码完成', '等待审阅', '已发布'].map((t, i) =>
      '<div class="drow" data-flip data-i="' + i + '"><i class="grip">⋮⋮</i><span>' + t + '</span></div>').join('') + '</div>';
    if (mode === 'swipe') return '<div class="swipelane"><div class="swipe-stack"></div></div>';
    if (mode === 'rubber') return '<div class="rframe"><i class="rpanel">越界试试<br><small>橡皮筋阻尼</small></i></div>';
    if (mode === 'ripple') return '<button type="button" class="bigbtn ripple-btn">点击任意位置</button>';
    if (mode === 'hold') return '<button type="button" class="bigbtn hold-btn"><i class="hfill"></i><span>按住以确认删除</span></button>';
    if (mode === 'ptr') return '<div class="ptr"><i class="ptr-ind"></i><div class="ptr-list">' + ['最新', '稍早', '更早'].map(t =>
      '<div class="lrow">' + t + '</div>').join('') + '</div></div>';
    if (mode === 'shared') return '<div class="thumbs"><i class="thumb" data-flip>封面 A</i><i class="thumb" data-flip>封面 B</i><i class="thumb" data-flip>封面 C</i></div>';
    if (mode === 'direction') return '<div class="stack2"><i class="pane p1">列表页</i><i class="pane p2">详情页</i></div>' +
      '<div class="navrow"><button type="button" class="mini fwd">前进 →</button><button type="button" class="mini back">← 返回</button></div>';
    return '<div class="ph">drag</div>';
  };

  M.KINDS.drag = function (stage, s) {
    const mode = s.mode;

    if (mode === 'drag') {
      const ball = $('.drag-ball', stage), field = $('.dfield', stage);
      let x = 0, y = 0;
      draggable(ball, function (e, st) { st.bx = x; st.by = y; }, function (dx, dy, ev, st) {
        const r = field.getBoundingClientRect(), br = ball.getBoundingClientRect();
        x = clamp(st.bx + dx, -r.width / 2 + br.width / 2, r.width / 2 - br.width / 2);
        y = clamp(st.by + dy, -r.height / 2 + br.height / 2, r.height / 2 - br.height / 2);
        const skew = clamp(-st.vx * 0.012, -16, 16);
        ball.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(1.08) skewX(' + skew + 'deg)';
      }, function (st) {
        const r = field.getBoundingClientRect();
        const px = clamp(x + st.vx * 0.18, -r.width / 2 + 24, r.width / 2 - 24);
        const py = clamp(y + st.vy * 0.18, -r.height / 2 + 24, r.height / 2 - 24);
        ball.animate([{ transform: ball.style.transform }, { transform: 'translate(' + px + 'px,' + py + 'px) scale(1)' }],
          { duration: 620, easing: EO }).finished.then(() => { x = px; y = py; }).catch(function () {});
        x = px; y = py;
      });
    }

    if (mode === 'reorder') {
      const list = $('.dlist', stage);
      $$('.drow', stage).forEach(row => draggable(row, function (e, st) {
        st.h = row.offsetHeight; st.y0 = 0; row.style.zIndex = 5;
      }, function (dx, dy, ev, st) {
        st.y0 = dy; row.style.transform = 'translateY(' + dy + 'px) scale(1.02)';
        row.style.boxShadow = '0 12px 22px -8px rgba(0,0,0,.6)';
        const rows = $$('.drow', list);
        const idx = rows.indexOf(row);
        const step = Math.round(dy / (st.h + 8));
        const next = clamp(idx + step, 0, rows.length - 1);
        if (next !== idx) {
          flip(list, function () {
            const target = rows[next];
            if (idx < next) target.after(row); else target.before(row);
          }, 240);
        }
      }, function (st) {
        row.style.zIndex = ''; row.style.boxShadow = '';
        row.animate([{ transform: row.style.transform }, { transform: 'none' }], { duration: 260, easing: EO })
          .finished.then(() => { row.style.transform = ''; }).catch(function () {});
      }));
    }

    if (mode === 'swipe') {
      const stack = $('.swipe-stack', stage);
      const bind = el => draggable(el, function (e, st) { st.w = el.offsetWidth; }, function (dx, dy, ev, st) {
        const rot = clamp(dx / st.w * 8, -8, 8);
        el.style.transform = 'translateX(' + dx + 'px) rotate(' + rot + 'deg)';
        el.style.opacity = String(1 - Math.min(.7, Math.abs(dx) / st.w));
      }, function (st, ev) {
        const dx = parseFloat((el.style.transform.match(/translateX\((-?[\d.]+)px/) || [0, 0])[1]);
        if (Math.abs(dx) > st.w * 0.4) {
          el.animate([{ transform: el.style.transform, opacity: 1 },
            { transform: 'translateX(' + (dx > 0 ? 260 : -260) + 'px) rotate(' + (dx > 0 ? 12 : -12) + 'deg)', opacity: 0 }],
            { duration: 280, easing: EI }).finished.then(function () {
              flip(stack, () => el.remove());
              if (!stack.children.length) setTimeout(function () { flip(stack, seed); }, 420);
            }).catch(function () {});
        } else {
          el.animate([{ transform: el.style.transform }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.34,1.56,0.64,1)' })
            .finished.then(() => { el.style.transform = ''; el.style.opacity = ''; }).catch(function () {});
        }
      });
      /* seed 重建的卡片是新节点，必须当场重新 bind：
         之前只有初始两张有监听，划走一轮后重置出来的卡永远拖不动 */
      const seed = () => { stack.innerHTML = ''; ['归档这封邮件', '再划走一条试试'].forEach(t =>
        stack.insertAdjacentHTML('beforeend', '<div class="swipe" data-flip><span>' + t + '</span><i>划走</i></div>'));
        $$('.swipe', stack).forEach(bind); };
      seed();
    }

    if (mode === 'rubber') {
      const p = $('.rpanel', stage);
      let x = 0, y = 0;
      const damp = v => (v > 1 ? 1 - 1 / (v + 0.7) : v < -1 ? -1 - 1 / (-v + 0.7) : v) * 52;
      draggable(p, function (e, st) { st.bx = x; st.by = y; }, function (dx, dy, ev, st) {
        x = damp(st.bx + dx); y = damp(st.by + dy);
        p.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      }, function () {
        p.animate([{ transform: p.style.transform }, { transform: 'translate(0,0)' }],
          { duration: 520, easing: 'cubic-bezier(0.22,1.4,0.36,1)' }).finished.then(() => { x = y = 0; }).catch(function () {});
      });
    }

    if (mode === 'ripple') {
      const btn = $('.ripple-btn', stage);
      btn.addEventListener('pointerdown', function (e) {
        const r = btn.getBoundingClientRect();
        const sp = document.createElement('span');
        sp.className = 'rp';
        const size = Math.max(r.width, r.height) * 2;
        sp.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (e.clientX - r.left - size / 2) +
          'px;top:' + (e.clientY - r.top - size / 2) + 'px';
        btn.appendChild(sp);
        setTimeout(() => sp.remove(), 640);
      });
    }

    if (mode === 'hold') {
      const btn = $('.hold-btn', stage), fill = $('.hfill', stage), lab = $('span', stage);
      let raf = null, t0 = 0, done = false;
      const NEED = 900;
      const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; };
      const decay = () => {
        let cur = parseFloat(fill.dataset.p || 0);
        const step = () => { cur *= 0.86; fill.style.transform = 'scaleX(' + cur + ')'; fill.dataset.p = cur; if (cur > 0.01) raf = requestAnimationFrame(step); else raf = null; };
        step();
      };
      const start = function () {
        if (done) return; stop(); t0 = performance.now();
        const step = function () {
          const p = clamp((performance.now() - t0) / NEED, 0, 1);
          fill.style.transform = 'scaleX(' + p + ')'; fill.dataset.p = p;
          if (p >= 1) {
            done = true; lab.textContent = '已删除'; btn.classList.add('ok'); fill.style.transform = 'scaleX(1)';
            setTimeout(function () { done = false; btn.classList.remove('ok'); lab.textContent = '按住以确认删除'; fill.style.transform = 'scaleX(0)'; }, 1100);
            return;
          }
          raf = requestAnimationFrame(step);
        };
        step();
      };
      btn.addEventListener('pointerdown', start);
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, function () { if (!done) { stop(); decay(); } }));
    }

    if (mode === 'ptr') {
      const list = $('.ptr-list', stage), ind = $('.ptr-ind', stage);
      let y = 0;
      const TH = 62;
      draggable(list, function (e, st) { st.by = y; }, function (dx, dy, ev, st) {
        y = Math.max(0, (st.by + dy) * 0.5);
        if (y < 0.5) y = 0;
        list.style.transform = 'translateY(' + y + 'px)';
        ind.style.transform = 'translateY(' + y + 'px) rotate(' + (y * 5) + 'deg)';
        ind.style.opacity = String(clamp(y / TH, 0, 1));
      }, function () {
        if (y > TH * 0.8) {
          ind.classList.add('spin');
          const back = function (d) {
            list.animate([{ transform: list.style.transform }, { transform: 'translateY(18px)' }], { duration: d, easing: EO });
            y = 18;
          };
          back(420);
          setTimeout(function () { ind.classList.remove('spin'); back(300); list.style.transform = 'translateY(0)'; ind.style.opacity = 0; y = 0; }, 1200);
        } else {
          list.animate([{ transform: list.style.transform }, { transform: 'translateY(0)' }], { duration: 480, easing: 'cubic-bezier(0.34,1.56,0.64,1)' });
          ind.style.opacity = 0; y = 0;
        }
      });
    }

    if (mode === 'shared') {
      const thumbs = $$('.thumb', stage);
      let active = null;
      thumbs.forEach(function (t) {
        t.addEventListener('click', function () {
          if (active === t) {
            const a = t.getBoundingClientRect();
            t.style.transform = ''; t.classList.remove('big');
            const b = t.getBoundingClientRect();
            t.animate([{ transform: 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px) scale(' + (a.width / b.width) + ')' }, { transform: 'none' }], { duration: 380, easing: EO });
            active = null; return;
          }
          if (active) active.classList.remove('big'), active.style.transform = '';
          active = t;
          const before = t.getBoundingClientRect();
          t.classList.add('big');
          const after = t.getBoundingClientRect();
          t.animate([
            { transform: 'translate(' + (before.left - after.left) + 'px,' + (before.top - after.top) + 'px) scale(' + (before.width / after.width) + ')' },
            { transform: 'none' }
          ], { duration: 420, easing: EO });
        });
      });
    }

    if (mode === 'direction') {
      const stack = $('.stack2', stage);
      let i = 0;
      const go = function (dir) {
        const target = dir > 0 ? 1 : 0;
        if (target === i) return;
        i = target;
        stack.style.transform = 'translateX(' + (-100 * i) + '%)';
      };
      $('.fwd', stage).addEventListener('click', () => go(1));
      $('.back', stage).addEventListener('click', () => go(-1));
    }
  };

  /* ================= 3. 转场类（morph） ================= */
  M.morphHTML = function (mode) {
    if (mode === 'path') {
      return '<div class="mpathwrap"><svg viewBox="0 0 100 100" class="mp"><polygon id="mp-p" points=""/></svg><i class="note">同锚点数才能插值</i></div>';
    }
    if (mode === 'continuity') {
      return '<div class="cont"><h5>同一个标题不重播</h5><div class="cbody"></div></div>';
    }
    if (mode === 'viewTransition') {
      return '<div class="vt"><div class="vt-page"><b>A 页</b><p>列表态 · 原生 View Transitions</p></div></div>' +
        '<div class="navrow"><button type="button" class="mini vt-go">换到 B 页</button><i class="vt-note"></i></div>';
    }
    if (mode === 'matchCut') {
      return '<div class="mc"><i class="mc-a"><b></b><s>镜头 A</s></i><i class="mc-b"><b></b><s>镜头 B</s></i></div>';
    }
    if (mode === 'cut') {
      return '<div class="cut"><i class="cut-a">场景 1</i><i class="cut-b">场景 2</i></div>';
    }
    return '<div class="xf"><i class="xf-a">画面 A</i><i class="xf-b">画面 B</i></div>';
  };

  M.KINDS.morph = function (stage, s) {
    const mode = s.mode;
    if (mode === 'crossfade' || !mode) {
      const a = $('.xf-a', stage), b = $('.xf-b', stage);
      cycle(stage, 3200, function (t) {
        /* 前 1.6s：A→B 交叉；后 1.6s：B→A 交叉。重叠期透明度互补 */
        const half = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5;
        const v = EASE.easeInOut(clamp(half / 0.34, 0, 1));
        if (t < 0.5) { a.style.opacity = String(1 - v); b.style.opacity = String(v); }
        else { b.style.opacity = String(1 - v); a.style.opacity = String(v); }
      });
    }
    if (mode === 'continuity') {
      const host = $('.cbody', stage);
      const rows = [['订单 #2418', '待付款'], ['订单 #2417', '已发货'], ['订单 #2416', '已完成']];
      let i = 0;
      const paint = function () {
        host.innerHTML = rows[i % 3].map(r => '<div class="crow"><span>' + r[0] + '</span><em>' + r[1] + '</em></div>').join('');
        if (window.ENGINE.motionOn()) {
          $$('.crow', host).forEach((el, n) => el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
            { duration: 300, delay: n * 50, easing: EO, fill: 'backwards' }));
        }
        i++;
      };
      paint();
      let acc = 0, last = 0;
      watch(stage, function (now) { if (!last) last = now; acc = now - last; if (acc > 1700) { last = now; paint(); } });
    }
    if (mode === 'path') {
      const poly = stage.querySelector('#mp-p') || $('polygon', stage);
      const N = 10;
      const shape = function (kind) {
        return Array.from({ length: N }, function (_, i) {
          const a = i / N * Math.PI * 2 - Math.PI / 2;
          const r = kind === 0 ? 40 : (i % 2 ? 19 : 44);
          return [50 + Math.cos(a) * r, 50 + Math.sin(a) * r];
        });
      };
      const A = shape(0), B = shape(1);
      cycle(stage, 2600, function (t) {
        const k = EASE.easeInOut(t < 0.5 ? t * 2 : (1 - t) * 2);
        poly.setAttribute('points', A.map(function (p, i) {
          return (p[0] + (B[i][0] - p[0]) * k).toFixed(2) + ',' + (p[1] + (B[i][1] - p[1]) * k).toFixed(2);
        }).join(' '));
      });
    }
    if (mode === 'viewTransition') {
      const page = $('.vt-page', stage), note = $('.vt-note', stage);
      note.textContent = document.startViewTransition ? '本浏览器支持原生 View Transitions' : '走 CSS 回退方案';
      const swap = function () {
        const b = $('b', page), p = $('p', page);
        const isA = b.textContent.indexOf('A') === 0;
        const write = function () { b.textContent = isA ? 'B 页' : 'A 页'; p.textContent = isA ? '详情态 · 前后两帧由浏览器补间' : '列表态 · 原生 View Transitions'; page.classList.toggle('alt'); };
        if (document.startViewTransition) document.startViewTransition(write);
        else if (window.ENGINE.motionOn()) { page.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 130, easing: EI, fill: 'forwards' }).finished.then(function () { write(); page.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: EO, fill: 'none' }); }).catch(function () {}); }
        else write();
      };
      $('.vt-go', stage).addEventListener('click', swap);
    }
    if (mode === 'matchCut') {
      const b = $('.mc-b', stage);
      cycle(stage, 2600, function (t) {
        const on = t < 0.5 ? clamp(t / 0.08, 0, 1) : 1 - clamp((t - 0.5) / 0.08, 0, 1);
        b.style.opacity = on;
      });
    }
    if (mode === 'cut') {
      const bb = $('.cut-b', stage);
      cycle(stage, 1800, function (t) { bb.style.opacity = t < 0.5 ? 0 : 1; });
    }
  };

  /* ================= 4. 文字类（type） ================= */
  const TYPED = '词不达意 → 一听就懂';
  M.typeHTML = function (mode) {
    if (mode === 'split') return '<div class="tword" data-text="MOTION"></div>';
    if (mode === 'lineMask') return '<div class="lines"><i>把滚动条</i><i>当成时间轴</i><i>来使用</i></div>';
    if (mode === 'kinetic') return '<div class="kinetic"><b>Motion</b><b>is</b><b>meaning</b></div>';
    if (mode === 'ticker') return '<div class="tick"><i class="dg"></i><i class="dg"></i><i class="dg"></i><i class="dg"></i></div>';
    if (mode === 'countup') return '<div class="cu"><b>0</b><s>次调用</s></div>';
    if (mode === 'glitch') return '<div class="gl" data-text="SYSTEM">SYSTEM</div>';
    if (mode === 'flipWord') return '<div class="fw"><span>精准</span><span>克制</span><span>高效</span></div>';
    return '<div class="tw"><b></b><i class="caret"></i></div>';
  };

  M.KINDS.type = function (stage, s) {
    const mode = s.mode;
    if (mode === 'typewriter' || !mode) {
      const b = $('.tw b', stage);
      cycle(stage, 3400, function (t) {
        const n = Math.floor(clamp(t / 0.62, 0, 1) * TYPED.length);
        if (b.textContent.length !== n) b.textContent = TYPED.slice(0, n);
      });
    }
    if (mode === 'scramble') {
      const b = $('.tw b', stage) || $('.gl', stage);
      const target = 'ease-out 240ms';
      const pool = '01<>-_/\\|*#@ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      cycle(stage, 2800, function (t) {
        const k = clamp(t / 0.55, 0, 1);
        let out = '';
        for (let i = 0; i < target.length; i++) {
          if (i / target.length < k) out += target[i];
          else out += pool[(Math.random() * pool.length) | 0];
        }
        b.textContent = out;
      });
    }
    if (mode === 'split') {
      const host = $('.tword', stage);
      const txt = host.dataset.text;
      if (!$('span', host)) host.innerHTML = txt.split('').map(function (c, i) { return '<span style="--i:' + i + '">' + c + '</span>'; }).join('');
      cycle(stage, 2600, function (t) {
        $$('span', host).forEach(function (el, i) {
          const p = clamp((t * 1.6 - i * 0.08) / 0.34, 0, 1);
          const e = EASE.easeOut(p);
          el.style.opacity = e;
          el.style.transform = 'translateY(' + ((1 - e) * 100) + '%) rotate(' + ((1 - e) * -12) + 'deg)';
        });
      });
    }
    if (mode === 'lineMask') {
      const lines = $$('.lines i', stage);
      cycle(stage, 3000, function (t) {
        lines.forEach(function (el, i) {
          const p = clamp((t * 1.5 - i * 0.14) / 0.4, 0, 1);
          el.style.transform = 'translateY(' + ((1 - EASE.easeOutExpo(p)) * 105) + '%)';
        });
      });
    }
    if (mode === 'kinetic') {
      const ws = $$('.kinetic b', stage);
      cycle(stage, 2400, function (t) {
        ws.forEach(function (el, i) {
          const p = clamp((t * 2.2 - i * 0.34) / 0.22, 0, 1);
          const e = EASE.easeOutBack(p);
          el.style.opacity = String(clamp(p * 3, 0, 1));
          el.style.transform = 'scale(' + (0.6 + e * 0.46) + ') translateY(' + ((1 - p) * 24) + 'px)';
        });
      });
    }
    if (mode === 'ticker') {
      const cols = $$('.tick .dg', stage);
      cols.forEach(function (c, i) { c.innerHTML = Array.from({ length: 11 }, (_, n) => '<u>' + (n % 10) + '</u>').join(''); });
      cycle(stage, 3200, function (t) {
        const v = Math.round(EASE.easeOut(clamp(t / 0.7, 0, 1)) * 4200);
        String(v).padStart(4, '0').split('').forEach(function (d, i) {
          if (cols[i]) cols[i].style.transform = 'translateY(' + (-d * 100) + '%)';
        });
      });
    }
    if (mode === 'countup') {
      const b = $('.cu b', stage), TARGET = 8921;
      cycle(stage, 2600, function (t) {
        const v = Math.round(EASE.easeOutExpo(clamp(t / 0.8, 0, 1)) * TARGET);
        b.textContent = v.toLocaleString('en-US');
      });
    }
    if (mode === 'glitch') {
      const el = $('.gl', stage);
      let n = 0;
      cycle(stage, 2200, function (t) {
        if (n++ % 3) return;
        const on = t < 0.3 || t > 0.86;
        const dx = on ? (Math.random() * 6 - 3) : 0;
        el.style.transform = 'translateX(' + dx.toFixed(2) + 'px)';
        el.style.textShadow = on ? '-3px 0 rgba(255,60,120,.9), 3px 0 rgba(60,200,255,.9)' : 'none';
        el.style.clipPath = on ? 'inset(' + (Math.random() * 40).toFixed(0) + '% 0 ' + (Math.random() * 40).toFixed(0) + '% 0)' : 'none';
      });
    }
    if (mode === 'flipWord') {
      const ws = $$('.fw span', stage);
      ws.forEach(function (w, i) { w.style.transform = 'rotateX(' + i * 90 + 'deg)'; });
      cycle(stage, 3000, function (t) {
        const k = t * ws.length;
        ws.forEach(function (w, i) {
          const d = k - i;
          const e = clamp(1 - Math.abs(d), 0, 1);
          w.style.transform = 'rotateX(' + ((i - k) * 90) + 'deg)';
          w.style.opacity = String(0.15 + e * 0.85);
        });
      });
    }
  };

  /* ================= 5. 描边（draw） ================= */
  M.drawHTML = function () {
    return '<svg class="draw" viewBox="0 0 160 80" aria-hidden="true">' +
      '<path class="d1" d="M8 62 C 34 8, 62 8, 82 44 S 128 74, 152 16" fill="none"/>' +
      '<circle class="d2" cx="82" cy="44" r="6" fill="none"/>' +
      '</svg>';
  };
  M.KINDS.draw = function (stage) {
    $$('path,circle', stage).forEach(function (p) {
      const len = p.getTotalLength ? p.getTotalLength() : 300;
      p.style.setProperty('--len', len);
    });
  };

  /* ================= 6. 性能（perf） ================= */
  M.perfHTML = function (mode) {
    if (mode === 'fps') return '<div class="fps"><b>--</b><s>fps</s><i class="fpsbar"></i><span class="spark"></span><em class="fps-t">目标 60Hz</em></div>';
    if (mode === 'thrash') return '<div class="bench"><button type="button" class="mini run">运行基准 · 强制同步布局</button>' +
      '<div class="brow"><label>读写交替</label><i class="bbar bad"><b></b></i><em>--</em></div>' +
      '<div class="brow"><label>先读后写</label><i class="bbar good"><b></b></i><em>--</em></div><div class="ghost-cells"></div></div>';
    if (mode === 'raf') return '<div class="bench"><div class="brow"><label>rAF</label><i class="bbar good raf"><b></b></i><em>--</em></div>' +
      '<div class="brow"><label>setInterval</label><i class="bbar bad si"><b></b></i><em>--</em></div>' +
      '<p class="bnote"><b>相位</b> = 回调落在上一帧之后多久。rAF 恒为 0（它本身就是这一帧）；setInterval 在 0~17ms 之间随机漂，所以它的写入常常赶不上本次合成，看起来就晚一帧。</p></div>';
    if (mode === 'ladder') return '<div class="ladder">' +
      [['Layout 重排', 'width / top / margin', 100], ['Paint 重绘', 'color / shadow / background', 62], ['Composite 合成', 'transform / opacity', 26]]
        .map(function (x) { return '<i class="lad"><b>' + x[0] + '</b><s>' + x[1] + '</s><u class="cost"><i style="--cost:' + x[2] + '%"></i></u></i>'; }).join('') +
      '<p class="bnote">越贵越要避开：动效优先只动 transform / opacity</p></div>';
    if (mode === 'safe') return '<div class="safe">' +
      [['transform', 1, 'ok'], ['opacity', 1, 'ok'], ['filter', 2, 'warn'], ['clip-path', 2, 'warn'], ['width', 3, 'bad'], ['top / left', 3, 'bad'], ['box-shadow', 3, 'bad'], ['font-size', 3, 'bad']]
        .map(function (x) { return '<i class="' + x[2] + '"><b>' + x[0] + '</b><s>' + '●'.repeat(x[1]) + '</s></i>'; }).join('') + '</div>';
    /* 令牌：左列是按这个时长跑的条，右列是它引用的真实贝塞尔形状；三档共用同一个 --ease-standard */
    if (mode === 'token') return '<div class="tokens">' +
      [['--dur-fast · 120ms', '快：状态确认', 120], ['--dur-base · 240ms', '中：元素进出场', 240],
       ['--dur-slow · 400ms', '慢：大面积转场', 400]]
        .map(function (x) { return '<i class="tk" style="--tk:' + x[2] + 'ms"><b>' + x[0] + '</b><s>' + x[1] +
          '</s><u></u><em aria-hidden="true"><svg viewBox="0 0 22 16"><path class="tk-grid" d="M0 15.5H22M0 .5H22"/>' +
          '<path class="tk-curve" d="M0 16 C 4.4 3.2, 4.4 0, 22 0"/><circle class="tk-dot" r="1.9" cx="0" cy="16"/></svg></em></i>'; }).join('') + '</div>';
    /* content-visibility：真的挂上 CV + contain-intrinsic-size，滚动时能看见跳过渲染造成的滚动条跳动 */
    if (mode === 'cv') return '<div class="scrolly cvbox" data-mode="cv"><div class="cvlist">' + Array.from({ length: 8 }, function (_, i) {
      return '<i class="cvi' + (i > 2 ? ' cv' : '') + '"><b>' + (i > 2 ? 'content-visibility: auto' : '普通区块') + '</b><s>' + (i > 2 ? '跳过布局与绘制' : '全部参与渲染') + '</s></i>';
    }).join('') + '</div></div>';
    /* compositing：A 走 CSS 关键帧（留在合成线程），B 由 JS 逐帧写几何属性（每帧回主线程） */
    if (mode === 'composite') return '<div class="wc"><i class="wc-a">transform · CSS</i><i class="wc-b">left · JS 每帧</i></div>' +
      '<p class="bnote">上：CSS 关键帧只动 transform，进合成层；下：rAF 每帧写 left，逐帧回主线程重排</p>';
    /* will-change：A 常驻 will-change，B 动画前才加、结束就移除 */
    if (mode === 'willchange') return '<div class="wc"><i class="wc-a wc-perm">常驻 will-change</i><i class="wc-b wc-timed">按需加 / 结束移除</i></div>' +
      '<p class="bnote">will-change 长期挂着会一直占着一层显存，节点一多反而掉帧</p>';
    /* dropped-frame：独立的帧格轨道，掉帧时格子真的跳过去 */
    if (mode === 'drop') return '<div class="bench"><button type="button" class="mini run">注入 1.5s 长任务 · 制造丢帧</button>' +
      '<div class="dropwrap"><div class="droprow"><label>帧轨道</label><i class="frames"></i></div>' +
      '<div class="droprow"><label>有效帧占比</label><i class="dropbar"><b></b></i></div>' +
      '<p class="bnote">一格 = 一帧：绿色是按时画出的，矮灰格就是被跳过的。不注入长任务时这台机器跑满 60fps，轨道会一直是全绿。</p></div></div>';
    /* perceived：乐观更新。UI 的答案和服务器真正回来的时间，分开给，才看得见「感知」二字 */
    const PB = '点一下：状态立刻变（这是 UI 给的答案），右下角那行才是服务器真正回来的时间。同样的网络，用户感知到的等待是前者。';
    if (mode === 'perceived') return '<div class="opt">' + [['离线缓存', '下次打开立刻可读'], ['协作光标', '先画自己的，再收别人的'], ['表单校验', '先给结论，请求慢慢回']]
      .map(function (x) { return '<i class="orow"><b data-l10n="' + x[0] + '">' + x[0] + '</b><s data-l10n="' + x[1] + '">' + x[1] + '</s>' +
        '<button type="button" class="mini obtn" data-l10n="完成">完成</button><u class="ost" data-l10n="待处理">待处理</u></i>'; }).join('') +
      '</div><p class="bnote" data-l10n="' + PB + '">' + PB + '</p>';
    /* purpose：同一次操作，左边带来源、右边只换字。关掉动效谁损失信息，一目了然 */
    const PU = '左：点任意一条，它会飞进上面的框，你因此知道这块内容从哪来。右：同样的操作只换文字。把动效都关掉，左边失去信息、右边什么都不少 —— 这就是「有没有目的」的判据。';
    if (mode === 'purpose') return '<div class="ppair">' + [['src', '有连续性'], ['fade', '只有装饰']]
      .map(function (c) { return '<i class="pcar" data-why="' + c[0] + '"><em data-l10n="' + c[1] + '">' + c[1] + '</em>' +
        '<b class="pslot" data-l10n="详情">详情</b><u class="pitems">' +
        ['来源 A', '来源 B', '来源 C'].map(function (t) { return '<s data-l10n="' + t + '">' + t + '</s>'; }).join('') + '</u></i>'; }).join('') +
      '</div><p class="bnote" data-l10n="' + PU + '">' + PU + '</p>';
    /* jank：两条同样行程的轨道，B 侧每帧插一段真的长任务 */
    return '<div class="jank"><i class="j-a">transform · 顺滑</i><i class="j-b">强制同步布局 · 卡顿</i></div>' +
      '<p class="bnote">同一段行程：A 只动 transform，B 每帧写样式后立刻读几何，主线程被堵</p>';
  };

  M.KINDS.perf = function (stage, s) {
    const mode = s.mode;
    const prm = function (k, d) { const v = stage._prm && stage._prm[k]; return v == null ? d : +v; };

    if (mode === 'fps' || mode === 'jank' || !mode) {
      /* 真实帧率测量。新柱记录自己那一拍的帧率，而不是把历史全刷成当前值。 */
      const host = $('.fps', stage), spark = $('.spark', host);
      const target = function () { return prm('hz', 60); };
      let frames = 0, last = performance.now();
      const onVis = function () { last = performance.now(); frames = 0; };   /* 回视口不复位就会先亮一个 0~3fps */
      stage.addEventListener('mouseenter', onVis);
      watch(stage, function (now) {
        frames++; const acc = now - last;
        if (acc < 500) return;
        const fps = Math.round(frames / (acc / 1000));
        $('b', host).textContent = fps;
        $('.fpsbar', host).style.transform = 'scaleX(' + clamp(fps / target(), 0, 1).toFixed(3) + ')';
        const t = $('.fps-t', host); if (t) t.textContent = '目标 ' + target() + 'Hz · ' + (fps >= target() * .92 ? '达标' : fps >= target() * .7 ? '偶尔丢帧' : '明显丢帧');
        if (spark) {
          const bar = document.createElement('i');
          bar.style.setProperty('--h', clamp(fps / target(), 0.08, 1).toFixed(3));
          spark.appendChild(bar);
          while (spark.children.length > 24) spark.removeChild(spark.firstChild);
          Array.from(spark.children).forEach(function (c, i, arr) { c.style.opacity = String(0.25 + 0.75 * (i / arr.length)); });
        }
        frames = 0; last = now;
      });
      if (mode === 'jank') {
        /* 两条轨道用同一套像素行程，否则「同一段运动」不成立 */
        const a1 = $('.j-a', stage), b1 = $('.j-b', stage);
        let t0 = performance.now();
        cycle(stage, 2200, function (t) {
          const w = (stage.clientWidth || 240) - 96;
          const p = EASE.easeInOut(t < .5 ? t * 2 : 2 - t * 2);
          a1.style.transform = 'translateX(' + (p * w).toFixed(1) + 'px)';
          const st0 = performance.now();
          b1.style.width = (96 + p * 40) + 'px';
          void b1.offsetWidth;
          b1.style.marginLeft = (b1.getBoundingClientRect().width * .12) + 'px';
          void b1.offsetWidth;
          /* 真的占住主线程：不占住就只是"看起来一样"，演示不出卡 */
          const block = prm('ms', 6);
          while (performance.now() - st0 < block) { void b1.offsetWidth; }
        });
        t0 = 0;
      }
    }

    if (mode === 'drop') {
      const track = $('.frames', stage), bar = $('.dropbar b', stage), run = $('.run', stage);
      let last = performance.now(), frames = 0, acc = 0, injectUntil = 0;
      run.addEventListener('click', function () {
        injectUntil = performance.now() + 1500;
        run.textContent = '注入中 · 主线程被占住';
        setTimeout(function () { run.textContent = '注入 1.5s 长任务 · 制造丢帧'; }, 1600);
      });
      watch(stage, function (now) {
        frames++; acc = now - last;
        /* 不制造负载就永远看不到丢帧，这个术语就没法演示 */
        if (now < injectUntil) { const t0 = performance.now(); while (performance.now() - t0 < 42) { void track.offsetWidth; } }
        if (acc < 120) return;
        const fps = frames / (acc / 1000), budget = acc / frames;
        /* 一格一帧：按真实帧时决定这一格是否“被跳过” */
        const cell = document.createElement('u');
        cell.className = budget > 20 ? 'miss' : '';
        track.appendChild(cell);
        const N = 30;
        while (track.children.length > N) track.removeChild(track.firstChild);
        const hit = Array.from(track.children).filter(c => c.className === 'miss').length;
        bar.style.transform = 'scaleX(' + clamp(1 - hit / N, 0.04, 1).toFixed(3) + ')';
        bar.style.background = hit > N * .2 ? 'var(--bad)' : 'var(--ok)';
        frames = 0; last = now;
      });
    }

    if (mode === 'composite') {
      /* A 完全不碰 JS：CSS 关键帧自己跑，才是“留在合成线程” */
      const b1 = $('.wc-b', stage);
      cycle(stage, 3000, function (t) {
        const p = EASE.easeInOut(t < 0.5 ? t * 2 : 2 - t * 2);
        b1.style.left = (p * 90) + 'px';
        b1.style.transform = '';
      });
    }
    if (mode === 'willchange') {
      /* A 常驻 will-change（写在 CSS 里），B 只在运动中段挂着、到端点就摘 —— 这才是这个术语的对比点 */
      const a1 = $('.wc-a', stage), b1 = $('.wc-b', stage);
      cycle(stage, 3000, function (t) {
        const p = EASE.easeInOut(t < 0.5 ? t * 2 : 2 - t * 2);
        const x = (p * 90).toFixed(1) + 'px';
        b1.style.willChange = (p > .03 && p < .97) ? 'transform' : 'auto';
        b1.style.transform = 'translateX(' + x + ')';
        a1.style.transform = 'translateX(' + x + ')';
      });
    }

    if (mode === 'perceived') {
      /* 这三条是运行时改写的文本，data-l10n 那套只认静态挂载点，所以自己按语言取 */
      const isEn = function () { return window.I18N && window.I18N.lang === 'en'; };
      /* 可逆：再点一次撤回，同样是「先给结果」。不需要额外的重置按钮 */
      $$('.orow', stage).forEach(function (row) {
        const btn = $('.obtn', row), st = $('.ost', row);
        let timer = 0;
        btn.addEventListener('click', function () {
          const on = row.classList.toggle('is-done');
          row.classList.remove('is-synced');
          btn.textContent = isEn() ? (on ? 'Undo' : 'Done') : (on ? '撤回' : '完成');
          st.textContent = isEn() ? 'Syncing…' : '同步中…';
          clearTimeout(timer);
          const wait = 700 + Math.round(Math.random() * 800);
          timer = setTimeout(function () {
            row.classList.add('is-synced');
            st.textContent = isEn() ? (on ? 'Saved · server replied after ' : 'Reverted · server replied after ') + wait + 'ms'
              : (on ? '已保存 · ' : '已撤回 · ') + wait + 'ms 后才回来';
          }, wait);
        });
      });
    }

    if (mode === 'purpose') {
      $$('.pcar', stage).forEach(function (car) {
        const slot = $('.pslot', car), fly = car.dataset.why === 'src';
        $$('.pitems s', car).forEach(function (it) {
          it.addEventListener('click', function () {
            slot.textContent = it.textContent;
            slot.classList.remove('flash'); void slot.offsetWidth; slot.classList.add('flash');
            if (!fly) return;
            const cr = stage.getBoundingClientRect(), a = it.getBoundingClientRect(), b = slot.getBoundingClientRect();
            const g = document.createElement('i');
            g.className = 'pghost'; g.textContent = it.textContent;
            g.style.left = (a.left - cr.left) + 'px'; g.style.top = (a.top - cr.top) + 'px';
            g.style.width = a.width + 'px'; g.style.height = a.height + 'px';
            stage.appendChild(g);
            const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
            const dy = (b.top + b.height / 2) - (a.top + a.height / 2);
            const an = g.animate([{ transform: 'translate(0,0) scale(1)', opacity: .95 },
              { transform: 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + (b.width / a.width).toFixed(3) + ')', opacity: .3 }],
              { duration: 420, easing: 'cubic-bezier(0.16,1,0.3,1)' });
            an.onfinish = function () { g.remove(); };
          });
        });
      });
    }

    if (mode === 'thrash') {
      const host = $('.ghost-cells', stage), run = $('.run', stage);
      let cells = [];
      const build = function () {
        const n = Math.round(prm('n', 200));
        host.innerHTML = '';
        for (let i = 0; i < n; i++) host.appendChild(Object.assign(document.createElement('i'), { className: 'gc' }));
        cells = $$('.gc', host);
        run.textContent = '运行基准 · ' + n + ' 次读写';
      };
      build();
      stage._apply = build;
      run.addEventListener('click', function () {
        /* offsetWidth 会取整，+0.2 写进去等于没写；用 getBoundingClientRect 才真的在变 */
        let t0 = performance.now();
        cells.forEach(function (el) { const r = el.getBoundingClientRect(); el.style.width = (r.width + .35) + 'px'; });
        const bad = performance.now() - t0;
        t0 = performance.now();
        const w = cells.map(function (el) { return el.getBoundingClientRect().width; });
        cells.forEach(function (el, i) { el.style.width = (w[i] + .35) + 'px'; });
        const good = performance.now() - t0;
        const max = Math.max(bad, good, 0.001);
        $('.brow .bbar.bad b', stage).style.transform = 'scaleX(' + (bad / max).toFixed(3) + ')';
        $('.brow .bbar.good b', stage).style.transform = 'scaleX(' + Math.max(0.02, good / max).toFixed(3) + ')';
        /* 必须限定在 this stage 内：全页有 raf 舞台和详情页另一实例，都带 .brow */
        $$('.brow', stage).forEach(function (r, i) { r.querySelector('em').textContent = (i ? good : bad).toFixed(2) + ' ms'; });
        host.classList.add('flash');
        setTimeout(function () { host.classList.remove('flash'); }, 420);
      });
    }

    if (mode === 'raf') {
      /* 原先两行量的是同一个 delta（prev / sPrev 都取自 rAF），所以数字永远相同。
         也不指望 setInterval 会“补发爆发”—— Chrome 把错过的多次只折叠成一次回调。
         真正可测的差别是相位：rAF 的回调时间戳就是这一帧，setInterval 落在帧内随机位置。 */
      const rows = $$('.brow', stage);
      const em = rows.map(r => r.querySelector('em'));
      const bars = [$('.bbar.raf b', stage), $('.bbar.si b', stage)];
      let frame = 0, prevFrame = 0, warm = 30, reported = 0, fSum = 0, fN = 0;
      let iPrev = 0, iSum = 0, iN = 0, iMax = 0, iGap = 0, gSum = 0, gN = 0;
      const iv = setInterval(function () {
        if (!window.ENGINE.motionOn() || !window.ENGINE.isVisible(stage)) { iPrev = 0; return; }
        const now = performance.now();
        if (iPrev && now - iPrev < 400) { const g = now - iPrev; gSum += g; gN++; if (g > iGap) iGap = g; }
        iPrev = now;
        if (!frame) return;
        const ph = now - frame;                       /* 距上一帧多久 */
        if (ph >= 0 && ph < 60) { iSum += ph; iN++; if (ph > iMax) iMax = ph; }
      }, 16.7);
      /* 挂到 stage 上：详情页逐出节点时（app.js dropDetail）清掉，否则每次打开都新增一个 */
      stage._iv = iv;
      watch(stage, function (now) {
        if (warm > 0) { warm--; prevFrame = now; frame = now; return; }
        if (prevFrame && now - prevFrame < 200) { fSum += now - prevFrame; fN++; }
        prevFrame = now; frame = now;
        if (now - reported > 900) {
          reported = now;
          const ph = iN ? iSum / iN : 0, gd = gN ? gSum / gN : 0, fd = fN ? fSum / fN : 0;
          em[0].textContent = '帧 ' + fd.toFixed(1) + 'ms · 相位 0ms';
          em[1].textContent = '隔 ' + gd.toFixed(1) + 'ms · 相位 ' + ph.toFixed(1) + 'ms';
          /* 条子表示“离这一帧的绘制点错开了多久”，越短越准 */
          bars[0].style.transform = 'scaleX(0.06)';
          bars[1].style.transform = 'scaleX(' + clamp(ph / 16.7, 0.06, 1).toFixed(3) + ')';
          iSum = iN = gSum = gN = fSum = fN = 0;
        }
      });
    }
  };

  M.scrollHTML = function (mode) {
    const rows = function (n, cls) {
      return Array.from({ length: n }, function (_, i) {
        return '<i class="' + (cls || 'srow-x') + '">' + (i + 1) + ' 屏内容</i>';
      }).join('');
    };
    if (mode === 'parallax') {
      return '<div class="scrolly" data-mode="parallax"><div class="plx far">远山</div><div class="plx mid">中景</div>' +
        '<div class="plx near">近景</div><div class="plxtall"></div></div>';
    }
    if (mode === 'sticky') {
      return '<div class="scrolly" data-mode="sticky"><div class="stick"><b>钉住的标题</b><em class="sc-count">0%</em></div>' +
        '<div class="sflow">' + rows(6) + '</div></div>';
    }
    if (mode === 'progress') {
      return '<div class="scrolly" data-mode="progress"><i class="sp-bar"></i><div class="sflow">' + rows(7) + '</div></div>';
    }
    if (mode === 'smooth') {
      return '<div class="scrolly" data-mode="smooth"><div class="navrow tight">' +
        ['第一段', '第二段', '第三段'].map(function (t, i) { return '<button type="button" class="mini sm" data-i="' + i + '">' + t + '</button>'; }).join('') +
        '</div><div class="sflow">' + rows(3, 'ssec') + '</div></div>';
    }
    if (mode === 'map') {
      return '<div class="scrolly" data-mode="map"><b class="mp-title">字号</b><div class="sflow">' + rows(6) + '</div></div>';
    }
    if (mode === 'snap') {
      return '<div class="scrolly snap" data-mode="snap"><i class="snr a">面板 1</i><i class="snr b">面板 2</i><i class="snr c">面板 3</i></div>';
    }
    if (mode === 'story') {
      return '<div class="scrolly" data-mode="story"><div class="st-chart"><u></u><u></u><u></u><u></u></div>' +
        '<div class="sflow">' + ['第一章 · 起点', '第二章 · 转折', '第三章 · 峰值', '第四章 · 结论'].map(function (t, i) {
          return '<i class="step" data-s="' + i + '">' + t + '</i>';
        }).join('') + '</div></div>';
    }
    if (mode === 'hijack') {
      return '<div class="scrolly hijack" data-mode="hijack"><i class="hj">第 1 屏</i><i class="hj">第 2 屏</i><i class="hj">第 3 屏</i></div>' +
        '<p class="bnote">到最后一屏后放行，避免把用户关在里面</p>';
    }
    if (mode === 'loadmore') {
      return '<div class="scrolly" data-mode="loadmore"><div class="lm-list">' + rows(3) + '</div><i class="sentinel"></i></div>';
    }
    return '<div class="scrolly" data-mode="' + (mode || 'reveal') + '"><div class="sflow">' +
      ['入场动画只播一次', '第二块内容', '第三块内容', '第四块内容', '第五块内容'].map(function (t, i) {
        return '<i class="rv">' + t + '</i>';
      }).join('') + '</div></div>';
  };

  M.KINDS.scroll = function (stage, s) {
    const box = $('.scrolly', stage);
    if (!box) return;
    const mode = s.mode;
    const prog = function () {
      const max = box.scrollHeight - box.clientHeight;
      return max > 0 ? clamp(box.scrollTop / max, 0, 1) : 0;
    };
    const items = $$('.rv', box);
    const plx = $$('.plx', box);
    const bar = $('.sp-bar', box);
    const title = $('.mp-title', box);
    const chart = $('.st-chart', box);
    const steps = $$('.step', box);
    const count = $('.sc-count', box);
    const sentinel = $('.sentinel', box);
    const list = $('.lm-list', box);
    let n = 3;

    const update = function () {
      const p = prog();
      if (mode === 'reveal' || !mode) {
        items.forEach(function (el) {
          const r = el.getBoundingClientRect(), br = box.getBoundingClientRect();
          if (r.top < br.bottom - 24) el.classList.add('on');
        });
      }
      if (mode === 'driven') {
        items.forEach(function (el) {
          const r = el.getBoundingClientRect(), br = box.getBoundingClientRect();
          const t = clamp((br.bottom - r.top) / (br.height * 0.75), 0, 1);
          const e = EASE.easeOut(t);
          el.style.opacity = String(e);
          el.style.transform = 'translateY(' + ((1 - e) * 26) + 'px) scale(' + (0.96 + e * 0.04) + ')';
        });
      }
      if (mode === 'parallax') {
        const y = box.scrollTop;
        plx.forEach(function (el, i) {
          const f = [0.14, 0.4, 0.85][i] || 0;
          el.style.transform = 'translateY(' + (-y * f) + 'px)';
        });
      }
      if (mode === 'sticky' && count) count.textContent = Math.round(p * 100) + '%';
      if (mode === 'progress' && bar) bar.style.transform = 'scaleX(' + p + ')';
      if (mode === 'map' && title) {
        const size = 12 + EASE.easeOutExpo(p) * 26;
        title.style.fontSize = size.toFixed(1) + 'px';
        title.style.letterSpacing = ((1 - p) * 4).toFixed(2) + 'px';
      }
      if (mode === 'story' && chart) {
        const idx = clamp(Math.floor(p * steps.length), 0, steps.length - 1);
        steps.forEach(function (el, i) { el.classList.toggle('on', i === idx); });
        $$('.st-chart u', box).forEach(function (u, i) {
          u.style.transform = 'scaleY(' + (0.18 + clamp((p - i * 0.2) * 3, 0, 1) * (0.5 + i * 0.22)) + ')';
        });
      }
      if (mode === 'loadmore' && sentinel) {
        const r = sentinel.getBoundingClientRect(), br = box.getBoundingClientRect();
        if (r.top < br.bottom + 40 && !box._busy) {
          box._busy = true;
          const sk = document.createElement('i');
          sk.className = 'srow-x skel'; sk.textContent = '加载中…';
          list.appendChild(sk);
          setTimeout(function () {
            sk.remove();
            for (let i = 0; i < 2; i++) {
              n++;
              list.insertAdjacentHTML('beforeend', '<i class="srow-x enter">第 ' + n + ' 条 · 追加</i>');
            }
            box._busy = false;
          }, 700);
        }
      }
    };
    box.addEventListener('scroll', update, { passive: true });
    update();

    if (mode === 'smooth') {
      $$('.sm', box).forEach(function (b) {
        b.addEventListener('click', function () {
          const secs = $$('.ssec', box);
          const el = secs[+b.dataset.i];
          if (el) box.scrollTo({ top: el.offsetTop - 8, behavior: window.ENGINE.motionOn() ? 'smooth' : 'auto' });
        });
      });
    }
    if (mode === 'driven') {
      items.forEach(function (el) { el.style.willChange = 'transform, opacity'; });
    }
    if (mode === 'hijack') {
      const panes = $$('.hj', box);
      let idx = 0, lock = 0;
      const go = function (i) {
        idx = clamp(i, 0, panes.length - 1);
        box.scrollTo({ top: idx * box.clientHeight, behavior: window.ENGINE.motionOn() ? 'smooth' : 'auto' });
      };
      box.addEventListener('wheel', function (e) {
        if (idx === 0 && e.deltaY < 0) return;              /* 顶部向上：放行给页面 */
        if (idx === panes.length - 1 && e.deltaY > 0) return; /* 底部向下：放行给页面 */
        e.preventDefault();
        if (performance.now() < lock) return;
        lock = performance.now() + 520;
        go(idx + (e.deltaY > 0 ? 1 : -1));
      }, { passive: false });
      box._hijack = go;
    }
  };


  /* ================= 7. 指针跟随类 behavior ================= */
  M.BEHAVIORS.tilt = function (stage, s, term) {
    const card = $('.tilt-target', stage) || $('.obj', stage);
    stage.addEventListener('pointermove', function (e) {
      const r = stage.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -14;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 16;
      card.style.transform = 'perspective(700px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
    });
    stage.addEventListener('pointerleave', function () {
      card.style.transform = 'perspective(700px)';
      card.style.transition = 'transform 600ms ' + EO;
      setTimeout(() => card.style.transition = '', 600);
    });
  };

  M.BEHAVIORS.magnet = function (stage) {
    const btn = $('.magnet', stage);
    stage.addEventListener('pointermove', function (e) {
      const r = btn.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      const cx = sr.left + sr.width / 2, cy = sr.top + sr.height / 2;
      const d = Math.hypot(e.clientX - cx, e.clientY - cy);
      const k = clamp(1 - d / (sr.width * 0.42), 0, 1);
      btn.style.transform = 'translate(' + ((e.clientX - cx) * 0.34 * k).toFixed(1) + 'px,' + ((e.clientY - cy) * 0.34 * k).toFixed(1) + 'px)';
    });
    stage.addEventListener('pointerleave', () => btn.style.transform = '');
  };

  M.BEHAVIORS.originAware = function (stage) {
    const sheet = $('.origin-demo', stage);
    stage.addEventListener('pointerdown', function (e) {
      const r = sheet.getBoundingClientRect();
      const x = clamp(e.clientX - r.left, 0, r.width), y = clamp(e.clientY - r.top, 0, r.height);
      sheet.style.transformOrigin = x + 'px ' + y + 'px';
      sheet.animate([{ transform: 'scale(.2)', opacity: .35 }, { transform: 'none', opacity: 1 }], { duration: 520, easing: EO });
    });
  };

  M.BEHAVIORS.highlight = function (stage) {
    const el = $('.hl', stage);
    let open = false;
    const go = function () {
      open = !open;
      el.style.backgroundSize = (open ? 100 : 0) + '% 42%';
    };
    el.style.transition = 'background-size 520ms ' + EO;
    go();
    cycle(stage, 2600, function (t) { if (t < 0.02) go(); });
  };

  return M;
})();
