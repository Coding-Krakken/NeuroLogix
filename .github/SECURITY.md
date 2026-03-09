# Security Policy

> **Version:** 1.0.0 | **Updated:** 2026-02-25

---

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it
responsibly:

1. **DO NOT** open a public GitHub issue
2. Email: security@<APPLICATION_DOMAIN> (or use GitHub Security Advisories)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)

### Response SLA

| Severity | Acknowledgment | Resolution   |
| -------- | -------------- | ------------ |
| Critical | 4 hours        | 24 hours     |
| High     | 8 hours        | 72 hours     |
| Medium   | 24 hours       | 2 weeks      |
| Low      | 72 hours       | Next release |

---

## Security Architecture

### Trust Boundaries

```
┌─────────────────────────────────────────────────┐
│  CLIENT BROWSER (Untrusted)                      │
│  - No secrets, no PII storage                    │
│  - CSP enforced                                  │
│  - <PAYMENT_PROVIDER> Payment iframe (isolated)              │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS only
┌──────────────────▼──────────────────────────────┐
│  <WEB_FRAMEWORK> EDGE / SERVER (Semi-trusted)    │
│  - Input validation (Zod) at all boundaries      │
│  - Rate limiting on API routes                   │
│  - Server-only secrets (env vars)                │
│  - Structured logging (no PII)                   │
└──────────────────┬──────────────────────────────┘
                   │ Authenticated API calls
┌──────────────────▼──────────────────────────────┐
│  <PAYMENT_PROVIDER> APIs (Trusted - External)    │
│  - Payment processing (PCI DSS compliant)        │
│  - Inventory management                          │
│  - Order management                              │
│  - Customer data (<PAYMENT_PROVIDER> manages)                │
└─────────────────────────────────────────────────┘
```

### PCI Compliance

- **Scope:** SAQ A (fully delegated to <PAYMENT_PROVIDER>)
- **Card data:** NEVER touches our servers
- **Payment flow:** <PAYMENT_PROVIDER> Web Payments SDK → <PAYMENT_PROVIDER>
  APIs
- **Prohibited:** Logging, storing, or transmitting card data

### Authentication & Authorization

- <PAYMENT_PROVIDER> API: OAuth 2.0 with scoped access tokens
- Admin: Protected by environment-level access
- Customer: Managed by <PAYMENT_PROVIDER> (if customer accounts enabled)

---

## Security Controls

### Input Validation

- All API route inputs validated with Zod schemas
- File uploads: type checking, size limits, sanitization
- URL parameters: validated and sanitized
- Query strings: validated against allowlists

### Output Encoding

- React auto-escapes JSX output
- No `dangerouslySetInnerHTML` without Security Engineer approval
- API responses: typed and validated
- Error messages: generic to users, detailed in logs

### Headers

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://<PAYMENT_PROVIDER_JS_HOST>; connect-src 'self' https://<PAYMENT_PROVIDER_API_HOST>; frame-src https://<PAYMENT_PROVIDER_API_HOST>;
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

### Secrets Management

| Secret                             | Storage                        | Rotation      |
| ---------------------------------- | ------------------------------ | ------------- |
| <PAYMENT_PROVIDER>\_ACCESS_TOKEN   | <DEPLOYMENT_PLATFORM> env vars | 90 days       |
| <PAYMENT_PROVIDER>\_APPLICATION_ID | <DEPLOYMENT_PLATFORM> env vars | On compromise |
| <PAYMENT_PROVIDER>\_LOCATION_ID    | <DEPLOYMENT_PLATFORM> env vars | N/A (static)  |
| NEXT*PUBLIC*\*                     | Build-time injection           | N/A           |

### Dependency Security

- Dependabot: Automatic PRs for vulnerable dependencies
- npm audit: Run in CI on every PR
- gitleaks: Secrets scanning in CI
- License review: Required for new dependencies

---

## Incident Response

See `.github/RUNBOOK.md` for detailed incident procedures.

### Severity Levels

| Level | Criteria                             | Response                                      |
| ----- | ------------------------------------ | --------------------------------------------- |
| SEV-1 | Data breach, payment compromise      | Immediate: all hands, notify affected parties |
| SEV-2 | Service down, checkout broken        | 15 min: on-call + incident commander          |
| SEV-3 | Degraded performance, partial outage | 1 hour: engineering team                      |
| SEV-4 | Minor bug, cosmetic issue            | Next business day                             |

---

## Compliance Checklist

- [x] PCI DSS: Delegated to <PAYMENT_PROVIDER> (SAQ A)
- [ ] GDPR: Privacy by design implemented
- [x] HTTPS: Enforced via <DEPLOYMENT_PLATFORM>
- [x] CSP: Content Security Policy headers
- [x] Secrets: Environment variables only
- [x] Scanning: gitleaks + Dependabot in CI
- [ ] Penetration testing: Scheduled quarterly
- [ ] Security training: Team onboarding requirement

---

## Supported Versions

| Version          | Supported                |
| ---------------- | ------------------------ |
| Current (main)   | ✅                       |
| Previous release | ✅ (security fixes only) |
| Older            | ❌                       |
