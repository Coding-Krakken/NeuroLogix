import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createOPAAuthorizer } from './opa-authorizer';

describe('OPAAuthorizer', () => {
  const endpoint = 'http://localhost:8181';

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should parse allow boolean decisions from OPA', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: { allow: true, reason: 'allowed by role policy' } }),
    } as Response);

    const authorizer = createOPAAuthorizer({ endpoint });
    const result = await authorizer.authorize({
      action: 'recipe.execute',
      resource: 'recipe/line-1',
      context: {},
      subject: {
        userId: 'operator-1',
        roles: ['operator'],
        permissions: ['recipe.execute'],
      },
      timestamp: new Date(),
    });

    expect(result.decision).toBe('allow');
    expect(result.reason).toBe('allowed by role policy');
    expect(result.policyPath).toBe('neurologix/authz/decision');
  });

  it('should parse explicit approval_required decisions', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: { decision: 'approval_required', reason: 'high risk command' } }),
    } as Response);

    const authorizer = createOPAAuthorizer({
      endpoint,
      policyPath: '/neurologix/authz/decision',
      serviceId: 'custom-policy-engine',
    });
    const result = await authorizer.authorize({
      action: 'plc.write',
      resource: 'plc/line-2',
      context: {
        command_risk_level: 'high',
      },
      subject: {
        userId: 'supervisor-1',
        roles: ['supervisor'],
        permissions: ['plc.write'],
      },
      timestamp: new Date(),
    });

    expect(result.decision).toBe('approval_required');
    expect(result.reason).toBe('high risk command');
    expect(result.policyPath).toBe('neurologix/authz/decision');
  });

  it('should parse direct string decision responses', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: 'deny' }),
    } as Response);

    const authorizer = createOPAAuthorizer({ endpoint: `${endpoint}/` });
    const result = await authorizer.authorize({
      action: 'plc.direct_write',
      resource: 'edge/plc-2',
      context: {},
      subject: {
        userId: 'operator-2',
        roles: ['operator'],
        permissions: ['plc.direct_write'],
      },
      timestamp: new Date(),
    });

    expect(result.decision).toBe('deny');
    expect(result.reason).toContain('direct decision value');
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(
      'http://localhost:8181/v1/data/neurologix/authz/decision'
    );
  });

  it('should parse boolean decision responses', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: false }),
    } as Response);

    const authorizer = createOPAAuthorizer({ endpoint });
    const result = await authorizer.authorize({
      action: 'recipe.execute',
      resource: 'recipe/line-3',
      context: {},
      subject: {
        userId: 'operator-3',
        roles: ['operator'],
        permissions: ['recipe.execute'],
      },
      timestamp: new Date(),
    });

    expect(result.decision).toBe('deny');
    expect(result.reason).toContain('boolean allow result');
  });

  it('should parse decision objects without reason using fallback text', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: { decision: 'allow' } }),
    } as Response);

    const authorizer = createOPAAuthorizer({ endpoint });
    const result = await authorizer.authorize({
      action: 'sensor.read',
      resource: 'sensor/line-2',
      context: {},
      subject: {
        userId: 'operator-4',
        roles: ['operator'],
        permissions: ['sensor.read'],
      },
      timestamp: new Date(),
    });

    expect(result.decision).toBe('allow');
    expect(result.reason).toContain('without reason');
  });

  it('should parse allow objects without reason using fallback text', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: { allow: false } }),
    } as Response);

    const authorizer = createOPAAuthorizer({ endpoint });
    const result = await authorizer.authorize({
      action: 'sensor.read',
      resource: 'sensor/line-3',
      context: {},
      subject: {
        userId: 'operator-5',
        roles: ['operator'],
        permissions: ['sensor.read'],
      },
      timestamp: new Date(),
    });

    expect(result.decision).toBe('deny');
    expect(result.reason).toContain('inside result object');
  });

  it('should emit blocked audit event when decision is deny', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: { decision: 'deny', reason: 'zone boundary violation' } }),
    } as Response);

    const authorizer = createOPAAuthorizer({ endpoint });

    const result = await authorizer.authorize({
      action: 'plc.direct_write',
      resource: 'edge/plc-1',
      context: { zone: 'ai' },
      subject: {
        userId: 'ai-agent-1',
        roles: ['ai_agent'],
        permissions: ['plc.direct_write'],
      },
      timestamp: new Date(),
    });

    const blocked = authorizer.getAuditTrail({ eventType: 'POLICY_ENFORCED', outcome: 'BLOCKED' });

    expect(result.decision).toBe('deny');
    expect(blocked).toHaveLength(1);
    expect(authorizer.verifyAuditTrail().valid).toBe(true);
  });

  it('should reject duplicate nonces before calling OPA when replay protection is enabled', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: { allow: true, reason: 'allowed by role policy' } }),
    } as Response);

    const timestamp = new Date();
    const authorizer = createOPAAuthorizer({
      endpoint,
      replayProtection: {
        enabled: true,
        nonceTtlMs: 60_000,
        maxTimestampSkewMs: 60_000,
      },
    });

    const firstResult = await authorizer.authorize({
      action: 'recipe.execute',
      resource: 'recipe/line-6',
      context: {},
      subject: {
        userId: 'operator-replay',
        roles: ['operator'],
        permissions: ['recipe.execute'],
      },
      timestamp,
      nonce: 'replay-nonce-001',
    });

    const secondResult = await authorizer.authorize({
      action: 'recipe.execute',
      resource: 'recipe/line-6',
      context: {},
      subject: {
        userId: 'operator-replay',
        roles: ['operator'],
        permissions: ['recipe.execute'],
      },
      timestamp: new Date(timestamp.getTime() + 1_000),
      nonce: 'replay-nonce-001',
    });

    expect(firstResult.decision).toBe('allow');
    expect(secondResult.decision).toBe('deny');
    expect(secondResult.policyName).toBe('Session Replay Protection');
    expect(secondResult.reason).toContain('Replay protection rejected request');
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it('should reject stale timestamps before calling OPA when replay protection is enabled', async () => {
    const authorizer = createOPAAuthorizer({
      endpoint,
      replayProtection: {
        enabled: true,
        nonceTtlMs: 60_000,
        maxTimestampSkewMs: 30_000,
      },
    });

    const result = await authorizer.authorize({
      action: 'recipe.execute',
      resource: 'recipe/line-7',
      context: {},
      subject: {
        userId: 'operator-stale',
        roles: ['operator'],
        permissions: ['recipe.execute'],
      },
      timestamp: new Date(Date.now() - 120_000),
      nonce: 'replay-nonce-002',
    });

    expect(result.decision).toBe('deny');
    expect(result.policyName).toBe('Session Replay Protection');
    expect(result.reason).toContain('Timestamp outside allowed skew window');
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('should throw when OPA response shape is invalid', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: { unsupported: true } }),
    } as Response);

    const authorizer = createOPAAuthorizer({ endpoint });

    await expect(
      authorizer.authorize({
        action: 'recipe.execute',
        resource: 'recipe/line-1',
        context: {},
        subject: {
          userId: 'operator-1',
          roles: ['operator'],
          permissions: ['recipe.execute'],
        },
        timestamp: new Date(),
      })
    ).rejects.toThrow('OPA authorizer request failed');
  });

  it('should throw when response is missing top-level result', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { allow: true } }),
    } as Response);

    const authorizer = createOPAAuthorizer({ endpoint });

    await expect(
      authorizer.authorize({
        action: 'recipe.execute',
        resource: 'recipe/line-4',
        context: {},
        subject: {
          userId: 'operator-6',
          roles: ['operator'],
          permissions: ['recipe.execute'],
        },
        timestamp: new Date(),
      })
    ).rejects.toThrow('OPA response payload is missing top-level result field');
  });

  it('should throw when OPA returns non-success status code', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ result: { allow: false } }),
    } as Response);

    const authorizer = createOPAAuthorizer({ endpoint });

    await expect(
      authorizer.authorize({
        action: 'recipe.execute',
        resource: 'recipe/line-5',
        context: {},
        subject: {
          userId: 'operator-7',
          roles: ['operator'],
          permissions: ['recipe.execute'],
        },
        timestamp: new Date(),
      })
    ).rejects.toThrow('OPA request failed with status 503');
  });
});
