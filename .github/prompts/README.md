# Prompt Library — 38 Prompts in 13 Categories

**Version:** 2.1.0  
**Date:** 2026-02-25  
**Purpose:** Standardized, reusable prompts for the Core-3 operating model with specialist escalation

---

## 📖 Overview

This directory contains **38 canonical prompts** across **13 categories**, designed to guide agents through every phase of the software development lifecycle. Each prompt is a `.prompt.md` file containing:

- **Purpose:** What this prompt accomplishes
- **When to use:** Trigger conditions
- **Prerequisites:** Required context or artifacts
- **Steps:** Detailed workflow instructions
- **Deliverables:** Expected outputs
- **Example:** Real-world application

---

## 📂 Prompt Categories (13)

### 1. discovery/ — Initial Codebase Analysis (3 prompts)

| Prompt                          | Purpose                                         | When to Use                       |
| ------------------------------- | ----------------------------------------------- | --------------------------------- |
| `repo-scan.prompt.md`           | Scan repository structure, identify patterns    | First time analyzing repo         |
| `techstack-detection.prompt.md` | Detect technology stack, versions, dependencies | "What's this project built with?" |
| `risk-analysis.prompt.md`       | Assess technical risk, complexity, debt         | Planning refactors/migrations     |

---

### 2. architecture/ — System Design & Modeling (4 prompts)

| Prompt                     | Purpose                                          | When to Use                       |
| -------------------------- | ------------------------------------------------ | --------------------------------- |
| `domain-model.prompt.md`   | Create `.github/.system-state/model/` domain entities    | New feature or domain modeling    |
| `system-design.prompt.md`  | Design end-to-end architecture                   | Major features, epics             |
| `adr-generation.prompt.md` | Create Architecture Decision Records             | Significant technical decisions   |
| `api-contract.prompt.md`   | Define API schemas in `.github/.system-state/contracts/` | New API endpoints or integrations |

---

### 3. planning/ — Work Breakdown & Estimation (2 prompts)

| Prompt                          | Purpose                             | When to Use                         |
| ------------------------------- | ----------------------------------- | ----------------------------------- |
| `slice-planning.prompt.md`      | Break epics into vertical slices    | Implementation planning (Tech Lead) |
| `acceptance-criteria.prompt.md` | Define testable acceptance criteria | Before implementation starts        |

---

### 4. implementation/ — Code Development (2 prompts)

| Prompt                     | Purpose                                           | When to Use                          |
| -------------------------- | ------------------------------------------------- | ------------------------------------ |
| `vertical-slice.prompt.md` | Implement one vertical slice (frontend + backend) | Engineers implementing slices        |
| `refactor.prompt.md`       | Refactor code while preserving behavior           | Reducing tech debt, improving design |

---

### 5. review/ — Code Review & Quality (2 prompts)

| Prompt                                | Purpose                                        | When to Use                    |
| ------------------------------------- | ---------------------------------------------- | ------------------------------ |
| `microsoft-grade-pr-review.prompt.md` | Perform rigorous PR review (G1-G10 gates)      | Quality Director reviewing PRs |
| `gap-analysis.prompt.md`              | Identify gaps between implementation and model | Post-implementation validation |

---

### 6. testing/ — Test Strategy & Execution (2 prompts)

| Prompt                 | Purpose                          | When to Use                   |
| ---------------------- | -------------------------------- | ----------------------------- |
| `test-gap.prompt.md`   | Identify missing test coverage   | Coverage below 80%            |
| `e2e-design.prompt.md` | Design end-to-end test scenarios | Critical user journey testing |

---

### 7. security/ — Threat Modeling & Audits (2 prompts)

| Prompt                        | Purpose                                | When to Use                           |
| ----------------------------- | -------------------------------------- | ------------------------------------- |
| `threat-model.prompt.md`      | Create STRIDE threat model             | New features touching sensitive data  |
| `dependency-review.prompt.md` | Audit dependencies for vulnerabilities | Before adding dependencies, quarterly |

---

### 8. operations/ — Deployment & Monitoring (6 prompts) ⭐ **UPDATED**

| Prompt                                 | Purpose                                             | When to Use                          |
| -------------------------------------- | --------------------------------------------------- | ------------------------------------ |
| `deployment-plan.prompt.md`            | Plan gradual rollout strategy                       | Before production deployment         |
| `observability.prompt.md`              | Configure metrics, SLOs, alerts                     | Setting up monitoring                |
| **`git-commit.prompt.md`** ⭐ NEW      | Guide agents through committing code, quality gates | After implementing each unit of work |
| **`create-pr.prompt.md`** ⭐ NEW       | Guide Quality Director through PR creation          | After all quality gates pass         |
| **`manage-issue.prompt.md`** ⭐ NEW    | Guide issue creation, labeling, lifecycle           | Creating/updating GitHub issues      |
| **`branch-strategy.prompt.md`** ⭐ NEW | Guide branch creation, naming, management           | Creating/managing feature branches   |

