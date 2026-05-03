"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { useState, useTransition } from "react";

import { deleteAccount } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  requiresPassword: boolean;
};

export function DeleteAccountCard({ requiresPassword }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      const result = await deleteAccount(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <section className="rounded-lg border border-destructive/40 bg-card p-6">
      <h3 className="font-heading text-base font-semibold text-destructive">
        Delete account
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Permanently delete your account and all of your items, collections and
        custom types. This cannot be undone.
      </p>

      <AlertDialog.Root open={open} onOpenChange={setOpen}>
        <AlertDialog.Trigger
          render={
            <Button variant="destructive" className="mt-4 w-fit">
              Delete account
            </Button>
          }
        />
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity" />
          <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 shadow-xl outline-none">
            <AlertDialog.Title className="font-heading text-lg font-semibold">
              Delete your account?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-1 text-sm text-muted-foreground">
              All of your items, collections and custom types will be removed
              immediately. This action is irreversible.
            </AlertDialog.Description>

            <form
              action={handleSubmit}
              className="mt-4 flex flex-col gap-3"
              noValidate
            >
              {requiresPassword && (
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
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmation">
                  Type <span className="font-mono font-semibold">DELETE</span>{" "}
                  to confirm
                </Label>
                <Input
                  id="confirmation"
                  name="confirmation"
                  type="text"
                  autoComplete="off"
                  required
                  disabled={isPending}
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <AlertDialog.Close
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                    />
                  }
                >
                  Cancel
                </AlertDialog.Close>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isPending}
                >
                  {isPending ? "Deleting…" : "Delete account"}
                </Button>
              </div>
            </form>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </section>
  );
}
