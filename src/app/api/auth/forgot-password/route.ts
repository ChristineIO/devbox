import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/db/password-reset-token";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
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
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true },
  });

  if (user?.password) {
    try {
      const token = await createPasswordResetToken(email);
      if (token) {
        await sendPasswordResetEmail(email, token);
      }
    } catch (err) {
      console.error("Failed to send password reset email:", err);
    }
  }

  return NextResponse.json({ success: true });
}
