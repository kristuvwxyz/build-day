// Live stock check for the website checkout: GET /api/stock?ids=id1,id2 (website product ids, up to 50).
// Answers { ok, items: { id: { ok, stock, soldOut } } }; ok false = can't be bought now (sold out or not listed).
// Public on purpose: only stock numbers, no keys, no customer data. Never cached.
import { liveStock, QTY_CAP } from "./_stock.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") { res.setHeader("Access-Control-Allow-Methods", "GET"); return res.status(204).end(); }
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "GET only" });
  const ids = String(req.query.ids || "").split(",").map(s => s.trim()).filter(Boolean).slice(0, 50);
  if (!ids.length) return res.status(400).json({ ok: false, error: "Add ?ids=" });
  const map = await liveStock(0);
  if (!map) return res.status(503).json({ ok: false, error: "Stock check unavailable" });
  const items = {};
  for (const id of ids) {
    const s = map.get(id);
    items[id] = s ? { ok: !s.soldOut, stock: s.kind === "preorder" ? null : s.stock, max: s.stock > 0 ? Math.min(QTY_CAP, Math.floor(s.stock)) : QTY_CAP, soldOut: s.soldOut, kind: s.kind } : { ok: false, stock: 0, soldOut: true, kind: null };
  }
  return res.status(200).json({ ok: true, items });
}
