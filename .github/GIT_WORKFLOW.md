# Git & GitHub Project Management Workflow

**Version:** 1.0.0  
**Effective Date:** 2026-02-25  
**Status:** Active  
**Owner:** Chief of Staff (agent `00-chief-of-staff`)

---

## 🎯 Purpose

This document defines **strict git/GitHub project management workflows** for the Core-3 operating model (with specialist escalation). Every significant work item must be tracked in version control and GitHub project management systems.

**Core Principle:** Code not committed is code that doesn't exist.

---

## 📋 Workflow Overview

```
User Request
    ↓
Orchestrator creates or normalizes GitHub Issue
    ↓
Orchestrator creates/authorizes feature branch
    ↓
Implementer executes slices & commits incrementally
    ↓
Assurance validates quality/security/compliance evidence
    ↓
Risk-based PR authority:
- Low/Medium risk: Orchestrator-authorized engineering lead creates PR
- High/Critical risk: Quality Director creates PR
    ↓
PR merged → Close GitHub Issue
```

### Delivery Lanes (Risk-Based)

| Lane | Risk | Required Path |
| --- | --- | --- |
| Fast Lane | Low | Orchestrator → Implementer → Assurance targeted review → PR |
| Balanced Lane | Medium | Orchestrator → Implementer → Assurance review → PR |
| Full Assurance Lane | High/Critical | Orchestrator → Implementer → Assurance full validation + Quality Director PR + signoff |

Rules:

- Security and traceability checks remain mandatory in all lanes.
- Any risk escalation immediately transitions to the next stricter lane.
- Quality Director remains final ship/no-ship authority for high/critical changes.

### Dual-Loop Execution (Creative + Verification)

- **Creative loop:** human/agent reasoning work (design, implementation, remediation strategy).
- **Verification loop:** automated checks and failure-context extraction.

Rules:

1. Agents do not repeatedly run the same deterministic checks once CI has produced a verification bundle for the same SHA.
2. Verification loop emits compact failure bundles and suggested owner agents.
3. Creative loop remediation consumes the bundle, fixes root cause, and pushes a new SHA.
4. Merge eligibility requires loop-coupling gate success (both loops complete for the same head SHA).

### Runaway Mitigation Policy

- Verification attempts are capped at 3 per PR before blocking escalation.
- Verification loop is idempotent per SHA to prevent duplicate churn.
- `verification-blocked` state routes to Quality Director adjudication.
- `verification-blocked-sla` enforces owner assignment within 4 hours.
- `scorecard-metrics-collector` publishes weekly automation load and loop reliability snapshots.
- A PR cannot be considered complete while verification is unresolved.

### Context Continuity Policy (Discovery Once)

- Create one machine-readable context snapshot per issue and refresh it at each major handoff.
- Every receiving agent must consume the context snapshot before running discovery prompts.
- Full discovery is allowed only if snapshot evidence is stale, missing, or contradictory.
- Preferred automation:
    - `./.github/scripts/generate-agent-context.ps1 -IssueNumber <id> -Repo <owner/repo>`
    - `./.github/scripts/dispatch-agent.ps1 -IssueNumber <id> -TargetAgent <agent-id> -Repo <owner/repo>`

---

## 🌳 Branch Management

### Branch Naming Convention

```
<type>/<issue-number>-<short-description>

Examples:
- feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
- fix/123-cart-checkout-bug
- refactor/456-payment-handler
- docs/789-runbook-update
```

**Types:**

- `feature/` — New features or enhancements
- `fix/` — Bug fixes
- `refactor/` — Code restructuring (no behavior change)
- `docs/` — Documentation updates
- `chore/` — Maintenance tasks (dependency updates, etc.)
- `hotfix/` — Emergency production fixes

### Branch Authority

| Agent Role | Can Create Branches | Can Merge to Main |
| --- | --- | --- |
| Orchestrator (`00-chief-of-staff`) | ✅ Yes | ✅ Yes (emergency only) |
| Implementer (`11-tech-lead`) | ✅ Yes (delegated) | ⛔ No |
| Assurance (`99-quality-director`) | ✅ Yes (via PR) | ✅ Yes (via PR approval) |
| Specialist Agents | ⛔ No | ⛔ No |

**Rule:** Branch creation authority is held by the Orchestrator and optionally delegated to Implementer for low/medium work.

### Pull Request Creation Authority

