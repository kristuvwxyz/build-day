// ============================================================
//  LOOK & FEEL: match this to the Webcake site.
//  Change colors, fonts, logo and menu here; every shop page follows.
// ============================================================

export const THEME = {
  colors: {
    brand: "#111827", // buttons, headings, active tabs
    brandHover: "#374151", // button hover
    accent: "#e11d48", // hearts, cart count, highlights
    background: "#f9fafb", // page background
    surface: "#ffffff", // cards
    text: "#111827", // main text
  },
  fonts: {
    // Any Google Fonts names, e.g. "Playfair Display", "Montserrat", "Cormorant Garamond"
    heading: "Inter",
    body: "Inter",
  },
  // Logo image URL (copy it from the Webcake site). Leave "" to show the shop name as text.
  logoUrl: "",
  // Card / button corner roundness: "0px" square · "8px" soft · "9999px" pill buttons
  radius: "12px",
};

// Menu links back to the Webcake pages (shown in the shop header and footer).
// Example: { label: "About", href: "https://yourdomain.com/about" }
export const MAIN_NAV: { label: string; href: string }[] = [];

export const FOOTER_TEXT = "Standard shipping via J&T Express · Same-day via Lalamove / Grab";

/** "#e11d48" → "225 29 72" (for Tailwind colors that support opacity like bg-brand/20) */
export function rgbTriplet(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function themeCss() {
  const c = THEME.colors;
  return `:root{--brand:${rgbTriplet(c.brand)};--brand-hover:${rgbTriplet(c.brandHover)};--accent:${rgbTriplet(c.accent)};--bg:${rgbTriplet(c.background)};--surface:${rgbTriplet(c.surface)};--text:${rgbTriplet(c.text)};--radius:${THEME.radius};--font-heading:"${THEME.fonts.heading}",system-ui,sans-serif;--font-body:"${THEME.fonts.body}",system-ui,sans-serif}`;
}

export function googleFontsHref() {
  const families = Array.from(new Set([THEME.fonts.heading, THEME.fonts.body]))
    .map((f) => `family=${f.trim().replace(/\s+/g, "+")}:wght@400;600;700;800`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
