# Dynamic Report Regeneration Implementation Plan

## Overview

Change report regeneration from a fixed daily cron (midnight UTC) to dynamic per-report scheduling where each report regenerates 24 hours after its previous generation.

**Current behavior:** All active reports regenerate at midnight UTC daily.
**New behavior:** Each report regenerates 24 hours after its last generation, spreading load throughout the day.

**Approach:** Frequent polling cron (every 30 minutes) with `last_regenerated_at` timestamp. This is simpler, self-healing, and allows the timestamp to be reused for UI display.

---

## Files to Create/Modify

| File | Change |
|------|--------|
| `packages/infrastructure/supabase/migrations/[new]_add_last_regenerated_at.sql` | New migration |
| `packages/features/brand-intelligence/src/handlers/handleRegenerateReports.ts` | Query filter, update timestamp, remove `hasRecentGeneration` |
| `packages/features/brand-intelligence/src/actions/actionCreateReport.ts` | Set initial `last_regenerated_at` |
| `packages/features/brand-intelligence/src/procedures/team/fetchTeamReports.ts` | Include `last_regenerated_at` in query, update `lastRefreshed` mapping |
| `packages/features/brand-intelligence/src/components/reports/ReportsTable.tsx` | Add "Next Refresh" column (calculated from lastRefreshed) |
| `docs/QSTASH_INTEGRATION.md` | Update scheduling description |
| `docs/CONVERSATION_GENERATION_PIPELINE.md` | Update entry points section |

---

## Implementation Steps

### 1. Database Schema Migration

Create migration file: `packages/infrastructure/supabase/migrations/[timestamp]_add_last_regenerated_at.sql`

```sql
-- Add last_regenerated_at field to track when report was last regenerated
ALTER TABLE brand_intelligence_reports
ADD COLUMN last_regenerated_at TIMESTAMPTZ;

-- Create index for efficient due-report queries
CREATE INDEX idx_reports_last_regenerated
ON brand_intelligence_reports(last_regenerated_at)
WHERE status = 'active';

-- Backfill existing active reports: stagger based on created_at to spread load
UPDATE brand_intelligence_reports
SET last_regenerated_at = NOW() - INTERVAL '24 hours' + (EXTRACT(EPOCH FROM created_at) % 86400) * INTERVAL '1 second'
WHERE status = 'active';

COMMENT ON COLUMN brand_intelligence_reports.last_regenerated_at IS
  'Timestamp when report was last regenerated. Reports are eligible for regeneration when this is more than 24 hours ago.';
```

Then regenerate types: `pnpm gencode`

### 2. Update Cron Handler

**File:** `packages/features/brand-intelligence/src/handlers/handleRegenerateReports.ts`

- Replace `hasRecentGeneration()` check with `last_regenerated_at` filter
- Query reports where `last_regenerated_at <= NOW() - 24 hours` OR `last_regenerated_at IS NULL`
- Update `last_regenerated_at` after enqueueing tasks
- Remove `hasRecentGeneration()` function (no longer needed)
- Remove `reportsSkipped` tracking

```typescript
// New query:
const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const { data: activeReports, error: reportsError } = await supabase
  .from("brand_intelligence_reports")
  .select("id, title, report_type")
  .eq("status", "active")
  .or(`last_regenerated_at.is.null,last_regenerated_at.lte.${twentyFourHoursAgo}`);

// After enqueueing tasks:
await supabase
  .from("brand_intelligence_reports")
  .update({ last_regenerated_at: new Date().toISOString() })
  .eq("id", report.id);
```

### 3. Update Report Creation

**File:** `packages/features/brand-intelligence/src/actions/actionCreateReport.ts`

Set initial `last_regenerated_at` to current time when creating a report:

```typescript
.insert({
  // ... existing fields
  last_regenerated_at: new Date().toISOString(),  // First regen in 24h
})
```

### 4. Update QStash Schedule (Manual)

Change in Upstash QStash console:
- **Current:** `0 0 * * *` (daily at midnight UTC)
- **New:** `*/30 * * * *` (every 30 minutes)

### 5. UI Changes

**File:** `packages/features/brand-intelligence/src/procedures/team/fetchTeamReports.ts`
- Add `last_regenerated_at` to select query
- Update `lastRefreshed` mapping: `report.last_regenerated_at ?? report.created_at`

**File:** `packages/features/brand-intelligence/src/components/reports/ReportsTable.tsx`
- Add "Next Refresh" column that calculates from `lastRefreshed + 24 hours`
- Show relative time (e.g., "In 5h", "Refreshing soon")

### 6. Update Documentation

- `docs/QSTASH_INTEGRATION.md` - Update scheduling description
- `docs/CONVERSATION_GENERATION_PIPELINE.md` - Update entry points section

---

## Verification

1. Run migration: `pnpm supabase db push && pnpm gencode`
2. Create new report, verify `last_regenerated_at` is set
3. Manually trigger cron endpoint, verify only eligible reports processed
4. Verify `last_regenerated_at` updates after processing
5. Build and test: `pnpm build && pnpm test`

---

## Open Questions

- ~~Polling vs job-per-report approach~~ → Resolved: Polling cron
- ~~`next_regeneration_at` vs `last_regenerated_at`~~ → Resolved: `last_regenerated_at`
- Handle report reactivation? → Set `last_regenerated_at = null` to trigger immediate regen
