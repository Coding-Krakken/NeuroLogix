# Compliance Documentation

## Purpose

This directory contains compliance and security alignment documentation for
NeuroLogix controls, policies, and evidence tracking.

## Current Status

**Phase 7 — Active** · IEC 62443 control mapping baseline established.

| Document                                                                         | Status                                     | Last Updated |
| -------------------------------------------------------------------------------- | ------------------------------------------ | ------------ |
| [IEC 62443 Control Mapping](./IEC-62443-control-mapping.md)                      | ✅ Baseline + FR-5 allowlist/mTLS evidence | 2026-03-11   |
| [ISO 27001 / NIST CSF Alignment Matrix](./ISO27001-NIST-CSF-alignment-matrix.md) | ✅ Baseline established                    | 2026-03-11   |
| [Audit Evidence Register](./AUDIT-EVIDENCE-REGISTER.md)                          | ✅ Baseline established                    | 2026-03-11   |
| Penetration Test Report                                                          | 🔄 Planned (Phase 7)                       | —            |

## IEC 62443 Compliance Summary

NeuroLogix targets **Security Level 2 (SL-2)** for Core, AI, and UI zones, and
**SL-1** for the Edge zone.

- **Controls mapped:** 46 across FR-1 through FR-7
- **Compliant (designed + implemented):** 33/42 = 79%
- **Planned (Phase 7 implementation work):** 9
- **Not Applicable:** 4

See [IEC-62443-control-mapping.md](./IEC-62443-control-mapping.md) for full
detail.

## Architecture Evidence

- [ADR-003: Security-First Architecture](../architecture/ADR-003-security-first-architecture.md)
- [ADR-008: Policy Engine with OPA](../architecture/ADR-008-policy-engine-opa.md)
- [ADR-011: mTLS and Zero-Trust Service Mesh](../architecture/ADR-011-mtls-zero-trust-service-mesh.md)
- [ADR-012: RBAC/ABAC Authorization Design](../architecture/ADR-012-rbac-abac-authorization-design.md)

## Operational Evidence

- [mTLS and mesh policy operations runbook](../runbooks/mtls-mesh-policy-validation.md)

## Related

- [README Security & Compliance section](../../README.md)
- [Runbooks](../runbooks/README.md)
- [Phase 7 Roadmap](../../.developer/TODO.md)
