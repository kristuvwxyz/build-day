import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";
import { SHOP_NAME } from "@/lib/config";
import { FOOTER_TEXT, MAIN_NAV, googleFontsHref, themeCss } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: SHOP_NAME,
  description: "Pre-order and on-hand items, shipped nationwide.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={googleFontsHref()} />
        <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
      </head>
      <body>
        <Providers>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="space-y-4 border-t border-accent/20 bg-surface py-10 text-center text-xs text-gray-500">
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 uppercase tracking-[0.18em]">
              {[
                ...MAIN_NAV,
                { label: "My Orders", href: "/profile?tab=orders" },
                { label: "Wishlist", href: "/profile?tab=wishlist" },
                { label: "My Account", href: "/profile?tab=account" },
                { label: "Contact Us", href: "/contact" },
              ].map((l) => (
                <a key={l.href} href={l.href} className="hover:text-accent">
                  {l.label}
                </a>
              ))}
            </nav>
            <p>
              © {new Date().getFullYear()} {SHOP_NAME}. {FOOTER_TEXT}
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
