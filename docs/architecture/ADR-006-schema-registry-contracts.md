# ADR-006: Schema Registry and Contracts

## Status

Accepted

## Context

NeuroLogix services span edge adapters, core runtime services, AI pipelines,
and a Next.js operator UI. Each boundary between services is a potential point
of data corruption, silent schema drift, or integration failure.

In a safety-critical industrial control system, an invalid payload reaching the
recipe executor or digital twin can translate directly into an unsafe control
action or missed interlock check. Schema validation cannot be optional.

Additionally, the system must provide:

- **TypeScript type safety** at compile time for all data structures.
- **Runtime validation** for data arriving from external sources (PLCs, MQTT,
  WMS/WCS integrations).
- **Shared contracts** accessible from both Node.js backend services and the
  Next.js frontend without duplication.
- **Cross-language compatibility** for potential future Go or Python edge
  adapters.

## Decision

**Schema definition library:** [Zod](https://zod.dev/) as the single canonical
schema definition and runtime validation tool for all TypeScript-bound data
structures.

- Zod schemas are TypeScript-first: type inference produces exact static types
  from the schema definition, eliminating type drift between schema and code.
- Runtime parsing (`schema.parse(input)`) throws `ZodError` with structured
  error detail on validation failure.
- Integration with [React Hook Form](https://react-hook-form.com/) via
  `@hookform/resolvers/zod` for UI form validation from the same schemas.

**Cross-language contracts:** Zod schemas are exported as JSON Schema (via
`zod-to-json-schema`) for use in documentation, OpenAPI generation, and
potential future non-TypeScript consumers.

**Canonical package:** `@neurologix/schemas` (`packages/schemas/`) is the
single source of truth for all domain contracts. No service may define its own
domain schema that duplicates one in `packages/schemas`.

**Schema modules:**

| Module | Contents |
|---|---|
| `telemetry` | Tag values, ingestion payloads, aggregated readings |
| `recipes` | Recipe definitions, step schemas, execution events |
| `audit` | Audit log entry, control action, policy decision records |
| `assets` | Equipment, site, zone, and inventory asset models |
| `api` | API request/response envelopes, standard error schema |
| `broker` | Kafka message envelopes, topic payloads, routing keys |
| `sparkplug` | MQTT Sparkplug B birth/data/death payload schemas |
| `federation` | Multi-site federation messages and site registry contracts |
| `feature-flags` | Feature flag evaluation results and configuration |
| `intents` | ASR intent schemas for voice command dispatch |

**Versioning policy:** Schemas are versioned with the package (SemVer). Breaking
field changes increment the major version. All consumers must update on major
version change; no silent drift permitted.

**Validation boundaries:** External inputs (MQTT payloads, WMS responses, HTTP
request bodies) must be validated with `schema.parse()` at the service boundary
before entering any internal processing. Schema validation failures are logged
as audit events.

## Rationale

Zod was selected over alternatives because:

1. TypeScript-first inference eliminates the synchronisation gap between schema
   definition and type annotation.
2. A single schema definition serves compile-time types, runtime validation, and
   form validation — no per-layer adapter code.
3. The `zod-to-json-schema` bridge provides cross-language contract artefacts
   with zero additional maintenance.
4. Zod 3.x has no runtime dependencies, minimising supply chain risk.

Centralising contracts in a single package enforces a single source of truth
across the monorepo and makes breaking changes visible at compile time via
TypeScript.

## Consequences

**Benefits:**
- Type drift between services is a compile error, not a production incident.
- A single schema change in `packages/schemas` updates types and validation
  everywhere simultaneously.
- JSON Schema exports enable automatic OpenAPI spec generation and
  documentation tooling integration.

**Trade-offs and risks:**
- Every consumer of `packages/schemas` must update when breaking schema changes
  are released; requires discipline in versioning communications.
- Zod's `safeParse` vs `parse` API must be used consistently; `parse` throws,
  `safeParse` returns a discriminated union; mixing patterns creates
  inconsistent error handling.
- Very large nested schemas can produce verbose TypeScript error messages; this
  is a DX (developer experience) issue, not a runtime risk.

**Conventions required:**
- All schemas exported from `packages/schemas` must include a JSDoc description.
- `safeParse` is preferred at service boundaries; failures must be logged.
- `parse` is acceptable inside validated boundaries where failure is always a
  programming error.
- Schema tests in `*.test.ts` files co-located with each schema module.

## Alternatives Considered

| Alternative | Reason rejected |
|---|---|
| io-ts | More verbose type syntax; steeper learning curve; lower community adoption |
| AJV + JSON Schema only | No TypeScript inference from schema; requires separate type annotations |
| class-validator + class-transformer | Decorator-based; increases class overhead; not compatible with functional patterns |
| Joi | JavaScript runtime library without TypeScript inference; validation and types are decoupled |
| Protobuf (all messages) | Cross-language strength, but excessive overhead for intra-TypeScript calls; Sparkplug B already uses Protobuf for edge |

## References

- [Zod Documentation](https://zod.dev/)
- [zod-to-json-schema](https://github.com/StefanTerdell/zod-to-json-schema)
- [packages/schemas source](../../packages/schemas/src/)
- [ADR-005: Message Broker Selection](./ADR-005-message-broker-selection.md)
- [ADR-002: TypeScript and Build System](./ADR-002-typescript-build-system.md)
