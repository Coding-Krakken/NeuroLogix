import { z } from 'zod';

/**
 * Policy Document Schema
 * Defines the structure of a policy document with Rego rules
 */
export const PolicyDocumentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/), // Semantic versioning
  category: z.enum(['safety', 'security', 'operational', 'compliance', 'quality']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  status: z.enum(['active', 'inactive', 'deprecated']),
  regoRules: z.string(), // The actual Rego policy rules
  metadata: z.object({
    author: z.string(),
    tags: z.array(z.string()).default([]),
    applicableAssets: z.array(z.string()).default([]), // Asset types this policy applies to
    requiredApprovals: z.number().int().min(0).default(0),
    emergencyOverride: z.boolean().default(false),
    expiresAt: z.date().optional(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PolicyDocument = z.infer<typeof PolicyDocumentSchema>;

/**
 * Policy Evaluation Request Schema
 */
export const PolicyEvaluationRequestSchema = z.object({
  requestId: z.string().uuid(),
  action: z.string(), // The action being requested (e.g., "recipe.execute", "capability.install")
  resource: z.string(), // The resource being acted upon
  context: z.record(z.any()), // Additional context data
  subject: z.object({
    userId: z.string(),
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
    zone: z.string().optional(), // Security zone
  }),
  timestamp: z.date(),
});

export type PolicyEvaluationRequest = z.infer<typeof PolicyEvaluationRequestSchema>;

/**
 * Policy Evaluation Result Schema
 */
export const PolicyEvaluationResultSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(['allow', 'deny', 'approval_required']),
  policyMatches: z.array(z.object({
    policyId: z.string().uuid(),
    policyName: z.string(),
    decision: z.enum(['allow', 'deny', 'approval_required']),
    reasoning: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
  })),
  overallReasoning: z.string(),
  approvalWorkflow: z.object({
    required: z.boolean(),
    approvers: z.array(z.string()),
    minimumApprovals: z.number().int().min(0),
    emergencyOverrideEnabled: z.boolean(),
  }).optional(),
  constraints: z.array(z.object({
    type: z.string(),
    description: z.string(),
    parameters: z.record(z.any()),
  })).default([]),
  validUntil: z.date().optional(),
  evaluatedAt: z.date(),
});

export type PolicyEvaluationResult = z.infer<typeof PolicyEvaluationResultSchema>;

/**
 * Approval Request Schema
 */
export const ApprovalRequestSchema = z.object({
  id: z.string().uuid(),
  requestId: z.string().uuid(), // Links to the original policy evaluation request
  action: z.string(),
  resource: z.string(),
  requester: z.object({
    userId: z.string(),
    name: z.string(),
    email: z.string(),
  }),
  approvers: z.array(z.object({
    userId: z.string(),
    name: z.string(),
    email: z.string(),
    required: z.boolean().default(true),
  })),
  minimumApprovals: z.number().int().min(1),
  currentApprovals: z.array(z.object({
    approverId: z.string(),
    decision: z.enum(['approved', 'rejected']),
    reasoning: z.string().optional(),
    timestamp: z.date(),
  })).default([]),
  status: z.enum(['pending', 'approved', 'rejected', 'expired', 'cancelled']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  emergencyOverride: z.object({
    enabled: z.boolean(),
    usedBy: z.string().optional(),
    reasoning: z.string().optional(),
    timestamp: z.date().optional(),
  }).optional(),
  context: z.record(z.any()),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;

/**
 * Policy Violation Schema
 */
export const PolicyViolationSchema = z.object({
  id: z.string().uuid(),
  policyId: z.string().uuid(),
  policyName: z.string(),
  violationType: z.enum(['denied_action', 'constraint_violation', 'unauthorized_access', 'safety_breach']),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  action: z.string(),
  resource: z.string(),
  subject: z.object({
    userId: z.string(),
    roles: z.array(z.string()),
  }),
  context: z.record(z.any()),
  description: z.string(),
  remediation: z.string().optional(),
  acknowledged: z.boolean().default(false),
  acknowledgedBy: z.string().optional(),
  acknowledgedAt: z.date().optional(),
  createdAt: z.date(),
});

export type PolicyViolation = z.infer<typeof PolicyViolationSchema>;

/**
 * Policy Engine Configuration Schema
 */
export const PolicyEngineConfigSchema = z.object({
  opaEndpoint: z.string().url().optional(),
  enableLocalEvaluation: z.boolean().default(true),
  defaultDecision: z.enum(['deny', 'allow']).default('deny'),
  cacheEnabled: z.boolean().default(true),
  cacheTtlMinutes: z.number().int().min(1).max(1440).default(60), // 1 min to 24 hours
  auditEnabled: z.boolean().default(true),
  emergencyMode: z.object({
    enabled: z.boolean().default(false),
    allowedUsers: z.array(z.string()).default([]),
    bypassPolicies: z.boolean().default(false),
  }),
  notifications: z.object({
    enabled: z.boolean().default(true),
    channels: z.array(z.enum(['email', 'slack', 'teams', 'sms'])).default(['email']),
    criticalViolationAlert: z.boolean().default(true),
  }),
});

export type PolicyEngineConfig = z.infer<typeof PolicyEngineConfigSchema>;

/**
 * Query schemas for policy operations
 */
export const PolicyQuerySchema = z.object({
  category: z.enum(['safety', 'security', 'operational', 'compliance', 'quality']).optional(),
  status: z.enum(['active', 'inactive', 'deprecated']).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'priority', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type PolicyQuery = z.infer<typeof PolicyQuerySchema>;

export const ApprovalQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'expired', 'cancelled']).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  approverId: z.string().optional(),
  requesterId: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['priority', 'createdAt', 'expiresAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ApprovalQuery = z.infer<typeof ApprovalQuerySchema>;

export const ViolationQuerySchema = z.object({
  policyId: z.string().uuid().optional(),
  violationType: z.enum(['denied_action', 'constraint_violation', 'unauthorized_access', 'safety_breach']).optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  acknowledged: z.boolean().optional(),
  userId: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['severity', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ViolationQuery = z.infer<typeof ViolationQuerySchema>;

/**
 * Policy Engine Statistics Schema
 */
export const PolicyStatisticsSchema = z.object({
  totalPolicies: z.number().int().min(0),
  policiesByCategory: z.record(z.number().int().min(0)),
  policiesByStatus: z.record(z.number().int().min(0)),
  evaluationsLast24h: z.number().int().min(0),
  decisionsLast24h: z.object({
    allow: z.number().int().min(0),
    deny: z.number().int().min(0),
    approval_required: z.number().int().min(0),
  }),
  violationsLast24h: z.number().int().min(0),
  violationsBySeverity: z.record(z.number().int().min(0)),
  pendingApprovals: z.number().int().min(0),
  averageEvaluationTimeMs: z.number().min(0),
  cacheHitRate: z.number().min(0).max(100),
});

export type PolicyStatistics = z.infer<typeof PolicyStatisticsSchema>;