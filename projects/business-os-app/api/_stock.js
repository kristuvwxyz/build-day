// Live RS OS stock per website product id (Supabase live_stock, supabase/live-stock.sql). Shared by /api/products and /api/stock.
// Website ids are made the same way RS OS makes them (webIdOf in RS OS).
const slug = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 90);
const webIdOf = r => r.web_id || slug([r.kind === "preorder" ? "preorder" : "", r.brand, r.name, r.size, r.ptype].filter(Boolean).join(" "));
let memo = { at: 0, map: null };

// Returns Map(webId → { stock, soldOut }) of active listings, or null when Supabase can't be reached.
export async function liveStock(maxAgeMs = 5000) {
  if (memo.map && Date.now() - memo.at < maxAgeMs) return memo.map;
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

// On-hand pieces with no live stock (or no active listing) are left out; sold-out pre-orders get soldOut: true.
export function applyStock(list, map) {
  return list.flatMap(p => {
    const s = map.get(p.id);
    if (p.kind !== "preorder") return s && s.stock > 0 ? [p] : [];
    return s && s.soldOut && !p.soldOut ? [{ ...p, soldOut: true }] : [p];
  });
}
