# Release Notes

> **Category:** Release
> **File:** `release/release-notes.prompt.md`

---

## Purpose

Generate comprehensive release notes for a version release, covering features, fixes, breaking changes, and upgrade instructions.

## When to Use

- Preparing a release
- After merging a batch of PRs
- Before deployment to production
- Customer communication

## Inputs Required

- Git log since last release
- PR list with descriptions
- Breaking changes
- Migration steps (if any)

## Outputs Required

```markdown
# Release Notes: v[X.Y.Z]

**Date:** YYYY-MM-DD
**Type:** Major | Minor | Patch

## Highlights

[1-2 sentence summary of most important change]

## ✨ New Features

- **[Feature Name]** — Description (#PR)

## 🐛 Bug Fixes

- **[Fix Description]** — What was broken, now fixed (#PR)

## ⚡ Performance Improvements

- **[Improvement]** — Measurable impact (#PR)

## 🔒 Security

- **[Security Fix]** — Description (#PR)

## 💥 Breaking Changes

- **[Change]** — What changed, migration steps

## 📦 Dependencies

- Updated [package] from vX to vY

## 🔧 Internal

- [Refactoring, CI changes, etc.]

## Upgrade Guide

1. [Step-by-step upgrade instructions]
2. [Migration commands if needed]

## Known Issues

- [Any known issues in this release]
```

## Quality Expectations

- Every change categorized correctly
- Breaking changes highlighted prominently
- Upgrade guide is tested
- PR numbers linked
- User-facing language (not internal jargon)

## Failure Cases

- Missing PR descriptions → Check git log for context
- Unknown breaking changes → Test upgrade path

## Evidence Expectations

- Complete PR list since last release
- Breaking change verification
- Upgrade guide tested
