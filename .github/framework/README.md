# SubZero Agentic Framework

Version: 2.0.0  
Package: `@subzero/framework`  
Location: `.github/framework/`

This package provides deterministic orchestration primitives, GitHub-native handoff tooling, and telemetry/analysis utilities for multi-agent workflows.

## What Is Shipped

The public package API is exported from `src/index.ts`:

- `runFrameworkAudit(options)`
- `normalizeLifecycle(lifecycle)`
- `analyzeHandoffWorkflow(entries)`
- `workflowTelemetry()`

Repository workflows also use non-exported modules in this folder for dispatching, handoff delivery, quality gates, scheduling, and governance enforcement.

## Prerequisites

- Node.js `>=18`
- npm
- Git + GitHub CLI (`gh`) for GitHub-native handoff operations
- VS Code CLI (`code`) for dispatch operations

## Install

From repo root:

```bash
npm --prefix .github/framework install
```

Or from `.github/framework`:

```bash
npm install
```

## Quick Start (5 Commands)

Run from repo root in this order for a fast confidence loop:

```bash
npm --prefix .github/framework install
npm --prefix .github/framework run lint
npm --prefix .github/framework run test -- --runInBand
npm --prefix .github/framework run handoff:report -- --input qa-evidence/handoff-workflow-sample.log --json
npm --prefix .github/framework run build
```

Use this path for daily validation and historical dispatch-chain analysis without requiring a live framework runtime.

## Daily Commands

Run from repo root:

```bash
npm --prefix .github/framework run lint
npm --prefix .github/framework run format:check
npm --prefix .github/framework run typecheck
npm --prefix .github/framework run test -- --runInBand
npm --prefix .github/framework run build
```

Governance commands:

```bash
npm --prefix .github/framework run governance:route:issue
npm --prefix .github/framework run governance:route:pr
npm --prefix .github/framework run governance:changelog
npm --prefix .github/framework run governance:boundary
```

Handoff report CLI:

```bash
npm --prefix .github/framework run handoff:report -- --input qa-evidence/handoff-workflow-sample.log
npm --prefix .github/framework run handoff:report -- --input qa-evidence/handoff-workflow-sample.log --json
```

## Telemetry and Analysis (Detailed)

This is the canonical guide for telemetry capture, analysis logging, and historical forensic review.

### 1) Task Telemetry with `WorkflowTelemetry`

`WorkflowTelemetry` tracks task-level lifecycle and calculates summary metrics.

Tracked events:

- `markTaskStart(taskId)`
- `trackIssueCreated(taskId, issueNumber, issueUrl)`
- `trackBranchCreated(taskId, branchName)`
- `trackCommit(taskId, hash, message)`
- `trackPrOpened(taskId, pullRequestNumber, pullRequestUrl)`
- `trackReviewIteration(taskId)`
- `markTaskCompleted(taskId)`

Computed metrics (`getMetrics(taskId)`):

- `commitsPerTask`
- `timeToFirstCommitMinutes`
- `timeToPrMinutes`
- `reviewIterations`

Final summary (`buildFinalSummary(taskId)`) includes issue, branch, PR, commit list, and metrics.

Example:

```ts
import { workflowTelemetry } from "@subzero/framework"

const telemetry = workflowTelemetry()
const taskId = "issue-<WORK_ITEM_ID>-task-<TASK_ID>"

telemetry.markTaskStart(taskId)
telemetry.trackIssueCreated(taskId, 42, "https://github.com/<ORGANIZATION_NAME>/<REPOSITORY_NAME>/issues/<WORK_ITEM_ID>")
telemetry.trackBranchCreated(taskId, "feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>")
telemetry.trackCommit(taskId, "abc1234", "feat(framework): add API checks")
telemetry.trackReviewIteration(taskId)
telemetry.trackPrOpened(taskId, 17, "https://github.com/<ORGANIZATION_NAME>/<REPOSITORY_NAME>/pull/<PR_ID>")
telemetry.markTaskCompleted(taskId)

const metrics = telemetry.getMetrics(taskId)
const summary = telemetry.buildFinalSummary(taskId)
```

### 2) Hybrid Dispatch Telemetry

For wave-based execution, telemetry can capture dispatch lifecycle events:

- `hybrid.dispatch.start`
- `hybrid.dispatch.success`
- `hybrid.dispatch.failure`
- `hybrid.dispatch.timeout`

Methods:

- `trackHybridDispatchEvent(taskId, event)`
- `trackHybridDispatchSummary(taskId, summary)`
- `getHybridDispatchEvents(taskId)`
- `getHybridDispatchSummary(taskId)`

This aligns with runtime outputs from `parallel-dispatch-controller.ts` and `wave-scheduler.ts`.

### 3) Framework Audit API (`runFrameworkAudit`)

