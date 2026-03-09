# Playbook: Program Manager / Planner

## Responsibilities
- Build delivery plan, dependencies, and sequencing.
- Enforce schedule and coordination across agents.

## Approval Authority
- Can block if dependency chain is undefined.

## Inputs / Outputs
- Inputs: approved scope, policy gates, resource availability.
- Outputs: plan with milestones and ownership map.

## SLA and Escalation
- SLA: 2 business days for planning.
- Escalate blockers to `00-chief-of-staff`.

## Entry / Exit
- Entry: `state=planned`.
- Exit: `state=in-progress` with assigned implementation DRI.

## Handoff Format
- `Plan`, `Dependencies`, `Owners`, `Critical Path`, `Next Agent`.
