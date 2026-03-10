# Framework Audit Remediation Dispatch

> **Category:** Framework Audit
> **File:** `framework-audit/remediation-dispatch.prompt.md`

---

## Purpose

Dispatch remediation tasks automatically. Create GitHub issues, generate handoff files, and route to Chief of Staff without pausing for user input.

**CRITICAL:** Never ask for user approval or clarification. If uncertain, continue with conservative defaults and escalate context to `00-chief-of-staff`.

## When to Use

- After final audit report generated
- To initiate remediation workflow

## Inputs Required

- Final audit report (recommendations)
- Current dispatch chain metadata

## Outputs Required

```markdown
## Remediation Dispatch Plan

**Audit Grade:** C  
**Remediation Tasks:** 6

### Tasks to Dispatch

| ID     | Title                                   | Priority | Effort  | Owner                  | GitHub Issue |
| ------ | --------------------------------------- | -------- | ------- | ---------------------- | ------------ |
| REM-01 | Lower express lane confidence threshold | P1       | 1 hour  | Tech Lead              | #26          |
| REM-02 | Expand pattern library (100 patterns)   | P1       | 1 day   | ML Engineer            | #27          |
| REM-03 | Implement parallel quality gates        | P2       | 4 days  | Tech Lead + Platform   | #28          |
| REM-04 | Optimize Next.js build time             | P2       | 2 days  | Frontend + Performance | #29          |
| REM-05 | Agent consolidation (27 → 20)           | P3       | 10 days | Solution Architect     | #30          |
| REM-06 | Extend express lane to medium tasks     | P3       | 3 days  | Tech Lead + ML         | #31          |

### GitHub Issues Created

✅ All issues created  
✅ All issues assigned to correct agents  
✅ All issues linked to audit report

### Handoff to Chief of Staff

**File:** `.github/.handoffs/00-chief-of-staff/handoff-YYYYMMDD-HHmmss.md`

**Dispatched:** ✅ [timestamp]
```

---

## Workflow Steps

### Step 1: Finalize Remediation Plan

Normalize findings from the final audit report into actionable tasks:

- ID, title, priority, effort, owner
- Acceptance criteria and evidence expectations
- Dependency and sequencing notes

### Step 2: Auto-Dispatch Decision

Proceed immediately with mandatory dispatch:

- Create issues for all approved remediation items
- Assign owners and labels by policy
- Record assumptions inline when context is incomplete
- Escalate unresolved ambiguity to `00-chief-of-staff` without blocking

### Step 3: Create GitHub Issues

Create one issue per remediation item with:

- Context from audit findings
- Task scope and explicit acceptance criteria
- Related report and ADR links
- Definition of done

### Step 4: Create Handoff to Chief of Staff

Create `.github/.handoffs/00-chief-of-staff/handoff-<timestamp>.md` including:

- Audit summary (grade, key findings)
- Remediation task table with issue links
- Priority rationale
- Dispatch-chain metadata
- Explicit request for routing execution

### Step 5: Dispatch

Dispatch to `00-chief-of-staff` using file-based handoff protocol.

---

## Quality Expectations

- All remediation tasks convert to actionable issues
- Ownership, priority, and acceptance criteria are explicit
- No user-gated step appears anywhere in the flow
- Handoff includes full routing context

## Failure Cases

- Missing owner mapping → assign default owner by capability and escalate note
- Conflicting priorities → preserve risk-first order and escalate note
- Issue creation error → retry once, then attach failure evidence and dispatch partial set

## Evidence Expectations

- Remediation dispatch plan document
- Issue URLs list
- Handoff file path and timestamp
- Dispatch command result

## Handoff to Next Prompt

After dispatching remediation tasks, proceed to:

- **Next Agent:** `00-chief-of-staff`
- **Input:** Handoff file + issue links + dispatch metadata
- **Task:** Route remediation tasks to execution agents

---

## Final Rule

Automatic handoff is mandatory. No human-gated approvals, confirmations, or pauses are allowed.
