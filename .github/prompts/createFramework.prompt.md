````prompt
# Create Agentic Engineering Framework

> **Category:** Framework Installation
> **File:** `createFramework.prompt.md`
> **Purpose:** Generate a complete 28-agent autonomous engineering organization framework in any repository
> **Version:** 1.0.0

---

## Overview

This prompt creates a production-grade, autonomous engineering framework with 28 specialized Copilot agents, smart routing, parallel execution, quality gates, and comprehensive governance. The framework adapts to any tech stack while maintaining identical structure and behavior patterns.

---

## What This Framework Provides

### Core Capabilities

1. **28-Agent Engineering Organization**
   - Hierarchical organization: Chief of Staff → Specialists → Quality Director
   - Single entry point (Chief of Staff) for all work
   - Smart routing with bypass logic for simple tasks
   - Autonomous execution with file-based handoff protocol

2. **38 Canonical Prompts in 13 Categories**
   - Discovery, Architecture, Planning, Implementation
   - Review, Testing, Security, Operations
   - Documentation, Release, Incident, Optimization
   - Framework Audit (meta-level testing)

3. **10-Gate Quality System (G1-G10)**
   - Lint, Format, Type Safety, Testing, Build
   - Security Scanning, Documentation, PR Review
   - Performance, Ship Readiness
   - Microsoft/NASA/Google engineering grade

4. **Git/GitHub Project Management Integration**
   - Branch strategy (feature/fix/refactor/docs/chore/hotfix)
   - Conventional commits
   - Issue tracking with templates
   - PR templates with comprehensive checklists
   - Commit authority matrix by agent

5. **Smart Routing & Optimization**
   - Express lanes for trivial tasks (bypass 3-4 agents)
   - Architectural bypass rules
   - Pattern-based routing decisions
   - Parallel quality gate execution

6. **AI Model Assignment (Cost Optimization)**
   - Claude Sonnet 4.5: Architecture, security, executive decisions (9 agents)
   - GPT-5 Mini: Implementation, docs, structured tasks (9 agents)
   - Hybrid: Escalation-based routing (10 agents)
   - Evidence-based escalation triggers (E1-E7)

7. **Framework Modernization Infrastructure**
   - Routing optimizer, task scheduler, streaming logger
   - Telemetry, monitoring dashboard, abort controls
   - Context caching, agent learning engine
   - Comprehensive TypeScript types

---

## Prerequisites

Before running this prompt, gather the following information about the target repository:

### Required Information

1. **Technology Stack**
   - Primary language(s): [e.g., TypeScript, Python, Java]
   - Framework(s): [e.g., Next.js 14, Django, Spring Boot]
   - UI library: [e.g., React, Vue, Angular]
   - Testing framework: [e.g., Jest, Pytest, JUnit]
   - Build tool: [e.g., npm, pnpm, poetry, gradle]
   - Linter: [e.g., ESLint, pylint, checkstyle]
   - Formatter: [e.g., Prettier, black, google-java-format]

2. **Repository Context**
   - Repository name: [e.g., MyProject]
   - Repository owner: [e.g., MyOrg]
   - Current branch: [typically main or master]
   - Primary domain: [e.g., eCommerce, SaaS, FinTech]
   - Business vertical: [e.g., retail, healthcare, finance]

3. **Development Environment**
   - Package manager: [e.g., npm, yarn, pnpm, poetry]
   - Node version (if applicable): [e.g., 18.x, 20.x]
   - Python version (if applicable): [e.g., 3.11]
   - Operating systems supported: [Windows, macOS, Linux]

4. **Deployment Context**
   - Deployment platform: [e.g., Vercel, AWS, GCP, Azure]
   - CI/CD: [e.g., GitHub Actions, GitLab CI, Jenkins]
   - Environment variables location: [e.g., .env.local, AWS Secrets Manager]

5. **Security & Compliance**
   - Compliance requirements: [e.g., PCI DSS, GDPR, HIPAA, SOC 2]
   - Sensitive data types: [e.g., PII, PHI, payment data]
   - Authentication provider: [e.g., Auth0, Firebase, custom]

---

## Execution Steps

### Phase 1: Directory Structure

Create the following directory structure in `.github/`:

```
.github/
├── agents/                        # 28 agent definition files
├── prompts/                       # 38 prompts in 13 categories
│   ├── architecture/
│   ├── discovery/
│   ├── documentation/
│   ├── framework-audit/
│   ├── implementation/
│   ├── incident/
│   ├── operations/
│   ├── optimization/
│   ├── planning/
│   ├── release/
│   ├── review/
│   ├── security/
│   └── testing/
├── .handoffs/                     # File-based handoff system
│   ├── 00-chief-of-staff/
│   ├── solution-architect/
│   ├── tech-lead/
│   ├── frontend-engineer/
│   ├── backend-engineer/
│   ├── qa-test-engineer/
│   ├── quality-director/
│   └── [25 more agent directories]
├── framework/                     # Framework implementation
│   ├── routing-optimizer.ts
│   ├── task-scheduler.ts
│   ├── parallel-quality-gates.ts
│   └── [11 more framework components]
├── framework-config/              # YAML configuration
│   ├── routing-rules.yaml
│   ├── agent-tiers.yaml
│   ├── slo-thresholds.yaml
│   └── quality-gates-parallel.yaml
├── DECISIONS/                     # Architecture Decision Records
│   └── framework/
├── issue-bodies/                  # GitHub issue templates
├── workflows/                     # GitHub Actions (if applicable)
├── AGENTS.md                      # Agent roster & routing guide
├── AI_COST_POLICY.md             # AI model cost optimization
├── AI_MODEL_ASSIGNMENT.md        # Agent → model mapping
├── copilot-instructions.md       # Main Copilot instructions
├── DECISIONS.md                  # ADR index
├── GIT_WORKFLOW.md               # Git/GitHub integration
├── ISSUE_TEMPLATE.md             # Issue template
├── PR_TEMPLATE.md                # Pull request template
├── QUALITY-GATES.md              # G1-G10 quality gates
├── RUNBOOK.md                    # Operational runbooks
├── SECURITY.md                   # Security policy
└── dependabot.yml                # Dependabot configuration
```

---

### Phase 2: Agent Creation (28 Agents)

Create 28 agent files in `.github/agents/` using this template structure:

#### Agent File Template

