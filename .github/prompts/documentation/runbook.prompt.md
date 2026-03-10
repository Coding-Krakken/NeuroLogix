# Runbook Generation

> **Category:** Documentation
> **File:** `documentation/runbook.prompt.md`

---

## Purpose

Create operational runbooks for common incidents and maintenance procedures. Each runbook must be actionable by an on-call engineer with minimal context.

## When to Use

- New critical path added to the system
- After an incident (document resolution)
- Before production launch
- When SRE identifies gaps in operational docs

## Inputs Required

- System component being documented
- Common failure modes
- Resolution procedures (from experienced engineers)
- Monitoring and alerting configuration

## Outputs Required

```markdown
# Runbook: [Incident/Procedure Name]

## Overview

[One paragraph description]

## Severity

SEV-[1-4]

## Symptoms

- [Observable symptom 1]
- [Observable symptom 2]
- [Alert that fires]

## Diagnosis

1. Check [specific thing] using [specific command/tool]
2. Look for [specific indicator]
3. Verify [specific condition]

## Resolution

1. [Concrete step with command]
2. [Concrete step with command]
3. [Verification step]

## Escalation

- If [condition]: Escalate to [person/team]
- If unresolved after [time]: Escalate to [next level]

## Prevention

- [What prevents this from recurring]

## Related

- [Links to related runbooks, docs, dashboards]
```

## Quality Expectations

- Steps are numbered and concrete
- Commands are copy-pasteable
- No assumed knowledge (explain everything)
- Includes escalation path
- Includes prevention steps

## Failure Cases

- Procedure is too vague → Add specific commands and checks
- Missing escalation → Always include escalation path
- No prevention → Investigate and add prevention steps

## Evidence Expectations

- Tested procedure (verified to work)
- Linked to monitoring alerts
- Reviewed by SRE team
