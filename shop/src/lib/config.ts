// ============================================================
//  SHOP SETTINGS — edit this file to change fees, names, etc.
//  All money is in centavos: ₱150.00 = 15000
// ============================================================

export const SHOP_NAME = "My Shop";

export const DOWNPAYMENT_PERCENT = 50;

// PRE-ORDER items paid in FULL get this much off per item (₱200 = 20000).
export const PREORDER_FULL_PAYMENT_DISCOUNT = 20000;

export type Region = "METRO_MANILA" | "LUZON" | "VISAYAS" | "MINDANAO";

export const REGIONS: { value: Region; label: string }[] = [
  { value: "METRO_MANILA", label: "Metro Manila" },
  { value: "LUZON", label: "Luzon (outside Metro Manila)" },
  { value: "VISAYAS", label: "Visayas" },
  { value: "MINDANAO", label: "Mindanao" },
];

export type ShippingMethod = "JNT" | "SAMEDAY";

// Shipping fee per region. A region that is not listed cannot use that method.
export const SHIPPING_METHODS: Record<
  ShippingMethod,
  { label: string; description: string; fees: Partial<Record<Region, number>> }
> = {
  JNT: {
    label: "Standard Shipping (J&T Express)",
    description: "3–7 business days, nationwide",
    fees: {
      METRO_MANILA: 13000, // ₱130 (same as Luzon)
      LUZON: 13000, // ₱130
      VISAYAS: 16000, // ₱160
      MINDANAO: 17000, // ₱170
    },
  },
  SAMEDAY: {
    label: "Same-day Delivery (Lalamove / Grab)",
    description: "Metro Manila only. Price is the live Lalamove rate to your address.",
    fees: {
      // Live Lalamove price is used when Lalamove is connected (see below).
      // This flat fee is only a fallback while it isn't connected yet.
      METRO_MANILA: 25000, // ₱250
    },
  },
};

/** Fee in centavos, or null if the method doesn't deliver to that region. */
export function shippingFee(method: ShippingMethod, region: Region): number | null {
  return SHIPPING_METHODS[method].fees[region] ?? null;
}

/** Lowest fee for a method, for "from ₱130" labels before a region is chosen. */
export function lowestShippingFee(method: ShippingMethod): number {
  return Math.min(...Object.values(SHIPPING_METHODS[method].fees));
}

// A mixed cart (on-hand + pre-order) becomes 2 shipments: the on-hand items
// ship right away and the pre-order items ship when they arrive.
// true  = charge the shipping fee for each shipment
// false = charge the shipping fee only once (on the first shipment)
export const CHARGE_SHIPPING_PER_SHIPMENT = true;

// ---------- Same-day delivery (Lalamove live price) ----------

// Where the rider picks up your parcels. Get the exact lat/lng by right-clicking
// your shop's location in Google Maps. Live quotes stay off until this is filled in.
export const SHOP_PICKUP: { address: string; lat: number; lng: number } | null = null;
// Example:
// export const SHOP_PICKUP = { address: "123 Shop St, Brgy. Kapitolyo, Pasig City", lat: 14.5683, lng: 121.0595 };

// Lalamove vehicle used for the quote. "MOTORCYCLE" fits most small parcels.
export const LALAMOVE_SERVICE_TYPE = "MOTORCYCLE";

// Added on top of the Lalamove price (e.g. to cover a Grab booking that costs a bit more).
export const SAMEDAY_EXTRA_FEE = 0; // centavos, e.g. 2000 = ₱20
