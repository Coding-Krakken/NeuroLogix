import { describe, it, expect } from 'vitest';
import { 
  CapabilitySchema,
  CapabilityInstallRequestSchema,
  CapabilityQuerySchema,
  CapabilityRegistryResponseSchema,
  CapabilityHealthSchema
} from '@/types/index';

describe('Capability Registry Types', () => {
  describe('CapabilitySchema', () => {
    it('should validate a complete capability object', () => {
      const validCapability = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'modbus-adapter',
        version: '1.2.3',
        type: 'adapter' as const,
        status: 'enabled' as const,
        displayName: 'Modbus TCP Adapter',
        description: 'Industrial Modbus TCP protocol adapter for PLC communication',
        author: 'NeuroLogix Systems',
        homepage: 'https://neurologix.com/adapters/modbus',
        dependencies: [
          {
            name: 'core-runtime',
            version: '1.0.0',
            required: true,
            description: 'Core runtime environment',
          },
        ],
        permissions: ['network.tcp', 'data.write'],
        zones: ['production-line-a', 'warehouse'],
        platforms: ['linux', 'windows'],
        configuration: {
          schema: {
            host: { type: 'string', required: true },
            port: { type: 'number', default: 502 },
          },
          defaults: {
            port: 502,
            timeout: 5000,
          },
          required: ['host'],
        },
        currentConfig: {
          host: '192.168.1.100',
          port: 502,
        },
        installPath: '/opt/neurologix/adapters/modbus',
        entryPoint: 'bin/modbus-adapter',
        healthEndpoint: 'http://localhost:8080/health',
        metricsEndpoint: 'http://localhost:8080/metrics',
        installedAt: new Date('2023-12-01T10:00:00Z'),
        enabledAt: new Date('2023-12-01T10:01:00Z'),
        lastUpdated: new Date('2023-12-01T10:00:00Z'),
        lastHealthCheck: new Date(),
        isHealthy: true,
        resourceUsage: {
          cpu: 2.5,
          memory: 64,
          disk: 128,
        },
        checksum: 'sha256:abc123...',
        signature: 'signature123...',
        securityScan: {
          status: 'passed' as const,
          lastScanned: new Date('2023-12-01T09:00:00Z'),
          vulnerabilities: 0,
        },
      };

      const result = CapabilitySchema.safeParse(validCapability);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('modbus-adapter');
        expect(result.data.type).toBe('adapter');
        expect(result.data.status).toBe('enabled');
      }
    });

    it('should reject capability with invalid version format', () => {
      const invalidCapability = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'test-capability',
        version: '1.2', // Invalid: should be x.y.z
        type: 'adapter' as const,
        status: 'enabled' as const,
        displayName: 'Test Capability',
        description: 'Test capability',
        author: 'Test Author',
        installedAt: new Date(),
        lastUpdated: new Date(),
      };

      const result = CapabilitySchema.safeParse(invalidCapability);
      expect(result.success).toBe(false);
    });

    it('should reject capability with invalid type', () => {
      const invalidCapability = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'test-capability',
        version: '1.2.3',
        type: 'invalid-type' as any,
        status: 'enabled' as const,
        displayName: 'Test Capability',
        description: 'Test capability',
        author: 'Test Author',
        installedAt: new Date(),
        lastUpdated: new Date(),
      };

      const result = CapabilitySchema.safeParse(invalidCapability);
      expect(result.success).toBe(false);
    });
  });

  describe('CapabilityInstallRequestSchema', () => {
    it('should validate install request', () => {
      const validRequest = {
        name: 'new-capability',
        version: '2.1.0',
        source: 'https://registry.neurologix.com/packages/new-capability-2.1.0.tar.gz',
        configuration: {
          host: 'localhost',
          port: 8080,
        },
        autoEnable: true,
        forceUpdate: false,
      };

      const result = CapabilityInstallRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('new-capability');
        expect(result.data.autoEnable).toBe(true);
      }
    });

    it('should reject install request with invalid source URL', () => {
      const invalidRequest = {
        name: 'new-capability',
        version: '2.1.0',
        source: 'not-a-url',
      };

      const result = CapabilityInstallRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('CapabilityQuerySchema', () => {
    it('should validate query parameters', () => {
      const validQuery = {
        type: 'adapter' as const,
        status: 'enabled' as const,
        zone: 'production-line-a',
        search: 'modbus',
        limit: 25,
        offset: 0,
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
      };

      const result = CapabilityQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
        expect(result.data.sortBy).toBe('name');
      }
    });

    it('should use default values for optional parameters', () => {
      const minimalQuery = {};

      const result = CapabilityQuerySchema.safeParse(minimalQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(0);
        expect(result.data.sortBy).toBe('name');
        expect(result.data.sortOrder).toBe('asc');
      }
    });

    it('should reject query with invalid limit', () => {
      const invalidQuery = {
        limit: 0, // Invalid: must be >= 1
      };

      const result = CapabilityQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  describe('CapabilityRegistryResponseSchema', () => {
    it('should validate registry response', () => {
      const validResponse = {
        capabilities: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'test-capability',
            version: '1.0.0',
            type: 'adapter' as const,
            status: 'enabled' as const,
            displayName: 'Test Capability',
            description: 'Test capability',
            author: 'Test Author',
            installedAt: new Date(),
            lastUpdated: new Date(),
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
        hasMore: false,
      };

      const result = CapabilityRegistryResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capabilities).toHaveLength(1);
        expect(result.data.total).toBe(1);
        expect(result.data.hasMore).toBe(false);
      }
    });
  });

  describe('CapabilityHealthSchema', () => {
    it('should validate health check response', () => {
      const validHealth = {
        capabilityId: '550e8400-e29b-41d4-a716-446655440000',
        isHealthy: true,
        status: 'enabled' as const,
        lastCheck: new Date(),
        details: {
          connections: 5,
          uptime: 3600,
        },
        errors: [],
      };

      const result = CapabilityHealthSchema.safeParse(validHealth);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isHealthy).toBe(true);
        expect(result.data.status).toBe('enabled');
      }
    });

    it('should validate unhealthy status with errors', () => {
      const unhealthyHealth = {
        capabilityId: '550e8400-e29b-41d4-a716-446655440000',
        isHealthy: false,
        status: 'failed' as const,
        lastCheck: new Date(),
        errors: ['Connection timeout', 'Service unavailable'],
      };

      const result = CapabilityHealthSchema.safeParse(unhealthyHealth);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isHealthy).toBe(false);
        expect(result.data.errors).toHaveLength(2);
      }
    });
  });
});