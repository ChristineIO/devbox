import { FileText, FolderOpen } from "lucide-react";

import { iconMap } from "@/lib/icon-map";
import type { ProfileStats } from "@/lib/db/user";

type Props = {
  stats: ProfileStats;
};

export function ProfileStatsCard({ stats }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-lg font-semibold">Usage</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Total Items
            </span>
            <FileText className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 font-heading text-2xl font-semibold">
            {stats.totalItems}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Total Collections
            </span>
            <FolderOpen className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 font-heading text-2xl font-semibold">
            {stats.totalCollections}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium">Items by type</h3>
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {stats.byType.map((type) => {
            const Icon = iconMap[type.icon];
            return (
              <li
                key={type.id}
                className="flex items-center gap-2 py-2 first:pt-0 last:pb-0"
              >
                {Icon && (
                  <Icon
                    className="size-4 shrink-0"
                    style={{ color: type.color }}
                  />
                )}
                <span className="flex-1 truncate text-sm capitalize">
                  {type.name}
                </span>
                <span className="font-mono text-sm tabular-nums text-muted-foreground">
                  {type.count}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
