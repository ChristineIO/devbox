import Link from "next/link";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  return (
    <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-semibold">Choose a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter a new password for your DevBox account.
        </p>
      </div>

      {!token ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
        >
          Reset link is missing or invalid. Request a new one from the{" "}
          <Link href="/forgot-password" className="underline underline-offset-2">
            forgot password
          </Link>{" "}
          page.
        </div>
      ) : (
        <ResetPasswordForm token={token} />
      )}

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
