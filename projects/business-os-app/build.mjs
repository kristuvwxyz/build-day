// Builds the standalone app from the same source as the claude.ai version (projects/business-os/index.html).
// Run: node build.mjs   (Vercel runs this automatically on every deploy)
import { readFileSync, writeFileSync, copyFileSync } from "fs";
import { createHash } from "crypto";
const SRC = new URL("../business-os/", import.meta.url), OUT = new URL("./public/", import.meta.url);
const app = readFileSync(new URL("index.html", SRC), "utf8");
const head = `<!doctype html>
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
`;
// Version stamp: the open app checks /build.txt and loads the new version when it changes (it keeps the page you're on).
const BUILD = createHash("sha256").update(app + readFileSync(new URL("./public/shim.js", import.meta.url), "utf8")).digest("hex").slice(0, 12);
writeFileSync(new URL("index.html", OUT), head.replace("<head>\n", `<head>\n<meta name="rs-build" content="${BUILD}">\n`) + app + "\n</body>\n</html>\n");
writeFileSync(new URL("build.txt", OUT), BUILD + "\n");
for (const f of ["website-reviews.json", "jnt-address.json"]) copyFileSync(new URL(f, SRC), new URL(f, OUT));
console.log("Built public/index.html from business-os/index.html");

// Website add-ons for regalspritz.com: every site-addons/*.html (style + script) bundled into public/site-addons.js.
// WebCake loads that one file, so website fixes ship by pushing to main.
import { readdirSync } from "fs";
const ADD = new URL("./site-addons/", import.meta.url);
const parts = readdirSync(ADD).filter(f => f.endsWith(".html")).sort().map(f => {
  const h = readFileSync(new URL(f, ADD), "utf8");
  const css = [...h.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join("\n");
  const js = [...h.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).join("\n");
  return `/* ${f} */\n` + (css.trim() ? `addCss(${JSON.stringify(css)});\n` : "") + (js.trim() ? `try {\n${js}\n} catch (e) { console.error("site add-on ${f}", e); }\n` : "");
});
writeFileSync(new URL("site-addons.js", OUT), `/* Regal Spritz website add-ons, built from projects/business-os-app/site-addons. Don't edit here. */
(function () {
  if (window.__rsSiteAddons) return; window.__rsSiteAddons = true;
  function addCss(t) { var s = document.createElement("style"); s.textContent = t; (document.head || document.documentElement).appendChild(s); }
${parts.join("\n")}
})();
`);
console.log("Built public/site-addons.js from " + parts.length + " add-ons");
