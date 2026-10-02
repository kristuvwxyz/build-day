import Link from "next/link";

export function AdminNav({ current }: { current: "orders" | "products" | "vouchers" | "messages" }) {
  const links = [
    { id: "orders", href: "/admin", label: "Orders" },
    { id: "products", href: "/admin/products", label: "Products" },
    { id: "vouchers", href: "/admin/vouchers", label: "Vouchers" },
    { id: "messages", href: "/admin/messages", label: "Messages" },
  ];
  return (
    <nav className="flex gap-1 border-b border-gray-200">
      {links.map((l) => (
        <Link
          key={l.id}
          href={l.href}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${
            current === l.id ? "border-brand" : "border-transparent text-gray-500"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
