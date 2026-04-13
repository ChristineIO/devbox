# Current Feature

## Status

Completed

## Goals

<!-- Describe the feature's goal(s). -->

## Requirements

<!-- List requirements / acceptance criteria. -->

## References

<!-- Link to relevant spec or context files. -->

## Notes

<!-- Any additional context or constraints. -->

## History

<!-- Keep this updated. Earliest to latest. -->

- **2026-04-12:** Scaffolded Next.js 16 project with React 19, Tailwind CSS v4, and TypeScript 5. Stripped default boilerplate, removed unused SVGs, and added project context docs. (Completed)
- **2026-04-12:** Dashboard UI Phase 1 — ShadCN UI initialized with Button and Input components, `/dashboard` route with persistent layout, dark mode by default, top bar with search and New Item/New Collection buttons (display only), sidebar and main placeholders. (Completed)
- **2026-04-13:** Dashboard UI Phase 2 — collapsible sidebar with Types (linked to `/items/[type]`), Favorites and All Collections sections, user avatar footer with settings icon, drawer toggle in top bar, JS-based mobile/desktop switching (rail on desktop, Sheet drawer on mobile). (Completed)
- **2026-04-13:** Dashboard UI Phase 3 — main area with 4 stats cards (items, collections, favorite items, favorite collections), recent collections grid, pinned items list, and 10 most recent items, all wired to `src/lib/mock-data.ts`. (Completed)
- **2026-04-13:** Prisma + Neon setup with initial schema (User, Item, ItemType, Collection, ItemCollection, Tag + NextAuth Account/Session/VerificationToken), migrations configured, and `prisma generate` wired through `prisma.config.ts`. (Completed)
- **2026-04-13:** Seed data — `prisma/seed.ts` creates a bcrypt-hashed demo user, 7 system item types, 5 collections, and 18 items linked via `ItemCollection`; added nullable `User.password` (migration `add_user_password`); `scripts/test-db.ts` extended to print the demo user's collections and items for verification. (Completed)
