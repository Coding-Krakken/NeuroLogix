# Developer TODO

## Phase 1 Completion Status (as of 2026-03-11)

### Completed

- [x] Schema validation and broker topic governance (`@neurologix/schemas/broker`)
- [x] Broker ACL enforcement (`packages/schemas/src/broker/acl.ts`)
- [x] Broker runtime validation script (`scripts/validate-broker-runtime.js`)
- [x] Server contract baselines for all 5 services (site-registry, capability-registry, policy-engine, recipe-executor, digital-twin)
- [x] Consumer contract tests — mission-control (consumer + server API)
- [x] Broker consumer contract tests — adapters package
- [x] Federation API endpoints (SITE-005, FF-002, FF-003) — all 9 FEDERATION_API_CONTRACTS covered
- [x] ADR-010 contract testing strategy documented
- [x] Observability baseline stubs (Prometheus alert rules, OTEL collector config)
- [x] Grafana dashboard baseline stubs (control-plane, security-audit, mission-control-ui)
- [x] Observability baseline runbook
- [x] Release rollback runbook
- [x] Service incident triage playbooks per service (capability-registry, policy-engine, recipe-executor, digital-twin, site-registry)
- [x] CI contract-tests gate (mainline + release workflows)
- [x] Vitest coverage thresholds enforced repo-wide
- [x] ADR index and phase-0 gap-report reconciled
- [x] Lighthouse CI gate for mission-control in mainline CI
- [x] Safe-mode activation procedure runbook (Phase 7)
- [x] PLC interlock override checklist runbook (Phase 7)
- [x] Staging observability wiring artifact baseline (Prometheus alert integration values, OTEL collector deployment baseline, Grafana provisioning baseline)

## Active / Near Term

- Apply staging observability wiring artifacts and capture rollout evidence in staging (Phase 7)

## Quality Targets

- Keep CI green on `main`.
- Preserve coverage thresholds and model-first validation gates.
- Prometheus alert rules must remain aligned with OBS-001 (`observability_model.yaml`).