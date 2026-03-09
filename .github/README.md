# Governance Index

Status: Active canonical index for project management, workflow, and governance
artifacts.

## Canonical Workflow Documents

- [AGENTS.md](AGENTS.md)
- [GIT_WORKFLOW.md](GIT_WORKFLOW.md)
- [QUALITY-GATES.md](QUALITY-GATES.md)
- [WORKFLOW_INTEGRATION_SUMMARY.md](WORKFLOW_INTEGRATION_SUMMARY.md)

## Governance Precedence (Canonical Order)

When governance artifacts disagree, apply this precedence order:

1. `.github/framework-config/deterministic/policies/*.json` (machine-enforced
   policy contracts)
2. `.github/workflows/*.yml` (automated gate enforcement)
3. `AGENTS.md`, `GIT_WORKFLOW.md`, `QUALITY-GATES.md` (human operational
   procedures)
4. Supporting guides and examples

Core operating model default is Core-3 with specialist escalation by policy
trigger.

## Deterministic Policy Contracts

- [framework-config/deterministic/policies/policy_matrix.json](framework-config/deterministic/policies/policy_matrix.json)
- [framework-config/deterministic/policies/state_machines.json](framework-config/deterministic/policies/state_machines.json)
- [framework-config/deterministic/policies/work_item.schema.json](framework-config/deterministic/policies/work_item.schema.json)
- [framework-config/deterministic/policies/reviewer_map.json](framework-config/deterministic/policies/reviewer_map.json)

## Canonical Intake Templates

- [ISSUE_TEMPLATE/deterministic-feature.yml](ISSUE_TEMPLATE/deterministic-feature.yml)
- [ISSUE_TEMPLATE/deterministic-bug.yml](ISSUE_TEMPLATE/deterministic-bug.yml)
- [ISSUE_TEMPLATE/deterministic-security.yml](ISSUE_TEMPLATE/deterministic-security.yml)
- [ISSUE_TEMPLATE/deterministic-performance.yml](ISSUE_TEMPLATE/deterministic-performance.yml)
- [ISSUE_TEMPLATE/deterministic-refactor.yml](ISSUE_TEMPLATE/deterministic-refactor.yml)
- [ISSUE_TEMPLATE/deterministic-ci-cd.yml](ISSUE_TEMPLATE/deterministic-ci-cd.yml)
- [ISSUE_TEMPLATE/deterministic-compliance.yml](ISSUE_TEMPLATE/deterministic-compliance.yml)
- [ISSUE_TEMPLATE/deterministic-hotfix.yml](ISSUE_TEMPLATE/deterministic-hotfix.yml)
- [ISSUE_TEMPLATE/deterministic-incident.yml](ISSUE_TEMPLATE/deterministic-incident.yml)
- [ISSUE_TEMPLATE/deterministic-data-migration.yml](ISSUE_TEMPLATE/deterministic-data-migration.yml)
- [pull_request_template.md](pull_request_template.md)

## Operational Notes

- `.github/.handoffs/` is historical only; active handoffs must be posted in
  GitHub Issue/PR comments.
- When adding governance docs, link them from this index to preserve a single
  source of truth.

## Agent Efficiency Automation

- [docs/AGENT_EFFICIENCY_RUNBOOK.md](docs/AGENT_EFFICIENCY_RUNBOOK.md)
- [scripts/generate-agent-context.ps1](scripts/generate-agent-context.ps1)
- [scripts/dispatch-agent.ps1](scripts/dispatch-agent.ps1)

## Branch Protection

- [docs/BRANCH_PROTECTION_RULESET.md](docs/BRANCH_PROTECTION_RULESET.md)
- [scripts/apply-branch-protection.ps1](scripts/apply-branch-protection.ps1)
