// S-JEFF sheet sync (K, Nov 25, 2026). A Google Apps Script in K's account reads S-JEFF's "Nov '26" tab every 30 minutes,
// POSTs the rows here (header x-sjeff-key) and writes back what this returns (column H only).
// What one run does:
//   1. New S-JEFF items in open orders (RS OS + website) that were never placed: add their qty to the row's column H,
//      up to what the supplier still has free. Orders placed in earlier runs are remembered (state.placed), never placed twice.
//   2. Orders in To Confirm whose S-JEFF items are all placed: To Bill.
//   3. Listing qty = what the supplier still has free (AVAILABLE − H). Not on the sheet / 0 = sold out.
//   4. If a row's Orders + Additional (F + H) goes down since the last run, S-JEFF removed our orders: alert on RS OS Home.
//   5. Items we couldn't place (sold out / not on the sheet): alert with the order numbers.
// First run (no state yet): records what is already open as placed and only watches (no sheet writes).
const DEFAULT_URL = "https://script.google.com/macros/s/AKfycbz7R17lKloaq_VaFMK-nDge-9AUXNFmNgaH7WZr2gWJjxRLMn1hEa6HubmeaDbaPzdU4g/exec";
const norm = s => String(s || "").toUpperCase().normalize("NFKD").replace(/[^A-Z0-9]/g, "");
const sq = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
const DONE_FUL = new Set(["fulfilled", "delivered", "cancelled"]);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  const SB = process.env.SUPABASE_URL, ANON = process.env.SUPABASE_ANON_KEY, KEY = process.env.RS_BACKEND_KEY;
  if (!SB || !ANON || !KEY) return res.status(503).json({ ok: false, error: "Server keys missing." });
  const secret = String(req.headers["x-sjeff-key"] || "");
  let body; try { body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {}); } catch (e) { return res.status(400).json({ ok: false, error: "Send JSON." }); }
  const rpc = (fn, args) => fetch(`${SB}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: ANON, Authorization: "Bearer " + ANON, "Content-Type": "application/json" }, body: JSON.stringify({ p_key: KEY, p_secret: secret, ...args }) })
    .then(r => r.ok ? r.json() : null).catch(() => null);

  const db = await rpc("sjeff_read", {});
  if (!db) return res.status(403).json({ ok: false, error: "Not allowed (wrong key, or supabase/sjeff-sync.sql not run)." });
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length < 50) return res.status(400).json({ ok: false, error: `Only ${rows.length} sheet rows (safety check).` });
  const dry = body.dry === true;

  // Sheet rows by key: "SECTION|barcode" and "SECTION|DESCRIPTION" (the sheet repeats barcodes across Testers / Sealed sections).
  // One key per row: SECTION|barcode, or SECTION|DESCRIPTION|PRICE when the barcode is missing, not a real barcode (e.g. "PFM")
  // or repeated in the same section. RS OS listings store this key in sjeffKey (same rule in RS OS).
  const goodBc = b => /^\d{8,14}$/.test(String(b || "").trim());
  const bcCount = new Map(); for (const r of rows) if (goodBc(r.barcode)) { const k = norm(r.section) + "|" + norm(r.barcode); bcCount.set(k, (bcCount.get(k) || 0) + 1); }
  const keyOf = r => { const sec = norm(r.section), kb = sec + "|" + norm(r.barcode); return goodBc(r.barcode) && bcCount.get(kb) === 1 ? kb : sec + "|" + norm(r.desc) + "|" + Math.round(Number(r.price) || 0); };
  const byKey = new Map(); for (const r of rows) byKey.set(keyOf(r), r);
  const rowKey = r => keyOf(r);

  const products = (db.products || []).map(d => ({ ...d.data, id: d.id }));
  const pById = new Map(products.map(p => [p.id, p]));
  const rowOf = p => p.sjeffKey ? byKey.get(p.sjeffKey) || null : null;

  // Website orders (live) + their team fields.
  let web = [];
  try { const r = await fetch(process.env.RS_BACKEND_URL || DEFAULT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "opsOrders", key: KEY, limit: 500 }), redirect: "follow" }); const j = await r.json(); if (j && j.ok) web = j.orders || []; else throw 0; }
  catch (e) { return res.status(502).json({ ok: false, error: "Couldn't read website orders." }); }
  const meta = new Map((db.webmeta || []).map(d => [d.id, d.data]));
  const byWebId = new Map(products.filter(p => p.webId).map(p => [p.webId, p]));
  const webProduct = i => { const k = i.id || i.h || i.handle || i.pid || ""; if (k && byWebId.has(k)) return byWebId.get(k);
    const t = sq(i.title || i.name); if (!t) return null; const v = sq(i.variant), pre = /pre-?order/i.test(i.variant || "");
    const hits = products.filter(p => p.name && (sq((p.brand || "") + p.name) === t || sq(p.name) === t));
    const score = p => (p.size && (v + t).includes(sq(p.size)) ? 2 : 0) + ((p.kind === "preorder") === pre ? 1 : 0) + (sq(p.ptype) && v.includes(sq(p.ptype)) ? 2 : 0);
    return hits.sort((a, b) => score(b) - score(a))[0] || null; };

  // Open orders → S-JEFF lines.
  const lines = [];   // { ref, kind: "rs"|"web", id, ful, pid, qty }
  for (const d of db.orders || []) { const o = d.data || {}; if (["voided", "refunded"].includes(o.payment)) continue;
    for (const i of o.items || []) { const p = pById.get(i.productId); if (p) lines.push({ ref: o.num || d.id, kind: "rs", id: d.id, ful: o.fulfillment || "", pid: p.id, qty: Number(i.qty) || 1, cust: o.customer || "" }); } }
  for (const o of web) { if (/cancel|refund|ship|complete|deliver|receiv/i.test(o.status || "")) continue; const m = meta.get(o.ref) || {};
    if (DONE_FUL.has(m.fulfillment)) continue; const ful = m.fulfillment || (o.status === "Placed" ? "to_confirm" : "");
    for (const i of o.items || []) { const p = webProduct(i); if (p) lines.push({ ref: o.ref, kind: "web", id: o.ref, ful, pid: p.id, qty: Number(i.qty) || 1, cust: o.name || "" }); } }

  const prev = db.state || {}, first = !prev.placed;
  const st = { placed: { ...(prev.placed || {}) }, seen: { ...(prev.seen || {}) }, alerts: [...(prev.alerts || [])].slice(0, 200), log: [...(prev.log || [])].slice(0, 100) };
  const now = Date.now(), alerts = [], writes = [], placedNow = [];
  const lk = l => l.ref + "|" + l.pid;

  // 4. Removed orders: F + H went down since we last saw it.
  for (const r of rows) { const k = rowKey(r), tot = (Number(r.F) || 0) + (Number(r.H) || 0), was = st.seen[k];
    if (was != null && tot < was) alerts.push({ at: now, type: "removed", row: r.row, item: r.desc, was, now: tot,
      text: `S-JEFF removed ${was - tot} of our order${was - tot > 1 ? "s" : ""}: ${r.desc} (row ${r.row}) was ${was}, now ${tot}.`,
      orders: Object.keys(st.placed).filter(x => { const p = pById.get(x.split("|")[1]); return p && rowOf(p) && rowKey(rowOf(p)) === k; }).map(x => x.split("|")[0]) }); }

  // 1. Place new lines.
  const need = new Map();   // rowKey -> { row, lines: [] }
  const blocked = [];        // lines we can't place
  for (const l of lines) { if (st.placed[lk(l)]) continue; if (first) { st.placed[lk(l)] = { qty: l.qty, at: now, baseline: true }; continue; }
    const p = pById.get(l.pid), r = rowOf(p);
    if (!p.sjeffKey) { blocked.push({ ...l, why: "listing isn't linked to a sheet row", name: `${p.brand || ""} ${p.name || ""}`.trim() }); continue; }
    if (!r) { blocked.push({ ...l, why: "not on S-JEFF's sheet anymore", name: `${p.brand || ""} ${p.name || ""}`.trim() }); continue; }
    const k = rowKey(r); if (!need.has(k)) need.set(k, { row: r, lines: [] }); need.get(k).lines.push(l); }
  const addH = new Map();   // rowKey -> qty added this run
  for (const [k, { row, lines: ls }] of need) {
    let free = Math.max(0, (Number(row.avail) || 0) - (Number(row.H) || 0)), add = 0;
    for (const l of ls.sort((a, b) => String(a.ref).localeCompare(String(b.ref)))) {
      if (l.qty <= free) { free -= l.qty; add += l.qty; st.placed[lk(l)] = { qty: l.qty, at: now, row: row.row }; placedNow.push(l); }
      else blocked.push({ ...l, why: `S-JEFF has only ${free} free`, name: row.desc }); }
    if (add) { addH.set(k, add); writes.push({ row: row.row, desc: row.desc, col: "H", value: (Number(row.H) || 0) + add, was: Number(row.H) || 0 }); }
  }
  if (blocked.length) {
    const seenB = new Set((prev.blockedSeen || []));
    const fresh = blocked.filter(b => !seenB.has(lk(b)));
    if (fresh.length) alerts.push({ at: now, type: "soldout", text: `${fresh.length} item${fresh.length > 1 ? "s" : ""} couldn't be placed with S-JEFF (sold out / not on the sheet). Check and decide.`,
      items: fresh.map(b => ({ ref: b.ref, cust: b.cust, item: b.name, qty: b.qty, why: b.why })) });
    st.blockedSeen = [...new Set([...(prev.blockedSeen || []), ...blocked.map(lk)])].slice(-1000);
  } else st.blockedSeen = prev.blockedSeen || [];

  // 3. Listing qty from the sheet (linked listings only).
  const prodSet = [];
  for (const p of products) { if (!p.sjeffKey || (p.status || "active") !== "active") continue;
    const r = rowOf(p), free = r ? Math.max(0, (Number(r.avail) || 0) - (Number(r.H) || 0) - (addH.get(rowKey(r)) || 0)) : 0;
    if (Number(p.stock) !== free || (p.kind === "preorder" && !!p.soldOut !== (free === 0))) prodSet.push({ id: p.id, set: { stock: free, ...(p.kind === "preorder" ? { soldOut: free === 0 } : {}) }, from: p.stock }); }

  // 2. To Confirm -> To Bill when every S-JEFF line of the order is placed.
  const byOrder = new Map(); for (const l of lines) { const k = l.kind + "|" + l.id; if (!byOrder.has(k)) byOrder.set(k, []); byOrder.get(k).push(l); }
  const ordSet = [], webSet = [], webStatus = [];
  if (!first) for (const [k, ls] of byOrder) { const l0 = ls[0]; if (l0.ful !== "to_confirm") continue; if (!ls.every(l => st.placed[lk(l)])) continue;
    if (l0.kind === "rs") ordSet.push({ id: l0.id, set: { fulfillment: "to_bill" }, log: "S-JEFF items placed on the supplier sheet → To Bill" });
    else { webSet.push({ id: l0.ref, set: { ref: l0.ref, fulfillment: "to_bill" }, log: "S-JEFF items placed on the supplier sheet → To Bill" }); webStatus.push(l0.ref); } }

  // Remember F + H after our writes.
  for (const r of rows) st.seen[rowKey(r)] = (Number(r.F) || 0) + (Number(r.H) || 0) + (addH.get(rowKey(r)) || 0);
  st.alerts = [...alerts, ...st.alerts].slice(0, 200);
  st.log = [{ at: now, first, placed: placedNow.map(l => `${l.ref} ${pById.get(l.pid).name} ×${l.qty}`), toBill: [...ordSet.map(o => o.id), ...webStatus], stock: prodSet.length, alerts: alerts.length, writes: writes.length }, ...st.log].slice(0, 100);
  st.lastRun = now; st.rows = rows.length;

  if (!dry) {
    const n = await rpc("sjeff_write", { p: { products: prodSet.map(({ id, set }) => ({ id, set })), orders: ordSet, webmeta: webSet, state: st } });
    if (n == null) return res.status(502).json({ ok: false, error: "Couldn't save." });
    for (const ref of webStatus) { try { await fetch(process.env.RS_BACKEND_URL || DEFAULT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "opsUpdate", key: KEY, ref, status: "Confirmed", by: "S-JEFF sync" }), redirect: "follow" }); } catch (e) {} }
  }
  return res.status(200).json({ ok: true, dry, first, writes, placed: placedNow.length, toBill: ordSet.length + webSet.length, stock: prodSet.length, alerts: alerts.map(a => a.text),
    ...(dry ? { preview: { prodSet: prodSet.slice(0, 60).map(x => ({ id: x.id, from: x.from, to: x.set.stock })), ordSet, webSet, blocked: blocked.map(b => ({ ref: b.ref, item: b.name, why: b.why })) } } : {}) });
}
