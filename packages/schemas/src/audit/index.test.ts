/**
 * Tests for canonical audit schemas
 */
import { describe, it, expect } from 'vitest';
import {
  AUDIT_OUTCOME,
  AUDIT_SEVERITY,
  AUDIT_ACTION,
  AuditOutcomeSchema,
  AuditSeveritySchema,
  AuditLogEntrySchema,
  AuditEventInputSchema,
  AuditQuerySchema,
} from './index.js';

describe('AUDIT_OUTCOME', () => {
  it('defines all required outcome constants', () => {
    expect(AUDIT_OUTCOME.SUCCESS).toBe('success');
    expect(AUDIT_OUTCOME.FAILURE).toBe('failure');
    expect(AUDIT_OUTCOME.PARTIAL).toBe('partial');
  });
});

describe('AUDIT_SEVERITY', () => {
  it('defines all severity levels', () => {
    expect(AUDIT_SEVERITY.INFO).toBe('info');
    expect(AUDIT_SEVERITY.WARNING).toBe('warning');
    expect(AUDIT_SEVERITY.CRITICAL).toBe('critical');
    expect(AUDIT_SEVERITY.SECURITY).toBe('security');
  });
});

describe('AUDIT_ACTION', () => {
  it('defines site actions', () => {
    expect(AUDIT_ACTION.SITE_REGISTER).toBe('site.register');
    expect(AUDIT_ACTION.SITE_STATUS_TRANSITION).toBe('site.status_transition');
    expect(AUDIT_ACTION.SITE_CONFIG_UPDATED).toBe('site.config_updated');
  });

  it('defines recipe actions', () => {
    expect(AUDIT_ACTION.RECIPE_EXECUTION_STARTED).toBe('recipe.execution_started');
    expect(AUDIT_ACTION.RECIPE_EXECUTION_COMPLETED).toBe('recipe.execution_completed');
    expect(AUDIT_ACTION.RECIPE_EXECUTION_FAILED).toBe('recipe.execution_failed');
    expect(AUDIT_ACTION.RECIPE_ROLLBACK_STARTED).toBe('recipe.rollback_started');
  });

  it('defines control actions', () => {
    expect(AUDIT_ACTION.CONTROL_COMMAND_DISPATCHED).toBe('control.command_dispatched');
    expect(AUDIT_ACTION.CONTROL_COMMAND_REJECTED).toBe('control.command_rejected');
    expect(AUDIT_ACTION.CONTROL_SAFETY_INTERLOCK).toBe('control.safety_interlock');
  });

  it('defines auth actions', () => {
    expect(AUDIT_ACTION.AUTH_LOGIN).toBe('auth.login');
    expect(AUDIT_ACTION.AUTH_LOGOUT).toBe('auth.logout');
    expect(AUDIT_ACTION.AUTH_ACCESS_DENIED).toBe('auth.access_denied');
  });
});

describe('AuditOutcomeSchema', () => {
  it('accepts valid outcomes', () => {
    expect(AuditOutcomeSchema.parse('success')).toBe('success');
    expect(AuditOutcomeSchema.parse('failure')).toBe('failure');
    expect(AuditOutcomeSchema.parse('partial')).toBe('partial');
  });

  it('rejects invalid outcomes', () => {
    expect(() => AuditOutcomeSchema.parse('unknown')).toThrow();
    expect(() => AuditOutcomeSchema.parse('denied')).toThrow();
  });
});

describe('AuditSeveritySchema', () => {
  it('accepts valid severities', () => {
    expect(AuditSeveritySchema.parse('info')).toBe('info');
    expect(AuditSeveritySchema.parse('warning')).toBe('warning');
    expect(AuditSeveritySchema.parse('critical')).toBe('critical');
    expect(AuditSeveritySchema.parse('security')).toBe('security');
  });

  it('rejects invalid severities', () => {
    expect(() => AuditSeveritySchema.parse('error')).toThrow();
  });
});

describe('AuditLogEntrySchema', () => {
  const validEntry = {
    timestamp: new Date().toISOString(),
    level: 'audit' as const,
    action: AUDIT_ACTION.SITE_REGISTER,
    resource: 'site',
    outcome: AUDIT_OUTCOME.SUCCESS,
  };

  it('accepts a minimal valid audit log entry', () => {
    const result = AuditLogEntrySchema.parse(validEntry);
    expect(result.action).toBe(AUDIT_ACTION.SITE_REGISTER);
    expect(result.outcome).toBe(AUDIT_OUTCOME.SUCCESS);
    expect(result.level).toBe('audit');
    expect(result.severity).toBe('info');
  });

  it('accepts a full audit log entry', () => {
    const full = {
      ...validEntry,
      id: 'e4d7f9a0-e1b2-4c3d-a4e5-f6a7b8c9d0e1',
      actorId: 'operator-01',
      siteId: 'site-01',
      resourceId: 'site-123',
      traceId: 'trace-abc',
      severity: AUDIT_SEVERITY.CRITICAL,
      details: { reason: 'test' },
    };
    const result = AuditLogEntrySchema.parse(full);
    expect(result.actorId).toBe('operator-01');
    expect(result.severity).toBe('critical');
  });

  it('rejects entries missing required fields', () => {
    expect(() => AuditLogEntrySchema.parse({ timestamp: new Date().toISOString() })).toThrow();
  });

  it('rejects entries with invalid timestamps', () => {
    expect(() => AuditLogEntrySchema.parse({ ...validEntry, timestamp: 'not-a-date' })).toThrow();
  });

  it('rejects entries with invalid outcome', () => {
    expect(() => AuditLogEntrySchema.parse({ ...validEntry, outcome: 'denied' })).toThrow();
  });
});

describe('AuditEventInputSchema', () => {
  it('omits id, level, and timestamp from required fields', () => {
    const input = {
      action: AUDIT_ACTION.RECIPE_EXECUTION_STARTED,
      resource: 'recipe',
      outcome: AUDIT_OUTCOME.SUCCESS,
    };
    const result = AuditEventInputSchema.parse(input);
    expect(result.action).toBe(AUDIT_ACTION.RECIPE_EXECUTION_STARTED);
    expect((result as Record<string, unknown>).level).toBeUndefined();
    expect((result as Record<string, unknown>).id).toBeUndefined();
  });
});

describe('AuditQuerySchema', () => {
  it('applies default limit and offset', () => {
    const result = AuditQuerySchema.parse({});
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(0);
  });

  it('accepts valid query parameters', () => {
    const result = AuditQuerySchema.parse({
      action: AUDIT_ACTION.SITE_REGISTER,
      outcome: AUDIT_OUTCOME.SUCCESS,
      siteId: 'site-01',
      limit: 25,
      offset: 50,
    });
    expect(result.action).toBe(AUDIT_ACTION.SITE_REGISTER);
    expect(result.limit).toBe(25);
  });

  it('enforces limit bounds', () => {
    expect(() => AuditQuerySchema.parse({ limit: 0 })).toThrow();
    expect(() => AuditQuerySchema.parse({ limit: 501 })).toThrow();
  });
});
