import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.fn();
const mockGetDemoUserId = vi.fn();
const mockUpdateItemQuery = vi.fn();
const mockDeleteItemQuery = vi.fn();
const mockCreateItemQuery = vi.fn();

vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/db/user", () => ({
  getDemoUserId: () => mockGetDemoUserId(),
}));

vi.mock("@/lib/db/items", () => ({
  updateItem: (...args: unknown[]) => mockUpdateItemQuery(...args),
  deleteItem: (...args: unknown[]) => mockDeleteItemQuery(...args),
  createItem: (...args: unknown[]) => mockCreateItemQuery(...args),
}));

const { updateItem, deleteItem, createItem } = await import("./items");

const baseInput = {
  title: "New title",
  description: "desc",
  content: "code",
  url: null,
  language: "ts",
  tags: ["a", "b"],
};

const sampleDetail = {
  id: "item-1",
  title: "New title",
  description: "desc",
  isFavorite: false,
  isPinned: false,
  tags: ["a", "b"],
  createdAt: new Date(),
  type: { id: "t1", name: "snippet", icon: "Code", color: "#000" },
  contentType: "text",
  content: "code",
  url: null,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  language: "ts",
  updatedAt: new Date(),
  collections: [],
};

describe("updateItem action", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetDemoUserId.mockReset();
    mockUpdateItemQuery.mockReset();
    mockDeleteItemQuery.mockReset();
  });

  it("rejects when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await updateItem("item-1", baseInput);

    expect(result).toEqual({ success: false, error: "Not signed in" });
    expect(mockUpdateItemQuery).not.toHaveBeenCalled();
  });

  it("rejects empty titles via Zod", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u" } });

    const result = await updateItem("item-1", { ...baseInput, title: "   " });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors?.title?.[0]).toBeDefined();
    }
    expect(mockUpdateItemQuery).not.toHaveBeenCalled();
  });

  it("rejects invalid URLs", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u" } });

    const result = await updateItem("item-1", {
      ...baseInput,
      url: "not-a-url",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors?.url?.[0]).toBeDefined();
    }
  });

  it("returns 'Item not found' when ownership check fails", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u" } });
    mockUpdateItemQuery.mockResolvedValue(null);

    const result = await updateItem("item-1", baseInput);

    expect(result).toEqual({ success: false, error: "Item not found" });
  });

  it("trims fields, dedupes tags, and returns the updated detail", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u" } });
    mockUpdateItemQuery.mockResolvedValue(sampleDetail);

    const result = await updateItem("item-1", {
      title: "  New title  ",
      description: "  desc  ",
      content: "  code  ",
      url: null,
      language: "  ts  ",
      tags: ["a", "a", " b "],
    });

    expect(result).toEqual({ success: true, data: sampleDetail });
    expect(mockUpdateItemQuery).toHaveBeenCalledTimes(1);
    const [itemId, userId, payload] = mockUpdateItemQuery.mock.calls[0];
    expect(itemId).toBe("item-1");
    expect(userId).toBe("u");
    expect(payload).toMatchObject({
      title: "New title",
      description: "desc",
      content: "code",
      url: null,
      language: "ts",
      tags: ["a", "b"],
    });
  });

  it("converts empty strings to null for optional fields", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u" } });
    mockUpdateItemQuery.mockResolvedValue(sampleDetail);

    await updateItem("item-1", {
      title: "x",
      description: "",
      content: "   ",
      url: null,
      language: "",
      tags: [],
    });

    const [, , payload] = mockUpdateItemQuery.mock.calls[0];
    expect(payload).toMatchObject({
      description: null,
      content: null,
      language: null,
    });
  });
});

describe("deleteItem action", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockDeleteItemQuery.mockReset();
  });

  it("rejects when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: false, error: "Not signed in" });
    expect(mockDeleteItemQuery).not.toHaveBeenCalled();
  });

  it("returns 'Item not found' when ownership check fails", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u" } });
    mockDeleteItemQuery.mockResolvedValue(false);

    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(mockDeleteItemQuery).toHaveBeenCalledWith("item-1", "u");
  });

  it("returns success when the row is deleted", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u" } });
    mockDeleteItemQuery.mockResolvedValue(true);

    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: true });
    expect(mockDeleteItemQuery).toHaveBeenCalledWith("item-1", "u");
  });
});

describe("createItem action", () => {
  const baseInput = {
    itemTypeId: "type-1",
    title: "  Hello  ",
    description: "  desc  ",
    content: "  body  ",
    url: null,
    language: "  ts  ",
    tags: ["a", "a", " b "],
  };

  beforeEach(() => {
    mockAuth.mockReset();
    mockCreateItemQuery.mockReset();
  });

  it("rejects when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await createItem(baseInput);

    expect(result).toEqual({ success: false, error: "Not signed in" });
    expect(mockCreateItemQuery).not.toHaveBeenCalled();
  });

  it("rejects empty titles via Zod", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u" } });

    const result = await createItem({ ...baseInput, title: "   " });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors?.title?.[0]).toBeDefined();
    }
    expect(mockCreateItemQuery).not.toHaveBeenCalled();
  });

  it("rejects missing item type", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u" } });

    const result = await createItem({ ...baseInput, itemTypeId: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors?.itemTypeId?.[0]).toBeDefined();
    }
  });

  it("rejects invalid URLs", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u" } });

    const result = await createItem({ ...baseInput, url: "not-a-url" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors?.url?.[0]).toBeDefined();
    }
  });

  it("returns 'Invalid item type' when the DB rejects the type", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u" } });
    mockCreateItemQuery.mockResolvedValue(null);

    const result = await createItem(baseInput);

    expect(result).toEqual({ success: false, error: "Invalid item type" });
  });

  it("trims, dedupes tags, and forwards the cleaned payload", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u" } });
    const fakeDetail = { id: "item-1", title: "Hello" };
    mockCreateItemQuery.mockResolvedValue(fakeDetail);

    const result = await createItem(baseInput);

    expect(result).toEqual({ success: true, data: fakeDetail });
    const [userId, payload] = mockCreateItemQuery.mock.calls[0];
    expect(userId).toBe("u");
    expect(payload).toMatchObject({
      itemTypeId: "type-1",
      title: "Hello",
      description: "desc",
      content: "body",
      url: null,
      language: "ts",
      tags: ["a", "b"],
    });
  });
});
