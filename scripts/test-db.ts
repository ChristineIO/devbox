import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const DEMO_EMAIL = "demo@devbox.io";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const [users, items, collections, itemTypes] = await Promise.all([
      prisma.user.count(),
      prisma.item.count(),
      prisma.collection.count(),
      prisma.itemType.findMany({
        where: { isSystem: true },
        orderBy: { name: "asc" },
      }),
    ]);

    console.log("✓ Connected to database");
    console.log(`  Users:       ${users}`);
    console.log(`  Items:       ${items}`);
    console.log(`  Collections: ${collections}`);
    console.log(`  System types (${itemTypes.length}):`);
    for (const type of itemTypes) {
      console.log(`    - ${type.name.padEnd(8)} ${type.color}  ${type.icon}`);
    }

    const demo = await prisma.user.findUnique({
      where: { email: DEMO_EMAIL },
      include: {
        collections: {
          orderBy: { name: "asc" },
          include: {
            defaultType: true,
            items: {
              include: {
                item: { include: { itemType: true } },
              },
            },
          },
        },
      },
    });

    if (!demo) {
      console.log(`\n✗ Demo user (${DEMO_EMAIL}) not found — run \`npx prisma db seed\`.`);
      return;
    }

    console.log(`\n✓ Demo user: ${demo.name} <${demo.email}>`);
    console.log(`  isPro:         ${demo.isPro}`);
    console.log(`  emailVerified: ${demo.emailVerified?.toISOString() ?? "—"}`);
    console.log(`  passwordHash:  ${demo.password ? "set" : "missing"}`);
    console.log(`  Collections (${demo.collections.length}):`);

    for (const collection of demo.collections) {
      const typeLabel = collection.defaultType ? ` [${collection.defaultType.name}]` : "";
      console.log(`    • ${collection.name}${typeLabel} — ${collection.items.length} item(s)`);
      for (const link of collection.items) {
        console.log(`        - [${link.item.itemType.name}] ${link.item.title}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("✗ Database test failed:", err);
  process.exit(1);
});
