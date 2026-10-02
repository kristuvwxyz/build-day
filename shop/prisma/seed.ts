// Sample products so the shop isn't empty. Run: npm run db:seed
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  { slug: "sample-preorder-figure", name: "Sample Pre-order Figure", price: 350000, type: "PREORDER", eta: "Arrives mid-December", stock: 0 },
  { slug: "sample-preorder-plush", name: "Sample Pre-order Plush", price: 120000, type: "PREORDER", eta: "Arrives January", stock: 0 },
  { slug: "sample-onhand-keychain", name: "Sample On-hand Keychain", price: 25000, type: "ONHAND", stock: 20 },
  { slug: "sample-onhand-tote", name: "Sample On-hand Tote Bag", price: 59900, type: "ONHAND", stock: 5 },
];

async function main() {
  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...p,
        description: "Replace this with your product description.",
        imageUrl: `https://picsum.photos/seed/${p.slug}/600/600`,
      },
    });
  }
  console.log(`Seeded ${products.length} products`);
}

main().finally(() => prisma.$disconnect());
