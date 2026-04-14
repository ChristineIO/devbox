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

## History

<!-- Keep this updated. Earliest to latest. -->

- **2026-04-12:** Scaffolded Next.js 16 project with React 19, Tailwind CSS v4, and TypeScript 5. Stripped default boilerplate, removed unused SVGs, and added project context docs. (Completed)
- **2026-04-12:** Dashboard UI Phase 1 — ShadCN UI initialized with Button and Input components, `/dashboard` route with persistent layout, dark mode by default, top bar with search and New Item/New Collection buttons (display only), sidebar and main placeholders. (Completed)
- **2026-04-13:** Dashboard UI Phase 2 — collapsible sidebar with Types (linked to `/items/[type]`), Favorites and All Collections sections, user avatar footer with settings icon, drawer toggle in top bar, JS-based mobile/desktop switching (rail on desktop, Sheet drawer on mobile). (Completed)
- **2026-04-13:** Dashboard UI Phase 3 — main area with 4 stats cards (items, collections, favorite items, favorite collections), recent collections grid, pinned items list, and 10 most recent items, all wired to `src/lib/mock-data.ts`. (Completed)
- **2026-04-13:** Prisma + Neon setup with initial schema (User, Item, ItemType, Collection, ItemCollection, Tag + NextAuth Account/Session/VerificationToken), migrations configured, and `prisma generate` wired through `prisma.config.ts`. (Completed)
- **2026-04-13:** Seed data — `prisma/seed.ts` creates a bcrypt-hashed demo user, 7 system item types, 5 collections, and 18 items linked via `ItemCollection`; added nullable `User.password` (migration `add_user_password`); `scripts/test-db.ts` extended to print the demo user's collections and items for verification. (Completed)
- **2026-04-13:** Dashboard Collections — replaced mock collections in dashboard main area with live Prisma data via `src/lib/db/collections.ts`; `RecentCollections` and `StatsCards` now async server components; card border color derives from most-used type; type icons rendered from actual types; fixed self-referential `--font-sans` so Geist Sans applies across the app. (Completed)
- **2026-04-13:** Dashboard Items — replaced mock items with live Prisma data via `src/lib/db/items.ts` (`getPinnedItems`, `getRecentItems`, `getItemStats`); `PinnedItems` and `RecentItems` now async server components; `ItemRow` takes embedded type (icon/border color from `ItemType`); `StatsCards` item counts sourced from DB. (Completed)
- **2026-04-13:** Stats & Sidebar — sidebar wired to live DB data: `getSidebarItemTypes` and `getSidebarCollections` feed the dashboard layout, which passes types and collections into `Sidebar`/`SidebarContent`. Types render with DB icons/counts and link to `/items/[typename]`; collections split into Favorites and Recent (color dot from most-used type), with a "View all collections" link. Seed extended with a 6th "Project Notes" collection and three note items; `note` system type recolored from yellow to purple (#a855f7). (Completed)
- **2026-04-14:** Pro Badge — added ShadCN `Badge` component and rendered a subtle outline "PRO" badge next to the `file` and `image` type entries in the sidebar (hidden when collapsed); count pushed to the right with `ml-auto`. (Completed)