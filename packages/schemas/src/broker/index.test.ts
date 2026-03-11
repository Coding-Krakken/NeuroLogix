import { describe, expect, it } from 'vitest';

import {
  BrokerAclRuleSchema,
  BrokerTopicContractSchema,
  assertTopicContractCompatible,
  evaluateTopicContractCompatibility,
} from '@/broker/index';

// ─── Shared test fixtures ──────────────────────────────────────────────────

const kafkaContract = (overrides: object = {}): object => ({
  backend: 'kafka-redpanda',
  topic: 'nlx.telemetry.asset.v1',
  version: { major: 1, minor: 0, patch: 0 },
  payloadSchemaId: 'telemetry.asset.v1',
  compatibility: 'backward',
  partitions: 6,
  retentionHours: 168,
  ...overrides,
});

const sparkplugContract = (overrides: object = {}): object => ({
  backend: 'mqtt-sparkplug',
  topic: 'spBv1.0/line-a/DDATA/plc-01/conveyor-01',
  version: { major: 1, minor: 0, patch: 0 },
  payloadSchemaId: 'sparkplug.telemetry.v1',
  compatibility: 'backward',
  qos: 'at-least-once',
  ...overrides,
});

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

    it('validates service principal ACL for MQTT Sparkplug topics with valid spBv1.0/ pattern', () => {
      const result = BrokerAclRuleSchema.safeParse({
        principal: 'svc.digital-twin',
        backend: 'mqtt-sparkplug',
        operation: 'subscribe',
        topicPattern: 'spBv1.0/line-a/DDATA/#',
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

    it('rejects Kafka ACL patterns that do not start with nlx.', () => {
      const result = BrokerAclRuleSchema.safeParse({
        principal: 'svc.digital-twin',
        backend: 'kafka-redpanda',
        operation: 'subscribe',
        topicPattern: 'spBv1.0/line-a/DDATA/#',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('must start with nlx.');
      }
    });
  });

  describe('Contract compatibility', () => {
    it('passes for a compatible minor version update', () => {
      const previous = BrokerTopicContractSchema.parse(kafkaContract({ compatibility: 'full' }));
      const next = BrokerTopicContractSchema.parse(
        kafkaContract({ version: { major: 1, minor: 1, patch: 0 }, compatibility: 'full' }),
      );

      expect(evaluateTopicContractCompatibility(previous, next)).toEqual({ compatible: true });
      expect(() => assertTopicContractCompatible(previous, next)).not.toThrow();
    });

    it('fails when payload schema changes without major version bump', () => {
      const previous = BrokerTopicContractSchema.parse(
        kafkaContract({ version: { major: 1, minor: 2, patch: 0 } }),
      );
      const next = BrokerTopicContractSchema.parse(
        kafkaContract({ version: { major: 1, minor: 3, patch: 0 }, payloadSchemaId: 'telemetry.asset.v2' }),
      );
      const result = evaluateTopicContractCompatibility(previous, next);
      expect(result.compatible).toBe(false);
      expect(() => assertTopicContractCompatible(previous, next)).toThrow(
        'Payload schema changed without a major version bump. Increase major version for breaking changes.'
      );
    });

    it('passes when breaking payload change increments major version', () => {
      const previous = BrokerTopicContractSchema.parse(
        kafkaContract({ version: { major: 1, minor: 5, patch: 0 } }),
      );
      const next = BrokerTopicContractSchema.parse(
        kafkaContract({ version: { major: 2, minor: 0, patch: 0 }, payloadSchemaId: 'telemetry.asset.v2' }),
      );

      expect(evaluateTopicContractCompatibility(previous, next)).toEqual({ compatible: true });
      expect(() => assertTopicContractCompatible(previous, next)).not.toThrow();
    });

    it('fails when backend changes between contracts', () => {
      const previous = BrokerTopicContractSchema.parse(kafkaContract());
      const next = BrokerTopicContractSchema.parse(sparkplugContract());

      const result = evaluateTopicContractCompatibility(previous, next);
      expect(result.compatible).toBe(false);
      if (!result.compatible) {
        expect(result.reason).toContain('Backend changed');
      }
      expect(() => assertTopicContractCompatible(previous, next)).toThrow('Backend changed');
    });

    it('fails when topic name changes between contracts', () => {
      const previous = BrokerTopicContractSchema.parse(kafkaContract());
      const next = BrokerTopicContractSchema.parse(
        kafkaContract({ topic: 'nlx.intents.commands.v1' }),
      );

      const result = evaluateTopicContractCompatibility(previous, next);
      expect(result.compatible).toBe(false);
      if (!result.compatible) {
        expect(result.reason).toContain('Topic name changed');
      }
      expect(() => assertTopicContractCompatible(previous, next)).toThrow('Topic name changed');
    });

    it('fails when contract version regresses (minor version)', () => {
      const previous = BrokerTopicContractSchema.parse(
        kafkaContract({ version: { major: 1, minor: 5, patch: 0 } }),
      );
      const next = BrokerTopicContractSchema.parse(
        kafkaContract({ version: { major: 1, minor: 4, patch: 0 } }),
      );

      const result = evaluateTopicContractCompatibility(previous, next);
      expect(result.compatible).toBe(false);
      if (!result.compatible) {
        expect(result.reason).toContain('version regressed');
      }
      expect(() => assertTopicContractCompatible(previous, next)).toThrow('version regressed');
    });

    it('fails when patch version regresses (compareVersion patch-level path)', () => {
      const previous = BrokerTopicContractSchema.parse(
        kafkaContract({ version: { major: 1, minor: 0, patch: 5 } }),
      );
      const next = BrokerTopicContractSchema.parse(
        kafkaContract({ version: { major: 1, minor: 0, patch: 3 } }),
      );

      const result = evaluateTopicContractCompatibility(previous, next);
      expect(result.compatible).toBe(false);
      if (!result.compatible) {
        expect(result.reason).toContain('version regressed');
      }
      expect(() => assertTopicContractCompatible(previous, next)).toThrow('version regressed');
    });

    it('passes when only patch version increments', () => {
      const previous = BrokerTopicContractSchema.parse(
        kafkaContract({ version: { major: 1, minor: 0, patch: 2 } }),
      );
      const next = BrokerTopicContractSchema.parse(
        kafkaContract({ version: { major: 1, minor: 0, patch: 3 } }),
      );

      expect(evaluateTopicContractCompatibility(previous, next)).toEqual({ compatible: true });
    });

    it('fails when compatibility mode is downgraded from full to backward', () => {
      const previous = BrokerTopicContractSchema.parse(
        kafkaContract({ compatibility: 'full', version: { major: 1, minor: 1, patch: 0 } }),
      );
      const next = BrokerTopicContractSchema.parse(
        kafkaContract({ compatibility: 'backward', version: { major: 1, minor: 2, patch: 0 } }),
      );

      const result = evaluateTopicContractCompatibility(previous, next);
      expect(result.compatible).toBe(false);
      if (!result.compatible) {
        expect(result.reason).toContain('Compatibility mode cannot be downgraded');
      }
      expect(() => assertTopicContractCompatible(previous, next)).toThrow(
        'Compatibility mode cannot be downgraded from full to backward.',
      );
    });

    it('passes when compatibility mode stays the same (backward -> backward)', () => {
      const previous = BrokerTopicContractSchema.parse(
        kafkaContract({ version: { major: 1, minor: 0, patch: 0 } }),
      );
      const next = BrokerTopicContractSchema.parse(
        kafkaContract({ version: { major: 1, minor: 1, patch: 0 } }),
      );

      expect(evaluateTopicContractCompatibility(previous, next)).toEqual({ compatible: true });
    });
  });
});