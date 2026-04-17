import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/db/verification-token";
import { sendVerificationEmail } from "@/lib/email";

const registerSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.string().email(),
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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "A user with that email already exists" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: passwordHash },
    select: { id: true, email: true, name: true },
  });

  let emailSent = true;
  try {
    const token = await createVerificationToken(email);
    await sendVerificationEmail(email, token);
  } catch (err) {
    console.error("Failed to send verification email:", err);
    emailSent = false;
  }

  return NextResponse.json({ success: true, user, emailSent }, { status: 201 });
}
