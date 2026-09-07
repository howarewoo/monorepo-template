# Review benchmark evidence

## Purpose and cohort

[`benchmark.mjs`](benchmark.mjs) checks the evidence used to score `woostack-review`.
[`corpus.json`](corpus.json) lists ten fixed Code Review Bench cases from commit
`fbc5425c5eec52932aa1303708873d341968fa1c`. With the upstream checkout supplied, `verify-corpus`
checks all ten selected cases and their 30 reference findings, called *goldens*.
A development run uses only the five rank-one cases listed in `manifest.json.caseIds`.
Only that group can be compared with the historical five-PR baseline.

One completed run can show whether a change looks promising. It cannot establish a release score,
show variation across repeated runs, or stand in for a ten-PR or 50-PR benchmark.

The Core scoring categories are `api`, `bug`, `concurrency`, `data`, `doc_defect`, `perf`,
`security`, and `test_gap`. A true positive (TP) is a matched Core golden; a false negative (FN)
is a missed Core golden. A false positive (FP) is a candidate not selected as a match for any golden.
A candidate selected as the match for an excluded golden is not a false positive.
Precision is `TP / (TP + FP)`; recall is `TP / (TP + FN)`. F1 balances both, while F2 gives
recall more weight. These definitions are unchanged from the historical benchmark.

## Prerequisites

This is a maintainer benchmark that creates remote repositories and incurs model costs.
Repository policy requires prior approval of the exact owner, repository names, count, purpose,
and cleanup plan before creating them. Use local temporary repositories for other evaluation work.

- `git`, `gh`, `jq`, `node`, `omp`, and `sqlite3` on `PATH`.
- `gh` authenticated to an owner where five fresh private fixture repositories and pull requests
  may be created.
- Code Review Bench checked out at `fbc5425c5eec52932aa1303708873d341968fa1c` (the standard local
  checkout is `/tmp/woostack-code-review-benchmark`).
- Fresh, separate OMP sessions for reviewers and judges, with the benchmark judge model available
  through host roles. Direct provider API keys are not required.
- An OMP accounting database at `$HOME/.omp/stats.db`, or an existing database selected by
  `WOO_BENCHMARK_USAGE_DB`. The runner requires this file. If it has no rows for the bound sessions,
  the scorer reads usage records from those exact session JSONL files. It never recalculates prices.
- A new run directory outside the repository and five new fixture PRs (PRs created as test inputs).
  Do not reuse reviews: prior comments and incremental review state can change the result.

Resolve inputs without creating the run root:

```bash
./benchmarks/woostack-review/run.sh --dry-run --org OWNER
```

After obtaining that approval, run the five-case benchmark from the repository root:

```bash
./benchmarks/woostack-review/run.sh --org OWNER
```

Use `--run-root PATH`, `WOO_BENCHMARK_RUN_ROOT`, `WOO_BENCHMARK_ORG`, and
`WOO_BENCHMARK_USAGE_DB` for explicit overrides.

## Evidence protocol

The controller coordinates the run. Reviewers propose findings, one adjudicator checks them,
and judges compare accepted findings with the goldens. A receipt is a saved record linking an
operation to its inputs and result. Keep the required files below so the scorer can verify each step.

1. Check the corpus against the fixed upstream checkout:

   ```bash
   node benchmarks/woostack-review/benchmark.mjs verify-corpus \
     --benchmark-root /tmp/woostack-code-review-benchmark
   ```

2. Initialize a new historical-five-PR run. This saves the full corpus and hashes of all review
   skill files, then creates case directories for only the five rank-one case IDs:

   ```bash
   node benchmarks/woostack-review/benchmark.mjs init \
     --run-root /tmp/woostack-review-five-pr/<run-id> \
     --skill-root skills/woostack-review
   ```

