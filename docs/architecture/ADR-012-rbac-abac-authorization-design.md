# ADR-012: RBAC/ABAC Authorization Design

## Status

Accepted

## Context

NeuroLogix must enforce granular access control across all control actions,
recipe executions, configuration changes, and observability access. The system
must comply with IEC 62443 FR-2 (Use Control) and ISO 27001 A.9 (Access
Control). Multiple actor types exist — human operators, supervisors,
administrators, auditors, and AI agents — each with different authority
boundaries over safety-critical operations.

A flat role model (e.g., owner/viewer) is insufficient: the same role may be
permitted different actions depending on the target zone, the risk classification
of the command, and the site context. This requires Attribute-Based Access
Control (ABAC) layered on top of Role-Based Access Control (RBAC).

The policy engine (OPA/Rego — see ADR-008) is already deployed as the central
authorisation decision point. This ADR defines the data model (roles, attributes,
policies) that the policy engine enforces.

## Decision

### Role Taxonomy

| Role | Description | Scope |
|---|---|---|
| `operator` | Line operator — executes approved recipes, acknowledges alarms | Site-scoped |
| `supervisor` | Line supervisor — can approve/reject escalated commands, manage recipe library | Site-scoped |
| `admin` | Site administrator — manages users, policies, site configuration | Site-scoped |
| `auditor` | Read-only audit access — can read all logs, recipes, and policy results; no control actions | Global |
| `ai_agent` | Autonomous AI inference agent — can request recipe execution through the recipe-executor only; cannot directly modify policies or configuration | Zone-scoped (AI zone) |
| `system` | Internal service identity — used for service-to-service calls via mTLS certificate identity | Zone-scoped |

**No role inherits another role automatically.** Supervisors do not implicitly
hold operator permissions. Role combinations may be explicitly granted to a user
at the IAM layer.

### Attribute Model (ABAC)

ABAC attributes extend role permissions with context:

| Attribute | Type | Description |
|---|---|---|
| `zone` | enum (edge, core, ai, ui) | The trust zone the request originates from |
| `site_id` | string | The facility site identifier |
| `command_risk_level` | enum (low, medium, high, critical) | Risk classification of the command type |
| `confirmation_accepted` | boolean | Whether the operator explicitly confirmed the action |
| `approvedByRole` | string (optional) | Role of the approving supervisor for escalated actions |
| `recipe_validated` | boolean | Whether the recipe has passed validation in the recipe-executor |
| `safety_interlock_active` | boolean | Whether the target equipment has an active safety interlock |

### Authorization Policy Rules

#### Rule 1: Base RBAC check

The calling identity must hold one of the roles permitted for the requested
operation. Role-to-operation mapping is defined in OPA data files
(`packages/security-core/src/policies/role_permissions.rego`).

#### Rule 2: Zone Boundary Enforcement

| From Zone | To Zone | Permitted? |
|---|---|---|
| ai | core (recipe-executor commands) | Allowed (via inference request only, no direct PLC write) |
| ai | edge (direct PLC write) | **DENIED — absolute prohibition** |
| ui | core | Allowed (API gateway mediated) |
| ui | edge | **DENIED** |
| edge | core | Allowed (sensor events inbound) |
| core | edge | Allowed (actuator commands via recipe-executor only) |

#### Rule 3: Safety Interlock Guard

If `safety_interlock_active = true` on the target equipment, **no command is
permitted** regardless of role. The only permitted action is acknowledge-alarm
by `operator` or `supervisor`. This guard is evaluated **before** any RBAC
check (fail-closed design).

```rego
# packages/security-core/src/policies/safety_guard.rego
default allow = false

deny[reason] {
    input.safety_interlock_active == true
    input.command_type != "acknowledge_alarm"
    reason := "safety interlock active: only acknowledge_alarm permitted"
}
```

#### Rule 4: Command Risk Escalation

| `command_risk_level` | Required Role | Additional Requirements |
|---|---|---|
| `low` | `operator` | `confirmation_accepted = true` |
| `medium` | `operator` | `confirmation_accepted = true`, or `supervisor` without confirmation |
| `high` | `supervisor` | `confirmation_accepted = true`, `approvedByRole = "supervisor"` |
| `critical` | `admin` | `confirmation_accepted = true`, `approvedByRole = "admin"`, and `recipe_validated = true` |

#### Rule 5: AI Agent Constraint

`ai_agent` role:
- MAY call `POST /api/dispatch` with a recipe inference request.
- MUST have `recipe_validated = true` (recipe-executor validates before execution).
- MUST NOT have `command_risk_level = "critical"`.
- MUST hold a valid mTLS certificate identity from the AI zone (see ADR-011).
- Audit log entry is mandatory for every AI-agent-sourced dispatch.

#### Rule 6: Auditor Read-Only

`auditor` role may call any GET endpoint without restriction. Any attempt by
an `auditor` identity to call a mutating endpoint (POST, PUT, PATCH, DELETE)
is denied with HTTP 403 and logged.

### OPA Integration

All authorization decisions are delegated to OPA:

```typescript
// packages/security-core/src/authorizer.ts
import { OPAClient } from './opa-client';

export async function authorize(input: AuthzInput): Promise<AuthzResult> {
  const result = await OPAClient.query('data.neurologix.authz.allow', input);
  if (!result.allow) {
    auditLog.write({
      event: 'AUTHZ_DENIED',
      input,
      reason: result.reason ?? 'policy_deny',
    });
    throw new AuthzError(result.reason);
  }
  auditLog.write({ event: 'AUTHZ_ALLOWED', input });
  return result;
}
```