---

### 9. documentation/ — Developer & User Docs (2 prompts)

| Prompt                    | Purpose                                  | When to Use                           |
| ------------------------- | ---------------------------------------- | ------------------------------------- |
| `runbook.prompt.md`       | Create operational runbook for incidents | New critical paths, incident recovery |
| `readme-update.prompt.md` | Update README with new features          | Customer-facing feature releases      |

---

### 10. release/ — Release Management (2 prompts)

| Prompt                    | Purpose                             | When to Use               |
| ------------------------- | ----------------------------------- | ------------------------- |
| `release-notes.prompt.md` | Generate release notes from commits | Before production release |
| `rollback-plan.prompt.md` | Create rollback plan for deployment | Before risky deployments  |

---

### 11. incident/ — Incident Response (2 prompts)

| Prompt                        | Purpose                                       | When to Use             |
| ----------------------------- | --------------------------------------------- | ----------------------- |
| `incident-response.prompt.md` | Guide incident triage and resolution          | Production incidents    |
| `postmortem.prompt.md`        | Document incident learnings, prevention steps | After incident resolved |

---

### 12. optimization/ — Performance & Health (2 prompts)

| Prompt                        | Purpose                                             | When to Use                 |
| ----------------------------- | --------------------------------------------------- | --------------------------- |
| `performance-audit.prompt.md` | Identify performance bottlenecks                    | Core Web Vitals degradation |
| `repo-health.prompt.md`       | Assess codebase health (dependency freshness, etc.) | Quarterly health checks     |

---

### 13. framework-audit/ — Meta-Level Framework Testing (7 prompts) ⭐ **NEW**

| Prompt                                    | Purpose                                            | When to Use              |
| ----------------------------------------- | -------------------------------------------------- | ------------------------ |
| **`mode-selection.prompt.md`** ⭐         | Select audit mode autonomously (FAST/STANDARD/THOROUGH) | Starting framework audit |
| **`audit-plan.prompt.md`** ⭐             | Create audit execution plan with baseline state    | After mode selected      |
| **`synthetic-task-battery.prompt.md`** ⭐ | Library of synthetic tasks to test framework       | Executing audit          |
| **`monitoring-rubric.prompt.md`** ⭐      | Real-time monitoring and failure detection         | During audit execution   |
| **`scoring-metrics.prompt.md`** ⭐        | Calculate 12 performance metrics, assign grade     | After audit completes    |
| **`final-report.prompt.md`** ⭐           | Generate comprehensive audit report                | After metrics calculated |
| **`remediation-dispatch.prompt.md`** ⭐   | Dispatch remediation tasks autonomously            | After report generated   |

---

## 🆕 What's New in v2.1.0 (2026-02-25)

### Framework Audit Category (+7 prompts)

To enable **meta-level testing** of the AI agentic framework itself, testing workflows, handoffs, dispatch chains, and quality processes:

1. **`mode-selection.prompt.md`** — Guide Framework Auditor to select which mode to run (FAST/STANDARD/THOROUGH)
2. **`audit-plan.prompt.md`** — Create structured audit execution plan with baseline capture and expected outcomes
3. **`synthetic-task-battery.prompt.md`** — Complete library of synthetic tasks (5 FAST, 12 STANDARD, 30 THOROUGH)
4. **`monitoring-rubric.prompt.md`** — Real-time monitoring with PowerShell scripts, failure mode detection
5. **`scoring-metrics.prompt.md`** — 12 performance metrics with formulas and targets, overall grade (A-F)
6. **`final-report.prompt.md`** — Comprehensive audit report with findings, remediation plan, appendices
7. **`remediation-dispatch.prompt.md`** — Dispatch remediation tasks to Chief of Staff (autonomous)

**New Agent:** `90-framework-auditor` (Framework Auditor)

### Operations Category Expansion (+4 prompts) — v2.0.0

To address the gap where agents were producing quality code but not committing it or managing git/GitHub resources:

1. **`git-commit.prompt.md`** — Step-by-step workflow for committing code after quality gates pass
2. **`create-pr.prompt.md`** — Pull Request creation workflow (risk-based authority)
3. **`manage-issue.prompt.md`** — GitHub issue lifecycle management (Chief of Staff)
4. **`branch-strategy.prompt.md`** — Feature branch creation and management (Tech Lead)

