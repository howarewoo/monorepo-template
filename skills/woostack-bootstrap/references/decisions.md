# Decisions & Questionnaire Protocol

Every technology choice must follow the user's project goals and constraints. Run this protocol
before creating or scaffolding files; woostack supplies no built-in stack defaults.

The canonical sequence and complete-design approval gate live in
[`../SKILL.md#procedure`](../SKILL.md#procedure). This reference guides the questions and design
presentation, not target access or write admission.

## Requirements questionnaire

Ask only questions that discriminate among viable options. A concise prompt may cover:

1. Expected traffic, latency, real-time, edge, offline, or background-work requirements.
2. Hosting restrictions, portability needs, regions, and operational ownership.
3. Data shape, consistency, search, retention, backup, and object-storage needs.
4. Authentication, authorization, privacy, and compliance requirements.
5. External integrations, observability, budget, and team familiarity.

Validate a supplied stack against the requirements and current authoritative sources; research
compatible choices for undecided parts. Present the coherent design when that stack is viable.
Compare alternatives only where a material tradeoff remains unresolved.

## Design presentation

Ground the complete architecture and initial scope in live research. Include:

```markdown
### Proposed architecture
- **Components:** <named language, frameworks, data, identity, hosting, and observability choices>
- **Fit:** <requirements this option satisfies>
- **Trade-offs:** <complexity, performance, scaling, portability or lock-in>
- **Production readiness:** <security, recovery, deployment, and monitoring implications>
- **Estimated cost:** <current assumptions and material thresholds>
- **Versions and sources:** <live registry results and authoritative references>
```
