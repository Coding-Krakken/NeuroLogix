# Federation Runbook — Multi-Site Operations

**Model Ref:** FEDERATION-001  
**Contracts Ref:** FEDERATION-API-001  
**Issue:** https://github.com/Coding-Krakken/NeuroLogix/issues/37  
**Severity:** T1 (Mission-Critical)  
**Last Updated:** 2026-03-10

---

## 1. Overview

This runbook documents operational procedures for managing a multi-site NeuroLogix federation. It covers site registration, lifecycle transitions, feature flag rollouts, and incident response for common failure scenarios.

### Quick Links

- **Site Registry Service:** `services/site-registry/`
- **Federation API:** `/api/sites`, `/api/feature-flags`, `/api/federation`
- **Schemas:** `packages/schemas/src/federation/`, `packages/schemas/src/feature-flags/`
- **Model:** `.github/.system-state/model/federation_model.yaml`
- **Contracts:** `.github/.system-state/contracts/federation-api.yaml`

---

## 2. Site Registration

### 2.1 Register a New Site

**Endpoint:** `POST /api/sites`  
**Role Required:** `PLATFORM_ADMIN`

```bash
curl -X POST http://localhost:3100/api/sites \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "warehouse-west",
    "name": "West Warehouse",
    "region": "us-west-2",
    "tier": "T1",
    "config": {
      "timezone": "America/Los_Angeles",
      "locale": "en-US",
      "retentionDays": 90,
      "controlLimits": {
        "maxConveyorSpeedPercent": 95,
        "maxTemperatureCelsius": 50,
        "emergencyStopBudgetMs": 5000
      }
    }
  }'
```

**Expected Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "slug": "warehouse-west",
  "name": "West Warehouse",
  "region": "us-west-2",
  "tier": "T1",
  "status": "provisioning",
  "tenantId": "default",
  "createdAt": "2026-03-10T14:30:00Z",
  "updatedAt": "2026-03-10T14:30:00Z"
}
```

**Validation:**
- `slug` must be unique across the federation (FEDERATION-INV-001)
- `slug` must match pattern `[a-z0-9-]+`
- `region` and `tier` are required
- Duplicate slug → `409 DUPLICATE_SLUG`

### 2.2 Activate a Site

Once registered in `provisioning` status, activate the site after health checks pass:

```bash
curl -X PATCH http://localhost:3100/api/sites/{siteId}/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "reason": "Health check passed; ready for operations"
  }'
```

**Valid Transitions:**
- `provisioning` → `active` 
- `active` ↔ `maintenance`
- `active` → `suspended` (emergency)
- `suspended` → `active` or `decommissioned`

**Forbidden Transitions:**
- `decommissioned` is terminal (cannot transition out)

---

## 3. Site Lifecycle Management

### 3.1 Maintenance Window

Enter maintenance mode to perform updates without halting control plane:

```bash
curl -X PATCH http://localhost:3100/api/sites/{siteId}/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "maintenance",
    "reason": "Scheduled firmware update for PLCs"
  }'
```

**During maintenance:**
- Site remains `operable` for reads (FEDERATION-INV-002: false)
- Control command dispatch is rejected with `SITE_NOT_OPERABLE`
- Operator dashboards show "maintenance mode" indicator

### 3.2 Emergency Suspension

Suspend a site immediately in response to safety events:

```bash
curl -X PATCH http://localhost:3100/api/sites/{siteId}/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "suspended",
    "reason": "Safety interlock bypass detected; audit review required"
  }'
```

**Effects:**
- All control dispatch immediately rejected (FEDERATION-INV-002)
- Site appears in UI with emergency warning
- Operations team receives alert via OpsGenie /Slack

### 3.3 Reactivate After Suspension

```bash
curl -X PATCH http://localhost:3100/api/sites/{siteId}/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "reason": "Incident resolved; safety review complete"
  }'
```

### 3.4 Decommission a Site

Terminal operation. Used for site closures or permanent retirement:

```bash
curl -X PATCH http://localhost:3100/api/sites/{siteId}/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "decommissioned",
    "reason": "Facility closure; audit log retained for compliance"
  }'
```

---

## 4. Feature Flag Management

### 4.1 List Global Flags

```bash
curl -X GET http://localhost:3100/api/feature-flags \
  -H "Authorization: Bearer $TOKEN"
```

### 4.2 Set Global Default

```bash
curl -X PUT http://localhost:3100/api/feature-flags/federation.autonomous-dispatch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "federation.autonomous-dispatch",
    "description": "Allow AI to initiate dispatch without operator confirmation",
    "defaultValue": false,
    "rolloutConfig": {
      "strategy": "percentage",
      "percentage": 0
    }
  }'
```

### 4.3 Enable Feature for Specific Site

Override at the site level (FEDERATION-INV-008):

```bash
curl -X PATCH http://localhost:3100/api/sites/{siteId}/feature-flags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "federation.autonomous-dispatch": true
  }'
