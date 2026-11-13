#!/usr/bin/env python3
"""Copy only public SiteWorksStudio pages and assets from the existing Tuqo deployment."""
from pathlib import Path
from urllib.request import Request, urlopen
import re
import time
import sys

BASE = "https://siteworksstudio.tuqo.app/"
FILES = [
    "index.html", "services.html", "portfolio.html", "order.html", "about.html",
    "favicon.ico", "assets/css/styles.css",
    "assets/js/brief.js", "assets/js/config.js", "assets/js/portfolio.js",
    "assets/js/project-guide.js", "assets/js/site.js", "assets/js/theme-init.js",
    "assets/img/favicon-16.png", "assets/img/favicon-180.png",
    "assets/img/favicon-32.png", "assets/img/siteworksstudio-logo.png",
    "assets/img/og-siteworksstudio.jpg",
]
REPO_ROOT = Path(__file__).resolve().parents[2]

def download(path):
    url = BASE + path
    for attempt in range(3):
        try:
            req = Request(url, headers={"User-Agent": "Mozilla/5.0 SiteWorksStudio-Migration/1.0", "Accept": "*/*"})
            with urlopen(req, timeout=30) as res:
                if res.status != 200:
                    raise RuntimeError(f"{path}: HTTP {res.status}")
                body = res.read()
                if not body:
                    raise RuntimeError(f"{path}: empty response")
                if path.endswith(".png") and not body.startswith(b"\x89PNG\r\n\x1a\n"):
                    raise RuntimeError(f"{path}: not PNG")
                if path.endswith(".jpg") and not body.startswith(b"\xff\xd8"):
                    raise RuntimeError(f"{path}: not JPEG")
                if path.endswith(".html") and not body.lstrip().lower().startswith((b"<!doctype html", b"<html")):
                    raise RuntimeError(f"{path}: unexpected HTML")
                return body
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 + attempt)
    raise RuntimeError(f"{path}: download failed")

def fix_text(path, text):
    text = text.replace("https://siteworksstudio.pages.dev/", "https://siteworksstudio.ru/")
    if path.endswith(".html"):
        # Tuqo injects an advertising badge in served HTML; remove only that injected widget.
        text = re.sub(r'<a\b[^>]*class=["\x27]tqf["\x27][^>]*>.*?</a>', "", text, flags=re.S | re.I)
        text = text.replace("https://siteworksstudio.tuqo.app/assets/img/og-siteworksstudio.jpg",
                            "https://siteworksstudio.ru/assets/img/og-siteworksstudio.jpg")
        text = text.replace("Сайт + CRM", "Сайт + OS")
        text = text.replace("Telegram-уведомлениями и сохранением заявок в CRM",
                            "формой заявки и отдельным приложением SiteWorksStudio OS")
    if path == "assets/js/brief.js":
        if "https://api.tuqo.ru/f/4af18e65-6855-4477-8a5e-6092e18ca762" not in text:
            raise RuntimeError("Safe external form endpoint missing; stopping import")
        text = text.replace(
            "The existing Cloudflare Telegram/CRM backend is kept unchanged for the original domain.",
            "SiteWorksStudio OS remains a separate application; no private API keys are in this file."
        )
    return text

for path in FILES:
    data = download(path)
    if path.endswith((".html", ".css", ".js")):
        data = fix_text(path, data.decode("utf-8")).encode("utf-8")
        # Prevent accidental publishing of secrets in public files.
        if re.search(rb"(SUPABASE_SERVICE_ROLE_KEY|CLOUDFLARE_API_TOKEN|TELEGRAM_BOT_TOKEN|BEGIN PRIVATE KEY|SWS_OS_BOT_TOKEN)", data, flags=re.I):
            raise RuntimeError(f"Potential private secret identifier in {path}; stopping")
    target = REPO_ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    print(f"imported {path}: {len(data)} bytes")

(REPO_ROOT / "robots.txt").write_text(
    "User-agent: *\nAllow: /\nSitemap: https://siteworksstudio.ru/sitemap.xml\n", encoding="utf-8"
)
(REPO_ROOT / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join(f'  <url><loc>https://siteworksstudio.ru/{"" if x == "index.html" else x}</loc></url>\n'
              for x in ["index.html", "services.html", "portfolio.html", "about.html", "order.html"])
    + "</urlset>\n", encoding="utf-8"
)
(REPO_ROOT / ".nojekyll").write_text("", encoding="utf-8")
(REPO_ROOT / "404.html").write_text(
    '<!doctype html><html lang="ru"><head><meta charset="utf-8">'
    '<meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1">'
    '<title>Страница не найдена — SiteWorksStudio</title>'
    '<link rel="stylesheet" href="assets/css/styles.css"></head>'
    '<body><main style="max-width:680px;margin:15vh auto;padding:24px;text-align:center">'
    '<h1>404 — Страница не найдена</h1>'
    '<p>Похоже, ссылка устарела.</p>'
    '<a href="index.html">На главную SiteWorksStudio</a></main></body></html>', encoding="utf-8"
)
(REPO_ROOT / "README.md").write_text(
    "# SiteWorksStudio\n\n"
    "Публичный статический сайт SiteWorksStudio. CRM, серверные функции и секреты сюда не загружаются.\n\n"
    "Публикация: GitHub → Settings → Pages → Deploy from a branch → main → / (root).\n\n"
    "Домен siteworksstudio.ru переключать на GitHub Pages только после проверки временного адреса.\n\n"
    "Форма заказов использует отдельный endpoint Tuqo Forms; реальную доставку заявки необходимо проверить.\n\n"
    "SiteWorksStudio OS работает отдельно: https://siteworksstudio-os-layero-free.layero.app/\n", encoding="utf-8"
)
if (REPO_ROOT / "CNAME").exists():
    raise RuntimeError("Refusing to overwrite a pre-existing custom-domain configuration")
if (REPO_ROOT / "admin.html").exists() or (REPO_ROOT / "functions").exists():
    raise RuntimeError("Unexpected server/admin files in public repository")
print("Public SiteWorksStudio snapshot ready. DNS and CNAME are untouched.")
