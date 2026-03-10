# Framework Overview

## What This Framework Is

A repository-local, portable, plug-and-play three-agent autonomous development framework that enforces high-quality engineering execution through policy, templates, and deterministic workflows.

## Design Goals

- Microsoft-grade quality discipline for code, tests, review, and merge safety
- Deterministic issue selection and execution
- Strong traceability and auditable records
- Scope discipline and safe incremental delivery
- Portability across languages, stacks, and domains

## Agent Roles

1. Planner-Architect Agent
   - triage, scoring, dependency analysis, slice planning, handoff
2. Builder Agent
   - branch, implement, test, validate, PR preparation, handoff
3. Validator-Merger Agent
   - review, policy enforcement, merge decision, post-merge validation, closure, next-cycle dispatch

## Core Control Principles

- Quality and safety outrank speed.
- Every meaningful change traces to issue(s).
- Every implementation uses a short-lived branch and PR.
- No merge with failing required checks.
- Framework internals are read-only during normal issue execution.

## Determinism Mechanisms

- Weighted scoring model and tie-breakers
- Mandatory handoff structure
- Required templates for records
- Standardized review gates
