/* ============================================================
   runtime.js —— 第 15 类「三维与运行时」：术语 + 真机实演
   包含 WebGL 片元着色器、Canvas 2D 粒子/物理/网格、CSS 3D 立方体、
   Lottie 关键帧播放器、Rive 状态机、骨骼 FK/IK、SMIL、时间轴拖拽
   依赖：motion.js（window.MOTION）、ease.js
   ============================================================ */
(function () {
  'use strict';
  const M = window.MOTION;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  /* 虚拟时钟：把 1/speed 的时间缩放叠进去，详情页的「慢放 ½× / ¼×」才对 JS 舞台有效。
     回调拿到的 now 起点仍是真实时间戳，所以各场景里的 (now - t0) 逻辑不用改。 */
  const CLOCKS = new WeakMap();
  const watch = function (el, fn) {
    const u = function (now) {
      if (!el.isConnected) { window.ENGINE.tickers.delete(u); CLOCKS.delete(el); return; }
      if (!window.ENGINE.isVisible(el)) { CLOCKS.delete(el); return; }
      let c = CLOCKS.get(el);
      if (!c) { c = { v: now, last: now }; CLOCKS.set(el, c); }
      const sp = el._speed || 1;
      c.v += (now - c.last) / sp; c.last = now;
      fn(c.v);
    };
    window.ENGINE.tickers.add(u);
  };

  /* ================= 分类与术语 ================= */
  window.CATS.push({
    id: 'runtime', name: '三维与运行时', en: '3D & Runtime', tagline: '当 CSS 补间不够用时：着色器、Canvas、骨骼、状态机与渲染循环。',
    taglineEn: 'When CSS tweens are not enough: shaders, canvas, bones, state machines and the render loop.'
  });

  window.TERMS.push(
    {
      id: 'css-3d', en: 'CSS 3D transform', zh: 'CSS 三维变换', cat: 'runtime',
      alias: ['rotateX', 'rotateY', 'translateZ', '3D 变换'],
      vague: '让这块东西真的在空间里转', say: '用 CSS 3D：容器 perspective + 子元素 rotate3d/translateZ',
      def: '浏览器在三维空间里摆放元素。要有深度必须凑齐三件事：父级 perspective（相机）、子级 Z 位移或旋转、以及共享的 3D 上下文。',
      code: '.scene { perspective: 800px; }\n.cube { transform-style: preserve-3d; transform: rotateX(-18deg) rotateY(28deg); }',
      demo: { kind: 'cube', mode: 'plain' }
    },
    {
      id: 'preserve-3d', en: 'transform-style: preserve-3d', zh: '保留 3D 上下文', cat: 'runtime',
      alias: ['flat', '3D 嵌套', '渲染上下文'],
      vague: '为什么卡片一转，就像叠成一张纸？', say: '父级旋转时，里面的卡片被压成同一层了',
      def: '父级带着子元素旋转时，flat 会把子元素压到同一个平面；改用 preserve-3d，前后距离才会保留下来。下方两组会同时转动，可以直接比较它们的层次变化。',
      code: '.parent { transform-style: preserve-3d; }  /* 否则子元素被压平 */',
      demo: { kind: 'nest' }
    },
    {
      id: 'backface', en: 'backface-visibility', zh: '背面可见性', cat: 'runtime',
      alias: ['背面', '镜像穿帮', 'backface hidden'],
      vague: '转过去的时候背面漏出来了', say: 'backface-visibility: hidden 隐藏背面',
      def: '元素绕轴转到背面时是否仍然绘制。翻卡、立方体内壁、3D 轮播都要显式声明，否则会看到镜像穿帮。',
      code: '.face { backface-visibility: hidden; }',
      demo: { kind: 'cube', mode: 'backface' }
    },
    {
      id: 'fov', en: 'Perspective / FOV', zh: '视距与视场角', cat: 'runtime',
      alias: ['perspective 值', '相机距离', '畸变'],
      vague: '透视感再强一点', say: '把 perspective 从 1200px 调到 500px，畸变更强',
      def: 'perspective 数值就是相机到屏幕的距离：值越小越近、畸变越夸张，越大越接近平行投影。3D 场景是否可信，八成取决于这个值。',
      code: '.scene { perspective: 500px; }  /* 小=近=夸张，大=远=平淡 */',
      demo: { kind: 'cube', mode: 'fov' }
    },
    {
      id: 'orbit-controls', en: 'Orbit controls', zh: '轨道控制器', cat: 'runtime',
      alias: ['拖拽旋转', '相机环绕', 'turntable'],
      vague: '我想用鼠标转着看', say: '把指针位移映射到 rotateX/rotateY，并做惯性衰减',
      def: '用指针位移驱动相机绕物体旋转的交互模式。要点：俯仰角要夹在 ±80° 内避免翻转，松手后带一点惯性才像实体。',
      code: 'rx = clamp(rx + dy * 0.4, -80, 80);\nry += dx * 0.5;',
      demo: { kind: 'cube', mode: 'orbit', hint: '在立方体上拖动' }
    },
    {
      id: 'webgl-context', en: 'WebGL context', zh: 'WebGL 上下文', cat: 'runtime',
      alias: ['getContext webgl', 'GPU 画布', '硬件加速'],
      vague: '那种用显卡画的画面', say: '拿 canvas 的 WebGL 上下文，逐帧提交 uniform 重绘',
      def: '浏览器通往 GPU 的通道。整个画面由顶点与片元着色器算出来，能做几万个粒子和真实光照；代价是状态管理、上下文丢失与首屏体积。',
      code: "const gl = canvas.getContext('webgl2', { alpha: false, antialias: true });",
      demo: { kind: 'shader', mode: 'context' }
    },
    {
      id: 'fragment-shader', en: 'Fragment shader', zh: '片元着色器', cat: 'runtime',
      alias: ['像素着色器', 'GLSL', 'gl_FragColor'],
      vague: '那种流动的、有机的背景', say: '一个片元着色器：按 uv 与 u_time 算颜色（plasma）',
      def: '对每个像素执行一次的程序。流动渐变、噪声云、流体、色散都在这里算——因为并行度极高，比 CPU 画同样的东西快几个数量级。',
      code: 'float v = sin(p.x*7.+u_t) + sin(p.y*7.-u_t*.7) + sin((p.x+p.y)*5.+u_t*1.3);\ngl_FragColor = vec4(.5 + .5*cos(v + vec3(0.,2.1,4.2)), 1.);',
      demo: { kind: 'shader', mode: 'plasma' }
    },
    {
      id: 'gpu-particles', en: 'GPU particles', zh: 'GPU 粒子', cat: 'runtime',
      alias: ['顶点着色器动画', 'point sprite', '百万粒子'],
      vague: '几万个点还不掉帧', say: '位置在顶点着色器里算，CPU 每帧只更新一个 time',
      def: '把粒子的位置计算搬进着色器，主线程只喂一个时间参数。几万到百万级粒子仍然流畅，代价是难以做碰撞等 CPU 逻辑。',
      code: 'vec3 pos = start + dir * u_t + vec3(0., -4.9 * u_t * u_t, 0.);',
      demo: { kind: 'shader', mode: 'points' }
    },
    {
      id: 'post-processing', en: 'Post-processing', zh: '后处理', cat: 'runtime',
      alias: ['bloom', '泛光', '调色', 'shader pass'],
      vague: '画面质感再厚一点', say: '把场景渲到纹理，再走一遍 bloom / 调色 pass',
      def: '先渲染到离屏纹理，再用第二遍着色器加工：泛光、色调映射、暗角、景深、运动模糊。是“游戏感画面”的主要来源。',
      code: 'float glow = pow(max(0., lumin(color) - threshold), softKnee) * intensity;',
      demo: { kind: 'shader', mode: 'postfx' }
    },
    {
      id: 'particle-system', en: 'Particle system', zh: '粒子系统', cat: 'runtime',
      alias: ['发射器', 'emitter', 'life / gravity / drag'],
      vague: '冒点东西出来，飘一飘', say: '发射器：初速 + 重力 + 阻力 + 生命衰减，池化复用',
      def: '用大量小对象模拟烟、火、雪、尾迹。工程要点是对象池（不要每帧 new）、上限数量、以及死亡后回收而不是删除。',
      code: 'p.vy += g * dt; p.x += p.vx * dt; p.life -= dt;',
      demo: { kind: 'canvas2d', mode: 'particles' }
    },
    {
      id: 'instancing', en: 'Instancing', zh: '实例化绘制', cat: 'runtime',
      alias: ['一次提交', 'batch draw', 'drawInstanced'],
      vague: '同一个小东西要画一千个', say: '实例化：几何提交一次，逐实例只传偏移与颜色',
      def: '同一份几何画 N 次，每次只换少量逐实例数据，把绘制调用从 N 次压到 1 次。绘制调用（draw call）才是瓶颈时的标准解法。',
      code: 'gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, COUNT);',
      demo: { kind: 'canvas2d', mode: 'instancing' }
    },
    {
      id: 'mesh-warp', en: 'Mesh warp', zh: '网格形变', cat: 'runtime',
      alias: ['晶格变形', '网格扭曲', 'warp'],
      vague: '让图片像布一样波动', say: '把图切成网格，逐顶点按正弦位移后重绘',
      def: '将图像或形状剖分成网格，再按顶点位移做弯曲、鼓包、液态变形。After Effects 的 Mesh Warp、Rive 的网格形变都是这个原理。',
      code: 'const off = Math.sin(x * 0.06 + t * 2) * 8;\ndrawQuad(srcX, srcY, dstX + off, dstY + off);',
      demo: { kind: 'canvas2d', mode: 'warp' }
    },
    {
      id: 'physics-engine', en: 'Physics simulation', zh: '物理模拟', cat: 'runtime',
      alias: ['刚体', '重力 碰撞', 'matter.js', 'restitution'],
      vague: '让它像真的东西一样掉下去撞开', say: '刚体积分 + 碰撞求解，弹性系数 0.6',
      def: '用重力、速度、位置积分与碰撞求解代替手写关键帧。适合抛掷、堆叠、碰撞等无法预先编排的动作；参数量大，需要调。',
      code: 'vy += gravity * dt;\nif (y + r > floor) { y = floor - r; vy *= -restitution; }',
      demo: { kind: 'canvas2d', mode: 'physics', hint: '点一下扔一个球' }
    },
    {
      id: 'gltf-draco', en: 'glTF + Draco', zh: '三维模型与压缩', cat: 'runtime',
      alias: ['gltf', 'glb', 'draco', 'meshopt'],
      vague: '把那个 3D 模型放进网页', say: 'glb 走 Draco/Meshopt 压缩，几何减到 1/6 再挂纹理',
      def: '网页上的 3D 资产格式。glTF 是运行时格式，Draco/Meshopt 压几何、KTX2/WebP 压纹理；模型体积通常就是 3D 网页首屏最大的成本。',
      code: "loader.setDRACOLoader(draco);\nglTFLoader.load('headset.glb' /* 1.2MB → 180KB */);",
      demo: { kind: 'canvas2d', mode: 'gltf' }
    },
    {
      id: 'sprite-sheet', en: 'Sprite sheet', zh: '精灵图 / 序列帧', cat: 'runtime',
      alias: ['帧动画', 'steps()', 'flipbook'],
      vague: '老游戏那种一格一格的动', say: '一张精灵图 + steps(n) 逐格位移，8~12fps',
      def: '把每一帧画在同一张大图上，靠位移裁切播放。手绘质感与像素风的正解；帧数决定成本，8fps 的观感比 60fps 更“定格”。',
      code: 'background: url(sheet.png);\nanimation: play 0.64s steps(8) infinite;',
      demo: { kind: 'sprite' }
    },
    {
      id: 'lottie', en: 'Lottie', zh: 'Lottie（JSON 动画）', cat: 'runtime',
      alias: ['bodymovin', 'json animation', '关键帧插值'],
      vague: '设计师在 AE 里做好的动画直接给我', say: '导出 Lottie JSON，运行时按关键帧插值播放',
      def: '把 After Effects 的时间轴导出成 JSON，由运行时逐帧插值绘制。设计师可交付、体积小、可换色；复杂表达式和蒙版容易踩坑。',
      code: "lottie.loadAnimation({ container, renderer: 'svg', loop: true, path: 'anim.json' });",
      demo: { kind: 'lottie', hint: '可拖动播放头' }
    },
    {
      id: 'rive', en: 'Rive state machine', zh: 'Rive 状态机', cat: 'runtime',
      alias: ['state machine', '输入混合', '交互动画'],
      vague: '它会看状态决定怎么动', say: 'Rive 状态机：Idle ⇄ Wave，由 Input 触发迁移',
      def: '把动画做成带状态与迁移的图，运行时用输入驱动。适合吉祥物、按钮、加载态这类“要响应用户”的动画，比堆 if 切换 CSS 干净得多。',
      code: "sm.input('tap').fire();\nsm.state('wave').onEnter = ...;",
      demo: { kind: 'rive', hint: '点 Input 触发状态迁移' }
    },
    {
      id: 'bone-rig', en: 'Skeletal animation (FK)', zh: '骨骼动画（正向运动学）', cat: 'runtime',
      alias: ['骨骼', '绑定', 'forward kinematics', 'joint chain'],
      vague: '让手臂一节一节地动', say: '骨骼链 FK：逐关节角度叠加，网格跟随骨骼',
      def: '给形状绑一副骨骼，动关节而不是动顶点。FK 是自上而下逐关节旋转，适合挥手、走路这类可预先编排的动作。',
      code: 'shoulder.rotation += 0.6;\nelbow.rotation += Math.sin(t) * 0.4;',
      demo: { kind: 'rig', mode: 'fk' }
    },
    {
      id: 'ik-solver', en: 'IK solver', zh: '反向运动学', cat: 'runtime',
      alias: ['ik', '末端定位', 'two-bone ik'],
      vague: '手要一直指着鼠标那个点', say: '两骨 IK：给定末端目标反解两个关节角',
      def: '反过来由末端位置求关节角度：手抓住哪、肘就该在哪。角色跟随指针、脚贴合地面、UI 里的“视线跟随”都靠它。',
      code: 'const d = clamp(dist(target, root), |l1 - l2|, l1 + l2);\nconst a2 = Math.acos((d*d + l1*l1 + l2*l2) / (2*l1*l2));',
      demo: { kind: 'rig', mode: 'ik', hint: '移动指针，手会跟过来' }
    },
    {
      id: 'delta-time', en: 'Delta time', zh: '时间步长解耦', cat: 'runtime',
      alias: ['dt', '帧率无关', 'frame independent'],
      vague: '在高刷屏上它跑得快一倍', say: '位移乘以 dt，而不是每帧加固定步长',
      def: '每帧的位移要乘以真实经过时间。写死“每帧 +4px”在 60Hz 正常、120Hz 就变成两倍速——这是 JS 动画最常见的隐蔽 bug。',
      code: '/* ✗ 每帧固定步长 */ x += 4;\n/* ✓ 与时间绑定 */ x += speed * ((now - last) / 1000);',
      demo: { kind: 'canvas2d', mode: 'dt' }
    },
    {
      id: 'render-loop', en: 'Render loop', zh: '渲染循环', cat: 'runtime',
      alias: ['game loop', 'update / draw', 'rAF 主循环'],
      vague: '整个动画系统的心跳', say: '一个 rAF 主循环：update(dt) → draw()，可暂停可固定步长',
      def: '所有逐帧动画的总闸。标准结构是 update(逻辑) 与 draw(绘制) 分离，配合固定步长（fixed timestep）保证物理稳定，页面隐藏时自动停。',
      code: "function frame(now) {\n  const dt = Math.min(0.05, (now - last) / 1000); last = now;\n  update(dt); draw();\n  raf = requestAnimationFrame(frame);\n}",
      demo: { kind: 'canvas2d', mode: 'loop' }
    },
    {
      id: 'svg-smil', en: 'SMIL', zh: 'SVG 声明式动画', cat: 'runtime',
      alias: ['animate', 'animateTransform', 'animateMotion'],
      vague: '不写 JS 也能让 SVG 自己动', say: '<animateTransform> 直接写在 SVG 里，声明式循环',
      def: 'SVG 内建的动画标签，无需脚本即可做旋转、路径运动（animateMotion）、属性插值。写在图标文件里就能带走，但无法中途改参数。',
      code: '<circle r="4"><animate attributeName="cx" values="10;90;10" dur="2s" repeatCount="indefinite"/></circle>',
      demo: { kind: 'smil' }
    },
    {
      id: 'timeline-scrub', en: 'Timeline scrubbing', zh: '时间轴拖拽', cat: 'runtime',
      alias: ['scrub', '进度回填', '可回拖动效'],
      vague: '我要能拖着看每一帧', say: '把动画进度暴露成可写值，拖动即 seek',
      def: '让进度可以被外部写入（拖动、滚动、录音笔位置）。实现上要么用 Web Animations API 的 currentTime，要么把动效写成 pure(progress) 函数。',
      code: 'anim.pause();\nslider.oninput = () => anim.currentTime = slider.value * 10;',
      demo: { kind: 'scrub', hint: '拖动滑杆逐帧看' }
    }
  );

  /* ================= CSS 3D 立方体 ================= */
  const FACES = '<i class="f1">1</i><i class="f2">2</i><i class="f3">3</i><i class="f4">4</i><i class="f5">5</i><i class="f6">6</i>';
  const CUBE_HTML = '<div class="cube-scene"><div class="cube">' + FACES + '</div></div>';
  /* backface 与 preserve-3d 的错处必须同屏对照才看得出来：单立方体看不出 hidden 和 visible 的差别 */
  const BACKFACE_HTML = '<div class="ab2">' +
    '<i class="ab-cell"><b class="flipcard2"><s class="fp">正面</s><s class="bp">背面</s></b><u>hidden</u></i>' +
    '<i class="ab-cell"><b class="flipcard2 showback"><s class="fp">正面</s><s class="bp">背面</s></b><u>visible</u></i>' +
    '</div>';
  const FLAT_HTML = '<div class="ab2">' +
    '<i class="ab-cell"><span class="cube-scene"><span class="cube cube-sm flat3d">' + FACES + '</span></span><u>flat（默认）</u></i>' +
    '<i class="ab-cell"><span class="cube-scene"><span class="cube cube-sm">' + FACES + '</span></span><u>preserve-3d</u></i>' +
    '</div>';
  M.KINDS.cube = function (stage, s) {
    const mode = s.mode;
    const scene = $('.cube-scene', stage), cube = $('.cube', stage);
    const cubes = $$('.cube', stage);
    /* 关动效时也要有可读姿态：先把初始 transform 写死，不靠 rAF 补第一帧 */
    cubes.forEach(function (c) { c.style.transform = 'rotateX(-18deg) rotateY(26deg)'; });
    if (mode === 'flat') {
      const bad = $('.flat3d', stage);
      if (bad) { bad.style.transformStyle = 'flat'; bad.parentElement.style.transformStyle = 'preserve-3d'; }
    }
    const fov = function () {
      const v = stage._prm && stage._prm.fov;
      return v == null ? (scene ? parseFloat(getComputedStyle(scene).perspective) || 800 : 800) : +v;
    };
    if (mode === 'fov' && scene) scene.style.perspective = fov() + 'px';
    let rx = -18, ry = 26, vy = 0, vx = 0, dragging = false, px = 0, py = 0, last = 0;
    if (mode === 'orbit') {
      stage.style.cursor = 'grab';
      stage.addEventListener('pointerdown', function (e) {
        dragging = true; px = e.clientX; py = e.clientY;
        if (stage.setPointerCapture) { try { stage.setPointerCapture(e.pointerId); } catch (err) {} }
        stage.style.cursor = 'grabbing';
      });
      /* 用位移差而不是 e.movementX：Safari 旧版没有 movementX，会算出 NaN 把姿态永久冻死 */
      stage.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        const dx = e.clientX - px, dy = e.clientY - py; px = e.clientX; py = e.clientY;
        ry += dx * 0.5; rx = clamp(rx - dy * 0.5, -80, 80);
        vy = dx * 0.5; vx = dy * 0.5;
      });
      ['pointerup', 'pointercancel'].forEach(function (ev) {
        stage.addEventListener(ev, function () { dragging = false; stage.style.cursor = 'grab'; });
      });
    }
    const spin = mode === 'backface' ? $('.flipcard2', stage) : null;
    const spins = mode === 'backface' ? $$('.flipcard2', stage) : [];
    watch(stage, function (now) {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now;
      if (mode === 'backface') {
        const deg = ((now / 14) % 360);
        spins.forEach(function (el) { el.style.transform = 'rotateY(' + deg.toFixed(1) + 'deg)'; });
        return;
      }
      if (mode === 'orbit') {
        if (!dragging) {
          /* 惯性按秒衰减，不按帧：否则 120Hz 上滑出去的距离翻倍，正好违反本分类自己的 delta-time 词条 */
          const k = Math.pow(0.02, dt);
          ry += vy * dt * 60; rx = clamp(rx - vx * dt * 60, -80, 80);
          vy *= k; vx *= k;
          if (Math.abs(vy) < 0.02) vy = 0;
        }
      } else {
        const t = now / 1000;
        ry = t * 34; rx = -18 + Math.sin(t * 0.8) * 10;
      }
      const tr = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      cubes.forEach(function (c) { c.style.transform = tr; });
      if (mode === 'fov') { const f = fov(); if (scene) scene.style.perspective = f + 'px'; }
    });
  };

  /* ================= WebGL 着色器 ================= */
  const VERT = 'attribute vec2 a_p;void main(){gl_Position=vec4(a_p,0.,1.);}';
  const FRAG = [
    'precision mediump float;',
    'uniform float u_t;uniform vec2 u_r;uniform int u_m;',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/u_r;vec2 p=(uv-.5)*vec2(u_r.x/u_r.y,1.);vec3 c=vec3(0.);',
    ' if(u_m==0){',
    /* 上下文：画的是「状态机」——网格 + 一个随 uniform 走的指针，配下方信息条 */
    '  float g=step(.965,max(fract(p.x*9.+u_t*.05),fract(p.y*9.)));',
    '  float d=length(p-vec2(sin(u_t*.9)*.26,cos(u_t*.7)*.16));',
    '  c=mix(vec3(.055,.06,.09),vec3(.85,1.,.28),smoothstep(.14,.02,d)+g*.22);',
    '  c+=vec3(.16,.05,.26)*smoothstep(.1,.9,uv.y);',
    ' } else {',
    '  float v=sin(p.x*7.+u_t)+sin(p.y*7.-u_t*.7)+sin((p.x+p.y)*5.+u_t*1.3);',
    '  c=.5+.5*cos(v+vec3(0.,2.1,4.2)+u_t*.35);',
    ' }',
    ' gl_FragColor=vec4(c,1.);',
    '}'
  ].join('\n');

  /* GPU 粒子：位置全部在顶点着色器里算，CPU 每帧只喂一个 u_t。
     之前用片元着色器画抖动点阵，既没有 gl.POINTS 也谈不上「顶点动画」，属于名不副实。 */
  const P_VERT = [
    'attribute float a_id;',
    'uniform float u_t;uniform float u_px;',
    'varying float v_l;',
    'float h(float x){return fract(sin(x*127.1)*43758.5453);}',
    'void main(){',
    ' float i=a_id, sd=h(i), ang=h(i+1.)*6.2831, spd=.25+h(i+2.)*.8;',
    ' float t=mod(u_t*.34+h(i+3.)*3.,1.25);',
    ' vec2 p=vec2(cos(ang),sin(ang))*spd*t*1.7;',
    ' p.y-=1.45*t*t;',
    ' p*= (sd*1.5+.35);',
    ' v_l=1.-t/1.25;',
    ' gl_Position=vec4(p,0.,1.);',
    ' gl_PointSize=(1.5+sd*3.4)*(.35+v_l*.85)*u_px;',
    '}'
  ].join('\n');
  const P_FRAG = [
    'precision mediump float;varying float v_l;',
    'void main(){',
    ' vec2 q=gl_PointCoord*2.-1.;float d=1.-dot(q,q);',
    ' if(d<=0.)discard;',
    ' gl_FragColor=vec4(mix(vec3(.48,.64,1.),vec3(.85,1.,.32),v_l)*d*v_l, d*v_l);',
    '}'
  ].join('\n');

  /* 后处理：真的两遍。A 遍渲到离屏纹理，B 遍采样 + 阈值提亮 + 9 抽头模糊 + 暗角 + 色调映射 */
  const SC_FRAG = [
    'precision mediump float;uniform float u_t;uniform vec2 u_r;',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/u_r;vec2 p=(uv-.5)*vec2(u_r.x/u_r.y,1.);',
    ' vec3 c=vec3(.04,.045,.07);',
    ' for(int i=0;i<3;i++){',
    '  float fi=float(i);',
    '  vec2 o=vec2(sin(u_t*.7+fi*2.1),cos(u_t*.55+fi*1.3))*.3;',
    '  float d=length(p-o);',
    '  c+=vec3(.9,.95,.55)*pow(max(0.,.16/max(d,.0001)),2.2+fi*.5);',
    ' }',
    ' gl_FragColor=vec4(c,1.);',
    '}'
  ].join('\n');
  const POST_FRAG = [
    'precision mediump float;',
    'uniform sampler2D u_tex;uniform vec2 u_r;uniform float u_on;uniform float u_t;',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/u_r;vec3 base=texture2D(u_tex,uv).rgb;',
    ' if(u_on<.5){gl_FragColor=vec4(base,1.);return;}',
    ' vec3 b=vec3(0.);',
    ' for(int x=-2;x<=2;x++)for(int y=-2;y<=2;y++){',
    '  vec2 o=vec2(float(x),float(y))*4./u_r;',
    '  vec3 t=texture2D(u_tex,uv+o).rgb;',
    '  b+=max(vec3(0.),t-.62);',
    ' }',
    ' b/=25.;',
    ' vec3 c=base+b*2.6;',
    ' c=1.-exp(-c*1.5);',                                  /* 色调映射 */
    ' float v=1.-smoothstep(.42,.95,length(uv-.5)*1.42);',  /* 暗角 */
    ' gl_FragColor=vec4(c*(.55+.45*v),1.);',
    '}'
  ].join('\n');

  function sh(gl, type, src) {
    const o = gl.createShader(type);
    gl.shaderSource(o, src); gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o) || 'shader compile failed');
    return o;
  }
  function prog(gl, vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link failed');
    return p;
  }
  const QUAD = [-1, -1, 3, -1, -1, 3];

  M.KINDS.shader = function (stage, s) {
    const cv = $('canvas', stage);
    const gl = cv.getContext('webgl2', { alpha: false, antialias: true, preserveDrawingBuffer: false })
      || cv.getContext('webgl', { alpha: false, antialias: true })
      || cv.getContext('experimental-webgl');
    if (!gl) {
      cv.remove();
      const d = document.createElement('div');
      d.className = 'no-gl';
      d.innerHTML = '此环境拿不到 WebGL 上下文<br><small>（软件渲染被禁用 / 上下文数量已达上限）</small>';
      stage.insertBefore(d, stage.firstChild);
      return;
    }
    const version = gl.getParameter(gl.VERSION);
    const isGL2 = /OpenGL ES 3|WebGL 2/.test(version);
    let info = 'WebGL ' + (isGL2 ? '2' : '1') + ' · MAX_TEXTURE_SIZE ' + gl.getParameter(gl.MAX_TEXTURE_SIZE) +
      ' · attribs ' + gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) info = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)).slice(0, 46) + ' · ' + info;

    const N = 9000;
    let postOn = true, cleanup = [];
    try {
      const full = prog(gl, VERT, FRAG);
      const pts = isGL2 ? prog(gl, P_VERT, P_FRAG) : null;
      const sc = prog(gl, VERT, SC_FRAG);
      const post = prog(gl, VERT, POST_FRAG);
      const quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(QUAD), gl.STATIC_DRAW);
      const ids = gl.createBuffer();
      if (pts) {
        const arr = new Float32Array(N);
        for (let i = 0; i < N; i++) arr[i] = i + 1;
        gl.bindBuffer(gl.ARRAY_BUFFER, ids);
        gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
      }
      const U = {
        full: { t: gl.getUniformLocation(full, 'u_t'), r: gl.getUniformLocation(full, 'u_r'), m: gl.getUniformLocation(full, 'u_m') },
        pts: pts ? { t: gl.getUniformLocation(pts, 'u_t'), px: gl.getUniformLocation(pts, 'u_px') } : null,
        sc: { t: gl.getUniformLocation(sc, 'u_t'), r: gl.getUniformLocation(sc, 'u_r') },
        post: { tex: gl.getUniformLocation(post, 'u_tex'), r: gl.getUniformLocation(post, 'u_r'), on: gl.getUniformLocation(post, 'u_on'), t: gl.getUniformLocation(post, 'u_t') }
      };
      /* 离屏纹理（后处理的输入） */
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fbo = gl.createFramebuffer();
      let tw = 0, th = 0;
      const alloc = function (w, h) {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        tw = w; th = h;
      };
      const bindQuad = function (p, name) {
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        const loc = gl.getAttribLocation(p, name || 'a_p');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      };
      if (s.mode === 'context') {
        const bar = document.createElement('b');
        bar.className = 'gl-info';
        bar.textContent = info;
        stage.appendChild(bar);
      }
      if (s.mode === 'postfx') {
        const tg = document.createElement('button');
        tg.type = 'button'; tg.className = 'gl-ab mini'; tg.textContent = '后处理 开';
        stage.appendChild(tg);
        tg.addEventListener('click', function (e) {
          e.stopPropagation();
          postOn = !postOn; tg.textContent = '后处理 ' + (postOn ? '开' : '关');
          tg.classList.toggle('off', !postOn);
        });
      }
      const t0 = performance.now();
      watch(stage, function (now) {
        const dpr = Math.min(1.75, window.devicePixelRatio || 1);
        const w = Math.max(2, cv.clientWidth * dpr | 0), h = Math.max(2, cv.clientHeight * dpr | 0);
        if (cv.width !== w || cv.height !== h) {
          cv.width = w; cv.height = h;
          gl.viewport(0, 0, w, h);
          if (s.mode === 'postfx') alloc(w, h);
        }
        const t = (now - t0) / 1000;
        if (s.mode === 'points') {
          if (!pts) { /* WebGL1 没有该程序时退回全屏片元，不至于白屏 */ 
            gl.useProgram(full); bindQuad(full);
            gl.uniform1i(U.full.m, 1); gl.uniform1f(U.full.t, t); gl.uniform2f(U.full.r, w, h);
            gl.drawArrays(gl.TRIANGLES, 0, 3); return;
          }
          gl.clearColor(.045, .05, .075, 1); gl.clear(gl.COLOR_BUFFER_BIT);
          gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
          gl.useProgram(pts);
          gl.bindBuffer(gl.ARRAY_BUFFER, ids);
          const loc = gl.getAttribLocation(pts, 'a_id');
          gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 1, gl.FLOAT, false, 0, 0);
          const n = Math.min(N, Math.round((stage._prm && stage._prm.n) || N));
          gl.uniform1f(U.pts.t, t);
          gl.uniform1f(U.pts.px, dpr);
          gl.drawArrays(gl.POINTS, 0, n);
          gl.disable(gl.BLEND);
          return;
        }
        if (s.mode === 'postfx') {
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
          gl.viewport(0, 0, tw, th);
          gl.useProgram(sc); bindQuad(sc);
          gl.uniform1f(U.sc.t, t); gl.uniform2f(U.sc.r, tw, th);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.viewport(0, 0, w, h);
          gl.useProgram(post); bindQuad(post);
          gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.uniform1i(U.post.tex, 0);
          gl.uniform1f(U.post.on, postOn ? 1 : 0);
          gl.uniform1f(U.post.t, t); gl.uniform2f(U.post.r, w, h);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          return;
        }
        gl.useProgram(full); bindQuad(full);
        gl.uniform1i(U.full.m, s.mode === 'context' ? 0 : 1);
        gl.uniform1f(U.full.t, t);
        gl.uniform2f(U.full.r, w, h);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      });
      /* 上下文会丢（休眠、驱动重置），词条里明说了这件事，这里就真的处理它 */
      const onLost = function (e) { e.preventDefault(); cv.classList.add('gl-lost'); };
      const onRest = function () { cv.classList.remove('gl-lost'); };
      cv.addEventListener('webglcontextlost', onLost, false);
      cv.addEventListener('webglcontextrestored', onRest, false);
      cleanup.push(function () { cv.removeEventListener('webglcontextlost', onLost); cv.removeEventListener('webglcontextrestored', onRest); });
    } catch (err) {
      cv.remove();
      const d = document.createElement('div');
      d.className = 'no-gl';
      d.innerHTML = '着色器编译失败<br><small>' + String(err.message).slice(0, 72) + '</small>';
      stage.insertBefore(d, stage.firstChild);
    }
  };

  /* ================= Canvas 2D 场景 ================= */
  function ctx2d(stage) {
    const cv = $('canvas', stage);
    const fit = function () {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== (w * dpr | 0) || cv.height !== (h * dpr | 0)) { cv.width = w * dpr | 0; cv.height = h * dpr | 0; }
      const g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { g: g, w: w, h: h };
    };
    return { cv: cv, fit: fit };
  }
  const ACC = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#d9ff47';
  const ACC2 = () => getComputedStyle(document.documentElement).getPropertyValue('--accent-2').trim() || '#7aa2ff';

  const SCENES = {
    particles: function (st, stage) {
      /* 对象池：预分配 + 死亡只标记，绝不每帧 new / splice —— 词条讲的就是这件事 */
      const CAP = 260;
      const pool = new Array(CAP);
      for (let i = 0; i < CAP; i++) pool[i] = { x: 0, y: 0, vx: 0, vy: 0, life: 0, r: 0 };
      let cursor = 0, live = 0;
      const spawn = function (w, h) {
        const p = pool[cursor]; cursor = (cursor + 1) % CAP;
        const ang = -Math.PI / 2 + (Math.random() - .5) * 1.5, spd = 60 + Math.random() * 110;
        p.x = w * 0.5; p.y = h * 0.66;
        p.vx = Math.cos(ang) * spd; p.vy = Math.sin(ang) * spd;
        p.life = 1; p.r = 1.4 + Math.random() * 2.6;
      };
      let acc = 0, last = 0;
      return function (now, dt) {
        const c = st.fit(), g = c.g, w = c.w, h = c.h;
        const rate = (stage._prm && stage._prm.rate) || 34;
        const grav = (stage._prm && stage._prm.g) || 120;
        if (!last) last = now;
        const d = Math.min(0.05, (now - last) / 1000); last = now;
        acc += d;
        while (acc > 1 / rate) { acc -= 1 / rate; spawn(w, h); }
        g.clearRect(0, 0, w, h);
        live = 0;
        for (let i = 0; i < CAP; i++) {
          const p = pool[i];
          if (p.life <= 0) continue;
          p.vy += grav * d; p.x += p.vx * d; p.y += p.vy * d; p.life -= d * 0.55;
          if (p.life <= 0) continue;
          live++;
          g.globalAlpha = clamp(p.life, 0, 1);
          g.fillStyle = p.life > 0.6 ? ACC() : ACC2();
          g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.284); g.fill();
        }
        g.globalAlpha = 1;
        st.count.textContent = live + ' / ' + CAP + ' 槽位 · 零 new、零 splice';
      };
    },
    instancing: function (st, stage) {
      /* 原来 900 次 fillRect 配字幕「1 次绘制循环」，自相矛盾。
         这里真的跑两种提交方式并各自计时：N 次 fill() vs 1 次 beginPath+rect×N+fill()。 */
      let seed = null, prepared = 0, N = 0;
      const tRef = { bad: 0, good: 0 };
      return function (now) {
        const c = st.fit(), g = c.g, w = c.w, h = c.h, t = now / 1000;
        N = Math.round((stage._prm && stage._prm.n) || 900);
        if (!seed || prepared !== N) {
          seed = new Float32Array(N * 2);
          for (let i = 0; i < N; i++) { seed[i * 2] = Math.random(); seed[i * 2 + 1] = Math.random(); }
          prepared = N;
        }
        g.clearRect(0, 0, w, h);
        const pos = function (i) {
          const u = seed[i * 2], v = seed[i * 2 + 1];
          return [((u + t * 0.06) % 1) * w, v * h * 0.9 + Math.sin(t * 2 + u * 12) * 5, u];
        };
        let t0 = performance.now();
        for (let i = 0; i < N; i++) {
          const p = pos(i);
          g.globalAlpha = 0.25 + 0.75 * Math.abs(Math.sin(t + p[2] * 8));
          g.fillStyle = ACC2();
          g.fillRect(p[0], p[1], 2.4, 2.4);
        }
        tRef.bad = tRef.bad * 0.8 + (performance.now() - t0) * 0.2;
        t0 = performance.now();
        g.beginPath();
        g.globalAlpha = 1; g.fillStyle = ACC();
        for (let i = 0; i < N; i++) { const p = pos(i); g.rect(p[0], h - 26 - (p[1] % (h - 34)), 2.4, 2.4); }
        g.fill();
        tRef.good = tRef.good * 0.8 + (performance.now() - t0) * 0.2;
        st.count.textContent = N + ' 个方块 · 逐个提交 ' + tRef.bad.toFixed(2) + 'ms → 一次提交 ' + tRef.good.toFixed(2) + 'ms';
      };
    },
    warp: function (st) {
      return function (now) {
        const c = st.fit(), g = c.g, w = c.w, h = c.h, t = now / 1000;
        g.clearRect(0, 0, w, h);
        const cols = 18, rows = 10, cw = w / cols, ch = h / rows;
        g.strokeStyle = ACC2(); g.lineWidth = 1;
        const pt = function (i, j) {
          const x = i * cw, y = j * ch;
          const k = Math.sin(x * 0.05 + t * 2) * 7 + Math.cos(y * 0.07 - t * 1.4) * 7;
          return [x + k, y + k * 0.5];
        };
        for (let i = 0; i <= cols; i++) {
          g.beginPath();
          for (let j = 0; j <= rows; j++) { const p = pt(i, j); j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
          g.stroke();
        }
        for (let j = 0; j <= rows; j++) {
          g.beginPath();
          for (let i = 0; i <= cols; i++) { const p = pt(i, j); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
          g.stroke();
        }
        g.fillStyle = ACC();
        const p = pt(4, 3); g.beginPath(); g.arc(p[0], p[1], 4, 0, 6.284); g.fill();
        st.count.textContent = '顶点逐点位移 · 网格 18×10';
      };
    },
    physics: function (st, stage) {
      const B = [];
      const add = function (x, y, vy) {
        B.push({ x: x, y: y, vx: (Math.random() - 0.5) * 160, vy: vy == null ? -40 : vy, r: 7 + Math.random() * 9 });
        if (B.length > 26) B.shift();
      };
      stage.addEventListener('pointerdown', function (e) {
        const r = st.cv.getBoundingClientRect();
        add(e.clientX - r.left, e.clientY - r.top);
      });
      let last = 0, nextDrop = 0;
      return function (now) {
        const c = st.fit(), g = c.g, w = c.w, h = c.h;
        if (!last) last = now;
        const dt = Math.min(0.033, (now - last) / 1000); last = now;
        /* 堆平了就再扔一轮：静止的一堆球不像在演示物理 */
        if (!B.length || now > nextDrop) {
          nextDrop = now + 3400;
          for (let i = 0; i < 4; i++) add(w * (0.15 + Math.random() * 0.7), h * (0.05 + Math.random() * 0.2), -60 - Math.random() * 90);
        }
        g.clearRect(0, 0, w, h);
        for (let i = 0; i < B.length; i++) {
          const b = B[i];
          b.vy += 780 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.y + b.r > h) { b.y = h - b.r; b.vy *= -0.62; b.vx *= 0.98; }
          if (b.x < b.r || b.x > w - b.r) { b.vx *= -0.72; b.x = clamp(b.x, b.r, w - b.r); }
          for (let j = i + 1; j < B.length; j++) {
            const o = B[j], dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy), m = b.r + o.r;
            if (d > 0 && d < m) {
              const push = (m - d) / 2, nx = dx / d, ny = dy / d;
              b.x -= nx * push; b.y -= ny * push; o.x += nx * push; o.y += ny * push;
              const rel = (o.vx - b.vx) * nx + (o.vy - b.vy) * ny;
              if (rel < 0) { const imp = rel * 0.9; b.vx += nx * imp; b.vy += ny * imp; o.vx -= nx * imp; o.vy -= ny * imp; }
            }
          }
          g.fillStyle = i % 3 ? ACC() : ACC2();
          g.beginPath(); g.arc(b.x, b.y, b.r, 0, 6.284); g.fill();
        }
        st.count.textContent = B.length + ' 个刚体 · 重力 + 碰撞求解';
      };
    },
    gltf: function (st, stage) {
      /* 原来只画一个线框立方体，跟 css-3d 撞脸，完全表达不出「压缩」。
         现在同屏画同一形状的两个精度：稠密网格 vs Draco 简化后的网格。 */
      const mesh = function (n) {
        const V = [], E = [];
        for (let i = 0; i < n; i++) {
          const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(Math.max(0, 1 - y * y));
          for (let j = 0; j < n; j++) {
            const a = (j / n) * 6.2831;
            V.push([Math.cos(a) * r, y, Math.sin(a) * r]);
          }
        }
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          const k = i * n + j;
          E.push([k, i * n + (j + 1) % n]);
          if (i < n - 1) E.push([k, k + n]);
        }
        return { V: V, E: E };
      };
      const hi = mesh(18), lo = mesh(7);
      const draw = function (g, m, cx, cy, R, t, col, dense) {
        const cy2 = Math.cos(t), sy2 = Math.sin(t);
        const pr = m.V.map(function (v) {
          const x = v[0] * cy2 - v[2] * sy2, z = v[0] * sy2 + v[2] * cy2;
          const k = 2.4 / (2.4 + z);
          return [cx + x * R * k, cy - (v[1] * .82 + z * .18) * R * k];
        });
        g.strokeStyle = col; g.lineWidth = dense ? .7 : 1.3; g.globalAlpha = dense ? .5 : .95;
        g.beginPath();
        m.E.forEach(function (e) { const a = pr[e[0]], b = pr[e[1]]; if (!a || !b) return; g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); });
        g.stroke();
        if (!dense) { g.fillStyle = col; g.globalAlpha = 1; pr.forEach(function (p) { g.fillRect(p[0] - 1, p[1] - 1, 2, 2); }); }
        g.globalAlpha = 1;
      };
      return function (now) {
        const c = st.fit(), g = c.g, w = c.w, h = c.h, t = now / 1500;
        g.clearRect(0, 0, w, h);
        const R = Math.min(w * .21, h * .4);
        draw(g, hi, w * .27, h * .48, R, t, ACC2(), true);
        draw(g, lo, w * .73, h * .48, R, t, ACC(), false);
        g.strokeStyle = 'rgba(140,150,170,.35)'; g.lineWidth = 1;
        g.setLineDash([3, 4]); g.beginPath(); g.moveTo(w / 2, 8); g.lineTo(w / 2, h - 8); g.stroke(); g.setLineDash([]);
        g.font = '9.5px ui-monospace, monospace'; g.fillStyle = ACC2();
        g.fillText('原始 ' + hi.V.length + ' 顶点 · 1.2MB', 8, h - 8);
        g.fillStyle = ACC();
        g.fillText('Draco ' + lo.V.length + ' 顶点 · 180KB', w / 2 + 8, h - 8);
        st.count.textContent = '同一个球体 · 顶点 ' + hi.V.length + ' → ' + lo.V.length + '（几何减到约 1/6）';
      };
    },
    dt: function (st, stage) {
      /* 60Hz 下两条只差 36px/s，几乎看不出。所以给一个「模拟帧率」滑块，
         并且把错开量算成绝对位置差而不是取模，读数才不会突然跳回。 */
      let a1 = 0, b1 = 0, last = 0;
      return function (now) {
        const c = st.fit(), g = c.g, w = c.w, h = c.h;
        const hz = (stage._prm && stage._prm.hz) || 60;
        if (!last) last = now;
        let dt = (now - last) / 1000; last = now;
        dt = Math.min(0.05, dt);
        const frames = dt * hz;                    /* 这一秒真实过了多少帧 × 模拟帧率 */
        a1 += 2.6 * frames;                        /* ✗ 每帧固定 +2.6px：帧率越高跑得越快 */
        b1 += 120 * dt;                            /* ✓ 乘以真实时间 */
        g.clearRect(0, 0, w, h);
        g.strokeStyle = 'rgba(140,150,170,.4)'; g.lineWidth = 1;
        g.setLineDash([3, 4]);
        [0.30, 0.66].forEach(function (y) { g.beginPath(); g.moveTo(w - 22, h * y - 12); g.lineTo(w - 22, h * y + 12); g.stroke(); });
        g.setLineDash([]);
        const span = w - 44;
        g.fillStyle = 'rgba(140,150,170,.55)';
        g.fillRect(22 + (b1 % span), h * 0.30 - 5, 14, 10);
        g.fillStyle = ACC();
        g.fillRect(22 + (a1 % span), h * 0.66 - 5, 14, 10);
        g.font = '9.5px ui-monospace, monospace';
        g.fillStyle = 'rgba(140,150,170,.9)'; g.fillText('✓ 乘以 dt · 帧率无关', 6, h * 0.30 - 11);
        g.fillStyle = ACC(); g.fillText('✗ 每帧 +固定值', 6, h * 0.66 - 11);
        st.count.textContent = hz + 'Hz 模拟 · 两条已错开 ' + Math.round(Math.abs((a1 % span) - (b1 % span))) + 'px';
      };
    },
    loop: function (st) {
      let acc = 0, last = 0, frames = 0, fps = 0, fpsT = 0;
      return function (now) {
        const c = st.fit(), g = c.g, w = c.w, h = c.h;
        if (!last) last = now;
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        acc += dt; frames++;
        if (now - fpsT > 500) { fps = Math.round(frames / ((now - fpsT) / 1000)); frames = 0; fpsT = now; }
        g.clearRect(0, 0, w, h);
        const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.34;
        g.strokeStyle = 'rgba(140,150,170,.35)'; g.beginPath(); g.arc(cx, cy, R, 0, 6.284); g.stroke();
        for (let i = 0; i < 5; i++) {
          const a = acc * (0.8 + i * 0.35) + i;
          g.fillStyle = i === 0 ? ACC() : ACC2();
          g.globalAlpha = 0.35 + i * 0.16;
          g.beginPath(); g.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 5, 0, 6.284); g.fill();
        }
        g.globalAlpha = 1;
        st.count.textContent = 'update(dt) → draw() · ' + fps + 'fps · 累计 ' + acc.toFixed(1) + 's';
      };
    }
  };

  M.KINDS.canvas2d = function (stage, s) {
    const st = ctx2d(stage);
    st.count = $('.cn', stage);
    const fn = SCENES[s.mode];
    if (!fn) { console.warn('[runtime] 未知的 canvas2d mode：' + s.mode); return; }
    const draw = fn(st, stage);
    watch(stage, function (now) { draw(now, 0.016); });
    draw(performance.now(), 0.016);
  };

  const rep2 = function (n, fn) { let o = ''; for (let i = 0; i < n; i++) o += fn(i); return o; };

  /* ================= 精灵图 ================= */
  /* 精灵图用 currentColor 取主题色，换主题 / 浅色模式才不会带着两套硬编码色 */
  const SPRITE_FRAMES = 8, SPRITE_W = 40;
  const spriteUrl = function (fg, bg) {
    const frames = [];
    for (let i = 0; i < SPRITE_FRAMES; i++) {
      const t = i / (SPRITE_FRAMES - 1), y = 30 - Math.sin(t * Math.PI) * 20, sq = 1 + Math.sin(t * Math.PI * 2) * 0.16;
      frames.push('<g transform="translate(' + (i * SPRITE_W + 20) + ' ' + y + ')"><rect x="' + (-9 / sq) + '" y="' + (-9 * sq) + '" width="' + (18 / sq) + '" height="' + (18 * sq) + '" rx="4" fill="' + fg + '"/>' +
        '<circle cx="' + (i % 2 ? 4 : -4) + '" cy="-3" r="2" fill="' + bg + '"/></g>');
    }
    return 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="' + (SPRITE_W * SPRITE_FRAMES) + '" height="48">' + frames.join('') + '</svg>') + '")';
  };
  M.KINDS.sprite = function (stage) {
    const el = $('.sprite-el', stage), fr = $('.fr', stage), wrap = $('.sp2', stage);
    const strip = $('.sp-strip', stage), marks = $$('.sp-cell', stage);
    let f = -1, last = 0, tint = '';
    const paint = function () {
      /* 裁切窗口和整条图共用同一个 --f，两者永远对得上 */
      if (wrap) wrap.style.setProperty('--f', f);
      marks.forEach(function (m, i) { m.classList.toggle('on', i === f); });
      if (fr) fr.textContent = 'frame ' + (f + 1) + '/' + SPRITE_FRAMES + ' · 整条 ' + SPRITE_W * SPRITE_FRAMES + '×48 只裁 1 格';
    };
    /* 整条图与裁切窗口是同一张 data-URL，换主题时一起换 */
    const ink = function () {
      const c = ACC();
      if (c === tint) return;
      tint = c;
      const u = spriteUrl(c, ACC2());
      el.style.backgroundImage = u;
      if (strip) strip.style.backgroundImage = u;
    };
    ink(); paint();
    watch(stage, function (now) {
      const fps = Math.round((stage._prm && stage._prm.fps) || 8);
      ink();
      if (now - last < 1000 / fps) return;   /* 定格感完全来自低帧率 */
      last = now;
      f = (f + 1) % SPRITE_FRAMES;
      paint();
    });
  };

  /* ================= Lottie 迷你播放器 ================= */
  const LOTTIE = {
    v: '5.7.4', fr: 30, ip: 0, op: 60,
    layers: [{ nm: 'blob', ks: {
      s: [{ t: 0, v: 62 }, { t: 18, v: 118, e: 0.4 }, { t: 36, v: 88 }, { t: 60, v: 62 }],
      r: [{ t: 0, v: 0 }, { t: 60, v: 180 }],
      o: [{ t: 0, v: 30 }, { t: 20, v: 100 }, { t: 60, v: 30 }]
    } }]
  };
  /* e = 这条关键帧的缓动强度：0 是线性（Lottie 里就是没有 spatial/out-tangent），1 是完整 ease-in-out */
  function lerpKF(kfs, frame) {
    if (frame <= kfs[0].t) return kfs[0].v;
    for (let i = 1; i < kfs.length; i++) {
      if (frame <= kfs[i].t) {
        const a = kfs[i - 1], b = kfs[i];
        const t = (frame - a.t) / (b.t - a.t);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const k = b.e == null ? 0.85 : b.e;
        return a.v + (b.v - a.v) * (t + (eased - t) * k);
      }
    }
    return kfs[kfs.length - 1].v;
  }
  M.KINDS.lottie = function (stage) {
    const ks = LOTTIE.layers[0].ks, shape = $('.lo-shape', stage), head = $('.lo-head', stage), val = $('.lo-val', stage);
    const track = $('.lo-track', stage);
    /* 关键帧菱形 */
    ks.s.forEach(function (k) {
      const d = document.createElement('i');
      d.className = 'lo-kf'; d.style.left = (k.t / LOTTIE.op * 100) + '%'; d.title = 't=' + k.t + ' → ' + k.v;
      track.appendChild(d);
    });
    let frame = 0, auto = true, manualAt = 0;
    const seek = function (f) {
      frame = clamp(f, 0, LOTTIE.op);
      const s = lerpKF(ks.s, frame) / 100, r = lerpKF(ks.r, frame), o = lerpKF(ks.o, frame) / 100;
      shape.style.transform = 'scale(' + s.toFixed(3) + ') rotate(' + r.toFixed(1) + 'deg)';
      shape.style.opacity = o.toFixed(2);
      head.style.left = (frame / LOTTIE.op * 100) + '%';
      const sp = (stage._prm && stage._prm.sp) || 1;
      val.textContent = 'frame ' + frame.toFixed(1) + ' / ' + LOTTIE.op + ' @ ' + LOTTIE.fr + 'fps · ' +
        sp.toFixed(1) + '× ' + (auto ? '播放中' : '已拖住');
    };
    seek(0);
    track.addEventListener('pointerdown', function (e) {
      auto = false;
      const r = track.getBoundingClientRect();
      const move = function (ev) { seek((ev.clientX - r.left) / r.width * LOTTIE.op); };
      move(e);
      const up = function () { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); auto = true; };
      document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
    });
    watch(stage, function (now) {
      if (!auto) return;
      const sp = (stage._prm && stage._prm.sp) || 1;
      seek((now / (1000 / LOTTIE.fr) * sp) % (LOTTIE.op + 1));
    });
  };

  /* ================= Rive 状态机 ================= */
  const RIVE_STATES = { idle: '待机', wave: '挥手', alert: '提醒' };
  M.KINDS.rive = function (stage) {
    const arm = $('.rv-arm', stage), nodes = $$('.rv-node', stage), out = $('.rv-out', stage), edge = $('.rv-edge', stage);
    let state = 'idle', t = 0, blend = 0;
    const fire = function (next) {
      state = next; t = 0;
      nodes.forEach(n => n.classList.toggle('on', n.dataset.s === next));
      edge.classList.toggle('hot', next !== 'idle');
      out.textContent = 'state = ' + next + ' · ' + RIVE_STATES[next];
      if (stage._apply) stage._apply();
    };
    fire('idle');
    /* 三个状态节点本身都可点：原来只有 wave 有 data-fire，alert 是个永远进不去的死标签 */
    stage.addEventListener('click', function (e) {
      const b = e.target.closest('[data-fire], .rv-node');
      if (b) { fire(b.dataset.fire || b.dataset.s); return; }
      fire(state === 'idle' ? 'wave' : 'idle');
    });
    let last = 0;
    watch(stage, function (now) {
      if (!last) last = now;
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      const target = state === 'wave' ? Math.sin(t * 9) * 46 : state === 'alert' ? Math.sin(t * 22) * 8 : Math.sin(t * 1.6) * 6;
      blend += (target - blend) * Math.min(1, dt * 9);   /* 状态混合 */
      arm.style.transform = 'rotate(' + blend.toFixed(2) + 'deg)';
    });
  };

  /* ================= 骨骼 FK / IK ================= */
  M.KINDS.rig = function (stage, s) {
    const bones = $$('.bone', stage), tip = $('.tip', stage), readout = $('.rig-out', stage);
    let hasPointer = false;
    const L = [42, 32, 18];
    const set = function (angles, pos) {
      let x = pos ? pos[0] : 0, y = pos ? pos[1] : 0, acc = 0;
      bones.forEach(function (b, i) {
        acc += angles[i];
        const nx = x + Math.cos(acc) * L[i], ny = y + Math.sin(acc) * L[i];
        b.setAttribute('x1', x); b.setAttribute('y1', y); b.setAttribute('x2', nx); b.setAttribute('y2', ny);
        x = nx; y = ny;
      });
      if (tip) { tip.setAttribute('cx', x); tip.setAttribute('cy', y); }
      return [x, y];
    };
    if (s.mode === 'fk') {
      watch(stage, function (now) {
        const t = now / 1000;
        const p = set([-1.5 + Math.sin(t * 1.5) * 0.5, -0.5 + Math.sin(t * 1.5 + 1) * 0.7, -0.4 + Math.sin(t * 2 + 2) * 0.6]);
        if (readout) readout.textContent = '肩 ' + ((-1.5 + Math.sin(t * 1.5) * 0.5) * 57).toFixed(0) + '° · 逐关节叠加角度';
      });
      return;
    }
    /* 两骨 IK：由末端目标反解肩/肘角度 */
    const svg = $('.rigsvg', stage);
    let tx = 40, ty = -60, idle = 0;
    const toLocal = function (cx, cy) {
      if (!svg || !svg.getScreenCTM) return [tx, ty];
      const m = svg.getScreenCTM(); if (!m) return [tx, ty];
      const p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
      return [p.x - 85, p.y - 108];
    };
    stage.addEventListener('pointermove', function (e) {
      const q = toLocal(e.clientX, e.clientY);
      hasPointer = true; idle = 0;
      /* 限位在可行域内：基座距 viewBox 底只有 12px，目标落到基座之下
         手臂会伸出画面被裁掉（详情页大舞台尤其明显），左右也要留边 */
      tx = clamp(q[0], -74, 74);
      ty = Math.min(q[1], -12);
    });
    stage.addEventListener('pointerleave', function () { hasPointer = false; });
    watch(stage, function (now) {
      /* 没有指针时用李萨如轨迹自己走，否则卡片里永远是一帧定格 */
      if (!hasPointer) {
        const t = now / 1000;
        idle = Math.min(1, idle + 0.02);
        tx += (Math.cos(t * 0.8) * 46 - tx) * idle * 0.12;
        ty += (Math.sin(t * 1.3) * 30 - 34 - ty) * idle * 0.12;
      }
      const l1 = L[0], l2 = L[1];
      const d = clamp(Math.hypot(tx, ty), Math.abs(l1 - l2) + 1, l1 + l2 - 1);
      const base = Math.atan2(ty, tx);
      const cosE = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
      const a1 = base + Math.acos(cosE);
      const cosS = clamp((l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2), -1, 1);
      const a2 = Math.PI - Math.acos(cosS);
      set([a1, -a2 + 0.2, 0]);
      if (readout) readout.textContent = '目标 (' + tx.toFixed(0) + ',' + ty.toFixed(0) + ') → 肩 ' + (a1 * 57).toFixed(0) + '° 肘 ' + (a2 * 57).toFixed(0) + '°';
    });
  };

  /* ================= 嵌套 3D 上下文 A/B ================= */
  /* 立方体太小、六个面在卡片尺寸下糊成一团，读不出「拍平」这件事。
     改成父板绕 Y 摆动、三块子板各带 translateZ：flat 时子板全塌回父平面。 */
  M.KINDS.nest = function (stage) {
    const boards = $$('.ns-parent', stage);
    const sync = function () {
      const on = window.ENGINE.motionOn();
      boards.forEach(function (b) { b.style.animationPlayState = on ? 'running' : 'paused'; });
    };
    window.ENGINE.onMotion(sync);
    sync();
  };

  /* ================= SMIL ================= */
  /* SMIL 用的是 SVG 自己的时钟，不吃 tickers 的动效开关门控，得手动 pauseAnimations */
  M.KINDS.smil = function (stage) {
    const svg = $('.smil', stage), out = $('.smil-out', stage);
    if (!svg || !svg.pauseAnimations) return;
    const sync = function () {
      const on = window.ENGINE.motionOn();
      on ? svg.unpauseAnimations() : svg.pauseAnimations();
      if (out) out.textContent = on ? 'SVG 自带时钟在跑' : '时钟已暂停（无脚本可停 SMIL，只能 pauseAnimations）';
    };
    window.ENGINE.onMotion(sync);
    sync();
  };

  /* ================= 时间轴拖拽 ================= */
  M.KINDS.scrub = function (stage) {
    const el = $('.sc-obj', stage), sl = $('input', stage), out = $('.sc-val', stage);
    const apply = function (p) {
      const e = EASE.easeInOut(p);
      el.style.transform = 'translateX(' + ((e - 0.5) * 96).toFixed(2) + 'px) rotate(' + (e * 180 - 90).toFixed(1) + 'deg) scale(' + (0.6 + e * 0.5).toFixed(3) + ')';
      el.style.opacity = String(0.25 + e * 0.75);
      if (out) out.textContent = 'progress = ' + p.toFixed(2) + (auto ? '' : ' · 手动');
    };
    sl.addEventListener('input', function () { auto = false; manualAt = performance.now(); apply(+sl.value); });
    let auto = true, last = 0, manualAt = 0;
    /* 手动拖过之后 1.6s 自动接回播放头，否则关一次就永远停在原地 */
    const resume = function (now) {
      if (!auto && performance.now() - manualAt > 1600) { auto = true; last = now; }
    };
    watch(stage, function (now) {
      resume(now);
      if (!auto) return;
      if (!last) last = now;
      const p = ((now - last) / 2600) % 1;
      sl.value = p; apply(p);
    });
    apply(0.3);
  };

  /* ================= HTML 生成 ================= */
  const HTML = {
    cube: function (s) {
      if (s.mode === 'backface') return BACKFACE_HTML;
      if (s.mode === 'flat') return FLAT_HTML;
      return CUBE_HTML;
    },
    shader: function () { return '<canvas class="glc"></canvas>'; },
    canvas2d: function () { return '<canvas class="c2d"></canvas><span class="cn"></span>'; },
    sprite: function () {
      return '<div class="sp2"><i class="sp-strip">' + rep2(SPRITE_FRAMES, i => '<b class="sp-cell">' + i + '</b>') + '</i>' +
        '<div class="sp-row"><b class="sprite-el"></b><s class="sp-note">↓ 这一格就是上面整条里高亮的那一格</s></div>' +
        '<span class="fr"></span></div>';
    },
    lottie: function () {
      return '<div class="lo"><i class="lo-shape"></i><div class="lo-track"><i class="lo-head"></i></div>' +
        '<span class="lo-val"></span></div>';
    },
    rive: function () {
      return '<div class="rivewrap"><svg viewBox="0 0 60 60" class="rv-fig"><g class="rv-arm" transform="rotate(0 30 34)">' +
        '<line x1="30" y1="34" x2="50" y2="20" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>' +
        '<circle cx="51" cy="19" r="4.5" fill="currentColor"/></g>' +
        '<circle cx="26" cy="18" r="8" fill="currentColor"/><rect x="19" y="27" width="14" height="22" rx="6" fill="currentColor" opacity=".55"/></svg>' +
        '<div class="rv-sm"><i class="rv-node on" data-s="idle">Idle</i><i class="rv-edge"></i><i class="rv-node" data-s="wave">Wave</i>' +
        '<i class="rv-node" data-s="alert">Alert</i></div>' +
        '<div class="rv-bar"><button type="button" class="mini" data-fire="wave">fire Input</button><span class="rv-out"></span></div></div>';
    },
    rig: function () {
      return '<svg viewBox="0 0 170 120" class="rigsvg" preserveAspectRatio="xMidYMax meet"><g transform="translate(85 108)">' +
        '<line class="bone" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>' +
        '<line class="bone" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity=".8"/>' +
        '<line class="bone" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity=".6"/>' +
        '<circle class="tip" r="5" fill="var(--accent)"/></g></svg><span class="rig-out"></span>';
    },
    smil: function () {
      return '<div class="smilwrap"><svg viewBox="0 0 160 90" class="smil">' +
        '<path d="M10 70 C 46 6, 116 84, 150 20" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-dasharray="4 5"/>' +
        '<circle r="7" fill="var(--accent)"><animateMotion dur="3.2s" repeatCount="indefinite" rotate="auto" path="M10 70 C 46 6, 116 84, 150 20"/></circle>' +
        '<circle r="4.5" fill="none" stroke="var(--accent)" stroke-width="1.5" opacity=".7">' +
        '<animate attributeName="r" values="4;17;4" dur="3.2s" repeatCount="indefinite"/>' +
        '<animate attributeName="opacity" values=".7;0;.7" dur="3.2s" repeatCount="indefinite"/></circle>' +
        '<rect x="70" y="30" width="20" height="20" rx="5" fill="none" stroke="var(--accent-2)" stroke-width="2">' +
        '<animateTransform attributeName="transform" type="rotate" from="0 80 40" to="360 80 40" dur="2.4s" repeatCount="indefinite"/></rect></svg>' +
        '<span class="smil-out"></span></div>';
    },
    nest: function () {
      const cell = function (cls, label) {
        return '<i class="ab-cell"><span class="ns-scene"><b class="ns-parent ' + cls + '">' +
          '<s style="--z:-46px">后面</s><s style="--z:0px">中间</s><s style="--z:46px">前面</s>' +
          '</b></span><u>' + label + '</u></i>';
      };
      return '<div class="ab2 ns-ab">' + cell('flat3d', '层次被压平') + cell('keep3d', '前后距离保留') + '</div>';
    },
    scrub: function () {
      return '<div class="sc"><i class="sc-obj"></i><input type="range" min="0" max="1" step="0.005" value="0"><span class="sc-val"></span></div>';
    }
  };
  M.htmlFor = function (s) {
    const f = HTML[s.kind];
    /* 静默回落到 cube 会让「kind 拼错」变成一屏看起来正常的假 3D，之前踩过 */
    if (!f) { console.warn('[runtime] 未知的 demo.kind：' + s.kind); return HTML.cube(s); }
    return f(s);
  };
})();
