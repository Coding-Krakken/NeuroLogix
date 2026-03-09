# AI Cost Optimization Policy

> **Last Updated:** February 25, 2026  
> **Authority:** Chief of Staff + Quality Director  
> **Matrix:** [AI_MODEL_ASSIGNMENT.md](AI_MODEL_ASSIGNMENT.md)

---

## Governing Principle

**Mini First When Safe.** Heavy reasoning is reserved for high-risk domains where incorrect output has cascading, irreversible, or security-impacting consequences.

---

## Cost Tiers

| Tier         | Model                          | Relative Cost | Use Case                                                        |
| ------------ | ------------------------------ | ------------- | --------------------------------------------------------------- |
| **Economy**  | GPT-5 Mini                     | 1× (baseline) | Implementation, docs, CI, structured tasks                      |
| **Standard** | GPT-5 Mini → Sonnet escalation | ~1.3× average | Hybrid agents, mostly structured with occasional deep reasoning |
| **Premium**  | Claude Sonnet 4.5              | ~4×           | Architecture, security, executive decisions, final quality      |

---

## Budget Allocation Rules

### Rule 1: Default to Mini

Every task starts with GPT-5 Mini unless:

- The agent is a Tier 1 (Sonnet Primary) agent, OR
- An escalation trigger has fired (see AI_MODEL_ASSIGNMENT.md §Escalation Triggers)

### Rule 2: Evidence-Based Escalation Only

Escalation to Sonnet 4.5 requires a documented trigger. Agents may NOT preemptively escalate because a task "seems hard." The trigger must be one of:

- E1: 3 failed attempts
- E2: Conflicting ADR decisions
- E3: Security/privacy risk detected
- E4: Unexpected test instability
- E5: Architectural uncertainty
- E6: Ambiguous requirements
- E7: Cross-domain conflict

### Rule 3: Sonnet Tasks Must Justify Value

Sonnet 4.5 usage should produce one of:

- An architecture decision (ADR, domain model, system design)
- A security assessment (threat model, PCI review, privacy audit)
- A ship/no-ship decision
- A crisis resolution (incident response, root cause analysis)
- A conflict resolution (ADR conflicts, requirement ambiguity)

If the output is purely mechanical (boilerplate, template fill, formatting), the task should have been on Mini.

### Rule 4: Fallback When Possible

Sonnet agents encountering repetitive mechanical sub-tasks SHOULD delegate to Mini via fallback (F1-F3 triggers). Examples:

- Generating TypeScript interfaces from a completed domain model
- Populating a runbook template with known values
- Updating documentation links

### Rule 5: No Escalation Ping-Pong

An agent may escalate from Mini to Sonnet **once per task**. If Sonnet cannot resolve:

- Route to Chief of Staff for re-assessment
- Do NOT bounce back to Mini and re-escalate
- If Chief of Staff cannot resolve: flag for human review

---

## Token Budget Guidelines

### Per-Task Limits (Advisory)

| Task Type                         | Max Input Tokens | Max Output Tokens | Model  |
| --------------------------------- | ---------------- | ----------------- | ------ |
| Implementation (component, route) | 8,000            | 4,000             | Mini   |
| Test writing                      | 6,000            | 3,000             | Mini   |
| Documentation                     | 4,000            | 2,000             | Mini   |
| Architecture design               | 12,000           | 6,000             | Sonnet |
| Security review                   | 10,000           | 5,000             | Sonnet |
| Ship/no-ship review               | 15,000           | 4,000             | Sonnet |
| Incident response                 | 10,000           | 4,000             | Sonnet |

These are advisory. The goal is awareness, not hard enforcement.

### Chain-Level Budget

A typical dispatch chain (Chief of Staff → ... → Quality Director) should target:

- **Small task (1-3 agents):** ~20,000 total tokens
- **Medium task (3-5 agents):** ~50,000 total tokens
- **Large task (5+ agents):** ~100,000 total tokens

If a chain exceeds 2× its category budget, Chief of Staff should review for loop/redundancy.

---

## Cost Monitoring

### Metrics to Track

| Metric                          | Target               | Alert Threshold                |
| ------------------------------- | -------------------- | ------------------------------ |
| Sonnet % of total tokens        | <45%                 | >55%                           |
| Escalation rate (Mini → Sonnet) | <20% of Mini tasks   | >30%                           |
| Fallback rate (Sonnet → Mini)   | >10% of Sonnet tasks | <5% (under-utilizing fallback) |
| Average chain token cost        | Trending down        | 3-month increasing trend       |
| Tasks requiring human review    | <2%                  | >5%                            |

### Monthly Review

Chief of Staff reviews monthly:

1. Which agents escalate most frequently?
2. Are escalation triggers appropriate or too sensitive?
3. Are any Mini agents consistently failing (should they be upgraded)?
4. Are any Sonnet agents doing mostly mechanical work (should they be downgraded)?

---

## Optimization Strategies

### Strategy 1: Context Pruning

Before passing context to the next agent, prune:

- Completed acceptance criteria (summarize, don't repeat)
- Resolved discussions
- Intermediate debugging output

### Strategy 2: Prompt Caching

For agents that run the same prompt structure repeatedly (e.g., QA test engineer running test-gap analysis), enable prompt caching to reduce input token costs.

### Strategy 3: Batch Mechanical Tasks

When a Sonnet agent identifies multiple mechanical sub-tasks, batch them into a single Mini delegation rather than individual fallbacks.

### Strategy 4: Progressive Detail

Start with high-level analysis (cheaper), only expand detail where issues are found. Example: Security engineer scans at file level first, deep-dives only on flagged files.

---

## Governance

| Decision                                       | Authority                                        |
| ---------------------------------------------- | ------------------------------------------------ |
| Assign agent to tier                           | Chief of Staff + Quality Director (joint)        |
| Approve escalation trigger change              | Chief of Staff                                   |
| Override model for specific task               | Chief of Staff (documented in dispatch chain)    |
| Downgrade escalation                           | Chief of Staff OR Quality Director only          |
| Promote agent tier (Mini → Hybrid → Sonnet)    | Requires ADR with evidence                       |
| Demote agent tier                              | Requires ADR with evidence                       |
| Emergency override (use Sonnet for Mini agent) | Incident Commander (during active incident only) |
