import type { Product } from "@prisma/client";
import { accordColor, hasPerfumeCard, parseAccords, splitList, textOn } from "@/lib/perfume";

// Perfume card: main accords + notes pyramid, filled in per product by the shop.
export function PerfumeCard({ product, className = "" }: { product: Product; className?: string }) {
  if (!hasPerfumeCard(product)) return null;
  const accords = parseAccords(product.accords);
  const facts = [
    product.brand && ["Brand", product.brand],
    product.concentration && ["Concentration", product.concentration + (product.sizeMl ? ` · ${product.sizeMl} ml` : "")],
    product.gender && ["For", product.gender],
    product.releaseYear && ["Launched", String(product.releaseYear)],
    product.perfumer && ["Perfumer", product.perfumer],
    product.longevity && ["Longevity", product.longevity],
    product.sillage && ["Sillage", product.sillage],
  ].filter(Boolean) as [string, string][];
  const pyramid = [
    ["Top notes", splitList(product.topNotes)],
    ["Heart notes", splitList(product.heartNotes)],
    ["Base notes", splitList(product.baseNotes)],
  ].filter(([, notes]) => notes.length > 0) as [string, string[]][];

  return (
    <section className={`card space-y-5 p-5 ${className}`} aria-label="Perfume card">
      {facts.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt className="label">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {accords.length > 0 && (
        <div>
          <h3 className="label">Main accords</h3>
          <ul className="space-y-1">
            {accords.map((a) => (
              <li key={a.name}>
                <span
                  className="block rounded-md px-2 py-0.5 text-xs font-semibold capitalize"
                  style={{ width: `${a.strength}%`, background: accordColor(a.name), color: textOn(accordColor(a.name)) }}
                >
                  {a.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pyramid.map(([label, notes]) => (
        <div key={label}>
          <h3 className="label">{label}</h3>
          <ul className="flex flex-wrap gap-1.5">
            {notes.map((n) => (
              <li key={n} className="rounded-full border px-2.5 py-0.5 text-xs capitalize">
                {n}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {product.fragranticaUrl && (
        <a href={product.fragranticaUrl} target="_blank" rel="noreferrer" className="inline-block text-sm text-blue-600 underline">
          View this perfume on Fragrantica ↗
        </a>
      )}
    </section>
  );
}
