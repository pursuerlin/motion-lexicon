# assets/fonts 来源与授权

这里放的都是**子集化后的自托管字体**，由 `python3 fonts.py` 生成（重建会重写 `fonts.css`）。

| 家族 | 字面 | 来源 |
| --- | --- | --- |
| Fraunces（含 italic） | 460 / 600 / italic 420 / italic 560 | google/fonts 变量字体，本地实例化到该字重后子集化 |
| Roboto | 400 / 500 / 700 | 同上 |
| Roboto Mono | 400 / 500 | 同上 |
| Noto Serif SC | 560 / 700，按 unicode-range 分片 | Google Fonts 的 `text=` 服务端子集 |

四个家族都在 **SIL Open Font License 1.1** 下（正文见同目录 `OFL.txt`，各家族版权行不同，
完整上游署名分别为 fraunces / notofonts / roboto 在 google/fonts 仓库里的 METADATA.pb）。
OFL 允许再分发与修改（含子集化），条件是：

- 不再使用保留字型名（Reserved Font Name）单独署名 —— 这里的文件不改家族名，
  `fonts.css` 里的 `font-family` 与上游一致，且仅本站内部使用；
- 随字体提供许可证 —— 即本目录的 `OFL.txt` 与本文件；
- 修改版不得自称原版：`fonts.py` 生成的是子集（字形数远少于原版），
  需要重新生成时以 `--force` 走同一流程，不要手工替换 woff2。

字符集取自本站真实文本（`index.html` + `assets/*.js` 的字符串字面量 + CSS `content`），
所以新增文案后要重跑 `python3 fonts.py`；`fonts.py` 会在有字却无字面覆盖时报错。
`↻ ⌕ ✗ ⋮ 🎉` 五个字形四个源字体本身都没有，一直落到系统字体，脚本里已作为例外记录。
