"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { iconMap } from "@/lib/icon-map";
import type { CreatableItemType } from "@/lib/db/items";
import { createItem } from "@/actions/items";

const CONTENT_TYPES = new Set(["snippet", "prompt", "command", "note"]);
const LANGUAGE_TYPES = new Set(["snippet", "command"]);
const URL_TYPES = new Set(["link"]);

type FieldErrors = Record<string, string[] | undefined>;

type Props = {
  types: CreatableItemType[];
};

export function NewItemDialog({ types }: Props) {
  const router = useRouter();
  const toast = Toast.useToastManager();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const defaultTypeId =
    types.find((t) => t.name === "snippet")?.id ?? types[0]?.id ?? "";

  const [typeId, setTypeId] = useState(defaultTypeId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [topError, setTopError] = useState<string | null>(null);

  function reset() {
    setTypeId(defaultTypeId);
    setTitle("");
    setDescription("");
    setContent("");
    setUrl("");
    setLanguage("");
    setTagsInput("");
    setFieldErrors({});
    setTopError(null);
  }

  useEffect(() => {
    if (!open) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selected = types.find((t) => t.id === typeId);
  const typeName = selected?.name.toLowerCase() ?? "";
  const showContent = CONTENT_TYPES.has(typeName);
  const showLanguage = LANGUAGE_TYPES.has(typeName);
  const showUrl = URL_TYPES.has(typeName);

  const titleEmpty = title.trim().length === 0;
  const urlEmpty = url.trim().length === 0;
  const submitDisabled =
    isPending || titleEmpty || (showUrl && urlEmpty) || !typeId;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitDisabled) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setFieldErrors({});
    setTopError(null);

    startTransition(async () => {
      const result = await createItem({
        itemTypeId: typeId,
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
          title: "Item created",
          description: result.data.title,
        });
        setOpen(false);
        router.refresh();
      } else {
        setTopError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        toast.add({
          type: "error",
          title: "Create failed",
          description: result.error,
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="size-4" />
            New Item
          </Button>
        }
      />
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>
            Pick a type, then fill in the details.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
          noValidate
        >
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <div className="flex flex-wrap gap-2">
              {types.map((t) => {
                const Icon = iconMap[t.icon] ?? null;
                const active = t.id === typeId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTypeId(t.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs capitalize transition",
                      active
                        ? "border-foreground/40 bg-muted text-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/20",
                    )}
                    style={
                      active ? { borderColor: t.color, color: t.color } : undefined
                    }
                  >
                    {Icon && <Icon className="size-3.5" />}
                    {t.name}
                  </button>
                );
              })}
            </div>
            {fieldErrors.itemTypeId?.[0] && (
              <p className="text-xs text-destructive">
                {fieldErrors.itemTypeId[0]}
              </p>
            )}
          </div>

          {topError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {topError}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-item-title">Title</Label>
            <Input
              id="new-item-title"
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
            <Label htmlFor="new-item-description">Description</Label>
            <textarea
              id="new-item-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          {showContent && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-item-content">Content</Label>
              <textarea
                id="new-item-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="rounded-md border border-input bg-background px-3 py-2 font-mono text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          )}

          {showLanguage && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-item-language">Language</Label>
              <Input
                id="new-item-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g. typescript, bash"
              />
            </div>
          )}

          {showUrl && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-item-url">
                URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-item-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                aria-invalid={!!fieldErrors.url}
                placeholder="https://…"
                required
              />
              {fieldErrors.url?.[0] && (
                <p className="text-xs text-destructive">{fieldErrors.url[0]}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-item-tags">Tags</Label>
            <Input
              id="new-item-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="comma, separated, tags"
            />
          </div>

          </div>

          <DialogFooter className="border-t border-border px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitDisabled}>
              {isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}