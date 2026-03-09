# Deterministic Worked Examples

## Example 1: High-risk feature touching backend + data migration

### Issue (filled)

- Type: `feature`
- Severity/Priority: `S1 / P1`
- Risk: `high`
- Component Area: `backend`
- Deployment Surface: `prod`
- Rollout: `ring`
- Data Sensitivity: `confidential`
- Acceptance: add inventory reservation API + dual-write migration with
  rollback.

### Computed policy outputs

- Approvers: `product-owner`, `engineering-lead`, `qa-test-engineer`,
  `sre-engineer`, `security-engineer`.
- Tests: `unit`, `integration`, `e2e`, `migration-dry-run`, `data-validation`,
  `security-scan`, `smoke`.
- Docs: `migration-plan`, `compatibility-plan`, `runbook-update`,
  `release-notes`.
- Rollout: feature flag + ring rollout + enhanced monitoring.

### PR (filled summary)

- Linked Issue: `Closes #101`
- Risk section includes blast radius `customer-visible` and fallback to legacy
  write path.
- Testing evidence includes dry-run hashes and rollback test output.

### State transitions and agents

`draft -> triage (product-owner) -> planned (program-manager) -> in-progress (backend-engineer + data-engineer) -> in-review (qa-test-engineer + security-engineer + engineering-lead) -> approved -> ready-to-release (devops-engineer) -> released (sre-engineer) -> verified (quality-director) -> closed`

### Final release/verification

- Ring rollout `10 -> 25 -> 50 -> 100` with p95 + error-rate threshold checks.
- Verification window: 24h incident-free + migration integrity validation.

---

## Example 2: P0 production bug hotfix

### Issue (filled)

- Type: `hotfix`
- Severity/Priority: `S0 / P0`
- Risk: `critical`
- Component Area: `backend`
- Deployment Surface: `prod`
- Rollout: `canary`

### Computed policy outputs

- Approvers: `engineering-lead`, `qa-test-engineer`, `sre-engineer`,
  `99-quality-director`, `executive-sponsor`.
- Tests: `targeted`, `smoke`, `incident-validation`, `security-scan`.
- Docs: `hotfix-rationale`, `follow-up-issue`, `incident-summary`.

### PR (filled summary)

- Minimal diff only; explicit rollback command and threshold.
- Acceptance includes post-release audit within 24h.

### State transitions and agents

`triggered (incident-commander) -> scoped -> fix-implemented (backend-engineer) -> expedited-review (qa/lead/sre) -> released (sre) -> post-release-audit (quality-director) -> closed`

### Final release/verification

- Canary at 5% for 15 minutes, then 100% after stable error budget.
- Linked prevention issue created before closure.

---

## Example 3: Security vulnerability with disclosure

### Issue (filled)

- Type: `security-vulnerability`
- Severity/Priority: `S1 / P0`
- Risk: `critical`
- Data Sensitivity: `regulated`
- Disclosure: `coordinated-disclosure`

### Computed policy outputs

- Approvers: `security-engineer`, `legal-counsel`, `privacy-compliance-officer`,
  `engineering-lead`, `99-quality-director`.
- Tests: `security-scan`, `regression`, `privacy-review`,
  `compliance-validation`.
- Docs: `security-advisory`, `mitigation-notes`,
  `data-protection-impact-assessment`.

### PR (filled summary)

- Includes exploit reproduction before/after and redaction proof.
- Disclosure date and affected versions recorded.

### State transitions and agents

`reported -> validated (security-engineer) -> severity-assessed -> containment -> patching (implementation engineer) -> verification (qa + security) -> disclosure (legal-counsel) -> closed`

### Final release/verification

- Security release note published after coordinated window.
- Continuous scan confirmation attached.

---

## Example 4: CI pipeline refactor reducing Actions spend without lowering quality

### Issue (filled)

- Type: `ci-cd`
- Severity/Priority: `S3 / P2`
- Risk: `medium`
- Component Area: `platform`
- Deployment Surface: `non-prod`

### Computed policy outputs

- Approvers: `platform-engineer`, `devops-engineer`, `engineering-lead`.
- Tests: `pipeline-self-test`, `lint`, `typecheck`.
- Docs: `pipeline-change-notes`, `rollback-runbook`.
- Rollout: staged enable with quality equivalence proof.

### PR (filled summary)

- Adds matrix optimization and cache improvements.
- Includes before/after run-time and cost comparison.

### State transitions and agents

`triage -> planned -> in-progress (platform-engineer) -> in-review (qa + devops + lead) -> approved -> ready-to-release -> released -> verified -> closed`

### Final release/verification

- Week-long compare on success rate and failure signatures.
- Automatic rollback to prior workflow on regression.

---

## Example 5: Incident SEV2 with rollback and postmortem

### Issue (filled)

- Type: `incident`
- Severity/Priority: `S2 / P1`
- Risk: `critical`
- Component Area: `infra`
- Deployment Surface: `prod`

### Computed policy outputs

- Approvers: `incident-commander`, `sre-engineer`, `99-quality-director`.
- Tests: `smoke`, `incident-validation`, `observability-check`.
- Docs: `incident-log`, `postmortem`, `runbook-update`.

### PR (filled summary)

- Reverts faulty infra change and introduces safeguard alert.
- Includes customer comms timeline.

### State transitions and agents

`detected -> triage-sev (incident-commander) -> mitigated (sre/devops) -> stabilized -> resolved -> postmortem (incident-commander + engineering-lead) -> closed`

### Final release/verification

- Rollback completed within policy window.
- Postmortem filed with two preventive follow-up issues.
