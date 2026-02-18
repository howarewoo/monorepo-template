# PR Review Non-Blocking Findings Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `blocking: true/false` classification to audit findings so the PR review loop exits on 0 *blocking* findings instead of 0 *total* findings.

**Architecture:** Each of the 5 auditor agent markdown files gains a `Blocking` field in its output format and classification guidelines. WORKFLOW.md gains blocking-aware exit conditions, iteration tracking, Task 9 filtering, and updated output templates.

**Tech Stack:** Markdown files only (no code changes)

**Design doc:** `docs/plans/2026-02-17-pr-review-nonblocking-findings-design.md`

---

### Task 1: Add Blocking Field to Security Auditor

**Files:**
- Modify: `.claude/skills/pr-review/agents/security-auditor.md:47-63` (output format)
- Modify: `.claude/skills/pr-review/agents/security-auditor.md:74-78` (severity guidelines)

**Step 1: Add `Blocking` field to output format**

In the finding template between `**Severity**` and `**File**`, add:

```markdown
- **Blocking**: [true|false]
```

So the finding block becomes:
```
### Finding 1
- **Type**: critical
- **Severity**: [HIGH|MEDIUM|LOW]
- **Blocking**: [true|false]
- **File**: path/to/file.ts (lines X-Y)
- **Description**: [Clear explanation of the security risk and potential impact]
...
```

**Step 2: Add classification guidelines after severity guidelines**

After the existing severity guidelines section (line 78), add:

```markdown

## Blocking Classification

- **Blocking: true** — A code defect, bug, or vulnerability that can and should be fixed before merge. The fix agent can address it by editing source files.
- **Blocking: false** — A process observation, style preference, or concern that cannot be resolved by editing code (e.g., historical decisions, speculative future concerns).

**Rule of thumb**: If the fix agent can resolve it by editing source files, it's blocking. If it requires rewriting git history, changing CI config, or is purely advisory, it's non-blocking.
```

**Step 3: Commit**

```bash
git add .claude/skills/pr-review/agents/security-auditor.md
git commit -m "feat(pr-review): add blocking field to security auditor"
```

---

### Task 2: Add Blocking Field to Architecture Auditor

**Files:**
- Modify: `.claude/skills/pr-review/agents/architecture-auditor.md:59-75` (output format)
- Modify: `.claude/skills/pr-review/agents/architecture-auditor.md:88-92` (severity guidelines)

**Step 1: Add `Blocking` field to output format**

In the finding template between `**Severity**` and `**File**`, add:

```markdown
- **Blocking**: [true|false]
```

So the finding block becomes:
```
### Finding 1
- **Type**: architecture
- **Severity**: [HIGH|MEDIUM|LOW]
- **Blocking**: [true|false]
- **File**: path/to/file.ts (lines X-Y)
...
```

**Step 2: Add classification guidelines after severity guidelines**

After the existing severity guidelines section (line 92), add the same blocking classification section as Task 1.

**Step 3: Commit**

```bash
git add .claude/skills/pr-review/agents/architecture-auditor.md
git commit -m "feat(pr-review): add blocking field to architecture auditor"
```

---

### Task 3: Add Blocking Field to Constitution Auditor

**Files:**
- Modify: `.claude/skills/pr-review/agents/constitution-auditor.md:69-86` (output format)
- Modify: `.claude/skills/pr-review/agents/constitution-auditor.md:97-101` (severity guidelines)

**Step 1: Add `Blocking` field to output format**

In the finding template between `**Severity**` and `**File**`, add:

```markdown
- **Blocking**: [true|false]
```

**Step 2: Add classification guidelines after severity guidelines**

Same blocking classification section as Tasks 1-2.

**Step 3: Commit**

```bash
git add .claude/skills/pr-review/agents/constitution-auditor.md
git commit -m "feat(pr-review): add blocking field to constitution auditor"
```

---

### Task 4: Add Blocking Field to Code Quality Auditor

**Files:**
- Modify: `.claude/skills/pr-review/agents/code-quality-auditor.md:69-88` (output format)
- Modify: `.claude/skills/pr-review/agents/code-quality-auditor.md:98-102` (severity guidelines)

**Step 1: Add `Blocking` field to output format**

