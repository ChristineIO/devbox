import { prisma } from "@/lib/prisma";
import { getDemoUserId } from "@/lib/db/user";

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

export type SidebarCollection = {
  id: string;
  name: string;
  isFavorite: boolean;
  mostUsedType: CollectionType | null;
};

export async function getSidebarCollections(): Promise<SidebarCollection[]> {
  const userId = await getDemoUserId();
  if (!userId) return [];

  const rows = await prisma.collection.findMany({
    where: { userId },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
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
    const counts = new Map<string, { type: CollectionType; count: number }>();
    for (const link of col.items) {
      const t = link.item.itemType;
      const existing = counts.get(t.id);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(t.id, {
          type: { id: t.id, name: t.name, icon: t.icon, color: t.color },
          count: 1,
        });
      }
    }
    const entries = Array.from(counts.values()).sort(
      (a, b) => b.count - a.count,
    );

    return {
      id: col.id,
      name: col.name,
      isFavorite: col.isFavorite,
      mostUsedType: entries[0]?.type ?? null,
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
