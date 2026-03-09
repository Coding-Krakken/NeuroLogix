# Git/GitHub Workflow Integration Summary

**Version:** 1.0.0  
**Date:** 2026-02-25  
**Purpose:** Quick reference for agents integrating git/GitHub into their workflows

---

## 🎯 Overview

This document summarizes the git/GitHub workflow integration for the Core-3 operating model (with specialist escalation). It provides quick-start examples for common scenarios.

**Full Documentation:** [GIT_WORKFLOW.md](GIT_WORKFLOW.md)

---

## 📋 Core Principles

1. **Code not committed = code that doesn't exist**
2. **All work tracked in GitHub Issues**
3. **Feature branches for all non-trivial work**
4. **Conventional commit messages (always)**
5. **Pull Request creation follows risk-based authority**

---

## 🔄 Complete Workflow (Quick Reference)

```
User Request
    ↓ (Orchestrator)
GitHub Issue Created/Normalized (#42)
    ↓ (Orchestrator)
Feature Branch Created/Authorized (feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>)
    ↓ (Implementer)
Code Implemented & Committed (≤3 files per commit)
    ↓ (Implementer)
Pushed to Remote (git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>)
    ↓ (Implementer)
Issue Updated (gh issue comment 42 --body "Progress update")
    ↓ (Assurance)
Independent quality/security review completed
    ↓ (Assurance)
All G1-G10 Gates Validated
    ↓ (Tech Lead/delegated lead for low-medium, Quality Director for high-critical)
Pull Request Created (gh pr create)
    ↓ (Chief of Staff + others)
PR Reviewed & Approved
    ↓ (Quality Director or Chief of Staff)
PR Merged (gh pr merge --squash --delete-branch)
    ↓
Issue Auto-Closed (via "Closes #42" in PR)
```

---

## 🎬 Agent-Specific Quick Start

### Chief of Staff

**When:** User request received

**Steps:**

1. Create GitHub Issue
2. Assign to first agent (usually Solution Architect or Tech Lead)
3. Dispatch to agent

**Commands:**

```powershell
# Create issue
gh issue create \
  --title "feat: SEO Foundation (E009)" \
    --body-file .github/ISSUE_TEMPLATE.md \
  --label "epic,feature,agent:solution-architect" \
  --assignee "solution-architect"

# Capture issue number (e.g., #42)

# Dispatch to first agent
$repo = (Get-Location).Path
$handoffUrl = "https://github.com/<owner>/<repo>/issues/<WORK_ITEM_ID>#issuecomment-<id>"
$context1 = ".github/.system-state/model/system_state_model.yaml"
$context2 = ".github/.system-state/delivery/delivery_state_model.yaml"
code chat -m solution-architect --add-file $repo --add-file $context1 --add-file $context2 "[Issue #<WORK_ITEM_ID>] [Task 1] [To: solution-architect]`nHandoff URL: $handoffUrl`nExecute E009 SEO Foundation."
```

---

### Solution Architect

**When:** Creating/updating models

**Steps:**

1. Update model files (`.github/.system-state/`)
2. Create ADRs (`.github/.developer/DECISIONS/`)
3. **Commit model changes to main** (exception: models can go direct to main)
4. Update GitHub Issue with progress
5. Dispatch to Tech Lead

**Commands:**

```powershell
# After updating models
git add .github/.system-state/model/system_state_model.yaml
git add .github/.system-state/contracts/api.yaml
git add .github/.developer/DECISIONS/ADR-007-seo-approach.md

git commit -m "docs(seo): add SEO domain model and ADR-007 for E009

Adds INV-SEO-1 through INV-SEO-5 invariants.
Adds /sitemap.xml and /robots.txt API contracts.
Documents <WEB_FRAMEWORK> Metadata API decision.

Issue #<WORK_ITEM_ID>"

git push origin main

# Update issue
gh issue comment 42 --body "Model artifacts complete. ADR-007 created. Dispatching to tech-lead."
```

---

### Tech Lead

**When:** Creating implementation plan

**Steps:**

1. **Create feature branch** (authority: Tech Lead or Solution Architect)
2. Create implementation plan (`.github/.system-state/plan/`)
3. **Commit plan to feature branch**
4. Update GitHub Issue
5. Dispatch to engineers

**Commands:**

