import { FileText, FolderOpen, Star, Bookmark, type LucideIcon } from "lucide-react";

import { collections, items } from "@/lib/mock-data";

type Stat = {
  label: string;
  value: number;
  icon: LucideIcon;
};

export function StatsCards() {
  const stats: Stat[] = [
    { label: "Items", value: items.length, icon: FileText },
    { label: "Collections", value: collections.length, icon: FolderOpen },
    {
      label: "Favorite Items",
      value: items.filter((i) => i.isFavorite).length,
      icon: Star,
    },
    {
      label: "Favorite Collections",
      value: collections.filter((c) => c.isFavorite).length,
      icon: Bookmark,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {label}
            </span>
            <Icon className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 font-heading text-2xl font-semibold">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}
