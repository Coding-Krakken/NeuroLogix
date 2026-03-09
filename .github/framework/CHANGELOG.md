# Framework Changelog

Detailed change history for framework runtime, governance engine, and deterministic operating model assets.

## Unreleased

### Added

- Deterministic Delivery Operating Model documentation under `.github/framework-config/deterministic/docs/`.
- Machine-readable governance contracts under `.github/framework-config/deterministic/policies/`:
  - `work_item.schema.json`
  - `policy_matrix.json`
  - `state_machines.json`
  - `reviewer_map.json`
- Deterministic issue templates for feature, bug, security, incident, hotfix, data migration, compliance, refactor, performance, and CI/CD.
- Microsoft-grade deterministic pull request template.
- TypeScript deterministic router and changelog/version governance scripts.
- Governance workflows for issue and PR enforcement.
- Stakeholder role playbooks and worked examples.
- GitHub-native handoff metadata header builder for deterministic `code chat` dispatch prompts.
- Dispatch chain task-number tracking persisted across multi-agent handoffs.
- Framework boundary enforcement script to block framework leakage outside `.github/` and detect invalid `.guthub/` namespace usage.

### Changed

- Standardized active governance docs, agent guides, and prompt library from file-based handoffs to GitHub Issue/PR comment handoffs while preserving `code chat -m` dispatch.
- Hardened deterministic router metadata parsing for quoted and multiline values across PR and Issue forms.
- Expanded router and dispatcher regression tests to cover metadata parsing edge cases and dispatch header/task numbering behavior.
- Added concurrency cancellation to governance issue/PR workflows to prevent superseded runs.
- Added `governance-pr` CI step to enforce hard framework boundary requirements.
- Updated deterministic router and docs to resolve policy/doc assets from `.github/framework-config/deterministic/`.
