# ADR-005: Message Broker Selection

## Status

Accepted

## Context

NeuroLogix must transport industrial telemetry from PLC and sensor edge nodes to
core platform services, and distribute internal domain events between core
services and AI pipelines. Two distinct messaging patterns were identified:

**Pattern A — Edge telemetry ingestion:**
- Source: PLCs, sensors, RFID readers at the factory floor
- Characteristics: High frequency (10,000+ tags/second), time-series, stateless,
  connectionless devices, lossy link tolerance required
- Latency: p95 under 50ms end-to-end to the digital twin

**Pattern B — Internal domain events:**
- Source: Core services (recipe executor, policy engine, dispatch)
- Characteristics: Ordered, durable, at-least-once delivery, fan-out to multiple
  consumers, replay for audit
- Latency: p95 under 200ms; eventual consistency acceptable

No single message broker architecture optimally serves both patterns at the
required scale and reliability level.

## Decision

**Edge telemetry:** [MQTT Sparkplug B](https://www.eclipse.org/tahu/spec/Sparkplug%20Topic%20Namespace%20and%20State%20ManagementV2.2-with%20appendix%20B%20format%20-%20Eclipse.pdf) over Eclipse Mosquitto (edge) / EMQX (cloud-side broker).

- MQTT Sparkplug B is the dominant ICS-native publish/subscribe protocol.
- Defines structured payload encoding (Google Protocol Buffers) for tag
  birth/death/data lifecycle.
- Native support in industrial edge devices eliminates adapter translation.
- EMQX provides clustering, persistent sessions, and ACL-based topic security.

**Internal domain events:** [Apache Kafka](https://kafka.apache.org/) for
cross-service event streaming.

- Durable, ordered, replayable event log — each topic partition is an
  append-only audit source.
- Consumer groups allow independent horizontal scaling of downstream services.
- Kafka Connect facilitates integration with external WMS/WCS systems.
- Retention policy enables audit log reconstruction.

**Topic governance:** Formally specified in [Phase 1 Topic Governance](./phase-1-topic-governance.md). Topic naming follows the schema:
`neurologix/{site_id}/{zone}/{entity_type}/{action}`.

**Schema enforcement:** All Kafka messages are validated against Zod schemas in
`packages/schemas/src/broker/` before publish. MQTT payloads validated against
Sparkplug B canonical schema in `packages/schemas/src/sparkplug/`.

## Rationale

| Pattern | Broker | Rationale |
|---|---|---|
| Edge telemetry | MQTT Sparkplug B | ICS industry standard; native device support; lightweight protocol for constrained links |
| Domain events | Kafka | Durable ordered log; at-least-once semantics; replay for audit; mature K8s operator (Strimzi) |

AMQP (RabbitMQ) was evaluated for domain events but rejected because it lacks
native log-compaction semantics and Kafka's replay capability, both required for
the audit trail.

MQTT alone (without Sparkplug B schema enforcement) was rejected because it does
not guarantee payload structure — any publisher can write arbitrary bytes to any
topic without contract enforcement.

## Consequences

**Benefits:**
- Native integration with PLCs and industrial edge hardware reduces adapter
  complexity.
- Kafka topic log provides a durable secondary audit trail complementary to the
  structured audit log.
- Consumer group model allows the digital twin, policy engine, and AI services
  to subscribe to telemetry independently without coupling.

**Trade-offs and risks:**
- Two distinct broker technologies increase operational complexity; engineers
  must understand both operational models.
- Kafka requires ZooKeeper or KRaft quorum; minimum cluster size 3 nodes adds
  infrastructure cost.
- MQTT broker (EMQX) requires topic ACL maintenance per site; ACL drift is a
  security risk without automated provisioning.

**Operational requirements:**
- Topic ACLs must be provisioned per site before any edge device is connected.
- Kafka retention policy must be set to a minimum of 90 days for audit
  purposes.
- Schema registry or `packages/schemas` validation must be enforced on all
  Kafka producers before Phase 1 closure.

## Alternatives Considered

| Alternative | Reason rejected |
|---|---|
| MQTT only (all messaging) | Lacks durability, replay, and ordered log semantics required for domain events |
| Kafka only (edge + internal) | TCP/persistent connections not suitable for constrained edge devices; Sparkplug B industry adoption loss |
| AMQP / RabbitMQ (internal events) | No log compaction; no native replay; weaker at scale vs. Kafka |
| NATS JetStream | Strong performance, but less mature tooling ecosystem and fewer industrial integrations |
| Pulsar | More complex operational model; Kafka tooling ecosystem significantly richer |

## References

- [MQTT Sparkplug B Specification](https://www.eclipse.org/tahu/spec/)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [EMQX Documentation](https://www.emqx.io/docs/)
- [Strimzi Kafka Operator](https://strimzi.io/)
- [Phase 1 Topic Governance](./phase-1-topic-governance.md)
- [packages/schemas/src/broker](../../packages/schemas/src/broker/)
- [packages/schemas/src/sparkplug](../../packages/schemas/src/sparkplug/)
