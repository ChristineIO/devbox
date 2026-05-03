import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });

  if (!user?.password) {
    return NextResponse.json(
      {
        error: "This account doesn't use a password",
        code: "no-password-account",
      },
      { status: 400 },
    );
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return NextResponse.json(
      { error: "Current password is incorrect", code: "invalid-current" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: passwordHash },
  });

  return NextResponse.json({ success: true });
}