`runFrameworkAudit` is a lightweight audit utility that validates lifecycle state and emits completion-ready result metadata.

Behavior:

1. Resolves `taskId` (default: `framework-audit`)
2. Normalizes lifecycle via `normalizeLifecycle`
3. Starts + completes telemetry internally
4. Returns `{ taskId, lifecycle, completed }`

Accepted lifecycle states:

- `draft`
- `candidate`
- `smoke_validated`
- `publish_blocked`
- `published`
- `superseded`

Example:

```ts
import { runFrameworkAudit } from "@subzero/framework"

const result = await runFrameworkAudit({
  taskId: "issue-<WORK_ITEM_ID>-smoke",
  lifecycle: "smoke_validated",
})
```

### 4) Handoff Workflow Analysis Tool

Use `handoff:report` to analyze command logs and handoff evidence files.

Detection coverage includes:

- dispatch command lines: `code chat -m <agent>`
- dispatch confirmation lines: `Dispatch command executed to <agent>`
- handoff artifacts: `.github/.handoffs/<agent>/handoff-*.md`
- handoff URLs: GitHub issue/pr comment URLs
- non-zero dispatch exits
- declared `Next routing target` without matching dispatch

JSON output command (recommended):

```bash
npm --prefix .github/framework run handoff:report -- --input qa-evidence/handoff-workflow-sample.log --json
```

Text output command:

```bash
npm --prefix .github/framework run handoff:report -- --input qa-evidence/handoff-workflow-sample.log
```

Output model:

```json
{
  "issues": [
    {
      "issueNumber": 16,
      "events": [],
      "dispatches": 0,
      "completions": 0,
      "failedDispatches": 0,
      "gaps": []
    }
  ]
}
```

### 5) Exact Procedure: Analyze Historical Runs (No Live Framework)

When no runtime is active, analyze archived evidence artifacts directly.

Step 1: Parse known historical logs.

```bash
npm --prefix .github/framework run handoff:report -- --input qa-evidence/handoff-workflow-sample.log --json
npm --prefix .github/framework run handoff:report -- --input qa-evidence/g4-tests-coverage.txt --json
```

Step 2: Locate dispatch command lines in all qa evidence.

```powershell
Select-String -Path .github/framework/qa-evidence/* -Pattern "code\s+chat\s+-m|Dispatch command executed to"
```

Step 3: Correlate events with handoff artifacts.

```powershell
Get-ChildItem .github/.handoffs -Recurse -File -Filter "handoff-*.md"
```

Step 4: Re-run `handoff:report` on each evidence file containing command matches.

This is the canonical post-run forensic workflow for chain continuity checks, dispatch failure checks, and missing handoff artifact detection.

### 6) Environment Variables for Analysis/Gates

Dispatch/context:

- `SUBZERO_DISPATCH_DRY_RUN=1`
- `SUBZERO_CODE_COMMAND`
- `SUBZERO_REPO`
- `SUBZERO_ISSUE`
- `SUBZERO_PR`
- `SUBZERO_BRANCH`
- `SUBZERO_AGENT`
- `SUBZERO_NEXT_AGENT`
- `SUBZERO_RUN_ID`
- `SUBZERO_TASK_ID`

Gate controls:

- `SUBZERO_DOCS_README_UPDATED=1` or `SUBZERO_DOCS_ADR_UPDATED=1` (G7)
- `SUBZERO_PR_DESCRIPTION_VALIDATED=1` (G8)
- `SUBZERO_PERFORMANCE_BUDGET_PASS=1` (G9)

## Analysis Logging Standard

Recommended pattern:

1. Store quality gate outputs in `.github/framework/qa-evidence/`.
2. Store handoff artifacts in `.github/.handoffs/<agent>/`.
3. For each milestone, persist `handoff:report --json` output as evidence.
4. Persist telemetry snapshots from `buildFinalSummary(taskId)` for issue-level traceability.
5. Include GitHub comment URLs in evidence bundles for external auditability.

## Troubleshooting

- `Failed to read input file` with `handoff:report`:
  - Use path relative to `.github/framework` because the CLI resolves from package context.
  - Example valid input: `qa-evidence/handoff-workflow-sample.log`
- `gh auth` errors:
  - Run `gh auth login`
- `code` command unavailable:
  - Set `SUBZERO_CODE_COMMAND`
  - Validate with `code --version`

## Release Readiness Baseline

Before release/package publication workflows:

```bash
npm --prefix .github/framework run lint
npm --prefix .github/framework run format:check
npm --prefix .github/framework run typecheck
npm --prefix .github/framework run test -- --coverage --runInBand
npm --prefix .github/framework run build
```

## Related Docs

- `CHANGELOG.md`
- `API-CONTRACTS.md`
- `.github/.developer/README.md`
- `.github/AGENTS.md`

