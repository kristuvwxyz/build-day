// ============================================================
//  SHOP SETTINGS — edit this file to change fees, names, etc.
//  All money is in centavos: ₱150.00 = 15000
// ============================================================

export const SHOP_NAME = "My Shop";

export const DOWNPAYMENT_PERCENT = 50;

export type Region = "METRO_MANILA" | "LUZON" | "VISAYAS" | "MINDANAO";

export const REGIONS: { value: Region; label: string }[] = [
  { value: "METRO_MANILA", label: "Metro Manila" },
  { value: "LUZON", label: "Luzon (outside Metro Manila)" },
  { value: "VISAYAS", label: "Visayas" },
  { value: "MINDANAO", label: "Mindanao" },
];

export type ShippingMethod = "JNT" | "SAMEDAY";

export const SHIPPING_METHODS: Record<
  ShippingMethod,
  { label: string; description: string; fee: number; allowedRegions: Region[] }
> = {
  JNT: {
    label: "Standard Shipping (J&T Express)",
    description: "3–7 business days, nationwide",
    fee: 15000, // ₱150
    allowedRegions: ["METRO_MANILA", "LUZON", "VISAYAS", "MINDANAO"],
  },
  SAMEDAY: {
    label: "Same-day Delivery (Lalamove / Grab)",
    description: "Metro Manila only. Booked once your order is ready.",
    fee: 25000, // ₱250
    allowedRegions: ["METRO_MANILA"],
  },
};

// A mixed cart (on-hand + pre-order) becomes 2 shipments: the on-hand items
// ship right away and the pre-order items ship when they arrive.
// true  = charge the shipping fee for each shipment
// false = charge the shipping fee only once (on the first shipment)
export const CHARGE_SHIPPING_PER_SHIPMENT = true;
