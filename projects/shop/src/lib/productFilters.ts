// Shop filters used by the shop page, menu links and the Webcake embed.
//   ?type=PREORDER|ONHAND   ?gender=Women|Men|Unisex   ?tag=arabian
import type { Prisma } from "@prisma/client";

export const GENDERS = ["Women", "Men", "Unisex"] as const;

export type ProductFilter = { type?: string | null; gender?: string | null; tag?: string | null };

export function productWhere(f: ProductFilter): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };
  if (f.type === "PREORDER" || f.type === "ONHAND") where.type = f.type;
  const gender = GENDERS.find((g) => g.toLowerCase() === (f.gender ?? "").toLowerCase());
  if (gender) where.gender = gender;
  const tag = (f.tag ?? "").trim().toLowerCase();
  if (tag) where.tags = { contains: tag };
  return where;
}

/** Normalizes "Arabian,  Designer" → "arabian, designer" */
export function normalizeTags(s: string) {
  return Array.from(new Set(s.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))).join(", ");
}
