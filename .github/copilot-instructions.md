# Copilot Instructions - NeuroLogix

> **Auto-generated from:** `.github/.system-state/copilot/*.{yaml,md}`  
> **Last Updated:** March 10, 2026  
> **Status:** Phase 1 - Data Spine & Contracts (ACTIVE)

---

## 🎯 Project Overview

**Project:** NeuroLogix — Enterprise-Grade AI-Powered Industrial Control System  
**Risk Tier:** T1 (Mission-Critical)  
**Business Domain:** Industrial Control Systems / Warehouse & Industrial Automation

### Current State

- **Monorepo:** Turborepo (TypeScript 5.3.2+, Node.js 20.10.0+)
- **Phase 0 Foundations:** Complete — ESLint, Prettier, Husky, commitlint, Vitest wired
- **Phase 2 Core Runtime:** Complete — `capability-registry`, `policy-engine`, `recipe-executor`, `digital-twin`
- **Phase 6 Mission Control UI:** Foundation shipped — command-center, line-view, SSE stream, accessibility baseline
- **Active gaps:** CI/CD pipelines, observability stack, security hardening, ADR backlog, doc alignment

### Target State

- **Architecture:** Multi-site federated AI-ICS platform — edge-to-cloud, safety-first, fully auditable
- **Performance:** Control loop p95 <50ms, tag throughput 10,000+/s, system availability >99.99%
- **Compliance:** IEC 62443 / ISA-95 / ISO 27001 / NIST CSF — fully aligned
- **Reach:** Multi-site federation (Phase 9) with white-label/franchise capability

---

## 🚨 Critical Constraints (Non-Negotiable)

1. **SAFETY-FIRST** — AI never bypasses PLC interlocks; all control flows through validated recipes with explicit safety checks
2. **ZERO SAFETY COMPROMISE** — Safety-critical code paths require an explicit safety review; no shortcuts under deadline pressure
3. **IEC 62443 / ISO 27001 COMPLIANCE** — Industrial cybersecurity and information security standards are non-optional
4. **MODEL-FIRST WORKFLOW** — NO CODE before corresponding models exist and validate; code drift means code is wrong
5. **COMPLETE AUDIT TRAIL** — Every control action, recipe execution, and policy decision must be logged immutably
6. **AUTONOMOUS CONTINUITY** — Agents should continue execution using repository evidence and constraints without unnecessary gating; framework-specific handoff/orchestration rules are defined separately

---

## 📋 Development Model: STRICT MODEL-FIRST

### Phase Sequence (Current: Phase 1)

```
✅ Phase -1: Meta-Reasoning (COMPLETE)
✅ Phase 0:  Copilot Model (COMPLETE — this file)
🔄 Phase 1:  System State Model (ACTIVE)
⏳ Phase 2:  Delivery Model
⏳ Phase 3:  Contracts Model (API schemas, event schemas)
⏳ Phase 4:  Data Model (schemas, caching, persistence)
⏳ Phase 5:  Security Model (threat model, RBAC, auth boundaries)
⏳ Phase 6:  Resilience Model (failure modes, retry, circuit breakers)
⏳ Phase 7:  Observability Model (metrics, SLOs, alerts, runbooks)
⏳ Phase 8:  Test Traceability Model
⏳ Phase 9:  Performance Budgets
⏳ Phase 10: Dependency Governance
⏳ Phase 11: CI/CD Pipeline Model
⏳ Phase 12: Roadmap Model
⏳ Phase 13: IMPLEMENTATION (ONLY AFTER ALL MODELS COMPLETE)
```

> **Note:** Phases 0, 2, and partial Phase 6 of the _delivery_ roadmap
> (capability-registry, policy-engine, recipe-executor, digital-twin, mission-control UI shell)
> were bootstrapped prior to full model completion.
> All new delivery work must follow the model-first gate below.

### Transition Gate: Model → Implementation

**Required before ANY code:**

- ✅ All models created and validated
- ✅ Architectural review complete
- ✅ Security review complete
- ✅ Test strategy approved
- ✅ Models are consistent (no undefined states/unmodeled failures)
- ✅ All invariants specified
- ✅ All contracts defined

---

## 🎨 Canonical Patterns (SINGLE PATTERN ONLY)

