/* Shared Motion Atlas stages: cards, detail pages and home inspiration use one driver. */
(function () {
  'use strict';
  const M = window.MOTION, E = window.ENGINE;
  const oldHTML = M.htmlFor, oldMount = M.KINDS.compound;
  const STUDIES = {
    gaze: [1, 'pointer'], dio: [2, 'pointer'], bloom: [3, 'hover'], fan: [7, 'hover'],
    vortex: [17, 'scroll'], float: [29, 'click'],
    orbit: [16, 'scroll'], thememorph: [22, 'scroll'], vspeed: [25, 'scroll'], chart: [26, 'scroll'],
    tunnel: [28, 'scroll'], fab: [30, 'click'], tristate: [31, 'click'], odometer: [35, 'click'],
    tabs: [37, 'click'], island: [39, 'click'], scratch: [40, 'drag'], cylinder: [43, 'drag'],
    ring3d: [44, 'drag'], scanlock: [46, 'click']
  };
  const THREE = new Set([1, 2, 3, 16]);
  const HINTS = {
    pointer: ['移动指针，探索画面', 'Move the pointer to explore'],
    hover: ['悬停展开 · 轻点固定', 'Hover to unfold · tap to pin'],
    scroll: ['滚轮或拖动进度条', 'Scroll or drag the progress'],
    click: ['轻点画面，触发变化', 'Tap the scene to interact'],
    drag: ['按住拖动，探索画面', 'Drag to explore']
  };
  const stages = new Set();
  const en = () => document.documentElement.dataset.lang === 'en';
  const copy = (zh, english) => en() ? english : zh;
  const esc = s => E.esc(s);
  // The old sliders target DOM transforms. Remove them instead of presenting inert controls.
  window.TERMS.forEach(term => {
    const d = term.demo || {};
    if (d.kind !== 'compound' || !STUDIES[d.mode]) return;
    term.def = term.def.replace(/\*\*/g, '');
    d.atlas = true;
    d.atlasAspect = { gaze: 4 / 3, dio: 4 / 3, float: 4 / 3, island: 4 / 3,
      cylinder: 4 / 3, ring3d: 1 }[d.mode] || 5 / 3;
    d.atlasInput = STUDIES[d.mode][1];
    d.ctl = [];
    d.hint = HINTS[STUDIES[d.mode][1]][0];
    if (d.mode === 'float') {
      d.hint = '点哪里，哪里生长';
      term.def = '漂浮的种子落下后，依次发生接触、茎秆生长、叶片舒展和三朵花错峰绽放。轻点画面的不同位置种下新植株，已有花草会保留，最多七株；重置后重新开始。';
      term.say = '指针位置决定播种位置，每株独立编排种子落下、接触涟漪、茎秆描边、叶片展开与三朵花绽放，保留最近七株';
    }
    if (d.mode === 'gaze') {
      term.def = '陶瓷角色的眼球与头部共同跟随指针。指针相对画面中心的位置映射为受限的转角，再以弹簧平滑衔接；离开后回到正面，空闲时轻轻眨眼，让角色保持生命感。';
      term.say = '以归一化指针位置驱动眼球和头部的独立旋转，弹簧平滑跟随并限幅，离开后回正，减少动态时直接响应输入';
    } else if (d.mode === 'dio') {
      term.def = '海岸灯塔、松林、小屋和码头组成真正的立体微缩景观。指针改变镜头的水平与垂直位置，各物体因距离不同自然产生视差；移动范围受限，离开后平滑回到中心视角。';
      term.say = '以指针归一化向量控制 3D 相机的小幅平移，始终看向景观中心，以真实空间深度形成视差';
    } else if (d.mode === 'bloom') {
      term.def = '四扇车门绕各自的铰链错峰打开，呈现金属车身、玻璃座舱与内饰。悬停时展开，离开后收拢，也可轻点固定；中途反向时从当前角度继续，避免跳回起点。';
      term.say = '独立车门铰链配合弹簧旋转与错峰延迟，悬停展开、离开收拢、点击固定，中途反向保持角度和速度连续';
    } else if (d.mode === 'orbit') {
      term.say = '滚动进度映射为相机绕角色一周的方位角，相机始终看向主体，滚轮、纵向拖动和进度条共用同一进度';
    } else if (d.mode === 'chart') {
      term.say = '同一滚动进度驱动 Canvas 柱高、折线绘制范围和数值读数，各柱按索引错峰生长，反向滚动同步回退';
    } else if (d.mode === 'scratch') {
      term.def = '在风景上盖一层可擦除的表面，拖动时沿指针路径逐段露出底图。保留每一道擦痕，鼠标与触屏使用同一套手势；重置后恢复完整覆盖层，可以重新探索。';
      term.say = 'Canvas 覆层使用 destination-out 沿指针轨迹擦除，保留已揭示区域，重置时重建覆盖层';
    } else if (d.mode === 'cylinder') {
      term.def = '将八张风景手记绕圆柱排列，拖动时整组卡片连续旋转。每张卡片根据所在角度改变透视与明暗；松手后带着惯性滑行，再吸附到相邻卡位，也可轻点逐张浏览。';
      term.say = '卡片按等角度环绕圆柱排布，拖动驱动旋转角，松手按速度延续运动并吸附到相邻卡位';
    }
  });

  M.htmlFor = function (spec) {
    const study = spec.kind === 'compound' && STUDIES[spec.mode];
    if (!study) return oldHTML(spec);
    const [id, input] = study;
    const legacy = spec.mode === 'fan' ? '<div class="atlas-legacy" hidden>' + oldHTML(spec) + '</div>' : '';
    return '<div class="atlas-root" data-atlas-id="' + id + '" data-input="' + input + '">' +
      (spec.mode === 'fan' ? '<div class="atlas-variants" role="group" aria-label="可视化版本"><button type="button" data-variant="atlas" aria-pressed="true">风景手记</button><button type="button" data-variant="legacy" aria-pressed="false">摄影卡叠</button></div>' : '') +
      '<div class="atlas-viewport"><div class="atlas-heading" aria-hidden="true"></div><canvas class="atlas-canvas" tabindex="0" role="img"></canvas>' + legacy + '</div>' +
      '<div class="atlas-controls"><span class="atlas-cue"></span>' +
      (input === 'scroll' ? '<input class="atlas-progress" type="range" min="0" max="1000" value="0" step="1"><output>0%</output>' : '') +
      '<button type="button" class="atlas-reset">↺ <span>重置</span></button></div></div>';
  };

  function trimContexts() {
    const loaded = [...stages].filter(s => s.frame);
    let excess = loaded.length - 6;
    for (const s of loaded) {
      if (excess <= 0) break;
      if (!s.active) { s.unload(); excess--; }
    }
  }

  M.KINDS.compound = function (stage, spec) {
    const study = STUDIES[spec.mode];
    if (!study) return oldMount(stage, spec);
    const [id, input] = study;
    const root = stage.querySelector('.atlas-root'), view = root.querySelector('.atlas-viewport');
    const canvas = root.querySelector('canvas'), range = root.querySelector('.atlas-progress');
    const output = root.querySelector('output'), reset = root.querySelector('.atlas-reset');
    const legacy = root.querySelector('.atlas-legacy');
    const abort = new AbortController();
    const listen = (el, event, fn, opts = {}) => el.addEventListener(event, fn, { ...opts, signal: abort.signal });
    const demo = new window.ATLAS_CANVAS.Demo(canvas, { id, mode: input });
    const title = root.querySelector('.atlas-heading');
    demo.onHeading = text => {
      if (!title) return;
      const headingText = THREE.has(id) ? '' : text;
      title.textContent = headingText || '';
      title.hidden = !headingText;
    };
    function theme() {
      if(typeof getComputedStyle !== 'function')return;
      const probe=document.createElement('i');stage.appendChild(probe);
      const color=variable=>{probe.style.color='var('+variable+')';return getComputedStyle(probe).color;};
      demo.theme={top:color('--studio-top'),base:color('--studio-base'),ink:color('--ink'),dark:['ember','graphite'].includes(document.documentElement.dataset.theme)};
      probe.remove();
      api()?.setTheme(demo.theme);demo.draw();
    }
    let active = false, dead = false, variant = 'atlas', last = performance.now();
    let frame = null, ready = false, failed = false, progress = 0;
    let legacyMounted = false;
    const api = () => ready && frame ? frame.contentWindow?.sceneDemo || null : null;
    const controller = { active: false, frame: null, unload() {
      const scene = api();
      if (scene) progress = scene.state().progress;
      if (frame) frame.remove();
      controller.frame = frame = null; ready = false;
    } };
    stages.add(controller);
    const readout = p => {
      progress = Math.max(0, Math.min(1, p));
      root.dataset.progress = progress.toFixed(4);
      if (range) { range.value = Math.round(progress * 1000); output.value = Math.round(progress * 100) + '%'; }
    };
    demo.onChange = () => { if (!api()) readout(demo.p); root.dataset.clicks = demo.clickCount; root.dataset.open = demo.openP.toFixed(3); root.dataset.angle = demo.angle.toFixed(3); root.dataset.tab = demo.tab;
      if (id === 29) root.dataset.plants = demo.garden.length;
    };
    function setProgress(p, velocity = 0) {
      demo.auto = false; demo.p = p; demo.scrollSpeed = velocity;
      const scene = api(); if (scene) scene.setProgress(p);
      readout(p); demo.update(0, performance.now(), 0);
    }
    function language() {
      inputHint();
      reset.querySelector('span').textContent = copy('重置', 'Reset');
      reset.setAttribute('aria-label', copy('重置可视化', 'Reset visualization'));
      const term = window.TERMS.find(t => t.demo === spec);
      const name = term ? (en() ? term.en : term.zh) : spec.mode;
      canvas.setAttribute('aria-label', name + '：' + HINTS[input][en() ? 1 : 0]);
      if (range) range.setAttribute('aria-label', copy('动效进度', 'Animation progress'));
      if (legacy) {
        root.querySelector('.atlas-variants').setAttribute('aria-label', copy('可视化版本', 'Visualization variant'));
        root.querySelector('[data-variant="atlas"]').textContent = copy('风景手记', 'Field notes');
        root.querySelector('[data-variant="legacy"]').textContent = copy('摄影卡叠', 'Photo stack');
      }
      api()?.setLanguage(en() ? 'en' : 'zh'); demo.draw();
    }
    function inputHint() {
      root.querySelector('.atlas-cue').textContent = id === 29
        ? copy('点哪里，哪里生长', 'Tap anywhere to grow a garden')
        : input === 'hover' &&
        (view.clientWidth <= 420 || matchMedia('(hover: none)').matches)
        ? copy('轻点展开 · 再点收起', 'Tap to unfold · tap again to close')
        : HINTS[input][en() ? 1 : 0];
    }
    function configure() {
      const scene = api(); if (!scene) return;
      scene.setLanguage(en() ? 'en' : 'zh');
      if(demo.theme)scene.setTheme?.(demo.theme);
      scene.setMotion(E.motionOn()); scene.setSpeed(stage._speed || 1);
      scene.setProgress(progress); scene.seek(0); scene.setActive(active);
    }
    function load() {
      if (!THREE.has(id) || frame || failed || dead || !active) return;
      frame = document.createElement('iframe');
      frame.className = 'atlas-scene'; frame.title = canvas.getAttribute('aria-label');
      frame.src = 'assets/atlas/scene.html?v=337&id=' + id;
      controller.frame = frame; view.appendChild(frame);
      const loadingFrame = frame;
      listen(frame, 'load', () => {
        if (dead || frame !== loadingFrame) return;
        ready = !!frame?.contentWindow.sceneDemo;
        if (!ready) { failed = true; controller.unload(); root.dataset.fallback = 'true'; return; }
        configure(); trimContexts();
      });
    }
    function syncActive() {
      active = stage.isConnected && !!E.isVisible(stage) && !document.hidden && variant === 'atlas';
      root.dataset.active = String(active); controller.active = active; last = performance.now();
      if (active) load();
      api()?.setActive(active);
    }
    function repaintStill() { if (!E.motionOn()) demo.update(0, performance.now(), 0); }
    ['pointerdown', 'pointerup', 'pointercancel', 'lostpointercapture', 'pointerenter', 'pointermove', 'pointerleave', 'keydown', 'wheel'].forEach(event => listen(canvas, event, () => { repaintStill(); }));
    // Keep handled stage keys from activating the detail page's next/previous navigation.
    listen(canvas, 'keydown', e => {
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Enter',' '].includes(e.key)) e.stopPropagation();
      if (e.key === 'Home' || e.key === 'End') readout(demo.p);
      if (input === 'pointer') {
        if (e.key === 'ArrowLeft') demo.tx = Math.max(0, demo.tx - .1);
        if (e.key === 'ArrowRight') demo.tx = Math.min(1, demo.tx + .1);
        if (e.key === 'ArrowUp') demo.ty = Math.max(0, demo.ty - .1);
        if (e.key === 'ArrowDown') demo.ty = Math.min(1, demo.ty + .1);
      }
      repaintStill();
    });
    if (range) {
      listen(range, 'input', () => {
        const p = +range.value / 1000, delta = p - progress;
        setProgress(p, Math.max(-4, Math.min(4, delta * 35)));
      });
      listen(range, 'keydown', e => e.stopPropagation());
    }
    function resetScene() {
      demo.reset(); api()?.reset(); readout(0);
      if (legacy) legacy.querySelector('.fn-deck')?.classList.remove('open');
      repaintStill();
    }
    listen(reset, 'click', resetScene);
    listen(window, 'message', event => {
      if (!frame || event.source !== frame.contentWindow || event.origin !== location.origin) return;
      if (event.data?.type === 'atlas-ready') { ready = true; configure(); }
      if (event.data?.type === 'atlas-progress') readout(event.data.progress);
      if (event.data?.type === 'atlas-escape') E.closeDetail();
    });
    if (legacy) root.querySelectorAll('[data-variant]').forEach(button => listen(button, 'click', () => {
      variant = button.dataset.variant;
      legacy.hidden = variant !== 'legacy'; canvas.hidden = variant === 'legacy';
      root.querySelectorAll('[data-variant]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      if (variant === 'legacy' && !legacyMounted) {
        oldMount(legacy, spec); legacyMounted = true;
      }
      legacy.tabIndex = variant === 'legacy' ? 0 : -1;
      syncActive(); demo.size();
    }));
    const resize = () => {
      const w = view.clientWidth, h = view.clientHeight;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      demo.size(); inputHint();
    };
    stage._ro = new ResizeObserver(resize); stage._ro.observe(view);
    const labels = new MutationObserver(() => { theme(); language(); });
    labels.observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'data-lang', 'data-theme'] });
    stage._update = now => {
      if (!stage.isConnected) { last = now; return; }
      if (!active || api() || variant !== 'atlas') { last = now; return; }
      const dt = Math.min(.04, Math.max(0, (now - last) / 1000)) * (stage._speed || 1); last = now;
      demo.update(dt, now, dt);
    };
    E.tickers.add(stage._update);
    stage._setActive = syncActive;
    stage._onMotion = on => { last = performance.now(); api()?.setMotion(on); demo.update(0, last, 0); };
    stage._onTiming = () => api()?.setSpeed(stage._speed || 1);
    stage._replay = resetScene;
    stage._dispose = () => {
      if (dead) return; dead = true;
      abort.abort(); labels.disconnect(); stage._ro.disconnect();
      E.tickers.delete(stage._update); demo.destroy(); controller.unload(); stages.delete(controller);
      (legacy?._watchers || []).forEach(fn => E.tickers.delete(fn));
    };
    listen(document, 'visibilitychange', syncActive);
    theme(); language(); resize(); syncActive();
  };
})();
