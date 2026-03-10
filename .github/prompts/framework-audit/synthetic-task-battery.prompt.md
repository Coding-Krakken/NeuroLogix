# Synthetic Task Battery

> **Category:** Framework Audit
> **File:** `framework-audit/synthetic-task-battery.prompt.md`

---

## Purpose

Provide a comprehensive library of synthetic tasks to test the framework across different complexities, agent types, and workflows. Tasks are designed to validate routing, handoffs, quality gates, and agent coordination.

## When to Use

- During framework audit execution
- Selecting tasks for FAST/STANDARD/THOROUGH modes
- Creating custom audit scenarios

## Task Library Structure

Each task includes:

- **ID:** Unique identifier (T-XXX)
- **Complexity:** Trivial / Simple / Medium / Complex
- **Description:** What needs to be done
- **Expected Agent Chain:** Which agents should be involved
- **Expected Handoffs:** Number of handoffs
- **Expected Duration:** Estimated execution time
- **Pass Criteria:** What success looks like
- **Failure Modes:** Common ways this task can fail

---

## TRIVIAL Tasks (5-10 minutes, 2-3 handoffs)

### T-001: Fix Typo in README

**Complexity:** Trivial  
**Description:** Fix a typo in README.md (change "developement" to "development")  
**Expected Chain:** Chief of Staff → Documentation Engineer → Quality Director  
**Expected Handoffs:** 2  
**Expected Duration:** 5 min  
**Pass Criteria:** Typo fixed, committed, no quality gate failures  
**Express Lane:** Yes (trivial change)  
**Failure Modes:** Routing to wrong agent, quality gates fail on unrelated issues

### T-002: Update Changelog Entry

**Complexity:** Trivial  
**Description:** Add entry to CHANGELOG.md for recent bug fix  
**Expected Chain:** Chief of Staff → Documentation Engineer → Quality Director  
**Expected Handoffs:** 2  
**Expected Duration:** 5 min  
**Pass Criteria:** Changelog updated with correct format, committed  
**Express Lane:** Yes (docs-only)  
**Failure Modes:** Wrong changelog format, merge conflict

### T-003: Add Code Comment

**Complexity:** Trivial  
**Description:** Add JSDoc comment to existing function  
**Expected Chain:** Chief of Staff → Relevant Engineer → Quality Director  
**Expected Handoffs:** 2  
**Expected Duration:** 7 min  
**Pass Criteria:** Comment added, follows JSDoc format, no lint errors  
**Express Lane:** Yes (single-file, <10 lines)  
**Failure Modes:** Wrong comment format, TypeScript errors

### T-004: Format Code File

**Complexity:** Trivial  
**Description:** Run Prettier on a single file  
**Expected Chain:** Chief of Staff → Quality Director  
**Expected Handoffs:** 1  
**Expected Duration:** 3 min  
**Pass Criteria:** File formatted, no changes other than whitespace  
**Express Lane:** Yes (formatting only)  
**Failure Modes:** Prettier config broken, unrelated changes

### T-005: Update Package Version

**Complexity:** Trivial  
**Description:** Bump version in package.json (1.2.3 → 1.2.4)  
**Expected Chain:** Chief of Staff → Platform Engineer → Quality Director  
**Expected Handoffs:** 2  
**Expected Duration:** 5 min  
**Pass Criteria:** Version updated, npm install succeeds  
**Express Lane:** No (version bump requires validation)  
**Failure Modes:** Breaking dependencies, wrong version format

---

## SIMPLE Tasks (10-20 minutes, 3-4 handoffs)

### T-006: Add Unit Test

**Complexity:** Simple  
**Description:** Write unit test for existing utility function  
**Expected Chain:** Chief of Staff → QA Test Engineer → Quality Director  
**Expected Handoffs:** 2  
**Expected Duration:** 10 min  
**Pass Criteria:** Test written, passes, coverage increases  
**Express Lane:** Yes (test-only change)  
**Failure Modes:** Test doesn't cover edge cases, flaky test

### T-007: Update Component Props

**Complexity:** Simple  
**Description:** Add optional prop to React component with TypeScript types  
**Expected Chain:** Chief of Staff → Frontend Engineer → QA → Quality Director  
**Expected Handoffs:** 3  
**Expected Duration:** 12 min  
**Pass Criteria:** Prop added, typed correctly, tests updated, no breaking changes  
**Express Lane:** No (requires testing)  
**Failure Modes:** Breaking change, missing PropTypes, insufficient tests

