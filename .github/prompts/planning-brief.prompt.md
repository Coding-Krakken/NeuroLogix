# Prompt: Planning Brief

Use this prompt after issue selection to generate the Builder-ready implementation brief.

## Objective

Produce a precise, bounded, testable implementation brief for the smallest complete safe slice.

## Required Sections

1. Work Item
   - Issue ID and title
   - Why this issue now
2. Problem and Desired Outcome
3. In Scope
4. Out of Scope
5. Acceptance Criteria Decomposition
6. Implementation Strategy
   - vertical slice details
   - compatibility constraints
7. Test Strategy
   - unit/integration/e2e expectations as applicable
8. Risk, Safety, and Rollback Notes
9. Required GitHub Updates
10. Builder Handoff Instructions

## Guardrails

- Keep scope minimal and reviewable.
- Avoid speculative redesign.
- Preserve backward compatibility unless explicitly authorized.
- Include explicit non-goals.