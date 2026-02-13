# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Constitution (Binding)

See [constitution.md](../constitution.md) for foundational rules. The constitution is **binding** and supersedes other rules.

## Prerequisites

- **Node.js >= 22** (see `engines` in root `package.json`)
- **pnpm 10.29.1** (enforced via `packageManager` in root `package.json`)
- **Environment variables**: See `specs/ENVIRONMENT_VARIABLES.md` for required env vars

## Commands

```bash
# Development
pnpm dev                    # Start all apps (landing:3000, web:3001, internal:3002)
pnpm install                # Install dependencies (standard pnpm command)

# Testing
pnpm test                   # Run all tests via Vitest workspace
pnpm test:changed           # Run tests only for changed files (HEAD^1)
pnpm test:all               # Run all tests across apps, features, infrastructure
pnpm test:apps              # Run tests for apps/* only
pnpm test:features          # Run tests for @features/* packages
pnpm test:infra             # Run tests for @infrastructure/* packages
pnpm --filter @features/brand-intelligence test  # Run tests for a specific package

# Linting & Formatting
pnpm lint                   # Lint via Biome
pnpm lint:fix               # Auto-fix linting issues via Biome
pnpm format                 # Format via Biome
pnpm format:unsafe          # Format with unsafe fixes (used in pre-commit)
pnpm pre-commit             # Install deps + format (unsafe) + test changed files (run before pushing — no git hooks)

# Build & Types
pnpm build                  # Build all packages/apps via Turborepo (runs pnpm self-update first)
pnpm gencode                # Regenerate types (run after Supabase schema changes)

# Utilities
pnpm reset                  # Clear node_modules, .next, dist, .turbo caches

# Payload CMS (apps/payload)
pnpm --filter payload dev              # Start Payload CMS on port 3003
pnpm --filter payload test             # Run all Payload tests (integration + e2e)
pnpm --filter payload test:int         # Run Payload integration tests only (Vitest)
pnpm --filter payload generate:types   # Regenerate Payload TypeScript types
```

## Database Migrations

After creating a Supabase migration, **always run it locally and regenerate types**.

Use the scripts in `@infrastructure/supabase` package (run from repo root with `--filter`):

```bash
# Local development
pnpm --filter @infrastructure/supabase db:start    # Start local Supabase
pnpm --filter @infrastructure/supabase db:stop     # Stop local Supabase
pnpm --filter @infrastructure/supabase db:status   # Check local Supabase status
pnpm --filter @infrastructure/supabase db:open     # Open Supabase Studio in browser

# Creating migrations
pnpm --filter @infrastructure/supabase db:diff     # Generate migration from schema changes (timestamped)

# Running migrations
pnpm --filter @infrastructure/supabase db:reset    # Reset and run all migrations + regenerate types (destructive)
pnpm --filter @infrastructure/supabase db:migrate  # Run pending migrations only

# Regenerate TypeScript types
pnpm --filter @infrastructure/supabase gencode:local  # Generate types from local database
pnpm --filter @infrastructure/supabase gencode        # Generate types from remote database

# Remote database operations
pnpm --filter @infrastructure/supabase db:link     # Link to remote project
pnpm --filter @infrastructure/supabase db:pull     # Pull remote schema + migrate + gencode
pnpm --filter @infrastructure/supabase db:push     # Push local migrations to remote
pnpm --filter @infrastructure/supabase db:repair   # Mark migrations as applied on remote
pnpm --filter @infrastructure/supabase db:squash   # Squash migrations
pnpm --filter @infrastructure/supabase db:list     # List migration status
```

**Required workflow:**
1. Create migration file (use `db:diff` or manually create in `packages/infrastructure/supabase/migrations/`)
2. Write SQL in the migration
3. Run migration locally (`db:reset` or `db:migrate`)
4. Regenerate types (`gencode:local`)
5. Update any code that uses the changed tables
6. Commit migration file AND updated `database.types.ts` together

