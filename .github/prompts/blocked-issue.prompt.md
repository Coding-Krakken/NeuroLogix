# Prompt: Blocked Issue Handling

Use this prompt when safe implementation is not currently possible.

## Objective

Block cleanly with explicit rationale, preserve traceability, and maintain loop continuity.

## Required Actions

1. Create blocked record with:
   - issue reference
   - blocking condition
   - evidence and constraints
   - risk if forced
2. Create clarification-needed or prerequisite issue.
3. Link blocked and newly created issues bidirectionally.
4. Publish concise issue comment explaining why progress is blocked.
5. Continue with next eligible issue.

## Guardrails

- Do not guess high-risk requirements.
- Do not ask human questions in normal flow; use issue creation and labels.
- Do not proceed with unsafe implementation.