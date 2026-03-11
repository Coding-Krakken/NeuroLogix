# IEC 62443 Control Mapping

## Purpose

This document maps IEC 62443-3-3 System Security Requirements (SSR) to the
NeuroLogix implementation status and provides evidence references for
compliance attestation. NeuroLogix targets **Security Level 2 (SL-2)** for
the Core, AI, and UI zones, and **Security Level 1 (SL-1)** for the Edge zone.

## Security Level Target

| Zone | Namespace | Target SL | Rationale |
|---|---|---|---|
| SL-1 Edge | `neurologix-edge` | SL-1 | PLC/sensor adapters; hardware interlocks provide primary safety |
| SL-2 Core | `neurologix-core` | SL-2 | Recipe execution, policy engine, capability registry — T1 critical |
| SL-3 AI | `neurologix-ai` | SL-2 | AI inference services; never actuates PLCs directly |
| SL-4 UI | `neurologix-ui` | SL-2 | Mission Control UI; operator-facing, multi-site |

---

## Foundational Requirements (FR) Mapping

### FR-1: Identification and Authentication Control (IAC)

> _Identify and authenticate all users, software processes, and devices before
> allowing them to access the IACS._

| Req ID | Requirement | SL-2 Condition | Status | Evidence |
|---|---|---|---|---|
| SR 1.1 | Human user identification and authentication | RBAC with IdP (OIDC + JWT) | ✅ Designed (Phase 7 impl.) | [ADR-012](./ADR-012-rbac-abac-authorization-design.md) |
| SR 1.2 | Software process and device identification | mTLS certificate identity per service | ✅ Designed (Phase 7 impl.) | [ADR-011](./ADR-011-mtls-zero-trust-service-mesh.md) |
| SR 1.3 | Account management | Roles defined in OPA data files (roles.json) | ✅ Designed | [ADR-012](./ADR-012-rbac-abac-authorization-design.md) |
| SR 1.4 | Identifier management | JWT subject + mTLS CN as identity tokens | ✅ Designed | [ADR-011](./ADR-011-mtls-zero-trust-service-mesh.md), [ADR-012](./ADR-012-rbac-abac-authorization-design.md) |
| SR 1.5 | Authenticator management | cert-manager automated rotation (30-day TTL) | ✅ Designed | [ADR-011](./ADR-011-mtls-zero-trust-service-mesh.md) |
| SR 1.6 | Wireless access management | N/A — no wireless control surfaces | N/A | — |
| SR 1.7 | Strength of password-based authentication | Delegated to IdP (Azure AD / Okta MFA policy) | ✅ Designed | [ADR-012](./ADR-012-rbac-abac-authorization-design.md) |

### FR-2: Use Control (UC)

> _Enforce the assigned privileges of authenticated identities._

| Req ID | Requirement | SL-2 Condition | Status | Evidence |
|---|---|---|---|---|
| SR 2.1 | Authorization enforcement | OPA RBAC/ABAC policy evaluation | ✅ Designed (Phase 7 impl.) | [ADR-012](./ADR-012-rbac-abac-authorization-design.md), [ADR-008](./ADR-008-policy-engine-opa.md) |
| SR 2.2 | Wireless use control | N/A | N/A | — |
| SR 2.3 | Use of portable and mobile devices | Operator mobile devices access UI zone only (SL-2) | ✅ Designed | [ADR-003](./ADR-003-security-first-architecture.md) |
| SR 2.4 | Mobile code | No mobile code execution in control path | ✅ Compliant | — |
| SR 2.5 | Session lock | IdP session timeout policy enforced at JWT TTL | ✅ Designed | [ADR-012](./ADR-012-rbac-abac-authorization-design.md) |
| SR 2.6 | Remote session termination | JWT revocation via IdP; OPA validates on each request | ✅ Designed | [ADR-012](./ADR-012-rbac-abac-authorization-design.md) |
| SR 2.7 | Concurrent session control | OPA policy may limit concurrent sessions per role (Phase 7) | 🔄 Planned | [ADR-012](./ADR-012-rbac-abac-authorization-design.md) |
| SR 2.8 | Auditable events | All authz decisions + control actions logged | ✅ Designed | [ADR-012](./ADR-012-rbac-abac-authorization-design.md), [ADR-004](./ADR-004-observability-strategy.md) |
| SR 2.9 | Audit storage capacity | ELK cluster with retention policy; Prometheus alert on storage | ✅ Implemented | `infrastructure/observability/prometheus-alerts.yml` |
| SR 2.10 | Response to audit processing failures | Prometheus alert `audit_log_write_failure_total > 0` | ✅ Implemented | `infrastructure/observability/prometheus-alerts.yml` |
| SR 2.11 | Timestamps | ISO-8601 UTC from OpenTelemetry trace context | ✅ Implemented | [ADR-004](./ADR-004-observability-strategy.md) |
| SR 2.12 | Non-repudiation | Append-only audit log with hash-chaining (Phase 7 impl.) | 🔄 Planned | [ADR-003](./ADR-003-security-first-architecture.md) |

