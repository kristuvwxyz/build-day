// Perfume card data helpers. Notes are comma-separated; accords are "name:strength" pairs.

export const splitList = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export type Accord = { name: string; strength: number };

/** "woody:100, amber:80, vanilla" → [{woody,100},{amber,80},{vanilla,50}] (sorted strongest first) */
export function parseAccords(s: string): Accord[] {
  return splitList(s)
    .map((part) => {
      const [name, value] = part.split(":").map((x) => x.trim());
      const n = Number(value);
      return { name: name.toLowerCase(), strength: Number.isFinite(n) ? Math.max(5, Math.min(100, n)) : 50 };
    })
    .filter((a) => a.name)
    .sort((a, b) => b.strength - a.strength);
}

// Familiar colours per accord (similar to what perfume sites use). Unknown accords get a stable grey-blue.
const ACCORD_COLORS: Record<string, string> = {
  woody: "#774414", amber: "#bc4d10", vanilla: "#fffea3", sweet: "#ee363b", citrus: "#f9ff52",
  fresh: "#9be5ed", "fresh spicy": "#83c928", "warm spicy": "#cc3300", spicy: "#ce3b17", floral: "#ff5f8d",
  "white floral": "#ede6f4", rose: "#fe016b", fruity: "#fc4b29", aromatic: "#37a089", powdery: "#eedbd7",
  musky: "#e3cce4", leather: "#875845", oud: "#6b4226", aquatic: "#6bd1f3", green: "#0e8c1d",
  balsamic: "#9e7b5e", earthy: "#544838", smoky: "#8e8988", lactonic: "#fef8e7", tobacco: "#a87d4f",
  "soft spicy": "#de7f45", herbal: "#6ca15c", ozonic: "#9cd6e6", coffee: "#5e3a1a", cacao: "#6a3e25",
  honey: "#f8b33b", iris: "#b9a0d6", violet: "#9a69d2", lavender: "#b49fd9", patchouli: "#5f5737",
  tropical: "#f7c331", mossy: "#757a32", animalic: "#8b4513", salty: "#e7f7fd", caramel: "#c8823c",
};

export function accordColor(name: string) {
  return ACCORD_COLORS[name.toLowerCase()] ?? "#8aa1b4";
}

/** Dark or light text, whichever reads better on the accord colour. */
export function textOn(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#1f2937" : "#ffffff";
}

export function hasPerfumeCard(p: { topNotes: string; heartNotes: string; baseNotes: string; accords: string }) {
  return Boolean(p.topNotes || p.heartNotes || p.baseNotes || p.accords);
}
