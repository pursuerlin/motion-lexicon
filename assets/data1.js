/* ============================================================
   动效通用词汇 · 数据（第一部分）
   分类 CATS + 术语 TERMS
   demo 规格由 assets/app.js 的引擎解释：
     kind: frames(默认) | track | curve | spring | two | scroll |
           drag | list | morph | type | draw | perf
     frames: [[百分比, 'css属性'], ...]   e: 缓动   d: 时长
     multi: 克隆数量   st: 错峰间隔(ms)   play: in|hover|press|always
   ============================================================ */

window.CATS = [
  { id: 'easing', name: '缓动与曲线', en: 'Easing & Curves', tagline: '运动的“性格”由这条曲线决定，而不是由时长决定。' },
  { id: 'time', name: '时长与时序', en: 'Duration & Timing', tagline: '多久、何时开始、谁等谁——节奏感全在这三层。' },
  { id: 'entrance', name: '入场', en: 'Entrance', tagline: '元素如何从无到有。用户第一眼看到的运动。' },
  { id: 'exit', name: '出场', en: 'Exit', tagline: '退场要比进场快，且不能把上下文一起带走。' },
  { id: 'transform', name: '变换与三维', en: 'Transform & 3D', tagline: '位移、缩放、旋转、斜切，以及造出深度的透视。' },
  { id: 'state', name: '状态切换与转场', en: 'State & Transition', tagline: 'A 变成 B 时，让眼睛跟得上，让空间关系不丢失。' },
  { id: 'scroll', name: '滚动动效', en: 'Scroll Motion', tagline: '把滚动条这个输入设备，当成时间轴来用。' },
  { id: 'feedback', name: '交互反馈', en: 'Interaction & Feedback', tagline: '每一次点击、拖拽、悬停，系统都要回一句话。' },
  { id: 'loop', name: '循环与环境动效', en: 'Loop & Ambient', tagline: '没有事件发生时，页面也不该是一潭死水。' },
  { id: 'text', name: '文字动效', en: 'Typography Motion', tagline: '文字进场、逐字拆解、数字跳动。' },
  { id: 'polish', name: '润色与特效', en: 'Polish & FX', tagline: '那 5% 让作品从“能动”变成“好看”。' },
  { id: 'camera', name: '镜头与叙事', en: 'Camera & Story', tagline: '不移动元素，移动观看元素的那只眼睛。' },
  { id: 'principles', name: '动画原则', en: 'Principles', tagline: '1930 年代迪士尼定的规矩，今天在 UI 里依然成立。' },
  { id: 'perf', name: '性能与工程', en: 'Performance', tagline: '掉一帧，所有精心设计的曲线都会显得廉价。' }
];

