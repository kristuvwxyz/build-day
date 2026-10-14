// Sends the website product list to the website backend from the server, so listing changes reach regalspritz.com
// even when nobody has RS OS open. Called by the database (supabase/server-push.sql) when a listing is marked "pending".
// The call carries the website key (RS_BACKEND_KEY); the same key unlocks the database helpers used here.
// Builds the list the same way RS OS does (api/_webfeed.js) and asks the website backend to replace its list (opsSetProducts).
// Safety: calls within 3 s of each other are merged (only the last one sends); a short list is never sent.
import { webProducts, webPhotoExtra } from "./_webfeed.js";
const DEFAULT_URL = "https://script.google.com/macros/s/AKfycbz7R17lKloaq_VaFMK-nDge-9AUXNFmNgaH7WZr2gWJjxRLMn1hEa6HubmeaDbaPzdU4g/exec";
const MIN_LISTINGS = 100;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  const SB = process.env.SUPABASE_URL, ANON = process.env.SUPABASE_ANON_KEY, KEY = process.env.RS_BACKEND_KEY;
  if (!SB || !ANON || !KEY) return res.status(503).json({ ok: false, error: "Supabase or the website key isn't set up in Vercel." });
  if ((req.headers["x-rs-push-key"] || "") !== KEY) return res.status(403).json({ ok: false, error: "Not allowed." });

  const rpc = (fn, args) => fetch(`${SB}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: ANON, Authorization: "Bearer " + ANON, "Content-Type": "application/json" }, body: JSON.stringify({ p_key: KEY, ...args }) })
    .then(r => r.ok ? r.json() : null).catch(() => null);
  const readStart = Date.now();

  // 1. Debounce: note this call, wait, and only the newest call carries on.
  if ((await rpc("web_push_gate", { p_at: readStart })) == null) return res.status(502).json({ ok: false, error: "Couldn't reach the database (is supabase/server-push.sql run?)." });
  await new Promise(r => setTimeout(r, 3000));
  if (Number(await rpc("web_push_gate", { p_at: null })) !== readStart) return res.status(200).json({ ok: true, skipped: "a newer change is being sent" });

  // 2. Read every listing and build the website list.
  const docs = await rpc("web_push_docs", {});
  if (!Array.isArray(docs)) return res.status(502).json({ ok: false, error: "Couldn't read the listings." });
  const products = docs.map(d => ({ ...(d.data || {}), id: d.id }));
  const list = webProducts(products);
  if (list.length < MIN_LISTINGS) return res.status(409).json({ ok: false, error: `Only ${list.length} listings; not sending (safety check).` });
  const extra = webPhotoExtra(products, list);
  list[0] = { ...list[0], _photos: extra };

  // 3. Hand the list to the website backend (same call RS OS makes).
  const t0 = Date.now();
  let j = null;
  try {
    const r = await fetch(process.env.RS_BACKEND_URL || DEFAULT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "opsSetProducts", key: KEY, products: list, by: "RS OS (server)" }), redirect: "follow" });
    j = await r.json().catch(() => null);
  } catch (e) { j = null; }
  if (!j || !j.ok) return res.status(502).json({ ok: false, error: "The website backend didn't take the update." + (j && j.error ? " " + String(j.error).slice(0, 160) : "") });

  // 4. Mark the listings we just sent as on the website (only those changed before we read them).
  const marked = await rpc("web_mark_synced", { p_before: readStart });
  res.setHeader("Server-Timing", `backend;dur=${Date.now() - t0}`);
  return res.status(200).json({ ok: true, listings: list.length, photos: extra.length, marked });
}
