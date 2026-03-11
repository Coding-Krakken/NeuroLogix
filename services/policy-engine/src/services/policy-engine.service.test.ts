import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PolicyEngineService } from '../services/policy-engine.service.js';
import {
  PolicyDocument,
  PolicyEvaluationRequest,
  PolicyEngineConfig,
  PolicyQuery,
} from '../types/index.js';

describe('PolicyEngineService', () => {
  let service: PolicyEngineService;
  let mockConfig: PolicyEngineConfig;

  beforeEach(() => {
    mockConfig = {
      enableLocalEvaluation: true,
      defaultDecision: 'deny',
      cacheEnabled: true,
      cacheTtlMinutes: 30,
      auditEnabled: true,
      emergencyMode: {
        enabled: false,
        allowedUsers: [],
        bypassPolicies: false,
      },
      notifications: {
        enabled: true,
        channels: ['email'],
        criticalViolationAlert: true,
      },
    };
    service = new PolicyEngineService(mockConfig);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('Policy Management', () => {
    it('should create a new policy successfully', async () => {
      const policyData = {
        name: 'Test Policy',
        description: 'A test policy for validation',
        version: '1.0.0',
        category: 'safety' as const,
        priority: 'high' as const,
        status: 'active' as const,
        regoRules: `
          package test.policy
          default allow = false
          allow { input.action == "test" }
        `,
        metadata: {
          author: 'test-user',
          tags: ['test', 'safety'],
          applicableAssets: ['conveyor'],
          requiredApprovals: 1,
          emergencyOverride: false,
        },
      };

      const policy = await service.createPolicy(policyData);

      expect(policy.id).toBeDefined();
      expect(policy.name).toBe(policyData.name);
      expect(policy.category).toBe(policyData.category);
      expect(policy.createdAt).toBeInstanceOf(Date);
      expect(policy.updatedAt).toBeInstanceOf(Date);
    });

    it('should reject policy with invalid Rego rules', async () => {
      const policyData = {
        name: 'Invalid Policy',
        version: '1.0.0',
        category: 'safety' as const,
        priority: 'medium' as const,
        status: 'active' as const,
        regoRules: 'invalid rego syntax', // Missing package declaration
        metadata: {
          author: 'test-user',
        },
      };

      await expect(service.createPolicy(policyData)).rejects.toThrow();
    });

    it('should update an existing policy', async () => {
      // First create a policy
      const policyData = {
        name: 'Original Policy',
        version: '1.0.0',
        category: 'operational' as const,
        priority: 'low' as const,
        status: 'active' as const,
        regoRules: 'package test\ndefault allow = true',
        metadata: {
          author: 'test-user',
        },
      };

      const originalPolicy = await service.createPolicy(policyData);

      // Update the policy
      const updates = {
        name: 'Updated Policy',
        priority: 'high' as const,
        description: 'Updated description',
      };

      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      const updatedPolicy = await service.updatePolicy(originalPolicy.id, updates);

      expect(updatedPolicy.name).toBe(updates.name);
      expect(updatedPolicy.priority).toBe(updates.priority);
      expect(updatedPolicy.description).toBe(updates.description);
      expect(updatedPolicy.updatedAt.getTime()).toBeGreaterThan(originalPolicy.updatedAt.getTime());
    });

    it('should delete a policy successfully', async () => {
      const policyData = {
        name: 'Policy to Delete',
        version: '1.0.0',
        category: 'quality' as const,
        priority: 'low' as const,
        status: 'active' as const,
        regoRules: 'package delete_test\ndefault allow = true',
        metadata: {
          author: 'test-user',
        },
      };

      const policy = await service.createPolicy(policyData);
      await service.deletePolicy(policy.id);

      const retrievedPolicy = await service.getPolicy(policy.id);
      expect(retrievedPolicy).toBeNull();
    });

    it('should throw error when deleting non-existent policy', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      await expect(service.deletePolicy(nonExistentId)).rejects.toThrow('not found');
    });

    it('should retrieve a policy by ID', async () => {
      const policyData = {
        name: 'Retrievable Policy',
        version: '1.0.0',
        category: 'security' as const,
        priority: 'medium' as const,
        status: 'active' as const,
        regoRules: 'package retrieve_test\ndefault allow = false',
        metadata: {
          author: 'test-user',
        },
      };

      const createdPolicy = await service.createPolicy(policyData);
      const retrievedPolicy = await service.getPolicy(createdPolicy.id);

      expect(retrievedPolicy).not.toBeNull();
      expect(retrievedPolicy!.id).toBe(createdPolicy.id);
      expect(retrievedPolicy!.name).toBe(policyData.name);
    });

    it('should return null for non-existent policy', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440001';
      const policy = await service.getPolicy(nonExistentId);
      expect(policy).toBeNull();
    });
  });

  describe('Policy Querying', () => {
    beforeEach(async () => {
      // Create test policies
      const testPolicies = [
        {
          name: 'Safety Policy A',
          version: '1.0.0',
          category: 'safety' as const,
          priority: 'critical' as const,
          status: 'active' as const,
          regoRules: 'package safety_a\ndefault allow = true',
          metadata: { author: 'system', tags: ['safety', 'critical'] },
        },
        {
          name: 'Security Policy B',
          version: '1.1.0',
          category: 'security' as const,
          priority: 'high' as const,
          status: 'active' as const,
          regoRules: 'package security_b\ndefault allow = false',
          metadata: { author: 'admin', tags: ['security', 'auth'] },
        },
        {
          name: 'Operational Policy C',
          version: '2.0.0',
          category: 'operational' as const,
          priority: 'medium' as const,
          status: 'inactive' as const,
          regoRules: 'package operational_c\ndefault allow = true',
          metadata: { author: 'operator', tags: ['operations'] },
        },
      ];

      for (const policyData of testPolicies) {
        await service.createPolicy(policyData);
      }
    });

    it('should query all policies with default parameters', async () => {
      const result = await service.queryPolicies({});

      expect(result.policies.length).toBeGreaterThanOrEqual(3); // At least the test policies + defaults
      expect(result.total).toBeGreaterThanOrEqual(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should filter policies by category', async () => {
      const result = await service.queryPolicies({ category: 'safety' });

      expect(result.policies.length).toBeGreaterThanOrEqual(1);
      result.policies.forEach(policy => {
        expect(policy.category).toBe('safety');
      });
    });

    it('should filter policies by status', async () => {
      const result = await service.queryPolicies({ status: 'active' });

      result.policies.forEach(policy => {
        expect(policy.status).toBe('active');
      });
    });

    it('should filter policies by priority', async () => {
      const result = await service.queryPolicies({ priority: 'critical' });

      result.policies.forEach(policy => {
        expect(policy.priority).toBe('critical');
      });
    });

    it('should search policies by name', async () => {
      const result = await service.queryPolicies({ search: 'Safety' });

      expect(result.policies.length).toBeGreaterThan(0);
      result.policies.forEach(policy => {
        expect(policy.name.toLowerCase()).toContain('safety');
      });
    });

    it('should filter policies by tags', async () => {
      const result = await service.queryPolicies({ tags: ['critical'] });

      expect(result.policies.length).toBeGreaterThan(0);
      result.policies.forEach(policy => {
        expect(policy.metadata.tags).toContain('critical');
      });
    });

    it('should paginate results correctly', async () => {
      const firstPage = await service.queryPolicies({ page: 1, limit: 2 });
      const secondPage = await service.queryPolicies({ page: 2, limit: 2 });

      expect(firstPage.policies.length).toBeLessThanOrEqual(2);
      expect(firstPage.page).toBe(1);

      if (secondPage.policies.length > 0) {
        expect(secondPage.page).toBe(2);
        // Ensure different policies on different pages
        const firstPageIds = firstPage.policies.map(p => p.id);
        const secondPageIds = secondPage.policies.map(p => p.id);
        expect(firstPageIds).not.toEqual(secondPageIds);
      }
    });

    it('should sort policies by name ascending', async () => {
      const result = await service.queryPolicies({ sortBy: 'name', sortOrder: 'asc' });

      for (let i = 1; i < result.policies.length; i++) {
        expect(
          result.policies[i].name.localeCompare(result.policies[i - 1].name)
        ).toBeGreaterThanOrEqual(0);
      }
    });

    it('should sort policies by priority descending', async () => {
      const result = await service.queryPolicies({ sortBy: 'priority', sortOrder: 'desc' });

      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      for (let i = 1; i < result.policies.length; i++) {
        expect(priorityOrder[result.policies[i].priority]).toBeLessThanOrEqual(
          priorityOrder[result.policies[i - 1].priority]
        );
      }
    });
  });

  describe('Policy Evaluation', () => {
    it('should evaluate request and allow action', async () => {
      const request: PolicyEvaluationRequest = {
        requestId: '550e8400-e29b-41d4-a716-446655440002',
        action: 'sensor.read',
        resource: 'sensor/temperature/zone1',
        context: {},
        subject: {
          userId: 'operator123',
          roles: ['operator'],
          permissions: ['sensor.read'],
        },
        timestamp: new Date(),
      };

      const result = await service.evaluateRequest(request);

      expect(result.requestId).toBe(request.requestId);
      expect(result.decision).toBeDefined();
      expect(['allow', 'deny', 'approval_required']).toContain(result.decision);
      expect(result.evaluatedAt).toBeInstanceOf(Date);
    });

    it('should deny action when PLC interlock is active', async () => {
      const request: PolicyEvaluationRequest = {
        requestId: '550e8400-e29b-41d4-a716-446655440003',
        action: 'recipe.execute',
        resource: 'conveyor/line1',
        context: {
          plc_interlocks: [{ name: 'safety_gate', active: true }],
        },
        subject: {
          userId: 'operator123',
          roles: ['operator'],
          permissions: ['recipe.execute'],
        },
        timestamp: new Date(),
      };

      const result = await service.evaluateRequest(request);

      expect(result.decision).toBe('deny');
      expect(result.overallReasoning).toContain('PLC interlock');
    });

    it('should require approval for emergency stop override', async () => {
      // First create a policy for emergency stop override
      const emergencyPolicy = await service.createPolicy({
        name: 'Emergency Stop Override Policy',
        description: 'Requires approval for emergency stop overrides',
        version: '1.0.0',
        category: 'safety' as const,
        priority: 'high' as const,
        status: 'active' as const,
        regoRules: `
          package emergency.policy
          default allow = false
          default approval_required = false
          approval_required {
            input.action == "emergency_stop.override"
          }
          # Emergency stop override handling
          emergency_stop.override = true
        `,
        metadata: {
          author: 'safety-engineer',
          tags: ['emergency', 'safety', 'approval'],
          applicableAssets: ['safety'],
          requiredApprovals: 2,
          emergencyOverride: true,
        },
      });

      const request: PolicyEvaluationRequest = {
        requestId: '550e8400-e29b-41d4-a716-446655440004',
        action: 'emergency_stop.override',
        resource: 'safety/emergency_stop/line1',
        context: {},
        subject: {
          userId: 'supervisor123',
          roles: ['supervisor'],
          permissions: ['emergency_stop.view'],
        },
        timestamp: new Date(),
      };

      const result = await service.evaluateRequest(request);

      expect(result.decision).toBe('approval_required');
      expect(result.approvalWorkflow).toBeDefined();
      expect(result.approvalWorkflow!.required).toBe(true);
      expect(result.approvalWorkflow!.minimumApprovals).toBe(2);
    });

    it('should cache evaluation results when caching is enabled', async () => {
      const request: PolicyEvaluationRequest = {
        requestId: '550e8400-e29b-41d4-a716-446655440005',
        action: 'sensor.read',
        resource: 'sensor/pressure/zone2',
        context: {},
        subject: {
          userId: 'operator123',
          roles: ['operator'],
          permissions: ['sensor.read'],
        },
        timestamp: new Date(),
      };

      // First evaluation
      const result1 = await service.evaluateRequest(request);

      // Second evaluation (should be from cache)
      const result2 = await service.evaluateRequest({
        ...request,
        requestId: '550e8400-e29b-41d4-a716-446655440006',
      });

      expect(result1.decision).toBe(result2.decision);
      // Both results should be consistent from cache
      expect(result1.decision).toBeDefined();
      expect(result2.decision).toBeDefined();
    });

    it('should handle emergency mode correctly', async () => {
      // Create service with emergency mode enabled
      const emergencyConfig = {
        ...mockConfig,
        emergencyMode: {
          enabled: true,
          allowedUsers: ['emergency-user'],
          bypassPolicies: true,
        },
      };
      const emergencyService = new PolicyEngineService(emergencyConfig);

      const request: PolicyEvaluationRequest = {
        requestId: '550e8400-e29b-41d4-a716-446655440007',
        action: 'emergency_stop.override',
        resource: 'safety/emergency_stop/all',
        context: {},
        subject: {
          userId: 'emergency-user',
          roles: ['emergency_responder'],
          permissions: [],
        },
        timestamp: new Date(),
      };

      const result = await emergencyService.evaluateRequest(request);

      expect(result.decision).toBe('allow');
      expect(result.overallReasoning).toContain('Emergency mode override');
    });
  });

  describe('OPA Authorizer Integration', () => {
    it('should infer fallback runtime mode when local evaluation is enabled', () => {
      const fallbackModeService = new PolicyEngineService({
        ...mockConfig,
        enableLocalEvaluation: true,
      });

      expect(fallbackModeService.getOpaRuntimeMode()).toBe('fallback');
      expect(fallbackModeService.getOpaRuntimeReadiness()).toEqual({
        ready: true,
        mode: 'fallback',
      });
    });

    it('should fail readiness when strict runtime mode has no OPA endpoint', async () => {
      const strictModeService = new PolicyEngineService({
        ...mockConfig,
        enableLocalEvaluation: true,
        opaRuntimeMode: 'strict',
      });

      expect(strictModeService.getOpaRuntimeMode()).toBe('strict');
      expect(strictModeService.getOpaRuntimeReadiness()).toEqual({
        ready: false,
        mode: 'strict',
        reason: 'OPA strict runtime mode requires an OPA endpoint',
      });

      await expect(
        strictModeService.evaluateRequest({
          requestId: '550e8400-e29b-41d4-a716-446655440029',
          action: 'sensor.read',
          resource: 'sensor/temperature/zone1',
          context: {},
          subject: {
            userId: 'operator-ready-check',
            roles: ['operator'],
            permissions: ['sensor.read'],
          },
          timestamp: new Date(),
        })
      ).rejects.toThrow('Policy evaluation failed');
    });

    it('should enforce OPA deny decision when local evaluation is disabled', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ result: { decision: 'deny', reason: 'zone boundary denied' } }),
        })
      );

      const opaOnlyService = new PolicyEngineService({
        ...mockConfig,
        enableLocalEvaluation: false,
        opaEndpoint: 'http://localhost:8181',
      });

      const result = await opaOnlyService.evaluateRequest({
        requestId: '550e8400-e29b-41d4-a716-446655440030',
        action: 'plc.direct_write',
        resource: 'edge/plc/line1',
        context: { zone: 'ai' },
        subject: {
          userId: 'ai-agent-1',
          roles: ['ai_agent'],
          permissions: ['plc.direct_write'],
        },
        timestamp: new Date(),
      });

      expect(result.decision).toBe('deny');
      expect(result.policyMatches.some(match => match.policyName === 'OPA Authorizer')).toBe(true);
    });

    it('should fail closed in strict mode when OPA endpoint is unavailable', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('OPA unavailable')));

      const strictService = new PolicyEngineService({
        ...mockConfig,
        opaRuntimeMode: 'strict',
        opaEndpoint: 'http://localhost:8181',
      });

      await expect(
        strictService.evaluateRequest({
          requestId: '550e8400-e29b-41d4-a716-446655440033',
          action: 'sensor.read',
          resource: 'sensor/temperature/zone1',
          context: {},
          subject: {
            userId: 'operator-strict-mode',
            roles: ['operator'],
            permissions: ['sensor.read'],
          },
          timestamp: new Date(),
        })
      ).rejects.toThrow('Policy evaluation failed');

      const fallbackEvents = strictService.getSecurityAuditTrail({
        eventType: 'POLICY_AUTHZ_FALLBACK',
      });
      expect(fallbackEvents).toHaveLength(0);
    });

    it('should fall back to local evaluation when OPA is unavailable and local evaluation is enabled', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('OPA unavailable')));

      const fallbackService = new PolicyEngineService({
        ...mockConfig,
        enableLocalEvaluation: true,
        opaEndpoint: 'http://localhost:8181',
      });

      const result = await fallbackService.evaluateRequest({
        requestId: '550e8400-e29b-41d4-a716-446655440031',
        action: 'sensor.read',
        resource: 'sensor/temperature/zone1',
        context: {},
        subject: {
          userId: 'operator-1',
          roles: ['operator'],
          permissions: ['sensor.read'],
        },
        timestamp: new Date(),
      });

      const fallbackEvents = fallbackService.getSecurityAuditTrail({ eventType: 'POLICY_AUTHZ_FALLBACK' });

      expect(result.decision).toBe('allow');
      expect(fallbackEvents.length).toBeGreaterThan(0);
    });

    it('should merge external approval requirement with local policy result', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({
            result: {
              decision: 'approval_required',
              reason: 'high risk command needs supervisor approval',
            },
          }),
        })
      );

      const integratedService = new PolicyEngineService({
        ...mockConfig,
        enableLocalEvaluation: true,
        opaEndpoint: 'http://localhost:8181',
      });

      const result = await integratedService.evaluateRequest({
        requestId: '550e8400-e29b-41d4-a716-446655440032',
        action: 'sensor.read',
        resource: 'sensor/flow/zone4',
        context: {},
        subject: {
          userId: 'operator-2',
          roles: ['operator'],
          permissions: ['sensor.read'],
        },
        timestamp: new Date(),
      });

      expect(result.decision).toBe('approval_required');
      expect(result.policyMatches.some(match => match.policyName === 'OPA Authorizer')).toBe(true);
    });

    it('should evaluate plc_interlocks policy branch via evaluator helper', async () => {
      const evaluator = (
        service as unknown as {
          evaluatePolicy: (
            policy: {
              id: string;
              name: string;
              regoRules: string;
              metadata: { requiredApprovals: number };
            },
            request: PolicyEvaluationRequest
          ) => Promise<{ decision: 'allow' | 'deny' | 'approval_required'; reasoning: string }>;
        }
      ).evaluatePolicy;

      const result = await evaluator(
        {
          id: '550e8400-e29b-41d4-a716-446655440050',
          name: 'Direct PLC Interlock Policy',
          regoRules: 'package safety.plc_interlocks\ndefault allow = true',
          metadata: { requiredApprovals: 0 },
        },
        {
          requestId: '550e8400-e29b-41d4-a716-446655440051',
          action: 'recipe.execute',
          resource: 'conveyor/line-3',
          context: {
            plc_interlocks: [{ active: true }],
          },
          subject: {
            userId: 'operator-plc-branch',
            roles: ['operator'],
            permissions: ['recipe.execute'],
          },
          timestamp: new Date(),
        }
      );

      expect(result.decision).toBe('deny');
      expect(result.reasoning).toContain('PLC interlock is active');
    });

    it('should fail closed when policy evaluator throws unexpectedly', async () => {
      const evaluator = (
        service as unknown as {
          evaluatePolicy: (
            policy: {
              id: string;
              name: string;
              regoRules: { includes: (value: string) => boolean };
              metadata: { requiredApprovals: number };
            },
            request: PolicyEvaluationRequest
          ) => Promise<{ decision: 'allow' | 'deny' | 'approval_required'; reasoning: string }>;
        }
      ).evaluatePolicy;

      const result = await evaluator(
        {
          id: '550e8400-e29b-41d4-a716-446655440052',
          name: 'Throwing Policy',
          regoRules: {
            includes: () => {
              throw new Error('simulated evaluator failure');
            },
          },
          metadata: { requiredApprovals: 0 },
        },
        {
          requestId: '550e8400-e29b-41d4-a716-446655440053',
          action: 'recipe.execute',
          resource: 'conveyor/line-4',
          context: {},
          subject: {
            userId: 'operator-fail-closed',
            roles: ['operator'],
            permissions: ['recipe.execute'],
          },
          timestamp: new Date(),
        }
      );

      expect(result.decision).toBe('deny');
      expect(result.reasoning).toContain('Policy evaluation error: simulated evaluator failure');
    });

    it('should map unknown audit outcomes to partial by default', () => {
      const mapper = (service as unknown as { toCoreAuditOutcome: (outcome: string) => string })
        .toCoreAuditOutcome;

      const mapped = mapper('UNKNOWN');

      expect(mapped).toBe('partial');
    });
  });

  describe('Statistics and Metrics', () => {
    beforeEach(async () => {
      // Create some test data
      await service.createPolicy({
        name: 'Stats Test Policy 1',
        version: '1.0.0',
        category: 'safety',
        priority: 'critical',
        status: 'active',
        regoRules: 'package stats1\ndefault allow = true',
        metadata: { author: 'test' },
      });

      await service.createPolicy({
        name: 'Stats Test Policy 2',
        version: '1.0.0',
        category: 'security',
        priority: 'high',
        status: 'inactive',
        regoRules: 'package stats2\ndefault allow = false',
        metadata: { author: 'test' },
      });

      // Perform some evaluations
      const testRequest: PolicyEvaluationRequest = {
        requestId: '550e8400-e29b-41d4-a716-446655440008',
        action: 'test.action',
        resource: 'test/resource',
        context: {},
        subject: {
          userId: 'test-user',
          roles: ['test'],
          permissions: ['test.action'],
        },
        timestamp: new Date(),
      };

      await service.evaluateRequest(testRequest);
    });

    it('should provide comprehensive statistics', async () => {
      const stats = await service.getStatistics();

      expect(stats.totalPolicies).toBeGreaterThan(0);
      expect(stats.policiesByCategory).toBeDefined();
      expect(stats.policiesByStatus).toBeDefined();
      expect(stats.evaluationsLast24h).toBeGreaterThan(0);
      expect(stats.decisionsLast24h).toBeDefined();
      expect(stats.averageEvaluationTimeMs).toBeGreaterThanOrEqual(0);
      expect(stats.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(stats.cacheHitRate).toBeLessThanOrEqual(100);
    });

    it('should track policy categories correctly', async () => {
      const stats = await service.getStatistics();

      expect(stats.policiesByCategory.safety).toBeGreaterThan(0);
      expect(stats.policiesByCategory.security).toBeGreaterThan(0);
    });

    it('should track policy status correctly', async () => {
      const stats = await service.getStatistics();

      expect(stats.policiesByStatus.active).toBeGreaterThan(0);
      expect(stats.policiesByStatus.inactive).toBeGreaterThan(0);
    });

    it('should track evaluation metrics', async () => {
      const stats = await service.getStatistics();

      expect(stats.evaluationsLast24h).toBeGreaterThan(0);
      expect(
        stats.decisionsLast24h.allow +
          stats.decisionsLast24h.deny +
          stats.decisionsLast24h.approval_required
      ).toBe(stats.evaluationsLast24h);
    });
  });

  describe('Security audit trail', () => {
    it('should record immutable audit events for privileged policy mutations', async () => {
      const policy = await service.createPolicy({
        name: 'Audit Managed Policy',
        version: '1.0.0',
        category: 'security',
        priority: 'high',
        status: 'active',
        regoRules: 'package audit.managed\ndefault allow = true',
        metadata: { author: 'security-team' },
      });

      await service.updatePolicy(policy.id, { description: 'Updated by audit test' });
      await service.deletePolicy(policy.id);

      const auditTrail = service.getSecurityAuditTrail();
      const eventTypes = auditTrail.map((entry) => entry.event.eventType);

      expect(eventTypes).toContain('POLICY_CREATE');
      expect(eventTypes).toContain('POLICY_UPDATE');
      expect(eventTypes).toContain('POLICY_DELETE');
      expect(service.verifySecurityAuditTrail().valid).toBe(true);
    });

    it('should expose queryable blocked evaluations and linked violations', async () => {
      const request: PolicyEvaluationRequest = {
        requestId: '550e8400-e29b-41d4-a716-446655440010',
        action: 'recipe.execute',
        resource: 'conveyor/line-2',
        context: {
          plc_interlocks: [{ name: 'light_curtain', active: true }],
        },
        subject: {
          userId: 'operator-audit',
          roles: ['operator'],
          permissions: ['recipe.execute'],
        },
        timestamp: new Date(),
      };

      const result = await service.evaluateRequest(request);
      const blockedEvaluations = service.getSecurityAuditTrail({
        eventType: 'POLICY_EVALUATION',
        outcome: 'BLOCKED',
      });
      const violations = service.getSecurityAuditTrail({ eventType: 'POLICY_VIOLATION' });

      expect(result.decision).toBe('deny');
      expect(blockedEvaluations.length).toBeGreaterThan(0);
      expect(blockedEvaluations[0].event.metadata?.decision).toBe('deny');
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].event.metadata?.policyName).toBeDefined();
    });

    it('should honor audit disablement without recording immutable entries', async () => {
      const noAuditService = new PolicyEngineService({
        ...mockConfig,
        auditEnabled: false,
      });

      await noAuditService.createPolicy({
        name: 'No Audit Policy',
        version: '1.0.0',
        category: 'quality',
        priority: 'low',
        status: 'active',
        regoRules: 'package audit.disabled\ndefault allow = true',
        metadata: { author: 'test-user' },
      });

      expect(noAuditService.getSecurityAuditTrail()).toHaveLength(0);
      expect(noAuditService.verifySecurityAuditTrail().valid).toBe(true);
    });
  });
});
