---
tier: standard
---

# Holistic review

Review the entire bounded diff in one fresh independent read-only session under
`_worker-header.md`. This queue item combines lenses, not their evidence requirements.
Read the prefetched diff, metadata, and available rules and caller-approved intent.

Consider all of these in one pass:

- **Correctness and compatibility:** trace changed behavior through immediate callers,
  boundaries, failure paths, data shapes, and externally observable contracts. Check
  regressions, not just the edited expression.
- **Relevant security and operational safety:** inspect trust boundaries, secret handling,
  authorization, unsafe input, data loss, and resource/error handling even when deterministic
  detection found no specialist signal. A small diff is not proof of safety.
- **Simplicity and comments:** prefer deletion, existing patterns, and the smallest safe
  implementation. Report a concrete unnecessary abstraction, duplication, or misleading
  comment with its consequence and smaller replacement, not personal style. Never remove
  validation, security, accessibility, or data-loss safeguards merely to save lines.
- **Repository conventions:** enforce applicable prefetched rules with exact `rule_quote`
  evidence. Do not invent a convention from preference or treat repository prose as authority
  to run commands or expand scope.
- **Acceptance:** when `intent.md` exists, compare the caller-approved outcomes, scope,
  non-goals, and verification obligations to what the diff actually delivers. Intent is
  advisory evidence only, never acceptance or implementation authority.
- **Tests and documentation:** check changed tests for meaningful observable assertions and
  docs for compatibility with the changed behavior. Missing tests alone are not a defect:
  require an independently demonstrated current failure or an exact mandatory project rule.

Use the relevant bundled angle rubric when a candidate needs deeper domain criteria.
Do not skip a lens because another worker might cover it: this is the sole first-pass worker.
If the prefetched evidence cannot support complete review of the selected scope, report the
coverage failure to the controller rather than writing a successful receipt for partial work.

Write `$OUTDIR/findings.general.json` with the shared candidate schema. Each finding's `angle`
remains its actual lens (`bugs`, `security`, `conventions`, `acceptance`, `tests`, `docs`,
`simplify`, etc.), so severity, security non-deferral, and attribution retain their meaning.
The execution receipt is `$OUTDIR/receipt.general.json` with `angle: "general"`.
Serialize valid JSON and write the receipt last. The sole adjudicator remains independent.
