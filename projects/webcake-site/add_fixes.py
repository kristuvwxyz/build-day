"""Add webcake-fixes.html into an exported .html page, right before </head>.

Usage:  python3 add_fixes.py my-page.html
Running it twice is safe: it replaces the old copy instead of adding a second one.
"""
import pathlib
import re
import sys

here = pathlib.Path(__file__).parent
fixes = (here / "webcake-fixes.html").read_text(encoding="utf-8").strip()
start, end = "<!-- ===== Webcake site fixes", "<!-- ===== end Webcake site fixes ===== -->"

for name in sys.argv[1:]:
    page = pathlib.Path(name)
    html = page.read_text(encoding="utf-8")
    html = re.sub(re.escape(start) + r".*?" + re.escape(end), "", html, flags=re.S)
    # Drop the old viewport tag so ours is the only one.
    html = re.sub(r"<meta[^>]+name=[\"']viewport[\"'][^>]*>", "", html, flags=re.I)
    if re.search(r"</head>", html, re.I):
        html = re.sub(r"</head>", fixes + "\n</head>", html, count=1, flags=re.I)
    else:
        html = fixes + "\n" + html
    page.write_text(html, encoding="utf-8")
    print(f"Updated {page}")
