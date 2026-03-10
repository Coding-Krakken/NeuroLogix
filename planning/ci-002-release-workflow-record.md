# CI-002 Release Workflow — Implementation Record

**Date:** 2026-03-10  
**Issue:** [#68](https://github.com/Coding-Krakken/NeuroLogix/issues/68)  
**Branch:** `ci-002-release-workflow`  
**Model Ref:** CICD-001 (`.github/.system-state/ci/ci_cd_model.yaml`)

---

## Summary

Implemented `.github/workflows/release.yml` — the GitHub Actions release workflow completing the CI/CD pipeline per CICD-001.

---

## Workflow Architecture

### Trigger
- `workflow_dispatch` with inputs:
  - `version` (required): release version tag (e.g. `v1.2.3`)
  - `skip_e2e` (optional, default: false): emergency release bypass
  - `skip_benchmarks` (optional, default: false): emergency release bypass

### Jobs & Dependencies

```
lint ─────────────────────────────────────────────┐
typecheck ────────────────────────────────────────┤
test ─────────────────────────────────────────────┼─► build ─► SBOM
                                                  │           security-scan
                                                  │           container-scan
                                                  │           (e2e — conditional)
                                                  │           (lighthouse — conditional)
                                                  │
                                    all quality gates ──► deploy-staging
                                                              │
                                                          benchmarks
                                                              │
                                                        deploy-production
                                                         (manual gate)
```

### Stage Details

| Stage | Job | Tool | Condition | Fail Action |
|---|---|---|---|---|
| 1 | CI Gate / Lint | ESLint + Turbo | always | block |
| 1 | CI Gate / Type Check | tsc --noEmit | always | block |
| 1 | CI Gate / Test | Vitest | always | block |
| 1 | CI Gate / Build | Turbo build | after lint+typecheck+test | block |
| 1 | CI Gate / Secrets | gitleaks | always | block |
| 2 | E2E Tests | Playwright | if playwright.config.ts exists | block |
| 3 | Security Scan | Snyk | after build | block (high+) |
| 4 | Lighthouse CI | treosh/lighthouse-ci-action | if STAGING_URL set | warn |
| 5 | Container Scan | Trivy (fs mode) | after build | block (critical+high) |
| 6 | SBOM | CycloneDX npm | after build | block |
| 7 | Deploy Staging | Helm + kubectl | ENABLE_DEPLOY=true | block |
| 8 | Benchmarks | custom scripts | after staging + !skip_benchmarks | warn (scaffolded) |
| 9 | Deploy Production | Helm canary | manual approval gate | rollback on failure |

---

## Design Decisions

### Node.js version
`22.x` — consistent with CI workflow fix (Vite 7.3.1 requires `^20.19.0 || >=22.12.0`).

### E2E conditional
E2E job skips automatically when no `playwright.config.ts` exists. This prevents false failures during the period before Playwright is bootstrapped, while ensuring the job will activate automatically once it's set up.

### Lighthouse CI
Only runs when `STAGING_URL` repository variable is set. Fails with `continue-on-error: true` (model specifies `fail_action: warn` for performance budget).

### Container scan strategy
Trivy runs in `fs` mode (filesystem scan) since no Dockerfiles exist yet. Will automatically upgrade to image scanning when Dockerfiles + Docker builds are added.

### SBOM retention
90 days — per compliance requirements (IEC 62443 / NIST CSF supply-chain).

### Deploy activation
`ENABLE_DEPLOY` repository variable gates all deploy jobs. Default OFF — teams enable when cluster is configured. This prevents accidental deploys from a misconfigured environment.

### Canary stages
10% → 25% → 50% → 100% as per CICD-001 model. In current scaffolded form, all stages run sequentially in a single job. Production-ready implementation would use Flagger/ArgoCD for automated canary promotion with SLO-based rollback.

### Auto-rollback
Implemented as `if: failure()` step that runs `helm rollback`. Full Prometheus-based trigger implementation deferred to Phase 7 (observability stack integration).

### Benchmark scaffolding
Benchmark jobs are scaffolded with TODO markers pointing to ISSUE-36 (Phase 8: E2E Validation, Performance, Chaos). Results are written to `benchmark-results/summary.json` with `status: scaffolded`.

---

## Required Setup (before enabling deploys)

1. **GitHub Environments** — Create `staging` and `production` environments in repo settings
2. **Production reviewers** — Add required reviewers to `production` environment
3. **Secrets**:
   - `SNYK_TOKEN` — Snyk API token (free tier available)
   - `KUBE_CONFIG_STAGING` — base64-encoded kubeconfig for staging cluster
   - `KUBE_CONFIG_PROD` — base64-encoded kubeconfig for production cluster
4. **Repository variables**:
   - `ENABLE_DEPLOY=true` — enables deploy jobs (off by default)
   - `STAGING_URL` — staging cluster URL (enables Lighthouse + smoke tests)
   - `PRODUCTION_URL` — production cluster URL
   - `GRAFANA_URL` — observability dashboard URL

---

## Validation Evidence

- [x] Workflow YAML created: `.github/workflows/release.yml`
- [x] All model-required jobs present (CICD-001 cross-check)
- [x] All CI quality gate jobs match `ci.yml` job names
- [x] Conditional logic correct (Playwright, Lighthouse, deploy gates)
- [x] Auto-rollback defined on `deploy-production` failure
- [x] SBOM artifact retention set to 90 days
- [x] Production environment gated via GitHub environment protection
- [x] Canary stages: 10% → 25% → 50% → 100% implemented
- [x] Lint passes locally
- [x] Tests pass locally (15/15 turbo tasks)
- [x] Build passes locally

---

## Gaps / Deferred to Later Phases

| Gap | Phase | Tracking |
|---|---|---|
| Playwright E2E tests | Phase 6/8 | ISSUE-36 |
| Benchmark scripts (k6/autocannon) | Phase 8 | ISSUE-36 |
| Lighthouse CI `.lighthouserc.json` | Phase 6 | ISSUE-36 |
| Helm chart (`infrastructure/helm/`) | Phase 7/8 | ISSUE-36 |
| Flagger/ArgoCD automated canary | Phase 9 | ISSUE-37 |
| SBOM signing (cosign) | Phase 7 | Security hardening |
