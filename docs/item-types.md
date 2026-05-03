# DevBox Item Types

> Reference document covering the 7 system item types in DevBox, their visual identity, behavior, and the schema fields each one uses.

**Sources:** [context/project-overview.md](../context/project-overview.md), [prisma/schema.prisma](../prisma/schema.prisma), [prisma/seed.ts](../prisma/seed.ts)

> **Note:** There is no central `src/lib/constants.tsx` file. The system types are seeded into the `ItemType` table by [prisma/seed.ts:9-17](../prisma/seed.ts#L9-L17). Icons (Lucide names) and colors are read from the DB at render time, not from a code constant.

---

## The 7 System Types

| # | Name | Content Mode | Color | Icon (Lucide) | Tier | Purpose |
|---|------|--------------|-------|---------------|------|---------|
| 1 | `snippet` | `text` | `#3b82f6` blue | `Code` | Free | Reusable code blocks (functions, hooks, configs) |
| 2 | `prompt` | `text` | `#8b5cf6` purple | `Sparkles` | Free | AI prompts and prompt templates |
| 3 | `command` | `text` | `#f97316` orange | `Terminal` | Free | Shell / CLI commands |
| 4 | `note` | `text` | `#a855f7` purple* | `StickyNote` | Free | Free-form developer notes (markdown) |
| 5 | `link` | `url` | `#10b981` emerald | `Link` | Free | Bookmarked URLs / references |
| 6 | `file` | `file` | `#6b7280` gray | `File` | Pro | Uploaded files (R2-backed) |
| 7 | `image` | `file` | `#ec4899` pink | `Image` | Pro | Uploaded images (R2-backed) |

> *Note on `note` color: project-overview.md still lists `#fde047` yellow, but the seed (and the rendered UI) uses `#a855f7` purple. The recolor was logged in current-feature.md history (2026-04-13). The DB / seed value is authoritative.

---

## Per-Type Detail

### 1. Snippet — `#3b82f6` · `Code`

- **Content mode:** `text`
- **Tier:** Free
- **Purpose:** Reusable code blocks — functions, hooks, configs, boilerplate.
- **Key fields used:** `title`, `content`, `language`, `description`
- **Example seed items:** `useDebounce hook`, `useLocalStorage hook`, `Multi-stage Node Dockerfile`

### 2. Prompt — `#8b5cf6` · `Sparkles`

- **Content mode:** `text`
- **Tier:** Free
- **Purpose:** AI prompts and templates — code review, doc generation, refactoring assistants.
- **Key fields used:** `title`, `content`, `description` (no `language`)
- **Example seed items:** `Code review prompt`, `Documentation generation prompt`, `Refactoring assistant prompt`

### 3. Command — `#f97316` · `Terminal`

- **Content mode:** `text`
- **Tier:** Free
- **Purpose:** Single-line / short shell commands worth keeping.
- **Key fields used:** `title`, `content`, `language` (typically `bash`), `description`
- **Example seed items:** `git reset --soft HEAD~1`, `docker system prune -af --volumes`, `npm outdated --depth=0`

### 4. Note — `#a855f7` · `StickyNote`

- **Content mode:** `text`
- **Tier:** Free
- **Purpose:** Free-form markdown — meeting notes, decisions, parking-lot ideas.
- **Key fields used:** `title`, `content`, `description` (no `language`)
- **Example seed items:** `Architecture decisions`, `Weekly priorities`, `Ideas parking lot`

### 5. Link — `#10b981` · `Link`

- **Content mode:** `url`
- **Tier:** Free
- **Purpose:** Saved URLs / bookmarks with descriptions.
- **Key fields used:** `title`, `url`, `description` (no `content`, no `language`)
- **Example seed items:** `Tailwind CSS docs`, `shadcn/ui`, `Lucide icons`

### 6. File — `#6b7280` · `File`

- **Content mode:** `file`
- **Tier:** Pro
- **Purpose:** Arbitrary uploaded files (PDFs, configs, archives) backed by Cloudflare R2.
- **Key fields used:** `title`, `fileUrl`, `fileName`, `fileSize`, `description`
- **Example seed items:** *(none — seed does not create file/image items)*

### 7. Image — `#ec4899` · `Image`

- **Content mode:** `file`
- **Tier:** Pro
- **Purpose:** Uploaded image assets (screenshots, design references).
- **Key fields used:** `title`, `fileUrl`, `fileName`, `fileSize`, `description`
- **Example seed items:** *(none — seed does not create file/image items)*

---

## Content-Mode Classification

Every item is one of three content modes, set on `Item.contentType` and constrained by the item's type:

| Content Mode | Types | What gets stored | Editor UX |
|--------------|-------|------------------|-----------|
| `text` | snippet, prompt, command, note | `content` (markdown / code) | Markdown editor, syntax highlighting where `language` is set |
| `url` | link | `url` | Single URL field |
| `file` | file, image | `fileUrl` + `fileName` + `fileSize` | File upload to R2 |

Source: [context/project-overview.md:56](../context/project-overview.md#L56) — *"Content modes: `text` (snippet, note, prompt, command), `url` (link), `file` (file, image)"*.

---

## Shared Properties (all types)

Every `Item`, regardless of type, has:

| Field | Type | Purpose |
|-------|------|---------|
| `id` | `String` (cuid) | Primary key |
| `title` | `String` | Display name |
| `description` | `String?` | Optional subtitle / blurb |
| `isFavorite` | `Boolean` | Surfaces in Favorites lists |
| `isPinned` | `Boolean` | Surfaces in dashboard Pinned section |
| `userId` | `String` | Owner (cascade-deleted with user) |
| `itemTypeId` | `String` | FK to `ItemType` |
| `collections` | `ItemCollection[]` | M:N to Collection |
| `tags` | `Tag[]` | M:N to Tag |
| `createdAt` / `updatedAt` | `DateTime` | Timestamps |

Indexed combos for common queries: `[userId]`, `[itemTypeId]`, `[userId, isPinned]`, `[userId, isFavorite]` — see [prisma/schema.prisma:103-106](../prisma/schema.prisma#L103-L106).

---

## Per-Type Field Usage Matrix

Which `Item.*` fields each type populates (✓ = used, — = always null):

| Field | snippet | prompt | command | note | link | file | image |
|-------|:-------:|:------:|:-------:|:----:|:----:|:----:|:-----:|
| `title` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `description` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `contentType` | `text` | `text` | `text` | `text` | `url` | `file` | `file` |
| `content` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `language` | ✓ | — | ✓ | — | — | — | — |
| `url` | — | — | — | — | ✓ | — | — |
| `fileUrl` | — | — | — | — | — | ✓ | ✓ |
| `fileName` | — | — | — | — | — | ✓ | ✓ |
| `fileSize` | — | — | — | — | — | ✓ | ✓ |

> `language` is technically optional on every text type, but in practice it's only meaningful for `snippet` and `command` (for syntax highlighting). Seed data confirms: prompts and notes leave it null.

---

## Display Differences

All types share the same dashboard surfaces (sidebar, item rows, collection cards), but render differently based on type metadata:

- **Sidebar entries** ([src/components/dashboard/Sidebar.tsx](../src/components/dashboard/Sidebar.tsx)): each system type gets a row showing its Lucide icon (from `ItemType.icon`), name, and item count. The `file` and `image` rows additionally render a "PRO" badge.
- **Item rows** ([src/components/dashboard/ItemRow.tsx](../src/components/dashboard/ItemRow.tsx) — referenced in current-feature history): border color comes from `ItemType.color`; icon from `ItemType.icon`.
- **Collection cards**: border / accent color is derived from the **most-used type** within the collection (so a collection of mostly snippets gets a blue accent).
- **Type listing pages**: route is `/items/[type]` where `[type]` matches `ItemType.name` (e.g. `/items/snippet`).
- **Editor**: text types open in the markdown editor; `link` shows a URL field; `file`/`image` show an upload widget (R2-backed, Pro-only).

---

## Custom Types (Pro)

The `ItemType` model supports custom user types via `userId`:

- `ItemType.userId = null` + `isSystem = true` → one of the 7 system types above (shared, immutable).
- `ItemType.userId = <user id>` + `isSystem = false` → a user-defined custom type (Pro feature, foundation in place but enforcement deferred).

Custom types pick their own `name`, `icon` (Lucide name), and `color` (hex), so they participate in the same display logic as system types automatically.

`getProfileStats` in [src/lib/db/user.ts](../src/lib/db/user.ts) computes the per-type breakdown across **all** of a user's types (system + custom), per the 2026-04-29 profile-page work.
