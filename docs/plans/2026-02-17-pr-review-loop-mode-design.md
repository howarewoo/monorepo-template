# PR Review `--loop` Mode Design

**Date**: 2026-02-17
**Status**: Approved

## Overview

Add a `--loop` flag to the PR review skill that iteratively reviews code, fixes all findings, and re-reviews until the PR passes clean (0 findings) or a safety limit is reached. On approval, the review is auto-posted to GitHub.

## Requirements

| Requirement | Decision |
|-------------|----------|
| Fix scope | All findings (HIGH, MEDIUM, LOW) |
| Review scope per iteration | All 5 auditors from scratch |
| Max iterations | 5 |
| Commit behavior | Accumulate changes, no commits during loop |
| On approval (0 findings) | Auto-post to GitHub (standard mode) |
| On max iterations / stall | Create local task list of remaining findings |

## Argument Parsing

`--loop` is a third mode alongside standard and `--local`. It is mutually exclusive with `--local`.

```
--loop           -> loop mode, current branch PR
123 --loop       -> loop mode, PR #123
--loop 123       -> loop mode, PR #123
--loop --local   -> INVALID (error out with clear message)
--local          -> local mode (unchanged)
(empty)          -> standard mode (unchanged)
```

## Loop Workflow

### Task 1: Validate Prerequisites & Gather PR Metadata
Runs **once**. PR metadata (number, title, author, state, base, head, changed files) is gathered and reused across all iterations.

### Iteration Loop (max 5 iterations)

Each iteration runs:

1. **Task 3**: Prepare Shared Context — re-read all changed files (they may have been modified by fixes)
2. **Task 4**: Launch 5 Parallel Auditors — full review from scratch
3. **Task 5**: Collect Agent Results
4. **Task 6**: Aggregate & Generate Review

After aggregation, evaluate exit conditions:
- **0 findings** -> exit loop, mark as "approved"
- **Same finding count as previous iteration** (stall detection) -> exit loop, mark as "stalled"
- **Iteration 5 reached** -> exit loop, mark as "max iterations"
- **Otherwise** -> proceed to Task 9

5. **Task 9** (new): Fix All Findings — apply fixes, then loop back to Task 3

### Post-Loop

Based on exit condition:

| Exit Condition | Action |
|---------------|--------|
| Approved (0 findings) | Task 7A: Post to GitHub (title, description, clean review) + Task 8A: Summary with iteration history |
| Stalled or max iterations | Task 7B: Create local task list of remaining findings + Task 8B: Summary with iteration history and retry instructions |

### Workflow Diagram

```
Task 1 (once)
    |
    v
[Loop Start] ──> Task 3 ──> Task 4 ──> Task 5 ──> Task 6
    ^                                                 |
    |                          0 findings? ──> Post-Loop (7A/8A)
    |                     Same count as last? ──> Post-Loop (7B/8B)
    |                       Max iterations? ──> Post-Loop (7B/8B)
    |                                                 |
    └──────────── Task 9 (fix) <── Has findings ──────┘
```

## Task 9: Fix All Findings (New)

### Input
All aggregated findings from Task 6 — each with file path, line numbers, description, and suggested fix.

### Execution
Launch a **single** `general-purpose` sub-agent that:
1. Receives all findings
2. Groups fixes by file to minimize line-number conflicts
3. Reads each file before editing (never blind-edit)
4. Applies all suggested fixes using Edit tool
5. Runs `pnpm lint:fix` and `pnpm typecheck` after all edits
6. Logs any findings that couldn't be applied as "SKIPPED: [reason]"

A single agent (not parallel) because fixes within the same file can conflict — changing one line shifts subsequent line numbers.

### Output
- Modified source files (uncommitted)
- Log of applied and skipped fixes

## Iteration Tracking

Each iteration records:
- Iteration number
- Finding count
- Fix count / skip count

Example log:
```
Iteration 1: 12 findings -> 12 fixed, 0 skipped
Iteration 2: 4 findings -> 4 fixed, 0 skipped
Iteration 3: 0 findings -> APPROVED
```

### Stall Detection
If two consecutive iterations produce the same finding count, the loop stops early. The fixes aren't converging and continuing would waste cycles.

## Summary Output

### Approved (posted to GitHub)
Standard clean review comment. PR description includes:
```
*Reviewed and auto-fixed in N iterations (X -> Y -> 0 findings)*
```

### Max Iterations / Stalled (local)
Local mode summary with:
- Iteration history showing convergence trajectory
- Task list of remaining findings
- Instruction: "Run `/pr-review --loop` to retry or `/pr-review` to post current state"

## Files Changed

| File | Change |
|------|--------|
| `SKILL.md` | Add `--loop` mode documentation, add Edit/Write to `allowed-tools` |
| `WORKFLOW.md` | Add loop mode detection, outer loop wrapper, Task 9, stall detection, iteration tracking, post-loop routing |
| `ANALYSIS_GUIDE.md` | Add iteration history format to output templates |

## Unchanged
- All 5 auditor agent files (`agents/*.md`) — no changes needed
- `.claude/commands/pr-review.md` — already delegates to the skill
