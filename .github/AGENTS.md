# Engineering Organization Roster

> **Version:** 1.0.0 | **Updated:** 2026-02-25 **Classification:** Enterprise
> Autonomous Engineering Organization

---

## Organization Chart

```
                        ┌──────────────────────┐
                        │   00 CHIEF OF STAFF   │  ← SINGLE ENTRY POINT
                        │    (Router/Planner)    │
                        └──────────┬───────────┘
               ┌───────────────────┼───────────────────┐
               ▼                   ▼                   ▼
    ┌──────────────────┐ ┌─────────────────┐ ┌──────────────────┐
    │  PRODUCT OWNER   │ │ PROGRAM MANAGER │ │   STAKEHOLDER    │
    │  (Requirements)  │ │  (Coordination) │ │   EXECUTIVE      │
    └────────┬─────────┘ └────────┬────────┘ └──────────────────┘
             │                    │
             ▼                    ▼
    ┌──────────────────┐ ┌─────────────────────┐
    │    SOLUTION       │ │     TECH LEAD       │
    │    ARCHITECT      │ │  (Impl. Strategy)   │
    └────────┬─────────┘ └────────┬────────────┘
             │         ┌──────────┼──────────────────┐
             ▼         ▼          ▼                  ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
    │ FRONTEND │ │ BACKEND  │ │ PLATFORM │ │  DATA / ML   │
    │ ENGINEER │ │ ENGINEER │ │ ENGINEER │ │  ENGINEER    │
    └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘
         │            │            │               │
         ▼            ▼            ▼               ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
    │    UX    │ │ A11Y     │ │  DEVOPS  │ │    SRE       │
    │ DESIGNER │ │ SPEC.    │ │ ENGINEER │ │  ENGINEER    │
    └──────────┘ └──────────┘ └──────────┘ └──────────────┘
         │            │            │               │
         └────────────┴─────┬──────┴───────────────┘
                            ▼
              ┌───────────────────────────┐
              │     QA / TEST ENGINEER    │
              │   PERFORMANCE ENGINEER    │
              │   SECURITY ENGINEER       │
              │   PRIVACY OFFICER         │
              └────────────┬──────────────┘
                           ▼
              ┌───────────────────────────┐
              │   DOCUMENTATION ENGINEER  │
              │   SUPPORT READINESS ENG.  │
              └────────────┬──────────────┘
                           ▼
              ┌───────────────────────────┐
              │   ENTERPRISE EXTENSIONS   │
              │   Legal · Finance · L10n  │
              │   Incident Cmd · Red Team │
              └────────────┬──────────────┘
                           ▼
              ┌───────────────────────────┐
              │   99 QUALITY DIRECTOR     │  ← FINAL AUTHORITY
              │   (Gate Keeper / Stop)    │  ← ONLY agent that can end chain
              └───────────────────────────┘
```

---

## Agent Roster

