"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function WishlistButton({
  productId,
  initial,
  className = "",
}: {
  productId: string;
  initial: boolean;
  className?: string;
}) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setBusy(false);
    if (res.status === 401) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (res.ok) {
      setOn(((await res.json()) as { wishlisted: boolean }).wishlisted);
      router.refresh();
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={on ? "Remove from wishlist" : "Add to wishlist"}
      title={on ? "Remove from wishlist" : "Add to wishlist"}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-110 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill={on ? "#e11d48" : "none"} stroke="#e11d48" strokeWidth="2">
        <path d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.2 4.5 7 4.5c2.1 0 3.6 1.1 5 2.8 1.4-1.7 2.9-2.8 5-2.8 3.8 0 6 3.8 4.5 7.3C19.5 16.4 12 21 12 21z" />
      </svg>
    </button>
  );
}
