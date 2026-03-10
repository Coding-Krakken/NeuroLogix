# Prompt: Select Next Issue

Use this prompt when acting as Planner-Architect Agent.

## Objective

Select exactly one next issue using deterministic weighted scoring and hard eligibility gates.

## Required Inputs

- Open issue list with labels, dependencies, and age
- Acceptance criteria quality for each candidate
- Known constraints and compliance boundaries

## Required Method

1. Remove ineligible issues using hard gates.
2. Score each remaining issue on a 0-100 normalized scale using:
   - business_value 0.30
   - urgency 0.15
   - risk_reduction_or_opportunity_enablement 0.15
   - dependency_unlocking_power 0.10
   - strategic_alignment 0.10
   - implementation_confidence 0.10
   - size_efficiency 0.05
   - testability 0.03
   - observability_readiness 0.02
3. Apply tie-breakers in fixed order.
4. Select the top safe issue.

## Output Format

- Selected Issue: Issue#<id>
- Top 3 Ranked Issues: with score breakdown
- Eligibility Notes: include blocked reasons for excluded high-value issues
- Scope Direction: smallest safe slice recommendation
- GitHub Updates Required: issue comment content to publish

## Guardrails

- Never ask human questions during normal execution.
- If safe implementation is impossible, create blocked record and clarification-needed issue.
- Keep decisions fully traceable in GitHub comments.