### Technology Stack

- **Monorepo:** Turborepo (TypeScript 5.3.2+ strict, Node.js 20.10.0+)
- **UI Framework:** Next.js 14 (App Router) — Mission Control (`apps/mission-control`)
- **UI State:** Zustand (client) + React Query / TanStack Query (server)
- **Forms / Validation:** React Hook Form + Zod
- **Styling:** Tailwind CSS + CSS Modules
- **Testing:** Vitest (unit/integration, ≥90% coverage core modules) + Playwright (E2E)
- **Containerisation:** Docker + Kubernetes + Helm
- **Infrastructure:** Terraform (IaC)
- **Messaging:** MQTT Sparkplug + Kafka
- **Protocol Adapters:** OPC UA, MQTT
- **Policy Engine:** OPA / Rego
- **Observability:** Prometheus + Grafana + OpenTelemetry + Jaeger + ELK Stack
- **Security:** IEC 62443 / ISO 27001 / NIST CSF, zero-trust, mTLS, RBAC/ABAC, SBOM
- **Deployment:** Kubernetes/Helm (production) · Docker Compose (development)
- **CI/CD:** GitHub Actions → Docker registry → Helm rollout

### Single Canonical Patterns (NO VARIATIONS)

- **Component pattern:** One pattern for all UI components (Next.js App Router + Tailwind)
- **Service pattern:** One pattern for all backend services (typed handlers, Zod-validated I/O)
- **API route pattern:** One pattern for all REST/SSE endpoints
- **State management:** One approach (Zustand + React Query)
- **Form handling:** One pattern (React Hook Form + Zod)
- **Error handling:** One pattern (matches failure model)
- **Audit logging:** One pattern (structured JSON → ELK, immutable, correlated trace IDs)

---

## 📊 Complexity Budget

**Total:** 660 complexity points allocated across 9 delivery phases

| Phase | Budget | Description                                                       |
| ----- | ------ | ----------------------------------------------------------------- |
| 1     | 80 pts | Data Spine & Contracts (schemas, Kafka/MQTT, contract tests)      |
| 2     | 80 pts | Core Runtime (✅ done — capability-registry, policy, recipe, twin) |
| 3     | 70 pts | Edge & Adapters (OPC UA, MQTT Sparkplug, simulator)               |
| 4     | 90 pts | AI Services (ASR/NLU, computer vision, optimisers)                |
| 5     | 60 pts | WMS/WCS Integration (connectors, dispatch service)                |
| 6     | 80 pts | Mission Control UI (command-center, line-view, config studio)     |
| 7     | 70 pts | Security & Compliance (IEC 62443, mTLS, audit trail)              |
| 8     | 60 pts | Testing & Validation (E2E, perf benchmarks, chaos engineering)    |
| 9     | 70 pts | Multi-Site Federation (site templates, federation arch, rollout)  |

**Current Spend:** Phase 2 complete (~80 pts), partial Phase 6 (~20 pts)

### Complexity Tracking Rules

- Track by work item
- Alert when budget exceeded
- Require justification if >10% over budget
- Complexity reduction required if:
  - Budget exceeded by 10%+
  - Test coverage drops below 80%
  - Build time exceeds 120 seconds

---

## 🔒 Entropy Limits (Determinism Enforcement)

### Dependency Additions

- **Max:** 10 new dependencies per phase
- **Required:** Justification, alternatives considered, license review
- **Prefer:** Managed services over self-hosted, proven over novel

### Abstraction Additions

- **Max:** 5 new abstractions per phase
- **Rule:** Reuse before create, delete before add
- **Avoid:** Speculative abstractions

### Pattern Variations

- **Allowed component patterns:** 1
- **Allowed API patterns:** 1
- **Allowed state patterns:** 1

### File Organization

- Follow Next.js conventions
- Colocate related files
- Separate concerns
- **Max file length:** 300 lines

### Diff Minimization

- Avoid unrelated changes
- Single responsibility per PR
- Formatting changes in separate PR
- Preserve import order
- Minimal renaming (separate PR if extensive)

---

## 🧩 AMM-OS Compliance (Architecture Modernization Methodology)

### Multi-Tenant Architecture

