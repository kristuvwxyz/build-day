"use client";

import { useState } from "react";

const SUBJECTS = ["Order inquiry", "Pre-order question", "Shipping", "Payment", "Product question", "Other"];

// Contact Us form. Sends POST /api/contact (saved for the admin + emailed to the shop).
export function ContactForm({ defaults }: { defaults: { name: string; email: string } }) {
  const [form, setForm] = useState({ ...defaults, phone: "", orderNumber: "", subject: SUBJECTS[0], message: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) return setState("sent");
    setState("idle");
    setError((await res.json().catch(() => ({}))).error ?? "Couldn't send your message.");
  }

  if (state === "sent") {
    return <p className="rounded-lg bg-green-50 p-4 text-green-800">Thanks! Your message was sent. We'll reply to {form.email}.</p>;
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <label>
        <span className="label">Name</span>
        <input id="contact-name" className="input" required value={form.name} onChange={set("name")} />
      </label>
      <label>
        <span className="label">Email</span>
        <input id="contact-email" className="input" type="email" required value={form.email} onChange={set("email")} />
      </label>
      <label>
        <span className="label">Mobile (optional)</span>
        <input id="contact-phone" className="input" inputMode="tel" value={form.phone} onChange={set("phone")} />
      </label>
      <label>
        <span className="label">Order number (optional)</span>
        <input id="contact-order" className="input" placeholder="PO-… / OH-…" value={form.orderNumber} onChange={set("orderNumber")} />
      </label>
      <label className="sm:col-span-2">
        <span className="label">Subject</span>
        <select id="contact-subject" className="input" value={form.subject} onChange={set("subject")}>
          {SUBJECTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="sm:col-span-2">
        <span className="label">Message</span>
        <textarea id="contact-message" className="input min-h-[140px]" required value={form.message} onChange={set("message")} />
      </label>
      {/* Hidden from people; bots fill it in. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" value={form.website} onChange={set("website")} aria-hidden="true" />
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <button className="btn-primary" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
