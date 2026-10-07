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
      if (!document.getElementById("rs-login-css")) { const st = document.createElement("style"); st.id = "rs-login-css"; st.textContent = CSS; document.head.appendChild(st); }
      const box = document.createElement("div"); box.id = "rs-login"; document.body.appendChild(box);
      let mode = "password", sentTo = "", busy = false;
      const esc = v => String(v || "").replace(/[<>&"]/g, "");
      const draw = (msg = "", err = "") => {
        box.innerHTML = `<form class="card" novalidate>
          <div><h1>Regal Spritz PH</h1><small>Team workspace</small></div>
          ${sentTo ? `<div class="msg">We emailed <b>${esc(sentTo)}</b>. Tap <b>Sign in</b> in that email on this device, or type the code if the email shows one.</div>
            <label for="rs-code">Code (if your email has one)</label><input id="rs-code" class="code" inputmode="numeric" autocomplete="one-time-code" maxlength="8">
            <button type="submit">Sign in</button><button type="button" class="alt" data-x="back">Back</button>`
          : `<div class="seg"><button type="button" data-m="password" aria-pressed="${mode === "password"}">Password</button><button type="button" data-m="link" aria-pressed="${mode === "link"}">Email me a link</button></div>
            <label for="rs-id">Work email</label><input id="rs-id" type="email" placeholder="you@email.com" autocomplete="username" required>
            ${mode === "password" ? `<label for="rs-pw">Password</label><input id="rs-pw" type="password" autocomplete="current-password" required>
            <button type="submit">Sign in</button><div class="msg">First time? Use the temporary password from your manager. You'll choose your own next.</div>`
            : `<button type="submit">Email me a sign-in link</button><div class="msg">Use the email listed for you in the team directory.</div>`}`}
          ${msg || note ? `<div class="msg">${msg || note}</div>` : ""}${err ? `<div class="err">${err}</div>` : ""}</form>`;
        const f = box.querySelector("input"); if (f) f.focus();
      };
      box.addEventListener("click", e => {
        const m = e.target.closest("[data-m]"); if (m) { mode = m.dataset.m; draw(); }
        if (e.target.closest("[data-x=back]")) { sentTo = ""; draw(); }
      });
      box.addEventListener("submit", async e => {
        e.preventDefault(); if (busy) return; busy = true;
        try {
          if (sentTo) {
            const token = box.querySelector("#rs-code").value.replace(/\s/g, "");
            if (!token) { busy = false; return draw("Tap the link in the email, or type the code here."); }
            const { data, error } = await sb.auth.verifyOtp({ email: sentTo, token, type: "email" });
            if (error) throw error;
            box.remove(); resolve(data.session);
          } else {
            const email = box.querySelector("#rs-id").value.trim().toLowerCase();
            if (!email) { busy = false; return draw("", "Type your email."); }
            if (mode === "password") {
              const { data, error } = await sb.auth.signInWithPassword({ email, password: box.querySelector("#rs-pw").value });
              if (error) throw error;
              box.remove(); resolve(data.session);
            } else {
              const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: location.origin + "/" } });
              if (error) throw error;
              sentTo = email; draw();
            }
          }
        } catch (err) {
          const m = String((err && err.message) || err);
          draw("", /invalid login|credentials/i.test(m) ? "Wrong email or password. Check with your manager, or use “Email me a link”." : /expired|invalid/i.test(m) ? "That code is wrong or expired. Try again or ask for a new link." : /rate|seconds|limit/i.test(m) ? "Too many emails sent just now. Use your password, or try again in an hour." : m);
        }
        busy = false;
      });
      // signed in from the email link (in this tab or another one on this device)
      const { data: sub } = sb.auth.onAuthStateChange((ev, s) => { if (s && box.isConnected) { box.remove(); sub.subscription.unsubscribe(); resolve(s); } });
      draw();
    });
  }
  // First sign-in with a temporary password: choose your own.
  function newPasswordScreen(sb) {
    return new Promise(resolve => {
      if (!document.getElementById("rs-login-css")) { const st = document.createElement("style"); st.id = "rs-login-css"; st.textContent = CSS; document.head.appendChild(st); }
      const box = document.createElement("div"); box.id = "rs-login"; document.body.appendChild(box);
      const draw = (err = "") => {
        box.innerHTML = `<form class="card" novalidate><div><h1>Welcome!</h1><small>Choose your own password</small></div>
          <label for="rs-np">New password (at least 8 characters)</label><input id="rs-np" type="password" autocomplete="new-password" minlength="8" required>
          <label for="rs-np2">Type it again</label><input id="rs-np2" type="password" autocomplete="new-password" required>
          <button type="submit">Save and continue</button>${err ? `<div class="err">${err}</div>` : ""}</form>`;
        box.querySelector("input").focus();
      };
      box.addEventListener("submit", async e => {
        e.preventDefault();
        const a = box.querySelector("#rs-np").value, b = box.querySelector("#rs-np2").value;
        if (a.length < 8) return draw("Use at least 8 characters.");
        if (a !== b) return draw("The two passwords don't match.");
        const { error } = await sb.auth.updateUser({ password: a, data: { temp: false } });
        if (error) return draw(String(error.message || error));
        box.remove(); resolve();
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
    if (session.user && session.user.user_metadata && session.user.user_metadata.temp) await newPasswordScreen(sb);
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
    const put = (p, data) => { const c = colOf(parentOf(p)); c.ver = (c.ver || 0) + 1; if (data === undefined) c.rows.delete(leafOf(p)); else c.rows.set(leafOf(p), data); };
    async function loadCol(c) {
      const x = colOf(c); if (x.loading) return x.loading;
      x.loading = (async () => {
        // Big collections (Orders has ~9,000) load 4 pages of 1,000 at a time instead of one after another.
        const page = 1000, get = from => sb.from("docs").select("id,data").eq("col", c).order("id").range(from, from + page - 1);
        const first = await get(0); if (first.error) throw first.error; first.data.forEach(r => x.rows.set(r.id, r.data));
        for (let from = page, more = first.data.length === page; more; from += page * 4) {
          const res = await Promise.all([0, 1, 2, 3].map(k => get(from + k * page)));
          for (const { data, error } of res) { if (error) throw error; data.forEach(r => x.rows.set(r.id, r.data)); if (data.length < page) more = false; }
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
      async get() { if (parentOf(p) !== "invfiles") await loadCol(parentOf(p)).catch(() => {}); // invoice file pieces load one by one
        if (docVal(p) === undefined) { const { data } = await sb.from("docs").select("data").eq("path", p).maybeSingle(); if (data) put(p, data.data); } return snapD(p); },
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
      // re-read every loaded collection and watched doc from the server (catches anything the live channel missed)
      async _refresh() {
        await Promise.all([...cols].filter(([, x]) => x.loaded && !x.refreshing).map(async ([c, x]) => {
          x.refreshing = true; const ver = x.ver || 0, fresh = new Map();
          try {
            for (let from = 0; ; from += 1000) {
              const { data, error } = await sb.from("docs").select("id,data").eq("col", c).order("id").range(from, from + 999);
              if (error) return; data.forEach(r => fresh.set(r.id, r.data)); if (data.length < 1000) break;
            }
            if ((x.ver || 0) !== ver || JSON.stringify([...fresh]) === JSON.stringify([...x.rows])) return; // a local write landed meanwhile, or nothing changed
            x.rows = fresh; x.subs.forEach(f => { try { f(snapC(c)); } catch (e) { console.error(e); } });
            docs.forEach((d, p) => { if (parentOf(p) === c) d.subs.forEach(f => { try { f(snapD(p)); } catch (e) { console.error(e); } }); });
          } finally { x.refreshing = false; }
        }));
      },
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
    // Website orders (regalspritz.com), through our /api/site server route.
    async site() {
      const { sb } = await ready;
      const call = async body => {
        const { data: { session } } = await sb.auth.getSession();
        const r = await fetch("/api/site", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (session && session.access_token) }, body: JSON.stringify(body) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok && !j.error) j.error = "Website request failed (" + r.status + ")";
        return j;
      };
      return { list: o => call({ action: "list", ...(o || {}) }), update: (ref, patch) => call({ action: "update", ref, ...(patch || {}) }), nextNumber: () => call({ action: "nextOrderNumber" }), pushProducts: products => call({ action: "pushProducts", products }), statuses: orders => call({ action: "statuses", orders }), email: m => call({ action: "email", ...(m || {}) }),
        // Notes and accords from a Fragrantica page (our /api/fragrantica server route).
        fragrantica: async url => { const { data: { session } } = await sb.auth.getSession(); const r = await fetch("/api/fragrantica", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (session && session.access_token) }, body: JSON.stringify({ url }) }); const j = await r.json().catch(() => ({})); if (!r.ok && !j.error) j.error = "Fragrantica request failed (" + r.status + ")"; return j; } };
    },
    // Listing photos saved in our own storage (our /api/photo server route): save({ url }) copies one from the web, save({ data }) stores an upload.
    async photos() {
      const { sb } = await ready;
      return { save: async src => { const { data: { session } } = await sb.auth.getSession();
        const r = await fetch("/api/photo", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (session && session.access_token) }, body: JSON.stringify(src || {}) });
        const j = await r.json().catch(() => ({})); if (!r.ok && !j.error) j.error = "Photo request failed (" + r.status + ")"; return j; } };
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
  // "Install app" button for Chrome / Edge on Windows, Mac, Android and Chromebook.
  // Safari (iPhone, iPad, Mac) has no install prompt: use Share → Add to Home Screen / Add to Dock.
  let installEvt = null;
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault(); installEvt = e;
    if (document.getElementById("rs-install")) return;
    const b = document.createElement("button");
    b.id = "rs-install"; b.type = "button"; b.textContent = "⬇ Install app";
    b.style.cssText = "position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:80;padding:10px 16px;border:0;border-radius:999px;background:#4A2545;color:#fff;font:600 14px system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer";
    if (matchMedia("(max-width: 720px)").matches) b.style.bottom = "calc(80px + env(safe-area-inset-bottom))";
    b.onclick = async () => { if (!installEvt) return; installEvt.prompt(); try { await installEvt.userChoice; } catch (err) {} installEvt = null; b.remove(); };
    document.body.appendChild(b);
  });
  window.addEventListener("appinstalled", () => { const b = document.getElementById("rs-install"); if (b) b.remove(); });
})();
