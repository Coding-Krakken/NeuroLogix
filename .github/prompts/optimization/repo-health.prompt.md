# Repo Health Check

> **Category:** Optimization
> **File:** `optimization/repo-health.prompt.md`

---

## Purpose

Assess the overall health of the repository across multiple dimensions: code quality, test coverage, dependency freshness, documentation, security, and developer experience.

## When to Use

- Monthly health check
- Before sprint planning
- When onboarding new team members
- When evaluating technical debt priorities
- After major refactoring

## Inputs Required

- Repository access
- CI/CD status
- Coverage reports
- Dependency status

## Outputs Required

```markdown
## Repo Health Report

### Overall Score: X/10

### Dimensions

| Dimension      | Score | Status   | Key Issue |
| -------------- | ----- | -------- | --------- |
| Code Quality   | X/10  | 🟢/🟡/🔴 | ...       |
| Test Coverage  | X/10  | 🟢/🟡/🔴 | ...       |
| Dependencies   | X/10  | 🟢/🟡/🔴 | ...       |
| Documentation  | X/10  | 🟢/🟡/🔴 | ...       |
| Security       | X/10  | 🟢/🟡/🔴 | ...       |
| CI/CD          | X/10  | 🟢/🟡/🔴 | ...       |
| Dev Experience | X/10  | 🟢/🟡/🔴 | ...       |
| Performance    | X/10  | 🟢/🟡/🔴 | ...       |

### Code Quality

- Lint errors: X
- TypeScript errors: X
- any types: X
- Files >300 lines: X
- Duplicated code: X areas

### Test Coverage

- Line coverage: X%
- Branch coverage: X%
- Untested critical paths: X
- Test reliability: X% pass rate

### Dependencies

- Outdated: X packages
- Vulnerabilities: X (critical: X, high: X)
- Deprecated: X packages
- Last audit: [date]

### Documentation

- README: Current/Stale
- API docs: Complete/Partial/Missing
- ADRs: X total
- Runbooks: X (gaps: X)

### Top 5 Improvements

1. [Highest impact improvement]
2. [Next improvement]
3. [Next improvement]
4. [Next improvement]
5. [Next improvement]
```

## Quality Expectations

- All dimensions assessed with data
- Scores justified with evidence
- Improvements prioritized by impact
- Trends tracked over time (if previous reports exist)

## Failure Cases

- Cannot run all checks → Report what's available, note gaps
- First report → Establish baseline, identify quick wins

## Evidence Expectations

- CI output
- Coverage reports
- npm audit output
- Lint/typecheck output
- Dependency analysis
