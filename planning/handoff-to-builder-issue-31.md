[Context]
Work Item: Issue#31
Chain Step: 11
Target Agent: Builder
Source: Issue#31
Status: selected-and-ready

Objective
Deliver the smallest complete, testable Phase 3 vertical slice for Issue #31 (Edge Adapters and Demo Line Simulator) now that dependency Issue #30 is closed and validated.

Required Actions
1. Create a short-lived branch from latest `main` named with issue ID and concise slug.
2. Implement one bounded Sparkplug MQTT ingestion slice (normalization + connection-state handling) outside `.github/`.
3. Implement one deterministic simulator slice that emits controlled telemetry for a single canonical scenario profile.
4. Add or update targeted tests for malformed payload rejection and disconnect/reconnect lifecycle behavior.
5. Add minimal architecture evidence for this slice in `docs/architecture/` and execution evidence in `planning/validation-evidence-issue-31.md`.
6. Keep scope inside preferred PR guardrails (<=25 files, <=600 lines changed).
7. Open a PR linked to Issue #31 with explicit in-scope/out-of-scope boundaries and rollback notes.
8. Re-dispatch to Validator-Merger only after required checks are green.

Forbidden Actions
- Do not modify `.github/` framework internals during this normal issue execution.
- Do not widen into full OPC UA implementation, full simulator framework, or downstream Issues `#32+`.
- Do not perform unrelated refactors in existing services/packages/docs.
- Do not bypass PR workflow, required checks, or branch protections.

Files to Inspect
- `planning/issue-selection-issue-31.md`
- `planning/validation-evidence-issue-30-validator.md`
- `planning/merge-record-issue-30.md`
- `planning/closure-record-issue-30.md`
- `planning/open-issues-live-2026-03-10.json`
- Issue: https://github.com/Coding-Krakken/NeuroLogix/issues/31

Acceptance Criteria
1. A single bounded Phase 3 implementation slice is complete and reviewable.
2. Sparkplug normalization and connection-state handling have deterministic pass/fail behavior.
3. Simulator emits reproducible canonical telemetry for one scenario profile.
4. Changed behavior has targeted test evidence.
5. PR remains within scope guardrails with explicit rollback path.

Required GitHub Updates
1. Comment on Issue #31 at implementation start with planned bounded slice.
2. Update Issue #31 with PR link and checks status once opened.
3. Include in PR body: in-scope, out-of-scope, tests run, risk and rollback notes.

Validation Expectations
- Run deterministic checks proving slice correctness (`npm run lint`, `npm test`, `npm run build` at minimum).
- Maintain strict scope discipline; if pressure appears, split and keep the highest-value safe slice.
- Capture command outputs and scope evidence in `planning/validation-evidence-issue-31.md`.

Final Command Requirement
```bash
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent "validator-merger" -PromptFile "planning/handoff-to-validator-issue-31.md" -AddFile ".github/templates/pr-summary.md,.github/templates/review-summary.md,planning/validation-evidence-issue-31.md"
```