OPA policy bundle is compiled from `packages/security-core/src/policies/`
and loaded at service startup. Policy hot-reload is supported via OPA bundle
API for runtime policy updates without service restart.

### Policy Bundle Structure

```
packages/security-core/src/policies/
├── safety_guard.rego          # Rule 3: safety interlock guard (highest priority)
├── zone_boundary.rego         # Rule 2: zone boundary enforcement
├── role_permissions.rego      # Rule 1: base RBAC operation mapping
├── command_risk.rego          # Rule 4: command risk escalation
├── ai_agent.rego              # Rule 5: AI agent constraint
├── auditor.rego               # Rule 6: auditor read-only
├── data/
│   ├── roles.json             # Role → permitted operations mapping
│   └── command_risk_levels.json # Command type → risk level mapping
└── tests/
    └── authz_test.rego        # OPA unit tests for all rules
```

### Forbidden Patterns

The following patterns are explicitly prohibited:

1. **Wildcard allow**: No policy may use `default allow = true`.
2. **Role bypass**: No endpoint may short-circuit OPA evaluation (e.g., an
   internal header claiming elevated privilege).
3. **Silent deny**: Every deny must produce an audit log entry with the deny
   reason.
4. **Direct AI actuation**: No code path may route an AI-agent request directly
   to an edge adapter without passing through the recipe-executor safety check.
5. **Shared credentials**: No two services may share the same mTLS identity.
   Each service has its own certificate (enforced by cert-manager per-workload
   certificate issuance).

### Identity Source of Truth

- **Human users**: External IdP (e.g., Azure AD, Okta) via OIDC. JWT claims
  carry role assignments. OPA validates JWT and extracts `role` and `site_id`
  claims.
- **Service identities**: mTLS certificate CN (Common Name) maps to the service
  name. OPA validates CN against the known service registry.
- **AI agents**: mTLS certificate CN = `ai-agent.neurologix-ai.svc.cluster.local`.
  Role `ai_agent` is bound to this identity string in `data/roles.json`.

### Audit Logging Requirements

Every authorization decision (allow AND deny) must be logged with:

| Field | Description |
|---|---|
| `timestamp` | ISO-8601 UTC |
| `event` | `AUTHZ_ALLOWED` or `AUTHZ_DENIED` |
| `caller_identity` | mTLS CN or JWT subject |
| `caller_role` | Resolved role(s) |
| `resource` | Target endpoint or resource |
| `command_type` | If applicable |
| `site_id` | Site context |
| `decision_reason` | Policy rule name that produced the result |
| `trace_id` | OpenTelemetry trace ID for correlation |

Logs are written to the append-only audit log (ELK pipeline). Tampering
detection via hash-chaining is required before Phase 7 closure (see ADR-003).

## Rationale

Layering ABAC over RBAC with OPA gives the system a single authoritative
policy evaluation point that can be updated without service restarts. The
safety interlock guard as a pre-RBAC check ensures the safety constraint
(INV-001) is enforced even if an RBAC misconfiguration exists.

Binding AI agent identity to a specific mTLS CN and limiting it to
`command_risk_level != "critical"` provides a hard constraint preventing
runaway AI actuation — a key IEC 62443 and functional safety requirement.

The fail-closed design (default allow = false) ensures that any policy gap
results in a deny-with-log rather than an inadvertent allow.

## Consequences

### Benefits

- Single policy evaluation point (OPA) — easier to audit and reason about.
- ABAC attributes make context-sensitive access control explicit and testable.
- AI agent constraints are enforced at the auth layer, not just the application.
- Full audit log for every decision satisfies IEC 62443 FR-2 and ISO 27001 A.9.

### Risks and Mitigations

| Risk | Mitigation |
|---|---|
| OPA unavailability blocks all requests | OPA sidecar deployed per-service; fallback to deny-all if OPA unreachable |
| Policy bundle compilation errors | OPA unit tests in CI (`authz_test.rego`) gate every bundle change |
| JWT role claim spoofing | JWT signature validated by OPA; signing key rotated per IdP policy |
| Privilege escalation via approvedByRole field | `approvedByRole` validated against caller's actual role in OPA, not self-asserted |

## Implementation Checklist (Phase 7)

- [x] Implement `safety_guard.rego` with unit tests
- [x] Implement `zone_boundary.rego` with unit tests
- [x] Implement `role_permissions.rego` with `data/roles.json`
- [x] Implement `command_risk.rego` with `data/command_risk_levels.json`
- [x] Implement `ai_agent.rego` with unit tests
- [x] Implement `auditor.rego` read-only enforcement policy
- [ ] Wire `authorizer.ts` into policy-engine service
- [ ] Validate OPA decision log routing to ELK audit pipeline
- [x] Add CI gate: `opa test packages/security-core/src/policies/`
- [ ] Penetration test: verify AI agent cannot issue `critical` commands

## References

- [ADR-003: Security-First Architecture](./ADR-003-security-first-architecture.md)
- [ADR-008: Policy Engine with OPA](./ADR-008-policy-engine-opa.md)
- [ADR-011: mTLS and Zero-Trust Service Mesh](./ADR-011-mtls-zero-trust-service-mesh.md)
- [IEC 62443-3-3 FR-2: Use Control](https://www.isa.org/standards-and-publications/isa-standards/isa-standards-committees/isa62443/)
- [ISO 27001 A.9: Access Control](https://www.iso.org/standard/27001)
- [OPA Documentation](https://www.openpolicyagent.org/docs/)
