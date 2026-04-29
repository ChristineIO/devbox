import { redirect } from "next/navigation";

import { ChangePasswordCard } from "@/components/profile/ChangePasswordCard";
import { DeleteAccountCard } from "@/components/profile/DeleteAccountCard";
import { ProfileInfoCard } from "@/components/profile/ProfileInfoCard";
import { ProfileStatsCard } from "@/components/profile/ProfileStatsCard";
import { getProfileStats, getProfileUser } from "@/lib/db/user";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getProfileUser();
  if (!user) redirect("/sign-in?callbackUrl=/profile");

  const stats = await getProfileStats(user.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and view usage
        </p>
      </header>

      <ProfileInfoCard user={user} />
      <ProfileStatsCard stats={stats} />

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-semibold">Account</h2>
        {user.hasPassword && <ChangePasswordCard />}
        <DeleteAccountCard requiresPassword={user.hasPassword} />
      </section>
    </div>
  );
}
