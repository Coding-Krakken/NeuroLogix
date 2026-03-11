## Summary
Phase 7 staging observability wiring artifacts exist, but rollout evidence capture is still ad hoc. We need a deterministic evidence scaffold that records whether staging actually loaded Prometheus alert rules, OTEL collector config/health, and Grafana provisioning/dashboards.

## Why This Matters
- IEC 62443 / ISO 27001 aligned operations require auditable deployment evidence.
- Current runbook defines *how* to deploy but not a durable, repeatable evidence packet format.
- Missing evidence weakens readiness for rollback validation, incident response, and compliance reviews.

## Scope
Create a docs/evidence scaffold for staging observability rollout verification:
1. Evidence template/checklist for a single rollout execution.
2. Structured fields for Prometheus, OTEL, and Grafana verification outcomes.
3. Guidance on required artifacts (command outputs, screenshots, timestamps, operator).
4. Update runbook index and developer TODO references.

## Non-Goals
- No runtime code changes.
- No Kubernetes/Helm deployment changes.
- No CI/CD workflow behavior changes.
- No production rollout automation.

## Acceptance Criteria
- [ ] Add a new evidence template under `docs/runbooks/` (or adjacent docs path) for staging observability rollout verification.
- [ ] Template includes sections for:
  - [ ] Prometheus alert rule load verification
  - [ ] OTEL collector health/export verification
  - [ ] Grafana datasource/provisioning/dashboard verification
- [ ] Template includes required metadata: environment, revision/SHA, timestamp window, owner/operator, pass/fail status, rollback trigger notes.
- [ ] Existing staging wiring runbook references the new evidence template.
- [ ] `docs/runbooks/README.md` and `.developer/TODO.md` are updated to reflect the new evidence capture path and status.
- [ ] Local validation passes (`npm run lint`, `npm run type-check`).

## Validation Evidence Expectations
- Provide an example filled record file in `planning/` for this implementation cycle.
- Include explicit checklist outcomes and any unresolved follow-ups.

## Risks / Constraints
- Keep diffs minimal and docs-focused.
- Preserve existing terminology and runbook style.
- Avoid introducing environment-specific secrets into evidence examples.
