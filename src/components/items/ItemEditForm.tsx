"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toast } from "@/components/ui/toast";
import { iconMap } from "@/lib/icon-map";
import type { ItemDetail } from "@/lib/db/items";
import { updateItem } from "@/actions/items";

const CONTENT_TYPES = new Set(["snippet", "prompt", "command", "note"]);
const LANGUAGE_TYPES = new Set(["snippet", "command"]);
const URL_TYPES = new Set(["link"]);

type FieldErrors = Record<string, string[] | undefined>;

type Props = {
  item: ItemDetail;
  onCancel: () => void;
  onSaved: (updated: ItemDetail) => void;
};

export function ItemEditForm({ item, onCancel, onSaved }: Props) {
  const router = useRouter();
  const toast = Toast.useToastManager();
  const [isPending, startTransition] = useTransition();
  const Icon = iconMap[item.type.icon] ?? null;

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [content, setContent] = useState(item.content ?? "");
  const [url, setUrl] = useState(item.url ?? "");
  const [language, setLanguage] = useState(item.language ?? "");
  const [tagsInput, setTagsInput] = useState(item.tags.join(", "));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [topError, setTopError] = useState<string | null>(null);

  const typeName = item.type.name.toLowerCase();
  const showContent = CONTENT_TYPES.has(typeName);
  const showLanguage = LANGUAGE_TYPES.has(typeName);
  const showUrl = URL_TYPES.has(typeName);

  const titleEmpty = title.trim().length === 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (titleEmpty) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setFieldErrors({});
    setTopError(null);

    startTransition(async () => {
      const result = await updateItem(item.id, {
        title,
        description: description || null,
        content: showContent ? content || null : null,
        url: showUrl ? url || null : null,
        language: showLanguage ? language || null : null,
        tags,
      });

      if (result.success) {
        toast.add({
          type: "success",
          title: "Item updated",
          description: result.data.title,
        });
        router.refresh();
        onSaved(result.data);
      } else {
        setTopError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        toast.add({
          type: "error",
          title: "Save failed",
          description: result.error,
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Editing
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={titleEmpty || isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
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
          <div className="min-w-0 flex-1 text-xs text-muted-foreground">
            <span className="capitalize">{item.type.name}</span>
            <span className="ml-2">(type can&apos;t be changed)</span>
          </div>
        </header>

        {topError && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {topError}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="item-title">Title</Label>
          <Input
            id="item-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={!!fieldErrors.title}
            required
          />
          {fieldErrors.title?.[0] && (
            <p className="text-xs text-destructive">{fieldErrors.title[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="item-description">Description</Label>
          <textarea
            id="item-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        {showContent && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-content">Content</Label>
            <textarea
              id="item-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="rounded-md border border-input bg-background px-3 py-2 font-mono text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        )}

        {showLanguage && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-language">Language</Label>
            <Input
              id="item-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g. typescript, bash"
            />
          </div>
        )}

        {showUrl && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-url">URL</Label>
            <Input
              id="item-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-invalid={!!fieldErrors.url}
              placeholder="https://…"
            />
            {fieldErrors.url?.[0] && (
              <p className="text-xs text-destructive">{fieldErrors.url[0]}</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="item-tags">Tags</Label>
          <Input
            id="item-tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="comma, separated, tags"
          />
          <p className="text-xs text-muted-foreground">
            Separate tags with commas.
          </p>
        </div>
      </div>
    </form>
  );
}
