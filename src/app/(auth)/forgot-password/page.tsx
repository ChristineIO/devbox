import Link from "next/link";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-semibold">Forgot password?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to reset it.
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
