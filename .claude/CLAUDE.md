# CLAUDE.md

This file provides guidance to Claude Code when working with this monorepo template.

## Project Overview

See [eng-constitution.md](../eng-constitution.md) for foundational rules. The constitution is **binding** and supersedes other instructions.

## Prerequisites

- **pnpm 9.15.4** (enforced via `packageManager` in root `package.json`)
- **Node.js 22** (CI pins v22; compatible with ES2022 target)

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start all apps (web:3000, api:3001, landing:3002, mobile:8081)
pnpm build            # Build all packages/apps via Turborepo
pnpm test             # Run Vitest tests across all packages
pnpm test:changed     # Run tests for packages changed since last commit
pnpm test:e2e         # Run Playwright E2E tests
pnpm typecheck        # Type check all packages
pnpm lint             # Lint via Biome
pnpm lint:fix         # Auto-fix linting issues
pnpm format           # Format via Biome + sort package.json
pnpm pre-commit       # Install, format, and test changed files
pnpm reset            # Clear node_modules, .next, dist, .turbo caches
pnpm gencode          # Run code generation tasks via Turborepo

# Run a single package
pnpm --filter @repo/web dev
pnpm --filter @repo/api dev
pnpm --filter @infrastructure/navigation test

# Landing page
pnpm --filter @repo/landing dev

# Mobile platform targets
pnpm --filter @repo/mobile ios
pnpm --filter @repo/mobile android
pnpm --filter @repo/mobile web
```

## Architecture

**Monorepo with three package types:**
- **Apps** (`apps/*`): Deployable applications
  - `apps/web` — Next.js 16 (App Router) + React Compiler + shadcn/ui (Base UI) + Tailwind CSS (port 3000)
  - `apps/landing` — Next.js 16 marketing/landing page consuming shared UI components (port 3002)
  - `apps/mobile` — Expo SDK 54 + React Native 0.81 + UniWind + react-native-reusables
  - `apps/api` — Hono + oRPC API server (port 3001)
- **Features** (`packages/features/*`): Standalone business feature packages; can only import from infrastructure (currently empty — scaffold for new features)
- **Infrastructure** (`packages/infrastructure/*`): Shared utilities; can be used anywhere
  - `@infrastructure/api-client` — oRPC contracts, router, and typed client
  - `@infrastructure/navigation` — Platform-agnostic navigation (Link, useNavigation, NavigationProvider)
  - `@infrastructure/ui` — Shared design tokens, CSS utilities (`cn()`, `tokens`)
  - `@infrastructure/ui-web` — Shared shadcn/ui components (Button, Card, etc.) for web apps
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

- **Web**: shadcn/ui components (Base UI primitives, `base-vega` style) + Tailwind CSS
- **Mobile**: react-native-reusables + UniWind
- **Shared**: Design tokens and CSS utilities in `@infrastructure/ui`; both platforms consume the same theme
- **Tailwind v4**: CSS-first config (no `tailwind.config.ts`); web uses `@tailwindcss/postcss`; mobile uses `uniwind/metro`
- **Web CSS**: `apps/web/app/globals.css` imports from `@infrastructure/ui/globals.css` — single source of truth
- **Mobile CSS**: `apps/mobile/global.css` hardcodes theme tokens (UniWind on RN doesn't support CSS `var()` indirection in `@theme` blocks); light/dark colors use `@layer theme { :root { @variant light {} @variant dark {} } }` — both variants are required
- **Adding components**: `pnpx shadcn@latest add <component>` from `apps/web/` or `apps/landing/`; `components.json` configures style (`base-vega`), utils alias (`@infrastructure/ui`), and icon library (`lucide`). To share a component across web apps, move it from `apps/<app>/components/ui/` to `packages/infrastructure/ui-web/src/components/` and re-export from the barrel index

**Note**: Mobile web export is enabled — Expo SDK 54 ships with RN 0.81, satisfying UniWind's `react-native>=0.81.0` requirement.

**New web app checklist**: When creating a new Next.js app that consumes `@infrastructure/ui-web`: (1) add `"@infrastructure/ui-web": "workspace:*"` to dependencies, (2) add `"@infrastructure/ui-web"` to `transpilePackages` in `next.config.ts`, (3) add `@source "../node_modules/@infrastructure/ui-web/src";` in `app/globals.css`.

**Gotcha**: Tailwind v4 does not auto-scan `@infrastructure/ui-web` for class names. Each consuming web app must add `@source "../node_modules/@infrastructure/ui-web/src";` in its `app/globals.css` (path relative to the CSS file) to ensure component styles are compiled.

**Gotcha**: Do not set `config.resolver.unstable_conditionNames` in `apps/mobile/metro.config.js` — it overrides Metro's platform-aware defaults and breaks UniWind's web resolver (causes `createOrderedCSSStyleSheet` resolution failures).

**Gotcha**: Mobile theme tokens in `apps/mobile/global.css` are hardcoded HSL values that must stay in sync with `packages/infrastructure/ui/src/globals.css` `:root` / `.dark` blocks. When updating the shared theme, update both files. UniWind requires both `@variant light` and `@variant dark` inside `@layer theme` — putting color tokens only in `@theme` without a `@variant light` block causes always-dark rendering.

**Gotcha**: Do not use `space-y-*` or `space-x-*` in mobile components — they compile to CSS logical properties (`margin-block-start`/`margin-block-end`) which React Native does not support. Use `gap-*` on flex containers instead.

**Gotcha**: React Navigation's default `Stack` header does not use UniWind theme tokens. Use `headerShown: false` with a custom header component styled via UniWind classes and `useSafeAreaInsets()` for status bar spacing.

### Dependencies

Use pnpm catalog for shared dependency versions:
```yaml
# pnpm-workspace.yaml catalog:
react: "19.1.0"
```
```json
// package.json
"dependencies": { "react": "catalog:" }
```

**Gotcha**: React is pinned to exact `19.1.0` because React Native 0.81's bundled renderer (`react-native-renderer@19.1.0`) performs a strict equality check against the installed React version. Using `^19.2.0` causes a hard runtime crash on iOS.

**Gotcha**: `pnpm build` runs `pnpm self-update && turbo build` — this upgrades pnpm before building. If local builds behave differently from CI, check whether `pnpm --version` still matches the `packageManager` field in root `package.json`.

## Conventions

- **Biome**: 100-char line width, double quotes, semicolons, ES5 trailing commas
- **pnpm** exclusively (not npm/yarn); `pnpx` instead of `npx`
- **Graphite** (`gt`) for branch management — use `gt create`, `gt modify`, `gt submit` instead of raw git branch/commit/push
- `.ts` by default; `.tsx` only when file contains JSX
- Infrastructure packages use **named exports**; feature packages use **default exports**
- No `any` or `unknown` — use explicit, safely narrowed types
- Max 500 lines per non-test source file
- TDD methodology (see constitution Principle VIII)
- All user-facing components and procedures need JSDoc comments
- React Compiler is enabled in `apps/web` and `apps/landing`

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every PR:
1. `biome ci` — lint + format check
2. `pnpm test:changed` — tests for changed packages only

**Note**: CI does not run `typecheck` — run `pnpm typecheck` locally before pushing.

**Dependabot** (`.github/dependabot.yml`) runs weekly scans for npm and GitHub Actions updates.

**Community files**: Issue templates (bug report, feature request), PR template, and `CONTRIBUTING.md` guide new contributors.

## Testing

- **Framework**: Vitest (unit/integration), Playwright (E2E)
- **Test locations**: colocated as `{filename}.test.ts` or in `__tests__/` directories
- Run `pnpm test` before committing; new procedures require tests
