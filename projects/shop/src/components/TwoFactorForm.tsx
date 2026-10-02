"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Unstyled-logic component: restyle freely, keep the two API calls.
export function TwoFactorForm({ maskedEmail, callbackUrl }: { maskedEmail: string | null; callbackUrl: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const autoSent = useRef(false);

  async function send() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/2fa/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(maskedEmail ? {} : { email }),
    });
    const data = (await res.json().catch(() => ({}))) as { sentTo?: string; error?: string };
    setBusy(false);
    if (res.ok) setSentTo(data.sentTo ?? null);
    else setError(data.error ?? "Couldn't send the code.");
  }

  // Send the first code automatically when the buyer already has an email.
  useEffect(() => {
    if (maskedEmail && !autoSent.current) {
      autoSent.current = true;
      void send();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.ok) {
      router.replace(callbackUrl);
      router.refresh();
      return;
    }
    setBusy(false);
    setError(data.error ?? "That code didn't work.");
  }

  if (!maskedEmail && !sentTo) {
    return (
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label className="block">
          <span className="label">Your email</span>
          <input id="twofa-email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          Send code
        </button>
      </form>
    );
  }

  return (
    <form className="space-y-3" onSubmit={verify}>
      <p className="text-sm text-gray-600">
        {sentTo ? (
          <>
            We sent a 6-digit code to <b>{sentTo}</b>.
          </>
        ) : (
          "Sending your code…"
        )}
      </p>
      <label className="block">
        <span className="label">6-digit code</span>
        <input
          id="twofa-code"
          className="input text-center text-2xl tracking-[0.5em]"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="\d{6}"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary w-full" disabled={busy || code.length !== 6}>
        Verify
      </button>
      <button type="button" className="w-full text-sm text-gray-500 underline" disabled={busy} onClick={() => void send()}>
        Send a new code
      </button>
    </form>
  );
}
