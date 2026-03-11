# Runbook: Observability Baseline

**Risk Tier:** T1 (Mission-Critical)  
**Maintained by:** Platform Engineering  
**Escalation:** PagerDuty → OpsGenie → on-call SRE  
**Alert Rules Source:** `infrastructure/observability/prometheus-alerts.yml`  
**Model Source:** `.github/.system-state/ops/observability_model.yaml` (OBS-001)

---

## Overview

This runbook covers first-responder procedures for the NeuroLogix observability
baseline alert rules. Each section maps to one or more Prometheus alert rules.

For release-specific rollback procedures, see
[release-rollback.md](./release-rollback.md).

---

## Availability Breach

**Alert:** `ServiceAvailabilityBreach` | `ServiceDown`  
**Severity:** Critical

### Symptoms
- Prometheus alert fires for a named service.
- Kubernetes readiness probe failures visible in `kubectl get pods`.
- Elevated HTTP 5xx count in Grafana.

### Resolution Steps

1. Check pod status:
   ```bash
   kubectl get pods -n neurologix -l app=<service>
   kubectl describe pod <pod-name> -n neurologix
   ```
2. Check recent logs:
   ```bash
   kubectl logs -n neurologix deploy/<service> --tail=100
   ```
3. If `CrashLoopBackOff` — check exit code and OOM events:
   ```bash
   kubectl get events -n neurologix --sort-by='.lastTimestamp' | tail -20
   ```
4. If dependency failure (database, broker) — check connectivity:
   ```bash
   kubectl exec -n neurologix deploy/<service> -- nc -zv <dependency-host> <port>
   ```
5. If not recovering within 5 minutes — trigger rollback:
   See [release-rollback.md](./release-rollback.md).

### Prevention
- Health check endpoints must return `200` within 2 seconds for all services.
- Liveness probes must be configured with `failureThreshold: 3, periodSeconds: 10`.

---

## Control Loop Latency

**Alert:** `ControlLoopLatencyP95Breach` | `ControlLoopLatencyP99Breach` | `ControlLoopLatencyRollbackThreshold`  
**Severity:** Critical (P95/P99) | Page (rollback threshold)

### Symptoms
- Prometheus histogram shows p95 > 50ms or p99 > 100ms.
- Operator UI showing delayed equipment state updates.
- PLC command telemetry timestamp delta elevated.

### Resolution Steps

1. Identify the slowest service in the control loop:
   ```promql
   histogram_quantile(0.95, sum by (service, le) (rate(http_request_duration_seconds_bucket[5m])))
   ```
2. Check recipe-executor queue depth:
   ```bash
   kubectl exec -n neurologix deploy/recipe-executor -- curl -s http://localhost:3000/health
   ```
3. Check digital-twin sync lag:
   ```promql
   digital_twin_sync_lag_ms
   ```
4. Check broker consumer lag (Kafka):
   ```bash
   kubectl exec -n neurologix deploy/kafka -- kafka-consumer-groups.sh \
     --bootstrap-server localhost:9092 --describe --all-groups
   ```
5. If p99 > 200ms for more than 1 minute — trigger automated rollback:
   See [release-rollback.md](./release-rollback.md).

### Prevention
- Broker consumer lag should not exceed 1000 messages for critical topics.
- Recipe executor worker pool min size: 4.

---

## Recipe Execution

**Alert:** `RecipeSuccessRateBreach` | `RecipeExecutionFailureSpike`  
**Severity:** Critical

### Symptoms
- Recipe success rate drops below 99.9%.
- recipe-executor error logs showing step validation failures.
- Digital twin state no longer reflecting expected values.

### Resolution Steps

1. Check recent recipe execution audit log:
   ```bash
   kubectl logs -n neurologix deploy/recipe-executor | grep '"outcome":"failure"' | tail -20
   ```
2. Identify failing recipe IDs:
   ```promql
   topk(10, rate(recipe_executions_total{outcome="failure"}[5m]))
   ```
3. Check policy-engine is reachable from recipe-executor:
   ```bash
   kubectl exec -n neurologix deploy/recipe-executor -- \
     curl -s -o /dev/null -w "%{http_code}" http://policy-engine/health
   ```
4. If a specific recipe schema is invalid — suspend the recipe via mission-control
   and escalate to the recipe owner.