```chatagent
# Agent: [Agent Name]

> **Agent ID:** `[agent-id]` | **Agent #:** [00-99]
> **Role:** [Primary Role]
> **Designation:** [Core | Specialist | Executive | Quality]

---

## Mission

[1-2 sentence description of agent's purpose]

---

## Scope

- [Responsibility 1]
- [Responsibility 2]
- [Responsibility 3]

## Non-Scope

- [What this agent does NOT do] (→ [Responsible Agent])
- [What this agent does NOT do] (→ [Responsible Agent])

---

## Workflow Steps

### 1. [STEP NAME]

- [Sub-task 1]
- [Sub-task 2]

### 2. [STEP NAME]

- [Sub-task 1]
- [Sub-task 2]

[Continue for 3-6 steps]

---

## Artifacts Produced

- [Artifact 1]
- [Artifact 2]

---

## Definition of Done

- [ ] [Completion criterion 1]
- [ ] [Completion criterion 2]
- [ ] [Completion criterion 3]

---

## Quality Expectations

- [Quality standard 1]
- [Quality standard 2]

---

## Evidence Required

- [Evidence type 1]
- [Evidence type 2]

---

## Decision Making Rules

1. **[Condition]** → [Action/Route]
2. **[Condition]** → [Action/Route]

---

## When to Escalate

- [Escalation trigger 1] → [Target Agent]
- [Escalation trigger 2] → [Target Agent]

---

## Who to Call Next

| Situation       | Next Agent         | Prompt to Use                 |
| --------------- | ------------------ | ----------------------------- |
| [Situation 1]   | [agent-id]         | [prompt-category/prompt.md]   |
| [Situation 2]   | [agent-id]         | [prompt-category/prompt.md]   |

---

## Prompt Selection Logic

| Situation          | Prompt                        |
| ------------------ | ----------------------------- |
| [Situation 1]      | `[category]/[prompt].md`      |
| [Situation 2]      | `[category]/[prompt].md`      |

---

## Dispatch Format

**File-based handoff:**

\`\`\`powershell
$handoffDir = ".github/.handoffs/[target-agent-id]"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$handoffFile = "$handoffDir/handoff-$timestamp.md"

# Write handoff content to file
@"
# Handoff: [Task Title]

**From:** [sending-agent-id]
**To:** [receiving-agent-id]
**Date:** $(Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
**Dispatch Chain:** [agent1] → [agent2] → [you]
**Dispatch Depth:** N/10

---

## Original Request

[User's original request]

## Context

[Background, current state, history]

## Work Completed So Far

- [Previous work item 1]
- [Previous work item 2]

## Your Task

[Specific actionable instructions for receiving agent]

## Acceptance Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Resources

- File: [path/to/file.ext]
- Documentation: [link]

## Constraints

- [Constraint 1]
- [Constraint 2]

## Next Steps After Completion

Immediately dispatch to: [next-agent-id]
Using prompt: [category]/[prompt].md

"@ | Out-File -FilePath "$handoffFile" -Encoding UTF8

# Commit handoff file
git add "$handoffFile"
git commit -m "docs(handoff): dispatch task to [target-agent-id]"

# Dispatch to next agent
$repo = (Get-Location).Path
code chat -m [target-agent-id] --add-file "$repo" --add-file "$handoffFile" "Execute the task in your handoff file at $handoffFile"
\`\`\`

---

## Autonomous Execution Rule

When receiving a handoff file, you MUST:

1. ✅ Execute the assigned work immediately if actionable
2. ✅ Create and dispatch the next handoff automatically after completion
3. ✅ Escalate within chain if blocked

You MUST NOT:

- ❌ Ask a human for confirmation or next-step choice
- ❌ Return "to dispatch, run this command" instructions
- ❌ Stop at planning/analysis when implementation or handoff remains

---

## Git Integration

### Commit Authority

- **Can commit:** [YES/NO]
- **Can create branches:** [YES/NO]
- **Can create PRs:** [YES/NO (Quality Director only)]
- **Commit to branches:** [main (exceptions only) | feature branches | see GIT_WORKFLOW.md]

### Commit Pattern

```bash
# Before starting work
git pull origin [branch-name]

# After each meaningful unit (≤3 files or 1 vertical slice)
git add [files]
git commit -m "<type>(<scope>): <subject>

[body]

[footer]"

# Push to remote
git push origin [branch-name]

# Update GitHub issue with progress
# (Comment on issue describing what was committed)
```

### Conventional Commit Types

- `feat` — New feature
- `fix` — Bug fix
- `refactor` — Code restructuring (no behavior change)
- `perf` — Performance improvement
- `test` — Adding/updating tests
- `docs` — Documentation only
- `chore` — Build process, dependency updates
- `ci` — CI/CD changes
- `style` — Formatting only

---

## AI Model Assignment

**Primary Model:** [Claude Sonnet 4.5 | GPT-5 Mini]
**Fallback Model:** [GPT-5 Mini | Claude Sonnet 4.5]
**Reasoning Complexity:** [CRITICAL | HIGH | MEDIUM | LOW]

**Rationale:** [Why this model is assigned to this agent]

**Escalation Triggers:** [If GPT-5 Mini primary, list E1-E7 triggers that escalate to Sonnet]

---

## Examples

### Example 1: [Scenario Name]

**Input:**
[Example input]

**Process:**
1. [Step 1]
2. [Step 2]

**Output:**
[Example output/handoff]

---

## Agent-Specific Context

[Any additional context specific to this agent's domain]
[Tech stack specifics, domain knowledge, references]

```

---

#### Agent Roster (28 Agents)

Create these 28 agent files:

| #  | Agent ID                     | Role                       | Tier         | Model Primary     |
|----|------------------------------|----------------------------|--------------|-------------------|
| 00 | `00-chief-of-staff`          | Chief of Staff             | Core         | Claude Sonnet 4.5 |
| 01 | `product-owner`              | Product Owner              | Specialist   | GPT-5 Mini → Sonnet |
| 02 | `program-manager`            | Program Manager            | Specialist   | GPT-5 Mini → Sonnet |
| 03 | `stakeholder-executive`      | Stakeholder Executive      | Executive    | Claude Sonnet 4.5 |
| 10 | `solution-architect`         | Solution Architect         | Core         | Claude Sonnet 4.5 |
| 11 | `tech-lead`                  | Tech Lead                  | Core         | Claude Sonnet 4.5 |
| 20 | `frontend-engineer`          | Frontend Engineer          | Core         | GPT-5 Mini        |
| 21 | `backend-engineer`           | Backend Engineer           | Core         | GPT-5 Mini        |
| 22 | `platform-engineer`          | Platform Engineer          | Specialist   | GPT-5 Mini        |
| 23 | `data-engineer`              | Data Engineer              | Specialist   | GPT-5 Mini        |
| 24 | `ml-engineer`                | ML Engineer                | Specialist   | GPT-5 Mini → Sonnet |
| 30 | `ux-designer`                | UX Designer                | Specialist   | GPT-5 Mini → Sonnet |
| 31 | `accessibility-specialist`   | Accessibility Specialist   | Specialist   | GPT-5 Mini → Sonnet |
| 40 | `qa-test-engineer`           | QA/Test Engineer           | Core         | GPT-5 Mini → Sonnet |
| 41 | `performance-engineer`       | Performance Engineer       | Specialist   | GPT-5 Mini → Sonnet |
| 50 | `security-engineer`          | Security Engineer          | Core         | Claude Sonnet 4.5 |
| 51 | `privacy-compliance-officer` | Privacy Compliance Officer | Specialist   | Claude Sonnet 4.5 |
| 60 | `devops-engineer`            | DevOps Engineer            | Specialist   | GPT-5 Mini        |
| 61 | `sre-engineer`               | SRE Engineer               | Specialist   | GPT-5 Mini → Sonnet |
| 70 | `documentation-engineer`     | Documentation Engineer     | Core         | GPT-5 Mini        |
| 71 | `support-readiness-engineer` | Support Readiness Engineer | Specialist   | GPT-5 Mini        |
| 80 | `legal-counsel`              | Legal Counsel              | Enterprise   | GPT-5 Mini → Sonnet |
| 81 | `finance-procurement`        | Finance & Procurement      | Enterprise   | GPT-5 Mini        |
| 82 | `localization-specialist`    | Localization Specialist    | Enterprise   | GPT-5 Mini        |
| 83 | `incident-commander`         | Incident Commander         | Crisis       | Claude Sonnet 4.5 |
| 84 | `red-team`                   | Red Team                   | Security     | Claude Sonnet 4.5 |
| 90 | `90-framework-auditor`       | Framework Auditor          | Meta         | Claude Sonnet 4.5 |
| 99 | `quality-director`           | Quality Director           | Quality      | Claude Sonnet 4.5 |

