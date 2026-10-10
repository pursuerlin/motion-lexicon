# 动效词汇表 · Motion Lexicon

把“那个感觉”说成专业术语。

这是一个无需构建步骤的静态 Web 动效词典，收录 239 个动效术语、16 个分类和 23 种可交互演示。每条术语都提供：

- 可重播或可操作的真实演示
- “含糊说法 → 专业说法”的需求表达
- CSS、WAAPI、GSAP、Framer Motion、Swift、Compose、Tailwind 写法切换
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
