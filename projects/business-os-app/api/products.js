// Fast copy of the website's product list (the same products.js the Apps Script backend makes), served from Vercel's CDN.
// Apps Script is slow to answer (often 1-3 s, more when it wakes up), so regalspritz.com loads this instead:
//   https://regal-spritz-os.vercel.app/api/products
// The CDN answers at once and refreshes in the background, so a listing edit shows within about 15 seconds.
// Public on purpose (it is the public product list); no keys, no customer data.
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
  res.setHeader("Content-Type", (/json/.test(last.type) ? "application/json" : "application/javascript") + "; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=15, stale-while-revalidate=86400, stale-if-error=86400");
  return res.status(200).send(last.body);
}
