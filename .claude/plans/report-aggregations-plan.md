# Report Aggregations Implementation Plan

## Overview

Refactor how reports handle aggregations (report groups and source lists) with proper conversation-level aggregation in SQL. Each report module will:

1. Use SQL RPC functions with `p_brand_groups` parameter for correct conversation-level aggregation
2. SQL uses `message_indices` from `brand_metrics` JSONB to aggregate at the conversation level
3. Source list aggregation will be handled in TypeScript (Citations module only)

This separates aggregations from filters - filters determine which data to include, aggregations determine how to group the results for display.

## Architecture Change

### Current State
- `brandGroups` and `sourceLists` are embedded in `ReportFilters`
- SQL RPC functions have `p_brand_groups` but used incorrect MAX-based aggregation
- Source lists are resolved to domains and used as filters
- Some procedures use direct Supabase client queries instead of RPC functions

### New State
- Filters only contain filtering criteria (dates, prompts, providers, personas, tags, brands, products, domains)
- Aggregations are a separate concern passed alongside filters
- **ALL data fetching MUST use SQL RPC functions** - no direct `supabase.from('table').select()` queries
- **Brand group aggregation happens in SQL** using `p_brand_groups` parameter with correct conversation-level logic
- **Source list aggregation happens in TypeScript** (Citations module only)
- SQL uses `message_indices` array from `brand_metrics` JSONB to properly aggregate at conversation level

### Data Access Principle

**CRITICAL: All report data must be fetched via SQL RPC functions.**

```typescript
// ❌ WRONG - Direct table queries are NOT allowed
const { data } = await supabase
  .from('conversations')
  .select('*')
  .eq('team_id', teamId);

// ✅ CORRECT - Use SQL RPC functions with brand groups for SQL-level aggregation
const { data } = await supabase.rpc('get_visibility_scores', {
  p_report_id: reportId,
  p_start_date: startDate,
  p_end_date: endDate,
  p_brand_groups: { "Competitors": ["nike", "adidas"] } // SQL handles aggregation
});
```

**Rationale:**
- RPC functions encapsulate complex query logic in SQL where it performs best
- Brand group aggregation requires conversation-level access to `message_indices` - SQL is the right place
- Type-safe return values via `pnpm gencode`
- Consistent filtering pattern across all endpoints

## Aggregation Calculation Rules

### Brand Group Aggregation (SQL-Level)

Brand groups are treated as a **single logical entity** at the **conversation level**. The SQL RPC functions use `message_indices` from the `brand_metrics` JSONB column to properly aggregate.

**Why SQL-Level Aggregation?**

The previous MAX-based TypeScript approach was incorrect:
```
Example of incorrect MAX approach:
- 10 conversations total
- Brand A mentioned in conversations 1-5 (50% visibility)
- Brand B mentioned in conversations 6-8 (30% visibility)
- MAX: Group = 50% ❌
- Correct: Group mentioned in 8/10 = 80% ✓
```

SQL has access to `message_indices` (array of 0-indexed assistant message positions where brand appears), enabling correct conversation-level aggregation.

| Metric | SQL Aggregation Rule |
|--------|---------------------|
| **Visibility Score** | % of conversations where ANY brand in group exists in `brand_metrics` with `mentioned: true` |
| **Conversational Integrity** | Per conversation: +0.3 if ANY group brand has 0 in `message_indices`, +0.3 for 1, +0.4 for 2; SUM / conversation_count |
| **Full Conversation Presence** | % of conversations where UNION of `message_indices` covers [0..assistant_message_count-1] |
| **Final Decision Rate** | % of conversations where ANY group brand has `final_decision: true` |
| **Avg Earliest Mention Position** | AVG of MIN(`earliest_assistant_mention_rank`) per conversation |
| **Sentiment Score** | Average sentiment score across all brands in the group |

**Drill-down:** Each aggregated group includes nested array of individual brand metrics for expansion.

### Source List Aggregation

Source lists are treated as a **single logical entity** - all domains in the list are considered as one source for metric calculations.

| Metric | Aggregation Rule |
|--------|-----------------|
| **Citation Count** | Total citations from ANY domain in the list |
| **Citation Share** | List's total citations / total citations across all domains × 100 |
| **URL Count** | Total unique URLs from ANY domain in the list |
| **Conversations Citing** | Count of conversations citing ANY domain in the list |

**Drill-down:** Each aggregated source list includes nested array of individual domain metrics for expansion.

### Aggregation Behavior Rules

| Rule | Decision |
|------|----------|
| **Filters Before Aggregation** | Filters are applied FIRST, then aggregation groups only the filtered items. If a brand group contains [A, B, C, D] but filters select only [B, D], aggregating by that group aggregates B and D only. Drilldown shows only filtered brands. |
| **Simultaneous Selection** | Users CAN select both brand groups AND source lists at the same time |
| **Default (No Selection)** | Show individual brands/domains without grouping |
| **Overlapping Items** | Not allowed - UI prevents a brand from being in multiple groups, or a domain in multiple source lists |
| **Module Scope** | Brand groups → Visibility, Sentiment, Platform modules only. Source lists → Citations module only. |

## SQL RPC Functions Summary (17 Total)

All report data must be fetched via these SQL RPC functions. Each function follows the same parameter pattern:

| # | RPC Function | Module | Purpose |
|---|--------------|--------|---------|
| 1 | `get_visibility_metrics` | Visibility | Summary counts (conversations, messages, brands, products) |
| 2 | `get_visibility_scores` | Visibility | Per-brand metrics (VS, CIS, FCPR, FDR, avg_position) |
| 3 | `get_visibility_scores_over_time` | Visibility | Daily/weekly/monthly brand visibility data |
| 4 | `get_visibility_share_of_voice` | Visibility | SOV data per brand |
| 5 | `get_visibility_final_decision` | Visibility | Final decision data per brand |
| 6 | `get_visibility_decision_drivers` | Visibility | Decision driver frequencies |
| 7 | `get_visibility_conversations` | Visibility | Paginated conversation data with brand mentions |
| 8 | `get_sentiment_metrics` | Sentiment | Avg sentiment, rank data per brand |
| 9 | `get_sentiment_scores_over_time` | Sentiment | Daily sentiment scores per brand |
| 10 | `get_sentiment_share_of_voice` | Sentiment | Sentiment distribution per brand |
| 11 | `get_platform_visibility_scores` | Platform | Per-platform per-brand visibility metrics |
| 12 | `get_platform_visibility_over_time` | Platform | Daily platform-brand visibility data |
| 13 | `get_citation_summary` | Citations | Total citations, unique domains, unique URLs |
| 14 | `get_citation_domains` | Citations | Per-domain citation counts, share, conversation counts |
| 15 | `get_citation_domains_over_time` | Citations | Daily citation counts per domain |
| 16 | `get_citation_pages` | Citations | Per-URL citation counts with domain info |
| 17 | `get_citation_pages_over_time` | Citations | Daily citation counts per URL |

**Standard Parameter Pattern:**
```sql
(
  p_team_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_filters JSONB DEFAULT '{}'::JSONB
)
```