| Risk Level | PR Creation Authority | Review Requirement |
| --- | --- | --- |
| Low | Orchestrator-authorized engineering lead | At least 1 qualified reviewer |
| Medium | Orchestrator-authorized engineering lead | At least 1 qualified reviewer + QA evidence |
| High | Quality Director | Full quality gate evidence + security review |
| Critical | Quality Director | Full gate evidence + executive/security escalation as applicable |

**Rule:** Quality Director-only PR creation is reserved for high/critical risk work to reduce queueing latency on low/medium-risk delivery.

**Automation:** `governance-pr` enforces this rule using GitHub login allowlists in `.github/framework-config/pr-authority-allowlists.json`.

**Validation runbook:** `.github/.developer/PR_AUTHORITY_SIMULATION_CHECKLIST.md`

---

## 💾 Commit Management

### When to Commit

**Commit Frequency:**

- After passing local quality gate (lint + typecheck)
- After every meaningful unit of work (≤3 files or 1 vertical slice)
- Before handing off to next agent
- When Quality Director approves (final commit before PR)

**DO NOT commit:**

- Failing tests
- Lint errors
- Type errors
- Secrets (.env files)
- Build artifacts (.next/, coverage/, node_modules/)

### Commit Authority by Agent

| Agent Role                 | Commit Authority            | What to Commit                                                               |
| -------------------------- | --------------------------- | ---------------------------------------------------------------------------- |
| **Solution Architect**     | Model files only            | `.github/.system-state/`, `.github/.developer/DECISIONS/`                                    |
| **Tech Lead**              | Planning files + code       | `.github/.system-state/plan/`, implementation slices                                 |
| **Frontend Engineer**      | React/<WEB_FRAMEWORK> code + tests  | `src/app/`, `src/components/`, `src/lib/seo/`                                |
| **Backend Engineer**       | API routes + tests          | `src/app/api/`, `src/lib/<payment-provider>/`, `src/app/sitemap.ts`, `src/app/robots.ts` |
| **Platform Engineer**      | Infrastructure + deployment | `<deployment-config>.json`, CI/CD configs                                    |
| **QA Test Engineer**       | Test files + evidence       | `src/**/__tests__/`, test reports, coverage                                  |
| **Security Engineer**      | Security audits + reports   | `.github/SECURITY.md`, audit reports                                         |
| **Documentation Engineer** | Docs + READMEs              | `.customer/`, `.github/.developer/`, `README.md`                                     |
| **Quality Director**       | Final approval artifacts    | Final validation evidence before PR                                          |

### Commit Message Format (Conventional Commits)

```
<type>(<scope>): <subject>

<body (optional)>

<footer (optional)>
```

**Types:**

- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation changes
- `style` — Formatting (no code change)
- `refactor` — Code restructuring
- `test` — Adding/updating tests
- `chore` — Maintenance tasks
- `perf` — Performance improvements
- `security` — Security fixes/improvements

**Examples:**

```
feat(seo): add BreadcrumbList structured data schema

Implements INV-SEO-2 for E009 SEO Foundation.
Adds generateBreadcrumbSchema() helper.

Closes #42
```

```
fix(cart): prevent duplicate items in cart state

Resolves race condition in addToCart mutation.

Fixes #123
```

```
test(sitemap): add coverage for INV-SEO-3 validation

Ensures sitemap includes all 481 active products.
```

**Git Commands (PowerShell):**

```powershell
# Stage specific files
git add src/lib/seo/metadata.ts src/lib/seo/__tests__/metadata.test.ts

# Commit with message
git commit -m "feat(seo): enforce INV-SEO-1 metadata length constraints"

# Push to feature branch
git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
```

---

## 🎫 GitHub Issue Management

### When to Create Issues

**Chief of Staff creates issues for:**

- All user requests (new features, bugs, enhancements)
- All Epic work items (E001-E013+)
- Security vulnerabilities
- Debt/refactoring tasks

**Issue Format:**

```markdown
## Issue Title

[Type] Brief description (≤60 chars)

## Description

What needs to be done and why.

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Epic/Phase

Epic: E009 SEO Foundation  
Phase: P4 SEO Restructuring

## Complexity

Points: 15 (within P4 budget of 30)

## Assigned Agent

@11-tech-lead

## Related Files

- `.github/.system-state/model/system_state_model.yaml`
- `src/app/sitemap.ts`

## References

- ADR-007: SEO Approach
- Quality Gate G1-G10
```