In the finding template between `**Severity**` and `**File**`, add:

```markdown
- **Blocking**: [true|false]
```

**Step 2: Add classification guidelines after severity guidelines**

Same blocking classification section as Tasks 1-3.

**Step 3: Commit**

```bash
git add .claude/skills/pr-review/agents/code-quality-auditor.md
git commit -m "feat(pr-review): add blocking field to code quality auditor"
```

---

### Task 5: Add Blocking Field to API Stability Auditor

**Files:**
- Modify: `.claude/skills/pr-review/agents/api-stability-auditor.md:80-99` (output format)
- Modify: `.claude/skills/pr-review/agents/api-stability-auditor.md:110-114` (severity guidelines)

**Step 1: Add `Blocking` field to output format**

In the finding template between `**Severity**` and `**File**`, add:

```markdown
- **Blocking**: [true|false]
```

**Step 2: Add classification guidelines after severity guidelines**

Same blocking classification section as Tasks 1-4.

**Step 3: Commit**

```bash
git add .claude/skills/pr-review/agents/api-stability-auditor.md
git commit -m "feat(pr-review): add blocking field to API stability auditor"
```

---

### Task 6: Update WORKFLOW.md — Loop Mode Iteration Wrapper

**Files:**
- Modify: `.claude/skills/pr-review/WORKFLOW.md:130-166` (iteration wrapper section)

**Step 1: Update tracking state initialization (line 134)**

Change:
```markdown
- `iteration_log = []` (array of `{iteration, finding_count, fixed_count, skipped_count}`)
```
To:
```markdown
- `iteration_log = []` (array of `{iteration, finding_count, blocking_count, nonblocking_count, fixed_count, skipped_count}`)
```

**Step 2: Add blocking/nonblocking count extraction after step 5 (after line 142)**

Change:
```markdown
5. Count total findings from aggregated results → `current_finding_count`
```
To:
```markdown
5. Count findings from aggregated results:
   - `current_finding_count` = total findings
   - `blocking_count` = count of findings where `Blocking: true`
   - `nonblocking_count` = count of findings where `Blocking: false`
```

**Step 3: Update exit conditions (lines 146-166)**

Replace the entire exit conditions block with:

```markdown
**Evaluate exit conditions (in order):**

1. **Approved**: If `blocking_count == 0`:
   - Append `{iteration, finding_count: current_finding_count, blocking_count: 0, nonblocking_count, fixed_count: 0, skipped_count: 0}` to `iteration_log`
   - Set `loop_result = "approved"`
   - Exit loop → proceed to Post-Loop

2. **Stalled**: If `blocking_count == previous_finding_count`:
   - Append `{iteration, finding_count: current_finding_count, blocking_count, nonblocking_count, fixed_count: 0, skipped_count: 0}` to `iteration_log`
   - Set `loop_result = "stalled"`
   - Exit loop → proceed to Post-Loop

3. **Max iterations**: If `iteration == max_iterations`:
   - Append `{iteration, finding_count: current_finding_count, blocking_count, nonblocking_count, fixed_count: 0, skipped_count: 0}` to `iteration_log`
   - Set `loop_result = "max_iterations"`
   - Exit loop → proceed to Post-Loop

4. **Continue**: Execute **Task 9** (Fix All Findings) — pass only **blocking** findings
   - Collect `fixed_count` and `skipped_count` from Task 9 output
   - Append `{iteration, finding_count: current_finding_count, blocking_count, nonblocking_count, fixed_count, skipped_count}` to `iteration_log`
   - Set `previous_finding_count = blocking_count`
   - Increment `iteration`
   - Loop back to step 1
```

**Step 4: Commit**

```bash
git add .claude/skills/pr-review/WORKFLOW.md
git commit -m "feat(pr-review): update loop exit conditions to use blocking count"
```

---

### Task 7: Update WORKFLOW.md — Task 6 Aggregation

**Files:**
- Modify: `.claude/skills/pr-review/WORKFLOW.md:360-407` (Task 6 section)

**Step 1: Add blocking/nonblocking separation to Step 6.1**

After step 4 ("Sort within each category by severity"), add:

```markdown
5. **Separate** findings into blocking and non-blocking lists based on the `Blocking` field
6. **Count** `blocking_count` and `nonblocking_count` for the iteration log
```

