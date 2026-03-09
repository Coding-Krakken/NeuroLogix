# Framework Audit Mode Selection

> **Category:** Framework Audit
> **File:** `framework-audit/mode-selection.prompt.md`

---

## Purpose

Select the appropriate audit mode (FAST, STANDARD, or THOROUGH) autonomously based on available context, constraints, and audit goals.

## When to Use

- Starting a framework audit
- User requests "audit framework health"
- After framework modernization changes
- Before major releases

## Inputs Required

- Available time/compute constraints (if provided)
- Audit purpose inferred from context (daily check, weekly audit, deep analysis)
- Recent framework changes (if any)

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

### 1. Gather Context Automatically

Derive context from repository evidence and active task context first.
If context is incomplete, proceed with deterministic defaults instead of pausing for user choice.

### 2. Select Mode Based on Context

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

### 3. Apply Deterministic Defaults

- Default to **STANDARD** when constraints are unclear.
- Use **FAST** for explicit short-window validation.
- Use **THOROUGH** for explicit deep-audit context or major framework changes.
- Do not ask the user to choose mode unless a hard external constraint must be provided.

### 4. Record Selection

Document the selection with rationale and evidence used.

## Quality Expectations

- Recommendation is justified based on context
- Selection is documented for audit trail

## Failure Cases

- Context uncertain → Select STANDARD as safe default
- Explicit custom constraint → Map to closest supported mode and document rationale
- Explicit runtime limit <30 min → Select FAST and limit scope deterministically

## Evidence Expectations

- Mode selection document (markdown)
- Rationale for recommendation
- Context captured (time, purpose, recent changes)

---

## Example Output

```markdown
## Audit Mode Selection

**Selected Mode:** STANDARD

**Rationale:** User has 2 hours available, this is a weekly audit before release v1.5.0, and there have been minor framework changes (handoff protocol v2 implemented in Phase 2). STANDARD mode provides comprehensive coverage of all agent types and all 12 metrics without the time commitment of THOROUGH mode.

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
7. Handoff payload size
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
