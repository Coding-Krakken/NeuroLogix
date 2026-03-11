# Security

## Reporting Security Concerns

Report security concerns through your contracted support and security contact channels.

Include:

- Environment, site ID, and tenant ID context
- Steps to reproduce and observed timeline (UTC)
- Impact and observed behavior
- Logs or evidence with credentials and secrets removed

## Evidence Handling Guidance

- Do not include plaintext secrets, tokens, or private keys in tickets.
- Share only minimum required evidence for triage.
- Preserve original timestamps to support forensic and audit workflows.
- Escalate immediately if there is potential safety impact.

## Security Posture Summary

NeuroLogix is built with safety-first controls, auditability, and industrial security alignment (including IEC 62443 direction) as core principles.

## Authorization Runtime Posture

- Policy decisions are evaluated through the policy-engine with OPA authorization controls.
- In `strict` runtime mode, OPA endpoint unavailability is treated as deny (fail closed).
- In `fallback` runtime mode, local policy evaluation is used only as an approved degraded path and must be incident-tracked.
- High-risk command paths remain safety-gated and require documented operator/auditor review.