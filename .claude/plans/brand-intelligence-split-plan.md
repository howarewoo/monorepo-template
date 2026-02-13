# Brand Intelligence Contract/Router Split

## Overview

Split `brandIntelligenceContract.ts` (892 lines) and `brandIntelligenceORPCRouter.ts` (591 lines) into domain-specific modules to comply with the 500-line limit while maintaining backward compatibility.

## Module Structure

| Module | Procedures | Description |
|--------|------------|-------------|
| **team** | 8 | teamReports, teamTags, teamReportGroups, teamSourceLists, trackedBrands, teamActiveConversationsCount, brandGroups, allSourceListDomains |
| **report** | 12 | report, reportConversationsCount, reportConversations, reportDomains, reportBrands, reportModels, reportPersonas, reportTags, reportProducts, reportPrompts, reportProviders, createReport |
| **visibility** | 9 | visibilityMetrics, visibilityScores, visibilityScoresOverTime, visibilityShareOfVoice, visibilityFinalDecision, visibilityDecisionDrivers, visibilityConversations, platformVisibilityScores, platformVisibilityOverTime |
| **analytics** | 12 | citationSummary, citationDomains, citationDomainsOverTime, citationPages, citationPagesOverTime, sentimentMetrics, sentimentScoresOverTime, sentimentShareOfVoice, citationsFilterOptions, conversationsFilterOptions, domainsFilterOptions, promptsFilterOptions |
| **data** | 9 | teamCitations, teamConversations, teamDomains, teamPrompts, allReportConversations, conversationById, availableAIProviders, aiProvidersByIds, aiModelsByIds |
| **utility** | 9 | searchBrands, searchDomains, searchPromptTags, searchTeamPersonas, keywordSuggestions, promptVariations, sourceListWithDomains, userProfile, searchVolume |

## File Structure

```
packages/features/brand-intelligence/src/
├── contracts/
│   ├── __tests__/
│   │   └── brandIntelligenceContract.test.ts  # Contract composition tests
│   ├── brandIntelligenceContract.ts           # Composed contract (backward compat)
│   ├── teamContract.ts
│   ├── reportContract.ts
│   ├── visibilityContract.ts
│   ├── analyticsContract.ts
│   ├── dataContract.ts
│   ├── utilityContract.ts
│   └── shared/
│       └── inputSchemas.ts
├── routers/
│   ├── __tests__/
│   │   └── brandIntelligenceORPCRouter.test.ts  # Router composition tests
│   ├── brandIntelligenceORPCRouter.ts           # Composed router (backward compat)
│   ├── teamORPCRouter.ts
│   ├── reportORPCRouter.ts
│   ├── visibilityORPCRouter.ts
│   ├── analyticsORPCRouter.ts
│   ├── dataORPCRouter.ts
│   ├── utilityORPCRouter.ts
│   └── shared/
│       └── unwrapResult.ts
```

## Phases

### Phase 1: Write Tests for Contract/Router Composition
> PR: TBD

**Test Specifications:**
- `contracts/__tests__/brandIntelligenceContract.test.ts`
  - [ ] it("exports all 59 procedures from composed contract")
  - [ ] it("maintains backward-compatible type export BrandIntelligenceContract")
  - [ ] it("includes all team procedures: teamReports, teamTags, teamReportGroups, teamSourceLists, trackedBrands, teamActiveConversationsCount, brandGroups, allSourceListDomains")
  - [ ] it("includes all report procedures: report, reportConversationsCount, reportConversations, reportDomains, reportBrands, reportModels, reportPersonas, reportTags, reportProducts, reportPrompts, reportProviders, createReport")
  - [ ] it("includes all visibility procedures: visibilityMetrics, visibilityScores, visibilityScoresOverTime, visibilityShareOfVoice, visibilityFinalDecision, visibilityDecisionDrivers, visibilityConversations, platformVisibilityScores, platformVisibilityOverTime")
  - [ ] it("includes all analytics procedures: citationSummary, citationDomains, citationDomainsOverTime, citationPages, citationPagesOverTime, sentimentMetrics, sentimentScoresOverTime, sentimentShareOfVoice, citationsFilterOptions, conversationsFilterOptions, domainsFilterOptions, promptsFilterOptions")
  - [ ] it("includes all data procedures: teamCitations, teamConversations, teamDomains, teamPrompts, allReportConversations, conversationById, availableAIProviders, aiProvidersByIds, aiModelsByIds")
  - [ ] it("includes all utility procedures: searchBrands, searchDomains, searchPromptTags, searchTeamPersonas, keywordSuggestions, promptVariations, sourceListWithDomains, userProfile, searchVolume")

