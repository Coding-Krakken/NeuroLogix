# Gap Analysis

> **Category:** Review
> **File:** `review/gap-analysis.prompt.md`

---

## Purpose

Identify gaps between the current state and the desired state: missing tests, incomplete features, documentation gaps, security holes, accessibility issues, and model drift.

## When to Use

- Before marking a feature complete
- During quality review
- When QA finds issues
- Periodic health checks

## Inputs Required

- Acceptance criteria (what should exist)
- Current implementation (what does exist)
- Test coverage report
- Quality gate results

## Outputs Required

```markdown
## Gap Analysis: [Feature/Area]

### Coverage Gaps

| Gap            | Current          | Target     | Priority |
| -------------- | ---------------- | ---------- | -------- |
| Test coverage  | 65%              | 80%        | HIGH     |
| Error handling | 3/7 routes       | 7/7 routes | HIGH     |
| Documentation  | Missing API docs | Complete   | MEDIUM   |

### Missing Items

- [ ] [Specific missing item] — Priority, Owner
- [ ] [Specific missing item] — Priority, Owner

### Model Drift

- [ ] [Code that doesn't match model] — File, Line

### Remediation Plan

1. [Action item with owner and priority]
2. [Action item with owner and priority]
```

## Quality Expectations

- Every gap has a concrete measurement
- Gaps are prioritized by impact
- Remediation plan is actionable
- No vague gaps ("needs improvement")

## Failure Cases

- No acceptance criteria defined → Cannot analyze. Request from Product Owner.
- Coverage tool not configured → Run manually and report.

## Evidence Expectations

- Coverage report data
- File-level gap mapping
- Model comparison results
