# Agent Efficiency Runbook

## Objective

Reduce redundant agent workload by making discovery and handoff continuation deterministic, reusable, and machine-readable.

## Core Pattern: Discover Once, Resume Many

1. Generate one context packet per work item.
2. Reuse that packet for each downstream dispatch.
3. Continue from explicit pending checklist items rather than repeating repo discovery.

## New Automation Scripts

### 1) Generate Context Snapshot

Script: `.github/scripts/generate-agent-context.ps1`

What it does:

- Pulls issue metadata, labels, assignees, and state
- Captures latest governance and verification bot signals
- Detects latest handoff and extracts pending checklist items
- Captures local branch delta and working tree summary
- Writes compact outputs:
  - `.github/.system-state/ops/context/issue-<n>-agent-context.json`
  - `.github/.system-state/ops/context/issue-<n>-agent-context.md`

Usage:

```powershell
./.github/scripts/generate-agent-context.ps1 -IssueNumber 45 -Repo Coding-Krakken/.subzero
```

### 2) Resumable Dispatch Wrapper

Script: `.github/scripts/dispatch-agent.ps1`

What it does:

- Generates/attaches context snapshot automatically
- Posts/reuses handoff comment and captures handoff URL
- Uses dispatch token dedupe to avoid duplicate dispatch churn
- Dispatches target agent with context pack and resume instructions
- Posts a marker comment with dispatch evidence and exit code

Usage:

```powershell
./.github/scripts/dispatch-agent.ps1 -IssueNumber 45 -TargetAgent 11-tech-lead -Repo Coding-Krakken/.subzero
```

With explicit handoff + extra context files:

```powershell
./.github/scripts/dispatch-agent.ps1 \
  -IssueNumber 45 \
  -TargetAgent backend-engineer \
  -Repo Coding-Krakken/.subzero \
  -HandoffFile .github/.handoffs/backend/handoff-issue45.md \
  -ContextFiles @('.github/.system-state/model/system_state_model.yaml','.github/.system-state/contracts/api.yaml')
```

## Operating Rules for All Agents

- Consume context snapshot before any discovery prompt.
- Run full repo discovery only when snapshot is stale, missing, or contradictory.
- Continue from pending checklist items in the latest handoff/context packet.
- Keep handoff comments concise and action-oriented.

## Recommended Integration (Next Step)

1. Add pre-dispatch step in Chief of Staff flow to always run `generate-agent-context.ps1`.
2. Replace ad-hoc `code chat` calls with `dispatch-agent.ps1`.
3. Add a governance check that fails dispatch comments without a context snapshot reference.

## Enforcement Gate

- Workflow: `.github/workflows/handoff-context-gate.yml`
- Trigger: `issue_comment` created/edited
- Rule: Handoff/dispatch comments must include a context snapshot reference.
- Failure behavior: Action run fails, posts a remediation note, and applies `handoff-missing-context` label.

## Expected Outcomes

- Reduced duplicated discovery across agents
- Lower handoff latency
- Higher continuity and fewer "rebuild context" cycles
- Better auditability via deterministic dispatch markers
