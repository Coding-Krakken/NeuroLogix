# Operations Runbooks

## Purpose

This directory contains operational runbooks for incident response, service
recovery, and safe-mode procedures.

## Runbooks

| Runbook                                                                                  | Scope                                                                                                                                                     | Status |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| [release-rollback.md](./release-rollback.md)                                             | Production + staging Helm rollback, automated and manual rollback procedures                                                                              | Active |
| [observability-baseline.md](./observability-baseline.md)                                 | Alert triage, availability, control-loop latency, audit log, policy engine, safety interlock procedures                                                   | Active |
| [observability-staging-wiring.md](./observability-staging-wiring.md)                     | Staging wiring procedure for Prometheus alert rules, OTEL collector deployment baseline, and Grafana provisioning baseline                                | Active |
| [observability-staging-rollout-evidence.md](./observability-staging-rollout-evidence.md) | Required evidence template for staging rollout verification of Prometheus, OTEL, and Grafana wiring                                                       | Active |
| [capability-registry-triage.md](./capability-registry-triage.md)                         | Incident triage for capability lifecycle, health checks, and registry recovery                                                                            | Active |
| [policy-engine-triage.md](./policy-engine-triage.md)                                     | Incident triage for policy evaluation latency, decision anomalies, and safety escalation                                                                  | Active |
| [recipe-executor-triage.md](./recipe-executor-triage.md)                                 | Incident triage for recipe execution failures, stalled progress, and safety-guarded recovery                                                              | Active |
| [digital-twin-triage.md](./digital-twin-triage.md)                                       | Incident triage for twin state ingestion, simulation failures, and sync lag recovery                                                                      | Active |
| [site-registry-triage.md](./site-registry-triage.md)                                     | Incident triage for provisioning, feature flags, and federation topology integrity                                                                        | Active |
| [safe-mode-activation.md](./safe-mode-activation.md)                                     | Full platform safe-mode activation, service suspension sequence, hardware interlock verification, and controlled recovery                                 | Active |
| [plc-interlock-override-checklist.md](./plc-interlock-override-checklist.md)             | Temporary PLC interlock override authorization, execution guardrails, abort criteria, and audit evidence checklist                                        | Active |
| [mission-control-e2e-validation.md](./mission-control-e2e-validation.md)                 | Deterministic Playwright baseline for critical Mission Control policy-gated dispatch journey and CI E2E gate behavior                                     | Active |
| [audit-chain-validation.md](./audit-chain-validation.md)                                 | Audit log hash-chain integrity validation, tampering detection, incident response, and non-repudiation assurance (IEC 62443 SR 2.12 / SR 3.9)             | Active |
| [session-replay-protection.md](./session-replay-protection.md)                           | Replay attack detection, nonce/timestamp rejection triage, clock-skew resolution, and capacity tuning (IEC 62443 SR 3.1 / SR 2.12)                        | Active |
| [mtls-mesh-policy-validation.md](./mtls-mesh-policy-validation.md)                       | STRICT mTLS and AuthorizationPolicy verification, incident response, and evidence capture for trust-zone enforcement (IEC 62443 SR 1.2 / SR 3.1 / SR 5.2) | Active |

## Related Guidance

Operational guidance also lives in:

- `docs/runbooks/` — platform-wide and service-specific triage runbooks
- `.developer/RELEASE.md` — full release checklist and rollback triggers
- `infrastructure/observability/grafana/` — baseline Grafana dashboard stubs
  aligned to OBS-001
- GitHub Actions CI `Benchmark` job artifact
  `benchmark-evidence-<run_id>-<run_attempt>` — benchmark suite JSON evidence
  from `benchmark-results/`
- planning validation and closure records under `planning/`

## Near-Term Contents

- Execute a staging rollout using `observability-staging-wiring.md` and capture
  a filled evidence record from `observability-staging-rollout-evidence.md`
  under `planning/`.

## Related Architecture Evidence

- [ADR-004: Observability Strategy](../architecture/ADR-004-observability-strategy.md)
- [Phase 0 Gap Report](../architecture/phase-0-gap-report.md)
