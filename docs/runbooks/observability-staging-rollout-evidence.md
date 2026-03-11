# Runbook Template: Observability Staging Rollout Evidence

**Purpose:** Capture auditable evidence for a single staging rollout of observability wiring.

Use this template for every rollout execution from `docs/runbooks/observability-staging-wiring.md`.
Store filled records in `planning/` with a date and issue/PR reference.

---

## Rollout Metadata

- **Environment:** staging
- **Date (UTC):**
- **Start Time (UTC):**
- **End Time (UTC):**
- **Operator / Owner:**
- **Issue / PR:**
- **Git SHA / Revision:**
- **Namespace:** `neurologix-observability`
- **Overall Status:** PASS / FAIL / PARTIAL

---

## Change Inputs

- `kubectl apply -k infrastructure/observability/staging` executed: YES / NO
- Prometheus release revision (before → after):
- Grafana release revision (before → after):
- OTEL collector image/tag:

---

## Prometheus Verification (Alert Rule Load)

### Required Checks

- [ ] `neurologix-prometheus-alert-rules` ConfigMap present.
- [ ] Prometheus server logs show successful rule load (no syntax/parsing errors).
- [ ] Target NeuroLogix alert groups visible/loaded.

### Evidence

- Command output references:
- Log excerpt references:
- Notes:
- **Status:** PASS / FAIL / PARTIAL

---

## OTEL Collector Verification (Health + Export)

### Required Checks

- [ ] OTEL collector deployment is ready.
- [ ] Collector logs show pipeline startup without fatal errors.
- [ ] Exporter activity observed for configured backends (Prometheus remote write / Jaeger / ELK as applicable).

### Evidence

- Command output references:
- Log excerpt references:
- Notes:
- **Status:** PASS / FAIL / PARTIAL

---

## Grafana Verification (Provisioning + Dashboards)

### Required Checks

- [ ] `neurologix-grafana-provisioning` ConfigMap present.
- [ ] Datasources include `Prometheus` and `Jaeger`.
- [ ] Dashboard provider `neurologix-observability` active.
- [ ] Dashboards render: `control-plane`, `security-audit`, `mission-control-ui`.

### Evidence

- UI/API verification references:
- Screenshot references:
- Notes:
- **Status:** PASS / FAIL / PARTIAL

---

## Rollback Trigger Review

- Were rollback triggers reached (`control loop p99 > 200ms`, `error rate > 0.5%`, `audit write failure`, `safety bypass attempt`)? YES / NO
- If YES, rollback action taken:
- Related incident/runbook references:

---

## Outcome Summary

- **Decision:** Keep rollout / Roll back / Partial rollback
- **Follow-up Actions:**
- **Owner + Due Date:**
- **Approver / Reviewer:**
