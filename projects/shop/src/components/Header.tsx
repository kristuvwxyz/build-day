import Link from "next/link";
import { getSession } from "@/lib/auth";
import { MAIN_SITE_URL, SHOP_NAME } from "@/lib/config";
import { ANNOUNCEMENT, NAV_LEFT, NAV_RIGHT, THEME } from "@/lib/theme";
import { CartLink } from "./CartLink";

const navLink = "whitespace-nowrap text-[12px] uppercase tracking-[0.22em] text-ink hover:text-accent";

function NavItem({ label, href }: { label: string; href: string }) {
  return href.startsWith("/") ? (
    <Link href={href} className={navLink}>
      {label}
    </Link>
  ) : (
    <a href={href} className={navLink}>
      {label}
    </a>
  );
}

export async function Header() {
  const session = await getSession();
  return (
    <header className="sticky top-0 z-20">
      {ANNOUNCEMENT.length > 0 && (
        <div className="bg-brand px-4 py-2 text-center text-[10px] uppercase tracking-[0.25em] text-white sm:text-[11px]">
          {ANNOUNCEMENT.map((t, i) => (
            <span key={t} className={i > 0 ? "hidden md:inline" : ""}>
              {i > 0 && <span className="mx-4 text-accent">•</span>}
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="border-b border-accent/20 bg-surface/95 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 sm:gap-4">
          <nav className="hidden items-center gap-5 xl:gap-7 lg:flex">
            {NAV_LEFT.map((l) => (
              <NavItem key={l.href} {...l} />
            ))}
          </nav>
          <Link href="/" className="text-xs uppercase tracking-[0.2em] lg:hidden">
            Shop
          </Link>

          <a href={MAIN_SITE_URL || "/"} className="flex flex-col items-center gap-1 text-brand">
            {THEME.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={THEME.logoUrl} alt="" className="h-10 w-10 rounded-full" />
            )}
            <span className="whitespace-nowrap font-heading text-base uppercase tracking-[0.2em] sm:text-2xl sm:tracking-[0.3em]">{SHOP_NAME}</span>
          </a>

          <div className="flex items-center justify-end gap-4 sm:gap-6">
            <nav className="hidden items-center gap-5 xl:gap-7 lg:flex">
              {NAV_RIGHT.map((l) => (
                <NavItem key={l.href} {...l} />
              ))}
            </nav>
            {session?.user.isAdmin && (
              <Link href="/admin" className={navLink}>
                Admin
              </Link>
            )}
            <Link
              href={session ? "/profile" : "/login"}
              aria-label={session ? "My account" : "Log in"}
              title={session ? "My account" : "Log in"}
              className="text-ink hover:text-accent"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
              </svg>
            </Link>
            <CartLink />
          </div>
        </div>
        {/* Mobile menu row */}
        <nav className="flex gap-5 overflow-x-auto border-t border-accent/10 px-4 py-2 lg:hidden">
          {[...NAV_LEFT, ...NAV_RIGHT].map((l) => (
            <span key={l.href} className="shrink-0">
              <NavItem {...l} />
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
