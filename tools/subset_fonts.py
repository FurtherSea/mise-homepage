#!/usr/bin/env python3
"""Subset Resource Han Rounded CN for this website.

Chinese text only renders in the bundled font if its characters are in the subset, so rerun this whenever new
Chinese text goes on a page. It scans every HTML file for Chinese characters and writes, in assets/fonts:

- rhr-zh-400/500/700.woff2: every Chinese character on the site, for the Chinese pages.
- rhr-core-400/700.woff2: only 中文食序, so English pages stay light.

Usage:
    python3 -I tools/subset_fonts.py <dir with ResourceHanRoundedCN-*.ttf>

Needs fontTools and brotli (pip install fonttools brotli). The app's bundled fonts work as the source
(mise/Resources/Fonts in the mise-app repo), or the full ones from the Resource Han Rounded release
(CN, 0.990): https://github.com/CyanoHao/Resource-Han-Rounded
"""

import pathlib
import re
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "assets" / "fonts"
CJK = re.compile(r"[　-〿一-鿿＀-￯]")
CORE = "中文食序"
WEIGHTS = {400: "Regular", 500: "Medium", 700: "Bold"}
CORE_WEIGHTS = (400, 700)


def site_characters():
    chars = set()
    for page in ROOT.rglob("*.html"):
        chars.update(CJK.findall(page.read_text(encoding="utf-8")))
    return chars


def write_subset(source, characters, target):
    font = TTFont(source)
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["kern", "palt", "halt", "chws", "locl", "ccmp"]
    options.hinting = False
    options.notdef_outline = True
    options.name_IDs = ["*"]
    subsetter = subset.Subsetter(options)
    subsetter.populate(text="".join(sorted(characters)))
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(target)
    print(f"{target.name}: {len(characters)} characters, {target.stat().st_size // 1024} KB")


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    source_dir = pathlib.Path(sys.argv[1])
    chars = site_characters()

    missing = set(chars)
    for weight, name in WEIGHTS.items():
        source = source_dir / f"ResourceHanRoundedCN-{name}.ttf"
        missing &= {c for c in chars if ord(c) not in TTFont(source).getBestCmap()}
        write_subset(source, chars, OUTPUT / f"rhr-zh-{weight}.woff2")
    for weight in CORE_WEIGHTS:
        source = source_dir / f"ResourceHanRoundedCN-{WEIGHTS[weight]}.ttf"
        write_subset(source, set(CORE), OUTPUT / f"rhr-core-{weight}.woff2")
    if missing:
        print("Not in the source font, so they fall back to the system font:", "".join(sorted(missing)))


if __name__ == "__main__":
    main()
