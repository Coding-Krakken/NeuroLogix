# Framework Audit Mode Selection

> **Category:** Framework Audit
> **File:** `framework-audit/mode-selection.prompt.md`

---

## Purpose

Select the appropriate audit mode (FAST, STANDARD, or THOROUGH) autonomously using deterministic rules. Never ask the user for mode input.

## When to Use

- Starting a framework audit
- User requests "audit framework health"
- After framework modernization changes
- Before major releases

## Inputs Required

- Current framework context (recent changes, prior audit grade, incident/release signals)
- Execution objective (scheduled health check, pre-release, post-incident)

## Outputs Required

```markdown
## Audit Mode Selection

**Selected Mode:** [FAST|STANDARD|THOROUGH]

**Rationale:** [Why this mode was selected]

**Expected Duration:** [30 min | 2 hours | 6 hours]

**Tasks to Execute:** [5 | 12 | 30] synthetic tasks

**Metrics to Calculate:** [Subset | All 12 | All 12 + statistical analysis]
```

## Workflow Steps

### 1. Collect Context Automatically

Gather available signals from artifacts and recent workflow state:

- Recent framework changes (routing, handoffs, quality gates)
- Prior audit grade and unresolved remediation backlog
- Incident or release-readiness status
- Scheduled audit cadence (daily/weekly/monthly)

### 2. Recommend Mode Based on Context

**Recommend FAST if:**

- User has <1 hour available
- Audit purpose is "daily check" or "CI validation"
- No recent framework changes
- User wants quick confirmation framework is healthy

**Recommend STANDARD if:**

- User has 2-4 hours available
- Audit purpose is "weekly audit" or "pre-release"
- Minor framework changes (bug fixes, small features)
- First time running audit

**Recommend THOROUGH if:**

- User has 6+ hours available
- Audit purpose is "deep analysis" or "post-modernization"
- Major framework changes (routing redesign, agent consolidation)
- Previous audit found significant issues (grade D or F)

### 3. Apply Autonomous Decision Rule

Select mode without user interaction:

- If major framework changes OR post-incident OR prior grade D/F → **THOROUGH**
- Else if weekly/pre-release validation OR uncertain context → **STANDARD**
- Else for daily smoke validation with low change volume → **FAST**

### 4. Record Selection

Document the selection with rationale and timestamp. If context is incomplete, record assumption and route uncertainty to `00-chief-of-staff` without pausing execution.

## Quality Expectations

- Recommendation is justified based on context
- No user prompts, approvals, or pauses are introduced
- Selection is documented for audit trail

## Failure Cases

- Context uncertain → Select STANDARD as safe default and escalate assumptions to Chief of Staff
- Conflicting signals → Select STANDARD and annotate escalation note
- Missing telemetry → Continue with available data and flag data gap in report

## Evidence Expectations

- Mode selection document (markdown)
- Rationale for recommendation
- Context captured (objective, recent changes, prior grade, incident/release signals)

---

## Example Output

```markdown
## Audit Mode Selection

**Selected Mode:** STANDARD

**Rationale:** Weekly pre-release audit with minor framework changes (handoff protocol v2), no incident trigger, and no unresolved grade D/F history. STANDARD mode provides comprehensive coverage of all agent types and all 12 metrics.

**Expected Duration:** 2 hours

**Tasks to Execute:** 12 synthetic tasks

- 2 trivial (docs, typos)
- 4 simple (single-file edits, test-only)
- 4 medium (multi-file features, API changes)
- 2 complex (architecture changes, security reviews)

**Metrics to Calculate:** All 12 metrics

1. Average execution time
2. Average handoff count
3. Express lane usage rate
4. Routing accuracy
5. Quality gate pass rate
6. Quality gate execution time
7. Handoff file size
8. Telemetry overhead
9. Task completion rate
10. Deadlock detection rate
11. Error rate
12. Agent utilization

**Next Step:** Create audit plan with baseline capture and task selection.
```

---

## Handoff to Next Prompt

After mode selection, proceed to:

- **Next Prompt:** `framework-audit/audit-plan.prompt.md`
- **Input:** Selected mode (FAST/STANDARD/THOROUGH)
- **Task:** Create structured audit execution plan
