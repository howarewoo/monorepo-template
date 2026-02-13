<!--
Sync Impact Report - Version 1.36.0

Version Change: 1.35.0 → 1.36.0 (UTC Data Transformation Exception)
Principles Modified:
  - XXI: Timezone Handling - added Required Pattern #3 (Server-Side Data Transformation) for UTC methods on SQL-sourced dates; renumbered existing patterns #3→#4 and #4→#5
  - IX: Server Actions Architecture - marked as DEPRECATED
  - XII: TanStack Query Data Fetching - removed server action queryFn option, oRPC only
  - XII-A: TanStack Mutation Data Modification - updated to use oRPC mutation procedures
  - XIII: Feature Exposure Patterns - removed "Handler" pattern reference
  - XVIII: oRPC API Procedures - expanded scope to ALL operations (queries + mutations)
  - XVIII-A: oRPC Mutation Procedures - NEW principle for mutation patterns
  - XIX: API Endpoint Stability - extended stability requirements to mutations
Templates Requiring Updates: N/A
Follow-up TODOs: Migrate existing server actions to oRPC procedures

Bump Rationale: MINOR version bump - deprecates server actions in favor of oRPC as the unified mechanism for all server communication.
-->

# TrioSens Project Constitution

## Core Principles

### I. Monorepo Structure
Three package types with strict import boundaries: Infrastructure (can be used anywhere), Features (only in apps), Apps (compose infrastructure and features); Follow pnpm for package management; Maintain clear separation of concerns.

### II. Feature-Based Architecture
Every feature is implemented as a standalone package with clear boundaries; Features can only import from infrastructure packages; Clear separation between features, infrastructure, and apps ensures maintainability and scalability.

### III. Feature Package Naming and Code Style Conventions
All code in feature packages must follow standardized naming conventions and directory structure (excluding infrastructure packages and apps); Components must use PascalCase (UpperCamelCase) with one default export per file; Helper functions must use camelCase; Custom hooks must use camelCase with "use" prefix (e.g., `useHookName`); Constants must use UPPER_SNAKE_CASE; TypeScript types and interfaces must use PascalCase; Schemas must use PascalCase; Query options files must use "get" prefix with "QueryOptions" suffix (e.g., `getReportQueryOptions`); Mutation options files must use "get" prefix with "MutationOptions" suffix (e.g., `getAddTrackedBrandMutationOptions`); Procedure files must use camelCase names describing the operation (e.g., `createTeam`, `updateReport`) and be located in the `procedures` folder; Feature flags must use camelCase with "use" prefix and be located in the `flags` folder (e.g., `usePrecomputedMetrics`); File organization must use dedicated folders: `procedures/`, `queries/`, `mutations/`, `contracts/`, `routers/`, `flags/`, `components/`, `surfaces/`, `schemas/`, and `layouts/`; The `actions/` folder is **DEPRECATED** and retained only for migration—new business logic must use `procedures/`; Use `.ts` file extension by default and only use `.tsx` when the file contains JSX; Prioritize using default exports over named exports for feature packages (infrastructure packages should use named exports for better discoverability and tree-shaking); Consistent naming, code organization, and file structure across all feature packages ensures maintainability, readability, and scalability.

### IV. Infrastructure Package Priority
Infrastructure packages provide shared utilities, UI components, and cross-cutting concerns; Prioritize using components from @infrastructure/shadcn and @infrastructure/navigation; Supabase client functions from @infrastructure/supabase take precedence.

### V. pnpm Catalog Protocol
All dependencies must be managed through pnpm catalog to prevent version conflicts; Catalog definitions in pnpm-workspace.yaml ensure consistent dependency versions across the monorepo; No direct dependency declarations in individual package.json files.

### VI. TypeScript Standardization
All packages must use standardized TypeScript configuration from @infrastructure/typescript-config; Database types from @infrastructure/supabase/src/generated/database.types.ts; Consistent typing, path mapping, and compiler options across all packages; Do not use `any` or `unknown`—prefer explicit, safely narrowed types, generics, and schema-driven types instead; Introduce shared helper types when needed to avoid unsafe fallbacks.

### VII. Typesafe Routing
All routing must use centralized typesafe route definitions from @infrastructure/navigation package; Direct use of `next/navigation` (useRouter, redirect) and `next/link` is prohibited—use @infrastructure/navigation equivalents (useTypedRouter, redirect, Link) instead; Route parameters must be properly typed using ExtractParams utility; Navigation functions must use typesafe route definitions and parameter extraction; Dynamic routes must implement proper type guards and route utilities; Route definitions must include comprehensive TypeScript types for both static and dynamic segments.

