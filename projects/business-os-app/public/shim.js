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
  /* ---------- on-device copy of the data (IndexedDB) ----------
     Opening RS OS shows the saved copy at once, then downloads only what changed. Cleared on sign out. */
  const CACHE_V = 1;
  let idbP = null;
  const idbOpen = () => idbP || (idbP = new Promise((res, rej) => {
    try { const r = indexedDB.open("rs-cache", 1); r.onupgradeneeded = () => r.result.createObjectStore("cols"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error("blocked")); } catch (e) { rej(e); }
  }));
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
  const idbDo = (mode, fn) => withTimeout(idbOpen().then(db => new Promise((res, rej) => { const t = db.transaction("cols", mode), q = fn(t.objectStore("cols")); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); })), 4000);
  const cacheGet = k => idbDo("readonly", st => st.get(k)).catch(() => null);
  const cachePut = (k, v) => idbDo("readwrite", st => st.put(v, k)).catch(() => {});
  const cacheClear = () => idbDo("readwrite", st => st.clear()).catch(() => {});

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
    sb.auth.onAuthStateChange(ev => { if (ev === "SIGNED_OUT") cacheClear().finally(() => location.reload()); });
    return { sb, me, cfg };
  })();
  ready.catch(e => { document.addEventListener("DOMContentLoaded", () => { document.body.insertAdjacentHTML("afterbegin", `<div style="padding:16px;background:#FBE4E2;color:#B3261E;font:14px system-ui">${String(e.message || e)}</div>`); }); });

  /* ---------- database (same shape the app uses on claude.ai) ---------- */
  function makeDb(sb, me) {
    const cols = new Map();   // col -> { rows: Map(id -> data), loaded, subs:Set, since: ms }
    const docs = new Map();   // path -> { subs:Set }
    const colOf = c => { if (!cols.has(c)) cols.set(c, { rows: new Map(), loaded: false, subs: new Set(), since: 0 }); return cols.get(c); };
    // Each row is copied once per change (not on every screen update): 9,000 orders stay quick.
    const cloned = new WeakMap();
    const cloneRow = d => { if (d === null || typeof d !== "object") return d; let v = cloned.get(d); if (!v) { v = clone(d); cloned.set(d, v); } return v; };
    const snapC = c => { const x = colOf(c); return { docs: [...x.rows].map(([id, d]) => ({ id, data: () => cloneRow(d) })), size: x.rows.size, empty: !x.rows.size }; };
    const docVal = p => { const c = cols.get(parentOf(p)); return c ? c.rows.get(leafOf(p)) : undefined; };
    const snapD = p => { const d = docVal(p); return { id: leafOf(p), exists: d !== undefined, data: () => clone(d) }; };
    const emitCol = c => { const x = cols.get(c); if (x && x.loaded) x.subs.forEach(f => { try { f(snapC(c)); } catch (e) { console.error(e); } }); };
    const emitDoc = p => { const d = docs.get(p); if (d) d.subs.forEach(f => { try { f(snapD(p)); } catch (e) { console.error(e); } }); };
    const emit = p => { emitCol(parentOf(p)); emitDoc(p); };
    // Changes from other people arrive in bursts: show them together (one screen update), within a fraction of a second.
    const pendC = new Set(), pendD = new Set(); let pendT = 0;
    const emitSoon = p => { pendC.add(parentOf(p)); if (docs.has(p)) pendD.add(p); if (!pendT) pendT = setTimeout(() => { pendT = 0; const cs = [...pendC], ds = [...pendD]; pendC.clear(); pendD.clear(); cs.forEach(emitCol); ds.forEach(emitDoc); }, 40); };
    // Saved copy on this device, written a few seconds after changes.
    const dirty = new Set(); let saveT = 0;
    const ckey = c => me.id + ":" + c;
    const flush = () => { clearTimeout(saveT); saveT = 0; const cs = [...dirty]; dirty.clear(); cs.forEach(c => { const x = cols.get(c); if (x && x.loaded && !NOCACHE.test(c)) cachePut(ckey(c), { v: CACHE_V, at: Date.now(), since: x.since, rows: [...x.rows] }); }); };
    const markDirty = c => { dirty.add(c); if (!saveT) saveT = setTimeout(flush, 20000); };
    const NOCACHE = /^invfiles|^accessreq/;
    let gSince = 0;  // newest server change time seen (ms)
    const seen = t => { const ms = typeof t === "number" ? t : Date.parse(t || ""); if (ms && ms <= Date.now() + 120e3) { if (ms > gSince) gSince = ms; return ms; } return 0; };
    const put = (p, data) => { const c = colOf(parentOf(p)); c.ver = (c.ver || 0) + 1; if (data === undefined) c.rows.delete(leafOf(p)); else c.rows.set(leafOf(p), data); markDirty(parentOf(p)); };
    const same = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);
    const SLACK = 120e3; // read a little before the last change time, so nothing is missed between devices
    let hasTomb = null;  // doc_deletes table (supabase/fast-sync.sql) remembers deletions
    async function tombsSince(c, fromIso) {
      if (hasTomb === false) return null;
      let q = sb.from("doc_deletes").select("path,col,at").gt("at", fromIso).limit(5000); if (c) q = q.eq("col", c);
      const { data, error } = await q; if (error) { hasTomb = false; return null; } hasTomb = true; return data;
    }
    // Rows of one collection changed since its last sync, plus deletions.
    async function deltaCol(c) {
      const x = colOf(c), from = new Date(Math.max(0, (x.since || 0) - SLACK)).toISOString();
      let changed = false, max = x.since || 0;
      for (let off = 0; ; off += 1000) {
        const { data, error } = await sb.from("docs").select("id,data,updated_at").eq("col", c).gt("updated_at", from).order("updated_at").range(off, off + 999);
        if (error) throw error;
        for (const r of data) { max = Math.max(max, seen(r.updated_at)); if (!same(x.rows.get(r.id), r.data)) { x.rows.set(r.id, r.data); changed = true; } }
        if (data.length < 1000) break;
      }
      const tomb = await tombsSince(c, from);
      if (tomb) { for (const t of tomb) { const id = leafOf(t.path); if (x.rows.has(id)) { x.rows.delete(id); changed = true; } } }
      else {
        // No deletion list on the server yet: compare ids (small) to drop rows deleted while this device was away.
        const ids = new Set();
        for (let off = 0; ; off += 1000) { const { data, error } = await sb.from("docs").select("id").eq("col", c).order("id").range(off, off + 999); if (error) throw error; data.forEach(r => ids.add(r.id)); if (data.length < 1000) break; }
        for (const id of [...x.rows.keys()]) if (!ids.has(id)) { x.rows.delete(id); changed = true; }
      }
      x.since = max;
      if (changed) { x.ver = (x.ver || 0) + 1; markDirty(c); emitCol(c); docs.forEach((d, p) => { if (parentOf(p) === c) emitDoc(p); }); }
      return changed;
    }
    async function loadCol(c) {
      const x = colOf(c); if (x.loading) return x.loading;
      x.loading = (async () => {
        const saved = NOCACHE.test(c) ? null : await cacheGet(ckey(c));
        if (saved && saved.v === CACHE_V && Array.isArray(saved.rows) && Date.now() - (saved.at || 0) < 25 * 864e5) {
          for (const [id, d] of saved.rows) if (!x.rows.has(id)) x.rows.set(id, d);
          x.since = saved.since || 0; seen(x.since); x.loaded = true;
          deltaCol(c).catch(() => {});   // show the saved copy now, then catch up in the background
          return;
        }
        // First time on this device: download everything. Big collections (Orders has ~9,000) load 4 pages of 1,000 at a time.
        let max = 0;
        const page = 1000, get = from => sb.from("docs").select("id,data,updated_at").eq("col", c).order("id").range(from, from + page - 1);
        const take = rows => rows.forEach(r => { if (!x.rows.has(r.id) || !x.ver) x.rows.set(r.id, r.data); max = Math.max(max, seen(r.updated_at)); });
        const first = await get(0); if (first.error) throw first.error; take(first.data);
        for (let from = page, more = first.data.length === page; more; from += page * 4) {
          const res = await Promise.all([0, 1, 2, 3].map(k => get(from + k * page)));
          for (const { data, error } of res) { if (error) throw error; take(data); if (data.length < page) more = false; }
        }
        x.since = max; x.loaded = true; dirty.add(c); clearTimeout(saveT); saveT = setTimeout(flush, 3000); // save the first copy soon
      })();
      x.loading.catch(() => { x.loading = null; });
      return x.loading;
    }
    // Safety net for the live channel: every few seconds ask "anything changed since …?" (usually nothing, a tiny request).
    let polling = false;
    async function pollAll(force) {
      if (polling || !gSince || (document.hidden && !force)) return; polling = true;
      try {
        const from = new Date(gSince - SLACK).toISOString(), touched = new Set();
        for (let off = 0; ; off += 1000) {
          const { data, error } = await sb.from("docs").select("path,col,id,data,updated_at").gt("updated_at", from).order("updated_at").range(off, off + 999);
          if (error) return;
          for (const r of data) {
            seen(r.updated_at); const x = cols.get(r.col);
            if (!(x && x.loaded) && !docs.has(r.path)) continue;
            if (!same(docVal(r.path), r.data)) { put(r.path, r.data); touched.add(r.path); }
            if (x) x.since = Math.max(x.since || 0, Date.parse(r.updated_at) || 0);
          }
          if (data.length < 1000) break;
        }
        const tomb = await tombsSince(null, from);
        if (tomb) for (const t of tomb) if (docVal(t.path) !== undefined) { put(t.path, undefined); touched.add(t.path); }
        touched.forEach(emitSoon);
      } finally { polling = false; }
    }
    setInterval(pollAll, 8000);
    document.addEventListener("visibilitychange", () => { if (document.hidden) flush(); else pollAll(); });
    window.addEventListener("online", () => pollAll());
    window.addEventListener("pagehide", flush);
    // one live channel for everything
    sb.channel("rs-docs").on("postgres_changes", { event: "*", schema: "public", table: "docs" }, ch => {
      const p = (ch.new && ch.new.path) || (ch.old && ch.old.path); if (!p) return;
      const c = cols.get(parentOf(p)); if (!c && !docs.has(p)) return;
      if (ch.new && ch.new.updated_at) { const t = seen(ch.new.updated_at); if (c && t) c.since = Math.max(c.since || 0, t); }
      put(p, ch.eventType === "DELETE" ? undefined : ch.new.data); emitSoon(p);
    }).subscribe(st => { if (st === "SUBSCRIBED") pollAll(); });
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
      // catch up with anything the live channel missed (only the changes are downloaded)
      async _refresh() { if (!gSince) return; await pollAll(true); },
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
      return { list: o => call({ action: "list", ...(o || {}) }), update: (ref, patch) => call({ action: "update", ref, ...(patch || {}) }), nextNumber: () => call({ action: "nextOrderNumber" }), pushProducts: products => call({ action: "pushProducts", products }), statuses: orders => call({ action: "statuses", orders }), email: m => call({ action: "email", ...(m || {}) }), maya: m => call({ action: "maya", ...(m || {}) }),
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
    e.preventDefault(); const { sb } = await ready; await sb.auth.signOut(); await cacheClear(); location.reload();
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
