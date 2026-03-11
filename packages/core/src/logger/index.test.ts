import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import winston from 'winston';
import { Writable } from 'stream';

import logger, {
  auditLogger,
  createChildLogger,
  createRequestLogger,
  logAuditEvent,
  logError,
  logPerformanceMetric,
  performanceLogger,
  sanitizeLogData,
} from '@/logger/index';

// ─── Logger export smoke tests ─────────────────────────────────────────────

// ─── Format pipeline coverage ────────────────────────────────────────────────
//
// The winston format.printf callbacks (lines ~14-26, 83-91, 112-120) only run
// when a message is actually processed through the format pipeline.  We add an
// in-memory stream transport so we can trigger them without file I/O.

function makeCapture(): { transport: winston.transport; lines: string[] } {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _enc: BufferEncoding, done: () => void) {
      lines.push(chunk.toString());
      done();
    },
  });
  const transport = new winston.transports.Stream({ stream });
  return { transport, lines };
}

describe('Main logger format pipeline', () => {
  it('produces valid JSON with required fields when logger.info is called', () => {
    const { transport, lines } = makeCapture();
    logger.add(transport);
    try {
      logger.info('format test', { requestId: 'req-001', userId: 'usr-001', extra: 'data' });
    } finally {
      logger.remove(transport);
    }

    const parsed = lines.map(l => JSON.parse(l));
    const entry = parsed.find(e => e.message === 'format test');
    expect(entry).toBeDefined();
    expect(entry.level).toBe('info');
    expect(typeof entry.timestamp).toBe('string');
    expect(entry.requestId).toBe('req-001');
    expect(entry.userId).toBe('usr-001');
    expect(entry.extra).toBe('data');
    expect(typeof entry.service).toBe('string');
    expect(typeof entry.environment).toBe('string');
    expect(typeof entry.version).toBe('string');
  });

  it('falls back to APP_CONFIG.NAME when service meta is absent', () => {
    const { transport, lines } = makeCapture();
    logger.add(transport);
    try {
      logger.info('no-service-override');
    } finally {
      logger.remove(transport);
    }

    const parsed = lines.map(l => JSON.parse(l));
    const entry = parsed.find(e => e.message === 'no-service-override');
    expect(entry).toBeDefined();
    expect(typeof entry.service).toBe('string');
  });
});

describe('auditLogger format pipeline', () => {
  it('produces valid JSON with type=AUDIT when auditLogger.info is called', () => {
    const { transport, lines } = makeCapture();
    auditLogger.add(transport);
    try {
      auditLogger.info('audit format test', { action: 'RECIPE_EXECUTE' });
    } finally {
      auditLogger.remove(transport);
    }

    const parsed = lines.map(l => JSON.parse(l));
    const entry = parsed.find(e => e.message === 'audit format test');
    expect(entry).toBeDefined();
    expect(entry.type).toBe('AUDIT');
    expect(typeof entry.timestamp).toBe('string');
    expect(typeof entry.environment).toBe('string');
  });

  it('includes hash-chain fields (audit_hash and audit_chain_id) in audit records', () => {
    const { transport, lines } = makeCapture();
    auditLogger.add(transport);
    try {
      auditLogger.info('audit hash test 1', { action: 'AUTH_LOGIN' });
      auditLogger.info('audit hash test 2', { action: 'POLICY_DECISION' });
    } finally {
      auditLogger.remove(transport);
    }

    const parsed = lines.map(l => JSON.parse(l));
    const entries = parsed.filter(e => e.message && e.message.includes('audit hash test'));
    
    expect(entries.length).toBeGreaterThanOrEqual(2);

    // First record should have audit_hash and a valid audit_chain_id (GENESIS or previous ID)
    const first = entries[0];
    expect(typeof first.audit_hash).toBe('string');
    expect(first.audit_hash.length).toBeGreaterThan(0);
    expect(typeof first.audit_chain_id).toBe('string');
    expect(first.audit_chain_id.length).toBeGreaterThan(0); // Either GENESIS or prev ID
    expect(typeof first.id).toBe('string');
    expect(first.id.startsWith('audit_')).toBe(true);

    // Second record should have audit_hash and audit_chain_id pointing to first record
    const second = entries[1];
    expect(typeof second.audit_hash).toBe('string');
    expect(second.audit_hash.length).toBeGreaterThan(0);
    expect(second.audit_chain_id).toBe(first.id); // Chain link verified
    expect(second.id).toBeDefined();
    expect(second.id !== first.id).toBe(true); // Different IDs
    
    // Hashes should be different (deterministic but different input)
    expect(second.audit_hash !== first.audit_hash).toBe(true);
  });
});

