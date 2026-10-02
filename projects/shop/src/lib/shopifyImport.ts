// Imports products from a Shopify "Export products" CSV (Shopify admin → Products → Export → CSV for Excel…).
// One shop product per Shopify variant. Re-importing updates name, price, stock and photo, and keeps
// anything you added here (perfume card, pre-order ETA).
import { prisma } from "./prisma";
import { normalizeTags } from "./productFilters";

/** Minimal CSV parser: handles quotes, commas and new lines inside quoted fields. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

const stripHtml = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const isPreorderTag = (tags: string) => /\bpre[\s-]?orders?\b/i.test(tags);

export type ImportResult = { created: number; updated: number; skipped: number; errors: string[] };

export async function importShopifyCsv(text: string): Promise<ImportResult> {
  const rows = parseCsv(text);
  if (rows.length < 2) return { created: 0, updated: 0, skipped: 0, errors: ["The file is empty."] };
  const header = rows[0].map((h) => h.trim());
  const col = (name: string) => header.findIndex((h) => h.toLowerCase() === name.toLowerCase());
  const idx = {
    handle: col("Handle"),
    title: col("Title"),
    body: col("Body (HTML)"),
    vendor: col("Vendor"),
    tags: col("Tags"),
    status: col("Status"),
    published: col("Published"),
    opt1: col("Option1 Value"),
    opt2: col("Option2 Value"),
    opt3: col("Option3 Value"),
    price: col("Variant Price"),
    qty: col("Variant Inventory Qty"),
    variantImage: col("Variant Image"),
    image: col("Image Src"),
    imagePos: col("Image Position"),
  };
  if (idx.handle < 0 || idx.price < 0) {
    return {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: ["This doesn't look like a Shopify products export (missing Handle / Variant Price columns)."],
    };
  }
  const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");

  // Group rows by Handle: the first row has the product details, others add variants/images.
  type Group = { first: string[]; variants: string[][]; images: string[] };
  const groups = new Map<string, Group>();
  for (const r of rows.slice(1)) {
    const handle = get(r, idx.handle);
    if (!handle) continue;
    let g = groups.get(handle);
    if (!g) {
      g = { first: r, variants: [], images: [] };
      groups.set(handle, g);
    }
    if (get(r, idx.price)) g.variants.push(r);
    const img = get(r, idx.image);
    if (img) g.images.push(img);
  }

  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };
  for (const [handle, g] of groups) {
    const title = get(g.first, idx.title);
    if (!title || g.variants.length === 0) {
      result.skipped++;
      continue;
    }
    const tags = get(g.first, idx.tags);
    const status = get(g.first, idx.status).toLowerCase();
    const active = status ? status === "active" : get(g.first, idx.published).toLowerCase() !== "false";
    const preorder = isPreorderTag(tags);
    const multi = g.variants.length > 1;

    for (const v of g.variants) {
      const options = [get(v, idx.opt1), get(v, idx.opt2), get(v, idx.opt3)].filter(
        (o) => o && o.toLowerCase() !== "default title",
      );
      const name = multi && options.length ? `${title} – ${options.join(" / ")}` : title;
      const slug = slugify(multi && options.length ? `${handle}-${options.join("-")}` : handle);
      const price = Math.round(Number(get(v, idx.price).replace(/,/g, "")) * 100);
      if (!Number.isFinite(price) || price <= 0) {
        result.errors.push(`${name}: no price, skipped`);
        result.skipped++;
        continue;
      }
      const qtyRaw = get(v, idx.qty);
      const stock = qtyRaw === "" ? 0 : Math.max(0, Math.floor(Number(qtyRaw)) || 0);
      const imageUrl = get(v, idx.variantImage) || g.images[0] || "";

      const existing = await prisma.product.findUnique({ where: { slug } });
      if (existing) {
        await prisma.product.update({
          where: { slug },
          data: { name, price, imageUrl: imageUrl || existing.imageUrl, ...(existing.type === "ONHAND" && qtyRaw !== "" ? { stock } : {}) },
        });
        result.updated++;
      } else {
        await prisma.product.create({
          data: {
            slug,
            name,
            price,
            imageUrl,
            description: stripHtml(get(g.first, idx.body)),
            brand: get(g.first, idx.vendor),
            tags: normalizeTags(tags.replace(/\bpre[\s-]?orders?\b/gi, "")),
            gender: /\b(for her|women|female)\b/i.test(tags) ? "Women" : /\b(for him|men|male)\b/i.test(tags) ? "Men" : /\bunisex\b/i.test(tags) ? "Unisex" : "",
            type: preorder ? "PREORDER" : "ONHAND",
            stock: preorder ? 0 : stock,
            isActive: active,
          },
        });
        result.created++;
      }
    }
  }
  return result;
}
