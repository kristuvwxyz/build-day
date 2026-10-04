// Live numbers for the Webcake homepage ("155 ON HAND · 511 OPEN PRE-ORDERS").
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [onHand, preOrders] = await Promise.all([
    prisma.product.count({ where: { isActive: true, type: "ONHAND", stock: { gt: 0 } } }),
    prisma.product.count({ where: { isActive: true, type: "PREORDER" } }),
  ]);
  return NextResponse.json(
    { onHand, preOrders },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=120, s-maxage=120" } },
  );
}