**Labels:**

- `epic` — Epic-level work
- `feature` — New feature
- `bug` — Bug fix
- `docs` — Documentation
- `security` — Security-related
- `tech-debt` — Technical debt
- `blocked` — Blocked by external dependency
- `agent:<agent-id>` — Assigned agent

### Issue Lifecycle

```
Open → In Progress → Review → Closed
```

**State Transitions:**

1. **Open** — Chief of Staff creates issue
2. **In Progress** — Tech Lead assigns agent, creates branch, updates issue
3. **Review** — Quality Director validates all gates pass, creates PR
4. **Closed** — PR merged or work abandoned

**Who Updates Issues:**

| Agent              | Can Update                          | When                                |
| ------------------ | ----------------------------------- | ----------------------------------- |
| Chief of Staff     | Status, assignment, labels          | Issue creation, escalation, closure |
| Solution Architect | Technical notes, ADR references     | After model updates                 |
| Tech Lead          | Status (In Progress), branch ref    | After branch creation               |
| QA Test Engineer   | Test evidence, quality gate results | After running test suites           |
| Security Engineer  | Security findings, CVE references   | After security review               |
| Quality Director   | PR link, final status               | After PR creation, merge            |

**PowerShell Commands (GitHub CLI):**

```powershell
# Create issue
gh issue create --title "feat: SEO Foundation (E009)" --body-file .github/issue-bodies/deterministic-operating-model.md --label "epic,feature,agent:tech-lead"

# Update issue status
gh issue edit 42 --add-label "in-progress"

# Link PR to issue
gh pr create --title "feat: SEO Foundation (E009)" --body "Closes #42" --base main --head feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Close issue
gh issue close 42 --comment "Completed via #123"
```

---

## 🔀 Pull Request Management

### When to Create PRs

Quality Director performs final signoff after delegated domain approvals validate:

- ✅ All quality gates pass (G1-G10)
- ✅ All tests pass (≥80% coverage)
- ✅ Security review approved
- ✅ Model compliance verified
- ✅ No merge conflicts

**PR Format:**

```markdown
## PR Title

[Type] Brief description (matches commit convention)

## Description

Summary of changes and why.

## Related Issue

Closes #42

## Epic/Phase

Epic: E009 SEO Foundation  
Phase: P4 SEO Restructuring

## Quality Gate Results

- ✅ G1: Lint (ESLint)
- ✅ G2: Format (Prettier)
- ✅ G3: Typecheck (TypeScript strict)
- ✅ G4: Build (<WEB_FRAMEWORK> production build)
- ✅ G5: Tests (80% coverage threshold met: 93.18%)
- ✅ G6: Security Scan (gitleaks clean)
- ✅ G7: Dependency Scan (0 critical CVEs)
- ⏳ G8: Performance (pending deployment)
- ✅ G9: Accessibility (no UI changes)
- ✅ G10: Security Review (approved by security-engineer)

## Complexity

- Budgeted: 15 points
- Actual: 15 points
- Status: On budget ✅

## Files Changed

- `src/app/sitemap.ts` (+45, -12)
- `src/app/robots.ts` (+8, -2)
- `src/app/__tests__/sitemap.test.ts` (+67, -5)
- `src/app/__tests__/robots.test.ts` (+15, -3)

## Test Evidence

- Test Suites: 32 passed
- Tests: 260 passed
- Coverage: 93.18% statements

## Security Review

- Status: Approved
- Reviewer: security-engineer
- Findings: 0 critical, 0 high, 1 medium (non-blocking)

## Deployment Plan

- Staging: Auto-deploy on merge
- Production: Manual approval after 24h staging soak

## Rollback Plan

- DNS fallback to <ROLLBACK_TARGET_PLATFORM> (<5 min)
- Trigger: Error rate >1% OR checkout success <95%

## Agent Sign-Offs

- [x] Solution Architect: Model compliance verified
- [x] Tech Lead: Implementation plan approved
- [x] Frontend Engineer: React/UI changes reviewed
- [x] Backend Engineer: API changes reviewed
- [x] QA Test Engineer: Test coverage verified
- [x] Security Engineer: Security approved
- [x] Quality Director: Ready to ship

## Breaking Changes

None

## Migration Required

None
```

**PR Labels:**

- `epic:<epic-id>` — Epic reference
- `feature` / `fix` / `refactor` / `docs` / `chore`
- `ready-for-review` — All gates pass
- `do-not-merge` — Blocked
- `hotfix` — Emergency fix

