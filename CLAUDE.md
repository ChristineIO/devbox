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