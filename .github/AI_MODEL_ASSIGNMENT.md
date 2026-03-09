# AI Model Assignment Matrix

> **Last Updated:** February 25, 2026  
> **Authority:** Chief of Staff + Quality Director  
> **Policy:** [AI_COST_POLICY.md](AI_COST_POLICY.md)  
> **Routing Prompt:** [prompts/model-routing.prompt.md](prompts/model-routing.prompt.md)

---

## Assignment Philosophy

Every agent is assigned a **primary model** optimized for its reasoning profile. The matrix maximizes quality-per-token by reserving expensive deep-reasoning for agents whose failure consequences are catastrophic, while routing structured execution tasks to fast, cost-efficient models.

| Principle                | Rule                                                                             |
| ------------------------ | -------------------------------------------------------------------------------- |
| **Mini First**           | Default to GPT-5 Mini unless the task provably requires deep reasoning           |
| **Escalate on Evidence** | Upgrade to Claude Sonnet 4.5 only when triggers fire (not preemptively)          |
| **Downgrade Authority**  | Only Chief of Staff or Quality Director may downgrade an escalation              |
| **No Ping-Pong**         | An agent may escalate once per task; repeated escalation = Chief of Staff review |

---

## Model Capability Profiles

### Claude Sonnet 4.5

| Strength                      | Description                                      |
| ----------------------------- | ------------------------------------------------ |
| Long reasoning chains         | Multi-step architectural trade-off analysis      |
| Ambiguity resolution          | Incomplete requirements, conflicting constraints |
| Cross-domain thinking         | Security × performance × business × UX           |
| Risk analysis                 | Threat modeling, failure mode identification     |
| Creative adversarial thinking | Red team, novel attack vectors                   |
| Final judgment                | Ship/no-ship, go/no-go decisions                 |

### GPT-5 Mini

| Strength                  | Description                                |
| ------------------------- | ------------------------------------------ |
| Structured execution      | Following canonical patterns reliably      |
| Fast iteration            | Rapid code generation, test writing        |
| Checklist workflows       | WCAG audits, dependency reviews, CI config |
| Template-driven tasks     | Documentation, runbooks, release notes     |
| Repeatable implementation | Components, API routes, migrations         |
| Cost efficiency           | ~4× cheaper per token than Sonnet 4.5      |

---

## Assignment Matrix

### Tier 1 — Claude Sonnet 4.5 Primary (10 Agents)

High-stakes reasoning, architecture, security, executive judgment.

| #   | Agent                        | Primary Model         | Fallback Model | Reasoning Complexity | Assignment Rationale                                                                                                                              |
| --- | ---------------------------- | --------------------- | -------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 00  | `00-chief-of-staff`          | **Claude Sonnet 4.5** | GPT-5 Mini     | CRITICAL             | Cross-domain routing, ambiguity resolution, conflict arbitration, loop prevention. Single entry point — misrouting cascades through entire chain. |
| 10  | `solution-architect`         | **Claude Sonnet 4.5** | GPT-5 Mini     | CRITICAL             | Domain modeling, system design, ADR authoring, trade-off analysis. Architecture errors propagate to every downstream agent.                       |
| 03  | `stakeholder-executive`      | **Claude Sonnet 4.5** | GPT-5 Mini     | HIGH                 | Strategic business decisions, ROI evaluation, priority arbitration. Wrong business decisions have irreversible revenue impact.                    |
| 11  | `11-tech-lead`               | **Claude Sonnet 4.5** | GPT-5 Mini     | HIGH                 | Implementation architecture, vertical slice decomposition, cross-cutting concern identification. Bridges architecture to implementation.          |
| 50  | `security-engineer`          | **Claude Sonnet 4.5** | GPT-5 Mini     | CRITICAL             | STRIDE threat modeling, PCI compliance verification, attack surface analysis. Security failures = breach risk + regulatory exposure.              |
| 51  | `privacy-compliance-officer` | **Claude Sonnet 4.5** | GPT-5 Mini     | CRITICAL             | GDPR analysis, PII classification, regulatory compliance. Compliance failures = legal liability.                                                  |
| 83  | `incident-commander`         | **Claude Sonnet 4.5** | GPT-5 Mini     | CRITICAL             | Crisis triage under time pressure, rapid root cause hypothesis, multi-system correlation. Wrong triage extends outages.                           |
| 84  | `red-team`                   | **Claude Sonnet 4.5** | GPT-5 Mini     | CRITICAL             | Adversarial creative thinking, novel attack vector identification. Requires inferring what _could_ go wrong, not following checklists.            |
| 90  | `90-framework-auditor`       | **Claude Sonnet 4.5** | GPT-5 Mini     | CRITICAL             | Meta-level framework auditing, multi-agent reliability analysis, and remediation prioritization across dispatch chains and quality gates.          |
| 99  | `99-quality-director`        | **Claude Sonnet 4.5** | GPT-5 Mini     | CRITICAL             | Final ship/no-ship authority, holistic cross-domain quality assessment. Last line of defense — must catch what all other agents missed.           |

