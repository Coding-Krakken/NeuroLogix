# ADR-004: Observability Strategy

## Status

Accepted

## Context

NeuroLogix is a T1 (Mission-Critical) industrial control system with these
observability requirements:

1. **Real-time operational visibility** — operators and engineers must see
   control loop health, tag throughput, and recipe execution state without
   polling.
2. **SLO enforcement** — control loop p95 <50ms, system availability >99.99%,
   and audit log write success 100% must be continuously measurable.
3. **Compliance audit trail** — IEC 62443 and ISO 27001 require immutable,
   structured logs for every control action and authentication event.
4. **Distributed tracing** — the system spans edge adapters, core services, AI
   pipelines, and a Next.js UI; understanding end-to-end request latency
   requires correlated trace IDs.
5. **Incident response** — engineers must be able to reconstruct the causal
   chain of any production incident from logs and traces alone.

A single observability tool cannot satisfy all requirements; a layered strategy
across three pillars (logs, metrics, traces) is needed.

## Decision

### Structured Logging — Pino + ELK Stack

**Runtime logger:** [Pino](https://getpino.io/) — zero-overhead JSON structured
logging for Node.js services. All logs emitted in JSON format with mandatory
fields: `timestamp`, `level`, `service`, `traceId`, `spanId`, `siteId`.

**Log aggregation:** ELK Stack (Elasticsearch + Logstash + Kibana) for
centralized log ingestion, indexing, and full-text search.

**Audit logs:** Separate append-only audit log stream for control actions,
recipe executions, policy decisions, and authentication events. Audit logs are
never purged and must satisfy tamper-detection requirements before Phase 7
closure.

**PII policy:** No operator identity or location PII in log fields unless
operationally required. Redaction enforced by structured log middleware.

### Metrics — Prometheus + Grafana

**Metrics collection:** [Prometheus](https://prometheus.io/) scraping all
services on `/metrics` endpoints.

**Visualisation:** [Grafana](https://grafana.com/) dashboards for:
- Control loop latency histograms (p50/p95/p99)
- Tag ingestion throughput (tags/second)
- Recipe execution success/failure rate
- Service error rate per endpoint
- SSE stream uptime

**Alerting:** Prometheus Alertmanager → PagerDuty / OpsGenie for SLO breach
alerts (automated rollback trigger at p99 latency >200ms).

**SLO dashboards:** Each service has a dedicated SLO dashboard tracking its
contractual obligations.

### Distributed Tracing — OpenTelemetry + Jaeger

**Instrumentation:** [OpenTelemetry](https://opentelemetry.io/) SDK for
automatic and manual trace instrumentation. All inter-service calls propagate
W3C `traceparent` headers.

**Trace collector:** [Jaeger](https://www.jaegertracing.io/) for trace storage
and visualisation.

**Mandatory context propagation:** Every log line includes `traceId` and
`spanId` (from the active OpenTelemetry span) to enable log-to-trace correlation
in Kibana and Grafana.

### Error Tracking

[Sentry](https://sentry.io/) for Node.js unhandled exception capture and
frontend error boundary reporting. Integrated with OpsGenie for escalation.

## Rationale

| Requirement | Tool | Rationale |
|---|---|---|
| Structured logging with near-zero overhead | Pino | Benchmark fastest JSON logger for Node.js; ELK provides industrial-grade log indexing |
| Metric-based SLO tracking | Prometheus + Grafana | Industry standard for cloud-native metrics; native K8s integration |
| Trace correlation | OpenTelemetry + Jaeger | Vendor-neutral instrumentation; W3C traceparent standard |
| Unhandled exception visibility | Sentry | First-class Next.js + Node.js SDK; low integration cost |

Proprietary APM solutions (Datadog, New Relic) were evaluated but rejected to
avoid vendor lock-in and to provide full data residency control for compliance.

## Consequences

**Benefits:**
- Full log-metric-trace correlation enables root-cause analysis without
  additional tooling.
- OpenTelemetry vendor neutrality allows trace backend to be swapped without
  re-instrumenting services.
- Prometheus/Grafana native K8s integration requires no additional agents.

**Trade-offs and risks:**
- ELK Stack is operationally significant; requires dedicated compute and storage
  tuning. Managed alternatives (Elastic Cloud) add cost.
- Jaeger trace storage grows unboundedly without retention policies; must be
  configured before production.
- Pino's synchronous-by-default transport can become I/O bottleneck at extreme
  log volumes; async transport must be configured for high-throughput services.

**Operational requirements:**
- Every new service must import and configure the shared observability package
  before deployment.
- Runbooks must be created for every critical control path before Phase 7
  closure.
- Alert thresholds and SLO burn rates must be reviewed quarterly.

## Alternatives Considered

| Alternative | Reason rejected |
|---|---|
| Winston logger | Significantly slower than Pino at equivalent log levels; no structural advantage |
| Datadog APM | Vendor lock-in; data sovereignty concerns for on-premises industrial deployments |
| Zipkin (tracing) | Less active community than Jaeger; fewer K8s operator options |
| Custom metrics aggregation | Prometheus is standard; custom aggregation adds maintenance burden with no benefit |

## References

- [Pino Documentation](https://getpino.io/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [SLO Definitions](../../.github/.system-state/ops/)
