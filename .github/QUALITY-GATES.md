# Quality Gates

> **Version:** 1.0.0 | **Updated:** 2026-02-25 **Standard:**
> Microsoft/NASA/Google Engineering Grade

---

## Gate Overview

Every change must pass through a series of quality gates before reaching
production. Gates are **non-negotiable** — no bypass without Chief of Staff +
Quality Director joint approval with documented ADR.

```
Code → [G1: Lint] → [G2: Format] → [G3: Type] → [G4: Test] → [G5: Build]
  → [G6: Security] → [G7: Docs] → [G8: PR] → [G9: Perf] → [G10: Ship]
```

### Risk-Based Gate Profiles

To improve delivery speed while preserving control, gate execution is
profile-driven by deterministic risk classification.

| Profile    | Risk          | Gate Behavior                                                                                                                        |
| ---------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `fast`     | Low           | Runs core correctness/security/traceability checks, skips non-critical latency-heavy checks (e.g., format/build/docs/perf prechecks) |
| `balanced` | Medium        | Runs full standard gate stack except strict-only escalations                                                                         |
| `strict`   | High/Critical | Runs full gate stack with strict enforcement behavior                                                                                |

**Non-bypass controls in all profiles:** traceability, deterministic routing,
and security gating remain mandatory.

### Core-3 Segregation of Duties (Mandatory)

- **Orchestrator** owns intake/routing/planning and cannot self-approve
  high/critical delivery outcomes.
- **Implementer** owns changes, tests, docs, and remediation execution.
- **Assurance** performs independent validation and is the only role that can
  finalize high/critical ship decisions.
- For high/critical risk, Implementer and Assurance must map to distinct
  approver identities.

### Path-Aware Gate Execution

To reduce unnecessary CI latency, implementation gates that operate on
`.github/framework/**` run only when framework code is changed in the PR.

- Always-on: deterministic routing, policy conformance, model completeness
  (phased), framework boundary enforcement, governance report.
- Path-aware: lint, format, typecheck, test, build, dependency audit for
  framework runtime.

This preserves governance and traceability while eliminating non-value waiting
time for unrelated product/docs changes.

### Two-Loop Operating Model

- **Creative loop (agents):** planning, implementation, remediation decisions,
  and stakeholder-level tradeoffs.
- **Verification loop (automation-first):** deterministic checks, compact
  failure bundle generation, and owner-agent recommendation.

Automation policy:

- Deterministic/non-creative tasks run in the verification loop by default.
- Agents consume verification bundles and focus on diagnosis/remediation instead
  of repeating mechanical checks.

### Runaway Loop Safeguards

1. **Idempotency by commit SHA:** verification loop processes each head SHA
   once.
2. **Retry budget:** maximum 3 verification attempts per PR before blocking
   escalation.
3. **Escalation on exhaustion:** unresolved verification state escalates to
   `99-quality-director` with blocking label.
4. **Coupled completion rule:**

- Creative loop cannot complete while verification status is `ACTION_REQUIRED`
  or `BLOCKED`.
- Verification loop cannot declare `COMPLETE` unless creative-loop governance
  checks for that SHA pass.

5. **Sync gate enforcement:** a dedicated coupling gate must be green before
   merge.
6. **Triage SLA:** `verification-blocked` issues require owner assignment within
   4 hours.

### Verification Telemetry and KPI Automation

- `verification-mesh` generates compact failure bundles and owner-agent
  recommendations.
- `verification-blocked-sla` enforces blocked-issue ownership SLA and labels
  breaches.
- `scorecard-metrics-collector` posts weekly mechanical-loop and reliability
  snapshots to scorecard review issues.

---

## G1: Lint Gate

| Check             | Tool                   | Threshold            | Blocking |
| ----------------- | ---------------------- | -------------------- | -------- |
| ESLint errors     | ESLint                 | 0                    | YES      |
| ESLint warnings   | ESLint                 | 0 (--max-warnings 0) | YES      |
| JSX accessibility | eslint-plugin-jsx-a11y | 0 violations         | YES      |
| Import order      | eslint-plugin-import   | Sorted, grouped      | YES      |
| No console.log    | custom rule            | 0 in production code | YES      |
| No debugger       | ESLint                 | 0                    | YES      |

### Commands

```bash
npm run lint          # Must exit 0
npm run lint:fix      # Auto-fix then verify
```

### Failure Response

- Fix all lint errors before proceeding
- If rule seems wrong, propose ADR to change it — do not disable

---

