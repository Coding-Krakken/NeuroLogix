import { describe, it, expect } from 'vitest';
import {
  AsrNluService,
  AsrNluRecommendationRequest,
  AsrNluRecommendationRequestSchema,
} from '@/ai/index';
import { SERVICE_STATUS } from '@/constants/index';

function createBaseRequest(): AsrNluRecommendationRequest {
  return AsrNluRecommendationRequestSchema.parse({
    requestId: 'req-allow-001',
    tenantId: 'tenant-a',
    source: 'radio',
    utterance: 'Stop conveyor three',
    receivedAt: new Date('2026-03-10T08:00:00.000Z'),
    inference: {
      transcript: 'stop conveyor three',
      intent: 'stop_conveyor',
      recommendedAction: 'stop_conveyor',
      confidence: 0.94,
      provenance: {
        model: 'nlx-asr-nlu',
        modelVersion: '1.2.0',
        provider: 'internal',
      },
    },
    auditContext: {
      zone: 'warehouse-a',
      actorId: 'operator-7',
      assetId: 'conveyor-3',
    },
  });
}

describe('AsrNluService', () => {
  it('returns allowed recommendation when action is policy-compliant', () => {
    const service = new AsrNluService({
      minConfidence: 0.8,
      blockedActions: ['disable_emergency_stop'],
    });

    const response = service.processRecommendation(createBaseRequest());

    expect(response.mode).toBe('normal');
    expect(response.outcome).toBe('allowed');
    expect(response.recommendation.action).toBe('stop_conveyor');
    expect(response.policyDecision.decision).toBe('allow');
    expect(response.provenance.strategy).toBe('asr_nlu');
  });

  it('vetoes unsafe recommendation when action is policy-blocked', () => {
    const service = new AsrNluService({
      minConfidence: 0.8,
      blockedActions: ['disable_emergency_stop'],
    });

    const request = createBaseRequest();
    request.inference!.recommendedAction = 'disable_emergency_stop';

    const response = service.processRecommendation(request);

    expect(response.mode).toBe('normal');
    expect(response.outcome).toBe('vetoed');
    expect(response.policyDecision.decision).toBe('veto');
    expect(response.policyDecision.reason).toContain('blocked by policy');
  });

  it('falls back to degraded mode when confidence is below threshold', () => {
    const service = new AsrNluService({
      minConfidence: 0.8,
      blockedActions: ['disable_emergency_stop'],
    });

    const request = createBaseRequest();
    request.inference!.confidence = 0.42;

    const response = service.processRecommendation(request);

    expect(response.mode).toBe('degraded');
    expect(response.outcome).toBe('fallback');
    expect(response.recommendation.action).toBe('request_manual_confirmation');
    expect(response.policyDecision.decision).toBe('skipped');
    expect(response.provenance.strategy).toBe('degraded_fallback');
  });

  it('returns deterministic health check contract', () => {
    const service = new AsrNluService({
      serviceName: 'asr-nlu-test',
      serviceVersion: '0.1.1',
      minConfidence: 0.83,
      blockedActions: ['disable_emergency_stop', 'unlock_guard_door'],
    });

    const health = service.healthCheck();

    expect(health.name).toBe('asr-nlu-test');
    expect(health.status).toBe(SERVICE_STATUS.HEALTHY);
    expect(health.version).toBe('0.1.1');
    expect(health.metrics).toEqual({
      minConfidence: 0.83,
      blockedActionsCount: 2,
    });
  });
});