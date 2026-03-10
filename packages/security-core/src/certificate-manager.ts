/**
 * Certificate management utilities for mTLS
 * Handles certificate loading, validation, and lifecycle tracking
 */

import crypto from 'crypto';
import { CertificateMetadata, CertificateRotationStatus } from './security-types';

/**
 * Certificate manager for handling mTLS certificates
 */
export class CertificateManager {
  private certificates: Map<string, CertificateMetadata> = new Map();
  private rotationStatus: Map<string, CertificateRotationStatus> = new Map();

  /**
   * Load and validate a service certificate
   * @param serviceId Service identifier
   * @param certPem Certificate in PEM format
   * @returns Certificate metadata if valid
   */
  loadCertificate(serviceId: string, certPem: string): CertificateMetadata {
    // Parse certificate and extract metadata
    const fingerprint = this.calculateFingerprint(certPem);
    const { issuedAt, expiresAt } = this.parseCertificateDates(certPem);

    const metadata: CertificateMetadata = {
      fingerprint,
      issuedAt,
      expiresAt,
      serviceId,
      isActive: true,
    };

    this.certificates.set(serviceId, metadata);

    // Initialize rotation status if not exists
    if (!this.rotationStatus.has(serviceId)) {
      this.rotationStatus.set(serviceId, {
        serviceId,
        currentFingerprint: fingerprint,
        lastRotationAt: issuedAt,
        nextRotationAt: this.calculateNextRotationDate(issuedAt, 90), // Default 90-day rotation
        status: 'active',
      });
    }

    return metadata;
  }

  /**
   * Validate a certificate against stored metadata
   * @param serviceId Service identifier
   * @param certPem Certificate in PEM format
   * @returns Whether certificate is valid and matches stored metadata
   */
  validateCertificate(serviceId: string, certPem: string): boolean {
    const stored = this.certificates.get(serviceId);
    if (!stored) return false;

    const fingerprint = this.calculateFingerprint(certPem);
    if (fingerprint !== stored.fingerprint) return false;

    // Check if certificate is expired
    const now = new Date();
    if (now > stored.expiresAt) return false;

    return stored.isActive;
  }

  /**
   * Get certificate metadata for a service
   * @param serviceId Service identifier
   * @returns Certificate metadata or undefined
   */
  getCertificate(serviceId: string): CertificateMetadata | undefined {
    return this.certificates.get(serviceId);
  }

  /**
   * Check if certificate is expiring soon
   * @param serviceId Service identifier
   * @param daysWarning Number of days before expiration to warn
   * @returns Whether certificate is expiring within warning period
   */
  isExpiringSoon(serviceId: string, daysWarning: number = 30): boolean {
    const cert = this.certificates.get(serviceId);
    if (!cert) return false;

    const now = new Date();
    const warningDate = new Date(now.getTime() + daysWarning * 24 * 60 * 60 * 1000);
    return cert.expiresAt <= warningDate;
  }

  /**
   * Record a certificate rotation event
   * @param serviceId Service identifier
   * @param newCertPem New certificate in PEM format
   * @returns Updated rotation status
   */
  rotateCertificate(serviceId: string, newCertPem: string): CertificateRotationStatus {
    const current = this.certificates.get(serviceId);
    const newMetadata = this.loadCertificate(serviceId, newCertPem);

    const status = this.rotationStatus.get(serviceId);
    if (!status) {
      throw new Error(`No rotation status found for service: ${serviceId}`);
    }

    status.previousFingerprint = status.currentFingerprint;
    status.currentFingerprint = newMetadata.fingerprint;
    status.lastRotationAt = new Date();
    status.nextRotationAt = this.calculateNextRotationDate(
      newMetadata.issuedAt,
      90, // Default 90-day rotation cycle
    );
    status.status = 'active';

    // Mark old certificate as inactive if it exists
    if (current) {
      current.isActive = false;
    }

    return status;
  }

  /**
   * Get rotation status for a service
   * @param serviceId Service identifier
   * @returns Rotation status or undefined
   */
  getRotationStatus(serviceId: string): CertificateRotationStatus | undefined {
    return this.rotationStatus.get(serviceId);
  }

  /**
   * Calculate certificate fingerprint
   * @param certPem Certificate in PEM format
   * @returns SHA256 fingerprint (hex string)
   */
  private calculateFingerprint(certPem: string): string {
    // Remove PEM headers and newlines, then calculate SHA256
    const certDer = Buffer.from(
      certPem
        .replace(/-----BEGIN CERTIFICATE-----/, '')
        .replace(/-----END CERTIFICATE-----/, '')
        .replace(/\n/g, ''),
      'base64',
    );
    return crypto.createHash('sha256').update(certDer).digest('hex');
  }

  /**
   * Parse certificate issuance and expiration dates (placeholder)
   * In production, would use a proper certificate parsing library
   */
  private parseCertificateDates(certPem: string): { issuedAt: Date; expiresAt: Date } {
    // Placeholder: In production, parse with crypto.X509Certificate or similar
    // For now, return predictable test values
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year

    return { issuedAt, expiresAt };
  }

  /**
   * Calculate next rotation date
   */
  private calculateNextRotationDate(issuedAt: Date, rotationDays: number): Date {
    return new Date(issuedAt.getTime() + rotationDays * 24 * 60 * 60 * 1000);
  }
}

/**
 * Create a certificate manager instance
 */
export function createCertificateManager(): CertificateManager {
  return new CertificateManager();
}
