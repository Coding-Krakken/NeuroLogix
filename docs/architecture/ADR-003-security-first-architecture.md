# ADR-003: Security-First Architecture

## Status

Accepted

## Context

NeuroLogix controls physical industrial equipment — conveyors, robotic arms,
sortation systems, and safety interlocks. A security breach does not merely leak
data; it can cause physical harm to personnel, equipment damage, and production
outages with significant financial and regulatory consequences.

The system must comply with:

- **IEC 62443** — Industrial automation and control systems security
- **ISO 27001** — Information security management systems
- **NIST Cybersecurity Framework** — Risk management for critical infrastructure

At the same time, the system integrates cloud AI services, edge PLC adapters,
mobile operator devices, and third-party WMS/WCS systems — a broad and
heterogeneous attack surface.

## Decision

**Zero-trust networking:** No service trusts any other service by default. Every
request between services must be authenticated and authorised regardless of
network origin.

**Mutual TLS (mTLS):** All inter-service communication uses mTLS with
certificate-based identity. No plaintext inter-service channels permitted above
the development environment.

**RBAC + ABAC via OPA:** Role-Based Access Control (RBAC) layered with
Attribute-Based Access Control (ABAC). All policy decisions evaluated by the
OPA policy engine (see ADR-008). Policy results are logged immutably.

**Safety zone isolation:** The system is segmented into four trust zones aligned
with IEC 62443 Security Levels:

| Zone | Services | Security Level |
|---|---|---|
| SL-1 Edge | PLC adapters, MQTT brokers | SL-1 |
| SL-2 Core | Capability registry, policy engine, recipe executor | SL-2 |
| SL-3 AI | ASR/NLU, computer vision, optimiser services | SL-2 |
| SL-4 UI | Mission Control UI, operator interfaces | SL-2 |

AI services in SL-3 cannot directly issue commands to PLC outputs. All actuator
commands must flow through the recipe executor in SL-2, which enforces validated
safety checks and PLC interlocks.

**Immutable audit logging:** Every control action, recipe execution, policy
decision, and authentication event is written to an append-only audit log.
Tampering detection via hash-chaining is required before Phase 7 closure.

**Supply chain security:**
- SBOM (Software Bill of Materials) generated per build via CycloneDX.
- Container images signed with cosign; only signed images deployed to production.
- Dependabot monitors dependencies for known CVEs.
- `gitleaks` scans for secrets in CI.

**Secrets management:** No secrets in code or repository. All credentials
managed via Kubernetes Secrets (development: `.env.local` gitignored).

## Rationale

IEC 62443 mandates defence-in-depth for industrial control systems. The
safety zone isolation model directly maps to the standard's Security Level
classification. Zero-trust is the only architecture compatible with the
system's threat model, which includes supply chain compromises, lateral
movement from the IT network, and insider threats.

The AI constraint (AI cannot directly actuate PLCs) is a hard safety requirement
derived from functional safety analysis: AI models can produce erroneous outputs,
and hardware interlocks must remain under deterministic recipe-executor control
at all times.

## Consequences

**Benefits:**
- Containment of breaches — compromise of an edge adapter cannot propagate to
  recipe execution or AI services without crossing a validated trust boundary.
- Compliance with IEC 62443 and ISO 27001 as a design property, not a retrofit.
- Immutable audit trail satisfies regulatory and insurance requirements.

**Trade-offs and risks:**
- mTLS certificate management adds operational complexity; certificate rotation
  must be automated before production deployment.
- Zero-trust imposes latency overhead per inter-service call; acceptable given
  the control loop p95 <50ms SLO when combined with connection pooling and
  caching of policy decisions.
- Full SBOM generation adds approximately 30 seconds to CI build time.

**Ongoing requirements:**
- Security model must be updated before each delivery phase.
- Penetration test required before Phase 7 closure.
- All new service integrations require a security review documenting trust zone
  membership.

## Alternatives Considered

| Alternative | Reason rejected |
|---|---|
| Perimeter-based network security only | Insufficient for IEC 62443 SL-2+; does not address insider threat or lateral movement |
| TLS one-way (server-only certs) | Does not satisfy mutual authentication requirement; rejected by IEC 62443 |
| Custom RBAC implementation | OPA/Rego provides battle-tested, auditable, independently testable policy; custom implementation increases error surface |
| Cloud-managed secrets (AWS Secrets Manager only) | Multi-cloud strategy and on-premises edge deployment require a vendor-neutral secrets interface |

## References

- [IEC 62443 Industrial Cybersecurity Standard](https://www.isa.org/standards-and-publications/isa-standards/isa-standards-committees/isa62443/)
- [ISO 27001:2022](https://www.iso.org/standard/27001)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [ADR-008: Policy Engine with OPA](./ADR-008-policy-engine-opa.md)
- [NeuroLogix Security Internal Documentation](./../../../.developer/SECURITY_INTERNAL.md)