| #   | Agent ID                     | Role                       | Domain                                          | Agent File                                   |
| --- | ---------------------------- | -------------------------- | ----------------------------------------------- | -------------------------------------------- |
| 00  | `00-chief-of-staff`          | Chief of Staff             | Routing, Planning, Escalation                   | `agents/00-chief-of-staff.agent.md`          |
| 01  | `product-owner`              | Product Owner              | Requirements, User Stories, Acceptance Criteria | `agents/product-owner.agent.md`              |
| 02  | `program-manager`            | Program Manager            | Coordination, Timelines, Dependencies           | `agents/program-manager.agent.md`            |
| 03  | `stakeholder-executive`      | Stakeholder Executive      | Business Strategy, Budget, Priorities           | `agents/stakeholder-executive.agent.md`      |
| 10  | `solution-architect`         | Solution Architect         | System Design, ADRs, Domain Models              | `agents/solution-architect.agent.md`         |
| 11  | `11-tech-lead`               | Tech Lead                  | Implementation Strategy, Code Standards         | `agents/tech-lead.agent.md`                  |
| 20  | `frontend-engineer`          | Frontend Engineer          | UI Components, Pages, Client State              | `agents/frontend-engineer.agent.md`          |
| 21  | `backend-engineer`           | Backend Engineer           | API Routes, Server Logic, Integrations          | `agents/backend-engineer.agent.md`           |
| 22  | `platform-engineer`          | Platform Engineer          | Infrastructure, CI/CD, Deployment               | `agents/platform-engineer.agent.md`          |
| 23  | `data-engineer`              | Data Engineer              | Data Pipelines, Schemas, Migrations             | `agents/data-engineer.agent.md`              |
| 24  | `ml-engineer`                | ML Engineer                | ML Models, Recommendations, Analytics           | `agents/ml-engineer.agent.md`                |
| 30  | `ux-designer`                | UX Designer                | User Flows, Wireframes, Design Systems          | `agents/ux-designer.agent.md`                |
| 31  | `accessibility-specialist`   | Accessibility Specialist   | WCAG, ARIA, Screen Readers                      | `agents/accessibility-specialist.agent.md`   |
| 40  | `qa-test-engineer`           | QA/Test Engineer           | Test Strategy, Coverage, Automation             | `agents/qa-test-engineer.agent.md`           |
| 41  | `performance-engineer`       | Performance Engineer       | Perf Budgets, Profiling, Optimization           | `agents/performance-engineer.agent.md`       |
| 50  | `security-engineer`          | Security Engineer          | Threat Models, Pen Testing, Hardening           | `agents/security-engineer.agent.md`          |
| 51  | `privacy-compliance-officer` | Privacy Compliance Officer | GDPR, PII, Data Protection                      | `agents/privacy-compliance-officer.agent.md` |
| 60  | `devops-engineer`            | DevOps Engineer            | CI/CD, IaC, Monitoring                          | `agents/devops-engineer.agent.md`            |
| 61  | `sre-engineer`               | SRE Engineer               | Reliability, SLOs, Incident Response            | `agents/sre-engineer.agent.md`               |
| 70  | `documentation-engineer`     | Documentation Engineer     | Docs, API Refs, Guides                          | `agents/documentation-engineer.agent.md`     |
| 71  | `support-readiness-engineer` | Support Readiness Engineer | Runbooks, FAQ, Triage Guides                    | `agents/support-readiness-engineer.agent.md` |
| 80  | `legal-counsel`              | Legal Counsel              | Licensing, Compliance, Terms                    | `agents/legal-counsel.agent.md`              |
| 81  | `finance-procurement`        | Finance & Procurement      | Cost Analysis, Vendor Evaluation                | `agents/finance-procurement.agent.md`        |
| 82  | `localization-specialist`    | Localization Specialist    | i18n, l10n, Translation                         | `agents/localization-specialist.agent.md`    |
| 83  | `incident-commander`         | Incident Commander         | Incident Management, War Room                   | `agents/incident-commander.agent.md`         |
| 84  | `red-team`                   | Red Team                   | Adversarial Testing, Exploit Discovery          | `agents/red-team.agent.md`                   |
| 90  | `90-framework-auditor`       | Framework Auditor          | Meta-Level Testing, Framework QA                | `agents/90-framework-auditor.agent.md`       |
| 99  | `99-quality-director`        | Quality Director           | Final Authority, Ship/No-Ship                   | `agents/quality-director.agent.md`           |

**Total Agents: 28**

## Core-3 Operating Mode (Default)

The organization retains the 28-agent roster, but daily delivery defaults to a
3-agent autonomous core with policy-triggered specialist escalation.

**Always-on core agents:**

1. `00-chief-of-staff` (Orchestrator)
2. `11-tech-lead` (Implementer)
3. `99-quality-director` (Assurance)

**Role bundles:**

- **Orchestrator (`00-chief-of-staff`)**
  - Bundles: chief-of-staff, solution-architect, product-owner, program-manager
  - Responsibilities: intake, routing, planning, lane assignment, architecture
    coordination, issue/branch orchestration
- **Implementer (`11-tech-lead`)**
  - Bundles: frontend-engineer, backend-engineer, platform-engineer,
    documentation-engineer, qa-test-engineer (execution role)
  - Responsibilities: implementation, tests, docs updates, remediation, evidence
    packaging
- **Assurance (`99-quality-director`)**
  - Bundles: 99-quality-director, security-engineer, privacy-compliance-officer,
    performance-engineer
  - Responsibilities: independent validation, security/compliance signoff,
    Microsoft-grade review, final ship/no-ship authority

**Specialist escalation policy:**

- Core-3 remains default in all lanes.
- Specialists are invoked when required by policy triggers
  (security/compliance/incident/data migration/legal/regulatory).
- Escalation does not remove Assurance independence requirements.

**PR authority model:**

- Low/Medium risk: Orchestrator-authorized creator (allowlisted engineering
  lead)
