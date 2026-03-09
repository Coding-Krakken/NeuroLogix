# README Update

> **Category:** Documentation
> **File:** `documentation/readme-update.prompt.md`

---

## Purpose

Update the project README to accurately reflect the current state of the project. Ensure setup instructions, architecture overview, and feature list are current and correct.

## When to Use

- After adding a major feature
- After changing setup procedures
- After changing architecture
- During documentation review
- Before open-sourcing or sharing

## Inputs Required

- Current README
- Recent changes (what was added/modified)
- Setup procedure (verified)
- Architecture changes

## Outputs Required

Updated README with:

1. **Project Description** — What it does, who it's for
2. **Quick Start** — Verified setup steps
3. **Architecture Overview** — High-level diagram
4. **Tech Stack** — Current technologies
5. **Development Setup** — Step-by-step guide
6. **Available Scripts** — npm commands
7. **Project Structure** — Directory layout
8. **Contributing** — How to contribute
9. **License** — License information

## Quality Expectations

- Setup instructions are tested (actually work)
- Architecture reflects current state
- No stale information
- Code examples are from actual code
- Links are functional

## Failure Cases

- README doesn't match reality → Update to match
- Setup instructions fail → Fix instructions or fix setup

## Evidence Expectations

- Verified setup steps (tested)
- Architecture matches codebase
- All links functional
