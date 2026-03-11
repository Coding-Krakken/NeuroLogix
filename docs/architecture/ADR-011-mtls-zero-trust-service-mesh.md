# ADR-011: mTLS and Zero-Trust Service Mesh

## Status

Accepted

## Context

NeuroLogix is classified T1 (Mission-Critical) and must comply with IEC 62443,
ISO 27001, and NIST CSF. The system spans four trust zones (Edge, Core, AI, UI)
and integrates cloud AI services, edge PLC adapters, mobile operator devices,
and third-party WMS/WCS systems.

Traditional perimeter-based security ("castle-and-moat") is insufficient for
this threat model. A compromised component on the internal network must not be
able to issue arbitrary commands to other services. IEC 62443 SL-2 and above
require authenticated and authorised inter-zone communication.

Key drivers:

- Inter-service traffic currently implicit-trust within the cluster network.
- TLS termination at ingress only leaves east-west traffic unencrypted.
- Certificate-based identity is required to enforce zone isolation.
- Dev/production divergence must be explicit and auditable.

## Decision

### Zero-Trust Principle

No service trusts any other service by default, regardless of network origin.
Every request must carry a verifiable identity credential (mTLS certificate)
and the receiver must authorise the caller before processing the request.

This maps to IEC 62443 FR-1 (Identification and Authentication Control) and
FR-2 (Use Control) across all security zones.

### Certificate Authority (CA) Design

| Environment | CA Type | Rotation Frequency |
|---|---|---|
| Production | cert-manager + ACME (Let's Encrypt for ingress) / internal private CA (Vault PKI) for east-west | 30-day leaf cert rotation, 1-year intermediate |
| Staging | cert-manager with self-signed intermediate | 7-day leaf rotation |
| Development | \`mkcert\` local CA, gitignored | Manual |

**Vault PKI** is the production CA for east-west mTLS:
- Vault issues short-lived leaf certificates (30-day TTL).
- `cert-manager` CertificateRequest controller handles automated rotation.
- CA root is stored in Vault and never persisted in Kubernetes secrets directly.

### mTLS Enforcement Pattern

All inter-service HTTP communication uses Kubernetes service mesh mTLS:

1. **Service Mesh**: Istio (preferred) or Linkerd as the sidecar-based mTLS
   enforcement layer. Selection finalised before Phase 7 implementation gate.
2. **Sidecar injection**: All workloads in namespaces `neurologix-core`,
   `neurologix-ai`, and `neurologix-edge` have Istio/Linkerd sidecar
   annotation enabled.
3. **PeerAuthentication policy**: `STRICT` mode enforces mTLS for all
   inbound connections in core and AI namespaces.
4. **AuthorizationPolicy**: Allowlist model — explicit `AuthorizationPolicy`
   resources name each permitted caller. Any caller not in the allowlist is
   denied by the mesh.

```yaml
# Example: PeerAuthentication for SL-2 Core namespace
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: neurologix-core
spec:
  mtls:
    mode: STRICT
```

### Trust Zone Enforcement

| Zone | Namespace | mTLS Mode | Inbound Callers Permitted |
|---|---|---|---|
| SL-1 Edge | `neurologix-edge` | STRICT | Core only (MQTT bridging) |
| SL-2 Core | `neurologix-core` | STRICT | AI zone (read-only), UI zone (API Gateway), Edge zone (sensor events) |
| SL-3 AI | `neurologix-ai` | STRICT | Core only (recipe-executor API for inference requests) |
| SL-4 UI | `neurologix-ui` | STRICT | Operator clients via ingress TLS; no lateral access to AI or Edge |

**Hard constraint**: AI zone (`neurologix-ai`) may call core services for
inference input only. It MUST NOT hold an `AuthorizationPolicy` allowing direct
write access to the recipe-executor command path. Command issuance must flow via
the core recipe-executor, which enforces validated safety checks.

### Certificate Rotation and Revocation

- Leaf certificate TTL: **30 days** (production), **7 days** (staging).
- `cert-manager` renews at 2/3 of TTL (20-day renewal trigger in production).
- Vault PKI CRL endpoint exposed and polled every 5 minutes by the mesh
  control plane.
- On compromise, revoke via `vault write pki/revoke serial_number=...` and
  force rotation within one clock cycle (≤30 min SLA).

### Development Environment

- `mkcert` generates a local CA stored in `~/.local/share/mkcert/`.
- Local CA cert added to system trust store for development TLS.
- Services in `docker-compose.dev.yml` use plain HTTP between containers
  (loopback-only internal network, no external exposure).
- **Development divergence is documented here**: plain HTTP in dev is an
  accepted, auditable exception. No dev certificates committed to the repo.

### CI/CD

- `gitleaks` scans for committed certificates or private keys (CI gate).
- `trivy` scans container images for known TLS library CVEs.
- mTLS policy compliance validated in staging E2E smoke test suite before
  production promotion.

## Rationale

mTLS with a service mesh provides the strongest east-west security posture
without requiring every service to implement TLS handshake logic itself.
cert-manager + Vault PKI automates rotation and aligns with the immutable
infrastructure model — no long-lived credentials.

The STRICT PeerAuthentication mode ensures that even a compromised internal
container cannot send unauthenticated requests to peer services, satisfying
IEC 62443 SL-2 FR-1 (identification and authentication) for inter-service
communication.

The short TTL (30 days) reduces the blast radius of a leaked certificate.
Vault revocation and mesh control plane CRL polling closes the revocation
window to under 30 minutes.

## Consequences

### Benefits

- East-west traffic is encrypted and mutually authenticated — IEC 62443 SL-2
  FR-1 and FR-2 satisfied for inter-service communication.
- Zone isolation is enforced at the mesh layer, not just the application layer.
- Automated certificate rotation eliminates long-lived credential risk.
- Sidecar model offloads TLS logic from application developers.

### Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Service mesh adds latency | Measured p95 overhead target <5ms; within control loop budget. Benchmarked in Phase 7 load tests. |
| cert-manager misconfiguration leaves certs expired | Alerting rule `cert_expiry_days < 7` in Prometheus alert rules (see `infrastructure/observability/prometheus-alerts.yml`). |
| Vault unavailability blocks cert rotation | Vault HA with 3-node Raft cluster; fallback to last-issued cert for 30-day grace period. |
| Dev/prod divergence causes test blind spots | Staging environment uses STRICT mTLS identical to production; dev divergence is documented and gated. |

## Implementation Checklist (Phase 7)

- [ ] Select service mesh (Istio vs Linkerd) — ADR amendment required
- [ ] Deploy Vault PKI in staging cluster
- [ ] Install cert-manager and configure VaultIssuer CRD
- [ ] Apply PeerAuthentication STRICT policy per namespace
- [ ] Create AuthorizationPolicy allowlists per service pair
- [ ] Validate E2E smoke tests pass under STRICT mTLS
- [ ] Confirm `cert_expiry_days < 7` alert fires correctly
- [ ] Document Vault root CA backup and restoration procedure

## References

- [ADR-003: Security-First Architecture](./ADR-003-security-first-architecture.md)
- [IEC 62443-3-3: System security requirements and security levels](https://www.isa.org/standards-and-publications/isa-standards/isa-standards-committees/isa62443/)
- [cert-manager documentation](https://cert-manager.io/docs/)
- [Istio PeerAuthentication](https://istio.io/latest/docs/reference/config/security/peer_authentication/)
- [Vault PKI Secrets Engine](https://developer.hashicorp.com/vault/docs/secrets/pki)
