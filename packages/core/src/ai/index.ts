import { z } from 'zod';
import { SERVICE_STATUS } from '../constants/index.js';
import type { ServiceHealth } from '../types/index.js';

export const AsrNluProvenanceSchema = z.object({
  model: z.string().min(1),
  modelVersion: z.string().min(1),
  provider: z.string().min(1).optional(),
});

export const AsrNluInferenceSchema = z.object({
  transcript: z.string().min(1),
  intent: z.string().min(1),
  entities: z.record(z.string(), z.string()).optional(),
  recommendedAction: z.string().min(1),
  confidence: z.number().min(0).max(1),
  provenance: AsrNluProvenanceSchema,
});

export const AsrNluAuditContextSchema = z.object({
  zone: z.string().min(1),
  actorId: z.string().min(1).optional(),
  assetId: z.string().min(1).optional(),
});

export const AsrNluRecommendationRequestSchema = z.object({
  requestId: z.string().min(1),
  tenantId: z.string().min(1),
  source: z.enum(['radio', 'voice_terminal']),
  utterance: z.string().min(1),
  receivedAt: z.date(),
  inference: AsrNluInferenceSchema.optional(),
  auditContext: AsrNluAuditContextSchema,
});

export const AsrNluPolicyDecisionSchema = z.object({
  evaluated: z.boolean(),
  policyId: z.string().min(1),
  decision: z.enum(['allow', 'veto', 'skipped']),
  reason: z.string().min(1),
});

export const AsrNluRecommendationSchema = z.object({
  action: z.string().min(1),
  reason: z.string().min(1),
});

export const AsrNluRecommendationResponseSchema = z.object({
  requestId: z.string().min(1),
  tenantId: z.string().min(1),
  mode: z.enum(['normal', 'degraded']),
  outcome: z.enum(['allowed', 'vetoed', 'fallback']),
  confidence: z.number().min(0).max(1),
  recommendation: AsrNluRecommendationSchema,
  policyDecision: AsrNluPolicyDecisionSchema,
  provenance: AsrNluProvenanceSchema.extend({
    strategy: z.enum(['asr_nlu', 'degraded_fallback']),
  }),
  auditContext: AsrNluAuditContextSchema,
  processedAt: z.date(),
});

export type AsrNluInference = z.infer<typeof AsrNluInferenceSchema>;
export type AsrNluAuditContext = z.infer<typeof AsrNluAuditContextSchema>;
export type AsrNluRecommendationRequest = z.infer<typeof AsrNluRecommendationRequestSchema>;
export type AsrNluPolicyDecision = z.infer<typeof AsrNluPolicyDecisionSchema>;
export type AsrNluRecommendation = z.infer<typeof AsrNluRecommendationSchema>;
export type AsrNluRecommendationResponse = z.infer<typeof AsrNluRecommendationResponseSchema>;

export const AsrNluServiceConfigSchema = z.object({
  serviceName: z.string().min(1).default('asr-nlu-service'),
  serviceVersion: z.string().min(1).default('0.1.0'),
  minConfidence: z.number().min(0).max(1).default(0.75),
  blockedActions: z
    .array(z.string().min(1))
    .default(['disable_emergency_stop', 'override_safety_interlock', 'unlock_guard_door']),
});

export type AsrNluServiceConfig = z.infer<typeof AsrNluServiceConfigSchema>;

export class AsrNluService {
  private readonly config: AsrNluServiceConfig;
  private static readonly POLICY_ID = 'ai.asr_nlu.safety_gate';

  constructor(config: Partial<AsrNluServiceConfig> = {}) {
    this.config = AsrNluServiceConfigSchema.parse(config);
  }

  healthCheck(): ServiceHealth {
    return {
      name: this.config.serviceName,
      status: SERVICE_STATUS.HEALTHY,
      version: this.config.serviceVersion,
      uptime: 0,
      metrics: {
        minConfidence: this.config.minConfidence,
        blockedActionsCount: this.config.blockedActions.length,
      },
      timestamp: new Date(),
    };
  }

  processRecommendation(input: AsrNluRecommendationRequest): AsrNluRecommendationResponse {
    const request = AsrNluRecommendationRequestSchema.parse(input);

    if (!request.inference || request.inference.confidence < this.config.minConfidence) {
      const degradedReason =
        request.inference == null ? 'Missing inference payload' : 'Inference confidence below threshold';

      return AsrNluRecommendationResponseSchema.parse({
        requestId: request.requestId,
        tenantId: request.tenantId,
        mode: 'degraded',
        outcome: 'fallback',
        confidence: request.inference?.confidence ?? 0,
        recommendation: {
          action: 'request_manual_confirmation',
          reason: degradedReason,
        },
        policyDecision: {
          evaluated: false,
          policyId: AsrNluService.POLICY_ID,
          decision: 'skipped',
          reason: 'Policy evaluation skipped for degraded fallback mode',
        },
        provenance: {
          model: request.inference?.provenance.model ?? 'degraded-fallback',
          modelVersion: request.inference?.provenance.modelVersion ?? '1.0.0',
          provider: request.inference?.provenance.provider,
          strategy: 'degraded_fallback',
        },
        auditContext: request.auditContext,
        processedAt: new Date(),
      });
    }

    const action = request.inference.recommendedAction;
    const isBlockedAction = this.config.blockedActions.includes(action);

    if (isBlockedAction) {
      return AsrNluRecommendationResponseSchema.parse({
        requestId: request.requestId,
        tenantId: request.tenantId,
        mode: 'normal',
        outcome: 'vetoed',
        confidence: request.inference.confidence,
        recommendation: {
          action,
          reason: 'Recommendation vetoed by deterministic policy gate',
        },
        policyDecision: {
          evaluated: true,
          policyId: AsrNluService.POLICY_ID,
          decision: 'veto',
          reason: `Action '${action}' is blocked by policy`,
        },
        provenance: {
          ...request.inference.provenance,
          strategy: 'asr_nlu',
        },
        auditContext: request.auditContext,
        processedAt: new Date(),
      });
    }

    return AsrNluRecommendationResponseSchema.parse({
      requestId: request.requestId,
      tenantId: request.tenantId,
      mode: 'normal',
      outcome: 'allowed',
      confidence: request.inference.confidence,
      recommendation: {
        action,
        reason: 'Recommendation allowed by deterministic policy gate',
      },
      policyDecision: {
        evaluated: true,
        policyId: AsrNluService.POLICY_ID,
        decision: 'allow',
        reason: 'No policy violations detected',
      },
      provenance: {
        ...request.inference.provenance,
        strategy: 'asr_nlu',
      },
      auditContext: request.auditContext,
      processedAt: new Date(),
    });
  }
}