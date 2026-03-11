# Istio AuthorizationPolicy Baseline (Phase 7)

This directory contains the Istio `AuthorizationPolicy` baseline for IEC 62443
FR-5 / SR 5.2 (zone boundary protection) aligned to
[ADR-011](../../../docs/architecture/ADR-011-mtls-zero-trust-service-mesh.md).

## Scope

- Namespace-scoped default deny for NeuroLogix trust zones:
  - `neurologix-core`
  - `neurologix-ai`
  - `neurologix-edge`
  - `neurologix-ui`
- Explicit zone-pair allowlists for baseline permitted flows:
  - `neurologix-ui` -> `neurologix-core`
  - `neurologix-ai` -> `neurologix-core`
  - `neurologix-edge` -> `neurologix-core`
  - `neurologix-core` -> `neurologix-ai`
  - `neurologix-core` -> `neurologix-edge`
  - `istio-system` -> `neurologix-ui` (ingress gateway path)

## Service Principals Covered

Baseline principals are represented as SPIFFE identity patterns per namespace:

- `cluster.local/ns/neurologix-core/sa/*`
- `cluster.local/ns/neurologix-ai/sa/*`
- `cluster.local/ns/neurologix-edge/sa/*`
- `cluster.local/ns/neurologix-ui/sa/*`
- `cluster.local/ns/istio-system/sa/*`

This keeps the baseline merge-safe while establishing explicit allowlists.
As namespace service accounts are finalized in deployment manifests, wildcard
patterns should be tightened to exact service-account principals.

## Apply

```bash
kubectl apply -k infrastructure/security/authorization-policies
```

## Notes

- This baseline complements, and does not replace, Kubernetes `NetworkPolicy`
  controls in `infrastructure/security/network-policies/`.
- Live cluster rollout evidence is captured separately in staging and
  production runbooks.
