/**
 * Certificate Pinning Service
 * 
 * Prevents man-in-the-middle attacks by validating SSL certificates
 * against pinned certificates.
 * 
 * **Feature: history-recovery, Property 19: Certificate Pinning Enforcement**
 * For any HTTPS connection, certificate must match pinned certificate or connection fails.
 * 
 * @module CertificatePinningService
 */

import * as Crypto from 'expo-crypto';
import { logger } from './Logger';

class CertificatePinningService {
  constructor() {
    this.pinnedCertificates = new Map();
    this.initialized = false;
  }

  /**
   * Initialize certificate pinning service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Pin Supabase certificate (example - replace with actual certificate hash)
      // In production, get this from your Supabase project's SSL certificate
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const domain = new URL(supabaseUrl).hostname;
      
      // NOTE: This is a placeholder. In production, you need to:
      // 1. Extract the actual certificate from your Supabase project
      // 2. Calculate its SHA-256 hash
      // 3. Store it securely
      this.pinnedCertificates.set(domain, {
        // Example hash - REPLACE WITH ACTUAL CERTIFICATE HASH
        sha256: 'PLACEHOLDER_CERTIFICATE_HASH_REPLACE_IN_PRODUCTION',
        validUntil: new Date('2026-12-31'), // Certificate expiration
      });

      this.initialized = true;
      logger.log('[CertificatePinningService] Initialized successfully');
    } catch (error) {
      logger.error('[CertificatePinningService] Initialization failed', error);
      throw error;
    }
  }

  /**
   * Pin a certificate for a domain
   * 
   * @param {string} domain - Domain to pin certificate for
   * @param {string} certificateHash - SHA-256 hash of the certificate
   * @param {Date} validUntil - Certificate expiration date
   */
  pinCertificate(domain, certificateHash, validUntil) {
    this.pinnedCertificates.set(domain, {
      sha256: certificateHash,
      validUntil: validUntil instanceof Date ? validUntil : new Date(validUntil),
    });

    logger.log(`[CertificatePinningService] Pinned certificate for ${domain}`);
  }

  /**
   * Validate certificate for a domain
   * 
   * @param {string} domain - Domain to validate
   * @param {string} certificateHash - SHA-256 hash of the presented certificate
   * @returns {Promise<boolean>} True if certificate is valid
   * @throws {Error} If certificate doesn't match or is expired
   */
  async validateCertificate(domain, certificateHash) {
    if (!this.initialized) {
      await this.initialize();
    }

    const pinnedCert = this.pinnedCertificates.get(domain);

    if (!pinnedCert) {
      // No pinned certificate for this domain - allow connection
      // In production, you might want to fail closed instead
      logger.warn(`[CertificatePinningService] No pinned certificate for ${domain}`);
      return true;
    }

    // Check if certificate is expired
    if (new Date() > pinnedCert.validUntil) {
      const error = new Error(`Certificate for ${domain} has expired`);
      logger.error('[CertificatePinningService] Certificate expired', error);
      throw error;
    }

    // Validate certificate hash
    if (certificateHash !== pinnedCert.sha256) {
      const error = new Error(`Certificate mismatch for ${domain}. Possible MITM attack!`);
      logger.error('[CertificatePinningService] Certificate mismatch', error, {
        domain,
        expected: pinnedCert.sha256.substring(0, 16) + '...',
        received: certificateHash.substring(0, 16) + '...',
      });
      throw error;
    }

    logger.log(`[CertificatePinningService] Certificate validated for ${domain}`);
    return true;
  }

  /**
   * Get certificate hash from URL
   * 
   * NOTE: React Native doesn't provide direct access to SSL certificates.
   * This is a placeholder for the concept. In production, you would:
   * 1. Use a native module to access certificate information
   * 2. Or rely on the platform's certificate validation
   * 3. Or use a proxy that validates certificates
   * 
   * @param {string} url - URL to get certificate from
   * @returns {Promise<string>} Certificate hash
   */
  async getCertificateHash(url) {
    // This is a placeholder implementation
    // In production, you need a native module to access certificate data
    
    logger.warn('[CertificatePinningService] getCertificateHash is a placeholder');
    
    // For now, return a placeholder hash
    // In production, this would extract the actual certificate
    return 'PLACEHOLDER_CERTIFICATE_HASH';
  }

  /**
   * Validate connection to URL
   * 
   * @param {string} url - URL to validate
   * @returns {Promise<boolean>} True if connection is valid
   */
  async validateConnection(url) {
    try {
      const domain = new URL(url).hostname;
      const certificateHash = await this.getCertificateHash(url);
      return await this.validateCertificate(domain, certificateHash);
    } catch (error) {
      logger.error('[CertificatePinningService] Connection validation failed', error);
      throw error;
    }
  }

  /**
   * Remove pinned certificate for domain
   * 
   * @param {string} domain - Domain to remove certificate for
   */
  unpinCertificate(domain) {
    this.pinnedCertificates.delete(domain);
    logger.log(`[CertificatePinningService] Unpinned certificate for ${domain}`);
  }

  /**
   * Get all pinned certificates
   * 
   * @returns {Map<string, object>} Map of domain to certificate info
   */
  getPinnedCertificates() {
    return new Map(this.pinnedCertificates);
  }

  /**
   * Check if certificate pinning is enabled for domain
   * 
   * @param {string} domain - Domain to check
   * @returns {boolean} True if pinning is enabled
   */
  isPinningEnabled(domain) {
    return this.pinnedCertificates.has(domain);
  }
}

// Export singleton instance
export const certificatePinningService = new CertificatePinningService();

// Export class for testing
export { CertificatePinningService };

/**
 * PRODUCTION DEPLOYMENT NOTES:
 * 
 * 1. Extract Certificate Hash:
 *    ```bash
 *    # Get certificate from server
 *    openssl s_client -connect your-supabase-url.supabase.co:443 < /dev/null | openssl x509 -outform DER > cert.der
 *    
 *    # Calculate SHA-256 hash
 *    openssl x509 -in cert.der -inform DER -pubkey -noout | openssl pkey -pubin -outform DER | openssl dgst -sha256 -binary | base64
 *    ```
 * 
 * 2. Update Pinned Certificate:
 *    Replace PLACEHOLDER_CERTIFICATE_HASH with actual hash
 * 
 * 3. Native Module (Optional):
 *    For true certificate pinning, create a native module that:
 *    - Intercepts SSL handshake
 *    - Extracts certificate
 *    - Validates against pinned hash
 * 
 * 4. Alternative Approach:
 *    Use expo-network-security or similar library for native certificate pinning
 * 
 * 5. Certificate Rotation:
 *    - Monitor certificate expiration
 *    - Update app before certificate expires
 *    - Support multiple certificates during rotation
 */
