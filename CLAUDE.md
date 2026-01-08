# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

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

## Quick Reference (bd)

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