### FR-3: System Integrity (SI)

> _Ensure the integrity of the IACS in order to prevent unauthorised manipulation._

| Req ID | Requirement | SL-2 Condition | Status | Evidence |
|---|---|---|---|---|
| SR 3.1 | Communication integrity | mTLS for all inter-service; TLS 1.3 at ingress | ✅ Designed | [ADR-011](./ADR-011-mtls-zero-trust-service-mesh.md) |
| SR 3.2 | Malicious code protection | Container image scanning (Trivy/Grype) in CI | ✅ Implemented | `.github/workflows/ci.yml` |
| SR 3.3 | Security functionality verification | OPA unit tests gate policy bundle in CI | ✅ Designed | [ADR-010](./ADR-010-contract-testing-strategy.md) |
| SR 3.4 | Software and information integrity | SBOM (CycloneDX) generated per build; signed images (cosign) | ✅ Implemented | `.github/workflows/release.yml` |
| SR 3.5 | Input validation | Zod schema validation on all API inputs | ✅ Implemented | `packages/schemas/` |
| SR 3.6 | Deterministic output | Recipe executor produces deterministic output from validated recipes | ✅ Implemented | `services/recipe-executor/` |
| SR 3.7 | Error handling | Typed error codes in all API responses; no raw stack traces | ✅ Implemented | `packages/schemas/src/common/errors.ts` |
| SR 3.8 | Session integrity | JWT + mTLS session; replay protection via nonce (Phase 7) | 🔄 Planned | [ADR-012](./ADR-012-rbac-abac-authorization-design.md) |
| SR 3.9 | Protection of audit information | Append-only ELK store; Prometheus alert on tampering | 🔄 Planned | [ADR-003](./ADR-003-security-first-architecture.md) |

### FR-4: Data Confidentiality (DC)

> _Ensure the confidentiality of information on communication channels and in data repositories._

| Req ID | Requirement | SL-2 Condition | Status | Evidence |
|---|---|---|---|---|
| SR 4.1 | Information confidentiality | mTLS encrypts all inter-service traffic; TLS 1.3 at ingress | ✅ Designed | [ADR-011](./ADR-011-mtls-zero-trust-service-mesh.md) |
| SR 4.2 | Information persistence | Kubernetes Secrets (encrypted at rest via etcd encryption); Vault for sensitive secrets | ✅ Designed | [ADR-003](./ADR-003-security-first-architecture.md) |
| SR 4.3 | Use of cryptography | TLS 1.3; AES-256-GCM for secrets at rest; RSA-2048 / EC P-256 for certificates | ✅ Designed | [ADR-011](./ADR-011-mtls-zero-trust-service-mesh.md) |

### FR-5: Restricted Data Flow (RDF)

> _Segment the IACS network using zones and conduits to limit the unnecessary flow of information._

| Req ID | Requirement | SL-2 Condition | Status | Evidence |
|---|---|---|---|---|
| SR 5.1 | Network segmentation | Kubernetes namespace isolation + NetworkPolicy per zone | ✅ Implemented (IaC baseline) | [ADR-003](./ADR-003-security-first-architecture.md), `infrastructure/security/network-policies/` |
| SR 5.2 | Zone boundary protection | Istio/Linkerd AuthorizationPolicy allowlists per zone pair | ✅ Designed | [ADR-011](./ADR-011-mtls-zero-trust-service-mesh.md) |
| SR 5.3 | Security function isolation | Safety-critical code in `service/recipe-executor`; AI services isolated in AI zone | ✅ Implemented | `services/recipe-executor/` |
| SR 5.4 | Control system backup | Helm chart state in Git (GitOps); Vault unseal keys backed up | 🔄 Planned | `infrastructure/` |

