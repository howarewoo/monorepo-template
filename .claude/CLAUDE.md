# CLAUDE.md

This file provides guidance to Claude Code when working with this monorepo template.

## Project Overview

See [eng-constitution.md](../eng-constitution.md) for foundational rules. The constitution is **binding** and supersedes other instructions.

## Prerequisites

- **pnpm 9.15.4** (enforced via `packageManager` in root `package.json`)
- **Node.js** (compatible with ES2022 target)

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start all apps (web:3000, api:3001)
pnpm build            # Build all packages/apps via Turborepo
pnpm test             # Run Vitest tests across all packages
pnpm test:e2e         # Run Playwright E2E tests
pnpm typecheck        # Type check all packages
pnpm lint             # Lint via Biome
pnpm lint:fix         # Auto-fix linting issues
pnpm format           # Format via Biome + sort package.json
pnpm reset            # Clear node_modules, .next, dist, .turbo caches

# Run a single package
pnpm --filter @repo/web dev
pnpm --filter @repo/api dev
pnpm --filter @infrastructure/navigation test
```

## Architecture

**Monorepo with three package types:**
- **Apps** (`apps/*`): Deployable applications
  - `apps/web` — Next.js 16 (App Router) + React Compiler + shadcn/ui + Tailwind CSS (port 3000)
  - `apps/mobile` — Expo SDK 54 + React Native 0.81 + UniWind + react-native-reusables
  - `apps/api` — Hono + oRPC API server (port 3001)
- **Features** (`packages/features/*`): Standalone business feature packages; can only import from infrastructure
- **Infrastructure** (`packages/infrastructure/*`): Shared utilities; can be used anywhere
  - `@infrastructure/api-client` — oRPC contracts, router, and typed client
  - `@infrastructure/navigation` — Platform-agnostic navigation (Link, useNavigation, NavigationProvider)
  - `@infrastructure/ui` — Shared design tokens, CSS utilities (`cn()`, `tokens`)
  - `@infrastructure/utils` — Cross-platform utility functions
  - `@infrastructure/typescript-config` — Shared TypeScript configs (base, library, nextjs, react-native)

## Key Patterns

### oRPC (Type-Safe API)

Contracts, router, and client live in `@infrastructure/api-client`. Apps consume via `createApiClient()` and `createOrpcUtils()`.

```typescript
// In app code
import { createApiClient, createOrpcUtils } from "@infrastructure/api-client";
const client = createApiClient("http://localhost:3001/api");
const orpc = createOrpcUtils(client);
const { data } = useQuery(orpc.users.list.queryOptions());
```

### Navigation

Feature packages must never import `next/navigation` or `expo-router` directly. Use `@infrastructure/navigation` instead:
- `<Link href="/path">` for declarative navigation
- `useNavigation()` for imperative (`navigate`, `replace`, `back`)
- Each app provides its adapter via `NavigationProvider` (see `apps/web/lib/navigation.tsx`, `apps/mobile/lib/navigation.tsx`)

### Cross-Platform UI

- **Web**: shadcn/ui components + Tailwind CSS
- **Mobile**: react-native-reusables + UniWind
- **Shared**: Design tokens and CSS utilities in `@infrastructure/ui`; both platforms consume the same theme
- **Tailwind v4**: CSS-first config — theme defined via `@theme` blocks in each app's CSS (no `tailwind.config.ts`); web uses `@tailwindcss/postcss`; mobile uses `uniwind/metro`

**Note**: Mobile web export is enabled — Expo SDK 54 ships with RN 0.81, satisfying UniWind's `react-native>=0.81.0` requirement. All three platforms (iOS, Android, web) are built via `expo export`.

**Gotcha**: Do not set `config.resolver.unstable_conditionNames` in `apps/mobile/metro.config.js` — it overrides Metro's platform-aware defaults and breaks UniWind's web resolver (causes `createOrderedCSSStyleSheet` resolution failures).

### Dependencies

Use pnpm catalog for shared dependency versions:
```yaml
# pnpm-workspace.yaml catalog:
react: "^19.2.0"
```
```json
// package.json
"dependencies": { "react": "catalog:" }
```

## Conventions

- **Biome**: 100-char line width, double quotes, semicolons, ES5 trailing commas
- **pnpm** exclusively (not npm/yarn); `pnpx` instead of `npx`
- `.ts` by default; `.tsx` only when file contains JSX
- Infrastructure packages use **named exports**; feature packages use **default exports**
- No `any` or `unknown` — use explicit, safely narrowed types
- Max 500 lines per non-test source file
- TDD methodology (see constitution Principle VIII)
- All user-facing components and procedures need JSDoc comments
- React Compiler is enabled in `apps/web`

## Testing

- **Framework**: Vitest (unit/integration), Playwright (E2E)
- **Test locations**: colocated as `{filename}.test.ts` or in `__tests__/` directories
- Run `pnpm test` before committing; new procedures require tests
