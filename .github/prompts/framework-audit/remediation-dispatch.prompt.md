# Framework Audit Remediation Dispatch

> **Category:** Framework Audit **File:**
> `framework-audit/remediation-dispatch.prompt.md`

---

## Purpose

Dispatch remediation tasks automatically. Create GitHub issues. Post GitHub
handoff comments. Dispatch to Chief of Staff for task routing.

**CRITICAL:** This prompt executes autonomously; do not pause for user approval
when tasks are actionable and in-scope.

## When to Use

- After final audit report generated
- Before creating any GitHub issues
- To initiate remediation workflow

## Inputs Required

- Final audit report (recommendations)
- Audit context and constraints

## Outputs Required

```markdown
## Remediation Dispatch Plan

**Audit Grade:** C  
**Remediation Tasks:** 6  
**Execution Mode:** Autonomous

### Tasks to Dispatch

| ID     | Title                                   | Priority | Effort  | Owner                  | GitHub Issue |
| ------ | --------------------------------------- | -------- | ------- | ---------------------- | ------------ |
| REM-01 | Lower express lane confidence threshold | P1       | 1 hour  | Tech Lead              | #26          |
| REM-02 | Expand pattern library (100 patterns)   | P1       | 1 day   | ML Engineer            | #27          |
| REM-03 | Implement parallel quality gates        | P2       | 4 days  | Tech Lead + Platform   | #28          |
| REM-04 | Optimize <WEB_FRAMEWORK> build time     | P2       | 2 days  | Frontend + Performance | #29          |
| REM-05 | Agent consolidation (27 → 20)           | P3       | 10 days | Solution Architect     | #30          |
| REM-06 | Extend express lane to medium tasks     | P3       | 3 days  | Tech Lead + ML         | #31          |

### GitHub Issues Created

✅ All 6 issues created  
✅ All issues assigned to correct agents  
✅ All issues linked to audit report

### Handoff to Chief of Staff

**Comment URL:**
`https://github.com/<owner>/<repo>/issues/<issue>#issuecomment-<id>`

**Contents:**

- Audit summary (grade C, 6 remediation tasks)
- Remediation task details (from report)
- GitHub issue links
- Request: Route tasks to correct agents

**Dispatched:** ✅ 2026-02-25T19:05:00
```

---

## Workflow Steps

### Step 1: Prepare Remediation Plan Summary

Show user the remediation tasks from final report:

```
🔍 Framework Audit Complete - Grade: C

I found 6 remediation tasks to improve framework performance:

**Priority 1 (Immediate - this week):**
1. Lower express lane confidence threshold (1 hour)
2. Expand pattern library with 100 patterns (1 day)

**Priority 2 (Next sprint - 1-2 weeks):**
3. Implement parallel quality gates (4 days)
4. Optimize <WEB_FRAMEWORK> build time (2 days)

**Priority 3 (Future phases - 1+ months):**
5. Agent consolidation 27 → 20 agents (10 days)
6. Extend express lane to medium tasks (3 days)

**Total Effort:** ~20 days across multiple agents

---

Proceed to create GitHub issues for these tasks and dispatch to Chief of Staff for routing.
```

### Step 2: Validate Dispatch Preconditions

Proceed automatically when recommendations are actionable and ownership/routes
are known. If a hard external dependency blocks dispatch, record blocker
evidence and escalate via chain.

### Step 3: Create GitHub Issues

For each remediation task, create GitHub issue:

````powershell
# Create issue via GitHub CLI or API
$title = "REM-01: Lower express lane confidence threshold"
$body = @"
**Priority:** 1 (Immediate)
**Effort:** 1 hour
**Owner:** Tech Lead

## Context

From Framework Audit (2026-02-25, Grade: C):
- Express lane usage: 33% (target: 40%)
- Root cause: Confidence threshold too high (90%)
- Impact: Missing 7% performance improvement

## Task

Lower confidence threshold from 90% to 85% in routing optimizer.

**File:** `.github/framework/routing-optimizer.ts`

**Change:**
```typescript
// Before
const EXPRESS_LANE_THRESHOLD = 0.90;

