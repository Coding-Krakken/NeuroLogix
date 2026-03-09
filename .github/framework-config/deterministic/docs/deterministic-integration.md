# Deterministic Integration with Existing Agentic Framework

## In-flight Work Item Representation

Use `.github/framework-config/deterministic/policies/work_item.schema.json` as
canonical object for in-flight state. Required runtime object:

- `id`, `type`, `state`, `priority`, `severity`, `risk`
- `component_area`, `deployment_surface`, `rollout_method`, `data_sensitivity`
- `owner_agent`, `approvals`, `artifacts`

## Deterministic Handoff Rules

Handoff is computed from `(state, type, component_area)` and policy output:

1. `triage` -> `product-owner`
2. `planned` -> `program-manager`
3. `in-progress` -> domain engineer (`frontend-engineer` / `backend-engineer` /
   `data-engineer` / `platform-engineer`)
4. `in-review` -> `qa-test-engineer` + required approvers from policy matrix
5. `ready-to-release` / `released` -> `devops-engineer` / `sre-engineer`
6. `verified` -> `99-quality-director`

Handoffs use the GitHub-native protocol described in `.github/AGENTS.md`;
file-based handoffs under `.github/.handoffs/<agent-id>/` are deprecated and
reserved for emergency fallback only.

## Done Criteria (Deterministic)

A work item is done only when:

- `state=closed`
- deterministic router result is `pass`
- required checks from policy are green
- required approvals are recorded
- rollout and verification evidence are attached

## Exception Handling Protocols

### Blocked

- Set `state=blocked` and add `blocked` label.
- Create dependency issue with `blocks:<id>` link.
- Escalate to `00-chief-of-staff` on timeout from `state_machines.json`.

### Needs Clarification

- Label `needs-clarification`.
- Route to `product-owner` + customer council personas.
- No transition to `planned` until decision log exists.

### CI Flake

- Label `flake-suspected` if rerun inconsistent.
- Create follow-up flake issue.
- Merge only if policy permits controlled override (`risk<=medium`,
  non-security).

### Incident Mode

- Activate incident state machine.
- Freeze non-incident merges for `SEV0`/`SEV1`.
- Permit incident-tagged hotfix PRs only.

## Redundancy Minimization

- Single source of truth:
  `.github/framework-config/deterministic/policies/*.json`.
- Router computes all gate requirements once and publishes report.
- Reviewers consume one checklist artifact rather than re-deriving requirements.
