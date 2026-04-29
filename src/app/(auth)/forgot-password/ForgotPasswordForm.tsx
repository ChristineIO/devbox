"use client";

import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RESEND_COOLDOWN_SECONDS = 60;
const STORAGE_KEY = "devbox:forgot-password:cooldowns";

type CooldownMap = Record<string, number>;

function readCooldowns(): CooldownMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as CooldownMap;
  } catch {
    return {};
  }
}

function writeCooldowns(map: CooldownMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota / disabled storage
  }
}

function pruneExpired(map: CooldownMap): CooldownMap {
  const now = Date.now();
  const next: CooldownMap = {};
  for (const [email, until] of Object.entries(map)) {
    if (until > now) next[email] = until;
  }
  return next;
}

function getRemainingSeconds(email: string): number {
  const map = readCooldowns();
  const until = map[email.toLowerCase()];
  if (!until) return 0;
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

function setCooldownFor(email: string) {
  const map = pruneExpired(readCooldowns());
  map[email.toLowerCase()] = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
  writeCooldowns(map);
}

function formatCooldown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ForgotPasswordForm() {
  const [emailError, setEmailError] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  function handleSubmit(formData: FormData) {
    setEmailError(undefined);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      setEmailError("Email is required");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("Enter a valid email");
      return;
    }

    const remaining = getRemainingSeconds(email);
    if (remaining > 0) {
      setSubmitted(true);
      setCooldown(remaining);
      return;
    }

    startTransition(async () => {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setCooldownFor(email);
      setSubmitted(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    });
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-3">
        <div
          role="status"
          className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-3 text-center text-sm text-emerald-400"
        >
          If an account with that email exists, we&apos;ve sent a password reset link. Check your inbox.
        </div>
        {cooldown > 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            You can request another link in {formatCooldown(cooldown)}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="text-center text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
          >
            Wrong email? Try another
          </button>
        )}
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3" noValidate>
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
          aria-invalid={!!emailError}
        />
        {emailError && <p className="text-xs text-destructive">{emailError}</p>}
      </div>

      <Button type="submit" disabled={isPending} className="mt-1 w-full">
        {isPending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
