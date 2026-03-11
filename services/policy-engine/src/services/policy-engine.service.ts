import {
  PolicyDocument,
  PolicyEvaluationRequest,
  PolicyEvaluationResult,
  ApprovalRequest,
  PolicyViolation,
  PolicyEngineConfig,
  PolicyQuery,
  ApprovalQuery,
  ViolationQuery,
  PolicyStatistics,
  PolicyDocumentSchema,
  PolicyEvaluationRequestSchema,
  PolicyEvaluationResultSchema,
  ApprovalRequestSchema,
  PolicyViolationSchema,
  PolicyEngineConfigSchema,
  PolicyQuerySchema,
  ApprovalQuerySchema,
  ViolationQuerySchema,
} from '../types/index.js';
import {
  ValidationError,
  AssetNotFoundError,
  InternalServerError,
  PolicyViolationError,
  generateId,
  logAuditEvent,
} from '@neurologix/core';
import {
  createAuditLogger,
  createOPAAuthorizer,
  type AuditChainEntry,
  type AuditEvent,
  type AuditIntegrityReport,
  type OPAAuthorizationResult,
  type OPAAuthorizer,
  type AuditQueryCriteria,
  type ServiceIdentity,
} from '@neurologix/security-core';
import logger from '@neurologix/core/logger';
import { z } from 'zod';

/**
 * Enterprise-grade Policy Engine Service
 *
 * This service implements OPA/Rego-based policy evaluation with comprehensive
 * approval workflows, safety guardrails, and audit logging for industrial
 * control system environments.
 *
 * Key Features:
 * - Policy document management with version control
 * - Real-time policy evaluation with caching
 * - Multi-level approval workflows
 * - Emergency override capabilities
 * - Comprehensive audit logging
 * - Safety-critical decision making
 * - Integration with OPA (Open Policy Agent)
 */
export class PolicyEngineService {
  private static readonly OPA_POLICY_ID = '00000000-0000-0000-0000-000000000012';
  private policies: Map<string, PolicyDocument> = new Map();
  private approvalRequests: Map<string, ApprovalRequest> = new Map();
  private violations: Map<string, PolicyViolation> = new Map();
  private evaluationCache: Map<string, { result: PolicyEvaluationResult; expiresAt: Date }> =
    new Map();
  private config: PolicyEngineConfig;
  private readonly securityAuditLogger = createAuditLogger();
  private readonly serviceIdentity: ServiceIdentity = { serviceId: 'policy-engine' };
  private readonly opaAuthorizer: OPAAuthorizer | null;
  private evaluationMetrics: {
    evaluationsLast24h: number;
    decisionsLast24h: { allow: number; deny: number; approval_required: number };
    violationsLast24h: number;
    totalEvaluationTime: number;
    cacheHits: number;
    cacheMisses: number;
  };

  constructor(config: Partial<PolicyEngineConfig> = {}) {
    this.config = PolicyEngineConfigSchema.parse(config);
    this.opaAuthorizer = this.config.opaEndpoint
      ? createOPAAuthorizer({
          endpoint: this.config.opaEndpoint,
          serviceId: this.serviceIdentity.serviceId,
        })
      : null;
    this.evaluationMetrics = {
      evaluationsLast24h: 0,
      decisionsLast24h: { allow: 0, deny: 0, approval_required: 0 },
      violationsLast24h: 0,
      totalEvaluationTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };

    // Initialize with default safety policies
    this.initializeDefaultPolicies();

    logger.info('Policy Engine Service initialized', {
      service: 'policy-engine',
      config: this.config,
    });
  }