- **Status:** Single site, multi-site ready
- **Design:** Data layer includes `site_id` / `tenant_id` field (currently one site)
- **Future:** Supports multi-site federation (Phase 9) with site-template provisioning

### Configuration UI (Required)

- Site settings (line layouts, equipment topology)
- Recipe library management
- Policy rule editor
- Alert threshold configuration
- Feature flags per site

### Feature Flags (Required)

- **Provider:** Environment config / LaunchDarkly
- **Use Cases:**
  - Gradual rollout of AI features (10% → 25% → 50% → 100%)
  - A/B testing operator UI layouts
  - Beta AI model versions
  - Emergency killswitch for autonomous control

### Observability (T1 Tier)

- **Structured Logging:** Pino (JSON, ELK-compatible)
- **Error Tracking:** Sentry + OpsGenie
- **Metrics:** Prometheus + Grafana
- **Distributed Tracing:** OpenTelemetry + Jaeger
- **SLO Tracking:**
  - System availability >99.99%
  - Control loop p95 <50ms
  - Audit log write success 100%
  - Safety interlock bypass events: 0
- **Alerting:** PagerDuty / OpsGenie
- **Runbooks:** Required for every critical control path

---

## 📦 Documentation Requirements

### .customer/ Packet (Customer-Facing)

**Location:** `.customer/`  
**Update:** Per PR if customer-facing changes

**Required Files:**

- `README.md` - Overview for end users
- `SETUP.md` - Initial setup guide
- `ACCOUNTS.md` - Account management
- `BILLING.md` - Billing information
- `OPERATIONS.md` - Day-to-day operations
- `FAQ.md` - Frequently asked questions
- `TODO.md` - Customer-visible roadmap
- `CHANGELOG.md` - User-facing changes
- `SECURITY.md` - Security contact/policies

### .developer/ Packet (Internal)

**Location:** `.developer/`  
**Update:** Per PR (always)

**Required Files:**

- `README.md` - Developer onboarding
- `TODO.md` - Technical backlog
- `ARCHITECTURE.md` - System architecture
- `DECISIONS/` - Architecture Decision Records (ADRs)
- `RUNBOOKS/` - Operational runbooks
- `RELEASE.md` - Release process
- `INCIDENTS.md` - Incident log
- `SECURITY_INTERNAL.md` - Internal security documentation

### .system-state/ (Canonical Models)

**Location:** `.github/.system-state/`  
**Purpose:** Source of truth for all architecture decisions

**Model Files:**

- `meta/meta_reasoning.yaml` - Classification, risk, complexity
- `copilot/*.{yaml,md}` - This instruction set
- `model/system_state_model.yaml` - Domain model, state machine, invariants
- `delivery/delivery_state_model.yaml` - Project management, work items
- `contracts/*.yaml` - API schemas, event schemas, error schemas
- `data/data_state_model.yaml` - Data schemas, caching, persistence
- `security/*.yaml` - Threat model, RBAC, auth boundaries
- `resilience/failure_modes.yaml` - Failure modes, retry policies, circuit breakers
- `ops/*.yaml` - Metrics, SLOs, alerts, runbooks
- `perf/budgets.yaml` - Performance budgets, load profiles
- `deps/dependency_policy.yaml` - Dependency management
- `ci/pipeline_model.yaml` - CI/CD stages, gates
- `roadmap/roadmap_model.yaml` - Prioritization, next actions

---

## 🎯 Model Rendering Rules

### Models → Code Generation

#### System State Model → TypeScript Types

```yaml
# .github/.system-state/model/system_state_model.yaml
domain_entity:
  name: RecipeExecution
  fields:
    - id: string
    - recipeId: string
    - siteId: string
    - status: RecipeStatus
    - startedAt: string
    - completedAt: string | null
```

↓

```typescript
// packages/schemas/src/recipe.ts
export interface RecipeExecution {
  id: string;
  recipeId: string;
  siteId: string;
  status: RecipeStatus;
  startedAt: string;
  completedAt: string | null;
}
```

#### API Contracts → API Routes

```yaml
# .github/.system-state/contracts/api.yaml
endpoint:
  path: /api/capabilities
  method: GET
  response_schema: CapabilityDescriptor[]
```

↓

