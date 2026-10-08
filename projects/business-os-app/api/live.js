// Live visitors on regalspritz.com.
// POST (from the website add-on live-visitors.html): {sid, path} → marks that open tab as here now.
// GET (from RS OS): {count} = tabs seen in the last 75 seconds. Only a random tab id and the page path are kept, never names or IPs.
const SITES = /^https:\/\/([a-z0-9-]+\.)*regalspritz\.com$/i;

export default async function handler(req, res) {
  const SB = process.env.SUPABASE_URL, ANON = process.env.SUPABASE_ANON_KEY;
  const origin = req.headers.origin || "";
  if (SITES.test(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") { res.setHeader("Access-Control-Allow-Methods", "POST, GET"); res.setHeader("Access-Control-Allow-Headers", "Content-Type"); return res.status(204).end(); }
  if (!SB || !ANON) return res.status(503).json({ error: "Supabase isn't set up in Vercel yet." });
  const rpc = (fn, args) => fetch(`${SB}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: ANON, Authorization: "Bearer " + ANON, "Content-Type": "application/json" }, body: JSON.stringify(args || {}) });
  try {
    if (req.method === "POST") {
      if (origin && !SITES.test(origin)) return res.status(403).json({ error: "Not allowed." });
      let b = req.body; if (typeof b === "string") { try { b = JSON.parse(b || "{}"); } catch (e) { b = {}; } }
      const sid = String((b && b.sid) || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64), path = String((b && b.path) || "").slice(0, 200);
      if (sid.length < 8) return res.status(400).json({ error: "Bad id." });
      const r = await rpc("live_ping", { p_sid: sid, p_path: path });
      return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
    }
    if (req.method === "GET") {
      const r = await rpc("live_count");
      const n = r.ok ? await r.json() : null;
      return res.status(r.ok ? 200 : 502).json({ count: typeof n === "number" ? n : null, at: Date.now() });
    }
    return res.status(405).json({ error: "POST or GET only" });
  } catch (e) {
    return res.status(502).json({ error: String((e && e.message) || e) });
  }
}
