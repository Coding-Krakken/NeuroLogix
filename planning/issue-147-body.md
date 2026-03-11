## Summary
Add Grafana dashboard baseline stubs for the three OBS-001 dashboard groups and align runbook/index documentation so operators have a deterministic dashboard-to-alert/runbook mapping.

## Why it matters
Phase 7 observability now has alert rules and triage runbooks, but no dashboard artifacts in-repo to anchor visualization standards, ownership, and panel definitions. This creates drift risk between alerts, dashboards, and operator response guidance.

## Current behavior
- Prometheus alert rules exist in `infrastructure/observability/prometheus-alerts.yml`
- Observability runbook exists in `docs/runbooks/observability-baseline.md`
- No Grafana baseline dashboard stubs are versioned in `infrastructure/observability`

## Desired outcome
- Versioned dashboard JSON stubs for:
  - `control_plane`
  - `security_audit`
  - `mission_control_ui`
- Dashboard stubs map to panel intents defined in OBS-001.
- Runbook/index documentation references dashboard artifacts and usage.

## Scope
- Add Grafana dashboard baseline stubs under observability infrastructure.
- Add observability README/docs references to dashboard stubs.
- Update runbook index and developer TODO status to reflect completion.

## Non-goals
- Live Grafana deployment/provisioning to staging.
- Runtime datasource wiring.
- Pixel-perfect dashboard UX.

## Acceptance criteria
- [ ] Three dashboard JSON stubs exist and are valid JSON.
- [ ] Each dashboard includes panel placeholders aligned to OBS-001 `dashboards` section.
- [ ] `infrastructure/observability/README.md` documents dashboard stubs.
- [ ] `docs/runbooks/observability-baseline.md` references dashboard baseline usage.
- [ ] `docs/runbooks/README.md` and `.developer/TODO.md` are updated for status alignment.
- [ ] CI remains green.

## Validation
- Local JSON parse validation for new dashboard files.
- Repo lint/typecheck/test smoke to ensure no regressions.
- PR checks pass on GitHub Actions.
