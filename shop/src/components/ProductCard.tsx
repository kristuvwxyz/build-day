import Link from "next/link";
import type { Product } from "@prisma/client";
import { peso } from "@/lib/money";
import { TypeBadge } from "./TypeBadge";
import { WishlistButton } from "./WishlistButton";

export function ProductCard({ product, wishlisted }: { product: Product; wishlisted: boolean }) {
  const soldOut = product.type === "ONHAND" && product.stock <= 0;
  return (
    <Link href={`/product/${product.slug}`} className="card group overflow-hidden transition hover:shadow-lg">
      <div className="relative aspect-square bg-gray-100">
        {product.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition group-hover:scale-105" />
        )}
        <div className="absolute left-2 top-2">
          <TypeBadge type={product.type} />
        </div>
        <WishlistButton productId={product.id} initial={wishlisted} className="absolute right-2 top-2" />
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-sm font-bold uppercase">
            Sold out
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold">{product.name}</h3>
        <p className="font-bold">{peso(product.price)}</p>
        <p className="text-xs text-gray-500">
          {product.type === "PREORDER"
            ? `${product.eta ?? "ETA to follow"} · 50% DP available`
            : soldOut
              ? "Out of stock"
              : `${product.stock} in stock · ships now`}
        </p>
      </div>
    </Link>
  );
}
