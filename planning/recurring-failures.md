# Recurring Failures Ledger

Use this ledger to track repeated CI/test failures and prevent execution thrash.

## Status Key

- `active`: recurring failure currently affecting delivery
- `inactive`: failure resolved and monitored

## Entries

| Failure Signature | First Detected (UTC) | Last Seen (UTC) | Check/Job | Run/PR References | Root Cause | Mitigation/Fix | Prevention Note | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| _none_ | - | - | - | - | - | - | - | inactive |

## Update Rules

1. Add or update an entry whenever the same failure signature repeats.
2. Keep `Last Seen` current for active failures.
3. Flip `Status` to `inactive` only after deterministic green validation.
4. Link related issue/PR IDs in `Run/PR References`.
