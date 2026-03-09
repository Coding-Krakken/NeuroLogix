# Deterministic Delivery Operating Model

## Purpose

This operating model defines a fully deterministic, policy-driven delivery system for the SubZero agentic framework. Every work item flows through explicit state machines, policy gates, approvals, and release safeguards.

## Current State Snapshot

### How agents dispatch work today

- Entry point is `00-chief-of-staff`, with file-based handoff dispatch to specialized agents via `.github/.handoffs/<agent-id>/handoff-<timestamp>.md`.
- Dispatch invocation pattern uses `code chat -m <agent-id> --add-file <repo> --add-file <handoff-file>`.
- Loop prevention already exists: dispatch depth cap, escalation, and Quality Director as final authority.

### Where state lives today

- Agent roster and routing: `.github/AGENTS.md` and `.github/agents/*.agent.md`.
- Work intent and context: GitHub Issues (`.github/ISSUE_TEMPLATE/deterministic-*.yml`), PR bodies (`.github/pull_request_template.md`).
- Orchestration and quality logic: `.github/framework/*.ts` and framework docs.
- Handoff execution state: `.github/.handoffs/**`.

### Where quality gates occur today

- Framework-level quality gates are defined in `.github/QUALITY-GATES.md` and `parallel-quality-gates.ts`.
- Pull request checklist exists but is not fully policy-computed.
- No repository workflows under `.github/workflows` currently enforce deterministic governance.

### Gap vs deterministic target model

- Missing machine-readable policy matrix and deterministic state machine definitions.
- Missing mandatory, type-specific issue templates for all major work classes.
- Missing automated workflow enforcement for required metadata, approvals, and release gates.
- Missing deterministic router that computes gates from issue/PR metadata and policy.

## Taxonomy (Complete Work Item Coverage)

| Work Item Type | Default Risk | Required Metadata Delta |
|---|---|---|
| feature | medium | user impact, rollout strategy, acceptance criteria |
| enhancement | medium | baseline metric, target metric |
| bug | medium | repro steps, impact scope, regression test plan |
| security-vulnerability | critical | CVSS/severity, affected versions, disclosure status |
| security-hardening | high | threat addressed, verification evidence |
| incident | critical | SEV, incident commander, comms cadence, mitigation plan |
| hotfix | high | production symptom, rollback plan, follow-up debt item |
| dependency-update | low | package list, security impact, compatibility risk |
| refactor | low | non-goals, behavior invariants |
| tech-debt | low | debt class, expected maintenance reduction |
| performance | medium | baseline/p95/p99, target budget |
| reliability | high | SLO impact, failure mode coverage |
| ci-cd | medium | pipeline impact, rollback strategy |
| infrastructure | high | environment scope, blast radius, IaC plan |
| observability | medium | metrics/logs/traces added, alert strategy |
| data-migration | critical | migration direction, compatibility mode, rollback method |
| schema-change | high | backward compatibility, data validation plan |
| api-change | high | versioning plan, consumer notification |
| breaking-api-change | critical | deprecation timeline, migration guide |
| compliance | high | regulatory basis, control mapping, evidence plan |
| legal-review | medium | license/commercial terms impact |
| privacy-change | critical | data classes affected, retention and deletion impact |
| documentation | low | audience, affected docs set |
| ux-design | medium | user journey impact, accessibility implications |
| experiment | medium | hypothesis, success metric, kill criteria |
| customer-escalation | high | customer tier, SLA clock, workaround status |
| release | high | release train, rollback criteria, sign-off set |

## Universal Work Item State Machine

### States

`draft` → `triage` → `planned` → `in-progress` → `in-review` → `approved` → `ready-to-release` → `released` → `verified` → `closed`

Terminal alternates: `blocked`, `cancelled`.

### Allowed transitions

- `draft -> triage`
- `triage -> planned | blocked | cancelled`
- `planned -> in-progress | blocked`
- `in-progress -> in-review | blocked`
- `in-review -> approved | in-progress | blocked`
- `approved -> ready-to-release | blocked`
- `ready-to-release -> released | blocked`
- `released -> verified | blocked`
- `verified -> closed`
- `blocked -> triage | planned | in-progress | in-review` (only when unblock criteria satisfied)

### Deterministic preconditions by transition

- `draft -> triage`: valid work item schema, type assigned, severity/priority set.
- `triage -> planned`: risk category set, DRI assigned, acceptance criteria testable.
- `planned -> in-progress`: implementation plan + owner agents identified.
- `in-progress -> in-review`: code/tests/docs artifacts attached; CI required checks green.
- `in-review -> approved`: mandatory approvers from policy matrix complete.
- `approved -> ready-to-release`: rollout plan and observability plan present.
- `ready-to-release -> released`: deployment checks passed; freeze policy not violated.
- `released -> verified`: post-release validation and SLO sanity checks executed.
- `verified -> closed`: all follow-up tasks created and linked.

### Required artifacts per state

- `triage`: classified issue with required metadata.
- `planned`: acceptance criteria, risk assessment, test strategy.
- `in-progress`: implementation branch/PR, evidence links.
- `in-review`: test results, security scan summary, docs delta.
- `approved`: approvals list + policy gate report.
- `ready-to-release`: release notes draft, rollback plan.
- `released`: deployment record + monitoring snapshot.
- `verified`: verification checklist + incident-free window evidence.

### DRI and timeouts

- `triage`: Product Owner, timeout 1 business day.
- `planned`: Program Manager + Engineering Lead, timeout 2 business days.
- `in-progress`: Implementation Engineer, timeout per priority SLA.
- `in-review`: QA/Security/Lead reviewers, timeout 2 business days.
- `ready-to-release`/`released`/`verified`: DevOps/SRE, timeout 1 business day.
- `blocked`: auto-escalate after 8 business hours (`P0/P1`) or 2 business days (`P2/P3`) to Chief of Staff.

