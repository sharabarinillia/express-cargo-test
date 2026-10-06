"""Apply an ordered list of (english, dutch) replacements to a file; every pair must match."""
import sys

def translate(src, dst, pairs, extra_check=None):
    s = open(src, encoding='utf-8').read()
    missing = []
    for en, nl in pairs:
        if en not in s:
            missing.append(en)
            continue
        s = s.replace(en, nl)
    if missing:
        print(f'{src}: {len(missing)} strings not found:')
        for m in missing:
            print('   ', repr(m[:90]))
        sys.exit(1)
    open(dst, 'w', encoding='utf-8').write(s)
    print(f'wrote {dst} ({len(pairs)} replacements)')