### Tier 2 — GPT-5 Mini Primary (9 Agents)

Structured implementation, documentation, CI/CD, repeatable tasks.

| #   | Agent                        | Primary Model  | Fallback Model    | Reasoning Complexity | Assignment Rationale                                                                                           |
| --- | ---------------------------- | -------------- | ----------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| 20  | `frontend-engineer`          | **GPT-5 Mini** | Claude Sonnet 4.5 | MEDIUM               | Canonical pattern implementation (React/<WEB_FRAMEWORK>). Follows Solution Architect specs. Structured and repeatable. |
| 21  | `backend-engineer`           | **GPT-5 Mini** | Claude Sonnet 4.5 | MEDIUM               | API route implementation, external provider SDK integration. Follows contract specs. Well-defined input/output.        |
| 22  | `platform-engineer`          | **GPT-5 Mini** | Claude Sonnet 4.5 | LOW                  | CI/CD pipeline configuration, build systems. Highly repeatable infrastructure work.                            |
| 23  | `data-engineer`              | **GPT-5 Mini** | Claude Sonnet 4.5 | MEDIUM               | Data pipeline construction, migration scripts, caching configuration. Structured data transformations.         |
| 60  | `devops-engineer`            | **GPT-5 Mini** | Claude Sonnet 4.5 | LOW                  | Deployment configuration, <DEPLOYMENT_PLATFORM> setup, environment management. Repeatable infrastructure.      |
| 70  | `documentation-engineer`     | **GPT-5 Mini** | Claude Sonnet 4.5 | LOW                  | Technical documentation, API references, README updates. Template-driven generation.                           |
| 71  | `support-readiness-engineer` | **GPT-5 Mini** | Claude Sonnet 4.5 | LOW                  | Runbooks, FAQ, training materials. Template-driven, follows established patterns.                              |
| 82  | `localization-specialist`    | **GPT-5 Mini** | Claude Sonnet 4.5 | LOW                  | i18n configuration, translation file management. Mechanical, pattern-based work.                               |
| 81  | `finance-procurement`        | **GPT-5 Mini** | Claude Sonnet 4.5 | LOW                  | Cost analysis, budget reporting. Structured numerical analysis with clear inputs.                              |

### Tier 3 — Hybrid (GPT-5 Mini Primary → Claude Sonnet 4.5 Escalation) (9 Agents)

Primarily structured work with defined escalation triggers for complex situations.

| #   | Agent                      | Primary Model               | Fallback Model    | Reasoning Complexity | Assignment Rationale                                                                                          |
| --- | -------------------------- | --------------------------- | ----------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| 01  | `product-owner`            | **GPT-5 Mini** → Sonnet 4.5 | Claude Sonnet 4.5 | MEDIUM               | Requirements elicitation mostly structured. Escalate when requirements are ambiguous or conflicting.          |
| 02  | `program-manager`          | **GPT-5 Mini** → Sonnet 4.5 | Claude Sonnet 4.5 | MEDIUM               | Coordination is structured. Escalate for dependency conflicts or timeline re-planning.                        |
| 24  | `ml-engineer`              | **GPT-5 Mini** → Sonnet 4.5 | Claude Sonnet 4.5 | MEDIUM               | ML implementation structured. Escalate for model architecture decisions or novel algorithms.                  |
| 30  | `ux-designer`              | **GPT-5 Mini** → Sonnet 4.5 | Claude Sonnet 4.5 | MEDIUM               | Design system patterns established. Escalate for novel interaction patterns or accessibility conflicts.       |
| 31  | `accessibility-specialist` | **GPT-5 Mini** → Sonnet 4.5 | Claude Sonnet 4.5 | MEDIUM               | WCAG compliance checklist-driven. Escalate for novel ARIA patterns or conflicting accessibility requirements. |
| 40  | `qa-test-engineer`         | **GPT-5 Mini** → Sonnet 4.5 | Claude Sonnet 4.5 | MEDIUM               | Test execution is structured. Escalate for test strategy design or flaky test root cause analysis.            |
| 41  | `performance-engineer`     | **GPT-5 Mini** → Sonnet 4.5 | Claude Sonnet 4.5 | MEDIUM               | Profiling is data-driven. Escalate for optimization architecture or trade-off decisions.                      |
| 61  | `sre-engineer`             | **GPT-5 Mini** → Sonnet 4.5 | Claude Sonnet 4.5 | MEDIUM               | Operational procedures repeatable. Escalate for capacity planning or novel failure modes.                     |
| 80  | `legal-counsel`            | **GPT-5 Mini** → Sonnet 4.5 | Claude Sonnet 4.5 | MEDIUM               | License review structured. Escalate for novel IP questions or regulatory ambiguity.                           |