```powershell
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Create implementation plan
# (File created: .github/.system-state/plan/implementation_plan_e009.md)

git add .github/.system-state/plan/implementation_plan_e009.md
git commit -m "docs(seo): add E009 implementation plan with vertical slices

Defines S1-S5 slices, complexity budget (15 points), test plan.

Issue #<WORK_ITEM_ID>"

git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Update issue
gh issue comment 42 --body "Feature branch created: \`feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>\`

Implementation plan complete. Dispatching to frontend-engineer and backend-engineer."

# Dispatch to engineers
code chat -m frontend-engineer --add-file $repo --add-file .github/.system-state/plan/implementation_plan_e009.md --add-file .github/.system-state/model/system_state_model.yaml "Implement S1 + S2 on feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>. Issue #<WORK_ITEM_ID>."
code chat -m backend-engineer --add-file $repo --add-file .github/.system-state/plan/implementation_plan_e009.md --add-file .github/.system-state/contracts/api.yaml "Implement S3 + S4 on feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>. Issue #<WORK_ITEM_ID>."
```

---

### Frontend Engineer

**When:** Implementing frontend slices

**Steps:**

1. **Switch to feature branch**
2. **Pull latest changes**
3. Implement code
4. Run quality gates (lint, typecheck, test)
5. **Commit changes** (≤3 files per commit)
6. **Push to remote**
7. Update GitHub Issue
8. Dispatch to next agent

**Commands:**

```powershell
# Switch to feature branch and pull latest
git checkout feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
git pull origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Implement S1: Metadata helpers
# (Files: src/lib/seo/metadata.ts, src/lib/seo/__tests__/metadata.test.ts)

# Run quality gates
npm run lint
npm run typecheck
npm test -- src/lib/seo/__tests__/metadata.test.ts

# Commit S1
git add src/lib/seo/metadata.ts src/lib/seo/__tests__/metadata.test.ts
git commit -m "feat(seo): enforce INV-SEO-1 and INV-SEO-4 metadata constraints

- Title ≤60 chars
- Description ≤160 chars
- Canonical URLs are absolute

Tests: 13 passing
Coverage: metadata.ts 100%

Issue #<WORK_ITEM_ID>"

git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Implement S2: Structured data
# (Files: src/lib/seo/structured-data.ts, src/lib/seo/__tests__/structured-data.test.ts)

# Run quality gates again
npm run lint
npm run typecheck
npm test -- src/lib/seo/__tests__/structured-data.test.ts

# Commit S2
git add src/lib/seo/structured-data.ts src/lib/seo/__tests__/structured-data.test.ts
git commit -m "feat(seo): add BreadcrumbList schema generator for INV-SEO-2

Implements Product, Organization, BreadcrumbList generators.

Tests: 11 passing
Coverage: structured-data.ts 100%

Issue #<WORK_ITEM_ID>"

git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Update issue
gh issue comment 42 --body "Frontend S1+S2 complete. Tests passing. Dispatching to backend-engineer."

# Dispatch to backend engineer
$handoffUrl = "https://github.com/<owner>/<repo>/issues/42#issuecomment-<id>"
code chat -m backend-engineer --add-file $repo --add-file .github/.system-state/plan/implementation_plan_e009.md --add-file .github/.system-state/contracts/api.yaml "[Issue #<WORK_ITEM_ID>] [Task 4] [To: backend-engineer]`nHandoff URL: $handoffUrl`nImplement S3+S4 on feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>."
```

---

### Backend Engineer

**When:** Implementing backend slices

**Steps:**

