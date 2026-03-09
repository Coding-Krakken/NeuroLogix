# Copilot Instructions - <APPLICATION_NAME>

> **Auto-generated from:** `.github/.system-state/copilot/*.{yaml,md}`  
> **Last Updated:** <YYYY-MM-DD>  
> **Status:** Phase 0 - Copilot Model (IN PROGRESS)

---

## 🎯 Project Overview

**Project:** <APPLICATION_NAME> Modernization  
**Risk Tier:** <RISK_TIER>  
**Business Domain:** <BUSINESS_DOMAIN>

### Current State

- **Platform:** <CURRENT_PLATFORM>
- **Products/Scope:** <CURRENT_SCOPE>
- **Baseline KPI:** <BASELINE_METRIC>
- **Primary Region:** <DEPLOYMENT_REGION>

### Target State

- **Architecture:** Headless/Modular (<WEB_FRAMEWORK> + <PAYMENT_PROVIDER> APIs)
- **Performance:** Core Web Vitals targets defined in
  `.github/.system-state/perf/budgets.yaml`
- **Conversion/Outcome Goal:** <TARGET_OUTCOME>
- **Business Goal:** <TARGET_BUSINESS_METRIC>

---

## 🚨 Critical Constraints (Non-Negotiable)

1. **PRESERVE ALL CRITICAL INTEGRATIONS** — Payments, inventory, fulfillment,
   and customer operations must remain functional
2. **ZERO-DOWNTIME MIGRATION** — Gradual rollout with rollback <5 minutes
3. **COMPLIANCE BOUNDARY ENFORCEMENT** — Sensitive payment data remains
   delegated to `<PAYMENT_PROVIDER>`
4. **MODEL-FIRST WORKFLOW** — NO implementation before required models exist and
   validate

---

## 📋 Development Model: STRICT MODEL-FIRST

### Phase Sequence

```
✅ Phase -1: Meta-Reasoning
🔄 Phase 0:  Copilot Model
⏳ Phase 1:  System State Model
⏳ Phase 2:  Delivery Model
⏳ Phase 3:  Contracts Model
⏳ Phase 4:  Data Model
⏳ Phase 5:  Security Model
⏳ Phase 6:  Resilience Model
⏳ Phase 7:  Observability Model
⏳ Phase 8:  Test Traceability Model
⏳ Phase 9:  Performance Budgets
⏳ Phase 10: Dependency Governance
⏳ Phase 11: CI/CD Pipeline Model
⏳ Phase 12: Roadmap Model
⏳ Phase 13: IMPLEMENTATION
```

### Transition Gate: Model → Implementation

**Required before ANY code:**

- ✅ All models created and validated
- ✅ Architecture and security reviews complete
- ✅ Contracts, invariants, and failure modes defined
- ✅ Test strategy and traceability approved

---

## 🎨 Canonical Patterns (SINGLE PATTERN ONLY)

### Technology Stack

- **Framework:** <WEB_FRAMEWORK>
- **UI Components:** <UI_COMPONENT_LIBRARY>
- **Client State:** <CLIENT_STATE_LIBRARY>
- **Server State:** <SERVER_STATE_LIBRARY>
- **Forms:** <FORM_LIBRARY> + <VALIDATION_LIBRARY>
- **Styling:** <STYLING_SYSTEM>
- **Backend:** <BACKEND_PLATFORM>
- **Deployment:** <DEPLOYMENT_PLATFORM>
- **Monitoring:** <OBSERVABILITY_PLATFORM>

### Single Canonical Patterns

- One component pattern
- One API route pattern
- One state management pattern
- One form handling pattern
- One failure/error handling pattern

---

## 📊 Complexity Budget

- Track complexity points by work item and phase
- Alert at 10% over budget
- Require remediation if test coverage or build-time constraints regress

---

## 🔒 Entropy Limits (Determinism Enforcement)

### Dependency Additions

- Max 10 new dependencies per phase
- Require justification, alternatives, license review

### Abstraction Additions

