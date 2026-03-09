import { describe, it, expect, beforeEach } from 'vitest';
import {
  PolicyDocument,
  PolicyEvaluationRequest,
  PolicyEngineConfig,
  PolicyQuery,
  PolicyDocumentSchema,
  PolicyEvaluationRequestSchema,
  PolicyQuerySchema,
} from '../types/index.js';

describe('Policy Engine Types', () => {
  describe('PolicyDocumentSchema', () => {
    it('should validate a complete policy document', () => {
      const validPolicy = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Safety Policy',
        description: 'A test policy for validation',
        version: '1.0.0',
        category: 'safety',
        priority: 'high',
        status: 'active',
        regoRules: `
          package test.safety
          default allow = false
          allow { input.action == "read" }
        `,
        metadata: {
          author: 'test-user',
          tags: ['safety', 'test'],
          applicableAssets: ['conveyor', 'robot'],
          requiredApprovals: 1,
          emergencyOverride: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => PolicyDocumentSchema.parse(validPolicy)).not.toThrow();
    });

    it('should reject invalid policy document', () => {
      const invalidPolicy = {
        id: 'invalid-uuid',
        name: '',
        version: 'invalid-version',
        category: 'invalid-category',
        priority: 'invalid-priority',
        status: 'invalid-status',
        regoRules: '',
        metadata: {
          author: '',
          requiredApprovals: -1,
        },
      };

      expect(() => PolicyDocumentSchema.parse(invalidPolicy)).toThrow();
    });

    it('should validate policy with minimal required fields', () => {
      const minimalPolicy = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Minimal Policy',
        version: '1.0.0',
        category: 'operational',
        priority: 'low',
        status: 'active',
        regoRules: 'package minimal\ndefault allow = true',
        metadata: {
          author: 'system',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => PolicyDocumentSchema.parse(minimalPolicy)).not.toThrow();
    });
  });

  describe('PolicyEvaluationRequestSchema', () => {
    it('should validate a complete evaluation request', () => {
      const validRequest = {
        requestId: '550e8400-e29b-41d4-a716-446655440001',
        action: 'recipe.execute',
        resource: 'conveyor/line1',
        context: {
          recipe_name: 'test_recipe',
          parameters: { speed: 100 },
        },
        subject: {
          userId: 'user123',
          roles: ['operator', 'line_supervisor'],
          permissions: ['recipe.execute', 'conveyor.control'],
          zone: 'production',
        },
        timestamp: new Date(),
      };

      expect(() => PolicyEvaluationRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should reject invalid evaluation request', () => {
      const invalidRequest = {
        requestId: 'invalid-uuid',
        action: '',
        resource: '',
        context: 'invalid-context',
        subject: {
          userId: '',
          roles: 'invalid-roles',
          permissions: 'invalid-permissions',
        },
      };

      expect(() => PolicyEvaluationRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should validate request without optional fields', () => {
      const requestWithoutOptionals = {
        requestId: '550e8400-e29b-41d4-a716-446655440002',
        action: 'sensor.read',
        resource: 'sensor/temperature/zone1',
        context: {},
        subject: {
          userId: 'sensor-service',
          roles: ['service'],
          permissions: ['sensor.read'],
        },
        timestamp: new Date(),
      };

      expect(() => PolicyEvaluationRequestSchema.parse(requestWithoutOptionals)).not.toThrow();
    });
  });

  describe('PolicyQuerySchema', () => {
    it('should validate query with all fields', () => {
      const fullQuery = {
        category: 'safety',
        status: 'active',
        priority: 'critical',
        tags: ['emergency', 'safety'],
        search: 'emergency stop',
        page: 2,
        limit: 10,
        sortBy: 'priority',
        sortOrder: 'desc',
      };

      expect(() => PolicyQuerySchema.parse(fullQuery)).not.toThrow();
    });

    it('should validate empty query with defaults', () => {
      const emptyQuery = {};
      const result = PolicyQuerySchema.parse(emptyQuery);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sortBy).toBe('name');
      expect(result.sortOrder).toBe('asc');
    });

    it('should reject invalid query parameters', () => {
      const invalidQuery = {
        category: 'invalid',
        status: 'invalid',
        priority: 'invalid',
        page: 0,
        limit: 101,
        sortBy: 'invalid',
        sortOrder: 'invalid',
      };

      expect(() => PolicyQuerySchema.parse(invalidQuery)).toThrow();
    });
  });

  describe('Policy Priority and Category Enums', () => {
    it('should accept valid priority values', () => {
      const priorities = ['critical', 'high', 'medium', 'low'];
      priorities.forEach(priority => {
        expect(() =>
          PolicyDocumentSchema.pick({ priority: true }).parse({ priority })
        ).not.toThrow();
      });
    });

    it('should accept valid category values', () => {
      const categories = ['safety', 'security', 'operational', 'compliance', 'quality'];
      categories.forEach(category => {
        expect(() =>
          PolicyDocumentSchema.pick({ category: true }).parse({ category })
        ).not.toThrow();
      });
    });

    it('should reject invalid priority values', () => {
      expect(() =>
        PolicyDocumentSchema.pick({ priority: true }).parse({ priority: 'invalid' })
      ).toThrow();
    });

    it('should reject invalid category values', () => {
      expect(() =>
        PolicyDocumentSchema.pick({ category: true }).parse({ category: 'invalid' })
      ).toThrow();
    });
  });

  describe('Version Validation', () => {
    it('should accept valid semantic versions', () => {
      const validVersions = ['1.0.0', '2.1.3', '10.0.0', '1.2.3'];
      validVersions.forEach(version => {
        expect(() => PolicyDocumentSchema.pick({ version: true }).parse({ version })).not.toThrow();
      });
    });

    it('should reject invalid semantic versions', () => {
      const invalidVersions = ['1.0', '1', 'v1.0.0', '1.0.0-alpha', '1.0.0.1'];
      invalidVersions.forEach(version => {
        expect(() => PolicyDocumentSchema.pick({ version: true }).parse({ version })).toThrow();
      });
    });
  });
});