- High/Critical risk: Quality Director

Specialists remain available and are engaged by policy trigger (domain,
compliance, incident, platform, or documentation needs).

---

## Routing Guide

### When to Call Which Agent

| Situation                | Route To               | Prompt to Use                                |
| ------------------------ | ---------------------- | -------------------------------------------- |
| New feature request      | `00-chief-of-staff`    | `discovery/repo-scan.prompt.md`              |
| Bug report               | `00-chief-of-staff`    | `discovery/risk-analysis.prompt.md`          |
| Low-risk docs/chore work | `11-tech-lead`         | `planning/slice-planning.prompt.md`          |
| Dependency-only updates  | `11-tech-lead`         | `implementation/refactor.prompt.md`          |
| Architecture question    | `solution-architect`   | `architecture/system-design.prompt.md`       |
| Need acceptance criteria | `00-chief-of-staff`    | `planning/acceptance-criteria.prompt.md`     |
| Implement a feature      | `11-tech-lead`         | `implementation/vertical-slice.prompt.md`    |
| Review a PR              | `99-quality-director`  | `review/microsoft-grade-pr-review.prompt.md` |
| Fix failing tests        | `qa-test-engineer`     | `testing/test-gap.prompt.md`                 |
| Security concern         | `99-quality-director`  | `security/threat-model.prompt.md`            |
| Performance issue        | `99-quality-director`  | `optimization/performance-audit.prompt.md`   |
| Deploy to production     | `devops-engineer`      | `operations/deployment-plan.prompt.md`       |
| Incident in production   | `99-quality-director`  | `incident/incident-response.prompt.md`       |
| Need documentation       | `11-tech-lead`         | `documentation/readme-update.prompt.md`      |
| Refactoring needed       | `11-tech-lead`         | `implementation/refactor.prompt.md`          |
| New dependency request   | `solution-architect`   | `architecture/adr-generation.prompt.md`      |
| Release preparation      | `program-manager`      | `release/release-notes.prompt.md`            |
| Audit framework health   | `90-framework-auditor` | `framework-audit/mode-selection.prompt.md`   |
| Unknown / unclear        | `00-chief-of-staff`    | (Chief will route)                           |

### Fast-Lane Routing Rule

- Low-risk work defaults to a fast lane (shortened dispatch chain) while
  preserving mandatory traceability and security checks.
- High/critical work continues through full assurance routing and Quality
  Director-led closure.

---

## Escalation Path

```
Any Agent → Tech Lead → Solution Architect → Chief of Staff → Stakeholder Executive
                                                   ↑
Quality Director ──── (can escalate to) ──────────┘
```

### Escalation Triggers

1. **Blocked >2 attempts** — Escalate to next level
2. **Scope ambiguity** — Escalate to Product Owner
3. **Architecture conflict** — Escalate to Solution Architect
4. **Security concern** — Escalate to Quality Director Assurance path (always)
5. **Quality gate failure** — Escalate to Quality Director
6. **Business decision needed** — Escalate to Stakeholder Executive
7. **Cross-cutting concern** — Escalate to Chief of Staff

---

## Stop Conditions

### An agent MUST STOP and escalate when:

1. Task is outside their defined scope
2. They've attempted the same fix 3 times without success
3. A security vulnerability is discovered
4. A model violation is detected (code drifts from model)
5. Required input is missing and cannot be inferred
6. The change would break a quality gate
7. The change requires an ADR that doesn't exist

### Autonomous Continuation Rule

When an agent is not in a true stop condition, it MUST continue execution by
completing the next modeled step and dispatching the next agent.

- Do NOT ask a human for "what to do next" when the next modeled step is known.
- Do NOT ask a human whether to apply an optimal in-scope recommendation;
  execute it by default.
- Do NOT pause after planning if implementation, validation, or handoff work
  remains.
- If blocked, escalate through the defined chain and include blocker evidence +
  attempted fallback.
- Human input is allowed only for genuinely missing external
  decisions/credentials that cannot be inferred.

---

## Infinite Loop Prevention

### Rules

1. **Max dispatch depth:** 10 agents in a single chain
2. **No self-dispatch:** An agent cannot call itself
3. **No A→B→A cycles:** Track dispatch history in context
4. **Blocked detection:** If an agent receives the same task >2 times, escalate
   to Chief of Staff
5. **Timeout:** If no progress after 3 dispatches, Quality Director makes
   ship/no-ship call

