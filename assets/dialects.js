/* ============================================================
   dialects.js —— 把术语的演示规格编译成各框架写法
   思路：术语数据里已经带有 frames / easing / duration / stagger，
   等于一份结构化时间轴，直接编译成 CSS · WAAPI · GSAP · Framer
   Motion · Swift · Jetpack Compose · Tailwind 七种方言。
   ============================================================ */
(function () {
  'use strict';

  const EASE_NAMES = [
    { re: /^linear$/, gsap: 'none', tw: 'ease-linear', ios: 'curveLinear', framer: 'linear' },
    { re: /cubic-bezier\(\s*0?\.16,\s*1,\s*0?\.3,\s*1\s*\)/, gsap: 'expo.out', tw: 'ease-out', ios: 'curveEaseOut', framer: 'easeOut' },
    { re: /cubic-bezier\(\s*0?\.33,\s*1,\s*0?\.68,\s*1\s*\)/, gsap: 'power3.out', tw: 'ease-out', ios: 'curveEaseOut', framer: 'easeOut' },
    { re: /cubic-bezier\(\s*0?\.32,\s*0,\s*0?\.67,\s*0\s*\)/, gsap: 'power3.in', tw: 'ease-in', ios: 'curveEaseIn', framer: 'easeIn' },
    { re: /cubic-bezier\(\s*0?\.65,\s*0,\s*0?\.35,\s*1\s*\)/, gsap: 'power3.inOut', tw: 'ease-in-out', ios: 'curveEaseInOut', framer: 'easeInOut' },
    { re: /cubic-bezier\(\s*0?\.34,\s*1\.56,\s*0?\.64,\s*1\s*\)/, gsap: 'back.out(1.7)', tw: 'ease-out', ios: 'curveEaseOut', framer: 'easeOut' },
    { re: /cubic-bezier\(\s*0?\.22,\s*1,\s*0?\.36,\s*1\s*\)/, gsap: 'expo.out', tw: 'ease-out', ios: 'curveEaseOut', framer: 'easeOut' },
    { re: /cubic-bezier\(\s*0?\.76,\s*0,\s*0?\.24,\s*1\s*\)/, gsap: 'power4.inOut', tw: 'ease-in-out', ios: 'curveEaseInOut', framer: 'easeInOut' },
    { re: /cubic-bezier\(\s*0?\.83,\s*0,\s*0?\.17,\s*1\s*\)/, gsap: 'expo.inOut', tw: 'ease-in-out', ios: 'curveEaseInOut', framer: 'easeInOut' },
    { re: /cubic-bezier\(\s*0?\.37,\s*0,\s*0?\.63,\s*1\s*\)/, gsap: 'sine.inOut', tw: 'ease-in-out', ios: 'curveEaseInOut', framer: 'easeInOut' },
    { re: /cubic-bezier\(\s*0?\.2,\s*0,\s*0,\s*1\s*\)/, gsap: 'power4.out', tw: 'ease-out', ios: 'curveEaseOut', framer: 'easeOut' },
    { re: /ease-out/, gsap: 'power2.out', tw: 'ease-out', ios: 'curveEaseOut', framer: 'easeOut' },
    { re: /ease-in-out/, gsap: 'power2.inOut', tw: 'ease-in-out', ios: 'curveEaseInOut', framer: 'easeInOut' },
    { re: /ease-in/, gsap: 'power2.in', tw: 'ease-in', ios: 'curveEaseIn', framer: 'easeIn' },
    { re: /steps\((\d+)\)/, gsap: 'steps', tw: 'ease-linear', ios: 'curveLinear', framer: 'linear' }
  ];

  function easeInfo(css) {
    for (let i = 0; i < EASE_NAMES.length; i++) {
      const e = EASE_NAMES[i];
      if (e.re.test(css || '')) return { gsap: e.gsap, tw: e.tw, ios: e.ios, framer: e.framer, steps: (css.match(/steps\((\d+)\)/) || [])[1] };
    }
    return { gsap: 'power2.out', tw: 'ease-out', ios: 'curveEaseOut', framer: 'easeOut' };
  }
  function bezierArr(css) {
    const m = /cubic-bezier\(([^)]+)\)/.exec(css || '');
    return m ? m[1].split(',').map(function (v) { return (+v).toFixed(3); }) : null;
  }
  function ms(v) { const n = parseFloat(v); return /ms/.test(v) ? n : n * 1000; }

  /* ---------- 解析 frames ---------- */
  function decls(str) {
    const o = {};
    (str || '').split(';').forEach(function (d) {
      const i = d.indexOf(':'); if (i < 0) return;
      o[d.slice(0, i).trim()] = d.slice(i + 1).trim();
    });
    return o;
  }
  function parseTransform(t) {
    const r = { x: 0, y: 0, sx: 1, sy: 1, rot: 0, skew: 0 };
    if (!t || t === 'none') { r.unsupported = ''; return r; }
    let s = String(t), guard = 0, m;
    const take = function (re, fn) {
      while (guard++ < 12 && (m = re.exec(s))) { fn(+m[1], m[2] != null ? +m[2] : null); s = s.slice(0, m.index) + s.slice(m.index + m[0].length); }
    };
    take(/translateX\(\s*(-?[\d.]+)px\s*\)/, function (v) { r.x += v; });
    take(/translateY\(\s*(-?[\d.]+)px\s*\)/, function (v) { r.y += v; });
    /* translate(x, y)：take 只回传前两个捕获组，这里 x/y 都得自己取。
       之前 x 拿到的是单位组的 NaN、y 直接被丢，编译出来的动画是空的 */
    while (guard++ < 12 && (m = /translate\(\s*(-?[\d.]+)(?:px)?\s*,\s*(-?[\d.]+)(?:px)?\s*\)/.exec(s))) {
      r.x += +m[1]; r.y += +m[2];
      s = s.slice(0, m.index) + s.slice(m.index + m[0].length);
    }
    take(/scale\(\s*(-?[\d.]+)(?:\s*,\s*(-?[\d.]+))?\s*\)/, function (a, b) { r.sx = a; r.sy = b == null ? a : b; });
    take(/rotate\(\s*(-?[\d.]+)deg\s*\)/, function (v) { r.rot += v; });
    take(/skewX\(\s*(-?[\d.]+)deg\s*\)/, function (v) { r.skew += v; });
    r.unsupported = s.trim();
    return r;
  }
  function readState(str) {
    const d = decls(str), t = parseTransform(d.transform);
    return {
      x: t.x, y: t.y, sx: t.sx, sy: t.sy, rot: t.rot, skew: t.skew,
      opacity: d.opacity != null ? +d.opacity : 1,
      blur: (d.filter || '').indexOf('blur') >= 0 ? +(/blur\(\s*([\d.]+)px/.exec(d.filter) || [0, 0])[1] : 0,
      unsupportedTransform: t.unsupported,
      raw: d
    };
  }
  /* 从术语里取出可编译的时间轴 */
  function specOf(term, overrides) {
    const d = term.demo || {};
    const src = d.kind === 'two' ? d.a : d;
    if (!src.frames || !src.frames.length) {
      if (d.kind === 'track' || d.kind === 'curve') {
        const item = (window.EASE_LIST || []).filter(function (x) { return x.key === d.fn; })[0];
        /* linear / steps 也是合法的 CSS easing，别把它们硬套成默认贝塞尔（GSAP 导出会变成 expo.out） */
        const e = item && /^(cubic-bezier|linear|steps)/.test(item.css) ? item.css : 'cubic-bezier(0.16, 1, 0.3, 1)';
        return {
          from: readState('transform:translateX(-120px)'), to: readState('transform:translateX(120px)'),
          dur: d.kind === 'curve' ? 900 : 600, ease: e,
          kindOnly: true, fn: d.fn
        };
      }
      if (d.kind === 'spring') return { spring: d.p || [170, 22, 1], kindOnly: true };
      return null;
    }
    const from = readState(src.frames[0][1]);
    const to = readState(src.frames[src.frames.length - 1][1]);
    const spec = {
      from: from, to: to, dur: ms(src.d || '520ms'), ease: src.e || 'cubic-bezier(0.16,1,0.3,1)',
      stagger: src.st && src.multi ? Math.abs(src.st) : (src.st && src.st < 0 ? 0 : src.st),
      multi: src.multi, loop: !!src.loop, alt: !!src.alt, frames: src.frames
    };
    overrides = overrides || {};
    if (Number.isFinite(+overrides.dur) && +overrides.dur > 0) spec.dur = +overrides.dur;
    if (Number.isFinite(+overrides.st) && +overrides.st >= 0) spec.stagger = +overrides.st;
    return spec;
  }

  const num = function (v) { return (Math.round(v * 1000) / 1000).toString(); };
  function isFrom(spec) { /* 终点是恒等变换 → 用 from 语义更贴近“入场” */
    const t = spec.to;
    return Math.abs(t.x) < .01 && Math.abs(t.y) < .01 && Math.abs(t.sx - 1) < .01 && Math.abs(t.sy - 1) < .01 &&
      Math.abs(t.rot) < .01 && Math.abs(t.skew) < .01 && t.opacity > .99;
  }
  function delta(spec) {
    const a = spec.from, b = spec.to;
    return {
      x: b.x - a.x, y: b.y - a.y, sx: b.sx, sy: b.sy, rot: b.rot - a.rot,
      o: b.opacity - a.opacity, blur: b.blur - a.blur, from: a, to: b
    };
  }
  /* steps(N) 在 GSAP 里是带参数的 ease：'steps' 只是标记，真正要输出 steps(N) */
  function gsapEase(css) {
    const e = easeInfo(css);
    return e.gsap === 'steps' ? 'steps(' + (e.steps || 1) + ')' : e.gsap;
  }
  /* 时间轴里真正变化的属性。关键帧语义是「到这个值」，所以每一帧都得写绝对值：
     只按单帧是否有差值来省略 0 值属性，会让元素停在该属性上一帧的位置 */
  function axisOf(spec) {
    const has = { x: false, y: false, sc: false, rot: false, skew: false, o: false, blur: false };
    spec.frames.forEach(function (f) {
      const s = readState(f[1]);
      if (Math.abs(s.x) > 0.01) has.x = true;
      if (Math.abs(s.y) > 0.01) has.y = true;
      if (Math.abs(s.sx - 1) > 0.01 || Math.abs(s.sy - 1) > 0.01) has.sc = true;
      if (Math.abs(s.rot) > 0.01) has.rot = true;
      if (Math.abs(s.skew) > 0.01) has.skew = true;
      if (Math.abs(s.opacity - 1) > 0.01) has.o = true;
      if (s.blur) has.blur = true;
    });
    return has;
  }
  /* 首尾两态完全相同的多帧循环（shake 这类），from/to 压缩后等于没有动画 */
  function degenerate(spec) {
    const a = spec.from, b = spec.to;
    return Math.abs(a.x - b.x) < .01 && Math.abs(a.y - b.y) < .01 && Math.abs(a.sx - b.sx) < .01 &&
      Math.abs(a.sy - b.sy) < .01 && Math.abs(a.rot - b.rot) < .01 && Math.abs(a.skew - b.skew) < .01 &&
      Math.abs(a.opacity - b.opacity) < .01 && a.blur === b.blur;
  }

  function translated(term, spec, platform) {
    if (!spec) return false;
    /* Framer has a real spring API with the source stiffness/damping/mass values.
       The other spring branches are only rough demos, so do not label them converted. */
    if (spec.spring) return platform === 'framer';
    if (spec.kindOnly) return false;
    if (platform === 'css') return true;
    if (spec.frames.length > 2 && (platform === 'swift' || platform === 'compose' || platform === 'tailwind')) return false;
    if (spec.stagger && (platform === 'framer' || platform === 'tailwind' || platform === 'swift' || platform === 'compose')) return false;
    if (spec.loop && (platform === 'tailwind' || platform === 'compose')) return false;
    const states = spec.frames.map(function (f) { return readState(f[1]); });
    if (states.some(function (s) { return !!s.unsupportedTransform; })) return false;
    const allowed = platform === 'waapi' || platform === 'framer'
      ? ['transform', 'opacity', 'filter']
      : platform === 'gsap' ? ['transform', 'opacity', 'filter']
      : platform === 'swift' || platform === 'compose'
        ? ['transform', 'opacity']
        : platform === 'tailwind' ? ['transform', 'opacity'] : [];
    if (states.some(function (s) { return Object.keys(s.raw).some(function (key) { return allowed.indexOf(key) < 0; }); })) return false;
    if ((platform === 'swift' || platform === 'compose') && states.some(function (s) { return Math.abs(s.skew) > .01 || s.blur > 0; })) return false;
    if (platform === 'compose' && spec.frames.length > 2) return false;
    return true;
  }

  function manualCode(term, platform) {
    return term.code || '/* No source snippet is available for this concept. */';
  }

  const OUT = {
    css: function (term, spec) {
      if (!spec) return term.code;
      if (spec.kindOnly || spec.spring) return term.code || 'transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1);';
      /* 关键帧名带术语 id：多段复制进同一文件时不会互相覆盖 */
      const kf = spec.frames.map(function (f) { return '  ' + f[0] + '% { ' + f[1] + ' }'; }).join('\n');
      const name = 'go-' + term.id;
      const sel = '.el';
      const stag = spec.multi && spec.stagger ? '\n  animation-delay: calc(var(--i) * ' + spec.stagger + 'ms);' : '';
      return '@keyframes ' + name + ' {\n' + kf + '\n}\n\n' + sel + ' {\n  animation: ' + name + ' ' + num(spec.dur / 1000) + 's ' + spec.ease + ' ' +
        (spec.loop ? 'infinite' : '1') + (spec.alt ? ' alternate' : '') + ' both;' + stag + '\n}';
    },
    waapi: function (term, spec) {
      if (!spec || spec.kindOnly || spec.spring) return term.code;
      const has = axisOf(spec);
      const k = function (s) {
        const o = {};
        const tr = [];
        if (has.x || has.y) tr.push('translateX(' + num(s.x) + 'px)');
        if (has.y) tr.push('translateY(' + num(s.y) + 'px)');
        if (has.sc) tr.push(s.sx === s.sy ? 'scale(' + num(s.sx) + ')' : 'scale(' + num(s.sx) + ', ' + num(s.sy) + ')');
        if (has.skew) tr.push('skewX(' + num(s.skew) + 'deg)');
        if (has.rot) tr.push('rotate(' + num(s.rot) + 'deg)');
        if (tr.length) o.transform = tr.join(' ');
        if (has.o) o.opacity = s.opacity;
        if (has.blur) o.filter = 'blur(' + num(s.blur) + 'px)';
        return o;
      };
      /* JSON.stringify 会把 Infinity 变成 null，这里单独序列化 */
      const jsOpts = function (opt) {
        return '{ ' + Object.keys(opt).map(function (kk) {
          return kk + ': ' + (opt[kk] === Infinity ? 'Infinity' : JSON.stringify(opt[kk]));
        }).join(', ') + ' }';
      };
      const opt = { duration: Math.round(spec.dur), easing: spec.ease, fill: 'both' };
      if (spec.loop) opt.iterations = Infinity;
      if (spec.loop && spec.alt) opt.direction = 'alternate';
      const opts = jsOpts(opt);
      /* 多关键帧术语输出完整帧序列：压成 from/to 两帧会把 shake / toast-in
         这类「讲故事」的中间过程全部抹掉，首尾一样时甚至等于没有动画 */
      if (spec.frames.length > 2) {
        const kfs = spec.frames.map(function (f) {
          const o = k(readState(f[1]));
          o.offset = f[0] / 100;
          return o;
        });
        if (spec.stagger) {
          return 'els.forEach((el, i) => el.animate([\n  ' + kfs.map(function (o) { return JSON.stringify(o); }).join(',\n  ') +
            '\n], {\n  ...' + opts + ',\n  delay: i * ' + spec.stagger + '\n}));';
        }
        return 'el.animate([\n  ' + kfs.map(function (o) { return JSON.stringify(o); }).join(',\n  ') + '\n], ' + opts + ');';
      }
      if (spec.stagger) {
        return 'els.forEach((el, i) => el.animate([\n  ' + JSON.stringify(k(spec.from)) + ',\n  ' + JSON.stringify(k(spec.to)) + '\n], {\n  ...' +
          opts + ',\n  delay: i * ' + spec.stagger + '\n}));';
      }
      return 'el.animate([\n  ' + JSON.stringify(k(spec.from)) + ',\n  ' + JSON.stringify(k(spec.to)) + '\n], ' + opts + ');';
    },
    gsap: function (term, spec) {
      if (!spec) return term.code;
      if (spec.spring) {
        return 'gsap.to(".el", {\n  x: 0, opacity: 1,\n  duration: 1,\n  ease: "elastic.out(1, 0.5)"\n  /* 或 MotionOne: { type: "spring", stiffness: ' +
          spec.spring[0] + ', damping: ' + spec.spring[1] + ', mass: ' + spec.spring[2] + ' } */\n});';
      }
      if (spec.kindOnly) return 'gsap.to(".el", { x: 120, duration: ' + num(spec.dur / 1000) + ', ease: "' + gsapEase(spec.ease) + '" });';
      const e = easeInfo(spec.ease), easeStr = gsapEase(spec.ease);
      const nm = function (v) { return Math.round(v * 1000) / 1000; };
      const gp = function (st) {
        const o = {};
        if (Math.abs(st.x) > 0.01) o.x = nm(st.x);
        if (Math.abs(st.y) > 0.01) o.y = nm(st.y);
        if (Math.abs(st.sx - 1) > 0.01 || Math.abs(st.sy - 1) > 0.01) {
          if (Math.abs(st.sx - st.sy) < 0.01) o.scale = nm(st.sx);
          else { o.scaleX = nm(st.sx); o.scaleY = nm(st.sy); }
        }
        if (Math.abs(st.rot) > 0.01) o.rotation = nm(st.rot);
        if (Math.abs(st.skew) > 0.01) o.skewX = nm(st.skew);
        if (Math.abs(st.opacity - 1) > 0.01) o.opacity = nm(st.opacity);
        if (st.blur) o.filter = 'blur(' + num(st.blur) + 'px)';
        return o;
      };
      const segJs = function (o) {
        return '{ ' + Object.keys(o).map(function (kk) {
          return kk + ': ' + (typeof o[kk] === 'string' ? '"' + o[kk] + '"' : o[kk]);
        }).join(', ') + ' }';
      };
      /* 多关键帧：按原始偏移切分成带时长的分段，每段写绝对值（漏写 0 值会停在上一帧） */
      if (spec.frames.length > 2) {
        const has = axisOf(spec);
        const segs = [];
        for (let i = 1; i < spec.frames.length; i++) {
          const st = readState(spec.frames[i][1]), seg = {};
          if (has.x) seg.x = nm(st.x);
          if (has.y) seg.y = nm(st.y);
          if (has.sc) {
            if (Math.abs(st.sx - st.sy) < 0.01) seg.scale = nm(st.sx);
            else { seg.scaleX = nm(st.sx); seg.scaleY = nm(st.sy); }
          }
          if (has.skew) seg.skewX = nm(st.skew);
          if (has.rot) seg.rotation = nm(st.rot);
          if (has.o) seg.opacity = nm(st.opacity);
          if (has.blur) seg.filter = 'blur(' + num(st.blur) + 'px)';
          seg.duration = +(((spec.frames[i][0] - spec.frames[i - 1][0]) / 100) * (spec.dur / 1000)).toFixed(3);
          segs.push(seg);
        }
        const p = [];
        if (spec.stagger) p.push('stagger: ' + num(spec.stagger / 1000));
        if (spec.loop) p.push('repeat: -1' + (spec.alt ? ', yoyo: true' : ''));
        p.push('duration: ' + num(spec.dur / 1000), 'ease: "' + easeStr + '"',
          'keyframes: [\n    ' + segs.map(segJs).join(',\n    ') + '\n  ]');
        return 'gsap.to(".el", {\n  ' + p.join(',\n  ') + '\n});';
      }
      const useFrom = isFrom(spec), v = useFrom ? spec.from : spec.to;
      const g = gp(v);
      const p = Object.keys(g).map(function (kk) {
        return kk + ': ' + (typeof g[kk] === 'string' ? '"' + g[kk] + '"' : num(g[kk]));
      });
      if (spec.stagger) p.push('stagger: ' + num(spec.stagger / 1000));
      if (spec.loop) p.push('repeat: -1' + (spec.alt ? ', yoyo: true' : ''));
      p.push('duration: ' + num(spec.dur / 1000), 'ease: "' + easeStr + '"');
      return 'gsap.' + (useFrom ? 'from' : 'to') + '(".el", {\n  ' + p.join(',\n  ') + '\n});' +
        (useFrom ? '\n/* gsap.from 把上面这组值当作起始状态 */' : '');
    },
    framer: function (term, spec) {
      if (!spec) return term.code;
      if (spec.spring) {
        return '<motion.div\n  initial={{ x: 24, opacity: 0 }}\n  animate={{ x: 0, opacity: 1 }}\n  transition={{ type: "spring", stiffness: ' + spec.spring[0] +
          ', damping: ' + spec.spring[1] + ', mass: ' + spec.spring[2] + ' }}\n/>';
      }
      if (spec.kindOnly) return '<motion.div animate={{ x: 120 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />';
      const bz = bezierArr(spec.ease);
      const ser = function (v) {
        return Array.isArray(v) ? '[' + v.join(', ') + ']' : typeof v === 'string' ? '"' + v + '"' : String(v);
      };
      const easing = easeInfo(spec.ease);
      const tr = { duration: +(spec.dur / 1000).toFixed(3), ease: bz ? bz.map(Number) : (easing.gsap === 'steps' ? 'steps(' + (easing.steps || 1) + ')' : easing.framer || 'easeOut') };
      if (spec.loop) { tr.repeat = Infinity; if (spec.alt) tr.repeatType = 'reverse'; }
      /* 多关键帧：Framer Motion 的关键帧就是每属性一个数组，配 times 对齐原始偏移 */
      if (spec.frames.length > 2) {
        const has = axisOf(spec), sts = spec.frames.map(function (f) { return readState(f[1]); });
        const col = function (get) { return '[' + sts.map(function (s) { return num(get(s)); }).join(', ') + ']'; };
        const ani = [];
        if (has.x) ani.push('x: ' + col(function (s) { return s.x; }));
        if (has.y) ani.push('y: ' + col(function (s) { return s.y; }));
        if (has.sc) {
          if (sts.every(function (s) { return Math.abs(s.sx - s.sy) < 0.01; })) ani.push('scale: ' + col(function (s) { return s.sx; }));
          else { ani.push('scaleX: ' + col(function (s) { return s.sx; })); ani.push('scaleY: ' + col(function (s) { return s.sy; })); }
        }
        if (has.skew) ani.push('skewX: ' + col(function (s) { return s.skew; }));
        if (has.rot) ani.push('rotate: ' + col(function (s) { return s.rot; }));
        if (has.o) ani.push('opacity: ' + col(function (s) { return s.opacity; }));
        if (has.blur) ani.push('filter: [' + sts.map(function (s) { return '"blur(' + num(s.blur) + 'px)"'; }).join(', ') + ']');
        if (!ani.length) return term.code;
        tr.times = spec.frames.map(function (f) { return +(f[0] / 100).toFixed(3); });
        return '<motion.div\n  animate={{ ' + ani.join(', ') + ' }}\n  transition={{ ' +
          Object.keys(tr).map(function (kk) { return kk + ': ' + ser(tr[kk]); }).join(', ') + ' }} />' +
          (spec.stagger ? '\n/* 子项：variants + staggerChildren: ' + +(spec.stagger / 1000).toFixed(2) + ' */' : '');
      }
      const d = delta(spec);
      const ini = [], ani2 = [];
      const pair = function (kk, a, b) { ini.push(kk + ': ' + num(a)); ani2.push(kk + ': ' + num(b)); };
      if (d.x) pair('x', spec.from.x, spec.to.x);
      if (d.y) pair('y', spec.from.y, spec.to.y);
      if (Math.abs(spec.from.sx - spec.to.sx) > 0.01 || Math.abs(spec.from.sy - spec.to.sy) > 0.01) {
        if (Math.abs(spec.from.sx - spec.from.sy) < 0.01 && Math.abs(spec.to.sx - spec.to.sy) < 0.01) pair('scale', spec.from.sx, spec.to.sx);
        else { pair('scaleX', spec.from.sx, spec.to.sx); pair('scaleY', spec.from.sy, spec.to.sy); }
      }
      if (d.rot) pair('rotate', spec.from.rot, spec.to.rot);
      if (spec.from.skew || spec.to.skew) pair('skewX', spec.from.skew, spec.to.skew);
      if (d.o) pair('opacity', spec.from.opacity, spec.to.opacity);
      if (Math.abs(d.blur) > 0.01) {
        ini.push('filter: "blur(' + num(spec.from.blur) + 'px)"');
        ani2.push('filter: "blur(' + num(spec.to.blur) + 'px)"');
      }
      /* 首尾相同（shake 这类循环）压成两态等于空动画，交回手写实现 */
      if (!ani2.length) return term.code;
      return '<motion.div\n  initial={{ ' + ini.join(', ') + ' }}\n  animate={{ ' + ani2.join(', ') + ' }}\n  transition={{ ' +
        Object.keys(tr).map(function (kk) { return kk + ': ' + ser(tr[kk]); }).join(', ') + ' }}\n/>' +
        (spec.stagger ? '\n/* 子项：variants + staggerChildren: ' + +(spec.stagger / 1000).toFixed(2) + ' */' : '');
    },
    swift: function (term, spec) {
      if (!spec) return term.code;
      if (spec.spring) {
        return 'UIView.animate(\n  withDuration: ' + num((spec.spring[2] || 1) * 0.6) + ',\n  delay: 0,\n  usingSpringWithDamping: ' +
          num(spec.spring[1] / (2 * Math.sqrt(spec.spring[0] * (spec.spring[2] || 1)))) + ',\n  initialSpringVelocity: 0,\n  options: [],\n  animations: { self.view.transform = .identity }\n)';
      }
      if (!spec.from) return term.code || 'UIView.animate(withDuration: 0.42, animations: { ... })';
      if (spec.frames.length > 2 || degenerate(spec)) return term.code;
      const d = delta(spec), e = easeInfo(spec.ease);
      const tf = [];
      if (d.x) tf.push('CGAffineTransform(translationX: ' + num(d.x) + ', y: ' + num(d.y || 0) + ')');
      if (d.sx !== 1) tf.push('CGAffineTransform(scaleX: ' + num(d.sx) + ', y: ' + num(d.sy) + ')');
      if (d.rot) tf.push('CGAffineTransform(rotationAngle: ' + num(d.rot * Math.PI / 180) + ')');
      const combo = tf.length ? tf.join(' * ') : '.identity';
      const transform = function (st) {
        const ops = [];
        if (st.x || st.y) ops.push('.translatedBy(x: ' + num(st.x) + ', y: ' + num(st.y) + ')');
        if (st.sx !== 1 || st.sy !== 1) ops.push('.scaledBy(x: ' + num(st.sx) + ', y: ' + num(st.sy) + ')');
        if (st.rot) ops.push('.rotated(by: ' + num(st.rot * Math.PI / 180) + ')');
        return '.identity' + ops.join('');
      };
      const options = ['.' + e.ios].concat(spec.loop ? ['.repeat'] : [], spec.loop && spec.alt ? ['.autoreverse'] : []);
      return 'view.alpha = ' + num(spec.from.opacity) + '\nview.transform = ' + transform(spec.from) + '\n' +
        'UIView.animate(withDuration: ' + num(spec.dur / 1000) + ', delay: 0,\n  options: [' + options.join(', ') + ']) {\n' +
        '  view.alpha = ' + num(spec.to.opacity) + '\n  view.transform = ' + transform(spec.to) + '\n}';
    },
    compose: function (term, spec) {
      if (!spec) return term.code;
      if (spec.spring) {
        return 'val x by animateFloatAsState(\n  0f,\n  spring(dampingRatio = ' + num(spec.spring[1] / (2 * Math.sqrt(spec.spring[0] * (spec.spring[2] || 1)))) +
          ', stiffness = ' + spec.spring[0] + 'f)\n)\nModifier.graphicsLayer { translationX = x }';
      }
      if (!spec.from) return term.code || 'animateFloatAsState(target, tween(420))';
      /* Compose / Swift 的两态 API 讲不了多关键帧的故事，交给术语自带的手写实现 */
      if (spec.frames.length > 2 || degenerate(spec)) return term.code;
      const d = delta(spec), bz = bezierArr(spec.ease);
      const lines = [], gl = [];
      /* graphicsLayer 里只引用真正声明过的 val：之前 tx/ty/sc 恒定被引用，
         fade-in 这种只有 opacity 的条目会输出引用未定义变量的 Kotlin */
      if (d.y || spec.from.y || spec.to.y) { lines.push('val ty by animateFloatAsState(if (show) ' + num(spec.to.y) + 'f else ' + num(spec.from.y) + 'f, spec)'); gl.push('translationY = ty'); }
      if (d.x || spec.from.x || spec.to.x) { lines.push('val tx by animateFloatAsState(if (show) ' + num(spec.to.x) + 'f else ' + num(spec.from.x) + 'f, spec)'); gl.push('translationX = tx'); }
      if (Math.abs(spec.from.sx - spec.to.sx) > 0.01 || Math.abs(spec.from.sy - spec.to.sy) > 0.01) {
        lines.push('val sc by animateFloatAsState(if (show) ' + num(spec.to.sx) + 'f else ' + num(spec.from.sx) + 'f, spec)');
        if (Math.abs(spec.from.sx - spec.from.sy) < 0.01 && Math.abs(spec.to.sx - spec.to.sy) < 0.01) {
          gl.push('scaleX = sc'); gl.push('scaleY = sc');
        } else {
          gl.push('scaleX = sc');
          lines.push('val scy by animateFloatAsState(if (show) ' + num(spec.to.sy) + 'f else ' + num(spec.from.sy) + 'f, spec)');
          gl.push('scaleY = scy');
        }
      }
      lines.push('val al by animateFloatAsState(if (show) ' + num(spec.to.opacity) + 'f else ' + num(spec.from.opacity) + 'f, spec)');
      gl.unshift('alpha = al');
      if (Math.abs(spec.from.rot - spec.to.rot) > .01) {
        lines.push('val rz by animateFloatAsState(if (show) ' + num(spec.to.rot) + 'f else ' + num(spec.from.rot) + 'f, spec)');
        gl.push('rotationZ = rz');
      }
      const easing = easeInfo(spec.ease);
      const easingCode = bz ? 'CubicBezierEasing(' + bz.join('f, ') + 'f)' : easing.gsap === 'steps' ? 'snap()' : spec.ease === 'linear' ? 'LinearEasing' : 'FastOutSlowInEasing';
      const specLine = 'val spec = tween<Float>(durationMillis = ' + Math.round(spec.dur) + ', easing = ' + easingCode + ')';
      return specLine + '\n' + lines.join('\n') + '\n\nModifier\n  .graphicsLayer { ' + gl.join('; ') + ' }\n' +
        (spec.stagger ? '// 逐项延迟：LaunchedEffect + delay(i * ' + spec.stagger + 'ms)，或 LazyColumn 里按 index 起始偏移' : '');
    },
    tailwind: function (term, spec) {
      if (!spec) return term.code;
      if (!spec.from) return term.code || 'transition duration-300 ease-out';
      const e = easeInfo(spec.ease), d = delta(spec);
      /* Tailwind 的 duration 刻度只有 75/100/150/200/300/500/700/1000，
         四舍五入到 50ms 会产出 duration-420 这种静默无效的类，用任意值写法才可靠 */
      const cls = ['transition-[transform,opacity]', 'duration-[' + Math.round(spec.dur) + 'ms]',
        e.gsap === 'steps' ? 'ease-[steps(' + (e.steps || 1) + ')]' : e.tw];
      const transformClasses = function (st) {
        const out = [];
        if (st.x) out.push((st.x < 0 ? '-' : '') + 'translate-x-[' + Math.abs(st.x) + 'px]');
        if (st.y) out.push((st.y < 0 ? '-' : '') + 'translate-y-[' + Math.abs(st.y) + 'px]');
        if (st.sx !== 1) out.push('scale-x-[' + st.sx + ']');
        if (st.sy !== 1) out.push('scale-y-[' + st.sy + ']');
        if (st.rot) out.push('rotate-[' + st.rot + 'deg]');
        return out;
      };
      const start = cls.concat(transformClasses(spec.from));
      const end = ['transition-[transform,opacity]', 'duration-[' + Math.round(spec.dur) + 'ms]', e.tw].concat(transformClasses(spec.to));
      if (Math.abs(spec.from.opacity - 1) > .01) start.push('opacity-[' + spec.from.opacity + ']');
      if (Math.abs(spec.to.opacity - 1) > .01) end.push('opacity-[' + spec.to.opacity + ']');
      return '<!-- Start -->\nclass="' + start.join(' ') + '"\n<!-- End -->\nclass="' + end.join(' ') + '"';
    }
  };

  const LIST = [
    { key: 'css', label: 'CSS' },
    { key: 'waapi', label: 'WAAPI' },
    { key: 'gsap', label: 'GSAP' },
    { key: 'framer', label: 'Framer Motion' },
    { key: 'swift', label: 'Swift / iOS' },
    { key: 'compose', label: 'Compose' },
    { key: 'tailwind', label: 'Tailwind' }
  ];

  let current = 'css';
  const cache = {};
  function codeFor(term, overrides) {
    const stamp = JSON.stringify(overrides || {});
    const key = term.id + '|' + current + '|' + stamp;
    if (cache[key] != null) return cache[key];
    const spec = specOf(term, overrides);
    const platform = current;
    const canTranslate = translated(term, spec, platform);
    let out = canTranslate ? ((OUT[platform] || OUT.css)(term, spec) || '') : manualCode(term, platform);
    if (!out) out = '/* This concept has no code example yet. */';
    cache[key] = out;
    return out;
  }

  function status(term, overrides) {
    const spec = specOf(term, overrides);
    if (!translated(term, spec, current)) return 'manual';
    if (spec.spring && current === 'framer') return 'translated';
    if (current === 'css' || current === 'waapi') return 'translated';
    if (current === 'gsap' && (spec.ease === 'linear' || /^steps\(/.test(spec.ease))) return 'translated';
    if (current === 'swift' && spec.ease === 'linear') return 'translated';
    if (current === 'framer' && (bezierArr(spec.ease) || /^linear$/.test(spec.ease))) return 'translated';
    if (current === 'compose' && (bezierArr(spec.ease) || /^linear$/.test(spec.ease))) return 'translated';
    if (current === 'tailwind' && (/^linear$/.test(spec.ease) || /^steps\(/.test(spec.ease))) return 'translated';
    return 'approximate';
  }

  function coverage(platform) {
    const previous = current;
    if (platform && LIST.some(function (item) { return item.key === platform; })) current = platform;
    const result = { total: (window.TERMS || []).length, translated: 0, approximate: 0, manual: 0 };
    try {
      (window.TERMS || []).forEach(function (term) { result[status(term)]++; });
    } finally { current = previous; }
    return result;
  }

  window.DIALECTS = {
    list: LIST,
    get current() { return current; },
    codeFor: codeFor,
    status: status,
    coverage: coverage,
    set: function (k) { current = k; },
    compilable: function (term) { return !!specOf(term); }
  };
})();
