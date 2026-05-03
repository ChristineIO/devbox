import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const DEMO_EMAIL = "demo@devbox.io";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const confirmed = process.argv.includes("--confirm");

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const demo = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
    if (!demo) {
      console.log(`✗ Demo user (${DEMO_EMAIL}) not found — refusing to run.`);
      console.log(`  Run \`npx prisma db seed\` first.`);
      process.exit(1);
    }

    const targets = await prisma.user.findMany({
      where: { email: { not: DEMO_EMAIL } },
      select: { id: true, email: true, name: true },
      orderBy: { createdAt: "asc" },
    });

    if (targets.length === 0) {
      console.log("✓ No non-demo users found. Nothing to delete.");
      return;
    }

    console.log(`Found ${targets.length} non-demo user(s):`);
    for (const u of targets) {
      console.log(`  - ${u.email ?? "(no email)"} (${u.name ?? "no name"})`);
    }

    if (!confirmed) {
      console.log("\nDry run. Re-run with --confirm to delete these users and all their content.");
      return;
    }

    const targetIds = targets.map((u) => u.id);
    const targetEmails = targets
      .map((u) => u.email)
      .filter((e): e is string => typeof e === "string");

    const result = await prisma.$transaction([
      prisma.verificationToken.deleteMany({
        where: { identifier: { in: targetEmails } },
      }),
      prisma.user.deleteMany({
        where: { id: { in: targetIds } },
      }),
    ]);

    console.log(`\n✓ Deleted ${result[1].count} user(s).`);
    console.log(`✓ Deleted ${result[0].count} verification token(s).`);
    console.log("  (Items, collections, item types, accounts, and sessions cascaded.)");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("✗ Delete failed:", err);
  process.exit(1);
});
