# Audit Evidence Register (Baseline)

## Purpose

This register tracks baseline compliance evidence artifacts for NeuroLogix Phase
7 security and compliance delivery.

It provides a durable index of:

- control domain coverage
- evidence source location in the repository
- evidence owner role
- collection/update cadence
- current readiness status

## Status Key

- **Established**: artifact exists and is review-ready as baseline evidence
- **In Progress**: artifact partially available; collection or runtime
  validation pending
- **Planned**: artifact not yet available, tracked in roadmap/backlog

## Baseline Evidence Entries

| Evidence ID | Control Domain                    | Artifact                                                                                            | Owner Role                   | Collection Cadence                  | Status      | Notes                                                   |
| ----------- | --------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------- | ----------- | ------------------------------------------------------- |
| EV-SEC-001  | IEC 62443 Control Mapping         | [IEC 62443 Control Mapping](./IEC-62443-control-mapping.md)                                         | Security Engineering         | Per compliance PR or control change | Established | Primary FR-1..FR-7 mapping baseline                     |
| EV-SEC-002  | ISO 27001 / NIST CSF Alignment    | [ISO27001-NIST-CSF Alignment Matrix](./ISO27001-NIST-CSF-alignment-matrix.md)                       | Security Engineering         | Per compliance PR                   | Established | Baseline crosswalk for ISO/NIST evidence posture        |
| EV-SEC-003  | Zero-Trust and mTLS Design        | [ADR-011](../architecture/ADR-011-mtls-zero-trust-service-mesh.md)                                  | Platform Security            | Per architecture decision update    | Established | Trust-zone and mesh control design authority            |
| EV-SEC-004  | RBAC / ABAC Authorization Model   | [ADR-012](../architecture/ADR-012-rbac-abac-authorization-design.md)                                | Security Architecture        | Per authorization model change      | Established | Identity and use-control decision record                |
| EV-SEC-005  | OPA Policy Engine Architecture    | [ADR-008](../architecture/ADR-008-policy-engine-opa.md)                                             | Platform Security            | Per policy architecture change      | Established | Policy decision and enforcement architecture            |
| EV-OPS-001  | Mesh Control Validation Procedure | [mTLS and mesh policy validation runbook](../runbooks/mtls-mesh-policy-validation.md)               | SRE / Operations             | Quarterly + per policy incident     | Established | Operational verification and incident response evidence |
| EV-OPS-002  | Safety Degradation Procedure      | [Safe mode activation runbook](../runbooks/safe-mode-activation.md)                                 | Operations Lead              | Quarterly drill                     | Established | Safety-first fallback evidence                          |
| EV-OPS-003  | Rollback Procedure                | [Release rollback runbook](../runbooks/release-rollback.md)                                         | Platform Engineering         | Per release process change          | Established | Controlled recovery and rollback evidence               |
| EV-IAC-001  | Network Segmentation Baseline     | [NetworkPolicy baseline pack](../../infrastructure/security/network-policies/README.md)             | Platform Engineering         | Per network-policy PR               | Established | Namespace and zone segmentation controls                |
| EV-IAC-002  | Mesh Allowlist Baseline           | [AuthorizationPolicy baseline pack](../../infrastructure/security/authorization-policies/README.md) | Platform Engineering         | Per policy PR                       | Established | Zone boundary allowlist enforcement                     |
| EV-CI-001   | CI Security and Quality Gates     | [CI workflow](../../.github/workflows/ci.yml)                                                       | DevEx / Platform Engineering | Per pipeline change                 | Established | Required checks (lint, typecheck, tests, scans, e2e)    |
| EV-CI-002   | Release Security Evidence         | [Release workflow](../../.github/workflows/release.yml)                                             | Platform Engineering         | Per release pipeline change         | Established | SBOM and release-path security evidence                 |
| EV-LOG-001  | Monitoring and Alert Baseline     | [Prometheus alerts](../../infrastructure/observability/prometheus-alerts.yml)                       | SRE                          | Per observability PR                | Established | Audit and security alert controls baseline              |
| EV-CUST-001 | Customer Security Commitments     | [.customer/SECURITY](../../.customer/SECURITY.md)                                                   | Product / Security           | Per customer packet release         | Established | Customer-facing security policy commitments             |
| EV-PEN-001  | Penetration Test Evidence Pack    | `docs/compliance/PENETRATION-TEST-REPORT.md` (planned)                                              | Security Engineering         | Semi-annual                         | Planned     | Targeted Phase 7/8 follow-up artifact                   |

## Governance Notes

- Evidence artifacts must remain immutable-reference friendly: update by
  additive revision rather than destructive replacement where practical.
- Every compliance-related PR should reference one or more Evidence IDs above.
- Planned evidence items must be tracked in `.developer/TODO.md` or an open
  issue.

## Related

- [Compliance README](./README.md)
- [IEC 62443 Control Mapping](./IEC-62443-control-mapping.md)
- [ISO27001-NIST-CSF Alignment Matrix](./ISO27001-NIST-CSF-alignment-matrix.md)

---

_Last Updated: 2026-03-11 (Phase 7 baseline)_
