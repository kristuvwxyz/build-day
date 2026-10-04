// ============================================================
//  LOOK & FEEL: match this to the Webcake site.
//  Change colors, fonts, logo and menu here; every shop page follows.
// ============================================================

export const THEME = {
  // Matched to regal.famcoventures.com (Regal Spritz)
  colors: {
    brand: "#3d1a6e", // royal purple: buttons, headings, announcement bar
    brandHover: "#2c1252",
    accent: "#b08d3c", // gold: eyebrows, outlines, highlights
    background: "#faf8f4", // cream page background
    surface: "#ffffff", // cards
    text: "#2b2233", // main text
  },
  fonts: {
    heading: "Cormorant Garamond", // serif headings ("Fragrance, fit for royalty.")
    body: "Jost", // clean sans for text, menu and buttons
  },
  // Paste the crest image URL from Webcake here to show it above the name.
  logoUrl: "",
  radius: "0px", // square corners like the Webcake buttons
};

// Purple bar at the very top of every page.
export const ANNOUNCEMENT = [
  "100% Authentic — money back if proven fake",
  "On-hand pieces ship within 24 hours",
  "Nationwide delivery",
];

// Header menu, split around the centered logo like the Webcake site.
// Shop filters start with "/"; Webcake pages use the full address.
export const NAV_LEFT: { label: string; href: string }[] = [
  { label: "Shop", href: "/" },
  { label: "For Her", href: "/?gender=Women" },
  { label: "For Him", href: "/?gender=Men" },
  { label: "Unisex", href: "/?gender=Unisex" },
];
export const NAV_RIGHT: { label: string; href: string }[] = [
  { label: "Arabian", href: "/?tag=arabian" },
  { label: "Pre-order", href: "/?type=PREORDER" },
  { label: "Authenticity", href: "https://regal.famcoventures.com/#authenticity" },
];
export const MAIN_NAV = [...NAV_LEFT, ...NAV_RIGHT];

// Heading area on the shop page.
export const SHOP_HERO = {
  eyebrow: "Authentic designer & niche perfume · Philippines",
  subtitle: "Genuine bottles from the world's great perfume houses — sealed, tester and partials — hand-checked and sent from our court to yours.",
};

export const FOOTER_TEXT = "100% authentic · Standard shipping via J&T Express · Same-day via Lalamove / Grab";

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
    .map((f) => `family=${f.trim().replace(/\s+/g, "+")}:ital,wght@0,400;0,500;0,600;1,400`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
