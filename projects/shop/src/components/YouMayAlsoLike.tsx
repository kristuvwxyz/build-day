import { getSession } from "@/lib/auth";
import { getRecommendations } from "@/lib/recommendations";
import { getWishlistIds } from "@/lib/wishlist";
import { ProductCard } from "./ProductCard";

export async function YouMayAlsoLike({ productId }: { productId: string }) {
  const session = await getSession();
  const [products, wishlist] = await Promise.all([
    getRecommendations(productId, session?.user.id ?? null),
    getWishlistIds(),
  ]);
  if (products.length === 0) return null;
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-extrabold">You may also like…</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} wishlisted={wishlist.has(p.id)} />
        ))}
      </div>
    </section>
  );
}
