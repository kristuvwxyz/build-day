// RS OS on Cloudflare Pages (moved from Vercel, Oct 24 2026, after Vercel's Hobby plan paused the project).
// This is the Pages "_worker.js/index.js": it runs the same api/*.js files Vercel ran, through a small
// stand-in for Vercel's req/res, and serves everything else (the RS OS app, soldout.js, site-addons.js...) as static files.
// Built by cloudflare/build_pages.py. Don't edit the copy in dist/.
import products from "./api/products.js";
import stock from "./api/stock.js";
import reviews from "./api/reviews.js";
import live from "./api/live.js";
import site from "./api/site.js";
import pushListings from "./api/push-listings.js";
import photo from "./api/photo.js";
import fragrantica from "./api/fragrantica.js";
import shopify from "./api/shopify.js";
import brevo from "./api/brevo.js";
import mayaCheck from "./api/maya-check.js";
import config from "./api/config.js";

const API = { products, stock, reviews, live, site, "push-listings": pushListings, photo, fragrantica, shopify, brevo, "maya-check": mayaCheck, config };

// Vercel-style request: method, url, headers (lowercase), query (object), body (parsed JSON or text).
async function makeReq(request, url) {
  const headers = {};
  for (const [k, v] of request.headers) headers[k.toLowerCase()] = v;
  const query = {};
  for (const [k, v] of url.searchParams) query[k] = v;
  let body;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const text = await request.text();
    if (/json/i.test(headers["content-type"] || "")) { try { body = text ? JSON.parse(text) : {}; } catch (e) { body = text; } }
    else body = text;
  }
  return { method: request.method, url: url.pathname + url.search, headers, query, body };
}

// Vercel-style response: setHeader / status().json() / .send() / .end(), collected into one Response.
function makeRes() {
  const r = { code: 200, headers: new Headers(), body: null, done: false };
  const api = {
    setHeader(k, v) { r.headers.set(k, String(v)); return api; },
    getHeader(k) { return r.headers.get(k); },
    status(c) { r.code = c; return api; },
    json(o) { if (!r.headers.has("Content-Type")) r.headers.set("Content-Type", "application/json; charset=utf-8"); r.body = JSON.stringify(o); r.done = true; return api; },
    send(b) {
      if (b instanceof Uint8Array || b instanceof ArrayBuffer) r.body = b;
      else if (b !== null && typeof b === "object") return api.json(b);
      else { r.body = b == null ? "" : String(b); if (!r.headers.has("Content-Type")) r.headers.set("Content-Type", "text/plain; charset=utf-8"); }
      r.done = true; return api;
    },
    end(b) { if (b != null) r.body = b; r.done = true; return api; },
    redirect(a, b) { const [code, to] = typeof a === "number" ? [a, b] : [302, a]; r.code = code; r.headers.set("Location", to); r.done = true; return api; },
  };
  return { api, out: () => new Response(r.code === 204 || r.code === 304 ? null : r.body, { status: r.code, headers: r.headers }) };
}

async function runApi(name, request, url, env, extraQuery) {
  // The api files read process.env, as on Vercel.
  globalThis.process = globalThis.process || {};
  globalThis.process.env = Object.assign({}, globalThis.process.env || {}, env);
  const req = await makeReq(request, url);
  if (extraQuery) Object.assign(req.query, extraQuery);
  const { api, out } = makeRes();
  try { await API[name](req, api); }
  catch (e) { return new Response(JSON.stringify({ ok: false, error: "Server error" }), { status: 500, headers: { "Content-Type": "application/json" } }); }
  return out();
}

// Edge cache for public GETs (photos a year, product list a few seconds), so repeat visits don't re-run the code.
// With swr (product list): a copy older than `fresh` ms is still sent at once while a new one is made in the background,
// so shoppers never wait for the slow Apps Script backend; a copy older than `maxStale` ms is replaced before sending.
async function cached(ctx, request, key, make, swr) {
  const cache = caches.default, hit = await cache.match(key);
  const store = res => {
    if (!res.ok || !/public/.test(res.headers.get("Cache-Control") || "")) return;
    const copy = new Response(res.clone().body, res);
    const sm = /s-maxage=(\d+)/.exec(res.headers.get("Cache-Control") || "");
    copy.headers.set("x-rs-cached-at", String(Date.now()));
    copy.headers.set("Cache-Control", "public, max-age=" + (swr ? Math.ceil(swr.maxStale / 1000) : sm ? sm[1] : 60));
    ctx.waitUntil(cache.put(key, copy));
  };
  if (hit) {
    if (!swr) return hit;
    const age = Date.now() - Number(hit.headers.get("x-rs-cached-at") || 0);
    if (age < swr.fresh) return hit;
    if (age < swr.maxStale) { ctx.waitUntil(make().then(store).catch(() => {})); return hit; }
  }
  const res = await make();
  store(res);
  return res;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    // Listing photos: /img/listings/<file> (Supabase listing-photos, named by content, so cached for a year).
    if (path.startsWith("/img/") && request.method === "GET") {
      const key = new Request(url.origin + path);
      return cached(ctx, request, key, () => runApi("products", request, url, env, { img: path.slice(5) }));
    }
    const m = /^\/api\/([a-z-]+)\/?$/.exec(path);
    if (m && API[m[1]]) {
      // The public product list (no ?live / ?photos variations mixed up) is cached for its s-maxage (15 s).
      if (m[1] === "products" && request.method === "GET" && !url.searchParams.has("live")) {
        const key = new Request(url.origin + path + (url.searchParams.has("photos") ? "?photos=1" : ""));
        return cached(ctx, request, key, () => runApi("products", request, url, env), { fresh: 15e3, maxStale: 10 * 60e3 });
      }
      return runApi(m[1], request, url, env);
    }
    return env.ASSETS.fetch(request);
  },
};
