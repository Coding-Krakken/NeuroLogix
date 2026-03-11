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

    const authorizer = createOPAAuthorizer({ endpoint, policyPath: 'neurologix/authz/decision' });
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
});
