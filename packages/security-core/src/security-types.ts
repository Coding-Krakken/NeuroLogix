/**
 * Core security types for service authentication, mTLS, and audit logging
 * Phase 7 Foundation: Security and Compliance Hardening (Issue #57)
 */

/**
 * Service identity representation for authentication
 */
export interface ServiceIdentity {
  /** Unique service identifier (e.g., 'policy-engine', 'core-adapter') */
  serviceId: string;
  /** Service instance identifier for multi-instance scenarios */
  instanceId?: string;
  /** Tenant context if applicable */
  tenantId?: string;
}

/**
 * Certificate metadata and management
 */
export interface CertificateMetadata {
  /** Certificate fingerprint (SHA256) */
  fingerprint: string;
  /** Certificate issuance timestamp */
  issuedAt: Date;
  /** Certificate expiration timestamp */
  expiresAt: Date;
  /** Service this certificate belongs to */
  serviceId: string;
  /** Whether this certificate is currently active */
  isActive: boolean;
}

/**
 * mTLS connection context
 */
export interface MTLSContext {
  /** Client service identity from certificate */
  client: ServiceIdentity;
  /** Server service identity */
  server: ServiceIdentity;
  /** Client certificate metadata */
  clientCertificate: CertificateMetadata;
  /** Connection establishment timestamp */
  connectedAt: Date;
  /** Whether connection is authenticated */
  authenticated: boolean;
}

/**
 * Authentication result from service request
 */
export interface AuthenticationResult {
  /** Whether authentication succeeded */
  success: boolean;
  /** Authenticated service identity (if success) */
  identity?: ServiceIdentity;
  /** Authentication error reason (if failed) */
  error?: string;
  /** Timestamp of authentication attempt */
  timestamp: Date;
  /** Authentication method used */
  method: 'mtls' | 'service-token' | 'api-key';
}

/**
 * Audit event for immutable logging
 */
export interface AuditEvent {
  /** Unique event identifier */
  eventId: string;
  /** Event type: 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'CERT_ISSUED' | 'CERT_REVOKED' | 'POLICY_ENFORCED' */
  eventType: string;
  /** Service that initiated or was subject of event */
  service: ServiceIdentity;
  /** Target service (for inter-service operations) */
  targetService?: ServiceIdentity;
  /** Event outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED' */
  outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  /** Event description */
  description: string;
  /** Associated metadata (request context, policy decision, etc.) */
  metadata?: Record<string, unknown>;
  /** Timestamp of event occurrence (UTC) */
  timestamp: Date;
  /** Tenant context (if applicable) */
  tenantId?: string;
  /** Whether event is immutable once logged */
  immutable: boolean;
}

/**
 * Service authentication policy configuration
 */
export interface AuthenticationPolicy {
  /** Service this policy applies to */
  serviceId: string;
  /** Whether mTLS is required for this service */
  requireMTLS: boolean;
  /** Default privilege level if not specified */
  defaultPrivilege: 'read-only' | 'read-write' | 'admin';
  /** List of services allowed to call this service (empty = all) */
  allowedCallers?: string[];
  /** Whether to audit all requests */
  auditAllRequests: boolean;
  /** Certificate rotation period in days */
  certRotationDays: number;
}

/**
 * Certificate rotation status
 */
export interface CertificateRotationStatus {
  /** Service identifier */
  serviceId: string;
  /** Current certificate fingerprint */
  currentFingerprint: string;
  /** Previous certificate fingerprint (if rotation occurred) */
  previousFingerprint?: string;
  /** Next scheduled rotation date */
  nextRotationAt: Date;
  /** Last rotation date */
  lastRotationAt: Date;
  /** Rotation status: 'active' | 'rotating' | 'error' */
  status: 'active' | 'rotating' | 'error';
}

/**
 * Request authentication context for middleware
 */
export interface RequestAuthContext {
  /** Service making the request */
  caller: ServiceIdentity;
  /** Target resource or service */
  target: string;
  /** Operation type (read, write, admin) */
  operation: 'read' | 'write' | 'admin';
  /** Whether request passed authentication */
  authenticated: boolean;
  /** Whether request passed authorization */
  authorized: boolean;
  /** Reason for denial (if not authorized) */
  denialReason?: string;
}

/**
 * Security configuration for a service
 */
export interface SecurityConfig {
  /** Service identifier */
  serviceId: string;
  /** Path to service certificate file */
  certPath: string;
  /** Path to service private key file */
  keyPath: string;
  /** Path to trusted CA certificate file */
  caPath: string;
  /** mTLS configuration */
  mtls: {
    enabled: boolean;
    requireClientCert: boolean;
    allowedCipherSuites?: string[];
  };
  /** Audit logging configuration */
  audit: {
    enabled: boolean;
    storePath: string;
    encryptionKeyPath?: string;
  };
  /** Authentication policy for this service */
  authPolicy: AuthenticationPolicy;
}