describe('performanceLogger format pipeline', () => {
  it('produces valid JSON with type=PERFORMANCE when performanceLogger.info is called', () => {
    const { transport, lines } = makeCapture();
    performanceLogger.add(transport);
    try {
      performanceLogger.info('perf format test', { operation: 'control-loop', duration: 12 });
    } finally {
      performanceLogger.remove(transport);
    }

    const parsed = lines.map(l => JSON.parse(l));
    const entry = parsed.find(e => e.message === 'perf format test');
    expect(entry).toBeDefined();
    expect(entry.type).toBe('PERFORMANCE');
    expect(typeof entry.timestamp).toBe('string');
  });
});

describe('Logger module exports', () => {
  it('exports a default winston Logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('exports auditLogger as a winston Logger', () => {
    expect(auditLogger).toBeDefined();
    expect(typeof auditLogger.info).toBe('function');
  });

  it('exports performanceLogger as a winston Logger', () => {
    expect(performanceLogger).toBeDefined();
    expect(typeof performanceLogger.info).toBe('function');
  });
});

// ─── createChildLogger ──────────────────────────────────────────────────────

describe('createChildLogger', () => {
  it('returns a child logger with the expected logging methods', () => {
    const child = createChildLogger({ service: 'test-service', requestId: 'req-001' });
    expect(child).toBeDefined();
    expect(typeof child.info).toBe('function');
    expect(typeof child.error).toBe('function');
    expect(typeof child.warn).toBe('function');
  });

  it('returns a winston Logger instance', () => {
    const child = createChildLogger({ component: 'worker' });
    expect(child).toBeInstanceOf(winston.Logger);
  });

  it('accepts empty metadata object', () => {
    const child = createChildLogger({});
    expect(child).toBeDefined();
  });
});

// ─── createRequestLogger ────────────────────────────────────────────────────

describe('createRequestLogger', () => {
  it('returns a logger bound to the given service name', () => {
    const reqLogger = createRequestLogger('recipe-executor');
    expect(reqLogger).toBeDefined();
    expect(typeof reqLogger.info).toBe('function');
  });

  it('returns a winston Logger instance', () => {
    const reqLogger = createRequestLogger('policy-engine');
    expect(reqLogger).toBeInstanceOf(winston.Logger);
  });
});

// ─── logError ────────────────────────────────────────────────────────────────

describe('logError', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => logger);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls logger.error with the error details', () => {
    const error = new Error('Something went wrong');
    logError(error);

    expect(errorSpy).toHaveBeenCalledOnce();
    const [message, meta] = errorSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(message).toBe('Application error');
    expect((meta.error as Record<string, unknown>).name).toBe('Error');
    expect((meta.error as Record<string, unknown>).message).toBe('Something went wrong');
  });

  it('includes requestId and userId when provided', () => {
    const error = new Error('Auth error');
    logError(error, { requestId: 'req-123', userId: 'user-456', operation: 'login' });

    const [, meta] = errorSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(meta.requestId).toBe('req-123');
    expect(meta.userId).toBe('user-456');
    expect(meta.operation).toBe('login');
  });

  it('includes stack trace in the error payload', () => {
    const error = new Error('Stack trace test');
    logError(error);

    const [, meta] = errorSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect((meta.error as Record<string, unknown>).stack).toBeDefined();
  });

  it('accepts empty context (default parameter)', () => {
    const error = new Error('No context');
    expect(() => logError(error)).not.toThrow();
    expect(errorSpy).toHaveBeenCalledOnce();
  });

  it('includes optional metadata field when provided', () => {
    const error = new Error('Meta test');
    logError(error, { metadata: { tag: 'conveyor-01' } });

    const [, meta] = errorSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(meta.metadata).toEqual({ tag: 'conveyor-01' });
  });
});

