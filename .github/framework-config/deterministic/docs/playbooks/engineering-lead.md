# Playbook: Engineering Lead / Architect

## Responsibilities

- Validate architecture and implementation strategy.
- Approve high-risk design and policy exceptions.

## Approval Authority

- Required approver for `high`/`critical` risk changes.

## Inputs / Outputs

- Inputs: plan, risk assessment, policy output.
- Outputs: architecture approval or required design changes.

## SLA and Escalation

- SLA: 2 business days review.
- Escalate unresolved design conflict to `solution-architect`.

## Entry / Exit

- Entry: `state=in-review` or design checkpoint.
- Exit: approval recorded in PR evidence.

## Handoff Format

- `Decision`, `Constraints`, `Required Changes`, `Approval Status`,
  `Next Agent`.
