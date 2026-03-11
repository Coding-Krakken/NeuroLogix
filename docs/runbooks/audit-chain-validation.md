# Audit Chain Validation Runbook

## Purpose

Validate the integrity of audit log hash chains to detect tampering and ensure non-repudiation compliance (IEC 62443 SR 2.12, SR 3.9, SR 3.8).

## Overview

NeuroLogix audit logs use hash-chaining for immutability verification:
- Each audit record includes a unique ID, timestamp, and hash computed from the previous record + current record content
- The chain is stored as: `GENESIS` → record1 → record2 → ... → recordN
- Hash tampering is detectable by recomputing hashes and comparing against stored values

## Quick Validation

### Option 1: Automated Chain Validation (Recommended)

```bash
# Validate entire audit log
node scripts/audit-chain-validate.js

# Validate from a specific date
node scripts/audit-chain-validate.js --start-date 2026-03-11

# Validate a specific site's audit log
node scripts/audit-chain-validate.js --site-id site-prod-001

# Verbose output (shows each record)
node scripts/audit-chain-validate.js --verbose
```

**Expected output:**
```
================================================================================
AUDIT CHAIN VALIDATION REPORT
================================================================================

Total Records:     12345
Valid Records:     12345 (100.0%)

✓ No tampered records detected
✓ Chain integrity verified

================================================================================
```

**Exit codes:**
- `0`: All records valid, chain intact
- `1`: Tampering or chain breaks detected
- `2`: Error (file not found, parse error, etc.)

### Option 2: Manual Inspection

**View the last 100 audit records with hashes:**

```bash
tail -100 logs/audit.log | jq '{id, timestamp, action, audit_hash, audit_chain_id}'
```

**Inspect a specific record:**

```bash
cat logs/audit.log | jq 'select(.id == "audit_abc123_1699999999999")' 
```

## Tampering Detection

### Symptoms

1. **Hash Mismatch**: Stored hash ≠ recomputed hash for a record
2. **Chain Break**: A record's `audit_chain_id` does not match the previous record's ID
3. **Gaps**: Missing records between expected chain sequence

### Response Procedure

#### Step 1: Confirm the Incident

Run validation in verbose mode to identify tampered records:

```bash
node scripts/audit-chain-validate.js --verbose | grep -A5 "TAMPERED\|Chain broken"
```

If output shows tampered records, proceed to Step 2.

#### Step 2: Isolate the Tampered Window

Narrow down the tampering by date and/or site:

```bash
# Get tampering timestamp from report
TAMPER_TIME="2026-03-11T10:30:00.000Z"

# Check full audit log and extract tampered records
node scripts/audit-chain-validate.js --verbose 2>&1 | tee /tmp/audit-validation-fullreport.log

# Extract tampered record IDs for investigation
grep "TAMPERED:" /tmp/audit-validation-fullreport.log | awk '{print $2}'
```

#### Step 3: Preserve Evidence

**DO NOT** delete or modify audit logs. Archive them immediately:

```bash
cp logs/audit.log evidence/audit-log-tampered-$(date +%s).log
cp /tmp/audit-validation-fullreport.log evidence/audit-validation-report-$(date +%s).log
```

#### Step 4: Notify Security

**Critical:** Escalate to security team immediately:
- Email: security@neurologix.company
- Include: evidence files, validation report, tampering timestamp, affected operator IDs
- **Do NOT attempt to repair hashes manually**

#### Step 5: Investigation (Security Team Only)

Security team will:
1. Correlate tampered records with API logs and database audit trail (cross-source)
2. Identify potential compromised accounts or service identity
3. Determine if tampering was surface-level (hash only) or if control action was actually modified
4. Recommend containment steps (credential rotation, service restart, etc.)

## Prevention

### Operator Best Practices

1. **Monitor rotation**: Check audit chain daily during shift handoff
   ```bash
   0 06 * * * /path/to/scripts/audit-chain-validate.js >> /var/log/audit-check.log 2>&1
   ```

2. **Archive periodically**: Move validated audit logs to immutable storage monthly
   ```bash
   tar -czf archive/audit-$(date +%Y-%m-%d).tar.gz logs/audit.log
   ```

3. **Backup ELK indices**: Elasticsearch maintains read-only replica; verify monthly
   ```bash
   curl -s http://elasticsearch:9200/_cat/indices?v | grep audit
   ```

