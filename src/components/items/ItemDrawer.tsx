"use client";

import { useEffect, useState } from "react";
import { Copy, Pencil, Pin, Star, Trash2 } from "lucide-react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { iconMap } from "@/lib/icon-map";
import { cn } from "@/lib/utils";
import type { ItemDetail } from "@/lib/db/items";
import { useItemDrawer } from "./ItemDrawerContext";

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ActionBar({ item }: { item: ItemDetail }) {
  const [copied, setCopied] = useState(false);
  const copyValue = item.content ?? item.url ?? "";

  async function handleCopy() {
    if (!copyValue) return;
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard unavailable — fail silently for now.
    }
  }

  return (
    <div className="flex items-center gap-1 border-b border-border px-4 py-2">
      <Button
        variant="ghost"
        size="icon-sm"
        title={item.isFavorite ? "Unfavorite" : "Favorite"}
        aria-label="Favorite"
      >
        <Star
          className={cn(
            "size-4",
            item.isFavorite && "fill-yellow-400 text-yellow-400",
          )}
        />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        title={item.isPinned ? "Unpin" : "Pin"}
        aria-label="Pin"
      >
        <Pin className={cn("size-4", item.isPinned && "fill-current")} />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleCopy}
        disabled={!copyValue}
        title={copied ? "Copied" : "Copy"}
        aria-label="Copy"
      >
        <Copy className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        title="Edit"
        aria-label="Edit"
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="ml-auto text-destructive hover:text-destructive"
        title="Delete"
        aria-label="Delete"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      <div className="h-32 animate-pulse rounded bg-muted" />
    </div>
  );
}

function ItemBody({ item }: { item: ItemDetail }) {
  const Icon = iconMap[item.type.icon] ?? null;

  return (
    <div className="flex flex-col gap-5 overflow-y-auto p-4">
      <header className="flex items-start gap-3">
        {Icon && (
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-md"
            style={{
              backgroundColor: `${item.type.color}1f`,
              color: item.type.color,
            }}
          >
            <Icon className="size-4" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-semibold leading-tight">
            {item.title}
          </h2>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="capitalize">{item.type.name}</span>
            {item.language && <span>· {item.language}</span>}
          </div>
        </div>
      </header>

      {item.description && (
        <p className="text-sm text-muted-foreground">{item.description}</p>
      )}

      {item.contentType === "text" && item.content && (
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground">
          {item.content}
        </pre>
      )}

      {item.contentType === "url" && item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-sm text-primary underline-offset-4 hover:underline"
        >
          {item.url}
        </a>
      )}

      {item.contentType === "file" && item.fileName && (
        <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
          <div className="font-medium">{item.fileName}</div>
          {item.fileSize != null && (
            <div className="text-xs text-muted-foreground">
              {(item.fileSize / 1024).toFixed(1)} KB
            </div>
          )}
        </div>
      )}

      {item.tags.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tags
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {item.collections.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Collections
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {item.collections.map((c) => (
              <span
                key={c.id}
                className="rounded-md border border-border px-2 py-0.5 text-xs"
              >
                {c.name}
              </span>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-auto pt-4 text-xs text-muted-foreground">
        <div>Created {formatDateTime(item.createdAt)}</div>
        {item.updatedAt.getTime() !== item.createdAt.getTime() && (
          <div>Updated {formatDateTime(item.updatedAt)}</div>
        )}
      </footer>
    </div>
  );
}

export function ItemDrawer() {
  const { selected, close } = useItemDrawer();
  const [detail, setDetail] = useState<ItemDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) {
      setDetail(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setDetail(null);
    setError(null);

    fetch(`/api/items/${selected.id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        return (await res.json()) as ItemDetail;
      })
      .then((data) => {
        if (cancelled) return;
        setDetail({
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [selected]);

  return (
    <Sheet
      open={!!selected}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <SheetContent
        side="right"
        className="w-full p-0 sm:max-w-md"
        showCloseButton={false}
      >
        {detail ? (
          <>
            <ActionBar item={detail} />
            <ItemBody item={detail} />
          </>
        ) : error ? (
          <div className="p-4 text-sm text-destructive">{error}</div>
        ) : (
          <DrawerSkeleton />
        )}
      </SheetContent>
    </Sheet>
  );
}
