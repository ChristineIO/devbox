import Link from "next/link";
import { Pin, Star } from "lucide-react";

import { iconMap } from "@/lib/icon-map";
import type { ItemCardData } from "@/lib/db/items";

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ItemCard({ item }: { item: ItemCardData }) {
  const { type } = item;
  const Icon = iconMap[type.icon] ?? null;

  return (
    <Link
      href={`/items/${type.id}/${item.id}`}
      className="group flex flex-col rounded-lg border border-border bg-card p-4 transition hover:border-foreground/20"
      style={{ borderLeftColor: type.color, borderLeftWidth: 3 }}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: `${type.color}1f`, color: type.color }}
          >
            <Icon className="size-4" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium">{item.title}</h3>
            {item.isPinned && (
              <Pin className="size-3.5 shrink-0 text-muted-foreground" />
            )}
            {item.isFavorite && (
              <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
            )}
          </div>
          {item.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {item.description}
            </p>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatDate(item.createdAt)}
        </span>
      </div>
      {item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
