"use client";

import Link from "next/link";
import { useState } from "react";
import { REGIONS, SHIPPING_METHODS, type Region, type ShippingMethod } from "@/lib/config";
import { peso } from "@/lib/money";
import { priceCart } from "@/lib/pricing";
import type { PaymentProvider } from "@/lib/types";
import { useCart } from "./CartProvider";
import { OrderSummary } from "./OrderSummary";

type Shipping = { name: string; contact: string; address: string; barangay: string; city: string; region: string };

export function CheckoutForm({
  providers,
  defaults,
}: {
  providers: { id: PaymentProvider; label: string }[];
  defaults: Shipping;
}) {
  const { items } = useCart();
  const [ship, setShip] = useState<Shipping>(defaults);
  const [method, setMethod] = useState<ShippingMethod>("JNT");
  const [provider, setProvider] = useState<PaymentProvider | "">(providers[0]?.id ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const region = ship.region as Region;
  const methodAllowed = (m: ShippingMethod) => !region || SHIPPING_METHODS[m].allowedRegions.includes(region);
  const effectiveMethod: ShippingMethod = methodAllowed(method) ? method : "JNT";
  const priced = priceCart(items, effectiveMethod);

  if (items.length === 0) {
    return (
      <div className="card mx-auto max-w-md p-10 text-center">
        <p className="font-semibold">Your cart is empty.</p>
        <Link href="/" className="btn-primary mt-4">
          Browse products
        </Link>
      </div>
    );
  }

  const set = (k: keyof Shipping) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setShip((s) => ({ ...s, [k]: e.target.value }));

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!provider) return setError("Please choose a payment method.");
    setBusy(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, paymentOption: i.paymentOption })),
        shipping: ship,
        shippingMethod: effectiveMethod,
        provider,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { redirectUrl?: string; error?: string };
    if (res.ok && data.redirectUrl) {
      window.location.href = data.redirectUrl; // go to Maya / PayPal / BDO
      return;
    }
    setBusy(false);
    setError(data.error ?? "Something went wrong. Please try again.");
  }

  return (
    <form onSubmit={placeOrder} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold">Checkout</h1>

        {/* Shipping details */}
        <section className="card space-y-4 p-5">
          <h2 className="font-bold">1. Shipping details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input className="input" required value={ship.name} onChange={set("name")} autoComplete="name" />
            </Field>
            <Field label="Contact number">
              <input
                className="input"
                required
                inputMode="tel"
                placeholder="09XXXXXXXXX"
                pattern="^(09\d{9}|\+639\d{9})$"
                title="PH mobile number, e.g. 09171234567"
                value={ship.contact}
                onChange={set("contact")}
                autoComplete="tel"
              />
            </Field>
            <Field label="Address (house no., street, building)" wide>
              <input className="input" required value={ship.address} onChange={set("address")} autoComplete="street-address" />
            </Field>
            <Field label="Barangay">
              <input className="input" required value={ship.barangay} onChange={set("barangay")} />
            </Field>
            <Field label="City / Municipality">
              <input className="input" required value={ship.city} onChange={set("city")} autoComplete="address-level2" />
            </Field>
            <Field label="Region" wide>
              <select className="input" required value={ship.region} onChange={set("region")}>
                <option value="">Select region…</option>
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        {/* Mode of shipping */}
        <section className="card space-y-3 p-5">
          <h2 className="font-bold">2. Mode of shipping</h2>
          {(Object.keys(SHIPPING_METHODS) as ShippingMethod[]).map((m) => {
            const info = SHIPPING_METHODS[m];
            const allowed = methodAllowed(m);
            return (
              <label
                key={m}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  !allowed ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                } ${effectiveMethod === m ? "border-brand ring-1 ring-brand" : "border-gray-300"}`}
              >
                <input
                  type="radio"
                  name="shippingMethod"
                  className="mt-1"
                  disabled={!allowed}
                  checked={effectiveMethod === m}
                  onChange={() => setMethod(m)}
                />
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{info.label}</span>
                  <span className="block text-xs text-gray-500">
                    {allowed ? info.description : "Not available for your region"}
                  </span>
                </span>
                <span className="text-sm font-semibold">{peso(info.fee)}</span>
              </label>
            );
          })}
        </section>

        {/* Payment */}
        <section className="card space-y-3 p-5">
          <h2 className="font-bold">3. Payment</h2>
          {providers.length === 0 && (
            <p className="text-sm text-red-600">No payment method is set up yet. (Shop owner: add your keys to .env)</p>
          )}
          {providers.map((p) => (
            <label
              key={p.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                provider === p.id ? "border-brand ring-1 ring-brand" : "border-gray-300"
              }`}
            >
              <input type="radio" name="provider" checked={provider === p.id} onChange={() => setProvider(p.id)} />
              <span className="text-sm font-semibold">{p.label}</span>
            </label>
          ))}
        </section>
      </div>

      <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-24">
        <h2 className="font-bold">Order summary</h2>
        <ul className="space-y-1 text-sm">
          {items.map((i) => (
            <li key={i.productId + i.paymentOption} className="flex justify-between gap-2">
              <span className="truncate">
                {i.quantity}× {i.name}
                {i.paymentOption === "DOWNPAYMENT_50" && <span className="text-xs text-gray-500"> (50% DP)</span>}
              </span>
              <span>{peso(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <hr />
        <OrderSummary {...priced} showShipping />
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full" disabled={busy || !provider}>
          {busy ? "Redirecting to payment…" : `Pay ${peso(priced.dueNow)}`}
        </button>
        <p className="text-center text-xs text-gray-500">You will be redirected to a secure payment page.</p>
      </aside>
    </form>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={wide ? "sm:col-span-2" : ""}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
