# Threat Model

> **Category:** Security
> **File:** `security/threat-model.prompt.md`

---

## Purpose

Identify threats, attack surfaces, and vulnerabilities using the STRIDE methodology. Produce a threat model with mitigations for all identified threats.

## When to Use

- Before building security-sensitive features (checkout, auth)
- During security review
- When adding new external integrations
- Periodic security assessment

## Inputs Required

- System architecture diagram
- Data flow diagram
- API contracts
- Authentication/authorization model
- External integrations list

## Outputs Required

```markdown
## Threat Model: [Feature/System]

### Trust Boundaries

1. Client Browser ↔ Next.js Server (untrusted → semi-trusted)
2. Next.js Server ↔ Square API (semi-trusted → trusted)

### Assets

1. Customer PII (name, email, address)
2. Payment data (handled by Square only)
3. Square API credentials
4. Business data (products, orders, inventory)

### STRIDE Analysis

| #   | Category        | Threat             | Component     | Likelihood | Impact   | Mitigation                      |
| --- | --------------- | ------------------ | ------------- | ---------- | -------- | ------------------------------- |
| T1  | Spoofing        | Fake API requests  | /api/\*       | Medium     | High     | Input validation, rate limiting |
| T2  | Tampering       | Price manipulation | Cart/Checkout | Medium     | Critical | Server-side price verification  |
| T3  | Repudiation     | Order disputes     | Orders        | Low        | Medium   | Audit logging                   |
| T4  | Info Disclosure | API key exposure   | Server        | Low        | Critical | Env vars only, gitleaks         |
| T5  | DoS             | API flooding       | All routes    | Medium     | High     | Rate limiting, Vercel WAF       |
| T6  | Elevation       | Admin access       | Admin routes  | Low        | Critical | Role-based access control       |

### Mitigations Required

1. [Specific mitigation with implementation guide]
2. [Specific mitigation with implementation guide]

### Residual Risks

- [Risks that remain after mitigations]
```

## Quality Expectations

- All STRIDE categories covered
- Every threat has a mitigation
- Mitigations are specific (not "add security")
- Risk ratings are justified
- PCI compliance verified

## Failure Cases

- No architecture diagram → Create minimal data flow diagram first
- Cannot assess Square integration → Review Square security docs

## Evidence Expectations

- Trust boundary diagram
- STRIDE analysis table
- Mitigation implementations
- Residual risk documentation
