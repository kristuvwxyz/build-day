// Script for Webcake (or any site builder): renders live products and shop links.
// Usage in a Webcake HTML element:
//   <div data-shop-products data-type="PREORDER" data-limit="8"></div>
//   <script src="https://shop.yourdomain.com/embed.js" defer></script>
const SCRIPT = String.raw`(function () {
  var me = document.currentScript;
  var SHOP = (me && me.src ? new URL(me.src).origin : "");
  if (!SHOP) return;

  var css = ".shopx-grid{display:grid;gap:var(--shopx-gap,16px);grid-template-columns:repeat(var(--shopx-cols,4),minmax(0,1fr))}" +
    "@media(max-width:900px){.shopx-grid{grid-template-columns:repeat(var(--shopx-cols-tablet,3),minmax(0,1fr))}}" +
    "@media(max-width:600px){.shopx-grid{grid-template-columns:repeat(var(--shopx-cols-mobile,2),minmax(0,1fr))}}" +
    ".shopx-card{display:flex;flex-direction:column;text-decoration:none;color:inherit;background:var(--shopx-card-bg,#fff);border:1px solid var(--shopx-border,#e5e7eb);border-radius:var(--shopx-radius,12px);overflow:hidden;font:inherit}" +
    ".shopx-img{position:relative;aspect-ratio:1/1;background:#f3f4f6}.shopx-img img{width:100%;height:100%;object-fit:cover;display:block}" +
    ".shopx-badge{position:absolute;left:8px;top:8px;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:2px 8px;border-radius:6px}" +
    ".shopx-pre{background:var(--shopx-pre-bg,#fbbf24);color:var(--shopx-pre-fg,#451a03)}.shopx-on{background:var(--shopx-on-bg,#10b981);color:var(--shopx-on-fg,#fff)}" +
    ".shopx-heart{position:absolute;right:8px;top:8px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center;color:var(--shopx-accent,#e11d48);font-size:16px;text-decoration:none}" +
    ".shopx-body{padding:10px 12px;display:flex;flex-direction:column;gap:2px}.shopx-brand{font-size:11px;text-transform:uppercase;letter-spacing:.05em;opacity:.6}" +
    ".shopx-name{font-weight:600;font-size:14px;line-height:1.3}.shopx-price{font-weight:700}.shopx-meta{font-size:12px;opacity:.65}" +
    ".shopx-out{opacity:.55}.shopx-msg{opacity:.6;font-size:14px}";
  var style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; }); }
  function peso(c) { return "₱" + (c / 100).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function card(p) {
    var meta = p.type === "PREORDER"
      ? (p.eta || "Pre-order") + (p.fullPaymentDiscount ? " · " + peso(p.fullPaymentDiscount) + " off if paid in full" : "")
      : (p.inStock ? "On-hand · ships now" : "Sold out");
    return '<a class="shopx-card' + (p.inStock ? "" : " shopx-out") + '" href="' + esc(p.url) + '" target="_top">' +
      '<div class="shopx-img">' + (p.imageUrl ? '<img loading="lazy" src="' + esc(p.imageUrl) + '" alt="' + esc(p.name) + '">' : "") +
      '<span class="shopx-badge ' + (p.type === "PREORDER" ? 'shopx-pre">Pre-order' : 'shopx-on">On-hand') + "</span>" +
      '<span class="shopx-heart" title="Add to wishlist" aria-hidden="true">♡</span></div>' +
      '<div class="shopx-body">' + (p.brand ? '<span class="shopx-brand">' + esc(p.brand) + "</span>" : "") +
      '<span class="shopx-name">' + esc(p.name) + '</span><span class="shopx-price">' + peso(p.price) + "</span>" +
      '<span class="shopx-meta">' + esc(meta) + "</span></div></a>";
  }

  function renderGrid(el) {
    var q = new URLSearchParams();
    if (el.dataset.type) q.set("type", el.dataset.type.toUpperCase());
    if (el.dataset.brand) q.set("brand", el.dataset.brand);
    q.set("limit", el.dataset.limit || "12");
    el.innerHTML = '<p class="shopx-msg">Loading products…</p>';
    fetch(SHOP + "/api/public/products?" + q.toString())
      .then(function (r) { return r.json(); })
      .then(function (list) {
        if (!list.length) { el.innerHTML = '<p class="shopx-msg">No products yet.</p>'; return; }
        el.innerHTML = '<div class="shopx-grid">' + list.map(card).join("") + "</div>";
      })
      .catch(function () { el.innerHTML = '<p class="shopx-msg">Products could not be loaded. <a href="' + SHOP + '" target="_top">Open the shop</a></p>'; });
  }

  // Links: <a data-shop-link="cart">Cart</a> → points at the shop app
  var LINKS = { shop: "/", cart: "/cart", orders: "/profile?tab=orders", wishlist: "/profile?tab=wishlist",
    account: "/profile?tab=account", login: "/login", contact: "/contact", preorder: "/?type=PREORDER", onhand: "/?type=ONHAND" };
  function wireLink(a) {
    var key = a.getAttribute("data-shop-link");
    var path = LINKS[key] || (key && key.charAt(0) === "/" ? key : "/");
    a.setAttribute("href", SHOP + path);
    a.setAttribute("target", "_top");
  }

  function init() {
    document.querySelectorAll("[data-shop-products]").forEach(renderGrid);
    document.querySelectorAll("[data-shop-link]").forEach(wireLink);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();`;

export function GET() {
  return new Response(SCRIPT, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