  /**
   * Create a new policy document
   */
  async createPolicy(
    policyData: Omit<PolicyDocument, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PolicyDocument> {
    try {
      const policy: PolicyDocument = PolicyDocumentSchema.parse({
        ...policyData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Validate Rego rules syntax (basic validation)
      this.validateRegoSyntax(policy.regoRules);

      this.policies.set(policy.id, policy);

      this.recordSecurityAudit({
        eventType: 'POLICY_CREATE',
        action: 'policy_create',
        resource: `policy/${policy.id}`,
        outcome: 'SUCCESS',
        description: `Policy ${policy.name} created in policy-engine`,
        severity: 'medium',
        metadata: {
          policyId: policy.id,
          policyName: policy.name,
          category: policy.category,
          priority: policy.priority,
        },
      });

      return policy;
    } catch (error) {
      throw new ValidationError('Failed to create policy', {
        policyData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Update an existing policy document
   */
  async updatePolicy(
    policyId: string,
    updates: Partial<Omit<PolicyDocument, 'id' | 'createdAt'>>
  ): Promise<PolicyDocument> {
    const existingPolicy = this.policies.get(policyId);
    if (!existingPolicy) {
      throw new AssetNotFoundError(policyId, { resource: 'policy' });
    }

    try {
      const updatedPolicy: PolicyDocument = PolicyDocumentSchema.parse({
        ...existingPolicy,
        ...updates,
        id: policyId,
        updatedAt: new Date(),
      });

      if (updates.regoRules) {
        this.validateRegoSyntax(updatedPolicy.regoRules);
      }

      this.policies.set(policyId, updatedPolicy);

      // Clear related cache entries
      this.clearPolicyCache(policyId);

      this.recordSecurityAudit({
        eventType: 'POLICY_UPDATE',
        action: 'policy_update',
        resource: `policy/${policyId}`,
        outcome: 'SUCCESS',
        description: `Policy ${updatedPolicy.name} updated in policy-engine`,
        severity: 'medium',
        metadata: {
          policyId,
          policyName: updatedPolicy.name,
          changes: Object.keys(updates),
        },
      });

      return updatedPolicy;
    } catch (error) {
      throw new ValidationError('Failed to update policy', {
        policyId,
        updates,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Delete a policy document
   */
  async deletePolicy(policyId: string): Promise<void> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new AssetNotFoundError(policyId, { resource: 'policy' });
    }

    // Check if policy is referenced in active approval requests
    const activeReferences = Array.from(this.approvalRequests.values()).filter(
      request => request.status === 'pending'
    );

    if (activeReferences.length > 0) {
      throw new ValidationError('Cannot delete policy with active approval requests', {
        policyId,
        activeReferences: activeReferences.length,
      });
    }

    this.policies.delete(policyId);
    this.clearPolicyCache(policyId);

    this.recordSecurityAudit({
      eventType: 'POLICY_DELETE',
      action: 'policy_delete',
      resource: `policy/${policyId}`,
      outcome: 'SUCCESS',
      description: `Policy ${policy.name} deleted from policy-engine`,
      severity: 'high',
      metadata: { policyId, policyName: policy.name },
    });
  }

  /**
   * Get a policy document by ID
   */
  async getPolicy(policyId: string): Promise<PolicyDocument | null> {
    return this.policies.get(policyId) || null;
  }

  /**
   * Query policies with filtering and pagination
   */
  async queryPolicies(query: PolicyQuery): Promise<{
    policies: PolicyDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const validatedQuery = PolicyQuerySchema.parse(query);
    let filteredPolicies = Array.from(this.policies.values());

    // Apply filters
    if (validatedQuery.category) {
      filteredPolicies = filteredPolicies.filter(p => p.category === validatedQuery.category);
    }
    if (validatedQuery.status) {
      filteredPolicies = filteredPolicies.filter(p => p.status === validatedQuery.status);
    }
    if (validatedQuery.priority) {
      filteredPolicies = filteredPolicies.filter(p => p.priority === validatedQuery.priority);
    }
    if (validatedQuery.tags && validatedQuery.tags.length > 0) {
      filteredPolicies = filteredPolicies.filter(p =>
        validatedQuery.tags!.some(tag => p.metadata.tags.includes(tag))
      );
    }
    if (validatedQuery.search) {
      const searchTerm = validatedQuery.search.toLowerCase();
      filteredPolicies = filteredPolicies.filter(
        p =>
          p.name.toLowerCase().includes(searchTerm) ||
          (p.description && p.description.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    filteredPolicies.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (validatedQuery.sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'createdAt':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        case 'updatedAt':
          aValue = a.updatedAt;
          bValue = b.updatedAt;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (validatedQuery.sortOrder === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

    // Apply pagination
    const total = filteredPolicies.length;
    const totalPages = Math.ceil(total / validatedQuery.limit);
    const startIndex = (validatedQuery.page - 1) * validatedQuery.limit;
    const policies = filteredPolicies.slice(startIndex, startIndex + validatedQuery.limit);

    return {
      policies,
      total,
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      totalPages,
    };
  }

  /**
   * Evaluate a request against all applicable policies
   */
  async evaluateRequest(request: PolicyEvaluationRequest): Promise<PolicyEvaluationResult> {
    const validatedRequest = PolicyEvaluationRequestSchema.parse(request);
    const startTime = Date.now();

    try {
      // Check cache first
      if (this.config.cacheEnabled) {
        const cacheKey = this.getCacheKey(validatedRequest);
        const cached = this.evaluationCache.get(cacheKey);
        if (cached && cached.expiresAt > new Date()) {
          this.evaluationMetrics.cacheHits++;
          return cached.result;
        }
        this.evaluationMetrics.cacheMisses++;
      }

      // Check emergency mode
      if (this.config.emergencyMode.enabled) {
        if (this.config.emergencyMode.allowedUsers.includes(validatedRequest.subject.userId)) {
          const emergencyResult: PolicyEvaluationResult = {
            requestId: validatedRequest.requestId,
            decision: 'allow',
            policyMatches: [],
            overallReasoning: 'Emergency mode override - bypassing normal policy evaluation',
            constraints: [],
            evaluatedAt: new Date(),
          };

          this.recordSecurityAudit({
            eventType: 'POLICY_EVALUATION',
            action: 'policy_evaluation_emergency',
            resource: validatedRequest.resource,
            outcome: 'SUCCESS',
            description: 'Emergency mode override bypassed normal policy evaluation',
            severity: 'critical',
            userId: validatedRequest.subject.userId,
            metadata: {
              action: validatedRequest.action,
              decision: 'allow',
              emergencyMode: true,
            },
          });

          return emergencyResult;
        }
      }

      if (!this.config.enableLocalEvaluation && !this.opaAuthorizer) {
        throw new InternalServerError('No policy evaluation path configured', {
          reason: 'Local evaluation disabled and OPA endpoint not configured',
          requestId: validatedRequest.requestId,
        });
      }

      if (!this.config.enableLocalEvaluation && this.opaAuthorizer) {
        const externalDecision = await this.evaluateWithOpaAuthorizer(validatedRequest, false);
        if (!externalDecision) {
          throw new InternalServerError('OPA authorizer did not return a decision', {
            requestId: validatedRequest.requestId,
          });
        }
        const policyMatches = [this.toOpaPolicyMatch(externalDecision)];
        const result: PolicyEvaluationResult = PolicyEvaluationResultSchema.parse({
          requestId: validatedRequest.requestId,
          decision: externalDecision.decision,
          policyMatches,
          overallReasoning: this.generateOverallReasoning(externalDecision.decision, policyMatches),
          approvalWorkflow:
            externalDecision.decision === 'approval_required'
              ? {
                  required: true,
                  approvers: [],
                  minimumApprovals: 1,
                  emergencyOverrideEnabled: false,
                }
              : undefined,
          constraints: [],
          validUntil: this.config.cacheEnabled
            ? new Date(Date.now() + this.config.cacheTtlMinutes * 60 * 1000)
            : undefined,
          evaluatedAt: new Date(),
        });

        if (result.decision === 'deny') {
          await this.recordViolation(validatedRequest, result.policyMatches);
        }

        const evaluationTime = Date.now() - startTime;
        this.evaluationMetrics.evaluationsLast24h++;
        this.evaluationMetrics.decisionsLast24h[result.decision]++;
        this.evaluationMetrics.totalEvaluationTime += evaluationTime;

        this.recordSecurityAudit({
          eventType: 'POLICY_EVALUATION',
          action: 'policy_evaluation',
          resource: validatedRequest.resource,
          outcome: result.decision === 'allow' ? 'SUCCESS' : 'BLOCKED',
          description: `Policy evaluation completed with ${result.decision} decision`,
          severity:
            result.decision === 'deny'
              ? 'high'
              : result.decision === 'approval_required'
                ? 'medium'
                : 'low',
          userId: validatedRequest.subject.userId,
          metadata: {
            action: validatedRequest.action,
            decision: result.decision,
            policiesEvaluated: policyMatches.length,
            evaluationTimeMs: evaluationTime,
            opaIntegrated: true,
            opaDecision: externalDecision.decision,
          },
        });

        return result;
      }

      const externalDecision = this.opaAuthorizer
        ? await this.evaluateWithOpaAuthorizer(validatedRequest, true)
        : null;

      // Get applicable policies
      const applicablePolicies = this.getApplicablePolicies(validatedRequest);
      const policyMatches: PolicyEvaluationResult['policyMatches'] = [];
      let overallDecision: 'allow' | 'deny' | 'approval_required' = 'allow'; // Start optimistic
      let criticalDenyFound = false;
      let requiresApproval = false;
      const approvers: string[] = [];
      let minApprovals = 0;
      let emergencyOverrideEnabled = false;

      // Evaluate each applicable policy
      for (const policy of applicablePolicies) {
        if (policy.status !== 'active') continue;

        const policyResult = await this.evaluatePolicy(policy, validatedRequest);
        policyMatches.push({
          policyId: policy.id,
          policyName: policy.name,
          decision: policyResult.decision,
          reasoning: policyResult.reasoning,
          priority: policy.priority,
        });

        // Apply policy decision logic
        if (policyResult.decision === 'deny' && policy.priority === 'critical') {
          criticalDenyFound = true;
          overallDecision = 'deny';
          break; // Critical deny overrides everything
        } else if (policyResult.decision === 'approval_required') {
          requiresApproval = true;
          if (policy.metadata.requiredApprovals > minApprovals) {
            minApprovals = policy.metadata.requiredApprovals;
          }
          if (policy.metadata.emergencyOverride) {
            emergencyOverrideEnabled = true;
          }
        } else if (policyResult.decision === 'deny') {
          overallDecision = this.config.defaultDecision; // Use configured default for non-critical denies
        }
      }

      // Final decision logic
      if (criticalDenyFound) {
        overallDecision = 'deny';
      } else if (requiresApproval) {
        overallDecision = 'approval_required';
      } else if (applicablePolicies.length === 0) {
        // No policies found, use default
        overallDecision = this.config.defaultDecision;
      }
      // Otherwise keep 'allow' from initialization

      if (externalDecision) {
        policyMatches.push(this.toOpaPolicyMatch(externalDecision));
        if (externalDecision.decision === 'approval_required') {
          requiresApproval = true;
          minApprovals = Math.max(minApprovals, 1);
        }
        overallDecision = this.mergeDecisions(overallDecision, externalDecision.decision);
      }

      const result: PolicyEvaluationResult = PolicyEvaluationResultSchema.parse({
        requestId: validatedRequest.requestId,
        decision: overallDecision,
        policyMatches,
        overallReasoning: this.generateOverallReasoning(overallDecision, policyMatches),
        approvalWorkflow: requiresApproval
          ? {
              required: true,
              approvers,
              minimumApprovals: minApprovals,
              emergencyOverrideEnabled,
            }
          : undefined,
        constraints: this.extractConstraints(policyMatches),
        validUntil: this.config.cacheEnabled
          ? new Date(Date.now() + this.config.cacheTtlMinutes * 60 * 1000)
          : undefined,
        evaluatedAt: new Date(),
      });

      // Cache the result
      if (this.config.cacheEnabled) {
        const cacheKey = this.getCacheKey(validatedRequest);
        this.evaluationCache.set(cacheKey, {
          result,
          expiresAt: new Date(Date.now() + this.config.cacheTtlMinutes * 60 * 1000),
        });
      }

      // Record violation if denied
      if (overallDecision === 'deny') {
        await this.recordViolation(validatedRequest, policyMatches);
      }

      // Update metrics
      const evaluationTime = Date.now() - startTime;
      this.evaluationMetrics.evaluationsLast24h++;
      this.evaluationMetrics.decisionsLast24h[overallDecision]++;
      this.evaluationMetrics.totalEvaluationTime += evaluationTime;

      this.recordSecurityAudit({
        eventType: 'POLICY_EVALUATION',
        action: 'policy_evaluation',
        resource: validatedRequest.resource,
        outcome: overallDecision === 'allow' ? 'SUCCESS' : 'BLOCKED',
        description: `Policy evaluation completed with ${overallDecision} decision`,
        severity:
          overallDecision === 'deny'
            ? 'high'
            : overallDecision === 'approval_required'
              ? 'medium'
              : 'low',
        userId: validatedRequest.subject.userId,
        metadata: {
          action: validatedRequest.action,
          decision: overallDecision,
          policiesEvaluated: applicablePolicies.length,
          evaluationTimeMs: evaluationTime,
          opaIntegrated: Boolean(externalDecision),
          opaDecision: externalDecision?.decision,
        },
      });

      return result;
    } catch (error) {
      const evaluationTime = Date.now() - startTime;
      this.evaluationMetrics.totalEvaluationTime += evaluationTime;

      this.recordSecurityAudit({
        eventType: 'POLICY_EVALUATION_ERROR',
        action: 'policy_evaluation',
        resource: validatedRequest.resource,
        outcome: 'FAILURE',
        description: 'Policy evaluation failed before a decision could be finalized',
        severity: 'high',
        userId: validatedRequest.subject.userId,
        metadata: {
          action: validatedRequest.action,
          error: error instanceof Error ? error.message : String(error),
          evaluationTimeMs: evaluationTime,
        },
      });

      throw new InternalServerError('Policy evaluation failed', {
        request: validatedRequest,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get policy engine statistics
   */
  async getStatistics(): Promise<PolicyStatistics> {
    const policies = Array.from(this.policies.values());
    const violations = Array.from(this.violations.values());
    const approvals = Array.from(this.approvalRequests.values());

    const policiesByCategory = policies.reduce(
      (acc, policy) => {
        acc[policy.category] = (acc[policy.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const policiesByStatus = policies.reduce(
      (acc, policy) => {
        acc[policy.status] = (acc[policy.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const violationsBySeverity = violations.reduce(
      (acc, violation) => {
        acc[violation.severity] = (acc[violation.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const cacheHitRate =
      this.evaluationMetrics.cacheHits + this.evaluationMetrics.cacheMisses > 0
        ? (this.evaluationMetrics.cacheHits /
            (this.evaluationMetrics.cacheHits + this.evaluationMetrics.cacheMisses)) *
          100
        : 0;

    const averageEvaluationTime =
      this.evaluationMetrics.evaluationsLast24h > 0
        ? this.evaluationMetrics.totalEvaluationTime / this.evaluationMetrics.evaluationsLast24h
        : 0;

    return {
      totalPolicies: policies.length,
      policiesByCategory,
      policiesByStatus,
      evaluationsLast24h: this.evaluationMetrics.evaluationsLast24h,
      decisionsLast24h: this.evaluationMetrics.decisionsLast24h,
      violationsLast24h: this.evaluationMetrics.violationsLast24h,
      violationsBySeverity,
      pendingApprovals: approvals.filter(a => a.status === 'pending').length,
      averageEvaluationTimeMs: averageEvaluationTime,
      cacheHitRate,
    };
  }

  /**
   * Retrieve immutable audit trail entries recorded by the policy engine.
   */
  getSecurityAuditTrail(criteria: AuditQueryCriteria = {}): AuditChainEntry[] {
    return this.securityAuditLogger.queryEntries(criteria);
  }

  /**
   * Verify the immutable policy-engine audit trail hash chain.
   */
  verifySecurityAuditTrail(): AuditIntegrityReport {
    return this.securityAuditLogger.getIntegrityReport();
  }

  // Private helper methods

  private async evaluateWithOpaAuthorizer(
    request: PolicyEvaluationRequest,
    allowLocalFallback: boolean
  ): Promise<OPAAuthorizationResult | null> {
    if (!this.opaAuthorizer) {
      throw new InternalServerError('OPA authorizer is not configured', {
        requestId: request.requestId,
      });
    }

    try {
      return await this.opaAuthorizer.authorize({
        action: request.action,
        resource: request.resource,
        context: request.context,
        subject: request.subject,
        timestamp: request.timestamp,
      });
    } catch (error) {
      if (allowLocalFallback) {
        this.recordSecurityAudit({
          eventType: 'POLICY_AUTHZ_FALLBACK',
          action: 'policy_evaluation',
          resource: request.resource,
          outcome: 'FAILURE',
          description: 'OPA authorizer unavailable - falling back to local evaluation',
          severity: 'high',
          userId: request.subject.userId,
          metadata: {
            action: request.action,
            error: error instanceof Error ? error.message : String(error),
          },
        });

        return null;
      }

      throw new InternalServerError('OPA authorizer evaluation failed', {
        requestId: request.requestId,
        action: request.action,
        resource: request.resource,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private toOpaPolicyMatch(
    decision: OPAAuthorizationResult
  ): PolicyEvaluationResult['policyMatches'][number] {
    return {
      policyId: PolicyEngineService.OPA_POLICY_ID,
      policyName: 'OPA Authorizer',
      decision: decision.decision,
      reasoning: decision.reason,
      priority:
        decision.decision === 'deny'
          ? 'critical'
          : decision.decision === 'approval_required'
            ? 'high'
            : 'low',
    };
  }

  private mergeDecisions(
    localDecision: PolicyEvaluationResult['decision'],
    opaDecision: PolicyEvaluationResult['decision']
  ): PolicyEvaluationResult['decision'] {
    if (localDecision === 'deny' || opaDecision === 'deny') {
      return 'deny';
    }

    if (localDecision === 'approval_required' || opaDecision === 'approval_required') {
      return 'approval_required';
    }

    return 'allow';
  }

  private initializeDefaultPolicies(): void {
    // Safety-critical default policies
    const defaultPolicies = [
      {
        name: 'Emergency Stop Override Protection',
        description: 'Prevents bypassing emergency stop systems',
        version: '1.0.0',
        category: 'safety' as const,
        priority: 'critical' as const,
        status: 'active' as const,
        regoRules: `
          package safety.emergency_stop
          
          default allow = false
          
          allow {
            input.action != "emergency_stop.override"
          }
          
          deny[{"reason": "Emergency stop override requires critical safety approval"}] {
            input.action == "emergency_stop.override"
            not input.subject.permissions[_] == "emergency_stop.override"
          }
        `,
        metadata: {
          author: 'system',
          tags: ['safety', 'emergency', 'critical'],
          applicableAssets: ['*'],
          requiredApprovals: 2,
          emergencyOverride: false,
        },
      },
      {
        name: 'PLC Interlock Protection',
        description: 'Ensures all control actions respect PLC interlocks',
        version: '1.0.0',
        category: 'safety' as const,
        priority: 'critical' as const,
        status: 'active' as const,
        regoRules: `
          package safety.plc_interlocks
          
          default allow = true
          
          deny[{"reason": "PLC interlock active - action blocked for safety"}] {
            input.action == "recipe.execute"
            input.context.plc_interlocks[_].active == true
          }
        `,
        metadata: {
          author: 'system',
          tags: ['safety', 'plc', 'interlocks'],
          applicableAssets: ['plc', 'conveyor', 'robot'],
          requiredApprovals: 1,
          emergencyOverride: true,
        },
      },
    ];

    for (const policyData of defaultPolicies) {
      const policy: PolicyDocument = {
        ...policyData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.policies.set(policy.id, policy);
    }
  }

  private validateRegoSyntax(regoRules: string): void {
    // Basic Rego syntax validation
    if (!regoRules.includes('package ')) {
      throw new Error('Rego rules must include a package declaration');
    }

    // Additional syntax checks could be added here
    // In a production environment, this would use the OPA Go library
    // or call out to an OPA service for proper validation
  }

  private getApplicablePolicies(request: PolicyEvaluationRequest): PolicyDocument[] {
    return Array.from(this.policies.values()).filter(policy => {
      if (policy.status !== 'active') return false;

      // Check if policy applies to the requested asset type
      if (
        policy.metadata.applicableAssets.length > 0 &&
        !policy.metadata.applicableAssets.includes('*')
      ) {
        const assetType = this.extractAssetType(request.resource);
        if (!policy.metadata.applicableAssets.includes(assetType)) {
          return false;
        }
      }

      // Check if policy has expired
      if (policy.metadata.expiresAt && policy.metadata.expiresAt < new Date()) {
        return false;
      }

      return true;
    });
  }

  private async evaluatePolicy(
    policy: PolicyDocument,
    request: PolicyEvaluationRequest
  ): Promise<{ decision: 'allow' | 'deny' | 'approval_required'; reasoning: string }> {
    // In a production environment, this would use OPA for Rego evaluation
    // For now, we'll simulate policy evaluation based on the policy content

    try {
      // Simulate Rego evaluation
      if (
        policy.regoRules.includes('emergency_stop.override') &&
        request.action === 'emergency_stop.override'
      ) {
        return {
          decision: policy.metadata.requiredApprovals > 0 ? 'approval_required' : 'deny',
          reasoning: 'Emergency stop override requires special authorization',
        };
      }

      // Check for approval_required pattern in Rego rules
      if (policy.regoRules.includes('approval_required')) {
        // More flexible pattern matching for different quote styles
        const actionPatterns = [
          `input.action == "${request.action}"`,
          `input.action == '${request.action}'`,
          `input.action=="${request.action}"`,
          `input.action=='${request.action}'`,
        ];

        if (actionPatterns.some(pattern => policy.regoRules.includes(pattern))) {
          return {
            decision: 'approval_required',
            reasoning: `Action ${request.action} requires approval as per policy`,
          };
        }
      }

      if (
        policy.regoRules.includes('plc_interlocks') &&
        request.context.plc_interlocks &&
        Array.isArray(request.context.plc_interlocks) &&
        request.context.plc_interlocks.some((interlock: any) => interlock.active)
      ) {
        return {
          decision: 'deny',
          reasoning: 'PLC interlock is active - blocking action for safety',
        };
      }

      // Default allow for other cases
      return {
        decision: 'allow',
        reasoning: `Policy ${policy.name} evaluated successfully - no restrictions found`,
      };
    } catch (error) {
      // If evaluation fails, default to deny for safety
      return {
        decision: 'deny',
        reasoning: `Policy evaluation error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private generateOverallReasoning(
    decision: 'allow' | 'deny' | 'approval_required',
    policyMatches: PolicyEvaluationResult['policyMatches']
  ): string {
    const denyMatches = policyMatches.filter(m => m.decision === 'deny');
    const approvalMatches = policyMatches.filter(m => m.decision === 'approval_required');

    if (decision === 'deny') {
      const criticalDenies = denyMatches.filter(m => m.priority === 'critical');
      if (criticalDenies.length > 0) {
        return `Request denied due to critical safety policy: ${criticalDenies[0].reasoning}`;
      }
      return `Request denied by policy evaluation: ${denyMatches[0]?.reasoning || 'Security restrictions apply'}`;
    }

    if (decision === 'approval_required') {
      return `Request requires approval due to policy restrictions: ${approvalMatches.map(m => m.policyName).join(', ')}`;
    }

    return 'Request approved - all applicable policies allow this action';
  }

  private extractConstraints(
    policyMatches: PolicyEvaluationResult['policyMatches']
  ): PolicyEvaluationResult['constraints'] {
    // Extract constraints from policy evaluation results
    // This would be more sophisticated in a real implementation
    return [];
  }

  private getCacheKey(request: PolicyEvaluationRequest): string {
    return `${request.action}:${request.resource}:${request.subject.userId}:${JSON.stringify(request.context)}`;
  }

  private clearPolicyCache(policyId: string): void {
    // Clear cache entries that might be affected by this policy change
    // In a production system, this would be more sophisticated
    this.evaluationCache.clear();
  }

  private extractAssetType(resource: string): string {
    // Extract asset type from resource string (e.g., "plc/line1/conveyor" -> "plc")
    return resource.split('/')[0];
  }

  private async recordViolation(
    request: PolicyEvaluationRequest,
    policyMatches: PolicyEvaluationResult['policyMatches']
  ): Promise<void> {
    const denyMatches = policyMatches.filter(m => m.decision === 'deny');

    for (const match of denyMatches) {
      const violation: PolicyViolation = PolicyViolationSchema.parse({
        id: generateId(),
        policyId: match.policyId,
        policyName: match.policyName,
        violationType: 'denied_action',
        severity: match.priority,
        action: request.action,
        resource: request.resource,
        subject: {
          userId: request.subject.userId,
          roles: request.subject.roles,
        },
        context: request.context,
        description: match.reasoning,
        createdAt: new Date(),
      });

      this.violations.set(violation.id, violation);
      this.evaluationMetrics.violationsLast24h++;

      this.recordSecurityAudit({
        eventType: 'POLICY_VIOLATION',
        action: 'policy_violation',
        resource: request.resource,
        outcome: 'BLOCKED',
        description: `Policy violation recorded for ${request.action}`,
        severity: 'high',
        userId: request.subject.userId,
        metadata: {
          violationId: violation.id,
          policyId: match.policyId,
          policyName: match.policyName,
          severity: match.priority,
          action: request.action,
        },
      });
    }
  }

  private recordSecurityAudit(event: {
    eventType: string;
    action: string;
    resource: string;
    outcome: AuditEvent['outcome'];
    description: string;
    metadata?: Record<string, unknown>;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
  }): void {
    if (!this.config.auditEnabled) {
      return;
    }

    this.securityAuditLogger.logEvent({
      eventType: event.eventType,
      service: this.serviceIdentity,
      outcome: event.outcome,
      description: event.description,
      metadata: {
        action: event.action,
        resource: event.resource,
        ...event.metadata,
      },
    });

    logAuditEvent({
      action: event.action,
      resource: event.resource,
      userId: event.userId,
      outcome: this.toCoreAuditOutcome(event.outcome),
      details: {
        eventType: event.eventType,
        description: event.description,
        ...event.metadata,
      },
      severity: event.severity,
    });
  }

  private toCoreAuditOutcome(outcome: AuditEvent['outcome']): 'success' | 'failure' | 'partial' {
    switch (outcome) {
      case 'SUCCESS':
        return 'success';
      case 'FAILURE':
        return 'failure';
      case 'BLOCKED':
        return 'partial';
      default:
        return 'partial';
    }
  }
}
