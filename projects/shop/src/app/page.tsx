import { ProductCard } from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";
import { productWhere } from "@/lib/productFilters";
import { SHOP_HERO } from "@/lib/theme";
import { getWishlistIds } from "@/lib/wishlist";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; gender?: string; tag?: string }>;
}) {
  const filter = await searchParams;
  const typeFilter = filter.type === "PREORDER" || filter.type === "ONHAND" ? filter.type : undefined;
  const [products, wishlist] = await Promise.all([
    prisma.product.findMany({ where: productWhere(filter), orderBy: { createdAt: "desc" } }),
    getWishlistIds(),
  ]);

  return (
    <div className="space-y-8">
      <section className="space-y-3 py-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{SHOP_HERO.eyebrow}</p>
        <h1 className="font-heading text-4xl text-brand sm:text-5xl">
          {pageTitle(filter)}
        </h1>
        <p className="mx-auto max-w-xl text-sm text-gray-600">{SHOP_HERO.subtitle}</p>
      </section>

      <nav className="flex gap-2 text-sm">
        {[
          ["", "All"],
          ["PREORDER", "Pre-order"],
          ["ONHAND", "On-hand"],
        ].map(([v, label]) => (
          <a
            key={v}
            href={chipHref(filter, v)}
            className={`rounded-full border px-3 py-1 ${(typeFilter ?? "") === v ? "border-brand bg-brand text-white" : "bg-white"}`}
          >
            {label}
          </a>
        ))}
      </nav>

      {products.length === 0 ? (
        <p className="text-center text-gray-500">No products yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} wishlisted={wishlist.has(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function pageTitle(f: { type?: string; gender?: string; tag?: string }) {
  if (f.tag) return f.tag.charAt(0).toUpperCase() + f.tag.slice(1);
  if (f.gender === "Women") return "For Her";
  if (f.gender === "Men") return "For Him";
  if (f.gender === "Unisex") return "Unisex";
  if (f.type === "PREORDER") return "Pre-order";
  if (f.type === "ONHAND") return "On-hand";
  return "Shop";
}

function chipHref(f: { gender?: string; tag?: string }, type: string) {
  const q = new URLSearchParams();
  if (f.gender) q.set("gender", f.gender);
  if (f.tag) q.set("tag", f.tag);
  if (type) q.set("type", type);
  const s = q.toString();
  return s ? `/?${s}` : "/";
}