### Dispatch Tracking

Every dispatch MUST include:

```
Dispatch Chain: [00-chief-of-staff] → [product-owner] → [solution-architect] → [current]
Dispatch Depth: 3/10
```

---

## Handoff Protocol: GitHub-Native System

> **Location:** GitHub Issue/PR comments **Protocol:** Post handoff comment →
> dispatch with `code chat` and `Handoff URL`

### Why GitHub-Native

GitHub comments keep handoffs in the same audit trail as issues, PRs, checks,
and reviews while preserving the existing `code chat -m` dispatch workflow.

### Dispatch Format (ALL agents MUST use this)

**Step 1:** Post a complete handoff comment to the active Issue/PR using the
canonical template in `.github/comment_templates/`.

**Step 2:** Dispatch via `code chat` and include the handoff comment URL near
the top of the prompt.

**Dispatch Context Pack (MANDATORY):**

- Always include `--add-file $repo`
- Always include **at least 2 auxiliary files** relevant to the task (models,
  plans, contracts, prompts, runbooks, or evidence artifacts)
- Prefer including the latest
  `.github/.system-state/ops/context/issue-<id>-agent-context.json` to avoid
  repeated discovery
- Prefer explicit artifact paths over relying on repo-level discovery

```powershell
$repo = (Get-Location).Path
$handoffUrl = "https://github.com/<owner>/<repo>/pull/<pr>#issuecomment-<id>"
$context1 = ".github/.system-state/model/system_state_model.yaml"
$context2 = ".github/.system-state/plan/implementation_plan.md"
code chat -m <target-agent-id> --add-file $repo --add-file $context1 --add-file $context2 "[Issue#<id>] [Task <n>] [To: <target-agent-id>]`nHandoff URL: $handoffUrl`nExecute next actions from the handoff comment."
```

### Rules

1. **One handoff comment per dispatch** - each dispatch references a specific
   comment URL
2. **Always include `Handoff URL` in dispatch prompt** - receiving agent must
   read it first
3. **Always include a context pack via `--add-file`** - repo + at least 2
   relevant auxiliary artifacts
4. **Resume before re-discovering** - consume context snapshot and pending
   checklist items first; run full discovery only when snapshot is stale/missing
5. **Prefer scripted dispatch for consistency** - use
   `.github/scripts/dispatch-agent.ps1` to auto-generate context and dedupe
   repeated dispatches
6. **Preserve dispatch tracking metadata** - include dispatch chain and depth in
   handoff body
7. **Do not create new `.github/.handoffs/*` artifacts** - file-based handoffs
   are deprecated
8. **Keep `code chat -m` as the dispatch mechanism** - only the handoff
   transport changes

### Quality Director Exception

Quality Director (`99-quality-director`) is the ONLY agent authorized to end the
chain:

```
CHAIN COMPLETE ✅
All acceptance criteria met.
All quality gates passed.
Evidence: <list of evidence>
```

---

## Quick Reference: Agent Invocation

```powershell
# Simple single-line command (OK for trivial tasks)
code chat -m frontend-engineer --add-file $repo --add-file .github/AGENTS.md --add-file .github/GIT_WORKFLOW.md "Build the product card component"

# Multi-line / complex tasks: USE GITHUB-NATIVE HANDOFF (MANDATORY)
# 1. Post handoff comment to Issue/PR
# 2. Dispatch with Handoff URL
$repo = (Get-Location).Path
$handoffUrl = "https://github.com/<owner>/<repo>/issues/<id>#issuecomment-<id>"
$context1 = ".github/.system-state/model/system_state_model.yaml"
$context2 = ".github/.system-state/delivery/delivery_state_model.yaml"
code chat -m solution-architect --add-file $repo --add-file $context1 --add-file $context2 "[Issue#<id>] [Task 1] [To: solution-architect]`nHandoff URL: $handoffUrl`nExecute the task from the handoff comment."
```

### NEVER Do This (Broken Approaches)

```powershell
# ❌ WRONG: Multi-line string argument — gets truncated/dropped
code chat -m agent "Line 1
Line 2
Line 3"

# ❌ WRONG: Backtick continuation — unreliable
code chat -m agent --add-file $repo `
  "Multi-line content"

# ❌ WRONG: Here-string as argument — may not be passed correctly
$prompt = @"
Long content
"@
code chat -m agent $prompt
```