**Rules:**
- Never commit a migration without running it locally first
- Always regenerate types after schema changes
- Migration and type changes should be in the same commit
- Use `db:reset` for clean slate; use `db:migrate` for incremental updates

**Gotchas:**
- Prefer database VIEWs (`CREATE VIEW ... WITH (security_invoker = true)`) over PostgREST computed column functions for exposing foreign-table data — NOTIFY doesn't reliably reach PostgREST through Supabase's Supavisor connection pooler
- When creating VIEWs, grant access to `authenticated` and `service_role` roles
- For any remaining SQL functions, use `public.` schema prefix and end with `NOTIFY pgrst, 'reload schema'`
- Migration timestamps must sort after the latest migration already applied on staging — Supabase refuses out-of-order insertions and CI dry-run will fail
- PostgREST's `max_rows` (1000) silently truncates RPC responses — use `paginatedRpc()` from `@infrastructure/supabase` for any RPC that may return >1000 rows

## Staging Environment

**Local development syncs from staging, not production.**

```
Production ← (staging→main merge, GitHub Action)
     ↑
Staging ← (feature→staging merge, GitHub Action)
     ↓
Local (db:pull syncs from staging)
```

**Workflow:**
1. `db:pull` - Sync local schema from staging
2. `db:diff` - Create migration locally
3. `db:reset` - Test locally
4. PR to `staging` - GitHub Action deploys to staging DB
5. PR to `main` - GitHub Action deploys to production DB

**Commands:**
- `db:link` / `db:pull` / `gencode` - All target **staging** by default
- `db:link:production` / `gencode:production` - For rare production access

See `specs/STAGING_ENVIRONMENT.md` for complete documentation.

## CI/CD Infrastructure

**GitHub Actions run on a self-hosted runner** hosted on a free Oracle Cloud VM to avoid GitHub's usage limits.

**Key points:**
- All workflows use `runs-on: self-hosted` instead of GitHub-hosted runners
- The runner is a Linux VM on Oracle Cloud's Always Free tier
- This provides unlimited CI/CD minutes without GitHub Actions costs

**Daily Summary Workflow:**
- Runs at 8:00 AM EST daily (`summarize-daily.yml`)
- Gathers commits from both `staging` and `main` branches
- Generates AI-powered progress summaries via OpenRouter
- Sends combined summary to Google Chat showing what's in Production vs Staging

## Source Control

**Use Graphite exclusively for source control operations.** Never use git commands directly.

```bash
# Authentication
gt auth --token $GRAPHITE_TOKEN  # Authenticate with Graphite using token from env

# Stack Management
gt create <branch-name>     # Create new branch in stack
gt down                     # Move to parent branch
gt up                       # Move to child branch
gt log short                # View current stack

# Committing Changes
gt add <files>              # Stage files (or gt add . for all)
gt modify -c -m "message"   # Create commit on current branch
gt modify -a -m "message"   # Amend the most recent commit

# Syncing & Rebasing
gt sync                     # Sync entire stack with trunk (main)
gt repo sync                # Pull latest from main, rebase stack

# Submitting PRs
gt submit                   # Create/update PR for current branch
gt submit --stack           # Create/update PRs for entire stack

# Navigation
gt checkout <name>           # Switch to branch
gt trunk                    # Switch to trunk branch (main)

# Stack Operations
gt restack                  # Fix stack after manual changes
gt fold                     # Squash child branch into current
```

**Rules:**
- Always use `gt` commands instead of `git` for branch/commit operations
- Use `gt sync` to keep stack rebased on trunk
- Use `gt submit` to create/update pull requests
- Check stack status with `gt log short` before major operations
- **Feature branches target `staging`** - use `gt track --parent staging` for new branches

## Git Worktrees

```bash
# Create a worktree for isolated feature work
git worktree add .worktrees/my-feature -b my-feature-branch
cd .worktrees/my-feature
gt track --parent staging  # Required before using Graphite commands
```

