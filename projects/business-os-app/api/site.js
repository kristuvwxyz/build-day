// Reads and updates regalspritz.com website orders for signed-in team members only.
// Also hands out RS order numbers from the one shared counter (website backend with the key, or signed-in staff).
// The website backend key (RS_BACKEND_KEY) stays here on the server, never in the browser.
// Customer details pass straight through: nothing is saved or logged here.
const DEFAULT_URL = "https://script.google.com/macros/s/AKfycbz7R17lKloaq_VaFMK-nDge-9AUXNFmNgaH7WZr2gWJjxRLMn1hEa6HubmeaDbaPzdU4g/exec";
const STATUSES = new Set(["Placed", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"]);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  const SB = process.env.SUPABASE_URL, ANON = process.env.SUPABASE_ANON_KEY, KEY = process.env.RS_BACKEND_KEY;
  if (!SB || !ANON) return res.status(503).json({ ok: false, error: "Supabase isn't set up in Vercel yet." });
  if (!KEY) return res.status(503).json({ ok: false, error: "Website orders aren't connected yet. Add RS_BACKEND_KEY in Vercel." });

  let body; try { body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {}); } catch (e) { return res.status(400).json({ ok: false, error: "Send JSON." }); }
  const rpc = (fn, args) => fetch(`${SB}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: ANON, Authorization: "Bearer " + ANON, "Content-Type": "application/json" }, body: JSON.stringify(args) });
  const nextNumber = async () => {
    const r = await rpc("next_rs_number", { p_key: KEY });
    const j = await r.json().catch(() => null);
    if (!r.ok || typeof j !== "string" || !/^RS\d+$/.test(j)) return res.status(502).json({ ok: false, error: "Couldn't get the next RS number." });
    return res.status(200).json({ ok: true, ref: j });
  };
  // The website backend (no staff session) asks for a number with the shared key.
  if (body.action === "nextOrderNumber" && body.key !== undefined) {
    if (typeof body.key !== "string" || body.key !== KEY) return res.status(403).json({ ok: false, error: "Not allowed." });
    return nextNumber();
  }

  // 1. Who is asking? Must be signed in and in the team directory.
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ ok: false, error: "Sign in again." });
  const head = { Authorization: auth, apikey: ANON, "Content-Type": "application/json" };
  const who = await fetch(`${SB}/auth/v1/user`, { headers: head });
  if (!who.ok) return res.status(401).json({ ok: false, error: "Sign in again." });
  const mem = await fetch(`${SB}/rest/v1/rpc/is_member`, { method: "POST", headers: head, body: "{}" });
  if (!mem.ok || (await mem.json()) !== true) return res.status(403).json({ ok: false, error: "Only team members can see website orders." });

  // Staff creating an order in RS OS take the next number from the same counter.
  if (body.action === "nextOrderNumber") return nextNumber();

  // 2. Build the backend request. Only these actions and these fields are allowed.
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
    if (body.cancel === "Approved" || body.cancel === "Declined") call.cancel = body.cancel;
    if (!("paid" in call) && !("status" in call) && !("tracking" in call) && !("cancel" in call)) return res.status(400).json({ ok: false, error: "Nothing to change." });
  } else if (body.action === "pushProducts") {
    // The full product catalog from RS OS Listings (same list the old WebCake code had). The website replaces its list.
    if (!Array.isArray(body.products) || body.products.length > 3000) return res.status(400).json({ ok: false, error: "Send the product list." });
    const me = await fetch(`${SB}/rest/v1/rpc/my_member`, { method: "POST", headers: head, body: "{}" }).then(r => r.ok ? r.json() : null).catch(() => null);
    call = { action: "opsSetProducts", key: KEY, products: body.products, by: String((me && (me.nickname || me.name)) || "RS OS").slice(0, 60) };
  } else return res.status(400).json({ ok: false, error: "That request isn't allowed." });

  // 3. Ask the website backend (Apps Script answers with a redirect, which fetch follows).
  try {
    const r = await fetch(process.env.RS_BACKEND_URL || DEFAULT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(call), redirect: "follow" });
    const j = await r.json().catch(() => null);
    if (!j) return res.status(502).json({ ok: false, error: "The website backend didn't answer (" + r.status + ")." });
    if (!j.ok && call.action === "opsSetProducts" && /unknown|action/i.test(j.error || "")) return res.status(502).json({ ok: false, error: "The website can't receive listings yet. Update the website backend to v15 (see the setup guide)." });
    if (!j.ok && /not allowed/i.test(j.error || "")) return res.status(502).json({ ok: false, error: "The website key in Vercel is wrong. Make a new one with newOpsKey and update RS_BACKEND_KEY." });
    // Keep the shared counter above every website order number seen (covers numbers the website made on its own).
    if (call.action === "opsOrders" && j.ok && Array.isArray(j.orders)) {
      const max = j.orders.reduce((m, o) => { const x = /^RS(\d+)$/i.exec(String(o.ref || "")); return x ? Math.max(m, Number(x[1])) : m; }, 0);
      if (max) await rpc("rs_counter_floor", { p_key: KEY, p_min: max }).catch(() => {});
    }
    return res.status(200).json(j);
  } catch (e) {
    return res.status(502).json({ ok: false, error: "Couldn't reach the website backend." });
  }
}
