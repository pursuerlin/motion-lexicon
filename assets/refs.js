/* ============================================================
   refs.js —— 真实落地参考
   把互联网上正在跑的同类实现挂在术语详情页的演示下面，和本站演示共存。

   为什么是「点击才载入 iframe」：
   1. 本站是零依赖静态站，离线也要能用；自动加载 30 个外部 iframe 会拖慢首屏并产生一堆跨域报错。
   2. 苹果 / Stripe / Linear / Awwwards / GSAP 全部用 X-Frame-Options 或 CSP frame-ancestors
      拒绝被嵌（实测过），硬嵌只会得到一片空白，所以它们只给外链。
   3. scroll-driven-animations.style 的 demo 页不带 frame 头，可以真嵌 —— 但它把同一个
      效果出成 css / waapi 两个版本，正好能和本站的实现对照着看。

   所有 URL 都在 2026-09-21 用 HTTP 状态码逐条验证过，不是凭印象写的。
   ============================================================ */
(function () {
  'use strict';

  const SDA = 'https://scroll-driven-animations.style/demos/';

  /* embed: 可实时嵌进来看的；link: 只给外链（对方拒绝被嵌，或页面太重） */
  const EMB = function (title, slug, note) {
    return { title: title, url: SDA + slug + '/css/', alt: SDA + slug + '/waapi/', note: note, embed: true };
  };
  const LNK = function (title, url, host, note) {
    return { title: title, url: url, host: host, note: note, embed: false };
  };

  const REFS = {
    /* ---------- 组合范式 ---------- */
    'section-stack': [EMB('Stacking Cards', 'stacking-cards', '同一批卡片滚上来时逐层压住前一张')],
    'horizontal-scroll': [
      EMB('Horizontal Section', 'horizontal-section', '纵向滚动推横向位移，本站同款'),
      EMB('Horizontal Carousel', 'horizontal-carousel', '横向轮播版')
    ],
    'pinned-hero': [
      EMB('Cover to Fixed Header', 'cover-to-fixed-header', '封面滚到顶后缩成固定页眉'),
      EMB('Shrinking Header + Shadow', 'shrinking-header-shadow', '头部收缩同时浮出投影')
    ],
    'sticky-two-col': [EMB('Contact List', 'contact-list', '左侧钉住、右侧滚动的经典双栏')],
    'progress-ring': [EMB('Progress Bar', 'progress-bar', '滚动进度条，本站把它做成了环形')],
    'scene-parallax': [EMB('Parallax Carousel', 'parallax-carousel', '轮播里的多层视差')],
    'scroll-orbit': [EMB('3D Shoe Explorer', '3d-shoe-explorer', '滚动驱动 3D 模型旋转，商品页常用')],
    'hover-fan': [EMB('Cover Flow', 'cover-flow', '封面流：中间放大两侧展开')],
    'card-peel': [EMB('Cover Flow', 'cover-flow', '同一套排布，看它怎么做前后层次')],
    'scrub-frames': [EMB('Carousel with Markers', 'carousel-with-markers', '带标记点的分段滚动吸附')],
    'scroll-jank': [EMB('Reverse Scroll', 'reverse-scroll', '反向滚动，最容易暴露卡顿的一类')],
    'line-mask-reveal': [EMB('Image Reveal', 'image-reveal', '图片蒙版揭示，落地页高频')],
    'drag-compare': [EMB('Scroll Shadows', 'scroll-shadows', '滚动阴影提示还有内容')],
    'theme-morph': [LNK('Linear · Method', 'https://linear.app/method', 'linear.app', '整站随滚动/路由换主题色的样板')],
    'immersive-float': [LNK('Awwwards · Scrolling', 'https://www.awwwards.com/websites/scrolling/', 'awwwards.com', '获奖站里的滚动叙事合集，找同题材参考')],
    'spotlight-reveal': [LNK('Codrops Demos', 'https://tympanus.net/Development/', 'tympanus.net', '遮罩/聚光揭示类交互的实现在这里最多')],
    'vortex-transit': [LNK('Codrops Demos', 'https://tympanus.net/Development/', 'tympanus.net', '隧道/穿越类转场')],
    'gaze-tracking': [LNK('RESN', 'https://www.resn.co.nz/', 'resn.co.nz', '指针驱动整页反应的老牌互动工作室')],
    'cursor-trail': [LNK('RESN', 'https://www.resn.co.nz/', 'resn.co.nz', '拖尾与指针形变')],
    'proximity-glow': [LNK('vibe-hub', 'https://vibe-hub.org/', 'vibe-hub.org', '卡片就近发光 / 悬停辉光的现下样板')],
    'liquid-follow': [LNK('vibe-hub', 'https://vibe-hub.org/', 'vibe-hub.org', '液态跟随与共享元素转场')],
    'door-bloom': [LNK('Apple · iPhone', 'https://www.apple.com/iphone-16-pro/', 'apple.com', '滚动驱动的产品揭幕，商品页天花板')],
    'fab-to-sheet': [LNK('Material Design · FAB', 'https://m3.material.io/components/floating-action-button/specs', 'm3.material.io', '官方容器变换规范，写需求时直接引')],
    'button-tri-state': [LNK('Material Design · Buttons', 'https://m3.material.io/components/buttons/guidelines', 'm3.material.io', '按钮状态转动的官方图例')],
    'chart-build': [LNK('Observable', 'https://observablehq.com/', 'observablehq.com', '图表入场动画的密集使用现场')],
    'helix-flow': [
      LNK('Codrops Demos', 'https://tympanus.net/codrops/demos/', 'tympanus.net', '3D 排布 / 螺旋画廊的实现在这里最多，按 3D 筛'),
      LNK('GSAP Vault · 96 examples', 'https://gsapvault.com/blog/gsap-animation-examples', 'gsapvault.com', '带代码的 GSAP 案例合集')
    ],
    'luminous-flow': [LNK('Codrops Demos', 'https://tympanus.net/codrops/demos/', 'tympanus.net', '辉光 / 模糊 / 光带一类效果基本都出自它')],
    'velocity-skew': [
      LNK('Velocity Skew 拆解', 'https://www.webbae.net/posts/horizontal-scrolling-section-with-parallax-and-velocity-skew-effects', 'webbae.net', '速度形变的完整推导，写需求时可直接引'),
      LNK('GSAP 论坛 · 按速度缩放', 'https://gsap.com/community/forums/topic/40070-scale-on-scroll-velocity-like-the-skew-demo/', 'gsap.com', '同一个思路换成 scale 的版本')
    ],
    'preview-follow': [
      LNK('Codrops Demos', 'https://tympanus.net/codrops/demos/', 'tympanus.net', '指针跟随预览卡片的实现'),
      LNK('Effect.Labs', 'https://effect-labs.com/en/effects/text/scramble-text-2.html', 'effect-labs.com', '成品级 hover / 跟随效果目录')
    ],
    'throw-dismiss': [LNK('Material · Cards 规范', 'https://m3.material.io/components/cards/guidelines', 'm3.material.io', '滑动关闭的官方位移与缓动规范')],
    'scramble-decode': [
      { title: 'Text Scramble 现场可玩', url: 'https://learnui.qiaomu.ai/web/text-scramble/', note: '可以直接改文案看解码过程', embed: true },
      { title: 'Animbits · Scramble', url: 'https://www.animbits.dev/docs/animations/text/scramble', note: '带 React 代码的解码文字组件', embed: true },
      LNK('GSAP ScrambleTextPlugin', 'https://gsap.com/docs/v3/Plugins/ScrambleTextPlugin/', 'gsap.com', '官方插件文档，商用项目多数走这条')
    ],

    /* ---------- 三维与运行时 ---------- */
    'preserve-3d': [EMB('3D Shoe Explorer', '3d-shoe-explorer', '真嵌一个 3D 滚动案例，看它怎么保深度')],
    /* key 必须是术语 id：之前的 scroll-linked-parallax 匹配不到任何术语，整条参考永远不出现 */
    'parallax': [EMB('Parallax Carousel', 'parallax-carousel', '视差落地实现')],

    /* ---------- 性能与工程 ---------- */
    'content-visibility': [LNK('web.dev · Content Visibility', 'https://web.dev/content-visibility/', 'web.dev', '官方文档带可跑的示例')],
    'will-change': [LNK('Chrome DevTools · 性能面板', 'https://developer.chrome.com/docs/devtools/performance/', 'developer.chrome.com', '用 DevTools 面板验证合成层是否真的生效')]
  };

  function hostOf(u) { try { return new URL(u).host.replace(/^www\./, ''); } catch (e) { return ''; } }

  function panelHTML(id) {
    const list = REFS[id];
    if (!list || !list.length) return '';
    return '<section class="refs" aria-label="真实落地参考">' +
      '<h3 class="refs-hd">真实落地参考<span>互联网上正在跑的同类实现 · 和本页演示对照着看</span></h3>' +
      '<div class="ref-list">' + list.map(function (r, i) {
        return '<article class="ref' + (r.embed ? ' ref--embed' : ' ref--link') + '">' +
          '<header class="ref-top"><b>' + r.title + '</b>' +
          '<span class="ref-host">' + (r.host || hostOf(r.url)) + '</span></header>' +
          '<p class="ref-note">' + r.note + '</p>' +
          '<div class="ref-acts">' +
          (r.embed ? '<button type="button" class="ref-load" data-i="' + i + '">载入实时演示</button>' : '') +
          '<a class="ref-open" href="' + r.url + '" target="_blank" rel="noopener noreferrer">新窗口打开 ↗</a>' +
          (r.alt ? '<a class="ref-open" href="' + r.alt + '" target="_blank" rel="noopener noreferrer">' +
            (r.embed ? '看 WAAPI 版 ↗' : '另一版 ↗') + '</a>' : '') +
          '</div><div class="ref-slot"></div></article>';
      }).join('') + '</div></section>';
  }

  /* iframe 一律点击后才插入；加载失败要能自己承认，不能留一块空白让人以为是本站坏了 */
  function wire(root, id) {
    /* 详情页节点是按 id 缓存复用的，每次 openDetail 都重挂就会攒出多个监听器：
       第一个刚插好 iframe，第二个看到 slot 非空又当成「再点一次收起」当场清掉，
       表现就是「载入实时演示」按了没反应。同一个节点只挂一次。 */
    if (root._refsWired) return;
    root._refsWired = true;
    const list = REFS[id] || [];
    root.addEventListener('click', function (e) {
      const btn = e.target.closest('.ref-load');
      if (!btn) return;
      const card = btn.closest('.ref'), slot = card.querySelector('.ref-slot');
      if (slot.firstChild) { slot.innerHTML = ''; btn.textContent = '载入实时演示'; return; }
      const r = list[+btn.dataset.i];
      if (!r) return;
      const fr = document.createElement('iframe');
      fr.className = 'ref-frame';
      fr.loading = 'lazy';
      fr.title = r.title + ' · 实时演示';
      fr.allow = 'fullscreen';
      let loaded = false;
      fr.addEventListener('load', function () { loaded = true; card.classList.add('ref--on'); });
      slot.appendChild(fr);
      fr.src = r.url;
      btn.textContent = '收起实时演示';
      setTimeout(function () {
        /* 用户可能已经收起（slot 被清空）或换载了别的演示：
           只认自己插进去的那个 iframe，否则会在已收起的卡片上出现幽灵报错 */
        if (loaded || fr.parentNode !== slot) return;
        slot.innerHTML = '<p class="ref-fail">这个站点没有响应，可能被它的网络策略挡了 —— ' +
          '请点「新窗口打开」直接看原站。</p>';
        btn.hidden = true;
      }, 9000);
    });
  }

  window.REFS = {
    panelHTML: panelHTML,
    wire: wire
  };
})();
