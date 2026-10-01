#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""重建 assets/fonts/：把站点真实文本用到的字符集子集化成自托管字体。

为什么不用 Google Fonts 链接：那个 CSS 本身 253KB（含 202 个 Noto 子集 @font-face），
跨域、渲染阻塞，在中国大陆不可达时首屏字体会整体退化。

取源两条路：
  拉丁（Fraunces / Roboto / Roboto Mono）：从 google/fonts 的变量字体本地实例化再子集化，
    这样能精确拿到 CSS 声明的字重（460/560/600/420…），不改变浏览器的字体匹配结果。
  中文（Noto Serif SC）：用 Google 的 text= 服务端子集化，按字重 + unicode-range 分片。
    单次请求超过约 600 字它会退化成完整分发，所以这里按 430 字切块。

用法：
  python3 fonts.py          补缺失的文件 + 重写 fonts.css + 覆盖率校验
  python3 fonts.py --check  只校验，不下载不生成
  python3 fonts.py --force  全部重做（需要 src/*.ttf，见 SOURCES）

依赖：fontTools + brotli（本机在 miniforge 的 LLMenv 里：
  /Users/linhuangjie/miniforge3/envs/LLMenv/bin/python3 fonts.py）
"""
import hashlib, os, re, subprocess, sys, urllib.parse

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'assets', 'fonts')
UA = 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
FEATS = 'kern,liga,calt,ccmp,tnum,locl,rlig,mark,mkmk'      # tnum：HUD 的 tabular-nums 要用
CHUNK = 430
NOTO_WEIGHTS = ['560', '700']
SRC_DIR = os.environ.get('FONTSRC', '/tmp/lexicon/src')
# (family, style, weight, 输出文件, 源变量字体, 要钉住的轴, unicode-range 或 None)
LATEX = [
    ('Fraunces', 'normal', 460, 'fraunces-460.woff2', 'Fraunces.ttf', 'SOFT=0 WONK=0 wght=460'),
    ('Fraunces', 'normal', 600, 'fraunces-600.woff2', 'Fraunces.ttf', 'SOFT=0 WONK=0 wght=600'),
    ('Fraunces', 'italic', 420, 'fraunces-italic-420.woff2', 'Fraunces-Italic.ttf', 'SOFT=0 WONK=0 wght=420'),
    ('Fraunces', 'italic', 560, 'fraunces-italic-560.woff2', 'Fraunces-Italic.ttf', 'SOFT=0 WONK=0 wght=560'),
    ('Roboto', 'normal', 400, 'roboto-400.woff2', 'Roboto.ttf', 'wdth=100 wght=400'),
    ('Roboto', 'normal', 500, 'roboto-500.woff2', 'Roboto.ttf', 'wdth=100 wght=500'),
    ('Roboto', 'normal', 700, 'roboto-700.woff2', 'Roboto.ttf', 'wdth=100 wght=700'),
    ('Roboto Mono', 'normal', 400, 'roboto-mono-400.woff2', 'RobotoMono.ttf', 'wght=400'),
    ('Roboto Mono', 'normal', 500, 'roboto-mono-500.woff2', 'RobotoMono.ttf', 'wght=500'),
]
SOURCES = {
    'Fraunces.ttf': 'ofl/fraunces/Fraunces%5BSOFT,WONK,opsz,wght%5D.ttf',
    'Fraunces-Italic.ttf': 'ofl/fraunces/Fraunces-Italic%5BSOFT,WONK,opsz,wght%5D.ttf',
    'Roboto.ttf': 'ofl/roboto/Roboto%5Bwdth,wght%5D.ttf',
    'RobotoMono.ttf': 'ofl/robotomono/RobotoMono%5Bwght%5D.ttf',
}
BASE = 'https://raw.githubusercontent.com/google/fonts/main/'
# 这 5 个字形 Fraunces / Noto Serif SC / Roboto / Roboto Mono 四个源字体都没有，
# 用 Google 链接时同样落到系统字体——所以不算覆盖缺口（新增缺字仍会红）。
SYSTEM_FALLBACK = '↻⌕✗⋮🎉'
fails = []


def sh(args):
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit('命令失败: %s\n%s' % (' '.join(args[1:4]), r.stderr[-500:]))


def curl(args):
    return subprocess.run(['curl'] + args, capture_output=True)


def charset():
    """站点会渲染的字符 = index.html + JS 字符串字面量 + CSS content，注释除外。"""
    chars = set()
    for f in sorted(os.listdir(os.path.join(ROOT, 'assets'))):
        if not f.endswith('.js'):
            continue
        s = open(os.path.join(ROOT, 'assets', f), encoding='utf-8').read()
        s = re.sub(r'/\*.*?\*/', '', s, flags=re.S)
        s = re.sub(r'^[ \t]*//.*$', '', s, flags=re.M)
        for lit in re.findall(r"'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"|`((?:[^`\\]|\\.)*)`", s):
            chars |= set(''.join(x for x in lit if x))
    h = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    chars |= set(re.sub(r'<!--.*?-->', '', h, flags=re.S))
    for css in ('styles.css', 'hud.css'):
        s = open(os.path.join(ROOT, 'assets', css), encoding='utf-8').read()
        chars |= set(''.join(re.findall(r"content:\s*'([^']*)'", s)))
    return {c for c in chars if c != '\n'}


def rng_str(cps):
    cps = sorted(cps)
    parts, s, prev = [], cps[0], cps[0]
    for c in cps[1:]:
        if c == prev + 1:
            prev = c
            continue
        parts.append('U+%X' % s if s == prev else 'U+%X-%X' % (s, prev))
        s = prev = c
    parts.append('U+%X' % s if s == prev else 'U+%X-%X' % (s, prev))
    return ','.join(parts)


def parse_faces(body):
    out = []
    for blk in re.findall(r"@font-face \{(.*?)\n\}", body, re.S):
        m = re.search(r'url\((.*?)\)', blk)
        if not m:
            continue
        cps = set()
        ur = re.search(r'unicode-range: ([^;]+);', blk)
        for part in (ur.group(1).split(',') if ur else []):
            part = part.strip().lstrip('U+')
            if '-' in part:
                a, b = part.split('-', 1)
                cps |= set(range(int(a, 16), int(b, 16) + 1))
            elif part:
                cps.add(int(part, 16))
        out.append((m.group(1), cps))
    return out


def build_latex(cs, force, reuse):
    from fontTools.ttLib import TTFont
    rows = []
    open(os.path.join(SRC_DIR, '.chars.txt'), 'w', encoding='utf-8').write(''.join(sorted(cs)))
    tfile = os.path.join(SRC_DIR, '.chars.txt')
    for fam, style, w, out, src, axes in LATEX:
        dst = os.path.join(OUT, out)
        if reuse and os.path.exists(dst):
            rows.append((fam, style, w, out, None))
            continue
        srcpath = os.path.join(SRC_DIR, src)
        if not os.path.exists(srcpath):
            fails.append('缺源字体 %s（下载：%s%s）' % (src, BASE, SOURCES[src]))
            continue
        inst = os.path.join(SRC_DIR, '.inst-%s-%d.ttf' % (src, w))
        sh([sys.executable, '-m', 'fontTools.varLib.instancer', srcpath] + axes.split() + ['-o', inst])
        sh([sys.executable, '-m', 'fontTools.subset', inst, '--text-file=' + tfile,
            '--flavor=woff2', '--layout-features=' + FEATS, '--ignore-missing-glyphs',
            '--name-IDs=1,2,3,4,6', '--output-file=' + dst])
        src_have = {chr(c) for c in TTFont(inst).getBestCmap()}
        got = {chr(c) for c in TTFont(dst).getBestCmap()}
        if (src_have & cs) - got:
            fails.append('%s 子集丢字: %s' % (out, ''.join(sorted(src_have & cs - got))[:20]))
        rows.append((fam, style, w, out, None))
    return rows


def build_noto(cs, reuse):
    rows, cjk = [], sorted(c for c in cs if ord(c) > 0x2000)
    for w in NOTO_WEIGHTS:
        covered = set()
        for ci in range(0, len(cjk), CHUNK):
            idx = ci // CHUNK
            existing = [os.path.join(OUT, 'noto-serif-sc-%s-c%d-%d.woff2' % (w, idx, k)) for k in (0, 1, 2)]
            if reuse and os.path.exists(existing[0]):
                for p in existing:
                    if os.path.exists(p):
                        rows.append(('Noto Serif SC', 'normal', int(w), os.path.basename(p), 'load'))
                        covered |= set(TTFont_cmap(p))
                continue
            chunk = cjk[ci:ci + CHUNK]
            url = ('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@%s&text=%s'
                   % (w, urllib.parse.quote(chunk)))
            body = curl(['-s', '-m', '40', '-A', UA, url]).stdout.decode('utf-8', 'replace')
            faces = parse_faces(body)
            if len(faces) > 8:
                fails.append('Noto w%s chunk%d 返回 %d 个字面：text= 被服务端忽略，请调小 CHUNK'
                             % (w, idx, len(faces)))
                break
            for k, (fu, cps) in enumerate(faces):
                name = 'noto-serif-sc-%s-c%d-%d.woff2' % (w, idx, k)
                data = curl(['-s', '-m', '60', fu]).stdout
                if len(data) < 800:
                    fails.append('%s 下载异常（%d B）' % (name, len(data)))
                    continue
                open(os.path.join(OUT, name), 'wb').write(data)
                rows.append(('Noto Serif SC', 'normal', int(w), name, cps))
                covered |= cps
            gap = {ord(c) for c in chunk} - covered
            if gap:
                fails.append('Noto w%s chunk%d 未覆盖: %s' % (w, idx, ''.join(sorted(map(chr, gap)))[:20]))
    return rows


def TTFont_cmap(path):
    from fontTools.ttLib import TTFont
    return TTFont(path).getBestCmap()


def main():
    check = '--check' in sys.argv
    force = '--force' in sys.argv
    reuse = not force and not check
    os.makedirs(OUT, exist_ok=True)
    cs = charset()
    if check:
        rows = []
        for f in sorted(os.listdir(OUT)):
            if not f.endswith('.woff2'):
                continue
            m = re.match(r'noto-serif-sc-(\d+)-c\d+-\d+\.woff2$', f)
            if m:
                rows.append(('Noto Serif SC', 'normal', int(m.group(1)), f, 'load'))
            else:
                for fam, style, w, out, _s, _a in LATEX:
                    if out == f:
                        rows.append((fam, style, w, f, None))
    else:
        rows = build_latex(cs, force, reuse) + build_noto(cs, reuse)

    entries, lines = [], []
    for fam, style, w, out, rng in rows:
        path = os.path.join(OUT, out)
        if not os.path.exists(path):
            fails.append('字体文件不存在: %s' % out)
            continue
        cps = set(TTFont_cmap(path))
        if rng == 'load':      # 复用已存在的中文分片：range 从 CSS 里读不回来，按字形实际码位当 range
            rng = cps
        h = hashlib.sha256(open(path, 'rb').read()).hexdigest()[:8]
        entries.append((fam, style, w, out, h, rng))
        src = "src:url('%s?v=%s') format('woff2')}" % (out, h)
        line = ("@font-face{font-family:'%s';font-style:%s;font-weight:%d;font-display:swap;"
                % (fam, style, w)) + src
        if rng:
            line = line[:-1] + ';unicode-range:%s}' % rng_str(rng)
        lines.append(line)

    covered = set()
    for fam, style, w, out, h, rng in entries:
        covered |= set(TTFont_cmap(os.path.join(OUT, out)))

    head = ('/* 自动生成，请勿手改：python3 fonts.py\n'
            '   字符集来自本仓真实文本（index.html + assets/*.js 字面量 + CSS content），\n'
            '   family/style/weight 与原 Google Fonts 请求一致，所以字体匹配结果不变。\n'
            '   中文按 unicode-range 分片，浏览器只下渲染需要的那几片；URL 带内容哈希，覆盖即失效。\n'
            '   缺字时 --disp 仍回落到 Songti SC / STSong，不会出豆腐块。 */\n')
    open(os.path.join(OUT, 'fonts.css'), 'w', encoding='utf-8').write(head + '\n'.join(lines) + '\n')

    miss = {ord(c) for c in cs} - covered - {ord(c) for c in SYSTEM_FALLBACK}
    print('fonts.css：%d 个字面；charset %d 字；未覆盖 %d%s'
          % (len(entries), len(cs), len(miss), ' → ' + ''.join(map(chr, miss))[:40] if miss else ''))
    if miss:
        fails.append('%d 个字符无字面覆盖: %s' % (len(miss), ''.join(map(chr, miss))[:40]))
    total = sum(os.path.getsize(os.path.join(OUT, e[3])) for e in entries)
    print('字体合计 %d B (%.0f KB)' % (total, total / 1024))
    if fails:
        for f in fails:
            print('  - %s' % f)
        sys.exit(1)
    print('OK')


main()
