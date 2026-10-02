// Order statuses shown to buyers in "My Orders".
export const ORDER_STATUSES = {
  PENDING_PAYMENT: { label: "Pending Payment", color: "bg-gray-100 text-gray-700" },
  PAID: { label: "Paid", color: "bg-green-100 text-green-800" },
  DOWNPAYMENT_RECEIVED: { label: "50% Downpayment Received", color: "bg-blue-100 text-blue-800" },
  AWAITING_STOCK: { label: "Awaiting Stock", color: "bg-amber-100 text-amber-800" },
  BALANCE_DUE: { label: "Arrived – Balance Due", color: "bg-orange-100 text-orange-800" },
  PROCESSING: { label: "Processing / Packing", color: "bg-indigo-100 text-indigo-800" },
  SHIPPED: { label: "Shipped", color: "bg-purple-100 text-purple-800" },
  DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700" },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUSES;

export function statusLabel(s: string) {
  return ORDER_STATUSES[s as OrderStatus]?.label ?? s;
}
export function statusColor(s: string) {
  return ORDER_STATUSES[s as OrderStatus]?.color ?? "bg-gray-100 text-gray-700";
}

// The usual journey, used to draw the progress tracker.
export function statusSteps(type: string, hasBalance: boolean): OrderStatus[] {
  if (type === "ONHAND") return ["PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"];
  return hasBalance
    ? ["PENDING_PAYMENT", "DOWNPAYMENT_RECEIVED", "AWAITING_STOCK", "BALANCE_DUE", "PROCESSING", "SHIPPED", "DELIVERED"]
    : ["PENDING_PAYMENT", "PAID", "AWAITING_STOCK", "PROCESSING", "SHIPPED", "DELIVERED"];
}
