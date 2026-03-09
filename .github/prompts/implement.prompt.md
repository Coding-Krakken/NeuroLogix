---
name: implement
description: Implement code changes with strict adherence to the Universal Model-First Copilot Implementation Directive, ensuring deterministic behavior, minimal entropy, and maximal maintainability across the entire codebase and delivery lifecycle.
agent: agent
---

================================================================================
UNIVERSAL MODEL-FIRST COPILOT IMPLEMENTATION DIRECTIVE (FULL MODEL GOVERNANCE)
(Deterministic, Entropy-Resistant, Multi-Model Enforcement)
================================================================================

PURPOSE:
This directive governs ALL implementation activities in the repository.

It may be invoked with:

- PR number
- Issue number
- Natural language request
- Feature idea
- Refactor request
- Bug report
- OR no arguments

Regardless of input, you MUST begin with model evaluation.

No code before models.
No prose before structure.
No drift between models and code.

================================================================================
GLOBAL PRINCIPLE
================================================================================

Every domain in the codebase has a canonical model.

Code must mirror models.
Tests must trace to models.
Docs must derive from models.
Delivery must be governed by models.
Roadmap must be governed by models.

You are probabilistic.
You must behave deterministically.

================================================================================
AMM-OS CONSTITUTIONAL COMPLIANCE (ENFORCED)
================================================================================

Every implementation must maintain AMM-OS compliance:

1. MODULARITY: Changes respect layer boundaries (Domain/Application/Infrastructure/Interface)
2. MULTI-TENANCY: All data operations are tenant-scoped (tenant_id enforced)
3. MONETIZATION: New features include entitlement checks (feature_id, entitlement_key, plan mapping)
4. CONFIGURABILITY: No new hardcoded values that belong in UI config
5. OBSERVABILITY: All significant operations emit structured logs with correlation IDs
6. SECURITY: No secrets in code, all inputs validated, least privilege enforced
7. RISK TIER: Changes comply with declared tier requirements (T0/T1/T2/T3)
8. PACKETS: .customer/ and .github/.developer/ updated per change
9. BRANCH SAFETY: Changes only via feature/\* → pre-main → main
10. DEFINITION OF DONE: All gates pass before merge (CI, tests, scans, docs)

If a change reduces any AMM-OS pillar (configurability, modularity, monetization,
tenant isolation, deliverability, observability, security), it MUST be justified
via ADR in .github/.developer/DECISIONS.md.

CI will block PRs that violate AMM-OS requirements.

================================================================================
PHASE -1 — META-REASONING & INVOCATION CLASSIFICATION
================================================================================

1. Identify invocation type.
2. Restate mission formally.
3. Classify domain.
4. Assess risk.
5. Set proportional rigor.
6. Declare complexity and entropy budget.

Reject unnecessary abstraction.
Reject unnecessary refactor.
Justify minimal sufficient scope.

================================================================================
PHASE 0 — LOAD ALL CANONICAL MODELS
================================================================================

You must locate and validate:

1. Copilot Instruction Model:
   .github/.system-state/copilot/instruction.model.yaml

2. System State Model:
   .github/.system-state/model/system_state_model.yaml

3. Delivery State Model:
   .github/.system-state/delivery/delivery_state_model.yaml

4. Contracts Model:
   .github/.system-state/contracts/api.yaml
   .github/.system-state/contracts/events.yaml
   .github/.system-state/contracts/errors.yaml

5. Data Model:
   .github/.system-state/data/data_state_model.yaml

6. Security Model:
   .github/.system-state/security/threat_model.yaml
   .github/.system-state/security/rbac_matrix.yaml

7. Failure & Resilience Model:
   .github/.system-state/resilience/failure_modes.yaml

8. Observability Model:
   .github/.system-state/ops/metrics_catalog.yaml
   .github/.system-state/ops/slo.yaml

9. Test Traceability Model:
   .github/.system-state/model/test_traceability.yaml

10. Performance Model:
    .github/.system-state/perf/budgets.yaml

11. Dependency Governance Model:
    .github/.system-state/deps/dependency_policy.yaml

12. CI/CD & Environment Model:
    .github/.system-state/ci/pipeline_model.yaml
    .github/.system-state/release/release_strategy.yaml

13. Roadmap & Prioritization Model:
    .github/.system-state/roadmap/roadmap_model.yaml

If any model is missing for the affected scope:

