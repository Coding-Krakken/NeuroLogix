/**
 * Immutable audit event logging for compliance and security tracking
 * Ensures audit events are immutable and queryable
 */

import crypto from 'crypto';
import {
  AuditChainEntry,
  AuditEvent,
  AuditIntegrityReport,
  AuditLogCheckpoint,
  AuditQueryCriteria,
  ServiceIdentity,
} from './security-types';

/**
 * Audit logger for tracking security and compliance events
 * Uses hash chain for immutability verification
 */
export class AuditLogger {
  private chainEntries: AuditChainEntry[] = [];
  private lastHash: string | null = null;

  /**
   * Log an audit event with immutability verification
   * @param event Audit event to log
   * @returns Event ID and hash for verification
   */
  logEvent(event: Omit<AuditEvent, 'eventId' | 'timestamp' | 'immutable'>): {
    eventId: string;
    hash: string;
  } {
    // Generate unique event ID
    const eventId = this.generateEventId();

    const fullEvent: AuditEvent = {
      ...event,
      eventId,
      timestamp: new Date(),
      immutable: true,
    };

    const previousHash = this.lastHash;
    const hash = this.calculateEventHash(fullEvent, previousHash);
    this.chainEntries.push({
      sequence: this.chainEntries.length + 1,
      event: fullEvent,
      previousHash,
      hash,
    });
    this.lastHash = hash;

    return { eventId, hash };
  }

  /**
   * Log authentication success event
   */
  logAuthSuccess(caller: ServiceIdentity, target?: ServiceIdentity): { eventId: string; hash: string } {
    return this.logEvent({
      eventType: 'AUTH_SUCCESS',
      service: caller,
      targetService: target,
      outcome: 'SUCCESS',
      description: `Service ${caller.serviceId} authenticated successfully`,
      metadata: { method: 'mtls', timestamp: new Date().toISOString() },
    });
  }

  /**
   * Log authentication failure event
   */
  logAuthFailure(
    caller: ServiceIdentity,
    target?: ServiceIdentity,
    reason?: string,
  ): { eventId: string; hash: string } {
    return this.logEvent({
      eventType: 'AUTH_FAILURE',
      service: caller,
      targetService: target,
      outcome: 'FAILURE',
      description: `Service ${caller.serviceId} authentication failed: ${reason ?? 'unknown reason'}`,
      metadata: { reason, timestamp: new Date().toISOString() },
    });
  }

  /**
   * Log certificate issuance event
   */
  logCertificateIssued(
    service: ServiceIdentity,
    fingerprint: string,
    expiresAt: Date,
  ): { eventId: string; hash: string } {
    return this.logEvent({
      eventType: 'CERT_ISSUED',
      service,
      outcome: 'SUCCESS',
      description: `Certificate issued for service ${service.serviceId}`,
      metadata: { fingerprint, expiresAt: expiresAt.toISOString() },
    });
  }

  /**
   * Log certificate revocation event
   */
  logCertificateRevoked(
    service: ServiceIdentity,
    fingerprint: string,
    reason?: string,
  ): { eventId: string; hash: string } {
    return this.logEvent({
      eventType: 'CERT_REVOKED',
      service,
      outcome: 'SUCCESS',
      description: `Certificate revoked for service ${service.serviceId}`,
      metadata: { fingerprint, reason },
    });
  }

  /**
   * Log policy enforcement event
   */
  logPolicyEnforced(
    service: ServiceIdentity,
    policyName: string,
    blocked: boolean,
  ): { eventId: string; hash: string } {
    return this.logEvent({
      eventType: 'POLICY_ENFORCED',
      service,
      outcome: blocked ? 'BLOCKED' : 'SUCCESS',
      description: `Policy '${policyName}' enforced for service ${service.serviceId}`,
      metadata: { policyName, blocked },
    });
  }

  /**
   * Verify immutability of audit log by checking hash chain
   * @returns Whether hash chain is intact and immutable
   */
  verifyImmutability(): boolean {
    return this.getIntegrityReport().valid;
  }

