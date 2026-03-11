# Infrastructure: Observability Baseline

This directory contains observability infrastructure configuration for the
NeuroLogix platform.

## Contents

| File | Purpose |
|---|---|
| `prometheus-alerts.yml` | Prometheus alerting rules for all T1 SLOs (OBS-001) |
| `otel-collector-config.yaml` | OpenTelemetry Collector configuration stub |
| `grafana/*.dashboard.json` | Grafana dashboard baseline stubs aligned to OBS-001 dashboard panel intent |

## Status

**Baseline stub** — these files define the target configuration. They must be
wired into live Prometheus, OTEL collector deployment, and Grafana provisioning
in **Phase 7 (Security & Compliance)**.

## Architecture

```
Services (OTLP) ──► otel-collector ──► Jaeger (traces)
                                  ──► Prometheus (metrics)
                                  ──► Elasticsearch/ELK (logs)
Prometheus ◄── scraped /metrics endpoints (all services)
Prometheus ──► Alertmanager ──► PagerDuty / OpsGenie
```

## SLOs Covered by Alert Rules

Derived from `.github/.system-state/ops/observability_model.yaml` (OBS-001):

| Alert Group | SLO Target |
|---|---|
| System Availability | > 99.99% |
| Control Loop Latency p95 | < 50ms |
| Control Loop Latency p99 | < 100ms |
| Recipe Execution Success Rate | > 99.9% |
| Audit Log Write Success | 100% |
| Policy Decision Latency p95 | < 10ms |
| Digital Twin Sync Lag | < 200ms |
| Safety Interlock Bypass Events | 0 |

## Environment Variables (OTEL Collector)

| Variable | Default | Description |
|---|---|---|
| `JAEGER_ENDPOINT` | `jaeger:14317` | Jaeger gRPC collector |
| `ELASTICSEARCH_ENDPOINT` | `http://elasticsearch:9200` | ELK endpoint |
| `ELASTICSEARCH_USERNAME` | `elastic` | ELK auth username |
| `ELASTICSEARCH_PASSWORD` | `changeme` | ELK auth password — **must be set in production** |
| `PROMETHEUS_REMOTE_WRITE_ENDPOINT` | `http://prometheus:9090/api/v1/write` | Prometheus remote write |
| `DEPLOY_ENV` | `staging` | Deployment environment label |
| `CLOUD_REGION` | `local` | Cloud region label |

## References

- [Observability Strategy (ADR-004)](../../docs/architecture/ADR-004-observability-strategy.md)
- [Observability Baseline Runbook](../../docs/runbooks/observability-baseline.md)
- [Grafana Dashboard Baselines](./grafana/README.md)
- [OBS-001 Model](../../.github/.system-state/ops/observability_model.yaml)
