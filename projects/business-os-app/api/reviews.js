// Reviews for regalspritz.com, live from RS OS (Admin / Marketing → Reviews). Supabase: supabase/reviews.sql.
// GET  /api/reviews        → {total, avg, list, by, at}   (list item: [id, handle, product, rating, date, author, title, body, pics, reply])
// GET  /api/reviews?js=1   → window.RS_REVIEWS = {...}    (drop-in for the website's old embedded reviews)
// POST /api/reviews {handle, product, customer, rating, title, text, anon, photos} → saved as "To approve" in RS OS.
//   photos: up to 3 {type:'image/jpeg', data:<base64>} → Supabase Storage bucket review-photos (supabase/review-photos.sql). email is ignored.
// CDN-cached ~10 s, so a review approved or hidden in RS OS shows on the website within seconds. No emails are kept.
const SITES = /^https:\/\/([a-z0-9-]+\.)*regalspritz\.com$/i;
import { createHash } from "crypto";
let last = null;

export default async function handler(req, res) {
  const SB = process.env.SUPABASE_URL, ANON = process.env.SUPABASE_ANON_KEY;
  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", req.method === "POST" ? (SITES.test(origin) ? origin : "https://www.regalspritz.com") : "*");
  if (req.method === "OPTIONS") { res.setHeader("Access-Control-Allow-Methods", "GET, POST"); res.setHeader("Access-Control-Allow-Headers", "Content-Type"); return res.status(204).end(); }
  if (!SB || !ANON) return res.status(503).json({ error: "Supabase isn't set up in Vercel yet." });
  const rpc = (fn, args) => fetch(`${SB}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: ANON, Authorization: "Bearer " + ANON, "Content-Type": "application/json" }, body: JSON.stringify(args || {}) });
  try {
    if (req.method === "POST") {
      res.setHeader("Cache-Control", "no-store");
      if (origin && !SITES.test(origin)) return res.status(403).json({ ok: false, error: "Not allowed." });
      let b = req.body; if (typeof b === "string") { try { b = JSON.parse(b || "{}"); } catch (e) { b = {}; } }
      b = b || {};
      if (b.website) return res.status(200).json({ ok: true });   // hidden honeypot field filled = a bot
      // Review photos: JPEG only, max 1 MB each, at most 3. Named by content, so the same photo twice is one file.
      const pics = [];
      for (const ph of (Array.isArray(b.photos) ? b.photos : []).slice(0, 3)) {
        try {
          const raw = String((ph && (ph.data || ph)) || "").replace(/^data:image\/jpeg;base64,/i, "");
          const buf = Buffer.from(raw, "base64");
          if (buf.length < 100 || buf.length > 1048576 || buf[0] !== 0xff || buf[1] !== 0xd8) continue;
          const path = `web/${createHash("sha256").update(buf).digest("hex").slice(0, 32)}.jpg`;
          const up = await fetch(`${SB}/storage/v1/object/review-photos/${path}`, { method: "POST", headers: { apikey: ANON, Authorization: "Bearer " + ANON, "Content-Type": "image/jpeg", "Cache-Control": "max-age=31536000" }, body: buf });
          if (up.ok || up.status === 409 || /exists|duplicate/i.test(await up.text().catch(() => ""))) pics.push(`${SB}/storage/v1/object/public/review-photos/${path}`);
        } catch (e) { /* skip a bad photo, keep the review */ }
      }
      const p = { handle: String(b.handle || ""), product: String(b.product || ""), customer: String(b.customer || b.name || ""), rating: Math.round(Number(b.rating) || 5), title: String(b.title || ""), text: String(b.text || b.body || ""), anon: !!b.anon, pics };
      const r = await rpc("review_submit", { p });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return res.status(400).json({ ok: false, error: (d && d.message) || "Couldn't save the review." });
      return res.status(200).json({ ok: true, id: d });
    }
    if (req.method !== "GET" && req.method !== "HEAD") return res.status(405).json({ error: "GET or POST only" });
    try {
      const r = await rpc("reviews_public");
      if (!r.ok) throw new Error("db " + r.status);
      const d = await r.json(), list = Array.isArray(d.list) ? d.list : [], alias = d.alias || {}, by = {};
      list.forEach((x, i) => { const k = alias[x[1]] || x[1]; if (k) (by[k] = by[k] || []).push(i); });
      const avg = list.length ? Math.round(list.reduce((a, x) => a + (Number(x[3]) || 0), 0) / list.length * 100) / 100 : 5;
      last = { total: list.length, avg, list, by, at: Date.now() };
    } catch (e) {
      if (!last) { res.setHeader("Cache-Control", "no-store"); return res.status(502).json({ error: "Reviews unavailable." }); }
    }
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=10, stale-while-revalidate=86400, stale-if-error=86400");
    if (req.query && req.query.js) { res.setHeader("Content-Type", "application/javascript; charset=utf-8"); return res.status(200).send("window.RS_REVIEWS=" + JSON.stringify(last).replace(/</g, "\\u003c") + ";"); }
    return res.status(200).json(last);
  } catch (e) {
    return res.status(502).json({ error: String((e && e.message) || e) });
  }
}
