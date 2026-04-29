import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { consumePasswordResetToken } from "@/lib/db/password-reset-token";

const schema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8).max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export async function POST(request: Request) {
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

  const { token, password } = parsed.data;

  const result = await consumePasswordResetToken(token);
  if (!result) {
    return NextResponse.json(
      { error: "Reset link is invalid or expired", code: "invalid-token" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: result.email },
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

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: passwordHash },
  });

  return NextResponse.json({ success: true });
}
