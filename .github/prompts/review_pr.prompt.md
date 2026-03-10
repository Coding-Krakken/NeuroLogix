---
name: review-pr
description: Review this PR
agent: agent
---

# Objective

Conduct a **complete, exhaustive Microsoft-grade engineering review and governance audit** of this Pull Request acting simultaneously as:

- Senior Staff Engineer
- QA Lead
- Security Engineer
- DevOps Release Manager
- Product Owner Validator.

Assume:

> This Pull Request deploys directly to production immediately after merge.

Be strict.

No superficial review allowed.

---

# 0. Mandatory Pre-Review Branch/PR Sync (EXECUTE FIRST)

Before running any review checks, you MUST detect PR linkage + working tree state and resolve it using the following deterministic flow.

## Detection

- `HAS_CHANGES`: `git status --porcelain` is non-empty.
- `HAS_PR`: current branch is linked to a PR (for example via `gh pr view --json number --jq '.number'`).

## Required Branch State Matrix

### Case A — Branch is NOT connected to a PR + uncommitted changes exist

You MUST:

1. Stay on the current branch.
2. Stage all changes (`git add -A`).
3. Commit all staged changes (single commit is acceptable; message should clearly indicate review prep).
4. Push branch to remote (`git push -u origin HEAD`).
5. Create a PR for the branch (`gh pr create`) targeting the default branch.
6. Ensure the branch is the checked-out branch for the remainder of the task.
7. Continue with the full review workflow below as normal.

### Case B — Branch IS connected to a PR + uncommitted changes exist

You MUST:

1. Stage all changes (`git add -A`).
2. Commit all staged changes.
3. Push updates to the same PR branch (`git push`).
4. Continue with the full review workflow below as normal.

### Case C — Branch IS connected to a PR + no uncommitted changes

You MUST:

1. Make no branch-content changes.
2. Continue with the full review workflow below as normal.

### Case D — Branch is NOT connected to a PR + no uncommitted changes

If no PR exists and there are no changes to commit, state that there is no active PR context to review and provide explicit next action(s) to create/select a PR.

## Enforcement Rules

- Do NOT skip this pre-review sync.
- Do NOT run review sections #1–#14 until the branch state matrix is resolved.
- Include in your final deliverables which case (A/B/C/D) was executed and what commands/actions were taken.

---

# Review Requirements

---

# 1. Functional Correctness

Verify:

- All referenced issues are fully implemented.
- Acceptance criteria completely satisfied.
- No incomplete workflows.
- Edge cases handled.

Detect:

- regressions
- logical defects
- unfinished implementation paths.

---

# 2. Engineering Quality

Evaluate:

- maintainability.
- modularity.
- configurability.
- extensibility.

Identify:

- duplication.
- anti-patterns.
- fragile abstractions.

Refactor where necessary.

---

# 3. Test Coverage

Verify:

- unit tests.
- integration tests.
- API tests.
- UI workflow validation.

Ensure:

- success paths.
- failure paths.
- edge cases covered.

Add tests where missing.

Goal:

> Near-complete meaningful coverage.

---

# 4. Build + CI/CD

Confirm:

- build success.
- lint success.
- formatting compliance.
- CI pipeline stability.

Detect flaky tests.

---

# 5. Security Review

Audit:

- secrets exposure.
- unsafe inputs.
- injection risks.
- dependency vulnerabilities.

---

# 6. Performance Review

Evaluate:

- inefficient queries.
- blocking operations.
- excessive allocations.

Recommend improvements.

---

# 7. UX Workflow Review

Verify:

- workflows complete.
- accessibility respected.
- mobile compatibility.

Detect:

- layout breaks.
- missing validation.

---

# 8. Documentation Review

Ensure:

- README updated.
- architecture docs aligned.
- API contracts accurate.

---

# 9. Mergeability

Confirm:

- clean rebase.
- no conflicts.
- commit clarity.

Ensure linked issues close correctly.

---

# 10. Risk Assessment

Identify:

- regression risks.
- rollback complexity.
- migration risk.

Recommend safeguards.

---

# 11. Copilot Suggestion Review

Review:

- Copilot recommendations.
- automated comments.

Implement beneficial suggestions.

Document rejected ones.

---

# 12. Enterprise Readiness (ER)

Verify:

- configuration externalized.
- environment handling correct.
- observability/logging implemented.
- standardized error handling.

---

# 13. Hidden Opportunity Discovery

Identify:

- scalability improvements.
- performance wins.
- automation opportunities.

---

# ⭐ 14. Mandatory Pull Request Governance (CRITICAL REQUIREMENT)

The PR description must function as:

> A complete execution contract, audit trail, reviewer guide, and deployment reference.

You MUST continuously maintain and update it.

---

## A. Diff Verification

Compare:

- commits.
- changed files.
- implemented features.
- refactors.
- fixes.
- tests.

against PR description.

Correct discrepancies.

---

