import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/db/verification-token";
import { sendVerificationEmail } from "@/lib/email";

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

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { emailVerified: true },
  });

  if (!user || user.emailVerified) {
    return NextResponse.json({ success: true });
  }

  const token = await createVerificationToken(parsed.data.email);

  try {
    await sendVerificationEmail(parsed.data.email, token);
  } catch (err) {
    console.error("Failed to send verification email:", err);
  }

  return NextResponse.json({ success: true });
}
