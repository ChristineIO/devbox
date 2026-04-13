import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

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
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("✗ Database test failed:", err);
  process.exit(1);
});
