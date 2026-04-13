import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@devbox.io";

export type ItemCardType = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type ItemCardData = {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  tags: string[];
  createdAt: Date;
  type: ItemCardType;
};

export type ItemStats = {
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

function mapItem(row: {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  itemType: { id: string; name: string; icon: string; color: string };
  tags: { name: string }[];
}): ItemCardData {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    isFavorite: row.isFavorite,
    isPinned: row.isPinned,
    tags: row.tags.map((t) => t.name),
    createdAt: row.createdAt,
    type: {
      id: row.itemType.id,
      name: row.itemType.name,
      icon: row.itemType.icon,
      color: row.itemType.color,
    },
  };
}

export async function getPinnedItems(): Promise<ItemCardData[]> {
  const userId = await getDemoUserId();
  if (!userId) return [];

  const rows = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { updatedAt: "desc" },
    include: {
      itemType: { select: { id: true, name: true, icon: true, color: true } },
      tags: { select: { name: true } },
    },
  });

  return rows.map(mapItem);
}

export async function getRecentItems(limit = 10): Promise<ItemCardData[]> {
  const userId = await getDemoUserId();
  if (!userId) return [];

  const rows = await prisma.item.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      itemType: { select: { id: true, name: true, icon: true, color: true } },
      tags: { select: { name: true } },
    },
  });

  return rows.map(mapItem);
}

export async function getItemStats(): Promise<ItemStats> {
  const userId = await getDemoUserId();
  if (!userId) return { total: 0, favorites: 0 };

  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}