- Max 5 new abstractions per phase
- Reuse before create; delete before add

### Pattern Variations

- Allowed component patterns: 1
- Allowed API patterns: 1
- Allowed state patterns: 1

### File Organization

- Follow framework conventions
- Colocate related files
- Separate concerns
- Max file length: 300 lines

---

## 🧩 AMM-OS Compliance

- Single-tenant now, multi-tenant ready
- Data layer includes `tenant_id`
- Config UI and feature flags required
- Observability includes logs, errors, SLO dashboards, alerting, runbooks

---

## 📦 Documentation Requirements

### `.customer/` Packet

- `README.md`, `SETUP.md`, `ACCOUNTS.md`, `BILLING.md`, `OPERATIONS.md`,
  `FAQ.md`, `TODO.md`, `CHANGELOG.md`, `SECURITY.md`

### `.github/.developer/` Packet

- `README.md`, `TODO.md`, `ARCHITECTURE.md`, `DECISIONS/`, `RUNBOOKS/`,
  `RELEASE.md`, `INCIDENTS.md`, `SECURITY_INTERNAL.md`

### `.github/.system-state/` Canonical Models

- `meta/`, `copilot/`, `model/`, `delivery/`, `contracts/`, `data/`,
  `security/`, `resilience/`, `ops/`, `perf/`, `deps/`, `ci/`, `roadmap/`

---

## 🎯 Model Rendering Rules

- Models are source-of-truth
- Code drift means code is wrong
- Update model first if decision changes

---

## ✅ Validation Checklist

### Before Code

- Domain entities defined
- State machine complete
- Invariants specified
- Failure/security boundaries defined
- Contracts, tests, budgets, and SLOs documented

### During Implementation

- Lint, format, typecheck, build pass
- Coverage meets threshold
- Security and dependency scans pass
- No secrets, no PII logging, no model drift

### Before Merge / Deploy

- CI green
- Docs updated
- Rollback plan validated
- Staged rollout and alerting configured

---

## 🔄 Rollback Strategy

- Rollback target: `<ROLLBACK_TARGET_PLATFORM>`
- Trigger: elevated error rate, checkout failure, latency SLO breach, critical
  incidents
- Time-to-rollback target: <5 minutes

---

## 📈 Success Metrics & SLOs

- Define Core Web Vitals, business conversion, and technical SLO targets in
  model files
- Enforce performance and accessibility budgets in CI

---

## 🔐 Security Constraints

- Payment card handling delegated to `<PAYMENT_PROVIDER>`
- Secrets via environment variables only
- No credentials in source control
- Security scanning required in CI

---

## 🧪 CI/CD Requirements

- Required checks: lint, format, typecheck, tests, build, secrets scan,
  dependency scan
- Optional gates by risk tier: e2e, performance budgets, security deep scan

---

## 🚀 Next Action

**Current Phase:** Phase 0 - Copilot Model  
**Next Phase:** Phase 1 - System State Model

Create `.github/.system-state/model/system_state_model.yaml` with domain
entities, state machine, invariants, security boundaries, and
tenant/config/feature-flag extensions.

---

## 🏢 Engineering Organization (Copilot Agents)

Use the Core-3 operating model by default:

- `00-chief-of-staff` (entry + router)
- `11-tech-lead` (implementation)
- `99-quality-director` (independent assurance; only chain closer)

Specialists are invoked by policy triggers (security, compliance, incident,
data, legal, performance).

### Dispatch Format

Use GitHub-native handoffs (Issue/PR comment URL + context pack) with
`code chat -m <agent-id>` and at least two relevant auxiliary artifacts.

### Quality Gates

Use `.github/QUALITY-GATES.md` for gate definitions and pass criteria.

---

## Governance

- `.github/GIT_WORKFLOW.md` — Git/GitHub project workflows
- `.github/SECURITY.md` — security policy
- `.github/RUNBOOK.md` — operational runbooks
- `.github/DECISIONS.md` — ADR index

---

**When in doubt prioritize:** model-first, determinism, rollback safety, and
traceability.