### T-008: Add Error Logging

**Complexity:** Simple  
**Description:** Add error logging to catch block in API route  
**Expected Chain:** Chief of Staff → Backend Engineer → QA → Quality Director  
**Expected Handoffs:** 3  
**Expected Duration:** 12 min  
**Pass Criteria:** Logging added, no PII leaked, structured format  
**Express Lane:** No (security concern - PII)  
**Failure Modes:** Logging PII, wrong log level, missing context

### T-009: Create Simple ADR

**Complexity:** Simple  
**Description:** Document decision to use React Hook Form (ADR already decided)  
**Expected Chain:** Chief of Staff → Solution Architect → Quality Director  
**Expected Handoffs:** 2  
**Expected Duration:** 15 min  
**Pass Criteria:** ADR follows template, clear rationale, alternatives listed  
**Express Lane:** No (architecture documentation)  
**Failure Modes:** Wrong ADR format, missing alternatives, unclear decision

### T-010: Add Environment Variable

**Complexity:** Simple  
**Description:** Add new env var to .env.example and document usage  
**Expected Chain:** Chief of Staff → Backend Engineer → Platform Engineer → Quality Director  
**Expected Handoffs:** 3  
**Expected Duration:** 10 min  
**Pass Criteria:** Env var documented, added to .env.example, not in code  
**Express Lane:** No (security - secrets management)  
**Failure Modes:** Hardcoded value, missing from .env.example, unclear docs

---

## MEDIUM Tasks (20-40 minutes, 4-6 handoffs)

### T-011: Implement UI Component

**Complexity:** Medium  
**Description:** Create new Button component with variants (primary, secondary, danger)  
**Expected Chain:** Chief → Tech Lead → Frontend → QA → Quality Director  
**Expected Handoffs:** 4  
**Expected Duration:** 25 min  
**Pass Criteria:** Component implemented, tested, accessible, documented  
**Express Lane:** No (new feature)  
**Failure Modes:** Accessibility failures, missing variants, no tests

### T-012: Add New API Endpoint

**Complexity:** Medium  
**Description:** Create GET /api/health endpoint returning system status  
**Expected Chain:** Chief → Tech Lead → Backend → QA → Security → Quality Director  
**Expected Handoffs:** 5  
**Expected Duration:** 30 min  
**Pass Criteria:** Endpoint works, tested, documented, no auth required (health check)  
**Express Lane:** No (new API)  
**Failure Modes:** Missing tests, wrong status codes, security issues

### T-013: Refactor Shared Utility

**Complexity:** Medium  
**Description:** Extract duplicate logic into shared utility function  
**Expected Chain:** Chief → Tech Lead → Engineer → QA → Quality Director  
**Expected Handoffs:** 4  
**Expected Duration:** 20 min  
**Pass Criteria:** Logic extracted, all callers updated, tests pass, no regressions  
**Express Lane:** No (requires testing across callers)  
**Failure Modes:** Breaking changes, missed callers, test failures

### T-014: Update SEO Metadata

**Complexity:** Medium  
**Description:** Update OpenGraph tags for product pages  
**Expected Chain:** Chief → Solution Architect → Tech Lead → Frontend → QA → Quality Director  
**Expected Handoffs:** 5  
**Expected Duration:** 30 min  
**Pass Criteria:** OG tags correct, validated, no duplicates, tested  
**Express Lane:** No (SEO requires architecture review)  
**Failure Modes:** Wrong OG tag format, missing required tags, not validated

### T-015: Add Form Validation

**Complexity:** Medium  
**Description:** Add Zod schema validation to checkout form  
**Expected Chain:** Chief → Tech Lead → Frontend → QA → Quality Director  
**Expected Handoffs:** 4  
**Expected Duration:** 25 min  
**Pass Criteria:** Validation added, user-friendly errors, tested  
**Express Lane:** No (validation logic + UX)  
**Failure Modes:** Weak validation, poor error messages, missing edge cases

---

## COMPLEX Tasks (40+ minutes, 6-8 handoffs)

### T-016: Design Caching Layer

**Complexity:** Complex  
**Description:** Design and implement Redis caching for product catalog  
**Expected Chain:** Chief → Solution Architect → Tech Lead → Backend → QA → Security → Performance → Quality Director  
**Expected Handoffs:** 7  
**Expected Duration:** 50 min  
**Pass Criteria:** ADR written, cache implemented, invalidation strategy, tested, performance improved  
**Express Lane:** No (architecture + implementation)  
**Failure Modes:** Cache poisoning, stale data, no invalidation, performance regression

