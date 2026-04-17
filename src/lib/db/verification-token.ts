import crypto from "crypto";

import { prisma } from "@/lib/prisma";

const TOKEN_EXPIRY_HOURS = 24;

export async function createVerificationToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  return token;
}

export async function consumeVerificationToken(
  token: string,
): Promise<{ email: string } | null> {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record) return null;
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { token },
    });
    return null;
  }

  await prisma.verificationToken.delete({
    where: { token },
  });

  return { email: record.identifier };
}
