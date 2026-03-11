/**
 * @neurologix/security-core - Core security utilities for Phase 7 foundation
 * Service-to-service mTLS, authentication, and immutable audit logging
 */

export * from './security-types';
export { CertificateManager, createCertificateManager } from './certificate-manager';
export { ServiceAuthenticator, createServiceAuthenticator } from './service-auth';
export { AuditLogger, createAuditLogger } from './audit-logger';
export { OPAAuthorizer, createOPAAuthorizer } from './opa-authorizer';
