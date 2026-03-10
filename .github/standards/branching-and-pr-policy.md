# Branching and PR Policy

## Branching

- Use short-lived branches from latest `main` unless release policy requires otherwise.
- One primary issue per branch.
- Branch name format: `<type>/<issue-id>-<short-slug>`

Examples:

- `feature/1234-add-bulk-import`
- `bugfix/5678-fix-timezone-drift`
- `security/9012-harden-session-cookie`
- `refactor/2468-extract-domain-service`

## Pull Request Requirements

Every PR must include:

- summary
- linked issue
- scope (in/out)
- testing evidence
- risk assessment
- rollout notes if needed
- follow-up issues if any

## PR Size Guardrails

Preferred:

- up to 25 files changed
- up to 600 lines changed

Warning threshold:

- up to 40 files changed
- up to 1000 lines changed

When threshold exceeded:

- split work into safe slices
- keep highest-value safe slice in current PR
- create follow-up issues for deferred slices
