import { FileText, FolderOpen, Star, Bookmark, type LucideIcon } from "lucide-react";

import { getCollectionStats } from "@/lib/db/collections";
import { getItemStats } from "@/lib/db/items";

type Stat = {
  label: string;
  value: number;
  icon: LucideIcon;
};

export async function StatsCards() {
  const [collectionStats, itemStats] = await Promise.all([
    getCollectionStats(),
    getItemStats(),
  ]);

  const stats: Stat[] = [
    { label: "Items", value: itemStats.total, icon: FileText },
    { label: "Collections", value: collectionStats.total, icon: FolderOpen },
    { label: "Favorite Items", value: itemStats.favorites, icon: Star },
    {
      label: "Favorite Collections",
      value: collectionStats.favorites,
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