// ─── logAuditEvent ───────────────────────────────────────────────────────────

describe('logAuditEvent', () => {
  let auditSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    auditSpy = vi.spyOn(auditLogger, 'info').mockImplementation(() => auditLogger);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls auditLogger.info with the event details', () => {
    logAuditEvent({
      action: 'RECIPE_EXECUTE',
      resource: 'recipe/production-run-01',
      outcome: 'success',
    });

    expect(auditSpy).toHaveBeenCalledOnce();
    const [message, meta] = auditSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(message).toBe('Security audit event');
    expect(meta.action).toBe('RECIPE_EXECUTE');
    expect(meta.resource).toBe('recipe/production-run-01');
    expect(meta.outcome).toBe('success');
  });

  it('includes optional userId, ipAddress, userAgent, and severity', () => {
    logAuditEvent({
      action: 'LOGIN',
      resource: 'auth/session',
      outcome: 'failure',
      userId: 'op-001',
      ipAddress: '10.0.0.5',
      userAgent: 'Mozilla/5.0',
      severity: 'high',
    });

    const [, meta] = auditSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(meta.userId).toBe('op-001');
    expect(meta.ipAddress).toBe('10.0.0.5');
    expect(meta.severity).toBe('high');
  });

  it('includes a timestamp in the payload', () => {
    logAuditEvent({ action: 'POLICY_CHECK', resource: 'policy/safety', outcome: 'success' });

    const [, meta] = auditSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(typeof meta.timestamp).toBe('string');
  });

  it('handles partial outcome values — partial', () => {
    logAuditEvent({ action: 'SYNC', resource: 'twin/site-a', outcome: 'partial' });

    const [, meta] = auditSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(meta.outcome).toBe('partial');
  });

  it('includes optional details object', () => {
    logAuditEvent({
      action: 'CAPABILITY_GRANT',
      resource: 'capability/conveyor-speed',
      outcome: 'success',
      details: { grantedTo: 'svc.recipe-executor' },
    });

    const [, meta] = auditSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect((meta.details as Record<string, unknown>).grantedTo).toBe('svc.recipe-executor');
  });
});

// ─── logPerformanceMetric ────────────────────────────────────────────────────

describe('logPerformanceMetric', () => {
  let perfSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    perfSpy = vi.spyOn(performanceLogger, 'info').mockImplementation(() => performanceLogger);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls performanceLogger.info with the metric details', () => {
    logPerformanceMetric({ operation: 'control-loop', duration: 42, success: true });

    expect(perfSpy).toHaveBeenCalledOnce();
    const [message, meta] = perfSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(message).toBe('Performance metric');
    expect(meta.operation).toBe('control-loop');
    expect(meta.duration).toBe(42);
    expect(meta.success).toBe(true);
  });

  it('includes optional metadata', () => {
    logPerformanceMetric({
      operation: 'recipe-execute',
      duration: 120,
      success: false,
      metadata: { recipeId: 'r-001' },
    });

    const [, meta] = perfSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect((meta.metadata as Record<string, unknown>).recipeId).toBe('r-001');
  });

  it('includes a timestamp in the payload', () => {
    logPerformanceMetric({ operation: 'ping', duration: 1, success: true });

    const [, meta] = perfSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(typeof meta.timestamp).toBe('string');
  });
});

