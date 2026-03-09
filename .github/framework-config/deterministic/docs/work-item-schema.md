# Work Item Schema and Policy Contracts

## Canonical Schema

Canonical schema file:
`.github/framework-config/deterministic/policies/work_item.schema.json`

Required top-level fields:

- `id`
- `title`
- `type`
- `state`
- `priority`
- `severity`
- `risk`
- `blast_radius`
- `component_area`
- `deployment_surface`
- `rollout_method`
- `data_sensitivity`
- `owner_agent`
- `approvals`
- `artifacts`

## Policy Matrix Contract

Machine-readable policy matrix:
`.github/framework-config/deterministic/policies/policy_matrix.json`

Resolution order (deterministic):

1. Evaluate global defaults.
2. Apply type-specific rule if exists.
3. Apply severity override.
4. Apply risk override.
5. Apply data sensitivity override.
6. Apply deployment surface override.
7. Apply incident/hotfix mode overrides.

No ad-hoc decision path is permitted. If no rule matches, fallback is
`deny_with_clarification`.

## State Machine Contract

Machine-readable state machines:
`.github/framework-config/deterministic/policies/state_machines.json`

Each state machine defines:

- finite `states`
- explicit `allowed_transitions`
- `preconditions`
- `required_artifacts`
- `responsible_agent`
- `timeouts`
- `escalation`

## Router Output Contract

The deterministic router outputs JSON:

```json
{
  "classification": {
    "type": "feature",
    "risk": "high",
    "severity": "S2",
    "priority": "P1"
  },
  "requiredApprovers": ["engineering-lead", "qa-test-engineer"],
  "requiredChecks": ["unit", "integration", "security-scan"],
  "requiredDocs": ["runbook", "release-notes"],
  "rolloutRequirements": ["feature-flag", "ring-rollout"],
  "nextAgent": "qa-test-engineer",
  "result": "pass"
}
```
