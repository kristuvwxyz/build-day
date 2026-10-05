// Reads and updates regalspritz.com website orders for signed-in team members only.
// The website backend key (RS_BACKEND_KEY) stays here on the server, never in the browser.
// Customer details pass straight through: nothing is saved or logged here.
const DEFAULT_URL = "https://script.google.com/macros/s/AKfycby15yiWGn93Y6R826l_gT1R0IW9VTrv3CblFl5Plc7OYvEiWC_OOfdRuybAWyfrS2C0Ww/exec";
const STATUSES = new Set(["Placed", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"]);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  const SB = process.env.SUPABASE_URL, ANON = process.env.SUPABASE_ANON_KEY, KEY = process.env.RS_BACKEND_KEY;
  if (!SB || !ANON) return res.status(503).json({ ok: false, error: "Supabase isn't set up in Vercel yet." });
  if (!KEY) return res.status(503).json({ ok: false, error: "Website orders aren't connected yet. Add RS_BACKEND_KEY in Vercel." });

  // 1. Who is asking? Must be signed in and in the team directory.
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ ok: false, error: "Sign in again." });
  const head = { Authorization: auth, apikey: ANON, "Content-Type": "application/json" };
  const who = await fetch(`${SB}/auth/v1/user`, { headers: head });
  if (!who.ok) return res.status(401).json({ ok: false, error: "Sign in again." });
  const mem = await fetch(`${SB}/rest/v1/rpc/is_member`, { method: "POST", headers: head, body: "{}" });
  if (!mem.ok || (await mem.json()) !== true) return res.status(403).json({ ok: false, error: "Only team members can see website orders." });

  // 2. Build the backend request. Only these two actions and these fields are allowed.
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  let call;
  if (body.action === "list") {
    call = { action: "opsOrders", key: KEY, limit: Math.min(500, Math.max(1, Number(body.limit) || 200)) };
    if (/^\d{4}-\d{2}-\d{2}$/.test(body.since || "")) call.since = body.since;
  } else if (body.action === "update") {
    const ref = String(body.ref || "").trim();
    if (!/^[A-Za-z0-9#_-]{1,40}$/.test(ref)) return res.status(400).json({ ok: false, error: "Missing order number." });
    const me = await fetch(`${SB}/rest/v1/rpc/my_member`, { method: "POST", headers: head, body: "{}" }).then(r => r.ok ? r.json() : null).catch(() => null);
    const user = await who.json().catch(() => ({}));
    call = { action: "opsUpdate", key: KEY, ref, by: String((me && (me.nickname || me.name)) || user.email || "RS OS").slice(0, 60) };
    if (typeof body.paid === "boolean") call.paid = body.paid;
    if (STATUSES.has(body.status)) call.status = body.status;
    if (typeof body.tracking === "string") call.tracking = body.tracking.trim().slice(0, 80);
    if (!("paid" in call) && !("status" in call) && !("tracking" in call)) return res.status(400).json({ ok: false, error: "Nothing to change." });
  } else return res.status(400).json({ ok: false, error: "That request isn't allowed." });

  // 3. Ask the website backend (Apps Script answers with a redirect, which fetch follows).
  try {
    const r = await fetch(process.env.RS_BACKEND_URL || DEFAULT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(call), redirect: "follow" });
    const j = await r.json().catch(() => null);
    if (!j) return res.status(502).json({ ok: false, error: "The website backend didn't answer (" + r.status + ")." });
    if (!j.ok && /not allowed/i.test(j.error || "")) return res.status(502).json({ ok: false, error: "The website key in Vercel is wrong. Make a new one with newOpsKey and update RS_BACKEND_KEY." });
    return res.status(200).json(j);
  } catch (e) {
    return res.status(502).json({ ok: false, error: "Couldn't reach the website backend." });
  }
}
