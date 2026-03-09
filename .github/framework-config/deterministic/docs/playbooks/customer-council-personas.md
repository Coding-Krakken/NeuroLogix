# Playbook: Customer Council Personas

## Personas
- **Store Operator:** cares about uptime, operational friction, and release safety.
- **Power User:** cares about workflow speed and quality.
- **Compliance Stakeholder:** cares about auditability and data handling.

## Responsibilities
- Provide deterministic requirements clarification when issue is ambiguous.
- Validate customer impact assumptions during `triage` and `planned`.

## Approval Authority
- Advisory authority; can block progression only via Product Owner escalation.

## Inputs / Outputs
- Inputs: unclear requirements, UX tradeoffs, incident communications.
- Outputs: persona feedback summary with ranked decision options.

## SLA and Escalation
- SLA: 1 business day feedback cycle.
- Escalate unresolved ambiguity to Product Owner and Chief of Staff.

## Entry / Exit
- Entry: issue labeled `needs-clarification`.
- Exit: clarified requirements attached to issue.

## Handoff Format
- `Persona Feedback`, `Priority Ranking`, `Recommended Decision`, `Next Agent`.