```

### 4.4 Resolve Flags for a Site

Check effective flag values (precedence: site > tenant > global):

```bash
curl -X GET 'http://localhost:3100/api/feature-flags?siteId={siteId}' \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "flags": [
    {
      "key": "federation.autonomous-dispatch",
      "description": "Allow AI to initiate dispatch",
      "defaultValue": false,
      "resolvedValue": true,
      "resolvedFrom": "site"
    },
    {
      "key": "federation.multi-site-enabled",
      "description": "Enable multi-site federation features",
      "defaultValue": false,
      "resolvedValue": false,
      "resolvedFrom": "global"
    }
  ]
}
```

---

## 5. Federation Topology

### 5.1 View Current Topology

List all sites, platform versions, and contracts:

```bash
curl -X GET http://localhost:3100/api/federation \
  -H "Authorization: Bearer $TOKEN"
```

**Response includes:**
- All registered sites and their status
- Platform contract versions (API, event schema, min platform version)
- Global feature flag defaults

---

## 6. Common Issues & Resolution

### Issue 6.1: Dispatch Rejected with `SITE_NOT_OPERABLE`

**Symptom:**  
Control dispatch returns error: `"Site 'warehouse-west' is not operable (current status: suspended)"`

**Root Cause:**  
Site is in `suspended` or `decommissioned` status (FEDERATION-INV-002).

**Resolution:**
1. Validate the reason for suspension: `curl GET /api/sites/{siteId}`
2. If suspension was accidental: `PATCH /api/sites/{siteId}/status` → `active`
3. If suspension was intentional: resolve the underlying issue, then reactivate

### Issue 6.2: Duplicate Site Slug

**Symptom:**  
`POST /api/sites` returns `409 DUPLICATE_SLUG`

**Root Cause:**  
A site with this slug already exists in the federation (FEDERATION-INV-001).

**Resolution:**
1. Choose a different slug (e.g., `warehouse-west-2`)
2. Or, delete the existing site if it's orphaned (decommission and archive)
3. Verify slug uniqueness: `GET /api/sites?slug=warehouse-west`

### Issue 6.3: Invalid Transition

**Symptom:**  
`PATCH /api/sites/{siteId}/status` returns `400 INVALID_TRANSITION`  
Cannot transition from `provisioning` directly to `suspended`

**Root Cause:**  
State machine only allows specific transitions (see State Machine section).

**Allowed Transitions:**
- `provisioning` → `active` only
- `active` ↔ `maintenance`
- `active` → `suspended` (to decommission: go `suspended` → `decommissioned`)

**Resolution:**
Transition through a valid intermediate state. E.g., if you need to move from provisioning to suspended:
1. First: `provisioning` → `active`
2. Then: `active` → `suspended`

---

## 7. Monitoring & Alerts

### 7.1 Audit Events

All site lifecycle changes are logged immutably (FEDERATION-INV-006):

```
AUDIT: {
  "action": "site.status_transition",
  "resource": "site",
  "resourceId": "550e8400-e29b-41d4-a716-446655440000",
  "outcome": "success",
  "details": {
    "from": "active",
    "to": "suspended",
    "reason": "Safety interlock bypass detected"
  }
}
```

Audit logs flow to ELK stack for compliance review.

### 7.2 SLO Monitoring

Track these metrics in Grafana:

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| `site.dispatch_rejection_rate` | < 0.1% | > 0.5% |
| `site.registration_failures` | 0/day | > 0 |
| `federation.topology.version_lag` | < 1s | > 5s |
| `feature_flag.resolution_latency_p95` | < 50ms | > 100ms |

---

## 8. Rollback Procedure

### Scenario: Feature Flag Rollout Gone Wrong

If autonomous dispatch flag causes control failures:

```bash
# 1. Immediately disable globally
curl -X PUT http://localhost:3100/api/feature-flags/federation.autonomous-dispatch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "federation.autonomous-dispatch",
    "defaultValue": false,
    "rolloutConfig": { "strategy": "none", "percentage": 0 }
  }'

# 2. Verify all sites have reverted
curl -X GET http://localhost:3100/api/feature-flags?siteId={siteId} \
  -H "Authorization: Bearer $TOKEN"

# 3. Validate dispatch works again
curl -X POST http://localhost:3100/api/dispatch \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"commandType": "allocate_pick", ...}'
```

---

## 9. Escalation Path

| Severity | Symptom | Owner | SLA |
|----------|---------|-------|-----|
| P1 | Multiple sites suspended; control disabled | Platform Eng | 15 min |
| P2 | Single site in suspended; others operational | Site Admin | 1 hour |
| P3 | Feature flag rollout delayed | Product | 4 hours |
| P4 | Non-critical site registration failing | DevOps | Next business day |

**Escalation Contact:** `#neurologic-incidents` (Slack) or PagerDuty

---

## 10. References

- **Model:** `.github/.system-state/model/federation_model.yaml`
- **API Contracts:** `.github/.system-state/contracts/federation-api.yaml`
- **Site Registry Service:** `services/site-registry/src/`
- **Architecture Decision:** `docs/architecture/ADR-009-federation-architecture.md`
