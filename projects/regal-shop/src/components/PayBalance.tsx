"use client";

import { useState } from "react";
import { peso } from "@/lib/money";
import type { PaymentProvider } from "@/lib/types";

export function PayBalance({
  orderId,
  amount,
  providers,
}: {
  orderId: string;
  amount: number;
  providers: { id: PaymentProvider; label: string }[];
}) {
  const [provider, setProvider] = useState(providers[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}/pay-balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    const data = (await res.json().catch(() => ({}))) as { redirectUrl?: string; error?: string };
    if (res.ok && data.redirectUrl) {
      window.location.href = data.redirectUrl;
      return;
    }
    setBusy(false);
    setError(data.error ?? "Something went wrong.");
  }

  return (
    <div className="card space-y-3 border-orange-300 bg-orange-50 p-5">
      <h2 className="font-bold text-orange-900">Your pre-order has arrived! 🎉</h2>
      <p className="text-sm text-orange-900">
        Pay the remaining balance of <b>{peso(amount)}</b> so we can ship your order.
      </p>
      <select className="input" value={provider} onChange={(e) => setProvider(e.target.value as PaymentProvider)}>
        {providers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn-primary w-full" disabled={busy || !provider} onClick={pay}>
        {busy ? "Redirecting…" : `Pay balance ${peso(amount)}`}
      </button>
    </div>
  );
}