- `routers/__tests__/brandIntelligenceORPCRouter.test.ts`
  - [ ] it("exports all 59 router handlers from composed router")
  - [ ] it("maintains backward-compatible type export BrandIntelligenceORPCRouter")

- `routers/shared/__tests__/unwrapResult.test.ts`
  - [ ] it("returns data when result is successful")
  - [ ] it("throws ORPCError when result is unsuccessful")

**Implementation Checklist:**
- [ ] Write failing tests for contract composition
- [ ] Write failing tests for router composition
- [ ] Write failing tests for unwrapResult helper
- [ ] Verify tests fail (Red phase)

**Files:**
- `packages/features/brand-intelligence/src/contracts/__tests__/brandIntelligenceContract.test.ts`
- `packages/features/brand-intelligence/src/routers/__tests__/brandIntelligenceORPCRouter.test.ts`
- `packages/features/brand-intelligence/src/routers/shared/__tests__/unwrapResult.test.ts`

---

### Phase 2: Create Shared Modules
> Depends on: Phase 1

**Test Specifications:**
- Tests from Phase 1 for `unwrapResult` should now pass

**Implementation Checklist:**
- [ ] Create `contracts/shared/inputSchemas.ts` with all shared input schemas
- [ ] Create `routers/shared/unwrapResult.ts` with helper function
- [ ] Verify `unwrapResult.test.ts` passes (Green phase)
- [ ] Run `pnpm test:features`

**Files:**
- `packages/features/brand-intelligence/src/contracts/shared/inputSchemas.ts`
- `packages/features/brand-intelligence/src/routers/shared/unwrapResult.ts`

---

### Phase 3: Create Domain Contracts
> Depends on: Phase 2

**Test Specifications:**
- Tests from Phase 1 for contract composition should now pass

**Implementation Checklist:**
- [ ] Create `teamContract.ts` (8 procedures)
- [ ] Create `reportContract.ts` (12 procedures)
- [ ] Create `visibilityContract.ts` (9 procedures)
- [ ] Create `analyticsContract.ts` (12 procedures)
- [ ] Create `dataContract.ts` (9 procedures)
- [ ] Create `utilityContract.ts` (9 procedures)
- [ ] Update `brandIntelligenceContract.ts` to compose from domain contracts
- [ ] Verify `brandIntelligenceContract.test.ts` passes (Green phase)
- [ ] Run `pnpm test:features`

**Files:**
- `packages/features/brand-intelligence/src/contracts/teamContract.ts`
- `packages/features/brand-intelligence/src/contracts/reportContract.ts`
- `packages/features/brand-intelligence/src/contracts/visibilityContract.ts`
- `packages/features/brand-intelligence/src/contracts/analyticsContract.ts`
- `packages/features/brand-intelligence/src/contracts/dataContract.ts`
- `packages/features/brand-intelligence/src/contracts/utilityContract.ts`
- `packages/features/brand-intelligence/src/contracts/brandIntelligenceContract.ts` (refactor)

---

### Phase 4: Create Domain Routers
> Depends on: Phase 3

**Test Specifications:**
- Tests from Phase 1 for router composition should now pass

