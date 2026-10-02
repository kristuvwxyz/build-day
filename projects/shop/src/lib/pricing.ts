// Pricing rules used by both the cart page (preview) and the server (final).
// The server always recomputes from database prices, never trusts the browser.
import {
  CHARGE_SHIPPING_PER_SHIPMENT,
  DOWNPAYMENT_PERCENT,
  PREORDER_FULL_PAYMENT_DISCOUNT,
  SPECIAL_PACKAGING_FEE,
} from "./config";
import type { PaymentOption, ProductType } from "./types";

export type PricedLine = {
  type: ProductType;
  price: number;
  quantity: number;
  paymentOption: PaymentOption;
};

/** Discount per item: pre-order items paid in full get ₱200 off each. */
export function unitDiscount(l: Pick<PricedLine, "type" | "price" | "paymentOption">) {
  if (l.type === "PREORDER" && l.paymentOption === "FULL") {
    return Math.min(PREORDER_FULL_PAYMENT_DISCOUNT, l.price);
  }
  return 0;
}

export function lineTotal(l: PricedLine) {
  return (l.price - unitDiscount(l)) * l.quantity;
}

export function lineDueNow(l: PricedLine) {
  const total = lineTotal(l);
  if (l.type === "PREORDER" && l.paymentOption === "DOWNPAYMENT_50") {
    return Math.ceil((total * DOWNPAYMENT_PERCENT) / 100);
  }
  return total;
}

export type Shipment = {
  type: ProductType;
  subtotal: number; // items, after the pre-order full-payment discount
  voucherDiscount: number;
  shippingFee: number;
  packagingFee: number;
  total: number; // subtotal - voucherDiscount + shippingFee + packagingFee
  dueNow: number;
  balanceLater: number;
};

export type CartExtras = {
  specialPackaging?: boolean; // adds SPECIAL_PACKAGING_FEE once per checkout
  voucherDiscount?: number; // centavos, already validated (see lib/vouchers.ts)
};

/** Items subtotal of the whole cart (what vouchers are measured against). */
export function itemsSubtotal(lines: PricedLine[]) {
  return lines.reduce((s, l) => s + lineTotal(l), 0);
}

/** Splits the cart into shipments (on-hand / pre-order) and prices each. */
export function priceCart<T extends PricedLine>(
  lines: T[],
  /** Fee for one shipment in centavos, or null if not known yet. */
  feePerShipment: number | null,
  extras: CartExtras = {},
): {
  shipments: (Shipment & { lines: T[] })[];
  itemsSubtotal: number;
  voucherDiscount: number;
  packagingFee: number;
  dueNow: number;
  balanceLater: number;
} {
  const order: ProductType[] = ["ONHAND", "PREORDER"];
  const groups = order
    .map((type) => ({ type, lines: lines.filter((l) => l.type === type) }))
    .filter((g) => g.lines.length > 0);
  const cartSubtotal = itemsSubtotal(lines);
  const totalVoucher = Math.min(extras.voucherDiscount ?? 0, cartSubtotal);

  const shipments: (Shipment & { lines: T[] })[] = [];
  let shippingCharged = false;
  let voucherLeft = totalVoucher;

  groups.forEach((g, i) => {
    const subtotal = g.lines.reduce((s, l) => s + lineTotal(l), 0);
    const itemsDueNow = g.lines.reduce((s, l) => s + lineDueNow(l), 0);

    // Voucher is split across shipments by their share of the items subtotal.
    const isLast = i === groups.length - 1;
    const voucherDiscount = isLast
      ? voucherLeft
      : Math.min(voucherLeft, Math.floor((totalVoucher * subtotal) / Math.max(1, cartSubtotal)));
    voucherLeft -= voucherDiscount;

    let shippingFee = 0;
    if (feePerShipment !== null && (CHARGE_SHIPPING_PER_SHIPMENT || !shippingCharged)) {
      shippingFee = feePerShipment;
      shippingCharged = true;
    }
    // Packaging is charged once, on the first shipment.
    const packagingFee = i === 0 && extras.specialPackaging ? SPECIAL_PACKAGING_FEE : 0;

    // The voucher lowers what is paid now first; anything left lowers the balance.
    const discountNow = Math.min(voucherDiscount, itemsDueNow);
    const discountLater = voucherDiscount - discountNow;

    // Shipping and packaging are paid upfront together with the first payment.
    shipments.push({
      type: g.type,
      lines: g.lines,
      subtotal,
      voucherDiscount,
      shippingFee,
      packagingFee,
      total: subtotal - voucherDiscount + shippingFee + packagingFee,
      dueNow: itemsDueNow - discountNow + shippingFee + packagingFee,
      balanceLater: subtotal - itemsDueNow - discountLater,
    });
  });

  return {
    shipments,
    itemsSubtotal: cartSubtotal,
    voucherDiscount: totalVoucher,
    packagingFee: shipments.reduce((s, x) => s + x.packagingFee, 0),
    dueNow: shipments.reduce((s, x) => s + x.dueNow, 0),
    balanceLater: shipments.reduce((s, x) => s + x.balanceLater, 0),
  };
}
