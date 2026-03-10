# Phase 6 Mission Control Foundation (Bounded Slice)

## Summary

This slice introduces a bounded Mission Control application foundation at `apps/mission-control`.
It provides deterministic command-center, line-view, and event-timeline APIs with a React-based operator shell.

## In Scope

- New workspace: `@neurologix/mission-control`
- Deterministic Mission Control state engine based on:
  - `DemoLineSimulator` from `@neurologix/adapters`
  - `WmsWcsDispatchService` from `@neurologix/adapters`
- API routes:
  - `GET /health`
  - `GET /api/stream` (Server-Sent Events)
  - `GET /api/command-center`
  - `GET /api/line-view`
  - `GET /api/events`
  - `POST /api/tick`
  - `POST /api/dispatch`
- React-based operator shell (served at `/`) for command center, line view, event timeline, and dispatch submission.
- Realtime streaming transport via SSE with one-shot stream mode for deterministic test validation.
- Accessibility baseline for the operator shell: skip navigation, semantic panel relationships, keyboard focus visibility, and screen-reader live regions.
- Targeted tests for API health, snapshots, stream payloads, and dispatch idempotency.

## Out of Scope

- Production-grade React build pipeline and component design system.
- Full authentication/authorization and role-aware control workflow.
- Production telemetry pipelines and cross-service event-bus federation.
- Phase 7+ security/compliance and Phase 8+ validation/chaos expansion.

## Deterministic Behaviors

- Simulator emits deterministic line telemetry for `demo-line-canonical-v1`.
- Realtime dashboard state is published deterministically over SSE `snapshot` events.
- Dispatch duplicate submissions are handled idempotently.
- Event timeline entries are bounded and ordered by insertion.
- Shell announces realtime status and error conditions for assistive technologies.

## Validation Evidence

- `npm run lint --workspace @neurologix/mission-control`
- `npm run test --workspace @neurologix/mission-control`
- `npm run build --workspace @neurologix/mission-control`
- `npm run lint`
- `npm test`
- `npm run build`

## Risk and Rollback

- Risk: This slice uses a bounded in-memory state model and is not yet connected to persistent storage.
- Rollback: Revert changes under `apps/mission-control` and lockfile update.
