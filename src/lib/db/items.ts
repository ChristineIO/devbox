import { prisma } from "@/lib/prisma";
import { getDemoUserId } from "@/lib/db/user";

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

export async function getItemsByType(
  itemTypeId: string,
): Promise<ItemCardData[]> {
  const userId = await getDemoUserId();
  if (!userId) return [];

  const rows = await prisma.item.findMany({
    where: { userId, itemTypeId },
    orderBy: { createdAt: "desc" },
    include: {
      itemType: { select: { id: true, name: true, icon: true, color: true } },
      tags: { select: { name: true } },
    },
  });

  return rows.map(mapItem);
}

export type ItemDetail = ItemCardData & {
  contentType: string;
  content: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  language: string | null;
  updatedAt: Date;
  collections: { id: string; name: string }[];
};

export async function getItemById(itemId: string): Promise<ItemDetail | null> {
  const userId = await getDemoUserId();
  if (!userId) return null;

  return findItemDetail(itemId, userId);
}

async function findItemDetail(
  itemId: string,
  userId: string,
): Promise<ItemDetail | null> {
  const row = await prisma.item.findFirst({
    where: { id: itemId, userId },
    include: {
      itemType: { select: { id: true, name: true, icon: true, color: true } },
      tags: { select: { name: true } },
      collections: {
        select: {
          collection: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!row) return null;

  return {
    ...mapItem(row),
    contentType: row.contentType,
    content: row.content,
    url: row.url,
    fileUrl: row.fileUrl,
    fileName: row.fileName,
    fileSize: row.fileSize,
    language: row.language,
    updatedAt: row.updatedAt,
    collections: row.collections.map((c) => c.collection),
  };
}

export type UpdateItemInput = {
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
};

export async function updateItem(
  itemId: string,
  userId: string,
  input: UpdateItemInput,
): Promise<ItemDetail | null> {
  const owned = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  });
  if (!owned) return null;

  await prisma.item.update({
    where: { id: itemId },
    data: {
      title: input.title,
      description: input.description,
      content: input.content,
      url: input.url,
      language: input.language,
      tags: {
        set: [],
        connectOrCreate: input.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
  });

  return findItemDetail(itemId, userId);
}

export async function deleteItem(
  itemId: string,
  userId: string,
): Promise<boolean> {
  const result = await prisma.item.deleteMany({
    where: { id: itemId, userId },
  });
  return result.count > 0;
}

export type CreatableItemType = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

const PRO_TYPE_NAMES = new Set(["file", "image"]);

export async function getCreatableItemTypes(): Promise<CreatableItemType[]> {
  const rows = await prisma.itemType.findMany({
    where: { isSystem: true, userId: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, icon: true, color: true },
  });
  return rows.filter((t) => !PRO_TYPE_NAMES.has(t.name));
}

export type CreateItemInput = {
  itemTypeId: string;
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
};

export async function createItem(
  userId: string,
  input: CreateItemInput,
): Promise<ItemDetail | null> {
  const type = await prisma.itemType.findFirst({
    where: {
      id: input.itemTypeId,
      OR: [{ isSystem: true, userId: null }, { userId }],
    },
    select: { id: true, name: true },
  });
  if (!type) return null;

  const contentType = type.name === "link" ? "url" : "text";

  const created = await prisma.item.create({
    data: {
      userId,
      itemTypeId: type.id,
      title: input.title,
      description: input.description,
      contentType,
      content: input.content,
      url: input.url,
      language: input.language,
      tags: {
        connectOrCreate: input.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    select: { id: true },
  });

  return findItemDetail(created.id, userId);
}

export type SidebarItemType = {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
};

export async function getSidebarItemTypes(): Promise<SidebarItemType[]> {
  const userId = await getDemoUserId();

  const types = await prisma.itemType.findMany({
    where: userId
      ? { OR: [{ isSystem: true, userId: null }, { userId }] }
      : { isSystem: true, userId: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, icon: true, color: true },
  });

  if (!userId) {
    return types.map((t) => ({ ...t, count: 0 }));
  }

  const counts = await prisma.item.groupBy({
    by: ["itemTypeId"],
    where: { userId },
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((c) => [c.itemTypeId, c._count._all]));

  return types.map((t) => ({ ...t, count: countMap.get(t.id) ?? 0 }));
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