## Specialized Sub-State Machines

### 1) Incident / Outage

States: `detected -> triage-sev -> mitigated -> stabilized -> resolved -> postmortem -> closed`

- Preconditions:
  - `triage-sev` requires SEV (`SEV0..SEV4`) assignment and incident commander.
  - `mitigated` requires mitigation action + customer comms.
  - `stabilized` requires error rate and critical SLO trend back to threshold.
  - `postmortem` required within 48h for `SEV0-SEV2`.
- Cadence:
  - `SEV0`: updates every 15m
  - `SEV1`: every 30m
  - `SEV2`: every 60m
  - `SEV3/4`: every 4h or next-day summary
- Rollback rule: if mitigation fails twice or blast radius expands, enforce rollback if feasible.

### 2) Security Vulnerability

States: `reported -> validated -> severity-assessed -> containment -> patching -> verification -> disclosure -> closed`

- Preconditions:
  - severity via CVSS band and affected versions recorded.
  - legal/compliance review before `disclosure`.
  - verification requires security regression test + exploit proof invalidated.
- Escalation: `critical` vulnerabilities must start containment within 4h.

### 3) Data Migration

States: `design -> compatibility-check -> dry-run -> staged-rollout -> production-run -> validation -> decommission-legacy -> closed`

- Preconditions:
  - `compatibility-check`: backward compatibility mode documented.
  - `dry-run`: representative dataset evidence attached.
  - `production-run`: rollback script verified.
  - `decommission-legacy`: retention and archive policy confirmed.

### 4) Breaking API Change

States: `proposal -> consumer-impact-analysis -> version-plan -> dual-run -> deprecation-announced -> cutover -> old-version-sunset -> closed`

- Preconditions:
  - `consumer-impact-analysis` includes top consumers and migration owners.
  - `version-plan` defines new major/minor and support window.
  - `deprecation-announced` minimum 2 release cycles notice unless `P0` exception approved.

### 5) Hotfix Fast Path

States: `triggered -> scoped -> fix-implemented -> expedited-review -> released -> post-release-audit -> closed`

- Preconditions:
  - only `P0/P1` + prod impact qualifies.
  - expedited-review still requires QA + Engineering Lead + on-call SRE approval.
  - `post-release-audit` within 24h includes root cause and prevention work item.

## Deterministic Policy Matrix

Policy inputs:

- `type`
- `severity (S0..S4)`
- `priority (P0..P3)`
- `risk (low/medium/high/critical)`
- `blast_radius (single-team/multi-team/customer-visible/global)`
- `component_area (frontend/backend/data/infra/security/platform/docs)`
- `deployment_surface (non-prod/prod)`
- `rollout_method (all-at-once/flag/ring/canary)`
- `data_sensitivity (public/internal/confidential/regulated)`

Policy outputs:

- required approvers (agent roles)
- required test levels
- required documentation
- rollout strategy requirements
- merge strategy and commit format
- release requirements

See machine-readable matrix: `.github/framework-config/deterministic/policies/policy_matrix.json`.

## Exception Protocols (Deterministic)

### Blocked

1. Set `state=blocked` with `blocked_reason`.
2. Create dependency issue linked with `blocks:<id>`.
3. Set escalation timer from state machine timeout.
4. Auto-route to Chief of Staff if timer expires.

### Needs Clarification

1. Set `state=triage` + `needs-clarification` label.
2. Route to Product Owner + Customer Council persona review.
3. Require explicit decision log entry before continuing.

### CI Flake

1. Mark check as `flake-suspected` only if rerun differs.
2. Create `test-flake` follow-up issue.
3. Controlled merge allowed only for `risk<=medium` and non-security change.

### Incident Mode

1. Activate incident sub-state machine.
2. Freeze non-incident merges for `SEV0/SEV1`.
3. Only incident-tagged PRs with incident commander approval may merge.

## Stakeholder Governance Model

Detailed role playbooks are in `.github/framework-config/deterministic/docs/playbooks/`.

### Approval authority summary

- Product Owner: scope and acceptance approval.
- Engineering Lead/Architect: technical design and readiness approval.
- QA/Test: test sufficiency approval.
- Security Engineer: security/privacy gate approval.
- DevOps/SRE: release safety and operational approval.
- Legal/Compliance: licensing/regulatory approvals.
- Finance/Procurement: cost/vendor approvals for new licensed dependencies/services.
- Executive Sponsor: high-risk tradeoff and exception approval.

## Integration with Existing Agentic Framework

### In-flight work item representation

- Canonical metadata schema: `.github/framework-config/deterministic/policies/work_item.schema.json`.
- Canonical states and transitions: `.github/framework-config/deterministic/policies/state_machines.json`.
- Computed gate output artifact: router JSON report (`required_gates`, `required_approvers`, `required_checks`, `required_docs`, `next_agent`).

### Deterministic handoff rule

`next_agent` is computed from `state + type + policy outputs`:

- `triage` -> Product Owner
- `planned` -> Program Manager
- `in-progress` -> Implementation Engineer (domain-specific)
- `in-review` -> QA/Security/Lead approvers from policy output
- `ready-to-release/released` -> DevOps/SRE
- `verified` -> Quality Director

### Done criteria

Work item is done only when:

1. final state is `closed`
2. all required policy gates are satisfied
3. release + verification evidence exists
4. follow-up obligations (if any) are linked

## Worked Examples

Complete end-to-end examples are in `.github/framework-config/deterministic/docs/examples/deterministic-worked-examples.md`.
