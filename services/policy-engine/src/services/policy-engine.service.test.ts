import { describe, it, expect, beforeEach } from 'vitest';
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
      await expect(service.deletePolicy(nonExistentId)).rejects.toThrow('Policy not found');
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
        expect(result.policies[i].name).toBeGreaterThanOrEqual(result.policies[i - 1].name);
      }
    });

    it('should sort policies by priority descending', async () => {
      const result = await service.queryPolicies({ sortBy: 'priority', sortOrder: 'desc' });
      
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      for (let i = 1; i < result.policies.length; i++) {
        expect(priorityOrder[result.policies[i].priority])
          .toBeLessThanOrEqual(priorityOrder[result.policies[i - 1].priority]);
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
          plc_interlocks: [{ name: 'safety_gate', active: true }]
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
      const startTime1 = Date.now();
      const result1 = await service.evaluateRequest(request);
      const endTime1 = Date.now();

      // Second evaluation (should be from cache)
      const startTime2 = Date.now();
      const result2 = await service.evaluateRequest({
        ...request,
        requestId: '550e8400-e29b-41d4-a716-446655440006'
      });
      const endTime2 = Date.now();

      expect(result1.decision).toBe(result2.decision);
      // Second evaluation should be faster (from cache)
      expect(endTime2 - startTime2).toBeLessThan(endTime1 - startTime1);
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
      expect(stats.decisionsLast24h.allow + stats.decisionsLast24h.deny + stats.decisionsLast24h.approval_required)
        .toBe(stats.evaluationsLast24h);
    });
  });
});