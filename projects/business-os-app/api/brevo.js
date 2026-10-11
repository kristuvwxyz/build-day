// "New website" email progress from Brevo (campaigns named "New Website Launch…"), for the owner's Home card.
// Team members only. The Brevo key (BREVO_API_KEY) stays here on the server. Only campaign numbers come back, no contacts.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const SB = process.env.SUPABASE_URL, ANON = process.env.SUPABASE_ANON_KEY, KEY = (process.env.BREVO_API_KEY || "").trim();
  if (!SB || !ANON) return res.status(503).json({ ok: false, error: "Supabase isn't set up in Vercel yet." });
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ ok: false, error: "Sign in again." });
  const mem = await fetch(`${SB}/rest/v1/rpc/is_member`, { method: "POST", headers: { Authorization: auth, apikey: ANON, "Content-Type": "application/json" }, body: "{}" });
  if (!mem.ok || (await mem.json()) !== true) return res.status(403).json({ ok: false, error: "Only team members can see this." });
  if (!KEY) return res.status(503).json({ ok: false, error: "no-key" });
  try {
    const r = await fetch("https://api.brevo.com/v3/emailCampaigns?type=classic&limit=100&offset=0&sort=desc&statistics=globalStats", { headers: { "api-key": KEY, accept: "application/json" } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ ok: false, error: "Brevo said: " + String(j.message || r.status).slice(0, 160) });
    const camps = (j.campaigns || []).filter(c => /^new website launch/i.test(c.name || "")).map(c => {
      const g = (c.statistics && c.statistics.globalStats) || {};
      return { id: c.id, name: c.name, status: c.status, scheduledAt: c.scheduledAt || "", sentDate: c.sentDate || "",
        sent: g.sent || 0, delivered: g.delivered || 0, opened: g.uniqueViews || 0, clicked: g.uniqueClicks || 0, unsub: g.unsubscriptions || 0, bounced: (g.hardBounces || 0) + (g.softBounces || 0) };
    }).sort((a, b) => String(a.scheduledAt || a.sentDate).localeCompare(String(b.scheduledAt || b.sentDate)));
    return res.status(200).json({ ok: true, camps, at: Date.now() });
  } catch (e) { return res.status(502).json({ ok: false, error: "Couldn't reach Brevo." }); }
}
