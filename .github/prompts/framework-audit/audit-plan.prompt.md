# Framework Audit Plan

> **Category:** Framework Audit
> **File:** `framework-audit/audit-plan.prompt.md`

---

## Purpose

Create a structured audit execution plan with baseline framework state capture, synthetic task selection, expected outcomes, and pass/fail criteria.

## When to Use

- After audit mode selection
- Before executing synthetic tasks
- To establish baseline for comparison

## Inputs Required

- Selected audit mode (FAST/STANDARD/THOROUGH)
- Current framework state (agent count, routing rules, quality gates)
- Performance targets (from Issue #25)

## Outputs Required

```markdown
## Framework Audit Plan

**Mode:** [FAST|STANDARD|THOROUGH]
**Date:** [YYYY-MM-DD]
**Auditor:** Framework Auditor (Agent #90)

### Baseline Framework State

| Metric               | Current Value | Target Value | Status     |
| -------------------- | ------------- | ------------ | ---------- |
| Agent Count          | 27            | 20           | ❌ Not Met |
| Average Execution    | 50 min        | 5-15 min     | ❌ Not Met |
| Average Handoffs     | 5.5           | 3-4          | ❌ Not Met |
| Express Lane Rate    | 0%            | 40%          | ❌ Not Met |
| Quality Gate Time    | 6 min         | 3 min        | ❌ Not Met |
| Routing Accuracy     | Unknown       | >95%         | ⚠️ Measure |
| Task Completion Rate | Unknown       | >98%         | ⚠️ Measure |
| Error Rate           | Unknown       | <1%          | ⚠️ Measure |

### Synthetic Tasks Selected

[List of tasks from synthetic-task-battery.prompt.md based on mode]

### Expected Outcomes

**FAST Mode:**

- All 5 tasks complete successfully
- Average execution time <20 min
- Average handoffs ≤4
- Zero deadlocks or infinite loops

**STANDARD Mode:**

- All 12 tasks complete successfully
- Average execution time <25 min
- Average handoffs ≤4.5
- Express lane usage ≥20%
- Quality gate pass rate ≥95%

**THOROUGH Mode:**

- All 30 tasks complete successfully
- P50 execution time <15 min
- P95 execution time <40 min
- Express lane usage ≥30%
- Quality gate pass rate ≥98%
- Zero critical failures

### Execution Plan

1. **Baseline Capture** (5 min)
2. **Task 1 Execution** (est. X min)
3. **Task 2 Execution** (est. X min)
   ...
   N. **Metrics Calculation** (10 min)
   N+1. **Report Generation** (15 min)

**Total Estimated Time:** [30 min | 2 hours | 6 hours]

### Monitoring Plan

- Real-time metrics dashboard (PowerShell script)
- Failure detection (abort on deadlock)
- Progress tracking (% complete)
- Resource monitoring (CPU, memory, disk)

### Abort Criteria

- > 50% task failure rate
- Deadlock detected
- Execution time >2x expected
- Critical framework error (routing failure, quality gate crash)
```

## Workflow Steps

### 1. Capture Baseline State

Run these PowerShell commands to capture current framework state:

```powershell
# Agent count
Get-ChildItem .github/agents/*.agent.md | Measure-Object | Select-Object -ExpandProperty Count

# Recent tasks (last 10)
Get-ChildItem .github/.handoffs/**/*.md | Sort-Object LastWriteTime -Descending | Select-Object -First 10

# Quality gate configuration
Get-Content .github/QUALITY-GATES.md

# Framework config
Get-Content .github/framework-config/*.yaml
```

### 2. Select Synthetic Tasks

Based on mode, select tasks from `synthetic-task-battery.prompt.md`:

- **FAST:** 5 tasks (1 trivial, 2 simple, 2 medium)
- **STANDARD:** 12 tasks (2 trivial, 4 simple, 4 medium, 2 complex)
- **THOROUGH:** 30 tasks (5 trivial, 10 simple, 10 medium, 5 complex)

### 3. Define Expected Outcomes

For each task, specify:

- Expected agent chain (e.g., Chief of Staff → Tech Lead → Frontend Engineer → QA → Quality Director)
- Expected handoff count (e.g., 4 handoffs)
- Expected execution time (e.g., 15 minutes)
- Pass criteria (e.g., code passes all quality gates, PR created)

### 4. Create Monitoring Plan

Set up real-time monitoring:

- Execution time tracker (start/end timestamps)
- Handoff counter (parse dispatch chains)
- Failure detector (error logs, abort signals)
- Progress bar (tasks completed / total tasks)

### 5. Define Abort Criteria

Specify when to abort audit:

- Task failure rate >50%
- Deadlock detected (no progress for 15 min)
- Execution time >2x expected
- Critical framework error

## Quality Expectations

- Baseline state is accurate (measured, not estimated)
- Task selection is representative (covers all agent types)
- Expected outcomes are specific (not "should work")
- Monitoring plan is automated (PowerShell scripts)
- Abort criteria are measurable (not subjective)

## Failure Cases

- Cannot capture baseline → Escalate to Tech Lead (framework broken)
- No synthetic tasks available → Use example tasks from prompt
- Unclear performance targets → Use defaults from Issue #25

## Evidence Expectations

- Baseline state snapshot (markdown table)
- Synthetic task list with expected outcomes
- Monitoring scripts (PowerShell)
- Abort criteria checklist

---

## Example Output

````markdown
## Framework Audit Plan

**Mode:** STANDARD
**Date:** 2026-02-25
**Auditor:** Framework Auditor (Agent #90)
**User:** David
**Approval:** ✅ 2026-02-25T14:35:00

### Baseline Framework State

| Metric               | Current Value | Target Value | Status     |
| -------------------- | ------------- | ------------ | ---------- |
| Agent Count          | 27            | 20           | ❌ Not Met |
| Average Execution    | Unknown\*     | 5-15 min     | ⚠️ Measure |
| Average Handoffs     | Unknown\*     | 3-4          | ⚠️ Measure |
| Express Lane Rate    | 0%            | 40%          | ❌ Not Met |
| Quality Gate Time    | 6 min\*\*     | 3 min        | ❌ Not Met |
| Routing Accuracy     | Unknown\*     | >95%         | ⚠️ Measure |
| Task Completion Rate | Unknown\*     | >98%         | ⚠️ Measure |
| Error Rate           | Unknown\*     | <1%          | ⚠️ Measure |

\*Will be measured during audit
\*\*From manual testing (needs validation)

### Synthetic Tasks Selected (12 tasks)

**Trivial (2 tasks):**

1. Fix typo in README (expected: Chief → Doc Engineer → Quality Director, 5 min, 2 handoffs)
2. Update changelog (expected: Chief → Doc Engineer → Quality Director, 5 min, 2 handoffs)

**Simple (4 tasks):** 3. Add unit test for existing function (expected: Chief → QA → Quality Director, 10 min, 2 handoffs) 4. Update component prop types (expected: Chief → Frontend → QA → Quality Director, 12 min, 3 handoffs) 5. Add error logging to API route (expected: Chief → Backend → QA → Quality Director, 12 min, 3 handoffs) 6. Create ADR for minor decision (expected: Chief → Solution Architect → Quality Director, 15 min, 2 handoffs)

**Medium (4 tasks):** 7. Implement new UI component (expected: Chief → Tech Lead → Frontend → QA → Quality Director, 25 min, 4 handoffs) 8. Add new API endpoint (expected: Chief → Tech Lead → Backend → QA → Security → Quality Director, 30 min, 5 handoffs) 9. Refactor shared utility (expected: Chief → Tech Lead → Engineer → QA → Quality Director, 20 min, 4 handoffs) 10. Update SEO metadata schema (expected: Chief → Solution Architect → Tech Lead → Frontend → QA → Quality Director, 30 min, 5 handoffs)

**Complex (2 tasks):** 11. Design and implement caching layer (expected: Chief → Solution Architect → Tech Lead → Backend → QA → Security → Performance → Quality Director, 50 min, 7 handoffs) 12. Security audit of checkout flow (expected: Chief → Security → Red Team → Backend → QA → Quality Director, 45 min, 5 handoffs)

### Expected Outcomes (STANDARD Mode)

- ✅ All 12 tasks complete successfully
- ✅ Average execution time <25 min
- ✅ Average handoffs ≤4.5
- ✅ Express lane usage ≥20% (tasks 1, 2, 3 use express lane)
- ✅ Quality gate pass rate ≥95%
- ✅ No deadlocks or infinite loops

### Execution Timeline

| Time       | Activity               | Duration |
| ---------- | ---------------------- | -------- |
| T+0:00     | Baseline Capture       | 5 min    |
| T+0:05     | Task 1 (Typo)          | 5 min    |
| T+0:10     | Task 2 (Changelog)     | 5 min    |
| T+0:15     | Task 3 (Unit Test)     | 10 min   |
| T+0:25     | Task 4 (Prop Types)    | 12 min   |
| T+0:37     | Task 5 (Error Logging) | 12 min   |
| T+0:49     | Task 6 (ADR)           | 15 min   |
| T+1:04     | Task 7 (UI Component)  | 25 min   |
| T+1:29     | Task 8 (API Endpoint)  | 30 min   |
| T+1:59     | Task 9 (Refactor)      | 20 min   |
| T+2:19     | Task 10 (SEO)          | 30 min   |
| T+2:49     | Task 11 (Caching)      | 50 min   |
| T+3:39     | Task 12 (Security)     | 45 min   |
| T+4:24     | Metrics Calculation    | 10 min   |
| T+4:34     | Report Generation      | 15 min   |
| **T+4:49** | **AUDIT COMPLETE**     | **~5h**  |

\*Note: Actual may vary ±20%

### Monitoring Plan

**Real-Time Dashboard (PowerShell):**

```powershell
# Monitor progress every 30 seconds
while ($true) {
    Clear-Host
    Write-Host "Framework Audit Progress" -ForegroundColor Cyan
    Write-Host "=========================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Tasks Completed: $completed / 12"
    Write-Host "Average Execution: $avgExec min"
    Write-Host "Average Handoffs: $avgHandoffs"
    Write-Host "Failures: $failures"
    Write-Host ""
    Write-Host "Current Task: $currentTask"
    Write-Host "Status: $status"
    Start-Sleep -Seconds 30
}
```
````

### Abort Criteria

| Condition                  | Action                         |
| -------------------------- | ------------------------------ |
| Task failure rate >50%     | Abort → Escalate to Chief      |
| Deadlock (no progress 15m) | Abort → Escalate to Chief + QD |
| Execution time >10 hours   | Abort → Report partial results |
| Critical framework error   | Abort → Emergency escalation   |

**Next Step:** Execute synthetic tasks with real-time monitoring.

```

---

## Handoff to Next Prompt

After audit plan creation, proceed to:
- **Next Prompt:** `framework-audit/synthetic-task-battery.prompt.md` + `framework-audit/monitoring-rubric.prompt.md`
- **Input:** Audit plan (tasks, expected outcomes, monitoring setup)
- **Task:** Execute tasks and monitor in real-time
```
