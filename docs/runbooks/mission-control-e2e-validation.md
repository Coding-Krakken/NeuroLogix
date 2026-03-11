# Mission Control Deterministic E2E Validation

## Purpose

Provide a deterministic Playwright baseline for a critical operator journey:
policy-gated dispatch command flow in Mission Control.

## Scope

- Validates that dispatch policy decisions are enforced before command execution.
- Validates deterministic allow-path dispatch (`allocate_pick`, `operator`, confirmation accepted).
- Validates denial path when confirmation is not accepted.

## Local Execution

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Run deterministic E2E baseline:

   ```bash
   npm run test:e2e
   ```

## CI Gate

- Workflow: `.github/workflows/ci.yml`
- Job: `E2E`
- Trigger: pull requests and pushes to `main`
- Build gate: final `Build` job depends on `E2E`

## Expected Evidence

- Playwright summary shows all mission-control specs passed.
- No conditional skips in the critical dispatch allow-path test.
- CI `E2E` job is green for the PR head SHA.
- CI uploads `e2e-evidence-<run_id>-<run_attempt>` with:
  - `playwright-report/`
  - `test-results/e2e-results.json`
  - `test-results/e2e-triage-summary.json`
  - `test-results/e2e-triage-summary.md`

## Evidence Export (Local)

1. Run deterministic baseline:

   ```bash
   npm run test:e2e
   ```

2. Export triage summary:

   ```bash
   npm run test:e2e:triage
   ```

3. Review generated artifacts:
   - `test-results/e2e-results.json`
   - `test-results/e2e-triage-summary.json`
   - `test-results/e2e-triage-summary.md`

## Failure Triage

1. Check policy endpoint behavior:
   - `GET /api/control-policy?commandType=allocate_pick&actorRole=operator&confirmationAccepted=true`
   - Expected status: `allowed`
2. Check dispatch endpoint behavior:
   - `POST /api/dispatch`
   - Expected response status: `200` and result status `dispatched`
3. Re-run local gate:

   ```bash
   npm run test:e2e
   ```

4. Export local triage summary for incident evidence:

   ```bash
   npm run test:e2e:triage
   ```

5. Open `test-results/e2e-triage-summary.md` and correlate failed specs with
   `playwright-report/` trace artifacts.

6. If still failing, inspect mission-control policy logic in `apps/mission-control/src/state/mission-control-state.ts` and dispatch route wiring in `apps/mission-control/src/server.ts`.