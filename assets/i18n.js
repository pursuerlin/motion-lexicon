/* ============================================================
   i18n.js —— 中英双语：界面文案 + 每个术语的英文释义
   术语正文以 [def, vague, say] 三元组存放，切语言时只改文本节点，
   不重建舞台（避免重挂 199 个演示）。
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

  const UI = {
    zh: {
      brand1: '动效词汇表',
      brand2: 'MOTION LEXICON', search: '搜术语、中文说法或代码：easing / 错峰 / 视差 / will-change …',
      clear: '清空', dark: '亮色', light: '暗色', motionOn: '动效 开', motionOff: '动效 关', recipe: '配方',
      h1a: '让 AI 实现动画的最大障碍', h1b: '不是技术，', h1c: '是词不达意', h1d: '。',
      lede: '你脑子里有画面，却说不出它的名字，于是写出「让它动起来更自然一点」这种谁都接不住的描述。这里整理了一套 Web 动效的专业词汇：从缓动曲线、错峰节奏、遮罩揭示，到滚动叙事、容器变换、物理弹簧——每个词都带可交互实演、含糊说法到专业说法的对照，以及七种框架的可运行代码。一个准确的词，胜过一整段形容词。',
      how1: '每个术语都能看', how1s: '舞台里的动效就是它本人，右上角可重播',
      how2: '每个术语都能用', how2s: '「脑子里的说法 → 说出来的说法」直接照抄进需求或提示词',
      how3: '点「+ 加入配方」', how3s: '把术语攒成一段完整描述，底部一键复制给 AI',
      terms: '术语', cats: '分类', kinds: '实演类型',
      axis: '同一件事有七种分类轴：缓动曲线 · 时长时序 · 入场出场 · 变换 · 状态转场 · 滚动 · 性能。先定轴，再挑词。',
      labHd: '缓动实验室', labEn: 'Easing Lab',
      themeCap: '主题', themeHd: '五套调色板，默认跟随系统的深浅色偏好',
      labP: '先感觉，再命名：拖控制点改曲线，看右侧同一条曲线的真实运动，最后把代码原样复制走。',
      labPick: '选一条曲线', labWatch: '看它运动', labRef: '下方灰色 = 匀速参照',
      labDur: '时长', labDist: '距离', labProp: '动什么',
      labDrag: '拖拽右侧曲线的两个圆点改曲线', labNoDrag: '该曲线由函数采样而来，控制点不可拖',
      labCopy: '复制代码', labCopied: '已复制',
      sideCats: '分类', tip: '提示', tipP: '按 / 定位搜索，Esc 清空。左侧点分类可只看该类。',
      empty: '没有匹配的术语。换个说法试试，比如「弹」「糊」「跟手」「掉帧」。',
      think: '脑子里', sayIt: '说出来', add: '+ 加入配方', added: '已加入', replay: '↻ 重播', copy: '复制', copied: '已复制',
      recTitle: '动效配方', recSub: '把下面这段直接贴给 AI 或写进需求文档', recCollapse: '收起', recCopy: '复制这段描述', recCopied: '已复制到剪贴板',
      recPrefix: '请按下面这套动效规范实现，并给出可直接运行的代码：',
      recSuffix: '要求：使用设计令牌统一曲线与时长，动画优先只动 transform / opacity，并适配 prefers-reduced-motion。',
      refs: '参考与延伸阅读', selfHd: '这个站点自己也是一份用例',
      selfP: '卡片入场用 rise-in + stagger，循环动效离屏即暂停（IntersectionObserver），性能区只动 transform 与 opacity，主题与减弱动效偏好存在 localStorage，并响应 prefers-reduced-motion。',
      nTerms: '个术语', dialect: '代码写法', count: '个分类',
      backTo: '术语图鉴', copyMd: '复制为 Markdown', copiedMd: '已复制', maySay: '你可能会说',
      fav: '收藏', docTitle: '动效词汇表 · 把“那个感觉”说成专业术语',
      dialectHd: '同一条动效 · 七种框架写法',
      codeStatic: '这段是手写实现，不参与方言编译（单条补间才能自动翻译）'
    },
    en: {
      brand1: 'Motion Lexicon',
      brand2: '动效词汇表', search: 'Search terms, phrasing or code: easing / stagger / parallax / will-change …',
      clear: 'Clear', dark: 'Dark', light: 'Light', motionOn: 'Motion on', motionOff: 'Motion off', recipe: 'Recipe',
      h1a: 'The biggest blocker when AI builds animation', h1b: 'is not the tech,', h1c: 'it is not knowing the words', h1d: '.',
      lede: 'You can see the motion but cannot name it, so the brief turns into “make it feel more natural” — a question nobody can answer. This is a working vocabulary for web animation: once you own the words, one term replaces a paragraph of hedging, and both people and models understand it instantly.',
      how1: 'Every term is on screen', how1s: 'The stage plays that exact motion; replay it from the top-right',
      how2: 'Every term is usable', how2s: 'Copy the “you think → say it as” pair straight into a brief or prompt',
      how3: 'Hit “+ add to recipe”', how3s: 'Collect terms into one full spec, then copy it to the AI from the dock',
      terms: 'terms', cats: 'groups', kinds: 'live demo types',
      axis: 'Seven axes describe the same motion: easing · timing · enter/exit · transform · transitions · scroll · performance. Pick the axis, then the word.',
      labHd: 'Easing Lab', labEn: '缓动实验室',
      themeCap: 'Theme', themeHd: 'Five palettes; the default follows your system light/dark setting',
      labP: 'Feel it first, name it second: drag the control points, watch the real motion, copy the code out.',
      labPick: 'Pick a curve', labWatch: 'Watch it move', labRef: 'grey below = linear reference',
      labDur: 'Duration', labDist: 'Distance', labProp: 'Animate',
      labDrag: 'Drag the two handles on the curve to edit it', labNoDrag: 'This curve is sampled from a function — handles disabled',
      labCopy: 'Copy code', labCopied: 'Copied',
      sideCats: 'Groups', tip: 'Tip', tipP: 'Press / to focus search, Esc to clear. Click a group to isolate it.',
      empty: 'No match. Try a plainer word: “bounce”, “blur”, “laggy”, “dropped”.',
      think: 'You think', sayIt: 'Say it as', add: '+ add to recipe', added: 'added', replay: '↻ replay', copy: 'copy', copied: 'copied',
      recTitle: 'Motion recipe', recSub: 'Paste this to an AI or into the spec doc', recCollapse: 'Collapse', recCopy: 'Copy this brief', recCopied: 'Copied to clipboard',
      recPrefix: 'Implement this motion spec and return runnable code:',
      recSuffix: 'Constraints: drive curves and durations from design tokens, animate transform / opacity only, and honour prefers-reduced-motion.',
      refs: 'Further reading', selfHd: 'This page is itself a worked example',
      selfP: 'Cards enter with rise-in + stagger, looping demos pause off-screen (IntersectionObserver), the performance section animates transform and opacity only, theme and motion preferences live in localStorage and prefers-reduced-motion is respected.',
      nTerms: 'terms', dialect: 'Dialect', count: 'groups',
      backTo: 'Glossary', copyMd: 'Copy as Markdown', copiedMd: 'Copied', maySay: 'You might say',
      fav: 'Saved', docTitle: 'Motion Lexicon · say the feeling in proper terms',
      dialectHd: 'One motion · seven framework syntaxes',
      codeStatic: 'Hand-written implementation — not machine-translated across dialects (only single tweens are)'
    }
  };

  const CAT_EN = {
    easing: ['Easing & Curves', 'The curve — not the duration — gives motion its personality.'],
    time: ['Duration & Timing', 'How long, when it starts, who waits for whom.'],
    entrance: ['Entrance', 'How something arrives. It is the first motion people judge.'],
    exit: ['Exit', 'Exits should be faster than entrances and must not take the context with them.'],
    transform: ['Transform & 3D', 'Translate, scale, rotate, skew — and perspective to fake depth.'],
    state: ['State & Transitions', 'When A becomes B, keep the eye tracking and the spatial model intact.'],
    scroll: ['Scroll Motion', 'Use the scrollbar as a timeline instead of an input device.'],
    feedback: ['Interaction Feedback', 'Every tap, hover and drag deserves an answer.'],
    loop: ['Loop & Ambient', 'Nothing happens, yet the page must not look dead.'],
    text: ['Typography Motion', 'Text that arrives, decodes, counts and glitches.'],
    polish: ['Polish & FX', 'The last 5% that separates “it moves” from “it looks good”.'],
    camera: ['Camera & Story', 'Do not move the elements — move the eye watching them.'],
    principles: ['Principles', 'Rules Disney set in the 1930s that still govern UI motion.'],
    perf: ['Performance', 'Drop one frame and every carefully tuned curve looks cheap.'],
    runtime: ['3D & Runtime', 'When CSS tweens are not enough: shaders, canvas, bones, state machines, render loops.'],
    compound: ['Compound Patterns', 'One term is a part. When pointer, scroll and tap drive a whole screen, you need a word for the choreography.']
  };

  /* ---------- 短标签：中文原文就是 key ----------
     这些串活在 params.js / compound.js 的数据和舞台模板里，给每条都开一个 i18n key
     会把两处数据都改一遍；改成「原文即 key」，中文侧零维护（切回 zh 就直接显示 key），
     要加第三种语言也只是再补一张表。缺词条时回落中文，不会出空标签。 */
  const LABEL = {
    /* 卡片控制条 */
    '时长': 'Duration', '错峰': 'Stagger', '主排速度': 'Primary speed', '次排速度': 'Secondary speed',
    '位移': 'Move', '倾斜': 'Tilt', '偏转': 'Deflect', '光圈': 'Aperture', '力场半径': 'Field radius',
    '半径': 'Radius', '发射率': 'Emission rate', '圈数': 'Loops', '圈速': 'Orbit speed',
    '处理时长': 'Work time', '大小': 'Size', '实例数': 'Instances', '尺寸': 'Size', '层距': 'Layer gap',
    '展开': 'Spread', '展开宽': 'Unfold width', '展开高': 'Unfold height', '峰值': 'Peak', '帧数': 'Frames',
    '帧率': 'Frame rate', '幅度': 'Amplitude', '开度': 'Opening', '弹性': 'Elasticity', '拉伸': 'Stretch', '刚度 k': 'Stiffness k',
    '推镜': 'Dolly in', '播放倍速': 'Playback rate', '收敛': 'Convergence', '收缩': 'Shrink',
    '旋转': 'Rotate', '模拟帧率': 'Sim rate', '生长时长': 'Grow time', '目标': 'Target', '自转': 'Spin',
    '节点': 'Nodes', '行程': 'Travel', '行间隔': 'Line gap', '衰减': 'Decay', '视距': 'View distance',
    '角': 'Angle', '角度': 'Angle', '质量 m': 'Mass m', '跟随': 'Follow', '重力': 'Gravity',
    '阻塞': 'Block', '阻尼 c': 'Damping c', '雾增益': 'Fog gain',
    /* 驱动方式徽标 */
    '指针': 'Pointer', '滚动': 'Scroll', '悬停': 'Hover', '点击': 'Tap', '拖拽': 'Drag',
    /* 图注 */
    '夜奔': 'Night run', '站台': 'Platform', '霓虹': 'Neon', '雪线': 'Snowline', '逆光': 'Backlit',
    '展厅': 'Gallery', '夜车': 'Night train', '塔顶': 'Pagoda', '灯河': 'River of lights',
    '纹理': 'Texture', '掠影': 'Glimpse', '回廊': 'Cloister', '回眸': 'Glance back',
    /* 界面外壳 */
    '灰色=匀速参照': 'grey = linear reference', '实演 · 当前曲线': 'Live · current curve',
    '位移 X': 'Move X', '位移 Y': 'Move Y', '位移+旋转': 'Move + Rotate', '缩放': 'Scale',
    '慢放': 'Slow-mo', '循环播放': 'Loop', '个术语': 'terms', '移除': 'Remove', '配方文本': 'Recipe text',
    '匀速。只适合无始无终的持续运动。': 'Constant speed. Only for motion with no start or end.',
    '加速离场，物体“被甩走”。': 'Accelerating exit — the object gets thrown away.',
    '默认首选：带速度进场，平稳停住。': 'The safe default: arrives with speed, settles smoothly.',
    '长距离位移、来回切换。': 'Long travels and back-and-forth switches.',
    '戏剧化减速，前 20% 走完 80%。': 'Dramatic deceleration: 80% done in the first 20%.',
    '末端过冲一次，做 pop / 弹入。': 'One overshoot at the end, for pop and spring-ins.',
    '起手反向预备（anticipation）。': 'It moves back first: anticipation.',
    '橡皮筋震荡，需要 JS 驱动。': 'Rubber-band oscillation; needs JS to drive it.',
    '落地衰减弹跳，需要 JS 驱动。': 'Decaying bounces on landing; needs JS to drive it.',
    '末端极缓，常用于大面积转场。': 'Barely moving at the end; good for large transitions.',
    'Material 3 的强调曲线。': 'The emphasized curve of Material 3.',
    'Material 标准曲线。': 'The standard curve of Material.',
    '两端猛、中间极快，适合切页。': 'Sharp at both ends, very fast between them: page switches.',
    '离散台阶，逐帧/像素风。': 'Discrete steps for sprite and pixel motion.',
    'Easings.net（简中）': 'Easings.net (zh-CN)',
    '互联网上正在跑的同类实现 · 和本页演示对照着看': 'The same pattern running on real sites, side by side with the demo here',
    '反向滚动，最容易暴露卡顿的一类': 'Reversed scrolling, the easiest kind to expose jank',
    '另一版 ↗': 'Another build',
    '同一套排布，看它怎么做前后层次': 'Same layout; watch how it layers depth',
    '同一批卡片滚上来时逐层压住前一张': 'Each card pins over the previous one as you scroll',
    '图片蒙版揭示，落地页高频': 'Image mask reveal, a landing-page staple',
    '在框里快速滚动': 'Scroll fast inside the box',
    '在框里滚一下试试': 'Give it a scroll in the box',
    '在框里滚动，进度直接映射': 'Scroll the box; progress maps straight through',
    '在框里移动鼠标': 'Move the pointer inside the box',
    '在立方体上拖动': 'Drag on the cube',
    '头部收缩同时浮出投影': 'Header shrinks and lifts a shadow',
    '封面流：中间放大两侧展开': 'Coverflow: centre grows, sides fan out',
    '封面滚到顶后缩成固定页眉': 'The hero collapses into a fixed header',
    '左侧钉住、右侧滚动的经典双栏': 'Classic two-column: left pins, right scrolls',
    '左右拖动': 'Drag left or right',
    '左右拖动圆筒': 'Drag the drum left or right',
    '带标记点的分段滚动吸附': 'Sectional snap with tick marks',
    '悬停试试': 'Hover it',
    '把光标移近按钮': 'Bring the cursor near the button',
    '把卡片拽出边界再松手': 'Pull the card past the edge, then let go',
    '抓住方块拖，松手看惯性': 'Grab the block; release to feel the inertia',
    '抓住最上面那张甩出去': 'Grab the top card and throw it',
    '拖动分割线': 'Drag the divider',
    '拖动列表项换序': 'Drag rows to reorder them',
    '拖动旋转 · 点击对焦': 'Drag to rotate, tap to focus',
    '拖动滑杆逐帧看': 'Drag the scrubber frame by frame',
    '按住不放': 'Press and hold',
    '按住不放，看进度填满': 'Hold until the bar fills',
    '播完再移除': 'Removed only after it finishes playing',
    '新窗口打开 ↗': 'Open in a new tab',
    '横向轮播版': 'The horizontal carousel version',
    '每次进入自动重播': 'Replays on every entry',
    '注意：结束就弹回（未设 both）': 'Note: it snaps back at the end (no fill: both)',
    '滚到底自动补': 'More loads at the bottom',
    '滚动推进剧情': 'Scroll to advance the story',
    '滚动看数字被映射': 'Scroll and watch the value map',
    '滚动看顶部进度': 'Scroll to drive the top bar',
    '滚动进度条，本站把它做成了环形': 'Scroll progress bar, which this site renders as a ring',
    '滚动阴影提示还有内容': 'A scroll shadow hints there is more below',
    '滚动驱动 3D 模型旋转，商品页常用': 'Scroll drives a 3D model spin, common on product pages',
    '滚动：这条不阻塞': 'Scroll: this one never blocks',
    '滚动：顶部会钉住': 'Scroll: the top pins',
    '点 Input 触发状态迁移': 'Press Input to move the state machine',
    '点“前进/返回”': 'Use forward / back',
    '点“换序”看 FLIP 补位': 'Hit shuffle to watch FLIP fill the gap',
    '点一下': 'Tap',
    '点一下圆钮': 'Tap the dial',
    '点一下扔一个球': 'Tap to drop a ball',
    '点一下撒纸屑': 'Tap for confetti',
    '点一下重新解码': 'Tap to re-decode',
    '点不同标签': 'Pick another tab',
    '点两侧的卡换焦点': 'Tap a side card to move focus',
    '点击卡片放大，再点收回': 'Tap a card to expand, tap again to close',
    '点击展开/收起': 'Tap to expand or collapse',
    '点击标题': 'Tap the heading',
    '点击翻面': 'Tap to flip',
    '点卡片': 'Tap a card',
    '点按钮增删列表项': 'Use the buttons to add and remove rows',
    '点按钮抽一个数': 'Tap to draw a number',
    '点按钮试试': 'Press the button',
    '点标签跳转': 'Pick a tab to jump',
    '点筛选标签': 'Pick a filter',
    '点舞台上任意位置': 'Tap anywhere on the stage',
    '点页签切换': 'Switch a tab',
    '看 WAAPI 版 ↗': 'See the WAAPI build',
    '真实落地参考': 'Shipping examples',
    '真嵌一个 3D 滚动案例，看它怎么保深度': 'A real embedded 3D scroll case; see how depth survives',
    '移动指针，手会跟过来': 'Move the pointer and the hand follows',
    '纵向滚动推横向位移，本站同款': 'Vertical scroll drives horizontal travel, like this site',
    '视差落地实现': 'Parallax in production',
    '轮播里的多层视差': 'Layered parallax inside a carousel',
    '载入实时演示': 'Load the live demo',
    '靠近中间的按钮': 'Come near the middle button',
    '鼠标移到卡片上': 'Put the cursor on the card',
    '3D 排布 / 螺旋画廊的实现在这里最多，按 3D 筛': 'Most 3D layouts and spiral galleries live here — filter by 3D',
    'Chrome DevTools · 性能面板': 'Chrome DevTools performance panel',
    'GSAP 论坛 · 按速度缩放': 'GSAP forum thread on velocity scaling',
    'Material · Cards 规范': 'Material card guidelines',
    'Text Scramble 现场可玩': 'Text scramble you can play with',
    'Velocity Skew 拆解': 'A breakdown of velocity skew',
    '卡片就近发光 / 悬停辉光的现下样板': 'Current samples of proximity glow and hover glow',
    '可以直接改文案看解码过程': 'Edit the copy and watch the decode run',
    '同一个思路换成 scale 的版本': 'The same idea expressed with scale',
    '图表入场动画的密集使用现场': 'Chart entrances used heavily in the wild',
    '官方容器变换规范，写需求时直接引': 'Official container queries spec — cite it straight in a brief',
    '官方插件文档，商用项目多数走这条': 'Official plugin docs; most production work goes this way',
    '官方文档带可跑的示例': 'Official docs with runnable examples',
    '带 React 代码的解码文字组件': 'Scramble component with the React source shown',
    '带代码的 GSAP 案例合集': 'GSAP case studies with code',
    '成品级 hover / 跟随效果目录': 'Catalogue of finished hover and follow effects',
    '拖尾与指针形变': 'Trails and pointer distortion',
    '指针跟随预览卡片的实现': 'How pointer-following preview cards are built',
    '指针驱动整页反应的老牌互动工作室': 'Long-running studio where the pointer drives the whole page',
    '按钮状态转动的官方图例': 'Official figures for button state motion',
    '整站随滚动/路由换主题色的样板': 'A site that swaps its theme colour on scroll and route',
    '液态跟随与共享元素转场': 'Liquid follow and shared-element transitions',
    '滑动关闭的官方位移与缓动规范': 'Official offsets and easing for swipe-to-dismiss',
    '滚动驱动的产品揭幕，商品页天花板': 'Scroll-driven product reveal, top end of product pages',
    '用 DevTools 面板验证合成层是否真的生效': 'Verify in DevTools that a layer really promoted',
    '获奖站里的滚动叙事合集，找同题材参考': 'Award-winning scroll storytelling, good for genre reference',
    '辉光 / 模糊 / 光带一类效果基本都出自它': 'Most glow, blur and light-band effects originate here',
    '速度形变的完整推导，写需求时可直接引': 'Full derivation of velocity deformation, quotable in a brief',
    '遮罩/聚光揭示类交互的实现在这里最多': 'The largest set of mask and spotlight reveals here',
    '隧道/穿越类转场': 'Tunnel and fly-through transitions',
    /* 舞台提示：数据里的 demo.hint，以及演示内部由程序拼出来的短标签 */
    '1 屏内容': '1 screen of content',
    '2 屏内容': '2 screens of content',
    '3 屏内容': '3 screens of content',
    '4 屏内容': '4 screens of content',
    '5 屏内容': '5 screens of content',
    '6 屏内容': '6 screens of content',
    '7 屏内容': '7 screens of content',
    'Tab 我': 'Tab to me',
    'transform · 顺滑': 'transform · smooth',
    '一切从这里开始': 'Everything starts here',
    '三条长度=三档 token': '3 lengths = 3 duration tokens',
    '上传中…': 'Uploading…',
    '下拉刷新': 'Pull down to refresh',
    '入场动画只播一次': 'Entrance plays only once',
    '全部参与渲染': 'Fully rendered',
    '到达最高点': 'Hits the highest point',
    '前进再返回，注意方向对称': 'Forward then back — keep it symmetric',
    '动手拖一下': 'Give it a drag',
    '可拖动播放头': 'Drag the playhead',
    '可用方向键 / 回车操作': 'Arrow keys / Enter work',
    '同一段行程：A 只动 transform，B 每帧写样式后立刻读几何': 'Same trip: A transform, B forced reads',
    '向下拖列表，越过阈值松手': 'Pull down past threshold, release',
    '向左滑走一项，看补位': 'Swipe one left, watch the gap close',
    '向左滑走这张卡': 'Swipe this card left',
    '在几行之间移动鼠标': 'Move the cursor between rows',
    '在卡上移动鼠标': 'Move the cursor over the card',
    '在卡片里移动鼠标': 'Move the cursor inside the card',
    '在按钮上点击任意位置': 'Click anywhere on the button',
    '在框里滚动': 'Scroll inside the frame',
    '增长开始显现': 'Growth starts to show',
    '已保存到云端': 'Saved to the cloud',
    '已发布': 'Published',
    '强制同步布局 · 卡顿': 'Forced layout · janky',
    '抓我': 'Grab me',
    '拖我甩走': 'Drag me, fling me away',
    '按住以确认删除': 'Hold to confirm delete',
    '按住我': 'Hold me',
    '数字是现场量出来的': 'Numbers measured live',
    '普通区块': 'Plain block',
    '沉淀成结论': 'Settles into a takeaway',
    '点一下试试': 'Give it a tap',
    '点我试试': 'Tap me to try',
    '热度退去': 'The hype fades',
    '焦点环': 'Focus ring',
    '第一章 · 起点': 'Chapter 1 · Start',
    '第三块内容': 'Third content block',
    '第三章 · 峰值': 'Chapter 3 · Peak',
    '第二块内容': 'Second content block',
    '第二章 · 转折': 'Chapter 2 · Turning point',
    '第五块内容': 'Fifth content block',
    '第四块内容': 'Fourth content block',
    '第四章 · 结论': 'Chapter 4 · Takeaway',
    '等待审阅': 'Awaiting review',
    '脉冲': 'Pulse',
    '自动循环': 'Loops automatically',
    '自动循环播放': 'Autoplays on a loop',
    '越界试试': 'Drag past the edge',
    '趋势掉头': 'Trend reverses',
    '跳过布局与绘制': 'Skips layout and paint',
    '转码完成': 'Transcode done',
    '轻推提示': 'Nudge to get attention',
    '钉在顶部当锚': 'Pinned to top as an anchor',
    '错误密码': 'Wrong password',
    '抽帧实时读数': 'Frame readout', '24 张实际帧缩略图': '24 real frame thumbnails',
    '左侧是实际预览，右侧接触表标出当前采样帧。': 'Live preview on the left; the contact sheet marks the frame being sampled.',
    '视线跟随实时读数': 'Gaze readout',
    '指针决定目标方向；松开后，视线回到低频游走。': 'The pointer sets the target; release it and the gaze drifts on its own.',
    '收藏这个术语': 'Bookmark this term', '上一条 / 下一条': 'Previous / Next',
    '搜索动效术语': 'Search motion terms', '缓动曲线预览': 'Easing curve preview',
    '没有匹配的术语。换个说法试试，比如「弹」「糊」「跟手」「掉帧」。':
      'No matches. Try another word — bounce, blur, follow, jank.',
    '同一条动效，切换成 CSS / WAAPI / GSAP / Framer / Swift / Compose / Tailwind 的写法':
      'The same effect written in CSS / WAAPI / GSAP / Framer / Swift / Compose / Tailwind',
    '切换配色：五套调色板，默认跟随系统的深浅色偏好':
      'Switch palette: five palettes, defaulting to your system light/dark setting',
    '约 80 词、按用途分 12 类': '~80 terms in 12 purpose groups',
    '140+ 行业词条': '140+ industry terms',
    '按制作流程分类': 'sorted by production pipeline',
    '镜头 / 光效 / 色彩': 'camera / light / color',
    '缓动函数速查': 'easing cheat sheet',
    '按领域整理的动效原则': 'animation principles by domain',
    '图片来源：人像摄影素材由本站收录；风景照片来自 Wikimedia Commons（CC 授权），完整署名见 assets/img/ATTRIBUTION.md':
      'Photos: portraits collected by this site; landscapes from Wikimedia Commons (CC). Full credits in assets/img/ATTRIBUTION.md'
  };
  /* 分类名已有权威表，别再抄一份 */
  Object.keys(CAT_EN).forEach(function (id) {
    const c = window.CATS.filter(function (x) { return x.id === id; })[0];
    if (c) LABEL[c.name] = CAT_EN[id][0];
  });

  /* [英文释义, 含糊说法, 专业说法] */
  window.EN = {
    'cylinder-reel': ['Roll a strip of photos onto a cylinder: each card is rotateY(i×36°) then pushed out along its own facing by the radius R (R = card width / 2tan(π/N)), so spinning the drum is the carousel. One speed answers two places — drag faster and the headline letter-spacing blows open, so the page breathes in sync. Release and inertia decays while the tracking springs back.', 'roll a row of photos into a tube and spin it by dragging', 'cards laid on a cylinder at rotateY(i·36°) translateZ(R); the drag sets rotY and the same velocity drives the title letter-spacing'],
    'ring-gallery': ['A gallery with the camera outside the ring: photos sit rotateY(i×45°) translateZ(R) around a circle, so only the card facing the camera keeps full size and brightness while the rest fall off with angle. Tap a side card and its angle is brought to 0° along the shortest path — no tween written anywhere, one focus variable changes.', 'photos in a circle and only the one facing me lights up', '8 photos on a ring at rotateY(i·45°) translateZ(R); drag rotates the ring, tap normalises the angle along the shortest path and raises that card'],
    'easing': ['A function mapping animation progress onto the timeline. Linear motion reads as machine-made because nothing in the real world reaches top speed and stops instantly.', 'make it feel more natural', 'this motion uses an ease-out curve: fast start, slow settle'],
    'linear': ['Progress grows in direct proportion to time. Right for motion with no beginning or end — spinners, marquees, progress fills; wrong for anything that starts and stops.', 'just move it at a steady speed', 'linear timing, continuous motion only'],
    'ease-in': ['Slow start, fast finish. The high exit velocity reads as “leaving”, so it belongs on exits, collapses and throw-away gestures.', 'when it goes away', 'ease-in so it accelerates out of frame'],
    'ease-out': ['Fast start, slow finish. The object enters with speed and stops smoothly, which matches physics and makes it the safest default for entrances and state changes.', 'slide it in but not so stiff', '240ms ease-out entrance, decelerating into place'],
    'ease-in-out': ['Slow at both ends, fast in the middle. Best for long travel where both endpoints matter; on short distances it reads as sluggish.', 'slow at the start and the end', 'ease-in-out for this long horizontal move'],
    'power': ['Sine, quad, cubic, quart, quint, expo, circ: the same shape at different strengths. The further along the family, the more extreme — expo-out covers 80% of the distance in the first 20% of time.', 'a much stronger deceleration', 'use expo-out rather than cubic-out here'],
    'cubic-bezier': ['A four-point curve that is the common language of CSS easing. Pushing a Y value outside 0–1 creates overshoot; an X outside 0–1 is invalid (time would run backwards).', 'I want a curve nobody else has', 'cubic-bezier(0.16, 1, 0.3, 1)'],
    'asymmetric': ['Different curves (or durations) for entering and leaving. Attention follows arrival and ignores departure, so slow-in-fast-out entrances with snappy exits feel right.', 'gentle coming in, quick going out', 'ease-out 320ms on enter, ease-in 160ms on exit'],
    'overshoot': ['The motion passes its target and comes back. It buys weight and energy, but too much looks flippant in a serious tool.', 'it goes a bit too far then settles', 'about 10% overshoot before settling'],
    'ease-out-back': ['A back-out curve with one bounce at the end — the standard for pops, expanding buttons and badges. It is the line between a playful brand and a sober admin UI.', 'snap it in with a bounce', 'pop the card in with ease-out-back'],
    'ease-in-back': ['Starts by moving slightly backwards before launching. That is anticipation from the twelve principles, expressed as a curve.', 'it winds up before it goes', 'ease-in-back for a wind-up, then throw'],
    'spring': ['Motion simulated from stiffness, damping and mass rather than a fixed duration plus a curve. It has no end time, so it is naturally interruptible and resumes cleanly.', 'that natural iPhone-ish slide', 'drive it with a spring (stiffness 120, damping 14)'],
    'stiffness': ['How stiff the spring is. Higher means a stronger restoring force and a crisper arrival; lower stretches out like a rubber band.', 'make the bounce snappier', 'raise stiffness to 260 for a tighter return'],
    'damping': ['How fast energy decays — how many oscillations remain. Too little is jelly, too much is syrup; critical damping is the fastest non-oscillating settle.', 'stop it wobbling so much', 'damp near critical: one overshoot then rest'],
    'mass': ['How heavy the object is. More mass means slower acceleration and more drag, which suits large panels; small elements feel sluggish with heavy mass.', 'make it look heavier', 'mass 3 so it starts slowly and carries inertia'],
    'bounce': ['Repeated, decaying rebounds before the endpoint — an object landing. Different from elastic, which oscillates throughout rather than only at the end.', 'like a ball dropping and bouncing', 'bounce-out with two decaying landings'],
    'elastic': ['A decaying sine oscillation around the target, like a stretched rubber band. High impact, but it steals attention from content — save it for mascots and stickers.', 'wobbly like jelly', 'elastic-out: two or three decaying wobbles'],
    'stepped': ['Discretises progress into steps so motion jumps instead of sliding. Used for sprite playback, pixel art, typewriters and stop-motion feels.', 'frame by frame, like stop motion', 'steps(8) so it reads as eight frames'],
    'interruptible': ['If the user acts again before the motion finishes, it continues from the current position and velocity instead of waiting or snapping. This is what springs give you for free.', 'it must not freeze when I tap twice', 'make it interruptible and hand off velocity'],
    'duration': ['How long the animation runs. Rough bands: micro-feedback 100–160ms, small elements 200–300ms, panels and transitions 400–600ms; past 800ms users feel latency.', 'quicker, but not too quick', '200ms for this control, 320ms for the panel'],
    'delay': ['Waiting before the animation starts. It creates hierarchy, but it adds directly to perceived total time — the usual cause of a UI feeling half a beat behind.', 'let the second one wait a bit', '60ms delay on the second layer'],
    'stagger': ['A group plays the same animation with a fixed offset between items. It is the cheapest way to make a list look choreographed. 30–60ms works; beyond 100ms it becomes waiting.', 'they should appear one by one', 'stagger the list items by 40ms'],
    'orchestration': ['Arranging multiple animations like music: who leads, who follows, who overlaps. In tools this is the timeline (GSAP tl, AE layers).', 'the whole thing needs a rhythm', 'orchestrate: background first, title +120ms, cards +240ms'],
    'fill-mode': ['Controls state before the animation starts and after it ends. Forgetting forwards is the classic cause of an element snapping back when the animation completes.', 'it should stay there afterwards', 'animation-fill-mode: both'],
    'iteration': ['How many times the animation repeats. Only waiting states should loop forever; attention prompts should run two or three times, otherwise users tune the whole block out.', 'loop it a few times', 'iteration-count 3, not infinite'],
    'alternate': ['normal replays from the start each time, reverse plays backwards, alternate flips direction each iteration — which removes the visible seam in floats, breathing and sway.', 'make it drift back and forth', 'direction: alternate for a seamless cycle'],
    'playback-rate': ['Scaling the whole timeline. Slow motion (0.1–0.5x) is essential for inspecting curves; 3x verifies long animations quickly.', 'slow it down so I can see it', 'timeScale(0.25) to inspect the curve'],
    'timing-scale': ['Collapsing durations into design tokens (fast / normal / slow) the way colour and type are managed. Scattered 237ms and 410ms values signal a decaying system.', 'every duration should match', 'use tokens: xs 100 / s 200 / m 320 / l 480ms'],
    'perceptual-duration': ['How long motion feels, which is not the millisecond count. A steep attack with a short tail makes the same 400ms feel shorter than a linear one.', 'it feels slow even at 300ms', 'steepen the first half to shorten perceived duration'],
    'fade-in': ['Opacity from 0 to 1. The most conservative entrance: nothing moves, nothing reflows, so it suits images, scrims and modal backdrops.', 'let it appear gradually', 'fade in over 200ms'],
    'slide-in': ['Translates in from off-screen, usually with a fade. Direction carries meaning: entering from the right reads as forward, from the left as back.', 'push it in from the right', 'slide in from the right, ease-out 300ms'],
    'scale-in': ['Grows into place. The closer the start scale is to 1 (0.94–0.98) the more system-grade it feels; starting at 0 looks like an ad popup.', 'grow it from small', 'scale 0.92 to 1 with a fade'],
    'pop-in': ['Fast scale-up with slight overshoot, like a bubble appearing. Great for badges, notifications, new items — but no more than one pop per screen.', 'that little bounce-in feel', 'pop-in: scale 0.7 to 1 with back-out'],
    'bounce-in': ['Enters with landing bounces. High energy and playful; wrong register for finance or health.', 'drops in and bounces', 'bounce in with two decaying landings'],
    'drop-in': ['Falls into view under implied gravity. The landing surface needs to be visible, or it reads as falling into a void.', 'drop it from above', 'drop in from -12px with a small rebound'],
    'rise-in': ['A small upward move combined with a fade — the industry default entrance. Keep it to 8–16px so it reads as surfacing, not relocating.', 'gently float up into place', 'rise-in: translateY(8px) to 0 with a fade, 240ms ease-out'],
    'unfold': ['A container expands from zero along an axis. The hard part is that height:auto cannot be animated — use grid-template-rows 0fr→1fr or measure with FLIP.', 'expand it smoothly, no jumping', 'unfold with grid-template-rows 0fr to 1fr'],
    'clip-reveal': ['clip-path or a mask progressively exposes content while the element itself stays put. More crafted than a fade; good for images, blocks and headlines.', 'like it is being wiped into view', 'clip-path inset reveal from the bottom'],
    'mask-reveal': ['A mask with a soft gradient edge moves across, so content develops out of a blurred boundary like a photographic print. Hides seams better than a hard clip.', 'soft edges appearing gradually', 'linear-gradient mask sweep to reveal'],
    'blur-in': ['From blurred to sharp, mimicking a camera focus pull or a memory surfacing. Costly on GPU — use once above the fold, never on a loop.', 'from blurry to sharp', 'blur 12px to 0 with scale 1.06 to 1'],
    'flip-in': ['Rotates in through 90 degrees around its own axis. Only works with perspective; without it this collapses into a horizontal squeeze.', 'flip in like a card', 'rotateY(-90deg) to 0 with perspective'],
    'stack-in': ['Elements offset in depth and shrink slightly to form a deck, then get drawn out one by one. Good for receipts, tickets and grouped work.', 'a stack of cards sliding out', 'stack-in with z-offset and per-card stagger'],
    'wipe-in': ['A solid shape sweeps across and content changes behind it. More editorial than a fade; strong for image swaps and chapter breaks.', 'a block wipes across to reveal it', 'wipe: cover scaleX 0 to 1, then uncover'],
    'glitch-in': ['Misregistration, chromatic split and scanlines simulate a broken signal. A stylistic seasoning: keep it under 400ms and contextual.', 'like a bad signal appearing', 'RGB split plus jitter for 3-5 frames then settle'],
    'fade-out': ['Opacity to zero then remove. Exits should almost always be about half the entrance duration — the user already knows where it is going.', 'let it disappear', 'fade out over 160ms then unmount'],
    'slide-out': ['Translates out of frame. Keep the direction symmetric with the entrance or you break the user’s spatial memory.', 'push it away', 'slide out along the same axis it came from'],
    'scale-out': ['Shrinks away. If it shrinks toward where it came from (nav icon, cart), it reinforces the sense of origin.', 'shrink it back', 'scale 1 to 0.94 toward its source'],
    'collapse-exit': ['Removes itself and the space it occupied so following content moves up. Handle it badly and the list jumps — the most common removal defect.', 'the row below should not jump', 'collapse height 240ms so siblings close the gap'],
    'dissolve': ['Two shots hand over with overlapping opacity (cross-dissolve), or content fragments away. Cinema shorthand for a soft transition or passing time.', 'melt one into the other', 'cross-dissolve with a 200ms overlap'],
    'unmount': ['Engineering term: play the exit animation before actually removing the node. The classic framework bug is state changing and the element vanishing instantly.', 'why does it just disappear', 'await the exit animation, then remove it'],
    'staggered-exit': ['A group leaves one by one. Reversing the order (last in, first out) matches stack mental models — notifications, wizard steps.', 'remove them one at a time', 'stagger the exit, reverse order'],
    'translate': ['Changes position without affecting neighbours — the cheapest way to move. translate3d / translateZ(0) promotes the element to its own layer.', 'move it over there', 'translate it, never top/left'],
    'scale': ['Changes visual size without changing the layout box. Text above roughly 1.08 goes soft — switch to font-size or vector rendering instead.', 'make it a bit bigger', 'scale to 1.04 on hover'],
    'rotate': ['Turns around transform-origin. Keep start and end angles on 90-degree multiples so nothing settles crooked.', 'spin it round', 'rotate 360deg, linear, infinite'],
    'skew': ['Shears a rectangle into a parallelogram. Bound to horizontal velocity it creates a dragged, inertia feel — running characters and flicking cards.', 'give it a sense of speed', 'skewX tied to horizontal velocity'],
    'perspective': ['Sets the camera-to-screen distance; smaller means stronger distortion. Without it rotateX/Y collapses into a flat squeeze — the usual cause of fake 3D.', 'make the 3D feel thick', 'perspective: 800px on the parent'],
    'tilt': ['Maps pointer or gyroscope position to rotateX/rotateY so the card reads as a lit solid. Keep it to 6–10 degrees or it becomes a toy.', 'the card leans toward my cursor', 'tilt ±8deg from cursor position'],
    'card-flip': ['A 180-degree turn to the other face — a spatial way to swap content. Handle the mirrored back with backface-visibility:hidden.', 'flip to the details', 'rotateY 180deg with hidden backfaces'],
    'transform-origin': ['The anchor that scaling and rotation pivot around. Dropdowns should grow from their trigger (top origin); growing from the centre looks conjured.', 'it should grow from the corner', 'set transform-origin to the trigger edge'],
    'origin-aware': ['The animation origin follows the actual trigger point instead of a hard-coded value. Material ripples start at the touch; menus grow from the button.', 'it should grow out of where I clicked', 'compute transform-origin from the click point'],
    'rotate3d': ['Rotation around an arbitrary axis, for dice, cubes and cover walls. The vector need not be normalised but does need a container perspective.', 'spin it on a diagonal axis', 'rotate3d(1,1,0,180deg)'],
    'depth-layers': ['Arranges 2D layers in real 3D space. Cheap, legible, and the standard way to build product shots and card spaces on the web.', 'make it look layered', 'translateZ layers under a rotated camera'],
    'crossfade': ['Old content fades out while new fades in. Safest and dullest transition: it carries no spatial information, so avoid it for directional navigation.', 'blend the two screens', 'crossfade 250ms with a 50% overlap'],
    'continuity': ['Shared elements keep their identity across states — same title, same image, same position — and only the difference animates. The core trick for reducing disorientation.', 'do not let stuff teleport', 'keep shared elements continuous, animate only the diff'],
    'morph': ['One shape continuously becomes another. Requires matching point counts (or flubber / MorphSVGPlugin to reconcile them).', 'the circle turns into a play button', 'SVG path morph with matched anchors'],
    'shared-element': ['The same element is carried between screens — position, size and radius all move together. Turns a jump into a descent.', 'the thumbnail flies into the detail', 'shared element transition between list and detail'],
    'layout-animation': ['Interpolates size and position when layout changes. Provided by frameworks (Framer layout), by native View Transitions, or by hand with FLIP.', 'adding an item should not shove the page', 'enable layout animation on this list'],
    'flip': ['First-Last-Invert-Play: record the start box, jump to the end box, invert the delta with a transform and play it back to zero. Transform-only, so it holds 60fps.', 'smooth reordering', 'FLIP: measure, invert, play'],
    'accordion': ['A group of mutually exclusive panels: height tweens while the chevron rotates. Remember scroll position after collapse — that is the accessibility line.', 'expand one row at a time', 'accordion with exclusive open plus height tween'],
    'direction-aware': ['The animation direction follows navigation direction, mirrored for back. Ignoring it collapses the mental model of the stack.', 'going back should slide the other way', 'forward slides in from the right, back mirrors it'],
    'view-transition': ['A native browser capability: it snapshots DOM updates into before/after frames and interpolates them, across pages. Removes all the manual shared-element measuring.', 'can page changes be smooth by default', 'wrap the update in document.startViewTransition()'],
    'tab-indicator': ['The selection marker slides between tabs instead of teleporting, expressing distance with translate + scaleX — more coherent than cross-fading tabs.', 'the underline should slide', 'indicator translateX + scaleX follows the active tab'],
    'smooth-reorder': ['Reflow animation for sorting and filtering: survivors FLIP into their new cells, removals shrink away, additions cross-fade in. All three together read as one pool of content.', 'filtering should not repaint the page', 'exit, then FLIP survivors, then enter'],
    'expand-collapse-btn': ['An element grows in place instead of navigating away. Width must animate too, or the text reflows first and fades second — two visible jumps.', 'expand inside the row', 'expand in place, animating height and padding together'],
    'scroll-reveal': ['Entrance plays when the element enters the viewport. It must play once (or reverse deliberately); repeating on every scroll looks cheap immediately.', 'animate it when I scroll to it', 'reveal at 20% visibility, once'],
    'scroll-driven': ['Scroll progress is the timeline: scroll and it advances, reverse and it rewinds. Native via animation-timeline: scroll()/view(), or IntersectionObserver plus progress mapping.', 'it should follow my scroll, not trigger once', 'animation-timeline: view()'],
    'parallax': ['Layers move at different speeds to create depth. The ratio is the whole parameter: 0.2–0.5 reads natural, near 1 makes people ill. Use sparingly on mobile.', 'the background moves slower', 'background at 0.3x scroll speed'],
    'sticky-pinning': ['An element holds position while scroll continues, carrying a scroll-driven animation. This is the Apple product-page “scroll for ages, image stays” effect.', 'it should stick while I scroll past', 'pin the section for two screens'],
    'scroll-progress': ['Reading or flow progress expressed as length. Use transform: scaleX, not width, so you do not trigger layout every frame.', 'a bar showing how far I read', 'map scroll progress to scaleX'],
    'smooth-scroll': ['Interpolates instead of jumping. Distinguish anchor interpolation (helpful) from site-wide inertia (breaks native feel, use with care).', 'glide to the section', 'scroll-behavior: smooth on anchors'],
    'scroll-linked-value': ['Maps a scroll range onto any value — size, opacity, rotation, colour. The trio that makes it work: clamp + map + ease.', 'biggest font at half scroll', 'map the scroll range onto 16-48px'],
    'scroll-snap': ['Scroll settles onto preset anchors. mandatory snaps strictly, proximity only when close. Good for full-screen chapters and galleries.', 'it should land on a full screen', 'scroll-snap-type: y mandatory'],
    'scrollytelling': ['Scroll progress carries narrative structure — chapters, reveals and chart states all driven by scroll. Right for data journalism; wrong for task UI.', 'tell the story as I scroll', 'pin each step and switch chart state'],
    'scroll-hijacking': ['Takes over native scrolling and turns the wheel into page turns. Highest experience risk: lost position, trackpad misfires, accessibility failures. Needs a very strong reason.', 'one flick flips a whole screen', 'hijack the wheel for full-page turns (avoid)'],
    'ken-burns': ['Extremely slow push and pan on a still image, from documentary practice. Long duration (10–25s) and small amplitude, so viewers never catch it moving.', 'let the photo slowly zoom', 'Ken Burns: scale 1 to 1.12 over 20s'],
    'infinite-load': ['Loads the next page as the bottom approaches. Requirements: prefetch with rootMargin, keep skeletons shaped right, never reset scroll position.', 'auto load more without a flash', 'prefetch 300px before the sentinel'],
    'hover-lift': ['The element rises with a deeper shadow on hover, signalling affordance and closeness. 2–6px is plenty; transition both directions.', 'react when I mouse over it', 'hover: translateY(-4px) and elevation +1'],
    'hover-zoom': ['The container clips while the inner image scales. The scaling target must be the inner image, or the layout around it moves.', 'the picture zooms a bit on hover', 'inner img scale 1 to 1.06, container overflow hidden'],
    'underline-expand': ['The underline grows from one side via transform-origin instead of fading in whole. Direction should follow reading direction.', 'the line draws in from the left', 'underline scaleX 0 to 1, origin left'],
    'press-feedback': ['The element shrinks (0.94–0.97) on press to acknowledge input. On touch, without it users tap again believing nothing happened.', 'it needs a pressed feel', 'active: scale(0.96) for 80ms'],
    'ripple': ['Material’s signature feedback: a translucent circle expands from the exact touch point, confirming where you pressed — so compute the origin from real coordinates.', 'a circle spreads from my finger', 'ripple from the touch point, 450ms ease-out'],
    'hold-to-confirm': ['Requires sustained press with progress feedback for dangerous or irreversible actions. Releasing must rewind the progress — that is the whole point.', 'hold it a second to be sure', 'hold 800ms, fill progress, rewind on release'],
    'drag': ['Element follows the pointer. Three details decide quality: it grows when grabbed, it skews with horizontal velocity, and it is thrown by velocity on release.', 'it should follow my finger', 'pointer capture + velocity throw on release'],
    'drag-reorder': ['Drag to reorder. The dragged row lifts (scale + shadow) while siblings FLIP out of the way; on release it must land on the grid, not under the cursor.', 'drag rows to reorder them', 'lift the row, FLIP the siblings, snap on drop'],
    'swipe-dismiss': ['Swipe sideways to delete or archive. Needs a clear threshold, a spring-back animation and the gap closing behind it, or it feels unreliable.', 'swipe left to remove', 'dismiss past 40% width, else spring back'],
    'rubber-band': ['Beyond the boundary, displacement is compressed non-linearly and springs back on release. The iOS signature: it says “this is the end” instead of stopping dead.', 'it stretches like a band', 'damp overscroll by 1/x, spring back'],
    'shake': ['A fast decaying lateral shake meaning refusal. It is the human head-shake; use it only on failure, high frequency, under 500ms.', 'shake it when the password is wrong', 'shake with 3 decaying oscillations'],
    'nudge': ['A far gentler reminder motion, one or two oscillations then stop. Never loop it, or it reads as a bug or noise.', 'poke it so I notice', 'nudge once: ±4px, two oscillations'],
    'pulse': ['Cyclic scale or expanding halo signalling alive / new. Keep the period above 1.5s or it induces anxiety.', 'like a heartbeat ring', 'pulse 1.8s, scale plus fading halo'],
    'focus-ring': ['A visible keyboard focus indicator. Not decoration but a mandatory accessibility feature; show it on :focus-visible only.', 'show where Tab lands', ':focus-visible outline 2px with offset'],
    'cursor-magnet': ['The button shifts slightly toward a nearby cursor as if attracted. Makes the UI feel like it has a gravity field; keep the offset under 12px.', 'the button leans toward my mouse', 'magnet: offset up to 8px toward the cursor'],
    'pull-to-refresh': ['Pulling past a threshold at the top of a list triggers refresh, with rubber-band damping and a distance-linked indicator. Maps a physical gesture onto “pull new stuff out”.', 'drag down to refresh', 'pull past threshold, spinner rotates, settle back'],
    'skeleton': ['Grey placeholders shaped like the real content instead of a spinner. Perceived-performance win: waiting feels shorter and layout does not jump (CLS).', 'show grey blocks first', 'skeleton with shimmer, sized to real content'],
    'toast-in': ['Enter from the screen edge (it is the system speaking), do not block input, auto-dismiss, and leave faster than it arrived.', 'a message slides in top-right', 'toast: rise + fade 240ms, exit 160ms'],
    'progress-bar': ['Determinate for quantifiable work (needs real data), indeterminate sweep otherwise. Fake progress makes real waiting feel worse.', 'a bar showing how far along', 'scaleX from real progress, else indeterminate sweep'],
    'loop': ['Repeating an animation. The only quality bar is whether you can find the seam — any difference between first and last frame becomes a visible hitch.', 'just keep repeating', 'seamless loop: first and last frame identical'],
    'marquee': ['Endlessly scrolling content band, usually logos or notices. Seamless requires duplicating content and translating -50%, not one content width.', 'a logo strip crawling sideways', 'duplicate the track, translateX -50%'],
    'orbit': ['Elements travel a circular path around a centre. Rotate the wrapper and counter-rotate the satellite to keep it upright.', 'little dots circling it', 'orbit via wrapper rotate + counter-rotate'],
    'float': ['Slow vertical drift implying weightlessness. Long period (3s+), small amplitude, and vary the shadow or it is not believable.', 'make it hover gently', 'float ±6px, 4s alternate'],
    'idle-breathing': ['Very subtle continuous change at rest — breath, micro-scale, glow — so mascots and illustrations do not look frozen. Ideal: users cannot name it but notice when it stops.', 'make it feel alive', 'idle: scale 1 to 1.015 over 4.5s'],
    'spinner': ['A cyclic indicator for unknown load time. It only says “still alive”; if you can measure progress, use a bar or skeleton instead.', 'a loading circle', 'linear 1s rotation, indeterminate'],
    'shimmer': ['A highlight sweeping across a surface, suggesting material or loading breath. Usually background-position rather than element motion; costs a composite layer.', 'a light sweeps across', 'gradient sweep across the surface'],
    'gradient-sweep': ['The gradient itself changes over time. Period must be very long (15s+); any perceivable rhythm looks cheap and competes with content.', 'slowly shifting colours', '24s gradient drift, alternate'],
    'confetti': ['A celebratory particle burst. Emotional feedback for genuine milestones only; cap particle count and lifetime or it drops frames.', 'throw some confetti', 'burst 30-60 particles with gravity and decay'],
    'ambient': ['Motion that carries no information and only supplies atmosphere: slow light blobs, drifting geometry, flowing noise. Test: screenshot the content and it should not compete.', 'some background life', 'low-contrast, long-cycle ambient layer'],
    'steps-seamless': ['The quality bar for loops. The usual seam is ease-in-out + alternate, which decelerates at both ends into a visible nod; use sine-ish curves instead.', 'why does it nod at each end', 'use sine in-out so the cycle has no seam'],
    'typewriter': ['Reveals character by character. The sense of speed comes from the interval (25–60ms), not total duration; on long text it is actively bad because reading outruns typing.', 'type it out letter by letter', '40ms per character with a blinking caret'],
    'scramble': ['Text starts as random glyphs and converges character by character. Tech-flavoured, good for titles and state changes, never body copy.', 'random characters resolve into text', 'scramble-decode over 600ms'],
    'split-text': ['Splits text into independently drivable characters, words or lines. Handle accessibility (aria-hidden original) and wrapping, or mobile becomes a mess.', 'letters come in one by one', 'split by character, 30ms stagger'],
    'line-mask': ['Each line sits in a clipping box and is lifted into view from below. Strong editorial and print character; the standard trick for brand headlines.', 'lines lift up into place', 'line mask reveal, 60ms per line'],
    'kinetic-type': ['Text is the subject and moves with the rhythm of speech. Core idea: map semantic stress onto motion intensity.', 'words performing as the visual', 'scale stressed words on the beat'],
    'number-ticker': ['Digits roll vertically into place like a mechanical counter. Needs fixed height clipping and transform offsets; reserve width when digit count changes.', 'slot machine digits', 'per-digit vertical roll, decelerating'],
    'count-up': ['Grows from 0 to the target. The easing must be ease-out — a linear count makes people suspect the number is fabricated.', 'count up to 892', 'count-up with expo-out'],
    'tabular-nums': ['Makes every digit the same width. The one line of CSS to fix before animating numbers, or proportional digits shake the whole line.', 'the row shakes while counting', 'font-variant-numeric: tabular-nums'],
    'highlight-sweep': ['Draws a highlight behind text like a marker. The text itself never moves, so reading rhythm is uninterrupted.', 'like a marker sweeping across', 'background-size 0 to 100% under the text'],
    'text-glitch': ['Chromatic split and sliced displacement of text. A very strong stylistic signal: short duration, bounded repetitions, or the page feels unstable.', 'broken-signal text', 'RGB split plus clip jitter, 2-4 passes'],
    'text-replace-flip': ['Words swap by rotating around the X axis — common in looping taglines. Fix the container height or it jitters on every change.', 'the word flips into another word', 'rotateX out and in, fixed height'],
    'cursor-caret': ['The typewriter companion. Must blink with steps(2) (real carets do not fade) and keep blinking two or three cycles after the sentence ends.', 'the blinking line after the text', 'caret blink via steps(2, start)'],
    'blur': ['Softens detail. filter: blur acts on the element; backdrop-filter acts on what is behind it (glass). The latter is expensive on mobile — cap the number of layers.', 'a frosted glass panel', 'backdrop-filter: blur(20px) saturate(1.4)'],
    'clip-path': ['Cuts away parts of the element with a geometric path. Shapes interpolate when point counts match, so it is both a shaping and a transition tool.', 'cut the image on a diagonal', 'clip-path polygon, animated'],
    'mask': ['An image (often a gradient) determines the alpha distribution: soft edges, holes, sweep reveals. Unlike clip-path, masks can be semi-transparent.', 'fade the edge into the page', 'mask-image with a gradient'],
    'line-drawing': ['Stroke-dashoffset makes an SVG path appear to draw itself. Measure pathLength first and order the paths, or it reads as erasing rather than drawing.', 'the line draws itself', 'stroke-dasharray + dashoffset to 0'],
    'glow': ['Bright areas spill outward. Real bloom needs values above 1 compressed back down; in CSS approximate with stacked blurred shadows, kept light rather than saturated.', 'make it glow', 'stacked box-shadows with high saturation'],
    'grain': ['Fine noise that removes the plastic look. If it moves, jitter it every frame (steps); a static grain layer just reads as a dirty screen.', 'add film grain', 'noise layer jittered at 6-8 steps'],
    'elevation': ['Shadow spread and opacity express distance from the screen. Material defines discrete levels (1/3/6/8/12dp), so shadow values should be tokens, not ad hoc.', 'make it look raised', 'elevation 1 to 3, shadow token pair'],
    'light-sweep': ['A narrow highlight crosses the surface quickly, implying metal or glass. A one-shot effect, 400–800ms, common on buttons and collectible cards.', 'a glint across it', 'skewed highlight beam sweeping once'],
    'chromatic': ['Simulates lens colour fringing. Displacement is in pixels and must stay tiny; past about 4px it stops being texture and becomes a glitch.', 'red and blue fringing', 'R/B channels offset 1-3px'],
    'glass': ['Backdrop blur plus translucent fill plus a 1px bright edge. The edge is what makes it read as glass; without it you just get a grey smudge.', 'frosted translucent panel', 'backdrop-blur + rgba fill + 1px highlight border'],
    'depth-field': ['Only the subject stays sharp; everything else blurs by distance, directing the eye. On the web this is usually static depth in a few steps.', 'foreground blurred, subject sharp', 'layered blur by distance'],
    'bokeh': ['Out-of-focus light sources as soft discs. As a background layer keep opacity under ~0.18 and never let it carry information.', 'round blurry light dots', 'large blurred circles, low opacity'],
    'dolly': ['The camera physically moves toward the scene (unlike zooming focal length): near objects travel faster and perspective genuinely changes, which is why it feels more immersive.', 'push the camera in slowly', 'dolly-in along Z'],
    'pan': ['The camera turns or travels horizontally. Good for long images, maps and timelines; pair with segmented reveals or it is just a long scroll.', 'scan across sideways', 'pan the camera along X'],
    'whip-pan': ['An extremely fast horizontal whip whose motion blur hides the cut. Strong editorial rhythm; do not use it several times per screen.', 'whip to the next shot', 'whip pan with directional blur at the swap'],
    'zoom-through': ['The camera travels through an element into the next layer (Prezi-style). Powerful spatial metaphor, low navigation cost, but hostile to motion-sensitive users — always provide a reduced-motion path.', 'fly into the picture', 'zoom through the element into the next view'],
    'match-cut': ['Cuts between shots that share shape, position or motion direction so the seam disappears. The most refined transition, because it relies on composition rather than on effects.', 'same shape, different shot', 'match-cut on the aligned circle'],
    'cut': ['No interpolation at all. It belongs in this vocabulary, and it is often correct: for high-frequency, efficiency-first interaction, no animation is the best animation.', 'just switch, no animation', 'hard cut, 0ms'],
    'rack-focus': ['Pulls focus from one subject to another within a shot, reallocating attention. On the web it is often bound to scroll position.', 'focus moves from A to B', 'swap blur between two groups'],
    'camera-shake': ['The whole frame jitters with decaying randomness to express impact. Must be short with fast decay, and amplitude should scale with the weight of the event.', 'shake the screen on impact', 'shake ±6px decaying over 300ms'],
    'orbit-camera': ['The camera arcs around the object for product views. Keep the object’s height fixed, change only azimuth, and clamp pitch or the spatial read collapses.', 'rotate around it to look', 'turntable orbit on Y with clamped pitch'],
    'reveal-camera': ['Pulls back from detail to whole, creating the “that was only a part” surprise. At large pull-backs text becomes unreadable instantly — switch to a summary layer at the end.', 'zoom out to reveal the context', 'pull back from scale 2.6 to 1'],
    'squash-stretch': ['Bodies stretch along the direction of acceleration and compress at resistance points. The discipline is constant volume — otherwise it looks like melting wax.', 'it squishes when it lands', 'squash on landing, stretch on launch, volume preserved'],
    'anticipation': ['A small counter-direction move before a big action tells the audience it is coming and supplies force: crouch before you jump, wind back before you throw.', 'it winds up first', '100ms counter-move before the main action'],
    'follow-through': ['After the body stops, attached parts (hair, tails, trailing icons, the tail of a headline) keep moving and settle. Without it motion looks guillotined.', 'it still nods after stopping', 'let the trailing parts settle 2-3 frames later'],
    'secondary-action': ['Supporting motion that enriches the main action without competing with it. Test: remove it — is the message still complete?', 'small details moving too', 'secondary elements at 30% amplitude, +40ms'],
    'arc': ['Free-moving bodies travel curves, not straight lines, because of gravity. Trick: linear on X and ease-in-out on Y composes a parabola.', 'do not fly in a straight line', 'arc the path: linear X, eased Y'],
    'timing': ['Different phases of one action consume different frame counts. Contrast — a two-frame hit against a twelve-frame drift — carries the emotion, not the absolute duration.', 'fast where it should be fast', '2 frames for the impact, 12 for the settle'],
    'exaggeration': ['Push amplitude, duration or deformation past reality to strengthen the read. In UI: brand pages yes, forms and dashboards no.', 'make it more dramatic', 'push amplitude to 1.3-1.6x real'],
    'staging': ['Composition, value and motion contrast guarantee the audience sees what matters. The most practical UI version: only one element moves at a time, everything else dims.', 'make it the focus', 'dim and desaturate everything but the subject'],
    'slow-in-out': ['The Disney-era name for easing: both ends of an action speed up and slow down gradually, because nothing can gain or lose velocity instantly. The ancestor of every curve term here.', 'do not start or stop abruptly', 'slow in and slow out at both ends'],
    'perceived-performance': ['Motion changes how long waiting feels: instant press feedback, skeletons, optimistic updates, visible progress. Done well, 800ms with feedback feels faster than 200ms with none.', 'how do we make it feel fast', 'optimistic update: play success immediately, roll back on failure'],
    'purposeful': ['Every animation must answer one question: does it explain a spatial relationship, provide feedback, or direct attention? If none of the three, delete it. The most important term in this glossary.', 'it looks nice, add it', 'this motion solves continuity, not decoration'],
    'spatial-consistency': ['Elements stay predictable across state changes: exit direction mirrors entry direction, parent and child share an axis, nothing reappears somewhere else.', 'why did it move after I came back', 'same axis and same origin on enter and exit'],
    'frequency-of-use': ['Animation cost is billed per viewing. First run can afford choreography; something seen two hundred times a day must be very fast or absent.', 'I see this 200 times a day', 'cap high-frequency motion at 120ms or remove it'],
    'reduced-motion': ['A system accessibility preference. Large translations, parallax and zoom can trigger vestibular discomfort. A proper implementation preserves the message — degrade to a fade, do not remove everything.', 'some people get dizzy', 'honour prefers-reduced-motion and fall back to opacity'],
    'frame-rate': ['Frames presented per second. On a 60Hz display the budget is 16.7ms per frame for style, layout, paint and composite combined; over it and you drop frames.', 'make it smoother', 'hold a stable 60fps budget'],
    'jank': ['Visible discontinuity in motion, caused by the main thread being blocked past the frame budget. The culprit is usually sync JS, image decode or layout thrash — not the animation itself.', 'it stutters a bit', 'find and remove the long task blocking the main thread'],
    'dropped-frame': ['A frame that should have been rendered was not, so the previous one repeats. One or two are invisible; three or more read as stutter.', 'it skips mid-way', 'count dropped frames in the performance panel'],
    'compositing': ['Assembling already-painted layers on the GPU. Transform and opacity animations can run entirely on the compositor thread without the main thread, which is why they are the most robust.', 'why is this one smooth', 'keep it on the compositor thread'],
    'will-change': ['Hints the browser to prepare a layer. It is a hint, not a performance switch: keep it on many elements permanently and you exhaust GPU memory and make things worse.', 'add will-change, that helps right', 'add it just before the animation, remove it after'],
    'layout-thrashing': ['Alternating geometry reads and style writes in a loop, forcing synchronous layout each time. Fix by batching: read everything, then write.', 'the loop with offsetHeight is slow', 'batch reads, then batch writes'],
    'reflow-repaint': ['Geometry properties trigger layout (most expensive); colour triggers paint; transform and opacity need only composite. That ladder is exactly how you decide which properties to animate.', 'which property is cheap to animate', 'layout > paint > composite'],
    'gpu-friendly': ['The safe list for animation: transform, opacity, and with cost caveats filter, clip-path, mask. The danger list: width/height/top/left/margin, box-shadow, animating font-size.', 'what is safe to animate', 'animate transform / opacity only'],
    'raf': ['Registers a callback for the next frame. It syncs with refresh rate and pauses when the tab is hidden — the correct replacement for setInterval-driven animation, which drifts against frames.', 'should I use setInterval', 'drive every JS animation from requestAnimationFrame'],
    'scroll-jank': ['Heavy work inside a scroll listener blocks scroll compositing and makes scrolling feel sticky. Use passive listeners, IntersectionObserver, or native scroll-driven animation.', 'adding a scroll listener made it laggy', 'passive:true or IntersectionObserver instead'],
    'content-visibility': ['Skips layout and paint for off-screen content until it approaches the viewport. Free speed on long pages, but pair it with contain-intrinsic-size or the scrollbar jumps.', 'the long page is slow to load', 'content-visibility: auto with intrinsic size'],
    'easing-token': ['Curves, durations and amplitudes as design tokens (--ease-emphasized, --dur-2, --lift-2). Motion becomes governable, batch-degradable, and can satisfy prefers-reduced-motion in one switch.', 'everyone picks their own curve', 'put curves and durations in tokens'],
    'css-3d': ['The browser positions elements in 3D space. You need three things at once: a parent perspective (the camera), a Z translate or rotation on the child, and a shared 3D context.', 'make this thing really turn in space', 'CSS 3D: parent perspective + child rotate3d/translateZ'],
    'preserve-3d': ['The default flat projects children onto the parent plane, killing the 3D relationship instantly. For cubes, card decks and nested flips this is the first property to check.', 'why are my children flat', 'add transform-style: preserve-3d on the parent'],
    'backface': ['Whether an element still draws when rotated away from the viewer. Faces, cube interiors and 3D carousels must declare it, or mirrored content bleeds through.', 'the back side shows through', 'backface-visibility: hidden'],
    'fov': ['The perspective value is the camera-to-screen distance: smaller means closer and more distorted, larger approaches orthographic. Whether a 3D scene reads as believable is mostly this number.', 'more perspective please', 'tighten perspective from 1200px to 500px'],
    'orbit-controls': ['Pointer movement drives a camera orbiting the object. Clamp pitch to ±80 degrees to avoid flipping, and keep a little inertia on release so it feels physical.', 'let me drag to spin it', 'map pointer delta to rotateX/rotateY with inertia'],
    'webgl-context': ['The browser’s channel to the GPU. The whole image is computed by vertex and fragment shaders — tens of thousands of particles and real lighting are possible; state management, context loss and bundle size are the price.', 'that thing drawn by the graphics card', 'get a WebGL context and submit uniforms each frame'],
    'fragment-shader': ['A program executed once per pixel. Flowing gradients, noise clouds, fluids and chromatic effects live here, and run orders of magnitude faster than the CPU for the same work.', 'that organic flowing background', 'one fragment shader computing colour from uv and time'],
    'gpu-particles': ['Particle positions are computed in the vertex shader while the main thread feeds a single time value. Tens of thousands to millions of particles stay smooth; CPU-side collision logic gets hard.', 'tens of thousands of dots, still 60fps', 'compute positions in the vertex shader'],
    'post-processing': ['Render to an offscreen texture, then run a second shader pass: bloom, tone mapping, vignette, depth of field, motion blur. The main source of the “game-grade” look.', 'make the picture richer', 'bloom and tonemap in a second pass'],
    'particle-system': ['Many small objects simulating smoke, fire, snow or trails. Engineering essentials: an object pool (never allocate per frame), a hard cap, and recycling on death instead of deletion.', 'emit some stuff that floats around', 'emitter with velocity, gravity, drag and lifetime'],
    'instancing': ['Draw one geometry N times, varying only a few per-instance attributes, collapsing N draw calls into one. The standard answer when draw calls are the bottleneck.', 'a thousand copies of the same thing', 'one geometry, per-instance offsets, a single draw call'],
    'mesh-warp': ['Subdivide an image or shape into a grid, then displace vertices to bend, bulge or liquefy it. The same mechanism behind AE Mesh Warp and Rive mesh deformation.', 'make the photo ripple like cloth', 'displace grid vertices along a sine field'],
    'physics-engine': ['Integrate gravity, velocity and position with collision solving instead of hand-authored keyframes. Right for throws, stacks and impacts that cannot be choreographed in advance; expect tuning.', 'let it fall and knock things over', 'rigid bodies with restitution 0.6'],
    'gltf-draco': ['The runtime format for 3D on the web. Draco/Meshopt compress geometry, KTX2/WebP compress textures; asset size is usually the single biggest first-paint cost of a 3D page.', 'put that 3D model on the site', 'glb with Draco compression, 1.2MB to 180KB'],
    'sprite-sheet': ['All frames packed into one large image and played by offsetting the crop. The honest answer for hand-drawn and pixel motion; frame count is the cost, and 8fps reads as stop-motion.', 'that frame-by-frame game feel', 'one sheet plus steps(6) at 8fps'],
    'lottie': ['Exports an After Effects timeline as JSON which a runtime interpolates per frame. Designer-deliverable, small, recolourable; expressions and masks are where it breaks.', 'the animation my designer made in AE', 'ship a Lottie JSON and interpolate at runtime'],
    'rive': ['Animation as a graph of states and transitions driven by inputs at runtime. Ideal for mascots, buttons and loading states that must respond, far cleaner than if-chains over CSS classes.', 'it decides how to move from its state', 'Rive state machine: Idle ⇄ Wave on input'],
    'bone-rig': ['Bind bones to a shape and animate the joints instead of the vertices. Forward kinematics rotates joints top-down — waving, walking, anything you can choreograph.', 'the arm moves joint by joint', 'FK chain: accumulate joint angles, mesh follows'],
    'ik-solver': ['Solves joint angles from a desired end position: where the hand grabs determines where the elbow is. Used for pointer tracking, foot placement and gaze following.', 'the hand must point at my cursor', 'two-bone IK: solve shoulder and elbow from the target'],
    'delta-time': ['Multiply per-frame displacement by the actual elapsed time. A hard-coded “+4px per frame” is correct at 60Hz and double speed at 120Hz — the most common hidden bug in JS animation.', 'it runs twice as fast on my new laptop', 'scale motion by dt, not by frame count'],
    'render-loop': ['The master switch for all per-frame animation. The canonical structure separates update(logic) from draw(), uses a fixed timestep for stable physics, and stops when the page is hidden.', 'the heartbeat of the animation system', 'one rAF loop: update(dt) then draw()'],
    'svg-smil': ['SVG’s built-in animation elements: rotate, motion along a path, attribute interpolation, with no script. It travels inside the icon file, but you cannot retarget parameters at runtime.', 'animate the SVG without JS', '<animateTransform> declared inline in the SVG'],
    'timeline-scrub': ['Progress can be written from outside (drag, scroll, a recording position). Implement it via Web Animations currentTime, or write the motion as a pure function of progress.', 'let me drag through every frame', 'expose progress as a writable value and seek']
  };

  /* 第 16 类「组合范式」由 compound.js 注入，英文释义在这里补齐 */
  Object.assign(window.EN, {
    'gaze-tracking': ['The pointer position drives where a character is looking: take the vector from centre to pointer, clamp it to the eye’s travel radius, then smooth it. Add an idle wander and blinks, or the “life” switches off the moment nobody moves the mouse.', 'make the character look at my cursor', 'cursor-driven gaze tracking: clamped pupil offset with 0.16 lerp smoothing and idle wander'],
    'pinned-hero': ['Pin the hero in the viewport and use one scroll progress to drive both its shrink and the content re-laying out beside it. Sharing a single progress value is the whole trick — two independent timelines make the screen look like it came apart.', 'keep the big image while the cards slide in below', 'scroll-driven pinned hero recomposition: hero sticky + scale 0.74, cards fan out on the same progress'],
    'section-stack': ['Successive sections behave like a deck of cards: the next one covers the previous, which scales down slightly and dims behind it. Keep the stack to three or four layers — beyond that it reads as “stuck”, not as depth.', 'the next screen covers the last one', 'scroll-driven section reveal with sticky stacking, 14px offset per layer, scale 0.94 when covered'],
    'scene-parallax': ['Split one image into three to five layers and assign displacement by depth — the nearer the layer, the further it travels. Add a few degrees of rotateY on the container and a flat picture becomes a box you can look through.', 'the layers shift when I move the mouse', 'cursor-driven miniature scene parallax: depth-weighted offsets plus rotateY on the diorama'],
    'scroll-orbit': ['Map scroll progress straight onto the camera’s azimuth. Two rules: pin the subject, otherwise it scrolls out of frame halfway; and hold the pitch constant while only the azimuth moves, otherwise viewers get disoriented.', 'scrolling spins the model around', 'scroll-driven character orbit: progress → rotateY 0-360°, pitch locked at -14°'],
    'door-bloom': ['Break one surface into panels that swing open around their own hinge edge on hover, staggered, with a glow rising from the centre. It is the most “expensive” tier of hover feedback — reserve it for hero surfaces.', 'the doors fan open when I hover', 'hover-triggered door bloom: six panels rotateY -64° around their own edge, 45ms stagger'],
    'vortex-transit': ['Concentric layers scale from far to near on one shared progress, and modulo arithmetic sends each layer back to the start, producing a tunnel with no end. It must stop dead the instant scrolling stops, or it induces motion sickness.', 'scrolling feels like flying through a tunnel', 'scroll-driven vortex transit: N rings scale 0.1→3.4 on a modulo-wrapped progress'],
    'immersive-float': ['A causal chain: the object falls, contacts the surface, and only then does growth begin — each stage’s endpoint is the next one’s start. The value here is in the sequencing, not in any individual curve.', 'tap it, it drops and then plants something', 'click-triggered sequence: gravity drop + squash, then stroke-dashoffset growth, then staggered leaf scale-in'],
    'helix-flow': ['Add a vertical offset proportional to index on top of circular rotation and the ring becomes a helix. Deriving scale and opacity from cos(theta) conveys depth without any real 3D.', 'drag it and the items spiral past', 'drag-driven helix flow: x = sin θ · R, y ∝ index, scale and opacity from cos θ'],
    'luminous-flow': ['Write the pointer position into one CSS custom property and let the light pool, the floor highlight and the fog all read from that single source. Mapping pointer speed to fog density effectively gives the scene a throttle.', 'the light follows the cursor and fog rolls in', 'cursor-driven luminous flow: --lx/--ly drive the light, smoothed speed drives fog and a 1.06 push-in'],
    'spotlight-reveal': ['Hide information under a mask the same colour as the background and punch a radial hole at the pointer. Good for exploratory content — but never put anything essential behind it, because keyboard and touch users will never shine the light there.', 'a torch that reveals what is under the cursor', 'cursor spotlight reveal: one radial-gradient mask driven by --lx/--ly'],
    'cursor-trail': ['A chain of particles where each one chases the previous, so the tail tapers naturally. Chain the interpolation rather than replaying recorded coordinates — replaying throws leftover ghosts at you the moment the pointer stops.', 'a little comet tail behind the cursor', 'cursor trail: chained 0.28 lerp with size and opacity falling off by index'],
    'hover-fan': ['Collapse a stack of items on hover and spread them into a fan. Only the transform changes, never the layout, so nothing around it shifts — that is what makes it safe inside a dense grid.', 'a deck of cards that spreads out when I hover', 'hover fan-out: rotate and translateX distributed by index, 40ms stagger'],
    'card-peel': ['Lift one corner like a sheet of paper, showing the reverse face and the shadow it drops. Purely decorative, and at its best as an affordance on entry cards: “there is more under here”.', 'the corner of the card lifts up on hover', 'hover card peel: corner triangle grows 0→36px with a gradient back face and shadow'],
    'horizontal-scroll': ['Vertical scroll drives a horizontal track. Common for portfolios and timelines and expensive: people lose their sense of progress and trackpad gestures fight each other, so give it a clear end and a way out.', 'scrolling down but the content moves right', 'scroll-to-horizontal: map vertical progress onto the track translateX inside a pinned container'],
    'scrub-frames': ['Quantise scroll progress into discrete frames to get the “dragging a video timeline” feel (24 frames is the usual). Quantise, do not interpolate — interpolating just gives smear and you lose the mechanical frame-by-frame read.', 'scrolling feels like dragging through a video', 'scrubbed frame sequence: frame = round(p * (N-1)), no interpolation, with a frame counter readout'],
    'sticky-two-col': ['The most robust scrollytelling structure: the visual is pinned, the text flows past it, and the visual swaps per paragraph. Put the “entered” threshold at the viewport middle or the swap will flicker.', 'the picture stays put while the steps scroll by', 'sticky two-column: left visual pinned, right steps cross-fade it at the viewport midline'],
    'theme-morph': ['Interpolate between colour stops on scroll to signal “new chapter”. Interpolate the foreground too — animate only the background and you will pass through combinations nobody can read.', 'the whole page slowly changes colour as I scroll', 'scroll-linked theme morph: RGB interpolation across stops, foreground interpolated in parallel'],
    'progress-ring': ['Draw progress as a circle. Three details: start at 12 o’clock (rotate -90°), use the measured circumference for dasharray, and centre the number separately or it reads badly.', 'a ring that fills up as you scroll', 'scroll progress ring: dashoffset = circumference * (1 - p)'],
    'fab-to-sheet': ['The button and the panel it opens are the same container, only size and radius differ — that is the container transform applied to a mobile FAB. Let the content arrive a beat late or you will see the text stretch.', 'the round button grows into a panel', 'FAB to sheet container transform: same element animates width/height/radius, children fade in +130ms'],
    'button-tri-state': ['Compress submit — processing — success into one control. The governing constraint is that the shape must land back in the same place, otherwise the button jumps and people think they mis-tapped.', 'the button turns into a spinner then says saved', 'button tri-state morph: collapse to a circle, spinner, expand with a check, return to idle'],
    'drag-compare': ['Two images stacked with a draggable divider wiping between them. Accessibility requirement: the handle must be focusable and arrow keys must drag it, otherwise keyboard users never see the comparison.', 'a slider between before and after', 'drag-to-compare wipe: handle position → clip-path inset on the top layer, arrows as fallback'],
    'line-mask-reveal': ['The paragraph never moves — only each line rises out of its own overflow:hidden mask. Keep the per-line offset shorter than a single line’s duration, or it reads “block by block” instead of “line by line”.', 'the lines lift out from behind a bar', 'scroll-driven line-mask reveal: each line translateY 100%→0 on a staggered slice of the scroll progress'],
    'velocity-skew': ['An always-on marquee that reacts to scrolling: more speed means more travel and more shear on the letterforms. Drive the skew from smoothed velocity, not the instantaneous delta, or it buzzes like a sawtooth.', 'the row leans and dashes when I scroll fast', 'scroll-velocity marquee: smoothed scroll delta feeds both the displacement increment and skewX, both decaying to 0'],
    'proximity-glow': ['Treat the pointer as a light with a radius and let each tile respond by distance. Use squared falloff rather than linear — a linear ramp smears the edge and you cannot see the “nearness” at all.', 'tiles light up as the cursor gets close', 'cursor proximity grid: per-tile (1 − d/R)² falloff mapped to brightness, scale and Z offset'],
    'liquid-follow': ['One point chases the pointer on a spring while being stretched along its own velocity vector and squashed across it, then rotated to match — that is what reads as surface tension. Displacement alone is just a follower.', 'a jelly dot that stretches as it chases the cursor', 'liquid cursor follow: spring position + velocity-aligned rotate with scaleX/scaleY complementary stretch'],
    'chart-build': ['The figure assembles itself as you scroll. The rule: the readout and the geometry must come from the same progress value — compute them separately and you get “bars full, number still climbing”.', 'the chart grows as I scroll through it', 'scroll-driven chart build: line via stroke-dashoffset, bars staggered by index, readout bound to the same progress'],
    'preview-follow': ['A preview card floats beside a list and follows the pointer. It must stay mounted and only swap its contents — creating DOM on every hover makes the swap flicker and throws away the motion inertia.', 'a picture floats next to the list while I hover rows', 'hover-linked floating preview: spring-followed card, content swap plus one scale pop, never remounted'],
    'throw-dismiss': ['Rotation follows displacement while the flight follows release velocity — you need both. Displacement alone looks like dragging paper; velocity alone looks like a spring. Gate the dismiss on both, or slow drags get thrown by accident.', 'grab the card and fling it away', 'velocity throw & dismiss: rot ∝ dx, flight path from release velocity, dismiss needs either past threshold'],
    'scramble-decode': ['Characters converge from random glyphs to the target one by one, forming a decoding band. Only replace the not-yet-locked characters each frame — re-randomising everything reads as noise, not as decoding.', 'the text decodes itself hacker-style', 'scramble decode reveal: per-character lock times left to right, only unlocked slots re-randomise'],
    'opposite-rails': ['Two rows of the same photos scroll in opposite directions at different speeds — the eye compares their velocities and reads the difference as depth. Implementation is two translateX writes: one negated, one scaled, each row carrying a duplicate set for a seamless loop.', 'two rows of photos, one going left, one going right', 'opposite scroll rails: one scroll progress drives rowA −x and rowB +x×0.62, speed difference = depth'],
    'depth-tunnel': ['Redefine scrolling as moving along the z axis. Each image holds a z value; scrolling moves the camera: scale = d / (d + z − cam). Nearby images grow past the camera and fade out, then wrap back to the far end — the gallery becomes an endless tunnel. Dimming distant images sells the depth.', 'scrolling down feels like walking forward', 'scroll depth tunnel: cam advances with scroll, scale = F/(F+rel), images past the camera wrap to the far end'],
    'magnetic-button': ['Turn the pointer into a gravity field: within radius R the button is pulled toward the cursor by (1 − d/R), following with a spring. The falloff matters — a constant pull jumps at the field boundary. Perfect for the primary CTA; the pull-and-release gives the button physical presence.', 'the button gets sucked toward my cursor', 'magnetic button: pull = (1 − d/R) inside radius, spring-follow at 0.18, released back to origin'],
    'tilt-card': ['Map the pointer position on the card to two rotation axes, then add a specular highlight that follows the cursor — a flat surface gains glass thickness. Keep rotation within ±15° and smooth it exponentially; beyond that edges distort and the shimmer reads as jitter, not quality.', 'the card tilts with my mouse and has a glare', 'pointer tilt card: rotateX(−y·14°) rotateY(x·16°), lerp 0.14, radial-gradient glare tracks the pointer'],
    'odometer-counter': ['Build each digit as a vertical 0–9 strip and roll it with translateY. The craft is the rhythm: low digits roll first, higher digits follow with a per-place 55ms delay, and each lands with a slight overshoot — numbers gain a mechanical “ka-chunk”. Use it for counters, prices and leaderboards.', 'the number rolls up like an odometer', 'odometer roll: translateY(−n·10%) per strip, per-digit delay 55ms, overshoot bezier settle'],
    'confetti-burst': ['Treat each piece as a rigid-body particle: random lateral velocity, launched upward then pulled by gravity each frame, spinning around its own axis, removed the moment it leaves the container. Colors come from the theme palette (never a raw rainbow) and 20–30 pieces is the sweet spot — more reads cheap.', 'click and it throws a handful of confetti', 'confetti burst: vy += g per frame, translate + rotate, recycle on exit'],
    'smooth-tabs': ['Move the selected state off the individual tabs and onto one shared indicator: it measures the target item’s offsetLeft/offsetWidth and slides over. Re-measure on mount and on resize — skip the remeasure and the indicator parks at a stale position. This is layout animation in its smallest, most useful form.', 'the underline slides to the tab I click', 'smooth tabs: indicator slides to offsetLeft/offsetWidth, content cross-fades'],
    'coverflow-carousel': ['The whole carousel is a pure function of the index offset: off = i − focus drives lateral offset, Z recession and Y rotation in one transform, so switching focus changes a single number. Opacity and stacking order decay with |off| so far cards fade naturally. Album walls and image galleries all come from this pattern.', 'the middle one is biggest and straight, the sides tilt away', 'coverflow: translateX(44%·off) translateZ(−120·|off|) rotateY(−34°·off)']
  });

  let lang = 'zh';
  try { lang = localStorage.getItem('motion-lang') || 'zh'; } catch (e) {}

  function t(key) { return (UI[lang] && UI[lang][key]) || UI.zh[key] || ''; }

  function refreshStatic() {
    $$('[data-i18n]').forEach(function (el) { el.textContent = t(el.dataset.i18n); });
    applyLabels($$('[data-l10n]'));
    const q = $('#q'); if (q) q.placeholder = t('search');
    document.title = t('docTitle');
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  }

  /* data-l10n 存中文原文，data-l10n-attr 指定要改写哪个属性（默认改写文本） */
  function applyLabels(nodes) {
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i], src = el.dataset.l10n;
      if (src == null) continue;
      const v = (lang === 'en' && LABEL[src]) ? LABEL[src] : src;
      const attr = el.dataset.l10nAttr;
      if (attr) { if (el.getAttribute(attr) !== v) el.setAttribute(attr, v); }
      else if (el.textContent !== v) el.textContent = v;
    }
  }

  function refreshTerms(root) {
    /* 只刷新挂载的详情节点时传 root，避免每次开详情都全站扫一遍（~2000 次 DOM 查询） */
    const scope = root || document;
    const byId = {};
    window.TERMS.forEach(function (x) { byId[x.id] = x; });   /* 之前每个节点都全量 filter，229² 次比较 */
    const nodes = $$('.term', scope);
    /* 详情页传进来的节点自己就是 .term，querySelectorAll 不含自身，不补这一句详情页永远不翻译 */
    if (scope.matches && scope.matches('.term')) nodes.unshift(scope);
    nodes.forEach(function (el) {
      const id = el.dataset.id, term = byId[id];
      if (!term) return;
      applyLabels($$('[data-l10n]', el));
      const en = window.EN[id];
      const def = lang === 'en' && en ? en[0] : term.def;
      const vag = lang === 'en' && en ? en[1] : term.vague;
      const say = lang === 'en' && en ? en[2] : term.say;
      const dEl = $('.pg-def', el) || $('.def', el); if (dEl) dEl.textContent = def;
      const bEl = $('.brief', el);
      if (bEl) {
        const bo = window.ENGINE && window.ENGINE.briefOf;
        bEl.textContent = bo ? bo(def) : def.slice(0, 44) + '…';
      }
      const co = $('.callout p', el); if (co) co.textContent = vag;
      const sy = $('.pg-say span', el); if (sy) sy.textContent = say;
      const cb = $('.callout b', el); if (cb) cb.textContent = t('maySay');
      const cs = $('.pg-say .sw', el); if (cs) cs.textContent = t('sayIt');
      const addb = $('.add', el);
      if (addb) addb.textContent = addb.classList.contains('on') ? t('added') : t('add');
      const rp = $('.replay', el); if (rp) rp.textContent = t('replay');
      const cp = $('.copy', el); if (cp && !cp.dataset.busy) cp.textContent = t('copy');
      const code = $('code', el);
      if (code && window.DIALECTS) code.textContent = window.DIALECTS.codeFor(term);
      const note = $('.code-note', el); if (note) note.textContent = t('codeStatic');
    });
    if (root) return;   /* 局部刷新不涉及分类头 / 侧栏 */
    $$('.cat').forEach(function (sec) {
      const c = window.CATS.filter(x => x.id === sec.dataset.cat)[0]; if (!c) return;
      const pair = CAT_EN[c.id] || [c.en, c.taglineEn || c.tagline];
      const h2 = $('.cat-hd h2', sec);
      if (h2) h2.childNodes[0].nodeValue = lang === 'en' ? pair[0] : c.name;
      const sub = $('.cat-en', sec);
      if (sub) sub.textContent = lang === 'en' ? c.name : (c.en || pair[0]);
      const tag = $('.cat-tag', sec); if (tag) tag.textContent = lang === 'en' ? pair[1] : c.tagline;
      const n = $('.cat-n', sec);
      if (n) n.textContent = $$('.term', sec).length + ' ' + (lang === 'en' ? 'terms' : '个术语');
    });
    $$('#nav a').forEach(function (a) {
      const c = window.CATS.filter(x => x.id === a.dataset.cat)[0]; if (!c) return;
      const pair = CAT_EN[c.id] || [c.en, ''];
      $('span', a).textContent = lang === 'en' ? pair[0] : c.name;
    });
    const empty = $('#empty'); if (empty) empty.textContent = t('empty');
  }

  /* 恢复语言时同步按钮和 html 属性：之前只有走 setLang 才设置，
     EN 用户刷新页面后按钮仍显示 EN（应为「中文」） */
  function syncLangUI() {
    document.documentElement.dataset.lang = lang;
    const b = $('#lang'); if (b) b.textContent = lang === 'en' ? '中文' : 'EN';
    /* hud.js 排在 i18n.js 前面，它那次 paintBtn() 读不到 lang，在这里补一次 */
    if (window.HUD && window.HUD.repaintBtn) window.HUD.repaintBtn();
  }
  syncLangUI();

  function setLang(k) {
    lang = k;
    try { localStorage.setItem('motion-lang', k); } catch (e) {}
    syncLangUI();
    refreshStatic();
    refreshTerms();
    if (window.ENGINE && window.ENGINE.onLang) window.ENGINE.onLang(k);
  }

  window.I18N = {
    get lang() { return lang; },
    t: t, set: setLang,
    refresh: function () { refreshStatic(); refreshTerms(); },
    refreshTerms: refreshTerms
  };
})();
