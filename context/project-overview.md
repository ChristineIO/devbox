# DevBox — Project Overview

> **One hub for all your developer knowledge & resources.**

---

## Problem

Developers keep their essentials scattered across too many tools:

| What | Where it ends up |
|------|-----------------|
| Code snippets | VS Code, Notion, GitHub Gists |
| AI prompts | Chat histories |
| Context files | Buried in project folders |
| Useful links | Browser bookmarks |
| Docs & notes | Random folders |
| Commands | `.txt` files, bash history |
| Templates | GitHub Gists, local repos |

This creates **context switching**, **lost knowledge**, and **inconsistent workflows**.

DevBox solves this by providing a single, fast, searchable, AI-enhanced hub for all developer knowledge and resources.

---

## Target Users

| Persona | Primary Need |
|---------|-------------|
| **Everyday Developer** | Fast access to snippets, prompts, commands, links |
| **AI-first Developer** | Save & organize prompts, contexts, workflows, system messages |
| **Content Creator / Educator** | Store code blocks, explanations, course notes |
| **Full-stack Builder** | Collect patterns, boilerplates, API examples |

---

## Features

### A. Items & Item Types

Items are the core unit. Each item has a **type** that determines its behavior and appearance. Users start with system types (immutable) and can later create custom types (Pro).

**System Types:**

