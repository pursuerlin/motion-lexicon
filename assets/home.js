/* 首页灵感签只选择真实术语，内容和可视化共用详情页的数据与引擎。 */
(function () {
  'use strict';
  function init() {
    const $ = selector => document.querySelector(selector);
    const example = $('.motion-example');
    const stage = $('#example-stage');
    if (!example || !stage) return;
    const poolIds = [
      'stagger', 'slide-in', 'pop-in', 'blur-in', 'flip-in', 'clip-reveal',
      'drop-in', 'rise-in', 'rotate', 'wipe-in', 'glow', 'scale-in',
      'tilt-card', 'throw-dismiss', 'proximity-glow', 'ripple', 'section-stack', 'magnetic-button'
    ];
    const effects = poolIds.map(id => window.TERMS.find(term => term.id === id));
    if (effects.some(term => !term)) throw new Error('首页灵感签引用了不存在的术语');
    let current = null, bag = [], preview = null, visible = false, copyTimer = 0, copyVersion = 0;
    const t = key => window.I18N.t(key);
    function localized(field) {
      const english = window.EN[current.id];
      const index = { def: 0, vague: 1, say: 2 }[field];
      return window.I18N.lang === 'en' && english ? english[index] : current[field];
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
      updateVisibility();
    }
    function render() {
      if (!current) return;
      const isEn = window.I18N.lang === 'en';
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
      if (!current || !visible || document.hidden || !window.ENGINE.motionOn()) return;
      // 重建输入驱动舞台也能复位已甩走的卡片、滚动进度和指针状态。
      mount();
      window.ENGINE.replay(preview.stage);
    }
    function draw() {
      if (!bag.length) {
        bag = effects.slice();
        for (let i = bag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
        if (bag[bag.length - 1] === current) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
      }
      current = bag.pop();
      render();
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

    draw();
    new IntersectionObserver(entries => {
      const wasVisible = visible;
      visible = entries.some(entry => entry.isIntersecting);
      updateVisibility();
      if (visible && !wasVisible) window.ENGINE.replay(preview.stage);
    }, { threshold: 0.25 }).observe(example);
    window.ENGINE.onMotion(on => { if (on) play(); });
    document.addEventListener('visibilitychange', updateVisibility);
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });
    new MutationObserver(updateVisibility).observe($('#page'), { attributes: true, attributeFilter: ['hidden'] });
  }
  if (document.readyState === 'complete') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
