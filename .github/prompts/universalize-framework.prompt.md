# Universal Framework Sanitization Prompt

Use this prompt to transform a repository-specific governance framework into a
universal, reusable baseline.

---

You are sanitizing this repository so it becomes a universal framework template.

## Objective

Remove or neutralize all project-specific personalization and historical
execution artifacts while preserving reusable governance and process structure.

## Required Actions

1. Delete historical handoff and execution artifacts (handoff folders, issue/pr
   body dumps, one-off migration artifacts).
2. Remove issue-specific and scenario-specific model files (files named for
   specific issue IDs, project names, or one-off initiatives).
3. Rewrite remaining docs/configs to replace organization, product, stack, and
   location references with neutral placeholders.
4. Keep only universal framework mechanics (templates, policies, checklists,
   routing rules, quality gates, generic prompts).
5. Do not invent new workflow patterns; preserve existing deterministic
   structure where generic.

## Replacement Rules

- Replace organization/project names with placeholders like
  `<ORGANIZATION_NAME>`, `<REPOSITORY_NAME>`, `<APPLICATION_NAME>`.
- Replace stack-specific names with generic placeholders like `<WEB_FRAMEWORK>`,
  `<PAYMENT_PROVIDER>`, `<DEPLOYMENT_PLATFORM>`.
- Replace issue/PR references (`Issue #<WORK_ITEM_ID>`,
  `feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>*`) with neutral placeholders.

## Safety Constraints

- Do not modify `.git/`.
- Do not alter executable code semantics in reusable framework modules unless
  required for de-personalization.
- Prefer minimal diffs and deterministic edits.
- Output a summary with:
  - removed directories/files count
  - rewritten files count
  - remaining files that still appear personalized.

## Deliverables

1. Sanitized repository state.
2. A short report listing what was removed, what was rewritten, and what still
   needs manual review.
