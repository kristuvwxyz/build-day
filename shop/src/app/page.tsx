import { ProductCard } from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";
import { getWishlistIds } from "@/lib/wishlist";

export const dynamic = "force-dynamic";

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const typeFilter = type === "PREORDER" || type === "ONHAND" ? type : undefined;
  const [products, wishlist] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true, type: typeFilter }, orderBy: { createdAt: "desc" } }),
    getWishlistIds(),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-brand px-6 py-10 text-white sm:px-10">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Shop the latest drops</h1>
        <p className="mt-2 max-w-xl text-sm text-gray-300">
          <b className="text-amber-300">PRE-ORDER</b> items: pay in full or secure yours with a 50% downpayment.{" "}
          <b className="text-emerald-300">ON-HAND</b> items ship right away.
        </p>
      </section>

      <nav className="flex gap-2 text-sm">
        {[
          ["", "All"],
          ["PREORDER", "Pre-order"],
          ["ONHAND", "On-hand"],
        ].map(([v, label]) => (
          <a
            key={v}
            href={v ? `/?type=${v}` : "/"}
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
