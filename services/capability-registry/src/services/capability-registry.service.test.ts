import { describe, it, expect, beforeEach } from 'vitest';
import { CapabilityRegistryService } from '@/services/capability-registry.service';

describe('CapabilityRegistryService', () => {
  let service: CapabilityRegistryService;

  beforeEach(() => {
    service = new CapabilityRegistryService();
  });

  describe('Installation and Management', () => {
    it('should install a new capability', async () => {
      const installRequest = {
        name: 'modbus-adapter',
        version: '1.2.3',
        source: 'https://registry.neurologix.com/packages/modbus-adapter-1.2.3.tar.gz',
        configuration: {
          host: '192.168.1.100',
          port: 502,
        },
        autoEnable: false,
        forceUpdate: false,
      };

      const capability = await service.installCapability(installRequest);

      expect(capability.name).toBe('modbus-adapter');
      expect(capability.version).toBe('1.2.3');
      expect(capability.status).toBe('installed');
      expect(capability.currentConfig).toEqual({
        host: '192.168.1.100',
        port: 502,
      });
      expect(capability.enabledAt).toBeUndefined();
    });

    it('should install and auto-enable capability', async () => {
      const installRequest = {
        name: 'test-adapter',
        version: '1.0.0',
        source: 'https://registry.neurologix.com/packages/test-adapter-1.0.0.tar.gz',
        autoEnable: true,
        forceUpdate: false,
      };

      const capability = await service.installCapability(installRequest);

      expect(capability.status).toBe('enabled');
      expect(capability.enabledAt).toBeDefined();
    });

    it('should reject duplicate installation without force update', async () => {
      const installRequest = {
        name: 'modbus-adapter',
        version: '1.2.3',
        source: 'https://registry.neurologix.com/packages/modbus-adapter-1.2.3.tar.gz',
        autoEnable: false,
        forceUpdate: false,
      };

      await service.installCapability(installRequest);

      await expect(service.installCapability(installRequest))
        .rejects
        .toThrow('Capability modbus-adapter is already installed');
    });

    it('should update an existing capability', async () => {
      const installRequest = {
        name: 'modbus-adapter',
        version: '1.2.3',
        source: 'https://registry.neurologix.com/packages/modbus-adapter-1.2.3.tar.gz',
        autoEnable: false,
        forceUpdate: false,
      };

      const capability = await service.installCapability(installRequest);
      
      // Add a small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updateRequest = {
        version: '1.3.0',
        configuration: {
          host: '192.168.1.200',
          port: 502,
          timeout: 10000,
        },
        restartRequired: false,
      };

      const updatedCapability = await service.updateCapability(capability.id, updateRequest);

      expect(updatedCapability.version).toBe('1.3.0');
      expect(updatedCapability.currentConfig).toEqual({
        host: '192.168.1.200',
        port: 502,
        timeout: 10000,
      });
      expect(updatedCapability.lastUpdated.getTime()).toBeGreaterThan(capability.lastUpdated.getTime());
    });

    it('should reject update for non-existent capability', async () => {
      const updateRequest = {
        version: '2.0.0',
        restartRequired: false,
      };

      await expect(service.updateCapability('non-existent-id', updateRequest))
        .rejects
        .toThrow('Capability non-existent-id not found');
    });
  });

  describe('Lifecycle Management', () => {
    let capabilityId: string;

    beforeEach(async () => {
      const installRequest = {
        name: 'test-capability',
        version: '1.0.0',
        source: 'https://registry.neurologix.com/packages/test-capability-1.0.0.tar.gz',
        autoEnable: false,
        forceUpdate: false,
      };

      const capability = await service.installCapability(installRequest);
      capabilityId = capability.id;
    });

    it('should enable a capability', async () => {
      const enabledCapability = await service.enableCapability(capabilityId);

      expect(enabledCapability.status).toBe('enabled');
      expect(enabledCapability.enabledAt).toBeDefined();
    });

    it('should disable a capability', async () => {
      await service.enableCapability(capabilityId);
      const disabledCapability = await service.disableCapability(capabilityId);

      expect(disabledCapability.status).toBe('disabled');
    });

    it('should return same capability if already enabled', async () => {
      const enabledCapability1 = await service.enableCapability(capabilityId);
      const enabledCapability2 = await service.enableCapability(capabilityId);

      expect(enabledCapability1.id).toBe(enabledCapability2.id);
      expect(enabledCapability2.status).toBe('enabled');
    });

    it('should uninstall a capability', async () => {
      await service.uninstallCapability(capabilityId);
      const capability = await service.getCapability(capabilityId);

      expect(capability).toBeNull();
    });

    it('should reject uninstall if capability has dependents', async () => {
      // Install a dependent capability
      const dependentInstallRequest = {
        name: 'dependent-capability',
        version: '1.0.0',
        source: 'https://registry.neurologix.com/packages/dependent-1.0.0.tar.gz',
        autoEnable: false,
        forceUpdate: false,
      };

      const dependentCapability = await service.installCapability(dependentInstallRequest);
      
      // Manually add dependency (in real system this would come from package metadata)
      const capability = await service.getCapability(capabilityId);
      if (capability) {
        const updatedDependent = {
          ...dependentCapability,
          dependencies: [{
            name: capability.name,
            version: capability.version,
            required: true,
          }],
        };
        // Mock updating the dependent with the dependency
        service['capabilities'].set(dependentCapability.id, updatedDependent);
      }

      await expect(service.uninstallCapability(capabilityId))
        .rejects
        .toThrow('Cannot uninstall test-capability. It is required by: dependent-capability');
    });
  });

  describe('Querying and Filtering', () => {
    beforeEach(async () => {
      // Install multiple test capabilities for this test suite
      const capabilities = [
        {
          name: 'modbus-adapter',
          version: '1.2.3',
          source: 'https://registry.neurologix.com/modbus-adapter.tar.gz',
          autoEnable: true,
        },
        {
          name: 'opcua-adapter',
          version: '2.1.0',
          source: 'https://registry.neurologix.com/opcua-adapter.tar.gz',
          autoEnable: false,
        },
        {
          name: 'cv-processor',
          version: '1.0.0',
          source: 'https://registry.neurologix.com/cv-processor.tar.gz',
          autoEnable: true,
        },
      ];

      for (const cap of capabilities) {
        await service.installCapability({
          ...cap,
          forceUpdate: false,
        });
      }
    });

    it('should list all capabilities', async () => {
      const response = await service.listCapabilities({});

      expect(response.capabilities).toHaveLength(3);
      expect(response.total).toBe(3);
      expect(response.hasMore).toBe(false);
    });

    it('should filter by status', async () => {
      const response = await service.listCapabilities({
        status: 'enabled',
      });

      expect(response.capabilities).toHaveLength(2);
      expect(response.capabilities.every(cap => cap.status === 'enabled')).toBe(true);
    });

    it('should search capabilities', async () => {
      const response = await service.listCapabilities({
        search: 'adapter',
      });

      expect(response.capabilities).toHaveLength(2);
      expect(response.capabilities.every(cap => 
        cap.name.includes('adapter') || cap.displayName.includes('adapter')
      )).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await service.listCapabilities({
        limit: 2,
        offset: 0,
      });

      expect(response.capabilities).toHaveLength(2);
      expect(response.total).toBe(3);
      expect(response.hasMore).toBe(true);
      expect(response.limit).toBe(2);
      expect(response.offset).toBe(0);
    });

    it('should sort by name ascending', async () => {
      const response = await service.listCapabilities({
        sortBy: 'name',
        sortOrder: 'asc',
      });

      const names = response.capabilities.map(cap => cap.name);
      expect(names).toEqual(['cv-processor', 'modbus-adapter', 'opcua-adapter']);
    });

    it('should sort by name descending', async () => {
      const response = await service.listCapabilities({
        sortBy: 'name',
        sortOrder: 'desc',
      });

      const names = response.capabilities.map(cap => cap.name);
      expect(names).toEqual(['opcua-adapter', 'modbus-adapter', 'cv-processor']);
    });
  });

  describe('Health Monitoring', () => {
    let capabilityId: string;

    beforeEach(async () => {
      const installRequest = {
        name: 'health-test-capability',
        version: '1.0.0',
        source: 'https://registry.neurologix.com/health-test-1.0.0.tar.gz',
        autoEnable: true,
        forceUpdate: false,
      };

      const capability = await service.installCapability(installRequest);
      capabilityId = capability.id;
    });

    it('should check capability health', async () => {
      const health = await service.checkCapabilityHealth(capabilityId);

      expect(health.capabilityId).toBe(capabilityId);
      expect(health.status).toBe('enabled');
      expect(health.lastCheck).toBeDefined();
      expect(typeof health.isHealthy).toBe('boolean');
    });

    it('should reject health check for non-existent capability', async () => {
      await expect(service.checkCapabilityHealth('non-existent-id'))
        .rejects
        .toThrow('Capability non-existent-id not found');
    });
  });

  describe('Registry Statistics', () => {
    beforeEach(async () => {
      // Install test capabilities for statistics
      const capabilities = [
        { name: 'adapter-1', version: '1.0.0', autoEnable: true },
        { name: 'adapter-2', version: '1.0.0', autoEnable: false },
        { name: 'ai-model-1', version: '2.0.0', autoEnable: true },
      ];

      for (const cap of capabilities) {
        await service.installCapability({
          ...cap,
          source: `https://registry.neurologix.com/${cap.name}.tar.gz`,
          forceUpdate: false,
        });
      }
    });

    it('should get registry statistics', async () => {
      const stats = await service.getRegistryStats();

      expect(stats.total).toBe(3);
      expect(stats.enabled).toBe(2);
      expect(stats.disabled).toBe(0); // Actually 1 (adapter-2) but status is 'installed'
      expect(stats.failed).toBe(0);
      expect(stats.lastUpdated).toBeDefined();
      expect(stats.byType).toBeDefined();
      expect(stats.byZone).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle enable for non-existent capability', async () => {
      await expect(service.enableCapability('non-existent-id'))
        .rejects
        .toThrow('Capability non-existent-id not found');
    });

    it('should handle disable for non-existent capability', async () => {
      await expect(service.disableCapability('non-existent-id'))
        .rejects
        .toThrow('Capability non-existent-id not found');
    });

    it('should handle uninstall for non-existent capability', async () => {
      await expect(service.uninstallCapability('non-existent-id'))
        .rejects
        .toThrow('Capability non-existent-id not found');
    });

    it('should handle get for non-existent capability', async () => {
      const capability = await service.getCapability('non-existent-id');
      expect(capability).toBeNull();
    });
  });
});