// Fast copy of the website's product list (the same products.js the Apps Script backend makes), served from Vercel's CDN.
// Apps Script is slow to answer (often 1-3 s, more when it wakes up), so regalspritz.com loads this instead:
//   https://regal-spritz-os.vercel.app/api/products
// The CDN answers at once and refreshes in the background, so a listing edit shows within about 15 seconds.
// Public on purpose (it is the public product list); no keys, no customer data.
// Before sending, every piece is checked against live RS OS stock: on-hand pieces with stock 0 are left out and
// sold-out pre-orders are marked soldOut: true, even if the backend copy is a little behind.
import { liveStock, applyStock } from "./_stock.js";
import { serveImg } from "./_img.js";
const DEFAULT_URL = "https://script.google.com/macros/s/AKfycbz7R17lKloaq_VaFMK-nDge-9AUXNFmNgaH7WZr2gWJjxRLMn1hEa6HubmeaDbaPzdU4g/exec";
let last = { body: "", type: "", at: 0, photos: [] };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET" && req.method !== "HEAD") return res.status(405).send("GET only");
  if (req.query && req.query.img) return serveImg(req, res);  // /img/* listing photos (api/_img.js)
  try {
    const r = await fetch((process.env.RS_BACKEND_URL || DEFAULT_URL) + "?action=products.js", { redirect: "follow" });
    const body = await r.text();
    if (!r.ok || body.length < 20) throw new Error("backend " + r.status);
    const split = splitPhotos(viaCdn(body));
    last = { body: split.body, photos: split.photos, type: (r.headers.get("content-type") || "application/javascript").split(";")[0], at: Date.now() };
  } catch (e) {
    // Backend down or slow: keep the site working with the last good copy.
    if (!last.body) { res.setHeader("Cache-Control", "no-store"); return res.status(502).send("/* product list unavailable */"); }
  }
  // ?photos=1: the order-photo lookup table on its own (the product list no longer carries it).
  if (req.query && req.query.photos) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800");
    return res.status(200).send(JSON.stringify(last.photos || []));
  }
  let out = last.body;
  try {
    const map = await liveStock();
    const m = map && map.size > 50 && /RS_PRODUCTS\s*=\s*\[/.exec(out);
    if (m) {
      const start = m.index + m[0].length - 1, { list, end } = readArray(out, start);
      const kept = list && applyStock(list, map), oh = l => l.filter(p => p.kind !== "preorder").length;
      // Safety: if the check would hide more than a third of the on-hand pieces, something is off; send the backend copy.
      if (kept && oh(kept) >= oh(list) * 2 / 3) out = out.slice(0, start) + JSON.stringify(kept) + out.slice(end);
    }
  } catch (e) { /* stock check failed: send the backend copy as is */ }
  // A live listing always wins over an old sold-out copy with the same id (soldout.js); SOLDOUT is filtered whenever soldout.js sets it, even an old cached copy.
  if (!/json/.test(last.type)) out += ";" + DROP_SOLD_DUPES;
  res.setHeader("Content-Type", (/json/.test(last.type) ? "application/json" : "application/javascript") + "; charset=utf-8");
  // Browsers keep it briefly; Place Order re-checks stock with a no-store fetch, so sold-out items still can't be bought.
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=15, stale-while-revalidate=86400");
  return res.status(200).send(out);
}

const DROP_SOLD_DUPES = "(function(){var P=window.RS_PRODUCTS;if(!P)return;var l=new Set(P.map(function(p){return p.id})),f=function(S){return S&&S.filter?S.filter(function(r){return !l.has(r[0])}):S},v=f(window.SOLDOUT);try{Object.defineProperty(window,\"SOLDOUT\",{configurable:true,get:function(){return v},set:function(S){v=f(S)}})}catch(e){window.SOLDOUT=v}})();";

// Listing photos go through /img (api/img.js, cached a year on Vercel) instead of straight from Supabase, which sends them
// with "no-cache" (every page view downloaded them again and used up the Supabase free quota).
function viaCdn(body) {
  const SB = process.env.SUPABASE_URL;
  return SB ? body.split(SB.replace(/\/+$/, "") + "/storage/v1/object/public/listing-photos/").join("https://regal-spritz-os.vercel.app/img/") : body;
}

// Takes RS_PRODUCTS[0]._photos (about 530 KB of order-photo rows) out of the product list; returns it separately.
function splitPhotos(body) {
  const m = /RS_PRODUCTS\s*=\s*\[/.exec(body);
  if (!m) return { body, photos: [] };
  const start = m.index + m[0].length - 1, { list, end } = readArray(body, start);
  if (!list || !list[0] || !("_photos" in list[0])) return { body, photos: [] };
  const photos = list[0]._photos || [];
  delete list[0]._photos;
  return { body: body.slice(0, start) + JSON.stringify(list) + body.slice(end), photos };
}

// Reads the JSON array that starts at body[start] ("["); returns the list and where it ends.
function readArray(body, start) {
  let depth = 0, str = false;
  for (let i = start; i < body.length; i++) {
    const c = body[i];
    if (str) { if (c === "\\") i++; else if (c === '"') str = false; continue; }
    if (c === '"') str = true; else if (c === "[" || c === "{") depth++;
    else if ((c === "]" || c === "}") && --depth === 0) return { list: JSON.parse(body.slice(start, i + 1)), end: i + 1 };
  }
  return { list: null, end: start };
}