### FR-6: Timely Response to Events (TRE)

> _Respond to security violations by notifying the proper authority, reporting evidence, and taking timely corrective action._

| Req ID | Requirement | SL-2 Condition | Status | Evidence |
|---|---|---|---|---|
| SR 6.1 | Audit log accessibility | ELK Kibana dashboard for audit log search | ✅ Designed | [ADR-004](./ADR-004-observability-strategy.md) |
| SR 6.2 | Continuous monitoring | Prometheus + Grafana dashboards; PagerDuty alerts | ✅ Designed | `infrastructure/observability/prometheus-alerts.yml` |
| SR 6.3 | Response to identified incidents | Service incident triage runbooks (all 5 services) | ✅ Implemented | `docs/runbooks/` |

### FR-7: Resource Availability (RA)

> _Ensure the availability of the IACS against degradation or denial of service._

| Req ID | Requirement | SL-2 Condition | Status | Evidence |
|---|---|---|---|---|
| SR 7.1 | Denial of service protection | Rate limiting at API gateway; Kubernetes HPA | 🔄 Planned | — |
| SR 7.2 | Resource management | Kubernetes resource requests/limits per workload | 🔄 Planned | `infrastructure/` |
| SR 7.3 | Control system backup | Helm GitOps; stateless service design | 🔄 Planned | `infrastructure/` |
| SR 7.4 | Emergency power | Out of scope (physical facility responsibility) | N/A | — |
| SR 7.5 | Emergency communication | PagerDuty/OpsGenie alerting; runbooks | ✅ Designed | `docs/runbooks/` |
| SR 7.6 | Network and security configuration settings | All config in Git (IaC); Terraform for cloud infra | 🔄 Planned | `infrastructure/` |
| SR 7.7 | Least functionality | Minimal container images (distroless base); no unnecessary services | ✅ Designed | [ADR-003](./ADR-003-security-first-architecture.md) |
| SR 7.8 | Control system component inventory | SBOM per build (CycloneDX) | ✅ Implemented | `.github/workflows/release.yml` |

---

## Summary Dashboard

| FR | Compliant (✅) | Planned (🔄) | N/A | Total |
|---|---|---|---|---|
| FR-1 IAC | 6 | 0 | 1 | 7 |
| FR-2 UC | 9 | 2 | 1 | 12 |
| FR-3 SI | 7 | 2 | 0 | 9 |
| FR-4 DC | 3 | 0 | 0 | 3 |
| FR-5 RDF | 3 | 1 | 0 | 4 |
| FR-6 TRE | 3 | 0 | 0 | 3 |
| FR-7 RA | 2 | 4 | 2 | 8 |
| **Total** | **33** | **9** | **4** | **46** |

**Compliance rate (designed + implemented):** 33/42 = **79%** (planned items
are all Phase 7 implementation work items, not design gaps)

---

## Planned / Open Items (Phase 7)

| Item | FR | Priority |
|---|---|---|
| Implement mTLS + cert-manager + Vault PKI in staging | FR-1, FR-3, FR-4 | High |
| Wire OPA authorizer into all services | FR-2 | High |
| Implement append-only audit log with hash-chaining | FR-2, FR-3 | High |
| Concurrent session limits in OPA | FR-2 | Medium |
| Session replay protection (nonce) | FR-3 | Medium |
| Istio AuthorizationPolicy allowlists per zone pair | FR-5 | High |
| Kubernetes resource requests/limits | FR-7 | Medium |
| Helm GitOps IaC completion | FR-5, FR-7 | Medium |
| API gateway rate limiting | FR-7 | Medium |

---

## References

- [IEC 62443-3-3: System security requirements and security levels](https://www.isa.org/standards-and-publications/isa-standards/isa-standards-committees/isa62443/)
- [ADR-003: Security-First Architecture](../architecture/ADR-003-security-first-architecture.md)
- [ADR-011: mTLS and Zero-Trust Service Mesh](../architecture/ADR-011-mtls-zero-trust-service-mesh.md)
- [ADR-012: RBAC/ABAC Authorization Design](../architecture/ADR-012-rbac-abac-authorization-design.md)
- [ADR-008: Policy Engine with OPA](../architecture/ADR-008-policy-engine-opa.md)

---

_Last Updated: 2026-03-11 (Phase 7 baseline)_
