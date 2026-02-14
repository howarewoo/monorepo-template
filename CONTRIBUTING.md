# Contributing

Thanks for your interest in contributing! This guide will get you up and running.

## Prerequisites

- **Node.js 22**
- **pnpm 9.15.4** — install with `corepack enable && corepack prepare`

## Setup

```bash
git clone https://github.com/howarewoo/monorepo-template.git
cd monorepo-template
pnpm install
pnpm dev
```

## Development workflow

1. Create a branch from `main`.
2. Make your changes following the [engineering constitution](eng-constitution.md).
3. Run checks before committing:

```bash
pnpm lint        # Biome lint + format check
pnpm test        # Vitest tests
pnpm typecheck   # TypeScript
```

4. Open a pull request against `main`.

## Project structure

| Directory | Purpose |
| --- | --- |
| `apps/*` | Deployable applications (web, landing, mobile, api) |
| `packages/features/*` | Standalone business features |
| `packages/infrastructure/*` | Shared utilities, UI, navigation, types |

Dependencies flow **one way**: apps -> features -> infrastructure. See the [README](README.md#architecture) for details.

## Code style

- **Biome** handles linting and formatting (100-char lines, double quotes, semicolons)
- **pnpm** exclusively — never npm or yarn
- `.ts` by default; `.tsx` only when the file contains JSX
- No `any` or `unknown` — use explicit, narrowed types
- Max 500 lines per non-test source file
- TDD: write tests before implementation

## Adding dependencies

All shared versions go through the pnpm catalog in `pnpm-workspace.yaml`:

```yaml
catalog:
  some-package: "^1.0.0"
```

Then reference with `"some-package": "catalog:"` in the relevant `package.json`.

## Adding UI components

```bash
# Web (shadcn/ui)
pnpx shadcn@latest add <component>   # run from apps/web/ or apps/landing/

# To share across web apps, move from apps/<app>/components/ui/ to
# packages/infrastructure/ui-web/src/components/ and re-export from the barrel index
```

## Questions?

Open an issue or check the [engineering constitution](eng-constitution.md) for architectural decisions.
