"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// "Cancel order" for buyers. Paid orders become a request the shop approves.
export function CancelOrderButton({ orderId, isPaid }: { orderId: string; isPaid: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Couldn't send your request.");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn-outline text-red-700" onClick={() => setOpen(true)}>
        Cancel order
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="space-y-2 rounded-theme border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-900">
        {isPaid
          ? "Your request will be reviewed by the shop. If approved, your payment will be refunded."
          : "This order hasn't been paid yet, so it will be cancelled right away."}
      </p>
      <label className="block">
        <span className="label">Reason</span>
        <textarea id="cancel-reason" className="input" required minLength={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button className="btn bg-red-600 text-white hover:bg-red-700" disabled={busy}>
          {isPaid ? "Send cancellation request" : "Cancel order"}
        </button>
        <button type="button" className="btn-outline" onClick={() => setOpen(false)}>
          Keep order
        </button>
      </div>
    </form>
  );
}