# B. REQUIRED PR SUMMARY STRUCTURE

The PR description MUST include:

---

## Executive Summary

Clear explanation of purpose and outcome.

---

## Complete To-Do List (MANDATORY)

Maintain a live checklist including:

- Remaining work.
- Follow-up improvements.
- Deferred items.

Each item must include:

- Owner.
- Status.
- Priority.

Automatically update as work progresses.

---

## Acceptance Criteria (MANDATORY)

Include:

- All acceptance criteria.
- Completion status:
  - Complete
  - Partial
  - Deferred (with justification).

Verify against implementation.

---

## Reviewer Guidelines (MANDATORY)

Provide reviewers:

- How to validate workflows.
- Required manual testing steps.
- Key files impacted.
- Areas needing extra scrutiny.

---

## Implementation Checklist

Document:

- features added.
- fixes completed.
- refactors.
- documentation updates.

---

## Technical Change Summary

Include:

- architecture impacts.
- migrations.
- dependencies.

---

## Testing Coverage

Document:

- tests added.
- workflows validated.

---

## Security Considerations

Document:

- mitigations.
- new risks introduced.

---

## Performance Changes

Document optimizations.

---

## Breaking Changes

List explicitly or confirm none.

---

## Deployment Instructions

Include:

- migrations.
- config updates.
- rollout instructions.

---

## Risk Assessment

Low / Medium / High.

Explain reasoning.

---

## Outstanding Follow-Up Work

Track future GitHub issues or backlog items.

---

# C. Continuous Update Requirement

After ANY:

- fix,
- refactor,
- added test,
- documentation change,
- optimization,

you MUST update the PR summary again.

The PR summary must NEVER drift behind the branch state.

---

# Deliverables

Produce:

1. Executive Production Readiness Status.

2. Blocking Issues.

3. Missing Tests.

4. Security Findings.

5. Mergeability Status.

6. ER Completion Status.

7. Risk Level.

8. Fully Updated PR Summary.

---

# Final Requirement

Assume enterprise audit.

Assume production deployment.

Fix problems or clearly document them.

No incomplete PR allowed.

---

================================================================================
MANDATORY EXECUTION REPORTING — NTFY PHONE NOTIFICATION (URGENT + VIBRATE)
================================================================================

At the end of this task ALWAYS send exactly ONE ntfy notification to my phone.

Goals:

- Lock screen: ultra-short gist (1–3 lines).
- Expanded: full structured executive report.
- Include repo + git context and quick change stats when available.

Rules:

1. Always send ONE notification (even if nothing changed).
2. Keep the lock-screen section short and scannable.
3. Always include NEXT ACTIONS.
4. If you’re blocked, say why + what I should do next.

Topic:
https://ntfy.sh/copilot-notifications

EXECUTE (copy/paste runnable):

REPO="$(git rev-parse --show-toplevel 2>/dev/null | xargs basename || echo N/A)"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo N/A)"
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo N/A)"

# Prefer staged/working-tree stats; fall back to last commit if clean

CHANGE_SUMMARY="$(git diff --shortstat 2>/dev/null)"
if [ -z "$CHANGE_SUMMARY" ]; then
CHANGE_SUMMARY="$(git show --stat --oneline --format= 2>/dev/null | head -n 1 | sed 's/^ //')"
fi
if [ -z "$CHANGE_SUMMARY" ]; then
CHANGE_SUMMARY="No changes detected"
fi

curl -fsS -X POST "https://ntfy.sh/copilot-notifications" \
 -H "Title: 🚨 Copilot Update — ${REPO}" \
  -H "Priority: urgent" \
  -H "Tags: rotating_light,robot,rocket" \
  -H "Click: https://github.com" \
  -H "Markdown: yes" \
  -H "Sound: default" \
  -d "$(cat <<EOF

## ✅ Task Completed

**Repo:** \`${REPO}\`
**Scope:** <PR / Issue / Feature / Refactor / Fix>
**Outcome:** <ONE sentence: biggest achievement>
**Changes:** \`${CHANGE_SUMMARY}\`
**Next:** <ONE immediate next step>

---

## 📌 Executive Summary

### What was done

- <bullet>
- <bullet>
- <bullet>

### Files touched

- <path>
- <path>

### Quality checks

- Tests: <command> → <PASS/FAIL/SKIPPED>
- Lint: <command> → <PASS/FAIL/SKIPPED>
- Build: <command> → <PASS/FAIL/SKIPPED>

### Git context

- Branch: \`${BRANCH}\`
- Commit: \`${COMMIT}\`

### Risks / Notes

- <risk or note, or "None">

### Next actions (required)

1. <next step>
2. <next step>
3. <next step>

### High-value followups

- <optimization>
- <hardening>
  EOF
  )"

Run at the end of every cycle with no exceptions:

1. `cd "$(git rev-parse --show-toplevel)"`
2. `code chat -m agent "Follow instructions in .github\\prompts\\implement.prompt.md."`
