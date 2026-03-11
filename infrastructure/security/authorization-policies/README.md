# Istio AuthorizationPolicy Baseline (Phase 7)

This directory contains the Istio `PeerAuthentication` and `AuthorizationPolicy`
baseline for IEC 62443 FR-5 / SR 5.2 (zone boundary protection) and IEC 62443
FR-1 / SR 1.2 / SR 3.1 (mTLS identity enforcement), aligned to
[ADR-011](../../../docs/architecture/ADR-011-mtls-zero-trust-service-mesh.md).

## Scope

### PeerAuthentication (mTLS Enforcement Prereq)

`peer-authentication-strict.yaml` — STRICT mTLS enforced in all four trust zone
namespaces (`neurologix-core`, `neurologix-ai`, `neurologix-edge`,
`neurologix-ui`). Without STRICT mode, Istio cannot verify principal identity
and the `AuthorizationPolicy` allowlists below cannot enforce caller identity.

### AuthorizationPolicy

- Namespace-scoped default deny for all NeuroLogix trust zones.
- Explicit zone-pair allowlists for baseline permitted flows:
  - `neurologix-ui` → `neurologix-core` (operator API calls, all HTTP verbs)
  - `neurologix-ai` → `neurologix-core` (inference input reads, **GET only**)
  - `neurologix-edge` → `neurologix-core` (sensor events, GET + POST)
  - `neurologix-core` → `neurologix-ai` (inference requests, POST + GET)
  - `neurologix-core` → `neurologix-edge` (command dispatch, POST + GET)
  - `istio-system` → `neurologix-ui` (ingress gateway → UI entry point)

Baseline principals are represented as SPIFFE identity patterns per namespace:

- `cluster.local/ns/neurologix-core/sa/*`
- `cluster.local/ns/neurologix-ai/sa/*`
- `cluster.local/ns/neurologix-edge/sa/*`
- `cluster.local/ns/neurologix-ui/sa/*`
- `cluster.local/ns/istio-system/sa/*`

This keeps the baseline merge-safe while establishing explicit allowlists. As
namespace service accounts are finalized in deployment manifests, wildcard
patterns should be tightened to exact service-account principals.

## Apply

```bash
kubectl apply -k infrastructure/security/authorization-policies
```

## Notes

- This baseline complements, and does not replace, Kubernetes `NetworkPolicy`
  controls in `infrastructure/security/network-policies/`.
- Live cluster rollout evidence is captured separately in staging and production
  runbooks.
