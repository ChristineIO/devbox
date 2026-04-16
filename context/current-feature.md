# Current Feature

## Status

Complete

## Goals

<!-- Bullet points of what success looks like -->

## Notes

<!-- Additional context, constraints, or details from spec -->

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
- **2026-04-14:** Cleanup — deleted `src/lib/mock-data.ts` (superseded by Prisma); rewrote `/items/[type]/page.tsx` to resolve the type via Prisma by name so the sidebar links work, and added `force-dynamic`. (Completed)
- **2026-04-15:** Audit quick wins — consolidated `getDemoUserId` into `src/lib/db/user.ts` and wrapped it in React `cache()` so repeated calls within one render pass deduplicate; removed duplicates from `items.ts` and `collections.ts`. Dropped manual `useCallback` / `useMemo` from `SidebarContext` (React Compiler handles it). Root `/` now redirects to `/dashboard`. Added composite indexes `@@index([userId, isPinned])` and `@@index([userId, isFavorite])` on `Item` via migration `add_item_boolean_indexes`. (Completed)
- **2026-04-15:** Auth Phase 1 — installed `next-auth@beta` and `@auth/prisma-adapter`; split-config pattern with edge-safe `src/auth.config.ts` (GitHub provider) and full `src/auth.ts` (Prisma adapter + JWT strategy + session callback exposing `user.id`); handlers re-exported from `src/app/api/auth/[...nextauth]/route.ts`; `src/proxy.ts` redirects unauthenticated `/dashboard/*` requests to `/api/auth/signin` with `callbackUrl`; `src/types/next-auth.d.ts` extends `Session.user` with `id`. (Completed)
- **2026-04-15:** Auth Phase 2 — added Credentials provider with split-config pattern: placeholder `authorize: () => null` in `src/auth.config.ts`, real bcrypt validation in `src/auth.ts` (filters the placeholder and appends the real provider). New `POST /api/auth/register` route validates name/email/password/confirmPassword with zod, rejects duplicates (409) and mismatched passwords (400), hashes with bcryptjs cost 12. Installed `zod`. (Completed)
- **2026-04-16:** Auth Phase 3 — custom auth UI replacing NextAuth defaults. New `/sign-in` and `/register` pages under `(auth)` route group with email/password forms, GitHub OAuth button (inline SVG since lucide-react has no `Github` icon), and client-side validation; `RegisterForm` POSTs to `/api/auth/register` then redirects to `/sign-in?registered=1`. Server actions in `src/actions/auth.ts` (`signInWithCredentials`, `signInWithGithub`, `signOutAction`). `auth.config.ts` sets `pages.signIn: "/sign-in"` and `proxy.ts` redirects unauthenticated `/dashboard/*` there. Sidebar footer replaced with `SidebarUserMenu`: reusable `UserAvatar` (GitHub image or initials fallback) linking to `/profile`, plus a base-ui dropdown (`modal={false}`, `render={<Link>}` for Profile, `useTransition` for Sign Out) with Profile + Sign out items. `getSidebarUser` now reads from the live session via `auth()` and includes `image`. Added shadcn `dropdown-menu` and `label`; `suppressHydrationWarning` on `<body>` for browser-extension attribute injection. (Completed)
