import { describe, it, expect } from 'vitest';
import {
  AssetSchema,
  TelemetrySchema,
  IntentSchema,
  RecipeSchema,
  AuditEventSchema,
  UserSchema,
} from '@/types/index';

describe('Type Schemas', () => {
  describe('AssetSchema', () => {
    it('should validate correct asset data', () => {
      const validAsset = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Conveyor Belt 1',
        type: 'conveyor' as const,
        zone: 'production-line-a',
        status: 'online' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = AssetSchema.safeParse(validAsset);
      expect(result.success).toBe(true);
    });

    it('should reject invalid asset data', () => {
      const invalidAsset = {
        id: 'invalid-uuid',
        name: '',
        type: 'invalid-type',
        zone: '',
        status: 'invalid-status',
      };

      const result = AssetSchema.safeParse(invalidAsset);
      expect(result.success).toBe(false);
    });
  });

  describe('TelemetrySchema', () => {
    it('should validate correct telemetry data', () => {
      const validTelemetry = {
        assetId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: new Date(),
        tags: {
          speed: 150.5,
          status: 'running',
          enabled: true,
        },
        quality: 'good' as const,
        source: 'plc-001',
      };

      const result = TelemetrySchema.safeParse(validTelemetry);
      expect(result.success).toBe(true);
    });
  });

  describe('IntentSchema', () => {
    it('should validate correct intent data', () => {
      const validIntent = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'voice_command' as const,
        source: 'radio-001',
        payload: { command: 'stop_conveyor', zone: 'production-a' },
        confidence: 0.95,
        timestamp: new Date(),
        userId: 'user-123',
      };

      const result = IntentSchema.safeParse(validIntent);
      expect(result.success).toBe(true);
    });

    it('should reject intent with invalid confidence', () => {
      const invalidIntent = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'voice_command' as const,
        source: 'radio-001',
        payload: {},
        confidence: 1.5, // Invalid: > 1
        timestamp: new Date(),
      };

      const result = IntentSchema.safeParse(invalidIntent);
      expect(result.success).toBe(false);
    });
  });

  describe('RecipeSchema', () => {
    it('should validate correct recipe data', () => {
      const validRecipe = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Emergency Stop Procedure',
        version: '1.0.0',
        description: 'Safely stops all production line equipment',
        steps: [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Stop Conveyors',
            type: 'set_tag' as const,
            parameters: { tag: 'conveyor.enabled', value: false },
          },
        ],
        createdBy: 'admin-user',
        createdAt: new Date(),
      };

      const result = RecipeSchema.safeParse(validRecipe);
      expect(result.success).toBe(true);
    });
  });

  describe('AuditEventSchema', () => {
    it('should validate correct audit event data', () => {
      const validAuditEvent = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: new Date(),
        userId: 'user-123',
        action: 'execute_recipe',
        resource: 'recipe/emergency-stop',
        details: { recipeId: 'recipe-001', zone: 'production-a' },
        outcome: 'success' as const,
        severity: 'high' as const,
      };

      const result = AuditEventSchema.safeParse(validAuditEvent);
      expect(result.success).toBe(true);
    });
  });

  describe('UserSchema', () => {
    it('should validate correct user data', () => {
      const validUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        username: 'operator1',
        email: 'operator1@example.com',
        roles: ['operator', 'line-supervisor'],
        zones: ['production-line-a', 'warehouse-dock-1'],
        capabilities: ['view-telemetry', 'execute-recipes'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject user with invalid email', () => {
      const invalidUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        username: 'operator1',
        email: 'invalid-email',
        roles: ['operator'],
        zones: ['production-line-a'],
        capabilities: ['view-telemetry'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });
});
