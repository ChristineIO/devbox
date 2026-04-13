import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@devbox.io";

export type CollectionType = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type CollectionCardData = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  types: CollectionType[];
  mostUsedType: CollectionType | null;
};

export type CollectionStats = {
  total: number;
  favorites: number;
};

async function getDemoUserId(): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function getRecentCollections(
  limit = 6,
): Promise<CollectionCardData[]> {
  const userId = await getDemoUserId();
  if (!userId) return [];

  const rows = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      items: {
        include: {
          item: {
            select: {
              itemType: {
                select: { id: true, name: true, icon: true, color: true },
              },
            },
          },
        },
      },
    },
  });

  return rows.map((col) => {
    const typeCounts = new Map<string, { type: CollectionType; count: number }>();
    for (const link of col.items) {
      const t = link.item.itemType;
      const existing = typeCounts.get(t.id);
      if (existing) {
        existing.count += 1;
      } else {
        typeCounts.set(t.id, {
          type: { id: t.id, name: t.name, icon: t.icon, color: t.color },
          count: 1,
        });
      }
    }

    const entries = Array.from(typeCounts.values());
    entries.sort((a, b) => b.count - a.count);
    const mostUsedType = entries[0]?.type ?? null;
    const types = entries.map((e) => e.type);

    return {
      id: col.id,
      name: col.name,
      description: col.description,
      isFavorite: col.isFavorite,
      itemCount: col.items.length,
      types,
      mostUsedType,
    };
  });
}

export async function getCollectionStats(): Promise<CollectionStats> {
  const userId = await getDemoUserId();
  if (!userId) return { total: 0, favorites: 0 };

  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}