## G2: Format Gate

| Check                | Tool                        | Threshold  | Blocking |
| -------------------- | --------------------------- | ---------- | -------- |
| Prettier conformance | Prettier                    | 100% files | YES      |
| Tailwind class order | prettier-plugin-tailwindcss | Sorted     | YES      |
| File endings         | Prettier                    | LF (Unix)  | YES      |
| Trailing whitespace  | Prettier                    | None       | YES      |

### Commands

```bash
npm run format:check  # Must exit 0
npm run format        # Auto-fix then verify
```

### Failure Response

- Run `npm run format` to auto-fix
- Format changes in separate commit if mixed with logic changes

---

## G3: Type Safety Gate

| Check               | Tool              | Threshold             | Blocking |
| ------------------- | ----------------- | --------------------- | -------- |
| TypeScript strict   | tsc --noEmit      | 0 errors              | YES      |
| No `any` types      | TypeScript strict | 0 (use `unknown`)     | YES      |
| No type assertions  | Review            | Justified + commented | YES      |
| Exhaustive switches | TypeScript        | `never` default       | YES      |

### Commands

```bash
npm run typecheck     # Must exit 0
```

### Failure Response

- Fix all type errors
- Add proper type definitions for external data
- Use Zod for runtime validation at boundaries

---

## G4: Test Gate

| Check               | Tool | Threshold         | Blocking |
| ------------------- | ---- | ----------------- | -------- |
| Unit test pass rate | Jest | 100%              | YES      |
| Line coverage       | Jest | ≥80%              | YES      |
| Branch coverage     | Jest | ≥75%              | YES      |
| Function coverage   | Jest | ≥80%              | YES      |
| Statement coverage  | Jest | ≥80%              | YES      |
| No skipped tests    | Jest | 0 `.skip` in main | YES      |
| No focused tests    | Jest | 0 `.only` in main | YES      |
| Snapshot freshness  | Jest | Updated           | YES      |

### Commands

```bash
npm test              # All tests pass
npm test -- --coverage # With coverage report
```

### Failure Response

- Fix failing tests (do not delete them)
- If test is wrong, fix the test with documented reason
- Add missing tests before adding new features
- Coverage drops require new tests in same PR

---

## G5: Build Gate

| Check            | Tool            | Threshold     | Blocking |
| ---------------- | --------------- | ------------- | -------- |
| Production build | <WEB_FRAMEWORK> | Successful    | YES      |
| Build warnings   | <WEB_FRAMEWORK> | 0 critical    | YES      |
| Bundle size      | <WEB_FRAMEWORK> | Within budget | YES      |
| Build time       | <WEB_FRAMEWORK> | <120 seconds  | WARNING  |

### Commands

```bash
npm run build         # Must exit 0
```

### Failure Response

- Fix build errors before proceeding
- Investigate bundle size regressions
- Dynamic imports for large dependencies

---

## G6: Security Gate

| Check                       | Tool                   | Threshold                                        | Blocking |
| --------------------------- | ---------------------- | ------------------------------------------------ | -------- |
| Secrets in code             | gitleaks               | 0 findings                                       | YES      |
| Dependency vulns (critical) | npm audit / Dependabot | 0                                                | YES      |
| Dependency vulns (high)     | npm audit / Dependabot | 0                                                | YES      |
| Dependency vulns (medium)   | npm audit              | Documented                                       | WARNING  |
| OWASP Top 10                | Manual review          | Addressed                                        | YES      |
| CSP headers                 | <WEB_FRAMEWORK> config | Configured                                       | YES      |
| PCI compliance              | Review                 | No card data handled                             | YES      |
| Input validation            | Zod                    | All API inputs                                   | YES      |
| XSS prevention              | React/<WEB_FRAMEWORK>  | No dangerouslySetInnerHTML without justification | YES      |

### Commands

```bash
npm audit             # Review findings
npx gitleaks detect   # Must find 0 secrets
```

### Failure Response

- Critical/High: Block PR, fix immediately
- Medium: Document in PR, create follow-up issue
- Low: Document in PR, prioritize in backlog
- Never suppress without Security Engineer approval + ADR

---

## G7: Documentation Gate

| Check           | Criterion                 | Threshold                | Blocking |
| --------------- | ------------------------- | ------------------------ | -------- |
| README current  | Manual                    | Reflects actual state    | YES      |
| API docs        | Contract match            | All endpoints documented | YES      |
| ADR exists      | For significant decisions | Complete template        | YES      |
| Changelog entry | For user-facing changes   | Present                  | YES      |
| JSDoc/TSDoc     | Public functions          | Documented               | WARNING  |
| Runbook update  | For new critical paths    | Present                  | YES      |
| Customer docs   | If customer-facing        | Updated                  | YES      |

