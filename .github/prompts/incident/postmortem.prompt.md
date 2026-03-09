# Post-Incident Review (Postmortem)

> **Category:** Incident
> **File:** `incident/postmortem.prompt.md`

---

## Purpose

Conduct a blameless post-incident review to understand what happened, why, and how to prevent recurrence. Produce actionable improvement items.

## When to Use

- After any SEV-1 or SEV-2 incident
- After repeated SEV-3 incidents
- When requested by Incident Commander
- Within 48 hours of incident resolution

## Inputs Required

- Incident timeline
- Root cause analysis
- Monitoring data during incident
- Communication log
- Resolution steps taken

## Outputs Required

```markdown
# Post-Incident Review: [INC-XXXX]

**Date of Incident:** YYYY-MM-DD
**Duration:** X hours Y minutes
**Severity:** SEV-X
**Author:** [name]
**Reviewed:** YYYY-MM-DD

## Executive Summary

[2-3 sentence summary for stakeholders]

## Impact

- Users affected: [count/percentage]
- Revenue impact: [estimated]
- Duration: [time]
- SLO budget consumed: [percentage]

## Timeline

| Time | Event | Actor |
| ---- | ----- | ----- |
| ...  | ...   | ...   |

## Root Cause

[Detailed technical root cause]

## Contributing Factors

1. [Factor that enabled or worsened the incident]
2. [Factor that delayed detection or resolution]

## What Went Well

1. [Positive aspect of response]
2. [Positive aspect of detection]

## What Could Be Improved

1. [Improvement opportunity]
2. [Improvement opportunity]

## Action Items

| #   | Action            | Owner    | Priority | Due Date | Status |
| --- | ----------------- | -------- | -------- | -------- | ------ |
| 1   | [Concrete action] | [person] | P1       | [date]   | Open   |
| 2   | [Concrete action] | [person] | P2       | [date]   | Open   |

## Lessons Learned

1. [Key takeaway]
2. [Key takeaway]

## Prevention

[How we will prevent this class of incident]
```

## Quality Expectations

- BLAMELESS — Focus on systems, not individuals
- Actionable — Every finding has an action item
- Concrete — Specific actions, not vague "improve monitoring"
- Timely — Completed within 48 hours
- Shared — Published for organizational learning

## Failure Cases

- Blame attribution → Redirect to systemic causes
- No action items → Every finding needs at least one action
- Stale action items → Track completion with deadlines

## Evidence Expectations

- Complete incident timeline
- Monitoring data
- Root cause verification
- Action item tracking
