# Deployment Plan

> **Category:** Operations
> **File:** `operations/deployment-plan.prompt.md`

---

## Purpose

Create a comprehensive deployment plan including pre-deployment checks, deployment steps, verification procedures, and rollback contingencies.

## When to Use

- Before any production deployment
- When deploying a major feature
- When changing infrastructure
- For first deployment of a new service

## Inputs Required

- Changes to deploy (PR/commit list)
- Environment configuration
- Feature flags (if applicable)
- Rollback plan
- Monitoring setup

## Outputs Required

```markdown
## Deployment Plan: [Feature/Release]

### Pre-Deployment Checklist

- [ ] All CI checks passing
- [ ] E2E tests passing on staging
- [ ] Performance budgets met
- [ ] Security scan clean
- [ ] Rollback procedure documented
- [ ] On-call engineer identified
- [ ] Monitoring dashboards ready
- [ ] Feature flags configured (if gradual rollout)

### Deployment Steps

1. Merge PR to main
2. Vercel auto-deploys to production
3. Monitor error rate (Sentry) for 15 minutes
4. Monitor performance (Vercel Analytics) for 15 minutes
5. Verify critical paths manually
6. If issues: execute rollback plan

### Rollback Plan

- **Option 1:** Vercel instant rollback (~30s)
- **Option 2:** Git revert + force deploy (~3min)
- **Option 3:** DNS rollback to Square Online (~5min)

### Rollback Triggers

- Error rate >1%
- Checkout success rate <95%
- P95 latency >3s
- Critical errors in Sentry

### Post-Deployment Verification

- [ ] Homepage loads correctly
- [ ] Product listing works
- [ ] Product detail pages work
- [ ] Add to cart works
- [ ] Checkout flow works
- [ ] Order confirmation works

### Communication Plan

- [ ] Team notified of deployment
- [ ] Monitoring active
- [ ] Stakeholders updated
```

## Quality Expectations

- Every step is concrete and executable
- Rollback plan has specific triggers
- Monitoring is active before deployment
- Verification covers critical paths

## Failure Cases

- Deploy fails → Check build logs, fix, retry
- Post-deploy errors → Execute rollback plan
- Rollback fails → Escalate to Incident Commander

## Evidence Expectations

- CI check results
- Staging test results
- Post-deployment verification results
- Monitoring screenshots (if issues)