```typescript
// apps/mission-control/src/app/api/capabilities/route.ts
import { NextResponse } from 'next/server';
import { CapabilityDescriptor } from '@neurologix/schemas';

export async function GET() {
  const capabilities: CapabilityDescriptor[] = await fetchCapabilities();
  return NextResponse.json(capabilities);
}
```

#### State Machine → State Management

- Each state → TypeScript enum value
- Each transition → state update function
- Each guard → validation function
- Invariants → runtime assertions (dev mode)

### Models → Documentation

#### System State Model → Architecture Docs

- Domain entities → "Domain Model" section
- State machine → Mermaid state diagram
- Invariants → "System Invariants" section
- Security boundaries → "Security Architecture"
- AMM-OS extensions → "Multi-Tenancy" and "Configuration"

#### Failure Model → Runbooks

- Each failure mode → separate runbook
- Detection → "Symptoms" section
- Mitigation → "Resolution Steps" (numbered)
- Prevention → "Prevention" section

### Code Drift = Code is WRONG

**Rule:** If code drifts from model, model is RIGHT, code is WRONG.

**Fix Process:**

1. Identify drift via validation
2. Fix code to match model
3. If model is actually wrong, update model FIRST, then code

---

## ✅ Validation Checklist

### Before Any Code (Model Phase)

- [ ] All domain entities defined
- [ ] State machine complete (states, transitions, guards)
- [ ] All invariants specified
- [ ] Failure modes identified
- [ ] Security boundaries defined
- [ ] AMM-OS extensions included
- [ ] API contracts defined (request/response/error schemas)
- [ ] Test traceability mapped
- [ ] Performance budgets set
- [ ] SLO defined and thresholds specified
- [ ] Runbooks created for critical paths

### During Implementation (Code Phase)

- [ ] Lint passes (ESLint)
- [ ] Format passes (Prettier)
- [ ] Typecheck passes (TypeScript strict mode)
- [ ] Build succeeds (Next.js build)
- [ ] Tests pass (≥90% coverage core modules, ≥80% overall)
- [ ] Code structure mirrors system_state_model.yaml
- [ ] API calls match contracts model
- [ ] Error handling matches failure model
- [ ] Security implementation matches security model
- [ ] Logging matches observability model
- [ ] Single canonical pattern used
- [ ] No speculative abstractions
- [ ] Existing patterns reused
- [ ] Diff minimized (no unrelated changes)
- [ ] Stable formatting
- [ ] Dependency additions justified (<10 per phase)
- [ ] Abstraction additions justified (<5 per phase)
- [ ] Complexity budget respected
- [ ] No hardcoded secrets
- [ ] Secrets scan passed (gitleaks)
- [ ] Dependency scan passed (Dependabot)
- [ ] No PII logged
- [ ] OWASP Top 10 considered

### Before PR Merge

- [ ] CI green (all checks pass)
- [ ] Code mirrors models (validated)
- [ ] Tests trace to invariants (validated)
- [ ] Diff minimized (validated)
- [ ] Documentation updated
- [ ] .customer/ updated if customer-facing changes
- [ ] .developer/ updated
- [ ] Models updated if architecture changed
- [ ] ADR created if significant decision
- [ ] No TODOs or FIXMEs
- [ ] Performance budget met
- [ ] Accessibility checked (if UI changes)

### Before Deployment

- [ ] All tests passing (unit, integration, e2e)
- [ ] Performance budget met (Lighthouse >90)
- [ ] Security scan clean
- [ ] Rollback plan documented
- [ ] Staged rollout plan defined (10%→25%→50%→100%)
- [ ] Rollback triggers specified
- [ ] Monitoring dashboards ready
- [ ] Alerts configured
- [ ] Runbooks validated

---

## 🔄 Rollback Strategy

### Graceful Degradation

- **Strategy:** Services degrade to safe manual-override mode on failure
- **Time to safe state:** <30 seconds (safety interlock takeover)
- **Trigger:** Automated (service health check failure, error rate spike, control loop latency >200ms)
- **Data integrity:** All state changes use idempotent writes; audit log preserved across rollback
- **PLC Safety:** Hardware interlocks remain active regardless of software state

### Gradual Traffic Shift (New Feature Rollouts)