3. Recreate each `manifest.json.caseIds` PR privately and run the unmodified public
   `/woostack-review <PR#>` workflow once. Retain the complete review OUTDIR at
   `cases/<case-id>/review/` and copy its exact accepted `findings.json` to
   `cases/<case-id>/findings.json`. Required review evidence is:

   - `swarm-metrics.json` plus every named candidate receipt;
   - `raw_findings.json`, `findings.adjudicator.json`, `findings.json`,
     `receipt.adjudicator.json`, `validator-bindings.json` schema 2, and
     `validator-metrics.json`;
   - benchmark-owned `fixture.json` from the private PR creation read-back,
     `delivery-create.json` from the first successful native create, and
     `delivery-readback.json` from native GitHub delivery read-back, binding the exact repository,
     PR, reviewed `meta.json.headRefOid`, unique create attempt, review ID/event/actor, and every
     accepted finding digest to its posted comment ID and URL.
   - Before PR creation, create `main` with the base commit and push `main` by itself. Set the
     repository default branch to `main` and independently read it back before creating or pushing
     `benchmark-head`. Create `benchmark-head` from that base before applying or committing head
     changes, push it only after its head commit exists, then independently verify distinct local
     SHAs, matching remote refs, `main` as the default branch, and matching PR base/head refs.
     `fixture.json` records `baseSha`, `headSha`, the local and remote base/head ref SHAs, independently
     captured `localMergeBaseSha` and `remoteMergeBaseSha` values equal to `baseSha`, and PR
     base/head read-back SHAs.

   Every invocation of the unmodified public review workflow must set both `GITHUB_REPOSITORY` and
   `GH_REPO` to the exact private fixture repository. Do not retain a source/upstream remote that a
   bare `gh` lookup can select. Verify `meta.json.headRefOid` and `headRefName` against
   `fixture.json`; repository and PR identity come from the independently read fixture and native
   GitHub read-back because the public `meta.json` schema does not contain those fields.

   Native delivery is create-once and owned by the benchmark helper. Generate a unique attempt ID
   and write the complete native review request body to a payload file, then invoke:

   ```bash
   node benchmarks/woostack-review/benchmark.mjs create-delivery \
     --review-root <run-root>/cases/<case-id>/review \
     --attempt-id <unique-attempt-id> \
     --request-payload <absolute-review-request.json> \
     --gh "$(command -v gh)"
   ```

   The helper reads the repository and PR from the case fixture and the event from the payload.
   It creates an exclusive per-case lock, then runs exactly one
   `gh api --method POST ... --input <payload>` process without a shell. Before returning, it saves
   the review ID, event, and attempt in `delivery-create.json`. An uncertain outcome is recorded as
   `INDETERMINATE`. The lock stays in place: never retry the helper or create the review another way,
   even if reading the posted review fails.

   After a successful create, invoke the benchmark-owned read-back exactly once:

   ```bash
   node benchmarks/woostack-review/benchmark.mjs read-delivery \
     --review-root <run-root>/cases/<case-id>/review \
     --request-payload <absolute-review-request.json> \
     --gh "$(command -v gh)" \
     --resolver <absolute-skill-root>/scripts/resolve-diff-line.sh
   ```

   `read-delivery` derives `fixture.json` from the review root unless `--fixture` supplies its
   explicit path. It invokes the absolute `gh` executable without a shell and performs only native
   GETs for the exact created review and its comments. It binds repository, PR, reviewed head,
   review ID, mapped event/state, native actor, request body, and exactly one native comment to each
   finalized finding digest. Native line/side coordinates are preferred. A position-only GitHub
   response is accepted only when the immutable reviewed `diff.txt` deterministically maps it to
   the requested RIGHT-side changed line and the explicitly supplied shipped resolver validates
   that line; position alone is never evidence. The helper atomically creates
   `delivery-readback.json` only after every check succeeds. Controllers must not synthesize or
   compare anchors themselves, post, retry, or replace this artifact.

   The scorer requires exactly one POST-equivalent attempt, unique attempt and review IDs across
   the run, matching receipt/read-back IDs and events, and the state mapping `COMMENT` to
   `COMMENTED`, `APPROVE` to `APPROVED`, and `REQUEST_CHANGES` to `CHANGES_REQUESTED`.


   Count candidate-generation jobs from `swarm-metrics.json` and its receipts. Confirm adjudication
   from its single receipt and output files. Report first-pass failures, invalid candidates after
   retry, missing receipts, findings rejected by the adjudicator, and finalizer rejections separately.
   Do not use the retired prosecutor/defender counters.

