# Risk Analysis

> **Category:** Discovery
> **File:** `discovery/risk-analysis.prompt.md`

---

## Purpose

Identify, categorize, and prioritize risks in the codebase, infrastructure, and delivery pipeline. Produce an actionable risk register.

## When to Use

- Before major feature work
- During sprint planning
- When evaluating a PR with broad impact
- Periodic risk reviews
- Before production deployments

## Inputs Required

- Repo scan results (or access to scan)
- Recent changes (git log, open PRs)
- Current quality gate status
- Known issues/tech debt

## Outputs Required

A risk register with the following per risk:

| Field       | Description                                                       |
| ----------- | ----------------------------------------------------------------- |
| ID          | Unique identifier                                                 |
| Category    | Security, Performance, Reliability, Quality, Business, Compliance |
| Description | Clear description of the risk                                     |
| Likelihood  | High, Medium, Low                                                 |
| Impact      | Critical, High, Medium, Low                                       |
| Risk Score  | Likelihood × Impact                                               |
| Mitigation  | Concrete actions to reduce risk                                   |
| Owner       | Which agent should address this                                   |
| Status      | Open, Mitigating, Accepted, Resolved                              |

## Quality Expectations

- Every risk backed by evidence (file paths, metrics, observations)
- Mitigations are concrete and actionable
- Risks are prioritized (not just listed)
- No speculative risks without evidence

## Failure Cases

- No risks found → Unlikely. Look harder. Check dependencies, error handling, test coverage.
- Too many risks → Prioritize top 10, group others by category.

## Evidence Expectations

- Code references for code risks
- Dependency versions for dependency risks
- Coverage numbers for test risks
- Configuration files for security risks

## Example Output

```markdown
| ID  | Category    | Risk                                      | Likelihood | Impact   | Score  | Mitigation                      |
| --- | ----------- | ----------------------------------------- | ---------- | -------- | ------ | ------------------------------- |
| R1  | Security    | Square API token has no rotation schedule | Medium     | Critical | HIGH   | Implement 90-day rotation       |
| R2  | Quality     | Test coverage at 65% (target 80%)         | High       | Medium   | HIGH   | Add tests for uncovered modules |
| R3  | Reliability | No E2E tests for checkout                 | Medium     | High     | HIGH   | Add Playwright tests            |
| R4  | Performance | No bundle size monitoring                 | Low        | Medium   | MEDIUM | Add Lighthouse CI               |
```
