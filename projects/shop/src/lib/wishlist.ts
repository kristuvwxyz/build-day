import { getSession } from "./auth";
import { prisma } from "./prisma";

export async function getWishlistIds(): Promise<Set<string>> {
  const session = await getSession();
  if (!session) return new Set();
  const rows = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    select: { productId: true },
  });
  return new Set(rows.map((r) => r.productId));
}
