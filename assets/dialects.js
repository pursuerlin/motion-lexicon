/* Export only self-contained native implementations. Never fall back to term.code:
   those source notes include pseudocode, platform-specific APIs and missing assets. */
(function () {
  'use strict';
  const LIST = [
    { key: 'css', label: 'CSS', zh: '原生关键帧与过渡', en: 'Native keyframes & transitions' },
    { key: 'waapi', label: 'WAAPI', zh: 'JavaScript 浏览器动画 API', en: 'JavaScript Web Animations API' }
  ];
  let current = 'css';
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const en = () => window.I18N && window.I18N.lang === 'en';
  const label = key => window.I18N ? window.I18N.t(key) : ({dialect:'代码写法',copy:'复制',codeTranslated:'基础关键帧实现 · 保存为 HTML 后打开即可运行。'}[key] || key);
  const ms = value => /ms$/.test(String(value)) ? parseFloat(value) : parseFloat(value) * 1000;
  const allowed = new Set(['kind','html','frames','e','d','play','multi','st','loop','alt','dir','repeat','wait','nofill','hint','ctl','label','ball']);
  const properties = new Set(['transform','opacity','filter','clip-path','transform-origin','box-shadow','text-shadow']);
  function readFrames(frames) {
    if (!Array.isArray(frames) || frames.length < 2) return null;
    let previous = -1;
    const result = [];
    for (const frame of frames) {
      if (!Array.isArray(frame) || !Number.isFinite(frame[0]) || frame[0] < previous || frame[0] < 0 || frame[0] > 100 || typeof frame[1] !== 'string') return null;
      previous = frame[0];
      const raw = {};
      for (const declaration of frame[1].split(';').filter(s => s.trim())) {
        const i = declaration.indexOf(':');
        if (i < 0) return null;
        const property = declaration.slice(0,i).trim(), value = declaration.slice(i+1).trim();
        if (!properties.has(property) || !value || /[{}<>]|var\(|url\(|!important/.test(value)) return null;
        raw[property] = value;
      }
      result.push({offset: frame[0]/100, raw});
    }
    return result[0].offset === 0 && result[result.length-1].offset === 1 ? result : null;
  }
  function specs(term, overrides) {
    const d = term.demo || {}, o = overrides || {};
    // These definitions depend on additional layout, input logic or rendering assets.
    if (['unmount','perspective','transform-origin','reduced-motion','glass','zoom-through','reveal-camera'].includes(term.id)) return null;
    if (d.kind && !['frames','two'].includes(d.kind)) return null;
    const sources = d.kind === 'two' ? [d.a,d.b] : [d];
    const result = [];
    for (const source of sources) {
      if (!source || Object.keys(source).some(k => !allowed.has(k))) return null;
      const frames = readFrames(source.frames);
      if (!frames) return null;
      const ease = source.e || 'cubic-bezier(0.16,1,0.3,1)';
      if (!/^(linear|ease|ease-in|ease-out|ease-in-out|cubic-bezier\([-\d.,\s]+\)|steps\(\d+(?:,\s*(?:start|end|jump-start|jump-end|jump-none|jump-both))?\))$/.test(ease)) return null;
      const play = source.play || 'in';
      if (!['in','always','hover','press'].includes(play) || (['hover','press'].includes(play) && frames.length !== 2)) return null;
      const defaults = {};
      (d.ctl || []).forEach(c => { defaults[c.p] = c.v; });
      (source.ctl || []).forEach(c => { defaults[c.p] = c.v; });
      const settings = Object.assign(defaults,o);
      const baseDuration = ms(source.d || '520ms');
      const duration = settings.dur != null ? (d.kind === 'two' ? baseDuration * +settings.dur / ms(d.a.d || '520ms') : +settings.dur) : baseDuration;
      const stagger = settings.st != null ? +settings.st : +(source.st || 0);
      const count = source.multi || 1;
      const wait = source.wait ? ms(source.wait) : 0;
      if (![duration,stagger,count,wait].every(Number.isFinite) || duration <= 0 || count < 1 || count > 20 || !Number.isInteger(count)) return null;
      const loop = o.loop == null ? !!source.loop : !!o.loop;
      const direction = source.dir || (source.alt || (loop && !source.loop) ? 'alternate' : 'normal');
      if (!['normal','reverse','alternate','alternate-reverse'].includes(direction)) return null;
      const iterations = loop ? 'infinite' : (source.loop ? 1 : source.repeat || 1);
      if (iterations !== 'infinite' && (!Number.isFinite(iterations) || iterations <= 0)) return null;
      result.push({frames,ease,play,duration,stagger,count,wait,direction,iterations,fill:source.nofill?'none':'both',label:source.label || term.zh});
    }
    return result;
  }
  const declarations = raw => Object.entries(raw).map(([k,v]) => k + ': ' + v + ';').join(' ');
  const jsFrames = spec => spec.frames.map(f => {
    const frame = {offset:f.offset,easing:spec.ease};
    Object.entries(f.raw).forEach(([k,v]) => { frame[k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())] = v; });
    return frame;
  });
  function generate(term, groups) {
    const css = [], scripts = [], markup = [];
    groups.forEach((s,g) => {
      const selector = '.motion-' + g;
      const interactive = ['hover','press'].includes(s.play);
      markup.push('<section class="group"><h2>' + esc(s.label) + '</h2><div class="stage">' + Array.from({length:s.count},(_,i) => '<button class="object motion-' + g + '" type="button" style="--i:' + i + '">' + (interactive ? (s.play==='hover'?'悬停 / 聚焦':'按住 / 空格') : '✦') + '</button>').join('') + '</div></section>');
      if (current === 'css') {
        if (interactive) {
          css.push(selector + ' { ' + declarations(s.frames[0].raw) + ' transition: ' + Object.keys(s.frames[1].raw).map(k=>k+' '+s.duration+'ms '+s.ease).join(', ') + '; }');
          const active = selector + (s.play==='hover'?':hover, '+selector+':focus-visible':':active, '+selector+'.held');
          if (s.iterations !== 1) {
            css.push('@keyframes motion'+g+' {\n'+s.frames.map(f=>'  '+(f.offset*100)+'% { '+declarations(f.raw)+' }').join('\n')+'\n}');
            css.push(active + ' { animation: motion'+g+' '+s.duration+'ms '+s.ease+' '+s.iterations+' '+s.direction+' '+s.fill+'; }');
          } else css.push(active + ' { ' + declarations(s.frames[1].raw) + ' }');
          if (s.play==='press') scripts.push('document.querySelectorAll('+JSON.stringify(selector)+').forEach(el => {\n  el.addEventListener("keydown", e => { if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); el.classList.add("held"); } });\n  el.addEventListener("keyup", () => el.classList.remove("held"));\n  el.addEventListener("blur", () => el.classList.remove("held"));\n});');
        } else {
          css.push('@keyframes motion'+g+' {\n'+s.frames.map(f=>'  '+(f.offset*100)+'% { '+declarations(f.raw)+' }').join('\n')+'\n}');
          css.push('.running '+selector+' { animation: motion'+g+' '+s.duration+'ms '+s.ease+' '+s.iterations+' '+s.direction+' '+s.fill+'; animation-delay: calc('+s.wait+'ms + var(--i) * '+s.stagger+'ms); }');
        }
      } else {
        const options = '{duration: '+s.duration+', easing: "linear", iterations: '+(s.iterations==='infinite'?'Infinity':s.iterations)+', direction: '+JSON.stringify(s.direction)+', fill: '+JSON.stringify(s.fill)+'}';
        // CSS timing functions apply within each keyframe segment, not to the whole timeline.
        const frames = JSON.stringify(jsFrames(s),null,2);
        if (interactive) {
          scripts.push('document.querySelectorAll('+JSON.stringify(selector)+').forEach(el => {\n  const animation = el.animate('+frames+', '+options+');\n  animation.pause(); animation.currentTime = 0;\n  const update = () => { const on = '+(s.play==='hover'?'el.matches(":hover, :focus-visible")':'el.classList.contains("held")')+'; animation.playbackRate = on ? 1 : -1; animation.play(); };\n  ["pointerenter", "pointerleave", "focus", "blur", "pointerdown", "pointerup", "pointercancel", "lostpointercapture"].forEach(type => el.addEventListener(type, update));\n  el.addEventListener("keydown", e => { if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); el.classList.add("held"); update(); } });\n  el.addEventListener("keyup", () => { el.classList.remove("held"); update(); });\n  el.addEventListener("blur", () => { el.classList.remove("held"); update(); });\n  el.addEventListener("pointerdown", e => { el.setPointerCapture(e.pointerId);'+(s.play==='press'?' el.classList.add("held"); update();':'')+' });\n  ["pointerup", "pointercancel", "lostpointercapture"].forEach(type => el.addEventListener(type, () => { el.classList.remove("held"); update(); }));\n});');
        } else {
          scripts.push('function play'+g+'() {\n  document.querySelectorAll('+JSON.stringify(selector)+').forEach((el, i) => {\n    el.getAnimations().forEach(animation => animation.cancel());\n    el.animate('+frames+', {...'+options+', delay: '+s.wait+' + i * '+s.stagger+'});\n  });\n}');
        }
      }
    });
    const auto = groups.map((s,g)=>!['hover','press'].includes(s.play)?g:null).filter(g=>g!==null);
    scripts.push(current==='css' ? 'function replay() { document.body.classList.remove("running"); void document.body.offsetWidth; document.body.classList.add("running"); }' : 'function replay() { '+auto.map(g=>'play'+g+'();').join(' ')+' }');
    scripts.push('document.querySelector("#replay").addEventListener("click", replay);\nreplay();');
    return '<!doctype html>\n<html lang="zh-CN">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>'+esc(term.zh)+'</title>\n<style>\n* { box-sizing: border-box; }\nbody { margin: 0; padding: 32px; background: #f4f0e8; color: #29251f; font: 16px system-ui; }\nmain { max-width: 720px; margin: auto; }\nh1 { font-size: 24px; } h2 { font-size: 14px; font-weight: 500; }\n.stage { display: flex; justify-content: center; align-items: center; gap: 12px; min-height: 240px; flex-wrap: wrap; }\n.object { flex: 0 0 auto; width: 80px; height: 64px; border: 0; border-radius: 14px; background: linear-gradient(135deg,#dfa66f,#92563c); color: white; font: 14px system-ui; cursor: pointer; }\n.object:focus-visible { outline: 2px solid #754e37; outline-offset: 5px; }\n#replay { padding: 10px 20px; border: 1px solid #bba998; border-radius: 24px; background: white; cursor: pointer; }\n'+css.join('\n')+'\n</style>\n<main><h1>'+esc(term.zh)+'</h1>\n'+markup.join('\n')+'\n<button id="replay" type="button">重新播放</button></main>\n<script>\n'+scripts.join('\n')+'\n</script>\n</html>';
  }
  function codeFor(term,overrides) { const groups = specs(term,overrides); return groups ? generate(term,groups) : ''; }
  function panelHTML(term,overrides) {
    const code = codeFor(term,overrides);
    if (!code) return '';
    const active = LIST.find(d=>d.key===current);
    return '<div class="codewrap"><div class="code-header"><span class="code-label">'+esc(label('dialect'))+'</span><details class="code-format"><summary aria-label="'+esc(label('dialect'))+'"><b>'+active.label+'</b><span aria-hidden="true">⌄</span></summary><div class="code-options" role="group" aria-label="'+esc(label('dialect'))+'">'+LIST.map(d=>'<button type="button" data-code-format="'+d.key+'" aria-pressed="'+(d.key===current)+'"><span><b>'+d.label+'</b><small>'+esc(en()?d.en:d.zh)+'</small></span><span class="code-check" aria-hidden="true">✓</span></button>').join('')+'</div></details><button class="copy" type="button">'+esc(label('copy'))+'</button></div><p class="code-note">'+esc(label('codeTranslated'))+'</p><pre tabindex="0" aria-label="'+active.label+'"><code>'+esc(code)+'</code></pre></div>';
  }
  function refreshPanel(node,term,overrides) {
    const wrap = node.querySelector('.codewrap');
    if (!wrap) return;
    const code = codeFor(term,overrides);
    if (!code) { wrap.remove(); return; }
    wrap.querySelector('code').textContent = code;
    wrap.querySelector('.code-label').textContent = label('dialect');
    wrap.querySelector('.code-note').textContent = label('codeTranslated');
    const details = wrap.querySelector('details');
    details.querySelector('summary').setAttribute('aria-label',label('dialect'));
    details.querySelector('summary b').textContent = LIST.find(d=>d.key===current).label;
    wrap.querySelector('pre').setAttribute('aria-label',LIST.find(d=>d.key===current).label);
    details.querySelector('.code-options').setAttribute('aria-label',label('dialect'));
    details.querySelectorAll('[data-code-format]').forEach(button => {
      const d = LIST.find(d=>d.key===button.dataset.codeFormat);
      button.setAttribute('aria-pressed',String(d.key===current));
      button.querySelector('small').textContent = en()?d.en:d.zh;
    });
  }
  window.DIALECTS = {list:LIST,get current(){return current;},set(key){if(LIST.some(d=>d.key===key))current=key;},codeFor,panelHTML,refreshPanel,compilable:term=>!!specs(term),status:term=>specs(term)?'translated':'unavailable'};
})();