**Implementation Checklist:**
- [ ] Create `teamORPCRouter.ts` (8 handlers)
- [ ] Create `reportORPCRouter.ts` (12 handlers)
- [ ] Create `visibilityORPCRouter.ts` (9 handlers)
- [ ] Create `analyticsORPCRouter.ts` (12 handlers)
- [ ] Create `dataORPCRouter.ts` (9 handlers)
- [ ] Create `utilityORPCRouter.ts` (9 handlers)
- [ ] Update `brandIntelligenceORPCRouter.ts` to compose from domain routers
- [ ] Verify `brandIntelligenceORPCRouter.test.ts` passes (Green phase)
- [ ] Run `pnpm test:features`

**Files:**
- `packages/features/brand-intelligence/src/routers/teamORPCRouter.ts`
- `packages/features/brand-intelligence/src/routers/reportORPCRouter.ts`
- `packages/features/brand-intelligence/src/routers/visibilityORPCRouter.ts`
- `packages/features/brand-intelligence/src/routers/analyticsORPCRouter.ts`
- `packages/features/brand-intelligence/src/routers/dataORPCRouter.ts`
- `packages/features/brand-intelligence/src/routers/utilityORPCRouter.ts`
- `packages/features/brand-intelligence/src/routers/brandIntelligenceORPCRouter.ts` (refactor)

---

### Phase 5: Verification & Cleanup
> Depends on: Phase 4

**Implementation Checklist:**
- [ ] Verify all new files are under 500 lines
- [ ] Run `pnpm test:features` - all tests pass
- [ ] Run `pnpm build` - no type errors
- [ ] Verify app-level router (`apps/web/src/orpc/router.ts`) requires no changes
- [ ] Run `pnpm pre-commit`

## Composition Pattern

**Contract composition (brandIntelligenceContract.ts):**
```typescript
import { oc } from "@infrastructure/orpc/server";
import { teamContract } from "./teamContract";
import { reportContract } from "./reportContract";
import { visibilityContract } from "./visibilityContract";
import { analyticsContract } from "./analyticsContract";
import { dataContract } from "./dataContract";
import { utilityContract } from "./utilityContract";

export const brandIntelligenceContract = oc.router({
  ...teamContract,
  ...reportContract,
  ...visibilityContract,
  ...analyticsContract,
  ...dataContract,
  ...utilityContract,
});

export type BrandIntelligenceContract = typeof brandIntelligenceContract;
```

**Router composition (brandIntelligenceORPCRouter.ts):**
```typescript
import { implement, type ORPCContext } from "@infrastructure/orpc/server";
import { brandIntelligenceContract } from "../contracts/brandIntelligenceContract";
import { teamORPCRouter } from "./teamORPCRouter";
import { reportORPCRouter } from "./reportORPCRouter";
import { visibilityORPCRouter } from "./visibilityORPCRouter";
import { analyticsORPCRouter } from "./analyticsORPCRouter";
import { dataORPCRouter } from "./dataORPCRouter";
import { utilityORPCRouter } from "./utilityORPCRouter";

const os = implement(brandIntelligenceContract).$context<ORPCContext>();

export const brandIntelligenceORPCRouter = os.router({
  ...teamORPCRouter,
  ...reportORPCRouter,
  ...visibilityORPCRouter,
  ...analyticsORPCRouter,
  ...dataORPCRouter,
  ...utilityORPCRouter,
});

export type BrandIntelligenceORPCRouter = typeof brandIntelligenceORPCRouter;
```

## Backward Compatibility

- Import paths unchanged: `brandIntelligenceContract` and `brandIntelligenceORPCRouter` remain at same paths
- API shape unchanged: composed contract/router has same flat structure
- Type exports unchanged: `BrandIntelligenceContract` type works identically
- App router unchanged: no changes needed to `apps/web/src/orpc/router.ts`

## Open Questions

None - ready for implementation.
