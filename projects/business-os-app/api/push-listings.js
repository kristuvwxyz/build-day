// Sends the website product list to the website backend from the server, so listing changes reach regalspritz.com
// even when nobody has RS OS open. Called by the database (supabase/server-push.sql) when a listing is marked "pending".
// Reads the listings with the Supabase service key (server only, never in the browser), builds the list the same way
// RS OS does (api/_webfeed.js), and asks the website backend to replace its list (opsSetProducts).
// Safety: calls within 3 s of each other are merged (only the last one sends); a short list is never sent.
import { webProducts, webPhotoExtra } from "./_webfeed.js";
const DEFAULT_URL = "https://script.google.com/macros/s/AKfycbz7R17lKloaq_VaFMK-nDge-9AUXNFmNgaH7WZr2gWJjxRLMn1hEa6HubmeaDbaPzdU4g/exec";
const MIN_LISTINGS = 100;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  const SB = process.env.SUPABASE_URL, SRK = process.env.SUPABASE_SERVICE_ROLE_KEY, KEY = process.env.RS_BACKEND_KEY, SECRET = process.env.RS_PUSH_SECRET;
  if (!SB || !SRK || !KEY || !SECRET) return res.status(503).json({ ok: false, error: "Server push isn't set up in Vercel yet (see supabase/server-push.sql)." });
  if ((req.headers["x-rs-push-secret"] || "") !== SECRET) return res.status(403).json({ ok: false, error: "Not allowed." });

  const H = { apikey: SRK, Authorization: "Bearer " + SRK, "Content-Type": "application/json" };
  const readStart = Date.now();

  // 1. Debounce: note this call, wait, and only the newest call carries on.
  const gate = await fetch(`${SB}/rest/v1/docs?on_conflict=path`, { method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ path: "webmeta/_push_gate", col: "webmeta", id: "_push_gate", data: { at: readStart } }) });
  if (!gate.ok) return res.status(502).json({ ok: false, error: "Couldn't note the push." });
  await new Promise(r => setTimeout(r, 3000));
  const now = await fetch(`${SB}/rest/v1/docs?path=eq.webmeta/_push_gate&select=data`, { headers: H }).then(r => r.ok ? r.json() : []).catch(() => []);
  if (!now[0] || Number(now[0].data && now[0].data.at) !== readStart) return res.status(200).json({ ok: true, skipped: "a newer change is being sent" });

  // 2. Read every listing (Supabase sends at most 1,000 rows per answer).
  const docs = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${SB}/rest/v1/docs?col=eq.products&select=id,data&order=id`, { headers: { ...H, Range: `${from}-${from + 999}` } });
    if (!r.ok) return res.status(502).json({ ok: false, error: "Couldn't read the listings." });
    const page = await r.json();
    docs.push(...page);
    if (page.length < 1000) break;
  }
  const products = docs.map(d => ({ ...(d.data || {}), id: d.id }));
  const list = webProducts(products);
  if (list.length < MIN_LISTINGS) return res.status(409).json({ ok: false, error: `Only ${list.length} listings; not sending (safety check).` });
  const extra = webPhotoExtra(products, list);
  if (list.length) list[0] = { ...list[0], _photos: extra };

  // 3. Hand the list to the website backend (same call RS OS makes).
  const t0 = Date.now();
  let j = null;
  try {
    const r = await fetch(process.env.RS_BACKEND_URL || DEFAULT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "opsSetProducts", key: KEY, products: list, by: "RS OS (server)" }), redirect: "follow" });
    j = await r.json().catch(() => null);
  } catch (e) { j = null; }
  if (!j || !j.ok) return res.status(502).json({ ok: false, error: "The website backend didn't take the update." + (j && j.error ? " " + String(j.error).slice(0, 160) : "") });

  // 4. Mark the listings we just sent as on the website (only those changed before we read them).
  const mk = await fetch(`${SB}/rest/v1/rpc/web_mark_synced`, { method: "POST", headers: H, body: JSON.stringify({ p_before: readStart }) }).then(r => r.ok ? r.json() : null).catch(() => null);
  res.setHeader("Server-Timing", `backend;dur=${Date.now() - t0}`);
  return res.status(200).json({ ok: true, listings: list.length, photos: extra.length, marked: typeof mk === "number" ? mk : null });
}
