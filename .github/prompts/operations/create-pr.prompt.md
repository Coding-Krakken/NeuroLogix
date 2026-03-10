# Prompt: Create Pull Request

**Category:** operations  
**Purpose:** Guide Quality Director to create production-ready pull requests  
**Complexity:** Medium  
**Expected Duration:** 10-15 minutes

---

## Objective

Create a pull request (PR) after all quality gates pass, security review approved, and model compliance verified.

**Authority:** **ONLY Quality Director** can create PRs.

---

## Context

You are the Quality Director in a 27-agent engineering organization. Creating a PR is the final step before code reaches production. Your PR must:

- Include complete quality gate evidence (G1-G10)
- Reference the GitHub issue
- Include security sign-off
- Include complexity budget validation
- Request reviews from appropriate agents

---

## Prerequisites (All Required)

**Before creating a PR, verify:**

- [ ] ✅ **G1: Lint** — `npm run lint` passes with 0 errors
- [ ] ✅ **G2: Format** — `npm run format:check` passes
- [ ] ✅ **G3: Typecheck** — `npm run typecheck` passes with 0 errors
- [ ] ✅ **G4: Build** — `npm run build` succeeds
- [ ] ✅ **G5: Tests** — `npm test -- --coverage` passes with ≥80% coverage
- [ ] ✅ **G6: Security Scan** — gitleaks clean (no secrets)
- [ ] ✅ **G7: Dependency Scan** — npm audit shows 0 critical CVEs
- [ ] ✅ **G8: Performance** — (pending deployment, mark as in-progress)
- [ ] ✅ **G9: Accessibility** — (if UI changes, WCAG 2.1 AA compliant)
- [ ] ✅ **G10: Security Review** — Security Engineer approved

**If ANY gate fails:** DO NOT create PR. Escalate to owning agent for remediation.

---

## Execution Steps

### Step 1: Gather Evidence

Collect outputs from all quality gates:

```powershell
# G1: Lint
npm run lint > qa-evidence/lint-output.txt

# G2: Format
npm run format:check > qa-evidence/format-output.txt

# G3: Typecheck
npm run typecheck > qa-evidence/typecheck-output.txt

# G4: Build
npm run build > qa-evidence/build-output.txt

# G5: Tests
npm test -- --coverage > qa-evidence/test-output.txt

# G7: Dependency scan
npm audit --audit-level=high --json > qa-evidence/audit-output.json
```

---

### Step 2: Prepare PR Body

Use the PR template from `.github/PR_TEMPLATE.md` and fill in all sections:

**Required Sections:**

1. **Title** — Matches conventional commit format
2. **Description** — Summary of changes
3. **Related Issue** — `Closes #<issue-number>`
4. **Quality Gate Results** — All G1-G10 statuses
5. **Complexity** — Budget vs actual
6. **Files Changed** — List of modified files
7. **Test Evidence** — Test suite results, coverage
8. **Security Review** — Security sign-off
9. **Agent Sign-Offs** — All agent approvals
10. **Breaking Changes** — Yes/No + details
11. **Migration Required** — Yes/No + steps

### Step 2.5: Post Final Gate Summary to Issue (MANDATORY)

Before creating the PR, publish a final gate summary comment on the linked issue:

```powershell
gh issue comment <issue-number> --body "Quality Director pre-PR gate summary:\n\n- Branch: <feature-branch>\n- HEAD: <short-sha>\n- G1 lint: ✅\n- G2 format: ✅\n- G3 typecheck: ✅\n- G4 build: ✅\n- G5 tests/coverage: ✅\n- G6 security scan: ✅\n- G7 dependency scan: ✅\n- G8 performance: ⏳/✅\n- G9 accessibility: ✅\n- G10 security review: ✅\n\nProceeding to PR creation."
```

---

### Step 3: Create PR via GitHub CLI

**Command:**

```powershell
gh pr create \
  --title "<type>: <description> (<epic-id>)" \
  --body-file .github/pr-bodies/pr-<issue-number>.md \
  --base main \
  --head <feature-branch> \
  --label "<labels>"
```

**Example:**

```powershell
gh pr create \
  --title "feat: SEO Foundation (E009)" \
  --body-file .github/pr-bodies/pr-42.md \
  --base main \
  --head feature/42-seo-foundation \
  --label "epic:e009,feature,ready-for-review"
```