### T-017: Security Audit

**Complexity:** Complex  
**Description:** Audit checkout flow for security vulnerabilities  
**Expected Chain:** Chief → Security → Red Team → Backend → QA → Quality Director  
**Expected Handoffs:** 5  
**Expected Duration:** 45 min  
**Pass Criteria:** Audit complete, vulnerabilities identified, remediation plan, no critical issues  
**Express Lane:** No (security review)  
**Failure Modes:** Missed vulnerabilities, no remediation plan, incomplete audit

### T-018: Implement Feature Flag

**Complexity:** Complex  
**Description:** Add feature flag system with Vercel Edge Config  
**Expected Chain:** Chief → Solution Architect → Tech Lead → Platform → Backend → Frontend → QA → Quality Director  
**Expected Handoffs:** 7  
**Expected Duration:** 60 min  
**Pass Criteria:** ADR written, Edge Config integrated, flags work, tested, documented  
**Express Lane:** No (architecture + cross-cutting)  
**Failure Modes:** Flags don't toggle correctly, no rollback, breaking changes

### T-019: Database Migration

**Complexity:** Complex  
**Description:** Design migration to add new table for wishlists  
**Expected Chain:** Chief → Solution Architect → Data Engineer → Backend → QA → Quality Director  
**Expected Handoffs:** 5  
**Expected Duration:** 50 min  
**Pass Criteria:** Migration script, rollback script, tested on staging, no data loss  
**Express Lane:** No (data migration)  
**Failure Modes:** Data loss, deadlocks, no rollback, breaking changes

### T-020: Implement A/B Test

**Complexity:** Complex  
**Description:** Set up A/B test for product page layout  
**Expected Chain:** Chief → Product Owner → Solution Architect → Tech Lead → Frontend → QA → Quality Director  
**Expected Handoffs:** 6  
**Expected Duration:** 55 min  
**Pass Criteria:** Test setup, variants implemented, analytics tracking, documented  
**Express Lane:** No (product + architecture + implementation)  
**Failure Modes:** Biased test, no analytics, variants not equal traffic

---

## Mode-Specific Task Selection

### FAST Mode (5 tasks, 30 min)

- T-001: Fix Typo (trivial)
- T-002: Update Changelog (trivial)
- T-006: Add Unit Test (simple)
- T-011: Implement UI Component (medium)
- T-012: Add API Endpoint (medium)

**Coverage:** Docs, testing, frontend, backend  
**Express Lane:** 2 of 5 (40%)  
**Expected Total:** 82 min (avg 16.4 min/task)

### STANDARD Mode (12 tasks, 2 hours)

- T-001, T-002 (trivial x2)
- T-006, T-007, T-008, T-009 (simple x4)
- T-011, T-012, T-013, T-014 (medium x4)
- T-016, T-017 (complex x2)

**Coverage:** All agent types  
**Express Lane:** 3 of 12 (25%)  
**Expected Total:** 277 min (avg 23 min/task) = 4.6 hours

### THOROUGH Mode (30 tasks, 6 hours)

- All 20 tasks above
- 10 additional edge case tasks (deadlock scenarios, failure mode testing, stress tests)

**Coverage:** Comprehensive + edge cases  
**Express Lane:** 8 of 30 (27%)  
**Expected Total:** ~6 hours

---

## Task Execution Format

For each task:

````markdown
### Executing Task T-XXX: [Task Name]

**Started:** [timestamp]
**Expected Duration:** [X min]
**Expected Chain:** [agents]
**Expected Handoffs:** [N]

**Dispatching to Chief of Staff:**

```powershell
$task = "T-XXX: [description]"
code chat -m 00-chief-of-staff --add-file $repo "$task"
```
````

**Monitoring:**

- Handoff count: [track]
- Execution time: [track]
- Quality gates: [track]
- Express lane used: [Yes/No]

**Completed:** [timestamp]
**Actual Duration:** [X min]
**Actual Chain:** [agents]
**Actual Handoffs:** [N]
**Result:** [PASS/FAIL]
**Notes:** [any deviations]

```

---

## Handoff to Next Prompt

During task execution, use:
- **Concurrent Prompt:** `framework-audit/monitoring-rubric.prompt.md`
- **Task:** Real-time monitoring and failure detection
```