- Worktrees go in `.worktrees/` directory (gitignored)
- After `git worktree remove`, change directory before running more commands (shell CWD becomes invalid)
- Branches created with `git worktree add -b <branch>` need `gt track --parent staging` before using Graphite commands

## Architecture

**Monorepo with three package types:**
- **Apps** (`apps/*`): Next.js applications that compose features and infrastructure
  - `apps/landing` - Marketing site (triosens.io)
  - `apps/web` - Main application
  - `apps/internal` - Internal tools
  - `apps/payload` - Payload CMS for blog (payload.triosens.io)
- **Features** (`@features/*`): Standalone business feature packages; can only import from infrastructure
- **Infrastructure** (`@infrastructure/*`): Shared utilities, UI components, cross-cutting concerns; can be used anywhere

**Key feature packages:**
- `@features/authentication` - Login, signup, password reset flows
- `@features/brand-intelligence` - Brand monitoring, reports, sources, prompts
- `@features/teams` - Team management (create, invite, settings)
- `@features/personas` - AI persona management
- `@features/profile` - User profile management
- `@features/landing` - Marketing site components and surfaces
- `@features/blog` - Blog feature (Payload CMS integration, see below)

**Key infrastructure packages:**
- `@infrastructure/shadcn` - UI components; CSS utilities like `glass` in `src/styles/globals.css`
- `@infrastructure/supabase` - Database client, types from `database.types.ts`, `paginatedRpc()` helper
- `@infrastructure/navigation` - Typesafe routing (use instead of `next/navigation`)
- `@infrastructure/types` - Shared types (note: `ServerActionResult<T>` is deprecated)
- `@infrastructure/orpc` - oRPC procedures, middleware, client, `ORPCError`; OpenAPI generation
- `@infrastructure/ai` - AI/LLM utilities
- `@infrastructure/utilities` - Shared utility functions (formatDate, formatDateTime, etc.)
- `@infrastructure/logging` - Logging utilities
- `@infrastructure/qstash` - QStash queue integration
- `@infrastructure/data-for-seo` - DataForSEO API integration (keyword suggestions, search volume)
- `@infrastructure/assets` - Static asset management
- `@infrastructure/github` - GitHub API utilities
- `@infrastructure/telemetry` - Observability and telemetry
- `@infrastructure/typescript-config` - Shared TypeScript configuration

**Feature package structure** (use applicable folders per feature — not all are required):
```
src/
  contracts/    # oRPC contracts (suffix: "Contract", e.g., teamsContract.ts)
  routers/      # oRPC routers (suffix: "ORPCRouter", e.g., teamsORPCRouter.ts)
                #   Also contains types.ts — manually-maintained client-side type interfaces
  procedures/   # Business logic functions (e.g., createTeam.ts, fetchTeams.ts)
  queries/      # Query options (prefix: "get", suffix: "QueryOptions")
  mutations/    # Mutation options (prefix: "get", suffix: "MutationOptions")
  flags/        # Feature flags (prefix: "use", e.g., usePrecomputedMetrics.ts)
  components/   # Internal React components
  surfaces/     # Public Surface components (suffix: "Surface")
  schemas/      # Zod validation schemas
  helpers/      # Internal helper functions (business logic utilities)
  handlers/     # API call handlers (blog: external API; brand-intelligence: QStash job handlers)
  hooks/        # Custom React hooks (camelCase with "use" prefix)
  contexts/     # React context providers
  tasks/        # QStash task definitions
  forms/        # Form components
  lib/          # Internal utilities and client helpers
  layouts/      # Layout components (suffix: "Layout")
  models/       # Domain model types (interfaces/types for domain entities)
  scripts/      # Utility scripts
  skeletons/    # Skeleton loading components
  actions/      # [DEPRECATED] Legacy server actions - do not add new files
```

## Blog Feature (@features/blog)

The blog feature uses a different pattern - it fetches from external Payload CMS API instead of Supabase:

