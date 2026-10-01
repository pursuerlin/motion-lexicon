#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""动效词汇表自检：没有构建步骤，所以把"改坏了要能当场发现"做成脚本。

用法：python3 check.sh          （全量）
      python3 check.sh l10n     （只跑某一项：js / assets / l10n / ver）
每项失败都会列出具体位置，退出码非 0。
"""
import json, os, re, subprocess, sys, glob

ROOT = os.path.dirname(os.path.abspath(__file__))
fails, notes = [], []


def rel(p):
    return os.path.relpath(p, ROOT)


def check_js():
    for f in sorted(glob.glob(os.path.join(ROOT, 'assets/*.js')) + [os.path.join(ROOT, 'index.html')]):
        if f.endswith('.html'):
            continue
        r = subprocess.run(['node', '--check', f], capture_output=True, text=True)
        if r.returncode:
            fails.append('JS 语法: %s\n%s' % (rel(f), r.stderr.strip()[:400]))


def collect_js_string_literals(path):
    s = open(path, encoding='utf-8').read()
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.S)
    s = re.sub(r'^[ \t]*//.*$', '', s, flags=re.M)
    return re.findall(r"'((?:[^'\\\n]|\\.)*)'", s)


def check_assets():
    """引用了但不存在的文件 = 404；存在但零引用 = 白发的字节。
       图片名大多是 'assets/img/' + 数组项 拼出来的，所以判"有没有被引用"必须按
       文件名在源码里查；按完整路径查会把这些全部误判成孤儿。"""
    html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    src = html + ''.join(open(f, encoding='utf-8').read()
                         for f in glob.glob(os.path.join(ROOT, 'assets/*.js'))
                         + glob.glob(os.path.join(ROOT, 'assets/**/*.css'), recursive=True))
    refs = set()
    for m in re.findall(r'assets/[A-Za-z0-9._/\u4e00-\u9fff-]+', src):
        refs.add(m.split('?')[0])
    for r in sorted(refs):
        if not os.path.exists(os.path.join(ROOT, r)):
            fails.append('引用了但不存在: %s' % r)
    for real in sorted(glob.glob(os.path.join(ROOT, 'assets/**/*'), recursive=True)):
        if os.path.isdir(real):
            continue
        base = rel(real)
        if base.endswith('.js') or base.endswith('.css'):
            continue
        if os.path.basename(real).startswith('.'):
            continue
        # 许可证/署名文件本来就不该被页面引用，不是孤儿
        if os.path.basename(base) in ('OFL.txt', 'NOTICE.md', 'ATTRIBUTION.md', 'CREDITS.json', 'README.md'):
            continue
        if os.path.basename(base) not in src:
            notes.append('零引用（可删或确认是否留作素材）: %s (%d B)' % (base, os.path.getsize(real)))


def label_keys():
    i = open(os.path.join(ROOT, 'assets/i18n.js'), encoding='utf-8').read()
    seg = i[i.index('const LABEL = {'):i.index('/* 分类名已有权威表')]
    pairs = re.findall(r"'([^']+)':\s*'([^']*)'", seg)
    seen, dup = set(), set()
    for k, v in pairs:
        if k in seen:
            dup.add(k)
        seen.add(k)
        if re.search(r'[\u4e00-\u9fff]', v):
            fails.append('LABEL 的英文值里还有中文: %s -> %s' % (k, v))
    if dup:
        fails.append('LABEL 有重复 key（后一条会静默覆盖前一条）: %s' % ', '.join(sorted(dup)[:10]))
    return seen


def check_l10n():
    """每个 data-l10n 的原文都必须在 LABEL 里有英文，否则 EN 模式下静默漏中文。"""
    keys = label_keys()
    html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    sites = {}
    for f in glob.glob(os.path.join(ROOT, 'assets/*.js')):
        for lit in collect_js_string_literals(f):
            for m in re.finditer(r'data-l10n="([^"]*)', lit):
                sites.setdefault(m.group(1), []).append(rel(f))
        for m in re.finditer(r'data-l10n="([^"]*)"', open(f, encoding='utf-8').read()):
            sites.setdefault(m.group(1), []).append(rel(f))
    for m in re.finditer(r'data-l10n="([^"]*)"', html):
        sites.setdefault(m.group(1), []).append('index.html')
    # 模板里是 ' + esc(x) + ' 拼出来的，静态扫不到，只能靠运行时门禁
    dynamic = sum(1 for k in sites if '+' in k or k == '')
    missing = {k: v for k, v in sites.items() if k and '+' not in k and k not in keys}
    if missing:
        for k, v in sorted(missing.items())[:20]:
            fails.append('缺英文词条 data-l10n="%s"  出现于 %s' % (k, ', '.join(sorted(set(v))[:3])))
    print('  LABEL 词条 %d 个；静态可核对的挂载点 %d 个（另有 %d 处由模板拼接，需浏览器门禁兜住）'
          % (len(keys), len(sites) - dynamic, dynamic))


def check_ver():
    """?v 必须全站一致：不一致说明改了文件却忘了抬版本号，会被缓存吃掉。"""
    html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    pairs = re.findall(r'(assets/[^"?]+)\?v=(\d+)', html)
    vers = {v for _, v in pairs}
    print('  %d 个带 ?v 的引用，版本集合 %s' % (len(pairs), sorted(vers)))
    if len(vers) > 1:
        fails.append('?v 不一致: %s（同一批发布应共用一个版本号）' % sorted(vers))
    newest = max(((os.path.getmtime(f), f) for f in glob.glob(os.path.join(ROOT, 'assets/*.js'))
                  + glob.glob(os.path.join(ROOT, 'assets/*.css'))))
    refs_in_html = [b for b in os.listdir(os.path.join(ROOT, 'assets/img'))
                    if b.lower().endswith(('.jpg', '.png', '.webp', '.gif')) and b in html]
    unversioned = [b for b in refs_in_html if '?v=' not in html.split(b, 1)[1][:12]]
    if unversioned:
        notes.append('图片引用没有 ?v（内容若原地覆盖会被缓存黏住）: %s' % ', '.join(unversioned[:5]))
    print('  最近改动: %s' % rel(newest[1]))


CHECKS = {'js': check_js, 'assets': check_assets, 'l10n': check_l10n, 'ver': check_ver}
for name in (sys.argv[1:] or CHECKS.keys()):
    if name not in CHECKS:
        print('未知项: %s（可选 %s）' % (name, ' '.join(CHECKS)))
        sys.exit(2)
    print('[%s]' % name)
    CHECKS[name]()

for n in notes:
    print('  提示: %s' % n)
if fails:
    print('\n%d 项失败:' % len(fails))
    for f in fails:
        print('  - %s' % f)
    sys.exit(1)
print('\n全部通过')
