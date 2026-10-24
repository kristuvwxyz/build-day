#!/usr/bin/env python3
"""Builds RS OS for Cloudflare Pages (no Node needed): python3 cloudflare/build_pages.py

Same output as build.mjs (public/index.html, build.txt, site-addons.js) plus the Pages worker:
  dist/                 static files (RS OS app, soldout.js, site-addons.js, icons, email gif...)
  dist/_worker.js/      index.js (router + Vercel-style req/res) and api/*.js (unchanged logic)
  dist/_routes.json     only /api/* and /img/* run the worker; everything else is a free static file
  dist/_headers         the headers vercel.json used to set
  rs-os-pages.zip       upload this in Cloudflare → Workers & Pages → regal-spritz-os → Create deployment
"""
import hashlib, json, os, re, shutil, zipfile
from pathlib import Path

APP = Path(__file__).resolve().parent.parent          # projects/business-os-app
SRC = APP.parent / "business-os"                      # projects/business-os (RS OS source)
PUB, OUT = APP / "public", APP / "cloudflare" / "dist"
OLD_HOST, NEW_HOST = "https://regal-spritz-os.vercel.app", "https://os.regalspritz.com"

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#4A2545">
<meta name="description" content="Regal Spritz PH team workspace: orders, tasks, attendance and more.">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/icons/icon-192.png">
<link rel="apple-touch-icon" href="/icons/icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Regal Spritz">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="/shim.js"></script>
</head>
<body>
"""

def web_api(t):
    """Node Buffer / crypto → Web APIs, so the worker runs without the nodejs_compat flag."""
    if 'from "crypto"' in t:
        t = t.replace('import { createHash } from "crypto";', 'import { b64, sha256hex } from "./_web.js";')
        t = t.replace('createHash("sha256").update(buf).digest("hex")', '(await sha256hex(buf))')
    t = re.sub(r'Buffer\.from\(([^()]+?), "base64"\)', r'b64(\1)', t)
    t = t.replace("Buffer.from(await r.arrayBuffer())", "new Uint8Array(await r.arrayBuffer())")
    t = t.replace('Buffer.from(MAYA + ":").toString("base64")', 'btoa(MAYA + ":")')
    if re.search(r"\bBuffer\b|createHash", t): raise SystemExit("Node API left in an api file")
    if "b64(" in t and "_web.js" not in t: t = 'import { b64 } from "./_web.js";\n' + t
    return t

def build():
    if OUT.exists(): shutil.rmtree(OUT)
    shutil.copytree(PUB, OUT, ignore=shutil.ignore_patterns("index.html", "build.txt", "site-addons.js"))
    app = (SRC / "index.html").read_text(encoding="utf8")
    shim = (PUB / "shim.js").read_text(encoding="utf8")
    build_id = hashlib.sha256((app + shim).encode("utf8")).hexdigest()[:12]
    page = HEAD.replace("<head>\n", f'<head>\n<meta name="rs-build" content="{build_id}">\n', 1) + app + "\n</body>\n</html>\n"
    (OUT / "index.html").write_text(page.replace(OLD_HOST, NEW_HOST), encoding="utf8")
    (OUT / "build.txt").write_text(build_id + "\n", encoding="utf8")
    for f in ("website-reviews.json", "jnt-address.json"): shutil.copy(SRC / f, OUT / f)

    # site-addons.js, same bundling as build.mjs
    parts = []
    for f in sorted(p for p in (APP / "site-addons").iterdir() if p.suffix == ".html"):
        h = f.read_text(encoding="utf8")
        css = "\n".join(re.findall(r"<style[^>]*>([\s\S]*?)</style>", h, re.I))
        js = "\n".join(re.findall(r"<script[^>]*>([\s\S]*?)</script>", h, re.I))
        part = f"/* {f.name} */\n"
        if css.strip(): part += f"addCss({json.dumps(css, ensure_ascii=False)});\n"
        if js.strip(): part += f'try {{\n{js}\n}} catch (e) {{ console.error("site add-on {f.name}", e); }}\n'
        parts.append(part)
    addons = ("/* Regal Spritz website add-ons, built from projects/business-os-app/site-addons. Don't edit here. */\n(function () {\n"
              "  if (window.__rsSiteAddons) return; window.__rsSiteAddons = true;\n"
              '  function addCss(t) { var s = document.createElement("style"); s.textContent = t; (document.head || document.documentElement).appendChild(s); }\n'
              + "\n".join(parts) + "\n})();\n")
    (OUT / "site-addons.js").write_text(addons.replace(OLD_HOST, NEW_HOST), encoding="utf8")

    # worker: router + the api files (Node "crypto" → "node:crypto"; old host → new host)
    w = OUT / "_worker.js"; (w / "api").mkdir(parents=True)
    shutil.copy(APP / "cloudflare" / "worker-index.js", w / "index.js")
    shutil.copy(APP / "cloudflare" / "web-helpers.js", w / "api" / "_web.js")
    for f in (APP / "api").glob("*.js"):
        t = web_api(f.read_text(encoding="utf8")).replace(OLD_HOST, NEW_HOST)
        (w / "api" / f.name).write_text(t, encoding="utf8")
    (OUT / "_routes.json").write_text(json.dumps({"version": 1, "include": ["/api/*", "/img/*"], "exclude": []}), encoding="utf8")
    (OUT / "_headers").write_text("""/soldout.js
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
  Content-Type: application/javascript; charset=utf-8
/site-addons.js
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=300
  Content-Type: application/javascript; charset=utf-8
/sw.js
  Cache-Control: no-cache
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
""", encoding="utf8")

    z = APP / "cloudflare" / "rs-os-pages.zip"
    with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in sorted(OUT.rglob("*")):
            if p.is_file(): zf.write(p, p.relative_to(OUT).as_posix())
    print("Built", OUT, "build", build_id, "zip", z, round(z.stat().st_size / 1e6, 2), "MB")

if __name__ == "__main__":
    build()
