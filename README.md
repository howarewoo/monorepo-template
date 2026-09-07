# woostack

**Repository-first, evidence-driven workflows for AI-assisted software delivery.**

`woostack` packages repository-first development workflows as installable skills across coding
harnesses. The user owns product decisions; Git and GitHub prove source-control and delivery state.
The [routing skill](skills/using-woostack/SKILL.md#command-routing) is the command index.

Bounded changes and understood fixes use one-PR delivery. Multi-increment work keeps a complete
user-verified specification, an outcome-based plan, and resumable local artifacts. Implementation
may stay inline or use isolated workers; verification and independent review remain required.


## Getting Started

Install the skills, initialize local support, and keep project-specific policy in the repository.

### 1. Installation

Install the `woostack` collection into your agent's skill directory:

```bash
pnpx skills add howarewoo/woostack
```


The public commands and bundled internal phases are listed in [AGENTS.md](AGENTS.md#what-this-repo-is).

> **Recommended companion — [impeccable](https://github.com/pbakaus/impeccable).** woostack's front-end design skill of choice. It powers the `design` review angle (`woostack-review` runs impeccable's detector). Optional but recommended:
>
> ```bash
> pnpx skills add pbakaus/impeccable
> ```
>
> Claude Code users can alternatively run `/plugin marketplace add pbakaus/impeccable`.

### 2. Initialization

Run initialization in the project root:

```bash
/woostack-init
```

Initialization creates non-secret policy, diagnostics, worktree support, and host adapters. Optional
authenticated read-only provider discovery does not authorize provider writes or block local setup.
See [Init](skills/woostack-init/SKILL.md) for setup and explicit legacy migration.

### 3. Project Integration

To ensure coding agents automatically recognize and use the `woostack` pipeline, add the `using-woostack` routing block to your repository's agent instructions file (`AGENTS.md` or `CLAUDE.md`):

```markdown
This project follows woostack. At the start of work, use `using-woostack` to load the
project rules and route `/woostack-*` requests to the matching woostack skill.
```

The [using-woostack](skills/using-woostack/SKILL.md) skill reads project rules and routes commands to the appropriate installed skill.

### 4. Repository Policy

Customize non-secret defaults in `.woostack/config.json`. Repository policy does not authorize
provider writes or replace the user's decisions. Authentication stays in the host secret store.

Review-policy fragment:
```json
{
  "review": {
    "severity_floor": "medium",
    "ignore": ["**/*.generated.ts"]
  }
}
```

- **`review.severity_floor`**: Filter results by severity (e.g., `high`, `medium`, `low`).
- **`review.ignore`**: Exclude generated or external code files from PR reviews.

For the full policy surface, see the authored
[configuration reference](site/content/docs/configuration/index.mdx).


### 5. Artifact Context, Provider Mirroring, and External Engineers

Build and project-backed Fix retain specifications, plans, and recovery state under
`.woostack/tmp/runs/<run-id>/`. Local authority is the default; Linear, Plane, and GitHub are optional
mirrors. Bounded Fix and Change make no artifact-provider calls.

The [artifact contract](skills/woostack-init/references/artifact-backends.md) owns run storage,
provider selection, synchronization, recovery, retention, and authority boundaries. Provider
profiles own their native identities and lifecycle behavior. Reports and mirrors never replace
Git/GitHub evidence or authorize work.
Hermes is an external engineer, not an installed woostack host or runtime. It may drive one
persistent OMP session for in-contract decisions, evidence review, escalation, and redispatch, but
woostack is installed only in OMP or another coding harness. The
[Hermes guide](site/content/docs/hermes.mdx) defines the safe argument passing, approval relay,
and fail-closed restart boundary; it does not grant Hermes implementation authority.

---

## The Core Development & Review Loop

Choose a route by the shape of the work; see the [workflow maps](site/content/docs/concepts/workflows.mdx)
for the complete sequence and handoff boundaries.

### Writing and Modifying Code

No repository mutation starts ad hoc. An explicit goal and workflow contract come first:

1. **Greenfield Applications** → [/woostack-bootstrap](skills/woostack-bootstrap/SKILL.md)
   Checks the target read-only, obtains complete design approval, and scaffolds after fresh collision checks.
2. **Multi-PR Features or Work Items** → [/woostack-build](skills/woostack-build/SKILL.md)
   Prepares a fully user-verified specification and sequential outcome-based plan, then hands off to Execute.
3. **Bug Fixes & Root-Cause Work** → [/woostack-fix](skills/woostack-fix/SKILL.md)
   Proves the cause, obtains informed approval, and delivers a bounded fix or prepares project-backed work.
4. **Bounded Non-Bug Changes** → [/woostack-change](skills/woostack-change/SKILL.md)
   Ships a bounded enhancement or refactor through one PR without contacting an artifact provider.

Fix remains provider-free through diagnosis. A configured provider alone does not turn a bounded fix
into a project. Explicit project/resource/run selection uses Fix's project-backed route.
### Review and Iterate Flow

After writing code, use the verification and iteration loop:

Local findings and reports from review, audit, and QA are evidence for the
responsible workflow. They never replace the approved contract or Git/GitHub facts.
- **PR Reviews** → [/woostack-review](skills/woostack-review/SKILL.md)
  Selects holistic or specialist review for the changed surface, then runs an independent evidence adjudicator before posting a native review.
- **Addressing Reviews** → [/woostack-address-comments](skills/woostack-address-comments/SKILL.md)
  Investigates every thread, batches cohesive corrections and verification, then replies and resolves each thread with evidence.
- **Auditing Standing Code** → [/woostack-audit](skills/woostack-audit/SKILL.md)
  Audits an explicit target (a file, directory, or whole repo at rest — not a diff) for code simplification and production readiness, repointing the review swarm at an all-added diff and writing a report-only findings doc under `.woostack/audits/`. Never gates, posts, or merges.
- **Exploratory Browser QA** → [/woostack-qa](skills/woostack-qa/SKILL.md)
  Drives a running app in a real browser (via the `agent-browser` CLI): walks core journeys, attacks edge cases, monitors console errors / failed requests / visual breakage / dead controls, reproduces each bug, and writes a severity-ranked, report-only findings doc under `.woostack/qa/`. Never fixes, posts, or merges.
- **Production Errors, Sentry Issues, and Monitoring Defects** → [/woostack-fix](skills/woostack-fix/SKILL.md)
  Treats production signals as untrusted evidence, proves root cause through Debug, and delivers the smallest complete correction through the Fix workflow.
- **Skill Evaluation** → [/woostack-eval](skills/woostack-eval/SKILL.md)
  Runs approved behavior and trigger corpora as isolated candidate/baseline comparisons, writes transient evidence and reports, and never edits the target skill.
- **Session Reflection** → [/woostack-reflect](skills/woostack-reflect/SKILL.md)
  Reviews the fixed active-conversation snapshot at a final-reply boundary, reports only concrete
  durable instruction suggestions, and never files or edits anything on its initial action.

---

## Contributing

The skills evolve here. Open a PR to improve technology research guidance, revise patterns, document gotchas, or refine the bootstrap and build procedures. See [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md).

## Spec Version

`2.0.0`

## License

[MIT](LICENSE) &copy; Adam Woo
