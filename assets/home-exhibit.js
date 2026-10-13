(function () {
  'use strict';
  function init() {
    const home = document.querySelector('.home-exhibit');
    if (!home) return;
    const engine = window.ENGINE, page = document.querySelector('#page');
    const calm = matchMedia('(prefers-reduced-motion: reduce)');
    const motions = new Set();
    const running = new WeakMap();
    function animate(node, frames, options) {
      if (!node || !engine.motionOn() || calm.matches || !node.animate) return;
      if (running.has(node)) running.get(node).cancel();
      const animation = node.animate(frames, options);
      running.set(node, animation);
      motions.add(animation);
      animation.finished.then(() => motions.delete(animation), () => motions.delete(animation));
      return animation;
    }
    const pieces = [...home.querySelectorAll('[data-preview-id]')].map(article => ({
      article, visible: false,
      preview: engine.mountPreview(article.querySelector('.exhibit-preview'), article.dataset.previewId)
    }));
    function visibility() {
      pieces.forEach(piece => engine.pinVisible(piece.preview.stage, piece.visible && !document.hidden && page.hidden));
      queueScroll();
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { pieces.find(piece => piece.article === entry.target).visible = entry.isIntersecting; });
      visibility();
    }, { threshold: .15 });
    pieces.forEach(piece => observer.observe(piece.article));
    new MutationObserver(visibility).observe(page, { attributes: true, attributeFilter: ['hidden'] });
    document.addEventListener('visibilitychange', visibility);
    engine.onMotion(on => { if (!on) { motions.forEach(animation => animation.cancel()); motions.clear(); } });
    calm.addEventListener('change', () => { if (calm.matches) motions.forEach(animation => animation.cancel()); });
    new MutationObserver(() => {
      pieces.forEach(piece => {
        const term = window.TERMS.find(term => term.id === piece.article.dataset.previewId);
        piece.preview.stage.setAttribute('aria-label', window.I18N.lang === 'en' ? term.en : term.zh);
      });
      queueNav(true);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });

    // Reading navigation responds to the document only, never to a demo's internal scroll input.
    const back = document.querySelector('.exhibit-return'), topbar = document.querySelector('.topbar');
    let scrollFrame = 0;
    function queueScroll() {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        const pastExhibit = home.getBoundingClientRect().bottom < topbar.getBoundingClientRect().bottom;
        topbar.classList.toggle('exhibit-scrolled', window.scrollY > 24);
        const hidden = !pastExhibit || !page.hidden || document.hidden;
        if (back.hidden !== hidden) {
          back.hidden = hidden;
          if (!hidden) animate(back, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' });
        }
      });
    }
    window.addEventListener('scroll', queueScroll, { passive: true });
    window.addEventListener('resize', queueScroll);
    const nav = document.querySelector('#nav'), follow = document.createElement('i');
    follow.className = 'nav-follow'; follow.setAttribute('aria-hidden', 'true'); follow.hidden = true;
    nav.prepend(follow);
    let navFrame = 0, navInstant = false;
    function queueNav(instant) {
      navInstant = navInstant || instant === true;
      if (navFrame) return;
      navFrame = requestAnimationFrame(() => {
        navFrame = 0;
        const active = nav.querySelector('a.here:not([hidden])');
        follow.hidden = !active;
        if (active) {
          follow.classList.toggle('is-instant', navInstant);
          follow.style.height = active.offsetHeight + 'px';
          follow.style.transform = `translateY(${active.offsetTop}px)`;
        }
        navInstant = false;
      });
    }
    new MutationObserver(() => queueNav(false)).observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] });
    new ResizeObserver(() => queueNav(true)).observe(nav);
    document.fonts.ready.then(() => queueNav(true));
    queueNav(true); queueScroll();

    const revealed = new WeakSet();
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || !page.hidden || entry.target.closest('[hidden]') || revealed.has(entry.target)) return;
        revealed.add(entry.target); sectionObserver.unobserve(entry.target);
        animate(entry.target, [{ opacity: .5, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.22,1,.36,1)' });
      });
    }, { threshold: .2 });
    document.querySelectorAll('.cat-hd').forEach(header => sectionObserver.observe(header));

    const lab = document.querySelector('#lab');
    lab.addEventListener('toggle', () => {
      const grid = lab.querySelector('.lab-grid');
      if (running.has(grid)) running.get(grid).cancel();
      if (lab.open) animate(grid, [{ opacity: .3, transform: 'translateY(-7px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)' });
    });
    // Menus use their actual trigger as the visual origin, including keyboard-opened menus.
    document.querySelectorAll('.topbar .menu').forEach(menu => {
      new MutationObserver(() => {
        if (!menu.classList.contains('open')) return;
        animate(menu.querySelector('.menu-list'), [{ opacity: .3, transform: 'translateY(-5px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.22,1,.36,1)' });
      }).observe(menu, { attributes: true, attributeFilter: ['class'] });
    });
    let previousQuery = '', previousCategory = '';
    document.addEventListener('motion:filter', event => {
      const { query, category } = event.detail;
      if (!!query !== !!previousQuery) animate(document.querySelector(query ? '#search-results' : '#sections'), [{ opacity: .6, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' });
      if (category !== previousCategory && !query) {
        const heading = document.querySelector('.cat:not([hidden]) .cat-hd');
        animate(heading, [{ opacity: .6, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
      previousQuery = query; previousCategory = category;
      queueScroll(); queueNav(false);
    });
    new MutationObserver(() => {
      const copied = document.querySelector('#home-copy-status').textContent === window.I18N.t('homeCopied');
      const button = document.querySelector('#home-copy');
      button.classList.toggle('is-copied', copied);
      if (copied) animate(button, [{ transform: 'scale(.96)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    }).observe(document.querySelector('#home-copy-status'), { childList: true });
    document.querySelector('#home-replay').addEventListener('click', () => {
      animate(document.querySelector('#home-replay svg'), [{ transform: 'rotate(-180deg)' }, { transform: 'rotate(0)' }], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' });
    });

    // Pass the actual homepage origin to the existing shared-element detail transition.
    home.addEventListener('click', event => {
      const link = event.target.closest('a[href^="#term/"]');
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const origin = link.closest('.exhibit-piece, .motion-example');
      if (!origin) return;
      event.preventDefault();
      engine.openDetail(link.hash.slice(6), origin);
    });
    if (page.hidden) {
      [home.querySelector('.lede-txt'), home.querySelector('.motion-example'), ...pieces.map(piece => piece.article), home.querySelector('.home-discovery')].forEach((node, i) => {
        animate(node, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: i * 45, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      });
    }
    // Pause for BFCache; dispose only when this document is actually leaving.
    window.addEventListener('pagehide', event => {
      pieces.forEach(piece => engine.pinVisible(piece.preview.stage, false));
      motions.forEach(animation => animation.cancel());
      cancelAnimationFrame(scrollFrame); scrollFrame = 0;
      cancelAnimationFrame(navFrame); navFrame = 0;
      if (!event.persisted) { observer.disconnect(); sectionObserver.disconnect(); pieces.forEach(piece => piece.preview.dispose()); }
    });
    window.addEventListener('pageshow', visibility);
  }
  if (document.readyState === 'complete') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
