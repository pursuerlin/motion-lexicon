/* ============================================================
   动效通用词汇 · 数据（第二部分）：反馈 / 循环 / 文字 / 特效 /
   镜头 / 原则 / 性能
   ============================================================ */

window.TERMS.push(

  /* ================= 8. 交互反馈 ================= */
  {
    id: 'hover-lift', en: 'Hover lift', zh: '悬停抬升', cat: 'feedback',
    alias: ['悬浮上浮', 'hover 阴影', '卡片浮起'],
    vague: '鼠标放上去要有点反应',
    say: 'hover：translateY(-4px) + 阴影层级 +1',
    def: '悬停时元素上移并加深阴影，暗示“这是可点的、离你更近了”。位移 2–6px 足够；配 transition 200ms，移出同样要动。',
    code: ':hover { transform: translateY(-4px); box-shadow: 0 12px 24px -8px rgba(0,0,0,.4); }',
    demo: { kind: 'frames', play: 'hover', frames: [[0, 'transform:none; box-shadow:0 1px 0 rgba(0,0,0,.3)'], [100, 'transform:translateY(-6px); box-shadow:0 14px 24px -10px rgba(0,0,0,.6)']], e: 'cubic-bezier(0.16,1,0.3,1)', d: '220ms', hint: '鼠标移到卡片上' }
  },
  {
    id: 'hover-zoom', en: 'Image zoom on hover', zh: '图片悬停放大', cat: 'feedback',
    alias: ['图片hover缩放', '作品墙放大'],
    vague: '指到哪里，哪里的细节就放大给我看',
    say: '悬停时放大图像并以指针为中心取景；触屏点按锁定放大镜',
    def: '放大镜跟随指针移动，镜内只呈现原图对应位置的放大裁切。桌面端移入即可查看，触屏端点按锁定、再点一次收起；图片容器保持原尺寸，周围布局不跟着抖动。',
    code: '.zoom-frame { overflow: hidden; }\n.zoom-lens { clip-path: circle(50%); }\n/* 镜内图片按指针坐标反向平移，再放大 */',
    demo: { kind: 'drag', mode: 'zoom', hint: '移入画面查看细节；触屏点按放大镜' }
  },
  {
    id: 'underline-expand', en: 'Underline expand', zh: '下划线展开', cat: 'feedback',
    alias: ['下划线滑入', '链接 hover 动效'],
    vague: '链接那条线从左边长出来',
    say: '下划线 scaleX 0→1，origin left',
    def: '用 transform-origin 让下划线从一侧长出而不是整条淡入。方向要与阅读方向一致。',
    code: 'a::after { transform: scaleX(0); transform-origin: left; transition: transform 240ms ease-out; }\na:hover::after { transform: scaleX(1); }',
    demo: { kind: 'frames', html: '<div class="obj txt link">悬停看这条线</div>', play: 'hover', frames: [[0, 'transform:scaleX(0)'], [100, 'transform:scaleX(1)']], e: 'cubic-bezier(0.16,1,0.3,1)', d: '280ms', underline: true, hint: '悬停' }
  },
  {
    id: 'press-feedback', en: 'Press / Tap feedback', zh: '按下反馈', cat: 'feedback',
    alias: ['点击态', 'active 态', '按压'],
    vague: '按下去要有手感',
    say: 'active: scale(0.96)，100ms，回弹 ease-out',
    def: '按下时元素缩小（0.94–0.97）表示接受了输入。触屏上尤其关键——没有按压反馈，用户会怀疑没点到而重复点击。',
    code: 'button:active { transform: scale(.96); transition-duration: 80ms; }',
    demo: { kind: 'frames', html: '<div class="obj btn">按住我</div>', play: 'press', frames: [[0, 'transform:scale(1)'], [100, 'transform:scale(.93)']], e: 'ease-out', d: '90ms', hint: '按住不放' }
  },
  {
    id: 'ripple', en: 'Ripple', zh: '水波纹反馈', cat: 'feedback',
    alias: ['涟漪', 'material ripple', '触点扩散'],
    vague: '点一下从指尖散开一圈',
    say: '从触点扩散 ripple，450ms ease-out 后淡出',
    def: 'Material 的招牌反馈：从实际触点扩散一圈半透明波纹。价值在于它精确地确认了“我点在哪”，因此原点必须用真实坐标计算。',
    code: 'const r = el.getBoundingClientRect();\nspan.style.left = `${x - r.left}px`;',
    demo: { kind: 'drag', mode: 'ripple', hint: '在按钮上点击任意位置' }
  },
  {
    id: 'hold-to-confirm', en: 'Hold to confirm', zh: '长按确认', cat: 'feedback',
    alias: ['按住确定', 'progress on hold', '危险操作'],
    vague: '要点住一秒才生效，防误触',
    say: '按住 800ms，进度条填满才触发',
    def: '需要持续按压一段时间（进度反馈）才执行的动作，用于危险或不可撤销操作。松手要能回退进度，这是它区别于普通按钮的核心。',
    code: '/* pointerdown 起 progress，pointerup 前未完成则 animate 回 0 */',
    demo: { kind: 'drag', mode: 'hold', hint: '按住不放，看进度填满' }
  },
  {
    id: 'drag', en: 'Drag', zh: '拖拽', cat: 'feedback',
    alias: ['拖动', 'pointer events', '拖拽跟手'],
    vague: '能拖着走，松手别乱弹',
    say: '拖拽跟手（pointer capture）+ 松手按速度抛掷',
    def: '元素跟随指针移动。三个细节决定质感：grab 时轻微放大、拖拽中 skew 跟随横向速度、松手用速度做惯性投影。',
    code: 'el.setPointerCapture(e.pointerId);',
    demo: { kind: 'drag', mode: 'drag', hint: '抓住方块拖，松手看惯性' }
  },
  {
    id: 'drag-reorder', en: 'Drag to reorder', zh: '拖拽排序', cat: 'feedback',
    alias: ['拖拽换位', 'sortable', 'dnd'],
    vague: '拖着重排，其他行要让开',
    say: '拖起抬升+投影，兄弟项 FLIP 让位',
    def: '列表拖拽换序。被拖项要“抬起来”（放大+阴影），其余项用 FLIP 平滑让位；松手必须回落到网格位置，不能停在鼠标处。',
    code: '/* 拖起: scale 1.04 + z-index; 让位: siblings FLIP */',
    demo: { kind: 'drag', mode: 'reorder', hint: '拖动列表项换序' }
  },
  {
    id: 'swipe-dismiss', en: 'Swipe to dismiss', zh: '滑动划走', cat: 'feedback',
    alias: ['侧滑删除', 'swipe away', '滑掉'],
    vague: '往左一划就删了',
    say: '左右拖动卡片：超过阈值后飞出，下一张原位补上；未过阈值就回弹',
    def: '卡片跟随手势横向移动并轻微倾斜，位移达到阈值后沿当前方向离场；下一张从原有层级顺势补位，未达到阈值则弹回。示例同时提供左右按钮，触屏、鼠标和键盘都能完成操作。',
    code: 'const willDismiss = Math.abs(dx) > width * 0.28;\ncard.animate([{ transform: drag }, { transform: `translateX(${sign * width}px)` }]);',
    demo: { kind: 'drag', mode: 'swipe', hint: '左右拖动卡片，或点两侧按钮选择' }
  },
  {
    id: 'rubber-band', en: 'Rubber-banding', zh: '橡皮筋阻尼', cat: 'feedback',
    alias: ['过拉回弹', 'overscroll', '边界阻尼'],
    vague: '滚到头了还能拉一点，松手会弹回来',
    say: '内容到达滚动边界后，继续拖动的距离逐渐压缩；松手后弹回边界',
    def: '滚动内容到达顶部或底部后，手势仍能带动画面继续移动，但越拉越费力；松手时，内容沿着同一条轴线回到边界。阻尼让用户感觉“到头了”，回弹则把位置重新对齐。',
    code: 'const over = rawScroll - clamp(rawScroll, 0, maxScroll);\nconst stretch = Math.sign(over) * (Math.sqrt(Math.abs(over) + 1) - 1) * 5.2;',
    demo: { kind: 'drag', mode: 'rubber', hint: '拖动列表到顶部或底部，再继续拉一下' }
  },
  {
    id: 'shake', en: 'Shake', zh: '抖动', cat: 'feedback',
    alias: ['报错摇头', 'wiggle error', '拒绝反馈'],
    vague: '密码错了让它抖一下',
    say: 'shake：x 位移 3 次衰减，400ms',
    def: '左右快速衰减抖动，表示拒绝或错误。是人类摇头动作的抽象，因此只能用在失败反馈上；频率高、时长短（<500ms）。',
    code: '@keyframes shake { 20%{transform:translateX(-8px)} 40%{translateX(6px)} 60%{-4px} 80%{2px} }',
    demo: { kind: 'frames', html: '<div class="obj field">错误密码</div>', frames: [[0, 'transform:translateX(0)'], [15, 'transform:translateX(-10px)'], [35, 'transform:translateX(8px)'], [55, 'transform:translateX(-5px)'], [75, 'transform:translateX(3px)'], [100, 'transform:translateX(0)']], e: 'ease-in-out', d: '440ms', hint: '每次进入自动重播' }
  },
  {
    id: 'nudge', en: 'Nudge / Wiggle', zh: '轻推提示', cat: 'feedback',
    alias: ['戳一下', '吸引注意', 'bob'],
    vague: '让它自己动一下提醒我点',
    say: '首次进入 nudge 一次：Y 位移 ±4px，两个来回',
    def: '比 shake 温柔得多的提醒动作，通常只做 1–2 个来回就停。用于引导用户注意到入口，切忌循环播放（会被当成 bug 或噪声）。',
    code: 'animation: nudge 620ms ease-in-out 2;',
    demo: { kind: 'frames', html: '<div class="obj chip">点我试试</div>', frames: [[0, 'transform:translateY(0)'], [30, 'transform:translateY(-6px)'], [60, 'transform:translateY(2px)'], [80, 'transform:translateY(-2px)'], [100, 'transform:none']], e: 'ease-in-out', d: '620ms', repeat: 2 }
  },
  {
    id: 'pulse', en: 'Pulse', zh: '脉冲', cat: 'feedback',
    alias: ['呼吸光环', 'ping', '扩散提示'],
    vague: '像心跳一样往外扩一圈圈',
    say: 'pulse：scale + opacity 循环，周期 1.8s',
    def: '周期性缩放或扩散光环，表示“活的/有新东西”。频率应低于人的静息心率观感（>1.5s 一轮），否则制造焦虑。',
    code: 'animation: pulse 1.8s ease-out infinite;',
    demo: { kind: 'frames', html: '<div class="obj dot pulse"><i class="ring"></i></div>', frames: [[0, 'transform:scale(.6); opacity:.9'], [100, 'transform:scale(2.1); opacity:0']], e: 'cubic-bezier(0.16,1,0.3,1)', d: '1800ms', loop: true, pulse: true }
  },
  {
    id: 'focus-ring', en: 'Focus ring', zh: '焦点环', cat: 'feedback',
    alias: ['键盘焦点', 'focus-visible', '可达性焦点'],
    vague: 'Tab 到它的时候圈一下',
    say: ':focus-visible 显示 2px outline + offset',
    def: '键盘导航时显示的可见焦点。它是无障碍的强制项而不是可选装饰；只在 focus-visible（键盘触发）时显示，避免鼠标点击也出现描边。',
    code: ':focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }',
    demo: { kind: 'frames', html: '<div class="focus-set"><span class="focus-caption">键盘焦点会落在这里</span><button type="button" class="obj focus-demo focus-choice">概览</button><button type="button" class="obj focus-demo focus-choice">动效</button><button type="button" class="obj focus-demo focus-choice">代码</button></div>', behavior: 'focus', frames: [[0, 'outline-offset:5px; outline-color:transparent'], [100, 'outline-offset:2px; outline-color:var(--accent)']], e: 'ease-out', d: '180ms', hint: '按 Tab 依次查看焦点环；Shift + Tab 反向' }
  },
  {
    id: 'cursor-magnet', en: 'Magnetic hover', zh: '磁吸跟随', cat: 'feedback',
    alias: ['磁吸按钮', 'cursor follow', '吸附'],
    vague: '鼠标靠近按钮就被吸过去',
    say: '按钮朝光标偏移最多 8px，离开 spring 回位',
    def: '光标靠近时按钮朝其轻微位移，像被吸引。让界面显得有“引力场”，常用于 CTA。偏移要小（<12px），否则显得不受控。',
    code: 'const dx = (cx - bx / 2) * 0.28;  /* 越近吸得越明显 */',
    demo: { kind: 'frames', html: '<div class="obj btn magnet">磁吸</div>', behavior: 'magnet', hint: '把光标移近按钮' }
  },
  {
    id: 'pull-to-refresh', en: 'Pull to refresh', zh: '下拉刷新', cat: 'feedback',
    alias: ['下拉加载', 'PTR', '越界下拉'],
    vague: '往下拽出个圈圈刷新',
    say: '下拉越过阈值后松手刷新，指示器旋转 360°',
    def: '在列表顶部继续下拉以触发刷新，带橡皮筋阻尼和一个随距离渐显的指示器。本质是把物理动作映射成“把新东西拽出来”的隐喻。',
    code: '/* 顶部越界距离 → 指示器 rotate/opacity，越过 72px 触发 */',
    demo: { kind: 'drag', mode: 'ptr', hint: '向下拖列表，越过阈值松手' }
  },
  {
    id: 'skeleton', en: 'Skeleton screen', zh: '骨架屏', cat: 'feedback',
    alias: ['占位骨架', '加载占位', 'shimmer 占位'],
    vague: '先给个灰块别一片空白',
    say: '骨架屏 + shimmer 扫光，尺寸对齐真实内容',
    def: '用与真实内容同形状的灰色占位块代替 spinner。感知性能利器：它让等待显得更短，并且提前告知布局结构，避免内容到达时的跳动（CLS）。',
    code: 'background: linear-gradient(90deg, #222 25%, #2e2e2e 37%, #222 63%);\nbackground-size: 400% 100%; animation: shimmer 1.4s ease-in-out infinite;',
    demo: { kind: 'frames', html: '<article class="sk"><div class="sk-top"><i class="sk-avatar"></i><span class="sk-user"><i class="sk-line sk-name"></i><i class="sk-line sk-meta"></i></span></div><i class="sk-cover"></i><i class="sk-line sk-title"></i><i class="sk-line sk-copy"></i><i class="sk-line sk-copy short"></i><div class="sk-bottom"><i class="sk-line sk-tag"></i><i class="sk-line sk-action"></i></div></article>', frames: [[0, 'background-position:120% 0'], [100, 'background-position:-20% 0']], e: 'linear', d: '1600ms', loop: true, shimmer: true, st: -500 }
  },
  {
    id: 'toast-in', en: 'Toast enter', zh: '轻提示入场', cat: 'feedback',
    alias: ['消息条', 'snackbar 出现'],
    vague: '右上角弹一条提示',
    say: 'toast：translateY+fade 240ms，4s 后 ease-in 退场',
    def: '临时通知的进出场。要点：从屏幕边缘进入（表明来源是系统）、不打断输入、自动消失且消失比出现快。',
    code: 'animation: toast-in 240ms cubic-bezier(0.16,1,0.3,1) both;\nanimation: toast-out 160ms ease-in both;',
    demo: { kind: 'frames', html: '<div class="obj toast">已保存到云端</div>', frames: [[0, 'opacity:0; transform:translateY(14px) scale(.96)'], [10, 'opacity:1; transform:none'], [93.33, 'opacity:1; transform:none'], [100, 'opacity:0; transform:translateY(-6px)']], e: 'cubic-bezier(0.16,1,0.3,1)', d: '2400ms', loop: true }
  },
  {
    id: 'progress-bar', en: 'Progress indicator', zh: '进度指示', cat: 'feedback',
    alias: ['进度条', 'linear progress', '不确定态'],
    vague: '给个条告诉我进行到哪',
    say: '确定态 scaleX 映射真实进度；不确定态循环扫动',
    def: '可量化任务用确定进度条（要有真实数据），不可量化时用不确定态扫动。虚假的“假进度”会让用户对真实等待更不耐烦。',
    code: 'bar.style.transform = `scaleX(${done / total})`;',
    demo: { kind: 'frames', html: '<div class="obj trackbar"><i class="fill"></i></div>', frames: [[0, 'transform:scaleX(0)'], [100, 'transform:scaleX(1)']], e: 'cubic-bezier(0.4,0,0.2,1)', d: '1600ms', loop: true, bar: true }
  },

  /* ================= 9. 循环与环境动效 ================= */
  {
    id: 'loop', en: 'Loop / Iteration', zh: '循环', cat: 'loop',
    alias: ['无限循环', 'infinite'],
    vague: '一直动',
    say: 'infinite 循环，接缝处首尾帧必须一致',
    def: '动画重复播放。判断循环质量的标准只有一个：能否找出接缝（seam）。首帧与末帧的任何差异都会变成可见的“顿一下”。',
    code: 'animation: bob 2.4s ease-in-out infinite;',
    demo: { kind: 'frames', frames: [[0, 'transform:translateY(8px)'], [50, 'transform:translateY(-8px)'], [100, 'transform:translateY(8px)']], e: 'ease-in-out', d: '2400ms', loop: true }
  },
  {
    id: 'marquee', en: 'Marquee', zh: '跑马灯', cat: 'loop',
    alias: ['无限滚动条', 'logo 墙', '无缝滚动'],
    vague: '一排 logo 一直往左走',
    say: '内容复制一份，translateX(-50%) 无缝循环',
    def: '横向（纵向亦可）无限滚动的内容带，常用于 logo 墙、公告。无缝的关键是把内容复制两份并移动 -50%，而不是移动一个内容宽度。',
    code: '.track { animation: marquee 18s linear infinite; }\n@keyframes marquee { to { transform: translateX(-50%) } }',
    demo: { kind: 'frames', html: '<div class="marquee"><span>LOGO</span><span>LOGO</span><span>LOGO</span><span>LOGO</span><span>LOGO</span><span>LOGO</span><span>LOGO</span><span>LOGO</span></div>', frames: [[0, 'transform:translateX(0)'], [100, 'transform:translateX(-50%)']], e: 'linear', d: '6000ms', loop: true, marquee: true }
  },
  {
    id: 'orbit', en: 'Orbit', zh: '环绕', cat: 'loop',
    alias: ['绕行', '公转', '环形运动'],
    vague: '有小点点围着转',
    say: '多颗卫星不同半径/周期环绕，形成轨道感',
    def: '元素沿圆形或椭圆路径围绕中心运动。用 rotate 外层容器 + 反向 rotate 内层可保持卫星自身不翻转。',
    code: '.orbit { animation: spin 6s linear infinite; }\n.satellite { animation: spin 6s linear infinite reverse; }',
    demo: { kind: 'frames', html: '<div class="orbit-box"><i class="o o1"></i><i class="o o2"></i><i class="c"></i></div>', frames: [[0, 'transform:rotate(0)'], [100, 'transform:rotate(360deg)']], e: 'linear', d: '4200ms', loop: true, orbit: true }
  },
  {
    id: 'float', en: 'Float', zh: '漂浮', cat: 'loop',
    alias: ['悬浮', '上下浮动', 'bob'],
    vague: '让它悬着，轻轻晃',
    say: 'float：Y ±6px + 微旋转，3–5s alternate',
    def: '缓慢上下漂浮，暗示元素处于失重或悬浮状态。周期要长（3s 以上）、幅度要小，配合阴影变化才可信。',
    code: 'animation: float 4s ease-in-out infinite alternate;',
    demo: { kind: 'frames', frames: [[0, 'transform:translateY(7px) rotate(-1.5deg)'], [100, 'transform:translateY(-7px) rotate(1.5deg)']], e: 'ease-in-out', d: '3200ms', loop: true, alt: true }
  },
  {
    id: 'idle-breathing', en: 'Idle / Breathing', zh: '待机呼吸', cat: 'loop',
    alias: ['idle animation', '角色待机', '微动'],
    vague: '让它看起来是活的，但别明显',
    say: 'idle：scale 1→1.015，4.5s 周期',
    def: '静止状态下极微弱的持续变化（呼吸、微缩放、光晕），让吉祥物和插画不显得死板。理想效果是用户说不出它在动，但停掉会觉得死。',
    code: 'animation: breathe 4.5s ease-in-out infinite alternate;',
    demo: { kind: 'frames', html: '<div class="obj blob"></div>', frames: [[0, 'transform:scale(1)'], [100, 'transform:scale(1.015)']], e: 'ease-in-out', d: '4500ms', loop: true, alt: true }
  },
  {
    id: 'spinner', en: 'Spinner', zh: '加载指示器', cat: 'loop',
    alias: ['转圈', 'loading', '活动指示'],
    vague: '转个圈表示在加载',
    say: 'spinner：匀速旋转 + 端点渐变，1s 一轮',
    def: '不确定加载时间的循环指示。注意它只表达“系统还活着”，不表达进度；能拿到进度就该换成进度条或骨架屏。',
    code: 'animation: spin 0.9s linear infinite;',
    demo: { kind: 'frames', html: '<div class="obj spinner"></div>', frames: [[0, 'transform:rotate(0)'], [100, 'transform:rotate(360deg)']], e: 'linear', d: '900ms', loop: true }
  },
  {
    id: 'shimmer', en: 'Shimmer', zh: '扫光', cat: 'loop',
    alias: ['高光扫过', '微光流动', 'sweep'],
    vague: '有一道光慢慢扫过去',
    say: '渐变背景位移，做扫光效果',
    def: '让高光在表面扫过，模拟材质反光或加载中的呼吸。实现上多为背景位移而非元素移动，性能开销主要在合成层。',
    code: 'background-size: 200% 100%; animation: sweep 2.2s linear infinite;',
    demo: { kind: 'frames', html: '<div class="obj chip shine">扫光标签</div>', frames: [[0, 'background-position:-100% 0'], [100, 'background-position:200% 0']], e: 'linear', d: '2200ms', loop: true, shine: true }
  },
  {
    id: 'gradient-sweep', en: 'Animated gradient', zh: '流动渐变', cat: 'loop',
    alias: ['渐变流动', 'mesh 背景动'],
    vague: '背景颜色慢慢变',
    say: '大面积渐变缓慢位移/旋转，15–30s 周期',
    def: '让渐变本身随时间变化，常用于 hero 背景。周期必须极长（15s+），任何可察觉的“节奏”都会显得廉价并抢内容。',
    code: 'background-size: 300% 300%; animation: drift 24s ease-in-out infinite alternate;',
    demo: { kind: 'frames', html: '<div class="obj grad wide"></div>', frames: [[0, 'background-position:0% 50%'], [100, 'background-position:100% 50%']], e: 'ease-in-out', d: '15000ms', loop: true, alt: true }
  },
  {
    id: 'confetti', en: 'Particle burst / Confetti', zh: '粒子喷发', cat: 'loop',
    alias: ['撒花', '彩带', '庆祝动效'],
    vague: '成功了撒点花',
    say: '从成功点向外喷发 30–60 颗粒子，重力+衰减',
    def: '庆祝性粒子喷射。属于高频情绪反馈，只在真正的里程碑触发；每次粒子数与存活时间要设上限，否则掉帧。',
    code: '/* canvas 或 DOM 粒子：v0 + gravity + drag + life */',
    demo: { kind: 'frames', html: '<div class="burst"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>', frames: [[0, 'transform:translate(0,0) scale(.4); opacity:1'], [100, 'transform:translate(var(--dx),var(--dy)) scale(0); opacity:0']], e: 'cubic-bezier(0.16,1,0.3,1)', d: '1100ms', loop: true, burst: true }
  },
  {
    id: 'ambient', en: 'Ambient motion', zh: '环境动效', cat: 'loop',
    alias: ['氛围动画', '背景微动', 'living background'],
    vague: '背景有点东西在慢慢动',
    say: '背景层做低对比、长周期的环境运动',
    def: '不构成信息、只负责空气感的运动（缓慢光斑、漂浮几何、噪点流动）。判断标准：把内容截图出来，它不该占据任何注意力。',
    code: 'animation: drift 30s ease-in-out infinite alternate;',
    demo: { kind: 'frames', html: '<div class="amb"><i></i><i></i><i></i></div>', frames: [[0, 'transform:translate(0,0) scale(1)'], [100, 'transform:translate(18px,-14px) scale(1.15)']], e: 'ease-in-out', d: '4200ms', loop: true, alt: true, ambient: true, st: -1400 }
  },
  {
    id: 'steps-seamless', en: 'Seamless cycle', zh: '无接缝循环', cat: 'loop',
    alias: ['接缝', '首尾一致', 'loop point'],
    vague: '为什么它每次都顿一下',
    say: '首尾帧状态一致 + 缓动对称，消除接缝',
    def: '循环动画的质量门槛：找不到循环点。常见破坏原因是用了 alternate + ease-in-out（每端都慢下来形成“点头”），改用 sine 或 keyframe 手工对齐速度。',
    code: '/* 反例：ease-in-out + alternate → 端点可见停顿 */\n/* 正解：cubic-bezier(0.37,0,0.63,1) 近似正弦 */',
    demo: {
      kind: 'two',
      a: { label: 'ease-in-out · 端点有顿感', frames: [[0, 'transform:translateX(-46px)'], [100, 'transform:translateX(46px)']], e: 'ease-in-out', d: '900ms', loop: true, alt: true },
      b: { label: 'sine-in-out · 接近无接缝', frames: [[0, 'transform:translateX(-46px)'], [100, 'transform:translateX(46px)']], e: 'cubic-bezier(0.37,0,0.63,1)', d: '900ms', loop: true, alt: true }
    }
  },

  /* ================= 10. 文字动效 ================= */
  {
    id: 'typewriter', en: 'Typewriter', zh: '打字机', cat: 'text',
    alias: ['逐字打出', '打字效果', '光标闪烁'],
    vague: '一个字一个字冒出来',
    say: '逐字 reveal 40ms/字 + 光标闪烁',
    def: '逐字符显示，模拟输入。速度感来自字符间隔（25–60ms）而不是总时长；长文本用它反而低效，因为阅读速度赶不上打字速度。',
    code: 'steps(n) + width: 0 → 100%;  /* n = 字符数，等宽字体最稳 */',
    demo: { kind: 'type', mode: 'typewriter' }
  },
  {
    id: 'scramble', en: 'Scramble / Decode', zh: '乱码解码', cat: 'text',
    alias: ['文字随机', '黑客效果', 'decode text'],
    vague: '花符跳几下变成字',
    say: '随机字符逐步收敛为目标文本，600ms',
    def: '文字先呈现随机字符再逐位“解码”为正文。科技感强，适合标题与状态切换，不适合正文；字符集要包含符号才有质感。',
    code: '/* 每帧以 i/total 概率落到最终字符 */',
    demo: { kind: 'type', mode: 'scramble' }
  },
  {
    id: 'split-text', en: 'Split text', zh: '文字拆分', cat: 'text',
    alias: ['逐字符', '拆词', 'by letter / by word'],
    vague: '标题一个字母一个字母进来',
    say: '按字符（或词）拆分后 stagger 30ms 入场',
    def: '把文本切成字符/词/行三个颗粒度的可独立驱动单元。拆分后必须处理可访问性（aria-hidden 原文）和断行，否则移动端会很乱。',
    code: 'el.innerHTML = text.split("").map((c, i) => `<span style="--i:${i}">${c}</span>`).join("");',
    demo: { kind: 'type', mode: 'split' }
  },
  {
    id: 'line-mask', en: 'Line mask reveal', zh: '逐行遮罩揭示', cat: 'text',
    alias: ['行抬起', 'clip line', '文字上滑露出'],
    vague: '文字一行一行从下面抬上来',
    say: '每行 overflow hidden，行内容 translateY(100%)→0',
    def: '把每行装进一个裁切容器，内容从下方抬进可见区。编辑感、印刷感很强，是品牌站标题最常用的高级手法之一。',
    code: '.line { overflow: hidden; } .line span { transform: translateY(110%); }\n/* 目标：translateY(0)，行 stagger 60ms */',
    demo: { kind: 'type', mode: 'lineMask' }
  },
  {
    id: 'kinetic-type', en: 'Kinetic typography', zh: '动态排版', cat: 'text',
    alias: ['文字动画视频', '文字表演', '排版运动'],
    vague: '文字本身当画面主体在动',
    say: '文字按音节落点做缩放/位移，成为画面主体',
    def: '让文字本身充当画面主角并随节奏运动，常见于视频字幕、宣言式落地页。核心是把语义重音映射到运动强度。',
    code: '/* 重音词 scale 1.15 + 提前 1 帧；弱读词仅淡入 */',
    demo: { kind: 'type', mode: 'kinetic' }
  },
  {
    id: 'number-ticker', en: 'Number ticker', zh: '数字滚动', cat: 'text',
    alias: ['老虎机数字', '翻页数字', 'roll digits'],
    vague: '数字像老虎机那样滚上去',
    say: '每位数字纵向滚动落位，逐位停住',
    def: '数字以纵向滚动方式落到目标值，像机械计数器。需要 fixed 高度裁切与 transform 位移；位数变化时要预留宽度。',
    code: '.digit { height: 1em; overflow: hidden; } .col { transform: translateY(calc(var(--v) * -1em)); }',
    demo: { kind: 'type', mode: 'ticker' }
  },
  {
    id: 'count-up', en: 'Count up', zh: '数值递增', cat: 'text',
    alias: ['数字增长', '统计数动画', 'odometer-lite'],
    vague: '数字从 0 涨到 892',
    say: '0→892 用 ease-out 递增，进位不线性',
    def: '数值从 0 增长到目标。关键是缓动要用 ease-out（大数很快到达、小数慢慢收敛）——线性递增会让人怀疑数据造假。',
    code: 'const v = Math.round(target * easeOutExpo(t));',
    demo: { kind: 'type', mode: 'countup' }
  },
  {
    id: 'tabular-nums', en: 'Tabular numbers', zh: '等宽数字', cat: 'text',
    alias: ['数字等宽', 'font-variant-numeric'],
    vague: '数字跳动的时候整行在抖',
    say: 'font-variant-numeric: tabular-nums 固定字宽',
    def: '让每个数字占相同宽度。做数字动效前的必修一行 CSS——否则比例字体会让整行文本在计数过程中左右抽动。',
    code: 'font-variant-numeric: tabular-nums;',
    demo: { kind: 'type', mode: 'tabular' }
  },
  {
    id: 'highlight-sweep', en: 'Highlight sweep', zh: '荧光笔划过', cat: 'text',
    alias: ['背景色展开', 'mark 动效', '划重点'],
    vague: '像荧光笔划过一行字',
    say: '文字背景 scaleX 0→1 划过，origin left',
    def: '在文字背后画出一条高亮，模拟荧光笔。因为不动文字本身，阅读节奏不被打断，适合长文重点提示。',
    code: 'span { background: linear-gradient(var(--hl), var(--hl)) 0 90% / 0 40% no-repeat; transition: background-size 400ms ease-out; }\n.in { background-size: 100% 40%; }',
    demo: { kind: 'frames', html: '<div class="obj txt hl">这句话值得划重点</div>', behavior: 'highlight' }
  },
  {
    id: 'text-glitch', en: 'Text glitch', zh: '文字故障', cat: 'text',
    alias: ['RGB 分离', '抖动错位文字'],
    vague: '字有点坏了的感觉',
    say: '三层错位 + clip-path 抖动，2–4 次后收敛',
    def: '文字做色差分离与切片错位。风格信号极强（赛博、复古终端），时长必须短、次数必须有限，否则会显得画面不稳定。',
    code: '/* ::before/::after 复制文本，各自 clip-path + translate + blend */',
    demo: { kind: 'type', mode: 'glitch' }
  },
  {
    id: 'text-replace-flip', en: 'Text flip swap', zh: '文字翻转替换', cat: 'text',
    alias: ['换词翻转', '滚动切换词'],
    vague: '这个词自己翻成另一个词',
    say: '旧词 rotateX(90°) 退出，新词从 -90° 进入',
    def: '用绕 X 轴翻面完成词语替换，常见于轮播标语。两词高度必须固定（或用 max-width 预留），否则容器会一路抖。',
    code: 'animation: flip-out 320ms ease-in both; / flip-in 320ms ease-out 320ms both;',
    demo: { kind: 'type', mode: 'flipWord' }
  },
  {
    id: 'cursor-caret', en: 'Blinking caret', zh: '光标闪烁', cat: 'text',
    alias: ['闪烁光标', 'caret', 'steps 闪烁'],
    vague: '后面那个竖线一闪一闪',
    say: 'caret 用 steps(2) 做硬闪，周期 1s',
    def: '打字机效果的附属元素。必须用 steps(2) 而不是渐变（真光标不会淡入），并且在句子结束后继续闪 2–3 次再消失，否则像坏了。',
    code: 'animation: blink 1s steps(2, start) infinite;',
    demo: { kind: 'frames', html: '<div class="obj txt caret-demo">MOTION<span class="caret"></span></div>', frames: [[0, 'opacity:1'], [100, 'opacity:0']], e: 'steps(2)', d: '500ms', loop: true, caret: true }
  },

  /* ================= 11. 润色与特效 ================= */
  {
    id: 'blur', en: 'Blur', zh: '模糊', cat: 'polish',
    alias: ['高斯模糊', 'backdrop-filter', '毛玻璃'],
    vague: '虚一点，透出高级感',
    say: 'backdrop-filter: blur(20px) 做毛玻璃层',
    def: '柔化细节。filter: blur 作用于元素自身，backdrop-filter 作用于其下方内容（毛玻璃）。后者在移动端开销大，需要设上限层数。',
    code: '.glass { backdrop-filter: blur(20px) saturate(1.4); background: rgba(255,255,255,.06); }',
    demo: { kind: 'frames', html: '<div class="glasswrap"><i class="bg blur-pattern"></i><div class="obj glass blur-demo"><span>磨砂玻璃</span><small>BACKGROUND · CLEAR → SOFT</small></div></div>', frames: [[0, 'backdrop-filter:blur(0px) saturate(1)'], [100, 'backdrop-filter:blur(20px) saturate(1.35)']], e: 'ease-in-out', d: '1800ms', loop: true, alt: true }
  },
  {
    id: 'clip-path', en: 'Clip-path', zh: '裁切路径', cat: 'polish',
    alias: ['形状裁切', '多边形遮罩', 'polygon'],
    vague: '把图裁成斜的',
    say: 'clip-path: polygon() 做斜切与揭示',
    def: '用几何路径切掉元素可见区域。形状之间可以插值（点数需一致），因此既是造型工具也是转场工具。',
    code: 'clip-path: polygon(0 0, 100% 8%, 100% 100%, 0 92%);',
    demo: { kind: 'frames', html: '<div class="obj img"></div>', frames: [[0, 'clip-path:polygon(0 100%, 100% 100%, 100% 100%, 0 100%)'], [100, 'clip-path:polygon(0 0, 100% 8%, 100% 100%, 0 92%)']], e: 'cubic-bezier(0.76,0,0.24,1)', d: '1200ms', loop: true, alt: true }
  },
  {
    id: 'mask', en: 'Mask', zh: '遮罩', cat: 'polish',
    alias: ['mask-image', '渐变蒙版', '挖洞'],
    vague: '边缘淡出到背景里',
    say: 'mask-image 渐变让边缘自然消隐',
    def: '用一张图（常是渐变）决定透明度分布，做软边缘、挖孔、扫光显影。与 clip-path 的区别是：mask 有半透明，clip 只有硬边。',
    code: 'mask-image: linear-gradient(to bottom, #000 60%, transparent);',
    demo: { kind: 'frames', html: '<div class="obj img masked2"></div>', frames: [[0, 'mask-position:0 -60%'], [100, 'mask-position:0 160%']], e: 'ease-in-out', d: '2200ms', loop: true }
  },
  {
    id: 'line-drawing', en: 'Line drawing / SVG stroke', zh: '描边绘制', cat: 'polish',
    alias: ['线条生长', 'stroke-dashoffset', '手绘出现'],
    vague: '线自己画出来',
    say: 'stroke-dasharray + dashoffset 描线生长',
    def: '通过虚线偏移让 SVG 路径自己“被画出来”。要求先量取 pathLength，并按书写顺序安排路径，否则像擦除而不是绘制。',
    code: 'path { stroke-dasharray: var(--len); stroke-dashoffset: var(--len); }\n/* 动画到 0 */',
    demo: { kind: 'draw' }
  },
  {
    id: 'glow', en: 'Glow', zh: '发光', cat: 'polish',
    alias: ['霓虹', 'bloom', '泛光'],
    vague: '让它发亮',
    say: '多层 box-shadow 扩散 + 亮度饱和做泛光',
    def: '让亮部向外溢出。真实泛光需要“亮部超过 1 再向下压缩”，CSS 里用多层模糊阴影近似；颜色要偏亮而不是偏浓。',
    code: 'box-shadow: 0 0 12px var(--c), 0 0 40px color-mix(in srgb, var(--c) 60%, transparent);',
    demo: { kind: 'frames', html: '<div class="obj demo-content demo-beacon" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><path d="m20 6 3.6 10.4L34 20l-10.4 3.6L20 34l-3.6-10.4L6 20l10.4-3.6Z" fill="currentColor"/></svg></div>', frames: [[0, 'box-shadow:0 0 0 0 color-mix(in srgb,var(--accent) 0%,transparent)'], [100, 'box-shadow:0 0 16px 4px color-mix(in srgb,var(--accent) 30%,transparent),0 0 38px 8px color-mix(in srgb,var(--accent) 16%,transparent)']], e: 'ease-in-out', d: '1400ms', loop: true, alt: true }
  },
  {
    id: 'grain', en: 'Grain / Noise', zh: '颗粒噪点', cat: 'polish',
    alias: ['胶片颗粒', 'SVG turbulence', '质感噪点'],
    vague: '加点胶片感',
    say: '低透明度噪点层 + 8 帧位移抖动',
    def: '叠加细小噪点，消除数字画面的塑料感。要动就得每帧换位置（steps 抖动），静止的噪点会被眼睛当成脏污。',
    code: 'background-image: url(noise.svg); animation: grain 0.5s steps(6) infinite;',
    demo: { kind: 'frames', html: '<div class="obj img grained"><i class="noise"></i></div>', frames: [[0, 'transform:translate(0,0)'], [25, 'transform:translate(-3%,2%)'], [50, 'transform:translate(2%,-3%)'], [75, 'transform:translate(-2%,-1%)'], [100, 'transform:translate(0,0)']], e: 'steps(1)', d: '600ms', loop: true, grain: true }
  },
  {
    id: 'elevation', en: 'Elevation / Shadow transition', zh: '层级阴影过渡', cat: 'polish',
    alias: ['高度感', 'shadow 变化', 'Material elevation'],
    vague: '让它看起来浮起来',
    say: '阴影随 z 层级同步变化（1→3dp）',
    def: '用阴影的扩散半径与不透明度表达“离屏幕多远”。Material 把高度定义为 1/3/6/8/12dp 等离散层级，因此阴影值也应该是 token，而不是随手写。',
    code: 'box-shadow: 0 2px 4px rgba(0,0,0,.10), 0 8px 24px rgba(0,0,0,.12);',
    demo: { kind: 'frames', frames: [[0, 'box-shadow:0 1px 1px rgba(0,0,0,.35); transform:none'], [100, 'box-shadow:0 18px 34px -12px rgba(0,0,0,.7); transform:translateY(-8px)']], e: 'cubic-bezier(0.16,1,0.3,1)', d: '1100ms', loop: true, alt: true }
  },
  {
    id: 'light-sweep', en: 'Specular sweep', zh: '高光扫过', cat: 'polish',
    alias: ['闪一下', '金属反光', 'glint'],
    vague: '金属那种反了一下光',
    say: '斜向高光条 600ms 扫过表面',
    def: '一条窄高光快速掠过表面，暗示材质（金属/玻璃/卡片）。一次性效果，周期短（400–800ms），常用于按钮与收藏卡。',
    code: '.btn::after { transform: translateX(-120%) skewX(-20deg); } /* → 120% */',
    demo: { kind: 'frames', html: '<div class="obj card sweep"><i class="beam"></i></div>', frames: [[0, 'transform:translateX(-130%) skewX(-20deg)'], [100, 'transform:translateX(130%) skewX(-20deg)']], e: 'cubic-bezier(0.65,0,0.35,1)', d: '1500ms', loop: true, sweep: true }
  },
  {
    id: 'chromatic', en: 'Chromatic aberration', zh: '色散 / 色差', cat: 'polish',
    alias: ['RGB 分离', '镜头色边'],
    vague: '边缘有红蓝分离',
    say: 'R/B 通道各偏移 1–3px 叠合',
    def: '模拟镜头边缘的色分离，让画面更“有机器”。位移量以像素计且必须极小，超过 4px 就从质感变成故障。',
    code: 'text-shadow: -2px 0 rgba(255,0,80,.5), 2px 0 rgba(0,200,255,.5);',
    demo: { kind: 'frames', html: '<div class="obj txt chroma">MOTION</div>', frames: [[0, 'text-shadow:-1px 0 rgba(255,60,120,.7), 1px 0 rgba(60,200,255,.7)'], [100, 'text-shadow:-4px 0 rgba(255,60,120,.7), 4px 0 rgba(60,200,255,.7)']], e: 'ease-in-out', d: '1200ms', loop: true, alt: true }
  },
  {
    id: 'glass', en: 'Glassmorphism', zh: '玻璃拟态', cat: 'polish',
    alias: ['磨砂玻璃', '半透明面板'],
    vague: '那种磨砂半透明的面板',
    say: '半透明面板 + backdrop-blur + 1px 高光描边',
    def: '模糊背景 + 半透明填充 + 细亮边，构成“玻璃”材质。真正让它成立的是边缘那道 1px 高光，没有它只会看起来像脏了的灰块。',
    code: 'border: 1px solid rgba(255,255,255,.14); backdrop-filter: blur(16px);',
    demo: { kind: 'frames', html: '<div class="glasswrap"><i class="bg colorful"></i><div class="obj glass edge">Glass</div></div>', frames: [[0, 'opacity:0; transform:translateX(-58px)'], [100, 'opacity:1; transform:none']], e: 'cubic-bezier(0.16,1,0.3,1)', d: '700ms' }
  },
  {
    id: 'depth-field', en: 'Depth of field', zh: '景深', cat: 'polish',
    alias: ['焦点转移', '前后虚化'],
    vague: '前面糊掉，后面的清楚',
    say: '前景 blur(8px)+opacity .5，主体清晰',
    def: '只让主体清晰、其余按距离虚化，引导视线。网页里通常是“静态景深”（写死几档），动态对焦转移则需要 canvas/WebGL。',
    code: '.near { filter: blur(8px); opacity: .45; }',
    demo: { kind: 'frames', html: '<div class="dof"><i class="obj card near"></i><i class="obj card mid"></i><i class="obj card far"></i></div>', frames: [[0, 'filter:blur(0); opacity:1'], [100, 'filter:blur(7px); opacity:.45']], e: 'ease-in-out', d: '1300ms', loop: true, alt: true, dof: true, st: -450 }
  },
  {
    id: 'bokeh', en: 'Bokeh', zh: '焦外光斑', cat: 'polish',
    alias: ['虚化光点', '散景'],
    vague: '背景那种圆圆的虚化光点',
    say: '若干大半径模糊圆形，缓慢漂移',
    def: '失焦光源形成的柔和圆形光斑。作为背景层时透明度要低（<0.18），且不要参与任何信息表达。',
    code: 'border-radius: 50%; filter: blur(28px); opacity: .16;',
    demo: { kind: 'frames', html: '<div class="bokeh"><i></i><i></i><i></i></div>', frames: [[0, 'transform:translate(0,0) scale(1)'], [100, 'transform:translate(14px,-18px) scale(1.18)']], e: 'ease-in-out', d: '3600ms', loop: true, alt: true, bokeh: true, st: -1200 }
  },

  /* ================= 12. 镜头与叙事 ================= */
  {
    id: 'dolly', en: 'Dolly in / Push in', zh: '推镜', cat: 'camera',
    alias: ['推近', '摄像机前推', 'zoom in 镜头'],
    vague: '镜头慢慢推近一点',
    say: '相机沿 Z 轴前推（dolly-in），场景视差自然产生',
    def: '相机本体向场景移动（区别于只改变焦距的 zoom）：近处物体动得快、远处慢，视差与透视会真实变化，因此更沉浸。',
    code: 'scene { transform: translateZ(-200px) → translateZ(120px); }',
    demo: { kind: 'frames', html: '<div class="cam"><i class="obj card far"></i><i class="obj card near"></i></div>', frames: [[0, 'transform:translateZ(-180px)'], [100, 'transform:translateZ(140px)']], e: 'cubic-bezier(0.65,0,0.35,1)', d: '2200ms', loop: true, alt: true, cam: true }
  },
  {
    id: 'pan', en: 'Pan', zh: '摇镜 / 平移镜头', cat: 'camera',
    alias: ['横向移动镜头', '扫视'],
    vague: '镜头横着扫过去',
    say: '相机沿 X 轴平移，扫过长画面',
    def: '相机水平转向或移动。常用于长图、地图、时间轴；配合内容分段揭示才能避免“只是把一条长图滚过去”。',
    code: 'scene { transform: translateX(0) → translateX(-40%); }',
    demo: { kind: 'frames', html: '<div class="panstrip"><i></i><i></i><i></i><i></i><i></i><i></i></div>', frames: [[0, 'transform:translateX(0)'], [100, 'transform:translateX(-46%)']], e: 'cubic-bezier(0.65,0,0.35,1)', d: '2600ms', loop: true, alt: true, pan: true }
  },
  {
    id: 'whip-pan', en: 'Whip pan', zh: '甩镜转场', cat: 'camera',
    alias: ['快速甩过去', '运动模糊转场'],
    vague: '猛地甩到下一个画面',
    say: '高速平移 + 方向性模糊，中段完成换镜',
    def: '极快的横向甩动，靠运动模糊遮蔽换镜瞬间。剪辑感很强，适合段落切换；一屏内多次使用会令人迷失。',
    code: '/* 甩动 180ms + blur(方向性 24px)，在 50% 处替换内容 */',
    demo: { kind: 'frames', html: '<div class="obj sheet"></div>', frames: [[0, 'transform:translateX(0); filter:blur(0)'], [45, 'transform:translateX(-60%); filter:blur(14px)'], [55, 'transform:translateX(60%); filter:blur(14px)'], [100, 'transform:translateX(0); filter:blur(0)']], e: 'cubic-bezier(0.76,0,0.24,1)', d: '1200ms', loop: true }
  },
  {
    id: 'zoom-through', en: 'Zoom through', zh: '穿越式推进', cat: 'camera',
    alias: ['冲进画面里', '无限缩放'],
    vague: '一直往画面里钻，钻进去就是下一页',
    say: 'scale 推到画面外，同时把下一层接上',
    def: '镜头穿过某个元素进入下一层空间（Prezi 式）。空间隐喻强、导航成本低，但对晕动敏感用户不友好，必须提供减少动效开关。',
    code: '/* 元素放大到覆盖视口，然后其内部成为新页面 */',
    demo: { kind: 'frames', html: '<div class="zthrough"><i class="znext"><s></s><s></s><s></s></i><div class="obj img zoomhole"><i class="hole"></i></div></div>', frames: [[0, 'transform:scale(1)'], [100, 'transform:scale(5); opacity:.18']], e: 'cubic-bezier(0.7,0,0.84,0)', d: '1600ms', loop: true, alt: true }
  },
  {
    id: 'match-cut', en: 'Match cut', zh: '匹配剪辑', cat: 'camera',
    alias: ['形状接续', '同形转场'],
    vague: '两个画面里形状一样，看起来像同一个东西',
    say: '前后镜以同形状/同位置对齐，转场无感',
    def: '利用两个镜头中相似的形状、位置或运动方向来剪接，使切换几乎不被察觉。是最高级的转场手法，因为它靠构图而不是靠动效。',
    code: '/* 前镜圆形 → 后镜圆形，中心与半径对齐后做 crossfade */',
    demo: { kind: 'morph', mode: 'matchCut' }
  },
  {
    id: 'cut', en: 'Cut', zh: '硬切', cat: 'camera',
    alias: ['无转场', '直接切换'],
    vague: '不要动画，直接换',
    say: '硬切：0ms 切换（这也是一项设计决策）',
    def: '不做任何补间，直接切换。它是动效词汇的一员，而且经常被正确使用：高频操作、需要效率的地方，“没有动画”本身就是最优动效。',
    code: 'transition: none;',
    demo: { kind: 'morph', mode: 'cut' }
  },
  {
    id: 'rack-focus', en: 'Rack focus', zh: '焦点转移', cat: 'camera',
    alias: ['拉焦', '对焦切换'],
    vague: '焦点从 A 换到 B',
    say: '两组元素 blur 互补交换，视线随之转移',
    def: '在一次镜头里把焦点从一处拉到另一处，用来重新分配注意力。网页实现常与滚动位置绑定（滚到某处才合焦）。',
    code: '/* A: blur 0→10px, B: blur 10→0px，交叉时长一致 */',
    demo: { kind: 'frames', html: '<div class="rack"><i class="obj txt a">A</i><i class="obj txt b">B</i></div>', frames: [[0, 'filter:blur(6px); opacity:.4'], [100, 'filter:blur(0); opacity:1']], e: 'ease-in-out', d: '1400ms', loop: true, alt: true, rack: true }
  },
  {
    id: 'camera-shake', en: 'Camera shake', zh: '镜头震动', cat: 'camera',
    alias: ['屏幕抖动', 'impact shake', '震屏'],
    vague: '砸一下，整个画面抖',
    say: '整体随机位移 ±6px，衰减 300ms',
    def: '整个画面做衰减随机位移，表达冲击。必须短且快速衰减，且抖动幅度随“事件重量”分级——一次通知不该震屏。',
    code: '/* x,y = random() * amp; amp *= 0.85 每帧衰减 */',
    demo: { kind: 'frames', html: '<div class="obj sheet">BOOM</div>', frames: [[0, 'transform:translate(0,0)'], [20, 'transform:translate(-8px,6px)'], [40, 'transform:translate(7px,-5px)'], [60, 'transform:translate(-5px,3px)'], [80, 'transform:translate(3px,-2px)'], [100, 'transform:none']], e: 'steps(1)', d: '360ms', loop: true, wait: '1200ms' }
  },
  {
    id: 'orbit-camera', en: 'Orbit camera', zh: '环绕运镜', cat: 'camera',
    alias: ['3D 环绕', '轨道相机', 'turntable'],
    vague: '围着这个东西转一圈看',
    say: 'CSS 里没有相机这一层：把整层场景绕 Y 轴反着转，冒充相机环绕',
    def: '相机绕物体做水平圆弧运动（turntable），物体不动、只改水平角，并限制俯仰范围，否则空间感会翻车。CSS 动不了相机，只能反着做：转的是场景，物体留在原位，靠透视变化把它读成环绕——效果一致，但别误以为真的有轨道相机。',
    code: 'scene { transform: rotateY(var(--a)) translateZ(var(--d)); }  /* 转场景，不是转物体 */',
    demo: { kind: 'frames', html: '<div class="turn"><i class="obj card face f1"></i><i class="obj card face f2"></i><i class="obj card face f3"></i></div>', frames: [[0, 'transform:rotateY(-38deg)'], [100, 'transform:rotateY(38deg)']], e: 'ease-in-out', d: '2600ms', loop: true, alt: true, turn: true }
  },
  {
    id: 'reveal-camera', en: 'Reveal / Pull back', zh: '拉镜揭示', cat: 'camera',
    alias: ['缩小露出全局', '拉远'],
    vague: '拉远之后才发现是更大画面的一部分',
    say: 'pull-back：局部 scale 1→0.4 露出整体语境',
    def: '从细节拉远到全局，制造“原来只是局部”的认知惊喜。拉远幅度大时注意文字会瞬间不可读，需要在终点换用摘要层。',
    code: 'animation: pull-back 1.2s ease-in-out alternate;',
    demo: { kind: 'frames', html: '<div class="obj scene-mini"><i></i><i></i><i></i><i></i></div>', frames: [[0, 'transform:scale(2.6) translate(4%, -2%)'], [100, 'transform:scale(1)']], e: 'cubic-bezier(0.65,0,0.35,1)', d: '1800ms', loop: true, alt: true }
  },

  /* ================= 13. 动画原则 ================= */
  {
    id: 'squash-stretch', en: 'Squash & stretch', zh: '挤压与拉伸', cat: 'principles',
    alias: ['形变', '弹性变形', '压扁拉长'],
    vague: '掉下去的时候像果冻',
    say: '落地 squash（压扁）+ 起跳 stretch（拉长），体积守恒',
    def: '物体在加速与撞击时沿运动方向拉长、在阻力点压扁。核心纪律是体积不变（横纵互补），否则像融化的蜡。',
    code: 'transform: scale(1.18, .82);  /* 落地帧 */',
    demo: { kind: 'frames', html: '<div class="obj ball"></div>', frames: [[0, 'transform:translateY(-38px) scale(.92,1.08)'], [50, 'transform:translateY(16px) scale(.98,1.02)'], [62, 'transform:translateY(20px) scale(1.22,.78)'], [75, 'transform:translateY(6px) scale(.96,1.06)'], [100, 'transform:translateY(-38px) scale(.92,1.08)']], e: 'cubic-bezier(0.5,0,1,1)', d: '1400ms', loop: true, ball: true }
  },
  {
    id: 'anticipation', en: 'Anticipation', zh: '预备动作', cat: 'principles',
    alias: ['先下蹲再起跳', '反向蓄力'],
    vague: '动作之前先有个起手',
    say: '主动作前 100ms 反向预备（下蹲/后摆）',
    def: '大动作前先朝反方向轻微运动，告诉观众“要来了”，同时赋予力量感。跳之前先蹲、扔之前先后摆——UI 里对应拖拽时的形变与蓄力。',
    code: '/* 主时间轴 -8%：scale(1.06,.9) 反向预压 */',
    demo: { kind: 'frames', html: '<div class="obj ball"></div>', frames: [[0, 'transform:translateY(0) scale(1,1)'], [6.7, 'transform:translateY(10px) scale(1.16,.84)'], [22, 'transform:translateY(-34px) scale(.88,1.16)'], [100, 'transform:translateY(0) scale(1,1)']], e: 'cubic-bezier(0.3,0.9,0.4,1)', d: '1500ms', loop: true }
  },
  {
    id: 'follow-through', en: 'Follow-through', zh: '跟随与缓冲', cat: 'principles',
    alias: ['过冲衰减', '附属物跟随', 'settling'],
    vague: '停下来的时候还有点头',
    say: '主体停住后附属部分再走 2–3 帧衰减',
    def: '主体停止后，其附属部分（头发、尾巴、悬垂的图标、标题的后半段）继续运动再回弹。没有跟随，动作就像被刀切断。',
    code: '/* 子元素 delay = 主体时长 × 0.7，damping 更大 */',
    demo: { kind: 'frames', html: '<div class="follow"><i class="head obj"></i><i class="tail"></i><i class="tail"></i><i class="tail"></i></div>', frames: [[0, 'transform:translateX(-46px)'], [100, 'transform:translateX(46px)']], e: 'cubic-bezier(0.16,1,0.3,1)', d: '900ms', loop: true, alt: true, follow: true, st: 90 }
  },
  {
    id: 'secondary-action', en: 'Secondary action', zh: '次要动作', cat: 'principles',
    alias: ['附属细节', '配角动效'],
    vague: '主体之外还有点小细节在动',
    say: '主体运动 + 次要元素错 40ms 呼应',
    def: '为主动作服务的补充运动（飘带、光点、附属小图标），用来丰富层次而不抢主线。判断标准：删掉它，主题信息是否仍然完整。',
    code: '/* secondary: delay 40–80ms, 幅度约主体 30% */',
    demo: { kind: 'frames', html: '<div class="sec"><i class="obj card"></i><i class="dot"></i><i class="dot"></i></div>', frames: [[0, 'opacity:0; transform:translateY(18px)'], [100, 'opacity:1; transform:none']], e: 'cubic-bezier(0.16,1,0.3,1)', d: '620ms', loop: true, alt: true, secondary: true, st: 40 }
  },
  {
    id: 'arc', en: 'Arc', zh: '弧线运动', cat: 'principles',
    alias: ['抛物线', '曲线轨迹', '非线性路径'],
    vague: '别直线飞过去，走个弧线',
    say: 'X 线性 + Y 缓动 = 抛物线轨迹',
    def: '自由运动的物体走弧线而不是直线（重力使然）。实现技巧：横向 linear、纵向 ease-in-out，两个通道合成即是抛物线。',
    code: '/* X: linear, Y: ease-in —— 合成抛物线 */',
    /* 这条教的本来就是「横向 linear + 纵向抛物线」。原来只有三个点且整条
       transform 套 ease-in-out：X 不是匀速，端点还各爬 ~270ms。
       现在按 y = 10 - 144·t(1-t) 采样 9 个点、时间走 linear，才是它说的那个东西。 */
    demo: { kind: 'frames', html: '<div class="obj ball"></div>', frames: [[0, 'transform:translate(-52px,10px)'], [12.5, 'transform:translate(-39px,-5.75px)'], [25, 'transform:translate(-26px,-17px)'], [37.5, 'transform:translate(-13px,-23.75px)'], [50, 'transform:translate(0,-26px)'], [62.5, 'transform:translate(13px,-23.75px)'], [75, 'transform:translate(26px,-17px)'], [87.5, 'transform:translate(39px,-5.75px)'], [100, 'transform:translate(52px,10px)']], e: 'linear', d: '1300ms', loop: true, alt: true }
  },
  {
    id: 'slow-in-out', en: 'Slow in & slow out', zh: '慢入慢出', cat: 'principles',
    alias: ['缓入缓出（原则）', '加减速原则'],
    vague: '两头别那么突兀',
    say: '起止两端各留 2–3 帧渐变速度',
    def: '迪士尼时代对 easing 的称呼：动作开始与结束都要渐变，因为物体不可能瞬间获得或失去速度。它是所有曲线类术语的源头。',
    code: '/* 手绘时代：逐帧插入中间状态；今天：一条 cubic-bezier */',
    demo: { kind: 'curve', fn: 'easeInOut' }
  },
  {
    id: 'timing', en: 'Timing', zh: '节奏与时间分配', cat: 'principles',
    alias: ['快慢控制', '帧数分配'],
    vague: '该快的地方快、该慢的地方慢',
    say: '重击用 2 帧到位，悬停用 12 帧渐变',
    def: '同一个动作里，不同阶段占用不同帧数。快慢的对比而不是绝对时长，才决定了动作的情绪：一瞬间的重击和缓慢的漂浮不能是同一个速度。',
    code: '@keyframes beat { 0%,88%{transform:scale(1)} 92%{transform:scale(1.35)} 100%{transform:scale(1)} }',
    demo: { kind: 'frames', html: '<div class="obj heart"></div>', frames: [[0, 'transform:scale(1)'], [8, 'transform:scale(1.34)'], [16, 'transform:scale(1)'], [26, 'transform:scale(1.2)'], [36, 'transform:scale(1)'], [100, 'transform:scale(1)']], e: 'ease-out', d: '1600ms', loop: true }
  },
  {
    id: 'exaggeration', en: 'Exaggeration', zh: '夸张', cat: 'principles',
    alias: ['放大表现', '戏剧化'],
    vague: '再戏剧一点',
    say: '把幅度/时长推到真实值的 1.3–1.6 倍',
    def: '把动作的幅度、时长或形变放大到超过现实，以强化表达。UI 里的度：品牌页可以夸张，表单与仪表盘不行。',
    code: '/* 真实 12px → 表现 20px，同时缩短恢复时间 */',
    demo: { kind: 'two', a: { label: '写实：位移 8px', frames: [[0, 'transform:translateY(8px)'], [100, 'transform:none']], e: 'ease-out', d: '420ms' }, b: { label: '夸张：位移 34px + 旋转', frames: [[0, 'transform:translateY(34px) rotate(8deg) scale(1.1)'], [100, 'transform:none']], e: 'cubic-bezier(0.34,1.56,0.64,1)', d: '620ms' } }
  },
  {
    id: 'staging', en: 'Staging', zh: '分镜与聚焦', cat: 'principles',
    alias: ['突出主体', '留白引导'],
    vague: '让它成为视觉重点，别的都别抢',
    say: '其余元素降透明度与饱和度，只留主体动',
    def: '用构图、明暗、动静对比确保观众看到该看的东西。动效语境下最实用的技巧是：一个时刻只有一个元素在动，其他降透明度。',
    code: 'body.busy *:not(.focus) { opacity: .35; filter: saturate(.5); }',
    demo: { kind: 'frames', html: '<div class="stage3"><i class="obj card"></i><i class="obj card hot"></i><i class="obj card"></i></div>', frames: [[0, 'opacity:.3; filter:saturate(.2)'], [100, 'opacity:1; filter:none']], e: 'ease-out', d: '900ms', loop: true, alt: true, staging: true }
  },
  {
    id: 'perceived-performance', en: 'Perceived performance', zh: '感知性能', cat: 'principles',
    alias: ['感觉快', '等待体验', '乐观更新'],
    vague: '怎么让用户觉得快',
    say: '乐观更新：先播成功动效，请求失败再回滚',
    def: '用动效改变等待的主观感受：即时按压反馈、骨架屏、乐观更新、进度可视化。合理的动效能让同样的 800ms 显得比 200ms 无反馈更“快”。',
    code: '/* 点击立刻入队 UI，失败再回滚 + shake */',
    demo: { kind: 'perf', mode: 'perceived', hint: '点每一行的「完成」，看两行数字的差距' }
  },
  {
    id: 'purposeful', en: 'Purposeful animation', zh: '有目的的动效', cat: 'principles',
    alias: ['克制', '为什么要动'],
    vague: '好看就加呗',
    say: '这个动效解决的是连续性问题，不是装饰',
    def: '每条动效必须回答一个问题：它解释了空间关系、提供了反馈、还是引导了注意力？三者的答案都不是，就应该删掉。这是词汇表里最重要的一个词。',
    code: '/* 自检：把它关掉，界面是否更难理解？ */',
    demo: { kind: 'perf', mode: 'purpose', hint: '左右各点一条来源，比较你失去了什么' }
  },
  {
    id: 'spatial-consistency', en: 'Spatial consistency', zh: '空间一致性', cat: 'principles',
    alias: ['位置连续', '方向一致', '心智地图'],
    vague: '进去再退出来，东西怎么变了位置',
    say: '进出使用同一轴向与同一来源点',
    def: '界面元素在状态变化前后保持空间关系可预测。做法：进入方向=退出方向的反向，父子层级共享一条轴，绝不让元素凭空在另一处出现。',
    code: '/* 前进 translateX(+100% → 0)，返回 (0 → +100%) */',
    demo: { kind: 'drag', mode: 'direction', hint: '前进再返回，注意方向对称' }
  },
  {
    id: 'frequency-of-use', en: 'Frequency of use', zh: '使用频率原则', cat: 'principles',
    alias: ['高频少动', '每次都动就别动'],
    vague: '这个动画我一天看 200 次',
    say: '高频路径动效 ≤120ms 或直接去掉',
    def: '动效成本按“观看次数”计费。首次使用值得编排得华丽，每天几百次的操作（切 tab、提交表单）必须极快或干脆没有。',
    code: '/* 首次: 400ms 编排；常规: 120ms；快捷键: 0ms */',
    demo: { kind: 'two', a: { label: '第一次看 · 400ms 值得', frames: [[0, 'opacity:0; transform:translateY(16px) scale(.96)'], [100, 'opacity:1; transform:none']], e: 'cubic-bezier(0.16,1,0.3,1)', d: '400ms' }, b: { label: '第 200 次 · 只留 100ms', frames: [[0, 'opacity:0; transform:translateY(4px)'], [100, 'opacity:1; transform:none']], e: 'ease-out', d: '100ms' } }
  },
  {
    id: 'reduced-motion', en: 'Reduced motion', zh: '减弱动效', cat: 'principles',
    alias: ['prefers-reduced-motion', '无障碍', '晕动症'],
    vague: '有人看了会头晕',
    say: '响应 prefers-reduced-motion，降级为淡入',
    def: '系统级无障碍偏好。大面积位移、视差、缩放会诱发光谷性眩晕。合格的实现是保留信息传达（改成淡入或立即完成），而不是什么都不剩。',
    code: '@media (prefers-reduced-motion: reduce) {\n  * { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }\n}',
    demo: { kind: 'two', a: { label: '完整动效', frames: [[0, 'opacity:0; transform:translateY(22px) scale(.9)'], [100, 'opacity:1; transform:none']], e: 'cubic-bezier(0.16,1,0.3,1)', d: '620ms' }, b: { label: 'reduced：仅淡入', frames: [[0, 'opacity:0'], [100, 'opacity:1']], e: 'linear', d: '120ms' } }
  },

  /* ================= 14. 性能与工程 ================= */
  {
    id: 'frame-rate', en: 'Frame rate (fps)', zh: '帧率', cat: 'perf',
    alias: ['60fps', '120fps', '每秒帧数'],
    vague: '让它更顺',
    say: '稳定 60fps（16.7ms/帧预算）',
    def: '每秒刷新次数。60Hz 屏幕每帧预算只有 16.7ms——样式、布局、绘制、合成必须挤进去，超了就丢帧。高刷屏上 120Hz 时预算减半。',
    code: '/* DevTools → Performance → 看紫色 Layout 是否吃满预算 */',
    demo: { kind: 'perf', mode: 'fps' }
  },
  {
    id: 'jank', en: 'Jank', zh: '卡顿', cat: 'perf',
    alias: ['掉帧', 'stutter', '不流畅'],
    vague: '有点一卡一卡的',
    say: '排查主线程长任务，消除 jank',
    def: '动画出现可见的不连续跳动，本质是主线程被占住、没能在预算内交出下一帧。责任通常在同步 JS、图片解码、layout 抖动，而不是动画本身。',
    code: '/* 用 Content-Visibility / Worker 把主线程还给渲染 */',
    demo: { kind: 'perf', mode: 'jank' }
  },
  {
    id: 'dropped-frame', en: 'Dropped frame', zh: '丢帧', cat: 'perf',
    alias: ['掉帧', 'frame skip'],
    vague: '动到一半跳过去了',
    say: '丢帧：连续两帧内容相同',
    def: '应渲染的帧没有被渲染出来，浏览器把上一帧重复显示一次。丢 1–2 帧不易察觉，连续丢 3 帧以上就会被读成“卡”。',
    code: '/* Chrome: DevTools → Rendering → Frame Rendering Stats */',
    demo: { kind: 'perf', mode: 'drop' }
  },
  {
    id: 'compositing', en: 'Compositing', zh: '合成', cat: 'perf',
    alias: ['合成层', 'compositor', 'GPU 合成'],
    vague: '为什么它动得不卡',
    say: '让动画留在合成线程（只动 transform/opacity）',
    def: '把已经画好的图层交给 GPU 拼装成画面。transform 与 opacity 动画可以在合成线程独立完成，不需要主线程参与，因此最稳。',
    code: '/* 提升为合成层的常见触发：will-change, transform, filter */',
    demo: { kind: 'perf', mode: 'composite' }
  },
  {
    id: 'will-change', en: 'will-change', zh: 'will-change 预提示', cat: 'perf',
    alias: ['提前建层', 'GPU 层提示'],
    vague: '加个 will-change 会不会更顺',
    say: '动画开始前才加，结束后移除',
    def: '告诉浏览器“这个元素接下来要动”，提前建层。它不是性能开关而是提示；长期挂在一堆元素上会吃满显存，反而更卡。',
    code: '/* 好：交互开始时加，transitionend 后去掉 */\nel.style.willChange = "transform";',
    demo: { kind: 'perf', mode: 'willchange' }
  },
  {
    id: 'layout-thrashing', en: 'Layout thrashing', zh: '布局抖动', cat: 'perf',
    alias: ['强制同步布局', 'reflow storm', '读写交替'],
    vague: '循环里读 offsetHeight 结果很卡',
    say: '批量读、再批量写，避免读写交替',
    def: '在循环中交替读几何属性和写样式，每次都强制浏览器重算布局。修复方式是分批：一帧内先读完所有测量，再统一写。',
    code: '/* ✗ 读写交替 */\nfor (const el of els) el.style.width = el.offsetWidth + 10 + "px";\n/* ✓ 先读后写 */\nconst ws = els.map(el => el.offsetWidth); els.forEach((el, i) => el.style.width = ws[i] + 10 + "px");',
    demo: { kind: 'perf', mode: 'thrash' }
  },
  {
    id: 'reflow-repaint', en: 'Reflow vs Repaint', zh: '重排与重绘', cat: 'perf',
    alias: ['回流', 'layout', 'paint', '绘制开销'],
    vague: '改哪个属性比较便宜',
    say: '几何属性→重排；颜色→重绘；transform/opacity→仅合成',
    def: '改几何属性（width/top/margin）触发布局重排最贵；改颜色只重绘；transform 与 opacity 只需合成，最便宜。这条阶梯就是“动效该动哪些属性”的判断依据。',
    code: '/* 阶梯：Layout > Paint > Composite */',
    demo: { kind: 'perf', mode: 'ladder' }
  },
  {
    id: 'gpu-friendly', en: 'GPU-friendly properties', zh: '可动画的安全属性', cat: 'perf',
    alias: ['动画友好属性', '只动 transform 和 opacity'],
    vague: '哪些属性能放心做动画',
    say: '只动画 transform / opacity / filter / clip-path',
    def: '可以放进动画的安全名单：transform、opacity、filter、clip-path、mask（各有成本）。危险名单：width/height/top/left/margin、box-shadow、layout 触发的 font-size。',
    code: '/* 用 transform: translateY 代替 top，用伪元素 opacity 代替 box-shadow */',
    demo: { kind: 'perf', mode: 'safe' }
  },
  {
    id: 'raf', en: 'requestAnimationFrame', zh: 'rAF 帧回调', cat: 'perf',
    alias: ['requestAnimationFrame', '逐帧更新', '动画循环'],
    vague: '用 setInterval 做动画会不会不准',
    say: '所有 JS 动画都应走 requestAnimationFrame',
    def: '向浏览器登记“下一帧要我算一次”。它和刷新率同步、页面隐藏时自动暂停，是 setInterval 做动画的正确替代（后者会与帧错位造成抖动）。',
    code: 'function loop(t) { step(t); if (!done) requestAnimationFrame(loop); }\nrequestAnimationFrame(loop);',
    demo: { kind: 'perf', mode: 'raf' }
  },
  {
    id: 'scroll-jank', en: 'Scroll-linked work cost', zh: '滚动监听开销', cat: 'perf',
    alias: ['passive listener', 'scroll 事件', '节流'],
    vague: '加了 scroll 监听页面变粘',
    say: 'scroll 监听用 passive:true，或改用 IntersectionObserver',
    def: '在 scroll 事件里做重活会阻塞滚动合成，让滚动本身变得黏手。解法：passive 监听（承诺不 preventDefault）、IntersectionObserver、或原生 scroll-driven animation。舞台里同一个滚动进度驱动两条等长轨道：上条只动 transform，下条每帧改几何，顺不顺一眼分得出来。',
    code: "addEventListener('scroll', onScroll, { passive: true });",
    demo: { kind: 'frames', html: '<div class="sj"><i class="sj-row a">transform</i><i class="sj-row b">每帧改几何</i><i class="sj-run"></i></div>', hint: '滚动：上条跟手，下条一顿一顿' }
  },
  {
    id: 'content-visibility', en: 'content-visibility', zh: '内容可见性优化', cat: 'perf',
    alias: ['跳过屏外渲染', 'contain', 'auto 渲染'],
    vague: '长页面首屏很卡',
    say: '屏外区块用 content-visibility: auto 跳过渲染',
    def: '让屏外内容跳过布局与绘制，直到接近视口才渲染。长页面的免费提速手段，但必须配 contain-intrinsic-size 占位，否则滚动条会跳。',
    code: '.section { content-visibility: auto; contain-intrinsic-size: auto 600px; }',
    demo: { kind: 'perf', mode: 'cv' }
  },
  {
    id: 'easing-token', en: 'Motion token', zh: '动效令牌', cat: 'perf',
    alias: ['动效规范', 'design token for motion', '工程化治理'],
    vague: '每个人写的曲线和快慢都不一样',
    say: '先定一套统一的速度和曲线，所有动效照着用',
    def: '把常用的速度、曲线和移动幅度起好名字，大家引用同一套值。比如“快速”统一用 120ms；要调整全站节奏时，改一处就能同步更新所有引用它的动效。',
    code: ':root {\n  --ease-standard: cubic-bezier(0.2, 0, 0, 1);\n  --dur-2: 200ms;\n  --lift-2: 4px;\n}',
    demo: { kind: 'perf', mode: 'token' }
  }
);
