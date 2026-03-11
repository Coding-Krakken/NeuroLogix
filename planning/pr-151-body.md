## Summary
Adds a minimal Phase 7 staging observability rollout evidence scaffold so each staging rollout has a durable, repeatable verification record.

## What changed
- Added rollout evidence template:
  - `docs/runbooks/observability-staging-rollout-evidence.md`
- Linked required evidence capture from:
  - `docs/runbooks/observability-staging-wiring.md`
  - `docs/runbooks/README.md`
  - `infrastructure/observability/staging/README.md`
- Updated `.developer/TODO.md` to mark scaffold completion and set next executable step.
- Added cycle example evidence record:
  - `planning/staging-observability-evidence-issue-151.md`

## Validation
- `npm run lint` (passes; existing warnings unchanged)
- `npm run type-check` (passes)

## Scope and risk
- Docs/planning only.
- No runtime behavior, deployment manifests, or CI workflow logic changes.

Closes #151
