# Rollback Plan

> **Category:** Release
> **File:** `release/rollback-plan.prompt.md`

---

## Purpose

Define a concrete, tested rollback plan for a deployment. Ensure the team can revert to a known-good state within minutes if issues are detected.

## When to Use

- Before every production deployment
- When introducing high-risk changes
- When changing infrastructure
- As part of deployment plan

## Inputs Required

- Current deployment architecture
- Deployment method (Vercel, etc.)
- Data migration status (if any)
- Feature flag configuration

## Outputs Required

```markdown
# Rollback Plan: [Release/Feature]

## Rollback Options (Fastest First)

### Option 1: Vercel Instant Rollback (~30s)

1. Go to Vercel Dashboard → Deployments
2. Find last known good deployment: [specific deployment ID/date]
3. Click "..." → "Promote to Production"
4. Verify: curl https://funkytowncomics.com/api/health
5. Monitor for 5 minutes

### Option 2: Feature Flag Disable (~10s)

1. Go to [feature flag dashboard]
2. Disable flag: [flag-name]
3. Changes take effect immediately (edge config)
4. Verify affected feature is disabled

### Option 3: Git Revert (~3min)

1. git revert [commit-hash]
2. git push origin main
3. Wait for Vercel auto-deploy
4. Verify deployment completes

### Option 4: DNS Rollback to Square Online (~5min)

1. Access DNS provider
2. Change CNAME: funkytowncomics.com → [square-online-target]
3. Wait for propagation (usually <5 min)
4. Verify Square Online is serving

## Rollback Triggers (Automated)

- Error rate >1% for 5 minutes
- Checkout success rate <95%
- P95 latency >3s for 5 minutes
- Any SEV-1 Sentry alert

## Rollback Triggers (Manual)

- Customer reports of broken checkout
- Data inconsistency detected
- Security vulnerability discovered

## Post-Rollback Steps

1. Document what happened
2. Notify stakeholders
3. Create investigation ticket
4. Schedule post-incident review

## Validation After Rollback

- [ ] Homepage loads
- [ ] Products display correctly
- [ ] Cart works
- [ ] Checkout works (test order)
- [ ] No errors in Sentry
```

## Quality Expectations

- Multiple rollback options (tiered)
- Specific, copy-pasteable steps
- Clear triggers (not vague)
- Validation checklist after rollback
- Post-rollback communication plan

## Failure Cases

- Rollback option 1 fails → Try option 2, then 3, then 4
- Data migration makes rollback complex → Plan forward-fix instead
- DNS propagation slow → Use lower TTL values proactively

## Evidence Expectations

- Rollback procedure tested in staging
- Last known good deployment identified
- Monitoring dashboards accessible
- Communication channels ready
