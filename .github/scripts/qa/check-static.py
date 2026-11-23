#!/usr/bin/env python3
"""Validate tracked site resources and JavaScript without contacting any backend."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[3]
files = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).decode().split("\0")
errors = []
references = 0


class Resources(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.source = source

    def handle_starttag(self, tag, attrs):
        global references
        for key, value in attrs:
            if key not in ("href", "src", "poster") or not value:
                continue
            url = urlsplit(value)
            if url.scheme or url.netloc or not url.path:
                continue
            references += 1
            target = ROOT / unquote(url.path.lstrip("/")) if url.path.startswith("/") else self.source.parent / unquote(url.path)
            target = target.resolve()
            if not target.is_relative_to(ROOT):
                errors.append(f"{self.source.relative_to(ROOT)}: reference leaves site root")
            elif not target.exists():
                errors.append(f"{self.source.relative_to(ROOT)}: missing {url.path}")


for name in filter(None, files):
    source = ROOT / name
    if source.suffix == ".html":
        Resources(source).feed(source.read_text(encoding="utf-8"))
    elif source.suffix in (".js", ".cjs"):
        result = subprocess.run(["node", "--check", str(source)], capture_output=True, text=True)
        if result.returncode:
            errors.append(f"{name}: invalid JavaScript\n{result.stderr}")
ET.parse(ROOT / "sitemap.xml")
if errors:
    print("\n".join(errors), file=sys.stderr)
    sys.exit(1)
print(f"Static checks passed: {sum(x.endswith('.html') for x in files)} HTML files, {references} local resources, JavaScript syntax, sitemap XML")