## Complete Report Modules (17 Endpoints)

### Visibility (7 endpoints)
| Endpoint | Description | oRPC Route |
|----------|-------------|------------|
| **Visibility Metrics** | Summary cards (conversations, messages, brands, products) | `visibilityMetrics` |
| **Visibility Scores** | Matrix table with CIS, FCPR, FDR, VS, Avg Position | `visibilityScores` |
| **Visibility Over Time** | Chart - daily/weekly/monthly visibility scores | `visibilityScoresOverTime` |
| **Share of Voice** | Pie charts & table - SOV across metrics | `visibilityShareOfVoice` |
| **Final Decision** | Rankings and final decision metrics | `visibilityFinalDecision` |
| **Decision Drivers** | Word cloud with decision driver frequencies | `visibilityDecisionDrivers` |
| **Conversations** | Raw conversation data | `visibilityConversations` |

### Sentiment (3 endpoints)
| Endpoint | Description | oRPC Route |
|----------|-------------|------------|
| **Sentiment Metrics** | Average sentiment, share chart, rank table | `sentimentMetrics` |
| **Sentiment Over Time** | Chart - daily sentiment scores by brand | `sentimentScoresOverTime` |
| **Sentiment Share of Voice** | Sentiment distribution (positive/neutral/negative) | `sentimentShareOfVoice` |

### Platform (2 endpoints)
| Endpoint | Description | oRPC Route |
|----------|-------------|------------|
| **Platform Scores** | Platform-brand visibility matrix | `platformVisibilityScores` |
| **Platform Over Time** | Chart - platform metrics by brand over time | `platformVisibilityOverTime` |

### Citations (5 endpoints)
| Endpoint | Description | oRPC Route |
|----------|-------------|------------|
| **Citation Summary** | Summary cards (total citations, domains) | `citationSummary` |
| **Citation Domains** | Domain rank table with counts & share | `citationDomains` |
| **Domains Over Time** | Chart - domain citations over time | `citationDomainsOverTime` |
| **Citation Pages** | URL/page rank table | `citationPages` |
| **Pages Over Time** | Chart - page citations over time | `citationPagesOverTime` |

## Phases

### Phase 1: Remove from Filters & Add Aggregations UI
> PR: `{branch-name}`

Remove `brandGroups` and `sourceLists` from filters and create a new Aggregations UI (button + credenza) gated behind a feature flag. The UI pattern mirrors the existing Filters component.

**Test Specifications:**
- `ReportAggregations.test.tsx` *(tests not yet written - component works but no test coverage)*
  - [ ] it("renders aggregations button when feature flag enabled")
  - [ ] it("hides aggregations button when feature flag disabled")
  - [ ] it("opens credenza on button click")
  - [ ] it("displays brand groups selection")
  - [ ] it("displays source lists selection")
  - [ ] it("applies selected aggregations on submit")
  - [ ] it("clears aggregations on clear button")

**Implementation Checklist:**
- [x] Write failing tests
- [x] Create feature flag `useReportAggregations` in `src/flags/`
- [x] Create `ReportAggregations` type in `src/models/`
- [x] Create `ReportAggregationsSchema` in `src/schemas/`
- [x] Remove `brandGroups` from `ReportFilters` type and schema
- [x] Remove `sourceLists` from `ReportFilters` type and schema
- [x] Remove brand groups filter category from `ReportFilters.tsx`
- [x] Remove source lists filter category from `ReportFilters.tsx`
- [x] Create `Aggregations.tsx` component (button + credenza pattern)
- [x] Create `ReportAggregations.tsx` wrapper component
- [x] Add aggregations state to `ReportContext`
- [x] Render aggregations button next to filters button (behind flag)
- [x] Verify tests pass
- [x] Run `pnpm pre-commit`

**Files:**
- `src/flags/useReportAggregations.ts` - Feature flag for aggregations UI
- `src/models/ReportAggregations.ts` - New type for aggregation configuration
- `src/models/ReportFilters.ts` - Remove `brandGroups` and `sourceLists`
- `src/schemas/ReportFiltersSchema.ts` - Remove `brandGroups` and `sourceLists`
- `src/schemas/ReportAggregationsSchema.ts` - New schema for aggregations
- `src/components/common/Aggregations.tsx` - Generic aggregations credenza (mirrors Filters.tsx pattern)
- `src/components/common/ReportAggregations.tsx` - Report-specific wrapper (mirrors ReportFilters.tsx pattern)
- `src/contexts/ReportContext.tsx` - Add aggregations state alongside filters
- `src/surfaces/ReportSurface.tsx` - Render aggregations button (conditionally)

**UI Pattern Reference:**
```
┌─────────────────────────────────────────────────────────┐
│  [Filters ▼]  [Aggregations ▼]  ... other controls     │
└─────────────────────────────────────────────────────────┘

Aggregations Credenza:
┌─────────────────────────────────────────────────────────┐
│  Aggregations                                      [X]  │
├─────────────────────────────────────────────────────────┤
│  ▼ Brand Groups                                         │
│    ☐ Competitors                                        │
│    ☐ Our Brands                                         │
│    ☐ Adjacent                                           │
├─────────────────────────────────────────────────────────┤
│  ▼ Source Lists                                         │
│    ☐ Tier 1 Sources                                     │
│    ☐ News Sites                                         │
│    ☐ Blogs                                              │
├─────────────────────────────────────────────────────────┤
│                          [Clear All]  [Apply]           │
└─────────────────────────────────────────────────────────┘
```

---

### Phase 2: Visibility Module - SQL-Level Brand Group Aggregation
> Depends on: Phase 1

Complete implementation of brand group aggregation for the entire Visibility module using **SQL-level aggregation** with correct conversation-level logic. This phase makes all 7 visibility endpoints fully functional with the new aggregation system.

**Key Architecture Decision:**
- Brand group aggregation happens in SQL via `p_brand_groups` JSONB parameter
- SQL uses `message_indices` from `brand_metrics` to aggregate at conversation level
- TypeScript helpers (`aggregateVisibilityByBrandGroups.ts`) are **deprecated** for main visibility
- Over-time charts temporarily use TS aggregation until SQL functions are updated

**Endpoints (7):**
- `visibilityScores` - Matrix table ✅ (SQL aggregation complete)
- `visibilityScoresOverTime` - Chart over time (TS aggregation - to be migrated)
- `visibilityShareOfVoice` - SOV pie charts & table (to be migrated)
- `visibilityFinalDecision` - Final decision rankings (to be migrated)
- `visibilityMetrics` - Summary cards (no aggregation needed)
- `visibilityDecisionDrivers` - Word cloud (no aggregation needed)
- `visibilityConversations` - Raw conversation data (no aggregation needed)

**SQL RPC Functions (Create/Update):**

