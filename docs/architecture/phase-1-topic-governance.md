# Phase 1 Topic Governance — Bounded Slice (Issue #30)

## Purpose

Define a minimal, enforceable broker topic contract for the Phase 1 data-spine
slice, covering Sparkplug MQTT and Kafka/Redpanda naming, ACL conventions, and
compatibility policy.

## In Scope for this Slice

1. Topic naming contract for Sparkplug MQTT and Kafka/Redpanda.
2. ACL rule contract for service principals and backend-specific topic patterns.
3. Contract compatibility checks for version progression and breaking change
   signaling.

## Topic Naming Contract

### Sparkplug MQTT

- Required namespace: `spBv1.0`
- Contract shape:
  - `spBv1.0/<groupId>/<messageType>/<edgeNodeId>`
  - `spBv1.0/<groupId>/<messageType>/<edgeNodeId>/<deviceId>`
- Validation path: `parseSparkplugTopic` + `SparkplugTopicContractSchema`

### Kafka/Redpanda

- Required prefix: `nlx.`
- Contract shape: `nlx.<domain>.<stream>.v<major>[.dlq]`
- Allowed domains in this slice:
  - `telemetry`
  - `intents`
  - `recipes`
  - `assets`
  - `audit`
  - `api`

## ACL Model (Bounded)

- Principal format: `svc.<service-name>`
- Operation set: `publish`, `subscribe`
- Backend-specific topic pattern guards:
  - Sparkplug ACL patterns must start with `spBv1.0/`
  - Kafka/Redpanda ACL patterns must start with `nlx.`
- Runtime authorization path: `authorizeBrokerTopicAccess` in
  `packages/schemas/src/broker/acl.ts`
- Bootstrap coverage gate: `assertBrokerAclCoverage` for startup-time validation
  that each required registration is covered by at least one ACL rule

## Partitioning, Retention, and Dead-Letter Strategy

### Kafka/Redpanda

- Partition bounds enforced by contract: `1..128`
- Retention represented in hours (`retentionHours`)
- Dead-letter topics supported through optional `.dlq` suffix using the same
  base contract (`nlx.<domain>.<stream>.v<major>.dlq`)

### Sparkplug MQTT

- QoS is explicitly constrained in contract:
  - `at-most-once`
  - `at-least-once`
  - `exactly-once`

## Compatibility Enforcement

Compatibility evaluation fails when any of the following occur:

1. Backend changes for an existing contract.
2. Topic name changes for an existing contract.
3. Version regresses (non-monotonic progression).
4. Payload schema changes without major version bump.
5. Compatibility mode downgrades from `full` to `backward`.

Compatible updates include additive or non-breaking updates that preserve topic,
backend, and payload schema within the same major version, or breaking changes
that increment major version.