1. **Switch to feature branch**
2. **Pull latest changes** (get frontend's work)
3. Implement code
4. Run quality gates
5. **Commit changes**
6. **Push to remote**
7. Update GitHub Issue
8. Dispatch to QA

**Commands:**

```powershell
# Switch to feature branch and pull frontend's changes
git checkout feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
git pull origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Implement S3: Sitemap
# (Files: src/app/sitemap.ts, src/app/__tests__/sitemap.test.ts)

npm run lint
npm run typecheck
npm test -- src/app/__tests__/sitemap.test.ts

git add src/app/sitemap.ts src/app/__tests__/sitemap.test.ts
git commit -m "feat(seo): enforce INV-SEO-3 sitemap coverage (481 SKUs)

- Deterministic coverage validation
- 1-hour cache TTL
- Fallback to static pages on error

Tests: 24 passing
Coverage: sitemap.ts 100%

Issue #<WORK_ITEM_ID>"

git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Implement S4: Robots
git add src/app/robots.ts src/app/__tests__/robots.test.ts
git commit -m "feat(seo): add /cart to robots disallow list (INV-SEO-5)

Sensitive paths now disallowed: /api/, /checkout, /cart, /confirmation/, /_next/, /static/

Tests: 12 passing
Coverage: robots.ts 100%

Issue #<WORK_ITEM_ID>"

git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Update issue
gh issue comment 42 --body "Backend S3+S4 complete. All implementation slices done. Dispatching to qa-test-engineer."

# Dispatch to QA
$handoffUrl = "https://github.com/<owner>/<repo>/issues/42#issuecomment-<id>"
code chat -m qa-test-engineer --add-file $repo --add-file .github/.system-state/plan/implementation_plan_e009.md --add-file .github/QUALITY-GATES.md "[Issue #<WORK_ITEM_ID>] [Task 5] [To: qa-test-engineer]`nHandoff URL: $handoffUrl`nValidate E009 on feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>."
```

---

### QA Test Engineer

**When:** Validating implementation

**Steps:**

1. **Switch to feature branch**
2. **Pull latest changes**
3. Run all quality gates (G1-G5)
4. Create test evidence
5. **Commit test evidence**
6. **Push to remote**
7. Update GitHub Issue
8. Dispatch to Security Engineer

**Commands:**

```powershell
# Switch to feature branch
git checkout feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
git pull origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Run full test suite
npm run lint > qa-evidence/lint-output.txt
npm run typecheck > qa-evidence/typecheck-output.txt
npm test -- --coverage > qa-evidence/test-output.txt
npm run build > qa-evidence/build-output.txt

# All gates pass! Commit evidence
git add qa-evidence/
git commit -m "test(seo): validate E009 quality gates for S1-S4

Test Results:
- Suites: 32 passed / 32 total
- Tests: 260 passed / 260 total
- Coverage: 93.18% statements (baseline: 93%)

All SEO invariants INV-SEO-1 through INV-SEO-5 validated.

Issue #<WORK_ITEM_ID>"

git push origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Update issue
gh issue comment 42 --body "QA validation complete. All quality gates pass. Dispatching to security-engineer."

# Dispatch to security
code chat -m security-engineer --add-file $repo --add-file .github/SECURITY.md --add-file .github/.system-state/security/threat_model.yaml "Security review E009 on feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>. QA passed. Issue #<WORK_ITEM_ID>."
```

---

### Security Engineer

**When:** Security review

**Steps:**

1. **Switch to feature branch**
2. **Pull latest changes**
3. Perform security audit (STRIDE analysis)
4. Create security audit report
5. **Commit audit report**
6. **Push to remote**
7. Update GitHub Issue
8. Dispatch to Quality Director

**Commands:**

```powershell
# Switch to feature branch
git checkout feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
git pull origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Perform security review
# (Create: .github/.developer/SECURITY/audit-e009-seo.md)

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

# Update issue
gh issue comment 42 --body "Security review complete. APPROVED. No critical findings. Dispatching to 99-quality-director."

# Dispatch to Quality Director
code chat -m 99-quality-director --add-file $repo --add-file .github/QUALITY-GATES.md --add-file .github/pull_request_template.md "Final quality gates and PR creation for E009 on feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>. Issue #<WORK_ITEM_ID>."
```

---

### Quality Director

**When:** Final validation & PR creation

**Authority:** Delegated domain approvals are required; Quality Director performs final signoff.

**Steps:**

1. **Switch to feature branch**
2. **Pull latest changes**
3. Re-validate ALL G1-G10 quality gates
4. **Create Pull Request**
5. Request reviews
6. Update GitHub Issue with PR link

**Commands:**

```powershell
# Switch to feature branch
git checkout feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>
git pull origin feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>

# Re-validate all gates
npm run lint                # G1
npm run format:check        # G2
npm run typecheck           # G3
npm run build               # G4
npm test -- --coverage      # G5
# G6-G10 validated from handoffs

# All gates pass! Create PR body file
# (Create: .github/pr-bodies/pr-42.md with full template)

# Create PR
gh pr create \
  --title "feat: SEO Foundation (E009)" \
  --body-file .github/pr-bodies/pr-42.md \
  --base main \
  --head feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG> \
  --label "epic:e009,feature,ready-for-review"

# Capture PR number (e.g., #123)

# Request reviews
gh pr edit 123 --add-reviewer "00-chief-of-staff,security-engineer,11-tech-lead"

# Update issue
gh issue comment 42 --body "Pull Request created: #123

All quality gates passed. Ready for review.

Reviewers: @00-chief-of-staff @security-engineer @11-tech-lead"

# Wait for approvals...
# After approvals obtained:

# Merge PR (Quality Director or Chief of Staff)
gh pr merge 123 --squash --delete-branch

# Issue auto-closes via "Closes #42" in PR body
```

---

## 📝 Commit Message Examples

### Feature Commit

```
feat(seo): enforce INV-SEO-1 metadata length constraints

- Title truncated to ≤60 chars
- Description truncated to ≤160 chars
- Added unit tests for edge cases

Tests: 13 passing
Coverage: metadata.ts 100%

Issue #<WORK_ITEM_ID>
```

### Fix Commit

```
fix(cart): prevent duplicate items on double-click

Resolves race condition when user double-clicks "Add to Cart".
Added debounce logic to addToCart mutation.

Fixes #123
```

### Test Commit

```
test(sitemap): add coverage for INV-SEO-3 validation

Ensures sitemap includes all 481 active products.

Issue #<WORK_ITEM_ID>
```

### Docs Commit

```
docs(readme): update setup instructions for SEO foundation

Adds instructions for Lighthouse CI integration.

Issue #<WORK_ITEM_ID>
```

---

## 🚨 Common Mistakes to Avoid

### ❌ Mistake 1: Not committing work

**Bad:**

```
Agent implements features → creates handoff → dispatches → NO COMMITS
```

**Good:**

```
Agent implements features → commits code → commits handoff → pushes → dispatches
```

---

### ❌ Mistake 2: Committing before quality gates

**Bad:**

```powershell
git add .
git commit -m "quick fix"
# No lint/test run!
```

**Good:**

```powershell
npm run lint
npm run typecheck
npm test
# All pass!
git add <files>
git commit -m "fix(scope): message"
```

---

### ❌ Mistake 3: Vague commit messages

**Bad:**

```
git commit -m "updates"
git commit -m "fix"
git commit -m "misc changes"
```

**Good:**

```
git commit -m "feat(seo): add BreadcrumbList schema generator

Implements INV-SEO-2 for E009.

Tests: 11 passing
Issue #<WORK_ITEM_ID>"
```

---

### ❌ Mistake 4: Creating PR before all gates pass

**Bad:**

```powershell
# Tests failing
npm test  # 2 failing tests
# Create PR anyway!
gh pr create ...  # NO!
```

**Good:**

```powershell
# All gates must pass first
npm run lint        # PASS
npm run typecheck   # PASS
npm test            # PASS (all tests)
npm run build       # PASS
# NOW create PR
gh pr create ...
```

---

### ❌ Mistake 5: Not updating GitHub Issue

**Bad:**

```powershell
# Implement features
git commit ...
git push ...
# Dispatch to next agent
# NO ISSUE UPDATE!
```

**Good:**

```powershell
# Implement features
git commit ...
git push ...
# Update issue
gh issue comment 42 --body "S1+S2 complete, dispatching to backend-engineer."
# Dispatch to next agent
```

---

## 📊 Git/GitHub Workflow Checklist

### Before Starting Work

- [ ] GitHub Issue exists (#XX)
- [ ] Feature branch exists (feature/XX-description)
- [ ] Pulled latest: `git pull origin <branch>`

### During Work

- [ ] Commit after each meaningful unit
- [ ] Run quality gates before each commit
- [ ] Use conventional commit messages
- [ ] Reference issue number in commits
- [ ] Push to remote frequently

### Before Handoff

- [ ] All code committed and pushed
- [ ] Handoff comment posted to active Issue/PR
- [ ] Dispatch includes `Handoff URL`
- [ ] GitHub Issue updated with progress
- [ ] Next agent dispatched

### Quality Director Before PR

- [ ] All G1-G10 gates validated
- [ ] Security review approved
- [ ] Model compliance verified
- [ ] No merge conflicts with main
- [ ] PR body template filled completely

---

## 🔗 Related Documentation

- [GIT_WORKFLOW.md](GIT_WORKFLOW.md) — Complete workflows, branch strategy, commit authority
- [AGENTS.md](AGENTS.md) — Agent roster and dispatch protocol
- [QUALITY-GATES.md](QUALITY-GATES.md) — G1-G10 quality gate definitions
- [copilot-instructions.md](copilot-instructions.md) — Complete agent governance

### Prompts

- [git-commit.prompt.md](prompts/operations/git-commit.prompt.md) — Commit workflow
- [create-pr.prompt.md](prompts/operations/create-pr.prompt.md) — PR creation workflow
- [manage-issue.prompt.md](prompts/operations/manage-issue.prompt.md) — Issue management
- [branch-strategy.prompt.md](prompts/operations/branch-strategy.prompt.md) — Branch management

---

**🤖 This guide ensures all agents integrate git/GitHub into their workflows systematically.**

**Version 1.0.0 | Created 2026-02-25 | Owner: All Agents**

