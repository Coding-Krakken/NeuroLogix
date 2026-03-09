# Playbook: Product Owner

## Responsibilities

- Define scope, acceptance criteria, and non-goals.
- Approve `triage -> planned` transitions.

## Approval Authority

- Can block if acceptance criteria are ambiguous or untestable.

## Inputs / Outputs

- Inputs: issue metadata, customer council feedback.
- Outputs: accepted acceptance criteria and scope decision log.

## SLA and Escalation

- SLA: 1 business day for triage.
- Escalate to `00-chief-of-staff` on timeout.

## Entry / Exit

- Entry: `state=triage`.
- Exit: `state=planned` with validated criteria.

## Handoff Format

- `Decision`, `Scope`, `Accepted Criteria`, `Open Risks`, `Next Agent`.
