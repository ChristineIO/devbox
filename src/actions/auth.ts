"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export type ActionResult = { error: string; code?: string } | undefined;

async function getClientIpFromHeaders(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() ?? "unknown";
}

function rateLimitMessage(reset: number): string {
  const seconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1
    ? "Too many attempts. Please try again in a moment."
    : `Too many attempts. Please try again in ${minutes} minutes.`;
}

export async function signInWithCredentials(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/dashboard");

  const ip = await getClientIpFromHeaders();
  const rl = await checkRateLimit("login", `${ip}:${email.toLowerCase()}`);
  if (!rl.success) {
    return { error: rateLimitMessage(rl.reset), code: "rate-limited" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        const code = (error as unknown as { code?: string }).code;
        if (code === "email-not-verified") {
          return { error: "Please verify your email before signing in.", code: "email-not-verified" };
        }
        return { error: "Invalid email or password" };
      }
      return { error: "Sign in failed. Please try again." };
    }
    throw error;
  }
}

export async function signInWithGithub(callbackUrl?: string) {
  await signIn("github", { redirectTo: callbackUrl ?? "/dashboard" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/sign-in" });
}
