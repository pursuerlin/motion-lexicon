/* ============================================================
   compound.js —— 第 16 类「组合范式」
   单点术语（缓动、错峰、视差…）解决不了「一整屏的动效编排」。
   这里把行业里常见的组合手法做成可交互实演：指针驱动、滚动驱动、
   悬停触发、点击触发各占一部分，全部只动 transform / opacity。
   依赖：motion.js（window.MOTION）、ease.js、app.js（window.ENGINE）
   ============================================================ */
(function () {
  'use strict';
  const M = window.MOTION;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  /* 读卡片内参数滑块的当前值（params.js 声明，app.js 写进 stage._prm） */
  const P = function (stage, k, dflt) {
    const v = stage._prm && stage._prm[k];
    return v == null ? dflt : +v;
  };
  const E = { EO: 'cubic-bezier(0.16,1,0.3,1)', EI: 'cubic-bezier(0.32,0,0.67,0)', EMP: 'cubic-bezier(0.2,0,0,1)' };
  /* 本地真实照片（assets/img）。来源与授权见 img/ATTRIBUTION.md /
     CREDITS.json：p01–p16 为用户提供的创作素材，w 系列为 Wikimedia
     Commons 的 CC 授权照片，页脚有「图片来源」说明。 */
  const IMG = function (n) { return 'assets/img/' + n; };
  const P16 = ['p01.jpg', 'p02.jpg', 'p03.jpg', 'p04.jpg', 'p05.jpg', 'p06.jpg', 'p07.jpg',
    'p08.jpg', 'p09.jpg', 'p10.jpg', 'p11.jpg', 'p12.jpg', 'p13.jpg', 'p14.jpg', 'p15.jpg', 'p16.jpg'];
  const im = function (n, alt) {
    const a = alt || '';
    return '<img src="' + IMG(n) + '" alt="' + a + '"' + (a ? ' data-l10n="' + a + '" data-l10n-attr="alt"' : '') + ' loading="lazy" draggable="false">';
  };

  window.CATS.push({
    id: 'compound', name: '组合范式', en: 'Compound Patterns',
    tagline: '把指针、滚动与点击组合成可描述的编排案例；这些名称用于检索与沟通，并非统一的行业标准术语。',
    taglineEn: 'These choreography examples combine pointer, scroll and tap. Their descriptive names help communicate the pattern; they are not standardized industry terms.'
  });

  window.TERMS.push(
    {
      id: 'gaze-tracking', en: 'Cursor-driven gaze tracking', zh: '光标驱动视线跟随', cat: 'compound',
      alias: ['眼睛跟着鼠标', '视线跟随', 'gaze'],
      vague: '让这个角色看着我的鼠标',
      say: '把指针相对中心的向量映射到瞳孔位移，限幅 + 平滑跟随（lerp 0.16），空闲时做低频游走与眨眼',
      def: '指针位置驱动角色视线：取「指针 − 中心」的方向向量，按最大转动半径限幅，再做指数平滑，眼睛就有了“看着你”的生命感。空闲时必须补一段低频游走，否则像死机。',
      code: 'const v = norm(pointer - center);\npupil += (clampLen(v, R) - pupil) * 0.16;  // 每帧平滑',
      demo: { kind: 'compound', mode: 'gaze', hint: '在框里移动鼠标' }
    },
    {
      id: 'pinned-hero', en: 'Scroll-driven pinned hero recomposition', zh: '滚动驱动主视觉重组', cat: 'compound',
      alias: ['钉住主视觉', 'sticky 重组', '主视觉缩小让位'],
      vague: '滚下去的时候大图别走，下面的东西排进来',
      say: '主视觉 sticky 钉住并按滚动进度 scale 0.74、左移，内容卡从堆叠态错峰展开成一行',
      def: '把主视觉钉在视口里当“锚”，用同一个滚动进度同时驱动它收缩和内容重排。两条时间线共用一个进度，画面才不会各走各的。',
      code: 'hero.style.transform = `scale(${lerp(1, .74, p)}) translateX(${p}%)`;\ncard.style.transform = `translateX(${-(i - mid) * step * (1 - k)}px) scale(${lerp(.94, 1, k)})`;',
      demo: { kind: 'compound', mode: 'pinned', hint: '在框里滚动' }
    },
    {
      id: 'section-stack', en: 'Scroll-driven section reveal & card stacking', zh: '滚动驱动章节覆盖堆叠', cat: 'compound',
      alias: ['卡片堆叠', '章节覆盖', 'stacking cards'],
      vague: '下一屏盖上来，上一屏退下去',
      say: '每章 sticky 递增 14px 顶部偏移，被覆盖时 scale 0.93 + 亮度衰减',
      def: '连续章节像一副牌：后一张盖上来，前一张微微缩小退到后面。堆叠层数控制在 3～4 张，再多就变成“被卡住”。',
      code: '.sec { position: sticky; top: calc(4px + var(--i) * 14px); height: 118px; margin-bottom: 104px; }\nsec.style.transform = `scale(${1 - .075 * covered})`;',
      demo: { kind: 'compound', mode: 'stack', hint: '在框里滚动' }
    },
    {
      id: 'scene-parallax', en: 'Cursor-driven miniature scene parallax', zh: '光标驱动微缩景观视差', cat: 'compound',
      alias: ['鼠标视差', '多层视差', 'diorama'],
      vague: '鼠标一动，箱子里的东西分层跟着动',
      say: '指针向量按层深分配位移系数（远 0.3 / 近 1.6），容器叠加 rotateY ±6° 做立体盒',
      def: '把一张图拆成 3～5 层，按“越近动得越多”分配位移系数，再给整体一点 rotateY，平面的画就变成了一个可以透过玻璃看的立体盒。',
      code: '.layer { transform: translate3d(calc(var(--px) * var(--f) * -8px), 0, 0); }\n.diorama { transform: rotateY(calc(var(--px) * 6deg)); transform-style: preserve-3d; }',
      demo: { kind: 'compound', mode: 'dio', hint: '在框里移动鼠标' }
    },
    {
      id: 'scroll-orbit', en: 'Scroll-driven character orbit', zh: '滚动驱动角色环绕', cat: 'compound',
      alias: ['滚动转模型', 'scroll turntable', '环绕展示'],
      vague: '滚一下，模型跟着转',
      say: '滚动进度 0→1 映射到 rotateY 0→360°，主体 sticky，俯仰固定在 −14°',
      def: '把滚动进度直接当作相机的方位角。要点有二：主体要钉住，否则转一半就滚出画面；俯仰角固定，只让方位角走，观者才不会晕。',
      code: 'fig.style.transform = `rotateX(-14deg) rotateY(${p * 360}deg)`;',
      demo: { kind: 'compound', mode: 'orbit', hint: '在框里滚动' }
    },
    {
      id: 'door-bloom', en: 'Hover-triggered door bloom', zh: '悬停触发车门绽放', cat: 'compound',
      alias: ['开门动效', '花瓣展开', 'hover bloom'],
      vague: '鼠标一放上去，门片一片片张开',
      say: '悬停时 4 扇门板沿各自铰链轴从闭合旋转展开（rotateY ±102°），错峰 60ms，舱内光晕随开启增强',
      def: '把一个整体拆成若干“门板”，悬停时各自绕自己的铰链轴旋转张开（真车门的开合方式），配合错峰与舱内光晕。它是 hover 反馈里最“贵重”的一档，只该给主视觉用。',
      code: '.petal { transform-origin: 0 50%; transition: transform .55s var(--emphasized); transition-delay: calc(var(--i) * 45ms); }\n.petal { transform: rotate(var(--a)) translateX(9px) rotateY(-64deg); }   /* 合 */\n.wrap:hover .petal { transform: rotate(var(--a)) translateX(30px) rotateY(0); } /* 开 */',
      demo: { kind: 'compound', mode: 'bloom', hint: '悬停试试' }
    },
    {
      id: 'vortex-transit', en: 'Scroll-driven vortex transit', zh: '滚动驱动涡旋穿隧', cat: 'compound',
      alias: ['虫洞', '隧道穿梭', 'vortex'],
      vague: '滚着滚着像在隧道里往前飞',
      say: '滚动进度驱动 N 层同心环 scale 0.08→3.58 + 旋转，取模循环制造无限纵深',
      def: '若干同心层按同一进度做“由远及近”的放大与旋转，用取模让每一层循环回起点，视觉上就是一条没有尽头的隧道。滚动一停必须立刻静止，否则晕。',
      code: 'const t = (p * 1.7 + i / N) % 1;\nring.style.transform = `scale(${.08 + t * t * 3.5}) rotate(${t * 80 + i * 18}deg)`;',
      demo: { kind: 'compound', mode: 'vortex', hint: '在框里滚动' }
    },
    {
      id: 'immersive-float', en: 'Immersive float & growth', zh: '沉浸式漂浮生长', cat: 'compound',
      alias: ['点击落下长草', '奖励动效', 'float'],
      vague: '点一下，东西掉下来然后长出花草',
      say: '点击触发：球体落下（重力缓动 + 落地挤压）→ 茎秆 stroke-dashoffset 描边 → 叶片错峰 scale-in',
      def: '一段有因果的连续叙事：落体、接触、生长依次发生，前一个动作的终点是后一个的起点。这类动效的价值在时序衔接，而不是单个曲线。',
      code: 'await ball.animate([{transform:translateY(-46px)},{transform:translateY(0) scale(1.18,.8)}],\n  {duration:520, easing:EASE_IN}).finished;\nstem.style.strokeDashoffset = 0;   /* 描边生长 */',
      demo: { kind: 'compound', mode: 'float', hint: '点一下' }
    },
    {
      id: 'helix-flow', en: 'Scroll-driven helix flow', zh: '旋流光螺旋展示', cat: 'compound',
      alias: ['螺旋轮播', 'helix', '拖动多角度展示'],
      vague: '拖一下，东西沿螺旋轨道转着展示',
      say: '拖拽位移映射为螺旋相位：x=sin θ·R，y 随索引线性偏移，scale/opacity 由 cos θ 给出',
      def: '在圆周的角速度上再叠一个与索引成正比的纵向偏移，就得到螺旋。深度用 cos θ 换算成缩放与透明度，无需真 3D 也能读出前后关系。',
      code: 'const a = phase + i * (TAU / N);\nx = Math.sin(a) * R;  y = (i - N/2) * 7 + Math.cos(a) * 8;\nscale = .72 + (Math.cos(a) + 1) / 2 * .5;',
      demo: { kind: 'compound', mode: 'helix', hint: '左右拖动' }
    },
    {
      id: 'luminous-flow', en: 'Cursor-driven luminous flow', zh: '光标驱动辉光流转', cat: 'compound',
      alias: ['追光', '鼠标打光', '光随指针 + 起雾'],
      vague: '光跟着鼠标走，地面还起雾',
      say: '指针坐标写入 --lx/--ly 驱动径向光斑，指针速度平滑后映射为雾气上升与最多 1.06 倍推镜',
      def: '把指针位置作为唯一光源坐标写进 CSS 自定义属性，光斑、地面高光、雾气都从这一个源读取。速度越大雾越浓，等于给画面加了“油门”。',
      code: 'wrap.style.setProperty("--lx", x + "px");\nwrap.style.setProperty("--fog", smoothSpeed);  /* 速度→雾浓度 */',
      demo: { kind: 'compound', mode: 'glow', hint: '在框里移动鼠标' }
    },
    {
      id: 'spotlight-reveal', en: 'Cursor spotlight reveal', zh: '光标聚光揭示', cat: 'compound',
      alias: ['手电筒', '遮罩跟随', '聚光灯'],
      vague: '鼠标像手电筒一样，照到哪才看得到哪',
      say: '一层与底色同值的遮罩，用 radial-gradient 在指针处挖洞，只改 --lx/--ly 两个变量',
      def: '把信息藏在一层遮罩下，只在指针周围露出来。适合“探索式”内容，但绝不能承载关键信息——键盘和触屏用户根本不会去照它。',
      code: '.mask { background: radial-gradient(circle var(--r, 56px) at var(--lx) var(--ly), transparent 0 42%, var(--bg) 62%); }',
      demo: { kind: 'compound', mode: 'spotlight', hint: '在框里移动鼠标' }
    },
    {
      id: 'cursor-trail', en: 'Cursor trail', zh: '光标拖尾', cat: 'compound',
      alias: ['轨迹', '彗星尾', '拖影'],
      vague: '鼠标后面拖一串东西',
      say: 'N 个粒子做链式追随（每个追前一个，系数 0.28），尺寸与透明度按序号衰减',
      def: '一串粒子各自追随前一个，形成逐渐衰减的尾巴。要点是链式插值而不是记录历史坐标——后者在指针停下时会甩出残影。',
      code: 'for (i = 0; i < N; i++) { p[i] += (target(i) - p[i]) * 0.28; }  // p[0] 追指针，p[i] 追 p[i-1]',
      demo: { kind: 'compound', mode: 'trail', hint: '在框里移动鼠标' }
    },
    {
      id: 'hover-fan', en: 'Hover fan-out stack', zh: '悬停扇形展开', cat: 'compound',
      alias: ['牌堆展开', '叠卡扇开', 'fan out'],
      vague: '一叠卡片悬停时摊开',
      say: '堆叠态归零位移，悬停时按 index 分配 rotate 与 translateX，错峰 40ms',
      def: '把一摞东西在悬停时摊开成扇形，用“收纳/展开”表达同一组对象的两种密度。占位只在展开瞬间变化，所以要靠 transform 偏移而不是改布局。',
      code: '.card { transform: rotate(calc(var(--i) * 8deg)) translateX(calc(var(--i) * 15px)); transition-delay: calc(var(--i) * 40ms); }',
      demo: { kind: 'compound', mode: 'fan', hint: '悬停试试' }
    },
    {
      id: 'card-peel', en: 'Card peel', zh: '悬停揭角', cat: 'compound',
      alias: ['卷角', '翻页角', 'page peel'],
      vague: '鼠标放上去卡片角会翘起来',
      say: '右下角三角形从 0 长到 36px，配渐变模拟背面与投影，父层同步裁切出缺口',
      def: '把纸张翻角的物理感搬进 UI：一角翘起，露出“背面”和落下的阴影。属于装饰性动效，用在入口卡上提示“点进去还有内容”最有效。',
      code: '.corner { width: 0; height: 0; transition: .42s cubic-bezier(.2,0,0,1); }\n.wrap:hover .corner { width: 34px; height: 34px; background: linear-gradient(315deg, var(--bg) 42%, #fff 42%); }',
      demo: { kind: 'compound', mode: 'peel', hint: '悬停试试' }
    },
    {
      id: 'horizontal-scroll', en: 'Scroll-to-horizontal', zh: '滚动转横向位移', cat: 'compound',
      alias: ['横向滚动section', '竖滚横移', 'horizontal pan'],
      vague: '往下滚，内容却往右边走',
      say: '把纵向滚动进度映射成横向轨道 translateX，容器 sticky 占住视口',
      def: '纵向滚动驱动横向轨道，常见于作品集与时间轴。代价很高：用户失去进度感、触控板手势冲突，所以要给一个明确的终点和退出路径。',
      code: 'track.style.transform = `translateX(${-p * (track.scrollWidth - viewport)}px)`;',
      demo: { kind: 'compound', mode: 'hscroll', hint: '在框里滚动' }
    },
    {
      id: 'scrub-frames', en: 'Scrubbed frame sequence', zh: '滚动抽帧播放', cat: 'compound',
      alias: ['视频抽帧', '序列帧滚动', 'frame scrub'],
      vague: '滚一下就像在拖视频进度条',
      say: '滚动进度取整到 N 帧（steps 语义），每帧只写一次姿态，配帧号读数',
      def: '把滚动进度量化成离散帧，做出“拖视频进度条”的手感（24 帧一组最常用）。必须量化而不是连续插值，否则就变成模糊的拖影，失去逐帧的机械感。',
      code: 'const f = Math.round(p * (N - 1));   // 量化，不要 lerp\npose(f); readout.textContent = `f ${String(f + 1).padStart(2, "0")}/${N}`;',
      demo: { kind: 'compound', mode: 'frames', hint: '在框里滚动' }
    },
    {
      id: 'sticky-two-col', en: 'Sticky two-column', zh: '钉住双栏叙事', cat: 'compound',
      alias: ['左图右文', 'sticky 步骤', '双栏滚动同步'],
      vague: '左边图不动，右边一条条滚，图跟着换',
      say: '左栏 sticky，右栏各步骤到达可视区域顶部时切换左栏内容并交叉淡入',
      def: '滚动叙事最稳的一种结构：视觉锚点钉住，文字流过去，锚点随段落切换。每一段到达可视区域顶部时再切换图片，向上滚动时按相同阈值还原上一段。',
      code: 'let active = 0;\nsteps.forEach((step, i) => {\n  if (step.getBoundingClientRect().top <= viewportTop + 4) active = i;\n});\nswapVisual(active);',
      demo: { kind: 'compound', mode: 'twocol', hint: '在框里滚动' }
    },
    {
      id: 'theme-morph', en: 'Scroll-linked theme morph', zh: '滚动主题渐变', cat: 'compound',
      alias: ['滚动换色', '背景随滚动变化', '色阶过渡'],
      vague: '滚下去整屏颜色慢慢换掉',
      say: '把进度落到色标数组上做 RGB 插值，同时联动前景色保证对比度',
      def: '用滚动进度在几组配色之间插值，制造“进入下一章”的氛围转换。必须同时插值前景色——只换背景很容易在中途出现读不出的低对比组合。',
      code: 'const [a, b, t] = locate(stops, p);\nbg.style.background = mixRGB(a.bg, b.bg, t); fg.style.color = mixRGB(a.fg, b.fg, t);',
      demo: { kind: 'compound', mode: 'thememorph', hint: '在框里滚动' }
    },
    {
      id: 'progress-ring', en: 'Scroll progress ring', zh: '滚动进度环', cat: 'compound',
      alias: ['环形进度', '阅读进度圈', 'stroke-dashoffset 进度'],
      vague: '一个圈跟着滚动慢慢填满',
      say: 'stroke-dasharray = 周长，dashoffset = 周长 ×(1−进度)，圆心角从 −90° 起算',
      def: '把进度画成圆环。三个细节：起点要在 12 点方向（rotate -90°）、dasharray 要用实测周长、数字要单独居中否则读起来费劲。',
      code: 'const C = 2 * Math.PI * r;\nring.style.strokeDasharray = C;\nring.style.strokeDashoffset = C * (1 - p);',
      demo: { kind: 'compound', mode: 'ring', hint: '在框里滚动' }
    },
    {
      id: 'fab-to-sheet', en: 'FAB to sheet container transform', zh: '悬浮按钮展开面板', cat: 'compound',
      alias: ['FAB 展开', '圆钮变面板', '加号展开'],
      vague: '点右下角的圆钮，它自己长成一块面板',
      say: '同一个元素改宽高与圆角，从圆形展开成面板，内容延迟 120ms 错峰淡入',
      def: '按钮和它打开的面板是同一个容器，只是尺寸和圆角变了——这就是容器变换在移动端最典型的用法。内容要晚一拍出现，否则会看到文字被拉伸。',
      code: '.fab { width: 44px; height: 44px; border-radius: 22px; transition: width .38s var(--emphasized), height .38s, border-radius .38s; }\n.fab.open { width: 178px; height: 106px; border-radius: 18px; }\n.row { opacity: 0; transform: translateX(12px); transition-delay: calc(130ms + var(--i) * 65ms); }',
      demo: { kind: 'compound', mode: 'fab', hint: '点一下圆钮' }
    },
    {
      id: 'button-tri-state', en: 'Button tri-state morph', zh: '按钮三态形变', cat: 'compound',
      alias: ['按钮加载态', '保存中动效', 'idle loading success'],
      vague: '点一下变圈转一转，再变回来说已保存',
      say: '宽度收拢成圆 → 转圈 → 展开并弹勾，三态之间只动 transform 与宽度，禁止抖动',
      def: '把“提交—处理—成功”压在一个控件里。核心约束是形变前后要落回同一位置，否则按钮一跳，用户会以为点错了。',
      code: 'btn → width: 44px; border-radius: 50% → spinner → width: auto; ✓ 已保存 → 1.6s 后回 idle',
      demo: { kind: 'compound', mode: 'tristate', hint: '点按钮试试' }
    },
    {
      id: 'drag-compare', en: 'Drag-to-compare wipe', zh: '拖拽擦除对比', cat: 'compound',
      alias: ['前后对比滑块', 'before after', '擦除对比'],
      vague: '中间一条线，拖开能看到前后两版',
      say: '把手位移换算成百分比，写入上层 clip-path: inset(0 X% 0 0)，同步给读数',
      def: '两张图叠在一起，用一条可拖的分割线切出前后。无障碍要点：把手必须可聚焦，并且左右方向键能等效拖动——否则纯键盘用户看不到对比。',
      code: 'top.style.clipPath = `inset(0 ${100 - x}% 0 0)`;\nhandle.style.left = x + '%';',
      demo: { kind: 'compound', mode: 'compare', hint: '拖动分割线' }
    },
    {
      id: 'line-mask-reveal', en: 'Scroll-driven line-mask reveal', zh: '滚动驱动逐行遮罩揭示', cat: 'compound',
      alias: ['逐行升起', '文字遮罩揭示', 'line mask'],
      vague: '文字一行一行从挡板下面升起来',
      say: '每行包在 overflow:hidden 的蒙版里，滚动进度按行分配延迟，行内 translateY 100%→0',
      def: '排版级入场：整段文字不动，只有每一行从自己的蒙版里升出来。行与行的间隔要小于单行动画时长，否则读起来是"一段一段"而不是"一行一行"。',
      code: '.line { overflow: hidden; }\n.line > span { transform: translateY(calc((1 - p) * 100%)); }\n// p = ease(clamp((progress - i * .13) / .34, 0, 1))',
      demo: { kind: 'compound', mode: 'linemask', hint: '在框里滚动' }
    },
    {
      id: 'velocity-skew', en: 'Scroll-velocity marquee skew', zh: '滚动速度倾斜跑马灯', cat: 'compound',
      alias: ['加速变形', '跟手跑马灯', 'skew on scroll'],
      vague: '滚快了那排字会斜一下跟着冲',
      say: '滚动速度平滑后同时喂给位移增量和 skewX，速度归零时两者一起回弹到 0',
      def: '让常驻跑马灯对滚动产生反应：速度越大，横向位移越快、字面倾斜越明显。关键是 skew 必须由**平滑后的速度**驱动，直接用瞬时值会抖成锯齿。',
      code: 'vel = lerp(vel, scrollDelta * 0.35, 0.12);\nrow.style.transform = `translateX(${x += base + vel * 2}px) skewX(${-vel * 0.4}deg)`;',
      demo: { kind: 'compound', mode: 'vspeed', hint: '在框里快速滚动' }
    },
    {
      id: 'proximity-glow', en: 'Cursor proximity grid glow', zh: '光标邻近点亮网格', cat: 'compound',
      alias: ['附近才亮', '光晕网格', 'proximity'],
      vague: '鼠标靠近哪格哪格就亮',
      say: '每格算自己中心到指针的距离，按 (1−d/R)² 衰减映射到亮度、缩放与 Z 位移',
      def: '把指针当成一个有半径的光源，网格按距离衰减响应。衰减要用平方而不是线性，否则边缘那一圈会糊成一片，看不出"靠近"这件事。',
      code: 'const k = Math.pow(Math.max(0, 1 - dist / R), 2);\ntile.style.transform = `scale(${1 + k * .28}) translateZ(${k * 26}px)`;',
      demo: { kind: 'compound', mode: 'pglow', hint: '在框里移动鼠标' }
    },
    {
      id: 'liquid-follow', en: 'Liquid cursor follow', zh: '液态黏附跟随', cat: 'compound',
      alias: ['黏性小球', '果冻跟随', 'gooey'],
      vague: '有个果冻跟着鼠标，还会被拉长',
      say: '位置用弹簧追赶指针，速度投影到角度上沿运动方向拉长、垂直方向压扁，保持体积',
      def: '一个点用弹簧追随指针，同时按速度大小沿运动轴拉伸（scaleX>1, scaleY<1）并旋转对齐速度方向 —— 于是它像有表面张力的液体。只做位移就是普通跟随，拉长+转向才是"液态"。',
      code: 'pos += (target - pos) * 0.14;\nconst v = pos - prev, a = Math.atan2(v.y, v.x), m = Math.min(1, |v| / 18);\nel.style.transform = `rotate(${a}rad) scale(${1 + m * .5}, ${1 - m * .34})`;',
      demo: { kind: 'compound', mode: 'liquid', hint: '在框里移动鼠标' }
    },
    {
      id: 'chart-build', en: 'Scroll-driven chart build', zh: '滚动驱动图表生长', cat: 'compound',
      alias: ['数据随滚动长出来', '折线描边', '图表叙事'],
      vague: '滚到这儿，图表一根根长出来',
      say: '折线用 stroke-dashoffset 描边，柱体按索引错峰 scaleY，数值读数与进度绑定',
      def: '滚动叙事里最常见的一屏：图形随滚动逐步成形。要点是**读数必须和图形同源同进度**，各算各的会出现"柱子满了数字还在跳"。',
      code: 'line.style.strokeDashoffset = L * (1 - p);\nbar.style.transform = `scaleY(${ease(clamp((p - i / n * .6) / .4, 0, 1))})`;',
      demo: { kind: 'compound', mode: 'chart', hint: '在框里滚动' }
    },
    {
      id: 'preview-follow', en: 'Hover-linked floating preview', zh: '悬停联动预览卡', cat: 'compound',
      alias: ['跟随预览', '列表悬停出图', 'preview card'],
      vague: '鼠标在列表上滑，旁边跟着飘一张图',
      say: '预览卡用弹簧跟随指针，换行时只换缩略内容与一次 scale 弹跳，不重新挂载',
      def: '列表行悬停时，一张跟随指针的预览卡在旁边漂浮。它必须**常驻**、只换内容，每次 hover 都新建 DOM 的话切换会闪并且丢惯性。',
      code: 'card += (pointer + offset - card) * 0.16;\ncard.style.transform = `translate(${card}px) rotate(${vx * .5}deg)`;\nrow.onenter = () => thumb.pop();',
      demo: { kind: 'compound', mode: 'preview', hint: '在几行之间移动鼠标' }
    },
    {
      id: 'throw-dismiss', en: 'Velocity throw & dismiss', zh: '速度抛掷丢弃', cat: 'compound',
      alias: ['甩走卡片', '拖拽丢弃', 'swipe to dismiss'],
      vague: '拖一下甩出去，卡片跟着转着飞掉',
      say: '旋转角与横向位移成正比、出手速度决定飞行轨迹，越过阈值才判定为丢弃',
      def: '卡片的旋转跟着位移走、飞行跟着出手速度走，两者缺一不可 —— 只有位移像拖纸片，只有速度像被弹走。丢弃阈值要同时看位移和速度，只看位移会误伤慢速拖动。',
      code: 'rot = dx * 0.07;                       // 角度来自位移\nconst fly = Math.abs(dx) > 88 || Math.abs(vx) > 20;   // 位移或速度越界才算丢弃\nif (fly) card.animate([{ transform: `translate(${vx * 900}px, -60px) rotate(${rot * 6}deg)`, opacity: 0 }], …);',
      demo: { kind: 'compound', mode: 'throw', hint: '抓住最上面那张甩出去' }
    },
    {
      id: 'scramble-decode', en: 'Scramble decode reveal', zh: '乱码解码揭示', cat: 'compound',
      alias: ['解码文字', '黑客风入场', 'text scramble'],
      vague: '字先是一堆乱码，然后一个个定下来',
      say: '每个字符有各自的锁定时刻，未锁定前每帧随机取字形，整体呈左→右的收敛带',
      def: '字符逐个从随机字形收敛到目标字符，形成一条"解码带"。要点是**每帧只替换未锁定的字符**，全部重随机会糊成噪声看不清在发生什么。',
      code: 'for (i) if (frame > lockAt[i]) out += target[i];\n        else out += GLYPHS[random()] ;   // 只滚动未锁定位',
      demo: { kind: 'compound', mode: 'scramble', hint: '点一下重新解码' }
    },
    {
      id: 'opposite-rails', en: 'Opposite scroll rails', zh: '反向图带', cat: 'compound',
      alias: ['双向图带', '反向滚动带', 'rail'],
      vague: '两行图片，一行往左走，一行往右走',
      say: '同一份滚动进度给两行图带写反方向的 translateX，速度比 1 : 0.62——速度差就是深度',
      def: '人眼会不自觉去比对两行的速度，速度差立刻被读成前后两层。实现只写 translateX：一行取负、一行取正，各乘不同系数；内容首尾各补一份做无缝循环。悬停给单张图一点抬升和 ±2° 的倾斜，图就不只是刷过去的背景。',
      code: 'const m = (p * span) % span;\nrowA.style.transform = `translateX(${-m}px)`;               /* 向左 */\nrowB.style.transform = `translateX(${m * 0.62 - span}px)`;   /* 向右，慢一档 */',
      demo: { kind: 'compound', mode: 'rail', hint: '在框里滚动' }
    },
    {
      id: 'depth-tunnel', en: 'Scroll depth tunnel', zh: '纵深隧道', cat: 'compound',
      alias: ['z 轴画廊', '穿越隧道', 'depth tunnel'],
      vague: '往下滚不是往下看，是往里走',
      say: '每张图一个 z 值，滚动平移相机 z：scale = d / (d + z − cam)，越近越大，过身即出画',
      def: '把滚动重新定义成沿 z 轴前进。只动一根轴，冲击力却最强：近处的图放大出画、远处的缩小退后；越过相机的图淡出并从最远处绕回，画廊就成了无限隧道。越远的图同步压暗，纵深更可信。',
      code: 'const rel = z - cam;                        /* 相机前进 = cam 增大 */\nscale = F / (F + rel);\nopacity = rel < 0 ? 0 : clamp(1.2 - rel / 900, 0, 1);',
      demo: { kind: 'compound', mode: 'tunnel', hint: '在框里滚动' }
    },
    {
      id: 'magnetic-button', en: 'Magnetic button', zh: '磁吸按钮', cat: 'compound',
      alias: ['磁性按钮', '按钮吸附', 'magnetic'],
      vague: '鼠标一靠近，按钮就被吸过去',
      say: '指针进入半径 R 内按 (1−d/R) 衰减拉拽按钮，位移走弹簧插值，离开力场回弹归位',
      def: '把指针引力场做成一个衰减函数：距离越近拉力越大，按钮被吸向指针；离开力场后弹簧归零。关键是吸附量必须乘衰减系数而不是常量——否则力场边界处会跳变。适合主 CTA 与关闭按钮，一吸一放之间按钮就有了实体感。',
      code: 'const pull = d < R ? 1 - d / R : 0;      /* 衰减：边界不跳变 */\ntx = dx * .58 * pull;\nx += (tx - x) * .18;                     /* 弹簧跟随 */',
      demo: { kind: 'compound', mode: 'magnetic', hint: '靠近中间的按钮' }
    },
    {
      id: 'tilt-card', en: 'Pointer tilt card', zh: '指针倾斜卡', cat: 'compound',
      alias: ['3D 倾斜', '透视卡片', 'tilt'],
      vague: '卡片跟着鼠标翻转，表面还有一层反光',
      say: '指针偏移映射 rotateX(−y·14°) / rotateY(x·16°)，0.14 系数平滑，光斑 radial-gradient 跟随指针',
      def: '把指针在卡面上的位置映射成两个旋转轴的角度，再叠一层跟随指针的高光，平面立刻有了玻璃厚度。旋转量要收在 ±15° 内并做指数平滑——过大会边缘畸变，不平滑就是抖动而不是质感。',
      code: 'card.style.transform =\n  `perspective(700px) rotateX(${-y * 14}deg) rotateY(${x * 16}deg)`;',
      demo: { kind: 'compound', mode: 'tilt', hint: '在卡上移动鼠标' }
    },
    {
      id: 'odometer-counter', en: 'Odometer number roll', zh: '数字滚动计数', cat: 'compound',
      alias: ['数字翻滚', '里程表计数', 'odometer'],
      vague: '数字像里程表一样滚上去',
      say: '每一位是一条 0–9 竖排字带，translateY 滚到目标行，右→左逐位 delay 55ms，过冲曲线收尾',
      def: '把每位数字做成一条竖排字带，用 translateY 滚到目标行。精髓在节奏：低位先滚、高位后滚（逐位 delay），落位带一点过冲——数字就有了「咔哒咔哒」的机械感。计数、价格、排行榜数字都用它。',
      code: 'digit.style.transform = `translateY(${-n * 10}%)`;\ndigit.style.transitionDelay = (cols - 1 - i) * 55 + "ms";',
      demo: { kind: 'compound', mode: 'odometer', hint: '点按钮抽一个数' }
    },
    {
      id: 'confetti-burst', en: 'Confetti burst', zh: '五彩纸屑', cat: 'compound',
      alias: ['彩带喷发', '庆祝粒子', 'confetti'],
      vague: '点一下，撒出一把会转的彩纸',
      say: '点击处喷出 26 片刚体：初速随机、每帧 vy += g 重力、绕自身轴旋转，落出容器即回收',
      def: '庆祝类动效的标准做法：把每片纸屑当一个刚体粒子——横向随机初速、竖直向上喷出后受重力、带着自身旋转落下。要点是颜色从主题色板取（别用彩虹）、片数 20–30（多了廉价）、出界立刻回收 DOM。用于成功、中奖、发布等「值得庆祝」的时刻。',
      code: 'p.vy += .34;  p.x += p.vx;  p.y += p.vy;  p.r += p.vr;\nel.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.r}deg)`;\nif (p.y > H + 30) el.remove();          /* 出界回收 */',
      demo: { kind: 'compound', mode: 'confetti', hint: '点一下撒纸屑' }
    },
    {
      id: 'smooth-tabs', en: 'Smooth tab indicator', zh: '滑动标签指示器', cat: 'compound',
      alias: ['tab 滑块', '标签切换', 'tab indicator'],
      vague: '点页签，下面那条会自己滑过去',
      say: '指示器读取目标项的 offsetLeft/offsetWidth 平移到位，内容交叉淡入，指示器带轻微过冲',
      def: '把「选中态」从每个页签上拿掉，交给一条公共指示器：它测量目标项的位置后滑过去。测量在 mount 和 resize 时各做一次——布局变化后不重测，指示器就会停在旧位置。这是 Layout Animation 最小最常用的实例。',
      code: 'ind.style.left = item.offsetLeft + "px";\nind.style.width = item.offsetWidth + "px";   /* resize 时重测 */',
      demo: { kind: 'compound', mode: 'tabs', hint: '点页签切换' }
    },
    {
      id: 'coverflow-carousel', en: '3D coverflow carousel', zh: '3D 立体轮播', cat: 'compound',
      alias: ['封面流', '3D 轮播', 'coverflow'],
      vague: '中间那张最大最正，两边的斜着排开',
      say: '每张卡按与焦点的索引差变换：translateX 错位 + translateZ 后退 + rotateY 转向，点击侧卡换焦点',
      def: 'Coverflow 的本质是「索引差 → 变换」的纯函数：off = i − focus，横向错位、Z 轴后退、Y 轴转向全部由 off 推出，焦点切换只改一个数字。透明度和层叠顺序随 |off| 衰减，远卡自然隐去。音乐专辑墙、图片轮播都从它来。',
      code: 'cards.forEach((c, i) => {\n  const off = i - focus;\n  c.style.transform = `translateX(${off * 46}%) translateZ(${-Math.abs(off) * 130}px) rotateY(${off * -32}deg)`;\n});',
      demo: { kind: 'compound', mode: 'coverflow', hint: '点两侧的卡换焦点' }
    },
    {
      id: 'cylinder-reel', en: 'Cylinder photo reel', zh: '圆柱卡带', cat: 'compound',
      alias: ['圆筒轮播', '卷筒旋转', 'cylinder'],
      vague: '一列照片卷成一个圆筒，拖着它转',
      say: '每片照片绕中心按 i·36° 环形排布再 translateZ 出半径，拖拽改 rotY，拖速同时驱动标题字距',
      def: '把一列图卷成圆筒：每片卡片 rotateY(i×36°) 后沿自身朝向推出半径 R（R = 片宽 ÷ 2tan(π/N)），旋转整筒即轮播。聪明的做法是一个速度同源两处响应——拖得越快，标题的字距被「吹」得越开，页面两处同时有了呼吸。松手惯性衰减、字距弹回。',
      code: 'reel.style.transform = `rotateY(${rot}deg)`;\ncard.style.transform = `rotateY(${i * 36}deg) translateZ(${R}px)`;\ntitle.style.letterSpacing = 3 + Math.min(1, Math.abs(vel) * .35) * 14 + "px";',
      demo: { kind: 'compound', mode: 'cylinder', hint: '左右拖动圆筒' }
    },
    {
      id: 'ring-gallery', en: '3D ring gallery', zh: '环形画廊', cat: 'compound',
      alias: ['环廊', '圆环画廊', 'ring'],
      vague: '照片围成一圈，转到面前那张才亮',
      say: '相机在环外：8 张照片按 i·45° 围成圆环，拖拽旋转环体，点击某张即把最短路径转到正面并提亮',
      def: '相机在环外的画廊：每张照片 rotateY(i×45°) translateZ(R) 围成一圈，只有正对相机的一张是全亮全尺寸，其余按角度差衰减亮度与透明度。点击側卡时按最短路径把目标角转到 0°——不写任何补间，只改一个焦点变量。',
      code: 'const want = ((-i * 45 % 360) + 360) % 360;\nconst cur = ((rot % 360) + 360) % 360;\nlet d = want - cur; if (d > 180) d -= 360; if (d < -180) d += 360;\nrotGoal = rot + d;                       /* 最短路径 */',
      demo: { kind: 'compound', mode: 'ring3d', hint: '拖动旋转 · 点击对焦' }
    },
    {
      id: 'page-curl', en: 'Page curl transition', zh: '翻页卷曲转场', cat: 'compound',
      alias: ['翻页', '卷页', 'page turn'], vague: '像翻书一样把下一页翻出来',
      say: '拖动纸张控制翻页进度与卷曲，松手按速度完成或回弹；支持点击、滚轮和方向键连续翻书',
      def: '把纸张细分成网格，随翻页进度弯曲并扭转，正反面使用不同图像，书脊、纸张厚度和投影保持连续。拖动位置决定卷曲形态，松手速度与弹簧决定完成或回弹；可连续翻页，适合相册、故事和杂志。',
      code: '// WebGL 网格翻书：需实现 deformPaper 与 renderBook\nconst progress = clamp((startX - pointerX) / pageWidth, 0, 1);\nfor (const vertex of paper.vertices) {\n  deformPaper(vertex, { progress, grabY, curl, twist });\n}\n// 松手后按速度决定目标，再用弹簧接续；不是平面 rotateY\nrenderBook({ frontTexture, backTexture, shadowMap });',
      demo: { kind: 'compound', mode: 'pagecurl', hint: '拖拽或点击左右翻页 · 滚轮连续翻书' }
    },
    {
      id: 'dynamic-island', en: 'Dynamic Island transition', zh: '灵动岛展开转场', cat: 'compound',
      alias: ['灵动岛', 'Live Activity', '实时活动'], vague: '通知缩在胶囊里，点一下再展开成控制面板',
      say: '同一块胶囊容器从提醒态平滑扩展为实时活动，内容随状态接续出现',
      def: '用一个持续存在的胶囊承接通知和实时活动：收起时只露出关键信息，展开后在同一位置扩展出状态、进度与操作。关键是形状和内容都沿同一容器连续变化，不是弹出另一张卡片。',
      code: '.island { transition: width .42s cubic-bezier(.2,.8,.2,1), height .42s; }\n.island.is-open { width: 236px; height: 112px; }',
      demo: { kind: 'compound', mode: 'island', hint: '点胶囊展开实时活动，再收起' }
    },
    {
      id: 'scratch-reveal', en: 'Scratch to reveal', zh: '刮开显影', cat: 'compound',
      alias: ['刮刮卡', '擦除揭示', 'scratch card'], vague: '用手指擦开表层，下面的图慢慢露出来',
      say: 'Canvas 覆层随指针擦除，刮开面积过半后自动清除剩余表层',
      def: '在答案或图片上盖一层可擦除的表面，用户拖动时逐段露出底图。擦除面积达到阈值后清掉剩余覆盖层，让结果完整显现；触屏与鼠标使用同一套手势。',
      code: 'ctx.globalCompositeOperation = "destination-out";\nctx.lineWidth = 28; ctx.lineCap = "round";\nctx.stroke();',
      demo: { kind: 'compound', mode: 'scratch', hint: '拖动手指或鼠标，刮开表层' }
    },
    {
      id: 'morphing-dot-sphere', en: 'Morphing dot sphere', zh: '粒子球体变形', cat: 'compound',
      alias: ['点阵球', '粒子球', '3D morphing sphere'], vague: '一颗点组成的球，拖动能转，点一下还能变形',
      say: '球面采样点投影到画布，拖动改变视角，点击在球体、心形、圆环、立方体、螺旋、星形与星系七种点阵间平滑插值',
      def: '将粒子按球面分布并用透视投影绘制；拖动旋转球体，点击依次变形成心形、圆环、立方体、螺旋、星形与星系，也可直接选择形状。变形中再次点击会从当前位置接续，不会跳回起点。它适合作为视觉主角或品牌过场，点数和帧率应控制在设备可承受范围内。',
      code: '// 保持粒子索引不变，从当前坐标接续到新形状\npoints.forEach((p, i) => {\n  p.x = lerp(p.x, shapes[selected][i].x, alpha);\n  p.y = lerp(p.y, shapes[selected][i].y, alpha);\n  p.z = lerp(p.z, shapes[selected][i].z, alpha);\n});',
      demo: { kind: 'compound', mode: 'dotsphere', hint: '拖动旋转 · 点击点阵切换形状' }
    },
    {
      id: 'path-weave', en: 'Dual-path ribbon weave', zh: '双路牵丝织形', cat: 'compound',
      alias: ['双路径编织', '双线牵丝', 'ribbon weave'], vague: '两条线从两边长出来，在中间交织成一个形状',
      say: '两条路径分别描绘并在交叉处错层，光点沿路径移动，最终共同组成图形',
      def: '两条独立路径按各自进度描绘，在交叉处用遮挡与层级表现“上下穿过”，让线条编织成一个整体。它适合标志、连接关系和片尾汇聚；如果只让两条线同时亮起，就只是交叉线，不是编织。',
      code: 'path.style.strokeDasharray = pathLength;\npath.style.strokeDashoffset = pathLength * (1 - progress);\n// 交叉处留出底层间隙，再绘制上层路径',
      demo: { kind: 'compound', mode: 'pathweave', hint: '看双路交织 · 点按钮重播', readout: false }
    },
    {
      id: 'target-acquisition', en: 'Target scan & acquire', zh: '目标扫描与锁定', cat: 'compound',
      alias: ['准星锁定', '扫描捕获', 'target lock'], vague: '扫过一遍，找到目标后把它框起来',
      say: '扫描线扫过视野，发现目标后准星对齐，并保持清楚的锁定状态',
      def: '把“扫描 → 命中 → 锁定”做成一段有结果的反馈：扫描线经过视野，目标被框选，随后出现稳定的锁定标记。可用于地图定位、媒体库搜索、图表数据点提示、AR 指引等需要“找到并确认某个对象”的界面；普通页面装饰不需要这套雷达效果。',
      code: 'state = "scanning";\nif (scanHits(target)) state = "locked";\nshowReticle(target); // 锁定后保持可见',
      demo: { kind: 'compound', mode: 'scanlock', hint: '点“重新扫描”，看它如何找到并标记目标' }
    }
  );

  /* ================= HTML ================= */
  const rep = function (n, fn) { let s = ''; for (let i = 0; i < n; i++) s += fn(i); return s; };
  /* 滚动型组合舞台的第二层叙事：不再用「第 1 屏」这种占位文案，
     每个模式把自己真正表达的阶段写出来，卡片才像一个可读的案例而不是测试容器。 */
  const flow = function (labels) {
    return '<div class="sflow">' + labels.map(function (label, i) {
      return '<i class="srow-x"><b>' + String(i + 1).padStart(2, '0') + '</b><span>' + label + '</span><em>SCROLL</em></i>';
    }).join('') + '</div>';
  };
  const FLOW = {
    orbit: flow(['正面 · 0°', '右侧 · 90°', '背面 · 180°', '左侧 · 270°', '回到正面']),
    vortex: flow(['入口', '加速区', '旋流中心', '穿隧中', '出口']),
    hscroll: flow(['总览', '客群', '转化', '留存', '复购']),
    frames: flow(['f 01 / 24', 'f 08 / 24', 'f 16 / 24', 'f 24 / 24', '循环']),
    thememorph: flow(['第一章 · 暖纸', '第二章 · 紫夜', '第三章 · 青光', '第四章 · 玫红', '余韵']),
    ring: flow(['开始 · 0%', '阅读中 · 25%', '阅读中 · 50%', '阅读中 · 75%', '完成 · 100%']),
    linemask: flow(['把一整段话', '拆成四行', '逐行入场', '蒙版打开', '完整可读']),
    vspeed: flow(['静止', '加速', '峰值速度', '反向', '松手回弹']),
    chart: flow(['0k', '32k', '64k', '96k', '128k']),
    rail: flow(['左行 · 近景', '右行 · 远景', '速度差', '交错穿过', '无缝循环']),
    tunnel: flow(['远处', '接近', '擦身而过', '远去', '循环回到入口'])
  };

  const HTML = {
    gaze: function () {
      return '<div class="cp cp-gaze">' +
        '<div class="gz-field" aria-hidden="true">' +
          '<span class="gz-axis gz-axis-x"></span><span class="gz-axis gz-axis-y"></span>' +
          '<i class="gz-cross"></i><span class="gz-ray"><u></u></span><i class="gz-target"></i>' +
        '</div>' +
        '<i class="gz-body" aria-hidden="true">' +
          '<s class="gz-hair"></s><b class="gz-eye"><s class="gz-pupil"></s></b><b class="gz-eye"><s class="gz-pupil"></s></b><u class="gz-mouth"></u>' +
        '</i>' +
        '<span class="cp-cap">gaze ray vs target</span>' +
      '</div>';
    },
    pinned: function () {
      const cards = [['snow-1.jpg', '起点'], ['gal-1.jpg', '光影'], ['city-4.jpg', '远方'], ['p16.jpg', '余韵']];
      return '<div class="scrolly cp cp-pin"><div class="pi-head">' +
        '<div class="pi-hero"><img class="pi-photo" src="assets/img/snow-2.jpg" alt="" loading="lazy" draggable="false"><b data-l10n="山野之间">山野之间</b><s data-l10n="大图留在眼前，故事逐步展开">大图留在眼前，故事逐步展开</s></div>' +
        '<div class="pi-flow">' + cards.map(function (card, i) {
          return '<i class="pi-c">' + im(card[0]) + '<u><span>0' + (i + 1) + '</span><b data-l10n="' + card[1] + '">' + card[1] + '</b></u></i>';
        }).join('') + '</div></div>' +
        '<div class="sflow pi-tall">' + ['引入', '证据', '细节', '转场', '结论', '余韵'].map(function (label, i) {
          return '<i class="srow-x"><b>' + String(i + 1).padStart(2, '0') + '</b><span>' + label + '</span><em>STORY</em></i>';
        }).join('') + '</div></div>';
    },
    stack: function () {
      const T = [['开篇', '为什么先看到这一屏'], ['推进', '下一屏盖上来时它退后'], ['转折', '层数一多就变成卡住'], ['收束', '最后一屏停在正中']];
      const PKP = ['city-4.jpg', 'gal-1.jpg', 'snow-2.jpg', 'city-5.jpg'];
      return '<div class="scrolly cp cp-stack">' + rep(4, function (i) {
        return '<i class="pk pk-' + i + '" style="--i:' + i + '"><u class="pk-ph" style="background-image:url(assets/img/' + PKP[i] + ')"></u><b>0' + (i + 1) + '</b><em>' + T[i][0] + '</em>' +
          '<span>' + T[i][1] + '</span><s class="pk-l"><u></u><u></u></s></i>';
      }) + '</div>';
    },
    dio: function () {
      return '<div class="cp cp-dio"><i class="dl sky"></i><i class="dl moon"></i>' +
        '<i class="dl l1"></i><i class="dl l2"></i><i class="dl l3"></i>' +
        '<b class="dl critter"><s></s></b><span class="cp-cap">depth → factor</span></div>';
    },
    orbit: function () {
      const OBP = ['p02.jpg', 'p07.jpg', 'p11.jpg', 'p15.jpg'];
      return '<div class="scrolly cp cp-orbit"><div class="ob-pin"><i class="ob-fig">' +
        ['前', '右', '后', '左'].map(function (t, i) {
          return '<b class="obf obf-' + i + '" style="--r:' + (i * 90) + 'deg"><img src="assets/img/' + OBP[i] + '" alt="" loading="lazy" draggable="false"><u>' + t + '</u></b>';
        }) + '</i><s class="ob-sh"></s><u class="ob-val">0°</u></div>' + FLOW.orbit + '</div>';
    },
    bloom: function () {
      return '<div class="cp cp-bloom"><i class="dr-scene">' +
        '<b class="dr-cabin"><s class="dr-glow"></s><span class="dr-brand">OPEN</span><u class="dr-console"></u></b>' +
        '<b class="dr-door tl"></b><b class="dr-door tr"></b><b class="dr-door bl"></b><b class="dr-door br"></b>' +
        '</i><span class="cp-cap">hover → 门板绕铰链展开</span></div>';
    },
    vortex: function () {
      return '<div class="scrolly cp cp-vx"><i class="vx-space">' +
        '<i class="vx-field">' +
        rep(10, function (i) { return '<b class="vx-r" style="--i:' + i + '"></b>'; }) +
        rep(12, function (i) { return '<s class="vx-st" style="--a:' + (i * 30) + 'deg"></s>'; }) +
        '<u class="vx-core"></u></i></i>' + FLOW.vortex + '</div>';
    },
    float: function () {
      return '<div class="cp cp-im"><i class="im-sky">' +
        rep(7, function (i) { return '<s class="im-spore" style="--i:' + i + '"></s>'; }) +
        '<u class="im-hill h1"></u><u class="im-hill h2"></u>' +
        '<i class="im-field"></i></i><span class="cp-cap">点哪里，哪里生长</span></div>';
    },
    floatLegacy: function () {
      return '<div class="cp cp-float"><b class="fl-ball"></b>' +
        '<i class="fl-rip"></i><i class="fl-rip"></i>' +
        '<svg class="fl-plant" viewBox="0 0 120 62" preserveAspectRatio="xMidYMax meet">' +
        '<path class="fl-stem" d="M60 62 C 60 44 52 38 43 29"/>' +
        '<path class="fl-stem" d="M60 62 C 60 40 70 33 81 24"/>' +
        '<path class="fl-stem" d="M60 62 C 55 48 44 46 34 44"/>' +
        '<path class="fl-stem" d="M60 62 C 66 47 78 45 88 41"/>' +
        '<path class="fl-stem" d="M60 62 C 52 52 40 56 27 55"/>' +
        '<path class="fl-stem" d="M60 62 C 70 53 84 57 96 55"/>' +
        '<path class="fl-stem" d="M60 62 C 61 46 59 30 60 16"/>' +
        '<circle class="fl-leaf" cx="43" cy="29" r="5.5"/>' +
        '<circle class="fl-leaf" cx="81" cy="24" r="7"/>' +
        '<circle class="fl-leaf" cx="60" cy="16" r="4.5"/>' +
        '<circle class="fl-leaf" cx="34" cy="44" r="4"/>' +
        '<circle class="fl-leaf" cx="88" cy="41" r="5"/>' +
        '<circle class="fl-leaf" cx="27" cy="55" r="4.5"/>' +
        '<circle class="fl-leaf" cx="96" cy="55" r="4.5"/>' +
        '<circle class="fl-bud" cx="43" cy="29" r="2.4"/>' +
        '<circle class="fl-bud" cx="81" cy="24" r="3"/></svg>' +
        '<i class="fl-ground"></i><span class="cp-cap">tap to plant</span></div>';
    },
    helix: function () {
      const HP = ['p16.jpg', 'city-2.jpg', 'city-3.jpg', 'snow-3.jpg', 'abs-1.jpg', 'gal-2.jpg', 'p03.jpg', 'p05.jpg'];
      return '<div class="cp cp-hx"><i class="hx-rot">' +
        rep(8, function (i) { return '<b class="hx-i" style="--i:' + i + '"><img src="assets/img/' + HP[i] + '" alt="" loading="lazy" draggable="false"></b>'; }) +
        '</i><span class="cp-cap">drag ↔ phase</span></div>';
    },
    glow: function () {
      return '<div class="cp cp-lf"><i class="lf-scene"><b class="lf-obj"></b><s class="lf-floor"></s>' +
        '<u class="lf-fog f1"></u><u class="lf-fog f2"></u></i><span class="lf-beam"></span>' +
        '<span class="cp-cap">light = pointer</span></div>';
    },
    spotlight: function () {
      const L = [['p01.jpg', '夜奔'], ['p04.jpg', '站台'], ['city-2.jpg', '霓虹'], ['snow-1.jpg', '雪线'],
        ['p08.jpg', '逆光'], ['gal-1.jpg', '展厅'], ['p12.jpg', '夜车'], ['city-4.jpg', '塔顶'],
        ['p16.jpg', '灯河'], ['abs-1.jpg', '纹理'], ['p05.jpg', '掠影'], ['gal-2.jpg', '回廊']];
      return '<div class="cp cp-sp"><i class="sp-under">' +
        '<b class="sp-title">遮罩下藏着 12 张照片 · 移光标去照</b>' +
        '<div class="sp-grid">' + rep(12, function (i) {
          return '<s><img src="assets/img/' + L[i][0] + '" alt="' + L[i][1] + '" data-l10n="' + L[i][1] + '" data-l10n-attr="alt" loading="lazy" draggable="false"><em data-l10n="' + L[i][1] + '">' + L[i][1] + '</em></s>';
        }) + '</div></i><u class="sp-mask"></u><span class="cp-cap">radial mask</span></div>';
    },
    trail: function () {
      return '<div class="cp cp-tr"><i class="tr-path">' +
        rep(16, function (i) { return '<b class="tr-d" style="--i:' + i + '"></b>'; }) +
        '</i><span class="cp-cap">chained lerp</span></div>';
    },
    fan: function () {
      const cap = ['逆光', '站台', '霓虹', '夜车', '回眸', '灯河'];
      return '<div class="cp cp-fan"><i class="fn-deck">' +
        rep(6, function (i) {
          return '<b class="fn-c" style="--i:' + (i - 2.5) + '">' + im(P16[i], cap[i]) + '<s data-l10n="' + cap[i] + '">' + cap[i] + '</s></b>';
        }) +
        '</i><span class="cp-cap">hover → fan</span></div>';
    },
    peel: function () {
      return '<div class="cp cp-peel"><i class="pc"><b>入口</b><s>hover 揭角</s>' +
        '<u class="pc-c"></u><u class="pc-sh"></u></i><span class="cp-cap">corner peel</span></div>';
    },
    hscroll: function () {
      const T = ['总览', '客群', '转化', '留存', '营收', '成本', '毛利', '现金流', '库存', '履约', '口碑', '复购', '风险', '展望'];
      return '<div class="scrolly cp cp-hs"><i class="hs-pin"><b class="hs-track">' +
        rep(14, function (i) {
          return '<s class="hs-c"><em>' + String(i + 1).padStart(2, '0') + '</em><b>' + T[i] + '</b>' +
            '<u class="hs-bar"><i style="--v:' + (28 + (i * 37) % 66) + '%"></i></u>' +
            '<small>' + (12 + i * 7) + ' 项指标</small></s>';
        }) +
        '</b><u class="hs-hint">← 纵向滚动推动横向位移 →</u></i>' + FLOW.hscroll + '</div>';
    },
    frames: function () {
      return '<div class="scrolly cp cp-fr"><i class="fr-pin">' +
        '<div class="fr-monitor">' +
        '<img class="fr-photo" src="assets/img/p16.jpg" alt="随滚动逐帧横摇的摄影画面" decoding="async">' +
        '<i class="fr-grid" aria-hidden="true"></i><b class="fr-stamp">逐帧 · 光影手记</b>' +
        '</div>' +
        '<div class="fr-console"><div class="fr-track-head"><span>滚轮浏览 · 拖动选帧</span><span class="fr-time">00:00:00</span></div>' +
        '<div class="fr-track"><b class="fr-ticks" aria-hidden="true"></b><input class="fr-seek" type="range" min="0" max="23" step="1" value="0" aria-label="选择画面帧"></div></div>' +
        '<u class="fr-val">f 01/24</u></i>' +
        '<div class="fr-scroll-range" aria-hidden="true"><span>END OF SEQUENCE · 24 FRAMES</span></div></div>';
    },
    twocol: function () {
      const T = ['起点', '爬坡', '转折', '峰值', '回落', '结论'];
      const D = ['一切从这里开始', '增长开始显现', '趋势掉头', '到达最高点', '热度退去', '沉淀成结论'];
      /* land-1 / land-4 是旧素材名，当前素材库对应的是雪景 / 城市图。 */
      const TCP = ['snow-1.jpg', 'snow-2.jpg', 'abs-1.jpg', 'city-4.jpg', 'gal-1.jpg', 'city-3.jpg'];
      return '<div class="scrolly cp cp-2c"><div class="tc-layout"><div class="tc-left"><img class="tc-img" src="assets/img/snow-1.jpg" alt="" loading="lazy" draggable="false"><b class="tc-n">01</b><s class="tc-t">起点</s></div>' +
        '<div class="tc-right">' + rep(6, function (i) {
          return '<i class="tc-s" data-n="' + (i + 1) + '" data-t="' + T[i] + '" data-img="' + TCP[i] + '"><b>第 ' + (i + 1) + ' 段 · ' + T[i] + '</b>' +
            '<s>' + D[i] + '</s><u class="tc-bar"><i style="--v:' + (24 + i * 13) + '%"></i></u></i>';
        }) + '</div></div></div>';
    },
    thememorph: function () {
      return '<div class="scrolly cp cp-tm"><i class="tm-pin"><article class="tm-card">' +
        '<span class="tm-kicker">FIELD NOTES <i>·</i> 2025</span><b class="tm-hd">第一章</b>' +
        '<p class="tm-copy">光线落下的地方，<br>故事开始有了颜色。</p>' +
        '<u class="tm-sw"><k class="a"></k><k class="b"></k><k class="c"></k></u>' +
        '<s class="tm-hex">#F3EDF7</s><em class="tm-dots">' + rep(4, function (i) { return '<b></b>'; }) + '</em>' +
        '<small class="tm-foot">SCROLL TO TURN THE PAGE</small></article></i>' + FLOW.thememorph + '</div>';
    },
    ring: function () {
      return '<div class="scrolly cp cp-rg"><i class="rg-pin"><article class="rg-cover">' +
        '<span class="rg-kicker">A SMALL READING JOURNAL <i>·</i> 01</span>' +
        '<h3>让阅读，<em>有迹可循</em></h3><p>向下读，进度环会陪着章节一起向前。</p>' +
        '<div class="rg-meter"><svg viewBox="0 0 76 76"><circle class="rg-bg" cx="38" cy="38" r="32"/><circle class="rg-fg" cx="38" cy="38" r="32"/></svg>' +
        '<b class="rg-v">0%</b></div><span class="rg-scroll">SCROLL TO CONTINUE <i>↓</i></span></article></i>' + FLOW.ring + '</div>';
    },
    fab: function () {
      const items = ['拆解参考动效', '整理项目素材', '导出交互稿', '同步设计反馈'];
      return '<div class="cp cp-fab"><div class="fb-page"><header class="fb-head"><span>MY SPACE <i>·</i> TODAY</span><b>今日清单</b></header><div class="fb-list">' +
        rep(4, function (i) { return '<b class="fb-row"><s>0' + (i + 1) + '</s><u>' + items[i] + '</u><em>' + ['03', '02', '01', '↗'][i] + '</em></b>'; }) + '</div></div>' +
        '<i class="fb-scrim"></i>' +
        '<i class="fb"><b class="fb-plus">+</b>' +
        '<s class="fb-rows">' + rep(3, function (i) { return '<u>' + ['新建提醒', '分享给我', '加入清单'][i] + '</u>'; }) + '</s></i>' +
        '<span class="cp-cap">tap the FAB</span></div>';
    },
    tristate: function () {
      return '<div class="cp cp-ts"><div class="ts-flow">' +
        '<i data-st="idle"><b>1</b><s>idle</s></i><em></em>' +
        '<i data-st="load"><b>2</b><s>loading</s></i><em></em>' +
        '<i data-st="done"><b>3</b><s>done</s></i></div>' +
        '<i class="tb"><b class="tb-lbl">保存</b><s class="tb-spin"></s>' +
        '<u class="tb-ok">✓</u></i><span class="cp-cap">同一个节点形变，不换 DOM</span></div>';
    },
    compare: function () {
      return '<div class="cp cp-cp" data-wipe="50" role="group" aria-label="前后画面对比" data-l10n="前后画面对比" data-l10n-attr="aria-label">' +
        '<i class="cp-after">' + im('city-1-graded.jpg', '调色后的夜景照片') + '<b class="cp-tag after-tag" aria-hidden="true" data-l10n="AFTER · 调色后">AFTER · 调色后</b></i>' +
        '<i class="cp-before">' + im('city-1.jpg', '未经调色的夜景照片') + '<b class="cp-tag before-tag" aria-hidden="true" data-l10n="BEFORE · 原图">BEFORE · 原图</b></i>' +
        '<b class="cp-line" aria-hidden="true"><s class="cp-hd" role="slider" tabindex="0" aria-orientation="horizontal" aria-label="对比滑块" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-valuetext="50% 原图"></s></b>' +
        '<span class="cp-cap" aria-live="off">拖动比较 · 50%</span></div>';
    },
    linemask: function () {
      return '<div class="scrolly cp cp-lm"><i class="lm-pin">' +
        rep(4, function (i) { return '<b class="lm-line"><s>' + ['把一整段话', '拆成四行', '各自从蒙版里', '升起来'][i] + '</s></b>'; }) +
        '<u class="lm-rule"></u></i>' + FLOW.linemask + '</div>';
    },
    vspeed: function () {
      const chip = function (t) { return '<s>' + t + '</s>'; };
      return '<div class="scrolly cp cp-vs"><i class="vs-pin">' +
        '<b class="vs-row a">' + rep(9, function (i) { return chip(['SCROLL', 'VELOCITY', 'SKEW', 'MARQUEE', 'PARALLAX', 'DRIVEN', 'MOTION', 'LEXICON', 'EASING'][i]); }) + '</b>' +
        '<b class="vs-row b">' + rep(9, function (i) { return chip(['刚度', '阻尼', '错峰', '遮罩', '视差', '描边', '弹性', '序列', '跟随'][i]); }) + '</b>' +
        '<u class="vs-v">0.00</u></i>' + FLOW.vspeed + '</div>';
    },
    pglow: function () {
      const PH = ['p01.jpg', 'p02.jpg', 'p03.jpg', 'p04.jpg', 'p05.jpg', 'p06.jpg', 'p07.jpg', 'p08.jpg', 'p09.jpg', 'p10.jpg', 'p11.jpg', 'p12.jpg'];
      return '<div class="cp cp-pg"><i class="pg-grid">' +
        rep(35, function (i) { return '<b class="pg-t" style="--i:' + i + '; background-image:url(assets/img/' + PH[i % 12] + ')"></b>'; }) +
        '</i><span class="cp-cap">falloff (1−d/R)²</span></div>';
    },
    liquid: function () {
      return '<div class="cp cp-lb"><i class="lb-well">' +
        rep(5, function (i) { return '<u class="lb-pin" style="--i:' + i + '"></u>'; }) +
        '<s class="lb-trail"></s><b class="lb-drop"></b></i><span class="cp-cap">spring + stretch</span></div>';
    },
    chart: function () {
      return '<div class="scrolly cp cp-cb"><i class="cb-pin"><b class="cb-head"><span>WEEKLY REVENUE <i>·</i> 2025</span><strong>营收趋势 <em>滚动生长</em></strong></b><b class="cb-box">' +
        '<svg viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden="true">' +
        '<path class="cb-ghost-area" d="M8 108 L8 92 56 78 104 86 152 50 200 60 248 24 292 38 L292 108 Z"/>' +
        '<path class="cb-ghost-line" d="M8 92 L56 78 104 86 152 50 200 60 248 24 292 38"/>' +
        '<path class="cb-area" d="M8 108 L8 92 56 78 104 86 152 50 200 60 248 24 292 38 L292 108 Z"/>' +
        '<path class="cb-line" d="M8 92 L56 78 104 86 152 50 200 60 248 24 292 38"/>' +
        '</svg><u class="cb-bars">' + rep(7, function (i) { return '<s style="--i:' + i + ';--bar-height:' + [24, 38, 31, 57, 49, 83, 72][i] + '%"></s>'; }) + '</u>' +
        '<span class="cb-axis" aria-hidden="true">' + rep(7, function (i) { return '<span>0' + (i + 1) + '</span>'; }) + '</span></b><em class="cb-v">0k</em></i>' +
        '<div class="cb-scroll-range" aria-hidden="true"></div></div>';
    },
    preview: function () {
      const R = [['容器变换', 'p03.jpg'], ['错峰入场', 'p07.jpg'], ['滚动钉住', 'p10.jpg'], ['液态跟随', 'p15.jpg']];
      return '<div class="cp cp-pf"><i class="pf-list">' +
        rep(4, function (i) { return '<button type="button" class="pf-row' + (i ? '' : ' on') + '" aria-pressed="' + (i ? 'false' : 'true') + '" style="--i:' + i + '" data-img="' + R[i][1] + '"><em>' + R[i][0] + '</em><s>↗</s></button>'; }) +
        '</i><u class="pf-card"><s class="pf-thumb">' + im('p03.jpg') + '</s><b class="pf-name">容器变换</b></u>' +
        '<span class="cp-cap">常驻，只换内容</span></div>';
    },
    throw: function () {
      return '<div class="cp cp-th"><i class="th-deck">' +
        rep(3, function (i) {
          return '<b class="th-c" style="--i:' + i + '">' + im(P16[12 + i]) +
            '<s class="th-tag">拖我甩走</s></b>';
        }) +
        '</i><span class="cp-cap">快速甩出 · 轻放归位</span></div>';
    },
    /* ---- 31. 反向图带（rail）：两行图反方向滚，速度差即深度 ---- */
    rail: function () {
      const SET = ['city-2.jpg', 'p03.jpg', 'snow-1.jpg', 'p06.jpg', 'gal-1.jpg', 'p10.jpg', 'city-4.jpg', 'p12.jpg'];
      const row = function () { return rep(16, function (k) { return '<b class="rl-c" style="--i:' + (k % 8) + '">' + im(SET[k % 8]) + '</b>'; }); };
      return '<div class="scrolly cp cp-rl"><div class="rl-pin">' +
        '<header class="cp-ed"><span class="cp-kick">RAIL · 反向图带</span>' +
        '<b class="ced-hd">两行图，<em>一往左，一往右</em></b>' +
        '<span class="cp-dots">' + rep(4, function (i) { return '<i' + (i ? '' : ' class="on"') + '></i>'; }) + '</span></header>' +
        '<div class="rl-wrap"><div class="rl-row a">' + row() + '</div><div class="rl-row b">' + row() + '</div></div>' +
        '<footer class="cp-sub">速度差 1 : 0.62 = 前后两层 · 悬停抬升</footer>' +
        '</div>' + FLOW.rail + '</div>';
    },
    /* ---- 32. 纵深隧道（tunnel）：滚动即沿 z 轴前进 ---- */
    tunnel: function () {
      const SET = ['p01.jpg', 'p05.jpg', 'p09.jpg', 'p13.jpg', 'p02.jpg', 'p08.jpg', 'p16.jpg'];
      return '<div class="scrolly cp cp-tn"><div class="tn-pin">' +
        '<header class="cp-ed"><span class="cp-kick">TUNNEL · 纵深隧道</span>' +
        '<b class="ced-hd">往下滚，<em>是往前走</em></b></header>' +
        '<i class="tn-space">' + rep(7, function (i) {
          return '<b class="tn-c" data-i="' + i + '">' + im(SET[i]) + '</b>';
        }) + '</i>' +
        '<footer class="cp-sub">越近的照片越大；经过视点后从画面消失</footer>' +
        '</div>' + FLOW.tunnel + '</div>';
    },
    /* ---- 33. 磁吸按钮：引力场随距离衰减 ---- */
    magnetic: function () {
      return '<div class="cp cp-mg"><i class="mg-ring" aria-hidden="true"></i>' +
        '<b class="mg-btn">抓我</b><span class="cp-cap">靠近就吸过来 · 移开后回弹</span></div>';
    },
    /* ---- 34. 指针倾斜卡：rotateX/rotateY + 跟随光斑 ---- */
    tilt: function () {
      return '<div class="cp cp-tl"><b class="tl-card">' + im('p06.jpg') +
        '<u class="tl-glare"></u><s class="tl-cap">TILT</s></b>' +
        '<span class="cp-cap">rotateX / rotateY ← 指针</span></div>';
    },
    /* ---- 35. 数字滚动计数：逐位字带 translateY ---- */
    odometer: function () {
      const strip = rep(10, function (i) { return '<i>' + i + '</i>'; });
      return '<div class="cp cp-od"><b class="od-n">' +
        rep(4, function () { return '<u class="od-d"><b>' + strip + '</b></u>'; }) +
        '</b><i class="od-btn" role="button" tabindex="0">点一下 抽一个数</i>' +
        '<span class="cp-cap">低位先滚 · 逐位 55ms</span></div>';
    },
    /* ---- 39. 圆柱卡带：一列照片卷成圆筒 ---- */
    cylinder: function () {
      const CP = ['p01.jpg', 'p04.jpg', 'p09.jpg', 'p12.jpg', 'p02.jpg', 'p07.jpg', 'p11.jpg', 'p14.jpg', 'p16.jpg', 'p05.jpg'];
      return '<div class="cp cp-cy"><div class="cy-pin">' +
        '<header class="cp-ed"><span class="cp-kick">CYLINDER · 圆柱卡带</span>' +
        '<b class="ced-hd cy-hd">All of it, <em>in one turn</em></b>' +
        '<span class="cp-dots">' + rep(4, function (i) { return '<i' + (i ? '' : ' class="on"') + '></i>'; }) + '</span></header>' +
        '<i class="cy-space"><i class="cy-reel">' +
        rep(10, function (i) { return '<b class="cy-c" style="--i:' + i + '">' + im(CP[i]) + '</b>'; }) +
        '</i></i>' +
        '<footer class="cp-sub">拖的速度同时吹散标题字距 · 松手回弹</footer>' +
        '</div></div>';
    },
    /* ---- 40. 环形画廊：相机在环外（拖拽驱动，不滚动） ---- */
    ring3d: function () {
      const RP = ['abs-1.jpg', 'abs-2.jpg', 'p13.jpg', 'p09.jpg', 'p14.jpg', 'gal-1.jpg', 'p10.jpg', 'p06.jpg'];
      return '<div class="cp cp-r3">' +
        '<header class="cp-ed"><span class="cp-kick">RING · 环形画廊</span>' +
        '<b class="ced-hd">Everything, <em>on the turn</em></b></header>' +
        '<i class="r3-space"><i class="r3-ring">' +
        rep(8, function (i) { return '<b class="r3-c" style="--i:' + i + '">' + im(RP[i]) + '</b>'; }) +
        '</i></i>' +
        '<footer class="cp-sub">左右拖动旋转 · 点一张把它转到正面</footer>' +
        '</div>';
    },
    /* ---- 36. 五彩纸屑：刚体粒子 + 重力 ---- */
    confetti: function () {
      return '<div class="cp cp-cf"><i class="cf-stage"><b class="cf-btn">🎉 放一把</b></i>' +
        '<span class="cp-cap">gravity + spin · 出界回收</span></div>';
    },
    /* ---- 37. 滑动标签指示器：公共指示条 ---- */
    tabs: function () {
      return '<div class="cp cp-tb2"><div class="tb2-row">' +
        '<b class="tb2-it on" role="tab" tabindex="0" aria-selected="true">首页</b><b class="tb2-it" role="tab" tabindex="0" aria-selected="false">数据</b><b class="tb2-it" role="tab" tabindex="0" aria-selected="false">我的</b>' +
        '<i class="tb2-ind"></i></div>' +
        '<p class="tb2-page"><span>这是「首页」页签的内容。</span></p>' +
        '<span class="cp-cap">指示器测量目标项后滑过去</span></div>';
    },
    /* ---- 38. 3D 立体轮播：索引差 → 变换 ---- */
    coverflow: function () {
      const P = ['p11.jpg', 'p04.jpg', 'p01.jpg', 'p14.jpg', 'p09.jpg', 'p05.jpg', 'p12.jpg'];
      return '<div class="cp cp-cv"><i class="cv-stage">' +
        rep(7, function (i) { return '<b class="cv-c">' + im(P[i]) + '</b>'; }) +
        '</i><span class="cp-cap">off = i − focus · 点击换焦点</span></div>';
    },
    pagecurl: function () {
      return '<div class="cp cp-pagecurl native-page-book"><canvas data-book-book tabindex="0" aria-label="拖拽、滚轮或方向键翻书"></canvas><span class="loading">正在装订图册…</span><span class="fallback" role="status"></span><span class="sr-only" data-book-status role="status" aria-live="polite"></span></div>';
    },
    island: function () {
      return '<div class="cp cp-island"><div class="di-phone"><div class="di-status"><span>9:41</span><span>●●● ▰</span></div>' +
        '<div class="di-island" role="group" aria-label="音乐实时活动示例" data-l10n="音乐实时活动示例" data-l10n-attr="aria-label"><button type="button" class="di-compact" aria-expanded="false" aria-label="展开正在播放的实时活动" data-l10n="展开正在播放的实时活动" data-l10n-attr="aria-label"><i class="di-cover">♫</i><b data-l10n="正在播放">正在播放</b><span class="di-wave"><i></i><i></i><i></i><i></i></span></button>' +
        '<div class="di-expanded" aria-hidden="true"><div class="di-expanded-head"><span class="di-art">♫</span><span class="di-track"><b data-di-track>Golden Hour</b><small data-di-artist>JVKE · 今日歌单</small></span><button type="button" class="di-collapse" aria-label="收起实时活动">⌃</button></div><i class="di-progress"><s></s></i><span class="di-controls"><button type="button" class="di-prev" aria-label="上一首">|◀</button><button type="button" class="di-play" aria-label="暂停" aria-pressed="true">Ⅱ</button><button type="button" class="di-next" aria-label="下一首">▶|</button></span></div></div>' +
        '<div class="di-home"><i></i></div></div><span class="cp-cap">点顶部胶囊，查看实时活动</span></div>';
    },
    pathweave: function () {
      return '<div class="cp cp-pathweave"><div class="pw-heading"><small>FORM STUDY / 02</small><b>两条路径，织成一个整体</b><span>DUAL STRANDS · SHARED FORM</span></div>' +
        '<svg class="pw-svg" viewBox="0 0 640 280" role="img" aria-label="两条彩色带状路径在交叉处一上一下，编织成连续的环形">' +
        '<path class="pw-guide" d="M54 140 C140 20 232 20 320 140 S500 260 586 140"/><path class="pw-guide" d="M54 140 C140 260 232 260 320 140 S500 20 586 140"/>' +
        '<path class="pw-shadow pw-a" d="M54 140 C140 20 232 20 320 140 S500 260 586 140"/><path class="pw-under" d="M54 140 C140 20 232 20 320 140 S500 260 586 140"/><path class="pw-glint pw-a" d="M54 140 C140 20 232 20 320 140 S500 260 586 140"/>' +
        '<path class="pw-cut" d="M54 140 C140 260 232 260 320 140 S500 20 586 140"/><path class="pw-shadow pw-b" d="M54 140 C140 260 232 260 320 140 S500 20 586 140"/><path class="pw-over" d="M54 140 C140 260 232 260 320 140 S500 20 586 140"/><path class="pw-glint pw-b" d="M54 140 C140 260 232 260 320 140 S500 20 586 140"/>' +
        '<circle class="pw-node pw-node-a" r="5"><animateMotion dur="3.4s" repeatCount="indefinite" path="M54 140 C140 20 232 20 320 140 S500 260 586 140"/></circle><circle class="pw-node pw-node-b" r="4"><animateMotion dur="3.4s" begin="-1.7s" repeatCount="indefinite" path="M54 140 C140 260 232 260 320 140 S500 20 586 140"/></circle></svg>' +
        '<div class="pw-foot"><span><i></i> STRAND A</span><span><i></i> STRAND B</span><button type="button" class="pw-replay">重新织一次 <b>↗</b></button></div></div>';
    },
    scanlock: function () {
      return '<div class="cp cp-scanlock is-locked"><div class="sl-top"><span><small>SIGNAL / 03</small><b class="sl-heading" aria-live="polite">已找到目标</b></span><span class="sl-status"><i></i><b class="sl-state-scan">SCANNING</b><b class="sl-state-found">TARGET FOUND</b><b class="sl-state-locked">LOCKED</b></span></div><div class="sl-field"><i class="sl-scan"></i><i class="sl-grid"></i><div class="sl-target"><span class="sl-bracket"></span><i class="sl-cross"></i><b>OBJECT 08</b><small>38° 14′ N　120° 06′ E</small></div><div class="sl-lock"><i>✓</i><span><b>目标已锁定</b><small>TRACKING STABLE</small></span></div><span class="sl-axis sl-axis-x">X / 08</span><span class="sl-axis sl-axis-y">SCAN AREA</span></div><div class="sl-steps"><span><i>01</i>扫描</span><b></b><span><i>02</i>命中</span><b></b><span class="active"><i>03</i>锁定</span></div><button type="button" class="sl-replay">重新扫描 <span>↻</span></button></div>';
    },
    scratch: function () {
      return '<div class="cp cp-scratch"><div class="sr-card"><img src="assets/img/snow-2.jpg" alt="雾林中的小屋" draggable="false"><div class="sr-copy"><small>今日的惊喜</small><b>把小小的<br>好天气收下</b><span>SCRATCH TO REVEAL</span></div><canvas class="sr-foil" aria-label="可擦除的雾面覆盖层"></canvas><button type="button" class="sr-reset">再来一次</button></div><span class="cp-cap">按住拖动，擦开雾面</span></div>';
    },
    dotsphere: function () {
      return '<div class="cp cp-dotsphere"><canvas class="ds-canvas" aria-label="拖动旋转点阵；轻点切换七种形状" data-l10n="拖动旋转点阵；轻点切换七种形状" data-l10n-attr="aria-label"></canvas>' +
        '<div class="ds-title"><small>FORM / <span class="ds-index">01</span></small><b class="ds-name" aria-live="polite">球体</b></div>' +
        '<div class="ds-controls"><div class="ds-shapes" role="group" aria-label="选择粒子形状" data-l10n="选择粒子形状" data-l10n-attr="aria-label">' +
        ['球体', '心形', '圆环', '立方体', '螺旋', '星形', '星系'].map(function (name, i) {
          return '<button type="button" data-shape="' + i + '" aria-pressed="' + (i === 0) + '" data-l10n="' + name + '">' + name + '</button>';
        }).join('') + '</div><button type="button" class="ds-toggle" aria-label="切换到下一种形状" data-l10n="切换到下一种形状" data-l10n-attr="aria-label">下一形状 <span>↗</span></button></div></div>';
    },
    scramble: function () {
      return '<div class="cp cp-sc"><b class="sc-txt" data-t="MOTION LEXICON">MOTION LEXICON</b>' +
        '<s class="sc-sub" data-t="把感觉说成术语">把感觉说成术语</s>' +
        '<u class="sc-bar"><i></i></u><span class="cp-cap">click to re-decode</span></div>';
    }
  };

  /* ================= 各模式的驱动 ================= */
  function scrollBox(stage) {
    const box = $('.scrolly', stage);
    /* 回吸自 scroll-driven-animations.style 的 scroll-shadows：上下边缘投影只在
       「那个方向还有内容」时出现。纯 background-attachment 技巧，不用一行 JS。 */
    if (box) box.classList.add('scrolly--ss');
    const prog = function () {
      /* 关掉动效：进度钉在 1，画面落在终态。
         原来直接不跑，linemask 四行永远藏在蒙版里、chart 空轴 —— 看着像坏了。 */
      if (!window.ENGINE.motionOn()) return 1;
      const max = box.scrollHeight - box.clientHeight;
      return max > 0 ? clamp(box.scrollTop / max, 0, 1) : 0;
    };
    return { box: box, prog: prog };
  }
  function onScroll(stage, box, fn) {
    box.addEventListener('scroll', fn, { passive: true });
    // Mounting can precede layout; recompute geometry when the actual viewport appears.
    stage._ro = new ResizeObserver(fn); stage._ro.observe(box);
    fn();
  }
  /* 指针归一化：中心 0，边缘 ±1 */
  function pointerNorm(stage, el, out) {
    const update = function (e) {
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      out.x = clamp(((e.clientX - r.left) / r.width - .5) * 2, -1, 1);
      out.y = clamp(((e.clientY - r.top) / r.height - .5) * 2, -1, 1);
      out.live = 1;
    };
    el.addEventListener('pointerdown', update);
    el.addEventListener('pointermove', update);
    el.addEventListener('pointerleave', function () { out.live = 0; });
  }
  /* 同上，但归一化到 0–1，供写 --lx/--ly 百分比的模式使用 */
  function pointerPct(el, out) {
    const update = function (e) {
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      out.x = clamp((e.clientX - r.left) / r.width, 0, 1);
      out.y = clamp((e.clientY - r.top) / r.height, 0, 1);
      out.live = 1;
    };
    el.addEventListener('pointerdown', update);
    el.addEventListener('pointermove', update);
    el.addEventListener('pointerleave', function () { out.live = 0; });
  }

  /* ---- 1. 视线跟随 ---- */
  function gaze(stage) {
    const pupils = $$('.gz-pupil', stage), eyes = $$('.gz-eye', stage), head = $('.gz-body', stage);
    const field = $('.gz-field', stage), target = $('.gz-target', stage);
    const host = stage.closest('.term--detail'), readout = host && $('.gz-readout', host);
    const mapDot = readout && $('.gz-map-dot', readout);
    const outState = readout && $('[data-gz-out="state"]', readout);
    const outX = readout && $('[data-gz-out="x"]', readout);
    const outY = readout && $('[data-gz-out="y"]', readout);
    const outLag = readout && $('[data-gz-out="lag"]', readout);
    const outTx = readout && $('[data-gz-out="tx"]', readout);
    const outTy = readout && $('[data-gz-out="ty"]', readout);
    const outMode = readout && $('[data-gz-out="mode"]', readout);
    const outSmooth = readout && $('[data-gz-out="smooth"]', readout);
    const outRange = readout && $('[data-gz-out="range"]', readout);
    const p = { x: 0, y: 0, live: 0 };
    const aim = { x: .5, y: .5, live: 0 };
    let cx = 0, cy = 0, nextBlink = 2200, blinkEnd = 0;
    pointerNorm(stage, stage, p);
    /* 头像会盖住场地的一部分，监听场地本身会在鼠标经过脸时漏掉坐标。
       从舞台捕获事件，再把视口坐标换算成场地内坐标；准心因此始终落在真实指针下。 */
    stage.addEventListener('pointermove', function (e) {
      if (!field) return;
      const r = field.getBoundingClientRect();
      if (!r.width || !r.height) return;
      aim.x = clamp((e.clientX - r.left) / r.width, 0, 1);
      aim.y = clamp((e.clientY - r.top) / r.height, 0, 1);
      aim.live = 1;
    });
    stage.addEventListener('pointerleave', function () { aim.live = 0; });
    watch(stage, function (now) {
      let tx = p.x, ty = p.y;
      if (!p.live) { tx = Math.cos(now / 1700) * .55; ty = Math.sin(now / 1150) * .3; }
      const sm = P(stage, 'sm', .16), R = P(stage, 'rr', 7.5);
      cx = lerp(cx, tx, sm); cy = lerp(cy, ty, sm);
      pupils.forEach(function (el) {
        el.style.transform = 'translate(' + (cx * R).toFixed(2) + 'px,' + (cy * R).toFixed(2) + 'px)';
      });
      if (head) head.style.transform = 'translate(' + (cx * 3.5).toFixed(2) + 'px,' + (cy * 2.5).toFixed(2) + 'px)';
      if (field) {
        field.style.setProperty('--gx', ((aim.live ? aim.x : .5) * 100).toFixed(2) + '%');
        field.style.setProperty('--gy', ((aim.live ? aim.y : .5) * 100).toFixed(2) + '%');
        /* 射线只报角度：起点在场地中心，末端离目标环还差多少，就是这一帧的滞后 */
        field.style.setProperty('--ray', (Math.atan2(cy, cx) * 180 / Math.PI).toFixed(2) + 'deg');
        field.classList.toggle('is-live', !!p.live);
      }
      if (target) {
        target.style.setProperty('--tx', (aim.live ? aim.x : .5).toFixed(3));
        target.style.setProperty('--ty', (aim.live ? aim.y : .5).toFixed(3));
      }
      if (readout) {
        /* 主读数讲「眼睛此刻真的看向哪」，用和 RANGE 同一把尺（px）；目标另起一行。
           原来 live 时这个字段读目标、idle 时读平滑值，同一个位置两种含义，
           而 LAG 又是这两者相减 —— 读数解释不了画面，得反过来让画面解释读数。 */
        const sgn = function (v) { return (v >= 0 ? '+' : '') + v.toFixed(1); };
        if (outState) outState.textContent = p.live ? 'TRACKING' : 'IDLE LOOP';
        if (outMode) outMode.textContent = p.live ? 'POINTER' : 'AUTONOMOUS';
        if (outX) outX.textContent = sgn(cx * R);
        if (outY) outY.textContent = sgn(cy * R);
        if (outTx) outTx.textContent = sgn(tx * R);
        if (outTy) outTy.textContent = sgn(ty * R);
        if (outLag) outLag.textContent = (Math.hypot(cx - tx, cy - ty) * R).toFixed(1) + 'px';
        if (outSmooth) outSmooth.textContent = sm.toFixed(2);
        if (outRange) outRange.textContent = R.toFixed(1) + 'px';
        if (mapDot) {
          mapDot.style.setProperty('--map-x', ((p.live ? p.x : cx) * 42).toFixed(1) + 'px');
          mapDot.style.setProperty('--map-y', ((p.live ? p.y : cy) * 42).toFixed(1) + 'px');
        }
        readout.classList.toggle('is-live', !!p.live);
      }
      if (!blinkEnd && now > nextBlink) { blinkEnd = now + 120; eyes.forEach(el => el.classList.add('blink')); }
      if (blinkEnd && now > blinkEnd) {
        blinkEnd = 0; nextBlink = now + 2400 + Math.random() * 2800;
        eyes.forEach(el => el.classList.remove('blink'));
      }
    });
  }

  /* ---- 2. 主视觉钉住重组 ---- */
  function pinned(stage) {
    const sc = scrollBox(stage), hero = $('.pi-hero', stage), cards = $$('.pi-c', stage);
    const upd = function () {
      const p = sc.prog(), e = 1 - Math.pow(1 - p, 3);
      if (hero) {
        hero.style.transform = 'translateX(' + (e * 1).toFixed(2) + '%) scale(' + lerp(1, P(stage, 'es', .74), e).toFixed(4) + ')';
      }
      /* 堆叠态 → 一行小卡，这就是「重组」本身。
         原来这里给的是 scaleX(3.1) + translateY(i*30)：卡片各自向右下摊开、宽到出框，
         起始画面糊成一片斜向残影，不像任何真实网页的初始态。
         改成把它们收到同一处叠成一摞（横向并拢 + 每层错 5px），错峰展开成一行。 */
      const mid = (cards.length - 1) / 2;
      /* 间距按真实布局量：卡片宽度与间隙在卡片和详情页里不一样，
         写死一个系数会留下一条缝（.86 就还剩 29px 的扇形），永远叠不到一起。 */
      const step = cards.length > 1 ? (cards[1].offsetLeft - cards[0].offsetLeft) : (cards[0].offsetWidth || 116);
      cards.forEach(function (el, i) {
        const d = clamp((e - .06 - i * .07) / .52, 0, 1), k = 1 - Math.pow(1 - d, 3);
        el.style.transform = 'translateX(' + (-(i - mid) * step * (1 - k)).toFixed(1) + 'px) translateY(' +
          ((i - mid) * 5 * (1 - k)).toFixed(1) + 'px) scale(' + lerp(.94, 1, k).toFixed(3) + ')';
        el.style.opacity = '1';
        el.style.zIndex = String(cards.length - i);
      });
    };
    onScroll(stage, sc.box, upd);
  }

  /* ---- 3. 章节覆盖堆叠 ---- */
  function stackCards(stage) {
    const sc = scrollBox(stage), cards = $$('.pk', stage);
    const upd = function () {
      /* 先量后写：写 transform 会改变同一轮里后面的测量值 */
      const rects = cards.map(el => el.getBoundingClientRect());
      cards.forEach(function (el, i) {
        const next = rects[i + 1];
        if (!next) return;
        const h = rects[i].height || 88;
        const cov = clamp((h - (next.top - rects[i].top)) / (h - P(stage, 'step', 14)), 0, 1);
        el.style.transform = 'scale(' + (1 - .075 * cov).toFixed(3) + ') translateY(' + (-cov * 7).toFixed(1) + 'px)';
        /* 被盖住的同时降饱和，堆到第三张才不会看成同一张 */
        el.style.filter = 'brightness(' + (1 - .17 * cov).toFixed(3) + ') saturate(' + (1 - .34 * cov).toFixed(3) + ')';
        el.style.boxShadow = cov > .02
          ? '0 ' + (-4 - cov * 16).toFixed(1) + 'px ' + (18 + cov * 26).toFixed(0) + 'px -10px rgba(20, 16, 36, ' + (0.1 + cov * .28).toFixed(3) + ')'
          : '';
      });
    };
    onScroll(stage, sc.box, upd);
  }

  /* ---- 4. 微缩景观视差 ---- */
  function diorama(stage) {
    const wrap = $('.cp-dio', stage), critter = $('.critter', stage);
    const p = { x: 0, y: 0, live: 0 };
    let cx = 0, cy = 0;
    pointerNorm(stage, stage, p);
    watch(stage, function (now) {
      let tx = p.x, ty = p.y;
      if (!p.live) { tx = Math.cos(now / 2300) * .5; ty = Math.sin(now / 1700) * .28; }
      cx = lerp(cx, tx, .09); cy = lerp(cy, ty, .09);
      wrap.style.setProperty('--px', cx.toFixed(3));
      wrap.style.setProperty('--py', cy.toFixed(3));
      if (critter) {
        const t = (now % 2200) / 2200, hop = Math.abs(Math.sin(t * Math.PI * 2)) * 13;
        critter.style.transform = 'translate(' + (cx * 13).toFixed(1) + 'px,' + (-hop).toFixed(1) + 'px) scaleY(' +
          (1 + hop * .012).toFixed(3) + ')';
      }
    });
  }

  /* ---- 5. 滚动环绕 ---- */
  function orbit(stage) {
    const sc = scrollBox(stage), fig = $('.ob-fig', stage), val = $('.ob-val', stage), sh = $('.ob-sh', stage);
    const upd = function () {
      const p = sc.prog(), a = p * P(stage, 'tn', 1) * 360;
      if (fig) fig.style.transform = 'rotateX(-14deg) rotateY(' + a.toFixed(1) + 'deg)';
      if (sh) sh.style.transform = 'scaleX(' + (0.8 + Math.abs(Math.cos(a * Math.PI / 180)) * .3).toFixed(3) + ')';
      if (val) val.textContent = Math.round(a % 360) + '°';
    };
    onScroll(stage, sc.box, upd);
  }

  /* ---- 6. 悬停绽放（CSS 过渡驱动，JS 只维护 open 态） ---- */
  function bloom(stage) {
    const wrap = $('.cp-bloom', stage);
    if (!wrap) return;
    wrap.addEventListener('pointerenter', function () { wrap.classList.add('open'); });
    wrap.addEventListener('pointerleave', function (e) {
      /* 触屏没有 hover，抬手就撤会把展开闪成一条缝 */
      if (e.pointerType && e.pointerType !== 'mouse') return;
      wrap.classList.remove('open');
    });
    /* 键盘没有 hover：Enter/空格走 click */
    stage.addEventListener('click', function () { wrap.classList.toggle('open'); });
  }

  /* ---- 7. 涡旋穿隧 ---- */
  function vortex(stage) {
    const sc = scrollBox(stage), rings = $$('.vx-r', stage), core = $('.vx-core', stage),
      streaks = $$('.vx-st', stage), field = $('.vx-field', stage);
    const upd = function () {
      const p = sc.prog(), N = rings.length, DEEP = 900;
      /* 每层沿 -Z 往回抽，取模让它循环回远处：相机不动也能读出「往前飞」 */
      rings.forEach(function (el, i) {
        const t = (p * P(stage, 'sp', 1.7) + i / N) % 1;
        const z = -DEEP * (1 - t * t);
        el.style.transform = 'translateZ(' + z.toFixed(1) + 'px) rotate(' + (t * 46 + i * 9).toFixed(1) + 'deg)';
        el.style.opacity = String(Math.sin(t * Math.PI) * .9);
      });
      streaks.forEach(function (el, i) {
        const t = (p * P(stage, 'sp', 1.7) * 1.6 + i / streaks.length) % 1;
        el.style.transform = 'rotate(' + (i * 30) + 'deg) translateY(-' + (18 + t * 150).toFixed(0) + 'px) scaleY(' + (0.4 + t * 1.5).toFixed(2) + ')';
        el.style.opacity = String(Math.sin(t * Math.PI) * .55);
      });
      if (field) field.style.transform = 'rotateZ(' + (p * 26).toFixed(2) + 'deg)';
      if (core) core.style.transform = 'scale(' + (1 + p * .9).toFixed(3) + ')';
    };
    onScroll(stage, sc.box, upd);
  }

  /* ---- 8. 点击漂浮生长 ---- */
  function floatGrow(stage) {
    /* 沉浸式漂浮生长：点击即种——茎秆描边生长、叶片错峰舒展，整株随风摇曳；
       孢子常驻漂浮，种满 7 株后最旧的淡出回收 */
    const field = $('.im-field', stage);
    if (!field) return;
    let count = 0;
    const PLANT = '<svg viewBox="0 0 60 110" class="im-plant">' +
      '<path class="im-stem" d="M30 110 C 30 78 26 60 30 34"/>' +
      '<path class="im-stem s2" d="M30 84 C 38 74 44 70 50 64"/>' +
      '<path class="im-stem s3" d="M30 66 C 22 56 18 52 12 46"/>' +
      '<ellipse class="im-leaf" cx="50" cy="62" rx="9" ry="4.6" transform="rotate(-24 50 62)"/>' +
      '<ellipse class="im-leaf" cx="12" cy="44" rx="8" ry="4.2" transform="rotate(-28 12 44)"/>' +
      '<circle class="im-bud" cx="30" cy="30" r="7"/><circle class="im-budin" cx="30" cy="30" r="3"/></svg>';
    stage.addEventListener('click', function (e) {
      if (e.target.closest('.cp-cap')) return;
      const r = field.getBoundingClientRect();
      if (!r.width) return;
      const host = document.createElement('i');
      host.className = 'im-pt';
      host.style.left = clamp(e.clientX - r.left, 26, r.width - 26) + 'px';
      host.style.top = (r.height * (0.7 + Math.random() * .18)).toFixed(0) + 'px';
      host.style.setProperty('--d', (2.8 + Math.random() * 1.6).toFixed(2) + 's');
      host.innerHTML = PLANT;
      field.appendChild(host);
      host.querySelectorAll('.im-stem').forEach(function (s) {
        const len = s.getTotalLength ? s.getTotalLength() : 80;
        s.style.strokeDasharray = len; s.style.strokeDashoffset = len;
        requestAnimationFrame(function () {
          s.style.transition = 'stroke-dashoffset .72s cubic-bezier(.16,1,.3,1)';
          s.style.strokeDashoffset = '0';
        });
      });
      host.querySelectorAll('.im-leaf,.im-bud,.im-budin').forEach(function (el, i) {
        if (!el.animate || !window.ENGINE.motionOn()) return;
        el.animate([
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1.26)', opacity: 1, offset: .7 },
          { transform: 'scale(1)', opacity: 1 }
        ], { duration: 430, delay: 300 + i * 95, easing: E.EMP, fill: 'backwards' });
      });
      count++;
      if (count > 7) {
        const first = field.firstElementChild;
        if (first) { first.style.opacity = '0'; first.style.transition = 'opacity .5s'; setTimeout(function () { first.remove(); }, 520); }
      }
    });
  }

  /* ---- 9. 旋流光螺旋 ---- */
  function helix(stage) {
    const wrap = $('.cp-hx', stage), items = $$('.hx-i', stage), N = items.length;
    let phase = 0, vel = 0, drag = null, cx = 0, cy = 0;
    stage.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, p: phase };
      stage.setPointerCapture && stage.setPointerCapture(e.pointerId);
      stage.classList.add('grabbing');
    });
    stage.addEventListener('pointermove', function (e) {
      const r = stage.getBoundingClientRect();
      cx = ((e.clientX - r.left) / r.width - .5) * 2; cy = ((e.clientY - r.top) / r.height - .5) * 2;
      if (!drag) return;
      const d = (e.clientX - drag.x) * .012;
      phase = drag.p + d; vel = d * .35;
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      stage.addEventListener(ev, function () { drag = null; stage.classList.remove('grabbing'); });
    });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') vel -= .05;
      else if (e.key === 'ArrowRight') vel += .05;
    });
    watch(stage, function () {
      if (!drag) { phase += P(stage, 'sp', 6) / 1000 + vel; vel *= .94; }
      const R = Math.min(P(stage, 'rr', 104), (stage.clientWidth || 300) * .36);
      items.forEach(function (el, i) {
        const a = phase + i * (Math.PI * 2 / N), depth = Math.cos(a);
        el.style.transform = 'translate(' + (Math.sin(a) * R + cx * 6).toFixed(1) + 'px,' +
          (((i - (N - 1) / 2) * 13 + depth * 11) + cy * 4).toFixed(1) + 'px) scale(' +
          (.68 + (depth + 1) / 2 * .52).toFixed(3) + ')';
        el.style.opacity = String(.3 + (depth + 1) / 2 * .7);
        el.style.zIndex = String(Math.round(100 + depth * 50));
      });
    });
  }

  /* ---- 10. 光标辉光流转 ---- */
  function luminous(stage) {
    const wrap = $('.cp-lf', stage), scene = $('.lf-scene', stage);
    const p = { x: .5, y: .5, live: 0 };
    let lx = .5, ly = .5, spd = 0, fog = 0, zoom = 0, lastX = .5, lastY = .5;
    stage.addEventListener('pointermove', function (e) {
      const r = stage.getBoundingClientRect();
      p.x = clamp((e.clientX - r.left) / r.width, 0, 1);
      p.y = clamp((e.clientY - r.top) / r.height, 0, 1);
      p.live = 1;
    });
    stage.addEventListener('pointerleave', function () { p.live = 0; });
    watch(stage, function (now) {
      let tx = p.x, ty = p.y;
      if (!p.live) { tx = .5 + Math.cos(now / 2600) * .3; ty = .42 + Math.sin(now / 1900) * .16; }
      spd = Math.min(1, spd * .9 + Math.hypot(tx - lastX, ty - lastY) * P(stage, 'g', 9) * .1);
      lastX = tx; lastY = ty;
      lx = lerp(lx, tx, .12); ly = lerp(ly, ty, .12);
      fog = lerp(fog, spd, .05); zoom = lerp(zoom, p.live ? .5 : 0, .04);
      wrap.style.setProperty('--lx', (lx * 100).toFixed(2) + '%');
      wrap.style.setProperty('--ly', (ly * 100).toFixed(2) + '%');
      wrap.style.setProperty('--fog', fog.toFixed(3));
      wrap.style.setProperty('--zoom', zoom.toFixed(3));
      if (scene) scene.style.transform = 'scale(' + (1 + zoom * P(stage, 'bz', 6) / 100).toFixed(4) + ') translate(' +
        ((.5 - lx) * zoom * 10).toFixed(2) + 'px,' + ((.5 - ly) * zoom * 8).toFixed(2) + 'px)';
    });
  }

  /* ---- 11. 光标聚光揭示 ---- */
  function spotlight(stage) {
    const wrap = $('.cp-sp', stage), cap = $('.cp-cap', stage);
    const p = { x: .5, y: .5, live: 0 };
    let cx = .5, cy = .5;
    pointerPct(stage, p);
    watch(stage, function (now) {
      let tx = p.x, ty = p.y;
      if (!p.live) { tx = .5 + Math.cos(now / 1900) * .3; ty = .5 + Math.sin(now / 1400) * .22; }
      cx = lerp(cx, tx, .14); cy = lerp(cy, ty, .14);
      wrap.style.setProperty('--lx', (cx * 100).toFixed(1) + '%');
      wrap.style.setProperty('--ly', (cy * 100).toFixed(1) + '%');
      if (cap) cap.textContent = 'x ' + Math.round(cx * 100) + '% · y ' + Math.round(cy * 100) + '%';
    });
  }

  /* ---- 12. 光标拖尾 ---- */
  function trail(stage) {
    const dots = $$('.tr-d', stage);
    const p = { x: .5, y: .5, live: 0 };
    const pos = dots.map(function () { return { x: .5, y: .5 }; });
    pointerPct(stage, p);
    watch(stage, function (now) {
      let tx = p.x, ty = p.y;
      if (!p.live) { tx = .5 + Math.cos(now / 1500) * .34; ty = .5 + Math.sin(now / 900) * .26; }
      const W = stage.clientWidth || 200, H = stage.clientHeight || 140;
      let ax = tx, ay = ty;
      pos.forEach(function (d, i) {
        /* 后面的节点跟得更慢，链条才会拉开；统一 lerp 会把整串粒子挤成一个点。 */
        const dc = Math.max(.035, P(stage, 'dc', .28) * Math.pow(.78, i));
        d.x = lerp(d.x, ax, dc); d.y = lerp(d.y, ay, dc);
        ax = d.x; ay = d.y;
        const s = 1 - i / dots.length * .74;
        dots[i].style.transform = 'translate(' + (d.x * W - W / 2).toFixed(1) + 'px,' +
          (d.y * H - H / 2).toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
        dots[i].style.opacity = String((s * .95).toFixed(3));
      });
    });
  }

  /* ---- 13 / 14. 悬停类：CSS :hover 兜鼠标，click 兜键盘 ---- */
  function hoverToggle(stage, sel) {
    const el = $(sel, stage);
    if (!el) return;
    stage.addEventListener('click', function () { el.classList.toggle('open'); });
  }

  /* ---- 15. 滚动转横向位移 ---- */
  function hscroll(stage) {
    const sc = scrollBox(stage), track = $('.hs-track', stage), cells = $$('.hs-c', stage);
    const upd = function () {
      /* 原来直接拿 scrollWidth 减舞台宽：面板总宽一旦不超过视口，span 就是 0，行程当场消失。
         改成按「末块右缘 − 视口右缘」算，再保底多推一块的宽度。 */
      const vw = stage.clientWidth || 200;
      const last = cells.length ? cells[cells.length - 1].getBoundingClientRect() : null;
      const base = last ? (last.right - track.getBoundingClientRect().left) : (track.scrollWidth || 420);
      const span = Math.max(vw * 0.6, base - vw + 24);
      track.style.transform = 'translateX(' + (-sc.prog() * span * P(stage, 'sk', 100) / 100).toFixed(1) + 'px)';
      const hint = $('.hs-hint', stage);
      if (hint) hint.style.opacity = String(1 - Math.min(1, sc.prog() * 4));
    };
    onScroll(stage, sc.box, upd);
  }

  /* ---- 16. 滚动抽帧 ---- */
  function frames(stage) {
    const sc = scrollBox(stage), val = $('.fr-val', stage), pin = $('.fr-pin', stage);
    const photo = $('.fr-photo', stage), clock = $('.fr-time', stage), seek = $('.fr-seek', stage), ticks = $('.fr-ticks', stage);
    const host = stage.closest('.term--detail'), readout = host && $('.fr-readout', host), contact = readout ? $$('.fr-contact > button', readout) : [];
    let count = 0, marks = [];
    const upd = function () {
      const N = Math.max(2, Math.round(P(stage, 'nf', 24)));
      const f = Math.round(sc.prog() * (N - 1)), sampled = f / (N - 1);
      const english = window.I18N && window.I18N.lang === 'en';
      $('.fr-stamp', stage).textContent = english ? 'FRAME / LIGHT JOURNAL' : '逐帧 · 光影手记';
      $('.fr-track-head > span', stage).textContent = english ? 'Scroll to browse · drag to seek' : '滚轮浏览 · 拖动选帧';
      photo.alt = english ? 'A photograph sampled frame by frame as you scroll' : '随滚动逐帧横摇的摄影画面';
      photo.style.transform = 'translateX(' + ((.5 - sampled) * 18).toFixed(2) + '%) scale(1.22)';
      if (count !== N) {
        count = N;
        ticks.innerHTML = rep(N, () => '<s></s>');
        ticks.style.gridTemplateColumns = 'repeat(' + N + ',1fr)';
        marks = $$('.fr-ticks > s', stage);
        seek.max = String(N - 1);
        contact.forEach((el, i) => {
          el.hidden = i >= N;
          if (i < N) el.style.setProperty('--frame-shift', ((.5 - i / (N - 1)) * 18).toFixed(2) + '%');
        });
      }
      seek.value = String(f);
      seek.setAttribute('aria-label', english ? 'Select image frame' : '选择画面帧');
      seek.setAttribute('aria-valuetext', english ? 'Frame ' + (f + 1) + ' of ' + N : '第 ' + (f + 1) + ' 帧，共 ' + N + ' 帧');
      marks.forEach((el, i) => el.classList.toggle('passed', i <= f));
      if (clock) clock.textContent = '00:00:' + String(f).padStart(2, '0');
      pin.style.setProperty('--frame-progress', sampled.toFixed(4));
      pin.dataset.frame = String(f);
      if (val) val.textContent = 'f ' + String(f + 1).padStart(2, '0') + '/' + N;
      if (readout) {
        const progress = Math.round(sc.prog() * 100);
        $('[data-fr-out="frame"]', readout).textContent = String(f + 1).padStart(2, '0');
        $('[data-fr-out="total"]', readout).textContent = '/' + N;
        $('[data-fr-out="progress"]', readout).textContent = progress + '%';
        $('[data-fr-out="samples"]', readout).textContent = (100 / (N - 1)).toFixed(1) + '%';
        $('[data-fr-out="track"]', readout).style.transform = 'scaleX(' + (progress / 100).toFixed(3) + ')';
        $('[data-fr-out="sheet"]', readout).textContent = N;
        contact.forEach((el, i) => {
          const on = i < N && i === f;
          el.classList.toggle('on', on);
          el.setAttribute('aria-current', on ? 'true' : 'false');
          el.setAttribute('aria-label', english ? 'Go to frame ' + (i + 1) : '跳到第 ' + (i + 1) + ' 帧');
        });
      }
    };
    const selectFrame = function (index) {
      const max = sc.box.scrollHeight - sc.box.clientHeight;
      sc.box.scrollTo({ top: clamp(index / Math.max(1, count - 1), 0, 1) * max, behavior: 'instant' });
      upd(); // Direct manipulation and the image share one sample, with no trailing ease.
    };
    seek.addEventListener('input', () => selectFrame(Number(seek.value)));
    seek.addEventListener('click', e => e.stopPropagation());
    seek.addEventListener('keydown', e => e.stopPropagation());
    contact.forEach((el, i) => el.addEventListener('click', () => selectFrame(i)));
    onScroll(stage, sc.box, upd);
  }

  /* ---- 17. 钉住双栏 ---- */
  function twoCol(stage) {
    const sc = scrollBox(stage), steps = $$('.tc-s', stage), n = $('.tc-n', stage), t = $('.tc-t', stage);
    let cur = -1;
    const upd = function () {
      const threshold = sc.box.getBoundingClientRect().top + sc.box.clientTop + 4;
      let idx = 0;
      steps.forEach(function (el, i) { if (el.getBoundingClientRect().top <= threshold + .5) idx = i; });
      steps.forEach(function (el, i) { el.classList.toggle('on', i === idx); });
      if (idx === cur || !steps[idx]) return;
      cur = idx;
      n.textContent = '0' + (idx + 1); t.textContent = steps[idx].dataset.t;
      const im = $('.tc-img', stage), src = steps[idx].dataset.img;
      if (im && src && im.dataset.cur !== src) {
        im.dataset.cur = src; im.src = 'assets/img/' + src;
        if (im.animate && window.ENGINE.motionOn()) im.animate([{ opacity: .25, transform: 'scale(1.07)' }, { opacity: 1, transform: 'none' }], { duration: 460, easing: E.EO });
      }
      if (window.ENGINE.motionOn() && n.animate) {
        n.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: E.EO });
        t.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: E.EO });
      }
    };
    onScroll(stage, sc.box, upd);
  }

  /* ---- 18. 滚动主题渐变 ---- */
  function themeMorph(stage) {
    const sc = scrollBox(stage), pin = $('.tm-pin', stage), hex = $('.tm-hex', stage);
    const hd = $('.tm-hd', stage), sw = $$('.tm-sw k', stage), dots = $$('.tm-dots b', stage);
    const STOPS = [[243, 237, 247, 29, 27, 32], [208, 188, 255, 42, 24, 84], [127, 213, 218, 6, 28, 32], [242, 184, 197, 48, 18, 34]];
    const NAMES = ['第一章', '第二章', '第三章', '第四章'];
    const hexOf = function (c) { return '#' + c.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('').toUpperCase(); };
    const upd = function () {
      const p = sc.prog() * (STOPS.length - 1), i = Math.min(STOPS.length - 2, Math.floor(p)), t = p - i;
      const c = STOPS[i].map(function (v, k) { return Math.round(lerp(v, STOPS[i + 1][k], t)); });
      pin.style.background = 'rgb(' + c.slice(0, 3).join(',') + ')';
      pin.style.color = 'rgb(' + c.slice(3).join(',') + ')';
      if (hex) hex.textContent = hexOf(c.slice(0, 3));
      /* 三块色卡就是当前插值出的 surface / primary / on-surface，令牌跟着一起变形 */
      if (sw.length === 3) {
        sw[0].style.background = 'rgb(' + c.slice(0, 3).join(',') + ')';
        sw[1].style.background = 'rgb(' + c.slice(3).join(',') + ')';
        sw[2].style.background = 'rgb(' + STOPS[i][0] + ',' + STOPS[i + 1][1] + ',' + STOPS[i][2] + ')';
      }
      if (hd) { const n = NAMES[Math.round(p)]; if (hd.textContent !== n) hd.textContent = n; }
      dots.forEach(function (d, k) { d.classList.toggle('on', k === Math.round(p)); });
    };
    onScroll(stage, sc.box, upd);
  }

  /* ---- 19. 滚动进度环 ---- */
  function progressRing(stage) {
    const sc = scrollBox(stage), fg = $('.rg-fg', stage), v = $('.rg-v', stage);
    const C = 2 * Math.PI * 32;
    fg.style.strokeDasharray = String(C);
    const upd = function () {
      const p = sc.prog();
      fg.style.strokeDashoffset = String(C * (1 - p));
      v.textContent = Math.round(p * 100) + '%';
    };
    onScroll(stage, sc.box, upd);
  }

  /* ---- 20. FAB 展开面板 ---- */
  function fab(stage) {
    const el = $('.fb', stage), rows = $$('.fb-rows > u', stage), sheet = $('.cp-fab', stage);
    const toggle = function () {
      const on = el.classList.toggle('open');
      sheet.classList.toggle('open', on);
      rows.forEach(function (r, i) { r.style.transitionDelay = (on ? 130 + i * 65 : 0) + 'ms'; });
    };
    stage.addEventListener('click', toggle);
  }

  /* ---- 21. 按钮三态形变 ---- */
  function triState(stage) {
    const btn = $('.tb', stage), lbl = $('.tb-lbl', stage), nodes = $$('.ts-flow i', stage);
    let busy = false;
    const mark = function (st) {
      nodes.forEach(function (n) { n.classList.toggle('on', n.dataset.st === st); });
    };
    const go = function () {
      if (!window.ENGINE.motionOn()) {
        const on = btn.classList.toggle('done');
        lbl.textContent = on ? '已保存' : '保存';
        mark(on ? 'done' : 'idle');
        return;
      }
      if (busy) return;
      busy = true;
      btn.classList.remove('done'); btn.classList.add('load'); lbl.textContent = '处理中';
      mark('load');
      setTimeout(function () { btn.classList.remove('load'); btn.classList.add('done'); lbl.textContent = '已保存'; mark('done'); }, P(stage, 'ld', 1250));
      setTimeout(function () { btn.classList.remove('done'); lbl.textContent = '保存'; mark('idle'); busy = false; }, P(stage, 'ld', 1250) + 1700);
    };
    mark('idle');
    stage.addEventListener('click', go);
  }

  /* ---- 22. 拖拽擦除对比 ---- */
  function compare(stage) {
    const wrap = $('.cp-cp', stage), before = $('.cp-before', stage),
      line = $('.cp-line', stage), hd = $('.cp-hd', stage), cap = $('.cp-cap', stage);
    let x = .5, drag = false;
    const set = function (v) {
      x = clamp(v, 0, 1);
      const pct = Math.round(x * 100);
      if (hd) {
        hd.setAttribute('aria-valuenow', String(pct));
        hd.setAttribute('aria-valuetext', pct + '% ' + (window.I18N && window.I18N.lang === 'en' ? 'original' : '原图'));
      }
      wrap.dataset.wipe = String(Math.round(x * 100));
      wrap.style.setProperty('--wipe', (x * 100).toFixed(1) + '%');
      before.style.clipPath = 'inset(0 ' + ((1 - x) * 100).toFixed(1) + '% 0 0)';
      line.style.left = (x * 100).toFixed(1) + '%';
      if (cap) cap.textContent = (window.I18N && window.I18N.lang === 'en' ? 'Drag to compare · ' : '拖动比较 · ') + pct + '%';
    };
    const from = function (e) {
      const r = wrap.getBoundingClientRect();
      if (r.width) set((e.clientX - r.left) / r.width);
    };
    wrap.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button !== 0) return;
      e.preventDefault();
      drag = true;
      if (wrap.setPointerCapture) { try { wrap.setPointerCapture(e.pointerId); } catch (err) {} }
      from(e);
    });
    wrap.addEventListener('pointermove', function (e) { if (drag) from(e); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { wrap.addEventListener(ev, function () { drag = false; }); });
    hd.addEventListener('keydown', function (e) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault(); e.stopPropagation();
      if (e.key === 'Home') set(0);
      else if (e.key === 'End') set(1);
      else set(x + (e.key === 'ArrowRight' ? .05 : -.05));
    });
    set(.5);
  }

  /* ---- 23. 逐行遮罩揭示 ---- */
  function lineMask(stage) {
    const sc = scrollBox(stage), lines = $$('.lm-line > s', stage), rule = $('.lm-rule', stage);
    const upd = function () {
      const p = sc.prog(), gap = P(stage, 'gp', 13) / 100;
      lines.forEach(function (el, i) {
        const t = clamp((p - i * gap) / .34, 0, 1), e = 1 - Math.pow(1 - t, 3);
        /* 首行完整可读，其余三行按滚动进度从各自蒙版揭示。 */
        const lead = i === 0 ? 1 : 0;
        const eased = lead + (1 - lead) * e;
        el.style.transform = 'translateY(' + ((1 - eased) * 100).toFixed(2) + '%)';
        el.style.opacity = String(.12 + eased * .88);
      });
      if (rule) rule.style.transform = 'scaleX(' + clamp(p * 1.6, 0, 1).toFixed(3) + ')';
    };
    onScroll(stage, sc.box, upd);
  }

  /* ---- 24. 滚动速度倾斜跑马灯 ---- */
  function velocitySkew(stage) {
    const sc = scrollBox(stage), rows = $$('.vs-row', stage), out = $('.vs-v', stage);
    rows.forEach(function (r) { r.innerHTML += r.innerHTML; });   /* 复制一份才能无缝循环 */
    let last = sc.box.scrollTop, vel = 0, x = 0;
    sc.box.addEventListener('scroll', function () {
      const d = sc.box.scrollTop - last; last = sc.box.scrollTop;
      vel = lerp(vel, clamp(d * .5, -30, 30), .3);
    }, { passive: true });
    watch(stage, function () {
      vel *= .93;
      x -= .6 + Math.abs(vel) * .55;
      rows.forEach(function (r, i) {
        const gap = parseFloat(getComputedStyle(r).columnGap) || 10;
        const w = ((r.scrollWidth || 600) + gap) / 2;
        const off = (((i ? -x : x) % w) + w) % w;
        r.style.transform = 'translateX(' + (-off).toFixed(1) + 'px) skewX(' + (vel * P(stage, 'sk', 34) / 100 * (i ? -1 : 1)).toFixed(2) + 'deg)';
      });
      if (out) out.textContent = (vel / 10).toFixed(2);
    });
  }

  /* ---- 25. 光标邻近点亮网格 ---- */
  function proximityGlow(stage) {
    const grid = $('.pg-grid', stage), tiles = $$('.pg-t', stage);
    const p = { x: .5, y: .5, live: 0 };
    let cx = .5, cy = .5;
    pointerPct(stage, p);
    watch(stage, function (now) {
      let tx = p.x, ty = p.y;
      if (!p.live) { tx = .5 + Math.cos(now / 2100) * .32; ty = .5 + Math.sin(now / 1500) * .28; }
      const sm = P(stage, 'sm', 12) / 100;
      cx = lerp(cx, tx, sm); cy = lerp(cy, ty, sm);
      const W = grid.clientWidth || 300, H = grid.clientHeight || 180, R = P(stage, 'r', 42) / 100;
      tiles.forEach(function (el, i) {
        const col = i % 7, row = (i / 7) | 0;
        const d = Math.hypot(cx - (col + .5) / 7, (cy - (row + .5) / 5) * (H / W));
        el.style.setProperty('--k', Math.pow(Math.max(0, 1 - d / R), 2).toFixed(3));
      });
    });
  }

  /* ---- 26. 液态黏附跟随 ---- */
  function liquidFollow(stage) {
    const drop = $('.lb-drop', stage), trail = $('.lb-trail', stage);
    const p = { x: .5, y: .5, live: 0 };
    let x = .5, y = .5, px = .5, py = .5, tx2 = .5, ty2 = .5;
    pointerPct(stage, p);
    watch(stage, function (now) {
      let tx = p.x, ty = p.y;
      if (!p.live) { tx = .5 + Math.cos(now / 1700) * .3; ty = .5 + Math.sin(now / 1250) * .26; }
      const k = P(stage, 'sm', 14) / 100;
      px = x; py = y;
      x = lerp(x, tx, k); y = lerp(y, ty, k);
      tx2 = lerp(tx2, tx, k * .45); ty2 = lerp(ty2, ty, k * .45);
      const W = stage.clientWidth || 300, H = stage.clientHeight || 200;
      const vx = (x - px) * W, vy = (y - py) * H;
      const m = Math.min(1, Math.hypot(vx, vy) / P(stage, 'sx', 18));
      const a = Math.atan2(vy, vx) * 180 / Math.PI;
      const t = 'translate(' + ((x - .5) * W).toFixed(1) + 'px,' + ((y - .5) * H).toFixed(1) + 'px) rotate(' +
        a.toFixed(1) + 'deg) scale(' + (1 + m * .55).toFixed(3) + ',' + (1 - m * .38).toFixed(3) + ')';
      drop.style.transform = t;
      if (trail) trail.style.transform = 'translate(' + ((tx2 - .5) * W).toFixed(1) + 'px,' + ((ty2 - .5) * H).toFixed(1) + 'px)';
    });
  }

  /* ---- 27. 滚动驱动图表生长 ---- */
  function chartBuild(stage) {
    const sc = scrollBox(stage), line = $('.cb-line', stage), area = $('.cb-area', stage),
      bars = $$('.cb-bars > s', stage), v = $('.cb-v', stage);
    let L = 400;
    const upd = function () {
      const p = sc.prog();
      if (line) line.style.strokeDashoffset = String(L * (1 - p));
      if (area) area.style.clipPath = 'inset(0 ' + ((1 - p) * 100).toFixed(1) + '% 0 0)';
      bars.forEach(function (el, i) {
        const t = clamp((p - i / bars.length * .55) / .4, 0, 1);
        el.style.transform = 'scaleY(' + (.06 + (1 - Math.pow(1 - t, 3)) * .94).toFixed(3) + ')';
      });
      if (v) v.textContent = Math.round(p * P(stage, 'mx', 128)) + 'k';
    };
    const measure = function () {
      if (line && line.getTotalLength) {
        L = line.getTotalLength();
        line.style.strokeDasharray = String(L);
      }
      upd();
    };
    // The shared scroll observer is disposed when a preview is shuffled away.
    onScroll(stage, sc.box, measure);
  }

  /* ---- 28. 悬停联动预览卡 ---- */
  function previewFollow(stage) {
    const card = $('.pf-card', stage), thumb = $('.pf-thumb', stage), name = $('.pf-name', stage);
    const thumbImg = $('img', thumb);
    const rows = $$('.pf-row', stage);
    const p = { x: .72, y: .5, live: 0 };
    let x = .72, y = .5, px = .72;
    pointerPct(stage, p);
    rows.forEach(function (r) {
      const select = function () {
        rows.forEach(function (o) { o.classList.toggle('on', o === r); o.setAttribute('aria-pressed', String(o === r)); });
        name.textContent = r.querySelector('em').textContent;
        /* 缩略图换成悬停行自己的照片，而不是换一层渐变色 */
        const pic = r.dataset.img;
        if (pic && thumbImg && thumbImg.getAttribute('src') !== IMG(pic)) {
          thumbImg.src = IMG(pic);
          if (thumb.animate && window.ENGINE.motionOn()) {
            thumb.animate([{ transform: 'scale(.7) rotate(-6deg)' }, { transform: 'scale(1)' }], { duration: 380, easing: E.EMP });
          }
        }
      };
      r.addEventListener('pointerenter', select);
      r.addEventListener('focus', select);
      r.addEventListener('click', select);
    });
    watch(stage, function () {
      const W = stage.clientWidth || 300, H = stage.clientHeight || 200;
      px = x;
      const sm = P(stage, 'sm', 16) / 100;
      x = lerp(x, p.live ? p.x : .72, sm); y = lerp(y, p.live ? p.y : .5, sm);
      /* 位移收在列表右侧空白区里，并且按卡片自己的布局位置夹一次：
         不夹的话光标贴到右缘时，预览卡会直接顶出舞台（实测溢出 33px） */
      const room = Math.max(0, W - card.offsetLeft - card.offsetWidth - 6), back = Math.max(0, card.offsetLeft - 6);
      const dx = clamp((x - .5) * W * .16, -back, room);
      card.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + ((y - .5) * H * .3).toFixed(1) +
        'px) rotate(' + clamp((x - px) * 90, -7, 7).toFixed(2) + 'deg)';
      card.style.opacity = p.live ? '1' : '.5';
    });
  }

  /* ---- 29. 速度抛掷丢弃 ---- */
  function throwDismiss(stage) {
    const deck = $('.th-deck', stage);
    let cards = $$('.th-c', stage), drag = null;
    const layout = function () {
      cards.forEach(function (c, i) {
        c.style.zIndex = String(40 - i);
        c.style.transform = 'translateY(' + (i * 14) + 'px) scale(' + (1 - i * .055) + ')';
        c.style.opacity = String(1 - i * .3);
      });
    };
    stage.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, y: e.clientY, dx: 0, vx: 0, lx: 0, c: cards[0] };
      if (!drag.c) return;
      drag.c.style.transition = 'none';
      if (stage.setPointerCapture) { try { stage.setPointerCapture(e.pointerId); } catch (err) {} }
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.vx = dx - drag.lx; drag.lx = dx; drag.dx = dx;
      drag.c.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + (dy * .3 + Math.abs(dx) * .05).toFixed(1) +
        'px) rotate(' + (dx * P(stage, 'rot', 7) / 100).toFixed(2) + 'deg)';
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      stage.addEventListener(ev, function () {
        if (!drag) return;
        const c = drag.c, dx = drag.dx, vx = drag.vx;
        drag = null;
        const fly = Math.abs(dx) > 88 || Math.abs(vx) > 20;
        if (!fly) { c.style.transition = ''; c.style.transform = ''; layout(); return; }
        if (!window.ENGINE.motionOn() || !c.animate) { cards.push(cards.shift()); layout(); return; }
        const dir = dx > 0 ? 1 : -1;
        c.animate([
          { transform: c.style.transform, opacity: 1 },
          { transform: 'translate(' + dir * 460 + 'px,-70px) rotate(' + dir * 46 + 'deg)', opacity: 0 }
        ], { duration: 440, easing: 'cubic-bezier(0.32,0,0.67,0)' }).onfinish = function () {
          cards.push(cards.shift());
          layout();
        };
      });
    });
    layout();
  }

  /* ---- 30. 乱码解码揭示 ---- */
  function scrambleDecode(stage) {
    const txt = $('.sc-txt', stage), sub = $('.sc-sub', stage), bar = $('.sc-bar > i', stage);
    const GL = '▚▞░▒█ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@*<>';
    const run = function (el) {
      if (!stage.isConnected) return;
      const target = el.dataset.t, n = target.length;
      if (!window.ENGINE.motionOn()) { el.textContent = target; return; }
      const lock = [];
      for (let i = 0; i < n; i++) lock[i] = 5 + i * P(stage, 'sp', 2.2) + Math.random() * 9;
      let f = 0;
      const tick = function () {
        if (!stage.isConnected) return;
        let out = '', done = 0;
        for (let i = 0; i < n; i++) {
          if (target[i] === ' ') { out += ' '; done++; continue; }
          if (f >= lock[i]) { out += target[i]; done++; } else out += GL[(Math.random() * GL.length) | 0];
        }
        el.textContent = out;
        if (bar) bar.style.transform = 'scaleX(' + (done / n).toFixed(3) + ')';
        if (done < n) { f++; el._raf = requestAnimationFrame(tick); }
      };
      cancelAnimationFrame(el._raf || 0);
      tick();
    };
    sub.dataset.t = window.I18N.lang === 'en' ? 'Give motion a name' : '把感觉说成术语';
    let subTimer;
    const go = function () {
      clearTimeout(subTimer);
      cancelAnimationFrame(sub._raf || 0);
      run(txt);
      subTimer = setTimeout(function () { run(sub); }, 240);
    };
    stage.addEventListener('click', go);
    go();
  }

  /* ---- 31. 反向图带：同一份进度，两行反向、不同速 ---- */
  function rail(stage) {
    const sb = scrollBox(stage);
    const rows = $$('.rl-row', stage);
    onScroll(stage, sb.box, function () {
      const p = sb.prog();
      rows.forEach(function (row, i) {
        const span = row.scrollWidth / 2 || 1;    /* 内容补了一份，折半即无缝周期 */
        const sp = P(stage, i ? 'spb' : 'spa', i ? .62 : 1);
        const m = (p * span * sp) % span;
        /* a 行向左；b 行从 -span 走到 0，视觉向右且慢一档 */
        row.style.transform = i ? 'translate3d(' + (m - span).toFixed(1) + 'px,0,0)'
          : 'translate3d(' + (-m).toFixed(1) + 'px,0,0)';
      });
    });
  }

  /* ---- 32. 纵深隧道：滚动平移相机 z，scale = d/(d+rel) ---- */
  function tunnel(stage) {
    const sb = scrollBox(stage);
    const cards = $$('.tn-c', stage);
    const GAP = 150, F = 320, N = cards.length;
    const space = $('.tn-space', stage);
    const total = N * GAP;
    const paint = function () {
      const cam = sb.prog() * total * P(stage, 'lp', 1);   /* 行程>1 时多穿一圈再绕回 */
      /* 每张图一条车道：横向偏移随远近（scale）同步外扩，近的飞向两边，隧道才读得出宽度 */
      const laneX = space.clientWidth * .32, laneY = space.clientHeight * .22;
      const LX = [-1, 1, -.45, .45, -1.2, 1.2, 0];
      const LY = [-.3, .35, -1, 1, .4, -.5, 0];
      cards.forEach(function (c, i) {
        /* 归一到 (-GAP/2, total-GAP/2)：过身的图从最远处绕回 */
        let rel = ((((i + .8) * GAP - cam) % total) + total + GAP / 2) % total - GAP / 2;
        const s = F / (F + Math.max(rel, -60));
        c.style.transform = 'translate(' + (LX[i % 7] * laneX * s).toFixed(1) + 'px,' + (LY[i % 7] * laneY * s).toFixed(1) +
          'px) scale(' + s.toFixed(3) + ')';
        /* 衰放缓一点，远处主要靠 brightness 压暗，别把卡片藏没 */
        c.style.opacity = rel < 30 ? String(Math.max(0, rel / 30))
          : String(clamp(1.3 - rel / (total * .85), .3, 1));
        c.style.zIndex = String(300 - Math.round(rel));
        c.style.filter = rel > 200 ? 'brightness(' + Math.max(.55, 1 - (rel - 200) / 900).toFixed(2) + ')' : '';
      });
    };
    onScroll(stage, sb.box, paint);
  }

  /* ---- 33. 磁吸按钮：距离衰减引力 + 弹簧跟随 ---- */
  function magnetic(stage) {
    const btn = $('.mg-btn', stage);
    let tx = 0, ty = 0, x = 0, y = 0;
    stage.addEventListener('pointermove', function (e) {
      const host = btn.parentElement.getBoundingClientRect();
      if (!host.width || !host.height) return;
      /* 以未变换的容器中心为原点，不能拿正在移动的按钮自身做基准，否则会追着自己跑 */
      const dx = e.clientX - (host.left + host.width / 2), dy = e.clientY - (host.top + host.height / 2);
      const d = Math.hypot(dx, dy), R = P(stage, 'r', 88);
      const pull = d < R ? 1 - d / R : 0;      /* 衰减：力场边界不跳变 */
      tx = dx * .58 * pull; ty = dy * .58 * pull;
    });
    stage.addEventListener('pointerleave', function () { tx = ty = 0; });
    watch(stage, function () {
      x = lerp(x, tx, .18); y = lerp(y, ty, .18);
      btn.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    });
  }

  /* ---- 34. 指针倾斜卡：双轴旋转 + 跟随光斑 ---- */
  function tiltCard(stage) {
    const card = $('.tl-card', stage), glare = $('.tl-glare', stage);
    const p = { x: 0, y: 0, live: 0 };
    pointerNorm(stage, stage, p);   /* pointerNorm 是 (stage, el, out) 三参——之前漏传 el 让 tilt 静默挂掉 */
    let rx = 0, ry = 0;
    watch(stage, function () {
      rx = lerp(rx, p.live ? -p.y * 14 : 0, .14);
      ry = lerp(ry, p.live ? p.x * 16 : 0, .14);
      card.style.transform = 'perspective(700px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      glare.style.opacity = p.live ? '1' : '0';
      glare.style.background = 'radial-gradient(circle at ' + ((p.x + 1) / 2 * 100).toFixed(0) + '% ' +
        ((p.y + 1) / 2 * 100).toFixed(0) + '%, rgba(255,252,244,.42), transparent 62%)';
    });
  }

  /* ---- 35. 数字滚动计数：逐位字带 + 过冲落位 ---- */
  function odometer(stage) {
    const cols = $$('.od-d b', stage);
    if (!cols.length) return;
    /* 右位先滚（delay 0），高位依次 +55ms */
    cols.forEach(function (c, i) { c.style.transitionDelay = ((cols.length - 1 - i) * 55) + 'ms'; });
    let v = 0;
    const paint = function () {
      const s = String(v).padStart(cols.length, '0');
      cols.forEach(function (c, i) { c.style.transform = 'translateY(' + (-(+s[i]) * 10) + '%)'; });
    };
    const go = function () { v = (v + 1 + (Math.random() * 7 | 0)) % 10000; paint(); };
    stage.addEventListener('click', go);
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
    paint();
  }

  /* ---- 36. 五彩纸屑：重力 + 自旋的刚体粒子 ---- */
  function confetti(stage) {
    const field = $('.cf-stage', stage);
    if (!field) return;
    const COLORS = ['var(--accent)', 'var(--accent-2)', 'var(--accent-3)', 'var(--obj-a)', 'var(--ok)', 'var(--ink)'];
    const parts = [];
    stage.addEventListener('click', function (e) {
      if (e.target.closest('.cp-cap')) return;
      const r = field.getBoundingClientRect();
      const x = clamp(e.clientX - r.left, 10, r.width - 10), y = clamp(e.clientY - r.top, 10, r.height / 2);
      for (let i = 0; i < 26; i++) {
        const el = document.createElement('i');
        el.className = 'cf-p';
        el.style.background = COLORS[i % COLORS.length];
        el.style.width = (6 + Math.random() * 7) + 'px';
        el.style.height = (9 + Math.random() * 9) + 'px';
        field.appendChild(el);
        parts.push({
          el: el, x: x, y: y,
          vx: (Math.random() - .5) * 13, vy: -(4.5 + Math.random() * 7),
          r: Math.random() * 360, vr: (Math.random() - .5) * 24
        });
      }
    });
    watch(stage, function () {
      const H = field.clientHeight;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.vy += .34; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        p.el.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) rotate(' + p.r.toFixed(1) + 'deg)';
        if (p.y > H + 30) { p.el.remove(); parts.splice(i, 1); }
      }
    });
  }

  /* ---- 37. 滑动标签指示器：测量目标项 → 公共指示条滑过去 ---- */
  function smoothTabs(stage) {
    const items = $$('.tb2-it', stage), ind = $('.tb2-ind', stage), page = $('.tb2-page span', stage);
    if (!items.length || !ind) return;
    const TXT = ['这是「首页」页签的内容——指示器正在测量我这行字。', '这是「数据」页签的内容——注意指示器带一点过冲。', '这是「我的」页签的内容——布局动画的最小实例。'];
    const move = function (el) {
      ind.style.left = el.offsetLeft + 'px';
      ind.style.width = el.offsetWidth + 'px';
    };
    const activate = function (it, i) {
        if (it.classList.contains('on')) return;
        items.forEach(function (o) {
          const on = o === it;
          o.classList.toggle('on', on);
          o.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        move(it);
        if (page) {
          page.textContent = TXT[i];
          if (page.animate && window.ENGINE.motionOn()) {
            page.animate([{ opacity: 0, transform: 'translateY(7px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: E.EO });
          }
        }
    };
    items.forEach(function (it, i) {
      it.addEventListener('click', function () { activate(it, i); });
      it.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(it, i); }
      });
    });
    move(items[0]);
    if (window.ResizeObserver) new ResizeObserver(function () { move($('.tb2-it.on', stage) || items[0]); }).observe(stage);
  }

  /* ---- 38. 3D 立体轮播：off = i − focus 的纯函数 ---- */
  function coverflow(stage) {
    const cards = $$('.cv-c', stage);
    if (!cards.length) return;
    let focus = 3, sx = null;
    const paint = function () {
      cards.forEach(function (c, i) {
        const off = i - focus, abs = Math.abs(off);
        c.style.transform = 'translateX(' + (off * 44) + '%) translateZ(' + (-abs * 120) + 'px) rotateY(' + (off * -34) + 'deg) scale(' + (1 - abs * .07).toFixed(3) + ')';
        c.style.opacity = abs > 2 ? '0' : String(1 - abs * .2);
        c.style.zIndex = String(30 - abs);
        c.classList.toggle('focus', abs === 0);
      });
    };
    stage.addEventListener('click', function (e) {
      const c = e.target.closest('.cv-c');
      if (!c) return;
      focus = clamp(cards.indexOf(c), 0, cards.length - 1);
      paint();
    });
    stage.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    stage.addEventListener('pointerup', function (e) {
      if (sx == null) return;
      const dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 36) focus = clamp(focus + (dx < 0 ? 1 : -1), 0, cards.length - 1);
      paint();
    });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { focus = clamp(focus + 1, 0, cards.length - 1); paint(); }
      if (e.key === 'ArrowLeft') { focus = clamp(focus - 1, 0, cards.length - 1); paint(); }
    });
    paint();
  }

  /* ---- 39. 圆柱卡带：环形排布 + 惯性 + 速度同源字距 ---- */
  function cylinder(stage) {
    const reel = $('.cy-reel', stage), hd = $('.cy-hd', stage), cards = $$('.cy-c', stage);
    if (!reel || !cards.length) return;
    let rot = 0, vel = 0, spread = 0, drag = null;
    watch(stage, function () {
      if (!drag) {
        rot += vel; vel *= .94;                                   /* 惯性 + 摩擦 */
        spread = lerp(spread, Math.min(1, Math.abs(vel) * .35), .12);
      }
      if (hd) { hd.style.letterSpacing = (3 + spread * 13).toFixed(1) + 'px'; }   /* 拖得快，字被吹散 */
      reel.style.transform = 'rotateY(' + rot.toFixed(2) + 'deg)';
      cards.forEach(function (c, i) {
        const a = (((i * 36 + rot) % 360) + 360) % 360;
        const back = a > 90 && a < 270;
        c.style.opacity = back ? Math.max(0, 1 - Math.abs(a - 180) / 55).toFixed(2) : '1';
        c.style.filter = back ? 'brightness(.55)' : 'none';
      });
    });
    stage.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, r: rot, last: null }; vel = 0;
      if (stage.setPointerCapture) { try { stage.setPointerCapture(e.pointerId); } catch (err) {} }
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag) return;
      rot = drag.r + (e.clientX - drag.x) * .28;
      vel = drag.last == null ? 0 : rot - drag.last;
      drag.last = rot;
      spread = Math.min(1, Math.abs(e.clientX - drag.x) / 240);
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      stage.addEventListener(ev, function () { drag = null; });
    });
  }

  /* ---- 40. 环形画廊：拖拽旋转 + 最短路径对焦 ---- */
  function ringGallery(stage) {
    const ringEl = $('.r3-ring', stage), cards = $$('.r3-c', stage);
    if (!ringEl || !cards.length) return;
    const STEP = 360 / cards.length;
    let rot = 0, vel = 0, goal = null, drag = null;
    const paint = function () {
      ringEl.style.transform = 'rotateY(' + rot.toFixed(2) + 'deg)';
      cards.forEach(function (c, i) {
        const a = (((i * STEP + rot) % 360) + 360) % 360;
        const off = Math.min(a, 360 - a);
        c.style.opacity = Math.max(.22, 1 - off / 130).toFixed(2);
        c.style.filter = 'brightness(' + (1 - off / 240).toFixed(2) + ')';
        c.style.zIndex = String(40 - Math.round(off / 8));
      });
    };
    watch(stage, function () {
      if (drag) return;
      if (goal != null) {
        rot = lerp(rot, goal, .09);
        if (Math.abs(rot - goal) < .15) { rot = goal; goal = null; }
      } else { rot += vel; vel *= .95; }
      paint();
    });
    stage.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, r: rot, last: null, card: e.target.closest('.r3-c') }; vel = 0; goal = null;
      if (stage.setPointerCapture) { try { stage.setPointerCapture(e.pointerId); } catch (err) {} }
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag) return;
      rot = drag.r + (e.clientX - drag.x) * .3;
      vel = drag.last == null ? 0 : rot - drag.last;
      drag.last = rot;
    });
    /* pointercancel 只负责松手复位；pointerup 的对焦判断在下面的专用 handler 里 */
    stage.addEventListener('pointercancel', function () { drag = null; });
    /* setPointerCapture 会把 click 重定向到舞台，卡片永远收不到——
       所以在按下时记录指到的卡，抬起时位移小于 6px 才算「点一下」*/
    stage.addEventListener('pointerup', function (e) {
      if (!drag || Math.abs(e.clientX - drag.x) > 6 || !drag.card) { drag = null; return; }
      const i = cards.indexOf(drag.card);
      drag = null;
      if (i < 0) return;
      const want = ((-i * STEP % 360) + 360) % 360;
      const cur = ((rot % 360) + 360) % 360;
      let d = want - cur;
      if (d > 180) d -= 360; if (d < -180) d += 360;   /* 最短路径 */
      goal = rot + d; vel = 0;
    });
    paint();
  }

  function pageCurl(stage) {
    const host = $('.native-page-book', stage), controller = new AbortController();
    let api = null, pendingReplay = false;
    const english = () => window.I18N.lang === 'en';
    const sync = () => {
      if (!api) return;
      api.setActive(!!window.ENGINE.isVisible(stage) && stage.isConnected && !document.hidden);
      api.setSpeed(stage._speed || 1);
    };
    stage._setActive = sync;
    stage._onTiming = () => { if (api) api.setSpeed(stage._speed || 1); };
    stage._onMotion = on => { if (api) api.setMotion(on); };
    stage._replay = () => { if (api) { api.reset(); api.setMotion(window.ENGINE.motionOn()); if (window.ENGINE.motionOn()) api.step(1); } else pendingReplay = true; };
    stage._dispose = () => { controller.abort(); labels.disconnect(); api = null; };
    const localize = () => {
      const en = english();
      $('[data-book-book]', host).setAttribute('aria-label', en ? 'Drag, scroll or use arrow keys to turn the book' : '拖拽、滚轮或方向键翻书');
      $('.loading', host).textContent = en ? 'Binding the album…' : '正在装订图册…';
      if (api) { api.setLanguage(en); api.refresh(); }
    };
    const labels = new MutationObserver(localize);
    labels.observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang', 'data-theme'] });
    localize();
    window.PAGE_BOOK.create(host, { motion: window.ENGINE.motionOn(), en: english() }, controller).then(book => {
      if (!book || controller.signal.aborted) return;
      api = book; api.setMotion(window.ENGINE.motionOn()); sync(); localize();
      if (pendingReplay) stage._replay();
    }).catch(error => {
      if (controller.signal.aborted) return;
      controller.abort(); labels.disconnect();
      host.querySelector('.loading').hidden = true;
      host.querySelector('.fallback').textContent = english() ? 'The book could not load. Reload to try again.' : '图册未能加载，请刷新页面重试。';
      console.warn('翻书预览加载失败', error);
    });
  }

  function dynamicIsland(stage) {
    const island = $('.di-island', stage), progress = $('.di-progress s', stage);
    if (!island || !progress) return;
    const compact = $('.di-compact', island), compactStatus = $('.di-compact b', island), expandedPanel = $('.di-expanded', island);
    const play = $('.di-play', island), track = $('[data-di-track]', island), artist = $('[data-di-artist]', island);
    const songs = [['Golden Hour', 'JVKE · 今日歌单'], ['Sunset Lover', 'Petit Biscuit · 今日歌单'], ['Daylight', 'David Kushner · 今日歌单']];
    let expanded = false, playing = true, elapsed = 0, last = 0, songIndex = 0, collapseTimer = 0;
    const setExpanded = value => {
      window.clearTimeout(collapseTimer);
      expanded = value;
      if (value) {
        island.classList.remove('is-collapsing');
        island.classList.add('is-expanded');
        expandedPanel.setAttribute('aria-hidden', 'false');
      } else {
        /* 先淡出播放器内容，再缩回胶囊；内容不会被外壳挤压穿过边缘。 */
        island.classList.add('is-collapsing');
        expandedPanel.setAttribute('aria-hidden', 'true');
        collapseTimer = window.setTimeout(() => {
          island.classList.remove('is-expanded', 'is-collapsing');
        }, 150);
      }
      compact.setAttribute('aria-expanded', value ? 'true' : 'false');
      compact.setAttribute('aria-label', (value ? '收起' : '展开') + (playing ? '正在播放' : '已暂停') + '的实时活动');
    };
    const paintPlayer = () => {
      const song = songs[songIndex];
      track.textContent = song[0]; artist.textContent = song[1];
      compactStatus.textContent = playing ? '正在播放' : '已暂停';
      play.textContent = playing ? 'Ⅱ' : '▶';
      play.setAttribute('aria-label', playing ? '暂停' : '继续播放');
      play.setAttribute('aria-pressed', playing ? 'true' : 'false');
      compact.setAttribute('aria-label', (expanded ? '收起' : '展开') + (playing ? '正在播放' : '已暂停') + '的实时活动');
      island.classList.toggle('is-paused', !playing);
      progress.style.width = (elapsed / 18000 * 100).toFixed(1) + '%';
    };
    compact.addEventListener('click', () => setExpanded(!expanded));
    $('.di-collapse', island).addEventListener('click', () => setExpanded(false));
    play.addEventListener('click', () => { playing = !playing; paintPlayer(); });
    $('.di-next', island).addEventListener('click', () => { songIndex = (songIndex + 1) % songs.length; elapsed = 0; paintPlayer(); });
    $('.di-prev', island).addEventListener('click', () => { songIndex = (songIndex + songs.length - 1) % songs.length; elapsed = 0; paintPlayer(); });
    paintPlayer();
    watch(stage, now => {
      if (!last) last = now;
      const dt = Math.min(80, now - last); last = now;
      if (playing) {
        elapsed = (elapsed + dt) % 18000;
        progress.style.width = (elapsed / 18000 * 100).toFixed(1) + '%';
      }
    });
  }

  function replayVectorDemo(stage, selector, duration = 3600) {
    const demo = $(selector, stage), button = $('button', demo);
    if (!demo || !button) return;
    button.addEventListener('click', () => {
      demo.classList.remove('is-replaying');
      void demo.offsetWidth;
      demo.classList.add('is-replaying');
      window.setTimeout(() => demo.classList.remove('is-replaying'), duration);
    });
  }

  function pathWeave(stage) { replayVectorDemo(stage, '.cp-pathweave', 2600); }
  function scanLock(stage) {
    const demo = $('.cp-scanlock', stage), button = $('.sl-replay', stage), heading = $('.sl-heading', stage);
    if (!demo || !button) return;
    let timer = 0;
    button.addEventListener('click', () => {
      window.clearTimeout(timer);
      demo.classList.remove('is-replaying');
      demo.classList.remove('is-locked');
      $$('.sl-steps span', demo).forEach(step => step.classList.remove('active'));
      heading.textContent = '正在扫描视野';
      void demo.offsetWidth;
      demo.classList.add('is-replaying');
      button.disabled = true;
      button.textContent = '正在扫描…';
      timer = window.setTimeout(() => {
        demo.classList.remove('is-replaying');
        demo.classList.add('is-locked');
        heading.textContent = '已找到目标';
        $$('.sl-steps span', demo).forEach((step, index) => step.classList.toggle('active', index === 2));
        button.disabled = false;
        button.innerHTML = '重新扫描 <span>↻</span>';
      }, 4800);
    });
  }

  function scratchReveal(stage) {
    const canvas = $('.sr-foil', stage), card = $('.sr-card', stage), reset = $('.sr-reset', stage);
    if (!canvas || !card) return;
    const ctx = canvas.getContext('2d'); let drawing = false, points = 0, done = false;
    const clearedRatio = () => {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0, total = 0, step = 8;
      for (let y = 3; y < canvas.height; y += step) for (let x = 3; x < canvas.width; x += step) {
        if (data[(y * canvas.width + x) * 4 + 3] < 16) clear++;
        total++;
      }
      return total ? clear / total : 0;
    };
    const resize = () => {
      const r = card.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over'; const g = ctx.createLinearGradient(0, 0, r.width, r.height);
      g.addColorStop(0, '#ddd6c9'); g.addColorStop(.48, '#f8f4eb'); g.addColorStop(1, '#c7bdab');
      ctx.fillStyle = g; ctx.fillRect(0, 0, r.width, r.height); ctx.fillStyle = '#807767'; ctx.font = '600 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('擦开雾面，看看里面', r.width / 2, r.height / 2); ctx.globalCompositeOperation = 'destination-out';
    };
    const erase = e => {
      if (!drawing || done) return; const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      ctx.beginPath(); ctx.arc(x, y, 19, 0, Math.PI * 2); ctx.fill(); points++;
      if (points % 8 === 0 && clearedRatio() > .46) { done = true; canvas.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, fill: 'forwards', easing: E.EO }).onfinish = () => { canvas.style.opacity = '0'; card.classList.add('is-revealed'); }; }
    };
    canvas.addEventListener('pointerdown', e => { drawing = true; canvas.setPointerCapture(e.pointerId); erase(e); });
    canvas.addEventListener('pointermove', erase);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => canvas.addEventListener(n, () => { drawing = false; }));
    reset.addEventListener('click', () => {
      /* 已完成的 WAAPI fill:forwards 会压住 inline opacity=1；先取消动画，再重画整张雾面。 */
      canvas.getAnimations().forEach(a => a.cancel());
      done = false; points = 0; drawing = false; card.classList.remove('is-revealed');
      canvas.style.opacity = '1'; resize();
    });
    new ResizeObserver(resize).observe(card); resize();
  }

  function dotSphere(stage) {
    const canvas = $('.ds-canvas', stage), btn = $('.ds-toggle', stage);
    if (!canvas || !btn) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const n = 420, points = [], shapes = Array.from({ length: 7 }, () => []);
    const names = ['球体', '心形', '圆环', '立方体', '螺旋', '星形', '星系'];
    const english = ['Sphere', 'Heart', 'Torus', 'Cube', 'Helix', 'Star', 'Galaxy'];
    const title = $('.ds-name', stage), index = $('.ds-index', stage), controls = $$('.ds-shapes button', stage);
    const tau = Math.PI * 2, golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const u = i / n, y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), a = golden * i;
      const sphere = { x: Math.cos(a) * r, y, z: Math.sin(a) * r };
      shapes[0].push(sphere); points.push({ ...sphere });
      const t = u * tau, fill = .14 + .86 * Math.sqrt(((i * 73) % n) / n);
      shapes[1].push({ x: Math.pow(Math.sin(t), 3) * fill, y: -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) / 17 * fill, z: sphere.z * .18 });
      const ring = .7 + .26 * Math.cos(a);
      shapes[2].push({ x: ring * Math.cos(t), y: ring * Math.sin(t), z: .26 * Math.sin(a) });
      const face = i % 6, fu = ((Math.floor(i / 6) * .61803398875) % 1) * 1.5 - .75, fv = (Math.floor(i / 6) / (n / 6 - 1)) * 1.5 - .75;
      shapes[3].push(face < 2 ? { x: face ? .75 : -.75, y: fu, z: fv } : face < 4 ? { x: fu, y: face === 3 ? .75 : -.75, z: fv } : { x: fu, y: fv, z: face === 5 ? .75 : -.75 });
      const phase = u * tau * 2.5 + (i % 2) * Math.PI, tube = .045 * Math.cos(a);
      shapes[4].push({ x: (.62 + tube) * Math.cos(phase), y: (u - .5) * 1.8, z: (.62 + tube) * Math.sin(phase) });
      const edge = u * 10, vertex = Math.floor(edge), frac = edge - vertex;
      const starVertex = j => { const angle = j * Math.PI / 5 - Math.PI / 2, radius = j % 2 ? .43 : 1; return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }; };
      const v1 = starVertex(vertex), v2 = starVertex(vertex + 1);
      shapes[5].push({ x: lerp(v1.x, v2.x, frac) * fill, y: lerp(v1.y, v2.y, frac) * fill, z: sphere.z * .12 });
      const rad = Math.sqrt(u), arm = i % 3, ga = rad * tau * 1.2 + arm * tau / 3;
      shapes[6].push({ x: Math.cos(ga) * rad, y: Math.sin(ga) * rad * .7, z: sphere.z * .14 * (1 - rad) });
    }
    let selected = 0, rot = .22, tilt = -.12, dragging = false, lx = 0, ly = 0, downX = 0, downY = 0, moved = false, w = 0, h = 0, last = 0, idle = 0;
    let color = '#d85224', language = '';
    let renderFrame = null;
    const labels = () => {
      const en = window.I18N && window.I18N.lang === 'en';
      language = en ? 'en' : 'zh'; title.textContent = (en ? english : names)[selected];
      index.textContent = String(selected + 1).padStart(2, '0');
      btn.innerHTML = (en ? 'Next shape' : '下一形状') + ' <span>↗</span>';
      controls.forEach((el, i) => { el.textContent = (en ? english : names)[i]; el.setAttribute('aria-pressed', String(i === selected)); });
    };
    const choose = value => { selected = value; idle = 0; canvas.dataset.shape = String(selected); labels(); if (renderFrame && !window.ENGINE.motionOn()) renderFrame(performance.now()); };
    const toggle = () => choose((selected + 1) % shapes.length);
    const fit = () => {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      w = r.width; h = r.height; canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0);
      color = getComputedStyle(stage).getPropertyValue('--accent').trim() || '#d85224';
      if (renderFrame) renderFrame(performance.now());
    };
    stage._ro = new ResizeObserver(fit); stage._ro.observe(canvas); fit(); choose(0);
    canvas.addEventListener('pointerdown', e => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      dragging = true; idle = 0; moved = false; downX = lx = e.clientX; downY = ly = e.clientY; canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 7) moved = true;
      rot += dx * .009; tilt = clamp(tilt + dy * .006, -1.1, 1.1); lx = e.clientX; ly = e.clientY;
      if (renderFrame && !window.ENGINE.motionOn()) renderFrame(performance.now());
    });
    canvas.addEventListener('pointerup', () => { if (!dragging) return; dragging = false; if (!moved) toggle(); });
    canvas.addEventListener('pointercancel', () => { dragging = false; });
    canvas.addEventListener('lostpointercapture', () => { dragging = false; });
    btn.addEventListener('click', toggle);
    controls.forEach((el, i) => el.addEventListener('click', () => choose(i)));
    stage.addEventListener('click', e => { if (e.target === stage) toggle(); });
    renderFrame = now => {
      const dt = last ? clamp(now - last, 0, 50) : 16.7; last = now;
      const motionOn = window.ENGINE.motionOn(), alpha = motionOn ? 1 - Math.exp(-dt / 190) : 1;
      if (language !== (window.I18N && window.I18N.lang === 'en' ? 'en' : 'zh')) labels();
      color = getComputedStyle(stage).getPropertyValue('--accent').trim() || color;
      if (!dragging && motionOn) {
        idle += dt;
        // Flattened shapes settle face-on so their silhouette remains readable.
        if (idle > 2400 && [1, 2, 5, 6].includes(selected)) { rot = lerp(rot, 0, alpha * .4); tilt = lerp(tilt, -.08, alpha * .4); }
        else if (idle > 800 && ![1, 2, 5, 6].includes(selected)) rot += dt * .00013;
      }
      ctx.clearRect(0, 0, w, h);
      const cx = w*.5, cy = h*.51, radius = Math.min(w*.36,h*.40), ca = Math.cos(rot), sa = Math.sin(rot), ct = Math.cos(tilt), st = Math.sin(tilt), draw = [];
      points.forEach((q, i) => {
        const goal = shapes[selected][i]; q.x = lerp(q.x, goal.x, alpha); q.y = lerp(q.y, goal.y, alpha); q.z = lerp(q.z, goal.z, alpha);
        const rx = q.x*ca - q.z*sa, rz = q.x*sa + q.z*ca, ry = q.y*ct - rz*st, depth = q.y*st + rz*ct, scale = 1 / (1.12 - depth*.2);
        draw.push({ x: cx+rx*radius*scale, y: cy+ry*radius*scale, r: (w > 500 ? 1.4 : 1) + (depth+1)*.65, z: depth });
      });
      ctx.fillStyle = color;
      draw.sort((a,b) => a.z-b.z).forEach(p => { ctx.globalAlpha = clamp(.4+(p.z+1)*.27,.18,1); ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,tau); ctx.fill(); }); ctx.globalAlpha = 1;
    };
    stage._renderStill = () => renderFrame(performance.now());
    renderFrame(performance.now());
    watch(stage, renderFrame);
  }

  const RUN = {
    gaze: gaze, pinned: pinned, stack: stackCards, dio: diorama, orbit: orbit,
    bloom: bloom, vortex: vortex, float: floatGrow, helix: helix, glow: luminous,
    spotlight: spotlight, trail: trail,
    fan: function (st) { hoverToggle(st, '.fn-deck'); },
    peel: function (st) { hoverToggle(st, '.pc'); },
    hscroll: hscroll, frames: frames, twocol: twoCol, thememorph: themeMorph,
    ring: progressRing, fab: fab, tristate: triState, compare: compare,
    linemask: lineMask, vspeed: velocitySkew, pglow: proximityGlow, liquid: liquidFollow,
    chart: chartBuild, preview: previewFollow, throw: throwDismiss, scramble: scrambleDecode,
    rail: rail, tunnel: tunnel, magnetic: magnetic, tilt: tiltCard, odometer: odometer,
    confetti: confetti, tabs: smoothTabs, coverflow: coverflow, cylinder: cylinder, ring3d: ringGallery,
    pagecurl: pageCurl, island: dynamicIsland, scratch: scratchReveal, dotsphere: dotSphere,
    pathweave: pathWeave, scanlock: scanLock
  };

  function watch(el, fn) {
    /* 节点移出 DOM 后自摘，防泄漏（同 motion.js / runtime.js 的 watch） */
    const u = function (now) {
      if (!el.isConnected) { window.ENGINE.tickers.delete(u); return; }
      if (window.ENGINE.isVisible(el)) fn(now);
    };
    window.ENGINE.tickers.add(u);
    (el._watchers || (el._watchers = [])).push(u);
  }

  /* 键盘替代指针：方向键当作鼠标，Enter/空格当作点击。
     这些舞台全靠 pointer / click 驱动，没有这条就完全不可达。 */
  function keyboardPointer(stage, mode) {
    /* 滚动驱动的把方向键留给浏览器滚容器，只有指针驱动的才接管 */
    const ARROWS = { gaze: 1, dio: 1, helix: 1, glow: 1, spotlight: 1, trail: 1, pglow: 1, liquid: 1, preview: 1, magnetic: 1, tilt: 1, cylinder: 1, ring3d: 1 };
    let x = .5, y = .5, live = false;
    const send = function (type) {
      const r = stage.getBoundingClientRect();
      stage.dispatchEvent(new PointerEvent(type, {
        clientX: r.left + r.width * x, clientY: r.top + r.height * y, bubbles: true, pointerId: 1
      }));
    };
    stage.addEventListener('keydown', function (e) {
      if (e.target.closest('button, input, select, a')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); e.stopPropagation();
        stage.click();          /* 点击驱动的（FAB / 三态 / 漂浮）走这条路 */
        return;
      }
      if (!ARROWS[mode]) {
        /* 滚动驱动的：方向键交给容器滚动，别让键盘用户完全进不去 */
        const box = $('.scrolly', stage);
        if (box && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'PageDown' || e.key === 'PageUp')) {
          e.preventDefault();
          box.scrollBy({ top: (e.key === 'ArrowUp' || e.key === 'PageUp' ? -1 : 1) * (e.key.charAt(0) === 'P' ? box.clientHeight * .8 : 34), behavior: 'auto' });
        }
        return;
      }
      const d = .14;
      if (e.key === 'ArrowLeft') x = clamp(x - d, 0, 1);
      else if (e.key === 'ArrowRight') x = clamp(x + d, 0, 1);
      else if (e.key === 'ArrowUp') y = clamp(y - d, 0, 1);
      else if (e.key === 'ArrowDown') y = clamp(y + d, 0, 1);
      else return;
      e.preventDefault(); e.stopPropagation();
      live = true;
      send('pointermove');
    });
    stage.addEventListener('blur', function () { if (live) { live = false; send('pointerleave'); } });
  }

  M.KINDS.compound = function (stage, s) {
    const fn = RUN[s.mode];
    if (fn) fn(stage, s);
    if (s.mode !== 'pagecurl') keyboardPointer(stage, s.mode);
  };
  // One hook for all mounted spheres; reduced motion still allows direct shape selection.
  window.ENGINE.onMotion(on => { if (!on) document.querySelectorAll('.stage[data-mode="dotsphere"]').forEach(stage => { if (stage._renderStill) stage._renderStill(); }); });
  new MutationObserver(() => {
    document.querySelectorAll('.stage[data-mode="dotsphere"]').forEach(stage => { if (stage._renderStill) stage._renderStill(); });
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang', 'data-theme'] });

  /* 驱动方式徽标：一眼看出这块舞台是被什么输入的 */
  const DRV = {
    gaze: ['pointer', '指针'], pinned: ['scroll', '滚动'], stack: ['scroll', '滚动'], dio: ['pointer', '指针'],
    orbit: ['scroll', '滚动'], bloom: ['hover', '悬停'], vortex: ['scroll', '滚动'], float: ['tap', '点击'],
    helix: ['drag', '拖拽'], glow: ['pointer', '指针'], spotlight: ['pointer', '指针'], trail: ['pointer', '指针'],
    fan: ['hover', '悬停'], peel: ['hover', '悬停'], hscroll: ['scroll', '滚动'], frames: ['scroll', '滚动'],
    twocol: ['scroll', '滚动'], thememorph: ['scroll', '滚动'], ring: ['scroll', '滚动'], fab: ['tap', '点击'],
    tristate: ['tap', '点击'], compare: ['drag', '拖拽'], pagecurl: ['drag', '拖拽'], island: ['tap', '点击'], scratch: ['drag', '拖拽'], dotsphere: ['drag', '拖拽'], pathweave: ['tap', '重播'], scanlock: ['tap', '重播'],
    linemask: ['scroll', '滚动'], vspeed: ['scroll', '滚动'], pglow: ['pointer', '指针'], liquid: ['pointer', '指针'],
    chart: ['scroll', '滚动'], preview: ['hover', '悬停'], throw: ['drag', '拖拽'], scramble: ['tap', '点击'],
    rail: ['scroll', '滚动'], tunnel: ['scroll', '滚动'], magnetic: ['pointer', '指针'], tilt: ['pointer', '指针'], odometer: ['tap', '点击'], confetti: ['tap', '点击'], tabs: ['tap', '点击'], coverflow: ['tap', '点击'], cylinder: ['drag', '拖拽'], ring3d: ['drag', '拖拽']
  };

  const prevFor = M.htmlFor;
  M.htmlFor = function (s) {
    if (s.kind === 'compound') {
      const d = DRV[s.mode] || ['', ''];
      return '<b class="cp-chip d-' + d[0] + '" aria-hidden="true" data-l10n="' + d[1] + '">' + d[1] + '</b>' + ((HTML[s.mode] || HTML.gaze)());
    }
    return prevFor ? prevFor(s) : '';
  };
})();
