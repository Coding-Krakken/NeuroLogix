# Traceability Standard

## System of Record

GitHub-native artifacts are the authoritative operational record.

## Required Artifact Usage

- Issue comments:
  - selection rationale
  - dependencies and assumptions
  - blocked reasons
- PR body:
  - implementation summary
  - scope boundaries
  - testing evidence
  - risk notes
- PR comments/reviews:
  - findings
  - decisions and resolutions
- Merge summary/comment:
  - why merge was safe and compliant
- Issue closure comment:
  - post-merge validation results
  - follow-up linkage

## Minimum Linkage

Every meaningful code change must link back to a human-created issue or explicit follow-up issue.
