# Staging Observability Wiring Baseline

This directory provides staging wiring artifacts for the existing observability
baselines in `infrastructure/observability/`.

## Artifacts

- `kustomization.yaml` — generates ConfigMaps from canonical baseline files:
  - `../prometheus-alerts.yml`
  - `../otel-collector-config.yaml`
  - `../grafana/*.dashboard.json`
- `otel-collector.deployment.yaml` — baseline OTEL collector deployment for staging.
- `grafana-provisioning.configmap.yaml` — Grafana datasource and dashboard provider provisioning baseline.
- `prometheus.values.staging.yaml` — Helm values baseline for Prometheus alert rule mounting.
- `grafana.values.staging.yaml` — Helm values baseline for Grafana provisioning/dashboard mounts.

## Apply Sequence (Staging)

1. Generate and apply baseline ConfigMaps + OTEL deployment + Grafana provisioning:

   ```bash
   kubectl apply -k infrastructure/observability/staging
   ```

2. Apply Prometheus chart values baseline:

   ```bash
   helm upgrade --install prometheus prometheus-community/prometheus \
     --namespace neurologix-observability \
     -f infrastructure/observability/staging/prometheus.values.staging.yaml
   ```

3. Apply Grafana chart values baseline:

   ```bash
   helm upgrade --install grafana grafana/grafana \
     --namespace neurologix-observability \
     -f infrastructure/observability/staging/grafana.values.staging.yaml
   ```

## Verification

```bash
kubectl get configmap -n neurologix-observability | grep neurologix-
kubectl get deploy -n neurologix-observability otel-collector
kubectl logs -n neurologix-observability deploy/otel-collector --tail=50
```

Grafana checks:

- Datasources include `Prometheus` and `Jaeger`.
- Dashboard provider `neurologix-observability` is present.
- Baseline dashboards render without query errors.

## Evidence Capture

For every staging rollout, complete:

- `docs/runbooks/observability-staging-rollout-evidence.md`

Store the filled record in `planning/` with timestamped artifact references
(Prometheus logs, OTEL collector logs, Grafana verification outputs/screenshots).

## Notes

- These files are deployment baselines only; environment-specific endpoints,
  credentials, and TLS hardening are handled per-environment.
- Follow incident procedures in `docs/runbooks/observability-baseline.md`.