1. **10%** — Monitor for 24 hours (canary deployment)
2. **25%** — Monitor for 48 hours
3. **50%** — Monitor for 72 hours
4. **100%** — Full production

### Rollback Triggers (Automated)

- Control loop p99 latency >200ms
- Error rate >0.5%
- Recipe execution failure rate >0.1%
- Safety interlock bypass attempt detected
- Audit log write failure

### Rollback Validation

- [ ] Safe-mode fallback tested in staging
- [ ] Rollback triggers automated via Kubernetes liveness/readiness probes
- [ ] PLC interlocks verified independent of software rollback
- [ ] Audit trail preserved across rollback event
- [ ] Rollback time to safe state <30 seconds validated

---

## 📈 Success Metrics & SLOs

### Core Performance Targets (Required)

- **Control Loop Latency (p95):** <50ms
- **Control Loop Latency (p99):** <100ms
- **Tag Throughput:** 10,000+ tags/second
- **Recipe Execution Success Rate:** >99.9%

### Operational SLOs

- **System Availability:** >99.99%
- **Audit Log Write Success:** 100%
- **Safety Interlock Bypass Events:** 0
- **PLC Command Delivery (p95):** <50ms
- **Mean Time to Recovery (MTTR):** <5 minutes

### Technical SLOs

- **Service Error Rate:** <0.1%
- **SSE Stream Uptime:** >99.9%
- **Policy Decision Latency (p95):** <10ms
- **Digital Twin Sync Lag:** <200ms

### Operator Experience (Mission Control UI)

- **LCP (Largest Contentful Paint):** <1.2s
- **FID (First Input Delay):** <10ms
- **CLS (Cumulative Layout Shift):** <0.05
- **Accessibility Score (Lighthouse):** >95

### Lighthouse Scores (Mission Control)

- **Performance:** >90
- **Accessibility:** >95
- **Best Practices:** >90

---

## 🔐 Security Constraints

### Industrial Cybersecurity (IEC 62443)

- **Zero-Trust Architecture:** No implicit trust between services; every request authenticated and authorised
- **mTLS:** All inter-service communication uses mutual TLS
- **RBAC/ABAC:** Role- and attribute-based access control with zone-based policies (OPA/Rego)
- **Safety Zone Isolation:** AI services cannot directly actuate PLC outputs; must flow through validated recipe-executor
- **Supply Chain Security:** SBOM required; signed container images; Dependabot scanning enforced

### Secrets Management

- **Never hardcode:** Use environment variables or Kubernetes secrets
- **No secrets in logs:** Credentials, tokens, and certificates must not appear in any log output
- **Local development:** `.env.local` (gitignored); never commit `.env` files
- **Secrets scanning:** gitleaks in CI; fail build on detection

### Sensitive Data

- **No PII in logs:** Redact operator identities and location data where not operationally required
- **No credentials in code:** API keys, certs, and tokens via env vars / secret store only
- **Audit log integrity:** Audit records are append-only; tampering detection required
- **HTTPS / mTLS only:** Enforce in all environments above development

### Security Scanning

- **Dependencies:** Dependabot alerts
- **Code scanning:** Snyk or SonarQube
- **OWASP Top 10:** Address in security model
- **Penetration testing:** Required before Phase 7 closure

---

## 🧪 CI/CD Requirements

### Required Checks (Every PR)

- **Lint:** ESLint (no errors)
- **Format:** Prettier (enforced)
- **Typecheck:** TypeScript strict mode
- **Test:** Vitest with ≥80% coverage (≥90% core modules)
- **Build:** Turbo production build
- **Secrets Scan:** gitleaks
- **Dependency Scan:** Dependabot

### T1 Additional Checks

- **E2E Tests:** Playwright (critical operator journeys)
- **Security Scan:** Snyk or SonarQube
- **Performance Budget:** Lighthouse CI (>90 performance score, Mission Control)
- **Container Scan:** Trivy or Grype (Docker image vulnerability scan)
- **SBOM Generation:** CycloneDX on every build

### Deployment Pipeline

1. **PR:** All checks pass → merge to main
2. **Staging:** Auto-deploy via Helm to staging cluster
3. **Production:** Manual approval → canary rollout (10% → 25% → 50% → 100%)

---