### VIII. Test-Driven Development
All features must be developed using test-driven development (TDD) methodology following the Red-Green-Refactor cycle.

**Tests-First Requirement:**
Tests MUST be written before any implementation code. This is non-negotiable. The workflow is:
1. **Red**: Write a failing test that defines the expected behavior
2. **Green**: Write the minimum implementation code to make the test pass
3. **Refactor**: Improve the code while keeping tests green

**Clarification Before Implementation:**
When test case requirements are unclear or ambiguous, clarifying questions MUST be asked before writing tests. Do not assume or guess requirements. Questions should cover:
- Expected inputs and outputs for each scenario
- Edge cases and boundary conditions
- Error handling expectations
- Integration points with other components

**Test Coverage Requirements:**
- All user scenarios must have corresponding tests
- All edge cases and boundary conditions must be tested
- All error conditions must have explicit test coverage
- Both success and failure scenarios must be tested
- All server actions must have comprehensive unit tests verifying business logic, error handling, and edge cases

**Testing Framework:**
All tests must use Vitest; Test files must use ".test" or ".spec" suffixes and be colocated with the code they test; Vitest configuration in package.json or vitest.config.ts; Test discovery via Vitest's default or explicit configuration.

**Completion Criteria:**
A feature is NOT considered complete until all tests pass. Implementation without passing tests is incomplete work.

**Exemptions**: `/packages/infrastructure/shadcn` (UI component library without business logic; functionality validated through upstream library testing and visual inspection in consuming applications)

### IX. Server Actions Architecture ⚠️ DEPRECATED

> **DEPRECATED (Amendment 1.35.0):** Server actions are deprecated in favor of oRPC procedures. All new business logic (both queries and mutations) must use oRPC. See Principle XVIII for the unified oRPC approach. Existing server actions continue to work during the migration period.

A "server action" is defined as a function with the "use server" directive at the top of the file; Server actions must be within the `actions` folder (deprecated); File names and function names must be prefixed with "action"; Each action file exports only one function; Server actions must return the standardized `ServerActionResult<T>` type from `@packages/infrastructure/types/src/ServerActionResult.ts`.

**Migration Path:** Existing server actions can be called from oRPC procedure handlers during migration. New features must implement business logic directly in `procedures/` folder functions that throw `ORPCError` instead of returning `ServerActionResult`.

### X. Shadcn UI Components Priority
All UI components must prioritize usage of @infrastructure/shadcn package; Shadcn components are mandatory for common UI patterns (buttons, forms, dialogs, navigation); Custom components are only permitted when shadcn lacks specific functionality or when required for unique business logic not covered by existing shadcn components; Consistent design system and accessibility standards maintained through shadcn component library.

### XI. Form Validation and UI
All forms must use zod for schema validation, TanStack Form for form state management, and shadcn for UI components; Form validation schemas must be contained in dedicated files within the "schemas" folder for reusability across multiple forms or validation needs; Form validation schemas must be defined using zod schemas with proper type safety; Form state must be managed using the `useForm` hook from `@tanstack/react-form` with zod validators; Form fields must use the `form.Field` component with shadcn Field components (`<Field />`, `<FieldLabel />`, `<FieldDescription />`, `<FieldError />`); Accessibility must be ensured by adding `data-invalid` to `<Field />` components based on `field.state.meta.isTouched && !field.state.meta.isValid` and `aria-invalid` to form controls (`<Input />`, `<SelectTrigger />`, `<Checkbox />`, `<Switch />`, etc.); Error display must use `<FieldError errors={field.state.meta.errors} />` conditionally rendered when the field is invalid; Dynamic array fields must use `mode="array"` on the parent `form.Field` with `field.pushValue()` and `field.removeValue()` methods; Form submission must prevent default and call `form.handleSubmit()`; Form reset functionality must use `form.reset()` method; Consistent form patterns, accessibility, and error handling maintained through standardized TanStack Form and shadcn integration.

### XII. TanStack Query Data Fetching
All data fetching must use TanStack Query (React Query); Query options must be created in dedicated files within the "queries" folder; Each query file must export functions for getting query keys and query options; Components must use useQuery hook with the query options function; Query option overrides must be done using the spread operator on the query options function within components.
Client components must never use `useEffect` to load data; all client-side data fetching and revalidation must go through TanStack Query hooks (e.g., useQuery, useInfiniteQuery).

