// Pricing rules used by both the cart page (preview) and the server (final).
// The server always recomputes from database prices, never trusts the browser.
import {
  CHARGE_SHIPPING_PER_SHIPMENT,
  DOWNPAYMENT_PERCENT,
  PREORDER_FULL_PAYMENT_DISCOUNT,
  shippingFee as feeFor,
  type Region,
  type ShippingMethod,
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
  subtotal: number;
  shippingFee: number;
  total: number;
  dueNow: number;
  balanceLater: number;
};

/** Splits the cart into shipments (on-hand / pre-order) and prices each. */
export function priceCart<T extends PricedLine>(
  lines: T[],
  method: ShippingMethod | null,
  region: Region | null,
): { shipments: (Shipment & { lines: T[] })[]; dueNow: number; balanceLater: number } {
  const order: ProductType[] = ["ONHAND", "PREORDER"];
  const shipments: (Shipment & { lines: T[] })[] = [];
  let shippingCharged = false;

  for (const type of order) {
    const group = lines.filter((l) => l.type === type);
    if (group.length === 0) continue;
    const subtotal = group.reduce((s, l) => s + lineTotal(l), 0);
    const itemsDueNow = group.reduce((s, l) => s + lineDueNow(l), 0);
    let shippingFee = 0;
    if (method && region && (CHARGE_SHIPPING_PER_SHIPMENT || !shippingCharged)) {
      shippingFee = feeFor(method, region) ?? 0;
      shippingCharged = true;
    }
    // Shipping is paid upfront together with the first payment.
    shipments.push({
      type,
      lines: group,
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      dueNow: itemsDueNow + shippingFee,
      balanceLater: subtotal - itemsDueNow,
    });
  }

  return {
    shipments,
    dueNow: shipments.reduce((s, x) => s + x.dueNow, 0),
    balanceLater: shipments.reduce((s, x) => s + x.balanceLater, 0),
  };
}
