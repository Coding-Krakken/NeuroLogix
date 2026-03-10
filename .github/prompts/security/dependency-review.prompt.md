# Dependency Review

> **Category:** Security
> **File:** `security/dependency-review.prompt.md`

---

## Purpose

Audit project dependencies for security vulnerabilities, license compliance, maintenance status, and supply chain risks.

## When to Use

- Adding a new dependency
- Periodic dependency audit (monthly)
- Before production deployment
- After Dependabot alert

## Inputs Required

- package.json (dependencies + devDependencies)
- npm audit output
- Dependabot alerts (if any)
- Lock file (package-lock.json)

## Outputs Required

```markdown
## Dependency Audit Report

### Summary

- Total dependencies: X
- Direct: X, Transitive: X
- Vulnerabilities: X critical, X high, X medium, X low
- Outdated: X packages
- Deprecated: X packages

### Vulnerabilities

| Package | Severity | CVE     | Fix Available | Action |
| ------- | -------- | ------- | ------------- | ------ |
| ...     | Critical | CVE-... | Yes: v1.2.3   | UPDATE |

### Outdated Dependencies

| Package | Current | Latest | Breaking Changes |
| ------- | ------- | ------ | ---------------- |
| ...     | 1.0.0   | 2.0.0  | Yes              |

### License Review

| Package | License | Compatible | Notes           |
| ------- | ------- | ---------- | --------------- |
| ...     | MIT     | ✅         |                 |
| ...     | GPL-3.0 | ⚠️         | Review required |

### Supply Chain Risk

- [ ] All dependencies from trusted registries
- [ ] No typosquatting concerns
- [ ] Maintainers are established
- [ ] No recent ownership transfers

### Recommendations

1. [Prioritized action items]
```

## Quality Expectations

- All vulnerabilities identified with CVE numbers
- Fix availability checked
- License compatibility verified
- Supply chain risks assessed

## Failure Cases

- npm audit fails → Check network, try again
- No lock file → Create one (`npm install`)

## Evidence Expectations

- npm audit output
- Outdated package list
- License inventory
- Dependabot alert status