| Type | Content Mode | Color | Icon ([Lucide](https://lucide.dev/icons)) | Tier |
|------|-------------|-------|------|------|
| Snippet | `text` | ![#3b82f6](https://placehold.co/12x12/3b82f6/3b82f6.png) `#3b82f6` blue | `Code` | Free |
| Prompt | `text` | ![#8b5cf6](https://placehold.co/12x12/8b5cf6/8b5cf6.png) `#8b5cf6` purple | `Sparkles` | Free |
| Command | `text` | ![#f97316](https://placehold.co/12x12/f97316/f97316.png) `#f97316` orange | `Terminal` | Free |
| Note | `text` | ![#fde047](https://placehold.co/12x12/fde047/fde047.png) `#fde047` yellow | `StickyNote` | Free |
| Link | `url` | ![#10b981](https://placehold.co/12x12/10b981/10b981.png) `#10b981` emerald | `Link` | Free |
| File | `file` | ![#6b7280](https://placehold.co/12x12/6b7280/6b7280.png) `#6b7280` gray | `File` | Pro |
| Image | `file` | ![#ec4899](https://placehold.co/12x12/ec4899/ec4899.png) `#ec4899` pink | `Image` | Pro |

> **Content modes:** `text` (snippet, note, prompt, command), `url` (link), `file` (file, image)

- URL pattern: `/items/snippets`, `/items/prompts`, etc.
- Items open in a **quick-access drawer** for fast creation and editing.
- Text types use a **Markdown editor**.
- File types support **file upload** (stored in [Cloudflare R2](https://developers.cloudflare.com/r2/)).

### B. Collections

Collections are user-created groups that can hold **items of any type**. An item can belong to **multiple collections**.

Examples:
- "React Patterns" — snippets, notes
- "Context Files" — files
- "Interview Prep" — snippets, prompts

### C. Search

Full search across **content**, **tags**, **titles**, and **types**.

### D. Authentication

- Email/password
- GitHub OAuth
- Powered by [NextAuth v5](https://authjs.dev/)

### E. Additional Features

- Favorite collections and items
- Pin items to top
- Recently used items
- Import code from a file
- Export data (JSON/ZIP) — Pro only
- Add/remove items to/from multiple collections
- View which collections an item belongs to
- Dark mode by default, light mode optional

### F. AI Features (Pro Only)

| Feature | Description |
|---------|-------------|
| **Auto-tag suggestions** | AI suggests relevant tags when saving items |
| **Summaries** | Generate a concise summary of an item's content |
| **Explain This Code** | AI explains what a code snippet does |
| **Prompt Optimizer** | Improve and refine AI prompts |

Powered by [OpenAI](https://platform.openai.com/) `gpt-5-nano` model.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | [Next.js 16](https://nextjs.org/) / [React 19](https://react.dev/) | App Router, SSR, API routes — single codebase |
| Language | [TypeScript 5](https://www.typescriptlang.org/) | |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) + [ShadCN UI](https://ui.shadcn.com/) | |
| Database | [Neon](https://neon.tech/) (PostgreSQL) | Cloud-hosted |
| ORM | [Prisma 7](https://www.prisma.io/) | Fetch latest docs |
| Auth | [NextAuth v5](https://authjs.dev/) | Email/password + GitHub OAuth |
| File Storage | [Cloudflare R2](https://developers.cloudflare.com/r2/) | For file/image uploads |
| AI | [OpenAI](https://platform.openai.com/) `gpt-5-nano` | |
| Cache | [Redis](https://redis.io/) | TBD |

> **Important:** NEVER use `db push` or directly update the database structure. All schema changes go through **Prisma migrations** — run in dev first, then in prod.

---

## Data Model (Rough Draft)

> This is a rough draft and **subject to change** as the project evolves.

### Entity Relationship Diagram

```
┌──────────┐       ┌───────────┐       ┌──────────────┐
│          │──1:N──│           │──N:M──│              │
│   User   │       │   Item    │       │  Collection  │
│          │──1:N──│           │       │              │──N:1── User
└──────────┘       └───────────┘       └──────────────┘
     │                  │  │                   │
     │1:N             1:N  N:M                N:1
     │                  │  │                   │
     ▼                  ▼  ▼                   ▼
┌─────────┐      ┌─────────┐ ┌───────┐  ┌──────────┐
│ItemType │      │ItemType │ │  Tag  │  │ ItemType │
└─────────┘      └─────────┘ └───────┘  └──────────┘
(custom)          (on item)              (defaultType)

  * ItemType.userId = null → system type
  * ItemType.userId = id  → custom type (Pro)
  * Item ↔ Collection via ItemCollection join table
  * Item ↔ Tag via implicit many-to-many
```

### Prisma Schema

```prisma
// ──────────────────────────────────────────
//  ROUGH DRAFT — not final
// ──────────────────────────────────────────

// ── Auth (extends NextAuth) ──────────────

model User {
  id                   String    @id @default(cuid())
  name                 String?
  email                String?   @unique
  emailVerified        DateTime?
  image                String?
  isPro                Boolean   @default(false)
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?   @unique

  items       Item[]
  itemTypes   ItemType[]
  collections Collection[]
  accounts    Account[]
  sessions    Session[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ── Core ─────────────────────────────────

model Item {
  id          String  @id @default(cuid())
  title       String
  contentType String  // "text" | "url" | "file"
  content     String? // text content (null if file)
  url         String? // for link types
  fileUrl     String? // R2 URL (null if text/url)
  fileName    String? // original filename
  fileSize    Int?    // bytes
  description String?
  language    String? // programming language (optional)
  isFavorite  Boolean @default(false)
  isPinned    Boolean @default(false)

  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  itemTypeId String
  itemType   ItemType @relation(fields: [itemTypeId], references: [id])

  collections ItemCollection[]
  tags        Tag[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([itemTypeId])
}

model ItemType {
  id       String  @id @default(cuid())
  name     String  // "snippet", "prompt", etc.
  icon     String  // Lucide icon name
  color    String  // hex color
  isSystem Boolean @default(false)

  userId String? // null → system type
  user   User?   @relation(fields: [userId], references: [id], onDelete: Cascade)

  items             Item[]
  defaultCollections Collection[] @relation("DefaultType")

  @@index([userId])
}

model Collection {
  id          String  @id @default(cuid())
  name        String
  description String?
  isFavorite  Boolean @default(false)

  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  defaultTypeId String?
  defaultType   ItemType? @relation("DefaultType", fields: [defaultTypeId], references: [id])

  items ItemCollection[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

// ── Join Tables & Taxonomy ───────────────

model ItemCollection {
  itemId       String
  item         Item       @relation(fields: [itemId], references: [id], onDelete: Cascade)
  collectionId String
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  addedAt      DateTime   @default(now())

  @@id([itemId, collectionId])
  @@index([collectionId])
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  items Item[]
}
```

---

## Monetization

### Pricing Tiers

| | **Free** | **Pro** — $8/mo or $72/yr |
|---|---|---|
| Items | 50 | Unlimited |
| Collections | 3 | Unlimited |
| Item types | System (no file/image) | All + custom (coming later) |
| Search | Basic | Full |
| File/image uploads | No | Yes ([Cloudflare R2](https://developers.cloudflare.com/r2/)) |
| AI features | No | Auto-tagging, code explanation, prompt optimizer |
| Export (JSON/ZIP) | No | Yes |
| Support | Standard | Priority |

> **Dev note:** Set up the foundation for Pro, but during development **all users can access everything**. Enforcement comes later.

Payments handled via [Stripe](https://stripe.com/) — `stripeCustomerId` and `stripeSubscriptionId` stored on the User model.

---

## UI/UX

### Design Principles

- Modern, minimal, developer-focused
- Dark mode by default, light mode optional
- Clean typography, generous whitespace, subtle borders and shadows
- Syntax highlighting for code blocks
- **Design references:** [Notion](https://notion.so), [Linear](https://linear.app), [Raycast](https://raycast.com)

### Screenshots

Refer to the screenshots below as a base for the dashboard ui. It doesn't have to be exact. Use it as a reference.

- @context/screenshots/dashboard-ui-main.png
- @context/screenshots/dashboard-ui-drawer.png

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  Sidebar (collapsible)        │  Main Content            │
│                               │                          │
│  ┌─────────────────────────┐  │  ┌────────────────────┐  │
│  │ Item Types              │  │  │ Collection Cards    │  │
│  │  > Snippets             │  │  │ (bg color = most    │  │
│  │  > Prompts              │  │  │  common type color) │  │
│  │  > Commands             │  │  │                     │  │
│  │  > Notes                │  │  ├────────────────────┤  │
│  │  > Links                │  │  │ Item Cards          │  │
│  │  > Files                │  │  │ (border color =     │  │
│  │  > Images               │  │  │  type color)        │  │
│  ├─────────────────────────┤  │  └────────────────────┘  │
│  │ Recent Collections      │  │                          │
│  │  > React Patterns       │  │  ┌────────────────────┐  │
│  │  > Interview Prep       │  │  │ Item Drawer         │  │
│  │  > Context Files        │  │  │ (slides in for      │  │
│  └─────────────────────────┘  │  │  view/edit)         │  │
│                               │  └────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

- **Sidebar:** Item type navigation + recent collections. Collapses to a drawer on mobile.
- **Main content:** Grid of collection cards (background color from dominant type) and item cards (border color from type).
- **Item drawer:** Quick-access slide-in panel for creating/viewing/editing items.
- **Desktop-first**, mobile-usable.

### Micro-interactions

- Smooth transitions
- Hover states on cards
- Toast notifications for actions
- Loading skeletons
