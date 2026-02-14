# monorepo-template

<!-- TODO: Replace with actual screenshot -->
<!-- ![monorepo-template screenshot](docs/screenshot.png) -->

> Ship web, mobile, and API from a single codebase. Type-safe from database to device, with shared packages that keep your team moving fast.

## Features

- **Shared by default** — Design tokens, navigation, UI components, and utilities in shared packages
- **Type-safe end to end** — oRPC contracts generate typed clients; errors caught at compile time
- **Cross-platform** — Next.js 16 web + Expo SDK 54 mobile + Hono API, one repo
- **Modern tooling** — React 19, React Compiler, Tailwind v4, Turborepo, Biome, pnpm
- **Production CI/CD** — GitHub Actions for linting, testing, and database migrations

## Tech Stack

| Layer | Technology | Role |
| --- | --- | --- |
| **Frontend (Web)** | Next.js 16, React 19, React Compiler | App Router with automatic memoization |
| **Frontend (Mobile)** | Expo SDK 54, React Native 0.81, Expo Router | iOS, Android, and mobile web with file-based routing |
| **API** | Hono, oRPC | Lightweight server with end-to-end typed RPC |
| **Styling** | Tailwind v4, shadcn/ui, UniWind | CSS-first config; shared design tokens across platforms |
| **Language** | TypeScript | Strict types everywhere, no `any` |
| **Monorepo** | Turborepo, pnpm | Cached builds, workspace dependency catalog |
| **Quality** | Biome, Vitest, Playwright | Lint + format, unit tests, E2E tests |

## Quick Start

```bash
git clone https://github.com/howarewoo/monorepo-template.git
cd monorepo-template
pnpm install
pnpm dev
```

| App | Port |
| --- | --- |
| Web | [localhost:3000](http://localhost:3000) |
| API | [localhost:3001](http://localhost:3001) |
| Landing | [localhost:3002](http://localhost:3002) |
| Mobile | [localhost:8081](http://localhost:8081) |

## Architecture

```
monorepo-template/
├── apps/
│   ├── web/           Next.js 16 — App Router, React Compiler, shadcn/ui
│   ├── landing/       Next.js 16 — Marketing page
│   ├── mobile/        Expo SDK 54 — iOS, Android, Web
│   └── api/           Hono + oRPC — Type-safe API server
├── packages/
│   ├── features/      Business logic (scaffold)
│   └── infrastructure/
│       ├── api-client        oRPC contracts, router, typed client
│       ├── navigation        Platform-agnostic Link + useNavigation
│       ├── ui                Design tokens, cn(), theme CSS
│       ├── ui-web            Shared shadcn/ui components
│       ├── utils             Cross-platform helpers
│       └── typescript-config Shared tsconfig presets
```

Three-tier dependency flow:

- **Infrastructure** — shared utilities, used by everything
- **Features** — standalone business logic, imports only infrastructure
- **Apps** — compose infrastructure + features into deployable units

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start all apps in development |
| `pnpm build` | Build all packages via Turborepo |
| `pnpm test` | Run Vitest tests |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm typecheck` | Type check all packages |
| `pnpm lint` | Lint with Biome |
| `pnpm format` | Format with Biome |

## Key Patterns

**Type-safe API** — define a contract, get a typed client everywhere:

```typescript
// Define once
const contract = oc.router({
  users: { list: oc.route({ method: "GET" }).output(z.array(UserSchema)) },
});

// Use anywhere
const { data } = useQuery(orpc.users.list.queryOptions());
```

**Cross-platform navigation** — works on web (Next.js) and mobile (Expo) identically:

```typescript
import { Link, useNavigation } from "@infrastructure/navigation";
```

**Shared components** — shadcn/ui components shared across web apps:

```typescript
import { Button, Card } from "@infrastructure/ui-web";
```

**Dependency catalog** — single source of truth for shared versions:

```yaml
# pnpm-workspace.yaml
catalog:
  react: "19.1.0"
  next: "16.0.0"
```

## Contributing

See [eng-constitution.md](eng-constitution.md) for project conventions and principles.

## License

[MIT](LICENSE)