- Uses `handlers/` folder (not `procedures/`) for API calls
- Export pattern: `handleFetchPosts`, `handleFetchPostBySlug`, `handleFetchCategories`
- No oRPC - direct fetch with ISR caching
- Types defined locally in `lib/blog-types.ts`
- Media uploads use Vercel Blob storage (`BLOB_READ_WRITE_TOKEN` env var required for deployment)

See `specs/BLOG.md` for complete documentation.

## Server Actions ⚠️ DEPRECATED

Server actions (`actions/` folder, `ServerActionResult<T>`) are deprecated. **Do not add new server actions.** All new business logic must use oRPC procedures that throw `ORPCError`. ~64 legacy action files remain in `@features/brand-intelligence`; `unwrapResult.ts` bridges them into oRPC handlers.

## Data Fetching & Mutations

oRPC is the unified mechanism for ALL server communication (both queries and mutations):

- Use `useORPC()` hook from `@/orpc/react` in the web app
- Queries use `orpc.{feature}.{procedure}.queryOptions()` with `useQuery`
- Mutations use `orpc.{feature}.{procedure}.mutationOptions()` with `useMutation`
- Queries support CDN caching with cache headers
- Contracts define API shape in `src/contracts/` and routers implement in `src/routers/`
- Business logic lives in `src/procedures/` folder functions
- Router composition happens at app level (`apps/web/src/orpc/router.ts`)
- OpenAPI docs available at `/api/docs`

```typescript
// Query example (in web app components)
import { useORPC } from "@/orpc/react";
import { useQuery } from "@tanstack/react-query";

const orpc = useORPC();
const { data } = useQuery(orpc.teams.list.queryOptions());

// Mutation example (in web app components)
import { useMutation } from "@tanstack/react-query";

const createTeam = useMutation(orpc.teams.create.mutationOptions());
createTeam.mutate({ name: "New Team" });
```

For contract, procedure, and router implementation patterns, see the constitution (Principles XVIII and XVIII-A).

**Rules:**
- **Never use `useEffect`** for data loading—use TanStack Query hooks
- **All operations** (queries and mutations) use oRPC
- Import `/server` for routers and procedures, `/client` for React hooks
- Throw `ORPCError` for errors (not `ServerActionResult`)

## Core Conventions

- **Biome**: 100-char line width; import order: `react` > `next` > `@infrastructure/*` > `@features/*` > absolute > relative
- **Base UI migration in progress**: Button, Accordion, and Sheet use `@base-ui/react`; all other shadcn components still use Radix UI. When migrating a component, update all consumers to match the new API.
- Button uses Base UI's `render` prop instead of Radix's `asChild`. To render a Button as a link, use `render` with `nativeButton={false}` — children go inside the `render` element, and the Button self-closes:
  ```tsx
  <Button variant="outline" size="sm" nativeButton={false} render={<a href={url}>Link text</a>} />
  ```
- Accordion uses Base UI's array-based value API. When controlling a single-open accordion, wrap the string value in an array and unwrap in the change handler:
  ```tsx
  <Accordion value={openItem ? [openItem] : []} onValueChange={(value) => setOpenItem(value[value.length - 1] ?? "")} />
  ```
- Use `pnpm` exclusively (not npm/yarn); use `pnpx` instead of `npx`
- Use `.ts` by default; `.tsx` only when file contains JSX
- Typesafe routing via `@infrastructure/navigation`—never import from `next/navigation` directly in `apps/web` or `@features/*` (`apps/internal` and `apps/payload` are exempt)
- Forms: zod schemas + TanStack Form + shadcn Field components
- Max 500 lines per non-test source file
- All server actions, user-facing components, and procedures need JSDoc comments
- No `any` or `unknown`—use explicit, safely narrowed types

## Naming

