// Builds the standalone app from the same source as the claude.ai version (projects/business-os/index.html).
// Run: node build.mjs   (Vercel runs this automatically on every deploy)
import { readFileSync, writeFileSync, copyFileSync } from "fs";
const SRC = new URL("../business-os/", import.meta.url), OUT = new URL("./public/", import.meta.url);
const app = readFileSync(new URL("index.html", SRC), "utf8");
const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
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
writeFileSync(new URL("index.html", OUT), head + app + "\n</body>\n</html>\n");
for (const f of ["website-reviews.json", "jnt-address.json"]) copyFileSync(new URL(f, SRC), new URL(f, OUT));
console.log("Built public/index.html from business-os/index.html");
