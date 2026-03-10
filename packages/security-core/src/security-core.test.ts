/**
 * Tests for security-core module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createServiceAuthenticator,
  createCertificateManager,
  createAuditLogger,
  type ServiceIdentity,
} from './index';

describe('ServiceAuthenticator', () => {
  let authenticator = createServiceAuthenticator();

  beforeEach(() => {
    authenticator = createServiceAuthenticator();
  });

  it('should authenticate trusted services with mTLS', () => {
    const caller: ServiceIdentity = { serviceId: 'policy-engine' };
    authenticator.trustService('policy-engine');
    authenticator.setupDefaultPolicy('core-adapter');

    const result = authenticator.authenticateRequest(caller, 'core-adapter', 'mtls');

    expect(result.success).toBe(true);
    expect(result.identity).toEqual(caller);
    expect(result.method).toBe('mtls');
  });

  it('should reject untrusted services', () => {
    const caller: ServiceIdentity = { serviceId: 'unknown-service' };
    authenticator.setupDefaultPolicy('core-adapter');

    const result = authenticator.authenticateRequest(caller, 'core-adapter', 'mtls');

    expect(result.success).toBe(false);
    expect(result.error).toContain('not trusted');
  });

  it('should enforce mTLS requirement', () => {
    const caller: ServiceIdentity = { serviceId: 'policy-engine' };
    authenticator.trustService('policy-engine');
    authenticator.setupDefaultPolicy('core-adapter');

    const result = authenticator.authenticateRequest(caller, 'core-adapter', 'api-key');

    expect(result.success).toBe(false);
    expect(result.error).toContain('mTLS');
  });

  it('should authorize read operations with default privilege', () => {
    const caller: ServiceIdentity = { serviceId: 'policy-engine' };
    const context = {
      caller,
      target: 'core-adapter',
      operation: 'read' as const,
      authenticated: true,
      authorized: false,
    };

    authenticator.setupDefaultPolicy('core-adapter');
    const result = authenticator.authorizeRequest(context);

    expect(result.authorized).toBe(true);
  });

  it('should deny write operations with read-only privilege', () => {
    const caller: ServiceIdentity = { serviceId: 'policy-engine' };
    const context = {
      caller,
      target: 'core-adapter',
      operation: 'write' as const,
      authenticated: true,
      authorized: false,
    };

    authenticator.setupDefaultPolicy('core-adapter');
    const result = authenticator.authorizeRequest(context);

    expect(result.authorized).toBe(false);
    expect(result.reason).toContain('read-only');
  });

  it('should deny unauthenticated requests', () => {
    const caller: ServiceIdentity = { serviceId: 'policy-engine' };
    const context = {
      caller,
      target: 'core-adapter',
      operation: 'read' as const,
      authenticated: false,
      authorized: false,
    };

    const result = authenticator.authorizeRequest(context);

    expect(result.authorized).toBe(false);
    expect(result.reason).toContain('not authenticated');
  });
});

describe('CertificateManager', () => {
  let manager = createCertificateManager();

  beforeEach(() => {
    manager = createCertificateManager();
  });

  it('should load and validate certificates', () => {
    const serviceid = 'policy-engine';
    const testCert = '-----BEGIN CERTIFICATE-----\nMIIC\n-----END CERTIFICATE-----';

    const metadata = manager.loadCertificate(serviceid, testCert);

    expect(metadata).toBeDefined();
    expect(metadata.serviceId).toBe(serviceid);
    expect(metadata.isActive).toBe(true);
    expect(metadata.fingerprint).toBeDefined();
  });

  it('should detect expiring certificates', () => {
    const serviceid = 'policy-engine';
    const testCert = '-----BEGIN CERTIFICATE-----\nMIIC\n-----END CERTIFICATE-----';

    manager.loadCertificate(serviceid, testCert);
    // Check with 400 day warning (cert defaults to 365 days = should be expiring in warning period)
    const expiring = manager.isExpiringSoon(serviceid, 1); // 1 day warning - likely expiring

    // Certificate is issued and expires in 365 days, so with 1-day warning it shouldn't be expiring immediately
    // but with 400-day warning it definitely should be
    expect(manager.isExpiringSoon(serviceid, 400)).toBe(true);
  });

  it('should track certificate rotation', () => {
    const serviceid = 'policy-engine';
    const cert1 = '-----BEGIN CERTIFICATE-----\nMIIC1\n-----END CERTIFICATE-----';
    const cert2 = '-----BEGIN CERTIFICATE-----\nMIIC2\n-----END CERTIFICATE-----';

    manager.loadCertificate(serviceid, cert1);
    const status = manager.rotateCertificate(serviceid, cert2);

    expect(status.serviceId).toBe(serviceid);
    expect(status.previousFingerprint).toBeDefined();
    expect(status.currentFingerprint).toBeDefined();
    expect(status.previousFingerprint).not.toBe(status.currentFingerprint);
    expect(status.status).toBe('active');
  });

  it('should retrieve rotation status', () => {
    const serviceid = 'policy-engine';
    const testCert = '-----BEGIN CERTIFICATE-----\nMIIC\n-----END CERTIFICATE-----';

    manager.loadCertificate(serviceid, testCert);
    const status = manager.getRotationStatus(serviceid);

    expect(status).toBeDefined();
    expect(status?.serviceId).toBe(serviceid);
    expect(status?.nextRotationAt).toBeInstanceOf(Date);
  });
});

describe('AuditLogger', () => {
  let logger = createAuditLogger();

  beforeEach(() => {
    logger = createAuditLogger();
  });

  it('should log authentication success', () => {
    const caller: ServiceIdentity = { serviceId: 'policy-engine' };
    const result = logger.logAuthSuccess(caller);

    expect(result.eventId).toBeDefined();
    expect(result.hash).toBeDefined();
  });

  it('should log authentication failures', () => {
    const caller: ServiceIdentity = { serviceId: 'unknown-service' };
    const result = logger.logAuthFailure(caller, undefined, 'Untrusted service');

    expect(result.eventId).toBeDefined();
    expect(result.hash).toBeDefined();

    const events = logger.getAuthFailures();
    expect(events.length).toBe(1);
    expect(events[0].outcome).toBe('FAILURE');
  });

  it('should log certificate events', () => {
    const service: ServiceIdentity = { serviceId: 'policy-engine' };
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    logger.logCertificateIssued(service, 'abc123def456', expiresAt);
    const events = logger.queryEvents({ eventType: 'CERT_ISSUED' });

    expect(events.length).toBe(1);
    expect(events[0].description).toContain('issued');
  });

  it('should maintain immutable audit log', () => {
    const service: ServiceIdentity = { serviceId: 'policy-engine' };

    logger.logAuthSuccess(service);
    logger.logAuthSuccess(service);
    logger.logAuthSuccess(service);

    const isImmutable = logger.verifyImmutability();
    expect(isImmutable).toBe(true);

    expect(logger.getEventCount()).toBe(3);
  });

  it('should query events by criteria', () => {
    const service1: ServiceIdentity = { serviceId: 'policy-engine' };
    const service2: ServiceIdentity = { serviceId: 'core-adapter' };

    logger.logAuthSuccess(service1);
    logger.logAuthSuccess(service2);
    logger.logAuthFailure(service1, undefined, 'Test failure');

    const service1Events = logger.queryEvents({ serviceId: 'policy-engine' });
    expect(service1Events.length).toBe(2);

    const failures = logger.queryEvents({ outcome: 'FAILURE' });
    expect(failures.length).toBe(1);
  });

  it('should track policy blocked events', () => {
    const service: ServiceIdentity = { serviceId: 'policy-engine' };

    logger.logPolicyEnforced(service, 'require-mTLS', false);
    logger.logPolicyEnforced(service, 'require-mTLS', true);

    const blocked = logger.getPolicyBlocked();
    expect(blocked.length).toBe(1);
    expect(blocked[0].outcome).toBe('BLOCKED');
  });
});