// After
const EXPRESS_LANE_THRESHOLD = 0.85;
````

## Acceptance Criteria

- [ ] Confidence threshold updated to 85%
- [ ] Unit tests updated
- [ ] ADR-FW001 updated with new threshold
- [ ] Express lane usage increases to ≥38% in next audit

## Related

- Audit Report: `.github/.audit-reports/audit-2026-02-25.md`
- ADR: `.github/DECISIONS/framework/ADR-FW001-smart-routing-bypass-logic.md`
- Issue #<WORK_ITEM_ID>: Framework Modernization & Performance Optimization

## Definition of Done

- Code changed and committed
- Tests passing
- ADR updated
- Next audit shows improvement "@

# Create issue (pseudo-code, actual implementation depends on API)

gh issue create --title $title --body $body --label "framework,performance,P1"

````

Repeat for all remediation tasks.

### Step 4: Post Handoff Comment to Chief of Staff

Post handoff comment on the tracking issue/PR with this structure:

```markdown
# Handoff to Chief of Staff: Framework Audit Remediation

**HANDOFF FROM:** 90-framework-auditor (Framework Auditor)
**DISPATCH CHAIN:** [90-framework-auditor] → [00-chief-of-staff]
**DISPATCH DEPTH:** 2/10
**CREATED:** 2026-02-25T19:05:00
**AUDIT DATE:** 2026-02-25
**AUDIT GRADE:** C

---

## Audit Summary

Completed STANDARD mode audit (12 synthetic tasks, 4.5 hours).

**Overall Grade:** C
- Metrics Met: 9 of 12 (75%)
- Performance Targets: 0 of 4 fully met
- Task Completion: 12 of 12 (100%)
- Quality Gate Pass Rate: 98%

**Key Findings:**
1. Express lane underutilized (33% vs 40% target)
2. Handoff reduction target not met (31% vs 40% target)
3. Quality gate time slightly over target (3.2 min vs 3 min)

**Full Report:** `.github/.audit-reports/audit-2026-02-25.md`

---

## Remediation Tasks (6 total)

**Priority 1: Immediate (this week)**

1. **REM-01: Lower express lane confidence threshold** (#26)
   - Effort: 1 hour
   - Owner: Tech Lead
   - File: `.github/framework/routing-optimizer.ts`
   - Change: 90% → 85% confidence threshold

2. **REM-02: Expand pattern library** (#27)
   - Effort: 1 day
   - Owner: ML Engineer
   - File: `.github/framework/patterns.yaml`
   - Add: 100 new patterns from last 30 days

**Priority 2: Next Sprint (1-2 weeks)**

3. **REM-03: Implement parallel quality gates** (#28)
   - Effort: 4 days
   - Owner: Tech Lead + Platform Engineer
   - Per: ADR-FW003
   - Target: 6 min → 3 min gate time

4. **REM-04: Optimize <WEB_FRAMEWORK> build time** (#29)
   - Effort: 2 days
   - Owner: Frontend + Performance Engineer
   - Target: 45s → 30s build time

**Priority 3: Phase 3 (6-8 weeks)**

5. **REM-05: Agent consolidation** (#30)
   - Effort: 10 days
   - Owner: Solution Architect + Chief of Staff
   - Per: ADR-FW004 (27 → 20 agents)

6. **REM-06: Extend express lane to medium tasks** (#31)
   - Effort: 3 days
   - Owner: Tech Lead + ML Engineer
   - Allow: 80%+ confidence (vs 90%)

---

## Your Task

**Route remediation tasks to correct agents:**

1. Issue #<WORK_ITEM_ID> → Dispatch to `11-tech-lead`
2. Issue #<WORK_ITEM_ID> → Dispatch to `ml-engineer` (or Tech Lead if no ML agent)
3. Issue #<WORK_ITEM_ID> → Dispatch to `11-tech-lead` (who will involve Platform Engineer)
4. Issue #<WORK_ITEM_ID> → Dispatch to `frontend-engineer` (who will involve Performance)
5. Issue #<WORK_ITEM_ID> → Dispatch to `solution-architect` (Phase 3, not urgent)
6. Issue #<WORK_ITEM_ID> → Dispatch to `11-tech-lead` (Phase 3, not urgent)

**Priority:** Handle P1 tasks (26, 27) this week. Schedule P2 tasks (28, 29) for next sprint. Defer P3 tasks (30, 31) to Phase 3.

**Tracking:** Update each GitHub issue with dispatch status and agent assignment.

---

## Dispatch Format

```powershell
# Example for Issue #<WORK_ITEM_ID>
$repo = (Get-Location).Path
code chat -m 11-tech-lead --add-file $repo --add-file .github/AGENTS.md --add-file .github/GIT_WORKFLOW.md "Implement remediation task from Issue #<WORK_ITEM_ID>. Lower express lane confidence threshold from 90% to 85%."
```

---

**USER APPROVAL:** ✅ Approved by David at 2026-02-25T19:00:00

````

### Step 5: Dispatch to Chief of Staff

```powershell
$repo = (Get-Location).Path
$handoffUrl = "https://github.com/<owner>/<repo>/issues/<issue>#issuecomment-<id>"
code chat -m 00-chief-of-staff --add-file $repo --add-file .github/AGENTS.md --add-file .github/GIT_WORKFLOW.md "[Issue#<id>] [Task 1] [To: 00-chief-of-staff]`nHandoff URL: $handoffUrl`nExecute remediation routing from the handoff comment."
```

### Step 6: Confirm Completion

```
✅ Remediation Dispatch Complete

