import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { TypeBadge } from "@/components/TypeBadge";
import { getSession } from "@/lib/auth";
import { peso } from "@/lib/money";
import { hasPerfumeCard } from "@/lib/perfume";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const session = await getSession();
  if (!session?.user.isAdmin) notFound();
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-medium text-brand">Admin</h1>
      <AdminNav current="products" />
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/products/new" className="btn-primary">
          + Add product
        </Link>
        <Link href="/admin/products/import" className="btn-outline">
          Import from Shopify
        </Link>
      </div>
      <div className="space-y-2">
        {products.map((p) => (
          <Link key={p.id} href={`/admin/products/${p.id}`} className="card flex flex-wrap items-center justify-between gap-2 p-3 text-sm hover:shadow">
            <span className="flex items-center gap-2">
              <TypeBadge type={p.type} />
              <b>{p.name}</b>
              {!p.isActive && <span className="text-xs text-gray-500">(hidden)</span>}
            </span>
            <span className="text-gray-600">
              {peso(p.price)} · {p.type === "ONHAND" ? `${p.stock} in stock` : p.eta ?? "pre-order"} ·{" "}
              {hasPerfumeCard(p) ? "perfume card ✓" : <span className="text-orange-600">no perfume card</span>}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
