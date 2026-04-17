"use client";

import { useState, useTransition } from "react";

import { signInWithCredentials, signInWithGithub, type ActionResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.7-3.88-1.54-3.88-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.69.08-.69 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.95.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12 24 5.65 18.85.5 12 .5Z" />
    </svg>
  );
}

type Props = {
  callbackUrl?: string;
  initialError?: string;
};

export function SignInForm({ callbackUrl, initialError }: Props) {
  const [error, setError] = useState<string | undefined>(
    initialError && initialError !== "invalid-token" && initialError !== "missing-token"
      ? "Sign in failed. Please try again."
      : undefined,
  );
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [lastEmail, setLastEmail] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [isGithubPending, startGithubTransition] = useTransition();
  const [isResending, startResendTransition] = useTransition();
  const [resendSuccess, setResendSuccess] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(undefined);
    setErrorCode(undefined);
    setResendSuccess(false);
    setLastEmail(String(formData.get("email") ?? ""));
    startTransition(async () => {
      const result: ActionResult = await signInWithCredentials(formData);
      if (result?.error) {
        setError(result.error);
        setErrorCode(result.code);
      }
    });
  }

  function handleResend() {
    if (!lastEmail) return;
    setResendSuccess(false);
    startResendTransition(async () => {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lastEmail }),
      });
      setResendSuccess(true);
    });
  }

  function handleGithub() {
    startGithubTransition(async () => {
      await signInWithGithub(callbackUrl);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        variant="outline"
        onClick={handleGithub}
        disabled={isGithubPending}
        className="w-full"
      >
        <GithubIcon className="size-4" />
        {isGithubPending ? "Redirecting…" : "Sign in with GitHub"}
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          or
        </span>
        <Separator className="flex-1" />
      </div>

      <form action={handleSubmit} className="flex flex-col gap-3">
        <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/dashboard"} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isPending}
            placeholder="you@example.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <p>{error}</p>
            {errorCode === "email-not-verified" && lastEmail && (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || resendSuccess}
                className="mt-1 text-xs underline underline-offset-2 hover:text-destructive/80 disabled:no-underline disabled:opacity-60"
              >
                {resendSuccess
                  ? "Verification email sent!"
                  : isResending
                    ? "Sending…"
                    : "Resend verification email"}
              </button>
            )}
          </div>
        )}

        <Button type="submit" disabled={isPending} className="mt-1 w-full">
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
