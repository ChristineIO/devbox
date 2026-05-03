"use server";

import bcrypt from "bcryptjs";

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export type DeleteAccountResult = { error: string; code?: string } | undefined;

export async function deleteAccount(formData: FormData): Promise<DeleteAccountResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Not signed in" };

  const confirmation = String(formData.get("confirmation") ?? "");
  if (confirmation !== "DELETE") {
    return { error: "Type DELETE to confirm", code: "invalid-confirmation" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });
  if (!user) return { error: "Account not found" };

  if (user.password) {
    const password = String(formData.get("password") ?? "");
    if (!password) {
      return { error: "Password is required", code: "missing-password" };
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return { error: "Password is incorrect", code: "invalid-password" };
    }
  }

  await prisma.user.delete({ where: { id: user.id } });

  await signOut({ redirectTo: "/sign-in?deleted=1" });
}
