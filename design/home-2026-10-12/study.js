(function () {
  function init() {
    const direction = document.documentElement.dataset.study;
    // Compare stable initial states without writing the user's saved preferences.
    const theme = direction === 'b' ? 'celadon' : direction === 'c' ? 'graphite' : 'paper';
    document.documentElement.dataset.theme = theme;
    document.querySelector('#theme-cur').textContent = { paper: '纸感', celadon: '青瓷', graphite: '石墨' }[theme];
    document.querySelector('#recipe-close').click();
    const lead = document.querySelector('.lede-txt');
    const headline = document.querySelector('#home-title');
    const intro = document.querySelector('.home-intro');
    const body = document.querySelector('.home-body');
    if (direction === 'a') {
      lead.insertAdjacentHTML('afterbegin', '<p class="study-kicker">MOTION LEXICON · 把感觉说准确</p>');
      document.querySelector('.home-actions').insertAdjacentHTML('afterend', '<div class="study-phrase"><span class="study-pair"><span>「一个个出现」</span><span aria-hidden="true">→</span><a href="#term/stagger">错峰入场 <span aria-hidden="true">→</span></a></span><span class="study-pair"><span>「滚动像视频」</span><span aria-hidden="true">→</span><a href="#term/scrub-frames">抽帧播放 <span aria-hidden="true">→</span></a></span></div>');
    }
    if (direction === 'b') {
      lead.insertAdjacentHTML('afterbegin', '<p class="study-kicker">动效词汇表 / 从感觉到表达</p>');
      headline.innerHTML = '<span class="study-b-lead">你想要的动效，</span><em>该怎么说？</em>';
      intro.removeAttribute('data-i18n'); intro.textContent = '看真实演示，找到那个准确的名字。';
      body.removeAttribute('data-i18n'); body.textContent = '从「自然一点」到「依次出现」，把感觉写成 AI 和协作者能理解的动效需求。';
      document.querySelector('.example-heading').insertAdjacentHTML('afterend', '<div class="study-flow"><b>01</b> 你的描述 <span>→</span><b>02</b> 看见动效 <span>→</span><b>03</b> 说得准确</div>');
    }
    if (direction === 'c') {
      lead.insertAdjacentHTML('afterbegin', '<p class="study-kicker">MOTION LEXICON / 一部看得见的动效词典</p>');
      headline.innerHTML = '先看见，<em>再说准。</em>';
      intro.removeAttribute('data-i18n'); intro.textContent = '244 个术语，找到你想要的动效。';
      const mini = (side, id, number, category, note) => {
        const term = window.TERMS.find(t => t.id === id);
        const article = document.createElement('article');
        article.className = 'study-mini ' + side;
        article.innerHTML = '<div class="study-mini-head"><span>' + number + ' / ' + category + '</span><span>试一试 ↓</span></div><div class="study-mini-preview"></div><div class="study-mini-copy"><a href="#term/' + id + '">' + term.zh + '<span aria-hidden="true">→</span></a><p>' + note + '</p></div>';
        document.querySelector('.home-discovery').before(article);
        const preview = window.ENGINE.mountPreview(article.querySelector('.study-mini-preview'), id);
        const io = new IntersectionObserver(entries => window.ENGINE.pinVisible(preview.stage, entries.some(e => e.isIntersecting) && document.querySelector('#page').hidden), { threshold: .1 });
        io.observe(article);
        new MutationObserver(() => window.ENGINE.pinVisible(preview.stage, document.querySelector('#page').hidden && article.getBoundingClientRect().bottom > 0)).observe(document.querySelector('#page'), {attributes:true,attributeFilter:['hidden']});
      };
      mini('left', 'drag-compare', '01', '拖拽交互', '拖动分割线，比较画面的两种状态。');
      mini('right', 'morphing-dot-sphere', '03', '形态变化', '点一下变形，拖一拖改变视角。');
    }
  }
  if (document.readyState === 'complete') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
