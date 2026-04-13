import Link from "next/link";
import { Star } from "lucide-react";

import { iconMap } from "@/lib/icon-map";
import {
  getRecentCollections,
  type CollectionCardData,
} from "@/lib/db/collections";

const RECENT_LIMIT = 6;

function CollectionCard({ collection }: { collection: CollectionCardData }) {
  const borderColor = collection.mostUsedType?.color;
  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group flex flex-col rounded-lg border border-border bg-card p-4 transition hover:border-foreground/20"
      style={borderColor ? { borderColor } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="truncate font-medium">{collection.name}</h3>
        {collection.isFavorite && (
          <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
      </div>
      {collection.description && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
          {collection.description}
        </p>
      )}
      {collection.types.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          {collection.types.map((type) => {
            const Icon = iconMap[type.icon];
            if (!Icon) return null;
            return (
              <Icon
                key={type.id}
                className="size-3.5"
                style={{ color: type.color }}
                aria-label={type.name}
              />
            );
          })}
        </div>
      )}
    </Link>
  );
}

export async function RecentCollections() {
  const recent = await getRecentCollections(RECENT_LIMIT);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Collections</h2>
        <Link
          href="/collections"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          View all
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground">No collections yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </section>
  );
}
