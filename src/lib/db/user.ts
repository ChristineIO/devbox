import { cache } from "react";
import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@devbox.io";

export type SidebarUser = {
  id: string;
  name: string;
  email: string;
  isPro: boolean;
};

export const getDemoUserId = cache(async (): Promise<string | null> => {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true },
  });
  return user?.id ?? null;
});

export async function getSidebarUser(): Promise<SidebarUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true, name: true, email: true, isPro: true },
  });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name ?? "Demo User",
    email: user.email ?? DEMO_EMAIL,
    isPro: user.isPro,
  };
}
