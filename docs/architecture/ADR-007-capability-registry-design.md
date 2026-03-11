# ADR-007: Capability Registry Design

## Status

Accepted

## Context

NeuroLogix is designed to integrate with a diverse and evolving set of
industrial hardware and software capabilities — PLCs, vision cameras, barcode
scanners, WMS adapters, AI models, and custom business logic. In early
prototypes, capabilities were statically wired into the core system. This
caused:

- Brittle deployment processes (any new device required a code change and
  full redeployment).
- No mechanism to enable/disable capabilities at runtime without restart.
- No standardised health reporting across heterogeneous capability types.
- Complexity in policy evaluation (the policy engine needed to know what
  capabilities existed and their current operational state).

A generalised mechanism was needed to register, discover, and manage the
lifecycle of system capabilities without modifying the core platform.

## Decision

**Capability Registry** (`services/capability-registry`) is the canonical
service responsible for managing the full lifecycle of platform capabilities.

**Core responsibilities:**

1. **Registration:** Capabilities self-register on startup, providing a
   `CapabilityDescriptor` including:
   - `id` — globally unique identifier (namespaced: `{site_id}.{type}.{name}`)
   - `type` — `plc_adapter | vision_camera | wms_connector | ai_model | ...`
   - `version` — semver capability contract version
   - `zone` — owning security zone (links to ADR-003 trust zones)
   - `health` — initial health state
   - `metadata` — arbitrary capability-specific configuration

2. **Discovery:** Any service can query the registry to discover available
   capabilities by type, site, or zone. The Mission Control UI uses this to
   render the configuration studio and active capability list.

3. **Health tracking:** Capabilities periodically send heartbeat updates.
   The registry maintains current health state (`HEALTHY | DEGRADED |
   OFFLINE | UNKNOWN`) and emits capability-change events to the digital
   twin and dispatch service.

4. **Policy integration:** The policy engine queries the registry to verify
   that a target capability is `HEALTHY` and `ONLINE` before approving a
   recipe step that actuates it.

5. **Audit emission:** Every registration, deregistration, and health-state
   change is emitted as an audit event.

**Interface (REST + SSE):**

| Endpoint | Method | Description |
|---|---|---|
| `/api/capabilities` | GET | List all registered capabilities |
| `/api/capabilities/:id` | GET | Get capability by ID |
| `/api/capabilities/:id` | PUT | Register or update capability |
| `/api/capabilities/:id` | DELETE | Deregister capability |
| `/api/capabilities/stream` | SSE | Live health-change event stream |

**Schema:** All capability data validated against
`@neurologix/schemas` — `CapabilityDescriptor` and `CapabilityHealth`
Zod schemas.

**Persistence:** In-memory during Phase 2; Redis-backed persistence planned
for Phase 7 to survive service restarts without re-registration.

## Rationale

The plugin/registry pattern decouples the platform from specific hardware or
software capabilities, enabling:

- New adapters to be added without modifying core platform code.
- Runtime enable/disable without restarts (for non-safety-critical capabilities).
- A single source of truth for "what is operational right now" — required by
  the policy engine, dispatch, and digital twin.

The decision to use self-registration (capabilities push to the registry)
rather than a centralised provisioning model (registry pulls configuration)
improves resilience during partial cluster restarts: capabilities register
themselves as they come online, and the registry reflects actual vs
configured state accurately.

## Consequences

**Benefits:**
- Zero-code-change integration of new capability types.
- Policy engine can make data-driven decisions about target capability health
  without knowing capability implementation details.
- SSE stream enables real-time Mission Control UI updates without polling.

**Trade-offs and risks:**
- Self-registration creates a brief window after service startup where a
  capability is operational but not yet registered; recipe executor must
  not proceed until registration is confirmed.
- In-memory persistence means all capabilities re-register on registry
  restart; this requires all capability services to implement registration
  retry logic.
- Registry becomes a high-availability dependency; its unavailability must
  be a monitored alert (not a silent failure).

**Future work:**
- Redis-backed persistence (Phase 7).
- Capability versioning and rolling upgrade support (Phase 9).
- Multi-site capability federation (Phase 9).

## Alternatives Considered

| Alternative | Reason rejected |
|---|---|
| Static configuration file | Cannot reflect runtime health changes; requires restart to add/remove capabilities |
| Kubernetes service discovery only | Does not provide domain-level health semantics; no recipe-step capability validation |
| Service mesh (Istio) service registry | Infrastructure-level only; no business-domain capability semantics (type, zone, health reason) |
| Event sourced registry with Kafka | Adds Kafka dependency to capability registration hot path; in-memory approach sufficient for Phase 2 |

## References

- [services/capability-registry source](../../services/capability-registry/)
- [packages/schemas/src/telemetry](../../packages/schemas/src/telemetry/)
- [ADR-003: Security-First Architecture](./ADR-003-security-first-architecture.md)
- [ADR-005: Message Broker Selection](./ADR-005-message-broker-selection.md)
- [ADR-008: Policy Engine with OPA](./ADR-008-policy-engine-opa.md)
