import { describe, it, expect } from 'vitest';
import {
  TelemetryPointSchema,
  AssetTelemetrySchema,
  PlcTelemetrySchema,
  CameraTelemetrySchema,
  SensorTelemetrySchema,
  TelemetryBatchSchema,
  TelemetrySubscriptionSchema,
} from '@/telemetry/index';

describe('Telemetry Schemas', () => {
  describe('TelemetryPointSchema', () => {
    it('should validate correct telemetry point', () => {
      const validPoint = {
        tagName: 'conveyor.speed',
        value: 150.5,
        timestamp: new Date(),
        quality: 'good' as const,
        source: 'plc-001',
        metadata: { units: 'ft/min' },
      };

      const result = TelemetryPointSchema.safeParse(validPoint);
      expect(result.success).toBe(true);
    });

    it('should reject point with invalid quality', () => {
      const invalidPoint = {
        tagName: 'test.tag',
        value: 100,
        timestamp: new Date(),
        quality: 'excellent' as any, // Invalid quality
        source: 'test-source',
      };

      const result = TelemetryPointSchema.safeParse(invalidPoint);
      expect(result.success).toBe(false);
    });
  });

  describe('AssetTelemetrySchema', () => {
    it('should validate correct asset telemetry', () => {
      const validAssetTelemetry = {
        assetId: '550e8400-e29b-41d4-a716-446655440000',
        assetType: 'conveyor' as const,
        zone: 'production-line-a',
        timestamp: new Date(),
        points: [
          {
            tagName: 'speed',
            value: 120.0,
            timestamp: new Date(),
            quality: 'good' as const,
            source: 'encoder-001',
          },
        ],
      };

      const result = AssetTelemetrySchema.safeParse(validAssetTelemetry);
      expect(result.success).toBe(true);
    });

    it('should reject asset telemetry with invalid UUID', () => {
      const invalidAssetTelemetry = {
        assetId: 'invalid-uuid',
        assetType: 'conveyor' as const,
        zone: 'production-line-a',
        timestamp: new Date(),
        points: [],
      };

      const result = AssetTelemetrySchema.safeParse(invalidAssetTelemetry);
      expect(result.success).toBe(false);
    });
  });

  describe('PlcTelemetrySchema', () => {
    it('should validate correct PLC telemetry', () => {
      const validPlcTelemetry = {
        assetId: '550e8400-e29b-41d4-a716-446655440000',
        assetType: 'plc' as const,
        zone: 'production-line-a',
        timestamp: new Date(),
        points: [
          {
            tagName: 'motor_speed',
            value: 1800,
            timestamp: new Date(),
            quality: 'good' as const,
            source: 'plc-001',
            dataType: 'INT' as const,
            address: '%MW100',
            scaling: {
              factor: 0.1,
              offset: 0,
              units: 'RPM',
            },
          },
        ],
        plcInfo: {
          stationName: 'PLC-001',
          rackSlot: '1/2',
          ipAddress: '192.168.1.100',
          protocol: 'ethernet_ip' as const,
        },
      };

      const result = PlcTelemetrySchema.safeParse(validPlcTelemetry);
      expect(result.success).toBe(true);
    });
  });

  describe('CameraTelemetrySchema', () => {
    it('should validate correct camera telemetry', () => {
      const validCameraTelemetry = {
        assetId: '550e8400-e29b-41d4-a716-446655440000',
        assetType: 'camera' as const,
        zone: 'quality-inspection',
        timestamp: new Date(),
        points: [
          {
            tagName: 'object_detected',
            value: true,
            timestamp: new Date(),
            quality: 'good' as const,
            source: 'cv-processor-001',
            frameId: 'frame_123456',
            roi: {
              x: 100,
              y: 200,
              width: 300,
              height: 400,
            },
          },
        ],
        cameraInfo: {
          resolution: {
            width: 1920,
            height: 1080,
          },
          fps: 30,
          codec: 'h264' as const,
          streamUrl: 'rtsp://192.168.1.200/stream1',
        },
      };

      const result = CameraTelemetrySchema.safeParse(validCameraTelemetry);
      expect(result.success).toBe(true);
    });

    it('should reject camera telemetry with invalid ROI', () => {
      const invalidCameraTelemetry = {
        assetId: '550e8400-e29b-41d4-a716-446655440000',
        assetType: 'camera' as const,
        zone: 'quality-inspection',
        timestamp: new Date(),
        points: [
          {
            tagName: 'object_detected',
            value: true,
            timestamp: new Date(),
            quality: 'good' as const,
            source: 'cv-processor-001',
            roi: {
              x: -10, // Invalid: negative x
              y: 200,
              width: 300,
              height: 400,
            },
          },
        ],
        cameraInfo: {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
          codec: 'h264' as const,
        },
      };

      const result = CameraTelemetrySchema.safeParse(invalidCameraTelemetry);
      expect(result.success).toBe(false);
    });
  });

  describe('SensorTelemetrySchema', () => {
    it('should validate correct sensor telemetry', () => {
      const validSensorTelemetry = {
        assetId: '550e8400-e29b-41d4-a716-446655440000',
        assetType: 'sensor' as const,
        zone: 'warehouse-dock-1',
        timestamp: new Date(),
        points: [
          {
            tagName: 'temperature',
            value: 72.5,
            timestamp: new Date(),
            quality: 'good' as const,
            source: 'temp-sensor-001',
            sensorType: 'temperature' as const,
            range: {
              min: -40,
              max: 200,
              units: '°F',
            },
            calibration: {
              lastCalibrated: new Date('2023-01-01'),
              nextCalibration: new Date('2024-01-01'),
              certificateId: 'CAL-2023-001',
            },
          },
        ],
      };

      const result = SensorTelemetrySchema.safeParse(validSensorTelemetry);
      expect(result.success).toBe(true);
    });
  });

  describe('TelemetryBatchSchema', () => {
    it('should validate correct telemetry batch', () => {
      const validBatch = {
        batchId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: new Date(),
        source: 'edge-gateway-001',
        assets: [
          {
            assetId: '550e8400-e29b-41d4-a716-446655440001',
            assetType: 'conveyor' as const,
            zone: 'production-line-a',
            timestamp: new Date(),
            points: [
              {
                tagName: 'speed',
                value: 100,
                timestamp: new Date(),
                quality: 'good' as const,
                source: 'encoder-001',
              },
            ],
          },
        ],
        metadata: {
          totalPoints: 1,
          processingTime: 15.5,
          compression: 'gzip' as const,
        },
      };

      const result = TelemetryBatchSchema.safeParse(validBatch);
      expect(result.success).toBe(true);
    });
  });

  describe('TelemetrySubscriptionSchema', () => {
    it('should validate correct subscription', () => {
      const validSubscription = {
        subscriptionId: '550e8400-e29b-41d4-a716-446655440000',
        filters: {
          assetIds: ['550e8400-e29b-41d4-a716-446655440001'],
          assetTypes: ['conveyor', 'sensor'],
          zones: ['production-line-a'],
          tagNames: ['speed', 'temperature'],
          quality: ['good'],
        },
        options: {
          minInterval: 1000,
          maxBatchSize: 50,
          compression: true,
          includeMetadata: false,
        },
        webhook: {
          url: 'https://api.example.com/telemetry',
          headers: {
            Authorization: 'Bearer token123',
          },
          retries: 3,
        },
      };

      const result = TelemetrySubscriptionSchema.safeParse(validSubscription);
      expect(result.success).toBe(true);
    });

    it('should reject subscription with invalid webhook URL', () => {
      const invalidSubscription = {
        subscriptionId: '550e8400-e29b-41d4-a716-446655440000',
        filters: {},
        options: {},
        webhook: {
          url: 'not-a-valid-url',
          retries: 3,
        },
      };

      const result = TelemetrySubscriptionSchema.safeParse(invalidSubscription);
      expect(result.success).toBe(false);
    });
  });
});
