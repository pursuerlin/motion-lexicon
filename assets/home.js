/* 首页灵感签只选择真实术语，内容和可视化共用详情页的数据与引擎。 */
(function () {
  'use strict';
  function init() {
    const $ = selector => document.querySelector(selector);
    const example = $('.motion-example');
    const stage = $('#example-stage');
    if (!example || !stage) return;
    const poolIds = [...new Set([
      'stagger', 'slide-in', 'drag-compare', 'blur-in', 'flip-in', 'clip-reveal',
      'drop-in', 'rise-in', 'liquid-follow', 'preview-follow', 'glow', 'scale-in',
      'tilt-card', 'throw-dismiss', 'proximity-glow', 'ripple', 'section-stack', 'depth-tunnel',
      'morphing-dot-sphere', 'hover-fan', 'chart-build', 'scramble-decode',
      'page-curl', 'scrub-frames', 'shared-element',
      ...window.TERMS.filter(term => term.demo && term.demo.atlas).map(term => term.id)
    ])];
    // Fixed exhibits are the source of exclusions, so a future exhibit change cannot duplicate a draw.
    const fixedIds = new Set([...document.querySelectorAll('.home-exhibit [data-preview-id]')].map(node => node.dataset.previewId));
    const effects = poolIds.filter(id => !fixedIds.has(id)).map(id => window.TERMS.find(term => term.id === id));
    if (effects.some(term => !term)) throw new Error('首页灵感签引用了不存在的术语');
    let current = null, bag = [], preview = null, visible = false, copyTimer = 0, copyVersion = 0, selectedMode = 'all';
    const scrollIds = new Set(['section-stack', 'depth-tunnel', 'chart-build', 'scrub-frames']);
    const hoverIds = new Set(['liquid-follow', 'preview-follow', 'tilt-card', 'proximity-glow', 'hover-fan']);
    const dragIds = new Set(['throw-dismiss', 'page-curl']);
    const clickIds = new Set(['ripple', 'shared-element', 'scramble-decode']);
    const atlasDriver = term => ({scroll:'Scroll',pointer:'Pointer',hover:'Hover',click:'Click',drag:'Drag'})[(term.demo || {}).atlasInput];
    const driverOf = term => atlasDriver(term) || (scrollIds.has(term.id) ? 'Scroll' : term.id === 'hover-fan' ? 'Hover' : hoverIds.has(term.id) ? 'Pointer' : dragIds.has(term.id) ? 'Drag' : clickIds.has(term.id) ? 'Click' : 'Auto');
    const modeOf = term => (term.demo || {}).atlasInput ? (term.demo.atlasInput === 'scroll' ? 'scroll' : 'pointer') : scrollIds.has(term.id) ? 'scroll' : hoverIds.has(term.id) || dragIds.has(term.id) || clickIds.has(term.id) ? 'pointer' : 'auto';
    const pool = () => selectedMode === 'all' ? effects : effects.filter(term => modeOf(term) === selectedMode);
    const modeBar = $('.inspiration-modes'), indicator = $('.mode-indicator');
    const calm = matchMedia('(prefers-reduced-motion: reduce)');
    const t = key => window.I18N.t(key);
    function localized(field) {
      const english = window.EN[current.id];
      const index = { def: 0, vague: 1, say: 2 }[field];
      const text = window.I18N.lang === 'en' && english ? english[index] : current[field];
      return text.replace(/\*\*([^*]+)\*\*/g, '$1');
    }
    function resetCopy() {
      clearTimeout(copyTimer);
      copyVersion++;
      $('#home-copy span').textContent = t('homeCopy');
      $('#home-copy-status').textContent = '';
    }
    function updateVisibility() {
      if (!preview) return;
      window.ENGINE.pinVisible(preview.stage, visible && !document.hidden && $('#page').hidden);
    }
    function mount() {
      if (preview) preview.dispose();
      preview = window.ENGINE.mountPreview(stage, current.id);
      updateInputHint();
      updateVisibility();
    }
    const touchLayout = matchMedia('(max-width: 700px), (hover: none) and (pointer: coarse)');
    let touchInput = false;
    function updateInputHint() {
      if (!current || !hoverIds.has(current.id) || !(touchLayout.matches || touchInput)) return;
      const hint = stage.querySelector('.example-hint');
      if (!hint) return;
      hint.removeAttribute('data-i18n');
      hint.removeAttribute('data-l10n');
      const en = window.I18N.lang === 'en';
      hint.textContent = current.id === 'hover-fan' ? (en ? 'Tap a card to unfold' : '轻点卡片，展开扇面') : current.id === 'preview-follow' ? (en ? 'Tap an item to preview' : '轻点条目，切换预览') : (en ? 'Tap or slide inside the frame' : '轻点或在框里滑动');
    }
    stage.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch') { touchInput = true; updateInputHint(); }
    });
    touchLayout.addEventListener('change', () => { if (current) mount(); });
    function render() {
      if (!current) return;
      const isEn = window.I18N.lang === 'en';
      $('.example-pool').textContent = t('homePool').replace('{count}', pool().length);
      if (modeBar) modeBar.setAttribute('aria-label', t('homeModesLabel'));
      if ($('#example-driver')) $('#example-driver').textContent = t('homeDriver' + driverOf(current));
      ['example-vague', 'example-title', 'example-spec', 'example-note'].forEach(id => $( '#' + id).removeAttribute('data-i18n'));
      $('#example-vague').textContent = (isEn ? '“' : '「') + localized('vague') + (isEn ? '”' : '」');
      $('#example-title').textContent = isEn ? current.en : current.zh;
      $('#example-en').hidden = true;
      $('#example-spec').textContent = localized('say');
      $('#example-note').textContent = localized('def');
      $('#example-link').href = '#term/' + current.id;
      example.dataset.effect = current.id;
      mount();
      resetCopy();
    }
    function play() {
      if (!current || !visible || document.hidden) return;
      // 重建输入驱动舞台也能复位已甩走的卡片、滚动进度和指针状态。
      mount();
      window.ENGINE.replay(preview.stage);
    }
    function draw() {
      if (!bag.length) {
        bag = pool().slice();
        for (let i = bag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
        if (bag[bag.length - 1] === current) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
      }
      current = bag.pop();
      render();
      const status = $('#home-draw-status');
      if (status) status.textContent = t('homeDrawn').replace('{name}', window.I18N.lang === 'en' ? current.en : current.zh).replace('{driver}', t('homeDriver' + driverOf(current)));
    }
    function syncIndicator(instant) {
      if (!indicator) return;
      const active = modeBar.querySelector('[aria-pressed="true"]');
      indicator.classList.toggle('is-instant', instant);
      indicator.style.transform = `translateX(${active.offsetLeft}px)`;
      indicator.style.width = active.offsetWidth + 'px';
    }
    if (modeBar) {
      modeBar.addEventListener('click', event => {
        const button = event.target.closest('[data-home-mode]');
        if (!button || button.dataset.homeMode === selectedMode) return;
        selectedMode = button.dataset.homeMode; bag = [];
        modeBar.querySelectorAll('button').forEach(node => node.setAttribute('aria-pressed', String(node === button)));
        draw(); syncIndicator(false);
      });
      new ResizeObserver(() => syncIndicator(true)).observe(modeBar);
    }
    $('#home-random').addEventListener('click', draw);
    $('#home-replay').addEventListener('click', play);
    $('#home-copy').addEventListener('click', async () => {
      const text = [current.zh + ' / ' + current.en, localized('say'), localized('def')].join('\n\n'), version = copyVersion;
      let copied = false;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          copied = true;
        }
      } catch (error) { /* 继续使用浏览器的复制降级。 */ }
      if (!copied) {
        const input = document.createElement('textarea');
        input.value = text;
        input.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
        document.body.appendChild(input);
        input.select();
        try { copied = document.execCommand('copy'); } catch (error) { copied = false; }
        input.remove();
        $('#home-copy').focus();
      }
      if (version !== copyVersion) return;
      const message = t(copied ? 'homeCopied' : 'homeCopyFailed');
      $('#home-copy span').textContent = message;
      $('#home-copy-status').textContent = message;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(resetCopy, 1800);
    });

    if (example.closest('.home-exhibit')) { current = effects.find(term => term.id === 'scrub-frames'); render(); }
    else draw();
    new IntersectionObserver(entries => {
      const wasVisible = visible;
      visible = entries.some(entry => entry.isIntersecting);
      updateVisibility();
      if (visible && !wasVisible) window.ENGINE.replay(preview.stage);
    }, { threshold: 0.25 }).observe(example);
    window.ENGINE.onMotion(on => { if (on) play(); });
    document.addEventListener('visibilitychange', updateVisibility);
    new MutationObserver(() => { render(); syncIndicator(true); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });
    new MutationObserver(updateVisibility).observe($('#page'), { attributes: true, attributeFilter: ['hidden'] });
  }
  if (document.readyState === 'complete') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