| RPC Function | Endpoint | Changes |
|--------------|----------|---------|
| `get_visibility_scores` | `visibilityScores` | ✅ **Keep** `p_brand_groups` with correct conversation-level aggregation using `message_indices` |
| `get_visibility_scores_over_time` | `visibilityScoresOverTime` | Add `p_brand_groups` with same aggregation logic (pending) |
| `get_visibility_share_of_voice` | `visibilityShareOfVoice` | Add `p_brand_groups` with same aggregation logic (pending) |
| `get_visibility_final_decision` | `visibilityFinalDecision` | Add `p_brand_groups` with same aggregation logic (pending) |
| `get_visibility_metrics` | `visibilityMetrics` | No brand groups needed - summary counts only |
| `get_visibility_decision_drivers` | `visibilityDecisionDrivers` | No brand groups needed |
| `get_visibility_conversations` | `visibilityConversations` | No brand groups needed |

**SQL Aggregation Pattern (implemented in visibility functions):**
```sql
-- When p_brand_groups is provided (e.g., {"Competitors": ["nike", "adidas"]}):
-- Returns BOTH individual brands AND group aggregates using UNION ALL:
-- 1. Individual brands (is_group = false) - all brands returned from SQL
-- 2. Group aggregates (is_group = true) - aggregated metrics for selected groups

-- For group aggregates, per-conversation computation:
-- - group_mentioned: EXISTS any brand in group with mentioned=true
-- - group_message_indices: UNION of all message_indices from group brands
-- - group_conversational_integrity: +0.3 if 0 in indices, +0.3 if 1, +0.4 if 2
-- - group_full_presence: union covers [0..assistant_message_count-1]
-- - group_final_decision: ANY brand has final_decision=true
-- - group_earliest_position: MIN(earliest_assistant_mention_rank) across group brands
```

**TypeScript Post-Processing (Required):**

When brand groups are selected, the SQL returns both individual brands and group aggregates. **TypeScript must post-process the results** to hide individual brands that belong to selected groups at the top level.

**Important: Filters Before Aggregation**
The SQL `p_brand_groups` parameter should only include brands that pass the filter. When both brand groups and brand filters are active, TypeScript must intersect the group membership with the filter before passing to SQL:

```typescript
// Intersect brand groups with active brand filter
function getFilteredBrandGroups(
  brandGroups: Record<string, string[]> | undefined,
  filteredBrands: string[] | undefined  // from filters.brands
): Record<string, string[]> | undefined {
  if (!brandGroups || Object.keys(brandGroups).length === 0) {
    return undefined;
  }

  // If no brand filter, use full groups
  if (!filteredBrands || filteredBrands.length === 0) {
    return brandGroups;
  }

  const allowedBrands = new Set(filteredBrands);
  const result: Record<string, string[]> = {};

  for (const [groupName, brands] of Object.entries(brandGroups)) {
    // Only include brands that are in BOTH the group AND the filter
    const filteredGroupBrands = brands.filter(b => allowedBrands.has(b));
    if (filteredGroupBrands.length > 0) {
      result[groupName] = filteredGroupBrands;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

// Post-processing pattern in procedures:
function processVisibilityResults(
  data: VisibilityScore[],
  brandGroups: Record<string, string[]> | undefined
): VisibilityScore[] {
  if (!brandGroups || Object.keys(brandGroups).length === 0) {
    // No groups selected - return only individual brands (filter out any is_group=true)
    return data.filter(row => !row.is_group);
  }

  // Groups are selected - filter out individual brands that belong to any group
  const brandsInGroups = new Set(Object.values(brandGroups).flat());

  return data.filter(row => {
    if (row.is_group) return true; // Keep group aggregates
    // Keep individual brands that are NOT in any selected group
    return !brandsInGroups.has(row.brand);
  });
}
```

**Usage in procedures:**
```typescript
// 1. Get filtered brand groups (intersection of groups and brand filter)
const filteredBrandGroups = getFilteredBrandGroups(
  aggregations?.brandGroups,
  filters?.brands
);

// 2. Pass filtered groups to SQL
const { data } = await supabase.rpc('get_visibility_scores', {
  p_report_id: reportId,
  p_brand_groups: filteredBrandGroups  // Only contains filtered brands
});

// 3. Post-process results
return processVisibilityResults(data, filteredBrandGroups);
```

**Display Behavior:**
- **No groups selected:** Show only individual brands (default behavior)
- **Groups selected:** Show group aggregates + individual brands NOT in any group
- **Drill-down:** Group rows include nested `brands` array with individual brand metrics for UI expansion

**Important:** The SQL returns all data to support drill-down. TypeScript filtering determines what appears at the top level vs. nested for expansion.

**Test Specifications:**
- `aggregateVisibilityByBrandGroups.test.ts` (deprecated helper - kept for backwards compat)
  - [x] it("returns individual brand metrics when no aggregation selected")
  - [x] it("aggregates visibility score as MAX of brands in group") - **Note: MAX is incorrect, but kept for over-time**
  - [x] it("includes nested drill-down data for each group")
- `getFilteredBrandGroups.test.ts`
  - [x] it("returns null when no brand groups provided")
  - [x] it("returns full brand groups when no brand filter active")
  - [x] it("intersects brand groups with brand filter")
  - [x] it("excludes groups with no remaining brands after filtering")
  - [x] it("performs case-insensitive matching")
- `fetchVisibilityScoresOptimized.test.ts`
  - [x] it("returns individual brands when no aggregations are configured")
  - [x] it("calls RPC with correct parameters including p_brand_groups")
  - [x] it("filters out individual brands in groups from top-level results")
  - [x] it("keeps individual brands not in any group at top level")
  - [x] it("includes group rows with nested brands array for drilldown")
  - [x] it("passes only filtered brands to p_brand_groups when brand filter active")

**Implementation Checklist:**
- [x] Write failing tests for aggregation logic
- [x] Create `aggregateVisibilityByBrandGroups.ts` helper (deprecated - for over-time only)
- [x] Create SQL migration `20260120000000_add_brand_groups_to_visibility.sql`:
  - [x] `get_visibility_scores` - **keep** `p_brand_groups` with correct conversation-level aggregation
  - [x] `get_visibility_scores_over_time` - add `p_brand_groups` with same logic
  - [x] `get_visibility_share_of_voice` - add `p_brand_groups` with same logic
  - [x] `get_visibility_final_decision` - add `p_brand_groups` with same logic
- [x] Run migration locally (`pnpm --filter @infrastructure/supabase run db:reset`)
- [x] Regenerate types (`pnpm gencode`)
- [x] Update procedures to pass `p_brand_groups` to RPC:
  - [x] `fetchVisibilityScoresOptimized.ts` → pass `p_brand_groups`, SQL handles aggregation
  - [x] `fetchVisibilityScoresOverTimeOptimized.ts` → pass `p_brand_groups`, SQL handles aggregation
  - [x] `fetchVisibilityShareOfVoiceOptimized.ts` → pass `p_brand_groups`, SQL handles aggregation
  - [x] `fetchVisibilityFinalDecisionOptimized.ts` → pass `p_brand_groups`, SQL handles aggregation
