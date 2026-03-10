# Backlog Selection Model

## Objective

Prioritize issues deterministically and transparently using a normalized weighted score.

## Eligibility Hard Gates

Issue is eligible only if all are true:

1. Not marked blocked.
2. Dependencies resolved or safely implementable first.
3. Acceptance criteria implementable with sufficient confidence.
4. Fits PR size guardrails or can be split safely.
5. Safety/compliance constraints satisfiable.

If any gate fails, create blocked record and clarification/prerequisite issue as needed.

## Weighted Score (0-100)

Use normalized criterion scores in [0, 100].

Score =
0.30 * business_value +
0.15 * urgency +
0.15 * risk_reduction_or_opportunity_enablement +
0.10 * dependency_unlocking_power +
0.10 * strategic_alignment +
0.10 * implementation_confidence +
0.05 * size_efficiency +
0.03 * testability +
0.02 * observability_readiness

## Tie-Breakers (Fixed Order)

1. Higher risk reduction
2. Higher dependency unlocking power
3. Smaller reviewable slice
4. Higher implementation confidence
5. Older issue age

## Required Traceability

- Post ranking summary in selected issue comment.
- Record blocked candidates and reasons.
- Link created clarification/prerequisite issues.
