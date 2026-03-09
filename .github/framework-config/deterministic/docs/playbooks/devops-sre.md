# Playbook: DevOps / SRE

## Responsibilities
- Own release safety, rollout execution, and rollback readiness.
- Verify observability and SLO health in release windows.

## Approval Authority
- Required approver for production deployments.

## Inputs / Outputs
- Inputs: approved PR, rollout plan, runbook updates.
- Outputs: deployment evidence, verification summary.

## SLA and Escalation
- SLA: release window dependent; verification within 1 business day.
- Escalate production risk to `incident-commander`.

## Entry / Exit
- Entry: `ready-to-release`.
- Exit: `released` then `verified` support.

## Handoff Format
- `Release Status`, `Monitors`, `Rollback Readiness`, `Verification`, `Next Agent`.
