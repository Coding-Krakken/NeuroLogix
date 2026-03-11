import {
  AuditChainEntry,
  AuditIntegrityReport,
  AuditQueryCriteria,
  OPAAuthorizationInput,
  OPAAuthorizationResult,
  OPAAuthorizerConfig,
  AuthorizationDecision,
  ServiceIdentity,
} from './security-types';
import { AuditLogger, createAuditLogger } from './audit-logger';

const DEFAULT_POLICY_PATH = 'neurologix/authz/decision';
const DEFAULT_TIMEOUT_MS = 2000;

export class OPAAuthorizer {
  private readonly config: Required<OPAAuthorizerConfig>;
  private readonly auditLogger: AuditLogger;
  private readonly serviceIdentity: ServiceIdentity;

  constructor(config: OPAAuthorizerConfig, auditLogger: AuditLogger = createAuditLogger()) {
    this.config = {
      endpoint: config.endpoint.replace(/\/+$/, ''),
      policyPath: (config.policyPath ?? DEFAULT_POLICY_PATH).replace(/^\/+/, ''),
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      serviceId: config.serviceId ?? 'policy-engine',
    };
    this.auditLogger = auditLogger;
    this.serviceIdentity = { serviceId: this.config.serviceId };
  }

  async authorize(input: OPAAuthorizationInput): Promise<OPAAuthorizationResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.config.endpoint}/v1/data/${this.config.policyPath}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ input: this.normalizeInput(input) }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`OPA request failed with status ${response.status}`);
      }

      const payload = await response.json();
      const parsedDecision = this.parseDecision(payload);

      this.auditLogger.logPolicyEnforced(
        this.serviceIdentity,
        `opa:${this.config.policyPath}`,
        parsedDecision.decision !== 'allow'
      );

      return {
        decision: parsedDecision.decision,
        reason: parsedDecision.reason,
        policyPath: this.config.policyPath,
        evaluatedAt: new Date(),
        rawResult: payload,
      };
    } catch (error) {
      this.auditLogger.logEvent({
        eventType: 'AUTHZ_EVALUATION',
        service: this.serviceIdentity,
        outcome: 'FAILURE',
        description: `OPA authorizer evaluation failed for ${this.config.policyPath}`,
        metadata: {
          endpoint: this.config.endpoint,
          policyPath: this.config.policyPath,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw new Error(
        `OPA authorizer request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  getAuditTrail(criteria: AuditQueryCriteria = {}): AuditChainEntry[] {
    return this.auditLogger.queryEntries(criteria);
  }

  verifyAuditTrail(): AuditIntegrityReport {
    return this.auditLogger.getIntegrityReport();
  }

  private normalizeInput(input: OPAAuthorizationInput): Omit<OPAAuthorizationInput, 'timestamp'> & {
    timestamp: string;
  } {
    return {
      ...input,
      timestamp: input.timestamp instanceof Date ? input.timestamp.toISOString() : input.timestamp,
    };
  }

  private parseDecision(payload: unknown): { decision: AuthorizationDecision; reason: string } {
    const result = this.extractResult(payload);

    if (typeof result === 'string' && this.isDecision(result)) {
      return {
        decision: result,
        reason: 'OPA returned direct decision value',
      };
    }

    if (typeof result === 'boolean') {
      return {
        decision: result ? 'allow' : 'deny',
        reason: 'OPA returned boolean allow result',
      };
    }

    if (this.isRecord(result)) {
      if (this.isDecision(result.decision)) {
        return {
          decision: result.decision,
          reason:
            typeof result.reason === 'string'
              ? result.reason
              : 'OPA returned decision object without reason',
        };
      }

      if (typeof result.allow === 'boolean') {
        return {
          decision: result.allow ? 'allow' : 'deny',
          reason:
            typeof result.reason === 'string'
              ? result.reason
              : 'OPA returned allow boolean inside result object',
        };
      }
    }

    throw new Error('OPA response does not contain a supported authorization decision shape');
  }

  private extractResult(payload: unknown): unknown {
    if (!this.isRecord(payload) || !('result' in payload)) {
      throw new Error('OPA response payload is missing top-level result field');
    }

    return payload.result;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private isDecision(value: unknown): value is AuthorizationDecision {
    return value === 'allow' || value === 'deny' || value === 'approval_required';
  }
}

export function createOPAAuthorizer(config: OPAAuthorizerConfig): OPAAuthorizer {
  return new OPAAuthorizer(config);
}
