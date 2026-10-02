// Turns the cart sent by the browser into priced lines using DATABASE prices.
import { z } from "zod";
import { prisma } from "./prisma";
import type { ProductType } from "./types";

export const CartItemsSchema = z
  .array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().min(1).max(99),
      paymentOption: z.enum(["FULL", "DOWNPAYMENT_50"]),
    }),
  )
  .min(1)
  .max(50);

export async function loadCartLines(items: z.infer<typeof CartItemsSchema>) {
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, isActive: true },
  });
  const lines = [];
  for (const item of items) {
    const p = products.find((x) => x.id === item.productId);
    if (!p) return { error: "An item in your cart is no longer available." } as const;
    const type = p.type as ProductType;
    if (type === "ONHAND") {
      const wanted = items.filter((i) => i.productId === p.id).reduce((s, i) => s + i.quantity, 0);
      if (wanted > p.stock) return { error: `Only ${p.stock} left of "${p.name}".` } as const;
    }
    lines.push({
      product: p,
      type,
      price: p.price,
      quantity: item.quantity,
      paymentOption: type === "ONHAND" ? ("FULL" as const) : item.paymentOption,
    });
  }
  return { lines } as const;
}
