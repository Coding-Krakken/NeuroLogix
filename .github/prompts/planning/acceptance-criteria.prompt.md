# Acceptance Criteria

> **Category:** Planning
> **File:** `planning/acceptance-criteria.prompt.md`

---

## Purpose

Write precise, measurable, testable acceptance criteria for user stories using Given/When/Then format. Each criterion must be independently verifiable.

## When to Use

- Product Owner is defining requirements
- QA Engineer is mapping tests to requirements
- Before implementation begins
- During PR review (verifying criteria are met)

## Inputs Required

- User story ("As a [user], I want [goal], so that [benefit]")
- Business context
- Edge cases identified
- Performance requirements

## Outputs Required

```markdown
## Story: [Story title]

### Happy Path

- **AC-1:** Given [precondition], When [action], Then [expected result]
- **AC-2:** Given [precondition], When [action], Then [expected result]

### Error Paths

- **AC-3:** Given [invalid input], When [action], Then [error message shown]
- **AC-4:** Given [service unavailable], When [action], Then [graceful degradation]

### Edge Cases

- **AC-5:** Given [boundary condition], When [action], Then [correct behavior]

### Performance

- **AC-6:** Given [normal load], When [action], Then [completes in <Xms]

### Accessibility

- **AC-7:** Given [keyboard navigation], When [action], Then [correct behavior]
```

## Quality Expectations

- Each criterion has exactly one Given/When/Then
- Each criterion tests one thing
- Criteria are measurable (no "should be nice")
- Happy + error + edge + performance paths covered
- Criteria map to actual test cases

## Failure Cases

- Vague criteria ("works well") → Make specific and measurable
- Missing error paths → Add criteria for every possible failure
- No performance criteria → Add timing expectations

## Evidence Expectations

- Numbered acceptance criteria
- Test case mapping (AC-N → test file)
- Coverage of happy, error, edge, and performance paths
