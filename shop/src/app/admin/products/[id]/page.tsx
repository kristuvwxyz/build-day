import { notFound } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { ProductForm } from "@/components/ProductForm";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// /admin/products/new adds a product; /admin/products/<id> edits one.
export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user.isAdmin) notFound();
  const { id } = await params;
  const product = id === "new" ? null : await prisma.product.findUnique({ where: { id } });
  if (id !== "new" && !product) notFound();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">{product ? `Edit: ${product.name}` : "Add product"}</h1>
      <AdminNav current="products" />
      <ProductForm product={product} />
    </div>
  );
}
