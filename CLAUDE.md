# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A monorepo template using Turborepo, pnpm, and TypeScript with:
- **Web**: Next.js 15 (App Router) + React + shadcn/ui + Tailwind CSS
- **Mobile**: Expo + React Native + NativeWind + react-native-reusables
- **API**: Hono + oRPC (type-safe end-to-end API)

## Commands

```bash
pnpm install    # Install dependencies
pnpm dev        # Start all apps in development mode
pnpm build      # Build all apps
pnpm lint       # Run Biome linting
pnpm lint:fix   # Auto-fix linting issues
pnpm format     # Format code with Biome
pnpm test       # Run Vitest tests
pnpm test:e2e   # Run Playwright E2E tests
pnpm typecheck  # Type check all packages
pnpm clean      # Remove node_modules, .next, dist, .turbo caches
```

## Repository Structure

```
monorepo-template/
├── apps/
│   ├── api/                    # Hono API server (port 3001)
│   ├── mobile/                 # Expo mobile app
│   └── web/                    # Next.js web app (port 3000)
├── packages/
│   ├── infrastructure/
│   │   ├── api-client/         # oRPC client and router definitions
│   │   ├── typescript-config/  # Shared TypeScript configs
│   │   ├── ui/                 # Shared UI utilities and Tailwind preset
│   │   └── utils/              # Cross-platform utilities
│   └── features/               # Feature packages (add here)
├── turbo.json                  # Turborepo pipeline config
├── pnpm-workspace.yaml         # Workspace definition with catalog
├── biome.json                  # Linting and formatting
└── tsconfig.json               # Root TypeScript config
```

## Key Patterns

### Adding Dependencies

Use pnpm catalog for shared dependency versions across the monorepo:
```yaml
# pnpm-workspace.yaml
catalog:
  react: "^19.0.0"
```
```json
// package.json
"dependencies": {
  "react": "catalog:"
}
```

### API

The API uses oRPC for type-safe end-to-end calls between the web/mobile apps and the Hono server. See `packages/infrastructure/api-client/` for the client setup.

### Shared UI

- Web uses shadcn/ui components with Tailwind CSS
- Mobile uses NativeWind with similar Tailwind-style class names
- Shared UI utilities live in `packages/infrastructure/ui/`

## Development

1. `pnpm install` to install dependencies
2. `pnpm dev` starts all apps (API on :3001, web on :3000)
3. Or start individually: `pnpm --filter api dev`, `pnpm --filter web dev`
