# Release Process

> **Risk Tier:** T1 (Mission-Critical)
> **Model Ref:** CICD-001 (`.github/.system-state/ci/ci_cd_model.yaml`)
> **Canary Stages:** 10% → 25% → 50% → 100%
> **Rollback SLA:** Safe state in < 30 seconds

---

## Pre-Release Checklist

Before triggering the release workflow, confirm all of the following:

- [ ] All required CI checks green on `main` (lint, typecheck, tests, contract-tests, build, secrets-scan, dependency-audit)
- [ ] Coverage thresholds met (≥ 80% overall, ≥ 90% core modules)
- [ ] All server and consumer contract tests passing locally (`npm run test:contracts:servers && npm run test:contracts:consumers`)
- [ ] Version string determined (semantic version, e.g. `v1.2.3`)
- [ ] Release notes drafted
- [ ] No open P0/P1 incidents
- [ ] Staging environment healthy (monitoring dashboards green)
- [ ] Rollback SLA validated (previous rollback tested or documented in staging)
- [ ] Operations team notified of upcoming release window

---

## Release Workflow

The release is triggered via `workflow_dispatch` on `main`.

### Trigger

```bash
gh workflow run release.yml \
  --field version=v1.2.3 \
  --field skip_e2e=false \
  --field skip_benchmarks=false
```

### Pipeline Stages

| Stage | Job | Purpose | Blocks |
|-------|-----|---------|--------|
| 1 | lint, typecheck, test | Re-run PR quality gates on release SHA | build |
| 1b | contract-tests | Server + consumer contract validation | build |
| 2 | build | Production build + artifact upload | deploy-staging |
| 3 | e2e | Playwright critical operator journeys (skippable) | deploy-staging |
| 4 | security-scan | Snyk vulnerability analysis | deploy-staging |
| 5 | lighthouse-ci | Performance budget gates (conditional on STAGING_URL) | — |
| 6 | container-scan | Trivy CVE scan (CRITICAL + HIGH) | deploy-staging |
| 7 | sbom | CycloneDX SBOM generation | deploy-staging |
| 8 | deploy-staging | Helm rollout to staging cluster | benchmarks |
| 9 | benchmarks | Pre-release performance gates | deploy-production |
| 10 | deploy-production | Canary rollout to production (manual approval) | — |

### Canary Rollout Stages

| Stage | Traffic | Monitoring Window |
|-------|---------|------------------|
| 1 | 10% | 24 hours |
| 2 | 25% | 48 hours |
| 3 | 50% | 72 hours |
| 4 | 100% | 168 hours |

---

## Rollback Triggers (Automated)

The following conditions automatically trigger rollback in the production canary stage:

| Trigger | Threshold |
|---------|-----------|
| Control loop p99 latency | > 200ms |
| Service error rate | > 0.5% |
| Recipe execution failure rate | > 0.1% |
| Safety interlock bypass attempt | Any |
| Audit log write failure | Any |
| Health check failure at any canary stage | Any |

---

## Rollback Procedure

### Automated (Release Workflow)

The production deploy job includes automated rollback on failure:

```bash
# Triggered automatically if deploy-production job fails
helm rollback neurologix -n neurologix-prod
```

The release workflow runs this automatically in its `if: failure()` step.

### Manual Emergency Rollback

If the automated rollback fails or you need to roll back post-deployment:

```bash
# 1. Identify the last known-good release
helm history neurologix -n neurologix-prod --max 5

# 2. Roll back to the previous release
helm rollback neurologix -n neurologix-prod

# 3. Verify health after rollback (wait ~60s for pods to restart)
kubectl rollout status deployment/neurologix -n neurologix-prod
curl --retry 5 --retry-delay 5 --fail $PRODUCTION_URL/api/health

# 4. Confirm rollback in Grafana dashboards
echo "Check: $GRAFANA_URL"
```

**Expected time to safe state: < 30 seconds** (Kubernetes rolling restart)

### Rollback Validation Checklist

After any rollback:

- [ ] All pods Running and Ready (`kubectl get pods -n neurologix-prod`)
- [ ] `/api/health` endpoint returning 200
- [ ] Control loop latency p95 < 50ms (Grafana)
- [ ] No safety interlock errors in logs
- [ ] Audit log writes resuming (ELK)
- [ ] Operations team notified
- [ ] Incident record created in `.developer/INCIDENTS.md`
- [ ] Root cause logged in GitHub issue/PR comment

---

## Emergency Release (Skip E2E + Benchmarks)

For P0 security patches or hotfixes only:

```bash
gh workflow run release.yml \
  --field version=v1.2.4-hotfix.1 \
  --field skip_e2e=true \
  --field skip_benchmarks=true
```

> **Warning:** Emergency bypasses must be approved by the operations lead and documented in `.developer/INCIDENTS.md`.

---

## Post-Release Checklist

- [ ] Production health stable for ≥ 1 hour post-full-rollout
- [ ] No P0/P1 incidents within the canary window
- [ ] SBOM artifact archived (Compliance retention: 90 days)
- [ ] Release notes published on GitHub Releases
- [ ] `.developer/INCIDENTS.md` updated (if any rollback or degradation occurred)
- [ ] Monitoring dashboards updated if new SLI/SLO thresholds changed

---

## Related References

- [CI/CD Model](../.github/.system-state/ci/ci_cd_model.yaml)
- [Release Workflow](../.github/workflows/release.yml)
- [Release Rollback Runbook](../docs/runbooks/release-rollback.md)
- [Incidents Log](./INCIDENTS.md)