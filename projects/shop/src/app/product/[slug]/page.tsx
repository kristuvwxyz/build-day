import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { PerfumeCard } from "@/components/PerfumeCard";
import { YouMayAlsoLike } from "@/components/YouMayAlsoLike";
import { TypeBadge } from "@/components/TypeBadge";
import { WishlistButton } from "@/components/WishlistButton";
import { peso } from "@/lib/money";
import { PREORDER_FULL_PAYMENT_DISCOUNT } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import type { ProductType } from "@/lib/types";
import { getWishlistIds } from "@/lib/wishlist";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product || !product.isActive) notFound();
  const wishlist = await getWishlistIds();

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← Back to shop
      </Link>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="card relative aspect-square overflow-hidden bg-gray-100">
          {product.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          )}
          <WishlistButton productId={product.id} initial={wishlist.has(product.id)} className="absolute right-3 top-3" />
        </div>
        <div className="space-y-5">
          <TypeBadge type={product.type} />
          {product.brand && <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">{product.brand}</p>}
          <h1 className="text-2xl font-medium text-brand sm:text-3xl">{product.name}</h1>
          <p className="text-2xl font-bold">{peso(product.price)}</p>
          <p className="rounded-theme bg-gray-100 p-3 text-sm text-gray-700">
            {product.type === "PREORDER"
              ? `🕒 Pre-order · ${product.eta ?? "ETA to follow"}. Pay in full and get ${peso(PREORDER_FULL_PAYMENT_DISCOUNT)} off per item, or reserve with a 50% downpayment.`
              : `✅ On-hand · ${product.stock} in stock. Ships within 1–2 business days.`}
          </p>
          {product.description && <p className="whitespace-pre-line text-sm text-gray-700">{product.description}</p>}
          <AddToCart
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              imageUrl: product.imageUrl,
              price: product.price,
              type: product.type as ProductType,
              stock: product.stock,
            }}
          />
        </div>
      </div>
      <PerfumeCard product={product} />
      <YouMayAlsoLike productId={product.id} />
    </div>
  );
}
