// Reads and updates regalspritz.com website orders for signed-in team members only.
// Also hands out RS order numbers from the one shared counter (website backend with the key, or signed-in staff).
// The website backend key (RS_BACKEND_KEY) stays here on the server, never in the browser.
// Customer details pass straight through: nothing is saved or logged here.
const DEFAULT_URL = "https://script.google.com/macros/s/AKfycbz7R17lKloaq_VaFMK-nDge-9AUXNFmNgaH7WZr2gWJjxRLMn1hEa6HubmeaDbaPzdU4g/exec";
const STATUSES = new Set(["Placed", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled", "Refunded"]);

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
  // Both checks run at the same time (saves a round trip on every load).
  const [who, mem] = await Promise.all([fetch(`${SB}/auth/v1/user`, { headers: head }), fetch(`${SB}/rest/v1/rpc/is_member`, { method: "POST", headers: head, body: "{}" })]);
  if (!who.ok) return res.status(401).json({ ok: false, error: "Sign in again." });
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
    // BDO Checkout link pasted by staff (empty clears it). The website backend checks it again.
    if (typeof body.bdoLink === "string") { const l = body.bdoLink.trim(); if (l && !/^https:\/\/([a-z0-9-]+\.)*bdo\.com\.ph\/\S*$/i.test(l)) return res.status(400).json({ ok: false, error: "That doesn’t look like a BDO Checkout link." }); call.bdoLink = l.slice(0, 1000); }
    if (!("paid" in call) && !("status" in call) && !("tracking" in call) && !("cancel" in call) && !("bdoLink" in call)) return res.status(400).json({ ok: false, error: "Nothing to change." });
  } else if (body.action === "pushProducts") {
    // The full product catalog from RS OS Listings (same list the old WebCake code had). The website replaces its list.
    if (!Array.isArray(body.products) || body.products.length > 3000) return res.status(400).json({ ok: false, error: "Send the product list." });
    const me = await fetch(`${SB}/rest/v1/rpc/my_member`, { method: "POST", headers: head, body: "{}" }).then(r => r.ok ? r.json() : null).catch(() => null);
    call = { action: "opsSetProducts", key: KEY, products: body.products, by: String((me && (me.nickname || me.name)) || "RS OS").slice(0, 60) };
  } else if (body.action === "statuses") {
    // Many order statuses at once (RS OS / old-shop orders shown in customers' accounts). Website backend v22+ (opsStatuses).
    if (!Array.isArray(body.orders) || !body.orders.length || body.orders.length > 5000) return res.status(400).json({ ok: false, error: "Send 1 to 5000 orders." });
    const orders = body.orders.map(o => ({ ref: String((o && o.ref) || "").trim().replace(/^#/, ""), status: o && o.status })).filter(o => /^[A-Za-z0-9_-]{1,40}$/.test(o.ref) && STATUSES.has(o.status));
    if (!orders.length) return res.status(400).json({ ok: false, error: "Nothing to change." });
    call = { action: "opsStatuses", key: KEY, orders };
  } else if (body.action === "email") {
    // Royal Receipt to one buyer, sent from the store Gmail by the website backend (opsEmail). Team members only (checked above).
    const to = String(body.to || "").trim().toLowerCase();
    if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[a-z]{2,}$/i.test(to) || to.length > 120) return res.status(400).json({ ok: false, error: "That email address doesn't look right." });
    const subject = String(body.subject || "").replace(/[\r\n]+/g, " ").trim().slice(0, 200), html = String(body.html || ""), text = String(body.text || "").slice(0, 20000);
    if (!subject || !html || html.length > 150000) return res.status(400).json({ ok: false, error: "The receipt is empty or too big." });
    const me = await fetch(`${SB}/rest/v1/rpc/my_member`, { method: "POST", headers: head, body: "{}" }).then(r => r.ok ? r.json() : null).catch(() => null);
    call = { action: "opsEmail", key: KEY, to, subject, html, text, by: String((me && (me.nickname || me.name)) || "RS OS").slice(0, 60) };
  } else if (body.action === "returnSet") {
    // Return / refund request decision (website backend v31 opsReturnSet). The refund itself is done by the team.
    const ref = String(body.ref || "").trim().replace(/^#/, "");
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(ref)) return res.status(400).json({ ok: false, error: "Missing order number." });
    if (!["Approved", "Declined", "Pending"].includes(body.status)) return res.status(400).json({ ok: false, error: "Pick Approve or Decline." });
    const me = await fetch(`${SB}/rest/v1/rpc/my_member`, { method: "POST", headers: head, body: "{}" }).then(r => r.ok ? r.json() : null).catch(() => null);
    call = { action: "opsReturnSet", key: KEY, ref, status: body.status, note: String(body.note || "").trim().slice(0, 500), by: String((me && (me.nickname || me.name)) || "RS OS").slice(0, 60) };
  } else if (body.action === "maya") {
    // Maya Checkout (cards / Maya wallet) link for an RS OS order. With MAYA_PUBLIC_KEY in Vercel the link is made here;
    // otherwise the website backend makes it with its own Maya key (opsMayaCheckout, see docs/handoffs/rs-os-maya-link.md).
    const ref = String(body.ref || "").trim().replace(/^#/, ""), amount = Math.round(Number(body.amount) * 100) / 100;
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(ref)) return res.status(400).json({ ok: false, error: "Missing order number." });
    if (!(amount >= 1 && amount <= 500000)) return res.status(400).json({ ok: false, error: "The amount must be ₱1 to ₱500,000." });
    const s = v => String(v || "").replace(/[\r\n<>]+/g, " ").trim();
    const name = s(body.name).slice(0, 80), email = s(body.email).slice(0, 120), phone = s(body.phone).slice(0, 20);
    const items = (Array.isArray(body.items) ? body.items : []).slice(0, 50).map(i => ({ name: s(i && i.name).slice(0, 120) || "Item", quantity: Math.max(1, Math.round(Number(i && i.qty) || 1)), totalAmount: { value: Math.round((Number(i && i.qty) || 1) * (Number(i && i.price) || 0) * 100) / 100 } }));
    const back = "https://www.regalspritz.com/account";
    // Maya public key: Vercel MAYA_PUBLIC_KEY, else the one saved in Supabase (supabase/maya-key.sql).
    let MAYA = process.env.MAYA_PUBLIC_KEY || "";
    if (!MAYA) { const mk = await rpc("maya_key", { p_key: KEY }).then(r => r.ok ? r.json() : null).catch(() => null); if (typeof mk === "string" && /^pk-/.test(mk)) MAYA = mk; }
    if (MAYA) {
      const [first, ...rest] = name.split(" ");
      const mb = { totalAmount: { value: amount, currency: "PHP" }, requestReferenceNumber: ref,
        buyer: { firstName: first || "Customer", lastName: rest.join(" ") || "-", contact: { ...(email ? { email } : {}), ...(phone ? { phone } : {}) } },
        items: items.length ? items : [{ name: "Order " + ref, quantity: 1, totalAmount: { value: amount } }],
        redirectUrl: { success: back + "?paid=" + ref, failure: back, cancel: back } };
      try {
        const r = await fetch((process.env.MAYA_BASE_URL || "https://pg.maya.ph") + "/checkout/v1/checkouts", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Basic " + Buffer.from(MAYA + ":").toString("base64") }, body: JSON.stringify(mb) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.redirectUrl) return res.status(502).json({ ok: false, error: "Maya didn't make the link: " + String(j.message || j.error || r.status).slice(0, 160) });
        return res.status(200).json({ ok: true, url: j.redirectUrl, id: j.checkoutId || "" });
      } catch (e) { return res.status(502).json({ ok: false, error: "Couldn't reach Maya." }); }
    }
    call = { action: "opsMayaCheckout", key: KEY, ref, amount, name, email, phone, items: items.map(i => ({ name: i.name, qty: i.quantity, total: i.totalAmount.value })) };
  } else return res.status(400).json({ ok: false, error: "That request isn't allowed." });

  // 3. Ask the website backend (Apps Script answers with a redirect, which fetch follows).
  try {
    const t0 = Date.now();
    const r = await fetch(process.env.RS_BACKEND_URL || DEFAULT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(call), redirect: "follow" });
    const j = await r.json().catch(() => null);
    res.setHeader("Server-Timing", `backend;dur=${Date.now() - t0}`);
    if (j && call.action === "opsOrders") j.backendMs = Date.now() - t0;
    if (!j) return res.status(502).json({ ok: false, error: "The website backend didn't answer (" + r.status + ")." });
    if (!j.ok && call.action === "opsSetProducts" && /unknown|action/i.test(j.error || "")) return res.status(502).json({ ok: false, error: "The website can't receive listings yet. Update the website backend to v15 (see the setup guide)." });
    if (!j.ok && call.action === "opsMayaCheckout" && /unknown|action/i.test(j.error || "")) return res.status(502).json({ ok: false, error: "Maya links aren't set up yet (add MAYA_PUBLIC_KEY in Vercel)." });
    if (!j.ok && call.action === "opsEmail" && /unknown|action/i.test(j.error || "")) return res.status(502).json({ ok: false, error: "the website backend can't send emails yet (needs the opsEmail update)" });
    if (!j.ok && call.action === "opsReturnSet" && /unknown|action/i.test(j.error || "")) return res.status(502).json({ ok: false, error: "The website backend can't take return decisions yet (needs v31)." });
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
