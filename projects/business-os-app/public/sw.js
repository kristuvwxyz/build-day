// Keeps the app shell available offline and loads fast on slow phones. Data always comes live from the server.
const CACHE = "rs-shell-v1";
const SHELL = ["/", "/index.html", "/shim.js", "/manifest.webmanifest", "/icons/icon-192.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
const PHOTOS = "rs-photos-v1";
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== PHOTOS).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// Listing photos (Oct 15, 2026): Supabase sends them "no-cache", so every screen downloaded every photo again and used up the
// free data quota. Photos never change (new photo = new file name), so they come from our year-cached /img copy and are kept here.
const PHOTO_PATH = "/storage/v1/object/public/listing-photos/";
function photo(e, u) {
  const same = new Request("/img/" + u.pathname.slice(PHOTO_PATH.length));
  return caches.open(PHOTOS).then(c => c.match(same).then(hit => hit || fetch(same).then(r => { if (r.ok) { c.put(same, r.clone()); return r; } return fetch(e.request); })))
    .catch(() => fetch(e.request));
}
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method === "GET" && e.request.mode === "no-cors" && u.pathname.startsWith(PHOTO_PATH)) { e.respondWith(photo(e, u)); return; }
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api/")) return;
  // Network first (always the newest version), cached copy if offline.
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; }).catch(() => caches.match(e.request).then(r => r || caches.match("/index.html"))));
});