4. Record exact stage intervals and closed OMP session bindings in
   `<run-root>/stage-timings.json`:

   ```json
   {
     "schemaVersion": 2,
     "sessions": [
       {"jobId":"benchmark/controller","role":"controller","sessionFile":"/exact/controller.jsonl","terminalEntryId":"terminal-id","closed":true},
       {"jobId":"cal-dot-com/bugs/attempt-1","role":"candidate","sessionFile":"/exact/candidate/session.jsonl","terminalEntryId":"terminal-id","closed":true,"argv":["/absolute/omp","--session-dir","/exact/candidate","--max-time","30m","-p","<prompt>"],"stdin":"ignore"},
       {"jobId":"cal-dot-com/adjudicator","role":"adjudicator","sessionFile":"/exact/adjudicator/session.jsonl","terminalEntryId":"terminal-id","closed":true,"argv":["/absolute/omp","--session-dir","/exact/adjudicator","--max-time","15m","-p","<prompt>"],"stdin":"ignore"},
       {"jobId":"judge/cal-dot-com--G01--C01","role":"judge","sessionFile":"/exact/judge/session.jsonl","terminalEntryId":"terminal-id","closed":true,"argv":["/absolute/omp","--session-dir","/exact/judge","--max-time","15m","-p","<prompt>"],"stdin":"ignore"}
     ],
     "startedAt": "2026-08-12T00:00:00.000Z",
     "completedAt": "2026-08-12T00:12:00.000Z",
     "stages": [
       {"caseId":"cal-dot-com","name":"candidate-generation","startedAt":"...","completedAt":"..."},
       {"caseId":"cal-dot-com","name":"adjudication","startedAt":"...","completedAt":"..."},
       {"caseId":null,"name":"semantic-judging","startedAt":"...","completedAt":"..."}
     ]
   }
   ```

   Supply exactly one candidate-generation and adjudication interval per manifest case and exactly
   one benchmark semantic-judging interval. Candidate generation must complete before that case's
   adjudication; all adjudication must complete before semantic judging. The controller writes
   one-to-one bindings that exactly cover every first/retry candidate attempt, every adjudicator,
   and every `judge-plan.json` pair. After the controller exits, `run.sh` appends its separately
   captured `benchmark/controller` binding from the create-new `--session-dir`. Every nested binding
   is emitted by `launch-nested` after the owned child process exits successfully. It names the
   exact closed session file and terminal assistant entry, the complete actual OMP `argv`, and
   `stdin: "ignore"`. Its one absolute `--session-dir` contains the session file and its
   one `--max-time` is `30m` for candidates or `15m` for adjudicators and judges. A caller
   attestation, prompt assertion, time window, nearest session, partial ingestion, or incomplete
   aggregate is invalid.

5. Save the candidate list and golden/candidate pairs that judges will compare:

   ```bash
   node benchmarks/woostack-review/benchmark.mjs plan \
     --run-root /tmp/woostack-review-five-pr/<run-id>

   ```
   Launch every nested process through the helper; never invoke nested OMP directly:

   ```bash
   node benchmarks/woostack-review/benchmark.mjs launch-nested \
     --role <candidate|adjudicator|judge> \
     --job-id <exact-job-id> \
     --session-dir <create-new-absolute-session-dir> \
     --executable "$(command -v omp)" \
     -- <all-other-omp-arguments>
   ```

   The helper creates a new session directory and sets a `30m` timeout for candidates or `15m` for
   adjudicators and judges. It ignores stdin, captures stdout/stderr, and waits for the process to exit.
   It stops on a nonzero exit, an existing session directory, anything other than one JSONL session,
   or a session without a final assistant entry.
   Append its JSON output unchanged to `stage-timings.json`. The helper derives these records from
   the actual process and session; callers must not supply their own claims about the timeout,
   stdin, process closure, session file, or final entry.

   Every candidate is exactly `<title>. <description>` in retained finding order. Before dispatch,
   write one `judge-contract.json` pinning provider, model, agent type, tier, and effort for the
   entire run. Dispatch every `judge-plan.json` pair to a fresh isolated judge using its prompt
   verbatim. Beside each decision, retain a `.receipt.json` binding pair ID, prompt and decision
   SHA-256, exact session file and terminal entry, and every pinned contract field. The scorer
   verifies the receipt against the decision, plan, session manifest, terminal OMP usage record,
   and common judge contract.

