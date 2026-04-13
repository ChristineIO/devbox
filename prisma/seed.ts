import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

type SystemType = {
  name: string;
  icon: string;
  color: string;
};

const SYSTEM_TYPES: SystemType[] = [
  { name: "snippet", icon: "Code", color: "#3b82f6" },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "command", icon: "Terminal", color: "#f97316" },
  { name: "note", icon: "StickyNote", color: "#fde047" },
  { name: "link", icon: "Link", color: "#10b981" },
  { name: "file", icon: "File", color: "#6b7280" },
  { name: "image", icon: "Image", color: "#ec4899" },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    for (const type of SYSTEM_TYPES) {
      const existing = await prisma.itemType.findFirst({
        where: { name: type.name, isSystem: true, userId: null },
      });

      if (existing) {
        await prisma.itemType.update({
          where: { id: existing.id },
          data: { icon: type.icon, color: type.color },
        });
        console.log(`Updated system type: ${type.name}`);
      } else {
        await prisma.itemType.create({
          data: { ...type, isSystem: true },
        });
        console.log(`Created system type: ${type.name}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
