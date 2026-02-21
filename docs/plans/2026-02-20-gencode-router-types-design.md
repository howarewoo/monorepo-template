# Gencode Router Types Design

**Date**: 2026-02-20
**Status**: Approved

## Problem

Apps (`web`, `mobile`) depend on `apps/api` via `"api": "workspace:*"` solely to import `type { Router } from "api/router"`. This creates an app-to-app dependency that:

1. Violates architectural purity (apps should only depend on infrastructure/feature packages)
2. Adds unnecessary edges to the build graph
3. Doesn't scale to multiple API servers

## Solution

Generate a `.d.ts` file containing the `Router` type into `@infrastructure/api-client` using a gencode script. Provide pre-typed client exports so apps never reference `apps/api` directly.

## Design

### Generated Type File

**Location**: `packages/infrastructure/api-client/src/generated/router-types.d.ts`

Contains:
- `Router` — the full oRPC router type extracted from `apps/api/src/router.ts`
- `ApiClient` — `RouterClient<Router>` convenience type

The file is committed to git and re-generated on demand via `pnpm gencode`.

### Pre-typed Client Exports

`@infrastructure/api-client` gains two new exports in `src/typed-client.ts`:

- `createTypedApiClient(baseUrl)` — returns a pre-typed `RouterClient<Router>`
- `createTypedOrpcUtils(baseUrl)` — returns pre-typed TanStack Query utils

Existing generic exports (`createApiClient<T>`, `createOrpcUtils`) are kept for flexibility.

### App Migration

Before:
```typescript
import { createApiClient, createOrpcUtils } from "@infrastructure/api-client";
import type { Router } from "api/router";
const apiClient = createApiClient<Router>(API_URL);
const orpc = createOrpcUtils(apiClient);
```

After:
```typescript
import { createTypedApiClient, createTypedOrpcUtils } from "@infrastructure/api-client";
const apiClient = createTypedApiClient(API_URL);
const orpc = createTypedOrpcUtils(API_URL);
```

`"api": "workspace:*"` is removed from `apps/web` and `apps/mobile` dependencies.

### Gencode Script

**Location**: `apps/api/scripts/generate-router-types.ts`

- Uses TypeScript Compiler API (`ts.createProgram`) to load `apps/api/src/router.ts`
- Extracts the `Router` type export via the type checker
- Serializes to a standalone `.d.ts` with no path dependencies
- Writes to `packages/infrastructure/api-client/src/generated/router-types.d.ts`
- Executed via `tsx`: `"gencode": "tsx scripts/generate-router-types.ts"`

### Turbo Integration

`turbo.json` gains a `gencode` task:
```json
"gencode": {
  "dependsOn": [],
  "outputs": ["../packages/infrastructure/api-client/src/generated/**"]
}
```

### Documentation Updates

**eng-constitution.md**:
- Add rule: apps must never depend on other apps; type sharing flows through infrastructure via code generation
- Update Principle IX oRPC examples to use `createTypedApiClient` pattern

**CLAUDE.md**:
- Update oRPC section with new import pattern
- Add `pnpm gencode` to commands section
- Update architecture to note api-client provides pre-typed clients
- Remove references to `import type { Router } from "api/router"`

## Workflow

1. Developer changes a feature router or `apps/api/src/router.ts`
2. Runs `pnpm gencode`
3. Generated types update in `@infrastructure/api-client`
4. Commits both the router change and the generated types
