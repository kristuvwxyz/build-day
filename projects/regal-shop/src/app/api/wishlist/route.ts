import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({ productId: z.string() });

// Toggle a product in / out of the buyer's wishlist.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "login" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const where = { userId_productId: { userId: session.user.id, productId: parsed.data.productId } };
  const existing = await prisma.wishlistItem.findUnique({ where });
  if (existing) {
    await prisma.wishlistItem.delete({ where });
    return NextResponse.json({ wishlisted: false });
  }
  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.wishlistItem.create({ data: { userId: session.user.id, productId: product.id } });
  return NextResponse.json({ wishlisted: true });
}
