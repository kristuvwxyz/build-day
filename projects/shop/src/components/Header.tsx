import Link from "next/link";
import { getSession } from "@/lib/auth";
import { MAIN_SITE_URL, SHOP_NAME } from "@/lib/config";
import { MAIN_NAV, THEME } from "@/lib/theme";
import { CartLink } from "./CartLink";

export async function Header() {
  const session = await getSession();
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href={MAIN_SITE_URL || "/"} className="font-heading text-lg font-extrabold tracking-tight">
          {THEME.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={THEME.logoUrl} alt={SHOP_NAME} className="h-9 w-auto" />
          ) : (
            SHOP_NAME
          )}
        </a>
        <nav className="flex items-center gap-1">
          {MAIN_NAV.map((l) => (
            <a key={l.href} href={l.href} className="hidden rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100 md:block">
              {l.label}
            </a>
          ))}
          <Link href="/" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100">
            Shop
          </Link>
          <Link href="/contact" className="hidden rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100 sm:block">
            Contact Us
          </Link>
          {session && (
            <Link href="/profile?tab=wishlist" className="hidden rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100 sm:block">
              Wishlist
            </Link>
          )}
          <CartLink />
          {session?.user.isAdmin && (
            <Link href="/admin" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100">
              Admin
            </Link>
          )}
          {session ? (
            <Link href="/profile" className="ml-1 flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="h-7 w-7 rounded-full" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {(session.user.name ?? "U")[0]}
                </span>
              )}
              <span className="hidden text-sm font-medium sm:inline">My Profile</span>
            </Link>
          ) : (
            <Link href="/login" className="btn-primary ml-1 py-2">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