### PR Approval Authority

| Agent             | Can Approve PRs        | Can Merge PRs                 |
| ----------------- | ---------------------- | ----------------------------- |
| Chief of Staff    | ✅ Yes                 | ✅ Yes (final authority)      |
| Quality Director  | ✅ Yes                 | ✅ Yes (after all gates pass) |
| Tech Lead         | ✅ Yes                 | ⛔ No                         |
| Security Engineer | ✅ Yes (security gate) | ⛔ No                         |
| Other Agents      | ⛔ No                  | ⛔ No                         |

**Rule:** Minimum 2 approvals required:

1. **Quality Director** (mandatory final signoff)
2. **Chief of Staff** OR **Tech Lead** OR **Security Engineer** (at least one delegated approval)

**PowerShell Commands:**

```powershell
# Create PR
gh pr create --title "feat: SEO Foundation (E009)" --body-file .github/pull_request_template.md --base main --head feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Request review
gh pr edit 123 --add-reviewer "quality-director,security-engineer"

# Approve PR
gh pr review 123 --approve --body "All quality gates pass. Approved for merge."

# Merge PR
gh pr merge 123 --squash --delete-branch
```

---

## 🔄 Complete Workflow Example (E009 SEO Foundation)

### Step 1: Chief of Staff Receives Request

**User Request:** "Implement SEO Foundation (E009)"

**Chief of Staff Actions:**

1. Creates GitHub Issue #<WORK_ITEM_ID>: "feat: SEO Foundation (E009)"
2. Labels: `epic`, `feature`, `agent:solution-architect`
3. Dispatches to Solution Architect

**Git Commands:**

```powershell
gh issue create --title "feat: SEO Foundation (E009)" --body-file .github/issue-bodies/deterministic-operating-model.md --label "epic,feature,agent:solution-architect"
```

---

### Step 2: Solution Architect Creates Models

**Solution Architect Actions:**

1. Updates `.github/.system-state/model/system_state_model.yaml` (adds SEO invariants)
2. Updates `.github/.system-state/contracts/api.yaml` (adds /sitemap.xml, /robots.txt)
3. Creates `.github/.developer/DECISIONS/ADR-007-seo-approach.md`
4. **Commits model changes**
5. Dispatches to Tech Lead

**Git Commands:**

```powershell
git add .github/.system-state/model/system_state_model.yaml
git add .github/.system-state/contracts/api.yaml
git add .github/.developer/DECISIONS/ADR-007-seo-approach.md
git commit -m "docs(seo): add SEO domain model and ADR-007 for E009

Adds INV-SEO-1 through INV-SEO-5 invariants.
Adds /sitemap.xml and /robots.txt API contracts.
Documents <WEB_FRAMEWORK> Metadata API decision.

Issue #<WORK_ITEM_ID>"

git push origin main  # Solution Architect can push to main for model-only commits
```

**Issue Update:**

```powershell
gh issue edit 42 --add-label "in-progress" --body "Models complete. Assigned to tech-lead."
```

---

### Step 3: Tech Lead Creates Branch & Plan

**Tech Lead Actions:**

1. Creates feature branch `feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>`
2. Creates `.github/.system-state/plan/implementation_plan_e009.md`
3. **Commits implementation plan**
4. Dispatches to Frontend Engineer & Backend Engineer

**Git Commands:**

```powershell
# Create and switch to feature branch
git checkout -b feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Create implementation plan
# (File created by agent)

git add .github/.system-state/plan/implementation_plan_e009.md
git commit -m "docs(seo): add E009 implementation plan with vertical slices

Defines S1-S5 slices, complexity budget (15 points), test plan.

Issue #<WORK_ITEM_ID>"

git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
```

**Issue Update:**

```powershell
gh issue edit 42 --add-label "in-progress" --body "Feature branch created: feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>. Implementation started."
```

---

### Step 4: Frontend Engineer Implements S1 + S2

**Frontend Engineer Actions:**

1. Implements metadata helpers (S1)
2. Implements structured data helpers (S2)
3. Writes unit tests
4. Runs local quality gates (lint, typecheck, test)
5. **Commits implementation**
6. Dispatches to Backend Engineer

**Git Commands:**