## 🎓 Self-Audit Checklist (Before Completion)

### Model Integrity

- [ ] All affected models updated?
- [ ] Code mirrors models exactly?
- [ ] No model drift?

### Determinism

- [ ] Single canonical pattern used?
- [ ] No speculative abstraction?
- [ ] Existing patterns reused?

### Entropy Control

- [ ] Diff minimized?
- [ ] No unnecessary abstraction?
- [ ] Complexity budget respected?

### Governance

- [ ] Rollback preserved?
- [ ] Determinism enforced?
- [ ] Delivery state updated?
- [ ] Roadmap updated if needed?

**If ANY answer is NO, fix before proceeding.**

---

## 🚀 Next Action

**Current Phase:** Phase 1 - Data Spine & Contracts (ACTIVE)  
**Delivery Context:** Phase 2 core runtime and Phase 6 UI foundation already shipped; active work continues on Phase 1 contracts and Phase 6 enhancements

**Immediate Priorities:**

- Complete schema definitions (`packages/schemas`) — Zod + JSON Schema for all domain entities
- Wire MQTT Sparkplug + Kafka topic governance
- Establish contract testing framework (Pact or similar)
- Harden CI/CD pipelines (GitHub Actions → Docker → Helm)
- Resolve Phase 0 documentation gaps (ADR-002 through ADR-008, doc structure alignment)

**System State Model** (`packages/schemas` / `.github/.system-state/model/`):

**Must Define (or validate exists):**

- All domain entities (RecipeExecution, CapabilityDescriptor, PolicyResult, DigitalTwinState, Tag, etc.)
- State machine (states, transitions, guards, forbidden transitions) for each service
- Invariants (system-level constraints: no PLC command without validated recipe, audit every action)
- Security boundaries (trust zones: edge / core / AI / UI)
- AMM-OS extensions (site model, config hierarchy, feature flags per site)

**Do NOT bypass model-first gates** for any new delivery slice — model must precede code.

---

## 📚 References

### Source Files

- `.github/.system-state/copilot/instruction.model.yaml` - Canonical model (YAML)
- `.github/.system-state/copilot/INSTRUCTIONS.md` - Detailed instructions
- `.github/.system-state/copilot/PROMPT_SHORT.md` - Quick reference
- `.github/.system-state/copilot/RENDER_RULES.md` - Model rendering rules
- `.github/.system-state/copilot/VALIDATION.md` - Validation checklists

### External Documentation

- [Next.js 14 App Router](https://nextjs.org/docs)
- [IEC 62443 — Industrial Cybersecurity](https://www.isa.org/standards-and-publications/isa-standards/isa-standards-committees/isa62443/)
- [OPA / Rego Policy Engine](https://www.openpolicyagent.org/docs/)
- [OpenTelemetry](https://opentelemetry.io/docs/)
- [Turborepo](https://turbo.build/repo/docs)
- [Kubernetes / Helm](https://helm.sh/docs/)

---

## 🤖 Execution Modes

- **Universal baseline (this file):** Product, architecture, compliance, determinism, and model-first constraints that apply regardless of execution mode.
- **Framework mode:** See [framework/AGENT_ORCHESTRATION_INSTRUCTIONS.md](framework/AGENT_ORCHESTRATION_INSTRUCTIONS.md) for multi-agent orchestration rules, dispatch protocol, and role-specific governance.
- **Standalone autonomous mode:** Ignore framework orchestration rules unless explicitly running the multi-agent framework.

### Governance

- [GIT_WORKFLOW.md](GIT_WORKFLOW.md) — **Git/GitHub project management workflows**
- [SECURITY.md](SECURITY.md) — Security policy & IEC 62443 compliance
- [RUNBOOK.md](RUNBOOK.md) — Operational runbooks
- [DECISIONS.md](DECISIONS.md) — Architecture Decision Records
- [PR_TEMPLATE.md](PR_TEMPLATE.md) — Pull request template
- [ISSUE_TEMPLATE.md](ISSUE_TEMPLATE.md) — Issue template

---

**🤖 This file governs universal Copilot behavior for this codebase.**  
**When in doubt, prioritize: (1) Model-first, (2) Determinism, (3) Rollback safety, (4) Commit your work.**
