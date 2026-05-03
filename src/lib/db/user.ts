import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const DEMO_EMAIL = "demo@devbox.io";

export type SidebarUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isPro: boolean;
};

export type ProfileUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isPro: boolean;
  hasPassword: boolean;
  createdAt: Date;
};

export type ProfileTypeBreakdown = {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
};

export type ProfileStats = {
  totalItems: number;
  totalCollections: number;
  byType: ProfileTypeBreakdown[];
};

export const getDemoUserId = cache(async (): Promise<string | null> => {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true },
  });
  return user?.id ?? null;
});

export async function getSidebarUser(): Promise<SidebarUser | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true, isPro: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name ?? "User",
    email: user.email ?? "",
    image: user.image,
    isPro: user.isPro,
  };
}

export async function getProfileUser(): Promise<ProfileUser | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isPro: true,
      password: true,
      createdAt: true,
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name ?? "User",
    email: user.email ?? "",
    image: user.image,
    isPro: user.isPro,
    hasPassword: !!user.password,
    createdAt: user.createdAt,
  };
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [totalItems, totalCollections, types, counts] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.itemType.findMany({
      where: { OR: [{ isSystem: true, userId: null }, { userId }] },
      orderBy: { name: "asc" },
      select: { id: true, name: true, icon: true, color: true },
    }),
    prisma.item.groupBy({
      by: ["itemTypeId"],
      where: { userId },
      _count: { _all: true },
    }),
  ]);

  const countMap = new Map(counts.map((c) => [c.itemTypeId, c._count._all]));
  const byType: ProfileTypeBreakdown[] = types.map((t) => ({
    ...t,
    count: countMap.get(t.id) ?? 0,
  }));

  return { totalItems, totalCollections, byType };
}