---

## Escalation Triggers (GPT-5 Mini → Claude Sonnet 4.5)

Any GPT-5 Mini or Hybrid agent MUST escalate to Claude Sonnet 4.5 when:

| #   | Trigger                            | Detection                                                           |
| --- | ---------------------------------- | ------------------------------------------------------------------- |
| E1  | **3 failed attempts**              | Same task failed 3 times with different approaches                  |
| E2  | **Conflicting ADR decisions**      | Two or more ADRs contradict each other                              |
| E3  | **Security/privacy risk detected** | Any finding that could affect PCI, PII, or auth                     |
| E4  | **Unexpected test instability**    | Previously passing tests now flaky without code changes             |
| E5  | **Architectural uncertainty**      | Cannot determine correct component boundary or data flow            |
| E6  | **Ambiguous requirements**         | Requirements have multiple valid interpretations                    |
| E7  | **Cross-domain conflict**          | Optimization in one area degrades another (e.g., perf vs. security) |

### Escalation Format

```
⚡ MODEL ESCALATION: GPT-5 Mini → Claude Sonnet 4.5
Trigger: [E1-E7 code and description]
Agent: [agent-id]
Context: [what was attempted and why it failed]
Request: [specific question requiring deeper reasoning]
```

---

## Fallback Triggers (Claude Sonnet 4.5 → GPT-5 Mini)

Claude Sonnet 4.5 agents SHOULD fallback to GPT-5 Mini when:

| #   | Trigger                         | Example                                           |
| --- | ------------------------------- | ------------------------------------------------- |
| F1  | **Repetitive mechanical task**  | Generating boilerplate from established pattern   |
| F2  | **Template population**         | Filling in ADR/runbook template with known values |
| F3  | **Simple documentation update** | Updating a version number or link                 |

### Fallback Format

```
⬇️ MODEL FALLBACK: Claude Sonnet 4.5 → GPT-5 Mini
Reason: [F1-F3 code and description]
Task: [specific mechanical task to delegate]
```

---

## Loop Prevention Rules

1. **One escalation per task per agent** — If Claude Sonnet 4.5 cannot resolve after escalation, route to Chief of Staff (not back to Mini)
2. **No self-downgrade** — An escalated agent cannot downgrade itself; only Chief of Staff or Quality Director can authorize downgrade
3. **Escalation ceiling** — If Chief of Staff escalation also fails, the task is flagged for human review
4. **Audit trail** — Every escalation/fallback must be logged in the dispatch chain

---

## Cost Impact Estimate

| Metric                                 | Value                                              |
| -------------------------------------- | -------------------------------------------------- |
| Agents on Mini (cheapest)              | 9 (32%)                                            |
| Agents on Hybrid (mostly Mini)         | 9 (32%)                                            |
| Agents on Sonnet (most expensive)      | 10 (36%)                                           |
| Estimated token savings vs. all-Sonnet | **~55-65%**                                        |
| Quality risk                           | **Minimal** — all high-stakes decisions use Sonnet |

The hybrid tier runs on Mini for ~80% of its tasks, escalating only on triggers. Effective Mini usage across the organization is approximately **55-60%**, with Sonnet reserved for the ~40% of work that genuinely requires deep reasoning.
