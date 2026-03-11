# NetworkPolicy Baseline (Phase 7)

This directory contains the Kubernetes `NetworkPolicy` baseline for IEC 62443
FR-5 (Restricted Data Flow) zone segmentation.

## Scope

- Namespace-level default deny for NeuroLogix trust zones:
  - `neurologix-core`
  - `neurologix-ai`
  - `neurologix-edge`
  - `neurologix-ui`
- Explicit baseline zone-to-zone allows aligned to ADR-011.
- DNS egress exceptions for cluster name resolution.

## Apply

```bash
kubectl apply -k infrastructure/security/network-policies
```

## Notes

- This is a baseline policy pack and does not replace service-mesh
  `AuthorizationPolicy` controls.
- Live cluster rollout evidence must be captured separately in staging and
  production runbooks.
