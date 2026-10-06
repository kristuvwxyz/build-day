// Saves a copy of a listing photo in our own Supabase Storage (bucket "listing-photos", public), so photos don't depend on
// WebCake / Shopify image servers. Team members only. Send { url } to copy a photo from the web, or { data } (a data: URL) for an upload.
// Answers { ok, url } with the photo's permanent public address. Same picture twice = same file (named by its content).
import { createHash } from "crypto";

const BUCKET = "listing-photos";
const HOSTS = /(^|\.)(pancake\.vn|shopify\.com|fimgs\.net|fragrantica\.com|regalspritz\.com|googleusercontent\.com)$/i;
const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const MAX = 8 * 1024 * 1024;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  const SB = process.env.SUPABASE_URL, ANON = process.env.SUPABASE_ANON_KEY;
  if (!SB || !ANON) return res.status(503).json({ ok: false, error: "Supabase isn't set up in Vercel yet." });

  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ ok: false, error: "Sign in again." });
  const head = { Authorization: auth, apikey: ANON };
  const mem = await fetch(`${SB}/rest/v1/rpc/is_member`, { method: "POST", headers: { ...head, "Content-Type": "application/json" }, body: "{}" });
  if (!mem.ok || (await mem.json()) !== true) return res.status(403).json({ ok: false, error: "Only team members can save photos." });

  let body; try { body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {}); } catch (e) { return res.status(400).json({ ok: false, error: "Send JSON." }); }
  let buf, type;
  try {
    if (typeof body.data === "string") {
      const m = /^data:(image\/[a-z]+);base64,(.+)$/i.exec(body.data);
      if (!m) return res.status(400).json({ ok: false, error: "That isn't a photo." });
      type = m[1].toLowerCase(); buf = Buffer.from(m[2], "base64");
    } else if (typeof body.url === "string") {
      let u; try { u = new URL(body.url); } catch (e) { return res.status(400).json({ ok: false, error: "Bad photo link." }); }
      if (u.protocol !== "https:" || !HOSTS.test(u.hostname)) return res.status(400).json({ ok: false, error: "Photos can only be copied from the website's image servers." });
      const r = await fetch(u.href, { redirect: "follow" });
      if (!r.ok) return res.status(502).json({ ok: false, error: `Couldn't download the photo (${r.status}).`, gone: r.status === 404 || r.status === 410 });
      type = String(r.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      buf = Buffer.from(await r.arrayBuffer());
    } else return res.status(400).json({ ok: false, error: "Send a photo." });
  } catch (e) { return res.status(502).json({ ok: false, error: "Couldn't read the photo." }); }
  if (!TYPES[type]) return res.status(400).json({ ok: false, error: "Only JPG, PNG, WebP or GIF photos." });
  if (!buf.length || buf.length > MAX) return res.status(400).json({ ok: false, error: "The photo is empty or bigger than 8 MB." });

  const path = `listings/${createHash("sha256").update(buf).digest("hex").slice(0, 32)}.${TYPES[type]}`;
  const up = await fetch(`${SB}/storage/v1/object/${BUCKET}/${path}`, { method: "POST", headers: { ...head, "Content-Type": type, "x-upsert": "true", "Cache-Control": "max-age=31536000" }, body: buf });
  if (!up.ok) { const t = await up.text().catch(() => ""); return res.status(502).json({ ok: false, error: "Couldn't save the photo" + (t ? ": " + t.slice(0, 120) : ".") }); }
  return res.status(200).json({ ok: true, url: `${SB}/storage/v1/object/public/${BUCKET}/${path}` });
}
