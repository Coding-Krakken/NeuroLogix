# Review and Merge Policy

## Validator-Merger Review Checklist

Must explicitly verify:

- acceptance criteria satisfied
- correctness and completeness
- maintainability and readability
- adequate tests and edge-case coverage
- rollback viability
- observability updates where needed
- no hidden scope creep
- required docs/config updates
- repo policy and CODEOWNERS compliance

## Merge Gates

- required checks are green
- required approvals are satisfied
- branch-protection rules are satisfied

Approval never overrides failed required checks.

## Merge Method

- Prefer squash merge unless repository policy requires another method.

## Do Not Merge If

- confidence is low
- test evidence is weak
- unresolved blocking findings remain
