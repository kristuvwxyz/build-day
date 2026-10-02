"use client";

import { useState } from "react";

export type AccountData = {
  name: string;
  email: string | null;
  phone: string;
  birthday: string; // YYYY-MM-DD or ""
  favoriteNotes: string;
  favoriteAccords: string;
  favoriteBrands: string;
  fragranticaUrl: string;
};

// MY ACCOUNT profile form. Saves with PATCH /api/account.
export function AccountForm({ initial }: { initial: AccountData }) {
  const [data, setData] = useState(initial);
  const [status, setStatus] = useState<{ ok?: string; error?: string }>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof AccountData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData((d) => ({ ...d, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus({});
    const { email: _email, ...body } = data;
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setData((d) => ({ ...d, favoriteNotes: json.favoriteNotes, favoriteAccords: json.favoriteAccords, favoriteBrands: json.favoriteBrands }));
      setStatus({ ok: "Saved" });
    } else setStatus({ error: json.error ?? "Couldn't save." });
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-bold">Profile</legend>
        <Field label="Name" id="acc-name">
          <input id="acc-name" className="input" required value={data.name} onChange={set("name")} />
        </Field>
        <Field label="Email (from your login)" id="acc-email">
          <input id="acc-email" className="input bg-gray-100" value={data.email ?? ""} disabled />
        </Field>
        <Field label="Mobile number" id="acc-phone">
          <input id="acc-phone" className="input" inputMode="tel" placeholder="09XXXXXXXXX" value={data.phone} onChange={set("phone")} />
        </Field>
        <Field label="Birthday" id="acc-birthday">
          <input id="acc-birthday" className="input" type="date" value={data.birthday} onChange={set("birthday")} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-2 font-bold">Scent preferences</legend>
        <p className="text-xs text-gray-500">Separate with commas. We use these for your “You may also like” picks.</p>
        <Field label="Favorite notes" id="acc-notes">
          <input id="acc-notes" className="input" placeholder="vanilla, oud, bergamot" value={data.favoriteNotes} onChange={set("favoriteNotes")} />
        </Field>
        <Field label="Favorite accords" id="acc-accords">
          <input id="acc-accords" className="input" placeholder="woody, amber, citrus" value={data.favoriteAccords} onChange={set("favoriteAccords")} />
        </Field>
        <Field label="Favorite brands" id="acc-brands">
          <input id="acc-brands" className="input" placeholder="Maison Margiela, Dior" value={data.favoriteBrands} onChange={set("favoriteBrands")} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="mb-2 font-bold">Fragrantica</legend>
        <Field label="Your Fragrantica profile link" id="acc-fragrantica">
          <input
            id="acc-fragrantica"
            className="input"
            type="url"
            placeholder="https://www.fragrantica.com/member/123456"
            value={data.fragranticaUrl}
            onChange={set("fragranticaUrl")}
          />
        </Field>
        {data.fragranticaUrl && (
          <a href={data.fragranticaUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
            Open my Fragrantica profile
          </a>
        )}
      </fieldset>

      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
        {status.ok && <span className="text-sm text-green-700">{status.ok}</span>}
        {status.error && <span className="text-sm text-red-600">{status.error}</span>}
      </div>
    </form>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
    </div>
  );
}