```powershell
# Implement S1: Metadata
git add src/lib/seo/metadata.ts
git add src/lib/seo/__tests__/metadata.test.ts
git commit -m "feat(seo): enforce INV-SEO-1 and INV-SEO-4 metadata constraints

- Title ≤60 chars
- Description ≤160 chars
- Canonical URLs are absolute

Tests: 13 passing
Coverage: metadata.ts 100%

Issue #<WORK_ITEM_ID>"

# Implement S2: Structured Data
git add src/lib/seo/structured-data.ts
git add src/lib/seo/__tests__/structured-data.test.ts
git commit -m "feat(seo): add BreadcrumbList schema generator for INV-SEO-2

Implements Product, Organization, BreadcrumbList generators.

Tests: 11 passing
Coverage: structured-data.ts 100%

Issue #<WORK_ITEM_ID>"

git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
```

---

### Step 5: Backend Engineer Implements S3 + S4

**Backend Engineer Actions:**

1. Updates sitemap.ts (S3)
2. Updates robots.ts (S4)
3. Writes unit tests
4. Runs local quality gates
5. **Commits implementation**
6. Dispatches to QA Test Engineer

**Git Commands:**

```powershell
# Implement S3: Sitemap
git add src/app/sitemap.ts
git add src/app/__tests__/sitemap.test.ts
git commit -m "feat(seo): enforce INV-SEO-3 sitemap coverage (481 SKUs)

- Deterministic coverage validation
- 1-hour cache TTL
- Fallback to static pages on error

Tests: 24 passing
Coverage: sitemap.ts 100%

Issue #<WORK_ITEM_ID>"

# Implement S4: Robots
git add src/app/robots.ts
git add src/app/__tests__/robots.test.ts
git commit -m "feat(seo): add /cart to robots disallow list (INV-SEO-5)

Sensitive paths now disallowed: /api/, /checkout, /cart, /confirmation/, /_next/, /static/

Tests: 12 passing
Coverage: robots.ts 100%

Issue #<WORK_ITEM_ID>"

git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
```

---

### Step 6: QA Test Engineer Validates (S5)

**QA Test Engineer Actions:**

1. Runs full test suite: `npm test -- --coverage`
2. Validates coverage ≥93%
3. Creates test evidence report
4. **Commits test evidence**
5. Dispatches to Security Engineer

**Git Commands:**

```powershell
git add coverage/lcov-report/index.html
git commit -m "test(seo): validate E009 quality gates for S1-S4

Test Results:
- Suites: 32 passed / 32 total
- Tests: 260 passed / 260 total
- Coverage: 93.18% statements (baseline: 93%)

All SEO invariants INV-SEO-1 through INV-SEO-5 validated.

Issue #<WORK_ITEM_ID>"

git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
```

---

### Step 7: Security Engineer Reviews

**Security Engineer Actions:**

1. Performs STRIDE threat analysis
2. Reviews crawl exposure (robots.txt)
3. Validates no PII leakage in sitemap/metadata
4. Creates security audit report
5. **Commits security audit**
6. Dispatches to Quality Director

**Git Commands:**

```powershell
git add .github/.developer/SECURITY/audit-e009-seo.md
git commit -m "security(seo): approve E009 SEO implementation

Security Review:
- STRIDE analysis: PASS
- Crawl exposure: PASS (sensitive paths disallowed)
- PII leakage: PASS (no PII in public artifacts)
- Dependency scan: PASS (0 critical CVEs)

Recommendation: SHIP

Issue #<WORK_ITEM_ID>"

git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
```

---

### Step 8: Quality Director Creates PR

**Quality Director Actions:**

1. Validates all G1-G10 quality gates pass
2. Confirms security approval
3. Confirms model compliance
4. **Creates Pull Request**
5. Requests approvals from Chief of Staff and Security Engineer

**Git Commands:**

```powershell
# Create PR
gh pr create \
  --title "feat: SEO Foundation (E009)" \
  --body-file .github/pr-body-e009.md \
  --base main \
  --head feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG> \
  --label "epic:e009,feature,ready-for-review"

# Request reviews
gh pr edit 123 --add-reviewer "00-chief-of-staff,security-engineer"
```

**PR Body (generated):**
See "PR Format" section above for complete template.

---

### Step 9: Chief of Staff Approves & Merges

**Chief of Staff Actions:**

1. Reviews PR summary, quality gates, security signoff
2. Approves PR
3. **Merges PR** (squash merge)
4. **Deletes feature branch**
5. **Closes GitHub Issue**

**Git Commands:**