**Query Function Implementation (Amendment 1.35.0):** All query options must use oRPC procedures via the `useORPC()` hook. The oRPC client provides `queryOptions()` methods that integrate directly with TanStack Query. This ensures CDN edge caching, OpenAPI documentation, URL stability for debugging, and consistent error handling via `ORPCError`.

### XII-A. TanStack Mutation Data Modification
All data modification operations must use TanStack Query mutations with oRPC; Components must use useMutation hook with oRPC mutation procedures via the `useORPC()` hook; The oRPC client provides `mutationOptions()` methods that integrate directly with TanStack Query; Mutation options (onSuccess, onError, onSettled) can be passed directly to the useMutation hook call; Error handling uses `ORPCError` with standard codes (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`, `CONFLICT`, `INTERNAL_SERVER_ERROR`); Data modifications include any server calls that create, update, or delete data. See Principle XVIII-A for mutation procedure patterns.

### XIII. Feature Exposure Patterns
Features must expose their public API through strictly defined patterns; Feature UI components accessed through "Surface" components in the "surfaces" folder with "Surface" suffix; Feature API logic exposed through oRPC contracts in the "contracts" folder (e.g., `teamsContract.ts`); Feature Layout UI accessed through components in the "layouts" folder with "Layout" suffix; No other files or folders from the feature package may be imported or accessed by consuming applications.

**Exemptions**: `/packages/infrastructure/**` (Infrastructure packages are designed to be consumed directly; exports are intentionally public and reusable across all packages)

### XIV. DataTable Component Priority
All data tables must prioritize the datatable component from @infrastructure/shadcn, which provides a standardized abstraction over TanStack Table; The datatable component handles common table patterns, sorting, filtering, and pagination with consistent UI; Direct TanStack Table implementation is only permitted when the datatable component abstraction is insufficient for complex requirements or unique business logic; When using TanStack Table directly, implementations must follow TanStack Table patterns with proper TypeScript typing and use shadcn table UI primitives; Consistent table behavior, accessibility, and styling maintained through standardized datatable component or TanStack Table with shadcn implementation.

### XV. Next.js Server Components
All pages in Next.js applications must be implemented as server components; Server components must handle all initial rendering and data fetching; Client components are only permitted for interactive elements that require browser APIs or event handlers; Server components ensure better performance, SEO, and security by keeping sensitive logic on the server.

### XVI. Authentication Verification

**For Page and Layout Components:**
Authentication must be verified before rendering every page; Server-side authentication checks must occur in page components or layout components; Unauthenticated users must be redirected to login or appropriate access denied pages; Authentication state must be validated on each page load to ensure security and proper access control.

**For Server Actions:**
Server actions that query Supabase tables with Row Level Security (RLS) policies enabled do NOT require explicit `getUser()` or authorization checks. RLS is authored and enforced by Postgres, and the Supabase session automatically restricts queries to the authenticated user's data as defined by RLS policies. Server actions may call `getUser()` only if they need to access user metadata for business logic (e.g., user ID for audit logging), but this is optional when RLS policies sufficiently protect the data. Avoid redundant authentication checks in server actions when querying RLS-protected tables, as this adds performance overhead without security benefit—rely on Supabase's server-side session and RLS enforcement instead.

**Key Distinction:** Page/layout components need explicit auth redirects for UX. Server actions need only RLS policies for data protection.

### XVII. Database Logic Centralization
All database logic and configuration must be contained within the @infrastructure/supabase package; Database queries, mutations, schema definitions, and client configurations must use the centralized supabase infrastructure package; No direct database access or configuration in feature packages or applications; JSON database columns must be validated with zod schemas at runtime when reading from or writing to the database to ensure type safety—the generated database types use `Json` which provides no structural guarantees, so zod parsing is required to safely narrow JSON data to expected shapes; Consistent database patterns, type safety, and connection management ensured through centralized infrastructure.

### XVIII. oRPC API Procedures (Amendment 1.35.0)
oRPC is the **unified mechanism for ALL server communication** (both queries and mutations), providing HTTP-based benefits including native OpenAPI 3.1 generation, interactive Scalar UI documentation, CDN caching for reads, and consistent error handling.

**Scope (Amendment 1.35.0):** oRPC procedures handle ALL operations—both read operations (queries) and write operations (mutations). Server actions are deprecated (see Principle IX). Business logic lives in the `procedures/` folder and is called by oRPC router handlers.

**Benefits of Unified oRPC:**
- CDN edge caching for GET requests (public or team-scoped data)
- OpenAPI documentation for all API endpoints (queries and mutations)
- URL-addressable endpoints for debugging and monitoring
- Consistent error handling via `ORPCError` across all operations
- Single mental model for all server communication

**Contract-First Development Pattern:**
oRPC uses a contract-first approach where API contracts (inputs, outputs) are defined separately from implementations:
1. Define contracts in `src/contracts/{feature}Contract.ts` using `oc.router()`
2. Implement business logic in `src/procedures/` folder functions
3. Wire contracts to procedures in `src/routers/{feature}ORPCRouter.ts` using `implement(contract)`
4. TypeScript enforces handler signatures match contract definitions

**Infrastructure Location:**
- oRPC base procedures: `@infrastructure/orpc/src/server/` (protectedProcedure, ORPCError exports)
- Feature contracts: `@features/*/src/contracts/` (e.g., `teamsContract.ts`)
- Feature procedures: `@features/*/src/procedures/` (e.g., `createTeam.ts`, `fetchTeams.ts`)
- Feature routers: `@features/*/src/routers/` (e.g., `teamsORPCRouter.ts`)
- Router composition: `apps/*/src/orpc/router.ts` (combines feature routers into appRouter)
- oRPC client configuration: `@infrastructure/orpc/src/client/`
- App Router handler: `apps/*/src/app/api/rpc/[...procedures]/route.ts`
- OpenAPI spec: `apps/*/src/app/api/openapi.json/route.ts`
- Scalar UI docs: `apps/*/src/app/api/docs/page.tsx`

**Naming Conventions:**
- Contract files: `{feature}Contract.ts` (e.g., `teamsContract.ts`, `brandIntelligenceContract.ts`)
- Procedure files: `camelCase` describing the operation (e.g., `createTeam.ts`, `fetchTeams.ts`, `updateReport.ts`)
- Router files: `{feature}ORPCRouter.ts` (e.g., `teamsORPCRouter.ts`, `brandIntelligenceORPCRouter.ts`)
- Procedure names in contracts: `camelCase` descriptive names (e.g., `teamReports`, `createTeam`, `updateBrand`)

### XVIII-A. oRPC Mutation Procedures (Amendment 1.35.0)
Mutation procedures follow specific patterns for consistency and proper error handling.

**Mutation Contract Pattern:**
```typescript
// src/contracts/teamsContract.ts
export const teamsContract = oc.router({
  create: oc
    .route({ method: "POST", path: "/teams", summary: "Create team", tags: ["Teams"] })
    .input(CreateTeamSchema)
    .output(TeamSchema),

  update: oc
    .route({ method: "PUT", path: "/teams/{teamId}", summary: "Update team", tags: ["Teams"] })
    .input(z.object({ teamId: z.string().uuid(), data: UpdateTeamSchema }))
    .output(TeamSchema),

  delete: oc
    .route({ method: "DELETE", path: "/teams/{teamId}", summary: "Delete team", tags: ["Teams"] })
    .input(z.object({ teamId: z.string().uuid() }))
    .output(z.object({ success: z.literal(true) })),
});
```

**Procedure Implementation Pattern:**
```typescript
// src/procedures/createTeam.ts
import { ORPCError } from "@infrastructure/orpc/server";
import type { CreateTeamInput, Team } from "../schemas/teamSchemas";

export async function createTeam(input: CreateTeamInput, supabase: SupabaseClient): Promise<Team> {
  const { data, error } = await supabase
    .from("teams")
    .insert(input)
    .select()
    .single();

  if (error) {
    throw new ORPCError("BAD_REQUEST", { message: error.message });
  }

  return data;
}
```

**Router Wiring Pattern:**
```typescript
// src/routers/teamsORPCRouter.ts
const createProcedure = os.create
  .use(authed)
  .handler(({ input, context }) => createTeam(input, context.supabase));
```

**Error Handling:**
Procedures must throw `ORPCError` with standard codes instead of returning `ServerActionResult`:
- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - User lacks permission for this action
- `NOT_FOUND` - Requested resource does not exist
- `BAD_REQUEST` - Invalid input or business rule violation
- `CONFLICT` - Resource state conflict (e.g., duplicate)
- `INTERNAL_SERVER_ERROR` - Unexpected server error

### XIX. API Endpoint Stability (Amendment 1.35.0)
All HTTP API endpoints (including oRPC procedures for both queries and mutations) must maintain backward compatibility within a major version.

**Stability Requirements:**
- Endpoint URLs must not change once deployed to production
- Input schemas may add optional fields but must not remove or rename existing fields
- Output schemas may add fields but must not remove or change the type of existing fields
- Error codes must remain consistent; new codes may be added but existing codes must retain their meaning
- Mutation side effects must remain consistent; do not change what resources are modified without versioning
- Breaking changes require versioned endpoints or major version bump

### XX. Feature Flags Architecture (Amendment 1.32.0)
All feature flags must use the `@vercel/flags` SDK with standardized patterns for organization, naming, and evaluation.

**Organization:**
- Each flag must reside in its own file within the `flags/` folder of the relevant feature package
- Flags must be exported via a barrel export (`flags/index.ts`)
- Feature packages must add `"./flags": "./src/flags/index.ts"` to package.json exports

**Naming Conventions:**
- Flag export names: camelCase with "use" prefix (e.g., `usePrecomputedVisibilityMetrics`)
- Flag keys: kebab-case (e.g., `use-precomputed-visibility-metrics`)

**Flag Definition Pattern:**
```typescript
import { flag } from "@vercel/flags/next";

export const useFeatureName = flag<boolean>({
  key: "use-feature-name",
  description: "Description of the flag's purpose",
  defaultValue: false,
  options: [
    { value: false, label: "Off" },
    { value: true, label: "On" },
  ],
  decide() {
    return false;
  },
});
```

**Usage Context:**
- Server-side (query functions, oRPC handlers): Use async flag evaluation (`await useFeatureName()`)

**When to Use Feature Flags:**
- Gradual rollout of new features or optimizations
- A/B testing different implementations
- Quick rollback capability without code deployment
- Environment-specific behavior (preview vs production)

### XXI. Timezone Handling (Amendment 1.36.0)
All date and time handling must follow the "Local Input, Local Display" principle: dates are processed in the user's local timezone throughout the application.

**Core Rule:** When a user selects "Jan 15" in their local timezone, they must see data for their local Jan 15.

**Required Patterns:**

1. **Date Range Selection:** Use `setHours(0, 0, 0, 0)` and `setHours(23, 59, 59, 999)` to set local day boundaries when user selects dates.

2. **Date Iteration/Generation (UI):** Use local methods (`getFullYear()`, `getMonth()`, `getDate()`, `setDate()`) when iterating over dates from user input (e.g., calendar pickers, preset ranges).

3. **Server-Side Data Transformation:** When processing date strings originating from SQL (e.g., `YYYY-MM-DD` from `conversation_date`), use UTC methods (`getUTCFullYear()`, `getUTCDate()`, `getUTCDay()`, `setUTCDate()`). SQL dates are UTC-based, and local methods cause off-by-one errors for users behind UTC. This applies to chart data aggregation, gap-filling, and weekly/monthly grouping.

4. **Display Formatting:** Use `formatDate()`, `formatDateTime()` from `@infrastructure/utilities` for user display (these use local timezone).

5. **Server Communication:** Use `toISOString()` or `extractUTCDateString()` only when sending dates to the server.

**Reference:** See `specs/TIMEZONE-GUIDE.md` for complete implementation patterns and examples.

## Development Workflow

### Package Management
Use pnpm workspaces for all package operations (install, add, remove, run); Dependencies must use pnpm catalog protocol defined in pnpm-workspace.yaml; No direct dependency declarations in individual package.json files to prevent conflicts.

### Code Quality
Biome configuration for linting and formatting through shared infrastructure packages; Consistent code style, import organization, and formatting rules across all packages; Automated checks in CI/CD pipeline replace ESLint and Prettier; Individual non-test source files must be 500 lines or fewer; Test files are exempt from this limit: files with `.test.ts`, `.test.tsx`, `.spec.ts`, `.spec.tsx` suffixes, and any files within `__tests__/` directories;
Components in `/packages/infrastructure/shadcn` are exempt from the file length limit due to the nature of UI component libraries.
All server actions and user-facing components must include concise JSDoc comments that describe their purpose, inputs, and outputs to keep intent clear across the monorepo.
Avoid magic numbers and unexplained literals—extract numeric values, string literals, and configuration values to named constants with descriptive names that convey intent (e.g., `const MAX_RETRY_ATTEMPTS = 3` instead of using `3` directly).

### Documentation Organization
The `specs/` directory contains internal documentation for developers, including code pointers, system architecture diagrams, and technical specifications; The `docs/` directory contains user-facing documentation about product features and usage guides only—no internal or sensitive documentation should be placed in `docs/`; Internal documentation should prioritize inline comments and JSDoc over separate document files.

## Governance

This constitution establishes the foundational principles for TrioSens project development. All contributors must verify compliance with these principles in pull requests and code reviews. Complexity introduced must be justified against these core principles.

**Version**: 1.36.0 | **Ratified**: 2025-10-12 | **Last Amended**: 2026-02-07
