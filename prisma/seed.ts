import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

type SystemType = { name: string; icon: string; color: string };

const SYSTEM_TYPES: SystemType[] = [
  { name: "snippet", icon: "Code", color: "#3b82f6" },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "command", icon: "Terminal", color: "#f97316" },
  { name: "note", icon: "StickyNote", color: "#fde047" },
  { name: "file", icon: "File", color: "#6b7280" },
  { name: "image", icon: "Image", color: "#ec4899" },
  { name: "link", icon: "Link", color: "#10b981" },
];

const DEMO_EMAIL = "demo@devbox.io";
const DEMO_PASSWORD = "12345678";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    // ── System Item Types ────────────────────────
    const typeByName = new Map<string, string>();
    for (const t of SYSTEM_TYPES) {
      const existing = await prisma.itemType.findFirst({
        where: { name: t.name, isSystem: true, userId: null },
      });
      const saved = existing
        ? await prisma.itemType.update({
            where: { id: existing.id },
            data: { icon: t.icon, color: t.color },
          })
        : await prisma.itemType.create({
            data: { ...t, isSystem: true },
          });
      typeByName.set(t.name, saved.id);
      console.log(`System type ready: ${t.name}`);
    }

    const typeId = (name: string) => {
      const id = typeByName.get(name);
      if (!id) throw new Error(`Missing system type: ${name}`);
      return id;
    };

    // ── Demo User ────────────────────────────────
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const user = await prisma.user.upsert({
      where: { email: DEMO_EMAIL },
      update: {
        name: "Demo User",
        password: passwordHash,
        isPro: false,
        emailVerified: new Date(),
      },
      create: {
        email: DEMO_EMAIL,
        name: "Demo User",
        password: passwordHash,
        isPro: false,
        emailVerified: new Date(),
      },
    });
    console.log(`Demo user ready: ${user.email}`);

    // Clear previously seeded collections/items for this user so runs are idempotent.
    await prisma.item.deleteMany({ where: { userId: user.id } });
    await prisma.collection.deleteMany({ where: { userId: user.id } });

    // ── Collections ──────────────────────────────
    const reactPatterns = await prisma.collection.create({
      data: {
        userId: user.id,
        name: "React Patterns",
        description: "Reusable React patterns and hooks",
        defaultTypeId: typeId("snippet"),
      },
    });

    const aiWorkflows = await prisma.collection.create({
      data: {
        userId: user.id,
        name: "AI Workflows",
        description: "AI prompts and workflow automations",
        defaultTypeId: typeId("prompt"),
      },
    });

    const devops = await prisma.collection.create({
      data: {
        userId: user.id,
        name: "DevOps",
        description: "Infrastructure and deployment resources",
      },
    });

    const terminalCommands = await prisma.collection.create({
      data: {
        userId: user.id,
        name: "Terminal Commands",
        description: "Useful shell commands for everyday development",
        defaultTypeId: typeId("command"),
      },
    });

    const designResources = await prisma.collection.create({
      data: {
        userId: user.id,
        name: "Design Resources",
        description: "UI/UX resources and references",
        defaultTypeId: typeId("link"),
      },
    });

    // ── Items ────────────────────────────────────
    type ItemSeed = {
      title: string;
      contentType: "text" | "url" | "file";
      itemTypeName: string;
      collectionId: string;
      description?: string;
      content?: string;
      url?: string;
      language?: string;
    };

    const items: ItemSeed[] = [
      // React Patterns — 3 TypeScript snippets
      {
        title: "useDebounce hook",
        contentType: "text",
        itemTypeName: "snippet",
        collectionId: reactPatterns.id,
        description: "Debounce a rapidly-changing value.",
        language: "typescript",
        content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
`,
      },
      {
        title: "useLocalStorage hook",
        contentType: "text",
        itemTypeName: "snippet",
        collectionId: reactPatterns.id,
        description: "Persist state to localStorage with a typed hook.",
        language: "typescript",
        content: `import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : initial;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
`,
      },
      {
        title: "Theme context provider",
        contentType: "text",
        itemTypeName: "snippet",
        collectionId: reactPatterns.id,
        description: "Typed context + provider + hook pattern.",
        language: "typescript",
        content: `import { createContext, useContext, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
type ThemeContextValue = { theme: Theme; toggle: () => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
`,
      },

      // AI Workflows — 3 prompts
      {
        title: "Code review prompt",
        contentType: "text",
        itemTypeName: "prompt",
        collectionId: aiWorkflows.id,
        description: "Focused review covering correctness, security, and style.",
        content: `You are a senior engineer reviewing a pull request. For the diff below:
1. Flag correctness bugs and edge cases.
2. Call out security issues (injection, authz, secrets).
3. Suggest smaller, targeted improvements to readability.
Return findings as a short checklist. Do not rewrite the code unless asked.

Diff:
{{diff}}
`,
      },
      {
        title: "Documentation generation prompt",
        contentType: "text",
        itemTypeName: "prompt",
        collectionId: aiWorkflows.id,
        description: "Turn a module into concise developer-facing docs.",
        content: `Write developer documentation for the module below. Include:
- One-sentence summary
- Exported API with signatures and short descriptions
- A minimal usage example
Keep it under 200 words. No filler.

Module:
{{source}}
`,
      },
      {
        title: "Refactoring assistant prompt",
        contentType: "text",
        itemTypeName: "prompt",
        collectionId: aiWorkflows.id,
        description: "Propose refactors without changing behavior.",
        content: `Refactor the code below to improve clarity and reduce duplication.
Rules:
- Preserve observable behavior and public API.
- Prefer smaller, well-named functions over comments.
- Explain each change in one line.

Code:
{{source}}
`,
      },

      // DevOps — 1 snippet, 1 command, 2 links
      {
        title: "Multi-stage Node Dockerfile",
        contentType: "text",
        itemTypeName: "snippet",
        collectionId: devops.id,
        description: "Slim production image for a Node app.",
        language: "dockerfile",
        content: `FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./
USER node
CMD ["node", "dist/index.js"]
`,
      },
      {
        title: "Deploy to production",
        contentType: "text",
        itemTypeName: "command",
        collectionId: devops.id,
        description: "Run Prisma migrations then deploy the built app.",
        language: "bash",
        content: `npx prisma migrate deploy && npm run build && npm run start`,
      },
      {
        title: "GitHub Actions: reusable workflows",
        contentType: "url",
        itemTypeName: "link",
        collectionId: devops.id,
        description: "Official docs for composing reusable CI workflows.",
        url: "https://docs.github.com/en/actions/using-workflows/reusing-workflows",
      },
      {
        title: "Docker Compose reference",
        contentType: "url",
        itemTypeName: "link",
        collectionId: devops.id,
        description: "Full reference for the Compose file specification.",
        url: "https://docs.docker.com/compose/compose-file/",
      },

      // Terminal Commands — 4 commands
      {
        title: "Undo the last commit (keep changes staged)",
        contentType: "text",
        itemTypeName: "command",
        collectionId: terminalCommands.id,
        description: "Moves HEAD back one commit, leaves the working tree intact.",
        language: "bash",
        content: `git reset --soft HEAD~1`,
      },
      {
        title: "Prune unused Docker resources",
        contentType: "text",
        itemTypeName: "command",
        collectionId: terminalCommands.id,
        description: "Reclaim disk space from stopped containers, dangling images, and unused networks.",
        language: "bash",
        content: `docker system prune -af --volumes`,
      },
      {
        title: "Find and kill process on a port",
        contentType: "text",
        itemTypeName: "command",
        collectionId: terminalCommands.id,
        description: "Identify the PID bound to a port and terminate it.",
        language: "bash",
        content: `lsof -i :3000 -t | xargs kill -9`,
      },
      {
        title: "Check for outdated npm packages",
        contentType: "text",
        itemTypeName: "command",
        collectionId: terminalCommands.id,
        description: "List outdated direct dependencies in the current project.",
        language: "bash",
        content: `npm outdated --depth=0`,
      },

      // Design Resources — 4 links
      {
        title: "Tailwind CSS docs",
        contentType: "url",
        itemTypeName: "link",
        collectionId: designResources.id,
        description: "Utility-first CSS framework — full reference.",
        url: "https://tailwindcss.com/docs",
      },
      {
        title: "shadcn/ui",
        contentType: "url",
        itemTypeName: "link",
        collectionId: designResources.id,
        description: "Copy-paste component library built on Radix + Tailwind.",
        url: "https://ui.shadcn.com",
      },
      {
        title: "Material Design 3",
        contentType: "url",
        itemTypeName: "link",
        collectionId: designResources.id,
        description: "Google's open design system guidelines and components.",
        url: "https://m3.material.io",
      },
      {
        title: "Lucide icons",
        contentType: "url",
        itemTypeName: "link",
        collectionId: designResources.id,
        description: "Consistent open-source icon set used across the app.",
        url: "https://lucide.dev/icons/",
      },
    ];

    for (const it of items) {
      const created = await prisma.item.create({
        data: {
          userId: user.id,
          itemTypeId: typeId(it.itemTypeName),
          title: it.title,
          contentType: it.contentType,
          content: it.content,
          url: it.url,
          description: it.description,
          language: it.language,
        },
      });
      await prisma.itemCollection.create({
        data: { itemId: created.id, collectionId: it.collectionId },
      });
      console.log(`Item ready: ${it.title}`);
    }

    console.log("Seed complete.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
