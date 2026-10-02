// "You may also like…": scores other products by shared accords, notes, brand and
// the buyer's saved scent preferences. No outside service needed.
import type { Product } from "@prisma/client";
import { parseAccords, splitList } from "./perfume";
import { prisma } from "./prisma";

const lower = (s: string) => splitList(s).map((x) => x.toLowerCase());
const allNotes = (p: Product) => new Set([...lower(p.topNotes), ...lower(p.heartNotes), ...lower(p.baseNotes)]);

export async function getRecommendations(productId: string, userId: string | null, limit = 4): Promise<Product[]> {
  const [target, others, user] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    prisma.product.findMany({ where: { isActive: true, id: { not: productId } }, orderBy: { createdAt: "desc" }, take: 300 }),
    userId ? prisma.user.findUnique({ where: { id: userId } }) : null,
  ]);
  if (!target) return [];

  const tAccords = new Map(parseAccords(target.accords).map((a) => [a.name, a.strength]));
  const tNotes = allNotes(target);
  const likes = {
    notes: new Set(lower(user?.favoriteNotes ?? "")),
    accords: new Set(lower(user?.favoriteAccords ?? "")),
    brands: new Set(lower(user?.favoriteBrands ?? "")),
  };

  const scored = others.map((p, i) => {
    let score = 0;
    for (const a of parseAccords(p.accords)) {
      const t = tAccords.get(a.name);
      if (t) score += (Math.min(t, a.strength) / 100) * 3;
      if (likes.accords.has(a.name)) score += 1.5;
    }
    for (const n of allNotes(p)) {
      if (tNotes.has(n)) score += 1;
      if (likes.notes.has(n)) score += 1;
    }
    const brand = p.brand.toLowerCase();
    if (brand && brand === target.brand.toLowerCase()) score += 2;
    if (brand && likes.brands.has(brand)) score += 2;
    if (p.gender && p.gender === target.gender) score += 0.5;
    if (p.type === "ONHAND" && p.stock <= 0) score -= 5; // sold out
    return { p, score: score - i * 0.001 }; // newer first on ties
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}