**Step 2: Commit**

```bash
git add .claude/skills/pr-review/WORKFLOW.md
git commit -m "feat(pr-review): add blocking/nonblocking separation to Task 6 aggregation"
```

---

### Task 8: Update WORKFLOW.md — Task 9 Fix Agent Filtering

**Files:**
- Modify: `.claude/skills/pr-review/WORKFLOW.md:699-747` (Task 9 section)

**Step 1: Update the opening description**

Change:
```markdown
Launch a **single** `general-purpose` sub-agent to fix all findings from the current iteration.
```
To:
```markdown
Launch a **single** `general-purpose` sub-agent to fix all **blocking** findings from the current iteration. Non-blocking findings are not passed to the fix agent.
```

**Step 2: Update the agent prompt findings section**

Change:
```markdown
    ## Findings to Fix
    [Include all aggregated findings from Task 6 with file paths, line numbers, descriptions, and suggested fixes]
```
To:
```markdown
    ## Findings to Fix (blocking only)
    [Include only findings where Blocking: true from Task 6, with file paths, line numbers, descriptions, and suggested fixes]

    Note: Non-blocking findings (process observations, advisory notes) have been excluded. Only fix the findings listed above.
```

**Step 3: Commit**

```bash
git add .claude/skills/pr-review/WORKFLOW.md
git commit -m "feat(pr-review): filter Task 9 fix agent to blocking findings only"
```

---

### Task 9: Update WORKFLOW.md — Task 8C Approved Summary

**Files:**
- Modify: `.claude/skills/pr-review/WORKFLOW.md:620-654` (Task 8C section)

**Step 1: Update the iteration history table**

Change:
```markdown
### Iteration History
| Iteration | Findings | Fixed | Skipped |
|-----------|----------|-------|---------|
| 1 | 12 | 12 | 0 |
| 2 | 4 | 4 | 0 |
| 3 | 0 | - | - |
```
To:
```markdown
### Iteration History
| Iteration | Blocking | Non-blocking | Fixed | Skipped |
|-----------|----------|--------------|-------|---------|
| 1 | 12 | 0 | 12 | 0 |
| 2 | 4 | 1 | 4 | 0 |
| 3 | 0 | 1 | - | - |
```

**Step 2: Update the result line**

Change:
```markdown
### Result: APPROVED (0 findings)
```
To:
```markdown
### Result: APPROVED (0 blocking findings)
```

**Step 3: Add non-blocking notes section**

After the result line, add:

```markdown

### Notes (non-blocking observations)
| # | Auditor | Severity | Description |
|---|---------|----------|-------------|
| 1 | Constitution | LOW | TDD commit ordering |

*These observations are informational and do not block merge.*
```

**Step 4: Update the convergence trajectory line**

Change:
```markdown
*Reviewed and auto-fixed in 3 iterations (12 → 4 → 0 findings)*
```
To:
```markdown
*Reviewed and auto-fixed in 3 iterations (12 → 4 → 0 blocking findings)*
```

**Step 5: Commit**

```bash
git add .claude/skills/pr-review/WORKFLOW.md
git commit -m "feat(pr-review): update Task 8C approved summary for blocking/nonblocking"
```

---

### Task 10: Update WORKFLOW.md — Task 8D Stalled Summary

**Files:**
- Modify: `.claude/skills/pr-review/WORKFLOW.md:658-695` (Task 8D section)

**Step 1: Update the iteration history table**

Same table format change as Task 9 (add Blocking/Non-blocking columns).

Change:
```markdown
### Iteration History
| Iteration | Findings | Fixed | Skipped |
|-----------|----------|-------|---------|
| 1 | 12 | 10 | 2 |
| 2 | 8 | 6 | 2 |
| 3 | 8 | - | - |
```
To:
```markdown
### Iteration History
| Iteration | Blocking | Non-blocking | Fixed | Skipped |
|-----------|----------|--------------|-------|---------|
| 1 | 12 | 0 | 10 | 2 |
| 2 | 8 | 1 | 6 | 2 |
| 3 | 8 | 1 | - | - |
```

**Step 2: Update the result line**