6. Exit the controller after every upstream artifact, decision, and worker/judge closed-session
   binding exists. `run.sh` waits for that OMP process to exit, resolves the one session file and
   terminal assistant entry from its create-new session directory, appends the closed controller
   binding, and only then invokes scoring. The scorer uses exact `stats.db` rows when OMP has indexed
   the bound custom session paths; if none are indexed, it reads those exact session JSONL records:

   ```bash
   node benchmarks/woostack-review/benchmark.mjs score \
     --run-root /tmp/woostack-review-five-pr/<run-id> \
     --usage-db "$HOME/.omp/stats.db"
   ```

The scorer stops before creating `result.json` if required evidence is missing, malformed,
duplicated, inconsistent, or incomplete. This includes manifests, receipts, review files, posted-review
read-backs, timings, session usage, judge settings, and judgments. Missing usage must not become zero
usage, and partial accounting is not success.
`result.json` must be a new file. Keep it with the manifest, corpus and skill inventory, review output
directories, fixture and delivery records, timings and session links, judge files, and usage-source identity.

## Result schema and authoritative sources

`result.json` schema version 2 preserves `tp`, `fp`, `fn`, `excludedMatched`, `precision`, `recall`,
`f1`, `f2`, `cases`, `profile`, `benchmark`, and `complete`, and adds:

| Field | Meaning | Authoritative input |
| --- | --- | --- |
| `cohort`, `runId` | Exact directional run identity | `manifest.json` |
| `accounting.jobs.candidateGeneration` | Planned, attempted, retried, completed jobs | Per-case `swarm-metrics.json` + candidate receipts |
| `accounting.jobs.adjudication` | Planned, attempted, completed sole-adjudicator jobs | Manifest case set + adjudicator receipts/artifacts |
| `accounting.rejectionReasons` | Complete rejection/failure counts by stage boundary | Swarm metrics and raw/adjudicated/final artifact deltas |
| `accounting.timing.stageCompletedAt`, `.completedAt`, `.durationsMs` | Controller-reported final stage boundary; scorer completion after exact usage ingestion; candidate-generation, adjudication, semantic-judging, and end-to-end wall durations | `stage-timings.json` intervals + scorer clock immediately before create-new result |
| `accounting.usage` | Exact job/session bindings, requests, input/output/cache-read/cache-write tokens, cost, error requests, model/provider/agent breakdown | Exact bound session rows in OMP `stats.db`, or the same immutable message usage records in those session JSONL files when the database contains none |
| `comparison.checks`, `comparison.passed` | Per-threshold observed value/operator/result and aggregate result | Existing score fields + wall duration + exact bound-session cost |

`accounting.complete` and top-level `complete` are true only in a created result; blocked runs have
no result. Cost is the sum of observed model-reported costs for the exact bound session set, not an estimate.
Every model breakdown retains provider, model, agent type, requests, tokens, and cost.

## Directional thresholds

All checks must pass:

| Metric | Required development result | Historical five-PR baseline |
| --- | ---: | ---: |
| False positives | `< 8` | 8 |
| Precision | `> 33.3%` | 33.3% (4/12 accepted signal) |
| True positives | `>= 4` | 4 |
| Recall | `>= 33.3%` | 33.3% |
| F2 | `>= 33.3%` | 33.3% |
| Wall time | `< 19m 17.335s` (`1,157,335 ms`) | 38m 34.670s |
| Exact bound-session model cost | `< $79.5203485` | $159.040697 |

