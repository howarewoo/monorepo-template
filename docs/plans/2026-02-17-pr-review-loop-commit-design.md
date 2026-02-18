# Design: PR Review Loop — Post-Loop Commit

**Status**: Approved
**Date**: 2026-02-17

## Problem

The PR review loop mode (Tasks 3-6 + Task 9) auto-fixes blocking findings across iterations, but all changes accumulate in the working directory without being committed. After the loop finishes, the user must manually stage and commit the fixes. This is friction in an otherwise fully autonomous workflow.

## Solution

Add **Task 10: Commit Fixes** — a new workflow task that runs once after the loop exits, before post-loop routing (Tasks 7/8).

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| When to commit | Once after loop exits | Avoids noisy per-iteration commits; single atomic commit |
| Which exit conditions | All three (approved, stalled, max_iterations) | Fixes have value even if loop didn't fully converge |
| Commit method | `gt modify` | Amends into current Graphite stack per project conventions |
| Commit message | `fix: address PR review findings` | Static message; details live in iteration log and PR comment |
| Skip condition | Cumulative FIXED_COUNT == 0 | No empty commits when all findings were SKIPPED/unfixable |

## Task 10 Specification

### Position in Workflow

```
Loop exits (approved / stalled / max_iterations)
    ↓
Task 10: Commit Fixes
    ↓
Post-Loop Routing (Tasks 7A/7B → 8C/8D)
```

### Logic

1. Sum `fixed_count` across all entries in `iteration_log`
2. If cumulative fixed count is 0 → skip commit, proceed to post-loop routing
3. If cumulative fixed count > 0:
   - Run `git add -A` to stage all changed files
   - Run `gt modify --message "fix: address PR review findings"`
4. Proceed to post-loop routing

### Staging Strategy

`git add -A` is appropriate here because Task 9's fix agent only modifies files identified by the review, and `pnpm lint:fix` may touch additional files. All changes in the working directory at this point are review-related.

## Files to Change

1. **`.claude/skills/pr-review/WORKFLOW.md`**
   - Add Task 10 section
   - Update Post-Loop Routing to include Task 10 before Tasks 7/8
   - Update loop mode mermaid diagram
   - Update header text (task count reference)

2. **`.claude/skills/pr-review/SKILL.md`**
   - Add `Bash(gt:*)` to `allowed-tools`
   - Mention commit behavior in loop mode description

## What Does NOT Change

- Task 9 retains "Do NOT commit" — individual iterations still don't commit
- Standard and local modes are unaffected
- Fix agent instructions stay the same
- Auditor agents are unchanged
