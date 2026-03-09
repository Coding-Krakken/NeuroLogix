import { describe, it, expect } from 'vitest';
import {
  SparkplugMetricSchema,
  SparkplugPayloadSchema,
  SparkplugTopicSchema,
  createSparkplugTopic,
  parseSparkplugTopic,
  NodeBirthSchema,
  DeviceBirthSchema,
  CommandMessageSchema,
} from '@/sparkplug/index';

describe('Sparkplug B Schemas', () => {
  describe('SparkplugMetricSchema', () => {
    it('should validate correct metric data', () => {
      const validMetric = {
        name: 'conveyor_speed',
        timestamp: Date.now(),
        datatype: 'Float' as const,
        value: 150.5,
        metadata: {
          description: 'Conveyor belt speed in ft/min',
          engUnit: 'ft/min',
          min: 0,
          max: 300,
        },
      };

      const result = SparkplugMetricSchema.safeParse(validMetric);
      expect(result.success).toBe(true);
    });

    it('should reject metric with invalid datatype', () => {
      const invalidMetric = {
        name: 'test_metric',
        timestamp: Date.now(),
        datatype: 'InvalidType' as any,
        value: 100,
      };

      const result = SparkplugMetricSchema.safeParse(invalidMetric);
      expect(result.success).toBe(false);
    });
  });

  describe('SparkplugPayloadSchema', () => {
    it('should validate correct payload data', () => {
      const validPayload = {
        timestamp: Date.now(),
        metrics: [
          {
            name: 'temperature',
            timestamp: Date.now(),
            datatype: 'Double' as const,
            value: 72.5,
          },
        ],
        seq: 42,
        uuid: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = SparkplugPayloadSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject payload with invalid sequence number', () => {
      const invalidPayload = {
        timestamp: Date.now(),
        metrics: [],
        seq: 300, // Invalid: > 255
      };

      const result = SparkplugPayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('SparkplugTopicSchema', () => {
    it('should validate correct topic structure', () => {
      const validTopic = {
        namespace: 'spBv1.0' as const,
        groupId: 'production_line_a',
        messageType: 'DDATA' as const,
        edgeNodeId: 'plc_001',
        deviceId: 'conveyor_belt_1',
      };

      const result = SparkplugTopicSchema.safeParse(validTopic);
      expect(result.success).toBe(true);
    });

    it('should reject topic with invalid namespace', () => {
      const invalidTopic = {
        namespace: 'spBv2.0' as any,
        groupId: 'production_line_a',
        messageType: 'DDATA' as const,
        edgeNodeId: 'plc_001',
      };

      const result = SparkplugTopicSchema.safeParse(invalidTopic);
      expect(result.success).toBe(false);
    });
  });

  describe('NodeBirthSchema', () => {
    it('should validate node birth certificate', () => {
      const validNodeBirth = {
        timestamp: Date.now(),
        metrics: [
          {
            name: 'bdSeq',
            timestamp: Date.now(),
            datatype: 'UInt64' as const,
            value: 0,
          },
          {
            name: 'Node Control/Rebirth',
            timestamp: Date.now(),
            datatype: 'Boolean' as const,
            value: false,
          },
        ],
        seq: 0,
      };

      const result = NodeBirthSchema.safeParse(validNodeBirth);
      expect(result.success).toBe(true);
    });
  });

  describe('DeviceBirthSchema', () => {
    it('should validate device birth certificate', () => {
      const validDeviceBirth = {
        timestamp: Date.now(),
        metrics: [
          {
            name: 'Device/Temperature',
            timestamp: Date.now(),
            datatype: 'Double' as const,
            value: 25.0,
          },
        ],
        seq: 0,
      };

      const result = DeviceBirthSchema.safeParse(validDeviceBirth);
      expect(result.success).toBe(true);
    });
  });

  describe('CommandMessageSchema', () => {
    it('should validate command message', () => {
      const validCommand = {
        timestamp: Date.now(),
        metrics: [
          {
            name: 'conveyor/enable',
            timestamp: Date.now(),
            datatype: 'Boolean' as const,
            value: true,
          },
        ],
        seq: 1,
      };

      const result = CommandMessageSchema.safeParse(validCommand);
      expect(result.success).toBe(true);
    });
  });

  describe('Topic Utilities', () => {
    describe('createSparkplugTopic', () => {
      it('should create device data topic', () => {
        const topic = createSparkplugTopic('production', 'DDATA', 'plc001', 'conveyor1');
        expect(topic).toBe('spBv1.0/production/DDATA/plc001/conveyor1');
      });

      it('should create node data topic without deviceId', () => {
        const topic = createSparkplugTopic('production', 'NDATA', 'plc001');
        expect(topic).toBe('spBv1.0/production/NDATA/plc001');
      });
    });

    describe('parseSparkplugTopic', () => {
      it('should parse device topic correctly', () => {
        const parsed = parseSparkplugTopic('spBv1.0/production/DDATA/plc001/conveyor1');
        expect(parsed).toEqual({
          namespace: 'spBv1.0',
          groupId: 'production',
          messageType: 'DDATA',
          edgeNodeId: 'plc001',
          deviceId: 'conveyor1',
        });
      });

      it('should parse node topic correctly', () => {
        const parsed = parseSparkplugTopic('spBv1.0/production/NDATA/plc001');
        expect(parsed).toEqual({
          namespace: 'spBv1.0',
          groupId: 'production',
          messageType: 'NDATA',
          edgeNodeId: 'plc001',
          deviceId: undefined,
        });
      });

      it('should return null for invalid topic', () => {
        const parsed = parseSparkplugTopic('invalid/topic/structure');
        expect(parsed).toBeNull();
      });
    });
  });
});