**Total prompts:** 27 → 31 (v2.0.0) → **38 prompts (v2.1.0)**

---

## 🚀 How to Use Prompts

### Agent Dispatch with Prompt Reference

When agents need guidance on a specific workflow, reference the relevant prompt:

```powershell
# Example: Tech Lead slicing E009 SEO Foundation
$repo = (Get-Location).Path
code chat -m 11-tech-lead --add-file $repo --add-file .github/AGENTS.md --add-file .github/prompts/planning/slice-planning.prompt.md "Use slice-planning.prompt.md to break down E009. Issue #<WORK_ITEM_ID>."
```

### Inline Prompt Application

Agents can read and apply prompts directly in their workflows:

```powershell
# Quality Director preparing PR
code chat -m 99-quality-director --add-file $repo --add-file .github/prompts/operations/create-pr.prompt.md "Create PR for E009 following the prompt. Issue #<WORK_ITEM_ID>."
```

---

## 📋 Prompt Structure Template

All prompts follow this canonical structure:

```markdown
# [Prompt Name]

**Category:** [discovery/architecture/planning/implementation/review/testing/security/operations/documentation/release/incident/optimization]
**Agent(s):** [Which agents use this prompt]
**Tier:** [T1/T2/T3 complexity tier]

---

## Purpose

_What this prompt accomplishes._

---

## When to Use

_Trigger conditions for this prompt._

---

## Prerequisites

- [ ] Required context
- [ ] Required artifacts
- [ ] Required access

---

## Steps

1. Step one
2. Step two
3. Step three

---

## Deliverables

- [ ] Output 1
- [ ] Output 2

---

## Example

_Real-world application with specific examples._

---

## Related

- `../category/related.prompt.md`
- `../../RELATED.md`
```

---

## 🔍 Prompt Discovery by Scenario

### "I need to implement a new feature"

1. `domain-model.prompt.md` → Define domain entities
2. `api-contract.prompt.md` → Define API schemas
3. `slice-planning.prompt.md` → Break into vertical slices
4. `vertical-slice.prompt.md` → Implement each slice
5. `git-commit.prompt.md` ⭐ → Commit after each slice
6. `test-gap.prompt.md` → Ensure coverage ≥80%
7. `create-pr.prompt.md` ⭐ → Create PR (Quality Director)

### "I need to review code"

1. `gap-analysis.prompt.md` → Compare implementation to model
2. `microsoft-grade-pr-review.prompt.md` → Full G1-G10 review
3. `test-gap.prompt.md` → Validate test coverage
4. `security/threat-model.prompt.md` → Security review

### "I need to fix a production incident"

1. `incident-response.prompt.md` → Triage and resolve
2. `rollback-plan.prompt.md` → If rollback needed
3. `postmortem.prompt.md` → Document learnings

### "I need to plan a deployment"

1. `deployment-plan.prompt.md` → Gradual rollout strategy
2. `rollback-plan.prompt.md` → Rollback strategy
3. `observability.prompt.md` → Ensure monitoring ready
4. `release-notes.prompt.md` → Generate release notes

### "I need to manage git/GitHub workflows" ⭐ NEW

1. `manage-issue.prompt.md` → Create/update GitHub issue
2. `branch-strategy.prompt.md` → Create feature branch
3. `git-commit.prompt.md` → Commit code with quality gates
4. `create-pr.prompt.md` → Create Pull Request (Quality Director)

### "I need to audit the framework itself" ⭐ ⭐ NEW

1. `mode-selection.prompt.md` → Select audit mode autonomously (FAST/STANDARD/THOROUGH)
2. `audit-plan.prompt.md` → Create execution plan with baseline
3. `synthetic-task-battery.prompt.md` → Select and dispatch synthetic tasks
4. `monitoring-rubric.prompt.md` → Monitor execution in real-time
5. `scoring-metrics.prompt.md` → Calculate 12 performance metrics
6. `final-report.prompt.md` → Generate comprehensive audit report
7. `remediation-dispatch.prompt.md` → Dispatch fixes autonomously

---

## 🎯 Agent → Prompt Mapping

### Chief of Staff

- `manage-issue.prompt.md` ⭐ (create issues, assign agents)
- `microsoft-grade-pr-review.prompt.md` (approve PRs)

### Solution Architect

- `domain-model.prompt.md`
- `system-design.prompt.md`
- `adr-generation.prompt.md`
- `api-contract.prompt.md`
- `branch-strategy.prompt.md` ⭐ (can create branches)

### Tech Lead

- `slice-planning.prompt.md`
- `acceptance-criteria.prompt.md`
- `branch-strategy.prompt.md` ⭐ (creates feature branches)
- `deployment-plan.prompt.md`

