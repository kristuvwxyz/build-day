// Live RS OS stock per website product id (Supabase live_stock, supabase/live-stock.sql). Shared by /api/products and /api/stock.
// Website ids are made the same way RS OS makes them (webIdOf in RS OS).
const slug = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 90);
const webIdOf = r => r.web_id || slug([r.kind === "preorder" ? "preorder" : "", r.brand, r.name, r.size, r.ptype].filter(Boolean).join(" "));
let memo = { at: 0, map: null };

// Returns Map(webId → { stock, soldOut }) of active listings, or null when Supabase can't be reached.
// If Supabase doesn't answer (short outages happen), it tries once more, then uses the last good answer up to 15 min old.
export async function liveStock(maxAgeMs = 5000) {
  if (memo.map && Date.now() - memo.at < maxAgeMs) return memo.map;
  const fresh = (await readStock()) || (await readStock());
  return fresh || (memo.map && Date.now() - memo.at < 15 * 60e3 ? memo.map : null);
}
async function readStock() {
  const SB = process.env.SUPABASE_URL, ANON = process.env.SUPABASE_ANON_KEY;
  if (!SB || !ANON) return null;
  try {
    const r = await fetch(`${SB}/rest/v1/rpc/live_stock`, { method: "POST", headers: { apikey: ANON, Authorization: "Bearer " + ANON, "Content-Type": "application/json" }, body: "{}" });
    if (!r.ok) return null;
    const rows = await r.json(), map = new Map();
    for (const x of rows) {
      if (!x.active) continue;
      const id = webIdOf(x), cur = map.get(id) || { kind: x.kind === "preorder" ? "preorder" : "onhand", stock: 0, soldOut: true };
      cur.stock += Math.max(0, Number(x.stock) || 0);
      cur.soldOut = cur.soldOut && (x.kind === "preorder" ? !!x.sold_out : !(Number(x.stock) > 0));
      map.set(id, cur);
    }
    memo = { at: Date.now(), map };
    return map;
  } catch (e) { return null; }
}

// Pieces with no active listing are left out; on-hand pieces with no live stock and sold-out pre-orders get soldOut: true.
// Every piece also gets max: how many one buyer can check out (the Dashboard stock, never more than QTY_CAP;
// a pre-order with no stock number set gets QTY_CAP).
export const QTY_CAP = 20;
const maxOf = s => (s && s.stock > 0 ? Math.min(QTY_CAP, Math.floor(s.stock)) : QTY_CAP);
export function applyStock(list, map) {
  return list.flatMap(p => {
    const s = map.get(p.id), q = { ...p, max: maxOf(s) };
    if (p.kind !== "preorder") return !s ? [] : s.stock > 0 ? [q] : [p.soldOut ? q : { ...q, soldOut: true }];
    return s && s.soldOut && !p.soldOut ? [{ ...q, soldOut: true }] : [q];
  });
}
