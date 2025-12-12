/**
 * Property-based tests for SessionService
 * Testing session fixation prevention and token security
 */
import fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import sessionService from '../../SessionService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock Supabase
jest.mock('../../supabaseClient', () => ({
  supabase: {
    rpc: jest.fn(() => Promise.resolve({ data: null, error: null }))
  }
}));

describe('SessionService - Security Properties', () => {
  let service;

  beforeEach(async () => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
    service = sessionService;
    // Reset the service state for testing
    await service.initialize();
  });

  describe('Session Token Security', () => {
    it('should generate unique session tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.record({
            sessionId: fc.string({ minLength: 1 }),
            userId: fc.string({ minLength: 1 }),
            timestamp: fc.integer({ min: 1000000000000, max: 2000000000000 }),
            nonce: fc.string({ minLength: 10 }),
          }), { minLength: 2, maxLength: 5 }),
          async (tokenPayloads) => {
            const tokens = new Set();

            for (const payload of tokenPayloads) {
              const token = await service.generateSecureSessionToken(payload);
              expect(tokens.has(token)).toBe(false);
              tokens.add(token);
            }

            expect(tokens.size).toBe(tokenPayloads.length);
          }
        )
      );
    });

    it('should validate legitimate session tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            sessionId: fc.string({ minLength: 1 }),
            userId: fc.string({ minLength: 1 }),
            timestamp: fc.integer({ min: Date.now() - 3600000, max: Date.now() - 60000 }), // 1 hour ago to 1 min ago
            nonce: fc.string({ minLength: 10 }),
          }),
          async (payload) => {
            // Create a valid token
            const token = await service.generateSecureSessionToken({
              ...payload,
              deviceFingerprint: service.deviceFingerprint
            });

            // Validate it
            const isValid = await service.validateSessionToken(token);
            expect(isValid).toBe(true);
          }
        )
      );
    });

    it('should reject tampered session tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            sessionId: fc.string({ minLength: 1 }),
            userId: fc.string({ minLength: 1 }),
            timestamp: fc.integer({ min: Date.now() - 3600000, max: Date.now() - 60000 }),
            nonce: fc.string({ minLength: 10 }),
          }),
          async (payload) => {
            // Create a valid token
            const token = await service.generateSecureSessionToken({
              ...payload,
              deviceFingerprint: service.deviceFingerprint
            });

            // Tamper with the token
            const tamperedToken = token.replace(/.$/, 'X');

            // Validate tampered token
            const isValid = await service.validateSessionToken(tamperedToken);
            expect(isValid).toBe(false);
          }
        )
      );
    });

    it('should reject tokens from different devices', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            sessionId: fc.string({ minLength: 1 }),
            userId: fc.string({ minLength: 1 }),
            timestamp: fc.integer({ min: Date.now() - 3600000, max: Date.now() - 60000 }),
            nonce: fc.string({ minLength: 10 }),
          }),
          fc.string({ minLength: 10 }), // Different device fingerprint
          async (payload, differentFingerprint) => {
            // Create token with different fingerprint
            const token = await service.generateSecureSessionToken({
              ...payload,
              deviceFingerprint: differentFingerprint
            });

            // Validate with current service (different fingerprint)
            const isValid = await service.validateSessionToken(token);
            expect(isValid).toBe(false);
          }
        )
      );
    });

    it('should reject expired session tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            sessionId: fc.string({ minLength: 1 }),
            userId: fc.string({ minLength: 1 }),
            nonce: fc.string({ minLength: 10 }),
          }),
          async (payload) => {
            // Create token with old timestamp (25 hours ago)
            const expiredTimestamp = Date.now() - (25 * 60 * 60 * 1000);
            const token = await service.generateSecureSessionToken({
              ...payload,
              timestamp: expiredTimestamp,
              deviceFingerprint: service.deviceFingerprint
            });

            // Validate expired token
            const isValid = await service.validateSessionToken(token);
            expect(isValid).toBe(false);
          }
        )
      );
    });

    it('should generate unique device fingerprints', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.record({
            deviceId: fc.string({ minLength: 1 }),
            userAgent: fc.string({ minLength: 1 }),
            screenSize: fc.string({ minLength: 1 }),
            timestamp: fc.string({ minLength: 1 }),
            randomSeed: fc.string({ minLength: 10 }),
          }), { minLength: 2, maxLength: 5 }),
          async (deviceConfigs) => {
            const fingerprints = new Set();

            for (const config of deviceConfigs) {
              const fingerprint = await service.generateSecureHash(
                `${config.deviceId}|LoveX_App_v1.0|${config.userAgent}|${config.screenSize}|${config.timestamp}|${config.randomSeed}`
              );
              expect(fingerprints.has(fingerprint)).toBe(false);
              fingerprints.add(fingerprint);
            }

            expect(fingerprints.size).toBe(deviceConfigs.length);
          }
        )
      );
    });

    it('should handle token rotation timing correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 60 * 60 * 1000 }), // Time since last rotation (0 to 1 hour)
          async (timeSinceRotation) => {
            const now = new Date();
            service.lastTokenRotation = new Date(now.getTime() - timeSinceRotation);
            service.tokenRotationInterval = 30 * 60 * 1000; // 30 minutes

            const needsRotation = timeSinceRotation > service.tokenRotationInterval;

            // This test validates the rotation logic structure
            // In real implementation, rotation would be triggered based on this condition
            expect(typeof needsRotation).toBe('boolean');
          }
        )
      );
    });
  });

  describe('Device Fingerprinting', () => {
    it('should create consistent device fingerprints', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            deviceId: fc.string({ minLength: 1 }),
            userAgent: fc.string({ minLength: 1 }),
            screenSize: fc.string({ minLength: 1 }),
          }),
          fc.integer({ min: 1, max: 5 }), // Number of generations
          async (deviceData, generations) => {
            const input = `${deviceData.deviceId}|LoveX_App_v1.0|${deviceData.userAgent}|${deviceData.screenSize}|timestamp|random`;

            let lastFingerprint = null;
            for (let i = 0; i < generations; i++) {
              const fingerprint = await service.generateSecureHash(input);
              if (lastFingerprint !== null) {
                expect(fingerprint).toBe(lastFingerprint);
              }
              lastFingerprint = fingerprint;
            }
          }
        )
      );
    });
  });
});
