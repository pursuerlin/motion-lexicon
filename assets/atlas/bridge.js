/* Host bridge for the original, locally bundled Three.js scenes. */
(function () {
  'use strict';
  const api = window.sceneDemo;
  if (!api) return;
  const originalActive = api.setActive;
  const originalTheme = api.setTheme;
  api.setTheme = function(p) { originalTheme(p); document.body.style.color=p.ink;document.body.style.background=p.base; };
  api.setActive = function (on) { document.body.dataset.active = String(on); originalActive(on); };
  api.setMotion = function (on) {
    window.atlasMotion = !!on;
    originalActive(api.state().active);
  };
  api.setSpeed = function (speed) { window.atlasSpeed = speed; };
  const captions = [...document.querySelectorAll('.caption h1')];
  const zh = captions.map(el => el.textContent);
  const en = ['Every side, a story.', 'Oh, hello.', 'A little elsewhere.', 'Aurel.'];
  api.setLanguage = function (language) {
    document.documentElement.lang = language;
    const scene = document.body.dataset.scene;
    const inputLabels = {
      '1': ['移动指针，角色的目光随你移动；也可使用方向键。', 'Move the pointer or use arrow keys to guide the character’s gaze.'],
      '2': ['移动指针，探索微缩景观的视差；也可使用方向键。', 'Move the pointer or use arrow keys to explore the miniature landscape.'],
      '3': ['悬停展开车门，移开收拢；轻点固定，再点取消。', 'Hover to open the doors, leave to close; tap to pin or unpin.'],
      '16': ['滚轮或纵向拖动，环绕查看角色；方向键调节角度。', 'Scroll or drag vertically to orbit the character; arrow keys adjust the angle.']
    };
    document.querySelector('canvas').setAttribute('aria-label', inputLabels[scene][language === 'en' ? 1 : 0]);
    captions.forEach((el, i) => { el.textContent = language === 'en' ? en[i] : zh[i]; });
    document.querySelector('.edition').textContent = language === 'en' ? 'MOTION ATLAS / INTERACTIVE OBJECTS' : '动效手记 / 交互物件';
    document.querySelectorAll('.caption p').forEach((p,i)=>{ const labels=[['滚动环绕 · 完整一周','Scroll around · a full turn'],['目光 · 回应 · 陪伴','Gaze · response · company'],['海岸 · 灯塔 · 微缩世界','Coast · lighthouse · miniature world'],['四门 · 一次绽放','Four doors · one gesture']];p.textContent=labels[i][language==='en'?1:0]; });
    document.querySelector('.foot').style.display = 'none'; // host supplies the localized input cue
  };
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') parent.postMessage({ type: 'atlas-escape' }, location.origin);
  });
  let last = -1;
  const observer = new MutationObserver(() => {
    const p = +document.body.dataset.progress || 0;
    if (p === last) return;
    last = p;
    parent.postMessage({ type: 'atlas-progress', progress: p }, location.origin);
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-progress'] });
  parent.postMessage({ type: 'atlas-ready' }, location.origin);
})();
