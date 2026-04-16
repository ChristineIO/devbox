"use client";

import Link from "next/link";
import { ChevronUp, LogOut, User } from "lucide-react";
import { useTransition } from "react";

import { signOutAction } from "@/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import type { SidebarUser } from "@/lib/db/user";

type Props = {
  user: SidebarUser | null;
  collapsed?: boolean;
};

export function SidebarUserMenu({ user, collapsed = false }: Props) {
  const [isPending, startTransition] = useTransition();
  const displayName = user?.name ?? "Guest";
  const displayEmail = user?.email ?? "";

  function handleSignOut() {
    startTransition(async () => {
      await signOutAction();
    });
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-3",
        collapsed && "flex-col gap-3",
      )}
    >
      <Link
        href="/profile"
        aria-label="Open profile"
        className="rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <UserAvatar name={user?.name} image={user?.image} size="sm" />
      </Link>

      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{displayName}</div>
          {displayEmail && (
            <div className="truncate text-xs text-muted-foreground">
              {displayEmail}
            </div>
          )}
        </div>
      )}

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          aria-label="Account menu"
          disabled={isPending}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
        >
          <ChevronUp className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" sideOffset={6} className="min-w-44">
          {user && (
            <>
              <div className="px-1.5 py-1 text-xs font-medium text-muted-foreground truncate">
                {user.name}
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem render={<Link href="/profile" />}>
            <User className="size-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
