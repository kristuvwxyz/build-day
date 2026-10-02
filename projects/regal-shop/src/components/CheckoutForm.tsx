"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  REGIONS,
  SHIPPING_METHODS,
  lowestShippingFee,
  shippingFee,
  type Region,
  type ShippingMethod,
} from "@/lib/config";
import { peso } from "@/lib/money";
import { lineTotal, priceCart, unitDiscount } from "@/lib/pricing";
import type { PaymentProvider } from "@/lib/types";
import type { SavedAddress } from "./AddressBook";
import { useCart } from "./CartProvider";
import { useVoucher } from "./useVoucher";
import { OrderSummary } from "./OrderSummary";

type Shipping = { name: string; contact: string; address: string; barangay: string; city: string; region: string };

type Quote = { status: "idle" | "loading" | "ok" | "error"; fee?: number; mapAddress?: string; token?: string; error?: string };

export function CheckoutForm({
  providers,
  liveSameDayQuote,
  savedAddresses,
  defaults,
}: {
  providers: { id: PaymentProvider; label: string }[];
  liveSameDayQuote: boolean;
  savedAddresses: SavedAddress[];
  defaults: Shipping;
}) {
  const { items, extras } = useCart();
  const voucher = useVoucher();
  const [ship, setShip] = useState<Shipping>(defaults);
  const [method, setMethod] = useState<ShippingMethod>("JNT");
  const [provider, setProvider] = useState<PaymentProvider | "">(providers[0]?.id ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [quote, setQuote] = useState<Quote>({ status: "idle" });
  const [saveAddress, setSaveAddress] = useState(savedAddresses.length === 0);
  const matchesSaved = savedAddresses.some(
    (a) => a.address === ship.address && a.barangay === ship.barangay && a.city === ship.city,
  );

  const region = (ship.region || null) as Region | null;
  const methodAllowed = (m: ShippingMethod) => !region || shippingFee(m, region) !== null;
  const effectiveMethod: ShippingMethod = methodAllowed(method) ? method : "JNT";
  const useLiveQuote = liveSameDayQuote && effectiveMethod === "SAMEDAY";

  // Fetch the live Lalamove price when same-day is chosen (and again if the address changes).
  useEffect(() => {
    if (!useLiveQuote) return;
    const { address, barangay, city } = ship;
    if (address.trim().length < 5 || barangay.trim().length < 2 || city.trim().length < 2) {
      setQuote({ status: "idle" });
      return;
    }
    setQuote({ status: "loading" });
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/shipping/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, barangay, city }),
          signal: ctrl.signal,
        });
        const data = (await res.json()) as { fee?: number; mapAddress?: string; token?: string; error?: string };
        setQuote(res.ok ? { status: "ok", ...data } : { status: "error", error: data.error });
      } catch (err) {
        if (!ctrl.signal.aborted) setQuote({ status: "error", error: "Couldn't get the same-day price." });
      }
    }, 800);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [useLiveQuote, ship.address, ship.barangay, ship.city]); // eslint-disable-line react-hooks/exhaustive-deps

  const feePerShipment = !region
    ? null
    : useLiveQuote
      ? quote.status === "ok"
        ? quote.fee!
        : null
      : shippingFee(effectiveMethod, region);
  const priced = priceCart(items, feePerShipment, {
    specialPackaging: extras.specialPackaging,
    voucherDiscount: voucher.discount,
  });
  const shippingReady = feePerShipment !== null;

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
        sameDayQuoteToken: useLiveQuote ? quote.token : undefined,
        note: extras.note.trim() || undefined,
        specialPackaging: extras.specialPackaging,
        voucherCode: voucher.state.status === "applied" ? voucher.state.code : undefined,
        saveAddress: saveAddress && !matchesSaved,
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
          {savedAddresses.length > 0 && (
            <label className="block">
              <span className="label">Saved addresses</span>
              <select
                id="checkout-saved-address"
                className="input"
                defaultValue=""
                onChange={(e) => {
                  const a = savedAddresses.find((x) => x.id === e.target.value);
                  if (a) {
                    setShip({ name: a.name, contact: a.contact, address: a.address, barangay: a.barangay, city: a.city, region: a.region });
                  }
                }}
              >
                <option value="">Choose a saved address…</option>
                {savedAddresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}: {a.address}, {a.city}
                    {a.isDefault ? " (default)" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
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
          {!matchesSaved && (
            <label className="flex items-center gap-2 text-sm">
              <input id="checkout-save-address" type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
              Save this address to my account
            </label>
          )}
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
                  {m === "SAMEDAY" && useLiveQuote && (
                    <span className="mt-1 block text-xs">
                      {quote.status === "idle" && "Enter your address above to see the price."}
                      {quote.status === "loading" && "Getting the Lalamove price…"}
                      {quote.status === "error" && <span className="text-red-600">{quote.error}</span>}
                      {quote.status === "ok" && (
                        <span className="text-gray-600">
                          Delivering to: <b>{quote.mapAddress}</b>
                        </span>
                      )}
                    </span>
                  )}
                </span>
                <span className="text-sm font-semibold">
                  {m === "SAMEDAY" && liveSameDayQuote
                    ? useLiveQuote && quote.status === "ok"
                      ? peso(quote.fee!)
                      : "Live rate"
                    : region
                      ? allowed && peso(shippingFee(m, region)!)
                      : `from ${peso(lowestShippingFee(m))}`}
                </span>
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
                {unitDiscount(i) > 0 && (
                  <span className="text-xs text-green-700"> (−{peso(unitDiscount(i) * i.quantity)})</span>
                )}
              </span>
              <span>{peso(lineTotal(i))}</span>
            </li>
          ))}
        </ul>
        <hr />
        <OrderSummary {...priced} showShipping={shippingReady} />
        {extras.note.trim() && (
          <p className="rounded-lg bg-gray-50 p-2 text-xs text-gray-600">
            <b>Note:</b> {extras.note}
          </p>
        )}
        {voucher.state.status === "invalid" && (
          <p className="text-xs text-red-600">Voucher not applied: {voucher.state.error}</p>
        )}
        <Link href="/cart" className="block text-center text-xs text-gray-500 underline">
          Edit cart, note, packaging or voucher
        </Link>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full" disabled={busy || !provider || !shippingReady}>
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
