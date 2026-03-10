## Summary

Implements the Issue #33 bounded Phase 5 vertical slice by adding one deterministic WMS/WCS connector+dispatch path with typed contracts, deterministic idempotency, transient retry handling, and dead-letter routing.

## Linked Issue

- Closes #33

## Scope

### In scope
- `packages/schemas`: bounded WMS/WCS dispatch command contract and idempotency-key helper.
- `packages/adapters`: bounded WMS/WCS ingestion/normalization adapter and dispatch service with duplicate handling, retry classification, and dead-letter routing.
- Targeted tests for schema normalization, duplicate idempotency, transient retry, and terminal dead-letter behavior.

### Out of scope
- Full connector orchestration/ecosystem.
- Mission Control UI/security/chaos/federation follow-on phases (`#34+`).
- `.github/` framework changes.

## Testing Evidence

- `npm run test --workspace @neurologix/schemas`
- `npm run test --workspace @neurologix/adapters`
- `npm run lint --workspace @neurologix/schemas`
- `npm run lint --workspace @neurologix/adapters`
- `npm run build --workspace @neurologix/schemas`
- `npm run build --workspace @neurologix/adapters`
- `npm run lint` (passes with baseline warnings in unrelated packages)
- `npm run test`
- `npm run build`

## Risk Assessment

- Risk level: low-to-medium
- Main risk: idempotency and dead-letter storage is intentionally in-memory/process-local for this bounded slice.
- Mitigation: deterministic behavior is locked by targeted tests.

## Rollback Notes

Revert this PR to remove the bounded WMS/WCS dispatch path and restore previous behavior.

## Follow-up

No follow-up issue required for this bounded acceptance slice.