// ─── sanitizeLogData ─────────────────────────────────────────────────────────

describe('sanitizeLogData', () => {
  it('returns the data unchanged when no sensitive fields are present', () => {
    const input = { userId: 'u-001', action: 'LOGIN', ip: '10.0.0.1' };
    expect(sanitizeLogData(input)).toEqual(input);
  });

  it('redacts "password" field', () => {
    const result = sanitizeLogData({ username: 'alice', password: 'placeholder-password' });
    expect(result.password).toBe('[REDACTED]');
    expect(result.username).toBe('alice');
  });

  it('redacts "token" field', () => {
    const result = sanitizeLogData({ token: 'placeholder-token-value' });
    expect(result.token).toBe('[REDACTED]');
  });

  it('redacts "secret" field', () => {
    const result = sanitizeLogData({ apiSecret: 'placeholder-secret-value' });
    expect(result.apiSecret).toBe('[REDACTED]');
  });

  it('redacts "key" field', () => {
    const result = sanitizeLogData({ apiKey: 'placeholder-api-key' });
    expect(result.apiKey).toBe('[REDACTED]');
  });

  it('redacts "authorization" header field', () => {
    const result = sanitizeLogData({ Authorization: 'placeholder-auth-header' });
    expect(result.Authorization).toBe('[REDACTED]');
  });

  it('redacts "cookie" field', () => {
    const result = sanitizeLogData({ cookie: 'placeholder-cookie' });
    expect(result.cookie).toBe('[REDACTED]');
  });

  it('redacts "session" field', () => {
    const result = sanitizeLogData({ sessionId: 'placeholder-session-id' });
    expect(result.sessionId).toBe('[REDACTED]');
  });

  it('redacts "credit_card" field', () => {
    const result = sanitizeLogData({ credit_card: 'placeholder-card-number' });
    expect(result.credit_card).toBe('[REDACTED]');
  });

  it('redacts "ssn" field', () => {
    const result = sanitizeLogData({ ssn: 'placeholder-ssn' });
    expect(result.ssn).toBe('[REDACTED]');
  });

  it('redacts "social_security" field', () => {
    const result = sanitizeLogData({ social_security_number: 'placeholder-social-security' });
    expect(result.social_security_number).toBe('[REDACTED]');
  });

  it('redacts sensitive fields regardless of casing', () => {
    const result = sanitizeLogData({ PASSWORD: 'placeholder-password', TOKEN: 'placeholder-token' });
    expect(result.PASSWORD).toBe('[REDACTED]');
    expect(result.TOKEN).toBe('[REDACTED]');
  });

  it('recursively redacts nested sensitive fields', () => {
    const input = {
      user: {
        name: 'alice',
        credentials: { password: 'placeholder-password', token: 'placeholder-token' },
      },
    };
    const result = sanitizeLogData(input) as typeof input;
    expect(result.user.credentials.password).toBe('[REDACTED]');
    expect(result.user.credentials.token).toBe('[REDACTED]');
    expect(result.user.name).toBe('alice');
  });

  it('handles arrays by recursively sanitizing each element', () => {
    const input = { events: [{ password: 'x' }, { action: 'login' }] };
    const result = sanitizeLogData(input) as { events: Array<Record<string, unknown>> };
    expect(result.events[0].password).toBe('[REDACTED]');
    expect(result.events[1].action).toBe('login');
  });

  it('passes through null values unchanged', () => {
    const input = { data: null } as Record<string, unknown>;
    const result = sanitizeLogData(input);
    expect(result.data).toBeNull();
  });

  it('passes through primitive values in nested objects', () => {
    const input = { count: 42, active: true };
    const result = sanitizeLogData(input);
    expect(result.count).toBe(42);
    expect(result.active).toBe(true);
  });

  it('does not mutate the original data object', () => {
    const input = { password: 'secret', name: 'alice' };
    sanitizeLogData(input);
    expect(input.password).toBe('secret');
  });
});
