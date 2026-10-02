import type { Product } from "@prisma/client";
import { saveProduct } from "@/app/admin/actions";

// Admin product editor (server form). Perfume-card fields are optional.
export function ProductForm({ product }: { product?: Product | null }) {
  const p = product;
  const txt = (name: keyof Product, label: string, placeholder = "", wide = false) => (
    <label className={wide ? "sm:col-span-2" : ""}>
      <span className="label">{label}</span>
      <input
        id={`product-${name}`}
        name={name}
        className="input"
        placeholder={placeholder}
        defaultValue={p?.[name] == null ? "" : String(p[name])}
      />
    </label>
  );
  return (
    <form action={saveProduct} className="space-y-6 text-sm">
      {p && <input type="hidden" name="id" value={p.id} />}
      <fieldset className="card grid gap-3 p-4 sm:grid-cols-2">
        <legend className="px-1 font-bold">Product</legend>
        {txt("name", "Name *", "Baccarat Rouge 540 EDP 70ml")}
        {txt("slug", "Web address (leave blank to auto-make)", "baccarat-rouge-540")}
        <label>
          <span className="label">Price (₱) *</span>
          <input id="product-price" name="price" type="number" step="0.01" min="1" required className="input" defaultValue={p ? p.price / 100 : ""} />
        </label>
        <label>
          <span className="label">Type</span>
          <select id="product-type" name="type" className="input" defaultValue={p?.type ?? "ONHAND"}>
            <option value="ONHAND">On-hand</option>
            <option value="PREORDER">Pre-order</option>
          </select>
        </label>
        {txt("stock", "Stock (on-hand only)", "0")}
        {txt("eta", "Pre-order ETA", "Arrives mid-December")}
        {txt("imageUrl", "Photo URL", "https://…", true)}
        <label className="sm:col-span-2">
          <span className="label">Description</span>
          <textarea id="product-description" name="description" className="input min-h-[90px]" defaultValue={p?.description ?? ""} />
        </label>
        <label className="flex items-center gap-2">
          <input id="product-active" type="checkbox" name="isActive" defaultChecked={p?.isActive ?? true} /> Show in shop
        </label>
      </fieldset>

      <fieldset className="card grid gap-3 p-4 sm:grid-cols-2">
        <legend className="px-1 font-bold">Perfume card</legend>
        {txt("brand", "Brand", "Maison Francis Kurkdjian")}
        {txt("perfumer", "Perfumer", "Francis Kurkdjian")}
        {txt("concentration", "Concentration", "EDP")}
        {txt("sizeMl", "Size (ml)", "70")}
        <label>
          <span className="label">For</span>
          <select id="product-gender" name="gender" className="input" defaultValue={p?.gender ?? ""}>
            <option value="">—</option>
            <option value="Women">For Her (Women)</option>
            <option value="Men">For Him (Men)</option>
            <option value="Unisex">Unisex</option>
          </select>
        </label>
        {txt("releaseYear", "Year launched", "2015")}
        {txt("topNotes", "Top notes (comma-separated)", "saffron, jasmine", true)}
        {txt("heartNotes", "Heart notes", "amberwood, ambergris", true)}
        {txt("baseNotes", "Base notes", "fir resin, cedar", true)}
        {txt("accords", "Main accords (name:strength 0-100)", "amber:100, woody:80, warm spicy:60", true)}
        {txt("longevity", "Longevity", "Long lasting")}
        {txt("sillage", "Sillage", "Strong")}
        {txt("fragranticaUrl", "Fragrantica page link", "https://www.fragrantica.com/perfume/…", true)}
        {txt("tags", "Collections (comma-separated, e.g. arabian, designer, tester)", "arabian", true)}
      </fieldset>

      <button className="btn-primary">{p ? "Save changes" : "Add product"}</button>
    </form>
  );
}
