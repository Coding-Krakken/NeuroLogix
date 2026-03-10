# Model Routing

> **Category:** System  
> **File:** `model-routing.prompt.md`  
> **Policy:** [AI_MODEL_ASSIGNMENT.md](../AI_MODEL_ASSIGNMENT.md)  
> **Cost Policy:** [AI_COST_POLICY.md](../AI_COST_POLICY.md)

---

## Purpose

Instruct agents on which AI model to use, when to escalate, and when to fallback. This prompt is the runtime routing logic for the AI Model Assignment System.

---

## Model Selection Rules

### Step 1: Check Your Assignment

Before beginning any task, check your agent's assigned tier in `AI_MODEL_ASSIGNMENT.md`:

- **Tier 1 (Sonnet Primary):** Use Claude Sonnet 4.5. Fallback to GPT-5 Mini only for mechanical sub-tasks (F1-F3).
- **Tier 2 (Mini Primary):** Use GPT-5 Mini. Escalate to Claude Sonnet 4.5 only when triggers fire (E1-E7).
- **Tier 3 (Hybrid):** Start with GPT-5 Mini. Monitor for escalation triggers throughout execution.

### Step 2: Monitor Escalation Triggers During Execution

While executing your task, continuously evaluate:

```
ESCALATION CHECK:
□ Have I failed this task 3+ times? → E1
□ Do ADR decisions conflict? → E2
□ Is there a security or privacy risk? → E3
□ Are tests unexpectedly unstable? → E4
□ Am I uncertain about architecture? → E5
□ Are requirements ambiguous? → E6
□ Does optimizing one dimension hurt another? → E7

If ANY box is checked → ESCALATE to Claude Sonnet 4.5
```

### Step 3: Execute Escalation (if triggered)

When escalating, include in your dispatch:

```
⚡ MODEL ESCALATION: GPT-5 Mini → Claude Sonnet 4.5
Trigger: [E-code]: [description]
Agent: [your-agent-id]
Task: [what you were trying to do]
Attempts: [what you tried and why it failed]
Context: [relevant files, errors, constraints]
Specific Question: [what you need the deeper model to resolve]
```

### Step 4: Execute Fallback (if applicable)

Sonnet 4.5 agents encountering mechanical sub-tasks:

```
⬇️ MODEL FALLBACK: Claude Sonnet 4.5 → GPT-5 Mini
Reason: [F-code]: [description]
Task: [specific mechanical task]
Expected Output: [what Mini should produce]
Constraints: [any constraints on the output]
```

---

## Tier 1 Agents (Claude Sonnet 4.5)

These agents use Sonnet 4.5 by default for ALL primary tasks:

| Agent                        | When to Fallback to Mini                              |
| ---------------------------- | ----------------------------------------------------- |
| `00-chief-of-staff`          | Generating boilerplate dispatch templates             |
| `solution-architect`         | Populating TypeScript interfaces from completed model |
| `stakeholder-executive`      | Formatting reports from finalized decisions           |
| `tech-lead`                  | Generating slice checklists from completed plan       |
| `security-engineer`          | Running dependency scan commands                      |
| `privacy-compliance-officer` | Formatting PII inventory from completed audit         |
| `incident-commander`         | Updating status page from resolved incident           |
| `red-team`                   | Documenting known findings in template                |
| `quality-director`           | Generating quality gate summary from passing results  |

---

## Tier 2 Agents (GPT-5 Mini)

These agents use Mini by default. Escalate ONLY on triggers:

| Agent                        | Most Likely Escalation                                           |
| ---------------------------- | ---------------------------------------------------------------- |
| `frontend-engineer`          | E5 — uncertain component boundary, E6 — ambiguous UX requirement |
| `backend-engineer`           | E3 — security concern in API, E5 — uncertain data flow           |
| `platform-engineer`          | E4 — flaky CI, E5 — uncertain pipeline architecture              |
| `data-engineer`              | E5 — uncertain caching strategy, E7 — perf vs. consistency       |
| `devops-engineer`            | E3 — secrets management concern, E5 — deployment architecture    |
| `documentation-engineer`     | E6 — ambiguous what to document                                  |
| `support-readiness-engineer` | E6 — ambiguous incident procedure                                |
| `localization-specialist`    | E6 — ambiguous cultural/translation context                      |
| `finance-procurement`        | E6 — ambiguous cost attribution                                  |

---

## Tier 3 Agents (Hybrid)

These agents start on Mini and watch for escalation triggers:

| Agent                      | Primary Task (Mini)          | Escalation Scenario (Sonnet)                          |
| -------------------------- | ---------------------------- | ----------------------------------------------------- |
| `product-owner`            | Structured story writing     | Ambiguous requirements, conflicting stakeholder input |
| `program-manager`          | Timeline tracking, status    | Dependency deadlock, re-planning needed               |
| `ml-engineer`              | Feature implementation       | Model architecture design, algorithm selection        |
| `ux-designer`              | Design system application    | Novel interaction pattern, accessibility conflict     |
| `accessibility-specialist` | WCAG checklist audit         | Novel ARIA pattern, conflicting requirements          |
| `qa-test-engineer`         | Test execution, coverage     | Test strategy design, flaky test investigation        |
| `performance-engineer`     | Lighthouse audits, profiling | Optimization architecture, perf vs. UX trade-off      |
| `sre-engineer`             | Alert config, SLO monitoring | Capacity planning, novel failure mode analysis        |
| `legal-counsel`            | License scanning, checklist  | Novel IP question, regulatory ambiguity               |

---

## Loop Prevention

### Rule 1: One Escalation Per Task

An agent may escalate from Mini → Sonnet **once** for a given task. If the escalated reasoning does not resolve the issue:

- Do NOT re-escalate
- Route to `00-chief-of-staff` with full context

### Rule 2: No Self-Downgrade

An escalated task stays on Sonnet until:

- Chief of Staff authorizes downgrade, OR
- Quality Director authorizes downgrade

### Rule 3: Escalation Ceiling

```
Mini Agent fails → Escalate to Sonnet 4.5
Sonnet 4.5 fails → Route to Chief of Staff
Chief of Staff fails → Flag for HUMAN REVIEW
```

Maximum escalation depth: 3 levels. No exceptions.

### Rule 4: Audit Trail

Every model change (escalation or fallback) MUST appear in the dispatch chain:

```
DISPATCH CHAIN: [chief-of-staff] → [frontend-engineer (Mini)] → [frontend-engineer (⚡ Sonnet, E5)] → [tech-lead]
```

---

## Decision Flowchart

```
START
  │
  ├─ Is agent Tier 1? → Use Claude Sonnet 4.5
  │   └─ Mechanical sub-task? → Fallback to GPT-5 Mini (F1-F3)
  │
  ├─ Is agent Tier 2? → Use GPT-5 Mini
  │   └─ Trigger E1-E7 fires? → Escalate to Claude Sonnet 4.5
  │       └─ Sonnet resolves? → Continue on Sonnet for this task
  │       └─ Sonnet fails? → Route to Chief of Staff
  │
  └─ Is agent Tier 3? → Start with GPT-5 Mini
      └─ Same as Tier 2 escalation logic
```
