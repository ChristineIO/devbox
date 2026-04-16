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
