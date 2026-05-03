import Link from "next/link";
import { SignInForm } from "./SignInForm";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
    verified?: string;
    registered?: string;
    reset?: string;
  }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const { callbackUrl, error, verified, registered, reset } = await searchParams;

  return (
    <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to continue to DevBox
        </p>
      </div>

      {verified === "1" && (
        <p className="mb-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-center text-sm text-emerald-400">
          Email verified! You can now sign in.
        </p>
      )}

      {registered === "1" && (
        <p className="mb-4 rounded-md border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-center text-sm text-blue-400">
          Account created! Check your email for a verification link.
        </p>
      )}

      {reset === "1" && (
        <p className="mb-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-center text-sm text-emerald-400">
          Password reset! You can now sign in with your new password.
        </p>
      )}

      {error === "invalid-token" && (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
          Verification link is invalid or expired. Try signing in to resend it.
        </p>
      )}

      {error === "missing-token" && (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
          Verification link is missing. Check your email and try again.
        </p>
      )}

      <SignInForm callbackUrl={callbackUrl} initialError={error} />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary underline-offset-4 hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
