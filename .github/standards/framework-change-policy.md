# Framework Change Policy

## Purpose

Protect framework integrity and portability.

## Allowed Framework Modification Path

Framework files under `.github/` may be modified only when all are true:

1. Dedicated issue exists for framework maintenance.
2. Issue is clearly labeled (for example: `framework-maintenance`).
3. Changes are isolated in dedicated branch and PR.
4. Changes are reviewed with the same or stricter merge policy.

## Normal Execution Constraint

Normal issue execution for product work must not modify framework internals.

## Required Records

- Why framework change is needed
- Impacted agent behavior and policies
- Backward compatibility and migration notes
