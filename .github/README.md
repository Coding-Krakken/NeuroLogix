# Autonomous Three-Agent Development Framework

This repository contains a portable, repository-local, plug-and-play autonomous development framework.

## Purpose

- Enable continuous autonomous execution from human-created GitHub issues.
- Enforce Microsoft-grade quality, traceability, review discipline, and merge safety.
- Keep framework internals stable during normal execution.

## Core Loop

1. Planner-Architect Agent selects the next issue and creates an implementation brief.
2. Builder Agent implements the smallest safe slice, tests it, and prepares a PR.
3. Validator-Merger Agent reviews, validates, merges safely, performs post-merge validation, and dispatches the next cycle.

## Framework Scope

- Framework files live inside `.github/`.
- Product changes must occur outside `.github/`.
- Framework maintenance requires a dedicated framework-maintenance issue and separate execution path.

## Start Here

- `docs/framework-overview.md`
- `docs/installation.md`
- `docs/operating-guide.md`
- `standards/operating-standard.md`
- `agents/planner-architect.agent.md`
- `agents/builder.agent.md`
- `agents/validator-merger.agent.md`