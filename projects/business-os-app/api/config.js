// Gives the browser the public Supabase address and public (anon) key. Both are safe to share.
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ url: process.env.SUPABASE_URL || "", anonKey: process.env.SUPABASE_ANON_KEY || "" });
}
