import { UserAvatar } from "@/components/user-avatar";
import type { ProfileUser } from "@/lib/db/user";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

type Props = {
  user: ProfileUser;
};

export function ProfileInfoCard({ user }: Props) {
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-4">
        <UserAvatar name={user.name} image={user.image} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-heading text-xl font-semibold">
              {user.name}
            </h2>
            {user.isPro && (
              <span className="rounded-md border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                PRO
              </span>
            )}
          </div>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Joined {dateFormatter.format(user.createdAt)}
          </p>
        </div>
      </div>
    </section>
  );
}
