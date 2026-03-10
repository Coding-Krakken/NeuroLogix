# Installation

## Purpose

Install this framework into any repository as a plug-and-play baseline.

## Prerequisites

- GitHub repository with issues and pull requests enabled
- Branch protection and required checks configured as appropriate for the repository
- Agent runtime capable of executing repository-local instructions

## Installation Steps

1. Copy the entire `.github/` directory from this framework into the target repository root.
2. Confirm required files exist:
   - `copilot-instructions.md`
   - `agents/`
   - `prompts/`
   - `standards/`
   - `templates/`
   - `ISSUE_TEMPLATE/`
   - `PULL_REQUEST_TEMPLATE.md`
   - `docs/`
3. Ensure repository protections are active:
   - no direct push to main
   - required checks before merge
   - required approvals/CODEOWNERS if used
4. Start operation by creating issues with provided issue forms.

## Initial Validation Checklist

- [ ] Issue templates visible in GitHub
- [ ] PR template auto-populates
- [ ] Agents can read `.github/copilot-instructions.md`
- [ ] Handoff template and prompt files available
- [ ] Standards docs referenced by agents

## Upgrade Guidance

- Treat framework updates as framework-maintenance work.
- Use dedicated issue, branch, and PR for framework updates.
