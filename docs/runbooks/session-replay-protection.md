# Runbook: Session Replay Protection

**Severity:** High (security control)  
**Phase:** 7 – Security & Compliance  
**Component:** `packages/security-core` — `ReplayProtectionGuard`  
**IEC 62443 Reference:** SR 3.1 (Communication Integrity), SR 2.12 (Non-Repudiation)

---

## Overview

The `ReplayProtectionGuard` validates incoming command requests for duplicate nonce usage and timestamp skew. It provides an in-memory nonce retention window to prevent replayed or duplicated control messages from executing more than once.

Configuration defaults:

| Parameter           | Default    | Description                                      |
| ------------------- | ---------- | ------------------------------------------------ |
| `nonceTtlMs`        | 5 minutes  | How long a used nonce is retained as "seen"      |
| `maxTimestampSkewMs`| 60 seconds | Maximum allowed age of request timestamp         |
| `maxEntries`        | 10,000     | Maximum tracked nonces (oldest evicted on limit) |
| `enabled`           | `true`     | Toggle; set `false` only in dev/test             |

---

## Symptoms of Replay Attack or Misconfiguration

| Symptom                                         | Likely Cause                                          |
| ----------------------------------------------- | ----------------------------------------------------- |
| Policy-engine returns `403` with "already used" | Duplicate nonce from replayed or retried request      |
| Policy-engine returns `403` with "Timestamp"    | Request timestamp outside `maxTimestampSkewMs` window |
| Policy-engine returns `403` with "Nonce required"| Caller omitted the `nonce` field                     |
| Replay guard accepting duplicate nonces         | Guard disabled (`enabled: false`) in service config   |

---

## Operator Triage Steps

### 1. Identify rejection type

Check policy-engine logs for the rejection reason:

```
"reason": "Nonce already used within replay protection window"
"reason": "Timestamp outside allowed skew window (60000ms)"
"reason": "Nonce is required when replay protection is enabled"
```

### 2. Verify client clock synchronisation

If timestamp-skew rejections are seen:

- Confirm NTP is active on the sender host.
- Check if `maxTimestampSkewMs` is appropriate for the network latency profile.
- In staging, the skew window can be temporarily increased via `replayProtection.maxTimestampSkewMs` in service configuration.

### 3. Confirm nonce uniqueness on the client

- Callers **must** generate a unique nonce per request (e.g., `crypto.randomUUID()`).
- Retries **must** use a fresh nonce, not a replayed one.
- Scope the nonce to the service+operator context where applicable.

### 4. Check in-memory state under high load

Under sustained high throughput, the guard may evict older entries when `maxEntries` is reached. This is expected and non-fatal. If legitimate requests are being rejected:

- Review `maxEntries` vs. peak request rate and `nonceTtlMs`.
- A future slice will add distributed nonce store support (non-goal of this baseline).

---

## Resolution Steps

| Scenario                           | Action                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------- |
| Replay attack detected             | Investigate `policyDecisionLog` for source service/operator identity; alert security team; escalate to incident process. |
| False positive (clock drift)       | Resync NTP; consider increasing `maxTimestampSkewMs` to 90–120 seconds.   |
| False positive (missing nonce)     | Update caller to include `nonce` UUID in authorization request.            |
| Capacity eviction causing misses   | Increase `maxEntries` or reduce `nonceTtlMs`; document in config change log. |

---

## Prevention

- All service-to-service command requests **must** include a nonce and timestamp.
- Replay protection is enabled by default; disabling it requires explicit security justification and ADR update.
- Nonce generation must use a cryptographically secure source (`crypto.randomUUID` or equivalent).
- Clock sync (NTP) is a deployment prerequisite for all nodes.

---

## Related Artifacts

- [ADR-012: RBAC/ABAC Authorization Design](../architecture/ADR-012-rbac-abac-authorization-design.md)
- [ADR-011: mTLS Inter-Service Communication](../architecture/ADR-011-mtls-inter-service-communication.md)
- [IEC 62443 Control Mapping](../compliance/IEC-62443-control-mapping.md)
- [Policy Engine Triage Runbook](policy-engine-triage.md)
- Source: `packages/security-core/src/replay-protection.ts`
