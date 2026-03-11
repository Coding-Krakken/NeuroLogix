import { beforeEach, describe, expect, it } from 'vitest';
import {
  PolicyDocumentSchema,
  PolicyEvaluationRequestSchema,
  PolicyEvaluationResultSchema,
  PolicyQuerySchema,
  PolicyStatisticsSchema,
} from '../types/index.js';
import { PolicyEngineService } from '../services/policy-engine.service.js';

describe('Policy Engine Service Contract Baseline', () => {
  let service: PolicyEngineService;

  beforeEach(() => {
    service = new PolicyEngineService({
      cacheEnabled: false,
      auditEnabled: true,
      defaultDecision: 'deny',
      emergencyMode: {
        enabled: false,
        allowedUsers: [],
        bypassPolicies: false,
      },
      notifications: {
        enabled: false,
        channels: ['email'],
        criticalViolationAlert: false,
      },
    });
  });

  it('enforces create policy response contract shape', async () => {
    const created = await service.createPolicy({
      name: 'contract-policy-a',
      description: 'Contract baseline policy',
      version: '1.0.0',
      category: 'safety',
      priority: 'critical',
      status: 'active',
      regoRules: 'package contract.policy.a\ndefault allow = true',
      metadata: {
        author: 'contract-suite',
        tags: ['contract', 'policy-engine'],
        applicableAssets: ['conveyor'],
        requiredApprovals: 1,
        emergencyOverride: false,
      },
    });

    const parsed = PolicyDocumentSchema.parse(created);
    expect(parsed.name).toBe('contract-policy-a');
    expect(parsed.category).toBe('safety');
  });

  it('enforces policy query response contract shape with pagination metadata', async () => {
    await service.createPolicy({
      name: 'contract-policy-b',
      version: '1.1.0',
      category: 'security',
      priority: 'high',
      status: 'active',
      regoRules: 'package contract.policy.b\ndefault allow = false',
      metadata: {
        author: 'contract-suite',
        tags: ['contract', 'query'],
      },
    });

    const query = PolicyQuerySchema.parse({ page: 1, limit: 5, sortBy: 'name', sortOrder: 'asc' });
    const response = await service.queryPolicies(query);

    response.policies.forEach(policy => {
      PolicyDocumentSchema.parse(policy);
    });

    expect(response.page).toBe(query.page);
    expect(response.limit).toBe(query.limit);
    expect(response.total).toBeGreaterThanOrEqual(1);
    expect(response.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('enforces evaluation request/response contract shape', async () => {
    const request = PolicyEvaluationRequestSchema.parse({
      requestId: '550e8400-e29b-41d4-a716-446655440201',
      action: 'recipe.execute',
      resource: 'line/conveyor-a',
      context: {
        recipeId: 'recipe-001',
      },
      subject: {
        userId: 'operator-contract',
        roles: ['operator'],
        permissions: ['recipe.execute'],
      },
      timestamp: new Date(),
    });

    const result = await service.evaluateRequest(request);
    const parsed = PolicyEvaluationResultSchema.parse(result);

    expect(parsed.requestId).toBe(request.requestId);
    expect(['allow', 'deny', 'approval_required']).toContain(parsed.decision);
    expect(parsed.evaluatedAt).toBeInstanceOf(Date);
  });

  it('enforces policy statistics response contract shape', async () => {
    const stats = await service.getStatistics();
    const parsed = PolicyStatisticsSchema.parse(stats);

    expect(parsed.totalPolicies).toBeGreaterThanOrEqual(1);
    expect(parsed.averageEvaluationTimeMs).toBeGreaterThanOrEqual(0);
    expect(parsed.cacheHitRate).toBeGreaterThanOrEqual(0);
    expect(parsed.cacheHitRate).toBeLessThanOrEqual(100);
  });
});