### Failure Response

- Add missing documentation in same PR
- API docs must match implementation
- ADR required for new dependencies, patterns, or architecture changes

---

## G8: PR Completeness Gate

| Check                 | Criterion                  | Threshold                    | Blocking |
| --------------------- | -------------------------- | ---------------------------- | -------- |
| PR title              | Conventional commit format | Compliant                    | YES      |
| PR description        | Template filled            | Complete                     | YES      |
| Linked issue          | Issue or ADR reference     | Present                      | YES      |
| Handoff context       | Context snapshot reference | Required in handoff comments | YES      |
| All CI green          | All automated checks       | Passing                      | YES      |
| Review approval       | Qualified reviewer         | ≥1 approval                  | YES      |
| No unresolved threads | All conversations          | Resolved                     | YES      |
| No TODO/FIXME         | Without linked issue       | 0 orphaned                   | YES      |
| PR size               | Lines changed              | <500 (warning >200)          | WARNING  |
| Commits               | Clean history              | Squash or clean rebase       | YES      |

**Automation Enforcement:** `.github/workflows/handoff-context-gate.yml` fails
handoff/dispatch comments that do not include a context snapshot reference.

### Failure Response

- Fill out PR template completely
- Link to issue or create one
- Resolve all review conversations
- Split large PRs into smaller ones

---

## G9: Performance Gate

| Check                    | Tool             | Threshold     | Blocking          |
| ------------------------ | ---------------- | ------------- | ----------------- |
| LCP                      | Lighthouse       | <1.2s         | YES (pre-release) |
| FID/INP                  | Lighthouse       | <10ms         | YES (pre-release) |
| CLS                      | Lighthouse       | <0.05         | YES (pre-release) |
| Lighthouse Performance   | Lighthouse CI    | ≥90           | YES (pre-release) |
| Lighthouse Accessibility | Lighthouse CI    | ≥95           | YES (pre-release) |
| Lighthouse SEO           | Lighthouse CI    | ≥95           | WARNING           |
| First Load JS            | Bundle analysis  | <100KB        | WARNING           |
| Time to Interactive      | Lighthouse       | <2.0s         | WARNING           |
| Memory leaks             | Manual/automated | None detected | YES               |

### Failure Response

- Profile and identify bottleneck
- Optimize critical rendering path
- Lazy load non-critical resources
- Document performance trade-offs in ADR

---

## G10: Ship Gate (Risk-Based Authority)

| Check                | Criterion             | Threshold        | Blocking |
| -------------------- | --------------------- | ---------------- | -------- |
| All gates passed     | G1-G9                 | All green        | YES      |
| Acceptance criteria  | Product Owner defined | All met          | YES      |
| Model compliance     | Models match code     | No drift         | YES      |
| Rollback plan        | Documented            | Present + tested | YES      |
| Monitoring ready     | Sentry + Analytics    | Configured       | YES      |
| Feature flags        | If gradual rollout    | Configured       | YES      |
| Stakeholder sign-off | If business-critical  | Approved         | YES      |

### Failure Response

- Return to appropriate agent for remediation
- Document blockers and communicate ETA
- Quality Director has VETO authority on any release, and is the required ship
  authority for high/critical risk changes

---

## Gate Bypass Protocol

**Bypasses are EXCEPTIONAL and require:**

1. Joint approval: Chief of Staff + Quality Director
2. Written ADR documenting:
   - What gate is bypassed
   - Why it cannot be met
   - Risk assessment
   - Remediation timeline
   - Monitoring plan
3. Automatic follow-up issue created
4. Bypass expires after 5 business days

**Gates that CANNOT be bypassed:**

- G6 Security (critical/high vulnerabilities)
- G10 Ship (Quality Director veto)

---

## Gate Metrics Dashboard

Track these metrics over time:

| Metric                | Target           | Alert      |
| --------------------- | ---------------- | ---------- |
| Gate pass rate        | >95%             | <90%       |
| Average time in gates | <30 min          | >60 min    |
| Bypass frequency      | <5% of PRs       | >10%       |
| Test flakiness        | <1%              | >5%        |
| Build reliability     | >99%             | <95%       |
| Security finding rate | Decreasing trend | Increasing |
