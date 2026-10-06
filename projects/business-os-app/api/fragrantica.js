// Reads a perfume's notes (top / heart / base) and main accords from its Fragrantica page, for RS OS Listings.
// Signed-in team members only, and only fragrantica.* links are fetched.
// Fragrantica sometimes blocks servers. Then RS OS asks the user to paste the page text instead (same parsing, in the browser).

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  const SB = process.env.SUPABASE_URL, ANON = process.env.SUPABASE_ANON_KEY;
  if (!SB || !ANON) return res.status(503).json({ ok: false, error: "Supabase isn't set up in Vercel yet." });

  let body; try { body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {}); } catch (e) { return res.status(400).json({ ok: false, error: "Send JSON." }); }
  let url; try { url = new URL(String(body.url || "").trim()); } catch (e) { return res.status(400).json({ ok: false, error: "That isn't a link." }); }
  if (url.protocol !== "https:" || !/(^|\.)fragrantica\.[a-z.]{2,6}$/i.test(url.hostname)) return res.status(400).json({ ok: false, error: "Use a fragrantica.com perfume link." });

  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ ok: false, error: "Sign in again." });
  const head = { Authorization: auth, apikey: ANON, "Content-Type": "application/json" };
  const who = await fetch(`${SB}/auth/v1/user`, { headers: head });
  if (!who.ok) return res.status(401).json({ ok: false, error: "Sign in again." });
  const mem = await fetch(`${SB}/rest/v1/rpc/is_member`, { method: "POST", headers: head, body: "{}" });
  if (!mem.ok || (await mem.json()) !== true) return res.status(403).json({ ok: false, error: "Only team members can do this." });

  try {
    const r = await fetch(url.href, { redirect: "follow", headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml", "Accept-Language": "en-US,en;q=0.9" } });
    const html = await r.text();
    if (!r.ok) return res.status(200).json({ ok: false, blocked: true, error: "Fragrantica didn't let us in (" + r.status + ")." });
    const out = parseHtml(html);
    if (!out.accords.length && !out.notes.top.length && !out.notes.heart.length && !out.notes.base.length) return res.status(200).json({ ok: false, blocked: true, error: "Couldn't find notes on that page." });
    return res.status(200).json({ ok: true, ...out });
  } catch (e) {
    return res.status(200).json({ ok: false, blocked: true, error: "Couldn't reach Fragrantica." });
  }
}

const decode = s => s.replace(/&amp;/g, "&").replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (m, n) => String.fromCharCode(n));
const clean = s => decode(String(s || "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const uniq = a => [...new Set(a.filter(Boolean))];

function parseHtml(html) {
  const accords = uniq([...html.matchAll(/class="accord-bar"[^>]*>([\s\S]*?)<\/div>/gi)].map(m => cap(clean(m[1])))).slice(0, 15);
  // Notes are links to /notes/... pages. Split them by the "Top / Middle / Base Notes" headings.
  const start = Math.max(0, html.search(/id="pyramid"|Perfume Pyramid/i));
  const part = html.slice(start, start + 60000);
  const noteLinks = seg => uniq([...seg.matchAll(/<a[^>]+href="[^"]*\/notes\/[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)].map(m => clean(m[1]) || clean((/alt="([^"]*)"/i.exec(m[1]) || [])[1])));
  const at = re => { const m = re.exec(part); return m ? m.index : -1; };
  const iTop = at(/Top Notes/i), iMid = at(/(Middle|Heart) Notes/i), iBase = at(/Base Notes/i);
  // The last group ends at the next heading or the voting box.
  const end = i => { const m = /<h[1-4][\s>]|Vote for/i.exec(part.slice(i + 30)); return m ? i + 30 + m.index : part.length; };
  const slice = (a, b) => a < 0 ? "" : part.slice(a, b > a ? b : end(a));
  const notes = { top: [], heart: [], base: [] };
  if (iTop >= 0 || iMid >= 0 || iBase >= 0) {
    notes.top = noteLinks(slice(iTop, iMid > iTop ? iMid : iBase > iTop ? iBase : -1));
    notes.heart = noteLinks(slice(iMid, iBase > iMid ? iBase : -1));
    notes.base = noteLinks(slice(iBase, -1));
  } else notes.heart = noteLinks(part.slice(0, 15000));
  return { accords, notes, name: clean((/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html) || [])[1]).slice(0, 120) };
}