window.TERMS = [

  /* ================= 1. 缓动与曲线 ================= */
  {
    id: 'easing', en: 'Easing', zh: '缓动 / 速度曲线', cat: 'easing',
    alias: ['timing function', '缓动函数', '加减速', '运动曲线'],
    vague: '让它动起来更自然一点',
    say: '这条动效用 ease-out 曲线，起步快、收尾慢',
    def: '控制动画进度如何映射到时间轴的函数。线性动画一眼就看出是机器做的，因为现实里没有物体能瞬间达到最高速、又瞬间静止。',
    code: 'transition: transform 320ms ease-out;',
    demo: { kind: 'track', fn: 'easeOut' }
  },
  {
    id: 'linear', en: 'Linear', zh: '线性 / 匀速', cat: 'easing',
    alias: ['匀速', '等速'],
    vague: '就匀速转',
    say: '匀速（linear）驱动，适合持续型运动',
    def: '进度与时间成正比。适合旋转加载、循环跑马灯、进度填充这类“没有起点终点”的运动；用在有始有终的位移上会显得机械。',
    code: 'animation: spin 1.2s linear infinite;',
    demo: { kind: 'track', fn: 'linear' }
  },
  {
    id: 'ease-in', en: 'Ease-in / Accelerate', zh: '缓入 / 加速', cat: 'easing',
    alias: ['加速', 'accelerate', 'easeIn'],
    vague: '它走掉的时候',
    say: '用 ease-in 让它加速离场，像被甩出去',
    def: '慢起步、快收尾。因为结束时速度很高，观众会觉得物体是“离开了”，所以天然适合出场、收起、抛走的动作。',
    code: 'transition: all 200ms cubic-bezier(0.32, 0, 0.67, 0);',
    demo: { kind: 'track', fn: 'easeIn' }
  },
  {
    id: 'ease-out', en: 'Ease-out / Decelerate', zh: '缓出 / 减速', cat: 'easing',
    alias: ['减速', 'decelerate', 'easeOut', '先快后慢'],
    vague: '滑进来但别那么生硬',
    say: '240ms ease-out 入场，减速落到终点',
    def: '快起步、慢收尾。物体带着速度进入视野、再平稳停住，符合物理直觉，是 UI 入场和状态切换最安全的选择。',
    code: 'transition: transform 240ms cubic-bezier(0.33, 1, 0.68, 1);',
    demo: { kind: 'track', fn: 'easeOut' }
  },
  {
    id: 'ease-in-out', en: 'Ease-in-out', zh: '缓入缓出', cat: 'easing',
    alias: ['先慢后快再慢', '对称缓动', 'smooth'],
    vague: '两头都慢一点，中间快点',
    say: '长距离位移用 ease-in-out，起止都柔和',
    def: '两端慢、中段快。适合起点和终点都需要被看清的长距离移动、来回切换；短距离用它会显得拖沓。',
    code: 'transition: transform 480ms cubic-bezier(0.65, 0, 0.35, 1);',
    demo: { kind: 'track', fn: 'easeInOut' }
  },
  {
    id: 'power', en: 'Power / Sine · Quad · Cubic · Expo', zh: '缓动强度（次幂族）', cat: 'easing',
    alias: ['sine', 'quad', 'cubic', 'quart', 'quint', 'expo', 'circ', '指数缓动', '强度'],
    vague: '更夸张一点的减速',
    say: '用 expo-out 而不是 cubic-out，收尾更“抓”',
    def: '同一种形状的不同力度版本。sine 最温和，expo 最戏剧化：曲线末段几乎停住，前 20% 时间就走完了 80% 距离。',
    code: '/* 越靠后越极端 */\ncubic-bezier(0.33, 1, 0.68, 1)     /* cubic-out */\ncubic-bezier(0.16, 1, 0.3, 1)      /* expo-out */\ncubic-bezier(0.83, 0, 0.17, 1)     /* expo-in-out */',
    demo: { kind: 'curve', fn: 'easeOutExpo' }
  },
  {
    id: 'cubic-bezier', en: 'Cubic Bézier', zh: '三次贝塞尔曲线', cat: 'easing',
    alias: ['贝塞尔', '自定义曲线', 'css cubic-bezier'],
    vague: '我想要一条独一无二的曲线',
    say: '曲线参数 cubic-bezier(0.16, 1, 0.3, 1)',
    def: '用两个控制点定义的四点曲线，CSS 缓动的通用语言。Y 超出 0–1 区间就产生过冲，X 超出则出现时间倒流（非法）。',
    code: 'transition: transform 520ms cubic-bezier(0.16, 1, 0.3, 1);',
    demo: { kind: 'curve', fn: 'customBezier' }
  },
  {
    id: 'asymmetric', en: 'Asymmetric Easing', zh: '不对称缓动', cat: 'easing',
    alias: ['非对称', '快进快出', 'in/out 不同曲线'],
    vague: '进来温柔一点，出去利落一点',
    say: '进场 ease-out、退场 ease-in，曲线不对称',
    def: '进场与退场使用不同曲线（或不同时长）。人的注意力跟随“到来”，但不在意“离开”，所以常见做法是慢出快进：入场慢而细腻，出场快而果断。',
    code: '.enter { transition: 320ms cubic-bezier(0.16, 1, 0.3, 1); }\n.exit  { transition: 160ms cubic-bezier(0.32, 0, 0.67, 0); }',
    demo: {
      kind: 'two',
      a: { label: '进场 · ease-out 320ms', frames: [[0, 'opacity:0; transform:translateY(18px)'], [100, 'opacity:1; transform:none']], e: 'cubic-bezier(0.16,1,0.3,1)', d: '320ms' },
      b: { label: '退场 · ease-in 160ms', frames: [[0, 'opacity:1; transform:none'], [100, 'opacity:0; transform:translateY(18px)']], e: 'cubic-bezier(0.32,0,0.67,0)', d: '160ms' }
    }
  },
  {
    id: 'overshoot', en: 'Overshoot', zh: '过冲 / 冲过头', cat: 'easing',
    alias: ['冲过', '回弹', 'y 超过 1'],
    vague: '到位以后抖一下再停',
    say: '带 10% overshoot，冲过终点再回落',
    def: '运动冲过目标值再折返。给了画面一点“重量感”和能量感，但在严谨的生产工具里过量会显得轻浮。',
    code: 'transition: transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1);',
    demo: { kind: 'curve', fn: 'easeOutBack' }
  },
  {
    id: 'ease-out-back', en: 'Ease-out-back', zh: '回弹缓出', cat: 'easing',
    alias: ['back out', '弹入', '带回弹'],
    vague: '啪一下弹进去',
    say: '卡片用 ease-out-back 弹入，末端轻微回弹',
    def: '末端带一次过冲回弹的缓动，常用来做 pop、按钮展开、徽章出现。是“活泼品牌”和“稳重后台”的分水岭。',
    code: 'animation: pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both;',
    demo: {
      kind: 'frames', play: 'in',
      frames: [[0, 'opacity:0; transform:scale(.7)'], [100, 'opacity:1; transform:scale(1)']],
      e: 'cubic-bezier(0.34,1.56,0.64,1)', d: '560ms'
    }
  },
  {
    id: 'ease-in-back', en: 'Ease-in-back', zh: '反向前摇', cat: 'easing',
    alias: ['anticipation curve', '回拉', '先退后进'],
    vague: '它好像先往后缩了一下',
    say: '起手用 ease-in-back 做反向预备，再甩出去',
    def: '起步先朝反方向移动一点点再加速。这正是动画十二法则里 anticipation（预备动作）的曲线化实现。',
    code: 'animation: launch 520ms cubic-bezier(0.36, 0, 0.66, -0.56) both;',
    demo: {
      kind: 'frames',
      frames: [[0, 'transform:translateX(-40px)'], [100, 'transform:translateX(40px)']],
      e: 'cubic-bezier(0.36,0,0.66,-0.56)', d: '700ms', loop: true, alt: true
    }
  },
  {
    id: 'spring', en: 'Spring', zh: '弹簧物理', cat: 'easing',
    alias: ['物理弹簧', 'spring animation', '基于物理'],
    vague: '像苹果手机上那种自然的滑动',
    say: '用 spring（stiffness 120 / damping 14）替代固定时长',
    def: '由刚度、阻尼、质量模拟出来的运动，而不是固定时长加曲线。优点是没有“终点时间”，因此天然可中断、可续接，被用户中途打断时不会跳帧。',
    code: 'animate(el, { y: 0 }, { type: "spring", stiffness: 120, damping: 14 });',
    demo: { kind: 'spring', p: [170, 22, 1] }
  },
  {
    id: 'stiffness', en: 'Stiffness', zh: '刚度', cat: 'easing',
    alias: ['弹性系数', 'k 值'],
    vague: '弹得再快一点',
    say: '把 stiffness 提到 260，回弹更紧',
    def: '弹簧有多“硬”。数值越大恢复力越强、到达目标越快，运动显得脆；数值小则像橡皮筋，慢悠悠地晃过去。',
    code: '{ type: "spring", stiffness: 260, damping: 20 }',
    demo: { kind: 'spring', p: [260, 20, 1], p2: [60, 20, 1] }
  },
  {
    id: 'damping', en: 'Damping', zh: '阻尼', cat: 'easing',
    alias: ['减震', '衰减', 'c 值'],
    vague: '别晃那么多次',
    say: '阻尼调到临界附近，只过一次冲就稳住',
    def: '能量衰减的快慢，决定来回震荡几次后停下。阻尼过低是果冻，过高是黏稠的糖浆，临界阻尼（不震荡的最快返回）常用于界面。',
    code: '{ type: "spring", stiffness: 180, damping: 26 }',
    demo: { kind: 'spring', p: [180, 8, 1], p2: [180, 26, 1] }
  },
  {
    id: 'mass', en: 'Mass', zh: '质量', cat: 'easing',
    alias: ['重量感', 'm 值'],
    vague: '看起来重一点',
    say: '质量加大到 3，起动变慢、惯性变强',
    def: '弹簧系统里物体的重量。质量越大加速越慢、越拖手，适合表现大面板；小元素用大质量会显得迟钝。',
    code: '{ type: "spring", stiffness: 200, damping: 18, mass: 3 }',
    demo: { kind: 'spring', p: [200, 18, 4], p2: [200, 18, 0.6] }
  },
  {
    id: 'bounce', en: 'Bounce', zh: '落地弹跳', cat: 'easing',
    alias: ['bounce easing', '弹地球', '落地'],
    vague: '像球掉在地上弹两下',
    say: '末端用 bounce-out，落地后衰减弹两次',
    def: '终点前反复折返、每次幅度衰减，模拟物体落地。区别于 elastic：bounce 只在末端弹，elastic 全程抖。',
    code: 'animation: drop 900ms cubic-bezier(0.22, 1, 0.36, 1) both;',
    demo: { kind: 'curve', fn: 'easeOutBounce' }
  },
  {
    id: 'elastic', en: 'Elastic', zh: '橡皮筋 / 弹性震荡', cat: 'easing',
    alias: ['elastic out', '果冻', '震荡衰减'],
    vague: '果冻一样抖几下',
    say: 'elastic-out，末端来回衰减震荡 2~3 次',
    def: '围绕终点的正弦震荡并逐渐衰减，像被拉长的橡皮筋。视觉冲击强，但会把注意力从内容抢走，适合贴纸、吉祥物、彩蛋。',
    code: 'animation: jelly 1.1s cubic-bezier(0.5, 1.6, 0.4, 0.8) both;',
    demo: { kind: 'curve', fn: 'easeOutElastic' }
  },
  {
    id: 'stepped', en: 'Stepped / Steps()', zh: '阶梯缓动', cat: 'easing',
    alias: ['steps', '逐帧', '定格', '像素风'],
    vague: '要那种一格一格的',
    say: 'steps(8) 把运动切成 8 段，逐帧感',
    def: '把连续进度离散成若干台阶，动画变成一格一格跳。用于精灵图逐帧播放、像素风、打字机与复古定格（1 拍 2 帧）。',
    code: 'animation: run 0.6s steps(8) infinite;',
    demo: {
      kind: 'frames',
      frames: [[0, 'transform:translateX(-44px)'], [100, 'transform:translateX(44px)']],
      e: 'steps(8)', d: '1200ms', loop: true, alt: true
    }
  },
  {
    id: 'interruptible', en: 'Interruptible Motion', zh: '可中断动效', cat: 'easing',
    alias: ['可打断', '续接', 'velocity handoff'],
    vague: '我中途再点它不能卡住',
    say: '动画可中断，并从当前速度续接（spring 天然支持）',
    def: '用户在新动画未完成时再次操作，运动从当前位置和当前速度继续，而不是等播完或瞬间跳位。这是 spring 相对固定时长曲线的核心优势。',
    code: '/* 用位移速度续接，而不是重新开始 */\nanimate(el, { y: target }, { type: "spring", velocity: currentVelocity });',
    demo: { kind: 'spring', p: [200, 20, 1], interactive: true }
  },

  /* ================= 2. 时长与时序 ================= */
  {
    id: 'duration', en: 'Duration', zh: '时长', cat: 'time',
    alias: ['持续时间', '多久', 'ms'],
    vague: '快一点，但别太快',
    say: '时长 200ms（小元素）/ 300ms（面板）',
    def: '动画从开始到结束的时间。经验区间：微反馈 100–160ms、小元素 200–300ms、大面板转场 400–600ms；超过 800ms 用户会开始觉得等待。',
    code: 'transition: transform 240ms ease-out;',
    demo: {
      kind: 'two',
      a: { label: '120ms · 干脆', frames: [[0, 'transform:translateX(-52px)'], [100, 'transform:translateX(52px)']], e: 'cubic-bezier(0.33,1,0.68,1)', d: '120ms' },
      b: { label: '900ms · 拖沓', frames: [[0, 'transform:translateX(-52px)'], [100, 'transform:translateX(52px)']], e: 'cubic-bezier(0.33,1,0.68,1)', d: '900ms' }
    }
  },
  {
    id: 'delay', en: 'Delay', zh: '延迟', cat: 'time',
    alias: ['延后', '等一会再动', 'animation-delay'],
    vague: '别一起动，错开一点',
    say: '第二层延迟 60ms 再启动',
    def: '动画启动前的等待时间。用来制造先后关系、给主元素让路。注意：延迟会直接加进用户感知的总耗时，滥用是界面“慢半拍”的元凶。',
    code: 'animation-delay: 60ms;',
    demo: {
      kind: 'frames', multi: 3, st: 60,
      frames: [[0, 'opacity:0; transform:translateY(14px)'], [100, 'opacity:1; transform:none']],
      e: 'cubic-bezier(0.16,1,0.3,1)', d: '420ms'
    }
  },
  {
    id: 'stagger', en: 'Stagger', zh: '错峰 / 依次入场', cat: 'time',
    alias: ['依次', '瀑布式', 'cascade', 'sequence delay', '逐个'],
    vague: '一个一个冒出来',
    say: '列表项 stagger 40ms 依次入场',
    def: '一组元素以固定时间差依次播放同一动画。让多个对象显得“有编排”而不是同时蹦出，是提升质感最划算的一招。间隔 30–60ms 为宜，超过 100ms 就变成等待。',
    code: '.item:nth-child(n) { animation-delay: calc(var(--i) * 40ms); }',
    demo: {
      kind: 'frames', html: '<div class="obj demo-content demo-sequence" aria-hidden="true"><span class="demo-sequence-photo"></span><span class="demo-sequence-number"></span></div>', multi: 5, st: 40,
      frames: [[0, 'opacity:0; transform:translateY(16px) scale(.94)'], [100, 'opacity:1; transform:none']],
      e: 'cubic-bezier(0.16,1,0.3,1)', d: '460ms'
    }
  },
  {
    id: 'orchestration', en: 'Orchestration', zh: '编排 / 场面调度', cat: 'time',
    alias: ['调度', '时间线', 'timeline', '多段配合'],
    vague: '整段动画要有主次和节奏',
    say: '按 timeline 编排：背景先行，标题 120ms 跟进，卡片 240ms 收尾',
    def: '把多个动画当作一首曲子来安排：谁先、谁后、谁同时、谁在谁的收尾里进入。工具上通常表现为 timeline（GSAP 的 tl、After Effects 的图层）。',
    code: 'tl.to(bg, { y: 0 }, 0)\n  .to(title, { opacity: 1 }, 0.12)\n  .to(cards, { opacity: 1, stagger: 0.05 }, 0.24);',
    demo: {
      kind: 'frames', multi: 6, st: 110,
      frames: [[0, 'opacity:0; transform:translateY(20px) rotate(-6deg)'], [60, 'opacity:1; transform:translateY(-4px) rotate(2deg)'], [100, 'opacity:1; transform:none']],
      e: 'cubic-bezier(0.33,1,0.68,1)', d: '700ms'
    }
  },
  {
    id: 'fill-mode', en: 'Fill Mode', zh: '填充模式', cat: 'time',
    alias: ['forwards', 'backwards', 'both', '动画结束后保持'],
    vague: '动完之后别跳回原样',
    say: 'animation-fill-mode: both，结束保持终态',
    def: '决定动画在播放前和结束后元素是什么状态。忘了写 forwards 是“动画播完瞬间弹回原位”这类 bug 的标准成因。',
    code: 'animation: rise 320ms ease-out both;',
    demo: {
      kind: 'frames',
      frames: [[0, 'opacity:0; transform:translateY(20px)'], [100, 'opacity:1; transform:none']],
      e: 'ease-out', d: '420ms', nofill: true, hint: '注意：结束就弹回（未设 both）'
    }
  },
  {
    id: 'iteration', en: 'Iteration Count', zh: '播放次数', cat: 'time',
    alias: ['infinite', '循环次数', 'animation-iteration-count'],
    vague: '来回动三次就好',
    say: 'iteration-count: 3，不无限循环',
    def: '动画重复的次数，`infinite` 表示无限。原则：等待状态才允许无限，吸引注意力的提示最多 2–3 次，否则用户会屏蔽整块内容。',
    code: 'animation: nudge 480ms ease-in-out 3;',
    demo: {
      kind: 'frames',
      frames: [[0, 'transform:translateX(0)'], [25, 'transform:translateX(-8px)'], [75, 'transform:translateX(8px)'], [100, 'transform:translateX(0)']],
      e: 'ease-in-out', d: '520ms', repeat: 3
    }
  },
  {
    id: 'alternate', en: 'Direction / Alternate', zh: '播放方向', cat: 'time',
    alias: ['alternate', 'reverse', '来回', '往返'],
    vague: '到边了自己再退回来',
    say: 'direction: alternate 做无接缝往返',
    def: 'normal 每次都从头重播，reverse 反向播放，alternate 奇偶次交替——省掉“硬切回头”，是浮动、呼吸、摇摆类循环的标准写法。',
    code: 'animation: float 3.2s ease-in-out infinite alternate;',
    demo: {
      kind: 'frames',
      frames: [[0, 'transform:translateY(6px)'], [100, 'transform:translateY(-6px)']],
      e: 'ease-in-out', d: '1400ms', loop: true, alt: true
    }
  },
  {
    id: 'playback-rate', en: 'Playback Rate', zh: '播放速率', cat: 'time',
    alias: ['倍速', 'timeScale', '0.5x', '2x'],
    vague: '整体放慢一点看细节',
    say: 'timeScale(0.25) 慢放查看曲线细节',
    def: '对整条时间线的倍速缩放。慢放（0.1–0.5x）是调曲线的必要手段；调试时也可以用 3x 快速验证长动画。',
    code: 'gsap.globalTimeline.timeScale(0.25); /* 慢放 4 倍检查运动 */',
    demo: {
      kind: 'frames',
      frames: [[0, 'opacity:0; transform:scale(.6) rotate(-12deg)'], [100, 'opacity:1; transform:none']],
      e: 'cubic-bezier(0.16,1,0.3,1)', d: '1600ms'
    }
  },
  {
    id: 'timing-scale', en: 'Motion Token / Timing Scale', zh: '时长令牌 / 时长刻度', cat: 'time',
    alias: ['motion tokens', 'design token', '快速/标准/缓慢'],
    vague: '全站动效时长要统一',
    say: '统一走 token：xs 100ms / s 200ms / m 320ms / l 480ms',
    def: '把时长收敛成一组设计令牌（fast / normal / slow），像颜色和字号一样统一管理。散落的 237ms、410ms 是设计系统腐化的信号。',
    code: '--dur-fast: 120ms; --dur-base: 240ms; --dur-slow: 400ms;',
    demo: {
      kind: 'frames', multi: 3, st: 0,
      frames: [[0, 'transform:scaleX(.05)'], [100, 'transform:scaleX(1)']],
      e: 'cubic-bezier(0.16,1,0.3,1)', d: '520ms', loop: true, perDelay: '120|240|400', hint: '三条长度=三档 token'
    }
  },
  {
    id: 'perceptual-duration', en: 'Perceived Duration', zh: '感知时长', cat: 'time',
    alias: ['主观时间', '感觉快慢'],
    vague: '明明只有 300ms 却觉得慢',
    say: '把曲线前段做陡，感知时长会缩短',
    def: '用户主观感受到的时间，和实际毫秒数并不相等。前段位移快、收尾短，会让同样的 400ms 明显比“匀速推进”更短。',
    code: '/* 同样 400ms：陡起缓收 < 线性 < 缓起陡收（主观上） */',
    demo: {
      kind: 'two',
      a: { label: '400ms expo-out · 感觉更快', frames: [[0, 'transform:translateX(-54px)'], [100, 'transform:translateX(54px)']], e: 'cubic-bezier(0.16,1,0.3,1)', d: '400ms' },
      b: { label: '400ms ease-in · 感觉更慢', frames: [[0, 'transform:translateX(-54px)'], [100, 'transform:translateX(54px)']], e: 'cubic-bezier(0.32,0,0.67,0)', d: '400ms' }
    }
  },

  /* ================= 3. 入场 ================= */
  {
    id: 'fade-in', en: 'Fade in', zh: '淡入', cat: 'entrance',
    alias: ['渐显', 'opacity 入场', '交叉出现'],
    vague: '让它慢慢显出来',
    say: '200ms 淡入（可叠加 8px 上移）',
    def: '透明度从 0 到 1。最保守的入场：不改变位置，因此不会推动其他内容，适合图片、遮罩、模态背景。',
    code: 'animation: fade-in 200ms ease-out both;',
    demo: { kind: 'frames', html: '<div class="obj demo-content demo-notice"><span class="demo-notice-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 12 4 4 8-8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="demo-notice-copy"><b data-l10n="灵感已收好">灵感已收好</b><small data-l10n="留给下一次创作">留给下一次创作</small></span><span class="demo-notice-dot" aria-hidden="true"></span></div>', frames: [[0, 'opacity:0'], [100, 'opacity:1']], e: 'ease-out', d: '420ms' }
  },
  {
    id: 'slide-in', en: 'Slide in', zh: '滑入', cat: 'entrance',
    alias: ['推入', 'translate 入场', '从边上进来'],
    vague: '从右边推进来',
    say: '从右侧 translateX 滑入，ease-out 300ms',
    def: '从画面外沿某个方向平移进入，同时通常配合淡入。方向本身携带信息：从右进入常表示“下一页”，从左表示“返回”。',
    code: 'animation: slide-in 300ms cubic-bezier(0.16,1,0.3,1) both;',
    demo: { kind: 'frames', html: '<div class="obj demo-content demo-notice"><span class="demo-notice-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 12 4 4 8-8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="demo-notice-copy"><b data-l10n="灵感已收好">灵感已收好</b><small data-l10n="留给下一次创作">留给下一次创作</small></span><span class="demo-notice-dot" aria-hidden="true"></span></div>', frames: [[0, 'opacity:0; transform:translateX(46px)'], [100, 'opacity:1; transform:none']], e: 'cubic-bezier(0.16,1,0.3,1)', d: '480ms' }
  },
  {
    id: 'scale-in', en: 'Scale in', zh: '缩放入场', cat: 'entrance',
    alias: ['放大出现', 'zoom in', '由小变大'],
    vague: '从小长出来',
    say: '从 0.96 scale 放大到 1，配淡入',
    def: '尺寸由小变大进入。起点 scale 越接近 1（0.94–0.98）越像系统级精致；从 0 长出来则像弹窗广告。',
    code: 'transform: scale(.96); → transform: scale(1);',
    demo: { kind: 'frames', html: '<div class="obj demo-content demo-photo"><img src="assets/img/p10.jpg" alt="" loading="eager" decoding="async"><span class="demo-photo-caption"><b data-l10n="光影手记">光影手记</b><small aria-hidden="true">↗</small></span></div>', frames: [[0, 'opacity:0; transform:scale(.96)'], [100, 'opacity:1; transform:scale(1)']], e: 'cubic-bezier(0.16,1,0.3,1)', d: '440ms' }
  },
  {
    id: 'pop-in', en: 'Pop in', zh: '弹出（带过冲）', cat: 'entrance',
    alias: ['蹦出来', 'pop', '弹一下'],
    vague: '就是那种蹦出来的感觉',
    say: 'pop-in：scale 0.7→1 + ease-out-back，末端回弹',
    def: '快速放大并轻微冲过终点再落回，像气泡出现。适合徽章、通知、新增项、贴纸；一次屏幕上不要超过一个 pop。',
    code: 'animation: pop 320ms cubic-bezier(0.34,1.56,0.64,1) both;',
    demo: { kind: 'frames', html: '<div class="obj demo-content demo-badge"><span class="demo-badge-star"><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="m20 5 4.6 9.4L35 16l-7.5 7.3 1.8 10.3L20 28.8l-9.3 4.8 1.8-10.3L5 16l10.4-1.6Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg></span><b data-l10n="收藏成功">收藏成功</b><small aria-hidden="true">✦</small></div>', frames: [[0, 'opacity:0; transform:scale(.7)'], [100, 'opacity:1; transform:scale(1)']], e: 'cubic-bezier(0.34,1.56,0.64,1)', d: '520ms' }
  },
  {
    id: 'bounce-in', en: 'Bounce in', zh: '弹跳入场', cat: 'entrance',
    alias: ['弹进来', '掉下来弹住'],
    vague: '从上面掉下来砸住',
    say: 'drop + bounce，落地衰减两次',
    def: '带着落地弹跳进入视野。能量感强、语气活泼，多用于插画、吉祥物、游戏化界面；金融或医疗场景应避免。',
    code: 'animation: bounce-in 720ms cubic-bezier(0.28,0.84,0.42,1) both;',
    demo: {
      kind: 'frames', html: '<div class="obj demo-content demo-notice"><span class="demo-notice-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 12 4 4 8-8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="demo-notice-copy"><b data-l10n="灵感已收好">灵感已收好</b><small data-l10n="留给下一次创作">留给下一次创作</small></span><span class="demo-notice-dot" aria-hidden="true"></span></div>',
      frames: [[0, 'opacity:0; transform:translateY(-40px) scale(.9)'], [55, 'opacity:1; transform:translateY(6px) scale(1.03)'], [78, 'transform:translateY(-4px)'], [100, 'transform:translateY(0) scale(1)']],
      e: 'cubic-bezier(0.33,1,0.68,1)', d: '900ms'
    }
  },
  {
    id: 'drop-in', en: 'Drop in', zh: '落下入场', cat: 'entrance',
    alias: ['掉落', '从上掉下'],
    vague: '从天上掉下来',
    say: '从上方 translateY(-12) 落下，ease-out',
    def: '受重力暗示的自上而下入场，常配 ease-in 起始加速与末端 ease-out 停稳。注意落点下方要有“承托”视觉，否则像掉进虚空。',
    code: 'animation: drop 360ms cubic-bezier(0.34,1.56,0.64,1) both;',
    demo: { kind: 'frames', html: '<div class="obj demo-content demo-notice"><span class="demo-notice-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 12 4 4 8-8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="demo-notice-copy"><b data-l10n="灵感已收好">灵感已收好</b><small data-l10n="留给下一次创作">留给下一次创作</small></span><span class="demo-notice-dot" aria-hidden="true"></span></div>', frames: [[0, 'opacity:0; transform:translateY(-34px)'], [100, 'opacity:1; transform:none']], e: 'cubic-bezier(0.34,1.56,0.64,1)', d: '520ms' }
  },
  {
    id: 'rise-in', en: 'Rise / Slide-up fade', zh: '上浮入场', cat: 'entrance',
    alias: ['上移淡入', '滑上来', 'rise', 'fade-up'],
    vague: '轻轻抬上来',
    say: 'translateY(14→0) + opacity 0→1，240ms ease-out',
    def: '轻微上移同时淡入，业界最通用的“万能入场”。位移只给 8–16px，用户感知到的是“浮现”，而不是“搬家”。',
    code: 'transform: translateY(14px); opacity: 0;  /* 初始态 */\n/* 目标态 */ transform: none; opacity: 1;',
    demo: { kind: 'frames', html: '<div class="obj demo-content demo-sequence" aria-hidden="true"><span class="demo-sequence-photo"></span><span class="demo-sequence-number"></span></div>', multi: 3, st: 80, frames: [[0, 'opacity:0; transform:translateY(14px)'], [100, 'opacity:1; transform:none']], e: 'cubic-bezier(0.16,1,0.3,1)', d: '240ms' }
  },
  {
    id: 'unfold', en: 'Unfold / Expand height', zh: '展开', cat: 'entrance',
    alias: ['展开高度', 'accordion open', '撑开'],
    vague: '把它撑开，别突然跳出来',
    say: '高度从 0 展开（grid-template-rows 或 FLIP）',
    def: '容器沿某轴从 0 撑开到内容尺寸。难点在于 height:auto 不可动画——现代解法是 grid-template-rows: 0fr→1fr，或用 FLIP 测量后再动 transform。',
    code: '.wrap { display:grid; grid-template-rows: 0fr; transition: grid-template-rows 280ms ease-out; }\n.wrap[data-open] { grid-template-rows: 1fr; }',
    demo: { kind: 'list', mode: 'accordion', hint: '点击展开/收起' }
  },
  {
    id: 'clip-reveal', en: 'Clip reveal', zh: '裁切揭示', cat: 'entrance',
    alias: ['clip-path 入场', '擦出来', 'wipe'],
    vague: '像被擦出来一样',
    say: 'clip-path inset 从下往上揭开',
    def: '用 clip-path 或 mask 逐渐露出内容，元素本身不动而是“被看见的面积”在变。比淡入更有手工感，适合图片、色块、标题。',
    code: 'clip-path: inset(100% 0 0 0); → clip-path: inset(0);',
    demo: {
      kind: 'frames', html: '<div class="obj demo-content demo-photo clip"><img src="assets/img/p04.jpg" alt="" loading="eager" decoding="async"><span class="demo-photo-caption"><b data-l10n="追光片刻">追光片刻</b><small aria-hidden="true">↗</small></span></div>',
      frames: [[0, 'clip-path:inset(100% 0 0 0)'], [100, 'clip-path:inset(0 0 0 0)']],
      e: 'cubic-bezier(0.76,0,0.24,1)', d: '700ms'
    }
  },
  {
    id: 'mask-reveal', en: 'Mask reveal', zh: '遮罩显影', cat: 'entrance',
    alias: ['渐变遮罩', 'mask-image', '溶解显现'],
    vague: '边缘先出来，中间慢慢显',
    say: '用线性渐变 mask 做扫描式显影',
    def: '用带渐变边缘的 mask 移动，使内容像摄影显影一样从软边界里长出来。比硬边 clip 更柔和，能藏住接缝。',
    code: 'mask-image: linear-gradient(120deg, transparent, #000 40%, transparent 80%);\nmask-position: -100% → 200%;',
    demo: {
      kind: 'frames', html: '<div class="obj img masked"></div>',
      frames: [[0, 'mask-position:-120% 0'], [100, 'mask-position:220% 0']],
      e: 'ease-in-out', d: '1500ms', loop: true
    }
  },
  {
    id: 'blur-in', en: 'Blur in / Rack in', zh: '虚化显影入场', cat: 'entrance',
    alias: ['模糊进场', '聚焦', 'rack focus'],
    vague: '从糊到清楚',
    say: 'blur(12px)→0 + scale 1.06→1 显影入场',
    def: '从模糊到清晰，模拟相机对焦或记忆浮现。GPU 成本较高，移动端建议只在首屏单次使用，不做循环。',
    code: 'filter: blur(12px) → none;  /* 与 scale 1.06→1 同步 */',
    demo: { kind: 'frames', html: '<div class="obj demo-content demo-photo"><img src="assets/img/p13.jpg" alt="" loading="eager" decoding="async"><span class="demo-photo-caption"><b data-l10n="午后光线">午后光线</b><small aria-hidden="true">↗</small></span></div>', frames: [[0, 'opacity:0; filter:blur(10px); transform:scale(1.08)'], [100, 'opacity:1; filter:blur(0); transform:scale(1)']], e: 'cubic-bezier(0.16,1,0.3,1)', d: '760ms' }
  },
  {
    id: 'flip-in', en: 'Flip in', zh: '翻转入场', cat: 'entrance',
    alias: ['3D 翻面进来', 'rotateY 入场'],
    vague: '像卡片翻面那样进来',
    say: 'rotateY(-90deg)→0，带 perspective',
    def: '围绕自身轴旋转 90° 进入，需要 perspective 才成立，否则退化成横向挤压。适合卡片、图片墙、封面。',
    code: 'perspective: 900px; transform: rotateY(-90deg) → rotateY(0);',
    demo: { kind: 'frames', html: '<div class="obj demo-content demo-photo demo-photo-portrait"><img src="assets/img/p14.jpg" alt="" loading="eager" decoding="async"><span class="demo-photo-caption"><b data-l10n="光影手记">光影手记</b><small aria-hidden="true">↗</small></span></div>', frames: [[0, 'opacity:0; transform:perspective(700px) rotateY(-92deg)'], [100, 'opacity:1; transform:perspective(700px) rotateY(0)']], e: 'cubic-bezier(0.16,1,0.3,1)', d: '720ms' }
  },
  {
    id: 'stack-in', en: 'Stack in', zh: '层叠入场', cat: 'entrance',
    alias: ['卡片堆叠', '叠放', 'deck'],
    vague: '几张卡叠在一起依次出来',
    say: 'z 轴层叠 + 依次上移，形成 deck 效果',
    def: '多个元素沿深度方向略微偏移并缩小，形成一叠；再依次抽出。常用于账单、票券、作品集分组。',
    code: 'transform: translateY(calc(var(--i) * -8px)) scale(calc(1 - var(--i) * 0.04));',
    demo: {
      kind: 'frames', html: '<div class="stack"><s class="deck"><i class="obj card"></i></s><s class="deck"><i class="obj card"></i></s><s class="deck"><i class="obj card"></i></s></div>',
      frames: [[0, 'opacity:0; transform:translateY(28px) scale(.92)'], [100, 'opacity:1; transform:none']],
      e: 'cubic-bezier(0.16,1,0.3,1)', d: '620ms', stack: true, st: 130
    }
  },
  {
    id: 'wipe-in', en: 'Wipe in', zh: '擦入 / 划入', cat: 'entrance',
    alias: ['擦除转场', 'wiper', '推进色块'],
    vague: '一道色块扫过去就把内容带出来',
    say: '色块 wipe 扫过，扫过之后露出新内容',
    def: '一个实心形状扫过画面，在其背后替换内容。比淡入更有编辑感和节奏感，常用于图片切换和章节转场。',
    code: '/* 覆盖层 scaleX 0→1（transform-origin:left），再 100%→0（origin:right） */',
    demo: { kind: 'frames', html: '<div class="wipepair demo-wipe"><div class="obj demo-content demo-photo wp wp-a"><img src="assets/img/p13.jpg" alt="" loading="eager" decoding="async"><span class="demo-photo-caption"><b data-l10n="午后光线">午后光线</b><small aria-hidden="true">↗</small></span></div><div class="obj demo-content demo-photo wp wp-b"><img src="assets/img/p04.jpg" alt="" loading="eager" decoding="async"><span class="demo-photo-caption"><b data-l10n="追光片刻">追光片刻</b><small aria-hidden="true">↗</small></span></div><i class="wipebar"></i></div>', frames: [[0, 'transform:scaleX(0); transform-origin:left'], [22, 'transform:scaleX(1); transform-origin:left'], [25, 'transform:scaleX(1); transform-origin:right'], [47, 'transform:scaleX(0); transform-origin:right'], [50, 'transform:scaleX(0); transform-origin:right'], [72, 'transform:scaleX(1); transform-origin:right'], [75, 'transform:scaleX(1); transform-origin:left'], [97, 'transform:scaleX(0); transform-origin:left'], [100, 'transform:scaleX(0); transform-origin:left']], e: 'cubic-bezier(0.76,0,0.24,1)', d: '1100ms', loop: true, wipe: true }
  },
  {
    id: 'glitch-in', en: 'Glitch in', zh: '故障式入场', cat: 'entrance',
    alias: ['信号干扰', 'RGB 分离', 'datamosh'],
    vague: '那种坏掉、信号不好的出现方式',
    say: 'RGB 通道分离 + 随机位移，3–5 帧后稳定',
    def: '用错位、色差、扫描线模拟信号损坏的出现方式。风格强烈，属于审美调味，必须短（<400ms）且只在特定语境使用。',
    code: '/* 多层错位副本 + mix-blend-mode: screen + steps() 抖动 */',
    demo: { kind: 'frames', html: '<div class="obj txt glitch" data-text="MOTION">MOTION</div>', frames: [[0, 'opacity:0; --glitch-a:1; --glitch-x:9px; --glitch-line:1; transform:translateX(-6px) skewX(8deg)'], [30, 'opacity:1; --glitch-a:.92; --glitch-x:6px; --glitch-line:.9; transform:translateX(5px) skewX(-6deg)'], [60, '--glitch-a:.7; --glitch-x:3px; --glitch-line:.55; transform:translateX(-3px)'], [100, 'opacity:1; --glitch-a:0; --glitch-x:0px; --glitch-line:0; transform:none']], e: 'steps(3)', d: '380ms' }
  },

  /* ================= 4. 出场 ================= */
  {
    id: 'fade-out', en: 'Fade out', zh: '淡出', cat: 'exit',
    alias: ['渐隐', '消失'],
    vague: '让它消失掉',
    say: '160ms ease-in 淡出后卸载',
    def: '透明度归零后移除。出场几乎都该比入场更快（约一半时长），因为用户已经知道它要去哪，不需要再看清过程。',
    code: 'animation: fade-out 160ms ease-in both;',
    demo: { kind: 'frames', frames: [[0, 'opacity:1'], [100, 'opacity:0']], e: 'ease-in', d: '200ms' }
  },
  {
    id: 'slide-out', en: 'Slide out', zh: '滑出', cat: 'exit',
    alias: ['推出', '离开画面'],
    vague: '把它推走',
    say: '沿进入方向反向 slide-out + ease-in',
    def: '平移出画面。方向要与进入方向一致或对称，否则破坏了用户对空间位置的记忆。',
    code: 'transform: none → translateX(100%);',
    demo: { kind: 'frames', frames: [[0, 'opacity:1; transform:none'], [100, 'opacity:0; transform:translateX(48px)']], e: 'cubic-bezier(0.32,0,0.67,0)', d: '420ms' }
  },
  {
    id: 'scale-out', en: 'Scale out / Shrink away', zh: '缩小退场', cat: 'exit',
    alias: ['缩回去', '被吸走'],
    vague: '缩掉吧',
    say: 'scale 1→0.94 + 淡出，暗示回到来源',
    def: '缩小消失。若缩小方向指向它“来自哪里”（比如导航图标、购物车），能强化空间归属感。',
    code: 'transform: scale(1) → scale(.92);',
    demo: { kind: 'frames', frames: [[0, 'opacity:1; transform:scale(1)'], [100, 'opacity:0; transform:scale(.8)']], e: 'ease-in', d: '360ms' }
  },
  {
    id: 'collapse-exit', en: 'Collapse', zh: '折叠收起', cat: 'exit',
    alias: ['收起来', '高度归零'],
    vague: '别了之后下面内容不要跳',
    say: '高度收起 240ms，让后续内容平滑上移',
    def: '退场同时收回自己占据的空间，让后面的内容补位。处理不好会出现“下方内容猛地一跳”，这是删除列表项最常见的观感问题。',
    code: 'grid-template-rows: 1fr → 0fr;  /* 或用 FLIP 补位 */',
    demo: { kind: 'drag', mode: 'swipe', hint: '向左滑走一项，看补位' }
  },
  {
    id: 'dissolve', en: 'Dissolve', zh: '溶解', cat: 'exit',
    alias: ['交叉溶解', '化开'],
    vague: '两个画面互相化开',
    say: 'cross-dissolve：A 淡出的同时 B 淡入，重叠 200ms',
    def: '两镜以重叠透明度交接（交叉溶解），或内容自身碎裂消散。是电影语言里“时间流逝/柔和过渡”的经典记号。',
    code: '/* A: opacity 1→0 与 B: 0→1 同时进行 */',
    demo: { kind: 'frames', html: '<div class="obj img diss a"></div><div class="obj img diss b"></div>', frames: [[0, 'opacity:1'], [100, 'opacity:0']], e: 'linear', d: '1400ms', loop: true, alt: true, dissolve: true }
  },
  {
    id: 'unmount', en: 'Exit animation before unmount', zh: '卸载前退场', cat: 'exit',
    alias: ['先退场再移除', 'exit 动画', 'DOM 移除时机'],
    vague: '怎么它一下就没了',
    say: '等退场动画播完（或用 transitionend）再移除 DOM',
    def: '工程术语：元素必须先播放退场动画、再真正从 DOM 中移除。框架里最典型的坑——state 一改元素立刻消失，退场动画根本没机会执行。',
    code: 'await finished(el); el.remove(); /* Web Animations API */',
    demo: { kind: 'frames', frames: [[0, 'opacity:1; transform:none'], [100, 'opacity:0; transform:translateY(16px)']], e: 'ease-in', d: '420ms', loop: true, alt: true, hint: '播完再移除' }
  },
  {
    id: 'staggered-exit', en: 'Staggered exit', zh: '错峰退场', cat: 'exit',
    alias: ['依次消失', '倒序退场'],
    vague: '一个一个撤掉',
    say: '退场也保持 stagger，必要时倒序',
    def: '一组元素依次退场。与入场顺序相反（后进先出）时更符合栈的心智模型，如通知、向导步骤。',
    code: 'animation-delay: calc((var(--n) - var(--i)) * 40ms);',
    demo: { kind: 'frames', multi: 5, st: 60, frames: [[0, 'opacity:1; transform:none'], [100, 'opacity:0; transform:translateY(-12px) scale(.96)']], e: 'ease-in', d: '380ms', loop: true, alt: true }
  },

  /* ================= 5. 变换与三维 ================= */
  {
    id: 'translate', en: 'Translate', zh: '平移', cat: 'transform',
    alias: ['位移', 'move', 'translate3d'],
    vague: '把它挪个位置',
    say: 'translate(x,y) 平移，不走布局',
    def: '改变位置而不影响周围元素，性能最好的移动方式。写 translate3d/translateZ(0) 可以强制元素上独立合成层。',
    code: 'transform: translate3d(0, -8px, 0);',
    demo: { kind: 'frames', frames: [[0, 'transform:translateX(-50px)'], [100, 'transform:translateX(50px)']], e: 'cubic-bezier(0.65,0,0.35,1)', d: '800ms', loop: true, alt: true }
  },
  {
    id: 'scale', en: 'Scale', zh: '缩放', cat: 'transform',
    alias: ['放大', '变小', 'zoom'],
    vague: '变大一点点',
    say: 'scale 1→1.04，别超过 1.1',
    def: '改变视觉尺寸而不改变布局盒。用于 hover 抬升、强调、加载占位。注意文字被放大后会发虚，超过约 1.08 建议改用 font-size 过渡或矢量渲染。',
    code: 'transition: transform 200ms ease-out;\n:hover { transform: scale(1.04); }',
    demo: { kind: 'frames', frames: [[0, 'transform:scale(.82)'], [100, 'transform:scale(1.1)']], e: 'ease-in-out', d: '900ms', loop: true, alt: true }
  },
  {
    id: 'rotate', en: 'Rotate', zh: '旋转', cat: 'transform',
    alias: ['转动', 'spin', '转圈'],
    vague: '转一圈',
    say: 'rotate(360deg) 匀速循环',
    def: '围绕 transform-origin 转动。加载图标、箭头翻向、进度环都靠它；起始角度最好是 0/90/180 的整数关系，收尾才不歪。',
    code: 'animation: spin 1.4s linear infinite;',
    demo: { kind: 'frames', html: '<div class="obj demo-content demo-compass" aria-hidden="true"><svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="45" stroke="currentColor" stroke-opacity=".25"/><circle cx="50" cy="50" r="34" stroke="currentColor" stroke-opacity=".3" stroke-dasharray="1 5"/><path d="M50 3v8m0 78v8M3 50h8m78 0h8" stroke="currentColor"/><path d="m50 18 10 32-10 32-10-32Z" stroke="currentColor" stroke-width="1.2"/><path d="m50 18 10 32H50Z" fill="currentColor"/><circle cx="50" cy="50" r="3" fill="currentColor"/></svg></div>', frames: [[0, 'transform:rotate(0deg)'], [100, 'transform:rotate(360deg)']], e: 'linear', d: '1600ms', loop: true }
  },
  {
    id: 'skew', en: 'Skew', zh: '斜切', cat: 'transform',
    alias: ['倾斜变形', '错切'],
    vague: '让它有速度感地歪一下',
    say: 'skewX 与横向速度联动，形成拖拽感',
    def: '沿轴错切，把矩形变成平行四边形。与横向移动速度绑定时能制造“被拽着跑”的惯性错觉，常见于跑跳角色和卡片甩动。',
    code: 'transition: transform 220ms ease-out;\n[data-fast] { transform: skewX(-6deg); }',
    demo: { kind: 'frames', frames: [[0, 'transform:translateX(-42px) skewX(8deg)'], [50, 'transform:translateX(0) skewX(0deg)'], [100, 'transform:translateX(42px) skewX(-8deg)']], e: 'cubic-bezier(0.65,0,0.35,1)', d: '1100ms', loop: true, alt: true }
  },
  {
    id: 'perspective', en: 'Perspective', zh: '透视', cat: 'transform',
    alias: ['视距', '3D 深度', 'perspective-origin'],
    vague: '让 3D 看起来有厚度',
    say: '父层 perspective: 800px，子元素才具备真实纵深',
    def: '设定观察者到屏幕的距离，值越小畸变越强。没有 perspective，rotateX/Y 就退化成平面挤压——这是“假 3D”最常见的成因。',
    code: '.stage { perspective: 800px; }  /* 父级 */\n.card  { transform: rotateY(24deg); }',
    demo: { kind: 'two', a: { label: '无 perspective（挤压）', html: '<div class="obj card"></div>', frames: [[0, 'transform:rotateY(-60deg)'], [100, 'transform:rotateY(60deg)']], e: 'ease-in-out', d: '1200ms' }, b: { label: 'perspective: 600px（有纵深）', html: '<div class="obj card persp"></div>', frames: [[0, 'transform:rotateY(-60deg)'], [100, 'transform:rotateY(60deg)']], e: 'ease-in-out', d: '1200ms' } }
  },
  {
    id: 'tilt', en: '3D Tilt', zh: '跟随倾斜', cat: 'transform',
    alias: ['tilt 效果', '鼠标倾斜', '陀螺仪卡片'],
    vague: '卡片跟着鼠标歪一下',
    say: '按光标位置映射 rotateX/rotateY ±8°',
    def: '根据光标（或设备陀螺仪）位置映射 rotateX/rotateY，让卡片像被光照着的实体。幅度控制在 6–10°，超过就变玩具。',
    code: 'const rx = (0.5 - y / h) * 12, ry = (x / w - 0.5) * 12;\nel.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg)`;',
    demo: { kind: 'frames', html: '<div class="obj card tilt-target persp"></div>', behavior: 'tilt', hint: '在卡片里移动鼠标' }
  },
  {
    id: 'card-flip', en: 'Card flip', zh: '卡片翻面', cat: 'transform',
    alias: ['翻转', '正反面', 'backface'],
    vague: '翻到背面看详情',
    say: 'rotateY(180deg) 换面，配合 backface-visibility',
    def: '绕垂直轴 180° 换到另一面，是“原地换内容”的空间化表达。需要处理背面镜像（backface-visibility:hidden）与翻转中的可读性。',
    code: '.front, .back { backface-visibility: hidden; }\n.card.is-flipped { transform: rotateY(180deg); }',
    demo: { kind: 'list', mode: 'flip', hint: '点击翻面' }
  },
  {
    id: 'transform-origin', en: 'Transform origin', zh: '变换原点', cat: 'transform',
    alias: ['轴心', '基准点', '缩放中心'],
    vague: '它为什么是往中间缩的，我要从角上缩',
    say: 'transform-origin 设为 bottom center，从底部生长',
    def: '缩放与旋转围绕的锚点。下拉菜单应以 top 为原点展开（从触发点生长），从中心展开会显得“凭空出现”。',
    code: 'transform-origin: top right;',
    demo: { kind: 'two', a: { label: 'origin: center', frames: [[0, 'transform:scale(.2)'], [100, 'transform:scale(1)']], e: 'cubic-bezier(0.16,1,0.3,1)', d: '600ms' }, b: { label: 'origin: bottom left', html: '<div class="obj card o-bl"></div>', frames: [[0, 'transform:scale(.2)'], [100, 'transform:scale(1)']], e: 'cubic-bezier(0.16,1,0.3,1)', d: '600ms' } }
  },
  {
    id: 'origin-aware', en: 'Origin-aware animation', zh: '来源感知动效', cat: 'transform',
    alias: ['从点击处生长', 'spatial origin'],
    vague: '菜单要从我点的那个按钮长出来',
    say: '按触发元素位置动态计算 transform-origin',
    def: '让动画的原点跟随实际触发点，而不是写死。Material 的 ripple 从触点扩散、FloatingActionBar 从 FAB 生长，都属于这一类，是“空间一致性”的具体实现。',
    code: 'el.style.transformOrigin = `${cx}px ${cy}px`;',
    demo: { kind: 'frames', html: '<div class="obj sheet origin-demo"></div>', behavior: 'originAware', hint: '点舞台上任意位置' }
  },
  {
    id: 'rotate3d', en: 'rotate3d / axis rotation', zh: '任意轴旋转', cat: 'transform',
    alias: ['rotateX', 'rotateZ', '轴向'],
    vague: '绕斜着的那根轴翻',
    say: 'rotate3d(1,1,0, 180deg) 绕对角轴翻',
    def: '指定任意空间轴向做旋转，用于骰子、魔方、封面墙。轴向量无需归一化，但必须与容器 perspective 配合。',
    code: 'transform: rotate3d(1, 1, 0, 160deg);',
    demo: { kind: 'frames', html: '<div class="obj card persp"></div>', frames: [[0, 'transform:rotate3d(1,1,0,0deg)'], [100, 'transform:rotate3d(1,1,0,360deg)']], e: 'ease-in-out', d: '1600ms', loop: true }
  },
  {
    id: 'depth-layers', en: '2.5D depth', zh: '2.5D 分层', cat: 'transform',
    alias: ['2.5 维', '图层纵深', '伪 3D'],
    vague: '看起来有前后层次',
    say: 'translateZ 分层 + 整体 rotateX，做 2.5D 场景',
    def: '在真实 3D 空间里摆放 2D 图层。成本低、风格清晰，是网页做“立体设备展示”“卡片空间”的主流手法。',
    code: '.layer { transform: translateZ(calc(var(--z) * 1px)); }',
    demo: { kind: 'frames', html: '<div class="d25"><i class="obj card l"></i><i class="obj card m"></i><i class="obj card f"></i></div>', frames: [[0, 'transform:rotateX(0) rotateY(0)'], [100, 'transform:rotateX(18deg) rotateY(-22deg)']], e: 'ease-in-out', d: '1400ms', loop: true, alt: true, scene: true }
  },

  /* ================= 6. 状态切换与转场 ================= */
  {
    id: 'crossfade', en: 'Crossfade', zh: '交叉淡入淡出', cat: 'state',
    alias: ['叠化', '交替透明', 'fade swap'],
    vague: '两张图之间自然换',
    say: 'crossfade 250ms，重叠期各 50% 不透明',
    def: '旧内容淡出的同时新内容淡入。最安全也最平淡的换态方式：完全没有空间信息，因此不适合方向感强的导航。',
    code: '.a { opacity: 1 → 0 } .b { opacity: 0 → 1 }  /* 同时 */',
    demo: { kind: 'morph', mode: 'crossfade' }
  },
  {
    id: 'continuity', en: 'Continuity transition', zh: '连续性转场', cat: 'state',
    alias: ['保持连续', '不换场'],
    vague: '切换时别让东西乱跳',
    say: '保持共同元素连续，只让差异部分动',
    def: '转场中维持视觉对象的身份不中断：同一个标题、同一张图跨状态保持位置连续，只动变化的部分。这是降低“切换迷失感”的核心手法。',
    code: '/* 静态部分不参与动画，仅对 diff 做过渡 */',
    demo: { kind: 'morph', mode: 'continuity' }
  },
  {
    id: 'morph', en: 'Morph', zh: '形变', cat: 'state',
    alias: ['形状变形', 'path morph', '变形'],
    vague: '圆变成播放键那个三角',
    say: 'SVG path morph：圆 ⇄ 三角，同锚点数',
    def: '一个形状连续变成另一个形状。要求两个路径的点数一致（或用 flubber / MorphSVGPlugin 补齐），否则会变成一坨糊。',
    code: '/* 两个同结构 path 之间插值 */\ngsap.to("#p", { morphSVG: "#target", duration: 0.5 });',
    demo: { kind: 'morph', mode: 'path' }
  },
  {
    id: 'shared-element', en: 'Shared element transition', zh: '共享元素转场', cat: 'state',
    alias: ['hero animation', '连续元素', '图片放大过渡'],
    vague: '点一张缩略图，它要像镜头推进一样变成大图',
    say: '列表里的图片放大成详情主图，返回时沿原路缩回',
    def: '列表缩略图与详情主图代表同一张图片。切换时让这张图连续改变位置、大小和圆角，用户就能看懂它从哪里展开、又回到哪里。实现时可以给两端的元素设置相同的转场名称。',
    code: '/* 更新 DOM 前后，为同一张图设置相同且唯一的名称 */\nsource.style.viewTransitionName = "hero";\ndocument.startViewTransition(() => showDetail());',
    demo: { kind: 'drag', mode: 'shared', hint: '点击封面放大，再点同一封面收回' }
  },
  {
    id: 'layout-animation', en: 'Layout animation', zh: '布局动画', cat: 'state',
    alias: ['自动布局过渡', '位置变化补间'],
    vague: '加了个东西别整个页面乱跳',
    say: '有内容新增、删除或改尺寸时，让周围内容平滑让位',
    def: '内容增删或尺寸变化时，相关元素从旧位置平滑移动到新位置。可由动画框架、浏览器转场能力或 FLIP 等方式实现。',
    code: '<motion.div layout transition={{ type: "spring", stiffness: 350, damping: 30 }}>',
    demo: { kind: 'list', mode: 'layout', hint: '点按钮增删列表项' }
  },
  {
    id: 'flip', en: 'FLIP technique', zh: 'FLIP 卡片平滑换位', cat: 'state',
    alias: ['First Last Invert Play', '反转变换'],
    vague: '列表重排时我想要丝滑地互换位置',
    say: '先记下卡片原来的位置，重新排好后再平滑移过去（FLIP）',
    def: 'FLIP 是 First、Last、Invert、Play 的缩写：记录变化前后的位置，用反向位移把元素放回起点，再播放到新位置。它通常能减少逐帧布局计算，但是否流畅仍取决于页面和设备。',
    code: 'const first = el.getBoundingClientRect();\napplyNewLayout();\nconst last = el.getBoundingClientRect();\nel.animate([{ transform: `translate(${first.x - last.x}px, ${first.y - last.y}px)` }, { transform: "none" }], { duration: 300, easing: "ease-out" });',
    demo: { kind: 'list', mode: 'reorder', hint: '点“换序”看 FLIP 补位' }
  },
  {
    id: 'accordion', en: 'Accordion / Collapse', zh: '手风琴', cat: 'state',
    alias: ['折叠面板', '展开收起', 'disclosure'],
    vague: '点开一段文字能撑开',
    say: 'accordion：单开互斥 + 高度补间 + 图标 rotate',
    def: '一组互斥展开的面板，展开时高度补间、指示图标旋转。注意收起后再展开的滚动位置保持，是无障碍与体验的分水岭。',
    code: 'details { transition: height 240ms ease-out; }',
    demo: { kind: 'list', mode: 'accordion', hint: '点击标题' }
  },
  {
    id: 'direction-aware', en: 'Direction-aware transition', zh: '方向感知转场', cat: 'state',
    alias: ['前进后退不同方向', 'swipe 方向'],
    vague: '返回的时候要反着滑回来',
    say: '前进从右滑入，返回向左滑出（读书写方向）',
    def: '根据导航方向决定动画方向。前进/后退使用镜像的运动，能替用户建立“层级在水平轴上”的空间模型；忽略方向会让栈的概念崩塌。',
    code: 'const sign = isBack ? -1 : 1;  /* translateX(sign * 100%) */',
    demo: { kind: 'drag', mode: 'direction', hint: '点“前进/返回”' }
  },
  {
    id: 'tab-indicator', en: 'Sliding indicator', zh: '滑动指示条', cat: 'state',
    alias: ['下划线跟随', 'tab 滑块', 'segmented control'],
    vague: '分段选项的底色要滑到新选项下面',
    say: '切换选项时，指示条跟着滑过去，并调整到合适的宽度',
    def: '选中态由同一个滑块从旧选项连续移动到新选项，并同步改变宽度。用 transform 与宽度过渡表达位置和尺寸变化；选中文字颜色跟随切换，形成清楚的落点反馈。',
    code: 'indicator.style.transform = `translateX(${x}px)`;\nindicator.style.width = `${w}px`;',
    demo: { kind: 'list', mode: 'tabs', hint: '点不同标签' }
  },
  {
    id: 'smooth-reorder', en: 'Filter reflow', zh: '筛选后平滑补位', cat: 'state',
    alias: ['过滤后补位', '筛选动画', 'filter reflow'],
    vague: '筛选一换，留下的卡片别跳，新卡片也别从远处飞来',
    say: '留下的卡片平滑补位，离开的淡出，新出现的原地显现',
    def: '筛选后，留下的卡片轻轻移到新位置；不符合条件的卡片淡出，新卡片在最终位置轻柔出现。内容变化看起来像同一组卡片在整理，而不是整块突然刷新。',
    code: '/* 留下的卡片平移补位；新卡片在最终位置淡入 */',
    demo: { kind: 'list', mode: 'filter', hint: '切换标签：留下的卡片平滑补位，新卡片原地显现' }
  },
  {
    id: 'expand-collapse-btn', en: 'Expand on click', zh: '点击就地展开', cat: 'state',
    alias: ['就地展开', '内联展开', 'accordion inline'],
    vague: '别跳转新页，在这条里展开',
    say: '卡片就地展开详情，容器高度与圆角同步过渡',
    def: '元素在不离开当前上下文的前提下变高/变宽以承载详情。关键是内容宽度也要参与过渡，否则文字会先重排再淡入，出现两次跳字。',
    code: 'transition: grid-template-rows 300ms ease, padding 300ms ease;',
    demo: { kind: 'list', mode: 'inline', hint: '点卡片' }
  },

  /* ================= 7. 滚动动效 ================= */
  {
    id: 'scroll-reveal', en: 'Scroll reveal', zh: '滚动显现', cat: 'scroll',
    alias: ['滚动进入', 'fade up on scroll', '进入视口才动'],
    vague: '滚到那里再让它出来',
    say: '进入视口 20% 时触发 rise-in，只播一次',
    def: '元素进入视口时才播放入场动画。必须只播一次（或反向也播），否则上下滚动会看到重复动画，显得廉价。',
    code: 'new IntersectionObserver(([e]) => e.isIntersecting && e.target.classList.add("in"), { threshold: 0.2 }).observe(el);',
    demo: { kind: 'scroll', mode: 'reveal', hint: '在框里滚动' }
  },
  {
    id: 'scroll-driven', en: 'Scroll-driven animation', zh: '滚动驱动动画', cat: 'scroll',
    alias: ['animation-timeline', 'scroll()', 'view()', '跟随滚动进度'],
    vague: '动效进度跟着我滚，不是触发一次',
    say: '滚动进度直接驱动 animation-timeline: view()',
    def: '把滚动进度当作时间轴：滚多少就走多少，可回退可倒放。原生 CSS 用 animation-timeline: scroll()/view()，JS 方案靠 IntersectionObserver + 进度换算。',
    code: '@supports (animation-timeline: view()) {\n  .x { animation: rise linear both; animation-timeline: view(); animation-range: entry 10% cover 40%; }\n}',
    demo: { kind: 'scroll', mode: 'driven', hint: '在框里滚动，进度直接映射' }
  },
  {
    id: 'parallax', en: 'Parallax', zh: '视差', cat: 'scroll',
    alias: ['视差滚动', '多层不同速', '深度错觉'],
    vague: '背景动得慢一点，有纵深',
    say: '背景以 0.3 倍滚动速度位移（视差）',
    def: '不同图层以不同速度移动，制造纵深。位移比是核心参数：0.2–0.5 自然，接近 1 就晕了。移动端慎用——滚动与画面延迟会造成眩晕。',
    code: 'layer.style.transform = `translateY(${scrollY * 0.3}px)`;',
    demo: { kind: 'scroll', mode: 'parallax', hint: '在框里滚动' }
  },
  {
    id: 'sticky-pinning', en: 'Sticky pinning', zh: '吸附固定', cat: 'scroll',
    alias: ['sticky 固定', '钉住', 'pin section'],
    vague: '滚到那里它停住，让内容在它上面走',
    say: 'section position: sticky 钉住 2 屏，期间走内部动画',
    def: '某元素在滚动中固定在视口一段时间（“钉住”），用来承载一段被滚动驱动的动画。Apple 产品页那种“滚很久、图不换”的效果就是 pinning。',
    code: '.pin { position: sticky; top: 0; height: 100vh; }',
    demo: { kind: 'scroll', mode: 'sticky', hint: '滚动：顶部会钉住' }
  },
  {
    id: 'scroll-progress', en: 'Scroll progress', zh: '滚动进度指示', cat: 'scroll',
    alias: ['阅读进度条', '进度条', 'scroll linked bar'],
    vague: '顶部一条线告诉我读到哪了',
    say: '滚动进度映射到 scaleX 的进度条',
    def: '把阅读/流程进度可视化成长度变化。用 transform: scaleX 而非 width，可避免每帧触发布局。',
    code: 'bar.style.transform = `scaleX(${scrollY / (docH - winH)})`;',
    demo: { kind: 'scroll', mode: 'progress', hint: '滚动看顶部进度' }
  },
  {
    id: 'smooth-scroll', en: 'Smooth scroll', zh: '平滑滚动', cat: 'scroll',
    alias: ['惯性滚动', 'lerp 滚动', '锚点滚动'],
    vague: '点导航过去时丝滑滑到位',
    say: 'scroll-behavior: smooth 做锚点补间',
    def: '用补间（lerp/缓动）替代瞬时跳转。注意区分：锚点滚动补间（有益）与整站惯性跟随（会破坏原生手感，需谨慎）。',
    code: 'html { scroll-behavior: smooth; }\nel.scrollIntoView({ behavior: "smooth", block: "center" });',
    demo: { kind: 'scroll', mode: 'smooth', hint: '点标签跳转' }
  },
  {
    id: 'scroll-linked-value', en: 'Scroll-linked value', zh: '滚动映射数值', cat: 'scroll',
    alias: ['映射', 'map range', '进度换算'],
    vague: '滚到一半的时候字号最大',
    say: '把滚动区间映射到 16–48px 字号',
    def: '把某个滚动区间线性映射到任意数值（字号、透明度、旋转、颜色）。核心是三件套：clamp + map + ease，把区间外钳住避免溢出。',
    code: 'const t = clamp((y - a) / (b - a), 0, 1);\nsize = lerp(16, 48, easeOut(t));',
    demo: { kind: 'scroll', mode: 'map', hint: '滚动看数字被映射' }
  },
  {
    id: 'scroll-snap', en: 'Scroll snap', zh: '滚动吸附', cat: 'scroll',
    alias: ['scroll-snap-type', '整屏吸附', '分屏翻页'],
    vague: '滚轮停下时，选中的数字要刚好卡在中间',
    say: '滚动吸附：每个选项对齐中线，惯性停下后落在最近项',
    def: '滚动停下时，浏览器把内容对齐到预设位置。iOS 风格的日期滚轮就是一种常见用法：手指松开后，数字按惯性滑动并吸附到中间的选项。',
    code: '.wheel { scroll-snap-type: y mandatory; }\n.option { scroll-snap-align: center; }',
    demo: { kind: 'scroll', mode: 'snap', hint: '上下滑动月份、日期或年份' }
  },
  {
    id: 'scrollytelling', en: 'Scrollytelling', zh: '滚动叙事', cat: 'scroll',
    alias: ['滚动故事线', '长文交互叙事', '章节驱动'],
    vague: '一边滚一边把故事讲完，图也跟着变',
    say: '分章节 pin + 图表随滚动切换状态',
    def: '用滚动进度承载叙事结构：章节、揭示节奏、图表变化全部由滚动驱动。适合数据新闻与品牌长页；导航成本高，不宜承载任务型功能。',
    code: '/* 每章一个 step，IntersectionObserver 切换 active 状态 */',
    demo: { kind: 'scroll', mode: 'story', hint: '滚动推进剧情' }
  },
  {
    id: 'scroll-hijacking', en: 'Scroll hijacking', zh: '劫持滚动', cat: 'scroll',
    alias: ['强制翻页', '接管滚轮'],
    vague: '滚一下就翻一整屏',
    say: '劫持滚轮做整屏翻页（谨慎）',
    def: '接管浏览器原生滚动，把滚轮事件变成翻页指令。体验风险最高的一类：用户失去位置感、触控板误触发、无障碍问题——除非理由极强，否则不要做。',
    code: '/* 慎用：wheel 事件 preventDefault + 自定义索引 */',
    demo: { kind: 'scroll', mode: 'hijack', hint: '在框里滚一下试试' }
  },
  {
    id: 'ken-burns', en: 'Ken Burns', zh: '肯·伯恩斯效果', cat: 'scroll',
    alias: ['图片缓慢推近', '平移缩放长镜头'],
    vague: '一张静图让它慢慢推近就不呆',
    say: 'Ken Burns：20s 内缓慢 scale 1→1.12 + 平移',
    def: '对静态图像做极缓慢的推拉与平移（源自纪录片），让画面“活着”。时长要长（10–25s）、幅度要小到不易察觉，否则观众会意识到在动。',
    code: 'animation: kb 18s ease-in-out infinite alternate;',
    demo: { kind: 'frames', html: '<div class="obj img wide"></div>', frames: [[0, 'transform:scale(1) translate(0,0)'], [100, 'transform:scale(1.14) translate(-3%, -2%)']], e: 'ease-in-out', d: '6000ms', loop: true, alt: true }
  },
  {
    id: 'infinite-load', en: 'Infinite scroll loading', zh: '无限滚动加载', cat: 'scroll',
    alias: ['瀑布加载', 'sentinel 触发', 'load more'],
    vague: '滚到底自动再来一批，别硬闪',
    say: '哨兵元素进入视口前 300px 预取，追加后不重置滚动位置',
    def: '滚动接近底部时自动加载下一页。体验要点：提前预取（rootMargin）、占位卡片保持骨架、以及绝不把滚动位置弹回顶部。',
    code: 'new IntersectionObserver(cb, { rootMargin: "300px" }).observe(sentinel);',
    demo: { kind: 'scroll', mode: 'loadmore', hint: '滚到底自动补' }
  }
];