5. If the failure is systemic — rollback recipe-executor:
   See [release-rollback.md](./release-rollback.md#service-rollback).

### Prevention
- Recipe definitions must pass Zod schema validation at upload time.
- Integration tests for critical recipe types must cover all step schemas.

---

## Audit Log Write Failure

**Alert:** `AuditLogWriteFailure` | `AuditLogWriteQueueDepth`  
**Severity:** Critical (write failure) | Warning (queue depth)

**NOTE:** Audit log write success must remain at 100%. Any write failure is a
direct T1 SLO breach and a compliance event under IEC 62443 / ISO 27001.

### Symptoms
- Prometheus counter `audit_writes_total{outcome="error"}` increments.
- ELK index `neurologix-logs-*` no longer receiving new audit events.
- OTEL collector logs showing export errors.

### Resolution Steps

1. Check OTEL collector export health:
   ```bash
   kubectl logs -n neurologix deploy/otel-collector | grep '"kind":"exporter"' | tail -30
   ```
2. Check Elasticsearch cluster health:
   ```bash
   curl -u elastic:${ELASTICSEARCH_PASSWORD} http://elasticsearch:9200/_cluster/health
   ```
3. If Elasticsearch is degraded — check disk utilisation and shard allocation:
   ```bash
   curl -u elastic:${ELASTICSEARCH_PASSWORD} http://elasticsearch:9200/_cat/shards?v
   ```
4. If the audit queue depth exceeds 5000 — scale up the OTEL collector:
   ```bash
   kubectl scale deployment otel-collector -n neurologix --replicas=3
   ```
5. **Document the outage duration and recovery time** — all audit write gaps must
   be logged as compliance events in the `.developer/INCIDENTS.md` file.

### Prevention
- ELK disk utilisation alert threshold: 80%.
- Audit write failures must page on-call immediately (no delay, no batching).

---

## Policy Engine Latency

**Alert:** `PolicyDecisionLatencyBreach`  
**Severity:** Critical

### Symptoms
- Policy decision p95 latency > 10ms.
- OPA evaluation queue depth increasing.
- recipe-executor tasks blocked waiting for policy evaluation.

### Resolution Steps

1. Check OPA bundle reload events:
   ```bash
   kubectl logs -n neurologix deploy/policy-engine | grep "bundle" | tail -20
   ```
2. Check OPA memory usage (large policy bundles cause evaluation slowdown):
   ```bash
   kubectl top pod -n neurologix -l app=policy-engine
   ```
3. If evaluation cache is cold (after restart) — allow 2 minutes for cache warm-up.
4. If sustained > 10ms — scale horizontally:
   ```bash
   kubectl scale deployment policy-engine -n neurologix --replicas=3
   ```

### Prevention
- OPA policy bundles should be optimised for evaluation depth < 5 levels.
- Policy engine horizontal pod autoscaler (HPA) should target 70% CPU utilisation.

---

## Digital Twin Sync Lag

**Alert:** `DigitalTwinSyncLagBreach`  
**Severity:** Warning

### Symptoms
- `digital_twin_sync_lag_ms` gauge > 200ms.
- Operator UI showing stale equipment state.

### Resolution Steps

1. Check digital-twin broker consumer lag:
   ```bash
   kubectl exec -n neurologix deploy/kafka -- kafka-consumer-groups.sh \
     --bootstrap-server localhost:9092 --describe --group digital-twin
   ```
2. If lag is growing — check digital-twin CPU/memory:
   ```bash
   kubectl top pod -n neurologix -l app=digital-twin
   ```
3. If broker partition count is insufficient — initiate topic partition increase
   (requires broker maintenance window).

---

## Safety Interlock Bypass

**Alert:** `SafetyInterlockBypassAttempt`  
**Severity:** Page (immediate)  

**ZERO TOLERANCE. Any bypass attempt requires an immediate incident.**

### Resolution Steps

1. **Immediately page the on-call safety engineer.**
2. Identify the source of the bypass attempt:
   ```bash
   kubectl logs -n neurologix deploy/policy-engine | grep '"action":"policy.blocked"' | tail -20
   ```
3. Identify the recipe and operator associated with the attempt.
4. Suspend the implicated recipe immediately:
   - Via mission-control UI: Recipes → Suspend recipe `<recipeId>`.
5. **Open a P0 incident in .developer/INCIDENTS.md** with:
   - Timestamp
   - Recipe ID
   - Operator identity (if applicable)
   - Decision audit log entry reference
6. Notify compliance officer.

---

## SSE Stream

**Alert:** `SSEStreamDown`  
**Severity:** Critical

### Symptoms
- Mission-control clients are not receiving real-time updates.
- `sse_connections_active` drops to zero while connection attempts continue.

### Resolution Steps

1. Check mission-control pod status:
   ```bash
   kubectl get pods -n neurologix -l app=mission-control
   kubectl logs -n neurologix deploy/mission-control | grep "SSE" | tail -20
   ```
2. Verify `/api/stream` endpoint is reachable:
   ```bash
   curl -H "Accept: text/event-stream" https://<mission-control-host>/api/stream -v
   ```
3. If pod is healthy but no connections — check ingress/proxy timeout settings
   (SSE requires long-lived connections; default proxy 60s timeout will kill them).
4. If pod is crashing — rollback mission-control:
   See [release-rollback.md](./release-rollback.md).

---

## Tag Throughput

**Alert:** `TagThroughputDrop`  
**Severity:** Warning

### Resolution Steps

1. Check MQTT adapter and OPC UA adapter pod status.
2. Check broker partition lag for `industrialx/+/tags/+` MQTT topics.
3. If an OPC UA server is disconnected — check adapter connection logs.
4. If a planned maintenance window — suppress alert for planned duration.

---

## Escalation Path

| Severity | Action |
|---|---|
| Warning | Notify on-call SRE via OpsGenie. Target ack within 30 minutes. |
| Critical | Page on-call SRE via PagerDuty. Target ack within 5 minutes. |
| Page | Page on-call SRE + safety engineer + engineering manager. Immediate. |

---

## References

- [Prometheus Alert Rules](../../infrastructure/observability/prometheus-alerts.yml)
- [OTEL Collector Config](../../infrastructure/observability/otel-collector-config.yaml)
- [Release Rollback Runbook](./release-rollback.md)
- [Observability Model (OBS-001)](../../.github/.system-state/ops/observability_model.yaml)
- [ADR-004: Observability Strategy](../architecture/ADR-004-observability-strategy.md)