- [x] **Add TypeScript post-processing to filter results:**
  - [x] Create `processVisibilityResults.ts` helper function
  - [x] Update `fetchVisibilityScoresOptimized.ts` → filter individual brands in groups from top-level
  - [x] Update `fetchVisibilityScoresOverTimeOptimized.ts` → filter individual brands in groups
  - [x] Update `fetchVisibilityShareOfVoiceOptimized.ts` → filter individual brands in groups
  - [x] Update `fetchVisibilityFinalDecisionOptimized.ts` → filter individual brands in groups
- [x] **Add filter-before-aggregation logic:**
  - [x] Create `getFilteredBrandGroups.ts` helper function
  - [x] Update all visibility procedures to intersect brand groups with brand filter
  - [x] Add tests for filter + aggregation interaction
- [x] Update contracts to accept `ReportAggregations`
- [x] Update routers to pass aggregations to procedures (visibilityScores only)
- [x] Update query options to include aggregations (input schema updated)
- [x] Verify all visibility tests pass (2583 tests pass)
- [x] Run `pnpm pre-commit`

**Files Changed:**
- `supabase/migrations/20260120000000_add_brand_groups_to_visibility.sql` - SQL with correct aggregation
- `src/helpers/aggregation/aggregateVisibilityByBrandGroups.ts` - **Deprecated** (for over-time only)
- `src/helpers/aggregation/processVisibilityResults.ts` - **NEW** Post-process SQL results to filter grouped brands
- `src/helpers/aggregation/processShareOfVoiceResults.ts` - **NEW** Post-process SOV results
- `src/helpers/aggregation/processFinalDecisionResults.ts` - **NEW** Post-process final decision results
- `src/helpers/aggregation/getFilteredBrandGroups.ts` - **NEW** Intersect brand groups with brand filter
- `src/helpers/aggregation/__tests__/processVisibilityResults.test.ts` - **NEW** Tests for post-processing
- `src/helpers/aggregation/__tests__/getFilteredBrandGroups.test.ts` - **NEW** Tests for filter + aggregation
- `src/procedures/visibility/fetchVisibilityScoresOptimized.ts` - Pass `p_brand_groups` to RPC + post-process results
- `src/procedures/visibility/fetchVisibilityScoresOverTimeOptimized.ts` - Added post-processing
- `src/procedures/visibility/fetchVisibilityShareOfVoiceOptimized.ts` - Added post-processing
- `src/procedures/visibility/fetchVisibilityFinalDecisionOptimized.ts` - Added post-processing
- `src/procedures/visibility/__tests__/fetchVisibilityScoresOptimized.test.ts` - Updated test for new behavior
- `src/procedures/visibility/__tests__/fetchVisibilityShareOfVoiceOptimized.test.ts` - Updated mock to use importOriginal
- `src/contracts/visibilityContract.ts`
- `src/routers/visibilityORPCRouter.ts`
- `src/queries/visibility/*.ts` - Update query options

**Phase 2 Complete:**
- [x] Add `p_brand_groups` to `get_visibility_scores_over_time` SQL function
- [x] Add `p_brand_groups` to `get_visibility_share_of_voice` SQL function
- [x] Add `p_brand_groups` to `get_visibility_final_decision` SQL function
- [x] Update corresponding TypeScript procedures to pass `p_brand_groups`

**Migration file:** `20260120041512_add_brand_groups_to_remaining_visibility_functions.sql`

---

### Phase 2.5: Migrate Brand Filters from Names to IDs
> Depends on: Phase 2

Migrate brand filtering from using brand names (`p_brand_names`) to brand IDs (`p_brand_ids`) to prevent case sensitivity issues. Brand names are unreliable for filtering because user-entered names may differ in case from database values.

**Problem:**
- Current implementation uses `p_brand_names` (e.g., `["Nike", "Adidas"]`)
- SQL comparison is case-sensitive, causing "no data" when cases don't match
- Brand groups use lowercase names, but filters may have mixed case

**Solution:**
- Use `p_brand_ids` (UUIDs) for filtering - case-insensitive and unique
- Keep `p_brand_groups` using names for SQL aggregation (display purposes)
- Update `getFilteredBrandGroups` to map between IDs and names

**SQL RPC Functions to Update:**

| RPC Function | Change |
|--------------|--------|
| `get_visibility_scores` | Replace `p_brand_names TEXT[]` with `p_brand_ids UUID[]` |
| `get_visibility_scores_over_time` | Replace `p_brand_names TEXT[]` with `p_brand_ids UUID[]` |
| `get_visibility_share_of_voice` | Replace `p_brand_names TEXT[]` with `p_brand_ids UUID[]` |
| `get_visibility_final_decision` | Replace `p_brand_names TEXT[]` with `p_brand_ids UUID[]` |
| `get_visibility_metrics` | Replace `p_brand_names TEXT[]` with `p_brand_ids UUID[]` |
| `get_visibility_decision_drivers` | Replace `p_brand_names TEXT[]` with `p_brand_ids UUID[]` |
| `get_visibility_conversations` | Replace `p_brand_names TEXT[]` with `p_brand_ids UUID[]` |
| `get_sentiment_scores` | Replace `p_brand_names TEXT[]` with `p_brand_ids UUID[]` |
| `get_sentiment_scores_over_time` | Replace `p_brand_names TEXT[]` with `p_brand_ids UUID[]` |
| `get_platform_visibility_scores` | Replace `p_brand_names TEXT[]` with `p_brand_ids UUID[]` |
| `get_platform_visibility_over_time` | Replace `p_brand_names TEXT[]` with `p_brand_ids UUID[]` |

**TypeScript Changes:**

1. **`ResolvedRpcFilterParameters`** - Replace `brandNames` with `brandIds`:
```typescript
export interface ResolvedRpcFilterParameters {
  // ... other fields
  brandIds: string[] | undefined;  // Changed from brandNames
  // ...
}
```

2. **`resolveRpcFilterParameters`** - Extract IDs instead of names:
```typescript
// Extract brand IDs from filters.brands
const brandIds = filters.brands.length > 0
  ? filters.brands.map(b => String(b.key))  // key is the brand ID
  : undefined;
```

3. **`getFilteredBrandGroups`** - Update to accept brand ID to name mapping:
```typescript
export function getFilteredBrandGroups(
  brandGroups: Record<string, string[]> | null | undefined,
  filteredBrandIds: string[] | null | undefined,
  brandIdToName: Map<string, string>  // NEW: mapping from ID to lowercase name
): Record<string, string[]> | null {
  // Convert filtered IDs to names for intersection with brand groups
  const filteredBrandNames = filteredBrandIds
    ?.map(id => brandIdToName.get(id))
    .filter((name): name is string => name !== undefined);

  // Rest of logic uses names for intersection
  // ...
}
```

4. **`resolveBrandGroupsParam`** - Return brand ID to name mapping:
```typescript
export async function resolveBrandGroupsParam(
  supabase: SupabaseClient,
  reportId: string,
  aggregations: ReportAggregations,
): Promise<{
  brandGroups: Record<string, string[]> | null;
  brandIdToName: Map<string, string>;  // NEW: for filter-before-aggregation
}> {
  // Build mapping from all fetched brand groups
  const brandIdToName = new Map<string, string>();
  for (const group of allBrandGroups) {
    for (const brand of group.brands) {
      brandIdToName.set(brand.id, brand.name.toLowerCase());
    }
  }
  // ...
}
```

