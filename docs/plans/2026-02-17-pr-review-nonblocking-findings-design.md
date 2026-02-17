# PR Review Loop: Non-Blocking Findings Design

**Date**: 2026-02-17
**Status**: Approved

## Problem

The PR review loop mode treats all findings equally when evaluating exit conditions. A finding count of 0 is required for approval, but some findings are unfixable by the code fix agent (e.g., TDD commit ordering, historical decisions, process observations). These findings cause the loop to stall or hit max iterations even when all code defects have been resolved.

## Solution

Add a `blocking` field to each audit finding. Only blocking findings count toward the loop exit condition. Non-blocking findings are tracked separately and included in the review output as informational notes.

## Design

### Finding Format

Each auditor adds a `blocking` field to every finding:

```
### Finding 1
- **Type**: [quality|security|constitution|architecture|api]
- **Severity**: [HIGH|MEDIUM|LOW]
- **Blocking**: [true|false]
- **File**: path/to/file.ts (lines X-Y)
- ...rest unchanged
```

**Classification guidelines** (added to each auditor agent file):

- `blocking: true` — A code defect, bug, or violation that can and should be fixed before merge. The fix agent can address it by editing files.
- `blocking: false` — A process observation, style preference, or concern that cannot be resolved by editing code (e.g., TDD commit ordering, historical decisions, speculative future concerns).

**Rule of thumb**: If the fix agent can resolve it by editing source files, it's blocking. If it requires rewriting git history, changing CI config, or is purely advisory, it's non-blocking.

### Loop Exit Condition

Current logic counts all findings. New logic counts only blocking findings:

```
blocking_count = count of findings where blocking == true
nonblocking_count = count of findings where blocking == false

if blocking_count == 0 → approved (even if nonblocking_count > 0)
if blocking_count == previous_finding_count → stalled
if iteration == max_iterations → stalled
else → continue to Task 9
```

### Tracking State

`iteration_log` entries gain a `nonblocking_count` field:

```
{iteration, finding_count, blocking_count, nonblocking_count, fixed_count, skipped_count}
```

`previous_finding_count` tracks only blocking findings for stall detection.

### Task 9 (Fix Agent)

The fix agent receives only blocking findings. Non-blocking findings are not passed to the fix agent.

### Output Changes

**GitHub review comment** — When approved with non-blocking findings, includes a "Notes" section:

```markdown
### Result: APPROVED (0 blocking findings)

### Notes (non-blocking observations)
| # | Auditor | Severity | Description |
|---|---------|----------|-------------|
| 1 | Constitution | LOW | TDD commit ordering |

*These observations are informational and do not block merge.*
```

**Iteration history table** — gains a column distinguishing blocking from non-blocking:

```markdown
| Iteration | Blocking | Non-blocking | Fixed | Skipped |
|-----------|----------|--------------|-------|---------|
| 1         | 6        | 0            | 5     | 1       |
| 2         | 3        | 1            | 3     | 0       |
| 3         | 0        | 1            | -     | -       |
```

**Task 8C (approved summary)** — text says "0 blocking findings" and lists non-blocking notes.

**Task 8D (stalled/max summary)** — remaining findings table distinguishes blocking from non-blocking.

## Files to Change

1. `.claude/skills/pr-review/agents/code-quality-auditor.md` — add `Blocking` field to format and guidelines
2. `.claude/skills/pr-review/agents/constitution-auditor.md` — same
3. `.claude/skills/pr-review/agents/security-auditor.md` — same
4. `.claude/skills/pr-review/agents/architecture-auditor.md` — same
5. `.claude/skills/pr-review/agents/api-stability-auditor.md` — same
6. `.claude/skills/pr-review/WORKFLOW.md` — update exit conditions, tracking state, Task 9 filtering, Task 6 aggregation, Task 7A/7B output, Task 8C/8D summaries, mermaid diagram
