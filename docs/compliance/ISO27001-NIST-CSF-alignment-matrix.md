# ISO 27001 and NIST CSF Baseline Alignment Matrix

## Purpose

This document provides a baseline crosswalk between NeuroLogix Phase 7 security
artifacts and:

- **ISO/IEC 27001:2022 Annex A** control families
- **NIST CSF 2.0** functions and categories

It is designed as an evidence index for audits and internal readiness reviews,
and complements the detailed control-level mapping in
[IEC 62443 Control Mapping](./IEC-62443-control-mapping.md).

## Scope and Method

- Scope is limited to controls with existing evidence in repository artifacts.
- Status terms align with current delivery state:
  - **Implemented**: baseline artifact exists and is wired in code/IaC/CI
  - **Designed**: architecture/control design documented, runtime completion
    pending
  - **Planned**: explicitly tracked in Phase 7/8 backlog
- This baseline does not replace a formal Statement of Applicability (SoA).

## Baseline Matrix

| Domain                   | ISO/IEC 27001:2022 (Annex A)                                             | NIST CSF 2.0 | NeuroLogix Baseline Control                                        | Status                            | Evidence                                                                                                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------ | ------------ | ------------------------------------------------------------------ | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Governance               | A.5.1 Policies for information security                                  | GV.PO        | Security-first governance and model-first policy set               | Implemented (baseline)            | [Copilot Instructions](../../.github/copilot-instructions.md), [.developer/TODO](../../.developer/TODO.md)                                                                                                                                      |
| Governance               | A.5.8 Information security in project management                         | GV.OV        | Security and compliance controls tracked per phase and issue       | Implemented (baseline)            | [.developer/TODO](../../.developer/TODO.md), [Compliance README](./README.md)                                                                                                                                                                   |
| Organization             | A.5.2 Information security roles and responsibilities                    | GV.RR        | RBAC/ABAC role model and authorization boundaries                  | Designed                          | [ADR-012](../architecture/ADR-012-rbac-abac-authorization-design.md)                                                                                                                                                                            |
| Identity and Access      | A.8.2 Privileged access rights                                           | PR.AA        | Least-privilege authorization enforced via OPA policy model        | Designed                          | [ADR-012](../architecture/ADR-012-rbac-abac-authorization-design.md), [ADR-008](../architecture/ADR-008-policy-engine-opa.md)                                                                                                                   |
| Identity and Access      | A.8.5 Secure authentication                                              | PR.AA        | Service identity through mTLS and certificate-based trust          | Designed                          | [ADR-011](../architecture/ADR-011-mtls-zero-trust-service-mesh.md), [mTLS mesh runbook](../runbooks/mtls-mesh-policy-validation.md)                                                                                                             |
| Network Security         | A.8.20 Network security                                                  | PR.PS        | Namespace segmentation + allowlist mesh policy baseline            | Implemented (IaC baseline)        | [IEC 62443 mapping FR-5](./IEC-62443-control-mapping.md), [Authorization policies baseline](../../infrastructure/security/authorization-policies/README.md), [NetworkPolicy baseline](../../infrastructure/security/network-policies/README.md) |
| Network Security         | A.8.21 Security of network services                                      | PR.PS        | Trust-zone boundary policy for inter-service communication         | Implemented (IaC baseline)        | [ADR-011](../architecture/ADR-011-mtls-zero-trust-service-mesh.md), [Authorization policies baseline](../../infrastructure/security/authorization-policies/README.md)                                                                           |
| Cryptography             | A.8.24 Use of cryptography                                               | PR.DS        | TLS 1.3 for ingress and mTLS in mesh design                        | Designed                          | [ADR-011](../architecture/ADR-011-mtls-zero-trust-service-mesh.md), [IEC 62443 mapping FR-4](./IEC-62443-control-mapping.md)                                                                                                                    |
| Logging and Monitoring   | A.8.15 Logging                                                           | DE.CM        | Structured audit and observability signals with alerting baselines | Implemented (baseline)            | [ADR-004](../architecture/ADR-004-observability-strategy.md), [Prometheus alerts](../../infrastructure/observability/prometheus-alerts.yml)                                                                                                     |
| Logging and Monitoring   | A.8.16 Monitoring activities                                             | DE.CM        | Continuous monitoring with Prometheus/Grafana + runbooks           | Designed / Implemented (baseline) | [Runbooks index](../runbooks/README.md), [Prometheus alerts](../../infrastructure/observability/prometheus-alerts.yml)                                                                                                                          |
| Logging and Monitoring   | A.8.17 Clock synchronization                                             | DE.CM        | UTC timestamping via OpenTelemetry trace propagation               | Implemented                       | [IEC 62443 mapping SR 2.11](./IEC-62443-control-mapping.md), [ADR-004](../architecture/ADR-004-observability-strategy.md)                                                                                                                       |
| System Integrity         | A.8.9 Configuration management                                           | PR.PS        | Infrastructure and security controls managed as code in repo       | Implemented (baseline)            | [NetworkPolicy baseline](../../infrastructure/security/network-policies/README.md), [Authorization policies baseline](../../infrastructure/security/authorization-policies/README.md)                                                           |
| Vulnerability Management | A.8.8 Management of technical vulnerabilities                            | ID.RA        | CI vulnerability scanning and dependency governance baselines      | Implemented                       | [CI workflow](../../.github/workflows/ci.yml), [Release workflow](../../.github/workflows/release.yml)                                                                                                                                          |
| Supply Chain Integrity   | A.8.7 Protection against malware / integrity tooling                     | PR.PS        | SBOM generation and image integrity controls in release path       | Implemented                       | [Release workflow](../../.github/workflows/release.yml)                                                                                                                                                                                         |
| Incident Response        | A.5.24 Information security incident management planning and preparation | RS.RP        | Incident triage and security control runbooks                      | Implemented (baseline)            | [Runbooks index](../runbooks/README.md), [mTLS mesh runbook](../runbooks/mtls-mesh-policy-validation.md)                                                                                                                                        |
| Incident Response        | A.5.26 Response to information security incidents                        | RS.AN        | Service-level incident procedures with evidence capture templates  | Implemented (baseline)            | [Runbooks index](../runbooks/README.md)                                                                                                                                                                                                         |
| Resilience               | A.5.30 ICT readiness for business continuity                             | RC.RP        | Safe-mode and rollback procedures for mission-critical controls    | Implemented (baseline)            | [Safe mode activation](../runbooks/safe-mode-activation.md), [Release rollback](../runbooks/release-rollback.md)                                                                                                                                |

## Coverage Snapshot (Baseline)

- Governance and policy evidence: **baseline present**
- Identity, access, and mTLS enforcement: **designed with partial runtime
  completion**
- Network segmentation and allowlist controls: **implemented baseline IaC pack**
- Monitoring, logging, and incident response: **implemented baseline artifacts**
- Remaining gaps are tracked in
  [IEC 62443 Control Mapping open items](./IEC-62443-control-mapping.md#planned--open-items-phase-7)
  and `.developer/TODO.md`.

## Assumptions and Limits

- This matrix is a baseline alignment artifact, not a certification outcome.
- Formal external audit evidence (for example SoA, penetration test report,
  control effectiveness sampling) remains out of scope for this document.

## Related Artifacts

- [Compliance README](./README.md)
- [IEC 62443 Control Mapping](./IEC-62443-control-mapping.md)
- [ADR-011: mTLS and Zero-Trust Service Mesh](../architecture/ADR-011-mtls-zero-trust-service-mesh.md)
- [ADR-012: RBAC/ABAC Authorization Design](../architecture/ADR-012-rbac-abac-authorization-design.md)

---

_Last Updated: 2026-03-11 (Phase 7 baseline)_
