# ADR-008: Policy Engine with OPA

## Status

Accepted

## Context

NeuroLogix requires a policy decision layer that is:

1. **Auditable** — every access control decision must be logged with its
   inputs, matched rule, and result for IEC 62443 compliance.
2. **Testable in isolation** — policies must be unit-testable without running
   the full service stack.
3. **Zone-aware** — different security zones (Edge, Core, AI, UI) have
   different trust levels and permitted operations.
4. **Decoupled from business logic** — access control rules must not be
   embedded in service code where they cannot be reviewed in isolation or
   updated without code deployment.
5. **Declarative and reviewable** — security teams must be able to read and
   audit policies without deep application knowledge.

Custom RBAC implementations and middleware-based checks were evaluated but
rejected as insufficient for these requirements.

## Decision

**Policy engine:** [Open Policy Agent (OPA)](https://www.openpolicyagent.org/)
with [Rego](https://www.openpolicyagent.org/docs/latest/policy-language/)
policy language.

**Integration pattern:** OPA runs as a sidecar or shared service in each
security zone. Services send authorisation queries to OPA via HTTP or the
Go/Node.js SDK. OPA evaluates the query against the active policy bundle and
returns an `allow`/`deny` decision plus contextual reason.

**Policy bundle structure:**
```
services/policy-engine/
├── policies/
│   ├── rbac/          # Role-based access control rules
│   ├── abac/          # Attribute-based access control rules
│   ├── safety/        # Safety zone boundary rules
│   └── recipes/       # Recipe authorisation rules
└── data/
    ├── roles.json     # Role-permission mapping
    └── zones.json     # Zone trust configuration
```

**RBAC model:** Operator roles defined hierarchically:
`GUEST < OPERATOR < SUPERVISOR < ENGINEER < ADMIN < SYSTEM`. Each role
inherits the permissions of all roles below it.

**ABAC extensions:** Attribute evaluation on:
- `resource.site_id` — zone-bounded operations limited to the operator's
  assigned site
- `resource.safety_critical` — safety-critical actuations require SUPERVISOR
  or above, regardless of RBAC role
- `context.shift_status` — certain operations restricted to active shift
  windows

**Safety zone enforcement (non-negotiable policy):**

```rego
# AI services cannot directly issue commands to PLC outputs.
deny["ai_cannot_actuate_plc"] {
  input.subject.zone == "ai"
  input.resource.type == "plc_command"
}
```

This rule is enforced at the policy layer and must never be removed or
weakened.

**All policy decisions are logged** via the OPA decision log to the audit
stream with `trace_id`, `subject`, `resource`, `action`, `decision`, and
`matched_rule`.

**Policy testing:** Every policy file has a corresponding `_test.rego` file.
All policy tests run in CI before deployment. Policy test coverage must reach
100% for safety-critical rules.

## Rationale

OPA was selected because:

1. Rego policies are human-readable and reviewable by security teams without
   application context.
2. OPA's decoupled evaluation model means policy rules can be updated and
   deployed independently of service code — no redeployments for policy
   changes.
3. OPA has a first-class testing framework (`opa test`) that enables unit
   testing of policy rules in isolation.
4. OPA decision logs are designed as audit artefacts; structured output is
   compatible with the ELK audit pipeline.
5. OPA is a CNCF project with wide Kubernetes adoption; integrates natively
   with the Kubernetes admission controller model for infrastructure policy.

An embedded middleware approach (e.g. `casl` in Node.js) was rejected because
it cannot be tested in isolation, policies cannot be deployed independently,
and audit log generation requires explicit custom code in every service.

## Consequences

**Benefits:**
- Policy drift across services is eliminated — a single policy bundle governs
  all zones.
- Security team can audit and modify access control rules without code changes.
- OPA unit tests provide confidence that safety-critical rules are correct
  before deployment.
- Decoupled policy evaluation reduces authorisation latency to <10ms p95 with
  bundle caching.

**Trade-offs and risks:**
- Rego has a learning curve; onboarding documentation required for engineers
  new to datalog-style policy languages.
- OPA is a separate service dependency requiring high availability; OPA
  unavailability must fail-secure (deny-by-default) to prevent safety bypass.
- Policy bundle distribution to edge zones requires a secure distribution
  channel; lazy-loaded local bundles required for offline operation.

**Operational requirements:**
- OPA must be configured with `decision_logs.console = true` in production
  for ELK pipeline consumption.
- Policy bundles must be signed and validated before loading.
- OPA health check must be a K8s liveness probe for all services that depend
  on it.
- Fail-secure default: if OPA returns an error or is unreachable, the
  requesting service must deny the operation and log the failure.

## Alternatives Considered

| Alternative | Reason rejected |
|---|---|
| casl (Node.js library) | Embedded in service code; cannot be tested in isolation; no audit log standard |
| Casbin | Less expressive than Rego for complex attribute conditions; smaller community |
| SpiceDB / Zanzibar model | Excellent for relationship-based access but excessive complexity for this access pattern; Rego sufficient |
| Custom middleware RBAC | Audit logging, testing, and deployment decoupling all require custom implementation; high maintenance burden |

## References

- [Open Policy Agent Documentation](https://www.openpolicyagent.org/docs/)
- [Rego Policy Language Reference](https://www.openpolicyagent.org/docs/latest/policy-language/)
- [OPA Decision Logging](https://www.openpolicyagent.org/docs/latest/management-decision-logs/)
- [services/policy-engine source](../../services/policy-engine/)
- [ADR-003: Security-First Architecture](./ADR-003-security-first-architecture.md)
- [IEC 62443 Security Levels](https://www.isa.org/standards-and-publications/isa-standards/isa-standards-committees/isa62443/)
