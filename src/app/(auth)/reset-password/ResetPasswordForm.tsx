"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldErrors = Partial<Record<"password" | "confirmPassword", string>>;

type Props = {
  token: string;
};

export function ResetPasswordForm({ token }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();

  function validate(data: { password: string; confirmPassword: string }): FieldErrors {
    const errors: FieldErrors = {};
    if (data.password.length < 8) errors.password = "Password must be at least 8 characters";
    if (data.confirmPassword !== data.password) errors.confirmPassword = "Passwords do not match";
    return errors;
  }

  function handleSubmit(formData: FormData) {
    setError(undefined);
    setFieldErrors({});

    const data = {
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    };

    const errors = validate(data);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...data }),
      });

      if (res.ok) {
        router.push("/sign-in?reset=1");
        return;
      }

      const body = (await res.json().catch(() => null)) as
        | { error?: string; code?: string }
        | null;
      setError(body?.error ?? "Reset failed. Please try again.");
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          disabled={isPending}
          aria-invalid={!!fieldErrors.password}
        />
        {fieldErrors.password && (
          <p className="text-xs text-destructive">{fieldErrors.password}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          disabled={isPending}
          aria-invalid={!!fieldErrors.confirmPassword}
        />
        {fieldErrors.confirmPassword && (
          <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="mt-1 w-full">
        {isPending ? "Resetting…" : "Reset password"}
      </Button>
    </form>
  );
}