```powershell
# Approve PR
gh pr review 123 --approve --body "All quality gates pass. Security approved. Model compliance verified. Approved for production."

# Merge PR (squash commit)
gh pr merge 123 --squash --delete-branch

# Close issue
gh issue close 42 --comment "Completed via PR #123. All quality gates passed."
```

---

## 🚫 Anti-Patterns (DO NOT DO)

### ❌ Anti-Pattern 1: Creating Work Artifacts Without Committing

**Bad:**

```
Agent dispatches without posting handoff comments → chain executes → no auditable context in Issue/PR
```

**Result:** Work exists only in local filesystem. Not tracked, not reviewable, not recoverable.

**Good:**

```
Agent creates work artifact → commits artifact → dispatches chain
```

---

### ❌ Anti-Pattern 2: Committing Directly to Main Without PR

**Bad:**

```powershell
git checkout main
git commit -m "feat: new feature"
git push origin main  # Bypasses review!
```

**Result:** No peer review, no quality gates, no audit trail.

**Good:**

```powershell
git checkout -b feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
git commit -m "feat: new feature"
git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
gh pr create  # Creates PR for review
```

**Exception:** **Solution Architect** and **Chief of Staff** can push model-only commits to main for governance changes.

---

### ❌ Anti-Pattern 3: Creating PRs Before Quality Gates Pass

**Bad:**

```
Tech Lead creates PR → failing tests → security not reviewed → merged anyway
```

**Result:** Broken code in production, security vulnerabilities.

**Good:**

```
All G1-G10 gates pass → Quality Director creates PR → reviews obtained → merge
```

---

### ❌ Anti-Pattern 4: Not Linking PRs to Issues

**Bad:**

```markdown
## PR Title

feat: add new feature

## Description

Adds a feature.
```

**Result:** No traceability, unclear why work was done.

**Good:**

```markdown
## PR Title

feat: SEO Foundation (E009)

## Description

Implements SEO invariants INV-SEO-1 through INV-SEO-5.

Closes #42
```

---

### ❌ Anti-Pattern 5: Batching Unrelated Changes in One Commit

**Bad:**

```powershell
git add .
git commit -m "misc changes"
git push
```

**Result:** Impossible to review, impossible to rollback selectively.

**Good:**

```powershell
git add src/lib/seo/metadata.ts src/lib/seo/__tests__/metadata.test.ts
git commit -m "feat(seo): enforce INV-SEO-1 metadata constraints"

git add src/app/sitemap.ts src/app/__tests__/sitemap.test.ts
git commit -m "feat(seo): enforce INV-SEO-3 sitemap coverage"
```

---

## 📊 Metrics & Monitoring

### Git/GitHub Metrics to Track

| Metric                   | Target    | Alert Threshold      |
| ------------------------ | --------- | -------------------- |
| PR merge time            | <48 hours | >72 hours            |
| PR approval rate         | 100%      | <95%                 |
| Commits per PR           | <10       | >20                  |
| Files changed per commit | <5        | >10                  |
| Lines changed per commit | <300      | >500                 |
| Issues closed per week   | Trend up  | Stagnant for 2 weeks |
| PR reverts               | 0         | >1 per month         |
| Missing handoff comments | 0         | >1                   |

**Dashboard Location:** `.github/.developer/METRICS/git-workflow-metrics.md` (generated weekly)

---

## 🆘 Troubleshooting

### Problem: Agents creating work but not committing

**Symptoms:**

- Missing handoff comments on the active Issue/PR for recent dispatches
- Work complete but no commit history
- Agents say "work complete" but no PR created

**Solution:**

1. Quality Director runs: `git status`
2. Reviews untracked files
3. Groups related files by slice
4. Commits each slice separately with proper messages
5. Creates PR after all commits pushed

---

### Problem: Merge conflicts in feature branch

**Symptoms:**

- `git push` fails with conflict error
- PR shows "Cannot merge due to conflicts"

**Solution:**

1. Tech Lead rebases feature branch:
   ```powershell
   git checkout feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
   git pull origin main --rebase
   # Resolve conflicts in VS Code
   git add .
   git rebase --continue
   git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG> --force-with-lease
   ```

---

### Problem: PR blocked by failing quality gate

**Symptoms:**

- Quality Director tries to create PR but G4 (tests) fails
- CI reports test failures

**Solution:**

