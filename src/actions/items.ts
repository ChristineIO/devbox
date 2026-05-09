"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  updateItem as updateItemQuery,
  type ItemDetail,
} from "@/lib/db/items";

const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  url: z.string().url("Invalid URL").nullable().optional(),
  language: z.string().nullable().optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
});

export type UpdateItemInput = z.input<typeof updateItemSchema>;

export type UpdateItemResult =
  | { success: true; data: ItemDetail }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

function nullable(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export async function updateItem(
  itemId: string,
  input: UpdateItemInput,
): Promise<UpdateItemResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: "Not signed in" };
  }

  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const tags = Array.from(new Set(data.tags.map((t) => t.trim()).filter(Boolean)));

  const updated = await updateItemQuery(itemId, userId, {
    title: data.title.trim(),
    description: nullable(data.description),
    content: nullable(data.content),
    url: nullable(data.url),
    language: nullable(data.language),
    tags,
  });

  if (!updated) {
    return { success: false, error: "Item not found" };
  }

  return { success: true, data: updated };
}

export type DeleteItemResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteItem(itemId: string): Promise<DeleteItemResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: "Not signed in" };
  }

  const deleted = await deleteItemQuery(itemId, userId);
  if (!deleted) {
    return { success: false, error: "Item not found" };
  }

  return { success: true };
}

const createItemSchema = z.object({
  itemTypeId: z.string().min(1, "Type is required"),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  url: z.string().url("Invalid URL").nullable().optional(),
  language: z.string().nullable().optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
});

export type CreateItemInput = z.input<typeof createItemSchema>;

export type CreateItemResult =
  | { success: true; data: ItemDetail }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export async function createItem(
  input: CreateItemInput,
): Promise<CreateItemResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: "Not signed in" };
  }

  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const tags = Array.from(
    new Set(data.tags.map((t) => t.trim()).filter(Boolean)),
  );

  const created = await createItemQuery(userId, {
    itemTypeId: data.itemTypeId,
    title: data.title.trim(),
    description: nullable(data.description),
    content: nullable(data.content),
    url: nullable(data.url),
    language: nullable(data.language),
    tags,
  });

  if (!created) {
    return { success: false, error: "Invalid item type" };
  }

  return { success: true, data: created };
}
