import { beforeEach, describe, expect, it } from 'vitest';
import {
  CapabilityHealthSchema,
  CapabilityInstallRequestSchema,
  CapabilityRegistryResponseSchema,
  CapabilitySchema,
  CapabilityUpdateRequestSchema,
  RegistryStatsSchema,
} from '@/types/index';
import { CapabilityRegistryService } from '@/services/capability-registry.service';

describe('Capability Registry Service Contract Baseline', () => {
  let service: CapabilityRegistryService;

  beforeEach(() => {
    service = new CapabilityRegistryService();
  });

  it('enforces install request and installed capability response contracts', async () => {
    const request = CapabilityInstallRequestSchema.parse({
      name: 'contract-capability-a',
      version: '1.0.0',
      source: 'https://registry.neurologix.com/packages/contract-capability-a-1.0.0.tar.gz',
      configuration: {
        endpoint: 'opc.tcp://plc-a',
        timeoutMs: 1000,
      },
      autoEnable: false,
      forceUpdate: false,
    });

    const installed = await service.installCapability(request);
    const parsed = CapabilitySchema.parse(installed);

    expect(parsed.name).toBe(request.name);
    expect(parsed.version).toBe(request.version);
    expect(parsed.status).toBe('installed');
  });

  it('enforces list response contract shape with pagination metadata', async () => {
    await service.installCapability(
      CapabilityInstallRequestSchema.parse({
        name: 'contract-capability-b',
        version: '1.1.0',
        source: 'https://registry.neurologix.com/packages/contract-capability-b-1.1.0.tar.gz',
        autoEnable: true,
        forceUpdate: false,
      })
    );

    const response = await service.listCapabilities({ limit: 10, offset: 0 });
    const parsed = CapabilityRegistryResponseSchema.parse(response);

    expect(parsed.limit).toBe(10);
    expect(parsed.offset).toBe(0);
    expect(parsed.total).toBeGreaterThanOrEqual(1);
    expect(parsed.capabilities.length).toBeGreaterThanOrEqual(1);
  });

  it('enforces update request and response contract shape for restart-required updates', async () => {
    const installed = await service.installCapability(
      CapabilityInstallRequestSchema.parse({
        name: 'contract-capability-c',
        version: '2.0.0',
        source: 'https://registry.neurologix.com/packages/contract-capability-c-2.0.0.tar.gz',
        autoEnable: true,
        forceUpdate: false,
      })
    );

    const updateRequest = CapabilityUpdateRequestSchema.parse({
      version: '2.1.0',
      configuration: {
        maxRetries: 3,
      },
      restartRequired: true,
    });

    const updated = await service.updateCapability(installed.id, updateRequest);
    const parsed = CapabilitySchema.parse(updated);

    expect(parsed.id).toBe(installed.id);
    expect(parsed.version).toBe(updateRequest.version);
    expect(parsed.status).toBe('updating');
  });

  it('enforces capability health response contract shape', async () => {
    const installed = await service.installCapability(
      CapabilityInstallRequestSchema.parse({
        name: 'contract-capability-d',
        version: '3.0.0',
        source: 'https://registry.neurologix.com/packages/contract-capability-d-3.0.0.tar.gz',
        autoEnable: true,
        forceUpdate: false,
      })
    );

    const health = await service.checkCapabilityHealth(installed.id);
    const parsed = CapabilityHealthSchema.parse(health);

    expect(parsed.capabilityId).toBe(installed.id);
    expect(['enabled', 'failed', 'installed', 'disabled', 'updating', 'uninstalling']).toContain(
      parsed.status
    );
  });

  it('enforces registry stats response contract shape', async () => {
    await service.installCapability(
      CapabilityInstallRequestSchema.parse({
        name: 'contract-capability-e',
        version: '4.0.0',
        source: 'https://registry.neurologix.com/packages/contract-capability-e-4.0.0.tar.gz',
        autoEnable: false,
        forceUpdate: false,
      })
    );

    const stats = await service.getRegistryStats();
    const parsed = RegistryStatsSchema.parse(stats);

    expect(parsed.total).toBeGreaterThanOrEqual(1);
    expect(parsed.byType.adapter).toBeGreaterThanOrEqual(1);
  });
});