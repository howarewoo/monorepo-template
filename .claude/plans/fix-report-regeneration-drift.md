# Fix Report Regeneration Time Drift

## Problem

The `last_regenerated_at` timestamp is set **after** processing completes (line 146), capturing the time at `T + processingDuration` instead of `T`. This causes reports to gradually drift later over time.

## Solution

Capture the regeneration timestamp at the **start** of processing and use it for all reports in that batch.

## Changes

**File:** `packages/features/brand-intelligence/src/handlers/handleRegenerateReports.ts`

1. Add timestamp capture after fetching eligible reports (around line 125):
   ```typescript
   const regenerationTimestamp = new Date().toISOString();
   ```

2. Update line 146 to use the pre-captured timestamp:
   ```typescript
   .update({ last_regenerated_at: regenerationTimestamp })
   ```

## Verification

1. Run existing tests:
   ```bash
   pnpm --filter @features/brand-intelligence test
   ```

2. Verify the test at line ~649 (`updates last_regenerated_at after successfully enqueueing tasks`) still passes - it should, as it only checks that the field is updated with a string timestamp.