---

### Step 4: Request Reviews

**Required Reviewers:**

- Chief of Staff (mandatory for final approval)
- Security Engineer (if security changes)
- Tech Lead (for technical review)

**Command:**

```powershell
gh pr edit <pr-number> --add-reviewer "00-chief-of-staff,security-engineer,tech-lead"

# Example:
gh pr edit 123 --add-reviewer "00-chief-of-staff,security-engineer,tech-lead"
```

---

### Step 5: Update GitHub Issue

Link the PR to the issue:

```powershell
gh issue comment <issue-number> --body "Pull Request created: #<pr-number>

All quality gates passed. Ready for review.

Reviewers: @00-chief-of-staff @security-engineer @tech-lead"

# Example:
gh issue comment 42 --body "Pull Request created: #123

All quality gates passed. Ready for review.

Reviewers: @00-chief-of-staff @security-engineer @tech-lead"
```

---

### Step 6: Monitor PR Status

Verify CI/CD pipeline runs successfully:

```powershell
# View PR checks
gh pr checks <pr-number>

# View PR status
gh pr view <pr-number>
```

Post an additional PR comment whenever gate status changes or remediation is required.

**If CI fails:** Close PR, escalate to Tech Lead for remediation.

---

## PR Body Template

```markdown
## [Type] Title (Epic ID)

## Description

[Brief summary of what changed and why]

## Related Issue

Closes #<issue-number>

## Epic/Phase

Epic: <Epic ID and Name>  
Phase: <Phase Number and Name>

## Quality Gate Results

- ✅ **G1: Lint** — ESLint passed with 0 errors
- ✅ **G2: Format** — Prettier check passed
- ✅ **G3: Typecheck** — TypeScript strict mode passed
- ✅ **G4: Build** — Next.js production build succeeded
- ✅ **G5: Tests** — 260/260 tests passed, coverage 93.18%
- ✅ **G6: Security Scan** — gitleaks clean
- ✅ **G7: Dependency Scan** — 0 critical CVEs
- ⏳ **G8: Performance** — Pending deployment to staging
- ✅ **G9: Accessibility** — No UI changes
- ✅ **G10: Security Review** — Approved by security-engineer

## Complexity

- **Budgeted:** 15 points (Phase budget: 30)
- **Actual:** 15 points
- **Status:** ✅ On budget

## Files Changed

- `src/app/sitemap.ts` (+45, -12)
- `src/app/robots.ts` (+8, -2)
- `src/app/__tests__/sitemap.test.ts` (+67, -5)
- `src/app/__tests__/robots.test.ts` (+15, -3)
- `.system-state/model/system_state_model.yaml` (+120, -0)
- `.developer/DECISIONS/ADR-007-seo-approach.md` (+150, -0)

## Test Evidence

**Test Suites:** 32 passed / 32 total  
**Tests:** 260 passed / 260 total  
**Coverage:**

- Statements: 93.18% (threshold: ≥80%) ✅
- Branches: 87.37% (threshold: ≥75%) ✅
- Functions: 95.31%
- Lines: 92.88%

**Targeted SEO Tests:**

- `src/lib/seo/__tests__/metadata.test.ts` — 13 passing
- `src/lib/seo/__tests__/structured-data.test.ts` — 11 passing
- `src/app/__tests__/sitemap.test.ts` — 24 passing
- `src/app/__tests__/robots.test.ts` — 12 passing

## Security Review

**Status:** ✅ Approved  
**Reviewer:** security-engineer  
**Date:** 2026-02-25

**Findings:**

- 0 critical
- 0 high
- 1 medium (non-blocking: logging consistency)

**STRIDE Analysis:** PASS  
**PCI Compliance:** PASS (no payment boundary changes)  
**Crawl Exposure:** PASS (sensitive paths disallowed)

## Deployment Plan

**Staging:**

- Auto-deploy on merge to main
- Soak period: 24 hours
- Monitored metrics: Lighthouse SEO score, sitemap coverage, error rate

**Production:**

- Manual approval after staging validation
- Gradual rollout: 10% → 25% → 50% → 100%
- Rollout duration: 72 hours

## Rollback Plan

**Trigger Conditions:**

- Error rate >1%
- Checkout success rate <95%
- Lighthouse SEO score drops below 90
- Sitemap coverage <95%

**Rollback Method:**

- DNS fallback to Square Online Store
- Rollback time: <5 minutes
- Data: No data loss (Square is source of truth)

**Rollback Authority:** Chief of Staff or Quality Director

## Agent Sign-Offs

- [x] **Solution Architect** — Model compliance verified
- [x] **Tech Lead** — Implementation plan approved, slices executed
- [x] **Frontend Engineer** — React/UI changes reviewed (S1, S2)
- [x] **Backend Engineer** — API changes reviewed (S3, S4)
- [x] **QA Test Engineer** — Test coverage verified (S5)
- [x] **Security Engineer** — Security approved, STRIDE analysis complete
- [x] **Quality Director** — All quality gates passed, ready to ship

## Breaking Changes

**None**

This PR adds SEO enhancements with no breaking changes to existing functionality.

## Migration Required

**None**

No database migrations or environment variable changes required.

## Notes

- Sitemap intentionally emits baseline telemetry log under test conditions (expected behavior)
- One medium-priority recommendation from security: replace `console.error` with structured logger (non-blocking, tracked in issue #125)

---

**Quality Director Sign-Off:** ✅ Approved for production  
**Date:** 2026-02-25  
**Approver:** quality-director (Agent #70)
```

