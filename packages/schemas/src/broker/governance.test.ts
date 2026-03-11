import { describe, expect, it } from 'vitest';

import { BROKER_TOPIC_CONTRACTS, BrokerTopicContractSchema } from './index';
import {
  assertTopicRegistryGuard,
  isSafetyCriticalTopic,
  type TopicValidationResult,
  validateTopicAgainstContract,
  validateTopicRegistrationAgainstContracts,
  validateTopicRegistryGuard,
} from './governance';
import { SITE_TIER } from '../federation/index';

describe('Broker Topic Governance Runtime Enforcement', () => {
  const telemetryContract = BROKER_TOPIC_CONTRACTS.find(
    (contract) => contract.topic === 'nlx.telemetry.asset.v1'
  );

  const apiContract = BROKER_TOPIC_CONTRACTS.find(
    (contract) => contract.topic === 'nlx.api.federation.v1'
  );

  const sparkplugContract = BROKER_TOPIC_CONTRACTS.find(
    (contract) => contract.topic === 'spBv1.0/line-a/DDATA/plc-01/conveyor-01'
  );

  it('loads canonical broker topic contracts for runtime governance', () => {
    expect(BROKER_TOPIC_CONTRACTS.length).toBeGreaterThanOrEqual(5);
    expect(telemetryContract).toBeDefined();
    expect(apiContract).toBeDefined();
    expect(sparkplugContract).toBeDefined();
  });

  it('validates a conformant registration against the canonical contract registry', () => {
    const registration = BrokerTopicContractSchema.parse({
      backend: 'kafka-redpanda',
      topic: 'nlx.telemetry.asset.v1',
      version: { major: 1, minor: 0, patch: 0 },
      payloadSchemaId: 'telemetry.asset.v1',
      compatibility: 'full',
      partitions: 12,
      retentionHours: 168,
      deadLetterTopic: 'nlx.telemetry.asset.v1.dlq',
    });

    const result = validateTopicRegistrationAgainstContracts(registration);

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.contract?.topic).toEqual('nlx.telemetry.asset.v1');
  });

  it('detects topic name mismatches when registration topic is not in the registry', () => {
    const registration = BrokerTopicContractSchema.parse({
      backend: 'kafka-redpanda',
      topic: 'nlx.telemetry.unregistered.v1',
      version: { major: 1, minor: 0, patch: 0 },
      payloadSchemaId: 'telemetry.asset.v1',
      compatibility: 'backward',
      partitions: 12,
      retentionHours: 168,
      deadLetterTopic: 'nlx.telemetry.unregistered.v1.dlq',
    });

    const result = validateTopicRegistrationAgainstContracts(registration);

    expect(result.valid).toBe(false);
    expect(result.issues[0]).toContain('No broker topic contract found');
  });

  it('detects backend mismatches when registration is validated against an incompatible contract', () => {
    const kafkaRegistration = BrokerTopicContractSchema.parse({
      backend: 'kafka-redpanda',
      topic: 'nlx.telemetry.asset.v1',
      version: { major: 1, minor: 0, patch: 0 },
      payloadSchemaId: 'telemetry.asset.v1',
      compatibility: 'full',
      partitions: 12,
      retentionHours: 168,
      deadLetterTopic: 'nlx.telemetry.asset.v1.dlq',
    });

    const mqttContract = BrokerTopicContractSchema.parse({
      backend: 'mqtt-sparkplug',
      topic: 'spBv1.0/line-a/DDATA/plc-01/conveyor-01',
      version: { major: 1, minor: 0, patch: 0 },
      payloadSchemaId: 'sparkplug.telemetry.v1',
      compatibility: 'backward',
      qos: 'at-least-once',
    });

    const result = validateTopicAgainstContract(mqttContract, kafkaRegistration);

    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.includes('Backend mismatch'))).toBe(true);
  });

  it('detects compatibility issues for breaking payload changes without major bump', () => {
    const contract = BrokerTopicContractSchema.parse({
      backend: 'kafka-redpanda',
      topic: 'nlx.telemetry.asset.v1',
      version: { major: 1, minor: 0, patch: 0 },
      payloadSchemaId: 'telemetry.asset.v1',
      compatibility: 'full',
      partitions: 12,
      retentionHours: 168,
      deadLetterTopic: 'nlx.telemetry.asset.v1.dlq',
    });

    const breakingRegistration = BrokerTopicContractSchema.parse({
      backend: 'kafka-redpanda',
      topic: 'nlx.telemetry.asset.v1',
      version: { major: 1, minor: 1, patch: 0 },
      payloadSchemaId: 'telemetry.asset.v2',
      compatibility: 'full',
      partitions: 12,
      retentionHours: 168,
      deadLetterTopic: 'nlx.telemetry.asset.v1.dlq',
    });

    const result = validateTopicAgainstContract(contract, breakingRegistration);

    expect(result.valid).toBe(false);
    expect(result.compatibility?.compatible).toBe(false);
    expect(result.issues.some((issue) => issue.includes('major version bump'))).toBe(true);
  });

  it('detects Sparkplug QoS mismatches against the expected contract', () => {
    const contract = BrokerTopicContractSchema.parse({
      backend: 'mqtt-sparkplug',
      topic: 'spBv1.0/line-a/DDATA/plc-01/conveyor-01',
      version: { major: 1, minor: 0, patch: 0 },
      payloadSchemaId: 'sparkplug.telemetry.v1',
      compatibility: 'backward',
      qos: 'at-least-once',
    });

    const registration = BrokerTopicContractSchema.parse({
      backend: 'mqtt-sparkplug',
      topic: 'spBv1.0/line-a/DDATA/plc-01/conveyor-01',
      version: { major: 1, minor: 0, patch: 0 },
      payloadSchemaId: 'sparkplug.telemetry.v1',
      compatibility: 'backward',
      qos: 'exactly-once',
    });

    const result = validateTopicAgainstContract(contract, registration);

    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.includes('QoS mismatch'))).toBe(true);
  });

  it('returns schema violation issues for malformed registration payloads', () => {
    const malformed = {
      backend: 'kafka-redpanda',
      topic: 'nlx.telemetry.asset.v1',
    } as unknown as Parameters<typeof validateTopicRegistrationAgainstContracts>[0];

    const result: TopicValidationResult = validateTopicRegistrationAgainstContracts(malformed);

    expect(result.valid).toBe(false);
    expect(result.issues[0]).toContain('Registration schema violation');
  });

  it('classifies telemetry and sparkplug topics as safety critical', () => {
    expect(isSafetyCriticalTopic({ topic: 'nlx.telemetry.asset.v1' })).toBe(true);
    expect(isSafetyCriticalTopic({ topic: 'spBv1.0/line-a/DDATA/plc-01/conveyor-01' })).toBe(true);
    expect(isSafetyCriticalTopic({ topic: 'nlx.api.federation.v1' })).toBe(false);
  });

  it('fails hard for T1 sites when a safety-critical topic violates governance', () => {
    const violatingRegistration = BrokerTopicContractSchema.parse({
      backend: 'kafka-redpanda',
      topic: 'nlx.telemetry.asset.v1',
      version: { major: 1, minor: 0, patch: 0 },
      payloadSchemaId: 'telemetry.asset.v1',
      compatibility: 'full',
      partitions: 3,
      retentionHours: 168,
      deadLetterTopic: 'nlx.telemetry.asset.v1.dlq',
    });

    const result = validateTopicRegistryGuard([violatingRegistration], {
      tier: SITE_TIER.T1,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.warnings).toHaveLength(0);
    expect(result.errors[0]?.issues.some((issue) => issue.includes('Partitions mismatch'))).toBe(true);
    expect(() =>
      assertTopicRegistryGuard([violatingRegistration], {
        tier: SITE_TIER.T1,
      })
    ).toThrow('Broker topic governance failed bootstrap validation');
  });

  it('warns for T2/T3 non-critical topic violations by default policy', () => {
    const violatingApiRegistration = BrokerTopicContractSchema.parse({
      backend: 'kafka-redpanda',
      topic: 'nlx.api.federation.v1',
      version: { major: 1, minor: 0, patch: 0 },
      payloadSchemaId: 'api.federation.v1',
      compatibility: 'backward',
      partitions: 3,
      retentionHours: 72,
    });

    const t2Result = validateTopicRegistryGuard([violatingApiRegistration], {
      tier: SITE_TIER.T2,
    });
    const t3Result = validateTopicRegistryGuard([violatingApiRegistration], {
      tier: SITE_TIER.T3,
    });

    expect(t2Result.valid).toBe(true);
    expect(t2Result.errors).toHaveLength(0);
    expect(t2Result.warnings).toHaveLength(1);

    expect(t3Result.valid).toBe(true);
    expect(t3Result.errors).toHaveLength(0);
    expect(t3Result.warnings).toHaveLength(1);
  });

  it('passes guard validation for conformant registrations and does not throw', () => {
    const conformant = BrokerTopicContractSchema.parse({
      backend: 'kafka-redpanda',
      topic: 'nlx.api.federation.v1',
      version: { major: 1, minor: 0, patch: 0 },
      payloadSchemaId: 'api.federation.v1',
      compatibility: 'backward',
      partitions: 3,
      retentionHours: 24,
    });

    const result = validateTopicRegistryGuard([conformant], {
      tier: SITE_TIER.T1,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(() =>
      assertTopicRegistryGuard([conformant], {
        tier: SITE_TIER.T1,
      })
    ).not.toThrow();
  });

  it('supports tier policy overrides to escalate warnings to errors on T2', () => {
    const violatingApiRegistration = BrokerTopicContractSchema.parse({
      backend: 'kafka-redpanda',
      topic: 'nlx.api.federation.v1',
      version: { major: 1, minor: 0, patch: 0 },
      payloadSchemaId: 'api.federation.v1',
      compatibility: 'backward',
      partitions: 3,
      retentionHours: 72,
    });

    const result = validateTopicRegistryGuard([violatingApiRegistration], {
      tier: SITE_TIER.T2,
      tierPolicy: {
        [SITE_TIER.T2]: 'error',
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.warnings).toHaveLength(0);
  });
});
