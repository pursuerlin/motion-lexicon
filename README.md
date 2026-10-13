# 动效词汇表 · Motion Lexicon

把“那个感觉”说成专业术语，也让团队更容易讨论、试验和实现动效。

动效词汇表是一个可直接在浏览器中使用的交互式参考库，收录 244 个动效术语、16 个分类和 23 种可交互演示。你可以从模糊的视觉感受出发，搜索并理解对应的运动方式，再通过点击、悬停、拖拽或滚动亲自体验效果，快速找到适合当前界面的表达。

每个词条都围绕“怎么动、何时触发、适合用在哪里”展开，并提供演示、代码参考和可组合的动效配方，帮助设计评审与前端实现对齐预期。代码示例会标注适用平台；无法准确转换时会保留原始表达并明确说明。

[在线体验](https://pursuerlin.github.io/motion-lexicon/) · [GitHub 源码](https://github.com/pursuerlin/motion-lexicon)

## 页面预览

### 首页与动效灵感

![动效词汇表首页：术语搜索、动效灵感签与交互预览](docs/screenshots/readme-home.png)

### 交互动效片段

| 翻页卷曲转场 | 粒子球体变形 |
| --- | --- |
| ![翻页卷曲转场动效演示](docs/screenshots/motion-page-curl.gif) | ![粒子球体变形动效演示](docs/screenshots/motion-morphing-dot-sphere.gif) |
| 共享元素转场 | 沉浸式漂浮生长 |
| ![共享元素转场动效演示](docs/screenshots/motion-shared-element-transition.gif) | ![沉浸式漂浮生长动效演示](docs/screenshots/motion-immersive-floating-growth.gif) |

## 功能

- 可重播或可操作的真实演示
- “含糊说法 → 专业说法”的需求表达
- CSS、WAAPI、GSAP、Framer Motion、Swift、Compose、Tailwind 的代码示例；能否转换取决于该条动效和目标平台，无法准确转换时会保留原文并明确标注
- 可收藏、可搜索、可组合复制的动效配方
- 中文 / English、五套主题、减弱动效和离屏暂停支持

## 本地运行

项目是纯静态文件，使用任意静态服务器即可：

```bash
python3 -m http.server 4173
```

然后打开 <http://127.0.0.1:4173/>。

也可以直接双击 `index.html`，但本地服务器更适合测试资源加载、字体和浏览器交互。

## 目录结构

```text
index.html          页面骨架与文案
assets/app.js       搜索、导航、详情页、配方与演示引擎
assets/data1.js     术语数据（前半部分）
assets/data2.js     术语数据（后半部分）
assets/motion.js    通用动效与交互演示
assets/compound.js  组合范式演示
assets/hud.js       实时读数与遥测面板
assets/styles.css   主视觉与响应式样式
assets/i18n.js      中英文界面词条
check.sh            发布前自检
```

## 自检

提交前运行：

```bash
python3 check.sh
```

脚本会检查 JavaScript 语法、静态资源引用、英文词条覆盖以及资源版本号一致性。

## GitHub Pages

仓库包含 `.github/workflows/pages.yml`。推送到 `master` 后，GitHub Actions 会自动把根目录发布到 GitHub Pages。首次启用时，在仓库设置中将 Pages 的来源设为 **GitHub Actions**。

## 许可与素材

项目代码采用 [MIT License](LICENSE)。自托管字体按各自的 SIL Open Font License 1.1 提供，详见 [`assets/fonts/NOTICE.md`](assets/fonts/NOTICE.md) 和 [`assets/fonts/OFL.txt`](assets/fonts/OFL.txt)。图片素材的来源与授权见 [`assets/img/ATTRIBUTION.md`](assets/img/ATTRIBUTION.md)。

## 参与修改

欢迎提交术语修正、演示改进和翻译补充。新增术语时，请同时补齐中文、英文、演示说明和对应的 `data-l10n` 词条，并在提交前运行 `python3 check.sh`。
