# Microsoft-Grade PR Review

> **Category:** Review
> **File:** `review/microsoft-grade-pr-review.prompt.md`

---

## Purpose

Conduct a thorough, enterprise-grade code review covering correctness, security, performance, accessibility, maintainability, and production readiness. This is the highest-quality review standard.

## When to Use

- Reviewing any PR before merge
- Quality Director final review
- Security-sensitive changes
- Production deployment readiness

## Inputs Required

- PR diff (files changed)
- PR description
- Linked issue/ADR
- Acceptance criteria
- Full repo context

## Outputs Required

Structured review with severity ratings:

```markdown
## PR Review: [Title]

### Summary

[1-2 sentence overall assessment]

### Verdict: APPROVE / REQUEST CHANGES / BLOCK

---

### 🔴 Blocking Issues (Must Fix)

| #   | Category | File | Issue | Fix |
| --- | -------- | ---- | ----- | --- |
| 1   | Security | ...  | ...   | ... |

### 🟡 Non-Blocking Issues (Should Fix)

| #   | Category | File | Issue | Suggestion |
| --- | -------- | ---- | ----- | ---------- |
| 1   | Quality  | ...  | ...   | ...        |

### 🟢 Nits (Optional)

| #   | File | Suggestion |
| --- | ---- | ---------- |
| 1   | ...  | ...        |

### Checklist

- [ ] Correctness: Logic is correct
- [ ] Types: No any, proper typing
- [ ] Security: Input validated, no secrets
- [ ] Performance: No unnecessary re-renders, proper caching
- [ ] Accessibility: Semantic HTML, ARIA, keyboard
- [ ] Tests: Adequate coverage, correct assertions
- [ ] Documentation: Updated where needed
- [ ] Model compliance: Code matches models
- [ ] Patterns: Canonical patterns followed
- [ ] Error handling: All paths handled
```

## Review Categories

1. **Correctness** — Does it do what it should?
2. **Security** — Is it safe? Input validation? PCI?
3. **Performance** — Will it be fast? Memory leaks? Bundle size?
4. **Accessibility** — Keyboard? Screen reader? Contrast?
5. **Maintainability** — Clean code? Good names? DRY?
6. **Tests** — Adequate? Correct? Meaningful?
7. **Documentation** — Updated? Accurate? Complete?
8. **Model Compliance** — Does code match domain model?
9. **Patterns** — Canonical pattern used? No one-offs?
10. **Error Handling** — All failure modes handled?

## Quality Expectations

- Every issue has a specific file and line reference
- Every blocking issue has a concrete fix suggestion
- Review is objective and evidence-based
- No "looks good" without verification

## Failure Cases

- PR has no tests → BLOCK
- PR has security vulnerability → BLOCK
- PR changes behavior without updating tests → BLOCK
- PR has `any` types without justification → REQUEST CHANGES
- PR exceeds 500 lines → REQUEST split

## Evidence Expectations

- Specific file:line references for every issue
- Test output verification
- Quality gate status verification
- Model compliance verification
