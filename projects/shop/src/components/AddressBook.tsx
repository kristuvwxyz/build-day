"use client";

import { useState } from "react";
import { REGIONS } from "@/lib/config";

export type SavedAddress = {
  id: string;
  label: string;
  name: string;
  contact: string;
  address: string;
  barangay: string;
  city: string;
  region: string;
  isDefault: boolean;
};

const EMPTY = { label: "Home", name: "", contact: "", address: "", barangay: "", city: "", region: "" };

// Saved addresses. Uses GET/POST /api/addresses and PATCH/DELETE /api/addresses/:id.
export function AddressBook({ initial }: { initial: SavedAddress[] }) {
  const [list, setList] = useState(initial);
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [error, setError] = useState("");

  const reload = async () => setList(await (await fetch("/api/addresses")).json());

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) return setError((await res.json()).error ?? "Couldn't save.");
    setForm(null);
    await reload();
  }
  async function makeDefault(id: string) {
    await fetch(`/api/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    await reload();
  }
  async function remove(id: string) {
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    await reload();
  }

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => (f ? { ...f, [k]: e.target.value } : f));

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-brand">Saved addresses</h3>
      {list.length === 0 && <p className="text-sm text-gray-500">No saved addresses yet.</p>}
      {list.map((a) => (
        <div key={a.id} className="rounded-theme border p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <b>
              {a.label} {a.isDefault && <span className="ml-1 rounded bg-gray-900 px-1.5 py-0.5 text-[10px] text-white">DEFAULT</span>}
            </b>
            <span className="flex gap-3 text-xs">
              {!a.isDefault && (
                <button className="underline" onClick={() => makeDefault(a.id)}>
                  Make default
                </button>
              )}
              <button className="text-red-600 underline" onClick={() => remove(a.id)}>
                Delete
              </button>
            </span>
          </div>
          <p>
            {a.name} · {a.contact}
          </p>
          <p className="text-gray-600">
            {a.address}, Brgy. {a.barangay}, {a.city} · {REGIONS.find((r) => r.value === a.region)?.label}
          </p>
        </div>
      ))}

      {form ? (
        <form onSubmit={add} className="grid gap-3 rounded-theme border p-3 sm:grid-cols-2">
          <input id="addr-label" className="input" placeholder="Label (Home, Office…)" value={form.label} onChange={set("label")} />
          <input id="addr-name" className="input" placeholder="Name" required value={form.name} onChange={set("name")} />
          <input id="addr-contact" className="input" placeholder="09XXXXXXXXX" required value={form.contact} onChange={set("contact")} />
          <input id="addr-address" className="input" placeholder="House no., street, building" required value={form.address} onChange={set("address")} />
          <input id="addr-barangay" className="input" placeholder="Barangay" required value={form.barangay} onChange={set("barangay")} />
          <input id="addr-city" className="input" placeholder="City / Municipality" required value={form.city} onChange={set("city")} />
          <select id="addr-region" className="input sm:col-span-2" required value={form.region} onChange={set("region")}>
            <option value="">Region…</option>
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button className="btn-primary">Save address</button>
            <button type="button" className="btn-outline" onClick={() => setForm(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button className="btn-outline" onClick={() => setForm(EMPTY)}>
          + Add address
        </button>
      )}
    </div>
  );
}
