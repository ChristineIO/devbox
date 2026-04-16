import Link from "next/link";
import { SignInForm } from "./SignInForm";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const { callbackUrl, error } = await searchParams;

  return (
    <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to continue to DevBox
        </p>
      </div>
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