### Frontend Engineer

- `vertical-slice.prompt.md`
- `refactor.prompt.md`
- `git-commit.prompt.md` ⭐ (commit frontend code)

### Backend Engineer

- `vertical-slice.prompt.md`
- `refactor.prompt.md`
- `api-contract.prompt.md`
- | `git-commit.pro            | Prompt Count | Primary Agent(s)                             |
  | -------------------------- | ------------ | -------------------------------------------- |
  | discovery/                 | 3            | Chief of Staff, Solution Architect           |
  | architecture/              | 4            | Solution Architect                           |
  | planning/                  | 2            | Tech Lead, Product Manager                   |
  | implementation/            | 2            | Frontend, Backend, Platform Engineers        |
  | review/                    | 2            | Quality Director                             |
  | testing/                   | 2            | QA Test Engineer                             |
  | security/                  | 2            | Security Engineer                            |
  | **operations/** ⭐         | **6** (+4)   | Tech Lead, Platform Engineer, **All Agents** |
  | documentation/             | 2            | Documentation Engineer                       |
  | release/                   | 2            | Tech Lead, Platform Engineer                 |
  | incident/                  | 2            | Platform Engineer, SRE                       |
  | optimization/              | 2            | Platform Engineer, Performance Engineer      |
  | **framework-audit/** ⭐ ⭐ | **7** (+7)   | **Framework Auditor (90)**                   |
  | **TOTAL**                  | **38**       | 28md`                                        |
- `gap-analysis.prompt.md`
- `create-pr.prompt.md` ⭐ (ONLY agent who creates PRs)

### Documentation Engineer

- `runbook.prompt.md`
- `readme-update.prompt.md`
- `release-notes.prompt.md`
- `git-commit.prompt.md` ⭐ (commit documentation updates)

### Framework Auditor

- `mode-selection.prompt.md` ⭐ (autonomous mode selection)
- `audit-plan.prompt.md` ⭐ (create execution plan)
- `synthetic-task-battery.prompt.md` ⭐ (select synthetic tasks)
- `monitoring-rubric.prompt.md` ⭐ (monitor execution)
- `scoring-metrics.prompt.md` ⭐ (calculate metrics)
- `final-report.prompt.md` ⭐ (generate audit report)
- `remediation-dispatch.prompt.md` ⭐ (dispatch fixes to Chief of Staff)

---

## 📊 Prompt Statistics

| Category                   | Prompt Count | Primary Agent(s)                             |
| -------------------------- | ------------ | -------------------------------------------- |
| discovery/                 | 3            | Chief of Staff, Solution Architect           |
| architecture/              | 4            | Solution Architect                           |
| planning/                  | 2            | Tech Lead, Product Manager                   |
| implementation/            | 2            | Frontend, Backend, Platform Engineers        |
| review/                    | 2            | Quality Director                             |
| testing/                   | 2            | QA Test Engineer                             |
| security/                  | 2            | Security Engineer                            |
| **operations/** ⭐         | **6** (+4)   | Tech Lead, Platform Engineer, **All Agents** |
| documentation/             | 2            | Documentation Engineer                       |
| release/                   | 2            | Tech Lead, Platform Engineer                 |
| incident/                  | 2            | Platform Engineer, SRE                       |
| optimization/              | 2            | Platform Engineer, Performance Engineer      |
| **framework-audit/** ⭐ ⭐ | **7** (+7)   | **Framework Auditor (90)**                   |
| **TOTAL**                  | **38**       | Core-3 default + specialist roster           |

---

## 🛠️ Creating New Prompts

Follow the Prompt Structure Template above. Place in appropriate category directory:

```powershell
# Example: Creating new schema-migration.prompt.md
New-Item -Path .github/prompts/operations/schema-migration.prompt.md -ItemType File

# Fill with template structure
# Update this README with prompt details
```

---

## 🔗 Related Documentation

- [AGENTS.md](../AGENTS.md) — Agent roster and routing
- [QUALITY-GATES.md](../QUALITY-GATES.md) — G1-G10 quality gates
- [GIT_WORKFLOW.md](../GIT_WORKFLOW.md) ⭐ — Git/GitHub workflows
- [WORKFLOW_INTEGRATION_SUMMARY.md](../WORKFLOW_INTEGRATION_SUMMARY.md) ⭐ — Quick-start integration guide
- [copilot-instructions.md](../copilot-instructions.md) — Complete governance

---

8-agent organization.\*\*  
**Every significant workflow should have a corresponding prompt.**

**Version 2.1
**Version 2.0.0 | Updated 2026-02-25 | Owner: All Agents\*\*

