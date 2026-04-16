"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export type ActionResult = { error: string } | undefined;

export async function signInWithCredentials(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/dashboard");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
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