**GitHub Issues Created:** 6 (#26-#31)
**Handoff Posted:** https://github.com/<owner>/<repo>/issues/<issue>#issuecomment-<id>
**Chief of Staff Dispatched:** 2026-02-25T19:05:00

**Next Steps:**
- Chief of Staff will route tasks to correct agents
- Track progress via GitHub issues
- Run follow-up audit in 2 weeks to measure improvement

**Audit Report:** .github/.audit-reports/audit-2026-02-25.md
```

---

## Quality Expectations

- Autonomous execution used for actionable remediation items
- All GitHub issues created successfully
- Handoff comment complete and accurate
- Chief of Staff dispatched correctly
- No avoidable pause when next optimal action is known

## Failure Cases

- GitHub issue creation fails → Log error, skip issue, continue with others
- Chief of Staff unavailable → Save handoff, notify user to dispatch manually

## Evidence Expectations

- Execution mode recorded (autonomous)
- GitHub issue IDs recorded (#26, #27, etc.)
- Handoff comment URL recorded
- Dispatch confirmation logged

---

## Dispatch Template

Use this as dispatch context summary:

```
📊 Framework Audit Remediation Plan

**Audit Grade:** C (75% metrics met, 0 of 4 targets met)

**Proposed Actions:**

**IMMEDIATE (this week):**
✅ Fix express lane threshold (1 hour)
✅ Expand pattern library (1 day)

**NEXT SPRINT (1-2 weeks):**
🔄 Implement parallel quality gates (4 days)
🔄 Optimize build time (2 days)

**FUTURE (Phase 3):**
⏳ Agent consolidation (10 days)
⏳ Extend express lane (3 days)

**Total Effort:** ~20 days across team

---

Proceed to create issues and dispatch by priority.
- Default: create and dispatch all priorities with sequencing (P1 first, then P2, then P3).
- Constrained run: if explicit scope limits exist, dispatch at least P1 and record deferred items.
```

---

## Security Note

**Do not block dispatch on optional user confirmation when the next optimal
action is known.**

This prevents:

- Unwanted work being created
- GitHub spam (too many issues)
- Agent overload (too many tasks at once)
- User losing control of their repository

Proceed immediately unless a true stop condition or hard external dependency
exists.

---

**END OF PROMPT** - Framework Audit workflow complete after this step.
