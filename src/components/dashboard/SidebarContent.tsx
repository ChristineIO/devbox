"use client";

import Link from "next/link";
import { ChevronDown, Settings, Star } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { iconMap } from "@/lib/icon-map";
import type { SidebarItemType } from "@/lib/db/items";
import type { SidebarCollection } from "@/lib/db/collections";
import type { SidebarUser } from "@/lib/db/user";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const PRO_TYPES = new Set(["file", "image"]);

type Props = {
  collapsed?: boolean;
  onNavigate?: () => void;
  itemTypes: SidebarItemType[];
  collections: SidebarCollection[];
  user: SidebarUser | null;
};

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2 px-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <span className="font-heading text-sm font-semibold">D</span>
      </div>
      {!collapsed && (
        <span className="font-heading text-base font-semibold">DevBox</span>
      )}
    </div>
  );
}

function SectionHeader({
  label,
  open,
  onToggle,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground"
    >
      <ChevronDown
        className={cn(
          "size-3.5 transition-transform",
          !open && "-rotate-90",
        )}
      />
      <span>{label}</span>
    </button>
  );
}

function SubHeader({ label }: { label: string }) {
  return (
    <div className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
      {label}
    </div>
  );
}

export function SidebarContent({
  collapsed = false,
  onNavigate,
  itemTypes,
  collections,
  user,
}: Props) {
  const displayName = user?.name ?? "Guest";
  const displayEmail = user?.email ?? "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const [typesOpen, setTypesOpen] = useState(true);
  const [collectionsOpen, setCollectionsOpen] = useState(true);

  const favorites = collections.filter((c) => c.isFavorite);
  const recent = collections.filter((c) => !c.isFavorite);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <Brand collapsed={collapsed} />
      <Separator />

      <ScrollArea className="flex-1">
        <div className="py-2">
          {!collapsed && (
            <SectionHeader
              label="Types"
              open={typesOpen}
              onToggle={() => setTypesOpen((v) => !v)}
            />
          )}
          {(collapsed || typesOpen) && (
            <ul className="flex flex-col gap-0.5 px-2">
              {itemTypes.map((type) => {
                const Icon = iconMap[type.icon];
                return (
                  <li key={type.id}>
                    <Link
                      href={`/items/${type.name}`}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        collapsed && "justify-center",
                      )}
                      title={collapsed ? type.name : undefined}
                    >
                      {Icon && (
                        <Icon
                          className="size-4 shrink-0"
                          style={{ color: type.color }}
                        />
                      )}
                      {!collapsed && (
                        <>
                          <span className="ml-2 truncate capitalize">
                            {type.name}
                          </span>
                          {PRO_TYPES.has(type.name) && (
                            <Badge
                              variant="outline"
                              className="ml-1.5 h-4 px-1.5 text-[9px] font-semibold tracking-wider text-muted-foreground"
                            >
                              PRO
                            </Badge>
                          )}
                          <span className="ml-auto text-xs text-muted-foreground">
                            {type.count}
                          </span>
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {!collapsed && <div className="mt-2" />}

          {!collapsed && (
            <SectionHeader
              label="Collections"
              open={collectionsOpen}
              onToggle={() => setCollectionsOpen((v) => !v)}
            />
          )}

          {!collapsed && collectionsOpen && (
            <div className="flex flex-col">
              {favorites.length > 0 && (
                <>
                  <SubHeader label="Favorites" />
                  <ul className="flex flex-col gap-0.5 px-2">
                    {favorites.map((col) => (
                      <li key={col.id}>
                        <Link
                          href={`/collections/${col.id}`}
                          onClick={onNavigate}
                          className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        >
                          <span className="flex-1 truncate">{col.name}</span>
                          <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {recent.length > 0 && (
                <>
                  <SubHeader label="Recent" />
                  <ul className="flex flex-col gap-0.5 px-2">
                    {recent.map((col) => (
                      <li key={col.id}>
                        <Link
                          href={`/collections/${col.id}`}
                          onClick={onNavigate}
                          className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        >
                          <span className="flex-1 truncate">{col.name}</span>
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                col.mostUsedType?.color ?? "transparent",
                              outline: col.mostUsedType
                                ? undefined
                                : "1px solid var(--color-border)",
                            }}
                            aria-label={
                              col.mostUsedType
                                ? `Most used type: ${col.mostUsedType.name}`
                                : "No items"
                            }
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <div className="px-2 pt-2">
                <Link
                  href="/collections"
                  onClick={onNavigate}
                  className="flex w-full items-center rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  View all collections
                </Link>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator />
      <div
        className={cn(
          "flex items-center gap-2 p-3",
          collapsed && "flex-col",
        )}
      >
        <Avatar size="sm">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-medium">{displayName}</div>
            <div className="truncate text-xs text-muted-foreground">
              {displayEmail}
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Settings"
          className="text-muted-foreground"
        >
          <Settings />
        </Button>
      </div>
    </div>
  );
}
