/* ============================================================
   app.js —— 演示引擎 + 检索/导航/配方
   依赖：ease.js, data1.js, data2.js, motion.js
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  /* localStorage 是外部可写的边界：值可能是别的类型，不能让它在 boot() 里炸掉后半程 */
  const readList = (k) => {
    let v = [];
    try { v = JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; }
    return Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];
  };

  /* ---------------- 关键帧生成（按内容去重） ---------------- */
  const KF = new Map();
  function kfName(frames) {
    const body = frames.map(f => f[0] + '%{' + f[1] + '}').join('');
    if (!KF.has(body)) KF.set(body, 'kf' + (KF.size + 1));
    return KF.get(body);
  }
  function animCSS(sel, frames, o) {
    o = o || {};
    if (!frames || !frames.length) return '';
    const iter = o.loop ? 'infinite' : (o.repeat || 1);
    const dir = o.dir || (o.alt ? 'alternate' : 'normal');
    const fill = o.nofill ? 'none' : 'both';
    const wait = o.wait || '0ms';
    /* 时长留一个 --dur 后门：卡片上的参数滑块只写自定义属性，不用重新生成关键帧 */
    const d = 'var(--dur,' + (o.d || '520ms') + ')';
    return sel + '{animation:' + kfName(frames) + ' ' + d + ' ' +
      (o.e || 'cubic-bezier(0.16,1,0.3,1)') + ' ' + wait + ' ' + iter + ' ' + dir + ' ' + fill + ';}';
  }

  /* 演示舞台上被驱动的目标元素 */
  const SEL_BY_FLAG = {
    wipe: '.wipebar', scene: '.d25', inner: '.fill', underline: '.link::after',
    shimmer: '.sk i', bar: '.fill', marquee: '.marquee', orbit: '.orbit-box',
    ambient: '.amb i', burst: '.burst i', grain: '.noise', sweep: '.beam',
    dof: '.dof .card', bokeh: '.bokeh i', cam: '.cam', stack: '.stack',
    dissolve: '.diss.a', caret: '.caret', ball: '.obj',
    pan: '.panstrip', turn: '.turn', follow: '.follow i', secondary: '.sec i',
    staging: '.stage3 i:not(.hot)'
  };
  function targetSel(s) {
    for (const k in SEL_BY_FLAG) if (s[k]) return ' ' + SEL_BY_FLAG[k];
    return ' .obj';
  }

  /* ---------------- 舞台 HTML ---------------- */
  function objHtml(s) { return s.html || '<div class="obj"></div>'; }

  function repeat(html, n) {
    let out = '';
    for (let i = 0; i < Math.max(1, n || 1); i++) out += html;
    return out;
  }

  function subStage(s, cls) {
    return '<div class="sub ' + cls + '"><i class="tag">' + esc(s.label || '') + '</i>' +
      '<div class="substage">' + repeat(objHtml(s), s.multi || 1) + '</div></div>';
  }

  function stageHTML(t) {
    const s = t.demo || {};
    switch (s.kind) {
      case 'track':
        return '<div class="lane"><i class="rail"></i><i class="mk ref" data-t="ref"></i>' +
          '<i class="mk live" data-t="live"></i><span class="lane-lbl" data-l10n="灰色=匀速参照">灰色=匀速参照</span></div>';
      case 'curve':
        return '<div class="curvebox"><canvas class="cv" width="240" height="170"></canvas>' +
          '<div class="cprobe"><i></i></div></div>';
      case 'spring': {
        const rows = ['<div class="srow" data-i="0"><i class="obj scol"></i><b>' +
          esc(s.p ? 'k=' + s.p[0] + ' c=' + s.p[1] + ' m=' + s.p[2] : 'spring') + '</b></div>'];
        if (s.p2) rows.push('<div class="srow" data-i="1"><i class="obj scol alt"></i><b>' +
          esc('k=' + s.p2[0] + ' c=' + s.p2[1] + ' m=' + s.p2[2]) + '</b></div>');
        return '<div class="springbox" data-p="' + (s.p || []).join(',') + '" data-p2="' +
          (s.p2 || []).join(',') + '"' + (s.interactive ? ' data-live="1"' : '') + '>' + rows.join('') + '</div>';
      }
      case 'two':
        return '<div class="twostage">' + subStage(s.a, 'a') + subStage(s.b, 'b') + '</div>';
      case 'scroll':
        return window.MOTION.scrollHTML(s.mode);
      case 'list':
        return window.MOTION.listHTML(s.mode);
      case 'drag':
        return window.MOTION.dragHTML(s.mode);
      case 'morph':
        return window.MOTION.morphHTML(s.mode);
      case 'type':
        return window.MOTION.typeHTML(s.mode);
      case 'draw':
        return window.MOTION.drawHTML();
      case 'perf':
        return window.MOTION.perfHTML(s.mode);
      default:
        if (window.MOTION.KINDS[s.kind] && window.MOTION.htmlFor) return window.MOTION.htmlFor(s);
        return '<div class="stagein">' + repeat(objHtml(s), s.multi || 1) + '</div>';
    }
  }

  /* ---------------- 舞台 CSS ---------------- */
  function stageCSS(t) {
    const s = t.demo || {};
    const root = '.t-' + t.id;
    if (s.kind === 'two') {
      return animCSS(root + ' .sub.a .substage' + targetSel(s.a), s.a.frames, s.a) +
        animCSS(root + ' .sub.b .substage' + targetSel(s.b), s.b.frames, s.b) +
        animCSS(root + ' .sub.a .tag', [[0, 'opacity:0'], [100, 'opacity:1']], { d: '200ms', e: 'linear' }) +
        animCSS(root + ' .sub.b .tag', [[0, 'opacity:0'], [100, 'opacity:1']], { d: '200ms', e: 'linear' });
    }
    /* 由 JS 全权驱动的舞台（轨道、曲线、弹簧、运行时场景…）不需要生成关键帧 */
    if (window.MOTION.KINDS[s.kind]) return window.MOTION.extraCSS ? window.MOTION.extraCSS(t) : '';
    if (s.play === 'hover') {
      return animCSS(root + ' .stage:hover' + targetSel(s), s.frames, Object.assign({}, s, { d: s.d || '220ms' }));
    }
    if (s.play === 'press') {
      return animCSS(root + '.pressing .stage' + targetSel(s), s.frames, s);
    }
    if (s.behavior) return window.MOTION.extraCSS(t);
    /* 互补双层的演示（溶解 / 拉焦）：B 层反相位播放 */
    if (s.dissolve || s.rack) {
      const pair = s.dissolve ? ['.diss.a', '.diss.b'] : ['.rack .a', '.rack .b'];
      return animCSS(root + ' .stage ' + pair[0], s.frames, s) +
        animCSS(root + ' .stage ' + pair[1], s.frames, Object.assign({}, s, { alt: false, dir: 'alternate-reverse' }));
    }
    return animCSS(root + ' .stage' + targetSel(s), s.frames, s);
  }

  /* ---------------- 卡片 ---------------- */
  /* 卡片只留“动效 + 名称 + 一句话”，完整内容在详情弹窗里 */
  function briefOf(def) {
    const d = def || '';
    const m = /^[^。！？!?；;]{1,44}/.exec(d);
    const cut = m ? m[0] : d;
    return cut + (cut.length < d.length ? '…' : '');
  }
  function stageAttrs(s) {
    return (s.fn ? ' data-fn="' + s.fn + '"' : '') +
      (s.p ? ' data-p="' + s.p.join(',') + '"' : '') +
      (s.p2 ? ' data-p2="' + s.p2.join(',') + '"' : '') +
      (s.interactive ? ' data-live="1"' : '');
  }
  /* ---------------- 卡片内的核心参数控制 ---------------- */
  function ctlHTML(s) {
    if (!s.ctl || !s.ctl.length) return '';
    return '<div class="pctl">' + s.ctl.map(function (c) {
      return '<label class="pk-i"><span data-l10n="' + esc(c.l) + '">' + esc(c.l) + '</span>' +
        '<input type="range" data-p="' + c.p + '" data-u="' + (c.u || '') + '" min="' + c.min + '" max="' + c.max +
        '" step="' + (c.step == null ? 1 : c.step) + '" value="' + c.v + '" aria-label="' + esc(c.l) + '" data-l10n="' + esc(c.l) + '" data-l10n-attr="aria-label">' +
        '<output>' + c.v + (c.u || '') + '</output></label>';
    }).join('') + '</div>';
  }
  function initCtl(stage, term) {
    const s = term.__demo, bar = $('.pctl', term);   /* 控制条在舞台外面，得从整张卡找 */
    if (!bar) return;
    s.ctl.forEach(function (c) { stage._prm[c.p] = c.v; });
    const run = function () {
      Object.keys(stage._prm).forEach(function (k) {
        const c = s.ctl.filter(function (x) { return x.p === k; })[0];
        stage.style.setProperty('--' + k, stage._prm[k] + (c && c.u ? c.u : ''));
      });
      /* 错峰间隔、时长：都交给 applyTiming 统一施加，重播也不会被冲掉 */
      if (stage._staggerEls || stage._prm.dur != null) applyTiming(stage);
      if (stage._apply) stage._apply();
      if (s.kind === 'track' || s.kind === 'curve') replay(stage);
      /* 滚动映射类的舞台要立刻重算一次，否则得再滚一下才看得到变化 */
      const box = $('.scrolly', stage);
      if (box) box.dispatchEvent(new Event('scroll'));
    };
    bar.addEventListener('input', function (e) {
      const i = e.target.closest('input[data-p]'); if (!i) return;
      stage._prm[i.dataset.p] = +i.value;
      const o = i.parentNode.querySelector('output');
      if (o) o.textContent = i.value + (i.dataset.u || '');
      run();
    });
    run();
  }

  /* 指针 / 滚动驱动的舞台在 hover 时重播没有意义，反而每帧扫一遍几十上百个节点 */
  function playOf(t) { const d = t.demo || {}; return d.play || (d.kind === 'compound' ? 'none' : 'in'); }

  function stageBlock(t, withTools) {
    const s = t.demo || {};
    const hint = s.hint || ({ list: '点一下试试', drag: '动手拖一下', type: '自动循环播放', perf: '数字是现场量出来的', morph: '自动循环', scroll: '在框里滚动', compound: '可用方向键 / 回车操作' }[s.kind] || '');
    const canReplay = !s.kind || ['frames', 'two', 'track', 'curve', 'spring', 'perf'].indexOf(s.kind) >= 0;
    /* 组合范式由输入驱动，慢放与循环对它没有任何作用，就别摆一对死控件 */
    const hasCtl = !!(s.ctl && s.ctl.length);
    const ctl = hasCtl ? '<div class="dt-ctl">' +
      '<span class="ctl-lbl" data-l10n="慢放">慢放</span>' +
      '<span class="seg" data-seg>' +
      '<button type="button" class="seg-b on" data-sp="1">1×</button>' +
      '<button type="button" class="seg-b" data-sp="0.5">½×</button>' +
      '<button type="button" class="seg-b" data-sp="0.25">¼×</button>' +
      '</span>' +
      (s.kind === 'frames' || s.kind === 'two' || !s.kind ? '<label class="ctl-chk"><input type="checkbox" data-loop><span data-l10n="循环播放">循环播放</span></label>' : '') +
      '</div>' : '';
    const kb = s.kind === 'compound' ? ' tabindex="0" aria-label="' + esc(t.en + ' ' + t.zh + '：' + hint) + '"' : '';
    const bar = ctlHTML(s);
    let contactFrames = '';
    if (withTools && s.kind === 'compound' && s.mode === 'frames') {
      for (let i = 0; i < 24; i++) {
        const shift = ((.5 - i / 23) * 18).toFixed(1);
        /* 接触表本身就是读数的一部分，24 张都要在面板出现时可见，不能用 lazy 让后半段变成空白占位。 */
        contactFrames += '<s data-frame="' + (i + 1) + '" aria-label="第 ' + (i + 1) + ' 帧" style="--frame-shift:' + shift + '%"><img src="assets/img/p16.jpg" alt="第 ' + (i + 1) + ' 帧" draggable="false"><b>' + String(i + 1).padStart(2, '0') + '</b></s>';
      }
    }
    const compoundReadout = withTools && s.kind === 'compound' && s.mode === 'frames'
      ? '<aside class="fr-readout" aria-label="抽帧实时读数" data-l10n="抽帧实时读数" data-l10n-attr="aria-label"><div class="fr-readout-head"><b><i></i> LIVE READOUT</b><span>SCROLL</span></div>' +
        '<div class="fr-readout-main"><small>FRAME</small><strong data-fr-out="frame">01</strong><em data-fr-out="total">/24</em></div>' +
        '<div class="fr-readout-grid"><div><small>PROGRESS</small><b data-fr-out="progress">0%</b></div><div><small>SAMPLES</small><b data-fr-out="samples">24</b></div></div>' +
        '<div class="fr-readout-track"><i data-fr-out="track"></i></div>' +
        '<div class="fr-contact-head"><span>FRAME CONTACT SHEET</span><b>24</b></div><div class="fr-contact" aria-label="24 张实际帧缩略图" data-l10n="24 张实际帧缩略图" data-l10n-attr="aria-label">' + contactFrames + '</div>' +
        '<p data-l10n="左侧是实际预览，右侧接触表标出当前采样帧。">左侧是实际预览，右侧接触表标出当前采样帧。</p></aside>'
      : withTools && s.kind === 'compound' && s.mode === 'gaze'
      ? '<aside class="gz-readout" aria-label="视线跟随实时读数" data-l10n="视线跟随实时读数" data-l10n-attr="aria-label"><div class="gz-readout-head"><b><i></i> LIVE READOUT</b><span data-gz-out="mode">AUTONOMOUS</span></div>' +
        '<div class="gz-readout-state" aria-live="polite"><i></i><strong data-gz-out="state">IDLE LOOP</strong><small>gaze target</small></div>' +
        '<div class="gz-readout-focus"><div><small>FOCUS VECTOR</small><strong><span data-gz-out="x">+00</span><em> × </em><span data-gz-out="y">+00</span></strong></div><div class="gz-readout-lag"><small>LAG</small><b data-gz-out="lag">0%</b></div></div>' +
        '<div class="gz-map" aria-hidden="true"><span class="gz-map-axis x"></span><span class="gz-map-axis y"></span><i class="gz-map-center"></i><i class="gz-map-dot"></i><b>−X</b><b>+X</b><em>−Y</em><em>+Y</em></div>' +
        '<div class="gz-readout-grid"><div><small>SMOOTH</small><b data-gz-out="smooth">0.16</b></div><div><small>RANGE</small><b data-gz-out="range">7.5px</b></div></div>' +
        '<p data-l10n="指针决定目标方向；松开后，视线回到低频游走。">指针决定目标方向；松开后，视线回到低频游走。</p></aside>'
      : '';
    /* 卡片：舞台下面直接跟参数条。弹窗：参数条排在慢放/循环之下，别挤在演示和工具条中间 */
    const modeAttr = s.kind === 'compound' && s.mode ? ' data-mode="' + esc(s.mode) + '"' : '';
    return '<div class="stage kind-' + (s.kind || 'frames') + '"' + stageAttrs(s) + modeAttr + kb + '>' +
      stageHTML(t) + '</div>' +
      compoundReadout +
      (withTools ? '<div class="stage-tools">' + (hint ? '<span class="hint" data-l10n="' + esc(hint) + '">' + esc(hint) + '</span>' : '<span></span>') +
        (canReplay ? '<button class="tool replay" type="button">↻ 重播</button>' : '') + '</div>' + ctl + bar
        : bar);
  }
  function cardCls(t) {
    const s = t.demo || {};
    return 'term' + (s.ctl ? ' has-ctl' : '') + (s.ctl && s.ctl.length > 2 ? ' ctl-n3' : '');
  }
  function cardHTML(t) {
    return '<article class="' + cardCls(t) + ' t-' + t.id + ' cat-' + t.cat + '" data-id="' + t.id + '" data-cat="' + t.cat +
      '" data-play="' + playOf(t) + '" tabindex="0" role="button" aria-label="' + esc(t.en) + ' ' + esc(t.zh) + '">' +
      stageBlock(t, false) +
      '<div class="term-main"><h3 class="en">' + esc(t.en) + '</h3><p class="zh">' + esc(t.zh) + '</p>' +
      '<p class="brief">' + esc(briefOf(t.def)) + '</p></div>' +
      '<span class="open-mark" aria-hidden="true">↗</span></article>';
  }
  function detailHTML(t) {
    const code = window.DIALECTS ? window.DIALECTS.codeFor(t) : t.code;
    /* 只有带结构化 frames 的术语能被编译成七种方言；组合范式给的是手写实现 */
    const live = !window.DIALECTS || window.DIALECTS.compilable(t);
    const cat = window.CATS.filter(c => c.id === t.cat)[0] || {};
    return '<article class="' + cardCls(t) + ' term--detail t-' + t.id + ' cat-' + t.cat + '" data-id="' + t.id + '" data-cat="' + t.cat +
      '" data-play="' + playOf(t) + '">' +
      '<p class="pg-kicker"><span data-l10n="' + esc(cat.name || '') + '">' + esc(cat.name || '') + '</span> · ' + esc(t.en) + '</p>' +
      '<h2 class="pg-title" id="page-title">' + esc(t.zh) + '<em>' + esc(t.en) + '</em></h2>' +
      /* 这块就是卡片里那个舞台形变而来的地方，所以 VT 名字挂在它身上 */
      '<div class="pg-visual">' + stageBlock(t, true) + '</div>' +
      '<blockquote class="callout"><b>' + esc(L('maySay')) + '</b><p>' + esc(t.vague) + '</p></blockquote>' +
      '<p class="pg-def">' + esc(t.def) + '</p>' +
      '<div class="pg-say"><b class="sw sharp">' + esc(L('sayIt')) + '</b><span>' + esc(t.say) + '</span></div>' +
      (code ? '<div class="codewrap' + (live ? '' : ' is-static') + '">' +
        (live ? '' : '<span class="code-note">' + esc(L('codeStatic')) + '</span>') +
        '<button class="copy" type="button">复制</button><pre><code>' + esc(code) + '</code></pre></div>' : '') +
      (window.REFS ? window.REFS.panelHTML(t.id) : '') +
      '<div class="foot"><div class="alias">' +
      (t.alias || []).map(a => '<span>' + esc(a) + '</span>').join('') +
      '</div><button class="add" type="button" data-add="' + t.id + '">+ 加入配方</button></div>' +
      '</article>';
  }

  /* ---------------- 详情弹窗 ---------------- */
  /* 缓存详情节点是为了「关了再开」不用重建，但只进不出会常驻几百棵 detached DOM
     树和一堆观察器，所以给个 LRU 上限，逐出时把挂在节点上的资源一起松手 */
  const DETAIL_MAX = 20;
  const detailCache = new Map();
  function dropDetail(node) {
    const stage = $('.stage', node);
    if (stage) {
      io.unobserve(stage);
      if (stage._iv) { clearInterval(stage._iv); stage._iv = null; }
      if (stage._ro) { stage._ro.disconnect(); stage._ro = null; }
      if (stage._update) tickers.delete(stage._update);
    }
    node.remove();
  }
  function detailNode(id) {
    let c = detailCache.get(id);
    if (c) {
      detailCache.delete(id);   /* 删了重插：Map 的插入序就是访问序，充当 LRU */
      /* 缓存里留着但 DOM 里只挂当前这一条（见 openDetail），回来时重新挂上 */
      if (!c.isConnected) $('#page-body').appendChild(c);
    } else {
      const term = TERMS_BY_ID[id]; if (!term) return null;
      const host = $('#page-body');
      const wrap = document.createElement('div');
      wrap.innerHTML = detailHTML(term);
      c = wrap.firstElementChild;
      c.__demo = term.demo || {};
      host.appendChild(c);
      try { mountStage(c); } catch (err) { console.warn('详情挂载失败：' + id, err); }
      if (window.I18N) window.I18N.refreshTerms(c);   /* 只刷这一条，全站刷一遍是 2000+ 次 DOM 查询 */
    }
    detailCache.set(id, c);
    while (detailCache.size > DETAIL_MAX) {
      const oldest = detailCache.keys().next().value;
      dropDetail(detailCache.get(oldest));
      detailCache.delete(oldest);
    }
    return c;
  }

  /* ---------- 卡片 ⇄ 详情页：共享元素形变 + 方向性翻页 ----------
     参考 vibe-hub.org：舞台那块矩形从卡片长到页面顶部（ml-visual），正文整块淡入；
     翻页时正文按方向横向交接。不支持 VT 的浏览器退回 WAAPI。 */
  const HAS_VT = typeof document.startViewTransition === 'function';
  const VIS_NAME = 'ml-visual';
  const ML_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  function vt(run, after) {
    let ran = false, settled = false;
    const once = function () { if (ran) return; ran = true; run(); };
    const settle = function () { if (settled) return; settled = true; if (after) after(); };
    let t = null;
    if (HAS_VT && motionOn) { try { t = document.startViewTransition(once); } catch (e) { t = null; } }
    if (!t) { once(); settle(); return; }
    t.finished.then(settle, settle);
    /* 连点两张卡时后一次转场会抢占前一次，ready 被拒；不接住就是控制台一条未捕获异常 */
    if (t.ready) t.ready.catch(function () {});
    /* 后台标签页不产帧，VT 回调可能永远不来：兜底只补跑一次，不与 finished 的兑现撞车 */
    setTimeout(function () { if (!ran) { once(); settle(); } }, 140);
  }
  function setDir(dir) {
    if (dir) document.documentElement.dataset.dir = dir > 0 ? 'next' : 'prev';
    else document.documentElement.removeAttribute('data-dir');
  }
  function cardVis(card) { return card ? $('.stage', card) : null; }

  let lastCard = null, pageBusy = false, pageToken = 0, paintDialect = null, favOnly = false;
  let favs = readList('motion-fav');
  const pg = () => $('#page');

  function syncFav(id) {
    const on = favs.indexOf(id) >= 0, b = $('#page-fav');
    if (b) { b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); }
    const n = $('#fav-count'); if (n) n.textContent = favs.length;
    $$('.term:not(.term--detail)').forEach(el => el.classList.toggle('faved', favs.indexOf(el.dataset.id) >= 0));
  }
  function toggleFav(id) {
    const i = favs.indexOf(id);
    if (i >= 0) favs.splice(i, 1); else favs.push(id);
    try { localStorage.setItem('motion-fav', JSON.stringify(favs)); } catch (e) {}
    syncFav(id);
  }
  function syncCrumb() {
    const id = pg().dataset.id; if (!id) return;
    const t = TERMS_BY_ID[id]; if (!t) return;
    const en = window.I18N && window.I18N.lang === 'en';
    $('#page-crumb').textContent = en ? t.en : t.zh;
    document.title = (en ? t.en + ' · ' + t.zh : t.zh + ' · ' + t.en) + ' — ' + L('brand1');
    syncEdgeNav(id);
  }
  function syncEdgeNav(id) {
    [['prev', -1, '#page-prev'], ['next', 1, '#page-next']].forEach(function (pair) {
      const el = $(pair[2]), nid = siblingId(id, pair[1]);
      if (!el) return;
      const t = nid ? TERMS_BY_ID[nid] : null;
      el.disabled = !t;
      el.querySelector('span').textContent = t ? ((window.I18N && window.I18N.lang === 'en') ? t.en : t.zh) : '';
      el.dataset.to = nid || '';
      /* 收成圆钮后只能靠 title 知道对端是哪条术语 */
      el.title = el.querySelector('span').textContent || '';
    });
  }

  function showPage(id) {
    const p = pg();
    p.hidden = false;
    p.dataset.id = id;
    document.documentElement.classList.add('has-page');
  }

  function openDetail(id, src, dir) {
    const node = detailNode(id); if (!node) return;
    const p = pg();
    pageToken++; pageBusy = false;
    setDir(dir);
    /* 只保留当前这一条详情节点：以前是给它加 hidden，节点永久留在 DOM 里，
       实测翻完 229 条后 DOM 里躺着 229 个 .term--detail、19,851 个元素（干净 4,242） */
    $$('.term--detail', $('#page-body')).forEach(n => { if (n !== node) n.remove(); });
    const term = TERMS_BY_ID[id], en = window.I18N && window.I18N.lang === 'en';
    $('#page-crumb').textContent = en ? term.en : term.zh;
    document.title = (en ? term.en + ' · ' + term.zh : term.zh + ' · ' + term.en) + ' — ' + L('brand1');
    syncFav(id); syncEdgeNav(id);
    const stage = node.querySelector('.stage');
    if (src) lastCard = src;
    const open = !p.hidden && p.dataset.id === id;
    const reveal = function () {
      if (!p.hidden && p.dataset.id === id) { p.scrollTop = 0; return; }
      showPage(id);
      pinVisible(stage, true);
      replay(stage);
      if (window.REFS) window.REFS.wire(node, id);
      if (window.HUD) window.HUD.wire(node, id);
      p.scrollTop = 0;
      /* 焦点跟进来：不然键盘/读屏用户点开卡片后焦点仍留在被盖住的那一侧 */
      try { p.focus({ preventScroll: true }); } catch (e) {}
    };
    const cv = (!open && lastCard) ? cardVis(lastCard) : null;
    if (HAS_VT && motionOn && cv) {
      cv.style.viewTransitionName = VIS_NAME;
      vt(function () {
        reveal();
        cv.style.viewTransitionName = '';
      }, function () { cv.style.viewTransitionName = ''; setDir(0); });
    } else {
      reveal();
      if (!open && motionOn && node.animate) {
        node.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: ML_EASE });
      } else if (dir) {
        slideSwap(null, node, dir);
      }
      setDir(0);
    }
    if (location.hash !== '#term/' + id) { try { history.pushState(null, '', '#term/' + id); } catch (e) {} }
  }

  function hidePage(src) {
    const p = pg();
    if (!p.hidden) {
      $$('.term--detail', $('#page-body')).forEach(function (n) {
        pinVisible(n.querySelector('.stage'), false);
        /* 移除而不是加 hidden：hidden 是旧方案残留，缓存节点重挂时没人清掉它，
           导致「关了再开同一条」整块正文 display:none。节点本体在 detailCache 里 */
        n.remove();
      });
      p.hidden = true;
      p.removeAttribute('data-id');
      document.documentElement.classList.remove('has-page');
    }
    if (src) { const cv = cardVis(src); if (cv) cv.style.viewTransitionName = ''; }
    document.title = L('docTitle');
  }

  function closeDetail() {
    const p = pg();
    if (p.hidden || pageBusy) return;
    pageBusy = true;
    const id = p.dataset.id, tok = ++pageToken;
    const src = (lastCard && lastCard.isConnected) ? lastCard : document.querySelector('.term[data-id="' + id + '"]:not(.term--detail)');
    setDir(0);
    const done = function () {
      if (tok !== pageToken) return;
      pageBusy = false;
      hidePage(src);
    };
    const cv = src ? cardVis(src) : null;
    if (HAS_VT && motionOn && cv) {
      cv.style.viewTransitionName = VIS_NAME;
      vt(function () { done(); }, function () { cv.style.viewTransitionName = ''; });
    } else {
      done();
    }
    if (/^#term\//.test(location.hash)) { try { history.pushState(null, '', location.pathname + location.search); } catch (e) {} }
    if (src && src.focus) { try { src.focus({ preventScroll: true }); } catch (e) {} }
  }

  /* 上一个 / 下一个：在当前可见的卡片序列里走 */
  function siblingId(id, dir) {
    const list = $$('.term:not(.term--detail)').filter(el => !el.hidden).map(el => el.dataset.id);
    const i = list.indexOf(id);
    if (i < 0) return null;
    const j = i + dir;
    return j >= 0 && j < list.length ? list[j] : null;
  }
  function gotoSibling(dir, targetId) {
    const cur = pg().dataset.id;
    const next = targetId || siblingId(cur, dir);
    if (!next) return;
    const card = document.querySelector('.term[data-id="' + next + '"]:not(.term--detail)');
    if (card) card.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    openDetail(next, card, dir);
  }

  /* 不支持 View Transitions 时，翻页自己用 WAAPI 做方向性横向交接 */
  function slideSwap(outNode, inNode, dir) {
    if (!motionOn || !inNode || !inNode.animate) return;
    const K = Math.min(72, (window.innerWidth || 900) * 0.055);
    if (outNode && outNode.animate) {
      outNode.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-dir * K) + 'px)' }],
        { duration: 170, easing: 'cubic-bezier(0.4, 0, 1, 1)' });
    }
    inNode.animate([{ opacity: 0, transform: 'translateX(' + (dir * K) + 'px)' }, { opacity: 1, transform: 'none' }],
      { duration: 340, delay: 80, easing: ML_EASE, fill: 'backwards' });
  }

  /* ---------------- 播放控制 ---------------- */
  let motionOn = true;
  const EMPH = 'cubic-bezier(0.2, 0, 0, 1)', EO = 'cubic-bezier(0.16, 1, 0.3, 1)';
  function animatedIn(stage) {
    return $$('*', stage).filter(el => {
      const n = getComputedStyle(el).animationName;
      return n && n !== 'none';
    });
  }
  /* 把舞台的时序参数集中管理：重播会清内联样式，所以每次重播后都要重新施加 */
  function scaleTime(v, sp) {
    const n = parseFloat(v) || 0, u = /ms/.test(v) ? 'ms' : 's';
    return (n / sp) + u;
  }
  /* 时长滑块是绝对毫秒，但一个舞台里各元素原始时长可以不同（two 的进场/退场），
     所以按"滑块值 ÷ 本来的基准时长"等比缩放，而不是把大家都改成同一个数 */
  function mulTime(v, f) {
    const n = parseFloat(v) || 0, u = /ms/.test(v) ? 'ms' : 's';
    return (n * f) + u;
  }
  function applyTiming(stage) {
    if (!stage) return;
    const sp = stage._speed || 1;
    const els = animatedIn(stage);
    els.forEach(function (el) {
      if (el.dataset.dur0 == null) {
        const cs = getComputedStyle(el);
        el.dataset.dur0 = cs.animationDuration;
        el.dataset.delay0 = cs.animationDelay;
        el.dataset.iter0 = cs.animationIterationCount;
        el.dataset.dir0 = cs.animationDirection;
      }
    });
    /* 基准必须从内联样式覆盖之前那份 dataset.dur0 里取，否则拖一次滑块就把
       上一次的缩放当成了原始值，越拖越偏 */
    if (stage._dur0 == null && els.length) {
      const b = parseFloat(els[0].dataset.dur0) || 0;
      stage._dur0 = b * (/ms/.test(els[0].dataset.dur0) ? 1 : 1000);
    }
    const pd = stage._prm && stage._prm.dur;
    const f = (pd != null && stage._dur0) ? pd / stage._dur0 : 1;
    els.forEach(function (el) {
      /* 编译出来的关键帧里写的是 var(--dur, 420ms)，而这里施加的是内联样式，
         内联赢——所以滑块改 --dur 时必须同步重算，否则时长滑块永远没反应 */
      el.style.animationDuration = scaleTime(mulTime(el.dataset.dur0, f), sp);
      /* 卡片上有错峰滑块时以它为准，否则重播会把用户调出来的节奏冲掉 */
      el.style.animationDelay = (stage._prm && stage._prm.st != null && el._si != null)
        ? (el._si * stage._prm.st) + 'ms'
        : scaleTime(el.dataset.delay0, sp);
      el.style.animationIterationCount = stage._loop ? 'infinite' : el.dataset.iter0;
      el.style.animationDirection = (stage._loop && el.dataset.dir0 === 'normal') ? 'alternate' : '';
    });
  }
  /* 重播：清掉 animation 再强制回流，对 CSS 关键帧动画最稳 */
  function replay(stage) {
    if (!stage) return;
    if (motionOn) {
      const nodes = animatedIn(stage);
      nodes.forEach(el => { el.style.animation = 'none'; });
      void stage.offsetWidth;
      nodes.forEach(el => { el.style.animation = ''; });
    }
    applyTiming(stage);
  }
  /* 慢放倍速：CSS 动画改 duration/delay，JS 演示读 stage._speed */
  function setSpeed(stage, speed) {
    if (!stage) return;
    stage._speed = speed;
    applyTiming(stage);
  }
  function setLoop(stage, on) {
    if (!stage) return;
    stage._loop = on;
    applyTiming(stage);
  }

  const visible = new WeakMap();
  /* 弹窗里的舞台要强制算作“在画面内”，否则 IntersectionObserver 未触发时会一直暂停 */
  function pinVisible(el, on) {
    if (!el) return;
    visible.set(el, on);
    el.classList.toggle('in-view', on);
  }
  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      visible.set(e.target, e.isIntersecting);
      e.target.classList.toggle('in-view', e.isIntersecting);
    });
  }, { rootMargin: '120px 0px', threshold: 0.01 });

  /* ---------------- 主循环 ---------------- */
  const tickers = new Set();
  const motionHooks = new Set();
  function loop(now) {
    if (motionOn) tickers.forEach(f => { try { f(now); } catch (e) {} });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ---------------- 轨道 / 曲线 / 弹簧 ---------------- */
  function mountTrack(stage) {
    const fn = (EASE[stage.dataset.fn] || EASE.easeOut);
    const live = $('.live', stage), ref = $('.ref', stage), lane = $('.lane', stage);
    let t0 = performance.now();
    /* translateX 的百分比是相对元素自身宽度的，所以这里必须换算成轨道可用像素。
       挂载时舞台可能还没布局（详情页未展开），宽高 0 —— 交给 ResizeObserver 补量 */
    let travel = 96;
    const measure = function () {
      const w = lane.clientWidth || stage.clientWidth || 200;
      travel = Math.max(40, w - 20 - live.offsetWidth);
    };
    measure();
    if (window.ResizeObserver) { stage._ro = new ResizeObserver(measure); stage._ro.observe(lane); }
    stage._update = function (now) {
      if (!visible.get(stage)) return;
      /* 时长滑块给了绝对毫秒，慢放是在它基础上再除倍速：
         原来的写法 `a || 900 / sp` 因为优先级问题让 ½×/¼× 完全失效 */
      const dur = ((stage._prm && stage._prm.dur) || 900) / (stage._speed || 1);
      let p = (now - t0) / dur;
      if (p > 1.6) { t0 = now; p = 0; }
      const q = Math.min(1, Math.max(0, p));
      live.style.transform = 'translateX(' + (fn(q) * travel).toFixed(2) + 'px)';
      ref.style.transform = 'translateX(' + (q * travel).toFixed(2) + 'px)';
      live.style.opacity = ref.style.opacity = p > 1.35 ? '.35' : '1';
    };
    tickers.add(stage._update);
  }

  /* 曲线画布：按元素实际 CSS 尺寸绘制（含 DPR），否则固定位图会被拉伸裁切 */
  function drawCurve(cv, fn) {
    const g = cv.getContext('2d');
    const W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cs = getComputedStyle(document.body);
    const line = cs.getPropertyValue('--line') || '#2a2f3a';
    const acc = cs.getPropertyValue('--accent') || '#d6ff3f';
    const P = Math.max(12, Math.min(22, W * 0.07));
    const x0 = P, x1 = W - P, y0 = H - P, y1 = P + 2;
    g.clearRect(0, 0, W, H);
    g.strokeStyle = line; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.moveTo(x0, y1); g.lineTo(x1, y1); g.stroke();
    let lo = 1, hi = 0;
    for (let i = 0; i <= 60; i++) { const v = fn(i / 60); if (v < lo) lo = v; if (v > hi) hi = v; }
    const top = Math.max(1.04, hi + 0.05), bot = Math.min(-0.02, lo - 0.12);
    const px = t => x0 + (x1 - x0) * t;
    const mapY = v => y0 - (v - bot) / (top - bot) * (y0 - y1);
    g.strokeStyle = 'rgba(140,150,170,.45)'; g.lineWidth = 1; g.setLineDash([2, 3]);
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]);
    g.strokeStyle = acc; g.lineWidth = 2.4; g.lineJoin = 'round'; g.beginPath();
    for (let i = 0; i <= 140; i++) {
      const t = i / 140, v = fn(t);
      if (i === 0) g.moveTo(px(t), mapY(v)); else g.lineTo(px(t), mapY(v));
    }
    g.stroke();
    cv._map = { px: px, mapY: mapY };
  }

  function mountCurve(stage) {
    const cv = $('.cv', stage), probe = $('.cprobe i', stage);
    const fn = EASE[stage.dataset.fn] || EASE.easeOut;
    let t0 = performance.now();
    const redraw = function () { drawCurve(cv, fn); };
    redraw();
    stage._resize = redraw;
    if (window.ResizeObserver) { stage._ro = new ResizeObserver(redraw); stage._ro.observe(cv); }
    stage._update = function (now) {
      if (!visible.get(stage)) return;
      let p = (now - t0) / (((stage._prm && stage._prm.dur) || 1400) / (stage._speed || 1));
      if (p > 1.4) { t0 = now; p = 0; }
      const q = Math.min(1, p);
      const m = cv._map; if (!m) return;
      probe.style.left = m.px(q) + 'px';
      probe.style.top = m.mapY(fn(q)) + 'px';
      probe.style.opacity = p > 1.15 ? '.25' : '1';
    };
    tickers.add(stage._update);
  }

  function mountSpring(stage) {
    const rows = $$('.srow', stage), box = $('.springbox', stage);
    const mk = str => {
      const p = (str || '').split(',').map(Number);
      return { s: p[0] || 170, d: p[1] || 22, m: p[2] || 1 };
    };
    const base = [mk(stage.dataset.p), mk(stage.dataset.p2)];
    const state = rows.map(() => ({ x: 0, v: 0, target: 1, next: performance.now() + 400 }));
    /* translateX 的百分比按元素自身宽度算，只有 ±17px，所以弹簧永远挤在左边。
       这里改成实测像素行程，并给过冲/回弹留出余量。 */
    let span = 120;
    const measure = function () {
      span = Math.max(56, ((box.clientWidth || stage.clientWidth || 200) - 42) * 0.66);
      stage.style.setProperty('--tgt', (span * 1.3).toFixed(1) + 'px');
    };
    measure();
    if (window.ResizeObserver) { stage._ro = new ResizeObserver(measure); stage._ro.observe(box); }
    /* 参数滑块只驱动第一行，第二行始终是固定参照，比较关系才不会被打断 */
    stage._apply = function () {
      const p = stage._prm || {};
      rows.forEach(function (row, i) {
        row._c = i === 0 ? {
          s: +(p.k != null ? p.k : base[0].s),
          d: +(p.c != null ? p.c : base[0].d),
          m: +(p.m != null ? p.m : base[0].m)
        } : base[i];
        const tag = row.querySelector('b');
        if (tag && i === 0 && (p.k != null || p.c != null || p.m != null)) {
          tag.textContent = 'k=' + row._c.s + '  c=' + row._c.d + '  m=' + row._c.m;
        }
      });
    };
    stage._apply();
    stage.addEventListener('click', () => {
      state.forEach(s => { s.target = s.target > 0 ? 0 : 1; s.next = 0; });
      stage.classList.add('touched');
    });
    let prev = performance.now();
    stage._update = function (now) {
      if (!visible.get(stage)) { prev = now; return; }
      /* 慢放：把每帧步进的时间也按倍速缩放，弹簧才有 ½×/¼× 的效果 */
      const dt = Math.min(0.032, (now - prev) / 1000) / (stage._speed || 1); prev = now;
      rows.forEach((row, i) => {
        const s = state[i], c = row._c || base[i];
        if (!s.target && !s.x) return;
        if (!stage.dataset.live && now > s.next) { s.target = s.target > 0 ? 0 : 1; s.next = now + 900 + i * 260; }
        const steps = 4, h = dt / steps;
        for (let k = 0; k < steps; k++) {
          const a = (-c.s * (s.x - s.target) - c.d * s.v) / c.m;
          s.v += a * h; s.x += s.v * h;
        }
        const o = 1 - s.x;
        row.firstElementChild.style.transform = 'translateX(' + ((s.x + 0.3) * span).toFixed(2) + 'px)';
        row.firstElementChild.style.opacity = String(0.35 + 0.65 * Math.min(1, Math.max(0, o)));
      });
    };
    tickers.add(stage._update);
  }

  /* ---------------- 挂载 ---------------- */
  function mountStage(term) {
    const stage = $('.stage', term);
    const s = term.__demo;
    stage._prm = stage._prm || {};
    io.observe(stage);
    if (s.kind === 'track') mountTrack(stage);
    else if (s.kind === 'curve') mountCurve(stage);
    else if (s.kind === 'spring') mountSpring(stage);
    else if (window.MOTION.KINDS[s.kind]) window.MOTION.KINDS[s.kind](stage, s, term);
    if (s.behavior && window.MOTION.BEHAVIORS[s.behavior]) window.MOTION.BEHAVIORS[s.behavior](stage, s, term);
    /* 子元素错峰 / 相位差（负 delay 让循环动效彼此错开） */
    if (s.multi || s.st) {
      const sel = targetSel(s).replace(/::after|::before/, '');
      const els = $$(sel, stage);
      if (els.length > 1) {
        const per = s.perDelay ? s.perDelay.split('|') : null;
        stage._staggerEls = els;
        els.forEach((el, i) => {
          el._si = i;
          el.style.animationDelay = (i * (s.st == null ? 90 : s.st)) + 'ms';
          if (per && per[i]) el.style.animationDuration = per[i] + 'ms';
          el.style.setProperty('--i', i);
        });
      }
      if (s.burst) {
        els.forEach(el => {
          const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 42;
          el.style.setProperty('--dx', (Math.cos(a) * r).toFixed(1) + 'px');
          el.style.setProperty('--dy', (Math.sin(a) * r - 12).toFixed(1) + 'px');
        });
      }
    }
    if (s.play === 'press') {
      stage.addEventListener('pointerdown', () => term.classList.add('pressing'));
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => stage.addEventListener(ev, () => term.classList.remove('pressing')));
    }
    $('.replay', term) && $('.replay', term).addEventListener('click', () => replay(stage));
    if (s.loop || s.kind === 'track' || s.kind === 'curve' || s.kind === 'spring') stage.classList.add('auto');
    initCtl(stage, term);
  }

  /* ---------------- 分类渲染 + 检索 ---------------- */
  const CSS = [];
  let TERMS_BY_ID = {};
  function build() {
    let cardsMade = 0;
    TERMS_BY_ID = {};
    window.TERMS.forEach(t => { TERMS_BY_ID[t.id] = t; });
    const html = window.CATS.map(c => {
      const items = window.TERMS.filter(t => t.cat === c.id);
      /* 一个舞台写错不该让整站空白：单卡片降级，错误照常抛到控制台 */
      items.forEach(t => {
        t.__demo = t.demo || {};
        try { CSS.push(stageCSS(t)); } catch (err) { console.warn('舞台样式生成失败：' + t.id, err); CSS.push(''); }
      });
      const cards = items.map(t => {
        try { return cardHTML(t); } catch (err) { console.warn('卡片生成失败：' + t.id, err); return ''; }
      }).join('');
      cardsMade += items.length;
      return '<section class="cat" id="cat-' + c.id + '" data-cat="' + c.id + '">' +
        '<header class="cat-hd"><div class="cat-no">' + String(window.CATS.indexOf(c) + 1).padStart(2, '0') + '</div>' +
        '<div><h2>' + esc(c.name) + '<span class="cat-en">' + esc(c.en) + '</span></h2>' +
        '<p class="cat-tag">' + esc(c.tagline) + '</p>' +
        '<p class="cat-n">' + items.length + ' 个术语</p></div></header>' +
        '<div class="grid">' + cards + '</div></section>';
    }).join('');
    const styleEl = document.createElement('style');
    styleEl.id = 'generated';
    let kfText = '';
    KF.forEach((name, body) => { kfText += '@keyframes ' + name + '{' + body + '}'; });
    styleEl.textContent = kfText + CSS.join('');
    document.head.appendChild(styleEl);
    $('#sections').innerHTML = html;

    $('#nav').innerHTML = window.CATS.map(c =>
      '<a href="#cat-' + c.id + '" data-cat="' + c.id + '"><span>' + esc(c.name) + '</span><b>' +
      window.TERMS.filter(t => t.cat === c.id).length + '</b></a>').join('');
    $('#stat-terms').textContent = cardsMade;
    $('#stat-cats').textContent = window.CATS.length;
    const kinds = {};
    window.TERMS.forEach(t => { kinds[(t.demo || {}).kind || 'frames'] = 1; });
    const sk = $('#stat-kinds'); if (sk) sk.textContent = Object.keys(kinds).length;
    const sc2 = $('#stat-cats2'); if (sc2) sc2.textContent = window.CATS.length;
    $$('.term').forEach(el => {
      const data = TERMS_BY_ID[el.dataset.id];
      el.__demo = (data && data.demo) || {};
      try { mountStage(el); } catch (err) { console.warn('挂载失败：' + el.dataset.id, err); }
    });
    /* 卡片自身的入场编排：rise-in + 每行错峰（只在 JS 可用时启用前置隐藏） */
    const cardEls = $$('.term:not(.term--detail)');
    cardEls.forEach((el, i) => { el.dataset.i = i % 4; });
    document.documentElement.classList.add('anim-ready');
    const cardIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.animationDelay = Math.min(240, (+e.target.dataset.i || 0) * 55) + 'ms';
        e.target.classList.add('shown');
        cardIO.unobserve(e.target);
      });
    }, { rootMargin: '60px 0px', threshold: 0.02 });
    cardEls.forEach(el => cardIO.observe(el));
    /* 兜底：任何原因导致 IO 没触发，也不能让卡片一直不可见 */
    setTimeout(function () { cardEls.forEach(el => el.classList.add('shown')); }, 1600);
  }

  /* ---------------- 搜索与筛选 ---------------- */
  function indexTerms() {
    $$('.term:not(.term--detail)').forEach(el => {
      const t = TERMS_BY_ID[el.dataset.id];
      el._idx = (t.en + ' ' + t.zh + ' ' + (t.alias || []).join(' ') + ' ' + t.def + ' ' + t.say + ' ' + t.vague + ' ' + (t.code || '')).toLowerCase();
    });
  }
  function applyFilter() {
    const q = ($('#q').value || '').trim().toLowerCase();
    const cat = document.body.dataset.filter || '';
    let shown = 0;
    const catHit = {};
    $$('.term:not(.term--detail)').forEach(el => {
      const ok = (!q || el._idx.indexOf(q) >= 0) && (!cat || el.dataset.cat === cat) &&
        (!favOnly || favs.indexOf(el.dataset.id) >= 0);
      el.hidden = !ok;
      if (ok) { shown++; catHit[el.dataset.cat] = 1; }
    });
    $$('.cat').forEach(sec => { sec.hidden = !catHit[sec.dataset.cat]; });
    $('#hitcount').textContent = (q || cat || favOnly) ? shown + ' / ' + window.TERMS.length : window.TERMS.length + (L('nTerms'));
    $('#empty').hidden = shown > 0;
  }

  /* 详情页导出成一段可以直接贴进需求或提示词的 Markdown */
  function termMarkdown(t) {
    const code = window.DIALECTS ? window.DIALECTS.codeFor(t) : t.code;
    return '## ' + t.zh + ' / ' + t.en + '\n\n' +
      '> **你可能会说：** ' + t.vague + '\n\n' +
      t.def + '\n\n' +
      '**说出来：** ' + t.say + '\n' +
      (code ? '\n```\n' + code + '\n```\n' : '') +
      (t.alias && t.alias.length ? '\n**也叫：** ' + t.alias.join('、') + '\n' : '');
  }
  /* 剪贴板统一入口：异步 API 被拒（权限 / 失焦）时降级 execCommand，
     都失败就回调 fail —— 不能像以前那样没写进去也提示「已复制」 */
  function copyText(str, ok, fail) {
    const legacy = function () {
      const ta = document.createElement('textarea');
      ta.value = str;
      ta.style.cssText = 'position:fixed;top:-999px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      let done = false;
      try { done = document.execCommand('copy'); } catch (e) {}
      ta.remove();
      if (done) { if (ok) ok(); } else if (fail) fail();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(str).then(ok, legacy);
    } else legacy();
  }

  function copyMarkdown() {
    const t = TERMS_BY_ID[pg().dataset.id]; if (!t) return;
    const btn = $('#page-copy'), lab = btn.querySelector('span'), old = lab.textContent;
    copyText(termMarkdown(t), function () {
      btn.classList.add('ok'); lab.textContent = L('copiedMd');
      setTimeout(function () { btn.classList.remove('ok'); lab.textContent = old; }, 1600);
    });
  }

  /* ---------------- 配方（选词成句） ---------------- */
  const RKEY = 'motion-recipe-v1';
  let recipe = readList(RKEY);
  function L(k) { return window.I18N ? window.I18N.t(k) : ''; }
  function saveRecipe() { try { localStorage.setItem(RKEY, JSON.stringify(recipe)); } catch (e) {} }
  function renderRecipe() {
    const box = $('#recipe');
    box.hidden = !recipe.length;
    $('#recipe-count').textContent = recipe.length;
    const en = window.I18N && window.I18N.lang === 'en';
    $('#recipe-chips').innerHTML = recipe.map(id => {
      const t = window.TERMS.find(x => x.id === id);
      return '<span class="rchip">' + esc(t ? (t.en + (en ? '' : ' / ' + t.zh)) : id) + '<button data-rm="' + esc(id) + '" aria-label="移除" data-l10n="移除" data-l10n-attr="aria-label">×</button></span>';
    }).join('');
    const text = recipe.map(id => {
      const t = window.TERMS.find(x => x.id === id);
      if (!t) return '';
      const e = window.EN[id];
      return en && e ? e[2] : t.say;
    }).filter(Boolean);
    $('#recipe-out').value = text.length ? L('recPrefix') + '\n- ' + text.join('\n- ') + '\n\n' + L('recSuffix') : '';
    $$('.add').forEach(b => {
      const on = recipe.indexOf(b.dataset.add) >= 0;
      b.classList.toggle('on', on);
      b.textContent = on ? L('added') : L('add');
    });
  }
  function toggleRecipe(id) {
    const i = recipe.indexOf(id);
    if (i >= 0) recipe.splice(i, 1); else recipe.push(id);
    saveRecipe(); renderRecipe();
  }

  /* ---------------- 主题 / 动效开关 ---------------- */
  /* 主题切换 / 窗口缩放后重绘曲线画布。
     _resize 挂在 .stage 上（mountCurve），canvas 的 parentElement 是 .curvebox，
     之前从 parentElement 找永远找不到，换主题后曲线一直是旧配色 */
  function redrawCurves() {
    $$('.cv').forEach(function (cv) {
      const st = cv.closest('.stage');
      if (st && st._resize) st._resize();
    });
  }
  /* 调色板注册表：点击主题按钮循环切换，纸感/暗房是原来的两套 */
  const THEMES = [
    { k: 'paper', zh: '纸感', en: 'Paper' },
    { k: 'ember', zh: '暗房', en: 'Ember' },
    { k: 'celadon', zh: '青瓷', en: 'Celadon' },
    { k: 'graphite', zh: '石墨', en: 'Graphite' },
    { k: 'iris', zh: '鸢尾', en: 'Iris' }
  ];
  function setTheme(v) {
    document.documentElement.dataset.theme = v;
    try { localStorage.setItem('motion-theme', v); } catch (e) {}
    const i = THEMES.findIndex(t => t.k === v), next = THEMES[(i + 1) % THEMES.length] || THEMES[0];
    const en = window.I18N && window.I18N.lang === 'en';
    const btn = $('#theme');
    /* 按钮显示「下一套」的名字：点下去就知道会变成什么 */
    btn.textContent = en ? next.en : next.zh;
    btn.title = en ? 'Theme: ' + (THEMES[i] || THEMES[0]).en + ' → next' : '主题：' + ((THEMES[i] || THEMES[0]).zh) + '，点击切换下一套';
    btn.setAttribute('aria-label', btn.title);
    redrawCurves();
  }
  function setMotion(on) {
    motionOn = on;
    document.documentElement.classList.toggle('no-motion', !on);
    $('#motion').setAttribute('aria-pressed', String(on));
    $('#motion').textContent = on ? L('motionOn') : L('motionOff');
    /* SMIL、CSS 关键帧之外的“自带时钟”演示不吃 tickers 门控，得单独通知 */
    motionHooks.forEach(f => { try { f(on); } catch (e) {} });
  }

  /* ---------------- 启动 ---------------- */
  let booted = false;
  function boot() {
    /* 只装配一次：重复执行会把每个监听器都挂两遍，开关类操作会当场自我抵消 */
    if (booted) return;
    booted = true;
    build();
    indexTerms();
    renderRecipe();
    applyFilter();
    setTheme((function () {
      try {
        const saved = localStorage.getItem('motion-theme');
        /* 旧版存的是 light/dark：迁移到新调色板 key */
        if (saved === 'light') return 'paper';
        if (saved === 'dark') return 'ember';
        if (saved && THEMES.some(t => t.k === saved)) return saved;
      } catch (e) {}
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'ember' : 'paper';
    })());
    const prm = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    setMotion(!(prm && prm.matches));
    /* 页面开着的时候用户改系统「减弱动效」设置也要跟上，不能只在加载时读一次 */
    if (prm) {
      const onPrm = function (e) { setMotion(!e.matches); };
      if (prm.addEventListener) prm.addEventListener('change', onPrm);
      else if (prm.addListener) prm.addListener(onPrm);
    }
    if (window.I18N) window.I18N.refresh();
    syncFav('');
    /* 深链：#term/xxx 直接进详情页 */
    const deep = /^#term\/(.+)$/.exec(location.hash || '');
    if (deep && TERMS_BY_ID[deep[1]]) openDetail(deep[1], null, 0);
    initDialectMenu();
    initScrollUI();
    $('#lang') && $('#lang').addEventListener('click', function () {
      window.I18N.set(window.I18N.lang === 'en' ? 'zh' : 'en');
      setTheme(document.documentElement.dataset.theme);
      setMotion(motionOn);
      applyFilter();
    });

    /* 自定义方言菜单（原生 select 的下拉面板没法美化） */
    function initDialectMenu() {
      const D = window.DIALECTS; if (!D || !$('#dialect-list')) return;
      const btn = $('#dialect-btn'), list = $('#dialect-list'), menu = $('#dialect-menu');
      const paint = function () {
        list.innerHTML = '<p class="menu-hd">' + esc(L('dialectHd')) + '</p>' + D.list.map(d =>
          '<button type="button" role="option" class="menu-item' + (d.key === D.current ? ' on' : '') +
          '" data-k="' + d.key + '" aria-selected="' + (d.key === D.current) + '"><span>' + d.label + '</span>' +
          '<svg class="tick" width="15" height="15" viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 10.6 8.2 14 15.5 6.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg></button>').join('');
        $('#dialect-cur').textContent = (D.list.filter(x => x.key === D.current)[0] || D.list[0]).label;
      };
      const open = function (on) {
        menu.classList.toggle('open', on);
        btn.setAttribute('aria-expanded', String(on));
      };
      paint();
      paintDialect = paint;
      btn.addEventListener('click', function (e) { e.stopPropagation(); open(!menu.classList.contains('open')); });
      list.addEventListener('click', function (e) {
        const it = e.target.closest('.menu-item'); if (!it) return;
        D.set(it.dataset.k); paint(); open(false);
        if (window.I18N) window.I18N.refreshTerms();
      });
      document.addEventListener('click', function (e) { if (!e.target.closest('#dialect-menu')) open(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') open(false); });
    }

    /* 滚动进度条 + 侧栏跟随当前分类 */
    function initScrollUI() {
      const bar = $('#scroll-progress');
      const fill = bar && bar.firstElementChild;
      if (fill) {
        const upd = function () {
          const h = document.documentElement.scrollHeight - window.innerHeight;
          fill.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
        };
        window.addEventListener('scroll', upd, { passive: true });
        window.addEventListener('resize', upd); upd();
      }
      const spy = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          const id = e.target.dataset.cat;
          $$('#nav a').forEach(a => a.classList.toggle('here', a.dataset.cat === id));
        });
      }, { rootMargin: '-42% 0px -52% 0px' });
      $$('.cat').forEach(s => spy.observe(s));
    }

    /* 输入合帧：每个按键只排一次过滤。不能只用「未决标志」判断——
       标签页被节流时 rAF 可能迟迟不来，标志卡死会让输入永久失灵，
       所以带 250ms 超时自愈 */
    let qRaf = 0, qAt = 0;
    $('#q').addEventListener('input', function () {
      if (qRaf) {
        if (performance.now() - qAt < 250) return;
        cancelAnimationFrame(qRaf);
      }
      qAt = performance.now();
      qRaf = requestAnimationFrame(function () { qRaf = 0; applyFilter(); });
    });
    $('#q').addEventListener('keydown', e => { if (e.key === 'Escape') { e.target.value = ''; applyFilter(); } });
    document.addEventListener('keydown', e => {
      if (e.key === '/' && document.activeElement !== $('#q')) { e.preventDefault(); $('#q').focus(); }
    });
    $('#clear').addEventListener('click', () => { $('#q').value = ''; document.body.dataset.filter = ''; $$('#nav a').forEach(a => a.classList.remove('on')); applyFilter(); });
    $('#nav').addEventListener('click', e => {
      const a = e.target.closest('a'); if (!a) return;
      const on = document.body.dataset.filter === a.dataset.cat;
      document.body.dataset.filter = on ? '' : a.dataset.cat;
      $$('#nav a').forEach(x => x.classList.toggle('on', !on && x === a));
      applyFilter();
    });
    $('#theme').addEventListener('click', function () {
      const cur = document.documentElement.dataset.theme;
      const i = THEMES.findIndex(t => t.k === cur);
      setTheme(THEMES[(i + 1) % THEMES.length].k);
    });
    $('#motion').addEventListener('click', () => setMotion(document.documentElement.classList.contains('no-motion')));
    document.addEventListener('click', e => {
      const add = e.target.closest('[data-add]');
      if (add) { toggleRecipe(add.dataset.add); return; }
      const rm = e.target.closest('[data-rm]');
      if (rm) { toggleRecipe(rm.dataset.rm); return; }
      const cp = e.target.closest('.copy');
      if (cp) {
        const code = cp.parentElement.querySelector('code');
        copyText(code.textContent, function () {
          cp.dataset.busy = '1'; cp.textContent = L('copied');
          setTimeout(() => { delete cp.dataset.busy; cp.textContent = L('copy'); }, 1200);
        });
      }
      const rp = e.target.closest('.recipe-open');
      if (rp) { $('#recipe').hidden = false; }
      if (e.target.closest('#recipe-close')) $('#recipe').hidden = true;
      if (e.target.closest('#recipe-copy')) {
        const v = $('#recipe-out').value;
        copyText(v, function () {
          $('#recipe-copy').textContent = L('recCopied');
          setTimeout(() => $('#recipe-copy').textContent = L('recCopy'), 1400);
        });
      }
    });
    /* 卡片：点击 / 回车打开详情，悬停重播。可交互的舞台除外 */
    const INTERACTIVE = '.stage.kind-scroll, .stage.kind-drag, .stage.kind-list, .stage.kind-cube, .stage.kind-rig, .stage.kind-scrub, .stage.kind-canvas2d, .stage.kind-lottie, .stage.kind-rive, .stage.kind-sprite, .stage.kind-morph, .stage.kind-perf, .stage.kind-compound, .lo-track, .sc input, button, a, input, select';
    $('#sections').addEventListener('click', function (e) {
      if (e.target.closest(INTERACTIVE)) return;
      const card = e.target.closest('.term');
      if (card) openDetail(card.dataset.id, card);
    });
    $('#sections').addEventListener('keydown', function (e) {
      /* 卡片本身是可聚焦的 button-like 容器，但舞台里的滑杆、按钮和链接
         也需要独立响应键盘；否则在它们上面按 Enter/Space 会误打开详情页。 */
      if (e.target.closest(INTERACTIVE)) return;
      const card = e.target.closest('.term');
      if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openDetail(card.dataset.id, card); }
    });
    $('#sections').addEventListener('mouseover', function (e) {
      const card = e.target.closest('.term[data-play="in"]');
      if (!card || card._ht > Date.now() - 700) return;
      card._ht = Date.now();
      replay(card.querySelector('.stage'));
    });
    /* ---------- 详情页：返回 / 翻页 / 收藏 / 复制 Markdown ---------- */
    $('#page-back').addEventListener('click', closeDetail);
    $('#page-prev').addEventListener('click', function () { gotoSibling(-1, this.dataset.to); });
    $('#page-next').addEventListener('click', function () { gotoSibling(1, this.dataset.to); });
    $('#page-fav').addEventListener('click', function () { toggleFav(pg().dataset.id); });
    $('#page-copy').addEventListener('click', copyMarkdown);
    $('#fav-filter').addEventListener('click', function () {
      favOnly = !favOnly;
      this.setAttribute('aria-pressed', String(favOnly));
      applyFilter();
    });
    document.addEventListener('keydown', function (e) {
      if (pg().hidden) return;
      const t = e.target;
      if (t && (t.closest('input,textarea,[contenteditable]') || t.closest('.stage'))) return;
      if (e.key === 'Escape') { e.preventDefault(); closeDetail(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); gotoSibling(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); gotoSibling(1); }
    });
    /* 浏览器前进 / 后退是唯一的导航真相 */
    window.addEventListener('hashchange', function () {
      const m = /^#term\/(.+)$/.exec(location.hash || '');
      const open = !pg().hidden;
      if (m && TERMS_BY_ID[m[1]]) { if (!open || pg().dataset.id !== m[1]) openDetail(m[1], null, 0); }
      else if (open) closeDetail();
    });
    /* 详情页里的演示参数：慢放倍速 / 循环 */
    $('#page-body').addEventListener('click', function (e) {
      const b = e.target.closest('[data-sp]'); if (!b) return;
      const stage = b.closest('.term--detail').querySelector('.stage');
      $$('[data-sp]', b.parentElement).forEach(x => x.classList.toggle('on', x === b));
      setSpeed(stage, parseFloat(b.dataset.sp));
      replay(stage);
    });
    $('#page-body').addEventListener('change', function (e) {
      const c = e.target.closest('[data-loop]'); if (!c) return;
      const stage = c.closest('.term--detail').querySelector('.stage');
      setLoop(stage, c.checked);
      replay(stage);
    });
    window.addEventListener('resize', redrawCurves);
  }
  /* boot 依赖 motion/runtime/compound 注入的数据，必须等它们跑完。
     defer 脚本执行时 readyState 已是 interactive 而非 loading，
     所以不能再用 readyState 判断——DOMContentLoaded 在所有 defer 脚本
     之后才触发，正好是我们的启动点；只有事件彻底错过才立即启动。 */
  if (document.readyState === 'complete') boot();
  else document.addEventListener('DOMContentLoaded', boot);

  window.ENGINE = { replay: replay, pinVisible: pinVisible, isVisible: s => visible.get(s), $: $, $$: $$, esc: esc, motionOn: () => motionOn, onMotion: f => { motionHooks.add(f); }, tickers: tickers, io: io, briefOf: briefOf, openDetail: openDetail, closeDetail: closeDetail, onLang: function () { if (paintDialect) paintDialect(); syncCrumb(); if (window.HUD) window.HUD.repaintBtn(); } };
})();
