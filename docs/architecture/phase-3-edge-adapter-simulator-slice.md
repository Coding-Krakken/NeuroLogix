# Phase 3 Edge Adapter + Demo Simulator — Bounded Slice (Issue #31)

## Purpose

Deliver one small, deterministic Phase 3 slice that proves:

1. Sparkplug MQTT ingestion can be normalized with deterministic pass/fail rules.
2. Connection lifecycle transitions (disconnect/reconnect) are explicit and
   testable.
3. A canonical simulator profile can emit reproducible telemetry for demos and
   targeted testing.

## In Scope for this Slice

1. Sparkplug ingestion adapter limited to one canonical topic/message path:
   `spBv1.0/<groupId>/DDATA/<edgeNodeId>/<deviceId>`.
2. Payload validation using existing Sparkplug schema contracts.
3. Deterministic connection-state transitions:
   - `connect` → `connected`
   - `disconnect` → `disconnected`
   - `reconnect-start` → `reconnecting`
   - `reconnect-success` → `connected`
4. Deterministic demo simulator profile:
   - scenario: `demo-line-canonical-v1`
   - line: `line-a`
   - edge node: `edge-01`
   - device: `conveyor-01`

## Out of Scope for this Slice

- OPC UA connector implementation.
- Full Sparkplug birth/death state-machine coverage.
- Multi-profile simulator framework or UI integration.
- Downstream runtime orchestration work planned for Issues `#32+`.

## Normalization Behavior

The adapter accepts Sparkplug `DDATA` only in this slice and returns one of:

1. Success with normalized telemetry points (`ok: true`).
2. Deterministic rejection (`ok: false`) with one bounded error code:
   - `INVALID_TOPIC`
   - `UNSUPPORTED_MESSAGE_TYPE`
   - `INVALID_PAYLOAD`
   - `NO_VALID_METRICS`

Metric normalization currently keeps primitive values (`string`, `number`,
`boolean`) and rejects non-primitive payload values to avoid ambiguous mapping.

## Simulator Behavior

The canonical simulator emits three deterministic telemetry points per step:

1. `throughput.units_per_min`
2. `cycle_time.seconds`
3. `fault.jam_detected`

Given the same `seed`, `baseTimestamp`, and `stepIntervalMs`, generated frames
are reproducible across runs.

## Risks and Rollback

### Risks

1. `DDATA`-only bounded support may reject valid Sparkplug messages outside this
   slice.
2. Primitive-only metric normalization may exclude complex metric payloads.

### Mitigations

1. Rejections are explicit with deterministic error codes.
2. Scope is isolated in `@neurologix/adapters` to keep rollback low-risk.

### Rollback

1. Revert the Issue #31 changeset.
2. Re-run lane gates (`npm run lint`, `npm test`, `npm run build`) to confirm
   baseline restoration.