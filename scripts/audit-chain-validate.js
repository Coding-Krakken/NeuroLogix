#!/usr/bin/env node

/**
 * Audit Chain Validator
 *
 * Validates the integrity of audit log hash chains by:
 * 1. Reading audit.log file (JSON lines format)
 * 2. Verifying each record's audit_hash matches computed value
 * 3. Verifying chain links (audit_chain_id points to previous record)
 * 4. Generating a tamper detection report
 *
 * Usage:
 *   node scripts/audit-chain-validate.js [--log-file logs/audit.log] [--start-date 2026-03-11]
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const AUDIT_KEY = process.env.AUDIT_HASH_KEY || 'neurolog-audit-integrity';

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    logFile: 'logs/audit.log',
    startDate: null,
    endDate: null,
    siteId: null,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--log-file') {
      opts.logFile = args[++i];
    } else if (args[i] === '--start-date') {
      opts.startDate = new Date(args[++i]);
    } else if (args[i] === '--end-date') {
      opts.endDate = new Date(args[++i]);
    } else if (args[i] === '--site-id') {
      opts.siteId = args[++i];
    } else if (args[i] === '--verbose' || args[i] === '-v') {
      opts.verbose = true;
    }
  }

  return opts;
}

/**
 * Load audit records from log file (newline delimited JSON)
 */
function loadAuditRecords(filePath, startDate, endDate, siteId) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Audit log file not found: ${filePath}`);
  }

  const records = [];
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter((line) => line.trim());

  for (const line of lines) {
    try {
      const record = JSON.parse(line);

      // Filter by date range
      if (startDate && new Date(record.timestamp) < startDate) {
        continue;
      }
      if (endDate && new Date(record.timestamp) > endDate) {
        continue;
      }

      // Filter by site ID
      if (siteId && record.siteId !== siteId) {
        continue;
      }

      records.push(record);
    } catch {
      console.warn(`Warning: Failed to parse line: ${line.substring(0, 80)}...`);
    }
  }

  return records;
}

/**
 * Recompute hash for a record
 */
function recomputeHash(record, previousId, auditKey = AUDIT_KEY) {
  const chainInput = `${previousId || 'GENESIS'}:${record.id}:${JSON.stringify({
    timestamp: record.timestamp,
    level: record.level,
    message: record.message,
    type: record.type,
    environment: record.environment,
    ...record,
  }.filter((k) => !['audit_hash', 'audit_chain_id'].includes(k)))}`;

  return crypto.createHmac('sha256', auditKey).update(chainInput).digest('hex');
}

/**
 * Validate audit chain integrity
 */
function validateChain(records, verbose = false) {
  const report = {
    totalRecords: records.length,
    validRecords: 0,
    tampered: [],
    chainBroken: [],
    errors: [],
  };

  if (records.length === 0) {
    return report;
  }

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const previousId = i === 0 ? 'GENESIS' : records[i - 1].id;
    const expectedChainId = previousId;

    if (verbose) {
      console.log(`\nValidating record ${i + 1}/${records.length}:`);
      console.log(`  ID: ${record.id}`);
      console.log(`  Timestamp: ${record.timestamp}`);
      console.log(`  Action: ${record.action || '(none)'}`);
    }

    // Check hash matches
    if (!record.audit_hash) {
      report.errors.push(`Record ${i}: Missing audit_hash field`);
      if (verbose) console.log(`  ✗ Missing audit_hash`);
      continue;
    }

    const computedHash = recomputeHash(record, previousId);
    if (record.audit_hash !== computedHash) {
      report.tampered.push({
        index: i,
        id: record.id,
        timestamp: record.timestamp,
        expectedHash: computedHash,
        actualHash: record.audit_hash,
      });
      if (verbose) {
        console.log(`  ✗ TAMPERED: Hash mismatch`);
        console.log(`    Expected: ${computedHash}`);
        console.log(`    Actual:   ${record.audit_hash}`);
      }
      continue;
    }

    // Check chain link is correct
    if (record.audit_chain_id !== expectedChainId) {
      report.chainBroken.push({
        index: i,
        id: record.id,
        timestamp: record.timestamp,
        expectedChainId,
        actualChainId: record.audit_chain_id,
      });
      if (verbose) {
        console.log(`  ⚠ Chain link broken`);
        console.log(`    Expected: ${expectedChainId}`);
        console.log(`    Actual:   ${record.audit_chain_id}`);
      }
      continue;
    }

    report.validRecords++;
    if (verbose) {
      console.log(`  ✓ Valid (hash: ${record.audit_hash.substring(0, 16)}...)`);
    }
  }

  return report;
}

/**
 * Print report
 */
function printReport(report) {
  console.log('\n' + '='.repeat(80));
  console.log('AUDIT CHAIN VALIDATION REPORT');
  console.log('='.repeat(80));
  console.log(`\nTotal Records:     ${report.totalRecords}`);
  console.log(`Valid Records:     ${report.validRecords} (${((report.validRecords / (report.totalRecords || 1)) * 100).toFixed(1)}%)`);

  if (report.tampered.length > 0) {
    console.log(`\n⚠️  TAMPERED RECORDS: ${report.tampered.length}`);
    for (const t of report.tampered.slice(0, 5)) {
      console.log(`  - Record at index ${t.index} (ID: ${t.id})`);
      console.log(`    Timestamp: ${t.timestamp}`);
    }
    if (report.tampered.length > 5) {
      console.log(`  ... and ${report.tampered.length - 5} more`);
    }
  } else {
    console.log(`\n✓ No tampered records detected`);
  }

  if (report.chainBroken.length > 0) {
    console.log(`\n⚠️  CHAIN BROKEN: ${report.chainBroken.length}`);
    for (const c of report.chainBroken.slice(0, 5)) {
      console.log(`  - Record at index ${c.index} (ID: ${c.id})`);
      console.log(`    Expected chain link: ${c.expectedChainId}`);
      console.log(`    Actual chain link:   ${c.actualChainId}`);
    }
    if (report.chainBroken.length > 5) {
      console.log(`  ... and ${report.chainBroken.length - 5} more`);
    }
  } else {
    console.log(`✓ Chain integrity verified`);
  }

  if (report.errors.length > 0) {
    console.log(`\n❌ ERRORS: ${report.errors.length}`);
    for (const e of report.errors.slice(0, 5)) {
      console.log(`  - ${e}`);
    }
    if (report.errors.length > 5) {
      console.log(`  ... and ${report.errors.length - 5} more`);
    }
  }

  console.log('\n' + '='.repeat(80));

  // Return exit code based on integrity
  return report.tampered.length === 0 && report.chainBroken.length === 0 && report.errors.length === 0
    ? 0
    : 1;
}

/**
 * Main
 */
function main() {
  try {
    const opts = parseArgs();

    if (opts.verbose) {
      console.log('Loading audit records from:', opts.logFile);
      if (opts.startDate) console.log('Start date:', opts.startDate.toISOString());
      if (opts.endDate) console.log('End date:', opts.endDate.toISOString());
      if (opts.siteId) console.log('Site ID:', opts.siteId);
    }

    const records = loadAuditRecords(opts.logFile, opts.startDate, opts.endDate, opts.siteId);
    const report = validateChain(records, opts.verbose);
    const exitCode = printReport(report);

    process.exit(exitCode);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(2);
  }
}

main();