- Create or minimally update it before proceeding.

No implementation without model alignment.

================================================================================
PHASE 1 — REVERSE-MODEL CURRENT CODEBASE STATE
================================================================================

Create:

.github/.system-state/model/codebase_state_snapshot.yaml

Must include:

- Current ontology
- Current state variables
- Current transitions
- Current invariants enforced
- Current IO contracts
- Current persistence schema
- Current security enforcement
- Current failure handling
- Current observability hooks
- Current performance assumptions
- Current dependency usage
- Current CI/CD enforcement

This snapshot must reflect actual repository reality.

================================================================================
PHASE 2 — MODEL DIFFERENTIAL ANALYSIS
================================================================================

Create:

.github/.system-state/model/model_codebase_diff.md

You must compute diffs between:

- system_state_model vs codebase
- contracts model vs endpoints
- data model vs DB schema
- security model vs enforcement points
- failure model vs implemented retries/timeouts
- observability model vs metrics/logging
- performance model vs hot paths
- dependency model vs package manifests
- CI model vs pipeline config
- delivery model vs actual work progress

Categorize diffs:

- Fatal
- Major
- Minor
- Documentation-only

If fatal gaps exist → mark BLOCKED, document blocker evidence, and dispatch/escalate via the defined chain. Do not ask a human to choose the next step.

Minimize diff surface.
Prefer smallest alignment change first.

================================================================================
PHASE 3 — DELIVERY STATE UPDATE
================================================================================

Update:

.github/.system-state/delivery/delivery_state_model.yaml

You must:

- Create or activate a WorkItem
- Assign complexity and entropy budget
- Define scope boundary
- Define required artifacts
- Define acceptance criteria
- Link affected models
- Define rollback requirements
- Define migration requirements (if any)

No transition to "Implementing" without:

- Model alignment
- Validation complete
- Plan complete

================================================================================
PHASE 4 — VALIDATION & STRESS ANALYSIS
================================================================================

Create:

.github/.system-state/model/implementation_validation_report.md

Must include:

- Hidden state detection
- Undefined transitions
- Invariant enforcement gaps
- Security threat delta
- Failure mode coverage delta
- Performance impact forecast
- Entropy expansion risk
- Rollback feasibility
- Dependency risk
- CI/CD gate impact

If entropy or complexity exceeds budget → simplify.

================================================================================
PHASE 5 — IMPLEMENTATION PLAN
================================================================================

Create:

.github/.system-state/plan/implementation_plan.md

Must include:

- Minimal diff boundary
- File-by-file changes
- Transition-by-transition mapping
- Invariant-by-invariant enforcement mapping
- Data migration steps
- Rollback strategy
- Dependency additions (justified)
- CI/CD modifications (if required)
- Model updates required
- Determinism enforcement checklist

You must explicitly declare:
"No unrelated code will be modified."

================================================================================
PHASE 6 — IMPLEMENTATION (CODE)
================================================================================

Now implement.

Strict rules:

- Enforce invariants.
- Enforce transitions.
- Enforce security.
- Enforce concurrency model.
- Implement failure behavior exactly as modeled.
- Respect performance budgets.
- Respect dependency policy.
- Respect CI/CD constraints.
- Do not rename unrelated symbols.
- Do not refactor outside scope boundary.
- Do not introduce speculative abstractions.
- Produce stable, deterministic code.

Choose ONE canonical implementation path.

================================================================================
PHASE 7 — TEST & TRACEABILITY UPDATE
================================================================================

Update:

- .github/.system-state/model/test_traceability.yaml

Add tests for:

- Invariants
- Transitions
- Security rules
- Failure modes
- Performance expectations
- Determinism (where applicable)

Tests must trace directly to model elements.

================================================================================
PHASE 8 — POST-IMPLEMENTATION ALIGNMENT
================================================================================

Create:

.github/.system-state/model/post_implementation_alignment_report.md

Must confirm:

- All affected models updated
- Code mirrors system model
- Contracts align
- Data schema aligns
- Security aligns
- Failure model aligns
- Observability aligns
- Performance budgets respected
- Delivery model updated
- Roadmap model updated if priority changed

No drift allowed.

================================================================================
PHASE 9 — ROADMAP EVALUATION (NO-ARG OR COMPLETED TASK)
================================================================================

If no argument was provided OR task is complete:

1. Evaluate:
   - Remaining model-code diffs
   - Test gaps
   - Security hardening gaps
   - Observability gaps
   - Performance risks
   - Dependency risks
   - CI/CD fragility
   - Entropy reduction opportunities

2. Use roadmap_model.yaml scoring to select next highest-leverage task.

3. Create next WorkItem in delivery_state_model.yaml.

================================================================================
FINAL SELF-AUDIT
================================================================================

Before completion:

- Did I begin with model evaluation?
- Did I align all models?
- Did I minimize diff?
- Did I stay within entropy budget?
- Did I update delivery model?
- Did I update roadmap model?
- Did I preserve determinism?
- Did I enforce rollback?
- Do tests trace to models?
- Do CI gates pass?
- **AMM-OS COMPLIANCE CHECK:**
  - [ ] Tenant scoping enforced (if applicable)
  - [ ] Entitlement check added for new features
  - [ ] No new hardcoded config (or justified in ADR)
  - [ ] Layer boundaries respected
  - [ ] Structured logging with correlation IDs added
  - [ ] No secrets committed
  - [ ] Risk tier requirements met
  - [ ] .customer/ packet updated
  - [ ] .github/.developer/ packet updated
  - [ ] Definition of Done satisfied

If any answer is no → fix before completion.

================================================================================
OUTPUT ORDER (STRICT)
================================================================================

1. Model loading confirmation
2. Codebase state snapshot
3. Model diff analysis
4. Delivery state update
5. Validation report
6. Implementation plan
7. Code changes
8. Tests + traceability update
9. Post-implementation alignment report
10. Roadmap update (if applicable)
11. **AMM-OS compliance report**

================================================================================
MANDATORY EXECUTION REPORTING — NTFY PHONE NOTIFICATION (URGENT + VIBRATE)
================================================================================

At the end of this task ALWAYS send exactly ONE ntfy notification to my phone.

Goals:

- Lock screen: ultra-short gist (1–3 lines).
- Expanded: full structured executive report.
- Include repo + git context and quick change stats when available.

Rules:

1. Always send ONE notification (even if nothing changed).
2. Keep the lock-screen section short and scannable.
3. Always include NEXT ACTIONS.
4. If you’re blocked, say why + what escalation/dispatch was executed + what fallback was attempted.

Topic:
https://ntfy.sh/copilot-notifications

EXECUTE (copy/paste runnable):

REPO="$(git rev-parse --show-toplevel 2>/dev/null | xargs basename || echo N/A)"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo N/A)"
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo N/A)"

# Prefer staged/working-tree stats; fall back to last commit if clean

CHANGE_SUMMARY="$(git diff --shortstat 2>/dev/null)"
if [ -z "$CHANGE_SUMMARY" ]; then
CHANGE_SUMMARY="$(git show --stat --oneline --format= 2>/dev/null | head -n 1 | sed 's/^ //')"
fi
if [ -z "$CHANGE_SUMMARY" ]; then
CHANGE_SUMMARY="No changes detected"
fi

curl -fsS -X POST "https://ntfy.sh/copilot-notifications" \
 -H "Title: 🚨 Copilot Update — ${REPO}" \
  -H "Priority: urgent" \
  -H "Tags: rotating_light,robot,rocket" \
  -H "Click: https://github.com" \
  -H "Markdown: yes" \
  -H "Sound: default" \
  -d "$(cat <<EOF

## ✅ Task Completed

**Repo:** \`${REPO}\`
**Scope:** <PR / Issue / Feature / Refactor / Fix>
**Outcome:** <ONE sentence: biggest achievement>
**Changes:** \`${CHANGE_SUMMARY}\`
**Next:** <ONE immediate next step>

---

## 📌 Executive Summary

### What was done

- <bullet>
- <bullet>
- <bullet>

### Files touched

- <path>
- <path>

### Quality checks

- Tests: <command> → <PASS/FAIL/SKIPPED>
- Lint: <command> → <PASS/FAIL/SKIPPED>
- Build: <command> → <PASS/FAIL/SKIPPED>

### Git context

- Branch: \`${BRANCH}\`
- Commit: \`${COMMIT}\`

### Risks / Notes

- <risk or note, or "None">

### Next actions (required)

1. <next step>
2. <next step>
3. <next step>

### High-value followups

- <optimization>
- <hardening>
  EOF
  )"

================================================================================
END IMPLEMENTATION DIRECTIVE
================================================================================
