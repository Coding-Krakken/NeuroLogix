# ADR-010: Contract Testing Strategy

## Status

Accepted

## Context

NeuroLogix is a T1 mission-critical industrial control system with a
multi-service architecture. Services span a Next.js mission-control frontend,
five Node.js backend services (capability-registry, policy-engine,
recipe-executor, digital-twin, site-registry), a shared adapters package, and a
central `@neurologix/schemas` contract library.

Each service boundary is a potential integration failure point. In a
safety-critical system, a silent contract break between services can result in:

- Recipe executor receiving malformed step definitions and taking an unsafe
  control action.
- Policy engine returning an incorrectly shaped evaluation result, bypassing a
  safety interlock.
- Digital twin receiving an invalid state update and reporting incorrect
  equipment state to operators.
- The mission-control UI rendering corrupt or missing alarm data.

The system needed a contract testing strategy that:

1. Detects integration breaks at the boundary level before they reach
   production.
2. Does not require a running orchestrated environment to execute.
3. Integrates cleanly into the existing Vitest-based unit testing infrastructure.
4. Covers both server-side response shape validation and client-side payload
   parsing validation.
5. Runs as a dedicated CI gate, independent of unit tests.

## Decision

**Strategy: Pact-lite server + consumer contract testing using Zod schema
assertions.**

Rather than adopting a full Pact broker with provider states and publishing
infrastructure (not yet warranted at Phase 1 scale), the team adopted a
Pact-inspired testing model built directly on the existing Zod schema library
(`@neurologix/schemas`) and Vitest.

### Server Contract Tests

Each service exposes a `src/contracts/<service-name>.contract.test.ts` file
that:

- Directly imports or instantiates the service's production request handlers.
- Exercises each HTTP endpoint (or equivalent) with valid contract inputs.
- Asserts that the response payload parses successfully against the
  corresponding Zod schema from `@neurologix/schemas`.
- Asserts that the HTTP status codes and error response shapes match the
  defined error schema.
- Does **not** mock production dependencies; uses minimal in-memory fixture
  state.

Services covered (as of Phase 1):

| Service | File |
|---|---|
| site-registry | `services/site-registry/src/contracts/site-registry.contract.test.ts` |
| capability-registry | `services/capability-registry/src/contracts/capability-registry.contract.test.ts` |
| policy-engine | `services/policy-engine/src/contracts/policy-engine.contract.test.ts` |
| recipe-executor | `services/recipe-executor/src/contracts/recipe-executor.contract.test.ts` |
| digital-twin | `services/digital-twin/src/contracts/digital-twin.contract.test.ts` |

### Consumer Contract Tests

Consumer-side tests live in the consuming package and assert that the
consumer's parsing logic correctly handles the message shapes it reads from
other services.

| Consumer | File | Validates |
|---|---|---|
| mission-control | `apps/mission-control/src/consumer.contract.test.ts` | Site registry API response parsing |
| mission-control | `apps/mission-control/src/server.contract.test.ts` | Federation API endpoints (SITE-005, FF-002, FF-003) |
| adapters | `packages/adapters/src/contracts/broker-consumer.contract.test.ts` | Kafka/MQTT message envelope parsing from `@neurologix/schemas/broker` |

### Broker Consumer Contracts

The adapters package validates that all broker message envelopes it consumes
(tag values, alarm events, recipe events, audit logs, state changes) parse
correctly against the canonical Zod schemas in `@neurologix/schemas/broker`.
This ensures that any breaking change to broker message shapes is caught at the
contract boundary before reaching service logic.

### Governance Enforcement

Broker topic governance is enforced at the schema layer via:

- `packages/schemas/src/broker/governance.ts` — validates topic names against
  the canonical topic registry.
- `packages/schemas/src/broker/acl.ts` — validates publisher/subscriber
  permissions against the access control list.

## CI Gate

A dedicated `contract-tests` job runs in the mainline CI workflow
(`.github/workflows/ci.yml`) and in the release CI gate
(`.github/workflows/release.yml`). It runs after unit tests and independently
of E2E tests.

The contract-tests job:
1. Builds all workspace dependencies.
2. Runs server contract tests across all five services.
3. Runs consumer contract tests for mission-control and adapters.
4. Fails the build if any contract boundary assertion fails.

## Rationale

Pact-lite was chosen over full Pact because:

1. **No broker infrastructure required** — Zod schemas serve as the shared
   contract artefact; no external Pact Broker service needed at Phase 1.
2. **Leverages existing tooling** — Vitest, Zod, and the existing
   `@neurologix/schemas` library; zero new dependencies.
3. **Type-safe contracts** — Zod inference provides TypeScript type safety as
   a by-product of contract validation.
4. **Incremental migration path** — The test structure is compatible with
   future migration to full Pact (the consumer/provider boundary is already
   explicit).

Full Pact broker integration is deferred to Phase 7 (Security & Compliance)
when inter-service mTLS and formal contract versioning are introduced.

## Consequences

**Positive:**
- Contract breaks are detected at CI time before reaching staging.
- Zero new runtime dependencies.
- Contract tests serve as executable specifications of each service boundary.
- Broker message shape changes are caught before service logic is affected.

**Negative / Trade-offs:**
- Does not produce machine-readable Pact JSON artefacts for cross-team sharing.
- Provider state management is implicit (fixture-based), not formally declared.

## Evolution

When Phase 7 introduces mTLS and formal contract versioning, this strategy
should be revisited for full Pact broker migration.

## References

- OBS-001 observability model: `.github/.system-state/ops/observability_model.yaml`
- Schema registry decision: [ADR-006](./ADR-006-schema-registry-contracts.md)
- Message broker decision: [ADR-005](./ADR-005-message-broker-selection.md)
- Phase 1 topic governance: [phase-1-topic-governance.md](./phase-1-topic-governance.md)
