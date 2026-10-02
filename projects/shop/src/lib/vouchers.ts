// Voucher codes. The discount applies to the items subtotal (not shipping or packaging).
import type { Voucher } from "@prisma/client";
import { peso } from "./money";
import { prisma } from "./prisma";

export const normalizeCode = (code: string) => code.trim().toUpperCase();

export function voucherDiscountFor(v: Voucher, itemsSubtotal: number) {
  const raw = v.type === "PERCENT" ? Math.floor((itemsSubtotal * v.value) / 100) : v.value;
  const capped = v.maxDiscount != null ? Math.min(raw, v.maxDiscount) : raw;
  return Math.max(0, Math.min(capped, itemsSubtotal));
}

/** Checks a code for this buyer and cart. Returns the discount or a message to show. */
export async function checkVoucher(
  code: string,
  userId: string,
  itemsSubtotal: number,
): Promise<{ voucher: Voucher; discount: number } | { error: string }> {
  const v = await prisma.voucher.findUnique({ where: { code: normalizeCode(code) } });
  const now = new Date();
  if (!v || !v.isActive) return { error: "This voucher code is not valid." };
  if (v.startsAt && v.startsAt > now) return { error: "This voucher isn't active yet." };
  if (v.expiresAt && v.expiresAt < now) return { error: "This voucher has expired." };
  if (itemsSubtotal < v.minSpend) return { error: `This voucher needs a minimum spend of ${peso(v.minSpend)}.` };

  if (v.usageLimit != null) {
    const used = await prisma.voucherRedemption.count({ where: { voucherId: v.id } });
    if (used >= v.usageLimit) return { error: "This voucher has been fully used." };
  }
  const mine = await prisma.voucherRedemption.count({ where: { voucherId: v.id, userId } });
  if (mine >= v.perUserLimit) return { error: "You've already used this voucher." };

  const discount = voucherDiscountFor(v, itemsSubtotal);
  if (discount <= 0) return { error: "This voucher doesn't apply to your cart." };
  return { voucher: v, discount };
}

export function describeVoucher(v: Voucher) {
  return v.type === "PERCENT"
    ? `${v.value}% off${v.maxDiscount != null ? ` (up to ${peso(v.maxDiscount)})` : ""}`
    : `${peso(v.value)} off`;
}