Change:
```markdown
### Result: STALLED (findings not converging)
```
To:
```markdown
### Result: STALLED (blocking findings not converging)
```

**Step 3: Add distinction in remaining findings**

After the remaining findings list, add a note:

```markdown

*Remaining findings listed above are blocking only. Non-blocking observations were excluded from the fix loop.*
```

**Step 4: Commit**

```bash
git add .claude/skills/pr-review/WORKFLOW.md
git commit -m "feat(pr-review): update Task 8D stalled summary for blocking/nonblocking"
```

---

### Task 11: Update WORKFLOW.md — Mermaid Diagram

**Files:**
- Modify: `.claude/skills/pr-review/WORKFLOW.md:803-837` (loop mode mermaid diagram)

**Step 1: Update the decision node text**

Change:
```markdown
    T6 --> CHECK{0 findings?}
```
To:
```markdown
    T6 --> CHECK{0 blocking findings?}
```

**Step 2: Commit**

```bash
git add .claude/skills/pr-review/WORKFLOW.md
git commit -m "feat(pr-review): update loop mode mermaid diagram for blocking findings"
```

---

### Task 12: Update WORKFLOW.md — Post-Loop Routing and Description

**Files:**
- Modify: `.claude/skills/pr-review/WORKFLOW.md:27` (loop mode description)
- Modify: `.claude/skills/pr-review/WORKFLOW.md:170-181` (post-loop routing section)

**Step 1: Update the loop mode description in the header**

Change:
```markdown
- **Stop** when 0 findings (approved), same count as previous iteration (stalled), or max 5 iterations
```
To:
```markdown
- **Stop** when 0 blocking findings (approved), same blocking count as previous iteration (stalled), or max 5 iterations
```

**Step 2: Update the post-loop routing note**

Change:
```markdown
**Important:** When routing to Task 7A after loop approval, the review comment should reflect a clean bill of health. When routing to Task 7B after stall/max, the task list contains only the remaining findings from the final iteration.
```
To:
```markdown
**Important:** When routing to Task 7A after loop approval, the review comment should reflect a clean bill of health (0 blocking findings). Include any non-blocking findings as informational notes. When routing to Task 7B after stall/max, the task list contains only the remaining **blocking** findings from the final iteration.
```

**Step 3: Commit**

```bash
git add .claude/skills/pr-review/WORKFLOW.md
git commit -m "feat(pr-review): update loop mode description and post-loop routing for blocking"
```

---

### Task 13: Verify all changes

**Step 1: Review all modified files**

Read each file and verify the changes are consistent:
- All 5 auditor files have the `Blocking` field in the same position (between Severity and File)
- All 5 auditor files have the same blocking classification guidelines section
- WORKFLOW.md exit conditions use `blocking_count`
- WORKFLOW.md iteration log format includes `blocking_count` and `nonblocking_count`
- WORKFLOW.md Task 9 specifies blocking-only filtering
- WORKFLOW.md Task 8C/8D use updated table format and text
- WORKFLOW.md mermaid diagram says "0 blocking findings?"
- WORKFLOW.md description and post-loop routing are updated

**Step 2: Squash commits into single feature commit**

Since all changes are part of one feature, squash into a single commit:

```bash
git log --oneline -12
```

Count the commits from this implementation and squash:

```bash
git reset --soft HEAD~N  # where N = number of implementation commits
git commit -m "feat(pr-review): add blocking/non-blocking finding classification to loop mode

Auditors now classify each finding as blocking (code defect fixable by
editing files) or non-blocking (process observation, advisory). The loop
exits on 0 blocking findings instead of 0 total findings. Non-blocking
findings appear as informational notes in the review output.

Changes:
- Add Blocking field to all 5 auditor output formats
- Add classification guidelines to all 5 auditor agent files
- Update loop exit conditions to count only blocking findings
- Filter Task 9 fix agent to receive only blocking findings
- Update Task 6 aggregation to separate blocking/non-blocking
- Update Task 8C/8D summaries with blocking/non-blocking columns
- Update mermaid diagram and loop mode description"
```

**Step 3: Verify final commit**

```bash
git log --oneline -3
git diff HEAD~1 --stat
```

Expected: 6 files changed (5 auditor agents + WORKFLOW.md).