1. Quality Director escalates to owning agent (Frontend/Backend Engineer)
2. Agent fixes failing tests
3. Agent commits fix
4. QA re-validates
5. Quality Director re-attempts PR creation

---

## 📚 Reference Commands Cheat Sheet

### Git Basics

```powershell
# Check status
git status

# Create branch
git checkout -b feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Stage files
git add <file1> <file2>

# Commit
git commit -m "type(scope): message"

# Push
git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Pull latest from main
git pull origin main

# Delete branch (after PR merge)
git branch -d feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
```

### GitHub CLI (gh)

```powershell
# Create issue
gh issue create --title "Title" --body "Body" --label "label1,label2"

# Edit issue
gh issue edit 42 --add-label "in-progress"

# Close issue
gh issue close 42 --comment "Done via PR #123"

# Create PR
gh pr create --title "Title" --body "Body" --base main --head feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Request review
gh pr edit 123 --add-reviewer "agent-name"

# Approve PR
gh pr review 123 --approve --body "LGTM"

# Merge PR
gh pr merge 123 --squash --delete-branch

# View PR status
gh pr view 123
```

### Workflow Enforcement Policy (Automated)

The framework applies the following guardrails before and during implementation:

- **No work without work item:** If no issue is linked, block implementation (except tiny `hotfix/` branches that touch ≤2 files and are documented).
- **Review before coding:** Agent must review issue acceptance criteria and existing PR context before coding starts.
- **Branch-per-issue required:** Branch name must include issue number (`feature/<issue>-slug`, `bugfix/<issue>-slug`).
- **Commit checkpoint required:** Force commit when elapsed time or changed-file threshold is exceeded.
- **PR threshold required:** Open PR when branch divergence exceeds configured limits.
- **DoD gate required:** Tests, lint/typecheck, docs, PR quality notes, and acceptance criteria completion are mandatory.
- **Review gate required:** Self-review + independent reviewer + tester validation + security review (when relevant) before merge.

Reference implementation:

- `.github/framework/github-work-management.ts`
- `.github/framework/workflow-orchestrator-policy.ts`
- `.github/framework/definition-of-done-gate.ts`
- `.github/framework/workflow-telemetry.ts`
- `.github/scripts/github-workflow.ps1`

---

## ✅ Checklist for Agents

### Before Starting Work

- [ ] Confirm GitHub Issue exists for this work
- [ ] Confirm feature branch created (Tech Lead responsibility)
- [ ] Pulled latest code: `git pull origin <branch-name>`

### During Work

- [ ] Commit after each meaningful unit (≤3 files)
- [ ] Run quality gates before committing (lint, typecheck, test)
- [ ] Use conventional commit messages
- [ ] Link commits to issue number

### Before Handoff to Next Agent

- [ ] All local changes committed
- [ ] All commits pushed to remote
- [ ] Handoff comment posted (Issue/PR) with dispatch metadata
- [ ] Dispatch message includes `Handoff URL`
- [ ] Dispatch includes context pack via `--add-file` (`$repo` + at least 2 relevant auxiliary files)
- [ ] Next agent dispatched with branch reference

### Before PR Creation (Risk-Based Authority)

- [ ] All G1-G10 quality gates pass
- [ ] Security review approved
- [ ] Model compliance verified
- [ ] All commits clean (no WIP commits)
- [ ] PR template filled completely
- [ ] Issue linked in PR body

---

## 🔗 Related Documentation

- [AGENTS.md](AGENTS.md) — Agent roster and dispatch protocol
- [QUALITY-GATES.md](QUALITY-GATES.md) — G1-G10 quality gate definitions
- [pull_request_template.md](pull_request_template.md) — Default pull request template
- [ISSUE_TEMPLATE/deterministic-feature.yml](ISSUE_TEMPLATE/deterministic-feature.yml) — Canonical feature intake
- [ISSUE_TEMPLATE/deterministic-bug.yml](ISSUE_TEMPLATE/deterministic-bug.yml) — Canonical bug intake
- [ISSUE_TEMPLATE/deterministic-security.yml](ISSUE_TEMPLATE/deterministic-security.yml) — Canonical security intake
- [README.md](README.md) — Canonical governance index
- [copilot-instructions.md](copilot-instructions.md) — Complete agent governance

---

**🤖 This workflow ensures every piece of work is tracked, reviewed, and integrated into the codebase systematically.**

**Version 1.0.0 | Effective 2026-02-25 | Owner: Chief of Staff**

