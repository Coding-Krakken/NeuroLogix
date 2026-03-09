# Deterministic Pull Request

## Linked Issues

Closes #

## Work Item Metadata

- Work Item Type:
- Severity: S
- Priority: P
- Risk:
- Blast Radius:
- Component Area:
- Deployment Surface:
- Rollout Method:
- Data Sensitivity:

## Core-3 Governance Mapping

- Orchestrator Owner:
- Implementer Owner:
- Assurance Owner:
- Specialist Escalations Used (if any):
- Independent Assurance for high/critical confirmed: yes/no

## Changes Summary

-

## Risk Assessment

- Risks:
- Scope:
- Safeguards:

## Testing Evidence

- Unit:
- Integration:
- E2E:
- Performance:
- Security Scan:

## Observability Impact

- Metrics:
- Logs:
- Alerts/Dashboards:

## Security & Privacy Checklist

- [ ] No hardcoded secrets
- [ ] No PII logging changes without approval
- [ ] Threat impact reviewed
- [ ] Privacy/compliance impact reviewed

## Backward Compatibility & Migrations

- Breaking change: yes/no
- Migration needed: yes/no
- Migration/compat notes:

## Rollout and Rollback Plan

- Rollout stages:
- Monitoring during rollout:
- Rollback trigger:
- Rollback command/process:

## Documentation and Release

- [ ] ADR/RFC updated (if required by policy)
- [ ] Runbook updated (if required by policy)
- [ ] Release notes prepared
- [ ] Changelog updated
- Version bump rule applied: yes/no

## Acceptance Criteria Validation

- [ ] All issue acceptance criteria are satisfied
- [ ] All required approvers signed off
- [ ] All required policy checks passed
- [ ] Post-release verification plan defined
- [ ] Core-3 role ownership and handoff evidence attached in PR comments

- [ ] No new dependencies
- [ ] New dependencies added (security scanned)

**PII/Sensitive Data:**

- [ ] No PII handling changes
- [ ] PII handling documented

## Rollout Plan / Release Notes

**Gradual Rollout:**

- [ ] Not applicable (non-customer-facing)
- [ ] Deploy at once (low risk)
- [ ] Gradual rollout (10% → 25% → 50% → 100%)

**Feature Flags:**

**Rollback Plan:**

**Release Notes (Customer-Facing):**

```markdown
### [Type: Feature/Fix/Enhancement]

**Title:**

**Description:**

**Impact:**

**Action Required:**
```

## Pre-Merge Checklist

### Code Quality

- [ ] Linting passes (`npm run lint` or equivalent)
- [ ] Type checking passes (`npm run typecheck` or equivalent)
- [ ] All tests pass (`npm test` or equivalent)
- [ ] Test coverage ≥80%
- [ ] No hardcoded secrets
- [ ] No TODO/FIXME comments (or tracked in issues)

### Documentation

- [ ] README updated (if applicable)
- [ ] API documentation updated (if applicable)
- [ ] Inline code comments for complex logic
- [ ] Architecture diagrams updated (if applicable)
- [ ] `.customer/` documentation updated (if customer-facing)
- [ ] `.github/.developer/` documentation updated

### Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated (if critical user journey)
- [ ] Test plan executed and verified

### Security

- [ ] Security scanning passed (Snyk/SonarQube)
- [ ] Dependency audit passed (Dependabot)
- [ ] Secrets scan passed (gitleaks)
- [ ] No PII in logs
- [ ] OWASP Top 10 considerations addressed

### Accessibility (if UI changes)

- [ ] Keyboard navigation tested
- [ ] Screen reader tested
- [ ] Color contrast validated (WCAG AA)
- [ ] Focus indicators visible

### Performance

- [ ] Performance budget met
- [ ] Lighthouse score >90 (if frontend changes)
- [ ] No unnecessary rerenders (React)
- [ ] Images optimized
- [ ] Bundle size checked

### Git/GitHub

- [ ] All commits follow conventional commit format
- [ ] Branch follows naming convention (`feature/issue#-description`)
- [ ] All changes committed and pushed
- [ ] No merge conflicts

## Reviewer Notes

**Areas of Focus:**

**Questions for Reviewers:**

**Specific Concerns:**

---

## Handoff History

<!-- Agents should append handoffs here during implementation -->

<details>
<summary>Agent Handoffs (Click to expand)</summary>

### [Agent Name] → [Next Agent] — [Timestamp]

**Status:** Done/Partial/Blocked

**Scope Completed:**

- **Key Decisions:**

- **Next Actions:**

- [ ]

**Risks/Follow-ups:**

- **Links:**

- Commit:
- CI Run:

---

</details>
