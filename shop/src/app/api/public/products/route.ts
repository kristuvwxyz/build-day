// Public product list for the Webcake product grid (embed.js). Read-only, no buyer data.
import { NextResponse } from "next/server";
import { PREORDER_FULL_PAYMENT_DISCOUNT } from "@/lib/config";
import { prisma } from "@/lib/prisma";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "public, max-age=60, s-maxage=60",
};

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const brand = url.searchParams.get("brand");
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 12, 1), 48);

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(type === "PREORDER" || type === "ONHAND" ? { type } : {}),
      ...(brand ? { brand: { equals: brand, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const base = url.origin;
  return NextResponse.json(
    products.map((p) => ({
      name: p.name,
      brand: p.brand,
      slug: p.slug,
      url: `${base}/product/${p.slug}`,
      imageUrl: p.imageUrl,
      price: p.price,
      type: p.type,
      eta: p.type === "PREORDER" ? p.eta : null,
      inStock: p.type === "PREORDER" || p.stock > 0,
      fullPaymentDiscount: p.type === "PREORDER" ? PREORDER_FULL_PAYMENT_DISCOUNT : 0,
      topAccords: p.accords
        .split(",")
        .map((a) => a.split(":")[0].trim())
        .filter(Boolean)
        .slice(0, 3),
    })),
    { headers: CORS },
  );
}
