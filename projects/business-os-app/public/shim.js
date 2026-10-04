/* Regal Spritz PH standalone: gives the app the same window.claude.use(...) features it has on claude.ai,
   backed by Supabase (database + sign-in with one-time codes) and our own /api/shopify server route. */
(function () {
  "use strict";
  window.RS_STANDALONE = true;
  const $ = s => document.querySelector(s);
  const clone = v => v == null ? v : JSON.parse(JSON.stringify(v));
  const parentOf = p => p.replace(/\/[^/]+$/, "");
  const leafOf = p => p.replace(/^.*\//, "");

  /* ---------- sign-in screen ---------- */
  const CSS = `#rs-login{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:16px;background:radial-gradient(120% 120% at 100% 0%,rgba(217,185,138,.35),transparent 55%),linear-gradient(135deg,#3A1C36,#4A2545 55%,#6B4A3E);font:15px/1.5 Manrope,system-ui,sans-serif;color:#231A23}
  #rs-login .card{width:100%;max-width:380px;background:#fff;border-radius:18px;padding:28px 24px;box-shadow:0 20px 60px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:14px}
  #rs-login h1{font-family:Marcellus,Georgia,serif;font-weight:400;font-size:28px;margin:0;color:#4A2545}
  #rs-login small{display:block;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#A9814A;margin-top:2px}
  #rs-login label{font-size:12px;font-weight:700;color:#6E636D}
  #rs-login input{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid #E2DCE2;border-radius:12px;font:inherit;background:#F7F5F7}
  #rs-login button{padding:12px 14px;border-radius:12px;border:1px solid #4A2545;background:#4A2545;color:#fff;font:inherit;font-weight:700;cursor:pointer}
  #rs-login button.alt{background:none;color:#4A2545;border-color:#E2DCE2}
  #rs-login .seg{display:flex;gap:4px;background:#F0ECF0;border-radius:10px;padding:3px}
  #rs-login .seg button{flex:1;padding:7px;border:0;background:none;color:#6E636D;font-weight:600}
  #rs-login .seg button[aria-pressed=true]{background:#fff;color:#231A23}
  #rs-login .msg{font-size:13px;color:#6E636D}#rs-login .err{font-size:13px;color:#B3261E}
  #rs-login .code{letter-spacing:.4em;text-align:center;font-size:22px;font-weight:700}`;
  function loginScreen(sb, note) {
    return new Promise(resolve => {
      const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
      const box = document.createElement("div"); box.id = "rs-login"; document.body.appendChild(box);
      let mode = "email", sentTo = "", busy = false;
      const draw = (msg = "", err = "") => {
        box.innerHTML = `<form class="card" novalidate>
          <div><h1>Regal Spritz PH</h1><small>The Scent Atelier</small></div>
          ${sentTo ? `<div class="msg">We sent a 6-digit code to <b>${sentTo.replace(/[<>&]/g, "")}</b>. It expires in a few minutes.</div>
            <label for="rs-code">Code</label><input id="rs-code" class="code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" required>
            <button type="submit">Sign in</button><button type="button" class="alt" data-x="back">Use a different ${mode === "phone" ? "number" : "email"}</button>`
          : `<div class="seg"><button type="button" data-m="email" aria-pressed="${mode === "email"}">Email</button><button type="button" data-m="phone" aria-pressed="${mode === "phone"}">Mobile number</button></div>
            <label for="rs-id">${mode === "phone" ? "Mobile number" : "Work email"}</label>
            <input id="rs-id" ${mode === "phone" ? 'type="tel" inputmode="tel" placeholder="09XX XXX XXXX" autocomplete="tel"' : 'type="email" placeholder="you@email.com" autocomplete="email"'} required>
            <button type="submit">Send me a code</button>
            <div class="msg">Use the ${mode === "phone" ? "number" : "email"} listed for you in the team directory.</div>`}
          ${msg || note ? `<div class="msg">${msg || note}</div>` : ""}${err ? `<div class="err">${err}</div>` : ""}</form>`;
        const f = box.querySelector("input"); if (f) f.focus();
      };
      const phoneE164 = v => { let d = v.replace(/\D/g, ""); if (d.startsWith("0")) d = "63" + d.slice(1); if (d.length === 10 && d.startsWith("9")) d = "63" + d; return "+" + d; };
      box.addEventListener("click", e => {
        const m = e.target.closest("[data-m]"); if (m) { mode = m.dataset.m; draw(); }
        if (e.target.closest("[data-x=back]")) { sentTo = ""; draw(); }
      });
      box.addEventListener("submit", async e => {
        e.preventDefault(); if (busy) return; busy = true;
        try {
          if (!sentTo) {
            const v = box.querySelector("#rs-id").value.trim(); if (!v) { busy = false; return draw("", "Type your " + (mode === "phone" ? "mobile number." : "email.")); }
            const who = mode === "phone" ? { phone: phoneE164(v) } : { email: v.toLowerCase() };
            const { error } = await sb.auth.signInWithOtp({ ...who, options: { shouldCreateUser: true } });
            if (error) throw error;
            sentTo = who.phone || who.email; draw();
          } else {
            const token = box.querySelector("#rs-code").value.replace(/\s/g, "");
            const { data, error } = await sb.auth.verifyOtp(mode === "phone" ? { phone: sentTo, token, type: "sms" } : { email: sentTo, token, type: "email" });
            if (error) throw error;
            box.remove(); resolve(data.session);
          }
        } catch (err) {
          const m = String((err && err.message) || err);
          draw("", /sms|phone provider/i.test(m) ? "Text-message codes aren't switched on yet. Use your email for now." : /expired|invalid/i.test(m) ? "That code is wrong or expired. Try again or request a new one." : /rate|seconds/i.test(m) ? "Please wait a minute before asking for another code." : m);
        }
        busy = false;
      });
      draw();
    });
  }

  /* ---------- start-up: config, client, session ---------- */
  const ready = (async () => {
    const cfg = await fetch("/api/config").then(r => r.json());
    if (!cfg.url || !cfg.anonKey) throw new Error("App isn't set up yet: add SUPABASE_URL and SUPABASE_ANON_KEY in Vercel.");
    const sb = window.supabase.createClient(cfg.url, cfg.anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
    let { data: { session } } = await sb.auth.getSession();
    if (!session) { await new Promise(r => (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", r) : r())); session = await loginScreen(sb); }
    const user = session.user;
    const [{ data: owner }, { data: mem }] = await Promise.all([sb.rpc("owner_email"), sb.rpc("my_member")]);
    const email = (user.email || "").toLowerCase();
    const isOwner = !!owner && !!email && owner.toLowerCase() === email;
    const memEmail = mem && String(mem.email || "").split(/[\s,;]+/).filter(Boolean)[0];
    const me = { id: user.id, name: (mem && mem.name) || "", email: email || (memEmail || "").toLowerCase() || null, isOwner, canEdit: isOwner || ["CEO", "ADMIN"].includes(mem && mem.department), avatarUrl: "", color: "#4A2545" };
    sb.auth.onAuthStateChange(ev => { if (ev === "SIGNED_OUT") location.reload(); });
    return { sb, me, cfg };
  })();
  ready.catch(e => { document.addEventListener("DOMContentLoaded", () => { document.body.insertAdjacentHTML("afterbegin", `<div style="padding:16px;background:#FBE4E2;color:#B3261E;font:14px system-ui">${String(e.message || e)}</div>`); }); });

  /* ---------- database (same shape the app uses on claude.ai) ---------- */
  function makeDb(sb, me) {
    const cols = new Map();   // col -> { rows: Map(id -> data), loaded, subs:Set }
    const docs = new Map();   // path -> { subs:Set }
    const colOf = c => { if (!cols.has(c)) cols.set(c, { rows: new Map(), loaded: false, subs: new Set() }); return cols.get(c); };
    const snapC = c => { const x = colOf(c); return { docs: [...x.rows].map(([id, d]) => ({ id, data: () => clone(d) })), size: x.rows.size, empty: !x.rows.size }; };
    const docVal = p => { const c = cols.get(parentOf(p)); return c ? c.rows.get(leafOf(p)) : undefined; };
    const snapD = p => { const d = docVal(p); return { id: leafOf(p), exists: d !== undefined, data: () => clone(d) }; };
    const emit = p => {
      const c = cols.get(parentOf(p)); if (c && c.loaded) c.subs.forEach(f => { try { f(snapC(parentOf(p))); } catch (e) { console.error(e); } });
      const d = docs.get(p); if (d) d.subs.forEach(f => { try { f(snapD(p)); } catch (e) { console.error(e); } });
    };
    const put = (p, data) => { const c = colOf(parentOf(p)); if (data === undefined) c.rows.delete(leafOf(p)); else c.rows.set(leafOf(p), data); };
    async function loadCol(c) {
      const x = colOf(c); if (x.loading) return x.loading;
      x.loading = (async () => {
        let from = 0; const page = 1000;
        for (;;) {
          const { data, error } = await sb.from("docs").select("id,data").eq("col", c).order("id").range(from, from + page - 1);
          if (error) throw error;
          data.forEach(r => x.rows.set(r.id, r.data));
          if (data.length < page) break; from += page;
        }
        x.loaded = true;
      })();
      return x.loading;
    }
    // one live channel for everything
    sb.channel("rs-docs").on("postgres_changes", { event: "*", schema: "public", table: "docs" }, ch => {
      const p = (ch.new && ch.new.path) || (ch.old && ch.old.path); if (!p) return;
      const c = cols.get(parentOf(p)); if (!c && !docs.has(p)) return;
      put(p, ch.eventType === "DELETE" ? undefined : ch.new.data); emit(p);
    }).subscribe();
    const fail = e => { const err = { code: /row-level security|permission|42501/i.test((e && (e.message || e.code)) || "") ? "permission_denied" : "unavailable", message: (e && e.message) || String(e) }; throw err; };
    const docRef = p => ({
      id: leafOf(p), path: p,
      async get() { await loadCol(parentOf(p)).catch(() => {}); if (docVal(p) === undefined) { const { data } = await sb.from("docs").select("data").eq("path", p).maybeSingle(); if (data) put(p, data.data); } return snapD(p); },
      onSnapshot(next, error) {
        if (!docs.has(p)) docs.set(p, { subs: new Set() }); docs.get(p).subs.add(next);
        sb.from("docs").select("data").eq("path", p).maybeSingle().then(({ data, error: e }) => { if (e) { error && error(e); return; } put(p, data ? data.data : undefined); next(snapD(p)); });
        return () => docs.get(p).subs.delete(next);
      },
      async set(data) { if (parentOf(p) === "accessreq") data = { ...data, email: me.email || "", name: me.name || "" }; const { error } = await sb.from("docs").upsert({ path: p, col: parentOf(p), id: leafOf(p), data: clone(data), updated_at: new Date().toISOString() }); if (error) fail(error); put(p, clone(data)); emit(p); },
      async update(patch) { const { error } = await sb.rpc("doc_merge", { p_path: p, p_patch: clone(patch) }); if (error) fail(error); put(p, { ...(docVal(p) || {}), ...clone(patch) }); emit(p); },
      async delete() { const { error } = await sb.from("docs").delete().eq("path", p); if (error) fail(error); put(p, undefined); emit(p); },
      collection: c => colRef(p + "/" + c),
    });
    const colRef = c => ({
      id: leafOf(c), path: c,
      doc: id => docRef(c + "/" + id),
      async get() { await loadCol(c); return snapC(c); },
      onSnapshot(next, error) { const x = colOf(c); x.subs.add(next); loadCol(c).then(() => next(snapC(c)), e => error && error(e)); return () => x.subs.delete(next); },
      where() { return this; }, orderBy() { return this; }, limit() { return this; },
    });
    return {
      collection: colRef, doc: docRef,
      // fast restore for backups: [{ path, data }]
      async _bulkSet(rows, onProgress) {
        for (let i = 0; i < rows.length; i += 400) {
          const chunk = rows.slice(i, i + 400).map(r => ({ path: r.path, col: parentOf(r.path), id: leafOf(r.path), data: r.data, updated_at: new Date().toISOString() }));
          const { error } = await sb.from("docs").upsert(chunk); if (error) fail(error);
          chunk.forEach(r => put(r.path, r.data)); onProgress && onProgress(Math.min(rows.length, i + 400), rows.length);
        }
        new Set(rows.map(r => parentOf(r.path))).forEach(c => { const x = cols.get(c); if (x && x.loaded) x.subs.forEach(f => f(snapC(c))); });
      },
      _cached: c => cols.get(c),
    };
  }

  /* ---------- the features the app asks for ---------- */
  let dbInst = null;
  const getDb = async () => { const { sb, me } = await ready; return dbInst || (dbInst = makeDb(sb, me)); };
  const caps = {
    async db() { return getDb(); },
    async user() {
      const { me } = await ready; const db = await getDb();
      const prof = id => { const r = db._cached("accessreq"), d = r && r.rows.get(id); return { id, name: (d && d.name) || "", email: (d && d.email) || null, avatarUrl: "", color: "#4A2545", isMe: id === me.id, guest: false }; };
      return {
        me: async () => ({ ...me }), id: async () => me.id, name: async () => me.name, email: async () => me.email,
        isOwner: async () => me.isOwner, canEdit: async () => me.canEdit, can: async () => true,
        profiles: async ids => Object.fromEntries([].concat(ids).map(id => [id, prof(id)])),
        search: async () => [], avatarUrl: async () => null,
      };
    },
    async downloads() {
      return { async save({ filename, data }) { const blob = data instanceof Blob ? data : new Blob([data], { type: /\.csv$/i.test(filename) ? "text/csv" : /\.json$/i.test(filename) ? "application/json" : "text/plain" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); return { saved: true }; } };
    },
    async mcp() {
      const { sb } = await ready;
      const callTool = async (server, tool, input) => {
        const { data: { session } } = await sb.auth.getSession();
        const r = await fetch("/api/shopify", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (session && session.access_token) }, body: JSON.stringify({ tool, input }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw { code: r.status === 401 ? "needs_reauth" : r.status === 403 ? "blocked_by_policy" : r.status === 503 ? "server_not_connected" : "tool_error", message: j.error || "Shopify request failed (" + r.status + ")" };
        return { payload: j };
      };
      return { callTool, server: async () => ({ graphql_query: i => callTool("Shopify", "graphql_query", i).then(r => r.payload), graphql_mutation: i => callTool("Shopify", "graphql_mutation", i).then(r => r.payload) }) };
    },
  };
  window.claude = { use: name => (caps[name] ? caps[name]() : Promise.resolve(null)) };

  // "Sign out of Claude" means sign out of this app here.
  document.addEventListener("click", async e => {
    const a = e.target.closest('a[href*="claude.ai/logout"]'); if (!a) return;
    e.preventDefault(); const { sb } = await ready; await sb.auth.signOut(); location.reload();
  }, true);

  // Installable app (works offline for the app shell)
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
})();
