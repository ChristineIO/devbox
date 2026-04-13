import Link from "next/link";
import { Pin, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { iconMap } from "@/lib/icon-map";
import { itemTypes, type items } from "@/lib/mock-data";

type Item = (typeof items)[number];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ItemRow({ item }: { item: Item }) {
  const type = itemTypes.find((t) => t.id === item.typeId);
  const Icon = type ? iconMap[type.icon] : null;

  return (
    <Link
      href={`/items/${item.typeId}/${item.id}`}
      className={cn(
        "group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition hover:border-foreground/20",
      )}
      style={
        type ? { borderLeftColor: type.color, borderLeftWidth: 3 } : undefined
      }
    >
      {Icon && type && (
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
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
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
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatDate(item.createdAt)}
      </span>
    </Link>
  );
}
