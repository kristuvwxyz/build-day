// Builds the website's product list from the RS OS listings, the same way the RS OS app does (webProducts() and the
// _photos extra in projects/business-os/index.html). Keep the two in step: a change to one needs the same change in the other.
// Used by /api/push-listings, which sends the list to the website backend without the RS OS app being open.

const slug = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 90);
const webIdOf = p => p.webId || slug([p.kind === "preorder" ? "preorder" : "", p.brand, p.name, p.size, p.ptype].filter(Boolean).join(" "));
const poOut = p => p.kind === "preorder" && !!p.soldOut;
const isOutW = p => p.kind === "preorder" ? !!p.soldOut : !((Number(p.stock) || 0) > 0);
const badgesOf = p => { const b = Array.isArray(p.badges) ? p.badges : []; return p.isNew && !b.includes("New arrival") ? ["New arrival", ...b] : b; };

// products: every listing record in RS OS (each with its doc id as p.id).
export function webProducts(products) {
  // Every active listing goes to the site (K, Oct 14, 2026): on-hand options with no stock show there as Sold out.
  const live = products.filter(p => (p.status || "active") === "active" && p.name);
  return live.sort((a, b) => (a.kind === "preorder") - (b.kind === "preorder") || isOutW(a) - isOutW(b) || (a.webOrder ?? -1) - (b.webOrder ?? -1) || (b.createdAt || 0) - (a.createdAt || 0))
    .map(p => ({
      id: webIdOf(p), kind: p.kind === "preorder" ? "preorder" : "onhand", rank: p.rank ?? 9999, brand: p.brand || "", name: p.name, size: p.size || "", cond: p.ptype || "", cat: (p.category === "secondreign" ? "beauty" : p.category) || "unisex",
      price: Number(p.price) || 0, was: Number(p.compareAt) > 0 ? Number(p.compareAt) : p.wasNull === false ? 0 : null,
      imgs: (p.imgs && p.imgs.length ? p.imgs : p.photo && !p.photo.startsWith("data:") ? [p.photo] : []), notes: p.notes || {}, accords: p.accords || [],
      isNew: !!p.isNew || badgesOf(p).includes("New arrival"), badges: badgesOf(p), eta: p.eta || "", ...(isOutW(p) ? { soldOut: true } : {}), vac: !!p.vac,
      ...(p.inspiredBy ? { insp: p.inspiredBy } : {}), ...(p.category === "secondreign" && String(p.description || "").trim() ? { desc: String(p.description).trim().slice(0, 3000) } : {}), created: p.webCreated || new Date(p.createdAt || Date.now()).toISOString().replace(/\.\d+Z$/, "+00:00"),
    }));
}

// Photos of listings not on the site (sold out, inactive) go on the first item, so past orders can still show their picture.
// Each row is [brand, name, size, photo], all lowercase letters/digits.
export function webPhotoExtra(products, list) {
  const nk = x => String(x || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const live = new Set(list.map(x => nk(x.brand) + "|" + nk(x.name) + "|" + nk(x.size)));
  return products.map(p => [nk(p.brand), nk(p.name), nk(p.size), (p.imgs && p.imgs[0]) || (p.photo && !String(p.photo).startsWith("data:") ? p.photo : "")])
    .filter(x => x[3] && x[1] && !live.has(x.slice(0, 3).join("|")));
}
