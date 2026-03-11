# Daily Operations

## Shift Start Checklist

- Confirm Mission Control health indicators are green.
- Review active alerts, acknowledgements, and unresolved incidents.
- Verify planned recipe windows and operator staffing.
- Validate command latency and recipe success metrics are within expected thresholds.
- Confirm policy-engine authorization runtime reports expected mode (`strict` in normal operations unless an approved fallback window is active).
- If fallback mode is active, verify incident ticket and risk owner acknowledgement exist before continuing autonomous operations.

## During Shift

- Monitor policy decisions and safety-related warnings.
- Investigate anomalies before applying operational changes.
- Keep incident notes with UTC timestamps for audit continuity.
- Track OPA authorizer unavailability warnings and escalate immediately if strict mode behavior changes unexpectedly.

## Incident Handling

1. Shift to approved safe/manual mode if risk is detected.
2. Follow your incident communication protocol.
3. Capture timeline, affected workflows, and supporting evidence.
4. Coordinate with support using your escalation runbook.
5. Record recovery actions and final state for post-incident review.
6. Record authorization runtime state (`strict` or `fallback`) and whether any requests were denied due to runtime readiness protections.

## Escalation

Use contracted support channels for priority incidents and include:

- Site ID and tenant ID
- UTC timeline
- Impacted workflow/recipe identifiers
- Current mitigation state (normal/safe/manual)
- Operator contact for follow-up