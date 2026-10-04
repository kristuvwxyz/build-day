import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { getSession } from "@/lib/auth";
import { importShopifyProducts } from "../../actions";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; skipped?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session?.user.isAdmin) notFound();
  const r = await searchParams;
  const done = r.created !== undefined;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-medium text-brand">Import products from Shopify</h1>
      <AdminNav current="products" />

      {done && (
        <div className="card space-y-2 border-green-300 bg-green-50 p-4 text-sm">
          <p className="font-bold text-green-900">
            Import finished: {r.created} added, {r.updated} updated, {r.skipped} skipped.
          </p>
          <p>
            Next: open <Link href="/admin/products" className="underline">Products</Link>, mark pre-orders and add
            their ETA, and fill in each perfume card.
          </p>
        </div>
      )}
      {r.error && <p className="rounded-theme bg-red-50 p-3 text-sm text-red-700">{r.error}</p>}

      <ol className="card list-decimal space-y-2 p-5 pl-10 text-sm">
        <li>
          In <b>Shopify admin → Products</b>, click <b>Export</b> → <b>All products</b> → <b>CSV for Excel, Numbers, or other
          spreadsheet programs</b> → <b>Export products</b>. Shopify emails you the file.
        </li>
        <li>Upload that file below.</li>
      </ol>

      <form action={importShopifyProducts} className="card space-y-3 p-5 text-sm">
        <input id="import-file" type="file" name="file" accept=".csv,text/csv" required />
        <button className="btn-primary">Import products</button>
      </form>

      <div className="card space-y-1 p-5 text-sm text-gray-600">
        <p className="font-bold text-gray-900">How it's imported</p>
        <p>• Each size/variant becomes its own product (e.g. "Perfume X – 50ml").</p>
        <p>• Products tagged <b>pre-order</b> in Shopify come in as PRE-ORDER; everything else as ON-HAND with its stock.</p>
        <p>• Brand = Shopify Vendor. Photo, description, price and active/draft status are copied.</p>
        <p>• Importing again updates name, price, stock and photo only. Perfume cards and ETAs you added are kept.</p>
      </div>
    </div>
  );
}
