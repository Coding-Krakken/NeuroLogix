# Runbook: mTLS and Mesh Policy Validation

**Severity:** High (security control) **Phase:** 7 – Security & Compliance
**Components:** `infrastructure/security/authorization-policies/`, Istio mesh
control plane **IEC 62443 Reference:** SR 1.2 (Software Process Identification),
SR 3.1 (Communication Integrity), SR 5.2 (Zone Boundary Protection)

---

## Overview

This runbook verifies that NeuroLogix trust-zone controls are enforced at the
service mesh layer using:

- `PeerAuthentication` in `STRICT` mode for workload identity assurance.
- `AuthorizationPolicy` default-deny and explicit zone-pair allowlists.

It is used for staged rollout verification, incident triage, and compliance
evidence collection tied to ADR-011.

---

## Preconditions

- Access to staging or production Kubernetes cluster with read access to:
  - `neurologix-core`
  - `neurologix-ai`
  - `neurologix-edge`
  - `neurologix-ui`
  - `istio-system`
- `kubectl` context points to the intended environment.
- Change ticket or incident reference is available for evidence traceability.

---

## Symptoms and Triggers

| Signal                                            | Likely Cause                                                 |
| ------------------------------------------------- | ------------------------------------------------------------ |
| Unexpected 403 between trusted zone pairs         | Missing or overly restrictive `AuthorizationPolicy` rule     |
| Unexpected successful cross-zone call             | Missing default-deny or over-permissive allowlist            |
| mTLS principal not present in logs                | `PeerAuthentication` not `STRICT` or sidecar/injection drift |
| Sudden inter-service failures after policy update | Policy regression or incorrect namespace targeting           |

---

## Verification Steps

### 1) Confirm baseline resources are present

```bash
kubectl get authorizationpolicy -n neurologix-core
kubectl get authorizationpolicy -n neurologix-ai
kubectl get authorizationpolicy -n neurologix-edge
kubectl get authorizationpolicy -n neurologix-ui
```

Expected baseline includes namespace default-deny and zone-pair allowlists from
`infrastructure/security/authorization-policies/kustomization.yaml`.

### 2) Confirm strict mTLS mode is active

```bash
kubectl get peerauthentication -n neurologix-core -o yaml
kubectl get peerauthentication -n neurologix-ai -o yaml
kubectl get peerauthentication -n neurologix-edge -o yaml
kubectl get peerauthentication -n neurologix-ui -o yaml
```

Each namespace must show:

```yaml
spec:
  mtls:
    mode: STRICT
```

### 3) Validate zone-pair policy intent

Inspect policy details:

```bash
kubectl describe authorizationpolicy -n neurologix-core
kubectl describe authorizationpolicy -n neurologix-ai
kubectl describe authorizationpolicy -n neurologix-edge
kubectl describe authorizationpolicy -n neurologix-ui
```

Check that:

- Core ingress allows only UI, AI, and Edge principals per baseline.
- AI ingress allows only Core principals.
- Edge ingress allows only Core principals.
- UI ingress allows only Istio ingress gateway principals.

### 4) Verify denied cross-zone behavior (smoke)

From a non-allowlisted source workload, attempt a cross-zone request and verify
it is denied (`403` or connection rejected by mesh policy).

Record:

- source namespace/service account
- target namespace/service
- timestamp (UTC)
- observed denial evidence (event/log snippet)

---

## Incident Response Actions

| Scenario                                   | Immediate Action                                                                     | Follow-up                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `STRICT` missing in one or more namespaces | Reapply baseline manifests; verify sidecar and namespace labels                      | Open incident + root-cause record                           |
| Unauthorized cross-zone traffic observed   | Enable safe-mode if control-path risk exists; enforce default-deny + allowlist reset | Perform policy diff review and security incident assessment |
| Legitimate traffic blocked after update    | Roll back to last known-good policy revision; validate health/readiness endpoints    | Create targeted allowlist correction PR                     |

Safety note: PLC hardware interlocks remain independent and must stay active. Do
not bypass recipe-executor safety validation to recover throughput.

---

## Evidence Capture Template

Capture evidence in a planning artifact, for example:

`planning/mtls-mesh-validation-YYYY-MM-DD.md`

Include:

1. Environment and cluster context
2. `kubectl get/describe` command outputs (sanitized)
3. Verification result per trust zone
4. Any deviations and remediation actions
5. Incident/change ticket links

---

## Related Artifacts

- [ADR-011: mTLS and Zero-Trust Service Mesh](../architecture/ADR-011-mtls-zero-trust-service-mesh.md)
- [IEC 62443 Control Mapping](../compliance/IEC-62443-control-mapping.md)
- [Istio AuthorizationPolicy baseline pack](../../infrastructure/security/authorization-policies/README.md)
- [Safe Mode Activation](./safe-mode-activation.md)
- [Release Rollback](./release-rollback.md)
