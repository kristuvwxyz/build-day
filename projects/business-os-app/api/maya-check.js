// Says whether Vercel's MAYA_PUBLIC_KEY is set and matches the backup key saved in Supabase (supabase/maya-key.sql).
// Shows only yes / no, never the keys.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const SB = process.env.SUPABASE_URL, ANON = process.env.SUPABASE_ANON_KEY, KEY = process.env.RS_BACKEND_KEY, V = (process.env.MAYA_PUBLIC_KEY || "").trim();
  let saved = "";
  if (SB && ANON && KEY) saved = await fetch(`${SB}/rest/v1/rpc/maya_key`, { method: "POST", headers: { apikey: ANON, Authorization: "Bearer " + ANON, "Content-Type": "application/json" }, body: JSON.stringify({ p_key: KEY }) }).then(r => r.ok ? r.json() : "").catch(() => "");
  saved = typeof saved === "string" ? saved.trim() : "";
  const out = { vercelKeySet: !!V, vercelKeyLooksRight: /^pk-/.test(V), savedKeySet: !!saved, sameKey: !!V && V === saved };
  out.answer = !V ? "MAYA_PUBLIC_KEY isn't in this deployment yet." : !out.vercelKeyLooksRight ? "The Vercel key doesn't start with pk- — it may be the secret key or have extra text." : out.sameKey ? "Same key as before. Maya links work (tested Oct 10)." : "Different key from the saved one. Make one Maya link in RS OS to confirm it works.";
  return res.status(200).json(out);
}