  /**
   * Query events by criteria
   */
  queryEvents(criteria: AuditQueryCriteria): AuditEvent[] {
    return this.queryEntries(criteria).map((entry) => entry.event);
  }

  /**
   * Query full immutable chain entries by criteria
   */
  queryEntries(criteria: AuditQueryCriteria): AuditChainEntry[] {
    return this.chainEntries.filter(({ event }) => {
      if (criteria.eventType && event.eventType !== criteria.eventType) return false;
      if (criteria.serviceId && event.service.serviceId !== criteria.serviceId) return false;
      if (criteria.outcome && event.outcome !== criteria.outcome) return false;
      if (criteria.startDate && event.timestamp < criteria.startDate) return false;
      if (criteria.endDate && event.timestamp > criteria.endDate) return false;
      return true;
    });
  }

  /**
   * Get all events
   */
  getAllEvents(): AuditEvent[] {
    return this.chainEntries.map((entry) => entry.event);
  }

  /**
   * Get all immutable chain entries
   */
  getChainEntries(): AuditChainEntry[] {
    return [...this.chainEntries];
  }

  /**
   * Get event count
   */
  getEventCount(): number {
    return this.chainEntries.length;
  }

  /**
   * Get authentication failure events
   */
  getAuthFailures(): AuditEvent[] {
    return this.queryEvents({ eventType: 'AUTH_FAILURE', outcome: 'FAILURE' });
  }

  /**
   * Get policy blocked events
   */
  getPolicyBlocked(): AuditEvent[] {
    return this.queryEvents({ eventType: 'POLICY_ENFORCED', outcome: 'BLOCKED' });
  }

  /**
   * Produce an integrity report for the current chain
   */
  getIntegrityReport(): AuditIntegrityReport {
    let expectedPreviousHash: string | null = null;
    let lastVerifiedHash: string | null = null;

    for (const entry of this.chainEntries) {
      if (entry.previousHash !== expectedPreviousHash) {
        return {
          valid: false,
          checkedEvents: entry.sequence,
          lastVerifiedHash,
          firstInvalidSequence: entry.sequence,
          expectedHash: expectedPreviousHash ?? undefined,
          actualHash: entry.previousHash ?? undefined,
        };
      }

      const calculatedHash = this.calculateEventHash(entry.event, expectedPreviousHash);
      if (calculatedHash !== entry.hash) {
        return {
          valid: false,
          checkedEvents: entry.sequence,
          lastVerifiedHash,
          firstInvalidSequence: entry.sequence,
          expectedHash: calculatedHash,
          actualHash: entry.hash,
        };
      }

      lastVerifiedHash = calculatedHash;
      expectedPreviousHash = calculatedHash;
    }

    return {
      valid: lastVerifiedHash === this.lastHash,
      checkedEvents: this.chainEntries.length,
      lastVerifiedHash,
      ...(lastVerifiedHash === this.lastHash
        ? {}
        : {
            firstInvalidSequence: this.chainEntries.length,
            expectedHash: lastVerifiedHash ?? undefined,
            actualHash: this.lastHash ?? undefined,
          }),
    };
  }

  /**
   * Get the latest persisted checkpoint in the hash chain
   */
  getLatestCheckpoint(): AuditLogCheckpoint | null {
    const latestEntry = this.chainEntries.at(-1);
    if (!latestEntry) {
      return null;
    }

    return {
      sequence: latestEntry.sequence,
      eventId: latestEntry.event.eventId,
      hash: latestEntry.hash,
      timestamp: latestEntry.event.timestamp,
    };
  }

  /**
   * Calculate hash for an event (immutability chain)
   */
  private calculateEventHash(event: AuditEvent, previousHash: string | null): string {
    const eventString = JSON.stringify({
      eventId: event.eventId,
      eventType: event.eventType,
      serviceId: event.service.serviceId,
      outcome: event.outcome,
      timestamp: event.timestamp.toISOString(),
    });

    const content = `${previousHash ?? 'GENESIS'}:${eventString}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${crypto.randomBytes(8).toString('hex')}_${Date.now()}`;
  }
}

/**
 * Create an audit logger instance
 */
export function createAuditLogger(): AuditLogger {
  return new AuditLogger();
}
