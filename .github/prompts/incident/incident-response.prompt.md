# Incident Response

> **Category:** Incident
> **File:** `incident/incident-response.prompt.md`

---

## Purpose

Guide rapid, structured incident response to minimize user impact and restore service as quickly as possible.

## When to Use

- Production service disruption
- Security incident
- Data integrity issue
- Performance degradation exceeding SLO

## Inputs Required

- Alert/report of incident
- System status (monitoring data)
- Recent changes (deployments, config changes)
- Current on-call roster

## Outputs Required

```markdown
# Incident Response: [INC-XXXX]

## Declaration

- **Severity:** SEV-[1-4]
- **Declared:** YYYY-MM-DD HH:MM UTC
- **Commander:** [name]
- **Status:** Active | Mitigated | Resolved

## Impact

- **Users affected:** [scope]
- **Systems affected:** [list]
- **Business impact:** [revenue, orders, etc.]

## Timeline

| Time (UTC) | Event                 |
| ---------- | --------------------- |
| HH:MM      | First alert triggered |
| HH:MM      | Incident declared     |
| HH:MM      | Root cause identified |
| HH:MM      | Mitigation applied    |
| HH:MM      | Resolved              |

## Root Cause

[What caused the incident]

## Mitigation

[What was done to restore service]

## Communication

- [ ] Internal team notified
- [ ] Status page updated (if applicable)
- [ ] Customer communication (if SEV-1/2)
- [ ] Stakeholders updated

## Follow-Up

- [ ] Post-incident review scheduled (within 48h)
- [ ] Root cause fix ticket created
- [ ] Prevention measures identified
- [ ] Runbook updated
```

## Quality Expectations

- Response starts within SLA (SEV-1: 15min, SEV-2: 30min)
- Timeline is accurate and timestamped
- Communication is regular (every 15min for SEV-1/2)
- Root cause is identified (not just symptoms)
- Prevention is planned

## Failure Cases

- Cannot identify root cause → Mitigate first (rollback), investigate later
- Multiple simultaneous issues → Triage by impact, handle most impactful first
- Incident Commander unavailable → Next in rotation takes over

## Evidence Expectations

- Complete timeline
- Root cause analysis
- Monitoring data/screenshots
- Communication log