**For each agent, customize:**
- Mission statement
- Scope (2-5 responsibilities)
- Non-scope (what they DON'T do)
- Workflow steps (3-6 steps)
- Artifacts produced
- Definition of Done
- Decision making rules (tech stack specific)
- Routing logic (which agent to call next)
- Git commit authority
- Examples (domain-specific)

---

### Phase 3: Prompt Library (38 Prompts in 13 Categories)

Create prompt files in `.github/prompts/` using this template:

#### Prompt File Template

```prompt
# [Prompt Name]

> **Category:** [Category Name]
> **File:** `[category]/[prompt-name].prompt.md`

---

## Purpose

[1-2 sentences describing what this prompt accomplishes]

## When to Use

- [Trigger condition 1]
- [Trigger condition 2]

## Inputs Required

- [Input 1]
- [Input 2]

## Outputs Required

1. **[Output Type 1]**

   ```[language]
   [Example structure]
   ```

2. **[Output Type 2]**

[Continue for all outputs]

## Quality Expectations

- [Quality standard 1]
- [Quality standard 2]

## Failure Cases

- [Failure scenario 1] → [Remedy]
- [Failure scenario 2] → [Remedy]

## Evidence Expectations

- [Evidence type 1]
- [Evidence type 2]

## Example Output

\`\`\`[language]
[Concrete example of expected output]
\`\`\`

## Acceptance Criteria

- [ ] [AC 1]
- [ ] [AC 2]

---

## Tech Stack Integration

Adapt this prompt to your stack:

**[Primary Language]:**
[Language-specific guidance]

**[Primary Framework]:**
[Framework-specific guidance]

**[Testing Framework]:**
[Testing-specific guidance]

```

---

#### Prompt Catalog (38 Prompts)

**1. discovery/ (3 prompts)**
- `repo-scan.prompt.md` — Scan repository structure, identify patterns
- `techstack-detection.prompt.md` — Detect technology stack, versions, dependencies
- `risk-analysis.prompt.md` — Assess technical risk, complexity, debt

**2. architecture/ (4 prompts)**
- `domain-model.prompt.md` — Create domain entities, relationships, state machines
- `system-design.prompt.md` — Design end-to-end architecture
- `adr-generation.prompt.md` — Create Architecture Decision Records
- `api-contract.prompt.md` — Define API schemas (request/response/error)

**3. planning/ (2 prompts)**
- `slice-planning.prompt.md` — Break epics into vertical slices
- `acceptance-criteria.prompt.md` — Define testable acceptance criteria

**4. implementation/ (2 prompts)**
- `vertical-slice.prompt.md` — Implement one vertical slice (full stack)
- `refactor.prompt.md` — Refactor code while preserving behavior

**5. review/ (2 prompts)**
- `microsoft-grade-pr-review.prompt.md` — Rigorous PR review (G1-G10 gates)
- `gap-analysis.prompt.md` — Identify gaps between implementation and model

**6. testing/ (2 prompts)**
- `test-gap.prompt.md` — Identify missing test coverage
- `e2e-design.prompt.md` — Design end-to-end test scenarios

**7. security/ (2 prompts)**
- `threat-model.prompt.md` — Create STRIDE threat model
- `dependency-review.prompt.md` — Audit dependencies for vulnerabilities

**8. operations/ (6 prompts)**
- `deployment-plan.prompt.md` — Plan gradual rollout strategy
- `observability.prompt.md` — Configure metrics, SLOs, alerts
- `git-commit.prompt.md` — Guide agents through committing code
- `create-pr.prompt.md` — Guide Quality Director through PR creation
- `manage-issue.prompt.md` — Guide issue creation, labeling, lifecycle
- `branch-strategy.prompt.md` — Guide branch creation, naming, management

**9. documentation/ (2 prompts)**
- `runbook.prompt.md` — Create operational runbooks
- `readme-update.prompt.md` — Update README and documentation

**10. release/ (2 prompts)**
- `release-notes.prompt.md` — Generate release notes from commits
- `rollback-plan.prompt.md` — Document rollback procedures

**11. incident/ (2 prompts)**
- `incident-response.prompt.md` — Triage and respond to production incidents
- `postmortem.prompt.md` — Conduct blameless postmortems

**12. optimization/ (2 prompts)**
- `performance-audit.prompt.md` — Audit performance, identify bottlenecks
- `repo-health.prompt.md` — Assess repository health metrics

**13. framework-audit/ (5 prompts)**
- `mode-selection.prompt.md` — Choose audit mode (synthetic, real, monitoring, scoring)
- `synthetic-task-battery.prompt.md` — Generate and execute test tasks
- `monitoring-rubric.prompt.md` — Measure framework health metrics
- `scoring-metrics.prompt.md` — Score framework on 14 dimensions
- `audit-plan.prompt.md` — Create comprehensive audit plan

**Plus 2 utility prompts:**
- `model-routing.prompt.md` — Guide agent model selection (Sonnet vs Mini)
- `create.prompt.md` — Create new components/features
- `convert.prompt.md` — Convert between formats/patterns
- `implement.prompt.md` — General implementation guide
- `fix_pr.prompt.md` — Fix failing PR checks
- `review_pr.prompt.md` — Review pull requests

---

### Phase 4: Quality Gates (G1-G10)

Create `.github/QUALITY-GATES.md` with these 10 gates:

```markdown
# Quality Gates

> **Version:** 1.0.0
> **Standard:** Microsoft/NASA/Google Engineering Grade

---

## Gate Overview

Every change must pass through 10 quality gates before reaching production.

\`\`\`
Code → [G1: Lint] → [G2: Format] → [G3: Type] → [G4: Test] → [G5: Build]
  → [G6: Security] → [G7: Docs] → [G8: PR] → [G9: Perf] → [G10: Ship]
\`\`\`

---

## G1: Lint Gate

| Check             | Tool      | Threshold | Blocking |
|-------------------|-----------|-----------|----------|
| [Linter] errors   | [Tool]    | 0         | YES      |
| [Linter] warnings | [Tool]    | 0         | YES      |

### Commands

\`\`\`bash
[lint command]          # Must exit 0
[lint fix command]      # Auto-fix then verify
\`\`\`

---

## G2: Format Gate

| Check                | Tool         | Threshold  | Blocking |
|----------------------|--------------|------------|----------|
| [Formatter] conformance | [Tool]    | 100% files | YES      |

### Commands

\`\`\`bash
[format check command]  # Must exit 0
[format command]        # Auto-fix then verify
\`\`\`

---

## G3: Type Safety Gate

| Check             | Tool    | Threshold | Blocking |
|-------------------|---------|-----------|----------|
| Type check        | [Tool]  | 0 errors  | YES      |

### Commands

\`\`\`bash
[typecheck command]     # Must exit 0
\`\`\`

---

## G4: Test Gate

| Check            | Tool    | Threshold | Blocking |
|------------------|---------|-----------|----------|
| Test pass rate   | [Tool]  | 100%      | YES      |
| Line coverage    | [Tool]  | ≥80%      | YES      |
| Branch coverage  | [Tool]  | ≥75%      | YES      |

### Commands

\`\`\`bash
[test command]              # Must exit 0
[test command --coverage]   # Show coverage report
\`\`\`

---

## G5: Build Gate

| Check          | Tool    | Threshold        | Blocking |
|----------------|---------|------------------|----------|
| Production build | [Tool] | Successful build | YES      |

### Commands

\`\`\`bash
[build command]          # Must exit 0
\`\`\`

---

## G6: Security Gate

| Check                | Tool         | Threshold | Blocking |
|----------------------|--------------|-----------|----------|
| Secret detection     | [Tool]       | 0         | YES      |
| Dependency vulnerabilities | [Tool] | 0 high/critical | YES |

### Commands

\`\`\`bash
[secret scan command]
[dependency audit command]
\`\`\`

---

## G7: Documentation Gate

| Check               | Threshold                | Blocking |
|---------------------|--------------------------|----------|
| Public APIs documented | 100%                  | YES      |
| README updated      | If user-facing change    | YES      |

---

## G8: PR Review Gate

| Check             | Threshold      | Blocking |
|-------------------|----------------|----------|
| Approvals         | ≥1 (from Chief of Staff or Quality Director) | YES |
| Conversations resolved | All       | YES      |

---

## G9: Performance Gate

| Check             | Tool/Metric  | Threshold    | Blocking |
|-------------------|--------------|--------------|----------|
| [Perf metric 1]   | [Tool]       | [Threshold]  | YES      |
| Bundle size       | [Tool]       | No regression >5% | YES |

---

## G10: Ship Readiness Gate

| Check                  | Threshold    | Blocking |
|------------------------|--------------|----------|
| All gates G1-G9 pass   | 100%         | YES      |
| Rollback plan documented | Required   | YES      |
| Quality Director approval | Required  | YES      |
```

**Customize for your stack:**
- Replace `[Tool]` with actual tools (ESLint, Prettier, tsc, Jest, Webpack, etc.)
- Replace `[command]` with actual commands (`npm run lint`, `mvn test`, `pytest`, etc.)
- Add stack-specific gates (e.g., mobile: `G6.5: iOS/Android build`)

---

### Phase 5: Git Workflow Integration

Create `.github/GIT_WORKFLOW.md`:

```markdown
# Git & GitHub Project Management Workflow

**Version:** 1.0.0
**Owner:** Chief of Staff

---

## Branch Naming Convention

\`\`\`
<type>/<issue-number>-<short-description>

Examples:
- feature/42-user-authentication
- fix/123-payment-validation-bug
- refactor/456-api-layer-cleanup
\`\`\`

**Types:** feature, fix, refactor, docs, chore, hotfix

---

## Agent Commit Authority Matrix

| Agent Role         | Can Create Branches | Can Merge to Main | Can Create PRs |
|--------------------|---------------------|-------------------|----------------|
| Chief of Staff     | ✅ Yes              | ✅ Yes (emergency)| ✅ Yes         |
| Tech Lead          | ✅ Yes              | ⛔ No             | ⛔ No          |
| Solution Architect | ✅ Yes              | ⛔ No             | ⛔ No          |
| Engineers          | ⛔ No               | ⛔ No             | ⛔ No          |
| Quality Director   | ✅ Yes (via PR)     | ✅ Yes (via PR)   | ✅ Yes (ONLY)  |

**Rule:** Only Quality Director creates pull requests.

---

## Conventional Commit Format

\`\`\`
<type>(<scope>): <subject>

[optional body]

[optional footer]
\`\`\`

**Types:** feat, fix, refactor, perf, test, docs, chore, ci, style

**Examples:**

\`\`\`bash
git commit -m "feat(auth): add OAuth2 provider support"
git commit -m "fix(cart): resolve checkout button disabled state bug

Fixes issue where users with >10 items couldn't checkout
Closes #123"
\`\`\`

---

## Commit Workflow

\`\`\`bash
# Before starting work
git pull origin <branch-name>

# After each meaningful unit (≤3 files or 1 vertical slice)
git add <files>
git commit -m "<type>(<scope>): <subject>"
git push origin <branch-name>

# Update GitHub issue with progress comment
\`\`\`

---

## PR Creation (Quality Director Only)

\`\`\`bash
# Only after ALL G1-G10 quality gates pass
# Quality Director creates PR via GitHub CLI or UI
gh pr create --title "[type]: [description]" --body-file .github/PR_TEMPLATE.md
\`\`\`

---

## GitHub Issue Management

- **Creation:** Chief of Staff creates issues from user requests
- **Assignment:** Tech Lead assigns to feature branch
- **Tracking:** Agents comment on issues with progress updates
- **Closure:** Automatic when PR is merged (use "Fixes #123" in PR body)
```

---

### Phase 6: AI Model Assignment

Create `.github/AI_MODEL_ASSIGNMENT.md`:

```markdown
# AI Model Assignment Matrix

> **Last Updated:** [Date]
> **Authority:** Chief of Staff + Quality Director

---

## Assignment Philosophy

| Principle                | Rule                                                                  |
|--------------------------|-----------------------------------------------------------------------|
| **Mini First**           | Default to GPT-5 Mini unless task provably requires deep reasoning    |
| **Escalate on Evidence** | Upgrade to Claude Sonnet 4.5 only when triggers fire                  |
| **No Ping-Pong**         | An agent may escalate once per task                                    |

---

## Tier 1 — Claude Sonnet 4.5 Primary (9 Agents)

| Agent                        | Rationale                                          |
|------------------------------|----------------------------------------------------|
| `00-chief-of-staff`          | Cross-domain routing, loop prevention              |
| `solution-architect`         | Domain modeling, system design, trade-off analysis |
| `stakeholder-executive`      | Strategic business decisions, ROI evaluation       |
| `tech-lead`                  | Implementation architecture, cross-cutting concerns|
| `security-engineer`          | STRIDE threat modeling, compliance verification    |
| `privacy-compliance-officer` | [Compliance] analysis, PII classification          |
| `incident-commander`         | Crisis triage, rapid root cause hypothesis         |
| `red-team`                   | Adversarial creative thinking, novel attack vectors|
| `quality-director`           | Final ship/no-ship authority, holistic quality     |

---

## Tier 2 — GPT-5 Mini Primary (9 Agents)

| Agent                        | Rationale                                 |
|------------------------------|-------------------------------------------|
| `frontend-engineer`          | Canonical pattern implementation          |
| `backend-engineer`           | API route implementation, SDK integration |
| `platform-engineer`          | CI/CD pipeline, build systems             |
| `data-engineer`              | Data pipelines, migrations                |
| `devops-engineer`            | Deployment config, environment management |
| `documentation-engineer`     | Technical docs, API references            |
| `support-readiness-engineer` | Runbooks, FAQ, training materials         |
| `localization-specialist`    | i18n configuration, translation management|
| `finance-procurement`        | Cost analysis, budget reporting           |

---

## Tier 3 — Hybrid (GPT-5 Mini → Sonnet 4.5 Escalation) (10 Agents)

| Agent                      | Escalate When                                           |
|----------------------------|---------------------------------------------------------|
| `product-owner`            | Requirements are ambiguous or conflicting               |
| `program-manager`          | Dependency conflicts or timeline re-planning            |
| `ml-engineer`              | Model architecture decisions or novel algorithms        |
| `ux-designer`              | Novel interaction patterns or accessibility conflicts   |
| `accessibility-specialist` | Novel ARIA patterns or conflicting requirements         |
| `qa-test-engineer`         | Test strategy design or flaky test root cause analysis |
| `performance-engineer`     | Optimization architecture or trade-off decisions        |
| `sre-engineer`             | Capacity planning or novel failure modes                |
| `legal-counsel`            | Novel IP questions or regulatory ambiguity              |

---

## Escalation Triggers (GPT-5 Mini → Claude Sonnet 4.5)

| #  | Trigger                            | Detection                                    |
|----|------------------------------------|----------------------------------------------|
| E1 | **3 failed attempts**              | Same task failed 3 times                     |
| E2 | **Conflicting ADR decisions**      | Two or more ADRs contradict                  |
| E3 | **Security/privacy risk detected** | Affects [compliance], PII, or auth           |
| E4 | **Unexpected test instability**    | Previously passing tests now flaky           |
| E5 | **Architectural uncertainty**      | Cannot determine component boundary          |
| E6 | **Ambiguous requirements**         | Multiple valid interpretations               |
| E7 | **Cross-domain conflict**          | Optimization degrades another area           |
```

**Replace `[Compliance]` with your domain's compliance requirements (PCI, GDPR, HIPAA, etc.)**

---

### Phase 7: Framework Configuration Files

Create YAML configuration files in `.github/framework-config/`:

#### `routing-rules.yaml`

```yaml
# Routing Rules Configuration
version: 1.0.0
updated: [DATE]

# Express Lane Rules
express_lanes:
  - name: Lint Fixes
    condition:
      type: Bug
      scope: Small
      description_matches: '/(lint|format)/i'
    route_to: [frontend-engineer or backend-engineer based on stack]
    bypass: [product-owner, solution-architect, tech-lead, qa-test-engineer]
    reason: 'Lint fixes are mechanical'
    expected_duration: 5min

  - name: Documentation Updates
    condition:
      type: Docs
      scope: Small
    route_to: documentation-engineer
    bypass: [product-owner, solution-architect, tech-lead, qa-test-engineer]
    reason: 'Simple docs updates'
    expected_duration: 10min

  - name: Typo Fixes
    condition:
      description_matches: '/(typo|spelling)/i'
      scope: Small
    route_to: documentation-engineer
    bypass: [all except quality-director]
    reason: 'Typos are trivial'
    expected_duration: 3min

# Bypass Rules (Partial Routing)
bypass_rules:
  - name: Small Bug Fixes
    condition:
      type: Bug
      scope: Small
      priority: [P2, P3]
    skip_agents: [product-owner, solution-architect]
    start_at: tech-lead
    reason: "Small bugs don't need architecture review"

  - name: Small Components
    condition:
      type: Feature
      scope: Small
      description_matches: '/component|module|utility/i'
    skip_agents: [product-owner, solution-architect]
    start_at: tech-lead
    reason: 'Small components follow existing patterns'
```

#### `agent-tiers.yaml`

```yaml
# Agent Tier Configuration
version: 1.0.0
updated: [DATE]

# Core Agents (Always Loaded)
core:
  - id: 00-chief-of-staff
    maxConcurrentTasks: 10
  - id: solution-architect
    maxConcurrentTasks: 3
  - id: tech-lead
    maxConcurrentTasks: 5
  - id: [frontend/backend]-engineer
    maxConcurrentTasks: 3
  - id: qa-test-engineer
    maxConcurrentTasks: 3
  - id: quality-director
    maxConcurrentTasks: 3
  - id: documentation-engineer
    maxConcurrentTasks: 2

# Specialist Agents (Loaded On-Demand)
specialist:
  - id: product-owner
    maxConcurrentTasks: 1
    loadTriggers: [new feature requests, requirements clarification]
  - id: security-engineer
    maxConcurrentTasks: 2
    loadTriggers: [security concerns, compliance audits]
  - id: performance-engineer
    maxConcurrentTasks: 1
    loadTriggers: [performance issues, optimization]
  # [Add remaining specialists]
```

#### `slo-thresholds.yaml`

```yaml
# SLO Threshold Configuration
version: 1.0.0
updated: [DATE]

# Task Execution SLOs
task_execution:
  simple_task_p95: 15min    # 95% of simple tasks complete in ≤15 min
  medium_task_p95: 60min    # 95% of medium tasks complete in ≤60 min
  large_task_p95: 180min    # 95% of large tasks complete in ≤180 min

# Quality Gate SLOs
quality_gates:
  parallel_execution_time_p95: 3min  # G1-G4 parallel < 3 min
  total_gate_time_p95: 5min          # All gates < 5 min

# Routing SLOs
routing:
  express_lane_usage_target: 30%     # ≥30% of tasks use express lanes
  average_handoffs_target: 3.5       # ≤3.5 handoffs per task

# Framework Health SLOs
framework_health:
  agent_response_time_p95: 30s       # Agent responds within 30s
  handoff_success_rate: 99%          # 99% of handoffs succeed
  quality_gate_pass_rate: 95%        # 95% of tasks pass all gates
```

---

### Phase 8: Governance Documents

Create these governance files in `.github/`:

#### `AGENTS.md`

```markdown
# Engineering Organization Roster

**Total Agents: 28**

## Organization Chart

\`\`\`
                    ┌──────────────────────┐
                    │  00 CHIEF OF STAFF   │  ← SINGLE ENTRY POINT
                    └──────────┬───────────┘
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
   [Product Owner]     [Solution Architect]    [Tech Lead]
           │                   │                   │
           └───────────────────┴───────────────────┘
                               ▼
                    [Engineering Teams]
                               ▼
                    [Quality Director]  ← FINAL AUTHORITY
\`\`\`

## Agent Roster

[28-row table with: #, Agent ID, Role, Domain, Agent File]

## Routing Guide

| Situation          | Route To           | Prompt to Use            |
|--------------------|--------------------|--------------------------|
| New feature        | 00-chief-of-staff  | discovery/repo-scan.md   |
| Bug report         | 00-chief-of-staff  | discovery/risk-analysis.md |
| Architecture Q     | solution-architect | architecture/system-design.md |
| [Add 10+ more routing rules]

## Escalation Path

\`\`\`
Agent → Tech Lead → Solution Architect → Chief of Staff → Stakeholder Executive
\`\`\`
```

#### `copilot-instructions.md`

```markdown
# Copilot Instructions - [Project Name]

> **Auto-generated from:** \`.github/\` framework
> **Last Updated:** [Date]
> **Status:** Active

---

## 🎯 Project Overview

**Project:** [Project Name]
**Domain:** [Business Domain]
**Tech Stack:** [Primary Tech Stack]

---

## 🤖 Engineering Organization (28 Agents)

This repository is operated by a **28-agent Copilot engineering organization**.

**Entry Point:** Chief of Staff (agent \`00-chief-of-staff\`)

**Dispatch Format:**

\`\`\`powershell
$repo = (Get-Location).Path
$handoff = ".github/.handoffs/<agent-id>/handoff-<timestamp>.md"
code chat -m <agent-id> --add-file $repo --add-file $handoff "Execute task in $handoff"
\`\`\`

See: [AGENTS.md](../AGENTS.md)

---

## 📋 Quality Gates (G1-G10)

All code must pass 10 quality gates:

1. **G1: Lint** — 0 errors
2. **G2: Format** — 100% formatted
3. **G3: Type Safety** — 0 type errors
4. **G4: Tests** — 100% pass, ≥80% coverage
5. **G5: Build** — Successful production build
6. **G6: Security** — No secrets, no vulnerabilities
7. **G7: Documentation** — Public APIs documented
8. **G8: PR Review** — ≥1 approval
9. **G9: Performance** — No regressions
10. **G10: Ship Readiness** — Quality Director approval

See: [QUALITY-GATES.md](../QUALITY-GATES.md)

---

## 🌳 Git Workflow

**Branch Convention:** \`<type>/<issue>-<description>\`
**Commit Convention:** \`<type>(<scope>): <subject>\`
**PR Authority:** Quality Director ONLY

See: [GIT_WORKFLOW.md](../GIT_WORKFLOW.md)

---

## 🤔 AI Model Assignment

- **Claude Sonnet 4.5:** Architecture, security, executive (9 agents)
- **GPT-5 Mini:** Implementation, docs, structured (9 agents)
- **Hybrid:** Escalation-based (10 agents)

See: [AI_MODEL_ASSIGNMENT.md](../AI_MODEL_ASSIGNMENT.md)
```

#### `SECURITY.md`

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| [Current] | :white_check_mark: |

## Reporting a Vulnerability

**DO NOT** open a public issue for security vulnerabilities.

**Instead:**

1. Email: [security@example.com]
2. Or use GitHub Security Advisories
3. Or contact: [Security Engineer contact]

**Response Time:** Within 24 hours

## Security Practices

- All secrets in environment variables (never in code)
- Dependencies audited weekly (Dependabot)
- OWASP Top 10 reviewed quarterly
- [Compliance] compliance maintained ([PCI/GDPR/HIPAA/SOC2])

## Compliance

- [List relevant compliance standards]
- [List sensitive data types handled]
- [List authentication/authorization mechanisms]
```

#### `RUNBOOK.md`

```markdown
# Operational Runbooks

## Critical Paths

### [Critical Path 1: e.g., User Checkout]

**Symptoms:** [How you detect issues]
**Impact:** [Business impact]
**Resolution:**

1. [Step 1]
2. [Step 2]

**Prevention:** [How to prevent recurrence]

### [Critical Path 2: e.g., Payment Processing]

[Same structure]

## Incident Response

See: [prompts/incident/incident-response.prompt.md](incident/incident-response.prompt.md)
```

#### `DECISIONS.md`

```markdown
# Architecture Decision Records (ADRs)

## ADR Index

| ADR # | Title | Status | Date |
|-------|-------|--------|------|
| ADR-001 | [Decision Title] | Accepted | [Date] |

## ADR Template

See: [prompts/architecture/adr-generation.prompt.md](architecture/adr-generation.prompt.md)

## Creating ADRs

\`\`\`bash
# Solution Architect creates ADRs for significant decisions
# Format: ADR-XXX-short-title.md
# Location: .github/DECISIONS/[category]/
\`\`\`
```

---

### Phase 9: Issue & PR Templates

#### `.github/ISSUE_TEMPLATE.md`

```markdown
---
name: Issue Template
about: Standard issue template
---

## Issue Type

- [ ] 🐛 Bug Report
- [ ] ✨ Feature Request
- [ ] 🔧 Technical Debt
- [ ] 📄 Documentation
- [ ] 🔒 Security

## Priority

- [ ] P0 — Critical
- [ ] P1 — High
- [ ] P2 — Normal
- [ ] P3 — Low

## Description

[Clear description]

## For Feature Requests

### User Story

As a [user], I want [goal] so that [benefit].

### Acceptance Criteria

- [ ] AC 1
- [ ] AC 2

## Technical Notes

### Affected Components

[Components/files]

### Dependencies

[Other issues]

## Definition of Done

- [ ] Implementation complete
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Quality gates passing
```

#### `.github/PR_TEMPLATE.md`

```markdown
## Description

[What this PR does]

## Type of Change

- [ ] feat — New feature
- [ ] fix — Bug fix
- [ ] refactor — Code restructuring
- [ ] docs — Documentation

## Related Issues

Fixes #

## Quality Gates

- [ ] \`[lint command]\` — 0 errors
- [ ] \`[format command]\` — All files formatted
- [ ] \`[typecheck command]\` — 0 type errors
- [ ] \`[test command]\` — All tests pass
- [ ] \`[build command]\` — Successful build

## Documentation

- [ ] README updated (if applicable)
- [ ] API docs updated (if applicable)

## Rollback Plan

[How to revert if needed]
```

---

### Phase 10: Framework Implementation Files

Create TypeScript/JavaScript files in `.github/framework/`:

#### `types.ts`

```typescript
// Framework Type Definitions

export type TaskType = 'Feature' | 'Bug' | 'Refactor' | 'Docs' | 'Security' | 'Performance' | 'Incident'
export type Priority = 'P0' | 'P1' | 'P2' | 'P3'
export type Scope = 'Small' | 'Medium' | 'Large' | 'XL'
export type TaskStatus = 'pending' | 'in-progress' | 'blocked' | 'completed' | 'failed' | 'aborted'

export interface Task {
  id: string
  type: TaskType
  priority: Priority
  scope: Scope
  title: string
  description: string
  acceptanceCriteria: string[]
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  status: TaskStatus
  assignedAgent?: string
  dispatchChain: string[]
  dispatchDepth: number
  githubIssue?: number
  metadata?: Record<string, unknown>
}

export interface RoutingDecision {
  targetAgent: string
  skipAgents: string[]
  reason: string
  confidence: number
  expressLane: boolean
}

export interface Handoff {
  from: string
  to: string
  task: Task
  context: string
  workCompleted: string[]
  nextSteps: string[]
  timestamp: Date
}

// [Add more types as needed]
```

#### `routing-optimizer.ts`

```typescript
// Smart Routing Optimizer
import { Task, RoutingDecision } from './types'

export function determineRoute(task: Task): RoutingDecision {
  // Express Lane: Documentation
  if (task.type === 'Docs' && task.scope === 'Small') {
    return {
      targetAgent: 'documentation-engineer',
      skipAgents: ['product-owner', 'solution-architect', 'tech-lead'],
      reason: 'Docs updates are self-contained',
      confidence: 0.95,
      expressLane: true,
    }
  }

  // Express Lane: Small Bugs
  if (task.type === 'Bug' && task.scope === 'Small') {
    const engineer = inferEngineer(task.description)
    return {
      targetAgent: engineer,
      skipAgents: ['product-owner', 'solution-architect', 'tech-lead', 'qa-test-engineer'],
      reason: 'Small bug fix - direct to engineer',
      confidence: 0.9,
      expressLane: true,
    }
  }

  // Bypass Architecture: Small Features
  if (task.scope === 'Small' && task.type === 'Feature' && !requiresArchitecture(task.description)) {
    return {
      targetAgent: 'tech-lead',
      skipAgents: ['product-owner', 'solution-architect'],
      reason: 'Simple feature - Tech Lead can plan',
      confidence: 0.85,
      expressLane: false,
    }
  }

  // Default: Full chain
  return {
    targetAgent: 'product-owner',
    skipAgents: [],
    reason: 'Complex task - full planning required',
    confidence: 1.0,
    expressLane: false,
  }
}

function requiresArchitecture(description: string): boolean {
  const keywords = ['architecture', 'database', 'API', 'security', 'integration', 'migration', 'scalability']
  return keywords.some((kw) => description.toLowerCase().includes(kw))
}

function inferEngineer(description: string): string {
  // Customize based on your stack
  if (/(UI|component|page|frontend)/i.test(description)) return 'frontend-engineer'
  if (/(API|endpoint|backend|server)/i.test(description)) return 'backend-engineer'
  if (/(infra|deploy|CI|CD)/i.test(description)) return 'platform-engineer'
  return 'tech-lead' // fallback
}
```

#### `parallel-quality-gates.ts`

```typescript
// Parallel Quality Gate Execution
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface GateResult {
  gate: string
  passed: boolean
  output: string
  duration: number
}

export async function runQualityGates(): Promise<GateResult[]> {
  const startTime = Date.now()

  // G1-G4: Run in parallel (independent)
  const parallelGates = await Promise.allSettled([
    runGate('G1: Lint', 'npm run lint'), // Customize command
    runGate('G2: Format', 'npm run format:check'),
    runGate('G3: Type Safety', 'npm run typecheck'),
    runGate('G4: Tests', 'npm test'),
  ])

  // G5: Build (depends on G1-G4 passing)
  const g1g4Passed = parallelGates.every((result) => result.status === 'fulfilled' && result.value.passed)

  const results: GateResult[] = parallelGates.map((result) =>
    result.status === 'fulfilled' ? result.value : { gate: 'Unknown', passed: false, output: 'Rejected', duration: 0 }
  )

  if (g1g4Passed) {
    const g5 = await runGate('G5: Build', 'npm run build')
    results.push(g5)

    if (g5.passed) {
      // G6-G9: Run in parallel
      const finalGates = await Promise.allSettled([
        runGate('G6: Security', 'npm audit --audit-level=high'),
        runGate('G7: Documentation', 'echo "Docs check placeholder"'),
        runGate('G8: PR Review', 'echo "Manual review"'),
        runGate('G9: Performance', 'echo "Perf check placeholder"'),
      ])

      finalGates.forEach((result) => {
        if (result.status === 'fulfilled') results.push(result.value)
      })
    }
  }

  const totalDuration = Date.now() - startTime
  console.log(`Total quality gate execution: ${totalDuration}ms`)

  return results
}

async function runGate(name: string, command: string): Promise<GateResult> {
  const start = Date.now()
  try {
    const { stdout, stderr } = await execAsync(command)
    return {
      gate: name,
      passed: true,
      output: stdout || stderr,
      duration: Date.now() - start,
    }
  } catch (error: any) {
    return {
      gate: name,
      passed: false,
      output: error.message,
      duration: Date.now() - start,
    }
  }
}
```

**Additional framework files to create (stub implementations):**
- `task-scheduler.ts` — Parallel task execution
- `streaming-logger.ts` — Real-time progress logging
- `monitoring-dashboard.ts` — Visual dashboard
- `task-controller.ts` — Abort/resume capability
- `handoff-v2.ts` — Lightweight handoff format
- `context-cache.ts` — Agent context pre-warming
- `telemetry.ts` — Metrics and analytics
- `agent-learning.ts` — Adaptive pattern recognition
- `README.md` — Framework documentation

---

### Phase 11: Handoff System

Create `.github/.handoffs/README.md`:

```markdown
# File-Based Handoff System

**Purpose:** Reliable multi-line prompt delivery between agents

## Directory Structure

\`\`\`
.github/.handoffs/
├── README.md                      ← This file
├── 00-chief-of-staff/
│   └── .gitkeep
├── product-owner/
│   └── .gitkeep
[... 26 more agent directories with .gitkeep files]
\`\`\`

## Handoff Protocol

### Step 1: Write Handoff File

\`\`\`powershell
$handoffDir = ".github/.handoffs/<target-agent-id>"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$handoffFile = "$handoffDir/handoff-$timestamp.md"

@"
# Handoff: [Title]

**From:** [sending-agent-id]
**To:** [receiving-agent-id]
**Date:** $(Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
**Dispatch Chain:** [chain]
**Dispatch Depth:** N/10

---

## Original Request

[User request]

## Context

[Background]

## Work Completed So Far

- [Item 1]
- [Item 2]

## Your Task

[Specific instructions]

## Acceptance Criteria

- [ ] [AC 1]
- [ ] [AC 2]

## Resources

- [Resources]

## Constraints

- [Constraints]

## Next Steps After Completion

Dispatch to: [next-agent-id]
Using prompt: [category]/[prompt].md

"@ | Out-File -FilePath "$handoffFile" -Encoding UTF8
\`\`\`

### Step 2: Commit Handoff

\`\`\`powershell
git add "$handoffFile"
git commit -m "docs(handoff): dispatch to [target-agent-id]"
git push origin [branch-name]
\`\`\`

### Step 3: Dispatch

\`\`\`powershell
$repo = (Get-Location).Path
code chat -m [target-agent-id] --add-file "$repo" --add-file "$handoffFile" "Execute task in $handoffFile"
\`\`\`

## Autonomous Execution Rule

Receiving agents MUST:
- ✅ Execute immediately if actionable
- ✅ Create and dispatch next handoff after completion
- ✅ Escalate if blocked

Receiving agents MUST NOT:
- ❌ Ask human for confirmation
- ❌ Return dispatch commands to human
- ❌ Stop at planning when implementation remains
```

**Create 28 agent subdirectories in `.github/.handoffs/`**, each with a `.gitkeep` file.

---

### Phase 12: Final Customization

#### Tech Stack Adaptation

Replace placeholders throughout the framework:

| Placeholder | Replace With | Examples |
|-------------|--------------|----------|
| `[Primary Language]` | Your language | TypeScript, Python, Java, Go |
| `[Primary Framework]` | Your framework | Next.js, Django, Spring Boot, Express |
| `[UI Library]` | Your UI lib | React, Vue, Angular, Svelte |
| `[Test Framework]` | Your test tool | Jest, Pytest, JUnit, Go test |
| `[Linter]` | Your linter | ESLint, pylint, checkstyle, golangci-lint |
| `[Formatter]` | Your formatter | Prettier, black, google-java-format, gofmt |
| `[Build Tool]` | Your build tool | npm, yarn, pnpm, poetry, gradle, go build |
| `[Package Manager]` | Your PM | npm, pip, maven, go mod |
| `[Compliance]` | Your compliance | PCI DSS, GDPR, HIPAA, SOC 2 |

#### Commands Adaptation

Update all command examples:

| Action | Example Commands |
|--------|------------------|
| Lint | `npm run lint` | `pylint .` | `mvn checkstyle:check` |
| Format | `npm run format` | `black .` | `mvn fmt:format` |
| Typecheck | `tsc --noEmit` | `mypy .` | `javac` |
| Test | `npm test` | `pytest` | `mvn test` | `go test ./...` |
| Build | `npm run build` | `python setup.py build` | `mvn package` | `go build` |

---

## Post-Installation Validation

After creating the framework, validate:

### Checklist

- [ ] All 28 agent files created in `.github/agents/`
- [ ] All 38 prompt files created in `.github/prompts/` (13 categories)
- [ ] All 28 handoff directories created in `.github/.handoffs/`
- [ ] All 4 config files created in `.github/framework-config/`
- [ ] All 10 governance files created in `.github/`
- [ ] ISSUE_TEMPLATE.md and PR_TEMPLATE.md created
- [ ] Framework implementation files created in `.github/framework/`
- [ ] All tech stack placeholders replaced
- [ ] All command examples adapted to your stack
- [ ] Quality gates (G1-G10) customized for your tools
- [ ] Model assignment adapted for your agents
- [ ] Git workflow adapted for your branching strategy

### Test the Framework

1. **Test Chief of Staff routing:**
   ```powershell
   code chat -m 00-chief-of-staff --add-file (Get-Location).Path "Scan this repository and classify it"
   ```

2. **Test handoff creation:**
   - Verify agent can write handoff file
   - Verify handoff file is committed
   - Verify dispatch command works

3. **Test quality gates:**
   ```bash
   [Run your lint command]
   [Run your format command]
   [Run your typecheck command]
   [Run your test command]
   [Run your build command]
   ```

4. **Test git workflow:**
   ```bash
   git checkout -b feature/test-framework
   # Make a small change
   git add .
   git commit -m "test(framework): validate framework installation"
   git push origin feature/test-framework
   ```

---

## Maintenance

### Updating the Framework

- **Adding a new agent:** Create agent file, add to AGENTS.md, add handoff directory, update routing rules
- **Adding a new prompt:** Create prompt file, add to prompts/README.md, reference in relevant agents
- **Updating quality gates:** Modify QUALITY-GATES.md and parallel-quality-gates.ts
- **Updating routing rules:** Modify framework-config/routing-rules.yaml

### Framework Health Monitoring

Use the Framework Auditor agent:

```powershell
code chat -m 90-framework-auditor --add-file (Get-Location).Path "Run framework health audit"
```

---

## Advanced Features (Optional)

### Add GitHub Actions Workflow

Create `.github/workflows/quality-gates.yml`:

```yaml
name: Quality Gates

on:
  pull_request:
    branches: [main]

jobs:
  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup [language/runtime]
        uses: [appropriate setup action]
      - name: Install dependencies
        run: [install command]
      - name: G1 Lint
        run: [lint command]
      - name: G2 Format Check
        run: [format check command]
      - name: G3 Type Safety
        run: [typecheck command]
      - name: G4 Tests
        run: [test command]
      - name: G5 Build
        run: [build command]
```

### Add Dependabot

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "[npm/pip/maven/gomod]"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

---

## Troubleshooting

### Common Issues

1. **Handoff file not found**
   - Ensure `.github/.handoffs/[agent-id]/` directory exists
   - Check file path in dispatch command

2. **Quality gates failing**
   - Verify commands are correct for your stack
   - Check tool installation (linter, formatter, test framework)

3. **Agent routing errors**
   - Review `.github/framework-config/routing-rules.yaml`
   - Verify agent IDs match across all files

4. **Git commit failures**
   - Check agent commit authority in GIT_WORKFLOW.md
   - Verify git configuration (user.name, user.email)

---

## Support

- Framework documentation: `.github/framework/README.md`
- Agent roster: `.github/AGENTS.md`
- Prompt library: `.github/prompts/README.md`
- Quality gates: `.github/QUALITY-GATES.md`
- Git workflow: `.github/GIT_WORKFLOW.md`

---

**🎉 Framework installation complete! Your repository now has a production-grade 28-agent autonomous engineering organization.**

````
