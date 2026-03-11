# ADR-002: TypeScript and Build System

## Status

Accepted

## Context

NeuroLogix is a mission-critical, multi-service industrial control system built
across many packages and applications. The engineering team needed to select a
language, type-checking approach, build toolchain, and quality-enforcement stack
that would:

- Eliminate entire classes of runtime errors in safety-critical control paths.
- Support a monorepo with shared libraries, multiple applications, and
  microservices.
- Enable fast, incremental builds and parallel test execution.
- Enforce consistent code style and linting across all contributors.
- Be maintainable at Microsoft-grade scale over a multi-year roadmap.

Early prototype work confirmed that the risk tier (T1 — Mission-Critical) and
compliance requirements (IEC 62443, ISO 27001) demanded the strongest practical
type safety available in the JavaScript/Node.js ecosystem.

## Decision

**Language:** TypeScript 5.3.2+ with strict mode enabled
(`"strict": true, "noUncheckedIndexedAccess": true,
"exactOptionalPropertyTypes": true`) across all packages.

**Monorepo tool:** [Turborepo](https://turbo.build/) for task orchestration,
incremental caching, and parallel execution across workspaces.

**Package manager:** npm workspaces (monorepo-native, zero config overhead).

**Test framework:** [Vitest](https://vitest.dev/) — ESM-native, TypeScript-first,
fast unit and integration test runner with built-in coverage via V8.

**Linting:** ESLint with `@typescript-eslint` ruleset, enforcing type-aware
rules.

**Formatting:** Prettier with a single shared config for uniform diffs.

**Git hooks:** Husky + lint-staged for pre-commit quality gates;
commitlint + conventional-commits for structured commit history.

**Build output:** `tsc --build` per package, targeting ES2022 modules for Node
20+ compatibility.

## Rationale

| Requirement | How this decision satisfies it |
|---|---|
| Safety-critical correctness | TypeScript strict mode eliminates implicit `any`, unchecked index access, and optional property ambiguities |
| Monorepo scale | Turborepo's remote cache and parallel task graph reduce CI time as the codebase grows |
| Developer velocity | Vitest is 10–20× faster than Jest on this codebase's test suite due to native ESM and Vite transforms |
| Consistent quality gates | Husky + lint-staged block malformed commits before they enter the repository |
| Audit trail for code changes | Conventional commit enforcement enables automated changelogs and release traceability |

TypeScript was chosen over plain JavaScript for its compile-time guarantees
and IDE support. Python or Go were considered for service-layer work but
rejected in favour of a single-language monorepo to reduce cognitive overhead
and share type definitions between edge adapters and the UI.

## Consequences

**Benefits:**
- Type errors in control-path code are caught at compile time, not in
  production.
- Shared schemas in `packages/schemas` can be used directly in both frontend
  (Next.js) and backend (Node services) without conversion.
- Turborepo caching delivers sub-30-second CI iteration cycles on warm caches.

**Trade-offs and risks:**
- TypeScript strict mode has a steeper learning curve; onboarding requires
  explicit guidance.
- Turborepo remote cache requires cache backend configuration for CI; misconfiguration
  degrades to cold builds.
- `noUncheckedIndexedAccess` can produce verbose null-checking code in inner
  loops; must be accepted as the correctness cost.

**Impact on team:**
- All new packages must include a `tsconfig.json` that extends the root strict
  config.
- Test files must use `.test.ts` extension and be co-located with source
  (`*.test.ts` or `__tests__/`).
- Pre-commit hooks prevent merging unformatted or unlinted code.

## Alternatives Considered

| Alternative | Reason rejected |
|---|---|
| Plain JavaScript + JSDoc types | Insufficient type coverage for safety-critical paths; no compile-time guarantees |
| Nx monorepo tool | Turborepo offered simpler config and faster adoption; Nx overhead not justified at current scale |
| Jest for testing | Slower than Vitest on this configuration; no native ESM without additional transform config |
| Yarn workspaces | npm workspaces sufficient; Yarn adds lock-file format divergence without structural benefit |

## References

- [TypeScript Handbook — Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Vitest Documentation](https://vitest.dev/guide/)
- [NeuroLogix root tsconfig.json](../../tsconfig.json)
- [NeuroLogix turbo.json](../../turbo.json)
- [ADR-001: Monorepo Structure](./ADR-001-monorepo-structure.md)
