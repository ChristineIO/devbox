import crypto from "crypto";

import { prisma } from "@/lib/prisma";

const TOKEN_EXPIRY_MINUTES = 60;
const RESEND_COOLDOWN_SECONDS = 60;
const IDENTIFIER_PREFIX = "password-reset:";

function toIdentifier(email: string): string {
  return `${IDENTIFIER_PREFIX}${email}`;
}

export async function createPasswordResetToken(email: string): Promise<string | null> {
  const identifier = toIdentifier(email);

  const existing = await prisma.verificationToken.findFirst({
    where: { identifier },
  });

  if (existing) {
    const issuedAtMs =
      existing.expires.getTime() - TOKEN_EXPIRY_MINUTES * 60 * 1000;
    const ageMs = Date.now() - issuedAtMs;
    if (ageMs < RESEND_COOLDOWN_SECONDS * 1000) {
      return null;
    }
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: { identifier },
  });

  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return token;
}

export async function consumePasswordResetToken(
  token: string,
): Promise<{ email: string } | null> {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record) return null;
  if (!record.identifier.startsWith(IDENTIFIER_PREFIX)) return null;

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { token },
    });
    return null;
  }

  await prisma.verificationToken.delete({
    where: { token },
  });

  return { email: record.identifier.slice(IDENTIFIER_PREFIX.length) };
}
