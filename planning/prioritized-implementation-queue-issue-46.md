# Prioritized Implementation Queue — Issue #46

**Date:** 2026-03-10  
**Ref Model:** `.github/.system-state/roadmap/roadmap_model.yaml` (ROADMAP-001)  
**Scoring Formula:** `SUM(dimension_score × dimension_weight)` — weights: business_impact 0.30, risk_reduction 0.25, dependency_unlock 0.20, effort 0.15, compliance_urgency 0.10

## Scoring Summary

| Rank | ID | Title | Score | Track | Status |
|---|---|---|---|---|---|
| 1 | CI-001 | Create GitHub Actions CI workflow | **4.50** | ci/cd | Not yet created |
| 2 | CI-003 | Add Dependabot configuration | **3.55** | ci/cd | Not yet created |
| 3 | CI-002 | Create release workflow | **3.75** | ci/cd | Not yet created |
| 4 | ISSUE-36 | Phase 8 Delivery: E2E Validation, Performance, Chaos | **3.45** | qa | Open |
| 5 | ISSUE-37 | Phase 9 Delivery: Multi-Site Federation | **2.70** | integration | Open |

## Immediate Next Actions (post Issue #46 merge)

### Priority 1: CI-001 — Create GitHub Actions CI workflow

**Why first:** Zero automated CI is the single biggest delivery risk. Every merged PR since project start has been validated only manually. This closes the critical gap identified in the CI/CD alignment report.

**Scope:**
- `.github/workflows/ci.yml`
- Triggers: `push`, `pull_request`
- Jobs: lint, typecheck, test (vitest with coverage), build (turbo), secrets-scan (gitleaks), dependency-scan (npm audit)
- Node.js 20.10.0, ubuntu-latest
- Turbo remote cache integration

**Estimated Effort:** 1-2 days

---

### Priority 2: CI-003 — Add Dependabot configuration (parallel with CI-001)

**Why second:** Low effort; immediately enables automated security patch detection. Can be done in parallel with CI-001.  

**Scope:**
- `.github/dependabot.yml`
- npm ecosystem, weekly schedule
- Security updates: immediate
- Minor/patch: weekly batch
- Major: manual review group

**Estimated Effort:** 2-4 hours

---

### Priority 3: CI-002 — Create release workflow (after CI-001)

**Why third:** Completes the automated delivery pipeline from CI to production canary rollout.

**Scope:**
- `.github/workflows/release.yml`
- Adds: Playwright E2E, Snyk/SonarQube, Lighthouse CI, Trivy, CycloneDX SBOM
- Staging auto-deploy, production canary with auto-rollback triggers

**Estimated Effort:** 2-3 days

---

### Priority 4: ISSUE-36 — Phase 8 E2E Validation, Performance, Chaos

**Why fourth:** Depends on CI pipeline existing (CI-001) and performance model (ISSUE-45, closed ✓). Phase 8 delivery work.

**Prerequisites:** CI-001, CI-002 merged

---

### Priority 5: ISSUE-37 — Phase 9 Multi-Site Federation

**Why fifth:** Depends on Phase 8 complete. Largest scope item; deferred until Phases 7-8 fully validated.

**Prerequisites:** ISSUE-36 closed

## WIP Constraints

- Max 3 PRs open simultaneously
- Max 5 branches active
- Do not start ISSUE-36 until CI-001 and CI-002 are merged
