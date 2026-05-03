"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldErrors = Partial<
  Record<"currentPassword" | "newPassword" | "confirmPassword", string>
>;

export function ChangePasswordCard() {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();

  function validate(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): FieldErrors {
    const errors: FieldErrors = {};
    if (!data.currentPassword) errors.currentPassword = "Current password is required";
    if (data.newPassword.length < 8)
      errors.newPassword = "Password must be at least 8 characters";
    if (data.confirmPassword !== data.newPassword)
      errors.confirmPassword = "Passwords do not match";
    return errors;
  }

  function handleSubmit(formData: FormData) {
    setError(undefined);
    setSuccess(false);
    setFieldErrors({});

    const data = {
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    };

    const errors = validate(data);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSuccess(true);
        return;
      }

      const body = (await res.json().catch(() => null)) as
        | { error?: string; code?: string }
        | null;

      if (body?.code === "invalid-current") {
        setFieldErrors({ currentPassword: body.error ?? "Incorrect password" });
        return;
      }
      setError(body?.error ?? "Could not update password. Please try again.");
    });
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-heading text-base font-semibold">Change password</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Use a strong password you don&apos;t use elsewhere.
      </p>

      <form action={handleSubmit} className="mt-4 flex flex-col gap-3" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending}
            aria-invalid={!!fieldErrors.currentPassword}
          />
          {fieldErrors.currentPassword && (
            <p className="text-xs text-destructive">{fieldErrors.currentPassword}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            disabled={isPending}
            aria-invalid={!!fieldErrors.newPassword}
          />
          {fieldErrors.newPassword && (
            <p className="text-xs text-destructive">{fieldErrors.newPassword}</p>
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

        {success && (
          <p
            role="status"
            className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400"
          >
            Password updated.
          </p>
        )}

        <Button type="submit" disabled={isPending} className="mt-1 w-fit">
          {isPending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </section>
  );
}