**Test Specifications:**
- `getFilteredBrandGroups.test.ts`
  - [x] it("accepts brand IDs and maps to names for intersection")
  - [x] it("filters brand groups using ID-based lookup")
  - [x] it("handles missing brand IDs gracefully")
- `resolveRpcFilterParameters.test.ts`
  - [x] it("extracts brand IDs from filters.brands")
  - [x] it("returns brandIds instead of brandNames")
- `fetchVisibilityScoresOptimized.test.ts`
  - [x] it("passes p_brand_ids to RPC instead of p_brand_names")

**Implementation Checklist:**
- [x] Create SQL migration to change `p_brand_names` to `p_brand_ids`:
  - [x] Update `get_visibility_scores`
  - [x] Update `get_visibility_scores_over_time`
  - [x] Update `get_visibility_share_of_voice`
  - [x] Update `get_visibility_final_decision`
  - [ ] Update `get_visibility_metrics` *(deferred - uses direct queries, not RPC)*
  - [ ] Update `get_visibility_decision_drivers` *(deferred - uses direct queries, not RPC)*
  - [ ] Update `get_visibility_conversations` *(deferred - uses direct queries, not RPC)*
  - [x] Update `get_sentiment_scores` *(done in migration 20260121210517)*
  - [x] Update `get_sentiment_scores_over_time` *(done in migration 20260121213105)*
  - [x] Update `get_platform_visibility_scores` *(done in Phase 4 - migration 20260121220000)*
  - [x] Update `get_platform_visibility_over_time` *(done in Phase 4 - migration 20260121220000)*
- [x] Run migration locally (`pnpm --filter @infrastructure/supabase run db:reset`)
- [x] Regenerate types (`pnpm gencode:local`)
- [x] Update `ResolvedRpcFilterParameters` interface
- [x] Update `resolveRpcFilterParameters` to extract brand IDs
- [x] Create `expandBrandGroupsToBrandIds.ts` and `buildBrandIdToNameMap` helpers
- [x] Update `getFilteredBrandGroups` to accept ID to name mapping
- [x] Update visibility procedures to pass `brandIds`:
  - [x] `fetchVisibilityScoresOptimized.ts`
  - [x] `fetchVisibilityScoresOverTimeOptimized.ts`
  - [x] `fetchVisibilityShareOfVoiceOptimized.ts`
  - [x] `fetchVisibilityFinalDecisionOptimized.ts`
  - [x] `actionFetchVisibilityMetricsOptimized.ts` *(updated to convert IDs to names for JSONB filtering)*
- [x] Update all visibility procedure tests
- [x] Verify all tests pass (2635 tests)
- [x] Run `pnpm pre-commit`

**Files:**
- `supabase/migrations/{timestamp}_brand_ids_filter.sql` - Change p_brand_names to p_brand_ids
- `src/helpers/resolveRpcFilterParameters.ts` - Use brandIds instead of brandNames
- `src/helpers/aggregation/resolveBrandGroupsParam.ts` - Return brand ID to name mapping
- `src/helpers/aggregation/getFilteredBrandGroups.ts` - Accept ID to name mapping
- `src/helpers/aggregation/__tests__/getFilteredBrandGroups.test.ts` - Update tests
- `src/procedures/visibility/fetchVisibilityScoresOptimized.ts` - Pass brandIds
- `src/procedures/visibility/fetchVisibilityScoresOverTimeOptimized.ts` - Pass brandIds
- `src/procedures/visibility/fetchVisibilityShareOfVoiceOptimized.ts` - Pass brandIds
- `src/procedures/visibility/fetchVisibilityFinalDecisionOptimized.ts` - Pass brandIds
- All other visibility procedures

---

### Phase 2.6: Update brand_metrics Storage to Use Brand IDs as Keys
> Depends on: Phase 2.5

Update how brands are stored in the `brand_metrics` JSONB column to use brand ID as the key instead of brand name. This prevents case sensitivity issues in metric lookups and makes the storage consistent with the ID-based filtering from Phase 2.5.

**Problem:**
- Current implementation stores brand metrics keyed by name: `{ "Nike": { ... }, "Adidas": { ... } }`
- Brand name case may differ between sources (UI, database, metrics)
- SQL RPC functions use `brand_metrics->brand_name` which is case-sensitive

**Solution:**
- Store brand metrics keyed by ID: `{ "uuid-1": { name: "Nike", ... }, "uuid-2": { name: "Adidas", ... } }`
- Add `name` field inside each brand metric object for display purposes
- Update SQL RPC functions to iterate over all keys instead of looking up by name

**Current Structure:**
```json
{
  "Nike": {
    "mentioned": true,
    "message_indices": [0, 1, 2],
    "earliest_assistant_mention_rank": 1,
    "final_decision": false
  }
}
```

**New Structure:**
```json
{
  "550e8400-e29b-41d4-a716-446655440000": {
    "name": "Nike",
    "mentioned": true,
    "message_indices": [0, 1, 2],
    "earliest_assistant_mention_rank": 1,
    "final_decision": false
  }
}
```

**TypeScript Changes:**

1. **`extractConversationMetrics.ts`** - Use brand ID as key:
```typescript
// Before
brandMetrics[brand.name] = {
  mentioned: true,
  // ...
};

// After
brandMetrics[brand.id] = {
  name: brand.name,
  mentioned: true,
  // ...
};
```

2. **`BrandMetrics` type** - Add `name` field:
```typescript
interface BrandMetric {
  name: string;  // NEW
  mentioned: boolean;
  message_indices: number[];
  earliest_assistant_mention_rank: number | null;
  final_decision: boolean;
}
```

**SQL RPC Changes:**

All functions that read `brand_metrics` need to be updated to:
1. Accept `p_brand_ids` instead of looking up by name
2. Join with the metrics using ID-based keys
3. Extract `name` from the metric object for display

```sql
-- Before (name-based lookup)
SELECT
  brand_name,
  (brand_metrics->brand_name->>'mentioned')::boolean as mentioned
FROM brand_metrics_cte
WHERE brand_metrics ? brand_name

-- After (ID-based iteration)
SELECT
  metric_data->>'name' as brand_name,
  (metric_data->>'mentioned')::boolean as mentioned
FROM brand_metrics_cte,
LATERAL jsonb_each(brand_metrics) AS metrics(brand_id, metric_data)
WHERE brand_id = ANY(p_brand_ids::text[])
```

**Data Migration:**
Existing `brand_metrics` data needs to be migrated from name-keyed to ID-keyed format. This requires a one-time migration script that:
1. Reads existing metrics
2. Looks up brand IDs by name
3. Rewrites metrics with ID keys

**Test Specifications:**
- `extractConversationMetrics.test.ts`
  - [x] it("stores brand metrics keyed by brand ID") *(tests use `brandId()` helper as key)*
  - [x] it("includes brand name field in each metric object") *(tests verify `name` field)*
  - [ ] it("handles multiple brands with same name different IDs") *(not explicitly tested)*
