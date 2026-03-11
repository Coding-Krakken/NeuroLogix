# Internal Security Notes

## Security Baseline

- No hardcoded secrets in repository code or docs.
- Follow least privilege for service and operator access.
- Preserve immutable audit trail guarantees.

## Operational Security

- Treat safety-critical paths as high-risk changes.
- Validate security-sensitive changes with focused review and CI evidence.
- Record incidents and mitigations in `.developer/INCIDENTS.md`.