A failed check means the change did not meet the benchmark's development threshold. Report the
first failure and keep the run files. Do not report a passing result, variation across runs, or a
larger benchmark score.

## Historical five-PR runs

Keep completed runs here in chronological order. Record the run identity and exact skill hashes,
not just the branch or PR. A failed run is still useful historical evidence. Passing a narrower
change-specific check does not mean the benchmark passed.

| Date | Run | TP / FP / FN | Precision / recall / F2 | Wall time | Exact cost | Directional gate |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 2026-08-12 | Retained baseline | 4 / 8 / 8 | 33.3% / 33.3% / 33.3% | 38m 34.670s | $159.040697 | Baseline |
| 2026-08-13 | `woo189-20260813i` | 3 / 6 / 9 | 33.3% / 25.0% / 26.3% | 34m 17.903s | $15.022457 | Failed |
| 2026-08-14 | `woo-fp-e5ec6afc-tmp2` | 3 / 2 / 9 | 60.0% / 25.0% / 28.3% | 9m 43.285s | $15.6895778 | Failed |

### Retained baseline (2026-08-12)

The retained baseline used `woostack-review` revision
`249522f3f3f0a33949b28c0515e8db62ef66b413` on Oh My Pi across the five rank-one fixtures. It
recorded 38 first-pass candidate-generation jobs, 10 validator jobs in the then-current workflow,
38 semantic judgments against 15 goldens, 12 accepted findings, and complete native posting/read-
back. Core quality was 4 TP, 8 FP, and 8 FN: 33.3% precision, recall, F1, and F2, with zero missing
or malformed judgments.

Wall time was 38 minutes 34.670 seconds. Exact controller-session OMP accounting was $159.040697
across 1,427 model requests: 12,425,670 input tokens, 300,971 output tokens, and 186,126,720
cache-read tokens. This is one historical observation under the retired workflow, not a price
forecast, release distribution, ten-PR result, or 50-PR result.

### Single-adjudicator run (2026-08-13)

Run `woo189-20260813i` captured skill fingerprint
`sha256:52297cb08f418683c5bc0ea89b7c08412f95aaba6b5e455ebf0af2e6aba0400c`.
It completed 17 candidate-generation jobs, five adjudications, native delivery read-back, semantic
judging, and exact accounting. The result was 3 TP, 6 FP, and 9 FN: 33.3% precision, 25.0% recall,
28.6% F1, and 26.3% F2.

Wall time was 34 minutes 17.903 seconds. Exact accounting was $15.022457 across 395 model requests:
1,339,867 input tokens, 74,903 output tokens, and 12,152,064 cache-read tokens. The run reduced cost
but did not clear the directional gate: TP, recall, F2, and wall time failed their thresholds.

### Absence-only test-gap evidence gate (2026-08-14)

Run `woo-fp-e5ec6afc-tmp2` captured skill fingerprint
`sha256:df0cc38a3de1ec0dee7adc32b8659b8bbe564ebd228a8565855d2d00c85321bf`.
It completed 17 candidate-generation jobs, five adjudications, native delivery read-back, semantic
judging, and exact accounting. Tightening candidate admission and adjudication for absence-only
test-gap claims changed the result to 3 TP, 2 FP, and 9 FN: 60.0% precision, 25.0% recall, 35.3% F1,
and 28.3% F2.

Wall time was 9 minutes 43.285 seconds. Exact accounting was $15.6895778 across 407 model requests:
1,355,827 input tokens, 85,497 output tokens, and 13,687,296 cache-read tokens. Compared with the
2026-08-13 run, false positives fell from 6 to 2 while TP, FN, and recall were unchanged. The run
still did not clear the benchmark's directional gate because TP, recall, and F2 remained below
their thresholds; `comparison.passed` is `false`.
