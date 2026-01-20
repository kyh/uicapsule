# Agent Instructions

## Project Overview

**uicapsule** - pnpm monorepo with Turborepo

### Structure

```
apps/
  nextjs/        # Next.js 16 app (main frontend)
packages/
  api/           # tRPC API + better-auth
  db/            # Drizzle ORM + Turso (libSQL)
  ui/            # shadcn/ui components (radix-ui)
  builder/       # Content builder (watches /content)
```

### Tech Stack

- **Runtime**: pnpm 10, Node, TypeScript 5.9
- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **API**: tRPC, better-auth
- **Database**: Turso (libSQL), Drizzle ORM
- **UI**: radix-ui, shadcn, lucide-react, motion

## Common Commands

```bash
pnpm dev              # Start all (db, studio, dev)
pnpm dev-nextjs       # Just Next.js app
pnpm build            # Build all
pnpm typecheck        # Type check all
pnpm lint             # Lint all
pnpm lint-fix         # Lint + fix
pnpm format           # Check formatting
pnpm format-fix       # Fix formatting
pnpm db-push          # Push local db schema
pnpm db-push-remote   # Push to production Turso
pnpm gen-ui           # Add shadcn components
```