### Infrastructure Controls

1. **File permissions**: Audit logs are read-only once written
   ```bash
   chmod 440 logs/audit.log
   ```

2. **Immutable storage**: Audit logs are shipped to ELK (append-only) within 60 seconds
   - Investigate if ELK index is not receiving new entries

3. **Alerting**: Configure Prometheus alert for audit log write failures
   ```yaml
   # infrastructure/observability/prometheus-alerts.yml
   - alert: AuditLogWriteFailure
     expr: audit_log_write_failure_total > 0
   ```

## Verification After Incident

After security team confirms containment:

1. **Clear logs** (if permitted):
   ```bash
   > logs/audit.log  # Clear local log file
   ```

2. **Restart audit logger**:
   ```bash
   # Kill and restart affected service
   kubectl rollout restart deployment/policy-engine -n neurologix-core
   ```

3. **Re-validate chain**:
   ```bash
   sleep 60  # Wait for new records to accumulate
   node scripts/audit-chain-validate.js --start-date $(date '+%Y-%m-%dT%H:%M:%S')
   ```

4. **Document incident**: Add record to `.developer/INCIDENTS.md`:
   ```markdown
   ## Incident: Audit Log Tampering (2026-03-11T10:30:00Z)
   - **Detected**: 2026-03-11 ~12:00 UTC
   - **Root Cause**: Compromised service identity (policy-engine cert leaked)
   - **Tampered Records**: 45 records (2026-03-11 10:15-10:45)
   - **Resolution**: Cert revoked, service redeployed, chain restored
   - **Status**: RESOLVED
   ```

## Troubleshooting

### Error: "Audit log file not found"

**Cause**: Log file path is incorrect or service hasn't written logs yet.

**Fix**:
```bash
# Check if log file exists
ls -lh logs/audit.log

# If missing, start the service and wait for first audit event
kubectl logs deployment/policy-engine -n neurologix-core
```

### Error: "Failed to parse line"

**Cause**: Malformed JSON in one of the audit lines (possible partial write).

**Fix**:
```bash
# Skip parse errors and continue validation
node scripts/audit-chain-validate.js --verbose 2>&1 | tail -20

# Last 20 lines should show if validation completed
```

### All records showing "valid" but chain feels suspicious

**Cause**: Possible compromise of `AUDIT_HASH_KEY` environment variable (all hashes recomputed with wrong key).

**Action**:
1. Check if `AUDIT_HASH_KEY` matches deployment manifest
2. If divergent, this indicates compromise of service container or environment
3. Escalate to infrastructure security team
4. Rotate all service credentials (mTLS certs, API tokens)

## Key Concepts

### Hash Chain Structure

Each audit record contains:
```json
{
  "id": "audit_abc123_1699999999999",
  "timestamp": "2026-03-11T10:15:30.123Z",
  "action": "RECIPE_EXECUTE",
  "audit_hash": "sha256(GENESIS:audit_abc123_1699999999999:{record_json})",
  "audit_chain_id": "GENESIS"
}
```

Next record:
```json
{
  "id": "audit_def456_1699999999444",
  "timestamp": "2026-03-11T10:15:31.456Z",
  "action": "POLICY_DECISION",
  "audit_hash": "sha256(audit_abc123_1699999999999:audit_def456_1699999999444:{record_json})",
  "audit_chain_id": "audit_abc123_1699999999999"
}
```

### Immutability Guarantee

If any byte in a record is modified post-write:
1. Hash recomputation will produce a different value
2. Validator will flag the record as `TAMPERED`
3. All subsequent records in the chain remain valid (they don't depend on tampering)
4. Tampering is localized and detectable

## Related

- [IEC 62443 SR 2.12: Non-Repudiation](../../compliance/IEC-62443-control-mapping.md#sr-212-non-repudiation)
- [ADR-003: Security-First Architecture](../architecture/ADR-003-security-first-architecture.md)
- [ADR-004: Observability Strategy](../architecture/ADR-004-observability-strategy.md)
- [Audit Log Hash Chaining Issue #178](https://github.com/Coding-Krakken/NeuroLogix/issues/178)

## Support

- **Questions**: Ask in #security-compliance Slack channel
- **Emergency**: Page on-call security engineer via PagerDuty
