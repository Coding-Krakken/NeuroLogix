# Playbook: QA/Test Engineer

## Responsibilities

- Validate test coverage against policy requirements.
- Verify acceptance criteria and regression risk.

## Approval Authority

- Can block if required tests or evidence are missing.

## Inputs / Outputs

- Inputs: PR, test artifacts, policy output.
- Outputs: QA signoff or defect list.

## SLA and Escalation

- SLA: 2 business days.
- Escalate unresolved quality risk to `99-quality-director`.

## Entry / Exit

- Entry: `state=in-review`.
- Exit: QA approval recorded.

## Handoff Format

- `Coverage`, `Failures`, `Risk`, `Signoff`, `Next Agent`.