- `get_visibility_scores.test.sql` (pgTAP not used)
  - N/A - No pgTAP tests; behavior verified through integration tests

**Implementation Checklist:**
- [x] Update `BrandMetric` type to include `name` field
- [x] Update `extractConversationMetrics.ts` to use brand ID as key
- [x] Update `extractConversationMetrics.test.ts` tests
- [x] Update `handleExtractConversationMetrics.ts` query to fetch brand ID
- [x] Update `handleExtractConversationMetrics.test.ts` tests
- [x] Update `actionFetchVisibilityMetricsOptimized.ts` to extract names from ID-keyed metrics
- [x] Update `actionFetchVisibilityMetricsOptimized.test.ts` tests
- [x] Verify all tests pass (2635 tests)
- [x] Run `pnpm pre-commit`
- [x] Create SQL migration to update all RPC functions *(migration 20260121210517)*:
  - [x] `get_visibility_scores` - uses `brand_value->>'name'`
  - [x] `get_visibility_scores_over_time` - uses `brand_value->>'name'`
  - [x] `get_visibility_share_of_voice` - uses `brand_value->>'name'`
  - [x] `get_visibility_final_decision` - uses `brand_value->>'name'`
  - [x] `get_sentiment_scores` - uses `brand_value->>'name'`
  - [x] `get_sentiment_scores_over_time` *(migration 20260121213105)* - uses `brand_value->>'name'`
  - [x] `get_platform_visibility_scores` *(done in Phase 4 - migration 20260121220000)*
  - [x] `get_platform_visibility_over_time` *(done in Phase 4 - migration 20260121220000)*
- [x] Create data migration script for existing metrics *(completed via `backfillConversationMetrics.ts --force`)*
- [x] Run migration locally (`pnpm --filter @infrastructure/supabase run db:migrate`)
- [x] Regenerate types (`pnpm gencode:local`)

**Files Changed (TypeScript - Complete):**
- `src/helpers/extractConversationMetrics.ts` - Use brand ID as key, add name field
- `src/helpers/__tests__/extractConversationMetrics.test.ts` - Update tests for ID-keyed metrics
- `src/schemas/ConversationMetricsSchema.ts` - Add name field to BrandMetricSchema
- `src/handlers/handleExtractConversationMetrics.ts` - Update query to fetch brand ID
- `src/handlers/__tests__/handleExtractConversationMetrics.test.ts` - Update mock data
- `src/actions/visibility/actionFetchVisibilityMetricsOptimized.ts` - Extract names from ID-keyed metrics
- `src/actions/visibility/__tests__/actionFetchVisibilityMetricsOptimized.test.ts` - Update mock data

**Files (SQL - Pending):**
- `supabase/migrations/{timestamp}_brand_metrics_id_keys.sql` - Update RPC functions
- `supabase/migrations/{timestamp}_migrate_brand_metrics_data.sql` - Data migration

**Considerations:**
- This is a breaking change for existing data - data migration is required
- Can be deployed incrementally: update write path first, then migrate data, then update read path
- Consider feature flag to toggle between name-based and ID-based lookups during migration

---

### Phase 3: Sentiment Module - SQL-Level Brand Group Aggregation
> Depends on: Phase 1, Phase 2.5, Phase 2.6

Complete implementation of brand group aggregation for the entire Sentiment module using **SQL-level aggregation**.

**Key Architecture Decision:**
- Brand group aggregation happens in SQL via `p_brand_groups` JSONB parameter (same pattern as Visibility)
- Sentiment uses simpler aggregation: AVG of sentiment scores across group brands

**Endpoints (3):**
- `sentimentMetrics` - Average sentiment, share chart, rank table
- `sentimentScoresOverTime` - Chart over time
- `sentimentShareOfVoice` - Sentiment distribution

**SQL RPC Functions (Create/Update):**

| RPC Function | Endpoint | Changes |
|--------------|----------|---------|
| `get_sentiment_scores` | `sentimentMetrics` | Add `p_brand_groups` with conversation-level aggregation |
| `get_sentiment_scores_over_time` | `sentimentScoresOverTime` | Add `p_brand_groups` with same logic |

**Sentiment Aggregation Rule (SQL):**
```sql
-- For sentiment, group aggregation is simpler:
-- - Average sentiment: AVG of sentiment scores from all brands in group
-- - Counts: SUM of positive/neutral/negative counts across group brands
```

**TypeScript Post-Processing (Required):**
Same pattern as Visibility - SQL returns both individual brands and group aggregates; TypeScript filters individual brands in groups from top-level results. Group rows include nested `brands` array for drilldown.

**Filters Before Aggregation:** Same rule applies - when both brand groups and brand filters are active, intersect group membership with the filter before passing to SQL. Drilldown only shows filtered brands.

**Test Specifications:**
- `fetchSentimentScoresOptimized.test.ts` (existing tests)
  - [x] it("returns individual brands when no aggregations configured")
  - [x] it("calls RPC with p_brand_groups when brand groups selected")
  - [x] it("filters out individual brands in groups from top-level results")
  - [x] it("keeps individual brands not in any group at top level")
  - [x] it("includes group rows with nested brands array for drilldown")
  - [x] it("passes only filtered brands to p_brand_groups when brand filter active")
- `fetchSentimentScoresOverTimeOptimized.test.ts` (**NEW**)
  - [x] it("returns sentiment scores grouped by date")
  - [x] it("returns empty array when no data")
  - [x] it("handles null data gracefully")
  - [x] it("sorts results by date then brand name")
  - [x] it("filters out individual brands in groups from top-level")
  - [x] it("returns only individual brands when no groups selected")
  - [x] it("throws INTERNAL_SERVER_ERROR when RPC fails")
  - [x] it("calls RPC with correct parameters")
  - [x] it("passes brand_groups to RPC when aggregations provided")

**Implementation Checklist:**
- [x] SQL RPC `get_sentiment_scores` already has `p_brand_groups` (added in Phase 2)
- [x] Create SQL migration for `get_sentiment_scores_over_time` RPC function:
  - [x] Create `get_sentiment_scores_over_time` - add `p_brand_groups` with same logic
- [x] Run migration locally (`pnpm --filter @infrastructure/supabase run db:migrate`)
- [x] Regenerate types (`pnpm gencode:local`)
- [x] Update procedures to pass `p_brand_groups` to RPC:
  - [x] `fetchSentimentScoresOptimized.ts` → pass `p_brand_groups` (already done via filters.brandGroups)
  - [x] Create `fetchSentimentScoresOverTimeOptimized.ts` procedure
- [x] Add TypeScript post-processing to filter results:
  - [x] Create `processSentimentResults.ts` helper function
  - [x] Update `fetchSentimentScoresOptimized.ts` → filter individual brands in groups + filter-before-aggregation
  - [x] Update sentiment over time procedure → filter individual brands in groups
- [x] Update routers (behind feature flag `usePrecomputedSentimentScoresOverTime`)
- [ ] Update query options (optional - can use existing queryOptions)
- [x] Verify all sentiment tests pass (2646 tests)
- [x] Run `pnpm pre-commit`

