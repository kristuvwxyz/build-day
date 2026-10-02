// Live same-day delivery price from Lalamove.
//  1. Google Geocoding turns the buyer's address into map coordinates.
//  2. Lalamove's quotation API prices a rider from SHOP_PICKUP to that point.
//  3. The price is signed so the buyer pays exactly what they were shown.
// Docs: https://developers.lalamove.com  (API v3, market PH)
import crypto from "crypto";
import { LALAMOVE_SERVICE_TYPE, SAMEDAY_EXTRA_FEE, SHOP_PICKUP } from "./config";

const LALAMOVE_BASE = process.env.LALAMOVE_BASE_URL ?? "https://rest.sandbox.lalamove.com";
const GEOCODE_URL = process.env.GOOGLE_GEOCODE_URL ?? "https://maps.googleapis.com/maps/api/geocode/json";
const QUOTE_VALID_MINUTES = 30;

export type DropOff = { address: string; barangay: string; city: string };
export type SameDayQuote = { fee: number; lat: number; lng: number; mapAddress: string };

export function liveSameDayEnabled() {
  return Boolean(
    SHOP_PICKUP &&
      process.env.LALAMOVE_API_KEY &&
      process.env.LALAMOVE_API_SECRET &&
      process.env.GOOGLE_MAPS_API_KEY,
  );
}

const fullAddress = (d: DropOff) => `${d.address}, Brgy. ${d.barangay}, ${d.city}, Metro Manila, Philippines`;

async function geocode(d: DropOff) {
  const url = new URL(GEOCODE_URL);
  url.searchParams.set("address", fullAddress(d));
  url.searchParams.set("components", "country:PH");
  url.searchParams.set("key", process.env.GOOGLE_MAPS_API_KEY!);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    status: string;
    results: { formatted_address: string; geometry: { location: { lat: number; lng: number } } }[];
  };
  const top = data.status === "OK" ? data.results[0] : undefined;
  if (!top) return null;
  return { lat: top.geometry.location.lat, lng: top.geometry.location.lng, mapAddress: top.formatted_address };
}

async function lalamove(method: string, path: string, body: unknown) {
  const json = JSON.stringify(body);
  const time = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", process.env.LALAMOVE_API_SECRET!)
    .update(`${time}\r\n${method}\r\n${path}\r\n\r\n${json}`)
    .digest("hex");
  return fetch(LALAMOVE_BASE + path, {
    method,
    headers: {
      Authorization: `hmac ${process.env.LALAMOVE_API_KEY}:${time}:${signature}`,
      Market: "PH",
      "Request-ID": crypto.randomUUID(),
      "Content-Type": "application/json",
    },
    body: json,
    cache: "no-store",
  });
}

/** Returns the live price, or an error message to show the buyer. */
export async function quoteSameDay(d: DropOff): Promise<SameDayQuote | { error: string }> {
  const point = await geocode(d);
  if (!point) return { error: "We couldn't find that address on the map. Please check the street and barangay." };

  const res = await lalamove("POST", "/v3/quotations", {
    data: {
      serviceType: LALAMOVE_SERVICE_TYPE,
      language: "en_PH",
      stops: [
        { coordinates: { lat: String(SHOP_PICKUP!.lat), lng: String(SHOP_PICKUP!.lng) }, address: SHOP_PICKUP!.address },
        { coordinates: { lat: String(point.lat), lng: String(point.lng) }, address: point.mapAddress },
      ],
    },
  });
  if (!res.ok) {
    console.error("Lalamove quote failed", res.status, await res.text());
    return { error: "Same-day delivery isn't available for this address right now. Please choose J&T." };
  }
  const data = (await res.json()) as { data: { priceBreakdown: { total: string; currency: string } } };
  const total = data.data.priceBreakdown;
  if (total.currency !== "PHP") return { error: "Same-day delivery price unavailable." };
  // Round up to the next whole peso.
  const fee = Math.ceil(Number(total.total)) * 100 + SAMEDAY_EXTRA_FEE;
  return { fee, ...point };
}

// ---------- Signed quote token ----------

const addressKey = (d: DropOff) =>
  [d.address, d.barangay, d.city].map((s) => s.trim().toLowerCase().replace(/\s+/g, " ")).join("|");

const hmac = (payload: string) =>
  crypto.createHmac("sha256", process.env.NEXTAUTH_SECRET ?? "dev-secret").update(payload).digest("base64url");

export function signQuote(q: SameDayQuote, d: DropOff, userId: string) {
  const payload = Buffer.from(
    JSON.stringify({ ...q, a: addressKey(d), u: userId, exp: Date.now() + QUOTE_VALID_MINUTES * 60_000 }),
  ).toString("base64url");
  return `${payload}.${hmac(payload)}`;
}

/** Returns the quote if the token is genuine, unexpired and for this buyer + address. */
export function verifyQuote(token: string, d: DropOff, userId: string): SameDayQuote | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = hmac(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const q = JSON.parse(Buffer.from(payload, "base64url").toString()) as SameDayQuote & { a: string; u: string; exp: number };
  if (q.exp < Date.now() || q.u !== userId || q.a !== addressKey(d)) return null;
  return { fee: q.fee, lat: q.lat, lng: q.lng, mapAddress: q.mapAddress };
}
