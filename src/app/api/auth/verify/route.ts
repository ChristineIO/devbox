import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { consumeVerificationToken } from "@/lib/db/verification-token";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/sign-in?error=missing-token", request.url),
    );
  }

  const result = await consumeVerificationToken(token);

  if (!result) {
    return NextResponse.redirect(
      new URL("/sign-in?error=invalid-token", request.url),
    );
  }

  await prisma.user.update({
    where: { email: result.email },
    data: { emailVerified: new Date() },
  });

  return NextResponse.redirect(
    new URL("/sign-in?verified=1", request.url),
  );
}