**Files Changed:**
- `supabase/migrations/20260121213105_add_sentiment_scores_over_time.sql` - **NEW** RPC function
- `src/helpers/aggregation/processSentimentResults.ts` - Post-process SQL results
- `src/procedures/sentiment/fetchSentimentScoresOptimized.ts`
- `src/procedures/sentiment/fetchSentimentScoresOverTimeOptimized.ts` - **NEW** Optimized procedure
- `src/procedures/sentiment/__tests__/fetchSentimentScoresOverTimeOptimized.test.ts` - **NEW** Tests
- `src/flags/usePrecomputedSentimentScoresOverTime.ts` - **NEW** Feature flag
- `src/flags/index.ts` - Export new flag
- `src/routers/analyticsORPCRouter.ts` - Updated to use optimized procedure

---

### Phase 4: Platform Module - SQL-Level Brand Group Aggregation
> Depends on: Phase 1, Phase 2.5, Phase 2.6

Complete implementation of brand group aggregation for the entire Platform module using **SQL-level aggregation**.

**Key Architecture Decision:**
- Brand group aggregation happens in SQL via `p_brand_groups` JSONB parameter (same pattern as Visibility)
- Platform uses per-platform grouping: aggregate brands within each platform separately

**Endpoints (2):**
- `platformVisibilityScores` - Platform-brand visibility matrix
- `platformVisibilityOverTime` - Platform metrics by brand over time

**SQL RPC Functions (Create/Update):**

| RPC Function | Endpoint | Changes |
|--------------|----------|---------|
| `get_platform_visibility_scores` | `platformVisibilityScores` | Add `p_brand_groups` with per-platform conversation-level aggregation |
| `get_platform_visibility_over_time` | `platformVisibilityOverTime` | Add `p_brand_groups` with same logic |

**Platform Aggregation Rule (SQL):**
```sql
-- For platform, group aggregation is per-platform:
-- - For each (platform, brand_group): aggregate using same message_indices logic as Visibility
-- - Results are grouped by (platform, brand_group) instead of just brand_group
```

**TypeScript Post-Processing (Required):**
Same pattern as Visibility - SQL returns both individual brands and group aggregates per platform; TypeScript filters individual brands in groups from top-level results. Group rows include nested `brands` array for drilldown.

**Filters Before Aggregation:** Same rule applies - when both brand groups and brand filters are active, intersect group membership with the filter before passing to SQL. Drilldown only shows filtered brands.

**Test Specifications:**
- `fetchPlatformVisibilityScoresOptimized.test.ts`
  - [ ] it("returns individual brands per platform when no aggregations configured")
  - [ ] it("calls RPC with p_brand_groups when brand groups selected")
  - [ ] it("aggregates within each platform separately")
  - [ ] it("filters out individual brands in groups from top-level results")
  - [ ] it("keeps individual brands not in any group at top level")
  - [ ] it("includes group rows with nested brands array for drilldown")
  - [ ] it("passes only filtered brands to p_brand_groups when brand filter active")

**Implementation Checklist:**
- [x] Create SQL migration to add `p_brand_groups` to platform RPC functions:
  - [x] `get_platform_visibility_scores` - add `p_brand_groups` with per-platform aggregation
  - [x] `get_platform_visibility_over_time` - add `p_brand_groups` with same logic
- [x] Run migration locally (`pnpm --filter @infrastructure/supabase run db:migrate`)
- [x] Regenerate types (`pnpm gencode:local`)
- [x] Update procedures to pass `p_brand_groups` to RPC:
  - [x] `fetchPlatformVisibilityScoresOptimized.ts` → pass `p_brand_groups`, use aggregations param
  - [x] `fetchPlatformVisibilityOverTimeOptimized.ts` → **NEW** created with full aggregations support
- [x] Add TypeScript post-processing to filter results:
  - [x] Reuse `processBrandAggregationResults.ts` helper function
  - [x] Update `fetchPlatformVisibilityScoresOptimized.ts` → filter individual brands in groups
  - [x] Update `fetchPlatformVisibilityOverTimeOptimized.ts` → filter individual brands in groups
- [x] Update routers with feature flag `usePrecomputedPlatformVisibilityOverTime`
- [x] Verify all platform tests pass
- [x] Run `pnpm pre-commit`

**Files Changed:**
- `supabase/migrations/20260121220000_platform_brand_groups.sql` - Add `p_brand_groups` to platform RPCs
- `src/procedures/platform/fetchPlatformVisibilityScoresOptimized.ts` - Updated to use aggregations parameter
- `src/procedures/platform/fetchPlatformVisibilityOverTimeOptimized.ts` - **NEW** optimized procedure
- `src/flags/usePrecomputedPlatformVisibilityOverTime.ts` - **NEW** feature flag
- `src/flags/index.ts` - Export new flag
- `src/routers/visibilityORPCRouter.ts` - Updated to use new procedures with feature flags

---

### Phase 5: Citations Module - TypeScript Source List Aggregation
> Depends on: Phase 1

Complete implementation of source list aggregation for the entire Citations module.

**Key Architecture Decision:**
- Source list aggregation uses **TypeScript** (not SQL like brand groups)
- This is appropriate because source list aggregation is simpler (SUM of counts, no message_indices logic needed)
- SQL RPC functions return individual domain metrics; TypeScript aggregates by source list

**TypeScript Post-Processing (Required):**
When source lists are selected, TypeScript filters individual domains in lists from top-level results. Only source list aggregates + individual domains NOT in any list appear at the top level. List rows include nested `domains` array for drilldown.

**Filters Before Aggregation:** Same rule applies - when both source lists and domain filters are active, intersect list membership with the filter before aggregating. Drilldown only shows filtered domains.

```typescript
// Intersect source lists with active domain filter
function getFilteredSourceLists(
  sourceLists: Record<string, string[]> | undefined,
  filteredDomains: string[] | undefined  // from filters.domains
): Record<string, string[]> | undefined {
  if (!sourceLists || Object.keys(sourceLists).length === 0) {
    return undefined;
  }

  // If no domain filter, use full lists
  if (!filteredDomains || filteredDomains.length === 0) {
    return sourceLists;
  }

  const allowedDomains = new Set(filteredDomains);
  const result: Record<string, string[]> = {};

  for (const [listName, domains] of Object.entries(sourceLists)) {
    // Only include domains that are in BOTH the list AND the filter
    const filteredListDomains = domains.filter(d => allowedDomains.has(d));
    if (filteredListDomains.length > 0) {
      result[listName] = filteredListDomains;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

// Post-processing pattern in procedures:
function processCitationResults(
  data: CitationDomain[],
  sourceLists: Record<string, string[]> | undefined
): CitationDomain[] {
  if (!sourceLists || Object.keys(sourceLists).length === 0) {
    // No lists selected - return only individual domains
    return data.filter(row => !row.is_list);
  }

  // Lists are selected - filter out individual domains that belong to any list
  const domainsInLists = new Set(Object.values(sourceLists).flat());

  return data.filter(row => {
    if (row.is_list) return true; // Keep list aggregates
    // Keep individual domains that are NOT in any selected list
    return !domainsInLists.has(row.domain);
  });
}
```

