import { describe, expect, it } from 'vitest';

import {
  BrokerAclRuleSchema,
  BrokerTopicContractSchema,
  assertTopicContractCompatible,
  evaluateTopicContractCompatibility,
} from '@/broker/index';

describe('Broker Topic Governance', () => {
  describe('BrokerTopicContractSchema', () => {
    it('validates Sparkplug contract topics', () => {
      const result = BrokerTopicContractSchema.safeParse({
        backend: 'mqtt-sparkplug',
        topic: 'spBv1.0/line-a/DDATA/plc-01/conveyor-01',
        version: { major: 1, minor: 0, patch: 0 },
        payloadSchemaId: 'telemetry.asset.v1',
        compatibility: 'backward',
        qos: 'at-least-once',
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid Kafka topic naming', () => {
      const result = BrokerTopicContractSchema.safeParse({
        backend: 'kafka-redpanda',
        topic: 'telemetry.asset.v1',
        version: { major: 1, minor: 0, patch: 0 },
        payloadSchemaId: 'telemetry.asset.v1',
        compatibility: 'backward',
        partitions: 6,
        retentionHours: 168,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('BrokerAclRuleSchema', () => {
    it('validates service principal ACL for Kafka topics', () => {
      const result = BrokerAclRuleSchema.safeParse({
        principal: 'svc.recipe-executor',
        backend: 'kafka-redpanda',
        operation: 'publish',
        topicPattern: 'nlx.recipes.execution.*',
      });

      expect(result.success).toBe(true);
    });

    it('rejects ACL rules that use non-service principals', () => {
      const result = BrokerAclRuleSchema.safeParse({
        principal: 'user.alice',
        backend: 'kafka-redpanda',
        operation: 'subscribe',
        topicPattern: 'nlx.telemetry.asset.v1',
      });

      expect(result.success).toBe(false);
    });

    it('rejects ACL patterns that violate backend topic conventions', () => {
      const result = BrokerAclRuleSchema.safeParse({
        principal: 'svc.digital-twin',
        backend: 'mqtt-sparkplug',
        operation: 'subscribe',
        topicPattern: 'nlx.telemetry.asset.v1',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Contract compatibility', () => {
    it('passes for a compatible minor version update', () => {
      const previous = BrokerTopicContractSchema.parse({
        backend: 'kafka-redpanda',
        topic: 'nlx.telemetry.asset.v1',
        version: { major: 1, minor: 0, patch: 0 },
        payloadSchemaId: 'telemetry.asset.v1',
        compatibility: 'full',
        partitions: 6,
        retentionHours: 168,
      });

      const next = BrokerTopicContractSchema.parse({
        backend: 'kafka-redpanda',
        topic: 'nlx.telemetry.asset.v1',
        version: { major: 1, minor: 1, patch: 0 },
        payloadSchemaId: 'telemetry.asset.v1',
        compatibility: 'full',
        partitions: 6,
        retentionHours: 168,
      });

      expect(evaluateTopicContractCompatibility(previous, next)).toEqual({ compatible: true });
      expect(() => assertTopicContractCompatible(previous, next)).not.toThrow();
    });

    it('fails when payload schema changes without major version bump', () => {
      const previous = BrokerTopicContractSchema.parse({
        backend: 'kafka-redpanda',
        topic: 'nlx.telemetry.asset.v1',
        version: { major: 1, minor: 2, patch: 0 },
        payloadSchemaId: 'telemetry.asset.v1',
        compatibility: 'backward',
        partitions: 6,
        retentionHours: 168,
      });

      const next = BrokerTopicContractSchema.parse({
        backend: 'kafka-redpanda',
        topic: 'nlx.telemetry.asset.v1',
        version: { major: 1, minor: 3, patch: 0 },
        payloadSchemaId: 'telemetry.asset.v2',
        compatibility: 'backward',
        partitions: 6,
        retentionHours: 168,
      });

      const result = evaluateTopicContractCompatibility(previous, next);
      expect(result.compatible).toBe(false);
      expect(() => assertTopicContractCompatible(previous, next)).toThrow(
        'Payload schema changed without a major version bump. Increase major version for breaking changes.'
      );
    });

    it('passes when breaking payload change increments major version', () => {
      const previous = BrokerTopicContractSchema.parse({
        backend: 'kafka-redpanda',
        topic: 'nlx.telemetry.asset.v1',
        version: { major: 1, minor: 5, patch: 0 },
        payloadSchemaId: 'telemetry.asset.v1',
        compatibility: 'backward',
        partitions: 6,
        retentionHours: 168,
      });

      const next = BrokerTopicContractSchema.parse({
        backend: 'kafka-redpanda',
        topic: 'nlx.telemetry.asset.v1',
        version: { major: 2, minor: 0, patch: 0 },
        payloadSchemaId: 'telemetry.asset.v2',
        compatibility: 'backward',
        partitions: 6,
        retentionHours: 168,
      });

      expect(evaluateTopicContractCompatibility(previous, next)).toEqual({ compatible: true });
      expect(() => assertTopicContractCompatible(previous, next)).not.toThrow();
    });
  });
});