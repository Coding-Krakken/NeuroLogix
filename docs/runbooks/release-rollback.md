# Runbook: Release Rollback

> **Risk Tier:** T1 (Mission-Critical)
> **Scope:** Production and staging Kubernetes canary rollback
> **Rollback SLA:** Safe state in < 30 seconds
> **Model Ref:** CICD-001 (`.github/.system-state/ci/ci_cd_model.yaml`)

---

## Purpose

This runbook documents the procedures for rolling back a NeuroLogix production
or staging deployment when a release triggers an automated or manual rollback.

It is the operational counterpart to `.developer/RELEASE.md` and the
[Release Workflow](../../.github/workflows/release.yml).

---

## Rollback Triggers

Rollback must be initiated immediately when any of the following are detected:

| Trigger | Threshold | Source |
|---------|-----------|--------|
| Control loop p99 latency | > 200ms | Grafana / Prometheus |
| Service error rate | > 0.5% | Grafana / Prometheus |
| Recipe execution failure rate | > 0.1% | Application logs / ELK |
| Safety interlock bypass attempt | Any | Audit log / ELK |
| Audit log write failure | Any | ELK / alerts |
| Kubernetes liveness/readiness probe failure | Any | Kubernetes events |
| Health check failure at canary stage | Any | Release workflow step |

---

## Decision Tree

```
Deployment triggered (canary stage 1–4)
   │
   ├─ Health check fails → AUTOMATED ROLLBACK (workflow handles it)
   │
   └─ Manual monitoring detects threshold breach
          │
          ├─ Within canary window → Manual rollback (see Section 3)
          │
          └─ Post full rollout (100%) → Emergency rollback (see Section 4)
```

---

## Section 1: Verify Rollback Triggers

Before rolling back, confirm the trigger is real and not a transient blip.

```bash
# Check recent error rate in Prometheus
# (replace with your actual query endpoint)
curl -s "$PROMETHEUS_URL/api/v1/query?query=rate(http_requests_total{status=~'5..'}[5m])"

# Check control loop latency
kubectl logs -n neurologix-prod -l app=neurologix --tail=50 | grep "control-loop"

# Check safety interlock events
# Search ELK for: level:error AND tags:safety-interlock
```

---

## Section 2: Automated Rollback (Release Workflow)

The release workflow's `deploy-production` job automatically rolls back on failure:

```yaml
# Excerpt from release.yml deploy-production
- name: Rollback on failure
  if: failure()
  run: |
    helm rollback neurologix -n neurologix-prod || true
    echo "Rollback initiated."
```

**No action required** if the release workflow reports failure and initiates rollback.

Verify the automated rollback succeeded:

```bash
helm history neurologix -n neurologix-prod --max 5
kubectl get pods -n neurologix-prod
```

---

## Section 3: Manual Rollback During Canary

Use this procedure when canary is still active (< 100% traffic) and automated rollback did not trigger.

### Step 1 — Confirm current release state

```bash
helm status neurologix -n neurologix-prod
helm history neurologix -n neurologix-prod --max 5
```

### Step 2 — Initiate rollback

```bash
# Roll back to the previous known-good release
helm rollback neurologix -n neurologix-prod
```

### Step 3 — Monitor rollback progress

```bash
# Watch pods restart
kubectl rollout status deployment/neurologix -n neurologix-prod --timeout=60s

# Confirm all pods are Running
kubectl get pods -n neurologix-prod
```

### Step 4 — Validate health

```bash
# Health endpoint should return HTTP 200
curl --retry 5 --retry-delay 5 --fail $PRODUCTION_URL/api/health
echo "Health check exit code: $?"
```

### Step 5 — Confirm metrics

- Open Grafana: `$GRAFANA_URL`
- Verify control loop p95 < 50ms
- Verify error rate < 0.1%
- Verify no safety interlock events in last 5 minutes

---

## Section 4: Emergency Rollback (Post Full Rollout)

Use this procedure if a regression is discovered after 100% traffic rollout.

### Step 1 — Immediately roll back

```bash
helm rollback neurologix -n neurologix-prod
```

### Step 2 — Verify rollback

```bash
kubectl rollout status deployment/neurologix -n neurologix-prod --timeout=60s
curl --retry 5 --retry-delay 5 --fail $PRODUCTION_URL/api/health
```

### Step 3 — Assess data integrity

```bash
# Check for any in-flight recipe executions that may have been interrupted
# Search ELK for: tags:recipe-execution AND status:running

# Check audit log continuity
# Search ELK for gaps in audit entries after rollback timestamp
```

### Step 4 — Notify stakeholders

- Notify operations lead and tech lead immediately.
- Create an incident record in `.developer/INCIDENTS.md`.
- Update GitHub PR/issue with rollback evidence.

---

## Section 5: Staging Rollback

Use for staging rollback during pre-release validation:

```bash
helm rollback neurologix-staging -n neurologix-staging
kubectl get pods -n neurologix-staging
curl --retry 3 --fail $STAGING_URL/api/health
```

---

## Post-Rollback Checklist

- [ ] All pods `Running` and `Ready`
- [ ] `/api/health` returning 200
- [ ] Control loop latency p95 < 50ms (Grafana)
- [ ] Error rate < 0.1% (Grafana)
- [ ] No safety interlock events in last 5 minutes (ELK)
- [ ] Audit log writes resuming (ELK)
- [ ] Operations team notified (Slack / PagerDuty)
- [ ] Incident record created in `.developer/INCIDENTS.md`
- [ ] Root cause investigation initiated (GitHub issue opened)
- [ ] Rollback entry added to `helm history` confirmed

---

## Prevention

To reduce rollback frequency:

1. **Always run the full release workflow** — never skip stages on non-hotfix releases.
2. **Stage canary at 10% for the full 24h window** before advancing.
3. **Monitor Grafana dashboards continuously** during canary progression.
4. **Validate contract tests locally** before triggering a release (`npm run test:contracts:servers && npm run test:contracts:consumers`).
5. **Maintain staging parity** — never deploy to production from an environment that diverges from staging.

---

## Related References

- [Release Process](./.developer/RELEASE.md)
- [Release Workflow](../../.github/workflows/release.yml)
- [CI/CD Model](../../.github/.system-state/ci/ci_cd_model.yaml)
- [Incidents Log](../../.developer/INCIDENTS.md)
