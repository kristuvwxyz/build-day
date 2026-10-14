// Listing photos for the website, served through Vercel's CDN and cached for a year: https://regal-spritz-os.vercel.app/img/listings/<file>
// (/img/* is routed to /api/products?img=…; it lives there because the Hobby plan allows only 12 server functions.)
// Why: Supabase sends these photos with "no-cache", so every page view downloaded them again from Supabase, which used up the free quota
// (Oct 2026: 22.8 GB cached egress of 5 GB). Photo files are named by their content (api/photo.js), so a file never changes and
// caching it for a year is safe. /api/products rewrites the photo addresses to this one.
// Only the public listing-photos bucket; nothing else can be fetched through here.
const TYPES = /^image\/(jpeg|png|webp|gif)$/;

export async function serveImg(req, res) {
  const p = String((req.query && req.query.img) || "");
  if (!/^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*\.(jpe?g|png|webp|gif)$/i.test(p) || !process.env.SUPABASE_URL) {
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.status(404).send("Not found");
  }
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/public/listing-photos/${p}`);
    const type = (r.headers.get("content-type") || "").split(";")[0];
    if (!r.ok || !TYPES.test(type)) {
      // Missing photo: let the CDN remember that briefly, then try again.
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
      return res.status(r.status === 404 || r.status === 400 ? 404 : 502).send("Not found");
    }
    const body = Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable");
    return res.status(200).send(body);
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).send("Photo unavailable");
  }
}
