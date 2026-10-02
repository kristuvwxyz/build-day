import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";
import { SHOP_NAME } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: SHOP_NAME,
  description: "Pre-order and on-hand items, shipped nationwide.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="border-t border-gray-200 py-8 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} {SHOP_NAME}. Standard shipping via J&T Express · Same-day via Lalamove / Grab
          </footer>
        </Providers>
      </body>
    </html>
  );
}
