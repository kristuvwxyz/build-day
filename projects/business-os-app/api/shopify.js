// Passes the app's Shopify requests to the Shopify Admin API, for signed-in team members only.
// Secrets stay here on the server (Vercel environment variables), never in the browser.
const API_VERSION = "2025-07";
// Only the requests the app actually makes are allowed through.
const ALLOWED = new Set(["RSOpenOrders", "RSOrderStatus", "RSByName", "RSFO", "RSShip", "RSRelease", "RSRev"]);
let cached = { token: "", exp: 0 };

async function shopToken(shop) {
  if (process.env.SHOPIFY_ADMIN_TOKEN) return process.env.SHOPIFY_ADMIN_TOKEN;
  if (cached.token && Date.now() < cached.exp) return cached.token;
  const r = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: process.env.SHOPIFY_CLIENT_ID || "", client_secret: process.env.SHOPIFY_CLIENT_SECRET || "" }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error("Shopify sign-in failed: " + (j.error_description || j.error || r.status));
  cached = { token: j.access_token, exp: Date.now() + Math.max(60, (j.expires_in || 86399) - 300) * 1000 };
  return cached.token;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const SB = process.env.SUPABASE_URL, ANON = process.env.SUPABASE_ANON_KEY;
  const shop = process.env.SHOPIFY_SHOP || "tjs1uz-4a.myshopify.com";
  if (!SB || !ANON) return res.status(503).json({ error: "Supabase isn't set up in Vercel yet." });
  if (!process.env.SHOPIFY_ADMIN_TOKEN && !(process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET)) return res.status(503).json({ error: "Shopify isn't connected yet. Add the Shopify keys in Vercel." });

  // 1. Who is asking? Must be signed in and in the team directory.
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ error: "Sign in again." });
  const head = { Authorization: auth, apikey: ANON, "Content-Type": "application/json" };
  const who = await fetch(`${SB}/auth/v1/user`, { headers: head });
  if (!who.ok) return res.status(401).json({ error: "Sign in again." });
  const mem = await fetch(`${SB}/rest/v1/rpc/is_member`, { method: "POST", headers: head, body: "{}" });
  if (!mem.ok || (await mem.json()) !== true) return res.status(403).json({ error: "Only team members can use Shopify." });

  // 2. Is it one of the app's own requests?
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const input = body.input || {}, q = String(input.query || "");
  const m = /^\s*(query|mutation)\s+([A-Za-z0-9_]+)/.exec(q);
  if (!m || !ALLOWED.has(m[2])) return res.status(400).json({ error: "That Shopify request isn't allowed." });

  // 3. Ask Shopify.
  try {
    const token = await shopToken(shop);
    const r = await fetch(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      body: JSON.stringify({ query: q, variables: input.variables || {} }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) cached = { token: "", exp: 0 };
    return res.status(r.ok ? 200 : 502).json(r.ok ? j : { error: "Shopify said " + r.status, details: j });
  } catch (e) {
    return res.status(502).json({ error: String(e.message || e) });
  }
}
