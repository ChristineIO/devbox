# DevBox
A develper knowledge hub for snippets, commands, prompts, notes, files and images and links and custom types.


## Context Files

Read the following to get the full context of the project:

- @context/project-overwiew.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run start    # Run production build
npm run lint     # Run ESLint
```

## Stack

- **Next.js 16** with the App Router (`src/app/`)
- **React 19** with the React Compiler enabled (`reactCompiler: true` in [next.config.ts](next.config.ts))
- **TypeScript 5**
- **Tailwind CSS v4** — configured via PostCSS; imported in [globals.css](src/app/globals.css) with `@import "tailwindcss"` (no config file)
- **Geist Sans / Geist Mono** loaded via `next/font/google`, exposed as CSS variables `--font-geist-sans` and `--font-geist-mono`

## Architecture

All routes live under `src/app/` using the Next.js App Router file conventions (`page.tsx`, `layout.tsx`, etc.). The root layout ([src/app/layout.tsx](src/app/layout.tsx)) wraps every page with the font variables and base CSS.

## Neon MCP Usage

When using the Neon MCP server for any database operation (queries, schema inspection, migrations, etc.), **always default to**:

- **Project:** `devbox` (id: `dry-bonus-53741088`)
- **Branch:** `development` (id: `br-aged-lake-ansht8vo`)

### Rules

- **Never** run queries, migrations, or any write/read against the `production` branch (id: `br-wandering-sound-anzwakpw`) unless the user explicitly names it in the request (e.g. "run this on production", "check prod").
- Pass `branchId: "br-aged-lake-ansht8vo"` on every `mcp__neon__run_sql`, `mcp__neon__run_sql_transaction`, `mcp__neon__prepare_database_migration`, and related tool call — do not rely on the default branch, which is `production`.
- If the user asks for data without specifying a branch, use `development` and state which branch you queried in your response.
- Before any destructive operation (DROP, DELETE, TRUNCATE, ALTER) — even on `development` — confirm with the user first.
- Never call `mcp__neon__delete_project`, `mcp__neon__delete_branch`, or `mcp__neon__reset_from_parent` without explicit instruction.
- If the user asks to touch production, confirm once ("You want me to run this against the `production` branch — correct?") before proceeding.