---

## Validation Checklist

**Before creating PR:**

- [ ] All commits pushed to feature branch
- [ ] All handoff files committed
- [ ] All quality gates G1-G10 validated
- [ ] Security review complete and approved
- [ ] Model compliance verified (code mirrors models)
- [ ] Complexity budget not exceeded
- [ ] No merge conflicts with main
- [ ] PR body template fully filled out

**After creating PR:**

- [ ] PR created successfully
- [ ] Reviewers assigned (Chief of Staff + at least 1 other)
- [ ] Labels applied (epic, type, status)
- [ ] GitHub issue updated with PR link
- [ ] CI/CD pipeline triggered and passing

---

## Common Issues

### Issue: CI/CD pipeline fails after PR creation

**Symptoms:**

- GitHub Actions shows red ❌
- Build/test/lint failures

**Solution:**

1. Review CI logs: `gh pr checks <pr-number>`
2. If critical failure: Close PR, escalate to Tech Lead
3. If transient failure: Re-run CI
4. If environment issue: Escalate to Platform Engineer

---

### Issue: Merge conflicts after PR creation

**Symptoms:**

- PR shows "Cannot merge due to conflicts"
- Main branch has diverged

**Solution:**

1. Escalate to Tech Lead
2. Tech Lead rebases feature branch
3. Re-validate quality gates
4. Update PR

---

### Issue: Security review not complete

**Symptoms:**

- G10 gate status is "pending"
- Security Engineer hasn't signed off

**Solution:**

1. DO NOT create PR
2. Dispatch to Security Engineer with handoff
3. Wait for security approval
4. Re-attempt PR creation after approval

---

## Output

Provide:

1. **PR number**
2. **PR URL**
3. **Status** (open, draft, ready)
4. **Reviewers assigned**
5. **CI status** (passing/failing)
6. **Next steps**

**Example Output:**

```
✅ Pull Request created successfully

PR #123: feat: SEO Foundation (E009)
URL: https://github.com/Coding-Krakken/FunkyTown/pull/123

Status: Open, Ready for Review

Reviewers assigned:
- @00-chief-of-staff (mandatory)
- @security-engineer
- @tech-lead

Labels:
- epic:e009
- feature
- ready-for-review

CI/CD Status: ✅ All checks passing
- Lint: PASS
- Typecheck: PASS
- Build: PASS
- Tests: PASS (260/260)

GitHub Issue: Closes #42

Next steps:
⏳ Awaiting approval from Chief of Staff
⏳ Estimated merge: within 48 hours
📊 Staging deployment will trigger automatically on merge
```

---

## Related Prompts

- [git-commit.prompt.md](git-commit.prompt.md) — Committing code changes
- [manage-issue.prompt.md](manage-issue.prompt.md) — Managing GitHub issues
- [branch-strategy.prompt.md](branch-strategy.prompt.md) — Branch management

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-25  
**Owner:** quality-director
