# Runbook: Observability Staging Wiring

**Risk Tier:** T1 (Mission-Critical)  
**Maintained by:** Platform Engineering  
**Escalation:** SRE on-call → Platform owner  
**Model Source:** `.github/.system-state/ops/observability_model.yaml` (OBS-001)

---

## Overview

This runbook defines the staging procedure for wiring the existing observability
baselines into a deployable environment:

- Prometheus alert rules (`infrastructure/observability/prometheus-alerts.yml`)
- OTEL collector config (`infrastructure/observability/otel-collector-config.yaml`)
- Grafana dashboard baselines (`infrastructure/observability/grafana/*.dashboard.json`)

Deployment baseline artifacts are in `infrastructure/observability/staging/`.

---

## Preconditions

- Kubernetes staging namespace exists: `neurologix-observability`
- Helm repositories available:
  - `prometheus-community`
  - `grafana`
- Baseline observability files committed on target revision

---

## Procedure

1. Apply staging wiring bundle:

   ```bash
   kubectl apply -k infrastructure/observability/staging
   ```

2. Deploy/upgrade Prometheus with NeuroLogix alert rule mounts:

   ```bash
   helm upgrade --install prometheus prometheus-community/prometheus \
     --namespace neurologix-observability \
     -f infrastructure/observability/staging/prometheus.values.staging.yaml
   ```

3. Deploy/upgrade Grafana with provisioning + dashboard mounts:

   ```bash
   helm upgrade --install grafana grafana/grafana \
     --namespace neurologix-observability \
     -f infrastructure/observability/staging/grafana.values.staging.yaml
   ```

4. Verify OTEL collector deployment:

   ```bash
   kubectl get deploy -n neurologix-observability otel-collector
   kubectl logs -n neurologix-observability deploy/otel-collector --tail=100
   ```

---

## Verification Checklist

- `neurologix-prometheus-alert-rules` ConfigMap exists in namespace.
- `neurologix-otel-collector-config` ConfigMap exists and is mounted by OTEL collector.
- `neurologix-grafana-dashboards` and `neurologix-grafana-provisioning` ConfigMaps exist.
- Prometheus loads NeuroLogix alert rules without syntax errors.
- Grafana shows datasources `Prometheus` and `Jaeger`.
- Grafana dashboard provider `neurologix-observability` is active.
- Baseline dashboards (`control-plane`, `security-audit`, `mission-control-ui`) render.

---

## Rollout Evidence Capture (Required)

For every staging rollout, create a filled evidence record using:

- `docs/runbooks/observability-staging-rollout-evidence.md`

Store execution-specific evidence under `planning/` and include:

- command outputs for Prometheus rule load and active alerts,
- OTEL collector health and exporter signals,
- Grafana datasource/provider verification plus dashboard load checks,
- operator, timestamp window, Git SHA/revision, and rollback trigger decisions.

Recommended verification commands:

```bash
kubectl get configmap -n neurologix-observability neurologix-prometheus-alert-rules -o yaml
kubectl logs -n neurologix-observability deploy/prometheus-server --tail=200 | grep -i "rule"
kubectl logs -n neurologix-observability deploy/otel-collector --tail=200
kubectl get pods -n neurologix-observability -l app.kubernetes.io/name=grafana
```

---

## Failure Handling

- If Prometheus fails after values rollout, revert to prior release revision:

  ```bash
  helm rollback prometheus <REVISION> -n neurologix-observability
  ```

- If Grafana provisioning fails, rollback release and verify provisioning file mounts.
- If OTEL collector fails health checks, inspect env var and endpoint wiring first.

For broader release rollback procedures, use
`docs/runbooks/release-rollback.md`.