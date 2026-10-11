// Fast copy of the website's product list (the same products.js the Apps Script backend makes), served from Vercel's CDN.
// Apps Script is slow to answer (often 1-3 s, more when it wakes up), so regalspritz.com loads this instead:
//   https://regal-spritz-os.vercel.app/api/products
// The CDN answers at once and refreshes in the background, so a listing edit shows within about 15 seconds.
// Public on purpose (it is the public product list); no keys, no customer data.
// Before sending, every piece is checked against live RS OS stock: on-hand pieces with stock 0 are left out and
// sold-out pre-orders are marked soldOut: true, even if the backend copy is a little behind.
import { liveStock, applyStock } from "./_stock.js";
const DEFAULT_URL = "https://script.google.com/macros/s/AKfycbz7R17lKloaq_VaFMK-nDge-9AUXNFmNgaH7WZr2gWJjxRLMn1hEa6HubmeaDbaPzdU4g/exec";
let last = { body: "", type: "", at: 0 };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET" && req.method !== "HEAD") return res.status(405).send("GET only");
  try {
    const r = await fetch((process.env.RS_BACKEND_URL || DEFAULT_URL) + "?action=products.js", { redirect: "follow" });
    const body = await r.text();
    if (!r.ok || body.length < 20) throw new Error("backend " + r.status);
    last = { body, type: (r.headers.get("content-type") || "application/javascript").split(";")[0], at: Date.now() };
  } catch (e) {
    // Backend down or slow: keep the site working with the last good copy.
    if (!last.body) { res.setHeader("Cache-Control", "no-store"); return res.status(502).send("/* product list unavailable */"); }
  }
  let out = last.body;
  try {
    const map = await liveStock();
    const m = map && map.size > 50 && /RS_PRODUCTS\s*=\s*\[/.exec(out);
    if (m) {
      const start = m.index + m[0].length - 1, { list, end } = readArray(out, start);
      if (list) out = out.slice(0, start) + JSON.stringify(applyStock(list, map)) + out.slice(end);
    }
  } catch (e) { /* stock check failed: send the backend copy as is */ }
  res.setHeader("Content-Type", (/json/.test(last.type) ? "application/json" : "application/javascript") + "; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=15, stale-while-revalidate=86400, stale-if-error=86400");
  return res.status(200).send(out);
}

// Reads the JSON array that starts at body[start] ("["); returns the list and where it ends.
function readArray(body, start) {
  let depth = 0, str = false;
  for (let i = start; i < body.length; i++) {
    const c = body[i];
    if (str) { if (c === "\\") i++; else if (c === '"') str = false; continue; }
    if (c === '"') str = true; else if (c === "[" || c === "{") depth++;
    else if ((c === "]" || c === "}") && --depth === 0) return { list: JSON.parse(body.slice(start, i + 1)), end: i + 1 };
  }
  return { list: null, end: start };
}