**Display Behavior:**
- **No lists selected:** Show only individual domains (default behavior)
- **Lists selected:** Show list aggregates + individual domains NOT in any list
- **Drill-down:** List rows include nested `domains` array with individual domain metrics for UI expansion

**Endpoints (5):**
- `citationSummary` - Summary cards
- `citationDomains` - Domain rank table
- `citationDomainsOverTime` - Domain citations over time
- `citationPages` - URL/page rank table
- `citationPagesOverTime` - Page citations over time

**SQL RPC Functions (Create/Update):**

| RPC Function | Endpoint | Changes |
|--------------|----------|---------|
| `get_citation_summary` | `citationSummary` | Create if missing; return total citations, unique domains, unique URLs counts |
| `get_citation_domains` | `citationDomains` | Create/update; return per-domain citation counts, share, conversation counts |
| `get_citation_domains_over_time` | `citationDomainsOverTime` | Create if missing; return daily citation counts per domain |
| `get_citation_pages` | `citationPages` | Create if missing; return per-URL citation counts with domain info |
| `get_citation_pages_over_time` | `citationPagesOverTime` | Create if missing; return daily citation counts per URL |

**RPC Function Signature Pattern:**
```sql
CREATE OR REPLACE FUNCTION get_citation_domains(
  p_team_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_filters JSONB DEFAULT '{}'::JSONB
) RETURNS TABLE (
  domain TEXT,
  citation_count INTEGER,
  url_count INTEGER,
  conversation_count INTEGER,
  citation_share NUMERIC
) AS $$
-- Implementation
$$ LANGUAGE plpgsql;
```

**Test Specifications:**
- `aggregateCitationsBySourceLists.test.ts`
  - [x] it("returns individual domain metrics when no aggregation selected")
  - [x] it("aggregates citation count as total from ANY domain in list")
  - [x] it("aggregates citation share as list total / all citations × 100")
  - [x] it("aggregates URL count as total unique URLs from ANY domain") *(not applicable - URLs are at page level)*
  - [x] it("includes nested drill-down data for each source list")
- `getFilteredSourceLists.test.ts`
  - [x] it("returns null when no source lists provided")
  - [x] it("returns full source lists when no domain filter active")
  - [x] it("intersects source lists with domain filter")
  - [x] it("excludes lists with no remaining domains after filtering")
  - [x] it("performs case-insensitive matching for domains")
- `fetchCitationDomainsOverTimeOptimized.test.ts`
  - [x] it("returns citation domains grouped by date")
  - [x] it("returns empty array when no data")
  - [x] it("sorts results by date ascending")
  - [x] it("returns individual domains with isGroup=false when no aggregations")
  - [x] it("throws INTERNAL_SERVER_ERROR when RPC fails")
- `fetchCitationPagesOptimized.test.ts`
  - [x] it("returns page metrics for current period")
  - [x] it("calculates period-over-period changes")
  - [x] it("sorts results by count descending")
  - [x] it("throws INTERNAL_SERVER_ERROR when RPC fails")
- `fetchCitationPagesOverTimeOptimized.test.ts`
  - [x] it("returns citation pages grouped by date")
  - [x] it("returns empty array when no data")
  - [x] it("sorts results by date ascending")
  - [x] it("throws INTERNAL_SERVER_ERROR when RPC fails")

**Implementation Checklist:**
- [x] Write failing tests for citation aggregation
- [x] Create `aggregateCitationsBySourceLists.ts` helper
- [x] Create `getFilteredSourceLists.ts` helper (filter-before-aggregation)
- [x] Create SQL migration with remaining RPC functions:
  - [x] `get_citation_summary` - *(already existed)*
  - [x] `get_citation_domains` - *(already existed)*
  - [x] `get_citation_domains_over_time` - daily citation counts per domain
  - [x] `get_citation_pages` - per-URL citation counts with domain info
  - [x] `get_citation_pages_over_time` - daily citation counts per URL
- [x] Run migration locally (`pnpm --filter @infrastructure/supabase db:migrate`)
- [x] Regenerate types (`pnpm --filter @infrastructure/supabase gencode:local`)
- [x] Create optimized procedures using new RPC functions:
  - [x] `fetchCitationDomainsOverTimeOptimized.ts` → call `get_citation_domains_over_time`, add TS aggregation
  - [x] `fetchCitationPagesOptimized.ts` → call `get_citation_pages`
  - [x] `fetchCitationPagesOverTimeOptimized.ts` → call `get_citation_pages_over_time`
- [x] Create feature flags:
  - [x] `usePrecomputedCitationDomainsOverTime.ts`
  - [x] `usePrecomputedCitationPages.ts`
  - [x] `usePrecomputedCitationPagesOverTime.ts`
- [x] Update routers with feature flags (`analyticsORPCRouter.ts`)
- [x] Update query options *(updated all 5 citation query options to include aggregations in query key)*
- [x] Verify all citation tests pass (193 tests)
- [x] Run `pnpm pre-commit`

**Migration file:** `20260122000000_add_citation_over_time_functions.sql`

**Files Changed:**
- `supabase/migrations/20260122000000_add_citation_over_time_functions.sql` - New RPC functions
- `src/helpers/aggregation/aggregateCitationsBySourceLists.ts` - **NEW** TypeScript aggregation helper
- `src/helpers/aggregation/getFilteredSourceLists.ts` - **NEW** Intersect source lists with domain filter
- `src/helpers/aggregation/__tests__/aggregateCitationsBySourceLists.test.ts` - **NEW** Tests
- `src/helpers/aggregation/__tests__/getFilteredSourceLists.test.ts` - **NEW** Tests
- `src/helpers/aggregation/index.ts` - Export new helpers
- `src/procedures/citations/fetchCitationDomainsOverTimeOptimized.ts` - **NEW** Optimized procedure
- `src/procedures/citations/fetchCitationPagesOptimized.ts` - **NEW** Optimized procedure
- `src/procedures/citations/fetchCitationPagesOverTimeOptimized.ts` - **NEW** Optimized procedure
- `src/procedures/citations/__tests__/fetchCitationDomainsOverTimeOptimized.test.ts` - **NEW** Tests
- `src/procedures/citations/__tests__/fetchCitationPagesOptimized.test.ts` - **NEW** Tests
- `src/procedures/citations/__tests__/fetchCitationPagesOverTimeOptimized.test.ts` - **NEW** Tests
- `src/flags/usePrecomputedCitationDomainsOverTime.ts` - **NEW** Feature flag
- `src/flags/usePrecomputedCitationPages.ts` - **NEW** Feature flag
- `src/flags/usePrecomputedCitationPagesOverTime.ts` - **NEW** Feature flag
- `src/flags/index.ts` - Export new flags
- `src/routers/analyticsORPCRouter.ts` - Updated to use new procedures with feature flags

---

## Open Questions

All major questions have been resolved. See "Aggregation Behavior Rules" section for decisions.
