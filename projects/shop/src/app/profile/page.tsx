import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountForm } from "@/components/AccountForm";
import { AddressBook } from "@/components/AddressBook";
import { SignOutButton } from "@/components/SignOutButton";
import { StatusBadge } from "@/components/StatusBadge";
import { TypeBadge } from "@/components/TypeBadge";
import { WishlistButton } from "@/components/WishlistButton";
import { getSession } from "@/lib/auth";
import { peso } from "@/lib/money";
import { prisma } from "@/lib/prisma";

const TABS = [
  { id: "orders", label: "My Orders" },
  { id: "wishlist", label: "My Wishlist" },
  { id: "account", label: "My Account" },
] as const;

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/profile");
  const { tab: rawTab } = await searchParams;
  const tab = TABS.some((t) => t.id === rawTab) ? rawTab! : "orders";
  const user = session.user;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="h-16 w-16 rounded-full" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">
            {(user.name ?? "U")[0]}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-medium text-brand">Hi, {user.name?.split(" ")[0] ?? "there"}!</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <nav className="flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/profile?tab=${t.id}`}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${
              tab === t.id ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "orders" && <OrdersTab userId={user.id} />}
      {tab === "wishlist" && <WishlistTab userId={user.id} />}
      {tab === "account" && <AccountTab userId={user.id} />}
    </div>
  );
}

async function OrdersTab({ userId }: { userId: string }) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  if (orders.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="font-semibold">No orders yet</p>
        <Link href="/" className="btn-primary mt-4">
          Start shopping
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <Link key={o.id} href={`/profile/orders/${o.id}`} className="card block p-4 transition hover:shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold">{o.orderNumber}</span>
              <TypeBadge type={o.type} />
            </div>
            <StatusBadge status={o.status} />
          </div>
          <p className="mt-2 line-clamp-1 text-sm text-gray-600">
            {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
          </p>
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-gray-500">
            <span>{o.createdAt.toLocaleDateString("en-PH", { dateStyle: "medium" })}</span>
            <span>
              Total <b className="text-gray-900">{peso(o.total)}</b>
              {o.balanceDue > 0 && o.status !== "CANCELLED" && (
                <span className="ml-2 font-semibold text-orange-600">Balance {peso(o.balanceDue)}</span>
              )}
            </span>
          </div>
          {o.status === "BALANCE_DUE" && (
            <p className="mt-3 rounded-theme bg-orange-50 p-2 text-center text-sm font-semibold text-orange-800">
              Your pre-order has arrived! Tap to pay the balance →
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}

async function WishlistTab({ userId }: { userId: string }) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  if (items.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="font-semibold">Your wishlist is empty</p>
        <p className="mt-1 text-sm text-gray-500">Tap the ♥ on any product to save it here.</p>
        <Link href="/" className="btn-primary mt-4">
          Browse products
        </Link>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map(({ product: p }) => {
        const unavailable = !p.isActive || (p.type === "ONHAND" && p.stock <= 0);
        return (
          <div key={p.id} className="card overflow-hidden">
            <Link href={`/product/${p.slug}`} className="relative block aspect-square bg-gray-100">
              {p.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
              )}
              <div className="absolute left-2 top-2">
                <TypeBadge type={p.type} />
              </div>
              <WishlistButton productId={p.id} initial className="absolute right-2 top-2" />
            </Link>
            <div className="space-y-2 p-3">
              <p className="line-clamp-2 text-sm font-semibold">{p.name}</p>
              <p className="font-bold">{peso(p.price)}</p>
              {unavailable ? (
                <p className="text-xs font-semibold text-gray-500">Currently unavailable</p>
              ) : (
                <Link href={`/product/${p.slug}`} className="btn-primary w-full py-2 text-xs">
                  {p.type === "PREORDER" ? "Pre-order now" : "Buy now"}
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

async function AccountTab({ userId }: { userId: string }) {
  const [u, addresses] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
  ]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card p-5">
        <AccountForm
          initial={{
            name: u.name ?? "",
            email: u.email,
            phone: u.phone ?? "",
            birthday: u.birthday ? u.birthday.toISOString().slice(0, 10) : "",
            favoriteNotes: u.favoriteNotes,
            favoriteAccords: u.favoriteAccords,
            favoriteBrands: u.favoriteBrands,
            fragranticaUrl: u.fragranticaUrl ?? "",
          }}
        />
      </div>
      <div className="space-y-6">
        <div className="card p-5">
          <AddressBook initial={addresses} />
        </div>
        <div className="card space-y-2 p-5 text-sm">
          <h3 className="font-medium text-brand">Security</h3>
          <p className="text-gray-600">
            Two-step verification is on. Each time you log in, we email a 6-digit code to {u.email ?? "your email"}.
          </p>
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
