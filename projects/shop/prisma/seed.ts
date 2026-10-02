// Sample products and a voucher so the shop isn't empty. Run: npm run db:seed
// Replace these with your real perfumes in Admin → Products.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    slug: "sample-amber-preorder", name: "Sample Amber Eau de Parfum", price: 350000, type: "PREORDER", eta: "Arrives mid-December", stock: 0,
    brand: "Sample House", concentration: "EDP", sizeMl: 70, gender: "Unisex", releaseYear: 2015, perfumer: "Sample Perfumer",
    topNotes: "saffron, jasmine", heartNotes: "amberwood, ambergris", baseNotes: "fir resin, cedar",
    accords: "amber:100, woody:80, warm spicy:60, sweet:45", longevity: "Long lasting", sillage: "Strong",
  },
  {
    slug: "sample-vanilla-preorder", name: "Sample Vanilla Tobacco", price: 120000, type: "PREORDER", eta: "Arrives January", stock: 0,
    brand: "Sample House", concentration: "EDP", sizeMl: 50, gender: "Unisex", releaseYear: 2007,
    topNotes: "tobacco leaf, spicy notes", heartNotes: "vanilla, cacao, tonka bean", baseNotes: "dried fruits, woody notes",
    accords: "tobacco:100, vanilla:90, sweet:70, warm spicy:55, woody:40", longevity: "Very long lasting", sillage: "Enormous",
  },
  {
    slug: "sample-citrus-onhand", name: "Sample Citrus Cologne", price: 25000, type: "ONHAND", stock: 20,
    brand: "Fresh Co.", concentration: "EDT", sizeMl: 100, gender: "Men", releaseYear: 2019,
    topNotes: "bergamot, lemon, grapefruit", heartNotes: "lavender, geranium", baseNotes: "vetiver, musk",
    accords: "citrus:100, fresh:85, aromatic:60, woody:35", longevity: "Moderate", sillage: "Moderate",
  },
  {
    slug: "sample-rose-onhand", name: "Sample Rose Oud", price: 59900, type: "ONHAND", stock: 5,
    brand: "Fresh Co.", concentration: "Parfum", sizeMl: 50, gender: "Women", releaseYear: 2021,
    topNotes: "pink pepper, raspberry", heartNotes: "rose, saffron", baseNotes: "oud, amber, patchouli",
    accords: "rose:100, oud:75, amber:60, warm spicy:50", longevity: "Long lasting", sillage: "Strong",
  },
  {
    slug: "sample-woody-onhand", name: "Sample Cedar & Amber", price: 89000, type: "ONHAND", stock: 8,
    brand: "Sample House", concentration: "EDP", sizeMl: 100, gender: "Unisex", releaseYear: 2020,
    topNotes: "cardamom, pink pepper", heartNotes: "cedar, iris", baseNotes: "amber, sandalwood",
    accords: "woody:100, amber:70, powdery:45, warm spicy:40", longevity: "Long lasting", sillage: "Moderate",
  },
];

async function main() {
  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: p,
      create: {
        ...p,
        description: "Replace this with your product description.",
        imageUrl: `https://picsum.photos/seed/${p.slug}/600/600`,
      },
    });
  }
  await prisma.voucher.upsert({
    where: { code: "WELCOME100" },
    update: {},
    create: { code: "WELCOME100", type: "FIXED", value: 10000, minSpend: 100000, description: "Sample: ₱100 off ₱1,000+" },
  });
  console.log(`Seeded ${products.length} products and voucher WELCOME100`);
}

main().finally(() => prisma.$disconnect());
