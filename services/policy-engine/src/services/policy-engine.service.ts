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
import { ValidationError, AssetNotFoundError, InternalServerError, PolicyViolationError, generateId, logAuditEvent } from '@neurologix/core';
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
  private policies: Map<string, PolicyDocument> = new Map();
  private approvalRequests: Map<string, ApprovalRequest> = new Map();
  private violations: Map<string, PolicyViolation> = new Map();
  private evaluationCache: Map<string, { result: PolicyEvaluationResult; expiresAt: Date }> = new Map();
  private config: PolicyEngineConfig;
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
  async createPolicy(policyData: Omit<PolicyDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<PolicyDocument> {
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

      logAuditEvent({
        action: 'policy_create',
        resource: `policy/${policy.id}`,
        outcome: 'success',
        details: {
          policyName: policy.name,
          category: policy.category,
          priority: policy.priority,
        },
        severity: 'medium',
      });

      return policy;
    } catch (error) {
      throw new ValidationError(
        'Failed to create policy',
        { policyData, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Update an existing policy document
   */
  async updatePolicy(policyId: string, updates: Partial<Omit<PolicyDocument, 'id' | 'createdAt'>>): Promise<PolicyDocument> {
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

      logAuditEvent({
        action: 'policy_update',
        resource: `policy/${policyId}`,
        outcome: 'success',
        details: {
          policyName: updatedPolicy.name,
          changes: Object.keys(updates),
        },
        severity: 'medium',
      });

      return updatedPolicy;
    } catch (error) {
      throw new ValidationError(
        'Failed to update policy',
        { policyId, updates, error: error instanceof Error ? error.message : String(error) }
      );
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
      throw new ValidationError(
        'Cannot delete policy with active approval requests',
        { policyId, activeReferences: activeReferences.length }
      );
    }

    this.policies.delete(policyId);
    this.clearPolicyCache(policyId);

    logAuditEvent({
      action: 'policy_delete',
      resource: `policy/${policyId}`,
      outcome: 'success',
      details: { policyName: policy.name },
      severity: 'high',
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
      filteredPolicies = filteredPolicies.filter(p => 
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

          logAuditEvent({
            action: 'policy_evaluation_emergency',
            resource: validatedRequest.resource,
            outcome: 'success',
            details: {
              action: validatedRequest.action,
              userId: validatedRequest.subject.userId,
              decision: 'allow',
            },
            severity: 'critical',
          });

          return emergencyResult;
        }
      }

      // Get applicable policies
      const applicablePolicies = this.getApplicablePolicies(validatedRequest);
      const policyMatches: PolicyEvaluationResult['policyMatches'] = [];
      let overallDecision: 'allow' | 'deny' | 'approval_required' = this.config.defaultDecision;
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
        } else if (policyResult.decision === 'allow' && overallDecision !== 'deny') {
          if (!requiresApproval) {
            overallDecision = 'allow';
          }
        }
      }

      // Final decision logic
      if (requiresApproval && overallDecision !== 'deny') {
        overallDecision = 'approval_required';
      }

      const result: PolicyEvaluationResult = PolicyEvaluationResultSchema.parse({
        requestId: validatedRequest.requestId,
        decision: overallDecision,
        policyMatches,
        overallReasoning: this.generateOverallReasoning(overallDecision, policyMatches),
        approvalWorkflow: requiresApproval ? {
          required: true,
          approvers,
          minimumApprovals: minApprovals,
          emergencyOverrideEnabled,
        } : undefined,
        constraints: this.extractConstraints(policyMatches),
        validUntil: this.config.cacheEnabled ? 
          new Date(Date.now() + this.config.cacheTtlMinutes * 60 * 1000) : undefined,
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

      logAuditEvent({
        action: 'policy_evaluation',
        resource: validatedRequest.resource,
        outcome: 'success',
        details: {
          action: validatedRequest.action,
          userId: validatedRequest.subject.userId,
          decision: overallDecision,
          policiesEvaluated: applicablePolicies.length,
          evaluationTimeMs: evaluationTime,
        },
        severity: overallDecision === 'deny' ? 'high' : 'low',
      });

      return result;
    } catch (error) {
      const evaluationTime = Date.now() - startTime;
      this.evaluationMetrics.totalEvaluationTime += evaluationTime;

      logAuditEvent({
        action: 'policy_evaluation',
        resource: validatedRequest.resource,
        outcome: 'failure',
        details: {
          action: validatedRequest.action,
          userId: validatedRequest.subject.userId,
          error: error instanceof Error ? error.message : String(error),
          evaluationTimeMs: evaluationTime,
        },
        severity: 'high',
      });

      throw new InternalServerError(
        'Policy evaluation failed',
        { request: validatedRequest, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Get policy engine statistics
   */
  async getStatistics(): Promise<PolicyStatistics> {
    const policies = Array.from(this.policies.values());
    const violations = Array.from(this.violations.values());
    const approvals = Array.from(this.approvalRequests.values());

    const policiesByCategory = policies.reduce((acc, policy) => {
      acc[policy.category] = (acc[policy.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const policiesByStatus = policies.reduce((acc, policy) => {
      acc[policy.status] = (acc[policy.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const violationsBySeverity = violations.reduce((acc, violation) => {
      acc[violation.severity] = (acc[violation.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const cacheHitRate = this.evaluationMetrics.cacheHits + this.evaluationMetrics.cacheMisses > 0 ?
      (this.evaluationMetrics.cacheHits / (this.evaluationMetrics.cacheHits + this.evaluationMetrics.cacheMisses)) * 100 : 0;

    const averageEvaluationTime = this.evaluationMetrics.evaluationsLast24h > 0 ?
      this.evaluationMetrics.totalEvaluationTime / this.evaluationMetrics.evaluationsLast24h : 0;

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

  // Private helper methods

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
      if (policy.metadata.applicableAssets.length > 0 && 
          !policy.metadata.applicableAssets.includes('*')) {
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
      if (policy.regoRules.includes('emergency_stop.override') && 
          request.action === 'emergency_stop.override') {
        return {
          decision: policy.metadata.requiredApprovals > 0 ? 'approval_required' : 'deny',
          reasoning: 'Emergency stop override requires special authorization'
        };
      }
      
      if (policy.regoRules.includes('plc_interlocks') && 
          request.context.plc_interlocks && 
          Array.isArray(request.context.plc_interlocks) &&
          request.context.plc_interlocks.some((interlock: any) => interlock.active)) {
        return {
          decision: 'deny',
          reasoning: 'PLC interlock is active - blocking action for safety'
        };
      }
      
      // Default allow for other cases
      return {
        decision: 'allow',
        reasoning: `Policy ${policy.name} evaluated successfully - no restrictions found`
      };
    } catch (error) {
      // If evaluation fails, default to deny for safety
      return {
        decision: 'deny',
        reasoning: `Policy evaluation error: ${error instanceof Error ? error.message : String(error)}`
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

  private extractConstraints(policyMatches: PolicyEvaluationResult['policyMatches']): PolicyEvaluationResult['constraints'] {
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

      logAuditEvent({
        action: 'policy_violation',
        resource: request.resource,
        outcome: 'success',
        details: {
          violationId: violation.id,
          policyId: match.policyId,
          policyName: match.policyName,
          severity: match.priority,
          userId: request.subject.userId,
        },
        severity: 'high',
      });
    }
  }
}