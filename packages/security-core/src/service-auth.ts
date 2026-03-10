/**
 * Service-to-service authentication enforcement
 * Handles authentication validation and least-privilege enforcement
 */

import {
  ServiceIdentity,
  AuthenticationResult,
  AuthenticationPolicy,
  RequestAuthContext,
} from './security-types';

/**
 * Service authenticator for enforcing service-to-service authentication
 */
export class ServiceAuthenticator {
  private policies: Map<string, AuthenticationPolicy> = new Map();
  private trustedServices: Set<string> = new Set();

  /**
   * Register an authentication policy for a service
   * @param policy Authentication policy
   */
  registerPolicy(policy: AuthenticationPolicy): void {
    this.policies.set(policy.serviceId, policy);
  }

  /**
   * Register a trusted service
   * @param serviceId Service identifier to trust
   */
  trustService(serviceId: string): void {
    this.trustedServices.add(serviceId);
  }

  /**
   * Authenticate a service request
   * @param caller Service making the request
   * @param target Target service/resource
   * @param method Authentication method used
   * @returns Authentication result
   */
  authenticateRequest(
    caller: ServiceIdentity,
    target: string,
    method: 'mtls' | 'service-token' | 'api-key',
  ): AuthenticationResult {
    const timestamp = new Date();

    // Check if caller service is trusted
    if (!this.trustedServices.has(caller.serviceId)) {
      return {
        success: false,
        error: `Service ${caller.serviceId} is not trusted`,
        timestamp,
        method,
      };
    }

    // Get target policy
    const policy = this.policies.get(target);
    if (!policy) {
      return {
        success: false,
        error: `No authentication policy found for target: ${target}`,
        timestamp,
        method,
      };
    }

    // Check mTLS requirement
    if (policy.requireMTLS && method !== 'mtls') {
      return {
        success: false,
        error: `Service ${target} requires mTLS authentication`,
        timestamp,
        method,
      };
    }

    // Check caller is in allowlist if specified
    if (policy.allowedCallers && !policy.allowedCallers.includes(caller.serviceId)) {
      return {
        success: false,
        error: `Service ${caller.serviceId} is not allowed to call ${target}`,
        timestamp,
        method,
      };
    }

    return {
      success: true,
      identity: caller,
      timestamp,
      method,
    };
  }

  /**
   * Authorize a request based on service privileges
   * @param context Request authentication context
   * @returns Authorization decision with reason if denied
   */
  authorizeRequest(context: RequestAuthContext): { authorized: boolean; reason?: string } {
    if (!context.authenticated) {
      return { authorized: false, reason: 'Request not authenticated' };
    }

    const policy = this.policies.get(context.target);
    if (!policy) {
      return { authorized: false, reason: `No policy for target: ${context.target}` };
    }

    // Check operation privilege
    const callerPrivilege = policy.defaultPrivilege;

    switch (context.operation) {
      case 'read':
        // All privileges can read
        return { authorized: true };

      case 'write':
        // Only read-write and admin can write
        if (callerPrivilege === 'read-only') {
          return {
            authorized: false,
            reason: `Service ${context.caller.serviceId} has read-only privilege`,
          };
        }
        return { authorized: true };

      case 'admin':
        // Only admin can perform admin operations
        if (callerPrivilege !== 'admin') {
          return {
            authorized: false,
            reason: `Service ${context.caller.serviceId} does not have admin privilege`,
          };
        }
        return { authorized: true };

      default:
        return { authorized: false, reason: `Unknown operation: ${context.operation}` };
    }
  }

  /**
   * Get policy for a service
   * @param serviceId Service identifier
   * @returns Authentication policy or undefined
   */
  getPolicy(serviceId: string): AuthenticationPolicy | undefined {
    return this.policies.get(serviceId);
  }

  /**
   * Check if a service is trusted
   * @param serviceId Service identifier
   * @returns Whether service is trusted
   */
  isTrusted(serviceId: string): boolean {
    return this.trustedServices.has(serviceId);
  }

  /**
   * Set up default least-privilege configuration for a service
   * @param serviceId Service identifier
   */
  setupDefaultPolicy(serviceId: string): AuthenticationPolicy {
    const policy: AuthenticationPolicy = {
      serviceId,
      requireMTLS: true,
      defaultPrivilege: 'read-only', // Least-privilege default
      auditAllRequests: true,
      certRotationDays: 90,
    };

    this.registerPolicy(policy);
    return policy;
  }
}

/**
 * Create a service authenticator instance
 */
export function createServiceAuthenticator(): ServiceAuthenticator {
  return new ServiceAuthenticator();
}