- Components: `PascalCase` (one default export per file)
- Procedures: `camelCase` describing the operation (e.g., `createTeam.ts`, `fetchTeams.ts`) in `procedures/` folder
- Query options: `getThingQueryOptions` (in `queries/` folder)
- Mutation options: `getThingMutationOptions` (in `mutations/` folder)
- oRPC contracts: `{feature}Contract.ts` (in feature `src/contracts/` folder)
- oRPC routers: `{feature}ORPCRouter.ts` (in feature `src/routers/` folder)
- oRPC procedure names: `camelCase` (e.g., `teamReports`, `createTeam`, `updateBrand`)
- Feature flags: `useFeatureName` (in `flags/` folder)
- Constants: `UPPER_SNAKE_CASE`

## Documentation

- Internal docs (architecture, specs): `specs/` folder
- User-facing docs: `docs/` folder
- Prefer inline comments and JSDoc over separate files
- Use Context7 MCP for external library documentation

**Key specs** (see `specs/` for full list):
- `API_COST_TRACKING.md` - API cost monitoring patterns
- `BLOG.md` - Blog feature (Payload CMS integration)
- `CONVERSATION_METRICS_OPTIMIZATION.md` - Conversation metrics pipeline
- `ENVIRONMENT_VARIABLES.md` - Required environment variables
- `FEATURE_FLAGS.md` - Feature flag implementation patterns
- `OBSERVABILITY.md` - Logging and telemetry setup
- `ORPC_ARCHITECTURE.md` - oRPC design and patterns
- `PII_INVENTORY.md` - Personal data handling
- `PLAN_TEMPLATE.md` - Multi-agent plan template and rules
- `PRODUCTION_READINESS_CHECKLIST.md` - Pre-launch checklist
- `RLS_POLICIES.md` - Row-level security policy patterns
- `STAGING_ENVIRONMENT.md` - Staging environment workflow and commands
- `SUPABASE_DEVELOPMENT_GUIDE.md` - Local Supabase development
- `TIMEZONE-GUIDE.md` - UTC vs local timezone patterns

## Test-Driven Development

**This project follows TDD practices** (see constitution Principle VIII for full requirements).

**Test file locations:**
- Procedures: `src/procedures/__tests__/{procedureName}.test.ts`
- Components: `src/components/__tests__/{ComponentName}.test.tsx`
- Utilities: colocated as `{filename}.test.ts`

**Rules:**
- Run `pnpm test` before committing
- New procedures require tests—no exceptions

## Plan Mode (Multi-Agent)

Planning uses an **agent team** with three teammates:

| Teammate | Role | Focus |
|----------|------|-------|
| **ux-reviewer** | UX perspective | User flows, accessibility, loading states, empty states, consistency with existing UI patterns |
| **architect** | Technical architecture | System design, data flow, performance, security, integration with existing packages and patterns |
| **devils-advocate** | Challenge assumptions | Edge cases, failure modes, scalability concerns, simpler alternatives, things the other two missed |

Lead synthesizes findings into `.claude/plans/{feature-name}-plan.md`. Skip for bug fixes, single-file changes, or tasks with decided approach.

See `specs/PLAN_TEMPLATE.md` for the full template and rules.

## Feature Flags

Feature flags use `@vercel/flags` SDK. Define in `flags/useFeatureName.ts` with kebab-case key `use-feature-name`. See constitution (Principle XX) for full pattern.

## Timezone Handling

**Local Input, Local Display** - use local JS Date methods for UI, UTC methods for SQL-sourced date strings (avoids off-by-one errors). Display with `formatDate`/`formatDateTime` from `@infrastructure/utilities`. See constitution (Principle XXI) and `specs/TIMEZONE-GUIDE.md` for full patterns.

**Gotcha:** When generating date ranges for charts, use local date methods (`getFullYear`/`getMonth`/`getDate`) to match `formatDateForRpc` — using UTC methods causes off-by-one dates at timezone boundaries (e.g. Feb 8 23:59 local = Feb 9 UTC, producing a future date slot).
